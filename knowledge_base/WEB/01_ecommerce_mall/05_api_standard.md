# E-Commerce Mall - API Standard

## 1. API Design Principles

### REST API Basics
```
HTTP Method     Action         Example
─────────────────────────────────────────
GET            Read           GET /api/products
POST           Create         POST /api/orders
PUT            Full update    PUT /api/products/1
PATCH          Partial update PATCH /api/orders/1/status
DELETE         Delete         DELETE /api/cart/1
```

### Endpoint Naming Conventions
```
- Use nouns (not verbs): /api/products (O), /api/getProducts (X)
- Resource ID as path parameter: /api/products/{productId}
- Filter/search as query parameters: /api/products?category=electronics&minPrice=100
- Sub-resources: /api/orders/{orderId}/items
- Versioning: /api/v1/products (long-term support), /api/v2/products (new)
```

---

## 2. Product APIs

### 2.1 Get Product List
```
GET /api/v1/products

Query parameters:
- page: page number (default: 1)
- limit: items per page (default: 20, max: 100)
- category: category ID
- search: search term (product name, description)
- minPrice: minimum price
- maxPrice: maximum price
- sortBy: sort criterion (popularity, price, newest, rating)
- sortOrder: sort order (asc, desc)
- inStock: in-stock only (true/false)

Response 200:
{
  "success": true,
  "data": {
    "items": [
      {
        "productId": 1,
        "productName": "Product name",
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

Response 400:
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Invalid request parameter"
  }
}
```

### 2.2 Get Product Detail
```
GET /api/v1/products/{productId}

Response 200:
{
  "success": true,
  "data": {
    "productId": 1,
    "productName": "Product name",
    "description": "Short description",
    "detailedDescription": "Detailed description",
    "seller": {
      "sellerId": 100,
      "sellerName": "Seller name",
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
      "categoryName": "Electronics"
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
        "title": "Review title",
        "content": "Review content",
        "buyerName": "Buyer name",
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

Response 404:
{
  "success": false,
  "error": {
    "code": "PRODUCT_NOT_FOUND",
    "message": "Product not found"
  }
}
```

---

## 3. User APIs

### 3.1 Sign-up
```
POST /api/v1/auth/register

Request:
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "name": "User name",
  "phone": "010-1234-5678",
  "agreeToTerms": true,
  "agreeToPrivacy": true
}

Response 201:
{
  "success": true,
  "data": {
    "userId": 1000,
    "email": "user@example.com",
    "name": "User name",
    "token": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "expiresIn": 3600
  }
}

Response 400:
{
  "success": false,
  "error": {
    "code": "EMAIL_ALREADY_EXISTS",
    "message": "Email already registered"
  }
}
```

### 3.2 Login
```
POST /api/v1/auth/login

Request:
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}

Response 200:
{
  "success": true,
  "data": {
    "userId": 1000,
    "email": "user@example.com",
    "name": "User name",
    "userType": "BUYER",
    "token": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "expiresIn": 3600
  }
}

Response 401:
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Email or password does not match"
  }
}
```

### 3.3 Get Profile
```
GET /api/v1/users/me

Request header:
Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "data": {
    "userId": 1000,
    "email": "user@example.com",
    "name": "User name",
    "phone": "010-1234-5678",
    "gender": "M",
    "birthDate": "1990-01-15",
    "profileImage": "url",
    "createdAt": "2024-01-01T10:00:00Z"
  }
}
```

### 3.4 Update Profile
```
PUT /api/v1/users/me

Request:
{
  "name": "Changed name",
  "phone": "010-9876-5432",
  "gender": "M"
}

Response 200:
{
  "success": true,
  "message": "Profile updated"
}
```

---

## 4. Cart API

### 4.1 Get Cart
```
GET /api/v1/cart

Request header:
Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "data": {
    "cartId": 1,
    "items": [
      {
        "cartItemId": 1,
        "productId": 10,
        "productName": "Product name",
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

### 4.2 Add Product to Cart
```
POST /api/v1/cart/items

Request:
{
  "productId": 10,
  "quantity": 2
}

Response 201:
{
  "success": true,
  "data": {
    "cartItemId": 1,
    "productId": 10,
    "quantity": 2,
    "cartTotal": 19000
  }
}

Response 400:
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_STOCK",
    "message": "Insufficient stock"
  }
}
```

### 4.3 Change Cart Item Quantity
```
PATCH /api/v1/cart/items/{cartItemId}

Request:
{
  "quantity": 3
}

Response 200:
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

### 4.4 Delete Cart Item
```
DELETE /api/v1/cart/items/{cartItemId}

Response 200:
{
  "success": true,
  "message": "Cart item deleted"
}
```

---

## 5. Order API

### 5.1 Create Order
```
POST /api/v1/orders

Request:
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
  "memo": "Please handle with care during delivery",
  "paymentMethod": "CREDIT_CARD"
}

Response 201:
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
        "productName": "Product name",
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

### 5.2 Get Orders
```
GET /api/v1/orders

Query parameters:
- status: order status filter
- page: page number
- limit: items per page

Response 200:
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
        "mainProduct": "Product name"
      }
    ],
    "pagination": {...}
  }
}
```

### 5.3 Get Order Detail
```
GET /api/v1/orders/{orderId}

Response 200:
{
  "success": true,
  "data": {
    "orderId": 1000,
    "orderNumber": "ORD20260527001",
    "buyer": {
      "name": "Buyer name",
      "phone": "010-1234-5678",
      "email": "user@example.com"
    },
    "items": [
      {
        "orderItemId": 1,
        "productId": 10,
        "productName": "Product name",
        "quantity": 2,
        "unitPrice": 8000,
        "subtotal": 16000
      }
    ],
    "deliveryAddress": {
      "recipientName": "Recipient",
      "phone": "010-9876-5432",
      "streetAddress": "Gangnam-gu, Seoul",
      "detailedAddress": "123 Beonji"
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

### 5.4 Cancel Order
```
POST /api/v1/orders/{orderId}/cancel

Request:
{
  "reason": "Change of mind",
  "comment": "Detailed reason"
}

Response 200:
{
  "success": true,
  "data": {
    "orderId": 1000,
    "status": "CANCELLED",
    "refundAmount": 20000
  }
}

Response 400:
{
  "success": false,
  "error": {
    "code": "CANNOT_CANCEL_ORDER",
    "message": "Order cannot be cancelled because shipping has started"
  }
}
```

---

## 6. Shipping API

### 6.1 Get Shipping
```
GET /api/v1/orders/{orderId}/shipping

Response 200:
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
        "description": "Preparing shipment"
      },
      {
        "status": "IN_TRANSIT",
        "timestamp": "2026-05-27T18:00:00Z",
        "description": "In transit"
      }
    ]
  }
}
```

---

## 7. Payment API

### 7.1 Payment Callback (Payment Webhook)
```
POST /api/v1/webhooks/payment

Request (sent from PG):
{
  "transactionId": "123456",
  "orderId": 1000,
  "status": "SUCCESS",
  "amount": 20000,
  "paymentMethod": "CREDIT_CARD",
  "approvalNumber": "ABC123",
  "timestamp": "2026-05-27T10:35:00Z"
}

Response 200:
{
  "success": true,
  "message": "Payment information processed"
}
```

---

## 8. Review API

### 8.1 Write Review
```
POST /api/v1/reviews

Request:
{
  "productId": 10,
  "orderItemId": 1,
  "rating": 5,
  "title": "Great product",
  "content": "Detailed review content",
  "images": ["image_url_1", "image_url_2"]
}

Response 201:
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

### 8.2 Get Reviews
```
GET /api/v1/products/{productId}/reviews

Query parameters:
- page: page number
- sortBy: rating, helpful, newest
- filterRating: view only a specific rating (1~5)

Response 200:
{
  "success": true,
  "data": {
    "reviews": [
      {
        "reviewId": 1000,
        "rating": 5,
        "title": "Great product",
        "content": "Detailed review content",
        "buyerName": "Buyer",
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

## 9. Return API

### 9.1 Return Request
```
POST /api/v1/returns

Request:
{
  "orderId": 1000,
  "orderItemId": 1,
  "reason": "DEFECTIVE",
  "reasonDetail": "The product has a scratch",
  "images": ["evidence_image_url"]
}

Response 201:
{
  "success": true,
  "data": {
    "returnId": 100,
    "status": "REQUESTED",
    "createdAt": "2026-05-27T10:30:00Z"
  }
}
```

### 9.2 Get Return
```
GET /api/v1/returns/{returnId}

Response 200:
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
    "sellerResponse": "The return has been approved"
  }
}
```

---

## 10. Error Response Standard

### Error Codes and HTTP Status
```
HTTP 400 Bad Request (client error)
- INVALID_REQUEST: invalid request format
- INVALID_PARAMETER: invalid parameter value
- MISSING_PARAMETER: required parameter missing

HTTP 401 Unauthorized (authentication error)
- INVALID_TOKEN: token is invalid
- TOKEN_EXPIRED: token has expired
- NOT_AUTHENTICATED: authentication required

HTTP 403 Forbidden (permission error)
- INSUFFICIENT_PERMISSION: insufficient permission
- SELLER_ONLY: accessible by sellers only

HTTP 404 Not Found (resource not found)
- PRODUCT_NOT_FOUND: product not found
- ORDER_NOT_FOUND: order not found

HTTP 409 Conflict (conflict)
- INSUFFICIENT_STOCK: insufficient stock
- DUPLICATE_REQUEST: duplicate request
- INVALID_ORDER_STATUS: invalid order status

HTTP 500 Internal Server Error (server error)
- INTERNAL_ERROR: internal server error
```

### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "User-friendly message",
    "details": {
      "field": "fieldName",
      "issue": "Detailed description"
    }
  },
  "timestamp": "2026-05-27T10:30:00Z"
}
```

---

## 11. Authentication and Security

### JWT Token Structure
```
Header: { alg: "HS256", typ: "JWT" }
Payload: {
  userId: 1000,
  email: "user@example.com",
  userType: "BUYER",
  iat: 1234567890,
  exp: 1234571490
}

Token lifetime: 1 hour
Refresh Token lifetime: 30 days
```

### Request Headers
```
Authorization: Bearer {token}
Content-Type: application/json
X-API-Version: v1
```

---

## 12. Rate Limiting

```
Regular user:
- API calls: 100/min
- File uploads: 10/min

Seller:
- API calls: 500/min
- Bulk product operations: 50/min

Admin:
- No limit
```

---

## 13. API Usage Examples

### JavaScript (Fetch API)
```javascript
// Get product list
fetch('/api/v1/products?category=1&limit=20', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error(error));

// Create order
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

## What to Read Next

1. **06_security_requirements.md** - Security requirements
2. **07_spec_template.md** - Specification template
