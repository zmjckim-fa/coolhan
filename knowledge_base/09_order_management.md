# 09_order_management.md - Order Management Domain Module

## Overview
The Order Management module handles order creation, status tracking, order fulfillment, returns management, and order lifecycle. This is the central hub coordinating other modules for the complete purchase flow.

---

## 1. Terminology Definition

| Term | Definition | Example |
|------|-----------|---------|
| **Order** | Customer purchase of one or more items | ORD-20260527-001 |
| **Order Item** | Individual product/variant in order | 1x Blue Shirt Size M |
| **Order Status** | Current stage of order lifecycle | Pending, Shipped, Delivered |
| **Order Total** | Final price including tax and shipping | $99.99 |
| **Fulfillment** | Process of preparing and shipping order | Pick → Pack → Ship |
| **Pickup** | Customer collects order from location | In-store pickup |
| **Hold** | Order temporarily delayed (customer request) | Hold until further notice |
| **Backorder** | Items not immediately available | Will ship when in stock |
| **Cancellation** | Order cancelled by customer or merchant | Refund initiated |
| **Return** | Customer returns items for refund/exchange | RMA-20260527-001 |
| **Exchange** | Customer swaps item for different variant | Size M → Size L |
| **Dispute** | Payment/order dispute with customer | Chargeback claim |
| **Fulfillment Hub** | Warehouse managing order fulfillment | Warehouse A handling order |

---

## 2. Basic Functions

### 2.1 Create Order
- **Purpose**: Create new order from cart
- **Input**: Customer ID, cart items, shipping address, shipping method, payment method
- **Process**: Validate cart → Reserve inventory → Validate payment → Create order → Set initial status
- **Output**: Order created with order number
- **Error Handling**: Inventory unavailable, payment failed, invalid address

### 2.2 Process Payment
- **Purpose**: Charge customer for order
- **Input**: Order ID, payment method
- **Process**: Calculate total → Charge payment method → Record transaction → Update order status
- **Output**: Payment processed
- **Error Handling**: Payment declined, inventory no longer available

### 2.3 Order Confirmation
- **Purpose**: Send order confirmation to customer
- **Input**: Order ID
- **Process**: Generate invoice → Send email with order details → Update status to Confirmed
- **Output**: Confirmation sent
- **Error Handling**: Customer email invalid, order not found

### 2.4 Pick & Pack
- **Purpose**: Prepare order for shipment
- **Input**: Order ID
- **Process**: Allocate inventory → Generate picking list → Pack items → Generate shipping label
- **Output**: Order ready for shipment
- **Error Handling**: Inventory not available, item damaged during picking

### 2.5 Create Shipment
- **Purpose**: Generate shipment and tracking
- **Input**: Order ID, items to ship (may be partial)
- **Process**: Create shipment record → Generate tracking → Allocate inventory → Update order
- **Output**: Shipment created with tracking
- **Error Handling**: Items not picked/packed, address invalid

### 2.6 Track Order
- **Purpose**: Display order and shipment status to customer
- **Input**: Order ID
- **Process**: Get order status → Get shipment tracking → Get estimated delivery
- **Output**: Order status with tracking details
- **Error Handling**: Order not found

### 2.7 Modify Order
- **Purpose**: Change order details (shipping address, items) before fulfillment
- **Input**: Order ID, modifications
- **Process**: Validate changes allowed → Update order → Update payment if needed → Recalculate total
- **Output**: Order updated
- **Error Handling**: Order already shipped, item no longer available

### 2.8 Hold/Delay Order
- **Purpose**: Temporarily stop order fulfillment
- **Input**: Order ID, reason, expected resume date
- **Process**: Update order status → Release inventory hold → Set resume date
- **Output**: Order on hold
- **Error Handling**: Order already shipped

### 2.9 Cancel Order
- **Purpose**: Cancel order and process refund
- **Input**: Order ID, reason, refund details
- **Process**: Validate order status → Stop fulfillment → Initiate refund → Release inventory → Update order status
- **Output**: Order cancelled, refund initiated
- **Error Handling**: Order already shipped, refund failed

### 2.10 Order Analytics
- **Purpose**: Provide insights on order data
- **Input**: Date range, filters (status, customer, product, etc.)
- **Process**: Aggregate order data → Calculate metrics (average order value, conversion rate, etc.)
- **Output**: Order analytics report
- **Error Handling**: No orders in date range, invalid filter

---

## 3. Status Values

| Status | Description | Transitions | Business Rules |
|--------|-------------|-----------|-----------------|
| **Pending** | Order created, awaiting payment | → Payment Failed, Processing | Not yet paid |
| **Processing** | Payment successful, preparing | → Shipped, Cancelled | Inventory reserved |
| **Confirmed** | Confirmed and ready for fulfillment | → Picked, On Hold | Confirmation sent |
| **Picked** | Items selected from inventory | → Packed, Cancelled | Ready for packing |
| **Packed** | Items packed for shipment | → Shipped, Cancelled | Label generated |
| **Shipped** | In transit with carrier | → Delivered, Exception | Tracking provided |
| **Delivered** | Successfully delivered | → Returned, Disputed | Complete unless return |
| **Returned** | Items returned by customer | → Refunded, Restocked | Processing return |
| **On Hold** | Temporarily delayed | → Confirmed, Cancelled | Awaiting action |
| **Cancelled** | Order cancelled | None (final) | Refund processed |
| **Disputed** | Payment/order disputed | → Resolved, Refunded | Under investigation |

---

## 4. Database Basic Structure

### Core Tables

#### orders
```
- id (PK): UUID/INT
- order_number (UNIQUE): VARCHAR(50)
- member_id (FK): UUID/INT
- status: ENUM(pending, processing, confirmed, picked, packed, shipped, delivered, returned, on_hold, cancelled, disputed)
- subtotal: DECIMAL(12,2)
- tax_amount: DECIMAL(12,2)
- shipping_cost: DECIMAL(12,2)
- discount_amount: DECIMAL(12,2)
- coupon_code: VARCHAR(50)
- total: DECIMAL(12,2)
- currency: VARCHAR(3)
- payment_status: ENUM(pending, authorized, captured, failed, refunded)
- fulfillment_status: ENUM(pending, in_progress, completed, cancelled)
- shipping_address_id (FK): UUID/INT
- shipping_method_id (FK): UUID/INT
- payment_method_id (FK): UUID/INT
- notes: TEXT
- customer_notes: TEXT
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
- placed_at: TIMESTAMP
- paid_at: TIMESTAMP
- shipped_at: TIMESTAMP
- delivered_at: TIMESTAMP
- cancelled_at: TIMESTAMP
```

#### order_items
```
- id (PK): UUID/INT
- order_id (FK): UUID/INT
- product_variant_id (FK): UUID/INT
- sku: VARCHAR(50)
- product_name: VARCHAR(255)
- quantity: INT
- unit_price: DECIMAL(12,2) (price at time of order)
- line_total: DECIMAL(12,2)
- status: ENUM(pending, picked, packed, shipped, delivered, returned, cancelled)
```

#### order_timeline
```
- id (PK): UUID/INT
- order_id (FK): UUID/INT
- event_type: VARCHAR(50) (created, paid, shipped, delivered, etc.)
- description: VARCHAR(255)
- timestamp: TIMESTAMP
- created_by: VARCHAR(50) (customer, system, admin)
```

#### order_holds
```
- id (PK): UUID/INT
- order_id (FK): UUID/INT
- reason: VARCHAR(255)
- created_at: TIMESTAMP
- expected_resume_at: DATE
- resumed_at: TIMESTAMP
```

#### order_modifications
```
- id (PK): UUID/INT
- order_id (FK): UUID/INT
- modification_type: VARCHAR(50) (address, items, quantity, etc.)
- previous_value: VARCHAR(500)
- new_value: VARCHAR(500)
- approved_by: UUID/INT
- created_at: TIMESTAMP
```

#### order_notes
```
- id (PK): UUID/INT
- order_id (FK): UUID/INT
- note_type: VARCHAR(50) (customer, internal, system)
- content: TEXT
- created_by: UUID/INT
- created_at: TIMESTAMP
```

---

## 5. API Basic Structure

### Customer Order Endpoints
```
POST   /orders                    - Create order (from cart)
GET    /orders                    - List user's orders
GET    /orders/:id                - Get order details
GET    /orders/:id/items          - Get order items
GET    /orders/:id/shipments      - Get order shipments
GET    /orders/:id/track          - Get order tracking
PUT    /orders/:id/notes          - Add customer notes
POST   /orders/:id/cancel         - Cancel order (if allowed)
```

### Admin Order Endpoints
```
GET    /admin/orders              - List all orders (filtered)
GET    /admin/orders/:id          - Order details
PUT    /admin/orders/:id          - Update order
POST   /admin/orders/:id/hold     - Place order on hold
POST   /admin/orders/:id/resume   - Resume held order
POST   /admin/orders/:id/pick     - Mark items picked
POST   /admin/orders/:id/pack     - Mark items packed
POST   /admin/orders/:id/ship     - Create shipment
POST   /admin/orders/:id/cancel   - Cancel order (admin)
PUT    /admin/orders/:id/status   - Change order status
PUT    /admin/orders/:id/address  - Update shipping address
POST   /admin/orders/:id/notes    - Add internal notes
```

### Analytics Endpoints
```
GET    /admin/orders/analytics    - Order metrics
GET    /admin/orders/revenue      - Revenue report
GET    /admin/orders/fulfillment  - Fulfillment metrics
```

---

## 6. Permissions

### Authenticated User
- POST /orders (only their own)
- GET /orders (own only)
- GET /orders/:id (own only)
- GET /orders/:id/track (own only)
- PUT /orders/:id/notes (own, internal notes restricted)
- POST /orders/:id/cancel (own, time-limited)

### Admin Only
- All /admin/orders/* endpoints
- All analytics endpoints

---

## 7. Prohibitions

### Absolute Prohibitions
- **Cannot**: Ship order without payment confirmed
- **Cannot**: Create order without inventory check
- **Cannot**: Modify order total after payment
- **Cannot**: Ship to unvalidated address
- **Cannot**: Charge payment method without explicit authorization
- **Cannot**: Refund order not actually paid

### Conditional Prohibitions
- **Unless payment successful**: Cannot move to Processing status
- **Unless items picked**: Cannot move to Packed status
- **Unless packed**: Cannot create shipment
- **Unless not yet shipped**: Cannot modify shipping address
- **Unless within refund window**: Cannot issue refund (e.g., 30 days)

---

## 8. Security Standards

### Order Security
- Orders tied to authenticated member
- Order details accessible only to owner or admin
- All order modifications logged with timestamp and user
- Order totals validated before payment
- Payment amount validated against order total

### Data Protection
- Customer address encrypted in database
- Payment method stored as token only (not full details)
- Order data archived, not deleted
- PII in orders masked in logs

### Fraud Prevention
- Verify shipping address validity
- Check for duplicate orders (same customer, same amount, < 1 hour)
- Monitor for unusual order patterns
- Rate limiting on order creation (max 5 per hour per user)

---

## 9. Acceptance Criteria

### Order Creation
- ✅ Order created from cart with correct items
- ✅ Order number generated and unique
- ✅ Inventory reserved on order creation
- ✅ Customer receives confirmation email
- ✅ Order status set to Pending

### Order Status Transitions
- ✅ Payment changes status to Processing
- ✅ Confirmation sent changes status to Confirmed
- ✅ Pick changes status to Picked
- ✅ Pack changes status to Packed
- ✅ Ship changes status to Shipped
- ✅ Delivery confirmation updates status

### Order Tracking
- ✅ Customer can view order status
- ✅ Tracking number displayed when shipped
- ✅ Order timeline shows all events
- ✅ Delivery date estimates provided

### Order Modifications
- ✅ Address can be changed before shipment
- ✅ Items can be modified before fulfillment
- ✅ Total recalculated if modifications made
- ✅ Modifications logged

### Cancellation
- ✅ Orders can be cancelled before shipment
- ✅ Refund initiated on cancellation
- ✅ Inventory released back to stock
- ✅ Cancellation logged

### Analytics
- ✅ Order metrics calculated correctly (count, total, AOV)
- ✅ Revenue reports generated
- ✅ Fulfillment metrics tracked
- ✅ Trend analysis available

---

## 10. Integration Points

### Core Integrations
- **Member System** (01_): Customer data
- **Shopping Mall** (02_): Product data
- **Payment System** (03_): Payment processing
- **Shipping Logistics** (04_): Shipping and tracking
- **Inventory Management** (08_): Stock reservation/deduction
- **Notification System** (06_): Order notifications

### Integration Hooks
- On order creation: Reserve inventory, validate payment method
- On payment success: Allocate inventory, send confirmation
- On fulfillment start: Create shipment, generate label
- On shipment: Update tracking
- On delivery: Update order status
- On return: Process return, refund

---

## 11. Configuration Parameters

| Parameter | Default | Min | Max | Notes |
|-----------|---------|-----|-----|-------|
| Auto-confirm after payment | true | - | - | Manual review option |
| Order hold default duration | 7 | 1 | 30 | Days if not specified |
| Refund window (days) | 30 | 0 | 365 | 0 = unlimited |
| Order creation rate limit | 5/hr | 1 | 20 | Per user per hour |
| Duplicate order check (min) | 60 | 1 | 1440 | Time window |
| Order detail retention | 7 | 1 | 10 | Years |
| Auto-cancel unpaid (hours) | 24 | 1 | 168 | Cancel if not paid |
| Notification on status change | true | - | - | Email/SMS alert |

---

## 12. Known Dependencies

- **Order Management** is central - depends on and coordinates with all other modules:
  - **Member System** (01_): Customer identification
  - **Shopping Mall** (02_): Product information and pricing
  - **Payment System** (03_): Payment processing
  - **Shipping Logistics** (04_): Delivery
  - **Admin System** (05_): Admin operations
  - **Notification System** (06_): Customer communications
  - **Inventory Management** (08_): Stock coordination
  - All modules interface with Order Management for their domain operations
