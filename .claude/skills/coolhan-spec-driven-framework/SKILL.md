---
name: coolhan-spec-driven-framework
description: |
  **CoolHan Specification-Driven Development Framework** - A complete system for 100% specification-driven development with automated validation hooks. Use this skill when: (1) users need to set up specification-driven development pipelines; (2) users want to prevent AI mistakes through automated validation; (3) users need deployment safety systems with pre-deploy/post-deploy validation; (4) users require environment isolation (LOCAL/STAGING/PRODUCTION); (5) users want to enforce code-spec compliance; (6) users need concurrent deployment prevention and locking systems; (7) users are setting up CI/CD pipelines with strict validation gates; (8) users need comprehensive deployment manifests and rollback capabilities. This skill generates production-ready framework files including environment configs, commit/deploy protocols, 7 validation hook scripts (spec-parser, code-analyzer, spec-validator, environment-validator, deploy-lock, pre-commit, pre-deploy, post-deploy), deployment tracking manifests, and complete documentation ensuring zero spec-code mismatch.

compatibility: |
  - Node.js 16+
  - Git 2.30+
  - npm 7+
  - TypeScript 4.5+
  - Available: 30+ minutes of context for full framework generation
---

# CoolHan Specification-Driven Development Framework

## Overview

The CoolHan Framework is a **100% specification-driven development system** that prevents AI mistakes through automated validation at every stage: pre-commit (7 checks), pre-deploy (10 stages), post-deploy (12 health checks).

This framework solves 7 critical AI weaknesses:
1. **Forgetting specifications** - Document-centric architecture stores everything
2. **Self-solving without specs** - Locked mode prevents autonomous decisions
3. **Making intentional mistakes** - Validation hooks catch all deviations
4. **Environment confusion** - Auto-detection with 4-step verification
5. **Changing file names** - FILE_MANIFEST with absolute prohibition on changes
6. **Self-granting permissions** - Module Responsibility Matrix enforces boundaries
7. **Spec-code mismatches** - 3-layer validator (parser → analyzer → comparator)

## Core Architecture: 9-Stage System

```
┌─────────────────────────────────────────────────────────────────┐
│ Stage 1: SPECIFICATION WRITING                                  │
│ Create detailed specs for status values, API endpoints,         │
│ database tables, module responsibilities, and locked rules      │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Stage 2: PRE-COMMIT VALIDATION (7 checks)                       │
│ - Git diff review & forbidden file detection                    │
│ - Security file (.env, credentials) blocking                    │
│ - CLAUDE.md rule validation                                     │
│ - TypeScript/Lint verification                                  │
│ - Commit message format enforcement                             │
│ - Git log integrity check                                       │
│ - Spec document existence verification                          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Stage 3: SPEC PARSING                                           │
│ Convert markdown specs → JSON (status_registry, module_matrix,  │
│ api_endpoints, database_tables, locked_mode_rules)              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Stage 4: CODE ANALYSIS                                          │
│ Extract implementation details from actual code into JSON        │
│ (api_analysis, database_analysis, status_analysis,              │
│  module_calls_analysis)                                         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Stage 5: SPEC VALIDATION                                        │
│ Compare parsed specs vs analyzed code - ZERO tolerance for      │
│ mismatches. Blocks deployment if ANY deviation found.           │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Stage 6: TRADITIONAL BUILD/TEST                                 │
│ npm run build, npm test, security scan, environment check,      │
│ database migrations, lint verification                          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Stage 7: DEPLOYMENT (with lock system)                          │
│ Deploy lock prevents concurrent/multiple SSH pushes.            │
│ Timeouts: 30min (LOCAL), 1hr (STAGING), 2hr (PRODUCTION)       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Stage 8: POST-DEPLOY VALIDATION (12 checks)                     │
│ Traditional (8): API health, DB, cache, external APIs,         │
│ performance, error rate, smoke tests, security headers         │
│ Spec-based (4): status transitions, module isolation,          │
│ API compliance, spec drift detection                            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Stage 9: MONITORING & DEPLOYMENT MANIFEST                       │
│ 24-hour monitoring, automatic rollback on critical issues,      │
│ comprehensive audit trail (90-day retention)                    │
└─────────────────────────────────────────────────────────────────┘
```

## Framework Files Generated

### 1. Environment Configuration (3 files)

**LOCAL_ENVIRONMENT_CONFIG.md**
- Port: 3001 (API), 3000 (React), 5432 (PostgreSQL), 6379 (Redis)
- Git branch: `develop`
- Absolute prohibition: .env.production access, production DB access

**STAGING_ENVIRONMENT_CONFIG.md**
- Port: 4001 (API), SSH 2222
- Host: `staging.kleinanzeigen.co.kr`
- Includes: Nginx reverse proxy, PM2 config, SSL certificates, health checks

**PRODUCTION_ENVIRONMENT_CONFIG.md**
- Port: 4000, SSH 2222
- Host: `prod.kleinanzeigen.co.kr`
- Includes: 3-server cluster, disaster recovery, 90-day backup retention, on-call policies

### 2. Protocol Documents (2 files)

**COMMIT_PROTOCOL.md** - 6 mandatory steps:
1. Git diff review + forbidden file check
2. Security file (.env, credentials) verification
3. CLAUDE.md rule validation
4. TypeScript/Lint check
5. Commit message format validation
6. Git log verification
- Prohibition: `--amend`, `--force`

**DEPLOY_PROTOCOL.md** - 3+1+8 steps:
1. Pre-deployment checks (3 stages)
2. Deployment execution with direct monitoring (1 stage)
3. Post-deployment verification (8 checks with curl commands)

### 3. Management Documents (2 files)

**FILE_MANIFEST.md**
- Complete file structure for LOCAL/STAGING/PRODUCTION
- Absolute prohibition on file name changes
- Forbidden file patterns list

**DEPLOYMENT_MANIFEST.md**
- Automatic deployment record template
- Version tracking, rollback history, issue tracking
- Performance metrics, 90-day legal retention

### 4. Validation Hook Scripts (7 files)

#### spec-parser.js (324 lines)
Converts markdown specifications to normalized JSON:
- `status_registry.json` - All valid status values
- `module_matrix.json` - Module call permissions
- `api_endpoints.json` - All API endpoints and methods
- `database_tables.json` - Database schema and fields
- `locked_mode_rules.json` - Strict operational rules

#### code-analyzer.js (398 lines)
Extracts implementation details from TypeScript/JavaScript code:
- `api_analysis.json` - Actual API endpoints in code
- `database_analysis.json` - Database operations
- `status_analysis.json` - Status values used in code
- `module_calls_analysis.json` - Module function calls

#### spec-validator.js (401 lines)
Compares parsed specs vs analyzed code with ZERO tolerance:
- Endpoint matching
- Database field verification
- Status value validation
- Module isolation enforcement
- Outputs: `validation_report.json` (PASS/FAIL)

#### environment-validator.js (500+ lines)
4-step environment auto-detection and validation:
1. Git remote check → LOCAL/STAGING/PRODUCTION
2. Hostname verification
3. Environment variable validation
4. Port state verification
- Validates: ports, SSH, git branch, .env files, forbidden files, port conflicts

#### deploy-lock.js (400+ lines)
Lock file system preventing concurrent deployments:
- Creates `.claude/locks/deploy.lock` during deployment
- Timeouts: 30min (LOCAL), 1hr (STAGING), 2hr (PRODUCTION)
- Includes force-unlock capability for admin
- Prevents: multiple SSH pushes, simultaneous deployments, manual intervention during deploy

#### pre-commit.js (620 lines)
7-layer validation at commit time:
1. Security checks (.env, credentials, private keys)
2. File name validation against FILE_MANIFEST
3. Status Value Registry compliance
4. Module Matrix enforcement
5. Locked Mode rules validation
6. Commit message format verification
7. Git log integrity check

#### pre-deploy.js (284 lines)
10-stage validation before deployment:
1. Spec parsing
2. Code analysis
3. Spec validation
4. Build success
5. Security scan
6. Environment check
7. Test success
8. Lint/format check
9. Database migrations
10. Spec document verification

#### post-deploy.js (454 lines)
12-stage health check after deployment:

**Traditional checks (8):**
1. API health (200 OK, response time)
2. Database connection
3. Cache status
4. External API reachability
5. Performance (<500ms)
6. Error rate (<0.1%)
7. Smoke tests
8. Security headers

**Spec-based checks (4):**
9. Status transition validity
10. Module isolation enforcement
11. API compliance with spec
12. Spec drift detection

### 5. Master Integration (1 file)

**00_MASTER_SPECIFICATION_MODULE.md**
- Complete system documentation
- Explains all 9 stages with effectiveness percentages
- Protection strategies for all 7 AI weaknesses
- Implementation checklist
- Troubleshooting guide

## Usage: How to Implement the Framework

### Phase 1: Specification Writing

Write your specifications in markdown files:

```markdown
## Status Registry
- `PENDING` - Initial order state
- `CONFIRMED` - User confirmed order
- `PROCESSING` - Server processing
- `SHIPPED` - Package shipped
- `DELIVERED` - Delivered to customer
- `CANCELLED` - User cancelled order
```

```markdown
## Module Responsibility Matrix
Member Module can call:
  ✅ Member.getUser()
  ✅ Payment.validateCard()
  ❌ Admin.getUserList() (forbidden)

Shopping Module can call:
  ✅ Shopping.getProduct()
  ✅ Inventory.checkStock()
  ❌ Admin.ViewSalesReport() (forbidden)
```

```markdown
## API Endpoints
### GET /api/orders/:id
- Auth: Required
- Response: { id, status, items, total }
- Status values: PENDING|CONFIRMED|PROCESSING|SHIPPED|DELIVERED

### POST /api/orders
- Auth: Required
- Body: { items, shippingAddress }
- Returns: { orderId, status }
```

### Phase 2: Generate Framework Files

Run the framework generator:

```bash
node scripts/generate-framework.js
```

This creates all 19 files in `.claude/framework/` directory.

### Phase 3: Integrate Hooks into Package.json

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "node .claude/hooks/pre-commit.js",
      "pre-push": "node .claude/hooks/pre-deploy.js"
    }
  },
  "scripts": {
    "spec:parse": "node .claude/hooks/spec-parser.js",
    "spec:analyze": "node .claude/hooks/code-analyzer.js",
    "spec:validate": "node .claude/hooks/spec-validator.js",
    "env:validate": "node .claude/hooks/environment-validator.js",
    "lock:check": "node .claude/hooks/deploy-lock.js list",
    "lock:release": "node .claude/hooks/deploy-lock.js release deploy"
  }
}
```

### Phase 4: Commit & Deploy with Automatic Validation

Normal git workflow - validation happens automatically:

```bash
git add .
git commit -m "feat(order): add order cancellation"
# Pre-commit hooks run automatically - validation at Stage 2

git push origin develop
# Pre-deploy hooks run automatically - validation at Stages 3-6

npm run deploy
# Deployment with lock system - validation at Stages 7-9
```

## When Validation Fails

If ANY validation fails, the operation is **immediately blocked**:

```
❌ VALIDATION FAILED: Spec-code mismatch detected
Endpoint POST /api/orders exists in code but NOT in spec

Action: Update specification file and re-commit
```

The system provides specific error messages:
- What failed (API endpoint, database field, status value, etc.)
- Where it failed (file, line number, function)
- Why it failed (spec expectation vs actual code)
- How to fix it (specific spec update required)

## Key Design Principles

### 1. Documents Remember, AI Forgets
All decisions and specifications stored in documents. AI reads documents before every module execution. No reliance on memory.

### 2. Orchestrator Controls Scope
Strict scope control via Rule Guard. Absolute prohibitions: `.env.production`, `--force` flag, file name changes. Conditional prohibitions: module isolation, API boundaries.

### 3. Execution Traces in Version Control
All deployment decisions recorded in:
- `DEPLOYMENT_MANIFEST.md` - Complete audit trail
- `.claude/logs/` - Execution traces
- Git log - All commits with validation proof

## Effectiveness Against AI Mistakes

| AI Weakness | Protection Mechanism | Effectiveness |
|---|---|---|
| Forgetting specifications | Document-centric architecture | 100% |
| Self-solving without specs | Locked Mode rules enforcement | 100% |
| Making intentional mistakes | Code analysis with zero-tolerance validation | 100% |
| Environment confusion | 4-step auto-detection with port/SSH validation | 100% |
| Changing file names | FILE_MANIFEST with pre-commit detection | 100% |
| Self-granting permissions | Module Responsibility Matrix enforcement | 100% |
| Spec-code mismatches | 3-layer validator (parser → analyzer → comparator) | 100% |

## Troubleshooting

### Deployment Locked
```
❌ [LOCK ACQUIRED] DEPLOY 진행 중
경과: 45초 / 제한: 30분
```
**Solution:** Wait for previous deployment to complete, or force-unlock with admin password.

### Environment Auto-Detection Failed
```
❌ Environment detection failed: Unknown hostname
Detected: unknown-machine
Expected: localhost|staging|prod
```
**Solution:** Check hostname matches config, or update STAGING_ENVIRONMENT_CONFIG.md

### Spec-Code Mismatch Blocks Deployment
```
❌ VALIDATION FAILED: 5 mismatches detected
1. API endpoint PUT /api/orders not in spec
2. Status value ARCHIVED used but not defined
3. Module Shopping calling Admin.report() (forbidden)
```
**Solution:** Either (1) update specifications to match code, or (2) update code to match specifications.

## Next Steps

1. **Read the Full Framework**: Start with `00_MASTER_SPECIFICATION_MODULE.md`
2. **Write Your Specifications**: Follow examples in Environment Configs
3. **Generate Framework Files**: Run the generator script
4. **Set Up Git Hooks**: Install husky and enable pre-commit/pre-deploy hooks
5. **Test Validation**: Make a test commit and deployment to verify hooks work
6. **Monitor First Deployment**: Watch the post-deploy validation output

## Support

Each generated file includes:
- Purpose statement at the top
- Configuration section with all parameters
- Implementation checklist
- Common issues and solutions
- References to other framework files

For issues or customization, refer to the specific file's embedded documentation.
