// Error catalog: every error code with its HTTP status and dictionary key.
// Request and processing errors are defined here. Input errors are defined in web/input-rules.js
// and merged in. A code lives in exactly one of the two files. Error responses are built only here.

import { INPUT_ERRORS } from '../web/input-rules.js';

/** @typedef {import('../web/input-rules.js').ApiError} ApiError */

const entry = (status, text_key) => Object.freeze({ status, text_key });

/** Request and processing errors. */
export const REQUEST_ERRORS = Object.freeze({
  not_found: entry(404, 'error.page.missing'),
  method_not_allowed: entry(405, 'error.page.missing'),
  unsupported_media_type: entry(415, 'error.server'),
  body_too_large: entry(413, 'error.server'),
  bad_json: entry(400, 'error.server'),
  bad_shape: entry(400, 'error.server'),
  read_failed: entry(500, 'error.load'),
  server_error: entry(500, 'error.server'),
  auth_required: entry(401, 'error.session.expired'),
  csrf_rejected: entry(403, 'error.form.expired'),
  login_failed: entry(401, 'error.login.failed'),
  login_throttled: entry(429, 'error.login.locked'),
  menu_not_found: entry(404, 'error.menu.missing'),
  menu_order_mismatch: entry(409, 'error.menu.order'),
  menu_limit_reached: entry(409, 'error.menu.limit'),
});

/** Every error code the server can answer with. */
export const ERROR_CATALOG = Object.freeze({ ...REQUEST_ERRORS, ...INPUT_ERRORS });

/**
 * The status and body of the error response for a code. A code outside the catalog is a
 * programming error and throws.
 * @param {string} code
 * @returns {{ status: number, body: ApiError }}
 */
export function errorResponse(code) {
  if (!Object.hasOwn(ERROR_CATALOG, code)) throw new Error(`unknown error code: ${code}`);
  const { status, text_key } = ERROR_CATALOG[code];
  return { status, body: { error: { code, text_key } } };
}
