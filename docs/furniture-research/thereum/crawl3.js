// Read-only: per-product add-on (추가구성상품) option data + product meta for the catalog DB.
const fs = require('fs');
const OUT = process.argv[2];
const P = require(OUT + '/products.json');
const UA = 'Mozilla/5.0 (analysis; read-only)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const un = (s) => s.replace(/\\(["\\])/g, '$1');

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
const jstr = (h, name) => { const m = h.match(new RegExp(name + "\\s*=\\s*'([\\s\\S]*?)'\\s*;")); return m ? m[1] : null; };
const num = (h, name) => { const m = h.match(new RegExp('var\\s+' + name + "\\s*=\\s*'?(\\d+(?:\\.\\d+)?)'?")); return m ? Number(m[1]) : null; };

function parse(id, h) {
  const o = { product_no: id };
  o.product_code = (h.match(/var\s+product_code\s*=\s*'([^']*)'/) || h.match(/product_code\s*=\s*'([^']*)'/) || [])[1] || null;
  o.product_price_org = num(h, '_iPrdtPriceOrg');
  o.product_tax = num(h, '_iPrdtPriceTax');
  o.product_sale_price = num(h, 'product_sale_price');
  o.product_price = num(h, 'product_price');
  o.mileage = (h.match(/mileage_val\s*=\s*'?([\d.]+)/) || [])[1] || null;
  o.product_min = (h.match(/product_min\s*=\s*'?(\d+)/) || [])[1] || null;
  o.product_max = (h.match(/product_max\s*=\s*'?(-?\d+)/) || [])[1] || null;
  o.option_type = (h.match(/var option_type\s*=\s*'([^']*)'/) || [])[1] || null;
  o.option_name_mapper = (h.match(/option_name_mapper\s*=\s*'([^']*)'/) || [])[1] || null;
  const add = jstr(h, 'add_option_data');
  o.addons = [];
  if (add) {
    try {
      const d = JSON.parse(un(add));
      for (const [ano, a] of Object.entries(d)) {
        const rec = {
          add_product_no: Number(ano), name: a.product_name, product_code: a.product_code, has_option: a.has_option,
          product_price: a.product_price, product_sale_price: a.product_sale_price, min: a.product_min, max: a.product_max,
          is_display: a.is_display, is_soldout: a.is_soldout, option_type: a.option_type, item_type: a.item_type, items: [],
        };
        let osd = a.option_stock_data;
        if (typeof osd === 'string') { try { osd = JSON.parse(osd); } catch { osd = null; } }
        if (osd) {
          for (const [code, v] of Object.entries(osd)) {
            rec.items.push({
              item_code: code, option_id: v.option_id, option_name: v.option_name, option_value: v.option_value,
              level_names: v.option_name_original, level_values: v.option_value_orginal,
              option_price: v.option_price, stock_price: v.stock_price, use_stock: v.use_stock, stock_number: v.stock_number,
              use_soldout: v.use_soldout, is_display: v.is_display, is_selling: v.is_selling, is_mandatory: v.is_mandatory,
              is_auto_soldout: v.is_auto_soldout,
            });
          }
        }
        o.addons.push(rec);
      }
    } catch (e) { o.addon_parse_error = String(e).slice(0, 120); }
  }
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
      res.push(r.status === 200 ? parse(id, r.text) : { product_no: id, error: r.status });
      if (++done % 100 === 0) console.log('done', done, '/', ids.length);
      await sleep(100);
    }
  }
  await Promise.all([worker(), worker(), worker(), worker()]);
  res.sort((a, b) => a.product_no - b.product_no);
  fs.writeFileSync(OUT + '/addons-raw.json', JSON.stringify(res));
  console.log('written', res.length, 'errors', res.filter((x) => x.error).length, 'parse errors', res.filter((x) => x.addon_parse_error).length);
})();
