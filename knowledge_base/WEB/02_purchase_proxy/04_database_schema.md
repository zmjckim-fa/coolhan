# Purchase Proxy SaaS — Database Schema

## Technology: Prisma ORM + PostgreSQL
- Multi-schema approach: `prismaSchemaFolder` (one .prisma file per module)
- Soft deletes: `deletedAt DateTime?` pattern
- JSONB for flexible arrays: `photoUrls Json` (string[])

---

## Core Schema: Orders Module

```prisma
enum OrderStatus {
  ORDER_CREATED
  FIRST_PAYMENT_PENDING
  FIRST_PAYMENT_COMPLETED
  NEGOTIATION_STARTED
  SELLER_WAITING
  NEGOTIATING
  RISK_REVIEW
  APPROVED_FOR_PURCHASE
  PAID_TO_SELLER
  TRACKING_RECEIVED
  IN_TRANSIT_DE
  PICKUP_REQUIRED
  PICKUP_SCHEDULED
  PICKUP_FAILED
  ARRIVED_WAREHOUSE
  INSPECTING
  SECOND_PAYMENT_PENDING
  SECOND_PAYMENT_COMPLETED
  SHIPPED_TO_KOREA
  CUSTOMS_IN_PROGRESS
  DELIVERED
  CLOSED
  CANCELLED
  ORDER_CANCELLED
  REFUND_PENDING
  REFUNDED
  REFUND_COMPLETED
  DISPUTE_RAISED
}

enum TransactionMethod {
  SELLER_SHIP
  PICKUP
}

model ProxyOrder {
  id              String      @id @default(cuid())
  orderNumber     String      @unique  // SK-YYYYMMDD-XXXX
  status          OrderStatus @default(ORDER_CREATED)
  
  // Relations
  customerId      String
  customer        User        @relation(fields: [customerId], references: [id])
  adminId         String?
  catalogProductId String?
  
  // Product
  productUrl      String
  productTitle    String
  productTitleKo  String?     // DeepL translated
  productPrice    Decimal     // EUR
  quantity        Int         @default(1)
  totalProductPrice Decimal
  negotiationDesired Boolean  @default(false)
  
  // Transaction
  transactionMethod TransactionMethod
  pickupAddress    String?
  
  // Recipient
  recipientName    String
  recipientPhone   String
  recipientAddress String      // Korean address
  postalCode       String
  customsCode      String?     // 개인통관고유부호
  
  // Options (flags)
  needsInspection  Boolean    @default(false)
  needsRepacking   Boolean    @default(false)
  hasInsurance     Boolean    @default(false)
  isFragile        Boolean    @default(false)
  isBulkCargo      Boolean    @default(false)
  
  // Pricing (1st payment)
  commissionRate   Decimal
  commissionAmount Decimal
  domesticShippingFee Decimal @default(0)
  pickupFee        Decimal    @default(0)
  insuranceFee     Decimal    @default(0)
  exchangeRate     Decimal
  firstPaymentAmount Decimal
  
  // Warehouse / Measurement
  boxCount         Int?
  actualWeight     Decimal?   // kg
  lengthCm         Decimal?
  widthCm          Decimal?
  heightCm         Decimal?
  volumeWeight     Decimal?   // (L×W×H)/6000
  billedWeight     Decimal?   // max(actual, volume)
  
  // Pricing (2nd payment)
  internationalShippingFee Decimal?
  highValueSurcharge       Decimal?  @default(0)
  secondPaymentAmount      Decimal?
  
  // Shipping
  trackingNumber   String?
  shippingCarrier  String?
  hsCode           String?
  
  // Status
  deletedAt        DateTime?
  createdAt        DateTime   @default(now())
  updatedAt        DateTime   @updatedAt
  
  // Relations
  statusLogs       OrderStatusLog[]
  quotes           OrderQuote[]
  payments         Payment[]
  messages         OrderMessage[]
  claims           Claim[]
  receipts         Receipt[]
  negotiation      NegotiationThread?
  inbound          InboundOrder?
  pickup           PickupRequest?
  review           Review?
}

model OrderStatusLog {
  id        String      @id @default(cuid())
  orderId   String
  order     ProxyOrder  @relation(fields: [orderId], references: [id])
  fromStatus OrderStatus?
  toStatus  OrderStatus
  note      String?
  actorType String      // CUSTOMER | ADMIN | SYSTEM
  actorId   String?
  createdAt DateTime    @default(now())
}

model OrderQuote {
  id        String     @id @default(cuid())
  orderId   String
  order     ProxyOrder @relation(fields: [orderId], references: [id])
  stage     Int        // 1 or 2
  amount    Decimal
  breakdown Json       // { items: [{label, amount}] }
  expiresAt DateTime?
  createdAt DateTime   @default(now())
}

model OrderDraft {
  id        String   @id @default(cuid())
  customerId String
  formData  Json     // partial 5-step form state
  step      Int      @default(1)
  expiresAt DateTime
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

---

## Payments Module

```prisma
enum PaymentMethod {
  STRIPE
  PAYPAL
  BANK_TRANSFER
  WALLET
}

enum PaymentStatus {
  PENDING
  COMPLETED
  FAILED
  REFUNDED
  PARTIALLY_REFUNDED
}

enum PaymentStage {
  FIRST
  SECOND
}

model Payment {
  id              String        @id @default(cuid())
  orderId         String
  order           ProxyOrder    @relation(fields: [orderId], references: [id])
  stage           PaymentStage
  method          PaymentMethod
  amount          Decimal
  currency        String        @default("EUR")
  status          PaymentStatus @default(PENDING)
  idempotencyKey  String        @unique
  stripeSessionId String?
  stripePaymentIntentId String?
  paypalOrderId   String?
  bankTransferRef String?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  
  attempts        PaymentAttempt[]
  refunds         Refund[]
}

model PaymentAttempt {
  id          String   @id @default(cuid())
  paymentId   String
  payment     Payment  @relation(fields: [paymentId], references: [id])
  status      String
  errorCode   String?
  errorMessage String?
  createdAt   DateTime @default(now())
}

model PaymentWebhookEvent {
  id              String   @id @default(cuid())
  provider        String   // STRIPE | PAYPAL
  eventId         String   @unique  // stripeEventId or paypalEventId
  eventType       String
  payload         Json
  processedAt     DateTime @default(now())
}

model Refund {
  id          String   @id @default(cuid())
  paymentId   String
  payment     Payment  @relation(fields: [paymentId], references: [id])
  amount      Decimal
  reason      String?
  stripeRefundId String?
  status      String   @default("PENDING")
  createdAt   DateTime @default(now())
}

model CustomerBalance {
  id          String   @id @default(cuid())
  userId      String   @unique
  user        User     @relation(fields: [userId], references: [id])
  balance     Decimal  @default(0)
  currency    String   @default("KRW")
  updatedAt   DateTime @updatedAt
  
  transactions BalanceTransaction[]
}

model BalanceTransaction {
  id          String          @id @default(cuid())
  balanceId   String
  balance     CustomerBalance @relation(fields: [balanceId], references: [id])
  amount      Decimal         // positive = credit, negative = debit
  type        String          // DEPOSIT | PAYMENT | REFUND | ADJUSTMENT
  note        String?
  orderId     String?
  createdAt   DateTime        @default(now())
}

model DepositRequest {
  id          String   @id @default(cuid())
  userId      String
  amount      Decimal
  currency    String   @default("KRW")
  bankName    String
  accountHolder String
  depositedAt DateTime?
  confirmedAt DateTime?
  status      String   @default("PENDING")
  createdAt   DateTime @default(now())
}
```

---

## Shipping / Pickup / Warehouse Module

```prisma
model InboundOrder {
  id          String     @id @default(cuid())
  orderId     String     @unique
  order       ProxyOrder @relation(fields: [orderId], references: [id])
  
  // Measurement
  boxCount    Int?
  weightKg    Decimal?
  lengthCm    Decimal?
  widthCm     Decimal?
  heightCm    Decimal?
  volumeWeight Decimal?
  billedWeight Decimal?
  
  // Warehouse
  inboundAt   DateTime?
  location    String?   // shelf/bin
  photoUrls   Json      @default("[]")  // string[]
  status      String    @default("PENDING")
  
  inspection  InspectionRecord?
}

model InspectionRecord {
  id          String       @id @default(cuid())
  inboundId   String       @unique
  inbound     InboundOrder @relation(fields: [inboundId], references: [id])
  condition   String       // GOOD | DAMAGED | MISSING_PARTS
  issues      Json         @default("[]")  // string[]
  photoUrls   Json         @default("[]")  // string[]
  notes       String?
  inspectedBy String       // adminId
  createdAt   DateTime     @default(now())
}

model PickupRequest {
  id             String     @id @default(cuid())
  orderId        String     @unique
  order          ProxyOrder @relation(fields: [orderId], references: [id])
  sellerAddress  String
  sellerPhone    String?
  preferredDate  DateTime?
  actualDate     DateTime?
  pickupFee      Decimal
  roundTripKm    Decimal?
  status         String     @default("REQUESTED")
  eurosenderId   String?    // external pickup ref
  
  events         PickupEvent[]
}

model PickupEvent {
  id          String        @id @default(cuid())
  requestId   String
  request     PickupRequest @relation(fields: [requestId], references: [id])
  event       String        // REQUESTED | CONFIRMED | EN_ROUTE | ... (10 states)
  note        String?
  createdAt   DateTime      @default(now())
}

model ShippingRate {
  id          String   @id @default(cuid())
  zone        String   // destination country/region
  minWeightKg Decimal
  maxWeightKg Decimal
  rateEur     Decimal
  carrier     String?
  updatedAt   DateTime @updatedAt
}

model Shipment {
  id             String     @id @default(cuid())
  orderId        String     @unique
  order          ProxyOrder @relation(fields: [orderId], references: [id])
  carrier        String
  trackingNumber String
  shippedAt      DateTime
  estimatedArrival DateTime?
  deliveredAt    DateTime?
}
```

---

## Customs Module

```prisma
model CustomsProfile {
  id          String   @id @default(cuid())
  userId      String   @unique
  user        User     @relation(fields: [userId], references: [id])
  pccc        String   // 개인통관고유부호 (encrypted at rest)
  verified    Boolean  @default(false)
  verifiedAt  DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model HsCode {
  id          String   @id @default(cuid())
  code        String   @unique  // e.g. "8471.30"
  description String
  descriptionKo String?
  dutyRate    Decimal?
  notes       String?
  createdAt   DateTime @default(now())
}

model RightsRequest {
  id          String   @id @default(cuid())
  userId      String
  productType String
  brand       String?
  evidence    String?  // URL or description
  status      String   @default("PENDING")
  createdAt   DateTime @default(now())
}
```

---

## Member / Loyalty Module

```prisma
model MemberLevel {
  id          String   @id @default(cuid())
  name        String   @unique  // bronze | silver | gold | vip
  minPoints   Int
  commissionDiscount Decimal  @default(0)  // % discount off commission
  benefits    Json     @default("[]")  // string[]
  color       String?
}

model MemberTierPoint {
  id          String   @id @default(cuid())
  userId      String
  points      Int
  type        String   // EARNED | REDEEMED | ADJUSTMENT
  orderId     String?
  note        String?
  createdAt   DateTime @default(now())
}

model Coupon {
  id          String    @id @default(cuid())
  code        String    @unique
  type        String    // PERCENTAGE | FIXED_EUR | FIXED_KRW
  value       Decimal
  minOrderEur Decimal?
  maxUsage    Int?
  usedCount   Int       @default(0)
  expiresAt   DateTime?
  eventId     String?
  createdAt   DateTime  @default(now())
}

model CouponEvent {
  id          String   @id @default(cuid())
  name        String
  description String?
  coupons     Coupon[]
  createdAt   DateTime @default(now())
}
```

---

## Negotiation Module

```prisma
model NegotiationThread {
  id       String     @id @default(cuid())
  orderId  String     @unique
  order    ProxyOrder @relation(fields: [orderId], references: [id])
  status   String     @default("ACTIVE")  // ACTIVE | RESOLVED | ABANDONED
  createdAt DateTime  @default(now())
  
  messages NegotiationMessage[]
  offers   NegotiationOffer[]
}

model NegotiationMessage {
  id          String            @id @default(cuid())
  threadId    String
  thread      NegotiationThread @relation(fields: [threadId], references: [id])
  senderId    String
  senderType  String            // CUSTOMER | ADMIN
  content     String
  filteredContent String?       // contact-masked version
  deletedAt   DateTime?
  createdAt   DateTime          @default(now())
}

model NegotiationOffer {
  id          String            @id @default(cuid())
  threadId    String
  thread      NegotiationThread @relation(fields: [threadId], references: [id])
  proposedPriceEur Decimal
  note        String?
  status      String            @default("PENDING")  // PENDING | ACCEPTED | REJECTED | COUNTERED
  createdAt   DateTime          @default(now())
}
```

---

## Content / CMS / SEO Module

```prisma
model Notice {
  id          String   @id @default(cuid())
  title       String
  content     String   // HTML or markdown
  isPinned    Boolean  @default(false)
  publishedAt DateTime?
  createdAt   DateTime @default(now())
}

model Banner {
  id          String   @id @default(cuid())
  title       String
  imageUrl    String
  linkUrl     String?
  position    Int      @default(0)
  isActive    Boolean  @default(true)
  products    BannerProduct[]
}

model SeoContent {
  id          String   @id @default(cuid())
  pageKey     String   @unique  // e.g. "home", "search", "guide/insurance"
  title       String
  description String
  keywords    String?
  ogImageUrl  String?
  updatedAt   DateTime @updatedAt
}
```

---

## Accounting Module (Admin Only)

```prisma
model Receipt {
  id          String     @id @default(cuid())
  orderId     String     @unique
  order       ProxyOrder @relation(fields: [orderId], references: [id])
  type        String     // EIGENBELEG | TAX_RECEIPT | SHIPPING_INVOICE
  pdfUrl      String?
  generatedAt DateTime   @default(now())
}

model SellerPayment {
  id          String     @id @default(cuid())
  orderId     String     @unique
  order       ProxyOrder @relation(fields: [orderId], references: [id])
  sellerName  String
  sellerIban  String?
  amountEur   Decimal
  paidAt      DateTime?
  receiptUrl  String?    // Eigenbeleg PDF URL
  createdAt   DateTime   @default(now())
}
```
