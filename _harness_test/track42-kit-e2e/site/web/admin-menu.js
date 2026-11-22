// S-04 menu management: add, change, remove, mark sold out and reorder menu items.
//
// Opening: the top bar checks the session (A-04) and hands the CSRF token to the API client,
// then A-07 brings the category list and the menu.
// Writing: A-08 (add), A-09 (change, and the sale status), A-10 (remove), A-11 (order). Each of
// them answers with the whole menu as it is stored, and the list is drawn again from that answer,
// never from what was typed. A failed write keeps what was typed and shows its text where the
// screen plan puts it: under the control, under the row, above the add button, or in the band
// under the title when the list had to be read again.
// Values are checked with the shared input rules before anything is sent.
// Menu names are data: they are written as text content or attribute values, never as markup.

import { callApi } from './api-client.js';
import { readAdminSession, startAdminTopBar } from './admin-top-bar.js';
import { checkCategory, checkMenuName, parsePriceText, PRICE_KRW_MAX } from './input-rules.js';
import {
  bindTooltips,
  clearFieldError,
  closeConfirmDialog,
  hideErrorBand,
  hideSavedNotice,
  openConfirmDialog,
  showErrorBand,
  showFieldError,
  showSavedNotice,
} from './screen-feedback.js';
import { applyText, formatPrice, loadDictionary, text } from './text-dictionary.js';

/** @typedef {import('./api-client.js').ApiResult} ApiResult */
/** @typedef {import('./api-client.js').ApiFailure} ApiFailure */
/** @typedef {import('./input-rules.js').CodeText} CodeText */
/** @typedef {import('./input-rules.js').MenuItem} MenuItem */
/** @typedef {import('./input-rules.js').MenuScreenPayload} MenuScreenPayload */
/** @typedef {'name' | 'price_krw' | 'category'} FieldName */
/** @typedef {Record<FieldName, { control: HTMLInputElement | HTMLSelectElement, line: HTMLElement }>} FormFields */
/** @typedef {{ id: number } & Record<FieldName, string>} Draft */
/** What an action hands back: what to do once the buttons work again, or LEAVING. */
/** @typedef {(() => void) | typeof LEAVING} Afterwards */

const MENU_API = '/api/admin/menu';
const MENU_ORDER_API = '/api/admin/menu-order';
/** @param {number} id */
const menuItemApi = (id) => `/api/admin/menu/${id}`;

const AUTH_REQUIRED = 'auth_required';
const MENU_NOT_FOUND = 'menu_not_found';
const MENU_ORDER_MISMATCH = 'menu_order_mismatch';
const SOLD_OUT = 'sold_out';

/** The session is gone and the API client is moving to the login screen: nothing is restored. */
const LEAVING = Symbol('leaving');

/**
 * The three controls of the add form and of the edit form, in the order they stand on screen,
 * each with the shared rule that checks its text. A rule hands back the value to send when it
 * changes the text (trimmed name, price as an integer).
 * @type {Readonly<Record<FieldName, (value: string) => import('./input-rules.js').RuleResult>>}
 */
const FIELD_RULES = Object.freeze({
  name: (value) => checkMenuName(value),
  price_krw: (value) => parsePriceText(value),
  category: (value) => checkCategory(value, state.categories.map((category) => category.code)),
});
const FIELD_NAMES = /** @type {FieldName[]} */ (Object.keys(FIELD_RULES));

/**
 * The control a server answer about a wrong value belongs to. The screen checks with the same
 * rules first, so these only show when the server judges differently.
 * @type {Readonly<Record<string, FieldName>>}
 */
const FIELD_OF_CODE = Object.freeze({
  menu_name_required: 'name',
  menu_name_invalid: 'name',
  menu_name_too_long: 'name',
  menu_price_required: 'price_krw',
  menu_price_range: 'price_krw',
  menu_category_invalid: 'category',
});

const page = {
  title: document.getElementById('screen-title'),
  notice: document.getElementById('menu-notice'),
  errorBand: document.getElementById('menu-error'),
  retry: document.getElementById('menu-retry'),
  loading: document.getElementById('menu-loading'),
  content: document.getElementById('menu-content'),
  addForm: document.getElementById('add-form'),
  addError: document.getElementById('add-error'),
  empty: document.getElementById('menu-empty'),
  groups: document.getElementById('menu-groups'),
  dialog: document.getElementById('delete-dialog'),
  dialogBody: document.getElementById('delete-dialog-body'),
  dialogDelete: document.getElementById('delete-confirm'),
  groupTemplate: document.getElementById('menu-group-template'),
  rowTemplate: document.getElementById('menu-row-template'),
  editTemplate: document.getElementById('menu-edit-template'),
};

const state = {
  /** @type {CodeText[]} */
  categories: [],
  /** @type {MenuItem[]} the menu as the server last sent it, in display order */
  items: [],
  /** @type {number | null} the row in edit state */
  editingId: null,
  /** @type {MenuItem | null} the row the confirm dialog asks about */
  deleting: null,
  /** @type {Map<number, string>} text key of the error line under a row, until that row is tried again */
  rowErrors: new Map(),
  /** A write is on its way. */
  busy: false,
};

/**
 * The answer of A-04. The first comes from the top bar. A retry asks again when it was a failure.
 * @type {Promise<ApiResult>}
 */
let sessionAnswer;

// ---------- finding things ----------

/**
 * @param {HTMLFormElement} form
 * @returns {FormFields}
 */
function fieldsOf(form) {
  return /** @type {FormFields} */ (Object.fromEntries(FIELD_NAMES.map((name) => [name, {
    control: form.querySelector(`[data-field="${name}"]`),
    line: form.querySelector(`[data-field-error="${name}"]`),
  }])));
}

/** @returns {HTMLElement[]} */
function rows() {
  return [...page.groups.querySelectorAll('[data-menu-row]')];
}

/**
 * @param {number} id
 * @returns {HTMLElement | null}
 */
function rowOf(id) {
  return rows().find((row) => row.dataset.menuId === String(id)) ?? null;
}

/**
 * @param {Element} row
 * @returns {MenuItem | undefined}
 */
function itemOf(row) {
  return state.items.find((item) => String(item.id) === row.dataset.menuId);
}

/**
 * The first of the named buttons of a row that can take focus. A row in edit state shows no
 * buttons of its own, so its name control stands in.
 * @param {number} id
 * @param {...string} actions
 * @returns {HTMLElement | null}
 */
function rowTarget(id, ...actions) {
  const row = rowOf(id);
  if (row === null) return null;
  const form = row.querySelector('[data-row-edit]');
  if (form !== null) return fieldsOf(form).name.control;
  for (const action of actions) {
    const button = row.querySelector(`[data-action="${action}"]:not([data-idle])`);
    if (button !== null && !button.disabled) return button;
  }
  return null;
}

/**
 * Focus for the first target that exists. When none does, the title takes it, so focus is
 * never left on a button that is gone.
 * @param {...(() => HTMLElement | null)} finders
 * @returns {() => void}
 */
function focusOn(...finders) {
  return () => {
    for (const find of finders) {
      const target = find();
      if (target !== null) return target.focus();
    }
    return page.title.focus();
  };
}

/**
 * Remembers where focus is now. The function handed back puts it there again, when that
 * element is still on the page. A button loses focus while it is disabled for its request.
 * @returns {() => void}
 */
function focusKeeper() {
  const active = document.activeElement;
  return () => {
    if (active instanceof HTMLElement && active.isConnected) active.focus();
  };
}

// ---------- feedback ----------

/**
 * The band under the title. While the list is on screen it reports why the list was read again
 * (or a failed logout). Without the list it reports a failed load and carries the retry button.
 * @param {string} textKey
 */
function showBand(textKey) {
  page.retry.hidden = !page.content.hidden;
  showErrorBand(page.errorBand, textKey);
}

/** @param {string} textKey */
function showLoadFailure(textKey) {
  page.content.hidden = true;
  showBand(textKey);
}

/**
 * @param {number} id
 * @param {string} textKey
 */
function showRowError(id, textKey) {
  state.rowErrors.set(id, textKey);
  const row = rowOf(id);
  if (row !== null) showErrorBand(row.querySelector('[data-row-error]'), textKey);
}

/** @param {number} id */
function hideRowError(id) {
  state.rowErrors.delete(id);
  const row = rowOf(id);
  if (row !== null) hideErrorBand(row.querySelector('[data-row-error]'));
}

/**
 * While a write is on its way no other can start. A button at the edge of its category
 * (up on the first row, down on the last) stays disabled either way.
 * @param {boolean} busy
 */
function setBusy(busy) {
  state.busy = busy;
  for (const button of document.querySelectorAll('[data-request-button]')) {
    button.disabled = busy || button.hasAttribute('data-edge');
  }
}

// ---------- the two forms ----------

/**
 * Checks the three controls with the shared input rules. Every wrong one gets its error line.
 * @param {FormFields} fields
 * @returns {{ values: { name: string, price_krw: number, category: string }, firstWrong: HTMLElement | null }}
 */
function checkFields(fields) {
  const values = {};
  let firstWrong = null;
  for (const name of FIELD_NAMES) {
    const { control, line } = fields[name];
    const result = FIELD_RULES[name](control.value);
    if (result.ok) {
      clearFieldError(control, line);
      values[name] = result.value ?? control.value;
    } else {
      showFieldError(control, line, result.text_key);
      firstWrong ??= control;
    }
  }
  return { values, firstWrong };
}

/**
 * A control that shows an error is checked again while its value changes, so the line leaves
 * as soon as its cause is gone.
 * @param {Event} event
 */
function checkAgainWhileWrong(event) {
  const control = event.target;
  if (!(control instanceof HTMLElement) || control.getAttribute('aria-invalid') !== 'true') return;
  const name = /** @type {FieldName} */ (control.dataset.field);
  const { line } = fieldsOf(control.closest('form'))[name];
  const result = FIELD_RULES[name](control.value);
  if (result.ok) clearFieldError(control, line);
  else showFieldError(control, line, result.text_key);
}

/**
 * @param {HTMLSelectElement} select its first option (no choice yet) stays
 */
function fillCategoryOptions(select) {
  const chosen = select.value;
  select.length = 1;
  for (const category of state.categories) select.add(new Option(text(category.text_key), category.code));
  select.value = chosen;
}

/**
 * The typed values of the row in edit state. They outlive a redraw caused by another row.
 * @returns {Draft | null}
 */
function readDraft() {
  const form = page.groups.querySelector('[data-row-edit]');
  if (form === null) return null;
  const fields = fieldsOf(form);
  const draft = { id: Number(form.closest('[data-menu-row]').dataset.menuId) };
  for (const name of FIELD_NAMES) draft[name] = fields[name].control.value;
  return /** @type {Draft} */ (draft);
}

/**
 * @param {MenuItem} item
 * @param {Draft | null} draft
 * @returns {HTMLFormElement}
 */
function editForm(item, draft) {
  const fragment = page.editTemplate.content.cloneNode(true);
  applyText(fragment);
  const form = fragment.querySelector('[data-row-edit]');
  const fields = fieldsOf(form);
  fillCategoryOptions(fields.category.control);
  fields.name.control.value = draft?.name ?? item.name;
  fields.price_krw.control.value = draft?.price_krw ?? String(item.price_krw);
  fields.category.control.value = draft?.category ?? item.category;
  return form;
}

// ---------- drawing ----------

/**
 * @param {MenuItem} item
 * @param {{ isFirst: boolean, isLast: boolean, draft: Draft | null }} place its place inside its category
 * @returns {HTMLElement}
 */
function menuRow(item, { isFirst, isLast, draft }) {
  const fragment = page.rowTemplate.content.cloneNode(true);
  applyText(fragment, { name: item.name });
  const row = fragment.querySelector('[data-menu-row]');
  const errorLine = row.querySelector('[data-row-error]');

  row.dataset.menuId = String(item.id);
  row.classList.toggle('list-row--soldout', item.sale_status === SOLD_OUT);
  row.querySelector('[data-menu-name]').textContent = item.name;
  row.querySelector('[data-menu-price]').textContent = formatPrice(item.price_krw);
  row.querySelector('[data-menu-price-room]').textContent = formatPrice(PRICE_KRW_MAX);
  for (const badge of row.querySelectorAll('[data-sale-badge]')) badge.hidden = badge.dataset.status !== item.sale_status;
  for (const button of row.querySelectorAll('[data-action="sale"]')) {
    button.toggleAttribute('data-idle', button.dataset.saleStatus === item.sale_status);
  }
  row.querySelector('[data-action="up"]').toggleAttribute('data-edge', isFirst);
  row.querySelector('[data-action="down"]').toggleAttribute('data-edge', isLast);

  if (item.id === state.editingId) {
    row.querySelector('[data-row-view]').hidden = true;
    row.insertBefore(editForm(item, draft), errorLine);
  }
  if (state.rowErrors.has(item.id)) showErrorBand(errorLine, state.rowErrors.get(item.id));
  return row;
}

/**
 * One group per category in the order of the category list, rows in the order of the response.
 * A category without a menu has no title. No menu at all shows the empty row.
 */
function drawList() {
  const typed = readDraft();
  const known = new Set(state.items.map((item) => item.id));
  if (!known.has(state.editingId)) state.editingId = null;
  for (const id of [...state.rowErrors.keys()]) {
    if (!known.has(id)) state.rowErrors.delete(id);
  }
  const draft = typed !== null && typed.id === state.editingId ? typed : null;

  const groups = [];
  for (const category of state.categories) {
    const items = state.items.filter((item) => item.category === category.code);
    if (items.length === 0) continue;
    const group = page.groupTemplate.content.cloneNode(true);
    group.querySelector('[data-category-title]').textContent = text(category.text_key);
    group.querySelector('[data-category-rows]').append(...items.map((item, index) => menuRow(item, {
      isFirst: index === 0,
      isLast: index === items.length - 1,
      draft,
    })));
    groups.push(group);
  }
  page.groups.replaceChildren(...groups);
  page.empty.hidden = groups.length > 0;
  setBusy(state.busy);
}

/** @param {MenuItem[]} items the menu_item of a response */
function takeMenuItems(items) {
  state.items = items;
  drawList();
}

/** @param {MenuScreenPayload} payload the A-07 response */
function takeMenu(payload) {
  state.categories = payload.category_list;
  fillCategoryOptions(fieldsOf(page.addForm).category.control);
  takeMenuItems(payload.menu_item);
}

/**
 * Asks A-07 and shows the answer. While the request is on its way only the loading row shows.
 * After a failure the band and its retry button show in place of the list.
 * @returns {Promise<boolean>} whether the list is on screen
 */
async function showMenu() {
  page.retry.disabled = true;
  hideErrorBand(page.errorBand);
  page.content.hidden = true;
  page.loading.hidden = false;

  const session = await sessionAnswer;
  const result = session.ok ? await callApi('GET', MENU_API) : session;
  if (!result.ok && result.code === AUTH_REQUIRED) return false;

  page.loading.hidden = true;
  page.retry.disabled = false;
  if (!result.ok) {
    showLoadFailure(result.text_key);
    return false;
  }
  takeMenu(result.data);
  page.content.hidden = false;
  return true;
}

// ---------- actions ----------

/**
 * Runs one action that writes. The notice and the band of the action before it leave, and the
 * request buttons stay disabled until this one has its answer. Focus is placed last, because a
 * disabled button cannot take it.
 * @param {() => Promise<Afterwards>} action
 */
async function run(action) {
  if (state.busy) return;
  hideSavedNotice(page.notice);
  hideErrorBand(page.errorBand);
  setBusy(true);
  let afterwards;
  try {
    afterwards = await action();
  } catch (error) {
    setBusy(false);
    throw error;
  }
  if (afterwards === LEAVING) return;
  setBusy(false);
  afterwards();
}

/**
 * The list on screen is not the list of the server (a row is already gone, or the order moved):
 * shows why and reads the menu again with A-07.
 * @param {ApiFailure} failure
 * @param {() => void} placeFocus
 * @returns {Promise<Afterwards>}
 */
async function matchListAgain(failure, placeFocus) {
  showBand(failure.text_key);
  const again = await callApi('GET', MENU_API);
  if (again.ok) {
    takeMenu(again.data);
    return placeFocus;
  }
  if (again.code === AUTH_REQUIRED) return LEAVING;
  showLoadFailure(again.text_key);
  return () => page.retry.focus();
}

/**
 * A write about one row failed: its text goes under that row and the row stays as it was.
 * @param {number} id
 * @param {ApiFailure} failure
 * @param {() => void} placeFocus
 * @returns {Afterwards | Promise<Afterwards>}
 */
function rowFailure(id, failure, placeFocus) {
  if (failure.code === AUTH_REQUIRED) return LEAVING;
  if (failure.code === MENU_NOT_FOUND || failure.code === MENU_ORDER_MISMATCH) return matchListAgain(failure, placeFocus);
  showRowError(id, failure.text_key);
  return placeFocus;
}

/**
 * The answer about a wrong value goes under its control. Any other answer goes to `elsewhere`.
 * @param {FormFields} fields
 * @param {ApiFailure} failure
 * @param {() => void} elsewhere
 * @returns {HTMLElement | null} the control that now shows the error
 */
function showFormFailure(fields, failure, elsewhere) {
  const name = Object.hasOwn(FIELD_OF_CODE, failure.code ?? '') ? FIELD_OF_CODE[failure.code] : null;
  if (name === null || !fields[name].control.isConnected) {
    elsewhere();
    return null;
  }
  showFieldError(fields[name].control, fields[name].line, failure.text_key);
  return fields[name].control;
}

/** A-08. @returns {Promise<Afterwards>} */
async function addItem() {
  const back = focusKeeper();
  const fields = fieldsOf(page.addForm);
  hideErrorBand(page.addError);
  const { values, firstWrong } = checkFields(fields);
  if (firstWrong !== null) return () => firstWrong.focus();

  const result = await callApi('POST', MENU_API, values);
  if (result.ok) {
    takeMenuItems(result.data.menu_item);
    page.addForm.reset();
    showSavedNotice(page.notice, 'notice.added');
    return () => fields.name.control.focus();
  }
  if (result.code === AUTH_REQUIRED) return LEAVING;
  const wrong = showFormFailure(fields, result, () => showErrorBand(page.addError, result.text_key));
  return wrong === null ? back : () => wrong.focus();
}

/**
 * A-09 from the edit state of a row. All four fields travel, the sale status as it is stored.
 * @param {HTMLFormElement} form
 * @returns {Promise<Afterwards>}
 */
async function saveItem(form) {
  const back = focusKeeper();
  const item = itemOf(form.closest('[data-menu-row]'));
  const fields = fieldsOf(form);
  hideRowError(item.id);
  const { values, firstWrong } = checkFields(fields);
  if (firstWrong !== null) return () => firstWrong.focus();

  const saveButton = form.querySelector('[data-edit-save]');
  saveButton.textContent = text('notice.saving');
  const result = await callApi('PUT', menuItemApi(item.id), { ...values, sale_status: item.sale_status });
  if (result.ok) {
    state.editingId = null;
    takeMenuItems(result.data.menu_item);
    showSavedNotice(page.notice, 'notice.saved');
    return focusOn(() => rowTarget(item.id, 'edit'));
  }
  saveButton.textContent = text('button.save');
  if (result.code === AUTH_REQUIRED) return LEAVING;
  if (result.code === MENU_NOT_FOUND) return matchListAgain(result, focusOn());
  const wrong = showFormFailure(fields, result, () => showRowError(item.id, result.text_key));
  return wrong === null ? back : () => wrong.focus();
}

/**
 * A-09 from the sold-out button of a row. The other three fields travel as they are stored.
 * @param {MenuItem} item
 * @param {string} saleStatus the status the pressed button sets
 * @returns {Promise<Afterwards>}
 */
async function setSaleStatus(item, saleStatus) {
  const onButton = focusOn(() => rowTarget(item.id, 'sale'));
  hideRowError(item.id);
  const result = await callApi('PUT', menuItemApi(item.id), {
    name: item.name,
    price_krw: item.price_krw,
    category: item.category,
    sale_status: saleStatus,
  });
  if (!result.ok) return rowFailure(item.id, result, onButton);
  takeMenuItems(result.data.menu_item);
  showSavedNotice(page.notice, 'notice.saved');
  return onButton;
}

/**
 * A-11. The row moves one place inside its category and every id of that category travels in
 * the new order. Focus stays on the pressed button of the moved row. When that button is now at
 * the edge, the other order button of the row takes it.
 * @param {MenuItem} item
 * @param {'up' | 'down'} direction
 * @returns {Promise<Afterwards>}
 */
async function moveItem(item, direction) {
  const [step, other] = direction === 'up' ? [-1, 'down'] : [1, 'up'];
  const ids = state.items.filter((sibling) => sibling.category === item.category).map((sibling) => sibling.id);
  const from = ids.indexOf(item.id);
  const to = from + step;
  if (to < 0 || to >= ids.length) return focusKeeper();
  ids.splice(to, 0, ...ids.splice(from, 1));

  const onButton = focusOn(() => rowTarget(item.id, direction, other));
  hideRowError(item.id);
  const result = await callApi('PUT', MENU_ORDER_API, { category: item.category, id: ids });
  if (!result.ok) return rowFailure(item.id, result, onButton);
  takeMenuItems(result.data.menu_item);
  showSavedNotice(page.notice, 'notice.saved');
  return onButton;
}

/**
 * A-10, after the confirm dialog. When the row is gone focus goes to the edit button of the row
 * after it, else of the row before it, else to the name control of the add form.
 * @returns {Promise<Afterwards>}
 */
async function deleteItem() {
  const item = state.deleting;
  const index = state.items.findIndex((other) => other.id === item.id);
  const neighbours = index === -1 ? [] : [state.items[index + 1], state.items[index - 1]].filter((other) => other !== undefined);
  const onNeighbour = focusOn(
    ...neighbours.map((neighbour) => () => rowTarget(neighbour.id, 'edit')),
    () => fieldsOf(page.addForm).name.control,
  );

  hideRowError(item.id);
  const result = await callApi('DELETE', menuItemApi(item.id));
  if (result.ok) {
    closeConfirmDialog(page.dialog, { returnFocus: false });
    takeMenuItems(result.data.menu_item);
    showSavedNotice(page.notice, 'notice.deleted');
    return onNeighbour;
  }
  if (result.code === AUTH_REQUIRED) return LEAVING;
  if (result.code === MENU_NOT_FOUND) {
    closeConfirmDialog(page.dialog, { returnFocus: false });
    return matchListAgain(result, onNeighbour);
  }
  // The row is still there: the dialog closes and focus goes back to the delete button of that row.
  showRowError(item.id, result.text_key);
  return () => closeConfirmDialog(page.dialog);
}

// ---------- row buttons that do not write ----------

/**
 * Opens the edit state of a row. A row that was in it goes back to its stored values.
 * @param {MenuItem} item
 */
function startEdit(item) {
  state.editingId = item.id;
  drawList();
  rowTarget(item.id).focus();
}

/** Back to the stored values and to the view state. Focus goes to the edit button of that row. */
function cancelEdit() {
  const id = state.editingId;
  state.editingId = null;
  drawList();
  focusOn(() => rowTarget(id, 'edit'))();
}

/**
 * Asks before anything is removed. The dialog names the menu.
 * @param {MenuItem} item
 * @param {HTMLElement} button the delete button of the row
 */
function askDelete(item, button) {
  state.deleting = item;
  page.dialogBody.textContent = text('confirm.delete.body', { name: item.name });
  openConfirmDialog(page.dialog, button);
}

/** @type {Readonly<Record<string, (item: MenuItem, button: HTMLButtonElement) => void>>} */
const ROW_ACTIONS = Object.freeze({
  sale: (item, button) => run(() => setSaleStatus(item, button.dataset.saleStatus)),
  up: (item) => run(() => moveItem(item, 'up')),
  down: (item) => run(() => moveItem(item, 'down')),
  edit: (item) => startEdit(item),
  delete: (item, button) => askDelete(item, button),
});

/** @param {MouseEvent} event */
function pressRowButton(event) {
  const button = event.target instanceof Element ? event.target.closest('button') : null;
  if (button === null || button.disabled) return;
  if (button.matches('[data-edit-cancel]')) {
    cancelEdit();
    return;
  }
  const action = button.dataset.action;
  if (action === undefined || !Object.hasOwn(ROW_ACTIONS, action)) return;
  const item = itemOf(button.closest('[data-menu-row]'));
  if (item !== undefined) ROW_ACTIONS[action](item, button);
}

// ---------- opening ----------

page.addForm.addEventListener('submit', (event) => {
  event.preventDefault();
  run(addItem);
});
page.addForm.addEventListener('input', checkAgainWhileWrong);

page.groups.addEventListener('click', pressRowButton);
page.groups.addEventListener('input', checkAgainWhileWrong);
page.groups.addEventListener('submit', (event) => {
  event.preventDefault();
  const form = event.target;
  run(() => saveItem(form));
});

page.dialogDelete.addEventListener('click', () => run(deleteItem));

// The retry button disappears with its band while the request runs, so focus is placed again
// when the answer is there: on the title, or back on the button when it failed again.
page.retry.addEventListener('click', async () => {
  page.retry.disabled = true;
  if (!(await sessionAnswer).ok) sessionAnswer = readAdminSession();
  const shown = await showMenu();
  (shown ? page.title : page.retry).focus();
});

sessionAnswer = startAdminTopBar({
  onLogoutError: (textKey) => {
    hideSavedNotice(page.notice);
    showBand(textKey);
  },
});
await loadDictionary();
applyText();
bindTooltips();
await showMenu();
