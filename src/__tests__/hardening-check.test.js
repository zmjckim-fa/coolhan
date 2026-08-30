const { checkStackFingerprint, checkExpress404, checkUaConsistency, checkRobotsAi } = require('../../scripts/hardening-check');

// The network-touching checks (checkExpress404/UaConsistency/RobotsAi) accept a base and use the
// module's own request(); to keep tests hermetic we test the pure classifiers directly and the
// HTTP-shaped ones via a local server.
const http = require('http');

function withServer(handler, fn) {
  return new Promise((resolve, reject) => {
    const srv = http.createServer(handler);
    srv.listen(0, async () => {
      const base = `http://127.0.0.1:${srv.address().port}`;
      try { const r = await fn(base); srv.close(() => resolve(r)); }
      catch (e) { srv.close(() => reject(e)); }
    });
  });
}

describe('hardening-check (G15 — production bot/fingerprint hardening)', () => {
  describe('H2 stack fingerprint (pure)', () => {
    test('X-Powered-By leak → FAIL', () => {
      expect(checkStackFingerprint({ 'x-powered-by': 'Next.js' }).status).toBe('FAIL');
    });
    test('x-nextjs-cache leak → FAIL', () => {
      expect(checkStackFingerprint({ 'x-nextjs-cache': 'HIT' }).status).toBe('FAIL');
    });
    test('server: Express → FAIL', () => {
      expect(checkStackFingerprint({ server: 'Express' }).status).toBe('FAIL');
    });
    test('clean headers → PASS', () => {
      expect(checkStackFingerprint({ server: 'nginx', 'content-type': 'text/html' }).status).toBe('PASS');
    });
    test('leak carries operator-approval fix_class (server-file, re-attached after middleware)', () => {
      const r = checkStackFingerprint({ 'x-powered-by': 'Next.js' });
      expect(r.fix_class).toMatch(/operator-approval/);
      expect(r.fix_class).toMatch(/next\.config|Header unset/);
    });
    test('/_next/ in body → honest "framework still inferable" note even on a header PASS', () => {
      const r = checkStackFingerprint({ server: 'nginx' }, '<script src="/_next/static/chunk.js"></script>');
      expect(r.status).toBe('PASS');
      expect(r.detail).toMatch(/still inferable/);
    });
  });

  test('H3 Express "Cannot GET /api" body → FAIL; neutral 404 → PASS', async () => {
    const fail = await withServer((req, res) => { res.writeHead(404); res.end('Cannot GET /api/__coolhan_probe_xyz'); },
      base => checkExpress404(base));
    expect(fail.status).toBe('FAIL');
    const pass = await withServer((req, res) => { res.writeHead(404, { 'content-type': 'text/html' }); res.end('<h1>Not found</h1>'); },
      base => checkExpress404(base));
    expect(pass.status).toBe('PASS');
  });

  test('H4 UA-consistency: Chrome UA + no client hints served 200 HTML → FAIL', async () => {
    const fail = await withServer((req, res) => { res.writeHead(200, { 'content-type': 'text/html' }); res.end('<html></html>'); },
      base => checkUaConsistency(base));
    expect(fail.status).toBe('FAIL');
    const pass = await withServer((req, res) => { res.writeHead(403); res.end('blocked'); },
      base => checkUaConsistency(base));
    expect(pass.status).toBe('PASS');
  });

  test('H5 robots.txt disallowing AI crawlers → PASS; allowing → FAIL', async () => {
    const disallow = [
      'User-agent: GPTBot', 'Disallow: /',
      'User-agent: ChatGPT-User', 'Disallow: /',
      'User-agent: ClaudeBot', 'Disallow: /',
      'User-agent: Claude-User', 'Disallow: /',
      'User-agent: anthropic-ai', 'Disallow: /',
      'User-agent: PerplexityBot', 'Disallow: /',
      'User-agent: Google-Extended', 'Disallow: /',
      'User-agent: CCBot', 'Disallow: /',
      'User-agent: Bytespider', 'Disallow: /',
      'User-agent: Amazonbot', 'Disallow: /'
    ].join('\n');
    const pass = await withServer((req, res) => { res.writeHead(200); res.end(disallow); }, base => checkRobotsAi(base));
    expect(pass.status).toBe('PASS');

    const allow = 'User-agent: *\nAllow: /';
    const fail = await withServer((req, res) => { res.writeHead(200); res.end(allow); }, base => checkRobotsAi(base));
    expect(fail.status).toBe('FAIL');
  });

  test('H5 robots.txt missing (404) → FAIL (AI crawlers not disallowed)', async () => {
    const r = await withServer((req, res) => { res.writeHead(404); res.end(''); }, base => checkRobotsAi(base));
    expect(r.status).toBe('FAIL');
  });

  test('H1 AI-agent bypass: agent UA served 200 HTML → FAIL; blocked → PASS', async () => {
    const { checkAiAgentBypass } = require('../../scripts/hardening-check');
    const fail = await withServer((req, res) => { res.writeHead(200, { 'content-type': 'text/html' }); res.end('<html>home</html>'); },
      base => checkAiAgentBypass(base));
    expect(fail.status).toBe('FAIL');
    expect(fail.detail).toMatch(/ChatGPT-User|Claude-User|PerplexityBot/);
    const pass = await withServer((req, res) => { res.writeHead(403); res.end('forbidden'); },
      base => checkAiAgentBypass(base));
    expect(pass.status).toBe('PASS');
  });

  test('H6 automation tools served 200 HTML → FAIL; blocked → PASS', async () => {
    const { checkAutomationTools } = require('../../scripts/hardening-check');
    const fail = await withServer((req, res) => { res.writeHead(200, { 'content-type': 'text/html' }); res.end('<html></html>'); },
      base => checkAutomationTools(base));
    expect(fail.status).toBe('FAIL');
    const pass = await withServer((req, res) => { res.writeHead(403); res.end('bot'); },
      base => checkAutomationTools(base));
    expect(pass.status).toBe('PASS');
  });

  test('H7 search crawlers must stay 200 — blocking Googlebot is a FAIL (SEO regression)', async () => {
    const { checkSearchIndexPreserved } = require('../../scripts/hardening-check');
    const pass = await withServer((req, res) => { res.writeHead(200, { 'content-type': 'text/html' }); res.end('<html></html>'); },
      base => checkSearchIndexPreserved(base));
    expect(pass.status).toBe('PASS');
    // Over-aggressive hardening that blocks everything non-human also blocks Googlebot:
    const fail = await withServer((req, res) => { res.writeHead(403); res.end('blocked'); },
      base => checkSearchIndexPreserved(base));
    expect(fail.status).toBe('FAIL');
    expect(fail.detail).toMatch(/Googlebot|SEO/);
  });

  test('unreachable origin → NOT_RUN, never a false PASS', async () => {
    const r = await checkExpress404('http://127.0.0.1:9');
    expect(r.status).toBe('NOT_RUN');
  });
});
