const fs = require('fs');
const os = require('os');
const path = require('path');
const { step, loadState, saveState, runVerify } = require('../../scripts/agent-loop');

const obs = (exit, extra = {}) => ({
  exit, timed_out: false, duration_ms: 10,
  stdout_tail: extra.stdout || '', stderr_tail: extra.stderr || ''
});

describe('agent-loop (G10 — agent loop / feedback loop / long-running state)', () => {
  test('passing observation → DONE on first iteration', () => {
    const state = { units: {} };
    const r = step(state, 'U1', obs(0), 5);
    expect(r).toMatchObject({ verdict: 'DONE', iteration: 1 });
    expect(state.units.U1.status).toBe('done');
  });

  test('failing observation → ITERATE with feedback recorded', () => {
    const state = { units: {} };
    const r = step(state, 'U1', obs(1, { stderr: 'AssertionError: expected 200 got 500' }), 5);
    expect(r.verdict).toBe('ITERATE');
    const it = state.units.U1.iterations[0];
    expect(it.passed).toBe(false);
    expect(it.feedback.stderr_tail).toContain('AssertionError');
  });

  test('feedback loop: failures accumulate, then a pass ends the loop', () => {
    const state = { units: {} };
    step(state, 'U1', obs(1, { stderr: 'fail A' }), 5);
    step(state, 'U1', obs(1, { stderr: 'fail B' }), 5);
    const r = step(state, 'U1', obs(0), 5);
    expect(r).toMatchObject({ verdict: 'DONE', iteration: 3 });
    expect(state.units.U1.iterations.map(i => i.passed)).toEqual([false, false, true]);
  });

  test('max iterations exhausted → ESCALATE, never silent', () => {
    const state = { units: {} };
    step(state, 'U1', obs(1), 2);
    const r = step(state, 'U1', obs(1), 2);
    expect(r.verdict).toBe('ESCALATE');
    expect(state.units.U1.status).toBe('escalated');
  });

  test('long-running: state survives save/load round-trip and resumes at N+1', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-loop-test-'));
    const file = path.join(dir, 'loop-state.json');
    const s1 = { units: {} };
    step(s1, 'U1', obs(1, { stderr: 'session-1 failure' }), 5);
    saveState(file, s1);

    const s2 = loadState(file); // "new session"
    const r = step(s2, 'U1', obs(1, { stderr: 'session-2 failure' }), 5);
    expect(r.iteration).toBe(2); // resumed, not restarted
    expect(s2.units.U1.iterations[0].feedback.stderr_tail).toContain('session-1');
    fs.rmSync(dir, { recursive: true, force: true });
  });

  test('a unit already done stays done (idempotent re-entry)', () => {
    const state = { units: {} };
    step(state, 'U1', obs(0), 5);
    const r = step(state, 'U1', obs(1), 5);
    expect(r.verdict).toBe('DONE');
    expect(state.units.U1.iterations).toHaveLength(1);
  });

  test('units are independent (parallel-wave safe bookkeeping)', () => {
    const state = { units: {} };
    step(state, 'U1', obs(1), 5);
    const r = step(state, 'U2', obs(0), 5);
    expect(r.verdict).toBe('DONE');
    expect(state.units.U1.status).toBe('in-loop');
  });

  test('escalated unit is terminal — re-entry adds no extra iterations', () => {
    const state = { units: {} };
    step(state, 'U1', obs(1), 1); // escalates at max=1
    const r = step(state, 'U1', obs(1), 1);
    expect(r.verdict).toBe('ESCALATE');
    expect(r.note).toMatch(/reset required/);
    expect(state.units.U1.iterations).toHaveLength(1);
  });

  test('runVerify captures a real process exit and output (C10 no-simulation)', () => {
    const r = runVerify('node -e "console.error(\'boom\'); process.exit(7)"', '.');
    expect(r.exit).toBe(7);
    expect(r.stderr_tail).toContain('boom');
  });
});
