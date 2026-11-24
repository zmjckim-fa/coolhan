# Track 50: modules that fit together and carry their design

## Why

The operator ordered a hunt for the weak points of every finished module, a check that modules work with each other,
and design that moves with the module (adapted to the new site, never rebuilt). The form gate (`module-check`) reads
one module. A module could pass it, pass its own tests, and still name an export its neighbours cannot import, require
a version the library does not hold, paint with a colour that no token carries, or belong to a design system whose
bridge never touches its tokens.

`scripts/module-integration-check.js` reads the whole library (read-only, 14 rules, exit 4 when it finds no module)
and `scripts/module-admit.js` now runs it as the fifth admission step: the library is read once per run and the
findings of the named module are the step's result.

## What was run

Real child processes on throwaway libraries (paths masked in `run-log.txt`), then the real library read-only.

| Group | Scenarios | Result |
|---|---|---|
| Agreeing library | 1 (version range, export, token with default) | exit 0, no false finding |
| One defect each | 2-10 (unresolved require, range not met, ring, name not exported, name not reachable, screen without tokens, colour outside tokens, text gap, two owners of a table) | exit 1, the rule named each time |
| Design bridge | 11-12 (a bridge that assigns none of the screen module's tokens; the same pair once it assigns one) | exit 1 with `bridge-gap`; exit 0 |
| Scope and empty | 13-15 (`--only` clean module, `--only` defective module, folder without modules) | exit 0; exit 1; exit 4 |
| Admission | 16 (own test passes, names an export it lacks) | exit 1; test PASS, integration FAIL |
| Real library | 17-18 (219 modules, audit order) | exit 0, findings 0; order lists every module with its requirements earlier |

Result: **18 of 18 as expected, 0 false positives, 0 false negatives** (`track50-results.md`).

## The audit this track belongs to

The check was built first and used as the machine half of an audit in which every one of the 219 library modules was
read in full by its own agent (read, machine findings, six lenses: weakness, behaviour, input and storage, design,
transfer, fit; fix only inside the module; a test per defect; version and CHANGELOG; admission). First library
measurement of the check: 392 findings; after the audit and the fixes: 0. By the report tables about 980 findings
were fixed. The largest groups: behaviour and logic, vulnerabilities (permission and path bypasses, names that reach
the object prototype, unchecked money and dates, a log table overwritten through `INSERT OR REPLACE`, internal names
shown to customers), input and storage mismatches, 44 fit findings, and touch and design faults (a help bubble
that a finger opened and closed again, in nine modules).

## Honest bounds

- The check reads text. It proves that names, versions, tokens, tables and routes agree on paper. Whether two
  modules behave together at run time is shown by their tests and by the consuming project's own type check; the
  last admission (24 modules, 65 versions taken by the demo project, `npm run typecheck`) passed.
- Whether a screen looks right on a real site is a person's look at two widths; the 656-address sweep of the demo
  project was not repeated after the audit in this run (the dev server could not keep up with the update burst).
- A new test was not run against the old code for every fix; some attempts were refused by the sandbox.
