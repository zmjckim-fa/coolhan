// A-07 to A-11: reading the menu (T-02), adding, changing, removing and reordering items.
// Every write answers with the whole list read back from the database, so a screen redraws
// from what is stored, not from what it sent.

import { checkCategory, checkMenuName, checkPriceKrw, checkSaleStatus } from '../web/input-rules.js';
import { ApiFailure } from './json-exchange.js';
import { CATEGORY_CODES, CATEGORY_LIST } from './menu-category.js';
import { readMenuItems } from './public-overview.js';

export const MENU_ITEM_LIMIT = 200;

const NEW_ITEM_SALE_STATUS = 'on_sale';
const MENU_ID_TEXT = /^[1-9][0-9]*$/;

function passed(result) {
  if (!result.ok) throw new ApiFailure(result.code);
  return result;
}

/** The fields to store, checked by the shared input rules. The name is the value the rule hands back. */
function checkedFields(body, { withSaleStatus }) {
  const name = passed(checkMenuName(body.name)).value;
  passed(checkPriceKrw(body.price_krw));
  passed(checkCategory(body.category, CATEGORY_CODES));
  if (withSaleStatus) passed(checkSaleStatus(body.sale_status));
  return {
    name,
    priceKrw: body.price_krw,
    category: body.category,
    saleStatus: withSaleStatus ? body.sale_status : NEW_ITEM_SALE_STATUS,
  };
}

/** The id of a path such as /api/admin/menu/12. Anything that is not a positive integer names no item. */
function menuIdOf(pathId) {
  const id = MENU_ID_TEXT.test(pathId) ? Number(pathId) : NaN;
  if (!Number.isSafeInteger(id)) throw new ApiFailure('menu_not_found');
  return id;
}

/** The end of a category: one past its largest sort_order, or 0 when it is empty. */
function nextSortOrder(database, category) {
  const { last } = database.prepare('SELECT max(sort_order) AS last FROM menu_item WHERE category = ?').get(category);
  return last === null ? 0 : last + 1;
}

const menuList = (database) => ({ menu_item: readMenuItems(database) });

/** A-07 handler. */
export function readMenu({ database }) {
  return { status: 200, body: { category_list: CATEGORY_LIST, ...menuList(database) } };
}

/** A-08 handler. The new item is on sale and goes to the end of its category. */
export function addMenuItem({ database, now }, { body }) {
  const item = checkedFields(body, { withSaleStatus: false });
  const at = now().toISOString();
  database.transaction(() => {
    const { total } = database.prepare('SELECT count(*) AS total FROM menu_item').get();
    if (total >= MENU_ITEM_LIMIT) throw new ApiFailure('menu_limit_reached');
    database
      .prepare('INSERT INTO menu_item (name, price_krw, category, sale_status, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(item.name, item.priceKrw, item.category, item.saleStatus, nextSortOrder(database, item.category), at, at);
  });
  return { status: 201, body: menuList(database) };
}

/** A-09 handler. Replaces the whole row. A new category puts the item at the end of that category. */
export function changeMenuItem({ database, now }, { body, pathId }) {
  const item = checkedFields(body, { withSaleStatus: true });
  const id = menuIdOf(pathId);
  database.transaction(() => {
    const current = database.prepare('SELECT category, sort_order FROM menu_item WHERE id = ?').get(id);
    if (current === undefined) throw new ApiFailure('menu_not_found');
    const sortOrder = current.category === item.category ? current.sort_order : nextSortOrder(database, item.category);
    database
      .prepare('UPDATE menu_item SET name = ?, price_krw = ?, category = ?, sale_status = ?, sort_order = ?, updated_at = ? WHERE id = ?')
      .run(item.name, item.priceKrw, item.category, item.saleStatus, sortOrder, now().toISOString(), id);
  });
  return { status: 200, body: menuList(database) };
}

/** A-10 handler. */
export function removeMenuItem({ database }, { pathId }) {
  const { changes } = database.prepare('DELETE FROM menu_item WHERE id = ?').run(menuIdOf(pathId));
  if (Number(changes) === 0) throw new ApiFailure('menu_not_found');
  return { status: 200, body: menuList(database) };
}

/**
 * A-11 handler. `id` lists every item of the category in its new order; the position in the
 * list becomes sort_order. A list that is not exactly the category's items changes nothing.
 */
export function saveMenuOrder({ database, now }, { body }) {
  passed(checkCategory(body.category, CATEGORY_CODES));
  const sent = new Set(body.id);
  const at = now().toISOString();
  database.transaction(() => {
    const stored = database.prepare('SELECT id FROM menu_item WHERE category = ?').all(body.category);
    if (stored.length !== sent.size || !stored.every((row) => sent.has(row.id))) throw new ApiFailure('menu_order_mismatch');
    const move = database.prepare('UPDATE menu_item SET sort_order = ?, updated_at = ? WHERE id = ? AND sort_order <> ?');
    body.id.forEach((id, position) => move.run(position, at, id, position));
  });
  return { status: 200, body: menuList(database) };
}
