# Windows Desktop App Security Requirements

## 1. Authentication & Credential Management

### 1.1 Token Storage Rules

```
Required:
✅ Authentication tokens → Windows Credential Manager (CredWrite/CredRead Win32 API)
✅ No plaintext storage in files/registry
✅ No token storage in app settings (AppSettings.json)
✅ No token output to logs/Event Viewer
✅ Delete the Credential Manager entry on logout (CredDelete)
✅ Manually delete the Credential Manager entry on app removal (include an uninstall script)

Alternative (when the Credential Manager is unavailable):
Encrypt with DPAPI (Data Protection API), then store under %AppData%:
var encrypted = ProtectedData.Protect(
    System.Text.Encoding.UTF8.GetBytes(token),
    entropy: null,
    scope: DataProtectionScope.CurrentUser);  // only the current Windows user can decrypt
File.WriteAllBytes(tokenPath, encrypted);
```

### 1.2 Session Management

```
Session expiration:
- Require re-authentication after more than 15 minutes of inactivity (no focus)
- Implementation: DispatcherTimer + comparison against the last activity timestamp
- MainWindow.Deactivated → start the timer, Activated → reset the timer

Token expiration handling:
- Access token: 1 hour or less (automatically refreshed on receiving 401)
- Refresh token: 30 days or less (re-login on refresh failure)
- Prevent duplicate refresh: SemaphoreSlim(1,1) (see TokenStore)
```

---

## 2. Network Security

### 2.1 Enforcing HTTPS

```csharp
// HttpClient configuration (enforce TLS 1.2+)
var handler = new HttpClientHandler
{
    SslProtocols = System.Security.Authentication.SslProtocols.Tls12
                 | System.Security.Authentication.SslProtocols.Tls13,
    CheckCertificateRevocationList = true  // OCSP/CRL check
};

// Forbidden: plaintext HTTP connections (including the development environment)
// Allowed: only the localhost development server is an exception (DEBUG builds only)
#if DEBUG
handler.ServerCertificateCustomValidationCallback = (msg, cert, chain, errors) =>
    msg.RequestUri?.Host == "localhost" || errors == System.Net.Security.SslPolicyErrors.None;
#endif
```

### 2.2 Certificate Pinning (optional)

```csharp
// Recommended for high-risk apps (finance/healthcare)
var handler = new HttpClientHandler();
handler.ServerCertificateCustomValidationCallback = (message, cert, chain, errors) =>
{
    if (errors != System.Net.Security.SslPolicyErrors.None) return false;

    // Pin the public key hash (more flexible for certificate renewal)
    var pubKeyHash = Convert.ToBase64String(
        System.Security.Cryptography.SHA256.HashData(cert!.GetPublicKey()));

    var pinnedHashes = new[] {
        "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",  // production certificate
        "BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB="   // backup pin (required — swap on renewal without an app update)
    };
    return pinnedHashes.Contains(pubKeyHash);
};
// Note: without a backup pin, the app cannot connect when the certificate is renewed → keep at least 2 backup pins
```

### 2.3 Logging Security

```csharp
// Release build logging rules
// - When using Serilog/NLog, remove Debug/Verbose levels in release
// - File logs: %LocalAppData%\{App}\Logs\ (exclude sensitive data)

// NLog.config release configuration example:
// <rules>
//   <logger name="*" minlevel="Warning" writeTo="file"/>  <!-- remove Debug/Info -->
// </rules>

// Forbidden patterns
logger.Debug($"Token: {accessToken}");  // ❌ absolutely forbidden
logger.Debug($"User: {user.Email}");    // ❌ no PII logging
logger.Warning("Token refresh failed"); // ✅ record only the event
```

---

## 3. Data Security

### 3.1 Sensitive Data Classification

| Level | Data examples | Storage location | Encryption |
|------|-----------|---------|--------|
| P0 | Authentication tokens, passwords | Windows Credential Manager | OS keyring |
| P1 | National ID, card number | DPAPI-encrypted file | AES-256 (CurrentUser) |
| P2 | Name, email, phone number | SQLite (plain) | File system ACL |
| P3 | Order history, settings, cache | SQLite / AppData | OS user isolation |
| P4 | Anonymous analytics, logs | Local file | Not required |

### 3.2 SQLite File Security

```csharp
// SQLite database encryption (SQLCipher — when P1 data is included)
// NuGet: SQLitePCLRaw.bundle_sqlcipher
var connString = $"Data Source={dbPath};Password={GetDbKey()}";

// DB key derivation (DPAPI-based)
private static string GetDbKey()
{
    var keyPath = Path.Combine(AppDataDir, ".dbkey");
    if (!File.Exists(keyPath))
    {
        // First run: generate a random key + store DPAPI-encrypted
        var rawKey = System.Security.Cryptography.RandomNumberGenerator.GetBytes(32);
        var encrypted = ProtectedData.Protect(rawKey, null, DataProtectionScope.CurrentUser);
        File.WriteAllBytes(keyPath, encrypted);
    }
    var encryptedKey = File.ReadAllBytes(keyPath);
    var key = ProtectedData.Unprotect(encryptedKey, null, DataProtectionScope.CurrentUser);
    return Convert.ToHexString(key);
}

// For a typical app with only P0/P1 data: SQLCipher can be omitted
// → %LocalAppData% files are accessible only to the current Windows user (default ACL applied)
```

### 3.3 Memory Security

```csharp
// Password fields: clear immediately after use
// WPF PasswordBox: use SecureString (minimize conversion to plaintext string)
var securePass = passwordBox.SecurePassword;  // use SecureString directly

// When string conversion is unavoidable:
var ptr = Marshal.SecureStringToGlobalAllocUnicode(securePass);
try { var password = Marshal.PtrToStringUni(ptr)!; /* shortest possible use */ }
finally { Marshal.ZeroFreeGlobalAllocUnicode(ptr); }  // wipe memory immediately

// Screenshot prevention (finance/healthcare apps)
// WinUI 3:
window.ExtendsContentIntoTitleBar = true;
// ... set WDA_MONITOR via InputNonClientPointerSource

// WPF:
[DllImport("user32.dll", SetLastError = true)]
static extern uint SetWindowDisplayAffinity(IntPtr hwnd, uint affinity);
const uint WDA_MONITOR = 0x00000001;  // block screen capture

var hwnd = new WindowInteropHelper(mainWindow).Handle;
SetWindowDisplayAffinity(hwnd, WDA_MONITOR);
```

---

## 4. Code & Build Security

### 4.1 API Key Management

```
Forbidden:
❌ Hardcoding in source: const string API_KEY = "secret"
❌ Plaintext storage in appsettings.json (can be committed to Git)
❌ Committing .env files

Allowed:
✅ Per-user settings: Windows Credential Manager
✅ Injection at build time: MSBuild environment variables → #if RELEASE conditional compilation
✅ Runtime server request: via a Secrets Manager API
```

```csharp
// appsettings.Development.json (add to gitignore) — development environment API key
{
    "ApiSettings": { "BaseUrl": "http://localhost:3000/api" }
}

// Example of injecting environment variables during the .csproj build
<PropertyGroup Condition="'$(Configuration)' == 'Release'">
    <DefineConstants>PRODUCTION</DefineConstants>
</PropertyGroup>

// In code
#if PRODUCTION
    private const string ApiBase = "https://api.production.com";
#else
    private const string ApiBase = "http://localhost:3000";
#endif
```

### 4.2 Code Signing & Integrity

```
Required before distribution:
☐ Code-sign the executables (.exe/.dll) (Authenticode)
  - An EV (Extended Validation) certificate is recommended (immediately trusted by SmartScreen)
  - A standard OV may show warnings until reputation accrues

Signing command:
signtool sign /fd sha256 /tr http://timestamp.digicert.com /td sha256
              /f certificate.pfx /p {password} MyApp.exe

MSIX package signing:
SignTool sign /fd SHA256 /a /f cert.pfx /p pass MyApp.msix

☐ Package integrity: MSIX has built-in hash verification
☐ Chain trust: the entire certificate chain connects up to a trusted CA
```

### 4.3 Release Build Checklist

```
Build settings:
☐ Exclude debug symbols (.pdb) from user distribution (keep on a separate Symbol Server)
☐ Use the RELEASE build configuration (exclude DEBUG conditional code)
☐ Exclude unnecessary WinForms Designer DLLs

Code:
☐ Verify Debug.WriteLine / Console.WriteLine produce no output in release
☐ Verify development API endpoints → production endpoints
☐ Disable Swagger/dev tool UI
☐ No test accounts/dummy data

Packages:
☐ Apply the latest security patches to NuGet packages
☐ Run dotnet list package --vulnerable to check for vulnerabilities
```

---

## 5. Using Windows Security Features

### 5.1 Windows Hello (biometric authentication)

```csharp
// Requires the Microsoft.Windows.SDK.Contracts NuGet package
using Windows.Security.Credentials.UI;

public static async Task<bool> VerifyWithWindowsHelloAsync(string message)
{
    var result = await UserConsentVerifier.RequestVerificationAsync(message);
    return result == UserConsentVerificationResult.Verified;
}

// Usage example — re-authenticate before a critical operation
if (!await VerifyWithWindowsHelloAsync("Please authenticate to proceed with the payment"))
    return; // authentication denied or failed

// Check availability (requires Windows Hello PIN/fingerprint/face enrollment)
var availability = await UserConsentVerifier.CheckAvailabilityAsync();
bool isSupported = availability == UserConsentVerifierAvailability.Available;
```

### 5.2 App Isolation (MSIX sandbox)

```
When distributing as a Microsoft Store / MSIX package:
- File system: writable only to %AppData%/LocalAppData (automatic virtualization)
- Registry: only HKCU\Software\{AppName} is accessible
- Network: only declared capabilities are allowed (Package.appxmanifest)

Required declarations in package.appxmanifest:
<Capabilities>
    <Capability Name="internetClient"/>          <!-- internet access -->
    <DeviceCapability Name="webcam"/>            <!-- camera (if needed) -->
    <DeviceCapability Name="location"/>          <!-- location (if needed) -->
</Capabilities>
```

### 5.3 UAC (User Account Control)

```xml
<!-- App that does not need admin privileges: asInvoker (default, recommended) -->
<requestedExecutionLevel level="asInvoker" uiAccess="false"/>

<!-- Only when admin privileges are required (installers, etc.) -->
<requestedExecutionLevel level="requireAdministrator" uiAccess="false"/>

<!-- Principle: least privilege. Requesting admin privileges = a UAC prompt for the user → high chance of refusal -->
```

---

## 6. Privacy & Compliance

```
Microsoft Store apps:
☐ Privacy policy URL required (registered in Partner Center + linked within the app)
☐ Declare the types of data collected
☐ Children's apps: COPPA compliance (when targeting those 12 and under)

Handling data deletion requests:
- When a user requests account deletion → delete local DB + Credential Manager + AppData data
- Remote server data deletion requires a separate API call

GDPR / Personal Information Protection Act (where applicable):
- Data export: a feature to export user data as JSON/CSV
- Confirm data deletion: confirm there is no 30-day retention after deletion
- Local data encryption: apply DPAPI/SQLCipher for P1 grade and above
```

---

**Document version:** 1.0.0 | **Date:** 2026-06-13 | **Target OS:** Windows 10 1809+ | **Compliance:** OWASP Desktop Security 2024
