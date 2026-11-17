# Backlog: bakery-hours

목표: `_workspace/_goal.md`. 원장: `docs/PROGRESS.md`. 단위의 정의는 `docs/plan/05_소스.md` 11절과 `docs/plan/plan.json`이다.

| # | Unit | Files | Verification | Status |
|---|------|-------|--------------|--------|
| P1 | 기획서: 네 산출물(DB, 화면 설계, 디자인, 소스) + 모듈 계획 + 실패 방지 대응표 | docs/plan/ | plan-doc-check | ✅ done (plan-doc-check PASS; 스키마 42/42; 대비 51/51) |
| P2 | 기획 게이트 통과, 통합 검토, 백로그 분해 | docs/plan/, _workspace/_backlog.md | plan-doc-check, plan-check | ✅ done (plan-check PASS 13 units; 검토 P0 3건 수정 뒤 게이트 4/4) |
| U-01 | 환경 값, DB 열기 (R-01, R-04) | `package.json`, `src/package.json`, `test/package.json`, `.gitattributes`, `src/environment.js`, `src/database.js`, `test/startup.test.js`, `.gitignore` | `node --test test/startup.test.js` | ✅ done (node --test 15/15, 건너뜀 0) |
| U-02 | 입력 규칙, 분류 목록, 영업 상태 규칙, 오류 표 (R-01, R-04, R-05, R-06) | `web/package.json`, `web/input-rules.js`, `src/menu-category.js`, `src/shop-status.js`, `src/error-catalog.js`, `test/input-rules.test.js`, `test/shop-status.test.js` | `node --test test/input-rules.test.js test/shop-status.test.js` | ✅ done (node --test 26/26, 건너뜀 0) |
| U-03 | 화면 바탕 (R-01, R-02, R-03, R-04, R-05, R-06) | `web/screen.css`, `web/text-dictionary.js`, `web/api-client.js`, `web/screen-feedback.js`, `test/screen-files.test.js`, `test/screen-contract.js` | `node --test test/screen-files.test.js` | ✅ done (node --test 8/8, 건너뜀 0) |
| U-04 | HTTP 뼈대와 정적 파일 (R-01, R-04) | `src/server.js`, `src/route-table.js`, `src/json-exchange.js`, `src/security-headers.js`, `src/static-file.js`, `test/temporary-server.js`, `test/request-hardening.test.js` | `node --test test/request-hardening.test.js` | ✅ done (node --test 29/29, 건너뜀 0) |
| U-05 | A-01 방문자 화면 자료 (R-01, R-02, R-03) | `src/public-overview.js`, `test/public-overview.test.js`, `src/route-table.js`, `test/request-hardening.test.js` | `node --test test/public-overview.test.js test/request-hardening.test.js` | ✅ done (node --test 45/45, 건너뜀 0) |
| U-06 | A-02, A-03, A-04 로그인과 세션 (R-04) | `src/admin-login.js`, `src/admin-session.js`, `test/admin-login.test.js`, `src/route-table.js`, `src/server.js`, `test/request-hardening.test.js` | `node --test test/admin-login.test.js test/request-hardening.test.js` | ✅ done (node --test 51/51, 건너뜀 0) |
| U-07 | A-05, A-06 영업시간 (R-01, R-02, R-05) | `src/business-hours.js`, `test/business-hours.test.js`, `src/route-table.js` | `node --test test/business-hours.test.js test/request-hardening.test.js` | ✅ done (node --test 45/45, 건너뜀 0) |
| U-08 | A-07, A-08, A-09, A-10, A-11 메뉴 (R-03, R-06) | `src/menu-items.js`, `test/menu-items.test.js`, `src/route-table.js` | `node --test test/menu-items.test.js test/request-hardening.test.js` | ✅ done (node --test 60/60, 건너뜀 0) |
| U-09 | S-01 방문자 홈 화면 (R-01, R-02, R-03) | `web/home.html`, `web/home.js`, `web/home.css`, `test/home-screen.test.js` | `node --test test/home-screen.test.js test/screen-files.test.js test/public-overview.test.js` + 브라우저 확인 5행 | ⬜ todo |
| U-10 | S-02 관리자 로그인 화면과 위쪽 줄 (R-04) | `web/admin-login.html`, `web/admin-login.js`, `web/admin-login.css`, `web/admin-top-bar.js`, `test/admin-login-screen.test.js` | `node --test test/admin-login-screen.test.js test/screen-files.test.js test/admin-login.test.js` + 브라우저 확인 3행 | ⬜ todo |
| U-11 | S-03 영업시간 관리 화면 (R-05) | `web/admin-hours.html`, `web/admin-hours.js`, `web/admin-hours.css`, `test/admin-hours-screen.test.js` | `node --test test/admin-hours-screen.test.js test/screen-files.test.js test/business-hours.test.js` + 브라우저 확인 4행 | ⬜ todo |
| U-12 | S-04 메뉴 관리 화면 (R-06) | `web/admin-menu.html`, `web/admin-menu.js`, `web/admin-menu.css`, `test/admin-menu-screen.test.js` | `node --test test/admin-menu-screen.test.js test/screen-files.test.js test/menu-items.test.js` + 브라우저 확인 5행 | ⬜ todo |
| U-13 | 화면 경로 통합 확인과 고정 검증 연결 (R-01, R-02, R-03, R-04, R-05, R-06) | `test/screen-routes.test.js`, `web/not-found.html`, `web/not-found.js`, `docs/CHECKS.md` | `node --test "test/*.test.js"` + 브라우저 확인 2행 | ⬜ todo |
