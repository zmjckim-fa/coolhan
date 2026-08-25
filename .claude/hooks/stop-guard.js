#!/usr/bin/env node

/**
 * CoolHan stop-guard — Claude Code `Stop` hook (G11, v1.8.0).
 *
 * THE mechanical answer to "the AI keeps stopping to ask instead of looping":
 * every prior countermeasure (rule 8, the 4-condition gate, the UNIT PREAMBLE) was PROSE the
 * model had to voluntarily follow — nothing at the harness level prevented a turn from ending.
 * This hook runs when Claude attempts to end its turn. During an active CoolHan run with an
 * unfinished backlog, it BLOCKS the stop and re-injects the continue instruction, making the
 * loop enforced by the harness itself (Claude Code hooks execute outside the model).
 *
 * Activation contract (deliberately narrow — non-CoolHan sessions are untouched):
 *   blocks a stop ONLY when ALL hold:
 *     1. `_workspace/_run-active.json` exists   (engine Phase 0 creates it; completion or a
 *        genuine stop condition removes it / writes _stop-approved)
 *     2. `_workspace/_stop-approved.json` absent (4-condition question, P0 gate, ESCALATE,
 *        destructive-op confirmation → the engine writes this file with the reason first;
 *        stopping is then legitimate)
 *     3. completion-check on `_workspace/_backlog.md` fails (units remain)
 *     4. the per-run block counter is under MAX_BLOCKS (runaway safety valve)
 *   anything else — missing files, script errors, completion reached — ALLOWS the stop
 *   (fail-open: a guard must never trap a user or brick a non-CoolHan repo).
 *
 * Claude Code contract: stdin = hook JSON ({hook_event_name:"Stop", stop_hook_active, ...});
 * stdout {"decision":"block","reason":...} forces continuation; anything else allows.
 *
 * Honesty: this enforces "the turn does not end while backlog units remain" — it cannot make
 * the continued work GOOD (that stays with the G1–G10 gates it tells the model to satisfy).
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const MAX_BLOCKS = 25; // per run — safety valve against a wedged loop blocking stop forever

/** Pure decision core (unit-tested). All inputs are plain values. */
function decide(s) {
  if (!s.runActive) return { action: 'allow', why: 'no active CoolHan run' };
  if (s.stopApproved) return { action: 'allow', why: `stop approved: ${s.stopApprovedReason || 'recorded stop condition'}` };
  if (s.completionOk) return { action: 'allow', why: 'backlog complete (completion-check exit 0)' };
  if (s.blockCount >= s.maxBlocks) {
    return { action: 'allow', why: `safety valve: ${s.maxBlocks} blocks reached this run — allowing stop; investigate the loop` };
  }
  return {
    action: 'block',
    why: 'backlog incomplete',
    reason:
      `CoolHan run ${s.runId || ''} is active and the backlog is NOT complete` +
      (s.remaining ? ` (remaining: ${s.remaining})` : '') +
      '. Per the Non-Stop Execution rules: do not end the turn to ask — questions outside the 4 ' +
      'Auto-Pilot conditions are stop-excuses; pick the safest 기획서-consistent default, log it in ' +
      'docs/DECISIONS.md, and continue the next unit NOW (re-read _workspace/_goal.md + _backlog.md; ' +
      'zero prose until the final ≤5-line report). If a GENUINE stop condition applies ' +
      '(real credential / payment / irreversible prod-data destruction / incompatible requirements / ' +
      'P0 gate / ESCALATE), write _workspace/_stop-approved.json {"reason": "..."} first — then stopping is permitted.'
  };
}

function readJson(p) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (_) { return null; }
}

function gatherState(root) {
  const ws = path.join(root, '_workspace');
  const runActiveFile = path.join(ws, '_run-active.json');
  const runActive = fs.existsSync(runActiveFile);
  const runId = runActive ? (readJson(runActiveFile) || {}).run_id : undefined;
  const stopApprovedJson = readJson(path.join(ws, '_stop-approved.json'));
  const stopApproved = stopApprovedJson !== null;

  let completionOk = false, remaining = '';
  const backlog = path.join(ws, '_backlog.md');
  const checker = path.join(root, 'scripts', 'completion-check.js');
  if (runActive && fs.existsSync(backlog) && fs.existsSync(checker)) {
    const r = spawnSync(process.execPath, [checker, backlog], { encoding: 'utf8', timeout: 30000 });
    completionOk = r.status === 0;
    if (!completionOk) remaining = ((r.stdout || '') + (r.stderr || '')).split(/\r?\n/).filter(Boolean).slice(0, 3).join(' | ').slice(0, 400);
  } else if (runActive) {
    // Active run but no backlog/checker to judge by — cannot prove incompleteness; fail open.
    completionOk = true;
  }

  const counterFile = path.join(ws, '_stop-guard-count.json');
  const counter = readJson(counterFile) || { run_id: runId, blocks: 0 };
  if (counter.run_id !== runId) { counter.run_id = runId; counter.blocks = 0; }

  return {
    runActive, runId, stopApproved,
    stopApprovedReason: stopApprovedJson ? stopApprovedJson.reason : undefined,
    completionOk, remaining,
    blockCount: counter.blocks, maxBlocks: MAX_BLOCKS,
    _counterFile: counterFile, _counter: counter, _runActiveFile: runActiveFile
  };
}

function main() {
  let raw = '';
  try { raw = fs.readFileSync(0, 'utf8'); } catch (_) { /* no stdin — treat as empty */ }
  // Input JSON is read for protocol compliance; the decision keys off workspace state.
  try { JSON.parse(raw || '{}'); } catch (_) { /* malformed input → still fail open below */ }

  let state;
  try { state = gatherState(process.cwd()); } catch (e) {
    // Fail open — never trap the user because the guard itself broke.
    process.stdout.write(JSON.stringify({ suppressOutput: true }));
    return 0;
  }

  const d = decide(state);
  if (d.action === 'block') {
    state._counter.blocks += 1;
    try { fs.writeFileSync(state._counterFile, JSON.stringify(state._counter)); } catch (_) { /* non-fatal */ }
    process.stdout.write(JSON.stringify({ decision: 'block', reason: d.reason }));
  } else {
    // On clean completion, retire the run marker so later sessions aren't guarded by mistake.
    if (state.runActive && state.completionOk && !state.stopApproved) {
      try { fs.unlinkSync(state._runActiveFile); } catch (_) { /* non-fatal */ }
    }
    process.stdout.write(JSON.stringify({ suppressOutput: true }));
  }
  return 0;
}

if (require.main === module) process.exit(main());

module.exports = { decide, gatherState, MAX_BLOCKS };
