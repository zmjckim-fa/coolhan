/**
 * CoolHan shared markdown helpers (S8 공용 라이브러리 — one place for table/section parsing).
 * New scripts call these; existing scripts migrate the day they are touched (§4-d).
 */

/** Cells of one `| a | b |` row, trimmed, without the outer empties. */
function cellsOf(line) { return line.trim().split('|').slice(1, -1).map(c => c.trim()); }

/** `|---|:--:|` separator row? */
function isSeparator(line) { return /^\|[\s:|-]+\|$/.test(line.trim()); }

/** Markdown → { headingText: [{n, text}] }; text before the first heading is under `_top`. */
function sections(md) {
  const out = { _top: [] }; let cur = '_top';
  md.split(/\r?\n/).forEach((line, i) => {
    const h = /^#{1,6}\s+(.+?)\s*$/.exec(line);
    if (h) { cur = h[1]; out[cur] = out[cur] || []; return; }
    out[cur].push({ n: i + 1, text: line });
  });
  return out;
}

/** First section whose heading matches `re`, else null. */
function findSection(secs, re) { const k = Object.keys(secs).find(k => re.test(k)); return k ? secs[k] : null; }

/**
 * Parse the first table in `lines` ([{n,text}]) whose header matches ≥ `min` of the wanted columns.
 * wanted = { key: /header regex/ } → { header: {key: colIndex}, rows: [{ n, key: value }] }
 */
function parseTable(lines, wanted, min = 2) {
  const rows = []; let idx = null;
  for (const { n, text } of lines) {
    if (!text.trim().startsWith('|') || isSeparator(text)) continue;
    const cells = cellsOf(text);
    if (!idx) {
      const lower = cells.map(c => c.toLowerCase());
      const cand = {};
      for (const [key, re] of Object.entries(wanted)) cand[key] = lower.findIndex(c => re.test(c));
      if (Object.values(cand).filter(v => v >= 0).length >= min) idx = cand;
      continue;
    }
    const row = { n };
    for (const [key, i] of Object.entries(idx)) row[key] = i >= 0 ? (cells[i] || '') : '';
    rows.push(row);
  }
  return { rows, header: idx };
}

/**
 * Every table in `lines` ([{n,text}]) as { header: [cells], headerLine, rows: [{ n, cells }] }.
 * A table is a run of consecutive `|` lines; its first row is the header. Lines inside ``` fences
 * are expected to be removed by the caller.
 */
function tablesIn(lines) {
  const out = []; let cur = null;
  for (const { n, text } of lines) {
    if (!text.trim().startsWith('|')) { cur = null; continue; }
    if (isSeparator(text)) continue;
    const cells = cellsOf(text);
    if (!cur) { cur = { header: cells, headerLine: n, rows: [] }; out.push(cur); continue; }
    cur.rows.push({ n, cells });
  }
  return out;
}

/** Lines of a markdown text as [{n,text}] with fenced code blocks (```) removed. */
function proseLines(md) {
  const out = []; let fenced = false;
  md.split(/\r?\n/).forEach((text, i) => {
    if (/^\s*(?:```|~~~)/.test(text)) { fenced = !fenced; return; }
    if (!fenced) out.push({ n: i + 1, text });
  });
  return out;
}

module.exports = { cellsOf, isSeparator, sections, findSection, parseTable, tablesIn, proseLines };
