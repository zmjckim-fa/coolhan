const { evaluate, findCycle } = require('../../scripts/plan-check');

describe('plan-check (pre-dev plan/backlog quality gate)', () => {
  test('sound plan (verified, acyclic, ordered, fully covered) → ok', () => {
    const ev = evaluate({
      feature: 'x',
      requirements: ['R1', 'R2'],
      units: [
        { id: 'U1', deps: [], verifies: 'echo ok', covers: ['R1'] },
        { id: 'U2', deps: ['U1'], verifies: 'echo ok', covers: ['R2'] }
      ]
    });
    expect(ev.ok).toBe(true);
    expect(ev.no_verify).toHaveLength(0);
    expect(ev.uncovered_reqs).toHaveLength(0);
    expect(ev.cycle).toBeNull();
  });

  test('unit without verification → not ok', () => {
    const ev = evaluate({
      requirements: ['R1'],
      units: [{ id: 'U1', deps: [], verifies: '', covers: ['R1'] }]
    });
    expect(ev.ok).toBe(false);
    expect(ev.no_verify).toEqual(['U1']);
  });

  test('dependency cycle → not ok, cycle reported', () => {
    const ev = evaluate({
      requirements: ['R1'],
      units: [
        { id: 'U1', deps: ['U2'], verifies: 'echo ok', covers: ['R1'] },
        { id: 'U2', deps: ['U1'], verifies: 'echo ok', covers: [] }
      ]
    });
    expect(ev.ok).toBe(false);
    expect(ev.cycle).toEqual(['U1', 'U2', 'U1']);
  });

  test('requirement not covered by any unit → not ok', () => {
    const ev = evaluate({
      requirements: ['R1', 'R2'],
      units: [{ id: 'U1', deps: [], verifies: 'echo ok', covers: ['R1'] }]
    });
    expect(ev.ok).toBe(false);
    expect(ev.uncovered_reqs).toEqual(['R2']);
  });

  test('missing dependency (dep id does not exist) → not ok', () => {
    const ev = evaluate({
      requirements: [],
      units: [{ id: 'U1', deps: ['U99'], verifies: 'echo ok', covers: [] }]
    });
    expect(ev.ok).toBe(false);
    expect(ev.missing_deps).toEqual([{ unit: 'U1', dep: 'U99' }]);
  });

  test('dep listed after the unit that needs it → ordering violation', () => {
    const ev = evaluate({
      requirements: [],
      units: [
        { id: 'U1', deps: ['U2'], verifies: 'echo ok', covers: [] },
        { id: 'U2', deps: [], verifies: 'echo ok', covers: [] }
      ]
    });
    expect(ev.ok).toBe(false);
    expect(ev.order_violations).toEqual([{ unit: 'U1', dep: 'U2' }]);
  });

  test('covers an unknown requirement → flagged', () => {
    const ev = evaluate({
      requirements: ['R1'],
      units: [{ id: 'U1', deps: [], verifies: 'echo ok', covers: ['R1', 'R9'] }]
    });
    expect(ev.ok).toBe(false);
    expect(ev.unknown_covers).toEqual([{ unit: 'U1', req: 'R9' }]);
  });

  test('empty plan (no units) → not ok', () => {
    const ev = evaluate({ requirements: [], units: [] });
    expect(ev.ok).toBe(false);
    expect(ev.total_units).toBe(0);
  });

  test('findCycle returns null for acyclic graph', () => {
    const cycle = findCycle([
      { id: 'A', deps: [] },
      { id: 'B', deps: ['A'] }
    ]);
    expect(cycle).toBeNull();
  });
});
