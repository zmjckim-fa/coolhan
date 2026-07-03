const fs = require('fs');
const os = require('os');
const path = require('path');
const { scanFile, looksHighEntropySecret, PATTERNS } = require('../../scripts/secret-scan');

function tmp(content, name = 'f.js') {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ss-'));
  const p = path.join(dir, name);
  fs.writeFileSync(p, content);
  return p;
}

describe('secret-scan', () => {
  test('has named provider patterns', () => {
    const ids = PATTERNS.map(p => p.id);
    expect(ids).toEqual(expect.arrayContaining(['aws-access-key', 'stripe-key', 'private-key', 'jwt']));
  });

  // Fixtures are assembled at runtime so no contiguous secret literal exists in this
  // source file (avoids host push-protection false positives on the test itself).
  test('detects an AWS access key', () => {
    const secret = 'AKIA' + '1234567890ABCDEF';
    const f = scanFile(tmp(`const k = "${secret}";\n`));
    expect(f).toHaveLength(1);
    expect(f[0].rule).toBe('aws-access-key');
    expect(f[0].line).toBe(1);
  });

  test('detects a Stripe live key', () => {
    const secret = 'sk_' + 'live_' + '8f3a9c2b1d4e5f6071829abc';
    const f = scanFile(tmp(`API_KEY = "${secret}"\n`));
    expect(f[0].rule).toBe('stripe-key');
  });

  test('detects a generic secret assignment', () => {
    const f = scanFile(tmp('password = "S3cr3tP@ssword"\n'));
    expect(f).toHaveLength(1);
    expect(f[0].rule).toBe('generic-assignment');
  });

  test('clean file yields no findings', () => {
    const f = scanFile(tmp('const total = a + b;\nconst name = "hello world";\n'));
    expect(f).toHaveLength(0);
  });

  test('inline allowlist suppresses a finding', () => {
    const f = scanFile(tmp('const k = "AKIA1234567890ABCDEF"; // secret-scan:allow\n'));
    expect(f).toHaveLength(0);
  });

  test('high-entropy detector needs a credential-like context', () => {
    // random-looking token but no key/token/secret context → not flagged by entropy rule
    expect(looksHighEntropySecret('const id = "a1B2c3D4e5F6g7H8i9J0k1L2";')).toBe(true);
    // a plain English sentence → low entropy, not flagged
    expect(looksHighEntropySecret('the quick brown fox jumps over the lazy dog')).toBe(false);
  });
});
