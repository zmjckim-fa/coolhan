const { evaluate } = require('../../scripts/trace-check');

describe('trace-check (requirements traceability gate)', () => {
  test('all requirements covered + passing → ok', () => {
    const ev = evaluate({
      feature: 'login',
      requirements: [{ id: 'R1', tests: ['T1'] }, { id: 'R2', tests: ['T2'] }],
      test_results: { T1: 'pass', T2: 'pass' }
    });
    expect(ev.ok).toBe(true);
    expect(ev.covered).toBe(2);
    expect(ev.uncovered).toHaveLength(0);
  });

  test('a requirement with no bound test → uncovered, not ok', () => {
    const ev = evaluate({
      requirements: [{ id: 'R1', tests: ['T1'] }, { id: 'R2', tests: [] }],
      test_results: { T1: 'pass' }
    });
    expect(ev.ok).toBe(false);
    expect(ev.uncovered).toEqual(['R2']);
  });

  test('a requirement whose bound test failed → failing, not ok', () => {
    const ev = evaluate({
      requirements: [{ id: 'R1', tests: ['T1'] }],
      test_results: { T1: 'fail' }
    });
    expect(ev.ok).toBe(false);
    expect(ev.failing).toEqual(['R1']);
  });

  test('a bound test with no result → not_run (untrusted), not ok', () => {
    const ev = evaluate({
      requirements: [{ id: 'R1', tests: ['T1'] }],
      test_results: {}
    });
    expect(ev.ok).toBe(false);
    expect(ev.not_run).toEqual(['R1']);
  });

  test('empty requirements → not ok (nothing proven)', () => {
    const ev = evaluate({ requirements: [], test_results: {} });
    expect(ev.ok).toBe(false);
    expect(ev.total).toBe(0);
  });

  test('multiple tests per requirement: any fail → failing', () => {
    const ev = evaluate({
      requirements: [{ id: 'R1', tests: ['T1', 'T2'] }],
      test_results: { T1: 'pass', T2: 'fail' }
    });
    expect(ev.failing).toEqual(['R1']);
    expect(ev.ok).toBe(false);
  });
});
