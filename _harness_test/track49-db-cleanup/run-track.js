#!/usr/bin/env node
// Track 49: cleaning up never decides the result. A whole-library run of the database check measured every module,
// then the removal of the throwaway cluster folder failed (EPERM right after the server stopped, Windows) and the
// exception took the verdict with it: no result line, a crash exit. Real child processes (paths masked).
// Usage: node _harness_test/track49-db-cleanup/run-track.js
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const HOME = path.resolve(__dirname, '..', '..');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'track49-'));
const log = [], rows = [];
const forms = (p) => [p.split(path.sep).join('\\\\'), p, p.split(path.sep).join('/')];
const MASK = [[TMP, '<tmp>'], [HOME, '<home>'], [os.tmpdir(), '<tmpdir>'], [os.homedir(), '<user>']];
const clean = (s) => MASK.reduce((out, [p, name]) => forms(p).reduce((o, f) => o.split(f).join(name), out), String(s || ''));
const check = (id, scenario, expected, actual, ok) => rows.push({ id, scenario, expected, actual: clean(actual), ok: ok === null ? null : !!ok });
const write = (root, rel, content) => { const f = path.join(root, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, content); };

const PARTS = ['core', 'api', 'user', 'admin', 'db', 'text', 'style', 'adapters', 'test', 'docs'];
const ABSENT = Object.fromEntries(PARTS.map(p => [p, `해당 없음: 이 모듈에 ${p} 부분이 없다`]));
function library(name, schema) {
  const root = path.join(TMP, name);
  const dir = path.join(root, 'modules', 'member-events');
  const m = { name: 'member-events', version: '1.0.0', label: 'label', summary: 'what it does', area: 'member', stack: 'none', parts: { ...ABSENT, core: true, test: true, db: true }, requires: [], provides: { lib: ['rule'], tables: ['member_event'] }, settings: [], origin: [{ site: 'some-site', path: 'src/rule.js', commit: 'abc1234', date: '2026-11-01' }], test: 'node --test' };
  write(dir, 'module.json', JSON.stringify(m, null, 2)); write(dir, 'README.md', '# member-events\n'); write(dir, 'CHANGELOG.md', '## 1.0.0\n- entry\n');
  write(dir, 'core/index.js', 'export function rule(x) { return x > 0; }\n'); write(dir, 'test/rule.test.js', "import { rule } from '../core/index.js';\n");
  write(dir, 'db/schema.sql', schema);
  return root;
}
const GOOD = library('good', 'create table if not exists member_event (id text primary key, note text not null);\n');
const BAD = library('bad', 'create table member_event (id text primary key);\n');

// A driver runs the gate's own main() in a child process with the cluster replaced: psql answers like a database
// (the «bad» schema fails on its second run), stop() behaves as the scenario says.
const driver = path.join(TMP, 'driver.js');
fs.writeFileSync(driver, `const db = require(${JSON.stringify(path.join(HOME, 'scripts', 'module-db-check.js'))});
const [lib, stopKind, ...flags] = process.argv.slice(2);
let schemaRuns = 0;
const psql = (name, args) => {
  if (args[0] === '-f' && /schema\\.sql/.test(args[1]) && /bad/.test(lib) && ++schemaRuns === 2) return { status: 3, stdout: '', stderr: 'psql: ERROR:  relation "member_event" already exists' };
  return { status: 0, stdout: args.includes('-At') ? '1\\n' : '', stderr: '' };
};
const stop = { clean: () => null, throws: () => { const e = new Error('EPERM, Permission denied: <cluster folder>'); e.code = 'EPERM'; throw e; }, leftover: () => 'held-cluster-folder' }[stopKind];
process.exit(db.main(['node', 'module-db-check.js', 'member-events', '--library', lib, ...flags], { findBin: () => 'x', startCluster: () => ({ psql, stop }) }));
`);
function run(label, args) {
  const r = spawnSync(process.execPath, [driver, ...args], { cwd: HOME, encoding: 'utf8', maxBuffer: 64 * 2 ** 20 });
  const out = (r.stdout || '') + (r.stderr || '');
  log.push(`$ [${label}] driver ${clean(args.join(' '))}\n  exit ${r.status}\n${out.split('\n').filter(Boolean).slice(0, 6).map(l => '  ' + clean(l).slice(0, 220)).join('\n')}\n`);
  return { status: r.status, out, stdout: r.stdout || '', stderr: r.stderr || '' };
}
const verdict = (out) => (out.match(/module-db-check: (PASS|FAIL|NOT_RUN)/) || [])[1] || 'none';

let r = run('pass, stop throws', [GOOD, 'throws']);
check(1, 'Every module passed and the cluster folder cannot be removed (the incident)', 'exit 0, the PASS line printed, the folder named', `exit ${r.status}; verdict ${verdict(r.out)}; folder named ${/cluster folder/.test(r.out)}`, r.status === 0 && verdict(r.out) === 'PASS' && /cluster folder/.test(r.out));
r = run('fail, stop throws', [BAD, 'throws']);
check(2, 'A module failed and the cluster folder cannot be removed', 'exit 1, the FAIL line printed (the cleanup does not hide the failure)', `exit ${r.status}; verdict ${verdict(r.out)}`, r.status === 1 && verdict(r.out) === 'FAIL');
r = run('pass, clean stop', [GOOD, 'clean']);
check(3, 'Every module passed and the folder was removed', 'exit 0, PASS, no folder note (no false note)', `exit ${r.status}; verdict ${verdict(r.out)}; note ${/지우지 못했다/.test(r.out)}`, r.status === 0 && verdict(r.out) === 'PASS' && !/지우지 못했다/.test(r.out));
r = run('fail, clean stop', [BAD, 'clean']);
check(4, 'A module failed and the folder was removed', 'exit 1, FAIL, no folder note', `exit ${r.status}; verdict ${verdict(r.out)}; note ${/지우지 못했다/.test(r.out)}`, r.status === 1 && verdict(r.out) === 'FAIL' && !/지우지 못했다/.test(r.out));
r = run('json, leftover', [GOOD, 'leftover', '--json']);
let j = null; try { j = JSON.parse(r.stdout); } catch { j = null; }
check(5, 'JSON output when the folder is left behind', 'stdout is one JSON document with status PASS and the folder in `leftover`', `exit ${r.status}; parses ${!!j}; status ${j && j.status}; leftover ${j && j.leftover}; stderr empty ${r.stderr.trim() === ''}`, r.status === 0 && !!j && j.status === 'PASS' && j.leftover === 'held-cluster-folder' && r.stderr.trim() === '');
r = run('json, clean', [GOOD, 'clean', '--json']);
j = null; try { j = JSON.parse(r.stdout); } catch { j = null; }
check(6, 'JSON output after a clean stop', 'no `leftover` field', `exit ${r.status}; has leftover ${!!j && 'leftover' in j}`, r.status === 0 && !!j && !('leftover' in j));

// 7-8. the removal itself, on a folder that is really held on this machine (Windows keeps a folder that is some
// process's working directory; where the platform does not hold it, the two rows are observations).
// Measured first: the runtime's own retry option answered EPERM in 2ms on such a folder, so the gate retries itself.
const probe = path.join(TMP, 'probe.js');
fs.writeFileSync(probe, `const db = require(${JSON.stringify(path.join(HOME, 'scripts', 'module-db-check.js'))});
const fs = require('fs'), os = require('os'), path = require('path');
const { spawn } = require('child_process');
const holdFor = Number(process.argv[2]);
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'track49-held-'));
const holder = spawn(process.execPath, ['-e', 'setTimeout(() => {}, ' + holdFor + ')'], { cwd: dir, stdio: 'ignore' });
setTimeout(() => {
  let first = 'removed';
  try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) { first = e.code; }
  if (first === 'removed') { holder.kill(); console.log(JSON.stringify({ platform: process.platform, held: false })); return; }
  const t0 = Date.now();
  let threw = false; let left = null;
  try { left = db.removeTree(dir); } catch { threw = true; }
  const ms = Date.now() - t0;
  holder.kill();
  setTimeout(() => { const after = db.removeTree(dir); console.log(JSON.stringify({ platform: process.platform, held: true, first, answer: left === null ? 'removed' : 'path', threw, ms, afterRelease: after === null ? 'removed' : 'path' })); }, 800);
}, 500);
`);
function held(label, holdFor) {
  const p = spawnSync(process.execPath, [probe, String(holdFor)], { cwd: HOME, encoding: 'utf8' });
  const NL = String.fromCharCode(10);
  let seen = null; try { seen = JSON.parse((p.stdout || '').split(NL).find(l => l.startsWith('{')) || 'null'); } catch { seen = null; }
  log.push(['$ [' + label + '] probe ' + holdFor, '  exit ' + p.status, ...clean((p.stdout || '') + (p.stderr || '')).split(NL).filter(Boolean).slice(0, 3).map(l => '  ' + l), ''].join(NL));
  return seen;
}
let seen = held('held for a moment', 1500);
if (!seen) check(7, 'A folder held for a moment (the incident): one removal fails, the gate tries again', 'removed by a later try, no exception', 'not measured', null);
else if (!seen.held) check(7, 'A folder another process uses as its working directory, for a moment', 'observation (this platform does not hold the folder)', `platform ${seen.platform}`, null);
else check(7, 'A folder held for a moment (the incident): one removal fails, the gate tries again', 'removed by a later try, no exception', `platform ${seen.platform}; a single removal: ${seen.first}; removeTree: ${seen.answer} after ${seen.ms}ms; threw ${seen.threw}`, seen.answer === 'removed' && !seen.threw && seen.ms >= 250);
seen = held('held throughout', 30000);
if (!seen) check(8, 'A folder held for the whole run', 'answers the path without throwing; removable once released', 'not measured', null);
else if (!seen.held) check(8, 'A folder another process uses as its working directory, throughout', 'observation (this platform does not hold the folder)', `platform ${seen.platform}`, null);
else check(8, 'A folder held for the whole run', 'answers the path without throwing; removable once released', `platform ${seen.platform}; removeTree: ${seen.answer} after ${seen.ms}ms; threw ${seen.threw}; after release: ${seen.afterRelease}`, seen.answer === 'path' && !seen.threw && seen.afterRelease === 'removed');

require(path.join(HOME, 'scripts', 'module-db-check.js')).removeTree(TMP);
const judged = rows.filter(x => x.ok !== null);
const lines = [`Track 49 cleanup never decides the result: ${judged.filter(x => x.ok).length}/${judged.length} scenarios match, ${rows.length - judged.length} not judged`, ''];
for (const x of rows) lines.push(`${x.ok === null ? 'OBSERVED' : x.ok ? 'MATCH' : 'MISMATCH'} #${x.id} ${x.scenario}`, `    expected: ${x.expected}`, `    actual:   ${x.actual}`);
fs.writeFileSync(path.join(__dirname, 'run-log.txt'), `${lines.join('\n')}\n\n--- commands ---\n${log.join('\n')}`);
console.log(lines.join('\n'));
process.exit(judged.every(x => x.ok) ? 0 : 1);
