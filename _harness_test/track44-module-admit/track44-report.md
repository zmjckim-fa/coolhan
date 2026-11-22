# Track 44: module admission in one command

## Why

A module must show four things before it is committed to the library: the form gate, its own tests, an install
into an empty folder with the tests run inside the installed copy, and the secret scan. They were run by hand, one
shell line each. On 2026-11-22 one library commit went in while the scan had four findings: the scan ran, and its
exit status sat behind a pipe, so the line that followed it ran regardless. The findings were invented test values
and were marked in the next commit. A real secret would have gone the same way.

`scripts/module-admit.js` runs the four steps per module and reads every exit status. A step that measured
nothing is NOT_RUN and the run ends with 4.

## Scenarios (real child processes, temp libraries)

`node _harness_test/track44-module-admit/run-track.js`, result in `run-log.txt`.

| # | Scenario | Expected | Result |
|---|---|---|---|
| 1 | Sound module, its requirement installed beside it | exit 0, four PASS | match |
| 2 | Failing test | exit 1, test FAIL and install FAIL | match |
| 3 | Form and tests pass, one line looks like a secret (the incident) | exit 1, secrets FAIL | match |
| 4 | The same line carrying the scan marker | exit 0 | match |
| 5 | Test command exits 0 having run 0 tests | exit 4, test NOT_RUN | match |
| 6 | Folder the standard does not know | exit 1, form FAIL, install NOT_RUN | match |
| 7 | Test reads an undeclared neighbour module at run time | exit 1, test PASS in the library, install FAIL | match |
| 8 | `--all` with one sound and one failing module | exit 1, PASS and FAIL kept apart | match |
| 9 | Unknown module, missing library, no module name | exit 4, 4, 2 | match |

9 of 9 match. False pass 0 (scenarios 2, 3, 5, 6, 7 must not pass and do not). False fail 0 (scenarios 1 and 4
must pass and do).

## Real library (observation)

Every committed module of the library on this machine at the time of the run: 88 modules, 88 PASS, 0 FAIL,
0 NOT_RUN; steps not PASS: form 0, test 0, install 0, secrets 0. Modules another session was still writing are
left out (only tracked folders are admitted). The library is private, so the log carries counts and no module
names. The run took more than ten minutes (four steps and several child processes per module).

## What was learned while building it

- Node's test runner counts a file that defines no test as one passing test, so «0 tests» cannot be detected from
  an empty test file. It is detected when the command matches no file (the runner prints `tests 0` and exits 0).
- The install step is the only one that shows a module leaning on its neighbours: scenario 7 passes the form gate
  and its tests inside the library.

## Honest bound

- Admission reads what the module's own tests assert. A module with weak tests passes.
- The secret scan is textual. A clean scan lowers the risk; it does not prove that no secret is present.
- Screens inside a module are not opened in a browser.
- The script commits nothing. The library commit is a separate act after exit 0, and nothing in the library
  refuses a commit made without it.
- An empty test file is not detected as «nothing measured» (see above).
