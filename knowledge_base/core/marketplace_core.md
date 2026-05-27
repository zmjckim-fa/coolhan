# Marketplace Core - 다중 판매자 전자상거래 표준 정의

**Version:** 1.0.0  
**Effective Date:** 2026-05-27  
**Purpose:** Multi-Vendor Marketplace Platform Standard Definition  
**Status:** MANDATORY for marketplace projects  
**Language:** Korean (한국어)

---

## 📌 Executive Summary

Marketplace Core는 다중 판매자(Multi-Vendor) 전자상거래 플랫폼의 최소 필요 기능, 데이터 구조, 상태값, API 패턴을 정의합니다. Shopping Mall Core를 기반으로 확장되며, 판매자 관리, 수수료, 정산, 분쟁 해결을 추가합니다.

**핵심 원칙:**
- Shopping Mall Core 모든 기능 포함 + 다중 판매자 레이어
- 플랫폼 (Platform-to-Vendor-to-Consumer, PV2C)
- 판매자 등록, 인증, 판매자별 독립 상품 관리
- 판매자별 결제/정산 처리
- 분쟁 해결 및 중재

---

## 1️⃣ 기본 포함 기능 (Non-Negotiable)

Shopping Mall Core의 모든 기능 + 다음 추가 기능:

### 판매자 관리
- **판매자 등록**: 개인/법인 판매자 구분
  - 필수 정보: 사업자등록번호, 은행 계좌, 대표자 정보
  - 서류 검증 (1-3일 소요)
  - 판매자 등급 설정 (일반, 프리미엄, VIP)
  - 판매자 비활성화 (정지, 영구차단)
- **판매자 프로필**: 판매자 정보 관리
  - 판매자명, 설명, 로고/배너 이미지
  - 판매자 평점 및 리뷰 (평균 평점, 배송 신뢰도)
  - 판매자 정책 (반품 기간, 배송료 정책)
  - 판매자 통계 (판매액, 판매량, 월별 추이)
- **판매자 승인 워크플로우**
  - 신청 → 검토 → 승인/거절
  - 관리자 검토 필수

### 상품 카탈로그 (판매자별 독립)
- **상품 등록** (판매자)
  - 판매자별 상품 관리
  - 카테고리 선택 (플랫폼 공통 또는 판매자 커스텀)
  - SKU 관리 (판매자 고유 ID)
- **상품 조회** (고객)
  - 판매자 필터 (특정 판매자 상품만)
  - 판매자별 가격 비교

### 주문 및 정산
- **판매자별 정산**: 월 1회 자동 정산
  - 판매액 = 상품 판매가 합계
  - 수수료 = 판매액 × 수수료율 (기본 5-15%, 카테고리별 변동)
  - 정산액 = 판매액 - 수수료
  - 반품 발생 시 정산액에서 차감
- **정산 주기**: 매월 말일 정산, 차월 5일 입금

### 판매자 분쟁 해결
- **상품 분쟁** (고객 vs 판매자)
  - 부정확한 상품 설명
  - 상품 미배송
  - 품질 문제
- **배송 분쟁**
  - 배송 지연
  - 배송 손상
  - 잘못된 상품 배송
- **반품/환불 분쟁**
  - 반품 거부
  - 환불 지연
- **분쟁 해결 프로세스**
  - 신청 → 증거 수집 (고객/판매자) → 플랫폼 중재 → 결정 → 집행
  - 타임아웃: 각 단계 7일 이내

### 판매자 커뮤니케이션
- **메시지 시스템**: 판매자 ↔ 고객 직접 메시지
  - 주문 관련 질문
  - A/S 요청
  - 타임아웃: 미답변 48시간 후 자동 환불 가능
- **공지사항**: 판매자가 고객에게 공지 (배송 지연, 정책 변경 등)

### 판매자 마케팅 (선택)
- **프로모션 관리**: 판매자가 자체 할인 설정
  - 고정 할인가 (기본)
  - 정량 할인은 비활성화 (복잡도)
- **판매자 광고**: 카테고리/검색 결과 상단 노출 (유료)

---

## 2️⃣ 기본 DB 구조 (Shopping Mall Core 9개 + Marketplace 7개 = 16개 핵심 테이블)

| # | 테이블 | 목적 | 소유 모듈 | 행 수 추정 (1년) |
|---|--------|------|---------|-----------------|
| 1 | `users` | 회원 정보 | 01_member_system | 10K-100K |
| 2 | `vendors` | 판매자 정보 | 05_vendor_management | 100-1K |
| 3 | `vendor_accounts` | 판매자 계좌 | 05_vendor_management | 100-1K |
| 4 | `vendor_documents` | 판매자 인증 서류 | 05_vendor_management | 100-1K |
| 5 | `products` | 상품 (판매자별) | 02_shopping_mall | 5K-50K |
| 6 | `product_images` | 상품 이미지 | 02_shopping_mall | 25K-250K |
| 7 | `addresses` | 배송 주소 | 01_member_system | 20K-200K |
| 8 | `cart_items` | 장바구니 | 02_shopping_mall | 100K-1M |
| 9 | `orders` | 주문 (다중 판매자 가능) | 09_order_management | 20K-200K |
| 10 | `order_items` | 주문 항목 (판매자별 그룹) | 09_order_management | 50K-500K |
| 11 | `payments` | 결제 | 03_payment_system | 20K-200K |
| 12 | `shipments` | 배송 (판매자별) | 04_shipping_logistics | 30K-300K |
| 13 | `vendor_settlements` | 판매자 정산 | 03_payment_system | 1K-10K |
| 14 | `disputes` | 분쟁 | 06_dispute_resolution | 1K-10K |
| 15 | `vendor_messages` | 판매자-고객 메시지 | 06_vendor_communication | 50K-500K |
| 16 | `vendor_ratings` | 판매자 평점 | 07_review_rating_system | 10K-100K |

### 테이블 스키마 개요

**vendors**
```
id (PK) | vendor_name | vendor_type (INDIVIDUAL/CORPORATE) | registration_number | 
bank_account | representative_name | status (PENDING/APPROVED/SUSPENDED/BLOCKED) | 
commission_rate | created_at | updated_at | is_active
```

**vendor_settlements**
```
id (PK) | vendor_id (FK) | settlement_month | total_sales | total_commission | 
net_amount | status (PENDING/PROCESSED/TRANSFERRED) | transfer_date | created_at
```

**disputes**
```
id (PK) | order_id (FK) | vendor_id (FK) | user_id (FK) | dispute_type | 
reason | status (OPEN/EVIDENCE_PENDING/MEDIATION/RESOLVED/CLOSED) | 
resolution | created_at | resolved_at
```

---

## 3️⃣ 기본 상태값 (Status Value Registry)

### Vendor Status (판매자 상태)
```
(1) pending
    → (2) approved
        → (3) active
            → (4) suspended (일시정지)
                → (3) active (복구)
            → (X) blocked (영구차단)
    → (X) rejected
```

### Order Status (마켓플레이스 주문)
```
Shopping Mall Core와 동일. 각 order_item이 판매자별로 독립
```

### Dispute Status (분쟁 상태)
```
(1) open
    → (2) evidence_pending
    → (3) mediation
    → (4) resolved
    → (5) closed
```

### Settlement Status (정산 상태)
```
(1) pending
    → (2) processed
        → (3) transferred
```

---

## 4️⃣ 기본 API 엔드포인트 (50+ endpoints)

### Vendor Management (12 endpoints)
```
POST   /vendors                           판매자 등록
GET    /vendors                           판매자 목록 (필터)
GET    /vendors/{id}                      판매자 상세 조회
PUT    /vendors/{id}                      판매자 정보 수정
POST   /vendors/{id}/documents            인증 서류 제출
GET    /vendors/{id}/documents            서류 현황 조회
PUT    /vendors/{id}/status               판매자 상태 변경
POST   /vendors/{id}/bank-account         계좌 정보 등록
PUT    /vendors/{id}/bank-account         계좌 정보 수정
GET    /vendors/{id}/statistics           판매자 통계
GET    /vendors/{id}/ratings              판매자 평점
POST   /admin/vendors                     판매자 승인 (관리자)
```

### Vendor Settlement (6 endpoints)
```
GET    /vendors/{id}/settlements          정산 내역
GET    /vendors/{id}/settlements/{month}  월별 정산 조회
POST   /admin/settlements/process         월별 정산 처리 (관리자)
GET    /admin/settlements                 전체 정산 현황 (관리자)
POST   /vendors/{id}/settlement-report    정산 명세서 다운로드
GET    /vendors/{id}/payout-history       입금 이력
```

### Dispute Resolution (8 endpoints)
```
POST   /disputes                          분쟁 신청
GET    /disputes                          분쟁 목록
GET    /disputes/{id}                     분쟁 상세
POST   /disputes/{id}/evidence            증거 제출
GET    /disputes/{id}/evidence            증거 조회
PUT    /disputes/{id}/resolve             분쟁 중재 결정 (관리자)
POST   /disputes/{id}/appeal              이의 제기
GET    /admin/disputes                    전체 분쟁 (관리자)
```

### Vendor Communication (4 endpoints)
```
POST   /vendors/{id}/messages             메시지 전송
GET    /vendors/{id}/messages             메시지 목록
GET    /vendors/{id}/messages/{message_id} 메시지 상세
POST   /vendors/{id}/announcements        공지사항 발행
```

---

## 5️⃣ 금지사항 (Prohibitions)

- ❌ **판매자 간 거래 (Vendor-to-Vendor transactions)**
- ❌ **자동 부분 환불 (Automatic partial refunds)**
- ❌ **실시간 환율 변동 가격 조정**
- ❌ **판매자 선택적 결제 수단**
- ❌ **자동 판매자 등급 상향**
- ❌ **판매자 수수료 사후 변경**

---

## 6️⃣ 산업 표준 시나리오

### Scenario 1: 판매자 등록 및 승인

```
Step 1: 판매자 등록 신청 (5분)
  판매자: 개인/법인 선택 → 사업자등록번호 입력
  판매자: 은행 계좌 입력
  판매자: 서류 업로드
  시스템: 상태 → "pending"
  
Step 2: 관리자 검토 (24-72시간)
  관리자: 서류 검증, 중복/블랙리스트 확인
  
Step 3: 승인 (1분)
  관리자: "승인" 클릭
  시스템: 상태 → "approved"
  
Step 4: 판매자 프로필 완성 (10분)
  판매자: 판매자명, 설명, 로고 입력
  시스템: 상태 → "active"
```

**예상 시간:** 1-3일

---

### Scenario 2: 다중 판매자 주문 및 정산

```
Step 1: 주문 생성
  고객: 판매자A 상품 2개, 판매자B 상품 1개 담기
  시스템: 1개 주문 생성, 자동으로 order_item 그룹화
  
Step 2: 결제 (5분)
  고객: 결제
  시스템: 상태 → "payment_confirmed"

Step 3: 배송 준비 (판매자별 독립)
  판매자A: 준비 → 송장 입력
  판매자B: 준비 → 송장 입력
  시스템: 각각 배송 상태 추적

Step 4: 월별 정산 (자동)
  판매자A: 판매액 $50 - 수수료 $5 = $45
  판매자B: 판매액 $30 - 수수료 $1.5 = $28.5
  차월 5일: 각각 입금
```

---

### Scenario 3: 상품 품질 분쟁

```
Step 1: 분쟁 신청 (고객)
  고객: "분쟁 신청" 클릭 → 증거 사진 업로드
  시스템: 상태 → "open"
  
Step 2: 판매자 답변 (48시간)
  판매자: 답변 및 증거 업로드
  시스템: 상태 → "evidence_pending"
  
Step 3: 플랫폼 중재 (관리자)
  관리자: 양측 증거 검토
  관리자: "고객 환불" 또는 "분쟁 기각" 결정
  시스템: 상태 → "mediation" → "resolved"
```

---

## 7️⃣ 제약사항 (Constraints)

| 항목 | 제약 | 이유 |
|------|------|------|
| **최대 판매자** | 무제한 | 마켓플레이스 성격 |
| **판매자 심사 기간** | 7일 | 신속한 온보딩 |
| **수수료율 범위** | 5-25% | 카테고리별 조정 |
| **정산 주기** | 월 1회 | 월말 기준 |
| **분쟁 응답 기간** | 48시간 | 빠른 해결 |
| **중재 기간** | 7일 | 명확한 결정 |
| **메시지 타임아웃** | 48시간 | 고객 보호 |

---

## ✅ 체크리스트

- [ ] 16개 기본 DB 테이블 생성됨
- [ ] 50+ API 엔드포인트 구현됨
- [ ] 판매자 상태 전이 로직 구현됨
- [ ] 주문 시 다중 판매자 자동 그룹화 구현됨
- [ ] 판매자별 정산 자동 계산
- [ ] 판매자별 독립 배송 추적
- [ ] 분쟁 해결 프로세스 구현됨
- [ ] 판매자 메시지 시스템 (48시간 타임아웃)
- [ ] 판매자 평점/리뷰 시스템
- [ ] 수수료 정책 적용 및 정산 자동화
