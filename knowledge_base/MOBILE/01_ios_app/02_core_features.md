# iOS App Core Features

## Section 1: App Lifecycle

```
App state transitions:
Not Running
  → [Launch] → Active (foreground, user interaction possible)
  → [Home button/swipe] → Inactive (briefly inactive)
  → [Fully backgrounded] → Background (running background tasks)
  → [Low memory] → Suspended → Not Running

UIApplicationDelegate (UIKit):
  - application:didFinishLaunchingWithOptions → initialization
  - applicationWillResignActive → prepare to pause
  - applicationDidEnterBackground → entered background
  - applicationWillEnterForeground → returning to foreground
  - applicationDidBecomeActive → activation complete

SwiftUI @main:
  - Implement the App protocol
  - Scene-based (WindowGroup)
  - Detect lifecycle events with .onReceive(NotificationCenter)
```

**CoolHan Rules:**
- Run required startup initialization (DB, settings, auth state) in `didFinishLaunchingWithOptions`
- Always flush unsaved state when entering the background
- Background Task registration (`BGTaskScheduler`) requires declaring the identifier in Info.plist

---

## Section 2: Navigation & Routing

```
UIKit pattern:
UITabBarController (tab structure)
  └─ UINavigationController (stack structure)
      └─ UIViewController (individual screen)

SwiftUI pattern:
TabView {
  NavigationStack { ContentView() }   // iOS 16+
  NavigationStack { SettingsView() }
}
Screen transitions with NavigationLink(destination:)
Type-based routing with .navigationDestination(for:)

Deep linking:
- URL Scheme: myapp://product/123
- Universal Link: https://example.com/product/123
- Info.plist: LSApplicationQueriesSchemes, CFBundleURLTypes
```

**CoolHan Rules:**
- No nested navigation beyond 3 levels (UX principle)
- Limit modal usage to temporary tasks (form input, photo selection)
- Handle deep links in both SceneDelegate/AppDelegate (iOS version compatibility)

---

## Section 3: Data Storage

```
Storage strategy by tier:
┌────────────────────────────┬─────────────────────────────┐
│ Data type                  │ Storage                     │
├────────────────────────────┼─────────────────────────────┤
│ Sensitive data (token/pwd) │ Keychain                    │
│ User settings (small)      │ UserDefaults                │
│ Structured data (entities) │ Core Data / SQLite           │
│ Files (images/documents)   │ FileManager (Documents/Cache)│
│ Temporary cache            │ NSCache / URLCache           │
└────────────────────────────┴─────────────────────────────┘

Core Data setup:
NSPersistentContainer(name: "Model")
  → NSManagedObjectContext (viewContext: main, background)
  → Query with NSFetchRequest<Entity>()
  → Persist with context.save()

CloudKit integration:
NSPersistentCloudKitContainer → automatic iCloud synchronization
```

**CoolHan Rules:**
- Auth tokens must go in the Keychain. Storing them in UserDefaults is prohibited.
- Perform Core Data saves on a background context, then merge into the viewContext
- When using the cache folder, set `NSURLIsExcludedFromBackupKey = true`

---

## Section 4: Networking (URLSession)

```swift
// Standard API call pattern (async/await, Swift 5.5+)
struct APIClient {
    let baseURL = URL(string: "https://api.example.com")!

    func fetch<T: Codable>(_ path: String) async throws -> T {
        let url = baseURL.appendingPathComponent(path)
        var request = URLRequest(url: url)
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.timeoutInterval = 30

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse,
              200...299 ~= http.statusCode else {
            throw APIError.httpError((response as? HTTPURLResponse)?.statusCode ?? -1)
        }
        return try JSONDecoder().decode(T.self, from: data)
    }
}

// Error types
enum APIError: Error {
    case httpError(Int)
    case decodingError(Error)
    case networkUnavailable
}
```

**CoolHan Rules:**
- App Transport Security (ATS): when allowing HTTP, you must declare `NSAllowsArbitraryLoads` or a domain exception in Info.plist
- Retry policy: up to 3 retries on network error, exponential backoff (1s, 2s, 4s)
- Offline detection: monitor connection status with `NWPathMonitor`

---

## Section 5: Camera & Media

```swift
// AVFoundation camera capture
import AVFoundation
let captureSession = AVCaptureSession()
guard let device = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .back),
      let input = try? AVCaptureDeviceInput(device: device) else { return }
captureSession.addInput(input)

// PHPickerViewController (photo library selection, iOS 14+)
var config = PHPickerConfiguration()
config.filter = .images
config.selectionLimit = 1
let picker = PHPickerViewController(configuration: config)
picker.delegate = self

// Required Info.plist keys:
// NSCameraUsageDescription
// NSPhotoLibraryUsageDescription
// NSMicrophoneUsageDescription (video)
```

**CoolHan Rules:**
- When camera permission is denied, a UI guiding the user to the Settings app is required
- Apply resizing (max 1080px) and JPEG compression (0.8) before uploading images
- Perform video processing on a background queue

---

## Section 6: Location Services (Core Location)

```swift
import CoreLocation
class LocationManager: NSObject, CLLocationManagerDelegate {
    let manager = CLLocationManager()

    func requestPermission() {
        manager.delegate = self
        manager.requestWhenInUseAuthorization()  // or requestAlwaysAuthorization
        manager.desiredAccuracy = kCLLocationAccuracyBest
        manager.startUpdatingLocation()
    }

    func locationManager(_ manager: CLLocationManager,
                         didUpdateLocations locations: [CLLocation]) {
        guard let loc = locations.last else { return }
        // lat: loc.coordinate.latitude, lng: loc.coordinate.longitude
    }
}
// Info.plist:
// NSLocationWhenInUseUsageDescription (required)
// NSLocationAlwaysAndWhenInUseUsageDescription (for always permission)
```

**CoolHan Rules:**
- Background location tracking must be clearly disclosed to the user
- Set `desiredAccuracy` to the minimum accuracy needed (battery optimization)
- Geofencing uses `CLCircularRegion` (limited to 20 simultaneous monitored regions)

---

## Section 7: Push Notifications (APNs)

```swift
// Request permission
UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .badge, .sound]) { granted, _ in
    guard granted else { return }
    DispatchQueue.main.async { UIApplication.shared.registerForRemoteNotifications() }
}

// Receive token
func application(_ app: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken token: Data) {
    let tokenString = token.map { String(format: "%02.2hhx", $0) }.joined()
    // Send tokenString to the server
}

// Schedule a local notification
let content = UNMutableNotificationContent()
content.title = "Notification Title"
content.body = "Body"
let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 5, repeats: false)
let request = UNNotificationRequest(identifier: UUID().uuidString, content: content, trigger: trigger)
UNUserNotificationCenter.current().add(request)
```

**CoolHan Rules:**
- Choose between an APNs certificate or an APNs Key (.p8). The Key approach is recommended (no expiration).
- The backend server must handle storing and refreshing device tokens
- For Silent Push, use `content-available: 1` plus enabled Background Modes

---

## Section 8: Biometric Authentication (Face ID / Touch ID)

```swift
import LocalAuthentication
let context = LAContext()
var error: NSError?
if context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error) {
    context.evaluatePolicy(.deviceOwnerAuthenticationWithBiometrics,
                           localizedReason: "Unlock the app") { success, authError in
        DispatchQueue.main.async {
            if success { /* authentication succeeded */ }
            else { /* failed or cancelled */ }
        }
    }
}
// Info.plist: NSFaceIDUsageDescription
```

**CoolHan Rules:**
- Provide a passcode fallback authentication when biometric authentication fails
- Biometric data is processed only within the device's Secure Enclave (the app cannot access biometric data)
- Use LABiometryType to distinguish Face ID / Touch ID and dynamically change UI wording

---

## Section 9: App Store & Distribution

```
Distribution stages:
Development (Debug) → TestFlight (internal/external beta) → App Store (production)

Required prerequisites:
- Apple Developer Program enrollment ($99/year)
- Bundle Identifier registration (com.company.app)
- Provisioning profiles (separate development/distribution)
- Code signing certificates (separate development/distribution)

App Store review checklist:
☐ Privacy Nutrition Labels (declare collected data)
☐ App Privacy Policy URL
☐ Minimum OS version setting (support minor versions within 1 year of release)
☐ Screenshots: iPhone 6.5", iPad 12.9" (required)
☐ Age rating setting
☐ In-app purchase review (if any, Sandbox test evidence)
```

**CoolHan Rules:**
- For distribution builds: Xcode Organizer → Archive → Distribute App → App Store Connect
- Inviting external TestFlight testers does not require app review (only the first build is reviewed)
- App icon: 1024×1024 PNG (no alpha channel), managed collectively in Assets.xcassets

---

## Section 10: Accessibility & Internationalization

```swift
// VoiceOver support
button.accessibilityLabel = "Search button"
button.accessibilityHint = "Tap to go to search results"
button.isAccessibilityElement = true

// Dynamic Type
label.font = UIFont.preferredFont(forTextStyle: .body)
label.adjustsFontForContentSizeCategory = true

// Internationalization (i18n)
// Localizable.strings file → NSLocalizedString("key", comment: "")
// Info.plist: CFBundleDevelopmentRegion, CFBundleLocalizations
// Xcode: Product → Export Localizations → XLIFF file
```

**CoolHan Rules:**
- At minimum, VoiceOver labels and Dynamic Type support are P0 requirements
- No hardcoded strings. Always use NSLocalizedString
- Use Locale.current-based DateFormatter / NumberFormatter for date/currency/number formatting

---

**Document version:** 1.0.0 | **Date:** 2026-06-13 | **Target OS:** iOS 15+
