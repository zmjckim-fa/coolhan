// Shop status rule. The status is never stored: it is derived from the seven business_hour rows,
// the instant of the request and the shop time zone. Only A-01 calls this; screens do not compute it.

/** @typedef {import('../web/input-rules.js').BusinessHour} BusinessHour */
/** @typedef {import('../web/input-rules.js').ShopStatus} ShopStatus */

/** Dictionary key of each status code. */
export const SHOP_STATUS_TEXT_KEYS = Object.freeze({
  open: 'status.open',
  closed: 'status.closed',
  dayoff: 'status.dayoff',
  unset: 'status.unset',
});

const LOCAL_PARTS = Object.freeze({
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

/**
 * The weekday (0 Sunday to 6 Saturday) and 'HH:MM' of an instant in the shop time zone.
 * An unknown time zone name throws RangeError.
 * @param {Date} instant
 * @param {string} timeZone
 * @returns {{ weekday: number, local_time: string }}
 */
export function toShopLocalTime(instant, timeZone) {
  const parts = {};
  for (const { type, value } of new Intl.DateTimeFormat('en-US', { ...LOCAL_PARTS, timeZone }).formatToParts(instant)) {
    parts[type] = value;
  }
  const localDate = new Date(Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day)));
  return { weekday: localDate.getUTCDay(), local_time: `${parts.hour}:${parts.minute}` };
}

/**
 * Rule order: day off, no opening time, inside [opens_at, closes_at), otherwise closed.
 * Times compare as 'HH:MM' strings. A weekday without a row has no hours to show, so it is unset.
 * @param {readonly BusinessHour[]} businessHours
 * @param {Date} instant
 * @param {string} timeZone
 * @returns {ShopStatus}
 */
export function deriveShopStatus(businessHours, instant, timeZone) {
  const { weekday, local_time } = toShopLocalTime(instant, timeZone);
  const today = businessHours.find((row) => row.weekday === weekday);
  let code = 'closed';
  if (today === undefined) code = 'unset';
  else if (today.is_day_off === 1) code = 'dayoff';
  else if (today.opens_at === null) code = 'unset';
  else if (local_time >= today.opens_at && local_time < today.closes_at) code = 'open';
  return { code, text_key: SHOP_STATUS_TEXT_KEYS[code], weekday, local_time };
}
