# 쇼핑몰 - 데이터베이스 스키마 (E-Commerce Mall Database Schema)

## 1. 엔티티 관계도 (ER Diagram)

```
┌─────────────┐
│   User      │─────────┐
│ (사용자)     │         │
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
    │ (장바구니)│  │ (찜)          │  │ (주소)     │
    └───────────┘  └──────────────┘  └────────────┘

┌─────────────┐
│ Product     │─────────┬────────────┐
│ (상품)       │         │            │
└─────────────┘    1:N   │ 1:N        │
        │                │            │
    ┌───┴───────┬────────┴─┐    ┌────┴─────────┐
    │           │          │    │               │
    ▼           ▼          ▼    ▼               ▼
┌─────────┐ ┌────────┐ ┌────────┐ ┌───────────┐
│ Category│ │  Review│ │ CartItem│ │ WishItem  │
│ (카테고리) │ │ (리뷰) │ │(장바구니상품)│ │(찜상품)  │
└─────────┘ └────────┘ └────────┘ └───────────┘

┌─────────────┐
│ Order       │─────────┬─────────────┐
│ (주문)       │    1:N  │             │
└─────────────┘         │             │
        │          ┌─────┴─────┐     │
        │ 1:N      │           │     │
    ┌───┴────────┬─┴─────┐ ┌──┴──────┴──────┐
    │            │       │ │                │
    ▼            ▼       ▼ ▼                ▼
┌─────────┐ ┌────────┐ ┌──────────┐ ┌──────────┐
│OrderItem│ │Payment │ │ Shipping │ │  Return  │
│(주문항목)│ │(결제)  │ │ (배송)   │ │ (반품)   │
└─────────┘ └────────┘ └──────────┘ └──────────┘
```

---

## 2. 테이블 정의

### 2.1 User 테이블
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

### 2.2 Product 테이블
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

### 2.3 Category 테이블
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

### 2.4 Cart 테이블
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

### 2.5 CartItem 테이블
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

### 2.6 Wishlist 테이블
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

### 2.7 Address 테이블
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

### 2.8 Order 테이블
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

### 2.9 OrderItem 테이블
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

### 2.10 Payment 테이블
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

### 2.11 Shipping 테이블
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

### 2.12 Review 테이블
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

### 2.13 ReviewImage 테이블
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

### 2.14 Return 테이블
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

### 2.15 Points 테이블
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

### 2.16 Settlement 테이블
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

## 3. 중요 관계 (Key Relationships)

### 1:N 관계
- User → Cart (1:1, 사용자는 1개의 장바구니)
- User → Order (1:N, 사용자는 여러 주문)
- User → Address (1:N, 사용자는 여러 배송지)
- User → Wishlist (1:N, 사용자는 여러 찜)
- User → Review (1:N, 사용자는 여러 리뷰)
- Product → Review (1:N, 상품은 여러 리뷰)
- Product → CartItem (1:N, 상품은 여러 장바구니 항목)
- Cart → CartItem (1:N, 장바구니는 여러 항목)
- Order → OrderItem (1:N, 주문은 여러 항목)
- Order → Payment (1:1, 주문은 1개의 결제)
- Order → Shipping (1:1, 주문은 1개의 배송)
- Order → Return (1:N, 주문은 여러 반품)

---

## 4. 인덱싱 전략

### 성능 최적화 인덱스
```
1. 자주 검색되는 필드:
   - product: product_name, category_id, price, status, seller_id
   - order: buyer_id, status, order_date
   - user: email

2. 자주 정렬되는 필드:
   - product: created_at, view_count, average_rating, sales_count
   - order: order_date, created_at
   - review: created_at, rating

3. 조인 필드:
   - user_id, product_id, order_id, cart_id 등의 외래키

4. 범위 검색:
   - price: 가격 범위 검색
   - created_at: 날짜 범위 검색
```

---

## 5. 데이터 정규화 규칙

- **1NF:** 모든 속성은 원자값 (분해 불가능한 값)
- **2NF:** 부분 종속성 제거 (모든 비키 속성이 기본키에 완전 종속)
- **3NF:** 이행 종속성 제거 (비키 속성 간 종속성 제거)

예시:
- User 정보와 Address는 별도 테이블 (한 사용자는 여러 주소)
- Order와 OrderItem은 별도 테이블 (주문 단위가 다름)
- Payment와 Order는 별도 테이블 (결제는 주문과 별개 엔티티)

---

## 6. 트랜잭션 관리

### ACID 원칙
```
Atomicity (원자성):
- 주문 생성 시: 주문, 주문항목, 재고 업데이트가 모두 완료되거나 모두 롤백

Consistency (일관성):
- 재고는 음수가 될 수 없음
- 주문 총액 = Σ(항목별 가격)

Isolation (격리성):
- 동일 상품에 대한 동시 주문 시 재고 초과 방지

Durability (지속성):
- 결제 완료 후 데이터는 안전하게 보관
```

---

## 7. 백업 및 복구 전략

- 일일 자동 백업
- 트랜잭션 로그 유지
- 주기적 전체 백업 (주 1회, 월 1회)
- 재해 복구 계획 (RTO: 4시간, RPO: 1시간)

---

## 다음 문서로 읽어야 할 것

1. **05_api_standard.md** - REST API 표준
2. **06_security_requirements.md** - 보안 요구사항
3. **07_spec_template.md** - 기획서 템플릿
