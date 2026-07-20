# Purchase Proxy SaaS — Terminology

## Korean Domain Terms

| Korean | English | Definition |
|--------|---------|-----------|
| 구매대행 | Purchase Proxy | Service where operator purchases on behalf of customer from a foreign marketplace |
| 배송대행 | Shipping Proxy | Customer purchases directly; operator receives at foreign warehouse and ships internationally |
| 구매대행 수수료 | Purchase Commission | Fee charged by operator for purchasing service; 9-tier percentage-based, minimum €20 |
| 구매신청 | Purchase Application | Customer's initial order submission (5-step form) |
| 운임 | Freight / Shipping Fee | International shipping cost; calculated post-inbound from actual weight/dimensions |
| 부피무게 | Volumetric Weight | (L×W×H cm) / 6000; billed when heavier than actual weight |
| 실측무게 | Actual Weight | Physical weight measured at warehouse |
| 적용무게 | Billable Weight | max(actualWeight, volumeWeight) |
| 입고 | Inbound | Moment item arrives at operator's warehouse |
| 검수 | Inspection | Physical examination of item upon inbound |
| 재포장 | Repacking | Removing original packaging and repacking for safer shipping |
| 창고 | Warehouse | Operator's facility in the origin country (e.g., Germany) |
| 픽업 | Pickup | Operator drives to seller's location to collect item |
| 픽업비 | Pickup Fee | €40 base + roundTripKm × €1.5 |
| 1차 결제 | 1st Payment | Deposit: product price + commission + estimated fees |
| 2차 결제 | 2nd Payment | Final shipping fee payment after actual measurement |
| 재견적 | Re-quote | New quote issued if exchange rate changes significantly |
| 협상 | Negotiation | Operator bargains with seller on behalf of customer |
| 구매톡 | Purchase Chat | Order-linked messaging between customer and operator |
| 브로커 메시지 | Broker Message | Admin's messages on behalf of the operator in negotiation |
| 예치금 | Deposit / Balance | Virtual wallet; loaded via bank transfer (무통장입금) |
| 무통장입금 | Bank Transfer | Direct bank transfer payment method (no card processor) |
| 수신거부 | Unsubscribe | One-click email opt-out with HMAC token |
| 회원 등급 | Member Grade | Loyalty tier: bronze → silver → gold → vip |

## Customs Terms (통관)

| Korean | English | Definition |
|--------|---------|-----------|
| 개인통관고유부호 | PCCC | Personal Customs Clearance Code; unique ID assigned to Korean individuals for customs |
| 통관 | Customs Clearance | Process of clearing goods through Korean customs |
| HS 코드 | HS Code | Harmonized System code; international product classification for tariffs |
| 관세 | Tariff / Duty | Import tax levied by Korean customs |
| 통관 서류 | Customs Documents | Documents required for customs clearance (invoice, packing list, etc.) |
| Unipass | Unipass | Korea Customs Service API for verifying personal customs codes |
| 목록통관 | Simplified Clearance | Simplified clearance for low-value goods (under ₩150,000) |
| 정식통관 | Full Clearance | Full customs process for high-value goods |
| 세관신고서 | Customs Declaration | Official declaration of goods and value |

## Technical Terms

| Term | Definition |
|------|-----------|
| OrderDraft | Temporary pre-payment order save; allows resuming before payment |
| idempotencyKey | Unique key per payment attempt; prevents double-charging on retry |
| PaymentAttempt | Log of each payment attempt with result |
| PaymentWebhookEvent | Deduplication table for Stripe/PayPal webhooks |
| Eigenbeleg | German self-receipt (Finanzamt-compliant accounting document) |
| ProxyOrder | Main order entity; fan-in 21 (highest coupling) |
| OrderStatus | 30-state enum governing the full order lifecycle |
| OrderStatusLog | Append-only audit trail of all state transitions |
| AuditLog | System-wide audit trail for admin actions |
| TranslationCache | Cached DeepL translations (German → Korean) |
| SiteConfig | Global operator settings: exchange rate, fees, policies |
| PremiumServiceDefinition | Admin-configured premium service options (insurance, inspection) |
| ShippingRate | Admin-configured international shipping rate table |
| InboundOrder | Warehouse inbound record: actual weight, dimensions, photo_urls |
| InspectionRecord | Inspection checklist and notes |
| PickupRequest | Pickup job: address, scheduled date, tracking events |
| PickupEvent | Individual events in 10-step pickup tracking |
| NegotiationThread | Conversation thread per order |
| NegotiationOffer | Price counter-offer in negotiation |
| CustomerBalance | Virtual wallet balance (예치금) |
| BalanceTransaction | Debit/credit ledger for wallet |
| MemberLevel | Loyalty grade definition |
| CouponEvent | Batch coupon issuance event |
| risk_score | Product risk classification score (legal, counterfeit, prohibited) |
| risk_summary | Human-readable risk explanation |
| ContactDraft | Pre-contact info saved before form completion |
| PricingRule | Custom pricing overrides per product/category |
| SeoContent | SEO metadata per page |
| SeoOverride | Per-URL SEO override |
| HomepageAsset | Homepage section content |
| RecommendCategory | Homepage recommended categories |
| BannerProduct | Products shown in banners |
| Notice | System announcements (공지사항) |
| Banner | Marketing banners |
| emailOptIn | Boolean: customer's marketing email consent |
| HMAC token | Unsubscribe link validation token (time-bounded) |
| soft-delete | Records marked deletedAt, not physically removed |
| 2FA on admin | Admin login requires second factor |
| RBAC | Role-Based Access Control for admin users |
| adminForce | Admin override to force any state transition |

## Order Status Values (30 States)

```
Active States:
  ORDER_CREATED            -- Order submitted, not yet quoted
  FIRST_PAYMENT_PENDING    -- 1st quote sent, awaiting payment
  FIRST_PAYMENT_COMPLETED  -- 1st payment received
  NEGOTIATION_STARTED      -- Admin starting negotiation with seller
  SELLER_WAITING           -- Waiting for seller response
  NEGOTIATING              -- Active negotiation in progress
  RISK_REVIEW              -- Product flagged for risk review
  APPROVED_FOR_PURCHASE    -- Admin approved, ready to pay seller
  PAID_TO_SELLER           -- Operator paid seller
  TRACKING_RECEIVED        -- Seller provided tracking number
  IN_TRANSIT_DE            -- Item in transit within Germany
  PICKUP_REQUIRED          -- Item needs to be picked up
  PICKUP_SCHEDULED         -- Pickup appointment set
  PICKUP_FAILED            -- Pickup attempt failed
  ARRIVED_WAREHOUSE        -- Item arrived at warehouse
  INSPECTING               -- Inspection in progress
  SECOND_PAYMENT_PENDING   -- 2nd quote sent, awaiting payment
  SECOND_PAYMENT_COMPLETED -- 2nd payment received, ready to ship
  SHIPPED_TO_KOREA         -- Item shipped internationally
  CUSTOMS_IN_PROGRESS      -- In Korean customs clearance
  DELIVERED                -- Delivered to customer
  
Terminal States:
  CLOSED                   -- Order completed and closed
  CANCELLED                -- Order cancelled
  ORDER_CANCELLED          -- Order cancelled before payment
  REFUND_PENDING           -- Refund in process
  REFUNDED                 -- Partial or full refund issued
  REFUND_COMPLETED         -- Refund fully processed
  DISPUTE_RAISED           -- Customer raised a dispute
```
