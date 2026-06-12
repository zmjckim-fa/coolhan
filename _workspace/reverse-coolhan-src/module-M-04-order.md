# M-04 주문 관리 (Order) — 통합 허브 ⚠️

- **maps_to_existing:** `09_order_management` · **novelty:** existing
- **proposed_kb_file:** `09_order_management.md` (diff 제안, 미반영)
- **evidence:** F-04 · src/routes/order.py, src/models/order.py
- **coupling:** HIGH (도메인 허브 — 단독 추출 시 결제/배송/재고 끌려옴)

## 1. 용어
order · order_number · order_item · subtotal/tax/shipping/discount/total_amount

## 2. 기능
- 주문 생성 — order+order_item 생성, 총액 소유 (F-04)
- 주문 조회/사용자별 목록 (F-04)
- 주문 상태 변경 — status 전이 (F-04)
- 주문 취소 — cancel (F-04)

## 3. 상태값
status 전이/취소 엔드포인트 존재; 정확한 enum 집합 R1 미수집 → 부분 미발견 (00_STATUS_VALUE_REGISTRY 대조 필요)

## 4. 데이터 모델
- `order` (id, order_number, user_id, status, subtotal, tax, shipping, discount, total_amount) — order.py:29 (**주문 총액 소유권 보유**)
- `order_item` (id, order_id, product_id, quantity, unit_price, total_price) — order.py:68

## 5. API
- POST /api/orders/ — order.py:47
- GET /api/orders/{order_id} — order.py:78
- GET /api/orders/user/{user_id} — order.py:87
- PUT /api/orders/{order_id}/status — order.py:94
- POST /api/orders/{order_id}/cancel — order.py:108

## 6. 권한
미발견 (무인증; 타인 주문 조회 차단 코드 미확인 — R1 보안 발견)

## 7. 금지
미발견 (스펙상 '타인 주문 조회 금지' 기대되나 코드 미확인)

## 8. 보안
주문 총액 계산을 order가 소유 (Phase2 충돌#6 해결과 정합)

## 9. 승인 기준
주문 생성 시 항목·총액 산정 · 상태 전이/취소 동작

## 10. 통합점
- M-01 (회원) — references (order.user_id)
- M-02 (쇼핑) — references (order_item.product_id)
- 피참조: M-03 결제 · M-05 재고 · M-06 배송 (모두 order_id로 본 모듈 참조)

## 11. 설정
미발견

## 12. 의존성
M-01 회원, M-02 쇼핑

## 재사용 메모 (⚠️ HIGH COUPLING)
도메인 허브. 외향 2(M-01,M-02) + 피참조 3(M-03,M-05,M-06). 단독 추출 시 결제/배송/재고 경계까지 끌려오기 쉬움.
**이식 시 order_id 인터페이스만 노출하고 나머지는 어댑터 경유 분리 필요.** Cross-Site Adapter에 허브 경고 전달.
