# M-05 재고 관리 (Inventory)

- **maps_to_existing:** `08_inventory_management` · **novelty:** existing
- **proposed_kb_file:** `08_inventory_management.md` (diff 제안, 미반영)
- **evidence:** F-06 · src/routes/inventory.py, src/models/inventory.py
- **coupling:** medium (product_id 단방향 FK)

## 1. 용어
inventory_item · inventory_transaction(ledger) · reserve · release

## 2. 기능
- 재고 항목 생성/조회 — product 1:1 (F-06)
- 상품별 재고 조회 — product_id 기준 (F-06)
- 재고 예약 — reserve, 트랜잭션 원장 기록 (F-06)
- 재고 해제 — release (F-06)

## 3. 상태값
미발견 (예약/해제 동작 존재, 명시적 상태 enum 미확인)

## 4. 데이터 모델
- `inventory_item` (id, product_id[unique]) — inventory.py:35 (product 1:1)
- `inventory_transaction` (id, inventory_item_id) — inventory.py:71 (1:N 원장)

## 5. API
- POST /api/inventory/items/ — inventory.py:15
- GET /api/inventory/items/{item_id} — inventory.py:20
- GET /api/inventory/product/{product_id} — inventory.py:27
- POST /api/inventory/{item_id}/reserve — inventory.py:34
- POST /api/inventory/{item_id}/release — inventory.py:41

## 6. 권한
미발견 (무인증 — R1 보안 발견)

## 7. 금지
미발견 (음수 재고 방지 등 코드 미확인)

## 8. 보안
inventory_transaction 원장으로 재고 변동 추적

## 9. 승인 기준
reserve/release 시 트랜잭션 기록 · product 1:1 재고 유지

## 10. 통합점
- M-02 (쇼핑) — references (inventory_item.product_id)

## 11. 설정
미발견

## 12. 의존성
M-02 쇼핑

## 재사용 메모
product_id 단방향 의존(명확). 주문 흐름의 reserve/release 호출관계는 R1 미확인 — 예약 타이밍을 주문과 분리해 어댑터 경유 호출하면 추출 가능.
