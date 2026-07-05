#!/usr/bin/env node

/**
 * CoolHan plan-check — validate a plan/backlog BEFORE coding (G3, pre-dev gate).
 *
 * Catches bad plans before units are wasted: every unit must have a verification, the dependency
 * graph must be acyclic with existing deps, the listed order must respect deps, and every
 * requirement must be covered by at least one unit.
 *
 * Input plan JSON:
 * {
 *   "feature": "...",
 *   "requirements": ["R1", "R2"],
 *   "units": [
 *     { "id": "U1", "deps": [], "verifies": "pytest test_model.py", "covers": ["R1"] },
 *     { "id": "U2", "deps": ["U1"], "verifies": "curl /api 200", "covers": ["R2"] }
 *   ]
 * }
 *
 * Usage: node scripts/plan-check.js <plan.json> [--json]
 * Exit: 0 if the plan is structurally sound; else 1.
 *
 * Honesty: a passing plan is coherent/testable/decomposed — NOT proof the requirements are what
 * the user ultimately wanted (that remains human judgment).
 */

const fs = require('fs');

function findCycle(units) {
  const byId = Object.fromEntries(units.map(u => [u.id, u]));
  const WHITE = 0, GREY = 1, BLACK = 2;
  const color = {};
  units.forEach(u => { color[u.id] = WHITE; });
  const stack = [];
  let cycle = null;

  function dfs(id) {
    if (cycle) return;
    color[id] = GREY;
    stack.push(id);
    for (const d of (byId[id] && byId[id].deps) || []) {
      if (!byId[d]) continue;            // missing dep handled separately
      if (color[d] === GREY) {           // back-edge → cycle
        const from = stack.indexOf(d);
        cycle = stack.slice(from).concat(d);
        return;
      }
      if (color[d] === WHITE) dfs(d);
      if (cycle) return;
    }
    stack.pop();
    color[id] = BLACK;
  }

  for (const u of units) if (color[u.id] === WHITE) dfs(u.id);
  return cycle;
}

/** Validate a plan object. Returns a structured report + ok flag. */
function evaluate(plan) {
  const units = Array.isArray(plan.units) ? plan.units : [];
  const reqs = Array.isArray(plan.requirements) ? plan.requirements : [];
  const ids = new Set(units.map(u => u.id));

  const no_verify = units.filter(u => !u.verifies || String(u.verifies).trim() === '').map(u => u.id);
  const missing_deps = [];
  const order_violations = [];
  const unknown_covers = [];

  const seen = new Set();
  for (const u of units) {
    for (const d of (u.deps || [])) {
      if (!ids.has(d)) missing_deps.push({ unit: u.id, dep: d });
      else if (!seen.has(d)) order_violations.push({ unit: u.id, dep: d }); // dep listed after this unit
    }
    for (const c of (u.covers || [])) {
      if (!reqs.includes(c)) unknown_covers.push({ unit: u.id, req: c });
    }
    seen.add(u.id);
  }

  const covered = new Set(units.flatMap(u => u.covers || []));
  const uncovered_reqs = reqs.filter(r => !covered.has(r));
  const cycle = findCycle(units);

  const ok = units.length > 0 &&
    no_verify.length === 0 &&
    missing_deps.length === 0 &&
    order_violations.length === 0 &&
    unknown_covers.length === 0 &&
    uncovered_reqs.length === 0 &&
    !cycle;

  return {
    feature: plan.feature || null,
    total_units: units.length, total_reqs: reqs.length,
    no_verify, missing_deps, order_violations, unknown_covers, uncovered_reqs,
    cycle: cycle || null,
    ok
  };
}

function main(argv) {
  const args = argv.slice(2);
  const json = args.includes('--json');
  const file = args.find(a => !a.startsWith('--'));
  if (!file) { console.error('usage: plan-check.js <plan.json> [--json]'); return 2; }
  let plan;
  try { plan = JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch (e) { console.error(`plan-check: cannot read/parse ${file}: ${e.message}`); return 2; }

  const ev = evaluate(plan);
  if (json) { console.log(JSON.stringify(ev, null, 2)); }
  else {
    console.log(`plan-check: ${ev.feature || file} — ${ev.total_units} units, ${ev.total_reqs} requirements`);
    const line = (label, arr, fmt) => { if (arr && arr.length) console.log(`  ✗ ${label}: ${arr.map(fmt).join(', ')}`); };
    line('units without verification', ev.no_verify, x => x);
    line('missing dependencies', ev.missing_deps, x => `${x.unit}→${x.dep}`);
    line('ordering violations (dep after unit)', ev.order_violations, x => `${x.unit} before ${x.dep}`);
    line('covers unknown requirement', ev.unknown_covers, x => `${x.unit}:${x.req}`);
    line('uncovered requirements', ev.uncovered_reqs, x => x);
    if (ev.cycle) console.log(`  ✗ dependency cycle: ${ev.cycle.join(' → ')}`);
    console.log(ev.ok
      ? '✔ plan is structurally sound (each unit verifiable, deps acyclic + ordered, all requirements covered)'
      : '✗ plan gate FAILED — fix the above before coding');
    console.log('  (a sound plan is coherent/testable/decomposed, not proof the requirements are what the user wanted)');
  }
  return ev.ok ? 0 : 1;
}

if (require.main === module) process.exit(main(process.argv));

module.exports = { evaluate, findCycle, main };
