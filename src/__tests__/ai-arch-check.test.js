const fs = require('fs');
const os = require('os');
const path = require('path');
const { evaluate, parseRecords, main } = require('../../scripts/ai-arch-check');

function tmp() { return fs.mkdtempSync(path.join(os.tmpdir(), 'aiarch-')); }
function write(root, rel, content) {
  const p = path.join(root, rel); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, content);
}
const GOOD_RECORD = [
  '## Ticket routing', '',
  'Feature: route support tickets to a team',
  'Input: ticket subject + body',
  'Decision type: Classification',
  'Selected model: Jev (DecisionService provider)',
  'Expected output: {"decision":"billing|technical|sales","confidence":0..1}',
  'Confidence: yes',
  'Threshold: >=0.90 auto, 0.70–0.90 extra validation, <0.70 human review',
  'Fallback: LLM analysis then human queue',
  'Human escalation: confidence < 0.70 or refund-related',
  'Final action: Application Code assigns the queue after schema + permission checks', ''
].join('\n');
const SERVICE = [
  "const { z } = require('zod');",
  "const Schema = z.object({ decision: z.enum(['billing','technical','sales']), confidence: z.number() });",
  "async function decide(ctx) { const raw = await fetch('https://api.typesafe.ai/v1/decide', { method: 'POST' }); return Schema.parse(await raw.json()); }",
  'module.exports = { decide };', ''
].join('\n');
const APP = [
  "const { decide } = require('../services/ai/decision.service');",
  'const AUTO_THRESHOLD = 0.9;',
  'async function route(ticket) { const r = await decide(ticket); if (r.confidence >= AUTO_THRESHOLD) return assign(r.decision); return review(r); }',
  'function assign(q) { return q; } function review(r) { return r; } module.exports = { route };', ''
].join('\n');

function goodApp() {
  const d = tmp();
  write(d, 'services/ai/decision.service.js', SERVICE);
  write(d, 'application/route-ticket.js', APP);
  write(d, 'docs/AI_DECISIONS.md', GOOD_RECORD);
  return d;
}

describe('ai-arch-check (G19 — AI agent architecture principles gate)', () => {
  test('compliant app → PASS (call in service layer, schema validation, record complete, threshold in code)', () => {
    const d = goodApp();
    const r = evaluate(d);
    expect(r.status).toBe('PASS');
    expect(r.calls).toHaveLength(1);
    expect(r.calls[0].in_service_layer).toBe(true);
    expect(r.records).toHaveLength(1);
    fs.rmSync(d, { recursive: true, force: true });
  });

  test('no AI usage and no records → NOT_APPLICABLE (never a fabricated PASS or FAIL)', () => {
    const d = tmp();
    write(d, 'src/index.js', "module.exports = () => 'plain app';\n");
    const r = evaluate(d);
    expect(r.status).toBe('NOT_APPLICABLE');
    expect(r.findings).toEqual([]);
    fs.rmSync(d, { recursive: true, force: true });
  });

  test('provider call in domain/business code → ai-call-outside-service-layer', () => {
    const d = goodApp();
    write(d, 'domain/refund.js', "const Anthropic = require('@anthropic-ai/sdk');\nmodule.exports = async () => (await new Anthropic().messages.create({})).content;\n");
    const r = evaluate(d);
    expect(r.status).toBe('FAIL');
    const f = r.findings.filter(x => x.rule === 'ai-call-outside-service-layer');
    expect(f.length).toBeGreaterThanOrEqual(1);
    expect(f[0].where).toMatch(/^domain\/refund\.js:1$/);
    fs.rmSync(d, { recursive: true, force: true });
  });

  test('AI service importing a DB/payment client → ai-service-executes-action (§3)', () => {
    const d = goodApp();
    write(d, 'services/ai/refund.service.js', "const stripe = require('stripe')(process.env.KEY);\n" + SERVICE);
    const r = evaluate(d);
    expect(r.findings.map(f => f.rule)).toContain('ai-service-executes-action');
    fs.rmSync(d, { recursive: true, force: true });
  });

  test('AI calls but no decision record → no-architecture-decision-record; no schema validation → no-schema-validation', () => {
    const d = tmp();
    write(d, 'services/ai/llm.service.js', "const OpenAI = require('openai');\nmodule.exports = async (p) => (await new OpenAI().chat.completions.create({ messages: [p] })).choices[0];\n");
    const r = evaluate(d);
    expect(r.status).toBe('FAIL');
    const rules = r.findings.map(f => f.rule);
    expect(rules).toContain('no-architecture-decision-record');
    expect(rules).toContain('no-schema-validation');
    fs.rmSync(d, { recursive: true, force: true });
  });

  test('record left with template placeholders → record-incomplete naming the fields', () => {
    const d = goodApp();
    write(d, 'docs/AI_DECISIONS.md', GOOD_RECORD.replace('Threshold: >=0.90 auto, 0.70–0.90 extra validation, <0.70 human review', 'Threshold: [기준]').replace('Fallback: LLM analysis then human queue', 'Fallback:'));
    const r = evaluate(d);
    const f = r.findings.find(x => x.rule === 'record-incomplete');
    expect(f).toBeTruthy();
    expect(f.detail).toMatch(/threshold/);
    expect(f.detail).toMatch(/fallback/);
    fs.rmSync(d, { recursive: true, force: true });
  });

  test('Deterministic decision routed to a model → deterministic-not-code (§9/§10)', () => {
    const d = goodApp();
    write(d, 'docs/AI_DECISIONS.md', GOOD_RECORD + '\n' + GOOD_RECORD.replace('Feature: route support tickets to a team', 'Feature: is the order paid?').replace('Decision type: Classification', 'Decision type: Deterministic').replace('Confidence: yes', 'Confidence: no'));
    const r = evaluate(d);
    expect(r.findings.map(f => f.rule)).toContain('deterministic-not-code');
    fs.rmSync(d, { recursive: true, force: true });
  });

  test('bounded classification decided by an LLM: FAIL without Rationale, allowed with Rationale (§6/§18)', () => {
    const d = goodApp();
    const llmRecord = GOOD_RECORD.replace('Selected model: Jev (DecisionService provider)', 'Selected model: LLM (Claude)');
    write(d, 'docs/AI_DECISIONS.md', llmRecord);
    expect(evaluate(d).findings.map(f => f.rule)).toContain('llm-for-bounded-decision');
    write(d, 'docs/AI_DECISIONS.md', llmRecord + 'Rationale: 40 overlapping categories with free-text evidence; Decision Model accuracy measured at 61% on our labeled set\n');
    expect(evaluate(d).findings.map(f => f.rule)).not.toContain('llm-for-bounded-decision');
    fs.rmSync(d, { recursive: true, force: true });
  });

  test('record needs confidence but no numeric threshold in code → threshold-not-in-code (§5)', () => {
    const d = goodApp();
    write(d, 'application/route-ticket.js', "const { decide } = require('../services/ai/decision.service');\nmodule.exports = async (t) => (await decide(t)).decision;\n");
    const r = evaluate(d);
    expect(r.findings.map(f => f.rule)).toContain('threshold-not-in-code');
    fs.rmSync(d, { recursive: true, force: true });
  });

  test('parseRecords: multi-line field values and bold/markdown field labels are accepted', () => {
    const recs = parseRecords([
      '**Feature:** image damage check', 'Input:', '  product photo', '- Decision type: Vision', 'Selected model: Clef',
      'Expected output: {"damaged":bool,"confidence":n}', 'Confidence: required', 'Threshold: 0.85', 'Fallback: human review',
      'Human escalation: yes', 'Final action: code flags the listing'
    ].join('\n'));
    expect(recs).toHaveLength(1);
    expect(recs[0].fields.input).toBe('product photo');
    expect(recs[0].decision_type).toBe('vision');
    expect(recs[0].model_kind).toBe('decision-model');
    expect(recs[0].missing).toEqual([]);
  });

  test('a line marked ai-arch-check:allow is exempt from call detection (quoted example, detector table)', () => {
    const d = goodApp();
    write(d, 'docs/examples.js', "// example: require('openai') — ai-arch-check:allow\nmodule.exports = 1;\n");
    expect(evaluate(d).status).toBe('PASS');
    fs.rmSync(d, { recursive: true, force: true });
  });

  test('main: --service-dirs override is honored and exit codes follow the verdict', () => {
    const d = tmp();
    write(d, 'brains/decision.js', SERVICE);
    write(d, 'app/use.js', APP.replace('../services/ai/decision.service', '../brains/decision'));
    write(d, 'docs/AI_DECISIONS.md', GOOD_RECORD);
    const orig = { log: console.log, error: console.error }; console.log = () => {}; console.error = () => {};
    const failCode = main(['node', 'ai-arch-check.js', d]);                                  // default dirs → call outside layer
    const passCode = main(['node', 'ai-arch-check.js', d, '--service-dirs', 'brains']);     // override → PASS
    console.log = orig.log; console.error = orig.error;
    expect(failCode).toBe(1);
    expect(passCode).toBe(0);
    fs.rmSync(d, { recursive: true, force: true });
  });
});
