#!/usr/bin/env node

/**
 * CoolHan new-project: the project kit (G23). Start a new site, or adopt an existing folder, with everything the
 * operator used to re-type in every project already in place.
 *
 * Field data (4,286 operator messages, 9 projects): "이어서 진행하라" 530 times, deploy 259, commit 152, verify 110 ...
 * The same orders were re-issued per project because the project folder did not carry them. This kit writes them
 * once, from knowledge_base/field-lessons.json (`orders`), so the next site starts with:
 *   CLAUDE.md          the standing orders (managed block; the rest of the file is the project's own)
 *   coolhan.project.json   tags, deploy authorization, module library, harness location (the one per-machine value)
 *   scripts/coolhan.js     launcher: gates and loop hooks run from the harness, nothing is copied
 *   .claude/settings.json  Stop / AskUserQuestion / UserPromptSubmit hooks (the loop runs without being told)
 *   docs/PROGRESS.md · CHECKS.md · DECISIONS.md · BLOCKED.md · HANDOFF.md · _workspace/_goal.md · _backlog.md
 *   docs/plan/MODULE_PLAN.md   one row per bundle of the module library (00Module_site), decision pre-filled by tag
 *   docs/plan/LESSON_PLAN.md   the 실패 방지 대응표 skeleton the plan gate checks
 *
 * Usage: node scripts/new-project.js <dir> --intent "한 줄 목표" [--name n] [--tags ui,deploy,money]
 *                                    [--deploy none|after-complete] [--modules <library dir>] [--refresh] [--dry] [--json]
 *   Existing files are never overwritten (adopt mode): only missing files are created, the CLAUDE.md orders block,
 *   .claude/settings.json hooks and .gitignore lines are merged. --refresh also rewrites the managed launcher.
 *   --check: exit 0 when the orders block, launcher and hooks equal what the harness derives, 1 when stale,
 *   4 when the folder has no kit (NOT_RUN). Writes nothing.
 * Exit: 0 done · 1 stale (--check) · 2 usage · 4 no kit (--check)
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { argValue, argList, positional } = require('./lib/cli');
const { fill, render, upsertBlock } = require('./lib/template');
const { t } = require('./messages');
const lessons = require('./field-lessons');

const HOME = path.resolve(__dirname, '..');
const KIT = path.join(HOME, 'knowledge_base', 'project-kit');
const VALUE_FLAGS = ['--intent', '--command', '--name', '--tags', '--deploy', '--modules'];
const DEFAULT_TAGS = ['ui', 'deploy'];
const DEPLOY = ['none', 'after-complete'];
const ORDERS = ['<!-- coolhan:orders:start -->', '<!-- coolhan:orders:end -->'];
const IGNORE = ['_workspace/_run-active.json', '_workspace/_stop-approved.json', '_workspace/_stop-guard-count.json', '.env'];
const read = (f) => fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n');
const readJson = (f) => { try { return JSON.parse(read(f)); } catch (_) { return null; } };
const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9가-힣]+/g, '-').replace(/^-+|-+$/g, '') || 'project';
const cellText = (s) => String(s || '').replace(/\|/g, '/').replace(/\s+/g, ' ').trim();

function detectModules() {
  const c = path.resolve(HOME, '..', '00Module_site');
  return fs.existsSync(path.join(c, '_specs', 'modules.json')) ? c.split(path.sep).join('/') : '';
}

/** Rows of docs/plan/MODULE_PLAN.md: one per bundle of the library, decision pre-filled from the project tags. */
function moduleRows(library, tags) {
  const j = library ? readJson(path.join(library, '_specs', 'modules.json')) : null;
  if (!j || !j.bundles) return [];
  const map = readJson(path.join(KIT, 'bundle-tags.json')) || { always: [], tags: {} };
  const byTag = {};
  for (const tag of tags) for (const id of map.tags[tag] || []) byTag[id] = byTag[id] || tag;
  return Object.keys(j.bundles).sort().map(id => {
    const b = j.bundles[id];
    const mods = b.modules || [];
    const ext = mods.filter(m => j.modules && j.modules[m] && j.modules[m].extracted).length;
    const reason = (map.always || []).includes(id) ? t('kit.reasonAlways') : byTag[id] ? t('kit.reasonTag', { tag: byTag[id] }) : '';
    const decision = reason ? (ext > 0 ? t('kit.adopt') : t('kit.refer')) : t('kit.exclude');
    return `| ${id} | ${cellText(b.label)} | ${cellText(String(b.layer || '').split(/[(/]/)[0])} | ${decision} | ${reason || t('kit.reasonNone')} | ${cellText(b.spec) || t('kit.none')} | ${ext}/${mods.length} |`;
  });
}

function mergeHooks(existing, kit) {
  const out = existing && typeof existing === 'object' ? existing : {};
  out.hooks = out.hooks || {};
  let changed = false;
  for (const [event, groups] of Object.entries(kit.hooks)) {
    out.hooks[event] = Array.isArray(out.hooks[event]) ? out.hooks[event] : [];
    if (!JSON.stringify(out.hooks[event]).includes('coolhan.js hook')) { out.hooks[event].push(...groups); changed = true; }
  }
  return { json: out, changed };
}

function main(argv) {
  const args = argv.slice(2);
  const target = positional(args, VALUE_FLAGS);
  if (!target) { console.error(t('kit.usage')); return 2; }
  const dir = path.resolve(target);
  const same = (a, b) => !!b && path.resolve(a).toLowerCase() === path.resolve(b).toLowerCase();
  if (same(dir, HOME) || same(dir, argValue(args, '--modules') || detectModules())) { console.error(t('kit.refuseTarget', { dir })); return 2; }
  const check = args.includes('--check');
  if (check && !fs.existsSync(path.join(dir, 'coolhan.project.json'))) { console.log(t('kit.checkNotInstalled', { dir })); return 4; }
  const dry = args.includes('--dry') || check, refresh = args.includes('--refresh') || check, json = args.includes('--json');
  const existing = readJson(path.join(dir, 'coolhan.project.json')) || {};
  const deploy = argValue(args, '--deploy') || existing.deploy || 'none';
  if (!DEPLOY.includes(deploy)) { console.error(t('kit.badDeploy', { values: DEPLOY.join(' | ') })); return 2; }
  const intent = argValue(args, '--intent') || existing.intent || '';
  if (!intent) { console.error(t('kit.noIntent')); return 2; }
  const tags = argList(args, '--tags') || existing.tags || DEFAULT_TAGS;
  const modulesArg = argValue(args, '--modules');
  const cfg = {
    name: argValue(args, '--name') || existing.name || path.basename(dir), intent, tags, deploy,
    home: existing.home && fs.existsSync(path.join(existing.home, 'scripts', 'completion-check.js')) ? existing.home : HOME.split(path.sep).join('/'),
    modules: modulesArg !== undefined ? modulesArg : (existing.modules !== undefined ? existing.modules : detectModules()),
    kit: require(path.join(HOME, 'package.json')).version
  };
  const reg = lessons.load(path.join(HOME, lessons.DEFAULT_REGISTRY));
  const orders = lessons.ordersOf(reg, ['all', ...tags]).map(o => `- **${o.id} ${o.title}**: ${o.text}`).join('\n');
  const rows = moduleRows(cfg.modules, tags);
  // The goal file keeps the operator's own words when they are given (--command); the one-line intent is a summary (track42 K-4).
  const vars = { name: cfg.name, intent: cfg.intent, command: argValue(args, '--command') || cfg.intent, tags: cfg.tags.join(', '), deploy: cfg.deploy, modules: cfg.modules || t('kit.none'), date: new Date().toISOString().slice(0, 10), slug: slug(cfg.name), orders, kit: cfg.kit };
  const done = { created: [], updated: [], skipped: [] };
  const put = (rel, content, how) => {
    const f = path.join(dir, rel);
    const cur = fs.existsSync(f) ? read(f) : null;
    if (cur === null) { done.created.push(rel); }
    else if (how === 'create') { done.skipped.push(rel); return; }
    else if (cur === content) { done.skipped.push(rel); return; }
    else done.updated.push(rel);
    if (!dry) { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, content); }
  };

  put('coolhan.project.json', JSON.stringify(cfg, null, 2) + '\n', 'managed');
  put('scripts/coolhan.js', read(path.join(KIT, 'coolhan.js')), refresh ? 'managed' : 'create');

  const claudeFile = path.join(dir, 'CLAUDE.md');
  put('CLAUDE.md', fs.existsSync(claudeFile) ? upsertBlock(read(claudeFile), ORDERS[0], ORDERS[1], orders, `## ${t('kit.ordersHeading')}`) : render(path.join(KIT, 'CLAUDE.md.tpl'), vars), 'managed');

  const settingsFile = path.join(dir, '.claude', 'settings.json');
  const cur = fs.existsSync(settingsFile) ? readJson(settingsFile) : {};
  if (cur === null) console.log(t('kit.badSettings'));
  else { const m = mergeHooks(cur, readJson(path.join(KIT, 'settings.json'))); put('.claude/settings.json', JSON.stringify(m.json, null, 2) + '\n', 'managed'); }

  const gi = fs.existsSync(path.join(dir, '.gitignore')) ? read(path.join(dir, '.gitignore')) : '';
  const missing = IGNORE.filter(l => !gi.split('\n').includes(l));
  if (missing.length) put('.gitignore', gi.replace(/\s*$/, gi ? '\n' : '') + missing.join('\n') + '\n', 'managed');

  for (const [rel, tpl] of [['HANDOFF.md', 'HANDOFF.md.tpl'], ['docs/PROGRESS.md', 'PROGRESS.md.tpl'], ['docs/CHECKS.md', 'CHECKS.md.tpl'], ['docs/DECISIONS.md', 'DECISIONS.md.tpl'], ['docs/BLOCKED.md', 'BLOCKED.md.tpl'], ['docs/plan/LESSON_PLAN.md', 'LESSON_PLAN.md.tpl'], ['_workspace/_goal.md', 'goal.md.tpl'], ['_workspace/_backlog.md', 'backlog.md.tpl']]) {
    put(rel, render(path.join(KIT, tpl), vars), 'create');
  }
  put('docs/plan/MODULE_PLAN.md', render(path.join(KIT, 'MODULE_PLAN.md.tpl'), { ...vars, rows: rows.join('\n') }), 'create');

  if (check) {
    const managed = ['CLAUDE.md', 'scripts/coolhan.js', '.claude/settings.json'];
    const stale = [...done.created, ...done.updated].filter(f => managed.includes(f));
    console.log(stale.length ? t('kit.checkStale', { dir, files: stale.join(', ') }) : t('kit.checkCurrent', { dir }));
    return stale.length ? 1 : 0;
  }
  const notes = [];
  if (!rows.length) notes.push(t('kit.noModules'));
  if (!fs.existsSync(path.join(os.homedir(), '.claude', 'skills', 'coolhan-development-orchestrator', 'SKILL.md'))) notes.push(t('kit.noSkills'));
  if (json) { console.log(JSON.stringify({ dir, config: cfg, ...done, notes }, null, 2)); return 0; }
  console.log(t('kit.summary', { dir, created: done.created.length, updated: done.updated.length, skipped: done.skipped.length, dry: dry ? ' (dry)' : '' }));
  for (const f of done.created) console.log(t('kit.created', { file: f }));
  for (const f of done.updated) console.log(t('kit.updated', { file: f }));
  for (const f of done.skipped) console.log(t('kit.skipped', { file: f }));
  for (const n of notes) console.log(n);
  console.log(t('kit.next'));
  return 0;
}

if (require.main === module) process.exit(main(process.argv));

module.exports = { main, moduleRows, mergeHooks, detectModules, KIT, HOME };
