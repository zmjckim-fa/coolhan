#!/usr/bin/env node
/**
 * CoolHan module database check: every module's db/schema.sql and its PostgreSQL guard files are run on a real
 * PostgreSQL, on a throwaway cluster that is created for the run and removed after it (part of G25).
 *
 * Why (2026-11-22): module schemas had been run on SQLite only and reported as «not run on PostgreSQL». The first
 * real run showed all schemas ran, and that seven modules kept «this table is append-only» with a trigger on SQLite
 * only: on PostgreSQL an UPDATE or DELETE went through. A statement about a database is measured on that database.
 *
 * What is measured per module that has db/schema.sql:
 *   schema   db/schema.sql runs, and runs a second time (a site applies it again on every deploy)
 *   guards   every db/*.postgres.sql runs after the schema, twice
 *   int32    no column that holds a point in time or money came out as a 32-bit integer (2026-11-23: 32 columns in 15
 *            modules had; the schemas «passed» because running DDL inserts nothing). The name rule is module-check's
 *   counts   tables and triggers that exist afterwards (a number for the report, not a verdict)
 * Not measured: whether a guard refuses what it should (a module's docs/postgres-check.md holds those statements),
 * concurrency, other PostgreSQL versions, the module's own code against PostgreSQL.
 *
 * The cluster: `initdb` into a fresh temp directory with trust authentication, listening on 127.0.0.1 only, on its own
 * port. No password is used and the machine's own PostgreSQL service and data are not touched.
 *
 * Usage:
 *   node scripts/module-db-check.js <name...|--all> --library <dir> [--pg-bin <dir>] [--json]
 *
 * Exit: 0 every measured module PASS · 1 any FAIL · 2 usage · 4 nothing measured (no PostgreSQL binaries, the
 *       cluster did not start, no named module has a schema): never a pass
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { argValue } = require('./lib/cli');
const { isDir, removeTree } = require('./lib/fs');
const { t } = require('./messages');
const { catalog } = require('./modules');
const { int32Risk, int32Columns } = require('./module-check');

const EXE = process.platform === 'win32' ? '.exe' : '';
const TOOLS = ['initdb', 'pg_ctl', 'psql'];

/** Folders that may hold the PostgreSQL programs, most specific first. */
function candidateBins(explicit, env = process.env) {
  // A folder that was named is the only place looked at: naming one and getting another would measure something else.
  if (explicit) return [explicit];
  const out = [];
  if (env.COOLHAN_PG_BIN) out.push(env.COOLHAN_PG_BIN);
  for (const root of ['C:/Program Files/PostgreSQL', '/usr/lib/postgresql', '/opt/homebrew/opt', '/usr/local/opt']) {
    if (!isDir(root)) continue;
    for (const v of fs.readdirSync(root).sort().reverse()) out.push(path.join(root, v, 'bin'));
  }
  for (const p of String(env.PATH || '').split(path.delimiter)) if (p) out.push(p);
  return out;
}

/** The first folder that holds all three programs, or null. */
function findBin(explicit, env = process.env) {
  return candidateBins(explicit, env).find(dir => TOOLS.every(x => fs.existsSync(path.join(dir, x + EXE)))) || null;
}

const CLUSTER_PREFIX = 'coolhan-pg-';
const STALE_MS = 10 * 60 * 1000;
/**
 * Removes cluster folders an earlier run could not remove. Measured: a folder that was held right after its server
 * stopped (ten tries over three seconds failed) was removable four minutes later. Only folders this gate names
 * (the prefix), older than ten minutes, and without a server's pid file (a cluster another run is using has one)
 * are touched; one try each, and a folder that is still held stays. Returns the names it removed.
 */
function clearStale(tmp = os.tmpdir(), now = Date.now(), rm = fs.rmSync) {
  const removed = [];
  let names = [];
  try { names = fs.readdirSync(tmp); } catch (_) { return removed; }
  for (const name of names) {
    if (!name.startsWith(CLUSTER_PREFIX)) continue;
    const dir = path.join(tmp, name);
    let age = 0;
    try { age = now - fs.statSync(dir).mtimeMs; } catch (_) { continue; }
    if (age < STALE_MS || fs.existsSync(path.join(dir, 'postmaster.pid'))) continue;
    if (removeTree(dir, rm, () => {}, 1) === null) removed.push(name);
  }
  return removed;
}

/** A throwaway cluster: { psql(db, args), stop() } or { error }. `stop()` returns the folder it could not remove, or null. */
function startCluster(bin) {
  clearStale();
  const data = fs.mkdtempSync(path.join(os.tmpdir(), CLUSTER_PREFIX));
  const run = (exe, args, opts = {}) => spawnSync(path.join(bin, exe + EXE), args, { encoding: 'utf8', ...opts });
  const init = run('initdb', ['-D', data, '-U', 'tester', '-A', 'trust', '-E', 'UTF8', '--no-locale']);
  if (init.status !== 0) { removeTree(data); return { error: t('dbcheck.initFailed', { text: String(init.stderr || init.error || '').trim().split('\n')[0] }) }; }
  const log = path.join(data, 'server.log');
  const stop = () => { run('pg_ctl', ['stop', '-D', data, '-m', 'fast', '-w'], { stdio: 'ignore' }); return removeTree(data); };
  // A port can be taken or reserved by the system (measured: Windows keeps ranges inside 55000-59000 for itself and a
  // server asked to listen there does not start). Another port is tried before the run is called «not measured».
  let port = ''; let started = false; let why = '';
  for (let attempt = 0; attempt < 5 && !started; attempt++) {
    port = String(55000 + Math.floor(Math.random() * 4000));
    // The server keeps the handles it inherits: with pipes the start command never returns to its caller.
    const start = run('pg_ctl', ['start', '-D', data, '-w', '-l', log, '-o', `-p ${port} -c listen_addresses=127.0.0.1`], { stdio: 'ignore' });
    started = start.status === 0;
    if (!started) {
      let text = ''; try { text = fs.readFileSync(log, 'utf8'); } catch (_) { /* no log yet */ }
      why = (text.split('\n').reverse().find(l => /FATAL|could not/.test(l)) || `exit ${start.status}`).replace(/^.*?(FATAL|LOG|WARNING):\s*/, '').trim().slice(0, 200);
      run('pg_ctl', ['stop', '-D', data, '-m', 'fast', '-w'], { stdio: 'ignore' });
    }
  }
  if (!started) { stop(); return { error: t('dbcheck.startFailed', { exit: why }) }; }
  const psql = (db, args) => run('psql', ['-h', '127.0.0.1', '-p', port, '-U', 'tester', '-d', db, '-v', 'ON_ERROR_STOP=1', '-X', '-q', ...args], { env: { ...process.env, PGCLIENTENCODING: 'UTF8' } });
  return { psql, stop };
}

const firstError = (r) => (String(r.stderr || '').split('\n').find(l => /ERROR|FATAL/.test(l)) || `exit ${r.status}`).trim().slice(0, 240);

/** Measure one module on a running cluster. `psql(db, args)` returns { status, stdout, stderr }. */
function checkModule(name, dir, psql) {
  const schema = path.join(dir, 'db', 'schema.sql');
  if (!fs.existsSync(schema)) return { name, status: 'NOT_RUN', detail: t('dbcheck.noSchema') };
  const db = 'm_' + name.replace(/-/g, '_');
  const made = psql('postgres', ['-c', `create database ${db}`]);
  if (made.status !== 0) return { name, status: 'NOT_RUN', detail: t('dbcheck.noDatabase', { text: firstError(made) }) };
  const steps = [];
  const apply = (label, file) => {
    for (const pass of [1, 2]) {
      const r = psql(db, ['-f', file]);
      if (r.status !== 0) { steps.push({ step: label, pass, ok: false, error: firstError(r) }); return false; }
    }
    steps.push({ step: label, ok: true });
    return true;
  };
  let ok = apply('schema.sql', schema);
  const guards = fs.readdirSync(path.join(dir, 'db')).filter(f => f.endsWith('.postgres.sql')).sort();
  if (ok) for (const g of guards) ok = apply(g, path.join(dir, 'db', g)) && ok;
  const count = (sql) => { const r = psql(db, ['-At', '-c', sql]); return r.status === 0 ? Number(String(r.stdout).trim()) : null; };
  if (ok) {
    // What the database really made: a time or money column that came out as a 32-bit integer cannot hold its values.
    const r = psql(db, ['-At', '-c', "select table_name || '.' || column_name from information_schema.columns where table_schema = 'public' and data_type = 'integer' order by 1"]);
    const allowed = int32Columns(dir).allowed;
    const small = r.status === 0 ? String(r.stdout).split(/\r?\n/).map(s => s.trim()).filter(Boolean).filter(c => { const col = c.split('.')[1]; return int32Risk(col) && !allowed.has(col.toLowerCase()); }) : [];
    if (small.length) { ok = false; steps.push({ step: 'int32', ok: false, columns: small, error: t('dbcheck.int32', { columns: small.join(', ') }) }); }
  }
  const failed = steps.find(s => !s.ok);
  return {
    name, status: ok ? 'PASS' : 'FAIL', steps, guards: guards.length,
    tables: ok ? count("select count(*) from information_schema.tables where table_schema='public'") : null,
    triggers: ok ? count("select count(distinct trigger_name) from information_schema.triggers where trigger_schema='public'") : null,
    detail: failed ? (failed.step === 'int32' ? failed.error : t('dbcheck.stepFailed', { step: failed.step, pass: failed.pass, error: failed.error })) : t('dbcheck.modulePass', { guards: guards.length })
  };
}

function main(argv, opts = {}) {
  const args = argv.slice(2);
  const VALUE = ['--library', '--pg-bin'];
  const bad = args.find(a => a.startsWith('--') && ![...VALUE, '--json', '--all'].includes(a));
  let names = args.filter((a, i) => !a.startsWith('--') && !VALUE.includes(args[i - 1]));
  if (bad || (!names.length && !args.includes('--all'))) { console.error(t('dbcheck.usage')); return 2; }
  const library = argValue(args, '--library') || process.env.COOLHAN_MODULES || '';
  const cat = isDir(library) ? catalog(library) : null;
  if (!cat) { console.error(t('modules.noLibrary')); return 4; }
  if (args.includes('--all')) names = Object.keys(cat).sort();
  const withSchema = names.filter(n => cat[n] && fs.existsSync(path.join(cat[n].dir, 'db', 'schema.sql')));
  const json = args.includes('--json');
  const say = (o, line) => console.log(json ? JSON.stringify(o, null, 2) : line);
  if (!withSchema.length) { say({ status: 'NOT_RUN', reason: 'no_schema', modules: [] }, t('dbcheck.nothing')); return 4; }
  const bin = (opts.findBin || findBin)(argValue(args, '--pg-bin'));
  if (!bin) { say({ status: 'NOT_RUN', reason: 'no_postgres', modules: [] }, t('dbcheck.noPostgres')); return 4; }
  const cluster = (opts.startCluster || startCluster)(bin);
  if (cluster.error) { say({ status: 'NOT_RUN', reason: 'no_cluster', detail: cluster.error, modules: [] }, t('dbcheck.noCluster', { detail: cluster.error })); return 4; }
  let results; let version = ''; let leftover = null;
  try {
    const v = cluster.psql('postgres', ['-At', '-c', 'show server_version']);
    version = String(v.stdout || '').trim();
    results = withSchema.map(n => checkModule(n, cat[n].dir, cluster.psql));
  } finally {
    // The cluster is always stopped; a stop or a removal that fails is reported and never replaces the verdict.
    try { const left = cluster.stop(); leftover = typeof left === 'string' && left ? left : null; } catch (e) { leftover = String((e && e.message) || e); }
  }
  const failed = results.filter(r => r.status === 'FAIL').length;
  const notRun = results.filter(r => r.status === 'NOT_RUN').length;
  const status = failed ? 'FAIL' : notRun ? 'NOT_RUN' : 'PASS';
  if (leftover && !json) console.error(t('dbcheck.leftover', { path: leftover }));
  if (json) console.log(JSON.stringify({ status, server: version, modules: results, ...(leftover ? { leftover } : {}) }, null, 2));
  else {
    for (const r of results.filter(x => x.status !== 'PASS')) console.log(`  ${r.status === 'FAIL' ? '✗' : '○'} ${r.name}: ${r.detail}`);
    console.log(t('dbcheck.summary', {
      mark: status === 'PASS' ? '✔' : status === 'FAIL' ? '✗' : '○', status, server: version, total: results.length, pass: results.filter(r => r.status === 'PASS').length, failed, notRun,
      tables: results.reduce((n, r) => n + (r.tables || 0), 0), triggers: results.reduce((n, r) => n + (r.triggers || 0), 0), guards: results.reduce((n, r) => n + (r.guards || 0), 0)
    }));
  }
  return failed ? 1 : notRun ? 4 : 0;
}

if (require.main === module) process.exit(main(process.argv));

module.exports = { main, checkModule, findBin, candidateBins, startCluster, removeTree, clearStale };
