# R2 — Module Manifest 요약 (Sample Shop A)

**매니페스트 ID:** 2026-06-08-track5-R2 / **입력:** R1_site-analysis-map.json

## 추출 모듈 (4개, 전부 기존 10모듈 매핑 / 신규 0)

| 모듈 | 이름 | 기존 매핑 | novelty | 결합도 | 의존 |
|------|------|----------|---------|--------|------|
| M-01 | 회원 시스템 | 01_member_system | existing | low | — |
| M-02 | 주문 관리 | 09_order_management | existing | **high** | M-01, M-03, M-04 |
| M-03 | 결제 시스템 | 03_payment_system | existing | medium | M-02 + 외부 PG |
| M-04 | 재고 관리 | 08_inventory_management | existing | low | — |

## 의존성 그래프

```
M-02(주문) ──owned_by──▶ M-01(회원)   [orders.member_id FK]
M-02(주문) ──calls─────▶ M-03(결제)
M-02(주문) ──reserves──▶ M-04(재고)
M-03(결제) ──belongs_to▶ M-02(주문)   [payments.order_id FK]
```

- **M-02가 허브** — 회원·결제·재고 3개에 의존.
- M-02 ↔ M-03 FK 양방향 참조(강결합). 순환 호출은 아님.

## 결합도 경고 (이식 시)

- **M-02 (high):** 단독 이식 불가 수준. 회원 인증 + 결제 연계 + 재고 예약 인터페이스가 함께 필요. 의존 모듈 미동반 시 어댑터/스텁 필요 → **Application Plan에 전달** (R3 의존성 검사 핵심).
- **M-03 (medium):** order_id FK + 외부 PG. PG 실구현 스텁이라 어댑터 재구현 필요.

## KB 환류 제안

- 4개 모듈 모두 기존 KB(01/03/08/09)와 구조 일치 → **변경/신규 제안 없음**. 창작 없음.

**다음 단계:** Cross-Site Adapter (R3, 응용 적용)
