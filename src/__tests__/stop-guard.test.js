const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { decide, MAX_BLOCKS } = require('../../.claude/hooks/stop-guard');

describe('stop-guard (G11 — harness-level loop enforcement)', () => {
  const base = { runActive: true, stopApproved: false, completionOk: false, blockCount: 0, maxBlocks: MAX_BLOCKS };

  test('no active CoolHan run → allow (non-CoolHan sessions untouched)', () => {
    expect(decide({ ...base, runActive: false }).action).toBe('allow');
  });

  test('active run + incomplete backlog → block with continue instruction', () => {
    const d = decide({ ...base, runId: 'r1', remaining: 'U3 todo | U4 unvalidated' });
    expect(d.action).toBe('block');
    expect(d.reason).toContain('U3 todo');
    expect(d.reason).toContain('_stop-approved.json');
  });

  test('approved stop condition → allow with the recorded reason', () => {
    const d = decide({ ...base, stopApproved: true, stopApprovedReason: 'ESCALATE: U2 max iterations' });
    expect(d.action).toBe('allow');
    expect(d.why).toContain('ESCALATE');
  });

  test('backlog complete → allow', () => {
    expect(decide({ ...base, completionOk: true }).action).toBe('allow');
  });

  test('safety valve: MAX_BLOCKS reached → allow (never traps forever)', () => {
    const d = decide({ ...base, blockCount: MAX_BLOCKS });
    expect(d.action).toBe('allow');
    expect(d.why).toContain('safety valve');
  });

  test('stop-approval beats incompleteness (genuine stop conditions win)', () => {
    expect(decide({ ...base, stopApproved: true }).action).toBe('allow');
  });

  describe('process-level (real hook invocation via stdin)', () => {
    let dir;
    beforeEach(() => {
      dir = fs.mkdtempSync(path.join(os.tmpdir(), 'stop-guard-'));
      fs.mkdirSync(path.join(dir, '_workspace'), { recursive: true });
      fs.mkdirSync(path.join(dir, 'scripts'), { recursive: true });
      fs.copyFileSync(
        path.join(__dirname, '../../scripts/completion-check.js'),
        path.join(dir, 'scripts', 'completion-check.js')
      );
    });
    afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

    const hook = path.join(__dirname, '../../.claude/hooks/stop-guard.js');
    const invoke = () => spawnSync(process.execPath, [hook], {
      cwd: dir, input: JSON.stringify({ hook_event_name: 'Stop', stop_hook_active: false }), encoding: 'utf8'
    });

    test('incomplete backlog in active run → decision block on stdout', () => {
      fs.writeFileSync(path.join(dir, '_workspace', '_run-active.json'), '{"run_id":"t1"}');
      fs.writeFileSync(path.join(dir, '_workspace', '_backlog.md'),
        '| # | Unit | Files | Verification | Status |\n|---|---|---|---|---|\n| U1 | a | f | jest (pass) | done |\n| U2 | b | f | jest | todo |\n');
      const r = invoke();
      const out = JSON.parse(r.stdout);
      expect(out.decision).toBe('block');
      expect(out.reason).toMatch(/backlog is NOT complete/);
    });

    test('no run marker → allows silently (fail-open for ordinary sessions)', () => {
      const r = invoke();
      const out = JSON.parse(r.stdout);
      expect(out.decision).toBeUndefined();
    });

    test('completed backlog → allows and retires the run marker', () => {
      const marker = path.join(dir, '_workspace', '_run-active.json');
      fs.writeFileSync(marker, '{"run_id":"t1"}');
      fs.writeFileSync(path.join(dir, '_workspace', '_backlog.md'),
        '| # | Unit | Files | Verification | Status |\n|---|---|---|---|---|\n| U1 | a | f | jest 3/3 pass | done ✅ (validated: jest 3/3) |\n');
      const r = invoke();
      const out = JSON.parse(r.stdout);
      expect(out.decision).toBeUndefined();
      expect(fs.existsSync(marker)).toBe(false);
    });
  });
});
