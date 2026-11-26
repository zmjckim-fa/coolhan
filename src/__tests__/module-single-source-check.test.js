const fs = require('fs');
const os = require('os');
const path = require('path');
const { evaluate, scan, main } = require('../../scripts/module-single-source-check');

const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'single-'));
const put = (lib, name, rel, content) => { const p = path.join(lib, name, rel); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, content); };
const mod = (lib, name, files = {}) => {
  put(lib, name, 'module.json', JSON.stringify({ name, version: '1.0.0', area: name.split('-')[0], requires: [], provides: {}, settings: [] }));
  for (const [rel, content] of Object.entries(files)) put(lib, name, rel, content);
};
const rules = r => r.findings.map(f => f.rule);
const BODY = 'export function planThing(input) { const a = Number(input.a) || 0; const b = Number(input.b) || 0; const c = a * b + a - b; if (c > 100) { return { ok: false, code: "too_big", value: c }; } return { ok: true, value: c, rounded: Math.round(c * 100) / 100 }; }\n';

describe('module-single-source-check (one thing, one place)', () => {
  let lib;
  beforeEach(() => { lib = tmp(); });
  afterEach(() => { fs.rmSync(lib, { recursive: true, force: true }); });

  test('a module that keeps its text in keys, its values once and its colours in tokens passes', () => {
    mod(lib, 'shop-list', {
      'core/index.ts': "export const STATES = ['open', 'paid', 'closed'] as const\nexport const labelKey = (s: string) => `shop.state.${s}`\n",
      'user/list.tsx': "import { STATES } from '../core/index.ts'\nexport const A = () => STATES.length\n",
      'style/tokens.css': ':root { --sl-bg: #fff; }\n',
    });
    const r = evaluate(lib);
    expect(r.findings).toEqual([]);
    expect(r.status).toBe('PASS');
  });

  test('a sentence a person reads, written in code, is text-literal; a thrown message and a comment are not', () => {
    mod(lib, 'shop-list', { 'core/index.ts': "// 주석은 문구가 아니다\nexport const reason = '국가를 선택해 주세요.'\nexport const f = (x: number) => { if (x < 0) throw new RangeError('음수는 안 된다') }\n" });
    const r = evaluate(lib);
    expect(rules(r)).toEqual(['text-literal']);
    expect(r.findings[0].where).toBe('shop-list/core/index.ts:2');
  });

  test('single-source-ok on the line or above exempts one line; single-source-ok-file in the first lines exempts the file', () => {
    mod(lib, 'shop-list', { 'core/a.ts': "// single-source-ok: 바깥 양식의 열 머리글\nexport const head = '주문번호'\n", 'core/b.ts': "// single-source-ok-file: 마켓 양식 자료\nexport const x = '쿠팡'\nexport const y = '네이버'\n" });
    expect(evaluate(lib).findings).toEqual([]);
  });

  test('the same value set written in two files of one module is enum-duplicate (on the later file by name); a different set is not', () => {
    mod(lib, 'shop-order', { 'core/index.ts': "export type S = 'open' | 'paid' | 'closed'\n", 'api/routes.ts': "const ok = ['closed', 'open', 'paid']\nconst other = ['a', 'b', 'c']\n" });
    const r = evaluate(lib);
    expect(rules(r)).toEqual(['enum-duplicate']);
    expect(r.findings[0].where).toBe('shop-order/core/index.ts:1');
  });

  test('the same exported function in two modules is function-copy, reported on the later module only', () => {
    mod(lib, 'aaa-owner', { 'core/index.ts': BODY });
    mod(lib, 'zzz-user', { 'core/index.ts': BODY });
    const r = evaluate(lib);
    expect(rules(r)).toEqual(['function-copy']);
    expect(r.findings[0].where.startsWith('zzz-user/')).toBe(true);
    expect(evaluate(lib, ['aaa-owner']).findings).toEqual([]);
    expect(evaluate(lib, ['zzz-user']).status).toBe('FAIL');
  });

  test('a colour written in code, a validation regex in a screen, CREATE TABLE outside db/ and process.env outside adapters/ are found', () => {
    mod(lib, 'shop-list', {
      'core/index.ts': "export const c = '#326916'\nexport const sql = 'CREATE TABLE shop_x (id TEXT)'\nexport const k = process.env.KEY\n",
      'user/form.tsx': "export const ok = (s: string) => /^[0-9]{1,9}$/.test(s)\n",
      'db/schema.sql': 'CREATE TABLE shop_y (id TEXT);\n',
      'adapters/env.ts': 'export const k = process.env.KEY\n',
      'style/tokens.css': ':root { --sl-bg: #fff; }\n',
    });
    expect(rules(evaluate(lib)).sort()).toEqual(['color-in-code', 'db-ddl-outside-db', 'env-direct', 'screen-validation']);
  });

  test('a screen that draws the admin-panels title row by hand is component-redrawn; admin-panels itself is not', () => {
    mod(lib, 'shop-desk', { 'admin/parts.tsx': 'export const H = () => <div className="ap-screen-header" />\n' });
    mod(lib, 'admin-panels', { 'admin/panels.tsx': 'export const H = () => <div className="ap-screen-header" />\n' });
    const r = evaluate(lib);
    expect(rules(r)).toEqual(['component-redrawn']);
    expect(r.findings[0].where.startsWith('shop-desk/')).toBe(true);
  });

  test('a quote inside a regex literal does not turn the rest of the line into a string', () => {
    const { strings } = scan("const a = /['\"]x/.test(s); const b = '안녕'\n");
    expect(strings.map(s => s.text)).toEqual(['안녕']);
  });

  test('test/ and docs/ are not read; no module is exit 4; a finding is exit 1', () => {
    mod(lib, 'shop-list', { 'test/a.test.ts': "export const t = '한글 문구'\n", 'docs/x.ts': "export const t = '한글 문구'\n" });
    expect(evaluate(lib).findings).toEqual([]);
    const empty = tmp();
    const quiet = fn => { const o = { log: console.log, error: console.error }; console.log = () => {}; console.error = () => {}; try { return fn(); } finally { console.log = o.log; console.error = o.error; } };
    expect(quiet(() => main(['node', 'x', empty]))).toBe(4);
    fs.rmSync(empty, { recursive: true, force: true });
    mod(lib, 'shop-bad', { 'core/index.ts': "export const r = '다시 시도해 주세요'\n" });
    expect(quiet(() => main(['node', 'x', lib]))).toBe(1);
    expect(quiet(() => main(['node', 'x']))).toBe(2);
  });
});
