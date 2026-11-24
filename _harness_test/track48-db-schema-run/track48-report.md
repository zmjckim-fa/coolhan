# Track 48: tables that no code of the module applies

## Why

The operator asked for every module to be brought to completion. Listing what «complete» lacked per module
(2026-11-24) showed 57 library modules that ship `db/schema.sql` and only a memory store. Their schemas had passed
the PostgreSQL check (track 46) and the column-width rule (track 47), and nothing in those modules ever ran the
module's own code on its own tables. Whether the store port and the tables fit each other was unknown.

SQLite stores were then written for 58 modules, each with a parity test: one scripted sequence of port calls run
against the memory store and the SQLite store, compared step by step, then the service on the real tables, then what
only a database can show. By the reports of those runs the real tables showed 109 faults. The kinds:

- A memory store that accepted what the table refuses: a duplicate id, a duplicate unique key, a second open
  request, a second live subscription, a second reversal of one ledger line.
- A rule that existed only as read-then-write in store code, or only as a comment in the schema: a message limit, a
  refund cap, «no overlapping locked periods», «verified rows never change». These became conditional statements,
  unique keys or guard files for both databases.
- Schemas that ran on PostgreSQL only and had never been applied on SQLite.
- Orderings that were never stated and differed between the two stores (ties decided by locale rules in one and by
  code units in the other).
- Tables with no column for a value the port carries, or no store at all.

One rule was built so that this is measured and not remembered: `scripts/module-check.js` rule
`db-schema-unexercised`. A module that has `db/schema.sql` while no source file under its `adapters/` or `test/`
names that file in a string is a form finding.

## Scenarios (real child processes)

`node _harness_test/track48-db-schema-run/run-track.js`, result in `run-log.txt`.

| # | Scenario | Expected | Result |
|---|---|---|---|
| 1 | Tables and a memory store only | `module-check` exit 1, `db-schema-unexercised` | match |
| 2 | The schema file named only in a comment and in a document | exit 1 (a mention is not a run) | match |
| 3 | An adapter that reads its own schema file | exit 0 | match |
| 4 | A test that reads the schema file | exit 0 | match |
| 5 | A module without tables | exit 0 | match |
| 6 | The premise: the same id written twice on a memory store and on the real table | memory accepts both, the table refuses the second | match |

6 of 6 match. False pass 0 (scenarios 1 and 2 must not pass and do not). False fail 0 (scenarios 3, 4, 5).

## Real library (observation)

93 modules with tables, 0 findings of the rule. The log carries counts and no module names (the library is private).

## Honest bound

- The rule is textual. It shows that some adapter or test names the schema file. Whether the store covers every
  port method and every rule is shown by the module's parity test, which a reviewer reads.
- The stores are SQLite. PostgreSQL is measured by running the DDL and the guard files; no module ships a
  PostgreSQL store, and concurrency was exercised with connections called in turn, not with parallel processes.
- The count of 109 is the sum of what the extraction runs reported. Each module was admitted again before its
  commit; the faults were not re-derived one by one.
