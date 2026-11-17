# Track 40: G24 standing orders for every session, kit drift check, install guard, legacy defects closed

Operator question 2026-11-17: do all sessions now use CoolHan, or must each command say so? The way to apply it
must be simple and every command must carry CoolHan's rules.
Answer before this work: only sessions inside the harness repository or inside a folder where the kit was installed.
Script: `run-track.js` (real child processes in temp folders, paths masked). Run log: `run-log.txt`.

| # | Scenario | Expected | Actual | Match |
|---|---|---|---|---|
| 1 | No instruction file on the machine, `--check` | exit 4 (not installed is not a pass), nothing written | exit 4, 0 files | ✅ |
| 2 | Install into a file that already holds the operator's rules | own text first and byte-identical; all orders; harness path and kit rule; earlier file kept beside it | all hold, orders 18/18 | ✅ |
| 3 | User settings file beside it | unchanged | unchanged | ✅ |
| 4 | Second run | exit 0, file byte-identical | identical | ✅ |
| 5 | One order deleted by hand inside the block | `--check` exit 1 | exit 1 | ✅ |
| 6 | Re-run after the hand edit | order restored; text appended outside the block kept; first kept copy not replaced | all three | ✅ |
| 7 | Install then `--remove` | file equals the original byte for byte; `--check` back to 4 | identical, 4 | ✅ |
| 8 | Unknown flag; stray argument; `--dry` | exit 2, 2, 0 and nothing written | 2, 2, 0, 0 files | ✅ |
| 9 | Kit pointed at the harness folder and at the module library | exit 2 twice; neither folder gains a file | 2, 2, untouched | ✅ |
| 10 | `new-project --check` on a folder without the kit | exit 4, nothing written | exit 4 | ✅ |
| 11 | Fresh kit plus a project rule written outside the block | exit 0 | exit 0 | ✅ |
| 12 | An order deleted and the Stop hook removed | exit 1 naming both files; nothing rewritten by the check | exit 1, both named, not rewritten | ✅ |
| 13 | `--refresh` then `--check` | exit 0; project rule still there | exit 0, kept | ✅ |
| 14 | Harness self-scan after moving `get` / `parseFlags` / `readText` into `scripts/lib` (D-2, D-3, D-4) | duplicate helpers 0 | 0 (was 3 groups in 13 files) | ✅ |
| 15 | Harness self-scan for swallowed errors (D-8) | F-05 hits 0 | 0 (was 4) | ✅ |
| 16 | This machine's own instruction file | exit 0, or NOT_RUN where not installed | exit 0, current | ✅ |

**0 false positives** (the operator's own rules and settings are never changed; a project's own text is not drift;
a current block passes). **0 false negatives** (a hand-edited block, a removed hook, a missing install, a wrong
target folder and a bad argument each got the right exit code).

**Observed while building (registered as D-13 in `docs/PROGRESS.md`):** two full test runs failed in tests that
spawn a hook and read its output: the output was empty. Measured with the CPU saturated and synchronous launches
from 8 to 10 worker processes: one run showed 37 spawn errors and 4 children that died at start with no output in
1,200 launches; 5,700 further launches showed none. The child never started, so the hook code did not run and was
not changed. `scripts/lib/spawn-node.js` (`runNode`) now retries only that case (spawn error, no exit status, or
a non-zero exit with no output at all), at most twice, and reports each retry; a script that ran and failed is
returned as it is (4 unit tests). What on the machine blocks process start was not identified, so D-13 stays open.

**Honest bound (C10):** the track proves the block is installed, derived, restorable and removable. It does not
prove that a session obeys the block: no fresh session in another folder was observed here. The next session
opened in any other project is the first real measurement, and what to look for is written in the handoff.
The block adds about 8 KB to what every session loads.
