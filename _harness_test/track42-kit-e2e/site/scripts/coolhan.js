#!/usr/bin/env node

/**
 * Project launcher (copied into every project by `node scripts/new-project.js`).
 *
 * Runs the CoolHan harness from the project folder so the project carries no copy of the gates:
 *   node scripts/coolhan.js progress-check docs/PROGRESS.md
 *   node scripts/coolhan.js checks-run
 *   node scripts/coolhan.js plan-doc-check docs/plan --lessons @home/knowledge_base/field-lessons.json --tags @tags --modules @modules
 *   node scripts/coolhan.js handoff                 (refreshes the state block of HANDOFF.md)
 *   node scripts/coolhan.js hook stop-guard         (used by .claude/settings.json; always fails open)
 *   node scripts/coolhan.js modules list            (the module library's own loader)
 *   node scripts/coolhan.js where
 *
 * The only machine-specific value is `home` in coolhan.project.json (or the COOLHAN_HOME environment
 * variable). `@home`, `@tags`, `@modules` in arguments expand to the harness folder, the project's tags and the
 * module library. If the harness cannot be found a gate exits 4 (NOT_RUN: not verified, never a pass) and a hook
 * exits 0 (it must never trap the operator).
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const CONFIG = 'coolhan.project.json';
const ALIAS = { handoff: 'handoff-write' };
const TOOL = /^[a-z][a-z0-9-]*$/;

function readConfig(dir) { try { return JSON.parse(fs.readFileSync(path.join(dir, CONFIG), 'utf8')); } catch (_) { return {}; } }

function resolveHome(cfg, env) {
  return [env.COOLHAN_HOME, cfg.home].filter(Boolean).find(h => fs.existsSync(path.join(h, 'scripts', 'completion-check.js'))) || null;
}

function expand(args, cfg, home) {
  return args.map(a => a.split('@home').join(home).split('@tags').join((cfg.tags || []).join(',')).split('@modules').join(cfg.modules || ''));
}

function main(argv, { cwd = process.cwd(), env = process.env } = {}) {
  const [tool, ...rest] = argv.slice(2);
  if (!tool) { console.error('usage: node scripts/coolhan.js <tool|hook|modules|where> [args]'); return 2; }
  const cfg = readConfig(cwd);
  const home = resolveHome(cfg, env);
  const isHook = tool === 'hook';
  if (tool === 'where') { console.log(home || '(not found)'); return home ? 0 : 4; }
  if (!home) {
    if (!isHook) console.error(`coolhan: harness not found (set "home" in ${CONFIG} or COOLHAN_HOME). Not verified: exit 4`);
    return isHook ? 0 : 4;
  }
  let script, args;
  if (isHook) {
    if (!TOOL.test(rest[0] || '')) return 0;
    script = path.join(home, '.claude', 'hooks', `${rest[0]}.js`); args = [];
  } else if (tool === 'modules') {
    if (!cfg.modules || !fs.existsSync(path.join(cfg.modules, 'coolhan.mjs'))) { console.error(`coolhan: module library not found ("modules" in ${CONFIG}). Not verified: exit 4`); return 4; }
    script = path.join(cfg.modules, 'coolhan.mjs'); args = rest;
  } else {
    if (!TOOL.test(tool)) { console.error(`coolhan: bad tool name ${tool}`); return 2; }
    script = path.join(home, 'scripts', `${ALIAS[tool] || tool}.js`); args = expand(rest, cfg, home);
  }
  if (!fs.existsSync(script)) { if (!isHook) console.error(`coolhan: no such tool ${tool}`); return isHook ? 0 : 2; }
  const r = spawnSync(process.execPath, [script, ...args], { stdio: 'inherit', cwd, env });
  return r.status === null ? 1 : r.status;
}

if (require.main === module) process.exit(main(process.argv));

module.exports = { main, readConfig, resolveHome, expand, CONFIG };
