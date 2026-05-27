# Purchase Agency Core - 해외 구매대행 표준 정의

**Version:** 1.0.0  
**Effective Date:** 2026-05-27  
**Purpose:** Overseas Purchase Agency Platform Standard Definition  
**Status:** MANDATORY for purchase agency projects  
**Language:** Korean (한국어)

---

## 📌 Executive Summary

Purchase Agency Core는 해외 상품 구매 대행 플랫폼의 최소 필요 기능, 데이터 구조, 상태값, API 패턴을 정의합니다. 

**4단계 흐름:**
1. **해외 구매 (Overseas Purchase)**: 고객이 해외 상품 구매 요청 → 대행사가 구매
2. **국제 배송 (International Shipping)**: 판매처 → 현지 창고 (1-2주)
3. **통관 처리 (Customs Processing)**: 관세 신고, 서류, 검사 (3-7일)
4. **국내 배송 (Domestic Shipping)**: 현지 창고 → 최종 고객 (2-5일)

**핵심 원칙:**
- 고객 1명 → 국가 1곳 → 판매처 여러 개 가능
- 환율 고정 (구매 시점 기준)
- 비용 명확 (구매가 + 배송 + 관세 + 국내 배송)
- 정산 자동화

---

## 1️⃣ 기본 포함 기능 (Non-Negotiable)

### 구매 요청 관리
- **구매 요청 생성**: 고객이 해외 상품 구매 신청
  - 상품명, URL, 판매처, 수량, 원화 환산
  - 요청 상태 추적
  - 한 요청 = 한 국가 (다국가 혼합 불가)
- **구매 요청 검토**: 대행사가 구매 가능 여부 판단
  - 가능: 수락 (구매 진행)
  - 불가: 거절 (사유 기록)
- **구매 추적**: 구매 진행상황 모니터링
  - 구매 완료 확인
  - 배송 준비 확인

### 비용 추정 및 확인
- **비용 추정 (Estimate)**
  - 상품 구매가 (고정)
  - 국제 배송료 (무게/크기 기반, 보험 포함)
  - 환율 (구매 시점)
  - 예상 관세 (상품 종류별)
  - 국내 배송료 (지역별)
  - 대행 수수료 (기본 10%)
  - 총 비용 = 구매가 × 환율 + 국제 배송 + 예상 관세 + 국내 배송 + 수수료
- **비용 확인 (Confirmation)**
  - 고객이 추정 비용 검토
  - 동의하면 진행, 거절하면 취소
- **최종 정산 (Final Settlement)**
  - 실제 비용 (관세는 실제 청구 금액으로 조정)
  - 초과 비용 징수 또는 환불

### 국제 배송
- **배송사 선택**: 국가별 배송사 (DHL, FedEx, UPS 등)
- **추적**: 실시간 위치 확인
- **현지 창고 도착**: 배송 완료, 통관 준비

### 통관 처리
- **통관 신청**: 대행사가 관세청에 신고
  - 상품 정보 (HS Code, 원산지)
  - 인보이스
  - 기타 서류
- **관세 계산**: 상품가 기반 자동 계산
- **통관 상태 추적**: 신청 → 검사 → 승인/보류 → 납세 → 통관
- **통관 실패**: 반송 또는 재신고 절차

### 국내 배송
- **배송사 선택**: 국내 택배 (CJ, 대한통운, 로젠 등)
- **배송 추적**: 실시간 위치 및 배송 상태
- **최종 배송**: 고객 주소로 배송

### 고객 커뮤니케이션
- **상태 알림**: 각 단계별 자동 알림
- **질의응답**: 고객 질문 수렴 및 답변

### 반품 및 환불
- **반품 신청**: 배송받은 후 30일 이내
- **반품 배송**: 역순 배송 (고객 → 국내 → 통관 → 국제 → 판매처)
- **환불 처리**: 판매처 환불 → 고객 환불
- **비용 차감**: 배송료 및 통관료는 환급 불가

---

## 2️⃣ 기본 DB 구조 (10개 핵심 테이블)

| # | 테이블 | 목적 | 소유 모듈 | 행 수 추정 (1년) |
|---|--------|------|---------|-----------------|
| 1 | `users` | 회원 정보 | 01_member_system | 10K-100K |
| 2 | `purchase_requests` | 구매 요청 | 09_order_management | 1K-10K |
| 3 | `purchase_orders` | 실제 해외 구매 | 09_order_management | 1K-10K |
| 4 | `cost_estimates` | 비용 추정 | 03_payment_system | 5K-50K |
| 5 | `exchange_rates` | 환율 정보 | 03_payment_system | 365 (일일 1개) |
| 6 | `international_shipments` | 국제 배송 | 04_shipping_logistics | 1K-10K |
| 7 | `customs_declarations` | 통관 신청 | 04_shipping_logistics | 1K-10K |
| 8 | `domestic_shipments` | 국내 배송 | 04_shipping_logistics | 1K-10K |
| 9 | `settlements` | 정산 내역 | 03_payment_system | 1K-10K |
| 10 | `agency_staff` | 대행사 직원 | 05_admin_system | 10-100 |

### 테이블 스키마 개요

**purchase_requests**
```
id (PK) | user_id (FK) | request_number | destination_country | 
product_name | vendor_url | quantity | estimated_price_usd | 
status | created_at | updated_at | notes
```

**cost_estimates**
```
id (PK) | purchase_request_id (FK) | estimated_product_cost | international_shipping | 
insurance_cost | tariff_estimated | domestic_shipping | agency_fee | 
total_estimated_krw | exchange_rate_used | status | created_at
```

**international_shipments**
```
id (PK) | purchase_request_id (FK) | vendor_name | tracking_number | 
shipping_company | status | dispatched_at | arrived_at | created_at
```

---

## 3️⃣ 기본 상태값 (Status Value Registry)

### Purchase Request Status (구매 요청 상태)
```
(1) pending
    → (2) accepted
        → (3) purchased
            → (4) in_transit_international
                → (5) arrived_warehouse
                    → (6) processing_customs
                        → (7) customs_cleared
                            → (8) ready_to_ship_domestic
                                → (9) in_transit_domestic
                                    → (10) delivered
                                        → (11) completed
또는
(1) pending → (X) rejected
Any state → (X) canceled
```

**상태별 설명:**
- `pending`: 구매 요청 생성, 대행사 검토 대기
- `accepted`: 대행사 수락, 구매 진행
- `purchased`: 해외에서 상품 구매 완료
- `in_transit_international`: 국제 배송 중
- `arrived_warehouse`: 현지 창고 도착
- `processing_customs`: 통관 신청/검사 중
- `customs_cleared`: 통관 완료
- `ready_to_ship_domestic`: 국내 배송 준비
- `in_transit_domestic`: 국내 배송 중
- `delivered`: 최종 배송 완료
- `completed`: 거래 완료 (30일 반품 가능 기간 경과)
- `rejected`: 대행사가 구매 불가 판단
- `canceled`: 고객 취소 요청

### Cost Status (비용 상태)
```
(1) estimated
    → (2) confirmed
        → (3) finalized
            → (4) paid
```

### International Shipment Status (국제 배송 상태)
```
(1) dispatched
    → (2) in_transit
        → (3) arrived_warehouse
```

### Customs Declaration Status (통관 신청 상태)
```
(1) submitted
    → (2) inspecting
        → (3) approved
    또는 → (X) failed
```

### Domestic Shipment Status (국내 배송 상태)
```
(1) ready_to_ship
    → (2) in_transit
        → (3) delivered
    또는 → (X) failed
```

---

## 4️⃣ 기본 API 엔드포인트 (40+ endpoints)

### Purchase Request (8 endpoints)
```
POST   /purchase-requests                 구매 요청 생성
GET    /purchase-requests                 구매 요청 목록 (개인)
GET    /purchase-requests/{id}            구매 요청 상세
PUT    /purchase-requests/{id}/cancel     구매 요청 취소
GET    /purchase-requests/{id}/tracking   전체 추적 정보 (통합)
POST   /admin/purchase-requests/{id}/accept 구매 요청 수락 (관리자)
POST   /admin/purchase-requests/{id}/reject 구매 요청 거절 (관리자)
GET    /admin/purchase-requests           구매 요청 목록 (관리자)
```

### Cost Estimation (6 endpoints)
```
POST   /purchase-requests/{id}/estimate-costs  비용 추정
GET    /purchase-requests/{id}/cost-estimate   추정 비용 조회
POST   /purchase-requests/{id}/confirm-costs   비용 확인/동의
GET    /purchase-requests/{id}/cost-history    비용 변경 이력
POST   /purchase-requests/{id}/finalize-costs  최종 비용 정산 (관리자)
GET    /purchase-requests/{id}/tariff-estimate 예상 관세 조회
```

### Exchange Rate (3 endpoints)
```
GET    /exchange-rates                    현재 환율 조회
GET    /exchange-rates/history/{currency} 환율 이력
POST   /admin/exchange-rates/update       환율 수동 업데이트 (관리자)
```

### International Shipment Tracking (5 endpoints)
```
GET    /purchase-requests/{id}/international-shipment  국제 배송 조회
POST   /admin/shipments/{id}/dispatch                  배송 시작 (관리자)
PUT    /admin/shipments/{id}/tracking-update           추적정보 수동 업데이트 (관리자)
GET    /admin/shipments                                전체 국제 배송 (관리자)
POST   /admin/shipments/{id}/arrive-warehouse          창고 도착 기록 (관리자)
```

### Customs Processing (6 endpoints)
```
GET    /purchase-requests/{id}/customs-declaration    통관 신청 현황
POST   /admin/customs/{id}/submit                     통관 신청 (관리자)
PUT    /admin/customs/{id}/update-status              통관 상태 변경 (관리자)
GET    /admin/customs/{id}/tariff-actual              실제 관세 확인 (관리자)
POST   /admin/customs/{id}/approve                    통관 승인 (관리자)
POST   /admin/customs/{id}/fail-shipment              통관 실패 - 반송 (관리자)
```

### Domestic Shipment Tracking (5 endpoints)
```
GET    /purchase-requests/{id}/domestic-shipment      국내 배송 조회
POST   /admin/domestic-shipments/{id}/dispatch        국내 배송 시작 (관리자)
PUT    /admin/domestic-shipments/{id}/tracking-update 추적정보 수동 업데이트 (관리자)
GET    /admin/domestic-shipments                      전체 국내 배송 (관리자)
POST   /admin/domestic-shipments/{id}/deliver         배송 완료 기록 (관리자)
```

### Settlement & Refund (4 endpoints)
```
GET    /user/settlements                  개인 정산 내역
GET    /admin/settlements                 전체 정산 현황
POST   /admin/settlements/process-monthly 월별 정산 처리 (관리자)
POST   /purchase-requests/{id}/refund     환불 처리 (관리자)
```

### Customer Communication (3 endpoints)
```
GET    /purchase-requests/{id}/messages   상태 알림 메시지
POST   /purchase-requests/{id}/inquiry    고객 질의
GET    /admin/inquiries                   전체 고객 질의 (관리자)
```

---

## 5️⃣ 금지사항 (Prohibitions)

- ❌ **다중 통화 표시 (Multi-currency pricing)**
- ❌ **자동 환율 조정 (Exchange rate retroactive adjustments)**
- ❌ **부분 환불 (Partial refunds)**
- ❌ **다국가 혼합 구매 (Multi-country orders)**
- ❌ **배송 옵션 변경 (Post-confirmation shipping changes)**
- ❌ **관세 환불 (Tariff refunds)**
- ❌ **자동 재배송 (Automatic reshipping after failure)**

---

## 6️⃣ 산업 표준 시나리오

### Scenario 1: Happy Path - 정상 해외 구매

```
Step 1: 구매 요청 (10분)
  고객: 해외 사이트에서 상품 찾음 (예: 아마존 미국)
  고객: 상품명, URL, 수량 입력 → 국가 선택 (미국)
  시스템: 요청 생성, 상태 → "pending"
  
Step 2: 대행사 검토 및 수락 (24시간)
  대행사: 요청 검토 (배송 가능 지역? 금지 상품?)
  대행사: "수락" 클릭
  시스템: 상태 → "accepted"
  
Step 3: 비용 추정 (1시간)
  시스템: 자동 계산
    상품가 $100 + 국제 배송 $20 + 예상 관세 $20 + 국내 배송 10,000원 + 수수료 14달러
    총 = 182,800 KRW
  
Step 4: 비용 확인 (5분)
  고객: 비용 검토 → "동의" 클릭
  시스템: 상태 → "cost_confirmed"
  
Step 5: 결제 (5분)
  고객: 신용카드/계좌이체
  시스템: 결제 완료 → "purchased"

Step 6: 국제 배송 (7-14일)
  대행사: FedEx에 배송 의뢰
  시스템: 상태 → "in_transit_international" → "arrived_warehouse"
  
Step 7: 통관 처리 (3-7일)
  대행사: 관세청에 통관 신청
  시스템: 상태 → "processing_customs" → "customs_cleared"
  
Step 8: 국내 배송 (2-5일)
  대행사: 국내 택배에 의뢰
  시스템: 상태 → "ready_to_ship_domestic" → "in_transit_domestic" → "delivered"
  
Step 9: 거래 완료 (30일 후)
  시스템: 반품 가능 기간 경과 → "completed"
```

**예상 시간:** 3-5주

---

### Scenario 2: 통관 실패

```
상황: 관세청 검사 중 문제 발생

Step 1: 문제 감지
  관세청: 상품 검사 중 문제 발견
  시스템: 상태 → "customs_failed"

Step 2: 고객 알림
  시스템: 고객에게 "통관 실패" 알림
  고객: 재신고 또는 반송 선택

Step 3-A: 재신고 선택
  대행사: 관세청과 협의 → 재신고 신청
  (Step 7부터 다시 시작)

Step 3-B: 반송 선택
  시스템: 상태 → "return_initiated"
  배송사: 반송 배송 시작
  판매처: 환불 처리
  시스템: 상태 → "refunded"
```

---

### Scenario 3: 배송 완료 후 반품

```
상황: 배송받은 상품이 원치 않음

Step 1: 반품 신청 (배송 후 30일 이내)
  고객: "반품 신청" → 반품 사유 선택
  시스템: 상태 → "return_requested"

Step 2: 반품 배송 (고객 → 대행사)
  대행사: 고객에게 반품 배송 주소 제공
  고객: 상품을 반품 주소로 배송
  시스템: 상태 → "return_in_transit_domestic"

Step 3: 창고 도착 (대행사)
  대행사: 상품 검수
  시스템: 상태 → "return_at_warehouse"

Step 4: 역배송 (대행사 → 판매처)
  대행사: 판매처로 역배송
  판매처: 환불 승인
  시스템: 상태 → "return_completed"

Step 5: 고객 환불
  대행사: 고객 계좌로 환불
    원가 - 배송료 - 수수료 (배송료는 환급 불가)
  시스템: 상태 → "refunded"
```

---

## 7️⃣ 제약사항 (Constraints)

| 항목 | 제약 | 이유 |
|------|------|------|
| **한 요청의 국가 수** | 1개 국가만 | 통관 단순화 |
| **최대 구매 금액** | $5,000 | 통관 한도 |
| **최소 배송 기간** | 7일 (국제) | 현실적 배송 기간 |
| **통관 예상 기간** | 3-7일 | 검사 절차 |
| **반품 가능 기간** | 30일 | 산업 표준 |
| **환율 고정 시점** | 구매 시점 | 금리 변동 위험 회피 |
| **환율 변경** | 차월부터 적용 | 고객 보호 |
| **관세 추정 정확도** | ±10% | 예측 불가능성 |
| **배송료 고정** | 무게/크기 기반 | 투명성 |
| **대행 수수료** | 기본 10% | 가치 제공 |
| **결제 타임아웃** | 24시간 | 재고 확보 기간 |

---

## ✅ 체크리스트

- [ ] 10개 기본 DB 테이블 생성됨
- [ ] 40+ API 엔드포인트 구현됨
- [ ] 구매 요청 상태 전이 로직 구현됨
- [ ] 비용 추정 및 확인 프로세스 구현됨
- [ ] 환율 고정 로직 구현됨 (구매 시점 기준)
- [ ] 국제 배송 추적 통합됨
- [ ] 통관 신청 및 추적 구현됨
- [ ] 최종 관세 반영한 비용 정산 구현됨
- [ ] 국내 배송 추적 통합됨
- [ ] 환불 프로세스 구현됨 (배송료/수수료 제외)
- [ ] 월별 정산 자동화됨
- [ ] 고객 상태 알림 자동화됨
- [ ] 다국가 혼합 방지 로직 구현됨
- [ ] 배송 옵션 변경 불가 처리됨
