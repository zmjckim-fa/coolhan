# Backlog — run_id 20260719-autopilot

| # | Unit | Files | Verification | Status |
|---|------|-------|--------------|--------|
| U1 | tasks-check script | scripts/tasks-check.js | all-verified→exit0, blocked/not-started→exit1(named), --json | done |
| U2 | no-placeholder-check script | scripts/no-placeholder-check.js | TODO/coming-soon detected→exit1(file:line), clean→exit0 | done |
| U3 | Tests | src/__tests__/(tasks-check, no-placeholder-check).test.js | jest 11/11 | done |
| U4 | DECISIONS.md convention | docs/DECISIONS.md | file + convention + example | done |
| U5 | CLAUDE.md: question gate + prohibitions | CLAUDE.md | 4-condition gate + prohibitions list present | done |
| U6 | SKILL.md: checkpoint fields + resume wording | SKILL.md | enriched template + tightened resume text | done |
| U7 | Agent wiring | developer.md, validator.md | DECISIONS/no-placeholder/tasks-check referenced | done |
| U8 | Adversarial verify | _harness_test/track21-autopilot/ | 3 cases, 0 FP/FN | done |
| U9 | Full verify + ship | (commit) | full jest 112/112 → commit+push | done |

All units done. Backlog empty → engine complete.
