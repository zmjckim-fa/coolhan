const fs = require('fs');
const os = require('os');
const path = require('path');
const { load, validate, applicable, render, check, main, DEFAULT_REGISTRY, DEFAULT_DOC } = require('../../scripts/field-lessons');
const planDoc = require('../../scripts/plan-doc-check');

function tmp() { return fs.mkdtempSync(path.join(os.tmpdir(), 'lessons-')); }
function write(root, rel, content) {
  const p = path.join(root, rel); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, content);
}
const quiet = (fn) => { const o = { log: console.log, error: console.error }; console.log = () => {}; console.error = () => {}; try { return fn(); } finally { console.log = o.log; console.error = o.error; } };

const REG = {
  doc: { title: 'T', h_fail: 'FAIL', h_win: 'WIN', h_agents: 'AGENTS', h_detect: 'DETECT', e_plan: 'plan', e_detect: 'scan', e_gate: 'gate', columns: { id: 'ID' } },
  lessons: [
    { id: 'F-01', kind: 'fail', title: 'swallowed error', what: 'w', cause: 'c', prevent: 'p', tags: ['all'], owner: ['developer'], sources: ['P1'], seen: 1, plan: false,
      detect: { ext: 'code', multiline: true, pattern: '\\.catch\\(\\s*\\(\\s*\\)\\s*=>\\s*\\{\\s*\\}\\s*\\)', hint: 'rethrow' } },
    { id: 'F-02', kind: 'fail', title: 'display differs from charge', what: 'w', cause: 'c', prevent: 'server computes', tags: ['money'], owner: ['spec-writer', 'developer'], sources: ['P1', 'P2'], seen: 2, plan: true },
    { id: 'F-03', kind: 'fail', title: 'never executed', what: 'w', cause: 'c', prevent: 'capture a run', tags: ['all'], owner: ['validator'], sources: ['P3'], seen: 1, plan: true },
    { id: 'F-04', kind: 'fail', title: 'skipped tests', what: 'w', cause: 'c', prevent: 'p', tags: ['all'], owner: ['qa-tester'], sources: ['P4'], seen: 1, plan: false,
      detect: { ext: 'code', tests: true, pattern: '\\bit\\.skip\\(' } },
    { id: 'F-05', kind: 'fail', title: 'stale ledger', what: 'w', cause: 'c', prevent: 'p', tags: ['all'], owner: ['self-auditor'], sources: ['P5'], seen: 1, plan: false, gate: 'progress-check' },
    { id: 'W-01', kind: 'win', title: 'incident becomes a check', what: 'w', why: 'y', apply: 'add a detector', tags: ['all'], owner: ['validator'], sources: ['P1'], seen: 1 }
  ],
  modules: [{ id: 'B01', name: 'accounts', what: 'sign-up', maturity: 'spec' }]
};
const clone = (o) => JSON.parse(JSON.stringify(o));
const rulesOf = (r) => r.findings.map(f => f.rule);

describe('field-lessons (G22 — lesson registry: validate, derive, list, scan)', () => {
  test('the shipped registry is valid and the shipped KB doc is exactly the derived one', () => {
    const reg = load(DEFAULT_REGISTRY);
    const v = validate(reg);
    expect(v.findings).toEqual([]);
    expect(v.count).toBeGreaterThanOrEqual(40);
    expect(fs.readFileSync(DEFAULT_DOC, 'utf8').replace(/\r\n/g, '\n')).toBe(render(reg));
  });

  test('validate: a well-formed registry passes', () => {
    expect(validate(REG).status).toBe('PASS');
  });

  test('validate names: bad id, duplicate id, kind/prefix mismatch, missing field, bad detector regex', () => {
    const r = clone(REG);
    r.lessons[0].id = 'X1';
    r.lessons[2].id = 'F-02';
    r.lessons[5].kind = 'fail';
    r.lessons[1].prevent = '';
    r.lessons[3].detect.pattern = '([';
    const got = rulesOf(validate(r));
    for (const rule of ['lesson-id-format', 'lesson-id-duplicate', 'lesson-kind', 'lesson-field-missing', 'lesson-detect-invalid']) expect(got).toContain(rule);
  });

  test('validate: a fail lesson with no plan, gate or detector is unenforced; an e-mail or URL is private data', () => {
    const r = clone(REG);
    delete r.lessons[4].gate;
    r.lessons[1].what = 'mail ops@example.com about it';
    r.lessons[2].cause = 'see https://example.com/incident';
    const v = validate(r);
    expect(v.findings.filter(f => f.rule === 'lesson-unenforced').map(f => f.where)).toEqual(['F-05']);
    expect(v.findings.filter(f => f.rule === 'lesson-private-data').map(f => f.where)).toEqual(['F-02', 'F-03']);
  });

  test('applicable: with tags, `all` always applies and others only when asked; without tags nothing is filtered (D-10)', () => {
    expect(applicable(REG, { kind: 'fail', tags: [] }).map(l => l.id)).toEqual(['F-01', 'F-03', 'F-04', 'F-05']);
    expect(applicable(REG, { kind: 'fail' }).map(l => l.id)).toEqual(['F-01', 'F-02', 'F-03', 'F-04', 'F-05']);
    expect(applicable(REG, { owner: 'spec-writer' }).map(l => l.id)).toEqual(['F-02']);
    expect(applicable(REG, { kind: 'fail', tags: ['money'] }).map(l => l.id)).toContain('F-02');
    expect(applicable(REG, { owner: 'validator' }).map(l => l.id)).toEqual(['F-03', 'W-01']);
  });

  test('render is deterministic, lists every lesson, the enforcement column and the module catalog', () => {
    const md = render(REG);
    expect(md).toBe(render(clone(REG)));
    for (const l of REG.lessons) expect(md).toContain(l.id);
    expect(md).toMatch(/F-05[^\n]*gate: progress-check/);
    expect(md).toMatch(/F-02[^\n]*\| plan \|/);
    expect(md).toContain('| B01 | accounts | sign-up | spec |');
  });

  test('check: a detector fires with file:line, test files are scanned only when the detector says so', () => {
    const d = tmp();
    write(d, 'src/pay.js', 'async function pay() {\n  await save().catch(() => {});\n}\n');
    write(d, 'src/pay.test.js', "it.skip('pays', () => {});\nconst x = load().catch(() => {});\n"); // field-lessons:allow (fixture text)
    const r = check(d, REG);
    expect(r.status).toBe('FAIL');
    expect(r.findings.map(f => `${f.rule}@${f.where}`).sort()).toEqual(['F-01@src/pay.js:2', 'F-04@src/pay.test.js:1']);
    fs.rmSync(d, { recursive: true, force: true });
  });

  test('check: clean project PASS; field-lessons:allow exempts a line; only/skip path filters are honoured', () => {
    const d = tmp();
    write(d, 'src/a.js', 'module.exports = 1;\n');
    write(d, 'src/b.js', 'x().catch(() => {}); // field-lessons:allow (best-effort telemetry)\n');
    expect(check(d, REG).status).toBe('PASS');
    const reg = clone(REG);
    reg.lessons[0].detect.only = '(^|/)billing/';
    write(d, 'src/c.js', 'y().catch(() => {});\n');
    expect(check(d, reg).status).toBe('PASS');
    write(d, 'billing/d.js', 'z().catch(() => {});\n');
    expect(check(d, reg).findings.map(f => f.where)).toEqual(['billing/d.js:1']);
    fs.rmSync(d, { recursive: true, force: true });
  });

  test('check: nothing scanned is NOT_RUN, never PASS (field lesson F-10)', () => {
    const d = tmp();
    expect(check(d, REG).status).toBe('NOT_RUN');                              // empty project
    write(d, 'src/a.js', 'module.exports = 1;\n');
    expect(check(d, { lessons: REG.lessons.filter(l => !l.detect) }).status).toBe('NOT_RUN');   // no detector applies
    fs.rmSync(d, { recursive: true, force: true });
  });

  test('check ratchet: baseline hits pass, a new hit fails, removing one passes', () => {
    const d = tmp();
    write(d, 'src/old.js', 'a().catch(() => {});\n');
    const first = check(d, REG);
    const baseline = { counts: first.counts, hits: first.hits };
    expect(check(d, REG, { baseline }).status).toBe('PASS');
    write(d, 'src/new.js', 'b().catch(() => {});\n');
    const grown = check(d, REG, { baseline });
    expect(grown.status).toBe('FAIL');
    expect(grown.findings.map(f => f.where)).toEqual(['src/new.js:1']);
    fs.unlinkSync(path.join(d, 'src/new.js'));
    write(d, 'src/old.js', 'a();\n');
    expect(check(d, REG, { baseline }).status).toBe('PASS');
    fs.rmSync(d, { recursive: true, force: true });
  });

  test('main: exit codes 0 / 1 / 4 / 2, render --check detects a hand-edited doc', () => {
    const d = tmp();
    const regFile = path.join(d, 'reg.json'); fs.writeFileSync(regFile, JSON.stringify(REG));
    const doc = path.join(d, 'LESSONS.md');
    write(d, 'app/src/pay.js', 'p().catch(() => {});\n');
    const codes = quiet(() => ({
      validate: main(['node', 'x', 'validate', regFile]),
      render: main(['node', 'x', 'render', regFile, '--out', doc]),
      fresh: main(['node', 'x', 'render', regFile, '--out', doc, '--check']),
      list: main(['node', 'x', 'list', regFile, '--owner', 'developer']),
      fail: main(['node', 'x', 'check', path.join(d, 'app'), '--registry', regFile]),
      notRun: main(['node', 'x', 'check', path.join(d, 'empty-dir-made-below'), '--registry', regFile]),
      usage: main(['node', 'x', 'nope'])
    }));
    expect(codes).toEqual({ validate: 0, render: 0, fresh: 0, list: 0, fail: 1, notRun: 2, usage: 2 });
    fs.mkdirSync(path.join(d, 'empty'));
    expect(quiet(() => main(['node', 'x', 'check', path.join(d, 'empty'), '--registry', regFile]))).toBe(4);
    fs.appendFileSync(doc, '\nhand edit\n');
    expect(quiet(() => main(['node', 'x', 'render', regFile, '--out', doc, '--check']))).toBe(1);
    fs.rmSync(d, { recursive: true, force: true });
  });
});

describe('plan-doc-check --lessons (G22 — the 기획서 must answer every applicable failure pattern)', () => {
  const PLAN = [
    '# 기획서', '', '교훈 태그: money', '',
    '## 실패 방지 대응표',
    '| 교훈 ID | 방지책 | 검증 방법 |', '|---|---|---|',
    '| F-02 | 금액은 서버가 요율 표에서 계산 | 수량 1/2/6 표시=청구 시험 |',
    '| F-03 | 단위마다 실제 경로 실행 캡처 | 완료 증거에 실행 로그 |', ''
  ].join('\n');
  const lessonFindings = (md, opts) => {
    const d = tmp(); write(d, 'plan.md', md);
    const r = planDoc.evaluate(d, { lessons: REG, ...opts });
    fs.rmSync(d, { recursive: true, force: true });
    return r;
  };

  test('every applicable plan:true lesson answered → no lesson finding; tags come from the plan line', () => {
    const r = lessonFindings(PLAN);
    expect(rulesOf(r).filter(x => /lesson/.test(x))).toEqual([]);
    expect([r.stats.lessons_required, r.stats.lessons_answered]).toEqual([2, 2]);
  });

  test('a missing row is named with the lesson id and title', () => {
    const r = lessonFindings(PLAN.replace('| F-03 | 단위마다 실제 경로 실행 캡처 | 완료 증거에 실행 로그 |\n', ''));
    const f = r.findings.filter(x => x.rule === 'lesson-unanswered');
    expect(f).toHaveLength(1);
    expect(f[0].detail).toMatch(/F-03/); expect(f[0].detail).toMatch(/never executed/);
  });

  test('no 대응표 at all → no-lesson-table listing the ids; an untagged plan owes only the `all` lessons', () => {
    const none = lessonFindings('# 기획서\n\n교훈 태그: money\n');
    const f = none.findings.find(x => x.rule === 'no-lesson-table');
    expect(f.detail).toMatch(/F-02/); expect(f.detail).toMatch(/F-03/);
    const untagged = lessonFindings(PLAN.replace('교훈 태그: money\n', ''));
    expect(untagged.stats.lessons_required).toBe(1);
  });

  test('lessons enforced by a detector or a gate (plan:false) are not owed in the plan; without --lessons nothing is owed', () => {
    const r = lessonFindings(PLAN);
    expect(r.findings.some(f => /F-01|F-04|F-05/.test(f.detail))).toBe(false);
    const d = tmp(); write(d, 'plan.md', '# 기획서\n');
    expect(rulesOf(planDoc.evaluate(d)).filter(x => /lesson/.test(x))).toEqual([]);
    fs.rmSync(d, { recursive: true, force: true });
  });
});
