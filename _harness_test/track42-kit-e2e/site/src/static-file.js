// Static files and screen pages. The web folder is read once at start into an allow list
// (address -> content). A request path is only ever compared with the keys of that list:
// no file path is built from request text, so nothing outside the web folder can be reached.

import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { sendError } from './json-exchange.js';
import { CACHE_NO_CACHE, CACHE_NO_STORE, writeSecured } from './security-headers.js';

const CONTENT_TYPES = Object.freeze({
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
});
const PAGE_EXTENSION = '.html';
const PAGE_CONTENT_TYPE = 'text/html; charset=utf-8';
/** The module type marker of the web folder. It is not a file a screen fetches. */
const NEVER_SERVED_NAME = 'package.json';
const DICTIONARY_ADDRESS = '/text/ko.json';
const NOT_FOUND_PAGE = 'not-found.html';

const HEAD_TEXT_ELEMENT = /<title>[\s\S]*?<\/title>|<meta\b[^>]*>/gi;
const TEXT_SLOT = /\{\{text:([a-z0-9.]+)\}\}/g;
const SHOP_SLOT = '{shop}';
const CHARACTER_REFERENCES = Object.freeze({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' });

function escapeHtml(text) {
  return text.replace(/[&<>"']/g, (character) => CHARACTER_REFERENCES[character]);
}

/** Every regular file under `folder` as [relative path with forward slashes, absolute path]. */
function listFiles(folder, prefix = '') {
  const found = [];
  for (const entry of readdirSync(folder, { withFileTypes: true })) {
    const relative = `${prefix}${entry.name}`;
    const absolute = path.join(folder, entry.name);
    if (entry.isDirectory()) found.push(...listFiles(absolute, `${relative}/`));
    else if (entry.isFile()) found.push([relative, absolute]);
  }
  return found;
}

/** Replaces the text slots inside title and meta with dictionary text, shop name filled in, escaped. */
function fillHeadText(source, dictionary, shopName) {
  return source.replace(HEAD_TEXT_ELEMENT, (element) => element.replace(TEXT_SLOT, (slot, key) => {
    if (typeof dictionary[key] !== 'string') throw new Error(`dictionary key used in a page head is missing: ${key}`);
    return escapeHtml(dictionary[key].replaceAll(SHOP_SLOT, () => shopName));
  }));
}

/**
 * Reads the web folder once.
 * - `.css`, `.js`, `.json` files are served at their path under the folder, except package.json.
 * - `.html` files have no address of their own: a screen route or the not-found answer sends them.
 * @param {{ webRoot: string, shopName: string }} options
 */
export function loadStaticFiles({ webRoot, shopName }) {
  const files = new Map();
  const pageSources = new Map();
  for (const [relative, absolute] of listFiles(webRoot)) {
    const extension = path.extname(relative);
    if (path.basename(relative) === NEVER_SERVED_NAME) continue;
    if (extension === PAGE_EXTENSION) pageSources.set(relative, readFileSync(absolute, 'utf8'));
    else if (Object.hasOwn(CONTENT_TYPES, extension)) {
      files.set(`/${relative}`, { body: readFileSync(absolute), contentType: CONTENT_TYPES[extension] });
    }
  }

  const dictionary = files.has(DICTIONARY_ADDRESS) ? JSON.parse(files.get(DICTIONARY_ADDRESS).body.toString('utf8')) : {};
  const pages = new Map();
  for (const [name, source] of pageSources) pages.set(name, Buffer.from(fillHeadText(source, dictionary, shopName)));

  const sendPageBody = (response, name, status, cachePolicy) => {
    writeSecured(response, { status, cachePolicy, headers: { 'Content-Type': PAGE_CONTENT_TYPE }, body: pages.get(name) });
  };

  return Object.freeze({
    /** @param {string} address a request path */
    hasFile: (address) => files.has(address),
    /** @param {string} name a page file name of a screen route */
    hasPage: (name) => pages.has(name),
    sendFile(response, address) {
      const { body, contentType } = files.get(address);
      writeSecured(response, { status: 200, cachePolicy: CACHE_NO_CACHE, headers: { 'Content-Type': contentType }, body });
    },
    sendPage(response, name, cachePolicy) {
      sendPageBody(response, name, 200, cachePolicy);
    },
    /** The answer to an address that is not an API path and does not exist. */
    sendNotFound(response) {
      if (pages.has(NOT_FOUND_PAGE)) sendPageBody(response, NOT_FOUND_PAGE, 404, CACHE_NO_STORE);
      else sendError(response, 'not_found');
    },
  });
}
