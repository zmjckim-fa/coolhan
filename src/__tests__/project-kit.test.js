const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { runNode } = require('../../scripts/lib/spawn-node');
const kit = require('../../scripts/new-project');
const launcher = require('../../knowledge_base/project-kit/coolhan');
const { buildState, START, END } = require('../../scripts/handoff-write');
const { fill, upsertBlock } = require('../../scripts/lib/template');
const lessons = require('../../scripts/field-lessons');
const planDoc = require('../../scripts/plan-doc-check');

const ROOT = path.resolve(__dirname, '..', '..');
function tmp() { return fs.mkdtempSync(path.join(os.tmpdir(), 'kit-')); }
function write(root, rel, content) { const p = path.join(root, rel); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, content); }
const read = (root, rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const quiet = (fn) => { const o = { log: console.log, error: console.error }; console.log = () => {}; console.error = () => {}; try { return fn(); } finally { console.log = o.log; console.error = o.error; } };
const run = (dir, ...args) => quiet(() => kit.main(['node', 'new-project.js', dir, ...args]));

/** A small stand-in for the module library: two bundles, one with an extracted module. */
function library() {
  const d = tmp();
  write(d, '_specs/modules.json', JSON.stringify({
    bundles: {
      B01: { label: '회원가입·계정', layer: 'common', modules: ['member/account'], spec: '_specs/B01.md' },
      B07: { label: '결제', layer: 'common', modules: ['payments/core', 'payments/refund'], spec: '_specs/B07.md' },
      B21: { label: '세무 신고', layer: 'domain', modules: ['tax/estimate'], spec: '_specs/B21.md' }
    },
    modules: { 'member/account': {}, 'payments/core': { extracted: { package: 'p' } }, 'payments/refund': {}, 'tax/estimate': {} }
  }));
  return d;
}

describe('standing orders in the registry (G23: what the operator re-typed in every project)', () => {
  const reg = lessons.load(path.join(ROOT, lessons.DEFAULT_REGISTRY));

  test('the shipped registry carries orders, valid and free of private data', () => {
    const v = lessons.validate(reg);
    expect(v.findings).toEqual([]);
    expect(v.orders).toBeGreaterThanOrEqual(15);
  });

  test('ordersOf: `all` orders always apply, tagged ones only for a project with that tag', () => {
    const base = lessons.ordersOf(reg, ['all']).map(o => o.id);
    expect(base).toContain('O-01');
    expect(base).not.toContain('O-08');                                   // deploy order needs the deploy tag
    expect(lessons.ordersOf(reg, ['all', 'deploy']).map(o => o.id)).toContain('O-08');
    expect(lessons.ordersOf(reg).length).toBe(reg.orders.length);         // no tags given = everything
  });

  test('validate names a malformed order', () => {
    const bad = { lessons: reg.lessons, orders: [{ id: 'X1', title: '', text: 't', enforce: 'e', seen: 's', tags: ['all'] }] };
    const rules = lessons.validate(bad).findings.map(f => f.rule);
    expect(rules).toEqual(expect.arrayContaining(['order-id-format', 'lesson-field-missing']));
  });
});

describe('new-project (G23: a project folder that already carries the standing orders, hooks, ledger and module plan)', () => {
  test('a new folder gets the whole kit; the ledger passes its gate; orders and module rows are derived', () => {
    const d = tmp(), lib = library();
    expect(run(d, '--intent', '가구 구매대행 쇼핑몰', '--tags', 'ui,deploy,money', '--modules', lib)).toBe(0);
    for (const f of ['coolhan.project.json', 'scripts/coolhan.js', 'CLAUDE.md', '.claude/settings.json', '.gitignore', 'HANDOFF.md', 'docs/PROGRESS.md',
      'docs/CHECKS.md', 'docs/DECISIONS.md', 'docs/BLOCKED.md', 'docs/plan/MODULE_PLAN.md', 'docs/plan/LESSON_PLAN.md', '_workspace/_goal.md', '_workspace/_backlog.md']) {
      expect(fs.existsSync(path.join(d, f))).toBe(true);
    }
    const cfg = JSON.parse(read(d, 'coolhan.project.json'));
    expect(cfg).toMatchObject({ intent: '가구 구매대행 쇼핑몰', tags: ['ui', 'deploy', 'money'], deploy: 'none' });
    expect(fs.existsSync(path.join(cfg.home, 'scripts', 'completion-check.js'))).toBe(true);
    const claude = read(d, 'CLAUDE.md');
    expect(claude).toMatch(/O-01/); expect(claude).toMatch(/O-08/);       // deploy tag → deploy order present
    expect(claude).not.toMatch(/\{\{\w+\}\}/);                            // no unfilled slot
    const plan = read(d, 'docs/plan/MODULE_PLAN.md');
    expect(plan).toMatch(/\| B01 \| 회원가입·계정 \| common \| 참조 \|/);  // always-bundle, nothing extracted → 참조
    expect(plan).toMatch(/\| B07 \| 결제 \| common \| 이식 \|[^\n]*1\/2 \|/); // money tag, one extracted module → 이식
    expect(plan).toMatch(/\| B21 \| 세무 신고 \| domain \| 제외 \|/);       // no tax tag → 제외
    expect(JSON.stringify(JSON.parse(read(d, '.claude/settings.json')).hooks)).toMatch(/hook stop-guard.*hook ask-guard.*hook run-armer/);
    const gate = spawnSync(process.execPath, [path.join(d, 'scripts', 'coolhan.js'), 'progress-check', 'docs/PROGRESS.md'], { cwd: d, encoding: 'utf8' });
    expect(gate.status).toBe(0);
    // track42 K-3: the lesson tool reads the harness registry from inside a project that has no registry of its own
    const lessonList = spawnSync(process.execPath, [path.join(d, 'scripts', 'coolhan.js'), 'field-lessons', 'list', '--owner', 'developer', '--tags', '@tags'], { cwd: d, encoding: 'utf8' });
    expect(lessonList.status).toBe(0); expect(lessonList.stdout).toMatch(/F-01/);
    for (const x of [d, lib]) fs.rmSync(x, { recursive: true, force: true });
  });

  test('without the deploy tag the deploy order is not written', () => {
    const d = tmp();
    run(d, '--intent', 'x', '--tags', 'ui', '--modules', '');
    expect(read(d, 'CLAUDE.md')).not.toMatch(/O-08/);
    fs.rmSync(d, { recursive: true, force: true });
  });

  test('adopt mode: an existing project keeps its own files; only the orders block, hooks and ignore lines are merged', () => {
    const d = tmp();
    write(d, 'CLAUDE.md', '# My shop\n\nOur own rule: prices come from the fee table.\n');
    write(d, 'docs/PROGRESS.md', 'MY LEDGER\n');
    write(d, 'HANDOFF.md', 'MY HANDOFF\n');
    write(d, '.claude/settings.json', JSON.stringify({ permissions: { allow: ['Bash(npm test)'] }, hooks: { Stop: [{ hooks: [{ type: 'command', command: 'node my-stop.js' }] }] } }));
    write(d, '.gitignore', 'node_modules\n');
    run(d, '--intent', '기존 쇼핑몰', '--modules', '');
    expect(read(d, 'docs/PROGRESS.md')).toBe('MY LEDGER\n');
    expect(read(d, 'HANDOFF.md')).toBe('MY HANDOFF\n');
    const claude = read(d, 'CLAUDE.md');
    expect(claude).toMatch(/^# My shop\n\nOur own rule: prices come from the fee table\./);
    expect(claude).toMatch(/coolhan:orders:start[\s\S]*O-01[\s\S]*coolhan:orders:end/);
    const s = JSON.parse(read(d, '.claude/settings.json'));
    expect(s.permissions.allow).toEqual(['Bash(npm test)']);
    expect(s.hooks.Stop).toHaveLength(2);                                  // theirs kept, ours added
    expect(read(d, '.gitignore')).toMatch(/^node_modules\n_workspace\/_run-active\.json/);
    fs.rmSync(d, { recursive: true, force: true });
  });

  test('running it twice changes nothing; a hand edit inside the orders block is restored, text outside it survives', () => {
    const d = tmp();
    run(d, '--intent', 'x', '--modules', '');
    const first = read(d, 'CLAUDE.md');
    const again = JSON.parse(spawnSync(process.execPath, [path.join(ROOT, 'scripts', 'new-project.js'), d, '--json'], { encoding: 'utf8' }).stdout);
    expect(again.created).toEqual([]); expect(again.updated).toEqual([]);
    fs.writeFileSync(path.join(d, 'CLAUDE.md'), first.replace(/- \*\*O-03[^\n]*\n/, '').replace('이 아래에 이 프로젝트에만 해당하는 규칙을 적는다.', '환율은 관세청 고시 환율만 쓴다.'));
    run(d);
    const fixed = read(d, 'CLAUDE.md');
    expect(fixed).toMatch(/O-03/); expect(fixed).toMatch(/환율은 관세청 고시 환율만 쓴다\./);
    fs.rmSync(d, { recursive: true, force: true });
  });

  test('usage: no directory, no intent, bad deploy value → exit 2 and nothing written', () => {
    const d = tmp();
    expect(quiet(() => kit.main(['node', 'new-project.js']))).toBe(2);
    expect(run(d)).toBe(2);
    expect(run(d, '--intent', 'x', '--deploy', 'always')).toBe(2);
    expect(fs.readdirSync(d)).toEqual([]);
    fs.rmSync(d, { recursive: true, force: true });
  });

  test('--dry reports what it would create and writes nothing', () => {
    const d = tmp();
    expect(run(d, '--intent', 'x', '--dry', '--modules', '')).toBe(0);
    expect(fs.readdirSync(d)).toEqual([]);
    fs.rmSync(d, { recursive: true, force: true });
  });
});

describe('project launcher (scripts/coolhan.js in a project)', () => {
  test('home comes from the config or the environment; argument aliases expand', () => {
    expect(launcher.resolveHome({ home: ROOT }, {})).toBe(ROOT);
    expect(launcher.resolveHome({ home: '/nowhere' }, { COOLHAN_HOME: ROOT })).toBe(ROOT);
    expect(launcher.resolveHome({ home: '/nowhere' }, {})).toBe(null);
    expect(launcher.expand(['--tags', '@tags', '@home/kb', '--modules', '@modules'], { tags: ['ui', 'money'], modules: 'M' }, 'H')).toEqual(['--tags', 'ui,money', 'H/kb', '--modules', 'M']);
  });

  test('harness missing: a gate is NOT_RUN (exit 4), a hook fails open (exit 0), so nobody is trapped and nothing passes', () => {
    const d = tmp();
    write(d, 'coolhan.project.json', JSON.stringify({ home: '/nowhere' }));
    const env = {};
    expect(quiet(() => launcher.main(['node', 'coolhan.js', 'checks-run'], { cwd: d, env }))).toBe(4);
    expect(quiet(() => launcher.main(['node', 'coolhan.js', 'hook', 'stop-guard'], { cwd: d, env }))).toBe(0);
    expect(quiet(() => launcher.main(['node', 'coolhan.js', 'where'], { cwd: d, env }))).toBe(4);
    fs.rmSync(d, { recursive: true, force: true });
  });

  test('unknown tool → 2; a tool name that is a path is refused; `modules` without a library is NOT_RUN', () => {
    const d = tmp();
    write(d, 'coolhan.project.json', JSON.stringify({ home: ROOT, modules: '' }));
    expect(quiet(() => launcher.main(['node', 'coolhan.js', 'no-such-tool'], { cwd: d, env: {} }))).toBe(2);
    expect(quiet(() => launcher.main(['node', 'coolhan.js', '../../etc/x'], { cwd: d, env: {} }))).toBe(2);
    expect(quiet(() => launcher.main(['node', 'coolhan.js', 'modules', 'list'], { cwd: d, env: {} }))).toBe(4);
    fs.rmSync(d, { recursive: true, force: true });
  });

  test('in an installed project the operator\'s plain words arm the loop and the stop hook blocks while the backlog is open', () => {
    const d = tmp();
    run(d, '--intent', 'x', '--modules', '');
    const hook = (name, input) => runNode(path.join(d, 'scripts', 'coolhan.js'), ['hook', name], { cwd: d, input });
    expect(hook('run-armer', JSON.stringify({ prompt: '배포하라' })).stdout).not.toMatch(/ARMED/);
    expect(fs.existsSync(path.join(d, '_workspace', '_run-active.json'))).toBe(false);
    expect(hook('run-armer', JSON.stringify({ prompt: '이어서 진행하라' })).stdout).toMatch(/ARMED/);
    expect(hook('stop-guard', '{}').stdout).toMatch(/"decision":"block"/);
    fs.writeFileSync(path.join(d, '_workspace', '_stop-approved.json'), JSON.stringify({ reason: 'needs a real payment key' }));
    expect(hook('stop-guard', '{}').stdout).not.toMatch(/"decision":"block"/);
    fs.rmSync(d, { recursive: true, force: true });
  });
});

describe('handoff-write (the state block of HANDOFF.md is generated, never hand-written)', () => {
  const LEDGER = ['목표: 주문 취소 흐름', '', '## 작업 목록', '| 번호 | 이름 | 상태 | 완료 증거 | 남은 항목 |', '|---|---|---|---|---|', '| 1 | API | 완료 | jest 3/3 | - |', '| 2 | 화면 | 진행 중 | | 오류 문구 |',
    '', '## 현재 위치', '2번 화면', '', '## 가정 목록', '', '## 결함 목록', '| D-번호 | 발견한 검사 | 파일:줄 | 상태 |', '|---|---|---|---|', '| D-1 | C2 | a.js:1 | 열림 |', ''].join('\n');

  test('buildState carries goal, progress numbers, position, open defects and commits', () => {
    const s = buildState(LEDGER, { date: '2026-11-17', commits: ['abc1234 feat: cancel api'] });
    expect(s).toMatch(/주문 취소 흐름/); expect(s).toMatch(/1\/2 완료/); expect(s).toMatch(/2번 화면/); expect(s).toMatch(/D-1/); expect(s).toMatch(/abc1234/);
  });

  test('upsertBlock replaces only the marked block; main is NOT_RUN without a ledger', () => {
    const doc = `# H\n\nkeep me\n\n${START}\nold\n${END}\n\ntail\n`;
    const out = upsertBlock(doc, START, END, 'new');
    expect(out).toBe(`# H\n\nkeep me\n\n${START}\nnew\n${END}\n\ntail\n`);
    expect(upsertBlock('# H\n', START, END, 'x', '## S')).toBe(`# H\n\n## S\n\n${START}\nx\n${END}\n`);
    const d = tmp();
    const r = spawnSync(process.execPath, [path.join(ROOT, 'scripts', 'handoff-write.js'), '--root', d], { encoding: 'utf8' });
    expect(r.status).toBe(4);
    expect(fs.existsSync(path.join(d, 'HANDOFF.md'))).toBe(false);
    fs.rmSync(d, { recursive: true, force: true });
  });

  test('fill leaves no slot behind', () => {
    expect(fill('a {{x}} b {{missing}} c', { x: 1 })).toBe('a 1 b  c');
  });
});

describe('plan-doc-check --modules (use the module library first: every bundle answered)', () => {
  const BUNDLES = { B01: { label: '회원가입·계정' }, B07: { label: '결제' } };
  const plan = (rows) => { const d = tmp(); write(d, 'plan.md', `# 기획서\n\n## 모듈 계획\n\n| 묶음 | 이름 | 결정 | 근거 |\n|---|---|---|---|\n${rows}\n`); return d; };
  const rulesFor = (d) => { const r = planDoc.evaluate(d, { modules: BUNDLES }); fs.rmSync(d, { recursive: true, force: true }); return r; };

  test('all bundles answered with an allowed decision → no module finding', () => {
    const r = rulesFor(plan('| B01 | 회원 | 참조 | 명세를 따라 새로 만든다 |\n| B07 | 결제 | 제외 | 결제 없음 |'));
    expect(r.findings.filter(f => /module/.test(f.rule))).toEqual([]);
    expect([r.stats.bundles_required, r.stats.bundles_answered]).toEqual([2, 2]);
  });

  test('a missing bundle is named; a free-text decision is rejected', () => {
    const r = rulesFor(plan('| B01 | 회원 | 나중에 정함 | 근거 |'));
    const rules = r.findings.map(f => f.rule);
    expect(rules).toContain('module-bundle-unanswered');
    expect(rules).toContain('module-decision-invalid');
    expect(r.findings.find(f => f.rule === 'module-bundle-unanswered').detail).toMatch(/B07/);
  });

  test('no table at all → no-module-table; without --modules nothing is owed', () => {
    const d = tmp(); write(d, 'plan.md', '# 기획서\n');
    expect(planDoc.evaluate(d, { modules: BUNDLES }).findings.map(f => f.rule)).toContain('no-module-table');
    expect(planDoc.evaluate(d).findings.map(f => f.rule).filter(x => /module/.test(x))).toEqual([]);
    fs.rmSync(d, { recursive: true, force: true });
  });
  test('the launcher runs in a project whose package file says type module (track42 K-8)', () => {
    const d = fs.mkdtempSync(path.join(os.tmpdir(), 'kit-esm-'));
    fs.mkdirSync(path.join(d, 'scripts'));
    fs.copyFileSync(path.join(__dirname, '..', '..', 'knowledge_base', 'project-kit', 'coolhan.js'), path.join(d, 'scripts', 'coolhan.js'));
    fs.writeFileSync(path.join(d, 'coolhan.project.json'), JSON.stringify({ home: path.join(__dirname, '..', '..'), tags: ['ui'] }));
    fs.writeFileSync(path.join(d, 'package.json'), '{"type":"module"}');
    const run = (...args) => spawnSync(process.execPath, [path.join(d, 'scripts', 'coolhan.js'), ...args], { cwd: d, encoding: 'utf8', input: '{"prompt":"hello"}' });
    const where = run('where');
    expect(where.status).toBe(0); expect(where.stderr).not.toMatch(/require is not defined/);
    expect(run('hook', 'run-armer').status).toBe(0);
    expect(run('no-such-tool').status).toBe(2);
    fs.rmSync(d, { recursive: true, force: true });
  });
});
