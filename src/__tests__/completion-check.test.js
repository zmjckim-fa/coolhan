const { evaluate, parseBacklog } = require('../../scripts/completion-check');

const header = '| # | Unit | Files | Verification | Status |\n|---|------|-------|--------------|--------|\n';

describe('completion-check (100%-completion gate)', () => {
  test('every unit done + validated → ok', () => {
    const md = header +
      '| U1 | a | f | pytest pass | ✅ done |\n' +
      '| U2 | b | g | jest pass | ✅ done (5/5) |\n';
    const ev = evaluate(md);
    expect(ev.ok).toBe(true);
    expect(ev.remaining).toHaveLength(0);
    expect(ev.total).toBe(2);
  });

  test('a todo unit → not ok, listed in remaining', () => {
    const md = header +
      '| U1 | a | f | pytest pass | ✅ done |\n' +
      '| U2 | b | g | jest pass | ⬜ todo |\n';
    const ev = evaluate(md);
    expect(ev.ok).toBe(false);
    expect(ev.remaining).toEqual(['U2']);
  });

  test('an in-progress unit → not ok', () => {
    const md = header + '| U1 | a | f | pytest | 🔄 in-progress |\n';
    const ev = evaluate(md);
    expect(ev.ok).toBe(false);
    expect(ev.remaining).toEqual(['U1']);
  });

  test('a done unit with no validation named → not ok (unvalidated)', () => {
    const md = header + '| U1 | a | f |  | ✅ done |\n';
    const ev = evaluate(md);
    expect(ev.ok).toBe(false);
    expect(ev.unvalidated).toEqual(['U1']);
  });

  test('header/separator rows are ignored (only U-rows counted)', () => {
    const md = header + '| U1 | a | f | pytest | ✅ done |\n';
    expect(parseBacklog(md)).toHaveLength(1);
  });

  test('empty backlog (no units) → not ok (nothing proven complete)', () => {
    const ev = evaluate(header);
    expect(ev.ok).toBe(false);
    expect(ev.total).toBe(0);
  });

  test('"complete" wording also counts as done', () => {
    const md = header + '| U1 | a | f | build ok | complete |\n';
    const ev = evaluate(md);
    expect(ev.ok).toBe(true);
  });

  test('mixed: one done+validated, one done-unvalidated, one todo', () => {
    const md = header +
      '| U1 | a | f | pytest | ✅ done |\n' +
      '| U2 | b | g |  | ✅ done |\n' +
      '| U3 | c | h | jest | ⬜ todo |\n';
    const ev = evaluate(md);
    expect(ev.ok).toBe(false);
    expect(ev.remaining).toEqual(['U3']);
    expect(ev.unvalidated).toEqual(['U2']);
  });
});
