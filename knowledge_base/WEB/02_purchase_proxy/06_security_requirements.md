# Purchase Proxy SaaS — Security Requirements

## 1. Authentication & Authorization

### JWT Strategy
```
Access Token:  15-minute expiry, signed HS256
Refresh Token: 7-day expiry, stored in HttpOnly cookie
Rotation:      refresh invalidates old refresh token (single-use)

Admin JWT:     separate signing secret from user JWT
               AdminUser entity separate from User entity
               RBAC: SUPER_ADMIN | ADMIN | VIEWER roles
```

### OAuth Security
```
Naver OAuth:
  - State parameter: random UUID per request, verified on callback
  - Token stored server-side only; never exposed to frontend

Kakao OAuth:
  - Same state parameter pattern
  - Scope review required for phone_number + name (Kakao approval process)
  - Default scope: account_email only until approved
```

### Session Security
```
Admin access logs: AdminAccessLog { adminId, ip, userAgent, action, createdAt }
Suspicious login detection: multiple failed attempts → temporary lockout
```

---

## 2. Payment Security

### PCI-DSS Compliance
```
Card data: NEVER stored on application servers
Stripe Checkout: payment form hosted entirely by Stripe (SAQ-A compliance)
PayPal: payment form hosted entirely by PayPal
→ Application only handles payment intent IDs, never raw card data
```

### Webhook Verification (Critical)
```
Stripe:
  STRIPE_WEBHOOK_SECRET must be configured per environment
  stripe.webhooks.constructEvent() with raw body (not parsed JSON)
  Return 400 on signature failure; NEVER process unsigned events

PayPal:
  Verify X-PAYPAL-TRANSMISSION-SIG using PayPal API
  Reject any event without valid signature

Deduplication (both):
  PaymentWebhookEvent table with UNIQUE(provider, eventId)
  Idempotent processing: ignore already-processed eventIds
```

### Idempotency
```
Each checkout session: idempotencyKey = UUID v4
Passed to Stripe as stripe-idempotency-key header
Passed to PayPal as PayPal-Request-Id header
Prevents double-charge on network timeout retry
```

---

## 3. Data Protection

### Personal Data
```
PCCC (개인통관고유부호):
  Stored encrypted at rest (AES-256)
  Never logged in plaintext
  Unipass API call: HTTPS only, verify TLS cert

Recipient address: stored on order, not logged in debug output
Phone numbers: masked in email notifications (010-****-1234)

GDPR considerations (if serving EU customers):
  - Data retention policy: order data 10 years (legal requirement)
  - Right to erasure: soft-delete user, anonymize order recipient data
  - Data export: /api/me/export-data endpoint
```

### Contact Masking (Anti-Disintermediation)
```
All outbound messages (from admin broker chat to seller, from customer messages):
  Filter regex removes: phone numbers, email addresses, social handles
  Prevents customer/seller from bypassing operator and transacting directly
  
Regex patterns:
  Phone: /\d{2,4}[-\s]?\d{3,4}[-\s]?\d{4}/g
  Email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
  Replacement: [연락처 마스킹됨]
```

### Soft Delete
```
User withdrawal: sets withdrawnAt, anonymizes PII (name → "탈퇴회원", email → hash)
Order deletion: sets deletedAt, excluded from default queries (WHERE deletedAt IS NULL)
Admin soft-delete: never physically removes payment or order records
```

---

## 4. API Security

### Rate Limiting
```
Auth endpoints:    10 requests / minute / IP
Order creation:    20 requests / minute / user
Payment initiation: 5 requests / minute / user
Webhook:           No rate limit (must always accept)
```

### Input Validation
```
NestJS class-validator decorators on all DTOs:
  @IsUrl()          -- product URLs
  @IsDecimal()      -- prices and amounts
  @IsEnum()         -- status values
  @MaxLength(500)   -- text fields
  @IsISO31661Alpha2() -- country codes
  
SQL injection: Prisma ORM parameterized queries (immune by default)
XSS: sanitize HTML in Notice/Banner content (DOMPurify or similar)
```

### CORS
```
Origin whitelist: production domain only
Credentials: true (for cookie-based refresh token)
Methods: GET, POST, PATCH, DELETE, OPTIONS
```

---

## 5. Email Security

### DMARC / SPF / DKIM
```
SPF:   TXT record includes sending IP/provider
DKIM:  Email provider signs outbound messages
DMARC: p=quarantine (tighten from p=none over time)
       Note: DMARC DNS update requires operator action
```

### Unsubscribe Link Security
```
token = HMAC-SHA256(userId + ':' + email + ':' + timestamp, UNSUBSCRIBE_SECRET)
Validation: verify HMAC + check timestamp not older than 30 days
On verify: set emailOptIn = false (no authentication required)
One-time: link remains valid (idempotent)
```

---

## 6. Admin Security

### IP Allowlist (Optional)
```
Admin panel (/sk-staff/*) can be restricted to:
  - VPN IP range
  - Office static IP
  Configured via ADMIN_IP_ALLOWLIST env var (comma-separated)
```

### Audit Trail
```
AuditLog records:
  - All admin state changes
  - All payment captures/refunds
  - All admin user management actions
  - IP address, timestamp, before/after diff
→ Read-only for non-SUPER_ADMIN
→ Retention: minimum 2 years
```

### Admin 2FA (Recommended)
```
TOTP-based 2FA for admin accounts
Implementation: speakeasy or similar
Backup codes: 10 single-use codes stored hashed (bcrypt)
```

---

## 7. Infrastructure Security

### Environment Variables
```
Required secrets (NEVER commit to git):
  DATABASE_URL
  JWT_SECRET
  ADMIN_JWT_SECRET
  REFRESH_TOKEN_SECRET
  STRIPE_SECRET_KEY
  STRIPE_WEBHOOK_SECRET
  PAYPAL_CLIENT_ID
  PAYPAL_CLIENT_SECRET
  PAYPAL_WEBHOOK_ID
  DEEPL_API_KEY
  UNIPASS_API_KEY
  NAVER_CLIENT_ID + NAVER_CLIENT_SECRET
  KAKAO_CLIENT_ID + KAKAO_CLIENT_SECRET
  UNSUBSCRIBE_SECRET
  ENCRYPTION_KEY (for PCCC)
```

### AI Crawler Block
```
robots.txt:
  User-agent: GPTBot
  User-agent: ClaudeBot
  User-agent: Bingbot (optional)
  Disallow: /

middleware.ts:
  Check User-Agent header → 403 for known AI crawlers
  Protects: product listings, pricing data, customer data
```

### HTTPS / TLS
```
All traffic: TLS 1.2+ only
HSTS: max-age=31536000; includeSubDomains
Certificate: Let's Encrypt or commercial CA
WebSocket (if used): WSS only
```

---

## 8. HS Code & Customs Security

### PCCC Handling
```
PCCC format: 13 digits (P + 12 digits) or (X + 12 digits)
Never log PCCC in application logs
Unipass API: server-to-server only (API key in env var)
Response: valid/invalid only (never return raw Unipass response to client)
```

### Prohibited Items
```
Admin review required for:
  - Luxury brand items (risk_score > 70)
  - Items > USD $1,000 (high-value surcharge + extra docs)
  - Known restricted categories (weapons, food, medications)
  → trigger RISK_REVIEW status
  → requires admin approval before proceeding
```
