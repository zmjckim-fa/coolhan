#!/usr/bin/env node
// Track 48: tables that no code of the module applies. The form gate names a module whose db/schema.sql is never
// read by its own adapters or tests. Real child processes (paths masked).
// Usage: node _harness_test/track48-db-schema-run/run-track.js
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const HOME = path.resolve(__dirname, '..', '..');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'track48-'));
const REAL_LIBRARY = process.env.COOLHAN_MODULES || 'C:/sites/00Module_site';
const log = [], rows = [];
const forms = (p) => [p.split(path.sep).join('\\\\'), p, p.split(path.sep).join('/')];
const MASK = [[TMP, '<tmp>'], [HOME, '<home>'], [path.resolve(REAL_LIBRARY), '<library>'], [os.homedir(), '<user>']];
const clean = (s) => MASK.reduce((out, [p, name]) => forms(p).reduce((o, f) => o.split(f).join(name), out), String(s || ''));
const check = (id, scenario, expected, actual, ok) => rows.push({ id, scenario, expected, actual: clean(actual), ok: ok === null ? null : !!ok });
const write = (root, rel, content) => { const f = path.join(root, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, content); };
function run(label, file, args, countsOnly = false) {
  const r = spawnSync(process.execPath, [file, ...args], { cwd: HOME, encoding: 'utf8', maxBuffer: 64 * 2 ** 20 });
  const out = (r.stdout || '') + (r.stderr || '');
  const shown = countsOnly ? out.split('\n').filter(l => /module-check:/.test(l)) : out.split('\n').filter(Boolean).slice(0, 5);
  log.push(`$ [${label}] node ${clean(path.relative(HOME, file).split(path.sep).join('/'))} ${clean(args.join(' '))}\n  exit ${r.status}\n${shown.map(l => '  ' + clean(l).slice(0, 220)).join('\n')}\n`);
  return { status: r.status, out };
}
const GATE = path.join(HOME, 'scripts', 'module-check.js');

const PARTS = ['core', 'api', 'user', 'admin', 'db', 'text', 'style', 'adapters', 'test', 'docs'];
const ABSENT = Object.fromEntries(PARTS.map(p => [p, `해당 없음: 이 모듈에 ${p} 부분이 없다`]));
let n = 0;
function moduleWith(files) {
  const dir = path.join(TMP, `lib${++n}`, 'member-events');
  const has = (part) => Object.keys(files).some(k => k.startsWith(`${part}/`));
  const m = { name: 'member-events', version: '1.0.0', label: 'label', summary: 'what it does', area: 'member', stack: 'none', parts: { ...ABSENT, core: true, test: true, ...(has('db') ? { db: true } : {}), ...(has('adapters') ? { adapters: true } : {}), ...(has('docs') ? { docs: true } : {}) }, requires: [], provides: { lib: ['rule'], ...(has('db') ? { tables: ['member_event'] } : {}) }, settings: [], origin: [{ site: 'some-site', path: 'src/rule.js', commit: 'abc1234', date: '2026-11-01' }], test: 'node --test' };
  write(dir, 'module.json', JSON.stringify(m, null, 2)); write(dir, 'README.md', '# member-events\n'); write(dir, 'CHANGELOG.md', '## 1.0.0\n- entry\n');
  write(dir, 'core/index.js', 'export function rule(x) { return x > 0; }\n'); write(dir, 'test/rule.test.js', "import { rule } from '../core/index.js';\n");
  for (const [rel, content] of Object.entries(files)) write(dir, rel, content);
  return dir;
}
const SCHEMA = 'create table if not exists member_event (id text primary key, note text not null);\n';
const MEMORY = 'export const createMemoryStore = () => { const rows = new Map(); return { put: (r) => { rows.set(r.id, r); }, all: () => [...rows.values()] }; };\n';

// 1-5. the form gate
let r = run('memory store only', GATE, [moduleWith({ 'db/schema.sql': SCHEMA, 'adapters/memory-store.js': MEMORY })]);
check(1, 'Tables and a memory store only (the state of 57 library modules before this track)', 'module-check exit 1 naming db-schema-unexercised', `exit ${r.status}; rule ${/db-schema-unexercised/.test(r.out)}`, r.status === 1 && /db-schema-unexercised/.test(r.out));
r = run('named in comment and docs', GATE, [moduleWith({ 'db/schema.sql': SCHEMA, 'adapters/memory-store.js': `// the SQL store will apply db/schema.sql\n${MEMORY}`, 'docs/db.md': "apply 'db/schema.sql'\n" })]);
check(2, 'The schema file named only in a comment and in a document', 'module-check exit 1 (a mention is not a run)', `exit ${r.status}; rule ${/db-schema-unexercised/.test(r.out)}`, r.status === 1 && /db-schema-unexercised/.test(r.out));
r = run('adapter reads schema', GATE, [moduleWith({ 'db/schema.sql': SCHEMA, 'adapters/sqlite-store.js': "import { readFileSync } from 'node:fs';\nexport const ddl = () => readFileSync(new URL('../db/schema.sql', import.meta.url), 'utf8');\n" })]);
check(3, 'An adapter that reads its own schema file', 'module-check exit 0', `exit ${r.status}`, r.status === 0);
r = run('test reads schema', GATE, [moduleWith({ 'db/schema.sql': SCHEMA, 'test/sqlite.test.js': "import { readFileSync } from 'node:fs';\nconst ddl = readFileSync(new URL('../db/schema.sql', import.meta.url), 'utf8');\n" })]);
check(4, 'A test that reads the schema file', 'module-check exit 0', `exit ${r.status}`, r.status === 0);
r = run('no tables', GATE, [moduleWith({})]);
check(5, 'A module without tables', 'module-check exit 0 (no false finding)', `exit ${r.status}`, r.status === 0);

// 6. the premise, measured: the same two writes on a memory store and on the real table
const probe = path.join(TMP, 'probe.mjs');
fs.writeFileSync(probe, `import { DatabaseSync } from 'node:sqlite';
const rows = new Map();
const memory = [];
for (const id of ['e1', 'e1']) { try { rows.set(id, { id, note: 'n' }); memory.push('accepted'); } catch { memory.push('refused'); } }
const db = new DatabaseSync(':memory:');
db.exec(${JSON.stringify(SCHEMA)});
const table = [];
for (const id of ['e1', 'e1']) { try { db.prepare('insert into member_event (id, note) values (?, ?)').run(id, 'n'); table.push('accepted'); } catch { table.push('refused'); } }
console.log(JSON.stringify({ memory, table, memoryRows: rows.size, tableRows: Number(db.prepare('select count(*) as c from member_event').get().c) }));
`);
r = run('premise', probe, []);
let seen = null;
try { seen = JSON.parse(r.out.split('\n').find(l => l.startsWith('{')) || 'null'); } catch { seen = null; }
if (!seen) check(6, 'The same id written twice: a memory store and the real table', 'memory accepts both, the table refuses the second', `not measured: ${r.out.split('\n')[0]}`, null);
else check(6, 'The same id written twice: a memory store (a Map) and the real table', 'memory accepts both and overwrites, the table refuses the second', `memory ${seen.memory.join(', ')}; table ${seen.table.join(', ')}`, seen.memory.join() === 'accepted,accepted' && seen.table.join() === 'accepted,refused');

// 7. the real library (observation; counts only: the library is private)
if (fs.existsSync(path.join(REAL_LIBRARY, 'modules'))) {
  r = run('real library', GATE, [path.join(REAL_LIBRARY, 'modules')], true);
  const withSchema = fs.readdirSync(path.join(REAL_LIBRARY, 'modules')).filter(m => fs.existsSync(path.join(REAL_LIBRARY, 'modules', m, 'db', 'schema.sql'))).length;
  check(7, 'The form gate over the real library', 'observation', `modules with tables ${withSchema}; db-schema-unexercised findings ${(r.out.match(/db-schema-unexercised/g) || []).length}; gate exit ${r.status}`, null);
} else check(7, 'The form gate over the real library', 'observation', 'no library on this machine: not measured', null);

fs.rmSync(TMP, { recursive: true, force: true });
const judged = rows.filter(x => x.ok !== null);
const lines = [`Track 48 tables no code applies: ${judged.filter(x => x.ok).length}/${judged.length} scenarios match, ${rows.length - judged.length} not judged`, ''];
for (const x of rows) lines.push(`${x.ok === null ? 'OBSERVED' : x.ok ? 'MATCH' : 'MISMATCH'} #${x.id} ${x.scenario}`, `    expected: ${x.expected}`, `    actual:   ${x.actual}`);
fs.writeFileSync(path.join(__dirname, 'run-log.txt'), `${lines.join('\n')}\n\n--- commands ---\n${log.join('\n')}`);
console.log(lines.join('\n'));
process.exit(judged.every(x => x.ok) ? 0 : 1);
