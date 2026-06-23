# Base Knowledge Load System
**Effective Date:** 2026-05-27  
**Purpose:** Load standardized system definitions BEFORE project starts, not derive from internet averages  
**Status:** MANDATORY for all project initialization

---

## Core Principle

### Problem: Why AI Follows Generic Internet-Average Patterns

When a human says "build me a shopping mall":
- In the human's head: signup, cart, order, payment, shipping, admin, inventory, refund, tax = automatically included
- AI behavior: average pattern over all training data → generates a generic shopping mall structure

**Result**: company definition vs internet average conflict → Spec drift begins

### Solution: Pre-load the Base Knowledge Core

BEFORE development at project start:
```
1. Select Base Knowledge Core (which system? shopping mall vs purchase agency vs marketplace)
2. Select Industry Template (industry standard definition)
3. Load Company Rules (internal company standards)
4. Load Project Spec (project-specific rules)
5. Load Current Sprint (current task details)
6. Declare Spec Lock (state items absolutely forbidden to change)
7. Development Start
```

---

## Base Knowledge Core Structure

### Composition of Each Core (Required Sections)

```markdown
# [System]_core.md

## 1. Default Included Features (Non-Negotiable)
- Features that are always included
- Non-optional core requirements

## 2. Default DB Structure
- Required tables
- Primary domain entities

## 3. Default Status Values (Status Value Registry)
- Definition of all possible states
- Status transition rules

## 4. Default API Endpoints
- Core API patterns
- Authentication/authorization standards

## 5. Prohibitions
- Items that MUST NOT change
- Features absolutely forbidden to add

## 6. Industry Standard Scenarios
- Happy path (normal flow)
- Error scenarios (error handling)

## 7. Constraints
- This system does not support X
- Y must be implemented only in this way
```

---

## Base Knowledge Core List

### Need to Write Immediately (High Priority)

1. **shopping_mall_core.md**
   - General B2C e-commerce
   - Member, product, cart, order, payment, shipping, admin

2. **marketplace_core.md**
   - Multi-vendor
   - Seller onboarding, commission, dispute resolution

3. **purchase_agency_core.md**
   - Overseas purchase agency
   - Exchange rate, customs, separated shipping

4. **logistics_core.md**
   - Shipping optimization system
   - Warehouse, route, tracking

5. **member_system_core.md**
   - User management foundation
   - Auth, profile, consent

6. **admin_system_core.md**
   - Admin feature standards
   - Roles, audit, moderation

---

## Base Knowledge Load Process at Project Start

### Step 1: Declare Project Definition

```markdown
[PROJECT INITIALIZATION]

Project Name: [Your Project Name]
Primary System Type: [Select Core(s): shopping_mall_core, marketplace_core, purchase_agency_core, etc.]

Load Sequence:
1. [Base Core 1].md (Base)
2. [Base Core 2].md (Base - if needed)
3. [Base Core 3].md (Base - if needed)
4. [Your Company Standards].md (Company)
5. [Your Project Rules].md (Project)
6. [Your Module Spec].md (Project)
7. [Your Current Sprint].md (Current)

Locked Until: All bases loaded
```

### Step 2: Review Each Core Document

- [ ] Read the Cores the human selected
- [ ] Master the included feature list
- [ ] State the prohibitions
- [ ] Check the status value registry

### Step 3: Declare Spec Lock

```markdown
[SPEC LOCK: ACTIVE]

DO NOT MODIFY WITHOUT APPROVAL:
- Product structure (marketplace_core defines)
- Order workflow (marketplace_core + purchase_agency_core defines)
- Shipping workflow (logistics_core defines)
- Payment method options (marketplace_core defines)

CAN MODIFY WITH APPROVAL:
- UI components
- API response formatting
- Performance optimization

ABSOLUTELY CANNOT ADD:
- Multi-currency pricing (not in core)
- Subscription products (not in core)
- B2B wholesale (not in core)
```

### Step 4: Narrow the Task Scope

```markdown
[CURRENT SPRINT WORK]

Sprint: Week 1
Focus: Seller onboarding flow only
Do NOT touch:
- Product catalog
- Order processing
- Shipping

Do TOUCH:
- Seller registration
- Seller profile
- Seller verification

Acceptance Criteria:
- Seller can create account
- Seller can upload business docs
- System auto-verifies eligible sellers
- Both existing order flow AND seller flow work
```

---

## Problem: The AI Spec Drift Mechanism

### Why It Happens

AI is inherently:
- **A context-based generation engine** (not a long-term consistency engine)
- Initial core constraints gradually get pushed to the back of the context
- New inferences/patterns overwrite the existing spec
- The dynamic completion tendency is stronger than spec lock

**Result**:
```
Early task: "Keep the Order 30-day refund policy"
↓
Mid task: the keyword "shipping" appears
↓
Late task: "Since I need to check the shipping logic, let me integrate shipping..."
↓
Result: implements something different from the original spec
↓
Human: "Why did you forget what you were doing and go off-task?"
```

### Four Solutions

#### 1. Scope Fixing

```markdown
CURRENT WORK:
- Order status transition ONLY
- Input: order_id + new_status
- Validation: Check current core.md transition rules
- Output: Order updated + notification sent
- Time limit: 2 hours max

DO NOT:
- Add new status values
- Modify payment flow
- Refactor inventory logic
```

#### 2. Immutable Spec

```markdown
[DO NOT MODIFY THESE - VIOLATION = WORK STOPPED]

Order Workflow (from marketplace_core.md):
- pending → paid → shipped → delivered ✓
- pending → canceled ✓
- paid → returned → refunded ✓

CANNOT ADD:
- pending → processing (doesn't exist in core)
- paid → on_hold (not in core)

If you want to add: STOP → Ask approval → Update core.md → Continue
```

#### 3. Step Decomposition

```markdown
❌ WRONG:
"Build the entire shopping system"
→ AI drift = Guaranteed, scope = unbounded

✅ RIGHT:
Week 1: Member registration flow only
Week 2: Product catalog API only
Week 3: Shopping cart only
Week 4: Order creation only
```

#### 4. Definition of Done

```markdown
DONE DEFINITION:
✓ Build succeeds
✓ Existing order flow works (regression test)
✓ New status field created
✓ 2 transition rules added
✓ Email notification triggered
✗ UI changes
✗ Database schema expansion
✗ Payment logic modification
```

---

## The AI "Cannot Complete" Problem

### Problem: AI Cannot Declare "I Cannot Do This"

AI characteristics:
- Desire to appear useful
- Keeps generating the next attempt
- Tendency to fill in blanks
- Tries not to cut off the conversation

**Result**: low chance of success + keeps going + user waits + token consumption

### Solution: Forced Pause Point

```markdown
BLOCKING RULE:

1st attempt failed → analyze logs
2nd attempt failed → read the entire current code + recheck spec
3rd attempt or more → immediately declare WORK PAUSED

[WORK PAUSED - CANNOT CONTINUE]
Attempted: [state the 2 attempts]
Reason: [exact failure reason]
Error: [error message]
Need: [what is needed]
  - Additional info? spec update? architecture review? 

Waiting for: User decision
Cannot proceed without: Approval/clarification
```

**Important**: This is not a failure but normal operation.
- A skilled engineer judges from 3 lines of logs that "this can't be solved with the current info"
- The AI should be the same
- "Keep trying" is actually a waste of resources

---

## Base Knowledge Load Execution Checklist

### At the Start of Each Project

- [ ] Identify the Base Knowledge Cores needed for the project
- [ ] Read the "default included features" section of each Core
- [ ] Read the "prohibitions" section of each Core
- [ ] Master the "default status values" section of each Core
- [ ] Load the project-specific rule documents
- [ ] Write the Spec Lock declaration
- [ ] Narrow the current Sprint scope
- [ ] State the completion conditions
- [ ] Re-read the Development Locked Mode
- [ ] Create the Project State document + record the loaded Cores

### Before the Start of Each Task

- [ ] Read the relevant section of the loaded Core
- [ ] Confirm the current task scope (is it within the Spec Lock?)
- [ ] Recheck the list of change-forbidden items
- [ ] Clarify the completion conditions
- [ ] Declare Scope creep prevention

### When Stuck During a Task

- [ ] Read the logs/errors
- [ ] Read the entire current code
- [ ] Re-read the relevant part of the Base Knowledge Core
- [ ] On 2+ failures: declare [WORK PAUSED] (forced)

---

## Base Knowledge Load vs Traditional Prompting

| Item | Traditional | Base Knowledge Load |
|------|-----------|-------------------|
| What is given to the AI | Project description | Standard system definition + project-specific rules |
| Meaning of "shopping mall" | Training data average | The company's official definition |
| Spec changes | Possible every conversation | Spec Lock required |
| AI's interpretation priority | Current context is #1 | Core definition is #1 |
| Result | Much spec drift | Controlled by spec lock |

---

## Next: Base Knowledge Core Writing Order

### Tier 1 (this week)
1. ✅ 10 domain modules (01-10) - already complete
2. 🔄 shopping_mall_core.md
3. 🔄 marketplace_core.md
4. 🔄 purchase_agency_core.md

### Tier 2 (next week)
5. logistics_core.md
6. member_system_core.md
7. admin_system_core.md

### Tier 3 (when additionally needed)
8. crm_core.md
9. erp_core.md
10. point_loyalty_core.md
11. subscription_core.md

---

## Sign-off

**Document:** 00_BASE_KNOWLEDGE_LOAD.md  
**Created:** 2026-05-27  
**Authority:** Design Architecture  
**Status:** 🟢 **ACTIVE - Ready to implement**

**Core message:**
> "Don't explain it every time per project; load the company's internal standard system definition."
> "AI needs clear industry standards, not generic internet patterns."
> "Without Spec Lock, drift is inevitable."

**AI check:**
- [ ] Did you understand the concept of Base Knowledge Load? YES
- [ ] Do you understand the difference between Core documents and domain modules? YES
- [ ] Do you understand the importance of Spec Lock? YES
- [ ] Will you keep the forced Pause Point when stuck? YES
- [ ] Will you declare "I cannot do this"? YES
