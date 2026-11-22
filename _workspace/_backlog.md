# Backlog: run_id run-mwr3ok5t (킷 실증 + 모듈 분리와 흡수)

목표: `_workspace/_goal.md`. 원장: `docs/PROGRESS.md` 작업 30~33.

| # | Unit | Files | Verification | Status |
|---|------|-------|--------------|--------|
| U1 | 킷 실증: 사이트 기획과 구현 U-01~U-10 + 본체 결함 7건 수정 | `_harness_test/track42-kit-e2e/`, `scripts/`, `knowledge_base/project-kit/` | 사이트 node --test · jest 해당 시험 | ✅ done (사이트 단위 12/15; jest plan-doc-check 18/18, project-kit 20/20, parallel-plan 9/9, completion-check 9/9) |
| U2 | 킷 실증 마무리: 사이트 U-11~U-13, 브라우저 확인, 사이트 고정 검증, 트랙 보고서 | `_harness_test/track42-kit-e2e/` | 사이트 checks-run · completion-check | ✅ done (사이트 단위 13/13; node --test 191/191; 사이트 고정 검증 통과 10 · 실패 0 · 사람 확인 28행은 사이트의 열린 항목) |
| U3 | 모듈 저장소 분리 점검과 앞선 기능 조사, 통합안 | `.coolhan-private/module-harvest/`, `docs/` | 보고서 6건 · 대기열 | ✅ done (조사 보고 6/6; 대기열 26줄) |
| U4 | 모듈 흡수 장치 (원천이 앞선 모듈 검사 + 절차) | `scripts/`, `src/__tests__/`, agents, SKILL | jest · 실제 저장소 실행 · 적대 검증 | ✅ done (jest module-standard 45/45; track43 15/15; 실제 저장소 변환 68/68, 모듈 시험 332 통과) |
| U5 | 모듈 추출 1차: 관리자, 운송사, 회원, 우편번호 | 모듈 저장소 `modules/` | module-check · 모듈 시험 · 빈 폴더 설치 | ✅ done (module-check 13/13 PASS; 모듈 시험 416/416; 빈 폴더 설치 13/13; 저장소 커밋 6건) |
| U6 | 릴리스 v2.12.0 | 릴리스 문서 | jest 전체 · checks-run · CI | ✅ done (jest 421/421; checks-run 13/13; 커밋 a67dd8a 태그 v2.12.0; CI 3/3 success, releases/latest = v2.12.0) |
| U7 | 모듈 추출 2차: 관리자 틀·알림·계정·접근 기록, 배송 추적·픽업 예약·운송사 충전 원장 | 모듈 저장소 `modules/` | module-check · 모듈 시험 · 빈 폴더 설치 | ✅ done (입고 검사 7/7 PASS; 모듈 시험 187/187; 저장소 커밋 3건) |
| U8 | 모듈 입고 검사 한 명령 + 릴리스 v2.12.1 | `scripts/module-admit.js`, `src/__tests__/module-admit.test.js`, `_harness_test/track44-module-admit/`, 문서 | jest · track44 · checks-run · CI | ✅ done (jest 430/430; track44 9/9; checks-run 13/13; 커밋 419816b 태그 v2.12.1; CI 4/4 success) |
| U9 | 모듈 추출 3차: 디자인 체계, 관리자 목록·상세 틀, 정산 | 모듈 저장소 `modules/` | module-admit | ✅ done (입고 검사 10/10 PASS; 모듈 시험 129/129; 저장소 커밋 2건) |
| U10 | 모듈 추출 4차: 구매대행 | 모듈 저장소 `modules/` | module-admit | ✅ done (입고 검사 8/8 PASS; 모듈 시험 174/174; 저장소 커밋 fb4fdca) |
| U11 | 모듈 실증: 관리자 모듈들을 빈 프로젝트에 설치해 브라우저에서 연다 | `_harness_test/track45-module-demo/` | module-admit · 브라우저 확인 · 화면 시험 | ✅ done (설치 10/10; 타입 검사·빌드 종료 코드 0; 브라우저 2개 폭 콘솔 오류 0건; 결함 3/3 수정 뒤 다시 잼; 갱신 경로 status 1 → update 0 → status 0) |
| U12 | 모듈 추출 5차: 회원 2차, 연동 보호와 연결, 문서 양식, HS 검색 | 모듈 저장소 `modules/` | module-admit | ✅ done (입고 검사 10/10 PASS; 모듈 시험 313/313; 저장소 형식 검사 114/114; 저장소 커밋 3건) |
| U13 | 모듈 찾기 옵션 + 릴리스 v2.12.2 | `scripts/modules.js`, `src/__tests__/module-standard.test.js`, `_harness_test/track43-module-standard/`, 문서 | jest · track43 · checks-run · CI | ✅ done (jest 431/431; track43 16/16; checks-run 13/13; 커밋 4ca7131 태그 v2.12.2; CI 4/4 success) |
| U14 | 모듈 추출 6차: 쇼핑, 마이페이지 틀, 회원 화면 | 모듈 저장소 `modules/`, 실증 프로젝트 | module-admit · 브라우저 확인 | ✅ done (입고 검사 5/5 PASS; 모듈 시험 114/114; 회원 화면 브라우저 확인; 저장소 커밋 3건) |
| U15 | 모듈 다음 판: 연동 보호 통일, 회원 계정 진입점, 추적 합치기, 목록과 상세 틀 보강, 마이페이지 틀 브라우저 확인 | 모듈 저장소 `modules/`, 실증 프로젝트 | module-admit · 브라우저 확인 | ✅ done (입고 검사 13/13, 4/4 PASS; 실증 프로젝트 타입 검사·빌드 종료 코드 0; 저장소 커밋 2건) |
| U16 | 공개 진입점 규칙 + 릴리스 v2.12.3 | `scripts/module-check.js`, `src/__tests__/module-standard.test.js`, `_harness_test/track43-module-standard/`, 문서 | jest · track43 · checks-run · CI | ✅ done (jest 433/433; track43 17/17; checks-run 13/13; 커밋 610ab8e 태그 v2.12.3; CI 4/4 success) |
| U17 | 모듈 추출 7차: 디자인 체계들, 우체국과 추적 어댑터, 자동 환불 + 입고 검사의 의존 모듈 옵션 | 모듈 저장소 `modules/`, `scripts/module-admit.js` | module-admit · jest | ✅ done (입고 검사 8/8 PASS; 저장소 127/127 PASS; jest 434/434; track44 10/10; 커밋 415ccb3 태그 v2.12.4; CI 4/4 success) |
| U18 | 디자인 모듈 브라우저 확인, 다음 판 후보, 남은 폴더 조사, 입고 검사의 프로젝트 단계 | 실증 프로젝트, 모듈 저장소 `modules/`, `.coolhan-private/module-harvest/`, `scripts/module-admit.js` | 브라우저 확인 · module-admit · 조사 보고서 · jest | ✅ done (갤러리 6/6; 입고 검사 10/10, 2/2; 조사 보고서 1건; jest 435/435; track44 11/11; 커밋 bcbdf90 태그 v2.12.5; CI 4/4 success) |
| U19 | 모듈 추출 8차: 결제, 속도 제한, 보안 머리글, 비밀값 보관 | 모듈 저장소 `modules/` | module-admit --with-dependents --consumer | ✅ done (입고 검사 7/7 PASS; 모듈 시험 423/423; 저장소 형식 검사 133/133; 저장소 커밋 3건) |
| U20 | 직전 보고에서 재지 못한 것을 잰다: 전체 입고 검사, PostgreSQL 실행, 알림 결함 직접 확인, 키보드 순서 | 모듈 저장소 `modules/`, 실증 프로젝트, `.coolhan-private/module-harvest/` | module-admit --all · PostgreSQL 실행 · 브라우저 | ✅ done (입고 검사 133/133; PostgreSQL 스키마 39/39, 추가전용 77/77; 알림 7건 직접 읽음; 키보드 확인과 결함 1건 수정; 저장소 커밋 2건) |
| U21 | 추가 모듈 20개 (운영자 지시 2026-11-22: 지금 있는 것 외에 20개를 선정해 순서대로) | 모듈 저장소 `modules/` | module-admit --with-dependents --consumer | ✅ done (입고 검사 20/20 PASS; 모듈 시험 968/968; 저장소 전체 153/153 PASS; 저장소 커밋 4건) |
| U22 | PostgreSQL 검사 스크립트와 형식 규칙 + 릴리스 v2.12.6 | `scripts/module-db-check.js`, `scripts/module-check.js`, `src/__tests__/`, `_harness_test/track46-module-db/`, 문서 | jest · track46 · checks-run · CI | ⬜ todo |
