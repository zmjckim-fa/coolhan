# Purchase Proxy SaaS — Specification Template

## [PROJECT NAME] Specification
**Type:** Purchase Proxy (구매대행) / Shipping Proxy (배송대행) SaaS  
**Version:** 1.0.0  
**Date:** [YYYY-MM-DD]

---

## 1. System Overview

### 1.1 Business Context
```
Operator: [Company name]
Origin Country: [Germany / USA / Japan / ...]
Target Country: [Korea / Japan / ...]
Primary Marketplace: [Kleinanzeigen / eBay / Amazon / ...]
Business Model: [Purchase Proxy Only / Shipping Proxy Only / Both]
```

### 1.2 Service Flow
```
[Select applicable]
□ Purchase Proxy: Customer submits → Operator buys → Ships to customer
□ Shipping Proxy: Customer buys → Operator receives → Ships to customer  
□ Both: Customer selects service type per order
```

### 1.3 Modules Required
```
Core (always):     auth-users, shell, infra, i18n
Shared:            [pricing / order-kernel / messaging-ui — select as needed]
Feature modules:
  □ catalog          Product search + URL import
  □ orders           Purchase application form + OrderDraft
  □ payments         Stripe + PayPal + bank transfer
  □ messages         Negotiation chat + broker messages
  □ shipping-pickup  Warehouse + inspection + pickup
  □ customs          PCCC + HS codes + customs documents
  □ reviews          Order-linked reviews
  □ member-loyalty   Grade + points + coupons
  □ content-cms-seo  Home, landing, FAQ, notices, SEO
  □ accounting       Settlement + Eigenbeleg PDF
  □ partner          B2B partner portal
```

---

## 2. Commission Structure

### 2.1 Purchase Commission Tiers
| Price Range ({CURRENCY}) | Rate | Notes |
|--------------------------|------|-------|
| 0 – 50 | 15% | |
| 51 – 100 | 13% | |
| 101 – 200 | 11% | |
| 201 – 300 | 10% | |
| 301 – 500 | 9% | |
| 501 – 1,000 | 8% | |
| 1,001+ | [custom] | |
| Minimum | [amount] | e.g. €20 |

### 2.2 Additional Fees
```
Pickup fee:        [base amount] + [per km rate] × roundTripKm
Inspection fee:    [amount]
Repacking fee:     [amount]
Insurance:         [percentage]% of product value
High-value surcharge: [amount] for products over [threshold]
```

### 2.3 Exchange Rate
```
Source: [manual admin input / API — specify provider]
Update frequency: [daily / per order]
Reference rate: [USD/EUR reference if applicable]
```

---

## 3. Order Lifecycle

### 3.1 Status Set (Select applicable subset)
```
□ Use full 30-state machine (recommended for full-service operator)
□ Use simplified set:
   ORDER_CREATED → PAYMENT_PENDING → PAYMENT_COMPLETED → 
   PROCESSING → SHIPPED → DELIVERED → CLOSED
```

### 3.2 Payment Stages
```
□ Single payment: full amount upfront
□ 2-stage payment (recommended for 구매대행):
   Stage 1: product price + commission + estimated fees (at order)
   Stage 2: actual international shipping fee (after inbound measurement)
```

### 3.3 Email Triggers
```
[List status changes that send email notifications]
□ Order confirmed
□ Quote sent (payment requested)  
□ Payment received
□ Item arrived at warehouse
□ Shipping quote (2nd payment)
□ Shipped to customer country
□ Delivered
□ Other: [specify]
```

---

## 4. User System

### 4.1 Registration / Login Methods
```
□ Naver OAuth (required for Korean market)
□ Kakao OAuth
□ Google OAuth
□ Email/Password
□ Phone number (SMS OTP)
```

### 4.2 Required User Profile Fields
```
[Specify which fields are mandatory at onboarding]
□ Nickname
□ Real name (한국어 or romanized)
□ Phone number (Korean format)
□ Primary shipping address (Korea)
□ 개인통관고유부호 (PCCC) — at order time or pre-saved
```

### 4.3 Member Grades
```
□ No grades (simple membership)
□ Tiered grades:
   Tier 1: [name] — min [X] points
   Tier 2: [name] — min [Y] points
   ...
   Benefit: [commission discount / shipping discount / priority support]
```

---

## 5. Product Catalog

### 5.1 Product Source
```
□ Marketplace API integration: [Kleinanzeigen / eBay / Amazon / Rakuten / ...]
  API endpoint: [specify]
□ URL import (scraping): [allowed / not allowed]
□ Manual entry by admin only
□ Seller-uploaded catalog (partner module)
```

### 5.2 Translation
```
□ DeepL API: [source language] → [target language]
□ Google Translate API
□ Manual admin translation
□ No translation (single language)
```

### 5.3 Risk Scoring
```
□ Automated risk scoring: [describe criteria]
□ Manual admin review flag only
□ No risk system
```

---

## 6. Payment Integration

### 6.1 Payment Methods
```
□ Stripe (credit/debit card)
  → Checkout Sessions (recommended, hosted page)
  → Elements (embedded form)
□ PayPal
□ Bank transfer (무통장입금)
  → Bank: [bank name, account number, account holder]
□ Virtual wallet (예치금)
□ Toss Payments (Korean market)
□ KakaoPay
□ NaverPay
```

### 6.2 Currency
```
Customer sees prices in: [KRW / EUR / USD / ...]
Charges in: [EUR / USD / ...]
Exchange rate applied at: [quote time / payment time]
```

### 6.3 Refund Policy
```
Full refund: [conditions]
Partial refund: [conditions]
No refund: [conditions]
Processing time: [X business days]
```

---

## 7. Customs & Shipping

### 7.1 Customs Code (PCCC) — Korea
```
□ Required for all orders (Korean customs regulation)
□ Optional (low-value items only)
□ Not applicable (non-Korean destination)
Verification: □ Unipass API  □ Manual verification  □ Skip
```

### 7.2 HS Code Assignment
```
□ Admin manually assigns per order
□ AI-assisted suggestion from product description
□ Auto-assign from product category mapping
□ Not required
```

### 7.3 Shipping Carriers
```
Origin country → Destination country:
  □ EMS
  □ DHL
  □ FedEx
  □ UPS
  □ K-Packet
  □ Other: [specify]
```

### 7.4 Warehouse Location
```
Address: [city, country]
Pickup service: □ Yes (up to [X] km radius)  □ No
```

---

## 8. Admin System

### 8.1 Admin Roles
```
□ SUPER_ADMIN: all permissions
□ ADMIN: order management, payment management
□ VIEWER: read-only dashboard
□ Other: [specify]
```

### 8.2 Required Admin Features
```
□ Order kanban board (5-column layout)
□ Manual status override (adminForce)
□ Inbound measurement recording
□ Inspection photo upload
□ Refund processing
□ Coupon management
□ Point adjustment
□ Exchange rate update
□ Shipping rate table
□ User management
□ Accounting / settlement reports
□ Eigenbeleg PDF generation
□ SEO management
□ AI crawler blocking
```

---

## 9. Notification System

### 9.1 Email
```
Provider: [SendGrid / SES / Mailgun / easyname / ...]
From address: [noreply@yourdomain.com]
Language: [Korean / English / ...]
□ Marketing email opt-in/opt-out
□ One-click unsubscribe (HMAC token)
□ 3-day incomplete signup reminder
```

### 9.2 Other Notifications
```
□ Kakao AlimTalk (Korean push notification — requires Kakao Business)
□ SMS (Twilio or Korean SMS provider)
□ Push notification (FCM)
□ In-app notification
```

---

## 10. Non-Functional Requirements

### 10.1 Performance
```
Target concurrent users: [X]
Order submission SLA: < [X] seconds
Payment checkout redirect: < [X] seconds
Search response: < [X] ms
```

### 10.2 Security Checklist
```
□ JWT with short-lived access tokens
□ Stripe/PayPal webhook signature verification
□ Payment idempotency keys
□ PCCC encrypted at rest
□ Contact masking in messages
□ Soft-delete for user data
□ Audit log for admin actions
□ CORS origin whitelist
□ Rate limiting on auth/payment endpoints
□ HTTPS only (HSTS enabled)
□ AI crawler blocking
□ Admin IP allowlist (optional)
```

### 10.3 Stack Requirements
```
Backend:  NestJS + TypeScript
Frontend: Next.js 14 (App Router)
ORM:      Prisma
Database: PostgreSQL
Auth:     JWT + HttpOnly cookie refresh token
Email:    [specify provider]
Storage:  [S3 / R2 / local — for inspection photos]
Hosting:  [specify]
```

---

## 11. Acceptance Criteria

### Order Flow
- [ ] Customer can submit purchase application via 5-step form
- [ ] OrderDraft saves progress and restores on return
- [ ] Quote displays correct commission based on tier + minimum
- [ ] 1st payment via Stripe/PayPal completes and triggers status update
- [ ] Admin can record inbound measurement and auto-calculate billedWeight
- [ ] 2nd payment quote reflects actual measured weight
- [ ] 2nd payment completes and triggers SHIPPED_TO_KOREA flow
- [ ] Order status timeline visible to customer in My Page

### Payment
- [ ] Stripe checkout session created with correct amount and metadata
- [ ] Stripe webhook verified (signature) and idempotent (dedup table)
- [ ] PayPal capture flow completes successfully
- [ ] Bank transfer pending deposit visible to admin
- [ ] Refund processed and status updated

### Customs
- [ ] PCCC can be entered at order form (STEP 3) and My Page
- [ ] Unipass API verifies PCCC (returns valid/invalid)
- [ ] HS code assigned and visible in admin customs view

### Security
- [ ] Stripe webhook rejects unsigned events (returns 400)
- [ ] Messages with phone numbers/emails are masked before sending
- [ ] PCCC never appears in application logs
- [ ] Unsubscribe link works without login (HMAC token valid)
- [ ] Admin audit log records all state changes with actor + timestamp

### Negative Cases
- [ ] Duplicate payment attempt returns idempotent result (not double-charged)
- [ ] Order cannot transition to invalid status (state machine enforced)
- [ ] Cancelled order cannot be paid
- [ ] Non-DELIVERED order cannot submit review
- [ ] Admin cannot bypass Unipass verification (can only view status)
