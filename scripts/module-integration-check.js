#!/usr/bin/env node

/**
 * CoolHan module-integration-check: how the modules of a library fit TOGETHER (form of one module is module-check).
 *
 * Operator order (2026-11-24): find the weak points of the finished modules, check that modules work with each
 * other, and make sure a module carries its design when it moves to another site: adapted to the site, never rebuilt.
 * Read-only. Every finding names the module and the file.
 *
 * Rules:
 *   requires-unresolved       a required module is not in the library
 *   requires-range            the library holds a version that does not satisfy the range (^ ~ >= exact)
 *   requires-cycle            modules require each other in a ring
 *   lib-not-exported          provides.lib names something core/index (or a listed entry) does not export
 *   token-not-defined         provides.tokens names a custom property its own style files do not define
 *   token-undefined           a var(--x) in the module's styles or screens that nothing defines: not the module, not
 *                             a required module, and no fallback value
 *   color-literal             a colour (#hex, rgb(), hsl()) written outside tokens: a screen that carries its own
 *                             colours cannot take the site's design
 *   screen-without-tokens     user/ or admin/ screens and no style/tokens.css: the look cannot travel with the module
 *   text-language-gap         a text key present in one language file and missing in another of the same module
 *   table-owner-conflict      two modules create the same table
 *   table-foreign-access      SQL in a module's code names a table another module owns, with no `requires` for it
 *   route-conflict            two modules provide the same method and path
 *   bridge-gap                a design module's bridge.css assigns none of the tokens a screen module provides
 *                             (that module would keep its own default look on that site)
 *   lib-not-reachable         provides.lib names something the module exports, but not through core/index or a listed
 *                             entry: another module is not allowed to import it
 *
 * Usage: node scripts/module-integration-check.js <library modules dir> [--json] [--only a,b] [--order]
 *   --order prints the audit order: required modules before the modules that require them, then area, then name.
 * Exit: 0 PASS · 1 FAIL · 2 usage · 4 no module found (never a pass)
 *
 * Honest bound: textual. It proves the names, versions, tokens, tables and routes agree on paper; whether a module
 * behaves as its tests claim, and whether two modules fit at run time, is shown by the tests and by the consuming
 * project's own type check (module-admit --consumer).
 */

const fs = require('fs');
const path = require('path');
const { argList, positional } = require('./lib/cli');
const { isDir, readText, listFiles } = require('./lib/fs');
const { t, finding } = require('./messages');

const SOURCE = /\.(?:js|mjs|cjs|ts|tsx|jsx)$/;
const STYLE_OR_SOURCE = /\.(?:css|js|mjs|cjs|ts|tsx|jsx)$/;
const DEFINE = /(^|[;{\s])(--[\w-]+)\s*:/gm;
const VAR = /var\(\s*(--[\w-]+)\s*(,)?/g;
const RUNTIME_TOKEN = /['"`](--[\w-]*\w)['"`]/g;
const COLOR = /#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/;
const SKIP_DIRS = new Set(['node_modules', '.git', 'test', 'tests', 'docs']);

const requireNames = (m) => (Array.isArray(m.requires) ? m.requires : [])
  .map(r => (typeof r === 'string' ? r : r && r.name)).filter(Boolean)
  .map(r => { const i = r.lastIndexOf('@'); return i > 0 ? { name: r.slice(0, i), range: r.slice(i + 1) } : { name: r, range: '' }; });

function parseVersion(v) { const m = /^(\d+)\.(\d+)\.(\d+)/.exec(String(v)); return m ? [+m[1], +m[2], +m[3]] : null; }
function compare(a, b) { for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] < b[i] ? -1 : 1; return 0; }
/** ^1.2.3, ~1.2.3, >=1.2.3, 1.2.3 or empty (any). */
function satisfies(version, range) {
  const v = parseVersion(version); if (!v) return false;
  if (!range || range === '*') return true;
  const op = /^(\^|~|>=)?\s*(\d+\.\d+\.\d+)/.exec(range); if (!op) return true;
  const base = parseVersion(op[2]);
  if (op[1] === '>=') return compare(v, base) >= 0;
  if (compare(v, base) < 0) return false;
  if (op[1] === '~') return v[0] === base[0] && v[1] === base[1];
  if (op[1] === '^') return base[0] > 0 ? v[0] === base[0] : (base[1] > 0 ? v[0] === 0 && v[1] === base[1] : v[0] === 0 && v[1] === 0 && v[2] === base[2]);
  return compare(v, base) === 0;
}

function loadLibrary(dir) {
  const mods = new Map();
  if (!isDir(dir)) return mods;
  for (const name of fs.readdirSync(dir).sort()) {
    const root = path.join(dir, name);
    if (!isDir(root)) continue;
    const text = readText(path.join(root, 'module.json')); if (text === null) continue;
    let manifest; try { manifest = JSON.parse(text); } catch (_) { continue; }
    mods.set(name, { name, root, manifest, files: listFiles(root, { ext: /./, skipDirs: SKIP_DIRS }) });
  }
  return mods;
}

/** Names a file exports. `export *` and `export { x } from` are followed one level inside the module. */
function exportedNames(file, seen = new Set()) {
  if (seen.has(file)) return new Set(); seen.add(file);
  const out = new Set(); const src = readText(file); if (src === null) return out;
  for (const m of src.matchAll(/export\s+(?:declare\s+)?(?:async\s+)?(?:const|let|var|function\*?|class|type|interface|enum|abstract class)\s+([A-Za-z_$][\w$]*)/g)) out.add(m[1]);
  for (const m of src.matchAll(/export\s*(?:type\s*)?\{([^}]*)\}/g)) for (const part of m[1].split(',')) { const n = part.trim().split(/\s+as\s+/).pop().trim(); if (n) out.add(n); }
  for (const m of src.matchAll(/export\s*\*\s*from\s*['"](\.[^'"]+)['"]/g)) {
    const target = resolveRelative(file, m[1]); if (target) for (const n of exportedNames(target, seen)) out.add(n);
  }
  return out;
}
function resolveRelative(from, spec) {
  const base = path.resolve(path.dirname(from), spec);
  for (const c of [base, base + '.ts', base + '.tsx', base + '.js', base + '.mjs', path.join(base, 'index.ts'), path.join(base, 'index.js')]) { try { if (fs.statSync(c).isFile()) return c; } catch (_) { /* next */ } }
  return null;
}

const definedIn = (css) => { const s = new Set(); let m; DEFINE.lastIndex = 0; while ((m = DEFINE.exec(css))) s.add(m[2]); return s; };
const styleFiles = (mod) => mod.files.filter(f => /\.css$/.test(f.rel));
const screenFiles = (mod) => mod.files.filter(f => /^(?:user|admin)\//.test(f.rel) && SOURCE.test(f.rel));

function tokensDefinedBy(mod) { const s = new Set(); for (const f of styleFiles(mod)) for (const n of definedIn(readText(f.full) || '')) s.add(n); return s; }

/** Every module required, directly or through requirements, plus the modules whose bridge could assign values. */
function transitive(mods, name, seen = new Set()) {
  for (const r of requireNames(mods.get(name).manifest)) if (mods.has(r.name) && !seen.has(r.name)) { seen.add(r.name); transitive(mods, r.name, seen); }
  return seen;
}

function lineOf(text, index) { return text.slice(0, index).split('\n').length; }

function checkGraph(mods, add) {
  for (const mod of mods.values()) {
    for (const r of requireNames(mod.manifest)) {
      const other = mods.get(r.name);
      if (!other) { add('requires-unresolved', `${mod.name}/module.json`, 'integration.requiresUnresolved', { name: mod.name, required: r.name }); continue; }
      if (!satisfies(other.manifest.version, r.range)) add('requires-range', `${mod.name}/module.json`, 'integration.requiresRange', { name: mod.name, required: r.name, range: r.range, version: other.manifest.version });
    }
  }
  const state = new Map(); const stack = [];
  const visit = (n) => {
    if (state.get(n) === 2) return; if (state.get(n) === 1) { const ring = stack.slice(stack.indexOf(n)).concat(n); add('requires-cycle', `${n}/module.json`, 'integration.requiresCycle', { ring: ring.join(' > ') }); return; }
    state.set(n, 1); stack.push(n);
    for (const r of requireNames(mods.get(n).manifest)) if (mods.has(r.name)) visit(r.name);
    stack.pop(); state.set(n, 2);
  };
  for (const n of mods.keys()) visit(n);
}

function checkProvides(mod, add) {
  const entry = ['core/index.ts', 'core/index.js', 'core/index.mjs', 'core/index.tsx'].map(r => path.join(mod.root, r)).find(f => fs.existsSync(f));
  const lib = mod.manifest.provides && Array.isArray(mod.manifest.provides.lib) ? mod.manifest.provides.lib : [];
  if (lib.length && entry) {
    const names = new Set(exportedNames(entry));
    for (const e of (mod.manifest.provides.entries || [])) { const f = path.join(mod.root, e); if (fs.existsSync(f)) for (const n of exportedNames(f)) names.add(n); }
    const elsewhere = new Map();
    for (const f of mod.files.filter(x => SOURCE.test(x.rel) && !/^test\//.test(x.rel))) for (const n of exportedNames(f.full)) if (!elsewhere.has(n)) elsewhere.set(n, f.rel);
    for (const n of lib) {
      if (names.has(n)) continue;
      if (elsewhere.has(n)) add('lib-not-reachable', `${mod.name}/${elsewhere.get(n)}`, 'integration.libNotReachable', { name: mod.name, symbol: n, file: elsewhere.get(n) });
      else add('lib-not-exported', `${mod.name}/core/index`, 'integration.libNotExported', { name: mod.name, symbol: n });
    }
  }
}

function checkDesign(mods, mod, add) {
  const own = tokensDefinedBy(mod);
  const provided = Array.isArray(mod.manifest.provides && mod.manifest.provides.tokens) ? mod.manifest.provides.tokens : [];
  for (const tk of provided) if (!own.has(tk)) add('token-not-defined', `${mod.name}/style`, 'integration.tokenNotDefined', { name: mod.name, token: tk });

  const screens = screenFiles(mod);
  if (screens.length && !fs.existsSync(path.join(mod.root, 'style', 'tokens.css'))) add('screen-without-tokens', `${mod.name}/style/tokens.css`, 'integration.screenWithoutTokens', { name: mod.name });

  const known = new Set(own);
  for (const f of mod.files.filter(x => SOURCE.test(x.rel))) for (const m of (readText(f.full) || '').matchAll(RUNTIME_TOKEN)) known.add(m[1]); // set from script at run time
  for (const r of transitive(mods, mod.name)) { for (const n of tokensDefinedBy(mods.get(r))) known.add(n); }
  const files = mod.files.filter(f => STYLE_OR_SOURCE.test(f.rel) && !/^(?:adapters|api|core)\//.test(f.rel));
  for (const f of files) {
    const text = readText(f.full); if (text === null) continue;
    const isTokens = /(?:^|\/)(?:tokens|themes)\.css$/.test(f.rel);
    const isBridge = /(?:^|\/)bridge\.css$/.test(f.rel);
    let m; VAR.lastIndex = 0;
    const reported = new Set();
    while ((m = VAR.exec(text))) {
      if (m[2] || known.has(m[1]) || reported.has(m[1]) || /-$/.test(m[1])) continue;
      if (/^--(?:tw|vite|radix)/.test(m[1])) continue;
      reported.add(m[1]); add('token-undefined', `${mod.name}/${f.rel}:${lineOf(text, m.index)}`, 'integration.tokenUndefined', { name: mod.name, token: m[1] });
    }
    if (isTokens || isBridge) continue;
    text.split('\n').forEach((line, i) => {
      if (/^\s*(?:\/\/|\*|\/\*)/.test(line) || /^\s*--[\w-]+\s*:/.test(line)) return;
      if (/\.(?:ts|tsx|js|jsx|mjs)$/.test(f.rel) && !/(?:style|color|background|border|fill|stroke|boxShadow)/i.test(line)) return;
      const stripped = line.replace(/var\(\s*--[\w-]+\s*,[^)]*\)/g, '');
      if (COLOR.test(stripped)) add('color-literal', `${mod.name}/${f.rel}:${i + 1}`, 'integration.colorLiteral', { name: mod.name });
    });
  }
}

function checkText(mod, add) {
  const dir = path.join(mod.root, 'text'); if (!isDir(dir)) return;
  const langs = {};
  for (const f of fs.readdirSync(dir).filter(n => /\.json$/.test(n))) { try { langs[f] = new Set(Object.keys(flatten(JSON.parse(readText(path.join(dir, f)))))); } catch (_) { /* module-check reports unreadable */ } }
  const names = Object.keys(langs); if (names.length < 2) return;
  const all = new Set(names.flatMap(n => [...langs[n]]));
  for (const key of all) for (const n of names) if (!langs[n].has(key)) add('text-language-gap', `${mod.name}/text/${n}`, 'integration.textGap', { name: mod.name, key, file: n });
}
function flatten(obj, prefix = '', out = {}) {
  for (const [k, v] of Object.entries(obj || {})) { const key = prefix ? `${prefix}.${k}` : k; if (v && typeof v === 'object' && !Array.isArray(v)) flatten(v, key, out); else out[key] = v; }
  return out;
}

const TABLE = /create\s+table\s+(?:if\s+not\s+exists\s+)?["`]?([a-z_][\w]*)["`]?/gi;
function tablesCreated(mod) {
  const out = new Set();
  for (const f of mod.files.filter(x => /^db\/.*\.sql$/.test(x.rel) && !/\.(?:sqlite|postgres)\.sql$/.test(x.rel) || /^db\/schema\.sql$/.test(x.rel))) {
    const text = readText(f.full) || ''; let m; TABLE.lastIndex = 0; while ((m = TABLE.exec(text))) out.add(m[1].toLowerCase());
  }
  return out;
}
function checkTables(mods, add) {
  const owner = new Map();
  for (const mod of mods.values()) for (const tb of tablesCreated(mod)) { if (owner.has(tb) && owner.get(tb) !== mod.name) add('table-owner-conflict', `${mod.name}/db`, 'integration.tableOwner', { table: tb, a: owner.get(tb), b: mod.name }); else owner.set(tb, mod.name); }
  for (const mod of mods.values()) {
    const allowed = new Set([mod.name, ...transitive(mods, mod.name)]);
    const own = tablesCreated(mod);
    for (const f of mod.files.filter(x => /^(?:adapters|api|core)\//.test(x.rel) && SOURCE.test(x.rel))) {
      const text = readText(f.full) || '';
      for (const m of text.matchAll(/\b(?:from|join|into|update)\s+["`]?([a-z_][\w]*)["`]?/gi)) {
        const tb = m[1].toLowerCase(); const who = owner.get(tb);
        if (who && who !== mod.name && !own.has(tb) && !allowed.has(who)) add('table-foreign-access', `${mod.name}/${f.rel}:${lineOf(text, m.index)}`, 'integration.tableForeign', { name: mod.name, table: tb, owner: who });
      }
    }
  }
}

function checkRoutes(mods, add) {
  const seen = new Map();
  for (const mod of mods.values()) {
    const routes = mod.manifest.provides && Array.isArray(mod.manifest.provides.routes) ? mod.manifest.provides.routes : [];
    for (const r of routes) {
      const key = String(typeof r === 'string' ? r : `${r.method || ''} ${r.path || ''}`).trim().replace(/\s+/g, ' ');
      if (!/^[A-Z]+ \//.test(key)) continue;
      if (seen.has(key) && seen.get(key) !== mod.name) add('route-conflict', `${mod.name}/module.json`, 'integration.routeConflict', { route: key, a: seen.get(key), b: mod.name });
      else seen.set(key, mod.name);
    }
  }
}

/** Default values a module's own style files give its tokens: { '--x': 'value' }. */
function tokenDefaults(mod) {
  const out = {};
  for (const f of styleFiles(mod)) for (const m of (readText(f.full) || '').matchAll(/(?:^|[;{\s])(--[\w-]+)\s*:\s*([^;}]+)/gm)) if (!(m[1] in out)) out[m[1]] = m[2].trim();
  return out;
}
/** A token a design has to speak for: a colour, a corner, a shadow or a typeface. Widths and gaps stay the module's own. */
const bridgeable = (name, value) => COLOR.test(value || '') || /color-mix\(|^var\(/.test(value || '') || /radius|(?:^|-)r(?:-|$)|shadow|font/.test(name);

function checkBridges(mods, add) {
  const screenTokens = new Map();
  for (const mod of mods.values()) {
    if (mod.manifest.area === 'design') continue;
    const declared = (mod.manifest.provides && mod.manifest.provides.tokens) || [];
    const defaults = tokenDefaults(mod);
    const tokens = declared.filter(tk => bridgeable(tk, defaults[tk]));
    if (tokens.length && screenFiles(mod).length) screenTokens.set(mod.name, tokens);
  }
  for (const mod of mods.values()) {
    const bridge = path.join(mod.root, 'style', 'bridge.css');
    if (mod.manifest.area !== 'design' || !fs.existsSync(bridge)) continue;
    const assigned = definedIn(readText(bridge) || '');
    for (const [name, tokens] of screenTokens) {
      if (tokens.every(tk => !assigned.has(tk))) add('bridge-gap', `${mod.name}/style/bridge.css`, 'integration.bridgeGap', { name: mod.name, module: name, count: tokens.length });
    }
  }
}

function auditOrder(mods) {
  const order = []; const done = new Set(); const visiting = new Set();
  const names = [...mods.keys()].sort((a, b) => (mods.get(a).manifest.area || '').localeCompare(mods.get(b).manifest.area || '') || a.localeCompare(b));
  const visit = (n) => {
    if (done.has(n) || visiting.has(n)) return; visiting.add(n);
    for (const r of requireNames(mods.get(n).manifest).map(x => x.name).sort()) if (mods.has(r)) visit(r);
    visiting.delete(n); done.add(n); order.push(n);
  };
  for (const n of names) visit(n);
  return order;
}

/** A finding belongs to a module when it is in its folder or names it. */
function belongsTo(f, names) { return [...names].some(n => f.where.startsWith(n + '/') || f.detail.includes(n)); }

function evaluate(dir, only) {
  const mods = loadLibrary(dir);
  const findings = [];
  const add = (...a) => findings.push(finding(...a));
  if (!mods.size) return { status: 'NO_MODULES', findings, modules: 0 };
  checkGraph(mods, add);
  checkTables(mods, add);
  checkRoutes(mods, add);
  checkBridges(mods, add);
  for (const mod of mods.values()) { checkProvides(mod, add); checkDesign(mods, mod, add); checkText(mod, add); }
  const wanted = only && only.length ? new Set(only) : null;
  const kept = wanted ? findings.filter(f => belongsTo(f, wanted)) : findings;
  return { status: kept.length ? 'FAIL' : 'PASS', findings: kept, modules: mods.size, order: auditOrder(mods) };
}

function main(argv) {
  const args = argv.slice(2);
  const json = args.includes('--json');
  const dir = positional(args, ['--only']);
  if (!dir) { console.error(t('integration.usage')); return 2; }
  const r = evaluate(path.resolve(dir), argList(args, '--only'));
  if (r.status === 'NO_MODULES') { console.error(t('integration.noModules', { dir })); return 4; }
  if (args.includes('--order')) { console.log(r.order.join('\n')); return 0; }
  if (json) console.log(JSON.stringify({ dir, ...r }, null, 2));
  else {
    const byRule = {}; for (const f of r.findings) byRule[f.rule] = (byRule[f.rule] || 0) + 1;
    console.log(t('integration.summary', { mark: r.status === 'PASS' ? '✔' : '✗', status: r.status, modules: r.modules, findings: r.findings.length }));
    for (const f of r.findings) console.log(`  [${f.rule}] ${f.where} · ${f.detail}`);
    if (r.findings.length) console.log('  ' + Object.entries(byRule).map(([k, v]) => `${k} ${v}`).join(' · '));
  }
  return r.status === 'PASS' ? 0 : 1;
}

if (require.main === module) process.exit(main(process.argv));

module.exports = { evaluate, belongsTo, satisfies, loadLibrary, exportedNames, auditOrder, main };
