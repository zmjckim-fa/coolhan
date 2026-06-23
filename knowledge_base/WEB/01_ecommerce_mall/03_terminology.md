# E-Commerce Mall - Terminology

## 1. Basic Entity Terms

### Product
**Definition:** An item or service being sold
- **SKU (Stock Keeping Unit):** Unique product number for inventory management
- **Product name:** The name of the product used by buyers when searching
- **Product description:** Detailed information about the product (text, images, video)
- **Price:** The amount the customer must pay
- **List Price:** The originally set price
- **Discounted Price:** The price after applying a discount
- **Discount rate:** (list price - discounted price) / list price × 100%
- **Inventory:** The current quantity of product in stock

### User
**Definition:** A person who uses the system
- **Buyer/Customer:** A person who purchases products
- **Seller/Vendor:** An individual or business that sells products
- **Admin:** A person who operates the platform
- **UID (User ID):** The user's unique number

### Order
**Definition:** A transaction in which a buyer purchases products
- **Order ID:** The unique number of an order
- **Order date:** The date and time the buyer placed the order
- **Order status:** The current stage of the order (awaiting payment, payment completed, shipping, delivered, cancelled, refunded)
- **Order Item:** An individual product included in an order
- **Quantity:** The number of products purchased
- **Unit Price:** The price of one product (at the time of order)
- **Subtotal:** Quantity × unit price

### Payment
**Definition:** The act of paying an amount
- **Payment Method:** The method of payment (credit card, account transfer, bank deposit, etc.)
- **Payment Amount:** The amount paid
- **Payment Status:** The current state of the payment (awaiting payment, payment completed, payment failed, refunded)
- **PG (Payment Gateway):** A service that intermediates payments (credit card, bank deposit, etc.)
- **Transaction ID:** The unique transaction number issued by the PG
- **Approval Number:** The number issued when a payment is approved

### Shipping
**Definition:** The process of delivering ordered products to the customer
- **Delivery Address:** The address where the product will be received
- **Shipping Company:** The business in charge of delivery (courier, postal service, etc.)
- **Tracking Number:** The number used to track shipment
- **Shipping Status:** The current stage of shipment (preparing shipment, shipping, delivered, shipping failed)
- **Shipping Fee:** The cost of shipping
- **Estimated Delivery Date:** The expected date the product will arrive
- **Free Shipping:** No shipping fee charged

### Cart
**Definition:** A space to temporarily hold products before purchase
- **Cart quantity:** The number of products placed in the cart
- **Cart Total:** The total amount of products placed in the cart

### Review
**Definition:** An evaluation and opinion left by a customer who purchased a product
- **Rating:** A score for a product (typically 1~5)
- **Average Rating:** The average score of all reviews
- **Review Title:** A brief title of the review
- **Review Content:** The detailed content of the review
- **Helpfulness:** The degree to which other customers rated a review as helpful
- **Moderation:** The process of checking whether a review is appropriate

### Return/Refund
**Definition:** The process of returning a purchased product and getting the amount back
- **Return:** Returning a purchased product to the seller
- **Refund:** Getting the paid amount back
- **Return Reason:** The reason for returning
- **Return Request:** The customer expresses intent to return
- **Return Approval:** The seller permits the return
- **Refund Amount:** The amount to be returned
- **Refund Status:** The current stage of the refund (requested, approved, rejected, completed)

---

## 2. Financial Terms

### Price-Related
- **Cost:** The seller's purchase price of the product
- **List Price:** The set standard price
- **Discount:** Lowering below the original price
- **Discount Rate:** The percentage of the discount (%)
- **Margin:** The profit from subtracting cost from list price
- **Margin Rate:** The percentage of margin

### Order Amounts
- **Product Amount:** The sum of product prices
- **Shipping Fee:** The shipping cost
- **Discount Amount:** The discount amount
- **Points Used:** The amount deducted with points
- **Final Payment Amount:** The amount actually to be paid
- **Total Amount:** The sum of all costs

### Settlement
- **Settlement Amount:** The amount the seller will receive
- **Commission Fee:** The fee the platform takes
- **Commission Rate:** The percentage of the fee (%) (typically 5~15%)
- **Settlement Cycle:** The period over which settlement occurs (weekly, monthly, etc.)
- **Settlement Account:** The bank account to receive settlement funds

### Points/Mileage
- **Points:** A virtual asset earned through purchase or activity
- **Points Earned:** Gaining points
- **Points Used:** Using points for a discount
- **Points Redemption:** Converting points to cash
- **Points Rate:** What percentage of the purchase amount is given as points

---

## 3. State and Process Terms

### Order Lifecycle
```
Pending Payment
├─ Payment Completed
│  ├─ Preparing Shipment
│  ├─ Shipping
│  └─ Delivered
│     ├─ Return Requested
│     │  ├─ Return Approved
│     │  │  └─ Refund Completed
│     │  └─ Return Rejected
│     └─ Review can be written
└─ Order Cancelled
   └─ Refunding/Refunded
```

### Product Status
- **Active:** Selling normally
- **Out of Stock:** Cannot be ordered due to no inventory (product is still shown)
- **Discontinued:** The seller stopped selling (product not shown)
- **Deleted:** Force-deleted by admin (no longer viewable)

---

## 4. Business Terms

### Sales Metrics
- **Revenue:** The amount earned from product sales
- **Order Count:** The number of orders placed
- **AOV (Average Order Value):** The average amount per order
- **Customer Count:** The number of customers who purchased
- **Conversion Rate:** (number of customers who purchased / number of visitors) × 100%
- **Revisit Rate:** The proportion of customers who visited again
- **Repeat Purchase Rate:** The proportion of customers who purchased again

### Customer Analysis
- **DAU (Daily Active Users):** The number of users active in a day
- **MAU (Monthly Active Users):** The number of users active in a month
- **CAC (Customer Acquisition Cost):** The cost to acquire one customer
- **LTV (Life Time Value):** The revenue a customer brings over their lifetime
- **RFM (Recency, Frequency, Monetary):**
  - Recency: Most recent purchase date
  - Frequency: Number of purchases
  - Monetary: Purchase amount
  - Used for customer segmentation

### Quality Metrics
- **Customer Satisfaction:** The degree of customer satisfaction
- **NPS (Net Promoter Score):** The likelihood that a customer will recommend
- **Return Rate:** The proportion of returns made
- **Exchange Rate:** The proportion of exchanges made
- **Cancellation Rate:** The proportion of orders cancelled
- **Claim:** A customer's complaint or problem report

---

## 5. Marketing Terms

### Promotion
- **Discount:** Lowering the price
- **Coupon:** The right to receive a discount under certain conditions
- **Bundle:** Selling multiple products together
- **Flash Sale:** Selling with a time/quantity limit
- **Category Sale:** Special prices for a specific category

### Advertising
- **Banner:** An advertising image
- **Promotion banner:** A banner that announces a promotion
- **CPA (Cost Per Action):** The cost paid per click

---

## 6. Technical Terms

### Database
- **Table:** A structure organizing data into rows and columns
- **Schema:** The design blueprint of a database structure
- **Indexing:** Creating an index for fast searching
- **Query:** A command requesting information from a database

### API
- **REST API:** An API using standard HTTP methods (GET, POST, PUT, DELETE)
- **Endpoint:** The address to access a specific function of an API
- **Request:** The data the client sends to the server
- **Response:** The data the server sends to the client
- **Error Code:** A number indicating a problem situation
  - 2xx: Success
  - 4xx: Client error
  - 5xx: Server error

### Security
- **Hash:** A method of encrypting passwords
- **Token:** A string for user authentication
- **HTTPS:** Encrypted communication
- **SSL/TLS:** Encryption protocol
- **2FA (Two-Factor Authentication):** Two-factor authentication
- **CSRF (Cross-Site Request Forgery):** A cross-site request forgery attack
- **XSS (Cross-Site Scripting):** A malicious script execution attack

---

## 7. Operations Terms

### Shipping-Related
- **Estimated delivery date:** The expected date the product will arrive
- **Shipment tracking:** Tracking the shipping status
- **Carrier API:** The interface for retrieving shipping information from the carrier

### Customer Service
- **Q&A (Question & Answer):** A space where customers ask questions about products
- **Chat consultation:** Customer support via real-time chat
- **Email support:** Handling customer inquiries via email
- **Call center:** Customer support via phone

### Management
- **Content Moderation:** Reviewing and removing inappropriate content
- **Report:** Reporting an inappropriate product or review
- **Restriction:** A constraint on a user or product
- **Force Delete:** An admin forcibly deleting

---

## 8. Abbreviations

| Abbreviation | Definition | Description |
|------|------|------|
| SKU | Stock Keeping Unit | Unique product number |
| PG | Payment Gateway | Payment service |
| AOV | Average Order Value | Average order value |
| CAC | Customer Acquisition Cost | Customer acquisition cost |
| LTV | Life Time Value | Customer lifetime value |
| DAU | Daily Active Users | Daily active users |
| MAU | Monthly Active Users | Monthly active users |
| NPS | Net Promoter Score | Net promoter score |
| RFM | Recency, Frequency, Monetary | Customer analysis metric |
| API | Application Programming Interface | Application programming interface |
| REST | Representational State Transfer | Web API standard |
| HTTPS | Hypertext Transfer Protocol Secure | Secure communication protocol |
| SSL | Secure Sockets Layer | Security protocol |
| TLS | Transport Layer Security | Security protocol |
| 2FA | Two-Factor Authentication | Two-factor authentication |
| CSRF | Cross-Site Request Forgery | Cross-site request forgery |
| XSS | Cross-Site Scripting | Cross-site scripting |
| PCI DSS | Payment Card Industry Data Security Standard | Payment card industry security standard |
| GDPR | General Data Protection Regulation | General data protection regulation |
| UID | User ID | Unique user number |
| FAQ | Frequently Asked Questions | Frequently asked questions |

---

## What to Read Next

1. **04_database_schema.md** - Database design
2. **05_api_standard.md** - API standard
3. **06_security_requirements.md** - Security requirements
4. **07_spec_template.md** - Specification template
