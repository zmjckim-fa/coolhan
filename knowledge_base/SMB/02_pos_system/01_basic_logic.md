# POS System - Basic Logic

## Overview

A POS (Point of Sale) system is the core operational system that processes customer transactions at retail stores. It manages sales records, inventory, payment processing, and reporting in an integrated manner.

---

## 1. Core Concepts

### 1.1 Transaction
```
Transaction = the entire process of a customer purchasing products

Components:
- Transaction ID: the unique number of each transaction
- Transaction date/time: the time the transaction occurred
- Store: which store it occurred at
- Register: which register it occurred at
- Cashier: who processed it
- Transaction items: the list of purchased products
- Total amount: the amount to be paid
- Payment method: cash, card, other
- Transaction status: completed, cancelled, returned, etc.
```

### 1.2 Product
```
Product = an individual item sold at the store

Attributes:
- Product code: the unique number of the product (barcode)
- Product name: the name shown when selling
- Selling price: the price the customer pays
- Cost price: the cost of purchasing the product
- Classification: category (apparel, food, etc.)
- Stock: the current quantity on hand
- Tax rate: the tax rate to apply
```

### 1.3 Inventory
```
Inventory = the quantity of products on hand at the store

State changes:
In → Sale → Current → Return

Key calculation:
- Beginning inventory
- + Inbound
- - Sales
- - Loss/disposal
- + Returns
= Current inventory
```

### 1.4 Cashier
```
Cashier = the staff member who processes transactions

Roles:
- Scan products
- Verify prices
- Process payment
- Calculate change
- Issue receipt
- Record transaction
```

---

## 2. Key Processes

### 2.1 Sales Transaction Process

```
Step 1: Start transaction
  ├─ Generate transaction ID
  ├─ Record cashier ID
  └─ Record transaction start time

Step 2: Enter products
  ├─ Scan barcode (or manual entry)
  ├─ Look up product info
  │  ├─ Product name
  │  ├─ Unit price
  │  ├─ Tax rate
  │  └─ Current price (whether a discount applies)
  ├─ Enter quantity
  ├─ Check stock
  │  ├─ Sufficient stock? → proceed
  │  └─ Insufficient stock? → show warning
  └─ Add item

Step 3: Apply discounts/promotions (optional)
  ├─ Member discount
  ├─ Product discount
  ├─ Coupon discount
  └─ Volume discount

Step 4: Process payment
  ├─ Calculate subtotal
  │  └─ Sum of all item prices
  ├─ Calculate tax
  │  └─ Sum of tax per product
  ├─ Calculate final amount
  │  └─ Subtotal + tax - discount
  ├─ Select payment method
  │  ├─ Cash
  │  ├─ Card (credit/debit)
  │  ├─ Other (check, gift card, etc.)
  │  └─ Split payment (cash + card)
  └─ Confirm payment completion

Step 5: Change/receipt
  ├─ For cash payment:
  │  ├─ Calculate change
  │  └─ Dispense change
  ├─ Generate receipt
  │  ├─ Transaction number
  │  ├─ Date/time
  │  ├─ Item list
  │  ├─ Total amount
  │  ├─ Payment method
  │  └─ Cashier signature (optional)
  └─ Print receipt

Step 6: Update inventory
  ├─ Decrease stock for each sold product
  ├─ Check stock threshold
  │  └─ Notify reorder when stock is low
  └─ Record inventory log

Step 7: Close transaction
  ├─ Transaction status: change to "completed"
  ├─ Save transaction record
  └─ Prepare for next transaction
```

### 2.2 Return/Refund Process

```
Return request
├─ Select return receipt
├─ Select items to return
├─ Enter return reason
├─ Approve return
│  ├─ Calculate refund amount
│  └─ Determine refund method (cash/card)
└─ Process refund
   ├─ Cash return
   ├─ Card refund request
   └─ Inventory restoration
      └─ Increase quantity of returned product
```

### 2.3 End of Day Reconciliation

```
1. Calculate transaction totals
   ├─ Total sales
   ├─ Total refunds
   ├─ Net sales
   └─ Transaction count

2. Totals by payment method
   ├─ Cash sales
   ├─ Card sales
   ├─ Other sales
   └─ Transaction count for each

3. Tax reconciliation
   ├─ Sales by tax
   ├─ Total tax
   └─ Data for tax filing

4. Inventory check
   ├─ Beginning inventory
   ├─ + Inbound
   ├─ - Sales
   ├─ + Returns
   └─ = Ending inventory

5. Cash reconciliation
   ├─ Float (register starting amount)
   ├─ + Sales proceeds
   ├─ - Refunds
   ├─ - Expenses (vouchers, other)
   └─ = Expected final amount

   Compare: actual cash vs expected amount
   → Investigate if there is a discrepancy

6. Generate reports
   ├─ Daily sales report
   ├─ Performance by cashier
   ├─ Sales volume by product
   ├─ Sales by department
   └─ Cash transaction report
```

---

## 3. Core Data Flows

### 3.1 Price Determination Logic

```
Base selling price → apply discount → apply tax → final price

Details:
1. Check the product's base selling price
2. Apply discounts (priority)
   ├─ Member discount (5-20%)
   ├─ Product discount (set discounted price)
   ├─ Promotional discount (time-limited)
   ├─ Coupon discount (amount or percentage)
   └─ Volume discount (3 or more purchased, etc.)
3. Price after discount = base price - discount amount
4. Tax calculation = price after discount × tax rate
5. Final price = price after discount + tax
```

### 3.2 Inventory Tracking Logic

```
For every transaction:
1. Scan product
2. Check current stock (real-time)
3. Requested quantity <= current stock?
   └─ YES: continue
   └─ NO: show warning
4. After transaction completes
   └─ Stock = stock - quantity sold

On return:
1. Enter return quantity
2. Stock = stock + return quantity

Stock warnings:
- Below minimum stock quantity → reorder needed notification
- About to reach 0 → show "out of stock"
```

### 3.3 Payment Validation Logic

```
Pre-payment validation:
1. Is transaction amount > 0?
   └─ NO: transaction not allowed
2. Are all item prices valid?
   └─ NO: price check needed
3. Is the customer a member?
   └─ YES: apply member benefits
4. Is the coupon/discount code valid?
   └─ NO: remove discount

Post-payment validation:
1. Payment amount >= transaction amount?
   └─ NO: insufficient amount
   └─ YES: proceed
2. Is the payment approved?
   └─ Card: confirm PG approval
   └─ Cash: confirm change
```

---

## 4. System States

### 4.1 Store States

```
Open Preparation
  ├─ Initialize register
  ├─ Set starting amount (Float)
  └─ Load product master

Operating
  ├─ Processing transactions
  ├─ Real-time inventory management
  └─ Continuous monitoring

Closing
  ├─ Process last transaction
  ├─ Run end-of-day reconciliation
  └─ Reconcile data

Closed
  ├─ Restricted access
  ├─ No modifications
  └─ Prepare for next day's opening
```

### 4.2 Transaction States

```
Created
  ↓
Active - products can be added
  ↓
Processing Payment
  ↓
Completed - record retained
  ↑
Cancelled - in case of return

or

Completed
  ↓
Partial Return
  ↓
Return Processed

or

Completed
  ↓
Full Return
  ↓
Return Processed - transaction voided
```

---

## 5. Security and Compliance

### 5.1 Audit
```
Every transaction is:
- Traceable by transaction ID
- Recorded with cashier
- Timestamped
- An immutable log
- Recorded in daily reconciliation
```

### 5.2 Inventory Accuracy
```
- Verify system inventory vs actual inventory match (monthly)
- Investigate causes of discrepancies
- Prevent loss/theft
- Periodic physical inventory count
```

### 5.3 Cash Management
```
- Record all cash transactions
- Daily cash reconciliation
- Detect fraudulent transactions
- At least two-person approval (refunds, etc.)
```

---

## 6. Key Metrics

### 6.1 Sales Metrics

```
- Daily sales: total sales for the day
- Transaction count: number of transactions per day
- Average Transaction Value (ATV): average amount per transaction
- Performance by cashier: sales/count per cashier
```

### 6.2 Product Metrics

```
- Sales volume by product: quantity sold per product
- Sales by product: sales amount per product
- Turnover rate: how fast inventory sells
- Margin rate: (selling price - cost) / selling price
```

### 6.3 Efficiency Metrics

```
- Transaction processing time: time taken per transaction
- Register throughput: transactions per register
- Refund rate: refunded transactions / total transactions ratio
- Inventory error rate: system vs actual difference rate
```

---

## 7. Customer Experience

### 7.1 Transaction Process (customer perspective)

```
1. Pick up product (or select)
2. Move to register
3. Cashier scans product
4. Verify price
5. Apply discount if possible
6. Present total
7. Choose payment method
   └─ Cash: change transaction
   └─ Card: insert/tap card
   └─ Other: scan or enter
8. Complete transaction
9. Receive receipt
10. Take products and leave
```

### 7.2 Receipt Information

```
- Store name and location
- Transaction date and time
- Transaction number
- Cashier name
- Price breakdown per product
  ├─ Product name
  ├─ Quantity
  ├─ Unit price
  └─ Subtotal
- Tax amount per tax
- Discount amount
- Final payment amount
- Payment method
- Change (for cash transactions)
- Return policy
- Customer satisfaction survey info (optional)
```

---

## 8. Integrated Systems

### 8.1 Data Flow

```
POS ─→ Inventory management
  ├─ Real-time stock decrease
  └─ Low-stock notification

POS ─→ Accounting/settlement
  ├─ Record sales
  ├─ Calculate tax
  └─ Sales reporting

POS ─→ Customer management
  ├─ Apply member discount
  ├─ Save purchase history
  └─ Loyalty points

POS ─→ Reporting/analytics
  ├─ Sales status
  ├─ Product analysis
  └─ Cashier performance
```

---

## 9. Error Handling

### 9.1 Common Problems

```
Barcode scan failure
├─ Manually enter product code
├─ Search by product name
└─ Cashier entry

Price cannot be confirmed
├─ Look up master data
├─ Reference previous transactions
└─ Manager approval

Payment failure
├─ Retry
├─ Try a different payment method
└─ Cancel transaction

Insufficient stock
├─ Offer customer to wait
├─ Check another store
└─ Confirm whether ordering is possible
```

---

## 10. Reconciliation Example

### 10.1 Example Scenario for a Day

```
Date: 2026-05-27
Store: Gangnam branch
Register: #1

Start:
- Starting amount (Float): 100,000 KRW

Transactions:
- Transaction 1: 15,000 KRW (card) → stock -5
- Transaction 2: 45,000 KRW (cash) → stock -12
- Transaction 3: 22,000 KRW (card) → stock -8
- Transaction 4: 8,000 KRW (return) (cash refund) → stock +2

Totals:
- Sales: 82,000 KRW
- Refunds: 8,000 KRW
- Net sales: 74,000 KRW
- Card transactions: 60,000 KRW
- Cash transactions: 22,000 KRW

Final amount:
- Start: 100,000 KRW
- + Cash sales: 45,000 KRW
- - Cash refunds: 8,000 KRW
- = Expected amount: 137,000 KRW
- Verify match after confirming actual transactions
```

---

## 11. Technical Requirements

### 11.1 System Architecture

```
POS terminal
├─ Barcode scanner (or camera)
├─ Touchscreen or keyboard
├─ Card reader
├─ Cash drawer (optional)
├─ Receipt printer
└─ Local storage + network connection

Backend server
├─ Product information (master data)
├─ Inventory management (real-time sync)
├─ Transaction record store
├─ Reporting/analytics engine
└─ User/permission management
```

### 11.2 Data Accuracy

```
- Transaction records: 100% accurate (audit trail)
- Inventory sync: real-time (latency < 1 second)
- Price information: always current (caching allowed)
- Tax calculation: apply accurate rounding rules
```

---

This basic logic describes the core processes that all POS systems follow.
