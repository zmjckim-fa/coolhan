/**
 * CoolHan shared child-process helper (S8 공용 라이브러리).
 *
 * Measured on a loaded machine (track40, D-13): a child node process sometimes never starts. One burst showed
 * 37 spawn errors and 4 children dead at start in 1,200 launches; 5,700 further launches showed none. A caller that
 * reads the child's output then sees nothing at all, which is not a result of the script under test.
 *
 * Cause, reproduced in isolation (track41: the hook launched inside a job object whose commit limit shrinks): a child
 * that cannot get memory dies before its first line runs. With about 48MB left it starts; below that it ends as a V8
 * fatal «out of memory» (0x80000003 or 0xC0000409, text on stderr), then «VirtualAlloc failed», then silently with
 * 0xC000012D (commit limit), 0xC0000017 (no memory) or 0xC000009A (insufficient resources), and finally the launch itself fails (spawn error UNKNOWN).
 *
 * runNode retries only a child that never started: a spawn error, no exit status, a non-zero exit with neither
 * stdout nor stderr, or one of the memory signatures above with nothing on stdout. A script that ran and failed
 * prints its result, so its verdict is never retried or hidden. Every retry is reported on stderr.
 */

const os = require('os');
const { spawnSync } = require('child_process');
const { t } = require('../messages');

const NO_MEMORY_STATUS = new Set([0xC000012D, 0xC0000017, 0xC000009A]);   // STATUS_COMMITMENT_LIMIT, STATUS_NO_MEMORY, STATUS_INSUFFICIENT_RESOURCES
const NO_MEMORY_TEXT = /out of memory|VirtualAlloc failed|Allocation failed|Cannot allocate memory/i;

/** The process was refused memory before it could do its work (signatures measured in track41). */
const memoryDenied = (r) => typeof r.status === 'number' && r.status !== 0
  && (NO_MEMORY_STATUS.has(r.status >>> 0) || (!r.stdout && NO_MEMORY_TEXT.test(String(r.stderr || ''))));

const neverStarted = (r) => !!r.error || r.status === null || (r.status !== 0 && !r.stdout && !r.stderr) || memoryDenied(r);

function runNode(script, args = [], opts = {}) {
  const { retries = 2, ...rest } = opts;
  let r;
  for (let attempt = 0; ; attempt++) {
    r = spawnSync(process.execPath, [script, ...args], { encoding: 'utf8', ...rest });
    if (!neverStarted(r) || attempt >= retries) return r;
    console.error(t('spawn.retry', { script, attempt: attempt + 1, reason: r.error ? r.error.code || r.error.message : `exit ${r.status}`, freeMb: Math.round(os.freemem() / 2 ** 20) }));
  }
}

module.exports = { runNode, neverStarted, memoryDenied };
