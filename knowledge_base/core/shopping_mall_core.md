# Shopping Mall Core - B2C E-Commerce Standard Definition
**Version:** 1.0.0  
**Effective Date:** 2026-05-27  
**Purpose:** B2C E-Commerce Platform Standard Definition  
**Status:** MANDATORY for shopping mall projects  
**Language:** English

---

## 📌 Executive Summary

Shopping Mall Core defines the minimum required features, data structures, status values, and API patterns for a B2C e-commerce platform. Once this Core is loaded, there is no need to repeatedly explain "what a shopping mall is."

**Core Principles:**
- Single seller (Platform-to-Consumer, P2C)
- Member-based purchasing
- Credit card / bank transfer payment
- Delivery tracking
- Basic admin features

---

## 1️⃣ Built-in Features (Non-Negotiable)

Features that must be included. Cannot be removed:

### Member System
- **Sign-up**: Email-based verification
  - Required info: email, password, name, mobile phone
  - Email verification required
  - Prevent duplicate sign-ups
- **Login/logout**: Email + password
  - Session management (or JWT)
  - Auto-login option (30 days)
  - Find/change password
- **Profile management**: Edit personal info
  - Manage name, mobile phone, shipping address
  - Change password
  - Account deletion

### Product Catalog
- **Product lookup**: Browsing feature
  - Product list by category
  - Search feature (product name, description)
  - Sorting (popularity, price, new arrivals)
  - Pagination (20–50 per page)
- **Product detail**: Look up product info
  - Product name, description, image, price
  - Stock status (in stock / out of stock)
  - Product rating and review count

### Cart
- **Add/remove**: Cart management
  - Specify quantity when adding a product (1 or more)
  - Remove button
  - Change quantity
  - Continue shopping option
- **View cart**: Current cart state
  - Product list (image, name, price, quantity, subtotal)
  - Total auto-calculated
  - Shipping fee not included (calculated at checkout)

### Orders (order creation ~ delivery tracking)
- **Create order**: Cart → order conversion
  - Enter/select shipping address
  - Select delivery method (standard delivery only; express delivery requires additional logic)
  - Add shipping fee
  - Order review screen
- **Order confirmation**: Look up created order
  - Order number, order date/time, order status
  - Product list, quantity, price
  - Estimated delivery date
- **Cancel order**: Can cancel before shipping
  - Allowed only in pending_payment or payment_confirmed status
  - Record cancellation reason
  - Automatic refund processing (payment cancellation)
- **Delivery tracking**: Real-time delivery status lookup
  - Carrier, tracking number
  - Current delivery status
  - Estimated delivery date
  - Delivery history

### Payment
- **Payment methods**: Credit card, bank transfer
  - PG (payment gateway) integration (e.g., Stripe, NHN KCP)
  - Card issuer authentication (or OTP)
  - Issue and store transaction key
- **Payment processing**: Execute payment
  - Re-confirm amount before payment (prevent cart tampering)
  - Payment timeout: 30 minutes (auto-canceled if not completed)
  - Idempotency guaranteed (charged only once on repeated identical requests)
- **Payment confirmation**: Look up payment status
  - Payment success/failure
  - Transaction number, payment method
  - Payment date/time

### Shipping
- **Shipping management**: Order → shipping processing
  - Prepare shipping after order confirmation
  - Carrier selection (Korea Express, CJ, Logen, etc.)
  - Enter tracking number
  - Automatic delivery status update (carrier API integration)
- **Returns/exchanges**: Post-delivery return processing
  - Return request available within 30 days of delivery completion
  - Select return reason
  - Provide return shipping address
  - Process refund after receiving the return

### Admin Features
- **Product management**: Product CRUD
  - Register product (name, description, image, price, stock)
  - Edit product (price, stock, etc.)
  - Deactivate product (not delete)
  - Category management
- **Order management**: Look up and process all orders
  - Order list (filter: status, date)
  - Order detail lookup
  - Manual order status change (e.g., shipping preparation complete)
- **User management**: Look up and process members
  - Member list
  - Member info lookup
  - Deactivate/activate member
- **Statistics**: Basic sales statistics
  - Daily sales amount
  - Sales volume by product
  - Order count

---

## 2️⃣ Base DB Structure (9 core tables)

| # | Table | Purpose | Owning Module | Row Estimate (1 year) |
|---|--------|------|---------|-----------------|
| 1 | `users` | Member info | 01_member_system | 10K-100K |
| 2 | `products` | Product info | 02_shopping_mall | 1K-10K |
| 3 | `product_images` | Product images | 02_shopping_mall | 5K-50K |
| 4 | `addresses` | Shipping addresses | 01_member_system | 20K-200K |
| 5 | `cart_items` | Cart items | 02_shopping_mall | 100K-1M (temporary) |
| 6 | `orders` | Orders | 09_order_management | 10K-100K |
| 7 | `order_items` | Order items | 09_order_management | 30K-300K |
| 8 | `payments` | Payments | 03_payment_system | 10K-100K |
| 9 | `shipments` | Shipments | 04_shipping_logistics | 10K-100K |

### Table Schema Overview

**users**
```
id (PK) | email (UNIQUE) | password_hash | name | phone | created_at | updated_at | is_active
```

**products**
```
id (PK) | name | description | price | stock | category_id | image_url | is_active | created_at | updated_at
```

**orders**
```
id (PK) | user_id (FK) | order_number (UNIQUE) | total_amount | status | shipping_address | created_at | updated_at
```

**payments**
```
id (PK) | order_id (FK) | amount | status | payment_method | transaction_id | created_at
```

**shipments**
```
id (PK) | order_id (FK) | shipping_company | tracking_number | status | shipped_at | delivered_at | created_at
```

---

## 3️⃣ Base Status Values (Status Value Registry)

### Order Status
```
(1) pending_payment
    → (2) payment_confirmed
        → (3) shipping_ready
            → (4) in_transit
                → (5) delivered
                    → (6) completed
    
    or
    → (X) canceled (at any stage)

From (5) delivered status
    → (7) return_requested
        → (8) return_approved
            → (9) return_in_transit
                → (10) return_completed
                    → (11) refunded
```

**Status descriptions:**
- `pending_payment`: Order created, awaiting payment. Timeout 30 minutes
- `payment_confirmed`: Payment complete
- `shipping_ready`: Product packaging complete, awaiting carrier pickup
- `in_transit`: In transit
- `delivered`: Delivery complete
- `completed`: Transaction complete (typically 7 days after delivery)
- `canceled`: Canceled
- `return_requested`: Return requested
- `return_approved`: Return approved
- `return_in_transit`: Return in transit
- `return_completed`: Return arrived
- `refunded`: Refund complete

### Payment Status
```
(1) pending
    → (2) completed
        → (3) refunded

or
→ (X) failed
→ (X) canceled
```

### Shipment Status
```
(1) ready_to_ship
    → (2) in_transit
        → (3) delivered

or
→ (X) failed (delivery failed, returned)
→ (X) returned (return)
→ (X) canceled
```

---

## 4️⃣ Base API Endpoints (30+ endpoints)

### Authentication (5 endpoints)
```
POST   /auth/register              Sign up
POST   /auth/login                 Login
POST   /auth/logout                Logout
POST   /auth/refresh-token         Refresh token
POST   /auth/forgot-password       Find password
```

### Member (8 endpoints)
```
GET    /members/{id}               Look up personal info
PUT    /members/{id}               Update personal info
DELETE /members/{id}               Delete account
POST   /members/{id}/addresses     Add shipping address
GET    /members/{id}/addresses     Shipping address list
PUT    /members/{id}/addresses/{addr_id}  Update address
DELETE /members/{id}/addresses/{addr_id}  Delete address
POST   /members/{id}/password      Change password
```

### Product (6 endpoints)
```
GET    /products                   Product list (search, filter, sort)
GET    /products/{id}              Product detail lookup
POST   /products                   Register product (admin)
PUT    /products/{id}              Edit product (admin)
DELETE /products/{id}              Deactivate product (admin)
GET    /products/{id}/reviews      Look up product reviews
```

### Cart (5 endpoints)
```
GET    /cart                       View cart
POST   /cart/items                 Add product
PUT    /cart/items/{item_id}       Change quantity
DELETE /cart/items/{item_id}       Remove product
DELETE /cart                       Empty cart
```

### Order (8 endpoints)
```
POST   /orders                     Create order
GET    /orders                     Order list (personal)
GET    /orders/{id}                Order detail lookup
PUT    /orders/{id}/cancel         Cancel order
GET    /orders/{id}/shipment       Look up shipment
POST   /orders/{id}/return         Request return
GET    /admin/orders               Order list (admin, filterable)
PUT    /admin/orders/{id}/status   Change order status (admin)
```

### Payment (4 endpoints)
```
POST   /payments                   Execute payment
GET    /payments/{id}              Payment detail lookup
POST   /payments/{id}/refund       Refund (admin)
GET    /admin/payments             Payment list (admin)
```

### Admin Dashboard (4 endpoints)
```
GET    /admin/dashboard/stats      Sales statistics
GET    /admin/products             Product management
GET    /admin/members              Member management
GET    /admin/audit-log            Audit log
```

---

## 5️⃣ Prohibitions

**Features that must never be implemented:**

- ❌ **Multi-currency pricing**
  - e.g., Displaying products in USD, EUR, KRW
  - Reason: Increased exchange rate management complexity
  
- ❌ **Subscription products**
  - e.g., Monthly recurring delivery
  - Reason: Requires recurring payment logic (separate Core)
  
- ❌ **Complex promotions (Dynamic discount rules)**
  - e.g., "10% off when buying 3", "time-limited discounts"
  - Reason: Base supports fixed pricing only
  - Allowed: Fixed discount price (e.g., list price 10,000 → sale price 8,000)
  
- ❌ **Product variants**
  - e.g., "Shirt (color: red/blue, size: S/M/L)"
  - Reason: Requires separate architecture
  - Allowed: Register each option as a separate product
  
- ❌ **Loyalty points**
  - e.g., Earn points on purchase, pay with points
  - Reason: Requires separate Core
  
- ❌ **Dropshipping**
  - e.g., Direct shipping from a third-party supplier
  - Reason: Requires separate Core (marketplace)

---

## 6️⃣ Industry-Standard Scenarios

### Scenario 1: Happy Path - Normal Order Flow

```
Step 1: Sign-up & login (5 min)
  User: Enters email, password, name, mobile phone
  System: Sends email verification message
  User: Clicks email to complete verification
  
Step 2: Product search & selection (10 min)
  User: Category → search → product detail lookup
  System: Returns product info (name, price, image, stock)
  
Step 3: Cart (2 min)
  User: Clicks "Add to cart" (quantity 2)
  System: Adds to cart, displays total
  
Step 4: Payment (5 min)
  User: Clicks "Buy now"
  System: Shipping address selection screen
  User: Selects address or enters a new one
  System: Calculates shipping fee (e.g., 3,000 KRW), displays total
  User: Selects payment method (card/account)
  User: Card issuer OTP or authentication
  System: Payment complete, order number issued
  
Step 5: Shipping (2–7 days)
  System: Requests pickup from carrier (automatic or admin)
  Carrier: Picks up product → starts delivery
  System: Auto-updates delivery status (carrier API)
  User: Checks real-time location on delivery tracking page
  
Step 6: Delivery complete
  Carrier: Notifies arrival at final destination
  System: Changes status → "delivered"
  User: Receives "delivery complete" notification
  
Step 7: Transaction complete (after 7 days)
  System: Automatically changes status → "completed"
  User: Can write a review
```

**Estimated time:** Sign-up 5 min + shopping 10 min + payment 5 min + delivery 2–7 days

---

### Scenario 2: Order Cancellation

```
Situation: User cancels after payment but before shipping

Step 1: Cancellation request
  User: Clicks "Cancel order" button on order detail page
  System: Checks whether cancellation is possible
    ✓ Possible: pending_payment or payment_confirmed
    ✗ Not possible: shipping_ready or later
  
Step 2: Cancellation processing
  User: Selects cancellation reason (optional)
  System: 
    - Order status → "canceled"
    - Cancel payment (request to PG)
    - Refund to user's account
    - Send notification
  
Step 3: Confirmation
  User: Confirms refund (takes 1–3 days)
  System: Changes payment status → "canceled"
```

**Estimated time:** Immediate request, refund takes 1–3 days

---

### Scenario 3: Return

```
Situation: Dissatisfied with product after delivery completion

Step 1: Return request
  User: Clicks "Request return" on order detail page
  System: Checks whether it is within 30 days of delivery completion
    ✓ Possible: delivered, completed status
    ✗ Not possible: over 30 days
  User: Selects return reason (e.g., "defective", "delivery damage", "color difference")
  System: Status → "return_requested"
  
Step 2: Return approval
  Admin: Reviews return request
  System: Status → "return_approved"
  System: Provides return shipping address
  
Step 3: Return shipping
  User: Ships product to return address
  Carrier: Return pickup → warehouse arrival
  System: Status → "return_in_transit" → "return_completed"
  
Step 4: Refund
  Admin: Confirms receipt of return
  System: Status → "refunded"
  System: Full refund of payment amount
  User: Confirms refund (1–3 days)
```

**Estimated time:** 1–2 weeks from request to refund

---

### Scenario 4: Delivery Failure

```
Situation: Returned during delivery (unclear address, refused receipt, etc.)

Step 1: Delivery failure detected
  Carrier: Notifies delivery not possible
  System: Receives status from carrier API → "failed"
  
Step 2: Contact user
  System: Sends "delivery failure" notification
  User: Chooses to change shipping address or refund
  
Step 3-A: Re-delivery (user choice)
  User: Enters correct address
  System: Registers re-delivery address
  Carrier: Starts delivery again
  
Step 3-B: Refund (user choice)
  System: Status → "canceled"
  System: Processes refund
```

---

## 7️⃣ Constraints

| Item | Constraint | Reason |
|------|------|------|
| **Maximum order items** | 100 | DB performance, delivery management convenience |
| **Minimum order amount** | None | Accept all orders |
| **Maximum order amount** | None | No limit |
| **Payment timeout** | 30 minutes | Reserve stock, prevent spam |
| **Refund window** | 30 days after delivery completion | Industry standard |
| **Shipping addresses** | 1 per order | Simplicity |
| **Carriers** | No limit | User choice |
| **Estimated delivery days** | 2–7 days | Domestic basis |
| **Image size** | Max 10MB/file | Storage management |
| **Max product images** | 10 per product | DB efficiency |
| **Max member addresses** | No limit | Convenience |
| **Concurrent orders** | 1 per user / 30 sec | Prevent spam |

---

## ✅ Checklist (items to confirm when loading this Core)

- [ ] 9 base DB tables created
- [ ] 30+ API endpoints implemented
- [ ] Order status transition logic implemented
  - pending_payment → payment_confirmed → shipping_ready → in_transit → delivered → completed
  - canceled path implemented
  - return path implemented
- [ ] PG integration (payment, refund)
- [ ] Carrier API integration (delivery status update)
- [ ] Prohibitions confirmed (no multi-currency, etc.)
- [ ] Shipping fee calculation logic implemented
- [ ] Inventory management logic implemented
- [ ] Email notifications implemented (order, delivery, refund)

---

**Final verification:** Loading this Core defines all the minimum required features of a B2C shopping mall. Additional features (marketing, recommendations, live commerce, etc.) are defined in separate Cores or extension modules.
