# M-06 배송·추적 (Shipping & Tracking)

- **maps_to_existing:** `04_shipping_logistics` · **novelty:** existing
- **proposed_kb_file:** `04_shipping_logistics.md` (diff 제안, 미반영)
- **참고:** R1은 `04_shipping_system`으로 표기했으나 실제 KB 파일명은 `04_shipping_logistics.md` (확인 완료)
- **evidence:** F-07 · src/routes/shipping.py, src/models/shipping.py
- **coupling:** medium (order_id 단방향 FK; 실 캐리어 연동 없음)

## 1. 용어
shipment · tracking_number · status

## 2. 기능
- 배송 생성/조회 — order 대상 (F-07)
- 운송장 추적 — tracking_number로 조회 (F-07)
- 주문별 배송 목록 — order_id 기준 (F-07)
- 배송 상태 변경 — status 전이 (F-07)

## 3. 상태값
미발견 (status 전이 존재, enum 집합 미확인)

## 4. 데이터 모델
- `shipment` (id, order_id, tracking_number[unique]) — shipping.py:30

## 5. API
- POST /api/shipments/ — shipping.py:16
- GET /api/shipments/{shipment_id} — shipping.py:21
- GET /api/shipments/tracking/{tracking_number} — shipping.py:28
- GET /api/shipments/order/{order_id} — shipping.py:35
- PUT /api/shipments/{shipment_id}/status — shipping.py:40

## 6. 권한
미발견 (무인증 — R1 보안 발견)

## 7. 금지
미발견

## 8. 보안
tracking_number unique 제약

## 9. 승인 기준
운송장으로 추적 조회 · 주문별 배송 목록·상태 전이 동작

## 10. 통합점
- M-04 (주문) — references (shipment.order_id)

## 11. 설정
미발견

## 12. 의존성
M-04 주문

## 재사용 메모
order_id 단방향 FK 의존. 실제 택배사 연동 없음(tracking_number 저장만, R1 integration: none) — 외부 캐리어 API는 재사용 시 신규 연동 필요.
