const fs = require('fs');
const os = require('os');
const path = require('path');
const { detectStack, run, STACKS } = require('../../scripts/exec-runner');

function mkNode(testCmd) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'er-'));
  fs.writeFileSync(path.join(dir, 'package.json'),
    JSON.stringify({ name: 't', scripts: { test: testCmd } }));
  return dir;
}

describe('exec-runner', () => {
  test('detects node stack from package.json', () => {
    const dir = mkNode('node -e "0"');
    expect(detectStack(dir).id).toBe('node');
  });

  test('no recognized stack → NOT_RUN (not a pass)', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'er-none-'));
    const ev = run(dir, 'test', 60000);
    expect(ev.status).toBe('NOT_RUN');
    expect(ev.stack).toBeNull();
  });

  test('passing test → PASSED with real captured exit 0', () => {
    const dir = mkNode('node -e "process.exit(0)"');
    const ev = run(dir, 'test', 60000);
    expect(ev.status).toBe('PASSED');
    const t = ev.results.find(r => r.phase === 'test');
    expect(t.status).toBe('PASSED');
    expect(t.exit).toBe(0);
  });

  test('failing test → FAILED with real nonzero exit (never faked pass)', () => {
    const dir = mkNode('node -e "process.exit(1)"');
    const ev = run(dir, 'test', 60000);
    expect(ev.status).toBe('FAILED');
    const t = ev.results.find(r => r.phase === 'test');
    expect(t.status).toBe('FAILED');
    expect(t.exit).toBe(1);
  });

  test('captured evidence includes command + output tail', () => {
    const dir = mkNode('node -e "console.log(\'HELLO_EVIDENCE\')"');
    const ev = run(dir, 'test', 60000);
    const t = ev.results.find(r => r.phase === 'test');
    expect(t.command).toContain('npm test');
    expect(t.stdout_tail).toContain('HELLO_EVIDENCE');
  });

  test('STACKS are stack-agnostic (no npm-only assumption)', () => {
    const ids = STACKS.map(s => s.id);
    expect(ids).toEqual(expect.arrayContaining(['node', 'python-fastapi', 'go']));
  });
});
