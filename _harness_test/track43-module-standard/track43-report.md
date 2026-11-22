# Track 43: G25 modules used like plug-ins (module standard, form gate, take / status / update, drift, conversion)

Operator order 2026-11-22: modules must be separated better and must absorb what the projects improve; any session
in any folder takes the modules it needs and replaces an old one by the upgraded one; every module has a name, the
same subfolders and file name rules; the source is stable, the database separate, the module detachable.

Script: `run-track.js` (real child processes in temp folders, paths masked). Run log: `run-log.txt`.

| # | Scenario | Expected | Actual | Match |
|---|---|---|---|---|
| 1 | A module that follows the standard | exit 0 | exit 0 | ✅ |
| 2 | 17 modules each breaking one rule (name form, banned word, unknown folder, parts, file name, entry file, framework in `core/`, import leaving the module, undeclared requirement, undeclared setting, no tests, no security note, table prefix, foreign key to another module, changelog, origin) | exit 1 and the rule named, 17 of 17 | 17 of 17 | ✅ |
| 3 | What the standard allows (a declared sibling entry, a declared setting, a reference inside the module, a named exception, a dotted variant file name) | exit 0, no finding | exit 0 | ✅ |
| 4 | A folder with no module | exit 4, never a pass | exit 4 | ✅ |
| 5 | Take a module that requires another into an empty project | both arrive, record written, status 0, the installed module's own tests pass | all four | ✅ |
| 6 | The library gets a newer version of one module | status exit 1 naming that module only; update replaces the folder; status 0 | as expected, 1.0.0 to 1.1.0 | ✅ |
| 7 | The project edited a file inside the module, then the library moved on | update exit 1 naming the file, nothing changed; `--force` replaces and keeps the edit as a copy | as expected | ✅ |
| 8 | The same module checked out with other line endings | not behind, not modified | status exit 0 | ✅ |
| 9 | Remove a module another one needs, then the other, then it | 1, 0, 0; folders and record gone | 1, 0, 0 | ✅ |
| 10 | Nothing installed; the same with `--allow-none`; an unknown module | 4; 0; 1 | 4; 0; 1 | ✅ |
| 11 | A module's origin file changes in its source project after the module was taken | before: exit 0 (1 measured, 1 not measured); after: exit 1 naming the module, 1 commit | as expected | ✅ |
| 12 | Two packages of the older layout, one importing the other without declaring it | both converted, gate PASS, tests pass after the move, the missing requirement declared; a second run overwrites nothing | as expected | ✅ |
| 13 | Inside a kit project: list, add, status through the project launcher, and the kit's fixed check for modules | exit 0 each | 0, 0, 0, 0 | ✅ |
| 14 | The real module library on this machine | module-check PASS for every module | 74 modules, 0 findings | ✅ |
| 15 | Take one real module with what it requires into an empty project and run the installed modules' tests | add exit 0, tests exit 0 | 2 modules installed, tests 0, 0 | ✅ |

**0 false positives** (row 3: allowed forms are not reported; row 8: line endings are not content; a module that is
current is never called behind). **0 false negatives** (17 of 17 broken forms named; a newer library version, a local
edit, a required module and a changed origin each got the right exit code).

## Measured on the real library (2026-11-22)

| What | Value |
|---|---|
| Packages of the older stack-neutral layout converted to the standard | 68 of 68, source content unchanged |
| Form gate on the converted modules | PASS, 0 findings |
| The converted modules' own tests, run inside each module folder | 68 of 68 modules pass, 332 tests |
| Defects the conversion exposed | 2 packages imported a module they did not declare; 5 manifests carried a remark inside a requirement name |
| Origins that could be read against the source projects' git history | 248 of 305 |
| Origins changed since the module was taken | 109, in 44 modules |
| Modules in the library when this track last ran | 74 (68 converted, plus admin and other new modules being added) |

## Defects found while building it

| Found by | Defect | Fix |
|---|---|---|
| First run on the real library | A file name with a hyphen in its middle extension (`rules.xx-yy.ts`) was rejected | The extension rule accepts it |
| First run on the real library | The module test command `node --test test/` fails on this Node | Modules use `node --test` |
| Row 15, first run | A requirement name with a remark after it made the module impossible to install | Converter keeps the name only; gate rule `require-name-format`; five library manifests corrected |
| Git warning on commit | A checkout with other line endings would have made every module look behind | Text is hashed with normalized line endings |
| Self-run of the single-source gate | The two new scripts shared one helper and carried two sentences | One helper in `scripts/lib/fs.js`; sentences in the dictionary |

## Honest bound

- The gate checks form. That a module stands alone is shown by its own tests and by a throwaway install (rows 5, 15),
  not by the gate.
- The 68 converted modules are pure rules. The packages that carry screens, server code and database fragments are
  still in the older layout and are not plug-ins yet.
- `drift` counts commits on the origin paths. Whether a change is an improvement is decided by reading it.
- Update replaces a module folder. It does not migrate a database; a version that changes `db/` must say how.
- No project other than throwaway folders has installed a module through the manager yet.
- A module's security is checked by form only (a security note and rejection tests exist); the review itself is a
  reader's work.
