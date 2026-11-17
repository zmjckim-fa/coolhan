// The fixed menu categories. This is the only place the list lives:
// A-01 and A-07 send it down as category_list and the input rules receive the codes as an argument.

/** @typedef {import('../web/input-rules.js').CodeText} CodeText */

export const MENU_CATEGORIES = Object.freeze([
  Object.freeze({ code: 'bread', text_key: 'category.bread', display_order: 1 }),
  Object.freeze({ code: 'cake', text_key: 'category.cake', display_order: 2 }),
  Object.freeze({ code: 'cookie', text_key: 'category.cookie', display_order: 3 }),
  Object.freeze({ code: 'drink', text_key: 'category.drink', display_order: 4 }),
]);

const inDisplayOrder = [...MENU_CATEGORIES].sort((a, b) => a.display_order - b.display_order);

/** Category codes in display order. */
export const CATEGORY_CODES = Object.freeze(inDisplayOrder.map((category) => category.code));

/** The category_list field of the A-01 and A-07 responses. @type {readonly CodeText[]} */
export const CATEGORY_LIST = Object.freeze(inDisplayOrder.map(({ code, text_key }) => Object.freeze({ code, text_key })));
