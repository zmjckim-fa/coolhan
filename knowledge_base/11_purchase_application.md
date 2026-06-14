# 도메인 모듈 11: 구매신청 (Purchase Application)

## 섹션 1: 모듈 식별

- **모듈 ID:** 11_purchase_application
- **도메인:** 구매신청 / Purchase Application
- **버전:** 1.0.0
- **상태:** 활성
- **의존 모듈:** 01_member_system, 09_order_management

---

## 섹션 2: 핵심 기능 (10개)

| # | 기능 | 설명 |
|---|------|------|
| F1 | 구매신청 접수 | 상품 + 배송지 + 결제방법 입력 후 신청 생성 |
| F2 | 신청 상세 조회 | 신청번호로 단건 조회 (마이페이지) |
| F3 | 신청 목록 조회 | 고객별 신청 목록 (페이지네이션) |
| F4 | 상태 업데이트 | 관리자가 상태 전이 실행 |
| F5 | 신청 취소 | pending/reviewing 상태에서만 가능 |
| F6 | 상태 타임라인 | 상태 이력 순서대로 표시 |
| F7 | 상품 명세 계산 | 수량 × 단가 = 소계, 합계 |
| F8 | 배송지 검증 | 필수 필드(이름, 주소, 연락처) 검증 |
| F9 | 신청번호 생성 | PA-YYYYMMDD-XXXX 포맷 자동 생성 |
| F10 | 마이페이지 HTML 렌더 | 반응형 상세 화면 (360px~) |

---

## 섹션 3: 데이터베이스 스키마

### purchase_applications 테이블
```sql
CREATE TABLE purchase_applications (
    id              VARCHAR(20) PRIMARY KEY,   -- PA-YYYYMMDD-XXXX
    customer_email  VARCHAR(255) NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'pending',
    total_amount    DECIMAL(12,2) NOT NULL,
    currency        VARCHAR(3) NOT NULL DEFAULT 'KRW',
    payment_method  VARCHAR(50),
    logistics_note  TEXT,
    created_at      DATETIME NOT NULL,
    updated_at      DATETIME NOT NULL
);

CREATE TABLE purchase_items (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    application_id  VARCHAR(20) NOT NULL REFERENCES purchase_applications(id),
    name            VARCHAR(200) NOT NULL,
    qty             INTEGER NOT NULL DEFAULT 1,
    unit_price      DECIMAL(12,2) NOT NULL,
    subtotal        DECIMAL(12,2) NOT NULL
);

CREATE TABLE purchase_recipients (
    application_id  VARCHAR(20) PRIMARY KEY REFERENCES purchase_applications(id),
    recipient_name  VARCHAR(100) NOT NULL,
    phone           VARCHAR(30) NOT NULL,
    address1        VARCHAR(255) NOT NULL,
    address2        VARCHAR(255),
    city            VARCHAR(100),
    postal_code     VARCHAR(20)
);
```

---

## 섹션 4: 상태값 (00_STATUS_VALUE_REGISTRY.md 준수)

| 상태 코드 | 한국어 | 색상 | 전이 가능 대상 |
|---------|--------|------|---------------|
| `pending` | 접수 완료 | #6B7280 | reviewing, cancelled |
| `reviewing` | 검토 중 | #D97706 | approved, cancelled |
| `approved` | 승인 완료 | #059669 | shipping |
| `shipping` | 배송 중 | #2563EB | delivered |
| `delivered` | 배달 완료 | #15803D | (종료) |
| `cancelled` | 취소 | #DC2626 | (종료) |

---

## 섹션 5: API 엔드포인트

| 메서드 | 경로 | 설명 | 권한 |
|-------|------|------|------|
| POST | `/api/purchase` | 신청 접수 | 로그인 고객 |
| GET | `/api/purchase/{id}` | 단건 조회 | 본인 또는 관리자 |
| GET | `/api/purchase` | 목록 조회 | 본인 또는 관리자 |
| PATCH | `/api/purchase/{id}/status` | 상태 변경 | 관리자 |
| DELETE | `/api/purchase/{id}` | 취소 | 본인 (pending/reviewing만) |
| GET | `/mypage/purchase/{id}` | HTML 상세 화면 | 본인 |

---

## 섹션 6: 보안 기준

- 본인 확인: `customer_email` 매칭 (JWT 또는 세션)
- 타인 신청 조회 시 403 반환
- 없는 신청번호 조회 시 404 반환
- 취소 불가 상태(approved 이후) 에서 취소 요청 시 422 반환

---

## 섹션 7: 통합 포인트

- **01_member_system:** 고객 인증, 이메일 조회
- **09_order_management:** 주문 확정 전 구매신청 → 주문 전환 흐름
- **08_inventory_management:** 승인 시 재고 예약 트리거 (선택)

---

## 섹션 8: 인수 기준 (Acceptance Criteria)

| # | 기준 | 검증 방법 |
|---|------|---------|
| AC1 | 신청번호 PA-YYYYMMDD-XXXX 형식 자동 생성 | 단위 테스트 |
| AC2 | 상세 조회 시 모든 섹션(기본/상품/배송/결제) 포함 | API 응답 구조 검증 |
| AC3 | 타인 신청 조회 시 403 반환 | 음성 테스트 |
| AC4 | HTML 화면이 360px 모바일에서 레이아웃 깨짐 없음 | 반응형 검증 |
| AC5 | pending 상태만 취소 가능 | 상태 전이 테스트 |
| AC6 | 소계 = qty × unit_price 자동 계산 | 계산 검증 |

---

## 섹션 9: 오류 시나리오

| 오류 | 코드 | 메시지 |
|------|------|--------|
| 신청 미존재 | 404 | "신청번호를 찾을 수 없습니다" |
| 타인 신청 접근 | 403 | "접근 권한이 없습니다" |
| 취소 불가 상태 | 422 | "현재 상태에서는 취소할 수 없습니다" |
| 필수 필드 누락 | 422 | "필수 항목이 누락되었습니다: {field}" |
| 수량 오류 | 422 | "수량은 1 이상이어야 합니다" |

---

## 섹션 10: 마이페이지 화면 명세

### 레이아웃 (모바일 우선)
```
[페이지 제목: 구매신청 상세]
[브레드크럼: 마이페이지 › 구매신청 › {id}]

카드 1: 신청 정보
  - 신청번호 | 상태 뱃지 | 신청일

카드 2: 상품 목록
  - 테이블: 상품명 | 수량 | 단가 | 소계
  - 합계 행

카드 3: 배송지 정보
  - 수취인 | 연락처 | 주소

카드 4: 결제 정보
  - 결제방법 | 총 금액

카드 5: 상태 타임라인
  - 접수 → 검토 → 승인 → 배송 → 완료 (현재 상태 하이라이트)

[버튼: ← 목록으로]
```

### 반응형 기준
- 모바일(~767px): 단일 컬럼, 카드 100% 너비
- 태블릿(768px~): 2컬럼 그리드 가능
- 데스크탑(1024px~): max-width 900px, 중앙 정렬

---

## 섹션 11: 데모 구현 (track10)

경로: `_harness_test/track10/`

| 파일 | 역할 |
|------|------|
| `main.py` | FastAPI 앱 엔트리포인트 |
| `models.py` | Pydantic 모델 + 파일 기반 스토어 |
| `templates/mypage_purchase_detail.html` | Jinja2 반응형 HTML 템플릿 |

---

## 섹션 12: 변경 이력

| 날짜 | 버전 | 변경 내용 |
|------|------|---------|
| 2026-06-13 | 1.0.0 | 최초 작성 — 마이페이지 구매신청 상세 화면 |
