# Changelog

## [1.8.1] - 2026-08-07

### Added

- **G11b Ask-Guard + G11c Run-Armer — the two gaps that kept "stopping to ask" alive even with
  bypassPermissions** (user-reported): permission mode was never the cause — the model itself
  asks, and two paths escaped v1.8.0's Stop hook:
  - `.claude/hooks/ask-guard.js` (PreToolUse, matcher AskUserQuestion): an AskUserQuestion call
    does NOT end the turn — the session parks awaiting input, invisible to the Stop hook. During
    an active run with an incomplete backlog and no recorded stop condition, the question is
    **denied** with the standing instruction (safest 기획서-consistent default + DECISIONS.md +
    continue; `_stop-approved.json` remains the legitimate path for the 4 conditions/P0/ESCALATE).
    Shares stop-guard's decision matrix, safety valve, and fail-open behavior.
  - `.claude/hooks/run-armer.js` (UserPromptSubmit): arming `_run-active.json` was itself a
    prose instruction — a run that never armed was never guarded. Now the harness arms it
    mechanically when the user's own prompt is a CoolHan continuous-dev command (conservative
    trigger; inspection/ops prompts like "쿨한 업데이트 확인해" never arm), clears stale
    stop-approvals from previous runs, and injects the loop-contract context line.
  - Tests 7/7 (total 167/167); track27 real-invocation adversarial: arm-on-command,
    deny-mid-run, allow-after-approval, stale-approval-cleared, inspection-never-arms;
    0 false +/-.

## [1.8.0] - 2026-08-07

### Added

- **G11 Stop-Guard hook — harness-level loop enforcement** (user-reported: "루프 안 돌고 계속
  멈춰서 물어본다"): every prior countermeasure (rule 8, the 4-condition gate, the v1.4.1 UNIT
  PREAMBLE) was prose the model had to voluntarily follow. `.claude/hooks/stop-guard.js` is a
  Claude Code `Stop` hook that runs OUTSIDE the model whenever a turn tries to end:
  - During an active CoolHan run (`_workspace/_run-active.json`, armed at Phase 0) with an
    incomplete backlog (completion-check ≠ 0), the stop is **blocked** and the continue
    instruction (remaining units + no-ask rules + the legitimate-stop path) is re-injected.
  - Legitimate stops stay possible: writing `_workspace/_stop-approved.json {"reason"}` (the
    4 Auto-Pilot conditions, P0 gate, ESCALATE, destructive-op confirmation) allows the stop;
    completion auto-retires the run marker; a 25-block safety valve and fail-open error
    handling guarantee the guard can never trap a user; sessions without the marker are
    completely untouched.
  - `settings.json` `hooks` key restructured to Claude Code's real hook schema (the previous
    doc-style metadata preserved under `coolhanHooksDoc`) — CoolHan's hook block was never
    actually executed by Claude Code before this.
  - Tests 9/9 (total 160/160); track26 real-invocation adversarial: ordinary session
    untouched, incomplete-run stop blocked with counter, approved stop allowed, completion
    retires marker; 0 false +/-.
  - Honest bound: enforces "turn does not end while units remain"; work quality stays with
    G1–G10, and mid-turn tool-permission prompts are Claude Code permission settings, not
    stoppable by this hook.

## [1.7.1] - 2026-08-07

### Changed

- **Design Excellence enforcement closed end-to-end** — v1.7.0 installed the standard at
  authoring time (ux-design-lead, developer); v1.7.1 wires it into every verification surface:
  - `validator.md` stage 10: design-quality-check run (house-style-repeat / washed-out-palette /
    text-wall = stage-10 FAIL) + chosen-tokens spot-check (silent fallback to model-default
    styling is a FAIL).
  - `e2e-tester.md` item 11: rendered pages must visibly match the chosen direction; rendered
    text-wall scan; unreplaced placeholder assets fail a production-bound build.
  - `hx-vision-critic.md` dimension 10 (direction_fidelity): scores drift back to generic AI
    styling even when "clean"; records the unattended direction pick + rationale in
    `_workspace/_design-history.md`.
  - `devops-deployer.md` Step 2.6: `PLACEHOLDER-IMAGE` hits block production deploys
    (warning-only on staging/dev).

## [1.7.0] - 2026-08-07

### Added

- **Design Excellence Standard — breaking the AI house style** (user-reported: "always the same
  design, always pastel, text-only pages"):
  - `references/design-excellence-standard.md` — diagnosis (models have a default house style;
    generic instructions shift it, not vary it; text is free while imagery is work) + 5 rules:
    banned defaults (Inter/system-only stacks, reflexive hero+3-cards), **no washed-out
    palettes by default** (accent saturation ≥50% or declared `"muted":"intentional"` with a
    brief-tied rationale; ≥1 of the proposed directions must be bold), **4 distinct visual
    directions before building** (human picks; unattended → HX Vision Critic picks with
    recorded rationale), **design-diversity ledger** (`_workspace/_design-history.md` — new
    direction must differ from the last 3 projects in ≥2 of palette/typeface/layout),
    **imagery as a requirement** (per-section imagery decision; text-only pages must be
    declared; inline SVG always in scope; production placeholders are deploy blockers).
  - `scripts/design-quality-check.js` — mechanical gate for the three measurable failure
    modes: house-style-repeat, washed-out-palette (real HSL saturation math), text-wall
    (zero visual elements without a `design:text-only` declaration).
  - Wired into ux-design-lead.md (4-direction step + gate), developer.md (build from chosen
    tokens, draw inline SVGs, gate before implemented), SKILL.md Task 1.5.
  - Tests 12/12 (total 151/151); track25 adversarial: pastel+text-wall → FAIL(named),
    house-style repeat → FAIL, intentional-muted + distinct + visual → PASS; 0 false +/-.

## [1.6.0] - 2026-08-07

### Added

- **G10 Agent Loop / Feedback Loop / Long-Running Agent** — `scripts/agent-loop.js` makes the
  iterate cycle mechanical instead of prose:
  - **Agent Loop**: one call = one real cycle — runs the unit's verify command as a captured
    child process (C10 no-simulation), observes exit/output, returns DONE (exit 0) /
    ITERATE (exit 3, retries left) / ESCALATE (exit 1, max exhausted).
  - **Feedback Loop**: every failing iteration records structured feedback (iteration #, exit
    code, raw stdout/stderr tails) in `_workspace/_loop-state.json` and optionally the G5
    ledger — the next fix attempt starts from evidence, not memory.
  - **Long-Running Agent**: loop state persists across sessions — after a baton/handoff the
    loop resumes at iteration N+1 with full history, never restarts blind. ESCALATE is
    terminal until a human/orchestrator resets the unit (re-running grants no silent extra
    iterations — defect caught and fixed during track24 scenario C).
  - Wired into the engine loop (replaces the prose "1 retry" rule with exit-code-driven
    DONE/ITERATE/ESCALATE handling); division of labor unchanged — the model fixes, the gate
    evaluates and bookkeeps (executable Generator–Evaluator).
  - Tests 9/9 (total 139/139); track24 adversarial with real processes: iterate→fix→DONE,
    never-fixed→ESCALATE, terminal re-entry, cross-session resume; 0 false +/-.

## [1.5.0] - 2026-08-07

### Added

- **G9 Parallel Agent Development** — `scripts/parallel-plan.js` computes mechanically-safe
  parallel execution waves from the plan: units whose dependencies are satisfied AND whose
  declared file sets are disjoint may be dispatched to parallel worker agents; file-overlapping
  or unknown-footprint units are serialized (unsafe default). Wired into the engine loop as an
  optional PARALLEL DISPATCH step; validation is never parallelized away — every worker's unit
  still passes the full Validator gate serially. Tests 8/8; track23 adversarial: mixed plan →
  correct waves + named serializations, cycle → FAIL named, 0 false +/-.
- **Improvement-Proposal channel** — the mechanism for "build better than the 기획서 without
  violating it": agents record concrete better-than-spec ideas in `_workspace/_proposals.md`
  ({id, unit, what, why-better, cost, risk}) and keep building exactly to spec; proposals surface
  at the next approval gate / final report; approved → new backlog unit, unapproved → never
  touches code (Validator Stage 0 unchanged — an implemented-uninvited proposal is still a P0
  FAIL). Wired into developer.md + validator.md + SKILL.md.
- **`references/ai-native-sdlc-map.md`** — industry-term → CoolHan-mechanism map (agentic dev,
  multi-agent orchestration, generator–evaluator, eval-driven, context/harness engineering,
  HITL, CI/CD…): shows what already existed, what v1.5.0 adds (parallel dispatch, proposals),
  and what is deliberately rejected (vibe coding).

## [1.4.1] - 2026-08-07

### Changed

- **Zero-prose work mode + 5-line report cap + per-unit anti-dilution re-injection** (user-directed):
  - Narration during work is now an **absolute prohibition** (CLAUDE.md rule 9 + Auto-Pilot
    prohibitions + SKILL.md working-mode as P0): zero prose between tool calls; the ONLY chat
    output of a work run is one final report, **5 lines maximum** (was 10); overflow goes to a
    file, chat carries the path. All 17 agent definitions updated to the 5-line cap.
  - **Ask-stop hard rule**: any question to the human outside the 4 Auto-Pilot conditions is
    itself a stop-excuse violation — the routine is safest 기획서-consistent default +
    docs/DECISIONS.md entry + continue in the same turn. Self-Auditor gained check #6
    (ask-stop / narration detection → DRIFT, action continue).
  - **Why the old rule didn't hold**: a rule read once at session start dilutes over a long run.
    Fix: the engine loop now has a UNIT PREAMBLE — before EVERY unit it re-reads _goal.md + the
    spec (기획서) and re-asserts the no-ask/zero-prose/keep-going rules (C6 extended from
    per-baton to per-unit). Checkpoint `rules_reinjection` string updated to match.

## [1.4.0] - 2026-08-07

### Added

- **Prompt-modernization lint (G-track, completes the v1.3.1 deferred item)** —
  `scripts/prompt-modernization-check.js` keeps agent/skill definitions free of prompting
  patterns written for older Claude generations, per `references/model-capability-map.md` §2–5:
  - Rules: ALL-CAPS pressure language outside P0/C10 lines (over-triggers on
    literal-instruction models), `budget_tokens`/"think step by step"/scratchpad scaffolds
    (removed API surface), "double-check your answer" prose (causes over-verification),
    "only report high-severity" filters (depresses reviewer recall), stale claude-2/3 model IDs.
  - Deliberate hard gates keep their emphasis: lines tagged `P0`/`C10` are exempt;
    `modernization:allow` marks intentional quoted examples.
  - Audit result: all 25 agent files already clean; 12 findings in skill/reference files fixed
    (2 reworded, 7 Locked-Mode rules tagged `(P0)`, 2 allowlisted quoted examples, 1 spec-first
    line reworded — enforcement of those rules is mechanical, so prose emphasis was redundant).
  - Tests 10/10 (suite total 122/122); track22 adversarial: dated agent → FAIL (all 5 rule
    families named), clean agent with P0 emphasis → PASS, repo-wide → clean; 0 false +/-.

## [1.3.1] - 2026-08-07

### Changed

- **Model-generation modernization** — the harness's relay/baton design assumed the 200K-context
  Claude era (baton after 3–4 units). Current Claude models (Fable 5 / Opus 5 / Opus 4.6+ /
  Sonnet 5 / Sonnet 4.6) carry 1M context; Haiku 4.5 carries 200K.
  - `SKILL.md` § Continuous Relay: context-budget table rebuilt around the 2026 lineup —
    1M-class → 10–15 units per session, baton at ~15% remaining; 200K-class → 3–4 units;
    plus an explicit "do not fire the baton early out of habit" rule (a baton after 3 units
    on a 1M-class model wastes sessions).
  - New `references/model-capability-map.md` — cached model lineup (IDs, context, output caps)
    with the C12 freshness guardrail (recorded ≠ current; verify the running model when it
    matters), and 5 documented behavior shifts that affect how agent definitions should be
    worded on current models (literal instruction-following, default self-verification,
    long single turns are normal, severity-filtered review depresses recall).
  - `SKILL.md` Non-Stop Execution: long single turns are judged stalled by absence of tool
    activity, not wall-clock.
  - No gate logic changed — G1–G8 verdicts, completion-check, and the baton mechanism itself
    are untouched; only calibration and guidance.

## [1.3.0] - 2026-07-19

### Added

- **Full-Completion Auto-Pilot Mode** — operationalizes a strict "never stop, never fake-complete"
  development discipline as first-class CoolHan artifacts/gates (Claude Code's own Auto mode/
  `/goal`/`--continue` remain CLI-level features outside CoolHan's control; this makes CoolHan's
  own agents follow the same discipline regardless of which CLI mode wraps them):
  - `scripts/tasks-check.js` — a 5-state `TASKS.md` gate (not-started/in-progress/implemented/
    verified/blocked, Korean labels accepted). "implemented" alone does not pass; only `verified`
    (backed by real execution) does. Blocked/remaining units are named, never silently dropped.
  - `scripts/no-placeholder-check.js` — scans for TODO/FIXME/"coming soon"/"준비 중"/placeholder
    markers; a unit claimed done with a leftover marker fails, named by file:line.
  - `docs/DECISIONS.md` — the convention for logging an assumed default and continuing without
    waiting for an answer.
  - A narrow 4-condition question gate in `CLAUDE.md` (real credentials/payment/irreversible
    production-data deletion/mutually-incompatible requirements) plus explicit absolute
    prohibitions (no partial-as-complete, no "later" excuses, no scope shrink for volume).
  - `_workspace/_checkpoint.md` enriched to carry the exact resume fields requested (goal,
    completed/current/remaining work, key decisions pointer, how-to-run, real test results,
    next action) — this file is CoolHan's PROGRESS.md equivalent.
  - Wired into `agents/developer.md` (log decisions, scan before marking implemented) and
    `agents/validator.md` (tasks-check + placeholder scan as additional completion sources).
  - track21 adversarial: all-verified → PASS, blocked/not-started → FAIL(named), TODO left in
    code → FAIL(file:line); 0 false positive/negative. Full suite 112/112.

## [1.2.1] - 2026-07-18

### Fixed

- **Release workflow**: `.github/workflows/release.yml`'s archive step tarred `.` while
  writing the output archive into `.`, which makes GNU tar exit non-zero ("file changed
  as we read it") and fails the step under `bash -e` — so the v1.2.0 tag push never
  produced a GitHub Release (update-check reported a 404). Fixed by building the archive
  outside the working tree, then moving it into place. All v1.2.0 functional changes are
  included in this release.

## [1.2.0] - 2026-07-18

### Added

- **CoolHan Doctor** (`coolhan-doctor` / `node doctor.js`) — a read-only post-install
  verification CLI. Checks CLAUDE.md harness pointers, the 6 core agents, the
  development orchestrator skill, the knowledge-base domain modules, and the Node
  engine; prints per-check pass/warn/fail with fix hints; exits `0` when healthy,
  `1` on problems. `--json` for CI. Non-fatal self-check runs automatically after
  `install.js`. Localized output (English/Korean) via `--lang ko|en` or `LANG`/`LC_ALL`.
- **G1–G8 closed-loop verification gates** — turn "should pass" into "did pass":
  - G1 execution substrate (`scripts/exec-runner.js`): real, stack-agnostic install/test/run
    with captured exit codes/output; missing tool → honest `NOT_RUN`, never a fabricated pass.
  - G2 requirements traceability (`scripts/trace-check.js`): every requirement bound to a
    passing acceptance test, backed by G1's real results.
  - G3 pre-dev plan/spec quality gate (`scripts/plan-check.js` + `agents/plan-reviewer.md`):
    catches cyclic/missing dependencies, unverifiable units, and uncovered requirements
    before coding starts.
  - G4 full regression gate (`scripts/regression-check.js`): blocks deploy on any test that
    regressed from pass to fail.
  - G5 run ledger (`scripts/ledger.js`): append-only history of gate outcomes with
    recurring-failure detection.
  - G6 environment/secret provisioning gate (`scripts/provision-check.js`): honest `NOT_RUN`
    for missing required env vars, name-only (never logs values).
  - G7 gate orchestrator (`scripts/gates.js`): single entry point running G1/G2/G4/G6 in
    dependency order with correct short-circuiting.
  - G8 context-ingestion + 100%-completion enforcement (`scripts/context-check.js`,
    `scripts/completion-check.js`): mandatory full-context read before work starts; "done"
    is mechanically gated on every backlog unit being done AND validated.
- **Continuous Self-Audit** (`agents/self-auditor.md`): mid-run, read-only check that
  non-stop development stays on-plan (scope creep, fake completion, drift).
- **Security hardening P1–P3**:
  - P1: `knowledge_base/00_SECURITY_STANDARDS.md` (OWASP/ASVS checklist) +
    `agents/security-reviewer.md` (threat-model/SAST-style pre-deploy gate).
  - P2: `scripts/secret-scan.js` (provider-token + entropy detection, pre-commit/CI gate)
    and stack-agnostic dependency-audit guidance.
  - P3: prompt-injection defense (untrusted content is data, never instructions) and a
    least-privilege deny baseline for the harness's own permissions.
- **Non-stop execution rules**: banned stop-justifying questions ("shall I continue?") and
  step-by-step narration mid-task — work runs silently to completion (or a genuine stop
  condition), then reports once in ≤10 lines.
- Full documentation translation to English across `.claude/`, `knowledge_base/`, and root
  docs (trigger strings for the 50+ supported languages are preserved as functional data).

## [1.1.0] - 2026-06-13

### Added

- **Cross-Cutting Capabilities (C1–C19)** — 19 harness-wide capability standards in
  `references/harness-capabilities.md`, injected into agent definitions
  - C1 interactive elicitation · C2 MCP live-evidence honesty · C3 web research as data
    (instruction-source boundary) · C4 structured-output schema enforcement
  - C5 reference-first mandatory pre-read · C6 long-session rule re-injection (relay baton)
    · C7 workspace hygiene · C8 iterative long-output · C9 failure conduct
  - C10 no-mock-execution (★ no fabricated test/build/deploy results) · C11 effort scaling
    · C12 verify-before-assume (+freshness) · C13 completion self-check (+completeness critic)
  - C14 self-contained delegation · C15 no silent truncation · C16 perspective-diverse
    verification · C17 loop-until-dry · C18 action-risk taxonomy · C19 evidence-action match
- **Track 8 adversarial verification** — 14/14 guardrails held under hostile pressure
  (fabrication, coverage-hiding, prompt injection, approval generalization, destructive
  pattern-match reflex) — `_harness_test/track8-capabilities/`
- **Reverse + Reuse pipeline real-world run** — R1/R2 executed on CoolHan's own `src/`
  (62 routes, 18 models → 10 modules mapped to existing domain library, 0 invented)
- **Scientific verification standards** — engineering-pass vs scientific-truth separation
  (`knowledge_base/00_SCIENTIFIC_VERIFICATION_STANDARDS.md`), two-layer verdicts
- **Human-Experience (HX) first-class standard** — UX design lead agent (Task 1.5),
  HX vision critic with unattended auto-loop, validator HX P0 gate
- **Continuous development engine** — goal→backlog self-iterating loop with relay baton
- **Nominatim (OpenStreetMap) address standard** — replaces carrier/country-specific
  postcode lookups in `04_shipping_logistics` (CR002)

### Changed

- Global output rules (no monologue, 6-line cap, results-only) enforced across all
  harnesses; artifact filename standard unified (GAP-2); QA negative tests mandatory (GAP-3)
- Forward agents made stack-agnostic via detection + command mapping (GAP-1)

## [0.3.0] - 2026-05-31

### Added

- **Planner Intent Enforcement Mechanism** (Phase D-3/D-4)
  - Task 1: Existing feature detection from knowledge_base/
  - Task 1→2 Gate: Auto-proceeds based on documented planner intent (no user interruption)
  - Task 4 Stage 0: Planning intent validation — detects unauthorized feature additions
  - Task 7-8: Specification checklist re-validation
  - Phase D-4 Verified: Zero unauthorized additions across full Task 1-8 pipeline

- **Research Evidence Ingestion & Validation System** (Voynich v0.3)
  - 12 new database tables (data_sources, research_claims, failure_cases, ...)
  - 4-tier evidence separation: Primary / Derived / External Claim / Hypothesis Eval
  - HypothesisGuard: Prevents external research from hijacking core hypothesis
  - RevalidationEngine: Auto-revalidates rules when new data is ingested
  - 6 new Streamlit dashboard pages

- **Voynich Tool Pipeline Scripts**
  - `scripts/init_db.py`: Creates 30-table SQLite database
  - `scripts/demo_seed.py`: Loads sample EVA data, corpora, rules, failure cases
  - `scripts/run_pipeline.py`: Full analysis pipeline orchestrator

- **Dashboard Pages** (6 new — previously stubs)
  - Folio Explorer with DB connectivity
  - EVA Parser with live token breakdown
  - Token Analysis with frequency charts
  - Character Analysis with i-dominance detection
  - Position Rules with confidence visualization
  - Section Comparison with corpus comparison charts

### Changed
- CoolHan Development Harness upgraded to Phase D-4
- Validator (Task 4): 9-stage → 10-stage pipeline (Stage 0 added)
- Dashboard version: v0.2 → v0.3
- `modules/__init__.py`: v0.3 modules registered with graceful fallback
- Task 1→2 gate: Changed from AskUserQuestion → auto-proceed

### Fixed
- Nav label collision: `📋 Research Claims` → `🗃️ Research Claims`
- `init_db.py`: CREATE INDEX idempotency fix (IF NOT EXISTS)

---

## [1.0.4] - 2026-05-28

### Added
- **E2E Tester agent** (new - complete user journey validation)
  
  9 validation phases:
  - Phase 1: Source code (typos, syntax, logic)
  - Phase 2: Data flow (input→DB→result)
  - Phase 3: Computation accuracy (business logic)
  - Phase 4: Error/warning messages (user feedback)
  - Phase 5: User↔admin interaction (permissions/synchronization)
  - Phase 6: UI/UX (usability, layout, feedback)
  - Phase 7: Responsive design (mobile/tablet/desktop)
  - Phase 8: CSS integrity (style application, broken parts)
  - Phase 9: Browser compatibility (Chrome, Firefox, Safari, etc.)

- **Mid-task reminder mechanism** (purpose retention)
  - Clear purpose declaration per phase
  - "Current state" re-confirmation during progress
  - Timeline tracking
  - Result synthesis on phase completion

- **Complete validation report**
  - Detailed results per the 9 phases
  - List of deficient items
  - Final deployment approval/rejection verdict

### Changed
- Pipeline: 7 stages → 8 stages (Task 7: E2E validation added)
- `coolhan-development-orchestrator.md`: Task arrangement adjusted

### Result
✅ **Complete validation** from source → data → UI → responsive → compatibility
✅ Validation of both user and admin journeys
✅ 100% confidence secured before deployment

---

## [1.0.3] - 2026-05-28

### Added
- **Integration Validator agent** (new)
  - Real operating-environment validation before/after deployment
  - Port checks (API, DB, cache, web server)
  - Actual API endpoint testing (curl)
  - Database connection and query validation
  - Build success confirmation
  - Data load confirmation
  - Planning-document requirements checklist
  - Performance measurement (response time)

- **Automated validation script** (`scripts/validate-deployment.sh`)
  - Per-environment port checks
  - API endpoint validation
  - Database connection check
  - Build validation
  - Data load confirmation
  - Performance measurement
  - Automatic JSON report generation

- **Task 6: Integration validation** (added to development pipeline)
  - Mandatory validation after QA completion
  - Final Go/No-Go verdict before deployment

### Changed
- `coolhan-development-orchestrator.md`: Task 6 added (integration validation)
- Development pipeline: 6 stages → 7 stages

### Result
✅ Planning document → code → validation → **real-environment validation** → deployment
✅ 100% validation of ports, API, DB, build, data, planning document
✅ Automatic Go/No-Go verdict before deployment

---

## [1.0.2] - 2026-05-28

### Added
- **Full multilingual trigger implementation**: support for all command patterns in all 50+ languages
  - 🇰🇷 한국어: '쿨한으로 ~', '진행하라 쿨한으로', '~ 쿨한으로 추가해'
  - 🇺🇸 English: 'CoolHan ~', '~ with CoolHan', 'CoolHan continue'
  - 🇯🇵 日本語: 'CoolHanで~', 'CoolHanで進めて'
  - 🇨🇳 中文: '用CoolHan~', '用CoolHan继续'
  - 🇪🇸 Español, 🇫🇷 Français, 🇩🇪 Deutsch, 🇮🇹 Italiano, 🇵🇹 Português, 🇷🇺 Русский, 🇮🇳 हिन्दी, 🇹🇭 ไทย +40 more
  - **Automatic language detection**: auto-recognizes the input language → activates all trigger patterns for that language

- **Strengthened orchestrator description**
  - Specific command examples per language stated explicitly
  - Clear intent signal "use this skill"
  - Guaranteed automatic activation of the Intent Analyzer

- **Expanded Intent Analyzer triggers**
  - Recognizes all command formats in 50+ languages
  - Supports all grammatical variations (preposition position, particles, tense, etc.)

### Changed
- `coolhan-development-orchestrator.md`: explicitly added command patterns for all languages
- `intent-analyzer.md`: fully implemented the 50+ language input protocol
- `package.json`: version 1.0.1 → 1.0.2

### Result
✅ "coolhan으로 진행하라" → **immediately activates intent-analyzer**
✅ Works in all languages (50+ languages)
✅ Supports all grammatical variations

---

## [1.0.1] - 2026-05-28

### Added
- **Automatic progression mechanism**: automatically runs the next stage after a Task completes
  - Continuous development progress without user intervention
  - On each Task completion, the next Task is auto-assigned via an internal command
  - Seamless execution of the entire pipeline

- **Interactive questioning process**: detailed information gathering by the Intent Analyzer
  - 19 specific question items (business background, usage environment, features, organization)
  - User fatigue management (ask until tired, add only 1 final item)
  - Automatic generation of a detailed business requirements document

- **Improved user manual**: structured README
  - States specific information items the human must provide
  - Examples and explanations for each item

### Changed
- `intent-analyzer.md`: added questioning process and automatic progression mechanism
- `coolhan-development-orchestrator.md`: stated Task auto-chaining logic
- `README.md`: user-centric guide to specific information items
- `package.json`: version 1.0.0 → 1.0.1

### Fixed
- Removed false multilingual-support claims (English only in reality)
- Removed user confusion caused by technical details

## [1.0.0] - 2026-05-27

### Initial Release
- 6-member AI agent team collaboration system
- Architecture based on 10 domain modules
- 9-stage automatic validation process
- Token Efficiency Mode applied
- Specification-driven development
