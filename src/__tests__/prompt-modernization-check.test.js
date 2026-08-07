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
});
