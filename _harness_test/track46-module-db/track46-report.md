# Track 46: module schemas and guards on a real PostgreSQL

## Why

Every module report until 2026-11-22 carried the line «not run on PostgreSQL»: schemas had been run on SQLite
only. The operator asked for what was left unverified to be verified. The first real run (a throwaway cluster of
the PostgreSQL 16.13 installed on this machine) showed two things:

- All 34 schemas of the library ran, and ran a second time.
- Seven modules kept «this table is append-only» with a trigger for SQLite only. On PostgreSQL an UPDATE or a
  DELETE of those rows went through. In five more modules the PostgreSQL triggers refused UPDATE and DELETE and
  let TRUNCATE through. Measured over thirteen modules: 70 of 77 attempted statements behaved as the module said
  before the fix, 77 of 77 after it.

Two things were built so that this is measured and not remembered:

- `scripts/module-db-check.js`: a throwaway cluster (trust authentication, 127.0.0.1 only, its own port and data
  folder, removed afterwards); per module the schema twice and every `db/*.postgres.sql` twice; tables and
  triggers counted. No PostgreSQL programs, a cluster that does not start, or no schema is NOT_RUN and exit 4.
- `scripts/module-check.js` rule `db-guard-one-dialect`: a guard file for one database without its twin for the
  other is a form finding.

## Scenarios (real child processes; the cluster is real when the machine has PostgreSQL)

`node _harness_test/track46-module-db/run-track.js`, result in `run-log.txt`.

| # | Scenario | Expected | Result |
|---|---|---|---|
| 1 | Schema with its PostgreSQL guard, both re-runnable | exit 0 | match |
| 2 | Schema that fails when applied again | exit 1 naming `schema.sql` | match |
| 3 | Guard file with an error | exit 1 naming the guard file | match |
| 4 | Module without a schema; a named folder without PostgreSQL; no module name | exit 4, 4, 2 | match |
| 5 | Guard for SQLite only (the state of seven library modules before this track) | `module-check` exit 1, `db-guard-one-dialect` | match |
| 6 | Guard in both dialects; plain schema without a guard | `module-check` exit 0 twice | match |

6 of 6 match. False pass 0 (scenarios 2, 3, 4, 5 must not pass and do not). False fail 0 (scenarios 1 and 6).

## Real library (observation)

Every module of the library that has a schema, at the time of the last run: 50 modules, 50 PASS; 100 tables, 62
triggers, 20 guard files. The log carries counts and no module names (the library is private).

## Found while running it

One run in the background ended «not measured»: the cluster did not start. The port drawn at random lay inside a
range the operating system keeps for itself (two such ranges inside 55000 to 59000 on this machine), where a
server cannot listen. The script now tries up to five ports and reports the server log's reason when none works.
The run was not counted as a pass in the meantime: exit 4 stopped the command chain that followed it.

## Honest bound

- The check shows that the SQL runs. Whether a guard refuses what it should is shown by the statements in each
  module's `docs/postgres-check.md` (run once by hand for thirteen modules), not by this script.
- One PostgreSQL version (16.13). Concurrency, locking statements and the modules' TypeScript adapters against
  PostgreSQL are not exercised.
- A table owner or superuser can still disable a trigger; that needs separate database roles and is the site's
  operations setting.
- On a machine without PostgreSQL programs scenarios 1 to 3 are not judged and the script says so; the harness's
  own continuous integration may be such a machine.
