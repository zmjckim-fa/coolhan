/**
 * CoolHan shared template helpers (S8 공용 라이브러리). Templates are data files with `{{name}}` slots; code never
 * carries a sentence of its own (S2). Unknown slots become empty text, never the slot name.
 */

const fs = require('fs');

/** Replace every `{{name}}` with vars[name] (empty when undefined). */
function fill(text, vars = {}) {
  return String(text).replace(/\{\{(\w+)\}\}/g, (_, k) => (vars[k] === undefined || vars[k] === null ? '' : String(vars[k])));
}

/** Read a template file and fill it. */
function render(file, vars) { return fill(fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n'), vars); }

/** Replace the text between two marker lines (markers kept); append a marked block when the markers are absent. */
function upsertBlock(existing, start, end, body, heading = '') {
  const block = `${start}\n${body}\n${end}`;
  const s = existing.indexOf(start), e = existing.indexOf(end);
  if (s >= 0 && e > s) return existing.slice(0, s) + block + existing.slice(e + end.length);
  return `${existing.replace(/\s+$/, '')}\n\n${heading ? heading + '\n\n' : ''}${block}\n`;
}

/** Text between the two marker lines, or null when the block is absent. */
function blockBody(existing, start, end) {
  const s = existing.indexOf(start), e = existing.indexOf(end);
  return s >= 0 && e > s ? existing.slice(s + start.length, e).replace(/^\n|\n$/g, '') : null;
}

/** Remove the marked block (and its heading line when it directly precedes the block); the rest is untouched. */
function removeBlock(existing, start, end, heading = '') {
  const s = existing.indexOf(start), e = existing.indexOf(end);
  if (!(s >= 0 && e > s)) return existing;
  let head = existing.slice(0, s).replace(/\s+$/, '');
  if (heading && head.endsWith(heading)) head = head.slice(0, -heading.length).replace(/\s+$/, '');
  const tail = existing.slice(e + end.length).replace(/^\s+/, '');
  return head + (head && tail ? '\n\n' : head ? '\n' : '') + tail;
}

module.exports = { fill, render, upsertBlock, blockBody, removeBlock };
