# Backlog — run_id 20260707-g8-context-completion

| # | Unit | Files | Verification | Status |
|---|------|-------|--------------|--------|
| U1 | Context-check script | scripts/context-check.js | node --check + complete digest→exit0, missing source→exit1(named), stale run_id→exit1, --json | ✅ done |
| U2 | Completion-check script | scripts/completion-check.js | node --check + all done+validated→exit0, any todo/in-progress/unvalidated→exit1(remaining named), --json | ✅ done |
| U3 | Tests | src/__tests__/context-check.test.js + completion-check.test.js | jest both pass | ✅ done (16/16) |
| U4 | SKILL + agent wiring | SKILL.md + agents/(intent-analyzer, self-auditor) | Phase 0 ingestion gate + baton≠done + engine-loop completion gate present | ✅ done |
| U5 | Docs | CLAUDE.md | history entry present | ✅ done |
| U6 | Adversarial verify | _harness_test/track20-context-completion/ | 6 cases, 0 FP/FN, verified directly | ✅ done |

next: (backlog empty — G8 complete; completion-check on this backlog → PASS)
