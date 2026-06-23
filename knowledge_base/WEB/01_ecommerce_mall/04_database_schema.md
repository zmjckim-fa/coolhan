# E-Commerce Mall - Database Schema

## 1. ER Diagram

```
┌─────────────┐
│   User      │─────────┐
│ (user)      │         │
└─────────────┘         │
        │               │
        │ 1:N           │
        └─────────┬─────┘
                  │
        ┌─────────┴─────────┬──────────────┐
        │                   │              │
        ▼                   ▼              ▼
    ┌───────────┐  ┌──────────────┐  ┌────────────┐
    │ Cart      │  │ Wishlist     │  │ Address    │
    │ (cart)    │  │ (wishlist)   │  │ (address)  │
    └───────────┘  └──────────────┘  └────────────┘

┌─────────────┐
│ Product     │─────────┬────────────┐
│ (product)   │         │            │
└─────────────┘    1:N   │ 1:N        │
        │                │            │
    ┌───┴───────┬────────┴─┐    ┌────┴─────────┐
    │           │          │    │               │
    ▼           ▼          ▼    ▼               ▼
┌─────────┐ ┌────────┐ ┌────────┐ ┌───────────┐
│ Category│ │  Review│ │ CartItem│ │ WishItem  │
│(category)│ │(review)│ │(cart item)│ │(wish item)│
└─────────┘ └────────┘ └────────┘ └───────────┘

┌─────────────┐
│ Order       │─────────┬─────────────┐
│ (order)     │    1:N  │             │
└─────────────┘         │             │
        │          ┌─────┴─────┐     │
        │ 1:N      │           │     │
    ┌───┴────────┬─┴─────┐ ┌──┴──────┴──────┐
    │            │       │ │                │
    ▼            ▼       ▼ ▼                ▼
┌─────────┐ ┌────────┐ ┌──────────┐ ┌──────────┐
│OrderItem│ │Payment │ │ Shipping │ │  Return  │
│(order item)│ │(payment)│ │ (shipping)│ │ (return) │
└─────────┘ └────────┘ └──────────┘ └──────────┘
```

---

## 2. Table Definitions

### 2.1 User Table
```sql
CREATE TABLE users (
    user_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    user_type ENUM('BUYER', 'SELLER', 'ADMIN') DEFAULT 'BUYER',
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    gender ENUM('M', 'F', 'OTHER'),
    birth_date DATE,
    profile_image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMP NULL,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    
    INDEX idx_email (email),
    INDEX idx_user_type (user_type),
    INDEX idx_created_at (created_at)
);
```

### 2.2 Product Table
```sql
CREATE TABLE products (
    product_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    seller_id BIGINT NOT NULL,
    category_id INT NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    description TEXT,
    detailed_description LONGTEXT,
    price DECIMAL(12, 2) NOT NULL,
    discount_price DECIMAL(12, 2),
    discount_rate DECIMAL(5, 2),
    stock_quantity INT NOT NULL DEFAULT 0,
    reserved_quantity INT DEFAULT 0,
    sku VARCHAR(100) UNIQUE,
    status ENUM('ACTIVE', 'OUT_OF_STOCK', 'DISCONTINUED', 'DELETED') DEFAULT 'ACTIVE',
    thumbnail_image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    view_count INT DEFAULT 0,
    average_rating DECIMAL(3, 2),
    review_count INT DEFAULT 0,
    sales_count INT DEFAULT 0,
    shipping_fee DECIMAL(8, 2),
    free_shipping_threshold DECIMAL(12, 2),
    delivery_days INT,
    
    FOREIGN KEY (seller_id) REFERENCES users(user_id),
    FOREIGN KEY (category_id) REFERENCES categories(category_id),
    INDEX idx_seller_id (seller_id),
    INDEX idx_category_id (category_id),
    INDEX idx_status (status),
    INDEX idx_product_name (product_name),
    INDEX idx_created_at (created_at),
    INDEX idx_price (price)
);
```

### 2.3 Category Table
```sql
CREATE TABLE categories (
    category_id INT PRIMARY KEY AUTO_INCREMENT,
    parent_category_id INT,
    category_name VARCHAR(100) NOT NULL UNIQUE,
    display_order INT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (parent_category_id) REFERENCES categories(category_id),
    INDEX idx_parent_id (parent_category_id),
    INDEX idx_display_order (display_order)
);
```

### 2.4 Cart Table
```sql
CREATE TABLE cart (
    cart_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    UNIQUE KEY uk_user_id (user_id),
    INDEX idx_user_id (user_id)
);
```

### 2.5 CartItem Table
```sql
CREATE TABLE cart_items (
    cart_item_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    cart_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(12, 2) NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (cart_id) REFERENCES cart(cart_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id),
    UNIQUE KEY uk_cart_product (cart_id, product_id),
    INDEX idx_product_id (product_id)
);
```

### 2.6 Wishlist Table
```sql
CREATE TABLE wishlist (
    wishlist_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (product_id) REFERENCES products(product_id),
    UNIQUE KEY uk_user_product (user_id, product_id),
    INDEX idx_user_id (user_id),
    INDEX idx_added_at (added_at)
);
```

### 2.7 Address Table
```sql
CREATE TABLE addresses (
    address_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    address_name VARCHAR(50),
    recipient_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    postal_code VARCHAR(10) NOT NULL,
    street_address VARCHAR(255) NOT NULL,
    detailed_address VARCHAR(255),
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_is_default (is_default)
);
```

### 2.8 Order Table
```sql
CREATE TABLE orders (
    order_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    buyer_id BIGINT NOT NULL,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM(
        'PAYMENT_PENDING',
        'PAYMENT_COMPLETED',
        'PREPARING_SHIPMENT',
        'SHIPPED',
        'DELIVERED',
        'CANCELLED',
        'REFUNDING',
        'REFUNDED'
    ) DEFAULT 'PAYMENT_PENDING',
    
    product_total DECIMAL(12, 2) NOT NULL,
    shipping_fee DECIMAL(8, 2) DEFAULT 0,
    discount_amount DECIMAL(12, 2) DEFAULT 0,
    points_used DECIMAL(12, 2) DEFAULT 0,
    final_amount DECIMAL(12, 2) NOT NULL,
    
    delivery_address_id BIGINT,
    delivery_postal_code VARCHAR(10),
    delivery_street_address VARCHAR(255),
    delivery_detailed_address VARCHAR(255),
    
    memo TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (buyer_id) REFERENCES users(user_id),
    FOREIGN KEY (delivery_address_id) REFERENCES addresses(address_id),
    UNIQUE KEY uk_order_number (order_number),
    INDEX idx_buyer_id (buyer_id),
    INDEX idx_order_date (order_date),
    INDEX idx_status (status),
    INDEX idx_order_number (order_number)
);
```

### 2.9 OrderItem Table
```sql
CREATE TABLE order_items (
    order_item_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    seller_id BIGINT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(12, 2) NOT NULL,
    subtotal DECIMAL(12, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id),
    FOREIGN KEY (seller_id) REFERENCES users(user_id),
    INDEX idx_order_id (order_id),
    INDEX idx_product_id (product_id),
    INDEX idx_seller_id (seller_id)
);
```

### 2.10 Payment Table
```sql
CREATE TABLE payments (
    payment_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_id BIGINT NOT NULL UNIQUE,
    payment_method ENUM('CREDIT_CARD', 'BANK_TRANSFER', 'E_WALLET', 'MOBILE_PAYMENT') NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    status ENUM('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED') DEFAULT 'PENDING',
    transaction_id VARCHAR(100),
    approval_number VARCHAR(100),
    pg_response LONGTEXT,
    paid_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    UNIQUE KEY uk_order_id (order_id),
    INDEX idx_status (status),
    INDEX idx_paid_at (paid_at),
    INDEX idx_transaction_id (transaction_id)
);
```

### 2.11 Shipping Table
```sql
CREATE TABLE shipping (
    shipping_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_id BIGINT NOT NULL UNIQUE,
    tracking_number VARCHAR(100),
    carrier ENUM('COURIER', 'POSTAL', 'DIRECT_DELIVERY') NOT NULL,
    status ENUM('PREPARING', 'IN_TRANSIT', 'DELIVERED', 'FAILED', 'RETURNED') DEFAULT 'PREPARING',
    estimated_delivery_date DATE,
    shipped_at TIMESTAMP NULL,
    delivered_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    UNIQUE KEY uk_order_id (order_id),
    INDEX idx_tracking_number (tracking_number),
    INDEX idx_status (status),
    INDEX idx_shipped_at (shipped_at)
);
```

### 2.12 Review Table
```sql
CREATE TABLE reviews (
    review_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    product_id BIGINT NOT NULL,
    buyer_id BIGINT NOT NULL,
    order_item_id BIGINT,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    is_verified_purchase BOOLEAN DEFAULT TRUE,
    helpful_count INT DEFAULT 0,
    unhelpful_count INT DEFAULT 0,
    moderation_status ENUM('PENDING', 'APPROVED', 'REJECTED', 'HIDDEN') DEFAULT 'APPROVED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
    FOREIGN KEY (buyer_id) REFERENCES users(user_id),
    FOREIGN KEY (order_item_id) REFERENCES order_items(order_item_id),
    INDEX idx_product_id (product_id),
    INDEX idx_buyer_id (buyer_id),
    INDEX idx_rating (rating),
    INDEX idx_created_at (created_at),
    INDEX idx_moderation_status (moderation_status)
);
```

### 2.13 ReviewImage Table
```sql
CREATE TABLE review_images (
    review_image_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    review_id BIGINT NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (review_id) REFERENCES reviews(review_id) ON DELETE CASCADE,
    INDEX idx_review_id (review_id)
);
```

### 2.14 Return Table
```sql
CREATE TABLE returns (
    return_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_id BIGINT NOT NULL,
    order_item_id BIGINT NOT NULL,
    buyer_id BIGINT NOT NULL,
    seller_id BIGINT NOT NULL,
    reason ENUM('DEFECTIVE', 'NOT_AS_DESCRIBED', 'WRONG_ITEM', 'CHANGED_MIND', 'OTHER') NOT NULL,
    reason_detail TEXT,
    status ENUM('REQUESTED', 'APPROVED', 'REJECTED', 'SHIPPED', 'RECEIVED', 'REFUNDED') DEFAULT 'REQUESTED',
    refund_amount DECIMAL(12, 2),
    seller_response TEXT,
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP NULL,
    shipped_at TIMESTAMP NULL,
    received_at TIMESTAMP NULL,
    refunded_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (order_id) REFERENCES orders(order_id),
    FOREIGN KEY (order_item_id) REFERENCES order_items(order_item_id),
    FOREIGN KEY (buyer_id) REFERENCES users(user_id),
    FOREIGN KEY (seller_id) REFERENCES users(user_id),
    INDEX idx_order_id (order_id),
    INDEX idx_status (status),
    INDEX idx_requested_at (requested_at)
);
```

### 2.15 Points Table
```sql
CREATE TABLE points (
    point_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    transaction_type ENUM('EARN', 'USE', 'REFUND', 'EXPIRE') NOT NULL,
    related_order_id BIGINT,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (related_order_id) REFERENCES orders(order_id),
    INDEX idx_user_id (user_id),
    INDEX idx_transaction_type (transaction_type),
    INDEX idx_created_at (created_at)
);
```

### 2.16 Settlement Table
```sql
CREATE TABLE settlements (
    settlement_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    seller_id BIGINT NOT NULL,
    settlement_period_start DATE NOT NULL,
    settlement_period_end DATE NOT NULL,
    total_sales DECIMAL(12, 2),
    commission_fee DECIMAL(12, 2),
    refund_amount DECIMAL(12, 2),
    settlement_amount DECIMAL(12, 2),
    status ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED') DEFAULT 'PENDING',
    settlement_account LONGTEXT,
    processed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (seller_id) REFERENCES users(user_id),
    INDEX idx_seller_id (seller_id),
    INDEX idx_status (status),
    INDEX idx_settlement_period (settlement_period_start, settlement_period_end)
);
```

---

## 3. Key Relationships

### 1:N Relationships
- User → Cart (1:1, a user has 1 cart)
- User → Order (1:N, a user has multiple orders)
- User → Address (1:N, a user has multiple delivery addresses)
- User → Wishlist (1:N, a user has multiple wishlist items)
- User → Review (1:N, a user has multiple reviews)
- Product → Review (1:N, a product has multiple reviews)
- Product → CartItem (1:N, a product appears in multiple cart items)
- Cart → CartItem (1:N, a cart has multiple items)
- Order → OrderItem (1:N, an order has multiple items)
- Order → Payment (1:1, an order has 1 payment)
- Order → Shipping (1:1, an order has 1 shipment)
- Order → Return (1:N, an order has multiple returns)

---

## 4. Indexing Strategy

### Performance Optimization Indexes
```
1. Frequently searched fields:
   - product: product_name, category_id, price, status, seller_id
   - order: buyer_id, status, order_date
   - user: email

2. Frequently sorted fields:
   - product: created_at, view_count, average_rating, sales_count
   - order: order_date, created_at
   - review: created_at, rating

3. Join fields:
   - Foreign keys such as user_id, product_id, order_id, cart_id

4. Range searches:
   - price: price range search
   - created_at: date range search
```

---

## 5. Data Normalization Rules

- **1NF:** All attributes are atomic values (indivisible values)
- **2NF:** Eliminate partial dependencies (every non-key attribute fully depends on the primary key)
- **3NF:** Eliminate transitive dependencies (remove dependencies between non-key attributes)

Examples:
- User info and Address are separate tables (one user has multiple addresses)
- Order and OrderItem are separate tables (different units of granularity)
- Payment and Order are separate tables (payment is an entity distinct from order)

---

## 6. Transaction Management

### ACID Principles
```
Atomicity:
- On order creation: order, order items, and stock updates all complete or all roll back

Consistency:
- Stock cannot be negative
- Order total = Σ(price per item)

Isolation:
- Prevent stock overrun during concurrent orders for the same product

Durability:
- After payment completion, data is safely retained
```

---

## 7. Backup and Recovery Strategy

- Daily automatic backup
- Maintain transaction logs
- Periodic full backups (weekly, monthly)
- Disaster recovery plan (RTO: 4 hours, RPO: 1 hour)

---

## What to Read Next

1. **05_api_standard.md** - REST API standard
2. **06_security_requirements.md** - Security requirements
3. **07_spec_template.md** - Specification template
