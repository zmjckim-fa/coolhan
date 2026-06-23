# Android App Security Requirements

## 1. Authentication & Credential Management

### 1.1 Token Storage Rules
```
Required:
✅ Auth tokens → EncryptedSharedPreferences (Android Keystore AES256 based)
✅ No plaintext storage in SharedPreferences
✅ No plaintext file storage in internal storage (reverse-engineerable)
✅ No token output in app logs (Logcat)
✅ Clear all EncryptedSharedPreferences on logout
✅ EncryptedSharedPreferences auto-deleted on app uninstall (guaranteed by Android OS)

EncryptedSharedPreferences configuration:
MasterKey: AES256_GCM
Key encryption: AES256_SIV
Value encryption: AES256_GCM
Hardware-backed key storage (StrongBox where supported by the device)
```

### 1.2 Session Management
```
Session expiry:
- Require re-authentication after more than 15 minutes in the background
- Implementation: App lifecycle observer + timestamp comparison
- Session can be retained while a ForegroundService is running

Token expiry handling:
- Access token: 1 hour or less (auto-refresh on receiving 401)
- Refresh token: 30 days or less (re-login on refresh failure)
- Prevent duplicate refresh: Mutex lock (see TokenManager)
```

---

## 2. Network Security

### 2.1 Network Security Configuration
```xml
<!-- res/xml/network_security_config.xml -->
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <!-- Production: enforce HTTPS, trust only system CAs -->
    <base-config cleartextTrafficPermitted="false">
        <trust-anchors>
            <certificates src="system"/>
        </trust-anchors>
    </base-config>

    <!-- Development environment only: trust user CAs (debug build) -->
    <debug-overrides>
        <trust-anchors>
            <certificates src="system"/>
            <certificates src="user"/>
        </trust-anchors>
    </debug-overrides>

    <!-- Per-domain exceptions (only when unavoidable) -->
    <!-- Never set cleartextTrafficPermitted="true" globally -->
</network-security-config>

<!-- AndroidManifest.xml -->
<application
    android:networkSecurityConfig="@xml/network_security_config"
    ...>
```

### 2.2 Certificate Pinning (optional)
```kotlin
// OkHttp CertificatePinner
val certificatePinner = CertificatePinner.Builder()
    .add("api.example.com", "sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=")
    .add("api.example.com", "sha256/BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB=") // backup pin
    .build()

OkHttpClient.Builder().certificatePinner(certificatePinner).build()

// Caution:
// - App update required when rotating certificates (keep 2+ backup pins)
// - Public Key Pinning is more flexible for certificate rotation
// - Recommended for finance/healthcare apps; NSC is sufficient for general apps
```

### 2.3 Removing Logging with ProGuard
```proguard
# Release build: strip logs
-assumenosideeffects class android.util.Log {
    public static *** d(...);
    public static *** v(...);
    public static *** i(...);
}
# Caution: do not register the Timber debug tree in release
```

---

## 3. Data Security

### 3.1 Sensitive Data Classification
| Grade | Example data | Storage location | Encryption |
|------|-----------|---------|--------|
| P0 | Auth tokens, passwords, payment keys | EncryptedSharedPreferences | Android Keystore |
| P1 | National ID, card number (masked) | EncryptedFile + Room | AES-256 |
| P2 | Personal info (name/phone) | Room Database | File encryption |
| P3 | User content, settings | Room / DataStore | OS internal storage protection |
| P4 | Cache, analytics | Internal/external Caches | Not required |

### 3.2 File Encryption (EncryptedFile)
```kotlin
// Encrypted storage of sensitive files (grade P1)
val masterKey = MasterKey.Builder(context)
    .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
    .setRequestStrongBoxBacked(true)  // request StrongBox (supported devices)
    .build()

val encryptedFile = EncryptedFile.Builder(
    context,
    File(context.filesDir, "sensitive_data.enc"),
    masterKey,
    EncryptedFile.FileEncryptionScheme.AES256_GCM_HKDF_4KB
).build()

// Write
encryptedFile.openFileOutput().use { out -> out.write(data) }
// Read
val data = encryptedFile.openFileInput().use { it.readBytes() }
```

### 3.3 No External Storage Usage
```
Forbidden:
❌ Storing sensitive data in external storage (/sdcard)
❌ MODE_WORLD_READABLE / MODE_WORLD_WRITEABLE file permissions

Allowed:
✅ Only user-shared files (photos, documents) via MediaStore / SAF (Storage Access Framework)
✅ App-only files must be in internal storage (context.filesDir)
```

### 3.4 Memory Security
```kotlin
// Password field: clear immediately after input is complete
val password = passwordEditText.text?.toString()
try {
    // use it
} finally {
    passwordEditText.text?.clear()  // clear the UI
    // Strings depend on GC → using char[] is safer (the Java approach)
}

// Prevent background screenshots
override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    window.setFlags(WindowManager.LayoutParams.FLAG_SECURE,
                    WindowManager.LayoutParams.FLAG_SECURE)
    // FLAG_SECURE: blocks screenshots, screen recording, and recent-apps thumbnails
}
```

---

## 4. Code & Build Security

### 4.1 API Key Management
```
Forbidden:
❌ Hardcoding in source code: val API_KEY = "secret"
❌ Plaintext storage in strings.xml (resource files are reverse-engineerable too)
❌ Committing secret files to the Git repository

Allowed:
✅ local.properties (must be added to gitignore) → injected into BuildConfig
✅ CI/CD environment variables → injected at Gradle build time
✅ Runtime server request (via a Secrets Manager)
```

```kotlin
// local.properties (gitignore):
// API_KEY=your_key_here

// build.gradle.kts:
val apiKey = project.findProperty("API_KEY") as String? ?: ""
android {
    buildTypes {
        release {
            buildConfigField("String", "API_KEY", "\"$apiKey\"")
        }
    }
}

// In code:
val key = BuildConfig.API_KEY
```

### 4.2 Root Detection
```kotlin
fun isRooted(): Boolean {
    val paths = listOf("/system/app/Superuser.apk", "/sbin/su", "/system/bin/su",
                       "/system/xbin/su", "/data/local/xbin/su", "/data/local/bin/su",
                       "/system/sd/xbin/su", "/system/bin/failsafe/su")
    return paths.any { File(it).exists() } ||
           runCatching { Runtime.getRuntime().exec(arrayOf("/system/xbin/which", "su")) }
               .getOrNull()?.inputStream?.bufferedReader()?.readLine()?.isNotEmpty() == true
}
// On root detection: terminate the app or enter restricted mode (finance/healthcare)
// Perfect detection is impossible → treat only as one layer of defense in depth
```

### 4.3 ProGuard / R8 Configuration
```proguard
# Basic obfuscation settings (build.gradle.kts)
# minifyEnabled = true (Release build)
# shrinkResources = true (remove unused resources)

# Protect data classes (Gson/Retrofit models)
-keep class com.example.app.data.model.** { *; }
-keepclassmembers class com.example.app.data.model.** { *; }

# Retrofit
-keepattributes Signature, Exceptions, *Annotation*
-keep interface com.example.app.data.remote.ApiService { *; }
```

### 4.4 Release Build Checklist
```
Build settings:
☐ minifyEnabled = true
☐ shrinkResources = true
☐ debuggable = false
☐ Review ProGuard/R8 rules

Code:
☐ Logcat output disabled in release
☐ Debug-only code removed (check BuildConfig.DEBUG)
☐ API keys handled via BuildConfig/server
☐ No test accounts/dummy data
```

---

## 5. Android Permission Security

### 5.1 Principle of Least Privilege
```xml
<!-- Declare only the permissions you need -->
<!-- Undeclared permissions are automatically blocked by the OS -->

<!-- Internet (Normal Permission - auto-granted) -->
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

<!-- Camera (Dangerous Permission - runtime request) -->
<uses-permission android:name="android.permission.CAMERA" />

<!-- Storage (API 32 and below; 33+ uses READ_MEDIA_IMAGES) -->
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"
    android:maxSdkVersion="32" />
```

### 5.2 Runtime Permission Request Pattern
```kotlin
// Use ActivityResultContracts (recommended)
private val requestCameraPermission = registerForActivityResult(
    ActivityResultContracts.RequestPermission()
) { isGranted ->
    if (isGranted) openCamera()
    else showPermissionDeniedUI() // guide to the Settings app
}

// Timing of request: right before using the feature (provides context)
binding.btnTakePhoto.setOnClickListener {
    requestCameraPermission.launch(Manifest.permission.CAMERA)
}

// Handle permission denial (guide to the Settings app)
fun showPermissionDeniedUI() {
    MaterialAlertDialogBuilder(this)
        .setTitle("Camera permission required")
        .setMessage("Camera permission is required to take a profile photo. Please allow it in Settings.")
        .setPositiveButton("Go to Settings") { _, _ ->
            startActivity(Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                data = Uri.fromParts("package", packageName, null)
            })
        }
        .setNegativeButton("Cancel", null)
        .show()
}
```

---

## 6. Google Play Compliance

```
Required policy compliance:
☐ Privacy policy URL (app store + in-app)
☐ Target SDK: Android latest version -1 or higher (Google Play policy)
☐ Payments: latest Google Play Billing Library (in-app purchase apps)
☐ Location permission: background location requires prior Policy approval
☐ Apps for children: comply with the Children's Online Privacy Protection Act (COPPA)

Data safety section (required in Play Console):
☐ Declare types of data collected
☐ Whether shared (third parties)
☐ Whether encrypted
☐ How deletion requests are handled
```

---

**Document version:** 1.0.0 | **Date:** 2026-06-13 | **Target OS:** Android 8.0 (API 26)+ | **Conformance:** OWASP Mobile Top 10 2024
