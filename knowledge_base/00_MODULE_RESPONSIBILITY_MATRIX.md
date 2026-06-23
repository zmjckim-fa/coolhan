# Module Responsibility Matrix

**Effective Date:** 2026-05-27  
**Authority:** Design Architecture  
**Status:** MASTER REFERENCE  

---

## Overview

Clearly defines which module owns and manages each table, API endpoint, and status value.

Legend:
- 🟢 **OWNER**: Has ownership (create, update, delete)
- 🔵 **READ**: Read access only
- 🟡 **CALL**: May call the API
- ⚪ **NONE**: No access

---

## 1. Database Tables - Ownership Matrix

### User-Related Tables

| Table | 01_Member | 02_Shopping | 05_Admin | 10_GDPR | Description |
|--------|-----------|------------|----------|---------|------|
| users | 🟢 OWNER | 🔵 READ | 🔵 READ | 🔵 READ | User account basic info |
| user_profiles | 🟢 OWNER | 🔵 READ | 🔵 READ | 🟡 CALL | User profile (name, address, etc.) |
| user_preferences | 🟢 OWNER | 🔵 READ | ⚪ NONE | 🔵 READ | User settings (language, notifications, etc.) |
| login_history | 🟢 OWNER | ⚪ NONE | 🔵 READ | 🔵 READ | Login history (for audit) |
| user_consents | 🟢 OWNER | ⚪ NONE | 🔵 READ | 🟢 OWNER | Consent management (marketing, privacy) |

### Product-Related Tables

| Table | 02_Shopping | 07_Review | 08_Inventory | 04_Shipping | Description |
|--------|------------|----------|-------------|------------|------|
| products | 🟢 OWNER | 🔵 READ | 🔵 READ | 🔵 READ | Product info |
| product_categories | 🟢 OWNER | 🔵 READ | ⚪ NONE | ⚪ NONE | Product categories |
| product_images | 🟢 OWNER | 🔵 READ | ⚪ NONE | ⚪ NONE | Product images |
| product_specs | 🟢 OWNER | 🔵 READ | 🔵 READ | 🔵 READ | Product specifications |
| reviews | ⚪ NONE | 🟢 OWNER | ⚪ NONE | ⚪ NONE | Product reviews |
| ratings | ⚪ NONE | 🟢 OWNER | ⚪ NONE | ⚪ NONE | Product ratings |
| review_replies | ⚪ NONE | 🟢 OWNER | ⚪ NONE | ⚪ NONE | Review replies |

### Order-Related Tables

| Table | 09_Order | 03_Payment | 04_Shipping | 08_Inventory | Description |
|--------|----------|-----------|------------|-------------|------|
| orders | 🟢 OWNER | 🔵 READ | 🔵 READ | 🔵 READ | Order info |
| order_items | 🟢 OWNER | 🔵 READ | 🔵 READ | 🔵 READ | Order line items |
| order_addresses | 🟢 OWNER | ⚪ NONE | 🔵 READ | ⚪ NONE | Shipping address |
| payments | ⚪ NONE | 🟢 OWNER | ⚪ NONE | ⚪ NONE | Payment info |
| refunds | ⚪ NONE | 🟢 OWNER | ⚪ NONE | ⚪ NONE | Refund info |
| shipments | ⚪ NONE | 🔵 READ | 🟢 OWNER | 🔵 READ | Shipment info |
| shipment_tracking | ⚪ NONE | ⚪ NONE | 🟢 OWNER | ⚪ NONE | Shipment tracking |
| return_requests | 🟢 OWNER | ⚪ NONE | 🔵 READ | 🔵 READ | Return requests |

### Inventory-Related Tables

| Table | 08_Inventory | 02_Shopping | 09_Order | Description |
|--------|-------------|------------|----------|------|
| inventory_levels | 🟢 OWNER | 🔵 READ | 🔵 READ | Current stock quantity |
| inventory_transactions | 🟢 OWNER | 🔵 READ | 🔵 READ | Inventory transaction history |
| inventory_reservations | 🟢 OWNER | ⚪ NONE | 🟡 CALL | Inventory reservations |
| inventory_adjustments | 🟢 OWNER | ⚪ NONE | ⚪ NONE | Manual inventory adjustments |
| low_stock_alerts | 🟢 OWNER | 🔵 READ | ⚪ NONE | Low stock alerts |

### Shipping-Related Tables

| Table | 04_Shipping | 09_Order | 06_Notification | Description |
|--------|------------|----------|-----------------|------|
| carriers | 🟢 OWNER | 🔵 READ | ⚪ NONE | Carrier info |
| shipping_rates | 🟢 OWNER | 🔵 READ | ⚪ NONE | Standard shipping rates |
| shipping_zones | 🟢 OWNER | 🔵 READ | ⚪ NONE | Shipping zones |
| shipments | 🟢 OWNER | 🔵 READ | 🔵 READ | Shipment basic info |
| shipment_events | 🟢 OWNER | 🔵 READ | 🟡 CALL | Shipment events (pickup, delivery, completion) |
| warehouses | 🟢 OWNER | 🔵 READ | ⚪ NONE | Warehouse info |
| warehouse_locations | 🟢 OWNER | 🔵 READ | ⚪ NONE | Warehouse locations |

### Admin-Related Tables

| Table | 05_Admin | 01_Member | Description |
|--------|----------|-----------|------|
| admin_users | 🟢 OWNER | 🔵 READ | Admin accounts |
| admin_roles | 🟢 OWNER | ⚪ NONE | Admin roles |
| admin_permissions | 🟢 OWNER | ⚪ NONE | Permission definitions |
| audit_logs | 🟢 OWNER | ⚪ NONE | Audit logs (all modules contribute) |
| system_settings | 🟢 OWNER | ⚪ NONE | System settings |

### Notification-Related Tables

| Table | 06_Notification | 09_Order | 03_Payment | 04_Shipping | Description |
|--------|-----------------|----------|-----------|------------|------|
| notifications | 🟢 OWNER | 🔵 READ | 🔵 READ | 🔵 READ | Notification basic info |
| notification_templates | 🟢 OWNER | ⚪ NONE | ⚪ NONE | ⚪ NONE | Notification templates |
| notification_preferences | 🟢 OWNER | ⚪ NONE | ⚪ NONE | ⚪ NONE | User notification settings |
| email_queue | 🟢 OWNER | 🟡 CALL | 🟡 CALL | 🟡 CALL | Email queue |
| sms_queue | 🟢 OWNER | 🟡 CALL | 🟡 CALL | 🟡 CALL | SMS queue |

### GDPR-Related Tables

| Table | 10_GDPR | 01_Member | 05_Admin | Description |
|--------|---------|-----------|----------|------|
| consent_logs | 🟢 OWNER | 🔵 READ | 🔵 READ | Consent records |
| data_requests | 🟢 OWNER | ⚪ NONE | 🔵 READ | Data requests (access/download) |
| deletion_requests | 🟢 OWNER | ⚪ NONE | 🔵 READ | Deletion requests |
| consent_withdrawals | 🟢 OWNER | ⚪ NONE | 🔵 READ | Consent withdrawal records |

---

## 2. API Endpoints - Ownership Matrix

### User API

| Endpoint | Method | Owning Module | Description |
|-----------|--------|---------|------|
| /users/register | POST | 01_Member | Sign up |
| /users/login | POST | 01_Member | Log in |
| /users/logout | POST | 01_Member | Log out |
| /users/profile | GET | 01_Member | View profile |
| /users/profile | PATCH | 01_Member | Edit profile |
| /users/password | PATCH | 01_Member | Change password |
| /users/preferences | GET/PATCH | 01_Member | User settings |
| /users/consents | GET/PATCH | 10_GDPR | Consent management |
| /users/{id}/data-request | POST | 10_GDPR | Data download request |
| /users/delete | POST | 10_GDPR | Account deletion request |
| /admin/users | GET | 05_Admin | User list (admin) |
| /admin/users/{id}/suspend | POST | 05_Admin | Suspend user |

### Product API

| Endpoint | Method | Owning Module | Description |
|-----------|--------|---------|------|
| /products | GET | 02_Shopping | Product list |
| /products/{id} | GET | 02_Shopping | Product detail |
| /admin/products | POST | 02_Shopping | Create product (admin) |
| /admin/products/{id} | PATCH | 02_Shopping | Update product (admin) |
| /admin/products/{id} | DELETE | 02_Shopping | Delete product (admin) |
| /products/{id}/reviews | GET | 07_Review | Review list |
| /products/{id}/reviews | POST | 07_Review | Write review |
| /reviews/{id} | PATCH | 07_Review | Edit review |
| /reviews/{id} | DELETE | 07_Review | Delete review |
| /reviews/{id}/rate | POST | 07_Review | Submit rating |
| /products/{id}/inventory | GET | 08_Inventory | Check inventory |

### Order API

| Endpoint | Method | Owning Module | Description |
|-----------|--------|---------|------|
| /orders | POST | 09_Order | Create order |
| /orders | GET | 09_Order | My order list |
| /orders/{id} | GET | 09_Order | Order detail |
| /orders/{id}/cancel | POST | 09_Order | Cancel order |
| /orders/{id}/return | POST | 09_Order | Return request |
| /orders/{id}/shipments | GET | 04_Shipping | Shipment info |
| /orders/{id}/payment | GET | 03_Payment | Payment info |
| /admin/orders | GET | 05_Admin | Order list (admin) |
| /admin/orders/{id} | PATCH | 09_Order | Change order status (admin) |

### Payment API

| Endpoint | Method | Owning Module | Description |
|-----------|--------|---------|------|
| /payments | POST | 03_Payment | Process payment |
| /payments/{id} | GET | 03_Payment | Check payment status |
| /payments/{id}/refund | POST | 03_Payment | Refund request |
| /refunds | GET | 03_Payment | Refund list |
| /admin/payments | GET | 05_Admin | Payment list (admin) |
| /admin/payments/{id}/verify | POST | 03_Payment | Verify payment (admin) |

### Shipping API

| Endpoint | Method | Owning Module | Description |
|-----------|--------|---------|------|
| /shipments/{id} | GET | 04_Shipping | Check shipment status |
| /shipments/{id}/track | GET | 04_Shipping | Track shipment |
| /admin/shipments | POST | 04_Shipping | Create shipment (admin) |
| /admin/shipments/{id} | PATCH | 04_Shipping | Update shipment info |
| /admin/shipments/{id}/events | GET | 04_Shipping | Shipment events |
| /admin/carriers | GET/POST | 04_Shipping | Carrier management |
| /admin/shipping-rates | GET/POST | 04_Shipping | Shipping rate management |

### Inventory API

| Endpoint | Method | Owning Module | Description |
|-----------|--------|---------|------|
| /admin/inventory | GET | 08_Inventory | Inventory status |
| /admin/inventory/{id}/adjust | POST | 08_Inventory | Adjust inventory |
| /admin/inventory/{id}/reserve | POST | 08_Inventory | Reserve inventory (internal) |
| /admin/inventory/{id}/release | POST | 08_Inventory | Release inventory (internal) |
| /admin/inventory/transactions | GET | 08_Inventory | Inventory transaction history |
| /admin/inventory/low-stock | GET | 08_Inventory | Low stock alerts |

### Notification API

| Endpoint | Method | Owning Module | Description |
|-----------|--------|---------|------|
| /notifications | GET | 06_Notification | My notifications |
| /notifications/{id}/read | POST | 06_Notification | Mark notification read |
| /notifications/{id} | DELETE | 06_Notification | Delete notification |
| /admin/notifications | GET | 05_Admin | Notification list (admin) |
| /admin/notification-templates | GET/POST | 06_Notification | Template management |

### Admin API

| Endpoint | Method | Owning Module | Description |
|-----------|--------|---------|------|
| /admin/audit-log | GET | 05_Admin | View audit log |
| /admin/settings | GET/PATCH | 05_Admin | System settings |
| /admin/roles | GET/POST | 05_Admin | Role management |
| /admin/permissions | GET | 05_Admin | Permission management |
| /admin/dashboard | GET | 05_Admin | Admin dashboard |

### GDPR API

| Endpoint | Method | Owning Module | Description |
|-----------|--------|---------|------|
| /gdpr/data-request | POST | 10_GDPR | Data request |
| /gdpr/data-request/{id} | GET | 10_GDPR | Check request status |
| /gdpr/delete-request | POST | 10_GDPR | Deletion request |
| /gdpr/consents | GET/PATCH | 10_GDPR | Consent management |
| /admin/gdpr/data-requests | GET | 05_Admin | Data request list (admin) |
| /admin/gdpr/deletion-requests | GET | 05_Admin | Deletion request list (admin) |

---

## 3. Status Values - Ownership Matrix

| Status Values | Entity | Owning Module | Transition Management |
|--------|--------|---------|---------|
| pending_verification → verified → active → suspended | User | 01_Member | 01_Member |
| draft → active → inactive → archived | Product | 02_Shopping | 02_Shopping |
| pending → processing → completed → refunded | Payment | 03_Payment | 03_Payment |
| ready_to_ship → in_transit → delivered | Shipment | 04_Shipping | 04_Shipping |
| pending → approved → rejected → hidden → deleted | Review | 07_Review | 07_Review |
| in_stock → low_stock → out_of_stock | Inventory | 08_Inventory | 08_Inventory |
| pending_payment → payment_confirmed → shipping_ready → in_transit → delivered | Order | 09_Order | 09_Order |

---

## 4. Inter-Module Call Rules

### Permitted API Calls

```
09_Order_Management
  ├─→ 02_Shopping_Mall: GET /products/{id}
  ├─→ 03_Payment_System: POST /payments
  ├─→ 04_Shipping_Logistics: POST /shipments, GET /shipping-rates
  ├─→ 08_Inventory_Management: POST /reserve, POST /release
  └─→ 06_Notification: POST /notifications

03_Payment_System
  ├─→ 09_Order_Management: GET /orders/{id}
  └─→ 06_Notification: POST /notifications

04_Shipping_Logistics
  ├─→ 09_Order_Management: GET /orders/{id}
  ├─→ 02_Shopping_Mall: GET /products/{id}
  └─→ 06_Notification: POST /notifications

08_Inventory_Management
  ├─→ 02_Shopping_Mall: GET /products/{id}
  └─→ 06_Notification: POST /notifications

07_Review_Rating_System
  ├─→ 02_Shopping_Mall: GET /products/{id}
  ├─→ 01_Member_System: GET /users/{id}
  └─→ 06_Notification: POST /notifications
```

### Forbidden API Calls

```
❌ 02_Shopping → 09_Order (read-only)
❌ 03_Payment → 02_Shopping (read-only)
❌ 04_Shipping → 03_Payment (read-only)
❌ Circular references (A→B→A)
❌ Calls deeper than 3 levels (A→B→C→D)
```

---

## 5. Data Access Control

### Per-Table Access Control

```sql
-- users table
OWNER: 01_Member_System
  CREATE user
  UPDATE user profile
  DELETE user (soft delete)
  
READ: All modules (query only)
  SELECT * FROM users WHERE id = ?
  
WRITE: 
  01_Member → UPDATE status (active/suspended)
  10_GDPR → UPDATE last_gdpr_request

-- inventory_levels table
OWNER: 08_Inventory_Management
  CREATE inventory
  UPDATE quantity
  DELETE inventory
  
READ: 02_Shopping, 09_Order (query only)
  SELECT quantity FROM inventory WHERE product_id = ?
  
WRITE: 
  08_Inventory → UPDATE quantity
  08_Inventory → UPDATE reserved_quantity
```

---

## 6. Monitoring and Validation Rules

### Table Access Validation

```
Before each INSERT/UPDATE/DELETE request:
1. Is the module the OWNER of the table? → YES proceed, NO reject
2. Does the table allow READ only? → YES allow SELECT only, NO reject
3. Is there field-level permission? → YES proceed, NO reject

On violation:
- Respond 403 Forbidden
- Record in 05_Admin_System's audit_logs
- Notify the security team
```

### API Call Validation

```
Before each API call request:
1. Can the calling module call the target module's API? → YES proceed, NO reject
2. Is the call to a permitted endpoint? → YES proceed, NO reject
3. Is the call depth 3 levels or more? → YES reject, NO proceed

On violation:
- Respond 400 Bad Request
- Record in audit_logs
```

---

## 7. Migration Path

### Phase 1: Current State
- [ ] Document completed
- [ ] All modules review this matrix

### Phase 2: Validation
- [ ] Each module confirms its tables/APIs
- [ ] Apply permission settings

### Phase 3: Enforcement
- [ ] Enforce access control
- [ ] Enable violation logging
- [ ] Start monitoring

### Phase 4: Full Enforcement
- [ ] Auto-reject violating requests
- [ ] Regular audit reports

---

## Sign-off

**Document:** 00_MODULE_RESPONSIBILITY_MATRIX.md  
**Created:** 2026-05-27  
**Authority:** Design Architecture  
**Status:** 🟢 **MASTER REFERENCE - all modules conform to this matrix**

**How to use:**
1. When creating a new table, assign the OWNER module
2. When creating a new API endpoint, specify the owning module
3. When making inter-module calls, check the Permitted Calls list
4. When configuring permissions, apply them based on this matrix
