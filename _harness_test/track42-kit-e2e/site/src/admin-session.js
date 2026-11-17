// Admin sessions (T-03) and the handlers of A-03 and A-04.
// The cookie value is `token.signature`. The database keeps only the SHA-256 of the token,
// so neither a copy of the database file nor a made-up cookie signs anyone in.

import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

export const SESSION_COOKIE_NAME = 'bakery_admin';
export const SESSION_LIFETIME_MS = 24 * 60 * 60 * 1000;

const SECRET_BYTES = 32;
/** No Secure and no Domain: the server only listens on 127.0.0.1 over HTTP (docs/plan/05 section 5-2). */
const COOKIE_ATTRIBUTES = 'HttpOnly; SameSite=Strict; Path=/';
const CLEARING_COOKIE = `${SESSION_COOKIE_NAME}=; ${COOKIE_ATTRIBUTES}; Max-Age=0`;
const COOKIE_PREFIX = `${SESSION_COOKIE_NAME}=`;

const randomSecret = () => randomBytes(SECRET_BYTES).toString('base64url');

/** Compares two texts without stopping at the first different byte. Only the lengths can be learned. */
function sameText(given, expected) {
  const givenBytes = Buffer.from(given);
  const expectedBytes = Buffer.from(expected);
  return givenBytes.length === expectedBytes.length && timingSafeEqual(givenBytes, expectedBytes);
}

function cookieValue(cookieHeader) {
  if (typeof cookieHeader !== 'string') return null;
  const pair = cookieHeader.split(';').map((part) => part.trim()).find((part) => part.startsWith(COOKIE_PREFIX));
  return pair === undefined ? null : pair.slice(COOKIE_PREFIX.length);
}

/**
 * @param {{ environment: { sessionSecret: string, adminPassword: string },
 *   database: ReturnType<typeof import('./database.js').openDatabase>, now: () => Date }} parts
 */
export function createAdminSessions({ environment, database, now }) {
  // Changing either secret changes the key, so every cookie signed before is refused.
  const signingKey = createHmac('sha256', environment.sessionSecret).update(environment.adminPassword).digest();
  const signatureOf = (token) => createHmac('sha256', signingKey).update(token).digest('base64url');
  const hashOf = (token) => createHash('sha256').update(token).digest('hex');

  return Object.freeze({
    /**
     * Stores a new session that ends 24 hours from now and is never extended.
     * @returns {{ csrfToken: string, cookie: string }} `cookie` is the Set-Cookie value.
     */
    open() {
      const token = randomSecret();
      const csrfToken = randomSecret();
      const createdAt = now();
      const expiresAt = new Date(createdAt.getTime() + SESSION_LIFETIME_MS);
      database
        .prepare('INSERT INTO admin_session (token_hash, csrf_token, created_at, expires_at) VALUES (?, ?, ?, ?)')
        .run(hashOf(token), csrfToken, createdAt.toISOString(), expiresAt.toISOString());
      const maxAge = SESSION_LIFETIME_MS / 1000;
      return { csrfToken, cookie: `${COOKIE_PREFIX}${token}.${signatureOf(token)}; ${COOKIE_ATTRIBUTES}; Max-Age=${maxAge}` };
    },

    /**
     * The live session of a Cookie header, or null. A wrong signature is refused before the database is read.
     * @param {string | undefined} cookieHeader
     * @returns {{ tokenHash: string, csrfToken: string } | null}
     */
    find(cookieHeader) {
      const parts = (cookieValue(cookieHeader) ?? '').split('.');
      if (parts.length !== 2 || parts[0] === '') return null;
      const [token, signature] = parts;
      if (!sameText(signature, signatureOf(token))) return null;
      const tokenHash = hashOf(token);
      const row = database
        .prepare('SELECT csrf_token FROM admin_session WHERE token_hash = ? AND expires_at > ?')
        .get(tokenHash, now().toISOString());
      return row === undefined ? null : { tokenHash, csrfToken: row.csrf_token };
    },

    /** True when `token` is this session's CSRF token. */
    csrfTokenMatches(session, token) {
      return typeof token === 'string' && sameText(token, session.csrfToken);
    },

    /**
     * Removes the session row.
     * @returns {string} the Set-Cookie value that removes the cookie.
     */
    close(session) {
      database.prepare('DELETE FROM admin_session WHERE token_hash = ?').run(session.tokenHash);
      return CLEARING_COOKIE;
    },
  });
}

/** A-03 handler: the session row and the cookie are removed. */
export function logOut({ sessions }, { session }) {
  return { status: 204, headers: { 'Set-Cookie': sessions.close(session) } };
}

/** A-04 handler: hands the CSRF token to an admin screen. The session is not extended. */
export function checkSession(app, { session }) {
  return { status: 200, body: { csrf_token: session.csrfToken } };
}
