#!/usr/bin/env node

/**
 * CoolHan handoff-write: refresh the "현재 상태" block of HANDOFF.md from the progress ledger (G23, operator order O-09).
 *
 * The operator asked for a detailed handoff after every commit, in five different projects. The state part of a
 * handoff is fully derivable (goal, progress, current position, open defects, last commits), so it is generated and
 * never hand-written; the human-written parts of HANDOFF.md are left alone.
 *
 * Usage: node scripts/handoff-write.js [--root <project>] [--ledger docs/PROGRESS.md] [--handoff HANDOFF.md] [--print]
 *        (from a project: node scripts/coolhan.js handoff)
 * Exit:  0 written · 4 NOT_RUN (no ledger to read: nothing is invented) · 2 usage
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { argValue } = require('./lib/cli');
const { upsertBlock } = require('./lib/template');
const { evaluate } = require('./progress-check');
const { t } = require('./messages');

const START = '<!-- coolhan:state:start -->';
const END = '<!-- coolhan:state:end -->';

function lastCommits(root, n = 5) {
  const r = spawnSync('git', ['log', `-${n}`, '--oneline'], { cwd: root, encoding: 'utf8' });
  return r.status === 0 ? r.stdout.split('\n').filter(Boolean) : [];
}

/** Markdown body of the state block, from the ledger text (pure; the date and commits are passed in). */
function buildState(ledgerMd, { date, commits = [] }) {
  const r = evaluate(ledgerMd);
  const s = r.summary;
  const lines = [
    t('handoff.header', { date }),
    t('handoff.goal', { goal: r.goal || t('handoff.none') }),
    t('handoff.progress', { done: s.done, total: s.total, inProgress: s.in_progress.join(', ') || t('handoff.none'), pending: s.pending.length }),
    t('handoff.position', { position: (r.position || '').split('\n')[0] || t('handoff.none') }),
    t('handoff.defects', { ids: s.open_defects.join(', ') || t('handoff.none') }),
    t('handoff.commits')
  ];
  for (const c of commits) lines.push(`  - ${c}`);
  if (!commits.length) lines.push(`  - ${t('handoff.none')}`);
  lines.push(t('handoff.resume'), t('handoff.verify'));
  return lines.join('\n');
}

function main(argv) {
  const args = argv.slice(2);
  const root = path.resolve(argValue(args, '--root') || '.');
  const ledger = path.resolve(root, argValue(args, '--ledger') || 'docs/PROGRESS.md');
  const handoff = path.resolve(root, argValue(args, '--handoff') || 'HANDOFF.md');
  let md;
  try { md = fs.readFileSync(ledger, 'utf8'); }
  catch (_) { console.error(t('handoff.noLedger', { file: ledger })); return 4; }
  const body = buildState(md, { date: new Date().toISOString().slice(0, 10), commits: lastCommits(root) });
  if (args.includes('--print')) { console.log(body); return 0; }
  let cur = ''; try { cur = fs.readFileSync(handoff, 'utf8').replace(/\r\n/g, '\n'); } catch (_) { /* created below */ }
  fs.mkdirSync(path.dirname(handoff), { recursive: true });
  fs.writeFileSync(handoff, upsertBlock(cur || `# ${path.basename(root)}: ${t('handoff.title')}\n`, START, END, body, `## ${t('handoff.stateHeading')}`));
  console.log(t('handoff.written', { file: path.relative(process.cwd(), handoff) || handoff }));
  return 0;
}

if (require.main === module) process.exit(main(process.argv));

module.exports = { buildState, main, START, END };
