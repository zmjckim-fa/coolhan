#!/usr/bin/env node

/**
 * CoolHan secret-scan — a pre-commit / CI gate that blocks committing secrets.
 *
 * Motivation: the local pre-commit guard only matched .env + a few patterns, so a
 * hardcoded token slipped through and was caught only by GitHub push-protection.
 * This scanner adds common provider token patterns + high-entropy detection.
 *
 * Honesty: a passing scan reduces known risk; it does not prove "no secrets".
 *
 * Usage:
 *   node scripts/secret-scan.js [path ...]     # scan files/dirs (default: git-staged, else cwd)
 *   node scripts/secret-scan.js --staged       # scan only git-staged files
 *   node scripts/secret-scan.js --json
 *
 * Exit code: 1 if any finding, else 0.
 *
 * Allowlist: lines containing `secret-scan:allow` (or under paths in ALLOW_PATHS) are ignored,
 * so intentional test fixtures / documentation examples do not block the gate.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// High-signal named token patterns — applied to ALL text files.
const PATTERNS = [
  { id: 'aws-access-key', re: /\bAKIA[0-9A-Z]{16}\b/ },
  { id: 'github-token', re: /\bgh[pousr]_[A-Za-z0-9]{36,}\b/ },
  { id: 'stripe-key', re: /\bsk_(?:live|test)_[A-Za-z0-9]{16,}\b/ },
  { id: 'slack-token', re: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/ },
  { id: 'google-api-key', re: /\bAIza[0-9A-Za-z_\-]{35}\b/ },
  { id: 'private-key', re: /-----BEGIN (?:RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY-----/ },
  { id: 'jwt', re: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/ }
];
// Generic secret assignment — applied only to CODE/CONFIG files (docs/data have too many examples).
const GENERIC_ASSIGN = /(?:password|passwd|secret|api[_-]?key|token|access[_-]?key)\s*[:=]\s*['"][^'"\s]{8,}['"]/i;

// Directories never scanned (noise / not source).
const SKIP_DIRS = new Set(['node_modules', '.git', 'coverage', 'dist', 'build', '_workspace_prev', '_workspace_prev_temp']);
// Lockfiles / minified: high-entropy hashes, never secrets.
const SKIP_FILE = /(?:package-lock\.json|[-.]lock\.json|\.lock|\.min\.(?:js|css))$/i;
// Paths whose findings are downgraded to allowed (intentional examples/fixtures).
const ALLOW_PATHS = ['_harness_test/', 'src/__tests__/secret-scan.test.js'];
const TEXT_EXT = /\.(js|ts|py|rb|go|java|php|sh|json|ya?ml|md|txt|env|cfg|ini|toml|xml|html|css)$/i;
// Entropy/generic-assignment rules apply only to code/config, not prose/data.
const CODE_EXT = /\.(js|ts|py|rb|go|java|php|sh|env|cfg|ini|toml|ya?ml|xml)$/i;

function shannonEntropy(s) {
  const freq = {};
  for (const ch of s) freq[ch] = (freq[ch] || 0) + 1;
  let e = 0;
  for (const k in freq) {
    const p = freq[k] / s.length;
    e -= p * Math.log2(p);
  }
  return e;
}

// A long, high-entropy token that appears as a VALUE (quoted or after =/:) — not a bare
// identifier like OAuth2PasswordRequestForm. Reduces false positives on code symbols.
function looksHighEntropySecret(line) {
  // Only consider quoted string literals — real hardcoded secrets are quoted values,
  // not bare code identifiers (e.g., OAuth2PasswordRequestForm).
  const quoted = line.match(/['"]([A-Za-z0-9+/_\-]{24,})['"]/g) || [];
  const tokens = quoted.map(v => v.slice(1, -1));
  return tokens.some(t => shannonEntropy(t) >= 4.0 && /[0-9]/.test(t) && /[A-Za-z]/.test(t));
}

function isAllowed(file, line) {
  if (line.includes('secret-scan:allow')) return true;
  const norm = file.replace(/\\/g, '/');
  return ALLOW_PATHS.some(p => norm.includes(p));
}

function scanFile(file) {
  let content;
  try {
    content = fs.readFileSync(file, 'utf8');
  } catch (_) {
    return [];
  }
  const isCode = CODE_EXT.test(file);
  const findings = [];
  content.split(/\r?\n/).forEach((line, i) => {
    if (isAllowed(file, line)) return;
    for (const p of PATTERNS) {
      if (p.re.test(line)) {
        findings.push({ file, line: i + 1, rule: p.id });
        return;
      }
    }
    if (!isCode) return; // generic/entropy rules are code/config only
    if (GENERIC_ASSIGN.test(line)) {
      findings.push({ file, line: i + 1, rule: 'generic-assignment' });
      return;
    }
    if (looksHighEntropySecret(line) && /(?:key|token|secret|password|cred)/i.test(line)) {
      findings.push({ file, line: i + 1, rule: 'high-entropy' });
    }
  });
  return findings;
}

function walk(target, out) {
  let stat;
  try { stat = fs.statSync(target); } catch (_) { return; }
  if (stat.isDirectory()) {
    if (SKIP_DIRS.has(path.basename(target))) return;
    for (const f of fs.readdirSync(target)) walk(path.join(target, f), out);
  } else if (TEXT_EXT.test(target) && !SKIP_FILE.test(target)) {
    out.push(target);
  }
}

function stagedFiles() {
  try {
    return execSync('git diff --cached --name-only --diff-filter=ACM', { encoding: 'utf8' })
      .split('\n').map(s => s.trim()).filter(Boolean).filter(f => TEXT_EXT.test(f) && fs.existsSync(f));
  } catch (_) {
    return [];
  }
}

function collectTargets(args) {
  const paths = args.filter(a => !a.startsWith('--'));
  if (args.includes('--staged')) return stagedFiles();
  if (paths.length) {
    const files = [];
    paths.forEach(p => walk(p, files));
    return files;
  }
  const staged = stagedFiles();
  if (staged.length) return staged;
  const files = [];
  walk(process.cwd(), files);
  return files;
}

function main(argv) {
  const args = argv.slice(2);
  const json = args.includes('--json');
  const files = collectTargets(args);
  const findings = files.flatMap(scanFile);

  if (json) {
    console.log(JSON.stringify({ scanned: files.length, findings }, null, 2));
  } else if (findings.length) {
    console.error(`\x1b[31m✗ secret-scan: ${findings.length} potential secret(s)\x1b[0m`);
    for (const f of findings) console.error(`  ${f.file}:${f.line}  [${f.rule}]`);
    console.error('  Remove the secret or add `secret-scan:allow` for an intentional example.');
    console.error('  Note: a clean scan reduces risk; it does not prove "no secrets".');
  } else {
    console.log(`\x1b[32m✔ secret-scan: no secrets in ${files.length} file(s)\x1b[0m`);
  }
  return findings.length ? 1 : 0;
}

if (require.main === module) {
  process.exit(main(process.argv));
}

module.exports = { scanFile, looksHighEntropySecret, shannonEntropy, PATTERNS, main };
