// Top bar (C-12) of the admin screens: the session check (A-04), the links between the admin
// screens and logout (A-03).
//
// S-03 and S-04 put one empty element in their HTML, right after the skip link:
//   <header data-admin-top-bar></header>
// and call startAdminTopBar once when the screen opens. This file fills that element, so the
// bar is written in one place and both screens show the same links in the same order.
//
// S-02 has its own one-link bar in its HTML. It only uses readAdminSession and the two addresses.

import { callApi, setCsrfToken } from './api-client.js';
import { applyText, loadDictionary } from './text-dictionary.js';

/** @typedef {import('./api-client.js').ApiResult} ApiResult */

const SESSION_API = '/api/admin/session';
const LOGOUT_API = '/api/admin/logout';
const AUTH_REQUIRED = 'auth_required';

const HOME_PATH = '/';
const LOGIN_PATH = '/admin/login';
const MENU_PATH = '/admin/menu';

/** Where an admin lands after logging in: S-03. */
export const ADMIN_START_PATH = '/admin/hours';

/** The reason S-02 reads from its address after a logout. */
export const LOGGED_OUT_HASH = '#loggedout';

const TOP_BAR_SELECTOR = 'header[data-admin-top-bar]';
const TABS = Object.freeze([
  Object.freeze({ path: ADMIN_START_PATH, textKey: 'title.hours' }),
  Object.freeze({ path: MENU_PATH, textKey: 'title.menu' }),
]);

/**
 * A-04. On success the CSRF token goes to the shared API client, which keeps it in memory only.
 * On auth_required the client itself moves an admin screen to the login screen.
 * @returns {Promise<ApiResult>} data is { csrf_token } when ok
 */
export async function readAdminSession() {
  const result = await callApi('GET', SESSION_API);
  if (result.ok) setCsrfToken(result.data.csrf_token);
  return result;
}

/**
 * @param {string} tag
 * @param {Record<string, string>} attributes
 * @returns {HTMLElement}
 */
function element(tag, attributes) {
  const node = document.createElement(tag);
  for (const [name, value] of Object.entries(attributes)) node.setAttribute(name, value);
  return node;
}

/**
 * A-03. The button stays disabled while the request is on its way and after it succeeded.
 * @param {HTMLButtonElement} button
 * @param {(textKey: string) => void} onLogoutError
 */
async function logOut(button, onLogoutError) {
  button.disabled = true;
  const result = await callApi('POST', LOGOUT_API);
  if (result.ok) {
    location.assign(`${LOGIN_PATH}${LOGGED_OUT_HASH}`);
    return;
  }
  // The session was already gone: the API client is moving to the login screen.
  if (result.code === AUTH_REQUIRED) return;
  button.disabled = false;
  onLogoutError(result.text_key);
}

/**
 * The strip (link to the visitor screen, logout button) and the tab strip below it.
 * The tab of the screen that is open carries aria-current="page".
 * @param {HTMLElement} header
 * @param {(textKey: string) => void} onLogoutError
 */
function fillTopBar(header, onLogoutError) {
  const strip = element('div', { class: 'top-bar-strip' });
  const homeLink = element('a', { class: 'top-bar-link', href: HOME_PATH, 'data-text': 'nav.home' });
  const logoutButton = element('button', { class: 'top-bar-logout', type: 'button', 'data-text': 'button.logout' });
  logoutButton.addEventListener('click', () => logOut(logoutButton, onLogoutError));
  strip.append(homeLink, logoutButton);

  const tabStrip = element('nav', { class: 'tab-strip', 'data-text-aria': 'nav.admin' });
  for (const { path, textKey } of TABS) {
    const tab = element('a', { class: 'tab', href: path, 'data-text': textKey });
    if (path === location.pathname) tab.setAttribute('aria-current', 'page');
    tabStrip.append(tab);
  }

  header.classList.add('top-bar', 'top-bar--admin');
  header.replaceChildren(strip, tabStrip);
  applyText(header);
}

/**
 * Draws the top bar and checks the session. Call it once, when S-03 or S-04 opens.
 *
 * The bar is drawn first, so it is there while the screen still loads. The answer of A-04 is
 * handed back: when it is ok the CSRF token is already with the API client and the screen can
 * read and write; when it is not ok the screen shows result.text_key as a load failure (on
 * auth_required the browser is already leaving for the login screen).
 *
 * @param {{ onLogoutError: (textKey: string) => void }} options onLogoutError is called with a
 *   dictionary key when logout fails for a reason other than a missing session; the screen
 *   shows it in its error band
 * @returns {Promise<ApiResult>}
 */
export async function startAdminTopBar({ onLogoutError }) {
  if (typeof onLogoutError !== 'function') throw new TypeError('startAdminTopBar needs an onLogoutError function');
  const header = document.querySelector(TOP_BAR_SELECTOR);
  if (header === null) throw new Error(`the page has no ${TOP_BAR_SELECTOR} element`);
  await loadDictionary();
  fillTopBar(header, onLogoutError);
  return readAdminSession();
}
