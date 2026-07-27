#!/usr/bin/env node

/**
 * CoolHan no-placeholder-check — Full-Completion Auto-Pilot Mode "no dead ends" gate.
 *
 * A unit marked "implemented"/"verified" must not contain leftover TODO/placeholder/coming-soon
 * markers. This catches the exact failure mode the auto-pilot discipline bans: "declared complete
 * while a button/screen/function is actually a stub."
 *
 * Scans given files/directories for:
 *   TODO, FIXME, XXX, "coming soon", "준비 중", "구현 예정", "not implemented",
 *   `throw new Error('not implemented')`, empty stub markers like `// stub`, `pass  # TODO`
 *
 * Usage: node scripts/no-placeholder-check.js <path...> [--json]
 * Exit: 0 if no marker found; 1 if any found (reported as file:line).
 *
 * Honest bound: this is a textual marker scan, not a semantic check — it cannot catch a
 * silently-broken feature that has no leftover marker. It proves "no known placeholder text
 * remains," not "the feature fully works" (that is G1/G2's job).
 */

const fs = require('fs');
const path = require('path');

const SKIP_DIRS = new Set(['node_modules', '.git', 'coverage', 'dist', 'build',
  '_workspace_prev', '_workspace_prev_temp', '_harness_test']);
const TEXT_EXT = /\.(js|jsx|ts|tsx|py|rb|go|java|php|html|css|vue|svelte)$/i;

const PATTERNS = [
  { id: 'TODO', re: /\bTODO\b/ },
  { id: 'FIXME', re: /\bFIXME\b/ },
  { id: 'XXX-marker', re: /\bXXX\b/ },
  { id: 'coming-soon', re: /coming soon/i },
  { id: 'korean-in-progress', re: /준비\s*중|구현\s*예정/ },
  { id: 'not-implemented', re: /not[\s_-]?implemented/i },
  { id: 'stub-comment', re: /\/\/\s*stub\b|#\s*stub\b/i }
];

function walk(target, out) {
  let stat;
  try { stat = fs.statSync(target); } catch (_) { return; }
  if (stat.isDirectory()) {
    if (SKIP_DIRS.has(path.basename(target))) return;
    for (const f of fs.readdirSync(target)) walk(path.join(target, f), out);
  } else if (TEXT_EXT.test(target)) {
    out.push(target);
  }
}

function scanFile(file) {
  let content;
  try { content = fs.readFileSync(file, 'utf8'); } catch (_) { return []; }
  const findings = [];
  content.split(/\r?\n/).forEach((line, i) => {
    if (line.includes('no-placeholder-check:allow')) return;
    for (const p of PATTERNS) {
      if (p.re.test(line)) { findings.push({ file, line: i + 1, rule: p.id }); return; }
    }
  });
  return findings;
}

function main(argv) {
  const args = argv.slice(2);
  const json = args.includes('--json');
  const targets = args.filter(a => !a.startsWith('--'));
  if (targets.length === 0) { console.error('usage: no-placeholder-check.js <path...> [--json]'); return 2; }

  const files = [];
  targets.forEach(t => walk(t, files));
  const findings = files.flatMap(scanFile);

  if (json) {
    console.log(JSON.stringify({ scanned: files.length, findings }, null, 2));
  } else if (findings.length) {
    console.error(`✗ no-placeholder-check: ${findings.length} marker(s) found`);
    for (const f of findings) console.error(`  ${f.file}:${f.line}  [${f.rule}]`);
    console.error('  Remove the placeholder or add `no-placeholder-check:allow` for an intentional exception.');
  } else {
    console.log(`✔ no-placeholder-check: clean (${files.length} file(s), no TODO/placeholder/coming-soon markers)`);
  }
  return findings.length ? 1 : 0;
}

if (require.main === module) process.exit(main(process.argv));

module.exports = { scanFile, walk, PATTERNS, main };
