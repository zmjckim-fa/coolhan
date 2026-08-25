# Track 26 — Stop-Guard hook (G11) adversarial verification

Root cause addressed: every prior anti-ask-stop measure (rule 8, 4-condition gate, v1.4.1 UNIT
PREAMBLE) was prose the model had to voluntarily follow. `stop-guard.js` is a Claude Code `Stop`
hook — it runs OUTSIDE the model when a turn tries to end, and blocks the stop while a CoolHan
run's backlog is incomplete. All scenarios below are real hook invocations (child process, JSON
on stdin, decision on stdout) captured in `_workspace/scenario-results.json`.

| Scenario | Setup | Expected | Actual | Match |
|---|---|---|---|---|
| A: ordinary session | no `_run-active.json` | allow silently (non-CoolHan work untouched) | no `decision` field | ✅ |
| B: active run, backlog incomplete | marker + U2 `todo` | **block** + reason naming remaining units + re-injected continue rules + the legitimate-stop path | `decision:"block"`, reason includes remaining units and `_stop-approved.json` instructions | ✅ |
| C: repeated stop attempts | invoke ×3 in blocked state | per-run counter increments (safety valve at 25 → allow) | `_stop-guard-count.json` blocks=3 | ✅ |
| D: genuine stop condition | `_stop-approved.json` `{reason: ESCALATE …}` | allow — recorded stop conditions win over incompleteness | allowed | ✅ |
| E: backlog complete | all units done+validated | allow AND auto-retire `_run-active.json` | allowed, marker gone | ✅ |
| F: unit tests | 9 cases (decision matrix + 3 process-level) | 9/9 | jest 9/9 | ✅ |

0 false positives (ordinary sessions, approved stops, and completed runs were never blocked),
0 false negatives (an unfinished run's stop attempt was always blocked, with the counter rising).

**Verdict:** PASS — "멈춰서 물어보기" is now blocked by the harness, not just discouraged by prose.
Fail-open by design: guard errors, missing scripts, or the 25-block safety valve always allow the
stop (a guard must never trap the user).

**Honest bound:** the hook enforces "the turn does not end while backlog units remain and no stop
condition is recorded." It cannot make the continued work correct (G1–G10 gates), cannot stop
mid-turn tool-permission prompts (those are Claude Code permission settings — configure the
allowlist / acceptEdits for unattended runs), and activates only for runs that armed the marker.
