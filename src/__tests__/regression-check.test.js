const { evaluate } = require('../../scripts/regression-check');

describe('regression-check (full-suite regression gate)', () => {
  test('no change from baseline → ok, no regressions', () => {
    const ev = evaluate({ T1: 'pass', T2: 'pass' }, { T1: 'pass', T2: 'pass' });
    expect(ev.ok).toBe(true);
    expect(ev.regression).toHaveLength(0);
  });

  test('previously-passing test now fails → regression, not ok', () => {
    const ev = evaluate({ T1: 'pass', T2: 'fail' }, { T1: 'pass', T2: 'pass' });
    expect(ev.ok).toBe(false);
    expect(ev.regression).toEqual(['T2']);
  });

  test('new test with no baseline entry → added, not a regression', () => {
    const ev = evaluate({ T1: 'pass', T2: 'fail' }, { T1: 'pass' });
    expect(ev.ok).toBe(true);
    expect(ev.added).toEqual(['T2']);
    expect(ev.regression).toHaveLength(0);
  });

  test('pre-existing failure still failing → unaffected, not a regression', () => {
    const ev = evaluate({ T1: 'fail' }, { T1: 'fail' });
    expect(ev.ok).toBe(true);
    expect(ev.unaffected).toEqual(['T1']);
    expect(ev.regression).toHaveLength(0);
  });

  test('previously-failing test now passes → fixed', () => {
    const ev = evaluate({ T1: 'pass' }, { T1: 'fail' });
    expect(ev.ok).toBe(true);
    expect(ev.fixed).toEqual(['T1']);
  });

  test('test removed from current suite → removed, not a regression', () => {
    const ev = evaluate({}, { T1: 'pass' });
    expect(ev.ok).toBe(true);
    expect(ev.removed).toEqual(['T1']);
  });

  test('empty baseline (first run) → everything is added, ok', () => {
    const ev = evaluate({ T1: 'pass', T2: 'fail' }, {});
    expect(ev.ok).toBe(true);
    expect(ev.added.sort()).toEqual(['T1', 'T2']);
  });

  test('mixed regression + fixed + unaffected in one run', () => {
    const ev = evaluate(
      { T1: 'fail', T2: 'pass', T3: 'fail', T4: 'pass' },
      { T1: 'pass', T2: 'fail', T3: 'fail', T4: 'pass' }
    );
    expect(ev.ok).toBe(false);
    expect(ev.regression).toEqual(['T1']);
    expect(ev.fixed).toEqual(['T2']);
    expect(ev.unaffected).toEqual(['T3']);
    expect(ev.still_pass).toEqual(['T4']);
  });
});
