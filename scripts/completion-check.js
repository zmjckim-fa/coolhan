#!/usr/bin/env node

/**
 * CoolHan completion-check — 100%-completion gate before declaring a goal done (G8-B).
 *
 * User-reported defect: on "쿨한으로 작업하라" the harness stopped mid-work instead of running until
 * everything was finished. Root cause: nothing mechanically defined "done" as "the whole backlog is
 * complete and validated" — so a run could behave as finished (or pause at a natural break) while
 * units remained.
 *
 * This gate parses the backlog and permits a "✅ all complete" declaration ONLY when every unit is
 * both done AND validated. A unit that is todo / in-progress, or done-but-with-no-validation
 * evidence, keeps the goal incomplete. A context-limit baton is a CONTINUATION, never a completion:
 * the correct end states are (a) this gate PASSES, or (b) a genuine stop condition — not "I paused".
 *
 * Backlog format (markdown table, the CoolHan standard):
 *   | # | Unit | Files | Verification | Status |
 *   | U1 | ... | ... | pytest ... | ✅ done |
 *   | U2 | ... | ... | jest ...    | ⬜ todo |
 *
 * Status is DONE when it contains "done" / "✅" / "complete". A row is considered VALIDATED when its
 * Verification cell is non-empty (a concrete check was named) AND the row is done — because the
 * CoolHan rule is "no completion declaration without a validation result". Rows whose status is a
 * table separator / header are ignored.
 *
 * Usage: node scripts/completion-check.js <backlog.md> [--json]
 * Exit: 0 if 100% (every unit done + validated); 1 otherwise; 2 on usage/read error.
 *
 * Honesty: proves the backlog is fully done + each unit names a validation — NOT that the backlog
 * itself is the right/complete decomposition (that is G3/human judgment).
 */

const fs = require('fs');

const DONE_RE = /(✅|\bdone\b|\bcomplete\b)/i;

function parseBacklog(md) {
  const units = [];
  for (const line of md.split('\n')) {
    const t = line.trim();
    if (!t.startsWith('|')) continue;
    const cells = t.split('|').map(c => c.trim());
    // cells: ['', '#', 'Unit', 'Files', 'Verification', 'Status', '']
    const id = cells[1];
    if (!id || !/^U\d+$/i.test(id)) continue; // only unit rows (U1, U2, ...) — skips header/separator
    const verification = cells[4] || '';
    const status = cells[5] || '';
    units.push({ id, verification, status });
  }
  return units;
}

function evaluate(md) {
  const units = parseBacklog(md);
  const remaining = [];
  const unvalidated = [];
  for (const u of units) {
    const done = DONE_RE.test(u.status);
    const hasValidation = u.verification.trim() !== '';
    if (!done) remaining.push(u.id);
    else if (!hasValidation) unvalidated.push(u.id);
  }
  return {
    total: units.length,
    done: units.length - remaining.length,
    remaining,
    unvalidated,
    ok: units.length > 0 && remaining.length === 0 && unvalidated.length === 0
  };
}

function main(argv) {
  const args = argv.slice(2);
  const json = args.includes('--json');
  const file = args.find(a => !a.startsWith('--'));
  if (!file) { console.error('usage: completion-check.js <backlog.md> [--json]'); return 2; }

  let md;
  try { md = fs.readFileSync(file, 'utf8'); }
  catch (e) { console.error(`completion-check: cannot read ${file}: ${e.message}`); return 2; }

  const ev = evaluate(md);
  if (json) console.log(JSON.stringify(ev, null, 2));
  else {
    console.log(`completion-check: ${ev.done}/${ev.total} units done`);
    if (ev.remaining.length) console.log(`  ✗ not done: ${ev.remaining.join(', ')}`);
    if (ev.unvalidated.length) console.log(`  ✗ done but no validation named: ${ev.unvalidated.join(', ')}`);
    console.log(ev.ok
      ? '✔ 100% complete — every unit done and validated; "✅ all complete" is permitted'
      : '✗ NOT complete — keep going (a baton/pause is not a completion); finish every unit before declaring done');
  }
  return ev.ok ? 0 : 1;
}

if (require.main === module) process.exit(main(process.argv));

module.exports = { evaluate, parseBacklog, main };
