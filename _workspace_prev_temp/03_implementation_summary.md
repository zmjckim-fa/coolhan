# Task 3: 규격 기반 코드 구현 — Health Check & Status

> **출처 스펙:** `knowledge_base/00_health_check_system.md` (Task 2 — Spec Writer)
> **작성:** Task 3 — Developer
> **스택:** Node.js + Express (빌드 단계 없음, 직접 실행/검증 가능)
> **상태:** PASS ✅ — 8개 테스트 통과 + 라이브 curl 증거 확보

---

## 1. 생성 파일

| 파일 | 책임 | 스펙 매핑 |
|------|------|-----------|
| `src/health.js` | 헬스 상태 계산 코어 (순수 함수, 부작용 없음) | §1.1, §1.3, §3.1, §3.3 |
| `src/routes/health.js` | `GET /api/health` 라우트 (JSON, no-store, 200/503) | §2.1, §3.1, §4.3 |
| `src/server.js` | Express 앱 — 라우트 + `/status` + 404 + 기동 로그 | §0.1, §2.2, §8, §9 |
| `src/pages/status.html` | 상태 페이지 (반응형 375→768→1200, fetch + 5s 폴링) | §2.2, §3.2 |
| `__tests__/health.test.js` | 단위 + 통합 테스트 (8개) | §5.1, §5.2 |
| `_workspace/03_code/package.json` | 실행 매니페스트 (start / test 스크립트) | 부록 A |

> 최종 산출물 사본: `_workspace/03_code/` (Task 7/8 검증 입력).

---

## 2. 핵심 구현 결정

- **외부 의존성 0** — DB/Redis 미접근. uptime은 `process.uptime()`, version은 `APP_VERSION` 환경변수 → `package.json` version 폴백.
- **응답 화이트리스트 고정** — 정확히 4개 필드(`status`, `uptime_seconds`, `version`, `timestamp`)만 반환 (§4.2 누출 방지). 테스트로 키 집합 검증.
- **timestamp** — `new Date().toISOString()` → ISO-8601 UTC (`Z`).
- **보안** — `x-powered-by` 비활성화, 스택 트레이스/내부 경로/자격증명 미노출 (§4.1). 예외 시 일반화 `down`/503 (§4.4).
- **반응형** — mobile-first CSS, 375px 기준 단일 컬럼 카드, 768/1200px 브레이크포인트.
- **증거 로그** — 기동 로그 + 요청별 `[health] ... -> 200 status=ok` 로그를 stdout에 기록 (§8, 부록 A).

---

## 3. 검증 결과 (증거)

### 3.1 테스트 — `node --test` 8/8 통과
```
✔ unit: uptime_seconds is an integer >= 0
✔ unit: timestamp is valid ISO-8601 UTC
✔ unit: version is a non-empty string
✔ unit: happy path returns status === "ok" and HTTP 200
✔ unit: response body is whitelist-fixed to exactly 4 fields
✔ integration: GET /api/health -> 200 application/json with ok status
✔ integration: GET /status serves HTML page
✔ integration: unknown path returns 404
ℹ tests 8  ℹ pass 8  ℹ fail 0
```

### 3.2 문법/보안
- `node --check` — 4개 파일 전부 OK
- 시크릿/주입 sink 스캔 — 매치 없음 (password/secret/token/credential, 비허용 env 접근)

### 3.3 라이브 curl 증거 (`_workspace/03_code/server.boot.log`)
```
[server] ... listening on http://localhost:4187 (status: /status, health: /api/health)

HTTP/1.1 200 OK
Cache-Control: no-store
Content-Type: application/json; charset=utf-8
{"status":"ok","uptime_seconds":1,"version":"1.0.4","timestamp":"2026-05-29T23:36:04.757Z"}

GET /status  -> 200 text/html
GET /nope    -> 404
```

---

## 4. 수락 기준 충족

| AC | 내용 | 상태 |
|----|------|------|
| AC-1 | `/api/health` → 200 + `status="ok"` | ✅ (curl 증거) |
| AC-2 | 4개 필드 모두 포함 | ✅ (테스트) |
| AC-3 | timestamp ISO-8601, version 포함 | ✅ |
| AC-4 | 기동/요청 실행 로그 | ✅ (boot.log) |
| AC-5 | `/status` 렌더 + 375px 반응형 | ✅ (HTML 서빙, Task 8 스크린샷 대상) |
| AC-6 (Task 7) | 포트 LISTEN + curl 200 | ✅ 입력 준비됨 |
| AC-7 (Task 8) | `/status` 로드 + 반응형 | 🔜 입력 준비됨 (Task 8) |
| AC-8 | 민감정보 미포함 | ✅ (보안 스캔) |
| AC-9 | 부작용 없는 읽기 전용 | ✅ (순수 함수) |

---

## 5. 실행 방법

```bash
# 의존성 (express)
npm install express@^4

# 서버 기동
APP_VERSION=1.0.4 PORT=3000 node src/server.js
#   → http://localhost:3000/status  (상태 페이지)
#   → http://localhost:3000/api/health  (JSON)

# 테스트
node --test __tests__/health.test.js
```

**상태:** PASS ✅ — Task 4(Validator) 검증 대기.
