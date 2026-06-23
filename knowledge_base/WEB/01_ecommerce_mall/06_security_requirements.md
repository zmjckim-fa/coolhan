# E-Commerce Mall - Security Requirements

## 1. Data Security

### 1.1 Privacy Protection
```
Requirements:
- Establish and publish a privacy policy
- Collect data with user consent
- Data minimization principle (collect only necessary information)
- Maintain accuracy of information
- Restrict use of information (within the scope of the collection purpose)
- Provide right to data deletion (GDPR)
- Handle personal data disclosure requests
```

### 1.2 Personal Data Encryption
```
Encryption at rest:
- Passwords: bcrypt, scrypt, PBKDF2 (at least 120,000 iterations)
- Credit card info: AES-256 (but should not be stored directly; handled by PG)
- Resident registration number: AES-256
- Phone number: AES-256 (or masking: 010-****-5678)
- Email: AES-256

Encryption in transit:
- HTTPS/TLS 1.2 or higher (all communication)
- Verify SSL certificate validity
- Enable HSTS (HTTP Strict-Transport-Security)
```

### 1.3 Data Backup
```
Backup policy:
- Daily automatic backup
- Weekly full backup
- Monthly off-site backup
- Encrypt backup data
- Periodic recovery testing (monthly)

Backup retention:
- Retain for at least 3 months
- Store in encrypted form
- Access control (only authorized personnel)
- Store in different locations (geographic distribution)
```

---

## 2. Payment Security

### 2.1 PCI DSS Compliance
```
PCI DSS (Payment Card Industry Data Security Standard) requirements:

1. Prohibit direct storage of card data
   - Tokens issued by PG (Payment Gateway)
   - Store and use only tokens
   - Card info kept only on PG servers

2. Encrypt communication
   - HTTPS/TLS 1.2 or higher
   - Encrypt all card data transmission

3. Access control
   - Separate permissions per employee
   - Least privilege principle
   - Record access logs

4. Regular security monitoring
   - Intrusion Detection System (IDS)
   - Intrusion Prevention System (IPS)
   - Firewall configuration

5. Security testing
   - Penetration testing at least once a year
   - Regular vulnerability scanning
```

### 2.2 Payment Validation
```
Payment amount validation:
- Client: calculate order amount × quantity
- Server: validate once more
- PG: final validation
- Payment is approved only if all three match

Duplicate payment prevention:
- Check for duplicate payment ID (Transaction ID)
- Block duplicate payments for the same order
- Process after checking payment status

Anomalous transaction detection:
- Monitor bulk purchases within a short time
- Monitor abnormal-amount transactions
- Block overseas payments (per policy)
- Block transactions from high-risk countries
- Machine-learning-based anomaly detection
```

### 2.3 Refund Security
```
Refund policy:
- Refund to the original payment method
- Refund approval process (double confirmation)
- Record and audit refund logs
- Refunds cannot be reverted (only monitored)

Tampering prevention:
- Refund amount cannot be modified
- Record refund evidence (screenshots, logs)
- Admin monitoring
```

---

## 3. Account Security

### 3.1 Password Policy
```
Strength requirements:
- Minimum length: 8 characters or more
- Required combination: uppercase + lowercase + number + special character
- Allowed: ~!@#$%^&*()_+-=[]{}|;:",.<>?/

Password management:
- Prompt password change (every 90 days)
- Prevent reuse of previous passwords (last 5)
- Auto-expire temporary passwords (24 hours)
```

### 3.2 Multi-Factor Authentication
```
2FA options:
1. Email verification (weak)
2. SMS verification (medium)
3. App authenticator (Google Authenticator, Authy) (strong)
4. Biometric authentication (fingerprint, face) (strongest)

2FA mandatory for:
- Admin accounts (required)
- Seller accounts (required)
- Regular users (optional, recommended)
```

### 3.3 Session Management
```
Token issuance:
- Use JWT (JSON Web Token)
- Signing (HS256 or RS256)
- Expiry time: 1 hour
- Refresh Token: 30 days

Session security:
- HttpOnly cookies (no JavaScript access)
- Secure flag (HTTPS only)
- SameSite=Strict (CSRF prevention)
- Session timeout (30 minutes of inactivity)

Session tracking:
- Log session creation/termination
- Detect IP changes (require re-authentication)
- Limit concurrent sessions (up to 2)
```

### 3.4 Account Lockout
```
Login attempt limiting:
- Temporarily lock account after 5 failures (30 minutes)
- Long lock account after 10 failures (24 hours)
- Manual unlock by admin possible

Suspicious activity detection:
- Unusual login location (e.g., a new country)
- Unusual login time
- Simultaneous login from multiple devices

Notifications:
- Email notification on login from a new device
- Password change notification
- Account lockout notification
```

---

## 4. Network Security

### 4.1 HTTPS/TLS
```
Requirements:
- TLS 1.2 or higher (1.3 recommended)
- Certificate: minimum 2048-bit RSA
- Certificate renewal: auto-renew 90 days before expiry
- Redirect all HTTP requests to HTTPS

HSTS (HTTP Strict-Transport-Security):
- Enable: required
- max-age: 31536000 seconds (1 year) or more
- includeSubDomains: included
- preload: recommended

Certificate verification:
- Self-signed certificates prohibited
- Issued by a trusted CA (Certificate Authority)
- Use OCSP Stapling (speed up certificate validity checks)
```

### 4.2 Firewall
```
Configuration:
- DDoS defense
- Enable WAF (Web Application Firewall)
- Block abnormal traffic
- Block port scans
- Regional IP whitelist/blacklist

Monitoring:
- Real-time traffic monitoring
- Suspicious activity detection
- Automatic blocking and alerting
```

### 4.3 API Security
```
Request validation:
- Request signing (HMAC)
- Rate limiting (limit API call count)
- IP whitelisting (optional)

Response security:
- Prevent exposure of sensitive information
- Minimize error messages (no external disclosure)
- Hide stack traces

API version management:
- Specify support period for old versions
- Deprecation notice (90 days in advance)
```

---

## 5. Application Security

### 5.1 Code Security
```
SQL Injection prevention:
- Parameterized queries (Prepared Statements)
- Use ORM (Hibernate, SQLAlchemy)
- Validate and escape input

XSS (Cross-Site Scripting) prevention:
- Sanitize user input
- HTML encoding
- Set Content Security Policy (CSP)

CSRF (Cross-Site Request Forgery) prevention:
- Use CSRF tokens
- SameSite cookie attribute
- Validate Origin/Referer

Security headers:
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Strict-Transport-Security: ...
```

### 5.2 Input Validation
```
Client validation (UX):
- Email format validation
- Phone number format validation
- Required field check
- File size limit

Server validation (required):
- Re-validate all inputs
- Type validation
- Length validation
- Range validation
- Whitelist validation (where possible)

File upload:
- File size limit (max 5MB)
- File type validation (whitelist)
- Virus scan
- Rename file (security)
- Store on a separate server (CDN)
```

### 5.3 Logging and Monitoring
```
Logging:
- Record all API calls
- Authentication attempts (success/failure)
- Permission changes
- Data access (sensitive info)
- Admin actions
- Errors and exceptions

Log security:
- Mask sensitive information (passwords, tokens)
- Centralized logging system
- Log encryption
- Log retention period: at least 1 year
- Log tamper prevention

Monitoring:
- Real-time alerts
- Suspicious activity detection
- Performance monitoring
- Capacity monitoring
```

---

## 6. Operational Security

### 6.1 Access Control (IAM)
```
Permissions by role:
- Admin: all permissions
- Seller: only their own products/orders
- Customer service: view customer info, edit orders
- Developer: view logs, debug (restricted in production)

Least privilege principle:
- Grant only necessary permissions
- Periodic permission review (quarterly)
- Immediately revoke permissions for departed staff
- Log permission changes
```

### 6.2 Security Updates
```
Patch management:
- Monitor security vulnerabilities (CVE)
- Patch testing (test environment)
- Emergency patch: deploy within 1 day
- Regular patch: deploy weekly
- Establish rollback plan

Dependency management:
- Regular vulnerability scanning (OWASP Top 10)
- Upgrade outdated libraries
- License verification
```

### 6.3 Development Environment Security
```
Developer accounts:
- Strong password policy
- 2FA required
- SSH key-based authentication

Code review:
- All code review required
- Security expert participation
- Use static analysis tools (SAST)
- Use dynamic analysis tools (DAST)

Version control:
- Prohibit committing sensitive info (.env, secrets)
- Sign commits (GPG)
- Validate pull requests
```

### 6.4 Deployment Security
```
Deployment process:
- Change tracking (Change Log)
- Approval workflow (development → test → production)
- Automated testing (CI/CD)
- Deployment rollback plan

Production environment:
- Separate production database
- Restrict developer access to production
- Monitoring and alerting
- Backup and recovery plan
```

---

## 7. Compliance

### 7.1 Legal Requirements
```
Personal Information Protection Act (PIPA):
- Establish privacy policy
- Designate a privacy officer
- Data processing agreements
- Manage data processors

E-Commerce Act:
- Disclose business information
- Product information accuracy
- State refund policy
- State cancellation policy

Information Security Management System (ISMS):
- Establish security policy
- Periodic monitoring and assessment
- Employee training
- External audit
```

### 7.2 Audit
```
Regular audits:
- Quarterly internal security audit
- Annual external security audit
- Penetration testing (at least once a year)
- Code security review

Audit records:
- Record audit plans and results
- Vulnerability management (discovery → resolution → verification)
- Track improvements
```

---

## 8. Personnel Security

### 8.1 Employee Training
```
Security training:
- New-hire security training (required)
- Security training at least twice a year
- Phishing response drills
- Case studies

Access permission training:
- Password management
- Information handling
- Social Engineering response
```

### 8.2 Background Checks
```
Pre-hire screening:
- Identity verification
- Career verification
- Criminal record check (if needed)

Departure procedure:
- Revoke all access permissions
- Confirm data return
- Sign security pledge
```

---

## 9. Incident Response

### 9.1 Incident Classification
```
Severity:
- Critical: full service outage, mass data breach
- High: partial service outage, sensitive data breach
- Medium: limited service impact, personal data exposure
- Low: minor security issue

Response time:
- Critical: within 15 minutes
- High: within 1 hour
- Medium: within 4 hours
- Low: within 24 hours
```

### 9.2 Incident Response Procedure
```
1. Detection and reporting
   - Notify security team
   - Initial assessment
   - Assign incident number

2. Investigation
   - Identify scope
   - Determine impact range
   - Analyze logs

3. Response
   - Isolate service
   - Temporary defensive measures
   - Establish recovery plan

4. Recovery
   - Resolve impacted areas
   - Restore service
   - Strengthen monitoring

5. Post-incident handling
   - Root cause analysis
   - Apply improvements
   - Notify customers
```

### 9.3 Notification and Compensation
```
Customer notification:
- Timing: as soon as possible (within 72 hours of the incident)
- Content: what happened, impact range, response measures, contact info
- Channels: email, website, news

Customer compensation:
- Credit card monitoring service (free)
- Points compensation
- Insurance support (if needed)
```

---

## 10. Security Tools and Services

```
Static analysis (SAST):
- SonarQube
- Checkmarx
- Fortify

Dynamic analysis (DAST):
- Burp Suite
- OWASP ZAP

Comprehensive management:
- Qualys VMDR
- Rapid7 Nexpose

Log management:
- ELK (Elasticsearch, Logstash, Kibana)
- Splunk
- Datadog

Monitoring:
- Datadog
- New Relic
- CloudFlare
```

---

## What to Read Next

1. **07_spec_template.md** - Specification template
