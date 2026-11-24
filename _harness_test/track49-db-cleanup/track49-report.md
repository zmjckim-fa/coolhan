# Track 49: cleaning up never decides the result

## Why

On 2026-11-24 the database check ran over the whole module library (`module-db-check.js --all`). It started a
throwaway PostgreSQL cluster, applied every module's schema and guard files twice, stopped the server, and then
removed the cluster folder. The removal failed with `EPERM` (Windows, right after the server process ended) and the
exception left the script before the result line was printed. Every module had been measured. The run ended with a
stack trace, a crash exit status and no verdict, and the folder was left in the temporary directory.

Two things were wrong:

1. The verdict depended on a cleanup step. A run that measured everything reported nothing.
2. The removal was not retried. The runtime's own retry option was measured on a folder that another process held:
   it answered `EPERM` in 2ms with `maxRetries: 10`. The option did not retry on this error.

## What changed (`scripts/lib/fs.js`, `scripts/module-db-check.js`, `scripts/module-admit.js`)

- `removeTree(dir)` (shared helper) tries the removal up to ten times with a 300ms pause and answers `null` when the folder is gone,
  the path when it is not. It does not throw.
- `stop()` of the cluster answers what `removeTree` answers. `main()` stops the cluster inside `finally`, catches
  anything a stop throws, computes the verdict from the module results alone, and prints the leftover folder as a
  note on stderr (text output) or as the field `leftover` (JSON output). The exit status is the verdict's.
- A failed `initdb` also removes its folder through `removeTree`.

## Scenarios (real child processes)

`node _harness_test/track49-db-cleanup/run-track.js`, result in `run-log.txt`.

| # | Scenario | Expected | Result |
|---|---|---|---|
| 1 | Every module passed, the stop throws `EPERM` (the incident) | exit 0, PASS line, folder named | MATCH |
| 2 | A module failed, the stop throws | exit 1, FAIL line | MATCH |
| 3 | Every module passed, clean stop | exit 0, PASS, no note | MATCH |
| 4 | A module failed, clean stop | exit 1, FAIL, no note | MATCH |
| 5 | JSON output, folder left behind | one JSON document, status PASS, `leftover` set, stderr empty | MATCH |
| 6 | JSON output, clean stop | no `leftover` field | MATCH |
| 7 | A folder really held for a moment by another process | a single removal fails with `EPERM`; `removeTree` removes it on a later try (1562ms), no exception | MATCH |
| 8 | A folder really held for the whole run | `removeTree` answers the path after 2859ms, no exception; removed once released | MATCH |

8 of 8 match. False positives 0 (rows 3, 4, 6: no note and no field when nothing was left). False negatives 0
(rows 1, 2, 5: the folder is named and the verdict is the modules' verdict).

Rows 1 to 6 replace the cluster with a recorder (the gate's own `main()` in a child process, `stop()` behaving as
the row says). Rows 7 and 8 use a real folder that a second process holds as its working directory.

## Tests

`src/__tests__/module-db-check.test.js`: 11 tests (4 new; the fourth is the stale-folder sweep): `removeTree` on a removable folder, on a removal that
always throws (ten tries, nine pauses) and on one that succeeds at the third try; a throwing stop keeps PASS and
names the folder; a throwing stop keeps FAIL; a clean stop and a stop that answers a non-path name no folder.

## Honest bounds

- Rows 7 and 8 were measured on Windows. On a platform that does not hold a working directory the runner records
  them as observations.
- The retry waits up to about three seconds. A folder held longer is left behind and named. That happened in the
  first real run after the fix (the whole library, 94 modules: verdict PASS printed, the folder named). Four minutes
  later the same folder was removable. So the next start of the gate removes cluster folders that carry its prefix,
  are older than ten minutes and hold no server pid file (`clearStale`, one try each; tested with an old folder, a
  folder with a pid file, a fresh one, a folder with another name and a held one). A folder of a run that never
  comes again stays.
- The same pattern was found by reading in the install step of `module-admit.js` (a removal inside `finally`, which
  on failure would have replaced the step's result and ended a whole-library admission without its summary). It now
  uses the same helper (`scripts/lib/fs.js` `removeTree`). That step was not run with a held folder in this track.
  The module manager's own removals (replacing an installed copy, removing a module) are the action the person
  asked for, not a cleanup after a measurement, and stay as they are. Other gates were not audited for the pattern.
