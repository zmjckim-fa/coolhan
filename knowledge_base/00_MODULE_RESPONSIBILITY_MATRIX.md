# Module Responsibility Matrix (모듈 책임 행렬)

**Effective Date:** 2026-05-27  
**Authority:** Design Architecture  
**Status:** MASTER REFERENCE  

---

## Overview

각 테이블, API 엔드포인트, 상태값이 어느 모듈에서 소유되고 관리되는지 명확히 정의합니다.

Legend:
- 🟢 **OWNER**: 소유권 있음 (생성, 수정, 삭제)
- 🔵 **READ**: 읽기 권한만
- 🟡 **CALL**: API 호출 가능
- ⚪ **NONE**: 접근 불가

---

## 1. Database Tables - 소유권 매트릭스

### 사용자 관련 테이블

| 테이블 | 01_Member | 02_Shopping | 05_Admin | 10_GDPR | 설명 |
|--------|-----------|------------|----------|---------|------|
| users | 🟢 OWNER | 🔵 READ | 🔵 READ | 🔵 READ | 사용자 계정 기본 정보 |
| user_profiles | 🟢 OWNER | 🔵 READ | 🔵 READ | 🟡 CALL | 사용자 프로필 (이름, 주소 등) |
| user_preferences | 🟢 OWNER | 🔵 READ | ⚪ NONE | 🔵 READ | 사용자 설정 (언어, 알림 등) |
| login_history | 🟢 OWNER | ⚪ NONE | 🔵 READ | 🔵 READ | 로그인 기록 (감사용) |
| user_consents | 🟢 OWNER | ⚪ NONE | 🔵 READ | 🟢 OWNER | 동의 관리 (마케팅, 개인정보) |

### 상품 관련 테이블

| 테이블 | 02_Shopping | 07_Review | 08_Inventory | 04_Shipping | 설명 |
|--------|------------|----------|-------------|------------|------|
| products | 🟢 OWNER | 🔵 READ | 🔵 READ | 🔵 READ | 상품 정보 |
| product_categories | 🟢 OWNER | 🔵 READ | ⚪ NONE | ⚪ NONE | 상품 카테고리 |
| product_images | 🟢 OWNER | 🔵 READ | ⚪ NONE | ⚪ NONE | 상품 이미지 |
| product_specs | 🟢 OWNER | 🔵 READ | 🔵 READ | 🔵 READ | 상품 사양 |
| reviews | ⚪ NONE | 🟢 OWNER | ⚪ NONE | ⚪ NONE | 상품 리뷰 |
| ratings | ⚪ NONE | 🟢 OWNER | ⚪ NONE | ⚪ NONE | 상품 평점 |
| review_replies | ⚪ NONE | 🟢 OWNER | ⚪ NONE | ⚪ NONE | 리뷰 답글 |

### 주문 관련 테이블

| 테이블 | 09_Order | 03_Payment | 04_Shipping | 08_Inventory | 설명 |
|--------|----------|-----------|------------|-------------|------|
| orders | 🟢 OWNER | 🔵 READ | 🔵 READ | 🔵 READ | 주문 정보 |
| order_items | 🟢 OWNER | 🔵 READ | 🔵 READ | 🔵 READ | 주문 항목 |
| order_addresses | 🟢 OWNER | ⚪ NONE | 🔵 READ | ⚪ NONE | 배송 주소 |
| payments | ⚪ NONE | 🟢 OWNER | ⚪ NONE | ⚪ NONE | 결제 정보 |
| refunds | ⚪ NONE | 🟢 OWNER | ⚪ NONE | ⚪ NONE | 환불 정보 |
| shipments | ⚪ NONE | 🔵 READ | 🟢 OWNER | 🔵 READ | 배송 정보 |
| shipment_tracking | ⚪ NONE | ⚪ NONE | 🟢 OWNER | ⚪ NONE | 배송 추적 |
| return_requests | 🟢 OWNER | ⚪ NONE | 🔵 READ | 🔵 READ | 반품 요청 |

### 재고 관련 테이블

| 테이블 | 08_Inventory | 02_Shopping | 09_Order | 설명 |
|--------|-------------|------------|----------|------|
| inventory_levels | 🟢 OWNER | 🔵 READ | 🔵 READ | 현재 재고 수량 |
| inventory_transactions | 🟢 OWNER | 🔵 READ | 🔵 READ | 재고 거래 내역 |
| inventory_reservations | 🟢 OWNER | ⚪ NONE | 🟡 CALL | 재고 예약 |
| inventory_adjustments | 🟢 OWNER | ⚪ NONE | ⚪ NONE | 재고 수동 조정 |
| low_stock_alerts | 🟢 OWNER | 🔵 READ | ⚪ NONE | 낮은 재고 알림 |

### 배송 관련 테이블

| 테이블 | 04_Shipping | 09_Order | 06_Notification | 설명 |
|--------|------------|----------|-----------------|------|
| carriers | 🟢 OWNER | 🔵 READ | ⚪ NONE | 운송사 정보 |
| shipping_rates | 🟢 OWNER | 🔵 READ | ⚪ NONE | 배송료 정가 |
| shipping_zones | 🟢 OWNER | 🔵 READ | ⚪ NONE | 배송 구역 |
| shipments | 🟢 OWNER | 🔵 READ | 🔵 READ | 배송 기본 정보 |
| shipment_events | 🟢 OWNER | 🔵 READ | 🟡 CALL | 배송 이벤트 (픽업, 배송, 완료) |
| warehouses | 🟢 OWNER | 🔵 READ | ⚪ NONE | 창고 정보 |
| warehouse_locations | 🟢 OWNER | 🔵 READ | ⚪ NONE | 창고 위치 |

### 관리자 관련 테이블

| 테이블 | 05_Admin | 01_Member | 설명 |
|--------|----------|-----------|------|
| admin_users | 🟢 OWNER | 🔵 READ | 관리자 계정 |
| admin_roles | 🟢 OWNER | ⚪ NONE | 관리자 역할 |
| admin_permissions | 🟢 OWNER | ⚪ NONE | 권한 정의 |
| audit_logs | 🟢 OWNER | ⚪ NONE | 감사 로그 (모든 모듈 기여) |
| system_settings | 🟢 OWNER | ⚪ NONE | 시스템 설정 |

### 알림 관련 테이블

| 테이블 | 06_Notification | 09_Order | 03_Payment | 04_Shipping | 설명 |
|--------|-----------------|----------|-----------|------------|------|
| notifications | 🟢 OWNER | 🔵 READ | 🔵 READ | 🔵 READ | 알림 기본 정보 |
| notification_templates | 🟢 OWNER | ⚪ NONE | ⚪ NONE | ⚪ NONE | 알림 템플릿 |
| notification_preferences | 🟢 OWNER | ⚪ NONE | ⚪ NONE | ⚪ NONE | 사용자 알림 설정 |
| email_queue | 🟢 OWNER | 🟡 CALL | 🟡 CALL | 🟡 CALL | 이메일 대기열 |
| sms_queue | 🟢 OWNER | 🟡 CALL | 🟡 CALL | 🟡 CALL | SMS 대기열 |

### GDPR 관련 테이블

| 테이블 | 10_GDPR | 01_Member | 05_Admin | 설명 |
|--------|---------|-----------|----------|------|
| consent_logs | 🟢 OWNER | 🔵 READ | 🔵 READ | 동의 기록 |
| data_requests | 🟢 OWNER | ⚪ NONE | 🔵 READ | 데이터 요청 (열람/다운로드) |
| deletion_requests | 🟢 OWNER | ⚪ NONE | 🔵 READ | 삭제 요청 |
| consent_withdrawals | 🟢 OWNER | ⚪ NONE | 🔵 READ | 동의 철회 기록 |

---

## 2. API 엔드포인트 - 소유권 매트릭스

### 사용자 API

| 엔드포인트 | 메서드 | 소유 모듈 | 설명 |
|-----------|--------|---------|------|
| /users/register | POST | 01_Member | 회원가입 |
| /users/login | POST | 01_Member | 로그인 |
| /users/logout | POST | 01_Member | 로그아웃 |
| /users/profile | GET | 01_Member | 프로필 조회 |
| /users/profile | PATCH | 01_Member | 프로필 수정 |
| /users/password | PATCH | 01_Member | 비밀번호 변경 |
| /users/preferences | GET/PATCH | 01_Member | 사용자 설정 |
| /users/consents | GET/PATCH | 10_GDPR | 동의 관리 |
| /users/{id}/data-request | POST | 10_GDPR | 데이터 다운로드 요청 |
| /users/delete | POST | 10_GDPR | 계정 삭제 요청 |
| /admin/users | GET | 05_Admin | 사용자 목록 (관리자) |
| /admin/users/{id}/suspend | POST | 05_Admin | 사용자 정지 |

### 상품 API

| 엔드포인트 | 메서드 | 소유 모듈 | 설명 |
|-----------|--------|---------|------|
| /products | GET | 02_Shopping | 상품 목록 |
| /products/{id} | GET | 02_Shopping | 상품 상세 |
| /admin/products | POST | 02_Shopping | 상품 생성 (관리자) |
| /admin/products/{id} | PATCH | 02_Shopping | 상품 수정 (관리자) |
| /admin/products/{id} | DELETE | 02_Shopping | 상품 삭제 (관리자) |
| /products/{id}/reviews | GET | 07_Review | 리뷰 목록 |
| /products/{id}/reviews | POST | 07_Review | 리뷰 작성 |
| /reviews/{id} | PATCH | 07_Review | 리뷰 수정 |
| /reviews/{id} | DELETE | 07_Review | 리뷰 삭제 |
| /reviews/{id}/rate | POST | 07_Review | 평점 매기기 |
| /products/{id}/inventory | GET | 08_Inventory | 재고 조회 |

### 주문 API

| 엔드포인트 | 메서드 | 소유 모듈 | 설명 |
|-----------|--------|---------|------|
| /orders | POST | 09_Order | 주문 생성 |
| /orders | GET | 09_Order | 내 주문 목록 |
| /orders/{id} | GET | 09_Order | 주문 상세 |
| /orders/{id}/cancel | POST | 09_Order | 주문 취소 |
| /orders/{id}/return | POST | 09_Order | 반품 요청 |
| /orders/{id}/shipments | GET | 04_Shipping | 배송 정보 |
| /orders/{id}/payment | GET | 03_Payment | 결제 정보 |
| /admin/orders | GET | 05_Admin | 주문 목록 (관리자) |
| /admin/orders/{id} | PATCH | 09_Order | 주문 상태 변경 (관리자) |

### 결제 API

| 엔드포인트 | 메서드 | 소유 모듈 | 설명 |
|-----------|--------|---------|------|
| /payments | POST | 03_Payment | 결제 처리 |
| /payments/{id} | GET | 03_Payment | 결제 상태 조회 |
| /payments/{id}/refund | POST | 03_Payment | 환불 요청 |
| /refunds | GET | 03_Payment | 환불 목록 |
| /admin/payments | GET | 05_Admin | 결제 목록 (관리자) |
| /admin/payments/{id}/verify | POST | 03_Payment | 결제 검증 (관리자) |

### 배송 API

| 엔드포인트 | 메서드 | 소유 모듈 | 설명 |
|-----------|--------|---------|------|
| /shipments/{id} | GET | 04_Shipping | 배송 상태 조회 |
| /shipments/{id}/track | GET | 04_Shipping | 배송 추적 |
| /admin/shipments | POST | 04_Shipping | 배송 생성 (관리자) |
| /admin/shipments/{id} | PATCH | 04_Shipping | 배송 정보 수정 |
| /admin/shipments/{id}/events | GET | 04_Shipping | 배송 이벤트 |
| /admin/carriers | GET/POST | 04_Shipping | 운송사 관리 |
| /admin/shipping-rates | GET/POST | 04_Shipping | 배송료 관리 |

### 재고 API

| 엔드포인트 | 메서드 | 소유 모듈 | 설명 |
|-----------|--------|---------|------|
| /admin/inventory | GET | 08_Inventory | 재고 현황 |
| /admin/inventory/{id}/adjust | POST | 08_Inventory | 재고 조정 |
| /admin/inventory/{id}/reserve | POST | 08_Inventory | 재고 예약 (내부) |
| /admin/inventory/{id}/release | POST | 08_Inventory | 재고 해제 (내부) |
| /admin/inventory/transactions | GET | 08_Inventory | 재고 거래 내역 |
| /admin/inventory/low-stock | GET | 08_Inventory | 낮은 재고 알림 |

### 알림 API

| 엔드포인트 | 메서드 | 소유 모듈 | 설명 |
|-----------|--------|---------|------|
| /notifications | GET | 06_Notification | 나의 알림 |
| /notifications/{id}/read | POST | 06_Notification | 알림 읽음 표시 |
| /notifications/{id} | DELETE | 06_Notification | 알림 삭제 |
| /admin/notifications | GET | 05_Admin | 알림 목록 (관리자) |
| /admin/notification-templates | GET/POST | 06_Notification | 템플릿 관리 |

### 관리자 API

| 엔드포인트 | 메서드 | 소유 모듈 | 설명 |
|-----------|--------|---------|------|
| /admin/audit-log | GET | 05_Admin | 감사 로그 조회 |
| /admin/settings | GET/PATCH | 05_Admin | 시스템 설정 |
| /admin/roles | GET/POST | 05_Admin | 역할 관리 |
| /admin/permissions | GET | 05_Admin | 권한 관리 |
| /admin/dashboard | GET | 05_Admin | 관리자 대시보드 |

### GDPR API

| 엔드포인트 | 메서드 | 소유 모듈 | 설명 |
|-----------|--------|---------|------|
| /gdpr/data-request | POST | 10_GDPR | 데이터 요청 |
| /gdpr/data-request/{id} | GET | 10_GDPR | 요청 상태 조회 |
| /gdpr/delete-request | POST | 10_GDPR | 삭제 요청 |
| /gdpr/consents | GET/PATCH | 10_GDPR | 동의 관리 |
| /admin/gdpr/data-requests | GET | 05_Admin | 데이터 요청 목록 (관리자) |
| /admin/gdpr/deletion-requests | GET | 05_Admin | 삭제 요청 목록 (관리자) |

---

## 3. 상태값 - 소유권 매트릭스

| 상태값 | 엔티티 | 소유 모듈 | 전이 관리 |
|--------|--------|---------|---------|
| pending_verification → verified → active → suspended | User | 01_Member | 01_Member |
| draft → active → inactive → archived | Product | 02_Shopping | 02_Shopping |
| pending → processing → completed → refunded | Payment | 03_Payment | 03_Payment |
| ready_to_ship → in_transit → delivered | Shipment | 04_Shipping | 04_Shipping |
| pending → approved → rejected → hidden → deleted | Review | 07_Review | 07_Review |
| in_stock → low_stock → out_of_stock | Inventory | 08_Inventory | 08_Inventory |
| pending_payment → payment_confirmed → shipping_ready → in_transit → delivered | Order | 09_Order | 09_Order |

---

## 4. 모듈 간 호출 규칙

### Permitted API Calls (허용)

```
09_Order_Management
  ├─→ 02_Shopping_Mall: GET /products/{id}
  ├─→ 03_Payment_System: POST /payments
  ├─→ 04_Shipping_Logistics: POST /shipments, GET /shipping-rates
  ├─→ 08_Inventory_Management: POST /reserve, POST /release
  └─→ 06_Notification: POST /notifications

03_Payment_System
  ├─→ 09_Order_Management: GET /orders/{id}
  └─→ 06_Notification: POST /notifications

04_Shipping_Logistics
  ├─→ 09_Order_Management: GET /orders/{id}
  ├─→ 02_Shopping_Mall: GET /products/{id}
  └─→ 06_Notification: POST /notifications

08_Inventory_Management
  ├─→ 02_Shopping_Mall: GET /products/{id}
  └─→ 06_Notification: POST /notifications

07_Review_Rating_System
  ├─→ 02_Shopping_Mall: GET /products/{id}
  ├─→ 01_Member_System: GET /users/{id}
  └─→ 06_Notification: POST /notifications
```

### Forbidden API Calls (금지)

```
❌ 02_Shopping → 09_Order (읽기 전용)
❌ 03_Payment → 02_Shopping (읽기 전용)
❌ 04_Shipping → 03_Payment (읽기 전용)
❌ 순환 참조 (A→B→A)
❌ 3단계 이상 깊은 호출 (A→B→C→D)
```

---

## 5. 데이터 접근 제어 (Access Control)

### 테이블별 접근 제어

```sql
-- users 테이블
OWNER: 01_Member_System
  CREATE user
  UPDATE user profile
  DELETE user (soft delete)
  
READ: All modules (조회만)
  SELECT * FROM users WHERE id = ?
  
WRITE: 
  01_Member → UPDATE status (active/suspended)
  10_GDPR → UPDATE last_gdpr_request

-- inventory_levels 테이블
OWNER: 08_Inventory_Management
  CREATE inventory
  UPDATE quantity
  DELETE inventory
  
READ: 02_Shopping, 09_Order (조회만)
  SELECT quantity FROM inventory WHERE product_id = ?
  
WRITE: 
  08_Inventory → UPDATE quantity
  08_Inventory → UPDATE reserved_quantity
```

---

## 6. 감시 및 검증 규칙

### 테이블 접근 검증

```
각 INSERT/UPDATE/DELETE 요청 전:
1. 모듈이 테이블의 OWNER인가? → YES 진행, NO 거절
2. 테이블이 READ만 허용하는가? → YES SELECT만 허용, NO 거절
3. 필드 레벨 권한이 있는가? → YES 진행, NO 거절

위반 시:
- 403 Forbidden 응답
- 05_Admin_System의 audit_logs에 기록
- 보안 팀에 알림
```

### API 호출 검증

```
각 API 호출 요청 전:
1. 호출 모듈이 대상 모듈 API를 호출할 수 있는가? → YES 진행, NO 거절
2. 호출이 허용된 엔드포인트인가? → YES 진행, NO 거절
3. 호출 깊이가 3단계 이상인가? → YES 거절, NO 진행

위반 시:
- 400 Bad Request 응답
- audit_logs 기록
```

---

## 7. 마이그레이션 경로

### Phase 1: 현재 상태
- [ ] 문서 완성
- [ ] 모든 모듈이 이 매트릭스 검토

### Phase 2: 검증
- [ ] 각 모듈이 담당 테이블/API 확인
- [ ] 권한 설정 적용

### Phase 3: 시행
- [ ] 접근 제어 강제 적용
- [ ] 위반 사항 로깅 활성화
- [ ] 모니터링 시작

### Phase 4: 완전 시행
- [ ] 위반 요청 자동 거절
- [ ] 정기 감사 보고서

---

## Sign-off

**Document:** 00_MODULE_RESPONSIBILITY_MATRIX.md  
**Created:** 2026-05-27  
**Authority:** Design Architecture  
**Status:** 🟢 **MASTER REFERENCE - 모든 모듈이 이 행렬 준용**

**사용 방법:**
1. 새로운 테이블 생성 시 OWNER 모듈 지정
2. 새로운 API 엔드포인트 생성 시 소유 모듈 명시
3. 모듈 간 호출 시 Permitted Calls 목록 확인
4. 권한 설정 시 이 행렬 기반으로 적용
