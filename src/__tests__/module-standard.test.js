const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const check = require('../../scripts/module-check');
const mgr = require('../../scripts/modules');

const tmp = (p) => fs.mkdtempSync(path.join(os.tmpdir(), p));
const write = (root, rel, content) => { const f = path.join(root, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, content); };
const ABSENT = Object.fromEntries(check.PARTS.map(p => [p, `해당 없음: 이 모듈에 ${p} 부분이 없다`]));
const quiet = (fn) => { const o = { log: console.log, error: console.error }; const out = []; console.log = (m) => out.push(String(m)); console.error = (m) => out.push(String(m)); try { return { code: fn(), out: out.join('\n') }; } finally { console.log = o.log; console.error = o.error; } };

/** A module that satisfies the standard. `over` changes the manifest, `files` adds or replaces files. */
function makeModule(root, name, over = {}, files = {}) {
  const dir = path.join(root, name);
  const manifest = {
    name, version: '1.0.0', label: 'label', summary: 'what it does', area: name.split('-')[0], stack: 'none',
    parts: { ...ABSENT, core: true, test: true }, requires: [], provides: { lib: ['rule'] }, settings: [],
    origin: [{ site: 'some-site', path: 'src/rule.js', commit: 'abc1234', date: '2026-11-01' }], test: 'node --test test/', ...over
  };
  write(dir, 'module.json', JSON.stringify(manifest, null, 2));
  write(dir, 'README.md', `# ${name}\n`);
  write(dir, 'CHANGELOG.md', `## ${manifest.version}\n- first\n`);
  write(dir, 'core/index.js', 'export function rule(x) { return x > 0; }\n');
  write(dir, 'test/rule.test.js', "import { rule } from '../core/index.js';\n");
  for (const [rel, content] of Object.entries(files)) { if (content === null) fs.rmSync(path.join(dir, rel), { recursive: true, force: true }); else write(dir, rel, content); }
  return dir;
}
const rulesOf = (dir) => [...new Set(check.checkModule(dir).findings.map(f => f.rule))].sort();

describe('module-check: the form of a module (knowledge_base/00_MODULE_STANDARD.md)', () => {
  let root;
  beforeEach(() => { root = tmp('modstd-'); });
  afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

  test('a module that follows the standard passes; a folder without modules is NOT_RUN (exit 4), never a pass', () => {
    makeModule(root, 'member-signup');
    expect(check.evaluate(root)).toMatchObject({ status: 'PASS', findings: [] });
    expect(quiet(() => check.main(['node', 'module-check.js', root])).code).toBe(0);
    const empty = tmp('modstd-empty-');
    expect(quiet(() => check.main(['node', 'module-check.js', empty])).code).toBe(4);
    expect(quiet(() => check.main(['node', 'module-check.js'])).code).toBe(2);
    fs.rmSync(empty, { recursive: true, force: true });
  });

  const CASES = [
    ['name-format', 'signup', {}, {}],
    ['name-banned-word', 'member-utils', {}, {}],
    ['name-mismatch', 'member-signup', { name: 'member-login' }, {}],
    ['area-mismatch', 'member-signup', { area: 'account' }, {}],
    ['version-format', 'member-signup', { version: '1.0' }, {}],
    ['manifest-invalid', 'member-signup', { summary: '' }, {}],
    ['require-name-format', 'member-signup', { requires: ['member-login (when the gate is needed)'] }, {}],
    ['unknown-folder', 'member-signup', {}, { 'src/thing.js': '' }],
    ['unknown-file', 'member-signup', {}, { 'notes.txt': 'x' }],
    ['required-file-missing', 'member-signup', {}, { 'README.md': null }],
    ['changelog-version-missing', 'member-signup', { version: '1.1.0' }, { 'CHANGELOG.md': '## 1.0.0\n- first\n' }],
    ['parts-mismatch', 'member-signup', { parts: { ...ABSENT, core: true, test: true, api: true } }, {}],
    ['parts-mismatch', 'member-signup', {}, { 'docs/spec.md': '# spec' }],
    ['parts-mismatch', 'member-signup', { parts: { ...ABSENT, core: true, test: true, style: '' } }, {}],
    ['set-incomplete', 'member-signup', { parts: { ...ABSENT, core: true, test: true, api: true, docs: true, admin: '' } }, { 'api/routes.js': '', 'docs/security.md': '# s' }],
    ['file-name-format', 'member-signup', {}, { 'core/SignupRule.js': '' }],
    ['file-name-format', 'member-signup', {}, { 'core/signup_rule.js': '' }],
    ['file-name-banned-word', 'member-signup', {}, { 'core/helpers.js': '' }],
    ['entry-missing', 'member-signup', {}, { 'core/index.js': null, 'core/rule.js': '' }],
    ['test-outside-test-folder', 'member-signup', {}, { 'core/rule.test.js': '' }],
    ['core-imports-framework', 'member-signup', {}, { 'core/index.js': "import { Injectable } from '@nestjs/common';\n" }],
    ['core-imports-framework', 'member-signup', {}, { 'core/index.js': "const { DatabaseSync } = require('node:sqlite');\n" }],
    ['import-escapes-module', 'member-signup', {}, { 'core/index.js': "import x from '../../../lib/api.js';\n" }],
    ['import-escapes-module', 'member-signup', { requires: ['member-login'] }, { 'core/index.js': "import x from '../../member-login/core/inside.js';\n" }],
    ['require-undeclared', 'member-signup', {}, { 'core/index.js': "import x from '../../member-login/core/index.js';\n" }],
    ['setting-undeclared', 'member-signup', {}, { 'core/index.js': 'export const s = process.env.SIGNUP_SECRET;\n' }],
    ['test-missing', 'member-signup', { parts: { ...ABSENT, core: true } }, { test: null }],
    ['security-note-missing', 'member-signup', { parts: { ...ABSENT, core: true, test: true, api: true } }, { 'api/routes.js': '' }],
    ['db-table-prefix', 'member-signup', { parts: { ...ABSENT, core: true, test: true, db: true }, provides: { tables: ['account'] } }, { 'db/schema.sql': 'CREATE TABLE IF NOT EXISTS account (id INTEGER PRIMARY KEY);' }],
    ['db-table-undeclared', 'member-signup', { parts: { ...ABSENT, core: true, test: true, db: true } }, { 'db/schema.sql': 'CREATE TABLE member_account (id INTEGER PRIMARY KEY);' }],
    ['db-foreign-reference', 'member-signup', { parts: { ...ABSENT, core: true, test: true, db: true }, provides: { tables: ['member_account'] } }, { 'db/schema.sql': 'CREATE TABLE member_account (id INTEGER PRIMARY KEY, order_id INTEGER REFERENCES proxy_order(id));' }],
    ['origin-missing', 'member-signup', { origin: [] }, {}],
    ['origin-missing', 'member-signup', { origin: [{ site: 's', path: 'p', commit: null }] }, {}]
  ];
  test.each(CASES)('rule %s is reported (module %s)', (rule, name, over, files) => {
    expect(rulesOf(makeModule(root, name, over, files))).toContain(rule);
  });

  test('what the standard allows is not reported: a declared sibling entry, a declared setting, own tables with a reference inside the module, a named exception', () => {
    const dir = makeModule(root, 'member-signup', {
      requires: [{ name: 'member-login', version: '^1.0.0' }], settings: [{ name: 'SIGNUP_SECRET', note: 'signing' }],
      parts: { ...ABSENT, core: true, test: true, db: true, user: true, admin: true, api: true, docs: true },
      provides: { tables: ['member_account', 'member_consent'] }, nameExceptions: ['page.tsx', '[id]'],
      origin: [{ site: 's', path: 'p', commit: null }], originNote: '원천 커밋이 기록되지 않았다'
    }, {
      'core/index.js': "import x from '../../member-login/core/index.js';\nexport const s = process.env.SIGNUP_SECRET;\n",
      'db/schema.sql': 'CREATE TABLE member_account (id INTEGER PRIMARY KEY);\nCREATE TABLE member_consent (id INTEGER PRIMARY KEY, account_id INTEGER REFERENCES member_account(id));\n',
      'user/[id]/page.tsx': '', 'admin/member-list.js': '', 'api/routes.js': '', 'docs/security.md': '# 위협과 통제\n'
    });
    expect(check.checkModule(dir).findings).toEqual([]);
  });
});

describe('modules: take a module into a project, see that it is behind, replace it (plug-in use)', () => {
  let lib, app;
  const run = (...args) => quiet(() => mgr.main(['node', 'modules.js', ...args, '--library', lib, '--app', app]));
  const record = () => JSON.parse(fs.readFileSync(path.join(app, mgr.RECORD), 'utf8'));
  const installed = (name, rel) => path.join(app, mgr.INSTALL_DIR, name, rel);
  beforeEach(() => {
    lib = tmp('modlib-'); app = tmp('modapp-');
    makeModule(path.join(lib, 'modules'), 'member-signup');
    makeModule(path.join(lib, 'modules'), 'member-login', { requires: ['member-signup'] }, { 'core/index.js': "import { rule } from '../../member-signup/core/index.js';\nexport const login = rule;\n" });
  });
  afterEach(() => { for (const d of [lib, app]) fs.rmSync(d, { recursive: true, force: true }); });

  test('both library modules follow the standard; list names them', () => {
    expect(check.evaluate(path.join(lib, 'modules')).status).toBe('PASS');
    const r = run('list');
    expect(r.code).toBe(0); expect(r.out).toMatch(/member-login/); expect(r.out).toMatch(/member-signup/);
  });

  test('add copies the module folder as it is, brings what it requires, and records version and hashes', () => {
    expect(run('add', 'member-login').code).toBe(0);
    expect(fs.existsSync(installed('member-signup', 'core/index.js'))).toBe(true);
    expect(fs.readFileSync(installed('member-login', 'core/index.js'), 'utf8')).toBe(fs.readFileSync(path.join(lib, 'modules/member-login/core/index.js'), 'utf8'));
    const rec = record();
    expect(Object.keys(rec.modules).sort()).toEqual(['member-login', 'member-signup']);
    expect(rec.modules['member-login']).toMatchObject({ version: '1.0.0', requires: ['member-signup'] });
    expect(Object.keys(rec.modules['member-login'].files)).toContain('core/index.js');
    expect(run('status').code).toBe(0);
    expect(run('add', 'member-login').code).toBe(0);            // repeat: nothing changes
  });

  test('line endings are not content: the same module checked out with CRLF is not «behind» and not «modified»', () => {
    run('add', 'member-signup');
    const crlf = (file) => fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace(/\r?\n/g, '\r\n'));
    crlf(path.join(lib, 'modules/member-signup/core/index.js')); crlf(path.join(lib, 'modules/member-signup/module.json'));
    crlf(installed('member-signup', 'README.md'));
    const st = run('status', '--json');
    expect(st.code).toBe(0);
    expect(JSON.parse(st.out).modules[0]).toMatchObject({ behind: false, modified: [] });
  });

  test('nothing installed, an unknown module, a folder that is already there, a missing library', () => {
    expect(run('status').code).toBe(4);                          // not measured, never a pass
    expect(run('add', 'member-nothing').code).toBe(1);
    fs.mkdirSync(path.join(app, mgr.INSTALL_DIR, 'member-signup'), { recursive: true });
    fs.writeFileSync(installed('member-signup', 'mine.txt'), 'x');
    expect(run('add', 'member-signup').code).toBe(1);            // never overwrites a folder it did not install
    expect(fs.readFileSync(installed('member-signup', 'mine.txt'), 'utf8')).toBe('x');
    expect(quiet(() => mgr.main(['node', 'modules.js', 'list', '--library', path.join(lib, 'nope')])).code).toBe(4);
    expect(quiet(() => mgr.main(['node', 'modules.js', 'install'])).code).toBe(2);
  });

  test('when the library moves on, status says so (exit 1) and update replaces the folder', () => {
    run('add', 'member-login');
    makeModule(path.join(lib, 'modules'), 'member-signup', { version: '1.1.0' }, { 'core/index.js': 'export function rule(x) { return x >= 0; }\n', 'core/consent.js': 'export const c = 1;\n' });
    const st = run('status', '--json'); const j = JSON.parse(st.out);
    expect(st.code).toBe(1); expect(j.status).toBe('BEHIND');
    expect(j.modules.find(m => m.name === 'member-signup')).toMatchObject({ installed: '1.0.0', available: '1.1.0', behind: true, modified: [] });
    expect(j.modules.find(m => m.name === 'member-login').behind).toBe(false);
    expect(run('update', 'member-signup').code).toBe(0);
    expect(fs.readFileSync(installed('member-signup', 'core/index.js'), 'utf8')).toMatch(/>= 0/);
    expect(fs.existsSync(installed('member-signup', 'core/consent.js'))).toBe(true);
    expect(record().modules['member-signup'].version).toBe('1.1.0');
    expect(run('status').code).toBe(0);
  });

  test('a file the project changed is never overwritten silently: update refuses, --force keeps a copy beside', () => {
    run('add', 'member-signup');
    fs.writeFileSync(installed('member-signup', 'core/index.js'), 'export function rule() { return true; } // project edit\n');
    expect(JSON.parse(run('status', '--json').out).modules[0].modified).toEqual(['core/index.js']);
    expect(run('status').code).toBe(0);                          // changed locally, not behind
    makeModule(path.join(lib, 'modules'), 'member-signup', { version: '1.1.0' }, { 'core/index.js': 'export function rule(x) { return x >= 0; }\n' });
    const refused = run('update', 'member-signup');
    expect(refused.code).toBe(1); expect(refused.out).toMatch(/core\/index\.js/);
    expect(fs.readFileSync(installed('member-signup', 'core/index.js'), 'utf8')).toMatch(/project edit/);
    expect(record().modules['member-signup'].version).toBe('1.0.0');
    expect(run('update', 'member-signup', '--force').code).toBe(0);
    expect(fs.readFileSync(installed('member-signup', 'core/index.js'), 'utf8')).toMatch(/>= 0/);
    expect(fs.readFileSync(path.join(app, mgr.INSTALL_DIR, '.local', 'member-signup', 'core/index.js'), 'utf8')).toMatch(/project edit/);
  });

  test('update --all brings a newly required module; remove refuses while another module needs it', () => {
    run('add', 'member-signup');
    makeModule(path.join(lib, 'modules'), 'member-consent');
    makeModule(path.join(lib, 'modules'), 'member-signup', { version: '2.0.0', requires: ['member-consent'] }, { 'core/index.js': "import { rule as c } from '../../member-consent/core/index.js';\nexport const rule = c;\n" });
    expect(run('update', '--all').code).toBe(0);
    expect(Object.keys(record().modules).sort()).toEqual(['member-consent', 'member-signup']);
    expect(run('remove', 'member-consent').code).toBe(1);
    expect(run('remove', 'member-signup').code).toBe(0);
    expect(fs.existsSync(path.join(app, mgr.INSTALL_DIR, 'member-signup'))).toBe(false);
    expect(run('remove', 'member-consent').code).toBe(0);
    expect(record().modules).toEqual({});
  });

  test('drift: an origin path that changed in its project after the module was taken makes the module a candidate', () => {
    const sites = tmp('modsites-'); const site = path.join(sites, 'some-site');
    const git = (...a) => spawnSync('git', ['-C', site, '-c', 'user.name=t', '-c', 'user.email=t@example.invalid', ...a], { encoding: 'utf8' });
    fs.mkdirSync(path.join(site, 'src'), { recursive: true });
    spawnSync('git', ['init', '-q', site]);
    fs.writeFileSync(path.join(site, 'src/rule.js'), 'v1\n'); git('add', '.'); git('commit', '-q', '-m', 'first');
    const first = git('rev-parse', 'HEAD').stdout.trim();
    makeModule(path.join(lib, 'modules'), 'member-signup', { origin: [{ site: 'some-site', path: 'src/rule.js:1-9', commit: first, date: '2026-11-01' }] });
    makeModule(path.join(lib, 'modules'), 'member-login', { requires: ['member-signup'], origin: [{ site: 'site-not-here', path: 'x.js', commit: 'abc1234' }] });
    const drift = (...a) => quiet(() => mgr.main(['node', 'modules.js', 'drift', '--library', lib, '--sites', sites, ...a]));
    expect(JSON.parse(drift('--json').out)).toMatchObject({ status: 'CURRENT', measured: 1, not_measured: 1 });
    expect(drift().code).toBe(0);
    fs.writeFileSync(path.join(site, 'src/rule.js'), 'v2\n'); git('commit', '-q', '-am', 'better');
    const after = drift('--json'); const j = JSON.parse(after.out);
    expect(after.code).toBe(1); expect(j.status).toBe('SOURCE_AHEAD');
    expect(j.ahead).toEqual([expect.objectContaining({ module: 'member-signup', site: 'some-site', commits: 1 })]);
    expect(quiet(() => mgr.main(['node', 'modules.js', 'drift', '--library', lib, '--sites', path.join(sites, 'none')])).code).toBe(4);
    fs.rmSync(sites, { recursive: true, force: true });
  });
});

describe('module-convert: older stack-neutral packages into the standard form', () => {
  const convert = require('../../scripts/module-convert');
  let root, out;
  beforeEach(() => {
    root = tmp('modold-'); out = tmp('modnew-');
    const old = (name, requires, src) => {
      write(root, `${name}/module.json`, JSON.stringify({ name, bundle: 'B00', label: `label of ${name}`, stack: 'none', requires, provides: { lib: ['f'] }, codeRef: [{ site: 'some-site', path: 'src/a.ts:1-9', role: 'as is' }], extracted: '2026-11-04' }));
      for (const [f, text] of Object.entries(src)) write(root, `${name}/src/${f}`, text);
    };
    old('ledger/chain', [], { 'index.ts': 'export const link = (a: string) => a;\n', 'index.test.ts': "import { link } from './index.ts';\n" });
    old('partner/settlement', [], {
      'index.ts': "import { link } from '../../../ledger/chain/src/index.ts';\nimport { rate } from './rules.site-a.ts';\nexport const settle = () => link(String(rate)) + String(process.env.SETTLE_ZONE);\n",
      'rules.site-a.ts': 'export const rate = 3;\n',
      'index.test.ts': "import { settle } from './index.ts';\nimport { link } from '../../../ledger/chain/src/index.ts';\n"
    });
  });
  afterEach(() => { for (const d of [root, out]) fs.rmSync(d, { recursive: true, force: true }); });

  test('converted modules satisfy the standard; imports follow the move; a dependency the old manifest missed is declared', () => {
    const r = convert.convert(root, out);
    expect(r).toMatchObject({ packages: 2, skipped: [], failed: [] });
    expect(r.converted.map(c => c.name)).toEqual(['ledger-chain', 'partner-settlement']);
    expect(check.evaluate(out)).toMatchObject({ status: 'PASS', findings: [] });
    const core = fs.readFileSync(path.join(out, 'partner-settlement/core/index.ts'), 'utf8');
    expect(core).toContain("'../../ledger-chain/core/index.ts'"); expect(core).toContain("'./rules.site-a.ts'");
    const test = fs.readFileSync(path.join(out, 'partner-settlement/test/index.test.ts'), 'utf8');
    expect(test).toContain("'../core/index.ts'"); expect(test).toContain("'../../ledger-chain/core/index.ts'");
    const m = JSON.parse(fs.readFileSync(path.join(out, 'partner-settlement/module.json'), 'utf8'));
    expect(m).toMatchObject({ name: 'partner-settlement', version: '1.0.0', area: 'partner', requires: ['ledger-chain'], settings: [{ name: 'SETTLE_ZONE' }] });
    expect(m.origin[0]).toMatchObject({ site: 'some-site', path: 'src/a.ts:1-9', commit: null, date: '2026-11-04' });
    expect(fs.existsSync(path.join(root, 'partner/settlement/src/index.ts'))).toBe(true);     // the older layout is not touched
  });

  test('a module folder that already exists is never overwritten; --dry writes nothing; nothing to convert is exit 4', () => {
    convert.convert(root, out);
    fs.writeFileSync(path.join(out, 'ledger-chain/core/index.ts'), 'export const link = () => "improved by hand";\n');
    const again = convert.convert(root, out);
    expect(again.skipped.sort()).toEqual(['ledger-chain', 'partner-settlement']); expect(again.converted).toEqual([]);
    expect(fs.readFileSync(path.join(out, 'ledger-chain/core/index.ts'), 'utf8')).toMatch(/improved by hand/);
    const dryOut = tmp('moddry-');
    expect(convert.convert(root, dryOut, { dry: true }).converted).toHaveLength(2);
    expect(fs.readdirSync(dryOut)).toEqual([]);
    const empty = tmp('modnone-');
    expect(quiet(() => convert.main(['node', 'module-convert.js', empty, '--out', dryOut])).code).toBe(4);
    expect(quiet(() => convert.main(['node', 'module-convert.js', root])).code).toBe(2);
    for (const d of [dryOut, empty]) fs.rmSync(d, { recursive: true, force: true });
  });
});
