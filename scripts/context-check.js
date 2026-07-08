#!/usr/bin/env node

/**
 * CoolHan context-check — mandatory context-ingestion gate BEFORE development (G8-A).
 *
 * User-reported defect: on "쿨한으로 작업하라" the harness acted on the latest message alone and
 * produced wrong output because it never actually read the full spec + prior development first.
 * Root cause: Phase 0 only checked whether _workspace outputs EXISTED, not that they were read.
 *
 * This gate requires the orchestrator to first read the declared sources (goal, backlog, spec,
 * CLAUDE.md history, prior _workspace artifacts, relevant knowledge_base) and record a per-run
 * digest at _workspace/_context-digest.json. Development may not proceed until this digest exists,
 * is fresh (matches the current run_id), and references every required source.
 *
 * Digest shape:
 * {
 *   "run_id": "20260707-...",
 *   "sources": {
 *     "goal": "<one-line summary of _goal.md>",
 *     "backlog": "<current unit / progress>",
 *     "spec": "<spec doc(s) read>",
 *     "history": "<relevant CLAUDE.md change-history read>",
 *     "prior_artifacts": "<prior _workspace outputs read, or 'none (initial run)'>"
 *   }
 * }
 * A source is "referenced" when its key is present with a non-empty string value.
 *
 * Usage:
 *   node scripts/context-check.js <digest.json> --run-id <id> [--required goal,backlog,spec,history,prior_artifacts] [--json]
 * Exit: 0 if the digest is fresh and covers every required source; else 1; 2 on usage/parse error.
 *
 * Honesty: this proves the declared sources were recorded as read — NOT that they were deeply
 * understood. It removes the "acted on last message only" failure mode; judgment quality is separate.
 */

const fs = require('fs');

const DEFAULT_REQUIRED = ['goal', 'backlog', 'spec', 'history', 'prior_artifacts'];

function evaluate(digest, runId, required = DEFAULT_REQUIRED) {
  const sources = (digest && digest.sources) || {};
  const stale = !!runId && digest && digest.run_id !== runId;
  const missing = required.filter(k => {
    const v = sources[k];
    return typeof v !== 'string' || v.trim() === '';
  });
  return {
    run_id: (digest && digest.run_id) || null,
    expected_run_id: runId || null,
    stale,
    required,
    present: required.filter(k => !missing.includes(k)),
    missing,
    ok: !stale && missing.length === 0
  };
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
  const file = args.find(a => !a.startsWith('--') && args[args.indexOf(a) - 1] !== '--run-id' && args[args.indexOf(a) - 1] !== '--required');
  if (!file) { console.error('usage: context-check.js <digest.json> --run-id <id> [--required k1,k2] [--json]'); return 2; }

  let digest;
  try { digest = JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch (e) { console.error(`context-check: cannot read/parse ${file}: ${e.message}`); return 2; }

  const runId = typeof flags['run-id'] === 'string' ? flags['run-id'] : null;
  const required = typeof flags.required === 'string' ? flags.required.split(',').map(s => s.trim()).filter(Boolean) : DEFAULT_REQUIRED;
  const ev = evaluate(digest, runId, required);

  if (json) console.log(JSON.stringify(ev, null, 2));
  else {
    console.log(`context-check: digest run_id=${ev.run_id || '(none)'}${ev.expected_run_id ? ` (expected ${ev.expected_run_id})` : ''}`);
    if (ev.stale) console.log('  ✗ stale digest — run_id does not match this run (context not re-read for the current command)');
    if (ev.missing.length) console.log(`  ✗ digest missing required source(s): ${ev.missing.join(', ')}`);
    console.log(ev.ok
      ? '✔ context ingested (all required sources recorded as read) — development may proceed'
      : '✗ context gate FAILED — read the full spec + prior development and write _context-digest.json before proceeding');
  }
  return ev.ok ? 0 : 1;
}

if (require.main === module) process.exit(main(process.argv));

module.exports = { evaluate, DEFAULT_REQUIRED, main };
