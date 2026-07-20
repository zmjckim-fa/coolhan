# Domain Modules Index

## Overview
The domain-module system provides 10 reusable modules that can be composed into any application. Instead of implementing solution-type-specific systems (entire E-Commerce, entire POS), projects select and combine the domain modules they need.

---

## Module Directory

### Foundation & Core
| Module | Purpose | Dependencies | Typical Use |
|--------|---------|--------------|-------------|
| **[01_member_system.md](01_member_system.md)** | User accounts, authentication, profiles, roles | None (foundation) | All projects with users |
| **[05_admin_system.md](05_admin_system.md)** | Admin interface, permissions, audit logs, configuration | Member System | Projects with admin operations |

### Commerce & Sales
| Module | Purpose | Dependencies | Typical Use |
|--------|---------|--------------|-------------|
| **[02_shopping_mall.md](02_shopping_mall.md)** | Products, catalog, shopping cart, wishlist | Member System | E-commerce, marketplaces |
| **[03_payment_system.md](03_payment_system.md)** | Payment methods, transactions, refunds, invoices | Member, Order | Any commercial project |
| **[04_shipping_logistics.md](04_shipping_logistics.md)** | Addresses, shipping methods, tracking, returns | Member, Order | E-commerce with fulfillment |
| **[08_inventory_management.md](08_inventory_management.md)** | Stock tracking, reservations, purchases, audits | Shopping Mall | Product-based businesses |
| **[09_order_management.md](09_order_management.md)** | Orders, fulfillment, tracking, cancellation | Payment, Shipping, Inventory | E-commerce core |

### Customer Experience
| Module | Purpose | Dependencies | Typical Use |
|--------|---------|--------------|-------------|
| **[06_notification_system.md](06_notification_system.md)** | Email, SMS, push notifications, preferences | Member System | All projects (event-driven) |
| **[07_review_rating_system.md](07_review_rating_system.md)** | Reviews, ratings, moderation | Member, Shopping | Product-based businesses |

### Compliance & Security
| Module | Purpose | Dependencies | Typical Use |
|--------|---------|--------------|-------------|
| **[10_gdpr_privacy.md](10_gdpr_privacy.md)** | Consent, data access, deletion, retention | Member System | All projects (regulatory) |

### Purchase Proxy / Cross-Border SaaS
| Module | Purpose | Dependencies | Typical Use |
|--------|---------|--------------|-------------|
| **[11_purchase_application.md](11_purchase_application.md)** | 구매신청 5-step form, OrderDraft, commission calc, state machine | Member, Order | Purchase proxy services |
| **[12_shipping_saas.md](12_shipping_saas.md)** | Warehouse inbound, inspection, pickup (10-step), volumetric weight, 2nd payment | Order, Payment | International shipping proxy |
| **[13_customs_clearance.md](13_customs_clearance.md)** | PCCC (개인통관고유부호), Unipass API, HS codes, customs documents | Member | Cross-border shipping to Korea |

---

## Module Composition Examples

### E-Commerce Platform
```
01 + 02 + 03 + 04 + 06 + 07 + 08 + 09 + 10
Member → Shopping → Payment → Shipping → Notifications + Reviews + Inventory + Orders + Privacy
```

### SaaS Application
```
01 + 05 + 06 + 10
Member → Admin + Notifications + Privacy
```

### Marketplace
```
01 + 02 + 03 + 04 + 05 + 06 + 07 + 08 + 09 + 10
All modules: Multi-seller, complex order flow, reviews important
```

### Purchase Proxy SaaS (구매대행/배송대행)
```
01 + 03 + 05 + 06 + 07 + 09 + 11 + 12 + 13
Member → Payment → Admin + Notifications + Reviews + Orders + Purchase Application + Shipping SaaS + Customs
Reference: knowledge_base/WEB/02_purchase_proxy/ (7-file solution KB)
```

### Inventory Management System
```
01 + 05 + 06 + 08 + 10
Member → Admin + Notifications + Inventory + Privacy
```

### Mobile App Backend
```
01 + 02 + 03 + 04 + 06 + 08 + 09 + 10
Omit Admin System (managed separately)
```

---

## Module Structure

Each module document includes 12 sections:

1. **Terminology Definition** - Key concepts and terms
2. **Basic Functions** - 10 core use cases (2-3 sentences each)
3. **Status Values** - State machine for entities
4. **Database Basic Structure** - Schema tables and relationships
5. **API Basic Structure** - REST endpoints organized by feature
6. **Permissions** - Access control by role
7. **Prohibitions** - Absolute and conditional business rules
8. **Security Standards** - Security requirements and compliance
9. **Acceptance Criteria** - "Done" definition for implementation
10. **Integration Points** - Dependencies and event hooks
11. **Configuration Parameters** - Tunable settings with defaults
12. **Known Dependencies** - Relationship to other modules

---

## Design Principles

### Module Independence
- Modules are self-contained with clear boundaries
- Dependencies explicitly documented
- Modules can be implemented in isolation or integrated

### Composability
- Modules designed to work together
- Clear integration points and event hooks
- No circular dependencies

### Standardization
- Every module follows identical structure
- Consistent terminology across modules
- Predictable API patterns

### Extensibility
- Base 10 modules sufficient for ~80% of projects
- Additional extension modules (11+) layer on top
- Module composition flexible and open-ended

---

## Usage Workflow

### For New Projects

1. **Define Technology Parameters** (00_TECH_PARAMETER_DEFINITION.md)
   - What will be built? (Web, Desktop, Mobile, etc.)
   - What language/framework?
   - What database?
   - Deployment environment?
   - Runtime constraints?

2. **Map to Base Knowledge** (00_TECH_PARAMETER_MAPPING.md)
   - Technology choices recommend appropriate base modules
   - Additional modules suggested by domain context

3. **Select Applicable Modules**
   - Review each module's 10 basic functions
   - Confirm module scope aligns with project needs
   - Select 2-8 modules for composition

4. **Generate Project Specification** (Not yet created)
   - Create 18-document specification set
   - One specification per module + system-wide specs
   - Reference section 5 (API) for integration points

5. **Develop Module-by-Module**
   - Each module gets its own development sprint
   - Parallel development across teams
   - Integration tests verify module interactions

---

## Implementation Status

| Module | Status | Completeness |
|--------|--------|--------------|
| 01_member_system | ✅ Complete | 12/12 sections |
| 02_shopping_mall | ✅ Complete | 12/12 sections |
| 03_payment_system | ✅ Complete | 12/12 sections |
| 04_shipping_logistics | ✅ Complete | 12/12 sections |
| 05_admin_system | ✅ Complete | 12/12 sections |
| 06_notification_system | ✅ Complete | 12/12 sections |
| 07_review_rating_system | ✅ Complete | 12/12 sections |
| 08_inventory_management | ✅ Complete | 12/12 sections |
| 09_order_management | ✅ Complete | 12/12 sections |
| 10_gdpr_privacy | ✅ Complete | 12/12 sections |

**Base Module Set:** 10/10 ✅ Complete (2026-05-27)

### Extension Modules (Active)

| Module | Status | Completeness |
|--------|--------|--------------|
| 11_purchase_application | ✅ Active | 12/12 sections |
| 12_shipping_saas | ✅ Active | 12/12 sections |
| 13_customs_clearance | ✅ Active | 12/12 sections |

**Extension Module Set (Purchase Proxy SaaS):** 3/3 ✅ Complete (2026-07-19)  
Source: Extracted from SchnellMoon/Kleinanzeigen 구매대행 SaaS platform

---

## Extension Modules (Future)

When needed, additional extension modules can be added:
- 14_content_management.md - Blog, pages, SEO, notices
- 15_marketplace_seller.md - Multi-seller marketplace features
- 16_subscription_billing.md - Recurring payments, subscriptions
- 17_analytics_reporting.md - Business intelligence, analytics
- 18_recommendation_engine.md - Product recommendations, personalization

Extension modules follow the same 12-section structure.

---

## Quick Reference

### By Project Type
- **Web Projects**: 01, 02, 03, 04, 05, 06, 07, 08, 09, 10
- **Mobile Apps**: 01, 02, 03, 04, 06, 08, 09, 10 (skip admin)
- **Desktop Apps**: 01, 05, 06, 08, 10 (+ domain-specific)
- **APIs/Backends**: 01, 03, 06, 08, 09, 10 (+ domain-specific)
- **Admin Systems**: 01, 05, 06, 10

### By Department
- **Frontend Devs**: Study 02, 06, 07 for UI requirements
- **Backend Devs**: Study all 10 modules for API contracts
- **Database Admins**: Study Section 4 (Database) of relevant modules
- **QA/Testing**: Study Section 9 (Acceptance Criteria) of relevant modules
- **Security**: Study Section 8 (Security Standards) of all modules
- **Compliance**: Study Section 10, especially 10_gdpr_privacy

---

## Version History

- **2026-05-27**: Initial 10-module base set created (01–10)
- **2026-07-19**: Extension modules 11–13 added (Purchase Proxy SaaS stack, extracted from SchnellMoon/Kleinanzeigen)
