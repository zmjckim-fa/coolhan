# POS System - Security Requirements

## Overview

Because the POS system handles cash, cards, and customer information, it requires a high level of security. It must comply with the Payment Card Industry standard (PCI DSS), privacy law, and consumer protection law, monitor all transactions, and detect fraud.

---

## 1. Security Domains

### 1.1 Payment Security

```
Card payment security:
- PCI DSS Level 1 compliance (handling credit card numbers)
- Use only certified payment gateway providers
- Encrypted payment channel (SSL/TLS 1.2 or higher)
- 3D Secure or tokenization (storing card info prohibited)
- Real-time payment approval verification
- Prohibit storing card info in memory
- Encrypted records of all payment transactions

Cash transaction security:
- Verify change accuracy
- Detect fraudulent transactions (excessive cash transactions)
- Cash drawer access logs
- Set cash-on-hand limits by time of day
```

### 1.2 Data Protection

```
Data in transit:
- Encrypt all network communication (TLS 1.2+)
- Prohibit public Wi-Fi connections (mobile POS)
- Use VPN or dedicated lines
- Defend against man-in-the-middle (MITM) attacks

Data at rest:
- Database encryption (AES-256)
- Store personal data encrypted
  ├─ Customer phone number
  ├─ Customer email
  ├─ Customer address
  └─ Member number
- Encrypt sensitive transaction data
- Encrypt backup data
- Password hashing (SHA-256 or higher)
```

### 1.3 Access Control

```
Role-Based Access Control (RBAC):

1. Cashier
   - Permissions: product sales, payment processing; cannot approve refunds
   - Restrictions: cannot edit master data, cannot do end-of-day
   - Login: employee ID + password

2. Register Manager
   - Permissions: cashier permissions + end-of-day, permission settings, transaction cancellation approval
   - Restrictions: cannot edit system settings
   - Login: manager ID + password + 2FA (required)

3. Headquarters Admin
   - Permissions: all permissions + user management, product master, system settings
   - Restrictions: transaction deletion (edit only, leaves audit record)
   - Login: admin ID + password + 2FA (required)

4. Auditor - read-only
   - Permissions: view all transactions, view logs, view reports
   - Restrictions: cannot modify data
   - Login: auditor ID + password
```

### 1.4 Authentication Security

```
Login policy:
- Minimum password length: 8 characters
- Complexity: uppercase/lowercase + number + special character
- Expiry: forced change every 90 days
- Reuse prevention: different from the last 5 passwords
- Failed attempts: lock account after 5 or more (30 minutes)
- Force change of default passwords

Login attempt records:
- Successful login time/IP
- Record of failed attempts
- Monitor login location changes
- Automatic alert on security threats
```

### 1.5 Transaction Security

```
Transaction integrity:
- Digital signature on every transaction
- Prevent tampering of transaction records
  ├─ Hash chain (each transaction includes the hash of the previous transaction)
  ├─ Use a timestamp server (third-party verification)
  └─ Read-only logs (WORM: Write Once Read Many)
- Preserve original on transaction cancellation (recorded as a new transaction)
- Refund/exchange approval process (2 or more people)

Transaction validity:
- No modification after transaction completion (audit record retained)
- Transaction cancellation: record both original + cancellation transaction
- Detect transaction manipulation (monitor changes in amount, date, items)
```

### 1.6 Session Security

```
Session management:
- Session timeout: forced logout after 30 minutes of inactivity
- Session token encryption
- Token expiry: 8 hours (1 business day)
- Prevent session hijacking
  ├─ IP address verification
  ├─ User-Agent verification
  └─ Browser fingerprinting

Multiple session management:
- The same user cannot log in concurrently
- Force-terminate the previous session on new login
- Explicit session invalidation on logout
```

---

## 2. Encryption Standards

### 2.1 Transport Layer Security (TLS)

```
Requirements:
- Minimum TLS 1.2 (recommended: TLS 1.3)
- Use only strong cipher suites
  ├─ TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384
  ├─ TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256
  └─ Disable weak cipher suites

Certificates:
- CA-signed certificate (self-signed not allowed)
- Minimum 2048-bit RSA or EC P-256
- Renewal alert 30 days before expected expiry
- Domain Validation (DV) or higher (Organization Validation recommended)

HSTS (HTTP Strict Transport Security):
- max-age: minimum 31536000 seconds (1 year)
- Include all subdomains
- Include preload header
```

### 2.2 Data at Rest Encryption

```
Database:
- Database-level encryption (TDE: Transparent Data Encryption)
- Encryption algorithm: AES-256
- Key management: external key management service (AWS KMS, Azure Key Vault, etc.)
- Key rotation: every 90 days

Personal data:
- Field-level encryption of customer info fields
- Password hashing: bcrypt or Argon2
- Cookie encryption (HttpOnly, Secure, SameSite)

Backup:
- Encrypt backup data
- Manage backup keys separately
- Test environment: use only masked data
```

### 2.3 Key Management

```
Key generation:
- Use a cryptographically secure random number generator
- Minimum key length: 256 bits

Key storage:
- No hardcoding (use environment variables, key service)
- Physical security (HSM: Hardware Security Module recommended)
- Restricted access (least privilege principle)

Key rotation:
- Scheduled rotation: every 90 days
- Emergency rotation: immediately on security breach
- Archive previous keys (for decryption)

Key disposal:
- Securely delete retired keys
- Maintain disposal records
```

---

## 3. Authentication and Authorization Management

### 3.1 User Authentication

```
Multi-Factor Authentication (MFA):
- Required for admins (admins only)
- Optional for regular staff
- Methods: OTP, SMS, biometrics
  ├─ Time-based OTP (TOTP): valid for 30 seconds
  ├─ SMS OTP: not usable (not recommended, security weakness)
  ├─ Biometrics: fingerprint reader (POS terminal)
  └─ Hardware token (U2F/FIDO2)

Biometric authentication:
- Fingerprint recognition: use POS terminal fingerprint reader
- Facial recognition: consider mask-wearing state
- Enroll on first use (at least 2 fingerprints)
- Periodic re-enrollment: yearly

Password policy:
- Change: every 90 days
- Force change on first login
- Lock account after 3 consecutive failures
- Account unlock: requires admin approval
```

### 3.2 Authorization

```
Basic principles:
- Least Privilege principle
- Role-Based Access Control (RBAC)
- Periodic permission review (quarterly)

Permission assignment:
- New employees: cashier role only (least privilege)
- Experienced employees: role change requires approval
- Departure: immediately block all access
- Leave of absence: automatic suspension (reactivate on return)

Permission delegation:
- Temporary permission: maximum 7 days (explicit approval required)
- Delegation record: when, who, to whom, until when
- Automatic delegation expiry: upon reaching the end date
- Exceptional permissions: approved by admin only

Access permission audit:
- Permission review once a month
- Remove unnecessary permissions
- Monitor permission anomalies (e.g., cashier viewing payroll)
```

### 3.3 Sessions and Logout

```
After login:
- Create session
- Encrypt session ID and store in cookie
- Session duration: extend during real-time traffic (max 8 hours)

Logout:
- Invalidate session immediately
- Delete token
- Record logout time
- Clear cache

Automatic logout:
- Forced logout after 30 minutes of inactivity
- Warning message before logout (1 minute)
- Extend idle timeout during important transactions (during cash transactions)
```

---

## 4. Compliance Requirements

### 4.1 PCI DSS (Payment Card Industry Data Security Standard)

```
PCI DSS Level criteria (based on annual card transaction volume):

Level 1 (high risk):
- 6 million or more Visa transactions per year
- All Amex merchants
- Requirements: quarterly security audit, intrusion detection, highest security

Level 2 (medium risk):
- 1-6 million Visa transactions per year
- High transaction volume for other cards
- Requirements: annual security audit or self-assessment

Level 3 (low risk):
- 20,000-1 million card transactions per year
- Requirements: self-assessment (SAQ)

Level 4 (lowest risk):
- Fewer than 20,000 card transactions per year
- Requirements: self-assessment or attestation

Compliance items:
1. Prohibit storing card data (except last 4 digits of card number)
2. Network encryption (TLS)
3. Install firewall
4. Change default passwords
5. Encrypt card data
6. Security patch management
7. Access control (login required)
8. Track network activity
9. Establish security policy
10. Employee training
11. Regular security audits
12. Establish information security policy

Korea additional requirements:
- Comply with Korea Credit Finance Association card payment standards
- Comply with credit card merchant security standards
```

### 4.2 Privacy Protection

```
GDPR (Europe):
- Consent for personal data collection
- Right of access to personal data (SAR)
- Right to erasure of personal data (RTBF)
- Data Portability
- Breach notification within 72 hours
- Appoint a DPA (for large-scale processing)

Korea Personal Information Protection Act (PIPA):
- Consent for personal data collection (improved consent)
- Disclose privacy policy
- State personal data retention period
- Respond within 10 days to a data subject's access request
- Breach reporting: immediately for 10,000 or more people, without delay otherwise
- Designate a personal data manager

Japan Act on the Protection of Personal Information (APPI):
- Changes to the definition of personal data
- Strengthened regulation of cross-border transfers
- Prohibit third-party provision without consent
```

### 4.3 Tax and Financial Regulations

```
Sales tax (VAT):
- Record tax amount per transaction
- Monthly tax reconciliation
- Quarterly filing
- Tax calculation audit trail

Receipt retention:
- Retain all transaction receipts
- Retain for at least 5 years (Korea: typically 5 years)
- Digital receipts accepted (encrypted storage)
- Tamper prevention (digital signature, barcode)

Transaction records:
- Transaction ID uniqueness (no duplicates)
- Timestamp accuracy (based on server time)
- Modification tracking (no modification, only cancellation allowed)
- Audit trail (who, when, what)
```

### 4.4 Consumer Protection

```
Refund policy:
- Disclose clear refund conditions
- State quantity limits (e.g., within 30 days, proof of receipt)
- Refund deadline: 7-30 days from request date (compliant with law)
- Refund method: return to the original payment method

Transaction details:
- Clear price display (whether tax is included)
- State additional fees
- Display discount application details
- Clear final amount

Customer information protection:
- Prohibit third-party provision of customer info (without consent)
- Respond within 10 days to information access requests
- Process information deletion requests
- Manage consent for sending marketing information
```

---

## 5. Monitoring and Auditing

### 5.1 Audit Logs

```
What to record:

1. Login/logout:
   - User ID
   - Login time
   - Login IP address
   - Login success/failure
   - Logout time
   - Reason on failure

2. Transaction activity:
   - Transaction creation/modification/cancellation
   - Transaction amount
   - Payment method
   - Refund processing
   - Transaction approver
   - Timestamp

3. Permission changes:
   - Changing user
   - Target user
   - Previous permissions
   - New permissions
   - Change time
   - Approver

4. System setting changes:
   - Changed item
   - Previous value
   - New value
   - Changer
   - Change time
   - Approver

5. Data access:
   - Accessing user
   - Access time
   - Range of data accessed
   - Action (view/modify/delete)
   - IP address

Log characteristics:
- Read-only (WORM)
- Encrypted storage
- Centralized storage (local storage + cloud backup)
- Retain for at least 1 year
- Integrity verification with encryption key
```

### 5.2 Monitoring

```
Real-time monitoring:

1. Fraudulent transaction detection:
   - Abnormal-amount transactions (3 or more times the average)
   - Repeated returns by the same customer (5 or more in a week)
   - Refund rate anomaly (10% or more per day)
   - Time-of-day anomalous transactions (large nighttime transactions)

2. Security threats:
   - Repeated login failures (5 or more)
   - Bulk access at abnormal times
   - Unauthorized access attempts
   - Abnormal network activity

3. System anomalies:
   - Response time delays (> 5 seconds)
   - API response rate decline (< 95%)
   - Database connection failures
   - Backup failures

4. Monitoring tools:
   - SIEM (Security Information Event Management)
   - IDS/IPS (intrusion detection/prevention system)
   - Log analysis platform
   - Real-time alerts (Slack, email)
```

### 5.3 Regular Audits

```
Monthly:
- Review login failure patterns
- Review permission anomalies
- Verify transaction sampling (100 random)
- Check inventory accuracy

Quarterly (every 3 months):
- Review all permissions
- Confirm security patch application
- Confirm encryption key rotation
- Confirm security personnel training
- Analyze system logs

Annually:
- External security audit
- Penetration Testing
- PCI DSS compliance check
- Legal compliance review
- Review and update security policy

Audit report:
- Classify findings (high/medium/low)
- Remediation plan
- Remediation deadline
- Assign owner
- Track progress
```

---

## 6. Fraud Detection and Prevention

### 6.1 Fraudulent Transaction Patterns

```
Single-transaction fraud:
- Confirm transaction amount is '0' or more
- Barcode manipulation (impossible discount rate)
- Selling expired products
- Selling out-of-stock products
- Exchange rate error transactions

Cumulative pattern fraud:
- Repeated returns by the same customer (5 or more within 7 days)
- Transactions outside store hours (no login record)
- Refund rate anomaly per cashier (20% or more)
- Repeated large transactions only at night
- Attempts to issue false receipts

Refund fraud:
- Refund records without a transaction
- Refunds without an original transaction
- Excessive refunds (exceeding the original transaction amount)
- Refunds outside store hours
- Refunding another employee's transaction (admin approval required)
```

### 6.2 Preventive Measures

```
Technical prevention:
- Automatic transaction verification (amount, tax calculation accuracy)
- Barcode check-digit verification
- Duplicate transaction detection (same transaction duplicated within 30 seconds)
- Stock check (confirm stock before sale)
- Price ceiling (transactions requiring store manager approval)

Operational prevention:
- Two-person verification (refunds, discounts of 20% or more)
- Separate register staff (different people for sales/payment)
- Daily reconciliation comparison (expected vs actual)
- Transaction record review (investigate abnormal transactions)
- Staff rotation (change placements weekly)

Organizational prevention:
- Regular training (quarterly security training)
- Grievance handling (channel for employee complaints)
- Motivation (reduce performance pressure)
- Monitoring notice (CCTV signage, audit disclosure)
```

### 6.3 Post-Detection Measures

```
Suspicious transaction found:
1. Immediately stop the transaction
2. Collect transaction records
3. Investigate involved personnel
4. Determine the cause

When fraud is detected:
1. Collect evidence (logs, video, witnesses)
2. Temporary measures (suspend account, revoke permissions)
3. Write investigation report
4. Report to management
5. Legal action (police report, civil lawsuit)
6. Employee action (warning, discipline, dismissal)

Reporting:
- Monthly fraudulent transaction report
- Track loss amount
- Recurrence prevention measures
- Policy improvements
```

---

## 7. Incident Response

### 7.1 Security Incident Classification

```
Severity levels:

Critical:
- Data breach (customer information)
- Complete system paralysis (all stores)
- Mass fraudulent transactions (1,000,000 KRW or more)
- Card payment system breach
→ Immediate response, report to senior management

High:
- Partial system outage (1 hour or more)
- Small-scale data breach (fewer than 100 records)
- Fraudulent transactions (100,000-1,000,000 KRW)
- Personal data access anomaly
→ Respond within 1 hour

Medium:
- 30-minute to 1-hour system outage
- Personal data access violation (unauthorized lookup)
- Repeated login failures
→ Respond within 4 hours

Low:
- Abnormal data (console errors, slow performance)
- Minor permission anomalies
→ Respond within 24 business hours
```

### 7.2 Response Procedure

```
Detection stage:
1. Detect anomalies (monitoring or report)
2. Determine severity
3. Convene response team
4. Temporary measures (block access, etc.)

Investigation stage:
1. Identify incident scope (affected systems, affected data)
2. Root cause analysis
3. Collect evidence (logs, memory, disk)
4. Reconstruct timeline

Resolution stage:
1. Isolate system (prevent spread of infection)
2. Remove malware / restore from backup
3. Patch vulnerability
4. Restore and test system
5. Resume normal operation

Reporting stage:
1. Report to management (according to severity)
2. Legal reporting (if needed, to police, etc.)
3. Customer notification (on data breach)
4. Media response
5. Post-Incident Review

Expected response times:
- Detection: 5 minutes
- Initial response: 15 minutes
- Root cause analysis: 1 hour
- Recovery: 2-4 hours
- Full normalization: 24 hours
```

### 7.3 Reporting and Notification

```
Internal reporting:
- Immediately: CEO, CTO, Legal
- Within 1 hour: all department heads
- Daily: all staff (emergency notice)

External reporting:
- Report data breaches to the Personal Information Protection Commission within 72 hours (GDPR standard, also applied in Korea)
- Report to the financial regulator (on payment system breach)
- Report to police (on clear crime)
- Media response (on large-scale breach)

Customer notification:
- Identify affected customers
- Notification channels (email, SMS, mail)
- Notification content: incident description, impact, mitigation, compensation
- Operate a hotline (handle inquiries)
- Provide credit monitoring service (on credit card breach)
```

---

## 8. Security Testing

### 8.1 Test Types

```
Static Analysis:
- Scan code for security vulnerabilities
- Dependency library vulnerabilities
- Run automatically on every build
- Check OWASP Top 10

Dynamic Analysis:
- Test security vulnerabilities during execution
- Input validation testing
- Memory leak detection
- Identify performance bottlenecks

Penetration Testing:
- Performed by a verified external security firm
- Quarterly (or twice a year)
- Scope: entire system
- Write report and remediate

OWASP Top 10 testing:
1. Authentication bypass
2. Session token theft
3. SQL injection
4. XSS (Cross-Site Scripting)
5. CSRF (Cross-Site Request Forgery)
6. Unauthenticated access
7. Insufficient logging
8. Security misconfiguration
9. Sensitive data exposure
10. XML External Entity attack
```

### 8.2 Test Environment

```
Test environment setup:
- Same structure as production
- Use a masked copy of production data
- Use only test accounts (real customer accounts prohibited)
- Independent infrastructure (separated from production)

Test data:
- Remove customer real names (hash or masking)
- Mask credit card numbers (last 4 digits only)
- Keep only region/carrier info (for statistics)
- Create separate test accounts

Test results:
- Vulnerability grade (Critical, High, Medium, Low)
- Reproducibility
- Impact analysis
- Set remediation deadline
- Periodic retesting (after patching)
```

---

## 9. Security Training and Policy

### 9.1 Employee Training

```
New-hire training (first week of employment):
- POS system security overview
- Password policy
- Access control rules
- Data protection obligations
- Fraud detection
- Incident reporting procedure

Regular training (quarterly, 1 hour):
- New security threats
- Updated policies
- Analysis of actual incident cases
- Security best practices

Manager training (quarterly, 2 hours):
- Advanced permission management
- Monitoring and observation
- Incident response
- PCI DSS compliance

Training records:
- Maintain attendance roster
- Comprehension test (80% or higher required)
- Track and re-train non-completers
- Annual training hours attestation (required by regulation)
```

### 9.2 Policy Documents

```
Required security policies:

1. Access control policy
   - User management
   - Permission assignment rules
   - Permission review cycle

2. Data protection policy
   - Personal data handling
   - Encryption standards
   - Backup and recovery

3. Password policy
   - Complexity requirements
   - Expiry and change cycle
   - Reuse restrictions

4. Incident response policy
   - Security incident classification
   - Reporting procedure
   - Response members

5. Monitoring and logging policy
   - What to record
   - Retention period
   - Access permissions

6. Third-party management policy
   - Vendor security requirements
   - Data sharing agreements
   - Regular audits

All policies:
- Review and update once a year
- Record change history
- Signed consent (employees)
- State disciplinary rules for violations
```

---

## 10. Security Checklists

### 10.1 Pre-Deployment Checklist

```
[ ] Enable database encryption (AES-256)
[ ] Set TLS 1.2 or higher (TLS 1.3 recommended)
[ ] Install and verify SSL certificate
[ ] Set HSTS header
[ ] Change default accounts (remove admin/admin)
[ ] Configure firewall (open only necessary ports)
[ ] Configure logging system (centralized)
[ ] Automate and test backups
[ ] Install intrusion detection system
[ ] Configure SIEM
[ ] Complete external security audit
[ ] Confirm PCI DSS compliance
[ ] Confirm privacy law compliance
[ ] Complete security testing (static, dynamic)
[ ] Complete penetration testing
[ ] Complete employee security training
[ ] Publish security policy
[ ] Form incident response team
[ ] Prepare 24/7 monitoring
[ ] Register emergency contacts
```

### 10.2 Operational Regular Checklist

```
Daily:
[ ] Review logs (suspicious activity)
[ ] Confirm system is operating normally
[ ] Confirm backup completion

Weekly:
[ ] Review fraudulent transaction patterns
[ ] Check and investigate security alerts
[ ] Review permission anomalies

Monthly:
[ ] Analyze audit logs
[ ] Review permissions
[ ] Verify transaction samples (100)
[ ] Check encryption key status

Quarterly:
[ ] Apply security patches
[ ] Rotate encryption keys
[ ] Inspect external monitoring system
[ ] Test backup recovery
[ ] Conduct security training

Annually:
[ ] External security audit
[ ] Penetration testing
[ ] PCI DSS compliance check
[ ] Review and update policies
[ ] Renew security policy signatures (employees)
```

---

These security requirements are the minimum standard that all POS systems must comply with. Additional requirements may apply according to local laws and industry standards.
