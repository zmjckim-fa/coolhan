// S-02 admin login.
//
// Opening: A-04 tells whether a session is alive. If it is, the browser goes on to S-03.
// If it is not, the form appears without any message. A reason handed over in the address
// (after a logout or an expired session) is shown above the form.
// Logging in: A-02. Only a 200 moves on. Every failure stays here and shows its text.
// The password lives in the input and in the one request body, nowhere else.

import { callApi } from './api-client.js';
import { ADMIN_START_PATH, LOGGED_OUT_HASH, readAdminSession } from './admin-top-bar.js';
import { checkPassword } from './input-rules.js';
import {
  clearFieldError,
  hideSavedNotice,
  showErrorBand,
  showFieldError,
  showSavedNotice,
} from './screen-feedback.js';
import { applyText, loadDictionary } from './text-dictionary.js';

const LOGIN_API = '/api/admin/login';
const AUTH_REQUIRED = 'auth_required';
const LOGIN_FAILED = 'login_failed';
/** The reason web/api-client.js puts in the address when a session ran out. */
const EXPIRED_HASH = '#expired';

const loadingLine = document.getElementById('login-loading');
const notice = document.getElementById('login-notice');
const errorBand = document.getElementById('login-error');
const form = document.getElementById('login-form');
const passwordInput = document.getElementById('password');
const passwordError = document.getElementById('password-error');
const submitButton = document.getElementById('login-submit');

/** Only the two agreed words after # show something. Any other text is ignored. */
function showArrivalReason() {
  if (location.hash === LOGGED_OUT_HASH) showSavedNotice(notice, 'notice.loggedout');
  if (location.hash === EXPIRED_HASH) showErrorBand(errorBand, 'error.session.expired');
}

/** @param {SubmitEvent} event */
async function logIn(event) {
  event.preventDefault();
  if (submitButton.disabled) return;

  hideSavedNotice(notice);
  clearFieldError(passwordInput, errorBand);
  clearFieldError(passwordInput, passwordError);

  const password = passwordInput.value;
  const checked = checkPassword(password);
  if (!checked.ok) {
    showFieldError(passwordInput, passwordError, checked.text_key);
    passwordInput.focus();
    return;
  }

  submitButton.disabled = true;
  const result = await callApi('POST', LOGIN_API, { password });
  if (result.ok) {
    location.replace(ADMIN_START_PATH);
    return;
  }

  submitButton.disabled = false;
  if (result.code === LOGIN_FAILED) {
    passwordInput.value = '';
    showFieldError(passwordInput, errorBand, result.text_key);
  } else {
    showErrorBand(errorBand, result.text_key);
  }
  passwordInput.focus();
}

async function openScreen() {
  await loadDictionary();
  applyText();

  const session = await readAdminSession();
  if (session.ok) {
    location.replace(ADMIN_START_PATH);
    return;
  }

  loadingLine.hidden = true;
  form.hidden = false;
  showArrivalReason();
  if (session.code !== AUTH_REQUIRED) showErrorBand(errorBand, session.text_key);
  passwordInput.focus();
}

form.addEventListener('submit', logIn);
openScreen();
