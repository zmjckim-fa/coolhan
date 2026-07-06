# Backlog — run_id 20260706-g5-ledger

| # | Unit | Files | Verification | Status |
|---|------|-------|--------------|--------|
| U1 | Ledger script | scripts/ledger.js | node --check + append writes JSONL line, query filters by gate/status/unit, lessons() surfaces recurring (gate,reason) >=minCount, CLI works, --json | ✅ done |
| U2 | Tests | src/__tests__/ledger.test.js | jest ledger pass | ✅ done (11/11) |
| U3 | Wiring | agents/(validator, security-reviewer, plan-reviewer).md | append outcome after gate; plan-reviewer/security-reviewer query lessons() before gate, surface as advisory warning | ✅ done |
| U4 | Docs | CLAUDE.md (team + history) | history entry | ✅ done |
| U5 | Adversarial verify | _harness_test/track17-ledger/ | repeated (gate,reason)>=2 -> surfaced, single occurrence -> not surfaced, query filters correct, append-only (no mutation), 0 FP/FN | ✅ done (5 cases, 0 FP/FN, verified directly) |

next: (backlog empty — G5 complete)
