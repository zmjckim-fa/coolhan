/**
 * CoolHan shared child-process helper (S8 공용 라이브러리).
 *
 * Measured on a loaded machine (track40, D-13): a child node process sometimes never starts. One burst showed
 * 37 spawn errors and 4 children dead at start in 1,200 launches; 5,700 further launches showed none. A caller that
 * reads the child's output then sees nothing at all, which is not a result of the script under test.
 *
 * runNode retries only that case: a spawn error, no exit status, or a non-zero exit with neither stdout nor stderr.
 * A script that ran and failed prints something or exits 0, so its verdict is never retried or hidden. Every retry is
 * reported on stderr.
 */

const { spawnSync } = require('child_process');
const { t } = require('../messages');

const neverStarted = (r) => !!r.error || r.status === null || (r.status !== 0 && !r.stdout && !r.stderr);

function runNode(script, args = [], opts = {}) {
  const { retries = 2, ...rest } = opts;
  let r;
  for (let attempt = 0; ; attempt++) {
    r = spawnSync(process.execPath, [script, ...args], { encoding: 'utf8', ...rest });
    if (!neverStarted(r) || attempt >= retries) return r;
    console.error(t('spawn.retry', { script, attempt: attempt + 1, reason: r.error ? r.error.code || r.error.message : `exit ${r.status}` }));
  }
}

module.exports = { runNode, neverStarted };
