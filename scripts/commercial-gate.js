#!/usr/bin/env node

/**
 * CoolHan commercial-gate — 상용화 가능 여부 판정 (G14, v2.1.0).
 *
 * Decides whether a web service is commercially shippable — NOT by "does it have integrations"
 * but by the five user-facing criteria, each measured against PRODUCTION over real HTTP:
 *
 *   items    (항목)   every menu's input fields actually save and re-load
 *   save     (저장)   partial/duplicate/concurrent saves never lose or double data
 *   delivery (전송)   publish/send/export actually arrives; failures state reason + next action
 *   i18n     (텍스트) every customer-visible string appears in the selected language (DE/EN/KO)
 *   design   (디자인) real browser shows no overlap/clipping/horizontal scroll/tiny tap targets
 *
 * The gate is honest by construction:
 *   - Each criterion is measured ONLY by its "keepers" — repeatable scripts/tests declared in a
 *     per-project config. A criterion with no keeper is NOT_RUN, never PASS (C10: local
 *     reasoning and one-off manual checks are not evidence that persists).
 *   - Keepers run as real child processes with captured exit/output; the gate re-runs them
 *     anytime (post-deploy, in CI, after every fix) — the "keeper" IS the regression guard.
 *   - A failing measurement is a MEASUREMENT, not automatically a defect: the verdict file
 *     carries each failure's evidence tail so a human/agent reads the source and decides which
 *     side is wrong before "fixing".
 *
 * Config (per project, e.g. commercial-gate.config.json):
 * {
 *   "service": "coolhanx.com",
 *   "base_url": "https://coolhanx.com",
 *   "criteria": {
 *     "items":    [ { "id": "invoice-fields-roundtrip", "keeper": "node checks/items-invoice.js" } ],
 *     "save":     [ { "id": "double-submit-idempotent", "keeper": "node checks/save-dup.js" } ],
 *     "delivery": [ { "id": "email-send-arrives",      "keeper": "node checks/delivery-email.js" } ],
 *     "i18n":     [ { "id": "de-en-ko-coverage",       "keeper": "node checks/i18n-scan.js" } ],
 *     "design":   [ { "id": "no-overlap-1280-768-360", "keeper": "python checks/browser_layout.py" } ]
 *   }
 * }
 *
 * Usage: node scripts/commercial-gate.js <config.json> [--out FILE] [--date YYYYMMDD] [--json]
 *   default out: _workspace/COMMERCIAL_VERDICT_<date>.md
 * Exit: 0 READY · 1 BLOCKED (a keeper failed) · 4 NOT_READY (criterion unmeasured) · 2 usage.
 *
 * Honesty: READY means "every declared keeper passed against production NOW and every criterion
 * has at least one keeper" — it does not prove criteria the keepers don't cover; growing keeper
 * coverage is the ongoing work.
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const https = require('https');
const http = require('http');

const CRITERIA = ['items', 'save', 'delivery', 'i18n', 'design'];
const LABELS = { items: '항목(저장·재조회)', save: '저장(부분/중복/동시)', delivery: '전송(도착+실패 안내)', i18n: '텍스트(DE/EN/KO)', design: '디자인(실브라우저)' };
const TAIL = 800;

function probe(url) {
  return new Promise(resolve => {
    try {
      const lib = url.startsWith('https') ? https : http;
      const req = lib.request(url, { method: 'HEAD', timeout: 15000 }, res => {
        resolve({ reachable: true, status: res.statusCode });
        res.resume();
      });
      req.on('timeout', () => { req.destroy(); resolve({ reachable: false, error: 'timeout' }); });
      req.on('error', e => resolve({ reachable: false, error: e.message }));
      req.end();
    } catch (e) { resolve({ reachable: false, error: e.message }); }
  });
}

function runKeeper(k, cwd, env) {
  const r = spawnSync(k.keeper, { shell: true, cwd, encoding: 'utf8', timeout: 10 * 60 * 1000, env });
  return {
    id: k.id, keeper: k.keeper,
    status: r.status === 0 ? 'PASS' : 'FAIL',
    exit: r.status === null ? -1 : r.status,
    tail: ((r.stdout || '') + (r.stderr || '')).slice(-TAIL)
  };
}

async function evaluate(config, opts = {}) {
  const result = { service: config.service, base_url: config.base_url, criteria: {}, probe: null };
  result.probe = await probe(config.base_url);
  const env = Object.assign({}, process.env, { CG_BASE_URL: config.base_url });

  for (const c of CRITERIA) {
    const keepers = (config.criteria && config.criteria[c]) || [];
    if (keepers.length === 0) {
      result.criteria[c] = { status: 'NOT_RUN', keepers: [], note: 'no keeper declared — unmeasured, not passed' };
      continue;
    }
    const runs = keepers.map(k => (opts.runner || runKeeper)(k, opts.cwd || '.', env));
    result.criteria[c] = {
      status: runs.every(r => r.status === 'PASS') ? 'PASS' : 'FAIL',
      keepers: runs
    };
  }

  const anyFail = CRITERIA.some(c => result.criteria[c].status === 'FAIL');
  const anyNotRun = CRITERIA.some(c => result.criteria[c].status === 'NOT_RUN');
  result.verdict = anyFail ? 'BLOCKED' : anyNotRun ? 'NOT_READY' : 'READY';
  return result;
}

function renderVerdict(r, dateStr) {
  const L = [];
  L.push(`# 상용화 판정 (Commercial Verdict) — ${r.service} — ${dateStr}`);
  L.push('');
  L.push(`- 운영 도달성: ${r.probe.reachable ? `HTTP ${r.probe.status} (실측)` : `❌ 도달 실패: ${r.probe.error} — 아래 측정은 운영 실측이 아닐 수 있음`}`);
  L.push('');
  L.push(`## ① 상용화 가부: **${r.verdict === 'READY' ? '가 (READY)' : r.verdict === 'BLOCKED' ? '불가 (BLOCKED)' : '판정 불가 (NOT_READY — 미측정 항목 존재)'}**`);
  L.push('');
  L.push('| 기준 | 상태 | 지킴이(keeper) |');
  L.push('|---|---|---|');
  for (const c of CRITERIA) {
    const cr = r.criteria[c];
    const keepers = cr.keepers.length ? cr.keepers.map(k => `\`${k.id}\`:${k.status}`).join(' · ') : '없음';
    L.push(`| ${LABELS[c]} | ${cr.status === 'PASS' ? '✅ PASS' : cr.status === 'FAIL' ? '❌ FAIL' : '⬜ NOT_RUN'} | ${keepers} |`);
  }
  L.push('');
  L.push('## ② 남은 차단 항목');
  const fails = CRITERIA.flatMap(c => (r.criteria[c].keepers || []).filter(k => k.status === 'FAIL').map(k => ({ c, k })));
  if (!fails.length) L.push('- 없음');
  for (const { c, k } of fails) {
    L.push(`- [${LABELS[c]}] ${k.id} (exit ${k.exit}) — 측정값이 곧 결함은 아님: 소스 확인 후 결함/측정오류 판별할 것`);
    L.push('  ```');
    L.push('  ' + (k.tail || '(no output)').split('\n').slice(-6).join('\n  '));
    L.push('  ```');
  }
  L.push('');
  L.push('## ③ 측정되지 않은 칸 (정직 신고)');
  const notRun = CRITERIA.filter(c => r.criteria[c].status === 'NOT_RUN');
  if (!notRun.length) L.push('- 없음 — 5개 기준 모두 지킴이가 존재하고 실행됨');
  for (const c of notRun) L.push(`- ${LABELS[c]}: 지킴이 미선언 → NOT_RUN (통과 아님). 지킴이 스크립트를 만들어 config에 등록해야 측정됨.`);
  L.push('');
  L.push('> READY의 의미: 선언된 모든 지킴이가 지금 운영에 대해 통과했고 5개 기준 전부에 지킴이가 있다는 것.');
  L.push('> 지킴이가 덮지 않는 결함까지 없다는 증명이 아니다 — 지킴이 커버리지 확장이 계속되는 일이다.');
  return L.join('\n') + '\n';
}

async function main(argv) {
  const args = argv.slice(2);
  const get = f => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined; };
  const json = args.includes('--json');
  const configFile = args.find(a => !a.startsWith('--') && a !== get('--out') && a !== get('--date'));
  if (!configFile) { console.error('usage: commercial-gate.js <config.json> [--out FILE] [--date YYYYMMDD] [--json]'); return 2; }

  let config;
  try { config = JSON.parse(fs.readFileSync(configFile, 'utf8')); }
  catch (e) { console.error(`✗ commercial-gate: cannot read ${configFile}: ${e.message}`); return 2; }
  if (!config.base_url || !config.service) { console.error('✗ commercial-gate: config needs service + base_url'); return 2; }

  const dateStr = get('--date') || new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const out = get('--out') || path.join('_workspace', `COMMERCIAL_VERDICT_${dateStr}.md`);

  const result = await evaluate(config, { cwd: path.dirname(path.resolve(configFile)) });
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, renderVerdict(result, dateStr));

  if (json) console.log(JSON.stringify(result, null, 2));
  else console.log(`${result.verdict === 'READY' ? '✔' : '✗'} commercial-gate: ${result.verdict} — ${out}`);
  return result.verdict === 'READY' ? 0 : result.verdict === 'BLOCKED' ? 1 : 4;
}

if (require.main === module) { main(process.argv).then(code => process.exit(code)); }

module.exports = { evaluate, renderVerdict, CRITERIA, runKeeper };
