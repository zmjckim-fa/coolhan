// The one set of security headers. Every response this server writes goes through writeSecured,
// so a response cannot leave without the headers and without one of the two cache policies.

export const CONTENT_SECURITY_POLICY = [
  "default-src 'none'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self'",
  "connect-src 'self'",
  "form-action 'self'",
  "base-uri 'none'",
  "frame-ancestors 'none'",
].join('; ');

/** JSON, redirects, 404, 405 and the admin screens: never stored and never indexed. */
export const CACHE_NO_STORE = 'no-store';
/** The visitor screen and static files: stored, revalidated on every use. */
export const CACHE_NO_CACHE = 'no-cache';

const STATUS_NO_CONTENT = 204;

const ON_EVERY_RESPONSE = Object.freeze({
  'Content-Security-Policy': CONTENT_SECURITY_POLICY,
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Permissions-Policy': 'geolocation=(), camera=(), microphone=()',
});

/**
 * @param {string} cachePolicy CACHE_NO_STORE or CACHE_NO_CACHE
 * @returns {Record<string, string>}
 */
export function securityHeaders(cachePolicy) {
  if (cachePolicy !== CACHE_NO_STORE && cachePolicy !== CACHE_NO_CACHE) {
    throw new Error('cache_policy_unknown');
  }
  const headers = { ...ON_EVERY_RESPONSE, 'Cache-Control': cachePolicy };
  if (cachePolicy === CACHE_NO_STORE) headers['X-Robots-Tag'] = 'noindex, nofollow';
  return headers;
}

/**
 * Writes one whole response. The security headers win over a header of the same name in `headers`.
 * @param {import('node:http').ServerResponse} response
 * @param {{ status: number, cachePolicy: string, headers?: Record<string, string | string[]>,
 *   body?: Buffer | string }} parts
 */
export function writeSecured(response, { status, cachePolicy, headers = {}, body }) {
  const content = body === undefined ? Buffer.alloc(0) : Buffer.from(body);
  // A 204 carries no body and no length. Every other response states its length, an empty one too.
  const length = status === STATUS_NO_CONTENT ? {} : { 'Content-Length': String(content.length) };
  response.writeHead(status, { ...headers, ...length, ...securityHeaders(cachePolicy) });
  response.end(content);
}
