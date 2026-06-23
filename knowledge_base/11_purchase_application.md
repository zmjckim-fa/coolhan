# Domain Module 11: Purchase Application

## Section 1: Module Identification

- **Module ID:** 11_purchase_application
- **Domain:** Purchase Application
- **Version:** 1.0.0
- **Status:** Active
- **Dependent Modules:** 01_member_system, 09_order_management

---

## Section 2: Core Features (10)

| # | Feature | Description |
|---|------|------|
| F1 | Submit purchase application | Create an application after entering product + shipping address + payment method |
| F2 | View application details | Single-record lookup by application number (My Page) |
| F3 | View application list | Customer's application list (paginated) |
| F4 | Update status | Admin executes status transitions |
| F5 | Cancel application | Allowed only in pending/reviewing status |
| F6 | Status timeline | Display status history in order |
| F7 | Calculate line items | quantity × unit price = subtotal, total |
| F8 | Validate shipping address | Validate required fields (name, address, contact) |
| F9 | Generate application number | Auto-generate in PA-YYYYMMDD-XXXX format |
| F10 | Render My Page HTML | Responsive detail view (360px and up) |

---

## Section 3: Database Schema

### purchase_applications table
```sql
CREATE TABLE purchase_applications (
    id              VARCHAR(20) PRIMARY KEY,   -- PA-YYYYMMDD-XXXX
    customer_email  VARCHAR(255) NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'pending',
    total_amount    DECIMAL(12,2) NOT NULL,
    currency        VARCHAR(3) NOT NULL DEFAULT 'KRW',
    payment_method  VARCHAR(50),
    logistics_note  TEXT,
    created_at      DATETIME NOT NULL,
    updated_at      DATETIME NOT NULL
);

CREATE TABLE purchase_items (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    application_id  VARCHAR(20) NOT NULL REFERENCES purchase_applications(id),
    name            VARCHAR(200) NOT NULL,
    qty             INTEGER NOT NULL DEFAULT 1,
    unit_price      DECIMAL(12,2) NOT NULL,
    subtotal        DECIMAL(12,2) NOT NULL
);

CREATE TABLE purchase_recipients (
    application_id  VARCHAR(20) PRIMARY KEY REFERENCES purchase_applications(id),
    recipient_name  VARCHAR(100) NOT NULL,
    phone           VARCHAR(30) NOT NULL,
    address1        VARCHAR(255) NOT NULL,
    address2        VARCHAR(255),
    city            VARCHAR(100),
    postal_code     VARCHAR(20)
);
```

---

## Section 4: Status Values (Compliant with 00_STATUS_VALUE_REGISTRY.md)

| Status Code | Label | Color | Allowed Transition Targets |
|---------|--------|------|---------------|
| `pending` | Application received | #6B7280 | reviewing, cancelled |
| `reviewing` | Under review | #D97706 | approved, cancelled |
| `approved` | Approved | #059669 | shipping |
| `shipping` | Shipping | #2563EB | delivered |
| `delivered` | Delivered | #15803D | (terminal) |
| `cancelled` | Cancelled | #DC2626 | (terminal) |

---

## Section 5: API Endpoints

| Method | Path | Description | Permission |
|-------|------|------|------|
| POST | `/api/purchase` | Submit application | Logged-in customer |
| GET | `/api/purchase/{id}` | Single-record lookup | Owner or admin |
| GET | `/api/purchase` | List lookup | Owner or admin |
| PATCH | `/api/purchase/{id}/status` | Change status | Admin |
| DELETE | `/api/purchase/{id}` | Cancel | Owner (pending/reviewing only) |
| GET | `/mypage/purchase/{id}` | HTML detail view | Owner |

---

## Section 6: Security Standards

- Identity verification: `customer_email` matching (JWT or session)
- Return 403 when viewing another user's application
- Return 404 when looking up a nonexistent application number
- Return 422 when requesting cancellation in a non-cancellable status (after approved)

---

## Section 7: Integration Points

- **01_member_system:** Customer authentication, email lookup
- **09_order_management:** Purchase application → order conversion flow before order confirmation
- **08_inventory_management:** Inventory reservation trigger on approval (optional)

---

## Section 8: Acceptance Criteria

| # | Criterion | Verification Method |
|---|------|---------|
| AC1 | Application number auto-generated in PA-YYYYMMDD-XXXX format | Unit test |
| AC2 | Detail lookup includes all sections (basic/product/shipping/payment) | API response structure validation |
| AC3 | Return 403 when viewing another user's application | Negative test |
| AC4 | HTML view has no layout breakage on 360px mobile | Responsive validation |
| AC5 | Only pending status can be cancelled | Status transition test |
| AC6 | Subtotal = qty × unit_price auto-calculated | Calculation validation |

---

## Section 9: Error Scenarios

| Error | Code | Message |
|------|------|--------|
| Application not found | 404 | "Application number not found" |
| Access to another user's application | 403 | "You do not have access permission" |
| Non-cancellable status | 422 | "Cannot cancel in the current status" |
| Missing required field | 422 | "Required field is missing: {field}" |
| Quantity error | 422 | "Quantity must be 1 or greater" |

---

## Section 10: My Page View Specification

### Layout (mobile-first)
```
[Page title: Purchase Application Detail]
[Breadcrumb: My Page › Purchase Application › {id}]

Card 1: Application Info
  - Application number | Status badge | Application date

Card 2: Product List
  - Table: Product name | Quantity | Unit price | Subtotal
  - Total row

Card 3: Shipping Address Info
  - Recipient | Contact | Address

Card 4: Payment Info
  - Payment method | Total amount

Card 5: Status Timeline
  - Received → Review → Approved → Shipping → Completed (current status highlighted)

[Button: ← Back to list]
```

### Responsive Standards
- Mobile (~767px): single column, cards at 100% width
- Tablet (768px and up): 2-column grid allowed
- Desktop (1024px and up): max-width 900px, centered

---

## Section 11: Demo Implementation (track10)

Path: `_harness_test/track10/`

| File | Role |
|------|------|
| `main.py` | FastAPI app entry point |
| `models.py` | Pydantic models + file-based store |
| `templates/mypage_purchase_detail.html` | Jinja2 responsive HTML template |

---

## Section 12: Change History

| Date | Version | Change |
|------|------|---------|
| 2026-06-13 | 1.0.0 | Initial draft — My Page purchase application detail view |
