#!/usr/bin/env node

/**
 * CoolHan module-single-source-check — «한 가지는 한 곳에» measured over a module library
 * (knowledge_base/00_MODULE_STANDARD.md §6-4, §9-2; principle in 00_MINIMAL_SOURCE_PRINCIPLES.md §1-1).
 *
 * module-check reads one module's form and module-integration-check reads how modules fit; neither reads whether a
 * value, a sentence or a function exists once. This one does, over the source of every module, and reports only what
 * those two do not (token definitions, language pairs and table owners stay with them).
 *
 * Rules (each finding is one place to fix):
 *   text-literal       a sentence or label a person reads is written outside the text/ dictionaries
 *   enum-duplicate     one module writes the same value set (3+ values) in two files
 *   function-copy      the same exported function (body 160+ characters) is written in two modules
 *   component-copy     the same file (400+ characters) is in two modules
 *   component-redrawn  a screen draws by hand what admin-panels' parts draw (title row, section, loading, retry)
 *   color-in-code      a colour value is written in code outside style/
 *   screen-validation  a screen owns a validation regex instead of calling the core function
 *   db-ddl-outside-db  CREATE TABLE written in code outside db/ (a copy of the schema)
 *   env-direct         process.env is read outside adapters/
 *
 * Exempt: `single-source-ok: <reason>` on the line or the line above; a whole file with `single-source-ok-file: <reason>`
 * in its first 5 lines. Use it for what must stay letter for letter (an outside sheet's headings, stored values compared
 * as stored, a QR code's black and white) and say why. A throw, an assertion or a console call is not screen text.
 *
 * The whole library is read, and findings are reported for the named modules (--only), because a copy is found by
 * looking at the other modules. A copy is reported on the later module (alphabetical); the first one is the owner.
 *
 * Usage: node scripts/module-single-source-check.js <library modules dir> [--only a,b] [--rule text-literal] [--list] [--json]
 * Exit:  0 PASS · 1 FAIL · 2 usage · 4 no module.
 *
 * Honest bound: textual. A function written twice with other names, a value set that differs by one value and a sentence
 * built from pieces are not found. A pass says no known pattern is left, not that every thing has one source.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { argValue, argList, positional } = require('./lib/cli');
const { t, finding } = require('./messages');
const { loadLibrary } = require('./module-integration-check');

const RULES = ['text-literal', 'enum-duplicate', 'function-copy', 'component-copy', 'component-redrawn', 'color-in-code', 'screen-validation', 'db-ddl-outside-db', 'env-direct'];
const SOURCE = /\.(?:ts|tsx|js|jsx|mjs|cjs)$/;
const HANGUL = /[가-힣]/;
const COLOR = /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b|\b(?:rgba?|hsla?)\(\s*\d/;
const NOT_TEXT = /\bthrow\b|\bnew \w*Error\(|console\.\w+\(|\bassert\w*\(/;
const REDRAWN = /className="(ap-screen-header|ap-section|ap-loading|ap-retry)"/;
const sha = text => crypto.createHash('sha1').update(text).digest('hex');
const lineOf = (code, index) => code.slice(0, index).split('\n').length;

/**
 * Split a source into its string literals (line and text) and its code with comments removed. Regex literals are kept
 * as code so a quote inside one is not read as a string.
 */
function scan(src) {
  const strings = []; let code = ''; let line = 1; let i = 0; const n = src.length; const tpl = [];
  while (i < n) {
    const c = src[i], d = src[i + 1];
    if (c === '/' && d === '/') { while (i < n && src[i] !== '\n') i++; continue; }
    if (c === '/' && d === '*') { i += 2; while (i < n && !(src[i] === '*' && src[i + 1] === '/')) { if (src[i] === '\n') { line++; code += '\n'; } i++; } i += 2; continue; }
    if (c === '/' && /(^|[(,=:[!&|?{};\n]|\breturn|\btypeof|=>)\s*$/.test(code.slice(-12))) {
      let j = i + 1, cls = false, isRe = false;
      while (j < n && src[j] !== '\n') { if (src[j] === '\\') { j += 2; continue; } if (src[j] === '[') cls = true; else if (src[j] === ']') cls = false; else if (src[j] === '/' && !cls) { isRe = true; break; } j++; }
      if (isRe) { code += src.slice(i, j + 1); i = j + 1; continue; }
    }
    if (c === '"' || c === "'") {
      const start = line; let s = ''; i++;
      while (i < n && src[i] !== c && src[i] !== '\n') { if (src[i] === '\\') { s += src[i + 1] ?? ''; i += 2; continue; } s += src[i++]; }
      i++; strings.push({ line: start, text: s }); code += c + s + c; continue;
    }
    if (c === '`' || (c === '}' && tpl.length && tpl[tpl.length - 1] === 0)) {
      if (c === '}') tpl.pop();
      const start = line; let s = ''; i++;
      while (i < n) {
        if (src[i] === '\\') { s += src[i + 1] ?? ''; i += 2; continue; }
        if (src[i] === '`') { i++; break; }
        if (src[i] === '$' && src[i + 1] === '{') { i += 2; tpl.push(0); break; }
        if (src[i] === '\n') line++;
        s += src[i++];
      }
      strings.push({ line: start, text: s }); code += '`…`'; continue;
    }
    if (tpl.length) { if (c === '{') tpl[tpl.length - 1]++; else if (c === '}') tpl[tpl.length - 1]--; }
    if (c === '\n') line++;
    code += c; i++;
  }
  return { strings, code };
}

/** Findings of one source file. `ctx` collects what only the whole library can judge (copies). */
function checkFile(modName, rel, src, ctx, report) {
  const part = rel.split('/')[0];
  const lines = src.split('\n');
  if (lines.slice(0, 5).some(l => l.includes('single-source-ok-file:'))) return;
  const ok = ln => (lines[ln - 1] || '').includes('single-source-ok:') || (lines[ln - 2] || '').includes('single-source-ok:');
  const where = ln => `${modName}/${rel}:${ln}`;
  const { strings, code } = scan(src);
  const codeLines = code.split('\n');
  // A helper that only throws (`const fail = (m): never => { throw … }`) carries a message for the developer.
  const throwers = [...code.matchAll(/(?:const|function)\s+(\w+)\b[^\n]*?(?:\):\s*never\b|=>\s*\{?\s*throw\b)/g)].map(x => x[1]);
  const throwCall = throwers.length ? new RegExp(`\\b(?:${throwers.join('|')})\\(`) : null;

  const norm = code.replace(/\s+/g, '');
  if (norm.length >= 400) { const h = sha(norm); ctx.files.set(h, [...(ctx.files.get(h) || []), { mod: modName, where: where(1), rel }]); }

  for (const f of code.matchAll(/^export (?:async )?(?:function (\w+)|const (\w+)\s*=)/gm)) {
    const rest = code.slice(f.index);
    const end = rest.search(/\n(?=export |\/\/ |$)/);
    const body = (end > 0 ? rest.slice(0, end) : rest).replace(/\s+/g, '');
    const ln = lineOf(code, f.index);
    if (body.length < 160 || ok(ln)) continue;
    const h = sha(body);
    ctx.functions.set(h, [...(ctx.functions.get(h) || []), { mod: modName, where: where(ln), name: f[1] || f[2] }]);
  }

  if (modName !== 'admin-panels') codeLines.forEach((l, k) => { const c = l.match(REDRAWN); if (c && !ok(k + 1)) report('component-redrawn', where(k + 1), 'modsingle.redrawn', { cls: c[1] }); });

  for (const s of strings) {
    if (ok(s.line)) continue;
    const lineCode = codeLines[s.line - 1] || '';
    if (HANGUL.test(s.text) && !NOT_TEXT.test(lineCode) && !(throwCall && throwCall.test(lineCode))) report('text-literal', where(s.line), 'modsingle.text', { text: s.text.slice(0, 60) });
    if (COLOR.test(s.text) && part !== 'style') report('color-in-code', where(s.line), 'modsingle.color', { text: s.text.slice(0, 40) });
  }
  codeLines.forEach((l, k) => {
    if (ok(k + 1)) return;
    if (/CREATE\s+TABLE/i.test(l) && part !== 'db') report('db-ddl-outside-db', where(k + 1), 'modsingle.ddl', { text: l.trim().slice(0, 60) });
    if (/process\.env\b/.test(l) && part !== 'adapters') report('env-direct', where(k + 1), 'modsingle.env', { text: l.trim().slice(0, 60) });
    if ((part === 'user' || part === 'admin') && /\/(?![/*])(?:\\.|[^/\n\\])+\/[gimsuy]*\.test\(|new RegExp\(/.test(l)) report('screen-validation', where(k + 1), 'modsingle.validation', { text: l.trim().slice(0, 80) });
  });

  const sets = ctx.sets;
  for (const g of code.matchAll(/(?:(['"])[A-Za-z][\w.-]*\1\s*\|\s*){2,}(['"])[A-Za-z][\w.-]*\2|\[\s*(?:(['"])[A-Za-z][\w.-]*\3\s*,\s*){2,}(['"])[A-Za-z][\w.-]*\4\s*,?\s*\]/g)) {
    const key = [...new Set([...g[0].matchAll(/['"]([A-Za-z][\w.-]*)['"]/g)].map(x => x[1]))].sort().join('|');
    const ln = lineOf(code, g.index);
    if (key.split('|').length < 3 || ok(ln)) continue;
    const id = `${modName}\0${key}`;
    const at = sets.get(id) || [];
    if (!at.some(a => a.rel === rel)) at.push({ rel, where: where(ln), key });
    sets.set(id, at);
  }
}

/** Every rule over the whole library; `only` limits what is reported, not what is read. */
function evaluate(dir, only) {
  const mods = loadLibrary(dir);
  const findings = [];
  const report = (...a) => findings.push(finding(...a));
  if (!mods.size) return { status: 'NO_MODULES', findings, modules: 0 };
  const ctx = { files: new Map(), functions: new Map(), sets: new Map() };
  for (const mod of mods.values()) {
    for (const f of [...mod.files].sort((x, y) => (x.rel < y.rel ? -1 : 1))) {
      if (!SOURCE.test(f.rel) || /^(?:test|docs)\//.test(f.rel)) continue;
      const src = fs.readFileSync(f.full, 'utf8');
      checkFile(mod.name, f.rel, src, ctx, report);
    }
  }
  for (const at of ctx.sets.values()) if (at.length > 1) for (const a of at.slice(1)) report('enum-duplicate', a.where, 'modsingle.enum', { values: a.key.slice(0, 70), first: at[0].where });
  for (const list of ctx.files.values()) if (new Set(list.map(x => x.mod)).size > 1) for (const x of list.slice(1)) report('component-copy', x.where, 'modsingle.fileCopy', { first: list[0].where });
  for (const list of ctx.functions.values()) if (new Set(list.map(x => x.mod)).size > 1) for (const x of list.slice(1)) report('function-copy', x.where, 'modsingle.functionCopy', { name: x.name, first: list[0].where });
  const wanted = only && only.length ? new Set(only) : null;
  const kept = wanted ? findings.filter(f => wanted.has(f.where.split('/')[0])) : findings;
  return { status: kept.length ? 'FAIL' : 'PASS', findings: kept, modules: mods.size };
}

function main(argv) {
  const args = argv.slice(2);
  const dir = positional(args, ['--only', '--rule']);
  if (!dir) { console.error(t('modsingle.usage')); return 2; }
  const rule = argValue(args, '--rule');
  if (rule && !RULES.includes(rule)) { console.error(t('modsingle.usage')); return 2; }
  const r = evaluate(path.resolve(dir), argList(args, '--only'));
  if (r.status === 'NO_MODULES') { console.error(t('modsingle.noModules', { dir })); return 4; }
  const shown = rule ? r.findings.filter(f => f.rule === rule) : r.findings;
  const status = shown.length ? 'FAIL' : 'PASS';
  if (args.includes('--json')) console.log(JSON.stringify({ dir, status, modules: r.modules, findings: shown }, null, 2));
  else {
    const byRule = {};
    for (const f of shown) (byRule[f.rule] ||= []).push(f);
    for (const [name, list] of Object.entries(byRule)) {
      console.log(t('modsingle.group', { rule: name, count: list.length, modules: new Set(list.map(f => f.where.split('/')[0])).size }));
      if (args.includes('--list')) for (const f of list) console.log(`  ${f.where} · ${f.detail}`);
    }
    console.log(t('modsingle.summary', { mark: status === 'PASS' ? '✔' : '✗', status, modules: r.modules, findings: shown.length }));
  }
  return status === 'PASS' ? 0 : 1;
}

if (require.main === module) process.exit(main(process.argv));

module.exports = { evaluate, scan, main, RULES };
