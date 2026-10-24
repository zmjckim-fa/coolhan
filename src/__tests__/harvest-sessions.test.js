const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { redact, classify, humanText, harvest, buildDigest, buildBrief, main } = require('../../scripts/harvest-sessions');

const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'hv-'));
const rec = (o) => JSON.stringify(Object.assign({ type: 'user', sessionId: 's1', timestamp: '2026-10-24T10:00:00Z' }, o));

/** A fake ~/.claude with one project: memory, a doc with an incident line, and a transcript. */
function fixture() {
  const d = tmp();
  const home = path.join(d, '.claude');
  const root = path.join(d, 'site');
  fs.mkdirSync(path.join(root, 'docs'), { recursive: true });
  fs.writeFileSync(path.join(root, 'docs', 'DECISIONS.md'), '# D\n- 2026-09-15 배포 크래시 루프 사고 — 서비스 의존성만 올려 재시작 실패, 재발 방지: 모듈도 함께 배포\n- 보안 점검: 토큰 노출 취약점 수정\n- 평범한 줄\n');
  const proj = path.join(home, 'projects', 'C--sites-demo');
  fs.mkdirSync(path.join(proj, 'memory'), { recursive: true });
  fs.writeFileSync(path.join(proj, 'memory', 'feedback_x.md'), '---\nname: verify-first\ndescription: 검증 통과 전에는 완료라고 말하지 않는다\nmetadata:\n  type: feedback\n---\n\n실데이터로 확인한다. 비밀번호: hunter2hunter2\n');
  const lines = [
    rec({ uuid: 'u1', cwd: root, origin: { kind: 'human' }, message: { content: '실데이터로 검증하고 완료라고 말해라. 연락처 kim@example.com 010-1234-5678' } }),
    rec({ uuid: 'u2', origin: { kind: 'human' }, message: { content: [{ type: 'tool_result', content: 'ok' }] } }),
    rec({ uuid: 'u3', isMeta: true, message: { content: '메타 메시지' } }),
    rec({ uuid: 'u4', origin: { kind: 'peer' }, message: { content: '서브에이전트 보고' } }),
    rec({ uuid: 'u5', isSidechain: true, message: { content: '사이드체인' } }),
    rec({ uuid: 'u6', message: { content: '<system-reminder>알림</system-reminder>' } }),
    rec({ uuid: 'u7', message: { content: '중복 정리하고 스크롤을 줄여라' } }),
    JSON.stringify({ type: 'assistant', uuid: 'a1', message: { content: 'x' } }),
  ];
  fs.writeFileSync(path.join(proj, 'sess1.jsonl'), lines.join('\n') + '\n');
  return { d, home, root, proj, out: path.join(d, 'out') };
}

describe('harvest-sessions (G18 — 세션 누적 학습)', () => {
  test('masking removes keys, tokens, passwords, JWT, hashes, e-mail, phone, IP, URL credentials', () => {
    const stripe = 'sk_' + 'live_' + 'A1b2C3d4E5f6G7h8';
    const gh = 'ghp_' + 'a'.repeat(30);
    const jwt = 'eyJ' + 'abcdefgh' + '.' + 'abcdefghij' + '.' + 'abcdefgh';
    const hash = 'a1b2c3d4'.repeat(5);
    const t = redact(`키 ${stripe} ${gh} ${jwt} 해시 ${hash} password=hunter2 메일 a.b@corp.example.com 전화 +49 151 12345678 010-1234-5678 서버 31.70.108.121 https://u:pw@host.example/x`);
    for (const secret of [stripe, gh, jwt, hash, 'hunter2', 'a.b@corp.example.com', '12345678', '1234-5678', '31.70.108.121', 'u:pw@']) expect(t).not.toContain(secret);
    expect(t).toContain('[email]');
    expect(t).toContain('[ip]');
    expect(redact('날짜 2026-10-24 주문 SK-20261021-0001')).toBe('날짜 2026-10-24 주문 SK-20261021-0001');
  });

  test('human filter keeps typed text and drops tool results, meta, sub-agent, sidechain, system notices, pasted blocks', () => {
    expect(humanText(JSON.parse(rec({ message: { content: '배포해' } })))).toBe('배포해');
    expect(humanText(JSON.parse(rec({ origin: { kind: 'human' }, message: { content: [{ type: 'text', text: '확인해' }] } })))).toBe('확인해');
    expect(humanText(JSON.parse(rec({ message: { content: [{ type: 'tool_result' }] } })))).toBeNull();
    expect(humanText(JSON.parse(rec({ isMeta: true, message: { content: 'x' } })))).toBeNull();
    expect(humanText(JSON.parse(rec({ origin: { kind: 'peer' }, message: { content: 'x' } })))).toBeNull();
    expect(humanText(JSON.parse(rec({ message: { content: '<task-notification>done</task-notification>' } })))).toBeNull();
    expect(humanText(JSON.parse(rec({ message: { content: '<artifact-content-authored-by-others/> The summarized conversation' } })))).toBeNull();
    expect(humanText(JSON.parse(rec({ message: { content: 'This session is being continued from a previous conversation' } })))).toBeNull();
    expect(humanText(JSON.parse(rec({ message: { content: '이 로그를 봐 <pasted_content id="1">비밀 내용</pasted_content>' } })))).toBe('이 로그를 봐');
  });

  test('classify: themes and imperative strength', () => {
    const c = classify('실데이터로 검증하고 중복 정리해라');
    expect(c.themes).toEqual(expect.arrayContaining(['verify-before-done', 'dedupe']));
    expect(c.imperative).toBe(true);
    expect(classify('안녕하세요').themes).toEqual([]);
  });

  test('real-shaped run: memory + docs + transcript → stores, digest, no secret, incremental no duplicates', () => {
    const f = fixture();
    const r1 = harvest({ home: f.home, out: f.out });
    expect(r1.newMessages).toBe(2);                       // u1, u7 only
    expect(r1.newLessons).toBeGreaterThanOrEqual(3);      // memory + 2 doc lines
    const all = fs.readFileSync(path.join(f.out, 'human-messages.jsonl'), 'utf8') + fs.readFileSync(path.join(f.out, 'lessons.jsonl'), 'utf8') + fs.readFileSync(path.join(f.out, 'DIGEST.md'), 'utf8');
    for (const secret of ['hunter2', 'kim@example.com', '010-1234-5678']) expect(all).not.toContain(secret);
    const digest = fs.readFileSync(path.join(f.out, 'DIGEST.md'), 'utf8');
    expect(digest).toMatch(/운영자 명령 패턴/);
    expect(digest).toMatch(/verify-before-done/);
    expect(digest).toMatch(/검증 통과 전에는 완료/);
    expect(digest).toMatch(/보안 강화 목록/);
    expect(digest).toMatch(/크래시 루프/);
    // 두 번째 실행: 새 것이 없으면 0
    const r2 = harvest({ home: f.home, out: f.out });
    expect(r2.newMessages).toBe(0);
    expect(r2.newLessons).toBe(0);
    // 대화가 늘면 새 줄만 추가
    fs.appendFileSync(path.join(f.proj, 'sess1.jsonl'), rec({ uuid: 'u8', message: { content: '배포해' } }) + '\n');
    const r3 = harvest({ home: f.home, out: f.out });
    expect(r3.newMessages).toBe(1);
    expect(r3.totalMessages).toBe(3);
    fs.rmSync(f.d, { recursive: true, force: true });
  });

  test('rebuild wipes the store and re-derives it with the current classifier (same totals, no duplicates)', () => {
    const f = fixture();
    const r1 = harvest({ home: f.home, out: f.out });
    const r2 = harvest({ home: f.home, out: f.out, rebuild: true });
    expect(r2.newMessages).toBe(r1.newMessages);
    expect(r2.totalMessages).toBe(r1.totalMessages);
    expect(r2.totalLessons).toBe(r1.totalLessons);
    fs.rmSync(f.d, { recursive: true, force: true });
  });

  test('classify looks only at the first 300 chars (a long pasted tail cannot change the theme)', () => {
    expect(classify('안녕하세요 ' + 'x'.repeat(400) + ' 보안 취약점 배포').themes).toEqual([]);
  });

  test('a partial last line is not consumed until it is complete', () => {
    const f = fixture();
    harvest({ home: f.home, out: f.out });
    const file = path.join(f.proj, 'sess1.jsonl');
    const line = rec({ uuid: 'u9', message: { content: '이어서 진행하라' } });
    fs.appendFileSync(file, line.slice(0, 30));                      // 줄바꿈 없는 반쪽
    expect(harvest({ home: f.home, out: f.out }).newMessages).toBe(0);
    fs.appendFileSync(file, line.slice(30) + '\n');
    expect(harvest({ home: f.home, out: f.out }).newMessages).toBe(1);
    fs.rmSync(f.d, { recursive: true, force: true });
  });

  test('digest stays within the size cap even with many lessons', () => {
    const messages = Array.from({ length: 50 }, (_, i) => ({ id: String(i), themes: ['deploy'], imperative: true, text: '배포해 ' + 'x'.repeat(100) }));
    const lessons = Array.from({ length: 400 }, (_, i) => ({ id: String(i), kind: i % 2 ? 'incident' : 'security', project: 'C--sites-p', source: 'CLAUDE.md:' + i, text: `사고 보안 ${i} ` + '가'.repeat(250) }));
    const d = buildDigest(messages, lessons, { generatedAt: 'now', projects: 1 });
    expect(Buffer.byteLength(d)).toBeLessThanOrEqual(16 * 1024 + 200);
  });

  test('brief: compact, keeps rules and security list, read-only via --brief (no new data written)', () => {
    const f = fixture();
    harvest({ home: f.home, out: f.out });
    const rows = (n) => fs.readFileSync(path.join(f.out, n), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
    const brief = buildBrief(rows('human-messages.jsonl'), rows('lessons.jsonl'), 'X/DIGEST.md');
    expect(Buffer.byteLength(brief)).toBeLessThanOrEqual(4096 + 10);
    expect(brief).toMatch(/지켜야 할 규칙/);
    expect(brief).toMatch(/검증 통과 전에는 완료/);
    expect(brief).toMatch(/보안 강화 목록/);
    const before = fs.statSync(path.join(f.out, 'human-messages.jsonl')).mtimeMs;
    expect(main(['node', 'x', '--brief', '--out', f.out])).toBe(0);
    expect(fs.statSync(path.join(f.out, 'human-messages.jsonl')).mtimeMs).toBe(before);
    fs.rmSync(f.d, { recursive: true, force: true });
  });

  test('unknown option exits 2; a missing sessions dir still exits 0 and writes an empty digest', () => {
    expect(main(['node', 'x', '--bogus'])).toBe(2);
    const d = tmp();
    expect(main(['node', 'x', '--home', path.join(d, 'none'), '--out', path.join(d, 'o'), '--quiet'])).toBe(0);
    expect(fs.existsSync(path.join(d, 'o', 'DIGEST.md'))).toBe(true);
    fs.rmSync(d, { recursive: true, force: true });
  });

  test('private learned data can never be committed or published: gitignored, and not in the npm files whitelist', () => {
    const root = path.resolve(__dirname, '..', '..');
    const ignore = fs.readFileSync(path.join(root, '.gitignore'), 'utf8');
    expect(ignore).toMatch(/^\.coolhan-private\/\s*$/m);
    const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
    expect((pkg.files || []).some((x) => x.includes('.coolhan-private'))).toBe(false);
    let ignored = true;
    try { execFileSync('git', ['check-ignore', '-q', '.coolhan-private/learned/DIGEST.md'], { cwd: root, stdio: 'ignore' }); } catch (_) { ignored = false; }
    expect(ignored).toBe(true);
  });
});
