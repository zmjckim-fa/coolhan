# Core KB Cross-Reference Index

**Version:** 1.0.0 | **Created:** 2026-06-13 | **Status:** ACTIVE

---

## Overview

The `core/` directory defines the composition rules for specific business patterns (shopping mall, marketplace, purchase agency, etc.).
If domain modules (01–11) are the "feature units," Core documents capture "which modules this pattern combines, and under what rules."

---

## Core Document List

| File | Pattern | Included Domain Modules | Primary Solution Types |
|------|------|---------------|--------------|
| [`shopping_mall_core.md`](shopping_mall_core.md) | B2C e-commerce (single seller) | 01+02+03+04+06+07+08+09+10 | WEB, MOBILE |
| [`marketplace_core.md`](marketplace_core.md) | B2C marketplace (multi-seller) | 01+02+03+04+05+06+07+08+09+10 | WEB, MOBILE |
| [`purchase_agency_core.md`](purchase_agency_core.md) | Purchase agency (overseas direct purchase / B2B agency) | 01+02+03+04+05+06+08+09+10+11 | WEB |

---

## Core vs Domain Module Relationship

```
Domain Module (What)         Core Document (How to Combine)
┌──────────────────┐         ┌──────────────────────────────┐
│ 01_member_system │─────────┤ shopping_mall_core.md        │
│ 02_shopping_mall │─────────┤  → Single seller + direct pay │
│ 03_payment_system│─────────┤  → Courier-centric shipping   │
│ ...              │         │  → Reviews required           │
└──────────────────┘         └──────────────────────────────┘

                              ┌──────────────────────────────┐
                              │ marketplace_core.md          │
                              │  → Multi-seller settlement    │
                              │  → Escrow payment             │
                              │  → Seller onboarding flow     │
                              └──────────────────────────────┘
```

---

## Core Document Selection Guide

```
Q1: How many sellers are there?
  → 1 (self-operated): shopping_mall_core.md
  → Many (onboarded sellers): marketplace_core.md

Q2: Is it overseas or a B2B agency?
  → Overseas direct purchase / purchase agency: purchase_agency_core.md

Q3: No matching Core?
  → Compose domain modules directly + refer to 00_core_module_mapping.md
```

---

## Connection with Solution Type KB

Core documents define the business pattern, and the Solution Type KB defines the platform implementation.
Reference both documents together to generate a complete specification.

| Core Document | + | Solution Type KB | = | Project Specification |
|----------|---|--------------|---|-------------|
| shopping_mall_core.md | + | WEB/01_ecommerce_mall/ | = | Web shopping mall spec |
| shopping_mall_core.md | + | MOBILE/01_ios_app/ | = | iOS shopping app spec |
| shopping_mall_core.md | + | MOBILE/02_android_app/ | = | Android shopping app spec |
| marketplace_core.md | + | WEB/01_ecommerce_mall/ | = | Web marketplace spec |
| purchase_agency_core.md | + | WEB/01_ecommerce_mall/ | = | Purchase agency web spec |

---

## Criteria for Adding a New Core Document

1. When a **new business pattern** is hard to express with domain module composition alone
2. When the **same module composition** is used but the core business rules are entirely different (e.g., subscription vs. one-time payment)
3. When the same pattern recurs across **3 or more projects**

A new Core document follows the same structure as `shopping_mall_core.md`:
- Executive Summary
- Built-in Features (Non-Negotiable)
- Optional Features (Optional)
- Out-of-Scope Features (Out of Scope)
- Domain Module Dependency Table
- Core Business Rules

---

**References:**
- [`../00_core_module_mapping.md`](../00_core_module_mapping.md) — Full module mapping
- [`../00_DOMAIN_MODULES_INDEX.md`](../00_DOMAIN_MODULES_INDEX.md) — Domain module list
- [`../00_KNOWLEDGE_BASE_EXTENSIBILITY.md`](../00_KNOWLEDGE_BASE_EXTENSIBILITY.md) — KB extension rules
