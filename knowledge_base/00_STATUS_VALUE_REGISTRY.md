# Status Value Registry (상태값 통합 레지스트리)

**Effective Date:** 2026-05-27  
**Authority:** Design Architecture  
**Status:** MASTER REFERENCE  

---

## Overview

모든 모듈과 Core에서 사용하는 상태값을 통합 관리합니다.
상태값 충돌 방지, 상태 전이 규칙 명확화, 감사 추적 용이.

---

## 1. Member System (01_member_system)

### User Status (사용자 계정 상태)

| Status | 설명 | 전이 가능 상태 | 소유 모듈 |
|--------|------|-------------|---------|
| `pending_verification` | 가입 후 이메일 인증 대기 | verified, inactive | 01 |
| `verified` | 활성 사용자 | active, suspended | 01 |
| `active` | 정상 활성 사용자 | suspended, inactive | 01 |
| `suspended` | 임시 정지 (정책 위반) | active, deleted | 01 |
| `inactive` | 장기 미사용 | active, deleted | 01 |
| `deleted` | 계정 삭제 (복구 불가) | (없음 - 최종 상태) | 01 |

### Login History (로그인 기록)

| Status | 설명 | 소유 모듈 |
|--------|------|---------|
| `success` | 로그인 성공 | 01 |
| `failed_wrong_password` | 비밀번호 오류 | 01 |
| `failed_not_found` | 계정 없음 | 01 |
| `failed_suspended` | 정지된 계정 | 01 |
| `locked` | 로그인 시도 5회 이상 실패로 잠김 | 01 |

---

## 2. Shopping Mall (02_shopping_mall)

### Product Status (상품 상태)

| Status | 설명 | 전이 가능 상태 | 소유 모듈 |
|--------|------|-------------|---------|
| `draft` | 작성 중 | active, archived | 02 |
| `active` | 판매 중 | inactive, archived | 02 |
| `inactive` | 판매 중단 (재고 있음) | active, archived | 02 |
| `archived` | 보관 (판매 종료) | (없음 - 최종 상태) | 02 |

### Product Category Status (카테고리 상태)

| Status | 설명 | 소유 모듈 |
|--------|------|---------|
| `active` | 활성 카테고리 | 02 |
| `inactive` | 비활성 카테고리 | 02 |

---

## 3. Payment System (03_payment_system)

### Payment Status (결제 상태)

| Status | 설명 | 전이 가능 상태 | 소유 모듈 |
|--------|------|-------------|---------|
| `pending` | 결제 대기 (아직 시도 안함) | processing, canceled | 03 |
| `processing` | 결제 처리 중 | completed, failed | 03 |
| `completed` | 결제 완료 | refunding | 03 |
| `failed` | 결제 실패 | processing, canceled | 03 |
| `refunding` | 환불 처리 중 | refunded | 03 |
| `refunded` | 환불 완료 (부분/전체) | (없음 - 최종 상태) | 03 |
| `canceled` | 결제 취소 (사용자/시스템) | (없음 - 최종 상태) | 03 |

### Refund Status (환불 상태)

| Status | 설명 | 소유 모듈 |
|--------|------|---------|
| `requested` | 환불 요청됨 | 03 |
| `approved` | 환불 승인됨 | 03 |
| `processing` | 환불 처리 중 | 03 |
| `completed` | 환불 완료 | 03 |
| `rejected` | 환불 거절 | 03 |

---

## 4. Shipping & Logistics (04_shipping_logistics)

### Domestic Shipment Status (국내 배송 상태)

| Status | 설명 | 전이 가능 상태 | 소유 모듈 |
|--------|------|-------------|---------|
| `ready_to_ship` | 배송 준비 중 | in_transit, canceled | 04 |
| `in_transit` | 배송 중 | delivered, failed | 04 |
| `delivered` | 배송 완료 (수령함) | (없음 - 최종 상태) | 04 |
| `failed` | 배송 실패 (분실, 반송 등) | in_transit, returned | 04 |
| `returned` | 반송됨 | (없음 - 최종 상태) | 04 |
| `canceled` | 배송 취소 | (없음 - 최종 상태) | 04 |

### International Shipment Status (국제 배송 상태)

| Status | 설명 | 전이 가능 상태 | 소유 모듈 |
|--------|------|-------------|---------|
| `dispatched` | 해외 발송됨 | in_transit, customs_held | 04 |
| `in_transit` | 배송 중 | arrived, customs_held | 04 |
| `customs_held` | 통관 대기/검사 중 | customs_cleared, rejected | 04 |
| `customs_cleared` | 통관 완료 | domestic_dispatch | 04 |
| `domestic_dispatch` | 국내 배송으로 전환 | in_transit | 04 |
| `arrived` | 한국 입항 | customs_held, customs_cleared | 04 |
| `rejected` | 통관 거절 (반송/폐기) | (없음 - 최종 상태) | 04 |

### Carrier Status (운송사 상태)

| Status | 설명 | 소유 모듈 |
|--------|------|---------|
| `active` | 활성 운송사 | 04 |
| `inactive` | 비활성 운송사 | 04 |

---

## 5. Admin System (05_admin_system)

### Admin User Role (관리자 역할)

| Status | 설명 | 소유 모듈 |
|--------|------|---------|
| `super_admin` | 시스템 전체 관리 | 05 |
| `admin` | 일반 관리 | 05 |
| `moderator` | 콘텐츠 중재 | 05 |
| `support_agent` | 고객 지원 | 05 |
| `viewer` | 보기 전용 | 05 |

### Audit Log Type (감사 로그 유형)

| Type | 설명 | 소유 모듈 |
|------|------|---------|
| `user_login` | 사용자 로그인 | 01 |
| `user_logout` | 사용자 로그아웃 | 01 |
| `product_create` | 상품 생성 | 02 |
| `product_update` | 상품 수정 | 02 |
| `product_delete` | 상품 삭제 | 02 |
| `order_create` | 주문 생성 | 09 |
| `order_cancel` | 주문 취소 | 09 |
| `payment_process` | 결제 처리 | 03 |
| `refund_process` | 환불 처리 | 03 |
| `shipment_create` | 배송 생성 | 04 |
| `shipment_update` | 배송 업데이트 | 04 |
| `inventory_adjust` | 재고 조정 | 08 |
| `user_suspend` | 사용자 정지 | 05 |
| `seller_verify` | 판매자 검증 | 01/marketplace |
| `dispute_resolve` | 분쟁 해결 | 09 |

---

## 6. Notification System (06_notification)

### Notification Status (알림 상태)

| Status | 설명 | 전이 가능 상태 | 소유 모듈 |
|--------|------|-------------|---------|
| `pending` | 전송 대기 | sent, failed, canceled | 06 |
| `sent` | 전송 완료 | read, archived | 06 |
| `failed` | 전송 실패 | pending, archived | 06 |
| `read` | 읽음 | archived | 06 |
| `archived` | 보관됨 | (없음 - 최종 상태) | 06 |
| `canceled` | 취소됨 | (없음 - 최종 상태) | 06 |

### Notification Type (알림 유형)

| Type | 설명 | 소유 모듈 |
|------|------|---------|
| `order_created` | 주문 생성됨 | 09 |
| `payment_confirmed` | 결제 완료 | 03 |
| `shipment_dispatched` | 배송 출발 | 04 |
| `shipment_delivered` | 배송 완료 | 04 |
| `review_requested` | 리뷰 요청 | 07 |
| `product_restocked` | 상품 재입고 | 08 |
| `seller_verified` | 판매자 승인됨 | marketplace |
| `dispute_created` | 분쟁 발생 | 09 |

---

## 7. Review & Rating System (07_review_rating_system)

### Review Status (리뷰 상태)

| Status | 설명 | 전이 가능 상태 | 소유 모듈 |
|--------|------|-------------|---------|
| `submitted` | 제출됨 | approved, rejected | 07 |
| `approved` | 승인됨 | hidden, deleted | 07 |
| `rejected` | 거절됨 (부적절 내용) | (없음 - 최종 상태) | 07 |
| `hidden` | 숨김 (관리자 판단) | approved, deleted | 07 |
| `deleted` | 삭제됨 (사용자/관리자) | (없음 - 최종 상태) | 07 |

### Rating Status (평점 상태)

| Status | 설명 | 소유 모듈 |
|--------|------|---------|
| `submitted` | 평점 제출됨 | 07 |
| `calculated` | 평균 계산됨 | 07 |

---

## 8. Inventory Management (08_inventory_management)

### Inventory Status (재고 상태)

| Status | 설명 | 전이 가능 상태 | 소유 모듈 |
|--------|------|-------------|---------|
| `in_stock` | 재고 충분 | low_stock, out_of_stock | 08 |
| `low_stock` | 재고 부족 (임계값 이하) | in_stock, out_of_stock | 08 |
| `out_of_stock` | 품절 | in_stock | 08 |

### Inventory Transaction Type (거래 유형)

| Type | 설명 | 소유 모듈 |
|------|------|---------|
| `purchase` | 구매 (입고) | 08 |
| `sale` | 판매 (출고) | 08 |
| `return` | 반품 | 08 |
| `adjustment` | 수동 조정 | 08 |
| `damage` | 손상 폐기 | 08 |
| `audit` | 재고 실사 | 08 |

### Inventory Reservation Status (예약 상태)

| Status | 설명 | 전이 가능 상태 | 소유 모듈 |
|--------|------|-------------|---------|
| `reserved` | 예약됨 (주문 생성 시) | confirmed, released | 08 |
| `confirmed` | 확정됨 (결제 완료 시) | released | 08 |
| `released` | 해제됨 (주문 취소 시) | (없음 - 최종 상태) | 08 |

---

## 9. Order Management (09_order_management)

### Order Status (주문 상태)

| Status | 설명 | 전이 가능 상태 | 소유 모듈 |
|--------|------|-------------|---------|
| `pending_payment` | 결제 대기 | payment_confirmed, canceled | 09 |
| `payment_confirmed` | 결제 완료 | shipping_ready, canceled | 09 |
| `shipping_ready` | 배송 준비 중 | in_transit, canceled | 09 |
| `in_transit` | 배송 중 | delivered, failed | 09 |
| `delivered` | 배송 완료 | return_requested, settled | 09 |
| `return_requested` | 반품 요청됨 | return_approved, return_rejected | 09 |
| `return_approved` | 반품 승인됨 | return_in_transit, return_rejected | 09 |
| `return_in_transit` | 반품 배송 중 | return_completed, return_failed | 09 |
| `return_completed` | 반품 완료 | refunded, (없음) | 09 |
| `return_rejected` | 반품 거절 | settled | 09 |
| `return_failed` | 반품 실패 | (없음 - 최종 상태) | 09 |
| `refunded` | 환불 완료 | (없음 - 최종 상태) | 09 |
| `settled` | 최종 정산 완료 | (없음 - 최종 상태) | 09 |
| `canceled` | 주문 취소 | (없음 - 최종 상태) | 09 |
| `failed` | 주문 실패 (배송 불가 등) | canceled, return_requested | 09 |

### Order Item Status (주문 항목 상태)

| Status | 설명 | 소유 모듈 |
|--------|------|---------|
| `included` | 주문에 포함됨 | 09 |
| `returned` | 반품됨 | 09 |
| `refunded` | 환불됨 | 09 |

---

## 10. GDPR & Privacy (10_gdpr_privacy)

### Consent Status (동의 상태)

| Status | 설명 | 전이 가능 상태 | 소유 모듈 |
|--------|------|-------------|---------|
| `pending` | 동의 대기 | granted, denied | 10 |
| `granted` | 동의 부여 | withdrawn | 10 |
| `denied` | 거절 | granted | 10 |
| `withdrawn` | 동의 철회 | granted | 10 |

### Data Request Status (데이터 요청 상태)

| Status | 설명 | 전이 가능 상태 | 소유 모듈 |
|--------|------|-------------|---------|
| `requested` | 요청됨 | processing, rejected | 10 |
| `processing` | 처리 중 | completed, rejected | 10 |
| `completed` | 완료 (데이터 제공) | (없음 - 최종 상태) | 10 |
| `rejected` | 거절 (정당한 사유) | (없음 - 최종 상태) | 10 |

### Data Deletion Status (삭제 요청 상태)

| Status | 설명 | 전이 가능 상태 | 소유 모듈 |
|--------|------|-------------|---------|
| `requested` | 삭제 요청됨 | approved, rejected | 10 |
| `approved` | 승인됨 | processing | 10 |
| `processing` | 처리 중 | completed | 10 |
| `completed` | 삭제 완료 | (없음 - 최종 상태) | 10 |
| `rejected` | 거절 (법적 보유 의무) | (없음 - 최종 상태) | 10 |

---

## Base Knowledge Core 상태값

### Shopping Mall Core (shopping_mall_core)

| Entity | Status Values | 소유 모듈 |
|--------|--------------|---------|
| Order | pending → paid → shipped → delivered | Core (09_order_management 확장) |
| Payment | pending → completed → refunded | Core (03_payment_system 확장) |
| User | active, suspended, inactive | Core (01_member_system 확장) |
| Product | active, inactive, archived | Core (02_shopping_mall 확장) |

### Marketplace Core (marketplace_core)

| Entity | Status Values | 소유 모듈 |
|--------|--------------|---------|
| Seller | pending_verification → verified → active → suspended | marketplace 모듈 |
| Commission Settlement | pending → calculated → paid → disputed | marketplace 모듈 |
| Dispute | created → under_review → resolved → closed | marketplace 모듈 |

### Purchase Agency Core (purchase_agency_core)

| Entity | Status Values | 소유 모듈 |
|--------|--------------|---------|
| Purchase Request | pending → accepted → purchased → in_transit → delivered → settled | purchase_agency 모듈 |
| Cost | estimated → confirmed → paid | 03_payment_system 연동 |
| International Shipment | in_transit → arrived_warehouse → processing | 04_shipping_logistics 연동 |

---

## 상태 전이 규칙

### 금지된 전이

```
✗ 상품 상태: draft → shipped (불가능)
✗ 결제 상태: completed → processing (불가능)
✗ 배송 상태: delivered → in_transit (불가능)
✗ 주문 상태: canceled → payment_confirmed (불가능)
```

### 검증 규칙

```
RULE: 각 상태 전이는 명시된 경로만 가능
RULE: 최종 상태 (✗ 표시)는 되돌릴 수 없음
RULE: 상태 전이는 해당 모듈에서만 가능
RULE: 상태 전이 시 타임스탬프 기록 필수
```

---

## API 응답 Status Code

### HTTP Status Code 와 Order Status 매핑

```
200 OK:
- GET order → order.status = any
- PATCH order → order.status updated

202 Accepted:
- POST payment → payment.status = processing

400 Bad Request:
- PATCH order (invalid status transition)
- POST payment (invalid amount)

401 Unauthorized:
- User not logged in

403 Forbidden:
- User cannot access other user's order

404 Not Found:
- Order not found

409 Conflict:
- order.status = canceled, trying to add shipment
- payment.status = completed, trying to process again

500 Server Error:
- Database error during status update
```

---

## 감시 및 알림

### 상태 변경 이벤트

```
Event: OrderStatusChanged
  trigger: order.status 변경
  data: order_id, old_status, new_status, changed_at, changed_by
  subscribers: 06_notification, 05_admin_system (audit log)

Event: PaymentStatusChanged
  trigger: payment.status 변경
  data: payment_id, order_id, old_status, new_status
  subscribers: 06_notification, 09_order_management

Event: ShipmentStatusChanged
  trigger: shipment.status 변경
  data: shipment_id, order_id, old_status, new_status
  subscribers: 06_notification, 05_admin_system
```

---

## Sign-off

**Document:** 00_STATUS_VALUE_REGISTRY.md  
**Created:** 2026-05-27  
**Authority:** Design Architecture  
**Status:** 🟢 **MASTER REFERENCE - 모든 모듈이 이 레지스트리 준용**

**사용 방법:**
1. 각 모듈 개발 시 이 레지스트리 참조
2. 새로운 상태값 추가 시 이 문서 업데이트 필수
3. 상태 전이 규칙 변경 시 아키텍처 팀 승인 필요
