// Input rules shared by the server and the screens.
// The browser loads this file as /input-rules.js and the server loads the same file from disk,
// so it depends on nothing else and every function is pure.

/**
 * One T-01 row as it travels in requests and responses. The updated_at column is not carried.
 * @typedef {object} BusinessHour
 * @property {0|1|2|3|4|5|6} weekday      0 Sunday to 6 Saturday
 * @property {string|null} opens_at       'HH:MM' on the time step, or null
 * @property {string|null} closes_at      'HH:MM' on the time step, or null. Later than opens_at
 * @property {0|1} is_day_off             1 marks a day off
 */

/**
 * One T-02 row as it travels in responses. The created_at and updated_at columns are not carried.
 * @typedef {object} MenuItem
 * @property {number} id
 * @property {string} name                NFC, trimmed, 1 to 40 code points
 * @property {number} price_krw           integer from 0 to 1000000, never a string
 * @property {'bread'|'cake'|'cookie'|'drink'} category
 * @property {'on_sale'|'sold_out'} sale_status
 * @property {number} sort_order          position inside the category, from 0
 */

/**
 * Never stored. Derived on every request.
 * @typedef {object} ShopStatus
 * @property {'open'|'closed'|'dayoff'|'unset'} code
 * @property {string} text_key            dictionary key of that status
 * @property {0|1|2|3|4|5|6} weekday      today in the shop time zone
 * @property {string} local_time          the instant used, 'HH:MM' in the shop time zone
 */

/**
 * One element of the category list.
 * @typedef {object} CodeText
 * @property {string} code
 * @property {string} text_key
 */

/**
 * The A-01 response.
 * @typedef {object} Overview
 * @property {string} shop_name
 * @property {ShopStatus} shop_status
 * @property {CodeText[]} category_list
 * @property {BusinessHour[]} business_hour
 * @property {MenuItem[]} menu_item
 */

/**
 * The body of every error response.
 * @typedef {object} ApiError
 * @property {{ code: string, text_key: string }} error
 */

/**
 * The result of an input rule. Screens find the wrong control by weekday and field.
 * @typedef {{ ok: false, code: string, text_key: string, weekday?: number, field?: string }} RuleFailure
 * @typedef {{ ok: true } | RuleFailure} RuleResult
 */

/**
 * The result of a rule that also hands back the value to store or send.
 * @template T
 * @typedef {{ ok: true, value: T } | RuleFailure} RuleValue
 */

/**
 * Shapes of the admin responses.
 * @typedef {{ csrf_token: string }} SessionInfo
 * @typedef {{ business_hour: BusinessHour[] }} HoursPayload
 * @typedef {{ menu_item: MenuItem[] }} MenuPayload
 * @typedef {MenuPayload & { category_list: CodeText[] }} MenuScreenPayload
 */

export const TIME_STEP_MINUTES = 5;
export const WEEKDAY_COUNT = 7;
export const MENU_NAME_MAX_LENGTH = 40;
export const PRICE_KRW_MIN = 0;
export const PRICE_KRW_MAX = 1000000;
export const SALE_STATUS_CODES = Object.freeze(['on_sale', 'sold_out']);

const INPUT_ERROR_STATUS = 400;

/** Every code an input rule can return, with its HTTP status and dictionary key. */
export const INPUT_ERRORS = Object.freeze(Object.fromEntries(Object.entries({
  password_required: 'error.password.required',
  hours_week_incomplete: 'error.server',
  hours_day_off_has_time: 'error.server',
  hours_time_format: 'error.hours.format',
  hours_opens_required: 'error.hours.opens.required',
  hours_closes_required: 'error.hours.closes.required',
  hours_close_not_after_open: 'error.hours.order',
  menu_name_required: 'error.menu.name.required',
  menu_name_invalid: 'error.menu.name.length',
  menu_name_too_long: 'error.menu.name.length',
  menu_price_required: 'error.menu.price.required',
  menu_price_range: 'error.menu.price.range',
  menu_category_invalid: 'error.menu.category.required',
  menu_sale_status_unknown: 'error.server',
}).map(([code, text_key]) => [code, Object.freeze({ status: INPUT_ERROR_STATUS, text_key })])));

const PASS = Object.freeze({ ok: true });
const TIME_PATTERN = /^(?:[01][0-9]|2[0-3]):([0-5][0-9])$/;
const CONTROL_CHARACTER = /[\u0000-\u001F\u007F]/;
const DIGITS_ONLY = /^[0-9]+$/;

/**
 * @param {string} code
 * @param {{ weekday?: number, field?: string }} [where]
 * @returns {RuleFailure}
 */
function fail(code, where) {
  return { ok: false, code, text_key: INPUT_ERRORS[code].text_key, ...where };
}

/**
 * A-02 password: present and at least one character. Nothing is trimmed.
 * @param {unknown} value
 * @returns {RuleResult}
 */
export function checkPassword(value) {
  return typeof value === 'string' && value.length > 0 ? PASS : fail('password_required', { field: 'password' });
}

/**
 * One time of day: 24-hour 'HH:MM', 00:00 to 23:55, minutes on the time step.
 * @param {unknown} value
 * @returns {RuleResult}
 */
export function checkTime(value) {
  const match = typeof value === 'string' ? TIME_PATTERN.exec(value) : null;
  return match !== null && Number(match[1]) % TIME_STEP_MINUTES === 0 ? PASS : fail('hours_time_format');
}

/**
 * One weekday row. A failure carries the weekday and the field of the wrong control.
 * @param {BusinessHour} row
 * @returns {RuleResult}
 */
export function checkBusinessHourRow(row) {
  if (row === null || typeof row !== 'object') return fail('hours_week_incomplete');
  const { weekday, is_day_off } = row;
  if (!Number.isInteger(weekday) || weekday < 0 || weekday >= WEEKDAY_COUNT) return fail('hours_week_incomplete');
  if (is_day_off !== 0 && is_day_off !== 1) return fail('hours_week_incomplete', { weekday, field: 'is_day_off' });
  const opens = row.opens_at ?? null;
  const closes = row.closes_at ?? null;
  if (is_day_off === 1) {
    if (opens !== null) return fail('hours_day_off_has_time', { weekday, field: 'opens_at' });
    if (closes !== null) return fail('hours_day_off_has_time', { weekday, field: 'closes_at' });
    return PASS;
  }
  if (opens !== null && !checkTime(opens).ok) return fail('hours_time_format', { weekday, field: 'opens_at' });
  if (closes !== null && !checkTime(closes).ok) return fail('hours_time_format', { weekday, field: 'closes_at' });
  if (opens === null && closes === null) return PASS;
  if (opens === null) return fail('hours_opens_required', { weekday, field: 'opens_at' });
  if (closes === null) return fail('hours_closes_required', { weekday, field: 'closes_at' });
  if (closes <= opens) return fail('hours_close_not_after_open', { weekday, field: 'closes_at' });
  return PASS;
}

/**
 * A whole week: every weekday exactly once, then each row in the order given.
 * Returns the first failure.
 * @param {BusinessHour[]} rows
 * @returns {RuleResult}
 */
export function checkBusinessWeek(rows) {
  if (!Array.isArray(rows) || rows.length !== WEEKDAY_COUNT) return fail('hours_week_incomplete');
  const seen = new Set();
  for (const row of rows) {
    const weekday = row === null || typeof row !== 'object' ? undefined : row.weekday;
    if (!Number.isInteger(weekday) || weekday < 0 || weekday >= WEEKDAY_COUNT || seen.has(weekday)) {
      return fail('hours_week_incomplete');
    }
    seen.add(weekday);
  }
  for (const row of rows) {
    const result = checkBusinessHourRow(row);
    if (!result.ok) return result;
  }
  return PASS;
}

/**
 * Menu name. The value handed back (NFC, trimmed) is the one to store and to draw.
 * @param {unknown} value
 * @returns {RuleValue<string>}
 */
export function checkMenuName(value) {
  const where = { field: 'name' };
  if (value === undefined || value === null) return fail('menu_name_required', where);
  if (typeof value !== 'string') return fail('menu_name_invalid', where);
  const name = value.normalize('NFC').trim();
  if (name.length === 0) return fail('menu_name_required', where);
  if (CONTROL_CHARACTER.test(name)) return fail('menu_name_invalid', where);
  if ([...name].length > MENU_NAME_MAX_LENGTH) return fail('menu_name_too_long', where);
  return { ok: true, value: name };
}

/**
 * Price as it travels in JSON: an integer inside the range. Nothing is converted here.
 * @param {unknown} value
 * @returns {RuleResult}
 */
export function checkPriceKrw(value) {
  const where = { field: 'price_krw' };
  if (value === undefined || value === null) return fail('menu_price_required', where);
  if (!Number.isInteger(value) || value < PRICE_KRW_MIN || value > PRICE_KRW_MAX) return fail('menu_price_range', where);
  return PASS;
}

/**
 * The text of the price control turned into the integer to send. Screens are the only caller.
 * @param {unknown} text
 * @returns {RuleValue<number>}
 */
export function parsePriceText(text) {
  const where = { field: 'price_krw' };
  if (text === undefined || text === null || text === '') return fail('menu_price_required', where);
  if (typeof text !== 'string' || !DIGITS_ONLY.test(text)) return fail('menu_price_range', where);
  const value = Number(text);
  const result = checkPriceKrw(value);
  return result.ok ? { ok: true, value } : result;
}

/**
 * Category: one of the codes the server sends down in category_list.
 * @param {unknown} value
 * @param {readonly string[]} categoryCodes
 * @returns {RuleResult}
 */
export function checkCategory(value, categoryCodes) {
  const known = typeof value === 'string' && Array.isArray(categoryCodes) && categoryCodes.includes(value);
  return known ? PASS : fail('menu_category_invalid', { field: 'category' });
}

/**
 * Sale status: one of the two codes.
 * @param {unknown} value
 * @returns {RuleResult}
 */
export function checkSaleStatus(value) {
  return SALE_STATUS_CODES.includes(value) ? PASS : fail('menu_sale_status_unknown', { field: 'sale_status' });
}
