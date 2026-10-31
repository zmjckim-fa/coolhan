const fs = require('fs');
const os = require('os');
const path = require('path');
const { parseChecks, openDefectsByCheck, run, main } = require('../../scripts/checks-run');

function tmp() { return fs.mkdtempSync(path.join(os.tmpdir(), 'checks-')); }
const NODE = 'node -e';
const CHECKS = [
  '# CHECKS', '',
  '| ID | 검사 | 명령 | 비고 |', '|---|---|---|---|',
  `| C1 | passes | \`${NODE} "process.exit(0)"\` | |`,
  `| C2 | fails | \`${NODE} "console.log('boom');process.exit(1)"\` | |`,
  '| C3 | missing tool | `definitely-not-a-tool-xyz --version` | |',
  '| C4 | human review | `open docs/SCREENSHOTS` | manual |', ''
].join('\n');
const LEDGER = [
  '목표: x', '## 작업 목록', '| 번호 | 이름 | 상태 | 완료 증거 | 남은 항목 |', '|---|---|---|---|---|', '| 1 | a | 대기 | | |',
  '## 현재 위치', '1번', '## 가정 목록', '## 결함 목록',
  '| D-번호 | 발견한 검사 | 파일:줄 | 상태 |', '|---|---|---|---|',
  '| D-7 | C2 | src/x.js:1 | 열림 |', '| D-8 | C2 | src/y.js:1 | 닫힘 |', ''
].join('\n');

describe('checks-run (G20-B — fixed verification list runner, §11)', () => {
  test('parseChecks reads | ID | 검사 | 명령 | 비고 | rows, strips backticks, marks manual', () => {
    const c = parseChecks(CHECKS);
    expect(c.map(x => x.id)).toEqual(['C1', 'C2', 'C3', 'C4']);
    expect(c[0].command).toBe(`${NODE} "process.exit(0)"`);
    expect(c[3].manual).toBe(true);
  });

  test('runs each check as a real process and reports exactly 통과 · 실패(D-번호) · 확인 안 함(이유)', () => {
    const d = tmp();
    fs.writeFileSync(path.join(d, 'PROGRESS.md'), LEDGER);
    const r = run(parseChecks(CHECKS), { cwd: d, ledger: 'PROGRESS.md', timeoutSec: 60 });
    expect([r.pass, r.fail, r.not_run]).toEqual([1, 1, 2]);
    const c2 = r.results.find(x => x.id === 'C2');
    expect(c2.result).toBe('fail'); expect(c2.exit).toBe(1); expect(c2.tail).toMatch(/boom/);
    expect(c2.defects).toEqual(['D-7']);                       // open defect bound to this check; closed D-8 excluded
    expect(r.results.find(x => x.id === 'C3').result).toBe('not-run');
    expect(r.results.find(x => x.id === 'C4').reason).toBe('manual');
    expect(r.line).toMatch(/통과 1 · 실패 1\(D-7\) · 확인 안 함 2\(C3:.+, C4:manual\)/);
    expect(r.exit).toBe(1);
    fs.rmSync(d, { recursive: true, force: true });
  });

  test('a failing check with no registered defect is flagged 미등록 → D-번호 등록 필요 (never silently)', () => {
    const d = tmp();
    const r = run(parseChecks(CHECKS).filter(c => c.id === 'C2'), { cwd: d, ledger: 'PROGRESS.md', timeoutSec: 60 });
    expect(r.line).toMatch(/실패 1\(C2:미등록→D-번호 등록 필요\)/);
    fs.rmSync(d, { recursive: true, force: true });
  });

  test('확인 안 함 is never a pass: no failures + one not-run → exit 4, not 0', () => {
    const d = tmp();
    const r = run(parseChecks(CHECKS).filter(c => c.id === 'C1' || c.id === 'C4'), { cwd: d, timeoutSec: 60 });
    expect([r.pass, r.fail, r.not_run, r.exit]).toEqual([1, 0, 1, 4]);
    fs.rmSync(d, { recursive: true, force: true });
  });

  test('timeout is reported as 확인 안 함(timeout), with the reason', () => {
    const slow = parseChecks(`| ID | 검사 | 명령 |\n|---|---|---|\n| S1 | slow | \`${NODE} "setTimeout(()=>{},3000)"\` |`);
    const r = run(slow, { cwd: os.tmpdir(), timeoutSec: 1 }); // cwd outside any dir we delete: the killed shell's child may linger briefly
    expect(r.results[0].result).toBe('not-run');
    expect(r.results[0].reason).toMatch(/timeout 1s/);
  });

  test('openDefectsByCheck ignores tables outside the 결함 section and closed rows', () => {
    const d = tmp();
    const p = path.join(d, 'PROGRESS.md'); fs.writeFileSync(p, LEDGER);
    expect(openDefectsByCheck(p)).toEqual({ C2: ['D-7'] });
    expect(openDefectsByCheck(path.join(d, 'nope.md'))).toEqual({});
    fs.rmSync(d, { recursive: true, force: true });
  });

  test('main: --only filters, exit codes 0/1/4/2, missing list message points at §11', () => {
    const d = tmp();
    const f = path.join(d, 'CHECKS.md'); fs.writeFileSync(f, CHECKS);
    const orig = { log: console.log, error: console.error }; const errs = []; console.log = () => {}; console.error = (m) => errs.push(m);
    const cwd = process.cwd(); process.chdir(d);
    const only1 = main(['node', 'checks-run.js', f, '--only', 'C1', '--timeout', '60']);
    const only2 = main(['node', 'checks-run.js', f, '--only', 'C2', '--timeout', '60']);
    const only4 = main(['node', 'checks-run.js', f, '--only', 'C4']);
    const none = main(['node', 'checks-run.js', path.join(d, 'missing.md')]);
    process.chdir(cwd);
    console.log = orig.log; console.error = orig.error;
    expect([only1, only2, only4, none]).toEqual([0, 1, 4, 2]);
    expect(errs.join('\n')).toMatch(/§11/);
    fs.rmSync(d, { recursive: true, force: true });
  });
});
