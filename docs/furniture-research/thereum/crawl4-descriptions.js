// Read-only: per-product description text (the product-specific intro block, not the shared FAQ/guide sections).
const fs = require('fs');
const P = require('./products.json');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const strip = (s) => s.replace(/<style[\s\S]*?<\/style>/g, '').replace(/<script[\s\S]*?<\/script>/g, '')
  .replace(/<br\s*\/?>/g, '\n').replace(/<\/(p|div|li|h\d)>/g, '\n').replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/[ \t]+/g, ' ').replace(/ *\n */g, '\n').replace(/\n{2,}/g, '\n').trim();

function extract(h) {
  const out = { method: null, title: null, paragraphs: [] };
  const intro = h.match(/<section class="tv-intro">([\s\S]*?)<\/section>/);
  if (intro) {
    out.method = 'tv-intro';
    const t = intro[1].match(/<h2[^>]*>([\s\S]*?)<\/h2>/);
    out.title = t ? strip(t[1]) : null;
    out.paragraphs = [...intro[1].matchAll(/<p class="tv-description">([\s\S]*?)<\/p>/g)].map((m) => strip(m[1])).filter(Boolean);
    return out;
  }
  const i = h.indexOf('id="prdDetail"');
  if (i < 0) return out;
  const j = h.indexOf('id="prdInfo"', i);
  const det = h.slice(i, j > i ? j : i + 80000);
  // 맞춤 모듈(#tv186 등) 또는 일반 에디터 본문: 첫 번째 제목+문단 덩어리만 취한다(색상/시점 컨트롤·공통 FAQ 이전).
  const text = strip(det.replace(/^[^>]*>/, ''));
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const stop = lines.findIndex((l, k) => k > 0 && /^(기준|정면|좌측|우측|상단|색상|Q\.|바퀴로 교체|상단 패널|박스 인서트|USM 정품)/.test(l));
  const body = (stop > 0 ? lines.slice(0, stop) : lines).slice(0, 12);
  if (body.length) { out.method = 'prdDetail-first-block'; out.title = body[0]; out.paragraphs = body.slice(1); }
  return out;
}

(async () => {
  const res = [];
  let next = 0, done = 0;
  async function worker() {
    while (next < P.length) {
      const p = P[next++];
      let h = '';
      for (let t = 0; t < 3 && !h; t++) {
        try { const r = await fetch(`https://thereum.co.kr/product/detail.html?product_no=${p.id}`, { headers: { 'user-agent': 'Mozilla/5.0 (analysis; read-only)' } }); if (r.ok) h = await r.text(); } catch { await sleep(400 * (t + 1)); }
      }
      const og = (h.match(/og:description" content="([^"]*)"/) || [])[1] || null;
      res.push({ product_no: p.id, ...extract(h), og_description: og, fetched: !!h });
      if (++done % 100 === 0) console.log('done', done);
      await sleep(100);
    }
  }
  await Promise.all([worker(), worker(), worker(), worker()]);
  res.sort((a, b) => a.product_no - b.product_no);
  fs.writeFileSync('descriptions-raw.json', JSON.stringify(res, null, 1));
  const m = {}; res.forEach((r) => { m[r.method || 'none'] = (m[r.method || 'none'] || 0) + 1; });
  console.log('written', res.length, m, 'not fetched', res.filter((r) => !r.fetched).length);
})();
