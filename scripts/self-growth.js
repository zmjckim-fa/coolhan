#!/usr/bin/env node

/**
 * CoolHan self-growth — the self-developing engine (G17, v2.4.0).
 *
 * Makes CoolHan 자기성장형: it mines its OWN durable evidence trail and emits a prioritized
 * self-improvement backlog that feeds the non-stop loop (G13) — so the harness proposes and, via
 * the existing gates (G1–G16), implements its own next enhancements toward the goal of
 * agent-driven + loop-based solution development that actually ships correct results.
 *
 * Evidence sources (all already produced by CoolHan; each optional, each honest about absence):
 *   1. G5 ledger        `_workspace/_ledger.jsonl`  — recurring (gate,reason) FAILs = weak spots.
 *   2. DECISIONS log     `docs/DECISIONS.md`          — deferred items / "reversible: yes … later".
 *   3. Run reports       `_workspace/run-report*.md`  — escalations, unvalidated units, pending proposals.
 *   4. Proposals         `_workspace/_proposals.md`   — better-than-spec ideas awaiting a decision.
 *   5. Applied-site outcomes (operator-pointed --sites <dir>) — COMMERCIAL_VERDICT_*.md /
 *      hardening / a11y reports under other repos: BLOCKED/NOT_RUN/FAIL rows become harness gaps.
 *
 * Output: `_workspace/_self-growth-backlog.md` — ranked candidate improvements, each with
 * {source, evidence, why it matters, suggested gate/agent to touch}. ADVISORY input to the loop:
 * a human/orchestrator still decides scope, and every resulting change goes through the full
 * per-feature ritual (tests + adversarial track + gates). It never edits the harness itself.
 *
 * Usage: node scripts/self-growth.js [--workspace DIR] [--sites DIR] [--out FILE] [--json]
 * Exit: 0 always (an observer/planner; an empty evidence set yields an honest "nothing to mine yet").
 *
 * Honesty: this proposes from RECORDED evidence on disk — not from "all conversations across all
 * sessions/accounts" (not accessible/verifiable). Cross-session growth accrues because every run
 * appends to the ledger/decisions/reports this engine reads; point --sites at applied projects to
 * fold their verdict artifacts in.
 */

const fs = require('fs');
const path = require('path');

function readText(p) { try { return fs.readFileSync(p, 'utf8'); } catch (_) { return null; } }
function readLines(p) { const t = readText(p); return t ? t.split(/\r?\n/) : []; }

/** G5 ledger → recurring (gate,reason) FAIL clusters (≥ minCount). */
function fromLedger(ws, minCount = 2) {
  const entries = readLines(path.join(ws, '_ledger.jsonl'))
    .filter(Boolean).map(l => { try { return JSON.parse(l); } catch (_) { return null; } }).filter(Boolean);
  const counts = {};
  for (const e of entries) {
    if (e.status !== 'FAIL') continue;
    const k = `${e.gate} :: ${e.reason}`;
    counts[k] = (counts[k] || 0) + 1;
  }
  return Object.entries(counts).filter(([, n]) => n >= minCount).map(([k, n]) => {
    const [gate, reason] = k.split(' :: ');
    return { source: 'ledger', priority: n >= 4 ? 'high' : 'medium', evidence: `${n}× FAIL`, gate, reason,
      candidate: `Recurring failure at ${gate} ("${reason}") — strengthen that gate or the agent feeding it.` };
  });
}

/** DECISIONS.md → deferred/later items. */
function fromDecisions(root) {
  const lines = readLines(path.join(root, 'docs', 'DECISIONS.md'));
  const out = [];
  lines.forEach((l, i) => {
    if (/defer(red)?|later|not (yet )?(feasible|implemented)|TODO|추후|이연|나중/i.test(l) && /decision|reversible|update|:/i.test(l)) { // no-placeholder-check:allow — TODO here is a detection pattern, not a placeholder
      out.push({ source: 'decisions', priority: 'medium', evidence: `DECISIONS.md:${i + 1}`,
        candidate: `Revisit deferred decision: ${l.trim().slice(0, 160)}` });
    }
  });
  return out;
}

/** run-report*.md → escalations / unvalidated / pending proposals. */
function fromRunReports(ws) {
  const out = [];
  let files = [];
  try { files = fs.readdirSync(ws).filter(f => /^run-report.*\.md$/i.test(f)); } catch (_) { /* none */ }
  for (const f of files) {
    const t = readText(path.join(ws, f)) || '';
    const esc = t.match(/ESCALATED[^\n]*/i);
    if (esc) out.push({ source: 'run-report', priority: 'high', evidence: `${f}`, candidate: `Unresolved escalation: ${esc[0].slice(0, 140)}` });
    const un = t.match(/done-but-unvalidated:[^\n]*/i);
    if (un) out.push({ source: 'run-report', priority: 'high', evidence: `${f}`, candidate: `Unvalidated "done" unit(s): ${un[0].slice(0, 140)}` });
  }
  return out;
}

/** _proposals.md → pending improvement proposals (the machine-proposes channel). */
function fromProposals(ws) {
  const lines = readLines(path.join(ws, '_proposals.md'));
  return lines.filter(l => /^\|\s*P?\d|^[-*]\s+\S/.test(l) && !/^\|\s*id\b/i.test(l))
    .map(l => ({ source: 'proposals', priority: 'medium', evidence: '_proposals.md', candidate: `Pending proposal: ${l.replace(/\|/g, ' ').trim().slice(0, 160)}` }));
}

/** applied-site verdict artifacts under a sites root → harness gaps surfaced by real projects. */
function fromSites(sitesDir) {
  if (!sitesDir) return [];
  const out = [];
  let entries = [];
  try { entries = fs.readdirSync(sitesDir, { withFileTypes: true }); } catch (_) { return []; }
  for (const d of entries) {
    if (!d.isDirectory()) continue;
    const ws = path.join(sitesDir, d.name, '_workspace');
    let files = [];
    try { files = fs.readdirSync(ws).filter(f => /(COMMERCIAL_VERDICT|hardening|a11y|VERDICT).*\.md$/i.test(f)); } catch (_) { continue; }
    for (const f of files) {
      const t = readText(path.join(ws, f)) || '';
      const hits = (t.match(/BLOCKED|❌ FAIL|NOT_RUN|NOT_READY/g) || []).length;
      if (hits) out.push({ source: `site:${d.name}`, priority: hits >= 3 ? 'high' : 'medium', evidence: `${f} (${hits} blocking rows)`,
        candidate: `Applied site "${d.name}" still has ${hits} blocking/unmeasured rows — is a CoolHan gate missing a check that would have caught these earlier?` });
    }
  }
  return out;
}

function rank(items) {
  const order = { high: 0, medium: 1, low: 2 };
  return items.slice().sort((a, b) => (order[a.priority] ?? 9) - (order[b.priority] ?? 9));
}

function evaluate(root, opts = {}) {
  const ws = opts.workspace || path.join(root, '_workspace');
  const items = rank([
    ...fromLedger(ws), ...fromDecisions(root), ...fromRunReports(ws),
    ...fromProposals(ws), ...fromSites(opts.sites)
  ]);
  return { generated_at: new Date().toISOString(), root, sources_scanned: {
    ledger: fs.existsSync(path.join(ws, '_ledger.jsonl')),
    decisions: fs.existsSync(path.join(root, 'docs', 'DECISIONS.md')),
    proposals: fs.existsSync(path.join(ws, '_proposals.md')),
    sites: !!opts.sites }, items };
}

function render(r) {
  const L = ['# CoolHan Self-Growth Backlog (G17)', '', `> Generated ${r.generated_at}. Advisory input to the non-stop loop — every item still goes`, '> through the full per-feature ritual (tests + adversarial track + G1–G16). Mines recorded', '> evidence on disk, not un-accessible cross-account transcripts (honest bound).', ''];
  const scanned = Object.entries(r.sources_scanned).filter(([, v]) => v).map(([k]) => k).join(', ') || 'none';
  L.push(`Sources present: ${scanned}`); L.push('');
  if (!r.items.length) { L.push('No self-growth candidates found yet — evidence trail is clean or not yet accumulated.'); return L.join('\n') + '\n'; }
  L.push('| # | priority | source | candidate | evidence |'); L.push('|---|---|---|---|---|');
  r.items.forEach((it, i) => L.push(`| ${i + 1} | ${it.priority} | ${it.source} | ${it.candidate.replace(/\|/g, '/')} | ${it.evidence} |`));
  return L.join('\n') + '\n';
}

function main(argv) {
  const args = argv.slice(2);
  const get = f => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined; };
  const json = args.includes('--json');
  const root = process.cwd();
  const ws = get('--workspace') || path.join(root, '_workspace');
  const result = evaluate(root, { workspace: ws, sites: get('--sites') });
  const out = get('--out') || path.join(ws, '_self-growth-backlog.md');
  try { fs.mkdirSync(path.dirname(out), { recursive: true }); fs.writeFileSync(out, render(result)); } catch (e) { console.error(`(write failed: ${e.message})`); }
  if (json) console.log(JSON.stringify(result, null, 2));
  else console.log(`✔ self-growth: ${result.items.length} candidate(s) → ${out}`);
  return 0;
}

if (require.main === module) process.exit(main(process.argv));

module.exports = { fromLedger, fromDecisions, fromRunReports, fromProposals, fromSites, evaluate, render, main };
