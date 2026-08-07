const { computeWaves } = require('../../scripts/parallel-plan');

describe('parallel-plan (G9 — safe parallel execution waves)', () => {
  test('independent units with disjoint files share a wave', () => {
    const r = computeWaves([
      { id: 'U1', deps: [], files: ['a.js'] },
      { id: 'U2', deps: [], files: ['b.js'] }
    ]);
    expect(r.ok).toBe(true);
    expect(r.waves).toEqual([['U1', 'U2']]);
    expect(r.serialized).toHaveLength(0);
  });

  test('dependency forces a later wave', () => {
    const r = computeWaves([
      { id: 'U1', deps: [], files: ['a.js'] },
      { id: 'U2', deps: ['U1'], files: ['b.js'] }
    ]);
    expect(r.waves).toEqual([['U1'], ['U2']]);
  });

  test('file overlap serializes units even when deps allow parallel', () => {
    const r = computeWaves([
      { id: 'U1', deps: [], files: ['shared.js'] },
      { id: 'U2', deps: [], files: ['shared.js', 'x.js'] }
    ]);
    expect(r.ok).toBe(true);
    expect(r.waves).toEqual([['U1'], ['U2']]);
    expect(r.serialized[0]).toMatchObject({ unit: 'U2', with: 'U1', reason: 'file-overlap' });
  });

  test('unknown footprint (no files array) never parallelizes', () => {
    const r = computeWaves([
      { id: 'U1', deps: [] },
      { id: 'U2', deps: [], files: ['b.js'] }
    ]);
    expect(r.waves).toEqual([['U1'], ['U2']]);
    expect(r.serialized[0].reason).toBe('unknown-footprint');
  });

  test('cycle is a structural error, named', () => {
    const r = computeWaves([
      { id: 'U1', deps: ['U2'], files: ['a.js'] },
      { id: 'U2', deps: ['U1'], files: ['b.js'] }
    ]);
    expect(r.ok).toBe(false);
    expect(r.errors[0]).toMatch(/cycle/);
  });

  test('missing dep is a structural error, named', () => {
    const r = computeWaves([{ id: 'U1', deps: ['U9'], files: ['a.js'] }]);
    expect(r.ok).toBe(false);
    expect(r.errors[0]).toMatch(/U9/);
  });

  test('empty plan is not ok', () => {
    expect(computeWaves([]).ok).toBe(false);
  });

  test('diamond graph: parallel middle wave, single join', () => {
    const r = computeWaves([
      { id: 'A', deps: [], files: ['a.js'] },
      { id: 'B', deps: ['A'], files: ['b.js'] },
      { id: 'C', deps: ['A'], files: ['c.js'] },
      { id: 'D', deps: ['B', 'C'], files: ['d.js'] }
    ]);
    expect(r.waves).toEqual([['A'], ['B', 'C'], ['D']]);
  });
});
