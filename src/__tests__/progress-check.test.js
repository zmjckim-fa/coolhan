const fs = require('fs');
const os = require('os');
const path = require('path');
const { evaluate, parseLedger, main } = require('../../scripts/progress-check');

const GOOD = [
  '# PROGRESS', '',
  '목표: 주문 취소 흐름을 끝까지 구현한다', '',
  '## 작업 목록',
  '| 번호 | 이름 | 상태 | 완료 증거 | 남은 항목 |',
  '|---|---|---|---|---|',
  '| 1 | 취소 API | 완료 | jest 12/12, 커밋 a1b2c3d | - |',
  '| 2 | 취소 화면 | 진행 중 | | 버튼 상태·오류 문구 |',
  '| 3 | 환불 연동 | 대기 | | |', '',
  '## 현재 위치', '2번 — 화면 상태 구현 중', '',
  '## 가정 목록',
  '| 번호 | 가정 | 이유 |', '|---|---|---|', '| A-1 | 환불은 수동 승인 후 실행 | 문서에 자동 환불 언급 없음 |', '',
  '## 결함 목록',
  '| D-번호 | 발견한 검사 | 파일:줄 | 상태 |', '|---|---|---|---|',
  '| D-1 | C2 | src/cancel.js:40 | 닫힘 |', ''
].join('\n');

const rules = (md) => evaluate(md).findings.map(f => f.rule);

describe('progress-check (G20-A — progress ledger gate, §9/§10)', () => {
  test('well-formed ledger → PASS with summary numbers', () => {
    const r = evaluate(GOOD);
    expect(r.status).toBe('PASS');
    expect(r.summary).toEqual({ total: 3, done: 1, in_progress: ['2'], pending: ['3'], open_defects: [] });
    expect(r.goal).toMatch(/주문 취소/);
  });

  test('완료 without evidence (no test numbers / commit hash) → done-without-evidence naming the row', () => {
    const md = GOOD.replace('| 완료 | jest 12/12, 커밋 a1b2c3d | - |', '| 완료 | 다 됐음 | - |');
    const r = evaluate(md);
    expect(r.status).toBe('FAIL');
    const f = r.findings.find(x => x.rule === 'done-without-evidence');
    expect(f.where).toMatch(/^task 1 /);
  });

  test('완료 + hedge ("확인 안 됨", "대부분") → done-with-hedge (§10: that is 진행 중)', () => {
    expect(rules(GOOD.replace('jest 12/12, 커밋 a1b2c3d', 'jest 12/12 (UI는 확인 안 됨)'))).toContain('done-with-hedge');
    expect(rules(GOOD.replace('| 1 | 취소 API | 완료 |', '| 1 | 취소 API (대부분 완료) | 완료 |'))).toContain('done-with-hedge');
  });

  test('완료 with 남은 항목 filled → done-with-remaining; 진행 중 with none → in-progress-without-remaining', () => {
    expect(rules(GOOD.replace('| jest 12/12, 커밋 a1b2c3d | - |', '| jest 12/12, 커밋 a1b2c3d | 문서 갱신 |'))).toContain('done-with-remaining');
    expect(rules(GOOD.replace('| 진행 중 | | 버튼 상태·오류 문구 |', '| 진행 중 | | |'))).toContain('in-progress-without-remaining');
  });

  test('status outside {대기, 진행 중, 완료} → invalid-status (no "사실상 완료" state exists)', () => {
    expect(rules(GOOD.replace('| 3 | 환불 연동 | 대기 |', '| 3 | 환불 연동 | 거의 완료 |'))).toContain('invalid-status');
  });

  test('missing sections are each named: goal / current position / assumptions / defects', () => {
    expect(rules(GOOD.replace('목표: 주문 취소 흐름을 끝까지 구현한다', ''))).toContain('no-goal-line');
    expect(rules(GOOD.replace('## 현재 위치\n2번 — 화면 상태 구현 중\n', ''))).toContain('no-current-position');
    expect(rules(GOOD.replace('## 가정 목록', '## 메모'))).toContain('no-assumptions-section');
    expect(rules(GOOD.replace('## 결함 목록', '## 기타'))).toContain('no-defects-section');
  });

  test('current position must point at a task number that exists', () => {
    expect(rules(GOOD.replace('2번 — 화면 상태 구현 중', '9번 — 어딘가'))).toContain('position-not-in-table');
  });

  test('defect rows: D-number format, 열림/닫힘 only, open defect must name the check that found it', () => {
    expect(rules(GOOD.replace('| D-1 | C2 | src/cancel.js:40 | 닫힘 |', '| 1 | C2 | src/cancel.js:40 | 닫힘 |'))).toContain('defect-id-format');
    expect(rules(GOOD.replace('| D-1 | C2 | src/cancel.js:40 | 닫힘 |', '| D-1 | C2 | src/cancel.js:40 | 보류 |'))).toContain('defect-invalid-status');
    expect(rules(GOOD.replace('| D-1 | C2 | src/cancel.js:40 | 닫힘 |', '| D-1 |  | src/cancel.js:40 | 열림 |'))).toContain('defect-without-check');
    expect(evaluate(GOOD.replace('| D-1 | C2 | src/cancel.js:40 | 닫힘 |', '| D-1 | C2 | src/cancel.js:40 | 열림 |')).summary.open_defects).toEqual(['D-1']);
  });

  test('parseLedger accepts English labels and bold "**Goal:**"', () => {
    const md = GOOD.replace('목표: 주문 취소 흐름을 끝까지 구현한다', '**Goal:** finish the cancel flow')
      .replace('| 번호 | 이름 | 상태 | 완료 증거 | 남은 항목 |', '| # | Task | Status | Evidence | Remaining |')
      .replace('| 완료 |', '| done |').replace('| 진행 중 |', '| in-progress |').replace('| 대기 |', '| pending |');
    const L = parseLedger(md);
    expect(L.goal).toBe('finish the cancel flow');
    expect(L.tasks.map(x => x.state)).toEqual(['done', 'in-progress', 'pending']);
    expect(evaluate(md).status).toBe('PASS');
  });

  test('main: exit 0 / 1 / 2 and the missing-ledger message points at §9', () => {
    const d = fs.mkdtempSync(path.join(os.tmpdir(), 'progress-'));
    const good = path.join(d, 'PROGRESS.md'); fs.writeFileSync(good, GOOD);
    const bad = path.join(d, 'BAD.md'); fs.writeFileSync(bad, GOOD.replace('jest 12/12, 커밋 a1b2c3d', '완료함'));
    const orig = { log: console.log, error: console.error }; const errs = []; console.log = () => {}; console.error = (m) => errs.push(m);
    const c0 = main(['node', 'progress-check.js', good]);
    const c1 = main(['node', 'progress-check.js', bad]);
    const c2 = main(['node', 'progress-check.js', path.join(d, 'nope.md')]);
    console.log = orig.log; console.error = orig.error;
    expect([c0, c1, c2]).toEqual([0, 1, 2]);
    expect(errs.join('\n')).toMatch(/§9/);
    fs.rmSync(d, { recursive: true, force: true });
  });
});
