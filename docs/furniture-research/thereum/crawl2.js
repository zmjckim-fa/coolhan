// Read-only: per-product configurator asset inventory (data-* attributes) + SEO/structured-data markers.
const fs = require('fs');
const OUT = process.argv[2];
const P = require(OUT + '/products.json');
const UA = 'Mozilla/5.0 (analysis; read-only)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const dec = (s) => s.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');

async function get(url) {
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(url, { headers: { 'user-agent': UA } });
      if (!r.ok) return { status: r.status, text: '' };
      return { status: r.status, text: await r.text() };
    } catch (e) { await sleep(500 * (i + 1)); }
  }
  return { status: 0, text: '' };
}

function inspect(id, h) {
  const o = { id, html_bytes: Buffer.byteLength(h) };
  const i = h.indexOf('data-catalog-viewer');
  o.has_viewer = i >= 0;
  if (i >= 0) {
    const st = h.lastIndexOf('<div', i);
    const en = h.indexOf('>', i);
    const tag = h.slice(st, en + 1);
    const a = (n) => { const m = tag.match(new RegExp(' ' + n + '="([^"]*)"')); return m ? dec(m[1]) : null; };
    const j = (n) => { try { return JSON.parse(a(n)); } catch { return null; } };
    const assets = j('data-assets') || {};
    o.asset_keys = Object.keys(assets).length;
    o.asset_urls = Object.values(assets);
    o.asset_key_names = Object.keys(assets);
    const colors = j('data-colors'); o.colors = colors ? colors.length : null;
    const th = j('data-thumbnails'); o.thumbs = th ? Object.keys(th).length : null;
    o.thumb_urls = th ? Object.values(th) : [];
    const bases = j('data-bases'); o.bases = bases ? bases.map((b) => [b[0], b[2]]) : null;
    o.dimensions = j('data-dimensions');
    o.initial_color = a('data-initial-color');
    o.inserts = (h.slice(i, i + 30000).match(/data-catalog-inserts="([^"]*)"/) || [])[1] ? true : false;
  }
  o.nneditor_imgs = (h.match(/web\/upload\/NNEditor\/[^"'\s)]+/g) || []).length;
  o.img_tags = (h.match(/<img\b/g) || []).length;
  o.alt_missing = (h.match(/<img\b(?![^>]*\balt=)[^>]*>/g) || []).length;
  o.alt_empty = (h.match(/<img\b[^>]*\balt=""[^>]*>/g) || []).length;
  return o;
}

(async () => {
  const ids = P.map((p) => p.id);
  const res = [];
  let next = 0, done = 0;
  async function worker() {
    while (next < ids.length) {
      const id = ids[next++];
      const r = await get(`https://thereum.co.kr/product/detail.html?product_no=${id}`);
      res.push(r.status === 200 ? inspect(id, r.text) : { id, error: r.status });
      if (++done % 100 === 0) console.log('done', done, '/', ids.length);
      await sleep(100);
    }
  }
  await Promise.all([worker(), worker(), worker(), worker()]);
  res.sort((a, b) => a.id - b.id);
  fs.writeFileSync(OUT + '/assets-inventory.json', JSON.stringify(res));
  console.log('written', res.length);
})();
