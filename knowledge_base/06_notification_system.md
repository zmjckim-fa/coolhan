# 06_notification_system.md - Notification System Domain Module

## Overview
The Notification System module handles all user notifications across multiple channels (email, SMS, push notifications, in-app). It manages notification templates, delivery, and tracking.

---

## 1. Terminology Definition

| Term | Definition | Example |
|------|-----------|---------|
| **Notification** | Message sent to user via one or more channels | Welcome email, order alert |
| **Channel** | Method of delivering notification | Email, SMS, Push, In-App |
| **Template** | Reusable message structure with variables | "Hi {{name}}, your order {{order_id}} is ready" |
| **Event** | Trigger for notification | Order created, payment received |
| **Queue** | Pending notifications awaiting delivery | 1000 emails queued |
| **Delivery** | Successful sending to recipient | Email delivered, SMS sent |
| **Bounce** | Failed delivery attempt | Email bounced, invalid number |
| **Opt-in/Opt-out** | User permission to receive notifications | Subscribed to marketing emails |
| **Preference** | User choice for notification channels | Only SMS, no email |
| **Retry** | Resend failed notification | Retry after 1 hour |

---

## 2. Basic Functions

### 2.1 Send Notification
- **Purpose**: Deliver notification to user via selected channel(s)
- **Input**: User, notification type, template, variables
- **Process**: Select channels → Fill template → Send via each channel → Log delivery
- **Output**: Notification sent with delivery status
- **Error Handling**: User not found, invalid template, delivery failure

### 2.2 Email Delivery
- **Purpose**: Send email notification
- **Input**: Email address, subject, body (HTML/text), attachments
- **Process**: Validate email → Queue email → Send via SMTP → Track delivery
- **Output**: Email sent confirmation
- **Error Handling**: Invalid email, SMTP failure, bounce handling

### 2.3 SMS Delivery
- **Purpose**: Send SMS text message
- **Input**: Phone number, message text
- **Process**: Validate phone → Queue SMS → Send via SMS provider → Track delivery
- **Output**: SMS sent confirmation
- **Error Handling**: Invalid number, SMS provider down, delivery failure

### 2.4 Push Notification
- **Purpose**: Send push notification to mobile app
- **Input**: Device ID, message, data payload
- **Process**: Validate device → Prepare payload → Send via push service → Track
- **Output**: Push sent confirmation
- **Error Handling**: Invalid device, app not installed, push service down

### 2.5 In-App Notification
- **Purpose**: Create notification visible in app interface
- **Input**: User ID, message, action URL
- **Process**: Create notification record → Mark as unread → Display next login
- **Output**: Notification stored
- **Error Handling**: User not found, database error

### 2.6 Notification Preferences
- **Purpose**: Allow user to control notification settings
- **Input**: Notification type, preferred channels, frequency
- **Process**: Update user preferences → Validate settings → Save
- **Output**: Preferences updated
- **Error Handling**: Invalid preference, no channels selected

### 2.7 Unsubscribe
- **Purpose**: Allow user to opt-out of specific notifications
- **Input**: User ID, notification type or all
- **Process**: Update opt-out status → Log change → Send confirmation
- **Output**: Unsubscribed confirmation
- **Error Handling**: User not found, invalid notification type

### 2.8 Batch Notifications
- **Purpose**: Send same notification to multiple users
- **Input**: User list, notification type, template
- **Process**: Queue notifications for all users → Send in batches
- **Output**: Batch notification job created
- **Error Handling**: Large batch handling, rate limiting

### 2.9 Notification History
- **Purpose**: Display user's past notifications
- **Input**: User ID, filters (type, date range)
- **Process**: Query notifications → Filter → Return paginated
- **Output**: Notification history
- **Error Handling**: No notifications found

### 2.10 Delivery Tracking
- **Purpose**: Track notification delivery status and bounces
- **Input**: Notification ID
- **Process**: Query delivery status → Check for bounces → Return status
- **Output**: Delivery status details
- **Error Handling**: Notification not found, no tracking data

---

## 3. Status Values

| Status | Description | Transitions | Business Rules |
|--------|-------------|-----------|-----------------|
| **Pending** | Notification queued for delivery | → Sent, Failed | Waiting in queue |
| **Sent** | Successfully delivered to channel | → Bounced | Message transmitted |
| **Delivered** | Confirmed delivered to recipient | None (final) | Email opened, SMS received |
| **Bounced** | Delivery failed | → Retried | Email invalid, SMS failed |
| **Opened** | Email opened by recipient | None (final) | Only for email |
| **Clicked** | Link in notification clicked | None (final) | Only for email/SMS |
| **Failed** | Permanently failed after retries | None (final) | Give up after max retries |
| **Unsubscribed** | User opted out | None (final) | Cannot resend unless resubscribed |

---

## 4. Database Basic Structure

### Core Tables

#### notification_templates
```
- id (PK): UUID/INT
- name: VARCHAR(100)
- notification_type: VARCHAR(50)
- channels: JSON (array of channels: email, sms, push, in_app)
- subject: VARCHAR(255) (for email, optional)
- body: TEXT (supports {{variable}} syntax)
- html_body: TEXT (for email)
- data_payload: JSON (for push)
- variables: JSON (list of variable names)
- is_active: BOOLEAN
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### notification_events
```
- id (PK): UUID/INT
- event_type: VARCHAR(100) (order_created, payment_received, etc.)
- trigger_condition: JSON (conditions that trigger)
- template_id (FK): UUID/INT
- is_enabled: BOOLEAN
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### notifications
```
- id (PK): UUID/INT
- member_id (FK): UUID/INT
- notification_type: VARCHAR(50)
- template_id (FK): UUID/INT
- subject: VARCHAR(255)
- body: TEXT
- channels: JSON (email, sms, push, in_app)
- variables: JSON (filled-in values)
- status: ENUM(pending, sent, delivered, failed, bounced)
- sent_at: TIMESTAMP
- created_at: TIMESTAMP
```

#### notification_channels
```
- id (PK): UUID/INT
- notification_id (FK): UUID/INT
- channel: VARCHAR(50)
- recipient: VARCHAR(255) (email, phone, device_id)
- status: ENUM(pending, sent, delivered, bounced, failed)
- provider_id: VARCHAR(255) (from 3rd party)
- delivered_at: TIMESTAMP
- bounced_at: TIMESTAMP
- bounce_reason: VARCHAR(255)
- sent_at: TIMESTAMP
```

#### member_notification_preferences
```
- member_id (PK, FK): UUID/INT
- notification_type: VARCHAR(50)
- email_enabled: BOOLEAN
- sms_enabled: BOOLEAN
- push_enabled: BOOLEAN
- in_app_enabled: BOOLEAN
- frequency: VARCHAR(50) (immediate, daily, weekly, never)
- unsubscribed: BOOLEAN
- updated_at: TIMESTAMP
```

#### notification_devices
```
- id (PK): UUID/INT
- member_id (FK): UUID/INT
- device_type: VARCHAR(50) (ios, android, web)
- device_id: VARCHAR(255)
- push_token: VARCHAR(500) (from Firebase, APNs, etc.)
- is_active: BOOLEAN
- last_used_at: TIMESTAMP
- created_at: TIMESTAMP
```

#### notification_bounces
```
- id (PK): UUID/INT
- member_id (FK): UUID/INT
- channel: VARCHAR(50)
- recipient: VARCHAR(255)
- bounce_type: ENUM(permanent, temporary, complaint)
- bounce_code: VARCHAR(100)
- reason: TEXT
- first_bounce_at: TIMESTAMP
- last_bounce_at: TIMESTAMP
```

---

## 5. API Basic Structure

### Notification Endpoints
```
POST   /notifications             - Send notification (admin)
GET    /notifications             - Get user's notification history
GET    /notifications/:id         - Get notification details
DELETE /notifications/:id         - Delete/archive notification
```

### Preference Endpoints
```
GET    /notification-preferences  - Get user's preferences
PUT    /notification-preferences  - Update preferences
POST   /notification-preferences/unsubscribe - Unsubscribe from type
POST   /notification-preferences/resubscribe - Resubscribe
```

### Device Endpoints
```
GET    /notification-devices      - List user's registered devices
POST   /notification-devices      - Register device for push
DELETE /notification-devices/:id  - Unregister device
```

### Admin Endpoints
```
GET    /admin/notification-templates - List templates
POST   /admin/notification-templates - Create template
PUT    /admin/notification-templates/:id - Update template
DELETE /admin/notification-templates/:id - Delete template
GET    /admin/notification-events - List events
POST   /admin/notification-events - Create/configure event
POST   /admin/notifications/send - Send batch notification
GET    /admin/notifications      - View all notifications
GET    /admin/notifications/analytics - Delivery analytics
```

---

## 6. Permissions

### Public (No Authentication)
- Email unsubscribe link (public URL without auth)
- SMS unsubscribe commands

### Authenticated User
- GET /notification-preferences
- PUT /notification-preferences
- POST /notification-preferences/unsubscribe
- GET /notification-devices
- POST /notification-devices
- DELETE /notification-devices/:id
- GET /notifications (own only)

### Admin Only
- All /admin/notification-* endpoints
- Ability to send notifications
- Template management

---

## 7. Prohibitions

### Absolute Prohibitions
- **Cannot**: Send notifications without explicit user consent
- **Cannot**: Store plaintext phone numbers or emails in logs
- **Cannot**: Send marketing emails without opt-in
- **Cannot**: Spam users (rate limiting enforced)
- **Cannot**: Use notification system for passwords/secrets

### Conditional Prohibitions
- **Unless opted in**: Cannot send marketing notifications
- **Unless verified**: Cannot send SMS/email to new address
- **Unless unsubscribe confirmed**: Cannot remove from list

---

## 8. Security Standards

### Data Protection
- Email addresses and phone numbers encrypted at rest
- Unsubscribe links use secure tokens (not user IDs)
- Bounce data handled carefully (permanent bounces prevent future sends)
- Notification content logged without sensitive data

### Delivery Security
- Rate limiting: Max 10 emails per minute per user
- Bounce detection: Stop sending after permanent bounce
- Validation of email/phone before sending
- SMTP connections use TLS 1.2+

### Template Security
- Templates sanitized to prevent injection
- Variable escaping in templates
- No sensitive data in templates
- Template changes logged and audited

---

## 9. Acceptance Criteria

### Email Notifications
- ✅ Email sent successfully with correct content
- ✅ Variables substituted correctly
- ✅ HTML formatting renders correctly
- ✅ Unsubscribe link works
- ✅ Bounces tracked and handled

### SMS Notifications
- ✅ SMS sent to correct number
- ✅ Message length validated (SMS splitting if needed)
- ✅ Opt-in verified before sending
- ✅ Delivery status tracked

### Push Notifications
- ✅ Push sent to registered device
- ✅ Silent push works (data without alert)
- ✅ Device unregistration works (invalid tokens removed)

### Preferences
- ✅ User can set channel preferences
- ✅ User can set frequency preferences
- ✅ User can unsubscribe from specific types
- ✅ Preferences respected (not sent if opted out)

### Batch Sending
- ✅ Batch notification sends to multiple users
- ✅ Rate limiting prevents spam
- ✅ Batch job tracked and reportable

---

## 10. Integration Points

### External Services
- **Email Provider**: SMTP, SendGrid, AWS SES, etc.
- **SMS Provider**: Twilio, AWS SNS, etc.
- **Push Service**: Firebase Cloud Messaging, APNs, etc.

### Dependency Services
- **Member System** (01_): For user contact info
- **Order System** (09_): For order notifications
- **Payment System** (03_): For payment notifications
- **Shipping System** (04_): For tracking notifications

---

## 11. Configuration Parameters

| Parameter | Default | Min | Max | Notes |
|-----------|---------|-----|-----|-------|
| Email rate limit (per min) | 10 | 1 | 100 | Per user |
| SMS rate limit (per min) | 2 | 1 | 10 | Per user |
| Batch size | 100 | 10 | 10000 | For batch sends |
| Retry attempts | 3 | 1 | 10 | Failed delivery retries |
| Retry delay (hours) | 1 | 0.1 | 24 | Between retries |
| Template cache ttl (hours) | 24 | 1 | 168 | Cache duration |
| Bounce cleanup (days) | 90 | 30 | 365 | Remove old bounces |

---

## 12. Known Dependencies

- **Notification System** depends on **Member System** (01_) for contact info
- **All other modules** use **Notification System** for event-triggered notifications
