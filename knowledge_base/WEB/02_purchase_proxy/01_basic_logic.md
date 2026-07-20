# Purchase Proxy (구매대행/배송대행) SaaS — Basic Logic

## 1. System Overview

A **Purchase Proxy SaaS** is a platform where an operator acts as an intermediary agent to purchase goods on behalf of customers from a foreign marketplace and deliver them to the customer's home country.

### 1.1 Two Service Types

| Type | Korean | Description |
|------|--------|-------------|
| **Purchase Proxy** | 구매대행 | Operator purchases from the foreign seller on behalf of the customer |
| **Shipping Proxy** | 배송대행 | Customer purchases directly; operator receives the item in the foreign warehouse and ships internationally |

### 1.2 Basic Flow (구매대행)

```
Customer submits order (5-step form)
  → Operator sends 1st quote (product price + commission)
  → Customer pays 1st payment (deposit)
  → Operator negotiates with seller
  → Seller ships to operator's warehouse (or pickup)
  → Warehouse receives, inspects, measures item
  → Operator sends 2nd quote (actual international shipping fee)
  → Customer pays 2nd payment (shipping fee)
  → Operator ships to Korea
  → Customs clearance (통관)
  → Delivered to customer
```

### 1.3 Full Order State Machine (30 states)

```
ORDER_CREATED
  └─ FIRST_PAYMENT_PENDING → FIRST_PAYMENT_COMPLETED
       └─ NEGOTIATION_STARTED → SELLER_WAITING → NEGOTIATING
            ├─ RISK_REVIEW → [collapse] CANCELLED → REFUNDED
            └─ APPROVED_FOR_PURCHASE → PAID_TO_SELLER
                 ├─ [seller ships] TRACKING_RECEIVED → IN_TRANSIT_DE
                 └─ [pickup needed] PICKUP_REQUIRED → PICKUP_SCHEDULED
                      ├─ PICKUP_FAILED → CANCELLED → REFUNDED
                      └─ ARRIVED_WAREHOUSE → INSPECTING
                           └─ SECOND_PAYMENT_PENDING → SECOND_PAYMENT_COMPLETED
                                └─ SHIPPED_TO_KOREA → CUSTOMS_IN_PROGRESS → DELIVERED → CLOSED

Exception paths:
  NEGOTIATION_STARTED → DISPUTE_RAISED → (recover or) CANCELLED
  NEGOTIATING → SELLER_NO_RESPONSE | SELLER_REJECTED → CANCELLED → REFUNDED
  DELIVERED → DISPUTE_RAISED → CLOSED | REFUNDED
  
Cancel states: CANCELLED, ORDER_CANCELLED, REFUND_PENDING, REFUNDED, REFUND_COMPLETED
```

---

## 2. Core Entities

### 2.1 ProxyOrder (Main Order — God Entity)
```
ProxyOrder {
  id, orderNumber          -- SK-YYYYMMDD-XXXX format
  status: OrderStatus      -- 30-state enum
  customerId, adminId

  // Product info
  productUrl, productTitle, productPrice (EUR)
  quantity, totalProductPrice
  catalogProductId?        -- optional link to catalog

  // Transaction
  transactionMethod        -- SELLER_SHIP | PICKUP
  pickupAddress?

  // Recipient
  recipientName, recipientPhone
  recipientAddress (Korea)
  customsCode              -- 개인통관고유부호

  // Options
  needsInspection, needsRepacking
  hasInsurance, isFragile, isBulkCargo

  // Pricing
  commissionRate, commissionAmount
  domesticShippingFee, pickupFee, insuranceFee
  exchangeRate, firstPaymentAmount

  // Shipping (post-inbound)
  actualWeight, actualVolume (L×W×H)
  volumeWeight             -- (L×W×H)/6000
  internationalShippingFee
  secondPaymentAmount

  // Tracking
  trackingNumber, shippingCarrier
  hsCode

  // Status
  deletedAt               -- soft-delete
  createdAt, updatedAt
}
```

### 2.2 Related Order Entities
```
OrderStatusLog    -- all state transitions with timestamp + actor
OrderComment      -- internal admin notes
OrderQuote        -- 1st and 2nd quotes
OrderExtraCharge  -- additional charges
OrderMessage      -- negotiation thread messages
Claim             -- dispute/claim records
Receipt           -- payment receipt records
ReceiptRequest    -- customer receipt requests
```

### 2.3 User (member)
```
User {
  id, email, nickname, realName, phone
  addressList[]            -- multiple shipping addresses
  customsProfile {
    pccc                   -- 개인통관고유부호
    verified: boolean      -- Unipass API verified
  }
  memberLevelId            -- grade: bronze/silver/gold/vip
  pointBalance
  emailOptIn               -- email marketing consent
  oauthProvider            -- naver | kakao | email
  withdrawnAt?             -- soft-delete on withdrawal
}
```

### 2.4 Payment
```
Payment {
  orderId, stage           -- FIRST | SECOND
  method                   -- STRIPE | PAYPAL | BANK_TRANSFER
  amount, currency (EUR)
  status                   -- PENDING | COMPLETED | FAILED | REFUNDED
  stripeSessionId?
  paypalOrderId?
  idempotencyKey           -- prevents duplicate charges
}

PaymentAttempt  -- each attempt log
PaymentWebhookEvent  -- Stripe/PayPal webhook dedup
Refund           -- refund records
CustomerBalance  -- virtual wallet (예치금)
BalanceTransaction
CustomerBankAccount  -- bank transfer account info
```

---

## 3. 3-Layer Modular Architecture Pattern

The purchase proxy SaaS is best built as 3 layers:

```
CORE (always installed)
├── auth-users     User, AdminUser, OAuth, JWT, RBAC
├── shell          Layout, Navbar, Footer, UI components
├── infra          Email, notifications, site config, audit log
└── i18n           Translation cache (DeepL), message templates

SHARED (auto-pulled by dependent modules)
├── pricing        Fee calculator, exchange rate, shipping rates
├── order-kernel   OrderStatus state machine, shared constants
└── messaging-ui   Negotiation/broker chat components

FEATURE (select and install)
├── catalog         Product search, catalog, URL import, wishlist
├── orders          Purchase orders, 5-step form, OrderDraft
├── payments        Stripe, PayPal, bank transfer, refunds
├── messages        Negotiation threads, broker messages
├── shipping-pickup Inbound, warehouse, inspection, pickup, shipment
├── customs         PCCC, Unipass, HS codes, compliance
├── reviews         Order-linked reviews
├── member-loyalty  Grades, points, coupons
├── content-cms-seo Home, landing pages, notices, FAQ, SEO
├── accounting      Monthly settlement, Eigenbeleg PDF
└── partner         B2B partner portal
```

---

## 4. Key Business Rules

### 4.1 Commission (구매대행 수수료) — 9-tier
| Product Price (EUR) | Commission Rate |
|---------------------|----------------|
| 0 – 50 | 15% |
| 51 – 100 | 13% |
| 101 – 200 | 11% |
| 201 – 300 | 10% |
| 301 – 500 | 9% |
| 501 – 1,000 | 8% |
| 1,001 – 2,000 | 7% |
| 2,001 – 5,000 | 6% |
| 5,001+ | 5% |
| **Minimum** | **€20** |

### 4.2 Volume Weight
```
volumeWeight (kg) = (Length × Width × Height in cm) / 6000
billedWeight = max(actualWeight, volumeWeight)
```

### 4.3 High-Value Surcharge
```
if productPrice (USD equivalent) > $1,000:
  additionalDocFee = €80
```

### 4.4 Pickup Fee
```
pickupFee = €40 + (roundTripKm × €1.5)
```

### 4.5 2-Stage Payment Flow
```
Stage 1 (FIRST): productPrice + commission + estimated domesticShipping + optional fees
  → Charged at ORDER_CREATED → FIRST_PAYMENT_PENDING
Stage 2 (SECOND): actual internationalShippingFee based on real weight/dimensions
  → Charged at INSPECTING → SECOND_PAYMENT_PENDING
```

---

## 5. Integration Points

| Integration | Purpose | API |
|-------------|---------|-----|
| Kleinanzeigen API | Product search/import | REST |
| DeepL API | German→Korean translation (product title/desc) | REST |
| Stripe | Card payment, webhooks, refunds | SDK |
| PayPal | PayPal payment, capture, webhooks | SDK |
| Unipass API | Korean customs code (PCCC) verification | REST |
| Eurosender API | Pickup scheduling (logistics) | REST (partial) |
| Naver OAuth | Korean user login | OAuth 2.0 |
| Kakao OAuth | Korean user login | OAuth 2.0 |
