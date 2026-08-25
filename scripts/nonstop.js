#!/usr/bin/env node

/**
 * CoolHan nonstop — the OUTER loop: an unattended supervisor that drives sessions until the
 * backlog is complete (G13, v2.0.0). This is the missing piece of true 무중단(non-stop) loop
 * development: G10 loops WITHIN a unit, G11 stops a session from quitting early — but when a
 * session genuinely ends (context exhausted, process exit, crash), continuing still depended on
 * a human pasting the baton. This supervisor removes that human step:
 *
 *   while backlog incomplete:
 *     launch a fresh Claude Code session with the resume command (headless: `claude -p ...`)
 *     session works units, G11 keeps it looping, baton state persists in _workspace
 *     session ends → supervisor re-checks completion → relaunches → ... until done
 *
 * Stop conditions (each printed honestly, never silent):
 *   COMPLETE      completion-check exit 0 → generates the G12 run report and exits 0
 *   STOP_APPROVED _workspace/_stop-approved.json exists (4-condition / P0 / ESCALATE —
 *                 a human decision is genuinely required) → exit 3
 *   NO_PROGRESS   3 consecutive sessions changed nothing in the backlog (wedged) → exit 4
 *   MAX_SESSIONS  --max-sessions reached (default 50, runaway cost valve) → exit 5
 *   CMD_ERROR     the session command itself cannot start → exit 2
 *
 * Usage:
 *   node scripts/nonstop.js [--workspace DIR] [--max-sessions N] [--resume-prompt "..."]
 *                           [--cmd-template "claude -p {prompt} --permission-mode bypassPermissions"]
 *                           [--json]
 *   {prompt} in the template is replaced with the (shell-quoted) resume prompt.
 *   Every session's exit code + output tail is appended to _workspace/_nonstop-log.jsonl.
 *
 * Honesty: the supervisor guarantees RELAUNCH until completion or a named stop — it cannot make
 * a session's work correct (G1–G11 do that inside each session), and it deliberately refuses to
 * spin forever on a run that makes no progress.
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const DEFAULT_PROMPT = '쿨한으로 개발 이어서 진행하라 (체크포인트 _workspace/_checkpoint.md)';
const DEFAULT_TEMPLATE = 'claude -p {prompt} --permission-mode bypassPermissions';
const TAIL = 1500;

function backlogState(ws) {
  const backlog = path.join(ws, '_backlog.md');
  if (!fs.existsSync(backlog)) return { exists: false, complete: false, snapshot: '' };
  const md = fs.readFileSync(backlog, 'utf8');
  let complete = false;
  try { complete = require('./completion-check').evaluate(md).ok; } catch (_) { /* treat as incomplete */ }
  return { exists: true, complete, snapshot: md };
}

function stopApproved(ws) {
  try { return JSON.parse(fs.readFileSync(path.join(ws, '_stop-approved.json'), 'utf8')); } catch (_) { return null; }
}

function runSession(template, prompt, cwd) {
  const quoted = `"${String(prompt).replace(/"/g, '\\"')}"`;
  const cmd = template.split('{prompt}').join(quoted);
  const r = spawnSync(cmd, { shell: true, cwd, encoding: 'utf8', timeout: 2 * 60 * 60 * 1000 });
  return {
    cmd,
    exit: r.status === null ? -1 : r.status,
    timed_out: r.status === null,
    output_tail: ((r.stdout || '') + (r.stderr || '')).slice(-TAIL)
  };
}

function appendLog(ws, entry) {
  try { fs.appendFileSync(path.join(ws, '_nonstop-log.jsonl'), JSON.stringify(entry) + '\n'); } catch (_) { /* non-fatal */ }
}

/**
 * Drive sessions until a terminal condition. `sessionRunner` is injectable for tests
 * (defaults to launching the real command template).
 */
function supervise(opts, sessionRunner) {
  const ws = opts.workspace;
  const runner = sessionRunner || (() => runSession(opts.cmdTemplate, opts.resumePrompt, opts.cwd || '.'));
  let noProgress = 0;

  for (let session = 1; session <= opts.maxSessions; session++) {
    const before = backlogState(ws);
    if (before.exists && before.complete) return { status: 'COMPLETE', sessions: session - 1 };
    const approved = stopApproved(ws);
    if (approved) return { status: 'STOP_APPROVED', sessions: session - 1, reason: approved.reason };

    const result = runner(session);
    appendLog(ws, { session, exit: result.exit, timed_out: !!result.timed_out, tail: (result.output_tail || '').slice(-400) });
    if (result.exit === undefined || result.spawn_error) {
      return { status: 'CMD_ERROR', sessions: session, reason: result.spawn_error || 'session command failed to start' };
    }

    const after = backlogState(ws);
    if (after.exists && after.complete) return { status: 'COMPLETE', sessions: session };
    const approvedAfter = stopApproved(ws);
    if (approvedAfter) return { status: 'STOP_APPROVED', sessions: session, reason: approvedAfter.reason };

    if (after.snapshot === before.snapshot) {
      noProgress += 1;
      if (noProgress >= 3) return { status: 'NO_PROGRESS', sessions: session, reason: '3 consecutive sessions changed nothing in the backlog' };
    } else {
      noProgress = 0;
    }
  }
  return { status: 'MAX_SESSIONS', sessions: opts.maxSessions, reason: `${opts.maxSessions} sessions reached without completion` };
}

const EXIT = { COMPLETE: 0, CMD_ERROR: 2, STOP_APPROVED: 3, NO_PROGRESS: 4, MAX_SESSIONS: 5 };

function main(argv) {
  const args = argv.slice(2);
  const get = f => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined; };
  const json = args.includes('--json');
  const opts = {
    workspace: get('--workspace') || '_workspace',
    maxSessions: parseInt(get('--max-sessions') || '50', 10),
    resumePrompt: get('--resume-prompt') || DEFAULT_PROMPT,
    cmdTemplate: get('--cmd-template') || DEFAULT_TEMPLATE
  };
  if (!fs.existsSync(opts.workspace)) { console.error(`✗ nonstop: workspace not found: ${opts.workspace} (start a CoolHan run first)`); return 2; }

  const result = supervise(opts);

  if (result.status === 'COMPLETE') {
    try { require('./run-report').main(['node', 'run-report.js', '--workspace', opts.workspace]); } catch (_) { /* report is best-effort */ }
  }
  if (json) console.log(JSON.stringify(result, null, 2));
  else if (result.status === 'COMPLETE') console.log(`✔ nonstop: backlog COMPLETE after ${result.sessions} session(s) — see ${path.join(opts.workspace, 'run-report.md')}`);
  else console.error(`■ nonstop: ${result.status} after ${result.sessions} session(s)${result.reason ? ` — ${result.reason}` : ''}`);
  return EXIT[result.status] !== undefined ? EXIT[result.status] : 2;
}

if (require.main === module) process.exit(main(process.argv));

module.exports = { supervise, backlogState, runSession, EXIT };
