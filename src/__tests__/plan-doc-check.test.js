const fs = require('fs');
const os = require('os');
const path = require('path');
const { evaluate, countSuccessCriteria, main } = require('../../scripts/plan-doc-check');

function tmp() { return fs.mkdtempSync(path.join(os.tmpdir(), 'plandoc-')); }
function write(root, rel, content) {
  const p = path.join(root, rel); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, content);
}

const GOOD = [
  '# 기획서 샘플', '',
  '## 1. 제품',
  '- 한 줄 정의: 고객이 의뢰하면 사람이 만들어 납품한다',
  '- 범위 밖(하지 않는 것): 자동 납품',
  '- 성공 기준:',
  '  - 의뢰 전환율 3% 이상',
  '  - 평균 납기 5일 이하',
  '  - 수정 요청률 20% 이하', '',
  '## 2. 요구 항목 추적표',
  '| 요구 항목 | 위치 |', '|---|---|',
  '| ERD | 3장 데이터 |', '| 메뉴 구성도 | 4장 화면 |', '',
  '## 3. 데이터 지표와 분석',
  '| ID | 이름 | 설명 |', '|---|---|---|',
  '| M-1 | 전환율 | 방문 대비 의뢰 비율 |', '',
  '## 4. 화면',
  '| 화면명 | 풍선말 | 비고 |', '|---|---|---|',
  '| 로그인 | 가입한 이메일을 입력한다 | 해당 없음 |', '',
  '## 5. 비즈니스와 결제 정책', '정책 본문',
  '## 6. 법무와 약관', '약관 본문',
  '## 7. 운영과 장애 대응', '운영 본문',
  '## 8. 품질 목표와 성능', '품질 본문',
  '## 9. 납품 규격과 품질 관리', '규격 본문',
  '## 10. 알림', '알림 본문',
  '## 11. 테스트와 배포', '배포 본문',
  '## 12. 위험 관리', '위험 본문',
  '## 13. 결정 로그와 오픈 이슈',
  '- [결정필요] 환불 기한. 이유: 법무 검토 대기',
  '- [미검증] 외부 약관 변경 주기. 확인 방법: 공식 약관 페이지 확인',
  '## 14. 용어집', '용어 본문',
  '## 15. 단계 계획', 'MVP 본문', ''
].join('\n');

const rules = (r) => r.findings.map(f => f.rule);
function doc(content) { const d = tmp(); write(d, 'plan.md', content); return d; }

describe('plan-doc-check (G21 — planning document completion gate)', () => {
  test('compliant document → PASS with counted stats', () => {
    const d = doc(GOOD);
    const r = evaluate(d);
    expect(r.status).toBe('PASS');
    expect(r.stats).toMatchObject({ docs: 1, tooltips: 1, unverified: 1, decisions: 1 });
    fs.rmSync(d, { recursive: true, force: true });
  });

  test('no document → NO_DOCS, main exits 2', () => {
    const d = tmp();
    expect(evaluate(d).status).toBe('NO_DOCS');
    const orig = { log: console.log, error: console.error }; console.log = () => {}; console.error = () => {};
    const code = main(['node', 'plan-doc-check.js', d]);
    console.log = orig.log; console.error = orig.error;
    expect(code).toBe(2);
    fs.rmSync(d, { recursive: true, force: true });
  });

  test('no traceability table / blank location → no-traceability-table / trace-unlocated', () => {
    let d = doc(GOOD.replace(/\| 요구 항목 \| 위치 \|[\s\S]*?\| 메뉴 구성도 \| 4장 화면 \|/, ''));
    expect(rules(evaluate(d))).toContain('no-traceability-table');
    fs.rmSync(d, { recursive: true, force: true });
    d = doc(GOOD.replace('| 메뉴 구성도 | 4장 화면 |', '| 메뉴 구성도 |  |'));
    const f = evaluate(d).findings.find(x => x.rule === 'trace-unlocated');
    expect(f.where).toMatch(/^plan\.md:\d+$/);
    fs.rmSync(d, { recursive: true, force: true });
  });

  test('--required item absent from the trace table → trace-missing-item', () => {
    const d = doc(GOOD);
    expect(rules(evaluate(d, { required: ['ERD', '소스 복사방지'] }))).toEqual(['trace-missing-item']);
    fs.rmSync(d, { recursive: true, force: true });
  });

  test('blank table cell → table-blank-cell naming the column; 해당 없음 is accepted', () => {
    const d = doc(GOOD.replace('| 로그인 | 가입한 이메일을 입력한다 | 해당 없음 |', '| 로그인 | 가입한 이메일을 입력한다 |  |'));
    const f = evaluate(d).findings.find(x => x.rule === 'table-blank-cell');
    expect(f.detail).toMatch(/비고/);
    fs.rmSync(d, { recursive: true, force: true });
  });

  test('추후 / 미정 / TBD in a table row → deferred-marker unless the row carries [결정필요]', () => {
    let d = doc(GOOD.replace('| 해당 없음 |', '| 추후 |'));
    expect(rules(evaluate(d))).toContain('deferred-marker');
    fs.rmSync(d, { recursive: true, force: true });
    d = doc(GOOD.replace('| 해당 없음 |', '| [결정필요] 미정, 이유: 법무 대기 |'));
    expect(rules(evaluate(d))).not.toContain('deferred-marker');
    fs.rmSync(d, { recursive: true, force: true });
  });

  test('[미검증] without 확인 방법 and [결정필요] without 이유 are named', () => {
    const d = doc(GOOD.replace('. 확인 방법: 공식 약관 페이지 확인', '').replace('. 이유: 법무 검토 대기', ''));
    expect(rules(evaluate(d)).sort()).toEqual(['decision-without-reason', 'unverified-without-method']);
    fs.rmSync(d, { recursive: true, force: true });
  });

  test('풍선말 over 10 어절 → tooltip-too-long with the count; exactly 10 passes', () => {
    const long = '하나 둘 셋 넷 다섯 여섯 일곱 여덟 아홉 열 열하나';
    const ten = '하나 둘 셋 넷 다섯 여섯 일곱 여덟 아홉 열';
    let d = doc(GOOD.replace('가입한 이메일을 입력한다', long));
    const f = evaluate(d).findings.find(x => x.rule === 'tooltip-too-long');
    expect(f.detail).toMatch(/11어절/);
    fs.rmSync(d, { recursive: true, force: true });
    d = doc(GOOD.replace('가입한 이메일을 입력한다', ten));
    expect(rules(evaluate(d))).not.toContain('tooltip-too-long');
    fs.rmSync(d, { recursive: true, force: true });
  });

  test('em dash and hype words → em-dash / hype-word at file:line', () => {
    const d = doc(GOOD + '\n이 서비스는 혁신적이고 빠르다 — 정말로\n');
    const rs = evaluate(d).findings.filter(f => ['em-dash', 'hype-word'].includes(f.rule));
    expect(rs.map(f => f.rule).sort()).toEqual(['em-dash', 'hype-word']);
    expect(rs[0].where).toMatch(/^plan\.md:\d+$/);
    fs.rmSync(d, { recursive: true, force: true });
  });

  test('image link to a missing file → diagram-missing; existing file and URLs pass', () => {
    const d = doc(GOOD + '\n![ERD](erd.svg)\n![외부](https://example.com/a.png)\n');
    expect(evaluate(d).findings.filter(f => f.rule === 'diagram-missing')).toHaveLength(1);
    write(d, 'erd.svg', '<svg xmlns="http://www.w3.org/2000/svg"/>');
    expect(rules(evaluate(d))).not.toContain('diagram-missing');
    fs.rmSync(d, { recursive: true, force: true });
  });

  test('same ID with two different names across files → id-conflict naming both', () => {
    const d = doc(GOOD);
    write(d, 'other.md', ['## 화면', '| ID | 이름 |', '|---|---|', '| M-1 | 이탈률 |', ''].join('\n'));
    const f = evaluate(d).findings.find(x => x.rule === 'id-conflict');
    expect(f.detail).toMatch(/M-1/); expect(f.detail).toMatch(/전환율/); expect(f.detail).toMatch(/이탈률/);
    fs.rmSync(d, { recursive: true, force: true });
  });

  test('missing §4.2 item and fewer than 3 success criteria are named', () => {
    const d = doc(GOOD.replace('## 12. 위험 관리', '## 12. 기타').replace('  - 수정 요청률 20% 이하\n', ''));
    const r = evaluate(d);
    expect(r.findings.find(f => f.rule === 'missing-section').detail).toMatch(/위험 관리/);
    expect(r.findings.find(f => f.rule === 'success-criteria-count').detail).toMatch(/2개/);
    fs.rmSync(d, { recursive: true, force: true });
  });

  test('a heading marked 해당 없음 still satisfies its must-have item', () => {
    const d = doc(GOOD.replace('## 10. 알림', '## 10. 알림 (해당 없음: 알림 기능 없음)'));
    expect(rules(evaluate(d))).not.toContain('missing-section');
    fs.rmSync(d, { recursive: true, force: true });
  });

  test('fenced code blocks are ignored; plan-doc-check:allow exempts a line', () => {
    const d = doc(GOOD + '\n```\n혁신적 — TBD | | |\n```\n이 문장은 혁신적이다 plan-doc-check:allow\n');
    expect(evaluate(d).status).toBe('PASS');
    fs.rmSync(d, { recursive: true, force: true });
  });

  test('countSuccessCriteria counts nested bullets under the label', () => {
    const d = doc(GOOD);
    const docs = [{ rel: 'plan.md', lines: fs.readFileSync(path.join(d, 'plan.md'), 'utf8').split('\n').map((text, i) => ({ n: i + 1, text })) }];
    expect(countSuccessCriteria(docs).count).toBe(3);
    fs.rmSync(d, { recursive: true, force: true });
  });

  test('main: exit 0 PASS, exit 1 FAIL, --required and --json honoured', () => {
    const d = doc(GOOD);
    const orig = { log: console.log, error: console.error }; const out = []; console.log = (m) => out.push(m); console.error = () => {};
    const c0 = main(['node', 'plan-doc-check.js', d]);
    const c1 = main(['node', 'plan-doc-check.js', d, '--required', '존재하지 않는 항목']);
    const c2 = main(['node', 'plan-doc-check.js', d, '--json']);
    console.log = orig.log; console.error = orig.error;
    expect([c0, c1, c2]).toEqual([0, 1, 0]);
    expect(JSON.parse(out[out.length - 1]).status).toBe('PASS');
    fs.rmSync(d, { recursive: true, force: true });
  });
});
