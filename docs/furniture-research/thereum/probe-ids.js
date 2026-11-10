// Read-only: which product_no values return a real product page (200) vs redirect (302 = missing/hidden)?
const fs = require('fs');
const have = new Set(require('./products.json').map((p) => p.id));
const MAX = 4200;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const found = [];
let next = 1, done = 0;
async function worker() {
  while (next <= MAX) {
    const n = next++;
    for (let t = 0; t < 3; t++) {
      try {
        const r = await fetch(`https://thereum.co.kr/product/detail.html?product_no=${n}`, { redirect: 'manual', headers: { 'user-agent': 'Mozilla/5.0 (analysis; read-only)' } });
        if (r.status === 200) { found.push(n); await r.arrayBuffer(); } else if (r.body) await r.body.cancel();
        break;
      } catch { await sleep(300 * (t + 1)); }
    }
    if (++done % 500 === 0) console.log('probed', done);
    await sleep(40);
  }
}
(async () => {
  await Promise.all([worker(), worker(), worker(), worker(), worker(), worker()]);
  found.sort((a, b) => a - b);
  const extra = found.filter((n) => !have.has(n));
  const lost = [...have].filter((n) => !found.includes(n));
  const out = { range: [1, MAX], accessible: found.length, in_catalog: found.length - extra.length, accessible_not_in_catalog: extra, catalog_not_accessible: lost };
  fs.writeFileSync('probe-ids.json', JSON.stringify(out, null, 1));
  console.log(JSON.stringify(out).slice(0, 600));
})();
