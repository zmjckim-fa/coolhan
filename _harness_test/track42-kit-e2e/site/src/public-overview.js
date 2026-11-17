// A-01: everything the visitor screen shows, in one response. It reads T-01 and T-02 and derives
// the shop status for the instant of the request. It neither reads nor sets a cookie.
// The two readers are also what the admin APIs answer with, so both sides show the same rows.

import { CATEGORY_CODES, CATEGORY_LIST } from './menu-category.js';
import { deriveShopStatus } from './shop-status.js';

/** @typedef {import('../web/input-rules.js').BusinessHour} BusinessHour */
/** @typedef {import('../web/input-rules.js').MenuItem} MenuItem */

/**
 * The seven weekday rows, Sunday first, with the four fields a screen reads.
 * @returns {BusinessHour[]}
 */
export function readBusinessHours(database) {
  return database.prepare('SELECT weekday, opens_at, closes_at, is_day_off FROM business_hour ORDER BY weekday').all();
}

/**
 * Every menu row with the six fields a screen reads: categories in display order,
 * inside a category by sort_order, then by id. The display order comes from the category list,
 * not from the spelling of the codes the index happens to sort by.
 * @returns {MenuItem[]}
 */
export function readMenuItems(database) {
  const rows = database
    .prepare('SELECT id, name, price_krw, category, sale_status, sort_order FROM menu_item ORDER BY category, sort_order, id')
    .all();
  return CATEGORY_CODES.flatMap((code) => rows.filter((row) => row.category === code));
}

/** A-01 handler. */
export function readOverview({ database, environment, now }) {
  const businessHours = readBusinessHours(database);
  return {
    status: 200,
    body: {
      shop_name: environment.shopName,
      shop_status: deriveShopStatus(businessHours, now(), environment.shopTimeZone),
      category_list: CATEGORY_LIST,
      business_hour: businessHours,
      menu_item: readMenuItems(database),
    },
  };
}
