# Android App Specification Template

## Project Basic Information

```yaml
project_name: "{App name}"
application_id: "com.{company}.{appname}"
version_name: "1.0.0"
version_code: 1
min_sdk: 26                          # Android 8.0
target_sdk: 35                       # Latest API (Google Play policy)
compile_sdk: 35
language: "Kotlin"
ui_framework: "Jetpack Compose"      # Compose | XML | Hybrid
architecture: "MVVM + Clean"         # MVVM | MVI | Clean Architecture
di_framework: "Hilt"                 # Hilt | Koin | None
```

---

## Section 1: App Overview

| Item | Content |
|------|------|
| **App name** | |
| **Play Store short description** | (80 characters or fewer) |
| **App category** | |
| **Target users** | |
| **Core value proposition** | |
| **Revenue model** | Free | Paid | Freemium | Subscription | In-app purchase |

---

## Section 2: Screen List (Screens)

| # | Screen name | Role | Access | Entry path |
|---|----------|------|---------|---------|
| S01 | Splash | Initial loading + auto-login | Everyone | App start |
| S02 | Onboarding | First-run guide | Logged out | First install |
| S03 | Login | Email/social authentication | Logged out | Onboarding complete |
| S04 | Main (BottomNavigation) | Tab-based navigation | Logged in | Login success |
| S05 | {Feature} list | | | Tab |
| S06 | {Feature} detail | | | Tap a list item |
| S07 | Profile / My Page | | Logged in | Tab |
| S08 | Settings | | Logged in | Profile |

---

## Section 3: Feature Specifications

### F001: Authentication
```
Supported methods:
  [ ] Email/password
  [ ] Google Sign-In
  [ ] Kakao Login
  [ ] Naver Login
  [ ] Phone number (Firebase Auth)

Email validation: RFC 5322
Password policy: minimum 8 characters, mix of upper/lowercase + digits
Token storage: EncryptedSharedPreferences (Android Keystore)
Auto-login: handled automatically on the splash screen when the token is valid

Error handling:
- Invalid credentials (401): "Email or password is incorrect"
- 5 failures: "Please try again later (30 minutes)"
- No network: "Please check your internet connection"
- Google/social failure: "Login failed. Please try again"
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

### 4.1 Room Entity List
```
Note: use the standard entities in 04_database_schema.md

Entities used:
- [ ] UserEntity
- [ ] ProductEntity
- [ ] OrderEntity / OrderItemEntity
- [ ] CachedResponseEntity
- [ ] {CustomEntity}

Adding a custom entity:
@Entity(tableName = "{table_name}")
data class {Name}Entity(
    @PrimaryKey val id: String,
    val {field}: {type},
    val created_at: Long,
    val updated_at: Long
)
```

### 4.2 EncryptedSharedPreferences Key List
| Key | Type | Description |
|----|------|------|
| auth_token | String | Access token |
| refresh_token | String | Refresh token |
| user_id | String | Logged-in user ID |

### 4.3 DataStore Key List
| Key | Type | Default | Description |
|----|------|--------|------|
| has_onboarded | Boolean | false | Whether onboarding is complete |
| selected_language | String | "" | Selected language |
| notifications_enabled | Boolean | true | Notifications enabled |

---

## Section 5: API Integration

### 5.1 Basic Configuration
```yaml
base_url:
  production: "https://api.{domain}.com/v1"
  staging: "https://api-staging.{domain}.com/v1"
  development: "http://10.0.2.2:3000/v1"   # emulator → localhost

auth: Bearer Token (Authorization header)
timeout_connect: 30s
timeout_read: 30s
timeout_write: 60s
retry: 3 times (exponential backoff, IO errors only)
```

### 5.2 Endpoints Used
| Method | Path | Function | Auth required |
|--------|------|------|---------|
| POST | /auth/login | Login | Not required |
| POST | /auth/refresh | Token refresh | Not required |
| DELETE | /auth/logout | Logout | Required |
| GET | /users/me | My information | Required |
| {method} | {path} | {description} | {yes/no} |

---

## Section 6: Permissions

| Permission | Type | Reason for request | Timing of request |
|------|------|---------|---------|
| [ ] INTERNET | Normal | Network communication | Auto-granted |
| [ ] ACCESS_NETWORK_STATE | Normal | Check network state | Auto-granted |
| [ ] CAMERA | Dangerous | "Take a profile photo" | Tap the camera button |
| [ ] READ_MEDIA_IMAGES | Dangerous (API 33+) | "Select a gallery photo" | Tap the photo-select button |
| [ ] ACCESS_FINE_LOCATION | Dangerous | "Get precise location" | When using a location feature |
| [ ] POST_NOTIFICATIONS | Dangerous (API 33+) | "Receive order notifications" | On completing the first order |
| [ ] {permission} | {type} | {reason} | {timing} |

---

## Section 7: Notification Specification

| # | Channel ID | Channel name | Importance | Notification trigger | Type |
|---|---------|--------|--------|-----------|------|
| N01 | order_updates | Order notifications | DEFAULT | Order status change | FCM |
| N02 | promotions | Benefits/events | LOW | Marketing send | FCM |
| N03 | {channel_id} | | | | FCM | Local |

---

## Section 8: Error Scenarios

| # | Scenario | Code | Display method | Message |
|---|---------|------|---------|--------|
| E01 | Login failure | 401 | Snackbar | "Email or password is incorrect" |
| E02 | No network | - | Banner | "Please check your internet connection" |
| E03 | Server error | 5xx | Dialog | "A temporary error occurred. Please try again later" |
| E04 | Session expired | 401 | Navigate to login screen | "Your login has expired" |

---

## Section 9: Testing Requirements

### 9.1 Unit Tests
```
Framework: JUnit4 + Mockk + Turbine (Flow testing)
Target coverage: ViewModel, Repository, UseCase ≥ 80%

Required tests:
- [ ] Login success/failure (ViewModel)
- [ ] Token refresh logic (TokenManager)
- [ ] API response parsing (Repository)
- [ ] Room DAO CRUD (in-memory DB)
- [ ] Flow data flow (Turbine)
```

### 9.2 UI Tests
```
Framework: Espresso (XML) | Compose Test (Compose)
Scope: core user flows

- [ ] Onboarding → login → main
- [ ] {Core flow}
```

### 9.3 Real Device Tests
```
Required test devices:
- Android 8.0 (minSdk, API 26)
- Latest Android (targetSdk)
- Low-end device (2GB RAM or less)
- Various screen sizes (small/standard/large)
```

---

## Section 10: Deployment Plan

| Stage | Content | Duration |
|------|------|------|
| Internal Testing | Within 100 dev team members | |
| Closed Testing (Alpha) | Invite a specific group | |
| Open Testing (Beta) | Public sign-up | |
| Production | Staged rollout recommended | |

```
Staged Rollout:
Play Console → set release percentage
1% → 5% → 10% → 25% → 50% → 100% (monitor each stage for 24-48 hours)
Crash rate >1.09% or ANR rate >0.47% → halt immediately

Signing (APK/AAB):
- keystore.jks: never lose it, exclude from version control
- Enabling Google Play App Signing is recommended (key loss recoverable)
```

---

**Spec ID:** {id} | **Date:** {YYYY-MM-DD} | **Approval:** {Planner name}
