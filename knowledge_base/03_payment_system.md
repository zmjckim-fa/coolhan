# 03_payment_system.md - Payment System Domain Module

## Overview
The Payment System module handles payment processing, payment methods, transaction management, and payment status tracking. This module integrates with external payment gateways and manages all financial transactions.

---

## 1. Terminology Definition

| Term | Definition | Example |
|------|-----------|---------|
| **Payment** | Financial transaction to complete purchase | $99.99 charge |
| **Payment Gateway** | Third-party service processing payments | Stripe, PayPal, Square |
| **Transaction** | Record of payment attempt with status | TXN-20260527-001 |
| **Payment Method** | Mechanism for paying (card, bank account, wallet) | Visa card ending in 4242 |
| **Amount** | Monetary value of transaction | $99.99 |
| **Currency** | Monetary unit for transaction | USD, EUR, JPY |
| **Status** | Current state of payment transaction | Pending, Completed, Failed |
| **Authorization** | Payment method validation without charging | Pre-auth for hold |
| **Capture** | Completion of authorized payment | Charge after pre-auth |
| **Refund** | Return of payment to customer | Full or partial |
| **Fee** | Payment processing cost | 2.9% + $0.30 per transaction |
| **Invoice** | Formal billing document with payment terms | INV-20260527-001 |
| **Reconciliation** | Matching transactions with payment provider | Verify all charges received |
| **PCI-DSS** | Payment Card Industry Data Security Standard | Compliance for card data handling |

---

## 2. Basic Functions

### 2.1 Payment Method Management
- **Purpose**: Store and manage customer payment methods securely
- **Input**: Payment method details (card, bank account, digital wallet, etc.)
- **Process**: Tokenize via payment gateway → Store token → Verify method → Enable/disable
- **Output**: Stored payment method token
- **Error Handling**: Invalid card, tokenization failure, card declined

### 2.2 Add Payment Method
- **Purpose**: Allow customer to add new payment method to account
- **Input**: Payment method details
- **Process**: Validate format → Tokenize → Small charge + refund for verification → Store token
- **Output**: Payment method available for use
- **Error Handling**: Invalid payment method, verification charge failed

### 2.3 Process Payment
- **Purpose**: Charge payment method for order
- **Input**: Amount, currency, payment method token, metadata (order ID, customer info)
- **Process**: Validate amount → Call payment gateway → Handle response → Record transaction
- **Output**: Transaction record with status and reference
- **Error Handling**: Insufficient funds, expired card, fraud detection, declined card

### 2.4 Handle Payment Response
- **Purpose**: Process payment gateway webhook responses
- **Input**: Webhook payload from payment provider
- **Process**: Verify signature → Parse response → Update transaction status → Trigger next steps
- **Output**: Transaction status updated
- **Error Handling**: Invalid signature, duplicate webhook, unknown transaction

### 2.5 Refund Payment
- **Purpose**: Return payment to customer (full or partial)
- **Input**: Transaction ID, refund amount (for partial refunds)
- **Process**: Validate original transaction → Call payment gateway → Record refund → Update order status
- **Output**: Refund transaction record
- **Error Handling**: Refund already processed, original transaction not found, partial refund invalid

### 2.6 Payment Reconciliation
- **Purpose**: Verify all transactions match payment provider records
- **Input**: Date range, payment method
- **Process**: Query payment provider → Compare with local records → Identify discrepancies → Generate report
- **Output**: Reconciliation report with any discrepancies
- **Error Handling**: Provider API timeout, missing transactions, amount mismatch

### 2.7 Payment Status Check
- **Purpose**: Verify current status of payment transaction
- **Input**: Transaction ID
- **Process**: Query local record → Call payment provider if needed → Return current status
- **Output**: Transaction status with details
- **Error Handling**: Transaction not found, provider unavailable

### 2.8 Invoice Generation
- **Purpose**: Create formal invoice document for payment
- **Input**: Order data, payment terms, tax info
- **Process**: Format data → Include payment method → Include due date → Generate PDF → Store copy
- **Output**: Invoice document
- **Error Handling**: Order data incomplete, PDF generation failure

### 2.9 Payment Retry
- **Purpose**: Retry failed payment with same or different method
- **Input**: Failed transaction ID, new payment method (optional)
- **Process**: Validate original transaction failed → Retry charge → Update status
- **Output**: New transaction record with result
- **Error Handling**: Transaction not retryable, payment still fails

### 2.10 Billing History
- **Purpose**: Display customer's payment history
- **Input**: Member/customer ID
- **Process**: Query all transactions → Sort by date → Include status and amount
- **Output**: List of transactions with details
- **Error Handling**: No transactions found, customer not found

---

## 3. Status Values

| Status | Description | Transitions | Business Rules |
|--------|-------------|-----------|-----------------|
| **Pending** | Awaiting payment gateway response | → Success, Failed, Cancelled | No funds charged yet |
| **Processing** | Payment being processed | → Success, Failed | Waiting for 3rd party |
| **Authorized** | Amount held, awaiting capture | → Captured, Cancelled | Funds reserved, not charged |
| **Captured** | Payment successfully charged | → Refunded, Partially Refunded | Funds obtained |
| **Completed** | Payment settled and reconciled | None (final) | Cleared with payment provider |
| **Failed** | Payment attempt failed | → Pending (retry) | Funds not transferred |
| **Cancelled** | Payment cancelled by user or system | None (final) | No charge occurred |
| **Refunded** | Payment returned to customer | → Refunded (if partial) | Full amount returned |
| **Partially Refunded** | Partial refund issued | → Refunded, Partially Refunded | Some amount returned |
| **Disputed** | Customer initiated dispute/chargeback | → Resolved | Under investigation |

---

## 4. Database Basic Structure

### Core Tables

#### payment_methods
```
- id (PK): UUID/INT
- member_id (FK): UUID/INT
- payment_gateway: VARCHAR(50) (stripe, paypal, square, etc.)
- payment_type: ENUM(credit_card, debit_card, bank_account, digital_wallet, other)
- token: VARCHAR(500) (encrypted, from payment gateway)
- last_four: VARCHAR(4) (card last 4 digits for display)
- card_brand: VARCHAR(50) (visa, mastercard, amex, etc.) (optional)
- card_holder_name: VARCHAR(255)
- exp_month: INT (optional, for cards)
- exp_year: INT (optional, for cards)
- is_default: BOOLEAN
- is_active: BOOLEAN
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
- deleted_at: TIMESTAMP (soft delete)
```

#### payment_transactions
```
- id (PK): UUID/INT
- transaction_type: ENUM(charge, refund, dispute, adjustment)
- order_id (FK): UUID/INT
- member_id (FK): UUID/INT
- payment_method_id (FK): UUID/INT
- amount: DECIMAL(12,2)
- currency: VARCHAR(3) (USD, EUR, etc.)
- status: ENUM(pending, processing, authorized, captured, completed, failed, cancelled, disputed)
- gateway_response: JSON (complete response from payment provider)
- gateway_transaction_id: VARCHAR(255) (from payment provider)
- idempotency_key: VARCHAR(255) (for preventing duplicate charges)
- description: VARCHAR(500)
- metadata: JSON (order_id, customer_id, etc.)
- failed_reason: VARCHAR(255) (if status is failed)
- retry_count: INT
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
- settled_at: TIMESTAMP (when payment cleared)
```

#### refund_transactions
```
- id (PK): UUID/INT
- original_transaction_id (FK): UUID/INT
- order_id (FK): UUID/INT
- member_id (FK): UUID/INT
- amount: DECIMAL(12,2)
- reason: VARCHAR(255) (customer_request, product_returned, etc.)
- status: ENUM(pending, processing, completed, failed, rejected)
- gateway_response: JSON
- gateway_refund_id: VARCHAR(255)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
- completed_at: TIMESTAMP
```

#### invoices
```
- id (PK): UUID/INT
- invoice_number (UNIQUE): VARCHAR(50)
- order_id (FK): UUID/INT
- member_id (FK): UUID/INT
- amount: DECIMAL(12,2)
- tax_amount: DECIMAL(12,2)
- discount_amount: DECIMAL(12,2)
- total: DECIMAL(12,2)
- currency: VARCHAR(3)
- status: ENUM(draft, sent, paid, overdue, cancelled)
- due_date: DATE
- issued_date: DATE
- paid_date: DATE
- pdf_url: VARCHAR(500) (stored invoice file)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### payment_reconciliation
```
- id (PK): UUID/INT
- reconciliation_date: DATE
- start_date: DATE
- end_date: DATE
- transaction_count: INT
- total_amount: DECIMAL(12,2)
- expected_amount: DECIMAL(12,2) (from provider)
- variance_amount: DECIMAL(12,2)
- status: ENUM(pending, matched, discrepancies_found, resolved)
- discrepancies: JSON (list of mismatches)
- created_at: TIMESTAMP
- resolved_at: TIMESTAMP
```

#### payment_dispute
```
- id (PK): UUID/INT
- transaction_id (FK): UUID/INT
- member_id (FK): UUID/INT
- dispute_type: VARCHAR(50) (chargeback, fraud, etc.)
- amount: DECIMAL(12,2)
- reason: TEXT
- status: ENUM(open, investigation, won, lost, resolved)
- evidence: JSON (documents provided)
- gateway_dispute_id: VARCHAR(255)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
- resolved_at: TIMESTAMP
```

---

## 5. API Basic Structure

### Payment Method Endpoints
```
GET    /payment-methods           - List user's payment methods
POST   /payment-methods           - Add new payment method
DELETE /payment-methods/:id       - Remove payment method
PUT    /payment-methods/:id       - Update payment method (set default, etc.)
POST   /payment-methods/:id/verify - Verify payment method
```

### Payment Endpoints
```
POST   /payments                  - Process payment for order
GET    /payments/:transactionId   - Get payment status
POST   /payments/:transactionId/retry - Retry failed payment
POST   /payments/:transactionId/refund - Issue refund
PUT    /payments/:transactionId   - Update payment (e.g., dispute)
GET    /payments                  - List user's payment history
```

### Invoice Endpoints
```
GET    /invoices                  - List user's invoices
GET    /invoices/:id              - Get invoice details
GET    /invoices/:id/pdf          - Download invoice PDF
POST   /invoices                  - Create new invoice (checkout)
POST   /invoices/:id/send         - Email invoice to customer
```

### Admin Endpoints
```
GET    /admin/payments            - List all transactions
GET    /admin/payments/:id        - Payment details
POST   /admin/payments/:id/refund - Issue refund (admin)
GET    /admin/disputes            - List payment disputes
PUT    /admin/disputes/:id        - Update dispute status
POST   /admin/reconciliation      - Run reconciliation
GET    /admin/reconciliation/:id  - Reconciliation report
GET    /admin/payment-analytics   - Payment metrics (success rate, avg amount, etc.)
```

---

## 6. Permissions

### Public (No Authentication)
- None - all payment endpoints require authentication

### Authenticated User
- GET /payment-methods
- POST /payment-methods
- PUT /payment-methods/:id (own methods only)
- DELETE /payment-methods/:id (own methods only)
- POST /payments (own payments only)
- GET /payments/:id (own payments only)
- POST /payments/:id/refund (own payments, with restrictions)
- GET /invoices (own invoices only)
- GET /invoices/:id/pdf (own invoices only)

### Admin Only
- GET /admin/payments
- GET /admin/payments/:id
- POST /admin/payments/:id/refund (any payment)
- All admin endpoints

---

## 7. Prohibitions

### Absolute Prohibitions
- **Cannot**: Store complete payment card details in plaintext (must use tokenization)
- **Cannot**: Store card data locally - must use payment gateway tokens only
- **Cannot**: Store CVV/CVC code at all, even encrypted
- **Cannot**: Transmit card data directly - must use payment gateway API
- **Cannot**: Refund more than original transaction amount without authorization
- **Cannot**: Charge payment method without explicit user authorization
- **Cannot**: Modify transaction amount after completion
- **Cannot**: Process payment without verifying order exists
- **Cannot**: Issue invoice without successful payment (unless on-account billing)

### Conditional Prohibitions
- **Unless failed multiple times**: Cannot continue retrying failed transaction
- **Unless approved by fraud system**: Cannot process suspicious transactions
- **Unless within refund window**: Cannot issue refund (configurable, e.g., 30 days)
- **Unless dispute resolved**: Cannot consider payment fully settled

---

## 8. Security Standards

### PCI-DSS Compliance
- **Must be PCI-DSS Level 1 compliant** (annual audit required)
- All payment data encrypted in transit (TLS 1.2+)
- All payment data encrypted at rest (AES-256)
- Payment processing isolated in secure network segment
- Tokenization required for all stored payment methods
- Never store full card numbers, CVV, or magnetic stripe data

### Payment Gateway Integration
- API keys stored in secure configuration (environment variables, secrets manager)
- Webhooks verified using signature validation (HMAC)
- Webhook processing idempotent (handle duplicates)
- All gateway requests use HTTPS/TLS 1.2+
- Gateway API responses logged without sensitive data
- Timeout configured for all API calls (default 30 seconds)

### Transaction Security
- Idempotency keys prevent duplicate charges
- Transaction verification before processing
- Amount validation before charge
- Rate limiting on payment endpoints (max 10 requests/minute)
- Anomaly detection for suspicious patterns (unusual amounts, rapid transactions)
- Logging of all transaction attempts with timestamps

### Data Protection
- Tokenization of all payment methods
- Last 4 digits only for customer display
- Card holder name stored separately from token
- Expiration dates validated before use
- Failed transactions don't expose cardholder details
- Error messages don't indicate card validity

---

## 9. Acceptance Criteria

### Payment Method Management
- ✅ User can add payment method with validation
- ✅ Payment method is tokenized via gateway
- ✅ Verification charge works (if required)
- ✅ Multiple payment methods can be stored
- ✅ Default method is set correctly
- ✅ Payment method can be deleted

### Payment Processing
- ✅ Successful charge creates transaction record
- ✅ Amount is correct (order total including tax, minus discounts)
- ✅ Failed charge doesn't create order
- ✅ Payment status is updated correctly
- ✅ Transaction ID from payment provider is stored
- ✅ Retry works for failed transactions

### Refunds
- ✅ Full refund available within refund window (e.g., 30 days)
- ✅ Partial refunds work correctly
- ✅ Refund cannot exceed original transaction amount
- ✅ Refund status tracked separately
- ✅ Refund appears in customer payment history

### Invoices
- ✅ Invoice created automatically on payment
- ✅ Invoice includes all order details, tax, discounts
- ✅ Invoice PDF generated and stored
- ✅ Invoice can be emailed to customer
- ✅ Invoice number is unique and sequential

### Payment History
- ✅ Customer sees all their payments
- ✅ Admin can see all payments with filtering
- ✅ Payment status displayed correctly
- ✅ Transaction details include amount, date, method

### Reconciliation
- ✅ Reconciliation compares local records with payment provider
- ✅ Discrepancies identified and reported
- ✅ Mismatched amounts detected
- ✅ Missing transactions flagged

---

## 10. Integration Points

### External Payment Gateways
- **Primary**: Stripe, PayPal, Square, or custom
- **Webhook handling**: Payment provider sends status updates
- **Tokenization**: Customer card data tokenized by provider
- **Reconciliation API**: Query transaction history from provider

### Dependency Services
- **Order System** (09_): For order total and details
- **Notification Service** (06_): For payment receipts and invoices
- **Member System** (01_): For customer info and payment methods
- **Shipping Service** (04_): For shipping cost in invoice
- **Accounting Service**: For financial reconciliation (optional)

### Integration Hooks
- On payment success: Update order status, trigger fulfillment
- On payment failure: Notify customer, allow retry
- On refund: Update order status, reverse inventory reservation
- On dispute: Alert admin, gather evidence
- On reconciliation: Resolve discrepancies

---

## 11. Configuration Parameters

| Parameter | Default | Min | Max | Notes |
|-----------|---------|-----|-----|-------|
| Payment gateway provider | stripe | - | - | Choose primary gateway |
| Supported currencies | USD | - | - | Add more as needed |
| Max retry attempts | 3 | 1 | 10 | Failed payment retries |
| Retry wait time (hours) | 24 | 1 | 168 | Between retries |
| Refund window (days) | 30 | 0 | 365 | 0 = unlimited |
| Invoice due days | 30 | 0 | 180 | Days from issue |
| Payment timeout (sec) | 30 | 5 | 120 | API call timeout |
| Reconciliation frequency | daily | - | - | Weekly, daily, etc. |
| Webhook retry limit | 3 | 1 | 10 | Webhook retry attempts |
| Webhook timeout (sec) | 10 | 5 | 30 | Webhook processing timeout |

---

## 12. Known Dependencies

- **Payment System** depends on **Member System** (01_) for customer context
- **Payment System** depends on **Shopping Mall** (02_) for order total and pricing
- **Payment System** depends on **Shipping Service** (04_) for shipping costs
- **Payment System** is used by **Order Management** (09_) for payment processing
- **Payment System** integrates with **Notification System** (06_) for receipts and invoices
- **Payment System** may integrate with **Admin System** (05_) for financial reports
