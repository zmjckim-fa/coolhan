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
