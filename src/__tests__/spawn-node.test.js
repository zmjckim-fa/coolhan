const fs = require('fs');
const os = require('os');
const path = require('path');
const { runNode, neverStarted } = require('../../scripts/lib/spawn-node');

const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'spn-'));
const quiet = (fn) => { const e = console.error; const seen = []; console.error = (m) => seen.push(String(m)); try { return { r: fn(), seen }; } finally { console.error = e; } };

describe('runNode (D-13: a child that never started is retried; a child that ran is never retried)', () => {
  test('neverStarted: spawn error, no status, or non-zero with no output at all', () => {
    expect(neverStarted({ error: new Error('x'), status: null })).toBe(true);
    expect(neverStarted({ status: null, stdout: '', stderr: '' })).toBe(true);
    expect(neverStarted({ status: 3, stdout: '', stderr: '' })).toBe(true);
    expect(neverStarted({ status: 1, stdout: '', stderr: 'FAIL: rule broken' })).toBe(false);
    expect(neverStarted({ status: 1, stdout: '{"status":"FAIL"}', stderr: '' })).toBe(false);
    expect(neverStarted({ status: 0, stdout: '', stderr: '' })).toBe(false);
  });

  test('a child that dies silently once and then runs: one reported retry, the real output is returned', () => {
    const d = tmp();
    const script = path.join(d, 's.js');
    fs.writeFileSync(script, "const fs=require('fs');const f=process.argv[2];const n=fs.existsSync(f)?Number(fs.readFileSync(f,'utf8')):0;fs.writeFileSync(f,String(n+1));if(n===0)process.exit(3);console.log('ran');");
    const counter = path.join(d, 'n');
    const { r, seen } = quiet(() => runNode(script, [counter]));
    expect(r.status).toBe(0); expect(r.stdout).toMatch(/ran/);
    expect(fs.readFileSync(counter, 'utf8')).toBe('2');
    expect(seen).toHaveLength(1);
    fs.rmSync(d, { recursive: true, force: true });
  });

  test('a real failure (non-zero with a message) is returned as it is, launched exactly once', () => {
    const d = tmp();
    const script = path.join(d, 's.js');
    fs.writeFileSync(script, "const fs=require('fs');const f=process.argv[2];const n=fs.existsSync(f)?Number(fs.readFileSync(f,'utf8')):0;fs.writeFileSync(f,String(n+1));console.error('FAIL: rule broken');process.exit(1);");
    const counter = path.join(d, 'n');
    const { r, seen } = quiet(() => runNode(script, [counter]));
    expect(r.status).toBe(1); expect(r.stderr).toMatch(/rule broken/);
    expect(fs.readFileSync(counter, 'utf8')).toBe('1');
    expect(seen).toHaveLength(0);
    fs.rmSync(d, { recursive: true, force: true });
  });

  test('a child that never starts stays a failure after the bounded retries (it is not turned into a pass)', () => {
    const d = tmp();
    const script = path.join(d, 's.js');
    fs.writeFileSync(script, 'process.exit(5);');
    const { r, seen } = quiet(() => runNode(script, [], { retries: 2 }));
    expect(r.status).toBe(5); expect(r.stdout).toBe('');
    expect(seen).toHaveLength(2);
    fs.rmSync(d, { recursive: true, force: true });
  });
});
