#!/usr/bin/env node

/**
 * CoolHan exec-runner — actually run generated software and capture real evidence.
 *
 * The harness must verify by RUNNING, not by asserting "should pass". This runner detects the
 * stack, runs the matching install/test/run commands in a target dir, and captures real
 * stdout/stderr/exit/timing. If a required tool is missing it reports NOT_RUN — it never
 * fabricates or simulates a result (C10: no simulation).
 *
 * Usage:
 *   node scripts/exec-runner.js <dir> [--phase install|test|run|all] [--json] [--timeout ms]
 *
 * Evidence: { dir, stack, results: [{phase, command, status, exit, ms, stdout_tail, stderr_tail}] }
 * Exit code: 0 if no phase FAILED (NOT_RUN/skipped do not fail), 1 if any FAILED.
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

// Stack detection: signal file → commands (no npm assumption).
const STACKS = [
  { id: 'node', signal: 'package.json',
    install: 'npm install', test: 'npm test', run: null },
  { id: 'python-fastapi', signal: 'requirements.txt',
    install: 'pip install -r requirements.txt', test: 'pytest -q', run: null },
  { id: 'python-pyproject', signal: 'pyproject.toml',
    install: 'pip install -e .', test: 'pytest -q', run: null },
  { id: 'go', signal: 'go.mod',
    install: 'go mod download', test: 'go test ./...', run: null },
  { id: 'ruby', signal: 'Gemfile',
    install: 'bundle install', test: 'bundle exec rspec', run: null },
  { id: 'php-laravel', signal: 'composer.json',
    install: 'composer install', test: 'php artisan test', run: null }
];

function detectStack(dir) {
  for (const s of STACKS) {
    if (fs.existsSync(path.join(dir, s.signal))) return s;
  }
  return null;
}

// Is the tool for a command available on PATH?
function toolAvailable(command) {
  const bin = command.split(/\s+/)[0];
  const probe = process.platform === 'win32'
    ? spawnSync('where', [bin], { encoding: 'utf8' })
    : spawnSync('sh', ['-c', `command -v ${bin}`], { encoding: 'utf8' });
  return probe.status === 0;
}

const tail = (s, n = 2000) => (s || '').slice(-n);

function runPhase(dir, phase, command, timeout) {
  if (!command) return { phase, command: null, status: 'SKIPPED', exit: null, ms: 0 };
  if (!toolAvailable(command)) {
    return { phase, command, status: 'NOT_RUN', reason: `tool not installed: ${command.split(/\s+/)[0]}`, exit: null, ms: 0 };
  }
  const start = Date.now();
  const r = spawnSync(command, { cwd: dir, shell: true, encoding: 'utf8', timeout });
  const ms = Date.now() - start;
  if (r.error && r.error.code === 'ETIMEDOUT') {
    return { phase, command, status: 'FAILED', reason: 'timeout', exit: null, ms, stderr_tail: 'timeout' };
  }
  return {
    phase, command,
    status: r.status === 0 ? 'PASSED' : 'FAILED',
    exit: r.status,
    ms,
    stdout_tail: tail(r.stdout),
    stderr_tail: tail(r.stderr)
  };
}

function run(dir, phase, timeout) {
  const root = path.resolve(dir);
  const stack = detectStack(root);
  if (!stack) {
    return { dir: root, stack: null, status: 'NOT_RUN', reason: 'no recognized stack signal', results: [] };
  }
  const phases = phase === 'all' ? ['install', 'test', 'run'] : [phase];
  const results = [];
  for (const p of phases) {
    const cmd = stack[p];
    const res = runPhase(root, p, cmd, timeout);
    results.push(res);
    // If install FAILED/NOT_RUN, downstream phases can't be trusted — mark and stop.
    if (p === 'install' && (res.status === 'FAILED' || res.status === 'NOT_RUN')) {
      if (phases.includes('test')) results.push({ phase: 'test', status: 'NOT_RUN', reason: 'install did not pass', exit: null, ms: 0 });
      break;
    }
  }
  const failed = results.some(r => r.status === 'FAILED');
  const anyRun = results.some(r => r.status === 'PASSED' || r.status === 'FAILED');
  return {
    dir: root, stack: stack.id,
    status: failed ? 'FAILED' : (anyRun ? 'PASSED' : 'NOT_RUN'),
    results
  };
}

function main(argv) {
  const args = argv.slice(2);
  const json = args.includes('--json');
  const phase = (args[args.indexOf('--phase') + 1]) && args.includes('--phase') ? args[args.indexOf('--phase') + 1] : 'all';
  const timeout = args.includes('--timeout') ? parseInt(args[args.indexOf('--timeout') + 1], 10) : 120000;
  const dir = args.find((a, i) => !a.startsWith('--') && !['install', 'test', 'run', 'all'].includes(a) && args[i - 1] !== '--phase' && args[i - 1] !== '--timeout') || process.cwd();

  const ev = run(dir, phase, timeout);

  if (json) {
    console.log(JSON.stringify(ev, null, 2));
  } else {
    console.log(`exec-runner: ${ev.dir}  [stack: ${ev.stack || 'none'}]  → ${ev.status}`);
    for (const r of ev.results) {
      const line = `  ${r.phase.padEnd(8)} ${r.status}` + (r.exit != null ? ` (exit ${r.exit}, ${r.ms}ms)` : '') + (r.reason ? ` — ${r.reason}` : '');
      console.log(line);
    }
    if (ev.status === 'NOT_RUN') console.log('  (NOT_RUN is honest: nothing was executed — not a pass)');
  }
  return ev.status === 'FAILED' ? 1 : 0;
}

if (require.main === module) {
  process.exit(main(process.argv));
}

module.exports = { detectStack, toolAvailable, runPhase, run, main, STACKS };
