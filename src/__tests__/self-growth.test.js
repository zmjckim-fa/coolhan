const fs = require('fs');
const os = require('os');
const path = require('path');
const { fromLedger, fromDecisions, fromRunReports, fromProposals, fromLearned, fromSites, evaluate, render } = require('../../scripts/self-growth');

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

  test('decisions: a real deferral in a Decision/Update line surfaces; template + Reversible noise does not (v2.4.1 precision)', () => {
    const d = tmp(); fs.mkdirSync(path.join(d, 'docs'), { recursive: true });
    fs.writeFileSync(path.join(d, 'docs', 'DECISIONS.md'), [
      '## Format',
      '**Reversible:** yes/no — how to change it later if wrong',   // template line — must NOT flag
      '## Real',
      '**Decision:** Ship (a) now. Defer (b) to a dedicated track', // real deferral — MUST flag
      '**Reversible:** yes — (b) can be run later',                 // reversible field, not actionable — must NOT flag
      '**Update:** the prompt re-tune is deferred to track22',      // actionable deferral — MUST flag
      'plain prose mentioning later but no field',                  // no actionable field — must NOT flag
      ''
    ].join('\n'));
    const items = fromDecisions(d);
    expect(items).toHaveLength(2);
    expect(items[0].candidate).toMatch(/Defer \(b\)/);
    expect(items[1].candidate).toMatch(/track22/);
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

  test('learned (G18): repeated imperative directives, incident load and security lines become candidates; sparse data does not', () => {
    const d = tmp(); const dir = path.join(d, '.coolhan-private', 'learned'); fs.mkdirSync(dir, { recursive: true });
    const m = (i, themes, imperative) => JSON.stringify({ id: String(i), themes, imperative, text: 'x' });
    const rows = [];
    for (let i = 0; i < 20; i++) rows.push(m(i, ['verify-before-done'], true));
    for (let i = 20; i < 24; i++) rows.push(m(i, ['brevity'], true));            // below threshold
    fs.writeFileSync(path.join(dir, 'human-messages.jsonl'), rows.join('\n') + '\n');
    const lessons = [];
    for (let i = 0; i < 6; i++) lessons.push(JSON.stringify({ id: 'i' + i, kind: 'incident', project: 'P1', text: 't' }));
    lessons.push(JSON.stringify({ id: 's1', kind: 'security', project: 'P1', text: 't' }));
    fs.writeFileSync(path.join(dir, 'lessons.jsonl'), lessons.join('\n') + '\n');
    const items = fromLearned(d);
    expect(items.some((x) => /verify-before-done/.test(x.candidate))).toBe(true);
    expect(items.some((x) => /brevity/.test(x.candidate))).toBe(false);
    expect(items.some((x) => /6 incident/.test(x.evidence))).toBe(true);
    expect(items.some((x) => /security lines/.test(x.evidence))).toBe(true);
    expect(evaluate(d, { workspace: path.join(d, '_workspace') }).sources_scanned.learned).toBe(true);
    expect(fromLearned(tmp())).toEqual([]);
    fs.rmSync(d, { recursive: true, force: true });
  });
});
