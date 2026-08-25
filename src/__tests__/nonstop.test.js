const fs = require('fs');
const os = require('os');
const path = require('path');
const { supervise, EXIT } = require('../../scripts/nonstop');

const HEADER = '| # | Unit | Files | Verification | Status |\n|---|---|---|---|---|\n';
const row = (id, status) => `| ${id} | x | f | jest 1/1 pass | ${status} |\n`;

describe('nonstop (G13 — outer supervisor loop for true non-stop development)', () => {
  let ws;
  beforeEach(() => { ws = fs.mkdtempSync(path.join(os.tmpdir(), 'nonstop-')); });
  afterEach(() => { fs.rmSync(ws, { recursive: true, force: true }); });

  const opts = extra => ({ workspace: ws, maxSessions: 10, resumePrompt: 'resume', cmdTemplate: 'unused', ...extra });

  function writeBacklog(units) {
    fs.writeFileSync(path.join(ws, '_backlog.md'), HEADER + units.map(u => row(u.id, u.status)).join(''));
  }

  test('sessions progress the backlog → COMPLETE, session count reported', () => {
    writeBacklog([{ id: 'U1', status: 'todo' }, { id: 'U2', status: 'todo' }]);
    let calls = 0;
    const runner = () => { // each "session" finishes one unit
      calls++;
      if (calls === 1) writeBacklog([{ id: 'U1', status: 'done ✅' }, { id: 'U2', status: 'todo' }]);
      else writeBacklog([{ id: 'U1', status: 'done ✅' }, { id: 'U2', status: 'done ✅' }]);
      return { exit: 0, output_tail: 'session ok' };
    };
    const r = supervise(opts(), runner);
    expect(r).toMatchObject({ status: 'COMPLETE', sessions: 2 });
    expect(calls).toBe(2);
  });

  test('already-complete backlog → COMPLETE without launching any session', () => {
    writeBacklog([{ id: 'U1', status: 'done ✅' }]);
    const runner = jest.fn();
    const r = supervise(opts(), runner);
    expect(r.status).toBe('COMPLETE');
    expect(runner).not.toHaveBeenCalled();
  });

  test('stop-approved before launch → STOP_APPROVED with the recorded reason, no session runs', () => {
    writeBacklog([{ id: 'U1', status: 'todo' }]);
    fs.writeFileSync(path.join(ws, '_stop-approved.json'), '{"reason":"ESCALATE: U1 needs human"}');
    const runner = jest.fn();
    const r = supervise(opts(), runner);
    expect(r).toMatchObject({ status: 'STOP_APPROVED', reason: 'ESCALATE: U1 needs human' });
    expect(runner).not.toHaveBeenCalled();
  });

  test('stop-approved written DURING a session halts the loop after that session', () => {
    writeBacklog([{ id: 'U1', status: 'todo' }]);
    const runner = () => {
      fs.writeFileSync(path.join(ws, '_stop-approved.json'), '{"reason":"real credential required"}');
      return { exit: 0, output_tail: '' };
    };
    const r = supervise(opts(), runner);
    expect(r).toMatchObject({ status: 'STOP_APPROVED', sessions: 1, reason: 'real credential required' });
  });

  test('3 consecutive no-progress sessions → NO_PROGRESS (never spins forever on a wedged run)', () => {
    writeBacklog([{ id: 'U1', status: 'todo' }]);
    let calls = 0;
    const runner = () => { calls++; return { exit: 1, output_tail: 'stuck' }; };
    const r = supervise(opts(), runner);
    expect(r.status).toBe('NO_PROGRESS');
    expect(calls).toBe(3);
  });

  test('progress resets the no-progress streak', () => {
    writeBacklog([{ id: 'U1', status: 'todo' }, { id: 'U2', status: 'todo' }]);
    let calls = 0;
    const runner = () => {
      calls++;
      if (calls === 3) writeBacklog([{ id: 'U1', status: 'done ✅' }, { id: 'U2', status: 'todo' }]); // progress on 3rd
      if (calls === 6) writeBacklog([{ id: 'U1', status: 'done ✅' }, { id: 'U2', status: 'done ✅' }]);
      return { exit: 0, output_tail: '' };
    };
    const r = supervise(opts(), runner);
    expect(r.status).toBe('COMPLETE');
    expect(calls).toBe(6); // streak reset at 3 allowed two more no-progress rounds before finishing
  });

  test('max-sessions valve fires with an honest reason', () => {
    writeBacklog([{ id: 'U1', status: 'todo' }]);
    // alternate the backlog so no-progress never triggers, forcing the max valve
    let flip = false;
    const runner = () => {
      flip = !flip;
      writeBacklog([{ id: 'U1', status: flip ? 'in-progress' : 'todo' }]);
      return { exit: 0, output_tail: '' };
    };
    const r = supervise(opts({ maxSessions: 4 }), runner);
    expect(r).toMatchObject({ status: 'MAX_SESSIONS', sessions: 4 });
  });

  test('session log is appended per session', () => {
    writeBacklog([{ id: 'U1', status: 'todo' }]);
    const runner = () => ({ exit: 1, output_tail: 'boom' });
    supervise(opts(), runner);
    const lines = fs.readFileSync(path.join(ws, '_nonstop-log.jsonl'), 'utf8').trim().split('\n');
    expect(lines).toHaveLength(3);
    expect(JSON.parse(lines[0])).toMatchObject({ session: 1, exit: 1 });
  });

  test('exit-code map covers every terminal status', () => {
    expect(EXIT.COMPLETE).toBe(0);
    expect(new Set(Object.values(EXIT)).size).toBe(Object.values(EXIT).length);
  });
});
