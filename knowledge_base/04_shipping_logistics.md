# 04_shipping_logistics.md - Shipping Logistics Domain Module

## Overview
The Shipping Logistics module handles shipping address management, shipping method selection, shipping cost calculation, shipment tracking, and logistics provider integration. This module manages the physical movement of products to customers.

---

## 1. Terminology Definition

| Term | Definition | Example |
|------|-----------|---------|
| **Shipping Address** | Delivery location for order | 123 Main St, City, State, ZIP |
| **Shipping Method** | Delivery service option | Standard (5-7 days), Express (1-2 days) |
| **Carrier** | Company providing shipping service | FedEx, UPS, DHL, Local Courier |
| **Tracking Number** | Identifier to track shipment | 1Z999AA10123456784 |
| **Shipment** | Package(s) in transit with tracking | SHP-20260527-001 |
| **Fulfillment** | Process of preparing and shipping order | Pick → Pack → Ship |
| **Warehouse** | Location storing inventory for shipment | Main Warehouse, Regional Hub |
| **Zone** | Geographic delivery area for rate calculation | Zone 1, Zone 2, etc. |
| **Weight/Dimensions** | Physical measurements for shipping | 2 lbs, 12"x9"x6" |
| **Delivery Date** | Expected arrival date | 2026-06-02 |
| **Signature Required** | Customer must sign for delivery | Yes/No |
| **Insurance** | Optional shipment coverage | $100 coverage for $2.50 |
| **Return Shipment** | Package being returned by customer | RMA-20260527-001 |
| **Delivery Status** | Current position of shipment | In Transit, Delivered, Delayed |

---

## 2. Basic Functions

### 2.1 Shipping Address Management
- **Purpose**: Store and validate customer shipping addresses
- **Input**: Street address, city, state/province, ZIP/postal code, country, contact info
- **Process**: Address search/lookup (Nominatim) → Geocoding (lat/lon resolved) → Address standardization → Storage
- **Output**: Validated shipping address record (with latitude/longitude populated)
- **Error Handling**: Invalid address, non-deliverable address, missing fields, geocoder unavailable (fall back to manual entry)
- **Geocoding provider**: **Nominatim (OpenStreetMap)** — see §2.1a and §8 for usage policy

### 2.1a Address Search / Postal-Code Lookup (Nominatim)
- **Purpose**: Replace manual-only address entry with type-ahead search backed by OpenStreetMap. Supersedes any carrier/USPS/Daum/Kakao postcode lookup.
- **Input**: Free-text query (partial street, place name, or postal code) + optional `countrycodes` filter
- **Process**: Query Nominatim Search API → parse structured results (`address` object + `lat`/`lon`) → present candidates → on selection, map fields (street, city, state, postal_code, country_code) and store lat/lon
- **Output**: List of address candidates; selected candidate fills the address form and `latitude`/`longitude`
- **Why Nominatim**: license-free (ODbL), global coverage, no API key, self-hostable for volume — removes dependency on per-carrier or country-specific (Daum/Kakao) postcode services
- **Error Handling**: No results (allow manual entry), rate-limited/unavailable (graceful fallback to manual entry — never block address submission)

### 2.2 Shipping Method Selection
- **Purpose**: Display available shipping options with costs
- **Input**: Shipping address, order weight/dimensions
- **Process**: Get zone from address → Calculate cost for each method → Apply rules (max weight, etc.)
- **Output**: List of available shipping methods with costs and delivery estimates
- **Error Handling**: Address not serviceable, weight exceeds limits

### 2.3 Calculate Shipping Cost
- **Purpose**: Determine shipping cost based on address and item weight
- **Input**: Destination zone, weight, dimensions, service level
- **Process**: Lookup zone rates → Apply weight brackets → Add surcharges → Return cost
- **Output**: Shipping cost
- **Error Handling**: Invalid zone, weight exceeds limits, address not deliverable

### 2.4 Create Shipment
- **Purpose**: Generate shipping label and create shipment record
- **Input**: Order ID, shipping address, items to ship, shipping method
- **Process**: Validate address → Generate label → Create carrier shipment → Get tracking number
- **Output**: Shipment record with tracking number and label
- **Error Handling**: Address validation failure, carrier API timeout, duplicate shipment

### 2.5 Track Shipment
- **Purpose**: Retrieve current status and location of shipment
- **Input**: Tracking number or shipment ID
- **Process**: Query carrier API → Parse status → Update local record → Return status
- **Output**: Shipment status with location, estimated delivery
- **Error Handling**: Tracking number not found, carrier API unavailable

### 2.6 Update Shipment Status
- **Purpose**: Record shipment status changes (received webhook from carrier)
- **Input**: Tracking number, new status, timestamp, location
- **Process**: Find shipment → Validate status transition → Update record → Notify customer
- **Output**: Updated shipment record
- **Error Handling**: Shipment not found, invalid status, duplicate update

### 2.7 Handle Delivery Exception
- **Purpose**: Manage issues during delivery (failed delivery, delayed, damaged)
- **Input**: Tracking number, exception type, description
- **Process**: Log exception → Determine action (retry, return, replacement) → Notify customer
- **Output**: Exception record with next steps
- **Error Handling**: Unknown exception type, shipment not found

### 2.8 Initiate Return Shipment
- **Purpose**: Create return shipping label and process
- **Input**: Original order ID, return reason, items being returned
- **Process**: Determine return address → Generate return label → Create RMA → Email label to customer
- **Output**: Return shipment record with tracking
- **Error Handling**: Return window expired, item not returnable, address not valid

### 2.9 Multiple Shipments from Single Order
- **Purpose**: Handle orders shipped in multiple packages
- **Input**: Order ID, partial quantities for each shipment
- **Process**: Split order items → Create separate shipments → Generate multiple labels
- **Output**: Multiple shipment records for single order
- **Error Handling**: Invalid quantities, item conflicts

### 2.10 Shipping Reconciliation
- **Purpose**: Match shipped orders with carrier records
- **Input**: Date range, carrier
- **Process**: Query local shipments → Query carrier → Compare → Identify discrepancies
- **Output**: Reconciliation report
- **Error Handling**: API timeout, missing shipments

---

## 3. Status Values

| Status | Description | Transitions | Business Rules |
|--------|-------------|-----------|-----------------|
| **Pending** | Order awaiting fulfillment | → Ready, Cancelled | Not yet picked/packed |
| **Ready** | Order prepared for shipment | → Shipped, Cancelled | In warehouse ready to ship |
| **Shipped** | Shipment created, label generated | → In Transit | Tracking available |
| **In Transit** | Package with carrier in delivery | → Delivered, Exception | Moving toward destination |
| **Delivered** | Successfully delivered to customer | None (final) | Delivery confirmed |
| **Delivery Attempted** | Failed delivery attempt | → In Transit (retry), Returned | Will retry or return |
| **Exception** | Issue during transit/delivery | → Resolved, Returned | Delivery halted, action needed |
| **Returned** | Package returned to sender/RMA | → Received at Warehouse | In return process |
| **Cancelled** | Shipment cancelled | None (final) | No shipment occurs |

---

## 4. Database Basic Structure

### Core Tables

#### shipping_addresses
```
- id (PK): UUID/INT
- member_id (FK): UUID/INT
- address_type: ENUM(billing, shipping, return)
- street_line1: VARCHAR(255)
- street_line2: VARCHAR(255)
- city: VARCHAR(100)
- state_province: VARCHAR(100)
- postal_code: VARCHAR(20)
- country: VARCHAR(100)
- country_code: VARCHAR(2) (ISO 3166-1 alpha-2)
- phone_number: VARCHAR(20)
- recipient_name: VARCHAR(255)
- latitude: DECIMAL(10,8) (geocoded via Nominatim)
- longitude: DECIMAL(11,8) (geocoded via Nominatim)
- osm_place_id: VARCHAR(64) (optional — Nominatim place_id for re-lookup)
- geocode_source: VARCHAR(20) (default 'nominatim'; 'manual' if user typed without search)
- is_default: BOOLEAN
- is_valid: BOOLEAN (address validation result)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### shipping_methods
```
- id (PK): UUID/INT
- name: VARCHAR(100) (e.g., "Standard Shipping", "Express")
- carrier: VARCHAR(50) (fedex, ups, usps, dhl, local, etc.)
- service_code: VARCHAR(100) (carrier's service code)
- base_rate: DECIMAL(12,2)
- rate_per_pound: DECIMAL(8,4)
- min_delivery_days: INT (e.g., 5)
- max_delivery_days: INT (e.g., 7)
- max_weight: DECIMAL(10,2) (lbs)
- max_dimensions: VARCHAR(50) (e.g., "length+width+height <= 300")
- is_active: BOOLEAN
- supported_countries: JSON (array of country codes)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### shipping_rates
```
- id (PK): UUID/INT
- shipping_method_id (FK): UUID/INT
- zone_code: VARCHAR(10) (e.g., "zone1", "zone2")
- min_weight: DECIMAL(10,2)
- max_weight: DECIMAL(10,2)
- rate: DECIMAL(12,2)
- effective_date: DATE
- end_date: DATE (nullable = current)
- created_at: TIMESTAMP
```

#### shipments
```
- id (PK): UUID/INT
- order_id (FK): UUID/INT
- member_id (FK): UUID/INT
- shipping_address_id (FK): UUID/INT
- shipping_method_id (FK): UUID/INT
- carrier: VARCHAR(50)
- tracking_number: VARCHAR(100)
- label_url: VARCHAR(500) (URL to shipping label)
- status: ENUM(pending, ready, shipped, in_transit, delivered, exception, returned, cancelled)
- weight: DECIMAL(10,2)
- dimensions: JSON {length, width, height, unit}
- total_weight: DECIMAL(10,2)
- shipping_cost: DECIMAL(12,2)
- insurance_cost: DECIMAL(12,2)
- signature_required: BOOLEAN
- delivery_date_estimated: DATE
- delivery_date_actual: DATE
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
- shipped_at: TIMESTAMP
```

#### shipment_items
```
- id (PK): UUID/INT
- shipment_id (FK): UUID/INT
- order_item_id (FK): UUID/INT
- product_id (FK): UUID/INT
- quantity: INT
- sku: VARCHAR(50)
```

#### shipment_tracking
```
- id (PK): UUID/INT
- shipment_id (FK): UUID/INT
- status: VARCHAR(50)
- location: VARCHAR(255)
- location_code: VARCHAR(50)
- timestamp: TIMESTAMP
- description: TEXT
- event_code: VARCHAR(50)
- details: JSON (raw carrier response)
```

#### shipment_exceptions
```
- id (PK): UUID/INT
- shipment_id (FK): UUID/INT
- exception_type: VARCHAR(100) (failed_delivery, lost, damaged, delayed, address_issue)
- description: TEXT
- status: ENUM(open, investigating, resolved, refunded)
- created_at: TIMESTAMP
- resolved_at: TIMESTAMP
- resolution: VARCHAR(255) (resend, refund, replace)
```

#### return_shipments
```
- id (PK): UUID/INT
- original_shipment_id (FK): UUID/INT
- order_id (FK): UUID/INT
- member_id (FK): UUID/INT
- return_reason: VARCHAR(255)
- return_address: JSON (address fields)
- tracking_number: VARCHAR(100)
- label_url: VARCHAR(500)
- status: ENUM(label_created, in_transit, received, processed, refunded)
- items_returned: JSON (list of items being returned)
- received_at: TIMESTAMP
- refunded_at: TIMESTAMP
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

---

## 5. API Basic Structure

### Address Endpoints
```
GET    /shipping-addresses          - List user's addresses
POST   /shipping-addresses          - Add new address
PUT    /shipping-addresses/:id      - Update address
DELETE /shipping-addresses/:id      - Delete address
GET    /shipping-addresses/search   - Search/autocomplete address via Nominatim (q, countrycodes)
POST   /shipping-addresses/:id/validate - Validate + geocode address via Nominatim
```

### Shipping Endpoints
```
POST   /shipping/methods          - Get available shipping methods for address
GET    /shipping/rates            - Calculate shipping cost
GET    /shipments                 - List user's shipments
GET    /shipments/:id             - Get shipment details
GET    /shipments/:id/track       - Get tracking information
POST   /shipments/:id/track       - Manually update tracking (for carrier webhooks)
```

### Return Endpoints
```
POST   /returns                   - Create return shipment
GET    /returns                   - List user's returns
GET    /returns/:id               - Get return details
GET    /returns/:id/label         - Download return label
POST   /returns/:id/confirm       - Confirm return received
```

### Admin Endpoints
```
GET    /admin/shipments           - List all shipments
GET    /admin/shipments/:id       - Shipment details
POST   /admin/shipments           - Manually create shipment
PUT    /admin/shipments/:id/status - Update shipment status
GET    /admin/returns             - List all returns
PUT    /admin/returns/:id         - Process return
GET    /admin/shipping-methods    - Manage shipping methods
POST   /admin/shipping-methods    - Create shipping method
PUT    /admin/shipping-methods/:id - Update shipping method
```

---

## 6. Permissions

### Public (No Authentication)
- None - shipping operations require authentication

### Authenticated User
- GET /shipping-addresses
- POST /shipping-addresses
- PUT /shipping-addresses/:id (own addresses)
- DELETE /shipping-addresses/:id (own addresses)
- POST /shipping/methods
- GET /shipping/rates
- GET /shipments (own only)
- GET /shipments/:id (own only)
- GET /shipments/:id/track (own only)
- POST /returns (own orders)
- GET /returns (own only)
- GET /returns/:id/label (own only)

### Admin Only
- All /admin/shipments endpoints
- All /admin/returns endpoints
- All /admin/shipping-methods endpoints

---

## 7. Prohibitions

### Absolute Prohibitions
- **Cannot**: Ship to unvalidated address without customer confirmation
- **Cannot**: Calculate shipping without weight and dimensions
- **Cannot**: Create shipment without confirmed payment
- **Cannot**: Change tracking number after shipment created
- **Cannot**: Ship product with zero inventory (unless pre-order)
- **Cannot**: Merge multiple shipments into single tracking number
- **Cannot**: Process return without valid RMA

### Conditional Prohibitions
- **Unless non-returnable**: Cannot create return shipment
- **Unless within return window**: Cannot process return (e.g., 30 days)
- **Unless address validated**: Cannot proceed without override (with warning)
- **Unless signature confirmed**: Cannot mark delivered if signature required

---

## 8. Security Standards

### Address Security & Geocoding (Nominatim / OpenStreetMap)
- Validate and geocode all addresses via **Nominatim (OpenStreetMap)** — not USPS/UPS/FedEx or country-specific (Daum/Kakao) postcode APIs
- **Usage policy (public nominatim.openstreetmap.org):** max 1 request/second; set a descriptive `User-Agent`/`Referer` identifying the app; cache results to avoid repeat lookups; **do not** bulk-geocode against the public endpoint
- **Production volume:** self-host Nominatim (Docker) or use a paid OSM provider; make the base URL a config parameter (`nominatim_base_url`)
- **Attribution:** display "© OpenStreetMap contributors" wherever search results are shown (ODbL requirement)
- **Privacy:** send only the minimal query string; never put full personal address + name in a single logged query; use HTTPS for all geocoder calls
- Graceful degradation: if Nominatim is unavailable/rate-limited, allow manual address entry — never block submission
- Prevent shipping to known high-fraud addresses
- Encrypt sensitive address fields at rest
- No address data in logs or error messages
- Use HTTPS for all address transmission

### Carrier Integration
- API keys stored in secure configuration (environment variables)
- Use OAuth where available instead of API keys
- Webhooks require signature verification (HMAC)
- Webhook processing is idempotent (handle duplicates)
- Timeout configured for all carrier API calls (30 seconds default)

### Tracking Security
- Tracking numbers obfuscated in URLs (require order context)
- Rate limiting on tracking lookups (prevent enumeration)
- Customer can only view own shipment tracking
- Admin can view all shipments

### Label Security
- Shipping labels contain minimal sensitive info
- Do not store customer payment methods on labels
- Label URLs expire after 30 days
- Labels regenerated for reprints

---

## 9. Acceptance Criteria

### Address Management
- ✅ User can add shipping address
- ✅ Address search/autocomplete works via Nominatim (type-ahead by street/place/postal code)
- ✅ Selecting a result fills address fields and populates latitude/longitude
- ✅ Address validated + geocoded via Nominatim (geocode_source recorded)
- ✅ Nominatim unavailable → manual entry still allowed (submission never blocked)
- ✅ "© OpenStreetMap contributors" attribution shown on search UI
- ✅ Invalid addresses rejected with guidance
- ✅ Multiple addresses stored and retrievable
- ✅ Default address set and used in checkout

### Shipping Methods
- ✅ Available methods displayed based on address
- ✅ Shipping cost calculated correctly
- ✅ Delivery estimates shown (min-max days)
- ✅ Methods filtered by weight/dimensions
- ✅ Cost displayed in checkout and order summary

### Shipment Creation
- ✅ Shipment created on order fulfillment
- ✅ Tracking number generated and stored
- ✅ Shipping label created and retrievable
- ✅ Shipment marked as shipped
- ✅ Customer notified with tracking info

### Tracking
- ✅ Tracking number lookups work
- ✅ Status updates appear in real-time
- ✅ Delivery date estimates displayed
- ✅ Exception status shown if applicable
- ✅ Customer receives notifications on major status changes

### Multiple Shipments
- ✅ Orders can ship in multiple packages
- ✅ Each shipment has own tracking number
- ✅ Order shows all shipments
- ✅ Customer notified of each shipment

### Returns
- ✅ Return label generated and emailed
- ✅ Return tracking created
- ✅ Return received confirmed
- ✅ Refund processed on receipt
- ✅ Non-returnable items not allowed

---

## 10. Integration Points

### Geocoding / Address Integration
- **Provider**: Nominatim (OpenStreetMap) — Search API for address lookup/autocomplete, Reverse API for lat/lon → address
- **Endpoints**: `/search` (query → candidates), `/reverse` (coords → address)
- **Config**: `nominatim_base_url` (public or self-hosted), `User-Agent` identifying the app
- **Constraints**: ≤1 req/s on public endpoint, cache results, ODbL attribution required

### Carrier Integrations
- **Carriers**: FedEx, UPS, USPS, DHL, local couriers
- **Integration**: API for label generation, rate calculation, tracking (carrier APIs are NOT used for address validation — that is Nominatim's role)
- **Webhooks**: Receive tracking updates from carriers

### Dependency Services
- **Order System** (09_): For order details and items
- **Member System** (01_): For customer contact info
- **Payment System** (03_): For shipping cost in invoice
- **Notification Service** (06_): For tracking updates, return labels
- **Inventory Service** (08_): For product dimensions and weight

### Integration Hooks
- On order confirmed: Make shipment and request carrier label
- On carrier webhook: Update tracking status and notify customer
- On delivery exception: Alert admin and customer with next steps
- On return initiated: Generate return label and email
- On return received: Trigger refund processing

---

## 11. Configuration Parameters

| Parameter | Default | Min | Max | Notes |
|-----------|---------|-----|-----|-------|
| Primary carrier | fedex | - | - | Default carrier |
| Address validation/geocoding provider | nominatim | - | - | OpenStreetMap Nominatim (replaces usps/ups/fedex/daum/kakao) |
| nominatim_base_url | https://nominatim.openstreetmap.org | - | - | Public endpoint; self-host for volume |
| Nominatim rate limit (req/s) | 1 | - | - | Public endpoint hard limit |
| Nominatim language (accept-language) | (request locale) | - | - | Result localization |
| Return window (days) | 30 | 0 | 365 | Days from delivery |
| Weight unit | lbs | - | - | lbs or kg |
| Signature required | false | - | - | Default for all shipments |
| Tracking update frequency | realtime | - | - | Webhook vs polling |
| Label format | 4x6 | - | - | 4x6 or 8.5x11 |
| Max shipment weight (lbs) | 100 | 1 | 1000 | Hard limit per package |
| Retry failed tracking | true | - | - | Retry lookup if failed |
| Address validation override | true | - | - | Allow skipping validation |

---

## 12. Known Dependencies

- **Shipping Logistics** depends on **Member System** (01_) for customer contact info
- **Shipping Logistics** depends on **Shopping Mall** (02_) for item dimensions/weight
- **Shipping Logistics** is used by **Order Management** (09_) for shipment tracking
- **Shipping Logistics** integrates with **Payment System** (03_) for shipping costs
- **Shipping Logistics** integrates with **Notification System** (06_) for tracking updates
- **Shipping Logistics** depends on **Inventory Management** (08_) for weight/dimensions
