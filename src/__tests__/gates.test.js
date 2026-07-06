const fs = require('fs');
const os = require('os');
const path = require('path');
const { runSequence, run } = require('../../scripts/gates');

const noLedger = { appendLedger: false };
const step = (name, status, reason) => ({ name, run: () => ({ status, reason }) });

describe('gates — runSequence (honest short-circuit + aggregation)', () => {
  test('all gates pass → verdict PASS', () => {
    const r = runSequence([
      step('provision', 'PASSED'), step('exec', 'PASSED'),
      step('trace', 'PASSED'), step('regression', 'PASSED')
    ], noLedger);
    expect(r.verdict).toBe('PASS');
    expect(r.gates.every(g => g.status === 'PASSED')).toBe(true);
  });

  test('provision NOT_RUN → all downstream SKIPPED, verdict NOT_RUN', () => {
    const r = runSequence([
      step('provision', 'NOT_RUN', 'missing required env: API_KEY'),
      step('exec', 'PASSED'), step('trace', 'PASSED'), step('regression', 'PASSED')
    ], noLedger);
    expect(r.verdict).toBe('NOT_RUN');
    expect(r.gates.slice(1).every(g => g.status === 'SKIPPED')).toBe(true);
  });

  test('exec FAILED → trace + regression SKIPPED, verdict FAIL', () => {
    const r = runSequence([
      step('provision', 'PASSED'), step('exec', 'FAILED', 'test: exit 1'),
      step('trace', 'PASSED'), step('regression', 'PASSED')
    ], noLedger);
    expect(r.verdict).toBe('FAIL');
    expect(r.gates.find(g => g.name === 'trace').status).toBe('SKIPPED');
    expect(r.gates.find(g => g.name === 'regression').status).toBe('SKIPPED');
  });

  test('a SKIPPED gate is NEVER reported as PASSED', () => {
    const r = runSequence([
      step('provision', 'PASSED'), step('exec', 'NOT_RUN', 'no stack'),
      step('trace', 'PASSED'), step('regression', 'PASSED')
    ], noLedger);
    const skipped = r.gates.filter(g => g.status === 'SKIPPED');
    expect(skipped.length).toBe(2);
    expect(skipped.every(g => g.status !== 'PASSED')).toBe(true);
  });

  test('downstream regression FAILED (all upstream pass) → verdict FAIL, nothing skipped', () => {
    const r = runSequence([
      step('provision', 'PASSED'), step('exec', 'PASSED'),
      step('trace', 'PASSED'), step('regression', 'FAILED', 'regression: T2')
    ], noLedger);
    expect(r.verdict).toBe('FAIL');
    expect(r.gates.some(g => g.status === 'SKIPPED')).toBe(false);
  });

  test('a gate that throws is caught as FAILED, not a crash', () => {
    const r = runSequence([
      step('provision', 'PASSED'),
      { name: 'exec', run: () => { throw new Error('boom'); } },
      step('trace', 'PASSED')
    ], noLedger);
    expect(r.gates.find(g => g.name === 'exec').status).toBe('FAILED');
    expect(r.verdict).toBe('FAIL');
    expect(r.gates.find(g => g.name === 'trace').status).toBe('SKIPPED');
  });

  test('ledger receives one entry per concrete (non-skipped) gate only', () => {
    const appended = [];
    const fakeLedger = { append: (e) => appended.push(e) };
    runSequence([
      step('provision', 'PASSED'), step('exec', 'FAILED', 'x'),
      step('trace', 'PASSED'), step('regression', 'PASSED')
    ], { ledgerImpl: fakeLedger, ledgerFile: 'ignored', runId: 'r1' });
    // provision + exec recorded; trace + regression were SKIPPED → not recorded
    expect(appended.map(e => e.gate)).toEqual(['provision', 'exec']);
    expect(appended.map(e => e.status)).toEqual(['PASS', 'FAIL']);
  });
});

describe('gates — run() real module wiring', () => {
  test('provision missing on a dir with .env.example short-circuits before exec', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gates-prov-'));
    fs.writeFileSync(path.join(dir, '.env.example'), 'REQUIRED_KEY=\n');
    // REQUIRED_KEY intentionally absent from the injected env
    const r = run(dir, { env: {}, appendLedger: false });
    expect(r.gates[0]).toMatchObject({ name: 'provision', status: 'NOT_RUN' });
    expect(r.gates.find(g => g.name === 'exec').status).toBe('SKIPPED');
    expect(r.verdict).toBe('NOT_RUN');
    fs.rmSync(dir, { recursive: true, force: true });
  });

  test('no stack + no env requirement → provision PASSED, exec NOT_RUN, downstream SKIPPED', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gates-nostack-'));
    const r = run(dir, { env: {}, appendLedger: false });
    expect(r.gates.find(g => g.name === 'provision').status).toBe('PASSED');
    expect(r.gates.find(g => g.name === 'exec').status).toBe('NOT_RUN');
    expect(r.gates.find(g => g.name === 'trace').status).toBe('SKIPPED');
    expect(r.verdict).toBe('NOT_RUN');
    fs.rmSync(dir, { recursive: true, force: true });
  });
});
