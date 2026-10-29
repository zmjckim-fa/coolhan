# Track 35 — G19 AI Agent architecture gate (`scripts/ai-arch-check.js`) adversarial verification

Driving doc: `knowledge_base/00_AI_ARCHITECTURE_PRINCIPLES.md` (user doctrine, 2026-10-29: "right brain for
the right task" — deterministic code → Decision Model → LLM → human; Application Code owns the final action).
Fixtures: `fixtures/<scenario>/` (each a tiny node app). Run log: `run-log.txt`
(`for d in …; do node scripts/ai-arch-check.js _harness_test/track35-ai-arch/fixtures/$d; done`).

| Scenario | Shape | Expected | Actual | Match |
|---|---|---|---|---|
| A compliant | Jev call inside `services/ai` behind `decide()`, zod schema, threshold constant in application code, complete 10-field record | PASS | PASS — 1 call in layer, 1 record | ✅ |
| B call in domain | A + `domain/refund.js` calls Anthropic SDK directly | FAIL `ai-call-outside-service-layer` (file:line) | FAIL — `domain/refund.js:1`, `:2` | ✅ |
| C service acts | AI service module imports `stripe` | FAIL `ai-service-executes-action` | FAIL — `services/ai/decision.service.js:1` | ✅ |
| D no record / no schema | OpenAI call in layer, raw text returned, no `docs/AI_DECISIONS.md` | FAIL `no-schema-validation` + `no-architecture-decision-record` | both, named | ✅ |
| E wrong brain | record 1: Classification by `LLM (Claude)` w/o Rationale; record 2: Deterministic "is the order paid?" by Jev | FAIL `llm-for-bounded-decision` + `deterministic-not-code` | both, at record lines 1 / 12 | ✅ |
| F threshold / placeholder | application code uses `.decision` with no threshold; record keeps `Fallback: [실패 시 처리]` | FAIL `threshold-not-in-code` + `record-incomplete` (names `fallback`) | both | ✅ |
| G no AI | plain `payment_status === 'paid'` app | NOT_APPLICABLE, exit 0 | NOT_APPLICABLE (1 file) | ✅ |
| Self-run | this repository | NOT_APPLICABLE (harness makes no model call) | NOT_APPLICABLE (102 files) — after adding `ai-arch-check:allow` to the detector table line that had matched its own `typesafe-ai` token (false positive found and fixed during the track) | ✅ |
| Unit tests | `src/__tests__/ai-arch-check.test.js` | 12/12 | 12 passed | ✅ |

**0 false positives** (compliant app and no-AI app never produced a finding; the Rationale line lifts R7;
`--service-dirs` override lifts R1 for a non-default layout; allow-marker lifts detector/example lines),
**0 false negatives** (every one of the 8 rules fired on its scenario with file:line / record:line).

**Verdict:** PASS — the statically checkable subset of the doctrine (§3 · §4 · §5 · §9/§10 · §14 · §15/§16
· §18-Rationale) is now a repeatable gate wired into Plan Reviewer 2.5 / Validator stage 7 / Security
Reviewer 3.7 / Developer pre-commit.

**Honest bound (C10):** PASS proves no checkable violation — not that the feature truly needed AI, that
Jev/Clef/LLM was the best brain, or that thresholds are calibrated. Those remain Plan Reviewer §13/§17 +
human judgments. Provider tokens are detection heuristics (C12); a new provider is a one-line table add.
