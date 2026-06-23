# iOS App Specification Template

## Project Basic Information

```yaml
project_name: "{App Name}"
bundle_identifier: "com.{company}.{appname}"
version: "1.0.0"
build_number: 1
minimum_ios: "15.0"
target_devices: ["iPhone", "iPad"]   # select the applicable items
language: "Swift"
ui_framework: "SwiftUI"              # SwiftUI | UIKit | mixed
architecture: "MVVM"                 # MVC | MVVM | VIPER | Clean
```

---

## Section 1: App Overview

| Item | Content |
|------|------|
| **App name** | |
| **One-line description** | (App Store subtitle < 30 characters) |
| **App category** | (App Store category) |
| **Target users** | |
| **Core value proposition** | |
| **Revenue model** | Free | Paid ($N) | Freemium | Subscription |

---

## Section 2: Screen List (Screens)

| # | Screen name | Role | Access permission | Navigation entry |
|---|----------|------|---------|--------------|
| S01 | Splash/Onboarding | First-launch environment setup | Not logged in | App start |
| S02 | Login | Email/SNS authentication | Not logged in | Onboarding complete |
| S03 | Main (tab bar) | Core app navigation | Logged in | Login success |
| S04 | {Feature} list | | | |
| S05 | {Feature} detail | | | |
| S06 | Profile / My Page | | Logged in | Tab bar |
| S07 | Settings | | Logged in | Profile |

---

## Section 3: Feature Specifications

### F001: Authentication
```
Supported methods: [ ] Email/Password  [ ] Apple Sign In  [ ] Google  [ ] Kakao
Required: Apple Sign In (if in-app social login exists, Apple is also required, per review guidelines)

Email validation: RFC 5322
Password policy: minimum 8 characters, combination of upper/lowercase + digits
Token storage: Keychain (kSecAttrAccessibleWhenUnlockedThisDeviceOnly)
Auto login: log in automatically when the Keychain token is valid

Error handling:
- Wrong email/password: "The email or password is incorrect"
- 5 failures: account lockout (30 minutes) + guidance message
- Network error: "Please check your internet connection"
```

### F002: {Core Feature 1}
```
Feature description:
Input:
Output:
Business rules:
Exception handling:
```

### F003: {Core Feature 2}
```
[Same structure]
```

---

## Section 4: Data Model

### 4.1 Core Data Entities
```
{Select from the standard entities in 04_database_schema.md as needed for the project}

Entities used:
- [ ] User
- [ ] {Custom Entity 1}
- [ ] {Custom Entity 2}

Adding a custom entity:
Entity: {Name}
Attributes:
  id        : UUID     (required)
  {field}   : {type}   ({constraint})
  createdAt : Date     (required)
  updatedAt : Date     (required)
```

### 4.2 UserDefaults Key List
| Key | Type | Default | Description |
|----|------|--------|------|
| has_onboarded | Bool | false | Whether onboarding is complete |
| {key} | {type} | {default} | {description} |

### 4.3 Keychain Items
| Item | Access level | Description |
|------|---------|------|
| auth_token | WhenUnlockedThisDeviceOnly | Access token |
| {item} | {level} | {description} |

---

## Section 5: API Integration

### 5.1 Basic Configuration
```yaml
base_url:
  production: "https://api.{domain}.com/v1"
  staging: "https://api-staging.{domain}.com/v1"
  development: "https://localhost:3000/v1"

auth: Bearer Token
timeout: 30 seconds
retry: up to 3 times (exponential backoff)
```

### 5.2 Endpoints Used
| Method | Path | Function | Auth required |
|--------|------|------|---------|
| POST | /auth/login | Login | Not required |
| POST | /auth/refresh | Token refresh | Not required |
| GET | /user/me | My info | Required |
| {method} | {path} | {description} | {yes/no} |

---

## Section 6: Permissions

| Permission | Info.plist key | Request reason (text shown to user) | Request timing |
|------|-------------|--------------------------|---------|
| [ ] Camera | NSCameraUsageDescription | "Used to take your profile photo" | Photo change button tap |
| [ ] Photo Library | NSPhotoLibraryUsageDescription | "Used to select a photo" | Photo selection button tap |
| [ ] Location (when in use) | NSLocationWhenInUseUsageDescription | | |
| [ ] Location (always) | NSLocationAlwaysAndWhenInUseUsageDescription | | |
| [ ] Notifications | (UNUserNotificationCenter code) | | |
| [ ] Microphone | NSMicrophoneUsageDescription | | |
| [ ] Face ID | NSFaceIDUsageDescription | | |
| [ ] {Other} | {key} | | |

---

## Section 7: Notification Specifications

| # | Notification trigger | Title | Body | Type |
|---|-----------|------|------|------|
| N01 | Order status change | "Your order has shipped" | "{Product name} is on its way!" | Remote (APNs) |
| N02 | {trigger} | | | Local | Remote |

---

## Section 8: Error Scenarios

| # | Scenario | HTTP code | Displayed message | Handling |
|---|---------|----------|-----------|---------|
| E01 | Login failure (wrong credentials) | 401 | "The email or password is incorrect" | Inline error |
| E02 | No network | - | "Please check your internet connection" | Banner alert |
| E03 | Server error | 500 | "A temporary error occurred. Please try again shortly" | Alert + retry button |
| E04 | {scenario} | | | |

---

## Section 9: Test Requirements

### 9.1 Unit Tests
```
Framework: XCTest
Target coverage: ViewModel, Repository, Business Logic ≥ 80%

Required test cases:
- [ ] Login success/failure
- [ ] Token refresh logic
- [ ] Data parsing (Codable decoding)
- [ ] Core Data CRUD
```

### 9.2 UI Tests
```
Framework: XCUITest
Target: Happy Path of core user flows
- [ ] Onboarding → Login → Main screen
- [ ] {core flow}
```

### 9.3 TestFlight Verification
```
Internal testers: development team (up to 25)
External testers: beta users (up to 10,000)
Minimum test period: 2 weeks (before App Store review)
```

---

## Section 10: Distribution Plan

| Stage | Content | Duration |
|------|------|------|
| Alpha | Internal development team testing | |
| Beta (TestFlight) | External beta testers | |
| App Store Review | Apple review | 1-7 days (avg. 1-2 days) |
| Production Launch | Phased Release recommended | |

```
Phased Release setting (App Store Connect):
Staged rollout over 7 days: 1% → 2% → 5% → 10% → 20% → 50% → 100%
Can be halted immediately if issues are found
```

---

**Spec ID:** {id} | **Date:** {YYYY-MM-DD} | **Approved by:** {planner name}
