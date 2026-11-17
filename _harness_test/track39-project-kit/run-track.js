#!/usr/bin/env node
// Track 39: G23 standing orders + project kit. Real child processes, temp folders, no simulation.
// Usage: node _harness_test/track39-project-kit/run-track.js   → writes run-log.txt beside this file, exit 1 on any mismatch.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const HOME = path.resolve(__dirname, '..', '..');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'track39-'));
const REAL_LIB = path.resolve(HOME, '..', '00Module_site');
const log = [];
const rows = [];
const forms = (p) => [p.split(path.sep).join('\\\\'), p, p.split(path.sep).join('/')];   // JSON-escaped, native, forward slashes
const MASK = [[TMP, '<tmp>'], [REAL_LIB, '<library>'], [HOME, '<home>'], [os.homedir(), '<user>']];
const clean = (s) => MASK.reduce((out, [p, name]) => forms(p).reduce((o, f) => o.split(f).join(name), out), String(s || ''));
const mk = (name) => { const d = path.join(TMP, name); fs.mkdirSync(d, { recursive: true }); return d; };
const write = (root, rel, content) => { const p = path.join(root, rel); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, content); };
const read = (root, rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const has = (root, rel) => fs.existsSync(path.join(root, rel));

function run(label, script, args, opts = {}) {
  const env = { ...process.env, ...(opts.env || {}) };
  if (opts.noHomeEnv) delete env.COOLHAN_HOME;
  const r = spawnSync(process.execPath, [script, ...args], { cwd: opts.cwd || HOME, input: opts.input, encoding: 'utf8', env });
  log.push(`$ [${label}] node ${clean(path.relative(opts.cwd || HOME, script))} ${clean(args.join(' '))}\n  exit ${r.status}\n${clean((r.stdout || '') + (r.stderr || '')).split('\n').slice(0, 14).map(l => '  ' + l).join('\n')}\n`);
  return { status: r.status, out: (r.stdout || '') + (r.stderr || '') };
}
const kit = (label, dir, ...args) => run(label, path.join(HOME, 'scripts', 'new-project.js'), [dir, ...args]);
const tool = (label, dir, args, opts = {}) => run(label, path.join(dir, 'scripts', 'coolhan.js'), args, { cwd: dir, ...opts });
const hook = (label, dir, name, input) => tool(label, dir, ['hook', name], { input });
function check(id, scenario, expected, actual, ok) { rows.push({ id, scenario, expected, actual: clean(actual), ok: !!ok }); }

function library() {
  const d = mk('library');
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
const LIB = library();
const FILES = ['coolhan.project.json', 'scripts/coolhan.js', 'CLAUDE.md', '.claude/settings.json', '.gitignore', 'HANDOFF.md', 'docs/PROGRESS.md', 'docs/CHECKS.md',
  'docs/DECISIONS.md', 'docs/BLOCKED.md', 'docs/plan/MODULE_PLAN.md', 'docs/plan/LESSON_PLAN.md', '_workspace/_goal.md', '_workspace/_backlog.md'];

// 1. fresh project
const A = mk('a-fresh');
let r = kit('1 fresh', A, '--intent', '유럽 중고 가구 구매대행 쇼핑몰', '--tags', 'ui,deploy,money', '--modules', LIB);
const missing = FILES.filter(f => !has(A, f));
check(1, 'A new folder, tags ui/deploy/money', 'exit 0, 14 kit files, no unfilled slot', `exit ${r.status}, ${FILES.length - missing.length}/14 files, slots ${/\{\{\w+\}\}/.test(FILES.map(f => has(A, f) ? read(A, f) : '').join('')) ? 'left' : 'none'}`, r.status === 0 && !missing.length && !/\{\{\w+\}\}/.test(FILES.map(f => read(A, f)).join('')));

// 2. the generated ledger passes its own gate through the launcher
r = tool('2 ledger', A, ['progress-check', 'docs/PROGRESS.md']);
check(2, 'Generated ledger through the project launcher', 'progress-check exit 0', `exit ${r.status}`, r.status === 0);

// 3. orders by tag
const B = mk('b-no-deploy');
kit('3 no deploy tag', B, '--intent', 'x', '--tags', 'ui', '--modules', '');
const aO = read(A, 'CLAUDE.md'), bO = read(B, 'CLAUDE.md');
check(3, 'Orders follow the project tags', 'O-01 in both; O-08 (deploy) only with the deploy tag', `A: O-01 ${/O-01/.test(aO)}, O-08 ${/O-08/.test(aO)}; B: O-01 ${/O-01/.test(bO)}, O-08 ${/O-08/.test(bO)}`, /O-01/.test(aO) && /O-08/.test(aO) && /O-01/.test(bO) && !/O-08/.test(bO));

// 4. module plan defaults
const plan = read(A, 'docs/plan/MODULE_PLAN.md');
const dec = (id) => (plan.split('\n').find(l => l.startsWith(`| ${id} |`)) || '').split('|').map(s => s.trim())[4];
check(4, 'Module plan defaults from tags', 'B01 참조 (common, nothing extracted), B07 이식 (money tag, 1 of 2 extracted), B21 제외 (no tax tag)', `B01 ${dec('B01')}, B07 ${dec('B07')}, B21 ${dec('B21')}`, dec('B01') === '참조' && dec('B07') === '이식' && dec('B21') === '제외');

// 5. adopt an existing project
const C = mk('c-existing');
const own = { 'CLAUDE.md': '# My shop\n\nOur rule: prices come from the fee table.\n', 'docs/PROGRESS.md': 'MY LEDGER\n', 'HANDOFF.md': 'MY HANDOFF\n', 'docs/CHECKS.md': 'MY CHECKS\n' };
for (const [f, c] of Object.entries(own)) write(C, f, c);
write(C, '.claude/settings.json', JSON.stringify({ permissions: { allow: ['Bash(npm test)'] }, hooks: { Stop: [{ hooks: [{ type: 'command', command: 'node my-stop.js' }] }] } }));
r = kit('5 adopt', C, '--intent', '기존 쇼핑몰', '--modules', LIB);
const kept = ['docs/PROGRESS.md', 'HANDOFF.md', 'docs/CHECKS.md'].every(f => read(C, f) === own[f]);
const cC = read(C, 'CLAUDE.md'), cS = JSON.parse(read(C, '.claude/settings.json'));
check(5, 'Existing project with its own CLAUDE.md, ledger, checks, handoff and a Stop hook', 'own files byte-identical; CLAUDE.md keeps its text and gains the orders block; their hook kept, ours added; permissions untouched',
  `own files kept ${kept}; own text ${cC.startsWith(own['CLAUDE.md'].trim().split('\n')[0])}; block ${/coolhan:orders:start[\s\S]*O-01[\s\S]*coolhan:orders:end/.test(cC)}; Stop hooks ${cS.hooks.Stop.length}; permissions ${JSON.stringify(cS.permissions.allow)}`,
  kept && cC.includes('Our rule: prices come from the fee table.') && /coolhan:orders:start[\s\S]*O-01[\s\S]*coolhan:orders:end/.test(cC) && cS.hooks.Stop.length === 2 && cS.hooks.Stop[0].hooks[0].command === 'node my-stop.js' && cS.permissions.allow[0] === 'Bash(npm test)');

// 6. idempotent
r = kit('6 again', C, '--json');
let j = {}; try { j = JSON.parse(r.out); } catch (_) { /* reported below */ }
check(6, 'Second run on the same folder', 'created 0, updated 0', `created ${(j.created || ['?']).length}, updated ${(j.updated || ['?']).length}`, Array.isArray(j.created) && !j.created.length && !j.updated.length);

// 7. tampered block restored, outside text kept
fs.writeFileSync(path.join(A, 'CLAUDE.md'), aO.replace(/- \*\*O-03[^\n]*\n/, '').replace('이 아래에 이 프로젝트에만 해당하는 규칙을 적는다.', '환율은 고시 환율만 쓴다.'));
kit('7 restore', A);
const a2 = read(A, 'CLAUDE.md');
check(7, 'An order deleted by hand inside the block; a project rule written outside it', 'order restored, project rule kept', `O-03 ${/O-03/.test(a2)}, project rule ${a2.includes('환율은 고시 환율만 쓴다.')}`, /O-03/.test(a2) && a2.includes('환율은 고시 환율만 쓴다.'));

// 8. arming in a kit project
const armed = () => has(A, '_workspace/_run-active.json');
const notArm = ['배포하라', '커밋하라', '이 버튼 색을 바꾸는 작업을 진행하라', '이어서 작업할 내용을 알려줘', '다음에 뭘 이어서 할까요?', '승인한다'];
const wrongly = [];
for (const p of notArm) { hook('8 no-arm', A, 'run-armer', JSON.stringify({ prompt: p })); if (armed()) { wrongly.push(p); fs.rmSync(path.join(A, '_workspace/_run-active.json')); } }
check(8, 'One-shot orders and questions in a kit project (6 prompts)', 'none arms the loop', wrongly.length ? `armed by: ${wrongly.join(' / ')}` : 'none armed', !wrongly.length);
const arms = ['이어서 진행하라', '계속 진행하라', '남은 작업 끝까지 완성하라'];
const failed = [];
for (const p of arms) { hook('9 arm', A, 'run-armer', JSON.stringify({ prompt: p })); if (!armed()) failed.push(p); else if (p !== arms[arms.length - 1]) fs.rmSync(path.join(A, '_workspace/_run-active.json')); }
check(9, 'The operator\'s own continuation words, no «쿨한» (3 prompts)', 'each arms the loop', failed.length ? `not armed by: ${failed.join(' / ')}` : 'all armed', !failed.length);

// 10–12. stop guard / ask guard in the armed project
r = hook('10 stop', A, 'stop-guard', '{}');
check(10, 'Armed, backlog U1 and U2 open, turn ends', 'stop blocked, remaining units named', `${/"decision":"block"/.test(r.out) ? 'block' : 'allow'}; names U1 ${/U1/.test(r.out)}`, /"decision":"block"/.test(r.out) && /U1/.test(r.out));
r = hook('11 ask', A, 'ask-guard', JSON.stringify({ tool_name: 'AskUserQuestion' }));
check(11, 'Armed, the agent tries to ask', 'question denied', /"permissionDecision":"deny"/.test(r.out) ? 'deny' : 'allow', /"permissionDecision":"deny"/.test(r.out));
write(A, '_workspace/_stop-approved.json', JSON.stringify({ reason: 'a real payment key is required and none exists' }));
r = hook('12 approved', A, 'stop-guard', '{}');
check(12, 'A recorded stop condition (missing real credential)', 'stop allowed', /"decision":"block"/.test(r.out) ? 'block' : 'allow', !/"decision":"block"/.test(r.out));

// 13. a kit project that is not armed is left alone
r = hook('13 idle', B, 'stop-guard', '{}');
check(13, 'Kit project with no armed run', 'stop allowed (ordinary sessions untouched)', /"decision":"block"/.test(r.out) ? 'block' : 'allow', !/"decision":"block"/.test(r.out));

// 14. outside a kit project the old rule holds
const D = mk('d-plain');
run('14 plain', path.join(HOME, '.claude', 'hooks', 'run-armer.js'), [], { cwd: D, input: JSON.stringify({ prompt: '이어서 진행하라' }) });
check(14, 'A folder without coolhan.project.json, same words', 'not armed (the harness command word is still required there)', has(D, '_workspace/_run-active.json') ? 'armed' : 'not armed', !has(D, '_workspace/_run-active.json'));

// 15. harness missing
const E = mk('e-no-harness');
write(E, 'coolhan.project.json', JSON.stringify({ home: path.join(TMP, 'nowhere') }));
fs.mkdirSync(path.join(E, 'scripts'), { recursive: true });
fs.copyFileSync(path.join(HOME, 'knowledge_base', 'project-kit', 'coolhan.js'), path.join(E, 'scripts', 'coolhan.js'));
const g = tool('15 gate', E, ['checks-run'], { noHomeEnv: true }), h = tool('15 hook', E, ['hook', 'stop-guard'], { noHomeEnv: true, input: '{}' }), w = tool('15 where', E, ['where'], { noHomeEnv: true });
check(15, 'Harness folder not found', 'gate exit 4 (not verified), hook exit 0 and no block (nobody trapped), where exit 4', `gate ${g.status}, hook ${h.status} ${/block/.test(h.out) ? 'block' : 'no block'}, where ${w.status}`, g.status === 4 && h.status === 0 && !/block/.test(h.out) && w.status === 4);

// 16. launcher refuses a path as a tool name
r = tool('16 traversal', A, ['../../.claude/hooks/stop-guard']);
check(16, 'Tool name that is a path', 'exit 2, nothing run', `exit ${r.status}`, r.status === 2);

// 17–20. module plan gate
const pd = (label, dir) => run(label, path.join(HOME, 'scripts', 'plan-doc-check.js'), [dir, '--modules', LIB, '--json']);
const mod = (out) => { try { const o = JSON.parse(out); return { rules: o.findings.filter(f => /module/.test(f.rule)).map(f => `${f.rule}${/B\d\d/.test(f.detail || '') ? ':' + (f.detail.match(/B\d\d/g) || []).join(',') : ''}`), stats: o.stats }; } catch (_) { return { rules: ['unparsed'], stats: {} }; } };
const P1 = mk('p1'); write(P1, 'MODULE_PLAN.md', plan);
let m = mod(pd('17 plan ok', P1).out);
check(17, 'Kit-generated module plan against the library', 'no module finding, 3 of 3 bundles answered', `${m.rules.length ? m.rules.join(' ') : 'no module finding'}, ${m.stats.bundles_answered}/${m.stats.bundles_required}`, !m.rules.length && m.stats.bundles_answered === 3 && m.stats.bundles_required === 3);
const P2 = mk('p2'); write(P2, 'MODULE_PLAN.md', plan.split('\n').filter(l => !l.startsWith('| B07 |')).join('\n'));
m = mod(pd('18 row removed', P2).out);
check(18, 'Row B07 removed', 'module-bundle-unanswered naming B07 only', m.rules.join(' ') || 'none', m.rules.length === 1 && m.rules[0] === 'module-bundle-unanswered:B07');
const P3 = mk('p3'); write(P3, 'MODULE_PLAN.md', plan.replace('| B21 | 세무 신고 | domain | 제외 |', '| B21 | 세무 신고 | domain | 나중에 정함 |'));
m = mod(pd('19 free text', P3).out);
check(19, 'Decision «나중에 정함» on B21', 'module-decision-invalid naming B21', m.rules.join(' ') || 'none', m.rules.some(x => x.startsWith('module-decision-invalid') && /B21/.test(x)));
const P4 = mk('p4'); write(P4, 'plan.md', '# 기획서\n\n본문.\n');
m = mod(pd('20 no table', P4).out);
check(20, 'Plan with no module table', 'no-module-table', m.rules.join(' ') || 'none', m.rules.some(x => x.startsWith('no-module-table')));

// 21–22. handoff
write(A, 'docs/PROGRESS.md', read(A, 'docs/PROGRESS.md'));
r = tool('21 handoff', A, ['handoff']);
const ho = read(A, 'HANDOFF.md');
check(21, 'handoff in the kit project', 'exit 0; state block carries the goal line and 0/6', `exit ${r.status}; goal ${ho.includes('유럽 중고 가구 구매대행 쇼핑몰')}; progress ${/0\/6/.test(ho)}`, r.status === 0 && ho.includes('유럽 중고 가구 구매대행 쇼핑몰') && /0\/6/.test(ho));
const F = mk('f-no-ledger');
r = run('22 no ledger', path.join(HOME, 'scripts', 'handoff-write.js'), ['--root', F]);
check(22, 'handoff with no ledger', 'exit 4, no HANDOFF.md written (nothing invented)', `exit ${r.status}, file ${has(F, 'HANDOFF.md')}`, r.status === 4 && !has(F, 'HANDOFF.md'));

// 23. usage errors write nothing
const G = mk('g-usage');
const u1 = kit('23 no intent', G), u2 = kit('23 bad deploy', G, '--intent', 'x', '--deploy', 'always');
check(23, 'No intent; deploy value outside the two allowed', 'exit 2 twice, folder still empty', `exit ${u1.status}, ${u2.status}; files ${fs.readdirSync(G).length}`, u1.status === 2 && u2.status === 2 && !fs.readdirSync(G).length);

// 24. registry
r = run('24 validate', path.join(HOME, 'scripts', 'field-lessons.js'), ['validate']);
const r2 = run('24 render', path.join(HOME, 'scripts', 'field-lessons.js'), ['render', '--check']);
check(24, 'Registry with orders: validate and derived doc', 'both exit 0', `validate ${r.status}, render --check ${r2.status}`, r.status === 0 && r2.status === 0);

// 25. the real module library, when this machine has it
if (fs.existsSync(path.join(REAL_LIB, '_specs', 'modules.json'))) {
  const H = mk('h-real');
  kit('25 real library', H, '--intent', '실제 저장소 대조', '--tags', 'ui,deploy,money,commerce,logistics', '--modules', REAL_LIB.split(path.sep).join('/'));
  const realPlan = mk('h-plan'); write(realPlan, 'MODULE_PLAN.md', read(H, 'docs/plan/MODULE_PLAN.md'));
  const o = run('25 real gate', path.join(HOME, 'scripts', 'plan-doc-check.js'), [realPlan, '--modules', REAL_LIB, '--json']);
  m = mod(o.out);
  check(25, 'Real module library on this machine (read-only)', 'one row per bundle, all answered, no module finding', `${m.stats.bundles_answered}/${m.stats.bundles_required}, ${m.rules.length ? m.rules.join(' ') : 'no module finding'}`, m.stats.bundles_required > 0 && m.stats.bundles_answered === m.stats.bundles_required && !m.rules.length);
} else {
  rows.push({ id: 25, scenario: 'Real module library on this machine', expected: 'one row per bundle', actual: 'NOT_RUN: library folder absent on this machine', ok: null });
}

const bad = rows.filter(x => x.ok === false);
const notRun = rows.filter(x => x.ok === null);
const table = rows.map(x => `| ${x.id} | ${x.scenario} | ${x.expected} | ${x.actual} | ${x.ok === null ? '○' : x.ok ? '✅' : '❌'} |`).join('\n');
fs.writeFileSync(path.join(__dirname, 'run-log.txt'), `track39 run ${new Date().toISOString().slice(0, 10)}: ${rows.length} scenarios, ${rows.length - bad.length - notRun.length} match, ${bad.length} mismatch, ${notRun.length} not run\n\n${table}\n\n${log.join('\n')}`);
console.log(table);
console.log(`\n${rows.length} scenarios · match ${rows.length - bad.length - notRun.length} · mismatch ${bad.length} · not run ${notRun.length}`);
try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (_) { /* temp folder is left for the OS to clear */ }
process.exit(bad.length ? 1 : 0);
