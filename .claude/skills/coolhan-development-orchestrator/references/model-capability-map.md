# Model Capability Map — Claude generation the harness runs on

> **Cached: 2026-08-07** (source: Anthropic model catalog / claude-api reference).
> **C12 freshness rule applies: recorded ≠ current.** This file is a snapshot. When a decision
> depends on a model's exact limits (context window, output cap, feature support), verify at
> runtime — ask the session which model it is running on, or query the Models API
> (`GET /v1/models/{id}` → `max_input_tokens`, `max_tokens`, `capabilities`) — instead of
> trusting this table blindly. Update this file (and the SKILL.md context-budget table) when a
> new model generation ships.

## Current lineup (what CoolHan sessions realistically run on)

| Model | ID | Context | Max output | Tier for relay table |
|---|---|---|---|---|
| Claude Fable 5 | `claude-fable-5` | 1M | 128K | 1M-class |
| Claude Opus 5 | `claude-opus-5` | 1M | 128K | 1M-class |
| Claude Opus 4.8 / 4.7 / 4.6 | `claude-opus-4-8` etc. | 1M | 128K | 1M-class |
| Claude Sonnet 5 | `claude-sonnet-5` | 1M | 128K | 1M-class |
| Claude Sonnet 4.6 | `claude-sonnet-4-6` | 1M | 128K | 1M-class |
| Claude Haiku 4.5 | `claude-haiku-4-5` | 200K | 64K | 200K-class |

Retired/deprecated (never assume these): Sonnet 3.x, Haiku 3/3.5, Opus 3, Claude 2.x.
The "100K class" and "32–64K class" tiers the harness was originally written against no longer
correspond to any current Claude model — they remain in the relay table only as a fallback for
non-Claude or legacy runtimes.

## What changed vs. the assumptions this harness was built on (2026-05~06 era)

1. **Context is ~5x larger.** The relay/baton design assumed a 200K ceiling ("Large" tier,
   3–4 units per session). Current 1M-class models safely carry far more units per session, so
   the baton should fire much less often. The baton mechanism itself stays — it is still the
   correct hand-off for genuinely long runs — but firing it after 3 units on a 1M-class model
   wastes sessions. Use the updated table in SKILL.md § Continuous Relay.
2. **Newer models follow instructions more literally.** Pressure language written to overcome
   old-model reluctance ("CRITICAL: YOU MUST...", "If in doubt, do X") now over-triggers. <!-- modernization:allow — quoted example of the dated pattern -->

   When editing agent definitions, state instructions plainly; reserve emphasis for the few
   genuinely non-negotiable P0 gates (planner intent, no-simulation/C10, evidence-required).
3. **Self-verification is now default model behavior.** Newest-generation models verify their
   own work unprompted. CoolHan's *mechanical* gates (G1–G8, tasks-check, no-placeholder-check)
   stay — they are evidence-producing artifacts, not prompts — but avoid adding new
   prose-level "double-check your answer" instructions to agents; they cause over-verification <!-- modernization:allow — quoted example of the dated pattern -->
   on current models without adding evidence.
4. **Long single turns are normal.** Current top-tier models routinely run many minutes in one
   turn. The working-mode rule "no waiting after 1 minute" should not be read as "a long turn
   is a stall" — judge stalls by absence of tool activity, not wall-clock alone.
5. **Severity-filtered review depresses recall.** Current models follow "only report
   high-severity findings" literally. CoolHan reviewers (Validator/Security Reviewer/Plan
   Reviewer) must ask for *coverage first* — report every finding with confidence + severity,
   filter downstream — which is already their two-layer-verdict design; do not add
   conservative-reporting language to them.

## Enforcement

`node scripts/prompt-modernization-check.js .claude/agents .claude/skills` lints every
agent/skill .md for the dated patterns in §2–5 (pressure language outside P0/C10 lines,
thinking-budget/step-by-step scaffolds, over-verification prose, severity filters, stale model
IDs). Run it after editing any agent definition; verified adversarially in
`_harness_test/track22-modernization/`.

## Honesty bound

This map improves calibration (how much work fits a session, how to word agent instructions).
It does not change any gate's verdict logic, and a correct model map does not prove the work
itself is correct — that remains the job of G1–G8 evidence.
