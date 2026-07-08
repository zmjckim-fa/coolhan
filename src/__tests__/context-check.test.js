const { evaluate, DEFAULT_REQUIRED } = require('../../scripts/context-check');

const full = { goal: 'g', backlog: 'b', spec: 's', history: 'h', prior_artifacts: 'none (initial)' };

describe('context-check (mandatory context-ingestion gate)', () => {
  test('fresh digest covering every required source → ok', () => {
    const ev = evaluate({ run_id: 'R1', sources: full }, 'R1');
    expect(ev.ok).toBe(true);
    expect(ev.missing).toHaveLength(0);
    expect(ev.stale).toBe(false);
  });

  test('a required source missing (empty string) → not ok, named', () => {
    const ev = evaluate({ run_id: 'R1', sources: { ...full, spec: '' } }, 'R1');
    expect(ev.ok).toBe(false);
    expect(ev.missing).toEqual(['spec']);
  });

  test('a required source absent (key not present) → not ok, named', () => {
    const s = { ...full }; delete s.history;
    const ev = evaluate({ run_id: 'R1', sources: s }, 'R1');
    expect(ev.ok).toBe(false);
    expect(ev.missing).toEqual(['history']);
  });

  test('stale digest (run_id mismatch) → not ok even if all sources present', () => {
    const ev = evaluate({ run_id: 'OLD', sources: full }, 'NEW');
    expect(ev.ok).toBe(false);
    expect(ev.stale).toBe(true);
  });

  test('no run-id supplied → freshness not enforced, only coverage', () => {
    const ev = evaluate({ run_id: 'anything', sources: full }, null);
    expect(ev.stale).toBe(false);
    expect(ev.ok).toBe(true);
  });

  test('custom required list is honored', () => {
    const ev = evaluate({ run_id: 'R1', sources: { goal: 'g' } }, 'R1', ['goal']);
    expect(ev.ok).toBe(true);
  });

  test('default required list is the five ingestion sources', () => {
    expect(DEFAULT_REQUIRED).toEqual(['goal', 'backlog', 'spec', 'history', 'prior_artifacts']);
  });

  test('empty digest → all sources missing, not ok', () => {
    const ev = evaluate({}, null);
    expect(ev.ok).toBe(false);
    expect(ev.missing).toEqual(DEFAULT_REQUIRED);
  });
});
