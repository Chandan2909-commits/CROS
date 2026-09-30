POS SYSTEM — PRODUCT REQUIREMENTS DOCUMENT

Project: End-to-End Retail POS
Version: 1.0
Target: Retail stores / supermarkets / general stores / electronics / apparel / small businesses
Primary payment modes: Cash + UPI
Architecture: Offline-first, API-driven, modular and scalable

1. Product Vision

The system should provide a complete digital replacement for a traditional cash counter.

A cashier should be able to:

Login → Open Shift → Scan/Search Product → Add to Cart → Apply Discount → Select Cash/UPI → Collect Payment → Calculate Change → Generate Receipt → Update Inventory

At the same time, the owner/manager should be able to:

Manage Products → Manage Inventory → Manage Employees → View Sales → Track Cash → Track UPI → Reconcile Shifts → Analyze Profit → Manage Customers → View Reports

The most important design principle is:

Every financial or inventory action must leave an auditable transaction trail.

2. Core Problem We Are Solving

A typical small shop has two very different payment realities.

UPI

Customer owes:

₹847

Customer pays:

₹847 via UPI

System records:

Payment Method: UPI
Amount Due: ₹847
Amount Received: ₹847
Change: ₹0
Status: PAID
Cash

Customer owes:

₹847

Customer gives:

₹1,000

The POS should explicitly record:

Amount Due:       ₹847
Cash Received:   ₹1,000
Change Returned:  ₹153

This is important because the POS isn't merely recording ₹847 cash sale.

It should know that:

₹1,000 entered the drawer
₹153 left the drawer
Net cash retained = ₹847

That distinction becomes extremely important during shift closing and cash reconciliation.

3. High-Level Architecture
                         ┌──────────────────────┐
                         │      POS CLIENT      │
                         │                      │
                         │  Next.js / React PWA │
                         │                      │
                         │ • Billing            │
                         │ • Inventory          │
                         │ • Payments           │
                         │ • Customers          │
                         │ • Shift Management   │
                         └──────────┬───────────┘
                                    │
                         REST / WebSocket API
                                    │
                                    ▼
                    ┌──────────────────────────────┐
                    │        API / BACKEND         │
                    │                              │
                    │ Authentication               │
                    │ Sales                        │
                    │ Payments                     │
                    │ Inventory                    │
                    │ Customers                    │
                    │ Employees                    │
                    │ Reports                      │
                    │ Shift Management              │
                    └──────────────┬───────────────┘
                                   │
             ┌─────────────────────┼──────────────────────┐
             │                     │                      │
             ▼                     ▼                      ▼
      ┌─────────────┐      ┌──────────────┐       ┌──────────────┐
      │ PostgreSQL  │      │ Redis        │       │ Object Store │
      │             │      │              │       │              │
      │ Sales       │      │ Cache        │       │ Receipts     │
      │ Payments    │      │ Sessions     │       │ Product imgs │
      │ Inventory   │      │ Locks        │       │ Documents    │
      │ Customers   │      │ Queues       │       │              │
      └─────────────┘      └──────────────┘       └──────────────┘
             │
             ▼
      ┌──────────────────────┐
      │   EVENT / JOB QUEUE  │
      │                      │
      │ Inventory updates    │
      │ Reports              │
      │ Notifications        │
      │ UPI reconciliation   │
      │ Receipt generation   │
      └──────────┬───────────┘
                 │
       ┌─────────┼─────────┐
       ▼         ▼         ▼
     UPI       Printer    SMS/Email
   Provider    /Scanner   /WhatsApp*

* WhatsApp should be treated as an optional integration, not a core dependency.

4. Recommended Technology Stack

For your project, I would use:

Frontend
Next.js
TypeScript
React
Tailwind CSS
Zustand
React Query / TanStack Query
PWA
IndexedDB
Backend
Node.js
NestJS
TypeScript
REST API
WebSocket
Database
PostgreSQL
Prisma ORM
Supporting infrastructure
Redis
BullMQ
Object Storage
Docker
Nginx
Authentication
JWT / session-based authentication
RBAC
Refresh tokens
Hardware
Barcode scanner
Thermal receipt printer
Cash drawer
Customer display

The architecture should not depend on hardware. Hardware integrations should sit behind interfaces/adapters.

5. Application Structure

The application should have two major interfaces.

A. POS Application

Used by cashier.

POS
├── Login
├── Open Shift
├── Sales
├── Cart
├── Checkout
├── Payments
├── Held Orders
├── Returns
├── Customers
├── Receipts
├── Shift
└── Logout
B. Admin / Back Office

Used by owner/manager.

Dashboard
├── Sales
├── Products
├── Categories
├── Inventory
├── Purchases
├── Suppliers
├── Customers
├── Employees
├── Payments
├── Shifts
├── Expenses
├── Reports
├── Taxes
├── Stores
└── Settings

This separation is important.

A cashier shouldn't see:

Profit margin
Cost price
Employee salary
Full financial reports
System settings

unless explicitly authorized.

6. User Roles

Minimum RBAC model:

Role	Main Responsibilities
Owner	Everything
Admin	System configuration
Manager	Sales, inventory, reports
Cashier	POS transactions
Inventory Manager	Stock/purchases
Accountant	Payments/accounting/reports

Permissions should be granular.

For example:

Cashier
✓ Create sale
✓ Accept payment
✓ Print receipt
✓ Search products
✓ Create customer

✗ Delete sale
✗ Modify completed transaction
✗ Change product cost
✗ View profit
✗ Adjust inventory
✗ Close another employee's shift

This follows the general role/document permission approach used by ERPNext.

7. Product Master

Every product should have:

Product
│
├── ID
├── SKU
├── Barcode
├── Product Name
├── Description
├── Category
├── Brand
├── Unit
├── Selling Price
├── Cost Price
├── Tax
├── Discount Rules
├── Minimum Stock
├── Current Stock
├── Warehouse
├── Supplier
├── Image
├── Active/Inactive
├── Track Inventory
├── Batch Tracking
├── Serial Tracking
└── Expiry Tracking

Example:

Product:
Coca Cola 750ml

SKU:
CC750

Barcode:
8901234567890

Selling Price:
₹40

Cost Price:
₹32

Tax:
18%

Stock:
125

Minimum Stock:
20

Frappe's item model similarly distinguishes stock-tracked and non-stock items and supports serial/batch concepts.

8. Product Search

Cashier should be able to find products through:

Method 1 — Barcode
Scan barcode
      ↓
Find product
      ↓
Add to cart
Method 2 — Search
"coke"
   ↓
Coca Cola 250ml
Coca Cola 750ml
Coca Cola 1.25L
Method 3 — Category
Beverages
 ├── Cold Drinks
 ├── Juice
 ├── Water
 └── Energy Drinks
Method 4 — Favorite products

Frequently sold products should be directly visible.

9. POS Billing Screen

The main POS screen should be extremely fast.

┌─────────────────────────────────────────────────────────┐
│ 🔎 Search / Scan Barcode                    👤 Cashier  │
├───────────────────────┬─────────────────────────────────┤
│                       │                                 │
│   CATEGORIES          │         CURRENT CART            │
│                       │                                 │
│ [Beverages]           │ Coca Cola x2       ₹80          │
│ [Snacks]              │ Lays x1            ₹20          │
│ [Dairy]               │ Bread x1           ₹40          │
│ [Grocery]              │                                 │
│ [Personal Care]       │ Subtotal          ₹140          │
│                       │ Discount            ₹10          │
│                       │ Tax                  ₹...        │
│                       │ TOTAL              ₹130          │
│                       │                                 │
│                       │ [ HOLD ]       [ CHARGE ₹130 ] │
└───────────────────────┴─────────────────────────────────┘

The cashier should not need to navigate through multiple pages.

10. Cart Engine

Each cart contains:

Cart
│
├── Cart ID
├── Customer
├── Items[]
│   ├── Product
│   ├── Quantity
│   ├── Unit Price
│   ├── Discount
│   ├── Tax
│   └── Line Total
│
├── Subtotal
├── Discount
├── Tax
├── Rounding
└── Grand Total

Formula:

Line Total =
Quantity × Unit Price
- Line Discount
+ Tax

Then:

Subtotal
- Order Discount
+ Tax
+/- Rounding
= Grand Total
11. Checkout Architecture

This is the most important part.

CART
  │
  ▼
REVIEW ORDER
  │
  ▼
TOTAL CALCULATED
  │
  ├──────────────┐
  ▼              ▼
 CASH            UPI
  │              │
  ▼              ▼
Cash Entry     Generate QR
  │              │
  ▼              ▼
Amount        Payment Request
Received          │
  │               ▼
  │          Payment Provider
  │               │
  │          Webhook/Status
  │               │
  └──────┬────────┘
         ▼
    PAYMENT SUCCESS
         │
         ▼
    CREATE SALE
         │
         ├── Inventory deduction
         ├── Payment record
         ├── Receipt
         ├── Customer history
         └── Shift totals
12. CASH PAYMENT — Your Required Feature

This deserves a dedicated design.

Suppose:

Product cost = ₹847

Customer gives:

₹1,000

POS screen:

┌─────────────────────────────────────┐
│              CASH PAYMENT           │
├─────────────────────────────────────┤
│                                     │
│ Amount Due                          │
│                    ₹847.00          │
│                                     │
│ Cash Received                       │
│                    ₹1,000.00        │
│                                     │
│ ─────────────────────────────────── │
│                                     │
│ CHANGE TO RETURN                    │
│                    ₹153.00          │
│                                     │
│ [ ₹500 ] [ ₹1000 ] [ ₹2000 ]       │
│                                     │
│           [ COMPLETE SALE ]         │
└─────────────────────────────────────┘
Backend calculation
change = cashReceived - amountDue

Validation:

cashReceived < amountDue
        ↓
ERROR:
"Insufficient cash"
cashReceived = amountDue
        ↓
Change = ₹0
cashReceived > amountDue
        ↓
Change = difference
13. Cash Payment Data Model

Don't simply save:

payment_method = CASH
amount = 847

Instead save:

payment
├── payment_id
├── sale_id
├── method = CASH
├── amount_due = 847
├── amount_received = 1000
├── change_given = 153
├── currency = INR
├── cashier_id
├── shift_id
├── timestamp
└── status = SUCCESS

This gives you complete auditability.

14. Why This Matters During Shift Closing

Suppose the cashier starts with:

Opening cash = ₹5,000

During the day:

Cash sales = ₹25,000
Cash refunds = ₹2,000
Pay-in = ₹1,000
Pay-out = ₹500

Expected cash:

5000
+ 25000
- 2000
+ 1000
- 500
= ₹28,500

At closing, cashier counts:

₹28,200

System says:

Expected Cash = ₹28,500
Actual Cash   = ₹28,200

Difference = -₹300

This is the kind of reconciliation Frappe and Loyverse's shift workflows are designed to support.

15. UPI Payment

UPI should be treated differently from cash.

Do not simply have:

[UPI PAID]

because that can create fake/manual payment records.

Ideally:

POS
 │
 │ ₹847
 ▼
UPI Provider
 │
 ▼
QR / Payment Request
 │
 ▼
Customer Phone
 │
 ▼
UPI App
 │
 ▼
Payment
 │
 ▼
Provider
 │
 │ Webhook
 ▼
POS Backend
 │
 ▼
Payment SUCCESS

The backend should ultimately trust a provider-confirmed payment status, not merely the cashier clicking a button.

16. UPI Payment States

Use a state machine:

CREATED
   │
   ▼
PENDING
   │
   ├───────────────┐
   ▼               ▼
SUCCESS          FAILED
   │
   ▼
COMPLETED

Also handle:

PENDING
   │
   ▼
EXPIRED

and:

SUCCESS
   │
   ▼
REFUNDED
17. UPI Failure Scenario

Customer pays.

Their bank deducts money.

POS doesn't receive confirmation because the network dies.

This is where the architecture matters.

The transaction should remain:

PAYMENT_PENDING

not:

SALE_COMPLETED

The system should reconcile the transaction later through the provider.

This avoids the horrible situation:

Customer paid → POS says failed → cashier charges them again.

18. Split Payment

Even if the MVP only needs Cash + UPI, design the payment engine for multiple methods.

For example:

Total = ₹1,000

Cash = ₹400
UPI  = ₹600

Payment records:

Payment 1
Method = CASH
Amount = ₹400

Payment 2
Method = UPI
Amount = ₹600

Loyverse explicitly supports splitting a ticket across different payment types, so this is a useful workflow to incorporate into the architecture.

19. Payment Engine

Create a generic abstraction:

PaymentService

├── CashPaymentProvider
├── UpiPaymentProvider
├── CardPaymentProvider      [future]
├── WalletPaymentProvider    [future]
└── CreditPaymentProvider    [future]

Then:

interface PaymentProvider {
    initiatePayment()
    verifyPayment()
    refundPayment()
    getPaymentStatus()
}

Cash doesn't need external verification.

UPI does.

20. Sale State Machine

A sale should also have states.

DRAFT
  │
  ▼
PAYMENT_PENDING
  │
  ├──────────────┐
  ▼              ▼
PAID           PAYMENT_FAILED
  │
  ▼
COMPLETED
  │
  ├──────► PARTIALLY_REFUNDED
  │
  └──────► REFUNDED

Don't allow arbitrary status changes from the frontend.

The backend owns the state machine.

21. Inventory Architecture

Inventory should be ledger based.

Do not rely only on:

product.stock = 83

Instead maintain stock movements:

Stock Ledger

+100 Purchase
-2  Sale
-1  Sale
+5  Adjustment
-3  Damaged
+10 Transfer

Current stock:

Opening
+ Incoming
- Sales
- Damaged
+ Transfers In
- Transfers Out
± Adjustments
= Current Stock

Frappe's stock ledger follows this type of transaction-based approach, recording movements associated with sales, purchases, transfers and adjustments.

22. Inventory Modules
Inventory
│
├── Stock Overview
├── Stock Ledger
├── Stock Adjustment
├── Stock Transfer
├── Purchase Orders
├── Goods Receiving
├── Suppliers
├── Low Stock
├── Expiry
├── Batch Tracking
├── Serial Number Tracking
└── Inventory Count

Loyverse similarly provides purchase orders, transfers, adjustments and inventory history in its inventory-management workflow.

23. Purchase Flow
Supplier
   │
   ▼
Purchase Order
   │
   ▼
Goods Received
   │
   ├── Increase Stock
   ├── Record Cost
   └── Update Inventory Ledger
          │
          ▼
       Available
          │
          ▼
          SALE

Example:

Supplier sends:

100 × Coca Cola
Cost = ₹32

System:

Stock +100
Inventory value +₹3,200
24. Stock Adjustment

Manager discovers:

System stock = 100
Physical stock = 97

Adjustment:

-3
Reason = Damaged / Missing / Recount

Never simply overwrite stock from:

100 → 97

Instead create:

Stock Adjustment #ADJ-00021

Product: Coca Cola
Previous: 100
Adjustment: -3
New: 97
Reason: Damaged
Created By: Manager
Timestamp: ...

This mirrors the auditability of Loyverse stock adjustments.

25. Sales → Inventory Transaction

When sale becomes completed:

SALE COMPLETED
      │
      ▼
Inventory Service
      │
      ▼
Check Stock
      │
      ▼
Create Stock Ledger Entry
      │
      ▼
Quantity -1

Example:

Coke
Before = 100

Sale = 2

After = 98

The inventory operation should be transactionally connected to the sale.

26. Critical Transaction Boundary

The system should guarantee:

Payment SUCCESS
+
Sale CREATED
+
Inventory UPDATED

cannot partially succeed without recovery.

For example:

Payment successful
Sale failed

must be handled.

Similarly:

Sale successful
Inventory update failed

must be detected and reconciled.

This is why the backend should use:

database transactions
idempotency keys
event/outbox patterns
reconciliation jobs
27. Database Architecture

Core tables:

users
roles
permissions
stores
pos_terminals
pos_shifts

products
product_variants
categories
brands
units
barcodes
tax_rates

inventory
inventory_ledger
stock_adjustments
stock_transfers
warehouses

customers
customer_addresses

sales
sale_items
sale_discounts
sale_taxes

payments
payment_transactions
payment_events

refunds
refund_items

suppliers
purchase_orders
purchase_order_items
goods_receipts

cash_movements

receipts
receipt_sequences

expenses

audit_logs
28. Important Database Relationships
USER
 │
 └── POS SHIFT
       │
       ├── SALES
       │     │
       │     ├── SALE ITEMS
       │     │       │
       │     │       └── PRODUCT
       │     │
       │     └── PAYMENTS
       │
       └── CASH MOVEMENTS

And:

PRODUCT
   │
   ├── INVENTORY
   │
   ├── SALE ITEMS
   │
   ├── PURCHASE ITEMS
   │
   └── STOCK LEDGER
29. Simplified ER Diagram
┌──────────────┐
│    USERS     │
└──────┬───────┘
       │
       │
┌──────▼───────┐
│  POS_SHIFTS  │
└──────┬───────┘
       │
       │
┌──────▼───────┐
│    SALES     │
└───┬──────┬───┘
    │      │
    │      └──────────────┐
    │                     │
┌───▼─────────┐    ┌──────▼─────────┐
│ SALE_ITEMS  │    │   PAYMENTS     │
└────┬────────┘    └────────────────┘
     │
     │
┌────▼─────────┐
│   PRODUCTS   │
└────┬─────────┘
     │
     │
┌────▼─────────────┐
│ INVENTORY_LEDGER │
└──────────────────┘
30. Sale Table

Conceptually:

sales

id
invoice_number
store_id
terminal_id
shift_id
cashier_id
customer_id

subtotal
discount_total
tax_total
rounding
grand_total

status
created_at
completed_at
31. Sale Item
sale_items

id
sale_id
product_id

sku
product_name

quantity
unit_price

discount_amount
tax_amount

line_total

cost_price

Important:

Store the price at the time of sale.

Do not calculate historical sales using today's product price.

32. Payment Table
payments

id
sale_id
shift_id

method
status

amount_due
amount_received
change_given

provider
provider_transaction_id

currency

created_at
completed_at

For cash:

method = CASH
amount_due = 847
amount_received = 1000
change_given = 153

For UPI:

method = UPI
amount_due = 847
amount_received = 847
change_given = 0
provider = ...
provider_transaction_id = ...
33. Cash Movement Table

This is different from payments.

cash_movements

id
shift_id

type
amount

reference_type
reference_id

reason
created_by
created_at

Types:

OPENING_BALANCE
SALE
REFUND
PAY_IN
PAY_OUT
CASH_ADJUSTMENT
CLOSING_BALANCE

This gives you a complete cash drawer ledger.

34. POS Shift

Every cashier session should have a shift.

OPEN SHIFT
    │
    ▼
START CASH
    │
    ▼
SELL
    │
    ├── Cash
    ├── UPI
    ├── Refund
    ├── Pay-in
    └── Pay-out
    │
    ▼
CLOSE SHIFT
    │
    ▼
COUNT CASH
    │
    ▼
RECONCILIATION

Frappe's POS workflow explicitly uses opening and closing entries around the POS session, while Loyverse calculates expected cash from sales/refunds/pay-ins/pay-outs and compares it with physical cash.

35. Opening Shift

Cashier logs in.

System asks:

OPEN SHIFT

Cash denomination

₹500 × 5 = ₹2,500
₹200 × 5 = ₹1,000
₹100 × 10 = ₹1,000
₹50  × 5 = ₹250

Opening Cash = ₹4,750

        [ OPEN SHIFT ]

Denomination-based counting is useful because Frappe's POS opening/closing workflow also supports denomination-based cash counting.

36. Closing Shift
CLOSING SHIFT

Expected Cash
₹28,500

Actual Cash
₹28,200

Difference
-₹300

Reason:
[ Shortage ]

Notes:
________________

        [ CLOSE SHIFT ]

For larger stores, require manager approval if:

abs(difference) > configured threshold
37. Shift Report

At closing:

SHIFT #SH-00192

Cashier:
Rahul

Opening Cash:
₹5,000

Sales:
₹38,450

Cash Sales:
₹21,250

UPI Sales:
₹17,200

Refunds:
₹1,200

Pay In:
₹1,000

Pay Out:
₹500

Expected Cash:
₹25,550

Actual Cash:
₹25,450

Difference:
-₹100
38. Sales Dashboard

Owner should see:

TODAY

Total Sales
₹1,24,560

Transactions
326

Average Bill
₹382

Cash
₹51,200

UPI
₹73,360

Refunds
₹2,450

Charts:

Sales by Hour
Sales by Day
Sales by Category
Sales by Product
Sales by Payment Method
Sales by Cashier

Loyverse also exposes sales summaries, sales-by-item/category, receipts, shift reports and customer purchase history.

39. Inventory Dashboard
TOTAL PRODUCTS
1,248

LOW STOCK
27

OUT OF STOCK
8

INVENTORY VALUE
₹18,42,500

TODAY'S STOCK MOVEMENT
+420 / -386
40. Low Stock System

Product:

Coca Cola

Current:
18

Minimum:
20

Trigger:

LOW_STOCK

Dashboard:

⚠ Coca Cola
Only 18 units remaining
Minimum level: 20

Later:

[ CREATE PURCHASE ORDER ]
41. Returns / Refunds

Customer brings product back.

Find Receipt
     │
     ▼
Select Item
     │
     ▼
Return Quantity
     │
     ▼
Select Reason
     │
     ▼
Refund Method
     │
     ▼
Complete Return

Example:

Original Sale

Coke × 2 = ₹80

Return:
Coke × 1 = ₹40

Refund:
₹40

Inventory:

Stock +1

Payment:

Refund ₹40
42. Receipt

Receipt should contain:

              STORE NAME
           Address / Phone

--------------------------------

Invoice: INV-2026-001928
Date: 26 Sep 2026
Cashier: Rahul

Coca Cola       2 × 40     80
Lays            1 × 20     20
Bread           1 × 40     40

--------------------------------
Subtotal                   ₹140
Discount                   ₹10
Tax                         ₹...
--------------------------------
TOTAL                     ₹130

Payment: CASH

Cash Received             ₹200
Change                    ₹70

--------------------------------

Thank you!

The cash received/change section is particularly valuable for your requirement.

43. Receipt Types

Support:

Thermal Printer
PDF
Email
SMS
WhatsApp
Digital Receipt

But don't make every channel a mandatory dependency.

The transaction must complete even if:

Printer offline
Email unavailable
Internet unavailable
44. Offline-First Architecture

This is extremely important for a POS.

Internet going down shouldn't stop the shop.

Architecture:

                 INTERNET
                    │
             ┌──────▼───────┐
             │ CLOUD BACKEND │
             └──────┬───────┘
                    │
               SYNC ENGINE
                    │
             ┌──────▼───────┐
             │ LOCAL DEVICE │
             │              │
             │ IndexedDB    │
             │ Local Queue  │
             │ POS Cache    │
             └──────────────┘

POS should cache:

Products
Prices
Categories
Tax configuration
Customers
Current shift

Sales created offline go into:

SYNC_QUEUE

When internet returns:

SYNC_QUEUE
    │
    ▼
SERVER
    │
    ▼
ACK
    │
    ▼
REMOVE FROM QUEUE
45. Offline Payment Rules

Cash:

Can work fully offline.

UPI:

Depends on the payment architecture.

If the payment provider cannot confirm payment while offline:

UPI unavailable

Do not allow the cashier to fake a successful UPI payment.

Instead:

UPI payment cannot be verified.
Please use Cash.

This is safer.

46. Idempotency

Suppose cashier taps:

COMPLETE PAYMENT

twice.

Without protection:

Sale #1
Sale #2

Customer gets charged twice.

Every important operation should have an idempotency key:

idempotency_key

Example:

SALE-DEVICE123-20260926-000123

Server:

if key already processed:
    return existing result
47. Audit Log

Every sensitive action:

WHO
WHAT
WHEN
FROM WHERE
BEFORE
AFTER

Example:

User:
manager@store.com

Action:
PRICE_UPDATED

Product:
Coca Cola

Old:
₹40

New:
₹42

Timestamp:
2026-09-26 18:42:11

IP:
...

Device:
POS-02

Audit logs should be append-only from the application's perspective.

48. Admin Settings
Settings
│
├── Store
├── POS Terminals
├── Payment Methods
├── Taxes
├── Receipt
├── Currency
├── Inventory
├── Employees
├── Roles
├── Discounts
├── Returns
├── Shift Rules
├── Notifications
└── Integrations
49. Multi-Store Architecture

Don't design the database around only one shop.

Use:

Organization
    │
    ├── Store A
    │     ├── Warehouse
    │     ├── POS 1
    │     └── POS 2
    │
    ├── Store B
    │     ├── Warehouse
    │     └── POS 3
    │
    └── Store C

Every transaction should have:

organization_id
store_id
terminal_id

This allows the system to grow later.

50. Multi-Warehouse
Store A
 ├── Main Warehouse
 └── Counter Stock

Store B
 └── Main Warehouse

Stock transfer:

Warehouse A
    │
    │ Transfer 50
    ▼
Warehouse B

Transaction:

TRANSFER_CREATED
TRANSFER_IN_TRANSIT
TRANSFER_RECEIVED
51. Customer Management

Customer:

Customer
├── ID
├── Name
├── Phone
├── Email
├── Address
├── GSTIN [optional]
├── Loyalty Points
├── Total Purchases
└── Purchase History

At checkout:

Walk-in Customer

should remain the default.

Don't force the cashier to create a customer for every ₹20 purchase.

52. Customer History
Rahul
│
├── INV-1001 ₹450
├── INV-1045 ₹820
├── INV-1078 ₹230
└── INV-1092 ₹1,200

Click invoice:

Items
Payment
Discount
Tax
Cash/UPI
Receipt
Return
53. Discounts

Support:

Product discount
Coke ₹40
10% discount
= ₹36
Cart discount
Subtotal ₹1,000
Discount 10%
= ₹900
Fixed discount
₹100 OFF
Coupon
WELCOME100

Manager permissions can control manual discounts.

54. Tax Engine

Don't hardcode tax calculations into the UI.

Create:

TaxService

Input:

Product
Customer
Store
Price
Tax Category

Output:

Taxable Amount
Tax Rate
Tax Amount

For India, GST-related fields should be configurable rather than embedded permanently into the core POS.

55. Reports

Minimum reporting system:

Sales
Daily Sales
Monthly Sales
Sales by Product
Sales by Category
Sales by Cashier
Sales by Store
Sales by Payment Method
Payment
Cash Collection
UPI Collection
Refunds
Outstanding Payments
Payment Reconciliation
Inventory
Stock Summary
Stock Ledger
Low Stock
Out of Stock
Inventory Valuation
Stock Adjustments
Stock Movement
Employee
Cashier Sales
Shift Summary
Discounts Given
Refunds
Cash Differences
Customer
Top Customers
Purchase History
Average Spend
Visit Frequency
56. Accounting Architecture

Eventually:

Sales
  │
  ├── Revenue
  ├── Tax
  ├── Discount
  └── Cost of Goods Sold

Payment:

Cash Sale
     │
     ▼
Cash Account

UPI Sale
     │
     ▼
UPI/Bank Account

Frappe's payment model similarly separates payment transactions and accounts, while POS profiles define payment methods and accounting-related configuration.

57. Event-Driven Internal Architecture

I'd structure backend events like:

SaleCompleted
      │
      ├── UpdateInventory
      ├── UpdateCustomerHistory
      ├── UpdateShiftTotals
      ├── GenerateReceipt
      ├── UpdateAnalytics
      └── AccountingEntry

Refund:

RefundCompleted
      │
      ├── IncreaseInventory
      ├── CreateRefundPayment
      ├── UpdateShift
      ├── UpdateCustomerHistory
      └── AccountingEntry

This makes the system much easier to extend.

58. Backend Module Architecture
src/

├── auth/
├── users/
├── roles/
│
├── stores/
├── terminals/
├── shifts/
│
├── products/
├── categories/
├── pricing/
│
├── inventory/
│   ├── stock/
│   ├── ledger/
│   ├── adjustments/
│   ├── transfers/
│   └── warehouses/
│
├── sales/
│   ├── cart/
│   ├── checkout/
│   ├── invoices/
│   └── returns/
│
├── payments/
│   ├── cash/
│   ├── upi/
│   ├── refunds/
│   └── reconciliation/
│
├── customers/
├── suppliers/
│
├── purchases/
│
├── receipts/
├── reports/
├── notifications/
├── audit/
│
└── common/
    ├── database/
    ├── events/
    ├── queues/
    ├── errors/
    └── utils/
59. API Architecture

Example endpoints:

POST /auth/login

GET /products
GET /products/:id
POST /products
PUT /products/:id

GET /inventory
GET /inventory/:productId
POST /inventory/adjustments

POST /shifts/open
GET /shifts/current
POST /shifts/close

POST /sales
GET /sales/:id

POST /sales/:id/payments
POST /payments/cash
POST /payments/upi

GET /payments/:id
POST /payments/:id/refund

POST /upi/webhook

POST /sales/:id/refund

GET /reports/sales
GET /reports/inventory
GET /reports/shifts
60. Checkout API Example
POST /checkout

Request:

{
  "cartId": "CART-123",
  "paymentMethod": "CASH",
  "amountReceived": 1000,
  "idempotencyKey": "POS01-0009281"
}

Backend:

Validate cart
     ↓
Calculate total
     ↓
Validate cash
     ↓
Calculate change
     ↓
Create sale
     ↓
Create payment
     ↓
Create inventory ledger
     ↓
Update shift
     ↓
Generate receipt
     ↓
Return result

Response:

{
  "saleId": "SALE-19282",
  "invoiceNumber": "INV-0019282",
  "total": 847,
  "paymentMethod": "CASH",
  "amountReceived": 1000,
  "change": 153,
  "status": "COMPLETED"
}
61. UPI API Example
POST /payments/upi
{
  "saleId": "SALE-19283",
  "amount": 847,
  "idempotencyKey": "UPI-92821"
}

Response:

{
  "paymentId": "PAY-82191",
  "status": "PENDING",
  "qrCode": "...",
  "expiresAt": "..."
}

Then provider:

POST /webhooks/upi
{
  "transactionId": "...",
  "status": "SUCCESS",
  "amount": 847
}

Backend verifies:

Provider transaction
        ↓
Expected amount
        ↓
Expected order
        ↓
Signature
        ↓
SUCCESS

Then:

PAYMENT_SUCCESS
      ↓
SALE_COMPLETED
62. Important Security Rules
Never trust frontend totals.

Bad:

Frontend says total = ₹500
Backend accepts ₹500

Good:

Frontend sends item IDs + quantities

Backend calculates:

price
discount
tax
total
Never trust frontend payment success.

For UPI:

Provider → Backend → Verify → Complete

not:

Frontend → "UPI paid" → Complete
63. Concurrency

Suppose two POS terminals sell the last Coke simultaneously.

Stock = 1

POS 1 → wants 1
POS 2 → wants 1

Both cannot succeed.

Use database transaction/locking:

BEGIN

SELECT inventory
FOR UPDATE

Check stock

Deduct stock

COMMIT

One succeeds.

Other gets:

OUT_OF_STOCK
64. Inventory Consistency

Never allow:

Sale says:
Coke -1

Inventory says:
Coke unchanged

Every completed sale must have corresponding inventory movement if the product is stock-tracked.

This relationship should be auditable.

65. Audit Trail

For a sale:

SALE_CREATED
PAYMENT_INITIATED
PAYMENT_SUCCESS
SALE_COMPLETED
INVENTORY_DEDUCTED
RECEIPT_GENERATED

For UPI:

UPI_REQUEST_CREATED
UPI_PENDING
UPI_WEBHOOK_RECEIVED
UPI_VERIFIED
PAYMENT_SUCCESS

For cash:

CASH_PAYMENT_STARTED
CASH_RECEIVED_ENTERED
CHANGE_CALCULATED
PAYMENT_COMPLETED

This makes debugging dramatically easier.

66. Core POS Workflow

The complete operational workflow becomes:

                 LOGIN
                   │
                   ▼
              OPEN SHIFT
                   │
                   ▼
              POS DASHBOARD
                   │
                   ▼
          SCAN / SEARCH PRODUCT
                   │
                   ▼
                 CART
                   │
             ┌─────┴─────┐
             │           │
          HOLD        CHECKOUT
                         │
                         ▼
                       TOTAL
                         │
                 ┌───────┴────────┐
                 │                │
               CASH              UPI
                 │                │
                 ▼                ▼
          ENTER RECEIVED     CREATE PAYMENT
                 │                │
                 ▼                ▼
          CALCULATE CHANGE    QR / REQUEST
                 │                │
                 │                ▼
                 │            CUSTOMER PAYS
                 │                │
                 │                ▼
                 │          PROVIDER VERIFY
                 │                │
                 └───────┬────────┘
                         ▼
                  PAYMENT SUCCESS
                         │
                         ▼
                  COMPLETE SALE
                         │
             ┌───────────┼────────────┐
             ▼           ▼            ▼
         INVENTORY     RECEIPT      SHIFT
          UPDATE       GENERATE     UPDATE
             │           │            │
             └───────────┴────────────┘
                         │
                         ▼
                    NEW SALE
67. Full Business Architecture
                         ┌─────────────────┐
                         │      OWNER      │
                         └────────┬────────┘
                                  │
                         ADMIN / BACK OFFICE
                                  │
          ┌───────────────┬───────┼───────────────┐
          ▼               ▼       ▼               ▼
      Products        Inventory  Employees      Reports
          │               │       │               │
          └───────────────┴───────┼───────────────┘
                                  │
                                  ▼
                           POS BACKEND
                                  │
        ┌─────────────────────────┼──────────────────────┐
        │                         │                      │
        ▼                         ▼                      ▼
     SALES                    PAYMENTS               INVENTORY
        │                         │                      │
        │                    ┌────┴────┐                 │
        │                    ▼         ▼                 │
        │                  CASH       UPI                │
        │                    │         │                 │
        │                    ▼         ▼                 │
        │                 Drawer    Provider             │
        │                                               │
        └──────────────────────┬────────────────────────┘
                               ▼
                           PostgreSQL
                               │
                         Event / Queue
                               │
                    ┌──────────┼───────────┐
                    ▼          ▼           ▼
                Analytics   Receipts    Notifications
68. MVP vs Full Product

Don't try to build everything on day one.

Phase 1 — Core POS
✓ Authentication
✓ Roles
✓ Products
✓ Categories
✓ Barcode
✓ Cart
✓ Cash payment
✓ UPI payment
✓ Cash received
✓ Change calculation
✓ Receipt
✓ Basic inventory
✓ Basic shift
Phase 2 — Business Management
✓ Customers
✓ Returns
✓ Discounts
✓ Suppliers
✓ Purchases
✓ Stock adjustments
✓ Stock transfers
✓ Low-stock alerts
✓ Reports
Phase 3 — Enterprise
✓ Multiple stores
✓ Multiple warehouses
✓ Advanced permissions
✓ Batch tracking
✓ Serial numbers
✓ Expiry
✓ Loyalty
✓ Advanced accounting
✓ Advanced analytics
✓ Automated reconciliation
69. MVP Definition of Done

The MVP should pass this exact scenario:

Scenario

Product:

Coke
₹40
Stock = 10

Customer buys:

2 Coke

POS:

Subtotal = ₹80

Customer pays:

₹100 cash

System produces:

Amount Due       ₹80
Cash Received    ₹100
Change           ₹20

Then:

Sale = COMPLETED
Inventory = 8
Cash Sale = ₹80
Cash Drawer Movement = +₹80 net
Receipt = generated
Shift = updated

That entire chain should happen correctly.

70. Critical Edge Cases

The PRD should explicitly cover these.

Cash
Cash < total
Cash = total
Cash > total
Very large cash
Decimal amounts
Rounding
UPI
Payment pending
Payment success
Payment failure
Payment timeout
Customer paid but webhook delayed
Duplicate webhook
Duplicate payment request
Refund
Partial refund
Inventory
Out of stock
Two simultaneous sales
Negative stock
Stock adjustment
Return
Damaged product
POS
Internet disconnected
Server unavailable
Printer unavailable
Browser refresh
Device restart
Cashier logout
Shift already open
Shift not closed
71. Most Important Design Decision

I strongly recommend that you treat these as three separate but connected ledgers:

              SALE LEDGER
                  │
          What was sold?
                  │
                  ▼
        ┌──────────────────┐
        │                  │
        ▼                  ▼
 PAYMENT LEDGER       STOCK LEDGER
 What was paid?       What changed?
        │                  │
        ▼                  ▼
 CASH / UPI          Inventory movement

And then:

SHIFT LEDGER
     │
     ├── Opening cash
     ├── Cash sales
     ├── Cash refunds
     ├── Pay-ins
     ├── Pay-outs
     └── Closing cash

This is substantially safer than putting everything into one giant transactions table.

72. The Golden Transaction

For every completed sale, the system should be able to answer:

What did the customer buy?

SALE

How much did it cost?

₹847

How did they pay?

Cash / UPI

If cash, how much did they hand over?

₹1,000

How much change was returned?

₹153

Which cashier handled it?

Cashier #12

Which terminal?

POS-02

Which shift?

SHIFT-00192

What happened to inventory?

Product X -2

Can we prove all of this later?

Audit Log

That is what makes this a real POS system rather than a billing application.

73. Recommended Project Name / Structure

I'd structure the project internally as:

RetailPOS
│
├── apps/
│   ├── pos/
│   ├── admin/
│   └── customer-display/
│
├── services/
│   ├── api/
│   ├── worker/
│   └── sync/
│
├── packages/
│   ├── database/
│   ├── types/
│   ├── ui/
│   ├── payments/
│   ├── inventory/
│   └── receipt-engine/
│
├── infrastructure/
│   ├── docker/
│   ├── nginx/
│   └── deployment/
│
└── docs/
    ├── PRD.md
    ├── ARCHITECTURE.md
    ├── API.md
    ├── DATABASE.md
    └── WORKFLOWS.md
74. Final Product Scope

The finished product should effectively look like this:

                         RETAIL POS
                             │
        ┌────────────────────┼─────────────────────┐
        │                    │                     │
        ▼                    ▼                     ▼
      POS APP             BACK OFFICE          REPORTING
        │                    │                     │
        ├── Sales            ├── Products          ├── Sales
        ├── Cart             ├── Inventory         ├── Payments
        ├── Cash             ├── Purchases         ├── Inventory
        ├── UPI              ├── Suppliers         ├── Cash
        ├── Returns          ├── Employees         ├── UPI
        ├── Customers        ├── Stores            ├── Profit
        ├── Receipts         └── Settings          └── Shifts
        └── Shifts
              │
              ▼
       TRANSACTION ENGINE
              │
       ┌──────┼───────┐
       ▼      ▼       ▼
     SALES  PAYMENT  STOCK
       │      │       │
       └──────┼───────┘
              ▼
          POSTGRESQL
              │
              ▼
       AUDIT + EVENTS
The key inspiration we should take from the existing systems

From Loyverse, the useful patterns are the fast sale screen, cash-received/change workflow, payment-type configuration, split payments, open tickets, shift cash management and sales/inventory reporting.

From Frappe/ERPNext, the useful architectural ideas are POS profiles, warehouses, opening/closing POS sessions, payment methods, stock/accounting ledgers, inventory traceability and granular role permissions.

But I would not copy either product literally. The better architecture for your project is a clean, modular POS engine with Cash + UPI as first-class payment providers, a proper cash drawer ledger, transactional inventory, offline-first operation, and idempotent payment processing.

If we're actually building this, the next engineering artifacts should be (1) the complete PostgreSQL/Prisma schema, (2) API specification, (3) exact POS screen-by-screen UI/UX flow, and (4) a development roadmap broken into backend/frontend/database tasks.