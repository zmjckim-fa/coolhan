#!/usr/bin/env node

/**
 * CoolHan agent-loop — executable Agent Loop / Feedback Loop / Long-Running Agent driver (G10).
 *
 * Until now the iterate cycle (execute → observe → fix → re-run) lived as prose in SKILL.md
 * ("1 retry then report"). This script makes the loop MECHANICAL and RESUMABLE:
 *
 *   Agent Loop      — one call = one cycle: run the unit's verify command for real
 *                     (child_process, captured exit/output — C10 no-simulation), observe,
 *                     decide: DONE / ITERATE / ESCALATE.
 *   Feedback Loop   — every failing run appends structured feedback (iteration #, exit code,
 *                     output tail) to the loop state and, when a ledger is present, to the
 *                     G5 run ledger — the NEXT fix attempt starts from recorded evidence,
 *                     not from memory of what went wrong.
 *   Long-Running    — state persists in a JSON file (default _workspace/_loop-state.json),
 *   Agent             keyed per unit. A new session (after a baton/handoff) resumes at
 *                     iteration N+1 with the full feedback history — the loop survives
 *                     session boundaries instead of restarting blind.
 *
 * The script deliberately does NOT fix code — that is the Developer agent's job. It drives the
 * cycle: verdict ITERATE hands the recorded feedback to the fix step; the orchestrator calls
 * agent-loop again after the fix. Division of labor: model = generator, this gate = evaluator
 * and loop bookkeeper (Generator–Evaluator pattern, made executable).
 *
 * Usage:
 *   node scripts/agent-loop.js <unit-id> --cmd "<verify command>" [options]
 *     --max N        max iterations before ESCALATE (default 5)
 *     --cwd DIR      working directory for the command (default .)
 *     --state FILE   loop-state file (default _workspace/_loop-state.json)
 *     --ledger FILE  also append each observation to the G5 ledger (optional)
 *     --run-id ID    run id recorded in state/ledger (default "local")
 *     --json         machine-readable result
 *
 * Exit codes: 0 = DONE (verify passed) · 3 = ITERATE (failed, feedback recorded, retries left)
 *             1 = ESCALATE (max iterations exhausted) · 2 = usage/config error
 *
 * Honesty: DONE proves the verify command exited 0 this iteration — nothing more. ITERATE
 * feedback is raw captured output, never summarized into optimism. ESCALATE is a stop signal
 * for a human/orchestrator decision, not a silent give-up.
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const TAIL = 2000; // chars of output kept per stream — enough to act on, bounded for the ledger

function loadState(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (_) { return { units: {} }; }
}

function saveState(file, state) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(state, null, 2));
}

function runVerify(cmd, cwd) {
  const started = Date.now();
  const r = spawnSync(cmd, { shell: true, cwd, encoding: 'utf8', timeout: 10 * 60 * 1000 });
  return {
    exit: r.status === null ? -1 : r.status,
    timed_out: r.status === null,
    stdout_tail: (r.stdout || '').slice(-TAIL),
    stderr_tail: (r.stderr || '').slice(-TAIL),
    duration_ms: Date.now() - started
  };
}

/**
 * One loop cycle for a unit. Pure state transition given an observation — testable without
 * spawning processes (pass `observation` directly in tests).
 */
function step(state, unitId, observation, maxIterations) {
  if (!state.units[unitId]) state.units[unitId] = { iterations: [], status: 'in-loop' };
  const u = state.units[unitId];
  if (u.status === 'done') return { verdict: 'DONE', iteration: u.iterations.length, note: 'already done' };
  if (u.status === 'escalated') {
    // Terminal until a human/orchestrator decision resets the unit — re-running the loop
    // does not quietly grant extra iterations past the agreed max.
    return { verdict: 'ESCALATE', iteration: u.iterations.length, note: 'already escalated — reset required' };
  }

  const n = u.iterations.length + 1;
  const passed = observation.exit === 0;
  u.iterations.push({
    n,
    exit: observation.exit,
    passed,
    timed_out: !!observation.timed_out,
    duration_ms: observation.duration_ms,
    feedback: passed ? null : {
      stdout_tail: observation.stdout_tail,
      stderr_tail: observation.stderr_tail
    }
  });

  if (passed) { u.status = 'done'; return { verdict: 'DONE', iteration: n }; }
  if (n >= maxIterations) { u.status = 'escalated'; return { verdict: 'ESCALATE', iteration: n }; }
  u.status = 'in-loop';
  return { verdict: 'ITERATE', iteration: n };
}

function main(argv) {
  const args = argv.slice(2);
  const get = f => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined; };
  const VALUE_FLAGS = new Set(['--cmd', '--max', '--cwd', '--state', '--ledger', '--run-id']);
  const positional = [];
  for (let i = 0; i < args.length; i++) {
    if (VALUE_FLAGS.has(args[i])) { i++; continue; }
    if (!args[i].startsWith('--')) positional.push(args[i]);
  }
  const unitId = positional[0];
  const cmd = get('--cmd');
  const json = args.includes('--json');
  if (!unitId || !cmd) {
    console.error('usage: agent-loop.js <unit-id> --cmd "<verify command>" [--max N] [--cwd DIR] [--state FILE] [--ledger FILE] [--run-id ID] [--json]');
    return 2;
  }
  const max = parseInt(get('--max') || '5', 10);
  const cwd = get('--cwd') || '.';
  const stateFile = get('--state') || path.join('_workspace', '_loop-state.json');
  const ledgerFile = get('--ledger');
  const runId = get('--run-id') || 'local';

  const state = loadState(stateFile);
  const observation = runVerify(cmd, cwd);
  const result = step(state, unitId, observation, max);
  saveState(stateFile, state);

  if (ledgerFile) {
    try {
      const { append } = require('./ledger');
      append({
        run_id: runId, unit: unitId, gate: 'G10-agent-loop',
        status: result.verdict === 'DONE' ? 'PASS' : 'FAIL',
        reason: result.verdict === 'DONE' ? `passed at iteration ${result.iteration}`
          : `${result.verdict} at iteration ${result.iteration} (exit ${observation.exit})`
      }, ledgerFile);
    } catch (e) { console.error(`(ledger append failed: ${e.message})`); }
  }

  const out = { unit: unitId, ...result, exit_code_observed: observation.exit, state_file: stateFile };
  if (json) console.log(JSON.stringify(out, null, 2));
  else if (result.verdict === 'DONE') console.log(`✔ agent-loop [${unitId}]: DONE at iteration ${result.iteration}`);
  else if (result.verdict === 'ITERATE') console.log(`↻ agent-loop [${unitId}]: ITERATE — iteration ${result.iteration}/${max} failed (exit ${observation.exit}); feedback recorded in ${stateFile}`);
  else console.log(`✗ agent-loop [${unitId}]: ESCALATE — ${max} iterations exhausted; human/orchestrator decision required`);

  return result.verdict === 'DONE' ? 0 : result.verdict === 'ITERATE' ? 3 : 1;
}

if (require.main === module) process.exit(main(process.argv));

module.exports = { step, runVerify, loadState, saveState, main };
