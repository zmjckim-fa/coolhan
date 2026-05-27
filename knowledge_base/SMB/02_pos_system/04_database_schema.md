# POS 시스템 - 데이터베이스 설계 (POS System - Database Schema)

## 개요

POS 시스템의 데이터베이스 스키마는 거래, 상품, 재고, 결제, 반품을 중심으로 설계됩니다.

---

## 1. ER 다이어그램 (Entity Relationship Diagram)

```
┌─────────────────────────────────────────────────────────────┐
│                         주요 엔티티                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────┐      ┌───────────┐       ┌────────────┐      │
│  │  USERS   │      │ TERMINALS │       │  STORES    │      │
│  └──────────┘      └───────────┘       └────────────┘      │
│       │1                 │1                    │1           │
│       │                  │                     │            │
│       │N                 │N                    │N           │
│  ┌─────────────────────────────────────────────────┐       │
│  │           TRANSACTIONS (거래)                   │       │
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

## 2. 테이블 정의

### 2.1 STORES (점포)

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

### 2.2 TERMINALS (계산대)

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

### 2.3 USERS (판매원/사용자)

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

### 2.4 CATEGORIES (상품 카테고리)

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

### 2.5 PRODUCTS (상품)

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

### 2.6 INVENTORY (재고)

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

### 2.7 INVENTORY_MOVEMENTS (재고 변동 로그)

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

### 2.8 TRANSACTIONS (거래)

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

### 2.9 TRANSACTION_ITEMS (거래 항목)

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

### 2.10 PAYMENTS (결제)

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

### 2.11 RETURNS (반품)

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

### 2.12 RETURN_ITEMS (반품 항목)

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

### 2.13 MEMBER_DISCOUNTS (회원 할인)

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

### 2.14 DAILY_SETTLEMENTS (일일 정산)

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

## 3. 인덱싱 전략

### 3.1 성능 최적화 인덱스

```
TRANSACTIONS 테이블:
- (store_id, transaction_date): 일일 정산 쿼리
- (terminal_id, transaction_date): 계산대별 정산
- (user_id, transaction_date): 판매원별 성과
- transaction_time: 시간대별 조회

TRANSACTION_ITEMS 테이블:
- (transaction_id): 거래 항목 조회 (PK와 동일)
- (product_id): 상품별 판매량 조회

INVENTORY 테이블:
- (store_id, product_id): 특정 점포의 상품 재고
- status: 부족 상품 조회

PRODUCTS 테이블:
- barcode: 바코드 스캔 검색
- sku: SKU 검색
- category_id: 카테고리별 조회
```

### 3.2 검색 인덱스

```
상품 검색:
- PRODUCTS(barcode): 바코드 스캔
- PRODUCTS(sku): 상품코드 검색
- PRODUCTS(product_name): 상품명 검색 (Full-text 인덱스 권장)

거래 검색:
- TRANSACTIONS(store_id, transaction_date): 일자별 거래
- TRANSACTIONS(terminal_id): 계산대별
- TRANSACTIONS(user_id): 판매원별

재고 검색:
- INVENTORY(store_id, status): 부족 상품
- INVENTORY_MOVEMENTS(created_at): 최근 변동
```

---

## 4. 정규화 (Normalization)

### 4.1 1NF (First Normal Form)
✓ 모든 속성이 원자 값으로 구성
✓ 반복되는 그룹 없음

### 4.2 2NF (Second Normal Form)
✓ 1NF 만족
✓ 모든 non-key 속성이 primary key에 완전히 함수 종속

### 4.3 3NF (Third Normal Form)
✓ 2NF 만족
✓ non-key 속성 간에 이행 함수 종속 없음

예:
```
- PRODUCTS 테이블: product_name, selling_price, cost_price만 저장
  (category_id는 FK만 포함, 카테고리 정보는 별도 테이블)
- TRANSACTION_ITEMS: 거래 항목 정보만 포함
  (상품 상세정보는 PRODUCTS 테이블 참조)
```

---

## 5. ACID 트랜잭션

### 5.1 거래 생성 트랜잭션

```sql
START TRANSACTION;

-- 1. 거래 생성
INSERT INTO TRANSACTIONS (...) 
VALUES (...)
SET @trans_id = LAST_INSERT_ID();

-- 2. 거래 항목 추가 (반복)
INSERT INTO TRANSACTION_ITEMS (...) 
VALUES (@trans_id, ...);

-- 3. 재고 감소
UPDATE INVENTORY SET quantity_on_hand = quantity_on_hand - @qty
WHERE product_id = @prod_id AND store_id = @store_id;

-- 4. 재고 로그 기록
INSERT INTO INVENTORY_MOVEMENTS (...)
VALUES (@store_id, @prod_id, 'SALE', -@qty, @trans_id, ...);

COMMIT;
```

### 5.2 환불 트랜잭션

```sql
START TRANSACTION;

-- 1. 반품 기록
INSERT INTO RETURNS (...) VALUES (...)
SET @return_id = LAST_INSERT_ID();

-- 2. 반품 항목 추가
INSERT INTO RETURN_ITEMS (...) VALUES (@return_id, ...);

-- 3. 재고 복구
UPDATE INVENTORY SET quantity_on_hand = quantity_on_hand + @qty
WHERE product_id = @prod_id;

-- 4. 재고 로그
INSERT INTO INVENTORY_MOVEMENTS (...)
VALUES (..., 'RETURN', @qty, ...);

-- 5. 원본 거래 상태 업데이트
UPDATE TRANSACTIONS SET status = 'PARTIALLY_RETURNED'
WHERE transaction_id = @orig_trans_id;

-- 6. 결제 환불 기록
INSERT INTO PAYMENTS (...) 
VALUES (@orig_trans_id, ..., 'REFUNDED');

COMMIT;
```

---

## 6. 데이터 보존 정책

### 6.1 보관 기간

```
- TRANSACTIONS: 영구 보관 (감사 추적)
- TRANSACTION_ITEMS: 영구 보관
- RETURNS: 영구 보관
- PAYMENTS: 영구 보관
- DAILY_SETTLEMENTS: 영구 보관
- INVENTORY_MOVEMENTS: 영구 보관
- 임시 로그: 90일 후 삭제
```

### 6.2 백업 전략

```
- 일일 증분 백업 (매일 자정)
- 주간 전체 백업 (매주 일요일)
- 월간 장기 보관 백업 (매월 첫 날)
- 재해 복구 백본 (별도 지역)
```

---

## 7. 확장성 고려사항

### 7.1 파티셔닝

대규모 시스템에서:
```
TRANSACTIONS: transaction_date 기준 월별 파티셔닝
TRANSACTION_ITEMS: 부모 테이블(TRANSACTIONS)과 동일
INVENTORY_MOVEMENTS: created_at 기준 월별 파티셔닝
DAILY_SETTLEMENTS: settlement_date 기준 월별 파티셔닝
```

### 7.2 캐싱

```
PRODUCTS: 제품 정보 캐시 (1시간)
INVENTORY: 재고 정보 캐시 (실시간 동기화)
CATEGORIES: 카테고리 캐시 (1일)
MEMBER_DISCOUNTS: 회원 할인 캐시 (1시간)
```

---

## 8. SQL 예시 쿼리

### 8.1 거래 조회

```sql
-- 일일 판매액
SELECT 
    SUM(total_amount) as daily_sales,
    COUNT(*) as transaction_count,
    AVG(total_amount) as avg_transaction
FROM TRANSACTIONS
WHERE store_id = 1 AND transaction_date = '2026-05-27';

-- 상품별 판매량
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

### 8.2 재고 조회

```sql
-- 부족한 상품
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

### 8.3 정산 조회

```sql
-- 일일 정산
SELECT * FROM DAILY_SETTLEMENTS
WHERE store_id = 1 AND settlement_date = '2026-05-27';

-- 결제 수단별 합계
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

이 데이터베이스 설계는 POS 시스템의 모든 핵심 기능을 지원하며, 확장 가능하고 감시 추적이 가능한 구조입니다.
