#!/usr/bin/env node
// Track 41: D-13 device-side cause. A child process that is refused memory never starts.
// The shortage is produced inside a Windows job object, so only this track's own process tree is limited;
// the rest of the machine is not touched. Usage: node _harness_test/track41-machine-headroom/run-track.js
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn, spawnSync } = require('child_process');

const HOME = path.resolve(__dirname, '..', '..');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'track41-'));
const WORKER = path.join(__dirname, 'worker.js');
const JOB_CS = path.join(__dirname, 'job.cs');
const HOOK = path.join(HOME, '.claude', 'hooks', 'run-armer.js');
const { runNode, neverStarted, memoryDenied } = require(path.join(HOME, 'scripts', 'lib', 'spawn-node'));
const WIN = process.platform === 'win32';
const HELD = 200;                                  // MB held by the worker before it launches the hook
const LIMITS = [252, 244, 240, 236, 232, 228, 224]; // MB commit limit of the job; the hook child gets what is left

const log = [], rows = [];
const forms = (p) => [p.split(path.sep).join('\\\\'), p, p.split(path.sep).join('/')];
const MASK = [[TMP, '<tmp>'], [HOME, '<home>'], [path.dirname(process.execPath), '<node>'], [os.homedir(), '<user>']];
const clean = (s) => MASK.reduce((out, [p, name]) => forms(p).reduce((o, f) => o.split(f).join(name), out), String(s || ''));
const note = (s) => log.push(clean(s));
const check = (id, scenario, expected, actual, ok) => rows.push({ id, scenario, expected, actual: clean(actual), ok: ok === null ? null : !!ok });
const ps = (s) => String(s).replace(/'/g, "''");

/** Run `node worker.js ...args` inside a job whose commit limit is limitMb. */
function inJob(limitMb, args) {
  const line = args.map(a => `"${a}"`).join(' ');
  const cmd = `Add-Type -Path '${ps(JOB_CS)}'; [Job]::Run('${ps(process.execPath)}', '${ps(line)}', ${limitMb}MB)`;
  const r = spawnSync('powershell', ['-NoProfile', '-NonInteractive', '-Command', cmd], { encoding: 'utf8', timeout: 240000 });
  const m = String(r.stdout || '').match(/exit=(-?\d+) (\{[\s\S]*\})/);
  const res = m ? { exit: Number(m[1]), ...JSON.parse(m[2]) } : { lost: true, raw: String(r.stdout || r.stderr || (r.error && r.error.message) || '').trim().split(/\r?\n/).filter(Boolean).slice(-1)[0] || '' };
  note(`$ job limit ${limitMb}MB: node worker.js ${args.slice(1).map(a => path.isAbsolute(a) ? path.basename(a) : a).join(' ')}\n  ${JSON.stringify(res)}\n`);
  return res;
}
const kindsText = (k) => Object.entries(k).map(([name, n]) => `${name} x${n}`).join('; ') || 'none';

// ── 1-4. the shortage itself (Windows job object) ────────────────────────────────────────────────────────────
if (WIN) {
  const control = inJob(2000, [WORKER, 'launch', HOOK, '20', String(HELD)]);
  check(1, 'Control: the hook launched 20 times with memory to spare (job limit 2000MB, 200MB held)', '20 of 20 start and exit 0',
    control.lost ? `worker lost: ${control.raw}` : `${control.ok} of 20`, !control.lost && control.ok === 20);

  const sweep = LIMITS.map(l => ({ limit: l, ...inJob(l, [WORKER, 'launch', HOOK, '20', String(HELD)]) }));
  const measured = sweep.filter(s => !s.lost);
  const starved = measured.filter(s => s.failed > 0);
  const all = {}; for (const s of starved) for (const [k, n] of Object.entries(s.kinds)) all[k] = (all[k] || 0) + n;
  const failures = starved.reduce((n, s) => n + s.failed, 0);
  check(2, `The same hook as the job's commit limit shrinks (${LIMITS.join(', ')}MB)`, 'below some limit the child no longer starts; nothing reaches stdout',
    measured.length ? measured.map(s => `${s.limit}MB ${s.ok}/20`).join(', ') : 'no limit measured', measured.length ? starved.length > 0 && starved.some(s => s.ok === 0) : null);
  check(3, 'Every child that did not start, across the sweep', 'recognised by neverStarted (0 unrecognised), each one a spawn error or a memory signature',
    failures ? `${failures} failures, unrecognised ${starved.reduce((n, s) => n + s.unclassified, 0)}; ${kindsText(all)}` : 'no failure produced',
    failures ? starved.every(s => s.unclassified === 0) : null);

  const tight = starved.filter(s => s.ok === 0).map(s => s.limit).sort((x, y) => y - x)[0];
  const rn = tight ? inJob(tight, [WORKER, 'runnode', HOOK, String(HELD)]) : { lost: true, raw: 'no starving limit found' };
  check(4, `runNode inside the starving job (${tight || '-'}MB)`, 'two reported retries carrying a memory figure, then the failure returned as it is (never turned into a result)',
    rn.lost ? `not measured: ${rn.raw}` : `started ${rn.started}, retries ${rn.retries}, memory figure ${rn.note_has_memory}, ${rn.kind}`,
    rn.lost ? null : rn.started === false && rn.retries === 2 && rn.note_has_memory);
  const roomy = inJob(2000, [WORKER, 'runnode', HOOK, String(HELD)]);
  check(5, 'runNode inside the roomy job', 'runs once, no retry', roomy.lost ? `not measured: ${roomy.raw}` : `started ${roomy.started}, retries ${roomy.retries}`, roomy.lost ? null : roomy.started === true && roomy.retries === 0);
} else {
  for (const [id, name] of [[1, 'Control launch inside a job'], [2, 'Shrinking commit limit'], [3, 'Classification of every failure'], [4, 'runNode in a starving job'], [5, 'runNode in a roomy job']]) {
    check(id, name, 'Windows job object', `not measured on ${process.platform}`, null);
  }
}

// ── 6. scripts that ran and failed are never treated as «did not start» ─────────────────────────────────────────
const counter = (name, body) => { const f = path.join(TMP, name + '.js'); fs.writeFileSync(f, `const fs=require('fs');const c=process.argv[2];fs.writeFileSync(c,String((fs.existsSync(c)?Number(fs.readFileSync(c,'utf8')):0)+1));${body}`); return f; };
const RAN = [
  ['rule failure on stderr, exit 1', "console.error('FAIL: rule broken');process.exit(1);"],
  ['verdict on stdout, a memory word on stderr, exit 1', "console.log('{\"status\":\"FAIL\"}');console.error('note: report was cut, out of memory budget');process.exit(1);"],
  ['silent exit 0', ''],
  ['NOT_RUN on stdout, exit 4', "console.log('NOT_RUN: nothing scanned');process.exit(4);"]
];
const ran = RAN.map(([name, body], i) => {
  const c = path.join(TMP, `n${i}`); const quiet = console.error; const notes = []; console.error = (m) => notes.push(m);
  const r = runNode(counter(`ran${i}`, body), [c]); console.error = quiet;
  return { name, launches: Number(fs.readFileSync(c, 'utf8')), retried: notes.length, never: neverStarted(r), denied: memoryDenied(r) };
});
note(`fixtures that ran: ${JSON.stringify(ran)}\n`);
check(6, 'Four scripts that ran and failed or reported (one mentions memory on stderr beside its verdict)', 'each launched exactly once, not retried, not classified as refused memory',
  ran.map(x => `${x.launches} launch`).join(', ') + `; retried ${ran.filter(x => x.retried).length}; classified ${ran.filter(x => x.never || x.denied).length}`,
  ran.every(x => x.launches === 1 && !x.retried && !x.never && !x.denied));

// ── 7-8. checks-run: refused memory is 확인 안 함, a real failure stays 실패, and the machine state is printed ──────────
const proj = path.join(TMP, 'proj'); fs.mkdirSync(proj);
fs.writeFileSync(path.join(proj, 'sig.js'), "console.error('#\\n# Fatal process out of memory: Re-embedded builtins: set permissions\\n#');process.exit(3);");
fs.writeFileSync(path.join(proj, 'bad.js'), "console.error('FAIL: 2 findings');process.exit(1);");
const table = (rowsMd) => `| ID | 검사 | 명령 | 비고 |\n|---|---|---|---|\n${rowsMd}`;
const checksRun = (file) => { const r = spawnSync(process.execPath, [path.join(HOME, 'scripts', 'checks-run.js'), file], { cwd: proj, encoding: 'utf8' }); note(`$ node scripts/checks-run.js ${path.basename(file)}\n  exit ${r.status}\n${String(r.stdout || '').split('\n').filter(l => /C\d|기기 상태|통과/.test(l)).map(l => '  ' + l.trim().replace(/\. 가장 많이.*$/, '').slice(0, 150)).join('\n')}\n`); return r; };
fs.writeFileSync(path.join(proj, 'both.md'), table('| C1 | starved | `node sig.js` | |\n| C2 | broken | `node bad.js` | |\n'));
let r = checksRun(path.join(proj, 'both.md'));
check(7, 'checks-run: one check refused memory, one check really failing', 'exit 1; 실패 1 and 확인 안 함 1 (the starved one is not counted as a failure of the code); a machine state line is printed',
  `exit ${r.status}; ${(String(r.stdout).match(/통과 \d+ · 실패 \d+[^·]*· 확인 안 함 \d+/) || ['?'])[0]}; machine line ${/기기 상태/.test(r.stdout)}`,
  r.status === 1 && /실패 1/.test(r.stdout) && /확인 안 함 1/.test(r.stdout) && /기기 상태/.test(r.stdout));
fs.writeFileSync(path.join(proj, 'one.md'), table('| C1 | starved | `node sig.js` | |\n'));
r = checksRun(path.join(proj, 'one.md'));
check(8, 'checks-run: the only check was refused memory', 'exit 4 (not measured), never 0', `exit ${r.status}`, r.status === 4);

// ── 9-10. the probe ──────────────────────────────────────────────────────────────────────────────────────────
const probe = (...args) => spawnSync(process.execPath, [path.join(HOME, 'scripts', 'resource-check.js'), ...args], { encoding: 'utf8' });
r = probe('--json');
let v = null; try { v = JSON.parse(r.stdout); } catch (_) { /* reported below */ }
note(`$ node scripts/resource-check.js --json\n  exit ${r.status} ${v ? JSON.stringify({ status: v.status, source: v.source, free_mb: v.free_mb, limit_mb: v.limit_mb, min_free_mb: v.min_free_mb }) : 'unreadable'}\n`);
check(9, 'resource-check on this machine', 'a verdict with the matching exit code (PASS 0, LOW 1, NOT_RUN 4)', v ? `${v.status}, exit ${r.status}` : `unreadable, exit ${r.status}`, !!v && r.status === { PASS: 0, LOW: 1, NOT_RUN: 4 }[v.status]);
const high = probe('--min-free-mb', '99999999'); const bogus = probe('--bogus');
check(10, 'A floor far above the machine, and an unknown flag', v && v.status !== 'NOT_RUN' ? 'exit 1, exit 2' : 'exit 4, exit 2', `exit ${high.status}, exit ${bogus.status}`,
  bogus.status === 2 && high.status === (v && v.status !== 'NOT_RUN' ? 1 : 4));

// ── 11. CPU saturation with memory to spare ──────────────────────────────────────────────────────────────────
// A shortage can arrive from the rest of the machine while this runs. Then the precondition is gone: the row is
// «not measured», and the failures are judged on their own in row 12.
const shortageSince = (start) => {
  if (!WIN) return [];
  const q = `Get-WinEvent -FilterHashtable @{LogName='System'; Id=2004; StartTime=[datetime]'${start.toISOString()}'} -ErrorAction SilentlyContinue | ForEach-Object { $_.TimeCreated.ToString('HH:mm:ss') }`;
  const e = spawnSync('powershell', ['-NoProfile', '-NonInteractive', '-Command', q], { encoding: 'utf8', timeout: 60000 });
  return String(e.stdout || '').split(/\r?\n/).map(l => l.trim()).filter(Boolean);
};
function saturated(done) {
  if (!v || v.status !== 'PASS') return done(null, `precondition missing: probe says ${v ? v.status : 'unreadable'}`);
  const start = new Date(); let minFree = v.free_mb;
  const sample = setInterval(() => { const p = spawn(process.execPath, [path.join(HOME, 'scripts', 'resource-check.js'), '--json']); let o = ''; p.stdout.on('data', d => { o += d; }); p.on('error', () => { /* a sample that could not start is itself a sign; the event log decides */ }); p.on('close', () => { try { const j = JSON.parse(o); if (j.free_mb < minFree) minFree = j.free_mb; } catch (_) { /* no sample */ } }); }, 3000);
  const burners = []; for (let i = 0; i < os.cpus().length; i++) burners.push(spawn(process.execPath, [WORKER, 'burn', '300000'], { stdio: 'ignore' }));
  const W = 8, RUNS = 60; let closed = 0; const total = { ok: 0, failed: 0, unclassified: 0 }; const kinds = {};
  for (let w = 0; w < W; w++) {
    const p = spawn(process.execPath, [WORKER, 'launch', HOOK, String(RUNS), '0']); let out = '';
    p.stdout.on('data', d => { out += d; });
    p.on('close', () => {
      try { const j = JSON.parse(out); total.ok += j.ok; total.failed += j.failed; total.unclassified += j.unclassified; for (const [k, n] of Object.entries(j.kinds)) kinds[k] = (kinds[k] || 0) + n; } catch (_) { total.failed += RUNS; kinds['worker did not start'] = (kinds['worker did not start'] || 0) + 1; }
      if (++closed === W) {
        clearInterval(sample); for (const b of burners) b.kill();
        const events = shortageSince(start);
        done({ ...total, kinds, minFree, events, launches: W * RUNS, cores: burners.length });
      }
    });
  }
}
saturated((res, missing) => {
  if (res === null) check(11, 'Every core busy, memory above the floor', 'every launch starts (a busy CPU alone does not stop a child from starting)', missing, null);
  else {
    const text = `${res.launches} launches with ${res.cores} cores busy: ${res.ok} started, ${res.failed} did not; lowest headroom sampled ${res.minFree}MB; shortage recorded by Windows during the run: ${res.events.length ? res.events.join(', ') : 'none'}`;
    note(`saturation: ${text}; ${kindsText(res.kinds)}\n`);
    const shortage = res.events.length > 0 || res.minFree < 1024;
    check(11, 'Every core busy, memory above the floor throughout', 'every launch starts (a busy CPU alone does not stop a child from starting)', text, res.failed === 0 ? true : shortage ? null : false);
    if (res.failed > 0 && shortage) check(12, 'A shortage arrived from the rest of the machine during row 11', 'every child that did not start is recognised (0 unrecognised)', `${res.failed} did not start, unrecognised ${res.unclassified}; ${kindsText(res.kinds)}`, res.unclassified === 0);
  }

  const pass = rows.filter(x => x.ok === true).length, fail = rows.filter(x => x.ok === false).length, notRun = rows.filter(x => x.ok === null).length;
  const table = rows.map(x => `${x.ok === null ? 'NOT_RUN' : x.ok ? 'PASS' : 'FAIL'} #${x.id} ${x.scenario}\n    expected: ${x.expected}\n    actual:   ${x.actual}`).join('\n');
  const summary = `track41: ${pass}/${rows.length} match, ${fail} mismatch, ${notRun} not measured`;
  fs.writeFileSync(path.join(__dirname, 'run-log.txt'), `${log.join('\n')}\n${table}\n\n${summary}\n`);
  console.log(table + '\n\n' + summary);
  try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (_) { /* left for the OS */ }
  process.exit(fail ? 1 : notRun ? 4 : 0);
});
