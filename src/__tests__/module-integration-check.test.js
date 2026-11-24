const fs = require('fs');
const os = require('os');
const path = require('path');
const { evaluate, satisfies, auditOrder, loadLibrary, main } = require('../../scripts/module-integration-check');

function tmp() { return fs.mkdtempSync(path.join(os.tmpdir(), 'integ-')); }
function put(lib, name, rel, content) {
  const p = path.join(lib, name, rel); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, content);
}
function mod(lib, name, over = {}, files = {}) {
  const manifest = { name, version: '1.0.0', area: name.split('-')[0], requires: [], provides: {}, settings: [], ...over };
  put(lib, name, 'module.json', JSON.stringify(manifest, null, 2));
  for (const [rel, content] of Object.entries(files)) put(lib, name, rel, content);
}
const rules = (r) => r.findings.map(f => f.rule);

describe('module-integration-check (modules fit together and carry their design)', () => {
  test('satisfies: caret, tilde, minimum, exact and empty ranges', () => {
    expect(satisfies('1.4.2', '^1.2.0')).toBe(true);
    expect(satisfies('2.0.0', '^1.2.0')).toBe(false);
    expect(satisfies('1.1.9', '^1.2.0')).toBe(false);
    expect(satisfies('0.2.5', '^0.2.1')).toBe(true);
    expect(satisfies('0.3.0', '^0.2.1')).toBe(false);
    expect(satisfies('1.2.9', '~1.2.3')).toBe(true);
    expect(satisfies('1.3.0', '~1.2.3')).toBe(false);
    expect(satisfies('3.0.0', '>=1.0.0')).toBe(true);
    expect(satisfies('1.0.1', '1.0.0')).toBe(false);
    expect(satisfies('9.9.9', '')).toBe(true);
  });

  test('a library of modules that agree passes', () => {
    const lib = tmp();
    mod(lib, 'base-rules', { provides: { lib: ['makeRule'] } }, { 'core/index.ts': 'export function makeRule() { return 1; }\n' });
    mod(lib, 'shop-list', { requires: ['base-rules@^1.0.0'], provides: { tokens: ['--sl-bg'] } },
      { 'style/tokens.css': ':root { --sl-bg: #fff; }\n.sl { background: var(--sl-bg); }\n', 'user/list.tsx': 'export const A = 1;\n' });
    const r = evaluate(lib);
    expect(r.findings).toEqual([]);
    expect(r.status).toBe('PASS');
    expect(r.modules).toBe(2);
    fs.rmSync(lib, { recursive: true, force: true });
  });

  test('requires: unresolved module, range not satisfied, cycle', () => {
    const lib = tmp();
    mod(lib, 'aaa-one', { requires: ['zzz-missing@^1.0.0', 'bbb-two@^1.0.0'] });
    mod(lib, 'bbb-two', { version: '2.0.0', requires: ['aaa-one@^1.0.0'] });
    const r = evaluate(lib);
    expect(rules(r)).toEqual(expect.arrayContaining(['requires-unresolved', 'requires-range', 'requires-cycle']));
    expect(r.findings.find(f => f.rule === 'requires-cycle').detail).toMatch(/aaa-one > bbb-two > aaa-one|bbb-two > aaa-one > bbb-two/);
    fs.rmSync(lib, { recursive: true, force: true });
  });

  test('provides.lib: a name nobody exports is lib-not-exported; a name exported by a file outside the public entries is lib-not-reachable', () => {
    const lib = tmp();
    mod(lib, 'calc-core', { provides: { lib: ['openFn', 'hiddenFn', 'ghostFn'] } }, {
      'core/index.ts': 'export function openFn() { return 1; }\n',
      'core/rules.ts': 'export function hiddenFn() { return 2; }\n'
    });
    const r = evaluate(lib);
    expect(r.findings.find(f => f.rule === 'lib-not-reachable').where).toBe('calc-core/core/rules.ts');
    expect(r.findings.find(f => f.rule === 'lib-not-exported').detail).toMatch(/ghostFn/);
    expect(r.findings.filter(f => /openFn/.test(f.detail))).toEqual([]);
    fs.rmSync(lib, { recursive: true, force: true });
  });

  test('provides.lib follows `export *` and listed entries', () => {
    const lib = tmp();
    mod(lib, 'calc-core', { provides: { lib: ['a', 'b', 'c'], entries: ['admin/hook.ts'] } }, {
      'core/index.ts': "export * from './more.ts';\nexport { a };\nconst a = 1;\n",
      'core/more.ts': 'export const b = 2;\n',
      'admin/hook.ts': 'export function c() { return 3; }\n',
      'style/tokens.css': ':root { --cc-gap: 4px; }\n'
    });
    expect(evaluate(lib).findings).toEqual([]);
    fs.rmSync(lib, { recursive: true, force: true });
  });

  test('tokens: provided but not defined; used with no definition and no fallback; defined by a required module or a fallback is fine', () => {
    const lib = tmp();
    mod(lib, 'ui-base', { provides: { tokens: ['--ub-accent'] } }, { 'style/tokens.css': ':root { --ub-accent: #123456; }\n' });
    mod(lib, 'ui-card', { requires: ['ui-base@^1.0.0'], provides: { tokens: ['--uc-gap', '--uc-missing'] } }, {
      'style/tokens.css': ':root { --uc-gap: 8px; }\n.c { color: var(--ub-accent); margin: var(--uc-gap); padding: var(--nope-x); border: 1px solid var(--soft, gray); }\n',
      'user/card.tsx': 'export const X = 1;\n'
    });
    const r = evaluate(lib);
    expect(r.findings.filter(f => f.rule === 'token-not-defined').map(f => f.detail).join(' ')).toMatch(/--uc-missing/);
    expect(r.findings.filter(f => f.rule === 'token-undefined').map(f => f.detail).join(' ')).toMatch(/--nope-x/);
    expect(r.findings.filter(f => f.rule === 'token-undefined').map(f => f.detail).join(' ')).not.toMatch(/--soft|--ub-accent|--uc-gap/);
    fs.rmSync(lib, { recursive: true, force: true });
  });

  test('a token set from script at run time and a dynamic prefix are not undefined', () => {
    const lib = tmp();
    mod(lib, 'ui-fold', {}, {
      'style/tokens.css': ':root { --f-x: 1px; }\n.f::after { content: var(--f-more); }\n.f { color: var(--f-dyn-); }\n',
      'admin/mount.ts': "export function m(el: HTMLElement) { el.style.setProperty('--f-more', 'x'); }\n"
    });
    expect(rules(evaluate(lib))).not.toContain('token-undefined');
    fs.rmSync(lib, { recursive: true, force: true });
  });

  test('colour written outside tokens is a finding; inside tokens.css, in a comment, or as a var() fallback it is not', () => {
    const lib = tmp();
    mod(lib, 'ui-bad', {}, {
      'style/tokens.css': ':root { --b-x: #fff; }\n',
      'style/components.css': '.a { color: var(--b-x, #fff); }\n.b { background: #ff0000; }\n/* #000 in a comment */\n',
      'user/view.tsx': "export const s = { background: 'rgb(1, 2, 3)' };\nexport const t = 'no colour here #1';\n"
    });
    const r = evaluate(lib);
    const where = r.findings.filter(f => f.rule === 'color-literal').map(f => f.where);
    expect(where).toEqual(expect.arrayContaining(['ui-bad/style/components.css:2', 'ui-bad/user/view.tsx:1']));
    expect(where).not.toContain('ui-bad/style/components.css:1');
    expect(where).not.toContain('ui-bad/user/view.tsx:2');
    fs.rmSync(lib, { recursive: true, force: true });
  });

  test('screens without style/tokens.css cannot carry their look', () => {
    const lib = tmp();
    mod(lib, 'ui-bare', {}, { 'user/page.tsx': 'export const P = 1;\n' });
    expect(rules(evaluate(lib))).toContain('screen-without-tokens');
    fs.rmSync(lib, { recursive: true, force: true });
  });

  test('text: a key in one language and missing in the other', () => {
    const lib = tmp();
    mod(lib, 'ui-text', {}, { 'text/ko.json': JSON.stringify({ a: { b: '가' } }), 'text/de.json': JSON.stringify({ a: { b: 'x', c: 'y' } }) });
    const f = evaluate(lib).findings.filter(x => x.rule === 'text-language-gap');
    expect(f).toHaveLength(1);
    expect(f[0].detail).toMatch(/a\.c/);
    expect(f[0].where).toBe('ui-text/text/ko.json');
    fs.rmSync(lib, { recursive: true, force: true });
  });

  test('tables: two owners; SQL in code on another module\'s table without requires; allowed when required', () => {
    const lib = tmp();
    mod(lib, 'ord-core', {}, { 'db/schema.sql': 'CREATE TABLE IF NOT EXISTS ord_orders (id TEXT);\n' });
    mod(lib, 'ord-twin', {}, { 'db/schema.sql': 'CREATE TABLE ord_orders (id TEXT);\n' });
    mod(lib, 'pay-desk', {}, { 'adapters/store.ts': "export const q = 'SELECT id FROM ord_orders WHERE 1';\n" });
    mod(lib, 'pay-ok', { requires: ['ord-core@^1.0.0'] }, { 'adapters/store.ts': "export const q = 'SELECT id FROM ord_orders WHERE 1';\n" });
    const r = evaluate(lib);
    expect(rules(r)).toContain('table-owner-conflict');
    const foreign = r.findings.filter(f => f.rule === 'table-foreign-access').map(f => f.where.split('/')[0]);
    expect(foreign).toContain('pay-desk');
    expect(foreign).not.toContain('pay-ok');
    fs.rmSync(lib, { recursive: true, force: true });
  });

  test('routes: the same method and path from two modules', () => {
    const lib = tmp();
    mod(lib, 'api-one', { provides: { routes: ['GET /api/things', 'POST /api/things'] } });
    mod(lib, 'api-two', { provides: { routes: ['GET /api/things', 'GET /api/other'] } });
    const f = evaluate(lib).findings.filter(x => x.rule === 'route-conflict');
    expect(f).toHaveLength(1);
    expect(f[0].detail).toMatch(/GET \/api\/things/);
    fs.rmSync(lib, { recursive: true, force: true });
  });

  test('design bridge: a screen module whose colour tokens a design assigns none of is a gap; layout tokens are not required; a mapped one is fine', () => {
    const lib = tmp();
    mod(lib, 'ui-mapped', { provides: { tokens: ['--um-bg'] } }, { 'style/tokens.css': ':root { --um-bg: #fff; }\n', 'user/a.tsx': 'export const A = 1;\n' });
    mod(lib, 'ui-loose', { provides: { tokens: ['--ul-bg', '--ul-gap'] } }, { 'style/tokens.css': ':root { --ul-bg: #eee; --ul-gap: 8px; }\n', 'user/a.tsx': 'export const A = 1;\n' });
    mod(lib, 'ui-layout', { provides: { tokens: ['--ux-wrap'] } }, { 'style/tokens.css': ':root { --ux-wrap: 960px; }\n', 'user/a.tsx': 'export const A = 1;\n' });
    mod(lib, 'design-nice', { area: 'design', provides: { tokens: ['--dn-bg'] } }, {
      'style/tokens.css': ':root { --dn-bg: #fafafa; }\n',
      'style/bridge.css': ':root { --um-bg: var(--dn-bg); }\n'
    });
    const gaps = evaluate(lib).findings.filter(f => f.rule === 'bridge-gap');
    expect(gaps).toHaveLength(1);
    expect(gaps[0].detail).toMatch(/ui-loose/);
    fs.rmSync(lib, { recursive: true, force: true });
  });

  test('order: required modules come before the modules that require them, then area, then name', () => {
    const lib = tmp();
    mod(lib, 'zeta-base', {});
    mod(lib, 'alpha-top', { requires: ['zeta-base@^1.0.0'] });
    mod(lib, 'alpha-solo', {});
    const order = auditOrder(loadLibrary(lib));
    expect(order.indexOf('zeta-base')).toBeLessThan(order.indexOf('alpha-top'));
    expect(order).toEqual(['alpha-solo', 'zeta-base', 'alpha-top']);
    fs.rmSync(lib, { recursive: true, force: true });
  });

  test('--only narrows the report to one module; main exit codes 0, 1, 4 and 2', () => {
    const lib = tmp();
    mod(lib, 'aaa-one', { requires: ['zzz-missing@^1.0.0'] });
    mod(lib, 'bbb-two', {});
    expect(evaluate(lib, ['bbb-two']).findings).toEqual([]);
    const orig = { log: console.log, error: console.error }; console.log = () => {}; console.error = () => {};
    const bad = main(['node', 'x', lib]);
    const only = main(['node', 'x', lib, '--only', 'bbb-two']);
    const empty = tmp();
    const none = main(['node', 'x', empty]);
    const usage = main(['node', 'x']);
    console.log = orig.log; console.error = orig.error;
    expect([bad, only, none, usage]).toEqual([1, 0, 4, 2]);
    fs.rmSync(lib, { recursive: true, force: true }); fs.rmSync(empty, { recursive: true, force: true });
  });
});
