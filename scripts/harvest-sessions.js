#!/usr/bin/env node

/**
 * CoolHan session learning (G18, v2.6.0) — every session's work accrues into the harness.
 *
 * Reads this machine's Claude Code session records (`~/.claude/projects/<project>/`), distills what the
 * operator keeps saying (command patterns), what went wrong and how it was solved (incidents, lessons),
 * the rules the operator set (feedback memories) and the security-hardening list — and writes a compact,
 * regenerated DIGEST.md that agents read (orchestrator Phase 0) plus an append-only evidence store that
 * self-growth.js (G17) mines for new improvement candidates.
 *
 * Sources (allow-list; raw transcripts are NEVER copied):
 *   1. memory/*.md          curated lessons/rules per project (feedback · user · project · reference)
 *   2. human utterances     `type:"user"` records typed by a person (tool results, sub-agent reports,
 *                           system notices, pasted blocks and summaries are filtered out)
 *   3. project docs         docs/DECISIONS.md · CLAUDE.md · HANDOFF.md of each project (found via the
 *                           transcripts' cwd) — incident / security lines, with file:line provenance
 *
 * Safety: every stored string is masked first (keys, tokens, passwords, JWT, long hashes, e-mail, phone,
 * IPv4, URL credentials). Output lives in `.coolhan-private/learned/` which is git-ignored — the harness
 * repo has a PUBLIC remote, so learned data must never be committed.
 *
 * Usage: node scripts/harvest-sessions.js [--home DIR] [--out DIR] [--quiet] [--json] [--rebuild] [--brief]
 * Exit: 0 always for harvest runs (it is a background observer — a hook must never break a session);
 *       2 only on bad arguments.
 *
 * Honest bounds: this account on this machine only · keyword classification, not understanding ·
 * masking covers known patterns (proper nouns are not detectable → private folder) · advisory, not a gate.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

const DIGEST_MAX_BYTES = 16 * 1024;

/* ───────────────────────── masking ───────────────────────── */

const REDACTIONS = [
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?(?:-----END [A-Z ]*PRIVATE KEY-----|$)/g, '[private-key]'],
  [/\b(?:sk|pk|rk)_(?:live|test)_[A-Za-z0-9]{8,}\b/g, '[key]'],
  [/\bgh[pousr]_[A-Za-z0-9]{20,}\b/g, '[key]'],
  [/\bxox[abprs]-[A-Za-z0-9-]{10,}\b/g, '[key]'],
  [/\bAKIA[0-9A-Z]{16}\b/g, '[key]'],
  [/\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{4,}/g, '[jwt]'],
  [/\b(https?:\/\/)[^\s/@:]+:[^\s/@]+@/gi, '$1[cred]@'],
  [/((?:password|passwd|pwd|passphrase|secret|token|api[_-]?key|apikey|authorization|bearer|비밀번호|비번|암호|시크릿|토큰)\s*[:=：]\s*)(\S+)/gi, '$1[redacted]'],
  [/\b[A-Fa-f0-9]{32,}\b/g, '[hash]'],
  [/[A-Za-z0-9+/_-]{40,}={0,2}/g, '[blob]'],
  [/[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/g, '[email]'],
  [/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, '[ip]'],
  [/\+\d[\d\s().-]{8,}\d/g, '[phone]'],
  [/\b0\d{1,2}[\s.-]?\d{3,4}[\s.-]?\d{4}\b/g, '[phone]'],
];

function redact(text) {
  let t = String(text == null ? '' : text);
  for (const [re, rep] of REDACTIONS) t = t.replace(re, rep);
  return t;
}

/* ───────────────────────── classification ───────────────────────── */

const THEMES = {
  'verify-before-done': /완료|검증|실데이터|실제로 ?확인|확인했|테스트|검수|증거/,
  'brevity': /간결|짧게|설명 ?최소|줄여|요약만/,
  'no-narration': /독백|진행 ?알림|작업 중.{0,6}(글|말)|조용히/,
  'autonomy': /스스로|알아서|직접 ?(찾|해)|묻지|이어서 ?(진행|해)|계속 ?(진행|해)|멈추지|끝까지/,
  'plan-first': /분석.{0,12}기획|기획.{0,12}(먼저|하고|다)|설계|계획/,
  'density-layout': /스크롤|여백|2칸|한 ?줄|재?배치|가독/,
  'dedupe': /중복/,
  'deploy': /배포/,
  'security': /보안|취약|인젝션|비밀번호|토큰|권한|암호화|해킹|유출|XSS|CSRF|인증/i,
  'no-mock-hardcode': /mock|하드코딩|가짜|더미/i,
  'correction': /아니|틀렸|잘못|왜 |안 ?(돼|된다|나온|보인|열린)|오류|에러/,
  'scope-all': /전부|모두|전체|100%|빠짐없이|모든/,
  'design-quality': /디자인|예쁘|판독|글자|정리/,
};
const IMPERATIVE = /(하라|해라|해줘|하세요|명령이다|반드시|절대|금지|꼭|해\.?$)/;
const INCIDENT = /사고|장애|크래시|재발 ?방지|롤백|rollback|버그|결함|실패했|오탐|회귀|regression/i;
const SECURITY = /보안|취약|인젝션|injection|XSS|CSRF|SSRF|IDOR|유출|해킹|암호화|시크릿|secret|권한 ?(상승|우회|누락|과다)|인증 ?(우회|누락)|토큰 ?(노출|유출)|비밀번호|노출됐|노출될/i;

function classify(text) {
  text = String(text).slice(0, 300);   // 길게 붙여 넣은 자료의 뒤쪽 단어로 주제가 오염되지 않게 앞부분만 본다
  const themes = Object.entries(THEMES).filter(([, re]) => re.test(text)).map(([k]) => k);
  return { themes, imperative: IMPERATIVE.test(text) };
}

/* ───────────────────────── human utterance filter ───────────────────────── */

const SYSTEM_PREFIX = /^\s*<(?:system-reminder|task-notification|command-name|command-message|local-command|ide_|user-prompt-submit-hook)|^\s*(?:Caveat:|This session is being continued|\[Request interrupted)/;

/** The text a person actually typed in this record, or null (tool results, sub-agent reports, notices, summaries). */
function humanText(rec) {
  if (!rec || rec.type !== 'user' || rec.isMeta || rec.isSidechain) return null;
  const kind = rec.origin && rec.origin.kind;
  if (kind && kind !== 'human') return null;
  const c = rec.message && rec.message.content;
  let t = null;
  if (typeof c === 'string') t = c;
  else if (Array.isArray(c)) {
    if (c.some((x) => x && x.type === 'tool_result')) return null;
    t = c.filter((x) => x && x.type === 'text').map((x) => x.text).join('\n');
  }
  if (!t) return null;
  t = t.replace(/<pasted_content[^>]*>[\s\S]*?<\/pasted_content[^>]*>/g, ' ')
    .replace(/<system-reminder>[\s\S]*?<\/system-reminder>/g, ' ')
    .replace(/\[Image: [^\]]*\]/g, ' ')
    .trim();
  // 사람은 꺾쇠 태그로 말을 시작하지 않는다 — 요약에 끼어든 <artifact-content…> 같은 주입 문구 제외.
  if (!t || SYSTEM_PREFIX.test(t) || /^<[A-Za-z\/!]/.test(t)) return null;
  return t;
}

/* ───────────────────────── store helpers ───────────────────────── */

const sha = (s) => crypto.createHash('sha1').update(s).digest('hex');
const readText = (p) => { try { return fs.readFileSync(p, 'utf8'); } catch (_) { return null; } };
function readJsonl(p) {
  const t = readText(p);
  if (!t) return [];
  return t.split(/\r?\n/).filter(Boolean).map((l) => { try { return JSON.parse(l); } catch (_) { return null; } }).filter(Boolean);
}
function appendJsonl(p, rows) {
  if (!rows.length) return;
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.appendFileSync(p, rows.map((r) => JSON.stringify(r)).join('\n') + '\n');
}

/** Complete lines from byte offset `start`; returns the new offset (bytes of fully-read lines). */
function readNewLines(file, start, onLine) {
  const fd = fs.openSync(file, 'r');
  try {
    const size = fs.fstatSync(fd).size;
    let from0 = start > size ? 0 : start;
    let pos = from0;
    let consumed = from0;
    const buf = Buffer.alloc(1 << 20);
    let carry = Buffer.alloc(0);
    while (pos < size) {
      const n = fs.readSync(fd, buf, 0, buf.length, pos);
      if (n <= 0) break;
      pos += n;
      const chunk = carry.length ? Buffer.concat([carry, buf.subarray(0, n)]) : Buffer.from(buf.subarray(0, n));
      let from = 0;
      let idx;
      while ((idx = chunk.indexOf(10, from)) >= 0) {
        onLine(chunk.subarray(from, idx));
        consumed += idx - from + 1;
        from = idx + 1;
      }
      carry = chunk.subarray(from);
    }
    return consumed;
  } finally { fs.closeSync(fd); }
}

/* ───────────────────────── extractors ───────────────────────── */

function parseFrontmatter(text) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(text);
  if (!m) return { meta: {}, body: text };
  const meta = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = /^\s*([A-Za-z_]+):\s*(.*)$/.exec(line);
    if (kv) meta[kv[1]] = kv[2].trim();
  }
  return { meta, body: m[2] };
}

/** memory/*.md → lessons (kind = the memory's own type). */
function lessonsFromMemory(project, memDir) {
  let files = [];
  try { files = fs.readdirSync(memDir).filter((f) => f.endsWith('.md') && f !== 'MEMORY.md'); } catch (_) { return []; }
  const out = [];
  for (const f of files) {
    const raw = readText(path.join(memDir, f));
    if (!raw) continue;
    const { meta, body } = parseFrontmatter(raw);
    const kind = (meta.type || /\btype:\s*(\w+)/.exec(raw)?.[1] || 'note').toLowerCase();
    const name = meta.name || f.replace(/\.md$/, '');
    const text = redact(`${meta.description || ''} — ${body.replace(/\s+/g, ' ').trim()}`).slice(0, 360);
    out.push({ id: sha(`${project}|mem|${name}`).slice(0, 12), kind: ['feedback', 'user', 'project', 'reference'].includes(kind) ? kind : 'note', project, name, text, source: `memory/${f}` });
  }
  return out;
}

/** project docs → incident / security lines with file:line provenance. */
function lessonsFromDocs(project, root) {
  const out = [];
  for (const rel of ['docs/DECISIONS.md', 'CLAUDE.md', 'HANDOFF.md']) {
    const lines = (readText(path.join(root, rel)) || '').split(/\r?\n/);
    let n = 0;
    lines.forEach((line, i) => {
      if (n >= 60 || !line.trim() || /^\s*```/.test(line)) return;
      const isSec = SECURITY.test(line);
      const isInc = INCIDENT.test(line);
      if (!isSec && !isInc) return;
      const text = redact(line.replace(/\s+/g, ' ').trim()).slice(0, 300);
      if (text.length < 20) return;
      n++;
      out.push({ id: sha(`${project}|doc|${rel}|${text.slice(0, 80)}`).slice(0, 12), kind: isSec ? 'security' : 'incident', project, text, source: `${rel}:${i + 1}` });
    });
  }
  return out;
}

/** Project root for a transcripts dir: first cwd found, walked up to a folder with docs/DECISIONS.md or CLAUDE.md. */
function projectRoot(dir) {
  let files = [];
  try { files = fs.readdirSync(dir).filter((f) => f.endsWith('.jsonl')); } catch (_) { return null; }
  for (const f of files) {
    let cwd = null;
    try {
      const fd = fs.openSync(path.join(dir, f), 'r');
      const b = Buffer.alloc(256 * 1024);
      const n = fs.readSync(fd, b, 0, b.length, 0);
      fs.closeSync(fd);
      cwd = /"cwd":"((?:[^"\\]|\\.)*)"/.exec(b.subarray(0, n).toString('utf8'))?.[1] ?? null;
      if (cwd) cwd = JSON.parse(`"${cwd}"`);
    } catch (_) { /* next file */ }
    if (!cwd) continue;
    let cur = cwd;
    for (let i = 0; i < 5; i++) {
      if (fs.existsSync(path.join(cur, 'docs', 'DECISIONS.md')) || fs.existsSync(path.join(cur, 'CLAUDE.md'))) return cur;
      const up = path.dirname(cur);
      if (up === cur) break;
      cur = up;
    }
    return fs.existsSync(cwd) ? cwd : null;
  }
  return null;
}

/* ───────────────────────── digest ───────────────────────── */

const HARDENING = /취약|막았|막는|막아|차단|방지|강화|거절|검증|제한/;
/** Security lines worth keeping: hardening actions (not mere mentions), de-duplicated, round-robin across projects. */
function pickSecurity(lessons, n) {
  const byProject = {};
  const seen = new Set();
  for (const l of lessons.filter((x) => x.kind === 'security' && HARDENING.test(x.text)).reverse()) {
    const key = l.text.slice(0, 60);
    if (seen.has(key)) continue;
    seen.add(key);
    (byProject[l.project] ||= []).push(l);
  }
  const out = [];
  const lists = Object.values(byProject);
  for (let i = 0; out.length < n && lists.some((x) => x[i]); i++) for (const x of lists) if (x[i] && out.length < n) out.push(x[i]);
  return out;
}

function buildDigest(messages, lessons, meta) {
  const L = ['# CoolHan 세션 누적 학습 DIGEST (G18)', '',
    `> 자동 생성 ${meta.generatedAt} · 비공개(.coolhan-private, git 무시) · 출처: 프로젝트 ${meta.projects}개, 사람 발화 ${messages.length}건, 교훈 ${lessons.length}건.`,
    '> 조언이지 게이트가 아니다. 한계: 이 계정·이 PC 기록만, 키워드 분류, 알려진 패턴만 마스킹.', ''];

  // 1. operator command patterns
  const themeStat = {};
  for (const m of messages) for (const t of m.themes || []) {
    const s = (themeStat[t] ||= { n: 0, imp: 0, ex: [] });
    s.n++; if (m.imperative) { s.imp++; s.ex.push(m); }
  }
  L.push('## 1. 운영자 명령 패턴 (많이 반복된 순)', '');
  for (const [t, s] of Object.entries(themeStat).sort((a, b) => b[1].n - a[1].n)) {
    L.push(`- **${t}** — ${s.n}회(명령형 ${s.imp}회)`);
    const uniq = [...new Map(s.ex.map((e) => [e.text.slice(0, 40), e])).values()];
    for (const e of uniq.slice(-2)) L.push(`  - 「${e.text.slice(0, 110).replace(/\s+/g, ' ')}」`);
  }

  // 2. rules (feedback memories)
  const rules = new Map();
  for (const l of lessons.filter((x) => x.kind === 'feedback')) rules.set(`${l.project}|${l.name}`, l);
  L.push('', '## 2. 지켜야 할 규칙 (운영자가 정한 것 — feedback 메모리)', '');
  [...rules.values()].slice(-40).forEach((l) => L.push(`- (${l.project.replace(/^C--sites-?/, '') || 'sites'}) ${l.text.slice(0, 200)}`));

  // 3. incidents
  L.push('', '## 3. 반복 실패·사고와 해결 (문서 근거)', '');
  lessons.filter((x) => x.kind === 'incident').slice(-30).forEach((l) => L.push(`- (${l.project.replace(/^C--sites-?/, '') || 'sites'} · ${l.source}) ${l.text.slice(0, 220)}`));

  // 4. security
  L.push('', '## 4. 보안 강화 목록 (조치한 것만, 중복 제거, 프로젝트별 고르게)', '');
  for (const l of pickSecurity(lessons, 25)) L.push(`- (${l.project.replace(/^C--sites-?/, '') || 'sites'} · ${l.source}) ${l.text.slice(0, 220)}`);
  L.push('');
  let out = L.join('\n');
  if (Buffer.byteLength(out) > DIGEST_MAX_BYTES) {
    // 상한 초과 — 뒤쪽(사고·보안) 목록부터 줄인다
    while (Buffer.byteLength(out) > DIGEST_MAX_BYTES && L.length > 20) { L.splice(L.length - 2, 1); out = L.join('\n'); }
    out += '\n> (크기 상한으로 일부 생략)\n';
  }
  return out;
}

/** Compact (~3KB) session-start briefing — printed by the SessionStart hook; the full DIGEST stays on disk. */
function buildBrief(messages, lessons, fullPath) {
  const stat = {};
  for (const m of messages) for (const t of m.themes || []) { const x = (stat[t] ||= { n: 0, imp: 0 }); x.n++; if (m.imperative) x.imp++; }
  const top = Object.entries(stat).sort((a, b) => b[1].imp - a[1].imp).slice(0, 6).map(([t, x]) => `${t} ${x.imp}회`).join(' · ');
  const proj = (l) => l.project.replace(/^C--sites-?/, '') || 'sites';
  const rules = new Map();
  for (const l of lessons.filter((x) => x.kind === 'feedback')) rules.set(`${l.project}|${l.name}`, l);
  const L = ['[CoolHan 세션 학습 브리핑 — 운영자 규칙·보안 목록 요약, 전체는 ' + fullPath + ']',
    `운영자가 반복해 명령한 것(명령형 횟수): ${top || '아직 없음'}`, '지켜야 할 규칙(최근):'];
  [...rules.values()].slice(-8).forEach((l) => L.push(`- (${proj(l)}) ${l.text.slice(0, 130)}`));
  L.push('보안 강화 목록:');
  for (const l of pickSecurity(lessons, 6)) L.push(`- (${proj(l)}) ${l.text.slice(0, 120)}`);
  let out = L.join('\n');
  while (Buffer.byteLength(out) > 4096 && L.length > 4) { L.splice(L.length - 1, 1); out = L.join('\n'); }
  return out + '\n';
}

/* ───────────────────────── run ───────────────────────── */

function harvest(opts = {}) {
  const home = opts.home || path.join(os.homedir(), '.claude');
  const out = opts.out || path.join(path.resolve(__dirname, '..'), '.coolhan-private', 'learned');
  const projectsDir = path.join(home, 'projects');
  fs.mkdirSync(out, { recursive: true });

  const lock = path.join(out, 'harvest.lock');
  try { const st = fs.statSync(lock); if (Date.now() - st.mtimeMs < 10 * 60 * 1000) return { skipped: 'another harvest is running' }; } catch (_) { /* no lock */ }
  fs.writeFileSync(lock, String(process.pid));
  try {
    const statePath = path.join(out, 'state.json');
    if (opts.rebuild) for (const f of ['state.json', 'human-messages.jsonl', 'lessons.jsonl']) { try { fs.unlinkSync(path.join(out, f)); } catch (_) { /* absent */ } }
    const state = (() => { try { return JSON.parse(readText(statePath) || '{}'); } catch (_) { return {}; } })();
    state.files = state.files || {};
    const msgPath = path.join(out, 'human-messages.jsonl');
    const lessonPath = path.join(out, 'lessons.jsonl');
    const knownMsg = new Set(readJsonl(msgPath).map((m) => m.id));
    const knownLesson = new Set(readJsonl(lessonPath).map((l) => l.id));
    const newMsgs = [];
    const newLessons = [];
    let projects = [];
    try { projects = fs.readdirSync(projectsDir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name); } catch (_) { /* no sessions */ }

    for (const project of projects) {
      const dir = path.join(projectsDir, project);
      for (const l of lessonsFromMemory(project, path.join(dir, 'memory'))) if (!knownLesson.has(l.id)) { knownLesson.add(l.id); newLessons.push(l); }
      const root = projectRoot(dir);
      if (root) for (const l of lessonsFromDocs(project, root)) if (!knownLesson.has(l.id)) { knownLesson.add(l.id); newLessons.push(l); }

      let files = [];
      try { files = fs.readdirSync(dir).filter((f) => f.endsWith('.jsonl')); } catch (_) { continue; }
      for (const f of files) {
        const full = path.join(dir, f);
        const key = `${project}/${f}`;
        let size = 0;
        try { size = fs.statSync(full).size; } catch (_) { continue; }
        const prev = state.files[key] || 0;
        if (prev === size) continue;
        const consumed = readNewLines(full, prev, (lineBuf) => {
          if (lineBuf.indexOf('"type":"user"') < 0) return;           // cheap pre-filter before parsing
          let rec; try { rec = JSON.parse(lineBuf.toString('utf8')); } catch (_) { return; }
          const raw = humanText(rec);
          if (!raw) return;
          const id = sha(`${rec.sessionId}|${rec.uuid}`).slice(0, 16);
          if (knownMsg.has(id)) return;
          knownMsg.add(id);
          const text = redact(raw.replace(/\s+/g, ' ')).slice(0, 220);
          const c = classify(raw);
          newMsgs.push({ id, project, ts: rec.timestamp || null, themes: c.themes, imperative: c.imperative, text });
        });
        state.files[key] = consumed;
      }
    }

    appendJsonl(msgPath, newMsgs);
    appendJsonl(lessonPath, newLessons);
    state.updatedAt = new Date().toISOString();
    fs.writeFileSync(statePath, JSON.stringify(state, null, 2));

    const messages = readJsonl(msgPath);
    const lessons = readJsonl(lessonPath);
    const digest = buildDigest(messages, lessons, { generatedAt: state.updatedAt, projects: projects.length });
    fs.writeFileSync(path.join(out, 'DIGEST.md'), digest);
    return { out, projects: projects.length, newMessages: newMsgs.length, newLessons: newLessons.length, totalMessages: messages.length, totalLessons: lessons.length, digestBytes: Buffer.byteLength(digest) };
  } finally { try { fs.unlinkSync(lock); } catch (_) { /* gone */ } }
}

function main(argv) {
  const args = argv.slice(2);
  const get = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined; };
  const known = new Set(['--home', '--out', '--quiet', '--json', '--incremental', '--rebuild', '--brief']);
  for (const a of args) if (a.startsWith('--') && !known.has(a)) { console.error(`unknown option ${a}`); return 2; }
  if (args.includes('--brief')) {                       // 읽기 전용 — 수집하지 않고 저장된 것만 요약 출력(없으면 조용히 종료)
    const out = get('--out') || path.join(path.resolve(__dirname, '..'), '.coolhan-private', 'learned');
    const messages = readJsonl(path.join(out, 'human-messages.jsonl'));
    const lessons = readJsonl(path.join(out, 'lessons.jsonl'));
    if (messages.length || lessons.length) process.stdout.write(buildBrief(messages, lessons, path.join(out, 'DIGEST.md')));
    return 0;
  }
  let r;
  try { r = harvest({ home: get('--home'), out: get('--out'), rebuild: args.includes('--rebuild') }); } catch (e) { if (!args.includes('--quiet')) console.error(`(harvest failed: ${e.message})`); return 0; }
  if (args.includes('--json')) console.log(JSON.stringify(r, null, 2));
  else if (!args.includes('--quiet')) console.log(r.skipped ? `✔ skipped: ${r.skipped}` : `✔ harvest: +${r.newMessages} messages, +${r.newLessons} lessons (total ${r.totalMessages}/${r.totalLessons}) → ${r.out}`);
  return 0;
}

if (require.main === module) process.exit(main(process.argv));

module.exports = { redact, classify, humanText, parseFrontmatter, lessonsFromMemory, lessonsFromDocs, projectRoot, buildDigest, buildBrief, readNewLines, harvest, main, REDACTIONS, THEMES };
