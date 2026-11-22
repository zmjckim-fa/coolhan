#!/usr/bin/env node
/**
 * CoolHan module admission: everything a module must show before it is committed to the library, in one command
 * with every exit status read (knowledge_base/00_MODULE_STANDARD.md §6-1, §8).
 *
 * Why (2026-11-22): the four checks were run by hand, one shell line each. One commit went in while the secret scan
 * had four findings, because its exit status was behind a pipe. A sequence that lives in prose and shell history
 * can skip a step; this script cannot.
 *
 * Per module, in order:
 *   form     scripts/module-check.js rules on the module folder
 *   test     the manifest's own test command, run in the module folder
 *   install  the module (with what it requires) into an empty throwaway folder through the module manager,
 *            `status` there, and the same test command inside the installed copy: it must stand without the library
 *   secrets  scripts/secret-scan.js rules on every file of the module
 * A step that could not measure anything (no test command, a test run that counted 0 tests, a child that never
 * started) is NOT_RUN, never PASS. Nothing is committed here: admission says whether a commit may follow.
 *
 * Usage:
 *   node scripts/module-admit.js <name...> --library <dir> [--with-dependents] [--consumer <project dir> [--consumer-check "<command>"]] [--json]
 *   node scripts/module-admit.js --all --library <dir> [--json]
 *
 * --with-dependents also admits every module that requires a named one, directly or through another module: a
 * change that passes on its own can still break what is built on it (a minor version of a shared frame did, v2.12.3).
 *
 * --consumer <dir> adds one more measurement after the modules pass: a project that has modules installed takes the
 * new versions through the manager (`modules update --all`) and runs its own check (--consumer-check, default
 * `npm run typecheck`). Modules that each pass their own tests and do not fit each other, or a change labelled smaller
 * than it is, show there and nowhere else (three cases on 2026-11-22, all found by a project's type check). The
 * consumer is updated only when every module passed; a refused update or a failing check is FAIL, a consumer without
 * the check command is NOT_RUN.
 *
 * Exit: 0 every step of every module PASS · 1 any FAIL · 2 usage · 4 something NOT_RUN and nothing failed, or no
 *       such module: never a pass
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { argValue } = require('./lib/cli');
const { isDir } = require('./lib/fs');
const { runNode, neverStarted } = require('./lib/spawn-node');
const { t } = require('./messages');
const { evaluate } = require('./module-check');
const { scanPath } = require('./secret-scan');
const { catalog, withRequirements, INSTALL_DIR } = require('./modules');

const MANAGER = path.join(__dirname, 'modules.js');
const STEPS = ['form', 'test', 'install', 'secrets'];
const COUNT = /^(?:#|ℹ) (tests|fail|skipped) (\d+)/gm;

/** Counts printed by Node's test runner, or null when the command printed none. */
function counts(text) {
  const out = {}; let m;
  COUNT.lastIndex = 0;
  while ((m = COUNT.exec(text))) out[m[1]] = Number(m[2]);
  return out.tests === undefined ? null : out;
}

/** Run a module's own test command in `dir`. */
function runTest(command, dir) {
  if (!command || !String(command).trim()) return { status: 'NOT_RUN', detail: t('admit.noTestCommand') };
  const r = spawnSync(command, { cwd: dir, shell: true, encoding: 'utf8', timeout: 600000 });
  if (neverStarted(r)) return { status: 'NOT_RUN', detail: t('admit.neverStarted') };
  const c = counts(`${r.stdout}\n${r.stderr}`);
  if (r.status !== 0) return { status: 'FAIL', detail: t('admit.testFailed', { exit: r.status, failed: c ? c.fail : '?' }), counts: c };
  if (c && c.tests === 0) return { status: 'NOT_RUN', detail: t('admit.zeroTests'), counts: c };
  return { status: 'PASS', detail: c ? t('admit.testCounts', { tests: c.tests, skipped: c.skipped || 0 }) : t('admit.testNoCounts'), counts: c };
}

function stepForm(dir) {
  const r = evaluate(dir);
  if (r.status === 'NO_MODULES') return { status: 'NOT_RUN', detail: t('admit.noManifest') };
  return r.status === 'PASS' ? { status: 'PASS', detail: t('admit.formPass') }
    : { status: 'FAIL', detail: t('admit.formFail', { count: r.findings.length, rules: [...new Set(r.findings.map(f => f.rule))].join(', ') }) };
}

function stepInstall(name, command, library) {
  const app = fs.mkdtempSync(path.join(os.tmpdir(), 'coolhan-admit-'));
  try {
    const add = runNode(MANAGER, ['add', name, '--app', app, '--library', library]);
    if (neverStarted(add)) return { status: 'NOT_RUN', detail: t('admit.neverStarted') };
    if (add.status !== 0) return { status: 'FAIL', detail: t('admit.addFailed', { exit: add.status, text: String(add.stderr || add.stdout).trim().split('\n')[0] }) };
    const st = runNode(MANAGER, ['status', '--app', app, '--library', library]);
    if (neverStarted(st)) return { status: 'NOT_RUN', detail: t('admit.neverStarted') };
    if (st.status !== 0) return { status: 'FAIL', detail: t('admit.statusFailed', { exit: st.status }) };
    const tested = runTest(command, path.join(app, INSTALL_DIR, name));
    return tested.status === 'PASS' ? { status: 'PASS', detail: t('admit.installPass', { detail: tested.detail }) }
      : { status: tested.status, detail: t('admit.installedTest', { detail: tested.detail }) };
  } finally {
    fs.rmSync(app, { recursive: true, force: true });
  }
}

function stepSecrets(dir) {
  const r = scanPath(dir);
  if (!r.files) return { status: 'NOT_RUN', detail: t('admit.noFiles') };
  return r.findings.length
    ? { status: 'FAIL', detail: t('admit.secretsFail', { count: r.findings.length, where: r.findings.slice(0, 5).map(f => `${path.relative(dir, f.file).replace(/\\/g, '/')}:${f.line}`).join(', ') }) }
    : { status: 'PASS', detail: t('admit.secretsPass', { files: r.files }) };
}

/** Admission result of one module of the library. */
function admit(name, library, cat) {
  const entry = cat[name];
  if (!entry) return { name, status: 'NOT_RUN', steps: {}, detail: t('modules.unknown', { name, from: '' }) };
  const dir = entry.dir;
  const command = JSON.parse(fs.readFileSync(path.join(dir, 'module.json'), 'utf8')).test;
  const steps = { form: stepForm(dir) };
  // A module whose form fails is not installed: the manager would copy a folder the standard does not describe.
  steps.test = runTest(command, dir);
  steps.install = steps.form.status === 'PASS' ? stepInstall(name, command, library) : { status: 'NOT_RUN', detail: t('admit.skippedAfterForm') };
  steps.secrets = stepSecrets(dir);
  const all = STEPS.map(s => steps[s].status);
  const status = all.includes('FAIL') ? 'FAIL' : all.includes('NOT_RUN') ? 'NOT_RUN' : 'PASS';
  return { name, version: entry.version, status, steps };
}

/** The named modules plus every module of the catalogue that requires one of them, directly or through another module. */
function withDependents(names, cat) {
  const out = new Set(names);
  for (let grew = true; grew;) {
    grew = false;
    for (const m of Object.values(cat)) if (!out.has(m.name) && m.requires.some(r => out.has(r))) { out.add(m.name); grew = true; }
  }
  return [...out].sort();
}

/** A project that uses the modules takes the new versions and runs its own check. */
function checkConsumer(dir, command, library) {
  if (!isDir(dir) || !fs.existsSync(path.join(dir, 'coolhan.modules.json'))) return { status: 'NOT_RUN', detail: t('admit.consumerNone', { dir }) };
  const up = runNode(MANAGER, ['update', '--all', '--app', dir, '--library', library]);
  if (neverStarted(up)) return { status: 'NOT_RUN', detail: t('admit.neverStarted') };
  if (up.status !== 0) return { status: 'FAIL', detail: t('admit.consumerUpdate', { exit: up.status, text: String(up.stderr || up.stdout).trim().split('\n').filter(l => /✗/.test(l))[0] || '' }) };
  const updated = String(up.stdout).split('\n').filter(l => /↑/.test(l)).length;
  const r = spawnSync(command, { cwd: dir, shell: true, encoding: 'utf8', timeout: 600000 });
  if (neverStarted(r)) return { status: 'NOT_RUN', detail: t('admit.neverStarted') };
  // npm prints this when the script does not exist: nothing was checked.
  if (r.status !== 0 && /Missing script/i.test(`${r.stdout}${r.stderr}`)) return { status: 'NOT_RUN', detail: t('admit.consumerNoCheck', { command }) };
  if (r.status !== 0) return { status: 'FAIL', detail: t('admit.consumerCheck', { command, exit: r.status, text: `${r.stdout}\n${r.stderr}`.split('\n').map(l => l.trim()).filter(l => /error|Error|✗|FAIL/.test(l))[0] || '' }), updated };
  return { status: 'PASS', detail: t('admit.consumerPass', { updated, command }), updated };
}

function main(argv) {
  const args = argv.slice(2);
  const library = argValue(args, '--library') || process.env.COOLHAN_MODULES || '';
  const VALUE = ['--library', '--consumer', '--consumer-check'];
  const bad = args.find(a => a.startsWith('--') && ![...VALUE, '--json', '--all', '--with-dependents'].includes(a));
  let names = args.filter((a, i) => !a.startsWith('--') && !VALUE.includes(args[i - 1]));
  const consumerDir = argValue(args, '--consumer');
  if (bad || (!names.length && !args.includes('--all'))) { console.error(t('admit.usage')); return 2; }
  const cat = isDir(library) ? catalog(library) : null;
  if (!cat) { console.error(t('modules.noLibrary')); return 4; }
  if (args.includes('--all')) names = Object.keys(cat).sort();
  else if (args.includes('--with-dependents')) {
    const named = new Set(names);
    names = withDependents(names.filter(n => cat[n]), cat).concat(names.filter(n => !cat[n]));
    const added = names.filter(n => !named.has(n));
    if (added.length && !args.includes('--json')) console.log(t('admit.dependents', { count: added.length, names: added.join(', ') }));
  }
  // What a module requires must be in the library too, or the install step cannot be read.
  for (const n of names) { if (cat[n]) { try { withRequirements([n], cat); } catch (e) { console.error(e.message); return 1; } } }
  const results = names.map(n => admit(n, library, cat));
  let failed = results.filter(r => r.status === 'FAIL').length;
  let notRun = results.filter(r => r.status === 'NOT_RUN').length;
  // The consumer takes the new versions only when every module passed: a project is not updated to something refused.
  const consumer = !consumerDir ? null
    : failed || notRun ? { status: 'NOT_RUN', detail: t('admit.consumerSkipped') }
      : checkConsumer(path.resolve(consumerDir), argValue(args, '--consumer-check') || 'npm run typecheck', library);
  if (consumer && consumer.status === 'FAIL') failed += 1;
  if (consumer && consumer.status === 'NOT_RUN') notRun += 1;
  if (args.includes('--json')) console.log(JSON.stringify({ status: failed ? 'FAIL' : notRun ? 'NOT_RUN' : 'PASS', modules: results, ...(consumer ? { consumer } : {}) }, null, 2));
  else {
    for (const r of results) {
      console.log(t('admit.moduleLine', { mark: r.status === 'PASS' ? '✔' : r.status === 'FAIL' ? '✗' : '○', name: r.name, version: r.version || '', status: r.status }));
      if (r.detail) console.log(`    ${r.detail}`);
      for (const s of STEPS) if (r.steps[s]) console.log(`    ${r.steps[s].status.padEnd(7)} ${s.padEnd(8)} ${r.steps[s].detail}`);
    }
    if (consumer) console.log(t('admit.consumerLine', { mark: consumer.status === 'PASS' ? '✔' : consumer.status === 'FAIL' ? '✗' : '○', status: consumer.status, detail: consumer.detail }));
    console.log(t('admit.summary', { total: results.length, pass: results.filter(r => r.status === 'PASS').length, failed, notRun }));
  }
  return failed ? 1 : notRun || !results.length ? 4 : 0;
}

if (require.main === module) process.exit(main(process.argv));

module.exports = { main, admit, runTest, counts, withDependents, checkConsumer, STEPS };
