# Architecture Conflict Resolution (아키텍처 충돌 해결)

**Effective Date:** 2026-05-27  
**Authority:** Design Architecture  
**Status:** CONFLICT RESOLUTION COMPLETE  

---

## Overview

Base Knowledge Core 시스템 (shopping_mall_core, marketplace_core, purchase_agency_core, logistics_core 등)과 도메인 모듈 시스템 (01_member ~ 10_)*을 통합하면서 발견된 11개 아키텍처 충돌을 해결합니다.

---

## 충돌 #1: product_reviews 테이블 중복

**문제:**
- 02_shopping_mall (도메인 모듈): product_reviews 테이블 포함
- 07_review_rating_system (도메인 모듈): review_ratings 테이블 포함
- shopping_mall_core: product_reviews 포함 가능

**해결책:**

### Single Source of Truth: 07_review_rating_system

```
소유권: 07_review_rating_system (리뷰 및 평점 관리 전담)

테이블 통합:
- 07_review_rating_system이 모든 리뷰/평점 관리
- 02_shopping_mall은 review 기능을 07_review_rating_system으로 위임

02_shopping_mall에서 제거:
- product_reviews 테이블
- /products/{id}/reviews 엔드포인트 (대신 07_review_rating_system에서 제공)

07_review_rating_system에서 제공:
- reviews, ratings, review_replies 테이블
- /reviews/{product_id} (리뷰 목록)
- /reviews/{id} (리뷰 상세)
- /reviews/{id}/rate (평점 매기기)
- /reviews/{id}/reply (리뷰 답글)
```

**규칙:**
```
IF module needs review functionality
THEN call 07_review_rating_system APIs
ELSE 02_shopping_mall에 리뷰 저장 금지
```

---

## 충돌 #2: inventory_transactions 테이블 중복

**문제:**
- 02_shopping_mall (도메인 모듈): inventory_transactions 포함 가능
- 08_inventory_management: inventory_transactions 포함
- shopping_mall_core에서 간단한 inventory만 정의

**해결책:**

### Single Source of Truth: 08_inventory_management

```
소유권: 08_inventory_management (재고 관리 전담)

테이블 통합:
- 08_inventory_management이 모든 재고 거래 관리
- 02_shopping_mall은 재고 조회만 가능 (읽기 전용)

02_shopping_mall에서 제거:
- inventory_transactions 테이블
- inventory_levels 관리 로직

02_shopping_mall에서 허용:
- products.stock_quantity 필드 (읽기 전용)
- /products/{id}/inventory (GET only, 08에서 조회)

08_inventory_management에서 제공:
- inventory_transactions (모든 재고 변화 기록)
- inventory_reservations (주문 시 재고 예약)
- inventory_adjustments (수정, 정품 검사 등)
- /inventory/{product_id} (GET - 현재 재고)
- /inventory/{product_id}/transactions (GET - 거래 내역)
- /inventory/reserve (POST - 09_order_management에서 호출)
- /inventory/release (POST - 09_order_management에서 호출)
```

**규칙:**
```
IF module needs to update inventory
THEN call 08_inventory_management POST/PUT APIs
ELSE 02_shopping_mall에 재고 수정 금지

09_order_management 통합:
- 주문 생성 시 08_inventory_management.reserve() 호출
- 주문 취소 시 08_inventory_management.release() 호출
```

---

## 충돌 #3: 상태값 레지스트리 부족

**문제:**
- 각 모듈이 자체 상태값 정의
- 모듈 간 상태값 이름이 다르거나 충돌 가능
- 상태 전이 규칙이 명확하지 않음

**해결책:**

### 해결책: 00_STATUS_VALUE_REGISTRY.md 생성 (별도 문서)

```
이 문서에서:
- 모든 모듈의 모든 상태값 통합 정의
- 상태 전이 규칙 명확화
- 충돌하는 상태값명 표준화
```

---

## 충돌 #4: /admin/audit-log 엔드포인트 충돌

**문제:**
- 01_member_system: /admin/audit-log (사용자 로그인/로그아웃 감사)
- 05_admin_system: /admin/audit-log (전체 시스템 감사)

**해결책:**

### Single Source of Truth: 05_admin_system

```
소유권: 05_admin_system (모든 감사 로그 통합 관리)

01_member_system에서 변경:
❌ /admin/audit-log (제거)
✓ /admin/member/login-history (변경 - 사용자 로그인 히스토리)
✓ /admin/member/activity-log (변경 - 사용자 활동 로그)

05_admin_system에서 제공:
- /admin/audit-log (모든 시스템 감사 로그)
- /admin/audit-log?type=member (회원 관련)
- /admin/audit-log?type=order (주문 관련)
- /admin/audit-log?type=payment (결제 관련)
- /admin/audit-log?type=inventory (재고 관련)
```

**규칙:**
```
IF endpoint starts with /admin/
THEN 05_admin_system에서만 제공
ELSE 각 모듈에서 /module/ 프리픽스로 제공

예외:
- /admin/member/login-history (01_member_system 관리, 별도)
- /admin/member/activity-log (01_member_system 관리, 별도)
```

---

## 충돌 #5: /admin/inventory 엔드포인트 충돌

**문제:**
- 02_shopping_mall: /admin/inventory (상품 재고 조회)
- 08_inventory_management: /admin/inventory (재고 관리)

**해결책:**

### Single Source of Truth: 08_inventory_management

```
소유권: 08_inventory_management (모든 재고 조회 및 관리)

02_shopping_mall에서 변경:
❌ /admin/inventory (제거)
✓ /admin/products/{id}/details (상품 상세 - 재고 포함)

08_inventory_management에서 제공:
- /admin/inventory (모든 재고 상태)
- /admin/inventory/{product_id} (특정 상품 재고)
- /admin/inventory/{product_id}/transactions (거래 내역)
- /admin/inventory/{product_id}/adjust (재고 수정)
- /admin/inventory/low-stock (낮은 재고 알림)
- /admin/inventory/forecast (재고 예측)
```

---

## 충돌 #6: 주문 총액 계산 불일치

**문제:**
- 03_payment_system: order_total = product_price × quantity
- 09_order_management: order_total = product_price × quantity + shipping + tax - discount
- shipping_logistics_core: 배송료 포함

**해결책:**

### 통합 계산 규칙 (09_order_management 소유)

```
Order Total Calculation (09_order_management):

total = base_amount + shipping_cost + tax - discount + additional_fees

Where:
- base_amount = SUM(product_price × quantity) 
  (02_shopping_mall에서 조회)
  
- shipping_cost = 배송료 (04_shipping_logistics에서 조회)
  
- tax = 부가세 (현지 세법 적용)
  
- discount = 할인액 (쿠폰, 프로모션 등)
  
- additional_fees = 기타 비용
  (commission, handling_fee 등)

03_payment_system 역할:
- ✓ 결제 금액 확인 (09에서 받은 total로)
- ✓ 결제 처리
- ✓ 환불 처리
- ❌ 주문 총액 계산 (09의 값만 사용)

규칙:
IF payment_amount != order_total
THEN 거래 거절 (금액 불일치)
```

---

## 충돌 #7: 재고 예약 타이밍

**문제:**
- 08_inventory_management: 주문 생성 시 즉시 예약
- 09_order_management: 결제 완료 시 예약
- purchase_agency_core: 구매 승인 시 예약

**해결책:**

### 통합 재고 예약 정책 (08_inventory_management 소유)

```
재고 예약 타이밍:

일반 쇼핑 (shopping_mall_core):
1. 주문 생성 (09) → 재고 예약 (08)
2. 결제 완료 (03) → 재고 확정
3. 배송 시작 (04) → 재고 차감
4. 배송 완료 (04) → 재고 결산

마켓플레이스 (marketplace_core):
1. 주문 생성 (09) → 각 판매자별 재고 예약 (08)
2. 판매자 확인 (seller) → 재고 예약 유지
3. 결제 완료 (03) → 재고 확정
4. 판매자 배송 준비 (04) → 재고 차감
5. 배송 완료 (04) → 재고 결산

구매대행 (purchase_agency_core):
1. 구매 요청 (req) → 재고 예약 없음 (해외 구매)
2. 구매 완료 (agency) → 로컬 재고 예약 (전용)
3. 국내 입항 (04) → 재고 확정
4. 국내 배송 (04) → 재고 차감

규칙:
- 재고 예약은 08_inventory_management에서만 관리
- 다른 모듈은 08의 API만 호출
- 타이밍은 core별로 다를 수 있음 (위 참조)
```

---

## 충돌 #8: 결제 멱등성 보장

**문제:**
- 03_payment_system: 동일 주문으로 2회 결제 시?
- 09_order_management: 결제 실패 후 재시도?
- 외부 결제 게이트웨이: 중복 결제 가능?

**해결책:**

### 결제 멱등성 규칙 (03_payment_system 소유)

```
멱등성 보장 전략:

1. 주문별 Payment Idempotency Key 생성
   - payment_idempotency_key = MD5(order_id + user_id + amount)
   - 저장: payments 테이블의 idempotency_key 필드

2. 결제 요청 시 검증
   IF payment with same idempotency_key EXISTS
   THEN return existing payment result (재시도 시)
   ELSE create new payment

3. 외부 결제 게이트웨이 연동
   - Stripe, PayPal 등: Idempotency-Key 헤더 사용
   - 로컬 캐시: 결제 결과를 1시간 캐싱

4. 결제 상태 관리
   payments.status:
   - pending → processing → completed
   - pending → processing → failed
   - completed는 최종 상태 (변경 불가)

규칙:
IF payment_status = 'completed'
THEN cannot retry or modify
ELSE can retry with same idempotency_key

09_order_management 통합:
- 결제 재시도는 09에서 제안 (안내)
- 재시도 버튼을 사용자에게 제공
- 03이 멱등성 보장
```

---

## 충돌 #9: 모듈 책임 행렬 부재

**문제:**
- 어떤 테이블이 어느 모듈 소유인지 불명확
- 어떤 API가 어느 모듈에서 제공되는지 불명확
- 어떤 상태값이 어느 모듈에서 관리되는지 불명확

**해결책:**

### 해결책: 00_MODULE_RESPONSIBILITY_MATRIX.md 생성 (별도 문서)

```
이 문서에서:
- 테이블별 소유권 명시
- API 엔드포인트별 제공 모듈 명시
- 상태값별 관리 모듈 명시
- 예: 
  - products 테이블: 02_shopping_mall 소유
  - inventory_transactions: 08_inventory_management 소유
  - /admin/audit-log: 05_admin_system 소유
```

---

## 충돌 #10: Core vs Domain Module 우선순위

**문제:**
- shopping_mall_core vs 02_shopping_mall
- marketplace_core vs marketplace integration
- 어느 것을 따를 것인가?

**해결책:**

### 우선순위 규칙

```
1순위: 도메인 모듈 (01-10)
- 실제 구현 기준
- 코드가 존재하는 정의

2순위: Base Knowledge Core (shopping_mall_core 등)
- 최소 표준 정의
- 도메인 모듈이 Core를 확장/수정 가능

3순위: 일반 패턴
- Core나 도메인 모듈에 없으면 일반 패턴 참조

규칙:
IF domain module defines behavior
THEN use domain module definition
ELSE IF Base Knowledge Core defines
THEN use core definition
ELSE use general pattern
```

---

## 충돌 #11: 교차 모듈 API 호출 규약

**문제:**
- 09_order_management가 08_inventory_management 호출?
- 04_shipping_logistics가 09_order_management 호출?
- 순환 참조 위험?

**해결책:**

### API 호출 그래프 정의

```
허용되는 호출:
09_order_management 
  → 02_shopping_mall (상품 조회)
  → 03_payment_system (결제 처리)
  → 04_shipping_logistics (배송 계산)
  → 08_inventory_management (재고 예약)
  → 10_gdpr_privacy (개인정보 처리)

03_payment_system 
  → 09_order_management (주문 조회)
  → 06_notification (결제 알림)

04_shipping_logistics 
  → 09_order_management (주문 조회)
  → 06_notification (배송 알림)

금지되는 호출:
❌ 순환 참조 (A → B → A)
❌ 3단계 이상 깊은 호출 (A → B → C → D)
❌ 같은 레벨 모듈 간 직접 호출

규칙:
IF call violates graph
THEN route through 09_order_management (orchestrator)
```

---

## 요약: 해결된 충돌

| # | 충돌 | 원인 | 해결책 | 소유 모듈 |
|---|------|------|--------|---------|
| 1 | product_reviews 중복 | 두 모듈이 리뷰 관리 | 07_review_rating_system 소유 | 07 |
| 2 | inventory_transactions 중복 | 두 모듈이 재고 관리 | 08_inventory_management 소유 | 08 |
| 3 | 상태값 정의 부재 | 모듈별 상태값 불일치 | 00_STATUS_VALUE_REGISTRY 생성 | Registry |
| 4 | /admin/audit-log 충돌 | 두 모듈이 감사 로그 | 05_admin_system 소유 | 05 |
| 5 | /admin/inventory 충돌 | 두 모듈이 재고 조회 | 08_inventory_management 소유 | 08 |
| 6 | 주문 총액 계산 불일치 | 다른 계산 공식 | 09_order_management 소유 | 09 |
| 7 | 재고 예약 타이밍 불일치 | core별 다른 타이밍 | 08_inventory_management에서 정책 관리 | 08 |
| 8 | 결제 멱등성 미보장 | 중복 결제 위험 | 03_payment_system에서 idempotency_key 관리 | 03 |
| 9 | 모듈 책임 불명확 | 누가 뭘 하는지 모호 | 00_MODULE_RESPONSIBILITY_MATRIX 생성 | Matrix |
| 10 | Core vs Module 우선순위 | 어느 것을 따를지 불명확 | 우선순위 규칙 정의 | Rule |
| 11 | 교차 모듈 호출 규약 | 순환 참조 위험 | API 호출 그래프 정의 | Graph |

---

## Sign-off

**Document:** 00_ARCHITECTURE_CONFLICT_RESOLUTION.md  
**Created:** 2026-05-27  
**Authority:** Design Architecture  
**Status:** 🟢 **COMPLETE - 모든 충돌 해결됨**

**다음 단계:**
- [ ] 00_STATUS_VALUE_REGISTRY.md 생성
- [ ] 00_MODULE_RESPONSIBILITY_MATRIX.md 생성
- [ ] 도메인 모듈 (01-10) 업데이트 (충돌 해결 반영)
- [ ] Base Knowledge Core 업데이트 (충돌 해결 반영)
- [ ] GitHub 업로드
