// A-02 login: the attempt limit (T-04) and the password comparison (scrypt).
// The password is never stored, logged or answered. T-04 keeps a keyed hash of the address, not the address.

import { createHmac, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';

import { checkPassword } from '../web/input-rules.js';
import { ApiFailure } from './json-exchange.js';

const SALT_BYTES = 16;
const KEY_BYTES = 64;
/** A longer value is refused without running scrypt, and still counts as one failure. */
const PASSWORD_MAX_LENGTH = 200;
const FAILURE_WINDOW_MS = 15 * 60 * 1000;
const CLIENT_FAILURE_LIMIT = 5;
const ALL_FAILURE_LIMIT = 20;

function deriveKey(password, salt) {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, KEY_BYTES, (error, key) => {
      if (error) reject(error);
      else resolve(key);
    });
  });
}

/**
 * Derives the key of the admin password once, with a salt made for this run of the server.
 * @param {string} adminPassword
 * @returns {Promise<(given: string) => Promise<boolean>>} compares a given password in constant time.
 */
export async function createPasswordCheck(adminPassword) {
  const salt = randomBytes(SALT_BYTES);
  const expectedKey = await deriveKey(adminPassword, salt);
  return async (given) => {
    if ([...given].length > PASSWORD_MAX_LENGTH) return false;
    return timingSafeEqual(await deriveKey(given, salt), expectedKey);
  };
}

/** Whole seconds until the oldest failure of the window has left it. */
function secondsUntilOutOfWindow(oldestAttemptedAt, at) {
  const leavesAt = new Date(oldestAttemptedAt).getTime() + FAILURE_WINDOW_MS;
  return Math.floor((leavesAt - at.getTime()) / 1000) + 1;
}

/**
 * The Retry-After seconds when a limit is reached, or null when another attempt is allowed.
 * A refused request adds no row, so the failures in a window never pass the limit and the
 * oldest one leaving the window is what lifts it.
 */
function throttledFor(database, clientKey, at) {
  const windowStart = new Date(at.getTime() - FAILURE_WINDOW_MS).toISOString();
  const waits = [];

  const clientFailures = database
    .prepare('SELECT count(*) AS total FROM login_attempt WHERE client_key = ? AND attempted_at >= ? AND succeeded = 0')
    .get(clientKey, windowStart).total;
  if (clientFailures >= CLIENT_FAILURE_LIMIT) {
    const { oldest } = database
      .prepare('SELECT min(attempted_at) AS oldest FROM login_attempt WHERE client_key = ? AND attempted_at >= ? AND succeeded = 0')
      .get(clientKey, windowStart);
    waits.push(secondsUntilOutOfWindow(oldest, at));
  }

  const allFailures = database
    .prepare('SELECT count(*) AS total FROM login_attempt WHERE attempted_at >= ? AND succeeded = 0')
    .get(windowStart).total;
  if (allFailures >= ALL_FAILURE_LIMIT) {
    const { oldest } = database
      .prepare('SELECT min(attempted_at) AS oldest FROM login_attempt WHERE attempted_at >= ? AND succeeded = 0')
      .get(windowStart);
    waits.push(secondsUntilOutOfWindow(oldest, at));
  }

  return waits.length === 0 ? null : Math.max(...waits);
}

/**
 * A-02 handler. Order: clean up, count failures (429 ends here and adds no row),
 * record the attempt as failed, compare, and on a match mark it succeeded and open a session.
 * Earlier failures are never removed by a success; only the window drops them.
 */
export async function logIn({ database, environment, now, sessions, passwordMatches }, { body, clientAddress }) {
  const rule = checkPassword(body.password);
  if (!rule.ok) throw new ApiFailure(rule.code);

  database.removeExpiredRows();
  const at = now();
  const clientKey = createHmac('sha256', environment.sessionSecret).update(String(clientAddress)).digest('hex');
  const retryAfter = throttledFor(database, clientKey, at);
  if (retryAfter !== null) throw new ApiFailure('login_throttled', { 'Retry-After': String(retryAfter) });

  const attemptId = database
    .prepare('INSERT INTO login_attempt (client_key, attempted_at, succeeded) VALUES (?, ?, 0)')
    .run(clientKey, at.toISOString()).lastInsertRowid;

  if (!(await passwordMatches(body.password))) throw new ApiFailure('login_failed');

  const opened = database.transaction(() => {
    database.prepare('UPDATE login_attempt SET succeeded = 1 WHERE id = ?').run(attemptId);
    return sessions.open();
  });
  return { status: 200, body: { csrf_token: opened.csrfToken }, headers: { 'Set-Cookie': opened.cookie } };
}
