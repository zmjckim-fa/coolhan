#!/usr/bin/env node

/**
 * CoolHan parallel-plan — compute safe parallel execution waves from a plan (G9).
 *
 * Multi-Agent Orchestration / Parallel Agent Development support: instead of always executing
 * backlog units strictly one-by-one, the orchestrator can dispatch INDEPENDENT units to parallel
 * worker agents. This script computes, mechanically, which units may run together:
 *
 *   wave N = units whose deps are all satisfied by earlier waves
 *            AND whose declared file sets do not overlap with any other unit in the same wave
 *            (file-overlapping units are serialized within/across waves — two agents writing the
 *             same file is a merge conflict, not parallelism).
 *
 * Input plan JSON (same shape as plan-check.js, `files` optional per unit):
 * {
 *   "units": [
 *     { "id": "U1", "deps": [], "files": ["src/db.js"], "verifies": "..." },
 *     { "id": "U2", "deps": [], "files": ["src/api.js"], "verifies": "..." }
 *   ]
 * }
 *
 * Output (--json): { ok, waves: [["U1","U2"], ...], serialized: [{unit, with, reason}], errors }
 * A unit with no `files` array is treated as potentially-conflicting with everything
 * (unknown footprint → never parallelized; honest default over an optimistic guess).
 *
 * Usage: node scripts/parallel-plan.js <plan.json> [--json]
 * Exit: 0 = plan computed; 1 = structural error (cycle, missing dep, no units).
 *
 * Honesty: proves only that the DECLARED dependency/file sets permit parallel dispatch.
 * It cannot see undeclared coupling (shared runtime state, implicit ordering) — G3's plan
 * review and the per-unit Validator gate remain in force for each parallel worker's output,
 * and merged results still pass validation serially.
 */

const fs = require('fs');

function computeWaves(units) {
  const errors = [];
  if (!Array.isArray(units) || units.length === 0) {
    return { ok: false, waves: [], serialized: [], errors: ['no units in plan'] };
  }
  const byId = new Map(units.map(u => [u.id, u]));
  for (const u of units) {
    for (const d of (u.deps || [])) {
      if (!byId.has(d)) errors.push(`unit ${u.id} depends on missing unit ${d}`);
    }
  }
  if (errors.length) return { ok: false, waves: [], serialized: [], errors };

  const filesOf = u => Array.isArray(u.files) ? u.files : null; // null = unknown footprint
  const overlaps = (a, b) => {
    const fa = filesOf(a), fb = filesOf(b);
    if (fa === null || fb === null) return true; // unknown → assume conflict
    return fa.some(f => fb.includes(f));
  };

  const done = new Set();
  const waves = [];
  const serialized = [];
  const remaining = units.slice();

  while (remaining.length) {
    const ready = remaining.filter(u => (u.deps || []).every(d => done.has(d)));
    if (ready.length === 0) {
      errors.push('dependency cycle among: ' + remaining.map(u => u.id).join(', '));
      return { ok: false, waves, serialized, errors };
    }
    // Greedy conflict-free packing in listed order (deterministic).
    const wave = [];
    for (const u of ready) {
      const clash = wave.find(w => overlaps(u, w));
      if (clash) {
        serialized.push({ unit: u.id, with: clash.id, reason: filesOf(u) === null || filesOf(clash) === null ? 'unknown-footprint' : 'file-overlap' });
      } else {
        wave.push(u);
      }
    }
    waves.push(wave.map(u => u.id));
    wave.forEach(u => {
      done.add(u.id);
      remaining.splice(remaining.indexOf(u), 1);
    });
  }
  return { ok: true, waves, serialized, errors };
}

function main(argv) {
  const args = argv.slice(2);
  const json = args.includes('--json');
  const file = args.find(a => !a.startsWith('--'));
  if (!file) { console.error('usage: parallel-plan.js <plan.json> [--json]'); return 2; }

  let plan;
  try { plan = JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch (e) { console.error(`✗ parallel-plan: cannot read/parse ${file}: ${e.message}`); return 1; }

  const result = computeWaves(plan.units || []);

  if (json) {
    console.log(JSON.stringify(result, null, 2));
  } else if (!result.ok) {
    console.error(`✗ parallel-plan: ${result.errors.join('; ')}`);
  } else {
    console.log(`✔ parallel-plan: ${result.waves.length} wave(s)`);
    result.waves.forEach((w, i) => console.log(`  wave ${i + 1}: ${w.join(', ')}${w.length > 1 ? '  (parallel-safe)' : ''}`));
    for (const s of result.serialized) console.log(`  serialized: ${s.unit} (vs ${s.with}, ${s.reason})`);
  }
  return result.ok ? 0 : 1;
}

if (require.main === module) process.exit(main(process.argv));

module.exports = { computeWaves, main };
