# Architecture Conflict Resolution

**Effective Date:** 2026-05-27  
**Authority:** Design Architecture  
**Status:** CONFLICT RESOLUTION COMPLETE  

---

## Overview

Resolves the 11 architecture conflicts found while integrating the Base Knowledge Core system (shopping_mall_core, marketplace_core, purchase_agency_core, logistics_core, etc.) with the domain module system (01_member ~ 10_)*.

---

## Conflict #1: product_reviews Table Duplication

**Problem:**
- 02_shopping_mall (domain module): includes product_reviews table
- 07_review_rating_system (domain module): includes review_ratings table
- shopping_mall_core: may include product_reviews

**Solution:**

### Single Source of Truth: 07_review_rating_system

```
Ownership: 07_review_rating_system (dedicated to review and rating management)

Table consolidation:
- 07_review_rating_system manages all reviews/ratings
- 02_shopping_mall delegates review functionality to 07_review_rating_system

Removed from 02_shopping_mall:
- product_reviews table
- /products/{id}/reviews endpoint (provided instead by 07_review_rating_system)

Provided by 07_review_rating_system:
- reviews, ratings, review_replies tables
- /reviews/{product_id} (review list)
- /reviews/{id} (review detail)
- /reviews/{id}/rate (rate)
- /reviews/{id}/reply (review reply)
```

**Rule:**
```
IF module needs review functionality
THEN call 07_review_rating_system APIs
ELSE forbidden to store reviews in 02_shopping_mall
```

---

## Conflict #2: inventory_transactions Table Duplication

**Problem:**
- 02_shopping_mall (domain module): may include inventory_transactions
- 08_inventory_management: includes inventory_transactions
- shopping_mall_core defines only simple inventory

**Solution:**

### Single Source of Truth: 08_inventory_management

```
Ownership: 08_inventory_management (dedicated to inventory management)

Table consolidation:
- 08_inventory_management manages all inventory transactions
- 02_shopping_mall can only query inventory (read-only)

Removed from 02_shopping_mall:
- inventory_transactions table
- inventory_levels management logic

Allowed in 02_shopping_mall:
- products.stock_quantity field (read-only)
- /products/{id}/inventory (GET only, queried from 08)

Provided by 08_inventory_management:
- inventory_transactions (records all inventory changes)
- inventory_reservations (reserve inventory on order)
- inventory_adjustments (corrections, authenticity inspection, etc.)
- /inventory/{product_id} (GET - current inventory)
- /inventory/{product_id}/transactions (GET - transaction history)
- /inventory/reserve (POST - called from 09_order_management)
- /inventory/release (POST - called from 09_order_management)
```

**Rule:**
```
IF module needs to update inventory
THEN call 08_inventory_management POST/PUT APIs
ELSE forbidden to modify inventory in 02_shopping_mall

09_order_management integration:
- On order creation, call 08_inventory_management.reserve()
- On order cancellation, call 08_inventory_management.release()
```

---

## Conflict #3: Insufficient Status Value Registry

**Problem:**
- Each module defines its own status values
- Status value names across modules may differ or conflict
- Status transition rules are not clear

**Solution:**

### Solution: Create 00_STATUS_VALUE_REGISTRY.md (separate document)

```
In this document:
- Consolidated definition of all status values of all modules
- Clarification of status transition rules
- Standardization of conflicting status value names
```

---

## Conflict #4: /admin/audit-log Endpoint Conflict

**Problem:**
- 01_member_system: /admin/audit-log (user login/logout audit)
- 05_admin_system: /admin/audit-log (whole-system audit)

**Solution:**

### Single Source of Truth: 05_admin_system

```
Ownership: 05_admin_system (consolidated management of all audit logs)

Changed in 01_member_system:
❌ /admin/audit-log (removed)
✓ /admin/member/login-history (changed - user login history)
✓ /admin/member/activity-log (changed - user activity log)

Provided by 05_admin_system:
- /admin/audit-log (all system audit logs)
- /admin/audit-log?type=member (member-related)
- /admin/audit-log?type=order (order-related)
- /admin/audit-log?type=payment (payment-related)
- /admin/audit-log?type=inventory (inventory-related)
```

**Rule:**
```
IF endpoint starts with /admin/
THEN provided only by 05_admin_system
ELSE provided by each module under the /module/ prefix

Exceptions:
- /admin/member/login-history (managed by 01_member_system, separate)
- /admin/member/activity-log (managed by 01_member_system, separate)
```

---

## Conflict #5: /admin/inventory Endpoint Conflict

**Problem:**
- 02_shopping_mall: /admin/inventory (product inventory query)
- 08_inventory_management: /admin/inventory (inventory management)

**Solution:**

### Single Source of Truth: 08_inventory_management

```
Ownership: 08_inventory_management (all inventory query and management)

Changed in 02_shopping_mall:
❌ /admin/inventory (removed)
✓ /admin/products/{id}/details (product detail - includes inventory)

Provided by 08_inventory_management:
- /admin/inventory (all inventory status)
- /admin/inventory/{product_id} (specific product inventory)
- /admin/inventory/{product_id}/transactions (transaction history)
- /admin/inventory/{product_id}/adjust (inventory adjustment)
- /admin/inventory/low-stock (low stock alert)
- /admin/inventory/forecast (inventory forecast)
```

---

## Conflict #6: Order Total Calculation Inconsistency

**Problem:**
- 03_payment_system: order_total = product_price × quantity
- 09_order_management: order_total = product_price × quantity + shipping + tax - discount
- shipping_logistics_core: includes shipping cost

**Solution:**

### Consolidated Calculation Rule (owned by 09_order_management)

```
Order Total Calculation (09_order_management):

total = base_amount + shipping_cost + tax - discount + additional_fees

Where:
- base_amount = SUM(product_price × quantity) 
  (queried from 02_shopping_mall)
  
- shipping_cost = shipping cost (queried from 04_shipping_logistics)
  
- tax = VAT (local tax law applied)
  
- discount = discount amount (coupons, promotions, etc.)
  
- additional_fees = other costs
  (commission, handling_fee, etc.)

Role of 03_payment_system:
- ✓ Confirm payment amount (using the total received from 09)
- ✓ Process payment
- ✓ Process refund
- ❌ Calculate order total (use only 09's value)

Rule:
IF payment_amount != order_total
THEN reject transaction (amount mismatch)
```

---

## Conflict #7: Inventory Reservation Timing

**Problem:**
- 08_inventory_management: reserve immediately on order creation
- 09_order_management: reserve on payment completion
- purchase_agency_core: reserve on purchase approval

**Solution:**

### Consolidated Inventory Reservation Policy (owned by 08_inventory_management)

```
Inventory reservation timing:

General shopping (shopping_mall_core):
1. Order creation (09) → inventory reserved (08)
2. Payment completion (03) → inventory confirmed
3. Shipping start (04) → inventory deducted
4. Shipping completion (04) → inventory settled

Marketplace (marketplace_core):
1. Order creation (09) → inventory reserved per seller (08)
2. Seller confirmation (seller) → inventory reservation maintained
3. Payment completion (03) → inventory confirmed
4. Seller shipping preparation (04) → inventory deducted
5. Shipping completion (04) → inventory settled

Purchase agency (purchase_agency_core):
1. Purchase request (req) → no inventory reservation (overseas purchase)
2. Purchase completion (agency) → local inventory reserved (dedicated)
3. Domestic arrival (04) → inventory confirmed
4. Domestic shipping (04) → inventory deducted

Rule:
- Inventory reservation is managed only in 08_inventory_management
- Other modules call only 08's API
- Timing may differ per core (see above)
```

---

## Conflict #8: Payment Idempotency Guarantee

**Problem:**
- 03_payment_system: what if the same order is paid twice?
- 09_order_management: retry after payment failure?
- External payment gateway: duplicate payment possible?

**Solution:**

### Payment Idempotency Rule (owned by 03_payment_system)

```
Idempotency guarantee strategy:

1. Generate a Payment Idempotency Key per order
   - payment_idempotency_key = MD5(order_id + user_id + amount)
   - Storage: idempotency_key field in the payments table

2. Validate on payment request
   IF payment with same idempotency_key EXISTS
   THEN return existing payment result (on retry)
   ELSE create new payment

3. External payment gateway integration
   - Stripe, PayPal, etc.: use Idempotency-Key header
   - Local cache: cache payment result for 1 hour

4. Payment status management
   payments.status:
   - pending → processing → completed
   - pending → processing → failed
   - completed is the final state (cannot be changed)

Rule:
IF payment_status = 'completed'
THEN cannot retry or modify
ELSE can retry with same idempotency_key

09_order_management integration:
- Payment retry is suggested (guided) by 09
- Provide a retry button to the user
- 03 guarantees idempotency
```

---

## Conflict #9: Missing Module Responsibility Matrix

**Problem:**
- Unclear which table is owned by which module
- Unclear which API is provided by which module
- Unclear which status value is managed by which module

**Solution:**

### Solution: Create 00_MODULE_RESPONSIBILITY_MATRIX.md (separate document)

```
In this document:
- State ownership per table
- State the providing module per API endpoint
- State the managing module per status value
- e.g.: 
  - products table: owned by 02_shopping_mall
  - inventory_transactions: owned by 08_inventory_management
  - /admin/audit-log: owned by 05_admin_system
```

---

## Conflict #10: Core vs Domain Module Priority

**Problem:**
- shopping_mall_core vs 02_shopping_mall
- marketplace_core vs marketplace integration
- Which one to follow?

**Solution:**

### Priority Rule

```
1st priority: domain module (01-10)
- The actual implementation standard
- The definition that has code

2nd priority: Base Knowledge Core (shopping_mall_core, etc.)
- The minimum standard definition
- Domain modules can extend/modify the Core

3rd priority: generic pattern
- If not in the Core or domain module, refer to the generic pattern

Rule:
IF domain module defines behavior
THEN use domain module definition
ELSE IF Base Knowledge Core defines
THEN use core definition
ELSE use general pattern
```

---

## Conflict #11: Cross-Module API Call Convention

**Problem:**
- Does 09_order_management call 08_inventory_management?
- Does 04_shipping_logistics call 09_order_management?
- Risk of circular references?

**Solution:**

### API Call Graph Definition

```
Allowed calls:
09_order_management 
  → 02_shopping_mall (product query)
  → 03_payment_system (payment processing)
  → 04_shipping_logistics (shipping calculation)
  → 08_inventory_management (inventory reservation)
  → 10_gdpr_privacy (personal data processing)

03_payment_system 
  → 09_order_management (order query)
  → 06_notification (payment notification)

04_shipping_logistics 
  → 09_order_management (order query)
  → 06_notification (shipping notification)

Forbidden calls:
❌ Circular reference (A → B → A)
❌ Calls 3 or more levels deep (A → B → C → D)
❌ Direct calls between modules at the same level

Rule:
IF call violates graph
THEN route through 09_order_management (orchestrator)
```

---

## Summary: Resolved Conflicts

| # | Conflict | Cause | Solution | Owner Module |
|---|------|------|--------|---------|
| 1 | product_reviews duplication | Two modules manage reviews | 07_review_rating_system owns | 07 |
| 2 | inventory_transactions duplication | Two modules manage inventory | 08_inventory_management owns | 08 |
| 3 | Missing status value definition | Status value mismatch per module | Create 00_STATUS_VALUE_REGISTRY | Registry |
| 4 | /admin/audit-log conflict | Two modules handle audit log | 05_admin_system owns | 05 |
| 5 | /admin/inventory conflict | Two modules query inventory | 08_inventory_management owns | 08 |
| 6 | Order total calculation inconsistency | Different calculation formulas | 09_order_management owns | 09 |
| 7 | Inventory reservation timing inconsistency | Different timing per core | Policy managed in 08_inventory_management | 08 |
| 8 | Payment idempotency not guaranteed | Risk of duplicate payment | idempotency_key managed in 03_payment_system | 03 |
| 9 | Unclear module responsibility | Ambiguous who does what | Create 00_MODULE_RESPONSIBILITY_MATRIX | Matrix |
| 10 | Core vs Module priority | Unclear which to follow | Define priority rule | Rule |
| 11 | Cross-module call convention | Risk of circular reference | Define API call graph | Graph |

---

## Sign-off

**Document:** 00_ARCHITECTURE_CONFLICT_RESOLUTION.md  
**Created:** 2026-05-27  
**Authority:** Design Architecture  
**Status:** 🟢 **COMPLETE - All conflicts resolved**

**Next steps:**
- [ ] Create 00_STATUS_VALUE_REGISTRY.md
- [ ] Create 00_MODULE_RESPONSIBILITY_MATRIX.md
- [ ] Update domain modules (01-10) (reflecting conflict resolution)
- [ ] Update Base Knowledge Core (reflecting conflict resolution)
- [ ] Upload to GitHub
