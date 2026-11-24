const fs = require('fs');
const os = require('os');
const path = require('path');
const check = require('../../scripts/module-check');
const admit = require('../../scripts/module-admit');

jest.setTimeout(180000);

const write = (root, rel, content) => { const f = path.join(root, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, content); };
const ABSENT = Object.fromEntries(check.PARTS.map(p => [p, `해당 없음: 이 모듈에 ${p} 부분이 없다`]));
const quiet = (fn) => { const o = { log: console.log, error: console.error }; const out = []; console.log = (m) => out.push(String(m)); console.error = (m) => out.push(String(m)); try { return { code: fn(), out: out.join('\n') }; } finally { console.log = o.log; console.error = o.error; } };
const GOOD_TEST = "import test from 'node:test';\nimport assert from 'node:assert';\nimport { rule } from '../core/index.js';\ntest('rule', () => { assert.equal(rule(1), true); });\n";

/** A module with a test that really runs. `over` changes the manifest, `files` adds or replaces files. */
function makeModule(library, name, over = {}, files = {}) {
  const dir = path.join(library, 'modules', name);
  const manifest = {
    name, version: '1.0.0', label: 'label', summary: 'what it does', area: name.split('-')[0], stack: 'none',
    parts: { ...ABSENT, core: true, test: true }, requires: [], provides: { lib: ['rule'] }, settings: [],
    origin: [{ site: 'some-site', path: 'src/rule.js', commit: 'abc1234', date: '2026-11-01' }], test: 'node --test', ...over
  };
  write(dir, 'module.json', JSON.stringify(manifest, null, 2));
  write(dir, 'package.json', '{ "type": "module" }\n');
  write(dir, 'README.md', `# ${name}\n`);
  write(dir, 'CHANGELOG.md', `## ${manifest.version}\n- first\n`);
  write(dir, 'core/index.js', 'export function rule(x) { return x > 0; }\n');
  write(dir, 'test/rule.test.js', GOOD_TEST);
  for (const [rel, content] of Object.entries(files)) write(dir, rel, content);
  return dir;
}
const run = (library, ...names) => { const r = quiet(() => admit.main(['node', 'module-admit.js', ...names, '--library', library, '--json'])); return { code: r.code, json: JSON.parse(r.out) }; };
const stepsOf = (r, name) => Object.fromEntries(Object.entries(r.json.modules.find(m => m.name === name).steps).map(([k, v]) => [k, v.status]));

describe('module-admit: what a module must show before it is committed to the library', () => {
  let library;
  beforeEach(() => { library = fs.mkdtempSync(path.join(os.tmpdir(), 'admit-')); });
  afterEach(() => { fs.rmSync(library, { recursive: true, force: true }); });

  test('a sound module passes all four steps, with its requirement installed beside it (exit 0)', () => {
    makeModule(library, 'member-rules');
    makeModule(library, 'member-signup', { requires: ['member-rules'] });
    const r = run(library, 'member-signup');
    expect(r.code).toBe(0);
    expect(r.json.status).toBe('PASS');
    expect(stepsOf(r, 'member-signup')).toEqual({ form: 'PASS', test: 'PASS', install: 'PASS', secrets: 'PASS', integration: 'PASS' });
    expect(r.json.modules[0].steps.test.counts).toMatchObject({ tests: 1, fail: 0 });
  });

  test('a failing test is FAIL in the library and in the installed copy (exit 1)', () => {
    makeModule(library, 'member-signup', {}, { 'test/rule.test.js': GOOD_TEST.replace('rule(1), true', 'rule(1), false') });
    const r = run(library, 'member-signup');
    expect(r.code).toBe(1);
    expect(stepsOf(r, 'member-signup')).toMatchObject({ form: 'PASS', test: 'FAIL', install: 'FAIL', secrets: 'PASS' });
  });

  test('a line that looks like a secret is FAIL even when form and tests pass: the commit this script exists to stop', () => {
    makeModule(library, 'member-signup', {}, { 'test/fixture.test.js': `${GOOD_TEST}const password = 'correct-horse-battery-staple-1';\n` }); // secret-scan:allow the line the admitted module's scan must catch (the marker stays outside the fixture)
    const r = run(library, 'member-signup');
    expect(r.code).toBe(1);
    expect(stepsOf(r, 'member-signup')).toEqual({ form: 'PASS', test: 'PASS', install: 'PASS', secrets: 'FAIL', integration: 'PASS' });
    expect(r.json.modules[0].steps.secrets.detail).toMatch(/test\/fixture\.test\.js:\d+/);
  });

  test('a test command that runs 0 tests measured nothing: NOT_RUN and exit 4, never a pass', () => {
    // The command names a pattern no file matches: the runner exits 0 having run nothing.
    makeModule(library, 'member-signup', { test: 'node --test "test/*.spec.js"' });
    const r = run(library, 'member-signup');
    expect(stepsOf(r, 'member-signup').test).toBe('NOT_RUN');
    expect(r.code).toBe(4);
    expect(r.json.status).toBe('NOT_RUN');
  });

  test('a module whose form fails is not installed: form FAIL, install NOT_RUN, exit 1', () => {
    makeModule(library, 'member-signup', {}, { 'src/thing.js': 'export const x = 1;\n' });
    const r = run(library, 'member-signup');
    expect(r.code).toBe(1);
    expect(stepsOf(r, 'member-signup')).toMatchObject({ form: 'FAIL', install: 'NOT_RUN' });
    expect(r.json.modules[0].steps.form.detail).toMatch(/unknown-folder/);
  });

  test('a module that only works beside its neighbours in the library fails the install step', () => {
    makeModule(library, 'member-rules');
    // Reads a neighbour's file at run time without declaring it: passes inside the library, cannot stand alone.
    makeModule(library, 'member-signup', {}, {
      'test/rule.test.js': `${GOOD_TEST}import fs from 'node:fs';\ntest('neighbour', () => { assert.ok(fs.existsSync(new URL('../../member-rules/module.json', import.meta.url))); });\n`
    });
    const r = run(library, 'member-signup');
    expect(stepsOf(r, 'member-signup')).toMatchObject({ test: 'PASS', install: 'FAIL' });
    expect(r.code).toBe(1);
  });

  test('a module that names an export it does not have fails the integration step, whatever its own tests say', () => {
    makeModule(library, 'member-signup', { provides: { lib: ['rule', 'ghostName'] } });
    const r = run(library, 'member-signup');
    expect(r.code).toBe(1);
    expect(stepsOf(r, 'member-signup')).toMatchObject({ test: 'PASS', integration: 'FAIL' });
    expect(r.json.modules[0].steps.integration.detail).toMatch(/lib-not-exported/);
  });

  test('--all admits every module; one bad module makes the run fail and the good one stays PASS', () => {
    makeModule(library, 'member-rules');
    makeModule(library, 'member-signup', {}, { 'test/rule.test.js': GOOD_TEST.replace('rule(1), true', 'rule(1), false') });
    const r = quiet(() => admit.main(['node', 'module-admit.js', '--all', '--library', library, '--json']));
    const j = JSON.parse(r.out);
    expect(r.code).toBe(1);
    expect(j.modules.map(m => [m.name, m.status])).toEqual([['member-rules', 'PASS'], ['member-signup', 'FAIL']]);
  });

  test('--with-dependents admits what is built on a changed module, also through another module; the break shows there', () => {
    makeModule(library, 'member-rules');
    makeModule(library, 'member-signup', { requires: ['member-rules'] });
    // built on member-signup, and its test fails: admitted alone, member-rules would pass and hide this
    makeModule(library, 'member-screens', { requires: ['member-signup'] }, { 'test/rule.test.js': GOOD_TEST.replace('rule(1), true', 'rule(1), false') });
    makeModule(library, 'admin-shell');
    expect(run(library, 'member-rules').code).toBe(0);
    const r = run(library, 'member-rules', '--with-dependents');
    expect(r.json.modules.map(m => [m.name, m.status])).toEqual([['member-rules', 'PASS'], ['member-screens', 'FAIL'], ['member-signup', 'PASS']]);
    expect(r.code).toBe(1);
    expect(admit.withDependents(['admin-shell'], { 'admin-shell': { name: 'admin-shell', requires: [] } })).toEqual(['admin-shell']);
  });

  test('--consumer: a project takes the new versions and runs its own check; a change that breaks the project fails admission', () => {
    const mgr = require('../../scripts/modules');
    makeModule(library, 'member-rules');
    const app = fs.mkdtempSync(path.join(os.tmpdir(), 'admit-app-'));
    try {
      expect(quiet(() => mgr.main(['node', 'modules.js', 'add', 'member-rules', '--app', app, '--library', library])).code).toBe(0);
      // the project's own check: it uses rule() and expects a boolean
      write(app, 'check.mjs', "import { rule } from './coolhan_modules/member-rules/core/index.js';\nif (typeof rule(1) !== 'boolean') { console.error('error: rule no longer returns a boolean'); process.exit(1); }\n");
      const check = ['--consumer', app, '--consumer-check', 'node check.mjs'];
      // nothing changed: admitted, project current
      let r = run(library, 'member-rules', ...check);
      expect(r.code).toBe(0); expect(r.json.consumer).toMatchObject({ status: 'PASS', updated: 0 });
      // a new version that still passes its own test and breaks the project
      makeModule(library, 'member-rules', { version: '1.1.0' }, { 'core/index.js': 'export function rule(x) { return x > 0 ? "yes" : ""; }\n', 'test/rule.test.js': GOOD_TEST.replace('rule(1), true', 'rule(1), "yes"'), 'CHANGELOG.md': '## 1.1.0\n- changed\n' });
      r = run(library, 'member-rules', ...check);
      expect(r.json.modules[0].status).toBe('PASS');
      expect(r.json.consumer.status).toBe('FAIL'); expect(r.json.consumer.detail).toMatch(/rule no longer returns a boolean/);
      expect(r.code).toBe(1);
      // a module that fails is not pushed into the project
      makeModule(library, 'member-rules', { version: '1.2.0' }, { 'test/rule.test.js': GOOD_TEST.replace('rule(1), true', 'rule(1), false'), 'CHANGELOG.md': '## 1.2.0\n- broken\n' });
      r = run(library, 'member-rules', ...check);
      expect(r.json.consumer.status).toBe('NOT_RUN');
      expect(JSON.parse(fs.readFileSync(path.join(app, 'coolhan.modules.json'), 'utf8')).modules['member-rules'].version).toBe('1.1.0');
      // a folder that is not a project, and a project without the check command
      expect(run(library, 'member-none', '--consumer', library).code).toBe(4);
    } finally { fs.rmSync(app, { recursive: true, force: true }); }
  });

  test('unknown module and missing library are exit 4, a missing name is usage (exit 2)', () => {
    makeModule(library, 'member-rules');
    expect(run(library, 'member-none').code).toBe(4);
    expect(quiet(() => admit.main(['node', 'module-admit.js', 'member-rules', '--library', path.join(library, 'nowhere')])).code).toBe(4);
    expect(quiet(() => admit.main(['node', 'module-admit.js', '--library', library])).code).toBe(2);
    expect(quiet(() => admit.main(['node', 'module-admit.js', 'member-rules', '--library', library, '--commit'])).code).toBe(2);
  });

  test('counts reads both forms of the runner summary and returns null when a command prints none', () => {
    expect(admit.counts('# tests 3\n# fail 0\n# skipped 1\n')).toEqual({ tests: 3, fail: 0, skipped: 1 });
    expect(admit.counts('ℹ tests 2\nℹ fail 1\n')).toEqual({ tests: 2, fail: 1 });
    expect(admit.counts('all good\n')).toBeNull();
  });
});
