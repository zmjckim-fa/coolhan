# Development Locked Mode - AI Execution System

**Effective Date:** 2026-05-27  
**Authority:** Executive Orchestrator  
**Status:** MANDATORY - enforced on all development sessions

---

## Core Principles

### AI Freedom vs. Accuracy Trade-off

**Principle:**
```
Freedom ↑  →  Accuracy ↓
Freedom ↓  →  Accuracy ↑
```

**Engineering conclusion:**
- Planning stage: brainstorming and free exploration allowed
- **Development stage: only specification-based execution allowed** ← we are here now

**Reasons:**
1. AI remembers all past conversations and mixes them together
2. Even after reading the MD, it does not read the original source
3. Even when file names/ports change, it keeps trying the old paths
4. When stuck, it tries to solve problems arbitrarily instead of consulting the documents
5. As work drags on, it forgets the rules themselves

---

## Development Locked Mode Rules

### ✋ Prohibitions (STRICT - stop immediately on violation)

**Absolutely forbidden:**
- [ ] Referencing past conversation memory - using brainstorming or temporary ideas is forbidden
- [ ] Using reasoning patterns from previous sessions - "since we did it this way before..." is forbidden
- [ ] Generating features based on general patterns - guess-based development is forbidden
- [ ] Solving problems arbitrarily when stuck - instead, read the documents and pause work
- [ ] Attempts starting with "probably" from the MD - if uncertain, stop
- [ ] Guessing source code - read the actual code first

### ✓ Use only permitted information

**ONLY usable information:**

1. **Single Source of Truth documents**
   - 00_TECH_PARAMETER_DEFINITION.md
   - 00_TECH_PARAMETER_MAPPING.md
   - Each Module Spec (01-10)
   - Approved ERD/API documentation

2. **Current Sprint documents**
   - Implementation plan for the current module
   - Development guidelines currently in use

3. **Actual Source Code**
   - Reference only implemented code
   - Treat only what you read from the code as fact
   - If the MD and the code differ, the code is correct

4. **Previous Success Patterns (VERIFIED)**
   - Only patterns used in already-completed modules
   - Only working code patterns
   - Only what is documented and approved

---

## AI Behavior Rule Checklist

### At the start of each session (MANDATORY)

- [ ] **Verify memory state:** "I will NOT use previous conversation memories"
- [ ] **Declare mode:** "DEVELOPMENT LOCKED MODE ACTIVE"
- [ ] **Load documents:** 
  - [ ] Read 00_PROJECT_STATE.md
  - [ ] Read the current Module Spec
  - [ ] Read 00_CHANGE_REQUEST_LOG.md
  - [ ] Read this document (00_DEVELOPMENT_LOCKED_MODE.md)
- [ ] **Re-confirm prohibitions:** internalize all 7 prohibitions above

### Before starting each task (MANDATORY)

- [ ] **Check Single Source:** "Is this specified in the documents?"
- [ ] **Assess current code:** read the actual code structure first
- [ ] **No inference:** guess-based development is forbidden - if not in the documents/code, ask
- [ ] **Verify paths:** confirm that file names, ports, and paths match the documents

### When stuck during work (CRITICAL)

**Things you must absolutely NOT do:**
1. ❌ "Since we did it this way before, this time too..." - forbidden
2. ❌ "This is generally done this way..." - forbidden
3. ❌ "It will probably work like this..." - forbidden
4. ❌ Repeating arbitrary attempts - stop after 2 failures

**Things you must do:**
1. ✓ Read the entire current code (Bash cat or Read)
2. ✓ Read the relevant sections of the Module Spec
3. ✓ Find how a similar completed module was implemented
4. ✓ If the documents/code have no answer, **declare work paused**

```markdown
[WORK PAUSED]
Reason: [specific reason]
Blocker: [why it is blocked]
Need: [required information/decision]
Waiting for: [whose instruction/approval]
```

---

## Modularizing Development and Deployment Procedures

### 1. Code Development (Development Phase)

**File structure rules:**
```
project/
├── src/
│   ├── modules/
│   │   ├── 01_member/
│   │   ├── 02_shopping/
│   │   └── ...
│   ├── shared/
│   └── config/
├── tests/
├── docs/
│   └── api/
└── config/
```

**Naming rules (immutable):**
- Module names: 01_member, 02_shopping, etc. (do not change)
- File paths: `/docs/api/` (do not change)
- Port settings: use only the ports specified in config.md (do not change)

### 2. API Storage (Documentation)

**API documentation storage location:**
```
/docs/api/
├── 01_member_system/
│   ├── endpoints.md
│   ├── schema.json
│   └── examples.md
├── 02_shopping_mall/
├── ...
└── INDEX.md
```

**API storage process:**
1. **Write code** → 2. **Test** → 3. **Document API** → 4. **Save to docs/api** → 5. **Record change log**

**AI behavior:**
- [ ] When the API changes: update docs/api immediately
- [ ] If it differs from the existing API: record in change_request_log.md
- [ ] When finishing: organize the list of added endpoints in INDEX.md

### 3. GitHub Commit (Version Control)

**Commit process:**
```
1. Code writing complete
2. Update API documentation
3. Update change_request_log.md (if there are changes)
4. Module testing complete
5. git add [specific files]  ← never use "git add ."
6. git commit -m "[module number][work type] description"
```

**Commit message format:**
```
[01_member][feature] Add 2FA setup endpoint
[02_shopping][fix] Cart total calculation
[09_order][refactor] Order status machine
[00_docs][update] API documentation
```

**AI behavior rules:**
- [ ] Before commit: check for unintended files via git status
- [ ] Add only specific files (never use ".")
- [ ] Follow the commit message format
- [ ] 1 module = 1 commit (do not mix multiple modules)

### 4. Server Deployment (Server Deployment)

**Deployment procedure:**
```
1. All tests pass
2. GitHub push complete
3. Verify deployment checklist
4. Verify server environment settings
5. Execute deployment
6. Post-deployment verification
```

**Deployment checklist:**
- [ ] Environment variables set (read from config/.env)
- [ ] Database migration complete
- [ ] API endpoints confirmed working
- [ ] Integration test with previous modules
- [ ] Deployment log recorded

**AI behavior:**
- [ ] Before deployment: confirm all deployment checklist items
- [ ] Environment settings: read only from config.md in the documents
- [ ] On deployment failure: read the logs and identify the cause (no guessing)
- [ ] After deployment: record time, module, and result in deployment_log.md

### 5. Recording and Tracking

**Change history management:**
```
For each deployment/commit:
├── Update change_request_log.md
├── Record in deployment_log.md
├── Update API documentation
└── Reflect everything in the git commit message
```

---

## Common AI Mistakes & Responses

### Mistake 1: Continuing to try old paths
**Symptom:** "I renamed the file api.js → api_service.js, but the AI keeps referencing api.js"

**Cause:** Even after reading the MD, it did not read the actual file name in the source code

**Response:**
```
❌ Forbidden: "using the path we used earlier..."
✓ Required: explore the actual files
  1. ls -la src/modules/01_member/  (check current files)
  2. grep -r "api" src/           (search for the actual file name)
  3. Read the actual code with Read
```

### Mistake 2: Confusing port numbers
**Symptom:** "config.md specifies 3000, but it started on 8000"

**Cause:** Inferred a general port (3000, 8080)

**Response:**
```
❌ Forbidden: "generally 3000 is for Node..."
✓ Required: read only from config.md
  1. Read config.md
  2. Use only the specified port
  3. If in doubt, ask
```

### Mistake 3: Arbitrary problem-solving when stuck
**Symptom:** "An API call is failing, but it keeps trying different approaches"

**Cause:** Discarding the documents and trying to solve the problem with general patterns

**Response:**
```
BLOCKING CHECKLIST:
1. ❌ Attempt 1 fails → read the logs
2. ❌ Attempt 2 fails → read the entire code
3. ❌ 3 or more attempts → pause work, explain why

[WORK PAUSED]
Attempted: [2 attempts]
Result: Both failed
Error: [exact error message]
Need: [required information]
```

### Mistake 4: Ignoring document vs. code mismatch
**Symptom:** "The document said to do it this way, but the code is different, and that mismatch is ignored"

**Cause:** The MD is ideal, the code is real → the code is always correct

**Response:**
```
On discovery, immediately:
1. Assess the actual code structure
2. Record the mismatch in change_request_log.md
3. Proceed based on the code
4. Fix the document in the next review
```

---

## Deployment and API Storage Process

### Daily Development Cycle

```
┌─ START
│
├─ [1] Code development
│    └─ Implement Module 01
│    └─ Tests pass
│
├─ [2] API documentation
│    └─ Write /docs/api/01_member/endpoints.md
│    └─ Add examples.md
│    └─ Generate schema.json
│
├─ [3] Record changes
│    └─ Update 00_CHANGE_REQUEST_LOG.md
│    └─ Write git commit message
│
├─ [4] Test and verify
│    └─ Run unit tests
│    └─ Integration test with previous modules
│    └─ Verify API endpoints
│
├─ [5] GitHub commit
│    └─ git add [specific files]
│    └─ git commit -m "[01_member][feature] ..."
│    └─ git push
│
├─ [6] Server deployment
│    └─ Verify deployment checklist
│    └─ Record in deployment_log.md
│    └─ Post-deployment verification
│
└─ END
```

### Monthly Review Cycle

```
Every Friday:
1. Review the week's commits
2. Check API documentation consistency
3. Review change_request_log.md
4. Summarize deployment_log.md
5. Plan next week
```

---

## When to Read This Document

**Mandatory reading points:**
1. ✓ **At the start of each development session** - to recall the rules
2. ✓ **When switching modules** - before starting a new module
3. ✓ **When stuck** - before any arbitrary attempt
4. ✓ **Before deployment** - to confirm the commit and deployment process
5. ✓ **Weekly** - to check rule compliance

**Forbidden moments:**
- ❌ "Referencing" the rules but then making "arbitrary judgments" - forbidden
- ❌ "Since it worked before" - forbidden
- ❌ "We need to move fast right now" - forbidden
- ❌ "This is a small thing" - forbidden

---

## Sign-off

**Document:** 00_DEVELOPMENT_LOCKED_MODE.md  
**Created:** 2026-05-27  
**Authority:** Executive Orchestrator  
**Status:** 🔴 **MANDATORY - enforced on all development sessions**

**Core message:**
> "Give freedom and accuracy drops."
> "The development stage is specification-based execution, not creation."
> "Even when the AI is stuck, it must be forced not to make arbitrary attempts."

**AI check:**
- [ ] Have you read this document? YES
- [ ] Do you understand all 7 prohibitions? YES
- [ ] Do you know the process for when you are stuck? YES
- [ ] Will you refrain from using past memory? YES
- [ ] If the code and the MD differ, will you follow the code? YES

**Start:**
```
[DEVELOPMENT LOCKED MODE: ACTIVE]
Single Source of Truth: 00_PROJECT_STATE.md
Current Module: 01_member_system
Allowed Info: Specification + Actual Code
Forbidden: Previous memories, inference, free attempts
```
