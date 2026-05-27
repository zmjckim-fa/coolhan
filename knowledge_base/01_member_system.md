# 01_member_system.md - Member System Domain Module

## Overview
The Member System module handles user account management, authentication, profile management, and member lifecycle. This module is foundational and required for any project with user accounts or authentication.

---

## 1. Terminology Definition

| Term | Definition | Example |
|------|-----------|---------|
| **Member/User** | A person with an account in the system | john.doe@example.com |
| **Authentication** | Process of verifying user identity | Login via password, OAuth, SSO |
| **Authorization** | Process of determining what authenticated user can do | Role-based permissions |
| **Member Status** | Current state of account in system lifecycle | Active, Suspended, Deleted, Pending |
| **Profile** | User-provided information and preferences | Name, avatar, bio, preferences |
| **Credential** | Information used to verify identity | Password, biometric, token, certificate |
| **Session** | Active connection state for authenticated user | JWT token, session ID, active login |
| **Role** | Collection of permissions for specific account type | Admin, Moderator, Customer, Guest |
| **Permission** | Specific action user is allowed to perform | Can view, can edit, can delete |
| **Two-Factor Authentication (2FA)** | Additional security layer using second verification | SMS code, authenticator app, email confirmation |

---

## 2. Basic Functions

### 2.1 User Registration
- **Purpose**: Create new member account in system
- **Input**: Email, password, optional profile fields
- **Process**: Validation → Account creation → Email verification (optional) → Initial session
- **Output**: New account, verification token (if applicable)
- **Error Handling**: Duplicate email, invalid format, weak password

### 2.2 Login/Authentication
- **Purpose**: Verify member identity and establish session
- **Input**: Email/username + password, or OAuth token
- **Process**: Credential validation → 2FA check (if enabled) → Session creation
- **Output**: Authentication token/session ID, user profile
- **Error Handling**: Invalid credentials, account suspended, max login attempts exceeded

### 2.3 Profile Management
- **Purpose**: Allow member to view/edit personal information
- **Input**: Profile fields (name, avatar, bio, contact info, preferences)
- **Process**: Validation → Permission check → Update → Audit log
- **Output**: Updated profile
- **Error Handling**: Invalid data, permission denied, file size limits

### 2.4 Password Management
- **Purpose**: Allow members to reset/change passwords securely
- **Input**: Old password (for change), email (for reset)
- **Process**: Verify identity → Generate reset token → Email link → Validate token → Update password
- **Output**: Password updated, session invalidated
- **Error Handling**: Invalid old password, token expired, mismatched new passwords

### 2.5 Logout
- **Purpose**: End user session securely
- **Input**: Session ID/token
- **Process**: Revoke token → Clear session data → Audit log
- **Output**: Confirmation, redirect to login
- **Error Handling**: Already logged out, invalid token

### 2.6 Account Deletion
- **Purpose**: Allow member to permanently delete account
- **Input**: Password confirmation
- **Process**: Verify identity → Data anonymization → Deletion flag → Audit log
- **Output**: Account marked as deleted
- **Error Handling**: Invalid password, active orders/subscriptions, insufficient permissions

### 2.7 Two-Factor Authentication Setup
- **Purpose**: Enable additional security for account
- **Input**: Preferred 2FA method (SMS, email, authenticator app)
- **Process**: Generate secret/codes → Send verification → Confirm setup → Store method
- **Output**: 2FA enabled, backup codes provided
- **Error Handling**: Invalid contact info, backup codes not saved

### 2.8 Role Management (Admin)
- **Purpose**: Assign roles and permissions to members
- **Input**: Member ID, role list, permissions
- **Process**: Permission check (admin only) → Update roles → Audit log
- **Output**: Updated member roles
- **Error Handling**: Insufficient permissions, invalid role, cannot demote last admin

---

## 3. Status Values

| Status | Description | Transitions | Business Rules |
|--------|-------------|-----------|-----------------|
| **Pending** | Account created, awaiting email verification | → Active | Cannot login until verified |
| **Active** | Account fully operational | → Suspended, Deleted | Can login and use features |
| **Suspended** | Account temporarily disabled | → Active, Deleted | Cannot login, data preserved |
| **Deleted** | Account marked for deletion (soft delete) | None | Cannot login, personal data removed after retention period |
| **Locked** | Account temporarily locked due to security | → Active | Cannot login after N failed attempts |

---

## 4. Database Basic Structure

### Core Tables

#### members
```
- id (PK): UUID/INT
- email (UNIQUE): VARCHAR(255)
- username (OPTIONAL): VARCHAR(100)
- password_hash: VARCHAR(255)
- first_name: VARCHAR(100)
- last_name: VARCHAR(100)
- avatar_url: VARCHAR(500)
- bio: TEXT
- status: ENUM(pending, active, suspended, deleted)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
- last_login_at: TIMESTAMP
- email_verified_at: TIMESTAMP
- two_factor_enabled: BOOLEAN
- two_factor_method: VARCHAR(50)
- deleted_at: TIMESTAMP (soft delete)
```

#### member_credentials
```
- id (PK): UUID/INT
- member_id (FK): UUID/INT
- credential_type: ENUM(password, oauth, biometric, certificate)
- credential_value: VARCHAR(500)
- is_active: BOOLEAN
- created_at: TIMESTAMP
- last_used_at: TIMESTAMP
```

#### member_roles
```
- member_id (FK): UUID/INT
- role_id (FK): UUID/INT
- assigned_at: TIMESTAMP
- assigned_by: UUID/INT
- PRIMARY KEY (member_id, role_id)
```

#### member_sessions
```
- id (PK): VARCHAR(500)
- member_id (FK): UUID/INT
- token: VARCHAR(500) (indexed)
- ip_address: VARCHAR(45)
- user_agent: VARCHAR(500)
- created_at: TIMESTAMP
- expires_at: TIMESTAMP
- last_activity_at: TIMESTAMP
```

#### member_audit_log
```
- id (PK): UUID/INT
- member_id (FK): UUID/INT
- action: VARCHAR(100)
- changes: JSON
- ip_address: VARCHAR(45)
- created_at: TIMESTAMP
```

---

## 5. API Basic Structure

### Authentication Endpoints
```
POST   /auth/register           - Create new account
POST   /auth/login             - Authenticate user
POST   /auth/logout            - End session
POST   /auth/refresh-token     - Refresh JWT token
POST   /auth/password-reset    - Request password reset
PUT    /auth/password          - Change password
```

### Profile Endpoints
```
GET    /members/me             - Get current user profile
PUT    /members/me             - Update profile
GET    /members/:id            - Get public member profile (if permitted)
PUT    /members/me/avatar      - Upload avatar
PUT    /members/me/preferences - Update preferences
```

### Security Endpoints
```
POST   /members/me/2fa/setup            - Enable 2FA
POST   /members/me/2fa/verify           - Verify 2FA code
DELETE /members/me/2fa                  - Disable 2FA
GET    /members/me/sessions             - List active sessions
DELETE /members/me/sessions/:sessionId  - Revoke specific session
```

### Admin Endpoints
```
GET    /admin/members          - List all members (paginated)
GET    /admin/members/:id      - Get member details
PUT    /admin/members/:id      - Update member (admin)
PUT    /admin/members/:id/role - Assign roles
POST   /admin/members/:id/suspend - Suspend account
POST   /admin/members/:id/reactivate - Reactivate account
DELETE /admin/members/:id      - Delete account
GET    /admin/member/login-history - View login attempt history
GET    /admin/member/activity-log  - View member activity audit log
```

### Error Response Format
```json
{
  "error": "invalid_credentials",
  "message": "Email or password is incorrect",
  "code": 401,
  "timestamp": "2026-05-27T10:00:00Z"
}
```

---

## 6. Permissions

### Public (No Authentication Required)
- POST /auth/register
- POST /auth/login
- POST /auth/password-reset
- GET /members/:id (public profile only)

### Authenticated User
- GET /members/me
- PUT /members/me
- PUT /members/me/avatar
- PUT /members/me/preferences
- POST /auth/logout
- POST /auth/password-reset (new password)
- PUT /auth/password
- 2FA endpoints for own account

### Admin Only
- GET /admin/members
- GET /admin/members/:id
- PUT /admin/members/:id
- PUT /admin/members/:id/role
- Suspension/reactivation endpoints
- DELETE /admin/members/:id
- GET /admin/member/login-history
- GET /admin/member/activity-log

---

## 7. Prohibitions

### Absolute Prohibitions
- **Cannot**: Store plaintext passwords (must hash with bcrypt/argon2)
- **Cannot**: Send passwords via email or display in logs
- **Cannot**: Allow account creation with reserved usernames (admin, root, system)
- **Cannot**: Bypass email verification on sign-up (if required)
- **Cannot**: Allow multiple active sessions from different devices without explicit permission
- **Cannot**: Store 2FA recovery codes in plaintext
- **Cannot**: Permanently delete member data without retention period (30-90 days minimum)
- **Cannot**: Process password change without current password verification

### Conditional Prohibitions
- **Unless explicitly enabled**: Cannot access other users' profiles
- **Unless admin role**: Cannot assign/modify member roles
- **Unless email verified**: Cannot access full features (if email verification required)
- **Unless 2FA verified**: Cannot perform high-risk operations (if 2FA enabled)

---

## 8. Security Standards

### Password Requirements
- Minimum 8 characters (industry minimum: 12 recommended)
- Mix of uppercase, lowercase, numbers, special characters
- Cannot contain username or email
- Cannot be common weak passwords (checked against NIST blacklist)
- Must be changed every 90 days (configurable) for sensitive roles

### Session Security
- JWT tokens with expiration (15 minutes recommended)
- Refresh tokens with longer expiration (7 days)
- Invalidate all sessions on password change
- Invalidate session on logout
- Rate limiting: Max 5 login attempts per 15 minutes
- Session timeout after 30 minutes inactivity (configurable)

### 2FA Security
- SMS: 6-digit code, valid for 5 minutes
- Authenticator app: TOTP (Time-based One-Time Password)
- Email: 6-digit link code, valid for 24 hours
- Recovery codes: 10 codes, single-use, stored hashed

### Data Protection
- Hash passwords with bcrypt (cost 12) or Argon2
- Encrypt sensitive fields (SSN, payment methods) at rest
- Use HTTPS for all authentication endpoints
- Implement CSRF tokens for form submissions
- Log all authentication attempts and account changes
- Anonymize deleted user data after retention period

### API Security
- All endpoints require HTTPS
- CORS configured for allowed origins only
- Rate limiting on authentication endpoints
- IP whitelisting optional for admin endpoints
- Validate and sanitize all inputs
- No sensitive data in URL parameters

---

## 9. Acceptance Criteria

### Registration
- ✅ User can create account with email and password
- ✅ Email verification works (if required)
- ✅ User receives welcome email
- ✅ Duplicate email rejected with clear message
- ✅ Weak passwords rejected with requirements shown
- ✅ Terms of Service acceptance recorded

### Login
- ✅ Valid credentials create session
- ✅ Invalid credentials rejected (no user enumeration)
- ✅ Account suspension prevents login
- ✅ 2FA required if enabled
- ✅ Session token returned securely
- ✅ Failed attempts tracked and locked after threshold

### Profile Management
- ✅ User can view complete profile
- ✅ User can edit all profile fields
- ✅ Avatar upload works with size/type validation
- ✅ Preferences are stored and retrieved correctly
- ✅ Changes are logged in audit trail

### Password Reset
- ✅ Reset link sent to verified email
- ✅ Reset link expires after 24 hours
- ✅ New password must meet requirements
- ✅ Previous password cannot be reused (last 5 minimum)
- ✅ All sessions invalidated after password change

### Security
- ✅ No plaintext passwords stored
- ✅ No passwords in logs or error messages
- ✅ 2FA can be enabled/disabled
- ✅ 2FA required for sensitive operations (if enabled)
- ✅ Session properly invalidated on logout
- ✅ Admin can suspend/reactivate accounts
- ✅ Audit log records all security-relevant actions

---

## 10. Integration Points

### Dependency Services
- **Email Service**: For verification, password reset, 2FA codes
- **SMS Service**: For SMS-based 2FA (optional)
- **OAuth Providers**: Google, GitHub, Microsoft (optional)
- **Logging Service**: For audit trail and security monitoring
- **Notification Service**: For alerts on suspicious activity

### Integration Hooks
- On registration: Trigger welcome email and profile setup
- On login: Update last_login_at, log session
- On password change: Invalidate all sessions, log change
- On deletion: Anonymize profile, preserve audit trail
- On role change: Log change with admin ID, trigger permission sync

---

## 11. Configuration Parameters

| Parameter | Default | Min | Max | Notes |
|-----------|---------|-----|-----|-------|
| Password expiry (days) | 90 | 0 | 365 | 0 = disabled |
| Session timeout (min) | 30 | 5 | 1440 | Inactivity timeout |
| Login attempts limit | 5 | 1 | 20 | Before lockout |
| Lockout duration (min) | 15 | 5 | 1440 | Automatic unlock |
| Email verification | true | - | - | Require email verification |
| 2FA required | false | - | - | Mandatory 2FA for all users |
| Password min length | 8 | 6 | 128 | Security vs UX tradeoff |
| Token expiry (min) | 15 | 5 | 60 | JWT token lifetime |
| Refresh token expiry (days) | 7 | 1 | 90 | Refresh token lifetime |

---

## 12. Known Dependencies

- **Member System** is independent - can be implemented standalone
- **All other modules** depend on Member System for user context
- **Notification System** (06_) requires Member System for email/SMS
- **Admin System** (05_) extends Member System with role management
