# Track 41: why a hook child process sometimes never starts (D-13), and what the harness does about it

Defect D-13 (ledger, v2.11.0): the full test run failed twice with empty output from hook child processes; one
burst showed 37 spawn errors and 4 children dead at start in 1,200 launches, and the cause on the machine was
not known. This track finds the cause, reproduces it without touching the rest of the machine, and checks that
the harness tells «did not start» apart from «ran and failed».

Scripts: `run-track.js` (scenarios), `worker.js` (runs inside the limited process tree), `job.cs` (a Windows job
object with a commit limit). Run log: `run-log.txt` (paths masked).

## What was observed before the reproduction

| Observation | Value | Kind |
|---|---|---|
| Full runs that failed with empty hook output, and the operating system's «low virtual memory» record (System log, event 2004) | 4 of 4 failing runs ended within 60 seconds of a record; no record during the passing runs of the same day | [관찰] |
| Launches with every core busy and physical memory nearly gone (lowest 1MB free) while commit headroom stayed at 2,598MB or more | 6,000 launches, 0 did not start | [실측] |
| The same saturation repeated twice more after the track's first run | 960 launches, 0 did not start | [실측] |
| The track's own first saturation run, during which the operating system recorded a shortage | 480 launches, 37 did not start | [관찰] |

A busy CPU and scarce physical memory do not stop a child from starting. A shortage of commit (virtual memory
the system can still promise) does.

## Reproduction in isolation

The hook is launched from a worker that holds 200MB inside a job object. The job's commit limit is lowered step
by step, so the hook child gets what is left. Only the track's own process tree is limited.

| Left for the child (limit minus 200MB) | Started | How the child ended |
|---|---|---|
| 1,800MB | 20 of 20 | ran |
| 52MB | 20 of 20 | ran |
| 44MB | 0 of 20 | V8 fatal «out of memory» with status 0x80000003, or status 0xC0000409 with nothing on stderr |
| 40MB, 36MB | 0 of 20 | V8 fatal «out of memory», status 0x80000003 |
| 32MB | 0 of 20 | «VirtualAlloc failed», status 0xC0000409 |
| 28MB, 24MB | 0 of 20 | the launch itself fails: spawn error UNKNOWN, or the child ends silently with 0xC000009A (in another run: silent 0xC000012D and 0xC0000017) |

In every failing row stdout is empty. A node child running this hook needs about 48MB of commit to start.
The two classes of D-13 (spawn errors, children dead at start) are the two lowest rows.

## Scenarios

| # | Scenario | Expected | Actual | Match |
|---|---|---|---|---|
| 1 | Control: 20 launches with memory to spare | 20 of 20 start | 20 of 20 | ✅ |
| 2 | The same hook as the commit limit shrinks | below some limit the child no longer starts | 52MB left 20/20; 44MB to 24MB left 0/20 | ✅ |
| 3 | Every child that did not start, across the sweep | recognised by `neverStarted`, 0 unrecognised | 120 failures, 0 unrecognised | ✅ |
| 4 | `runNode` inside the starving job | two reported retries with a memory figure, then the failure returned as it is | started false, retries 2, figure present | ✅ |
| 5 | `runNode` inside the roomy job | runs once, no retry | started, 0 retries | ✅ |
| 6 | Four scripts that ran and failed or reported; one prints a memory word beside its verdict | launched once each, not retried, not classified as refused memory | 1 launch each, 0 retried, 0 classified | ✅ |
| 7 | `checks-run`: one check refused memory, one really failing | exit 1; 실패 1, 확인 안 함 1; machine state line printed | exit 1; 실패 1 · 확인 안 함 1; printed | ✅ |
| 8 | `checks-run`: the only check was refused memory | exit 4, never 0 | exit 4 | ✅ |
| 9 | `resource-check` on this machine | verdict with the matching exit code | PASS, exit 0 | ✅ |
| 10 | A floor far above the machine; an unknown flag | exit 1; exit 2 | 1; 2 | ✅ |
| 11 | Every core busy, memory above the floor throughout | every launch starts | 480 of 480; lowest headroom sampled 3,154MB; no shortage recorded | ✅ |

Row 11 becomes «not measured» when the operating system records a shortage during it, and a row 12 then judges
those failures on their own (each must be recognised). That happened in the first run of this track.

**0 false positives**: a script that ran is never treated as «did not start», also when it mentions memory.
**0 false negatives**: all 120 starved launches were recognised; a starved check is 확인 안 함 and never a pass.

## What changed in the harness

- `scripts/resource-check.js`: how much memory a new process can still get (Windows commit headroom, Linux
  available memory plus free swap). Exit 0 enough, 1 low, 4 not measured.
- `scripts/lib/spawn-node.js`: `memoryDenied` holds the measured signatures; `neverStarted` includes them; the
  retry note carries free physical memory.
- `scripts/checks-run.js`: a check refused memory is 확인 안 함 with the reason; any run that is not all 통과
  prints the machine state beside the result.
- `scripts/nonstop.js`: waits for headroom before launching a session (up to 10 waits of 60 seconds), records
  the reading with every session, and launches anyway after the last wait with LOW written in the log.
- Field lesson F-41 in the registry.

## Honest bound

- The link between the operating system's record and the failing runs is an observation of 4 of 4, not a
  controlled experiment on the whole machine: exhausting the machine's commit on purpose would endanger every
  other process on it. The controlled part is the job object, which shows the mechanism and the signatures.
- The harness cannot make a hook start when the machine refuses memory. In an interactive session that moment
  has no stop block. The outer supervisor waits for headroom and relaunches; an interactive session does not.
- The floor of 1,024MB is a default, about twenty children of the measured size. It was not tuned on other
  machines.
- The job-object scenarios run on Windows only. Elsewhere rows 1 to 5 are «not measured» and the track exits 4.
- The memory needed to start (about 48MB) is for this Node version and this hook.
