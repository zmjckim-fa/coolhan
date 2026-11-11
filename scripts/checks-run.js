#!/usr/bin/env node

/**
 * CoolHan checks-run — G20-B fixed verification list runner ("검증은 고정 목록으로").
 *
 * Driving doc: knowledge_base/00_MINIMAL_SOURCE_PRINCIPLES.md §11.
 *
 * "검증" means running EVERY command in the project's fixed list (default docs/CHECKS.md) the same
 * way every time — never an improvised review. Each check is a real child process (C10: captured
 * exit code and output are the only evidence). The report is exactly three numbers:
 *
 *     통과 n · 실패 m(D-번호) · 확인 안 함 k(이유)
 *
 *   통과      exit 0
 *   실패      non-zero exit — annotated with the open D-numbers of docs/PROGRESS.md whose
 *             "발견한 검사" names this check id, or "(미등록 → D-번호 등록 필요)"
 *   확인 안 함 the command could not run at all (tool missing / spawn error / timeout) or the check
 *             row is marked `manual` — reported with the reason, never counted as a pass
 *
 * CHECKS.md row format:   | ID | 검사 | 명령 | 비고 |      (a `manual` 비고 → 확인 안 함(manual))
 *
 * Usage: node scripts/checks-run.js [docs/CHECKS.md] [--only C1,C3] [--ledger docs/PROGRESS.md]
 *                                   [--timeout <sec>] [--json]
 * Exit:  0 all 통과 · 1 any 실패 · 4 no 실패 but ≥1 확인 안 함 · 2 usage/read error
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { cellsOf, isSeparator } = require('./lib/md-table');
const { argValue, argList, positional } = require('./lib/cli');
const { t } = require('./messages');

const DEFAULT_CHECKS = 'docs/CHECKS.md';
const DEFAULT_LEDGER = 'docs/PROGRESS.md';
const DEFAULT_TIMEOUT_SEC = 900;
const NOT_RUN_EXIT = 4;   // the harness convention for "could not measure" (checks-run, commercial-gate, field-lessons)
const VALUE_FLAGS = ['--only', '--ledger', '--timeout'];
const TOOL_MISSING = /not recognized as an internal or external command|command not found|is not recognized/i;

/** Parse CHECKS.md → [{id, name, command, note, manual}] */
function parseChecks(md) {
  const out = []; let idx = null;
  for (const raw of md.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line.startsWith('|') || isSeparator(line)) continue;
    const cells = cellsOf(line);
    if (!idx) {
      const lower = cells.map(c => c.toLowerCase());
      const cmd = lower.findIndex(c => /명령|command/.test(c));
      if (cmd >= 0) {
        idx = { id: lower.findIndex(c => /^(?:id|번호|#)$/.test(c)), name: lower.findIndex(c => /검사|check|name/.test(c)), cmd, note: lower.findIndex(c => /비고|note/.test(c)) };
        if (idx.id < 0) idx.id = 0;
      }
      continue;
    }
    const command = (cells[idx.cmd] || '').replace(/^`|`$/g, '').trim();
    if (!command) continue;
    const note = idx.note >= 0 ? (cells[idx.note] || '') : '';
    out.push({ id: cells[idx.id] || `C${out.length + 1}`, name: idx.name >= 0 ? (cells[idx.name] || '') : '', command, note, manual: /\bmanual\b|수동/i.test(note) });
  }
  return out;
}

/** Open defects from the ledger keyed by the check id named in "발견한 검사". */
function openDefectsByCheck(ledgerPath) {
  let md; try { md = fs.readFileSync(ledgerPath, 'utf8'); } catch (_) { return {}; }
  const map = {}; let idx = null; let inDefects = false;
  for (const raw of md.split(/\r?\n/)) {
    if (/^#{1,6}\s/.test(raw)) { inDefects = /결함|defect/i.test(raw); idx = null; continue; }
    if (!inDefects) continue;
    const line = raw.trim();
    if (!line.startsWith('|') || isSeparator(line)) continue;
    const cells = cellsOf(line);
    if (!idx) {
      const lower = cells.map(c => c.toLowerCase());
      const st = lower.findIndex(c => /상태|status/.test(c));
      if (st >= 0) idx = { id: 0, check: lower.findIndex(c => /검사|check/.test(c)), st };
      continue;
    }
    if (!/열림|open/i.test(cells[idx.st] || '')) continue;
    const checks = (idx.check >= 0 ? cells[idx.check] : '').split(/[,\s/]+/).filter(Boolean);
    for (const c of checks) (map[c] = map[c] || []).push(cells[idx.id]);
  }
  return map;
}

function runOne(check, { cwd, timeoutSec }) {
  if (check.manual) return { ...check, result: 'not-run', reason: t('checks.reasonManual'), exit: null, tail: '' };
  const t0 = Date.now();
  const r = spawnSync(check.command, { cwd, shell: true, encoding: 'utf8', timeout: timeoutSec * 1000, maxBuffer: 64 * 1024 * 1024 });
  const ms = Date.now() - t0;
  const out = `${r.stdout || ''}${r.stderr || ''}`;
  const tail = out.trim().split(/\r?\n/).slice(-6).join('\n');
  if (r.error && r.error.code === 'ETIMEDOUT') return { ...check, result: 'not-run', reason: t('checks.reasonTimeout', { sec: timeoutSec }), exit: null, tail, ms };
  if (r.error) return { ...check, result: 'not-run', reason: t('checks.reasonSpawn', { error: r.error.message }), exit: null, tail, ms };
  if (r.status === 127 || TOOL_MISSING.test(out)) return { ...check, result: 'not-run', reason: t('checks.reasonToolMissing'), exit: r.status, tail, ms };
  if (r.status === NOT_RUN_EXIT) return { ...check, result: 'not-run', reason: t('checks.reasonChildNotRun'), exit: r.status, tail, ms };
  return { ...check, result: r.status === 0 ? 'pass' : 'fail', exit: r.status, tail, ms };
}

function run(checks, opts = {}) {
  const cwd = opts.cwd || process.cwd();
  const defects = openDefectsByCheck(path.resolve(cwd, opts.ledger || DEFAULT_LEDGER));
  const results = checks.map(c => {
    const r = runOne(c, { cwd, timeoutSec: opts.timeoutSec || DEFAULT_TIMEOUT_SEC });
    if (r.result === 'fail') r.defects = defects[c.id] || [];
    return r;
  });
  const pass = results.filter(r => r.result === 'pass');
  const fail = results.filter(r => r.result === 'fail');
  const notRun = results.filter(r => r.result === 'not-run');
  const line = t('checks.line', {
    pass: pass.length, fail: fail.length, notRun: notRun.length,
    failDetail: fail.length ? `(${fail.map(f => f.defects.length ? f.defects.join('/') : t('checks.unregistered', { id: f.id })).join(', ')})` : '',
    notRunDetail: notRun.length ? `(${notRun.map(n => `${n.id}:${n.reason}`).join(', ')})` : ''
  });
  const exit = fail.length ? 1 : notRun.length ? 4 : 0;
  return { line, pass: pass.length, fail: fail.length, not_run: notRun.length, results, exit };
}

function main(argv) {
  const args = argv.slice(2);
  const json = args.includes('--json');
  const file = positional(args, VALUE_FLAGS) || DEFAULT_CHECKS;
  let md;
  try { md = fs.readFileSync(file, 'utf8'); }
  catch (e) { console.error(t('checks.cannotRead', { file, error: e.message })); return 2; }
  let checks = parseChecks(md);
  const only = argList(args, '--only');
  if (only) { const set = new Set(only); checks = checks.filter(c => set.has(c.id)); }
  if (!checks.length) { console.error(t('checks.noRows')); return 2; }
  const timeout = argValue(args, '--timeout');
  const r = run(checks, { cwd: process.cwd(), ledger: argValue(args, '--ledger'), timeoutSec: timeout ? Number(timeout) : undefined });
  if (json) console.log(JSON.stringify({ file, ...r }, null, 2));
  else {
    console.log(t('checks.header', { file }));
    for (const x of r.results) {
      const mark = x.result === 'pass' ? '✔' : x.result === 'fail' ? '✗' : '○';
      const verdict = x.result === 'not-run' ? t('checks.notRunLabel', { reason: x.reason }) : `exit ${x.exit}`;
      console.log(`  ${mark} ${x.id} ${x.name} — ${verdict}${x.ms != null ? ` ${Math.round(x.ms / 100) / 10}s` : ''}`);
    }
    for (const x of r.results.filter(y => y.result !== 'pass' && y.tail)) console.log(`  --- ${x.id} tail ---\n${x.tail.split('\n').map(l => '    ' + l).join('\n')}`);
    console.log(r.line);
  }
  return r.exit;
}

if (require.main === module) process.exit(main(process.argv));

module.exports = { parseChecks, openDefectsByCheck, run, main, DEFAULT_CHECKS, DEFAULT_LEDGER };
