#!/usr/bin/env node
// Track 43: G25 module standard. Modules used like plug-ins: form gate, take / status / update / remove, drift, conversion.
// Real child processes in temp folders (paths masked). Usage: node _harness_test/track43-module-standard/run-track.js
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const HOME = path.resolve(__dirname, '..', '..');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'track43-'));
const REAL_LIBRARY = process.env.COOLHAN_MODULES || 'C:/sites/00Module_site';
const log = [], rows = [];
const forms = (p) => [p.split(path.sep).join('\\\\'), p, p.split(path.sep).join('/')];
const MASK = [[TMP, '<tmp>'], [HOME, '<home>'], [path.resolve(REAL_LIBRARY), '<library>'], [os.homedir(), '<user>']];
const clean = (s) => MASK.reduce((out, [p, name]) => forms(p).reduce((o, f) => o.split(f).join(name), out), String(s || ''));
const check = (id, scenario, expected, actual, ok) => rows.push({ id, scenario, expected, actual: clean(actual), ok: ok === null ? null : !!ok });
const mk = (...p) => { const d = path.join(TMP, ...p); fs.mkdirSync(d, { recursive: true }); return d; };
const write = (root, rel, content) => { const f = path.join(root, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, content); };
function run(label, script, args, opts = {}) {
  const r = spawnSync(process.execPath, [path.join(HOME, 'scripts', script), ...args], { cwd: opts.cwd || HOME, encoding: 'utf8' });
  const out = (r.stdout || '') + (r.stderr || '');
  log.push(`$ [${label}] node scripts/${script} ${clean(args.join(' '))}\n  exit ${r.status}\n${clean(out).split('\n').filter(Boolean).slice(0, 6).map(l => '  ' + l.slice(0, 200)).join('\n')}\n`);
  return { status: r.status, out };
}

const PARTS = ['core', 'api', 'user', 'admin', 'db', 'text', 'style', 'adapters', 'test', 'docs'];
const ABSENT = Object.fromEntries(PARTS.map(p => [p, `해당 없음: 이 모듈에 ${p} 부분이 없다`]));
function makeModule(root, name, over = {}, files = {}) {
  const dir = path.join(root, name);
  const m = { name, version: '1.0.0', label: 'label', summary: 'what it does', area: name.split('-')[0], stack: 'none', parts: { ...ABSENT, core: true, test: true }, requires: [], provides: { lib: ['rule'] }, settings: [], origin: [{ site: 'site-a', path: 'src/rule.js', commit: 'abc1234', date: '2026-11-01' }], test: 'node --test', ...over };
  write(dir, 'module.json', JSON.stringify(m, null, 2)); write(dir, 'package.json', '{"type":"module"}');
  write(dir, 'README.md', `# ${name}\n`); write(dir, 'CHANGELOG.md', `## ${m.version}\n- entry\n`);
  write(dir, 'core/index.js', 'export function rule(x) { return x > 0; }\n');
  write(dir, 'test/rule.test.js', "import test from 'node:test';\nimport assert from 'node:assert';\nimport { rule } from '../core/index.js';\ntest('rule', () => { assert.equal(rule(1), true); assert.equal(rule(0), false); });\n");
  for (const [rel, content] of Object.entries(files)) { if (content === null) fs.rmSync(path.join(dir, rel), { recursive: true, force: true }); else write(dir, rel, content); }
  return dir;
}

// ── 1-4. the form gate ───────────────────────────────────────────────────────────────────────────────────────
const good = mk('good');
makeModule(good, 'member-signup');
let r = run('1 good module', 'module-check.js', [good]);
check(1, 'A module that follows the standard', 'exit 0', `exit ${r.status}`, r.status === 0);

const BROKEN = [
  ['name-format', 'signup', {}, {}],
  ['name-banned-word', 'member-helpers', {}, {}],
  ['unknown-folder', 'member-signup', {}, { 'src/thing.js': '' }],
  ['parts-mismatch', 'member-signup', {}, { 'docs/spec.md': '# spec' }],
  ['file-name-format', 'member-signup', {}, { 'core/SignupRule.js': '' }],
  ['file-name-banned-word', 'member-signup', {}, { 'core/utils.js': '' }],
  ['entry-missing', 'member-signup', {}, { 'core/index.js': null, 'core/rule.js': '' }],
  ['core-imports-framework', 'member-signup', {}, { 'core/index.js': "import { Injectable } from '@nestjs/common';\n" }],
  ['import-escapes-module', 'member-signup', {}, { 'core/index.js': "import x from '../../../lib/api.js';\n" }],
  ['require-undeclared', 'member-signup', {}, { 'core/index.js': "import x from '../../member-login/core/index.js';\n" }],
  ['setting-undeclared', 'member-signup', {}, { 'core/index.js': 'export const s = process.env.SIGNUP_SECRET;\n' }],
  ['test-missing', 'member-signup', { parts: { ...ABSENT, core: true } }, { test: null }],
  ['security-note-missing', 'member-signup', { parts: { ...ABSENT, core: true, test: true, api: true } }, { 'api/routes.js': '' }],
  ['db-table-prefix', 'member-signup', { parts: { ...ABSENT, core: true, test: true, db: true }, provides: { tables: ['account'] } }, { 'db/schema.sql': 'CREATE TABLE account (id INTEGER PRIMARY KEY);' }],
  ['db-foreign-reference', 'member-signup', { parts: { ...ABSENT, core: true, test: true, db: true }, provides: { tables: ['member_account'] } }, { 'db/schema.sql': 'CREATE TABLE member_account (id INTEGER PRIMARY KEY, order_id INTEGER REFERENCES shop_order(id));' }],
  ['changelog-version-missing', 'member-signup', { version: '1.1.0' }, { 'CHANGELOG.md': '## 1.0.0\n' }],
  ['origin-missing', 'member-signup', { origin: [] }, {}]
];
let caught = 0; const missed = [];
BROKEN.forEach(([rule, name, over, files], i) => {
  const d = mk('broken', String(i)); makeModule(d, name, over, files);
  const b = run(`2 broken ${rule}`, 'module-check.js', [d, '--json']);
  let j = null; try { j = JSON.parse(b.out); } catch (_) { /* reported as missed */ }
  if (b.status === 1 && j && j.findings.some(f => f.rule === rule)) caught++; else missed.push(rule);
});
check(2, `${BROKEN.length} modules each breaking one rule of the standard`, `exit 1 and the rule named, ${BROKEN.length} of ${BROKEN.length}`, `${caught} of ${BROKEN.length}${missed.length ? ' missed: ' + missed.join(', ') : ''}`, caught === BROKEN.length);

const allowed = mk('allowed');
makeModule(allowed, 'member-login');
makeModule(allowed, 'member-signup', { requires: ['member-login'], settings: [{ name: 'SIGNUP_SECRET' }], parts: { ...ABSENT, core: true, test: true, db: true, user: true, admin: true, api: true, docs: true }, provides: { tables: ['member_account', 'member_consent'] }, nameExceptions: ['page.tsx', '[id]'], origin: [{ site: 's', path: 'p', commit: null }], originNote: '원천 커밋이 기록되지 않았다' },
  { 'core/index.js': "import { rule as other } from '../../member-login/core/index.js';\nexport const s = process.env.SIGNUP_SECRET;\nexport function rule(x) { return other(x); }\n", 'core/rules.site-a.js': 'export const a = 1;\n',
    'db/schema.sql': 'CREATE TABLE member_account (id INTEGER PRIMARY KEY);\nCREATE TABLE member_consent (id INTEGER PRIMARY KEY, account_id INTEGER REFERENCES member_account(id));\n',
    'user/[id]/page.tsx': '', 'admin/member-list.js': '', 'api/routes.js': '', 'docs/security.md': '# 위협과 통제\n' });
r = run('3 allowed', 'module-check.js', [allowed]);
check(3, 'What the standard allows: a declared sibling entry, a declared setting, a reference inside the module, a named exception, a dotted variant file name', 'exit 0, no finding', `exit ${r.status}`, r.status === 0);
r = run('4 empty', 'module-check.js', [mk('empty')]);
check(4, 'A folder with no module', 'exit 4 (not measured, never a pass)', `exit ${r.status}`, r.status === 4);

// ── 5-10. take, status, update, remove ───────────────────────────────────────────────────────────────────────
const lib = mk('library'); const mods = path.join(lib, 'modules'); const app = mk('app');
makeModule(mods, 'member-signup');
makeModule(mods, 'member-login', { requires: ['member-signup'] }, { 'core/index.js': "import { rule } from '../../member-signup/core/index.js';\nexport const login = rule;\n", 'test/rule.test.js': "import test from 'node:test';\nimport assert from 'node:assert';\nimport { login } from '../core/index.js';\ntest('login', () => { assert.equal(login(2), true); });\n" });
const m = (label, ...args) => run(label, 'modules.js', [...args, '--library', lib, '--app', app]);
const rec = () => JSON.parse(fs.readFileSync(path.join(app, 'coolhan.modules.json'), 'utf8'));
const inApp = (name, rel) => path.join(app, 'coolhan_modules', name, rel);
r = m('5 add', 'add', 'member-login');
const tests = spawnSync(process.execPath, ['--test'], { cwd: path.join(app, 'coolhan_modules', 'member-login'), encoding: 'utf8' });
check(5, 'Take a module that requires another into an empty project', 'both folders arrive, the record holds versions and hashes, status exit 0, the installed module\'s own tests pass',
  `add exit ${r.status}; installed ${Object.keys(rec().modules).sort().join(', ')}; status exit ${m('5 status', 'status').status}; module tests exit ${tests.status}`,
  r.status === 0 && Object.keys(rec().modules).length === 2 && m('5 status again', 'status').status === 0 && tests.status === 0);

makeModule(mods, 'member-signup', { version: '1.1.0' }, { 'core/index.js': 'export function rule(x) { return x >= 0; }\n' });
const behind = m('6 status behind', 'status', '--json'); const bj = JSON.parse(behind.out);
r = m('6 update', 'update', 'member-signup');
check(6, 'The library gets a newer version of one module', 'status exit 1 naming that module only; update replaces the folder; status exit 0',
  `status exit ${behind.status} behind: ${bj.modules.filter(x => x.behind).map(x => x.name).join(', ')}; update exit ${r.status}; now ${rec().modules['member-signup'].version}; status exit ${m('6 status', 'status').status}`,
  behind.status === 1 && bj.modules.filter(x => x.behind).map(x => x.name).join() === 'member-signup' && r.status === 0 && rec().modules['member-signup'].version === '1.1.0' && /x >= 0/.test(fs.readFileSync(inApp('member-signup', 'core/index.js'), 'utf8')));

fs.writeFileSync(inApp('member-signup', 'core/index.js'), 'export function rule() { return true; } // project edit\n');
makeModule(mods, 'member-signup', { version: '1.2.0' }, { 'core/index.js': 'export function rule(x) { return x >= 1; }\n' });
const refused = m('7 update refused', 'update', 'member-signup');
const kept = fs.readFileSync(inApp('member-signup', 'core/index.js'), 'utf8');
const forced = m('7 update --force', 'update', 'member-signup', '--force');
const copy = path.join(app, 'coolhan_modules', '.local', 'member-signup', 'core', 'index.js');
check(7, 'The project edited a file inside the module, then the library moved on', 'update exit 1 naming the file and changing nothing; --force replaces and keeps the project\'s edit as a copy',
  `update exit ${refused.status}, file named ${/core\/index\.js/.test(refused.out)}, edit kept ${/project edit/.test(kept)}; --force exit ${forced.status}, copy kept ${fs.existsSync(copy) && /project edit/.test(fs.readFileSync(copy, 'utf8'))}`,
  refused.status === 1 && /core\/index\.js/.test(refused.out) && /project edit/.test(kept) && forced.status === 0 && fs.existsSync(copy) && /x >= 1/.test(fs.readFileSync(inApp('member-signup', 'core/index.js'), 'utf8')));

for (const f of ['core/index.js', 'module.json', 'README.md']) { const p = path.join(mods, 'member-login', f); fs.writeFileSync(p, fs.readFileSync(p, 'utf8').replace(/\r?\n/g, '\r\n')); }
r = m('8 status after CRLF', 'status');
check(8, 'The same module checked out with other line endings', 'not «behind», not «modified»: status exit 0', `exit ${r.status}`, r.status === 0);

const rm1 = m('9 remove required', 'remove', 'member-signup'); const rm2 = m('9 remove user', 'remove', 'member-login'); const rm3 = m('9 remove now', 'remove', 'member-signup');
check(9, 'Remove a module another one needs, then the other, then it', 'refused (exit 1), then 0, then 0; folders and record gone', `exit ${rm1.status}, ${rm2.status}, ${rm3.status}; left ${Object.keys(rec().modules).length}`,
  rm1.status === 1 && rm2.status === 0 && rm3.status === 0 && Object.keys(rec().modules).length === 0 && !fs.existsSync(path.join(app, 'coolhan_modules', 'member-signup')));
r = m('10 status none', 'status'); const none = m('10 status allow-none', 'status', '--allow-none'); const unknown = m('10 add unknown', 'add', 'member-nothing');
check(10, 'Nothing installed; the same with --allow-none; an unknown module', 'exit 4 (not measured); exit 0 said in words; exit 1', `exit ${r.status}; ${none.status}; ${unknown.status}`, r.status === 4 && none.status === 0 && unknown.status === 1);

// ── 11. drift ────────────────────────────────────────────────────────────────────────────────────────────────
const sites = mk('sites'); const site = path.join(sites, 'site-a');
const git = (...a) => spawnSync('git', ['-C', site, '-c', 'user.name=t', '-c', 'user.email=t@example.invalid', ...a], { encoding: 'utf8' });
fs.mkdirSync(path.join(site, 'src'), { recursive: true }); spawnSync('git', ['init', '-q', site]);
fs.writeFileSync(path.join(site, 'src/rule.js'), 'v1\n'); git('add', '.'); git('commit', '-q', '-m', 'first');
const first = git('rev-parse', 'HEAD').stdout.trim();
makeModule(mods, 'member-signup', { version: '1.2.0', origin: [{ site: 'site-a', path: 'src/rule.js:1-9', commit: first, date: '2026-11-01' }] });
makeModule(mods, 'member-login', { requires: ['member-signup'], origin: [{ site: 'site-gone', path: 'x.js', commit: 'abc1234' }] });
const d0 = run('11 drift before', 'modules.js', ['drift', '--library', lib, '--sites', sites, '--json']);
fs.writeFileSync(path.join(site, 'src/rule.js'), 'v2\n'); git('commit', '-q', '-am', 'better');
const d1 = run('11 drift after', 'modules.js', ['drift', '--library', lib, '--sites', sites, '--json']);
let j0 = {}, j1 = {}; try { j0 = JSON.parse(d0.out); j1 = JSON.parse(d1.out); } catch (_) { /* reported below */ }
check(11, 'A module\'s origin file is changed in its source project after the module was taken', 'before: exit 0, 1 measured, 1 not measured; after: exit 1 naming the module and 1 commit',
  `before exit ${d0.status} measured ${j0.measured} not measured ${j0.not_measured}; after exit ${d1.status} ahead ${(j1.ahead || []).map(a => `${a.module}:${a.commits}`).join(', ')}`,
  d0.status === 0 && j0.measured === 1 && j0.not_measured === 1 && d1.status === 1 && (j1.ahead || []).length === 1 && j1.ahead[0].module === 'member-signup' && j1.ahead[0].commits === 1);

// ── 12. conversion of the older layout ───────────────────────────────────────────────────────────────────────
const old = mk('older'); const conv = mk('converted');
const oldPkg = (name, requires, src) => { write(old, `${name}/module.json`, JSON.stringify({ name, bundle: 'B00', label: `label of ${name}`, requires, provides: { lib: ['f'] }, codeRef: [{ site: 'site-a', path: 'src/a.ts', role: 'as is' }], extracted: '2026-11-04' })); for (const [f, t] of Object.entries(src)) write(old, `${name}/src/${f}`, t); };
oldPkg('ledger/chain', [], { 'index.ts': 'export const link = (a: string) => a;\n', 'index.test.ts': "import test from 'node:test';\nimport assert from 'node:assert';\nimport { link } from './index.ts';\ntest('link', () => { assert.equal(link('a'), 'a'); });\n" });
oldPkg('partner/settlement', [], { 'index.ts': "import { link } from '../../../ledger/chain/src/index.ts';\nexport const settle = () => link('x');\n", 'index.test.ts': "import test from 'node:test';\nimport assert from 'node:assert';\nimport { settle } from './index.ts';\ntest('settle', () => { assert.equal(settle(), 'x'); });\n" });
const c1 = run('12 convert', 'module-convert.js', [old, '--out', conv]);
const gate = run('12 gate on converted', 'module-check.js', [conv]);
const convTests = ['ledger-chain', 'partner-settlement'].map(n => spawnSync(process.execPath, ['--test'], { cwd: path.join(conv, n), encoding: 'utf8' }).status);
const declared = JSON.parse(fs.readFileSync(path.join(conv, 'partner-settlement/module.json'), 'utf8')).requires;
fs.writeFileSync(path.join(conv, 'ledger-chain/core/index.ts'), 'export const link = () => "by hand";\n');
const c2 = run('12 convert again', 'module-convert.js', [old, '--out', conv, '--json']);
check(12, 'Two packages of the older layout, one importing the other without declaring it', 'both converted, gate PASS, their tests pass after the move, the missing requirement declared; a second run overwrites nothing',
  `convert exit ${c1.status}; gate exit ${gate.status}; tests exit ${convTests.join(', ')}; requires ${declared.join(', ')}; second run converted ${JSON.parse(c2.out).converted.length}, by-hand edit kept ${/by hand/.test(fs.readFileSync(path.join(conv, 'ledger-chain/core/index.ts'), 'utf8'))}`,
  c1.status === 0 && gate.status === 0 && convTests.every(s => s === 0) && declared.join() === 'ledger-chain' && JSON.parse(c2.out).converted.length === 0 && /by hand/.test(fs.readFileSync(path.join(conv, 'ledger-chain/core/index.ts'), 'utf8')));

// ── 13. a kit project uses the manager through its launcher ──────────────────────────────────────────────────
const kit = mk('kit-project');
run('13 kit', 'new-project.js', [kit, '--intent', 'module use', '--tags', 'ui', '--modules', lib]);
const launch = (...a) => { const x = spawnSync(process.execPath, [path.join(kit, 'scripts', 'coolhan.js'), ...a], { cwd: kit, encoding: 'utf8' }); log.push(`$ [13 launcher] node scripts/coolhan.js ${a.join(' ')}\n  exit ${x.status}\n`); return x; };
const l1 = launch('modules', 'list'); const l2 = launch('modules', 'add', 'member-login'); const l3 = launch('modules', 'status'); const l4 = launch('checks-run', '--only', 'C9');
check(13, 'Inside a kit project: list, add and status through the project launcher, and the kit\'s fixed check for modules', 'exit 0 each; the library is the one in the project settings; check C9 passes',
  `list ${l1.status}, add ${l2.status}, status ${l3.status}, checks-run C9 ${l4.status}; installed ${fs.existsSync(path.join(kit, 'coolhan_modules', 'member-signup', 'module.json'))}`,
  l1.status === 0 && l2.status === 0 && l3.status === 0 && l4.status === 0 && fs.existsSync(path.join(kit, 'coolhan_modules', 'member-signup', 'module.json')));

// ── 16. finding a module: by area, by a word, as a catalogue ──────────────────────────────────────────────────
const findLib = mk('find-library'); const findMods = path.join(findLib, 'modules');
makeModule(findMods, 'member-signup', { label: 'Sign-up', summary: 'account creation and e-mail verification' });
makeModule(findMods, 'admin-shell', { label: 'Admin frame', summary: 'side menu and top bar' });
const f = (label, ...args) => run(label, 'modules.js', ['list', ...args, '--library', findLib]);
const fArea = f('16 area', '--area', 'member'); const fWord = f('16 word', '--find', 'SIDE MENU'); const fNone = f('16 none', '--find', 'no-such-thing');
const fNoArea = f('16 no area', '--area', 'nowhere'); const fMd = f('16 md', '--md');
check(16, 'Find a module by area, by a word of its summary in another case, by a word nothing has, and print the catalogue',
  'area: only that area, exit 0; word: the one module, exit 0; nothing found: exit 4 twice (never a pass); catalogue: one heading per area in order, one row per module',
  `area exit ${fArea.status} (member ${/member-signup/.test(fArea.out)}, admin ${/admin-shell/.test(fArea.out)}); word exit ${fWord.status} (admin ${/admin-shell/.test(fWord.out)}, member ${/member-signup/.test(fWord.out)}); none exit ${fNone.status}, ${fNoArea.status}; catalogue exit ${fMd.status}, headings ${(fMd.out.match(/^## .+$/gm) || []).join(' ')}, rows ${(fMd.out.match(/^\| `/gm) || []).length}`,
  fArea.status === 0 && /member-signup/.test(fArea.out) && !/admin-shell/.test(fArea.out) && fWord.status === 0 && /admin-shell/.test(fWord.out) && !/member-signup/.test(fWord.out)
  && fNone.status === 4 && fNoArea.status === 4 && fMd.status === 0 && (fMd.out.match(/^## .+$/gm) || []).join(' ') === '## admin ## member' && (fMd.out.match(/^\| `/gm) || []).length === 2);

// ── 14-15. the real library on this machine ──────────────────────────────────────────────────────────────────
const realModules = path.join(REAL_LIBRARY, 'modules');
if (fs.existsSync(realModules)) {
  const g = run('14 real gate', 'module-check.js', [realModules, '--json']); let gj = { modules: [], findings: [] }; try { gj = JSON.parse(g.out); } catch (_) { /* reported below */ }
  check(14, 'The real module library on this machine', 'module-check PASS for every module in it', `exit ${g.status}; modules ${gj.modules.length}; findings ${gj.findings.length}`, g.status === 0 && gj.modules.length > 0);
  const realApp = mk('real-app'); const pick = gj.modules.map(x => x.name).find(n => n === 'partner-settlement') || (gj.modules[0] || {}).name;
  const ra = run('15 real add', 'modules.js', ['add', pick, '--library', REAL_LIBRARY, '--app', realApp]);
  const installed = fs.existsSync(path.join(realApp, 'coolhan.modules.json')) ? Object.keys(JSON.parse(fs.readFileSync(path.join(realApp, 'coolhan.modules.json'), 'utf8')).modules) : [];
  const realTests = installed.map(n => spawnSync(process.execPath, ['--test'], { cwd: path.join(realApp, 'coolhan_modules', n), encoding: 'utf8' }).status);
  check(15, `Take one real module (${pick}) with what it requires into an empty project and run the installed modules' own tests`, 'add exit 0; every installed module\'s tests exit 0',
    `add exit ${ra.status}; installed ${installed.length} (${installed.join(', ')}); tests exit ${realTests.join(', ')}`, ra.status === 0 && installed.length > 0 && realTests.every(s => s === 0));
} else {
  check(14, 'The real module library on this machine', 'module-check PASS', 'no library at the configured place', null);
  check(15, 'Take one real module into an empty project', 'tests pass', 'no library at the configured place', null);
}

const pass = rows.filter(x => x.ok === true).length, fail = rows.filter(x => x.ok === false).length, notRun = rows.filter(x => x.ok === null).length;
const table = rows.map(x => `${x.ok === null ? 'NOT_RUN' : x.ok ? 'PASS' : 'FAIL'} #${x.id} ${x.scenario}\n    expected: ${x.expected}\n    actual:   ${x.actual}`).join('\n');
const summary = `track43: ${pass}/${rows.length} match, ${fail} mismatch, ${notRun} not measured`;
fs.writeFileSync(path.join(__dirname, 'run-log.txt'), `${log.join('\n')}\n${table}\n\n${summary}\n`);
console.log(table + '\n\n' + summary);
try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (_) { /* left for the OS */ }
process.exit(fail ? 1 : notRun ? 4 : 0);
