# CoolHan Framework: Key Patterns and Concepts

## 1. Spec-Parser Pattern

### Purpose
Convert human-readable markdown specifications into normalized JSON that can be machine-analyzed.

### Input: Markdown Specification
```markdown
## Status Registry
Defines all valid status values used throughout the system:

- `PENDING` - Initial order state after creation
- `CONFIRMED` - Customer has confirmed the order
- `PROCESSING` - Order being prepared for shipment
- `SHIPPED` - Order sent to customer
- `DELIVERED` - Order received by customer
- `CANCELLED` - Customer cancelled order

## API Endpoints
### GET /api/orders/:id
Returns a single order by ID.
- Authentication: Required (JWT)
- Response Status: 200 OK with order object
- Response Fields: id, status, items, total, createdAt
- Allowed Statuses: PENDING|CONFIRMED|PROCESSING|SHIPPED|DELIVERED
- Error: 404 if order not found, 401 if not authenticated

### POST /api/orders
Creates a new order.
- Authentication: Required
- Request Body: { items: [{sku, quantity}], shippingAddress: string }
- Response Status: 201 Created with new order object
- Initial Status: PENDING
```

### Output: Normalized JSON
```json
{
  "status_registry": {
    "PENDING": "Initial order state after creation",
    "CONFIRMED": "Customer has confirmed the order",
    "PROCESSING": "Order being prepared for shipment",
    "SHIPPED": "Order sent to customer",
    "DELIVERED": "Order received by customer",
    "CANCELLED": "Customer cancelled order"
  },
  "api_endpoints": {
    "GET /api/orders/:id": {
      "auth": "Required",
      "response_code": "200",
      "response_fields": ["id", "status", "items", "total", "createdAt"],
      "allowed_statuses": ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"]
    },
    "POST /api/orders": {
      "auth": "Required",
      "response_code": "201",
      "initial_status": "PENDING",
      "request_fields": ["items", "shippingAddress"]
    }
  }
}
```

### Usage
```bash
node .claude/hooks/spec-parser.js path/to/specifications
```

## 2. Code-Analyzer Pattern

### Purpose
Extract implementation details from actual source code to compare against specifications.

### Analyzes
1. **API Endpoints** - All routes defined in Express/Fastify/etc
2. **Database Operations** - Tables, columns, queries
3. **Status Values** - All status/state values used
4. **Module Dependencies** - Which modules call which APIs

### Example Output
```json
{
  "api_endpoints": {
    "GET /api/orders/:id": {
      "file": "src/routes/orders.ts",
      "line": 42,
      "auth_check": true,
      "response_status": 200
    }
  },
  "database": {
    "orders_table": {
      "file": "src/database/schema.ts",
      "columns": ["id", "status", "items", "total", "createdAt"]
    }
  },
  "status_values": {
    "PENDING": ["src/models/Order.ts:15"],
    "CONFIRMED": ["src/models/Order.ts:16", "src/services/order.service.ts:89"],
    "PROCESSING": ["src/services/order.service.ts:125"]
  },
  "module_calls": {
    "OrderModule": {
      "calls": ["ProductAPI.getProduct", "PaymentAPI.validate"],
      "locations": ["src/services/order.service.ts:45"]
    }
  }
}
```

### Usage
```bash
node .claude/hooks/code-analyzer.js src/
```

## 3. Spec-Validator Pattern

### Purpose
Compare parsed specifications against analyzed code with ZERO tolerance for mismatches.

### Validation Logic
```
FOR EACH status_value in parsed_spec:
  IF status_value NOT in analyzed_code:
    FAIL: "Status value 'UNDEFINED' is in spec but not used in code"
  
FOR EACH status_value in analyzed_code:
  IF status_value NOT in parsed_spec:
    FAIL: "Status value 'UNKNOWN' is used in code but not defined in spec"

FOR EACH api_endpoint in parsed_spec:
  IF endpoint NOT in analyzed_code:
    FAIL: "API endpoint GET /api/orders is in spec but not implemented"
  ELSE:
    IF endpoint.auth_required AND NOT endpoint.has_auth_check:
      FAIL: "API endpoint GET /api/orders requires auth but code has no auth check"

FOR EACH module_call in analyzed_code:
  IF call NOT allowed by parsed_spec.module_matrix:
    FAIL: "Module X calling forbidden API Y.z()"
```

### Output: Validation Report
```json
{
  "status": "PASS|FAIL",
  "timestamp": "2026-05-27T14:32:00Z",
  "checks_run": 12,
  "checks_passed": 12,
  "checks_failed": 0,
  "mismatches": [],
  "summary": "✅ All validation checks passed. Code matches specification 100%."
}
```

If FAIL:
```json
{
  "status": "FAIL",
  "mismatches": [
    {
      "type": "missing_endpoint",
      "spec_endpoint": "PATCH /api/orders/:id",
      "message": "Endpoint defined in spec but not found in code"
    },
    {
      "type": "undefined_status",
      "status_value": "REFUNDED",
      "message": "Status value used in code (line 67 order.service.ts) but not defined in spec"
    },
    {
      "type": "forbidden_module_call",
      "caller": "OrderModule",
      "callee": "AdminModule.deleteOrder()",
      "location": "src/services/order.ts:142",
      "message": "Module isolation violation: OrderModule not allowed to call AdminModule"
    }
  ]
}
```

## 4. Environment Auto-Detection Pattern

### Purpose
Automatically identify LOCAL/STAGING/PRODUCTION environment without manual configuration.

### 4-Step Detection Process

#### Step 1: Git Remote Check
```bash
git config --get remote.origin.url
```
- Contains `localhost|127.0.0.1` → **LOCAL**
- Contains `staging.kleinanzeigen.co.kr` → **STAGING**
- Contains `prod.kleinanzeigen.co.kr` → **PRODUCTION**

#### Step 2: Hostname Check
```bash
hostname
```
- `MacBook-Pro.local` or `WINDOWS-PC` → **LOCAL**
- Contains `staging` → **STAGING**
- Contains `prod` → **PRODUCTION**

#### Step 3: Environment Variable Check
```bash
echo $NODE_ENV
```
- `development` → **LOCAL**
- `staging` → **STAGING**
- `production` → **PRODUCTION**

#### Step 4: Port State Check
```bash
netstat -an | grep LISTEN
```
- Port 3001 listening → **LOCAL**
- Port 4001 listening → **STAGING**
- Port 4000 listening → **PRODUCTION**

### Validation After Detection
- Git branch matches environment
- Required ports available
- SSH port 2222 accessible (STAGING/PRODUCTION)
- Forbidden files (.env.production) not present (LOCAL)
- Configuration files exist for detected environment

### Output
```json
{
  "detected_environment": "STAGING",
  "confidence": 0.95,
  "detection_path": ["git_remote", "port_state"],
  "validation_status": "PASS",
  "details": {
    "git_remote": "git@staging.kleinanzeigen.co.kr:orders.git → STAGING",
    "hostname": "staging-server-01 → STAGING",
    "node_env": "staging → STAGING",
    "port_state": "4001 listening → STAGING",
    "git_branch": "staging (matches environment)",
    "ssh_port": "2222 accessible",
    "forbidden_files": "none detected"
  }
}
```

## 5. Deploy Lock System Pattern

### Purpose
Prevent concurrent deployments and multiple SSH pushes that could crash servers.

### Lock File Structure
```json
{
  "type": "deploy",
  "environment": "PRODUCTION",
  "user": "alice",
  "createdAt": 1622131200000,
  "pid": 12345,
  "hostname": "ci-server-01",
  "timestamp": "2026-05-27T14:32:00Z"
}
```

### Lock Lifecycle

**ACQUIRE PHASE:**
```
1. Check if lock file exists
2. If exists:
   a. Calculate elapsed time
   b. If elapsed < TIMEOUT:
      → LOCKED: Deployment blocked, show wait message
   c. If elapsed >= TIMEOUT:
      → EXPIRED: Remove old lock, create new lock
3. If not exists:
   → CREATE: New lock acquired
```

**HOLD PHASE:**
- Deployment proceeds while lock held
- Other deployments blocked with specific wait message
- Shows elapsed time and timeout limit

**RELEASE PHASE:**
```
1. Deployment completes successfully or fails
2. Remove lock file
3. Other waiting deployments proceed
```

### Timeouts
- **LOCAL**: 30 minutes (fast development iteration)
- **STAGING**: 1 hour (testing deployments may be slower)
- **PRODUCTION**: 2 hours (critical system stability)

### Force Unlock (Admin Only)
```bash
node .claude/hooks/deploy-lock.js force-unlock deploy [PASSWORD]
```
Requires password verification to prevent accidental unlock during actual deployment.

## 6. Module Responsibility Matrix Pattern

### Purpose
Enforce which modules can call which APIs/functions (module isolation).

### Specification Format
```markdown
## Module Responsibility Matrix

Member Module:
  ✅ Can call:
    - Member.getUser()
    - Member.updateProfile()
    - Payment.validateCard()
  ❌ Cannot call:
    - Admin.getUserList()
    - Admin.deleteUser()
    - Admin.viewSalesReport()

Order Module:
  ✅ Can call:
    - Order.create()
    - Order.update()
    - Product.getDetails()
    - Inventory.checkStock()
    - Payment.charge()
  ❌ Cannot call:
    - Admin.viewSalesData()
    - Member.viewAllUsers()

Admin Module:
  ✅ Can call:
    - Admin.* (all admin functions)
    - Member.getUser() [view only]
    - Order.get() [view only]
    - Product.* [manage]
  ❌ Can call:
    - Payment.* [read-only, no charge]
```

### Validation in Code
Code analyzer detects all module-to-module calls:
```javascript
// src/services/order.service.ts
export async function createOrder(userId, items) {
  // ✅ ALLOWED: Order module calling Product module
  const products = await productAPI.getDetails(items);
  
  // ✅ ALLOWED: Order module calling Payment module  
  await paymentAPI.charge(userId, total);
  
  // ❌ NOT ALLOWED: Order module calling Admin module
  // This would fail validation:
  // await adminAPI.viewSalesReport();
}
```

Spec-validator compares specification against actual code calls and fails deployment if ANY violation detected.

## 7. Locked Mode Rules Pattern

### Purpose
Define strict operational rules that AI CANNOT deviate from.

### Example Locked Mode Rules
```markdown
## Locked Mode Rules (ABSOLUTE - AI CANNOT DEVIATE)

### Database Rules (Category: DATA_INTEGRITY)
1. (P0) NEVER delete from production database without backup
   - Enforcement: Code analysis checks for DELETE statements in PRODUCTION
   - Action on violation: DEPLOYMENT BLOCKED
   
2. (P0) NEVER modify status value enumeration after production release
   - Enforcement: Status registry changes in PRODUCTION flagged
   - Action on violation: DEPLOYMENT BLOCKED

### Security Rules (Category: SECURITY)
3. (P0) NEVER commit .env.production file
   - Enforcement: Pre-commit hook checks for .env.* files
   - Action on violation: COMMIT BLOCKED
   
4. (P0) NEVER expose API keys in code or commits
   - Enforcement: Pre-commit hook scans for common key patterns
   - Action on violation: COMMIT BLOCKED

### File Naming Rules (Category: INTEGRITY)
5. (P0) NEVER rename files after they're committed
   - Enforcement: FILE_MANIFEST tracks all filenames
   - Action on violation: COMMIT BLOCKED (file not in manifest)

6. (P0) NEVER change module file structure
   - Enforcement: File structure validated against manifest
   - Action on violation: COMMIT BLOCKED

### Deployment Rules (Category: STABILITY)
7. (P0) NEVER skip pre-deploy validation
   - Enforcement: Pre-deploy hooks are mandatory
   - Action on violation: DEPLOYMENT BLOCKED
```

### Enforcement Mechanism
1. **Pre-commit stage** - Rules checked before code committed
2. **Pre-deploy stage** - Rules checked before deployment
3. **Spec-validator stage** - Rules violations detected in code analysis
4. **Post-deploy stage** - Rules verified in production environment

If ANY locked mode rule violated → **IMMEDIATE BLOCK** with specific error message.

## 8. Status Value Registry Pattern

### Purpose
Centralize all valid status/state values to prevent undefined statuses in code.

### Specification
```markdown
## Status Value Registry

### Order Statuses
- `PENDING` - Order created, awaiting confirmation (duration: 0-30min)
- `CONFIRMED` - Customer confirmed, payment processing (duration: 0-5min)
- `PROCESSING` - Order being prepared, inventory reserved (duration: 1-24hr)
- `SHIPPED` - Package sent to customer (duration: 1-14 days)
- `DELIVERED` - Received by customer (final state)
- `CANCELLED` - Order cancelled (final state)

### Payment Statuses
- `UNPAID` - Payment not yet attempted
- `PENDING` - Payment processing
- `COMPLETED` - Payment successful
- `FAILED` - Payment failed (retry possible)
- `REFUNDED` - Payment refunded (final state)
```

### JSON Representation
```json
{
  "status_registry": {
    "order": ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"],
    "payment": ["UNPAID", "PENDING", "COMPLETED", "FAILED", "REFUNDED"]
  }
}
```

### Code Usage Validation
Valid:
```javascript
if (order.status === "PENDING") { ... }
if (order.status === "SHIPPED") { ... }
```

Invalid (caught by validator):
```javascript
if (order.status === "PROCESSING") { ... }  // Not in registry
if (order.status === "UNKNOWN") { ... }     // Undefined status
```

## 9. Specification Drift Detection Pattern

### Purpose
Detect when code implementations change without updating specifications.

### Post-Deploy Check
After deployment, the system:
1. Re-analyzes code in production environment
2. Re-parses specifications
3. Compares against previous deployment's analysis
4. Flags any changes not documented in spec

### Detection Example
```
PRE-DEPLOYMENT ANALYSIS:
- API endpoints: GET /api/orders, POST /api/orders, PATCH /api/orders
- Status values: PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED

POST-DEPLOYMENT ANALYSIS:
- API endpoints: GET /api/orders, POST /api/orders, PATCH /api/orders, DELETE /api/orders
- Status values: PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, RETURNED

DRIFT DETECTED:
❌ New endpoint DELETE /api/orders not in specification
❌ New status RETURNED not in Status Registry specification

ACTION: Alert deployment team, rollback may be required
```

### Prevention
Specifications are updated before code changes (enforced at pre-commit), validated during pre-commit, and verified during post-deploy.
