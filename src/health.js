'use strict';

/**
 * Health Check core logic — 00_health_check_system.md (Task 2 spec).
 *
 * Pure, side-effect-free computation of the HealthStatus response model.
 * No DB / Redis / external dependency (intended design per spec §10.2).
 *
 * Response model (spec §1.1) — whitelist-fixed to exactly 4 fields:
 *   { status, uptime_seconds, version, timestamp }
 */

const fs = require('fs');
const path = require('path');

// Allowed status values (spec §1.2). MVP returns "ok"; "down" on internal error.
const STATUS = Object.freeze({
  OK: 'ok',
  DEGRADED: 'degraded',
  DOWN: 'down',
});

/**
 * Resolve application version (spec §1.3):
 *   1. env APP_VERSION (build-time injection), else
 *   2. package.json "version" field, else
 *   3. "0.0.0" fallback.
 * @returns {string} non-empty semver-ish string
 */
function resolveVersion() {
  if (process.env.APP_VERSION && String(process.env.APP_VERSION).trim() !== '') {
    return String(process.env.APP_VERSION).trim();
  }
  try {
    const pkgPath = path.join(__dirname, '..', 'package.json');
    const raw = fs.readFileSync(pkgPath, 'utf8');
    const pkg = JSON.parse(raw);
    if (pkg && typeof pkg.version === 'string' && pkg.version.trim() !== '') {
      return pkg.version.trim();
    }
  } catch (_err) {
    // Swallow — never leak internal paths/errors to caller (spec §4.1).
  }
  return '0.0.0';
}

/**
 * Compute uptime in whole seconds since process start (spec §1.3).
 * uptime_seconds = floor((now - process_start_time) / 1000), monotonic, >= 0.
 * @returns {number} integer >= 0
 */
function getUptimeSeconds() {
  // process.uptime() returns fractional seconds since process start.
  return Math.max(0, Math.floor(process.uptime()));
}

/**
 * Build the health status response model (spec §3.1).
 * Read-only, no side effects (invariant §3.3).
 *
 * @returns {{ ok: boolean, httpStatus: number, body: {status: string, uptime_seconds: number, version: string, timestamp: string} }}
 */
function buildHealth() {
  try {
    const body = {
      status: STATUS.OK,
      uptime_seconds: getUptimeSeconds(),
      version: resolveVersion(),
      timestamp: new Date().toISOString(), // ISO-8601 UTC (Z suffix)
    };
    return { ok: true, httpStatus: 200, body };
  } catch (_err) {
    // Generalized failure — never expose internal exception text (spec §4.4).
    const body = {
      status: STATUS.DOWN,
      uptime_seconds: getUptimeSeconds(),
      version: resolveVersion(),
      timestamp: new Date().toISOString(),
    };
    return { ok: false, httpStatus: 503, body };
  }
}

module.exports = { STATUS, resolveVersion, getUptimeSeconds, buildHealth };
