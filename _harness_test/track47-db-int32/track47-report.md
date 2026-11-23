# Track 47: a time or money column that is 32 bits wide on PostgreSQL

## Why

While the next modules were being extracted (2026-11-23), one extraction report carried an observation about a
finished module: its schema kept epoch milliseconds in columns declared `INTEGER`. On SQLite that type is 64 bits.
On PostgreSQL it is 32 bits, and a millisecond time of today (about 1.8e12) does not fit: the insert is refused with
«integer out of range». The module had passed the PostgreSQL check of track 46, because that check ran the DDL and
running DDL inserts nothing.

Counting the library: 32 columns in 15 finished modules were declared that way (times: `*_at`, `*_until`, `at_ms`;
money in minor units: `*_minor`). All 15 were changed to `BIGINT`: 14 as patch versions, one inside a version that
was not committed yet. Columns that hold a length of time or a flag (`duration_ms`, `latency_ms`, `cost_known`)
stay small and were left as they are.

Two things were built so that this is measured and not remembered:

- `scripts/module-check.js` rule `db-int32-column`: a column whose name says «a point in time» or «an amount of
  money» and whose type is `INTEGER`, `INT` or `INT4` in `db/*.sql` (the SQLite-only files are not read) is a form
  finding. `-- int4-ok: <reason>` on the line keeps a column that is known to stay small.
- `scripts/module-db-check.js` step `int32`: after the schema ran, the columns the database really made are read
  from its catalogue; a time or money column of type `integer` fails the module and is named. The name rule is the
  one exported by the form gate (one place).

## Scenarios (real child processes; the cluster is real when the machine has PostgreSQL)

`node _harness_test/track47-db-int32/run-track.js`, result in `run-log.txt`.

| # | Scenario | Expected | Result |
|---|---|---|---|
| 1 | Time column and money column declared INTEGER | `module-check` exit 1, `db-int32-column`, both named | match |
| 2 | The same columns as BIGINT | exit 0 | match |
| 3 | INTEGER for a length of time, a counter, a flag, a format number; a time kept as text | exit 0 | match |
| 4 | A time-named INTEGER column marked `int4-ok` with a reason | exit 0 | match |
| 5 | The narrow schema on a real PostgreSQL | `module-db-check` exit 1, both columns named | match |
| 6 | The wide, the small and the marked schema on a real PostgreSQL | exit 0, three PASS | match |
| 7 | The premise: a millisecond time written into an INTEGER and into a BIGINT column | INTEGER refuses «out of range», BIGINT keeps the value | match |

7 of 7 match. False pass 0 (scenarios 1 and 5 must not pass and do not). False fail 0 (scenarios 2, 3, 4, 6).

## Real library (observation)

After the fix the form gate reports 0 `db-int32-column` findings over the library's finished modules. The log
carries counts and no module names (the library is private).

## Honest bound

- The rule picks columns by name. A column that holds a time or an amount under a name that does not say so
  (`stamp`, `value`) is not found. A column named like a time that holds something small needs the marker.
- The check reads the column's width. It does not insert values, and it does not run a module's store code on
  PostgreSQL: a driver that returns 64-bit integers as text needs handling in the store adapter, and no module
  ships a PostgreSQL store yet.
- Sites that already created the tables on PostgreSQL keep the narrow columns until they run the `ALTER TABLE`
  statement each module's changelog names; the schema files do not change existing tables.
- One PostgreSQL version (16.13). On a machine without PostgreSQL programs scenarios 5 to 7 are not judged and
  the script says so.
