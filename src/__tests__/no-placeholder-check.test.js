const fs = require('fs');
const os = require('os');
const path = require('path');
const { scanFile } = require('../../scripts/no-placeholder-check');

function tmp(content, name = 'f.js') {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'nph-'));
  const p = path.join(dir, name);
  fs.writeFileSync(p, content);
  return p;
}

describe('no-placeholder-check (Auto-Pilot "no dead ends" gate)', () => {
  test('clean file -> no findings', () => {
    const f = scanFile(tmp('function add(a,b){ return a+b; }\n'));
    expect(f).toHaveLength(0);
  });

  test('detects TODO', () => {
    const f = scanFile(tmp('function x(){ /* TODO: implement */ }\n'));
    expect(f).toHaveLength(1);
    expect(f[0].rule).toBe('TODO');
  });

  test('detects "coming soon"', () => {
    const f = scanFile(tmp('const msg = "Coming Soon";\n'));
    expect(f[0].rule).toBe('coming-soon');
  });

  test('detects Korean in-progress placeholder', () => {
    const f = scanFile(tmp('// 준비 중입니다\n'));
    expect(f[0].rule).toBe('korean-in-progress');
  });

  test('inline allowlist suppresses a finding', () => {
    const f = scanFile(tmp('// TODO later no-placeholder-check:allow\n'));
    expect(f).toHaveLength(0);
  });

  test('reports correct line number', () => {
    const f = scanFile(tmp('const a = 1;\nconst b = 2;\n// FIXME broken\n'));
    expect(f[0].line).toBe(3);
    expect(f[0].rule).toBe('FIXME');
  });
});
