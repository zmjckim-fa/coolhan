#!/usr/bin/env node

/**
 * CoolHan ledger — persistent run ledger + failure-lesson feedback (G5).
 *
 * Every gate (Validator, Security Reviewer, Plan Reviewer, regression-check, trace-check) produces a
 * verdict, but nothing persisted it across runs — each new run started blind to failures already seen
 * and fixed before. This module gives gates a shared, append-only memory: record an outcome, query
 * past outcomes, and surface recurring (gate, reason) pairs as advisory "lessons" so upstream agents
 * can watch for a known mistake before repeating it.
 *
 * Storage: append-only JSONL at _workspace/_ledger.jsonl — one JSON object per line, existing lines
 * are never rewritten (only append() adds; no in-place edit/delete function exists here).
 *
 * Entry shape: { run_id, unit, gate, status: "PASS"|"FAIL"|"NOT_RUN", reason, timestamp }
 *
 * Honesty: a "lesson" is a correlation (same gate+reason recurred >= minCount times) — not a proven
 * root cause. It is advisory only; nothing in this module blocks a gate or changes its verdict.
 *
 * CLI:
 *   node scripts/ledger.js append '<json entry>' [--file path]
 *   node scripts/ledger.js query [--gate G] [--status S] [--unit substr] [--file path] [--json]
 *   node scripts/ledger.js lessons [--min N] [--file path] [--json]
 */

const fs = require('fs');

const DEFAULT_FILE = '_workspace/_ledger.jsonl';

function readEntries(file) {
  if (!fs.existsSync(file)) return [];
  const raw = fs.readFileSync(file, 'utf8');
  return raw.split('\n')
    .map(l => l.trim())
    .filter(Boolean)
    .map(l => JSON.parse(l));
}

/** Append one entry as a new JSONL line. Never mutates existing lines. */
function append(entry, file = DEFAULT_FILE) {
  if (!entry || !entry.gate || !entry.status) {
    throw new Error('ledger.append: entry requires at least {gate, status}');
  }
  const line = JSON.stringify(entry) + '\n';
  fs.appendFileSync(file, line);
  return entry;
}

/** Filter entries by gate / status / unit substring. */
function query(filter = {}, file = DEFAULT_FILE) {
  let entries = readEntries(file);
  if (filter.gate) entries = entries.filter(e => e.gate === filter.gate);
  if (filter.status) entries = entries.filter(e => e.status === filter.status);
  if (filter.unit) entries = entries.filter(e => (e.unit || '').includes(filter.unit));
  return entries;
}

/** Group FAIL entries by (gate, reason); return those recurring >= minCount, sorted desc by count. */
function lessons(minCount = 2, file = DEFAULT_FILE) {
  const fails = query({ status: 'FAIL' }, file);
  const groups = new Map();
  for (const e of fails) {
    const key = `${e.gate}::${e.reason || '(no reason given)'}`;
    if (!groups.has(key)) groups.set(key, { gate: e.gate, reason: e.reason || '(no reason given)', count: 0, occurrences: [] });
    const g = groups.get(key);
    g.count += 1;
    g.occurrences.push({ run_id: e.run_id, unit: e.unit, timestamp: e.timestamp });
  }
  return [...groups.values()]
    .filter(g => g.count >= minCount)
    .sort((a, b) => b.count - a.count);
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
  const cmd = args[0];
  const flags = parseFlags(args.slice(1));
  const file = flags.file || DEFAULT_FILE;
  const json = !!flags.json;

  if (cmd === 'append') {
    const payload = args[1];
    if (!payload) { console.error('usage: ledger.js append \'<json entry>\' [--file path]'); return 2; }
    let entry;
    try { entry = JSON.parse(payload); }
    catch (e) { console.error(`ledger: cannot parse entry JSON: ${e.message}`); return 2; }
    try { append(entry, file); }
    catch (e) { console.error(`ledger: ${e.message}`); return 2; }
    if (!json) console.log(`✔ appended to ${file}: ${entry.gate} ${entry.status}${entry.unit ? ' (' + entry.unit + ')' : ''}`);
    else console.log(JSON.stringify(entry));
    return 0;
  }

  if (cmd === 'query') {
    const filter = { gate: flags.gate, status: flags.status, unit: flags.unit };
    const results = query(filter, file);
    if (json) console.log(JSON.stringify(results, null, 2));
    else {
      console.log(`ledger query: ${results.length} match(es)`);
      for (const e of results) console.log(`  [${e.status}] ${e.gate} — ${e.unit || '(no unit)'} — ${e.reason || ''}`);
    }
    return 0;
  }

  if (cmd === 'lessons') {
    const minCount = flags.min ? parseInt(flags.min, 10) : 2;
    const found = lessons(minCount, file);
    if (json) console.log(JSON.stringify(found, null, 2));
    else {
      if (!found.length) console.log(`ledger lessons: no recurring failure pattern (>= ${minCount}x)`);
      else {
        console.log(`ledger lessons: ${found.length} recurring pattern(s) (>= ${minCount}x) — advisory, not a proven root cause`);
        for (const l of found) console.log(`  ⚠ ${l.gate}: "${l.reason}" recurred ${l.count}x`);
      }
    }
    return 0;
  }

  console.error('usage: ledger.js <append|query|lessons> ...');
  return 2;
}

if (require.main === module) process.exit(main(process.argv));

module.exports = { append, query, lessons, readEntries, DEFAULT_FILE, main };
