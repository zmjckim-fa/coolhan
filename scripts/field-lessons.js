#!/usr/bin/env node

/**
 * CoolHan field-lessons — G22 lesson registry tooling ("what worked, what broke, never again").
 *
 * Single source: knowledge_base/field-lessons.json. Every lesson mined from the projects the harness
 * (and its operator) already built is ONE registry entry. Everything else is derived from it:
 *   • the human-readable KB table (knowledge_base/00_FIELD_LESSONS.md)   — `render`
 *   • the per-agent / per-project checklist an agent reads              — `list`
 *   • the plan-time obligation (plan-doc-check --lessons)                — entries with `plan: true`
 *   • the code scan for detectable failure patterns                      — entries with `detect`
 * A hand-edited table drifts from the registry; `render --check` fails when the doc is not the derived one.
 *
 * Registry entry
 *   { id: "F-07" | "W-03", kind: "fail" | "win", title, what, cause?, prevent?, why?, apply?,
 *     tags: ["all" | "money" | …], owner: ["developer", …], sources: ["P2","P5"], seen: n,
 *     plan: true|false,   // fail: the 기획서 must state how this project prevents it (실패 방지 대응표)
 *     gate: "progress-check" | …,   // fail: an existing harness gate already enforces it
 *     detect: { ext: "code"|"markup"|"style"|"docs"|"any", pattern, flags?, multiline?, only?, skip?,
 *               tests?, hint? } | null }
 * A fail lesson must be enforced somewhere: `plan`, `gate` or `detect` (validate rejects the rest).
 * A detector is data, not code (an exception is a registry cell, never an `if`): adding a lesson with a
 * `detect` block extends the scan with no script change. `only` / `skip` are path regexes; `tests: true`
 * scans test files too (they are skipped by default).
 *
 * Usage
 *   node scripts/field-lessons.js validate [registry]
 *   node scripts/field-lessons.js render   [registry] [--out <doc.md>] [--check]
 *   node scripts/field-lessons.js list     [registry] [--tags a,b] [--kind fail|win] [--owner developer] [--json]
 *   node scripts/field-lessons.js check <root> [--registry <file>] [--tags a,b] [--baseline <file>]
 *                                              [--write-baseline] [--skip-dirs a,b] [--json]
 * Exit: 0 PASS · 1 FAIL · 4 NOT_RUN (nothing was scanned: no file or no detector) · 2 usage/read error.
 * `field-lessons:allow` on a line exempts it from `check`.
 *
 * Honest bound: `check` finds textual signatures of known failure patterns. It cannot see a failure
 * with no textual signature (wrong business rule, a missing screen, a deploy collision): those lessons
 * carry `plan: true` and an owner instead. A clean scan means "no known signature", not "no defect".
 * The registry holds generalized lessons only: no project name, customer, amount, address or credential
 * (validate rejects e-mail addresses and URLs). Per-project evidence stays in git-ignored .coolhan-private/.
 */

const fs = require('fs');
const path = require('path');
const { argValue, argList, positional } = require('./lib/cli');
const { listFiles } = require('./lib/fs');
const { t, finding } = require('./messages');

const DEFAULT_REGISTRY = 'knowledge_base/field-lessons.json';
const DEFAULT_DOC = 'knowledge_base/00_FIELD_LESSONS.md';
const VALUE_FLAGS = ['--out', '--tags', '--kind', '--owner', '--registry', '--baseline', '--skip-dirs'];
const EXIT = { PASS: 0, FAIL: 1, NOT_RUN: 4 };
const EXT = {
  code: /\.(js|mjs|cjs|jsx|ts|tsx|py|go|rb|php|java|kt|cs|vue|svelte)$/i,
  markup: /\.(html?|jsx|tsx|vue|svelte|php|ejs|hbs|njk|twig)$/i,
  style: /\.(css|scss|sass|less)$/i,
  docs: /\.md$/i,
  any: /./
};
const SKIP_DIRS = ['node_modules', '.git', 'dist', 'build', 'coverage', '.next', 'vendor', '__pycache__', '_harness_test',
  '.coolhan-private', '.claude', 'knowledge_base', '_workspace', '_workspace_prev', '_workspace_prev_temp'];
const TEST_FILE = /(?:^|\/)(?:__tests__|tests?|e2e)\/|\.(?:test|spec)\.[jt]sx?$|_test\.(?:py|go)$|(?:^|\/)test_[^/]+\.py$/i;
const ALLOW = /field-lessons:allow/;
const ID = /^[FW]-\d{2,3}$/;
const PRIVATE = /[\w.+-]+@[\w-]+\.[a-z]{2,}|https?:\/\//i;
const FAIL_FIELDS = ['title', 'what', 'cause', 'prevent'];
const WIN_FIELDS = ['title', 'what', 'why', 'apply'];

function load(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }
const cell = (s) => String(s === undefined || s === null ? '' : s).replace(/\|/g, '\\|').replace(/\s*\n\s*/g, ' ');
const tagsOf = (l) => (Array.isArray(l.tags) ? l.tags : []);
const lessonsOf = (reg) => (Array.isArray(reg.lessons) ? reg.lessons : []);

/** Registry self-check: ids, fields, tags, enforcement, detector regexes compile, no private data. */
function validate(reg) {
  const findings = [];
  const add = (...a) => findings.push(finding(...a));
  const seen = new Set();
  const lessons = lessonsOf(reg);
  if (!lessons.length) add('registry-empty', 'registry', 'lessons.registryEmpty');
  lessons.forEach((l, i) => {
    const where = l.id || `lessons[${i}]`;
    if (!ID.test(l.id || '')) add('lesson-id-format', where, 'lessons.idFormat');
    if (seen.has(l.id)) add('lesson-id-duplicate', where, 'lessons.idDuplicate');
    seen.add(l.id);
    if (l.kind !== 'fail' && l.kind !== 'win') { add('lesson-kind', where, 'lessons.kind'); return; }
    if ((l.kind === 'fail') !== /^F-/.test(l.id || '')) add('lesson-kind', where, 'lessons.kindPrefix');
    for (const f of (l.kind === 'fail' ? FAIL_FIELDS : WIN_FIELDS)) {
      if (!String(l[f] || '').trim()) add('lesson-field-missing', where, 'lessons.fieldMissing', { field: f });
    }
    if (!tagsOf(l).length) add('lesson-field-missing', where, 'lessons.fieldMissing', { field: 'tags' });
    if (!Array.isArray(l.owner) || !l.owner.length) add('lesson-field-missing', where, 'lessons.fieldMissing', { field: 'owner' });
    if (l.kind === 'fail' && typeof l.plan !== 'boolean') add('lesson-field-missing', where, 'lessons.fieldMissing', { field: 'plan' });
    if (l.kind === 'fail' && !l.plan && !l.detect && !l.gate) add('lesson-unenforced', where, 'lessons.unenforced');
    if (l.detect) {
      if (!EXT[l.detect.ext]) add('lesson-detect-invalid', where, 'lessons.detectExt', { ext: l.detect.ext });
      if (!l.detect.pattern) add('lesson-detect-invalid', where, 'lessons.detectRegex', { field: 'pattern', error: 'missing' });
      for (const k of ['pattern', 'skip', 'only']) {
        if (l.detect[k] === undefined) continue;
        try { new RegExp(l.detect[k], k === 'pattern' ? (l.detect.flags || '') : 'i'); }
        catch (e) { add('lesson-detect-invalid', where, 'lessons.detectRegex', { field: k, error: e.message }); }
      }
    }
    if (PRIVATE.test(JSON.stringify(l))) add('lesson-private-data', where, 'lessons.privateData');
  });
  return { status: findings.length ? 'FAIL' : 'PASS', findings, count: lessons.length };
}

/**
 * Lessons that apply. `tags` undefined = no tag filter (everything, e.g. an agent reading its own list);
 * `tags` given (even empty) = lessons tagged `all` plus those sharing a tag. Optional kind / owner filter.
 */
function applicable(reg, { tags, kind, owner } = {}) {
  const want = new Set((tags || []).map(s => s.toLowerCase()));
  return lessonsOf(reg).filter(l => {
    if (kind && l.kind !== kind) return false;
    if (owner && !(l.owner || []).includes(owner)) return false;
    if (tags === undefined) return true;
    const lt = tagsOf(l).map(s => s.toLowerCase());
    return lt.includes('all') || lt.some(x => want.has(x));
  });
}

/** Deterministic markdown derived from the registry. Fixed text comes from `reg.doc`, not from code. */
function render(reg) {
  const d = reg.doc || {};
  const c = d.columns || {};
  const all = lessonsOf(reg);
  const seenCell = (l) => `${l.seen || (l.sources || []).length || 1} (${(l.sources || []).join(', ')})`;
  const enforce = (l) => [l.plan ? d.e_plan : '', l.detect ? d.e_detect : '', l.gate ? `${d.e_gate}: ${l.gate}` : ''].filter(Boolean).join(' · ');
  const head = (cols) => `| ${cols.map(x => x || '').join(' | ')} |\n|${cols.map(() => '---').join('|')}|`;
  const out = [];
  out.push(`<!-- ${d.generated || 'GENERATED'}: scripts/field-lessons.js render (knowledge_base/field-lessons.json) -->`);
  out.push(`# ${d.title || 'Field lessons'}`, '');
  for (const line of d.intro || []) out.push(line);
  out.push('', `## ${d.h_fail || 'FAIL'}`, '');
  out.push(head([c.id, c.fail, c.cause, c.prevent, c.tags, c.enforce, c.owner, c.seen]));
  for (const l of all.filter(x => x.kind === 'fail')) {
    out.push(`| ${l.id} | **${cell(l.title)}**: ${cell(l.what)} | ${cell(l.cause)} | ${cell(l.prevent)} | ${tagsOf(l).join(', ')} | ${enforce(l)} | ${(l.owner || []).join(', ')} | ${seenCell(l)} |`);
  }
  out.push('', `## ${d.h_win || 'WIN'}`, '');
  out.push(head([c.id, c.win, c.why, c.apply, c.tags, c.owner, c.seen]));
  for (const l of all.filter(x => x.kind === 'win')) {
    out.push(`| ${l.id} | **${cell(l.title)}**: ${cell(l.what)} | ${cell(l.why)} | ${cell(l.apply)} | ${tagsOf(l).join(', ')} | ${(l.owner || []).join(', ')} | ${seenCell(l)} |`);
  }
  out.push('', `## ${d.h_agents || 'By agent'}`, '');
  for (const o of [...new Set(all.flatMap(l => l.owner || []))].sort()) {
    out.push(`### ${o}`);
    out.push(all.filter(x => (x.owner || []).includes(o)).map(l => `${l.id} ${cell(l.title)}`).join(' · '));
    out.push('');
  }
  out.push(`## ${d.h_detect || 'Detectors'}`, '');
  out.push(head([c.id, c.files, c.pattern, c.hint]));
  for (const l of all.filter(x => x.detect)) {
    const scope = [l.detect.ext, l.detect.only ? `only ${l.detect.only}` : '', l.detect.tests ? 'tests' : ''].filter(Boolean).join(' · ');
    out.push(`| ${l.id} | ${cell(scope)} | \`${String(l.detect.pattern).replace(/\|/g, '\\|').replace(/`/g, "'")}\` | ${cell(l.detect.hint || l.prevent)} |`);
  }
  if (Array.isArray(reg.modules) && reg.modules.length) {
    out.push('', `## ${d.h_modules || 'Modules'}`, '');
    for (const line of d.modules_intro || []) out.push(line);
    out.push('', head([c.id, c.module, c.module_what, c.maturity]));
    for (const m of reg.modules) out.push(`| ${m.id} | ${cell(m.name)} | ${cell(m.what)} | ${cell(m.maturity)} |`);
  }
  out.push('');
  for (const line of d.outro || []) out.push(line);
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';
}

/** Scan `root` with every applicable detector. Baseline = per-lesson counts that may shrink, never grow. */
function check(root, reg, opts = {}) {
  const skip = new Set([...SKIP_DIRS, ...(opts.skipDirs || [])]);
  const files = listFiles(root, { ext: /./, skipDirs: skip });
  const detectors = applicable(reg, { tags: opts.tags || [], kind: 'fail' }).filter(l => l.detect && EXT[l.detect.ext] && l.detect.pattern);
  const hits = [];
  const cache = new Map();
  const read = (f) => { if (!cache.has(f.full)) { try { cache.set(f.full, fs.readFileSync(f.full, 'utf8')); } catch (_) { cache.set(f.full, ''); } } return cache.get(f.full); };
  let scanned = 0;
  for (const l of detectors) {
    const flags = (l.detect.flags || '').replace(/g/g, '');
    const skipPath = l.detect.skip ? new RegExp(l.detect.skip, 'i') : null;
    const onlyPath = l.detect.only ? new RegExp(l.detect.only, 'i') : null;
    for (const f of files) {
      if (!EXT[l.detect.ext].test(f.rel)) continue;
      if (!l.detect.tests && TEST_FILE.test(f.rel)) continue;
      if ((skipPath && skipPath.test(f.rel)) || (onlyPath && !onlyPath.test(f.rel))) continue;
      const text = read(f);
      scanned++;
      if (!text) continue;
      const lines = text.split(/\r?\n/);
      if (l.detect.multiline) {
        const re = new RegExp(l.detect.pattern, flags + 'g');
        let m;
        while ((m = re.exec(text))) {
          const n = text.slice(0, m.index).split(/\r?\n/).length;
          if (!ALLOW.test(lines[n - 1] || '') && !ALLOW.test(lines[n - 2] || '')) hits.push({ id: l.id, where: `${f.rel}:${n}` });
          if (m.index === re.lastIndex) re.lastIndex++;
        }
      } else {
        const re = new RegExp(l.detect.pattern, flags);
        lines.forEach((line, i) => { if (re.test(line) && !ALLOW.test(line)) hits.push({ id: l.id, where: `${f.rel}:${i + 1}` }); });
      }
    }
  }
  const counts = {};
  for (const l of detectors) counts[l.id] = 0;
  for (const h of hits) counts[h.id]++;
  const stats = { files: files.length, detectors: detectors.length, scanned };
  // A scan that looked at nothing proves nothing (lesson F-10): report NOT_RUN, never PASS.
  if (!detectors.length || !scanned) return { status: 'NOT_RUN', mode: opts.baseline ? 'ratchet' : 'strict', findings: [], counts, hits, ...stats };
  const byId = new Map(lessonsOf(reg).map(l => [l.id, l]));
  const base = opts.baseline ? (opts.baseline.counts || {}) : null;
  const known = opts.baseline ? new Set((opts.baseline.hits || []).map(h => `${h.id}@${h.where}`)) : null;
  const findings = [];
  for (const h of hits) {
    if (base && (counts[h.id] <= (base[h.id] || 0) || known.has(`${h.id}@${h.where}`))) continue;   // ratchet: only growth, only new places
    const l = byId.get(h.id);
    findings.push({ rule: h.id, where: h.where, detail: `${l.title}: ${l.detect.hint || l.prevent}` });
  }
  return { status: findings.length ? 'FAIL' : 'PASS', mode: base ? 'ratchet' : 'strict', findings, counts, hits, ...stats };
}

function main(argv) {
  const args = argv.slice(2);
  const cmd = args[0];
  const rest = args.slice(1);
  const json = rest.includes('--json');
  const fail = (key, vars) => { console.error(t(key, vars)); return 2; };
  if (!['validate', 'render', 'list', 'check'].includes(cmd)) return fail('lessons.usage');

  const pos = positional(rest, VALUE_FLAGS);
  const registryPath = cmd === 'check' ? (argValue(rest, '--registry') || DEFAULT_REGISTRY) : (pos || DEFAULT_REGISTRY);
  let reg;
  try { reg = load(registryPath); } catch (e) { return fail('lessons.cannotRead', { file: registryPath, error: e.message }); }

  if (cmd === 'validate') {
    const r = validate(reg);
    if (json) console.log(JSON.stringify({ registry: registryPath, ...r }, null, 2));
    else {
      console.log(t('lessons.validateSummary', { mark: r.status === 'PASS' ? '✔' : '✗', status: r.status, count: r.count, file: registryPath }));
      for (const f of r.findings) console.log(`  [${f.rule}] ${f.where} · ${f.detail}`);
    }
    return EXIT[r.status];
  }

  if (cmd === 'render') {
    const out = argValue(rest, '--out') || DEFAULT_DOC;
    const md = render(reg);
    if (rest.includes('--check')) {
      let cur = ''; try { cur = fs.readFileSync(out, 'utf8').replace(/\r\n/g, '\n'); } catch (_) { /* missing → stale */ }
      const fresh = cur === md;
      console.log(t(fresh ? 'lessons.renderFresh' : 'lessons.renderStale', { file: out }));
      return fresh ? 0 : 1;
    }
    fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
    fs.writeFileSync(out, md);
    console.log(t('lessons.renderWritten', { file: out, count: lessonsOf(reg).length }));
    return 0;
  }

  if (cmd === 'list') {
    const items = applicable(reg, { tags: argList(rest, '--tags'), kind: argValue(rest, '--kind'), owner: argValue(rest, '--owner') });
    if (json) console.log(JSON.stringify(items, null, 2));
    else for (const l of items) console.log(`${l.id} [${tagsOf(l).join(',')}] ${l.title}: ${l.kind === 'fail' ? l.prevent : l.apply}`);
    return 0;
  }

  // check
  if (!pos) return fail('lessons.usage');
  const root = path.resolve(pos);
  if (!fs.existsSync(root)) return fail('lessons.noRoot', { root });
  const opts = { tags: argList(rest, '--tags'), skipDirs: argList(rest, '--skip-dirs') };
  const baselinePath = argValue(rest, '--baseline');
  if (rest.includes('--write-baseline')) {
    const r = check(root, reg, opts);
    const out = baselinePath || path.join(root, 'docs', 'FIELD_LESSONS_BASELINE.json');
    fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
    fs.writeFileSync(out, JSON.stringify({ written: new Date().toISOString().slice(0, 10), counts: r.counts, hits: r.hits }, null, 2) + '\n');
    console.log(t('lessons.baselineWritten', { file: out, counts: JSON.stringify(r.counts) }));
    return 0;
  }
  if (baselinePath) {
    try { opts.baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8')); }
    catch (e) { return fail('lessons.cannotRead', { file: baselinePath, error: e.message }); }
  }
  const r = check(root, reg, opts);
  if (json) console.log(JSON.stringify({ root, ...r }, null, 2));
  else {
    const mark = r.status === 'PASS' ? '✔' : r.status === 'FAIL' ? '✗' : '○';
    console.log(t('lessons.checkSummary', { mark, status: r.status, mode: r.mode, files: r.scanned, detectors: r.detectors, counts: JSON.stringify(r.counts) }));
    for (const f of r.findings) console.log(`  [${f.rule}] ${f.where} · ${f.detail}`);
    if (r.status === 'NOT_RUN') console.log(t('lessons.notRun'));
    if (r.status === 'FAIL') console.log(t('lessons.drivingDoc'));
  }
  return EXIT[r.status];
}

if (require.main === module) process.exit(main(process.argv));

module.exports = { load, validate, applicable, render, check, main, DEFAULT_REGISTRY, DEFAULT_DOC };
