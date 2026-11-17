# Goal (immutable)

run_id: {{date}}-{{slug}}
feature: {{intent}}
operator_command: |
  {{intent}}
purpose_fit: |
  쿨한 빌더의 목적: 사람의 추가 명령 없이 기획서를 제대로 만들고, 그 기획서에 맞는 결과물을 쿨한 에이전트로 끝까지 완성한다.
scope_boundary (P0):
  - IN: 이 목표를 이루는 기획서(`docs/plan/`), 구현, 검증, 배포 허가 범위 안의 배포.
  - OUT: 다른 사이트와 서버, 서버 설정, 비밀값 출력, 목표에 없는 기능. 더 나은 생각은 `_workspace/_proposals.md`에 적는다.
definition_of_done:
  - 기획서가 `plan-doc-check`(교훈 대응표, 모듈 계획표 포함)를 통과한다
  - 백로그 단위 전부가 완료이고 검증이 붙어 있다 (`completion-check` 종료 코드 0)
  - `docs/CHECKS.md` 전체: 통과 n · 실패 0 · 확인 안 함 0 (확인 안 함이 남으면 이유를 `docs/BLOCKED.md`에 적는다)
  - 진행 원장과 인수인계가 최신이다
