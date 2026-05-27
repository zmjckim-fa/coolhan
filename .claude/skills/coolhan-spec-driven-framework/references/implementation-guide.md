# CoolHan Framework: Step-by-Step Implementation Guide

## Pre-Implementation Checklist

- [ ] Node.js 16+ installed (`node --version`)
- [ ] npm 7+ installed (`npm --version`)
- [ ] Git 2.30+ installed (`git --version`)
- [ ] TypeScript 4.5+ (if using TypeScript)
- [ ] Git repository already initialized
- [ ] Initial commit already made
- [ ] Project root identified

## Phase 1: Preparation (15 minutes)

### Step 1.1: Create Directory Structure
```bash
mkdir -p .claude/framework/{specs,hooks,logs}
mkdir -p .claude/locks
mkdir -p .claude/manifests
```

### Step 1.2: Copy Framework Files
Copy all 19 generated framework files to `.claude/framework/` directory.

### Step 1.3: Create package.json Scripts
Add to your `package.json`:
```json
{
  "scripts": {
    "framework:generate": "node .claude/framework/generate-framework.js",
    "spec:parse": "node .claude/hooks/spec-parser.js",
    "spec:analyze": "node .claude/hooks/code-analyzer.js",
    "spec:validate": "node .claude/hooks/spec-validator.js",
    "env:validate": "node .claude/hooks/environment-validator.js",
    "lock:status": "node .claude/hooks/deploy-lock.js list",
    "lock:cleanup": "node .claude/hooks/deploy-lock.js cleanup"
  }
}
```

## Phase 2: Write Specifications (30-60 minutes)

### Step 2.1: Define Status Values

Create `.claude/framework/specs/status-registry.md`:
```markdown
# Status Registry

## Order Status Values
- `PENDING` - Initial order created
- `CONFIRMED` - Customer confirmed order
- `PROCESSING` - Preparing for shipment
- `SHIPPED` - Sent to customer
- `DELIVERED` - Received by customer
- `CANCELLED` - Order cancelled

## Payment Status Values
- `UNPAID` - No payment made
- `PENDING` - Payment processing
- `COMPLETED` - Payment successful
- `FAILED` - Payment failed
- `REFUNDED` - Refund issued
```

### Step 2.2: Define API Endpoints

Create `.claude/framework/specs/api-endpoints.md`:
```markdown
# API Endpoints

## GET /api/orders/:id
- **Purpose**: Retrieve a single order
- **Authentication**: Required (JWT token)
- **Response Code**: 200 OK on success
- **Response Fields**: id, status, items[], total, createdAt, updatedAt
- **Allowed Status Values**: PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED
- **Error Codes**: 404 (not found), 401 (unauthorized)

## POST /api/orders
- **Purpose**: Create a new order
- **Authentication**: Required
- **Request Body**: { items: [{sku, quantity}], shippingAddress }
- **Response Code**: 201 Created
- **Initial Status**: PENDING
- **Response Fields**: orderId, status, estimatedDelivery
```

### Step 2.3: Define Module Responsibilities

Create `.claude/framework/specs/module-matrix.md`:
```markdown
# Module Responsibility Matrix

## Order Module
✅ Can call:
  - OrderService.create()
  - OrderService.update()
  - ProductAPI.getDetails()
  - InventoryAPI.checkStock()
  - PaymentAPI.charge()

❌ Cannot call:
  - AdminAPI.* (forbidden)
  - MemberAPI.deleteUser() (forbidden)

## Member Module
✅ Can call:
  - MemberService.*
  - PaymentAPI.validate()

❌ Cannot call:
  - AdminAPI.* (forbidden)
  - OrderAPI.report() (forbidden)
```

### Step 2.4: Define Locked Mode Rules

Create `.claude/framework/specs/locked-mode-rules.md`:
```markdown
# Locked Mode Rules (ABSOLUTE)

## No Overrides - AI Cannot Deviate

### Security (ABSOLUTE_PROHIBITION)
1. Never commit .env files
2. Never hardcode secrets
3. Never expose API keys
4. Never skip pre-commit validation

### Data Integrity (ABSOLUTE_PROHIBITION)
1. Never delete production data
2. Never modify status enumerations
3. Never change database schema without migration
4. Never truncate tables

### File Structure (ABSOLUTE_PROHIBITION)
1. Never rename committed files
2. Never change module organization
3. Never move core functions
4. Never delete protected files

### Deployment (CONDITIONAL_PROHIBITION)
1. Only deploy during deployment windows
2. Only after pre-deploy validation passes
3. Only if monitoring capacity available
4. Only with rollback plan prepared
```

## Phase 3: Generate Framework Files (5 minutes)

### Step 3.1: Run Generator
```bash
npm run framework:generate
```

This creates 19 files in `.claude/framework/`:
- 3 environment configs
- 2 protocol documents
- 2 management documents
- 7 validation hooks
- 1 master specification
- 4 generated JSON files

### Step 3.2: Verify Generated Files
```bash
ls -la .claude/framework/
# Should show: 19 files total
```

## Phase 4: Set Up Git Hooks (10 minutes)

### Step 4.1: Install Husky (optional but recommended)
```bash
npm install --save-dev husky
npx husky install
```

### Step 4.2: Create Pre-Commit Hook
```bash
npx husky add .husky/pre-commit "node .claude/hooks/pre-commit.js"
```

### Step 4.3: Create Pre-Push Hook
```bash
npx husky add .husky/pre-push "node .claude/hooks/pre-deploy.js"
```

### Step 4.4: Test Hooks
```bash
# Make a test change
echo "test" > test.txt
git add test.txt

# Commit should trigger pre-commit hook
git commit -m "test: test commit hook"
# Should see: ✅ Pre-commit validation PASSED

git push origin develop
# Should trigger pre-deploy hook
# Should see: ✅ Pre-deploy validation PASSED
```

## Phase 5: Test Framework (30 minutes)

### Step 5.1: Run Spec Parser
```bash
npm run spec:parse

# Output should show: ✅ Parsed specifications
# Creates: .claude/framework/parsed-specs.json
```

### Step 5.2: Run Code Analyzer
```bash
npm run spec:analyze

# Output should show: ✅ Analyzed code
# Creates: .claude/framework/code-analysis.json
```

### Step 5.3: Run Spec Validator
```bash
npm run spec:validate

# Output should show:
# - Status values: X matched, 0 mismatches
# - API endpoints: X matched, 0 mismatches
# - Module calls: X validated, 0 violations
# Creates: .claude/framework/validation-report.json
```

### Step 5.4: Run Environment Validator
```bash
npm run env:validate

# Output should show:
# ✅ Environment: LOCAL
# ✅ Git branch: develop (correct for LOCAL)
# ✅ Port 3001: available
# ✅ All validation checks passed
```

## Phase 6: First Deployment (30 minutes)

### Step 6.1: Make Test Commit
```bash
# Create a test feature file
echo "// test feature" > src/features/test.ts
git add src/features/test.ts
git commit -m "feat(test): add test feature"

# Pre-commit hook runs automatically
# Validates: security, specifications, commit format
# Expected: ✅ All checks passed
```

### Step 6.2: Push to Remote
```bash
git push origin develop

# Pre-deploy hook runs automatically
# Validates: specs, build, tests, environment
# Expected: ✅ All checks passed
```

### Step 6.3: Deploy
```bash
npm run deploy

# Deployment with lock system
# Pre-deployment: 10 stages
# During deployment: lock acquired
# Post-deployment: 12 health checks
# Expected: ✅ Deployment successful, all health checks passed
```

### Step 6.4: Check Deployment Manifest
```bash
cat .claude/manifests/DEPLOYMENT_MANIFEST.md

# Should show latest deployment:
# - Deployment #1
# - Commit SHA
# - All validation results (PASS)
# - Post-deploy checks: 12/12 passed
# - Duration time
# - Status: SUCCESS
```

## Phase 7: Ongoing Development (continuous)

### Normal Workflow
```bash
# Make changes
vim src/services/order.service.ts

# Stage changes
git add src/services/order.service.ts

# Commit (pre-commit hook runs automatically)
git commit -m "feat(order): add order status tracking"

# Push (pre-deploy hook runs automatically)
git push origin develop

# Deploy when ready
npm run deploy  # post-deploy hook runs automatically
```

### If Validation Fails
```bash
❌ VALIDATION FAILED: Spec-code mismatch detected
- New status value 'RETURNED' used in code but not defined in spec

ACTION REQUIRED:
1. Update .claude/framework/specs/status-registry.md
2. Add: `RETURNED` - Order returned by customer
3. Re-run: npm run spec:validate
4. Re-commit changes
```

### Monitoring Deployments
```bash
# Check if deployment is in progress
npm run lock:status

# Output:
# Deployment lock: LOCKED
# Elapsed: 5 minutes
# Timeout: 30 minutes
# User: alice
# Started: 2026-05-27T14:32:00Z

# Wait for deployment to complete (lock releases automatically)
# Or force-unlock if deployment crashed (admin only)
npm run lock:cleanup
```

## Common Issues and Solutions

### Issue 1: Pre-commit Hook Rejects File
```
❌ Security check failed: .env file detected
File: .env.production
Action: Remove .env files from commit

Solution:
git rm --cached .env.production
echo ".env*" >> .gitignore
git add .gitignore
git commit -m "fix: remove .env from repo"
```

### Issue 2: Spec-Code Mismatch Blocks Deployment
```
❌ VALIDATION FAILED: API endpoint mismatch
- PATCH /api/orders/:id exists in code but NOT in spec

Solution:
1. Update specification file:
   vim .claude/framework/specs/api-endpoints.md
   
2. Add endpoint:
   ## PATCH /api/orders/:id
   - Purpose: Update order
   - Authentication: Required
   
3. Re-validate:
   npm run spec:validate
   
4. Commit spec update:
   git add .claude/framework/specs/
   git commit -m "docs(spec): add order update endpoint"
```

### Issue 3: Environment Detection Fails
```
❌ Environment detection failed
Cannot determine LOCAL/STAGING/PRODUCTION

Solutions:
1. Check git remote:
   git remote -v
   Should be: origin git@localhost:project.git (LOCAL)
   
2. Check hostname:
   hostname
   Should be: your-machine.local
   
3. Check NODE_ENV:
   echo $NODE_ENV
   Should be: development (for LOCAL)
   
4. Check listening ports:
   lsof -i :3001
   Should show Node.js listening on 3001
```

### Issue 4: Deployment Lock Won't Release
```
Lock acquired 45 minutes ago (timeout: 30 minutes)
❌ Cannot deploy while lock active

Solution:
1. Check if previous deployment is still running
2. If previous deployment crashed, force-unlock:
   npm run lock:cleanup
   
3. Or with password:
   node .claude/hooks/deploy-lock.js force-unlock deploy [PASSWORD]
   
⚠️ WARNING: Only force-unlock if previous deployment confirmed finished/crashed
```

### Issue 5: Module Isolation Violation Blocks Deployment
```
❌ VALIDATION FAILED: Module isolation violation
- Order module calling Admin.deleteUser() (forbidden)
Location: src/services/order.ts:89

Solution:
1. Edit the file:
   vim src/services/order.ts:89
   
2. Replace forbidden call with allowed alternative:
   - Delete: await adminAPI.deleteUser(id)
   - Instead: Don't call Admin module from Order module
   
3. Update code to respect module matrix:
   vim .claude/framework/specs/module-matrix.md
   (Verify module responsibilities are correct)
   
4. Re-commit:
   git add src/services/order.ts
   git commit -m "fix(order): respect module isolation boundaries"
```

## Maintenance

### Weekly Tasks
- [ ] Review DEPLOYMENT_MANIFEST.md for any issues
- [ ] Check `.claude/logs/` for error patterns
- [ ] Run `npm run spec:validate` to ensure continuous compliance

### Monthly Tasks
- [ ] Review specifications for completeness
- [ ] Update status values if new states added
- [ ] Update API endpoints if new routes added
- [ ] Update module matrix if new dependencies added

### Quarterly Tasks
- [ ] Archive old deployment logs (keep 90 days)
- [ ] Review locked-mode-rules for relevance
- [ ] Optimize hook performance if needed
- [ ] Update documentation for new patterns

## Troubleshooting Checklist

- [ ] Framework files all exist in `.claude/framework/`
- [ ] Hooks are executable (`chmod +x .claude/hooks/*.js`)
- [ ] Git hooks installed correctly
- [ ] Specifications are complete and valid
- [ ] Environment correctly detected
- [ ] No .env files in repository
- [ ] All tests passing
- [ ] Build succeeding
- [ ] No uncommitted changes
- [ ] Remote repository accessible

## Success Criteria

Framework is successfully implemented when:
- ✅ All pre-commit validation checks pass
- ✅ All pre-deploy validation checks pass
- ✅ All post-deploy validation checks pass (12/12)
- ✅ Code matches specifications 100% (zero mismatches)
- ✅ Deployments complete successfully
- ✅ DEPLOYMENT_MANIFEST.md records all deployments
- ✅ No manual deployment errors
- ✅ All team members following same process
