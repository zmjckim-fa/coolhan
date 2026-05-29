# 00_health_check_system.md — Health Check & Status (기초 인프라 모듈)

> **모듈 분류:** Core / Infrastructure (도메인 횡단 인프라)
> **신규 사유:** Health Check는 특정 비즈니스 도메인(회원/주문/결제 등)에 속하지 않는 인프라 횡단 기능이므로, 기존 도메인 모듈이 아닌 신규 기초 인프라 모듈로 정의함.
> **출처 요구사항:** `_workspace/01_requirements.md` (Task 1: Intent Analysis)
> **작성:** Task 2 — Spec Writer
> **버전:** v1.0.0
> **상태:** Spec 확정 (Developer 인계 대상)

---

## 0. 개요 (Overview)

Health Check & Status 모듈은 시스템의 가동 상태를 외부에서 확인할 수 있는 **최소 단위의 end-to-end 슬라이스**다.
백엔드 헬스 체크 API (`GET /api/health`)와 이를 호출·렌더링하는 단일 상태 페이지 (`/status`)로 구성된다.

이 모듈은 Phase D Harness 고도화의 **증거 기반 검증 파이프라인(Task 1-8)** 을 실제로 실행·입증하기 위한 검증용 테스트 기능으로 설계되었다.
외부 의존성(DB/PG/배송 등)이 없어, Task 7(Integration Validator: 포트/API)과 Task 8(E2E Tester: UI/반응형)이 실제로 실행 가능한 최소 앱을 제공한다.

| 항목 | 내용 |
|------|------|
| 대상 사용자 | 내부 개발/운영 팀 (시스템 상태 모니터링용) |
| 플랫폼 | 웹 (백엔드 API + 단일 페이지, 모바일 반응형 필수) |
| 규모 | 소규모 (헬스 체크 폴링 수준, 단일 인스턴스) |
| 인증 | 불필요 (공개 헬스 엔드포인트) |
| 핵심 기준 | 차별화가 아닌 **증거 산출 가능성** |

### 0.1 핵심 컴포넌트

| 컴포넌트 | 식별자 | 책임 |
|----------|--------|------|
| Health API | `GET /api/health` | status / uptime / version / timestamp 반환 (HTTP 200) |
| Status Page | `GET /status` | 헬스 응답 호출 및 렌더링, 정상/비정상 시각 표시, 모바일 반응형 |

---

## 1. 데이터 모델 (Data Model)

본 모듈은 **영속 데이터(DB 테이블)를 사용하지 않는다.** 헬스 상태는 런타임 인메모리 값으로 계산된다.
데이터 모델은 API 응답 스키마(전송 모델)로 정의한다.

### 1.1 HealthStatus (응답 모델)

| 필드 | 타입 | 설명 | 예시 |
|------|------|------|------|
| `status` | string (enum) | 시스템 상태 값 | `"ok"` |
| `uptime_seconds` | number (int ≥ 0) | 프로세스 기동 후 경과 초 | `137` |
| `version` | string | 애플리케이션 버전 (semver) | `"1.0.0"` |
| `timestamp` | string (ISO-8601, UTC) | 응답 생성 시각 | `"2026-05-30T12:34:56.000Z"` |

### 1.2 상태 값 레지스트리 (Status Values)

> 전역 규칙 `00_STATUS_VALUE_REGISTRY.md`와 일관되게 소문자 enum 사용.

| status 값 | 의미 | HTTP 코드 | 페이지 표시 |
|-----------|------|-----------|-------------|
| `ok` | 시스템 정상 가동 | 200 | 🟢 녹색 "정상" |
| `degraded` | 부분 저하 (선택, 향후 확장) | 200 | 🟡 황색 "주의" |
| `down` | 헬스 응답 실패/예외 | 503 | 🔴 적색 "비정상" |

> MVP 범위에서는 `ok`만 반환한다. `degraded`/`down`은 향후 확장용으로 예약하며, 클라이언트는 미지의 상태 값을 비정상(🔴)으로 처리한다.

### 1.3 런타임 상태 소스

| 값 | 계산 방식 |
|----|-----------|
| `uptime_seconds` | `floor((now - process_start_time) / 1000)` |
| `version` | 빌드 시점 주입 값 (환경변수 `APP_VERSION` 또는 `package.json` version) |
| `timestamp` | 요청 처리 시점의 UTC 현재 시각 (ISO-8601) |

---

## 2. API 엔드포인트 (API Endpoints)

### 2.1 GET /api/health

| 항목 | 내용 |
|------|------|
| 메서드 | `GET` |
| 경로 | `/api/health` |
| 인증 | 없음 (공개) |
| 요청 파라미터 | 없음 (쿼리/바디/헤더 의존 없음) |
| 정상 응답 | `200 OK` + `application/json` |
| 비정상 응답 | `503 Service Unavailable` (헬스 계산 중 예외 발생 시) |
| 캐시 | `Cache-Control: no-store` (항상 실시간 상태) |

**정상 응답 본문 (200):**
```json
{
  "status": "ok",
  "uptime_seconds": 137,
  "version": "1.0.0",
  "timestamp": "2026-05-30T12:34:56.000Z"
}
```

**비정상 응답 본문 (503):**
```json
{
  "status": "down",
  "uptime_seconds": 137,
  "version": "1.0.0",
  "timestamp": "2026-05-30T12:34:56.000Z"
}
```

### 2.2 GET /status

| 항목 | 내용 |
|------|------|
| 메서드 | `GET` |
| 경로 | `/status` |
| 인증 | 없음 (공개) |
| 응답 | `200 OK` + `text/html` |
| 동작 | 페이지 로드 시 `/api/health` 호출 → status/uptime/version/timestamp 표시 |
| 반응형 | 모바일 폭(예: 375px)에서 레이아웃이 깨지지 않아야 함 |

**표시 요소:**
- 상태 배지: `status` 값에 따라 🟢/🟡/🔴 색상 표시
- `uptime_seconds` 카운터 (선택: 가독형 변환 예 "2분 17초")
- `version` 텍스트
- `timestamp` 텍스트 (마지막 확인 시각)
- API 호출 실패 시: 🔴 "비정상" + 에러 메시지 표시

---

## 3. 비즈니스 로직 (Business Logic)

### 3.1 헬스 체크 응답 생성 (GET /api/health)
1. 요청 수신 (입력 파라미터 없음)
2. `uptime_seconds` 계산 = `floor((now - process_start_time)/1000)`
3. `version` 조회 (환경변수/패키지 버전)
4. `timestamp` = 현재 UTC 시각 (ISO-8601)
5. `status = "ok"` 설정
6. 위 단계 중 예외 발생 시 → `status = "down"`, HTTP 503
7. `Cache-Control: no-store`로 JSON 응답 반환

### 3.2 상태 페이지 렌더링 (GET /status)
1. 페이지 로드
2. `GET /api/health` 비동기 호출
3. 응답 수신 시:
   - `status` 값 → 배지 색상 매핑 (`ok`→🟢, `degraded`→🟡, 그 외/실패→🔴)
   - `uptime_seconds`, `version`, `timestamp` 렌더링
4. 호출 실패(네트워크/타임아웃/비200) 시 → 🔴 "비정상" 표시 + 에러 사유 노출
5. (선택) 일정 주기 폴링으로 자동 갱신

### 3.3 불변 규칙 (Invariants)
- `/api/health`는 **부작용이 없어야 한다** (읽기 전용, 상태 변경 금지)
- 응답은 항상 4개 필드(`status`, `uptime_seconds`, `version`, `timestamp`)를 포함한다
- `uptime_seconds`는 단조 증가한다 (프로세스 재시작 시 0으로 리셋)

---

## 4. 보안 (Security)

### 4.1 절대 금지 (Absolute Prohibitions)
- **민감 정보 노출 금지**: DB 자격증명, 내부 호스트/경로, 환경변수 원문, 스택 트레이스를 응답에 포함 금지
- **내부 진단 상세 노출 금지**: 공개 헬스 엔드포인트는 정상/비정상 수준만 노출하며, 내부 의존성 상세(연결 문자열 등)는 제외
- **상태 변경 금지**: 헬스 엔드포인트는 어떤 데이터도 쓰지 않는다

### 4.2 공격 표면 최소화
- 입력값 없음 (GET, 파라미터 없음) → 주입(SQL/XSS/명령) 공격 표면 최소
- 인증 불필요(공개)하되, 응답 본문은 위 4개 필드로 **화이트리스트 고정** (추가 필드 누출 방지)

### 4.3 전송/헤더
- 운영 환경에서는 HTTPS 권장 (로컬/테스트 환경은 HTTP 허용)
- 응답 헤더: `Cache-Control: no-store`, `Content-Type: application/json; charset=utf-8`
- (선택) 헬스 엔드포인트 레이트 리밋: 과도한 폴링 방어 (예: IP당 분당 60회)

### 4.4 에러 메시지
- 클라이언트로 전달되는 에러는 일반화된 메시지만 사용 ("Service unavailable"), 내부 예외 원문 미노출

---

## 5. 테스트 (Test)

### 5.1 단위 테스트
- ✅ `uptime_seconds`가 0 이상의 정수로 계산됨
- ✅ `timestamp`가 유효한 ISO-8601 (UTC) 형식
- ✅ `version`이 비어있지 않은 문자열
- ✅ 정상 경로에서 `status === "ok"`

### 5.2 통합 테스트 (Task 7 — Integration Validator 대상)
- ✅ 서버 포트가 LISTEN 상태 (증거: 포트 점유 확인)
- ✅ `curl -i http://<host>:<port>/api/health` → HTTP `200` 반환 (증거: 응답 헤더+본문 로그)
- ✅ 응답 본문이 4개 필드를 모두 포함하고 `status="ok"`
- ✅ 응답 Content-Type이 `application/json`

### 5.3 E2E 테스트 (Task 8 — E2E Tester 대상)
- ✅ `/status` 페이지가 실제 브라우저에서 로드됨 (증거: 스냅샷/스크린샷)
- ✅ 상태 배지가 🟢(정상)으로 표시됨
- ✅ uptime/version/timestamp가 화면에 렌더링됨
- ✅ 모바일 폭 375px에서 레이아웃이 깨지지 않음 (증거: 반응형 스크린샷)

### 5.4 증거 산출물 (필수)
- health check 응답: HTTP 상태 코드 + JSON 본문 로그
- 실행 로그: 서버 기동 로그 + 요청 처리 로그 + 검증 명령 출력
- 결과: 통과/실패 판정 + 스크린샷/스냅샷

---

## 6. 성능 (Performance)

| 지표 | 목표 |
|------|------|
| `/api/health` 응답 시간 | p95 < 50ms (인메모리 계산, I/O 없음) |
| `/status` 페이지 초기 로드 | < 1s (로컬/테스트 기준) |
| 동시성 | 단일 인스턴스, 낮은 폴링 트래픽 기준 충족 |

- 헬스 엔드포인트는 DB/외부 호출이 없으므로 거의 상수 시간으로 응답해야 한다.
- 폴링 주기는 클라이언트에서 과도하지 않게 설정 (권장: 5~30초).

---

## 7. 배포 (Deployment)

| 항목 | 내용 |
|------|------|
| 환경 | LOCAL / TEST (즉시 배포 가능) |
| 배포 절차 | `coolhan-release-orchestrator` 또는 Task 6 DevOps/배포자를 통한 배포 |
| 환경변수 | `APP_VERSION` (버전 주입), `PORT` (리슨 포트) |
| 헬스 기반 배포 게이트 | 배포 후 `/api/health`가 200/`ok`를 반환해야 배포 성공으로 간주 |
| 롤백 트리거 | 배포 후 헬스 200/`ok` 미충족 시 롤백 |

- `/api/health`는 로드밸런서/오케스트레이터의 **liveness/readiness 프로브**로 사용 가능하다.

---

## 8. 모니터링 (Monitoring)

| 항목 | 내용 |
|------|------|
| Liveness 프로브 | `GET /api/health` (200/`ok` 기대) |
| 로그 | 서버 기동 시각, 각 헬스 요청의 응답 코드/처리시간 기록 |
| 알림 (선택) | 연속 N회 비200 응답 시 운영자 알림 |
| 메트릭 (선택) | 헬스 요청 수, 평균/95p 응답 시간, 비정상 비율 |

- 민감 정보가 로그에 포함되지 않도록 한다 (자격증명/토큰 금지).

---

## 9. 에러 처리 (Error Handling)

| 상황 | 처리 | 응답 |
|------|------|------|
| 정상 | status=ok | `200` + JSON |
| 헬스 계산 중 예외 | status=down, 일반화 메시지 | `503` + JSON |
| `/status`에서 API 호출 실패 | 🔴 "비정상" 표시 + 에러 사유 노출 | 페이지는 `200`(HTML) 유지 |
| 알 수 없는 status 값 | 클라이언트가 비정상(🔴)으로 처리 | — |
| 잘못된 경로 | 표준 404 | `404` |

- 서버 에러는 내부 원문 대신 일반화 메시지로 응답하고, 상세는 서버 로그에만 기록한다.

---

## 10. 통합 포인트 (Integration Points)

### 10.1 내부
- **Status Page (`/status`) → Health API (`/api/health`)**: 페이지가 API를 호출하는 단일 의존
- **Task 6 DevOps/배포자**: 배포 게이트로 헬스 엔드포인트 사용
- **Task 7 Integration Validator**: 포트/`/api/health` 실제 curl 검증 대상
- **Task 8 E2E Tester**: `/status` 페이지 실제 로드/반응형 검증 대상

### 10.2 외부
- **없음** (외부 서비스/DB/PG 의존 없음 — 의도된 설계)

### 10.3 의존성 방향
```
[Browser] → GET /status (HTML) → fetch GET /api/health (JSON) → [App Server]
```
- 순환 참조 없음. 다른 도메인 모듈에 의존하지 않으며, 다른 모듈도 본 모듈에 의존하지 않는다(인프라 독립).

---

## 11. 수락 기준 (Acceptance Criteria)

> 출처: `_workspace/01_requirements.md`의 `acceptance_criteria_seed`를 검증 가능 기준으로 확정.

### 11.1 기능 수락 기준
- ✅ **AC-1**: `GET /api/health` 호출 시 HTTP `200`과 `status="ok"` 반환 — *health check 증거*
- ✅ **AC-2**: 응답이 `status`, `uptime_seconds`, `version`, `timestamp` 4개 필드를 모두 포함
- ✅ **AC-3**: `timestamp`가 ISO-8601 형식, `version`이 응답에 포함됨 (증거 추적용)
- ✅ **AC-4**: 서버 기동/요청 처리 시 실행 로그가 기록됨 — *실행 로그 증거*
- ✅ **AC-5**: `/status` 페이지가 헬스 응답을 정상 렌더링하고 모바일 폭(375px)에서 깨지지 않음 — *결과 증거*

### 11.2 Phase D 검증 수락 기준
- ✅ **AC-6 (Task 7)**: 포트 LISTEN 확인 + `/api/health` 실제 `curl` 200 응답 확인 (증거 첨부)
- ✅ **AC-7 (Task 8)**: `/status` 페이지 실제 로드 + 반응형 확인 (스크린샷/스냅샷 증거 첨부)

### 11.3 비기능 수락 기준
- ✅ **AC-8**: 응답에 민감 정보(자격증명/내부 경로/스택 트레이스) 미포함
- ✅ **AC-9**: 헬스 엔드포인트가 부작용 없는 읽기 전용으로 동작

---

## 부록 A. Developer(Task 3) 인계 노트
- 영속 저장소 불필요 — 인메모리 계산만 구현
- 응답 필드는 화이트리스트 고정 (4개 필드)
- `/status`는 단일 페이지로 충분, 프레임워크 자유(서버 렌더 또는 정적+fetch 모두 허용)
- 증거 산출을 위해 서버 기동/요청 로그를 표준 출력에 남길 것
