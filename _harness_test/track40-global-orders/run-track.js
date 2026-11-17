#!/usr/bin/env node
// Track 40: G24 global standing orders, kit drift check, install guard, legacy defects closed.
// Real child processes against temp folders. Usage: node _harness_test/track40-global-orders/run-track.js
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const HOME = path.resolve(__dirname, '..', '..');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'track40-'));
const log = [], rows = [];
const forms = (p) => [p.split(path.sep).join('\\\\'), p, p.split(path.sep).join('/')];
const MASK = [[TMP, '<tmp>'], [HOME, '<home>'], [os.homedir(), '<user>']];
const clean = (s) => MASK.reduce((out, [p, name]) => forms(p).reduce((o, f) => o.split(f).join(name), out), String(s || ''));
const mk = (name) => { const d = path.join(TMP, name); fs.mkdirSync(d, { recursive: true }); return d; };
function run(label, script, args, opts = {}) {
  const r = spawnSync(process.execPath, [path.join(HOME, 'scripts', script), ...args], { cwd: opts.cwd || HOME, encoding: 'utf8' });
  log.push(`$ [${label}] node scripts/${script} ${clean(args.join(' '))}\n  exit ${r.status}\n${clean((r.stdout || '') + (r.stderr || '')).split('\n').slice(0, 8).map(l => '  ' + l).join('\n')}\n`);
  return { status: r.status, out: (r.stdout || '') + (r.stderr || '') };
}
const check = (id, scenario, expected, actual, ok) => rows.push({ id, scenario, expected, actual: clean(actual), ok: ok === null ? null : !!ok });
const glob = (label, home, ...args) => run(label, 'install-global.js', ['--claude-home', home, '--modules', '', ...args]);
const OWN = '# 내 전역 규칙\n\n- 칭찬하지 않는다.\n- 이미지는 JPG로 저장한다.\n';

// 1. not installed
const A = mk('a-home');
let r = glob('1 check empty', A, '--check');
check(1, 'No instruction file on the machine, --check', 'exit 4 (not installed is not a pass), nothing written', `exit ${r.status}, files ${fs.readdirSync(A).length}`, r.status === 4 && !fs.readdirSync(A).length);

// 2. install beside the operator's own rules
fs.writeFileSync(path.join(A, 'CLAUDE.md'), OWN);
fs.writeFileSync(path.join(A, 'settings.json'), '{"hooks":{"Stop":[]},"model":"x"}');
r = glob('2 install', A);
let s = fs.readFileSync(path.join(A, 'CLAUDE.md'), 'utf8');
const reg = JSON.parse(fs.readFileSync(path.join(HOME, 'knowledge_base', 'field-lessons.json'), 'utf8'));
const allOrders = reg.orders.every(o => s.includes(`**${o.id} ${o.title}**`));
check(2, 'Install into a file that already holds the operator\'s rules', 'own text first and byte-identical; every order present; harness path and kit rule present; earlier file kept beside it',
  `own text ${s.startsWith(OWN.trimEnd())}; orders ${reg.orders.filter(o => s.includes(`**${o.id} `)).length}/${reg.orders.length}; kit rule ${/new-project\.js/.test(s)}; kept copy ${fs.readFileSync(path.join(A, 'CLAUDE.md.before-coolhan'), 'utf8') === OWN}`,
  r.status === 0 && s.startsWith(OWN.trimEnd()) && allOrders && /new-project\.js/.test(s) && fs.readFileSync(path.join(A, 'CLAUDE.md.before-coolhan'), 'utf8') === OWN);

// 3. settings untouched
check(3, 'User settings file beside it', 'unchanged (no hook is installed for every session)', fs.readFileSync(path.join(A, 'settings.json'), 'utf8') === '{"hooks":{"Stop":[]},"model":"x"}' ? 'unchanged' : 'changed', fs.readFileSync(path.join(A, 'settings.json'), 'utf8') === '{"hooks":{"Stop":[]},"model":"x"}');

// 4. idempotent
r = glob('4 again', A);
check(4, 'Second run', 'exit 0, file byte-identical', `exit ${r.status}, identical ${fs.readFileSync(path.join(A, 'CLAUDE.md'), 'utf8') === s}`, r.status === 0 && fs.readFileSync(path.join(A, 'CLAUDE.md'), 'utf8') === s);

// 5–6. stale block detected and restored
fs.writeFileSync(path.join(A, 'CLAUDE.md'), s.replace(/- \*\*O-03[^\n]*\n/, '') + '\n- 나중에 덧붙인 내 규칙.\n');
r = glob('5 stale', A, '--check');
check(5, 'One order deleted by hand inside the block', '--check exit 1 (stale)', `exit ${r.status}`, r.status === 1);
glob('6 restore', A);
const s2 = fs.readFileSync(path.join(A, 'CLAUDE.md'), 'utf8');
check(6, 'Re-run after the hand edit', 'order restored; the rule the operator appended outside the block kept; first kept copy not replaced',
  `O-03 ${/O-03/.test(s2)}; appended rule ${s2.includes('나중에 덧붙인 내 규칙.')}; kept copy original ${fs.readFileSync(path.join(A, 'CLAUDE.md.before-coolhan'), 'utf8') === OWN}`,
  /O-03/.test(s2) && s2.includes('나중에 덧붙인 내 규칙.') && fs.readFileSync(path.join(A, 'CLAUDE.md.before-coolhan'), 'utf8') === OWN);

// 7. remove
const B = mk('b-home'); fs.writeFileSync(path.join(B, 'CLAUDE.md'), OWN);
glob('7 install', B); r = glob('7 remove', B, '--remove');
const after = fs.readFileSync(path.join(B, 'CLAUDE.md'), 'utf8');
const r7 = glob('7 check', B, '--check');
check(7, 'Install then --remove', 'file equals the original byte for byte; --check back to 4', `identical ${after === OWN}; check ${r7.status}`, r.status === 0 && after === OWN && r7.status === 4);

// 8. usage
const C = mk('c-home');
const u1 = glob('8 flag', C, '--force'), u2 = glob('8 stray', C, 'stray'), u3 = glob('8 dry', C, '--dry');
check(8, 'Unknown flag; stray argument; --dry', 'exit 2, 2, 0 and nothing written', `exit ${u1.status}, ${u2.status}, ${u3.status}; files ${fs.readdirSync(C).length}`, u1.status === 2 && u2.status === 2 && u3.status === 0 && !fs.readdirSync(C).length);

// 9. the kit refuses the harness and the module library
const LIB = mk('library'); fs.mkdirSync(path.join(LIB, '_specs')); fs.writeFileSync(path.join(LIB, '_specs', 'modules.json'), '{"bundles":{}}');
const g1 = run('9 harness', 'new-project.js', [HOME, '--intent', 'x', '--dry']);
const g2 = run('9 library', 'new-project.js', [LIB, '--intent', 'x', '--modules', LIB]);
check(9, 'Kit pointed at the harness folder and at the module library', 'exit 2 twice; neither folder gains a file', `exit ${g1.status}, ${g2.status}; harness config ${fs.existsSync(path.join(HOME, 'coolhan.project.json'))}; library files ${fs.readdirSync(LIB).join(',')}`,
  g1.status === 2 && g2.status === 2 && !fs.existsSync(path.join(HOME, 'coolhan.project.json')) && fs.readdirSync(LIB).join(',') === '_specs');

// 10–13. kit drift check
const P = mk('p-project');
const k0 = run('10 no kit', 'new-project.js', [P, '--check']);
check(10, 'new-project --check on a folder without the kit', 'exit 4, nothing written', `exit ${k0.status}, files ${fs.readdirSync(P).length}`, k0.status === 4 && !fs.readdirSync(P).length);
run('11 install', 'new-project.js', [P, '--intent', 'x', '--modules', '']);
fs.appendFileSync(path.join(P, 'CLAUDE.md'), '\n환율은 고시 환율만 쓴다.\n');
const k1 = run('11 current', 'new-project.js', [P, '--check']);
check(11, 'Fresh kit plus a project rule written outside the block', 'exit 0 (the project\'s own text is not drift)', `exit ${k1.status}`, k1.status === 0);
const cf = path.join(P, 'CLAUDE.md'); const broken = fs.readFileSync(cf, 'utf8').replace(/- \*\*O-07[^\n]*\n/, '');
fs.writeFileSync(cf, broken);
const sf = path.join(P, '.claude', 'settings.json'); const st = JSON.parse(fs.readFileSync(sf, 'utf8')); delete st.hooks.Stop; fs.writeFileSync(sf, JSON.stringify(st, null, 2) + '\n');
const k2 = run('12 stale', 'new-project.js', [P, '--check']);
check(12, 'An order deleted and the Stop hook removed', 'exit 1 naming CLAUDE.md and .claude/settings.json; nothing rewritten by the check', `exit ${k2.status}; names ${/CLAUDE\.md/.test(k2.out)} ${/settings\.json/.test(k2.out)}; rewritten ${fs.readFileSync(cf, 'utf8') !== broken}`,
  k2.status === 1 && /CLAUDE\.md/.test(k2.out) && /settings\.json/.test(k2.out) && fs.readFileSync(cf, 'utf8') === broken);
run('13 refresh', 'new-project.js', [P, '--refresh']);
const k3 = run('13 current', 'new-project.js', [P, '--check']);
check(13, '--refresh then --check', 'exit 0; project rule still there', `exit ${k3.status}; rule ${fs.readFileSync(cf, 'utf8').includes('환율은 고시 환율만 쓴다.')}`, k3.status === 0 && fs.readFileSync(cf, 'utf8').includes('환율은 고시 환율만 쓴다.'));

// 14–15. legacy defects closed (self-run)
const ss = run('14 single source', 'single-source-check.js', ['.', '--skip-dirs', 'docs', '--json']);
let dup = '?'; try { dup = JSON.parse(ss.out).counts.duplicate_helpers; } catch (_) { /* reported as ? */ }
check(14, 'Harness self-scan after moving get / parseFlags / readText into scripts/lib (D-2, D-3, D-4)', 'duplicate helpers 0', `duplicate helpers ${dup}`, dup === 0);
const fl = run('15 lessons', 'field-lessons.js', ['check', '.', '--skip-dirs', 'docs', '--json']);
let f05 = '?'; try { const o = JSON.parse(fl.out); f05 = (o.counts || {})['F-05']; } catch (_) { /* reported as ? */ }
check(15, 'Harness self-scan for swallowed errors (D-8)', 'F-05 hits 0', `F-05 ${f05}`, f05 === 0);

// 16. this machine
const real = run('16 this machine', 'install-global.js', ['--check']);
check(16, 'This machine\'s own instruction file', 'exit 0 (installed and current) or NOT_RUN where not installed', real.status === 0 ? 'exit 0, current' : real.status === 4 ? 'NOT_RUN: not installed on this machine' : `exit ${real.status}`, real.status === 0 ? true : real.status === 4 ? null : false);

const bad = rows.filter(x => x.ok === false), notRun = rows.filter(x => x.ok === null);
const table = rows.map(x => `| ${x.id} | ${x.scenario} | ${x.expected} | ${x.actual} | ${x.ok === null ? '○' : x.ok ? '✅' : '❌'} |`).join('\n');
fs.writeFileSync(path.join(__dirname, 'run-log.txt'), `track40 run ${new Date().toISOString().slice(0, 10)}: ${rows.length} scenarios, ${rows.length - bad.length - notRun.length} match, ${bad.length} mismatch, ${notRun.length} not run\n\n${table}\n\n${log.join('\n')}`);
console.log(table);
console.log(`\n${rows.length} scenarios · match ${rows.length - bad.length - notRun.length} · mismatch ${bad.length} · not run ${notRun.length}`);
try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (_) { /* temp folder is left for the OS to clear */ }
process.exit(bad.length ? 1 : 0);
