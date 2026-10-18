#!/usr/bin/env node

/**
 * CoolHan companion-skills-check — reports which shipped companion skills are actually present
 * (G16, v2.3.0). Honest presence probe (C3): an agent must invoke a companion skill ONLY when it
 * exists; this script is the mechanical source of truth for that, and the doctor/installer use it.
 *
 * A skill is PRESENT when a directory of its name containing a SKILL.md exists under either:
 *   - the CoolHan repo's `.claude/skills/` (shipped), or
 *   - the running environment's `~/.claude/skills/` (globally installed).
 * Anything else is ABSENT — never assumed present.
 *
 * Usage: node scripts/companion-skills-check.js [--json]
 * Exit: 0 if every expected companion skill is present in the repo; 1 if any repo-shipped one is
 *       missing (a real regression in what CoolHan installs). Global-only presence is reported,
 *       not required.
 *
 * Honesty: proves the skill FILES exist, not that they work or are up to date with upstream.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const EXPECTED = [
  'grill-me', 'codebase-design', 'implement', 'diagnosing-bugs', 'code-review',
  'resolving-merge-conflicts', 'frontend-design', 'web-design-guidelines',
  'react-best-practices', 'redesign-skill', 'taste-skill',
  'web-clone' // v2.5.1 — Jane (xiaoer) MIT; reverse/reuse: real-source-first site reproduction
];

function hasSkill(dir, name) {
  try { return fs.existsSync(path.join(dir, name, 'SKILL.md')); } catch (_) { return false; }
}

function check(repoRoot, homeDir) {
  const repoSkills = path.join(repoRoot, '.claude', 'skills');
  const globalSkills = path.join(homeDir || os.homedir(), '.claude', 'skills');
  return EXPECTED.map(name => ({
    skill: name,
    shipped: hasSkill(repoSkills, name),   // ships with CoolHan (install.js copies it)
    global: hasSkill(globalSkills, name)   // present in the running environment
  }));
}

function main(argv) {
  const json = argv.includes('--json');
  const rows = check(process.cwd());
  const missingShipped = rows.filter(r => !r.shipped).map(r => r.skill);

  if (json) {
    console.log(JSON.stringify({ rows, missing_shipped: missingShipped, ok: missingShipped.length === 0 }, null, 2));
  } else if (missingShipped.length) {
    console.error(`✗ companion-skills-check: ${missingShipped.length} expected skill(s) NOT shipped: ${missingShipped.join(', ')}`);
    for (const r of rows) console.error(`  ${r.shipped ? '✅' : '❌'} ${r.skill}  (shipped=${r.shipped}, global=${r.global})`);
  } else {
    console.log(`✔ companion-skills-check: all ${rows.length} companion skills shipped in .claude/skills`);
    for (const r of rows) if (!r.global) console.log(`  (note) ${r.skill}: shipped but not in ~/.claude/skills of this environment`);
  }
  return missingShipped.length ? 1 : 0;
}

if (require.main === module) process.exit(main(process.argv));

module.exports = { check, hasSkill, EXPECTED, main };
