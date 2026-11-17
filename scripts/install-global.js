#!/usr/bin/env node

/**
 * CoolHan install-global (G24): the standing orders reach every session on this machine, in every folder, for
 * every command, without the operator saying «쿨한으로».
 *
 * Before: the orders applied only inside the harness repository and inside folders where the project kit had been
 * installed. Any other session started with none of them, so the operator typed them again.
 * Now: one managed block in the user-level instruction file (<claude home>/CLAUDE.md, loaded by every session)
 * carries the orders (derived from knowledge_base/field-lessons.json `orders`), the harness location, and the rule
 * "development in a folder without coolhan.project.json starts by installing the project kit".
 *
 * Usage: node scripts/install-global.js [--claude-home <dir>] [--modules <dir>] [--check] [--remove] [--dry] [--json]
 *   (default)  write or refresh the block; the rest of the file is the operator's and is never touched.
 *              The file as it was before the first install is kept beside it as CLAUDE.md.before-coolhan.
 *   --check    0 = the block is the one the registry derives · 1 = stale (re-run without --check) ·
 *              4 = not installed on this machine (NOT_RUN: nothing to compare, not a pass)
 *   --remove   delete the block; everything else stays
 * Settings and hooks are not changed: loop hooks are installed per project by new-project.js.
 * Exit: 0 done / current · 1 stale (--check) · 2 usage · 4 not installed (--check)
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { argValue } = require('./lib/cli');
const { render, upsertBlock, removeBlock, blockBody } = require('./lib/template');
const { t } = require('./messages');
const lessons = require('./field-lessons');
const { detectModules, KIT, HOME } = require('./new-project');

const START = '<!-- coolhan:global:start -->';
const END = '<!-- coolhan:global:end -->';
const KNOWN = ['--claude-home', '--modules', '--check', '--remove', '--dry', '--json'];
const VALUE = ['--claude-home', '--modules'];
const read = (f) => fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n');
const slash = (p) => String(p).split(path.sep).join('/');

/** The block body: derived from the registry and the kit template, nothing typed here. */
function buildBlock({ home = HOME, modules } = {}) {
  const reg = lessons.load(path.join(home, lessons.DEFAULT_REGISTRY));
  const orders = lessons.ordersOf(reg).map(o => `- **${o.id} ${o.title}**: ${o.text}`).join('\n');
  return render(path.join(KIT, 'GLOBAL.md.tpl'), { home: slash(home), modules: modules || t('kit.none'), orders }).replace(/\s+$/, '');
}

function main(argv, { env = process.env } = {}) {
  const args = argv.slice(2);
  const bad = args.find((a, i) => a.startsWith('--') ? !KNOWN.includes(a) : !VALUE.includes(args[i - 1]));
  if (bad) { console.error(t('global.usage')); return 2; }
  const claudeHome = argValue(args, '--claude-home') || env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude');
  const file = path.join(claudeHome, 'CLAUDE.md');
  const modulesArg = argValue(args, '--modules');
  const body = buildBlock({ modules: modulesArg !== undefined ? modulesArg : detectModules() });
  const current = fs.existsSync(file) ? read(file) : null;
  const installed = current === null ? null : blockBody(current, START, END);
  const json = args.includes('--json'), dry = args.includes('--dry');
  const say = (key, code, extra = {}) => {
    if (json) console.log(JSON.stringify({ file: slash(file), result: key.split('.')[1], exit: code, ...extra }));
    else console.log(t(key, { file: slash(file) }));
    return code;
  };

  if (args.includes('--check')) {
    if (installed === null) return say('global.notInstalled', 4);
    return installed === body ? say('global.current', 0) : say('global.stale', 1);
  }
  if (args.includes('--remove')) {
    if (installed === null) return say('global.nothingToRemove', 0);
    if (!dry) fs.writeFileSync(file, removeBlock(current, START, END, `## ${t('global.heading')}`));
    return say('global.removed', 0);
  }
  if (installed === body) return say('global.current', 0);
  if (!dry) {
    fs.mkdirSync(claudeHome, { recursive: true });
    const keep = `${file}.before-coolhan`;
    if (current !== null && installed === null && !fs.existsSync(keep)) fs.writeFileSync(keep, current);
    fs.writeFileSync(file, upsertBlock(current || '', START, END, body, `## ${t('global.heading')}`).replace(/^\s+/, ''));
  }
  return say(installed === null ? 'global.installed' : 'global.refreshed', 0, { dry });
}

if (require.main === module) process.exit(main(process.argv));

module.exports = { main, buildBlock, START, END };
