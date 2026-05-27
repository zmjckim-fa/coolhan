# POS 시스템 - API 표준 (POS System - API Standard)

## 개요 (Overview)

이 문서는 POS 시스템의 모든 API 엔드포인트, 요청/응답 형식, 상태 코드, 인증 방식을 정의한다.

---

## 1. 기본 설정 (Base Configuration)

### 1.1 API 기본 정보 (Base Information)

```
API 버전: v1
Base URL: https://api.pos-system.com/api/v1

인증 방식: JWT Bearer Token
  - 토큰 유효기간: 1시간
  - 리프레시 토큰: 30일
  - 헤더: Authorization: Bearer <token>

요청 형식: JSON
응답 형식: 
  {
    "success": true/false,
    "code": "SUCCESS" | "[ERROR_CODE]",
    "message": "[설명]",
    "data": {...},
    "timestamp": "2026-05-27T10:30:00Z"
  }

속도 제한:
  - 일반 사용자: 100 요청/분
  - 판매원: 500 요청/분
  - 관리자: 제한 없음

응답 시간 목표:
  - 평균: 200ms 이하
  - 최대: 1000ms 이하
```

### 1.2 상태 코드 정의 (Status Codes)

```
2xx (성공)
  200 OK: 요청 성공
  201 Created: 리소스 생성 성공

4xx (클라이언트 오류)
  400 Bad Request: 요청 형식 오류
  401 Unauthorized: 인증 필요
  403 Forbidden: 권한 부족
  404 Not Found: 리소스 없음
  409 Conflict: 거래 상태 충돌 (예: 이미 완료된 거래)

5xx (서버 오류)
  500 Internal Server Error: 서버 오류
  503 Service Unavailable: 일시적 장애
```

---

## 2. 인증 및 권한 (Authentication & Authorization)

### 2.1 로그인 (Login)

```
POST /auth/login

요청:
{
  "user_id": "cashier_001",
  "password": "encrypted_password",
  "terminal_id": "POS-001"
}

응답 (200 OK):
{
  "success": true,
  "data": {
    "access_token": "eyJhbGc...",
    "refresh_token": "eyJhbGc...",
    "user": {
      "id": "USR-001",
      "name": "김철수",
      "role": "CASHIER",
      "permissions": ["transaction_create", "transaction_cancel"]
    },
    "terminal_info": {
      "id": "POS-001",
      "store": "store-001",
      "name": "1번 계산대"
    }
  }
}

에러 (401 Unauthorized):
{
  "success": false,
  "code": "INVALID_CREDENTIALS",
  "message": "사용자ID 또는 비밀번호가 잘못되었습니다"
}
```

### 2.2 로그아웃 (Logout)

```
POST /auth/logout
Authorization: Bearer <token>

요청:
{}

응답 (200 OK):
{
  "success": true,
  "message": "로그아웃되었습니다"
}
```

### 2.3 토큰 갱신 (Refresh Token)

```
POST /auth/refresh
Authorization: Bearer <refresh_token>

요청:
{}

응답 (200 OK):
{
  "success": true,
  "data": {
    "access_token": "eyJhbGc...",
    "refresh_token": "eyJhbGc..."
  }
}
```

---

## 3. 거래 API (Transaction API)

### 3.1 거래 시작 (Start Transaction)

```
POST /transactions

요청:
{
  "terminal_id": "POS-001",
  "cashier_id": "USR-001"
}

응답 (201 Created):
{
  "success": true,
  "data": {
    "transaction_id": "TXN-20260527-00001",
    "status": "ACTIVE",
    "items": [],
    "subtotal": 0,
    "tax": 0,
    "total": 0,
    "created_at": "2026-05-27T10:30:00Z"
  }
}
```

### 3.2 거래에 항목 추가 (Add Item to Transaction)

```
POST /transactions/{transaction_id}/items

요청:
{
  "product_code": "PROD-001",
  "quantity": 2,
  "unit_price": 10000
}

응답 (200 OK):
{
  "success": true,
  "data": {
    "item_id": "ITEM-001",
    "product_code": "PROD-001",
    "product_name": "라면",
    "quantity": 2,
    "unit_price": 10000,
    "subtotal": 20000,
    "tax": 2000,
    "line_total": 22000,
    "transaction": {
      "subtotal": 20000,
      "tax": 2000,
      "total": 22000
    }
  }
}

에러 (409 Conflict):
{
  "success": false,
  "code": "OUT_OF_STOCK",
  "message": "재고 부족 (현재 재고: 1)"
}
```

### 3.3 거래 항목 삭제 (Remove Item from Transaction)

```
DELETE /transactions/{transaction_id}/items/{item_id}

응답 (200 OK):
{
  "success": true,
  "data": {
    "transaction": {
      "subtotal": 10000,
      "tax": 1000,
      "total": 11000,
      "items_count": 1
    }
  }
}
```

### 3.4 거래 항목 수량 변경 (Update Item Quantity)

```
PUT /transactions/{transaction_id}/items/{item_id}

요청:
{
  "quantity": 3
}

응답 (200 OK):
{
  "success": true,
  "data": {
    "item_id": "ITEM-001",
    "quantity": 3,
    "line_total": 33000,
    "transaction": {
      "subtotal": 30000,
      "tax": 3000,
      "total": 33000
    }
  }
}
```

### 3.5 거래 취소 (Cancel Transaction)

```
POST /transactions/{transaction_id}/cancel

요청:
{
  "reason": "고객 요청"
}

응답 (200 OK):
{
  "success": true,
  "data": {
    "transaction_id": "TXN-20260527-00001",
    "status": "CANCELLED",
    "cancelled_at": "2026-05-27T10:35:00Z"
  }
}

에러 (409 Conflict):
{
  "success": false,
  "code": "TRANSACTION_ALREADY_COMPLETED",
  "message": "이미 완료된 거래는 취소할 수 없습니다"
}
```

---

## 4. 결제 API (Payment API)

### 4.1 현금 결제 (Cash Payment)

```
POST /transactions/{transaction_id}/payment/cash

요청:
{
  "received_amount": 50000,
  "transaction_total": 22000
}

응답 (200 OK):
{
  "success": true,
  "data": {
    "payment_id": "PAY-001",
    "method": "CASH",
    "amount": 22000,
    "received_amount": 50000,
    "change": 28000,
    "transaction_status": "COMPLETED",
    "completed_at": "2026-05-27T10:35:30Z"
  }
}

에러 (400 Bad Request):
{
  "success": false,
  "code": "INSUFFICIENT_PAYMENT",
  "message": "지불액이 결제액보다 적습니다"
}
```

### 4.2 카드 결제 (Card Payment)

```
POST /transactions/{transaction_id}/payment/card

요청:
{
  "card_token": "tok_visa_4242",
  "card_last4": "4242",
  "amount": 22000
}

응답 (200 OK):
{
  "success": true,
  "data": {
    "payment_id": "PAY-002",
    "method": "CARD",
    "amount": 22000,
    "card_last4": "4242",
    "approval_code": "123456",
    "transaction_status": "COMPLETED",
    "completed_at": "2026-05-27T10:35:45Z"
  }
}

에러 (400 Bad Request):
{
  "success": false,
  "code": "CARD_DECLINED",
  "message": "카드 결제가 거절되었습니다",
  "pg_error_code": "CARD_DECLINED"
}
```

---

## 5. 반품/환불 API (Return & Refund API)

### 5.1 반품 거래 조회 (Search Original Transaction)

```
GET /returns/search?receipt_number=RCP-20260527-001

응답 (200 OK):
{
  "success": true,
  "data": {
    "transaction_id": "TXN-20260527-00001",
    "receipt_number": "RCP-20260527-001",
    "transaction_date": "2026-05-27T09:30:00Z",
    "items": [
      {
        "item_id": "ITEM-001",
        "product_code": "PROD-001",
        "product_name": "라면",
        "quantity": 2,
        "unit_price": 10000,
        "line_total": 22000
      }
    ],
    "total": 22000
  }
}
```

### 5.2 부분 반품 (Partial Return)

```
POST /returns

요청:
{
  "original_transaction_id": "TXN-20260527-00001",
  "items": [
    {
      "item_id": "ITEM-001",
      "return_quantity": 1
    }
  ],
  "reason": "품질 불량"
}

응답 (201 Created):
{
  "success": true,
  "data": {
    "return_id": "RET-001",
    "original_transaction_id": "TXN-20260527-00001",
    "refund_amount": 11000,
    "status": "PENDING_APPROVAL",
    "items": [
      {
        "item_id": "ITEM-001",
        "return_quantity": 1,
        "refund": 11000
      }
    ]
  }
}
```

### 5.3 환불 처리 (Process Refund)

```
POST /returns/{return_id}/approve

요청:
{
  "refund_method": "CASH"
}

응답 (200 OK):
{
  "success": true,
  "data": {
    "return_id": "RET-001",
    "status": "APPROVED",
    "refund_amount": 11000,
    "refund_method": "CASH",
    "approved_by": "MGR-001",
    "approved_at": "2026-05-27T10:40:00Z"
  }
}
```

---

## 6. 재고 API (Inventory API)

### 6.1 상품 재고 조회 (Get Product Stock)

```
GET /inventory/{product_code}

응답 (200 OK):
{
  "success": true,
  "data": {
    "product_code": "PROD-001",
    "product_name": "라면",
    "current_stock": 150,
    "minimum_stock": 50,
    "maximum_stock": 500,
    "last_updated": "2026-05-27T10:45:00Z",
    "status": "OK"
  }
}
```

### 6.2 재고 검색 (Search Low Stock Items)

```
GET /inventory/low-stock?store_id=store-001

응답 (200 OK):
{
  "success": true,
  "data": {
    "items": [
      {
        "product_code": "PROD-002",
        "product_name": "음료수",
        "current_stock": 30,
        "minimum_stock": 50,
        "status": "LOW"
      }
    ],
    "count": 1
  }
}
```

---

## 7. 일일 마감 API (End of Day API)

### 7.1 마감 데이터 조회 (Get Daily Summary)

```
GET /daily-close?date=2026-05-27

응답 (200 OK):
{
  "success": true,
  "data": {
    "date": "2026-05-27",
    "terminal_id": "POS-001",
    "summary": {
      "transaction_count": 150,
      "total_sales": 1500000,
      "total_refunds": 50000,
      "net_sales": 1450000,
      "cash_sales": 500000,
      "card_sales": 950000,
      "total_tax": 145000
    },
    "payment_breakdown": {
      "cash": 500000,
      "card": 950000
    }
  }
}
```

### 7.2 마감 완료 (Complete Daily Close)

```
POST /daily-close/{date}/complete

요청:
{
  "terminal_id": "POS-001",
  "actual_cash_amount": 500000,
  "discrepancy_notes": ""
}

응답 (200 OK):
{
  "success": true,
  "data": {
    "daily_close_id": "CLOSE-20260527-001",
    "date": "2026-05-27",
    "status": "COMPLETED",
    "cash_discrepancy": 0,
    "completed_at": "2026-05-27T22:00:00Z"
  }
}
```

---

## 8. 상품 및 카테고리 API (Product & Category API)

### 8.1 상품 목록 (Get Products)

```
GET /products?category=beverages&limit=20

응답 (200 OK):
{
  "success": true,
  "data": {
    "products": [
      {
        "code": "PROD-001",
        "name": "라면",
        "category": "food",
        "price": 10000,
        "tax_rate": 0.1,
        "stock": 150
      }
    ],
    "pagination": {
      "total": 345,
      "limit": 20,
      "offset": 0
    }
  }
}
```

### 8.2 카테고리 목록 (Get Categories)

```
GET /categories

응답 (200 OK):
{
  "success": true,
  "data": {
    "categories": [
      {
        "id": "cat-001",
        "name": "음식",
        "count": 150
      },
      {
        "id": "cat-002",
        "name": "음료",
        "count": 195
      }
    ]
  }
}
```

---

## 9. 할인 API (Discount API)

### 9.1 회원 할인 조회 (Get Member Discount)

```
GET /discounts/member/{member_id}

응답 (200 OK):
{
  "success": true,
  "data": {
    "member_id": "MEM-001",
    "name": "김철수",
    "grade": "VIP",
    "discount_rate": 0.15,
    "points_balance": 50000,
    "discount_amount_calculation": {
      "subtotal": 50000,
      "discount_amount": 7500,
      "final_amount": 42500
    }
  }
}
```

---

## 10. 에러 처리 (Error Handling)

### 10.1 일반적인 에러 응답 형식

```
400 Bad Request:
{
  "success": false,
  "code": "INVALID_REQUEST",
  "message": "요청 형식이 올바르지 않습니다",
  "errors": [
    {
      "field": "quantity",
      "message": "수량은 0보다 커야 합니다"
    }
  ]
}

401 Unauthorized:
{
  "success": false,
  "code": "INVALID_TOKEN",
  "message": "인증 토큰이 유효하지 않습니다"
}

403 Forbidden:
{
  "success": false,
  "code": "INSUFFICIENT_PERMISSION",
  "message": "이 작업을 수행할 권한이 없습니다"
}

500 Internal Server Error:
{
  "success": false,
  "code": "SERVER_ERROR",
  "message": "서버 오류가 발생했습니다",
  "request_id": "req-12345"
}
```

---

## 11. API 사용 예시 (API Usage Examples)

### 11.1 JavaScript Fetch 예시

```javascript
// 로그인
const loginResponse = await fetch('https://api.pos-system.com/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    user_id: 'cashier_001',
    password: 'encrypted_pwd',
    terminal_id: 'POS-001'
  })
});
const { data } = await loginResponse.json();
const token = data.access_token;

// 거래 시작
const txnResponse = await fetch(
  'https://api.pos-system.com/api/v1/transactions',
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      terminal_id: 'POS-001',
      cashier_id: 'USR-001'
    })
  }
);
const { data: txnData } = await txnResponse.json();
const transactionId = txnData.transaction_id;

// 거래에 항목 추가
const itemResponse = await fetch(
  `https://api.pos-system.com/api/v1/transactions/${transactionId}/items`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      product_code: 'PROD-001',
      quantity: 2,
      unit_price: 10000
    })
  }
);
```

---

## 요약 (Summary)

이 API는 다음을 지원한다:
- ✅ 인증 및 세션 관리
- ✅ 거래 생성 및 관리
- ✅ 결제 처리 (현금, 카드)
- ✅ 반품/환불 처리
- ✅ 재고 조회
- ✅ 일일 마감 및 정산
- ✅ 상품 및 할인 관리

모든 API는 JWT 토큰 기반 인증이 필요하며, 표준화된 응답 형식을 사용한다.

---

**버전**: 1.0
**작성일**: 2026-05-27
**상태**: 완료
