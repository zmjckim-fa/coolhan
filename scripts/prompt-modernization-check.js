#!/usr/bin/env node

/**
 * CoolHan prompt-modernization-check — keeps agent/skill definitions free of
 * dated prompting patterns written for older Claude generations.
 *
 * Rationale (references/model-capability-map.md §2-4): current models follow
 * instructions literally, self-verify by default, and obey severity filters to
 * the letter. Text written to overcome OLD-model weaknesses now actively
 * degrades behavior: pressure language over-triggers, "double-check" prose
 * causes over-verification, "only report high-severity" depresses reviewer
 * recall, and stale model IDs / thinking-budget scaffolds reference an API
 * surface that no longer exists. The Claude 5 generation additionally removed
 * sampling parameters and assistant prefill from the API, and over-delegates
 * when told to "use subagents freely" — so prose carrying those shapes is
 * flagged too (v2.5.0).
 *
 * Rules (each finding is file:line [rule]):
 *   stale-model-ref       — claude-2 / claude-3.x / claude-instant IDs
 *   legacy-4x-model-ref   — pre-4.6 4.x IDs (opus/sonnet 4-0, 4-1, 4-5, dated -2025MMDD forms)
 *   dated-thinking        — budget_tokens, "think step by step", <scratchpad>
 *   sampling-param        — temperature/top_p/top_k as a request setting or prose instruction
 *   prefill               — assistant-turn prefill as an output-shaping technique
 *   delegate-more         — "delegate more / spawn as many agents / use subagents freely"
 *   pressure-language     — ALL-CAPS MUST/NEVER/ALWAYS/CRITICAL outside a P0/C10 line
 *   over-verification     — "double-check your answer/work", "re-verify before responding"
 *   severity-filter       — "only report high/critical severity", "don't nitpick"
 *
 * Exemptions: a line containing `P0`, `C10`, or `modernization:allow` is exempt
 * from pressure-language (P0 gates are deliberately non-negotiable and keep
 * their emphasis); `modernization:allow` exempts a line from every rule.
 * Current-generation IDs (claude-fable-5[-1], claude-opus-5[-5], claude-opus-4-6/7/8,
 * claude-sonnet-5[-5], claude-sonnet-4-6, claude-haiku-4-5, claude-haiku-5-5) are
 * never flagged — both the catalog and the session ID families are current.
 *
 * Usage: node scripts/prompt-modernization-check.js <path...> [--json]
 * Exit: 0 clean, 1 findings, 2 usage error.
 *
 * Honest bound: a textual lint. A clean pass means "no known dated pattern
 * remains in the prompt text" — not that the prompts are optimal, and not that
 * agent behavior is correct (that stays with the adversarial tracks).
 */

const fs = require('fs');
const path = require('path');

const SKIP_DIRS = new Set(['node_modules', '.git', 'coverage', 'dist', 'build',
  '_workspace_prev', '_workspace_prev_temp', '_harness_test',
  // Vendored third-party companion skills (v2.3.0) — authored upstream, not CoolHan agent/skill
  // prose; treated as third-party (do not hand-edit), so the modernization lint skips them.
  'grill-me', 'codebase-design', 'implement', 'diagnosing-bugs', 'code-review',
  'resolving-merge-conflicts', 'frontend-design', 'web-design-guidelines',
  'react-best-practices', 'redesign-skill', 'taste-skill']);
const MD_EXT = /\.md$/i;

const RULES = [
  { id: 'stale-model-ref', re: /claude-(?:2(?:\.\d)?|3(?:[.-]\d)?)-?|claude-instant|claude-3-\d-\w+/i },
  // Pre-4.6 4.x family is retired (map §1). 4-6/4-7/4-8 and haiku-4-5 stay current and are not matched.
  { id: 'legacy-4x-model-ref', re: /claude-(?:opus|sonnet)-4-(?:0|1|5)\b|claude-(?:opus|sonnet)-4-20\d{6}|claude-4-(?:opus|sonnet)/i },
  { id: 'dated-thinking', re: /budget_tokens|think step by step|<scratchpad>/i },
  // Sampling knobs were removed from the API on the newest models; prose that tunes them is dated.
  { id: 'sampling-param', re: /\b(?:temperature|top_p|top_k)\s*(?:[:=]\s*[\d.]|to\s+[\d.])|\b(?:set|lower|raise|use|tune|adjust)\s+(?:a\s+|the\s+)?(?:low(?:er)?\s+|high(?:er)?\s+|zero\s+)?temperature\b/i },
  // Assistant prefill was removed; structured output goes through output_config.format.
  { id: 'prefill', re: /\bpre-?fill(?:ed|ing|s)?\s+(?:the\s+|a\s+|an\s+)?(?:assistant|response|output|turn|json|brace|message)|assistant[- ]prefill|\bprefill\s*[:=]/i },
  // Claude 5-era models over-delegate; G9 decides parallelism mechanically.
  { id: 'delegate-more', re: /delegate\s+(?:more|aggressively|liberally|freely|as much as)|spawn\s+(?:more|as many|many)\s+(?:sub)?agents?|use\s+sub-?agents\s+(?:freely|liberally|whenever|as much)|parallelize\s+(?:everything|as much as possible)/i },
  { id: 'over-verification', re: /double-check your (?:answer|work)|re-verify before responding|verify (?:your answer )?again before/i },
  { id: 'severity-filter', re: /only report (?:high|critical)[- ]severity|report only (?:high|critical)[- ]severity|don'?t nitpick|do not report low[- ]severity/i }
];
// Pressure language checked separately so P0/C10 lines can keep their emphasis.
const PRESSURE = /\b(?:MUST|NEVER|ALWAYS|CRITICAL)\b/;
const PRESSURE_EXEMPT = /P0|C10|modernization:allow/;

function walk(target, out) {
  let stat;
  try { stat = fs.statSync(target); } catch (_) { return; }
  if (stat.isDirectory()) {
    if (SKIP_DIRS.has(path.basename(target))) return;
    for (const f of fs.readdirSync(target)) walk(path.join(target, f), out);
  } else if (MD_EXT.test(target)) {
    out.push(target);
  }
}

function scanFile(file) {
  let content;
  try { content = fs.readFileSync(file, 'utf8'); } catch (_) { return []; }
  const findings = [];
  content.split(/\r?\n/).forEach((line, i) => {
    if (line.includes('modernization:allow')) return;
    for (const r of RULES) {
      if (r.re.test(line)) { findings.push({ file, line: i + 1, rule: r.id }); return; }
    }
    if (PRESSURE.test(line) && !PRESSURE_EXEMPT.test(line)) {
      findings.push({ file, line: i + 1, rule: 'pressure-language' });
    }
  });
  return findings;
}

function main(argv) {
  const args = argv.slice(2);
  const json = args.includes('--json');
  const targets = args.filter(a => !a.startsWith('--'));
  if (targets.length === 0) { console.error('usage: prompt-modernization-check.js <path...> [--json]'); return 2; }

  const files = [];
  targets.forEach(t => walk(t, files));
  const findings = files.flatMap(scanFile);

  if (json) {
    console.log(JSON.stringify({ scanned: files.length, findings }, null, 2));
  } else if (findings.length) {
    console.error(`✗ prompt-modernization-check: ${findings.length} dated pattern(s)`);
    for (const f of findings) console.error(`  ${f.file}:${f.line}  [${f.rule}]`);
    console.error('  Reword per references/model-capability-map.md §2-4, or add `modernization:allow` for a deliberate exception.');
  } else {
    console.log(`✔ prompt-modernization-check: clean (${files.length} file(s), no dated prompting patterns)`);
  }
  return findings.length ? 1 : 0;
}

if (require.main === module) process.exit(main(process.argv));

module.exports = { scanFile, walk, RULES, PRESSURE, PRESSURE_EXEMPT, main };
