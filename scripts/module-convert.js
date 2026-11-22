#!/usr/bin/env node
/**
 * CoolHan module-convert: bring stack-neutral packages of the older library layout into the module standard
 * (knowledge_base/00_MODULE_STANDARD.md).
 *
 * Older layout:  <packages>/<bundle>/<module>/{module.json, src/index.ts, src/index.test.ts, src/<other>.ts}
 * Standard:      <out>/<bundle>-<module>/{module.json, README.md, CHANGELOG.md, package.json, core/*, test/*}
 *
 * What it does, and nothing more: moves source to core/, tests to test/, rewrites the relative imports that the
 * move breaks (own package, and another package's entry), writes the standard manifest from the old one (origin
 * from the recorded code references; the commit is unknown there and is recorded as unknown with a note), and
 * writes README and CHANGELOG. It never edits the older layout and never overwrites a module folder that exists.
 *
 * Usage: node scripts/module-convert.js <packages dir> --out <modules dir> [--dry] [--json]
 * Exit:  0 converted or nothing new · 1 a package could not be converted · 2 usage · 4 no package found
 */

const fs = require('fs');
const path = require('path');
const { argValue, positional } = require('./lib/cli');
const { isDir } = require('./lib/fs');
const { t } = require('./messages');
const { PARTS } = require('./module-check');

const ENV = /process\.env(?:\.([A-Z][A-Z0-9_]*)|\[\s*['"]([A-Z][A-Z0-9_]*)['"]\s*\])/g;
const IMPORT = /((?:from|import)\s*\(?\s*['"])(\.{1,2}\/[^'"]+)(['"])/g;
const posix = (p) => p.split(path.sep).join('/');

/** Packages of the older layout: a module.json beside a src/ folder, at most three levels down. */
function findPackages(root) {
  const out = [];
  const visit = (dir, depth) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!e.isDirectory() || e.name.startsWith('_') || e.name.startsWith('.')) continue;
      const p = path.join(dir, e.name);
      if (fs.existsSync(path.join(p, 'module.json')) && isDir(path.join(p, 'src'))) out.push(p);
      if (depth < 2) visit(p, depth + 1);
    }
  };
  if (isDir(root)) visit(root, 0);
  return out.sort();
}

const newName = (root, pkg) => posix(path.relative(root, pkg)).split('/').join('-');

/** Rewrite one file's relative imports for its new place (core/ or test/ of the module `name`). */
function rewriteImports(text, { root, fromFile, toPart }) {
  return text.replace(IMPORT, (whole, head, spec, tail) => {
    const target = path.resolve(path.dirname(fromFile), spec);
    const rel = posix(path.relative(root, target)).split('/');          // <bundle>/<module>/src/<file>
    const srcAt = rel.indexOf('src');
    if (rel[0] === '..' || srcAt < 1) return whole;
    const targetModule = rel.slice(0, srcAt).join('-');
    const file = rel.slice(srcAt + 1).join('/');
    const ownModule = newName(root, path.dirname(path.dirname(fromFile)));
    const targetPart = /\.test\.[a-z]+$/.test(file) ? 'test' : 'core';
    const next = targetModule === ownModule
      ? (targetPart === toPart ? `./${file}` : `../${targetPart}/${file}`)
      : `../../${targetModule}/${targetPart}/${file}`;
    return `${head}${next}${tail}`;
  });
}

function convertOne(root, pkg, out) {
  const old = JSON.parse(fs.readFileSync(path.join(pkg, 'module.json'), 'utf8'));
  const name = newName(root, pkg);
  const dest = path.join(out, name);
  const files = {}; const settings = new Set(); const imported = new Set(); let lines = 0;
  for (const f of fs.readdirSync(path.join(pkg, 'src')).sort()) {
    const from = path.join(pkg, 'src', f);
    if (!fs.statSync(from).isFile()) throw new Error(t('convert.nestedSource', { name, file: f }));
    const part = /\.test\.[a-z]+$/.test(f) ? 'test' : 'core';
    const text = rewriteImports(fs.readFileSync(from, 'utf8'), { root, fromFile: from, toPart: part });
    if (part === 'core') { let m; ENV.lastIndex = 0; while ((m = ENV.exec(text))) settings.add(m[1] || m[2]); }
    for (const m of text.matchAll(/['"]\.\.\/\.\.\/([a-z0-9-]+)\/core\/index(?:\.[a-z]+)?['"]/g)) imported.add(m[1]);
    lines += text.split('\n').length;
    files[`${part}/${f}`] = text;
  }
  if (!files['core/index.ts'] && !files['core/index.js']) throw new Error(t('convert.noEntry', { name }));
  const absent = t('convert.partAbsent');
  const manifest = {
    name, version: '1.0.0', label: old.label || name, summary: old.label || name, area: name.split('-')[0], stack: 'none',
    parts: Object.fromEntries(PARTS.map(p => [p, Object.keys(files).some(f => f.startsWith(`${p}/`)) ? true : absent])),
    // What the source really imports is added to what the old manifest declared (two packages imported a module they did not list).
    requires: [...new Set([...(old.requires || []).map(r => String(r).split('/').join('-')), ...imported])].sort(),
    provides: old.provides || {},
    settings: [...settings].sort().map(n => ({ name: n })),
    origin: (old.codeRef || []).map(c => ({ site: c.site, path: c.path, commit: null, date: old.extracted || null, role: c.role })),
    originNote: t('convert.originNote'),
    test: 'node --test',
    legacy: { package: old.name, bundle: old.bundle, spec: old.spec, conformance: old.conformance }
  };
  files['module.json'] = JSON.stringify(manifest, null, 2) + '\n';
  files['package.json'] = JSON.stringify({ name: `coolhan-module-${name}`, private: true, type: 'module' }, null, 2) + '\n';
  const provided = Object.entries(manifest.provides).filter(([, v]) => Array.isArray(v) && v.length).map(([k, v]) => `- ${k}: ${v.join(', ')}`).join('\n');
  files['README.md'] = t('convert.readme', { name, label: manifest.label, provided: provided || '-', requires: manifest.requires.join(', ') || '-', sites: [...new Set(manifest.origin.map(o => o.site))].join(', ') || '-' });
  files['CHANGELOG.md'] = t('convert.changelog', { date: new Date().toISOString().slice(0, 10), legacy: old.name, extracted: old.extracted || '-', count: Object.keys(files).filter(f => /^(core|test)\//.test(f)).length, lines });
  return { name, dest, files, lines };
}

function convert(root, out, { dry = false } = {}) {
  const pkgs = findPackages(root);
  const done = [], skipped = [], failed = [];
  for (const pkg of pkgs) {
    let c; try { c = convertOne(root, pkg, out); } catch (e) { failed.push({ package: posix(path.relative(root, pkg)), error: e.message }); continue; }
    if (fs.existsSync(c.dest)) { skipped.push(c.name); continue; }
    if (!dry) for (const [rel, text] of Object.entries(c.files)) { const f = path.join(c.dest, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, text); }
    done.push({ name: c.name, files: Object.keys(c.files).length, lines: c.lines });
  }
  return { packages: pkgs.length, converted: done, skipped, failed };
}

function main(argv) {
  const args = argv.slice(2);
  const root = positional(args, ['--out']); const out = argValue(args, '--out');
  if (!root || !out || args.some(a => a.startsWith('--') && !['--out', '--dry', '--json'].includes(a))) { console.error(t('convert.usage')); return 2; }
  const r = convert(path.resolve(root), path.resolve(out), { dry: args.includes('--dry') });
  if (args.includes('--json')) console.log(JSON.stringify(r, null, 2));
  else {
    console.log(t('convert.summary', { packages: r.packages, converted: r.converted.length, skipped: r.skipped.length, failed: r.failed.length, lines: r.converted.reduce((n, c) => n + c.lines, 0) }));
    for (const f of r.failed) console.log(`  ✗ ${f.package}: ${f.error}`);
  }
  return !r.packages ? 4 : r.failed.length ? 1 : 0;
}

if (require.main === module) process.exit(main(process.argv));

module.exports = { convert, convertOne, findPackages, rewriteImports, newName, main };
