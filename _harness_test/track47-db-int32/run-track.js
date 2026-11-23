#!/usr/bin/env node
// Track 47: a time or money column declared INTEGER is 32 bits wide on PostgreSQL. The form gate names it and the
// database check names it from what the database really made. Real child processes, a throwaway cluster (paths masked).
// Usage: node _harness_test/track47-db-int32/run-track.js
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const HOME = path.resolve(__dirname, '..', '..');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'track47-'));
const REAL_LIBRARY = process.env.COOLHAN_MODULES || 'C:/sites/00Module_site';
const { findBin, startCluster } = require(path.join(HOME, 'scripts', 'module-db-check.js'));
const BIN = findBin();
const HAS_PG = !!BIN;
const log = [], rows = [];
const forms = (p) => [p.split(path.sep).join('\\\\'), p, p.split(path.sep).join('/')];
const MASK = [[TMP, '<tmp>'], [HOME, '<home>'], [path.resolve(REAL_LIBRARY), '<library>'], [os.homedir(), '<user>']];
const clean = (s) => MASK.reduce((out, [p, name]) => forms(p).reduce((o, f) => o.split(f).join(name), out), String(s || ''));
const check = (id, scenario, expected, actual, ok) => rows.push({ id, scenario, expected, actual: clean(actual), ok: ok === null ? null : !!ok });
const write = (root, rel, content) => { const f = path.join(root, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, content); };
function run(label, script, args, countsOnly = false) {
  const r = spawnSync(process.execPath, [path.join(HOME, 'scripts', script), ...args], { cwd: HOME, encoding: 'utf8', maxBuffer: 64 * 2 ** 20 });
  const out = (r.stdout || '') + (r.stderr || '');
  const shown = countsOnly ? out.split('\n').filter(l => /module-(?:db-)?check:/.test(l)) : out.split('\n').filter(Boolean).slice(0, 6);
  log.push(`$ [${label}] node scripts/${script} ${clean(args.join(' '))}\n  exit ${r.status}\n${shown.map(l => '  ' + clean(l).slice(0, 220)).join('\n')}\n`);
  return { status: r.status, out };
}

const PARTS = ['core', 'api', 'user', 'admin', 'db', 'text', 'style', 'adapters', 'test', 'docs'];
const ABSENT = Object.fromEntries(PARTS.map(p => [p, `해당 없음: 이 모듈에 ${p} 부분이 없다`]));
let libs = 0;
function library(modules) {
  const lib = path.join(TMP, `lib${++libs}`);
  for (const [name, schema] of Object.entries(modules)) {
    const dir = path.join(lib, 'modules', name);
    const m = { name, version: '1.0.0', label: 'label', summary: 'what it does', area: name.split('-')[0], stack: 'none', parts: { ...ABSENT, core: true, test: true, db: true }, requires: [], provides: { lib: ['rule'], tables: ['member_event'] }, settings: [], origin: [{ site: 'some-site', path: 'src/rule.js', commit: 'abc1234', date: '2026-11-01' }], test: 'node --test' };
    write(dir, 'module.json', JSON.stringify(m, null, 2)); write(dir, 'README.md', `# ${name}\n`); write(dir, 'CHANGELOG.md', '## 1.0.0\n- entry\n');
    write(dir, 'core/index.js', 'export function rule(x) { return x > 0; }\n'); write(dir, 'test/rule.test.js', "import { rule } from '../core/index.js';\n");
    write(dir, 'db/schema.sql', schema);
  }
  return lib;
}
const table = (cols) => `create table if not exists member_event (\n  id text primary key,\n${cols.map(c => `  ${c}`).join(',\n')}\n);\n`;
const measured = (ok) => (HAS_PG ? ok : null);
const note = HAS_PG ? '' : ' (no PostgreSQL programs on this machine: not measured)';
const NARROW = table(['created_at INTEGER NOT NULL', 'amount_minor INTEGER NOT NULL']);
const WIDE = table(['created_at BIGINT NOT NULL', 'amount_minor BIGINT NOT NULL']);
const SMALL = table(['duration_ms INTEGER', 'attempts INTEGER NOT NULL DEFAULT 0', 'cost_known INTEGER', 'format INTEGER', 'note_at TEXT']);
const MARKED = table(['expires_at INTEGER NOT NULL -- int4-ok: days since sign-up, never an epoch']);

// 1-4. the form gate
let lib = library({ 'member-narrow': NARROW, 'member-wide': WIDE, 'member-small': SMALL, 'member-marked': MARKED });
const mod = (n) => path.join(lib, 'modules', n);
let r = run('narrow', 'module-check.js', [mod('member-narrow')]);
check(1, 'A time column and a money column declared INTEGER (the state of 32 columns in 15 library modules before this track)', 'module-check exit 1 naming db-int32-column and both columns', `exit ${r.status}; rule ${/db-int32-column/.test(r.out)}; columns ${/created_at/.test(r.out) && /amount_minor/.test(r.out)}`, r.status === 1 && /db-int32-column/.test(r.out) && /created_at/.test(r.out) && /amount_minor/.test(r.out));
r = run('wide', 'module-check.js', [mod('member-wide')]);
check(2, 'The same columns as BIGINT', 'module-check exit 0', `exit ${r.status}`, r.status === 0);
r = run('small', 'module-check.js', [mod('member-small')]);
check(3, 'INTEGER for a length of time, a counter, a flag, a format number; a time kept as text', 'module-check exit 0 (no false finding)', `exit ${r.status}`, r.status === 0);
r = run('marked', 'module-check.js', [mod('member-marked')]);
check(4, 'A time-named INTEGER column with «int4-ok: reason» on its line', 'module-check exit 0', `exit ${r.status}`, r.status === 0);

// 5-6. the database check: what the database made decides
r = run('db narrow', 'module-db-check.js', ['member-narrow', '--library', lib]);
check(5, 'The narrow schema on a real PostgreSQL', 'exit 1 naming member_event.created_at and member_event.amount_minor', `exit ${r.status}; names ${/member_event\.created_at/.test(r.out) && /member_event\.amount_minor/.test(r.out)}${note}`, measured(r.status === 1 && /member_event\.created_at/.test(r.out) && /member_event\.amount_minor/.test(r.out)));
r = run('db others', 'module-db-check.js', ['member-wide', 'member-small', 'member-marked', '--library', lib]);
check(6, 'The wide, the small and the marked schema on a real PostgreSQL', 'exit 0, three PASS (no false failure)', `exit ${r.status}; ${(r.out.split('\n').find(l => /module-db-check:/.test(l)) || '').replace(/^.*module-db-check: /, '')}${note}`, measured(r.status === 0 && /통과 3/.test(r.out)));

// 7. the premise, measured: the value a module really writes does not fit the narrow column
if (HAS_PG) {
  const cluster = startCluster(BIN);
  if (cluster.error) check(7, 'An epoch-millisecond value written into each column', 'narrow refused, wide accepted', `cluster did not start: ${cluster.error}`, null);
  else {
    try {
      const NOW_MS = 1795000000000; // a point in time in 2026, in milliseconds
      cluster.psql('postgres', ['-c', 'create table narrow (created_at integer); create table wide (created_at bigint)']);
      const n = cluster.psql('postgres', ['-c', `insert into narrow values (${NOW_MS})`]);
      const w = cluster.psql('postgres', ['-c', `insert into wide values (${NOW_MS})`]);
      const back = String(cluster.psql('postgres', ['-At', '-c', 'select created_at from wide']).stdout).trim();
      log.push(`$ [premise] insert ${NOW_MS} into integer: exit ${n.status} ${clean(String(n.stderr).split('\n')[0]).slice(0, 120)}\n$ [premise] insert into bigint: exit ${w.status}, read back ${back}\n`);
      check(7, 'An epoch-millisecond value written into an INTEGER column and into a BIGINT column on a real PostgreSQL', 'INTEGER refuses with «out of range»; BIGINT keeps the value', `integer: exit ${n.status}, out of range ${/out of range/.test(n.stderr)}; bigint: exit ${w.status}, read back ${back}`, n.status !== 0 && /out of range/.test(n.stderr) && w.status === 0 && back === String(NOW_MS));
    } finally { cluster.stop(); }
  }
} else check(7, 'An epoch-millisecond value written into each column', 'narrow refused, wide accepted', 'no PostgreSQL programs on this machine: not measured', null);

// 8. the real library (observation; counts only: the library is private)
if (fs.existsSync(path.join(REAL_LIBRARY, 'modules'))) {
  r = run('real library form', 'module-check.js', [path.join(REAL_LIBRARY, 'modules')], true);
  const n = (r.out.match(/db-int32-column/g) || []).length;
  check(8, 'The form gate over the real library', 'observation: number of db-int32-column findings', `exit ${r.status}; db-int32-column findings ${n}`, null);
} else check(8, 'The form gate over the real library', 'observation', 'no library on this machine: not measured', null);

fs.rmSync(TMP, { recursive: true, force: true });
const judged = rows.filter(x => x.ok !== null);
const lines = [`Track 47 32-bit columns: ${judged.filter(x => x.ok).length}/${judged.length} scenarios match, ${rows.length - judged.length} not judged`, ''];
for (const x of rows) lines.push(`${x.ok === null ? 'OBSERVED' : x.ok ? 'MATCH' : 'MISMATCH'} #${x.id} ${x.scenario}`, `    expected: ${x.expected}`, `    actual:   ${x.actual}`);
fs.writeFileSync(path.join(__dirname, 'run-log.txt'), `${lines.join('\n')}\n\n--- commands ---\n${log.join('\n')}`);
console.log(lines.join('\n'));
process.exit(judged.every(x => x.ok) ? 0 : 1);
