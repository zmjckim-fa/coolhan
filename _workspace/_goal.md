# Goal (immutable for this run)

run_id: run-mwk1rhe9 (2026-11-17, armed by the G11 run-armer hook)
feature: Standing orders for every session (global install), kit drift check, and the oldest open defects closed
operator_command: |
  «이어서 진행하라»
  «이제 모든 세션에서 개발을 할때 쿨한을 참조하는건가? 아니면 쿨한으로 개발을 하라고 해야하는건가? 적용할 방법을
  간단하게 해야하며 모든 명령에 쿨한의 기술력과 룰이 적용되어야한다.»
purpose_fit: |
  A correct 기획서 and a matching result with no human command requires that the rules are present before the first
  command in any folder. The kit (G23) still needed one command per project and the harness command word elsewhere.
scope_boundary (P0):
  - IN: a managed block in the user-level instruction file derived from the registry (install, check, remove),
    applied on this machine at the operator's instruction; kit drift check; kit refusing the harness and the
    module library; closing D-2, D-3, D-4, D-8; tests; adversarial track; release.
  - OUT: user-level settings or hooks; copying skills or agents; editing any other project; deploying anything.
definition_of_done:
  - the global block is derived, restorable and removable; the operator's own text is never changed
  - this machine's block is installed and current (fixed check C13)
  - duplicate helpers 0 and swallowed errors 0 in the harness self-scan, baselines lowered
  - full jest green, docs/CHECKS.md 통과 n · 실패 0 · 확인 안 함 0, adversarial track 0 false +/-
  - released (tag, CI green), ledger and backlog 완료 with evidence
