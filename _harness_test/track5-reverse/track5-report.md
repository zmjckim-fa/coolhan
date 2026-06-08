# 트랙5 — 역방향 하네스 검증 리포트

**일자:** 2026-06-08
**대상:** `_harness_test/track5-reverse/sample-app-A` (Python/FastAPI 미니 쇼핑몰)
**파이프라인:** Site Analyzer(R1) → Module Extractor(R2) → Cross-Site Adapter(R3) + 적대적 P0 검증
**방식:** 트랙4식 적대적 검증 (클린 vs 위반), 코드 증거(파일:라인) 기반, 추론 금지

---

## 1. 스택 감지 결과 (stack-agnostic 작동 입증)

| 항목 | 판정 | 증거 |
|------|------|------|
| language | **python** | requirements.txt, main.py:5 |
| framework | **fastapi** | requirements.txt:1, main.py:5,9 |
| orm | **sqlalchemy** | requirements.txt:3, 모든 model `declarative_base` |
| database | **unknown** (정직 표기) | engine/연결문자열 소스 미발견 |
| frontend | **none** | 라우터 전부 api-only |
| command_map | install=`pip install -r requirements.txt`, test=`pytest`, run=`uvicorn main:app`, build=`null` | requirements.txt + FastAPI 관례 |

**stack-agnostic 입증:** 1단계 스택 감지를 최우선 수행. `requirements.txt` + `from fastapi` 시그널로 Python/FastAPI 정확 판정. **npm/Node를 기본값으로 가정하지 않음** (트랙4 GAP-1 교훈 반영 확인). 빌드 명령은 Python에 불필요하므로 `null` 처리(억지 npm 매핑 없음). 분석 불가 영역(DB 엔진, PG vendor, 실제 인증)은 `unanalyzable`에 정직 기록.

---

## 2. R1 / R2 / R3 산출물 요약

### R1 — Site Analysis Map
- 라우트 **11개**, 데이터 모델 **5개**(members, orders, order_items, payments, stock_items), 기능 **4개**(F-01 회원 / F-02 주문 / F-03 결제 / F-04 재고), 통합점 **1개**(외부 PG, confidence low).
- 저신뢰 1개, 분석 불가 3건(DB 엔진 / PG vendor / 실제 인증). 모든 항목 evidence(파일:라인) 동반.

### R2 — Module Manifest
- 모듈 **4개**, **전부 기존 10모듈에 매핑**(신규 0):
  - M-01 회원 → 01_member_system (low)
  - M-02 주문 → 09_order_management (**high**, 허브)
  - M-03 결제 → 03_payment_system (medium)
  - M-04 재고 → 08_inventory_management (low)
- 의존성 그래프: M-02 → {M-01 owned_by, M-03 calls, M-04 reserves}; M-03 → M-02 belongs_to. 순환 호출 없음, M-02가 강결합 허브.
- KB 환류: 4개 모두 기존 구조와 일치 → 변경/신규 제안 없음(창작 없음).

### R3 — Application Plan (주문 모듈만 승인 시나리오)
- 승인 게이트 **PASS** (M-02 명시 승인).
- 승인 **1개**(M-02) / 거부 **3개**(M-01/M-03/M-04, 승인 목록 외).
- `dependency_missing` 충돌 1개: M-02가 미승인 3개에 의존 → **자동 끌어오기 차단**, 기획자 결정 필요, `ready_to_port: false`.
- P0 승인 표면: 엔드포인트 3개(/api/orders 계열) + 테이블 2개(orders, order_items).

---

## 3. 적대적 P0 검증 결과 표

**검사식:** 이식 결과 ⊆ approved_surface(M-02) → PASS, 초과 시 FAIL.

| 케이스 | 입력(approved) | 이식 결과 | 초과 항목 | 기대 | 실제 판정 | 오탐/누락 |
|--------|----------------|-----------|-----------|------|-----------|-----------|
| **클린** | M-02만 | 주문 표면만(3 엔드포인트+2 테이블) | 0 | PASS | **PASS** ✅ | 없음 |
| **위반** | M-02만 | 주문 + 결제 `POST /api/payments` + `payments` 테이블 누수 | 2 | FAIL | **FAIL** ✅ | 없음 |

**위반 케이스 검출 상세:**
- 무단 엔드포인트 `POST /api/payments` (출처 M-03 결제, rejected; 증거 `src/routes/payment.py:6`)
- 무단 테이블 `payments` (출처 M-03 결제, rejected; 증거 `src/models/payment.py:7`)
- 근본 원인: M-02→M-03 calls 의존을 따라 결제가 자동 동반 = R3 의존성 검사가 차단해야 할 시나리오.

**결론:** 클린→PASS, 위반→FAIL 정확 판정. **오탐 0 / 누락 0.** 트랙3 P0(기획자 의도 강제)가 교차-사이트 이식으로 정상 확장됨.

---

## 4. 발견된 GAP / 한계

| ID | 심각도 | 내용 |
|----|--------|------|
| GAP-A | 정보 | 대상 앱 핸들러가 스텁(하드코딩 반환). 실제 인증·PG·DB 연동 코드가 없어 `auth_required`(medium)·DB(unknown)·PG vendor를 코드로 확정 불가. 정직하게 unanalyzable 기록으로 처리 — 하네스 결함 아님, 샘플 앱 특성. |
| GAP-B | 낮음 | R2가 모듈별 `module-{id}-{name}.md` 개별 파일을 산출하도록 정의되어 있으나, 본 검증에서는 매니페스트 JSON의 12섹션 + 요약 .md로 통합 산출(승인 표면 검증에는 충분). 실제 Developer 핸드오프 시 M-02 개별 .md 분리 권장. |
| GAP-C | 낮음 | M-02↔M-03 FK 양방향 참조(orders.id ↔ payments.order_id). 주문만 단독 이식 시 orders 테이블에서 payments 측 FK는 자연 소멸하나, 결제가 주문을 참조하는 설계라 결제 이식 시 주문 선행 필요 — port_order에 반영됨. |

**트랙4 GAP-1(스택 비호환) 재발 없음:** 역방향 3개 에이전트가 스택 감지를 1단계로 강제하여 Python을 정확 처리, npm 미가정.

---

## 5. 종합 판정

**역방향 하네스 작동: ✅ PASS**

- **R1 stack-agnostic:** Python/FastAPI/SQLAlchemy 정확 감지, command_map 도출, npm 미가정, 분석 불가 영역 정직 기록.
- **R2 모듈화:** 4기능 → 4모듈, 기존 10모듈 100% 매핑(무분별 신규 양산 없음), 결합도/의존성 그래프 정직 평가(M-02 high 허브 명시).
- **R3 + 적대적 P0:** 승인 게이트·거부 분류·`dependency_missing` 자동 끌어오기 차단 작동. **적대적 검증에서 클린→PASS / 위반→FAIL을 오탐·누락 0으로 판정.**
- **핵심 성과:** "분석 → 모듈화 → 이식" 전 과정에서 **기획자가 승인하지 않은 모듈(결제)이 의존성을 타고 B로 새어 들어가는 것을 원천 차단**함을 실증. 트랙3 P0 메커니즘의 교차-사이트 확장이 정상 작동.

---

## 산출물

- `_workspace/R1_site-analysis-map.json` + `.md`
- `_workspace/R2_module-manifest.json` + `.md`
- `_workspace/R3_application-plan.json` + `.md`
- `track5-report.md` (본 문서)
