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

module.exports = { listFiles };
