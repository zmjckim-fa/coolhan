# E-Commerce Mall - Basic Logic

## 1. System Overview

An e-commerce mall is an **online platform for selling products**.

### Basic Flow
```
Product registration → Product search/browse → Add to cart → Order → Payment → Shipping → Receipt → Review/Return
```

---

## 2. Core Entities

### 2.1 Product
```
Product = item being sold
- Product ID
- Product name
- Description
- Price
- Stock quantity
- Image
- Category
- Status (on sale / out of stock / discontinued)
```

### 2.2 User
```
Buyer or seller
- User ID
- Email
- Password
- Name
- Phone number
- Address
- Sign-up date
- Type (buyer / seller / admin)
```

### 2.3 Order
```
Purchase transaction
- Order ID
- Buyer ID
- Order date/time
- Status (awaiting payment / payment completed / shipping / delivered / cancelled)
- Total amount
- Delivery address
```

### 2.4 OrderItem
```
Product included in an order
- Item ID
- Order ID
- Product ID
- Quantity
- Unit price
- Subtotal
```

### 2.5 Payment
```
Payment record
- Payment ID
- Order ID
- Payment method (credit card / bank transfer / account transfer / mobile)
- Amount
- Status (awaiting payment / payment completed / payment failed / refunded)
- Payment date/time
```

### 2.6 Shipping
```
Shipping information
- Shipping ID
- Order ID
- Carrier (courier / postal service / direct delivery)
- Tracking number
- Status (preparing shipment / shipping / delivered)
- Estimated delivery date
```

### 2.7 Cart
```
Temporary purchase list
- Cart ID
- User ID
- Product ID
- Quantity
- Added date/time
```

### 2.8 Review
```
Product rating
- Review ID
- Product ID
- Buyer ID
- Rating (1~5)
- Title
- Content
- Created date
```

### 2.9 Return/Refund
```
Product return request
- Return ID
- Order ID
- Return reason
- Status (return requested / return approved / return rejected / refund completed)
- Request date
- Return date
- Refund amount
```

---

## 3. Core Processes

### 3.1 Product Management Flow
```
Seller
├─ Register product (name, price, image, description)
├─ Edit product
├─ Delete or discontinue product
├─ Manage inventory (update quantity)
└─ View sales statistics
```

### 3.2 Product Search/Browse Flow
```
Buyer
├─ Browse categories
├─ Keyword search
├─ Filter products (price, rating, new arrivals)
├─ View product detail page
├─ Check reviews/ratings
└─ Compare with other products
```

### 3.3 Cart Flow
```
Buyer
├─ Add product to cart
├─ Change cart quantity
├─ Remove product from cart
├─ View cart (calculate total)
└─ Cart → proceed to order
```

### 3.4 Order Flow
```
1. Create order (cart → order)
2. Enter delivery address
3. Select shipping method
4. Confirm final amount
5. Confirm order
```

### 3.5 Payment Flow
```
1. Select payment method (credit card / account transfer, etc.)
2. Proceed with payment
3. PG (payment gateway) integration
4. Payment approval/failure response
5. Payment completed → order confirmed
```

### 3.6 Shipping Flow
```
1. Payment completed → preparing shipment status
2. Seller prepares product
3. Hand over to carrier (shipping status)
4. Customer receives (delivered status)
5. Provide shipment tracking number
```

### 3.7 Return/Refund Flow
```
1. Customer requests return
2. Seller approves/rejects return
3. Customer ships the return
4. Seller receives the returned product
5. Process refund
6. Refund completed
```

### 3.8 Review Flow
```
1. Review can be written after delivery is completed
2. Rating (1~5) + title + content
3. Review approval (spam/profanity filtering)
4. Review published
5. Other buyers reference the review
```

---

## 4. User Types and Permissions

### 4.1 Buyer
**Permissions:**
- Search/browse products ✓
- Add to cart ✓
- Place orders ✓
- View orders ✓
- Track shipping ✓
- Write reviews ✓
- Request returns ✓
- Manage profile ✓

**Prohibited:**
- Register products ✗
- Access other users' information ✗
- Force-process returns ✗

### 4.2 Seller
**Permissions:**
- Register/edit/delete products ✓
- Manage only their own products ✓
- View orders (their own products) ✓
- Update shipping status ✓
- Approve/reject returns ✓
- View sales statistics ✓
- View settlements ✓

**Prohibited:**
- Manage other sellers' products ✗
- Force refunds ✗
- Access other users' information ✗

### 4.3 Admin
**Permissions:**
- Manage all products ✓
- Manage all users ✓
- View all orders ✓
- Force-process returns ✓
- Force-process refunds ✓
- View statistics/reports ✓
- Suspend users ✓
- Force-delete products ✓

---

## 5. State Management

### 5.1 Order State Flow
```
Awaiting payment
  ↓ (user pays)
Payment completed
  ↓ (seller prepares)
Shipping
  ↓ (customer receives)
Delivered
  ↓ (customer request) or
Cancelled (possible only before payment)
```

### 5.2 Payment States
```
Awaiting payment → Payment completed (or payment failed)
Payment completed → Refund possible
```

### 5.3 Product States
```
On sale (selling normally)
Out of stock (no inventory, still visible)
Discontinued (seller stopped selling, hidden)
Deleted (force-deleted by admin)
```

### 5.4 Shipping States
```
Preparing shipment → Shipping → Delivered
                              or → Shipping failed
```

---

## 6. Key Calculation Logic

### 6.1 Cart Total
```
Cart total = Σ(product price × quantity)
```

### 6.2 Order Final Amount
```
Final amount = product amount + shipping fee - discount amount
```

### 6.3 Shipping Fee
```
Free shipping condition: order amount ≥ minimum amount (e.g., 30,000 KRW)
Otherwise: flat shipping fee (e.g., 3,000 KRW)
Or differentiated shipping by region
```

### 6.4 Points/Discount
```
Earn points as a percentage of the purchase amount
Points can be used for discounts
```

### 6.5 Settlement
```
Seller settlement amount = Σ(sales amount) - commission - return refund amount
Commission rate = varies by sales category (typically 5~15%)
```

---

## 7. Security Considerations

### 7.1 Payment Security
- Direct storage of credit cards prohibited via PG (Payment Gateway) integration
- SSL/HTTPS required
- PCI DSS compliance

### 7.2 User Data Security
- Store passwords encrypted
- Encrypt personal information
- Access control (users access only their own information)

### 7.3 Order/Payment Security
- Prevent order tampering
- Validate payment amount
- Double check (client + server)

### 7.4 Fraud Prevention
- Prevent duplicate payments
- Detect abnormal orders
- IP/device authentication

---

## 8. Domain Language

| Term | Definition |
|------|------|
| SKU | Stock Keeping Unit (unique product number) |
| PG | Payment Gateway (payment intermediary service) |
| Settlement | Paying out revenue to the seller |
| ROI | Return On Investment |
| DAU | Daily Active Users |
| Conversion rate | (number of buyers / number of visitors) × 100% |
| CPA | Cost Per Acquisition |
| AOV | Average Order Value |
| RFM | Recency, Frequency, Monetary (customer analysis) |

---

## 9. Key KPIs (Key Performance Indicators)

```
1. Sales amount
2. Order count
3. Visitor count
4. Conversion rate (visit → purchase)
5. Customer satisfaction (average rating)
6. Return rate
7. Average order value (AOV)
8. Customer revisit rate
9. Sales by category
10. Sales patterns by time of day / day of week
```

---

## 10. Exception Handling

### 10.1 Payment Failure
```
Payment failure → notify user → retry payment or cancel order
```

### 10.2 Shipping Delay
```
Estimated delivery date exceeded → automatic notification → customer compensation (points/discount)
```

### 10.3 Product Quality Issue
```
Customer requests return → seller approves → process refund
or process exchange
```

### 10.4 Seller Closure
```
Seller withdrawal → in-progress orders handled by admin
Negative settlement is recovered
```

### 10.5 System Error
```
Server down during payment → roll back transaction
Data corruption → restore from backup
```

---

## 11. Basic System Architecture

```
┌─────────────────────────────────────────┐
│        Frontend (web/mobile)            │
│  Product search, orders, my page        │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│        Backend API Server               │
│  Product management, order processing,  │
│  payment                                │
└──────────────────┬──────────────────────┘
                   │
        ┌──────────┼──────────┬──────────┐
        │          │          │          │
        ▼          ▼          ▼          ▼
    ┌────────┐┌────────┐┌────────┐┌────────┐
    │  DB   ││  Cache ││ File   ││ Queue  │
    │(order)││(product)││(image)││(notify)│
    └────────┘└────────┘└────────┘└────────┘
        │
        ▼
┌─────────────────────────────────────────┐
│      External Services                  │
│  PG(payment), SMS(notify), shipping(track)│
└─────────────────────────────────────────┘
```

---

## 12. What to Read Next

1. **core_features.md** - Detailed feature list
2. **terminology.md** - Complete definitions of domain terms
3. **database_schema.md** - DB design
4. **api_standard.md** - API specification standard
5. **security_requirements.md** - Security requirements
6. **spec_template.md** - Specification template
