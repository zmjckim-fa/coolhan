# Status Value Registry

**Effective Date:** 2026-05-27  
**Authority:** Design Architecture  
**Status:** MASTER REFERENCE  

---

## Overview

Centrally manages the status values used across all modules and the Core.
Prevents status value conflicts, clarifies state transition rules, and eases audit tracing.

---

## 1. Member System (01_member_system)

### User Status

| Status | Description | Allowed Transitions | Owning Module |
|--------|-------------|---------------------|---------------|
| `pending_verification` | Awaiting email verification after sign-up | verified, inactive | 01 |
| `verified` | Active user | active, suspended | 01 |
| `active` | Normally active user | suspended, inactive | 01 |
| `suspended` | Temporarily suspended (policy violation) | active, deleted | 01 |
| `inactive` | Long-term unused | active, deleted | 01 |
| `deleted` | Account deleted (unrecoverable) | (none - final state) | 01 |

### Login History

| Status | Description | Owning Module |
|--------|-------------|---------------|
| `success` | Login succeeded | 01 |
| `failed_wrong_password` | Wrong password | 01 |
| `failed_not_found` | Account not found | 01 |
| `failed_suspended` | Suspended account | 01 |
| `locked` | Locked due to 5 or more failed login attempts | 01 |

---

## 2. Shopping Mall (02_shopping_mall)

### Product Status

| Status | Description | Allowed Transitions | Owning Module |
|--------|-------------|---------------------|---------------|
| `draft` | Being drafted | active, archived | 02 |
| `active` | On sale | inactive, archived | 02 |
| `inactive` | Sale halted (stock remains) | active, archived | 02 |
| `archived` | Archived (sale ended) | (none - final state) | 02 |

### Product Category Status

| Status | Description | Owning Module |
|--------|-------------|---------------|
| `active` | Active category | 02 |
| `inactive` | Inactive category | 02 |

---

## 3. Payment System (03_payment_system)

### Payment Status

| Status | Description | Allowed Transitions | Owning Module |
|--------|-------------|---------------------|---------------|
| `pending` | Awaiting payment (not yet attempted) | processing, canceled | 03 |
| `processing` | Payment in progress | completed, failed | 03 |
| `completed` | Payment completed | refunding | 03 |
| `failed` | Payment failed | processing, canceled | 03 |
| `refunding` | Refund in progress | refunded | 03 |
| `refunded` | Refund completed (partial/full) | (none - final state) | 03 |
| `canceled` | Payment canceled (user/system) | (none - final state) | 03 |

### Refund Status

| Status | Description | Owning Module |
|--------|-------------|---------------|
| `requested` | Refund requested | 03 |
| `approved` | Refund approved | 03 |
| `processing` | Refund in progress | 03 |
| `completed` | Refund completed | 03 |
| `rejected` | Refund rejected | 03 |

---

## 4. Shipping & Logistics (04_shipping_logistics)

### Domestic Shipment Status

| Status | Description | Allowed Transitions | Owning Module |
|--------|-------------|---------------------|---------------|
| `ready_to_ship` | Preparing for shipment | in_transit, canceled | 04 |
| `in_transit` | In transit | delivered, failed | 04 |
| `delivered` | Delivery completed (received) | (none - final state) | 04 |
| `failed` | Delivery failed (lost, returned, etc.) | in_transit, returned | 04 |
| `returned` | Returned to sender | (none - final state) | 04 |
| `canceled` | Shipment canceled | (none - final state) | 04 |

### International Shipment Status

| Status | Description | Allowed Transitions | Owning Module |
|--------|-------------|---------------------|---------------|
| `dispatched` | Dispatched overseas | in_transit, customs_held | 04 |
| `in_transit` | In transit | arrived, customs_held | 04 |
| `customs_held` | Awaiting/under customs inspection | customs_cleared, rejected | 04 |
| `customs_cleared` | Customs cleared | domestic_dispatch | 04 |
| `domestic_dispatch` | Switched to domestic delivery | in_transit | 04 |
| `arrived` | Arrived in Korea | customs_held, customs_cleared | 04 |
| `rejected` | Customs rejected (returned/disposed) | (none - final state) | 04 |

### Carrier Status

| Status | Description | Owning Module |
|--------|-------------|---------------|
| `active` | Active carrier | 04 |
| `inactive` | Inactive carrier | 04 |

---

## 5. Admin System (05_admin_system)

### Admin User Role

| Status | Description | Owning Module |
|--------|-------------|---------------|
| `super_admin` | Full system administration | 05 |
| `admin` | General administration | 05 |
| `moderator` | Content moderation | 05 |
| `support_agent` | Customer support | 05 |
| `viewer` | View only | 05 |

### Audit Log Type

| Type | Description | Owning Module |
|------|-------------|---------------|
| `user_login` | User login | 01 |
| `user_logout` | User logout | 01 |
| `product_create` | Product created | 02 |
| `product_update` | Product updated | 02 |
| `product_delete` | Product deleted | 02 |
| `order_create` | Order created | 09 |
| `order_cancel` | Order canceled | 09 |
| `payment_process` | Payment processed | 03 |
| `refund_process` | Refund processed | 03 |
| `shipment_create` | Shipment created | 04 |
| `shipment_update` | Shipment updated | 04 |
| `inventory_adjust` | Inventory adjusted | 08 |
| `user_suspend` | User suspended | 05 |
| `seller_verify` | Seller verified | 01/marketplace |
| `dispute_resolve` | Dispute resolved | 09 |

---

## 6. Notification System (06_notification)

### Notification Status

| Status | Description | Allowed Transitions | Owning Module |
|--------|-------------|---------------------|---------------|
| `pending` | Awaiting delivery | sent, failed, canceled | 06 |
| `sent` | Delivery completed | read, archived | 06 |
| `failed` | Delivery failed | pending, archived | 06 |
| `read` | Read | archived | 06 |
| `archived` | Archived | (none - final state) | 06 |
| `canceled` | Canceled | (none - final state) | 06 |

### Notification Type

| Type | Description | Owning Module |
|------|-------------|---------------|
| `order_created` | Order created | 09 |
| `payment_confirmed` | Payment completed | 03 |
| `shipment_dispatched` | Shipment dispatched | 04 |
| `shipment_delivered` | Delivery completed | 04 |
| `review_requested` | Review requested | 07 |
| `product_restocked` | Product restocked | 08 |
| `seller_verified` | Seller approved | marketplace |
| `dispute_created` | Dispute created | 09 |

---

## 7. Review & Rating System (07_review_rating_system)

### Review Status

| Status | Description | Allowed Transitions | Owning Module |
|--------|-------------|---------------------|---------------|
| `submitted` | Submitted | approved, rejected | 07 |
| `approved` | Approved | hidden, deleted | 07 |
| `rejected` | Rejected (inappropriate content) | (none - final state) | 07 |
| `hidden` | Hidden (admin decision) | approved, deleted | 07 |
| `deleted` | Deleted (user/admin) | (none - final state) | 07 |

### Rating Status

| Status | Description | Owning Module |
|--------|-------------|---------------|
| `submitted` | Rating submitted | 07 |
| `calculated` | Average calculated | 07 |

---

## 8. Inventory Management (08_inventory_management)

### Inventory Status

| Status | Description | Allowed Transitions | Owning Module |
|--------|-------------|---------------------|---------------|
| `in_stock` | Sufficient stock | low_stock, out_of_stock | 08 |
| `low_stock` | Low stock (below threshold) | in_stock, out_of_stock | 08 |
| `out_of_stock` | Out of stock | in_stock | 08 |

### Inventory Transaction Type

| Type | Description | Owning Module |
|------|-------------|---------------|
| `purchase` | Purchase (inbound) | 08 |
| `sale` | Sale (outbound) | 08 |
| `return` | Return | 08 |
| `adjustment` | Manual adjustment | 08 |
| `damage` | Damaged/disposed | 08 |
| `audit` | Physical inventory count | 08 |

### Inventory Reservation Status

| Status | Description | Allowed Transitions | Owning Module |
|--------|-------------|---------------------|---------------|
| `reserved` | Reserved (at order creation) | confirmed, released | 08 |
| `confirmed` | Confirmed (at payment completion) | released | 08 |
| `released` | Released (at order cancellation) | (none - final state) | 08 |

---

## 9. Order Management (09_order_management)

### Order Status

| Status | Description | Allowed Transitions | Owning Module |
|--------|-------------|---------------------|---------------|
| `pending_payment` | Awaiting payment | payment_confirmed, canceled | 09 |
| `payment_confirmed` | Payment completed | shipping_ready, canceled | 09 |
| `shipping_ready` | Preparing for shipment | in_transit, canceled | 09 |
| `in_transit` | In transit | delivered, failed | 09 |
| `delivered` | Delivery completed | return_requested, settled | 09 |
| `return_requested` | Return requested | return_approved, return_rejected | 09 |
| `return_approved` | Return approved | return_in_transit, return_rejected | 09 |
| `return_in_transit` | Return in transit | return_completed, return_failed | 09 |
| `return_completed` | Return completed | refunded, (none) | 09 |
| `return_rejected` | Return rejected | settled | 09 |
| `return_failed` | Return failed | (none - final state) | 09 |
| `refunded` | Refund completed | (none - final state) | 09 |
| `settled` | Final settlement completed | (none - final state) | 09 |
| `canceled` | Order canceled | (none - final state) | 09 |
| `failed` | Order failed (undeliverable, etc.) | canceled, return_requested | 09 |

### Order Item Status

| Status | Description | Owning Module |
|--------|-------------|---------------|
| `included` | Included in order | 09 |
| `returned` | Returned | 09 |
| `refunded` | Refunded | 09 |

---

## 10. GDPR & Privacy (10_gdpr_privacy)

### Consent Status

| Status | Description | Allowed Transitions | Owning Module |
|--------|-------------|---------------------|---------------|
| `pending` | Awaiting consent | granted, denied | 10 |
| `granted` | Consent granted | withdrawn | 10 |
| `denied` | Denied | granted | 10 |
| `withdrawn` | Consent withdrawn | granted | 10 |

### Data Request Status

| Status | Description | Allowed Transitions | Owning Module |
|--------|-------------|---------------------|---------------|
| `requested` | Requested | processing, rejected | 10 |
| `processing` | Processing | completed, rejected | 10 |
| `completed` | Completed (data provided) | (none - final state) | 10 |
| `rejected` | Rejected (justified cause) | (none - final state) | 10 |

### Data Deletion Status

| Status | Description | Allowed Transitions | Owning Module |
|--------|-------------|---------------------|---------------|
| `requested` | Deletion requested | approved, rejected | 10 |
| `approved` | Approved | processing | 10 |
| `processing` | Processing | completed | 10 |
| `completed` | Deletion completed | (none - final state) | 10 |
| `rejected` | Rejected (legal retention obligation) | (none - final state) | 10 |

---

## Base Knowledge Core Status Values

### Shopping Mall Core (shopping_mall_core)

| Entity | Status Values | Owning Module |
|--------|--------------|---------------|
| Order | pending → paid → shipped → delivered | Core (09_order_management extension) |
| Payment | pending → completed → refunded | Core (03_payment_system extension) |
| User | active, suspended, inactive | Core (01_member_system extension) |
| Product | active, inactive, archived | Core (02_shopping_mall extension) |

### Marketplace Core (marketplace_core)

| Entity | Status Values | Owning Module |
|--------|--------------|---------------|
| Seller | pending_verification → verified → active → suspended | marketplace module |
| Commission Settlement | pending → calculated → paid → disputed | marketplace module |
| Dispute | created → under_review → resolved → closed | marketplace module |

### Purchase Agency Core (purchase_agency_core)

| Entity | Status Values | Owning Module |
|--------|--------------|---------------|
| Purchase Request | pending → accepted → purchased → in_transit → delivered → settled | purchase_agency module |
| Cost | estimated → confirmed → paid | 03_payment_system integration |
| International Shipment | in_transit → arrived_warehouse → processing | 04_shipping_logistics integration |

---

## State Transition Rules

### Prohibited Transitions

```
✗ Product status: draft → shipped (not allowed)
✗ Payment status: completed → processing (not allowed)
✗ Shipment status: delivered → in_transit (not allowed)
✗ Order status: canceled → payment_confirmed (not allowed)
```

### Validation Rules

```
RULE: Each state transition is allowed only along specified paths
RULE: Final states (marked ✗) cannot be reverted
RULE: State transitions are only allowed within the owning module
RULE: A timestamp must be recorded on each state transition
```

---

## API Response Status Code

### HTTP Status Code to Order Status Mapping

```
200 OK:
- GET order → order.status = any
- PATCH order → order.status updated

202 Accepted:
- POST payment → payment.status = processing

400 Bad Request:
- PATCH order (invalid status transition)
- POST payment (invalid amount)

401 Unauthorized:
- User not logged in

403 Forbidden:
- User cannot access other user's order

404 Not Found:
- Order not found

409 Conflict:
- order.status = canceled, trying to add shipment
- payment.status = completed, trying to process again

500 Server Error:
- Database error during status update
```

---

## Monitoring & Notification

### State Change Events

```
Event: OrderStatusChanged
  trigger: order.status change
  data: order_id, old_status, new_status, changed_at, changed_by
  subscribers: 06_notification, 05_admin_system (audit log)

Event: PaymentStatusChanged
  trigger: payment.status change
  data: payment_id, order_id, old_status, new_status
  subscribers: 06_notification, 09_order_management

Event: ShipmentStatusChanged
  trigger: shipment.status change
  data: shipment_id, order_id, old_status, new_status
  subscribers: 06_notification, 05_admin_system
```

---

## Sign-off

**Document:** 00_STATUS_VALUE_REGISTRY.md  
**Created:** 2026-05-27  
**Authority:** Design Architecture  
**Status:** 🟢 **MASTER REFERENCE - all modules conform to this registry**

**How to use:**
1. Reference this registry when developing each module
2. Updating this document is mandatory when adding new status values
3. Architecture team approval is required when changing state transition rules
