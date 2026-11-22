# Goal (immutable for this run)

run_id: run-mwr3ok5t (2026-11-22)
feature: Kit end-to-end proof on a real small site (track42) and module library separation plus absorption of features that grew in project folders
operator_command: |
  «이어서 작업을 해서 목표를 성공시켜라»
  «모듈들을 더 잘 분리해놔야하고 또한 각 다른 폴더에서 고도화되는 기능들을 흡수해야한다. 문서를 만드는 기능, 회원가입,
  각 api 연동, HS code 검색엔진, 쇼핑몰 기능, 관리자 기능, 마이페이지 기능,. 고도화된 디자인 스타일 들 모듈화될것이
  아주 많다. 글로벌 우편번호 등»
purpose_fit: |
  A plan and a finished result with no further command needs a kit that survives a real site, and a module library
  that is separable and keeps up with what the sites build.
scope_boundary (P0):
  - IN: the demo site under _harness_test/track42-kit-e2e (planning, implementation, verification); harness fixes for
    kit defects met there; read-only survey of the module library and the project folders; a separation and
    absorption plan; a harness mechanism that detects modules whose source has moved on and drives absorption;
    tests; track reports; release.
  - OUT: editing any other project folder; writing to the module library outside a separate branch of it; opening
    secret files; deploying anything; server settings.
definition_of_done:
  - the demo site passes its own fixed check list with 통과 n · 실패 0 · 확인 안 함 0 (manual rows named), ledger 완료
  - every kit defect met is fixed in the harness with a test, or recorded as open with its number
  - the separation and absorption plan exists with evidence, and the detection mechanism runs on the real library
  - full jest green, docs/CHECKS.md in full, adversarial track 0 false +/-, released, ledger and backlog 완료
