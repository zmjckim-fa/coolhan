# Backlog: run_id run-mwr3ok5t (킷 실증 + 모듈 분리와 흡수)

목표: `_workspace/_goal.md`. 원장: `docs/PROGRESS.md` 작업 30~33.

| # | Unit | Files | Verification | Status |
|---|------|-------|--------------|--------|
| U1 | 킷 실증: 사이트 기획과 구현 U-01~U-10 + 본체 결함 7건 수정 | `_harness_test/track42-kit-e2e/`, `scripts/`, `knowledge_base/project-kit/` | 사이트 node --test · jest 해당 시험 | ✅ done (사이트 단위 12/15; jest plan-doc-check 18/18, project-kit 20/20, parallel-plan 9/9, completion-check 9/9) |
| U2 | 킷 실증 마무리: 사이트 U-11~U-13, 브라우저 확인, 사이트 고정 검증, 트랙 보고서 | `_harness_test/track42-kit-e2e/` | 사이트 checks-run · completion-check | ⬜ todo |
| U3 | 모듈 저장소 분리 점검과 앞선 기능 조사, 통합안 | `.coolhan-private/module-harvest/`, `docs/` | 보고서 4건 · 통합안 | ⬜ todo |
| U4 | 모듈 흡수 장치 (원천이 앞선 모듈 검사 + 절차) | `scripts/`, `src/__tests__/`, agents, SKILL | jest · 실제 저장소 실행 · 적대 검증 | ⬜ todo |
| U5 | 릴리스 | 릴리스 문서 | jest 전체 · checks-run · CI | ⬜ todo |
