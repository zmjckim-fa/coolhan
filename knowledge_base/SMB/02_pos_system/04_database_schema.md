# POS System - Database Schema

## Overview

The POS system database schema is designed around transactions, products, inventory, payments, and returns.

---

## 1. Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                       Main Entities                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────┐      ┌───────────┐       ┌────────────┐      │
│  │  USERS   │      │ TERMINALS │       │  STORES    │      │
│  └──────────┘      └───────────┘       └────────────┘      │
│       │1                 │1                    │1           │
│       │                  │                     │            │
│       │N                 │N                    │N           │
│  ┌─────────────────────────────────────────────────┐       │
│  │           TRANSACTIONS (transaction)            │       │
│  │  - transaction_id (PK)                         │       │
│  │  - terminal_id (FK)                            │       │
│  │  - store_id (FK)                               │       │
│  │  - user_id (FK)                                │       │
│  │  - transaction_time                            │       │
│  │  - status                                      │       │
│  └─────────────────────────────────────────────────┘       │
│       │1                                                    │
│       │                                                     │
│       │N                                                    │
│  ┌──────────────────────────┐                              │
│  │  TRANSACTION_ITEMS       │                              │
│  │  - transaction_item_id   │                              │
│  │  - transaction_id (FK)   │                              │
│  │  - product_id (FK)       │                              │
│  │  - quantity              │                              │
│  │  - unit_price            │                              │
│  │  - discount_amount       │                              │
│  │  - tax_amount            │                              │
│  └──────────────────────────┘                              │
│       │                                                     │
│       └─────────────┬──────────────────────────────┬───┐  │
│                     │                              │   │  │
│  ┌──────────────┐   │   ┌──────────────┐   ┌─────┴──────┐│
│  │   PRODUCTS   │───┘   │  INVENTORY   │   │  PAYMENTS  ││
│  │ - product_id │       │ - product_id │   │ - pay_id   ││
│  │ - sku        │       │ - store_id   │   │ - trans_id ││
│  │ - name       │       │ - quantity   │   │ - method   ││
│  │ - selling... │       │ - min_qty    │   │ - amount   ││
│  └──────────────┘       └──────────────┘   │ - status   ││
│       │                                     └────────────┘│
│       │                                                    │
│       │N            ┌────────────────┐                    │
│  ┌──────────────────┤ CATEGORIES     │                    │
│  │  - category_id   └────────────────┘                    │
│  │  - category_name                                       │
│  └──────────────────────────────────────────────────────┐ │
│                                                          │ │
│  ┌──────────────────┐      ┌─────────────────┐          │ │
│  │   RETURNS        │      │  MEMBER DISCOUNTS         │ │
│  │ - return_id      │      │  - member_id    │          │ │
│  │ - trans_id (FK)  │      │  - discount_rate          │ │
│  │ - item_id (FK)   │      └─────────────────┘          │ │
│  │ - quantity       │                                    │ │
│  │ - reason         │                                    │ │
│  │ - refund_amount  │                                    │ │
│  │ - status         │                                    │ │
│  └──────────────────┘                                    │ │
│                                                          │ │
└──────────────────────────────────────────────────────────┘
```

---

## 2. Table Definitions

### 2.1 STORES (store)

```sql
CREATE TABLE STORES (
    store_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    store_code VARCHAR(20) UNIQUE NOT NULL,
    store_name VARCHAR(100) NOT NULL,
    address VARCHAR(255),
    phone VARCHAR(20),
    manager_name VARCHAR(50),
    open_time TIME,
    close_time TIME,
    status ENUM('ACTIVE', 'INACTIVE', 'CLOSED'),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_store_code (store_code),
    INDEX idx_status (status)
);
```

### 2.2 TERMINALS (register)

```sql
CREATE TABLE TERMINALS (
    terminal_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    store_id BIGINT NOT NULL,
    terminal_code VARCHAR(20) NOT NULL,
    terminal_name VARCHAR(50),
    status ENUM('ACTIVE', 'INACTIVE', 'MAINTENANCE'),
    ip_address VARCHAR(15),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (store_id) REFERENCES STORES(store_id),
    UNIQUE KEY uk_terminal_code (store_id, terminal_code),
    INDEX idx_store_id (store_id),
    INDEX idx_status (status)
);
```

### 2.3 USERS (cashier/user)

```sql
CREATE TABLE USERS (
    user_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    store_id BIGINT NOT NULL,
    username VARCHAR(50) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    role ENUM('CASHIER', 'MANAGER', 'ADMIN'),
    status ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED'),
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (store_id) REFERENCES STORES(store_id),
    UNIQUE KEY uk_username (store_id, username),
    INDEX idx_store_id (store_id),
    INDEX idx_role (role),
    INDEX idx_status (status)
);
```

### 2.4 CATEGORIES (product category)

```sql
CREATE TABLE CATEGORIES (
    category_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    category_code VARCHAR(20) UNIQUE NOT NULL,
    category_name VARCHAR(100) NOT NULL,
    parent_category_id BIGINT,
    description TEXT,
    status ENUM('ACTIVE', 'INACTIVE'),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (parent_category_id) REFERENCES CATEGORIES(category_id),
    INDEX idx_parent (parent_category_id),
    INDEX idx_status (status)
);
```

### 2.5 PRODUCTS (product)

```sql
CREATE TABLE PRODUCTS (
    product_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    sku VARCHAR(50) UNIQUE NOT NULL,
    barcode VARCHAR(100) UNIQUE,
    product_name VARCHAR(200) NOT NULL,
    category_id BIGINT NOT NULL,
    description TEXT,
    selling_price DECIMAL(10, 2) NOT NULL,
    cost_price DECIMAL(10, 2) NOT NULL,
    tax_rate DECIMAL(5, 2) DEFAULT 10.00,
    status ENUM('ACTIVE', 'INACTIVE', 'DISCONTINUED'),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (category_id) REFERENCES CATEGORIES(category_id),
    UNIQUE KEY uk_sku (sku),
    UNIQUE KEY uk_barcode (barcode),
    INDEX idx_category (category_id),
    INDEX idx_status (status),
    INDEX idx_barcode (barcode)
);
```

### 2.6 INVENTORY (inventory)

```sql
CREATE TABLE INVENTORY (
    inventory_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    store_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity_on_hand INT NOT NULL DEFAULT 0,
    min_stock_quantity INT DEFAULT 10,
    reorder_quantity INT DEFAULT 50,
    last_stock_count TIMESTAMP,
    last_counted_quantity INT,
    status ENUM('OK', 'LOW', 'OUT_OF_STOCK', 'OVERSTOCK'),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (store_id) REFERENCES STORES(store_id),
    FOREIGN KEY (product_id) REFERENCES PRODUCTS(product_id),
    UNIQUE KEY uk_inventory (store_id, product_id),
    INDEX idx_store_id (store_id),
    INDEX idx_product_id (product_id),
    INDEX idx_status (status)
);
```

### 2.7 INVENTORY_MOVEMENTS (inventory movement log)

```sql
CREATE TABLE INVENTORY_MOVEMENTS (
    movement_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    store_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    movement_type ENUM('SALE', 'RETURN', 'INBOUND', 'ADJUSTMENT', 'LOSS'),
    quantity_change INT NOT NULL,
    transaction_id BIGINT,
    reference_number VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT,
    
    FOREIGN KEY (store_id) REFERENCES STORES(store_id),
    FOREIGN KEY (product_id) REFERENCES PRODUCTS(product_id),
    FOREIGN KEY (transaction_id) REFERENCES TRANSACTIONS(transaction_id),
    FOREIGN KEY (created_by) REFERENCES USERS(user_id),
    INDEX idx_store_product (store_id, product_id),
    INDEX idx_created_at (created_at),
    INDEX idx_movement_type (movement_type)
);
```

### 2.8 TRANSACTIONS (transaction)

```sql
CREATE TABLE TRANSACTIONS (
    transaction_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    store_id BIGINT NOT NULL,
    terminal_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    transaction_date DATE NOT NULL,
    transaction_time TIMESTAMP NOT NULL,
    subtotal DECIMAL(12, 2) NOT NULL,
    discount_amount DECIMAL(12, 2) DEFAULT 0,
    tax_amount DECIMAL(12, 2) DEFAULT 0,
    total_amount DECIMAL(12, 2) NOT NULL,
    status ENUM('COMPLETED', 'CANCELLED', 'PARTIALLY_RETURNED'),
    transaction_mode ENUM('POS', 'ONLINE_PICKUP'),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (store_id) REFERENCES STORES(store_id),
    FOREIGN KEY (terminal_id) REFERENCES TERMINALS(terminal_id),
    FOREIGN KEY (user_id) REFERENCES USERS(user_id),
    INDEX idx_store_id (store_id),
    INDEX idx_transaction_date (transaction_date),
    INDEX idx_transaction_time (transaction_time),
    INDEX idx_status (status),
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at),
    CONSTRAINT chk_amount CHECK (total_amount >= 0)
);
```

### 2.9 TRANSACTION_ITEMS (transaction item)

```sql
CREATE TABLE TRANSACTION_ITEMS (
    transaction_item_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    transaction_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    discount_rate DECIMAL(5, 2) DEFAULT 0,
    tax_amount DECIMAL(10, 2) DEFAULT 0,
    line_total DECIMAL(12, 2) NOT NULL,
    
    FOREIGN KEY (transaction_id) REFERENCES TRANSACTIONS(transaction_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES PRODUCTS(product_id),
    INDEX idx_transaction_id (transaction_id),
    INDEX idx_product_id (product_id),
    CONSTRAINT chk_quantity CHECK (quantity > 0),
    CONSTRAINT chk_line_total CHECK (line_total >= 0)
);
```

### 2.10 PAYMENTS (payment)

```sql
CREATE TABLE PAYMENTS (
    payment_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    transaction_id BIGINT NOT NULL,
    payment_method ENUM('CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'GIFT_CARD', 'MOBILE_PAY'),
    payment_amount DECIMAL(12, 2) NOT NULL,
    reference_number VARCHAR(50),
    approval_number VARCHAR(50),
    payment_status ENUM('COMPLETED', 'FAILED', 'PENDING', 'REFUNDED'),
    pg_response_code VARCHAR(20),
    pg_response_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (transaction_id) REFERENCES TRANSACTIONS(transaction_id),
    UNIQUE KEY uk_transaction_payment (transaction_id, payment_method),
    INDEX idx_payment_method (payment_method),
    INDEX idx_payment_status (payment_status),
    INDEX idx_created_at (created_at)
);
```

### 2.11 RETURNS (return)

```sql
CREATE TABLE RETURNS (
    return_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    store_id BIGINT NOT NULL,
    original_transaction_id BIGINT NOT NULL,
    return_date DATE NOT NULL,
    return_time TIMESTAMP NOT NULL,
    return_status ENUM('REQUESTED', 'APPROVED', 'REJECTED', 'COMPLETED'),
    refund_amount DECIMAL(12, 2) NOT NULL,
    refund_method ENUM('CASH', 'ORIGINAL_PAYMENT', 'STORE_CREDIT'),
    return_reason TEXT,
    notes TEXT,
    authorized_by BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    
    FOREIGN KEY (store_id) REFERENCES STORES(store_id),
    FOREIGN KEY (original_transaction_id) REFERENCES TRANSACTIONS(transaction_id),
    FOREIGN KEY (authorized_by) REFERENCES USERS(user_id),
    INDEX idx_store_id (store_id),
    INDEX idx_return_status (return_status),
    INDEX idx_return_date (return_date)
);
```

### 2.12 RETURN_ITEMS (return item)

```sql
CREATE TABLE RETURN_ITEMS (
    return_item_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    return_id BIGINT NOT NULL,
    transaction_item_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    return_quantity INT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    refund_amount DECIMAL(10, 2) NOT NULL,
    
    FOREIGN KEY (return_id) REFERENCES RETURNS(return_id) ON DELETE CASCADE,
    FOREIGN KEY (transaction_item_id) REFERENCES TRANSACTION_ITEMS(transaction_item_id),
    FOREIGN KEY (product_id) REFERENCES PRODUCTS(product_id),
    INDEX idx_return_id (return_id),
    CONSTRAINT chk_return_qty CHECK (return_quantity > 0)
);
```

### 2.13 MEMBER_DISCOUNTS (member discount)

```sql
CREATE TABLE MEMBER_DISCOUNTS (
    member_discount_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    store_id BIGINT NOT NULL,
    member_id VARCHAR(50) NOT NULL,
    member_name VARCHAR(100),
    member_tier ENUM('BRONZE', 'SILVER', 'GOLD', 'PLATINUM'),
    discount_rate DECIMAL(5, 2) NOT NULL,
    status ENUM('ACTIVE', 'INACTIVE'),
    joined_date DATE,
    last_purchase_date DATE,
    total_purchase_amount DECIMAL(15, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (store_id) REFERENCES STORES(store_id),
    UNIQUE KEY uk_member (store_id, member_id),
    INDEX idx_member_tier (member_tier),
    INDEX idx_status (status)
);
```

### 2.14 DAILY_SETTLEMENTS (daily settlement)

```sql
CREATE TABLE DAILY_SETTLEMENTS (
    settlement_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    store_id BIGINT NOT NULL,
    terminal_id BIGINT,
    settlement_date DATE NOT NULL,
    total_sales DECIMAL(12, 2) NOT NULL,
    total_refunds DECIMAL(12, 2) DEFAULT 0,
    net_sales DECIMAL(12, 2) NOT NULL,
    cash_sales DECIMAL(12, 2) DEFAULT 0,
    card_sales DECIMAL(12, 2) DEFAULT 0,
    transaction_count INT DEFAULT 0,
    return_count INT DEFAULT 0,
    total_tax DECIMAL(12, 2) DEFAULT 0,
    opening_float DECIMAL(10, 2),
    expected_cash DECIMAL(12, 2),
    actual_cash DECIMAL(12, 2),
    cash_variance DECIMAL(12, 2),
    settlement_status ENUM('OPEN', 'CLOSED', 'BALANCED', 'ADJUSTED'),
    settled_by BIGINT,
    settled_at TIMESTAMP,
    notes TEXT,
    
    FOREIGN KEY (store_id) REFERENCES STORES(store_id),
    FOREIGN KEY (terminal_id) REFERENCES TERMINALS(terminal_id),
    FOREIGN KEY (settled_by) REFERENCES USERS(user_id),
    UNIQUE KEY uk_settlement (store_id, terminal_id, settlement_date),
    INDEX idx_settlement_date (settlement_date),
    INDEX idx_status (settlement_status)
);
```

---

## 3. Indexing Strategy

### 3.1 Performance Optimization Indexes

```
TRANSACTIONS table:
- (store_id, transaction_date): daily reconciliation query
- (terminal_id, transaction_date): reconciliation per register
- (user_id, transaction_date): performance per cashier
- transaction_time: lookup by time of day

TRANSACTION_ITEMS table:
- (transaction_id): transaction item lookup (same as PK)
- (product_id): sales volume lookup by product

INVENTORY table:
- (store_id, product_id): product stock for a specific store
- status: low-stock product lookup

PRODUCTS table:
- barcode: barcode scan search
- sku: SKU search
- category_id: lookup by category
```

### 3.2 Search Indexes

```
Product search:
- PRODUCTS(barcode): barcode scan
- PRODUCTS(sku): product code search
- PRODUCTS(product_name): product name search (full-text index recommended)

Transaction search:
- TRANSACTIONS(store_id, transaction_date): transactions by date
- TRANSACTIONS(terminal_id): by register
- TRANSACTIONS(user_id): by cashier

Inventory search:
- INVENTORY(store_id, status): low-stock products
- INVENTORY_MOVEMENTS(created_at): recent changes
```

---

## 4. Normalization

### 4.1 1NF (First Normal Form)
✓ All attributes consist of atomic values
✓ No repeating groups

### 4.2 2NF (Second Normal Form)
✓ Satisfies 1NF
✓ All non-key attributes are fully functionally dependent on the primary key

### 4.3 3NF (Third Normal Form)
✓ Satisfies 2NF
✓ No transitive functional dependency between non-key attributes

Example:
```
- PRODUCTS table: stores only product_name, selling_price, cost_price
  (category_id is an FK only; category info is in a separate table)
- TRANSACTION_ITEMS: contains only transaction item info
  (product details reference the PRODUCTS table)
```

---

## 5. ACID Transactions

### 5.1 Transaction Creation Transaction

```sql
START TRANSACTION;

-- 1. Create transaction
INSERT INTO TRANSACTIONS (...) 
VALUES (...)
SET @trans_id = LAST_INSERT_ID();

-- 2. Add transaction items (repeat)
INSERT INTO TRANSACTION_ITEMS (...) 
VALUES (@trans_id, ...);

-- 3. Decrease inventory
UPDATE INVENTORY SET quantity_on_hand = quantity_on_hand - @qty
WHERE product_id = @prod_id AND store_id = @store_id;

-- 4. Record inventory log
INSERT INTO INVENTORY_MOVEMENTS (...)
VALUES (@store_id, @prod_id, 'SALE', -@qty, @trans_id, ...);

COMMIT;
```

### 5.2 Refund Transaction

```sql
START TRANSACTION;

-- 1. Record return
INSERT INTO RETURNS (...) VALUES (...)
SET @return_id = LAST_INSERT_ID();

-- 2. Add return items
INSERT INTO RETURN_ITEMS (...) VALUES (@return_id, ...);

-- 3. Restore inventory
UPDATE INVENTORY SET quantity_on_hand = quantity_on_hand + @qty
WHERE product_id = @prod_id;

-- 4. Inventory log
INSERT INTO INVENTORY_MOVEMENTS (...)
VALUES (..., 'RETURN', @qty, ...);

-- 5. Update original transaction status
UPDATE TRANSACTIONS SET status = 'PARTIALLY_RETURNED'
WHERE transaction_id = @orig_trans_id;

-- 6. Record payment refund
INSERT INTO PAYMENTS (...) 
VALUES (@orig_trans_id, ..., 'REFUNDED');

COMMIT;
```

---

## 6. Data Retention Policy

### 6.1 Retention Period

```
- TRANSACTIONS: permanent retention (audit trail)
- TRANSACTION_ITEMS: permanent retention
- RETURNS: permanent retention
- PAYMENTS: permanent retention
- DAILY_SETTLEMENTS: permanent retention
- INVENTORY_MOVEMENTS: permanent retention
- Temporary logs: deleted after 90 days
```

### 6.2 Backup Strategy

```
- Daily incremental backup (every midnight)
- Weekly full backup (every Sunday)
- Monthly long-term retention backup (first day of each month)
- Disaster recovery backbone (separate region)
```

---

## 7. Scalability Considerations

### 7.1 Partitioning

In large-scale systems:
```
TRANSACTIONS: monthly partitioning by transaction_date
TRANSACTION_ITEMS: same as parent table (TRANSACTIONS)
INVENTORY_MOVEMENTS: monthly partitioning by created_at
DAILY_SETTLEMENTS: monthly partitioning by settlement_date
```

### 7.2 Caching

```
PRODUCTS: product info cache (1 hour)
INVENTORY: inventory info cache (real-time sync)
CATEGORIES: category cache (1 day)
MEMBER_DISCOUNTS: member discount cache (1 hour)
```

---

## 8. Example SQL Queries

### 8.1 Transaction Lookup

```sql
-- Daily sales
SELECT 
    SUM(total_amount) as daily_sales,
    COUNT(*) as transaction_count,
    AVG(total_amount) as avg_transaction
FROM TRANSACTIONS
WHERE store_id = 1 AND transaction_date = '2026-05-27';

-- Sales volume by product
SELECT 
    p.product_name,
    SUM(ti.quantity) as total_qty,
    SUM(ti.line_total) as total_sales
FROM TRANSACTION_ITEMS ti
JOIN PRODUCTS p ON ti.product_id = p.product_id
WHERE ti.transaction_id IN (
    SELECT transaction_id FROM TRANSACTIONS 
    WHERE store_id = 1 AND transaction_date = '2026-05-27'
)
GROUP BY p.product_id
ORDER BY total_sales DESC;
```

### 8.2 Inventory Lookup

```sql
-- Low-stock products
SELECT 
    p.product_name,
    i.quantity_on_hand,
    i.min_stock_quantity
FROM INVENTORY i
JOIN PRODUCTS p ON i.product_id = p.product_id
WHERE i.store_id = 1 
  AND i.quantity_on_hand <= i.min_stock_quantity
ORDER BY i.quantity_on_hand ASC;
```

### 8.3 Settlement Lookup

```sql
-- Daily settlement
SELECT * FROM DAILY_SETTLEMENTS
WHERE store_id = 1 AND settlement_date = '2026-05-27';

-- Totals by payment method
SELECT 
    pm.payment_method,
    COUNT(*) as count,
    SUM(pm.payment_amount) as total
FROM PAYMENTS pm
JOIN TRANSACTIONS t ON pm.transaction_id = t.transaction_id
WHERE t.store_id = 1 AND t.transaction_date = '2026-05-27'
GROUP BY pm.payment_method;
```

---

This database design supports all core features of the POS system and provides a scalable, audit-traceable structure.
