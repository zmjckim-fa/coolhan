#!/usr/bin/env node

/**
 * CoolHan regression-check — full-suite regression gate BEFORE deploy (G4).
 *
 * G1 (exec-runner) proves a unit's own tests really ran. G2 (trace-check) proves each requirement
 * has a passing bound test. Neither catches a change silently breaking something ELSE that was
 * already passing. This gate diffs a current full-suite result against a stored baseline:
 *   - regression: baseline=pass, current=fail   → BLOCKS (this is the only failure mode)
 *   - new:        not in baseline, current=any  → informational, not a regression
 *   - fixed:      baseline=fail, current=pass   → informational
 *   - unaffected: baseline=fail, current=fail   → informational, not a regression (pre-existing)
 *   - still_pass: baseline=pass, current=pass   → informational
 *
 * Input current-results JSON: { "test_name": "pass"|"fail", ... }  (produced from a real exec-runner
 * run — never hand-written; that is a G1/C10 violation, not this gate's job to prevent).
 * Baseline JSON: same shape, stored at _workspace/_test-baseline.json (or path given).
 *
 * Usage:
 *   node scripts/regression-check.js <current.json> <baseline.json> [--json]
 *   node scripts/regression-check.js <current.json> <baseline.json> --update-baseline
 *     (only meaningful after a clean/approved run — overwrites baseline with current)
 *
 * Exit: 0 if no regressions; 1 if any regression found; 2 on usage/parse error.
 *
 * Honesty: a passing gate means "nothing that passed before still fails" — not that coverage is
 * adequate (G2) or the plan was sound (G3).
 */

const fs = require('fs');

function evaluate(current, baseline) {
  const currentKeys = Object.keys(current || {});
  const baselineKeys = Object.keys(baseline || {});
  const allKeys = new Set([...currentKeys, ...baselineKeys]);

  const regression = [];
  const fixed = [];
  const still_pass = [];
  const unaffected = [];
  const added = [];
  const removed = [];

  for (const name of allKeys) {
    const hasCurrent = Object.prototype.hasOwnProperty.call(current || {}, name);
    const hasBaseline = Object.prototype.hasOwnProperty.call(baseline || {}, name);

    if (hasBaseline && !hasCurrent) { removed.push(name); continue; }
    if (!hasBaseline && hasCurrent) { added.push(name); continue; }

    const b = baseline[name];
    const c = current[name];
    if (b === 'pass' && c === 'fail') regression.push(name);
    else if (b === 'fail' && c === 'pass') fixed.push(name);
    else if (b === 'pass' && c === 'pass') still_pass.push(name);
    else if (b === 'fail' && c === 'fail') unaffected.push(name);
  }

  return {
    total_current: currentKeys.length,
    total_baseline: baselineKeys.length,
    regression, fixed, still_pass, unaffected, added, removed,
    ok: regression.length === 0
  };
}

function main(argv) {
  const args = argv.slice(2);
  const json = args.includes('--json');
  const updateBaseline = args.includes('--update-baseline');
  const files = args.filter(a => !a.startsWith('--'));
  const [currentFile, baselineFile] = files;
  if (!currentFile || !baselineFile) {
    console.error('usage: regression-check.js <current.json> <baseline.json> [--json] [--update-baseline]');
    return 2;
  }

  let current, baseline;
  try { current = JSON.parse(fs.readFileSync(currentFile, 'utf8')); }
  catch (e) { console.error(`regression-check: cannot read/parse ${currentFile}: ${e.message}`); return 2; }
  try {
    baseline = fs.existsSync(baselineFile) ? JSON.parse(fs.readFileSync(baselineFile, 'utf8')) : {};
  } catch (e) { console.error(`regression-check: cannot read/parse ${baselineFile}: ${e.message}`); return 2; }

  const ev = evaluate(current, baseline);

  if (json) console.log(JSON.stringify(ev, null, 2));
  else {
    console.log(`regression-check: ${ev.total_current} current tests vs ${ev.total_baseline} baseline`);
    if (ev.regression.length) console.log(`  ✗ regression (was passing, now failing): ${ev.regression.join(', ')}`);
    if (ev.added.length) console.log(`  · new tests (no baseline entry): ${ev.added.join(', ')}`);
    if (ev.fixed.length) console.log(`  · fixed (was failing, now passing): ${ev.fixed.join(', ')}`);
    if (ev.unaffected.length) console.log(`  · unaffected (pre-existing failure, still failing): ${ev.unaffected.join(', ')}`);
    console.log(ev.ok
      ? '✔ no regressions — nothing that passed before now fails'
      : '✗ regression gate FAILED — a previously-passing test now fails, deploy blocked');
  }

  if (updateBaseline) {
    if (!ev.ok) {
      console.error('regression-check: refusing to update baseline while regressions are present');
      return 1;
    }
    fs.writeFileSync(baselineFile, JSON.stringify(current, null, 2));
    if (!json) console.log(`  baseline updated: ${baselineFile}`);
  }

  return ev.ok ? 0 : 1;
}

if (require.main === module) process.exit(main(process.argv));

module.exports = { evaluate, main };
