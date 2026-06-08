# R3 — Application Plan 요약 + 적대적 P0 검증 (A → B)

**계획 ID:** 2026-06-08-track5-R3 / **입력:** R2_module-manifest.json
**시나리오:** 사이트 A의 **주문 모듈만** 빈 사이트 B에 적용. `approved_modules = [M-02 주문]`. 결제/재고/회원 미승인.

## 승인 게이트

- **PASS** — 기획자가 승인 모듈(M-02)을 명시함. (미명시였다면 GATE_LOCK)

## 승인 / 거부 분류

| 모듈 | 결정 | 사유 |
|------|------|------|
| M-02 주문 | ✅ 승인 | 기획자 명시 승인 |
| M-01 회원 | ❌ 거부 | 승인 목록 외 |
| M-03 결제 | ❌ 거부 | 승인 목록 외 (M-02가 calls 의존하나 **자동 끌어오기 금지**) |
| M-04 재고 | ❌ 거부 | 승인 목록 외 (M-02가 reserves 의존하나 **자동 끌어오기 금지**) |

## 의존성 검사 (P0 핵심)

M-02는 M-01/M-03/M-04에 의존하나 **셋 다 미승인** → `dependency_missing` 충돌 기록, **자동 포팅 차단**. 기획자 결정 필요(추가 승인 vs 어댑터 대체 vs 보류). `ready_to_port: false`.

## P0 승인 표면 (Validator 0단계 화이트리스트)

- **엔드포인트:** `POST /api/orders`, `GET /api/orders/{order_id}`, `POST /api/orders/{order_id}/cancel`
- **테이블:** `orders`, `order_items`
- 이 표면만 B에 존재해야 PASS.

---

# 적대적 P0 검증 (Validator 0단계 교차-사이트 모드 모사)

**검사식:** `이식 결과 ⊆ approved_surface(M-02)` 이면 PASS, 초과 항목(미승인 모듈의 엔드포인트/테이블) 발견 시 FAIL.

## 케이스 1 — 클린 (기대: PASS)

**입력(approved):** 엔드포인트 {POST /api/orders, GET /api/orders/{id}, POST /api/orders/{id}/cancel}, 테이블 {orders, order_items}

**B 이식 결과(가정):** 위 3개 엔드포인트 + 2개 테이블만 존재.

**대조:**

| 이식 항목 | approved_surface에 포함? |
|-----------|--------------------------|
| POST /api/orders | ✅ |
| GET /api/orders/{order_id} | ✅ |
| POST /api/orders/{order_id}/cancel | ✅ |
| table orders | ✅ |
| table order_items | ✅ |

초과 항목 = 0 → **판정: PASS** ✅ (기대와 일치, 오탐 없음)

## 케이스 2 — 위반 (기대: FAIL)

**입력(approved):** 동일 (M-02 표면).

**B 이식 결과(가정):** 주문 표면 + **결제 엔드포인트 `POST /api/payments`** + **`payments` 테이블**이 함께 새어 들어옴 (M-03 무단 끌어오기).

**대조:**

| 이식 항목 | approved_surface에 포함? | 판정 |
|-----------|--------------------------|------|
| POST /api/orders | ✅ | ok |
| GET /api/orders/{order_id} | ✅ | ok |
| POST /api/orders/{order_id}/cancel | ✅ | ok |
| table orders | ✅ | ok |
| table order_items | ✅ | ok |
| **POST /api/payments** | ❌ (M-03 결제, 미승인) | **무단 끌어오기** |
| **table payments** | ❌ (M-03 결제, 미승인) | **무단 끌어오기** |

초과 항목 = 2 → **판정: FAIL** ✅ (기대와 일치, 누락 없음)

**FAIL 상세 (항목·위치 명시):**
- 무단 엔드포인트: `POST /api/payments` — 출처 모듈 M-03(결제, rejected). 원본 증거 `src/routes/payment.py:6`.
- 무단 테이블: `payments` — 출처 모듈 M-03(결제, rejected). 원본 증거 `src/models/payment.py:7`.
- 근본 원인: M-02→M-03 `calls` 의존을 따라 결제가 자동 동반 이식됨 = R3 의존성 검사가 막아야 할 바로 그 시나리오.

## 검증 결과 표

| 케이스 | 입력(approved) | 이식 결과 | 초과 항목 | 기대 | 실제 판정 | 오탐/누락 |
|--------|----------------|-----------|-----------|------|-----------|-----------|
| 클린 | M-02만 | 주문 표면만 | 0 | PASS | **PASS** | 없음 |
| 위반 | M-02만 | 주문 + 결제(/api/payments, payments) | 2 | FAIL | **FAIL** | 없음 |

**결론:** Validator 0단계 교차-사이트 모드가 클린→PASS, 위반→FAIL을 정확히 판정. 오탐(클린을 FAIL)·누락(위반을 PASS) 모두 0. 트랙3 P0 메커니즘이 교차-사이트 이식으로 정상 확장됨.

**다음 단계:** Developer(정방향 Task 3) — 단, dependency_missing 충돌 해소 후. P0 가드 적용됨.
