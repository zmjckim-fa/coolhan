#!/usr/bin/env node
// Track 44: module admission in one command. Form, tests, install into an empty folder, secret scan: every exit status read.
// Real child processes in temp folders (paths masked). Usage: node _harness_test/track44-module-admit/run-track.js
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const HOME = path.resolve(__dirname, '..', '..');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'track44-'));
const REAL_LIBRARY = process.env.COOLHAN_MODULES || 'C:/sites/00Module_site';
const log = [], rows = [];
const forms = (p) => [p.split(path.sep).join('\\\\'), p, p.split(path.sep).join('/')];
const MASK = [[TMP, '<tmp>'], [HOME, '<home>'], [path.resolve(REAL_LIBRARY), '<library>'], [os.homedir(), '<user>']];
const clean = (s) => MASK.reduce((out, [p, name]) => forms(p).reduce((o, f) => o.split(f).join(name), out), String(s || ''));
const check = (id, scenario, expected, actual, ok) => rows.push({ id, scenario, expected, actual: clean(actual), ok: ok === null ? null : !!ok });
const write = (root, rel, content) => { const f = path.join(root, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, content); };

// `countsOnly`: the real library is private, so its module names stay out of this log; only counts are written.
function admit(label, library, names, countsOnly = false) {
  const r = spawnSync(process.execPath, [path.join(HOME, 'scripts', 'module-admit.js'), ...names, '--library', library, '--json'], { cwd: HOME, encoding: 'utf8', maxBuffer: 64 * 2 ** 20 });
  let json = null; try { json = JSON.parse(r.stdout); } catch (_) { /* usage and library errors print no JSON */ }
  const steps = (name) => { const m = json && json.modules.find(x => x.name === name); return m ? ['form', 'test', 'install', 'secrets'].map(s => `${s} ${m.steps[s] ? m.steps[s].status : '-'}`).join(', ') : 'no result'; };
  const shown = countsOnly ? `<${names.length} committed modules>` : clean(names.join(' '));
  const body = !json ? `\n  ${clean(r.stderr).split('\n')[0]}`
    : countsOnly ? `\n  modules ${json.modules.length}: ${['PASS', 'FAIL', 'NOT_RUN'].map(s => `${s} ${json.modules.filter(m => m.status === s).length}`).join(', ')}`
      : `\n${json.modules.map(m => `  ${m.name}: ${m.status} (${steps(m.name)})`).join('\n')}`;
  log.push(`$ [${label}] node scripts/module-admit.js ${shown} --library ${clean(library)}\n  exit ${r.status}${body}\n`);
  return { status: r.status, json, steps };
}

const PARTS = ['core', 'api', 'user', 'admin', 'db', 'text', 'style', 'adapters', 'test', 'docs'];
const ABSENT = Object.fromEntries(PARTS.map(p => [p, `해당 없음: 이 모듈에 ${p} 부분이 없다`]));
const GOOD_TEST = "import test from 'node:test';\nimport assert from 'node:assert';\nimport { rule } from '../core/index.js';\ntest('rule', () => { assert.equal(rule(1), true); });\n";
let libs = 0;
function library(modules) {
  const lib = path.join(TMP, `lib${++libs}`);
  for (const [name, { over = {}, files = {} }] of Object.entries(modules)) {
    const dir = path.join(lib, 'modules', name);
    const m = { name, version: '1.0.0', label: 'label', summary: 'what it does', area: name.split('-')[0], stack: 'none', parts: { ...ABSENT, core: true, test: true }, requires: [], provides: { lib: ['rule'] }, settings: [], origin: [{ site: 'some-site', path: 'src/rule.js', commit: 'abc1234', date: '2026-11-01' }], test: 'node --test', ...over };
    write(dir, 'module.json', JSON.stringify(m, null, 2)); write(dir, 'package.json', '{ "type": "module" }\n');
    write(dir, 'README.md', `# ${name}\n`); write(dir, 'CHANGELOG.md', `## ${m.version}\n- entry\n`);
    write(dir, 'core/index.js', 'export function rule(x) { return x > 0; }\n');
    write(dir, 'test/rule.test.js', GOOD_TEST);
    for (const [rel, content] of Object.entries(files)) write(dir, rel, content);
  }
  return lib;
}
const FAILING = GOOD_TEST.replace('rule(1), true', 'rule(1), false');
const SECRET_LINE = "const password = 'correct-horse-battery-staple-1';\n";

// 1. a sound module with a requirement
let lib = library({ 'member-rules': {}, 'member-signup': { over: { requires: ['member-rules'] } } });
let r = admit('sound', lib, ['member-signup']);
check(1, 'sound module, requirement installed beside it', 'exit 0; all four steps PASS', `exit ${r.status}; ${r.steps('member-signup')}`, r.status === 0 && /form PASS, test PASS, install PASS, secrets PASS/.test(r.steps('member-signup')));

// 2. a failing test
lib = library({ 'member-signup': { files: { 'test/rule.test.js': FAILING } } });
r = admit('failing test', lib, ['member-signup']);
check(2, 'failing test', 'exit 1; test FAIL and install FAIL', `exit ${r.status}; ${r.steps('member-signup')}`, r.status === 1 && /test FAIL, install FAIL/.test(r.steps('member-signup')));

// 3. the incident: form and tests pass, one line looks like a secret
lib = library({ 'member-signup': { files: { 'test/fixture.test.js': GOOD_TEST + SECRET_LINE } } });
r = admit('secret line', lib, ['member-signup']);
check(3, 'form and tests pass, a line looks like a secret (the commit that slipped through by hand)', 'exit 1; secrets FAIL, the other three PASS', `exit ${r.status}; ${r.steps('member-signup')}`, r.status === 1 && /form PASS, test PASS, install PASS, secrets FAIL/.test(r.steps('member-signup')));

// 4. the same line marked as an invented value: no false positive
lib = library({ 'member-signup': { files: { 'test/fixture.test.js': GOOD_TEST + SECRET_LINE.replace('\n', ' // secret-scan:allow invented test value\n') } } });
r = admit('marked line', lib, ['member-signup']);
check(4, 'the same line carrying the scan marker', 'exit 0; secrets PASS', `exit ${r.status}; ${r.steps('member-signup')}`, r.status === 0 && /secrets PASS/.test(r.steps('member-signup')));

// 5. a test command that runs nothing
lib = library({ 'member-signup': { over: { test: 'node --test "test/*.spec.js"' } } });
r = admit('zero tests', lib, ['member-signup']);
check(5, 'test command exits 0 having run 0 tests', 'exit 4; test NOT_RUN, never PASS', `exit ${r.status}; ${r.steps('member-signup')}`, r.status === 4 && /test NOT_RUN/.test(r.steps('member-signup')));

// 6. form fails: not installed
lib = library({ 'member-signup': { files: { 'src/thing.js': 'export const x = 1;\n' } } });
r = admit('form fails', lib, ['member-signup']);
check(6, 'folder the standard does not know', 'exit 1; form FAIL, install NOT_RUN', `exit ${r.status}; ${r.steps('member-signup')}`, r.status === 1 && /form FAIL/.test(r.steps('member-signup')) && /install NOT_RUN/.test(r.steps('member-signup')));

// 7. passes beside its neighbours, cannot stand alone
lib = library({ 'member-rules': {}, 'member-signup': { files: { 'test/rule.test.js': `${GOOD_TEST}import fs from 'node:fs';\ntest('neighbour', () => { assert.ok(fs.existsSync(new URL('../../member-rules/module.json', import.meta.url))); });\n` } } });
r = admit('needs neighbour', lib, ['member-signup']);
check(7, 'test reads an undeclared neighbour module at run time', 'exit 1; test PASS in the library, install FAIL', `exit ${r.status}; ${r.steps('member-signup')}`, r.status === 1 && /test PASS, install FAIL/.test(r.steps('member-signup')));

// 8. --all: one bad module does not hide behind a good one
lib = library({ 'member-rules': {}, 'member-signup': { files: { 'test/rule.test.js': FAILING } } });
r = admit('all', lib, ['--all']);
check(8, '--all with one sound and one failing module', 'exit 1; member-rules PASS, member-signup FAIL', `exit ${r.status}; ${r.json ? r.json.modules.map(m => `${m.name} ${m.status}`).join(', ') : 'no result'}`, r.status === 1 && r.json && r.json.modules.map(m => m.status).join() === 'PASS,FAIL');

// 9. nothing to measure
lib = library({ 'member-rules': {} });
const unknown = admit('unknown', lib, ['member-none']);
const noLib = admit('no library', path.join(TMP, 'nowhere'), ['member-rules']);
const usage = spawnSync(process.execPath, [path.join(HOME, 'scripts', 'module-admit.js'), '--library', lib], { encoding: 'utf8' });
check(9, 'unknown module, missing library, no module name', 'exit 4, 4, 2', `exit ${unknown.status}, ${noLib.status}, ${usage.status}`, unknown.status === 4 && noLib.status === 4 && usage.status === 2);

// 11. a change that passes on its own and breaks what is built on it
lib = library({ 'member-rules': {}, 'member-signup': { over: { requires: ['member-rules'] } }, 'member-screens': { over: { requires: ['member-signup'] }, files: { 'test/rule.test.js': FAILING } }, 'admin-shell': {} });
const alone = admit('changed module alone', lib, ['member-rules']);
const withDeps = admit('with dependents', lib, ['member-rules', '--with-dependents']);
check(11, 'A module whose dependent (through another module) is broken: admitted alone, then with --with-dependents', 'alone: exit 0; with dependents: exit 1, member-screens FAIL, the unrelated module not admitted',
  `alone exit ${alone.status}; with dependents exit ${withDeps.status}; ${withDeps.json ? withDeps.json.modules.map(m => `${m.name} ${m.status}`).join(', ') : 'no result'}`,
  alone.status === 0 && withDeps.status === 1 && withDeps.json && withDeps.json.modules.map(m => `${m.name} ${m.status}`).join(', ') === 'member-rules PASS, member-screens FAIL, member-signup PASS');

// 12. a project that uses the module takes the new version and runs its own check
lib = library({ 'member-rules': {} });
const consumerApp = path.join(TMP, 'consumer-app'); fs.mkdirSync(consumerApp, { recursive: true });
spawnSync(process.execPath, [path.join(HOME, 'scripts', 'modules.js'), 'add', 'member-rules', '--app', consumerApp, '--library', lib], { encoding: 'utf8' });
write(consumerApp, 'check.mjs', "import { rule } from './coolhan_modules/member-rules/core/index.js';\nif (typeof rule(1) !== 'boolean') { console.error('error: rule no longer returns a boolean'); process.exit(1); }\n");
const consumerArgs = ['--consumer', consumerApp, '--consumer-check', 'node check.mjs'];
const c0 = admit('consumer, nothing changed', lib, ['member-rules', ...consumerArgs]);
write(path.join(lib, 'modules', 'member-rules'), 'module.json', fs.readFileSync(path.join(lib, 'modules', 'member-rules', 'module.json'), 'utf8').replace('"version": "1.0.0"', '"version": "1.1.0"'));
write(path.join(lib, 'modules', 'member-rules'), 'CHANGELOG.md', '## 1.1.0\n- changed\n');
write(path.join(lib, 'modules', 'member-rules'), 'core/index.js', 'export function rule(x) { return x > 0 ? "yes" : ""; }\n');
write(path.join(lib, 'modules', 'member-rules'), 'test/rule.test.js', GOOD_TEST.replace('rule(1), true', 'rule(1), "yes"'));
const c1 = admit('consumer, a version that passes its own test and breaks the project', lib, ['member-rules', ...consumerArgs]);
const cState = (x) => (x.json && x.json.consumer ? x.json.consumer.status : 'none');
check(12, 'A project that uses a module: admitted with --consumer when nothing changed, then after a version that passes its own test and changes what the project relies on',
  'unchanged: exit 0, consumer PASS; changed: the module PASS, consumer FAIL, exit 1',
  `unchanged exit ${c0.status}, consumer ${cState(c0)}; changed exit ${c1.status}, module ${c1.json ? c1.json.modules[0].status : '?'}, consumer ${cState(c1)}`,
  c0.status === 0 && cState(c0) === 'PASS' && c1.status === 1 && c1.json && c1.json.modules[0].status === 'PASS' && cState(c1) === 'FAIL');

// 10. the real library: every committed module (observation when the library is not on this machine).
// Committed ones only: modules still being written by another session would make the count mean nothing.
const tracked = spawnSync('git', ['-C', REAL_LIBRARY, 'ls-files', 'modules'], { encoding: 'utf8', maxBuffer: 64 * 2 ** 20 });
const committed = [...new Set(String(tracked.stdout || '').split('\n').map(f => f.split('/')[1]).filter(n => n && fs.existsSync(path.join(REAL_LIBRARY, 'modules', n, 'module.json'))))].sort();
if (process.env.TRACK44_SKIP_REAL === '1') check(10, 'real library, every committed module', 'observation', 'skipped by TRACK44_SKIP_REAL=1 (takes more than ten minutes): not measured in this run', null);
else if (tracked.status === 0 && committed.length) {
  r = admit('real library', REAL_LIBRARY, committed, true);
  const by = (s) => r.json ? r.json.modules.filter(m => m.status === s).length : 0;
  const stepFails = r.json ? ['form', 'test', 'install', 'secrets'].map(s => `${s} ${r.json.modules.filter(m => m.steps[s] && m.steps[s].status !== 'PASS').length}`).join(', ') : 'no result';
  check(10, 'real library, every committed module', 'observation: counts per result', `exit ${r.status}; modules ${r.json ? r.json.modules.length : 0}, PASS ${by('PASS')}, FAIL ${by('FAIL')}, NOT_RUN ${by('NOT_RUN')}; steps not PASS: ${stepFails}`, null);
} else check(10, 'real library, every committed module', 'observation', 'library not on this machine or not a git repository: not measured', null);

fs.rmSync(TMP, { recursive: true, force: true });
const judged = rows.filter(x => x.ok !== null);
const lines = [`Track 44 module admission: ${judged.filter(x => x.ok).length}/${judged.length} scenarios match, ${rows.length - judged.length} observation`, ''];
for (const x of rows) lines.push(`${x.ok === null ? 'OBSERVED' : x.ok ? 'MATCH' : 'MISMATCH'} #${x.id} ${x.scenario}`, `    expected: ${x.expected}`, `    actual:   ${x.actual}`);
fs.writeFileSync(path.join(__dirname, 'run-log.txt'), `${lines.join('\n')}\n\n--- commands ---\n${log.join('\n')}`);
console.log(lines.join('\n'));
process.exit(judged.every(x => x.ok) ? 0 : 1);
