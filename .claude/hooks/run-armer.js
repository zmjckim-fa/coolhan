#!/usr/bin/env node

/**
 * CoolHan run-armer — Claude Code `UserPromptSubmit` hook (G11c, v1.8.1).
 *
 * The stop-guard/ask-guard only enforce while `_workspace/_run-active.json` exists — and until
 * now ARMING that marker was itself a prose instruction the model had to follow (engine Phase 0).
 * A run that never armed was never guarded. This hook makes arming mechanical: when the USER'S
 * OWN prompt is a CoolHan continuous-development command, the marker is written by the harness
 * before the model even sees the prompt.
 *
 * Trigger (conservative — arming a chat/inspection session would wrongly block its stops):
 *   prompt mentions CoolHan (쿨한/coolhan) AND a develop/continue verb
 *   (개발/이어서/연속/진행하라/continue/develop/resume/keep developing), or is a /loop command
 *   containing a CoolHan phrase — AND is NOT an inspection/ops ask
 *   (업데이트/update/확인/check/검토/review/점검/질문).
 *
 * On arming it also clears a stale `_stop-approved.json` (a stop approved in a PREVIOUS run must
 * not pre-authorize stopping the new one) and injects a one-line context reminder of the loop
 * contract. Non-matching prompts pass through untouched.
 */

const fs = require('fs');
const path = require('path');

const COOLHAN = /쿨한|coolhan/i;
const RUN_VERB = /개발|이어서|연속|진행하라|계속하라|continue|develop|resume|keep developing|\/loop/i;
const INSPECTION = /업데이트|update|확인|check for|검토|review|점검|버전|version|설치|install|doctor/i;

function shouldArm(prompt) {
  const p = String(prompt || '');
  return COOLHAN.test(p) && RUN_VERB.test(p) && !INSPECTION.test(p);
}

function arm(root, prompt) {
  const ws = path.join(root, '_workspace');
  fs.mkdirSync(ws, { recursive: true });
  const marker = path.join(ws, '_run-active.json');
  const runId = 'run-' + Date.now().toString(36);
  fs.writeFileSync(marker, JSON.stringify({ run_id: runId, armed_by: 'run-armer-hook', prompt_head: String(prompt || '').slice(0, 120) }));
  const stale = path.join(ws, '_stop-approved.json');
  try { fs.unlinkSync(stale); } catch (_) { /* none existed */ }
  return runId;
}

function main() {
  let input = {};
  try { input = JSON.parse(fs.readFileSync(0, 'utf8') || '{}'); } catch (_) { /* fail open */ }

  try {
    if (shouldArm(input.prompt)) {
      const runId = arm(process.cwd(), input.prompt);
      process.stdout.write(JSON.stringify({
        hookSpecificOutput: {
          hookEventName: 'UserPromptSubmit',
          additionalContext:
            `[CoolHan G11] Run ${runId} ARMED by the harness. The Stop hook will block turn-ends and ` +
            'AskUserQuestion is denied while the backlog is incomplete — outside the 4 Auto-Pilot ' +
            'conditions, choose safest defaults, log to docs/DECISIONS.md, and keep working until ' +
            'completion-check exits 0 (or write _workspace/_stop-approved.json {"reason"} for a genuine stop).'
        }
      }));
      return 0;
    }
  } catch (_) { /* fall through to no-op */ }
  process.stdout.write(JSON.stringify({ suppressOutput: true }));
  return 0;
}

if (require.main === module) process.exit(main());

module.exports = { shouldArm, arm };
