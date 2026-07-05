'use strict';
// Build a traceability JSON with test_results derived STRICTLY from exec-runner's real output.
// Usage: node build-trace.js <exec-evidence.json> <out-trace.json> <mode:full|uncovered>
const fs = require('fs');
const [, , execFile, outFile, mode] = process.argv;

const ev = JSON.parse(fs.readFileSync(execFile, 'utf8'));
// Gather all stdout from the test phase.
const testPhase = (ev.results || []).find(r => r.phase === 'test') || {};
const out = (testPhase.stdout_tail || '') + (testPhase.stderr_tail || '');

// Parse machine-readable lines: T-<name>:pass|fail
const results = {};
const re = /^(T-[A-Za-z0-9_-]+):(pass|fail)\s*$/gm;
let m;
while ((m = re.exec(out)) !== null) {
  results[m[1]] = m[2];
}

// Map requirements to their bound test IDs.
const reqBindings = { R1: ['T-add'], R2: ['T-sub'] };

let requirements;
if (mode === 'uncovered') {
  // R2 intentionally left with no bound acceptance test.
  requirements = [
    { id: 'R1', text: 'add(2,3)===5', tests: ['T-add'], code: ['index.js:add'] },
    { id: 'R2', text: 'sub(5,3)===2', tests: [], code: ['index.js:sub'] },
  ];
} else {
  requirements = [
    { id: 'R1', text: 'add(2,3)===5', tests: reqBindings.R1, code: ['index.js:add'] },
    { id: 'R2', text: 'sub(5,3)===2', tests: reqBindings.R2, code: ['index.js:sub'] },
  ];
}

const trace = {
  feature: 'arithmetic (R1 add, R2 sub)',
  _provenance: `test_results parsed from exec-runner output: ${execFile}`,
  requirements,
  test_results: results,
};

fs.writeFileSync(outFile, JSON.stringify(trace, null, 2));
console.log('parsed test_results:', JSON.stringify(results));
console.log('wrote', outFile);
