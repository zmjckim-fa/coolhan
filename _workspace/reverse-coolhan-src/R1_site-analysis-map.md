# Site Analysis Map — CoolHan API (`src/`) — R1

**Analysis ID:** R1-coolhan-src-2026-06-12
**Target:** `C:\sites\CoolHan builder\src` (READ-ONLY; no source files modified)
**Companion JSON:** `R1_site-analysis-map.json`

## Stack (1-line)
**Python / FastAPI**, ORM **SQLAlchemy 2.0**, DB **SQLite default** (`sqlite:///./coolhan.db`, config.py:14) with a **PostgreSQL** branch (database.py:19, `psycopg2-binary`). **API-only** (no UI/SPA/templates). Commands: install `pip install -r requirements.txt` · test `pytest` · run `uvicorn main:app`.

**Evidence:** requirements.txt:1 (`fastapi==0.104.1`), main.py:6/26 (FastAPI entry), src/routes/*.py (APIRouter in all 11 modules).

### ⚠️ Stack ambiguity (recorded honestly)
Both `package.json` (express, jest) and `requirements.txt` (fastapi) exist at root, plus stray `.js` files in `src/` (`server.js`, `health.js`, `routes/health.js`).
**Resolved → Python/FastAPI is the actual runtime.** `main.py` is the FastAPI app wiring all 11 routers (main.py:42-52). `package.json.main` = `install.js` (package.json:5) and its lone runtime dep `express` (package.json:71) belong to the **CoolHan installer/npm package**, not the `src/` API service. The `.js` files are not imported by `main.py` → decoy/installer artifacts. Confidence: high.

## Counts
| Routes | Tables/Models | Features | Low-confidence | Integration points |
|--------|---------------|----------|----------------|--------------------|
| 62 | 18 (17 ORM tables + 1 assoc table) | 11 | 0 | 0 (none wired) |

## Features → candidate domain-module
| Feature | Routes | Models | Candidate module |
|---------|--------|--------|------------------|
| F-01 Authentication & Session | 4 | user, role, user_role(_explicit) | `01_member_system` |
| F-02 Member Management | 5 | user, role | `01_member_system` |
| F-03 Shopping Catalog | 6 | category, product | `02_shopping_mall` |
| F-04 Order Management | 5 | order, order_item | `09_order_management` |
| F-05 Payment Processing | 5 | payment | `03_payment_system` |
| F-06 Inventory Management | 5 | inventory_item, inventory_transaction | `08_inventory_management` |
| F-07 Shipping & Tracking | 5 | shipment | `04_shipping_system` |
| F-08 Notification | 6 | notification | `06_notification_system` |
| F-09 Review & Rating | 6 | review, rating | `07_review_rating_system` |
| F-10 GDPR / Privacy | 6 | data_subject, consent_log | `10_gdpr_privacy` |
| F-11 Admin Audit Log | 6 | admin_log | `05_admin_system` |

(Route counts above = 59 feature routes + 1 `GET /` + 2 `/health`-related = 62 total.)

## Data models (18) — by tablename
`role` (member.py:43) · `user` (member.py:61) · `user_role` assoc table (member.py:32) · `user_role_explicit` (member.py:93) · `category` self-nesting (shopping.py:16) · `product` (shopping.py:41) · `order` (order.py:29, owns totals) · `order_item` (order.py:68) · `payment` (payment.py:39, has `idempotency_key` py:45) · `inventory_item` (inventory.py:35) · `inventory_transaction` (inventory.py:71) · `shipment` (shipping.py:30) · `notification` (notification.py:37) · `review` (review.py:16) · `rating` (review.py:47) · `data_subject` (gdpr.py:26) · `consent_log` (gdpr.py:58) · `admin_log` (admin.py:34).

## Components / UI
**None — API-only.** No SPA framework and no template engine in requirements.txt; `main.py` exposes JSON routers only. `src/pages` and `src/features` dirs exist on disk but are not imported by the FastAPI entry point.

## Menu / Navigation
**None in code (honest).** No nav definition or layout template exists. Closest equivalent = API route groups by `APIRouter` prefix: auth · members · shopping · orders · payments · inventory · shipments · notifications · reviews · gdpr · admin. This is a prefix grouping, not a real menu.

## Integration points
**None detected.** Grep for `requests/httpx/stripe/paypal/boto3/celery/redis/kafka/webhook/smtp` matched only **enum string constants** (`PAYPAL`/`STRIPE` payment.py:18-19, `WEBHOOK` notification.py:18) and a JS comment (health.js:7). No outbound HTTP client, SDK, queue, cron, or webhook caller in code.

## Security finding (from code, no inference)
Only `GET /api/auth/me` and `POST /api/auth/logout` enforce auth (`Depends(get_current_user)`, auth.py:53). **All other 56 business/admin endpoints inject only `get_db` — no auth dependency.** `require_admin` (auth.py:72) is defined but applied to **no** `/api/admin` route. Recorded as observed; not interpreted as intended/unintended.

## Low-confidence / Unanalyzable
- External integration behavior (stripe/paypal/webhook are enum values only; real gateway/dispatch logic absent → cannot analyze).
- `src/pages`, `src/features` dirs — present but not runtime-wired from `main.py`.
- Stray `.js` artifacts (`src/server.js`, `src/health.js`, `src/routes/health.js`) — not part of FastAPI runtime; installer/scaffold leftovers.

**Next step:** Module Extractor (R2) — module decomposition.
