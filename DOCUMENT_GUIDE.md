# CoolHan Complete Documentation Guide - Detailed Breakdown by Type

**Written:** 2026-05-27  
**Purpose:** Understand at a glance the role, when to read, and how to write each document

---

## 📚 Document Types and Classification

### 🔴 Essential Documents (must read)

| Document | When to Read | Role | Length |
|------|---------|------|-----|
| README.md | First | Full CoolHan overview | 10 min |
| INSTALLATION_GUIDE.md | When installing | Installation and basic usage | 15 min |
| 00_AI_MASTER_RULES.md | Before starting development | 11 AI execution rules | 20 min |
| 00_DEVELOPMENT_LOCKED_MODE.md | Before each task | Strict development mode | 10 min |

### 🟠 Important Documents (per project)

| Document | Use | Role | Length |
|------|------|------|-----|
| 00_BASE_KNOWLEDGE_LOAD.md | Project initialization | Core loading process | 15 min |
| 00_ARCHITECTURE_CONFLICT_RESOLUTION.md | Multiple modules | How to resolve 11 conflicts | 20 min |
| 00_STATUS_VALUE_REGISTRY.md | API/DB design | Definitions of all status values | 30 min |
| 00_MODULE_RESPONSIBILITY_MATRIX.md | Permission setup | Module responsibility matrix | 25 min |

### 🟡 Optional Documents (for reference)

| Document | Use | Role | Length |
|------|------|------|-----|
| 00_SPECIFICATION_PARAMETERIZATION_SYSTEM.md | Requirements | Parameterized spec | 20 min |
| 00_DESIGN_PARAMETERIZATION_SYSTEM.md | Design | Parameterized design | 20 min |
| 00_CORE_PRINCIPLES_SYSTEM.md | Concept understanding | 3 core principles | 10 min |
| 00_KNOWLEDGE_BASE_EXTENSIBILITY.md | Extension | How to extend the Core | 15 min |

### 🟢 Base Knowledge Cores

| Core | Project Type | Role | Length |
|------|-------------|------|-----|
| shopping_mall_core.md | B2C e-commerce | Shopping mall standard | 40 min |
| marketplace_core.md | Multi-seller | Marketplace standard | 50 min |
| purchase_agency_core.md | Overseas purchase agency | Purchase agency standard | 45 min |
| logistics_core.md* | Shipping management | Shipping standard | (planned) |
| member_system_core.md* | Member management | Member standard | (planned) |
| admin_system_core.md* | Admin | Admin standard | (planned) |

*Planned documents

### 🔵 Domain Module Descriptions (for reference)

| Module | Feature | Role | Length |
|------|------|------|-----|
| 01_member_system | Member | Signup, login, profile | 20 min |
| 02_shopping_mall | Product/cart | Product catalog, purchase | 20 min |
| 03_payment_system | Payment | Payment, refund, settlement | 20 min |
| 04_shipping_logistics | Shipping | Shipping management, tracking | 20 min |
| 05_admin_system | Admin | Admin features, audit | 20 min |
| 06_notification | Notification | Notification, email, SMS | 15 min |
| 07_review_rating | Review | Review, rating, comment | 15 min |
| 08_inventory_management | Inventory | Stock, reservation, adjustment | 20 min |
| 09_order_management | Order | Order, return, settlement | 20 min |
| 10_gdpr_privacy | Privacy | Consent, deletion, protection | 15 min |

---

## 1️⃣ Essential Documents Detailed Guide

### README.md
**When:** Very first  
**Reading time:** About 10 minutes  
**Role:** Full CoolHan overview  

**Contents:**
```
- What is CoolHan?
- 5 problems it solves
- 5 core features
- Directory structure
- 3-step quick start
- 5 core concepts
- 11 architecture conflict resolutions
- Tech stack
- Roadmap
```

**Checklist:**
- [ ] Understand CoolHan's purpose
- [ ] Identify your project type (e.g., shopping mall)
- [ ] Decide which Core to load
- [ ] Distinguish Base Knowledge Core vs Domain Module

**Next:** Go to INSTALLATION_GUIDE.md

---

### INSTALLATION_GUIDE.md
**When:** When installing  
**Reading time:** About 15 minutes  
**Role:** Installation and basic usage  

**Contents:**
```
- Overview
- System requirements
- 4-step installation
- Project start checklist
- Documentation structure explanation
- 3 usage methods
- 5 FAQs
- Troubleshooting
- Support and feedback
```

**Checklist:**
- [ ] Successfully cloned from GitHub
- [ ] Verified directory structure
- [ ] Found the 4 core documents
- [ ] Installed VS Code extension (optional)
- [ ] Ran local HTTP server (optional)

**Next:** Go to 00_AI_MASTER_RULES.md

---

### 00_AI_MASTER_RULES.md
**When:** Before starting development, and throughout  
**Reading time:** About 20 minutes  
**Role:** 11 AI execution rules - the most important document  

**The 11 rules:**
```
Rule 1: Single Source of Truth
  → 9 essential documents (ERD, API spec, DB schema, etc.)

Rule 2: Absolute Prohibitions
  → 6 immediate-stop behaviors

Rule 3: Pre-task Checklist
  → 4 checks before each task

Rule 4: Task Lock (scope fixing)
  → State DO / DON'T

Rule 5: Status Report
  → Report status in every response

Rule 6: Self-Check
  → 9 self-checks

Rule 7: Stop Condition
  → [WORK PAUSED] after 3+ failures

Rule 8: Approval Gates
  → Confirm before stage transitions

Rule 9: Uncertainty Protocol
  → When multiple interpretations exist

Rule 10: Doc/Code Consistency
  → Follow code on conflict

Rule 11: Project State Storage
  → Record project state
```

**Checklist:**
- [ ] Understand all 11 rules
- [ ] Load this file into your AI tool
- [ ] Master the stop condition (Rule 7)
- [ ] Memorize the Status Report format (Rule 5)

**Next:** Go to 00_DEVELOPMENT_LOCKED_MODE.md

---

### 00_DEVELOPMENT_LOCKED_MODE.md
**When:** Before each task  
**Reading time:** About 10 minutes  
**Role:** Strict development mode - enforces not forgetting the rules  

**Core:**
```
7 prohibitions:
  ✗ Referencing memory of past conversations
  ✗ Reasoning patterns from previous sessions
  ✗ Generation based on general patterns
  ✗ Arbitrary resolution when stuck
  ✗ Attempts starting with "probably"
  ✗ Guessing source code
  ✗ Anything uncertain in the MD

Allowed information:
  ✓ Single Source of Truth documents
  ✓ Current Sprint document
  ✓ Current Module Spec
  ✓ Approved ERD/API documents
  ✓ Actually working previous code
```

**Checklist:**
- [ ] Re-check this document at the start of each task
- [ ] Master the 7 prohibitions
- [ ] Use only the 4 allowed information types
- [ ] When stuck, read the "When stuck" section of this document

**Next:** Go to project-specific documents (see below)

---

## 2️⃣ Per-Project Document Selection Guide

### Scenario 1: Building a B2C Shopping Mall

```
Project preparation:
  1. ✓ README.md
  2. ✓ INSTALLATION_GUIDE.md
  3. ✓ 00_AI_MASTER_RULES.md
  4. ✓ 00_DEVELOPMENT_LOCKED_MODE.md
  5. ✓ 00_BASE_KNOWLEDGE_LOAD.md

Core loading:
  1. ✓ shopping_mall_core.md (required)

Single Source of Truth documents to write:
  1. 01_PROJECT_OVERVIEW.md
  2. 02_REQUIREMENTS.md
  3. 03_ERD.md
  4. 04_API_SPECIFICATION.md
  5. 05_DATABASE_SCHEMA.md
  6. 06_STATUS_DEFINITIONS.md
  7. 07_PERMISSIONS.md
  8. 08_PROHIBITIONS.md

Reference during development:
  - 00_ARCHITECTURE_CONFLICT_RESOLUTION.md (optional)
  - 00_STATUS_VALUE_REGISTRY.md (reference)
  - 00_MODULE_RESPONSIBILITY_MATRIX.md (reference)

Reading time: About 2 hours
Development prep time: About 3 days
```

### Scenario 2: Building a Multi-Seller Marketplace

```
Project preparation:
  1. ✓ README.md
  2. ✓ INSTALLATION_GUIDE.md
  3. ✓ 00_AI_MASTER_RULES.md
  4. ✓ 00_DEVELOPMENT_LOCKED_MODE.md
  5. ✓ 00_BASE_KNOWLEDGE_LOAD.md

Core loading:
  1. ✓ shopping_mall_core.md (required)
  2. ✓ marketplace_core.md (required)

Single Source of Truth documents to write:
  1. 01_PROJECT_OVERVIEW.md
  2. 02_REQUIREMENTS.md
  3. 03_ERD.md
  4. 04_API_SPECIFICATION.md
  5. 05_DATABASE_SCHEMA.md
  6. 06_STATUS_DEFINITIONS.md
  7. 07_PERMISSIONS.md
  8. 08_PROHIBITIONS.md

Required during development:
  - 00_ARCHITECTURE_CONFLICT_RESOLUTION.md (required - conflict resolution)
  - 00_STATUS_VALUE_REGISTRY.md (required - status values)
  - 00_MODULE_RESPONSIBILITY_MATRIX.md (required - permissions)

Reading time: About 3 hours
Development prep time: About 5 days
Development time: About 5 months (6-person team)
```

### Scenario 3: Building an Overseas Purchase Agency System

```
Project preparation:
  1. ✓ README.md
  2. ✓ INSTALLATION_GUIDE.md
  3. ✓ 00_AI_MASTER_RULES.md
  4. ✓ 00_DEVELOPMENT_LOCKED_MODE.md
  5. ✓ 00_BASE_KNOWLEDGE_LOAD.md

Core loading:
  1. ✓ purchase_agency_core.md (required)
  2. ✓ logistics_core.md (recommended)

Single Source of Truth documents to write:
  1. 01_PROJECT_OVERVIEW.md
  2. 02_REQUIREMENTS.md
  3. 03_ERD.md
  4. 04_API_SPECIFICATION.md
  5. 05_DATABASE_SCHEMA.md
  6. 06_STATUS_DEFINITIONS.md
  7. 07_PERMISSIONS.md
  8. 08_PROHIBITIONS.md

Required during development:
  - 00_ARCHITECTURE_CONFLICT_RESOLUTION.md
  - 00_STATUS_VALUE_REGISTRY.md
  - 00_MODULE_RESPONSIBILITY_MATRIX.md

Special reference:
  - "7. Constraints" section of purchase_agency_core.md
  - "6. Industry Standard Scenarios" of purchase_agency_core.md

Reading time: About 2.5 hours
Development prep time: About 4 days
Development time: About 4 months (5-person team)
```

---

## 3️⃣ Per-Document Depth Guide

### Beginner (documents to read)
```
1. README.md                          (10 min)
2. INSTALLATION_GUIDE.md              (15 min)
3. 00_DEVELOPMENT_LOCKED_MODE.md      (10 min)
4. 1 project-related Core             (40 min)

Total: About 75 min
```

### Intermediate (additional documents)
```
The 4 beginner documents above +
5. 00_AI_MASTER_RULES.md              (20 min)
6. 00_BASE_KNOWLEDGE_LOAD.md          (15 min)
7. 00_ARCHITECTURE_CONFLICT_RESOLUTION.md (20 min)

Total: About 130 min (2 hr 10 min)
```

### Advanced (all documents)
```
The 7 intermediate documents above +
8. 00_STATUS_VALUE_REGISTRY.md        (30 min)
9. 00_MODULE_RESPONSIBILITY_MATRIX.md (25 min)
10. 00_SPECIFICATION_PARAMETERIZATION_SYSTEM.md (20 min)
11. 00_DESIGN_PARAMETERIZATION_SYSTEM.md (20 min)
12. 00_CORE_PRINCIPLES_SYSTEM.md      (10 min)
13. 00_KNOWLEDGE_BASE_EXTENSIBILITY.md (15 min)
14. Domain module descriptions (as needed) (60 min)

Total: About 350 min (5 hr 50 min)
```

---

## 4️⃣ Document Usage Checklist

### Project Start Checklist
```
□ Read README.md
□ Read INSTALLATION_GUIDE.md
□ Identify your project type (shopping mall? marketplace?)
□ Decide which Cores you need
□ Read 00_AI_MASTER_RULES.md
□ Read 00_DEVELOPMENT_LOCKED_MODE.md
□ Read 00_BASE_KNOWLEDGE_LOAD.md
□ Prepare 8 Single Source of Truth documents (or create them)
□ Load the rule documents into your AI tool
□ Start development!
```

### Daily Development Checklist
```
Morning (start development):
  □ Read 00_DEVELOPMENT_LOCKED_MODE.md for 5 min
  □ Check yesterday's project state
  □ Write today's Task Lock
  
Midday (mid-check):
  □ Re-check relevant rules in 00_AI_MASTER_RULES.md
  □ If status values changed, check STATUS_VALUE_REGISTRY
  
Evening (completion):
  □ Write today's Status Report
  □ Update the project state file
  □ Prepare tomorrow's plan
```

### When-a-Problem-Occurs Checklist
```
When stuck:
  □ Read the "When stuck during work" section of 00_DEVELOPMENT_LOCKED_MODE.md
  □ Analyze logs
  □ Read the entire current code
  □ Declare [WORK PAUSED] after 2+ failures

When a status value is unclear:
  □ Search 00_STATUS_VALUE_REGISTRY.md
  □ Check the entity's list of status values
  □ Check the state transition rules
  □ If absent, update the document

When permissions are unclear:
  □ Search 00_MODULE_RESPONSIBILITY_MATRIX.md
  □ Check the module that owns the table/API
  □ Check access permissions
  □ Check FORBIDDEN CALLS

When a conflict occurs:
  □ Search 00_ARCHITECTURE_CONFLICT_RESOLUTION.md
  □ Find the conflict number
  □ Check the "Single Source of Truth" module
  □ Implement only in that module
```

---

## 5️⃣ Document Learning Order

### By time order
```
| Time | Document | Goal |
|------|------|------|
| 0 hr | README.md | Understand the overview |
| 10 min | INSTALLATION_GUIDE.md | Complete installation |
| 25 min | 00_DEVELOPMENT_LOCKED_MODE.md | Master the rules |
| 35 min | 00_AI_MASTER_RULES.md | Understand the 11 rules |
| 55 min | 00_BASE_KNOWLEDGE_LOAD.md | Understand the Core loading process |
| 70 min | Project Core | Understand the standard definition |
| 110 min | Start writing Single Source of Truth documents | Initialize the project |
```

### By depth order
```
| Stage | Document | Content |
|------|------|------|
| Stage 1: Concept | README.md | What is CoolHan? |
| Stage 2: Installation | INSTALLATION_GUIDE.md | How to install? |
| Stage 3: Rules | 00_DEVELOPMENT_LOCKED_MODE.md | What rules? |
| Stage 4: Master | 00_AI_MASTER_RULES.md | What are all the rules? |
| Stage 5: Process | 00_BASE_KNOWLEDGE_LOAD.md | How does a project work? |
| Stage 6: Standard | Core (1) | What is our domain's standard? |
| Stage 7: Conflict resolution | 00_ARCHITECTURE_CONFLICT_RESOLUTION.md | What about multiple modules? |
| Stage 8: Status values | 00_STATUS_VALUE_REGISTRY.md | What are all the status values? |
| Stage 9: Permissions | 00_MODULE_RESPONSIBILITY_MATRIX.md | Who can do what? |
| Stage 10: Practice | Project | Start actual development |
```

---

## 6️⃣ Document Printing/Saving Tips

### Optimal print order
```
1. README.md (pages 1-2)
2. INSTALLATION_GUIDE.md (pages 3-4)
3. 00_AI_MASTER_RULES.md (pages 5-8)
4. 00_DEVELOPMENT_LOCKED_MODE.md (pages 9-11)
5. Project Core (pages 12-30)
6. 00_ARCHITECTURE_CONFLICT_RESOLUTION.md (pages 31-35)
7. 00_STATUS_VALUE_REGISTRY.md (pages 36-50)
8. 00_MODULE_RESPONSIBILITY_MATRIX.md (pages 51-60)

Total: About 60 pages (A4)
```

### Bookmark recommendations
```
VS Code:
  Ctrl+B → expand outline → bookmark major sections

GitHub:
  Save the Table of Contents link of each document

Browser:
  Pin the knowledge_base/ folder to the bookmark bar
```

### PDF conversion
```bash
# Using Pandoc
pandoc knowledge_base/00_AI_MASTER_RULES.md -o rules.pdf

# Convert all at once
for f in knowledge_base/*.md; do
  pandoc "$f" -o "${f%.md}.pdf"
done
```

---

## 7️⃣ Frequently Referenced Sections

### Frequently viewed during development
```
00_STATUS_VALUE_REGISTRY.md
  → "1. Member System" → "User Status"
  → When adding a new user status

00_MODULE_RESPONSIBILITY_MATRIX.md
  → "1. Database Tables"
  → When creating a new table
  
  → "2. API Endpoints"
  → When creating a new API

00_DEVELOPMENT_LOCKED_MODE.md
  → "When stuck during work"
  → When stuck for over 30 minutes
```

### Checking module conflicts
```
00_ARCHITECTURE_CONFLICT_RESOLUTION.md
  → "Conflict #1 ~ #11" each
  → Check each time you implement a specific feature
  
Example: trying to add a status value "payment_status"
  → Refer to "Conflict #3: Missing status value registry"
  → Check in STATUS_VALUE_REGISTRY.md
  → Read "3. Payment System" → "Payment Status" section
```

---

## 📝 Final Summary

| Document | When | How Often | Importance |
|------|------|----------|--------|
| README.md | First time | Once | ⭐⭐⭐⭐⭐ |
| INSTALLATION_GUIDE.md | When installing | Once | ⭐⭐⭐⭐⭐ |
| 00_AI_MASTER_RULES.md | Before development | Weekly | ⭐⭐⭐⭐⭐ |
| 00_DEVELOPMENT_LOCKED_MODE.md | Every morning | Daily | ⭐⭐⭐⭐⭐ |
| 00_BASE_KNOWLEDGE_LOAD.md | Project start | Once | ⭐⭐⭐⭐ |
| Core (project type) | Project start | 1-2 times | ⭐⭐⭐⭐ |
| 00_ARCHITECTURE_CONFLICT_RESOLUTION.md | As needed | 1-2 times/week | ⭐⭐⭐⭐ |
| 00_STATUS_VALUE_REGISTRY.md | As needed | 2-3 times/week | ⭐⭐⭐⭐ |
| 00_MODULE_RESPONSIBILITY_MATRIX.md | As needed | 1-2 times/week | ⭐⭐⭐ |
| Other reference documents | Advanced study | 1-2 times/month | ⭐⭐⭐ |

---

**Use this guide to efficiently leverage all of CoolHan's documents! 📚**
