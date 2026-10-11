const fs = require('fs');
const os = require('os');
const path = require('path');
const { scanFile } = require('../../scripts/prompt-modernization-check');

describe('prompt-modernization-check (dated prompting pattern lint)', () => {
  let dir;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'prompt-modern-test-'));
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  function write(name, content) {
    const p = path.join(dir, name);
    fs.writeFileSync(p, content);
    return p;
  }

  test('clean modern agent text → no findings', () => {
    const p = write('agent.md', 'Use the search tool when the answer depends on fresh data.\nReport every finding with confidence and severity.\n');
    expect(scanFile(p)).toHaveLength(0);
  });

  test('ALL-CAPS pressure language is flagged', () => {
    const p = write('agent.md', 'CRITICAL: You MUST use this tool for every request.\n');
    const f = scanFile(p);
    expect(f).toHaveLength(1);
    expect(f[0].rule).toBe('pressure-language');
    expect(f[0].line).toBe(1);
  });

  test('pressure language on a P0 line is exempt', () => {
    const p = write('agent.md', 'P0 hard-fail is NEVER subject to debate.\n');
    expect(scanFile(p)).toHaveLength(0);
  });

  test('pressure language on a C10 line is exempt', () => {
    const p = write('agent.md', 'C10 no-simulation: NEVER fabricate a test result.\n');
    expect(scanFile(p)).toHaveLength(0);
  });

  test('lowercase must/never is not flagged', () => {
    const p = write('agent.md', 'The validator must cite evidence and never assumes a pass.\n');
    expect(scanFile(p)).toHaveLength(0);
  });

  test('stale model reference is flagged', () => {
    const p = write('agent.md', 'Optimized for claude-3-5-sonnet outputs.\n');
    const f = scanFile(p);
    expect(f).toHaveLength(1);
    expect(f[0].rule).toBe('stale-model-ref');
  });

  test('dated thinking scaffold (budget_tokens / step-by-step) is flagged', () => {
    const p = write('agent.md', 'Set budget_tokens to 8000.\nNow think step by step.\n');
    const rules = scanFile(p).map(f => f.rule);
    expect(rules).toEqual(['dated-thinking', 'dated-thinking']);
  });

  test('over-verification prose is flagged', () => {
    const p = write('agent.md', 'Always double-check your answer before finishing.\n');
    const rules = scanFile(p).map(f => f.rule);
    expect(rules).toContain('over-verification');
  });

  test('severity-filter language is flagged', () => {
    const p = write('agent.md', "Only report high-severity issues and don't nitpick.\n");
    const f = scanFile(p);
    expect(f).toHaveLength(1);
    expect(f[0].rule).toBe('severity-filter');
  });

  test('modernization:allow exempts a line from every rule', () => {
    const p = write('agent.md', 'CRITICAL: MUST — quoted example of the dated pattern <!-- modernization:allow -->\n');
    expect(scanFile(p)).toHaveLength(0);
  });

  // ── v2.5.0 Claude-5-era rule families ──────────────────────────────────────

  test('legacy pre-4.6 4.x model IDs are flagged; 4.6+/haiku-4-5 are not', () => {
    const dated = write('dated.md', 'Tuned for claude-opus-4-1.\nFallback: claude-sonnet-4-20250514.\nOr claude-sonnet-4-5.\n');
    expect(scanFile(dated).map(f => f.rule)).toEqual(['legacy-4x-model-ref', 'legacy-4x-model-ref', 'legacy-4x-model-ref']);
    const current = write('current.md', 'Runs on claude-opus-4-6, claude-opus-4-8, claude-sonnet-4-6 or claude-haiku-4-5.\n');
    expect(scanFile(current)).toHaveLength(0);
  });

  test('current Claude 5 IDs (catalog and session families) are never flagged', () => {
    const p = write('agent.md', [
      'claude-fable-5 / claude-fable-5-1',
      'claude-opus-5 / claude-opus-5-5',
      'claude-sonnet-5 / claude-sonnet-5-5',
      'claude-haiku-5-5 / claude-mythos-5',
      'Dispatch by tier alias: opus / sonnet / haiku / fable.'
    ].join('\n') + '\n');
    expect(scanFile(p)).toHaveLength(0);
  });

  test('sampling-parameter prose (temperature/top_p/top_k) is flagged', () => {
    const p = write('agent.md', 'Set temperature to 0 for deterministic output.\nUse top_p: 0.9 for variety.\nLower the temperature when validating.\n');
    expect(scanFile(p).map(f => f.rule)).toEqual(['sampling-param', 'sampling-param', 'sampling-param']);
  });

  test('ordinary use of the word temperature (domain data) is not flagged', () => {
    const p = write('agent.md', 'The sensor reports the room temperature in Celsius.\nStore temperature readings in the measurements table.\n');
    expect(scanFile(p)).toHaveLength(0);
  });

  test('assistant prefill as an output-shaping technique is flagged', () => {
    const p = write('agent.md', 'Prefill the assistant turn with "{" to force JSON.\nUse a prefilled response for the schema.\n');
    expect(scanFile(p).map(f => f.rule)).toEqual(['prefill', 'prefill']);
  });

  test('domain use of "pre-filled" (an answer sheet, a form) is not flagged as prefill', () => {
    const p = write('agent.md', 'If a pre-filled answer sheet (SCENARIO.md) is provided, treat it as the answer.\nThe form arrives pre-filled from the CRM.\n');
    expect(scanFile(p)).toHaveLength(0);
  });

  test('delegate-more / spawn-many-agents prose is flagged', () => {
    const p = write('agent.md', 'Delegate more to subagents when the task is large.\nSpawn as many agents as needed.\nUse subagents freely.\n');
    expect(scanFile(p).map(f => f.rule)).toEqual(['delegate-more', 'delegate-more', 'delegate-more']);
  });

  test('mechanical parallelism wording (G9) is not flagged as delegate-more', () => {
    const p = write('agent.md', 'Parallelism is decided by scripts/parallel-plan.js: file-disjoint waves only.\nValidation is never parallelized.\n');
    expect(scanFile(p)).toHaveLength(0);
  });

  test('current effort/adaptive-thinking wording is clean', () => {
    const p = write('agent.md', '**Effort:** xhigh — agentic coding role.\nThinking is adaptive; raise effort instead of adding verification scaffolds.\nStructured output uses output_config.format.\n');
    expect(scanFile(p)).toHaveLength(0);
  });

  test('the shipped model-capability-map quotes dated shapes only on allow-marked lines', () => {
    const map = path.join(__dirname, '..', '..', '.claude', 'skills', 'coolhan-development-orchestrator', 'references', 'model-capability-map.md');
    expect(fs.existsSync(map)).toBe(true);
    expect(scanFile(map)).toHaveLength(0);
  });
});
