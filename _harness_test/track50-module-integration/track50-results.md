# Track 50: modules that fit together and carry their design

Run: 2026-11-24 · 18 pass · 0 fail · 0 not measured

| # | Scenario | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | Two modules that agree (a version range, an export, a token with its default) | exit 0, PASS, no finding | exit 0 | PASS |
| 2 | A required module that is not in the library | exit 1 naming requires-unresolved | exit 1; rules requires-unresolved | PASS |
| 3 | A version the range does not accept | exit 1 naming requires-range | exit 1; rules requires-range | PASS |
| 4 | Two modules that require each other | exit 1 naming requires-cycle | exit 1; rules requires-cycle | PASS |
| 5 | provides.lib names something nobody exports | exit 1 naming lib-not-exported | exit 1; rules lib-not-exported | PASS |
| 6 | An export that another module may not import (outside core/index and the listed entries) | exit 1 naming lib-not-reachable | exit 1; rules lib-not-reachable | PASS |
| 7 | A screen module with no style/tokens.css (its look cannot travel) | exit 1 naming screen-without-tokens | exit 1; rules screen-without-tokens | PASS |
| 8 | A colour written into a screen outside tokens | exit 1 naming color-literal | exit 1; rules color-literal | PASS |
| 9 | A text key present in one language and missing in the other | exit 1 naming text-language-gap | exit 1; rules text-language-gap | PASS |
| 10 | Two modules that create the same table | exit 1 naming table-owner-conflict | exit 1; rules table-owner-conflict | PASS |
| 11 | A design module whose bridge assigns none of the screen module's tokens | exit 1 naming bridge-gap | exit 1; rules bridge-gap | PASS |
| 12 | The same pair with the bridge assigning the token | exit 0, no false finding | exit 0 | PASS |
| 13 | --only a clean module of a library that has a defect elsewhere | exit 0 | exit 0 | PASS |
| 14 | --only the defective module | exit 1 | exit 1 | PASS |
| 15 | A folder without modules | exit 4 (never a pass) | exit 4 | PASS |
| 16 | Admission of a module whose own test passes but names an export it lacks | exit 1; test PASS, integration FAIL | exit 1; {"form":"PASS","test":"PASS","install":"PASS","secrets":"PASS","integration":"FAIL"} | PASS |
| 17 | The real module library after the per-module audit | exit 0, findings 0 | exit 0; modules 219; findings 0 | PASS |
| 18 | The audit order puts a required module before the modules that require it | every required module earlier in the list | 219 modules | PASS |
