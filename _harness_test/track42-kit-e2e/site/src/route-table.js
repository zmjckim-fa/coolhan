// The route table: the API rows and the four screen rows, and the one order every request passes.
// The server sends requests only through this table. A row cannot exist without a permission.
//
// Order (docs/plan/05 section 2-1). The first check that fails answers; later ones are not looked at.
//  1 the path is a row or an allow-listed static address   404 not_found
//  2 the path has this method                              405 method_not_allowed
//  3 admin rows: a signed cookie with a live session       API 401 auth_required, screen 302
//  4 CSRF rows: token equals the session's, same origin    403 csrf_rejected
//  5-7 rows with a body: media type, size, JSON object     415, 413, 400 bad_json
//  8 the body has the row's shape                          400 bad_shape
//  9-10 the handler: input rules, then the work            400 by rule, 404, 409, 500

import { logIn } from './admin-login.js';
import { checkSession, logOut } from './admin-session.js';
import { readHours, saveHours } from './business-hours.js';
import {
  ApiFailure,
  FIELD_ARRAY,
  FIELD_INTEGER,
  FIELD_STRING,
  FIELD_STRING_OR_NULL,
  FIELD_UNTYPED,
  FIELD_ZERO_OR_ONE,
  matchesBodyShape,
  readJsonBody,
  sendError,
  sendJson,
} from './json-exchange.js';
import { addMenuItem, changeMenuItem, MENU_ITEM_LIMIT, readMenu, removeMenuItem, saveMenuOrder } from './menu-items.js';
import { readOverview } from './public-overview.js';
import { CACHE_NO_CACHE, CACHE_NO_STORE, writeSecured } from './security-headers.js';

const PERMISSION_NONE = 'none';
const PERMISSION_ADMIN = 'admin';
const PERMISSIONS = Object.freeze([PERMISSION_NONE, PERMISSION_ADMIN]);
const METHODS = Object.freeze(['GET', 'POST', 'PUT', 'DELETE']);
const READ_METHOD = 'GET';
const API_PREFIX = '/api/';
const PATH_ID_SLOT = '{id}';
const LOGIN_SCREEN_PATH = '/admin/login';

/**
 * One API row.
 * `body` is null for a row without a body, or the body shape json-exchange compares (field names and JSON types).
 * `handle(app, exchange)` returns `{ status, body?, headers? }` or throws ApiFailure.
 */
function apiRoute(row) {
  const { id, method, path, permission, csrf, body, handle } = row;
  if (typeof id !== 'string' || !METHODS.includes(method)) throw new Error('an API row needs an id and a known method');
  if (typeof path !== 'string' || !path.startsWith(API_PREFIX)) throw new Error(`${id}: an API path starts with ${API_PREFIX}`);
  if (!PERMISSIONS.includes(permission)) throw new Error(`${id}: a row needs a permission`);
  if (typeof csrf !== 'boolean' || (csrf && permission !== PERMISSION_ADMIN)) throw new Error(`${id}: csrf is true or false, and true only on an admin row`);
  if (body !== null && typeof body !== 'object') throw new Error(`${id}: body is null or a body shape`);
  if (typeof handle !== 'function') throw new Error(`${id}: a row needs a handler`);
  return Object.freeze({ id, method, path, permission, csrf, body, handle });
}

/** One screen row. The page is sent only through this row, never by its file name. */
function screenRoute(row) {
  const { id, path, file, permission, cachePolicy } = row;
  if (!PERMISSIONS.includes(permission)) throw new Error(`${id}: a row needs a permission`);
  return Object.freeze({ id, path, file, permission, cachePolicy });
}

// Body shapes: field names and JSON types only. `ownCode` marks a field whose absence has its own
// error code, reported by the input rule instead of bad_shape.
const LOGIN_BODY = Object.freeze({ password: { type: FIELD_STRING, ownCode: true } });
const HOURS_BODY = Object.freeze({
  business_hour: {
    type: FIELD_ARRAY,
    items: {
      weekday: { type: FIELD_INTEGER },
      opens_at: { type: FIELD_STRING_OR_NULL },
      closes_at: { type: FIELD_STRING_OR_NULL },
      is_day_off: { type: FIELD_ZERO_OR_ONE },
    },
  },
});
// The type of price_krw belongs to its input rule: a string price is menu_price_range, not bad_shape.
const MENU_NEW_BODY = Object.freeze({
  name: { type: FIELD_STRING, ownCode: true },
  price_krw: { type: FIELD_UNTYPED },
  category: { type: FIELD_STRING, ownCode: true },
});
const MENU_CHANGE_BODY = Object.freeze({ ...MENU_NEW_BODY, sale_status: { type: FIELD_STRING, ownCode: true } });
const MENU_ORDER_BODY = Object.freeze({
  category: { type: FIELD_STRING, ownCode: true },
  id: { type: FIELD_ARRAY, items: FIELD_INTEGER, maxItems: MENU_ITEM_LIMIT, distinct: true },
});

export const API_ROUTES = Object.freeze([
  apiRoute({ id: 'A-01', method: 'GET', path: '/api/public/overview', permission: PERMISSION_NONE, csrf: false, body: null, handle: readOverview }),
  apiRoute({ id: 'A-02', method: 'POST', path: '/api/admin/login', permission: PERMISSION_NONE, csrf: false, body: LOGIN_BODY, handle: logIn }),
  apiRoute({ id: 'A-03', method: 'POST', path: '/api/admin/logout', permission: PERMISSION_ADMIN, csrf: true, body: null, handle: logOut }),
  apiRoute({ id: 'A-04', method: 'GET', path: '/api/admin/session', permission: PERMISSION_ADMIN, csrf: false, body: null, handle: checkSession }),
  apiRoute({ id: 'A-05', method: 'GET', path: '/api/admin/hours', permission: PERMISSION_ADMIN, csrf: false, body: null, handle: readHours }),
  apiRoute({ id: 'A-06', method: 'PUT', path: '/api/admin/hours', permission: PERMISSION_ADMIN, csrf: true, body: HOURS_BODY, handle: saveHours }),
  apiRoute({ id: 'A-07', method: 'GET', path: '/api/admin/menu', permission: PERMISSION_ADMIN, csrf: false, body: null, handle: readMenu }),
  apiRoute({ id: 'A-08', method: 'POST', path: '/api/admin/menu', permission: PERMISSION_ADMIN, csrf: true, body: MENU_NEW_BODY, handle: addMenuItem }),
  apiRoute({ id: 'A-09', method: 'PUT', path: '/api/admin/menu/{id}', permission: PERMISSION_ADMIN, csrf: true, body: MENU_CHANGE_BODY, handle: changeMenuItem }),
  apiRoute({ id: 'A-10', method: 'DELETE', path: '/api/admin/menu/{id}', permission: PERMISSION_ADMIN, csrf: true, body: null, handle: removeMenuItem }),
  apiRoute({ id: 'A-11', method: 'PUT', path: '/api/admin/menu-order', permission: PERMISSION_ADMIN, csrf: true, body: MENU_ORDER_BODY, handle: saveMenuOrder }),
]);

export const SCREEN_ROUTES = Object.freeze([
  screenRoute({ id: 'S-01', path: '/', file: 'home.html', permission: PERMISSION_NONE, cachePolicy: CACHE_NO_CACHE }),
  screenRoute({ id: 'S-02', path: LOGIN_SCREEN_PATH, file: 'admin-login.html', permission: PERMISSION_NONE, cachePolicy: CACHE_NO_STORE }),
  screenRoute({ id: 'S-03', path: '/admin/hours', file: 'admin-hours.html', permission: PERMISSION_ADMIN, cachePolicy: CACHE_NO_STORE }),
  screenRoute({ id: 'S-04', path: '/admin/menu', file: 'admin-menu.html', permission: PERMISSION_ADMIN, cachePolicy: CACHE_NO_STORE }),
]);

/** The request target up to the question mark, compared as written: no decoding, no trimming. */
export function pathOf(target) {
  const queryStart = target.indexOf('?');
  return queryStart === -1 ? target : target.slice(0, queryStart);
}

/** `{}` or `{ pathId }` when `path` is this row's path, null when it is not. */
function matchApiPath(rowPath, path) {
  if (!rowPath.endsWith(PATH_ID_SLOT)) return rowPath === path ? {} : null;
  const prefix = rowPath.slice(0, -PATH_ID_SLOT.length);
  const pathId = path.slice(prefix.length);
  return path.startsWith(prefix) && pathId !== '' && !pathId.includes('/') ? { pathId } : null;
}

function sameOrigin(request) {
  const { origin, host } = request.headers;
  if (origin === undefined) return true;
  return URL.canParse(origin) && new URL(origin).host === host;
}

function sendMethodNotAllowed(response, allowed) {
  sendError(response, 'method_not_allowed', { Allow: allowed.join(', ') });
}

/**
 * @param {{
 *   staticFiles: ReturnType<typeof import('./static-file.js').loadStaticFiles>,
 *   sessions: { find: (cookieHeader: string | undefined) => object | null,
 *     csrfTokenMatches: (session: object, token: unknown) => boolean },
 *   app: object,
 *   writeError: (line: string) => void,
 *   now: () => Date,
 * }} parts `app` is handed to every handler as its first argument.
 * @returns {(request: import('node:http').IncomingMessage, response: import('node:http').ServerResponse) => Promise<void>}
 */
export function createRouter({ staticFiles, sessions, app, writeError, now }) {
  async function answerApi(route, pathId, request, response) {
    let session = null;
    if (route.permission === PERMISSION_ADMIN) {
      session = sessions.find(request.headers.cookie);
      if (session === null) return sendError(response, 'auth_required');
    }
    if (route.csrf && !(sessions.csrfTokenMatches(session, request.headers['x-csrf-token']) && sameOrigin(request))) {
      return sendError(response, 'csrf_rejected');
    }

    let body = null;
    if (route.body !== null) {
      const read = await readJsonBody(request);
      // The rest of an oversized body is not read, so the connection cannot be used again.
      if (!read.ok) return sendError(response, read.code, read.code === 'body_too_large' ? { Connection: 'close' } : {});
      if (!matchesBodyShape(read.value, route.body)) return sendError(response, 'bad_shape');
      body = read.value;
    }

    const result = await route.handle(app, { body, pathId, session, clientAddress: request.socket.remoteAddress });
    return sendJson(response, result.status, result.body, result.headers);
  }

  function answerScreen(screen, request, response) {
    if (request.method !== READ_METHOD) return sendMethodNotAllowed(response, [READ_METHOD]);
    if (screen.permission === PERMISSION_ADMIN && sessions.find(request.headers.cookie) === null) {
      return writeSecured(response, { status: 302, cachePolicy: CACHE_NO_STORE, headers: { Location: LOGIN_SCREEN_PATH } });
    }
    return staticFiles.sendPage(response, screen.file, screen.cachePolicy);
  }

  async function answer(path, request, response) {
    const onPath = API_ROUTES.map((route) => ({ route, match: matchApiPath(route.path, path) })).filter(({ match }) => match !== null);
    if (onPath.length > 0) {
      const found = onPath.find(({ route }) => route.method === request.method);
      if (found === undefined) return sendMethodNotAllowed(response, onPath.map(({ route }) => route.method));
      return answerApi(found.route, found.match.pathId, request, response);
    }

    const screen = SCREEN_ROUTES.find((row) => row.path === path && staticFiles.hasPage(row.file));
    if (screen !== undefined) return answerScreen(screen, request, response);

    if (staticFiles.hasFile(path)) {
      if (request.method !== READ_METHOD) return sendMethodNotAllowed(response, [READ_METHOD]);
      return staticFiles.sendFile(response, path);
    }

    if (path.startsWith(API_PREFIX)) return sendError(response, 'not_found');
    return staticFiles.sendNotFound(response);
  }

  return async function route(request, response) {
    const path = pathOf(request.url);
    try {
      await answer(path, request, response);
    } catch (error) {
      if (error instanceof ApiFailure && !response.headersSent) {
        sendError(response, error.code, error.headers);
        return;
      }
      // The detail stays on the server. The response carries a catalog code and nothing else.
      writeError(`${now().toISOString()} ${request.method} ${path} ${error instanceof Error ? error.stack : String(error)}`);
      if (response.headersSent) response.destroy();
      else sendError(response, path.startsWith(API_PREFIX) && request.method === READ_METHOD ? 'read_failed' : 'server_error');
    }
  };
}
