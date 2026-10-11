# Model Capability Map — Claude generation the harness runs on

> **Cached: 2026-10-11** (sources: Anthropic model catalog via the claude-api reference, cached
> 2026-06-24; plus the Claude 5.x IDs observed in a live Claude Code session on 2026-10-11).
> **C12 freshness rule applies: recorded ≠ current.** This file is a snapshot. When a decision
> depends on a model's exact limits (context window, output cap, feature support), verify at
> runtime — ask the session which model it is running on, or query the Models API
> (`GET /v1/models/{id}` → `max_input_tokens`, `max_tokens`, `capabilities`) — instead of
> trusting this table blindly. Update this file (and the SKILL.md context-budget table) when a
> new model generation ships.
> Previous snapshot: 2026-08-07 (the v1.3.1 lineup). What changed between snapshots: §0.

## 0. Snapshot delta 2026-08-07 → 2026-10-11

| Area | 2026-08-07 snapshot | 2026-10-11 snapshot |
|---|---|---|
| Top tier | Fable 5 / Opus 5 | **Fable 5.1 / Opus 5.5** observed as session models (`claude-fable-5-1`, `claude-opus-5-5`); Fable 5 / Opus 5 still in the API catalog |
| Mid / small tier | Sonnet 5 / Haiku 4.5 | **Sonnet 5.5 / Haiku 5.5** observed (`claude-sonnet-5-5`, `claude-haiku-5-5`); Sonnet 5 / Sonnet 4.6 / Haiku 4.5 still in the catalog |
| Thinking control | `budget_tokens` deprecated on 4.6, rejected on 5 | unchanged + **`output_config.effort` (low/medium/high/xhigh/max) is the calibration knob**; CoolHan now assigns effort per agent role (§3) | <!-- modernization:allow — quoted dated shape -->
| Sampling params | not tracked | **temperature / top_p / top_k removed** on the newest models — never put them in an agent definition or request template (§2) |
| Prefill | not tracked | **assistant prefill removed** — structured output goes through `output_config.format` (§2) | <!-- modernization:allow — quoted dated shape -->
| Stop reasons | not tracked | **`refusal` stop_reason** and **`fallbacks`** need handling in any direct-API harness code (§2) |

Two ID families therefore coexist in the wild and in this repo's own history: the catalog family
(`claude-fable-5`, `claude-opus-5`, `claude-sonnet-5`, `claude-haiku-4-5`) and the session family
(`claude-fable-5-1`, `claude-opus-5-5`, `claude-sonnet-5-5`, `claude-haiku-5-5`). Both are treated
as **current** by the lint. Neither is to be hardcoded in gate logic; CoolHan agents are dispatched
by *tier alias* (`opus` / `sonnet` / `haiku` / `fable`), not by dated ID. Pricing is deliberately
not recorded here — it moves faster than this file and a stale number would be used as if true.

## 1. Current lineup (what CoolHan sessions realistically run on)

| Model | ID(s) | Context | Max output | Tier for relay table |
|---|---|---|---|---|
| Claude Fable 5.1 / 5 | `claude-fable-5-1`, `claude-fable-5` | 1M | 128K | 1M-class |
| Claude Mythos 5 (Glasswing only — never assume availability) | `claude-mythos-5` | 1M | 128K | 1M-class |
| Claude Opus 5.5 / 5 | `claude-opus-5-5`, `claude-opus-5` | 1M | 128K | 1M-class |
| Claude Opus 4.8 / 4.7 / 4.6 | `claude-opus-4-8` etc. | 1M | 128K | 1M-class |
| Claude Sonnet 5.5 / 5 | `claude-sonnet-5-5`, `claude-sonnet-5` | 1M | 128K | 1M-class |
| Claude Sonnet 4.6 | `claude-sonnet-4-6` | 1M | 128K | 1M-class |
| Claude Haiku 5.5 | `claude-haiku-5-5` | 1M (observed in session; verify via Models API before relying on it) | — | 1M-class (treat as 200K-class until verified) |
| Claude Haiku 4.5 | `claude-haiku-4-5` | 200K | 64K | 200K-class |

Retired/deprecated (never assume these): Sonnet 3.x, Haiku 3/3.5, Opus 3, Claude 2.x, and the
pre-4.6 4.x family (`claude-opus-4-0/4-1/4-5`, `claude-sonnet-4-0/4-5` and their dated <!-- modernization:allow — quoted dated shape -->
`-2025MMDD` forms). The "100K class" and "32–64K class" tiers the harness was originally written
against no longer correspond to any current Claude model — they remain in the relay table only as a
fallback for non-Claude or legacy runtimes.

## 2. API-surface removals that affect harness code and agent wording

These are the shapes a Claude-5-era request must NOT contain. They matter in two places: any
CoolHan script that calls the API directly (none today — the harness runs inside Claude Code and
dispatches via the Agent tool), and agent/skill prose that tells a model how to configure a call.

<!-- modernization:allow — this section quotes the removed/dated shapes on purpose -->
| Removed / dated shape | Current shape | Why it matters to CoolHan |
|---|---|---|
| `thinking: {type:"enabled", budget_tokens:N}` | `thinking: {type:"adaptive"}` + `output_config: {effort: ...}` | `budget_tokens` returns **400** on Fable 5 / Sonnet 5 / Opus 5 / 4.8 / 4.7. Fable 5: thinking is always on. Opus 5: on by default; `disabled` is accepted only at effort `high` or lower. | <!-- modernization:allow — quoted dated shape -->
| `temperature`, `top_p`, `top_k` | not sent (removed) | A request template carrying them fails on the newest models. Agent prose must not "lower the temperature for determinism" — determinism comes from the mechanical gates (G1–G17), not sampling knobs. | <!-- modernization:allow — quoted dated shape -->
| Assistant-turn prefill (`{"role":"assistant","content":"{"}`) | `output_config.format` (JSON schema) / `client.messages.parse()` | Prefill is removed. C4 structured output = schema, never a prefilled brace. | <!-- modernization:allow — quoted dated shape -->
| `stop_reason` ∈ {end_turn, max_tokens, tool_use, stop_sequence} only | also **`refusal`**; responses may carry **`fallbacks`** | A harness loop that treats an unknown stop_reason as success fabricates a PASS (C10). Refusal → record NOT_RUN with the reason; fallbacks → record which model actually answered. |
| Mid-conversation `role:"system"` messages | single top-level `system` | Not supported on Sonnet 5. CoolHan's C6 rule re-injection must go into the **user** turn (baton text / UNIT PREAMBLE), which is what it already does. |
| Web tools `web_search_20250305` / `web_fetch_20250910` | `web_search_20260209` / `web_fetch_20260209` | Only relevant if a CoolHan script ever wires server tools directly (C3 is Claude-Code-tool-based today). |
<!-- end of quoted dated shapes -->

Also recorded, not removals: Sonnet 5 uses a new tokenizer (~30% more tokens for the same text) —
the relay table's unit counts remain valid because they are unit-based, not token-based; Opus 5
prompt-cache minimum is 512 tokens — short cached prefixes are silently uncached, so the baton
should keep the C6 rules block as one stable, >512-token prefix rather than many tiny fragments.

## 3. Effort / thinking policy per agent role (new, v2.5.0)

Adaptive thinking is on everywhere; the only knob worth setting is **effort**. The Claude Code
Agent tool exposes it as `effort` (low / medium / high / xhigh / max). CoolHan assigns it by what
the role has to get right, not by prestige. Each agent footer carries `**Effort:**` with its tier;
the orchestrator passes that value when it delegates. The policy is advisory for the model's
reasoning depth — it never changes a gate's verdict logic.

| Tier | Roles | Why |
|---|---|---|
| **xhigh** | developer, execution-runner, devops-deployer, site-analyzer, module-extractor, cross-site-adapter, development-lead, devops-lead | Agentic / coding work: long multi-file edits, real command execution, reverse-engineering. Under-thinking here produces subtle defects the gates then have to catch late. |
| **high** | validator, security-reviewer, plan-reviewer, qa-tester, qa-lead, integration-validator, e2e-tester, hx-vision-critic, self-auditor, commercial-readiness-auditor, intent-analyzer, spec-writer, ux-design-lead, planning-lead, hypothesis-validator, logic-proof-verifier, cryptanalyst | Judgment gates and specification: the deliverable is a verdict or a document whose errors propagate. `high` is the floor; the two-layer verdicts already force coverage, so `xhigh` buys little. |
| **medium** | marketing-lead | Document generation from already-decided facts; errors are cheap and reviewed. |
| **max** | none by default | Reserved for the orchestrator to raise on a unit flagged high-risk × high-complexity by C11; never the resting state (cost and latency without evidence gain). |

Rules that go with the tiers:
- **Do not re-add verification scaffolds** ("think step by step", "double-check your answer") to <!-- modernization:allow — quoted dated shape -->
  compensate for a lower tier — raise the tier instead. On current models those scaffolds depress
  quality (§4.3) and the lint rejects them.
- **Subagent delegation is capped, not encouraged.** Claude 5-era models over-delegate when told
  to "use subagents freely"; CoolHan's G9 parallel-plan decides parallelism mechanically. Agent <!-- modernization:allow — quoted dated shape -->
  prose must not contain "delegate more / spawn as many agents as needed" wording (lint rule <!-- modernization:allow — quoted dated shape -->
  `delegate-more`).
- **Deliverable length is stated.** The newer models narrate longer by default; every agent
  already carries the ≤5-line report cap and the "overflow to file" rule — keep both.
- **Scope discipline is stated.** "Implement what the spec says; propose anything better through
  `_proposals.md`" (the Improvement-Proposal channel). Uninvited scope is still a Stage-0 P0 FAIL.

## 4. What changed vs. the assumptions this harness was built on (2026-05~06 era)

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
   own work unprompted. CoolHan's *mechanical* gates (G1–G17, tasks-check, no-placeholder-check)
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
   conservative-reporting language to them. (v2.5.0: the coverage-first sentence is now written
   into each reviewer's Core Principles, not only here.)
6. **Over-delegation and longer narration (Opus 5 generation).** The model reaches for subagents
   and writes more by default. CoolHan's answer is mechanical, not pleading: G9 decides
   parallelism, the 5-line cap decides length, and the lint rejects "delegate more" prose. <!-- modernization:allow — quoted dated shape -->

## 5. Enforcement

`node scripts/prompt-modernization-check.js .claude/agents .claude/skills` lints every
agent/skill .md for the dated patterns in §2 and §4 (pressure language outside P0/C10 lines,
thinking-budget/step-by-step scaffolds, over-verification prose, severity filters, stale or
pre-4.6 model IDs, sampling-parameter prose, prefill prose, delegate-more prose). Run it after <!-- modernization:allow — quoted dated shape -->
editing any agent definition; verified adversarially in `_harness_test/track22-modernization/`
(v1.4.0 rule set) and `_harness_test/track34-model-upgrade/` (v2.5.0 rule set + effort footers).

## 6. Honesty bound

This map improves calibration (how much work fits a session, how to word agent instructions,
how much reasoning effort to request per role). It does not change any gate's verdict logic, and
a correct model map does not prove the work itself is correct — that remains the job of G1–G17
evidence. The lineup above is a snapshot; the Models API is the authority at runtime.
