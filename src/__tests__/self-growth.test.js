const fs = require('fs');
const os = require('os');
const path = require('path');
const { fromLedger, fromDecisions, fromRunReports, fromProposals, fromSites, evaluate, render } = require('../../scripts/self-growth');

function tmp() { return fs.mkdtempSync(path.join(os.tmpdir(), 'sg-')); }

describe('self-growth (G17 — self-developing engine)', () => {
  test('ledger: recurring FAIL (gate,reason) ≥2 becomes a candidate; single occurrence does not', () => {
    const d = tmp(); const ws = path.join(d, '_workspace'); fs.mkdirSync(ws, { recursive: true });
    fs.writeFileSync(path.join(ws, '_ledger.jsonl'),
      '{"run_id":"r","unit":"U1","gate":"G2-trace","status":"FAIL","reason":"uncovered requirement"}\n' +
      '{"run_id":"r","unit":"U2","gate":"G2-trace","status":"FAIL","reason":"uncovered requirement"}\n' +
      '{"run_id":"r","unit":"U3","gate":"G4-regress","status":"FAIL","reason":"one-off"}\n' +
      '{"run_id":"r","unit":"U4","gate":"G2-trace","status":"PASS","reason":"ok"}\n');
    const items = fromLedger(ws);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ source: 'ledger', gate: 'G2-trace' });
    expect(items[0].evidence).toBe('2× FAIL');
    fs.rmSync(d, { recursive: true, force: true });
  });

  test('decisions: deferred/later lines surface', () => {
    const d = tmp(); fs.mkdirSync(path.join(d, 'docs'), { recursive: true });
    fs.writeFileSync(path.join(d, 'docs', 'DECISIONS.md'),
      '## X\n**Decision:** deferred to a later track\n**Reversible:** yes — do it later\nplain line\n');
    const items = fromDecisions(d);
    expect(items.length).toBeGreaterThanOrEqual(1);
    expect(items[0].source).toBe('decisions');
    fs.rmSync(d, { recursive: true, force: true });
  });

  test('run-report: escalation and unvalidated units surface as high priority', () => {
    const d = tmp(); const ws = path.join(d, '_workspace'); fs.mkdirSync(ws, { recursive: true });
    fs.writeFileSync(path.join(ws, 'run-report.md'), '- ⚠️ ESCALATED (human decision pending): U2\n- done-but-unvalidated: U5\n');
    const items = fromRunReports(ws);
    expect(items.map(i => i.priority)).toEqual(['high', 'high']);
    fs.rmSync(d, { recursive: true, force: true });
  });

  test('proposals: pending rows surface; header row ignored', () => {
    const d = tmp(); const ws = path.join(d, '_workspace'); fs.mkdirSync(ws, { recursive: true });
    fs.writeFileSync(path.join(ws, '_proposals.md'), '| id | what |\n|---|---|\n| P1 | cheaper query |\n');
    const items = fromProposals(ws);
    expect(items).toHaveLength(1);
    expect(items[0].candidate).toMatch(/cheaper query/);
    fs.rmSync(d, { recursive: true, force: true });
  });

  test('sites: applied-project verdict with blocking rows becomes a gap candidate', () => {
    const sites = tmp();
    const ws = path.join(sites, 'coolhanx.com', '_workspace'); fs.mkdirSync(ws, { recursive: true });
    fs.writeFileSync(path.join(ws, 'COMMERCIAL_VERDICT_20260926.md'), '① BLOCKED\n- ❌ FAIL items\n- NOT_RUN design\n');
    const items = fromSites(sites);
    expect(items).toHaveLength(1);
    expect(items[0].source).toBe('site:coolhanx.com');
    expect(items[0].priority).toBe('high'); // 3 blocking rows
    fs.rmSync(sites, { recursive: true, force: true });
  });

  test('no sites dir → no site candidates (honest absence, no crash)', () => {
    expect(fromSites(undefined)).toEqual([]);
    expect(fromSites('/no/such/dir/xyz')).toEqual([]);
  });

  test('evaluate ranks high before medium and reports which sources were present', () => {
    const d = tmp(); const ws = path.join(d, '_workspace'); fs.mkdirSync(ws, { recursive: true });
    fs.mkdirSync(path.join(d, 'docs'), { recursive: true });
    fs.writeFileSync(path.join(ws, 'run-report.md'), '- ⚠️ ESCALATED: U9\n'); // high
    fs.writeFileSync(path.join(d, 'docs', 'DECISIONS.md'), '**Decision:** deferred later\n'); // medium
    const r = evaluate(d, { workspace: ws });
    expect(r.items[0].priority).toBe('high');
    expect(r.sources_scanned.decisions).toBe(true);
    expect(r.sources_scanned.ledger).toBe(false);
    fs.rmSync(d, { recursive: true, force: true });
  });

  test('empty evidence → honest "nothing to mine yet" render, never a false candidate', () => {
    const d = tmp(); fs.mkdirSync(path.join(d, '_workspace'), { recursive: true });
    const r = evaluate(d, { workspace: path.join(d, '_workspace') });
    expect(r.items).toEqual([]);
    expect(render(r)).toMatch(/nothing to mine|clean or not yet accumulated/i);
    fs.rmSync(d, { recursive: true, force: true });
  });
});
