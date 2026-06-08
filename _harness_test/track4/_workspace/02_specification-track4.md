# 규격 문서 — Track 4 (User Feedback Collection)

> 산출: Spec Writer (Task 2)
> 입력: `_harness_test/track4/_workspace/01_requirements-track4.md` (Intent Analyzer, Task 1)
> 다음 단계: Developer (Task 3) → Validator (Task 4)
> 게이트 확인: 기획자_승인 = **YES** (요구사항 [기획자 의도] 확인됨) → 본 규격 작성 진행함

```yaml
규격_ID: spec-track4-20260608
도메인: feedback (신규)
표준화된_의도: add user feedback collection feature
대상_앱: _harness_test/track4/sample-app/
기술_스택: FastAPI + SQLAlchemy + SQLite(개발) / pytest
```

---

## [기획자 의도] ★ 경계 이월 (P0) — Carry-forward

> 본 섹션은 Task 1 요구사항의 [기획자 의도]를 **그대로 이월**한다.
> Developer(Task 3)와 Validator(Task 4)는 이 경계를 강제 기준으로 사용한다.
> **이 경계 밖의 어떤 기능도 구현하지 않는다.**

```yaml
기능명: User Feedback Collection (사용자 피드백 수집)
신규_또는_기존: 신규
관련모듈: feedback (신규 도메인) — 기존 07_review_rating_system 과는 별개
기획자_승인: YES
무단추가_금지: 본 기능(피드백 제출 + 본인 피드백 목록 + 테이블 1개)만 진행. 그 외 일체 추가 금지.
```

### 명시적 금지 목록 (기획서에 없음 = 무단 추가 = 검증 실패)

| # | 금지 항목 | 비고 |
|---|----------|------|
| 1 | 헬스체크 API (`/health`, `/api/health`) | ❌ 추가 금지 |
| 2 | 관리자 기능 (admin 엔드포인트) | ❌ 추가 금지 |
| 3 | 이메일/알림 발송 | ❌ 추가 금지 |
| 4 | 피드백 수정/삭제 | ❌ MVP 범위 외 |
| 5 | 통계/대시보드 | ❌ 추가 금지 |
| 6 | 외부 연동 | ❌ 추가 금지 |

### 구현 허용 (ONLY THIS)

1. 피드백 제출 (텍스트 의견 + 별점 1~5, 로그인 사용자) — 엔드포인트 1개
2. 본인 피드백 목록 조회 — 엔드포인트 1개
3. 피드백 저장용 테이블 **1개** (`feedback`)

---

## 1. 개요 (Overview)

`feedback` 도메인은 **로그인한 일반 사용자가 서비스 전반에 대한 일반 의견(텍스트 + 별점 1~5)을
제출**하고, **본인이 제출한 피드백 목록을 조회**할 수 있도록 한다. 제품/서비스 특정 리뷰가 아닌,
제품 ID에 종속되지 않는 **일반 사용자 피드백 수집(MVP)**이다.

- 핵심 기능 2개: (1) 피드백 제출, (2) 본인 피드백 목록 조회
- 인증: JWT 필수 (비로그인 차단)
- 데이터: 테이블 1개 (`feedback`)
- 범위: MVP 핵심만. 수정/삭제/관리자/통계/알림/외부연동 없음.

---

## 2. 데이터 모델 (Data Model)

### 테이블: `feedback` (총 1개)

| 필드 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | INTEGER | PK, AUTOINCREMENT | 피드백 고유 ID |
| `user_id` | INTEGER | NOT NULL, INDEX | 제출자(로그인 사용자) ID — JWT subject에서 추출 |
| `content` | TEXT | NOT NULL | 피드백 텍스트 의견 |
| `rating` | INTEGER | NOT NULL, CHECK(rating BETWEEN 1 AND 5) | 별점 1~5 |
| `status` | VARCHAR(20) | NOT NULL, DEFAULT 'submitted' | 상태값 (4절 참조) |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT now() | 생성 시각 (UTC) |

**필드 수: 6개.**

- 다른 테이블과의 FK 제약은 두지 않는다(`user_id`는 JWT에서 받은 사용자 식별자, 논리적 참조).
- `updated_at` 없음 — 수정 기능이 범위 외이므로 의도적으로 제외.

---

## 3. API 엔드포인트 (API Endpoints)

총 **2개**. 그 외 엔드포인트(health, admin 등) 추가 금지.

### 3.1 POST /feedback — 피드백 제출

- **인증:** JWT 필수 (`Authorization: Bearer <token>`)
- **요청 본문 (JSON):**
  ```json
  {
    "content": "string (필수, 비어있지 않음)",
    "rating": 5
  }
  ```
  - `content`: 비어있지 않은 문자열 (공백만 입력 불가)
  - `rating`: 정수, 1 이상 5 이하
- **응답 201 Created:**
  ```json
  {
    "id": 1,
    "user_id": 42,
    "content": "좋아요",
    "rating": 5,
    "status": "submitted",
    "created_at": "2026-06-08T12:00:00Z"
  }
  ```
- **상태 코드:**
  | 코드 | 의미 |
  |------|------|
  | 201 | 생성 성공 |
  | 401 | JWT 없음/유효하지 않음 |
  | 422 | 검증 실패 (content 빈 값, rating 범위 밖/누락) |

### 3.2 GET /feedback — 본인 피드백 목록 조회

- **인증:** JWT 필수
- **동작:** JWT subject(`user_id`)와 일치하는 피드백만 반환. 타인 피드백 조회 불가.
- **요청 본문:** 없음
- **응답 200 OK:**
  ```json
  [
    {
      "id": 1,
      "user_id": 42,
      "content": "좋아요",
      "rating": 5,
      "status": "submitted",
      "created_at": "2026-06-08T12:00:00Z"
    }
  ]
  ```
  - 피드백이 없으면 빈 배열 `[]` 반환.
- **상태 코드:**
  | 코드 | 의미 |
  |------|------|
  | 200 | 조회 성공 (빈 목록 포함) |
  | 401 | JWT 없음/유효하지 않음 |

> 참고: 경로(`/feedback`)는 07 모듈의 `/products/:id/reviews`, `/reviews/:id` 와 **겹치지 않는다.**

---

## 4. 상태값 정의 (Status Values)

| 상태 | 설명 | 전이 | 기본값 |
|------|------|------|--------|
| `submitted` | 사용자가 제출한 상태 | (없음 — MVP에서 종결) | ✅ 기본값 |

- MVP에서는 단일 상태 `submitted`만 사용한다.
- 모더레이션/승인/거부 상태는 **07 모듈 소관**이며 본 도메인에 도입하지 않는다(범위 외).

---

## 5. 보안 요구사항 (Security)

- **JWT 인증 필수:** 두 엔드포인트 모두 유효한 Bearer JWT가 없으면 401.
- **사용자 식별:** `user_id`는 클라이언트 입력이 아니라 **JWT subject에서 서버가 추출**한다
  (요청 본문의 user_id는 무시/거부).
- **소유권 격리:** GET /feedback는 토큰 소유자의 피드백만 반환 (타인 데이터 노출 금지).
- **입력 검증:** `content` 비어있지 않음, `rating` 정수 1~5. 위반 시 422.
- (참조 의존) 01_member_system 의 JWT 발급/검증 메커니즘에 의존. 자체 인증 구현 없음.

---

## 6. 에러 처리 (Error Handling)

| 상황 | 응답 |
|------|------|
| JWT 누락/만료/위조 | 401 Unauthorized |
| `content` 빈 값/누락 | 422 Unprocessable Entity |
| `rating` 누락/정수 아님/범위(1~5) 밖 | 422 Unprocessable Entity |
| 요청 본문이 JSON 아님 | 422 Unprocessable Entity |

---

## 7. 성능 요구사항 (Performance)

- 동시접속 약 100명 (소규모 MVP) 기준.
- `feedback.user_id`에 인덱스 → 본인 목록 조회 효율 확보.
- 별도 캐싱/집계 없음 (집계 기능은 범위 외).

---

## 8. 의존성 (Dependencies)

- **01_member_system (참조 전용):** JWT 인증/사용자 식별에 의존.
- **07_review_rating_system:** 의존하지 않음. **별개 도메인으로 분리 유지** (3절 충돌 확인 참조).
- 그 외 모듈 의존 없음.

---

## 9. 통합 포인트 (Integration Points)

- JWT 검증 미들웨어/디펜던시 (FastAPI dependency) 1개를 통해 인증 게이트 적용.
- 알림/이메일/외부 시스템 연동 훅 **없음** (범위 외).

---

## 10. 오류 시나리오 (Error Scenarios)

1. 비로그인 사용자가 POST /feedback → 401.
2. rating=0 또는 rating=6 제출 → 422.
3. content="" (빈 문자열) 제출 → 422.
4. 사용자 A 토큰으로 GET /feedback → A의 피드백만 반환, B의 데이터 미노출.
5. 피드백 0건인 사용자 GET /feedback → 200 + `[]`.

---

## 11. 승인 기준 (Acceptance Criteria)

### 피드백 제출 (POST /feedback)
- ✅ 로그인 사용자가 텍스트 + 별점(1~5)으로 제출 → 201, 레코드 생성
- ✅ `user_id`가 JWT에서 설정됨 (요청 본문 user_id 무시)
- ✅ status 기본값 `submitted` 저장
- ✅ rating 범위(1~5) 위반 → 422
- ✅ content 빈 값 → 422
- ✅ JWT 없음 → 401

### 본인 피드백 목록 (GET /feedback)
- ✅ 로그인 사용자가 본인 피드백만 조회 (타인 것 미노출)
- ✅ 피드백 없으면 빈 배열 반환 (200)
- ✅ JWT 없음 → 401

### 데이터/범위
- ✅ 테이블은 `feedback` **단 1개**만 생성됨
- ✅ 엔드포인트는 `POST /feedback`, `GET /feedback` **2개만** 존재
- ✅ 07_review_rating_system 테이블/엔드포인트와 충돌/중복 없음

### 무단 추가 검증 (기획 의도 강제)
- ✅ 헬스체크 엔드포인트 없음
- ✅ 관리자(admin) 엔드포인트 없음
- ✅ 이메일/알림 발송 코드 없음
- ✅ 피드백 수정(PUT/PATCH)/삭제(DELETE) 엔드포인트 없음
- ✅ 통계/대시보드/집계 엔드포인트 없음
- ✅ 외부 연동 코드 없음

---

## 12. 향후 확장 (Future Extensions) — 본 작업 범위 아님 (NOT IN SCOPE)

> 아래는 **참고용 기록일 뿐, 이번 구현 대상이 절대 아니다.** Developer는 구현하지 않는다.

- (추후) 관리자 피드백 조회/모더레이션
- (추후) 피드백 수정/삭제
- (추후) 통계/대시보드
- (추후) 알림 연동

---

## 부록 A. 기존 스펙 충돌 검토 결과 (Cross-Module Check)

`07_review_rating_system.md` 와 대조한 결과 **충돌 없음**:

| 항목 | 07_review_rating_system | feedback (신규) | 충돌? |
|------|------------------------|-----------------|-------|
| 목적 | 제품 ID 종속 리뷰 | 제품 무관 일반 피드백 | 별개 |
| 테이블 | product_reviews 외 5개 | feedback 1개 | 이름 중복 없음 |
| 엔드포인트 | /products/:id/reviews, /reviews/:id, /admin/reviews/* 등 | /feedback (POST, GET) | 경로 중복 없음 |
| 인증 | 공개 조회 + 인증 작성 + admin | 전부 JWT 필수 | 별개 |
| 부가기능 | 모더레이션/도움됨/판매자응답/NPS/집계 | 없음 | 흡수 안 함 |

**결론:** `feedback`은 07 모듈을 흡수하거나 중복하지 않는 독립 신규 도메인이다.
