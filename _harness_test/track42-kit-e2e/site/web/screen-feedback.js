// Opening and closing of the feedback components: error line and error band (C-10),
// saved notice (C-14), confirm dialog (C-11) and tip button (C-09).
//
// The elements already stand in the HTML with the hidden attribute. These functions fill in the
// dictionary text and switch that attribute. Nothing here builds markup.
//
// What the HTML has to provide:
//   error line, error band, saved notice   one descendant (or the element itself) with data-feedback-text
//   error line                             an id, so the control can point at it
//   confirm dialog                         a dialog element with one button marked data-dialog-cancel
//   tip button                             a button whose aria-describedby names an element with role="tooltip"

import { text } from './text-dictionary.js';

const TEXT_SLOT = '[data-feedback-text]';
const DIALOG_CANCEL = '[data-dialog-cancel]';
const DESCRIBED_BY = 'aria-describedby';

/**
 * @param {Element} element
 * @returns {Element}
 */
function textSlot(element) {
  const slot = element.matches(TEXT_SLOT) ? element : element.querySelector(TEXT_SLOT);
  if (slot === null) throw new Error('a feedback element needs a data-feedback-text slot');
  return slot;
}

/**
 * @param {HTMLElement} element
 * @param {string} textKey
 * @param {Record<string, string | number>} [values]
 */
function show(element, textKey, values) {
  const words = text(textKey, values);
  element.hidden = false;
  textSlot(element).textContent = words;
}

/** @param {HTMLElement} element */
function hide(element) {
  element.hidden = true;
  textSlot(element).textContent = '';
}

/**
 * @param {Element} control
 * @returns {string[]}
 */
function describedBy(control) {
  return (control.getAttribute(DESCRIBED_BY) ?? '').split(/\s+/).filter(Boolean);
}

/**
 * @param {Element} control
 * @param {string[]} ids
 */
function setDescribedBy(control, ids) {
  if (ids.length === 0) control.removeAttribute(DESCRIBED_BY);
  else control.setAttribute(DESCRIBED_BY, ids.join(' '));
}

// ---------- C-10 error line under a control ----------

/**
 * Marks the control as wrong and shows the line under it.
 * @param {HTMLElement} control
 * @param {HTMLElement} line
 * @param {string} textKey
 */
export function showFieldError(control, line, textKey) {
  if (line.id === '') throw new Error('an error line needs an id');
  show(line, textKey);
  control.setAttribute('aria-invalid', 'true');
  const ids = describedBy(control);
  if (!ids.includes(line.id)) setDescribedBy(control, [...ids, line.id]);
}

/**
 * @param {HTMLElement} control
 * @param {HTMLElement} line
 */
export function clearFieldError(control, line) {
  hide(line);
  control.removeAttribute('aria-invalid');
  setDescribedBy(control, describedBy(control).filter((id) => id !== line.id));
}

// ---------- C-10 error band ----------

/**
 * Shows a load or save failure. The band keeps its role="alert" from the HTML.
 * @param {HTMLElement} band
 * @param {string} textKey
 */
export function showErrorBand(band, textKey) {
  show(band, textKey);
}

/** @param {HTMLElement} band */
export function hideErrorBand(band) {
  hide(band);
}

// ---------- C-14 saved notice ----------

/**
 * Shows the notice. It stays until the screen hides it at the next edit. Focus does not move.
 * @param {HTMLElement} notice
 * @param {string} textKey
 */
export function showSavedNotice(notice, textKey) {
  show(notice, textKey);
}

/** @param {HTMLElement} notice */
export function hideSavedNotice(notice) {
  hide(notice);
}

// ---------- C-11 confirm dialog ----------

/** @type {WeakMap<HTMLDialogElement, HTMLElement | null>} */
const dialogOpeners = new WeakMap();

/**
 * Closes the dialog. Focus goes back to the button that opened it unless the screen is about
 * to place focus itself (after a delete, when that button no longer exists).
 * @param {HTMLDialogElement} dialog
 * @param {{ returnFocus?: boolean }} [options]
 */
export function closeConfirmDialog(dialog, { returnFocus = true } = {}) {
  if (dialog.open) dialog.close();
  const opener = dialogOpeners.get(dialog) ?? null;
  dialogOpeners.set(dialog, null);
  if (returnFocus && opener !== null && opener.isConnected) opener.focus();
}

/**
 * Opens the dialog as a modal and puts focus on its cancel button, so that a stray Enter
 * deletes nothing. The cancel button and the Escape key both close it. The screen listens to
 * the delete button itself and calls closeConfirmDialog when its request has an answer.
 * @param {HTMLDialogElement} dialog
 * @param {HTMLElement} opener the button that was pressed
 */
export function openConfirmDialog(dialog, opener) {
  const cancelButton = dialog.querySelector(DIALOG_CANCEL);
  if (cancelButton === null) throw new Error('a confirm dialog needs a data-dialog-cancel button');
  if (!dialogOpeners.has(dialog)) {
    cancelButton.addEventListener('click', () => closeConfirmDialog(dialog));
    dialog.addEventListener('cancel', (event) => {
      event.preventDefault();
      closeConfirmDialog(dialog);
    });
  }
  dialogOpeners.set(dialog, opener);
  dialog.showModal();
  cancelButton.focus();
}

// ---------- C-09 tip button ----------

/**
 * @typedef {object} Tip
 * @property {HTMLButtonElement} button
 * @property {HTMLElement} bubble
 * @property {boolean} hovered
 * @property {boolean | null} openAtPress whether the bubble was open when the pointer went down
 */

/** @type {Set<Tip>} */
const openTips = new Set();
/** @type {WeakSet<Element>} */
const boundTipButtons = new WeakSet();
/** @type {WeakSet<Document>} */
const watchedDocuments = new WeakSet();

/** @param {Tip} tip */
function openTip(tip) {
  tip.bubble.hidden = false;
  tip.button.setAttribute('aria-expanded', 'true');
  openTips.add(tip);
}

/** @param {Tip} tip */
function closeTip(tip) {
  tip.bubble.hidden = true;
  tip.button.setAttribute('aria-expanded', 'false');
  openTips.delete(tip);
}

/**
 * @param {Tip} tip
 * @param {EventTarget | null} target
 */
function isInsideTip(tip, target) {
  return target instanceof Node && (tip.button.contains(target) || tip.bubble.contains(target));
}

/**
 * One listener pair per document: Escape closes every open bubble, and so does a press outside.
 * @param {Document} ownerDocument
 */
function watchDocument(ownerDocument) {
  if (watchedDocuments.has(ownerDocument)) return;
  watchedDocuments.add(ownerDocument);
  ownerDocument.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    for (const tip of [...openTips]) closeTip(tip);
  });
  ownerDocument.addEventListener('pointerdown', (event) => {
    for (const tip of [...openTips]) {
      if (!isInsideTip(tip, event.target)) closeTip(tip);
    }
  });
}

/**
 * @param {HTMLButtonElement} button
 * @param {HTMLElement} bubble
 */
function bindTip(button, bubble) {
  /** @type {Tip} */
  const tip = { button, bubble, hovered: false, openAtPress: null };
  closeTip(tip);

  // Pointing. Touch has no hover: a touch opens and closes by pressing.
  for (const part of [button, bubble]) {
    part.addEventListener('pointerenter', (event) => {
      if (event.pointerType === 'touch') return;
      tip.hovered = true;
      openTip(tip);
    });
    part.addEventListener('pointerleave', (event) => {
      if (event.pointerType === 'touch' || isInsideTip(tip, event.relatedTarget)) return;
      tip.hovered = false;
      if (button.ownerDocument.activeElement !== button) closeTip(tip);
    });
  }

  // Focus.
  button.addEventListener('focus', () => openTip(tip));
  button.addEventListener('blur', () => {
    if (!tip.hovered) closeTip(tip);
  });

  // Pressing toggles. Focus arrives between pointerdown and click and opens the bubble, so the
  // click goes by the state the bubble had when the pointer went down.
  button.addEventListener('pointerdown', () => {
    tip.openAtPress = openTips.has(tip);
  });
  button.addEventListener('click', () => {
    const wasOpen = tip.openAtPress ?? openTips.has(tip);
    tip.openAtPress = null;
    if (wasOpen) closeTip(tip);
    else openTip(tip);
  });
}

/**
 * Connects every tip button under root to its bubble. Calling it twice binds nothing twice.
 * @param {Document | Element} [root]
 */
export function bindTooltips(root = document) {
  for (const button of root.querySelectorAll(`button[${DESCRIBED_BY}]`)) {
    if (boundTipButtons.has(button)) continue;
    const bubble = describedBy(button)
      .map((id) => button.ownerDocument.getElementById(id))
      .find((element) => element !== null && element.getAttribute('role') === 'tooltip');
    if (bubble === undefined) continue;
    boundTipButtons.add(button);
    watchDocument(button.ownerDocument);
    bindTip(button, bubble);
  }
}
