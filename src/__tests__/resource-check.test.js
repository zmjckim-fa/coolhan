const fs = require('fs');
const os = require('os');
const path = require('path');
const { measure, verdict, line, main, DEFAULT_MIN_FREE_MB } = require('../../scripts/resource-check');
const checksRun = require('../../scripts/checks-run');
const { runNode, neverStarted, memoryDenied } = require('../../scripts/lib/spawn-node');

const win = (stdout, extra = {}) => ({ platform: 'win32', run: () => ({ status: 0, stdout, ...extra }) });
const meminfo = (text) => ({ platform: 'linux', readFile: () => text });
const capture = (fn) => {
  const orig = { log: console.log, error: console.error }; const out = []; const err = [];
  console.log = (m) => out.push(String(m)); console.error = (m) => err.push(String(m));
  try { return { code: fn(), out: out.join('\n'), err: err.join('\n') }; } finally { console.log = orig.log; console.error = orig.error; }
};

describe('resource-check (D-13: can a new process still get memory on this machine?)', () => {
  test('Windows: commit limit, commit headroom, physical headroom and the largest consumers are read', () => {
    const m = measure(win('50067456 5120000 1536000\r\nnode 5878\r\nsome app 1100\r\n'));
    expect(m).toMatchObject({ measured: true, source: 'windows-commit', limit_mb: 48894, free_mb: 5000, physical_free_mb: 1500 });
    expect(m.top).toEqual([{ name: 'node', mb: 5878 }, { name: 'some app', mb: 1100 }]);
  });

  test('headroom below the floor is LOW (exit 1) and the line names the floor and the consumers', () => {
    const opts = win('50067456 512000 300000\nnode 7400\n');
    const v = verdict(measure(opts));
    expect(v.status).toBe('LOW'); expect(v.min_free_mb).toBe(DEFAULT_MIN_FREE_MB);
    expect(line(v)).toMatch(/500MB/); expect(line(v)).toMatch(/1024MB/); expect(line(v)).toMatch(/node 7400MB/);
    expect(capture(() => main(['node', 'resource-check.js'], opts)).code).toBe(1);
  });

  test('headroom at or above the floor is PASS (exit 0); the floor is adjustable', () => {
    const opts = win('50067456 2048000 900000\n');
    expect(capture(() => main(['node', 'resource-check.js'], opts)).code).toBe(0);
    expect(capture(() => main(['node', 'resource-check.js', '--min-free-mb', '4096'], opts)).code).toBe(1);
    const j = JSON.parse(capture(() => main(['node', 'resource-check.js', '--json'], opts)).out);
    expect(j).toMatchObject({ status: 'PASS', free_mb: 2000, min_free_mb: 1024, top: [] });
  });

  test('a probe that could not run is NOT_RUN (exit 4), never a pass', () => {
    const cases = [
      { platform: 'win32', run: () => ({ error: Object.assign(new Error('spawn failed'), { code: 'ENOMEM' }), status: null }) },
      { platform: 'win32', run: () => ({ status: 1, stdout: '' }) },
      win('not numbers at all'),
      { platform: 'linux', readFile: () => { throw Object.assign(new Error('no such file'), { code: 'ENOENT' }); } },
      meminfo('MemTotal: abc'),
      { platform: 'darwin' }
    ];
    for (const opts of cases) {
      const v = verdict(measure(opts));
      expect(v.status).toBe('NOT_RUN'); expect(v.reason).toBeTruthy();
      expect(capture(() => main(['node', 'resource-check.js'], opts)).code).toBe(4);
    }
    expect(verdict(measure({ platform: 'win32', run: () => ({ error: Object.assign(new Error('x'), { code: 'ENOMEM' }), status: null }) })).reason).toBe('ENOMEM');
  });

  test('Linux: available memory plus free swap is the headroom', () => {
    const m = measure(meminfo('MemTotal:       16384000 kB\nMemFree:          100000 kB\nMemAvailable:    2048000 kB\nSwapTotal:       4096000 kB\nSwapFree:        1024000 kB\n'));
    expect(m).toMatchObject({ measured: true, source: 'linux-meminfo', limit_mb: 20000, free_mb: 3000, physical_free_mb: 2000, top: [] });
    expect(verdict(measure(meminfo('MemTotal: 2048000 kB\nMemAvailable: 512000 kB\n'))).status).toBe('LOW');
  });

  test('usage errors exit 2: unknown flag, stray argument, a floor that is not a number', () => {
    const opts = win('50067456 2048000 900000\n');
    for (const extra of [['--bogus'], ['stray'], ['--min-free-mb', 'many'], ['--min-free-mb', '-5']]) {
      const r = capture(() => main(['node', 'resource-check.js', ...extra], opts));
      expect(r.code).toBe(2); expect(r.err).toMatch(/usage/);
    }
  });

  test('the real probe on this machine returns a verdict and the matching exit code', () => {
    const r = capture(() => main(['node', 'resource-check.js', '--json']));
    const v = JSON.parse(r.out);
    expect(['PASS', 'LOW', 'NOT_RUN']).toContain(v.status);
    expect(r.code).toBe({ PASS: 0, LOW: 1, NOT_RUN: 4 }[v.status]);
    if (v.status !== 'NOT_RUN') { expect(v.free_mb).toBeGreaterThan(0); expect(v.limit_mb).toBeGreaterThanOrEqual(v.free_mb); }
  });
});

describe('checks-run reports the machine state with a failure, and only then (D-13)', () => {
  const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'rsc-'));
  const list = (cmd) => `| ID | 검사 | 명령 | 비고 |\n|---|---|---|---|\n| C1 | one | \`${cmd}\` | |\n`;
  const runIn = (d, opts, extra = []) => { const cwd = process.cwd(); process.chdir(d); try { return capture(() => checksRun.main(['node', 'checks-run.js', path.join(d, 'CHECKS.md'), ...extra], opts)); } finally { process.chdir(cwd); } };

  test('a failing list prints the headroom line; a passing list does not measure at all', () => {
    const d = tmp(); let calls = 0;
    const opts = { measure: () => { calls++; return { measured: true, source: 'windows-commit', limit_mb: 48000, free_mb: 300, physical_free_mb: 200, top: [{ name: 'node', mb: 7000 }] }; } };
    fs.writeFileSync(path.join(d, 'CHECKS.md'), list('node -e "process.exit(1)"'));
    const failed = runIn(d, opts);
    expect(failed.code).toBe(1); expect(failed.out).toMatch(/기기 상태/); expect(failed.out).toMatch(/LOW/); expect(failed.out).toMatch(/300MB/);
    expect(JSON.parse(runIn(d, opts, ['--json']).out).machine).toMatchObject({ status: 'LOW', free_mb: 300 });
    fs.writeFileSync(path.join(d, 'CHECKS.md'), list('node -e "process.exit(0)"'));
    const before = calls; const passed = runIn(d, opts);
    expect(passed.code).toBe(0); expect(passed.out).not.toMatch(/기기 상태/); expect(calls).toBe(before);
    expect(JSON.parse(runIn(d, opts, ['--json']).out).machine).toBeNull();
    fs.rmSync(d, { recursive: true, force: true });
  });

  test('an unmeasured machine is reported as unmeasured next to the failure, never as healthy', () => {
    const d = tmp();
    fs.writeFileSync(path.join(d, 'CHECKS.md'), list('node -e "process.exit(1)"'));
    const r = runIn(d, { measure: () => ({ measured: false, reason: 'platform darwin' }) });
    expect(r.code).toBe(1); expect(r.out).toMatch(/NOT_RUN/); expect(r.out).not.toMatch(/PASS/);
    fs.rmSync(d, { recursive: true, force: true });
  });
});

describe('a child refused memory is recognised by the signatures measured in track41 (D-13)', () => {
  const MEASURED = [
    { status: 0x80000003, stdout: '', stderr: '\n#\n# Fatal JavaScript out of memory: Committing semi space failed.\n#\n' },
    { status: 0x80000003, stdout: '', stderr: '\n#\n# Fatal process out of memory: Re-embedded builtins: set permissions\n#\n' },
    { status: 0xC0000409, stdout: '', stderr: '[low_level_alloc.cc : 554] RAW: Check new_page  != nullptr failed: VirtualAlloc failed\r\n' },
    { status: 0xC0000409, stdout: '', stderr: '' },
    { status: 0xC000012D, stdout: '', stderr: '' },
    { status: 0xC0000017, stdout: '', stderr: '' },
    { status: 0xC000009A, stdout: '', stderr: '' },
    { status: -1073741523, stdout: '', stderr: '' },
    { status: 134, stdout: '', stderr: 'FATAL ERROR: Committing semi space failed. Allocation failed - JavaScript heap out of memory' },
    { error: Object.assign(new Error('spawnSync node UNKNOWN'), { code: 'UNKNOWN' }), status: null }
  ];

  test('every measured signature counts as «never started»', () => {
    for (const r of MEASURED) expect(neverStarted(r)).toBe(true);
    expect(memoryDenied(MEASURED[4])).toBe(true); expect(memoryDenied(MEASURED[6])).toBe(true); expect(memoryDenied(MEASURED[7])).toBe(true); expect(memoryDenied(MEASURED[0])).toBe(true);
  });

  test('a script that ran is never classified as refused memory, even when it mentions memory', () => {
    expect(memoryDenied({ status: 1, stdout: '{"status":"FAIL"}', stderr: 'note: out of memory budget' })).toBe(false);
    expect(memoryDenied({ status: 0, stdout: '', stderr: 'warning: out of memory budget' })).toBe(false);
    expect(memoryDenied({ status: 1, stdout: '', stderr: 'FAIL: rule broken' })).toBe(false);
    expect(memoryDenied({ status: null, stdout: '', stderr: '' })).toBe(false);
    expect(neverStarted({ status: 1, stdout: '{"status":"FAIL"}', stderr: 'note: out of memory budget' })).toBe(false);
  });

  test('checks-run: a check refused memory is 확인 안 함 with the reason; a silent exit 1 stays 실패', () => {
    const d = fs.mkdtempSync(path.join(os.tmpdir(), 'rsm-'));
    fs.writeFileSync(path.join(d, 'sig.js'), "console.error('Fatal process out of memory: x');process.exit(3);");
    const [starved, silent] = checksRun.run([
      { id: 'C1', name: 'starved', command: 'node sig.js', note: '', manual: false },
      { id: 'C2', name: 'silent', command: 'node -e "process.exit(1)"', note: '', manual: false }
    ], { cwd: d }).results;
    expect(starved.result).toBe('not-run'); expect(starved.reason).toMatch(/메모리/);
    expect(silent.result).toBe('fail');
    fs.rmSync(d, { recursive: true, force: true });
  });
});

describe('runNode retry note carries the memory figure (D-13 evidence at the moment it happens)', () => {
  test('the note names free physical memory and the probe to run', () => {
    const d = fs.mkdtempSync(path.join(os.tmpdir(), 'rsn-'));
    const script = path.join(d, 's.js');
    fs.writeFileSync(script, "const fs=require('fs');const f=process.argv[2];const n=fs.existsSync(f)?Number(fs.readFileSync(f,'utf8')):0;fs.writeFileSync(f,String(n+1));if(n===0)process.exit(3);console.log('ran');");
    const r = capture(() => runNode(script, [path.join(d, 'n')]).status);
    expect(r.code).toBe(0); expect(r.err).toMatch(/\d+MB/); expect(r.err).toMatch(/resource-check/);
    fs.rmSync(d, { recursive: true, force: true });
  });
});
