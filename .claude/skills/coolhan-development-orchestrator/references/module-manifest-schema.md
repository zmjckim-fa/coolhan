# Module Manifest — Data Schema Standard

> The Module Extractor (reverse R2) takes the Site Analysis Map as input and decomposes the discovered
> features/menus into **reusable modules** — this is the standard for that deliverable. It is compatible with
> CoolHan's 12-section domain-module format and can be fed back (registered) into the knowledge_base.

## Core Principles

1. **CoolHan domain-module format conformance** — Extracted modules map to the 12-section structure of `00_DOMAIN_MODULES_INDEX.md`.
2. **Existing-module-first mapping** — First attempt to map discovered features to the existing 10 modules (01~10). On an exact match, set `maps_to_existing`. If novel, propose as an extension module (11+) candidate.
3. **Independence & composability** — Each module has a self-contained boundary + explicit dependencies. Circular references prohibited.
4. **Evidence preservation** — Each module preserves its source (feature id from the Site Analysis Map + original file).

## JSON Schema

```json
{
  "manifest_id": "{timestamp}",
  "source_analysis": "site-analysis-map-{id}.json",
  "modules": [
    {
      "module_id": "M-01",
      "name": "Order Management",
      "maps_to_existing": "09_order_management | null",
      "novelty": "existing | existing+extension | new",
      "proposed_kb_file": "09_order_management.md (update) | 11_xxx.md (new)",

      "section_1_terminology": ["order", "order item", "order status"],
      "section_2_functions": [
        { "name": "Create order", "desc": "cart→order conversion", "source_feature": "F-01" }
      ],
      "section_3_status_values": ["pending", "paid", "shipped", "cancelled"],
      "section_4_data_model": [
        { "table": "orders", "fields": [...], "source": "src/models/order.py:10" }
      ],
      "section_5_api": [
        { "method": "POST", "path": "/api/orders", "source": "src/routes/order.py:42" }
      ],
      "section_6_permissions": [{ "role": "member", "can": ["create_own_order"] }],
      "section_7_prohibitions": ["viewing others' orders prohibited"],
      "section_8_security": ["order ownership verification", "payment idempotency key"],
      "section_9_acceptance": ["deduct inventory on order creation", "..."],
      "section_10_integration": [
        { "depends_on": "M-03 (Payment)", "kind": "calls" },
        { "depends_on": "M-05 (Inventory)", "kind": "reserves" }
      ],
      "section_11_config": [{ "key": "order_timeout_min", "default": 30 }],
      "section_12_dependencies": ["M-02 Member", "M-03 Payment", "M-05 Inventory"],

      "ui_menu": [
        { "label": "Order List", "route": "/orders", "source": "templates/order_list.html" }
      ],
      "reuse": {
        "extractable": true,
        "coupling": "low | medium | high",
        "coupling_notes": "tightly coupled to global session object — auth abstraction needed when separating"
      },
      "evidence": ["F-01", "F-02", "src/routes/order.py", "src/models/order.py"]
    }
  ],
  "dependency_graph": [
    { "from": "M-01", "to": "M-03", "kind": "calls" }
  ],
  "feedback_to_kb": {
    "updates": ["09_order_management.md: partial-refund flow additionally discovered"],
    "new_modules": ["11_loyalty_points.md: loyalty points — not in the existing 10 modules"]
  },
  "summary": {
    "total_modules": 0,
    "mapped_to_existing": 0,
    "new_module_candidates": 0,
    "high_coupling_modules": ["modules requiring caution when separating"]
  }
}
```

## Coupling Grading Criteria

| Grade | Meaning | Action on reuse |
|------|------|---------------|
| low | Dependencies explicit and few, interface clear | Extract as-is |
| medium | Depends on some shared utils/config | List dependencies together, route via adapter |
| high | Tightly coupled to global state/implicit side effects | Refactor required before extraction — pass a warning to the Application Plan |

## Accompanying .md Output

For each module, generate `module-{id}-{name}.md` in the 12-section domain-module format as a knowledge_base registration candidate. The manifest summary `module-manifest-{id}.md` tabulates the module list, dependency graph, and KB feedback proposals.

## knowledge_base Feedback Rules

- **Absorb into existing module** (`maps_to_existing` present): Propose the findings as a diff against the relevant KB file. No unauthorized overwriting — the Spec Writer reviews and applies them.
- **New extension module** (`novelty: new`): Draft a new 12-section-format candidate numbered `11_*` or higher. Registration only after user/planner approval.
