# Purchase Proxy SaaS — Core Features

## F1. User/Member System

### OAuth Login
- **Naver OAuth**: `POST /api/auth/naver` — primary Korean social login
- **Kakao OAuth**: `POST /api/auth/kakao` — secondary; phone/name scope requires Kakao review
- **Email/Password**: with email verification flow

### Onboarding (4 fields)
```
nickname + realName + phone + primaryAddress
→ completes on /onboarding page after OAuth
→ triggers sendMemberWelcomeManual email
```

### My Page Tabs
| Tab | Path | Content |
|-----|------|---------|
| Profile | ?tab=profile | Name, phone, email |
| Orders | ?tab=orders | Order list with timeline |
| Addresses | ?tab=address | Multiple shipping addresses |
| Customs | ?tab=customs | PCCC + Unipass verification |
| Payments | ?tab=payments | Payment history |
| Balance | ?tab=balance | 예치금 wallet |
| Notifications | ?tab=notifications | Email opt-in settings |
| Member Level | ?tab=memberLevel | Grade + points |
| Coupons | ?tab=coupons | Active coupons |
| Withdrawal | ?tab=withdrawal | Account deletion |

### Unsubscribe
```
GET /unsubscribe?token={hmacToken}
→ sets emailOptIn=false
→ one-click, no login required
→ HMAC token = HMAC(userId + email + timestamp, SECRET)
```

---

## F2. Product Catalog

### Kleinanzeigen API Integration
- Search: `GET /api/catalog/search?q={keyword}&category={id}&city={city}`
- Import by URL: `POST /api/catalog/import-url` — scrapes listing URL
- Product detail: `GET /api/catalog/product/:id`
- Auto-complete: `GET /api/catalog/suggestions?q={prefix}`

### German → Korean Translation (DeepL)
```
POST /api/catalog/product/:id → triggers DeepL for title + description
→ result stored in TranslationCache (upsert by productId + field)
→ subsequent requests served from cache
```

### Risk Scoring
```
ProductRisk = {
  risk_score: 0–100,
  risk_summary: string   -- e.g. "Luxury brand — verify authenticity"
}
→ displayed as badge on product card
→ high-risk triggers RISK_REVIEW state in order flow
```

### Wishlist
- `POST/DELETE /api/wishlists/:productId`
- Shown on `/my-wishlist`

---

## F3. 5-Step Purchase Application Form

```
STEP 1 — Product Information
  productUrl, productTitle, productPrice (EUR), quantity
  negotiationDesired: boolean

STEP 2 — Transaction Method
  transactionMethod: SELLER_SHIP | PICKUP
  [if PICKUP] pickupAddress

STEP 3 — Recipient Information
  recipientName, recipientPhone
  recipientAddress (Korea), postalCode
  customsCode (개인통관고유부호)

STEP 4 — Options
  needsInspection: boolean    (+fee)
  needsRepacking: boolean     (+fee)
  hasInsurance: boolean       (+premium)
  isFragile: boolean
  isBulkCargo: boolean

STEP 5 — Quote Preview
  commissionRate: auto-calculated from productPrice tier
  commissionAmount = productPrice × commissionRate (min €20)
  estimatedDomesticShipping
  pickupFee (if pickup)
  insurancePremium (if insurance)
  firstPaymentTotal

→ POST /api/orders → creates ProxyOrder (status: ORDER_CREATED)
```

### OrderDraft (Temp Save)
```
POST /api/order-drafts   → saves partial form state
GET  /api/order-drafts/:id → restore on /order/new?draft=:id
→ expires after 7 days
→ deleted on order submission
```

---

## F4. Payment System

### Payment Methods
| Method | Trigger | Provider |
|--------|---------|---------|
| Stripe (card) | `POST /api/payments/checkout-session` | Stripe API |
| PayPal | `POST /api/payments/paypal-capture` | PayPal API |
| Bank Transfer | `POST /api/deposits` → manual confirm | Admin |
| Wallet (예치금) | Deduct from CustomerBalance | Internal |

### 2-Stage Payment
```
Stage 1 (FIRST):
  amount = productPrice + commission + domesticFee + pickupFee + insuranceFee
  status path: FIRST_PAYMENT_PENDING → FIRST_PAYMENT_COMPLETED

Stage 2 (SECOND):
  amount = actualInternationalShippingFee (based on real weight/dims)
  status path: SECOND_PAYMENT_PENDING → SECOND_PAYMENT_COMPLETED
  triggered after INSPECTING records actual measurements
```

### Stripe Integration
```
Checkout session flow:
  POST /api/payments/checkout-session
    → stripe.checkout.sessions.create({ line_items, metadata: { orderId, stage } })
    → returns { url } → redirect to Stripe Checkout page
    → on success: redirect to /order-complete

Webhook: POST /api/payments/webhook/stripe
  → verify signature: stripe.webhooks.constructEvent(body, sig, WEBHOOK_SECRET)
  → deduplicate: PaymentWebhookEvent.stripeEventId UNIQUE
  → handle: checkout.session.completed → update Payment + Order status
```

### PayPal Integration
```
Capture flow:
  POST /api/payments/paypal-capture
    → paypal.ordersController.captureOrder(paypalOrderId)
    → on success: update Payment + Order status

Webhook: POST /api/payments/webhook/paypal
  → verify: X-PAYPAL-TRANSMISSION-SIG header
  → deduplicate: PaymentWebhookEvent.paypalEventId UNIQUE
```

### Idempotency
```
Each payment attempt generates: idempotencyKey = UUID v4
  → stored on Payment record
  → passed to Stripe as idempotencyKey option
  → passed to PayPal as PayPal-Request-Id header
  → prevents double-charge on network retry
```

### Refund
```
POST /api/refunds
  body: { orderId, amount, reason }
  → stripe.refunds.create({ paymentIntentId, amount })
  → creates Refund record
  → triggers status: REFUND_PENDING → REFUNDED → REFUND_COMPLETED
```

### Re-quote (환율 변동)
```
GET /quote/:orderId
  → recalculate using current SiteConfig.exchangeRate
  → if amount changed > threshold: show new quote
  → customer confirms → updates OrderQuote
```

---

## F5. Fee Calculator (운임)

### Commission Calculation
```javascript
function calculateCommission(productPriceEUR) {
  const tiers = [
    { max: 50,    rate: 0.15 },
    { max: 100,   rate: 0.13 },
    { max: 200,   rate: 0.11 },
    { max: 300,   rate: 0.10 },
    { max: 500,   rate: 0.09 },
    { max: 1000,  rate: 0.08 },
    { max: 2000,  rate: 0.07 },
    { max: 5000,  rate: 0.06 },
    { max: Infinity, rate: 0.05 },
  ]
  const rate = tiers.find(t => productPriceEUR <= t.max).rate
  return Math.max(productPriceEUR * rate, 20) // minimum €20
}
```

### Volume Weight
```javascript
volumeWeight = (lengthCm * widthCm * heightCm) / 6000
billedWeight = Math.max(actualWeightKg, volumeWeight)
```

### International Shipping Fee
```
Looked up from ShippingRate table by:
  zone (country destination) × weight bracket
  Admin-configurable via /sk-staff/shipping-rates
```

### High-Value Surcharge
```
if (productPriceUSD > 1000) additionalFee += 80  // EUR
USD_TO_EUR_REF = 0.92  // hardcoded reference rate
```

### Pickup Fee
```
pickupFee = 40 + (roundTripKm * 1.5)  // EUR
```

### Exchange Rate
```
exchangeRate = SiteConfig.exchangeRate  // Admin sets current EUR/KRW rate
priceKRW = priceEUR * exchangeRate
```

---

## F6. Insurance

```
Insurance option presented in STEP 4 of order form
Premium = PremiumServiceDefinition.insuranceRate × productPrice
→ Admin-configurable via /sk-staff/premium-services
→ Displayed as checkbox with calculated premium

Note: No actual insurance API integrated (internal processing)
```

---

## F7. Order Tracking / Status Management

### Customer View
```
GET /my-page?tab=orders → paginated order list
GET /order/:id → order detail with status timeline

Timeline displays: state label + timestamp + notes
  filters: DELIVERED, CLOSED, CANCELLED hidden from default admin view
```

### Admin Controls
```
PATCH /admin/orders/:id/status
  body: { status, note, adminForce }
  adminForce: true → bypass state machine validation
  → appends OrderStatusLog entry
  → triggers EmailScheduler if status has email trigger
```

### Audit Log
```
AuditLog { actor, action, entity, entityId, diff, timestamp }
→ records: all admin state changes, payment actions, refunds
→ viewable at /sk-staff/audit-logs
```

---

## F8. Negotiation / Messaging

### Order Chat (구매톡)
```
GET  /api/messages?orderId=:id       → thread messages
POST /api/messages                    → send message
  { orderId, content, attachments? }
→ real-time: polling or websocket (implementation-specific)
→ visible to: customer + admin
```

### Broker Message (Admin ↔ Seller)
```
POST /api/chat
  { orderId, content }  -- messages FROM admin TO seller
→ shown in /sk-staff/broker-messages
→ NOT visible to customer
```

### Price Negotiation
```
POST /api/orders/:id/offers
  { proposedPrice, note }
→ creates NegotiationOffer (status: PENDING)

POST /api/orders/:id/offers/:offerId/accept
  → updates offer status: ACCEPTED
  → updates order productPrice

POST /api/orders/:id/offers/:offerId/reject
  → updates offer status: REJECTED
```

### Contact Masking
```
Message content filtered through regex:
  → removes: phone numbers, email addresses, Kleinanzeigen chat links
  → protects operator's seller relationship
```

---

## F9. Pickup

### Pickup Request
```
POST /api/pickup
  { orderId, sellerAddress, preferredDate, pickupFee }
→ creates PickupRequest
→ order status: PICKUP_REQUIRED → PICKUP_SCHEDULED
```

### 10-Step Pickup Tracking
```
PickupEvent states:
  1. REQUESTED
  2. CONFIRMED
  3. EN_ROUTE
  4. AT_LOCATION
  5. COLLECTED
  6. RETURNING
  7. ARRIVED_WAREHOUSE
  8. INSPECTION_STARTED
  9. INSPECTION_DONE
  10. COMPLETED
```

### Eurosender Integration (partial)
```
External logistics API for pickup scheduling
Status: partially integrated (external API calls work, UI not wired)
```

---

## F10. Warehouse & Inspection

### Inbound Registration
```
PATCH /admin/inbound/:id/status
  { status: ARRIVED_WAREHOUSE, inboundAt, note }
→ triggers email notification to customer
```

### Measurement
```
PATCH /admin/inbound/:id/measurements
  { weightKg, lengthCm, widthCm, heightCm, boxCount }
→ calculates volumeWeight + billedWeight
→ generates 2nd quote (internationalShippingFee)
```

### Inspection
```
POST /admin/inbound/:id/inspection
  { condition, issues[], photoUrls[] }
→ creates InspectionRecord
→ photos stored in photoUrls (jsonb array of S3/CDN URLs)
```

---

## F11. Customs (통관)

### PCCC Management
```
User enters 개인통관고유부호 at:
  - STEP 3 of order form
  - /my-page?tab=customs (permanent save)

Verification: POST /api/me/customs-profile/verify
  → calls Unipass API with PCCC + user realName
  → returns: valid/invalid
  → if valid: sets customsProfile.verified = true
```

### HS Code Management (Admin)
```
/sk-staff/hs-codes
  → Admin assigns HS code to order/product category
  → used in customs declaration documents
```

### Customs Documents (Admin)
```
/sk-staff/orders/:id/customs
  → generates customs paperwork
  → includes: invoice, packing list, PCCC
```

---

## F12. Email / Notifications

### Email Triggers (10 auto-send events)
| Trigger State | Email Type |
|---------------|-----------|
| ORDER_CREATED | Order confirmation |
| FIRST_PAYMENT_PENDING | Quote + payment instructions |
| FIRST_PAYMENT_COMPLETED | Payment confirmed |
| APPROVED_FOR_PURCHASE | Purchase approved |
| ARRIVED_WAREHOUSE | Item arrived |
| SECOND_PAYMENT_PENDING | Shipping quote + payment |
| SECOND_PAYMENT_COMPLETED | Shipping confirmed |
| SHIPPED_TO_KOREA | Shipped notification + tracking |
| CUSTOMS_IN_PROGRESS | Customs update |
| DELIVERED | Delivery confirmation + review request |

### Special Emails
```
sendVerificationEmail       -- email address verification
sendMemberWelcomeManual     -- on profile completion
runIncompleteSignupReminder -- 12h cron, 3-day delay for incomplete onboarding
```

### Email Consent Filter
```
All scheduled marketing/notification emails:
  WHERE user.emailOptIn = true
  EXCEPT: transactional emails (verification, payment confirmation)
```

---

## F13. Reviews

```
POST /api/orders/:id/review
  { rating: 1-5, content, photoUrls? }
  → requires order in DELIVERED or CLOSED status
  → one review per order

GET /reviews
  → paginated public review list
  → filter by rating, sort by date

Admin: /sk-staff/reviews
  → moderate, feature/hide reviews
```

---

## F14. Accounting / Settlement (Admin Only)

### Monthly Settlement
```
GET /admin/accounting/monthly?year=2026&month=7
  → aggregates: revenue, commissions, shipping fees, refunds
  → per-order breakdown
```

### Eigenbeleg (German Accounting Receipt)
```
GET /admin/accounting/eigenbeleg/export?year=2026&month=7
  → generates PDF per German Finanzamt requirements
  → Self-receipt for purchases made from private sellers
  → Fields: seller name/address, purchase date, item, amount, VAT note
```

---

## F15. Admin Dashboard

### Overview
- Dashboard: `/sk-staff/dashboard` — KPIs, recent orders, revenue chart
- User Management: search, view, edit, suspend/unsuspend
- Order Management: kanban board with 5 columns (30 states), search/filter
- Coupon Management: create batch, assign, track usage
- Point Management: adjust points, view history
- Notices: WYSIWYG editor, publish/unpublish
- SEO Management: meta tags, OG tags per page
- Site Settings: exchange rate, company info, feature flags
- AI Crawler Block: robots.txt + middleware (blocks GPT/Claude/Bing crawlers)
