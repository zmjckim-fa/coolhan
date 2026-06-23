# Core Principles of AI-Controlled Development System

## 1. Document-Centric Architecture

### 1.1 "AI does not remember. Documents remember."

```
┌─────────────────────────────────────────────────────────┐
│ AI Memory Limitation                                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ❌ AI does not remember previous conversations          │
│  ❌ AI forgets content beyond the context window        │
│  ❌ AI cannot change things on its own judgment         │
│  ❌ AI cannot interpret rules unilaterally              │
│                                                         │
│ ✅ Documents remember everything                         │
│ ✅ Documents are clear and objective                     │
│ ✅ Documents can be version-controlled                   │
│ ✅ Documents track change history                        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 1.2 Execution Principle

```
The following process is required for every module execution:

1. Document Reading
   └─ AI: read the definition document of the module (e.g., 01_basic_logic.md)

2. Parameter Validation
   └─ AI: check the project's parameters in PARAMETERS.md
   └─ e.g.: "Is the DB table name snake_case? Or PascalCase?"

3. Rule Application
   └─ AI: confirm the task scope per the Rule Guard rules
   └─ Rule Guard: "this must not be changed in this module"

4. Work Execution
   └─ AI: perform work only within the defined scope

5. QA Verification
   └─ QA Lead: is it accurate against the planning doc?
   └─ QA: were the parameters applied consistently?

Example:
  Module: "Create database schema"
  
  AI behavior:
  1. 📖 Read /docs/04_database_schema.md
  2. 🔍 Check PARAMETERS.md: "table_naming = snake_case, prefix = tbl_"
  3. 📋 Check Rule Guard: "the CREATE INDEX statement comes after query generation"
  4. 💻 Generate SQL: tbl_users, tbl_products, ... (snake_case applied)
  5. ✅ QA: "were the parameters applied consistently?" → verify

→ AI cannot arbitrarily assign different names or ignore rules
```

---

## 2. Orchestrator-Controlled Architecture

### 2.1 "AI does not develop freely"

```
┌──────────────────────────────────────────────────────────────┐
│ Development Control Layers                                   │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ 🎯 Orchestrator                                              │
│    └─ Role: lock scope, coordinate team, control progress   │
│    └─ Authority: decide task scope per module               │
│    └─ Rule: do only this in this module                     │
│                                                              │
│ 🛑 Rule Guard                                               │
│    └─ Role: prevent scope deviation                         │
│    └─ Authority: block work outside the allowed scope       │
│    └─ Rule: this must never be changed                      │
│                                                              │
│ ✅ QA Lead                                                   │
│    └─ Role: verify against the planning doc                 │
│    └─ Authority: can reject non-conforming deliverables     │
│    └─ Rule: must exactly match the planning doc definition  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 2.2 Execution Flow

```
Step 1: Orchestrator locks the scope (Scope Locking)
  ┌─────────────────────────────────────────┐
  │ Module: "Create API endpoint"            │
  │ Scope:                                   │
  │  ✅ Allowed: /api/v1/products (GET)     │
  │  ✅ Allowed: /api/v1/products (POST)    │
  │  ❌ Forbidden: change database structure │
  │  ❌ Forbidden: modify auth logic         │
  │  ❌ Forbidden: add a new table           │
  └─────────────────────────────────────────┘
  
Step 2: AI prepares the work
  ├─ 📖 Read /docs/05_api_standard.md
  ├─ 🔍 Check parameters: API version, response format
  ├─ 📋 Check scope: comply with Orchestrator rules
  └─ Ready
  
Step 3: Rule Guard prevents deviation (Deviation Prevention)
  AI: "Generating /products POST endpoint code..."
  AI: "It might be better to change the response format to JSON-LD..."
  Rule Guard: 🛑 "Stop! /docs/05_api_standard.md defined 
               the response format as 'wrapped'. 
               Change forbidden!"
  
Step 4: Work completion and submission
  └─ AI: "/api/v1/products (GET, POST) complete"
  
Step 5: QA Lead verification
  QA: "Check planning doc: /docs/05_api_standard.md"
  QA: "✅ Response format matches"
  QA: "✅ HTTP method correct"
  QA: "✅ Parameters complete"
  QA: "✅ Error handling included"
  QA: "Approved!"

→ AI cannot attempt well-meaning improvements outside the scope
→ All changes are verified
→ Compliance with the planning doc is guaranteed
```

### 2.3 Three Types of Rule Guard Rules

```
Type 1: Absolute Prohibition
  Rule: "must not generate a DELETE query"
  Reason: risk of data loss
  Application: always forbidden in all modules
  
  e.g.:
    ❌ DELETE FROM users WHERE ...
    ✅ UPDATE users SET deleted_at = NOW() WHERE ...

Type 2: Conditional Prohibition
  Rule: "to add a new table, must first get Orchestrator approval"
  Reason: database schema consistency
  Application: forbidden within the base design scope, allowed with special approval
  
  e.g.:
    ❌ Add a new table in a base module (forbidden)
    ✅ Add in an extension module after Orchestrator approval (allowed)

Type 3: Scope Limitation
  Rule: "in this module only the Product table can be modified"
  Reason: inter-module dependency management
  Application: limited to a specific scope only in this module
  
  e.g.:
    ❌ Modify the Inventory table (another module's responsibility)
    ✅ Modify the Product table (this module's responsibility)
```

---

## 3. Version Control & Tracking

### 3.1 Document Versioning

```
Every document must track the following:

/docs/MASTER_MANIFEST.md (master document)

parameters:
  version: "1.0.0"
  created: "2026-05-27"
  last_modified: "2026-05-27"
  modified_by: "[name]"
  
planning_documents:
  01_basic_logic.md:
    version: "1.0"
    last_modified: "2026-05-27"
    parameters_applied: 
      - transaction_flow: "event-driven"
      - inventory_tracking: "real-time"
  
  02_core_features.md:
    version: "1.0"
    last_modified: "2026-05-27"
    changes_from_template:
      - "Profile selection: Trustworthy"
      - "Mobile features removed (web only)"
  
  03_terminology.md:
    version: "1.0"
    
  04_database_schema.md:
    version: "1.0"
    parameters_applied:
      - "table_naming: snake_case, prefix = tbl_"
      - "soft_delete: true"
      - "audit_fields: true"

→ All changes are recorded and traceable
→ You can later know why it was done this way
→ Unintended changes can be detected
```

### 3.2 Decision Log

```
/docs/DECISION_LOG.md

Record each major decision:

[2026-05-27 14:30] Decision #1
  Title: "Choice of API versioning method"
  Options:
    - URL path versioning: /api/v1/
    - Header versioning: Accept-Version
    - Subdomain: api-v1.example.com
  Choice: URL path versioning
  Reason: "most common and REST-standard compliant"
  Approved by: "[PM name]"
  
[2026-05-27 15:00] Decision #2
  Title: "Table naming convention"
  Choice: "snake_case, prefix = tbl_"
  Reason: "easy to read and prevents reserved-word conflicts"
  Impact: "consistent rule applied to all database queries"
  
→ When someone later asks "why snake_case?"
→ you can show the decision log
→ When changing a rule, you can also analyze the impact
```

---

## 4. Rule Compliance Verification

### 4.1 Automated Verification Checklist

```
Automatically verified after every module completion:

✅ Document consistency verification
   ├─ Is the process in 01_basic_logic.md
   ├─ reflected in 02_core_features.md?
   ├─ Are the terms from 03_terminology.md used?
   └─ Does it match 04_database_schema.md?

✅ Parameter application verification
   ├─ Do all table names follow the chosen naming convention?
   ├─ Do all API endpoints follow the chosen versioning method?
   ├─ Do all color variables match the design profile?
   └─ Is the encryption algorithm the chosen method?

✅ Rule Guard compliance verification
   ├─ Are there no forbidden code patterns?
   ├─ Were tables/modules out of scope not modified?
   └─ Are there no unapproved changes?

✅ Accessibility verification
   ├─ Is the color contrast WCAG AA or above?
   ├─ Is the font size readable?
   └─ Does the responsive design work on all screens?

✅ Performance verification
   ├─ Are the database queries indexed?
   ├─ Is the API response time within target?
   └─ Is the CSS file size reasonable?

→ Cannot proceed to the next step without passing verification
→ On verification failure, a detailed report is auto-generated
```

### 4.2 Failure Report Template

```
verification_failure_report

[2026-05-27 16:45]
Module: "04_database_schema.md - Users table"

Issue #1 (severity: high)
  Location: /sql/create_users_table.sql, line 5
  
  Detected: column name does not match the chosen naming convention
  Expected: user_id (snake_case)
  Actual: userId (camelCase)
  
  Rule: defined in /docs/PARAMETERS.md as
         "table_naming.pattern = snake_case"
  
  Impact: other queries use snake_case, causing a mismatch
  
  Resolution:
    1. Change to user_id
    2. Update all referencing queries
    3. Re-verify

Issue #2 (severity: medium)
  Location: /sql/create_users_table.sql, line 12
  
  Detected: soft_delete field missing
  Expected: deleted_at DATETIME NULL
  Actual: none
  
  Rule: in /docs/PARAMETERS.md
         "table_structure_variation.include_soft_delete = true"
  
  Impact: cannot delete user data in the return feature
  
  Resolution:
    1. Add deleted_at column
    2. Update the delete query (DELETE → UPDATE deleted_at)
    3. Re-verify

→ Every issue is clearly pinpointed
→ The resolution method is explicit
→ The AI follows this report to fix and re-verify
```

---

## 5. Relationship Between Documents and AI

### 5.1 Document Roles

```
┌────────────────────────────────────────────────────────┐
│ Four Roles of Documents                                 │
├────────────────────────────────────────────────────────┤
│                                                        │
│ Role 1: Memory                                         │
│  └─ Even if the AI forgets, the document remembers     │
│                                                        │
│ Role 2: Verification                                   │
│  └─ Confirm whether deliverables match the document    │
│                                                        │
│ Role 3: Scope                                          │
│  └─ State what must and must not be done               │
│                                                        │
│ Role 4: Justification                                  │
│  └─ Later explain why it was done this way             │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### 5.2 AI Roles

```
┌────────────────────────────────────────────────────────┐
│ Three Roles of AI                                       │
├────────────────────────────────────────────────────────┤
│                                                        │
│ Role 1: Execution                                      │
│  └─ Perform work within the scope defined by documents │
│                                                        │
│ Role 2: Generation                                     │
│  └─ Generate different deliverables per project        │
│     according to parameters                            │
│                                                        │
│ Role 3: Reporting                                      │
│  └─ Report work results clearly and get them verified  │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

## 6. System Reliability

### 6.1 Benefits Gained Because "AI Does Not Develop Freely"

```
Benefit 1: Consistency
  The structure of every project is clear and predictable
  
Benefit 2: Traceability
  Every decision and change is recorded
  
Benefit 3: Reproducibility
  Same parameters produce the same result
  
Benefit 4: Auditability
  Compliance can be easily confirmed
  
Benefit 5: Risk Minimization
  AI cannot arbitrarily ignore security rules
  
Benefit 6: Team Collaboration
  All team members work to the same standard
```

---

## Conclusion

### Three Core Principles of the System

```
1️⃣  Documents Remember
    └─ AI re-reads the documents at every module

2️⃣  Orchestrator Controls
    └─ Rule Guard prevents scope deviation

3️⃣  QA Verifies
    └─ Guarantees accuracy against the planning doc

With these three principles:
✅ Consistent development
✅ Security compliance
✅ Traceable decisions
✅ Per-project diversity (security)
✅ Human control maintained
```

---

**Version**: 1.0
**Created**: 2026-05-27
**Status**: Draft - ready for implementation
