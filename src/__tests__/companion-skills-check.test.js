const fs = require('fs');
const os = require('os');
const path = require('path');
const { check, hasSkill, EXPECTED, main } = require('../../scripts/companion-skills-check');

describe('companion-skills-check (G16 — shipped companion-skill presence)', () => {
  test('all expected skills are actually shipped in this repo (.claude/skills)', () => {
    const rows = check(process.cwd());
    const missing = rows.filter(r => !r.shipped).map(r => r.skill);
    expect(missing).toEqual([]);
    expect(rows).toHaveLength(EXPECTED.length);
  });

  test('every expected skill directory contains a SKILL.md', () => {
    for (const name of EXPECTED) {
      expect(hasSkill(path.join(process.cwd(), '.claude', 'skills'), name)).toBe(true);
    }
  });

  test('hasSkill is false for a directory without SKILL.md (no false present)', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cs-'));
    fs.mkdirSync(path.join(dir, 'skills', 'empty'), { recursive: true });
    expect(hasSkill(path.join(dir, 'skills'), 'empty')).toBe(false);
    expect(hasSkill(path.join(dir, 'skills'), 'absent')).toBe(false);
    fs.rmSync(dir, { recursive: true, force: true });
  });

  test('check reports shipped vs global independently (synthetic repo)', () => {
    const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'cs-repo-'));
    const home = fs.mkdtempSync(path.join(os.tmpdir(), 'cs-home-'));
    fs.mkdirSync(path.join(repo, '.claude', 'skills', 'grill-me'), { recursive: true });
    fs.writeFileSync(path.join(repo, '.claude', 'skills', 'grill-me', 'SKILL.md'), '# grill');
    fs.mkdirSync(path.join(home, '.claude', 'skills', 'grill-me'), { recursive: true });
    fs.writeFileSync(path.join(home, '.claude', 'skills', 'grill-me', 'SKILL.md'), '# grill');
    const rows = check(repo, home);
    const g = rows.find(r => r.skill === 'grill-me');
    expect(g).toMatchObject({ shipped: true, global: true });
    // a skill neither shipped nor global stays false/false
    const other = rows.find(r => r.skill === 'code-review');
    expect(other).toMatchObject({ shipped: false, global: false });
    fs.rmSync(repo, { recursive: true, force: true });
    fs.rmSync(home, { recursive: true, force: true });
  });

  test('main exits 0 in this repo (all shipped)', () => {
    const orig = console.log;
    console.log = () => {};
    const code = main(['node', 'companion-skills-check.js']);
    console.log = orig;
    expect(code).toBe(0);
  });
});
