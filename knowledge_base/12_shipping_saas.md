# Domain Module 12: Shipping SaaS (국제 배송대행 + 창고 + 픽업)

## Section 1: Module Identification

- **Module ID:** 12_shipping_saas
- **Domain:** International Shipping SaaS (warehouse, inbound, inspection, pickup, international shipment)
- **Version:** 1.0.0
- **Status:** Active
- **Source:** Extracted from SchnellMoon (Kleinanzeigen purchase proxy platform) — 2026-07-19
- **Dependent Modules:** 09_order_management, 03_payment_system

---

## Section 2: Core Features (10)

| # | Feature | Description |
|---|------|------|
| F1 | Warehouse inbound registration | Record item arrival at operator warehouse; link to order |
| F2 | Physical measurement recording | Weight (kg), L×W×H (cm), box count; auto-calculate volumetric weight |
| F3 | Inspection & photo documentation | Condition assessment (GOOD/DAMAGED/MISSING_PARTS), issue list, photo_urls (jsonb) |
| F4 | 2nd quote generation | Calculate international shipping fee from billedWeight × ShippingRate table |
| F5 | Pickup request management | Create pickup job with seller address; track 10-step pickup lifecycle |
| F6 | Eurosender API integration | External logistics API for pickup scheduling (견적/예약) |
| F7 | Admin shipping rate management | Admin-configurable rate table (zone × weight bracket → fee EUR) |
| F8 | Packing list + invoice generation | Customer-facing shipping documents |
| F9 | International shipment tracking | Carrier + tracking number; status → SHIPPED_TO_KOREA → DELIVERED |
| F10 | Pickup fee calculator | Base €40 + roundTripKm × €1.5; admin-adjustable |

---

## Section 3: Database Schema

```sql
-- Inbound order
CREATE TABLE inbound_orders (
  id            TEXT PRIMARY KEY,
  order_id      TEXT UNIQUE NOT NULL REFERENCES proxy_orders(id),
  box_count     INTEGER,
  weight_kg     DECIMAL,
  length_cm     DECIMAL,
  width_cm      DECIMAL,
  height_cm     DECIMAL,
  volume_weight DECIMAL,  -- (L×W×H)/6000
  billed_weight DECIMAL,  -- MAX(actual, volume)
  inbound_at    TIMESTAMPTZ,
  location      TEXT,     -- warehouse shelf/bin
  photo_urls    JSONB DEFAULT '[]',
  status        TEXT DEFAULT 'PENDING',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Inspection
CREATE TABLE inspection_records (
  id           TEXT PRIMARY KEY,
  inbound_id   TEXT UNIQUE NOT NULL REFERENCES inbound_orders(id),
  condition    TEXT NOT NULL,  -- GOOD | DAMAGED | MISSING_PARTS
  issues       JSONB DEFAULT '[]',  -- string[]
  photo_urls   JSONB DEFAULT '[]',
  notes        TEXT,
  inspected_by TEXT NOT NULL,  -- admin user id
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Pickup
CREATE TABLE pickup_requests (
  id              TEXT PRIMARY KEY,
  order_id        TEXT UNIQUE NOT NULL REFERENCES proxy_orders(id),
  seller_address  TEXT NOT NULL,
  seller_phone    TEXT,
  preferred_date  TIMESTAMPTZ,
  actual_date     TIMESTAMPTZ,
  pickup_fee      DECIMAL NOT NULL,
  round_trip_km   DECIMAL,
  status          TEXT DEFAULT 'REQUESTED',
  eurosender_id   TEXT,  -- external pickup reference
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Pickup events (10-step tracking)
CREATE TABLE pickup_events (
  id          TEXT PRIMARY KEY,
  request_id  TEXT NOT NULL REFERENCES pickup_requests(id),
  event       TEXT NOT NULL,  -- REQUESTED|CONFIRMED|EN_ROUTE|AT_LOCATION|...
  note        TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Shipping rate table
CREATE TABLE shipping_rates (
  id            TEXT PRIMARY KEY,
  zone          TEXT NOT NULL,   -- destination country/region
  min_weight_kg DECIMAL NOT NULL,
  max_weight_kg DECIMAL NOT NULL,
  rate_eur      DECIMAL NOT NULL,
  carrier       TEXT,
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- International shipment
CREATE TABLE shipments (
  id               TEXT PRIMARY KEY,
  order_id         TEXT UNIQUE NOT NULL REFERENCES proxy_orders(id),
  carrier          TEXT NOT NULL,
  tracking_number  TEXT NOT NULL,
  shipped_at       TIMESTAMPTZ NOT NULL,
  estimated_arrival TIMESTAMPTZ,
  delivered_at     TIMESTAMPTZ
);
```

---

## Section 4: API Endpoints

```
POST /api/pickup
  Body: { orderId, sellerAddress, sellerPhone?, preferredDate?, roundTripKm? }
  → creates PickupRequest
  → order status: PICKUP_REQUIRED → PICKUP_SCHEDULED

GET  /api/pickup/:id
  → { request, events: PickupEvent[] }

GET  /api/packing-list/:orderId    -- customer packing list document
GET  /api/invoice/:orderId         -- customer shipping invoice

-- Admin
GET  /admin/inbound                -- pending inbound list
PATCH /admin/inbound/:id/status    -- mark arrived at warehouse
PATCH /admin/inbound/:id/measurements
  Body: { weightKg, lengthCm, widthCm, heightCm, boxCount }
  → auto-calculates volumeWeight + billedWeight
  → generates 2nd payment quote

POST /admin/inbound/:id/inspection
  Body: { condition, issues, photoUrls, notes }

GET  /admin/shipments              -- all shipments list
POST /admin/shipments              -- record shipment dispatch
  Body: { orderId, carrier, trackingNumber, shippedAt }

GET  /admin/shipping-rates         -- rate table
POST /admin/shipping-rates         -- add rate
PATCH /admin/shipping-rates/:id    -- update rate
```

---

## Section 5: Business Logic

### Volumetric Weight
```
volumeWeight (kg) = (lengthCm × widthCm × heightCm) / 6000
billedWeight = MAX(actualWeightKg, volumeWeight)
internationalShippingFee = lookup ShippingRate WHERE
  zone = destinationCountry AND
  minWeightKg <= billedWeight AND billedWeight < maxWeightKg
```

### Pickup Fee
```
pickupFee = 40 + (roundTripKm × 1.5)   // EUR
Minimum pickup fee: €40 (zero km distance)
Admin can override: admin-adjustable base rate and per-km rate in SiteConfig
```

### 2-Stage Payment Trigger
```
INSPECTING → measurement recorded →
  → calculate: internationalShippingFee + highValueSurcharge
  → create OrderQuote (stage=2)
  → status: SECOND_PAYMENT_PENDING
  → send email notification to customer
```

### 10-Step Pickup Lifecycle
```
1.  REQUESTED      -- operator creates pickup job
2.  CONFIRMED      -- pickup appointment confirmed
3.  EN_ROUTE       -- operator in transit to seller
4.  AT_LOCATION    -- operator arrived at seller location
5.  COLLECTED      -- item picked up from seller
6.  RETURNING      -- operator returning to warehouse
7.  ARRIVED_WAREHOUSE -- item delivered to warehouse
8.  INSPECTION_STARTED -- inspection begun
9.  INSPECTION_DONE    -- inspection complete
10. COMPLETED          -- pickup job complete
```

---

## Section 6: Integration Points

| Integration | Purpose | Notes |
|-------------|---------|-------|
| Eurosender API | External pickup scheduling (Europe) | Partial integration;견적/예약 |
| Order Module | Status machine (ARRIVED_WAREHOUSE, SECOND_PAYMENT_PENDING) | Hard dependency |
| Payment Module | 2nd payment quote + checkout | Hard dependency |
| Email Module | Warehouse arrival notification, shipping notification | Via EmailScheduler |
| Admin File Storage | Inspection photo upload | S3/R2/CDN |

---

## Section 7: Security Requirements

```
Photo upload:
  - Validate MIME type (image/jpeg, image/png, image/webp only)
  - Max file size: 10MB per image, max 10 images per inspection
  - Store in private bucket; serve via signed URLs (1-hour expiry)
  - Never expose raw S3 URLs in API responses

Measurement data:
  - Validate all dimensions are positive numbers
  - Auto-calculate derived fields server-side (never trust client)

Pickup address:
  - Seller address masked/hidden from customer (only operator sees)
  - Contact masking applied to any seller contact info in messages
```

---

## Section 8: State Transitions (Order Status — Shipping Related)

```
[Seller ships]
  PAID_TO_SELLER → TRACKING_RECEIVED → IN_TRANSIT_DE → ARRIVED_WAREHOUSE

[Pickup needed]
  PAID_TO_SELLER → PICKUP_REQUIRED → PICKUP_SCHEDULED
    → PICKUP_FAILED → CANCELLED → REFUNDED
    → ARRIVED_WAREHOUSE

[After inbound]
  ARRIVED_WAREHOUSE → INSPECTING → SECOND_PAYMENT_PENDING
    → SECOND_PAYMENT_COMPLETED → SHIPPED_TO_KOREA
    → CUSTOMS_IN_PROGRESS → DELIVERED → CLOSED
```

---

## Section 9: Admin Panel Features

```
Inbound queue (/sk-staff/inbound):
  - List: orders in ARRIVED_WAREHOUSE or earlier
  - Actions per order: record dimensions, add inspection, upload photos
  - Bulk measurement entry for efficiency

Shipments (/sk-staff/shipments):
  - List all in SHIPPED_TO_KOREA status
  - Record tracking number + carrier
  - Mark as DELIVERED manually (or webhook from carrier)

Shipping rates (/sk-staff/shipping-rates):
  - CRUD for zone × weight bracket → EUR rate table
  - Carrier assignment per zone
  - Preview: "this order would be charged X EUR at current rates"
```

---

## Section 10: Error Scenarios

| Scenario | Handling |
|----------|---------|
| Pickup failed (seller not home) | Status: PICKUP_FAILED → admin re-schedules or cancels |
| Item arrives damaged | InspectionRecord condition=DAMAGED → admin contacts customer → may trigger Claim |
| Weight exceeds estimate significantly | 2nd quote differs from estimate → customer may reject → re-quote or cancellation |
| Eurosender API down | Fallback: manual pickup record; flag for retry |
| Photo upload fails | Retry with exponential backoff; partial upload allowed |

---

## Section 11: Acceptance Criteria

- [ ] Measurement recorded → volumeWeight + billedWeight auto-calculated correctly
- [ ] 2nd payment quote = ShippingRate lookup by zone + billedWeight
- [ ] Pickup lifecycle progresses through all 10 steps
- [ ] Inspection photos uploaded and stored; accessible to admin
- [ ] Packing list and invoice generated and accessible to customer
- [ ] Shipping rate table admin-updatable; new orders use latest rates
- [ ] ARRIVED_WAREHOUSE status triggers customer email notification
- [ ] SHIPPED_TO_KOREA status + tracking number visible to customer

---

## Section 12: Implementation Notes

```
Modular extraction priority:
  shipping-pickup module has 11 FKs into orders module
  → Cannot be installed without orders module
  → Extraction requires orders as hard `requires` dependency

Eurosender integration status:
  → API integration exists; UI wiring incomplete
  → Fallback: admin manual pickup management works without Eurosender

Photo storage:
  → Recommend R2 (Cloudflare) or S3 for inspection photos
  → Store as JSONB array of strings (CDN URLs) in photo_urls
  → Keep original filenames for traceability

German warehouse operations:
  → Eigenbeleg (seller payment receipt) generated by accounting module
  → Seller payments are cash or bank transfer; operator records manually
  → German postal code required for pickup fee calculation (km estimate)
```
