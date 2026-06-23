# Marketplace Core - Multi-Vendor E-Commerce Standard Definition

**Version:** 1.0.0  
**Effective Date:** 2026-05-27  
**Purpose:** Multi-Vendor Marketplace Platform Standard Definition  
**Status:** MANDATORY for marketplace projects  
**Language:** English

---

## 📌 Executive Summary

Marketplace Core defines the minimum required features, data structures, status values, and API patterns for a multi-vendor e-commerce platform. It extends Shopping Mall Core, adding vendor management, commissions, settlement, and dispute resolution.

**Core Principles:**
- Includes all Shopping Mall Core features + a multi-vendor layer
- Platform (Platform-to-Vendor-to-Consumer, PV2C)
- Vendor registration, verification, and independent per-vendor product management
- Per-vendor payment/settlement processing
- Dispute resolution and mediation

---

## 1️⃣ Built-in Features (Non-Negotiable)

All Shopping Mall Core features + the following additional features:

### Vendor Management
- **Vendor registration**: Distinguishes individual/corporate vendors
  - Required info: business registration number, bank account, representative info
  - Document verification (takes 1–3 days)
  - Vendor tier setting (Standard, Premium, VIP)
  - Vendor deactivation (suspended, permanently blocked)
- **Vendor profile**: Manage vendor info
  - Vendor name, description, logo/banner image
  - Vendor rating and reviews (average rating, delivery reliability)
  - Vendor policies (return period, shipping fee policy)
  - Vendor statistics (sales amount, sales volume, monthly trend)
- **Vendor approval workflow**
  - Application → review → approve/reject
  - Admin review required

### Product Catalog (independent per vendor)
- **Product registration** (vendor)
  - Per-vendor product management
  - Category selection (platform-common or vendor-custom)
  - SKU management (vendor-unique ID)
- **Product lookup** (customer)
  - Vendor filter (only a specific vendor's products)
  - Per-vendor price comparison

### Orders and Settlement
- **Per-vendor settlement**: Automatic settlement once a month
  - Sales amount = sum of product sale prices
  - Commission = sales amount × commission rate (default 5–15%, varies by category)
  - Settlement amount = sales amount − commission
  - Deducted from settlement amount when returns occur
- **Settlement cycle**: Settled at the end of each month, paid out on the 5th of the following month

### Vendor Dispute Resolution
- **Product disputes** (customer vs. vendor)
  - Inaccurate product description
  - Product not delivered
  - Quality issues
- **Shipping disputes**
  - Delivery delay
  - Delivery damage
  - Wrong product delivered
- **Return/refund disputes**
  - Return rejected
  - Refund delayed
- **Dispute resolution process**
  - Application → evidence collection (customer/vendor) → platform mediation → decision → enforcement
  - Timeout: each step within 7 days

### Vendor Communication
- **Messaging system**: Direct messaging between vendor ↔ customer
  - Order-related questions
  - After-sales (A/S) requests
  - Timeout: automatic refund available after 48 hours of no response
- **Announcements**: Vendor posts notices to customers (delivery delay, policy change, etc.)

### Vendor Marketing (optional)
- **Promotion management**: Vendor sets their own discounts
  - Fixed discount price (default)
  - Volume discounts are disabled (complexity)
- **Vendor advertising**: Top placement in category/search results (paid)

---

## 2️⃣ Base DB Structure (9 Shopping Mall Core + 7 Marketplace = 16 core tables)

| # | Table | Purpose | Owning Module | Row Estimate (1 year) |
|---|--------|------|---------|-----------------|
| 1 | `users` | Member info | 01_member_system | 10K-100K |
| 2 | `vendors` | Vendor info | 05_vendor_management | 100-1K |
| 3 | `vendor_accounts` | Vendor accounts | 05_vendor_management | 100-1K |
| 4 | `vendor_documents` | Vendor verification documents | 05_vendor_management | 100-1K |
| 5 | `products` | Products (per vendor) | 02_shopping_mall | 5K-50K |
| 6 | `product_images` | Product images | 02_shopping_mall | 25K-250K |
| 7 | `addresses` | Shipping addresses | 01_member_system | 20K-200K |
| 8 | `cart_items` | Cart | 02_shopping_mall | 100K-1M |
| 9 | `orders` | Orders (multi-vendor possible) | 09_order_management | 20K-200K |
| 10 | `order_items` | Order items (grouped by vendor) | 09_order_management | 50K-500K |
| 11 | `payments` | Payments | 03_payment_system | 20K-200K |
| 12 | `shipments` | Shipments (per vendor) | 04_shipping_logistics | 30K-300K |
| 13 | `vendor_settlements` | Vendor settlement | 03_payment_system | 1K-10K |
| 14 | `disputes` | Disputes | 06_dispute_resolution | 1K-10K |
| 15 | `vendor_messages` | Vendor-customer messages | 06_vendor_communication | 50K-500K |
| 16 | `vendor_ratings` | Vendor ratings | 07_review_rating_system | 10K-100K |

### Table Schema Overview

**vendors**
```
id (PK) | vendor_name | vendor_type (INDIVIDUAL/CORPORATE) | registration_number | 
bank_account | representative_name | status (PENDING/APPROVED/SUSPENDED/BLOCKED) | 
commission_rate | created_at | updated_at | is_active
```

**vendor_settlements**
```
id (PK) | vendor_id (FK) | settlement_month | total_sales | total_commission | 
net_amount | status (PENDING/PROCESSED/TRANSFERRED) | transfer_date | created_at
```

**disputes**
```
id (PK) | order_id (FK) | vendor_id (FK) | user_id (FK) | dispute_type | 
reason | status (OPEN/EVIDENCE_PENDING/MEDIATION/RESOLVED/CLOSED) | 
resolution | created_at | resolved_at
```

---

## 3️⃣ Base Status Values (Status Value Registry)

### Vendor Status
```
(1) pending
    → (2) approved
        → (3) active
            → (4) suspended (temporary suspension)
                → (3) active (restored)
            → (X) blocked (permanent block)
    → (X) rejected
```

### Order Status (marketplace order)
```
Same as Shopping Mall Core. Each order_item is independent per vendor
```

### Dispute Status
```
(1) open
    → (2) evidence_pending
    → (3) mediation
    → (4) resolved
    → (5) closed
```

### Settlement Status
```
(1) pending
    → (2) processed
        → (3) transferred
```

---

## 4️⃣ Base API Endpoints (50+ endpoints)

### Vendor Management (12 endpoints)
```
POST   /vendors                           Register vendor
GET    /vendors                           Vendor list (filter)
GET    /vendors/{id}                      Vendor detail lookup
PUT    /vendors/{id}                      Update vendor info
POST   /vendors/{id}/documents            Submit verification documents
GET    /vendors/{id}/documents            Document status lookup
PUT    /vendors/{id}/status               Change vendor status
POST   /vendors/{id}/bank-account         Register account info
PUT    /vendors/{id}/bank-account         Update account info
GET    /vendors/{id}/statistics           Vendor statistics
GET    /vendors/{id}/ratings              Vendor ratings
POST   /admin/vendors                     Approve vendor (admin)
```

### Vendor Settlement (6 endpoints)
```
GET    /vendors/{id}/settlements          Settlement history
GET    /vendors/{id}/settlements/{month}  Monthly settlement lookup
POST   /admin/settlements/process         Process monthly settlement (admin)
GET    /admin/settlements                 Overall settlement status (admin)
POST   /vendors/{id}/settlement-report    Download settlement statement
GET    /vendors/{id}/payout-history       Payout history
```

### Dispute Resolution (8 endpoints)
```
POST   /disputes                          File dispute
GET    /disputes                          Dispute list
GET    /disputes/{id}                     Dispute detail
POST   /disputes/{id}/evidence            Submit evidence
GET    /disputes/{id}/evidence            View evidence
PUT    /disputes/{id}/resolve             Dispute mediation decision (admin)
POST   /disputes/{id}/appeal              File appeal
GET    /admin/disputes                    All disputes (admin)
```

### Vendor Communication (4 endpoints)
```
POST   /vendors/{id}/messages             Send message
GET    /vendors/{id}/messages             Message list
GET    /vendors/{id}/messages/{message_id} Message detail
POST   /vendors/{id}/announcements        Publish announcement
```

---

## 5️⃣ Prohibitions

- ❌ **Vendor-to-Vendor transactions**
- ❌ **Automatic partial refunds**
- ❌ **Real-time exchange-rate-driven price adjustments**
- ❌ **Vendor-selective payment methods**
- ❌ **Automatic vendor tier upgrades**
- ❌ **Retroactive changes to vendor commission**

---

## 6️⃣ Industry-Standard Scenarios

### Scenario 1: Vendor Registration and Approval

```
Step 1: Vendor registration application (5 min)
  Vendor: Select individual/corporate → enter business registration number
  Vendor: Enter bank account
  Vendor: Upload documents
  System: Status → "pending"
  
Step 2: Admin review (24–72 hours)
  Admin: Verify documents, check duplicates/blacklist
  
Step 3: Approval (1 min)
  Admin: Click "Approve"
  System: Status → "approved"
  
Step 4: Complete vendor profile (10 min)
  Vendor: Enter vendor name, description, logo
  System: Status → "active"
```

**Estimated time:** 1–3 days

---

### Scenario 2: Multi-Vendor Order and Settlement

```
Step 1: Create order
  Customer: Add 2 products from Vendor A, 1 product from Vendor B
  System: Create 1 order, automatically group order_items
  
Step 2: Payment (5 min)
  Customer: Pay
  System: Status → "payment_confirmed"

Step 3: Shipping preparation (independent per vendor)
  Vendor A: Prepare → enter tracking number
  Vendor B: Prepare → enter tracking number
  System: Track shipping status for each
  
Step 4: Monthly settlement (automatic)
  Vendor A: Sales $50 − commission $5 = $45
  Vendor B: Sales $30 − commission $1.5 = $28.5
  On the 5th of the following month: paid out to each
```

---

### Scenario 3: Product Quality Dispute

```
Step 1: File dispute (customer)
  Customer: Click "File dispute" → upload evidence photos
  System: Status → "open"
  
Step 2: Vendor response (48 hours)
  Vendor: Respond and upload evidence
  System: Status → "evidence_pending"
  
Step 3: Platform mediation (admin)
  Admin: Review evidence from both sides
  Admin: Decide "refund customer" or "dismiss dispute"
  System: Status → "mediation" → "resolved"
```

---

## 7️⃣ Constraints

| Item | Constraint | Reason |
|------|------|------|
| **Maximum vendors** | Unlimited | Marketplace nature |
| **Vendor review period** | 7 days | Fast onboarding |
| **Commission rate range** | 5–25% | Adjusted by category |
| **Settlement cycle** | Once a month | Based on end of month |
| **Dispute response period** | 48 hours | Quick resolution |
| **Mediation period** | 7 days | Clear decision |
| **Message timeout** | 48 hours | Customer protection |

---

## ✅ Checklist

- [ ] 16 base DB tables created
- [ ] 50+ API endpoints implemented
- [ ] Vendor status transition logic implemented
- [ ] Automatic multi-vendor grouping on order implemented
- [ ] Per-vendor settlement auto-calculation
- [ ] Independent per-vendor shipment tracking
- [ ] Dispute resolution process implemented
- [ ] Vendor messaging system (48-hour timeout)
- [ ] Vendor rating/review system
- [ ] Commission policy applied and settlement automated
