# Domain Module 13: Customs Clearance (통관 시스템)

## Section 1: Module Identification

- **Module ID:** 13_customs_clearance
- **Domain:** Customs Clearance (통관, HS코드, 개인통관고유부호, 수출입 규정)
- **Version:** 1.0.0
- **Status:** Active
- **Source:** Extracted from SchnellMoon (Kleinanzeigen purchase proxy platform) — 2026-07-19
- **Dependent Modules:** 01_member_system (CustomsProfile on User)

---

## Section 2: Core Features (10)

| # | Feature | Description |
|---|------|------|
| F1 | PCCC storage | Save 개인통관고유부호 on user profile; encrypted at rest |
| F2 | Unipass API verification | Real-time Korean customs code validation via government API |
| F3 | PCCC at order time | Capture PCCC in step 3 of purchase application form |
| F4 | HS code management (admin) | Admin-managed harmonized tariff classification codes |
| F5 | HS code assignment to orders | Assign HS code per order for customs documentation |
| F6 | Customs document generation | Generate invoice, packing list, declaration for Korean customs |
| F7 | Customs status tracking | CUSTOMS_IN_PROGRESS → DELIVERED order states |
| F8 | IP rights request | Customer submits right to purchase certain brand items (trademark) |
| F9 | Compliance screening | Flag orders requiring extra customs attention |
| F10 | Country-specific rules | Different thresholds and regulations by destination country |

---

## Section 3: Database Schema

```sql
-- Personal customs clearance code per user
CREATE TABLE customs_profiles (
  id           TEXT PRIMARY KEY,
  user_id      TEXT UNIQUE NOT NULL REFERENCES users(id),
  pccc         TEXT NOT NULL,  -- encrypted: P/X + 12 digits
  verified     BOOLEAN DEFAULT FALSE,
  verified_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);
-- SECURITY: pccc column stored with application-level AES-256 encryption

-- HS code library
CREATE TABLE hs_codes (
  id              TEXT PRIMARY KEY,
  code            TEXT UNIQUE NOT NULL,  -- e.g. "8471.30"
  description     TEXT NOT NULL,         -- EN: Computer, personal
  description_ko  TEXT,                  -- KO: 개인용 컴퓨터
  duty_rate       DECIMAL,               -- Korean import duty %
  vat_rate        DECIMAL DEFAULT 10,    -- Korean VAT % (usually 10)
  notes           TEXT,                  -- restrictions, special notes
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Rights requests for brand items
CREATE TABLE rights_requests (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL REFERENCES users(id),
  order_id      TEXT REFERENCES proxy_orders(id),
  product_type  TEXT NOT NULL,
  brand         TEXT,
  evidence_url  TEXT,   -- proof of purchase right or authenticity
  status        TEXT DEFAULT 'PENDING',  -- PENDING|APPROVED|REJECTED
  admin_note    TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Customs documents per order (generated at customs stage)
CREATE TABLE customs_documents (
  id          TEXT PRIMARY KEY,
  order_id    TEXT NOT NULL REFERENCES proxy_orders(id),
  type        TEXT NOT NULL,  -- INVOICE|PACKING_LIST|DECLARATION
  file_url    TEXT,           -- stored PDF
  generated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Section 4: API Endpoints

```
-- Customer endpoints
GET  /api/me/customs-profile
  Response: { pccc: string (masked), verified: boolean, verifiedAt: string? }

POST /api/me/customs-profile
  Body: { pccc: string }  -- 13-digit code
  Response: { saved: true }

POST /api/me/customs-profile/verify
  Body: { pccc: string }
  → calls Unipass API server-to-server
  Response: { valid: boolean, verifiedAt?: string }
  Note: never returns raw Unipass response to client

POST /api/rights-request
  Body: { productType, brand?, evidenceUrl?, orderId? }
  Response: { request: RightsRequest }

-- Admin endpoints
GET  /admin/compliance              -- Orders flagged for customs attention
GET  /admin/hs-codes                -- HS code library (search, browse)
POST /admin/hs-codes                -- Add HS code
PATCH /admin/hs-codes/:id           -- Update HS code
GET  /admin/orders/:id/customs      -- Customs view for specific order
  Response: { order, customsProfile, hsCode, documents }
PATCH /admin/orders/:id/customs     -- Assign HS code to order
  Body: { hsCode: string }
POST /admin/orders/:id/customs/generate  -- Generate customs documents

-- No-auth endpoint (PCCC validation utility)
GET  /api/customs/validate?pccc={code}
  → format validation only (not Unipass API)
  Response: { validFormat: boolean }

-- Customs verification for specific order (uses order's customsCode)
POST /api/customs-verify/:orderId
  → verifies the PCCC stored on the order
  Response: { valid: boolean }
```

---

## Section 5: Business Logic

### PCCC Format Validation
```
Korean 개인통관고유부호 (Personal Customs Clearance Code):
  Format: P + 12 alphanumeric  OR  X + 12 alphanumeric  (13 chars total)
  Example: P123456789012

Regex: /^[PX][A-Z0-9]{12}$/i

Validation steps:
  1. Format check (client-side + server-side)
  2. Unipass API verification (server-to-server only)
     - Input: PCCC + user's real name (한글)
     - Output: valid | invalid
     - Error: Unipass API unreachable → NOT_VERIFIED (do not block order)
```

### Customs Duty Thresholds (Korea — 2026)
```
목록통관 (simplified clearance):
  ≤ USD $150 AND not restricted category
  → minimal paperwork, no duty typically

정식통관 (full clearance):
  > USD $150
  → requires invoice, packing list, PCCC
  → duty = product value × hs_code.duty_rate
  → VAT = (product value + duty) × 10%

High-value surcharge trigger:
  > USD $1,000 → +€80 document fee

Duty-free personal allowance:
  Items for personal use, under USD $150: duty-free
  Gifts from overseas: up to USD $100 duty-free
```

### HS Code Lookup
```
HS (Harmonized System) 6-digit international code:
  Chapter (2 digits) → Heading (4 digits) → Subheading (6 digits)
  Korea adds 4 more digits for national tariff (HSK = 10 digits)

Assignment flow:
  1. Admin selects product category → suggest HS code
  2. Admin confirms or overrides
  3. HS code stored on ProxyOrder.hsCode
  4. Used in customs declaration document
```

### Risk Review Trigger
```
Requires RISK_REVIEW status (customs-related):
  - Luxury brand items (risk_score > 70)
  - Restricted categories (firearms, medications, alcohol, food)
  - Items over USD $1,000
  - Items with active IP rights dispute
  → Admin must approve before APPROVED_FOR_PURCHASE transition
```

---

## Section 6: Unipass API Integration

```
Korean Customs Service Open API:
  Base URL: https://unipass.customs.go.kr:38010/ext/rest/
  API Key: issued by Korea Customs Service (register at unipass.customs.go.kr)

Endpoint: personalCrCdQry (개인통관고유부호 조회)
  Method: POST
  Content-Type: application/xml  (XML-based API)

Request:
  <PersonalCrCdQryRtnVo>
    <crkyCn>{API_KEY}</crkyCn>
    <psnlCrCd>{pccc}</psnlCrCd>
    <psnlEntrNm>{userRealName}</psnlEntrNm>
  </PersonalCrCdQryRtnVo>

Response:
  <PsnlCrCdQryRtnVo>
    <ntceInfo>정상</ntceInfo>     -- "정상" = valid
    <rtnCode>00</rtnCode>         -- "00" = success
    <psnlCrCd>{pccc}</psnlCrCd>
    <psnlNm>{name}</psnlNm>
  </PsnlCrCdQryRtnVo>

Error codes:
  01: PCCC not found
  02: Name mismatch
  99: System error

NestJS service pattern:
```typescript
async verifyPccc(pccc: string, realName: string): Promise<boolean> {
  try {
    const xml = buildUnipassRequest(pccc, realName)
    const response = await axios.post(UNIPASS_URL, xml, {
      headers: { 'Content-Type': 'application/xml' },
      timeout: 10000,  // 10s timeout
    })
    const result = parseUnipassResponse(response.data)
    return result.rtnCode === '00' && result.ntceInfo === '정상'
  } catch (error) {
    logger.warn('Unipass API error', { error: error.message })
    return false  // Don't block order on API failure; flag as NOT_VERIFIED
  }
}
```

---

## Section 7: Customs Document Generation

```
Documents generated at SECOND_PAYMENT_COMPLETED:

1. Commercial Invoice
   Fields: shipper (operator), consignee (recipient), product description,
           quantity, unit value (EUR), total value, currency, HS code, origin country
   Format: PDF template with operator letterhead

2. Packing List
   Fields: same as invoice + actual weight, dimensions, box count
   Purpose: Korean customs physical inspection reference

3. Customs Declaration
   Fields: PCCC, recipient name, product categories, total declared value
   Purpose: Korean customs automated clearance (목록통관/정식통관)

Template engine: Puppeteer (headless Chrome PDF) or @react-pdf/renderer
Storage: S3/R2 private bucket; presigned URL for customer download
Retention: 10 years (Korea customs record-keeping requirement)
```

---

## Section 8: Country-Specific Rules

```
Korea (primary market):
  Currency: USD/EUR declared value (conversion at customs rate)
  Threshold: USD $150 for simplified clearance
  PCCC: required for all shipments (personal imports)
  Carriers: EMS, DHL, FedEx, K-Packet

Japan:
  Currency: JPY declared value
  Threshold: ¥10,000 for duty assessment
  No PCCC equivalent; passport/resident ID used

USA:
  Currency: USD
  Threshold: USD $800 (de minimis)
  ISF filing required for ocean freight

Germany → Korea (SchnellMoon primary):
  EUR → KRW conversion at customs rate (not SiteConfig.exchangeRate)
  German origin: show on invoice
```

---

## Section 9: Security Requirements

```
PCCC encryption:
  Algorithm: AES-256-GCM with per-record IV
  Key: ENCRYPTION_KEY env var (minimum 32 bytes)
  Never log PCCC in plaintext (mask as P***********2 in logs)
  Unipass API called server-to-server only (API key never exposed to client)

Document access:
  Customs documents in private S3 bucket
  Presigned URLs: 1-hour expiry
  Only accessible to: order's customer + admin

HS code:
  HS codes are public data (not sensitive)
  Admin-only write access
  Customer-facing: only the HS code value on order detail (not duty rates)
```

---

## Section 10: Error Scenarios

| Scenario | Handling |
|----------|---------|
| Unipass API unavailable | Mark as NOT_VERIFIED, allow order to proceed, flag for admin review |
| PCCC not found | Return invalid; customer must update PCCC |
| Name mismatch | Return invalid; customer must re-enter real name matching government ID |
| Customs hold in Korea | Admin updates status CUSTOMS_IN_PROGRESS + notes; contacts customer |
| Prohibited item detected | Trigger RISK_REVIEW; admin decides: approve or cancel + refund |
| Customs duty assessed | Admin adds duty as extra charge (OrderExtraCharge); customer pays |

---

## Section 11: Acceptance Criteria

- [ ] PCCC saved at order step 3 and at /my-page?tab=customs
- [ ] Unipass verification returns valid/invalid within 10 seconds
- [ ] Unipass API failure does NOT block order creation
- [ ] HS code assignable by admin on order customs page
- [ ] Customs documents (invoice + packing list) generated as PDF
- [ ] PCCC masked in API responses (P***...) and logs
- [ ] Rights request submitted and visible to admin
- [ ] CUSTOMS_IN_PROGRESS status triggers customer notification email
- [ ] Items over USD $1,000 trigger high-value surcharge automatically

---

## Section 12: Implementation Notes

```
Unipass API:
  - Register at: https://unipass.customs.go.kr
  - API key approval takes 3-5 business days
  - XML-based (not REST JSON) — use xml2js or fast-xml-parser
  - Test environment available (separate credentials)
  - Rate limit: 1,000 calls/day on free tier

PCCC collection strategy:
  - Collect at STEP 3 of order form (order-specific)
  - Save to user profile at same time (convenience)
  - If not provided at order time: admin can request via order chat

HS code database:
  - WCO publishes HS code revisions every 5 years (next: 2027)
  - Korea-specific HSK codes: Korea Customs Service publishes annually
  - Pre-seed database with top 100 categories for the target marketplace

Customs duty payment:
  - For 목록통관: typically pre-paid by customer on delivery
  - For 정식통관: operator may advance duty and charge customer as extra
  - Record as OrderExtraCharge (type=CUSTOMS_DUTY, amountKRW)
```
