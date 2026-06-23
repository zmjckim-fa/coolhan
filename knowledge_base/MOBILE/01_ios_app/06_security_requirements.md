# iOS App Security Requirements

## 1. Authentication & Authorization

### 1.1 Token Management
```
Required rules:
✅ Store auth tokens only in the Keychain (kSecAttrAccessibleWhenUnlockedThisDeviceOnly)
✅ Do not store tokens in UserDefaults, .plist, or source code
✅ Access token expiration: 1 hour or less recommended
✅ Refresh token expiration: 30 days or less
✅ Delete Keychain items on app deletion (by default they persist even after deletion → explicit deletion logic required)
✅ Delete all Keychain items on user logout
```

### 1.2 Biometric Authentication Security
```
LAPolicy choices:
.deviceOwnerAuthenticationWithBiometrics  → biometrics only (no passcode fallback)
.deviceOwnerAuthentication                → biometrics + passcode fallback

Secure token approach (recommended):
- Combine Keychain + kSecAttrAccessControl + biometryCurrentSet
- Invalidate the token when biometric data changes (require re-login)
SecAccessControlCreateWithFlags(
    nil, kSecAttrAccessibleWhenUnlockedThisDeviceOnly,
    .biometryCurrentSet, nil
)
```

### 1.3 Session Management
```
Session timeout: require re-authentication when more than 15 minutes have elapsed since entering the background
Implementation:
- appDidEnterBackground: start the timeout timer
- appWillEnterForeground: check elapsed time → show lock screen if the threshold is exceeded
- Do not reuse the LAContext instance (create a new one each time)
```

---

## 2. Network Security

### 2.1 App Transport Security (ATS)
```xml
<!-- Info.plist default: block all HTTP -->
<key>NSAppTransportSecurity</key>
<dict>
    <!-- Production: no additional settings (enforce HTTPS) -->

    <!-- Allow HTTP for specific domains only (when unavoidable) -->
    <key>NSExceptionDomains</key>
    <dict>
        <key>legacy.example.com</key>
        <dict>
            <key>NSExceptionAllowsInsecureHTTPLoads</key>
            <true/>
            <key>NSExceptionRequiresForwardSecrecy</key>
            <false/>
        </dict>
    </dict>
</dict>

Prohibited:
NSAllowsArbitraryLoads = true  → allows HTTP entirely (risk of review rejection)
```

### 2.2 Certificate Pinning (optional)
```swift
// Pin the certificate via URLSessionDelegate
func urlSession(_ session: URLSession, didReceive challenge: URLAuthenticationChallenge,
                completionHandler: @escaping (URLSession.AuthChallengeDisposition, URLCredential?) -> Void) {
    guard challenge.protectionSpace.authenticationMethod == NSURLAuthenticationMethodServerTrust,
          let serverTrust = challenge.protectionSpace.serverTrust else {
        completionHandler(.cancelAuthenticationChallenge, nil)
        return
    }
    // Compare the bundled .cer file with the server certificate
    if certificateMatches(serverTrust) {
        completionHandler(.useCredential, URLCredential(trust: serverTrust))
    } else {
        completionHandler(.cancelAuthenticationChallenge, nil)
    }
}
// Note: replacing the certificate requires an app update. Public Key Pinning is more flexible.
```

### 2.3 Request/Response Security
```
Required:
✅ HTTPS only (TLS 1.2+)
✅ Do not log the Authorization header
✅ Mask sensitive data (passwords, card numbers) before logging, even from the request body
✅ Do not hardcode API keys in the app bundle → route through a server-side gateway or use environment variables (injected at build time)
```

---

## 3. Data Security

### 3.1 Sensitive Data Classification
| Grade | Data examples | Storage location | Encryption |
|------|------------|---------|--------|
| P0 (highest) | Auth tokens, passwords, biometric keys | Keychain | OS automatic (Secure Enclave) |
| P1 (high) | Personally identifiable information (name/phone/address) | Core Data + file encryption | App-level AES-256 |
| P2 (medium) | User content, settings | Core Data / UserDefaults | OS file protection |
| P3 (low) | Cache, analytics data | Caches/ | Not required |

### 3.2 File Protection Level (Data Protection)
```swift
// Apply file protection to the Core Data persistent store
let options: [AnyHashable: Any] = [
    NSPersistentStoreFileProtectionKey: FileProtectionType.complete
    // .complete: inaccessible while the device is locked (strongest)
    // .completeUnlessOpen: already-open files remain accessible while locked
    // .completeUntilFirstUserAuthentication: protected only until the first unlock after boot
]

// Regular files
try data.write(to: url, options: [.completeFileProtection])
```

### 3.3 Memory Security
```
Required:
✅ After password/PIN entry, set UITextField.text = "" (remove from memory immediately)
✅ Screenshot prevention: show a screenshot overlay when entering the background
```

```swift
// Background screenshot prevention pattern
func applicationWillResignActive(_ application: UIApplication) {
    let overlay = UIView(frame: window.bounds)
    overlay.backgroundColor = .systemBackground
    overlay.tag = 9999
    window.addSubview(overlay)
}
func applicationDidBecomeActive(_ application: UIApplication) {
    window.viewWithTag(9999)?.removeFromSuperview()
}
```

---

## 4. Code & Build Security

### 4.1 API Key Management
```
Prohibited:
❌ Hardcoding in source: let apiKey = "sk-abc123"
❌ Plaintext storage in .plist (reverse-engineerable)
❌ Including secrets in Git commits

Allowed:
✅ Xcode Build Configuration + xcconfig files
✅ Injecting environment variables at build time (CI/CD)
✅ Runtime server requests (via a Secrets Manager)
✅ Obfuscation tools (minor protection, not a fundamental solution)
```

### 4.2 Jailbreak / Rooting Detection
```swift
func isJailbroken() -> Bool {
    #if targetEnvironment(simulator)
    return false
    #else
    let paths = ["/Applications/Cydia.app", "/usr/sbin/sshd",
                 "/bin/bash", "/etc/apt", "/private/var/lib/apt/"]
    return paths.contains { FileManager.default.fileExists(atPath: $0) }
    #endif
}
// On detection: terminate the app or enter restricted mode (important for finance/medical apps)
// Note: perfect detection is impossible. Use only as one layer of defense in depth.
```

### 4.3 Code Signing & Integrity
```
Distribution checklist:
✅ Build with a Distribution certificate (Development certificate prohibited)
✅ Bitcode disabled (Xcode 14+ default)
✅ Strip Debug Symbols: YES (Release)
✅ Enable Hardened Runtime (for macOS distribution)
✅ Validate App: YES (run Xcode Validate before App Store submission)
```

---

## 5. Privacy & App Store Compliance

### 5.1 Privacy Nutrition Labels (required)
```
Data types that must be declared in App Store Connect:
Collected data → purpose of use → choose whether it's tracking

Example declarations:
- Name, email: app functionality → not tracking
- Payment information: app functionality + payment processing → not tracking
- Location: app functionality → not tracking
- Device ID: analytics → ATT consent required if tracking is selected
```

### 5.2 App Tracking Transparency (ATT)
```swift
import AppTrackingTransparency
// Required for iOS 14.5+ (when doing ad tracking)
ATTrackingManager.requestTrackingAuthorization { status in
    switch status {
    case .authorized: // tracking allowed
    case .denied, .restricted, .notDetermined: // tracking prohibited
    @unknown default: break
    }
}
// Info.plist: NSUserTrackingUsageDescription (purpose description required)
// Request after the first interaction following app launch (immediate request risks review rejection)
```

### 5.3 Permission Request Guidelines
```
Principle: request when needed, with context

✅ Correct request timing:
  - Camera: when the profile photo change button is tapped
  - Location: when the delivery address confirmation button is tapped
  - Notifications: when asking "Receive shipping notifications?" at order completion

❌ Incorrect request timing:
  - Requesting all permissions at once immediately at app start
  - A popup with no context of feature usage

When a permission is denied: provide custom UI guiding the user to the Settings app
```

---

## 6. Vulnerability Checklist (before distribution)

```
Authentication:
☐ Tokens are stored only in the Keychain
☐ Automatic logout (15-minute timeout) works
☐ No root/unauthorized API endpoints

Network:
☐ No ATS disabling (NSAllowsArbitraryLoads)
☐ All API communication is HTTPS
☐ Authorization header is not logged

Data:
☐ No sensitive data in UserDefaults
☐ No PII (personally identifiable information) in logs
☐ Background screenshot protection works

Code:
☐ No API keys in source code
☐ Debug symbols stripped in the Release build
☐ No test/dummy account credentials
```

---

**Document version:** 1.0.0 | **Date:** 2026-06-13 | **Target OS:** iOS 15+ | **Compliance:** OWASP Mobile Top 10 2024
