#!/usr/bin/env node

/**
 * CoolHan gates — the single executable entry point for the pre-deploy gate sequence (G7).
 *
 * G1–G6 each exist as an isolated, individually-verified script. Nothing ran them together in the
 * correct dependency order against one app with one honest aggregate verdict — the ordering lived only
 * as prose in agent .md files. This orchestrator closes that composition gap: it runs the sequence,
 * short-circuits honestly, records each concrete outcome to the ledger (G5), and emits one verdict.
 *
 * Sequence (per-build): provision-check (G6) → exec-runner (G1) → trace-check (G2) → regression-check
 * (G4). plan-check (G3) is a PRE-dev gate on a plan file, so it runs only when --plan is supplied, as a
 * separate phase before the build sequence.
 *
 * Honest short-circuit (P0): once a gate is FAILED or NOT_RUN, every downstream gate is SKIPPED —
 * never run, never faked. A SKIPPED gate is reported as SKIPPED, never as PASS (running a downstream
 * check on untrustworthy upstream evidence would fabricate a pass). Aggregate verdict:
 *   any gate FAILED → FAIL ; else any gate NOT_RUN → NOT_RUN ; else PASS.
 *
 * This module decides ORDERING and AGGREGATION only. Each gate's own pass/fail logic is unchanged and
 * owned by its module — reused here via require(), never reimplemented.
 *
 * Usage: node scripts/gates.js <dir> [--plan plan.json] [--trace trace.json]
 *        [--current results.json] [--baseline baseline.json] [--ledger path] [--json]
 * Exit: 0 PASS, 1 FAIL, 2 NOT_RUN / usage error.
 */

const fs = require('fs');
const provisionCheck = require('./provision-check');
const execRunner = require('./exec-runner');
const traceCheck = require('./trace-check');
const regressionCheck = require('./regression-check');
const planCheck = require('./plan-check');
const ledger = require('./ledger');

// exec-runner uses PASSED/FAILED/NOT_RUN; the other modules return {ok}. Normalize everything to a
// single vocabulary: PASSED | FAILED | NOT_RUN.
function okToStatus(ev, { notRunWhen } = {}) {
  if (notRunWhen && notRunWhen(ev)) return 'NOT_RUN';
  return ev.ok ? 'PASSED' : 'FAILED';
}

// Map the run vocabulary to the ledger's status vocabulary (PASS/FAIL/NOT_RUN).
function ledgerStatus(status) {
  if (status === 'PASSED') return 'PASS';
  if (status === 'FAILED') return 'FAIL';
  return 'NOT_RUN';
}

/**
 * Pure orchestration core: given ordered steps [{name, run: () => {status, reason}}], apply honest
 * short-circuiting + ledger recording + aggregation. Exposed for deterministic unit testing.
 */
function runSequence(steps, { ledgerImpl = ledger, ledgerFile, runId, appendLedger = true } = {}) {
  const gates = [];
  let shortCircuit = null; // holds the upstream status that tripped the short-circuit

  for (const step of steps) {
    if (shortCircuit) {
      gates.push({ name: step.name, status: 'SKIPPED', reason: `upstream ${shortCircuit}` });
      continue; // SKIPPED gates are never run and never recorded as a pass
    }
    let res;
    try { res = step.run() || {}; }
    catch (e) { res = { status: 'FAILED', reason: `gate threw: ${e.message}` }; }
    const status = res.status || 'NOT_RUN';
    const reason = res.reason || null;
    gates.push({ name: step.name, status, reason });

    if (appendLedger && ledgerImpl) {
      try { ledgerImpl.append({ run_id: runId, gate: step.name, status: ledgerStatus(status), reason }, ledgerFile); }
      catch (_) { /* ledger is advisory (G5) — a ledger write failure never changes a gate verdict */ }
    }
    if (status === 'FAILED' || status === 'NOT_RUN') shortCircuit = status;
  }

  let verdict = 'PASS';
  if (gates.some(g => g.status === 'FAILED')) verdict = 'FAIL';
  else if (gates.some(g => g.status === 'NOT_RUN')) verdict = 'NOT_RUN';
  return { gates, verdict };
}

function readJsonIfPresent(file) {
  if (!file || !fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

/** Wire the real gate modules into an ordered step list for a target dir. */
function buildSteps(dir, opts) {
  const steps = [];

  steps.push({ name: 'provision', run: () => {
    const ev = provisionCheck.evaluate(dir, opts.env || process.env);
    // Missing required env is NOT_RUN (env not ready) — distinct from a code FAILED (honest, G6).
    return { status: ev.ok ? 'PASSED' : 'NOT_RUN', reason: ev.ok ? null : `missing required env: ${ev.missing.join(', ')}` };
  }});

  steps.push({ name: 'exec', run: () => {
    const ev = execRunner.run(dir, 'all', opts.timeout || 120000);
    const failed = ev.results.find(r => r.status === 'FAILED');
    return { status: ev.status, reason: failed ? `${failed.phase}: ${failed.reason || 'exit ' + failed.exit}` : (ev.reason || null) };
  }});

  steps.push({ name: 'trace', run: () => {
    const trace = readJsonIfPresent(opts.traceFile);
    if (!trace) return { status: 'NOT_RUN', reason: 'no traceability file supplied' };
    const ev = traceCheck.evaluate(trace);
    return { status: okToStatus(ev), reason: ev.ok ? null : `uncovered:${(ev.uncovered || []).join(',')} failing:${(ev.failing || []).join(',')} not_run:${(ev.not_run || []).join(',')}` };
  }});

  steps.push({ name: 'regression', run: () => {
    const current = readJsonIfPresent(opts.currentFile);
    if (!current) return { status: 'NOT_RUN', reason: 'no current results supplied' };
    const baseline = readJsonIfPresent(opts.baselineFile) || {};
    const ev = regressionCheck.evaluate(current, baseline);
    return { status: ev.ok ? 'PASSED' : 'FAILED', reason: ev.ok ? null : `regression: ${ev.regression.join(', ')}` };
  }});

  return steps;
}

/** Run the full per-build sequence against a target dir. */
function run(dir, opts = {}) {
  const steps = buildSteps(dir, opts);
  const { gates, verdict } = runSequence(steps, { ledgerFile: opts.ledgerFile, runId: opts.runId, appendLedger: opts.appendLedger !== false });
  return { dir, gates, verdict };
}

/** Optional pre-dev plan gate (G3) — separate phase, only when a plan file is supplied. */
function runPlanGate(planFile) {
  const plan = readJsonIfPresent(planFile);
  if (!plan) return { name: 'plan', status: 'NOT_RUN', reason: 'no plan file' };
  const ev = planCheck.evaluate(plan);
  return { name: 'plan', status: ev.ok ? 'PASSED' : 'FAILED', reason: ev.ok ? null : 'plan structurally unsound (see plan-check)' };
}

function parseFlags(args) {
  const flags = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2);
      const next = args[i + 1];
      flags[key] = (next && !next.startsWith('--')) ? next : true;
    }
  }
  return flags;
}

function main(argv) {
  const args = argv.slice(2);
  const flags = parseFlags(args);
  const json = !!flags.json;
  const dir = args.find(a => !a.startsWith('--') && args[args.indexOf(a) - 1] !== '--plan'
    && args[args.indexOf(a) - 1] !== '--trace' && args[args.indexOf(a) - 1] !== '--current'
    && args[args.indexOf(a) - 1] !== '--baseline' && args[args.indexOf(a) - 1] !== '--ledger');
  if (!dir) { console.error('usage: gates.js <dir> [--plan p] [--trace t] [--current c] [--baseline b] [--ledger l] [--json]'); return 2; }

  const opts = {
    traceFile: typeof flags.trace === 'string' ? flags.trace : null,
    currentFile: typeof flags.current === 'string' ? flags.current : null,
    baselineFile: typeof flags.baseline === 'string' ? flags.baseline : null,
    ledgerFile: typeof flags.ledger === 'string' ? flags.ledger : ledger.DEFAULT_FILE,
    runId: `gates-${dir}`
  };

  const planGate = typeof flags.plan === 'string' ? runPlanGate(flags.plan) : null;
  const result = run(dir, opts);
  if (planGate) result.gates.unshift(planGate); // report the pre-dev plan gate first if supplied

  if (json) console.log(JSON.stringify(result, null, 2));
  else {
    console.log(`gates: ${dir} → ${result.verdict}`);
    for (const g of result.gates) console.log(`  ${g.name.padEnd(11)} ${g.status}${g.reason ? ' — ' + g.reason : ''}`);
    if (result.verdict !== 'PASS') console.log('  (SKIPPED = never run on untrustworthy upstream evidence — honest, not a pass)');
  }
  return result.verdict === 'PASS' ? 0 : (result.verdict === 'FAIL' ? 1 : 2);
}

if (require.main === module) process.exit(main(process.argv));

module.exports = { runSequence, buildSteps, run, runPlanGate, ledgerStatus, main };
