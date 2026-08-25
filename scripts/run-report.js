#!/usr/bin/env node

/**
 * CoolHan run-report — run observability in one artifact (G12, v1.9.0).
 *
 * The Foundation layer of the agent-loop roadmap (Evals / Observability / Security): the run
 * ledger (G5), loop state (G10), backlog (G8-B), proposals (v1.5.0) and design history (v1.7.0)
 * each record their slice, but nothing composed them into a picture a human can read after —
 * or during — a run. This script aggregates those artifacts into one report:
 *
 *   - backlog completion: done/validated/remaining counts + %
 *   - per-gate outcomes from the ledger (PASS/FAIL/NOT_RUN per gate, chronological)
 *   - per-unit loop stats from _loop-state.json (iterations, escalations, last feedback tail)
 *   - recurring failure lessons (G5 lessons(): same (gate, reason) >= 2x)
 *   - pending improvement proposals count, design-direction record
 *
 * Usage:
 *   node scripts/run-report.js [--workspace DIR] [--run-id ID] [--out FILE] [--json]
 *     defaults: workspace=_workspace, out=<workspace>/run-report.md (markdown always written
 *     unless --json-only behavior is desired via omitting --out? no: --json prints JSON to
 *     stdout AND still writes the markdown file)
 *
 * Exit: 0 report produced (even for an empty run — an honest "nothing recorded" report),
 *       2 usage/write error. This is an OBSERVER: it never changes a verdict, never blocks.
 *
 * Honesty: the report shows what the artifacts recorded — it cannot show work that bypassed
 * the gates, and a green report is only as trustworthy as the gates that fed it (G1–G11).
 */

const fs = require('fs');
const path = require('path');

function readJson(p, fallback) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (_) { return fallback; }
}

function readLines(p) {
  try { return fs.readFileSync(p, 'utf8').split(/\r?\n/).filter(Boolean); } catch (_) { return []; }
}

function collect(ws, runId) {
  const report = { run_id: runId || null, generated_from: ws, sections: {} };

  // Backlog completion (reuse completion-check's parser for one source of truth)
  let backlog = null;
  try {
    const cc = require('./completion-check');
    const md = fs.readFileSync(path.join(ws, '_backlog.md'), 'utf8');
    const ev = cc.evaluate(md);
    backlog = {
      total: ev.total, done_and_validated: ev.total - (ev.remaining ? ev.remaining.length : 0) - (ev.unvalidated ? ev.unvalidated.length : 0),
      remaining: ev.remaining || [], unvalidated: ev.unvalidated || [], complete: !!ev.ok
    };
  } catch (_) { backlog = null; }
  report.sections.backlog = backlog;

  // Ledger: per-gate outcome counts (+ optionally filtered by run_id)
  const ledgerFile = path.join(ws, '_ledger.jsonl');
  const entries = readLines(ledgerFile).map(l => { try { return JSON.parse(l); } catch (_) { return null; } }).filter(Boolean)
    .filter(e => !runId || e.run_id === runId);
  const gates = {};
  for (const e of entries) {
    const g = gates[e.gate] || (gates[e.gate] = { PASS: 0, FAIL: 0, NOT_RUN: 0, other: 0 });
    if (g[e.status] !== undefined) g[e.status] += 1; else g.other += 1;
  }
  report.sections.gates = { entries: entries.length, by_gate: gates };

  // Recurring lessons (advisory)
  let lessons = [];
  try {
    const ledger = require('./ledger');
    lessons = ledger.lessons(2, ledgerFile).map(x => ({ gate: x.gate, reason: x.reason, count: x.count }));
  } catch (_) { /* ledger module/file absent */ }
  report.sections.lessons = lessons;

  // Loop state (G10)
  const loop = readJson(path.join(ws, '_loop-state.json'), { units: {} });
  const units = Object.entries(loop.units || {}).map(([id, u]) => ({
    unit: id, status: u.status, iterations: (u.iterations || []).length,
    last_feedback: (() => {
      const last = (u.iterations || []).filter(i => !i.passed).slice(-1)[0];
      return last && last.feedback ? (last.feedback.stderr_tail || last.feedback.stdout_tail || '').slice(0, 200) : null;
    })()
  }));
  report.sections.loop = { units, escalated: units.filter(u => u.status === 'escalated').map(u => u.unit) };

  // Proposals + design history (presence-level observability)
  const proposalsFile = path.join(ws, '_proposals.md');
  report.sections.proposals = fs.existsSync(proposalsFile)
    ? { pending_entries: readLines(proposalsFile).filter(l => /^\|\s*P?\d|^[-*]\s+\S/.test(l)).length, file: proposalsFile }
    : { pending_entries: 0, file: null };
  const designFile = fs.existsSync(path.join(ws, '_design-history.md')) ? path.join(ws, '_design-history.md')
    : (fs.existsSync(path.join(ws, '_design-history.json')) ? path.join(ws, '_design-history.json') : null);
  report.sections.design_history = designFile;

  return report;
}

function renderMarkdown(r) {
  const L = [];
  L.push(`# CoolHan Run Report${r.run_id ? ` — ${r.run_id}` : ''}`);
  L.push('');
  const b = r.sections.backlog;
  L.push('## Backlog');
  if (!b) L.push('- no `_backlog.md` found (nothing recorded — not proof of completion)');
  else {
    L.push(`- units: ${b.total} · done+validated: ${b.done_and_validated} · complete: ${b.complete ? '✅ yes' : '❌ NO'}`);
    if (b.remaining.length) L.push(`- remaining: ${b.remaining.join(', ')}`);
    if (b.unvalidated.length) L.push(`- done-but-unvalidated: ${b.unvalidated.join(', ')}`);
  }
  L.push('');
  L.push('## Gate outcomes (G5 ledger)');
  const gates = r.sections.gates.by_gate;
  if (!Object.keys(gates).length) L.push('- no ledger entries');
  else {
    L.push('| gate | PASS | FAIL | NOT_RUN |');
    L.push('|---|---|---|---|');
    for (const [g, c] of Object.entries(gates)) L.push(`| ${g} | ${c.PASS} | ${c.FAIL} | ${c.NOT_RUN} |`);
  }
  L.push('');
  L.push('## Recurring failure lessons (≥2×, advisory)');
  if (!r.sections.lessons.length) L.push('- none recorded');
  else for (const x of r.sections.lessons) L.push(`- [${x.gate}] ×${x.count}: ${x.reason}`);
  L.push('');
  L.push('## Agent-loop units (G10)');
  if (!r.sections.loop.units.length) L.push('- no loop state recorded');
  else for (const u of r.sections.loop.units) {
    L.push(`- ${u.unit}: ${u.status} after ${u.iterations} iteration(s)` +
      (u.last_feedback ? ` — last failure tail: \`${u.last_feedback.replace(/`/g, "'")}\`` : ''));
  }
  if (r.sections.loop.escalated.length) L.push(`- ⚠️ ESCALATED (human decision pending): ${r.sections.loop.escalated.join(', ')}`);
  L.push('');
  L.push('## Proposals & design');
  L.push(`- improvement proposals pending: ${r.sections.proposals.pending_entries}${r.sections.proposals.file ? ` (${r.sections.proposals.file})` : ''}`);
  L.push(`- design history: ${r.sections.design_history || 'none recorded'}`);
  L.push('');
  L.push('> Honest bound: this report shows what the gate artifacts recorded. It cannot show work');
  L.push('> that bypassed the gates, and it never changes a verdict — G1–G11 remain the enforcement.');
  return L.join('\n') + '\n';
}

function main(argv) {
  const args = argv.slice(2);
  const get = f => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined; };
  const json = args.includes('--json');
  const ws = get('--workspace') || '_workspace';
  const runId = get('--run-id');
  if (!fs.existsSync(ws)) { console.error(`✗ run-report: workspace not found: ${ws}`); return 2; }
  const out = get('--out') || path.join(ws, 'run-report.md');

  const report = collect(ws, runId);
  const md = renderMarkdown(report);
  try { fs.writeFileSync(out, md); } catch (e) { console.error(`✗ run-report: cannot write ${out}: ${e.message}`); return 2; }

  if (json) console.log(JSON.stringify(report, null, 2));
  else console.log(`✔ run-report: ${out}` + (report.sections.backlog && report.sections.backlog.complete ? ' (backlog complete)' : ''));
  return 0;
}

if (require.main === module) process.exit(main(process.argv));

module.exports = { collect, renderMarkdown, main };
