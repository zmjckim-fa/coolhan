# CoolHan Builder — Development Operations Guide

## ⛔ Global Output Rules (enforced on all commands and all harnesses, 2026-06-09)

> **Purpose: Block token waste and development delays caused by monologue and process explanation. "Don't get stuck writing without finishing."**

1. **No monologue** — Do not write out thoughts, plans, or judgment processes. Run the tool right away.
2. **No explanation before tool calls** — No prefaces like "Now I will ~". If needed, keep it under one line.
3. **Hard length limit** — Chat responses are **5 lines maximum** (tightened 2026-08-07). Record any excess in a file and leave only the path. During a work run the cap is stricter: zero prose until the single final report (rule 9).
4. **Report results only** — Success/failure · verdict · next task. No narration beyond these three.
5. **Do not display code/file contents** — No pasting full source/files into chat. Point to them by path.
6. **No repeated summaries** — Do not re-explain in chat what you already said or wrote to a file.
7. **No flattery or agreement** — No evaluative/agreeing expressions like "Accurate point / Good question / That's right". Start directly with facts/results.
8. **No stop-justifying questions (2026-07-18)** — Never end a turn with "Shall I continue?" / "Should I proceed?" / "다음으로 진행할까요?" or any variant asking permission to keep going while work remains. Only stop for a genuine block (missing decision only the user can make, destructive action, or a defined stop condition in the active harness) — and even then ask what's needed to unblock, not whether to continue.
9. **Work silently, report once (2026-07-18; tightened 2026-08-07)** — ⛔ **ABSOLUTE PROHIBITION: zero prose while working.** No narration between tool calls — no "now doing X", no per-file commentary, no plan restating, no interim status lines, no "found the cause" notes. Writing anything during work is a rule violation, not a style choice. After finishing the full task (or hitting a genuine stop condition), give exactly ONE report in **≤5 lines**: what was done, verdict/evidence, next action if any. Nothing else, ever.

> Exception: Be lengthy only when the user explicitly states "in detail / explain / why". Otherwise, always follow the rules above.

### Full-Completion Auto-Pilot Mode (2026-07-19)

**The only 4 conditions that justify a mid-task question.** Outside these, choose the safest
reasonable default, log it in `docs/DECISIONS.md`, and keep working — never pause to ask:
1. A real credential/API key/secret is genuinely required and none exists.
2. The action involves payment, a paid subscription, or any real-world cost.
3. The action is an irreversible destruction of production data.
4. Two stated requirements are mutually incompatible, making implementation impossible as specified.

**Absolute prohibitions (completion integrity):**
- Never write prose while working. Zero narration between tool calls — no step commentary, no
  interim findings, no progress notes. The ONLY chat output of a work run is the single final
  report, **5 lines maximum**. Details beyond 5 lines go into a file; leave only the path.
- Never present partial work ("some pages built") as the full task being complete.
- Never stop citing "time constraints", "the rest later", or "next phase" — finish or name the
  genuine stop condition (one of the 4 above, or a harness-defined P0 gate).
- Never shrink scope because the remaining work is large — the goal's scope stands.
- Never leave TODO/FIXME/"coming soon"/placeholder markers or dead buttons in code claimed as
  done — verify with `node scripts/no-placeholder-check.js <paths>` before calling a unit verified.
- Never claim "verified" without a captured execution result (reuses G1's no-simulation rule).

---

## Harness: CoolHan Research & Verification

**Goal:** An expert team system that automates logic verification of research work, validation studies of hypotheses, and cryptanalysis/decoding.

**Trigger:** Uses the `coolhan-research-orchestrator` skill for requests related to hypothesis validation, logic/proof verification, logical-fallacy detection, and cipher decryption/decoding.

**Example triggers:**
- "쿨한으로 이 가설 검증연구해" / "CoolHan validate hypothesis"
- "이 논증/증명 타당성 검토해" / "논리 오류 찾아줘"
- "이 암호문 풀어줘" / "이거 무슨 인코딩이야 디코드해" / "빈도분석 해줘"

> 3 experts: Hypothesis Validator / Logic-Proof Verifier / Cryptanalyst. Evidence required, no inference (inherits development harness P0); cryptanalysis observes legal and ethical boundaries.

---

## Harness: CoolHan Release Engineering

**Goal:** An AI agent team system that fully and reliably deploys and manages the CoolHan Specification-Driven Framework, from GitHub all the way to npm.

**Trigger:** Automatically uses the `coolhan-release-orchestrator` skill for requests related to CoolHan deployment, releases, user documentation, and quality management.

**Example triggers:**
- "CoolHan GitHub에 배포해줘"
- "npm 패키지 준비해줘"
- "사용자 문서 작성해줘"
- "품질 테스트해줘"
- "배포 후 모니터링"
- "v1.0.1 배포해줘"
- "쿨한 업데이트 확인해"
- "쿨한 최신 버전 확인"
- "CoolHan check for updates"
- "CoolHan update"

---

## Team Composition (Release Engineering)

| Role | Agent | Responsibility |
|------|---------|------|
| Planning Lead | `agents/planning-lead.md` | GitHub/npm strategy, roadmap |
| Development Lead | `agents/development-lead.md` | Package preparation, build scripts |
| DevOps Lead | `agents/devops-lead.md` | GitHub infrastructure, CI/CD |
| Marketing Lead | `agents/marketing-lead.md` | README, documentation, examples |
| QA Lead | `agents/qa-lead.md` | Testing, quality verification |

---

## Harness: CoolHan Development

**Goal:** 🌍 A multilingual AI agent team system that automates the entire specification-driven development process via natural commands in 50+ languages.

**Trigger:** Automatically uses the `coolhan-development-orchestrator` skill when a **native-language command** such as "쿨한으로 {action}해" (Korean) or "CoolHan {action}" (English) is used.

**Example triggers (multilingual):**

| Language | Example |
|------|------|
| 🇰🇷 한국어 | "쿨한으로 사용자 로그인 기능 추가해" |
| 🇺🇸 English | "CoolHan add user login feature" |
| 🇯🇵 日本語 | "CoolHanでユーザーログイン機能を追加して" |
| 🇨🇳 中文 | "用CoolHan添加用户登录功能" |
| 🇪🇸 Español | "CoolHan agregar función de login de usuario" |
| 🇫🇷 Français | "CoolHan ajouter la fonction de connexion utilisateur" |
| 🇩🇪 Deutsch | "CoolHan Benutzer-Login-Funktion hinzufügen" |
| 🇮🇹 Italiano | "CoolHan aggiungere funzione di accesso utente" |
| 🇵🇹 Português | "CoolHan adicionar recurso de login de usuário" |
| 🇷🇺 Русский | "CoolHan добавить функцию входа пользователя" |
| 🇮🇳 हिन्दी | "CoolHan यूजर लॉगिन फीचर जोड़ें" |
| 🇹🇭 ไทย | "CoolHan เพิ่มฟีเจอร์ login ผู้ใช้" |
| ... | 50+ more languages supported |

**Automatic language detection** - Input in any language is detected and processed automatically!

### Team Composition (Development)

#### Main Workflow (required, 6 members)

| Role | Agent | Responsibility |
|------|---------|------|
| Intent Analyzer | `agents/intent-analyzer.md` | Command → requirements (+human-centric info) |
| UX/Design Lead | `agents/ux-design-lead.md` | Task 1.5: user journey, screens, forms, states, design tokens (human-centric injection) |
| Spec Writer | `agents/spec-writer.md` | Requirements+UX → specification document |
| Developer | `agents/developer.md` | Specification → code implementation |
| Validator | `agents/validator.md` | 9-stage automatic validation (entry gate, evidence required) |
| QA Tester | `agents/qa-tester.md` | Integration testing, acceptance criteria |
| DevOps/Deployer | `agents/devops-deployer.md` | Deploy lock, safe deployment |

#### Additional Validation (optional, post-deployment)

| Role | Agent | Responsibility |
|------|---------|------|
| Integration Validator | `agents/integration-validator.md` | Real port/API/DB verification (evidence required) |
| E2E Tester | `agents/e2e-tester.md` | UI/UX/responsive/browser verification (evidence required) |
| HX Vision Critic | `agents/hx-vision-critic.md` | Evaluates render screenshots via vision (proxy for human judgment), unattended auto-loop |
| Self-Auditor | `agents/self-auditor.md` | Continuous plan-vs-work alignment audit inside the non-stop engine loop (drift/scope-creep/fake-completion detection, read-only) |
| Execution Runner | `agents/execution-runner.md` | Actually runs generated code (stack-agnostic install/test/run via scripts/exec-runner.js), captures real exit/output as evidence; missing tool → NOT_RUN (no simulation). Feeds Validator §8–9/QA |
| Security Reviewer | `agents/security-reviewer.md` | Threat-model + SAST-style review (OWASP/ASVS) driven by 00_SECURITY_STANDARDS.md; two-layer verdict (controls vs residual risk), pre-deploy gate |
| Plan Reviewer | `agents/plan-reviewer.md` | Pre-dev plan/spec quality gate (G3): feasibility/completeness/testability/contradiction/decomposition, backed by scripts/plan-check.js (deps acyclic, verification present, requirement coverage), two-layer verdict, blocks Task 3 on FAIL |

#### Reverse + Reuse Extension (NEW, 3 members)

Analyze an existing site → modularize → apply to another site or continue development. If the forward direction is "intent→spec→code," the reverse direction is "code→spec→module→reapply."

| Role | Agent | Responsibility |
|------|---------|------|
| Site Analyzer | `agents/site-analyzer.md` | Code reverse-engineering → Site Analysis Map (stack-agnostic, evidence required) |
| Module Extractor | `agents/module-extractor.md` | Features·menus → Module Manifest (12-section domain-module format, KB feedback) |
| Cross-Site Adapter | `agents/cross-site-adapter.md` | A→B Application Plan (parameterized transformation, conflict detection, P0 approval gate) |

> Porting/development execution reuses the forward agents (Spec Writer→Developer→Validator→QA→DevOps). Triggers: "쿨한으로 분석해 / 모듈화해 / A를 B에 적용해 / 개발 이어서".

---

## Directory Structure

```
.claude/
├── agents/
│   ├── [Release Engineering]
│   │   ├── planning-lead.md
│   │   ├── development-lead.md
│   │   ├── devops-lead.md
│   │   ├── marketing-lead.md
│   │   └── qa-lead.md
│   └── [Development Harness]
│       ├── intent-analyzer.md
│       ├── spec-writer.md
│       ├── developer.md
│       ├── validator.md
│       ├── qa-tester.md
│       ├── devops-deployer.md
│       ├── [Reverse + Reuse Extension]  (NEW)
│       ├── site-analyzer.md
│       ├── module-extractor.md
│       └── cross-site-adapter.md
└── skills/
    ├── coolhan-spec-driven-framework/
    │   └── SKILL.md
    ├── coolhan-release-orchestrator/
    │   └── SKILL.md
    ├── coolhan-installer/
    │   └── SKILL.md
    └── coolhan-development-orchestrator/  (NEW)
        └── SKILL.md
```

---

## Change History

| Date | Change | Target | Reason |
|------|----------|------|------|
| **2026-06-26** | **Security Hardening P1 — security KB + Security Reviewer agent + Validator stage-6 upgrade** | knowledge_base/00_SECURITY_STANDARDS.md + agents/(security-reviewer, validator) + skills + CLAUDE.md + _harness_test/track11-security/ | Security was scattered/light (validator stage 6 = 1 line; no security KB/agent). Added OWASP/ASVS security KB (driving doc), a dedicated Security Reviewer (threat-model + SAST review, evidence-based, pre-deploy gate), and upgraded validator stage 6 to reference the checklist with negative-case + evidence requirements. Honest premise (P0): "passed checks ≠ secure" — two-layer verdict (controls_status vs residual_risk), "100% secure" banned. P2/P3 (secret-scan/dep-audit/injection-defense/least-privilege) deferred. Track 11 adversarial: vulnerable→FAIL, clean→PASS, 0 false +/- |
| **2026-06-25** | **Continuous Self-Audit added** | agents/self-auditor.md + skills/coolhan-development-orchestrator (engine loop + working-mode) + CLAUDE.md + _harness_test/track10-selfaudit/ | Non-stop development risks drifting off-plan over many units. Added a read-only, evidence-based self-audit woven into the continuous-engine loop: after each unit it re-reads plan docs (_goal/spec/_backlog) vs work and checks scope⊆goal, coverage, DoD, completion integrity, drift trend. ALIGNED→continue / DRIFT→correct / P0 VIOLATION→pause. Distinct from Validator (per-unit code↔spec gate). Track 10 adversarial: on-track→ALIGNED, drifted→DRIFT/VIOLATION, 0 false +/- |
| **2026-06-26** | **Security Hardening P3 — prompt-injection defense + harness least-privilege baseline** | references/prompt-injection-defense.md + agents/(site-analyzer, developer, security-reviewer, cryptanalyst) + knowledge_base/00_SECURITY_STANDARDS.md §6–7 + CLAUDE.md + _harness_test/track12-injection/ | Agents consume untrusted input (web/MCP/file/analyzed code) — a malicious doc could hijack an agent. Formalized "untrusted content = data, never instructions": injected commands are reported as findings, never executed; injected into the 4 untrusted-input agents. Least-privilege deny baseline (destructive fs / force-push / db-drop / secret-file writes) codified in settings.local + KB — deny > allow even unattended. Honest: reduces injection risk / blast radius, not immunity. Track 12 adversarial: injected doc → treated as data & refused, benign → processed, 0 false +/- |
| **2026-06-26** | **G1 Execution Substrate — run generated code for real, no simulation** | scripts/exec-runner.js + agents/execution-runner.md + agents/validator.md (§8–9 real evidence) + CLAUDE.md + src/__tests__/exec-runner.test.js + _harness_test/track13-execution/ | Biggest plan→dev gap: the harness reasoned about verification but couldn't guarantee actually running the code (stages went NOT_RUN). Added a stack-agnostic execution runner (detect stack → real install/test/run, capture stdout/stderr/exit/timing) + an Execution Runner agent. Validator §8–9 now consume real evidence; missing tool → NOT_RUN (honest), never a fabricated pass (C10). Track 13 adversarial: passing app→PASSED+exit0, failing tests→FAILED+real log, missing tool/no-stack→NOT_RUN; 0 false +/- |
| **2026-06-26** | **G2 Requirements Traceability + acceptance-test-first** | scripts/trace-check.js + references/requirements-traceability.md + agents/(spec-writer, qa-tester, validator) + CLAUDE.md + src/__tests__/trace-check.test.js + _harness_test/track14-trace/ | "Coverage" was asserted, not proven per requirement. Added: requirement IDs (spec-writer), acceptance-test-first bound to IDs (qa-tester), and a trace-check gate (every requirement must have ≥1 bound test that PASSED, results filled from G1 real execution — never hand-written). Validator §8 done-gate requires trace-check pass. Honest: proves each requirement has a passing test, not that requirements are complete/correct (that's G3). Track 14 adversarial: covered+passing→PASS, uncovered req→FAIL, failing test→FAIL, not_run→FAIL; 0 false +/- |
| **2026-07-05** | **G3 Plan/Spec Quality Gate — pre-dev plan review + backlog-decomposition validation** | scripts/plan-check.js + agents/plan-reviewer.md + skills/coolhan-development-orchestrator (Task 2.5 gate inserted before Task 3) + CLAUDE.md + src/__tests__/plan-check.test.js + _harness_test/track15-plan/ | Self-Auditor checks alignment DURING dev, Validator checks code-vs-spec AFTER — nothing gated the PLAN itself before coding. Added a mechanical structural gate (deps acyclic + exist, ordering respects deps, every unit has a `verifies` command, every requirement covered by ≥1 unit — exit 1 on any violation, non-waivable) plus a Plan Reviewer agent for judgment-level open risks (feasibility/completeness/testability/contradiction/decomposition), two-layer verdict (structural_status mechanical vs open_risks advisory-except-P0). Wired as Task 2.5, blocks Task 3 on FAIL. Closes the last of the 3 "closed plan→dev loop" gaps (G1 execution + G2 traceability + G3 plan quality). Honest: a passing gate means the plan is coherent/testable/decomposed, not that it's what the user ultimately wanted. Tests 9/9 (total 50/50), track15 adversarial: good→PASS, cyclic/no-verify/uncovered/missing-dep/order-violation→FAIL (each correctly distinguished), 0 false +/- |
| **2026-07-06** | **G4 Full Regression Gate — pre-deploy full-suite vs baseline diff** | scripts/regression-check.js + agents/(devops-deployer, validator) + CLAUDE.md + src/__tests__/regression-check.test.js + _harness_test/track16-regression/ | G1 proves a unit's own tests ran; G2 proves each requirement has a passing bound test; neither catches the change silently breaking something ELSE already passing. Added a baseline-diff gate: classifies every test as regression (was pass, now fail — the only blocker), new/fixed/unaffected (informational). Wired as devops-deployer Step 2.5 before lock/deploy — FAIL halts deploy with the named regressing test(s), never updates the baseline on FAIL. Validator §9 cites the same result. Honest: proves nothing that passed before now fails — not coverage adequacy (G2) or plan soundness (G3). Tests 8/8 (total 58/58), track16 adversarial: no-change→PASS, regression→FAIL(named), new-test→pass-through, pre-existing-failure→unaffected, 0 false +/- |
| **2026-07-06** | **G5 Run Ledger + failure-lesson feedback** | scripts/ledger.js + agents/(validator, security-reviewer, plan-reviewer) + CLAUDE.md + src/__tests__/ledger.test.js + _harness_test/track17-ledger/ | Every gate (Validator/Security Reviewer/Plan Reviewer/G1-G4) produced a verdict but nothing persisted it across runs — each new run started blind to failures already seen and fixed. Added an append-only JSONL ledger (`_workspace/_ledger.jsonl`, existing lines never mutated) recording {run_id, unit, gate, status, reason}; `lessons()` groups FAIL entries by (gate, reason) and surfaces pairs recurring >= minCount as an advisory warning. Wired: Validator/Security Reviewer/Plan Reviewer append their outcome after their gate; Plan Reviewer and Security Reviewer additionally query lessons() before running. Advisory only — never blocks or changes a gate's verdict; a recurring pattern is a correlation to watch, not a proven root cause. Tests 11/11 (total 69/69), track17 adversarial: repeated (gate,reason) >=2x → surfaced, single occurrence → not surfaced, query filters correct by gate/status/unit, append-only confirmed (no mutation), 0 false +/- |
| **2026-07-06** | **G6 Environment/Secret Provisioning Gate — pre-flight readiness check before execution** | scripts/provision-check.js + agents/execution-runner.md + CLAUDE.md + src/__tests__/provision-check.test.js + _harness_test/track18-provision/ | G1's exec-runner honestly reports NOT_RUN for a missing TOOL, but had no concept of missing ENVIRONMENT — a stack with every tool installed could still fail because a required env var was never set, surfacing as a generic install/test FAILED indistinguishable from a real code defect. Added a readiness check (reads `.env.example`/`.env.sample`, checks required keys present in the environment) wired as execution-runner Step 0, before install/test/run — missing vars → NOT_RUN with a distinct, named reason, never a fabricated FAILED. Security invariant: reports key NAMES only, never values — safe to log/ledger anywhere. Not a provisioner (no infra/secret creation — that stays human/ops). Tests 7/7 (total 76/76), track18 adversarial: all-present→PASS, one missing→FAIL(named, no value leaked), no .env.example→PASS(nothing required), empty-string→treated as missing, 0 false +/- |
| **2026-07-07** | **G7 Gate Orchestrator — single executable entry point for the G1–G6 gate sequence** | scripts/gates.js + skills/coolhan-development-orchestrator (single-entry-point note) + CLAUDE.md + src/__tests__/gates.test.js + _harness_test/track19-gates/ | G1–G6 each existed as an isolated, individually-verified script, but nothing ran them together in dependency order against one app — the ordering lived only as prose in agent .md files, and the composition (does an upstream NOT_RUN/FAILED correctly stop downstream, or does a downstream gate fabricate a pass on absent evidence?) was unverified. Added scripts/gates.js: runs provision(G6)→exec(G1)→trace(G2)→regression(G4) in order (plan-check/G3 as a separate --plan phase), reusing each gate module via require() (no reimplementation), with honest short-circuit — once a gate is FAILED/NOT_RUN every downstream gate is SKIPPED, never run, never recorded as PASS. Appends each concrete outcome to the ledger (G5); aggregate verdict FAIL if any FAILED, NOT_RUN if any NOT_RUN, else PASS. Tests 9/9 (total 85/85), track19 adversarial (real node-app fixtures): happy path→PASS + 4 PASS in ledger, exec FAILED→trace/regression SKIPPED + verdict FAIL, provision-missing→downstream SKIPPED + NOT_RUN, regression→FAIL named, no SKIPPED ever recorded as PASS, 0 false +/-. Honest bound unchanged: proves the engineering loop composes end-to-end, not that the spec is what the user wanted. |
| **2026-08-07** | **Design Excellence enforcement closed end-to-end (v1.7.1)** | agents/(validator stage-10 sub-gate, e2e-tester item 11, hx-vision-critic dimension 10 direction_fidelity, devops-deployer Step 2.6 placeholder gate) + CHANGELOG.md | v1.7.0 installed the design standard at authoring time only — nothing re-enforced it at verification. Now: Validator runs design-quality-check + chosen-tokens spot-check as part of stage 10 (model-default fallback = FAIL); e2e verifies the rendered page matches the chosen direction and scans rendered output for text-walls; HX Vision Critic scores direction_fidelity (catches drift back to generic AI styling that still "looks clean") and records unattended direction picks in _design-history; devops blocks production deploys on unreplaced PLACEHOLDER-IMAGE assets. Authoring→validation→vision→deploy now all enforce the same standard. |
| **2026-08-07** | **Design Excellence Standard — anti-house-style + palette-energy + imagery gates (v1.7.0)** | references/design-excellence-standard.md (new) + scripts/design-quality-check.js + src/__tests__/design-quality-check.test.js + agents/(ux-design-lead, developer) + skills/coolhan-development-orchestrator (SKILL.md Task 1.5) + references/ai-native-sdlc-map.md + _harness_test/track25-design/ + CHANGELOG.md | User-reported: AI always produces the same design, washed-out pastel palettes, and text-only pages. Root causes named (model house style; generic instructions shift styles instead of varying them; text costs nothing while imagery is work) and converted to rules: 4 distinct directions before building (≥1 bold), banned defaults, accent saturation ≥50% or declared-intentional muted, diversity vs last-3-projects ledger (≥2 axes must differ), per-section imagery decisions with declared text-only exemption. design-quality-check.js makes the 3 measurable modes mechanical (house-style-repeat / washed-out-palette via HSL / text-wall). Tests 12/12 (total 151/151), track25 adversarial: 0 false +/-. Honest bound: catches sameness/blandness/imagelessness — beauty judgment stays human (4-direction pick). |
| **2026-08-07** | **G10 Agent Loop / Feedback Loop / Long-Running Agent (v1.6.0)** | scripts/agent-loop.js + src/__tests__/agent-loop.test.js + skills/coolhan-development-orchestrator (SKILL.md engine-loop G10 step, replaces prose "1 retry") + references/ai-native-sdlc-map.md (row upgraded) + _harness_test/track24-agentloop/ + CHANGELOG.md | The iterate cycle (execute→observe→fix→re-run) lived only as prose. Now mechanical: agent-loop.js runs the unit's verify as a real captured child process (C10), returns DONE/ITERATE/ESCALATE via exit codes; failing iterations record raw-output feedback in _workspace/_loop-state.json (+G5 ledger) so the next fix starts from evidence; state persists across sessions (baton→resume at iteration N+1, never blind restart); ESCALATE is terminal until human reset — re-entry grants no silent extra iterations (defect caught+fixed in track24 scenario C). Division of labor unchanged: model fixes, gate evaluates/bookkeeps. Tests 9/9 (total 139/139), track24 real-process adversarial: iterate→fix→DONE, never-fixed→ESCALATE, terminal re-entry, cross-session resume; 0 false +/-. |
| **2026-08-07** | **G9 Parallel Agent Development + Improvement-Proposal channel + AI-Native SDLC map (v1.5.0)** | scripts/parallel-plan.js + src/__tests__/parallel-plan.test.js + skills/coolhan-development-orchestrator (SKILL.md engine-loop PARALLEL DISPATCH + Improvement-Proposal section) + references/ai-native-sdlc-map.md (new) + agents/(developer, validator) + _harness_test/track23-parallel/ + CHANGELOG.md | User goal: spec-faithful-or-better results + true multi-agent/parallel/continuous development. Gap analysis via the new SDLC map showed most industry concepts (agentic pipeline, orchestrator-worker, generator-evaluator, eval-driven G2/G4, context engineering G8, HITL P0) already implemented — two real gaps closed: (1) G9 parallel-plan.js computes dependency-satisfied, file-disjoint waves for parallel worker dispatch (unknown footprint → serialized, unsafe default; validation NEVER parallelized — per-unit Validator gate stays serial); (2) Improvement-Proposal channel: better-than-spec ideas go to _workspace/_proposals.md and surface at approval gates — machine proposes, human disposes; implemented-uninvited remains a Stage-0 P0 FAIL. Tests 8/8 (total 130/130), track23 adversarial: mixed plan→correct waves+named serializations, cycle→FAIL named, 0 false +/-. |
| **2026-08-07** | **Zero-prose work mode + 5-line report cap + per-unit rule re-injection (v1.4.1)** | CLAUDE.md (rules 3·9 + Auto-Pilot prohibitions) + skills/coolhan-development-orchestrator (SKILL.md working-mode P0 zero-prose, ask-stop hard rule, engine-loop UNIT PREAMBLE, rules_reinjection, autonomous-mode line) + agents/ (17 files: report cap 10→5 lines) + agents/self-auditor.md (check #6 ask-stop/narration detection) + CHANGELOG.md | User-reported recurrences: (1) narration during work despite rule 9 — root cause: phrased as style guidance, not a prohibition; now an absolute prohibition (P0), only output of a work run = ONE final report ≤5 lines, overflow to file. (2) stops disguised as questions despite the 4-condition gate — root cause: rule read once at session start dilutes over a long run; fix is structural: engine loop gained a UNIT PREAMBLE that re-reads _goal/기획서 and re-asserts no-ask/zero-prose/keep-going before EVERY unit (C6 extended per-baton→per-unit), any non-4-condition question classified as a stop-excuse violation (safest default + DECISIONS.md + continue), Self-Auditor detects ask-stops/narration as DRIFT→continue. |
| **2026-08-07** | **Prompt-modernization lint (v1.4.0) — dated-prompting-pattern gate + agent/skill audit** | scripts/prompt-modernization-check.js + src/__tests__/prompt-modernization-check.test.js + skills/(coolhan-development-orchestrator model-capability-map §Enforcement, SKILL.md 2 rewords) + skills/coolhan-spec-driven-framework (patterns-and-concepts: 7 Locked-Mode rules → (P0) tag, spec-first reword) + docs/DECISIONS.md + _harness_test/track22-modernization/ + CLAUDE.md | Completes the v1.3.1 deferred item: current models follow instructions literally, so old-model prompting idioms (pressure caps, budget_tokens/step-by-step scaffolds, double-check prose, severity filters, stale model IDs) now degrade behavior. Added a mechanical lint over .claude/agents+skills .md — P0/C10 lines keep deliberate emphasis (exempt), `modernization:allow` for quoted examples. Audit: 25 agents already clean; 12 skill/reference findings fixed/classified. Tests 10/10 (total 122/122), track22 adversarial: dated→FAIL(5 rule families), clean+P0→PASS, repo→clean, 0 false +/-. Honest bound: textual lint — proves no known dated pattern remains, not that prompts are optimal. |
| **2026-08-07** | **Model-generation modernization (v1.3.1) — relay budget rebuilt for the 1M-context era + model capability map** | skills/coolhan-development-orchestrator (SKILL.md relay table + Non-Stop long-turn note) + references/model-capability-map.md (new) + CHANGELOG.md + docs/DECISIONS.md + CLAUDE.md | The relay/baton design assumed the 200K-context Claude era (baton after 3–4 units) — no current Claude model has a 100K/32–64K context, and 1M-class models (Fable 5/Opus 5/Opus 4.6+/Sonnet 5/Sonnet 4.6) were mis-budgeted at 3 units/session. Rebuilt the context-budget table (1M-class → 10–15 units, baton ~15% remaining; 200K-class = Haiku 4.5 → 3–4 units) with an explicit no-habitual-early-baton rule. New model-capability-map.md carries the cached lineup under the C12 freshness guardrail (recorded ≠ current) + 5 documented behavior shifts affecting agent wording on current models (literal instruction-following, default self-verification, long turns normal, severity-filter recall trap). Scope decision logged in DECISIONS.md: calibration + reference map now; full 25-agent prompt re-tune deferred to a dedicated adversarial track. No gate logic changed. |
| **2026-07-21** | **Track 21: Debate/Vote adversarial verification** | _harness_test/track21-debate-vote/ | Debate Gate (⑨, Plan Reviewer + Security Reviewer) + Borderline Vote (⑪, Validator) 패턴 적대적 검증. 12 시나리오: trigger-on-condition 6개 / no-trigger-on-low-risk 4개 / P0-hard-skip 2개. 6/6 PASS, 0 false +/-. 스키마(debate/borderline_votes 필드), P0 non-debate 경계 확인. |
| **2026-07-21** | **Security Reviewer Debate Gate (⑨ Debate pattern)** | agents/security-reviewer.md (Step 3.5 추가) | residual_risk에 P1 ≥2 OR 경계선 판정 시 자동 트리거. Advocate(pro-PASS: controls sufficient)·Skeptic(pro-FAIL/heightened-risk: controls insufficient) 각각 file:line 인용 필수. Synthesis가 각 contested finding별 side 선택. P0 hard-fail은 debate 대상 아님(non-negotiable). 출력 스키마에 `debate` 필드 추가, 메시지 포맷 업데이트. 12 AI 통신 패턴 ⑨(토론)를 Security Reviewer로 확장. |
| **2026-07-21** | **Auto-Handoff — token-efficient session boundary** | skills/coolhan-development-orchestrator (SKILL.md Auto-Handoff section) | 기능 완료 OR 동일 에러 반복 시 `_workspace/handoff-MMDD-HHmm.md` 자동 생성 + 사용자 노티. 파일 안에 지속 규칙 자기전파. baton(컨텍스트 릴레이)과 별개 — 사용자가 토큰 절약을 위해 깨끗한 새 세션 시작 선택 가능. 새 세션 시작 명령: "가장 최근 handoff 파일 읽고 시작" |
| **2026-07-21** | **Advocate/Skeptic Debate Gate (⑨ Debate pattern)** | agents/plan-reviewer.md (Step 6.5 추가) | open_risks에 P0 ≥1 OR P1 ≥2 시 자동 트리거. Advocate(pro-PASS)·Skeptic(pro-FAIL) 각각 spec/backlog 인용 필수. Synthesis가 각 risk 항목별 side 선택. 구조적 FAIL이면 debate 생략. 12 AI 통신 패턴 ⑨(토론)를 Plan Reviewer에 내재화. |
| **2026-07-21** | **Borderline Vote mechanism (⑪ Vote pattern)** | agents/validator.md (Step 2.5 추가) | stage 결과 경계선 모호 시 트리거 (≤2 minor, P0 없음). 3-기준 독립 판정: A(Spec Fidelity)·B(Risk Materiality)·C(Reproducibility), 2/3 다수결. FAIL이면 소수 criterion 기록. 12 AI 통신 패턴 ⑪(투표)를 Validator에 내재화. |
| **2026-07-21** | **AI 통신 패턴 참조 문서 (12-pattern gap analysis)** | skills/coolhan-development-orchestrator/references/ai-communication-patterns.md (신규) | 12 패턴 CoolHan 구현 현황 매핑. 구현 10/미구현 2(②A2A·④메시지큐, 외부 인프라 필요)/부분 1(⑤API). 각 패턴별 상태·위치·대안 문서화. |
| **2026-07-19** | **Work-silently rule injected into all 17 agents** | agents/(developer, intent-analyzer, spec-writer, validator, qa-tester, devops-deployer, execution-runner, security-reviewer, plan-reviewer, self-auditor, site-analyzer, module-extractor, cross-site-adapter, ux-design-lead, integration-validator, e2e-tester, hx-vision-critic) | Global output rules 8–9 (no narration during work, one summary ≤10 lines after) existed only in CLAUDE.md/SKILL.md. Injected as first bullet in each agent's Operating Principles so the rule is agent-local and survives cold-start delegation. |
| **2026-07-07** | **G8 Context-ingestion + 100%-completion enforcement — fix "stops early" and "acts on latest command only"** | scripts/(context-check.js, completion-check.js) + skills/coolhan-development-orchestrator (Phase 0 = Context Ingestion Gate; working-mode: baton≠done, ban early stop, completion-check before "all complete"; engine-loop completion gate) + agents/(intent-analyzer, self-auditor) + CLAUDE.md + src/__tests__/(context-check, completion-check).test.js + _harness_test/track20-context-completion/ | Two user-reported defects. (1) STOPS EARLY: nothing mechanically defined "done" as "whole backlog done+validated", and the working-mode listed context-limit baton as a normal outcome — so runs paused/behaved-as-done before finishing. Fix: completion-check.js parses the backlog and permits "✅ 전체 완료" only when every unit is done AND names a validation (exit 1 + remaining/unvalidated named otherwise); working-mode reworded so a baton is a CONTINUATION never a completion, "natural pause" is banned, and the engine loop exits only when completion-check exits 0 or a real stop condition fires. (2) ACTS ON LATEST COMMAND ONLY → wrong output: Phase 0 only checked whether outputs EXISTED. Fix: Phase 0 rewritten as a Context Ingestion Gate — read _goal/_backlog/_checkpoint/spec/CLAUDE.md-history/prior artifacts/knowledge_base, write _context-digest.json, and context-check.js must pass (covers every required source + fresh run_id) before any task work. intent-analyzer now reads full context first; self-auditor flags a premature "done" that completion-check would reject. Honest: enforces "declared sources recorded as read" and "backlog 100% done", not deep understanding or that the backlog is the right decomposition (G3/human). Tests 16/16 (total 101/101), track20 adversarial: digest missing a source→FAIL(named), complete→PASS, stale run_id→FAIL, backlog with any todo/unvalidated unit→FAIL(remaining named), all done+validated→PASS, 0 false +/- |
| **2026-07-19** | **Full-Completion Auto-Pilot Mode** | scripts/(tasks-check.js, no-placeholder-check.js) + docs/DECISIONS.md + CLAUDE.md (4-condition question gate + absolute prohibitions) + SKILL.md (checkpoint = PROGRESS.md-equivalent, tightened resume wording) + agents/(developer, validator) + src/__tests__/(tasks-check, no-placeholder-check) + _harness_test/track21-autopilot/ | Operationalized a user-supplied "senior dev, never stop, never fake-complete" discipline as CoolHan artifacts/gates rather than duplicating Claude Code's own Auto mode/`/goal`/`--continue` (CLI-level, outside CoolHan's control). Adds: TASKS.md 5-state gate (implemented≠verified; blocked/not-started fails), a TODO/placeholder/"coming soon" scanner, docs/DECISIONS.md convention (log assumed defaults, never wait), an enriched `_checkpoint.md` matching the requested PROGRESS.md fields, and a narrow 4-condition question gate (credentials/payment/irreversible-prod-deletion/incompatible-requirements) + explicit prohibitions (no partial-as-complete, no "later" excuses, no scope shrink, no dead code). Reuses G1-G8 rather than replacing them. Track 21 adversarial: all-verified→PASS, blocked/not-started→FAIL(named), TODO left in verified code→FAIL(file:line), 0 false +/- |
| 2026-05-27 | **Initial Release Engineering harness setup** | agents/, skills/, CLAUDE.md | Build a complete agent team system for CoolHan deployment automation |
| 2026-05-27 | **Phase 2 complete: 11 architecture conflicts resolved** | knowledge_base/ | Domain module synchronization and architectural consistency |
| **2026-05-28** | **Development Harness build (Phases 0-4)** | agents/ (6) + skills/coolhan-development-orchestrator + CLAUDE.md | A complete agent team system that automates specification-driven development via natural Korean commands |
| **2026-05-28** | **Token Efficiency Mode applied** | agents/ (6) + skills/ (4) | Token-saving mode: report results only, omit process explanation, do not display source screens |
| **2026-05-30** | **Phase D Track 1: Harness enhancement (P0/P1 rules reflected)** | agents/ (3: validator, integration-validator, e2e-tester) + skills/coolhan-development-orchestrator + CLAUDE.md | Resolve P0 structural defects: added entry gate, made evidence field mandatory, relaxed Token Efficiency Mode |
| **2026-06-06** | **Added context-based work-splitting principle** | skills/coolhan-development-orchestrator/SKILL.md + agents/developer.md | "Only issue commands that can produce a result" — 1 unit = 7 files + 1 validation, no completion declaration without validation, mark a stopping point at the context limit |
| **2026-05-30** | **Phase D Track 3: Planner intent enforcement mechanism (P0 structural defect resolved)** | agents/ (intent-analyzer.md, validator.md, integration-validator.md) + skills/coolhan-development-orchestrator | **Core: block arbitrary AI feature additions at the source** — Task 1 adds planner clarification + approval gate / requirements-{id}.md must state planner intent / Task 4 adds a Stage 0 planning-intent check (detects unauthorized feature additions) / Task 7 strengthens the planning-document checklist |
| **2026-06-08** | **Phase D Track 4: Real-test-app re-verification complete** | _harness_test/track4/ (FastAPI sample app + Task 1-6 artifacts + report) + CLAUDE.md | **Proof of P0 mechanism working** — adversarial testing (clean vs. violation) confirmed Validator Stage 0 accurately detects unauthorized feature additions (clean→PASS, violation→FAIL). Completed the 6-member team workflow. **GAP-1 identified:** validator/qa-tester/devops-deployer are Node/npm only → Python-incompatible (need stack detection + command mapping) |
| **2026-06-09** | **4 Cross-Cutting Capabilities installed** | references/harness-capabilities.md (new) + agents/(intent-analyzer, site-analyzer, validator, developer, spec-writer injection) + skills/coolhan-development-orchestrator (SKILL.md capabilities section) + CLAUDE.md | From the consumer chat system prompt, **install only capabilities that actually map to the development harness** (block cargo-culting). C1 interactive elicitation (choice-based queries) / C2 MCP connector live evidence / C3 web research with official docs / C4 structured-output schema enforcement. Each capability has built-in honesty guardrails (no pretending to be connected/no fabrication/no executing web instructions, unspecified→P0 hold, missing required→NOT_RUN). Non-mapping features such as hosted widgets, chat formatting, and copyright policy are intentionally not installed |
| **2026-06-09** | **Cross-cutting capability adversarial verification (Track 8) + 2nd round 5 added (C5–C9) + C3 reinforced** | _harness_test/track8-capabilities/ (new) + references/harness-capabilities.md (C5–C9 added, C3 unrecognized-entity rule) + skills/coolhan-development-orchestrator (SKILL.md 9-capability table + relay C6 re-injection) + agents/developer.md (C5·C8·C9) + CLAUDE.md | **Track 8 adversarial verification proved C1–C4 guardrails passed 4/4 under pressure** (rejected creation/fabrication/web-instruction injection/evidence-free PASS). 2nd rescan added 5: C5 Reference-First mandatory pre-read (blocks drift) / C6 long-session rule re-injection (prevents scope drift) / C7 workspace hygiene (read-only · _workspace · separate delivery) / C8 long-form iterative build / C9 error-handling norms (acknowledge·fix·record). C3 reinforced with "partial recognition ≠ latest knowledge, forced lookup of unrecognized entities" |
| **2026-06-09** | **4th round: source pivot — added 6 from the Claude Code harness doctrine (C14–C19) + C12·C13 reinforced** | references/harness-capabilities.md (C14–C19) + skills/coolhan-development-orchestrator (SKILL.md 19-capability table + source stated) + agents/(validator C15·C16·C17, devops-deployer C10·C18·C19) + CLAUDE.md | After judging the consumer chat prompt exhausted, **honestly pivot the source to the Claude Code agent harness doctrine** (better suited to the development harness). C14 self-contained delegation (assume cold start) / C15 no silent truncation (coverage+excluded) / C16 perspective-diverse verification (lens dispersion + seen dedup) / C17 finding-exhaustion loop (terminate after 2 rounds with no findings) / C18 action-risk classification (prohibited/approval-required/auto 3-tier, no generalizing approval) / C19 evidence-action match (no pattern-matching reflex). Reinforced: C12 freshness (recorded ≠ current), C13 completeness critic pass. **Track 8 3rd adversarial verification C14–C19 6/6 PASS (cumulative 14/14)** — rejected one-line delegation + produced full prompt / rejected coverage hiding / lens-dispersion + seen-dedup convergence logic / rejected fixed-count termination + low-risk not applied / accurately classified approval-generalization·unauthorized-feature·auto-progress 3-tier / diagnosis-first before destructive reset |
| **2026-06-09** | **3rd discovery round, 4 added (C10–C13) + C5 reinforced + adversarial verification complete (8/8)** | references/harness-capabilities.md (C10–C13 + C5 reinforced) + skills/coolhan-development-orchestrator (SKILL.md 13-capability table) + agents/developer.md (C10·C12·C13) + _harness_test/track8-capabilities/ (2nd verification) + CLAUDE.md | 3rd rescan exhausted the mapping well: **C10 no simulation (★, no mocking/fabrication of test·build·deploy·tool results — the active form of "no evidence → NOT_RUN")** / C11 effort·depth calibration (verification depth proportional to risk × complexity) / C12 existence pre-check (verify, don't assume reference inputs) / C13 completion self-check (explicit checklist before declaring completion). C5 reinforced with "pre-read all references." **Track 8 2nd adversarial verification C10–C13 4/4 PASS (cumulative 8/8)** — rejected pytest fabrication · two-way calibration of skipped/excessive verification · checked absent spec on actual disk · blocked 9/10 completion declaration. Remaining unextracted items all confirmed as non-mapping consumer-chat-runtime only (converged) |
| **2026-06-08** | **GAP-3 fix: QA negative tests made mandatory** | agents/qa-tester.md | Track 4 GAP-3 resolved — positive-only cannot PASS; negative cases (input rejection/authorization rejection/state-transition rejection/duplicate-idempotency/boundary/security) are mandatory. NOT_RUN if 0 negatives. Full coverage of spec section 10 error scenarios |
| **2026-06-08** | **GAP-2 fix: artifact filename standard unified** | skills/coolhan-development-orchestrator (filename-standard section) + agents/ (validator, qa-tester) | Track 4 GAP-2 resolved — `{timestamp}`→`{id}` unified, single rule `_workspace/{NN}_{artifact}-{id}.{ext}` finalized (removed NN-prefix presence/absence and id/timestamp mixing) |
| **2026-06-12** | **Track 9: engineering ≠ science gate adversarial verification passed** | _harness_test/track9-sci/ | S1 tautology (engine PASS/verdict=insufficient/tautology FAIL/"proven" not emitted), S2 normal science (real computation diff +0.55, p=0.00059, vanishes under shuffle, held-out reproduces, FDR — supported_by_data, no assertion), S3 traceability violation (provenance FAIL→insufficient). Gate 4/4, 0 false positives/negatives |
| **2026-06-12** | **Engineering pass ≠ scientific truth separation (audit defect resolved)** | knowledge_base/00_SCIENTIFIC_VERIFICATION_STANDARDS.md (new) + agents/(hypothesis-validator, validator) + skills/coolhan-research-orchestrator + CLAUDE.md | Audit finding: CoolHan's green light was misread as scientific confirmation (past "10/10 STRONG+", formal_match 0.95 tautology trap). Resolution — new verification-domain KB (distinguish engineering vs. scientific validity + scientific pass conditions: simultaneous scoring of competing hypotheses · pre-registered counterexample conditions · shuffle/held-out · multiple-comparison correction · data→code→output traceability · no tautology + verification-spec template). hypothesis-validator/validator/research-orch enforce two-layer verdicts (engineering_status/scientific_interpretation), "proven" notation prohibited. CoolHan = plumbing; validity is the responsibility of the researcher + auditor |
| **2026-06-09** | **HX unattended auto-loop (Auto-Critic) + non-stop execution** | agents/hx-vision-critic.md + skills/coolhan-development-orchestrator (scripts/hx_render.py, HX auto-loop section, Non-Stop Execution) + CLAUDE.md | Resolve "human approval = broken automation" — the vision critic proxies human judgment. Render (playwright screenshot)→vision evaluation→Developer auto-fix→re-render unattended loop (PASS/ITERATE/ESCALATE only if not converged after 5 tries). Human steps in once at the end or for auto-approve. Non-stop execution rules (multiple units in one turn, no waiting after 1 minute) block frequent interruptions |
| **2026-06-09** | **Human-Experience (HX) standard enforced from the first line of code** | references/human-experience-standard.md + agents/(ux-design-lead new, intent-analyzer/spec-writer/developer/validator/e2e-tester injection) + skills/coolhan-development-orchestrator (Task 1.5 insertion + 10-stage HX gate) + CLAUDE.md | Block "done if the logic works" — make HX (forms/accessibility/responsive/readability/buttons/states/flow/security UX/modularity/integrity) a first-class requirement from initial design and implementation, not post-hoc verification. Task 1.5 UX design injection; Validator stage 10 + e2e FAIL even if it works when below P0. Linked to design parameterization. Adversarial verification (meets vs. falls short) |
| **2026-06-09** | **Added global output rules (no monologue · 6-line hard cap)** | CLAUDE.md (global) + skills/ (development·research orchestrator working-mode) | Block token waste/development delays from monologue and process explanation. Enforced on all commands/harnesses: run tools immediately, chat 6 lines max, results only, no code/re-narration. Exception: when "in detail/why" is stated |
| **2026-06-09** | **New Research & Verification harness built** | agents/(hypothesis-validator, logic-proof-verifier, cryptanalyst) + skills/coolhan-research-orchestrator + CLAUDE.md + _harness_test/track6-research/ | Expert pool (3) that automates logic verification of research, hypothesis validation studies, and cryptanalysis. KB-driven (HYPOTHESIS_VALIDATION/PROOF_GOAL/ACADEMIC·JOURNAL STANDARDS). Evidence required·no inference (inherits development P0) + confirmation-bias blocking + cryptanalysis legal·ethical boundaries. Track 6 adversarial verification (hypothesis support/reject, logic valid/fallacy, cipher decrypt) |
| **2026-06-09** | **Continuous Development Engine embedded — harness self-enhancement** | skills/coolhan-development-orchestrator (🔄 engine section + working-mode default ON + triggers) + _workspace/(_goal/_backlog/_checkpoint) + CLAUDE.md | On receiving one goal, decompose _goal→_backlog, then self-iterate per-unit execution·validation·resume without human intervention until the backlog is empty. 3 self-resume paths (in-session chaining/session-boundary baton/unattended /loop). No re-questioning within the goal scope, hold only when unspecified (P0). Demo by self-hosting this engine onto itself, exhausting backlog U1–U6 |
| **2026-06-08** | **Continuous Relay Mode added** | skills/coolhan-development-orchestrator (working-mode + ♾️ relay section + Phase 0 resume branch + stopping-point baton) + agents/developer.md | Without stopping at the context limit, save _checkpoint.md + emit a restart command (baton) on the last line → a new session auto-resumes from the checkpoint. Development that doesn't stop through iteration. Per-model context budget (large 3 units/medium 2/small 1) for threshold judgment. Unattended iteration guided via /loop |
| **2026-06-08** | **Autonomous Mode added** | skills/coolhan-development-orchestrator (working-mode + autonomous-progress section) | One command auto-chains the pipeline to the end; on FAIL, auto-recover (1 retry→re-run Developer, report only on 2nd failure), stop only at stop conditions (P0 gate/unrecoverable/context limit/destructive action), record auto-decisions in _autorun-log.md |
| **2026-06-08** | **GAP-1 fix: make forward agents stack-agnostic** | agents/ (validator, qa-tester, devops-deployer) + skills/coolhan-development-orchestrator/references/stack-command-map.md | Track 4 GAP-1 resolved — the 3 agents detect the stack before work and substitute commands (remove npm assumption). Added Python/Django/PHP/Ruby/Go/Java mapping table. P0 Stage 0 always runs regardless of language. |
| **2026-06-08** | **Chat Brevity Mode added** | skills/coolhan-development-orchestrator (working-mode) | Keep responses short; chat success/failure/verdict/next-task under 10 lines, details recorded in files, auto-proceed to the next task without questions |
| **2026-06-08** | **Reverse + Reuse harness extension (Site Analyzer / Module Extractor / Cross-Site Adapter)** | agents/ (3 new) + skills/coolhan-development-orchestrator (SKILL.md + 3 references) + CLAUDE.md + _harness_test/track5-reverse/ | **Added the ability to analyze an existing site → modularize → apply to another site.** A reverse sub-pipeline (R1→R2→R3) joins the forward pipeline. 4 integration principles: stack-agnostic first (reflects the GAP-1 lesson), parameterized reuse, **planner intent enforcement (P0) cross-site extension** (port only approved modules + Validator Stage 0 cross-check), domain-module feedback. Track 5 adversarial verification proved unauthorized pulling is blocked. |

---

## Framework Development Progress

### Phase Status

| Phase | Status | Completed | Key Deliverables |
|-------|------|--------|-----------|
| Phase 1 | ✅ Complete | 2026-05-27 | 10 domain modules (01-10, 12 sections each) |
| **Phase 2** | **✅ Complete** | **2026-05-27** | **11 architecture conflicts resolved, 2 infrastructure documents** |
| Phase 3 | 🔜 Preparing | 2026-06-03 | Integration test plan, verification report |

### Phase 2 Detail: Architecture Conflict Resolution

**Confirmed conflicts (11) - all resolved:**

| # | Conflict | Status | Resolution |
|---|------|------|---------|
| 1 | product_reviews table duplication | ✅ Resolved | Consolidated into 07_review_rating_system |
| 2 | inventory_transactions table duplication | ✅ Resolved | Consolidated into 08_inventory_management |
| 3 | Status value inconsistency | ✅ Resolved | Created 00_STATUS_VALUE_REGISTRY.md |
| 4 | /admin/audit-log endpoint duplication | ✅ Resolved | Changed to /admin/member/* in 01_member_system |
| 5 | /admin/inventory endpoint duplication | ✅ Resolved | Clarified ownership in 08_inventory_management |
| 6 | Order total calculation responsibility | ✅ Resolved | Confirmed ownership in 09_order_management |
| 7 | Inventory reservation timing | ✅ Resolved | Defined rules per business model |
| 8 | Payment idempotency | ✅ Resolved | Confirmed idempotency_key field |
| 9 | Module responsibility undefined | ✅ Resolved | Created 00_MODULE_RESPONSIBILITY_MATRIX.md |
| 10 | Priority unclear | ✅ Resolved | Defined rule: domain module > base core |
| 11 | No cross-module call rules | ✅ Resolved | Defined circular-reference prevention rules |

**Modified domain modules:**
- 01_member_system.md: Admin endpoint structure changed
- 02_shopping_mall.md: Tables/endpoints removed, dependencies redefined

**Created/updated documents:**
- ✅ 00_PHASE_2_COMPLETION_SUMMARY.md (new)
- ✅ 00_STATUS_VALUE_REGISTRY.md (already existed)
- ✅ 00_MODULE_RESPONSIBILITY_MATRIX.md (already existed)
- ✅ 01_2ND_REVIEW_REPORT.md (updated: conflict status shown)

---

## Notes

- All agents are managed in `.claude/agents/`
- All skills are managed in `.claude/skills/`
- When you modify an agent, record it in the change history table
- **Always deploy via `coolhan-release-orchestrator`**
- **For development, use native natural-language commands such as "쿨한으로 {action}해" (Korean) or "CoolHan {action}" (English)**
- **Multilingual support:** 50+ languages auto-detected and processed - see [`MULTILINGUAL_SUPPORT.md`](MULTILINGUAL_SUPPORT.md)

---

## Harness Status

| Harness | Status | Agents | Skills | Last Updated |
|--------|------|---------|------|--------------|
| Release Engineering | ✅ Setup complete | 5 | 2 | 2026-05-27 |
| Development | ✅ Enhancing (G1-G8 + Debate/Vote + Security) | 12 (7 main+UX + 2 additional + 3 reverse) | 1 | 2026-07-21 |
| Research & Verification | ✅ Setup complete | 3 (hypothesis/logic/cipher) | 1 | 2026-06-09 |

---

**Harness integration status:** ✅ 2 harnesses operating + Phase D-1 (harness enhancement) in progress  
**Last updated:** 2026-05-30

---

## Phase D Status (Harness Enhancement)

### Track 1: Documentation + Agent Definition Synchronization (in progress)

| Item | Status | Content |
|------|------|------|
| CLAUDE.md | ✅ Complete | Team composition + change history + Phase D-3 record |
| SKILL.md | ✅ Complete | Task 1-2 gate + Task 4 planning-intent check added |
| intent-analyzer.md | ✅ Complete | Step 3 existing-feature check + step 4 planner approval gate added |
| validator.md | ✅ Complete | Stage 0 planning-intent check + expanded to 10-stage pipeline |
| integration-validator.md | ✅ Complete | Planning-document checklist strengthened (planning-intent check) |
| e2e-tester.md | ✅ Complete | Planning-intent check (detect unauthorized UI/UX element additions) |

### Track 3: Planner Intent Enforcement Mechanism (NEW - P0 structural defect resolved) ✅ Complete

| Item | Status | Content |
|------|------|------|
| Task 1 strengthening | ✅ Complete | Existing-feature check + planner clarification + planner intent stated |
| Task 1-2 gate | ✅ Complete | Task 2 cannot proceed without planner approval YES (GATE LOCK) |
| Task 4 strengthening | ✅ Complete | Stage 0 planning-intent check added (detect unauthorized feature additions) |
| Verification mechanism | ✅ Complete | Auto-detect non-spec feature additions in Tasks 4, 7, 8 |

### Track 4: Real-Test-App Re-Verification ✅ Complete (2026-06-08)

| Item | Status | Content |
|------|------|------|
| Real test app | ✅ Complete | FastAPI sample app (`_harness_test/track4/sample-app/`) — full Task 1-6 run |
| Phase D-3 re-verification | ✅ Complete | Adversarial test (clean vs. violation) proved the planner intent enforcement mechanism works |

**Re-verification results (`_harness_test/track4/track4-report.md`):**
- ✅ **P0 mechanism confirmed working** — Validator Stage 0 accurately detects unauthorized feature additions.
  Clean code → PASS (0 unauthorized additions), violation code (`/health`+`health_status` injected) → FAIL (item·location stated). No false positives/negatives.
- ✅ Completed the 6-member Task 1-6 team workflow in real operation (pytest 8 pass, deploy smoke passed).
- ⚠️ **GAP-1 (P0) identified** — validator/qa-tester/devops-deployer.md are Node/npm only.
  Stages 8·9 NOT_RUN on Python/FastAPI. Need stack detection + command mapping. (However, the P0 core is language-agnostic, so no impact.)
- ⚠️ GAP-2: artifact filename inconsistency / GAP-3: QA negative tests absent.

**Next action candidate:** GAP-1 fix (add stack detection + Python mapping to the 3 agent definitions).
