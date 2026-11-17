# Track 39: G23 standing orders and project kit

Driving data: `knowledge_base/field-lessons.json` (`orders`), kit `knowledge_base/project-kit/`.
Operator report 2026-11-17: the same commands are issued in every session and every new site; the module library
built from those sites should be used.
Script: `run-track.js` (real child processes in temp folders, paths masked in the log). Run log: `run-log.txt`.

| # | Scenario | Expected | Actual | Match |
|---|---|---|---|---|
| 1 | A new folder, tags ui/deploy/money | exit 0, 14 kit files, no unfilled slot | exit 0, 14/14, none | ✅ |
| 2 | Generated ledger through the project launcher | progress-check exit 0 | exit 0 | ✅ |
| 3 | Orders follow the project tags | O-01 in both; O-08 (deploy) only with the deploy tag | as expected | ✅ |
| 4 | Module plan defaults from tags | B01 참조, B07 이식, B21 제외 | B01 참조, B07 이식, B21 제외 | ✅ |
| 5 | Existing project with its own CLAUDE.md, ledger, checks, handoff and a Stop hook | own files byte-identical; orders block added; their hook kept and ours added; permissions untouched | all five hold | ✅ |
| 6 | Second run on the same folder | created 0, updated 0 | 0, 0 | ✅ |
| 7 | An order deleted by hand inside the block; a project rule written outside it | order restored, project rule kept | both | ✅ |
| 8 | One-shot orders and questions in a kit project (배포하라, 커밋하라, a single change order, two questions, 승인한다) | none arms the loop | none armed | ✅ |
| 9 | The operator's continuation words without the harness command word (3 prompts) | each arms the loop | all armed | ✅ |
| 10 | Armed, backlog open, turn ends | stop blocked, remaining units named | block, U1 named | ✅ |
| 11 | Armed, the agent tries to ask | question denied | deny | ✅ |
| 12 | A recorded stop condition (a real credential is missing) | stop allowed | allow | ✅ |
| 13 | Kit project with no armed run | stop allowed | allow | ✅ |
| 14 | A folder without `coolhan.project.json`, same words | not armed | not armed | ✅ |
| 15 | Harness folder not found | gate exit 4, hook exit 0 and no block, `where` exit 4 | 4, 0 no block, 4 | ✅ |
| 16 | Tool name that is a path | exit 2, nothing run | exit 2 | ✅ |
| 17 | Kit-generated module plan against the library | no module finding, 3 of 3 answered | none, 3/3 | ✅ |
| 18 | Row B07 removed | `module-bundle-unanswered` naming B07 only | exactly that | ✅ |
| 19 | Decision «나중에 정함» on B21 | `module-decision-invalid` naming B21 | exactly that | ✅ |
| 20 | Plan with no module table | `no-module-table` | `no-module-table` | ✅ |
| 21 | `handoff` in the kit project | exit 0; state block carries the goal line and 0/6 | both | ✅ |
| 22 | `handoff` with no ledger | exit 4, no file written | exit 4, none | ✅ |
| 23 | No intent; deploy value outside the two allowed | exit 2 twice, folder still empty | 2, 2, empty | ✅ |
| 24 | Registry with orders: validate and derived doc | both exit 0 | 0, 0 | ✅ |
| 25 | The real module library on this machine (read-only) | one row per bundle, all answered | 26/26, no module finding | ✅ |

**0 false positives** (an existing project keeps every file it had; an idle kit project is not blocked; one-shot
orders and questions do not start the backlog; a complete module plan passes; a recorded stop condition is honored).
**0 false negatives** (every removed row, free-text decision, missing table, missing ledger, missing harness and bad
argument was named with the right exit code).

**Defects found while building (registered in `docs/PROGRESS.md`):** D-11: the first project-mode pattern armed on
any order ending in «진행하라», so a single change order would have started the whole backlog; narrowed to
continuation words and the sentence is now a test case. D-12: order O-06 named a module plan path the kit did not
write; the registry was corrected and the doc re-rendered.

**Honest bound (C10):** every scenario runs in a temp folder against fixtures, plus one read-only comparison with
the real module library. No real project has yet gone from this kit to a finished site, so the claim "the operator
repeats fewer commands" is not measured; the next real site should record operator message counts against the
earlier projects. Orders whose enforce cell says only "규칙" are read text with no mechanical check. Scenario 25
is NOT_RUN on a machine without the library and is reported that way, not as a pass.
