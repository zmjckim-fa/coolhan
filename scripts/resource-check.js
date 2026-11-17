#!/usr/bin/env node
/**
 * CoolHan machine headroom probe (D-13).
 *
 * Observed on the development machine: every full test run that failed with empty output from a hook child
 * process ended within 30 seconds of a Windows «low virtual memory» record (System log, event 2004), and
 * launches under CPU saturation alone, with memory to spare, did not fail. A child process that cannot get
 * memory never starts: a hook does not run (the stop block is missing at that moment), a test sees no output,
 * a gate reports nothing. That is a state of the machine, not a result of the script.
 *
 * This probe measures how much memory a new process can still get:
 *   Windows  commit headroom (Win32_OperatingSystem.FreeVirtualMemory) and the largest consumers by name
 *   Linux    MemAvailable + SwapFree from /proc/meminfo
 *   other    not measured (exit 4, never a pass)
 *
 * Usage: node scripts/resource-check.js [--min-free-mb <n>] [--json]
 * Exit:  0 enough headroom · 1 low: child processes may not start · 2 usage · 4 could not measure
 */

const fs = require('fs');
const { spawnSync } = require('child_process');
const { argValue } = require('./lib/cli');
const { t } = require('./messages');

const DEFAULT_MIN_FREE_MB = 1024;
const KNOWN_FLAGS = new Set(['--min-free-mb', '--json']);
const WIN_QUERY = '$o=Get-CimInstance Win32_OperatingSystem; "$($o.TotalVirtualMemorySize) $($o.FreeVirtualMemory) $($o.FreePhysicalMemory)"; '
  + 'Get-Process | Sort-Object PM -Descending | Select-Object -First 3 | ForEach-Object { "$($_.ProcessName) $([int]($_.PM/1MB))" }';

const mbOfKb = (kb) => Math.round(Number(kb) / 1024);
const notMeasured = (reason) => ({ measured: false, reason });

function measureWindows(run) {
  const r = run('powershell', ['-NoProfile', '-NonInteractive', '-Command', WIN_QUERY], { encoding: 'utf8', timeout: 30000, windowsHide: true });
  if (r.error || r.status !== 0) return notMeasured(r.error ? (r.error.code || r.error.message) : `exit ${r.status}`);
  const [first, ...rest] = String(r.stdout || '').trim().split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const nums = (first || '').split(/\s+/).map(Number);
  if (nums.length < 3 || nums.some(n => !Number.isFinite(n))) return notMeasured('unreadable output');
  const top = rest.map(l => { const m = l.match(/^(.+)\s+(\d+)$/); return m ? { name: m[1], mb: Number(m[2]) } : null; }).filter(Boolean);
  return { measured: true, source: 'windows-commit', limit_mb: mbOfKb(nums[0]), free_mb: mbOfKb(nums[1]), physical_free_mb: mbOfKb(nums[2]), top };
}

function measureLinux(readFile) {
  let text; try { text = readFile('/proc/meminfo', 'utf8'); } catch (e) { return notMeasured(e.code || e.message); }
  const kb = (key) => { const m = text.match(new RegExp(`^${key}:\\s+(\\d+)\\s*kB`, 'm')); return m ? Number(m[1]) : null; };
  const [total, avail, swapTotal, swapFree] = ['MemTotal', 'MemAvailable', 'SwapTotal', 'SwapFree'].map(kb);
  if (total === null || avail === null) return notMeasured('unreadable /proc/meminfo');
  return { measured: true, source: 'linux-meminfo', limit_mb: mbOfKb(total + (swapTotal || 0)), free_mb: mbOfKb(avail + (swapFree || 0)), physical_free_mb: mbOfKb(avail), top: [] };
}

/** How much memory a new process can still get. `opts` lets a test supply the platform and the readers. */
function measure(opts = {}) {
  const platform = opts.platform || process.platform;
  if (platform === 'win32') return measureWindows(opts.run || spawnSync);
  if (platform === 'linux') return measureLinux(opts.readFile || fs.readFileSync);
  return notMeasured(`platform ${platform}`);
}

/** status: PASS enough headroom, LOW below the floor, NOT_RUN could not measure. */
function verdict(m, minFreeMb = DEFAULT_MIN_FREE_MB) {
  if (!m.measured) return { status: 'NOT_RUN', min_free_mb: minFreeMb, ...m };
  return { status: m.free_mb < minFreeMb ? 'LOW' : 'PASS', min_free_mb: minFreeMb, ...m };
}

/** One line for a report; the same text for the CLI, checks-run and the retry note. */
function line(v) {
  if (v.status === 'NOT_RUN') return t('resource.notRun', { reason: v.reason });
  const top = v.top.length ? t('resource.top', { top: v.top.map(p => `${p.name} ${p.mb}MB`).join(', ') }) : '';
  return t(v.status === 'LOW' ? 'resource.low' : 'resource.pass', { free: v.free_mb, limit: v.limit_mb, min: v.min_free_mb, physical: v.physical_free_mb, top });
}

function main(argv, opts = {}) {
  const args = argv.slice(2);
  const raw = argValue(args, '--min-free-mb');
  const min = raw === undefined ? DEFAULT_MIN_FREE_MB : Number(raw);
  const stray = args.find((a, i) => !KNOWN_FLAGS.has(a) && args[i - 1] !== '--min-free-mb');
  if (stray || !Number.isFinite(min) || min < 0) { console.error(t('resource.usage')); return 2; }
  const v = verdict(measure(opts), min);
  console.log(args.includes('--json') ? JSON.stringify(v, null, 2) : line(v));
  return v.status === 'PASS' ? 0 : v.status === 'LOW' ? 1 : 4;
}

if (require.main === module) process.exit(main(process.argv));

module.exports = { measure, verdict, line, main, DEFAULT_MIN_FREE_MB };
