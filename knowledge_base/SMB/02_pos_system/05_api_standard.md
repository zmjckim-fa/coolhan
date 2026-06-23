# POS System - API Standard

## Overview

This document defines all API endpoints, request/response formats, status codes, and authentication methods of the POS system.

---

## 1. Base Configuration

### 1.1 Base Information

```
API version: v1
Base URL: https://api.pos-system.com/api/v1

Authentication: JWT Bearer Token
  - Token lifetime: 1 hour
  - Refresh token: 30 days
  - Header: Authorization: Bearer <token>

Request format: JSON
Response format: 
  {
    "success": true/false,
    "code": "SUCCESS" | "[ERROR_CODE]",
    "message": "[description]",
    "data": {...},
    "timestamp": "2026-05-27T10:30:00Z"
  }

Rate limits:
  - Regular user: 100 requests/min
  - Cashier: 500 requests/min
  - Admin: no limit

Response time targets:
  - Average: under 200ms
  - Maximum: under 1000ms
```

### 1.2 Status Codes

```
2xx (success)
  200 OK: request succeeded
  201 Created: resource creation succeeded

4xx (client error)
  400 Bad Request: request format error
  401 Unauthorized: authentication required
  403 Forbidden: insufficient permission
  404 Not Found: resource not found
  409 Conflict: transaction state conflict (e.g., already completed transaction)

5xx (server error)
  500 Internal Server Error: server error
  503 Service Unavailable: temporary outage
```

---

## 2. Authentication & Authorization

### 2.1 Login

```
POST /auth/login

Request:
{
  "user_id": "cashier_001",
  "password": "encrypted_password",
  "terminal_id": "POS-001"
}

Response (200 OK):
{
  "success": true,
  "data": {
    "access_token": "eyJhbGc...",
    "refresh_token": "eyJhbGc...",
    "user": {
      "id": "USR-001",
      "name": "Kim Cheolsu",
      "role": "CASHIER",
      "permissions": ["transaction_create", "transaction_cancel"]
    },
    "terminal_info": {
      "id": "POS-001",
      "store": "store-001",
      "name": "Register 1"
    }
  }
}

Error (401 Unauthorized):
{
  "success": false,
  "code": "INVALID_CREDENTIALS",
  "message": "Invalid user ID or password"
}
```

### 2.2 Logout

```
POST /auth/logout
Authorization: Bearer <token>

Request:
{}

Response (200 OK):
{
  "success": true,
  "message": "Logged out"
}
```

### 2.3 Refresh Token

```
POST /auth/refresh
Authorization: Bearer <refresh_token>

Request:
{}

Response (200 OK):
{
  "success": true,
  "data": {
    "access_token": "eyJhbGc...",
    "refresh_token": "eyJhbGc..."
  }
}
```

---

## 3. Transaction API

### 3.1 Start Transaction

```
POST /transactions

Request:
{
  "terminal_id": "POS-001",
  "cashier_id": "USR-001"
}

Response (201 Created):
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

### 3.2 Add Item to Transaction

```
POST /transactions/{transaction_id}/items

Request:
{
  "product_code": "PROD-001",
  "quantity": 2,
  "unit_price": 10000
}

Response (200 OK):
{
  "success": true,
  "data": {
    "item_id": "ITEM-001",
    "product_code": "PROD-001",
    "product_name": "Ramen",
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

Error (409 Conflict):
{
  "success": false,
  "code": "OUT_OF_STOCK",
  "message": "Insufficient stock (current stock: 1)"
}
```

### 3.3 Remove Item from Transaction

```
DELETE /transactions/{transaction_id}/items/{item_id}

Response (200 OK):
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

### 3.4 Update Item Quantity

```
PUT /transactions/{transaction_id}/items/{item_id}

Request:
{
  "quantity": 3
}

Response (200 OK):
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

### 3.5 Cancel Transaction

```
POST /transactions/{transaction_id}/cancel

Request:
{
  "reason": "Customer request"
}

Response (200 OK):
{
  "success": true,
  "data": {
    "transaction_id": "TXN-20260527-00001",
    "status": "CANCELLED",
    "cancelled_at": "2026-05-27T10:35:00Z"
  }
}

Error (409 Conflict):
{
  "success": false,
  "code": "TRANSACTION_ALREADY_COMPLETED",
  "message": "An already completed transaction cannot be cancelled"
}
```

---

## 4. Payment API

### 4.1 Cash Payment

```
POST /transactions/{transaction_id}/payment/cash

Request:
{
  "received_amount": 50000,
  "transaction_total": 22000
}

Response (200 OK):
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

Error (400 Bad Request):
{
  "success": false,
  "code": "INSUFFICIENT_PAYMENT",
  "message": "Payment amount is less than the amount due"
}
```

### 4.2 Card Payment

```
POST /transactions/{transaction_id}/payment/card

Request:
{
  "card_token": "tok_visa_4242",
  "card_last4": "4242",
  "amount": 22000
}

Response (200 OK):
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

Error (400 Bad Request):
{
  "success": false,
  "code": "CARD_DECLINED",
  "message": "The card payment was declined",
  "pg_error_code": "CARD_DECLINED"
}
```

---

## 5. Return & Refund API

### 5.1 Search Original Transaction

```
GET /returns/search?receipt_number=RCP-20260527-001

Response (200 OK):
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
        "product_name": "Ramen",
        "quantity": 2,
        "unit_price": 10000,
        "line_total": 22000
      }
    ],
    "total": 22000
  }
}
```

### 5.2 Partial Return

```
POST /returns

Request:
{
  "original_transaction_id": "TXN-20260527-00001",
  "items": [
    {
      "item_id": "ITEM-001",
      "return_quantity": 1
    }
  ],
  "reason": "Quality defect"
}

Response (201 Created):
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

### 5.3 Process Refund

```
POST /returns/{return_id}/approve

Request:
{
  "refund_method": "CASH"
}

Response (200 OK):
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

## 6. Inventory API

### 6.1 Get Product Stock

```
GET /inventory/{product_code}

Response (200 OK):
{
  "success": true,
  "data": {
    "product_code": "PROD-001",
    "product_name": "Ramen",
    "current_stock": 150,
    "minimum_stock": 50,
    "maximum_stock": 500,
    "last_updated": "2026-05-27T10:45:00Z",
    "status": "OK"
  }
}
```

### 6.2 Search Low Stock Items

```
GET /inventory/low-stock?store_id=store-001

Response (200 OK):
{
  "success": true,
  "data": {
    "items": [
      {
        "product_code": "PROD-002",
        "product_name": "Beverage",
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

## 7. End of Day API

### 7.1 Get Daily Summary

```
GET /daily-close?date=2026-05-27

Response (200 OK):
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

### 7.2 Complete Daily Close

```
POST /daily-close/{date}/complete

Request:
{
  "terminal_id": "POS-001",
  "actual_cash_amount": 500000,
  "discrepancy_notes": ""
}

Response (200 OK):
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

## 8. Product & Category API

### 8.1 Get Products

```
GET /products?category=beverages&limit=20

Response (200 OK):
{
  "success": true,
  "data": {
    "products": [
      {
        "code": "PROD-001",
        "name": "Ramen",
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

### 8.2 Get Categories

```
GET /categories

Response (200 OK):
{
  "success": true,
  "data": {
    "categories": [
      {
        "id": "cat-001",
        "name": "Food",
        "count": 150
      },
      {
        "id": "cat-002",
        "name": "Beverage",
        "count": 195
      }
    ]
  }
}
```

---

## 9. Discount API

### 9.1 Get Member Discount

```
GET /discounts/member/{member_id}

Response (200 OK):
{
  "success": true,
  "data": {
    "member_id": "MEM-001",
    "name": "Kim Cheolsu",
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

## 10. Error Handling

### 10.1 General Error Response Format

```
400 Bad Request:
{
  "success": false,
  "code": "INVALID_REQUEST",
  "message": "The request format is invalid",
  "errors": [
    {
      "field": "quantity",
      "message": "Quantity must be greater than 0"
    }
  ]
}

401 Unauthorized:
{
  "success": false,
  "code": "INVALID_TOKEN",
  "message": "The authentication token is invalid"
}

403 Forbidden:
{
  "success": false,
  "code": "INSUFFICIENT_PERMISSION",
  "message": "You do not have permission to perform this action"
}

500 Internal Server Error:
{
  "success": false,
  "code": "SERVER_ERROR",
  "message": "A server error occurred",
  "request_id": "req-12345"
}
```

---

## 11. API Usage Examples

### 11.1 JavaScript Fetch Example

```javascript
// Login
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

// Start transaction
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

// Add item to transaction
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

## Summary

This API supports the following:
- ✅ Authentication and session management
- ✅ Transaction creation and management
- ✅ Payment processing (cash, card)
- ✅ Return/refund processing
- ✅ Inventory lookup
- ✅ End-of-day and reconciliation
- ✅ Product and discount management

All APIs require JWT token-based authentication and use a standardized response format.

---

**Version**: 1.0
**Created date**: 2026-05-27
**Status**: Complete
