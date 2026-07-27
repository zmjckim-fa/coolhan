#!/usr/bin/env node

/**
 * CoolHan tasks-check — Full-Completion Auto-Pilot Mode task gate.
 *
 * Parses a TASKS.md file using the 5-state model requested by the auto-pilot discipline:
 *   not-started | in-progress | implemented | verified | blocked
 *
 * "implemented" alone is NOT enough — a unit only counts as done when it is "verified"
 * (backed by a real, executed check — same no-simulation principle as G1/G2). This is an
 * additional, optional completion source alongside the existing _backlog.md/completion-check.js
 * (G8); it does not replace them.
 *
 * TASKS.md row format (one per unit):
 *   | ID | Task | Status | Verifies |
 *   |----|------|--------|----------|
 *   | T1 | ...  | verified | npm test -- login |
 *
 * Status cell must contain one of: not-started, in-progress, implemented, verified, blocked
 * (case-insensitive; Korean labels 미착수/진행 중/구현 완료/검증 완료/차단됨 are also accepted).
 *
 * Usage: node scripts/tasks-check.js <TASKS.md> [--json]
 * Exit: 0 only if every parsed unit is "verified"; else 1.
 */

const fs = require('fs');

const STATUS_MAP = {
  'not-started': 'not-started', '미착수': 'not-started',
  'in-progress': 'in-progress', '진행 중': 'in-progress', '진행중': 'in-progress',
  'implemented': 'implemented', '구현 완료': 'implemented', '구현완료': 'implemented',
  'verified': 'verified', '검증 완료': 'verified', '검증완료': 'verified',
  'blocked': 'blocked', '차단됨': 'blocked'
};

function normalizeStatus(raw) {
  const key = String(raw || '').trim().toLowerCase();
  return STATUS_MAP[key] || STATUS_MAP[String(raw || '').trim()] || null;
}

/** Parse a markdown table's rows into {id, task, status, verifies}. Tolerant of column order
 * via a header row; falls back to the documented 4-column order if no header is recognized. */
function parseTasks(md) {
  const lines = md.split(/\r?\n/).filter(l => l.trim().startsWith('|'));
  const rows = lines.filter(l => !/^\|[\s:-]+\|/.test(l)); // drop separator rows
  const units = [];
  let idIdx = 0, taskIdx = 1, statusIdx = 2, verifiesIdx = 3;
  let headerSeen = false;

  for (const line of rows) {
    const cells = line.split('|').slice(1, -1).map(c => c.trim());
    if (!headerSeen) {
      const lower = cells.map(c => c.toLowerCase());
      if (lower.some(c => c.includes('status') || c.includes('상태'))) {
        idIdx = lower.findIndex(c => c.includes('id')); if (idIdx < 0) idIdx = 0;
        taskIdx = lower.findIndex(c => c.includes('task') || c.includes('작업')); if (taskIdx < 0) taskIdx = 1;
        statusIdx = lower.findIndex(c => c.includes('status') || c.includes('상태'));
        verifiesIdx = lower.findIndex(c => c.includes('verif') || c.includes('검증'));
        headerSeen = true;
        continue;
      }
    }
    const status = normalizeStatus(cells[statusIdx]);
    if (!status) continue; // not a task row (e.g., stray table elsewhere)
    units.push({
      id: cells[idIdx] || `row${units.length + 1}`,
      task: cells[taskIdx] || '',
      status,
      verifies: verifiesIdx >= 0 ? (cells[verifiesIdx] || '') : ''
    });
  }
  return units;
}

/** Evaluate parsed units. Returns { total, verified, remaining[], blocked[], unverified[], ok }. */
function evaluate(units) {
  const remaining = units.filter(u => u.status === 'not-started' || u.status === 'in-progress').map(u => u.id);
  const blocked = units.filter(u => u.status === 'blocked').map(u => u.id);
  const unverified = units.filter(u => u.status === 'implemented').map(u => u.id); // implemented != verified
  const verified = units.filter(u => u.status === 'verified').length;
  const ok = units.length > 0 && remaining.length === 0 && blocked.length === 0 && unverified.length === 0;
  return { total: units.length, verified, remaining, blocked, unverified, ok };
}

function main(argv) {
  const args = argv.slice(2);
  const json = args.includes('--json');
  const file = args.find(a => !a.startsWith('--'));
  if (!file) { console.error('usage: tasks-check.js <TASKS.md> [--json]'); return 2; }
  let md;
  try { md = fs.readFileSync(file, 'utf8'); }
  catch (e) { console.error(`tasks-check: cannot read ${file}: ${e.message}`); return 2; }

  const units = parseTasks(md);
  const ev = evaluate(units);

  if (json) {
    console.log(JSON.stringify({ file, ...ev }, null, 2));
  } else {
    console.log(`tasks-check: ${file} — ${ev.verified}/${ev.total} verified`);
    if (ev.remaining.length) console.log(`  not-started/in-progress: ${ev.remaining.join(', ')}`);
    if (ev.blocked.length) console.log(`  blocked: ${ev.blocked.join(', ')}`);
    if (ev.unverified.length) console.log(`  implemented but NOT verified: ${ev.unverified.join(', ')}`);
    console.log(ev.ok
      ? '✔ all tasks verified — auto-pilot completion condition met'
      : '✗ tasks-check FAILED — remaining/blocked/unverified tasks above must be resolved before "done"');
  }
  return ev.ok ? 0 : 1;
}

if (require.main === module) process.exit(main(process.argv));

module.exports = { parseTasks, evaluate, normalizeStatus, main };
