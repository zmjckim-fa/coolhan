const fs = require('fs');
const os = require('os');
const path = require('path');
const { append, query, lessons } = require('../../scripts/ledger');

describe('ledger (run ledger + failure-lesson feedback)', () => {
  let file;

  beforeEach(() => {
    file = path.join(os.tmpdir(), `ledger-test-${Date.now()}-${Math.random().toString(36).slice(2)}.jsonl`);
  });

  afterEach(() => {
    if (fs.existsSync(file)) fs.unlinkSync(file);
  });

  test('append writes one JSONL line per entry', () => {
    append({ gate: 'security', status: 'FAIL', reason: 'x' }, file);
    append({ gate: 'security', status: 'PASS' }, file);
    const lines = fs.readFileSync(file, 'utf8').split('\n').filter(Boolean);
    expect(lines).toHaveLength(2);
  });

  test('append never mutates existing lines (append-only)', () => {
    append({ gate: 'a', status: 'FAIL', reason: '1' }, file);
    const before = fs.readFileSync(file, 'utf8');
    append({ gate: 'b', status: 'FAIL', reason: '2' }, file);
    const after = fs.readFileSync(file, 'utf8');
    expect(after.startsWith(before)).toBe(true);
  });

  test('append throws without required fields', () => {
    expect(() => append({}, file)).toThrow();
    expect(() => append({ gate: 'x' }, file)).toThrow();
  });

  test('query filters by gate', () => {
    append({ gate: 'security', status: 'FAIL', reason: 'x' }, file);
    append({ gate: 'plan', status: 'FAIL', reason: 'y' }, file);
    const results = query({ gate: 'security' }, file);
    expect(results).toHaveLength(1);
    expect(results[0].gate).toBe('security');
  });

  test('query filters by status', () => {
    append({ gate: 'security', status: 'FAIL', reason: 'x' }, file);
    append({ gate: 'security', status: 'PASS' }, file);
    const results = query({ status: 'FAIL' }, file);
    expect(results).toHaveLength(1);
    expect(results[0].status).toBe('FAIL');
  });

  test('query filters by unit substring', () => {
    append({ gate: 'g', status: 'FAIL', unit: 'U1-auth' }, file);
    append({ gate: 'g', status: 'FAIL', unit: 'U2-billing' }, file);
    const results = query({ unit: 'auth' }, file);
    expect(results).toHaveLength(1);
    expect(results[0].unit).toBe('U1-auth');
  });

  test('query on missing file returns empty array', () => {
    expect(query({}, file)).toEqual([]);
  });

  test('lessons surfaces a (gate, reason) pair recurring >= minCount', () => {
    append({ run_id: 'r1', unit: 'U1', gate: 'security', status: 'FAIL', reason: 'hardcoded key' }, file);
    append({ run_id: 'r2', unit: 'U2', gate: 'security', status: 'FAIL', reason: 'hardcoded key' }, file);
    const found = lessons(2, file);
    expect(found).toHaveLength(1);
    expect(found[0]).toMatchObject({ gate: 'security', reason: 'hardcoded key', count: 2 });
  });

  test('lessons does NOT surface a (gate, reason) pair occurring only once', () => {
    append({ run_id: 'r1', unit: 'U1', gate: 'security', status: 'FAIL', reason: 'hardcoded key' }, file);
    append({ run_id: 'r2', unit: 'U2', gate: 'plan', status: 'FAIL', reason: 'cyclic dep' }, file);
    const found = lessons(2, file);
    expect(found).toHaveLength(0);
  });

  test('lessons ignores PASS entries', () => {
    append({ gate: 'security', status: 'PASS' }, file);
    append({ gate: 'security', status: 'PASS' }, file);
    const found = lessons(2, file);
    expect(found).toHaveLength(0);
  });

  test('lessons sorts by count descending', () => {
    append({ gate: 'a', status: 'FAIL', reason: 'r1' }, file);
    append({ gate: 'a', status: 'FAIL', reason: 'r1' }, file);
    append({ gate: 'a', status: 'FAIL', reason: 'r1' }, file);
    append({ gate: 'b', status: 'FAIL', reason: 'r2' }, file);
    append({ gate: 'b', status: 'FAIL', reason: 'r2' }, file);
    const found = lessons(2, file);
    expect(found[0].count).toBe(3);
    expect(found[1].count).toBe(2);
  });
});
