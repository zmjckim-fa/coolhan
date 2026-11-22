#!/usr/bin/env node
// Track 46: module schemas and guards on a real PostgreSQL; a guard written for one database only is a form finding.
// Real child processes, a throwaway cluster per run (paths masked). Usage: node _harness_test/track46-module-db/run-track.js
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const HOME = path.resolve(__dirname, '..', '..');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'track46-'));
const REAL_LIBRARY = process.env.COOLHAN_MODULES || 'C:/sites/00Module_site';
const { findBin } = require(path.join(HOME, 'scripts', 'module-db-check.js'));
const HAS_PG = !!findBin();
const log = [], rows = [];
const forms = (p) => [p.split(path.sep).join('\\\\'), p, p.split(path.sep).join('/')];
const MASK = [[TMP, '<tmp>'], [HOME, '<home>'], [path.resolve(REAL_LIBRARY), '<library>'], [os.homedir(), '<user>']];
const clean = (s) => MASK.reduce((out, [p, name]) => forms(p).reduce((o, f) => o.split(f).join(name), out), String(s || ''));
const check = (id, scenario, expected, actual, ok) => rows.push({ id, scenario, expected, actual: clean(actual), ok: ok === null ? null : !!ok });
const write = (root, rel, content) => { const f = path.join(root, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, content); };
function run(label, script, args, countsOnly = false) {
  const r = spawnSync(process.execPath, [path.join(HOME, 'scripts', script), ...args], { cwd: HOME, encoding: 'utf8', maxBuffer: 64 * 2 ** 20 });
  const out = (r.stdout || '') + (r.stderr || '');
  const shown = countsOnly ? out.split('\n').filter(l => /module-db-check:/.test(l)) : out.split('\n').filter(Boolean).slice(0, 6);
  log.push(`$ [${label}] node scripts/${script} ${clean(args.join(' '))}\n  exit ${r.status}\n${shown.map(l => '  ' + clean(l).slice(0, 220)).join('\n')}\n`);
  return { status: r.status, out };
}

const PARTS = ['core', 'api', 'user', 'admin', 'db', 'text', 'style', 'adapters', 'test', 'docs'];
const ABSENT = Object.fromEntries(PARTS.map(p => [p, `해당 없음: 이 모듈에 ${p} 부분이 없다`]));
let libs = 0;
function library(modules) {
  const lib = path.join(TMP, `lib${++libs}`);
  for (const [name, files] of Object.entries(modules)) {
    const dir = path.join(lib, 'modules', name);
    const hasDb = Object.keys(files).some(f => f.startsWith('db/'));
    const m = { name, version: '1.0.0', label: 'label', summary: 'what it does', area: name.split('-')[0], stack: 'none', parts: { ...ABSENT, core: true, test: true, ...(hasDb ? { db: true } : {}) }, requires: [], provides: { lib: ['rule'], tables: ['member_event'] }, settings: [], origin: [{ site: 'some-site', path: 'src/rule.js', commit: 'abc1234', date: '2026-11-01' }], test: 'node --test' };
    write(dir, 'module.json', JSON.stringify(m, null, 2)); write(dir, 'README.md', `# ${name}\n`); write(dir, 'CHANGELOG.md', '## 1.0.0\n- entry\n');
    write(dir, 'core/index.js', 'export function rule(x) { return x > 0; }\n'); write(dir, 'test/rule.test.js', "import { rule } from '../core/index.js';\n");
    for (const [rel, content] of Object.entries(files)) write(dir, rel, content);
  }
  return lib;
}
const SCHEMA = 'create table if not exists member_event (id text primary key, note text not null);\n';
const GUARD = "create or replace function member_event_no_change() returns trigger language plpgsql as $$ begin raise exception 'member_event is append-only'; end $$;\ndrop trigger if exists member_event_no_update on member_event;\ncreate trigger member_event_no_update before update or delete on member_event for each row execute function member_event_no_change();\n";
const SQLITE_GUARD = "create trigger if not exists member_event_no_update before update on member_event begin select raise(abort, 'append-only'); end;\n";
const measured = (ok) => (HAS_PG ? ok : null);
const note = HAS_PG ? '' : ' (no PostgreSQL programs on this machine: not measured)';

// 1. a schema and its guard, both re-runnable
let lib = library({ 'member-events': { 'db/schema.sql': SCHEMA, 'db/append-only.postgres.sql': GUARD, 'db/append-only.sqlite.sql': SQLITE_GUARD } });
let r = run('sound', 'module-db-check.js', ['member-events', '--library', lib]);
check(1, 'A schema with its PostgreSQL guard, both written to run again', 'exit 0, PASS', `exit ${r.status}${note}`, measured(r.status === 0 && /PASS/.test(r.out)));

// 2. a schema that cannot be applied a second time
lib = library({ 'member-once': { 'db/schema.sql': 'create table member_event (id text primary key);\n' } });
r = run('not repeatable', 'module-db-check.js', ['member-once', '--library', lib]);
check(2, 'A schema that fails when it is applied again', 'exit 1 naming schema.sql and the second run', `exit ${r.status}; names schema.sql ${/schema\.sql/.test(r.out)}${note}`, measured(r.status === 1 && /schema\.sql/.test(r.out)));

// 3. a guard that does not run on PostgreSQL
lib = library({ 'member-typo': { 'db/schema.sql': SCHEMA, 'db/append-only.postgres.sql': 'create trigger broken before update on no_such_table for each row execute function nothing();\n', 'db/append-only.sqlite.sql': SQLITE_GUARD } });
r = run('broken guard', 'module-db-check.js', ['member-typo', '--library', lib]);
check(3, 'A guard file with an error', 'exit 1 naming the guard file', `exit ${r.status}; names the guard ${/append-only\.postgres\.sql/.test(r.out)}${note}`, measured(r.status === 1 && /append-only\.postgres\.sql/.test(r.out)));

// 4. nothing to measure
lib = library({ 'member-rules': {}, 'member-events': { 'db/schema.sql': SCHEMA } });
const noSchema = run('no schema', 'module-db-check.js', ['member-rules', '--library', lib]);
const noBin = run('named folder without PostgreSQL', 'module-db-check.js', ['member-events', '--library', lib, '--pg-bin', path.join(TMP, 'nowhere')]);
const usage = run('usage', 'module-db-check.js', ['--library', lib]);
check(4, 'A module without a schema; a named folder that holds no PostgreSQL; no module name', 'exit 4, 4, 2 (not measured is never a pass)', `exit ${noSchema.status}, ${noBin.status}, ${usage.status}`, noSchema.status === 4 && noBin.status === 4 && usage.status === 2);

// 5-6. the form gate: a guarantee kept on one database only
lib = library({ 'member-events': { 'db/schema.sql': SCHEMA, 'db/append-only.sqlite.sql': SQLITE_GUARD } });
r = run('one dialect', 'module-check.js', [path.join(lib, 'modules', 'member-events')]);
check(5, 'A module whose append-only guard exists for SQLite only (the state of seven library modules before this track)', 'module-check exit 1 naming db-guard-one-dialect', `exit ${r.status}; ${/db-guard-one-dialect/.test(r.out)}`, r.status === 1 && /db-guard-one-dialect/.test(r.out));
lib = library({ 'member-events': { 'db/schema.sql': SCHEMA, 'db/append-only.sqlite.sql': SQLITE_GUARD, 'db/append-only.postgres.sql': GUARD }, 'member-plain': { 'db/schema.sql': SCHEMA } });
const both = run('both dialects', 'module-check.js', [path.join(lib, 'modules', 'member-events')]);
const plain = run('plain schema', 'module-check.js', [path.join(lib, 'modules', 'member-plain')]);
check(6, 'The guard in both dialects; a module with a plain schema and no guard', 'module-check exit 0 for both (no false finding)', `exit ${both.status}, ${plain.status}`, both.status === 0 && plain.status === 0);

// 7. the real library (observation; counts only: the library is private)
if (HAS_PG && fs.existsSync(path.join(REAL_LIBRARY, 'modules'))) {
  r = run('real library', 'module-db-check.js', ['--all', '--library', REAL_LIBRARY], true);
  check(7, 'Every module of the real library that has a schema', 'observation: counts', `exit ${r.status}; ${(r.out.split('\n').find(l => /module-db-check:/.test(l)) || '').replace(/^.*module-db-check: /, '')}`, null);
} else check(7, 'Every module of the real library that has a schema', 'observation', 'no PostgreSQL programs or no library on this machine: not measured', null);

fs.rmSync(TMP, { recursive: true, force: true });
const judged = rows.filter(x => x.ok !== null);
const lines = [`Track 46 module database check: ${judged.filter(x => x.ok).length}/${judged.length} scenarios match, ${rows.length - judged.length} not judged`, ''];
for (const x of rows) lines.push(`${x.ok === null ? 'OBSERVED' : x.ok ? 'MATCH' : 'MISMATCH'} #${x.id} ${x.scenario}`, `    expected: ${x.expected}`, `    actual:   ${x.actual}`);
fs.writeFileSync(path.join(__dirname, 'run-log.txt'), `${lines.join('\n')}\n\n--- commands ---\n${log.join('\n')}`);
console.log(lines.join('\n'));
process.exit(judged.every(x => x.ok) ? 0 : 1);
