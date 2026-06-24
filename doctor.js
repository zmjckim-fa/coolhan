#!/usr/bin/env node

/**
 * CoolHan Doctor — post-install verification CLI
 *
 * Verifies that a CoolHan installation in the current project is complete and
 * healthy: the agent harness, orchestrator skills, knowledge base, and the
 * CLAUDE.md harness pointers. Read-only — it never writes to user files.
 *
 * Usage:
 *   coolhan-doctor            # check the current directory
 *   node doctor.js [dir]      # check a specific directory
 *   node doctor.js --json     # machine-readable output
 *
 * Exit code: 0 if no FAIL checks, 1 otherwise. WARN does not fail.
 */

const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m', bright: '\x1b[1m', green: '\x1b[32m',
  blue: '\x1b[34m', yellow: '\x1b[33m', red: '\x1b[31m', gray: '\x1b[90m'
};
const paint = (s, c) => `${colors[c] || ''}${s}${colors.reset}`;

// Core development-harness agents expected after a CoolHan install.
const CORE_AGENTS = [
  'intent-analyzer', 'spec-writer', 'developer',
  'validator', 'qa-tester', 'devops-deployer'
];

function listMd(dir) {
  try {
    return fs.readdirSync(dir).filter(f => f.endsWith('.md'));
  } catch (_) {
    return [];
  }
}

function read(file) {
  try {
    return fs.readFileSync(file, 'utf8');
  } catch (_) {
    return null;
  }
}

/**
 * Run all health checks against `root`. Returns an array of
 * { name, status: 'pass'|'warn'|'fail', detail, fix? }.
 */
function runChecks(root) {
  const checks = [];
  const at = (...p) => path.join(root, ...p);

  // 1. CLAUDE.md harness pointer
  const claude = read(at('CLAUDE.md'));
  if (!claude) {
    checks.push({ name: 'CLAUDE.md', status: 'fail',
      detail: 'CLAUDE.md not found at project root',
      fix: 'Run `npx coolhan-install` to install the harness.' });
  } else if (/Harness|하네스|coolhan-development-orchestrator/i.test(claude)) {
    checks.push({ name: 'CLAUDE.md', status: 'pass', detail: 'harness pointer present' });
  } else {
    checks.push({ name: 'CLAUDE.md', status: 'warn',
      detail: 'CLAUDE.md exists but has no harness pointer',
      fix: 'Re-run the installer or add the harness section.' });
  }

  // 2. Core development-harness agents
  const agents = listMd(at('.claude', 'agents')).map(f => f.replace(/\.md$/, ''));
  const missing = CORE_AGENTS.filter(a => !agents.includes(a));
  if (agents.length === 0) {
    checks.push({ name: 'Agents', status: 'fail',
      detail: '.claude/agents not found or empty',
      fix: 'Run `npx coolhan-install`.' });
  } else if (missing.length) {
    checks.push({ name: 'Agents', status: 'fail',
      detail: `${agents.length} present; missing core: ${missing.join(', ')}`,
      fix: 'Reinstall to restore missing agents.' });
  } else {
    checks.push({ name: 'Agents', status: 'pass',
      detail: `${agents.length} agents (6/6 core present)` });
  }

  // 3. Orchestrator skill
  const orch = at('.claude', 'skills', 'coolhan-development-orchestrator', 'SKILL.md');
  if (fs.existsSync(orch)) {
    checks.push({ name: 'Skills', status: 'pass', detail: 'development orchestrator present' });
  } else {
    checks.push({ name: 'Skills', status: 'fail',
      detail: 'coolhan-development-orchestrator/SKILL.md not found',
      fix: 'Run `npx coolhan-install`.' });
  }

  // 4. Knowledge base domain modules (01..10)
  const kb = listMd(at('knowledge_base'));
  const domainModules = kb.filter(f => /^(0[1-9]|10)_/.test(f));
  if (kb.length === 0) {
    checks.push({ name: 'Knowledge Base', status: 'fail',
      detail: 'knowledge_base not found or empty',
      fix: 'Run `npx coolhan-install`.' });
  } else if (domainModules.length < 10) {
    checks.push({ name: 'Knowledge Base', status: 'warn',
      detail: `${domainModules.length}/10 domain modules found`,
      fix: 'Reinstall to restore the full domain-module set.' });
  } else {
    checks.push({ name: 'Knowledge Base', status: 'pass',
      detail: `${domainModules.length} domain modules` });
  }

  // 5. Node engine
  const major = parseInt(process.versions.node.split('.')[0], 10);
  if (major >= 14) {
    checks.push({ name: 'Node engine', status: 'pass', detail: `node ${process.versions.node} (>=14)` });
  } else {
    checks.push({ name: 'Node engine', status: 'fail',
      detail: `node ${process.versions.node} < 14`,
      fix: 'Upgrade Node.js to 14 or newer.' });
  }

  return checks;
}

function summarize(checks) {
  const count = s => checks.filter(c => c.status === s).length;
  return { pass: count('pass'), warn: count('warn'), fail: count('fail'), total: checks.length };
}

// UI framing strings (the per-check detail/fix text stays technical/English).
// CoolHan is multilingual; the human-facing framing localizes.
const MESSAGES = {
  en: { title: 'CoolHan Doctor', fix: 'fix:', healthy: '✔ healthy',
    healthyWarn: '▲ healthy with warnings', problems: '✗ problems found',
    counts: (s) => `(${s.pass} pass, ${s.warn} warn, ${s.fail} fail)` },
  ko: { title: 'CoolHan Doctor (설치 점검)', fix: '해결:', healthy: '✔ 정상',
    healthyWarn: '▲ 정상 (경고 있음)', problems: '✗ 문제 발견',
    counts: (s) => `(통과 ${s.pass} · 경고 ${s.warn} · 실패 ${s.fail})` }
};

/** Resolve output language: --lang ko|en wins; else env LANG/LC_ALL/LC_MESSAGES; else en. */
function resolveLang(argv, env) {
  const i = argv.indexOf('--lang');
  if (i !== -1 && argv[i + 1]) return argv[i + 1].toLowerCase().startsWith('ko') ? 'ko' : 'en';
  const loc = (env.LC_ALL || env.LC_MESSAGES || env.LANG || '').toLowerCase();
  return loc.startsWith('ko') ? 'ko' : 'en';
}

function render(root, checks, summary, lang = 'en') {
  const m = MESSAGES[lang] || MESSAGES.en;
  const icon = { pass: paint('✔', 'green'), warn: paint('▲', 'yellow'), fail: paint('✗', 'red') };
  console.log(paint(`\n${m.title}`, 'bright') + paint(`  ${root}`, 'gray'));
  console.log(paint('─'.repeat(48), 'gray'));
  for (const c of checks) {
    console.log(`${icon[c.status] || '?'} ${paint(c.name.padEnd(16), 'bright')} ${c.detail}`);
    if (c.fix && c.status !== 'pass') console.log(`   ${paint(m.fix, 'gray')} ${c.fix}`);
  }
  console.log(paint('─'.repeat(48), 'gray'));
  const verdict = summary.fail === 0
    ? paint(summary.warn === 0 ? m.healthy : m.healthyWarn, summary.warn === 0 ? 'green' : 'yellow')
    : paint(m.problems, 'red');
  console.log(`${verdict}  ${m.counts(summary)}\n`);
}

function main(argv) {
  const args = argv.slice(2);
  const json = args.includes('--json');
  const lang = resolveLang(args, process.env);
  const dir = args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--lang') || process.cwd();
  const root = path.resolve(dir);

  const checks = runChecks(root);
  const summary = summarize(checks);

  if (json) {
    console.log(JSON.stringify({ root, lang, summary, checks }, null, 2));
  } else {
    render(root, checks, summary, lang);
  }
  return summary.fail === 0 ? 0 : 1;
}

if (require.main === module) {
  process.exit(main(process.argv));
}

module.exports = { runChecks, summarize, render, resolveLang, main, CORE_AGENTS };
