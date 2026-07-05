#!/usr/bin/env node

/**
 * CoolHan trace-check — requirements traceability gate.
 *
 * Proves that every requirement is bound to at least one acceptance test and that the bound
 * test(s) passed. "Coverage" stops being asserted and becomes demonstrable per requirement.
 * Pairs with exec-runner (G1): the test STATUS should come from real execution, not narrative.
 *
 * Input: a traceability JSON file:
 * {
 *   "feature": "...",
 *   "requirements": [
 *     { "id": "R1", "text": "user can log in", "tests": ["T-login-ok"], "code": ["src/auth.py:40"] }
 *   ],
 *   "test_results": { "T-login-ok": "pass", "T-login-bad": "fail" }   // from real execution
 * }
 *
 * Usage: node scripts/trace-check.js <trace.json> [--json]
 * Exit: 0 if every requirement has ≥1 bound test AND all its bound tests passed; else 1.
 */

const fs = require('fs');

/**
 * Evaluate a traceability object. Returns
 * { feature, total, covered, uncovered:[], failing:[], not_run:[], ok, rows:[...] }.
 */
function evaluate(trace) {
  const results = trace.test_results || {};
  const reqs = Array.isArray(trace.requirements) ? trace.requirements : [];
  const rows = [];
  const uncovered = [];
  const failing = [];
  const notRun = [];

  for (const r of reqs) {
    const tests = Array.isArray(r.tests) ? r.tests : [];
    if (tests.length === 0) {
      uncovered.push(r.id);
      rows.push({ id: r.id, status: 'UNCOVERED', tests: [] });
      continue;
    }
    const statuses = tests.map(t => ({ test: t, status: results[t] || 'not_run' }));
    const anyFail = statuses.some(s => s.status === 'fail');
    const anyNotRun = statuses.some(s => s.status === 'not_run');
    let status;
    if (anyFail) { status = 'FAILING'; failing.push(r.id); }
    else if (anyNotRun) { status = 'NOT_RUN'; notRun.push(r.id); }
    else { status = 'PASS'; }
    rows.push({ id: r.id, status, tests: statuses });
  }

  const covered = reqs.length - uncovered.length;
  // Gate passes only if: every requirement covered, none failing, none not_run.
  const ok = reqs.length > 0 && uncovered.length === 0 && failing.length === 0 && notRun.length === 0;
  return {
    feature: trace.feature || null,
    total: reqs.length, covered,
    uncovered, failing, not_run: notRun,
    ok, rows
  };
}

function main(argv) {
  const args = argv.slice(2);
  const json = args.includes('--json');
  const file = args.find(a => !a.startsWith('--'));
  if (!file) {
    console.error('usage: trace-check.js <trace.json> [--json]');
    return 2;
  }
  let trace;
  try {
    trace = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    console.error(`trace-check: cannot read/parse ${file}: ${e.message}`);
    return 2;
  }
  const ev = evaluate(trace);

  if (json) {
    console.log(JSON.stringify(ev, null, 2));
  } else {
    console.log(`trace-check: ${ev.feature || file} — ${ev.covered}/${ev.total} requirements covered`);
    for (const row of ev.rows) {
      const mark = row.status === 'PASS' ? '✔' : (row.status === 'UNCOVERED' ? '∅' : '✗');
      console.log(`  ${mark} ${row.id.padEnd(6)} ${row.status}` +
        (row.tests.length ? `  [${row.tests.map(t => `${t.test}:${t.status}`).join(', ')}]` : '  (no bound test)'));
    }
    if (ev.uncovered.length) console.log(`  UNCOVERED requirements: ${ev.uncovered.join(', ')}`);
    if (ev.failing.length) console.log(`  FAILING requirements: ${ev.failing.join(', ')}`);
    if (ev.not_run.length) console.log(`  NOT_RUN (untrusted): ${ev.not_run.join(', ')}`);
    console.log(ev.ok
      ? '✔ every requirement is bound to a passing acceptance test'
      : '✗ traceability gate FAILED — not every requirement has a passing bound test');
    console.log('  (traceability proves each requirement has a passing test, not that the requirements are complete/correct)');
  }
  return ev.ok ? 0 : 1;
}

if (require.main === module) {
  process.exit(main(process.argv));
}

module.exports = { evaluate, main };
