// Read-only crawl of thereum.co.kr public pages (category lists + product detail pages).
const fs = require('fs');
const path = require('path');
const BASE = 'https://thereum.co.kr';
const OUT = process.argv[2];
fs.mkdirSync(OUT, { recursive: true });
const UA = 'Mozilla/5.0 (analysis; read-only)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url, tries = 3) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url, { headers: { 'user-agent': UA }, redirect: 'follow' });
      if (!r.ok) return { status: r.status, text: '' };
      return { status: r.status, text: await r.text() };
    } catch (e) {
      await sleep(500 * (i + 1));
    }
  }
  return { status: 0, text: '' };
}
const dec = (s) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ');
const strip = (s) => dec(s.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();

const LISTS = [
  { key: 'USM 일반배송', url: (p) => `/product/list_thumb.html?cate_no=81&page=${p}` },
  { key: 'USM 빠른배송', url: (p) => `/product/list_thumb.html?cate_no=82&page=${p}` },
  { key: '테이블', url: (p) => `/product/list_thumb.html?cate_no=83&page=${p}` },
  { key: '리퍼브', url: (p) => `/product/list_thumb.html?cate_no=34&page=${p}` },
  { key: '가로1단', url: (p) => `/category/%EA%B0%80%EB%A1%9C1%EB%8B%A8/85/?page=${p}` },
  { key: '가로2단', url: (p) => `/category/%EA%B0%80%EB%A1%9C2%EB%8B%A8/86/?page=${p}` },
  { key: '가로3단', url: (p) => `/category/%EA%B0%80%EB%A1%9C3%EB%8B%A8/88/?page=${p}` },
  { key: '가로4단~', url: (p) => `/category/%EA%B0%80%EB%A1%9C4%EB%8B%A8/89/?page=${p}` },
];

function parseListIds(html) {
  const ids = new Map();
  const re = /href="(\/product\/([^"\/]+)\/(\d+)\/[^"]*)"/g;
  let m;
  while ((m = re.exec(html))) ids.set(m[3], m[2]);
  return ids;
}

function parseProduct(id, h) {
  const g = (re) => { const m = h.match(re); return m ? dec(m[1]) : null; };
  const out = { id: Number(id) };
  out.name = g(/<meta property="og:title" content="([^"]*)"/);
  out.price = Number(g(/<meta property="product:price:amount" content="([^"]*)"/)) || null;
  out.product_price_var = Number(g(/product_price\s*=\s*'(\d+)'/)) || null;
  out.price_text = (() => { const m = h.match(/id="span_product_price_text"[^>]*>([^<]*)</); return m ? m[1].trim() : null; })();
  out.description = g(/<meta property="og:description" content="([^"]*)"/);
  out.image = g(/<meta property="og:image" content="([^"]*)"/);
  out.url = g(/<meta property="og:url" content="([^"]*)"/);
  out.is_soldout_flag = (h.match(/is_soldout\s*=\s*'([^']*)'/) || [])[1] || null;
  out.product_code = (h.match(/product_code\s*=\s*'([^']*)'/) || [])[1] || null;
  // summary table (brand / lead time / delivery / options like "배송기간")
  const rows = {};
  const trRe = /<tr[^>]*>\s*<th[^>]*>([\s\S]*?)<\/th>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<\/tr>/g;
  let m;
  while ((m = trRe.exec(h))) {
    const k = strip(m[1]);
    const v = strip(m[2]);
    if (k && v && k.length < 20 && !(k in rows)) rows[k] = v.slice(0, 200);
  }
  out.info = rows;
  // option_stock_data (per combination price/stock)
  const sm = h.match(/option_stock_data\s*=\s*'([\s\S]*?)'\s*;/);
  out.option_combinations = [];
  if (sm) {
    try {
      const raw = sm[1].replace(/\\(["\\])/g, '$1');
      const data = JSON.parse(raw);
      for (const [code, v] of Object.entries(data)) {
        out.option_combinations.push({
          code,
          option_name: v.option_name,
          option_value: v.option_value,
          option_price: v.option_price,
          stock_price: v.stock_price,
          use_stock: v.use_stock,
          stock_number: v.stock_number,
          use_soldout: v.use_soldout,
          is_display: v.is_display,
          is_selling: v.is_selling,
          is_auto_soldout: v.is_auto_soldout,
        });
      }
    } catch (e) {
      out.option_parse_error = String(e).slice(0, 120);
    }
  }
  // select boxes (main options + add-product options)
  out.selects = [];
  const selRe = /<select\b([^>]*)>([\s\S]*?)<\/select>/g;
  while ((m = selRe.exec(h))) {
    const attrs = m[1];
    const a = (n) => { const x = attrs.match(new RegExp(n + '="([^"]*)"')); return x ? dec(x[1]) : null; };
    if (!a('option_title') && !a('option_product_no')) continue;
    const opts = [];
    const oRe = /<option\b([^>]*)>([\s\S]*?)<\/option>/g;
    let o;
    while ((o = oRe.exec(m[2]))) {
      const val = (o[1].match(/value="([^"]*)"/) || [])[1];
      const t = strip(o[2]);
      if (!t || /^[-\s]*(\[필수\])?\s*옵션을 선택|^[-]+$/.test(t)) continue;
      opts.push({ value: val, text: t });
    }
    out.selects.push({
      product_no: a('option_product_no'),
      title: a('option_title'),
      product_type: a('product_type'),
      sort_no: a('option_sort_no'),
      required: a('required'),
      options: opts,
    });
  }
  out.has_main_option = out.selects.some((s) => s.product_type === 'product_option');
  out.main_option_titles = out.selects.filter((s) => s.product_type === 'product_option').map((s) => s.title);
  out.add_option_groups = [...new Set(out.selects.filter((s) => s.product_type === 'addproduct_option').map((s) => s.title + '#' + s.product_no))];
  out.detail_text_len = strip((h.match(/id="prdDetail"[\s\S]*?<\/div>/) || [''])[0]).length;
  out.image_count = (h.match(/<img\b/g) || []).length;
  return out;
}

(async () => {
  const lists = {};
  const prod = new Map(); // id -> { slug, cats:Set }
  for (const L of LISTS) {
    lists[L.key] = [];
    for (let p = 1; p <= 60; p++) {
      const r = await get(BASE + L.url(p));
      if (r.status !== 200) { lists[L.key + '_status'] = r.status; break; }
      const ids = parseListIds(r.text);
      const fresh = [...ids.keys()].filter((i) => !lists[L.key].includes(i));
      if (!fresh.length) break;
      fresh.forEach((i) => { lists[L.key].push(i); if (!prod.has(i)) prod.set(i, { slug: ids.get(i), cats: new Set() }); prod.get(i).cats.add(L.key); });
      await sleep(150);
    }
    console.log('list', L.key, lists[L.key].length);
  }
  fs.writeFileSync(path.join(OUT, 'lists.json'), JSON.stringify(lists, null, 1));
  const ids = [...prod.keys()];
  console.log('unique products', ids.length);
  const results = [];
  let next = 0, done = 0;
  async function worker() {
    while (next < ids.length) {
      const id = ids[next++];
      const r = await get(`${BASE}/product/detail.html?product_no=${id}`);
      if (r.status !== 200) results.push({ id: Number(id), error: 'http ' + r.status });
      else {
        const p = parseProduct(id, r.text);
        p.slug = prod.get(id).slug;
        p.categories = [...prod.get(id).cats];
        results.push(p);
      }
      if (++done % 50 === 0) console.log('products', done, '/', ids.length);
      await sleep(120);
    }
  }
  await Promise.all([worker(), worker(), worker(), worker()]);
  results.sort((a, b) => a.id - b.id);
  fs.writeFileSync(path.join(OUT, 'products.json'), JSON.stringify(results, null, 1));
  console.log('written', results.length);
})();
