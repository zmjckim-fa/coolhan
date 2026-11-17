// JSON in and out: reading a request body (media type, size limit, syntax), comparing it with the
// body shape of a route table row, and writing JSON responses and error responses.
// bad_shape is produced here and nowhere else. Value ranges and formats belong to web/input-rules.js.

import { errorResponse } from './error-catalog.js';
import { CACHE_NO_STORE, writeSecured } from './security-headers.js';

export const BODY_LIMIT_BYTES = 16384;

const JSON_MEDIA_TYPE = 'application/json';
const JSON_CONTENT_TYPE = 'application/json; charset=utf-8';

/** Field kinds a body shape can name. A shape is `{ fieldName: { type, ... } }`. */
export const FIELD_STRING = 'string';
export const FIELD_STRING_OR_NULL = 'string_or_null';
export const FIELD_INTEGER = 'integer';
export const FIELD_ZERO_OR_ONE = 'zero_or_one';
export const FIELD_ARRAY = 'array';
/** Any JSON value passes the shape check: the input rule owns the type as well as the range. */
export const FIELD_UNTYPED = 'untyped';

/**
 * A refusal a handler chooses. The code must be in the error catalog.
 * `headers` are added to the error response (Retry-After, Set-Cookie).
 */
export class ApiFailure extends Error {
  /**
   * @param {string} code
   * @param {Record<string, string>} [headers]
   */
  constructor(code, headers = {}) {
    super(code);
    this.name = 'ApiFailure';
    this.code = code;
    this.headers = headers;
  }
}

function isJsonObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function mediaTypeOf(request) {
  const header = request.headers['content-type'];
  return typeof header === 'string' ? header.split(';')[0].trim().toLowerCase() : '';
}

/** Collects the body, or stops storing it at the first byte past the limit. */
function collectBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    const stopListening = () => {
      request.off('data', onData);
      request.off('end', onEnd);
      request.off('error', onError);
    };
    const onData = (chunk) => {
      size += chunk.length;
      if (size <= BODY_LIMIT_BYTES) {
        chunks.push(chunk);
        return;
      }
      stopListening();
      resolve(null);
    };
    const onEnd = () => {
      stopListening();
      resolve(Buffer.concat(chunks));
    };
    const onError = (error) => {
      stopListening();
      reject(error);
    };
    request.on('data', onData);
    request.on('end', onEnd);
    request.on('error', onError);
  });
}

/**
 * Reads a JSON object body. Order of refusal: media type, size, syntax.
 * After body_too_large nothing more is stored; the rest of the stream is discarded unread.
 * @param {import('node:http').IncomingMessage} request
 * @returns {Promise<{ ok: true, value: Record<string, unknown> } | { ok: false, code: string }>}
 */
export async function readJsonBody(request) {
  if (mediaTypeOf(request) !== JSON_MEDIA_TYPE) return { ok: false, code: 'unsupported_media_type' };

  const declaredLength = Number(request.headers['content-length']);
  const bytes = declaredLength > BODY_LIMIT_BYTES ? null : await collectBody(request);
  if (bytes === null) {
    request.resume();
    return { ok: false, code: 'body_too_large' };
  }

  let value;
  try {
    value = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  } catch (error) {
    if (error instanceof SyntaxError || error instanceof TypeError) return { ok: false, code: 'bad_json' };
    throw error;
  }
  return isJsonObject(value) ? { ok: true, value } : { ok: false, code: 'bad_json' };
}

function matchesItems(items, spec) {
  if (spec.maxItems !== undefined && items.length > spec.maxItems) return false;
  if (spec.distinct === true && new Set(items).size !== items.length) return false;
  return items.every((item) => (spec.items === FIELD_INTEGER ? Number.isInteger(item) : matchesBodyShape(item, spec.items)));
}

function matchesField(value, spec) {
  if (spec.type === FIELD_UNTYPED) return true;
  if (value === undefined) return spec.ownCode === true;
  if (value === null) return spec.ownCode === true || spec.type === FIELD_STRING_OR_NULL;
  switch (spec.type) {
    case FIELD_STRING:
    case FIELD_STRING_OR_NULL:
      return typeof value === 'string';
    case FIELD_INTEGER:
      return Number.isInteger(value);
    case FIELD_ZERO_OR_ONE:
      return value === 0 || value === 1;
    case FIELD_ARRAY:
      return Array.isArray(value) && matchesItems(value, spec);
    default:
      throw new Error(`unknown field kind in a body shape: ${spec.type}`);
  }
}

/**
 * True when `body` has only the fields of `shape`, each of the JSON type the shape names.
 * A missing or null field passes only when the field has its own error code (`ownCode`),
 * which the input rule then reports; null is also a value of a string_or_null field.
 * An array field names its items (FIELD_INTEGER or a nested shape) and may cap and deduplicate them.
 * @param {unknown} body
 * @param {Record<string, { type: string, ownCode?: boolean, items?: unknown, maxItems?: number, distinct?: boolean }>} shape
 * @returns {boolean}
 */
export function matchesBodyShape(body, shape) {
  if (!isJsonObject(body)) return false;
  if (Object.keys(body).some((name) => !Object.hasOwn(shape, name))) return false;
  return Object.entries(shape).every(([name, spec]) => matchesField(Object.hasOwn(body, name) ? body[name] : undefined, spec));
}

/**
 * @param {import('node:http').ServerResponse} response
 * @param {number} status
 * @param {unknown} [body] left out for a response without a body (204)
 * @param {Record<string, string>} [headers]
 */
export function sendJson(response, status, body, headers = {}) {
  if (body === undefined) {
    writeSecured(response, { status, cachePolicy: CACHE_NO_STORE, headers });
    return;
  }
  writeSecured(response, {
    status,
    cachePolicy: CACHE_NO_STORE,
    headers: { ...headers, 'Content-Type': JSON_CONTENT_TYPE },
    body: JSON.stringify(body),
  });
}

/**
 * The only way an error leaves the server: the code and key of the catalog, nothing from the request.
 * @param {import('node:http').ServerResponse} response
 * @param {string} code
 * @param {Record<string, string>} [headers]
 */
export function sendError(response, code, headers = {}) {
  const { status, body } = errorResponse(code);
  sendJson(response, status, body, headers);
}
