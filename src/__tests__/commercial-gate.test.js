const { evaluate, renderVerdict, CRITERIA } = require('../../scripts/commercial-gate');

// Injectable runner — no real processes/network needed for the decision-matrix tests.
const runnerFrom = table => k => ({
  id: k.id, keeper: k.keeper,
  status: table[k.id] ? 'PASS' : 'FAIL',
  exit: table[k.id] ? 0 : 1,
  tail: table[k.id] ? 'ok' : 'AssertionError: field not persisted'
});

const keeper = id => ({ id, keeper: `node ${id}.js` });

function config(criteria) {
  return { service: 'test.example', base_url: 'https://127.0.0.1:9', criteria };
}

describe('commercial-gate (G14 — 상용화 판정)', () => {
  test('all five criteria with passing keepers → READY', async () => {
    const crit = Object.fromEntries(CRITERIA.map(c => [c, [keeper(c + '-check')]]));
    const table = Object.fromEntries(CRITERIA.map(c => [c + '-check', true]));
    const r = await evaluate(config(crit), { runner: runnerFrom(table) });
    expect(r.verdict).toBe('READY');
  });

  test('one failing keeper → BLOCKED, criterion FAIL', async () => {
    const crit = Object.fromEntries(CRITERIA.map(c => [c, [keeper(c + '-check')]]));
    const table = Object.fromEntries(CRITERIA.map(c => [c + '-check', c !== 'save']));
    const r = await evaluate(config(crit), { runner: runnerFrom(table) });
    expect(r.verdict).toBe('BLOCKED');
    expect(r.criteria.save.status).toBe('FAIL');
    expect(r.criteria.items.status).toBe('PASS');
  });

  test('a criterion with no keeper is NOT_RUN and blocks READY (unmeasured ≠ passed)', async () => {
    const crit = Object.fromEntries(CRITERIA.filter(c => c !== 'design').map(c => [c, [keeper(c + '-check')]]));
    const table = Object.fromEntries(CRITERIA.map(c => [c + '-check', true]));
    const r = await evaluate(config(crit), { runner: runnerFrom(table) });
    expect(r.criteria.design.status).toBe('NOT_RUN');
    expect(r.verdict).toBe('NOT_READY');
  });

  test('FAIL outranks NOT_RUN in the verdict (BLOCKED, not NOT_READY)', async () => {
    const crit = { items: [keeper('items-check')] }; // others unmeasured
    const r = await evaluate(config(crit), { runner: runnerFrom({ 'items-check': false }) });
    expect(r.verdict).toBe('BLOCKED');
  });

  test('multiple keepers per criterion: all must pass', async () => {
    const crit = Object.fromEntries(CRITERIA.map(c => [c, [keeper(c + '-a'), keeper(c + '-b')]]));
    const table = {};
    CRITERIA.forEach(c => { table[c + '-a'] = true; table[c + '-b'] = true; });
    table['delivery-b'] = false;
    const r = await evaluate(config(crit), { runner: runnerFrom(table) });
    expect(r.criteria.delivery.status).toBe('FAIL');
    expect(r.verdict).toBe('BLOCKED');
  });

  test('production probe result is recorded (unreachable is stated, not hidden)', async () => {
    const r = await evaluate(config({}), { runner: runnerFrom({}) });
    expect(r.probe.reachable).toBe(false); // 127.0.0.1:9 — discard port
    const md = renderVerdict(r, '20260807');
    expect(md).toContain('도달 실패');
  });

  test('verdict markdown carries all three required sections + honest bounds', async () => {
    const crit = { items: [keeper('items-check')] };
    const r = await evaluate(config(crit), { runner: runnerFrom({ 'items-check': false }) });
    const md = renderVerdict(r, '20260807');
    expect(md).toContain('① 상용화 가부');
    expect(md).toContain('② 남은 차단 항목');
    expect(md).toContain('③ 측정되지 않은 칸');
    expect(md).toContain('측정값이 곧 결함은 아님'); // measurement ≠ defect rule embedded
    expect(md).toContain('NOT_RUN (통과 아님)');
  });
});
