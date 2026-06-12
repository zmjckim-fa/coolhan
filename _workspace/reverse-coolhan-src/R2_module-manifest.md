# Module Manifest — CoolHan API (`src/`) — R2

**Manifest ID:** R2-coolhan-src-2026-06-12
**Source:** `R1_site-analysis-map.json` (11 features, 18 models, 62 routes)
**Companion JSON:** `R2_module-manifest.json`

## 결과 요약
| 지표 | 값 |
|------|----|
| 추출 모듈 | 10 |
| 기존 흡수 (01~10 매핑) | 10 |
| 신규 후보 (11+) | 0 |
| 고결합(주의) | 1 (M-04 주문 허브) |
| 순환 의존 | 0 (DAG) |

> 11개 feature → 10개 모듈. F-01(인증)+F-02(회원)이 같은 데이터 모델(user/role)을 공유하여 `01_member_system` 한 모듈로 응집. 나머지 9개는 feature 1:1 매핑. **신규 모듈 발명 없음** — 전부 기존 01~10에 정확 매핑.

## 모듈 ↔ 기존 KB 매핑
| 모듈 | 이름 | maps_to_existing | novelty | coupling | feature | 파일 |
|------|------|------------------|---------|----------|---------|------|
| M-01 | 회원 시스템 | 01_member_system | existing | low | F-01,F-02 | module-M-01-member-auth.md |
| M-02 | 쇼핑 카탈로그 | 02_shopping_mall | existing | low | F-03 | module-M-02-shopping-catalog.md |
| M-03 | 결제 | 03_payment_system | existing | medium | F-05 | module-M-03-payment.md |
| M-04 | 주문 관리 ⚠️ | 09_order_management | existing | **high** | F-04 | module-M-04-order.md |
| M-05 | 재고 | 08_inventory_management | existing | medium | F-06 | module-M-05-inventory.md |
| M-06 | 배송·추적 | 04_shipping_logistics | existing | medium | F-07 | module-M-06-shipping.md |
| M-07 | 알림 | 06_notification_system | existing | low | F-08 | module-M-07-notification.md |
| M-08 | 리뷰·평점 | 07_review_rating_system | existing | medium | F-09 | module-M-08-review-rating.md |
| M-09 | GDPR·개인정보 | 10_gdpr_privacy | existing | medium | F-10 | module-M-09-gdpr-privacy.md |
| M-10 | 관리자 감사 로그 | 05_admin_system | existing | low | F-11 | module-M-10-admin-audit-log.md |

> 매핑 정정: R1은 F-07을 `04_shipping_system`으로 표기했으나 실제 KB 파일명은 `04_shipping_logistics.md`. M-06은 후자로 매핑.

## 의존성 그래프 (DAG, 순환 0)
```
M-03 결제 ──→ M-04 주문
M-06 배송 ──→ M-04 주문
M-04 주문 ──→ M-01 회원, M-02 쇼핑
M-05 재고 ──→ M-02 쇼핑
M-07 알림 ──→ M-01 회원
M-08 리뷰 ──→ M-01 회원, M-02 쇼핑
M-09 GDPR ──→ M-01 회원
M-10 관리자 ─→ M-01 회원
```
- **Leaf(외향 의존 0):** M-01 회원, M-02 쇼핑 — 다수 모듈이 이들을 피참조.
- **허브:** M-04 주문 — 외향 2(M-01,M-02) + 피참조 3(M-03,M-05,M-06). 단독 추출 시 결제/배송/재고가 끌려옴.

## 결합도 분포
- **low (4):** M-01, M-02, M-07, M-10 — 그대로 추출 가능
- **medium (5):** M-03, M-05, M-06, M-08, M-09 — 단방향 FK, 어댑터 경유 권장
- **high (1):** M-04 — order_id 인터페이스만 노출, 나머지 어댑터 분리 필요

## ⚠️ 교차 절단 보안 발견 (R1 인계, 모든 모듈 영향)
**62개 중 56개 엔드포인트가 무인증.** `require_admin`(auth.py:72) 정의됐으나 어떤 `/api/admin` 라우트에도 미적용. 오직 `/api/auth/me`·`/api/auth/logout`만 인증 강제.
→ **어떤 모듈도 인증·인가 게이트 적용 없이는 프로덕션 재사용 불가.** 가장 민감: M-09(GDPR 개인정보 무인증 노출), M-10(관리자 감사 로그 무인증 노출).

## 미구현 stub (실 연동 없음, 재사용 시 신규 부착 필요)
- M-03 결제: STRIPE/PAYPAL는 enum 문자열, 실 PG 게이트웨이 없음
- M-06 배송: tracking_number 저장만, 실 택배사 API 없음
- M-07 알림: channel enum + 상태기계만, 실 발신(SMTP/SMS/webhook) 없음

## KB 환류 제안 (propose only — 미반영)
**Updates (diff 제안):**
- `01_member_system.md`: user_role_explicit(assigned_by) 명시적 역할배정 테이블 실존 — 섹션4/5 대조
- `03_payment_system.md`: idempotency_key unique + gateway_response/transaction_id 실존, 단 PG 연동은 stub
- `09_order_management.md`: order가 총액 5필드 직접 소유 (Phase2 충돌#6 해결과 정합) — 실 구현 확증
- `08_inventory_management.md`: reserve/release + inventory_transaction 원장 패턴 실존
- **전 모듈 공통(보안):** reference-impl 56/62 무인증 — KB 섹션6/8(권한·보안)이 reference-impl에서 미충족. KB에 'reference-impl 보안 미완' 경고 또는 정방향 재개발 시 P0 항목화 권장

**New modules:** 없음

## 다음 단계
Cross-Site Adapter (A→B 응용 적용) 또는 정방향 Spec Writer (개발 지속). **허브 경고:** M-04를 단독 이식 시 어댑터 경유 분리 필수. **보안 경고:** 이식 전 인증·인가 게이트 적용 P0.
