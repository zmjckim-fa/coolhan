# Purchase Agency Core - Overseas Purchase Agency Standard Definition

**Version:** 1.0.0  
**Effective Date:** 2026-05-27  
**Purpose:** Overseas Purchase Agency Platform Standard Definition  
**Status:** MANDATORY for purchase agency projects  
**Language:** English

---

## 📌 Executive Summary

Purchase Agency Core defines the minimum required features, data structures, status values, and API patterns for an overseas product purchase agency platform.

**4-Stage Flow:**
1. **Overseas Purchase**: Customer requests purchase of an overseas product → agency buys it
2. **International Shipping**: Seller → local warehouse (1–2 weeks)
3. **Customs Processing**: Customs declaration, documents, inspection (3–7 days)
4. **Domestic Shipping**: Local warehouse → final customer (2–5 days)

**Core Principles:**
- One customer → one country → multiple sellers possible
- Exchange rate fixed (as of purchase time)
- Costs are explicit (purchase price + shipping + tariff + domestic shipping)
- Settlement automated

---

## 1️⃣ Built-in Features (Non-Negotiable)

### Purchase Request Management
- **Create purchase request**: Customer applies to purchase an overseas product
  - Product name, URL, seller, quantity, KRW conversion
  - Request status tracking
  - One request = one country (multi-country mix not allowed)
- **Review purchase request**: Agency decides whether purchase is feasible
  - Feasible: accept (proceed with purchase)
  - Not feasible: reject (record reason)
- **Purchase tracking**: Monitor purchase progress
  - Confirm purchase completion
  - Confirm shipping readiness

### Cost Estimation and Confirmation
- **Cost estimate (Estimate)**
  - Product purchase price (fixed)
  - International shipping fee (weight/size-based, insurance included)
  - Exchange rate (as of purchase time)
  - Estimated tariff (by product type)
  - Domestic shipping fee (by region)
  - Agency fee (default 10%)
  - Total cost = purchase price × exchange rate + international shipping + estimated tariff + domestic shipping + fee
- **Cost confirmation (Confirmation)**
  - Customer reviews the estimated cost
  - Proceed if agreed, cancel if rejected
- **Final settlement (Final Settlement)**
  - Actual cost (tariff adjusted to the actual billed amount)
  - Collect overage or refund difference

### International Shipping
- **Carrier selection**: Carrier by country (DHL, FedEx, UPS, etc.)
- **Tracking**: Real-time location lookup
- **Arrival at local warehouse**: Delivery complete, ready for customs

### Customs Processing
- **Customs filing**: Agency declares to customs
  - Product info (HS Code, country of origin)
  - Invoice
  - Other documents
- **Tariff calculation**: Auto-calculated based on product price
- **Customs status tracking**: Filed → inspection → approved/held → tax payment → cleared
- **Customs failure**: Return or re-filing procedure

### Domestic Shipping
- **Carrier selection**: Domestic courier (CJ, Korea Express, Logen, etc.)
- **Delivery tracking**: Real-time location and delivery status
- **Final delivery**: Delivered to customer's address

### Customer Communication
- **Status notifications**: Automatic notifications at each stage
- **Q&A**: Collect and answer customer questions

### Returns and Refunds
- **Return request**: Within 30 days of receiving delivery
- **Return shipping**: Reverse-order shipping (customer → domestic → customs → international → seller)
- **Refund processing**: Seller refund → customer refund
- **Cost deduction**: Shipping fees and customs fees are non-refundable

---

## 2️⃣ Base DB Structure (10 core tables)

| # | Table | Purpose | Owning Module | Row Estimate (1 year) |
|---|--------|------|---------|-----------------|
| 1 | `users` | Member info | 01_member_system | 10K-100K |
| 2 | `purchase_requests` | Purchase requests | 09_order_management | 1K-10K |
| 3 | `purchase_orders` | Actual overseas purchases | 09_order_management | 1K-10K |
| 4 | `cost_estimates` | Cost estimates | 03_payment_system | 5K-50K |
| 5 | `exchange_rates` | Exchange rate info | 03_payment_system | 365 (1 per day) |
| 6 | `international_shipments` | International shipments | 04_shipping_logistics | 1K-10K |
| 7 | `customs_declarations` | Customs filings | 04_shipping_logistics | 1K-10K |
| 8 | `domestic_shipments` | Domestic shipments | 04_shipping_logistics | 1K-10K |
| 9 | `settlements` | Settlement history | 03_payment_system | 1K-10K |
| 10 | `agency_staff` | Agency staff | 05_admin_system | 10-100 |

### Table Schema Overview

**purchase_requests**
```
id (PK) | user_id (FK) | request_number | destination_country | 
product_name | vendor_url | quantity | estimated_price_usd | 
status | created_at | updated_at | notes
```

**cost_estimates**
```
id (PK) | purchase_request_id (FK) | estimated_product_cost | international_shipping | 
insurance_cost | tariff_estimated | domestic_shipping | agency_fee | 
total_estimated_krw | exchange_rate_used | status | created_at
```

**international_shipments**
```
id (PK) | purchase_request_id (FK) | vendor_name | tracking_number | 
shipping_company | status | dispatched_at | arrived_at | created_at
```

---

## 3️⃣ Base Status Values (Status Value Registry)

### Purchase Request Status
```
(1) pending
    → (2) accepted
        → (3) purchased
            → (4) in_transit_international
                → (5) arrived_warehouse
                    → (6) processing_customs
                        → (7) customs_cleared
                            → (8) ready_to_ship_domestic
                                → (9) in_transit_domestic
                                    → (10) delivered
                                        → (11) completed
or
(1) pending → (X) rejected
Any state → (X) canceled
```

**Status descriptions:**
- `pending`: Purchase request created, awaiting agency review
- `accepted`: Agency accepted, purchase in progress
- `purchased`: Product purchased overseas
- `in_transit_international`: In international transit
- `arrived_warehouse`: Arrived at local warehouse
- `processing_customs`: Customs filing/inspection in progress
- `customs_cleared`: Customs cleared
- `ready_to_ship_domestic`: Ready for domestic shipping
- `in_transit_domestic`: In domestic transit
- `delivered`: Final delivery complete
- `completed`: Transaction complete (30-day return window elapsed)
- `rejected`: Agency deemed purchase infeasible
- `canceled`: Customer cancellation request

### Cost Status
```
(1) estimated
    → (2) confirmed
        → (3) finalized
            → (4) paid
```

### International Shipment Status
```
(1) dispatched
    → (2) in_transit
        → (3) arrived_warehouse
```

### Customs Declaration Status
```
(1) submitted
    → (2) inspecting
        → (3) approved
    or → (X) failed
```

### Domestic Shipment Status
```
(1) ready_to_ship
    → (2) in_transit
        → (3) delivered
    or → (X) failed
```

---

## 4️⃣ Base API Endpoints (40+ endpoints)

### Purchase Request (8 endpoints)
```
POST   /purchase-requests                 Create purchase request
GET    /purchase-requests                 Purchase request list (personal)
GET    /purchase-requests/{id}            Purchase request detail
PUT    /purchase-requests/{id}/cancel     Cancel purchase request
GET    /purchase-requests/{id}/tracking   Full tracking info (consolidated)
POST   /admin/purchase-requests/{id}/accept Accept purchase request (admin)
POST   /admin/purchase-requests/{id}/reject Reject purchase request (admin)
GET    /admin/purchase-requests           Purchase request list (admin)
```

### Cost Estimation (6 endpoints)
```
POST   /purchase-requests/{id}/estimate-costs  Estimate costs
GET    /purchase-requests/{id}/cost-estimate   Look up estimated cost
POST   /purchase-requests/{id}/confirm-costs   Confirm/agree to costs
GET    /purchase-requests/{id}/cost-history    Cost change history
POST   /purchase-requests/{id}/finalize-costs  Final cost settlement (admin)
GET    /purchase-requests/{id}/tariff-estimate Look up estimated tariff
```

### Exchange Rate (3 endpoints)
```
GET    /exchange-rates                    Look up current exchange rate
GET    /exchange-rates/history/{currency} Exchange rate history
POST   /admin/exchange-rates/update       Manual exchange rate update (admin)
```

### International Shipment Tracking (5 endpoints)
```
GET    /purchase-requests/{id}/international-shipment  Look up international shipment
POST   /admin/shipments/{id}/dispatch                  Start shipment (admin)
PUT    /admin/shipments/{id}/tracking-update           Manual tracking update (admin)
GET    /admin/shipments                                All international shipments (admin)
POST   /admin/shipments/{id}/arrive-warehouse          Record warehouse arrival (admin)
```

### Customs Processing (6 endpoints)
```
GET    /purchase-requests/{id}/customs-declaration    Customs filing status
POST   /admin/customs/{id}/submit                     Submit customs filing (admin)
PUT    /admin/customs/{id}/update-status              Change customs status (admin)
GET    /admin/customs/{id}/tariff-actual              Confirm actual tariff (admin)
POST   /admin/customs/{id}/approve                    Approve customs clearance (admin)
POST   /admin/customs/{id}/fail-shipment              Customs failure - return (admin)
```

### Domestic Shipment Tracking (5 endpoints)
```
GET    /purchase-requests/{id}/domestic-shipment      Look up domestic shipment
POST   /admin/domestic-shipments/{id}/dispatch        Start domestic shipment (admin)
PUT    /admin/domestic-shipments/{id}/tracking-update Manual tracking update (admin)
GET    /admin/domestic-shipments                      All domestic shipments (admin)
POST   /admin/domestic-shipments/{id}/deliver         Record delivery completion (admin)
```

### Settlement & Refund (4 endpoints)
```
GET    /user/settlements                  Personal settlement history
GET    /admin/settlements                 Overall settlement status
POST   /admin/settlements/process-monthly Process monthly settlement (admin)
POST   /purchase-requests/{id}/refund     Process refund (admin)
```

### Customer Communication (3 endpoints)
```
GET    /purchase-requests/{id}/messages   Status notification messages
POST   /purchase-requests/{id}/inquiry    Customer inquiry
GET    /admin/inquiries                   All customer inquiries (admin)
```

---

## 5️⃣ Prohibitions

- ❌ **Multi-currency pricing**
- ❌ **Exchange rate retroactive adjustments**
- ❌ **Partial refunds**
- ❌ **Multi-country orders**
- ❌ **Post-confirmation shipping changes**
- ❌ **Tariff refunds**
- ❌ **Automatic reshipping after failure**

---

## 6️⃣ Industry-Standard Scenarios

### Scenario 1: Happy Path - Normal Overseas Purchase

```
Step 1: Purchase request (10 min)
  Customer: Finds a product on an overseas site (e.g., Amazon US)
  Customer: Enters product name, URL, quantity → selects country (US)
  System: Creates request, status → "pending"
  
Step 2: Agency review and acceptance (24 hours)
  Agency: Reviews request (shippable region? prohibited item?)
  Agency: Clicks "Accept"
  System: Status → "accepted"
  
Step 3: Cost estimation (1 hour)
  System: Auto-calculates
    Product price $100 + international shipping $20 + estimated tariff $20 + domestic shipping 10,000 KRW + fee $14
    Total = 182,800 KRW
  
Step 4: Cost confirmation (5 min)
  Customer: Reviews cost → clicks "Agree"
  System: Status → "cost_confirmed"
  
Step 5: Payment (5 min)
  Customer: Credit card / bank transfer
  System: Payment complete → "purchased"

Step 6: International shipping (7–14 days)
  Agency: Requests shipment via FedEx
  System: Status → "in_transit_international" → "arrived_warehouse"
  
Step 7: Customs processing (3–7 days)
  Agency: Files customs declaration
  System: Status → "processing_customs" → "customs_cleared"
  
Step 8: Domestic shipping (2–5 days)
  Agency: Requests via domestic courier
  System: Status → "ready_to_ship_domestic" → "in_transit_domestic" → "delivered"
  
Step 9: Transaction complete (after 30 days)
  System: Return window elapsed → "completed"
```

**Estimated time:** 3–5 weeks

---

### Scenario 2: Customs Failure

```
Situation: A problem arises during customs inspection

Step 1: Problem detected
  Customs: Finds a problem during product inspection
  System: Status → "customs_failed"

Step 2: Customer notification
  System: Notifies customer of "customs failure"
  Customer: Chooses re-filing or return

Step 3-A: Re-filing chosen
  Agency: Consults with customs → submits re-filing
  (Restart from Step 7)

Step 3-B: Return chosen
  System: Status → "return_initiated"
  Carrier: Starts return shipping
  Seller: Processes refund
  System: Status → "refunded"
```

---

### Scenario 3: Return After Delivery

```
Situation: Delivered product is not wanted

Step 1: Return request (within 30 days of delivery)
  Customer: "Request return" → select return reason
  System: Status → "return_requested"

Step 2: Return shipping (customer → agency)
  Agency: Provides customer with return shipping address
  Customer: Ships product to return address
  System: Status → "return_in_transit_domestic"

Step 3: Warehouse arrival (agency)
  Agency: Inspects product
  System: Status → "return_at_warehouse"

Step 4: Reverse shipping (agency → seller)
  Agency: Reverse-ships to seller
  Seller: Approves refund
  System: Status → "return_completed"

Step 5: Customer refund
  Agency: Refunds to customer's account
    Original price − shipping fee − fee (shipping fee non-refundable)
  System: Status → "refunded"
```

---

## 7️⃣ Constraints

| Item | Constraint | Reason |
|------|------|------|
| **Countries per request** | 1 country only | Simplify customs |
| **Maximum purchase amount** | $5,000 | Customs limit |
| **Minimum shipping period** | 7 days (international) | Realistic shipping period |
| **Estimated customs period** | 3–7 days | Inspection procedure |
| **Return window** | 30 days | Industry standard |
| **Exchange rate fixing point** | At purchase time | Avoid rate fluctuation risk |
| **Exchange rate change** | Applied from the following month | Customer protection |
| **Tariff estimate accuracy** | ±10% | Unpredictability |
| **Fixed shipping fee** | Weight/size-based | Transparency |
| **Agency fee** | Default 10% | Value provided |
| **Payment timeout** | 24 hours | Stock-securing period |

---

## ✅ Checklist

- [ ] 10 base DB tables created
- [ ] 40+ API endpoints implemented
- [ ] Purchase request status transition logic implemented
- [ ] Cost estimation and confirmation process implemented
- [ ] Exchange rate fixing logic implemented (as of purchase time)
- [ ] International shipment tracking integrated
- [ ] Customs filing and tracking implemented
- [ ] Cost settlement reflecting final tariff implemented
- [ ] Domestic shipment tracking integrated
- [ ] Refund process implemented (excluding shipping/fee)
- [ ] Monthly settlement automated
- [ ] Customer status notifications automated
- [ ] Multi-country mix prevention logic implemented
- [ ] Post-confirmation shipping change disabling handled
