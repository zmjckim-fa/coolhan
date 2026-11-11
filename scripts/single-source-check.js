#!/usr/bin/env node

/**
 * CoolHan single-source-check — G20-C minimal-source / single-source-of-truth measurement + ratchet gate.
 *
 * Driving doc: knowledge_base/00_MINIMAL_SOURCE_PRINCIPLES.md §0 (제0 규칙 — 최소 소스), §1 (단일 원천
 * S1–S8), §2 (새 파일 검문 5문), §4-a (현황 실측 — 숫자로), §4-f (린트로 금지 목록을 기계가 막게 한다).
 *
 * Measures (always, numbers only — §4-a):
 *   files · max_file (path, lines) · duplicate_helpers (same function name AND same normalized body in
 *   ≥2 files — 중복 0 is the rule, not one-line compression) · inline_styles (`style="…"` / `style={{` in
 *   markup files — S1 says screens use class names only) · hardcoded_sentences (natural-language string
 *   literals of ≥4 words, or Hangul phrases, in code outside the S2 dictionary dirs) · target_literals
 *   (names given with --targets appearing in code outside the S3 registry/adapter dirs).
 *
 * Gate (§4-c/d/f — new code obeys the rule, old code moves when touched):
 *   • without --baseline : strict — any finding is FAIL (use for a new project / new module)
 *   • with    --baseline : ratchet — FAIL only when a count grew or a NEW duplicate pair / inline style /
 *                          sentence / target literal appeared vs the committed baseline; shrinking is PASS
 *   • --write-baseline   : snapshot the current measurement as the baseline (commit it — §4-c)
 *
 * Usage: node scripts/single-source-check.js [root] [--measure] [--baseline <file>] [--write-baseline]
 *          [--targets a,b,c] [--registry-dirs d1,d2] [--dict-dirs d1,d2] [--json]
 * Exit:  0 PASS · 1 FAIL · 2 usage error.  `single-source-check:allow` on a line exempts it.
 *
 * Honest bound: textual heuristics — a duplicate written twice with different variable names, a hand-made
 * derived table (S4), a scattered setting (S5) or a one-off file (§2-⑤) are NOT detected; the numbers prove
 * "no known pattern grew", not "the codebase has one source for everything".
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { argValue, argList, positional } = require('./lib/cli');
const { t, finding } = require('./messages');

const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'build', 'coverage', '.next', 'vendor', '__pycache__',
  '_harness_test', '__tests__', 'test', 'tests', '.coolhan-private', '.claude', 'knowledge_base']);
const SKIP_PREFIX = /^_workspace/;
const CODE_EXT = /\.(js|mjs|cjs|jsx|ts|tsx|py|go|rb|php|java|kt|cs|vue|svelte)$/i;
const MARKUP_EXT = /\.(html?|jsx|tsx|vue|svelte|php|ejs|hbs|njk|twig)$/i;
const TEST_FILE = /\.(test|spec)\.[jt]sx?$|_test\.(py|go)$|test_[^/\\]+\.py$/i;
const DEFAULT_DICT_DIRS = ['i18n', 'locales', 'locale', 'lang', 'messages', 'translations', 'dictionary', 'strings'];
const DEFAULT_REGISTRY_DIRS = ['registry', 'registries', 'adapters', 'adapter', 'specs', 'providers', 'targets', 'channels', 'markets'];
const ALLOW = /single-source-check:allow/;
const MIN_BODY_CHARS = 80;
const VALUE_FLAGS = ['--baseline', '--targets', '--registry-dirs', '--dict-dirs', '--max-file-lines', '--skip-dirs'];

const FUNC_HEAD = [
  /^\s*(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/,                    // js/ts/php
  /^\s*(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:function\b|\([^)]*\)\s*=>|[A-Za-z_$][\w$]*\s*=>)/, // arrow/expr
  /^\s*(?:public|private|protected|static|\s)*\s*(?:async\s+)?def\s+([A-Za-z_]\w*)\s*\(/,  // python
  /^\s*func\s+(?:\([^)]*\)\s*)?([A-Za-z_]\w*)\s*\(/,                                         // go
  /^\s*def\s+([A-Za-z_]\w*[?!]?)/                                                             // ruby
];
const INLINE_STYLE = /\sstyle\s*=\s*(?:"[^"]*[a-z-]+\s*:[^"]*"|'[^']*[a-z-]+\s*:[^']*'|\{\{)/i;
const STRING_LIT = /"((?:[^"\\\n]|\\.){8,}?)"|'((?:[^'\\\n]|\\.){8,}?)'|`((?:[^`\\]|\\.){8,}?)`/g;
const LATIN_SENTENCE = /^(?:[A-Za-z][A-Za-z'’,.!?:;()-]*\s+){3,}[A-Za-z][A-Za-z'’,.!?:;()-]*$/;
const HANGUL_PHRASE = /[가-힣]{2,}\s+[가-힣]/;
const CODE_LIKE = /^[\w./:@#%?=&-]+$|^https?:\/\/|^[\w-]+\/[\w-]+|^\$\{|^[A-Z0-9_]+$|^<\/?\w|^(?:\.|#)[\w-]+|^--?[\w-]+$|^\\|\.(?:js|json|md|py|css|html|png|jpg)\b/i;

function walk(dir, out, root, opts) {
  let entries; try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (_) { return; }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) { if (!SKIP_DIRS.has(e.name) && !(opts.skipDirs || []).includes(e.name) && !SKIP_PREFIX.test(e.name) && !e.name.startsWith('.')) walk(full, out, root, opts); continue; }
    if (CODE_EXT.test(e.name) || MARKUP_EXT.test(e.name)) out.push({ full, rel: path.relative(root, full).split(path.sep).join('/') });
  }
}

function inDirs(rel, dirs) { const parts = rel.toLowerCase().split('/'); return dirs.some(d => parts.includes(d.toLowerCase())); }
function isCommentLine(line, ext) {
  const t = line.trim();
  if (/^(?:py|rb)$/.test(ext)) return t.startsWith('#');
  return t.startsWith('//') || t.startsWith('*') || t.startsWith('/*') || t.startsWith('#') || t.startsWith('<!--');
}
function normalize(body) {
  return body.replace(/\/\/[^\n]*|#[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').trim();
}

/** Extract function bodies: brace balance for brace languages, indentation for py/rb. */
function extractFunctions(lines, ext) {
  const fns = [];
  const indentLang = /^(?:py|rb)$/.test(ext);
  for (let i = 0; i < lines.length; i++) {
    let name = null;
    for (const re of FUNC_HEAD) { const m = re.exec(lines[i]); if (m) { name = m[1]; break; } }
    if (!name) continue;
    let end = i;
    if (indentLang) {
      const base = lines[i].search(/\S/);
      end = i + 1;
      while (end < lines.length && (lines[end].trim() === '' || lines[end].search(/\S/) > base)) end++;
      end--;
    } else {
      let depth = 0, seen = false;
      for (let j = i; j < lines.length; j++) {
        for (const ch of lines[j]) { if (ch === '{') { depth++; seen = true; } else if (ch === '}') depth--; }
        if (seen && depth <= 0) { end = j; break; }
        if (!seen && j > i) { end = i; break; } // one-liner without a brace
      }
    }
    const body = normalize(lines.slice(i, end + 1).join('\n'));
    if (body.length >= MIN_BODY_CHARS) fns.push({ name, line: i + 1, hash: crypto.createHash('sha1').update(body).digest('hex').slice(0, 12), chars: body.length });
  }
  return fns;
}

function measure(root, opts = {}) {
  const dictDirs = opts.dictDirs || DEFAULT_DICT_DIRS;
  const registryDirs = opts.registryDirs || DEFAULT_REGISTRY_DIRS;
  const targets = (opts.targets || []).filter(Boolean);
  const files = []; walk(root, files, root, opts);
  const byHash = new Map();
  const inline_styles = [], hardcoded_sentences = [], target_literals = [];
  let max_file = { path: null, lines: 0 };
  const targetRe = targets.length ? new RegExp(`(?<![\\w-])(${targets.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})(?![\\w-])`, 'i') : null;

  for (const f of files) {
    let text; try { text = fs.readFileSync(f.full, 'utf8'); } catch (_) { continue; }
    const lines = text.split(/\r?\n/);
    const ext = path.extname(f.rel).slice(1).toLowerCase();
    if (lines.length > max_file.lines) max_file = { path: f.rel, lines: lines.length };
    const isTest = TEST_FILE.test(f.rel);
    const isCode = CODE_EXT.test(f.rel);
    const isMarkup = MARKUP_EXT.test(f.rel);

    if (isCode && !isTest) {
      for (const fn of extractFunctions(lines, ext)) {
        const key = `${fn.name}#${fn.hash}`;
        if (!byHash.has(key)) byHash.set(key, { name: fn.name, hash: fn.hash, chars: fn.chars, files: [] });
        if (ALLOW.test(lines[fn.line - 1])) continue;
        byHash.get(key).files.push(`${f.rel}:${fn.line}`);
      }
    }
    lines.forEach((line, i) => {
      if (ALLOW.test(line)) return;
      const where = `${f.rel}:${i + 1}`;
      if (isMarkup && INLINE_STYLE.test(line)) inline_styles.push(where);
      if (isCode && !isTest && !inDirs(f.rel, dictDirs) && !isCommentLine(line, ext)) {
        let m; STRING_LIT.lastIndex = 0;
        while ((m = STRING_LIT.exec(line))) {
          const s = (m[1] ?? m[2] ?? m[3]).trim();
          if (CODE_LIKE.test(s)) continue;
          if (LATIN_SENTENCE.test(s) || HANGUL_PHRASE.test(s)) { hardcoded_sentences.push({ where, text: s.slice(0, 60) }); break; }
        }
      }
      if (targetRe && isCode && !isTest && !inDirs(f.rel, registryDirs)) {
        const tm = targetRe.exec(line.replace(/\/\/.*$|#.*$/, ''));
        if (tm) target_literals.push({ where, target: tm[1] });
      }
    });
  }
  const duplicate_helpers = [...byHash.values()].filter(v => new Set(v.files.map(x => x.split(':')[0])).size >= 2)
    .map(v => ({ name: v.name, hash: v.hash, chars: v.chars, files: v.files }));
  return {
    files: files.length, max_file, duplicate_helpers, inline_styles, hardcoded_sentences, target_literals,
    counts: { files: files.length, max_file_lines: max_file.lines, duplicate_helpers: duplicate_helpers.length, inline_styles: inline_styles.length, hardcoded_sentences: hardcoded_sentences.length, target_literals: target_literals.length }
  };
}

function evaluate(root, opts = {}) {
  const m = measure(root, opts);
  const findings = [];
  const add = (...a) => findings.push(finding(...a));
  const base = opts.baseline || null;
  if (!base) {
    for (const d of m.duplicate_helpers) add('duplicate-helper', d.files.join(' = '), 'single.duplicateHelper', { name: d.name, count: d.files.length });
    for (const w of m.inline_styles) add('inline-style', w, 'single.inlineStyle');
    for (const s of m.hardcoded_sentences) add('hardcoded-sentence', s.where, 'single.hardcodedSentence', { text: s.text });
    for (const x of m.target_literals) add('target-literal', x.where, 'single.targetLiteral', { target: x.target });
  } else {
    const bc = base.counts || {};
    const baseDup = new Set((base.duplicate_helpers || []).map(d => `${d.name}#${d.hash}`));
    for (const d of m.duplicate_helpers) if (!baseDup.has(`${d.name}#${d.hash}`)) add('new-duplicate-helper', d.files.join(' = '), 'single.newDuplicate', { name: d.name });
    const baseSet = (arr, k) => new Set((arr || []).map(x => k ? x[k] : x));
    const bInl = baseSet(base.inline_styles); for (const w of m.inline_styles) if (!bInl.has(w) && m.counts.inline_styles > (bc.inline_styles ?? 0)) { add('inline-style-grew', w, 'single.inlineGrew', { before: bc.inline_styles ?? 0, after: m.counts.inline_styles }); break; }
    const bSen = baseSet(base.hardcoded_sentences, 'where'); if (m.counts.hardcoded_sentences > (bc.hardcoded_sentences ?? 0)) { const first = m.hardcoded_sentences.find(s => !bSen.has(s.where)); add('hardcoded-sentence-grew', first ? first.where : '(code)', 'single.sentenceGrew', { before: bc.hardcoded_sentences ?? 0, after: m.counts.hardcoded_sentences }); }
    if (m.counts.target_literals > (bc.target_literals ?? 0)) add('target-literal-grew', m.target_literals[0] ? m.target_literals[0].where : '(code)', 'single.targetGrew', { before: bc.target_literals ?? 0, after: m.counts.target_literals });
    const limit = opts.maxFileLines || 0;
    if (limit && m.counts.max_file_lines > limit && m.counts.max_file_lines > (bc.max_file_lines ?? 0)) add('max-file-grew', m.max_file.path, 'single.maxFileGrew', { before: bc.max_file_lines ?? 0, after: m.counts.max_file_lines, limit });
  }
  return { status: findings.length ? 'FAIL' : 'PASS', mode: base ? 'ratchet' : 'strict', findings, ...m };
}

function main(argv) {
  const args = argv.slice(2);
  const json = args.includes('--json');
  const root = path.resolve(positional(args, VALUE_FLAGS) || '.');
  if (!fs.existsSync(root)) { console.error(t('single.noRoot', { root })); return 2; }
  const opts = {
    targets: argList(args, '--targets') || [],
    registryDirs: argList(args, '--registry-dirs'),
    dictDirs: argList(args, '--dict-dirs'),
    skipDirs: argList(args, '--skip-dirs'),
    maxFileLines: argValue(args, '--max-file-lines') ? Number(argValue(args, '--max-file-lines')) : 0
  };
  const baselinePath = argValue(args, '--baseline') ? path.resolve(argValue(args, '--baseline')) : null;

  if (args.includes('--write-baseline')) {
    const m = measure(root, opts);
    const out = baselinePath || path.join(root, 'docs', 'SINGLE_SOURCE_BASELINE.json');
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, JSON.stringify({ written: new Date().toISOString().slice(0, 10), root: path.basename(root), counts: m.counts, max_file: m.max_file, duplicate_helpers: m.duplicate_helpers, inline_styles: m.inline_styles, hardcoded_sentences: m.hardcoded_sentences, target_literals: m.target_literals }, null, 2) + '\n');
    console.log(t('single.baselineWritten', { file: path.relative(process.cwd(), out), counts: JSON.stringify(m.counts) }));
    return 0;
  }
  if (args.includes('--measure')) {
    const m = measure(root, opts);
    if (json) console.log(JSON.stringify(m, null, 2));
    else {
      console.log(`single-source-check --measure (${path.basename(root)}): ${JSON.stringify(m.counts)}`);
      console.log(`  max file: ${m.max_file.path} (${m.max_file.lines} lines)`);
      for (const d of m.duplicate_helpers) console.log(`  dup ${d.name}: ${d.files.join(' = ')}`);
    }
    return 0;
  }
  if (baselinePath) {
    try { opts.baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8')); }
    catch (e) { console.error(t('single.cannotReadBaseline', { file: baselinePath, error: e.message })); return 2; }
  }
  const r = evaluate(root, opts);
  if (json) console.log(JSON.stringify({ root, ...r }, null, 2));
  else {
    console.log(`${r.status === 'PASS' ? '✔' : '✗'} single-source-check: ${r.status} (${r.mode}) — ${JSON.stringify(r.counts)}`);
    for (const f of r.findings) console.log(`  [${f.rule}] ${f.where} — ${f.detail}`);
    if (r.status === 'FAIL') console.log(t('single.drivingDoc'));
  }
  return r.status === 'PASS' ? 0 : 1;
}

if (require.main === module) process.exit(main(process.argv));

module.exports = { measure, evaluate, extractFunctions, main, DEFAULT_DICT_DIRS, DEFAULT_REGISTRY_DIRS };
