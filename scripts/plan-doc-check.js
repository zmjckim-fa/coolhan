#!/usr/bin/env node

/**
 * CoolHan plan-doc-check — G21 planning-document (기획서) completion gate.
 *
 * Driving doc: knowledge_base/00_PLANNING_DOC_STANDARD.md (the user's 기획서 제작 마스터 프롬프트,
 * 2026-11-11). This gate is §7 of that standard ("문서 완료의 정의") made mechanical. G3
 * (plan-check.js) gates the backlog graph; this gates the planning DOCUMENT itself, before G3.
 *
 * Reads one .md file or every .md under a directory and reports:
 *   no-traceability-table     no 요구 항목 → 위치 table (§6-5)
 *   trace-unlocated           a requirement row whose location is blank
 *   trace-missing-item        an item given with --required that no trace row names
 *   table-blank-cell          an empty table cell (write "해당 없음") (§5)
 *   deferred-marker           추후 / 나중에 / TBD / 미정 in a table row without [결정필요] (§7)
 *   unverified-without-method [미검증] without "확인 방법" on the same line (§2-9)
 *   decision-without-reason   [결정필요] without "이유" on the same line (§7)
 *   tooltip-too-long          a 풍선말 / tooltip column cell over 10 어절 (§2-2)
 *   em-dash / hype-word       줄표, 과장어 (§2-10)
 *   diagram-missing           an image link whose file does not exist (§5)
 *   id-conflict               the same ID defined with different names across tables/files (§6-4)
 *   missing-section           one of the 12 must-have items of §4.2 or a §1 product basic is absent
 *   success-criteria-count    fewer than 3 success criteria (§1)
 *
 * Usage: node scripts/plan-doc-check.js <file.md|dir> [--required "ERD,메뉴 구성도,…"] [--json]
 * Exit:  0 PASS · 1 FAIL (each finding names file:line) · 2 usage / no document
 * `plan-doc-check:allow` on a line exempts it (quoted example).
 *
 * Honest bound: proves the document's form — no blank, no untagged unknown, no conflicting ID,
 * every must-have item present. It cannot prove that a fact tagged [관찰] was observed, that a
 * diagram was opened and looked at, that the design is good, or that the plan is what the user
 * wants. Those stay with the Plan Reviewer and the human.
 */

const fs = require('fs');
const path = require('path');
const { tablesIn, proseLines } = require('./lib/md-table');
const { argList, positional } = require('./lib/cli');
const { listFiles } = require('./lib/fs');
const { t, finding } = require('./messages');

const ALLOW = /plan-doc-check:allow/;
const NA = /^해당\s*없음|^n\/a$|^not applicable$/i;
const DEFER = /추후|나중에|\bTBD\b|\bTBA\b|미정/i;
const TAG_UNVERIFIED = /\[미검증\]/;
const TAG_DECISION = /\[결정필요\]/;
const HAS_METHOD = /확인\s*방법|검증\s*방법|확인\s*[:：]|how to verify|verify by/i;
const HAS_REASON = /이유|reason|because|\bwhy\b/i;
const HYPE = /혁신적|획기적|완벽한|완벽하게|최고의|압도적|강력한|놀라운|seamless|cutting[- ]edge|world[- ]class|revolutionary|game[- ]chang/i;
const IMAGE = /!\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
const TOOLTIP_COL = /풍선말|툴팁|tooltip/i;
const TRACE_ITEM_COL = /요구|requirement/i;
const TRACE_WHERE_COL = /위치|문서|경로|location|where|section/i;
const ID_COL = /^(?:[\w가-힣]*\s*)?id$|식별자/i;
const NAME_COL = /이름|명칭|^name$|title|제목|기능명|화면명|테이블명/i;
const ID_VALUE = /^[A-Za-z]{1,8}[-_]?\d+[\w-]*$/;
const MAX_TOOLTIP_WORDS = 10;
const MIN_SUCCESS_CRITERIA = 3;

// §4.2 twelve must-have items + §1 product basics. `anyLine` items may be a bullet label, not a heading.
const SECTIONS = [
  { id: 'plan.section.scope', re: /범위\s*밖|하지\s*않는\s*것|out of scope|non-goals?/i, anyLine: true },
  { id: 'plan.section.success', re: /성공\s*기준|success criteria/i, anyLine: true },
  { id: 'plan.section.business', re: /비즈니스|가격|견적|결제|환불|정산|수수료|pricing|billing|business model/i },
  { id: 'plan.section.legal', re: /법무|약관|개인정보|저작권|라이선스|legal|privacy|terms/i },
  { id: 'plan.section.ops', re: /운영|장애|백업|모니터링|operations|incident|backup/i },
  { id: 'plan.section.quality', re: /품질\s*목표|성능|가용성|접근성|비기능|non-functional|quality targets?/i },
  { id: 'plan.section.domain', re: /품질\s*관리|납품\s*규격|점검표|수정\s*요청|domain quality|deliverable spec/i },
  { id: 'plan.section.data', re: /지표|분석|이벤트\s*설계|metrics|analytics/i },
  { id: 'plan.section.notify', re: /알림|notification/i },
  { id: 'plan.section.test', re: /테스트|배포|롤백|마이그레이션|\btest|deploy/i },
  { id: 'plan.section.risk', re: /위험|risk/i },
  { id: 'plan.section.decision', re: /결정\s*로그|오픈\s*이슈|decision log|open issues?/i },
  { id: 'plan.section.glossary', re: /용어집|glossary/i },
  { id: 'plan.section.phase', re: /단계\s*계획|MVP|로드맵|phase plan|roadmap/i }
];

const wordCount = (s) => s.trim().split(/\s+/).filter(Boolean).length;
const isListItem = (s) => /^\s*(?:[-*+]|\d+[.)])\s+\S/.test(s);
const indentOf = (s) => s.search(/\S/);

function loadDocs(target) {
  return listFiles(target, { ext: /\.md$/i }).map(f => ({ ...f, lines: proseLines(fs.readFileSync(f.full, 'utf8')) }));
}

/** Count success criteria: list items (or table rows) that follow the first "성공 기준" label. */
function countSuccessCriteria(docs) {
  const label = SECTIONS[1].re;
  for (const d of docs) {
    const i = d.lines.findIndex(l => label.test(l.text) && !l.text.trim().startsWith('|'));
    if (i < 0) continue;
    const head = d.lines[i].text;
    const nested = isListItem(head) ? indentOf(head) : -1; // label is itself a bullet → count deeper bullets
    let count = 0;
    for (const { text } of d.lines.slice(i + 1)) {
      if (/^#{1,6}\s/.test(text)) break;
      if (!text.trim()) { if (count) break; continue; }
      if (isListItem(text)) { if (indentOf(text) > nested) count++; else break; continue; }
      if (text.trim().startsWith('|')) { if (!/^\|[\s:|-]+\|$/.test(text.trim())) count++; continue; }
      if (count) break;
    }
    const tableHeader = d.lines.slice(i + 1).find(l => l.text.trim())?.text.trim().startsWith('|') ? 1 : 0;
    return { found: true, count: count - tableHeader, where: `${d.rel}:${d.lines[i].n}` };
  }
  return { found: false, count: 0, where: '(docs)' };
}

function evaluate(target, opts = {}) {
  const docs = loadDocs(target);
  const findings = [];
  const add = (...a) => findings.push(finding(...a));
  const stats = { docs: docs.length, tables: 0, tooltips: 0, unverified: 0, decisions: 0 };
  if (!docs.length) return { status: 'NO_DOCS', findings, stats };

  const ids = new Map();          // id → Map(normalized name → {name, where})
  const traceItems = [];          // requirement cells of every traceability table
  let traceTables = 0;
  const headings = [];
  const allText = [];

  for (const d of docs) {
    for (const { n, text } of d.lines) {
      const where = `${d.rel}:${n}`;
      const h = /^#{1,6}\s+(.+?)\s*$/.exec(text);
      if (h) headings.push(h[1]);
      allText.push(text);
      if (ALLOW.test(text)) continue;
      if (TAG_UNVERIFIED.test(text)) { stats.unverified++; if (!HAS_METHOD.test(text)) add('unverified-without-method', where, 'plan.unverifiedWithoutMethod'); }
      if (TAG_DECISION.test(text)) { stats.decisions++; if (!HAS_REASON.test(text)) add('decision-without-reason', where, 'plan.decisionWithoutReason'); }
      if (text.includes('—')) add('em-dash', where, 'plan.emDash');
      const hype = HYPE.exec(text);
      if (hype) add('hype-word', where, 'plan.hypeWord', { word: hype[0] });
      let m; IMAGE.lastIndex = 0;
      while ((m = IMAGE.exec(text))) {
        const ref = m[1];
        if (/^(?:https?:|data:|#)/i.test(ref)) continue;
        if (!fs.existsSync(path.resolve(path.dirname(d.full), decodeURIComponent(ref)))) add('diagram-missing', where, 'plan.diagramMissing', { path: ref });
      }
    }

    for (const table of tablesIn(d.lines)) {
      stats.tables++;
      const lower = table.header.map(c => c.toLowerCase());
      const col = (re) => lower.findIndex(c => re.test(c));
      const tipCol = col(TOOLTIP_COL);
      const itemCol = col(TRACE_ITEM_COL);
      const whereCol = col(TRACE_WHERE_COL);
      const isTrace = itemCol >= 0 && whereCol >= 0 && itemCol !== whereCol;
      const idCol = col(ID_COL), nameCol = col(NAME_COL);
      if (isTrace) traceTables++;

      for (const row of table.rows) {
        const where = `${d.rel}:${row.n}`;
        const line = row.cells.join(' | ');
        if (ALLOW.test(line)) continue;
        table.header.forEach((name, i) => {
          const cell = row.cells[i] === undefined ? '' : row.cells[i];
          if (cell !== '') return;
          if (isTrace && i === whereCol) return; // reported as trace-unlocated below
          add('table-blank-cell', where, 'plan.tableBlankCell', { column: name });
        });
        const defer = DEFER.exec(line);
        if (defer && !TAG_DECISION.test(line)) add('deferred-marker', where, 'plan.deferredMarker', { marker: defer[0] });
        if (isTrace) {
          const item = row.cells[itemCol] || '';
          traceItems.push(item);
          const loc = (row.cells[whereCol] || '').trim();
          if (!loc || /^(?:-|—|없음)$/.test(loc)) add('trace-unlocated', where, 'plan.traceUnlocated', { item });
        }
        if (tipCol >= 0) {
          const tip = (row.cells[tipCol] || '').trim();
          if (tip && !NA.test(tip)) {
            stats.tooltips++;
            const count = wordCount(tip);
            if (count > MAX_TOOLTIP_WORDS) add('tooltip-too-long', where, 'plan.tooltipTooLong', { count, text: tip.slice(0, 60) });
          }
        }
        if (idCol >= 0 && nameCol >= 0 && idCol !== nameCol) {
          const id = (row.cells[idCol] || '').trim(), name = (row.cells[nameCol] || '').trim();
          if (ID_VALUE.test(id) && name) {
            if (!ids.has(id)) ids.set(id, new Map());
            const key = name.replace(/\s+/g, ' ').toLowerCase();
            if (!ids.get(id).has(key)) ids.get(id).set(key, { name, where });
          }
        }
      }
    }
  }

  if (!traceTables) add('no-traceability-table', '(docs)', 'plan.noTraceTable');
  for (const need of opts.required || []) {
    if (!traceItems.some(item => item.toLowerCase().includes(need.toLowerCase()))) add('trace-missing-item', '(docs)', 'plan.traceMissingItem', { item: need });
  }
  for (const [id, names] of ids) {
    if (names.size > 1) add('id-conflict', [...names.values()].map(v => v.where).join(' ≠ '), 'plan.idConflict', { id, names: [...names.values()].map(v => `"${v.name}"`).join(' / ') });
  }
  for (const s of SECTIONS) {
    const pool = s.anyLine ? allText : headings;
    if (!pool.some(x => s.re.test(x))) add('missing-section', '(docs)', 'plan.missingSection', { section: t(s.id) });
  }
  const sc = countSuccessCriteria(docs);
  if (sc.found && sc.count < MIN_SUCCESS_CRITERIA) add('success-criteria-count', sc.where, 'plan.successCriteriaCount', { count: sc.count });

  return { status: findings.length ? 'FAIL' : 'PASS', findings, stats };
}

function main(argv) {
  const args = argv.slice(2);
  const json = args.includes('--json');
  const target = positional(args, ['--required']);
  if (!target) { console.error(t('plan.usage')); return 2; }
  const r = evaluate(path.resolve(target), { required: argList(args, '--required') });
  if (r.status === 'NO_DOCS') { console.error(t('plan.noDocs', { target })); return 2; }
  if (json) console.log(JSON.stringify({ target, ...r }, null, 2));
  else {
    console.log(t('plan.summary', { mark: r.status === 'PASS' ? '✔' : '✗', status: r.status, ...r.stats }));
    for (const f of r.findings) console.log(`  [${f.rule}] ${f.where} · ${f.detail}`);
    if (r.status === 'FAIL') console.log(t('plan.drivingDoc'));
  }
  return r.status === 'PASS' ? 0 : 1;
}

if (require.main === module) process.exit(main(process.argv));

module.exports = { evaluate, countSuccessCriteria, main, SECTIONS, MAX_TOOLTIP_WORDS };
