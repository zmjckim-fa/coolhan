# Goal (immutable for this run)

run_id: run-mwko7ihj (2026-11-17)
feature: Device-side cause of D-13 (a hook child process that never starts) and the harness response
operator_command: |
  «이어서 진행하라»
purpose_fit: |
  The non-stop loop rests on hook processes. A hook that cannot start blocks nothing, and a test that sees no
  output says nothing about the code. The ledger named the device-side cause of D-13 as a next unit.
scope_boundary (P0):
  - IN: measuring the cause on this machine (read-only system facts, launches inside a job object limited to
    this run's own process tree); a headroom probe; recognising a child that did not start; reporting machine
    state with a non-pass; the supervisor waiting for headroom; field lesson; tests; adversarial track; release.
  - OUT: stopping or changing any process that is not this run's own; exhausting the machine's memory;
    system settings; user-level settings or hooks; any other project folder; deploying anything.
definition_of_done:
  - the cause is stated with its evidence kind (observed, measured) and reproduced in isolation
  - every reproduced «did not start» is recognised (0 unrecognised) and no script that ran is misclassified
  - full jest green, docs/CHECKS.md 통과 n · 실패 0 · 확인 안 함 0, adversarial track 0 false +/-
  - released (tag, CI green), ledger and backlog 완료 with evidence
