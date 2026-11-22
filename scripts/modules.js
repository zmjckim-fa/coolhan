#!/usr/bin/env node
/**
 * CoolHan module manager: take a module from the library into any project, see whether it is behind, replace it
 * by the newer one (knowledge_base/00_MODULE_STANDARD.md §7, §8).
 *
 * Operator order (2026-11-22): any session in any folder must be able to take the modules it needs; a project that
 * holds an older module must be able to attach the upgraded one; when one side improves, the others follow. Used
 * like plug-ins.
 *
 * The library is only read. A project gets:
 *   coolhan_modules/<name>/     the module folder, exactly as in the library
 *   coolhan.modules.json        the record: version, content hash, library commit and a hash per file
 * so «is this module behind» and «did the project change it» are decided by hashes, not by memory.
 *
 * Usage:
 *   node scripts/modules.js list   [--library <dir>] [--json]
 *   node scripts/modules.js add    <name...> [--app <dir>] [--library <dir>]
 *   node scripts/modules.js status [--app <dir>] [--library <dir>] [--json] [--allow-none]
 *   node scripts/modules.js update <name...|--all> [--app <dir>] [--library <dir>] [--force]
 *   node scripts/modules.js remove <name> [--app <dir>] [--force]
 *   node scripts/modules.js drift  [--library <dir>] [--sites <dir>] [--json]
 *
 * Exit: 0 done / current · 1 behind, refused or source ahead · 2 usage · 4 nothing to measure (no library, nothing
 *       installed, no origin that can be read): never a pass
 *
 * `drift` reads git history of the projects a module came from (read-only): a module whose origin paths changed
 * after it was taken is a candidate for absorption. Whether the change is an improvement is judged by a reader.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');
const { argValue } = require('./lib/cli');
const { isDir } = require('./lib/fs');
const { t } = require('./messages');
const { requireNames } = require('./module-check');

const RECORD = 'coolhan.modules.json';
const INSTALL_DIR = 'coolhan_modules';
const LOCAL_DIR = '.local';
const VALUE_FLAGS = ['--app', '--library', '--sites'];
const FLAGS = new Set([...VALUE_FLAGS, '--json', '--force', '--all', '--allow-none']);

const sha = (buf) => crypto.createHash('sha256').update(buf).digest('hex');
const readJson = (file, fallback) => { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (_) { return fallback; } };

/**
 * The bytes that count as a file's content. A text file checked out with CRLF and the same file with LF are the
 * same module content (git may rewrite line endings on checkout), so text is hashed with LF.
 */
function contentOf(file) {
  const buf = fs.readFileSync(file);
  return buf.subarray(0, 8192).includes(0) ? buf : Buffer.from(buf.toString('utf8').replace(/\r\n/g, '\n'), 'utf8');
}

/** Every file of a folder as { 'rel/path': sha256 }, sorted. */
function fileHashes(dir) {
  const out = {};
  const walk = (d, rel) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const r = rel ? `${rel}/${e.name}` : e.name;
      if (e.isDirectory()) walk(path.join(d, e.name), r); else out[r] = sha(contentOf(path.join(d, e.name)));
    }
  };
  if (isDir(dir)) walk(dir, '');
  return out;
}
const contentHash = (files) => sha(Object.keys(files).sort().map(k => `${k}\0${files[k]}`).join('\n'));

/** Where the standard modules live inside a library: <library>/modules, or the library folder itself. */
function modulesRoot(library) {
  if (!library || !isDir(library)) return null;
  return isDir(path.join(library, 'modules')) ? path.join(library, 'modules') : library;
}

function catalog(library) {
  const root = modulesRoot(library);
  if (!root) return null;
  const out = {};
  for (const e of fs.readdirSync(root, { withFileTypes: true })) {
    if (!e.isDirectory() || e.name.startsWith('.') || e.name.startsWith('_')) continue;
    const dir = path.join(root, e.name);
    const m = readJson(path.join(dir, 'module.json'), null);
    if (!m || m.name !== e.name) continue;
    const files = fileHashes(dir);
    out[e.name] = { name: e.name, version: m.version, label: m.label, area: m.area, stack: m.stack, requires: requireNames(m), origin: Array.isArray(m.origin) ? m.origin : [], dir, files, hash: contentHash(files) };
  }
  return out;
}

function libraryCommit(library) {
  const r = spawnSync('git', ['-C', library, 'rev-parse', '--short', 'HEAD'], { encoding: 'utf8' });
  return r.status === 0 ? r.stdout.trim() : null;
}

const recordPath = (app) => path.join(app, RECORD);
const readRecord = (app) => readJson(recordPath(app), { modules: {} });
const writeRecord = (app, rec) => fs.writeFileSync(recordPath(app), JSON.stringify(rec, null, 2) + '\n');
const installPath = (app, name) => path.join(app, INSTALL_DIR, name);

function copyModule(from, to) {
  fs.rmSync(to, { recursive: true, force: true });
  fs.cpSync(from, to, { recursive: true });
}

/** Names with everything they require, requirements first. Throws on an unknown name or a cycle. */
function withRequirements(names, cat) {
  const order = []; const seen = new Set(); const open = new Set();
  const visit = (n, from) => {
    if (seen.has(n)) return;
    if (!cat[n]) throw new Error(t('modules.unknown', { name: n, from: from || '' }));
    if (open.has(n)) throw new Error(t('modules.cycle', { name: n }));
    open.add(n); for (const r of cat[n].requires) visit(r, n); open.delete(n);
    seen.add(n); order.push(n);
  };
  for (const n of names) visit(n, null);
  return order;
}

/** State of one installed module against the library and against the project's own files. */
function stateOf(app, name, entry, cat) {
  const now = fileHashes(installPath(app, name));
  const changed = Object.keys({ ...entry.files, ...now }).filter(f => entry.files[f] !== now[f]).sort();
  const lib = cat ? cat[name] : undefined;
  const behind = !!lib && lib.hash !== entry.hash;
  return { name, installed: entry.version, available: lib ? lib.version : null, behind, missing_in_library: !!cat && !lib, modified: changed };
}

function install(app, name, cat, rec, commit) {
  copyModule(cat[name].dir, installPath(app, name));
  rec.modules[name] = { version: cat[name].version, hash: cat[name].hash, library_commit: commit, installed_at: new Date().toISOString(), requires: cat[name].requires, files: cat[name].files };
}

function cmdList(cat, json) {
  const rows = Object.values(cat).sort((a, b) => a.name.localeCompare(b.name));
  if (json) console.log(JSON.stringify(rows.map(({ dir, files, ...rest }) => rest), null, 2));
  else { console.log(t('modules.listHead', { count: rows.length })); for (const m of rows) console.log(`  ${m.name}  ${m.version}  [${m.stack}]  ${m.label || ''}`); }
  return rows.length ? 0 : 4;
}

function cmdAdd(names, app, cat, library) {
  if (!names.length) { console.error(t('modules.usage')); return 2; }
  let order; try { order = withRequirements(names, cat); } catch (e) { console.error(e.message); return 1; }
  const rec = readRecord(app); const commit = libraryCommit(library);
  for (const n of order) {
    const dest = installPath(app, n);
    if (rec.modules[n]) { console.log(t('modules.already', { name: n, version: rec.modules[n].version })); continue; }
    if (fs.existsSync(dest)) { console.error(t('modules.destOccupied', { dest })); return 1; }
    install(app, n, cat, rec, commit);
    console.log(t('modules.added', { name: n, version: cat[n].version, dest: `${INSTALL_DIR}/${n}` }));
  }
  rec.library = library; writeRecord(app, rec);
  return 0;
}

function cmdStatus(app, cat, json, allowNone) {
  const rec = readRecord(app); const names = Object.keys(rec.modules).sort();
  // A project that uses no module has nothing to be behind on: with --allow-none that is a plain 0, said in words.
  if (!names.length && allowNone) { console.log(json ? JSON.stringify({ status: 'NONE', modules: [] }) : t('modules.noneAllowed')); return 0; }
  if (!names.length) { console.log(json ? JSON.stringify({ status: 'NOT_RUN', modules: [] }) : t('modules.noneInstalled', { app })); return 4; }
  if (!cat) { console.log(json ? JSON.stringify({ status: 'NOT_RUN', reason: 'library not found' }) : t('modules.noLibrary')); return 4; }
  const states = names.map(n => stateOf(app, n, rec.modules[n], cat));
  const behind = states.filter(s => s.behind || s.missing_in_library);
  if (json) console.log(JSON.stringify({ status: behind.length ? 'BEHIND' : 'CURRENT', modules: states }, null, 2));
  else {
    for (const s of states) {
      const key = s.missing_in_library ? 'modules.stateMissing' : s.behind ? 'modules.stateBehind' : 'modules.stateCurrent';
      console.log(t(key, s) + (s.modified.length ? t('modules.stateModified', { count: s.modified.length, files: s.modified.slice(0, 5).join(', ') }) : ''));
    }
    console.log(t('modules.statusLine', { total: states.length, behind: behind.length, modified: states.filter(s => s.modified.length).length }));
  }
  return behind.length ? 1 : 0;
}

function cmdUpdate(names, app, cat, library, { all, force }) {
  const rec = readRecord(app);
  const targets = all ? Object.keys(rec.modules).sort() : names;
  if (!targets.length) { console.error(t('modules.usage')); return 2; }
  const commit = libraryCommit(library); let refused = 0;
  for (const n of targets) {
    const entry = rec.modules[n];
    if (!entry) { console.error(t('modules.notInstalled', { name: n })); refused++; continue; }
    if (!cat[n]) { console.error(t('modules.stateMissing', { name: n, installed: entry.version })); refused++; continue; }
    const s = stateOf(app, n, entry, cat);
    if (!s.behind) { console.log(t('modules.stateCurrent', s)); continue; }
    if (s.modified.length && !force) { console.error(t('modules.updateRefused', { name: n, files: s.modified.join(', ') })); refused++; continue; }
    for (const f of s.modified) {                                 // --force: the project's own edits are kept beside, never lost
      const src = path.join(installPath(app, n), f);
      if (!fs.existsSync(src)) continue;
      const keep = path.join(app, INSTALL_DIR, LOCAL_DIR, n, f);
      fs.mkdirSync(path.dirname(keep), { recursive: true }); fs.copyFileSync(src, keep);
    }
    let order; try { order = withRequirements([n], cat); } catch (e) { console.error(e.message); refused++; continue; }
    for (const r of order.filter(x => x !== n && !rec.modules[x])) { install(app, r, cat, rec, commit); console.log(t('modules.added', { name: r, version: cat[r].version, dest: `${INSTALL_DIR}/${r}` })); }
    install(app, n, cat, rec, commit);
    console.log(t('modules.updated', { name: n, from: entry.version, to: cat[n].version, kept: s.modified.length }));
  }
  writeRecord(app, rec);
  return refused ? 1 : 0;
}

function cmdRemove(name, app, force) {
  const rec = readRecord(app); const entry = rec.modules[name];
  if (!entry) { console.error(t('modules.notInstalled', { name })); return 1; }
  const users = Object.keys(rec.modules).filter(n => n !== name && (rec.modules[n].requires || []).includes(name));
  if (users.length) { console.error(t('modules.removeNeeded', { name, users: users.join(', ') })); return 1; }
  const s = stateOf(app, name, entry, null);
  if (s.modified.length && !force) { console.error(t('modules.removeModified', { name, files: s.modified.join(', ') })); return 1; }
  fs.rmSync(installPath(app, name), { recursive: true, force: true });
  delete rec.modules[name]; writeRecord(app, rec);
  console.log(t('modules.removed', { name }));
  return 0;
}

/** Commits in the origin project that touched the origin path after the module was taken (read-only git). */
function originAhead(sitesRoot, o) {
  const site = path.join(sitesRoot, o.site);
  if (!isDir(path.join(site, '.git')) && !fs.existsSync(path.join(site, '.git'))) return { measured: false, reason: 'no repository' };
  const file = String(o.path).replace(/:[\d,\-\s]+$/, '');
  const range = o.commit ? [`${o.commit}..HEAD`] : o.date ? [`--since=${o.date}T23:59:59`, 'HEAD'] : null;
  if (!range) return { measured: false, reason: t('modules.reasonNoPoint') };
  const r = spawnSync('git', ['-C', site, 'rev-list', '--count', ...range, '--', file], { encoding: 'utf8' });
  if (r.status !== 0) return { measured: false, reason: (r.stderr || '').trim().split('\n')[0].slice(0, 80) || 'git failed' };
  return { measured: true, commits: Number(r.stdout.trim()) };
}

function cmdDrift(cat, sitesRoot, json) {
  const rows = [];
  for (const m of Object.values(cat)) {
    for (const o of m.origin) {
      if (!o || !o.site || !o.path) continue;
      rows.push({ module: m.name, version: m.version, site: o.site, path: o.path, ...originAhead(sitesRoot, { ...o, date: o.date || null }) });
    }
  }
  const measured = rows.filter(r => r.measured); const ahead = measured.filter(r => r.commits > 0);
  if (json) console.log(JSON.stringify({ status: !measured.length ? 'NOT_RUN' : ahead.length ? 'SOURCE_AHEAD' : 'CURRENT', measured: measured.length, not_measured: rows.length - measured.length, ahead }, null, 2));
  else {
    for (const r of ahead.sort((a, b) => b.commits - a.commits)) console.log(t('modules.driftAhead', r));
    console.log(t('modules.driftLine', { origins: rows.length, measured: measured.length, ahead: ahead.length, modules: new Set(ahead.map(r => r.module)).size, notMeasured: rows.length - measured.length }));
  }
  return !measured.length ? 4 : ahead.length ? 1 : 0;
}

function main(argv, opts = {}) {
  const args = argv.slice(2);
  const cmd = args[0];
  const rest = args.slice(1);
  const bad = rest.find(a => a.startsWith('--') && !FLAGS.has(a));
  if (!['list', 'add', 'status', 'update', 'remove', 'drift'].includes(cmd) || bad) { console.error(t('modules.usage')); return 2; }
  const names = rest.filter((a, i) => !a.startsWith('--') && !VALUE_FLAGS.includes(rest[i - 1]));
  const app = path.resolve(argValue(rest, '--app') || opts.cwd || process.cwd());
  const library = argValue(rest, '--library') || readJson(path.join(app, 'coolhan.project.json'), {}).modules || readRecord(app).library || process.env.COOLHAN_MODULES || '';
  const json = rest.includes('--json');
  if (cmd === 'remove') return names.length === 1 ? cmdRemove(names[0], app, rest.includes('--force')) : (console.error(t('modules.usage')), 2);
  const cat = catalog(library);
  if (cmd === 'status') return cmdStatus(app, cat, json, rest.includes('--allow-none'));
  if (!cat) { console.error(t('modules.noLibrary')); return 4; }
  if (cmd === 'list') return cmdList(cat, json);
  if (cmd === 'add') return cmdAdd(names, app, cat, library);
  if (cmd === 'update') return cmdUpdate(names, app, cat, library, { all: rest.includes('--all'), force: rest.includes('--force') });
  return cmdDrift(cat, path.resolve(argValue(rest, '--sites') || path.dirname(path.resolve(library))), json);
}

if (require.main === module) process.exit(main(process.argv));

module.exports = { main, catalog, fileHashes, contentHash, withRequirements, stateOf, modulesRoot, RECORD, INSTALL_DIR };
