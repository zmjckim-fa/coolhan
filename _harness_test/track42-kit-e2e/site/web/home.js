// S-01 visitor home: whether the shop is open now, the hours of the week and the menu.
//
// One request (A-01) carries everything. The status code, its text key, today's weekday and the
// local time it was computed for come from the server: this screen computes no status and does
// not read again on its own while it stays open.
// Names from the data (shop name, menu names) are written as text content, never as markup.

import { callApi } from './api-client.js';
import { hideErrorBand, showErrorBand } from './screen-feedback.js';
import { applyText, formatPrice, loadDictionary, text } from './text-dictionary.js';

/** @typedef {import('./input-rules.js').BusinessHour} BusinessHour */
/** @typedef {import('./input-rules.js').CodeText} CodeText */
/** @typedef {import('./input-rules.js').MenuItem} MenuItem */
/** @typedef {import('./input-rules.js').Overview} Overview */
/** @typedef {import('./input-rules.js').ShopStatus} ShopStatus */

const OVERVIEW_PATH = '/api/public/overview';
const DAY_OFF = 1;
const SOLD_OUT = 'sold_out';

const page = {
  shopName: document.getElementById('shop-name'),
  main: document.getElementById('main'),
  loading: document.getElementById('home-loading'),
  errorBand: document.getElementById('home-error'),
  retry: document.getElementById('home-retry'),
  overview: document.getElementById('home-overview'),
  statusBadge: document.getElementById('shop-status'),
  statusShapes: [...document.querySelectorAll('[data-status-shape]')],
  statusText: document.getElementById('shop-status-text'),
  todayLine: document.getElementById('today-line'),
  todayRange: document.getElementById('today-range'),
  asOf: document.getElementById('status-asof'),
  hourRows: [...document.querySelectorAll('tr[data-weekday]')],
  menuEmpty: document.getElementById('menu-empty'),
  menuGroups: document.getElementById('menu-groups'),
  categoryTemplate: document.getElementById('menu-category-template'),
  rowTemplate: document.getElementById('menu-row-template'),
};

/**
 * A weekday that is not a day off and has its two times.
 * @param {BusinessHour} hour
 */
function hasTimes(hour) {
  return hour.is_day_off !== DAY_OFF && hour.opens_at !== null;
}

/**
 * What a weekday shows at the right of its row: day off, no hours set, or the two times.
 * @param {BusinessHour} hour
 * @returns {string}
 */
function hoursText(hour) {
  if (hour.is_day_off === DAY_OFF) return text('status.dayoff');
  if (!hasTimes(hour)) return text('status.unset');
  return text('hours.range', { opens: hour.opens_at, closes: hour.closes_at });
}

/**
 * The large badge, today's hours and the time the status was computed for.
 * Today's hours show only when today has them, which is when the status is open or closed.
 * @param {ShopStatus} status
 * @param {BusinessHour} today
 */
function drawStatus(status, today) {
  page.statusBadge.dataset.status = status.code;
  for (const shape of page.statusShapes) shape.toggleAttribute('hidden', shape.dataset.statusShape !== status.code);
  page.statusText.textContent = text(status.text_key);
  page.todayLine.hidden = !hasTimes(today);
  page.todayRange.textContent = hasTimes(today) ? hoursText(today) : '';
  page.asOf.textContent = text('status.asof', { time: status.local_time });
}

/**
 * The seven rows already stand in the HTML in display order. Each takes the value of its weekday.
 * @param {Map<number, BusinessHour>} hourOf
 * @param {number} todayWeekday
 */
function drawHours(hourOf, todayWeekday) {
  for (const row of page.hourRows) {
    const weekday = Number(row.dataset.weekday);
    const isToday = weekday === todayWeekday;
    row.querySelector('[data-hours-value]').textContent = hoursText(hourOf.get(weekday));
    row.querySelector('.today-mark').hidden = !isToday;
    if (isToday) row.setAttribute('aria-current', 'date');
    else row.removeAttribute('aria-current');
  }
}

/**
 * @param {MenuItem} item
 * @returns {DocumentFragment}
 */
function menuRow(item) {
  const row = page.rowTemplate.content.cloneNode(true);
  const isSoldOut = item.sale_status === SOLD_OUT;
  applyText(row);
  row.querySelector('.list-row').classList.toggle('list-row--soldout', isSoldOut);
  row.querySelector('[data-menu-name]').textContent = item.name;
  row.querySelector('[data-menu-soldout]').hidden = !isSoldOut;
  row.querySelector('[data-menu-price]').textContent = formatPrice(item.price_krw);
  return row;
}

/**
 * One group per category in the order of the category list, rows in the order of the response.
 * A category without a menu has no title. No menu at all shows the empty row.
 * @param {CodeText[]} categories
 * @param {MenuItem[]} items
 */
function drawMenu(categories, items) {
  const groups = [];
  for (const category of categories) {
    const rows = items.filter((item) => item.category === category.code).map(menuRow);
    if (rows.length === 0) continue;
    const group = page.categoryTemplate.content.cloneNode(true);
    group.querySelector('[data-category-title]').textContent = text(category.text_key);
    group.querySelector('[data-category-rows]').append(...rows);
    groups.push(group);
  }
  page.menuGroups.replaceChildren(...groups);
  page.menuEmpty.hidden = groups.length > 0;
}

/** @param {Overview} overview */
function drawOverview(overview) {
  const { shop_name, shop_status, category_list, business_hour, menu_item } = overview;
  const hourOf = new Map(business_hour.map((hour) => [hour.weekday, hour]));
  page.shopName.textContent = shop_name;
  drawStatus(shop_status, hourOf.get(shop_status.weekday));
  drawHours(hourOf, shop_status.weekday);
  drawMenu(category_list, menu_item);
}

/**
 * Asks A-01 and shows the answer. While the request is on its way only the loading row shows.
 * After a failure only the error band shows: values of an earlier answer are not kept on screen.
 * @returns {Promise<boolean>} whether the overview is on screen
 */
async function showOverview() {
  page.retry.disabled = true;
  hideErrorBand(page.errorBand);
  page.overview.hidden = true;
  page.loading.hidden = false;

  const result = await callApi('GET', OVERVIEW_PATH);

  page.loading.hidden = true;
  page.retry.disabled = false;
  if (!result.ok) {
    showErrorBand(page.errorBand, result.text_key);
    return false;
  }
  drawOverview(result.data);
  page.overview.hidden = false;
  return true;
}

// The retry button disappears with its band while the request runs, so focus is placed again
// when the answer is there: on the content, or back on the button when it failed again.
page.retry.addEventListener('click', async () => {
  const shown = await showOverview();
  (shown ? page.main : page.retry).focus();
});

await loadDictionary();
applyText();
await showOverview();
