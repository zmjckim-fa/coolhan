const fs = require('fs');
const os = require('os');
const path = require('path');
const { measure, evaluate, extractFunctions, main } = require('../../scripts/single-source-check');

function tmp() { return fs.mkdtempSync(path.join(os.tmpdir(), 'single-')); }
function write(root, rel, content) {
  const p = path.join(root, rel); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, content);
}
const HELPER = [
  'function slugify(input) {',
  '  const base = String(input || "").toLowerCase().trim();',
  '  return base.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");',
  '}', ''
].join('\n');

function cleanApp() {
  const d = tmp();
  write(d, 'lib/text.js', HELPER + 'module.exports = { slugify };\n');
  write(d, 'app/products.js', "const { slugify } = require('../lib/text');\nconst { t } = require('../i18n/ko');\nmodule.exports = (p) => ({ slug: slugify(p.name), label: t('product.label') });\n");
  write(d, 'i18n/ko.js', "const M = { 'product.label': '상품 이름을 입력해 주세요' };\nmodule.exports = { t: (k) => M[k] };\n");
  write(d, 'views/product.html', '<div class="card"><h1 class="title">x</h1></div>\n');
  return d;
}

describe('single-source-check (G20-C — minimal source / single source of truth, §0 §1 §2 §4)', () => {
  test('clean app → PASS (strict) with numbers only', () => {
    const d = cleanApp();
    const r = evaluate(d);
    expect(r.status).toBe('PASS');
    expect(r.counts).toEqual({ files: 4, max_file_lines: expect.any(Number), duplicate_helpers: 0, inline_styles: 0, hardcoded_sentences: 0, target_literals: 0 });
    fs.rmSync(d, { recursive: true, force: true });
  });

  test('same helper body copied into a second file → duplicate-helper naming both locations (§0 중복 0)', () => {
    const d = cleanApp();
    write(d, 'app/orders.js', HELPER + 'module.exports = { slugify };\n');
    const r = evaluate(d);
    expect(r.status).toBe('FAIL');
    const f = r.findings.find(x => x.rule === 'duplicate-helper');
    expect(f.where).toMatch(/app\/orders\.js:1/); expect(f.where).toMatch(/lib\/text\.js:1/);
    fs.rmSync(d, { recursive: true, force: true });
  });

  test('same NAME but different body is not a duplicate (main/evaluate in every script are fine)', () => {
    const d = cleanApp();
    write(d, 'app/other.js', 'function slugify(x) {\n  const out = [];\n  for (const ch of String(x)) if (/[a-z0-9]/i.test(ch)) out.push(ch.toLowerCase()); else out.push("-");\n  return out.join("");\n}\nmodule.exports = { slugify };\n');
    expect(evaluate(d).findings.map(f => f.rule)).not.toContain('duplicate-helper');
    fs.rmSync(d, { recursive: true, force: true });
  });

  test('inline style in markup → inline-style (S1: screens use class names only)', () => {
    const d = cleanApp();
    write(d, 'views/promo.html', '<div style="color: #ff0000; padding: 4px">sale</div>\n');
    const f = evaluate(d).findings.find(x => x.rule === 'inline-style');
    expect(f.where).toBe('views/promo.html:1');
    fs.rmSync(d, { recursive: true, force: true });
  });

  test('human-language sentence hardcoded in code → hardcoded-sentence; the same text inside i18n/ is exempt (S2)', () => {
    const d = cleanApp();
    write(d, 'app/checkout.js', "module.exports = () => { throw new Error('결제 수단을 선택해 주세요'); };\n");
    write(d, 'app/mail.js', "module.exports = () => 'Your order has been shipped and will arrive soon';\n");
    const r = evaluate(d);
    const where = r.findings.filter(x => x.rule === 'hardcoded-sentence').map(x => x.where);
    expect(where).toEqual(expect.arrayContaining(['app/checkout.js:1', 'app/mail.js:1']));
    expect(where.some(w => w.startsWith('i18n/'))).toBe(false);
    fs.rmSync(d, { recursive: true, force: true });
  });

  test('code-like strings (paths, URLs, identifiers, keys) are not sentences', () => {
    const d = cleanApp();
    write(d, 'app/paths.js', "module.exports = ['https://api.example.com/v1/orders', 'src/lib/text.js', 'ORDER_CREATED', 'product.label.long.key', '--write-baseline'];\n");
    expect(evaluate(d).findings.map(f => f.rule)).not.toContain('hardcoded-sentence');
    fs.rmSync(d, { recursive: true, force: true });
  });

  test('--targets: an external target name as a code literal outside registry dirs → target-literal (S3/S4)', () => {
    const d = cleanApp();
    write(d, 'registry/ebay.js', "module.exports = { id: 'ebay', maxTitle: 80 };\n");
    write(d, 'app/upload.js', "module.exports = (m) => m === 'ebay' ? 80 : 60;\n");
    const r = evaluate(d, { targets: ['ebay', 'amazon'] });
    const f = r.findings.filter(x => x.rule === 'target-literal');
    expect(f.map(x => x.where)).toEqual(['app/upload.js:1']);
    fs.rmSync(d, { recursive: true, force: true });
  });

  test('ratchet mode: existing findings in the baseline pass, a NEW duplicate or a grown count fails', () => {
    const d = cleanApp();
    write(d, 'app/orders.js', HELPER + 'module.exports = { slugify };\n');              // legacy duplicate
    const baseline = measure(d);
    expect(baseline.counts.duplicate_helpers).toBe(1);
    expect(evaluate(d, { baseline }).status).toBe('PASS');                               // unchanged → PASS
    write(d, 'app/mail.js', "module.exports = () => 'Your order has been shipped and will arrive soon';\n");
    const grown = evaluate(d, { baseline });
    expect(grown.status).toBe('FAIL');
    expect(grown.findings.map(f => f.rule)).toContain('hardcoded-sentence-grew');
    fs.rmSync(d, { recursive: true, force: true });
  });

  test('ratchet mode: fixing in place is PASS (old code migrates when touched, §4-d)', () => {
    const d = cleanApp();
    write(d, 'app/orders.js', HELPER + 'module.exports = { slugify };\n');
    const baseline = measure(d);
    write(d, 'app/orders.js', "const { slugify } = require('../lib/text');\nmodule.exports = { slugify };\n");   // duplicate removed, file kept
    const r = evaluate(d, { baseline });
    expect(r.status).toBe('PASS');
    expect(r.counts.duplicate_helpers).toBe(0);
    fs.rmSync(d, { recursive: true, force: true });
  });

  test('ratchet mode: a smaller scanned set is scan-scope-shrunk until explicitly accepted (field lesson F-23)', () => {
    const d = cleanApp();
    write(d, 'app/orders.js', HELPER + 'module.exports = { slugify };\n');
    const baseline = measure(d);
    fs.unlinkSync(path.join(d, 'app/orders.js'));                       // the number fell because the file left the scan
    const r = evaluate(d, { baseline });
    expect(r.status).toBe('FAIL');
    expect(r.findings.map(f => f.rule)).toEqual(['scan-scope-shrunk']);
    expect(evaluate(d, { baseline, allowScopeShrink: true }).status).toBe('PASS');
    fs.rmSync(d, { recursive: true, force: true });
  });

  test('main: an empty project is NOT_RUN (exit 4), never PASS (field lesson F-10)', () => {
    const d = tmp();
    const orig = { log: console.log, error: console.error }; console.log = () => {}; console.error = () => {};
    const code = main(['node', 'single-source-check.js', d]);
    console.log = orig.log; console.error = orig.error;
    expect(code).toBe(4);
    fs.rmSync(d, { recursive: true, force: true });
  });

  test('single-source-check:allow on a line exempts it (quoted example / detector table)', () => {
    const d = cleanApp();
    write(d, 'app/example.js', "const sample = 'This sentence is only an example'; // single-source-check:allow\nmodule.exports = sample;\n");
    expect(evaluate(d).status).toBe('PASS');
    fs.rmSync(d, { recursive: true, force: true });
  });

  test('extractFunctions handles brace languages and indentation languages', () => {
    const js = extractFunctions(HELPER.split('\n'), 'js');
    expect(js).toHaveLength(1); expect(js[0].name).toBe('slugify');
    const py = extractFunctions(['def slugify(s):', '    base = str(s or "").lower().strip()', '    return re.sub(r"[^a-z0-9]+", "-", base).strip("-")', '', 'x = 1'], 'py');
    expect(py).toHaveLength(1); expect(py[0].name).toBe('slugify');
  });

  test('--skip-dirs excludes a directory name from the walk (research/deliverable folders that are not project source)', () => {
    const d = cleanApp();
    write(d, 'docs/research/a.js', HELPER + 'module.exports = { slugify };\n');
    expect(measure(d).counts.duplicate_helpers).toBe(1);
    expect(measure(d, { skipDirs: ['docs'] }).counts.duplicate_helpers).toBe(0);
    fs.rmSync(d, { recursive: true, force: true });
  });

  test('main: --measure exit 0, strict FAIL exit 1, --write-baseline then --baseline PASS exit 0', () => {
    const d = cleanApp();
    write(d, 'app/orders.js', HELPER + 'module.exports = { slugify };\n');
    const orig = { log: console.log, error: console.error }; console.log = () => {}; console.error = () => {};
    const m = main(['node', 'single-source-check.js', d, '--measure']);
    const strict = main(['node', 'single-source-check.js', d]);
    const wb = main(['node', 'single-source-check.js', d, '--write-baseline', '--baseline', path.join(d, 'docs', 'BASE.json')]);
    const ratchet = main(['node', 'single-source-check.js', d, '--baseline', path.join(d, 'docs', 'BASE.json')]);
    console.log = orig.log; console.error = orig.error;
    expect([m, strict, wb, ratchet]).toEqual([0, 1, 0, 0]);
    expect(JSON.parse(fs.readFileSync(path.join(d, 'docs', 'BASE.json'), 'utf8')).counts.duplicate_helpers).toBe(1);
    fs.rmSync(d, { recursive: true, force: true });
  });
});
