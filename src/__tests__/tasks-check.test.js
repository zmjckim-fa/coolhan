const { parseTasks, evaluate, normalizeStatus } = require('../../scripts/tasks-check');

const ALL_VERIFIED = `
| ID | Task  | Status   | Verifies |
|----|-------|----------|----------|
| T1 | login | verified | npm test -- login |
| T2 | out   | verified | npm test -- out |
`;

const WITH_BLOCKED = `
| ID | Task    | Status   | Verifies |
|----|---------|----------|----------|
| T1 | login   | verified | npm test |
| T2 | payment | blocked  | needs API key |
`;

const KOREAN_LABELS = `
| ID | Task  | Status    | Verifies |
|----|-------|-----------|----------|
| T1 | login | 구현 완료 | npm test |
| T2 | out   | 미착수    | - |
`;

describe('tasks-check (5-state Auto-Pilot task gate)', () => {
  test('normalizeStatus accepts English and Korean labels', () => {
    expect(normalizeStatus('verified')).toBe('verified');
    expect(normalizeStatus('검증 완료')).toBe('verified');
    expect(normalizeStatus('차단됨')).toBe('blocked');
    expect(normalizeStatus('nonsense')).toBeNull();
  });

  test('all-verified table -> ok', () => {
    const units = parseTasks(ALL_VERIFIED);
    expect(units).toHaveLength(2);
    const ev = evaluate(units);
    expect(ev.ok).toBe(true);
    expect(ev.verified).toBe(2);
  });

  test('a blocked unit -> not ok, named', () => {
    const ev = evaluate(parseTasks(WITH_BLOCKED));
    expect(ev.ok).toBe(false);
    expect(ev.blocked).toEqual(['T2']);
  });

  test('implemented (not verified) -> not ok, named as unverified', () => {
    const units = parseTasks(KOREAN_LABELS);
    const ev = evaluate(units);
    expect(ev.ok).toBe(false);
    expect(ev.unverified).toEqual(['T1']);
    expect(ev.remaining).toEqual(['T2']);
  });

  test('empty table -> not ok (nothing proven)', () => {
    const ev = evaluate([]);
    expect(ev.ok).toBe(false);
    expect(ev.total).toBe(0);
  });
});
