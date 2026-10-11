# Track 34 — Model-generation upgrade (v2.5.0) adversarial verification

**Date:** 2026-10-11 · **Runner:** `node _harness_test/track34-model-upgrade/run.js` · **Result:** 22/22 PASS, 0 false positives, 0 false negatives

## Why this track exists

The user's instruction: "클로드 모델들이 업그레이드 되고있다. 이에 맞게 쿨한 하네스의 소스와 방식을 고도화해야한다."
The previous model-era pass (v1.3.1 relay rebuild, v1.4.0 modernization lint, track22) was built against the
2026-08-07 snapshot (Fable 5 / Opus 5 / Sonnet 5 / Haiku 4.5). Since then the session models observed in Claude
Code are Fable 5.1 / Opus 5.5 / Sonnet 5.5 / Haiku 5.5, and the claude-api reference records API-surface
removals (`budget_tokens` → 400, sampling parameters and assistant prefill removed, `refusal` stop reason +
`fallbacks`, no mid-conversation system messages on Sonnet 5) plus behaviour shifts (over-delegation, longer
narration, severity filters depress recall). The harness had to absorb those without touching any gate's
verdict logic or removing any existing feature.

## What changed (source + method)

| Area | Change | File(s) |
|---|---|---|
| Reference map | Cache refreshed to 2026-10-11; §0 snapshot delta; both ID families (catalog `claude-fable-5` and session `claude-fable-5-1`) recorded as current; §2 API-surface removals table (allow-marked); §3 role-based effort policy; pricing deliberately not recorded | `references/model-capability-map.md` |
| Relay budget | 1M-class row names Fable 5.1/5 · Opus 5.5/5 · Sonnet 5.5/5; Haiku 5.5 kept at 200K-class until its window is verified via the Models API; new "Effort policy per agent role" subsection | `coolhan-development-orchestrator/SKILL.md` |
| Agent dispatch | Every agent footer gained `**Effort:** xhigh / high / medium` by role (8 agentic → xhigh, 17 judgment → high, 1 docs → medium); orchestrator passes the tier as the Agent tool's `effort`. Research orchestrator footer: high | 26 × `.claude/agents/*.md`, both orchestrator SKILL.md footers |
| Behaviour shifts written into agents | Coverage-first sentence in Validator / Security Reviewer / Plan Reviewer Core Principles; scope-discipline + deliverable-length + "G9 decides delegation" bullet in Developer | 4 agent files |
| Lint (mechanical enforcement) | 4 new rule families: `legacy-4x-model-ref` (opus/sonnet 4-0/4-1/4-5 and dated `-2025MMDD` forms; 4.6+/haiku-4-5 stay clean), `sampling-param` (temperature/top_p/top_k as a setting or instruction; domain "temperature" clean), `prefill` (API-context only; "pre-filled answer sheet" clean — a real false positive caught in intent-analyzer.md:37 and fixed by tightening the rule, not by allow-marking the agent), `delegate-more` | `scripts/prompt-modernization-check.js`, 10 new tests |

## Scenarios

| # | Scenario | Expected | Observed |
|---|---|---|---|
| A1–A6 | Six dated fixtures, one per rule family (legacy 4.x ID, sampling param, prefill, delegate-more, budget_tokens/step-by-step, severity filter) | each flagged with exactly its own rule | PASS ×6 |
| A7 | Current fixture: all 12 current IDs in both families, tier aliases, adaptive thinking + effort, `output_config.format`, G9 wording, domain "temperature"/"pre-filled", P0/C10 emphasis lines | 0 findings | PASS (none) |
| B1 | 26 shipped agents: exactly one `**Effort:**` footer each, tier equals the §3 policy | all match | PASS |
| B2 | Policy table covers every shipped agent (no untiered role) | 26/26 | PASS |
| B3 | Adversarial: a developer footer at `low` is rejected by the same tier check | mismatch detected | PASS |
| C | Shipped `.claude/agents` + `.claude/skills` under the extended rule set | clean | PASS (48 files) |
| D1–D4 | Coverage-first present in the 3 reviewers; scope discipline present in Developer | present | PASS ×4 |
| D5 | No agent carries "delegate more / use subagents freely" outside an allow-marked line | none | PASS |
| E1–E3 | Relay table names the 5.x lineup, keeps 1M-class at 10~15 units, carries the effort policy | all true | PASS ×3 |
| E4–E6 | Map: cache date 2026-10-11, both ID families, API removals recorded, no pricing | all true | PASS ×3 |

## Defect found during the track

`prefill` v1 (`/\bpre-?fill(?:ed|ing|s)?\b/`) flagged `intent-analyzer.md:37` — "a pre-filled answer sheet
(e.g., SCENARIO.md)". That is domain prose, not the removed API technique. Fixed by narrowing the rule to API
context (prefill + assistant/response/output/turn/json/brace/message, `assistant prefill`, `prefill:`) and adding
a negative unit test. The agent text was not allow-marked — a lint that needs allow-marks on ordinary prose is a
lint with a false positive.

## Honest bound

- Textual + structural proof: the dated shapes are gone from the shipped prose, the effort tiers are present
  and consistent, the reference map is internally consistent with the relay table. It does not prove that a
  given effort tier is optimal for a given unit — that is C11's runtime calibration, and the tiers are advisory
  to reasoning depth only; no gate verdict changed.
- The lineup is a snapshot (C12: recorded ≠ current). Haiku 5.5's context window was observed in a session
  prompt, not verified via the Models API, so the relay table keeps it at the conservative 200K tier.
- The harness does not call the Messages API directly today (it runs inside Claude Code), so the §2 removals
  are enforced as prose rules and as a checklist for any future direct-API script, not as a runtime guard.
