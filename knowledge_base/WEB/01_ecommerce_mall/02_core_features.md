# E-Commerce Mall - Core Features

## 1. Product Management Features

### 1.1 Product Registration/Edit/Delete
```
Seller:
- Enter product name, description, price, stock
- Upload images (thumbnail, detail images)
- Select category
- Add tags (search optimization)
- Shipping info (shipping fee, shipping method)
- Manage SKU (Stock Keeping Unit)
- Edit product (possible even while on sale)
- Delete product (discontinue sale)

Admin:
- Full product management permission
- Force-delete product
- Change product status (on sale / out of stock / discontinued)
```

### 1.2 Inventory Management
```
- Real-time stock quantity updates
- Out-of-stock notification (customer, seller)
- Automatic product status change (stock 0 → out of stock)
- Seller stock alert (when stock is low)
- Stock reservation (when order is created)
- Stock restoration when order is cancelled
```

### 1.3 Product Search and Filtering
```
Search methods:
- Keyword search (product name, description, tags)
- Category search
- Advanced search (price range, rating, shipping method)

Filtering:
- Price range (lowest~highest)
- Rating (3 stars and up, 5 stars, etc.)
- Shipping method (free shipping, fast shipping, direct delivery)
- New arrivals (last 7 days, 30 days)
- Popularity (sales volume, views)
- Discount rate
- Seller rating
```

### 1.4 Product Detail Page
```
Displayed information:
- Product images (gallery, zoom)
- Product name, description, detailed description
- Price (list price, discounted price, discount rate)
- Stock status
- Shipping info (shipping fee, estimated delivery date)
- Seller info (name, rating, product count)
- Review summary (average rating, review count)
- Option selection (color, size, etc.)
- Quantity selection
- Add to cart, buy now, wishlist buttons
- Q&A section
- Review section
```

---

## 2. Cart Features

### 2.1 Cart Management
```
- Add product (specify quantity)
- Change quantity
- Delete product
- Delete multiple selected products
- Save cart (restore after login)
- Share cart (with other users)
- Wishlist feature (saved list)
```

### 2.2 Cart Calculation
```
- Calculate subtotal of selected products
- Calculate shipping fee (by condition)
- Calculate discount amount
- Apply points
- Display final amount
- Display amount to be paid
```

### 2.3 Cart Persistence
```
- Session-based temporary storage
- Sync after login
- Validity check (product exists, stock confirmed)
- Price change detection (when product price is edited)
- Out-of-stock product warning
```

---

## 3. Order Features

### 3.1 Order Creation
```
Steps:
1. Click 'Order' from cart
2. Select/change delivery address
3. Select shipping method
4. Final confirmation (quantity, price, delivery address)
5. Create order

Order information saved:
- Generate order ID
- Save order items (product, quantity, unit price)
- Save delivery address info
- Order status = 'Awaiting payment'
```

### 3.2 Payment
```
Payment method selection:
- Credit card
- Bank deposit
- Account transfer
- Mobile payment
- Simple payment (PayPal, Apple Pay, etc.)

Payment process:
1. Select payment method
2. Redirect to PG (Payment Gateway)
3. Payment approval/rejection
4. Receive result callback
5. Update database (payment completed/failed)
6. Display result to user
```

### 3.3 Order Lookup
```
Buyer:
- View my order list (filter by status)
- View order details
- Track shipping
- Estimated delivery date

Seller:
- Order list for their own products
- Update order status
- Enter shipping info
```

---

## 4. Shipping Features

### 4.1 Shipping Management
```
Seller:
- Prepare product after confirming order
- Select carrier (courier, postal service, direct delivery)
- Enter tracking number
- Update shipping status (preparing shipment → shipping → delivered)

System:
- Carrier API integration (shipment tracking)
- Calculate estimated delivery date
- Shipping delay notification
```

### 4.2 Shipment Tracking
```
Customer:
- Check shipping status (preparing shipment, shipping, delivered)
- Check estimated delivery date
- Go to carrier site by tracking number
- Receive notification on shipping delay
```

---

## 5. Payment Features

### 5.1 Payment Processing
```
- Processing logic per payment method
- Payment amount validation (order amount == payment amount)
- Prompt retry on payment failure
- Payment cancellation (on order cancellation)
- Refund processing
```

### 5.2 Payment Security
```
- HTTPS communication
- PCI DSS compliance (direct storage of credit cards prohibited)
- Tokenization (token issued by PG)
- Prevent duplicate payments
- Detect anomalous transactions
```

---

## 6. Review and Rating Features

### 6.1 Writing Reviews
```
Conditions:
- Review can be written after delivery is completed
- One person can write multiple reviews per product (per purchase)

Input items:
- Rating (1~5)
- Title
- Content (text)
- Photos (optional, up to 5)
- Private/public selection

System:
- Spam filtering (profanity, duplicates)
- Review approval (admin or automatic)
- Review published
```

### 6.2 Viewing Reviews
```
Product page:
- Display average rating
- Review count by rating (100 at 5 stars, 50 at 4 stars, etc.)
- Review list (newest, popular, by rating)
- Filter for reviews with photos
- Review helpfulness (helpful/not helpful)
```

### 6.3 Review Management
```
Author:
- Edit/delete review (within 30 days after delivery)

Seller:
- Write review replies (respond to customers)

Admin:
- Delete review (inappropriate content)
- Hide review (judged as spam)
```

---

## 7. Return/Refund Features

### 7.1 Return Request
```
Conditions:
- Within 7 (or 30) days after delivery is completed
- Unopened condition (or distinguished by reason)

Request information:
- Return reason (defective product, wrong fit, simple change of mind, etc.)
- Description (additional info)
- Photos (evidence photos)
```

### 7.2 Return Approval/Rejection
```
Seller:
- Review return request
- Approve or reject
- Provide return shipping address
- Return shipping fee responsibility rules

System:
- Return approved → forward shipping address → customer proceeds with return
- Return rejected → forward reason → appeal possible
```

### 7.3 Refund Processing
```
Steps:
1. Seller receives returned product
2. Inspect product (confirm condition)
3. Approve refund
4. Refund via payment method
5. Refund completion notification

Refund amount:
- Product amount (partial or full)
- Shipping fee (seller-paid or customer-paid)
- Refund fee (per policy)
```

---

## 8. Discount/Promotion Features

### 8.1 Discount Methods
```
- List price discount (based on original price)
- Coupon discount (specific amount, percentage)
- Seasonal discount (by period)
- Volume discount (bulk purchase)
- Bundle discount (buying multiple products together)
- New customer discount
- Repeat purchase discount
```

### 8.2 Points System
```
Earning:
- Earn a percentage of purchase amount (e.g., 1% or 2%)
- Additional points for writing reviews
- Login events

Usage:
- Discount with points
- Conversion (cash out)
- Use on other products
```

### 8.3 Promotions/Events
```
- Flash sale (time/quantity limited)
- Bundle event
- New arrival promotion
- Seasonal sale
- Category-specific special prices
```

---

## 9. User Management Features

### 9.1 Sign-up/Login
```
Sign-up:
- Email duplicate check
- Email verification
- Password setup (strength check)
- Terms agreement

Login:
- Email/password authentication
- Auto login (cookie/token)
- Password recovery (email verification)
- SNS login (Google, Facebook, etc.)
```

### 9.2 Profile Management
```
Basic info:
- Name, email, phone number
- Gender, date of birth
- Profile image

Address management:
- Default delivery address
- Save multiple delivery addresses
- Edit/delete address

Settings:
- Notification reception settings
- Personal info public/private
- Account security (2FA, password change)
```

### 9.3 Purchase History
```
- View order list
- View order details
- Track shipping
- Repeat purchase feature
- Manage favorite products
- Search history
```

---

## 10. Seller Features

### 10.1 Seller Dashboard
```
- Sales amount (day/week/month/year)
- Order count
- Refund/return rate
- Customer satisfaction (ratings, reviews)
- Product views
- Sales ranking (by product, by category)
```

### 10.2 Settlement Management
```
- Calculate settlement amount (sales - commission - refunds)
- Settlement cycle (weekly, monthly, etc.)
- View settlement history
- Manage settlement account
- Confirm settlement deposit
```

### 10.3 Customer Management
```
- Customer list (by repeat purchase rate, purchase amount)
- Purchase history per customer
- Customer feedback (reviews, Q&A)
```

---

## 11. Admin Features

### 11.1 Member Management
```
- Full member list
- Member status (active, suspended, withdrawn)
- Force-suspend member
- View member info
- Purchase history per member
```

### 11.2 Content Management
```
- Banner management
- Notice management
- Event management
- Category management
- Recommended product management
```

### 11.3 Policy Management
```
- Shipping fee policy
- Refund policy
- Commission rate setting
- Discount policy
```

### 11.4 Reports/Handling
```
- Handle inappropriate product reports
- Delete inappropriate reviews
- Detect fraudulent transactions
- Dispute mediation (buyer-seller)
```

---

## 12. Notification Features

### 12.1 Notification Types
```
Buyer:
- Shipping status change (preparing, shipping, completed)
- Payment completed/failed
- Return approved/rejected
- Review reply
- Price drop (wishlisted product)
- New arrival in stock (subscribed category)
- Event notification

Seller:
- New order notification
- Return request
- Customer review
- Customer Q&A
```

### 12.2 Notification Delivery Methods
```
- In-app notification
- Push notification (mobile)
- Email notification
- SMS notification (optional)
```

---

## 13. Search and Recommendation Features

### 13.1 Search Optimization
```
- Keyword autocomplete
- Recent searches
- Popular searches
- Search filters (price, rating, shipping)
- Sorting (popularity, newest, price)
```

### 13.2 Recommendation Features
```
- Recommendations based on purchase history
- Category-based recommendations
- Popular product recommendations
- Frequently bought together recommendations
- Personalized recommendations (ML)
```

---

## 14. Security Features

### 14.1 Data Security
```
- Password encryption (hash)
- Encryption of sensitive data
- HTTPS communication
- SQL injection prevention
- XSS prevention
```

### 14.2 Payment Security
```
- Payment amount validation
- PCI DSS compliance
- Tokenization
- 3D Secure (credit card)
```

### 14.3 Account Security
```
- Two-factor authentication (2FA)
- Login attempt limiting
- Password strength check
- Session management
- CSRF prevention
```

---

## 15. Performance Optimization

### 15.1 Caching
```
- Product information caching
- Category caching
- Image caching (CDN)
```

### 15.2 Database Optimization
```
- Indexing (products, orders)
- Query optimization
- Data partitioning (large volumes)
```

### 15.3 Frontend Optimization
```
- Image optimization (compression, WebP)
- Lazy loading
- Bundle optimization
```

---

## 16. Compliance

### 16.1 Privacy Protection
```
- GDPR compliance (EU)
- State privacy policy
- Right to data deletion (Right to Forget)
```

### 16.2 Payment-Related
```
- PCI DSS compliance
- State refund policy
- State cancellation policy
```

### 16.3 Commerce-Related
```
- Product description accuracy
- Price display clarity
- Shipping info statement
- Return policy statement
```

---

## What to Read Next

1. **03_terminology.md** - E-commerce mall term definitions
2. **04_database_schema.md** - Database design
3. **05_api_standard.md** - REST API standard
4. **06_security_requirements.md** - Detailed security requirements
5. **07_spec_template.md** - Specification template
