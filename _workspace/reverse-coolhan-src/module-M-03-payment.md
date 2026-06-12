# M-03 결제 시스템 (Payment)

- **maps_to_existing:** `03_payment_system` · **novelty:** existing
- **proposed_kb_file:** `03_payment_system.md` (diff 제안, 미반영)
- **evidence:** F-05 · src/routes/payment.py, src/models/payment.py
- **coupling:** medium (order_id 단방향 FK; 실 PG 연동 없음)

## 1. 용어
payment · idempotency_key · transaction_id · gateway_response · method(STRIPE/PAYPAL enum)

## 2. 기능
- 결제 생성 — order 대상 결제 레코드 (F-05)
- 결제 조회/주문별 목록 (F-05)
- 결제 완료 — complete 전이 (F-05)
- 결제 실패 — fail 전이 (F-05)

## 3. 상태값
pending/complete/fail (전이 엔드포인트로 추론; 정확한 enum 집합 R1 미수집 → 부분 미발견)

## 4. 데이터 모델
- `payment` (id, order_id, idempotency_key[unique], amount, method, status, transaction_id, gateway_response) — payment.py:39

## 5. API
- POST /api/payments/ — payment.py:40
- GET /api/payments/{payment_id} — payment.py:53
- GET /api/payments/order/{order_id} — payment.py:62
- POST /api/payments/{payment_id}/complete — payment.py:69
- POST /api/payments/{payment_id}/fail — payment.py:78

## 6. 권한
미발견 (무인증 — R1 보안 발견)

## 7. 금지
미발견

## 8. 보안
idempotency_key unique 제약으로 결제 멱등성 (payment.py:45) · **실 PG 연동 없음** — method enum 문자열 + gateway_response 저장만 (R1 integration: none)

## 9. 승인 기준
동일 idempotency_key 중복 결제 차단 · complete/fail 전이 동작

## 10. 통합점
- M-04 (주문) — references (payment.order_id FK)

## 11. 설정
미발견

## 12. 의존성
M-04 주문

## 재사용 메모
실 게이트웨이는 미구현(enum stub) → '결제 레코드/상태기계'. 재사용 시 실제 PG 연동 신규 부착. 어댑터 경유 권장.
