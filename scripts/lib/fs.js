/**
 * CoolHan shared file-walk helper (S8 공용 라이브러리). New scripts use this instead of a private `walk`;
 * existing scripts keep theirs until touched (§4-d of knowledge_base/00_MINIMAL_SOURCE_PRINCIPLES.md).
 */

const fs = require('fs');
const path = require('path');

/**
 * Files under `target` (a directory, walked recursively, or a single file) whose name matches `ext`.
 * → [{ full, rel }] with `rel` forward-slashed relative to the directory (or the file's basename).
 */
function listFiles(target, { ext = /./, skipDirs = new Set(['node_modules', '.git']) } = {}) {
  let stat; try { stat = fs.statSync(target); } catch (_) { return []; }
  if (stat.isFile()) return ext.test(target) ? [{ full: target, rel: path.basename(target) }] : [];
  const out = [];
  const visit = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) { if (!skipDirs.has(e.name)) visit(full); continue; }
      if (ext.test(e.name)) out.push({ full, rel: path.relative(target, full).split(path.sep).join('/') });
    }
  };
  visit(target);
  return out.sort((a, b) => a.rel.localeCompare(b.rel));
}

/** True when the path exists and is a folder. */
function isDir(p) { try { return fs.statSync(p).isDirectory(); } catch (_) { return false; } }

/** File text, or null when it cannot be read (the caller decides what a missing file means). */
function readText(p) { try { return fs.readFileSync(p, 'utf8'); } catch (_) { return null; } }

/** A synchronous pause (the callers are synchronous command-line runs). */
function sleepMs(ms) { Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms); }

/**
 * Removes a throwaway folder a gate made for its measurement. Answers null when it is gone, the path when it could
 * not be removed. It does not throw: cleaning up never decides a gate's result.
 * Measured on Windows (2026-11-24): right after a process that used the folder ends, the folder can still be held
 * for a moment and the removal fails with EPERM. A database check over the whole library had measured every module,
 * then that exception took the verdict with it. The runtime's own retry option did not retry on this error (a held
 * folder answered in 2ms with maxRetries 10), so the retry is done here.
 */
function removeTree(dir, rm = fs.rmSync, pause = sleepMs, tries = 10) {
  for (let attempt = 1; attempt <= tries; attempt++) {
    try { rm(dir, { recursive: true, force: true }); return null; } catch (_) { if (attempt < tries) pause(300); }
  }
  return dir;
}

module.exports = { listFiles, readText, isDir, removeTree };
