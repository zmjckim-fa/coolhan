const fs = require('fs');
const os = require('os');
const path = require('path');
const { runChecks, summarize, CORE_AGENTS } = require('../../doctor');

function mkHealthyInstall() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'coolhan-doctor-'));
  fs.writeFileSync(path.join(root, 'CLAUDE.md'),
    '## Harness: CoolHan Development\nuse coolhan-development-orchestrator');

  const agentsDir = path.join(root, '.claude', 'agents');
  fs.mkdirSync(agentsDir, { recursive: true });
  CORE_AGENTS.forEach(a => fs.writeFileSync(path.join(agentsDir, `${a}.md`), `# ${a}`));

  const skillDir = path.join(root, '.claude', 'skills', 'coolhan-development-orchestrator');
  fs.mkdirSync(skillDir, { recursive: true });
  fs.writeFileSync(path.join(skillDir, 'SKILL.md'), '# orchestrator');

  const kbDir = path.join(root, 'knowledge_base');
  fs.mkdirSync(kbDir, { recursive: true });
  for (let i = 1; i <= 10; i++) {
    const n = String(i).padStart(2, '0');
    fs.writeFileSync(path.join(kbDir, `${n}_module.md`), `# module ${n}`);
  }
  return root;
}

function rm(root) {
  fs.rmSync(root, { recursive: true, force: true });
}

describe('CoolHan Doctor', () => {
  test('exports the 6 core agents', () => {
    expect(CORE_AGENTS).toHaveLength(6);
    expect(CORE_AGENTS).toContain('validator');
  });

  test('healthy install: zero failures, all named checks pass', () => {
    const root = mkHealthyInstall();
    try {
      const checks = runChecks(root);
      const summary = summarize(checks);
      expect(summary.fail).toBe(0);
      const byName = Object.fromEntries(checks.map(c => [c.name, c.status]));
      expect(byName['CLAUDE.md']).toBe('pass');
      expect(byName['Agents']).toBe('pass');
      expect(byName['Skills']).toBe('pass');
      expect(byName['Knowledge Base']).toBe('pass');
    } finally {
      rm(root);
    }
  });

  test('empty dir: core checks fail with fix hints', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'coolhan-empty-'));
    try {
      const checks = runChecks(root);
      const summary = summarize(checks);
      expect(summary.fail).toBeGreaterThan(0);
      const byName = Object.fromEntries(checks.map(c => [c.name, c]));
      expect(byName['CLAUDE.md'].status).toBe('fail');
      expect(byName['Agents'].status).toBe('fail');
      expect(byName['CLAUDE.md'].fix).toMatch(/coolhan-install/);
    } finally {
      rm(root);
    }
  });

  test('missing a core agent is reported as fail', () => {
    const root = mkHealthyInstall();
    try {
      fs.rmSync(path.join(root, '.claude', 'agents', 'validator.md'));
      const checks = runChecks(root);
      const agents = checks.find(c => c.name === 'Agents');
      expect(agents.status).toBe('fail');
      expect(agents.detail).toMatch(/validator/);
    } finally {
      rm(root);
    }
  });

  test('partial knowledge base is a warning, not a failure', () => {
    const root = mkHealthyInstall();
    try {
      fs.rmSync(path.join(root, 'knowledge_base', '10_module.md'));
      const checks = runChecks(root);
      const kb = checks.find(c => c.name === 'Knowledge Base');
      expect(kb.status).toBe('warn');
    } finally {
      rm(root);
    }
  });

  test('summarize counts statuses', () => {
    const s = summarize([
      { status: 'pass' }, { status: 'pass' }, { status: 'warn' }, { status: 'fail' }
    ]);
    expect(s).toEqual({ pass: 2, warn: 1, fail: 1, total: 4 });
  });
});
