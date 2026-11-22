# Track 42: the project kit carried through a real small site, from one operator sentence to verified screens

Open question from v2.10.0 and v2.11.0: no real site had gone through the kit end to end. This track does it once,
inside the repository, and fixes in the harness every kit defect it meets.

The operator's whole instruction for the site: «동네 빵집의 영업시간과 메뉴를 보여 주는 사이트를 만들어라. 관리자가 메뉴와
영업시간을 고칠 수 있어야 한다.» The site is under `site/` (an invented bakery; no real data). Findings as they were met:
`findings.md`.

## What was done, in order

| Stage | What | Measured |
|---|---|---|
| Kit install | `new-project.js` into an empty folder | 14 files written, nothing overwritten |
| Planning | Common rules first, then four planners in parallel (DB, screens, design, source), main plan, module plan, lesson plan | 8 documents, 154 tables, 18 diagram files; schema check 42/42; contrast 51/51; module bundles 26/26 answered; lessons 11/11 answered |
| Plan review | Two passes by a reviewer that did not write the plan | pass 1: 2 blocking, 9 defect-causing, 16 minor; pass 2 after fixes: 1 blocking (present from the first draft), 2 defect-causing, 8 minor; all fixed |
| Backlog | 13 units in 8 waves from `plan.json` | `plan-check` PASS, `parallel-plan` 8 waves |
| Implementation | 13 units, each verified by its own command, re-verified independently, committed by path | `node --test` 191 tests, 0 failed, 0 skipped; zero runtime dependencies |
| Browser | Each screen unit at 320, 375 and 1280px against the real server; a final pass through the app's own login with data saved through the admin API and read back on the visitor page | no horizontal scroll at any width; 4 defects of the shared screen base found by browser rows and fixed (D-1 to D-4) |
| Fixed checks | The site's `docs/CHECKS.md` in full | 통과 10 · 실패 0 · 확인 안 함 28 (the 28 are accessibility rows that need a person) |

## Kit defects met and what became of them

| # | Defect | Fix in the harness | Test |
|---|---|---|---|
| K-1 | The planning gate passed with none of the four deliverables present | `plan-doc-check` rule `trace-file-missing`; the kit check requires the four deliverables as trace rows | plan-doc-check suite |
| K-2 | The supervisor could not say that the session client is not logged in | `nonstop.js` stops at once with CMD_ERROR and the cause | nonstop suite |
| K-3 | The kit's own lesson command failed inside a project (registry looked up under the project) | `field-lessons.js` falls back to the harness registry | project-kit suite |
| K-4 | The goal file recorded the installer's summary as the operator's command | `new-project.js --command "<the operator's words>"`; the global instruction passes it | project-kit suite |
| K-6 | The ledger template named only two scripts as the planning gate | The template row includes the integration review | template |
| K-8 | A project package file with `"type": "module"` would have broken the launcher, every gate and all three hooks | The launcher runs under both module systems | project-kit suite (real module-type project) |
| K-9 | The wave planner ignored files a unit edits | `parallel-plan.js` counts `edits` and `touches` | parallel-plan suite |
| K-11 | The completion gate read a backlog numbered `U-01` as empty (0 of 0) | `completion-check.js` accepts `U-01` and `P1` | completion-check suite |
| K-13 | The strict single-source check counted the labels of a verification script as product text | `single-source-check.js --skip-files` | single-source suite |
| K-5, K-7, K-10, K-12 | Process gaps: two planners needed each other's error codes; a command in the plan that no gate ran; one review pass is not enough; a shared base unit had no browser row of its own | Plan reviewer rules (repeat the review after fixes; shared pieces carry their own check; a unit's verification must run with only its dependencies built) | reviewer text, not mechanical |

## What this run shows about the kit

- The mechanical gates were necessary and not sufficient. All four passed before each review; the reviews found three
  blocking faults the gates could not see. The planning gate now refuses a plan whose deliverables are only promised,
  and the ledger asks for the review.
- Every blocking fault that reached implementation came from one planner not knowing what another had written.
  Fixing names, IDs, columns, components and the API list before the planners started removed that class for names;
  it remained for behaviour (error codes, session lifetime, a module-type package file).
- Browser rows found what unit tests could not: four defects in files whose own tests were green.
- The fixed list keeps the manual accessibility rows visible as 확인 안 함. The site is not «완료» by the kit's own
  definition while they are open; that is the intended result, not a failure of the run.

## Operator messages

One sentence started the site. No further operator message was needed for planning, review, implementation or
verification. Three decisions were taken as defaults and are listed for the operator (`site/docs/BLOCKED.md`): the
live open-or-closed status, the sold-out mark and manual menu ordering are not in the sentence word for word.

## Honest bound

- The site was built by this session and its subagents inside the harness repository, not by a fresh session in
  another folder. Whether a fresh session obeys the global instructions is still not observed: the bundled command
  line client answered «Not logged in», and logging it in is the operator's step.
- One site, one stack (plain Node and SQLite), four screens. A larger site with payments or external services
  exercises parts of the kit this run did not touch.
- The module library gave this site nothing to install: its installable packages assumed another stack. That finding
  started the module standard work (track 43).
- Accessibility rows that need a person (28) are not measured. Safari and Firefox were not opened.
- The plan carries three features the operator did not ask for word for word; they are recorded as decisions, and a
  stricter reading would have left them out.
