# 쇼핑몰 - API 표준 (E-Commerce Mall API Standard)

## 1. API 설계 원칙

### REST API 기본
```
HTTP Method     동작         예시
─────────────────────────────────────────
GET            조회 (Read)    GET /api/products
POST           생성 (Create)  POST /api/orders
PUT            전체 수정      PUT /api/products/1
PATCH          부분 수정      PATCH /api/orders/1/status
DELETE         삭제 (Delete)  DELETE /api/cart/1
```

### 엔드포인트 네이밍 규칙
```
- 명사 사용 (동사 X): /api/products (O), /api/getProducts (X)
- 리소스 ID는 경로 파라미터: /api/products/{productId}
- 필터/검색은 쿼리 파라미터: /api/products?category=electronics&minPrice=100
- 하위 리소스: /api/orders/{orderId}/items
- 버전 관리: /api/v1/products (장기 지원), /api/v2/products (신규)
```

---

## 2. 상품 관련 API

### 2.1 상품 목록 조회
```
GET /api/v1/products

쿼리 파라미터:
- page: 페이지 번호 (기본값: 1)
- limit: 페이지당 항목 수 (기본값: 20, 최대: 100)
- category: 카테고리 ID
- search: 검색어 (상품명, 설명)
- minPrice: 최저 가격
- maxPrice: 최고 가격
- sortBy: 정렬 기준 (popularity, price, newest, rating)
- sortOrder: 정렬 순서 (asc, desc)
- inStock: 재고 있음만 (true/false)

응답 200:
{
  "success": true,
  "data": {
    "items": [
      {
        "productId": 1,
        "productName": "상품명",
        "thumbnailImage": "url",
        "price": 10000,
        "discountPrice": 8000,
        "discountRate": 20,
        "averageRating": 4.5,
        "reviewCount": 120,
        "stockStatus": "IN_STOCK",
        "shippingFee": 3000,
        "isFreeShipping": false
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 10,
      "totalItems": 200,
      "pageSize": 20
    }
  },
  "timestamp": "2026-05-27T10:30:00Z"
}

응답 400:
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "잘못된 요청 파라미터"
  }
}
```

### 2.2 상품 상세 조회
```
GET /api/v1/products/{productId}

응답 200:
{
  "success": true,
  "data": {
    "productId": 1,
    "productName": "상품명",
    "description": "짧은 설명",
    "detailedDescription": "상세 설명",
    "seller": {
      "sellerId": 100,
      "sellerName": "판매자명",
      "rating": 4.7,
      "productCount": 150
    },
    "price": 10000,
    "discountPrice": 8000,
    "discountRate": 20,
    "stockQuantity": 50,
    "sku": "SKU12345",
    "category": {
      "categoryId": 5,
      "categoryName": "전자제품"
    },
    "images": [
      { "imageUrl": "url1", "isMain": true },
      { "imageUrl": "url2", "isMain": false }
    ],
    "averageRating": 4.5,
    "reviewCount": 120,
    "reviews": [
      {
        "reviewId": 1,
        "rating": 5,
        "title": "리뷰 제목",
        "content": "리뷰 내용",
        "buyerName": "구매자명",
        "createdAt": "2026-05-20T10:00:00Z"
      }
    ],
    "shippingInfo": {
      "shippingFee": 3000,
      "freeShippingThreshold": 30000,
      "estimatedDeliveryDays": 2
    },
    "relatedProducts": [...]
  }
}

응답 404:
{
  "success": false,
  "error": {
    "code": "PRODUCT_NOT_FOUND",
    "message": "상품을 찾을 수 없습니다"
  }
}
```

---

## 3. 사용자 관련 API

### 3.1 회원가입
```
POST /api/v1/auth/register

요청:
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "name": "사용자명",
  "phone": "010-1234-5678",
  "agreeToTerms": true,
  "agreeToPrivacy": true
}

응답 201:
{
  "success": true,
  "data": {
    "userId": 1000,
    "email": "user@example.com",
    "name": "사용자명",
    "token": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "expiresIn": 3600
  }
}

응답 400:
{
  "success": false,
  "error": {
    "code": "EMAIL_ALREADY_EXISTS",
    "message": "이미 등록된 이메일입니다"
  }
}
```

### 3.2 로그인
```
POST /api/v1/auth/login

요청:
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}

응답 200:
{
  "success": true,
  "data": {
    "userId": 1000,
    "email": "user@example.com",
    "name": "사용자명",
    "userType": "BUYER",
    "token": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "expiresIn": 3600
  }
}

응답 401:
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "이메일 또는 비밀번호가 일치하지 않습니다"
  }
}
```

### 3.3 프로필 조회
```
GET /api/v1/users/me

요청 헤더:
Authorization: Bearer {token}

응답 200:
{
  "success": true,
  "data": {
    "userId": 1000,
    "email": "user@example.com",
    "name": "사용자명",
    "phone": "010-1234-5678",
    "gender": "M",
    "birthDate": "1990-01-15",
    "profileImage": "url",
    "createdAt": "2024-01-01T10:00:00Z"
  }
}
```

### 3.4 프로필 수정
```
PUT /api/v1/users/me

요청:
{
  "name": "변경된 이름",
  "phone": "010-9876-5432",
  "gender": "M"
}

응답 200:
{
  "success": true,
  "message": "프로필이 수정되었습니다"
}
```

---

## 4. 장바구니 API

### 4.1 장바구니 조회
```
GET /api/v1/cart

요청 헤더:
Authorization: Bearer {token}

응답 200:
{
  "success": true,
  "data": {
    "cartId": 1,
    "items": [
      {
        "cartItemId": 1,
        "productId": 10,
        "productName": "상품명",
        "quantity": 2,
        "price": 10000,
        "discountPrice": 8000,
        "subtotal": 16000,
        "thumbnailImage": "url"
      }
    ],
    "summary": {
      "itemCount": 2,
      "productTotal": 16000,
      "shippingFee": 3000,
      "discountAmount": 0,
      "totalAmount": 19000
    }
  }
}
```

### 4.2 장바구니에 상품 추가
```
POST /api/v1/cart/items

요청:
{
  "productId": 10,
  "quantity": 2
}

응답 201:
{
  "success": true,
  "data": {
    "cartItemId": 1,
    "productId": 10,
    "quantity": 2,
    "cartTotal": 19000
  }
}

응답 400:
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_STOCK",
    "message": "재고가 부족합니다"
  }
}
```

### 4.3 장바구니 항목 수량 변경
```
PATCH /api/v1/cart/items/{cartItemId}

요청:
{
  "quantity": 3
}

응답 200:
{
  "success": true,
  "data": {
    "cartItemId": 1,
    "quantity": 3,
    "subtotal": 24000,
    "cartTotal": 27000
  }
}
```

### 4.4 장바구니 항목 삭제
```
DELETE /api/v1/cart/items/{cartItemId}

응답 200:
{
  "success": true,
  "message": "장바구니 항목이 삭제되었습니다"
}
```

---

## 5. 주문 API

### 5.1 주문 생성
```
POST /api/v1/orders

요청:
{
  "items": [
    {
      "productId": 10,
      "quantity": 2
    },
    {
      "productId": 20,
      "quantity": 1
    }
  ],
  "deliveryAddressId": 5,
  "shippingMethod": "STANDARD",
  "memo": "배송시 조심해주세요",
  "paymentMethod": "CREDIT_CARD"
}

응답 201:
{
  "success": true,
  "data": {
    "orderId": 1000,
    "orderNumber": "ORD20260527001",
    "orderDate": "2026-05-27T10:30:00Z",
    "status": "PAYMENT_PENDING",
    "items": [
      {
        "orderItemId": 1,
        "productId": 10,
        "productName": "상품명",
        "quantity": 2,
        "unitPrice": 8000,
        "subtotal": 16000
      }
    ],
    "summary": {
      "productTotal": 17000,
      "shippingFee": 3000,
      "discountAmount": 0,
      "finalAmount": 20000
    },
    "paymentUrl": "https://pg.example.com/pay?orderId=1000"
  }
}
```

### 5.2 주문 조회
```
GET /api/v1/orders

쿼리 파라미터:
- status: 주문 상태 필터
- page: 페이지 번호
- limit: 페이지당 항목 수

응답 200:
{
  "success": true,
  "data": {
    "orders": [
      {
        "orderId": 1000,
        "orderNumber": "ORD20260527001",
        "orderDate": "2026-05-27T10:30:00Z",
        "status": "DELIVERED",
        "finalAmount": 20000,
        "itemCount": 2,
        "mainProduct": "상품명"
      }
    ],
    "pagination": {...}
  }
}
```

### 5.3 주문 상세 조회
```
GET /api/v1/orders/{orderId}

응답 200:
{
  "success": true,
  "data": {
    "orderId": 1000,
    "orderNumber": "ORD20260527001",
    "buyer": {
      "name": "구매자명",
      "phone": "010-1234-5678",
      "email": "user@example.com"
    },
    "items": [
      {
        "orderItemId": 1,
        "productId": 10,
        "productName": "상품명",
        "quantity": 2,
        "unitPrice": 8000,
        "subtotal": 16000
      }
    ],
    "deliveryAddress": {
      "recipientName": "배송받을사람",
      "phone": "010-9876-5432",
      "streetAddress": "서울시 강남구",
      "detailedAddress": "123번지"
    },
    "payment": {
      "method": "CREDIT_CARD",
      "status": "COMPLETED",
      "amount": 20000,
      "paidAt": "2026-05-27T10:35:00Z"
    },
    "shipping": {
      "carrier": "COURIER",
      "trackingNumber": "123456789",
      "status": "DELIVERED",
      "deliveredAt": "2026-05-29T14:00:00Z"
    },
    "summary": {
      "productTotal": 17000,
      "shippingFee": 3000,
      "discountAmount": 0,
      "finalAmount": 20000
    }
  }
}
```

### 5.4 주문 취소
```
POST /api/v1/orders/{orderId}/cancel

요청:
{
  "reason": "변심",
  "comment": "상세 이유"
}

응답 200:
{
  "success": true,
  "data": {
    "orderId": 1000,
    "status": "CANCELLED",
    "refundAmount": 20000
  }
}

응답 400:
{
  "success": false,
  "error": {
    "code": "CANNOT_CANCEL_ORDER",
    "message": "배송이 시작되어 주문을 취소할 수 없습니다"
  }
}
```

---

## 6. 배송 API

### 6.1 배송 조회
```
GET /api/v1/orders/{orderId}/shipping

응답 200:
{
  "success": true,
  "data": {
    "shippingId": 500,
    "trackingNumber": "123456789",
    "carrier": "COURIER",
    "status": "IN_TRANSIT",
    "estimatedDeliveryDate": "2026-05-30",
    "shippedAt": "2026-05-27T18:00:00Z",
    "events": [
      {
        "status": "PREPARING",
        "timestamp": "2026-05-27T10:30:00Z",
        "description": "배송준비 중"
      },
      {
        "status": "IN_TRANSIT",
        "timestamp": "2026-05-27T18:00:00Z",
        "description": "배송 중"
      }
    ]
  }
}
```

---

## 7. 결제 API

### 7.1 결제 콜백 (Payment Webhook)
```
POST /api/v1/webhooks/payment

요청 (PG에서 발송):
{
  "transactionId": "123456",
  "orderId": 1000,
  "status": "SUCCESS",
  "amount": 20000,
  "paymentMethod": "CREDIT_CARD",
  "approvalNumber": "ABC123",
  "timestamp": "2026-05-27T10:35:00Z"
}

응답 200:
{
  "success": true,
  "message": "결제 정보가 처리되었습니다"
}
```

---

## 8. 리뷰 API

### 8.1 리뷰 작성
```
POST /api/v1/reviews

요청:
{
  "productId": 10,
  "orderItemId": 1,
  "rating": 5,
  "title": "좋은 상품입니다",
  "content": "상세한 리뷰 내용",
  "images": ["image_url_1", "image_url_2"]
}

응답 201:
{
  "success": true,
  "data": {
    "reviewId": 1000,
    "productId": 10,
    "rating": 5,
    "status": "APPROVED"
  }
}
```

### 8.2 리뷰 조회
```
GET /api/v1/products/{productId}/reviews

쿼리 파라미터:
- page: 페이지 번호
- sortBy: rating, helpful, newest
- filterRating: 특정 평점만 조회 (1~5)

응답 200:
{
  "success": true,
  "data": {
    "reviews": [
      {
        "reviewId": 1000,
        "rating": 5,
        "title": "좋은 상품입니다",
        "content": "상세한 리뷰 내용",
        "buyerName": "구매자",
        "createdAt": "2026-05-25T10:00:00Z",
        "helpfulCount": 15,
        "unhelpfulCount": 2,
        "images": ["url"]
      }
    ],
    "summary": {
      "averageRating": 4.5,
      "totalCount": 120,
      "ratingDistribution": {
        "5": 60,
        "4": 40,
        "3": 15,
        "2": 4,
        "1": 1
      }
    }
  }
}
```

---

## 9. 반품 API

### 9.1 반품 신청
```
POST /api/v1/returns

요청:
{
  "orderId": 1000,
  "orderItemId": 1,
  "reason": "DEFECTIVE",
  "reasonDetail": "상품에 흠집이 있습니다",
  "images": ["evidence_image_url"]
}

응답 201:
{
  "success": true,
  "data": {
    "returnId": 100,
    "status": "REQUESTED",
    "createdAt": "2026-05-27T10:30:00Z"
  }
}
```

### 9.2 반품 조회
```
GET /api/v1/returns/{returnId}

응답 200:
{
  "success": true,
  "data": {
    "returnId": 100,
    "orderId": 1000,
    "reason": "DEFECTIVE",
    "status": "APPROVED",
    "refundAmount": 8000,
    "requestedAt": "2026-05-27T10:30:00Z",
    "approvedAt": "2026-05-27T12:00:00Z",
    "sellerResponse": "반품을 승인하였습니다"
  }
}
```

---

## 10. 오류 응답 표준

### 에러 코드 및 HTTP 상태
```
HTTP 400 Bad Request (클라이언트 오류)
- INVALID_REQUEST: 잘못된 요청 형식
- INVALID_PARAMETER: 잘못된 파라미터 값
- MISSING_PARAMETER: 필수 파라미터 누락

HTTP 401 Unauthorized (인증 오류)
- INVALID_TOKEN: 토큰이 유효하지 않음
- TOKEN_EXPIRED: 토큰이 만료됨
- NOT_AUTHENTICATED: 인증이 필요함

HTTP 403 Forbidden (권한 오류)
- INSUFFICIENT_PERMISSION: 권한 부족
- SELLER_ONLY: 판매자만 접근 가능

HTTP 404 Not Found (리소스 없음)
- PRODUCT_NOT_FOUND: 상품을 찾을 수 없음
- ORDER_NOT_FOUND: 주문을 찾을 수 없음

HTTP 409 Conflict (충돌)
- INSUFFICIENT_STOCK: 재고 부족
- DUPLICATE_REQUEST: 중복 요청
- INVALID_ORDER_STATUS: 유효하지 않은 주문 상태

HTTP 500 Internal Server Error (서버 오류)
- INTERNAL_ERROR: 서버 내부 오류
```

### 에러 응답 형식
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "사용자 친화적 메시지",
    "details": {
      "field": "fieldName",
      "issue": "상세 설명"
    }
  },
  "timestamp": "2026-05-27T10:30:00Z"
}
```

---

## 11. 인증 및 보안

### JWT 토큰 구조
```
Header: { alg: "HS256", typ: "JWT" }
Payload: {
  userId: 1000,
  email: "user@example.com",
  userType: "BUYER",
  iat: 1234567890,
  exp: 1234571490
}

토큰 유효 시간: 1시간
Refresh Token 유효 시간: 30일
```

### 요청 헤더
```
Authorization: Bearer {token}
Content-Type: application/json
X-API-Version: v1
```

---

## 12. 레이트 리미팅

```
일반 사용자:
- API 호출: 100회/분
- 파일 업로드: 10회/분

판매자:
- API 호출: 500회/분
- 상품 일괄 작업: 50회/분

관리자:
- 제한 없음
```

---

## 13. API 사용 예시

### JavaScript (Fetch API)
```javascript
// 상품 목록 조회
fetch('/api/v1/products?category=1&limit=20', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error(error));

// 주문 생성
fetch('/api/v1/orders', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify({
    items: [{ productId: 10, quantity: 2 }],
    deliveryAddressId: 5,
    paymentMethod: 'CREDIT_CARD'
  })
})
.then(response => response.json())
.then(data => console.log(data));
```

---

## 다음 문서로 읽어야 할 것

1. **06_security_requirements.md** - 보안 요구사항
2. **07_spec_template.md** - 기획서 템플릿
