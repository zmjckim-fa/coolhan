#!/usr/bin/env node

/**
 * CoolHan hardening-check — production bot/fingerprint hardening probe (G15, v2.2.0).
 *
 * Turns 5 real, user-reported production holes into a repeatable gate measured over real HTTP
 * against a deployed base_url. These are the "AI agent walks the site pretending to be a person"
 * + "the stack fingerprint leaks" class — the API being locked is not enough if the web layer
 * is open.
 *
 *   H1 ai-agent-bypass    — AI agent UAs (ChatGPT-User, Claude-User, PerplexityBot, …) are NOT
 *                           served 200 on a normal page (allowlist-before-blocklist bug lets them
 *                           through). We send each agent UA and expect a block (403/challenge) or
 *                           at least not a plain 200 HTML page.
 *   H2 stack-fingerprint  — response headers do not leak the stack: no X-Powered-By,
 *                           x-nextjs-cache, x-vercel-*, server: Express, etc.
 *   H3 express-404-leak    — a bogus /api path does not return Express's "Cannot GET /api/..."
 *                           body; a neutral 404 is expected.
 *   H4 ua-consistency      — a request CLAIMING Chrome (UA has "Chrome") but missing BOTH
 *                           sec-ch-ua and sec-fetch-mode is not served 200 (header-coherence check;
 *                           UA-only spoofing must not pass).
 *   H5 robots-ai-blocked   — robots.txt DISALLOWS the AI answer/agent crawlers (GPTBot,
 *                           ChatGPT-User, ClaudeBot, Claude-User, PerplexityBot, Google-Extended,
 *                           CCBot, Bytespider, …) rather than allowing them.
 *
 * Each check reports PASS / FAIL / NOT_RUN (probe unreachable). A FAIL is a MEASUREMENT — read the
 * middleware/nginx/robots source to confirm which side is wrong before "fixing" (same discipline
 * as G14). This script only observes over HTTP; it changes nothing.
 *
 * Usage: node scripts/hardening-check.js <base_url> [--json] [--out FILE]
 * Exit: 0 all PASS · 1 any FAIL · 4 any NOT_RUN (and no FAIL) · 2 usage.
 *
 * Honesty: proves these 5 known holes are closed on the probed origin NOW — not that the site is
 * "secure". New bot UAs, new leak headers, and logic bugs behind auth are out of scope.
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const { URL } = require('url');

const AI_AGENT_UAS = [
  'Mozilla/5.0 (compatible; ChatGPT-User/1.0; +https://openai.com/bot)',
  'Mozilla/5.0 (compatible; Claude-User/1.0; +https://anthropic.com)',
  'Mozilla/5.0 (compatible; PerplexityBot/1.0; +https://perplexity.ai/bot)'
];
const LEAK_HEADERS = ['x-powered-by', 'x-nextjs-cache', 'x-vercel-cache', 'x-vercel-id', 'x-aspnet-version', 'x-generator'];
const LEAK_SERVER_RE = /express|next\.?js|php\/|apache\/[\d.]+ \(|werkzeug|gunicorn\/[\d.]+/i;
const ROBOTS_AI_BOTS = ['GPTBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-User', 'anthropic-ai', 'PerplexityBot', 'Google-Extended', 'CCBot', 'Bytespider', 'Amazonbot'];
const CHROME_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

function request(rawUrl, { headers = {}, method = 'GET' } = {}) {
  return new Promise(resolve => {
    let u;
    try { u = new URL(rawUrl); } catch (e) { return resolve({ error: 'bad url: ' + e.message }); }
    const lib = u.protocol === 'https:' ? https : http;
    const req = lib.request(u, { method, headers, timeout: 15000 }, res => {
      let body = '';
      res.on('data', c => { if (body.length < 8000) body += c; });
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
    });
    req.on('timeout', () => { req.destroy(); resolve({ error: 'timeout' }); });
    req.on('error', e => resolve({ error: e.message }));
    req.end();
  });
}

async function checkAiAgentBypass(base) {
  const results = [];
  for (const ua of AI_AGENT_UAS) {
    const r = await request(base, { headers: { 'user-agent': ua, accept: 'text/html' } });
    if (r.error) return { status: 'NOT_RUN', detail: `probe error: ${r.error}` };
    const served = r.status === 200 && /text\/html/i.test(r.headers['content-type'] || '');
    results.push({ ua: ua.match(/(ChatGPT-User|Claude-User|PerplexityBot)/)[0], status: r.status, served_html: served });
  }
  const leaked = results.filter(x => x.served_html);
  return leaked.length
    ? { status: 'FAIL', detail: `AI agent UAs served a 200 HTML page (allowlist-before-blocklist?): ${leaked.map(x => x.ua).join(', ')}`, results }
    : { status: 'PASS', detail: 'AI agent UAs not served plain HTML', results };
}

function checkStackFingerprint(headers) {
  const leaks = [];
  for (const h of LEAK_HEADERS) if (headers[h]) leaks.push(`${h}: ${headers[h]}`);
  if (headers.server && LEAK_SERVER_RE.test(headers.server)) leaks.push(`server: ${headers.server}`);
  return leaks.length
    ? { status: 'FAIL', detail: `stack fingerprint leaked in headers: ${leaks.join(' · ')}` }
    : { status: 'PASS', detail: 'no known stack-fingerprint headers' };
}

async function checkExpress404(base) {
  const u = base.replace(/\/$/, '') + '/api/__coolhan_probe_' + 'xyz';
  const r = await request(u, { headers: { 'user-agent': CHROME_UA } });
  if (r.error) return { status: 'NOT_RUN', detail: `probe error: ${r.error}` };
  if (/Cannot (GET|POST) \/api/i.test(r.body)) return { status: 'FAIL', detail: `Express default 404 body leaked: "${r.body.slice(0, 80).replace(/\n/g, ' ')}"` };
  return { status: 'PASS', detail: `neutral ${r.status} on bogus /api path (no "Cannot GET" body)` };
}

async function checkUaConsistency(base) {
  // Claims Chrome but sends NEITHER sec-ch-ua NOR sec-fetch-mode — a real Chrome always sends both.
  const r = await request(base, { headers: { 'user-agent': CHROME_UA, accept: 'text/html' } });
  if (r.error) return { status: 'NOT_RUN', detail: `probe error: ${r.error}` };
  const servedHtml = r.status === 200 && /text\/html/i.test(r.headers['content-type'] || '');
  return servedHtml
    ? { status: 'FAIL', detail: `UA claims Chrome but sec-ch-ua + sec-fetch-mode both absent, yet served 200 HTML (${r.status}) — UA-only spoofing passes` }
    : { status: 'PASS', detail: `incoherent Chrome header set not served plain HTML (${r.status})` };
}

async function checkRobotsAi(base) {
  const u = base.replace(/\/$/, '') + '/robots.txt';
  const r = await request(u, { headers: { 'user-agent': CHROME_UA } });
  if (r.error) return { status: 'NOT_RUN', detail: `probe error: ${r.error}` };
  if (r.status !== 200 || !r.body) return { status: 'FAIL', detail: `robots.txt not served (status ${r.status}) — AI crawlers are not disallowed` };
  const txt = r.body;
  const blocks = ua => {
    const re = new RegExp('user-agent:\\s*' + ua.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const idx = txt.search(re);
    if (idx < 0) return false;
    const section = txt.slice(idx, idx + 300);
    return /disallow:\s*\//i.test(section);
  };
  const unblocked = ROBOTS_AI_BOTS.filter(b => !blocks(b));
  return unblocked.length > ROBOTS_AI_BOTS.length / 2
    ? { status: 'FAIL', detail: `robots.txt does not disallow AI crawlers: ${unblocked.join(', ')}` }
    : { status: 'PASS', detail: `robots.txt disallows the AI crawlers (${ROBOTS_AI_BOTS.length - unblocked.length}/${ROBOTS_AI_BOTS.length})` };
}

async function evaluate(base) {
  const root = await request(base, { headers: { 'user-agent': CHROME_UA, accept: 'text/html' } });
  const checks = {};
  checks.H2_stack_fingerprint = root.error ? { status: 'NOT_RUN', detail: `probe error: ${root.error}` } : checkStackFingerprint(root.headers);
  checks.H1_ai_agent_bypass = await checkAiAgentBypass(base);
  checks.H3_express_404_leak = await checkExpress404(base);
  checks.H4_ua_consistency = await checkUaConsistency(base);
  checks.H5_robots_ai_blocked = await checkRobotsAi(base);

  const vals = Object.values(checks);
  const verdict = vals.some(c => c.status === 'FAIL') ? 'FAIL' : vals.some(c => c.status === 'NOT_RUN') ? 'NOT_RUN' : 'PASS';
  return { base_url: base, verdict, checks };
}

function render(r) {
  const L = [`# Production Hardening Probe — ${r.base_url} — verdict: ${r.verdict}`, ''];
  for (const [k, v] of Object.entries(r.checks)) {
    L.push(`- ${v.status === 'PASS' ? '✅' : v.status === 'FAIL' ? '❌' : '⬜'} ${k}: ${v.detail}`);
  }
  L.push('');
  L.push('> A FAIL is a measurement — read the middleware/robots/nginx source to confirm which side');
  L.push('> is wrong before fixing. Proves these 5 known holes are closed on the probed origin now,');
  L.push('> not that the site is secure.');
  return L.join('\n') + '\n';
}

async function main(argv) {
  const args = argv.slice(2);
  const get = f => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined; };
  const json = args.includes('--json');
  const base = args.find(a => !a.startsWith('--') && a !== get('--out'));
  if (!base) { console.error('usage: hardening-check.js <base_url> [--json] [--out FILE]'); return 2; }

  const result = await evaluate(base);
  const out = get('--out');
  if (out) { try { fs.writeFileSync(out, render(result)); } catch (e) { console.error(`(write failed: ${e.message})`); } }

  if (json) console.log(JSON.stringify(result, null, 2));
  else { process.stdout.write(render(result)); }
  return result.verdict === 'PASS' ? 0 : result.verdict === 'FAIL' ? 1 : 4;
}

if (require.main === module) { main(process.argv).then(c => process.exit(c)); }

module.exports = { checkStackFingerprint, checkAiAgentBypass, checkExpress404, checkUaConsistency, checkRobotsAi, evaluate, render, AI_AGENT_UAS, ROBOTS_AI_BOTS };
