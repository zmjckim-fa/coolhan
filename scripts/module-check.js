#!/usr/bin/env node
/**
 * CoolHan module-check: the form of a module under knowledge_base/00_MODULE_STANDARD.md.
 *
 * Operator order (2026-11-22): every module has a name and a folder of its own, every module has the same
 * subfolders, file names follow rules; only then can a module be dropped into any project and replaced by a
 * newer one. This gate reads a module folder (or a folder of modules) and reports where the form is broken.
 *
 * Rules (each finding names the module and the path):
 *   manifest-missing / manifest-invalid   module.json absent, unreadable or a required field missing
 *   name-format / name-mismatch / name-banned-word / area-mismatch
 *   version-format                        not three numbers
 *   unknown-folder / unknown-file         something beside the fixed parts at the top of the module
 *   required-file-missing                 README.md, CHANGELOG.md
 *   changelog-version-missing             CHANGELOG.md has no entry for the manifest's version
 *   parts-mismatch                        `parts` and the folders on disk disagree, or an absent part has no reason
 *   set-incomplete                        only some of user / admin / api exist and an absent one carries no reason
 *   file-name-format / file-name-banned-word
 *   entry-missing                         core/index.*, api/routes.*, db/schema.*, text/<lang>.json, style/tokens.css
 *   test-outside-test-folder
 *   core-imports-framework                core/ imports a framework or a database client
 *   import-escapes-module                 a relative import that leaves the module (or enters another module's inside)
 *   require-undeclared                    another module's entry is imported but not listed in `requires`
 *   origin-missing                        no origin, or an unknown commit without an `originNote`
 *   setting-undeclared                    an environment variable is read that `settings` does not name
 *   test-missing                          core/ or api/ without test/
 *   db-table-prefix / db-table-undeclared / db-foreign-reference   tables outside the module's own area, not
 *                                         listed in provides.tables, or a foreign key into a table the module does not own
 *   security-note-missing                 api/, user/ or admin/ without docs/security.md
 *
 * Usage: node scripts/module-check.js <module dir | dir of modules> [--json]
 * Exit:  0 PASS · 1 FAIL · 2 usage · 4 no module found (never a pass)
 *
 * Honest bound: form only. Whether a module really stands alone is shown by its own tests and by installing it into
 * an empty project (scripts/modules.js).
 */

const fs = require('fs');
const path = require('path');
const { positional } = require('./lib/cli');
const { isDir } = require('./lib/fs');
const { t, finding } = require('./messages');

const PARTS = ['core', 'api', 'user', 'admin', 'db', 'text', 'style', 'adapters', 'test', 'docs'];
const TOP_FILES = new Set(['module.json', 'README.md', 'CHANGELOG.md', 'LICENSE', 'package.json']);
const REQUIRED_FIELDS = ['name', 'version', 'label', 'summary', 'area', 'stack', 'parts', 'requires', 'provides', 'settings', 'origin', 'test'];
const BANNED = new Set(['utils', 'util', 'helpers', 'helper', 'common', 'misc', 'lib', 'stuff', 'temp', 'tmp', 'new', 'old', 'copy', 'final']);
const NAME = /^[a-z][a-z0-9]*(?:-[a-z0-9]+){1,3}$/;
const WORDS = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const VERSION = /^\d+\.\d+\.\d+$/;
const SOURCE = /\.(?:js|mjs|cjs|ts|tsx|jsx)$/;
const FRAMEWORK = /^(?:next|react|react-dom|vue|svelte|@angular|@nestjs|express|fastify|koa|@prisma|prisma|typeorm|mongoose|sequelize|knex|pg|mysql2?|better-sqlite3|node:sqlite|node:http|node:https)(?:\/|$)/;
const IMPORT = /(?:import\s[^'"]*?from\s*|import\s*\(\s*|require\s*\(\s*|export\s[^'"]*?from\s*)['"]([^'"]+)['"]/g;
const ENV = /process\.env(?:\.([A-Z][A-Z0-9_]*)|\[\s*['"]([A-Z][A-Z0-9_]*)['"]\s*\])/g;
const LANG = /^[a-z]{2}(?:-[a-z]{2})?\.json$/;
const ENTRY = { core: /^index\.[a-z]+$/, api: /^routes\.[a-z]+$/, db: /^schema\.[a-z]+$/, text: LANG, style: /^tokens\.css$/ };

const requireNames = (m) => (Array.isArray(m.requires) ? m.requires : []).map(r => (typeof r === 'string' ? r.split('@')[0] : r && r.name)).filter(Boolean);
const settingNames = (m) => (Array.isArray(m.settings) ? m.settings : []).map(s => (typeof s === 'string' ? s : s && s.name)).filter(Boolean);

function walk(dir, rel = '') {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const r = rel ? `${rel}/${e.name}` : e.name;
    if (e.isDirectory()) { out.push({ rel: r, dir: true }); out.push(...walk(path.join(dir, e.name), r)); }
    else out.push({ rel: r, dir: false });
  }
  return out;
}

/** Every module folder under `target`: the folder itself, or its direct children that hold a module.json. */
function findModules(target) {
  if (!isDir(target)) return [];
  if (fs.existsSync(path.join(target, 'module.json'))) return [target];
  return fs.readdirSync(target, { withFileTypes: true })
    .filter(e => e.isDirectory() && !e.name.startsWith('.') && !e.name.startsWith('_') && fs.existsSync(path.join(target, e.name, 'module.json')))
    .map(e => path.join(target, e.name)).sort();
}

function checkModule(dir) {
  const folder = path.basename(dir);
  const findings = [];
  const add = (rule, where, key, vars) => findings.push(finding(rule, `${folder}${where ? '/' + where : ''}`, key, vars));

  let m;
  try { m = JSON.parse(fs.readFileSync(path.join(dir, 'module.json'), 'utf8')); }
  catch (e) { add(fs.existsSync(path.join(dir, 'module.json')) ? 'manifest-invalid' : 'manifest-missing', 'module.json', 'module.manifestUnreadable', { error: e.message }); return { name: folder, findings }; }
  for (const f of REQUIRED_FIELDS) if (m[f] === undefined || m[f] === null || m[f] === '') add('manifest-invalid', 'module.json', 'module.fieldMissing', { field: f });

  const name = String(m.name || '');
  if (!NAME.test(name)) add('name-format', 'module.json', 'module.nameFormat', { name });
  if (name !== folder) add('name-mismatch', 'module.json', 'module.nameMismatch', { name, folder });
  for (const w of name.split('-')) if (BANNED.has(w)) add('name-banned-word', 'module.json', 'module.bannedWord', { word: w, name });
  if (m.area && name && name.split('-')[0] !== m.area) add('area-mismatch', 'module.json', 'module.areaMismatch', { area: m.area, name });
  if (!VERSION.test(String(m.version || ''))) add('version-format', 'module.json', 'module.versionFormat', { version: m.version });

  // top level
  const top = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of top) {
    if (e.isDirectory()) { if (!PARTS.includes(e.name)) add('unknown-folder', e.name, 'module.unknownFolder', { folder: e.name }); }
    else if (!TOP_FILES.has(e.name)) add('unknown-file', e.name, 'module.unknownFile', { file: e.name });
  }
  for (const f of ['README.md', 'CHANGELOG.md']) if (!fs.existsSync(path.join(dir, f))) add('required-file-missing', f, 'module.requiredFileMissing', { file: f });
  if (fs.existsSync(path.join(dir, 'CHANGELOG.md')) && m.version && !fs.readFileSync(path.join(dir, 'CHANGELOG.md'), 'utf8').includes(String(m.version))) {
    add('changelog-version-missing', 'CHANGELOG.md', 'module.changelogVersionMissing', { version: m.version });
  }

  // parts
  const parts = (m.parts && typeof m.parts === 'object') ? m.parts : {};
  const present = (p) => isDir(path.join(dir, p)) && fs.readdirSync(path.join(dir, p)).length > 0;
  const reasonOf = (p) => (typeof parts[p] === 'string' ? parts[p].trim() : '');
  for (const p of PARTS) {
    const onDisk = present(p);
    if (parts[p] === true && !onDisk) add('parts-mismatch', p, 'module.partDeclaredMissing', { part: p });
    else if (parts[p] !== true && onDisk) add('parts-mismatch', p, 'module.partUndeclared', { part: p });
    else if (parts[p] !== true && reasonOf(p).length < 5) add('parts-mismatch', 'module.json', 'module.partNoReason', { part: p });
  }
  const setParts = ['user', 'admin', 'api'];
  if (setParts.some(present) && !setParts.every(present)) {
    for (const p of setParts) if (!present(p) && reasonOf(p).length < 5) add('set-incomplete', 'module.json', 'module.setIncomplete', { part: p });
  }
  for (const [p, re] of Object.entries(ENTRY)) {
    if (present(p) && !fs.readdirSync(path.join(dir, p)).some(f => re.test(f))) add('entry-missing', p, 'module.entryMissing', { part: p, pattern: re.source });
  }

  // files
  const exceptions = new Set(Array.isArray(m.nameExceptions) ? m.nameExceptions : []);
  const requires = new Set(requireNames(m));
  const settings = new Set(settingNames(m));
  for (const p of PARTS.filter(present)) {
    for (const f of walk(path.join(dir, p), p)) {
      const base = path.posix.basename(f.rel);
      if (!exceptions.has(base)) {
        const stem = f.dir ? base : base.split('.')[0];
        const ext = f.dir ? '' : base.slice(stem.length);
        if (!WORDS.test(stem) || (ext && !/^(?:\.[a-z0-9]+(?:-[a-z0-9]+)*)+$/.test(ext))) add('file-name-format', f.rel, 'module.fileNameFormat', { name: base });
        for (const w of stem.split('-')) if (BANNED.has(w)) add('file-name-banned-word', f.rel, 'module.bannedWord', { word: w, name: base });
      }
      if (f.dir) continue;
      if (/\.test\.[a-z]+$/.test(base) && p !== 'test') add('test-outside-test-folder', f.rel, 'module.testOutside', { file: base });
      if (!SOURCE.test(base)) continue;
      const text = fs.readFileSync(path.join(dir, f.rel), 'utf8');
      let im; IMPORT.lastIndex = 0;
      while ((im = IMPORT.exec(text))) {
        const spec = im[1];
        if (p === 'core' && FRAMEWORK.test(spec)) add('core-imports-framework', f.rel, 'module.coreImportsFramework', { spec });
        if (!spec.startsWith('.')) continue;
        const target = path.posix.normalize(path.posix.join(path.posix.dirname(f.rel), spec));
        if (!target.startsWith('..')) continue;
        const seg = target.split('/').filter(s => s !== '..');
        const other = seg[0];
        const entersEntry = seg.length === 3 && seg[1] === 'core' && /^index(?:\.[a-z]+)?$/.test(seg[2]);
        if (target.split('/').filter(s => s === '..').length === 1 && entersEntry) {
          if (!requires.has(other)) add('require-undeclared', f.rel, 'module.requireUndeclared', { other });
        } else add('import-escapes-module', f.rel, 'module.importEscapes', { spec });
      }
      if (p !== 'test') {
        let ev; ENV.lastIndex = 0;
        while ((ev = ENV.exec(text))) { const n = ev[1] || ev[2]; if (!settings.has(n)) add('setting-undeclared', f.rel, 'module.settingUndeclared', { name: n }); }
      }
    }
  }

  // quality bar (§6-1): tests, own tables, security note
  if ((present('core') || present('api')) && !present('test')) add('test-missing', 'module.json', 'module.testMissing');
  if (['api', 'user', 'admin'].some(present) && !fs.existsSync(path.join(dir, 'docs', 'security.md'))) add('security-note-missing', 'docs', 'module.securityNoteMissing');
  if (present('db')) {
    const declared = new Set((m.provides && Array.isArray(m.provides.tables)) ? m.provides.tables : []);
    const prefix = `${String(m.area || '').replace(/-/g, '_')}_`;
    const own = new Set(); const refs = [];
    for (const f of fs.readdirSync(path.join(dir, 'db')).filter(x => /\.(?:sql|prisma)$/.test(x))) {
      const text = fs.readFileSync(path.join(dir, 'db', f), 'utf8').replace(/--.*$/gm, '').replace(/\/\/.*$/gm, '');
      let mt;
      const TABLE = /create\s+table\s+(?:if\s+not\s+exists\s+)?["`]?([A-Za-z_][\w]*)["`]?|^\s*model\s+(\w+)\s*\{/gim;
      while ((mt = TABLE.exec(text))) own.add(mt[1] || mt[2]);
      const REF = /references\s+["`]?([A-Za-z_][\w]*)["`]?/gi;
      while ((mt = REF.exec(text))) refs.push({ file: f, table: mt[1] });
    }
    for (const tb of own) {
      if (!tb.toLowerCase().startsWith(prefix)) add('db-table-prefix', 'db', 'module.dbTablePrefix', { table: tb, prefix });
      if (!declared.has(tb)) add('db-table-undeclared', 'module.json', 'module.dbTableUndeclared', { table: tb });
    }
    for (const r of refs) if (!own.has(r.table)) add('db-foreign-reference', `db/${r.file}`, 'module.dbForeignReference', { table: r.table });
  }

  // origin
  const origin = Array.isArray(m.origin) ? m.origin : [];
  if (!origin.length) add('origin-missing', 'module.json', 'module.originMissing');
  else if (origin.some(o => !o || !o.site || !o.path)) add('origin-missing', 'module.json', 'module.originIncomplete');
  else if (origin.some(o => !o.commit) && String(m.originNote || '').trim().length < 5) add('origin-missing', 'module.json', 'module.originNoCommit');

  return { name: folder, version: m.version, findings };
}

function evaluate(target) {
  const dirs = findModules(target);
  if (!dirs.length) return { status: 'NO_MODULES', modules: [], findings: [] };
  const modules = dirs.map(checkModule);
  const findings = modules.flatMap(x => x.findings);
  return { status: findings.length ? 'FAIL' : 'PASS', modules: modules.map(x => ({ name: x.name, version: x.version, findings: x.findings.length })), findings };
}

function main(argv) {
  const args = argv.slice(2);
  const target = positional(args);
  if (!target || args.some(a => a.startsWith('--') && a !== '--json')) { console.error(t('module.checkUsage')); return 2; }
  const r = evaluate(target);
  if (args.includes('--json')) console.log(JSON.stringify(r, null, 2));
  else if (r.status === 'NO_MODULES') console.log(t('module.checkNoModules', { target }));
  else {
    console.log(t('module.checkSummary', { mark: r.status === 'PASS' ? '✔' : '✗', status: r.status, modules: r.modules.length, findings: r.findings.length }));
    for (const f of r.findings) console.log(`  [${f.rule}] ${f.where} · ${f.detail}`);
  }
  return r.status === 'PASS' ? 0 : r.status === 'FAIL' ? 1 : 4;
}

if (require.main === module) process.exit(main(process.argv));

module.exports = { evaluate, checkModule, findModules, main, PARTS, BANNED, NAME, requireNames, settingNames };
