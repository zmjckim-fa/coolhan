# Changelog

## [2.12.3] - 2026-11-22

### Added

- **Public entries of a module** (`scripts/module-check.js`, module standard §6, part of G25). A module could
  import another module's `core/index` only. Screen modules therefore copied the shapes of the frames they are
  built on. When the detail frame added one function to its form in a minor version, the copy in the member
  screens module no longer fitted and the demo project stopped building after `modules update` (one type error).
  A module now lists the further files it opens in its manifest (`provides.entries`, for example a browser-safe
  `core/rules.ts` or a screen file other screen modules build on); another module that requires it may import
  those files and nothing else of its inside.
  - `import-escapes-module` now reads the neighbour's manifest; an unlisted file stays closed, and a neighbour
    that is not there to ask counts as closed.
  - New rule `public-entry-invalid`: a listed file that is missing, outside the module or under `test/`.

### Verification

- jest 433/433, 39 suites (`module-standard` 48/48); lint clean 48 files; fixed list in full.
- `_harness_test/track43-module-standard/run-track.js`: 17 scenarios, 17 match, 0 false +/- (scenario 17: listed
  file allowed, unlisted file refused, missing entry refused). Real library: 119 modules, form findings 0.
- In the library the three admin frames list their screen files and the member screens module imports the
  frames' own types; the demo project took the four new versions through the manager and builds again with no
  change of its own (type check exit 0, build exit 0).

### Honest bound

- The rule opens files, not names: everything a listed file exports is reachable.
- Whether two modules still fit together after one of them changes is not checked by admission (each module is
  admitted with what it requires, in isolation). The demo project's type check after `modules update` is what
  caught this case; it covers only the modules mounted there.

## [2.12.2] - 2026-11-22

### Added

- **Finding a module** (`scripts/modules.js list`, part of G25): `--area <word>` narrows to one area,
  `--find <text>` matches a word in the name, label or summary without regard to case, `--md` prints a catalogue
  grouped by area (one row per module: name, version, stack, required modules, label). A search that matches
  nothing is exit 4, not a pass. The library's catalogue file is made by redirecting `--md`; it is derived from
  the manifests and not written by hand.
- **Track 45**: ten admin and design modules of the library installed into an empty project through the module
  manager, their real screens mounted and opened in a browser at 375px and 1280px with a role switch. Three
  module defects were found only this way (an edit button drawn for a view-only role, two touch targets under
  44px), fixed in the library as new versions and measured again. The project took them through
  `status` (exit 1), `update` (exit 0), `status` (exit 0); the major version reached the project as one compile
  error at the call site.

### Changed

- `jest.config.js`: the private folder is never part of the harness suite (it now holds a project with its own
  packages).
- Long labels are cut to one line in `modules list`.

### Verification

- jest 431/431, 39 suites (`module-standard` 46/46); lint clean 48 files; fixed list in full.
- `_harness_test/track43-module-standard/run-track.js`: 16 scenarios, 16 match, 0 false +/- (scenario 16 is the
  search: area, word, nothing found twice, catalogue). Real library: 114 modules, form findings 0.
- `_harness_test/track45-module-demo/track45-report.md`.

### Honest bound

- Two closed, as far as they go: a project other than a throwaway folder has used the manager (one project, the
  private demo), and module screens have been opened in a browser (one stack, one browser engine, two widths).
- Not checked for the module screens: a screen reader, print, keyboard order through every screen, 200% text
  size, other browsers.
- `--find` matches text. It does not know that two words mean the same feature.

## [2.12.1] - 2026-11-22

### Added

- **Module admission in one command** (`scripts/module-admit.js`, part of G25). Before a module is committed to
  the library it must show four things: the form gate, its own tests, an install into an empty folder through the
  module manager with the tests run inside the installed copy, and the secret scan. They were run by hand, one
  shell line each. One library commit went in while the scan had four findings, because the scan's exit status
  was behind a pipe (the findings were invented test values and were marked in the next commit). The script runs
  the four steps per module and reads every exit status.
  - `node scripts/module-admit.js <name...|--all> --library <dir> [--json]`: exit 0 every step PASS, 1 any FAIL,
    2 usage, 4 something not measured (no test command, a run of 0 tests, a child that never started, unknown
    module, no library).
  - The install step catches a module that passes only beside its neighbours in the library.
  - `secret-scan.js` exports `scanPath` for callers that need the result and not the printed line.

### Changed

- Module standard §8, the module extractor's definition of done, the orchestrator skill and the handoff name the
  admission command where they listed the separate steps.

### Verification

- jest 430/430, 39 suites (new `module-admit` suite 9/9); lint clean 48 files; fixed list in full.
- `_harness_test/track44-module-admit/run-track.js`: 9 scenarios, 9 match, 0 false +/-; the incident is scenario 3
  (form and tests pass, a line looks like a secret: FAIL), its marked twin is scenario 4 (PASS).
- Real library: 88 committed modules, 88 PASS, 0 FAIL, 0 NOT_RUN (more than ten minutes).

### Honest bound

- Admission reads what the module's own tests assert; a module with weak tests passes. Whether the tests are
  enough is the reviewer's judgement.
- The secret scan is textual; a clean scan lowers the risk and does not prove there is no secret.
- Screens inside a module are not opened in a browser by this command.
- Nothing is committed by the script: a person or a session still makes the library commit after exit 0.

## [2.12.0] - 2026-11-22

### Added

- **G25 Modules used like plug-ins.** Operator orders: modules must be separated better and must absorb what the
  projects improve; any session in any folder takes the modules it needs and replaces an old one by the upgraded
  one; every module has a name, the same subfolders and file name rules; the source is stable, the database
  separate, the module detachable; go through every project, take the better variant of each feature, bring it over
  tidied, and keep both sides in step.
  - `knowledge_base/00_MODULE_STANDARD.md`: one name (`영역-기능`), one folder, the same ten subfolders
    (`core api user admin db text style adapters test docs`), file name rules, a manifest with version, requires,
    settings and origin, the quality bar (tests, own tables, a security note, detachable) and the tidy rules for
    absorption (the better variant, fewer lines and files, errors fixed in the module).
  - `scripts/module-check.js`: the form of a module, 26 rules; exit 0 PASS, 1 FAIL, 4 no module.
  - `scripts/modules.js`: `list`, `add` (with what the module requires), `status` (0 current, 1 a newer version
    exists, 4 nothing installed; `--allow-none` for projects without modules), `update` (refuses when the project
    changed a file inside the module; `--force` keeps the project's edit as a copy), `remove`, `drift` (origin paths
    changed in the source project since the module was taken). A project records version and hashes in
    `coolhan.modules.json`; text is hashed with normalized line endings.
  - `scripts/module-convert.js`: older stack-neutral packages into the standard form, never overwriting an existing
    module.
  - Kit: the launcher's `modules` is the module manager (the library's older loader is `modules-loader`); a fixed
    check for installed modules; standing order O-19 (take modules, give improvements back) in the registry, the
    project kit and the global block.
- **Kit carried through a real small site (track42)** and nine kit defects fixed: the planning gate requires
  located deliverables to exist (`trace-file-missing`); the supervisor names a client that is not logged in; the
  lesson tool works inside a project; the launcher runs in a module-type project; the wave planner counts edited
  files; the completion gate reads unit IDs written as `U-01`; `single-source-check --skip-files`; the goal file
  keeps the operator's own words (`new-project.js --command`); the ledger template asks for the integration review.
- Plan reviewer: the review is repeated after fixes; a unit that builds shared pieces carries its own check; a
  unit's verification must run with only its dependencies built.

### Verification

- jest 421/421, 38 suites (new `module-standard` suite 45/45); lint clean 48 files; fixed list in full.
- `_harness_test/track42-kit-e2e`: one operator sentence to a verified site: 13 units, 191 site tests, site fixed
  checks 통과 10 · 실패 0, 28 accessibility rows that need a person left open on the site's own ledger.
- `_harness_test/track43-module-standard/run-track.js`: 15 scenarios, 15 match, 0 false +/-.
- Real module library: 68 older packages converted, form gate PASS, the modules' own 332 tests pass; origins that
  moved on since extraction: 109 in 44 modules.

### Honest bound

- The gate checks a module's form. That it stands alone is shown by its own tests and a throwaway install.
- Packages of the library that carry screens, server code and database fragments are still in the older layout.
- Update replaces a module folder; it does not migrate a database.
- `drift` counts commits on origin paths; whether a change is an improvement is decided by reading it.
- No project other than throwaway folders and the demo site has used the manager yet.
- Whether a fresh session in another folder obeys the global block is still not observed: the bundled command line
  client is not logged in on this machine.

## [2.11.1] - 2026-11-17

### Fixed

- **D-13: why a hook child process sometimes never starts.** The cause on the machine is a shortage of commit
  (the virtual memory the system can still promise), not CPU load. Evidence: all 4 full runs that failed with
  empty hook output ended within 60 seconds of the operating system's «low virtual memory» record; 6,960
  launches with every core busy and memory to spare all started; and the failure was reproduced in isolation by
  launching the hook inside a job object with a shrinking commit limit (`_harness_test/track41-machine-headroom`).
  A node child running a hook needs about 48MB to start. Below that it dies before its first line: a V8 fatal
  «out of memory» (0x80000003, 0xC0000409), «VirtualAlloc failed», a silent 0xC000012D, 0xC0000017 or 0xC000009A, and
  finally a spawn error. In every case stdout is empty.
- `scripts/lib/spawn-node.js`: those measured signatures are `memoryDenied`; `neverStarted` includes them, so a
  starved child with an out-of-memory line on stderr is retried like a silent one (before, only a child with no
  output at all was). The retry note carries the free physical memory and names the probe.
- `scripts/checks-run.js`: a check refused memory is 확인 안 함 with the reason, not 실패 of the code. Any run that
  is not all 통과 prints the machine state beside the result (JSON: `machine`).

### Added

- **`scripts/resource-check.js`**: how much memory a new process can still get. Windows: commit headroom and the
  largest consumers by name. Linux: available memory plus free swap. Exit 0 enough, 1 low (child processes may
  not start: hooks, tests, gates), 4 could not measure (never a pass). `--min-free-mb <n>` (default 1024), `--json`.
- `scripts/nonstop.js`: before launching a session the supervisor reads the headroom; while it is low it waits
  (60 seconds, at most 10 times), then launches anyway and writes LOW in the session log. Every session's log
  line carries the reading.
- Field lesson F-41 (a failure with empty output blamed on code or load; record the exit code, stderr and
  memory headroom with the failure, count «did not start» as 확인 안 함, reproduce a shortage inside a limited
  process tree).

### Verification

- jest 370/370, 37 suites (new `resource-check` suite 13/13, `nonstop` +3); lint clean 48 files; fixed list in full.
- `_harness_test/track41-machine-headroom/run-track.js`: 11 scenarios, 11 match, 0 false +/-.

### Honest bound

- The link between the operating system's record and the failing runs is an observation (4 of 4), not a
  controlled experiment on the whole machine; exhausting the machine's memory on purpose would endanger every
  other process on it. The controlled part is the job object.
- The harness cannot make a hook start when the machine refuses memory. In an interactive session that moment
  has no stop block; only the outer supervisor waits and relaunches.
- The 1,024MB floor is a default (about twenty children of the measured size), not tuned on other machines.
  macOS is not measured (exit 4). The job-object track runs on Windows only.
- One full test run during this work ended with exit code 127 and no summary line while the headroom reading was
  PASS before and after; the next runs passed. Cause unknown; registered as D-14 (open).

## [2.11.0] - 2026-11-17

### Added

- **G24 Standing orders for every session: no command word, no per-project setup step.**
  Operator question: do all sessions now use CoolHan, or must each command say so; applying it must be simple and
  every command must carry CoolHan's rules. Before this release the orders applied only inside the harness
  repository and inside folders where the project kit had been installed.
  `node scripts/install-global.js` writes one managed block into the user-level instruction file (loaded by every
  session in every folder): all standing orders derived from the registry, the harness location, the module
  library location, and the rule that development in a folder without `coolhan.project.json` starts by installing
  the project kit without asking. The operator's own text in that file is never touched and the file as it was
  before the first install is kept beside it. `--check` exits 0 when the block is the derived one, 1 when stale,
  4 when not installed (not a pass); `--remove` restores the file byte for byte. Settings and hooks are not
  changed: loop hooks stay per project.
- **`new-project.js --check`**: an installed kit's orders block, launcher and hooks equal what the harness derives
  (0), are stale (1, files named, nothing rewritten) or the folder has no kit (4). New projects carry it as a row
  of their fixed check list.
- **Install guard**: the kit refuses the harness folder itself and the module library (exit 2).
- `docs/CHECKS.md` C13: this machine's global block is current.

### Fixed

- D-2, D-3, D-4: the argument helper copied into 8 scripts, `parseFlags` in 3 and `readText` in 3 now live once in
  `scripts/lib/cli.js` and `scripts/lib/fs.js`. Single-source baseline: duplicate helpers 3 groups to 0.
- D-8: the update checker reported nothing when the local version record could not be read or written; it now
  prints the reason. Field-lesson baseline: swallowed errors 4 to 0.
- `field-lessons validate` reports the number of standing orders beside the number of lessons.
- `scripts/lib/spawn-node.js`: child launches in the hook tests are retried only when the child never started (D-13).

### Verification

- jest 354/354, 36 suites (new `install-global` suite 13/13, `spawn-node` 4/4); lint clean 48 files; fixed list in full.
- `_harness_test/track40-global-orders/run-track.js`: 16 scenarios, 16 match, 0 false +/-.

### Honest bound

- Installed and derived is proven; obeyed is not: no fresh session in another folder was observed. The block adds
  about 8 KB to what every session loads. A folder's own `CLAUDE.md` takes precedence where it carries the same
  order number.
- D-13 (mitigated, kept open): twice a full test run failed because a hook child process returned nothing. Measured
  under CPU saturation: one burst of 37 spawn errors and 4 children dead at start in 1,200 launches, then 0 in
  5,700. The child never started; the hook code did not run. `scripts/lib/spawn-node.js` (`runNode`) retries only
  that case (spawn error, no exit status, or non-zero with no output at all), reports each retry, and never retries
  a script that ran. The hook tests use it. In real use a hook that cannot start is outside the harness's reach:
  the session's host decides what a failed hook means.

## [2.10.0] - 2026-11-17

### Added

- **G23 Standing orders and the project kit: the operator stops repeating commands.**
  Operator report: across every session and every site the same commands were issued again, and a new site meant
  issuing them once more; the module library built from those sites (`00Module_site`) should be used. Measured
  first: 4,286 operator messages in 9 projects (private store, G18) contain a continue-type order 530 times
  ("이어서 진행하라" alone 118), deploy 259, commit 152, verify 110, parallel agents 47, design corrections 45. Cause:
  a project folder carried none of it (no orders, no loop hooks, no ledger, no fixed checks, no module plan), and
  the loop hooks armed only on the harness command word.
  - **Orders as registry data.** `knowledge_base/field-lessons.json` gains `orders` (O-01 to O-18): continue is the
    default, silence while working, done only after the fixed checks ran, plan before code, four planning
    deliverables, module library first, commit each verified unit by path, deploy by project setting, generated
    handoff, no invented values, no fake data, no explanatory sentences on screen, design default, forbidden
    zones, checks that do not touch production, operator inputs collected once at the end, parallel agents with a
    final review, decided things are not asked again. Each names what enforces it. `field-lessons.js` validates
    and renders them and lists them with `list --kind order --tags`.
  - **`scripts/new-project.js`** starts a new site or adopts an existing folder:
    `node scripts/new-project.js <dir> --intent "<one-line goal>" [--tags] [--deploy none|after-complete] [--modules <library>]`.
    It writes `CLAUDE.md` (orders in a managed block; the rest of the file stays the project's), `coolhan.project.json`,
    `scripts/coolhan.js` (launcher: gates and hooks run from the harness, nothing is copied; harness missing means
    exit 4 for a gate and exit 0 for a hook), the three loop hooks merged into `.claude/settings.json`, ledger, fixed
    checks, decisions, operator-input list, generated handoff, goal and backlog, `docs/plan/LESSON_PLAN.md` and
    `docs/plan/MODULE_PLAN.md`. Existing files are never overwritten; a second run changes nothing.
  - **Module library as a required planning input.** `MODULE_PLAN.md` has one row per bundle of the library with a
    default decision from the project tags (이식 when extracted packages exist, 참조 when only the spec exists, 제외
    otherwise). `plan-doc-check --modules <library>` fails a plan that leaves a bundle unanswered
    (`module-bundle-unanswered`), uses a decision outside 채택/이식/참조/제외 (`module-decision-invalid`) or has no
    table (`no-module-table`). The library is read-only and nothing is copied from it by the kit.
  - **The loop without the command word.** In a folder with `coolhan.project.json` the operator's own continuation
    words (이어서, 계속, 남은 작업, 끝까지, 완성하라) arm the run; one-shot orders and questions do not. `stop-guard`
    finds its completion checker in the harness when the project has no copy.
  - **`scripts/handoff-write.js`** generates the state block of `HANDOFF.md` from the ledger (goal, counts, current
    position, open defects, recent commits). No ledger means exit 4 and no file.
- `scripts/lib/template.js` (slot fill, managed block upsert) joins the shared library.

### Changed

- `plan-doc-check` on a folder with no document exits 4 (NOT_RUN) instead of 2: nothing scanned is not a usage error
  and not a pass.
- Five agents (intent-analyzer, spec-writer, plan-reviewer, developer, devops-deployer) carry a G23 section; the
  orchestrator's Phase 0 reads `coolhan.project.json` and the orders block; Task 2.5 names `--modules`.

### Verification

- jest 337/337, 34 suites (new `project-kit` suite 19/19); prompt-modernization lint clean 48 files;
  single-source ratchet unchanged {duplicate helpers 3, sentences 95}; field-lesson ratchet unchanged.
- `_harness_test/track39-project-kit/run-track.js`: 25 scenarios, 25 match, 0 false +/- (fresh project, adopted
  project kept byte-identical, idempotent re-run, tampered block restored, 6 prompts that must not arm, 3 that
  must, stop and ask blocked while the backlog is open, recorded stop condition allowed, harness missing, module
  plan gate four ways, handoff with and without a ledger, the real library 26 of 26 bundles answered).

### Honest bound

- Orders are text an agent reads plus the gates each order names; an order with only "규칙" in its enforce cell is
  not mechanically checked. Counts come from keyword classification of the private message store.
- Deploy and push stay operator-authorized (`deploy: none` by default). A new project folder does not contain the
  agent team: sessions read the pipeline from the harness folder, or the operator installs the skills once.
- Default module decisions come from a tag map and are a starting point the plan must review.

## [2.9.0] - 2026-11-11

### Added

- **G22 Field lessons: every project already built, mined into one registry that plans and code are checked against.**
  Operator order: absorb what the sites under the workspace taught (methods that made development fast and
  error-free, and the failures) so future sites inherit the first and are kept from repeating the second; the
  builder's purpose is a correct 기획서 with no human command and a result that matches it with no further command.
  Eight analysis agents read the eight project families read-only (decision logs, handoffs, ledgers, commit
  subjects, self-written check scripts; coverage stated per family; per-project evidence kept in git-ignored
  `.coolhan-private/site-lessons/`). The generalized result is `knowledge_base/field-lessons.json`: 40 failure
  patterns and 24 working practices, each with tags, owners, the project families it was seen in, and how it is
  enforced, plus a field module catalog (26 bundle specs and 7 checker families). `scripts/field-lessons.js`
  derives everything from that one file: `validate` (ids, fields, every failure enforced by plan, gate or detector,
  no e-mail or URL in a public registry), `render` → `knowledge_base/00_FIELD_LESSONS.md` (`--check` fails on a
  hand-edited doc), `list --owner/--tags/--kind` (the checklist an agent reads), and `check <root>` (detectors
  are registry data: swallowed errors, numeric fallbacks for rates and amounts, fake data in product code,
  skipped tests, client-sent amounts on payment paths, ad-hoc money rounding, request-derived absolute URLs,
  client-exposed secrets and unverified token decode, internal keys in screen text, tree-wide git commands in
  scripts; strict or ratchet against a baseline; `field-lessons:allow`).
  Plan time: `plan-doc-check --lessons <registry> [--tags]` requires a line `교훈 태그: …` and a 실패 방지 대응표
  with a row for every applicable failure pattern (`no-lesson-table`, `lesson-unanswered`).
- **Lesson-driven hardening of existing gates.** A check that scanned nothing is NOT_RUN, never a pass (the
  most widespread failure, seen in all eight families): `field-lessons check`, `single-source-check` and
  `no-placeholder-check` exit 4 on an empty scan and `checks-run` reports a child's exit 4 as 확인 안 함.
  `progress-check` rejects duplicate task numbers and duplicate D-numbers. `single-source-check` ratchet fails
  `scan-scope-shrunk` when the scanned file count fell below the baseline's (numbers must fall by fixing, not
  by moving code out of scope; `--allow-scope-shrink` to accept a real deletion). `plan-doc-check` adds
  `decision-without-default`: a `[결정필요]` states the default the work proceeds on, so planning does not stop
  to ask.
- Wired into 17 agents (one derived-checklist section each plus one role line), the orchestrator (Phase 0 read
  list, engine loop G22 block, Task 2.5 gate command), the SDLC map and `HANDOFF.md`; the release ritual now
  stages by path instead of the whole tree. Self-applied: `docs/CHECKS.md` C10–C12 and
  `docs/FIELD_LESSONS_BASELINE.json`.
- Honest bounds: the analysis sampled documents (large decision logs were read in part, application source
  mostly not); detectors see textual signatures only; a lesson is an observed correlation, and a plan may answer
  "해당 없음: 이유". Tests field-lessons 15/15 (total 317/317, 33 suites); track38 adversarial: clean
  project → PASS, ten detectors each fire once at file:line, ratchet grow → FAIL, empty scan → exit 4, plan with all
  rows → no lesson finding, two rows removed → both named, no table → ids listed, duplicate ledger ids, scope shrink,
  abstaining children; 0 false +/-.

## [2.8.0] - 2026-11-11

### Added

- **G21 Planning-document standard: the user's 기획서 제작 마스터 프롬프트 installed as KB + gate.**
  User pointed at `MASTER_PROMPT.md` (a senior-planner prompt: product definition with out-of-scope list and
  measurable success criteria; ten principles incl. no explanatory sentences on screen with `?` tooltips of at
  most 10 어절, domain-derived colors, no AI-looking design or generic file names, zero-dependency default,
  threat-model-first security, per-layer copy protection, key-based translation, evidence tags
  [관찰]/[실측]/[추론]/[미검증]/[결정필요], no hype words or em dashes; required deliverables plus twelve
  commonly forgotten items; minimum specs per item; parallel work split with one authority per identifier;
  completion definition; short report) and said "이게 좋다. 적용하라". Installed as
  `knowledge_base/00_PLANNING_DOC_STANDARD.md` (the prompt generalized with `{{ }}` slots so §1-§8 are kept
  and the music-specific parts become examples, plus the gate's notation rules, relations to G19/G20/G9 and
  the honest bounds) and made mechanical in `scripts/plan-doc-check.js` (14 rules: no-traceability-table ·
  trace-unlocated · trace-missing-item (`--required`) · table-blank-cell · deferred-marker ·
  unverified-without-method · decision-without-reason · tooltip-too-long · em-dash · hype-word ·
  diagram-missing · id-conflict (across tables and files) · missing-section (the §4.2 twelve items, scope-out
  list, success criteria) · success-criteria-count; fenced code skipped, `plan-doc-check:allow`; exit 0/1/2).
  Wired: Intent Analyzer (evidence tags, required-items list), Spec Writer (§4.2/§5/추적표, run the gate), Plan
  Reviewer step 0 (FAIL blocks Task 3 before G3), UX Design Lead (screen text discipline, exception list),
  SKILL.md (trigger "쿨한으로 기획서 만들어", Task 2.5, engine-loop G21 block), SDLC map row. New S8
  `scripts/lib/fs.js` (`listFiles`) and `md-table` helpers (`tablesIn`, `proseLines`); gate messages in the S2
  dictionary. Documented relation: the prompt's "no generic file names" and G19's `services/ai` layer are
  reconciled by renaming the layer through `ai-arch-check --service-dirs`; CoolHan's 5-line report cap wins
  over the prompt's 6 lines. G20 ratchet gained `--skip-dirs` (research or deliverable folders such as
  `docs/` are not project source; D-6) and the gate's own first self-run removed three hardcoded labels and its
  own em dash (D-7). Tests 17/17 new (plan-doc-check 16, single-source --skip-dirs 1; total 297, 32 suites); track37 adversarial: compliant → PASS, one defect per rule → each FAIL named at
  file:line, cross-file ID conflict, empty folder → exit 2, 0 false +/-. Honest bound: the gate proves the form
  of the document; whether a fact tagged [관찰]/[실측] was observed, whether a diagram was looked at, and
  whether the plan matches the user's intent remain with the Plan Reviewer and the human.

## [2.7.0] - 2026-10-31

### Added

- **G20 Minimal source · single source of truth · progress ledger — user doctrine installed as KB + three gates.**
  User supplied a standing development doctrine (§0 제0 규칙: the fewest lines that implement the feature, 중복 0;
  §1 eight single sources S1 design tokens / S2 text dictionary / S3 external-target registry / S4 derived-table
  function / S5 settings catalog / S6 entitlements / S7 menu map / S8 shared library; §2 five questions before any
  new file; §3 exceptions as registry cells not `if`; §4 incremental migration order with a behaviour-invariance
  gate first and new-code-first rules; §5 invariance proof; §9 `docs/PROGRESS.md` is the truth, not the chat;
  §10 only two words — 완료 with evidence or 진행 중(남은 항목); §11 verification = the fixed list in
  `docs/CHECKS.md` run in full, reported as 통과 n · 실패 m(D-번호) · 확인 안 함 k(이유); §12 fix only by
  defect number; §13 ask vs decide). Installed as `knowledge_base/00_MINIMAL_SOURCE_PRINCIPLES.md` (full
  doctrine + CoolHan enforcement map + harness self-conformance) and made mechanical where checkable:
  `scripts/progress-check.js` (goal line · 대기/진행 중/완료 only · 완료 needs test numbers or a commit hash ·
  hedges forbidden · 현재 위치 must name a task · 가정 · 결함 D-n with 열림/닫힘), `scripts/checks-run.js`
  (every CHECKS.md command as a real child process; failures bound to the ledger's open D-numbers or flagged
  미등록; manual / tool-missing / timeout = 확인 안 함 with reason, exit 4, never a pass) and
  `scripts/single-source-check.js` (`--measure` numbers per §4-a: files, max file, duplicate helpers by
  name+normalized body, inline styles, hardcoded human-language strings outside dictionary dirs, external-target
  literals via `--targets`; strict mode for new projects; `--write-baseline` / `--baseline` ratchet — counts
  may shrink, never grow). Wired: Developer (제0 규칙, 5 questions, ratchet pre-commit, ledger-in-place,
  fix-by-D-number), Validator stage 7 (both gates + the three checks-run numbers in §8), Self-Auditor check 7
  (ledger truth, scope line per unit), Spec Writer (single-source map section), orchestrator Phase 0 (reads
  PROGRESS/CHECKS) and UNIT PREAMBLE ("이 단위가 목표에 속하는가" line). Harness self-applied under §4-d: new S8
  `scripts/lib/` (md-table · cli) and S2 `scripts/messages/` used by the three new scripts; legacy duplicates
  (3 pairs) and inline strings (95) frozen in `docs/SINGLE_SOURCE_BASELINE.json`; this repo's ledger
  `docs/PROGRESS.md`, fixed list `docs/CHECKS.md` (C1–C9) and map `docs/SINGLE_SOURCE_MAP.md`. The gates
  found and closed their first defect on the harness itself (D-1: no-placeholder-check reported its own pattern
  table — now skips its own file) and registered three open ones (D-2..D-4 legacy helper duplicates). Tests
  29/29 (total 279/279, 31 suites); track36 adversarial: compliant → PASS, violations → every rule FAIL named
  at file:line, fake ledger → 4 findings, fixed list → 통과 2 · 실패 1(D-1) · 확인 안 함 1, ratchet grow → FAIL /
  shrink → PASS, 0 false +/-. Honest bound: textual heuristics — renamed duplicates, hand-made derived tables,
  scattered settings and one-off files are not detected; a ledger PASS proves evidence text, not its truth.

## [2.6.0] - 2026-10-29

### Added

- **G19 AI Agent architecture principles — "right brain for the right task" installed as KB + gate.**
  User supplied a standing architecture doctrine (LLM = reasoning brain; Decision Model (Jev / Cloudflare
  Clef / Clef-flash) = fast bounded decisions; Vision Decision Model for images; deterministic code for
  deterministic rules; Application Code always owns the final action; structured output + schema
  validation; thresholds are business rules in code; §13 five questions before any AI feature; §14
  ten-field Architecture Decision record; §15/§16 `services/ai` abstraction, no vendor lock-in; §17
  review checklist; §18 "explain first, then deviate"). Installed as
  `knowledge_base/00_AI_ARCHITECTURE_PRINCIPLES.md` (full doctrine + CoolHan enforcement map + C3-verified
  facts on Jev/Clef dated 2026-10-29 under C12) and made the statically checkable subset mechanical in
  `scripts/ai-arch-check.js` (8 rules: ai-call-outside-service-layer · ai-service-executes-action ·
  no-schema-validation · no-architecture-decision-record · record-incomplete/invalid ·
  deterministic-not-code · llm-for-bounded-decision (no Rationale) · threshold-not-in-code; PASS / FAIL /
  NOT_APPLICABLE, `--service-dirs`, `--records`, `ai-arch-check:allow`). Wired: Spec Writer (§13 answers +
  §14 record in `docs/AI_DECISIONS.md`), Plan Reviewer step 2.5 (script + §13/§17 judgment, P1/P0 open
  risks), Developer (layering rules, pre-commit run), Validator stage 7 (FAIL → stage FAIL), Security
  Reviewer step 3.7 (AI-result-to-action boundary), engine loop. Honest bound: the gate proves no
  checkable violation, not that AI was truly needed or the model is best — that stays with Plan Reviewer +
  human. Tests 12/12 (total 250/250, 28 suites); track35 adversarial (compliant → PASS, 5 violation fixtures → every rule FAIL named,
  no-AI → NOT_APPLICABLE, 0 false +/-). Self-run on this repo: NOT_APPLICABLE (the harness makes no model
  call; gates are deterministic code, agents are the LLM — already conformant).
- **G18 session learning** — `scripts/harvest-sessions.js` distills every session of this account on this machine
  (curated memories · human utterances only · incident/security lines of each project's docs) into a masked,
  append-only store under git-ignored `.coolhan-private/learned/` plus a regenerated `DIGEST.md` (≤16KB) and a
  ≈4KB `--brief` for session start. `self-growth.js` (G17) reads it as a new evidence source (`learned`:
  repeated imperative directives, per-project incident load, security lines). Automatic via a SessionEnd hook
  (incremental harvest) and a SessionStart hook (brief) — installed in the global
  `~/.claude/settings.json` with operator approval (2026-10-24); effective from the next session. First real run: 12 projects, 2,919 human messages, 774
  lessons, 20 s, zero secret-pattern hits in the output. Private by construction (harness repo has a public
  remote): `.gitignore` entry + test that git ignores it and `package.json files` never lists it.
  Tests: harvest-sessions 11/11 (masking · human filter · incremental · partial line · rebuild · digest cap ·
  brief · gitignore/npm guard) + self-growth `learned` case. Bounds: this account/PC only, keyword
  classification, known-pattern masking, advisory not a gate. Plan: `docs/SESSION_LEARNING_PLAN.md`.

## [2.5.1] - 2026-10-18

### Added

- **12th companion skill: `web-clone`** (Jane/xiaoer, MIT, upstream v1.6.0). User: "쿨한에도 설치해" — it
  existed only in this machine's `~/.claude/skills`, so no project installing CoolHan received it.
  Vendored into `.claude/skills/web-clone` (SKILL.md/LICENSE/README/references/scripts; upstream
  `.git` and promo image not shipped). Wired the same way as the other 11: G16 `EXPECTED` +1
  (12/12 shipped), lint `SKIP_DIRS` +1, install.js message, companion-skills.md row + attribution,
  SDLC-map row, and a Site Analyzer only-if-present section (reverse R1): its real-source recon
  scripts produce C10-admissible evidence; boundary written in — planner-approved targets only
  (P0), reproduce structure/interaction/technique, never copy third-party content/assets. Tests:
  companion 5/5; track32 addendum.

## [2.5.0] - 2026-10-11

### Changed

- **Model-generation upgrade — harness source + method aligned to the Claude 5.x generation.**
  User: "클로드 모델들이 업그레이드 되고있다. 이에 맞게 쿨한 하네스의 소스와 방식을 고도화해야한다."
  The previous model-era pass (v1.3.1/v1.4.0) was built against the 2026-08-07 snapshot; sessions now
  run Fable 5.1 / Opus 5.5 / Sonnet 5.5 / Haiku 5.5 and the API dropped several shapes the old
  prompting idiom relied on. Changes, none of which alter any gate's verdict logic or remove a feature:
  - `references/model-capability-map.md` re-cached 2026-10-11 under the C12 rule (recorded ≠ current):
    §0 snapshot delta, both model-ID families recorded as current (catalog `claude-fable-5` and session
    `claude-fable-5-1`, etc.), §2 API-surface removals (`budget_tokens` → 400; temperature/top_p/top_k and
    assistant prefill removed; `refusal` stop reason + `fallbacks`; no mid-conversation system messages on
    Sonnet 5 → C6 re-injection stays in the user turn), §3 role-based effort policy, pricing deliberately
    not recorded.
  - **Effort policy per agent role**: every one of the 26 agent footers now carries `**Effort:**`
    (xhigh for the 8 agentic/coding roles, high for the 17 judgment/spec roles, medium for marketing-lead);
    the orchestrator passes the tier as the Agent tool's `effort` on dispatch. Thinking is adaptive
    everywhere; "raise the tier, never add step-by-step/double-check scaffolds" is the stated rule.
    SKILL.md relay table names the 5.x lineup (1M-class budget unchanged at 10~15 units; Haiku 5.5 kept at
    200K-class until verified via the Models API) and gained an "Effort policy" subsection.
  - **Behaviour shifts written into the agents, not only the map**: coverage-first reporting sentence in
    Validator / Security Reviewer / Plan Reviewer Core Principles (severity filters depress recall on
    current models); scope-discipline + deliverable-length + "G9 decides delegation" bullet in Developer
    (over-delegation / longer narration on the Opus 5 generation).
  - **Lint extended** (`scripts/prompt-modernization-check.js`): 4 new rule families —
    `legacy-4x-model-ref` (pre-4.6 4.x IDs; 4.6+/haiku-4-5 stay clean), `sampling-param`,
    `prefill` (API context only — a v1 false positive on "pre-filled answer sheet" in intent-analyzer was
    caught in track34 and fixed by narrowing the rule, not by allow-marking the agent), `delegate-more`.
    Tests 20/20 (10 new; total 226/226, 26 suites). Shipped agents+skills lint-clean (48 files).
  - **Track 34** (`_harness_test/track34-model-upgrade/`): 22 scenarios — dated fixtures per rule family →
    flagged, current fixture (12 current IDs, effort/adaptive, G9 wording, domain words) → 0 findings,
    26/26 effort footers match policy, reviewers/developer carry the new sentences, relay/map consistent;
    0 false +/-.

## [2.4.1] - 2026-09-27

### Fixed

- **G17 self-growth precision — false positives found by dogfooding the engine on CoolHan itself.**
  Per the user's "스킬들을 이용해서 이 쿨한솔루션을 분석하여... 고도화하라", ran `scripts/self-growth.js`
  against this repo (the self-analysis the engine exists for). It surfaced 4 DECISIONS candidates of
  which the format-template line (`**Reversible:** yes/no — how to change it later if wrong`) and the
  `**Reversible:** yes — … later` field were NOISE — a self-growth backlog listing non-work makes the
  loop chase phantoms. Tightened `fromDecisions()`: a candidate now requires (1) an actionable field
  line (Decision/Update/Next — not Reversible, not the template), (2) no template/placeholder noise
  (`yes/no`, the template phrase, `<…>`/`{…}`), and (3) a word-bounded genuine deferral token. Real
  deferrals still surface (re-mine: 4 noisy → 2 genuine). Tests 8/8 (decisions case now asserts 2
  real / 3 noise); track33 addendum. The self-growth engine analyzing itself found and fixed its own
  correctness defect — self-growth working as intended.

## [2.4.0] - 2026-09-26

### Added

- **Companion skills shipped in CoolHan base (v2.3.0)** — vendored 11 best-in-class Claude Code
  skills into `.claude/skills/` so `install.js` ships them, and wired the agents to invoke them
  only-if-present (C3): grill-me, codebase-design, implement, diagnosing-bugs, code-review,
  resolving-merge-conflicts (Matt Pocock); frontend-design (Anthropic); web-design-guidelines +
  react-best-practices (Vercel Labs); redesign-skill, taste-skill. `references/companion-skills.md`
  maps each to its CoolHan agent; `scripts/companion-skills-check.js` (G16) is the honest presence
  probe (shipped vs global; a dir without SKILL.md is ABSENT). Skill advice improves the maker side
  but is never gate evidence (C10). Tests 5/5; track32.
- **G17 Self-Growth Engine — CoolHan becomes 자기성장형 (v2.4.0)** — `scripts/self-growth.js` mines
  CoolHan's OWN durable evidence (G5 ledger recurrences, docs/DECISIONS deferrals, run-report
  escalations/unvalidated units, pending proposals, and applied-site verdicts via `--sites <dir>`)
  into a ranked `_workspace/_self-growth-backlog.md` that feeds the non-stop loop — the harness
  proposing its own next enhancements, each still run through the full per-feature ritual
  (tests + adversarial track + G1–G16). Wired into the engine completion gate. Honest bound (C10):
  proposes from RECORDED on-disk evidence, not from un-accessible cross-account transcripts;
  cross-session growth accrues because every run appends to the artifacts it reads. Advisory,
  never edits the harness itself. Tests 8/8; track33 (0 false +/-); live mine of this repo found
  4 real candidates.


## [2.2.1] - 2026-08-30

### Changed

- **G15 hardening probe extended from a real coolhanx.com run (5 → 7 checks + honesty on the
  one remaining item):**
  - **H6 automation tools** — python-requests/HeadlessChrome/curl/Go-http-client/Scrapy must be
    blocked (matches the field run).
  - **H7 search-index preserved** — Googlebot/Bingbot/Yeti(Naver)/Daum/facebookexternalhit must
    stay 200; blocking declared indexers is a FAIL (SEO regression) — the balance counter-weight
    to H1 so hardening does not silently kill search.
  - **H2 fingerprint fix reclassified as operator-approval:** X-Powered-By/x-nextjs-cache are
    re-attached by the framework/server after app middleware, so app-level deletes and repo
    next.config.js do not take effect if the deploy script does not ship the server config; the
    durable fix is a server-file change (web-server Header unset OR server next.config.js) =
    forbidden zone. The finding now carries a fix_class saying so, plus an honest note that
    /_next/ asset paths reveal Next.js anyway (finishing work, not concealment). This encodes the
    exact coolhanx.com limitation so no future run misreads a header PASS as "framework hidden".
  - AI-agent UA list extended with OAI-SearchBot + GPTBot. Tests 14/14 (total 203/203); track31
    re-run: vulnerable origin → FAIL (with fix_class + /_next note), hardened 7/7 → PASS; 0 false +/-.


## [2.2.0] - 2026-08-29

### Added

- **G15 Production edge/bot hardening probe** — turns 5 real user-reported production holes into
  a repeatable gate measured over real HTTP (`node scripts/hardening-check.js <base_url>`): H1
  AI-agent-UA bypass (allowlist-before-blocklist served ChatGPT-User/Claude-User/PerplexityBot a
  200 HTML page — API was locked, web layer was not), H2 stack-fingerprint headers
  (X-Powered-By/x-nextjs-cache/server:Express), H3 framework 404 leak (Express "Cannot GET /api"
  → neutral 404), H4 UA coherence (claims Chrome but no sec-ch-ua+sec-fetch-mode → block), H5
  robots.txt disallows AI answer/agent crawlers. Each check PASS/FAIL/NOT_RUN; a FAIL is a
  measurement (read middleware/robots/nginx source before fixing); unreachable origin → NOT_RUN,
  never a false PASS. Wired into security KB §7, agents/security-reviewer.md (step 3.6) and
  agents/commercial-readiness-auditor.md (pre-check before the 5 commercial criteria). nginx
  stays a forbidden zone for automated fixes. Tests 10/10 (total 199/199); track31 adversarial
  with real HTTP servers: vulnerable origin → FAIL naming all 5, hardened origin → PASS; 0 false
  +/-.


## [2.1.0] - 2026-08-07

### Added

- **G14 Commercial-Readiness Gate (상용화 판정)** — judges whether a deployed web service is
  commercially shippable by 5 user-facing criteria (NOT by integration presence): 항목(fields
  save+reload), 저장(partial/dup/concurrent integrity), 전송(publish/send/export arrives +
  failure explains next action), 텍스트(DE/EN/KO coverage), 디자인(real-browser
  overlap/clip/h-scroll/tap-targets).
  - `scripts/commercial-gate.js`: per-project config declares a permanent **keeper**
    (repeatable script/test) per criterion; keepers run as real child processes against the
    PRODUCTION base_url (reachability probed by real HTTP and recorded). Keeper-less criterion
    = NOT_RUN, never PASS. Verdict artifact `_workspace/COMMERCIAL_VERDICT_<date>.md` with
    ①가부+이유 ②차단 항목(evidence tails + "측정≠결함, 소스 확인" rule embedded) ③미측정 칸
    정직 신고. Exit codes: READY 0 / BLOCKED 1 / NOT_READY 4.
  - `agents/commercial-readiness-auditor.md`: the audit discipline as P0 rules — 운영 실측만
    증거(로컬 통과 불인정), 측정≠결함(소스 판독 후 판별), 백업→배포→운영 재측정→실패 시 롤백,
    운영 테스트데이터 금지(지킴이 자체 정리), 금지구역(nginx/docker compose/SECRET_KEY/타
    서비스) 접촉 시 STOP, 종료 시 전체 스위트+production_gates.sh 실행(부재 시 정직 NOT_RUN).
  - Tests 7/7 (total 189/189); track30 adversarial with real keeper processes + a real HTTP
    probe of coolhanx.com (HTTP 302 recorded): mixed state → BLOCKED with evidence + NOT_RUN
    honesty, full coverage → READY; 0 false +/-.


## [2.0.0] - 2026-08-07

### Added

- **G13 Nonstop supervisor — the outer loop that makes 무중단 개발 literal**: G10 loops within
  a unit and G11 stops a session from quitting early, but when a session genuinely ends
  (context exhausted, crash, process exit) continuing still required a human to paste the
  baton. `scripts/nonstop.js` removes that last human step: run it once from a terminal and it
  relaunches headless Claude Code sessions (`claude -p "쿨한으로 개발 이어서 진행하라"
  --permission-mode bypassPermissions`, template configurable) until completion-check exits 0.
  - Stops ONLY on named conditions with distinct exit codes: COMPLETE(0, auto-generates the
    G12 run report) · CMD_ERROR(2) · STOP_APPROVED(3, a recorded human-decision stop) ·
    NO_PROGRESS(4, 3 consecutive sessions changed nothing — never spins on a wedged run) ·
    MAX_SESSIONS(5, default 50 cost valve).
  - Per-session evidence (exit code + output tail) appended to `_workspace/_nonstop-log.jsonl`;
    progress measured by real backlog diffs, never by session exit codes alone; stale
    stop-approvals honored (a recorded ESCALATE launches zero sessions).
  - Tests 9/9 (total 182/182); track29 real-process adversarial: 3-unit backlog driven to
    COMPLETE in exactly 3 sessions, broken session command → NO_PROGRESS halt with raw error
    tails, pre-recorded ESCALATE → zero launches; 0 false +/-.


## [1.9.0] - 2026-08-07

### Added

- **G12 Run Observability Report** — the Foundation/Observability layer of the agent-loop
  roadmap: `scripts/run-report.js` composes the artifacts that each recorded one slice of a run
  (G5 ledger, G10 loop state, G8-B backlog, improvement proposals, design history) into one
  readable report (`_workspace/run-report.md` + `--json`):
  - backlog completion % with remaining/unvalidated units named; per-gate PASS/FAIL/NOT_RUN
    counts (filterable by `--run-id`); per-unit loop iterations, escalations, and last raw
    failure tail; recurring failure lessons (≥2× same gate+reason); pending proposal count.
  - Observer only — never changes a verdict, never blocks; an empty workspace produces an
    honest "nothing recorded — not proof of completion" report.
  - Wired into the engine loop's completion gate (generate + cite the path in the final
    ≤5-line report) and recommended for mid-run "지금 어디까지 됐어?" asks — hand the path
    instead of narrating.
  - Tests 6/6 (total 173/173); track28 adversarial: realistic mid-run state → correct
    completion/filtering/lessons/escalation/proposal counts (a separator-row over-count was
    caught and fixed during the track); empty workspace → honest caveat; 0 false +/-.

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
