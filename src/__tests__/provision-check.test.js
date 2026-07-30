const fs = require('fs');
const os = require('os');
const path = require('path');
const { evaluate, extractRequiredKeys } = require('../../scripts/provision-check');

describe('provision-check (environment/secret readiness gate)', () => {
  let dir;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'provision-check-test-'));
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  test('extractRequiredKeys ignores comments and blank lines', () => {
    const keys = extractRequiredKeys('# comment\n\nDATABASE_URL=\nAPI_KEY=xyz\n');
    expect(keys).toEqual(['DATABASE_URL', 'API_KEY']);
  });

  test('no .env.example/.env.sample → nothing required, ok', () => {
    const ev = evaluate(dir, {});
    expect(ev.ok).toBe(true);
    expect(ev.example_file).toBeNull();
    expect(ev.required).toHaveLength(0);
  });

  test('all required vars present → ok', () => {
    fs.writeFileSync(path.join(dir, '.env.example'), 'DATABASE_URL=\nAPI_KEY=\n');
    const ev = evaluate(dir, { DATABASE_URL: 'x', API_KEY: 'y' });
    expect(ev.ok).toBe(true);
    expect(ev.missing).toHaveLength(0);
    expect(ev.present).toEqual(['DATABASE_URL', 'API_KEY']);
  });

  test('a missing required var → not ok, named in missing', () => {
    fs.writeFileSync(path.join(dir, '.env.example'), 'DATABASE_URL=\nAPI_KEY=\n');
    const ev = evaluate(dir, { DATABASE_URL: 'x' });
    expect(ev.ok).toBe(false);
    expect(ev.missing).toEqual(['API_KEY']);
  });

  test('empty-string value counts as missing', () => {
    fs.writeFileSync(path.join(dir, '.env.example'), 'API_KEY=\n');
    const ev = evaluate(dir, { API_KEY: '' });
    expect(ev.ok).toBe(false);
    expect(ev.missing).toEqual(['API_KEY']);
  });

  test('.env.sample is also recognized', () => {
    fs.writeFileSync(path.join(dir, '.env.sample'), 'TOKEN=\n');
    const ev = evaluate(dir, { TOKEN: 'present' });
    expect(ev.ok).toBe(true);
    expect(ev.example_file).toContain('.env.sample');
  });

  test('never includes an actual value anywhere in the result', () => {
    fs.writeFileSync(path.join(dir, '.env.example'), 'SECRET=\n');
    const ev = evaluate(dir, { SECRET: 'super-secret-value-12345' }); // secret-scan:allow test fixture, not a real secret
    const serialized = JSON.stringify(ev);
    expect(serialized).not.toContain('super-secret-value-12345');
  });
});
