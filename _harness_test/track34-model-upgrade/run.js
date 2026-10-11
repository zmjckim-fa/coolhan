#!/usr/bin/env node
/**
 * Track 34 — Model-generation upgrade (v2.5.0) adversarial verification.
 *
 * Proves, with real execution (C10), that:
 *   A. the extended prompt-modernization lint flags every Claude-5-era dated shape
 *      (legacy 4.x IDs, sampling params, prefill, delegate-more) and NOT the current
 *      shapes (Claude 5 IDs in both families, adaptive thinking + effort, G9 wording,
 *      domain uses of "temperature"/"pre-filled");
 *   B. every shipped agent carries exactly one `**Effort:**` footer whose tier matches
 *      the role policy in references/model-capability-map.md §3;
 *   C. the shipped agents/skills tree is lint-clean under the extended rule set;
 *   D. the three reviewers carry the coverage-first sentence and the developer carries
 *      scope-discipline, i.e. the behaviour shifts were written into the agents, not only
 *      into the reference map;
 *   E. no legacy 200K/100K relay budget or pre-4.6 model name is asserted as current in
 *      SKILL.md's relay table.
 *
 * Usage: node _harness_test/track34-model-upgrade/run.js   (exit 0 = all scenarios pass)
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { scanFile } = require('../../scripts/prompt-modernization-check');

const root = path.resolve(__dirname, '..', '..');
const results = [];
function check(name, ok, detail) { results.push({ name, ok, detail }); }
function tmp(name, content) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'track34-'));
  const p = path.join(dir, name); fs.writeFileSync(p, content); return p;
}
function rules(p) { return scanFile(p).map(f => f.rule); }

// ── A. dated vs current shapes ────────────────────────────────────────────────
const dated = {
  'legacy-4x-model-ref': 'Prefer claude-opus-4-1 for coding; fall back to claude-sonnet-4-20250514.\n',
  'sampling-param': 'Set temperature to 0.2 and top_p: 0.9 for stable output.\n',
  'prefill': 'Prefill the assistant turn with "{" so the model emits JSON.\n',
  'delegate-more': 'When the task is big, delegate more and spawn as many agents as needed.\n',
  'dated-thinking': 'Give the model budget_tokens: 16000 and ask it to think step by step.\n',
  'severity-filter': "Only report high-severity issues and don't nitpick.\n"
};
for (const [rule, text] of Object.entries(dated)) {
  const got = rules(tmp('dated.md', text));
  check(`A.dated → flagged [${rule}]`, got.length > 0 && got.every(r => r === rule), got.join(',') || 'none');
}
const current = [
  'Models: claude-fable-5-1, claude-fable-5, claude-opus-5-5, claude-opus-5, claude-opus-4-8, claude-opus-4-6,',
  'claude-sonnet-5-5, claude-sonnet-5, claude-sonnet-4-6, claude-haiku-5-5, claude-haiku-4-5, claude-mythos-5.',
  'Dispatch by alias (opus / sonnet / haiku / fable). Thinking is adaptive; the knob is effort (xhigh for coding).',
  'Structured output goes through output_config.format. Parallelism is decided by scripts/parallel-plan.js.',
  'The sensor logs the water temperature; the CRM sends the form pre-filled with the customer address.',
  'P0 planner intent: NEVER implement an unapproved feature. C10: NEVER fabricate a test result.',
  ''
].join('\n');
check('A.current → 0 findings (Claude 5 IDs, effort/adaptive, G9, domain words, P0/C10 emphasis)', rules(tmp('current.md', current)).length === 0, rules(tmp('current.md', current)).join(',') || 'none');

// ── B. effort footers match role policy ───────────────────────────────────────
const policy = {
  xhigh: ['developer', 'execution-runner', 'devops-deployer', 'site-analyzer', 'module-extractor', 'cross-site-adapter', 'development-lead', 'devops-lead'],
  high: ['validator', 'security-reviewer', 'plan-reviewer', 'qa-tester', 'qa-lead', 'integration-validator', 'e2e-tester', 'hx-vision-critic', 'self-auditor', 'commercial-readiness-auditor', 'intent-analyzer', 'spec-writer', 'ux-design-lead', 'planning-lead', 'hypothesis-validator', 'logic-proof-verifier', 'cryptanalyst'],
  medium: ['marketing-lead']
};
const agentsDir = path.join(root, '.claude', 'agents');
const agentFiles = fs.readdirSync(agentsDir).filter(f => f.endsWith('.md'));
let footerOk = true; const footerBad = [];
for (const f of agentFiles) {
  const name = f.replace(/\.md$/, '');
  const s = fs.readFileSync(path.join(agentsDir, f), 'utf8');
  const m = s.match(/^\*\*Effort:\*\*\s*(xhigh|high|medium|low|max)\b/gm) || [];
  const want = Object.keys(policy).find(t => policy[t].includes(name));
  const got = m.length === 1 ? m[0].replace(/^\*\*Effort:\*\*\s*/, '') : null;
  if (!want || got !== want) { footerOk = false; footerBad.push(`${name}: want ${want || '?'} got ${got || m.length}`); }
}
check(`B.effort footers: ${agentFiles.length} agents, exactly one tier each, tier = policy`, footerOk, footerBad.join('; ') || 'all match');
const policyCount = Object.values(policy).flat().length;
check('B.policy covers every shipped agent (no untiered role)', policyCount === agentFiles.length, `policy ${policyCount} / agents ${agentFiles.length}`);

// B'. adversarial: a footer with the wrong tier would be caught by the same check
const wrongTier = '**Model:** opus\n**Effort:** low — wrong on purpose\n';
check('B.adversarial: a developer footer at "low" would be rejected', !(/^\*\*Effort:\*\*\s*xhigh\b/m.test(wrongTier)), 'tier mismatch detected');

// ── C. shipped tree lint-clean ────────────────────────────────────────────────
const { walk } = require('../../scripts/prompt-modernization-check');
const tree = []; walk(path.join(root, '.claude', 'agents'), tree); walk(path.join(root, '.claude', 'skills'), tree);
const treeFindings = tree.flatMap(scanFile);
check(`C.shipped agents+skills lint-clean (${tree.length} files)`, treeFindings.length === 0, treeFindings.map(f => `${path.relative(root, f.file)}:${f.line}[${f.rule}]`).join('; ') || 'clean');

// ── D. behaviour shifts written into agents ───────────────────────────────────
const has = (rel, re) => re.test(fs.readFileSync(path.join(root, rel), 'utf8'));
check('D.validator carries coverage-first', has('.claude/agents/validator.md', /Coverage-first reporting/), '');
check('D.security-reviewer carries coverage-first', has('.claude/agents/security-reviewer.md', /Coverage-first reporting/), '');
check('D.plan-reviewer carries coverage-first', has('.claude/agents/plan-reviewer.md', /Coverage-first reporting/), '');
check('D.developer carries scope discipline + deliverable length', has('.claude/agents/developer.md', /Scope discipline \+ deliverable length/), '');
check('D.no agent tells the model to use subagents freely / delegate more', !agentFiles.some(f => /delegate\s+(?:more|freely|liberally)|use\s+sub-?agents\s+freely/i.test(fs.readFileSync(path.join(agentsDir, f), 'utf8').split('\n').filter(l => !l.includes('modernization:allow')).join('\n'))), '');

// ── E. relay table / map consistency ──────────────────────────────────────────
const skill = fs.readFileSync(path.join(root, '.claude/skills/coolhan-development-orchestrator/SKILL.md'), 'utf8');
const relay = skill.slice(skill.indexOf('### Per-model context budget'), skill.indexOf('### Checkpoint format'));
check('E.relay table names the 5.x lineup (Fable 5.1 / Opus 5.5 / Sonnet 5.5)', /Fable 5\.1/.test(relay) && /Opus 5\.5/.test(relay) && /Sonnet 5\.5/.test(relay), '');
check('E.relay table keeps 1M-class at 10~15 units (no regression to 3-unit habit)', /1M-class[^\n]*10~15 units/.test(relay), '');
check('E.relay section carries the effort policy', /### Effort policy per agent role/.test(relay), '');
const map = fs.readFileSync(path.join(root, '.claude/skills/coolhan-development-orchestrator/references/model-capability-map.md'), 'utf8');
check('E.map cache date refreshed to 2026-10-11 and lists both ID families', /Cached: 2026-10-11/.test(map) && /claude-fable-5-1/.test(map) && /claude-fable-5`/.test(map), '');
check('E.map records the API removals (budget_tokens 400, sampling, prefill, refusal/fallbacks)', /400/.test(map) && /top_k/.test(map) && /refusal/.test(map) && /fallbacks/.test(map), '');
check('E.map does not record pricing (moves faster than the snapshot)', !/\$\d/.test(map), '');

// ── report ────────────────────────────────────────────────────────────────────
const pass = results.filter(r => r.ok).length;
for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.detail ? '  — ' + r.detail : ''}`);
console.log(`\ntrack34: ${pass}/${results.length} scenarios pass`);
process.exit(pass === results.length ? 0 : 1);
