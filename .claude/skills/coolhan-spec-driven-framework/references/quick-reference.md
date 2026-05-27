# CoolHan Framework: Quick Reference

## File Structure
```
.claude/
├── framework/
│   ├── specs/
│   │   ├── status-registry.md
│   │   ├── api-endpoints.md
│   │   ├── module-matrix.md
│   │   └── locked-mode-rules.md
│   ├── hooks/
│   │   ├── spec-parser.js (324 lines)
│   │   ├── code-analyzer.js (398 lines)
│   │   ├── spec-validator.js (401 lines)
│   │   ├── environment-validator.js (500+ lines)
│   │   ├── deploy-lock.js (400+ lines)
│   │   ├── pre-commit.js (620 lines)
│   │   ├── pre-deploy.js (284 lines)
│   │   └── post-deploy.js (454 lines)
│   ├── logs/ (for execution traces)
│   ├── locks/ (for deploy lock files)
│   ├── LOCAL_ENVIRONMENT_CONFIG.md
│   ├── STAGING_ENVIRONMENT_CONFIG.md
│   ├── PRODUCTION_ENVIRONMENT_CONFIG.md
│   ├── COMMIT_PROTOCOL.md
│   ├── DEPLOY_PROTOCOL.md
│   ├── FILE_MANIFEST.md
│   ├── DEPLOYMENT_MANIFEST.md
│   └── 00_MASTER_SPECIFICATION_MODULE.md
```

## Essential Commands

### Setup
```bash
# Install dependencies
npm install --save-dev husky

# Create hooks directory
mkdir -p .claude/framework/{specs,hooks,logs,locks,manifests}

# Install git hooks
npx husky install
npx husky add .husky/pre-commit "node .claude/hooks/pre-commit.js"
npx husky add .husky/pre-push "node .claude/hooks/pre-deploy.js"
```

### Validation
```bash
# Parse specifications
npm run spec:parse

# Analyze code
npm run spec:analyze

# Validate spec-code match
npm run spec:validate

# Detect environment
npm run env:validate

# Check deployment lock
npm run lock:status

# Release lock (admin)
npm run lock:cleanup
```

### Development Workflow
```bash
# Normal commit (pre-commit hook runs automatically)
git add .
git commit -m "feat(module): description"

# Normal push (pre-deploy hook runs automatically)
git push origin develop

# Deploy (post-deploy hook runs automatically)
npm run deploy
```

## Validation Stages

### Pre-Commit (7 checks)
1. ✅ Git diff review & forbidden files
2. ✅ Security files (.env, credentials)
3. ✅ CLAUDE.md rules validation
4. ✅ TypeScript/Lint check
5. ✅ Commit message format
6. ✅ Git log integrity
7. ✅ Spec documents exist

### Pre-Deploy (10 stages)
1. ✅ Spec parsing
2. ✅ Code analysis
3. ✅ Spec validation
4. ✅ Build success
5. ✅ Security scan
6. ✅ Environment check
7. ✅ Tests passing
8. ✅ Lint/format check
9. ✅ Database migrations
10. ✅ Spec document verification

### Post-Deploy (12 checks)
**Traditional (8):**
1. ✅ API health check (200 OK)
2. ✅ Database connection
3. ✅ Cache status
4. ✅ External APIs reachable
5. ✅ Performance <500ms
6. ✅ Error rate <0.1%
7. ✅ Smoke tests pass
8. ✅ Security headers present

**Spec-based (4):**
9. ✅ Status transitions valid
10. ✅ Module isolation enforced
11. ✅ API compliance verified
12. ✅ No spec drift detected

## Environment Detection

| Factor | LOCAL | STAGING | PRODUCTION |
|--------|-------|---------|------------|
| Git Remote | localhost | staging.kleinanzeigen.co.kr | prod.kleinanzeigen.co.kr |
| Hostname | *.local / WINDOWS-PC | staging-* | prod-* |
| NODE_ENV | development | staging | production |
| Port | 3001 | 4001 | 4000 |
| SSH Port | N/A | 2222 | 2222 |
| Branch | develop | staging | main |

## Key Principles

### 1. Documents Remember
- All specs stored in markdown files
- AI reads documents before every module
- No reliance on memory between sessions

### 2. Orchestrator Controls Scope
- Rule Guard with absolute prohibitions
- Conditional prohibitions on dangerous actions
- Strict scope boundaries

### 3. Execution Traces in Version Control
- DEPLOYMENT_MANIFEST records every deployment
- Git log shows validation proof
- `.claude/logs/` contains execution traces

## Status Value Validation

```javascript
// ✅ VALID - Status in registry
if (order.status === "PENDING") { ... }

// ❌ INVALID - Status not in registry
if (order.status === "UNKNOWN") { ... }

// VALIDATION ERROR:
// Status value "UNKNOWN" used in code but not defined in spec
// Location: src/services/order.ts:45
```

## Module Isolation

```javascript
// ✅ ALLOWED - Order module calling Product module
const product = await productAPI.getDetails(sku);

// ❌ NOT ALLOWED - Order module calling Admin module
// This will fail validation:
// const users = await adminAPI.getUserList();

// VALIDATION ERROR:
// Module isolation violation: Order calling Admin.getUserList()
// Location: src/services/order.ts:67
```

## Deployment Lock

```bash
# Check lock status
npm run lock:status

# Output if locked:
# ❌ Deployment in progress
# Elapsed: 5 minutes / Timeout: 30 minutes
# User: alice
# Started: 2026-05-27T14:32:00Z

# Wait for lock to release (automatic timeout)
# Or force-unlock if deployment crashed:
node .claude/hooks/deploy-lock.js force-unlock deploy [PASSWORD]
```

## Error Message Patterns

### Spec-Code Mismatch
```
❌ VALIDATION FAILED: Spec-code mismatch detected
Endpoint POST /api/orders/status exists in code but NOT in spec

Action: Update specification file:
  vim .claude/framework/specs/api-endpoints.md
  Add: POST /api/orders/status endpoint definition
  Save and re-commit
```

### Module Isolation Violation
```
❌ VALIDATION FAILED: Module isolation violation
Module Payment calling forbidden API Member.deleteUser()
Location: src/services/payment.service.ts:142

Action: 
1. Edit: src/services/payment.service.ts
2. Remove line 142: await memberAPI.deleteUser()
3. Save and re-commit
```

### Locked Mode Rule Violation
```
❌ VALIDATION FAILED: Locked mode rule violation
.env.production file detected in commit

Action:
1. Remove file: git rm --cached .env.production
2. Add to .gitignore: echo ".env*" >> .gitignore
3. Re-commit changes
```

### Environment Mismatch
```
❌ VALIDATION FAILED: Environment mismatch
Detected: LOCAL
Git branch: main (expected: develop)

Action:
1. Switch to correct branch: git checkout develop
2. Or update LOCAL_ENVIRONMENT_CONFIG.md if intentional
```

## Performance Benchmarks

### Validation Time
- Pre-commit: 2-5 seconds
- Pre-deploy: 30-60 seconds
- Post-deploy: 5-10 seconds

### System Resources
- Hook scripts: ~2MB total
- Lock files: <1KB per deployment
- Logs: ~100KB per deployment (retained 90 days)

## Common Scenarios

### Scenario 1: Add New API Endpoint
```markdown
1. Update spec:
   vim .claude/framework/specs/api-endpoints.md
   Add endpoint definition

2. Implement in code:
   vim src/routes/orders.ts
   Add endpoint handler

3. Commit:
   git add .
   git commit -m "feat(api): add order status endpoint"
   Pre-commit validates new endpoint is in spec ✅

4. Push and deploy:
   git push origin develop
   Pre-deploy validates spec-code match ✅
   npm run deploy
   Post-deploy validates all 12 checks ✅
```

### Scenario 2: Change Status Value
```markdown
1. Update spec:
   vim .claude/framework/specs/status-registry.md
   Add/remove status value

2. Update code:
   Find all uses of status value
   Replace with new value

3. Validation catches mismatch and blocks deployment:
   ✅ npm run spec:validate
   Shows exact location of changes needed

4. Commit and deploy:
   All validation passes after updates
```

### Scenario 3: Prevent Broken Deployment
```markdown
Pre-commit rejects:
- .env.production files
- Uncommitted spec changes
- Invalid commit messages

Pre-deploy rejects:
- Spec-code mismatches
- Failed tests
- Security issues
- Module isolation violations

Post-deploy fails if:
- API not healthy
- Database disconnected
- Error rate too high
- Spec drift detected

→ Result: Zero broken deployments
```

## Support Resources

1. **SKILL.md** - Full framework overview
2. **00_MASTER_SPECIFICATION_MODULE.md** - Complete system documentation
3. **patterns-and-concepts.md** - Deep dive into each pattern
4. **implementation-guide.md** - Step-by-step setup guide
5. **quick-reference.md** - This file
6. Individual config files - Specific environment setup

## Getting Help

When something fails:
1. Read the error message carefully (includes location and reason)
2. Check corresponding spec file (is requirement documented?)
3. Check actual code (does it match spec?)
4. Update either spec or code to match
5. Re-run validation
6. Commit and re-deploy

Pattern: **Spec first, Code second, Validation last**
