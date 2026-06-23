# Android App - Basic Logic

## 1. Characteristics of Android Apps

Android is a **native app** that runs on **Google's mobile operating system**.

### Key Characteristics
```
- Distributed through the Google Play Store
- Uses the Kotlin language (officially recommended)
- Supports a wide range of screen sizes
- Low review bar (fast deployment)
- High degree of freedom and flexibility
```

---

## 2. Android App Lifecycle

### 2.1 Activity Lifecycle
```
1. Created
   ↓
2. Started
   ↓
3. Resumed (active - visible on screen)
   ↓
4. Paused (partially obscured)
   ↓
5. Stopped (moved to background)
   ↓
6. Destroyed (terminated)
```

### 2.2 Lifecycle Callbacks
```
onCreate()        - First created
onStart()         - Becoming visible
onResume()        - Activated
onPause()         - Temporarily suspended
onStop()          - Hidden
onDestroy()       - Destroyed
onRestart()       - Restarted
```

### 2.3 State Save and Restore
```
onSaveInstanceState()  - Save state (when memory is low)
onRestoreInstanceState() - Restore state
Pass data via Bundle
```

---

## 3. UI Structure

### 3.1 Layout System
```
LinearLayout      - Linear arrangement (horizontal/vertical)
FrameLayout       - Stacked arrangement
RelativeLayout    - Relative positioning
ConstraintLayout  - Constraint-based layout (recommended)
RecyclerView      - List/grid
```

### 3.2 Navigation Patterns
```
Bottom Navigation (tabs)
Navigation Drawer (side menu)
Tab Navigation
Stack Navigation (Fragment)
```

### 3.3 Material Design
```
- Color system (Primary, Secondary, Tertiary)
- Typography (Display, Headline, Title, Body)
- Elevation (shadows)
- Spacing (padding/margin)
```

---

## 4. Components

### 4.1 Activity
```
A UI component representing a screen
- One screen = one Activity
- Examples: login screen, product list, product detail
- Lifecycle management required
```

### 4.2 Fragment
```
A partial UI within an Activity
- Reusable UI component
- Supports both tablets and phones (responsive)
- Follows part of the Activity's lifecycle
```

### 4.3 Service
```
A component that runs in the background
- Long-running tasks (music playback, file download)
- No user interface
- Examples: file download, music player
```

### 4.4 Broadcast Receiver
```
Receives system events
- Examples: boot completed, low battery, network change
- Operates in the background
```

### 4.5 Content Provider
```
Data sharing and management
- Shares data between apps
- Examples: contacts, photo library
```

---

## 5. Data Storage

### 5.1 SharedPreferences
```
Simple key-value storage
- User settings, tokens, simple cache
- Persists after app restart
- Encryption: EncryptedSharedPreferences
```

### 5.2 SQLite Database
```
Relational database
- Room (recommended abstraction library)
- Stores structured data
- Supports complex queries
```

### 5.3 File System
```
File storage
- Internal Storage (app-only, deleted along with the app)
- External Storage (accessible by all apps)
- Cache Directory (cache, can be deleted automatically)
```

### 5.4 Data Store
```
Replacement for SharedPreferences
- Safer asynchronous handling
- Type-safe
- Coroutines support
```

### 5.5 Server Communication
```
HTTP/HTTPS API
- Retrofit (HTTP client)
- OkHttp (HTTP client)
- JSON parsing (Gson, Moshi)
```

---

## 6. Permission Management

### 6.1 Permission Types
```
Normal Permissions
- No user consent required
- Example: internet access

Dangerous Permissions
- User consent required
- Requested at runtime
- Examples: camera, location, storage
```

### 6.2 Permission Request Flow
```
1. Declare the permission in AndroidManifest.xml
2. Android 6.0+: runtime permission request
3. Call requestPermissions()
4. User response in onRequestPermissionsResult()
5. Use the permission
```

### 6.3 Permissions Needed by a Shopping Mall App
```
Required:
- INTERNET (server communication)

Needed:
- ACCESS_COARSE_LOCATION (finding shipping address)
- READ_MEDIA_IMAGES (review photos)
- CAMERA (product scanning)
- POST_NOTIFICATIONS (order notifications)
```

---

## 7. Networking

### 7.1 Basic Retrofit Structure
```
Define interface (API spec)
    ↓
Create request object
    ↓
Send via Retrofit
    ↓
Receive response
    ↓
JSON parsing (Gson)
    ↓
Update UI
```

### 7.2 Asynchronous Handling
```
Callback approach
- onResponse()
- onFailure()

Coroutines approach (recommended)
- suspend functions
- Error handling with try-catch
- Update UI on the Main thread
```

### 7.3 Error Handling
```
Network errors:
- IOException (connection failure, timeout)

HTTP errors:
- 4xx (client errors)
- 5xx (server errors)

Parsing errors:
- JsonSyntaxException
- Type mismatch
```

---

## 8. Offline Support

### 8.1 Connection State Detection
```
Use ConnectivityManager
- Check isNetworkConnected()
- Distinguish WiFi vs Cellular
```

### 8.2 Offline Mode
```
Online:
- Load real-time data
- Sync with server

Offline:
- Display local cache
- Save changes
- Sync when back online
```

### 8.3 Data Synchronization
```
Room Database + Retrofit
- Save locally
- Upload to server when online
- Conflict resolution (last write wins, user choice)
```

---

## 9. Background Tasks

### 9.1 Task Scheduling
```
WorkManager (recommended)
- Various task types
- Battery optimization
- Runs even after device reboot

AlarmManager (exact timing)
- For tasks requiring precise timing
- Watch out for battery consumption
```

### 9.2 Background Constraints
```
Android 6.0+: Doze Mode
- Battery saving
- Restricts apps' background tasks

Android 8.0+: Background Execution Limits
- startService() restrictions
- Foreground service recommended
```

### 9.3 Foreground Service
```
Background tasks the user is aware of
- Notification display required
- Examples: music playback, file download
- May consume battery over a long period
```

---

## 10. Notifications

### 10.1 Local Notifications
```
AlarmManager + Broadcast Receiver
or
Schedule with WorkManager
- Title, message
- Icon, color
- Action buttons
```

### 10.2 Remote Notifications (Push Notification)
```
Firebase Cloud Messaging (FCM)
- Token management
- Message handling
- Background/foreground handling
```

### 10.3 Notification Channels
```
Android 8.0+: channels required
- Sound, vibration, light
- Controlled by the user per channel
- Examples: order notifications, promotional notifications
```

---

## 11. Performance Optimization

### 11.1 Memory Management
```
- Image caching libraries (Glide, Picasso)
- Prevent list memory leaks
- Handle large bitmaps
- Use WeakReference
```

### 11.2 Network Optimization
```
- HTTP compression (gzip)
- Image optimization
- Batch requests
- Leverage caching headers
```

### 11.3 UI Performance
```
- Prevent jank (maintain 60fps)
- Optimize layouts
- Do not block the main thread
- Resolve Lint warnings
```

### 11.4 Battery Optimization
```
- Minimize location tracking
- Minimize sensor usage
- Limit high-CPU tasks
- Batch network requests
```

---

## 12. Security

### 12.1 Data Security
```
- EncryptedSharedPreferences (sensitive data)
- SQLite encryption (SQLCipher)
- Use HTTPS only
- Token storage: Shared Preferences or KeyStore
```

### 12.2 API Security
```
- SSL Pinning
- Request signing (HMAC)
- Token expiration management
- Use Refresh Token
```

### 12.3 Code Security
```
- No hardcoding of sensitive information
- No output of sensitive information in logs
- ProGuard/R8 obfuscation
- debuggable = false (release)
```

---

## 13. App Distribution

### 13.1 Development Stage
```
1. Create a development keystore
2. Run on an emulator or test device
3. Debug with Logcat
```

### 13.2 Testing (Google Play Internal Testing)
```
1. Invite internal testers
2. Upload APK/AAB
3. Testers install and test
4. Collect feedback
```

### 13.3 Google Play Distribution
```
1. Create a release keystore (store securely)
2. Configure app signing
3. Create a Release build
4. Generate an AAB (Android App Bundle)
5. Upload to Google Play Console
6. Enter app information (description, screenshots, rating)
7. Submit for Google Play review (usually 1-2 hours)
8. Distribute after approval
```

### 13.4 Distribution Settings
```
Target countries
Price
Rating review (IARC)
Privacy policy link
Contact information
```

---

## 14. User Analytics

### 14.1 Analytics
```
Google Analytics for Firebase
Amplitude
Mixpanel

Tracking:
- User behavior
- Events (purchases, writing reviews)
- Usage time
- Lifetime value (LTV)
```

### 14.2 Crash Reporting
```
Firebase Crashlytics (recommended)
- Automatic crash reporting
- Severity classification
- Affected users
```

---

## 15. Key Libraries

```
UI:
- Material Components
- Jetpack Compose (latest)

Networking:
- Retrofit
- OkHttp

JSON:
- Gson
- Moshi

Images:
- Glide
- Picasso

Data:
- Room
- DataStore

Asynchronous:
- Coroutines
- RxJava

Dependency Injection:
- Hilt

Testing:
- JUnit
- Mockito
- Espresso
```

---

## 16. Supporting Various Screen Sizes (Responsiveness)

### 16.1 dp (Density-independent Pixels)
```
A unit independent of screen density
- 1 dp ≈ 1 pixel (at 160dpi baseline)
- Automatically converted for hdpi, xhdpi, xxhdpi
```

### 16.2 Layout Composition
```
- Responsive design with ConstraintLayout
- Different layouts for phone/tablet (sw600dp)
- Provide images at multiple resolutions (1x, 2x, 3x)
```

---

## 17. Documents to Read Next

1. **core_features.md** - Common features of Android apps
2. **terminology.md** - Android technical terms
3. **architecture.md** - Architectures such as MVVM, MVP
4. **api_standard.md** - Networking standards
5. **spec_template.md** - Android app specification template
