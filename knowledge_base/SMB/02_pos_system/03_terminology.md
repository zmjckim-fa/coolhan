# POS System - Terminology

## 1. Basic Entity Terms

### Transaction
**Definition:** The entire process of a customer purchasing products
- **Transaction ID:** The unique number of a transaction
- **Receipt Number:** The number printed on the receipt
- **Transaction Amount:** The total amount of the transaction
- **Transaction Time:** The time the transaction occurred
- **Transaction Status:** Completed, cancelled, returned, etc.
- **Cashier:** The staff member who processed the transaction
- **Register/Terminal:** The register number where the transaction was processed

### Product
**Definition:** An individual item being sold
- **Product Code:** The unique number of the product
- **Barcode:** The standard barcode of the product
- **Product Name:** The name used when selling
- **Category:** The classification of the product
- **Selling Price:** The price the customer pays
- **Cost Price:** The cost of purchasing the product
- **Margin:** Selling price - cost price
- **Margin Rate:** Margin / selling price × 100%

### Inventory
**Definition:** The quantity of products not yet sold
- **Current Stock:** The quantity on hand now
- **Beginning Inventory:** Inventory at the start of the period
- **Ending Inventory:** Inventory at the end of the period
- **Minimum Stock:** The quantity that triggers reordering
- **Out of Stock:** A state where stock is 0
- **Overstock:** Stock exceeds the maximum quantity

### Transaction Item
**Definition:** An individual product included in a transaction
- **Quantity:** The number of products purchased
- **Unit Price:** The price of one product (at the time of transaction)
- **Subtotal:** Quantity × unit price
- **Discount Amount:** The discount amount applied
- **Tax:** The tax amount for that item
- **Line Total:** Subtotal - discount + tax

---

## 2. Pricing Terms

### Basic Pricing
- **Regular Price:** The original price before discount
- **Discounted Price:** The price after applying a discount
- **Discount Amount:** The amount deducted by the discount
- **Discount Rate:** The percentage of the discount (%)
- **Pre-tax Price:** Price excluding tax
- **Post-tax Price:** Price including tax

### Transaction Amounts
- **Subtotal:** The sum of selling prices of all items
- **Total Discount:** The sum of discount amounts of all items
- **Total Tax:** The sum of tax amounts of all items
- **Final Amount:** Subtotal - discount + tax
- **Payment Amount:** The amount the customer paid
- **Change:** Payment amount - final amount

### Discount Types
- **Fixed Discount:** A discount of a fixed amount
- **Percentage Discount:** A discount of a fixed percentage
- **Conditional Discount:** A discount when a specific condition is met
- **Member Discount:** A discount based on member tier
- **Product Discount:** A special price for a specific product
- **Promotional Discount:** A temporary discount event
- **Volume Discount:** A discount based on purchase quantity

---

## 3. Payment Terms

### Payment Methods
- **Payment Method:** The type of payment method
- **Cash:** Payment with bills and coins
- **Credit Card:** Credit-based card payment
- **Debit Card:** A direct-debit account card
- **Gift Card:** A prepaid card
- **Mobile Payment:** Payment by mobile phone
- **Points:** Use of accumulated points

### Payment Processing
- **PG (Payment Gateway):** A service that intermediates payments
- **Transaction ID:** The transaction number issued by the PG
- **Approval Number:** The card payment approval number
- **Payment Approval:** Approval of a payment transaction
- **Payment Declined:** Rejection of a payment transaction
- **Payment Pending:** Payment is being processed

### Cash Transactions
- **Change:** The amount exceeding the payment
- **Change Calculation:** Calculating the change amount
- **Banknote:** A cash bill
- **Coin:** A cash coin
- **Float (starting amount):** The amount prepared in the register at the start of business

---

## 4. Return/Refund Terms

### Return-Related
- **Return:** Bringing back a purchased product
- **Return Request:** Expressing intent to return
- **Return Approval:** Permitting a return
- **Return Rejection:** Refusing a return
- **Return Reason:** The reason for returning
- **Return Rate:** Returned transactions / total transactions ratio

### Refund-Related
- **Refund:** Returning the paid amount
- **Refund Amount:** The amount to be returned
- **Refund Status:** The refund processing stage
- **Refund Pending:** Refund is being processed
- **Refund Completed:** Refund processing is complete

---

## 5. Tax Terms

### Tax Basics
- **Tax Rate:** The percentage of tax (%)
- **Tax Amount:** The actual tax amount
- **Pre-tax:** Before adding tax
- **Post-tax:** After adding tax
- **Tax Exempt:** No tax
- **Tax Included:** Tax is included
- **Tax Separate:** Tax is excluded

### Tax Reconciliation
- **Tax Total:** The total tax amount of a transaction
- **Tax by Rate:** Tax classified by tax rate
- **Tax Filing:** Reporting to the tax authority

---

## 6. Inventory Terms

### Inventory Changes
- **Sale:** Stock decrease due to product sale
- **Inbound:** Stock increase due to purchasing new products
- **Return:** Stock increase due to receiving returned products
- **Loss:** Stock decrease due to theft, damage, etc.
- **Disposal:** Stock decrease due to discarding defective products
- **Adjustment:** Inventory correction and adjustment

### Inventory Tracking
- **Inventory Tracking:** Recording inventory changes
- **Inventory Match:** System inventory = actual inventory
- **Inventory Discrepancy:** System inventory ≠ actual inventory
- **Physical Inventory:** Confirming actual inventory

---

## 7. End-of-Day/Reconciliation Terms

### End of Day
- **End of Day:** Reconciliation at the close of business
- **Closing Time:** The time of reconciliation
- **Closing Report:** The result of daily reconciliation
- **Transaction Close:** The end of transaction processing

### Reconciliation-Related
- **Settlement:** Confirming amounts and settling balances
- **Settlement Amount:** The amount to be settled
- **Settlement Discrepancy:** An amount difference
- **Settlement Complete:** Settlement is finished

### Total Calculation
- **Total Sales:** Total daily sales
- **Total Refunds:** Total daily refunds
- **Net Sales:** Total sales - total refunds
- **Transaction Count:** The number of daily transactions
- **Average Transaction:** The average amount per transaction

---

## 8. User Terms

### Roles
- **Cashier:** The staff member who processes transactions
- **Manager:** The person who manages the store
- **Admin:** The person who administers the system
- **Member:** A registered customer

### Permissions
- **Permission:** The right to execute a function
- **Role:** A user's set of roles and permissions
- **Login:** System access authentication
- **Logout:** Ending system access

---

## 9. Reporting Terms

### Dashboard
- **Live Sales:** The current sales progress
- **Revenue:** The amount earned from sales
- **Transaction Count:** The number of transactions
- **Product Sales:** The sales status by product

### Reports
- **Daily Report:** The daily reconciliation result
- **Weekly Report:** The weekly sales status
- **Monthly Report:** The monthly sales status
- **Cashier Report:** Performance by cashier
- **Product Report:** Sales volume by product
- **Category Report:** Sales by category

### Analysis Metrics
- **Sales Amount:** The product sales amount
- **Sales Count:** The number of sales transactions
- **Refund Amount:** The refunded amount
- **Refund Count:** The number of refund transactions
- **Profit Margin:** Selling price - cost price
- **Turnover Rate:** How fast inventory sells

---

## 10. System Terms

### Operations
- **Online:** The system is operating
- **Offline:** The system is not operating (local mode)
- **Synchronization:** Matching server and local data
- **Backup:** Creating a copy of data

### Security
- **Log:** A record of system activity
- **Audit Trail:** An audit tracking record
- **Authorization:** Confirming whether permission exists
- **Encryption:** Encrypting data

---

## 11. Abbreviations

| Abbreviation | Definition | Description |
|------|------|------|
| POS | Point of Sale | Point of sale system |
| PG | Payment Gateway | Payment intermediary service |
| SKU | Stock Keeping Unit | Unique product number |
| ATV | Average Transaction Value | Average transaction value |
| RMA | Return Merchandise Authorization | Return authorization number |
| GST | Goods and Services Tax | Goods and services tax |
| VAT | Value Added Tax | Value added tax |
| EFT | Electronic Funds Transfer | Electronic funds transfer |
| EMV | Europay, Mastercard, Visa | Card chip standard |
| PIN | Personal Identification Number | Personal identification number |

---

## 12. Scenario Examples of Term Usage

### Example 1: Regular Transaction
```
Cashier: "Starting the transaction"
Customer: [presents product]
Cashier: [scans barcode] "Product name: OOO, Selling price: 10,000 KRW"
Customer: "I'm a member"
Cashier: [member discount applied automatically] "10% member discount applied. Final amount: 9,900 KRW"
Customer: [presents credit card]
Cashier: [card payment] "Payment complete. Transaction number: ABC123"
Cashier: "Here's your receipt. Thank you"
```

### Example 2: Return Transaction
```
Customer: "I'd like to return this product"
Cashier: "Do you have the receipt?"
Customer: [presents receipt]
Cashier: [looks up transaction] "Got it. The refund amount is 9,900 KRW"
Customer: "Please refund in cash"
Cashier: [processes cash refund] "The return is complete"
```

### Example 3: End of Day
```
Manager: "I'll start the closing"
System: [calculates transaction totals]
- Total sales: 500,000 KRW
- Total refunds: 50,000 KRW
- Net sales: 450,000 KRW
- Transaction count: 120
- Average transaction: 4,166 KRW

Manager: [cash reconciliation]
- Starting amount: 50,000 KRW
- Cash sales: 200,000 KRW
- Cash refunds: 20,000 KRW
- Expected amount: 230,000 KRW
- Actual amount: 230,000 KRW ✓

System: "End-of-day reconciliation is complete"
```

---

These terms are standard terms commonly used by those involved with the POS system.
