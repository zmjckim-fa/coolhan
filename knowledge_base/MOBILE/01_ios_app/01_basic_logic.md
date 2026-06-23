# iOS App - Basic Logic

## 1. Characteristics of iOS Apps

iOS is a native app that runs on **Apple's iPhone/iPad operating system**.

### Key Characteristics
```
- Distribution only through the Apple App Store
- Uses the Swift language (native)
- iOS version management (a minimum supported version is required)
- Apple review process is mandatory
- High security and performance requirements
```

---

## 2. iOS App Lifecycle

### 2.1 App Launch Flow
```
User taps the app icon
    ↓
1. Not Running
    ↓
2. Foreground (visible on screen)
    ├─ Active (receives events)
    └─ Inactive (does not receive events)
    ↓
3. Background (running in the background)
    ├─ Suspended
    └─ Running
    ↓
4. Terminated (app closed)
```

### 2.2 State Transition Events
```
AppDelegate functions:
- application(_:didFinishLaunchingWithOptions:) - app start
- applicationDidBecomeActive(_:) - became active
- applicationWillResignActive(_:) - about to become inactive
- applicationDidEnterBackground(_:) - entered background
- applicationWillEnterForeground(_:) - returning to foreground
- applicationWillTerminate(_:) - about to terminate
```

---

## 3. UI/UX Structure

### 3.1 Navigation Patterns
```
Tab Navigation
├─ Tab 1: Home
├─ Tab 2: Search/Categories
├─ Tab 3: Cart
├─ Tab 4: Orders/Subscriptions
└─ Tab 5: My Page

or

Stack Navigation
└─ List → Detail → Sub-detail
```

### 3.2 iOS Design System
```
- Safe Area
  → Account for notch / home indicator
- Status Bar (top status display)
- Navigation Bar (back button, title)
- Tab Bar (bottom tabs)
- Safe Area Insets
```

### 3.3 Typical Screen Structure
```
┌──────────────────────┐
│    Status Bar        │
├──────────────────────┤
│  Navigation Bar      │ (back button, title)
├──────────────────────┤
│                      │
│   Content Area       │ (within Safe Area)
│   (scrollable)       │
│                      │
├──────────────────────┤
│   Tab Bar            │ (bottom tabs)
└──────────────────────┘
```

---

## 4. Data Storage

### 4.1 Local Storage Options

#### UserDefaults
```
Purpose: Storing simple settings values
Examples: User preferences, tokens, simple caches
Limitations: Not suitable for large data, requires encryption
```

#### CoreData
```
Purpose: Local storage of structured data
Examples: Offline order list, user info cache
Advantages: Relational queries possible, automatic migration
```

#### FileManager
```
Purpose: File storage (images, documents)
Examples: Downloaded images, temporary files
Paths: Documents, Caches, Temp
```

#### Keychain
```
Purpose: Encrypted storage of sensitive data
Examples: Passwords, tokens, API keys
Security: iOS-level encryption
```

### 4.2 Server Communication
```
HTTP/HTTPS API
├─ REST API (standard)
├─ GraphQL (optional)
└─ WebSocket (real-time)

Sending/receiving data in JSON format
Session management (JWT tokens)
```

---

## 5. Permission Management

### 5.1 iOS Permission Requests
```
When the app uses a permission for the first time, it prompts the user with a popup
Access is only granted after the user consents
If denied, it can only be changed in the app settings
```

### 5.2 Common Permissions
```
- Camera
- Photos (photo library)
- Microphone
- Location
- Contacts
- Calendar
- Reminders
- Health
- HomeKit (smart home)
- Bluetooth
- NotificationCenter (notifications)
```

### 5.3 Permission Request Examples (Shopping Mall App)
```
Required:
- PhotoLibrary (product review photos)

Optional:
- Location (find stores near the delivery address)
- NotificationCenter (order notifications)
- Camera (real-time product scanning)
```

---

## 6. Networking

### 6.1 URLSession Basic Structure
```
URLSession
├─ Create Request
├─ Send to Server
└─ Receive Response
   ├─ 200-299: Success
   ├─ 300-399: Redirect
   ├─ 400-499: Client error
   └─ 500-599: Server error
```

### 6.2 Network Request Flow
```
1. Create the Request object (URL, method, headers, body)
2. Send via URLSession
3. Await response (asynchronous)
4. Handle the response
   └─ Success: Parse JSON
   └─ Failure: Handle error
5. Update UI (main thread)
```

### 6.3 Error Handling
```
Network errors:
- No internet connection
- Timeout
- DNS failure

HTTP errors:
- 401 Unauthorized (re-authentication required)
- 404 Not Found
- 500 Server Error

Parsing errors:
- JSON parsing failure
- Data type mismatch
```

---

## 7. Offline Support

### 7.1 Offline Detection
```
Use the Network Framework
- Monitor WiFi connection status
- Monitor Cellular connection status
- Check internet connection availability
```

### 7.2 Offline Mode
```
Online state:
- Load real-time data
- Send changes to the server

Offline state:
- Display cached data
- Display data from local storage
- Temporarily store changes
- Synchronize when back online
```

### 7.3 Synchronization Strategy
```
1. Detect return to online
2. Collect pending changes
3. Upload to the server
4. Resolve conflicts (server data first, local first, etc.)
5. Update UI
```

---

## 8. Background Tasks

### 8.1 Types of Background Tasks

#### 1. Background App Refresh
```
Purpose: Periodically refresh data
Examples: Check for new orders, update shipping status
Execution frequency: Determined by iOS (not controllable by the developer)
Duration: On the order of minutes
```

#### 2. Background Fetch
```
Purpose: Obtain data without opening the app
Examples: Receive mail, check messages
Configuration: Specify a minimum interval
```

#### 3. Silent Push Notification
```
Purpose: Quiet background refresh
Examples: New orders, shipping status changes
Not visible to the user (optional)
```

#### 4. VoIP Push
```
Purpose: Real-time communication
Examples: Chat, calls
Low latency (< 1 second)
```

### 8.2 Background Task Constraints
```
- Maximum execution time limit (usually 30 seconds)
- CPU usage limit
- Network usage allowed
- Battery considerations
```

---

## 9. Notifications

### 9.1 Local Notifications
```
Notifications scheduled by the app
Examples: Product shipment scheduled, purchase complete

Composition:
- Title
- Message
- Badge (number on the app icon)
- Sound
- Trigger time (immediate, scheduled)
```

### 9.2 Remote Notifications (Push Notification)
```
Notifications sent from the server
Examples: New order, shipping status change

Composition:
- Alert (title/message)
- Badge (number on the app icon)
- Sound (notification sound)
- Custom Data (additional information)

Delivery: Apple Push Notification Service (APNs)
```

### 9.3 Notification Permission
```
The app requests notification permission on first launch
If denied:
- Notifications cannot be sent
- The user can manually enable it in settings
```

---

## 10. Performance Optimization

### 10.1 Memory Management
```
- Image caching (SDWebImage, Kingfisher)
- Lazy loading for large lists
- Respond to memory warnings (clear caches)
- Leverage ARC (Automatic Reference Counting)
```

### 10.2 Network Optimization
```
- Use HTTP compression
- Image optimization (WebP, JPEG)
- Gzip compression
- Eliminate unnecessary requests
- Batch requests
```

### 10.3 UI Performance
```
- Update the UI only on the main thread
- Maintain a high frame rate (60fps)
- Scroll performance (cell reuse)
- Optimize layout calculations
```

---

## 11. Security

### 11.1 Data Security
```
- Store sensitive data in the Keychain
- Use HTTPS only for communication
- Token storage: Keychain
- Delete sensitive data on logout
```

### 11.2 API Security
```
- SSL Pinning (only allow specific certificates)
- Request signing (HMAC)
- Token expiration management
- Use Refresh Tokens
```

### 11.3 Code Security
```
- No hardcoding of sensitive information
- No printing of sensitive information in logs
- Separate debug and release builds
```

---

## 12. App Distribution

### 12.1 Development Stage
```
1. Create a development certificate
2. Register development devices
3. Create a development provisioning profile
4. Develop and test in Xcode
```

### 12.2 Testing (TestFlight)
```
1. Invite beta testers
2. Upload the app build
3. Testers install and test
4. Collect feedback
```

### 12.3 App Store Distribution
```
1. Create a release certificate
2. Create a release provisioning profile
3. Build the app (release)
4. Upload to App Store Connect
5. Enter app information (description, screenshots, price)
6. Submit for Apple review
7. Apple review (1-3 days)
8. Distribute after approval
```

### 12.4 App Store Review Rules
```
- No crashes
- Clear feature descriptions
- Mark adult content
- State the privacy policy
- Advertising transparency
- Comply with payment systems (Apple In-App Purchase or explicit external payment)
```

---

## 13. User Analytics

### 13.1 Analytics
```
Google Analytics
Firebase Analytics
Amplitude

Tracked items:
- User behavior (screen transitions, button clicks)
- Events (product purchase, review submission)
- Usage time
- Crashes
```

### 13.2 Crash Reporting
```
Firebase Crashlytics
Sentry
Bugly

Features:
- Automatic crash reporting
- Stack trace analysis
- Number of affected users
- Crash rate trends
```

---

## 14. Major Frameworks and Libraries

```
UI:
- UIKit (traditional)
- SwiftUI (latest)

Networking:
- URLSession (basic)
- Alamofire (wrapper)

JSON parsing:
- Codable (basic)
- SwiftyJSON

Image caching:
- Kingfisher
- SDWebImage

Data storage:
- CoreData
- SQLite (FMDB)
- Realm

Asynchronous:
- Combine
- RxSwift

Dependency injection:
- Swinject
```

---

## 15. iOS Version Management

### 15.1 Minimum Deployment Target
```
Typically: Two versions behind the current latest version
Example: Supporting iOS 15 requires iOS 13 or later

Using the latest features:
- For APIs available only on iOS 14 or later, use an @available check
```

### 15.2 Handling Version-Specific Changes
```
When a new iOS version is released:
1. Review new APIs and features
2. Remove deprecated APIs among existing ones
3. Respond to UI changes
4. Respond to new permission systems
5. Update tests and certificates
```

---

## 16. What to Read Next

1. **core_features.md** - Common features of iOS apps
2. **terminology.md** - iOS technical terminology
3. **architecture.md** - Architectures such as MVVM, MVC
4. **api_standard.md** - Networking API standards
5. **spec_template.md** - iOS app specification template
