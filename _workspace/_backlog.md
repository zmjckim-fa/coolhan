# Backlog: run_id run-mwr3ok5t (킷 실증 + 모듈 분리와 흡수)

목표: `_workspace/_goal.md`. 원장: `docs/PROGRESS.md` 작업 30~33.

| # | Unit | Files | Verification | Status |
|---|------|-------|--------------|--------|
| U1 | 킷 실증: 사이트 기획과 구현 U-01~U-10 + 본체 결함 7건 수정 | `_harness_test/track42-kit-e2e/`, `scripts/`, `knowledge_base/project-kit/` | 사이트 node --test · jest 해당 시험 | ✅ done (사이트 단위 12/15; jest plan-doc-check 18/18, project-kit 20/20, parallel-plan 9/9, completion-check 9/9) |
| U2 | 킷 실증 마무리: 사이트 U-11~U-13, 브라우저 확인, 사이트 고정 검증, 트랙 보고서 | `_harness_test/track42-kit-e2e/` | 사이트 checks-run · completion-check | ✅ done (사이트 단위 13/13; node --test 191/191; 사이트 고정 검증 통과 10 · 실패 0 · 사람 확인 28행은 사이트의 열린 항목) |
| U3 | 모듈 저장소 분리 점검과 앞선 기능 조사, 통합안 | `.coolhan-private/module-harvest/`, `docs/` | 보고서 6건 · 대기열 | ✅ done (조사 보고 6/6; 대기열 26줄) |
| U4 | 모듈 흡수 장치 (원천이 앞선 모듈 검사 + 절차) | `scripts/`, `src/__tests__/`, agents, SKILL | jest · 실제 저장소 실행 · 적대 검증 | ✅ done (jest module-standard 45/45; track43 15/15; 실제 저장소 변환 68/68, 모듈 시험 332 통과) |
| U5 | 모듈 추출 1차: 관리자, 운송사, 회원, 우편번호 | 모듈 저장소 `modules/` | module-check · 모듈 시험 · 빈 폴더 설치 | ⬜ todo |
| U6 | 릴리스 v2.12.0 | 릴리스 문서 | jest 전체 · checks-run · CI | ✅ done (jest 421/421; checks-run 13/13; 커밋 a67dd8a 태그 v2.12.0; CI 3/3 success, releases/latest = v2.12.0) |
