// Read-only: product_no range probe (200 = page exists/gated, 302 = missing/hidden).
const fs = require('fs');
const [A, B] = [Number(process.argv[2]), Number(process.argv[3])];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const found = []; let next = A, done = 0;
async function worker() {
  while (next <= B) {
    const n = next++;
    for (let t = 0; t < 3; t++) {
      try {
        const r = await fetch(`https://thereum.co.kr/product/detail.html?product_no=${n}`, { redirect: 'manual', headers: { 'user-agent': 'Mozilla/5.0 (analysis; read-only)' } });
        if (r.status === 200) { const h = await r.text(); found.push({ n, gated: /일반회원만 구매할 수 있어요/.test(h), og: (h.match(/og:title" content="([^"]*)"/) || [])[1] || null }); } else if (r.body) await r.body.cancel();
        break;
      } catch { await sleep(300 * (t + 1)); }
    }
    if (++done % 1000 === 0) console.log('probed', done);
    await sleep(30);
  }
}
(async () => {
  await Promise.all(Array.from({ length: 6 }, worker));
  found.sort((a, b) => a.n - b.n);
  fs.writeFileSync(`probe-range-${A}-${B}.json`, JSON.stringify(found, null, 1));
  console.log('range', A, B, 'found', found.length, 'gated', found.filter((f) => f.gated).length, 'public', found.filter((f) => !f.gated).length, 'max', found.length ? found[found.length - 1].n : null);
})();
