#!/usr/bin/env node

/**
 * CoolHan ai-arch-check — AI Agent architecture gate (G19).
 *
 * Driving document: knowledge_base/00_AI_ARCHITECTURE_PRINCIPLES.md ("right brain for the right
 * task": deterministic code → Decision Model → LLM → human; Application Code owns the final action).
 * This gate makes the statically checkable subset of those principles mechanical:
 *
 *   R1 ai-call-outside-service-layer   — a model/provider call (Anthropic/OpenAI/Google/Jev/Clef/
 *                                        Workers AI/OpenRouter…) found outside the AI service layer
 *                                        (§15/§16: calls live under services/ai, behind an abstraction)
 *   R2 ai-service-executes-action      — an AI service module imports a DB/ORM/payment/mail client
 *                                        (§3: AI returns a structured result; Application Code acts)
 *   R3 no-schema-validation            — AI service layer has no schema validation at all (§4)
 *   R4 no-architecture-decision-record — AI calls exist but docs/AI_DECISIONS.md has no record (§14)
 *   R5 record-incomplete / invalid     — a record misses one of the 10 fields, leaves the template
 *                                        placeholder, or has an unknown Decision type (§14)
 *   R6 deterministic-not-code          — Decision type Deterministic but Selected model ≠ Code (§9/§10)
 *   R7 llm-for-bounded-decision        — Classification/Vision decided by an LLM with no `Rationale:`
 *                                        line (§6/§18: a different approach must be explained first)
 *   R8 threshold-not-in-code           — a record needs confidence (Classification/Vision or
 *                                        Confidence: yes) but no numeric threshold exists in code (§5)
 *
 * Usage: node scripts/ai-arch-check.js [root] [--records docs/AI_DECISIONS.md]
 *          [--service-dirs services/ai,src/ai] [--json]
 * Exit: 0 PASS or NOT_APPLICABLE (no AI usage and no records), 1 FAIL, 2 usage error.
 * A line containing `ai-arch-check:allow` is exempt from call detection (quoted examples, detector tables).
 *
 * Honest bound (C10): a textual/static gate. PASS means "no violation of the checkable rules was
 * found" — not that the task truly needed AI, that the chosen model is the best one, or that the
 * thresholds are well calibrated. Those judgments stay with the Plan Reviewer (§13 five questions,
 * §17 checklist) and the human. Provider names are detection tokens, not endorsements (C12).
 */

const fs = require('fs');
const path = require('path');

const DEFAULT_SERVICE_DIRS = ['services/ai', 'src/services/ai', 'app/services/ai', 'lib/ai', 'src/ai', 'ai'];
const DEFAULT_RECORDS = 'docs/AI_DECISIONS.md';
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'build', 'coverage', '.next', 'vendor',
  '_workspace', '_workspace_prev', '_harness_test', '__tests__', 'test', 'tests', '__pycache__', '.coolhan-private']);
const CODE_EXT = /\.(js|mjs|cjs|jsx|ts|tsx|py|go|rb|php|java|kt|cs)$/i;
const TEST_FILE = /\.(test|spec)\.[jt]sx?$|_test\.(py|go)$|^test_.*\.py$/i;

// Provider/model call signatures (detection tokens — see header).
const PROVIDER_PATTERNS = [
  { id: 'anthropic', re: /@anthropic-ai\/sdk|api\.anthropic\.com|from\s+anthropic\s+import|import\s+anthropic\b/ },
  { id: 'openai', re: /require\(\s*['"]openai['"]\s*\)|from\s+['"]openai['"]|api\.openai\.com|from\s+openai\s+import|import\s+openai\b/ },
  { id: 'google', re: /@google\/generative-ai|generativelanguage\.googleapis\.com|google\.generativeai/ },
  { id: 'jev', re: /api\.typesafe\.ai|typesafe-ai|['"]typesafe\/jev|\bjev(?:-\w+)?['"]/i }, // ai-arch-check:allow — detector table
  { id: 'clef', re: /@cf\/cloudflare\/clef(?:-flash)?/i },
  { id: 'workers-ai', re: /env\.AI\.run\(|@cloudflare\/ai\b|\/ai\/run\/@cf\// },
  { id: 'openrouter', re: /openrouter\.ai\/api/ },
  { id: 'llm-call', re: /\.messages\.create\(|chat\.completions\.create\(|\.generateContent\(|\.responses\.create\(/ }
];

// Business-action clients an AI service module must not import (§3 — AI decides, code acts).
const ACTION_IMPORT = /(?:require\(|from\s+)\s*['"][^'"]*(?:@prisma\/client|prisma|knex|mongoose|sequelize|typeorm|\bpg\b|mysql2?|stripe|paypal|braintree|nodemailer|@sendgrid\/mail|twilio)[^'"]*['"]|from\s+(?:sqlalchemy|django\.db|stripe|psycopg2?)\b|import\s+(?:stripe|sqlalchemy|psycopg2)\b/;

// Structured-output / schema validation evidence (§4).
const SCHEMA_VALIDATION = /from\s+['"]zod['"]|require\(\s*['"]zod['"]\s*\)|\bz\.object\(|\.safeParse\(|\bajv\b|new\s+Ajv\(|jsonschema|json_schema|output_config|response_format|\bpydantic\b|BaseModel\)|validateSchema\(|assertSchema\(|\bschema\.validate\(|\byup\.object\(|\bjoi\.object\(|\bvalibot\b/;

// A numeric decision threshold living in code (§5 — Application Code owns the threshold).
const THRESHOLD_IN_CODE = /\b(?:confidence|score|probability|prob|p)\s*(?:>=|>|<=|<)\s*(?:0?\.\d+|[A-Z][A-Z0-9_]*THRESHOLD[A-Z0-9_]*)|[A-Z_]*THRESHOLD[A-Z_]*\s*[:=]\s*0?\.\d+|\bthreshold\s*[:=]\s*0?\.\d+|\bconfidence_threshold\s*=\s*0?\.\d+/i;

const RECORD_FIELDS = ['feature', 'input', 'decision type', 'selected model', 'expected output',
  'confidence', 'threshold', 'fallback', 'human escalation', 'final action'];
const FIELD_LINE = /^\s*(?:[-*]\s*)?\**\s*(Feature|Input|Decision type|Selected model|Expected output|Confidence|Threshold|Fallback|Human escalation|Final action|Rationale)\s*\**\s*:\s*(.*)$/i;
const ALLOW_MARKER = /ai-arch-check:allow/;
const PLACEHOLDER_VALUE = /^\s*\[[^\]]*\]\s*$|^\s*<[^>]*>\s*$|^\s*(?:TBD|TODO|\.\.\.|…)\s*$/i; // no-placeholder-check:allow — detection tokens

function readText(p) { try { return fs.readFileSync(p, 'utf8'); } catch (_) { return null; } }

function walk(dir, out, root) {
  let entries = [];
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (_) { return out; }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) { if (!SKIP_DIRS.has(e.name)) walk(full, out, root); continue; }
    if (CODE_EXT.test(e.name) && !TEST_FILE.test(e.name)) out.push(path.relative(root, full).split(path.sep).join('/'));
  }
  return out;
}

function inServiceLayer(rel, serviceDirs) {
  return serviceDirs.some(d => rel === d || rel.startsWith(d.replace(/\/+$/, '') + '/'));
}

/** Scan code: provider call sites, service-layer evidence. */
function scanCode(root, serviceDirs) {
  const files = walk(root, [], root);
  const calls = [];            // { file, provider, line, in_service_layer }
  const serviceFiles = [];     // files under the service layer
  let schemaValidationSeen = false;
  let thresholdSeen = false;
  const actionImports = [];    // { file, line, text }
  for (const rel of files) {
    const text = readText(path.join(root, rel));
    if (text == null) continue;
    const lines = text.split(/\r?\n/);
    const isService = inServiceLayer(rel, serviceDirs);
    if (isService) serviceFiles.push(rel);
    if (THRESHOLD_IN_CODE.test(text)) thresholdSeen = true;
    if (isService && SCHEMA_VALIDATION.test(text)) schemaValidationSeen = true;
    lines.forEach((l, i) => {
      if (ALLOW_MARKER.test(l)) return;
      for (const p of PROVIDER_PATTERNS) {
        if (p.re.test(l)) { calls.push({ file: rel, provider: p.id, line: i + 1, in_service_layer: isService }); break; }
      }
      if (isService && ACTION_IMPORT.test(l)) actionImports.push({ file: rel, line: i + 1, text: l.trim().slice(0, 120) });
    });
  }
  return { files_scanned: files.length, calls, serviceFiles, schemaValidationSeen, thresholdSeen, actionImports };
}

/** Parse docs/AI_DECISIONS.md into records (one per `Feature:` block). */
function parseRecords(text) {
  if (!text) return [];
  const lines = text.split(/\r?\n/);
  const records = [];
  let cur = null, curField = null;
  const flush = () => { if (cur) records.push(cur); cur = null; curField = null; };
  lines.forEach((raw, i) => {
    const m = raw.match(FIELD_LINE);
    if (m) {
      const key = m[1].toLowerCase();
      if (key === 'feature') { flush(); cur = { line: i + 1, fields: {} }; }
      if (!cur) return;
      cur.fields[key] = (m[2] || '').trim();
      curField = key;
      return;
    }
    if (!cur) return;
    if (/^\s*#{1,6}\s/.test(raw)) { flush(); return; }
    if (/^\s*(?:---|```)/.test(raw)) return;
    if (curField && raw.trim() && !cur.fields[curField]) cur.fields[curField] = raw.trim();
  });
  flush();
  return records.map(r => {
    const f = r.fields;
    const missing = RECORD_FIELDS.filter(k => !f[k] || PLACEHOLDER_VALUE.test(f[k]));
    const dtype = (f['decision type'] || '').toLowerCase();
    const decision_type = /determin/.test(dtype) ? 'deterministic' : /classif|scor|rout/.test(dtype) ? 'classification'
      : /vision|image|multimodal/.test(dtype) ? 'vision' : /reason|generat/.test(dtype) ? 'reasoning' : null;
    const model = (f['selected model'] || '').toLowerCase();
    const model_kind = /^\s*(?:code|deterministic|rule)/.test(model) ? 'code'
      : /\bllm\b|claude|gpt|gemini|sonnet|opus|haiku|fable/.test(model) ? 'llm'
        : /jev|clef|decision/.test(model) ? 'decision-model' : 'other';
    const needs_confidence = decision_type === 'classification' || decision_type === 'vision'
      || /^\s*(?:yes|y|required|필요|true)/i.test(f['confidence'] || '');
    return { line: r.line, feature: f['feature'] || '', decision_type, model_kind, needs_confidence,
      has_rationale: !!(f['rationale'] && !PLACEHOLDER_VALUE.test(f['rationale'])), missing, fields: f };
  });
}

function evaluate(root, opts = {}) {
  const serviceDirs = (opts.serviceDirs && opts.serviceDirs.length) ? opts.serviceDirs : DEFAULT_SERVICE_DIRS;
  const recordsPath = opts.records || DEFAULT_RECORDS;
  const code = scanCode(root, serviceDirs);
  const records = parseRecords(readText(path.join(root, recordsPath)));
  const findings = [];
  const add = (rule, where, detail) => findings.push({ rule, where, detail });

  const aiPresent = code.calls.length > 0;
  if (!aiPresent && records.length === 0) {
    return { status: 'NOT_APPLICABLE', reason: 'no AI provider call and no AI decision record found — gate not applicable',
      root, records_path: recordsPath, service_dirs: serviceDirs, files_scanned: code.files_scanned, calls: [], records: [], findings };
  }

  for (const c of code.calls) if (!c.in_service_layer)
    add('ai-call-outside-service-layer', `${c.file}:${c.line}`, `${c.provider} call outside ${serviceDirs.join('|')} (§15/§16)`);
  for (const a of code.actionImports)
    add('ai-service-executes-action', `${a.file}:${a.line}`, 'AI service imports a DB/payment/mail client — return a structured result, let Application Code act (§3)');
  if (aiPresent && !code.schemaValidationSeen)
    add('no-schema-validation', serviceDirs.join('|'), 'no schema validation (zod/ajv/pydantic/json_schema/output_config…) in the AI service layer (§4)');
  if (aiPresent && records.length === 0)
    add('no-architecture-decision-record', recordsPath, 'AI calls exist but no Architecture Decision record (10 fields, §14)');

  let anyNeedsConfidence = false;
  records.forEach((r, i) => {
    const where = `${recordsPath}:${r.line}`;
    if (r.missing.length) add('record-incomplete', where, `record #${i + 1} "${r.feature || '?'}" missing/placeholder: ${r.missing.join(', ')} (§14)`);
    if (!r.decision_type) add('record-invalid-decision-type', where, 'Decision type must be Deterministic / Classification / Reasoning / Vision (§13)');
    if (r.decision_type === 'deterministic' && r.model_kind !== 'code')
      add('deterministic-not-code', where, `Deterministic decision selected "${r.fields['selected model']}" — code decides deterministic rules (§9/§10)`);
    if ((r.decision_type === 'classification' || r.decision_type === 'vision') && r.model_kind === 'llm' && !r.has_rationale)
      add('llm-for-bounded-decision', where, `bounded ${r.decision_type} decided by an LLM with no Rationale: line — explain why a Decision Model is unsuitable first (§6/§18)`);
    if (r.needs_confidence) anyNeedsConfidence = true;
  });
  if (anyNeedsConfidence && !code.thresholdSeen)
    add('threshold-not-in-code', '(code)', 'a record needs confidence but no numeric threshold constant/comparison exists in code — thresholds are Application Code business rules, not AI output (§5)');

  return { status: findings.length ? 'FAIL' : 'PASS', root, records_path: recordsPath, service_dirs: serviceDirs,
    files_scanned: code.files_scanned, calls: code.calls,
    records: records.map(r => ({ line: r.line, feature: r.feature, decision_type: r.decision_type, model_kind: r.model_kind })),
    findings };
}

function main(argv) {
  const args = argv.slice(2);
  const get = f => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined; };
  const json = args.includes('--json');
  const positional = args.filter((a, i) => !a.startsWith('--') && !['--records', '--service-dirs'].includes(args[i - 1]));
  const root = path.resolve(positional[0] || process.cwd());
  if (!fs.existsSync(root)) { console.error(`usage: ai-arch-check.js [root] [--records FILE] [--service-dirs a,b] [--json]  (root not found: ${root})`); return 2; }
  const serviceDirs = get('--service-dirs') ? get('--service-dirs').split(',').map(s => s.trim()).filter(Boolean) : undefined;
  const r = evaluate(root, { records: get('--records'), serviceDirs });
  if (json) console.log(JSON.stringify(r, null, 2));
  else if (r.status === 'NOT_APPLICABLE') console.log(`○ ai-arch-check: NOT_APPLICABLE — ${r.reason} (${r.files_scanned} file(s))`);
  else if (r.status === 'FAIL') {
    console.error(`✗ ai-arch-check: FAIL — ${r.findings.length} finding(s) (${r.calls.length} AI call site(s), ${r.records.length} record(s))`);
    for (const f of r.findings) console.error(`  [${f.rule}] ${f.where} — ${f.detail}`);
    console.error('  Driving doc: knowledge_base/00_AI_ARCHITECTURE_PRINCIPLES.md');
  } else console.log(`✔ ai-arch-check: PASS — ${r.calls.length} AI call site(s) in the service layer, ${r.records.length} decision record(s), ${r.files_scanned} file(s)`);
  return r.status === 'FAIL' ? 1 : 0;
}

if (require.main === module) process.exit(main(process.argv));

module.exports = { evaluate, scanCode, parseRecords, main, DEFAULT_SERVICE_DIRS, DEFAULT_RECORDS, PROVIDER_PATTERNS };
