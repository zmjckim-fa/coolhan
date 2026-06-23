# Application Plan — Data Schema Standard

> The Cross-Site Adapter (reverse R3) takes the Module Manifest (site A) + target site B context as input,
> and produces a deliverable defining "which modules of A are ported into B, and how" — this is its standard.
> This plan becomes the input to the forward pipeline (Developer Task 3~6).

## Core Principles — Cross-Site Extension of Planner Intent Enforcement (P0)

1. **Port only approved modules** — Port only the modules explicitly listed in `approved_modules`. Even if present in the Manifest, porting is prohibited if not in the approval list. (Extension of the Track 3 P0 mechanism)
2. **Block unauthorized pull-in** — Do not automatically pull in unapproved modules that an approved module depends on. Report missing dependencies as conflicts and request planner approval.
3. **Parameterized reuse** — Absorb DB name/table/API/design differences between sites using the existing Specification/Design Parameterization systems. Hardcoded transforms are prohibited.
4. **Non-destructive on conflict** — When conflicting with resources that already exist in B, do not delete or overwrite; report as a conflict + annotate the source.

## JSON Schema

```json
{
  "plan_id": "{timestamp}",
  "source_manifest": "module-manifest-{id}.json",
  "site_a": { "name": "source site", "stack": "fastapi/postgres" },
  "site_b": {
    "name": "target site",
    "stack": "express/mysql | empty | unknown",
    "existing_modules": ["modules/resources already in B"],
    "naming_convention": "B's DB/API naming convention (see parameterization)",
    "design_profile": "B's design profile (Elegant/Fresh/...)"
  },

  "approved_modules": [
    {
      "module_id": "M-01",
      "name": "Order Management",
      "approved": true,
      "approval_source": "explicit planner approval | user command"
    }
  ],
  "rejected_modules": [
    { "module_id": "M-07", "name": "Loyalty Points", "reason": "outside B scope — not approved by planner" }
  ],

  "mapping_table": [
    {
      "module_id": "M-01",
      "transform": {
        "db_naming": "orders → tbl_order (apply B convention)",
        "field_naming": "snake_case → camelCase",
        "api_structure": "/api/orders → /v1/order (B convention)",
        "stack_port": "SQLAlchemy model → Prisma schema",
        "design_swap": "A profile(Trustworthy) → B profile(Fresh)"
      },
      "parameterization_refs": [
        "00_SPECIFICATION_PARAMETERIZATION_SYSTEM.md",
        "00_DESIGN_PARAMETERIZATION_SYSTEM.md"
      ]
    }
  ],

  "conflicts": [
    {
      "type": "naming_clash | dependency_missing | schema_collision | stack_incompatible",
      "module_id": "M-01",
      "detail": "'order' table already exists in B — merge/rename decision needed",
      "resolution_options": ["rename", "merge", "skip"],
      "resolved": false,
      "requires_planner_approval": true
    }
  ],

  "dependency_check": [
    {
      "module_id": "M-01",
      "needs": ["M-03 Payment"],
      "m03_approved": false,
      "action": "M-03 not approved — auto-porting prohibited. Request planner approval or hold M-01 porting."
    }
  ],

  "port_order": ["M-02", "M-03", "M-01"],

  "handoff": {
    "to": "Developer (forward Task 3)",
    "spec_inputs": ["module-{id}.md (approved modules only)"],
    "p0_guard": "Validator step 0: PASS only if the porting result exactly matches approved_modules. FAIL if any unapproved module/endpoint/table is found."
  },

  "summary": {
    "approved_count": 0,
    "rejected_count": 0,
    "unresolved_conflicts": 0,
    "blocked_by_dependency": 0,
    "ready_to_port": false
  }
}
```

## Handling by Conflict Type

| Type | Meaning | Handling |
|------|------|------|
| naming_clash | Resource with same name exists in B | Propose rename via parameterization, planner decides |
| dependency_missing | Approved module depends on unapproved module | Auto-porting prohibited, request approval (P0) |
| schema_collision | Table/field collision | Present merge vs separate options, non-destructive |
| stack_incompatible | A↔B stack conversion impossible/difficult | State conversion cost, manual port or hold |

## P0 Validation Linkage (post-port)

After porting completes, the Validator's **step 0 planner-intent validation** operates in cross-site mode:

```
Input: approved_modules from application-plan-{id}.json
Check: endpoints/tables/features extracted from B's ported code
Verdict:
  - PASS: porting result ⊆ approved_modules (exactly the approved items only)
  - FAIL: endpoint/table/feature not in approved_modules found (unauthorized pull-in)
```

This blocks, at the source, any feature not approved by the planner from leaking into B across the entire "analyze → modularize → port" process.
