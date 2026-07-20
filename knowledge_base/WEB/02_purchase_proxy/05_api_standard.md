# Purchase Proxy SaaS — API Standard

## Base Pattern
- Framework: NestJS (REST + controllers)
- Auth: JWT Bearer token (access + refresh)
- Admin routes: `/admin/*` (AdminUser JWT)
- User routes: `/api/*` (User JWT)
- Partner routes: `/partner/*` (Partner JWT)
- All responses: `{ data: T, message: string }`
- Errors: `{ statusCode, message, error }`
- Pagination: `{ data: T[], total, page, limit }`

---

## Auth Endpoints

```
POST /api/auth/naver                  -- Naver OAuth callback
POST /api/auth/kakao                  -- Kakao OAuth callback
POST /api/auth/email/register         -- Email registration
POST /api/auth/email/login            -- Email login
POST /api/auth/verify-email           -- Email verification (token)
POST /api/auth/refresh                -- Refresh JWT
POST /api/auth/logout                 -- Invalidate refresh token

POST /api/admin/login                 -- Admin email/password login
POST /api/admin/refresh               -- Admin refresh JWT
```

---

## User (Me) Endpoints

```
GET  /api/me                          -- Profile
PATCH /api/me                         -- Update profile (nickname, phone)
GET  /api/me/addresses                -- Shipping address list
POST /api/me/addresses                -- Add address
PATCH /api/me/addresses/:id           -- Update address
DELETE /api/me/addresses/:id          -- Remove address

GET  /api/me/customs-profile          -- PCCC info
POST /api/me/customs-profile          -- Save PCCC
POST /api/me/customs-profile/verify   -- Unipass verification
  Body: { pccc: string }
  Response: { valid: boolean, name: string? }

GET  /api/me/notifications            -- Email settings
PATCH /api/me/notifications           -- Update emailOptIn
POST /api/me/withdraw                 -- Account withdrawal
```

---

## Catalog Endpoints

```
GET  /api/catalog/search
  Query: q, category, city, minPrice, maxPrice, page, limit
  Response: { items: CatalogProduct[], total, facets }

GET  /api/catalog/suggestions?q={prefix}
  Response: { suggestions: string[] }

GET  /api/catalog/product/:id
  Response: { product, translations, riskScore, wishlistStatus }

POST /api/catalog/import-url
  Body: { url: string }
  Response: { product: CatalogProduct }

GET  /api/catalog/categories
  Response: { categories: Category[] }  -- 2-level hierarchy

POST /api/wishlists/:productId           -- Add to wishlist
DELETE /api/wishlists/:productId         -- Remove from wishlist
GET  /api/wishlists                      -- My wishlist
```

---

## Order Endpoints (Customer)

```
GET  /api/orders                          -- My orders (paginated)
  Query: status, page, limit
  Response: { orders: ProxyOrderSummary[], total }

GET  /api/orders/:id                      -- Order detail
  Response: { order: ProxyOrder, timeline: OrderStatusLog[] }

POST /api/orders                          -- Create order (5-step form)
  Body: {
    productUrl, productTitle, productPrice, quantity,
    negotiationDesired,
    transactionMethod, pickupAddress?,
    recipientName, recipientPhone, recipientAddress, postalCode, customsCode?,
    needsInspection, needsRepacking, hasInsurance, isFragile, isBulkCargo
  }
  Response: { order: ProxyOrder }

PATCH /api/orders/:id/cancel              -- Cancel (pre-payment only)

POST /api/order-drafts                    -- Save draft
  Body: { formData: object, step: number }
  Response: { draft: OrderDraft }

GET  /api/order-drafts/:id               -- Load draft
DELETE /api/order-drafts/:id             -- Delete draft

GET  /api/quote/:orderId                  -- Get current quote (re-quote on exchange rate change)
POST /api/orders/:id/confirm-quote        -- Confirm quote
```

---

## Payment Endpoints

```
POST /api/payments/checkout-session
  Body: { orderId: string, stage: 'FIRST' | 'SECOND' }
  Response: { url: string }  -- Stripe checkout URL

GET  /api/payments/checkout-success?session_id={id}
  Response: { order: ProxyOrder }

POST /api/payments/webhook/stripe         -- Stripe webhook (no auth, verify sig)
POST /api/payments/webhook/paypal         -- PayPal webhook (no auth, verify sig)

GET  /payments/paypal-capture?token={t}&payerId={p}
  Response: redirect to order page

POST /api/deposits                        -- Request bank transfer
  Body: { amount, currency }
  Response: { depositRequest, bankInfo }

GET  /api/deposits/pending                -- My pending bank transfers

POST /api/refunds                         -- Request refund (customer-initiated)
  Body: { orderId, reason }

GET  /api/me/payments                     -- Payment history
GET  /api/me/balance                      -- Wallet balance
```

---

## Messages / Negotiation Endpoints

```
GET  /api/messages?orderId={id}           -- Chat thread messages
POST /api/messages                        -- Send message
  Body: { orderId, content, attachments?: string[] }

POST /api/orders/:id/offers               -- Make price offer
  Body: { proposedPrice, note? }
POST /api/orders/:id/offers/:offId/accept -- Accept offer
POST /api/orders/:id/offers/:offId/reject -- Reject offer
```

---

## Pickup / Shipping Endpoints

```
POST /api/pickup                          -- Create pickup request
  Body: { orderId, sellerAddress, sellerPhone?, preferredDate?, roundTripKm? }
  Response: { request: PickupRequest }

GET  /api/pickup/:id                      -- Pickup tracking
  Response: { request, events: PickupEvent[] }

GET  /api/packing-list/:orderId           -- Packing list (customer)
GET  /api/invoice/:orderId                -- Shipping invoice (customer)
```

---

## Customs Endpoints

```
POST /api/customs-verify/:orderId         -- Verify PCCC for order
GET  /api/customs/my-profile              -- Alias of /api/me/customs-profile
GET  /api/hs-codes?q={search}            -- HS code search
POST /api/rights-request                  -- IP rights request
  Body: { productType, brand, evidence }
```

---

## Review Endpoints

```
POST /api/orders/:id/review               -- Submit review
  Body: { rating: 1-5, content, photoUrls?: string[] }
  Guard: order must be DELIVERED or CLOSED

GET  /api/reviews                         -- Public review list
  Query: rating, page, limit, sortBy

GET  /api/me/reviews                      -- My reviews
```

---

## Admin Endpoints

### Order Management
```
GET  /admin/orders                        -- All orders (with filters)
  Query: status, customerId, adminId, page, limit, search
  
PATCH /admin/orders/:id/status            -- Status change
  Body: { status, note, adminForce? }

GET  /admin/orders/:id                    -- Order detail (full)
PATCH /admin/orders/:id/amount-adjust     -- Adjust payment amount
GET  /admin/orders/:id/customs            -- Customs documents
```

### Inbound / Warehouse
```
GET  /admin/inbound                       -- Inbound order list
PATCH /admin/inbound/:id/status           -- Mark arrived
PATCH /admin/inbound/:id/measurements     -- Record dimensions
  Body: { weightKg, lengthCm, widthCm, heightCm, boxCount }
POST /admin/inbound/:id/inspection        -- Record inspection
  Body: { condition, issues, photoUrls, notes }
```

### Accounting
```
GET  /admin/accounting/monthly?year={}&month={}   -- Monthly summary
POST /admin/accounting/orders/:id/seller-payment  -- Record seller payment
  Body: { sellerName, sellerIban?, amountEur, receiptUrl? }
GET  /admin/accounting/eigenbeleg/export?year={}&month={}  -- PDF export
```

### Admin User Management
```
GET  /admin/users                         -- User list
GET  /admin/users/:id                     -- User detail
PATCH /admin/users/:id/suspend            -- Suspend
PATCH /admin/users/:id/unsuspend          -- Unsuspend
GET  /admin/users/:id/orders              -- User's orders

GET  /admin/payments                      -- All payments
GET  /admin/deposits                      -- All bank transfer requests
PATCH /admin/deposits/:id/confirm         -- Confirm bank transfer
GET  /admin/premium-services              -- Premium service definitions
GET  /admin/coupons                       -- Coupon management
POST /admin/coupons                       -- Create coupon event + batch
GET  /admin/points                        -- Point management
POST /admin/points/adjust                 -- Adjust user points
```

### Settings
```
GET  /admin/site-config                   -- Current site config
PATCH /admin/site-config                  -- Update (exchange rate, fees, etc.)
GET  /admin/settings/fees                 -- Fee structure
PATCH /admin/settings/fees                -- Update fee structure
GET  /admin/settings/deposit              -- Bank account info for deposits
PATCH /admin/settings/deposit             -- Update bank info
GET  /admin/shipping-rates                -- Shipping rate table
PATCH /admin/shipping-rates/:id           -- Update rate
POST /admin/shipping-rates                -- Add rate
```

### Content / SEO
```
GET/POST/PATCH/DELETE /admin/notices      -- Notices CRUD
GET/POST/PATCH/DELETE /admin/banners      -- Banners CRUD
GET/PATCH /admin/seo/:pageKey             -- SEO per page
GET /admin/translations                   -- Translation management
```

---

## Webhook Security

### Stripe
```javascript
// Verify in webhook handler (NestJS)
const event = stripe.webhooks.constructEvent(
  request.rawBody,           // raw Buffer, NOT parsed JSON
  request.headers['stripe-signature'],
  process.env.STRIPE_WEBHOOK_SECRET
)
```

### PayPal
```javascript
// Verify PayPal webhook signature
const isValid = await verifyPayPalWebhook({
  transmissionId: headers['paypal-transmission-id'],
  timestamp: headers['paypal-transmission-time'],
  webhookId: process.env.PAYPAL_WEBHOOK_ID,
  certUrl: headers['paypal-cert-url'],
  transmissionSig: headers['paypal-transmission-sig'],
  payload: body,
})
```

---

## State Machine Pattern (NestJS)

```typescript
// order-state-machine.ts
const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  ORDER_CREATED: [FIRST_PAYMENT_PENDING, ORDER_CANCELLED],
  FIRST_PAYMENT_PENDING: [FIRST_PAYMENT_COMPLETED, CANCELLED],
  FIRST_PAYMENT_COMPLETED: [NEGOTIATION_STARTED],
  // ... all 30 states
}

function canTransition(from: OrderStatus, to: OrderStatus, adminForce = false): boolean {
  if (adminForce) return true  // admin bypass
  return VALID_TRANSITIONS[from]?.includes(to) ?? false
}
```

---

## Email Notification Pattern (NestJS)

```typescript
// email.scheduler.ts — called on every status change
async function triggerStatusEmail(order: ProxyOrder, newStatus: OrderStatus) {
  const trigger = EMAIL_TRIGGERS[newStatus]
  if (!trigger) return
  if (!order.customer.emailOptIn && trigger.requiresOptIn) return
  
  await emailService.send({
    to: order.customer.email,
    template: trigger.template,
    vars: buildEmailVars(order),
  })
}

const EMAIL_TRIGGERS: Record<string, EmailTrigger> = {
  FIRST_PAYMENT_PENDING: { template: 'quote', requiresOptIn: false },
  FIRST_PAYMENT_COMPLETED: { template: 'payment-confirmed', requiresOptIn: false },
  // ...
}
```
