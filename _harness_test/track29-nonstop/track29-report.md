# Track 29 — Nonstop supervisor (G13) adversarial verification

The user's stated goal: **루프 무중단 개발**. G10 loops within a unit; G11 stops a session from
quitting early — but when a session genuinely ends (context exhausted, crash, process exit),
continuing still required a human to paste the baton. `nonstop.js` is the OUTER loop: a
supervisor process that relaunches headless sessions until the backlog completes or a named stop
condition fires. All scenarios are real child-process invocations of `scripts/nonstop.js` with a
fake session binary (`fake-session.js` completes exactly one unit per invocation) via
`--cmd-template`; artifacts in `_workspace/`.

| Scenario | Setup | Expected | Actual | Match |
|---|---|---|---|---|
| A: sessions progress → completion | 3-unit backlog, fake session does 1 unit/run | COMPLETE after exactly 3 sessions, exit 0, per-session log, run-report generated | `{status:COMPLETE, sessions:3}`, exit 0, 3 log lines | ✅ |
| B: wedged run (session command broken) | template pointing at a nonexistent script | NO_PROGRESS after 3 attempts — honest halt, never spins/burns forever | `{status:NO_PROGRESS, sessions:3}`, exit 4, reason named | ✅ |
| C: ESCALATE recorded | `_stop-approved.json` present before launch | STOP_APPROVED with the recorded reason, ZERO sessions launched | `{status:STOP_APPROVED, sessions:0, reason:"ESCALATE: U2…"}`, exit 3 | ✅ |
| D: unit tests | 9 cases (progress→complete, already-complete no-launch, pre/mid-run stop-approval, no-progress valve, streak reset, max-sessions valve, per-session log, exit-code map) | 9/9 | jest 9/9 | ✅ |

Also observed during the track (kept as evidence): an unquoted path with a space in
`--cmd-template` made every session fail identically — the NO_PROGRESS valve caught it in 3
sessions with the raw error tail in `_nonstop-log.jsonl`, exactly the honest-halt behavior
designed for wedged runs.

0 false positives (a completed backlog never relaunched; approved stops never overridden),
0 false negatives (progress always continued the loop; three no-progress sessions always halted).

**Verdict:** PASS — the outer loop closes the last human-in-the-middle step of 무중단 개발:
세션 사망/컨텍스트 소진 후 재기동이 기계화됨, 정지는 5개 명명된 조건으로만.

**Honest bound:** the supervisor guarantees relaunch-until-done-or-named-stop. It cannot make a
session's work correct (G1–G11 inside each session), requires the `claude` CLI + backlog to
exist, and deliberately refuses to loop on a run making no progress.
