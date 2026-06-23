# Windows Desktop App Specification Template

## Project Basic Information

```yaml
project_name: "{App name}"
app_id: "{com.company.appname}"         # Windows App SDK Package Identity
version: "1.0.0"
min_windows: "10.0.17763"              # Windows 10 1809 (build 17763) minimum requirement
target_windows: "10.0.26100"           # Windows 11 24H2
language: "C#"
dotnet_version: "8.0"                  # LTS
ui_framework: "WinUI 3"                # WinUI 3 | WPF | MAUI | WinForms
architecture: "MVVM"                   # MVVM | MVI | MVVM+Clean
di_framework: "Microsoft.Extensions.DependencyInjection"
local_db: "SQLite + EF Core"           # SQLite | SQL Server LocalDB | none
deployment: "Microsoft Store"          # Microsoft Store | MSIX | ClickOnce | WiX
```

---

## Section 1: App Overview

| Item | Content |
|------|------|
| **App name** | |
| **Store short description** | (80 characters or fewer) |
| **App category** | Business / Productivity / Utility / Finance / Education |
| **Target users** | |
| **Core value proposition** | |
| **Revenue model** | Free | Paid | Freemium | Subscription (Microsoft 365) |
| **Minimum screen resolution** | 1366×768 (recommended: 1920×1080) |

---

## Section 2: Screen List

| # | Screen name | Role | Access | Entry path |
|---|----------|------|---------|---------|
| S01 | Splash | Initial loading + auto-login check | All | App start |
| S02 | Login | Email/Windows Hello authentication | Not logged in | Splash (no token) |
| S03 | Main (NavigationView) | Main screen based on side navigation | Logged in | Login success |
| S04 | {Feature} list | List based on DataGrid/ListView | Logged in | Side menu |
| S05 | {Feature} detail | Selected item detail + edit | Logged in | List item click |
| S06 | Settings | App settings (theme/language/notifications) | Logged in | Side menu |
| S07 | {Custom screen} | | | |

---

## Section 3: Feature Specifications

### F001: Authentication

```
Supported methods:
  [ ] Email/password
  [ ] Windows Hello (fingerprint/face/PIN)
  [ ] Azure AD / Microsoft account (MSAL library)
  [ ] LDAP/Active Directory (enterprise environment)

Email validation: RFC 5322
Password policy: minimum 8 characters, mix of uppercase/lowercase + numbers
Token storage: Windows Credential Manager (CredWrite)
Auto-login: handled automatically after checking token validity on the splash screen
Session expiration: 15 minutes of inactivity → require re-authentication

Error handling:
- Invalid credentials (401): "The email or password is incorrect"
- 5 failures: "Please try again in a moment (30 minutes)"
- No network: "Cannot connect to the server. Please check your internet connection"
- Windows Hello failure: "Biometric authentication failed. Please log in with your password"
```

### F002: {Core feature 1}

```
Feature description:
Input:
Output:
Business rules:
Exception handling:
UI control: DataGrid | ListView | TreeView | other
```

### F003: {Core feature 2}

```
[Same structure]
```

---

## Section 4: Data Model

### 4.1 EF Core Entity List

```
Note: use the standard entities from 04_database_schema.md

Entities used:
- [ ] User
- [ ] Product
- [ ] Order / OrderItem
- [ ] CachedResponse
- [ ] AppSettings (JSON file, excluded from EF Core)
- [ ] {CustomEntity}

Adding a custom entity:
public class {Name}
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string {Field} { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
```

### 4.2 Windows Credential Manager Key List

| Key (PREFIX: appname_) | Type | Description |
|-------------------|------|------|
| auth_token | String | Access token |
| refresh_token | String | Refresh token |
| user_id | String | Logged-in user ID |

### 4.3 AppSettings.json Key List

| Key | Type | Default | Description |
|----|------|--------|------|
| ThemeMode | String | "System" | Light / Dark / System |
| Language | String | "ko-KR" | Display language |
| NotificationsEnabled | Boolean | true | Enable notifications |
| LastSyncTime | DateTime? | null | Last server sync time |
| {key} | {type} | {default} | {description} |

---

## Section 5: API Integration

### 5.1 Basic Configuration

```yaml
base_url:
  production: "https://api.{domain}.com/v1"
  staging: "https://api-staging.{domain}.com/v1"
  development: "http://localhost:3000/v1"

auth: Bearer Token (Authorization: Bearer {token})
timeout_connect: 30 seconds
timeout_read: 30 seconds
retry: 3 times (exponential backoff: 1s/2s/4s, 5xx only)
```

### 5.2 Endpoints Used

| Method | Path | Function | Auth required |
|--------|------|------|---------|
| POST | /auth/login | Login | No |
| POST | /auth/refresh | Token refresh | No |
| DELETE | /auth/logout | Logout | Yes |
| GET | /users/me | My info | Yes |
| {method} | {path} | {description} | {yes/no} |

---

## Section 6: Screen Layout & UX Requirements

| # | Requirement | Details |
|---|---------|---------|
| UX01 | Minimum resolution | Layout based on 1366×768, core features accessible without scrolling |
| UX02 | High-DPI support | Renders correctly at 100%/125%/150%/200% scaling |
| UX03 | Keyboard navigation | Tab/Shift+Tab to reach all interactive elements |
| UX04 | Shortcuts | Ctrl+S save, Ctrl+N new, Ctrl+F search, Delete delete |
| UX05 | Theme | Supports System (default)/Light/Dark |
| UX06 | Save warning | Confirmation dialog on close when there are unsaved changes |
| UX07 | Loading indicator | ProgressRing or ProgressBar for operations longer than 2 seconds |
| UX08 | Error display | InfoBar (WinUI 3) or MessageBox |
| UX09 | Empty state | Guidance message + action button when the list is empty |
| UX10 | Accessibility | AutomationProperties.Name must be set |

---

## Section 7: Notification Specifications

| # | Type | Trigger | Display method | Click action |
|---|------|--------|---------|---------|
| N01 | Toast notification | {event occurs} | Windows notification center | {navigate to screen} |
| N02 | System tray | Background completed | Balloon tip (NotifyIcon) | Focus the app |
| N03 | In-app notification | {in-app event} | InfoBar (top) | {action} |

---

## Section 8: Error Scenarios

| # | Scenario | Code | Display method | Message |
|---|---------|------|---------|--------|
| E01 | Login failure | 401 | ContentDialog | "The email or password is incorrect" |
| E02 | No network | - | InfoBar (Warning) | "Cannot connect to the server. Switching to offline mode" |
| E03 | Server error | 5xx | ContentDialog | "A temporary error occurred. Please try again in a moment" |
| E04 | Session expired | 401 | Navigate to login screen | "Your login has expired. Please log in again" |
| E05 | Save failure | - | ContentDialog | "Saving failed. Please try again" |
| E06 | File not found | - | InfoBar (Error) | "The file could not be found" |

---

## Section 9: Test Requirements

### 9.1 Unit Tests

```
Framework: xUnit + Moq + FluentAssertions
Coverage target: ViewModel, Repository, Service ≥ 80%

Required tests:
- [ ] Login success/failure (LoginViewModel)
- [ ] Token refresh logic (TokenStore)
- [ ] API response parsing (Repository)
- [ ] EF Core DAO CRUD (InMemory DB)
- [ ] Offline cache fallback (CachedApiService)
- [ ] Settings save/load (SettingsManager)
```

### 9.2 UI Tests

```
Framework: WinAppDriver (WinUI/WPF) or manual testing
Scope: core user flows

- [ ] Login → navigate to main screen
- [ ] {Core flow} CRUD
- [ ] Shortcut behavior (Ctrl+S, Ctrl+N, etc.)
- [ ] Theme change (Light/Dark/System)
```

### 9.3 Real-Environment Tests

```
Required test environments:
- Windows 10 1809 (minimum required spec)
- Windows 11 latest (primary distribution target)
- 100% DPI / 125% DPI / 150% DPI / 200% DPI
- Screen sizes: 13-inch (1366×768) / 15-inch (1920×1080) / 4K (3840×2160)
- Low-spec PC: 4GB RAM, HDD without SSD
```

---

## Section 10: Deployment Plan

| Stage | Content | Period |
|------|------|------|
| Internal testing | Development team (sideload MSIX) | |
| Beta | Selected users (Store Private Preview or TestFlight) | |
| Production | Microsoft Store release | |

```
Microsoft Store distribution:
- Register a Partner Center account (developer account: individual $19 / company $99)
- Create the MSIX package: Visual Studio → Publish → MSIX
- Code signing: an EV certificate is recommended
- Store listing: screenshots (at least 2) + icon (300×300) + description

Automatic updates (for distribution outside the Store):
// Squirrel.Windows + GitHub Releases integration
using var mgr = new UpdateManager("https://github.com/user/repo/releases/latest");
var newVersion = await mgr.UpdateApp();
if (newVersion != null) {
    var dialog = new ContentDialog { Title = $"v{newVersion.Version} update complete" };
    if (await dialog.ShowAsync() == ContentDialogResult.Primary) RestartApp();
}
```

---

**Spec ID:** {id} | **Date:** {YYYY-MM-DD} | **Approved by:** {planner name}
