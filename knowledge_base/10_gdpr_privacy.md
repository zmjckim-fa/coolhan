# 10_gdpr_privacy.md - GDPR & Privacy Domain Module

## Overview
The GDPR & Privacy module handles data protection compliance, user privacy rights (access, portability, deletion), consent management, data retention, and regulatory compliance. This module ensures the application complies with GDPR, CCPA, and other privacy regulations.

---

## 1. Terminology Definition

| Term | Definition | Example |
|------|-----------|---------|
| **Personal Data** | Any information relating to an identifiable person | Name, email, IP address |
| **Processing** | Any operation on personal data | Collection, storage, analysis |
| **Data Subject** | Person whose data is being processed | Customer, user, visitor |
| **Data Controller** | Entity deciding how to process data | Company/business |
| **Data Processor** | Entity processing data on controller's behalf | Payment processor, email service |
| **Consent** | Explicit agreement to process data | Opt-in checkbox, explicit choice |
| **Legitimate Interest** | Reason to process data without consent | Fraud prevention, business operations |
| **Right to Access** | Data subject can request own data | GDPR Article 15 |
| **Right to Deletion** | Data subject can request data deletion | GDPR Article 17 "Right to be Forgotten" |
| **Data Portability** | Data subject can receive data in standard format | GDPR Article 20 |
| **Data Breach** | Unauthorized access to personal data | Hack, theft, accidental disclosure |
| **Data Retention** | How long data is kept | 7 years for financial records |
| **DPA** | Data Processing Agreement with processor | Contract with payment provider |
| **Privacy Notice** | Disclosure of data collection/use | Privacy Policy |
| **Cookie** | Small file storing user data | Session cookie, tracking cookie |

---

## 2. Basic Functions

### 2.1 Consent Management
- **Purpose**: Collect and track user consent for data processing
- **Input**: Consent type (marketing, analytics, cookies), user preference
- **Process**: Record consent type, timestamp, IP, method → Store in audit trail → Respect in future operations
- **Output**: Consent recorded and tracked
- **Error Handling**: User withdraws consent, consent expires

### 2.2 Right to Access (Data Export)
- **Purpose**: Provide user with copy of their personal data
- **Input**: User/data subject ID
- **Process**: Gather all personal data → Format in readable format (JSON, CSV, XML) → Generate file → Send to user
- **Output**: Data export file delivered
- **Error Handling**: Data not found, file generation timeout

### 2.3 Right to Deletion (Erasure)
- **Purpose**: Delete user's personal data (right to be forgotten)
- **Input**: User ID, optional deletion reason
- **Process**: Verify request → Plan deletions → Check data dependencies → Anonymize or delete → Verify removal
- **Output**: Data deleted/anonymized
- **Error Handling**: Data cannot be deleted (legal obligation), data still needed

### 2.4 Data Portability
- **Purpose**: Provide user data in portable standard format
- **Input**: User ID, preferred format (JSON, CSV, XML)
- **Process**: Gather data → Format in standard format → Include structured, commonly-used, machine-readable format
- **Output**: Data package in standard format
- **Error Handling**: Format not supported, data too large

### 2.5 Privacy Notice/Consent Dialog
- **Purpose**: Inform user about data collection and get consent
- **Input**: Page/context type, required consents
- **Process**: Display privacy notice → Request explicit consent → Record selections → Respect in future
- **Output**: Consent collected
- **Error Handling**: User declines, user doesn't respond

### 2.6 Cookie Management
- **Purpose**: Manage website cookies with user consent
- **Input**: Cookie type (essential, analytics, marketing)
- **Process**: Only set essential cookies → Request consent for others → Store preference → Respect preference
- **Output**: Appropriate cookies set/not set
- **Error Handling**: Cookies blocked by browser

### 2.7 Data Breach Notification
- **Purpose**: Notify affected users and authorities of data breach
- **Input**: Breach details (data involved, affected users, discovered date)
- **Process**: Assess breach → Notify authorities if required → Notify affected users → Document incident
- **Output**: Notifications sent, incident documented
- **Error Handling**: Too many users to notify, authority contact information missing

### 2.8 Data Retention Management
- **Purpose**: Automatically delete data after retention period expires
- **Input**: Data type, retention period
- **Process**: Schedule deletion → Execute at expiration → Log deletion → Verify removal
- **Output**: Old data deleted per schedule
- **Error Handling**: Data still needed, deletion fails

### 2.9 Third-Party Consent
- **Purpose**: Manage consent for third-party data processors
- **Input**: Third party, data types, processing purpose
- **Process**: Update privacy notice → Obtain user consent → Sign DPA → Document processor
- **Output**: Processor documented and consented
- **Error Handling**: No DPA signed, processor adds new processing purpose

### 2.10 Privacy Audit
- **Purpose**: Audit data processing activities and compliance
- **Input**: Date range, data type, processing activity
- **Process**: Query processing logs → Verify consent obtained → Check retention compliance → Generate audit report
- **Output**: Audit report with compliance findings
- **Error Handling**: No logs found, audit timeout

---

## 3. Status Values

| Status | Description | Transitions | Business Rules |
|--------|-------------|-----------|-----------------|
| **Pending** | Awaiting user action or response | → Active, Denied | Waiting for consent |
| **Active** | Consent given or right granted | → Withdrawn, Completed | Processing authorized |
| **Denied** | User declined consent | None (final) | Cannot process |
| **Withdrawn** | User withdraws previous consent | → Active (if reapply) | Stop processing |
| **Completed** | Data deletion/export completed | None (final) | Request fulfilled |
| **Breached** | Data breach occurred | → Notified, Investigated | Incident recorded |
| **Notified** | User notified of breach | → Remedied | User informed |
| **Investigated** | Breach investigation completed | None (final) | Report generated |

---

## 4. Database Basic Structure

### Core Tables

#### consent_records
```
- id (PK): UUID/INT
- member_id (FK): UUID/INT
- consent_type: VARCHAR(50) (marketing, analytics, cookies, third_party, etc.)
- consent_version: INT (version of consent form)
- consent_given: BOOLEAN
- consent_date: TIMESTAMP
- consent_ip: VARCHAR(45)
- consent_method: VARCHAR(50) (checkbox, button_click, email_confirmation)
- user_agent: VARCHAR(500)
- withdrawal_date: TIMESTAMP (if withdrawn)
- created_at: TIMESTAMP
```

#### data_processing_activities
```
- id (PK): UUID/INT
- processing_name: VARCHAR(255)
- data_categories: JSON (personal data types processed)
- purpose: VARCHAR(255)
- legal_basis: VARCHAR(100) (consent, legitimate_interest, contract, legal_obligation, vital_interests, public_task)
- recipients: JSON (third parties receiving data)
- retention_period: VARCHAR(100) (e.g., "Until account deletion")
- data_subject_rights: JSON (access, erasure, portability, objection)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### data_access_requests
```
- id (PK): UUID/INT
- member_id (FK): UUID/INT
- request_type: ENUM(access, deletion, portability, objection)
- status: ENUM(pending, in_progress, completed, denied)
- request_date: TIMESTAMP
- requested_deadline: TIMESTAMP (30 days from request)
- completed_at: TIMESTAMP
- notes: TEXT
```

#### data_deletion_queue
```
- id (PK): UUID/INT
- member_id (FK): UUID/INT
- data_type: VARCHAR(50) (account, profile, transactions, etc.)
- scheduled_deletion: TIMESTAMP
- actual_deletion: TIMESTAMP
- reason: VARCHAR(255)
```

#### data_breaches
```
- id (PK): UUID/INT
- breach_name: VARCHAR(255)
- discovery_date: TIMESTAMP
- data_categories_involved: JSON
- affected_count: INT (estimated number of affected users)
- breach_severity: ENUM(low, medium, high, critical)
- root_cause: TEXT
- notification_required: BOOLEAN (required by regulation)
- authority_notified: BOOLEAN
- authority_notification_date: TIMESTAMP
- users_notified: BOOLEAN
- users_notification_date: TIMESTAMP
- remediation_steps: TEXT
- created_at: TIMESTAMP
```

#### processing_activity_log
```
- id (PK): UUID/INT
- member_id (FK): UUID/INT
- processing_activity_id (FK): UUID/INT
- action: VARCHAR(100) (collected, used, shared, deleted)
- context: VARCHAR(255) (reason for processing)
- timestamp: TIMESTAMP
```

#### third_party_dpas
```
- id (PK): UUID/INT
- third_party_name: VARCHAR(255)
- data_processor_type: VARCHAR(50) (payment, email, analytics, hosting, etc.)
- dpa_executed: BOOLEAN
- dpa_date: DATE
- data_categories: JSON
- approved_by: UUID/INT
- renewal_date: DATE
- last_audited: DATE
- notes: TEXT
```

#### cookies
```
- id (PK): UUID/INT
- cookie_name: VARCHAR(100)
- cookie_type: ENUM(essential, functional, analytics, marketing)
- purpose: VARCHAR(255)
- expiration_days: INT
- requires_consent: BOOLEAN
- third_party_provider: VARCHAR(255)
- created_at: TIMESTAMP
```

---

## 5. API Basic Structure

### User Privacy Rights Endpoints
```
POST   /privacy/access            - Request access to personal data
GET    /privacy/access/:requestId - Check access request status
POST   /privacy/delete            - Request deletion (right to be forgotten)
POST   /privacy/portability       - Request data export
GET    /privacy/requests          - List user's privacy requests
```

### Consent Endpoints
```
GET    /privacy/consent-status    - Get user's current consents
POST   /privacy/consent           - Give/update consent
POST   /privacy/consent/withdraw  - Withdraw consent
GET    /privacy/consent/history   - View consent history
```

### Cookie Endpoints
```
GET    /privacy/cookies           - Get cookie preferences
PUT    /privacy/cookies           - Update cookie preferences
GET    /cookies-notice            - Get cookie notice
```

### Admin Compliance Endpoints
```
GET    /admin/privacy/data-activities - List all processing activities
POST   /admin/privacy/data-activities - Document processing activity
PUT    /admin/privacy/data-activities/:id - Update activity
GET    /admin/privacy/breaches    - List breaches
POST   /admin/privacy/breaches    - Report new breach
PUT    /admin/privacy/breaches/:id - Update breach status
POST   /admin/privacy/notification - Send breach notification
GET    /admin/privacy/requests    - List all privacy requests
GET    /admin/privacy/audit       - Privacy audit report
```

---

## 6. Permissions

### Authenticated User
- POST /privacy/access (own data only)
- GET /privacy/access/:requestId (own requests only)
- POST /privacy/delete (own data only)
- POST /privacy/portability (own data only)
- GET /privacy/requests (own only)
- GET /privacy/consent-status (own only)
- POST /privacy/consent (own only)
- PUT /privacy/cookies (own only)

### Admin Only
- All /admin/privacy/* endpoints

---

## 7. Prohibitions

### Absolute Prohibitions
- **Cannot**: Deny GDPR right without documented valid reason
- **Cannot**: Process personal data without documented consent or legal basis
- **Cannot**: Retain data beyond documented retention period
- **Cannot**: Share data with unauthorized third parties
- **Cannot**: Ignore data breach over 1000 users without authority notification
- **Cannot**: Process special categories of data without explicit consent
- **Cannot**: Use user data for undisclosed purposes

### Conditional Prohibitions
- **Unless consent given**: Cannot use for marketing, analytics, or non-essential
- **Unless legal obligation**: Cannot keep data past retention period
- **Unless authority requires**: Cannot delay breach notification
- **Unless DPA signed**: Cannot use third-party processors

---

## 8. Security Standards

### Consent Management
- Consent explicitly recorded with timestamp and method
- Granular consent (separate for each purpose)
- Default to no consent (opt-in, not opt-out)
- Consent proof archived for dispute resolution
- Withdrawal possible at any time

### Data Subject Rights
- Right to access: Provide within 30 days
- Right to deletion: Honor within 30 days (unless exception)
- Right to portability: Provide in standard format
- Right to objection: Implement preferences

### Data Protection
- Minimize data collection (collect only what needed)
- Data minimization in retention (delete when no longer needed)
- Secure deletion (not just marking deleted, but overwriting)
- Encryption at rest and in transit

### Breach Response
- Detection and notification within 72 hours
- User notification within 72 hours if high risk
- Authority notification as required by regulation
- Incident documentation and remediation

---

## 9. Acceptance Criteria

### Consent Management
- ✅ Consent form presented before data collection
- ✅ Separate consent options for each purpose
- ✅ Consent recorded with timestamp and IP
- ✅ User can withdraw consent
- ✅ Withdrawal respected immediately (no future processing)

### Right to Access
- ✅ User can request data export
- ✅ Export provided within 30 days
- ✅ Data in standard, readable format
- ✅ Includes all personal data held

### Right to Deletion
- ✅ User can request deletion
- ✅ Deletion completed within 30 days
- ✅ Data actually removed (not just marked deleted)
- ✅ Confirmation provided to user

### Cookies
- ✅ Essential cookies set by default
- ✅ Other cookies require consent
- ✅ Cookie preferences respected
- ✅ Cookie banner/notice displayed

### Data Breaches
- ✅ Breach detected and logged
- ✅ Authorities notified within 72 hours (if required)
- ✅ Affected users notified within 72 hours (if high risk)
- ✅ Remediation steps documented

### Privacy Audit
- ✅ Processing activities documented
- ✅ Consent compliance verified
- ✅ Retention compliance checked
- ✅ Third-party compliance verified
- ✅ Audit report generated

---

## 10. Integration Points

### Dependency Services
- **Member System** (01_): Personal data storage
- **Notification System** (06_): User notifications
- **Admin System** (05_): Compliance management
- **All modules**: Must respect consent and privacy settings

### Integration Hooks
- On data collection: Record processing activity, verify consent
- On user request: Queue for processing
- On retention expiry: Schedule deletion
- On breach: Notify authorities and users
- On consent withdrawal: Stop relevant processing

---

## 11. Configuration Parameters

| Parameter | Default | Min | Max | Notes |
|-----------|---------|-----|-----|-------|
| Right to access deadline (days) | 30 | 30 | 60 | GDPR requirement |
| Right to deletion deadline (days) | 30 | 30 | 60 | GDPR requirement |
| Breach notification deadline (hours) | 72 | 24 | 168 | GDPR requirement |
| Data retention (default) | 3 | 0 | 7 | Years after last use |
| Cookie consent banner timeout | auto | - | - | When to show banner |
| Third-party audit frequency | annually | - | - | DPA review schedule |
| Privacy audit frequency | annually | - | - | Internal audit |

---

## 12. Known Dependencies

- **GDPR & Privacy** integrates with ALL modules:
  - **Member System** (01_): Consent, access, deletion
  - **Shopping Mall** (02_): Purchase data retention
  - **Payment System** (03_): Payment data retention
  - **Shipping Logistics** (04_): Address data deletion
  - **Admin System** (05_): Compliance management
  - **Notification System** (06_): Consent in notifications
  - **Inventory Management** (08_): No personal data
  - **Order Management** (09_): Order data retention
- **GDPR & Privacy** is foundational - all modules must respect privacy settings
