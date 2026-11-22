// S-03 business hours for the admin: the seven weekdays, edited together and saved in one request.
//
// Opening: the top bar checks the session (A-04), then A-05 fills the seven rows.
// Saving: the shared input rules check the week first. A week that passes goes to A-06 whole,
// and the rows are then filled again from the week the server sends back, never from what was typed.
// A failed check or a failed save leaves every typed value where it is.
// A day off carries no times: its two inputs are empty and disabled and the request sends null.

import { readAdminSession, startAdminTopBar } from './admin-top-bar.js';
import { callApi } from './api-client.js';
import { checkBusinessHourRow, checkBusinessWeek } from './input-rules.js';
import {
  bindTooltips,
  clearFieldError,
  hideErrorBand,
  hideSavedNotice,
  showErrorBand,
  showFieldError,
  showSavedNotice,
} from './screen-feedback.js';
import { applyText, loadDictionary, text } from './text-dictionary.js';

/** @typedef {import('./api-client.js').ApiResult} ApiResult */
/** @typedef {import('./input-rules.js').BusinessHour} BusinessHour */
/** @typedef {import('./input-rules.js').RuleResult} RuleResult */
/** @typedef {'opens_at' | 'closes_at'} TimeField */

/**
 * One weekday row of the form.
 * @typedef {object} HoursRow
 * @property {BusinessHour['weekday']} weekday
 * @property {HTMLInputElement} dayOff
 * @property {Record<TimeField, HTMLInputElement>} times
 * @property {Record<TimeField, string>} kept the times typed before the day was marked off
 * @property {HTMLElement} errorLine
 */

const HOURS_API = '/api/admin/hours';
const AUTH_REQUIRED = 'auth_required';
const DAY_OFF = 1;
const OPEN_DAY = 0;

const title = document.getElementById('screen-title');
const notice = document.getElementById('hours-notice');
const errorBand = document.getElementById('hours-error');
const retryButton = document.getElementById('hours-retry');
const loadingLine = document.getElementById('hours-loading');
const form = document.getElementById('hours-form');
const saveButton = document.getElementById('hours-save');

/** @type {HoursRow[]} in display order, Monday to Sunday */
const rows = [...form.querySelectorAll('tr[data-weekday]')].map((element) => {
  const control = (field) => element.querySelector(`[data-hours-field="${field}"]`);
  return {
    weekday: Number(element.dataset.weekday),
    dayOff: control('is_day_off'),
    times: { opens_at: control('opens_at'), closes_at: control('closes_at') },
    kept: { opens_at: '', closes_at: '' },
    errorLine: element.querySelector('[data-hours-error]'),
  };
});

/** A-04 is asked until it has answered once. After that only A-05 is read again. */
let sessionIsRead = false;

/**
 * The value of a time input as it goes to the rules: null when empty, otherwise the text.
 * A half-typed time has no value either. It goes on as empty text, so the rule names its format.
 * @param {HTMLInputElement} input
 * @returns {string | null}
 */
function timeOf(input) {
  return input.value === '' && !input.validity.badInput ? null : input.value;
}

/**
 * @param {HoursRow} row
 * @returns {BusinessHour}
 */
function readRow(row) {
  const isDayOff = row.dayOff.checked;
  return {
    weekday: row.weekday,
    opens_at: isDayOff ? null : timeOf(row.times.opens_at),
    closes_at: isDayOff ? null : timeOf(row.times.closes_at),
    is_day_off: isDayOff ? DAY_OFF : OPEN_DAY,
  };
}

/** @param {HoursRow} row */
function clearRowError(row) {
  for (const input of Object.values(row.times)) clearFieldError(input, row.errorLine);
}

/**
 * Shows a failed rule under its row and marks the wrong input.
 * @param {HoursRow} row
 * @param {RuleResult} result
 * @returns {HTMLInputElement | null} the wrong input, or null when the result names none
 */
function showRowFailure(row, result) {
  if (result.ok || !Object.hasOwn(row.times, result.field)) return null;
  const input = row.times[result.field];
  showFieldError(input, row.errorLine, result.text_key);
  return input;
}

/**
 * An error line stays until its row is right again. While it shows, every edit asks the rule anew.
 * @param {HoursRow} row
 */
function recheckRow(row) {
  if (row.errorLine.hidden) return;
  clearRowError(row);
  showRowFailure(row, checkBusinessHourRow(readRow(row)));
}

/**
 * Marking a day off empties and disables its two times. Unmarking it before saving brings back
 * what was typed.
 * @param {HoursRow} row
 */
function switchDayOff(row) {
  const isDayOff = row.dayOff.checked;
  clearRowError(row);
  for (const [field, input] of Object.entries(row.times)) {
    if (isDayOff) row.kept[field] = input.value;
    input.value = isDayOff ? '' : row.kept[field];
    input.disabled = isDayOff;
  }
}

/**
 * Fills the seven rows from a week the server sent.
 * @param {BusinessHour[]} week
 */
function drawWeek(week) {
  const hourOf = new Map(week.map((hour) => [hour.weekday, hour]));
  for (const row of rows) {
    const hour = hourOf.get(row.weekday);
    const isDayOff = hour.is_day_off === DAY_OFF;
    clearRowError(row);
    row.dayOff.checked = isDayOff;
    for (const [field, input] of Object.entries(row.times)) {
      input.value = hour[field] ?? '';
      input.disabled = isDayOff;
      row.kept[field] = '';
    }
  }
}

/**
 * @param {() => Promise<ApiResult>} readSession
 * @returns {Promise<ApiResult>} the answer of A-05, or of A-04 when the session could not be read
 */
async function readWeek(readSession) {
  if (!sessionIsRead) {
    const session = await readSession();
    if (!session.ok) return session;
    sessionIsRead = true;
  }
  return callApi('GET', HOURS_API);
}

/**
 * Reads the week and shows the form. While the request is on its way only the loading line
 * shows. After a failure the band with the retry button stands in place of the form.
 * @param {() => Promise<ApiResult>} readSession
 * @returns {Promise<boolean>} whether the form is on screen
 */
async function showWeek(readSession) {
  retryButton.disabled = true;
  hideErrorBand(errorBand);
  hideSavedNotice(notice);
  form.hidden = true;
  loadingLine.hidden = false;

  const result = await readWeek(readSession);
  // The session is gone: the API client is moving to the login screen.
  if (!result.ok && result.code === AUTH_REQUIRED) return false;

  loadingLine.hidden = true;
  retryButton.disabled = false;
  retryButton.hidden = result.ok;
  if (!result.ok) {
    showErrorBand(errorBand, result.text_key);
    return false;
  }
  drawWeek(result.data.business_hour);
  form.hidden = false;
  return true;
}

/** @param {boolean} isSaving */
function setSaving(isSaving) {
  saveButton.disabled = isSaving;
  saveButton.textContent = text(isSaving ? 'notice.saving' : 'button.save');
}

/**
 * Shows every row the rules reject and puts focus on the first wrong input.
 * A failure that belongs to no row shows in the band above the form.
 * @param {BusinessHour[]} week
 * @param {RuleResult} weekResult the failed result for the whole week
 */
function showRejectedWeek(week, weekResult) {
  const wrongInputs = rows
    .map((row, index) => showRowFailure(row, checkBusinessHourRow(week[index])))
    .filter((input) => input !== null);
  if (wrongInputs.length === 0) showErrorBand(errorBand, weekResult.text_key);
  else wrongInputs[0].focus();
}

/** @param {SubmitEvent} event */
async function saveWeek(event) {
  event.preventDefault();
  if (saveButton.disabled) return;

  hideSavedNotice(notice);
  hideErrorBand(errorBand);
  for (const row of rows) clearRowError(row);

  const week = rows.map(readRow);
  const checked = checkBusinessWeek(week);
  if (!checked.ok) {
    showRejectedWeek(week, checked);
    return;
  }

  // A disabled button loses focus. It gets it back with the answer, so focus stays where it was.
  const saveHadFocus = document.activeElement === saveButton;
  setSaving(true);
  const result = await callApi('PUT', HOURS_API, { business_hour: week });
  if (!result.ok && result.code === AUTH_REQUIRED) return;

  setSaving(false);
  if (saveHadFocus) saveButton.focus();
  if (!result.ok) {
    showErrorBand(errorBand, result.text_key);
    return;
  }
  drawWeek(result.data.business_hour);
  showSavedNotice(notice, 'notice.saved');
}

for (const row of rows) {
  row.dayOff.addEventListener('change', () => switchDayOff(row));
  for (const input of Object.values(row.times)) input.addEventListener('input', () => recheckRow(row));
}

// The saved notice stays until the next edit.
form.addEventListener('input', () => hideSavedNotice(notice));
form.addEventListener('submit', saveWeek);

// The retry button disappears with its band while the request runs, so focus is placed again
// when the answer is there: on the title, or back on the button when it failed again.
retryButton.addEventListener('click', async () => {
  const shown = await showWeek(readAdminSession);
  (shown ? title : retryButton).focus();
});

await loadDictionary();
applyText();
bindTooltips();
await showWeek(() => startAdminTopBar({ onLogoutError: (textKey) => showErrorBand(errorBand, textKey) }));
