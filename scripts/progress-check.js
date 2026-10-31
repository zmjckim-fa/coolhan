#!/usr/bin/env node

/**
 * CoolHan progress-check — G20-A progress-ledger gate ("대화가 아니라 파일이 진실이다").
 *
 * Driving doc: knowledge_base/00_MINIMAL_SOURCE_PRINCIPLES.md §9 (진행 원장) + §10 (완료의 정의).
 *
 * Validates ONE ledger file (default docs/PROGRESS.md):
 *   • a one-line goal      — "목표:" / "Goal:" line (the human changes it; the model never does)
 *   • a task table         — | 번호 | 이름 | 상태 | 완료 증거 | 남은 항목 |
 *                            상태 ∈ {대기, 진행 중, 완료}  (pending / in-progress / done accepted)
 *                            완료  → 증거 cell must carry a captured result (test numbers like 12/12 or
 *                                    "n passed", or a commit hash ≥7 hex) and no hedge words
 *                                    (확인 안 됨 / 추가 작업 필요 / 대부분 / 사실상 / mostly / essentially)
 *                            진행 중 → 남은 항목 must be named
 *   • 현재 위치             — names a task number that exists in the table
 *   • 가정 목록             — section present (numbered rows, each with a reason)
 *   • 결함 목록             — rows D-n with 상태 열림/닫힘 (open/closed), 발견한 검사, 파일:줄
 *
 * Usage: node scripts/progress-check.js [docs/PROGRESS.md] [--json]
 * Exit:  0 PASS · 1 FAIL (each finding names section/row) · 2 usage/read error
 *
 * Honest bound: proves the ledger is well-formed and every "완료" row carries evidence text — not that
 * the evidence is true (that is the captured run itself, G1/C10) or that the task list is the right
 * decomposition (G3 / human).
 */

const fs = require('fs');
const { sections, findSection, parseTable } = require('./lib/md-table');
const { positional } = require('./lib/cli');
const { t, finding } = require('./messages');

const DEFAULT_LEDGER = 'docs/PROGRESS.md';
const STATUS = {
  '대기': 'pending', 'pending': 'pending', 'todo': 'pending',
  '진행 중': 'in-progress', '진행중': 'in-progress', 'in-progress': 'in-progress', 'in progress': 'in-progress',
  '완료': 'done', 'done': 'done', 'complete': 'done', 'completed': 'done'
};
const HEDGE = /확인\s*안\s*됨|확인\s*안\s*함|추가\s*작업\s*필요|대부분|사실상|\bmostly\b|\bessentially\b|\bpartially\b|\bnot\s+verified\b/i;
const EVIDENCE = /\b\d+\s*\/\s*\d+\b|\b\d+\s*(?:passed|pass|tests?|통과|건)\b|\b[0-9a-f]{7,40}\b|exit\s*=?\s*0|\bPASS\b|\bclean\b|\b0\s*findings?\b/i;
const DEFECT_STATE = { '열림': 'open', 'open': 'open', '닫힘': 'closed', 'closed': 'closed' };
const NONE = /^(?:-|—|없음|none|n\/a)$/i;

function normalizeState(map, raw) { const s = String(raw || '').trim(); return map[s.toLowerCase()] || map[s] || null; }
function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

function parseLedger(md) {
  const secs = sections(md);
  const all = Object.values(secs).flat();
  const goalRe = /^\s*\**(?:목표|goal)\s*\**\s*[:：]\s*\**\s*/i;
  const goalLine = all.find(l => goalRe.test(l.text));
  const goal = goalLine ? goalLine.text.replace(goalRe, '').trim() : '';

  const taskSec = findSection(secs, /작업\s*목록|tasks?/i) || all;
  const tasks = parseTable(taskSec, {
    id: /^(?:번호|#|id|no\.?)$/i, name: /이름|name|task|작업/i, status: /상태|status/i,
    evidence: /증거|evidence/i, remaining: /남은|remaining/i
  }).rows.filter(r => r.id).map(r => ({ ...r, state: normalizeState(STATUS, r.status) }));

  const posSec = findSection(secs, /현재\s*위치|current\s*position/i);
  const position = posSec ? posSec.map(l => l.text).join('\n').trim() : '';
  const assumeSec = findSection(secs, /가정|assumption/i);
  const defectSec = findSection(secs, /결함|defect/i);
  const defects = defectSec ? parseTable(defectSec, {
    id: /^(?:d-?번호|번호|#|id)$/i, check: /검사|check/i, where: /파일|file|위치|where/i, status: /상태|status/i
  }).rows.map(r => ({ ...r, state: normalizeState(DEFECT_STATE, r.status) })) : [];

  return { goal, tasks, position, defects, hasDefectSection: !!defectSec, hasAssumeSection: !!assumeSec };
}

function evaluate(md) {
  const L = parseLedger(md);
  const findings = [];
  const add = (...a) => findings.push(finding(...a));

  if (!L.goal) add('no-goal-line', 'ledger', 'progress.noGoal');
  if (!L.tasks.length) add('no-task-table', 'ledger', 'progress.noTaskTable');

  for (const task of L.tasks) {
    const where = `task ${task.id} (line ${task.n})`;
    if (!task.state) { add('invalid-status', where, 'progress.invalidStatus', { status: task.status }); continue; }
    if (task.state === 'done') {
      if (HEDGE.test(task.evidence) || HEDGE.test(task.name) || HEDGE.test(task.remaining)) add('done-with-hedge', where, 'progress.doneWithHedge');
      else if (!EVIDENCE.test(task.evidence)) add('done-without-evidence', where, 'progress.doneWithoutEvidence', { evidence: task.evidence });
      if (task.remaining && !NONE.test(task.remaining)) add('done-with-remaining', where, 'progress.doneWithRemaining', { remaining: task.remaining });
    }
    if (task.state === 'in-progress' && !task.remaining.trim()) add('in-progress-without-remaining', where, 'progress.inProgressWithoutRemaining');
  }

  if (!L.position) add('no-current-position', 'ledger', 'progress.noPosition');
  else if (L.tasks.length && !L.tasks.some(task => new RegExp(`(?:^|[^\\w])${escapeRe(task.id)}(?![\\w])`).test(L.position))) {
    add('position-not-in-table', 'ledger', 'progress.positionNotInTable');
  }
  if (!L.hasAssumeSection) add('no-assumptions-section', 'ledger', 'progress.noAssumptions');
  if (!L.hasDefectSection) add('no-defects-section', 'ledger', 'progress.noDefects');
  for (const d of L.defects) {
    const where = `defect ${d.id} (line ${d.n})`;
    if (!/^D-?\d+$/i.test(d.id)) add('defect-id-format', where, 'progress.defectIdFormat');
    if (!d.state) add('defect-invalid-status', where, 'progress.defectInvalidStatus', { status: d.status });
    if (d.state === 'open' && !d.check.trim()) add('defect-without-check', where, 'progress.defectWithoutCheck');
  }

  const summary = {
    total: L.tasks.length,
    done: L.tasks.filter(x => x.state === 'done').length,
    in_progress: L.tasks.filter(x => x.state === 'in-progress').map(x => x.id),
    pending: L.tasks.filter(x => x.state === 'pending').map(x => x.id),
    open_defects: L.defects.filter(d => d.state === 'open').map(d => d.id)
  };
  return { status: findings.length ? 'FAIL' : 'PASS', findings, goal: L.goal, position: L.position, summary };
}

function main(argv) {
  const args = argv.slice(2);
  const json = args.includes('--json');
  const file = positional(args) || DEFAULT_LEDGER;
  let md;
  try { md = fs.readFileSync(file, 'utf8'); }
  catch (e) { console.error(t('progress.cannotRead', { file, error: e.message })); return 2; }
  const r = evaluate(md);
  if (json) console.log(JSON.stringify({ file, ...r }, null, 2));
  else {
    const s = r.summary;
    console.log(t('progress.summary', {
      mark: r.status === 'PASS' ? '✔' : '✗', status: r.status, file, done: s.done, total: s.total,
      inProgress: s.in_progress.join(',') || '-', pending: s.pending.length, openDefects: s.open_defects.join(',') || '-'
    }));
    for (const f of r.findings) console.log(`  [${f.rule}] ${f.where} — ${f.detail}`);
    if (r.position) console.log(t('progress.position', { position: r.position.split('\n')[0] }));
  }
  return r.status === 'PASS' ? 0 : 1;
}

if (require.main === module) process.exit(main(process.argv));

module.exports = { evaluate, parseLedger, main, DEFAULT_LEDGER };
