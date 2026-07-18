# Changelog

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
