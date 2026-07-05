'use strict';
// Acceptance test runner. One test per requirement, bound to stable test IDs.
// Emits machine-readable `T-<id>:pass|fail` lines and exits nonzero if any fail.
const { add, sub } = require('./index');

const cases = [
  { test: 'T-add', requirement: 'R1', fn: () => add(2, 3) === 5 },   // R1: add(2,3)===5
  { test: 'T-sub', requirement: 'R2', fn: () => sub(5, 3) === 2 },   // R2: sub(5,3)===2
];

let anyFail = false;
for (const c of cases) {
  let ok = false;
  try { ok = !!c.fn(); } catch (e) { ok = false; }
  if (!ok) anyFail = true;
  console.log(`${c.test}:${ok ? 'pass' : 'fail'}`);
}
process.exit(anyFail ? 1 : 0);
