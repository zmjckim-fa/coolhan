# Track 27 — Ask-Guard + Run-Armer (G11b/G11c) adversarial verification

User report after v1.8.0: even with permissions set to bypass, runs still stop and ask. Two gaps
found and closed: (1) **AskUserQuestion never ends the turn**, so the Stop hook cannot see it —
the session parks awaiting human input (permission mode is irrelevant; this is the model asking,
not the harness); (2) **arming `_run-active.json` was itself a prose instruction** — a run that
never armed was never guarded. All scenarios below are real hook invocations captured in
`_workspace/scenario-results.json`.

| Scenario | Setup | Expected | Actual | Match |
|---|---|---|---|---|
| A: user issues a CoolHan continuous-dev command | run-armer on `쿨한으로 개발 이어서 진행하라` | harness writes `_run-active.json` itself (no model involvement) + injects the loop-contract context line | armed, additionalContext "ARMED" | ✅ |
| B: mid-run AskUserQuestion (backlog incomplete) | ask-guard PreToolUse | **deny** with the standing instruction (safest default + DECISIONS.md + continue; `_stop-approved.json` = legitimate path) | `permissionDecision: "deny"`, reason includes both | ✅ |
| C: genuine 4-condition stop recorded | `_stop-approved.json` {credential required} | question allowed | allowed | ✅ |
| D: new run command after an old approval | run-armer re-arm | stale `_stop-approved.json` cleared — a previous run's approval never pre-authorizes stopping the new one | cleared | ✅ |
| E: inspection command | `쿨한 업데이트 확인해` | does NOT arm (ops/QA sessions must keep their stops legal) | not armed, silent pass-through | ✅ |
| F: unit tests | 7 cases (trigger matrix ×2, arm+stale-clear, process-level armer, deny/allow/untouched ask-guard) | 7/7 | jest 7/7 | ✅ |

0 false positives (inspection prompts never arm; approved asks and ordinary sessions never denied),
0 false negatives (every mid-run unapproved ask was denied; every continuous-dev command armed).

**Verdict:** PASS — arming is now mechanical (UserPromptSubmit) and the ask-path is guarded
(PreToolUse), completing the Stop-hook triangle: turn-end, tool-ask, and arming are all enforced
by the harness rather than by prose the model may drift from.

**Honest bound:** guards fire only in directories carrying CoolHan's `.claude/settings.json`
hooks (installed projects). The trigger regex is conservative by design — a novel phrasing of a
run command may not arm (the model's Phase 0 arming remains as backup); and a denied ask makes
the model choose a default, which is only as good as the 기획서 it defaults from.
