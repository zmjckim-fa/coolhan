const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const g = require('../../scripts/install-global');
const kit = require('../../scripts/new-project');
const { blockBody, removeBlock, upsertBlock } = require('../../scripts/lib/template');

const ROOT = path.resolve(__dirname, '..', '..');
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'glob-'));
const quiet = (fn) => { const o = { log: console.log, error: console.error }; console.log = () => {}; console.error = () => {}; try { return fn(); } finally { console.log = o.log; console.error = o.error; } };
const run = (home, ...args) => quiet(() => g.main(['node', 'install-global.js', '--claude-home', home, '--modules', '', ...args], { env: {} }));
const file = (home) => path.join(home, 'CLAUDE.md');
const OWN = '# 내 전역 규칙\n\n- 칭찬하지 않는다.\n- 이미지는 JPG로 저장한다.\n';

describe('install-global (G24: the standing orders reach every session without the command word)', () => {
  test('the block is derived from the registry: every order, the harness location, the kit rule', () => {
    const body = g.buildBlock({ modules: 'M:/lib' });
    const reg = JSON.parse(fs.readFileSync(path.join(ROOT, 'knowledge_base', 'field-lessons.json'), 'utf8'));
    for (const o of reg.orders) expect(body).toContain(`**${o.id} ${o.title}**`);
    expect(body).toContain(ROOT.split(path.sep).join('/'));
    expect(body).toMatch(/coolhan\.project\.json/); expect(body).toMatch(/new-project\.js/); expect(body).toContain('M:/lib');
    expect(body).not.toMatch(/\{\{\w+\}\}/);
  });

  test('not installed → --check is NOT_RUN (4), never a pass; nothing is written by a check', () => {
    const h = tmp();
    expect(run(h, '--check')).toBe(4);
    expect(fs.existsSync(file(h))).toBe(false);
    fs.writeFileSync(file(h), OWN);
    expect(run(h, '--check')).toBe(4);
    expect(fs.readFileSync(file(h), 'utf8')).toBe(OWN);
    fs.rmSync(h, { recursive: true, force: true });
  });

  test('install keeps the operator\'s own text byte for byte, adds the block, keeps the earlier file beside it', () => {
    const h = tmp();
    fs.writeFileSync(file(h), OWN);
    expect(run(h)).toBe(0);
    const s = fs.readFileSync(file(h), 'utf8');
    expect(s.startsWith(OWN.trimEnd())).toBe(true);
    expect(blockBody(s, g.START, g.END)).toBe(g.buildBlock({ modules: '' }));
    expect(fs.readFileSync(`${file(h)}.before-coolhan`, 'utf8')).toBe(OWN);
    expect(run(h, '--check')).toBe(0);
    fs.rmSync(h, { recursive: true, force: true });
  });

  test('no instruction file yet → one is created with only the block', () => {
    const h = path.join(tmp(), 'fresh');
    expect(run(h)).toBe(0);
    expect(fs.readFileSync(file(h), 'utf8')).toMatch(/^## [^\n]+\n\n<!-- coolhan:global:start -->/);
    expect(fs.existsSync(`${file(h)}.before-coolhan`)).toBe(false);
    fs.rmSync(path.dirname(h), { recursive: true, force: true });
  });

  test('a second run changes nothing; a hand edit inside the block is stale (1) and a re-run restores it', () => {
    const h = tmp();
    fs.writeFileSync(file(h), OWN);
    run(h);
    const first = fs.readFileSync(file(h), 'utf8');
    expect(run(h)).toBe(0);
    expect(fs.readFileSync(file(h), 'utf8')).toBe(first);
    fs.writeFileSync(file(h), first.replace(/- \*\*O-03[^\n]*\n/, '') + '\n- 나중에 덧붙인 내 규칙.\n');
    expect(run(h, '--check')).toBe(1);
    expect(run(h)).toBe(0);
    const fixed = fs.readFileSync(file(h), 'utf8');
    expect(fixed).toMatch(/O-03/); expect(fixed).toMatch(/나중에 덧붙인 내 규칙\./);
    expect(fs.readFileSync(`${file(h)}.before-coolhan`, 'utf8')).toBe(OWN);   // the first copy is not replaced by later states
    fs.rmSync(h, { recursive: true, force: true });
  });

  test('--remove takes out the block and its heading and leaves the rest exactly as it was', () => {
    const h = tmp();
    fs.writeFileSync(file(h), OWN);
    run(h);
    expect(run(h, '--remove')).toBe(0);
    expect(fs.readFileSync(file(h), 'utf8')).toBe(OWN);
    expect(run(h, '--remove')).toBe(0);                                      // nothing to remove is not an error
    expect(run(h, '--check')).toBe(4);
    fs.rmSync(h, { recursive: true, force: true });
  });

  test('--dry writes nothing; an unknown flag or stray argument is a usage error', () => {
    const h = tmp();
    expect(run(h, '--dry')).toBe(0);
    expect(fs.existsSync(file(h))).toBe(false);
    expect(run(h, '--force')).toBe(2);
    expect(run(h, 'stray')).toBe(2);
    fs.rmSync(h, { recursive: true, force: true });
  });

  test('settings are never touched (loop hooks are installed per project, not for every session)', () => {
    const h = tmp();
    const settings = JSON.stringify({ hooks: { Stop: [] }, model: 'x' });
    fs.writeFileSync(path.join(h, 'settings.json'), settings);
    run(h);
    expect(fs.readFileSync(path.join(h, 'settings.json'), 'utf8')).toBe(settings);
    expect(fs.readdirSync(h).sort()).toEqual(['CLAUDE.md', 'settings.json']);
    fs.rmSync(h, { recursive: true, force: true });
  });

  test('CLI: --json reports the result and the exit code', () => {
    const h = tmp();
    const r = spawnSync(process.execPath, [path.join(ROOT, 'scripts', 'install-global.js'), '--claude-home', h, '--check', '--json'], { encoding: 'utf8' });
    expect(r.status).toBe(4);
    expect(JSON.parse(r.stdout)).toMatchObject({ result: 'notInstalled', exit: 4 });
    fs.rmSync(h, { recursive: true, force: true });
  });
});

describe('template block helpers', () => {
  const S = '<!-- s -->', E = '<!-- e -->';
  test('blockBody / removeBlock are the inverse of upsertBlock', () => {
    const doc = upsertBlock('# A\n\ntext\n', S, E, 'one\ntwo', '## H');
    expect(blockBody(doc, S, E)).toBe('one\ntwo');
    expect(removeBlock(doc, S, E, '## H')).toBe('# A\n\ntext\n');
    expect(blockBody('# A\n', S, E)).toBe(null);
    expect(removeBlock('# A\n', S, E)).toBe('# A\n');
    expect(removeBlock(`top\n\n${S}\nx\n${E}\n\nbottom\n`, S, E)).toBe('top\n\nbottom\n');
  });
});

describe('new-project --check (the managed parts of an installed kit equal what the harness derives)', () => {
  const kitRun = (dir, ...args) => quiet(() => kit.main(['node', 'new-project.js', dir, ...args]));
  test('no kit → 4; fresh kit → 0; an order deleted by hand → 1 and nothing rewritten; --refresh → 0 again', () => {
    const d = tmp();
    expect(kitRun(d, '--check')).toBe(4);
    expect(fs.readdirSync(d)).toEqual([]);
    kitRun(d, '--intent', 'x', '--modules', '');
    expect(kitRun(d, '--check')).toBe(0);
    const f = path.join(d, 'CLAUDE.md');
    const broken = fs.readFileSync(f, 'utf8').replace(/- \*\*O-03[^\n]*\n/, '');
    fs.writeFileSync(f, broken);
    expect(kitRun(d, '--check')).toBe(1);
    expect(fs.readFileSync(f, 'utf8')).toBe(broken);
    kitRun(d, '--refresh');
    expect(kitRun(d, '--check')).toBe(0);
    fs.rmSync(d, { recursive: true, force: true });
  });

  test('the harness folder itself and the module library are refused (2) and stay untouched', () => {
    const lib = tmp();
    fs.mkdirSync(path.join(lib, '_specs')); fs.writeFileSync(path.join(lib, '_specs', 'modules.json'), '{"bundles":{}}');
    expect(kitRun(ROOT, '--intent', 'x', '--dry')).toBe(2);
    expect(kitRun(lib, '--intent', 'x', '--modules', lib)).toBe(2);
    expect(fs.readdirSync(lib)).toEqual(['_specs']);
    expect(fs.existsSync(path.join(ROOT, 'coolhan.project.json'))).toBe(false);
    fs.rmSync(lib, { recursive: true, force: true });
  });

  test('a removed loop hook is stale; a project rule outside the block is not', () => {
    const d = tmp();
    kitRun(d, '--intent', 'x', '--modules', '');
    fs.appendFileSync(path.join(d, 'CLAUDE.md'), '\n환율은 고시 환율만 쓴다.\n');
    expect(kitRun(d, '--check')).toBe(0);
    const sf = path.join(d, '.claude', 'settings.json');
    const s = JSON.parse(fs.readFileSync(sf, 'utf8')); delete s.hooks.Stop;
    fs.writeFileSync(sf, JSON.stringify(s, null, 2) + '\n');
    expect(kitRun(d, '--check')).toBe(1);
    fs.rmSync(d, { recursive: true, force: true });
  });
});
