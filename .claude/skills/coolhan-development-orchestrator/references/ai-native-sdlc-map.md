# AI-Native SDLC Map — industry terms → CoolHan implementation

> Positioning: **Agentic Software Development with Multi-Agent Orchestration and Continuous
> Feedback Loops** ("AI-Native Multi-Agent Development"). This file maps each industry concept
> to the CoolHan mechanism that implements it, so upgrades target real gaps instead of renaming
> what already exists.

| Industry term | CoolHan implementation | Status |
|---|---|---|
| Agentic Development (analyze→plan→code→test→fix→review→deploy) | Task 1→1.5→2→2.5→3→4→5→6 pipeline + auto-recovery (1 retry) | ✅ since 2026-05-28 |
| Multi-Agent Orchestration (orchestrator–worker) | Development orchestrator SKILL + 25 role agents (.claude/agents/) | ✅ |
| Spec-Driven Development | Requirements IDs → spec → planner-approval P0 gate → Validator Stage 0 | ✅ (core identity) |
| Generator–Evaluator Loop (Maker–Checker) | Developer↔Validator, HX render↔vision-critic auto-loop, Debate/Vote gates | ✅ |
| Continuous Agent Loop / Long-Running Agent / Feedback Loop | **G10 `scripts/agent-loop.js` (v1.6.0)**: mechanical run→observe→feedback→re-run cycle, per-iteration ledgered feedback, resumable _loop-state.json across sessions + continuous engine + baton relay + completion-check (G8-B) + UNIT PREAMBLE (v1.4.1) | ✅ upgraded |
| Iterative Development | engine loop: dev→validate→fix→revalidate per unit | ✅ |
| Eval-Driven Development | G2 acceptance-test-first (tests bound to requirement IDs, results from real execution) + G4 regression baseline + G5 lessons ledger | ✅ |
| CI/CD | GitHub Actions: test.yml, harness-check.yml, release.yml, publish.yml | ✅ |
| Harness Engineering | This repo: gates G1–G9, KB, references, adversarial tracks | ✅ (the product itself) |
| Context Engineering | G8-A Context Ingestion Gate (_context-digest.json + context-check.js), C6 re-injection | ✅ |
| Human-in-the-Loop | P0 planner-approval gate, destructive-op confirmation, 4-condition question gate | ✅ (narrow by design) |
| **Parallel Agent Development** | **G9 `scripts/parallel-plan.js` + SKILL.md § Parallel dispatch (v1.5.0)** | ✅ NEW |
| **Better-than-spec with intent safety** | **Improvement-Proposal channel `_workspace/_proposals.md` (v1.5.0)** | ✅ NEW |
| **Design excellence (anti-house-style)** | **references/design-excellence-standard.md + `scripts/design-quality-check.js` (v1.7.0)**: 4-direction proposal, diversity ledger, palette-energy + imagery gates | ✅ NEW |
| **Loop enforcement (harness-level)** | **G11 `.claude/hooks/stop-guard.js` Stop hook (v1.8.0)**: blocks turn-end while backlog incomplete; _stop-approved.json = legitimate-stop path; fail-open + safety valve. v1.8.1: + ask-guard.js (AskUserQuestion denied mid-run — asking parks the turn, invisible to Stop hook) + run-armer.js (arming is mechanical on CoolHan run commands, stale approvals cleared) | ✅ NEW |
| **Observability (Foundation layer)** | **G12 `scripts/run-report.js` (v1.9.0)**: one artifact composing backlog %, per-gate ledger outcomes, G10 loop iterations/escalations, recurring lessons, pending proposals — observer only, never a verdict | ✅ NEW |
| **Non-stop supervisor (outer loop)** | **G13 `scripts/nonstop.js` (v2.0.0)**: relaunches headless sessions until completion-check exits 0 — closes the last human step (baton pasting) of 무중단 개발; 5 named stop conditions, per-session log, wedged-run valve | ✅ NEW |
| **Commercial readiness (production evals)** | **G14 `scripts/commercial-gate.js` + agents/commercial-readiness-auditor.md (v2.1.0)**: 5 user-facing criteria × real-HTTP keepers against production; keeper-less = NOT_RUN; ①가부②차단③미측정 verdict artifact | ✅ NEW |
| **Production edge/bot hardening** | **G15 `scripts/hardening-check.js` (v2.2.0)**: 5 real-HTTP holes (AI-agent bypass, stack-fingerprint headers, framework-404 leak, UA coherence, robots AI-crawler block); probe is the regression guard; FAIL=measurement→source-read first | ✅ NEW |
| **Companion skills (maker-side quality)** | **12 shipped skills in .claude/skills + G16 companion-skills-check.js + references/companion-skills.md (v2.3.0, +web-clone v2.5.1)**: grill-me/codebase-design/implement/diagnosing-bugs/code-review/resolving-merge-conflicts/frontend-design/web-design-guidelines/react-best-practices/redesign-skill/taste-skill/web-clone, agent-invoked only-if-present (C3) | ✅ NEW |
| **Self-growth (자기성장형)** | **G17 scripts/self-growth.js (v2.4.0)**: mines own ledger/decisions/run-reports/proposals + applied-site verdicts → ranked _self-growth-backlog.md feeding the loop; advisory, honest bound (recorded evidence, not cross-account transcripts) | ✅ NEW |
| **Model-generation calibration (Claude 5.x)** | **v2.5.0**: model-capability-map re-cached 2026-10-11 (both ID families current, API removals, C12 freshness), role-based `**Effort:**` tier in all 26 agent footers passed on dispatch, coverage-first/scope-discipline written into reviewers/developer, lint +4 rule families (legacy-4x / sampling-param / prefill / delegate-more); track34 22/22 | ✅ NEW |
| **Session learning (cross-session memory)** | **G18 `scripts/harvest-sessions.js` (v2.6.0)**: this account's sessions → masked private store (git-ignored) → DIGEST + brief via SessionStart/SessionEnd hooks; G17 mines it as a new evidence source; advisory | ✅ NEW |
| **AI-agent architecture (right brain for the right task)** | **G19 `scripts/ai-arch-check.js` + `knowledge_base/00_AI_ARCHITECTURE_PRINCIPLES.md` (v2.6.0)**: deterministic code → Decision Model (Jev / Clef) → LLM → human; model calls only in `services/ai` behind an abstraction, structured output + schema validation, §14 ten-field decision record, threshold in application code, AI never executes the action — static subset mechanical (8 rules), judgment in Plan Reviewer §13/§17; track35 | ✅ NEW |
| Agent Swarm | marketing synonym of the above — no separate mechanism needed | n/a |
| Vibe Coding | intentionally NOT adopted — conflicts with spec-driven P0 | rejected |

## The two v1.5.0 additions in one paragraph each

**Parallel Agent Development (G9).** The backlog was always executed strictly serially. Now the
orchestrator runs `node scripts/parallel-plan.js <plan.json> --json` to get mechanically-safe
waves: units whose dependencies are satisfied AND whose declared file sets are disjoint may be
dispatched to parallel worker agents in one turn; file-overlapping or unknown-footprint units are
serialized (two agents writing one file is a merge conflict, not speed). Validation stays serial:
every worker's output still passes the per-unit Validator gate, and the wave completes only when
every unit in it is validated. Honest bound: parallel-safety is computed from DECLARED deps/files
only — undeclared coupling is why validation is never parallelized away.

**Improvement-Proposal channel (better than the 기획서, without violating it).** The P0
planner-intent gate bans silently ADDING unapproved features — but that previously meant
better-than-spec ideas were silently dropped. Now any agent that sees a concrete improvement
(better UX flow, safer schema, cheaper query) records it in `_workspace/_proposals.md`
(id / what / why better / cost / risk) and CONTINUES building exactly to spec. Proposals surface
to the human at the next approval gate (or final report line 5). An approved proposal becomes a
backlog unit; an unapproved one never touches code — Validator Stage 0 still fails any
implementation that snuck in. This is how "develop better than the spec" and "match the maker's
intent" coexist: the machine proposes, the human disposes.
