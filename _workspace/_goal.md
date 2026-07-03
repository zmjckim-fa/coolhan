# Goal (immutable)

run_id: 20260626-security-p2
feature: Security Hardening P2 — automated gates: secret scanning + dependency/supply-chain audit
purpose_fit: |
  P1 gave review capability; P2 adds automated, always-on gates so secrets and vulnerable
  dependencies are caught before commit/deploy — for every CoolHan user. Motivated by a real
  event: GitHub push-protection blocked a secret this session because the local pre-commit
  guard only matched .env + a few patterns. P2 closes that gap with a real scanner + a
  stack-agnostic dependency audit, wired into CI.
scope_boundary (P0):
  - P2 ONLY: secret scanner (scripts) + dependency-audit doc/agent guidance + CI wiring + tests.
  - Stack-agnostic (npm/pip/go/… ); no npm assumption. Read-only scanners; no auto-fix of user code.
  - Honesty: a passing scan reduces known risk, does not prove "no secrets / no vulns".
definition_of_done:
  - scripts/secret-scan.js: entropy + common token regexes (AWS/GitHub/Stripe/JWT/private-key),
    scans staged or a path, exit 1 on hit, allowlist for test fixtures/examples
  - CI: harness-check.yml (or new) runs secret-scan + dependency audit (stack-detected)
  - docs: 00_SECURITY_STANDARDS.md P2 section (secret-scan + dep-audit gates) + security-reviewer note
  - tests: src/__tests__/secret-scan.test.js (detects planted secret, ignores clean + allowlisted)
  - full jest green; adversarial: planted secret → exit 1, clean → exit 0; commit + push
