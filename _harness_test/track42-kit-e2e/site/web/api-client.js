// API calls for every screen.
//
// A call never throws for an expected failure. It resolves to one of:
//   { ok: true,  status, data }             data is the JSON body, or null for 204
//   { ok: false, status, code, text_key }   text_key is a dictionary key the screen can show
// When the server cannot be reached, status is 0, code is null and text_key is error.network.
// When an answer does not carry the agreed JSON shape, code is null and text_key is error.load
// for a read (GET) and error.server for a write.
//
// The move to the login screen lives here and nowhere else: only the error code auth_required
// sends the browser to /admin/login#expired, and never from the login screen itself. The status
// code 401 alone does not move anything, because login_failed is also 401.
//
// The CSRF token is kept in memory only. A screen hands it over with setCsrfToken after A-04
// answers, and every request that is not a GET carries it in the X-CSRF-Token header.

/** @typedef {import('./input-rules.js').ApiError} ApiError */

/**
 * @typedef {{ ok: true, status: number, data: any }} ApiSuccess
 * @typedef {{ ok: false, status: number, code: string | null, text_key: string }} ApiFailure
 * @typedef {ApiSuccess | ApiFailure} ApiResult
 */

const LOGIN_PATH = '/admin/login';
const EXPIRED_LOGIN_ADDRESS = `${LOGIN_PATH}#expired`;
const AUTH_REQUIRED = 'auth_required';
const CSRF_HEADER = 'X-CSRF-Token';
const JSON_TYPE = 'application/json';
const NO_CONTENT = 204;
const NETWORK_TEXT_KEY = 'error.network';
const UNREADABLE_READ_TEXT_KEY = 'error.load';
const UNREADABLE_WRITE_TEXT_KEY = 'error.server';

/**
 * @param {number} status
 * @param {string | null} code
 * @param {string} text_key
 * @returns {ApiFailure}
 */
function failure(status, code, text_key) {
  return { ok: false, status, code, text_key };
}

/**
 * The JSON body of a response, or null when it has none or it cannot be read.
 * @param {{ json(): Promise<unknown> }} response
 */
async function readJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

/**
 * The error of a body when it has the agreed shape, otherwise null.
 * @param {unknown} body
 * @returns {ApiError['error'] | null}
 */
function agreedError(body) {
  const error = body !== null && typeof body === 'object' ? body.error : undefined;
  const agreed = error !== null && typeof error === 'object' && typeof error.code === 'string' && typeof error.text_key === 'string';
  return agreed ? error : null;
}

/**
 * Tests pass their own fetch and location. Screens use the shared client below.
 * @param {{ fetch?: typeof globalThis.fetch, location?: { pathname: string, assign(address: string): void } }} [browser]
 */
export function createApiClient({ fetch: givenFetch, location: givenLocation } = {}) {
  /** @type {string | null} */
  let csrfToken = null;
  const send = givenFetch ?? ((...request) => globalThis.fetch(...request));
  const currentLocation = () => givenLocation ?? globalThis.location;

  /**
   * @param {'GET' | 'POST' | 'PUT' | 'DELETE'} method
   * @param {string} path
   * @param {object} [body] sent as JSON when given
   * @returns {Promise<ApiResult>}
   */
  async function request(method, path, body) {
    const headers = { Accept: JSON_TYPE };
    const init = { method, headers, credentials: 'same-origin' };
    if (body !== undefined) {
      headers['Content-Type'] = JSON_TYPE;
      init.body = JSON.stringify(body);
    }
    if (method !== 'GET' && csrfToken !== null) headers[CSRF_HEADER] = csrfToken;

    let response;
    try {
      response = await send(path, init);
    } catch {
      return failure(0, null, NETWORK_TEXT_KEY);
    }

    const { status } = response;
    if (response.ok && status === NO_CONTENT) return { ok: true, status, data: null };

    const payload = await readJson(response);
    const unreadable = () => failure(status, null, method === 'GET' ? UNREADABLE_READ_TEXT_KEY : UNREADABLE_WRITE_TEXT_KEY);
    if (response.ok) {
      return payload !== null && typeof payload === 'object' ? { ok: true, status, data: payload } : unreadable();
    }

    const error = agreedError(payload);
    if (error === null) return unreadable();
    if (error.code === AUTH_REQUIRED) {
      const location = currentLocation();
      if (location.pathname !== LOGIN_PATH) location.assign(EXPIRED_LOGIN_ADDRESS);
    }
    return failure(status, error.code, error.text_key);
  }

  /** @param {string | null} token the csrf_token of A-02 or A-04 */
  function setCsrfToken(token) {
    csrfToken = token;
  }

  return { request, setCsrfToken };
}

const shared = createApiClient();

/** The request function of the one client that all screens of a page share. */
export const callApi = shared.request;

/** Hands the CSRF token to that shared client. */
export const setCsrfToken = shared.setCsrfToken;
