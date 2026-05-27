# 08_inventory_management.md - Inventory Management Domain Module

## Overview
The Inventory Management module handles stock tracking, inventory levels, supply chain management, warehouse operations, and inventory analytics. This module ensures accurate inventory data and prevents overselling.

---

## 1. Terminology Definition

| Term | Definition | Example |
|------|-----------|---------|
| **Inventory** | Quantity of product in stock | 150 units in stock |
| **Stock Level** | Current quantity of specific variant | 50 blue shirts size M |
| **SKU** | Stock Keeping Unit - unique product identifier | SHIRT-BLU-M |
| **Warehouse** | Physical location storing inventory | Main Warehouse, Regional Hub |
| **Bin/Location** | Specific storage position in warehouse | Shelf A-12-3 |
| **Stock Movement** | Change in inventory quantity | Purchase -1, Restock +100 |
| **Reservation** | Stock held for pending order | 5 units reserved |
| **Allocation** | Assignment of stock to order | Allocated for shipping |
| **Reorder Point** | Minimum stock level before reordering | Reorder when < 20 units |
| **Lead Time** | Time from order to receipt | 7 days supplier lead time |
| **Supplier** | Source of inventory | ABC Supplier Co. |
| **Purchase Order** | Request for inventory from supplier | PO-20260527-001 |
| **Receiving** | Process of adding purchased stock | Received 100 units |
| **Write-off** | Removal of stock (damaged, expired) | 5 units written off |
| **Stock Count** | Physical inventory verification | Quarterly stock count |
| **FIFO/LIFO** | Inventory accounting method | First In, First Out |

---

## 2. Basic Functions

### 2.1 Update Inventory
- **Purpose**: Adjust stock level for a product variant
- **Input**: Product variant ID, quantity change, reason, reference
- **Process**: Validate product → Check current stock → Apply change → Log transaction → Update aggregate
- **Output**: Updated inventory record
- **Error Handling**: Negative inventory (blocked by default), product not found

### 2.2 Check Stock Availability
- **Purpose**: Verify sufficient stock before allowing purchase
- **Input**: Product variant ID, required quantity
- **Process**: Query current stock → Subtract reservations → Check against required
- **Output**: Available quantity, status (In Stock, Low Stock, Out of Stock)
- **Error Handling**: Out of stock, cannot determine

### 2.3 Reserve Stock
- **Purpose**: Hold stock for pending order (prevent overselling)
- **Input**: Product variant ID, quantity, order ID
- **Process**: Check available stock → Create reservation → Update available quantity
- **Output**: Reservation created
- **Error Handling**: Insufficient stock, product not found

### 2.4 Allocate Stock
- **Purpose**: Assign reserved stock to shipment
- **Input**: Reservation ID, shipment ID
- **Process**: Verify reservation → Mark as allocated → Update stock (reserved → allocated)
- **Output**: Allocation recorded
- **Error Handling**: Reservation not found, already allocated

### 2.5 Receive Inventory
- **Purpose**: Add purchased inventory to warehouse
- **Input**: Purchase order ID, received quantity per line
- **Process**: Verify PO → Update stock → Create bin location → Log receipt → Update supplier
- **Output**: Inventory received and logged
- **Error Handling**: Over-receiving, PO not found, quantity mismatch

### 2.6 Write-off Inventory
- **Purpose**: Remove damaged/expired stock from inventory
- **Input**: Product variant ID, quantity, reason
- **Process**: Validate quantity available → Remove from stock → Log write-off → Create adjustment
- **Output**: Stock written off
- **Error Handling**: Insufficient stock, invalid reason

### 2.7 Inventory Transfer
- **Purpose**: Move stock between warehouses
- **Input**: From warehouse, to warehouse, product variant, quantity
- **Process**: Verify source stock → Deduct from source → Add to destination → Log transfer
- **Output**: Transfer completed
- **Error Handling**: Insufficient stock, warehouse not found

### 2.8 Stock Count/Audit
- **Purpose**: Physical inventory verification and adjustment
- **Input**: Warehouse, product IDs to count, actual counts
- **Process**: Compare physical vs system → Create adjustments for variances → Log audit
- **Output**: Variance report and adjustments made
- **Error Handling**: Large discrepancies require approval, data entry errors

### 2.9 Generate Reorder
- **Purpose**: Create purchase order when stock below threshold
- **Input**: Product ID, optional specific variant IDs
- **Process**: Check stock levels → Calculate reorder quantity → Create PO → Send to supplier
- **Output**: Purchase order created
- **Error Handling**: Already ordered, supplier not configured

### 2.10 Inventory Analytics
- **Purpose**: Provide insights on inventory health
- **Input**: Date range, product/category filter
- **Process**: Analyze stock levels → Calculate turnover → Identify slow-moving items → ROI analysis
- **Output**: Inventory analytics report
- **Error Handling**: Insufficient data, invalid date range

---

## 3. Status Values

| Status | Description | Transitions | Business Rules |
|--------|-------------|-----------|-----------------|
| **Available** | In stock and available for sale | → Reserved, Allocated | Can be sold |
| **Reserved** | Held for pending order | → Allocated, Released | Not available for new sales |
| **Allocated** | Assigned to shipment | → Shipped, Released | Being prepared |
| **Shipped** | In transit to customer | → Delivered, Returned | Outside warehouse |
| **Returned** | Returned by customer | → Available, Write-off | Back in warehouse |
| **Write-off** | Removed from inventory | None (final) | Not available |
| **In Transit** | In supplier delivery pipeline | → Received | Not yet in warehouse |

---

## 4. Database Basic Structure

### Core Tables

#### inventory_levels
```
- id (PK): UUID/INT
- product_variant_id (FK): UUID/INT
- warehouse_id (FK): UUID/INT
- quantity_available: INT
- quantity_reserved: INT
- quantity_allocated: INT
- last_counted_at: TIMESTAMP
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### inventory_transactions
```
- id (PK): UUID/INT
- product_variant_id (FK): UUID/INT
- warehouse_id (FK): UUID/INT
- transaction_type: ENUM(purchase, return, restock, adjustment, write-off, transfer, reservation, allocation)
- quantity_change: INT (positive or negative)
- quantity_before: INT
- quantity_after: INT
- reference_type: VARCHAR(50) (order_id, purchase_order_id, shipment_id, etc.)
- reference_id: VARCHAR(100)
- reason: VARCHAR(255)
- notes: TEXT
- created_at: TIMESTAMP
- created_by: UUID/INT
```

#### inventory_reservations
```
- id (PK): UUID/INT
- product_variant_id (FK): UUID/INT
- warehouse_id (FK): UUID/INT
- order_id (FK): UUID/INT
- quantity: INT
- status: ENUM(pending, allocated, released, fulfilled)
- reserved_at: TIMESTAMP
- allocated_at: TIMESTAMP
- released_at: TIMESTAMP
- expires_at: TIMESTAMP (hold expires if not allocated)
```

#### supplier_inventory
```
- id (PK): UUID/INT
- supplier_id (FK): UUID/INT
- product_variant_id (FK): UUID/INT
- supplier_sku: VARCHAR(50)
- unit_cost: DECIMAL(12,2)
- lead_time_days: INT
- min_order_qty: INT
- reorder_point: INT (when to reorder)
- reorder_quantity: INT (how much to order)
- is_active: BOOLEAN
```

#### purchase_orders
```
- id (PK): UUID/INT
- supplier_id (FK): UUID/INT
- po_number (UNIQUE): VARCHAR(50)
- status: ENUM(pending, confirmed, partial, received, cancelled)
- total_cost: DECIMAL(12,2)
- expected_delivery: DATE
- actual_delivery: DATE
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### purchase_order_items
```
- id (PK): UUID/INT
- purchase_order_id (FK): UUID/INT
- product_variant_id (FK): UUID/INT
- quantity_ordered: INT
- quantity_received: INT
- unit_cost: DECIMAL(12,2)
- line_total: DECIMAL(12,2)
```

#### warehouse_locations
```
- id (PK): UUID/INT
- warehouse_id (FK): UUID/INT
- location_code: VARCHAR(50) (e.g., "A-12-3")
- product_variant_id (FK): UUID/INT
- quantity: INT
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### inventory_count_audits
```
- id (PK): UUID/INT
- warehouse_id (FK): UUID/INT
- count_date: DATE
- counted_by: UUID/INT
- total_items_counted: INT
- discrepancies: INT
- variance_percentage: DECIMAL(5,2)
- notes: TEXT
- created_at: TIMESTAMP
```

---

## 5. API Basic Structure

### Inventory Query Endpoints
```
GET    /inventory/:variantId      - Get stock level
GET    /inventory/warehouse/:id   - Get warehouse inventory
GET    /inventory/analytics       - Inventory analytics
```

### Inventory Management Endpoints (Admin)
```
PUT    /admin/inventory           - Update stock
POST   /admin/inventory/reserve   - Reserve stock
POST   /admin/inventory/allocate  - Allocate stock
POST   /admin/inventory/receive   - Receive from supplier
POST   /admin/inventory/write-off - Write-off stock
POST   /admin/inventory/transfer  - Transfer between warehouses
POST   /admin/inventory/count     - Record physical count
GET    /admin/inventory/history   - Transaction history
```

### Purchase Order Endpoints (Admin)
```
GET    /admin/purchase-orders     - List POs
POST   /admin/purchase-orders     - Create PO
GET    /admin/purchase-orders/:id - PO details
PUT    /admin/purchase-orders/:id - Update PO
POST   /admin/purchase-orders/:id/cancel - Cancel PO
POST   /admin/purchase-orders/:id/receive - Mark as received
```

---

## 6. Permissions

### Authenticated User
- GET /inventory/:variantId (availability check)

### Admin Only
- All PUT/POST inventory endpoints
- All purchase order endpoints
- Analytics and audit views

---

## 7. Prohibitions

### Absolute Prohibitions
- **Cannot**: Sell product beyond available stock (unless pre-order enabled)
- **Cannot**: Modify completed transaction
- **Cannot**: Allocate unreserved stock
- **Cannot**: Negative inventory (unless explicitly enabled for overstock)
- **Cannot**: Create PO without supplier

### Conditional Prohibitions
- **Unless authorized**: Cannot write-off inventory above threshold (e.g., > 10 units)
- **Unless verified**: Cannot receive inventory quantity > PO quantity * 110%

---

## 8. Security Standards

### Inventory Integrity
- All inventory changes must be logged with timestamp, user, reason
- Concurrent inventory updates handled with locking (pessimistic or optimistic)
- Regular reconciliation between system and physical counts
- Inventory transactions immutable (cannot modify, only correct with new transaction)

### Access Control
- Warehouse staff have limited access (receive/allocate only)
- Managers can write-off/adjust inventory
- Only authorized users can approve large adjustments
- All inventory access logged and auditable

### Data Protection
- Inventory data encrypted at rest
- Real-time inventory not disclosed to competitors
- Supplier data kept confidential

---

## 9. Acceptance Criteria

### Stock Queries
- ✅ Available stock calculation correct (total - reserved - allocated)
- ✅ Stock status (In Stock, Low Stock, Out of Stock) displayed correctly
- ✅ Multiple warehouses handled correctly
- ✅ Real-time stock updates reflected

### Reservations
- ✅ Stock reserved when order created
- ✅ Reserved stock not available for other orders
- ✅ Reservations expire if not allocated (configurable)
- ✅ Can release reservations

### Receipts
- ✅ Receiving updates stock correctly
- ✅ Over-receiving detected and warned
- ✅ Stock added to correct warehouse/location
- ✅ PO line marked as received

### Write-offs
- ✅ Stock written-off removed from available
- ✅ Write-off logged with reason
- ✅ Large write-offs require approval
- ✅ Historical record maintained

### Transfers
- ✅ Stock transferred between warehouses
- ✅ Source warehouse stock decreases
- ✅ Destination warehouse stock increases
- ✅ Transfer logged as audit trail

### Counting/Audit
- ✅ Physical count can be recorded
- ✅ Variances detected and flagged
- ✅ Adjustments created for discrepancies
- ✅ Audit history maintained

---

## 10. Integration Points

### Dependency Services
- **Shopping Mall** (02_): Product stock levels
- **Order Management** (09_): Stock reservation on order
- **Payment System** (03_): Stock after payment
- **Shipping Logistics** (04_): Stock allocation on shipment
- **Notification System** (06_): Low stock alerts

### Integration Hooks
- On order created: Reserve stock
- On payment succeeded: Allocate stock
- On shipment created: Deduct from inventory
- On return: Add back to inventory
- On stock below reorder: Create PO

---

## 11. Configuration Parameters

| Parameter | Default | Min | Max | Notes |
|-----------|---------|-----|-----|-------|
| Reorder point | 10 | 1 | 1000 | Units before reorder |
| Reorder quantity | 100 | 1 | 10000 | Units per order |
| Reservation expiry (hours) | 24 | 1 | 168 | Hold duration |
| Allow negative stock | false | - | - | Permit backorders |
| Stock variance threshold (%) | 5 | 1 | 20 | Alert if variance > |
| Write-off approval limit | 10 | 1 | 1000 | Units requiring approval |
| Counting frequency | quarterly | - | - | Physical audit schedule |
| Transfer approval required | false | - | - | Require approval |
| Low stock notification | true | - | - | Alert admins |

---

## 12. Known Dependencies

- **Inventory Management** depends on **Shopping Mall** (02_) for product/variant info
- **Inventory Management** is used by **Order Management** (09_) for availability
- **Inventory Management** is used by **Shipping Logistics** (04_) for weight/dimensions
- **Inventory Management** integrates with **Notification System** (06_) for alerts
