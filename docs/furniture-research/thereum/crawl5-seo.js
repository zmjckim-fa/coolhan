// Read-only: per-product SEO title / meta description / keywords / JSON-LD name (site's own descriptive fields).
const fs = require('fs');
const P = require('./products.json');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const dec = (s) => (s || '').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
(async () => {
  const res = []; let next = 0, done = 0;
  async function worker() {
    while (next < P.length) {
      const p = P[next++]; let h = '';
      for (let t = 0; t < 3 && !h; t++) { try { const r = await fetch(`https://thereum.co.kr/product/detail.html?product_no=${p.id}`, { headers: { 'user-agent': 'Mozilla/5.0 (analysis; read-only)' } }); if (r.ok) h = await r.text(); } catch { await sleep(400 * (t + 1)); } }
      const ld = (h.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/) || [])[1];
      let ldName = null; try { ldName = JSON.parse(ld).name; } catch {}
      res.push({ product_no: p.id, title: dec((h.match(/<title>([^<]*)/) || [])[1]), meta_description: dec((h.match(/<meta name="description" content="([^"]*)"/) || [])[1]), keywords: dec((h.match(/<meta name="keywords" content="([^"]*)"/) || [])[1]), ld_name: ldName, ok: !!h });
      if (++done % 100 === 0) console.log('done', done);
      await sleep(100);
    }
  }
  await Promise.all([worker(), worker(), worker(), worker()]);
  res.sort((a, b) => a.product_no - b.product_no);
  fs.writeFileSync('seo-raw.json', JSON.stringify(res, null, 1));
  console.log('written', res.length, 'not ok', res.filter((r) => !r.ok).length);
})();
