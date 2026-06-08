# R1 — Site Analysis Map 요약 (Sample Shop A)

**분석 ID:** 2026-06-08-track5-R1
**대상:** `_harness_test/track5-reverse/sample-app-A`

## 1단계 스택 감지 (stack-agnostic, 최우선)

| 항목 | 판정 | 증거 |
|------|------|------|
| language | **python** | requirements.txt, main.py imports |
| framework | **fastapi** | requirements.txt:1, main.py:5,9 |
| orm | **sqlalchemy** | requirements.txt:3, 모든 model 파일 `declarative_base` |
| database | **unknown** | engine/연결문자열 소스에 미발견 (추론 금지) |
| frontend | **none** | 라우터 전부 api-only, 템플릿/SPA 없음 |

**command_map:** install=`pip install -r requirements.txt`, build=`null`, test=`pytest`, run=`uvicorn main:app`

> npm/Node 전제 없음. requirements.txt + `from fastapi` 시그널로 Python/FastAPI 정확 판정. 트랙4 GAP-1(npm 전용) 회피 확인.

## 추출 수치

- 라우트: **11개** / 데이터 모델: **5개** / 기능: **4개** / 통합점: **1개(저신뢰)**

## 기능 목록

| ID | 기능 | 라우트 | 모델 | 의존 |
|----|------|--------|------|------|
| F-01 | 회원 가입/로그인/프로필 | signup, login, me | members | — |
| F-02 | 주문 생성/조회/취소 | POST/GET/cancel /api/orders | orders, order_items | F-01, F-03, F-04 |
| F-03 | 결제/환불 | POST /api/payments, refund | payments | F-02 |
| F-04 | 재고 조회/예약 | GET, reserve /api/inventory | stock_items | — |

## 데이터 모델

`members` · `orders` (→members N:1, →order_items 1:N) · `order_items` (→orders N:1) · `payments` (→orders N:1, idempotency_key unique) · `stock_items` (product_id unique, on_hand/reserved)

## 메뉴 트리

없음 — API 전용 앱. 네비게이션 정의 미발견 (추론 안 함, 빈 배열).

## 통합점

- payment_gateway: 외부 PG (vendor 미상) — `src/routes/payment.py:8` docstring에만 존재. **confidence: low** (실제 호출 코드 미발견, 스텁 핸들러).

## 저신뢰 / 분석 불가 경고

- DB 엔진/연결: 소스에 engine 미정의 → `database: unknown`
- PG 실제 연동: 핸들러가 하드코딩 스텁 → vendor/SDK 미상
- 인증: `login`이 `demo-token` 하드코딩, 검증 미들웨어 미발견 → `auth_required`는 docstring/관례 기반 추정(medium)

**다음 단계:** Module Extractor (R2)
