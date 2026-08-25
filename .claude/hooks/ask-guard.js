#!/usr/bin/env node

/**
 * CoolHan ask-guard — Claude Code `PreToolUse` hook for AskUserQuestion (G11b, v1.8.1).
 *
 * Closes the gap the Stop hook cannot see: a model that asks via the AskUserQuestion tool has
 * NOT ended its turn — the session just parks waiting for human input, so stop-guard.js never
 * fires. With permissions set to bypass, this was the remaining way runs kept "stopping to ask".
 *
 * During an active CoolHan run (`_workspace/_run-active.json`) whose backlog is incomplete and
 * with no recorded stop condition (`_workspace/_stop-approved.json`), an AskUserQuestion call is
 * DENIED with the standing instruction: outside the 4 Auto-Pilot conditions, pick the safest
 * 기획서-consistent default, log it in docs/DECISIONS.md, and continue. A genuine 4-condition /
 * P0 / ESCALATE ask stays possible — write _stop-approved.json {"reason"} first, then ask.
 *
 * Fail-open like stop-guard: no run marker, completed backlog, recorded stop condition, guard
 * error, or the shared 25-block safety valve → the question is allowed.
 */

const fs = require('fs');
const { decide, gatherState } = require('./stop-guard');

function main() {
  try { fs.readFileSync(0, 'utf8'); } catch (_) { /* input unused — decision keys off workspace state */ }

  let state;
  try { state = gatherState(process.cwd()); } catch (_) {
    process.stdout.write(JSON.stringify({ suppressOutput: true }));
    return 0; // fail open
  }

  const d = decide(state); // same matrix as stop-guard: block only active+incomplete+unapproved
  if (d.action === 'block') {
    state._counter.blocks += 1;
    try { fs.writeFileSync(state._counterFile, JSON.stringify(state._counter)); } catch (_) { /* non-fatal */ }
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason:
          'CoolHan run active with an incomplete backlog — asking the human here is a stop-excuse ' +
          '(rule 8 / Auto-Pilot). Choose the safest 기획서-consistent default, log it in ' +
          'docs/DECISIONS.md, and continue the next unit. If this is genuinely one of the 4 ' +
          'conditions (credential/payment/irreversible prod-data destruction/incompatible ' +
          'requirements) or a P0/ESCALATE stop, write _workspace/_stop-approved.json {"reason":"..."} ' +
          'first — the question will then be permitted.'
      }
    }));
  } else {
    process.stdout.write(JSON.stringify({ suppressOutput: true }));
  }
  return 0;
}

if (require.main === module) process.exit(main());

module.exports = {};
