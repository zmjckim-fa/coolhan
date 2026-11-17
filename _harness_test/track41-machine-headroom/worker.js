// Track 41 worker. Runs inside a job object whose commit limit applies to this process tree only.
//   node worker.js launch  <hook> <runs> <heldMB>   launch the hook <runs> times while holding <heldMB>
//   node worker.js runnode <hook> <heldMB>          one launch through runNode (the harness retry helper)
//   node worker.js burn <ms>                        occupy one CPU core
const os = require('os');
const { spawnSync } = require('child_process');
const { neverStarted, memoryDenied, runNode } = require('../../scripts/lib/spawn-node');

const [, , mode, a, b, c] = process.argv;
const PROMPT = JSON.stringify({ prompt: 'hello' });
const kindOf = (r) => r.error ? `spawn error ${r.error.code || r.error.message}`
  : `0x${(r.status >>> 0).toString(16)} ${r.stderr ? (String(r.stderr).match(/out of memory|VirtualAlloc failed|Allocation failed/i) || ['other text'])[0] : 'silent'}`;

function hold(mb) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 2500);   // until the parent has assigned this process to the job
  const keep = [];
  try { for (let i = 0; i < Number(mb); i++) keep.push(Buffer.alloc(2 ** 20, 1)); } catch (_) { /* the limit was reached while holding; the count below says how far */ }
  return keep;
}

if (mode === 'burn') {
  const end = Date.now() + Number(a); let x = 0; while (Date.now() < end) x += Math.sqrt(x + 1);
} else if (mode === 'launch') {
  const keep = hold(c);
  const kinds = {}; let ok = 0; let unclassified = 0; let denied = 0;
  for (let i = 0; i < Number(b); i++) {
    const r = spawnSync(process.execPath, [a], { cwd: os.tmpdir(), input: PROMPT, encoding: 'utf8' });
    if (!r.error && r.status === 0) { ok++; continue; }
    kinds[kindOf(r)] = (kinds[kindOf(r)] || 0) + 1;
    if (!neverStarted(r)) unclassified++;
    if (r.error || memoryDenied(r)) denied++;
  }
  process.stdout.write(JSON.stringify({ held: keep.length, ok, failed: Number(b) - ok, unclassified, denied, kinds }));
} else if (mode === 'runnode') {
  const keep = hold(b);
  const notes = []; const orig = console.error; console.error = (m) => notes.push(String(m));
  const r = runNode(a, [], { cwd: os.tmpdir(), input: PROMPT });
  console.error = orig;
  process.stdout.write(JSON.stringify({ held: keep.length, started: !neverStarted(r), kind: r.status === 0 && !r.error ? 'ran' : kindOf(r), retries: notes.length, note_has_memory: notes.every(n => /\d+MB/.test(n)) }));
}
