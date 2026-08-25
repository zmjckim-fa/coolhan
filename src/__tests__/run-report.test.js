const fs = require('fs');
const os = require('os');
const path = require('path');
const { collect, renderMarkdown } = require('../../scripts/run-report');

describe('run-report (G12 — run observability aggregation)', () => {
  let ws;
  beforeEach(() => { ws = fs.mkdtempSync(path.join(os.tmpdir(), 'run-report-')); });
  afterEach(() => { fs.rmSync(ws, { recursive: true, force: true }); });

  const BACKLOG_PARTIAL = '| # | Unit | Files | Verification | Status |\n|---|---|---|---|---|\n| U1 | a | f | jest 3/3 | done ✅ |\n| U2 | b | f | jest | todo |\n';
  const BACKLOG_DONE = '| # | Unit | Files | Verification | Status |\n|---|---|---|---|---|\n| U1 | a | f | jest 3/3 pass | done ✅ |\n';

  test('empty workspace → honest "nothing recorded" report, exit-worthy 0 shape', () => {
    const r = collect(ws, null);
    expect(r.sections.backlog).toBeNull();
    expect(r.sections.gates.entries).toBe(0);
    const md = renderMarkdown(r);
    expect(md).toContain('not proof of completion');
  });

  test('backlog completion reflected (partial vs complete)', () => {
    fs.writeFileSync(path.join(ws, '_backlog.md'), BACKLOG_PARTIAL);
    let r = collect(ws, null);
    expect(r.sections.backlog.complete).toBe(false);
    expect(r.sections.backlog.remaining).toEqual(['U2']);
    fs.writeFileSync(path.join(ws, '_backlog.md'), BACKLOG_DONE);
    r = collect(ws, null);
    expect(r.sections.backlog.complete).toBe(true);
  });

  test('ledger entries aggregate per gate, filtered by run-id', () => {
    fs.writeFileSync(path.join(ws, '_ledger.jsonl'),
      '{"run_id":"r1","unit":"U1","gate":"G1-exec","status":"PASS","reason":"ok"}\n' +
      '{"run_id":"r1","unit":"U1","gate":"G10-agent-loop","status":"FAIL","reason":"ITERATE at 1"}\n' +
      '{"run_id":"r2","unit":"U9","gate":"G1-exec","status":"FAIL","reason":"other run"}\n');
    const r = collect(ws, 'r1');
    expect(r.sections.gates.entries).toBe(2);
    expect(r.sections.gates.by_gate['G1-exec'].PASS).toBe(1);
    expect(r.sections.gates.by_gate['G10-agent-loop'].FAIL).toBe(1);
    expect(r.sections.gates.by_gate['G1-exec'].FAIL).toBe(0); // r2 excluded
  });

  test('recurring lessons surface (same gate+reason ≥2×)', () => {
    fs.writeFileSync(path.join(ws, '_ledger.jsonl'),
      '{"run_id":"r1","unit":"U1","gate":"G2-trace","status":"FAIL","reason":"uncovered requirement"}\n' +
      '{"run_id":"r1","unit":"U2","gate":"G2-trace","status":"FAIL","reason":"uncovered requirement"}\n');
    const r = collect(ws, null);
    expect(r.sections.lessons).toHaveLength(1);
    expect(r.sections.lessons[0]).toMatchObject({ gate: 'G2-trace', count: 2 });
  });

  test('loop state summarized: iterations, escalations, last failure tail', () => {
    fs.writeFileSync(path.join(ws, '_loop-state.json'), JSON.stringify({
      units: {
        U1: { status: 'done', iterations: [{ n: 1, passed: true }] },
        U2: {
          status: 'escalated', iterations: [
            { n: 1, passed: false, feedback: { stderr_tail: 'AssertionError A' } },
            { n: 2, passed: false, feedback: { stderr_tail: 'AssertionError B' } }
          ]
        }
      }
    }));
    const r = collect(ws, null);
    const u2 = r.sections.loop.units.find(u => u.unit === 'U2');
    expect(u2.iterations).toBe(2);
    expect(u2.last_feedback).toContain('AssertionError B');
    expect(r.sections.loop.escalated).toEqual(['U2']);
    expect(renderMarkdown(r)).toContain('ESCALATED');
  });

  test('markdown renders gate table and honest bound', () => {
    fs.writeFileSync(path.join(ws, '_ledger.jsonl'),
      '{"run_id":"r1","unit":"U1","gate":"G1-exec","status":"PASS","reason":"ok"}\n');
    fs.writeFileSync(path.join(ws, '_backlog.md'), BACKLOG_DONE);
    const md = renderMarkdown(collect(ws, null));
    expect(md).toContain('| G1-exec | 1 | 0 | 0 |');
    expect(md).toContain('complete: ✅ yes');
    expect(md).toContain('Honest bound');
  });
});
