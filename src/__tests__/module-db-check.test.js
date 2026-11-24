const fs = require('fs');
const os = require('os');
const path = require('path');
const check = require('../../scripts/module-check');
const db = require('../../scripts/module-db-check');

jest.setTimeout(240000);

const write = (root, rel, content) => { const f = path.join(root, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, content); };
const ABSENT = Object.fromEntries(check.PARTS.map(p => [p, `해당 없음: 이 모듈에 ${p} 부분이 없다`]));
const quiet = (fn) => { const o = { log: console.log, error: console.error }; const out = []; console.log = (m) => out.push(String(m)); console.error = (m) => out.push(String(m)); try { return { code: fn(), out: out.join('\n') }; } finally { console.log = o.log; console.error = o.error; } };

function makeModule(library, name, files = {}) {
  const dir = path.join(library, 'modules', name);
  const hasDb = Object.keys(files).some(f => f.startsWith('db/'));
  const manifest = {
    name, version: '1.0.0', label: 'label', summary: 'what it does', area: name.split('-')[0], stack: 'none',
    parts: { ...ABSENT, core: true, test: true, ...(hasDb ? { db: true } : {}) }, requires: [], provides: { lib: ['rule'], tables: ['member_event'] }, settings: [],
    origin: [{ site: 'some-site', path: 'src/rule.js', commit: 'abc1234', date: '2026-11-01' }], test: 'node --test'
  };
  write(dir, 'module.json', JSON.stringify(manifest, null, 2));
  write(dir, 'README.md', `# ${name}\n`); write(dir, 'CHANGELOG.md', '## 1.0.0\n- first\n');
  write(dir, 'core/index.js', 'export function rule(x) { return x > 0; }\n');
  write(dir, 'test/rule.test.js', "import { rule } from '../core/index.js';\n");
  for (const [rel, content] of Object.entries(files)) write(dir, rel, content);
  return dir;
}
const SCHEMA = 'create table if not exists member_event (id text primary key, note text not null);\n';
const GUARD = `create or replace function member_event_no_change() returns trigger language plpgsql as $$ begin raise exception 'member_event is append-only'; end $$;
drop trigger if exists member_event_no_update on member_event;
create trigger member_event_no_update before update or delete on member_event for each row execute function member_event_no_change();
`;

describe('module-db-check: what cannot be measured is not a pass', () => {
  let library;
  beforeEach(() => { library = fs.mkdtempSync(path.join(os.tmpdir(), 'dbcheck-')); });
  afterEach(() => { fs.rmSync(library, { recursive: true, force: true }); });
  const run = (args, opts) => quiet(() => db.main(['node', 'module-db-check.js', ...args, '--library', library], opts));

  test('usage, a missing library and modules without a schema', () => {
    makeModule(library, 'member-rules');
    expect(quiet(() => db.main(['node', 'module-db-check.js', '--library', library])).code).toBe(2);
    expect(run(['member-rules', '--fast']).code).toBe(2);
    expect(quiet(() => db.main(['node', 'module-db-check.js', 'member-rules', '--library', path.join(library, 'nowhere')])).code).toBe(4);
    const r = run(['member-rules']);
    expect(r.code).toBe(4); expect(r.out).toMatch(/NOT_RUN/);
  });

  test('no PostgreSQL programs on the machine, or a cluster that does not start: NOT_RUN (exit 4)', () => {
    makeModule(library, 'member-events', { 'db/schema.sql': SCHEMA });
    const none = run(['member-events', '--json'], { findBin: () => null });
    expect(none.code).toBe(4); expect(JSON.parse(none.out)).toMatchObject({ status: 'NOT_RUN', reason: 'no_postgres' });
    const dead = run(['member-events', '--json'], { findBin: () => 'x', startCluster: () => ({ error: 'did not start' }) });
    expect(dead.code).toBe(4); expect(JSON.parse(dead.out)).toMatchObject({ status: 'NOT_RUN', reason: 'no_cluster' });
  });

  test('a folder that was named is the only place looked at', () => {
    const named = path.join(library, 'no-postgres-here');
    expect(db.candidateBins(named, { PATH: '/usr/bin', COOLHAN_PG_BIN: '/somewhere' })).toEqual([named]);
    expect(db.findBin(named, {})).toBeNull();
    expect(db.candidateBins(undefined, { COOLHAN_PG_BIN: '/somewhere', PATH: '' })[0]).toBe('/somewhere');
  });

  test('the verdict per module follows what the database answered (cluster replaced by a recorder)', () => {
    makeModule(library, 'member-events', { 'db/schema.sql': SCHEMA, 'db/append-only.postgres.sql': GUARD, 'db/append-only.sqlite.sql': '-- guard\n' });
    makeModule(library, 'member-broken', { 'db/schema.sql': 'create table member_event (id text primary key);\n' });
    const calls = [];
    // The recorder fails the second run of member-broken's schema: «relation already exists», as a schema without IF NOT EXISTS does.
    const psql = (dbName, args) => {
      calls.push([dbName, ...args].join(' '));
      if (args[0] === '-f' && /member-broken/.test(args[1]) && calls.filter(c => /member-broken.*schema\.sql/.test(c)).length === 2) return { status: 3, stdout: '', stderr: 'psql: ERROR:  relation "member_event" already exists' };
      return { status: 0, stdout: args.includes('-At') ? '2\n' : '', stderr: '' };
    };
    const r = run(['--all', '--json'], { findBin: () => 'x', startCluster: () => ({ psql, stop: () => calls.push('stopped') }) });
    const j = JSON.parse(r.out);
    expect(r.code).toBe(1);
    expect(j.modules.map(m => [m.name, m.status])).toEqual([['member-broken', 'FAIL'], ['member-events', 'PASS']]);
    expect(j.modules[0].detail).toMatch(/schema\.sql.*2.*already exists/);
    expect(j.modules[1]).toMatchObject({ guards: 1, tables: 2, triggers: 2 });
    // the guard is applied after the schema, each twice; the cluster is always stopped
    const events = calls.filter(c => /member-events/.test(c) && / -f /.test(c)).map(c => path.basename(c.split(' -f ')[1]));
    expect(events).toEqual(['schema.sql', 'schema.sql', 'append-only.postgres.sql', 'append-only.postgres.sql']);
    expect(calls[calls.length - 1]).toBe('stopped');
  });
});

describe('module-db-check: a time or money column that the database made 32 bits wide', () => {
  let library;
  beforeEach(() => { library = fs.mkdtempSync(path.join(os.tmpdir(), 'dbcheck-int-')); });
  afterEach(() => { fs.rmSync(library, { recursive: true, force: true }); });

  test('the columns the database reports decide; a marked column and a counter are left alone (cluster replaced by a recorder)', () => {
    makeModule(library, 'member-events', { 'db/schema.sql': 'create table if not exists member_event (\n  id text primary key,\n  created_at integer not null,\n  attempts integer,\n  expires_at integer -- int4-ok: days since sign-up\n);\n' });
    const psql = (dbName, args) => {
      const sql = args[args.length - 1];
      if (/data_type = 'integer'/.test(sql)) return { status: 0, stdout: 'member_event.attempts\nmember_event.created_at\nmember_event.expires_at\n', stderr: '' };
      return { status: 0, stdout: args.includes('-At') ? '1\n' : '', stderr: '' };
    };
    const r = quiet(() => db.main(['node', 'module-db-check.js', 'member-events', '--library', library, '--json'], { findBin: () => 'x', startCluster: () => ({ psql, stop: () => {} }) }));
    const j = JSON.parse(r.out);
    expect(r.code).toBe(1);
    expect(j.modules[0].status).toBe('FAIL');
    expect(j.modules[0].steps.find(s => s.step === 'int32').columns).toEqual(['member_event.created_at']);
    expect(j.modules[0].detail).toMatch(/member_event\.created_at/);
    expect(j.modules[0].detail).not.toMatch(/attempts|expires_at/);
  });
});

describe('module-db-check: cleaning up never decides the result', () => {
  let library;
  beforeEach(() => { library = fs.mkdtempSync(path.join(os.tmpdir(), 'dbcheck-stop-')); });
  afterEach(() => { fs.rmSync(library, { recursive: true, force: true }); });
  const psql = (dbName, args) => ({ status: 0, stdout: args.includes('-At') ? '1\n' : '', stderr: '' });
  const main = (args, stop) => quiet(() => db.main(['node', 'module-db-check.js', ...args, '--library', library], { findBin: () => 'x', startCluster: () => ({ psql, stop }) }));

  test('removeTree answers null when the folder is gone and the path when the removal throws', () => {
    const gone = fs.mkdtempSync(path.join(os.tmpdir(), 'dbcheck-rm-'));
    fs.writeFileSync(path.join(gone, 'file'), 'x');
    expect(db.removeTree(gone)).toBeNull();
    expect(fs.existsSync(gone)).toBe(false);
    const asked = []; const pauses = [];
    const held = (dir, o) => { asked.push(o); const e = new Error('EPERM, Permission denied'); e.code = 'EPERM'; throw e; };
    expect(db.removeTree('/held/folder', held, (ms) => pauses.push(ms))).toBe('/held/folder');
    // the removal is tried again before it gives up: the runtime's own retry option did not retry on this error
    expect(asked.length).toBe(10);
    expect(asked[0]).toMatchObject({ recursive: true, force: true });
    expect(pauses.length).toBe(9);
    // a folder held only for a moment is removed on a later try
    let n = 0;
    const moment = () => { if (++n < 3) { const e = new Error('EPERM'); e.code = 'EPERM'; throw e; } };
    expect(db.removeTree('/held/briefly', moment, () => {})).toBeNull();
    expect(n).toBe(3);
  });

  test('folders an earlier run left are removed at the next start: only this gate\'s, old, and without a running server', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'dbcheck-stale-'));
    const make = (name, files = []) => { fs.mkdirSync(path.join(tmp, name)); for (const f of files) fs.writeFileSync(path.join(tmp, name, f), 'x'); };
    make('coolhan-pg-old', ['PG_VERSION']);
    make('coolhan-pg-running', ['PG_VERSION', 'postmaster.pid']);
    make('coolhan-pg-fresh', ['PG_VERSION']);
    make('someone-elses-folder', ['file']);
    const later = Date.now() + 11 * 60 * 1000;
    // «fresh» is made young again by measuring from a time when only the others are older than ten minutes
    fs.utimesSync(path.join(tmp, 'coolhan-pg-fresh'), new Date(later), new Date(later));
    expect(db.clearStale(tmp, later).sort()).toEqual(['coolhan-pg-old']);
    expect(fs.readdirSync(tmp).sort()).toEqual(['coolhan-pg-fresh', 'coolhan-pg-running', 'someone-elses-folder']);
    // a folder that is still held stays and is not reported as removed; a missing temp folder is not an error
    make('coolhan-pg-held', ['PG_VERSION']);
    const held = () => { const e = new Error('EPERM'); e.code = 'EPERM'; throw e; };
    expect(db.clearStale(tmp, later + 11 * 60 * 1000, held)).toEqual([]);
    expect(db.clearStale(path.join(tmp, 'no-such-folder'))).toEqual([]);
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  test('a stop that throws keeps the verdict: PASS stays exit 0, the summary is printed, the folder is named', () => {
    makeModule(library, 'member-events', { 'db/schema.sql': SCHEMA });
    const text = main(['member-events'], () => { throw new Error('EPERM, Permission denied: C:/tmp/coolhan-pg-held'); });
    expect(text.code).toBe(0);
    expect(text.out).toMatch(/module-db-check: PASS/);
    expect(text.out).toMatch(/coolhan-pg-held/);
    const j = JSON.parse(main(['member-events', '--json'], () => 'C:/tmp/coolhan-pg-held').out);
    expect(j.status).toBe('PASS');
    expect(j.leftover).toBe('C:/tmp/coolhan-pg-held');
  });

  test('a stop that throws does not turn a failure into anything else, and a clean stop names no folder', () => {
    makeModule(library, 'member-broken', { 'db/schema.sql': SCHEMA });
    const failing = (dbName, args) => (args[0] === '-f' ? { status: 3, stdout: '', stderr: 'psql: ERROR:  syntax error' } : { status: 0, stdout: '1\n', stderr: '' });
    const r = quiet(() => db.main(['node', 'module-db-check.js', 'member-broken', '--library', library], { findBin: () => 'x', startCluster: () => ({ psql: failing, stop: () => { throw new Error('held'); } }) }));
    expect(r.code).toBe(1);
    expect(r.out).toMatch(/module-db-check: FAIL/);
    makeModule(library, 'member-events', { 'db/schema.sql': SCHEMA });
    const clean = JSON.parse(main(['member-events', '--json'], () => null).out);
    expect(clean.status).toBe('PASS');
    expect('leftover' in clean).toBe(false);
    // a stop that answers something that is not a path (an older caller's return value) names no folder either
    expect('leftover' in JSON.parse(main(['member-events', '--json'], () => 3).out)).toBe(false);
  });
});

const realBin = db.findBin();
const onPostgres = realBin ? describe : describe.skip;
onPostgres('module-db-check on a real PostgreSQL (skipped when the machine has none)', () => {
  let library;
  beforeEach(() => { library = fs.mkdtempSync(path.join(os.tmpdir(), 'dbcheck-real-')); });
  afterEach(() => { fs.rmSync(library, { recursive: true, force: true }); });

  test('a schema with its guard runs twice; a schema that cannot run twice and a broken guard fail, each named', () => {
    makeModule(library, 'member-events', { 'db/schema.sql': SCHEMA, 'db/append-only.postgres.sql': GUARD, 'db/append-only.sqlite.sql': '-- guard\n' });
    makeModule(library, 'member-once', { 'db/schema.sql': 'create table member_event (id text primary key);\n' });
    makeModule(library, 'member-typo', { 'db/schema.sql': SCHEMA, 'db/append-only.postgres.sql': 'create trigger broken before update on no_such_table for each row execute function nothing();\n', 'db/append-only.sqlite.sql': '-- guard\n' });
    const r = quiet(() => db.main(['node', 'module-db-check.js', '--all', '--library', library, '--json']));
    const j = JSON.parse(r.out);
    expect(j.server).toMatch(/^\d+/);
    const by = Object.fromEntries(j.modules.map(m => [m.name, m]));
    expect(by['member-events']).toMatchObject({ status: 'PASS', tables: 1, triggers: 1, guards: 1 });
    expect(by['member-once'].status).toBe('FAIL'); expect(by['member-once'].detail).toMatch(/schema\.sql/);
    expect(by['member-typo'].status).toBe('FAIL'); expect(by['member-typo'].detail).toMatch(/append-only\.postgres\.sql/);
    expect(r.code).toBe(1);
  });

  test('a time column the database made 32 bits wide fails and is named; the same column as BIGINT passes', () => {
    const table = (type) => `create table if not exists member_event (id text primary key, created_at ${type} not null, attempts integer);\n`;
    makeModule(library, 'member-narrow', { 'db/schema.sql': table('integer') });
    makeModule(library, 'member-wide', { 'db/schema.sql': table('bigint') });
    const r = quiet(() => db.main(['node', 'module-db-check.js', '--all', '--library', library, '--json']));
    const by = Object.fromEntries(JSON.parse(r.out).modules.map(m => [m.name, m]));
    expect(by['member-narrow'].status).toBe('FAIL'); expect(by['member-narrow'].detail).toMatch(/member_event\.created_at/);
    expect(by['member-wide'].status).toBe('PASS');
    expect(r.code).toBe(1);
  });
});
