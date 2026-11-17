// Screen text dictionary. Every word a screen shows comes through this file.
//
// In HTML:
//   data-text="area.name"            the element's text becomes that entry
//   data-text-aria="area.name"       the element's aria-label becomes that entry
//   data-value-<slot>="area.name"    fills the {slot} of the entry on the same element with another entry
// In scripts:
//   text('area.name', { slot: value })
//   applyText(root, { slot: value })  for a cloned template whose entries need runtime values
//
// Text is only ever written as text content or as an attribute value, never as markup.
// A missing entry or a missing slot value is a programming error and throws.

export const DICTIONARY_URL = '/text/ko.json';

const TEXT_ATTRIBUTE = 'data-text';
const NAME_ATTRIBUTE = 'data-text-aria';
const VALUE_ATTRIBUTE_PREFIX = 'data-value-';
const SLOT = /\{([a-z]+)\}/g;
const ELEMENT_NODE = 1;
const groupedDigits = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });

/** @type {Record<string, string> | null} */
let entries = null;
/** @type {Promise<void> | null} */
let loading = null;

/**
 * @param {(url: string) => Promise<{ ok: boolean, status: number, json(): Promise<unknown> }>} fetchFile
 */
async function readDictionary(fetchFile) {
  const response = await fetchFile(DICTIONARY_URL);
  if (!response.ok) throw new Error(`dictionary request failed with status ${response.status}`);
  entries = await response.json();
}

/**
 * Fetches the dictionary once. Later calls share the same request. A failed request is not kept,
 * so the next call asks again.
 * @param {(url: string) => Promise<{ ok: boolean, status: number, json(): Promise<unknown> }>} [fetchFile]
 * @returns {Promise<void>}
 */
export function loadDictionary(fetchFile = (url) => globalThis.fetch(url)) {
  if (loading === null) {
    loading = readDictionary(fetchFile).catch((error) => {
      loading = null;
      throw error;
    });
  }
  return loading;
}

/**
 * The entry for a key with its slots filled.
 * @param {string} key
 * @param {Record<string, string | number>} [values]
 * @returns {string}
 */
export function text(key, values = {}) {
  if (entries === null) throw new Error('the text dictionary is not loaded');
  if (!Object.hasOwn(entries, key)) throw new Error(`unknown text key: ${key}`);
  return entries[key].replace(SLOT, (_, slot) => {
    if (!Object.hasOwn(values, slot)) throw new Error(`text key ${key} needs a value for ${slot}`);
    return String(values[slot]);
  });
}

/**
 * A price for display: grouped thousands inside the price.format entry.
 * @param {number} priceKrw
 * @returns {string}
 */
export function formatPrice(priceKrw) {
  return text('price.format', { amount: groupedDigits.format(priceKrw) });
}

/**
 * @param {Document | DocumentFragment | Element} root
 * @param {string} attribute
 * @returns {Element[]}
 */
function elementsWith(root, attribute) {
  const found = [...root.querySelectorAll(`[${attribute}]`)];
  if (root.nodeType === ELEMENT_NODE && root.hasAttribute(attribute)) found.unshift(root);
  return found;
}

/**
 * Slot values for one element: the runtime values, overridden by its own data-value-* entries.
 * @param {Element} element
 * @param {Record<string, string | number>} values
 */
function slotValues(element, values) {
  const own = {};
  for (const { name, value } of element.attributes) {
    if (name.startsWith(VALUE_ATTRIBUTE_PREFIX)) own[name.slice(VALUE_ATTRIBUTE_PREFIX.length)] = text(value);
  }
  return { ...values, ...own };
}

/**
 * Writes dictionary text into every element under root (root included) that asks for it.
 * A template's content is not reached from the document: call this again on each clone.
 * @param {Document | DocumentFragment | Element} [root]
 * @param {Record<string, string | number>} [values] runtime values for slots, such as a menu name
 */
export function applyText(root = document, values = {}) {
  for (const element of elementsWith(root, TEXT_ATTRIBUTE)) {
    element.textContent = text(element.getAttribute(TEXT_ATTRIBUTE), slotValues(element, values));
  }
  for (const element of elementsWith(root, NAME_ATTRIBUTE)) {
    element.setAttribute('aria-label', text(element.getAttribute(NAME_ATTRIBUTE), slotValues(element, values)));
  }
}
