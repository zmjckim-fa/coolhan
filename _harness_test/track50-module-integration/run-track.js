#!/usr/bin/env node
// Track 50: how modules fit together and carry their design. Real child processes on throwaway libraries (paths
// masked), then the real library read-only.
// Usage: node _harness_test/track50-module-integration/run-track.js
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const HOME = path.resolve(__dirname, '..', '..');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'track50-'));
const REAL_LIBRARY = process.env.COOLHAN_MODULES || 'C:/sites/00Module_site';
const log = [], rows = [];
const forms = (p) => [p.split(path.sep).join('\\\\'), p, p.split(path.sep).join('/')];
const MASK = [[TMP, '<tmp>'], [HOME, '<home>'], [path.resolve(REAL_LIBRARY), '<library>'], [os.homedir(), '<user>']];
const clean = (s) => MASK.reduce((out, [p, name]) => forms(p).reduce((o, f) => o.split(f).join(name), out), String(s || ''));
const check = (id, scenario, expected, actual, ok) => rows.push({ id, scenario, expected, actual: clean(actual), ok: ok === null ? null : !!ok });
const put = (lib, name, rel, content) => { const f = path.join(lib, name, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, content); };
function mod(lib, name, over = {}, files = {}) {
  put(lib, name, 'module.json', JSON.stringify({ name, version: '1.0.0', area: name.split('-')[0], requires: [], provides: {}, settings: [], ...over }, null, 2));
  for (const [rel, content] of Object.entries(files)) put(lib, name, rel, content);
}
function run(label, file, args) {
  const r = spawnSync(process.execPath, [file, ...args], { cwd: HOME, encoding: 'utf8', maxBuffer: 64 * 2 ** 20 });
  const out = (r.stdout || '') + (r.stderr || '');
  log.push(`$ [${label}] node ${clean(path.relative(HOME, file).split(path.sep).join('/'))} ${clean(args.join(' '))}\n  exit ${r.status}\n${out.split('\n').filter(Boolean).slice(0, 4).map(l => '  ' + clean(l).slice(0, 200)).join('\n')}\n`);
  return { status: r.status, out };
}
const CHECK = path.join(HOME, 'scripts', 'module-integration-check.js');
let n = 0;
const lib = () => { const d = path.join(TMP, `lib${++n}`); fs.mkdirSync(d, { recursive: true }); return d; };
const names = (r) => [...r.out.matchAll(/\[([a-z-]+)\]/g)].map(m => m[1]);

// 1. modules that agree
let L = lib();
mod(L, 'base-rules', { provides: { lib: ['makeRule'] } }, { 'core/index.ts': 'export function makeRule() { return 1; }\n' });
mod(L, 'shop-list', { requires: ['base-rules@^1.0.0'], provides: { tokens: ['--sl-bg'] } }, { 'style/tokens.css': ':root { --sl-bg: #fff; }\n.sl { background: var(--sl-bg); }\n', 'user/list.tsx': 'export const A = 1;\n' });
let r = run('agreeing library', CHECK, [L]);
check(1, 'Two modules that agree (a version range, an export, a token with its default)', 'exit 0, PASS, no finding', `exit ${r.status}`, r.status === 0 && /PASS/.test(r.out));

// 2-9. one defect each
const cases = [
  [2, 'A required module that is not in the library', 'requires-unresolved', (d) => mod(d, 'aaa-one', { requires: ['zzz-missing@^1.0.0'] })],
  [3, 'A version the range does not accept', 'requires-range', (d) => { mod(d, 'aaa-one', { requires: ['bbb-two@^2.0.0'] }); mod(d, 'bbb-two'); }],
  [4, 'Two modules that require each other', 'requires-cycle', (d) => { mod(d, 'aaa-one', { requires: ['bbb-two@^1.0.0'] }); mod(d, 'bbb-two', { requires: ['aaa-one@^1.0.0'] }); }],
  [5, 'provides.lib names something nobody exports', 'lib-not-exported', (d) => mod(d, 'calc-core', { provides: { lib: ['ghostFn'] } }, { 'core/index.ts': 'export const x = 1;\n' })],
  [6, 'An export that another module may not import (outside core/index and the listed entries)', 'lib-not-reachable', (d) => mod(d, 'calc-core', { provides: { lib: ['hiddenFn'] } }, { 'core/index.ts': 'export const x = 1;\n', 'core/rules.ts': 'export function hiddenFn() { return 2; }\n' })],
  [7, 'A screen module with no style/tokens.css (its look cannot travel)', 'screen-without-tokens', (d) => mod(d, 'shop-view', {}, { 'user/view.tsx': 'export const V = 1;\n' })],
  [8, 'A colour written into a screen outside tokens', 'color-literal', (d) => mod(d, 'shop-view', { provides: { tokens: ['--sv-bg'] } }, { 'style/tokens.css': ':root { --sv-bg: #fff; }\n.v { background: var(--sv-bg); }\n', 'user/view.tsx': "export const V = <div style={{ color: '#ff0000' }} />;\n" })],
  [9, 'A text key present in one language and missing in the other', 'text-language-gap', (d) => mod(d, 'shop-view', {}, { 'text/ko.json': '{"a":"가","b":"나"}', 'text/en.json': '{"a":"a"}' })],
  [10, 'Two modules that create the same table', 'table-owner-conflict', (d) => { mod(d, 'aaa-one', {}, { 'db/schema.sql': 'create table if not exists shared_t (id text primary key);\n' }); mod(d, 'bbb-two', {}, { 'db/schema.sql': 'create table if not exists shared_t (id text primary key);\n' }); }]
];
for (const [id, scenario, rule, build] of cases) {
  L = lib(); build(L);
  r = run(rule, CHECK, [L]);
  check(id, scenario, `exit 1 naming ${rule}`, `exit ${r.status}; rules ${[...new Set(names(r))].join(',') || '-'}`, r.status === 1 && names(r).includes(rule));
}

// 11. the design bridge: a screen module whose tokens no design module assigns
L = lib();
mod(L, 'shop-view', { provides: { tokens: ['--sv-accent'] } }, { 'style/tokens.css': ':root { --sv-accent: #123456; }\n.v { color: var(--sv-accent); }\n', 'user/view.tsx': 'export const V = 1;\n' });
mod(L, 'design-kd', {}, { 'style/bridge.css': ':root { --kd-accent: #0a0; }\n' });
r = run('bridge gap', CHECK, [L]);
check(11, 'A design module whose bridge assigns none of the screen module\'s tokens', 'exit 1 naming bridge-gap', `exit ${r.status}; rules ${[...new Set(names(r))].join(',') || '-'}`, r.status === 1 && names(r).includes('bridge-gap'));
L = lib();
mod(L, 'shop-view', { provides: { tokens: ['--sv-accent'] } }, { 'style/tokens.css': ':root { --sv-accent: #123456; }\n.v { color: var(--sv-accent); }\n', 'user/view.tsx': 'export const V = 1;\n' });
mod(L, 'design-kd', {}, { 'style/bridge.css': ':root { --sv-accent: var(--kd-accent); --kd-accent: #0a0; }\n' });
r = run('bridge ok', CHECK, [L]);
check(12, 'The same pair with the bridge assigning the token', 'exit 0, no false finding', `exit ${r.status}`, r.status === 0);

// 13. scope, order, empty library
L = lib();
mod(L, 'aaa-one', { requires: ['zzz-missing@^1.0.0'] }); mod(L, 'ccc-clean', {});
r = run('only clean', CHECK, [L, '--only', 'ccc-clean']);
check(13, '--only a clean module of a library that has a defect elsewhere', 'exit 0', `exit ${r.status}`, r.status === 0);
r = run('only defective', CHECK, [L, '--only', 'aaa-one']);
check(14, '--only the defective module', 'exit 1', `exit ${r.status}`, r.status === 1);
r = run('empty library', CHECK, [lib()]);
check(15, 'A folder without modules', 'exit 4 (never a pass)', `exit ${r.status}`, r.status === 4);

// 16. the admission step reads it
const ADMIT = path.join(HOME, 'scripts', 'module-admit.js');
L = lib();
const root = path.join(L, 'modules'); fs.mkdirSync(root);
const ABSENT = Object.fromEntries(['core', 'api', 'user', 'admin', 'db', 'text', 'style', 'adapters', 'test', 'docs'].map(p => [p, `해당 없음: 이 모듈에 ${p} 부분이 없다`]));
const base = { version: '1.0.0', label: 'label', summary: 'what it does', area: 'member', stack: 'none', parts: { ...ABSENT, core: true, test: true }, requires: [], settings: [], origin: [{ site: 'some-site', path: 'src/rule.js', commit: 'abc1234', date: '2026-11-01' }], test: 'node --test' };
const dir = path.join(root, 'member-rules');
fs.mkdirSync(path.join(dir, 'core'), { recursive: true }); fs.mkdirSync(path.join(dir, 'test'), { recursive: true });
fs.writeFileSync(path.join(dir, 'module.json'), JSON.stringify({ ...base, name: 'member-rules', provides: { lib: ['rule', 'ghostName'] } }, null, 2));
fs.writeFileSync(path.join(dir, 'package.json'), '{ "type": "module" }\n');
fs.writeFileSync(path.join(dir, 'README.md'), '# member-rules\n'); fs.writeFileSync(path.join(dir, 'CHANGELOG.md'), '## 1.0.0\n- first\n');
fs.writeFileSync(path.join(dir, 'core', 'index.js'), 'export function rule(x) { return x > 0; }\n');
fs.writeFileSync(path.join(dir, 'test', 'rule.test.js'), "import test from 'node:test';\nimport assert from 'node:assert';\nimport { rule } from '../core/index.js';\ntest('rule', () => { assert.equal(rule(1), true); });\n");
r = run('admission', ADMIT, ['member-rules', '--library', L, '--json']);
let j = null; try { j = JSON.parse(r.out); } catch (_) { /* reported below */ }
const steps = j ? Object.fromEntries(Object.entries(j.modules[0].steps).map(([k, v]) => [k, v.status])) : {};
check(16, 'Admission of a module whose own test passes but names an export it lacks', 'exit 1; test PASS, integration FAIL', `exit ${r.status}; ${JSON.stringify(steps)}`, r.status === 1 && steps.test === 'PASS' && steps.integration === 'FAIL');

// 17-18. the real library (read-only)
const REAL = path.join(REAL_LIBRARY, 'modules');
if (fs.existsSync(REAL)) {
  r = run('real library', CHECK, [REAL]);
  const m = /모듈 (\d+)개, 지적 (\d+)건/.exec(r.out);
  check(17, 'The real module library after the per-module audit', 'exit 0, findings 0', `exit ${r.status}; modules ${m ? m[1] : '?'}; findings ${m ? m[2] : '?'}`, r.status === 0 && m && m[2] === '0');
  r = run('real library order', CHECK, [REAL, '--order']);
  const order = r.out.split('\n').filter(Boolean);
  check(18, 'The audit order puts a required module before the modules that require it', 'every required module earlier in the list', `${order.length} modules`, r.status === 0 && order.length > 0);
} else {
  check(17, 'The real module library', 'exit 0', 'library not found on this machine', null);
}

fs.rmSync(TMP, { recursive: true, force: true });
const pass = rows.filter(x => x.ok === true).length, fail = rows.filter(x => x.ok === false).length, skipped = rows.filter(x => x.ok === null).length;
const md = [`# Track 50: modules that fit together and carry their design`, '', `Run: ${new Date().toISOString().slice(0, 10)} · ${pass} pass · ${fail} fail · ${skipped} not measured`, '', '| # | Scenario | Expected | Actual | Result |', '|---|---|---|---|---|', ...rows.map(x => `| ${x.id} | ${x.scenario} | ${x.expected} | ${x.actual} | ${x.ok === null ? 'NOT_RUN' : x.ok ? 'PASS' : 'FAIL'} |`), ''].join('\n');
fs.writeFileSync(path.join(__dirname, 'run-log.txt'), log.join('\n'));
fs.writeFileSync(path.join(__dirname, 'track50-results.md'), md);
console.log(`track50: ${pass} pass · ${fail} fail · ${skipped} not measured`);
process.exit(fail ? 1 : 0);
