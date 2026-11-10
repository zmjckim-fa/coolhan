// Builds thereum_catalog.sqlite from the read-only crawl outputs (products.json, addons-raw.json, assets-inventory.json).
// Run: node build-db.js   (Node >= 22.5 for node:sqlite)
const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const DIR = __dirname;
const P = require('./products.json');
const AD = require('./addons-raw.json');
const AS = require('./assets-inventory.json');
const DS = require('./descriptions-raw.json');
const DBFILE = path.join(DIR, 'thereum_catalog.sqlite');
if (fs.existsSync(DBFILE)) fs.unlinkSync(DBFILE);
const db = new DatabaseSync(DBFILE);

db.exec(`
PRAGMA foreign_keys = ON;
CREATE TABLE brands (brand_id INTEGER PRIMARY KEY, name_ko TEXT NOT NULL UNIQUE, name_en TEXT);
CREATE TABLE categories (cate_no INTEGER PRIMARY KEY, name TEXT NOT NULL, kind TEXT NOT NULL);  -- kind: delivery | size | type | all
CREATE TABLE products (
  product_no INTEGER PRIMARY KEY,
  product_code TEXT,                 -- Cafe24 code, e.g. P0000FKG
  name TEXT NOT NULL,                -- 정식 상품명 "{구성} {종류}" (태그 없음, 규칙: names.js)
  name_base TEXT NOT NULL,           -- name without [국내재고]/[입고예정] tag
  tag TEXT,                          -- 국내재고 | 입고예정 | B급 | NULL
  brand_id INTEGER REFERENCES brands(brand_id),
  fulfilment TEXT NOT NULL,          -- made_to_order | domestic_stock | refurbished | table
  lead_time_text TEXT,
  consumer_price INTEGER,            -- 소비자가(KRW, VAT 포함)
  price INTEGER NOT NULL,            -- 판매가(KRW)
  best_price INTEGER,                -- 최적할인가(무통장 4% 적용가, 사이트 표기)
  kind TEXT,                         -- grid | table | side_table | trolley | storage_box | sofa_table | tv | other
  grid_cols INTEGER, grid_rows INTEGER,
  panel_mode TEXT,                   -- doors | no_doors | open | custom
  has_color_option INTEGER NOT NULL,
  min_qty INTEGER, max_qty INTEGER,
  source_url TEXT,
  desc_title TEXT,                   -- 상품 소개 제목(상세페이지 소개 블록)
  description TEXT,                  -- 상품 소개 문단(문단은 빈 줄로 구분). 출처 사이트 원문 - 게시 전 자체 문구로 바꿔 쓸 것
  description_source TEXT            -- tv-intro | prdDetail-first-block | NULL(사이트에 설명 없음)
);
CREATE TABLE product_categories (product_no INTEGER REFERENCES products(product_no), cate_no INTEGER REFERENCES categories(cate_no), PRIMARY KEY (product_no, cate_no));
CREATE TABLE colors (color_id INTEGER PRIMARY KEY, name_ko TEXT NOT NULL UNIQUE, hex TEXT, viewer_code TEXT);
CREATE TABLE product_colors (  -- 필수 옵션 '색상' 1건 = 판매 SKU 1건
  item_code TEXT PRIMARY KEY, product_no INTEGER NOT NULL REFERENCES products(product_no),
  option_name TEXT, option_value TEXT NOT NULL, color_id INTEGER REFERENCES colors(color_id),
  lead_note TEXT,                    -- '5주 소요예정' 등 옵션 이름에 붙은 안내
  unit_price INTEGER,                -- 옵션 선택 시 단가(KRW)
  use_stock INTEGER, stock_number INTEGER, is_display TEXT, is_selling TEXT, use_soldout TEXT
);
CREATE TABLE addon_products (  -- 추가구성상품(부품) 상품
  add_product_no INTEGER PRIMARY KEY, product_code TEXT, name TEXT, option_names TEXT, item_type TEXT, is_display TEXT, scope TEXT  -- scope: parts | inos
);
CREATE TABLE product_addons (product_no INTEGER REFERENCES products(product_no), add_product_no INTEGER REFERENCES addon_products(add_product_no), PRIMARY KEY (product_no, add_product_no));
CREATE TABLE addon_options (  -- 추가구성상품의 선택 항목(옵션→상세) 1건 = 가격 1건
  item_code TEXT PRIMARY KEY, add_product_no INTEGER NOT NULL REFERENCES addon_products(add_product_no),
  level1_name TEXT, level1_value TEXT, level2_name TEXT, level2_value TEXT,
  unit_price INTEGER NOT NULL, use_stock INTEGER, stock_number INTEGER, is_display TEXT, is_selling TEXT, is_mandatory TEXT
);
CREATE TABLE viewer_assets (product_no INTEGER REFERENCES products(product_no), asset_key TEXT, color_code TEXT, view_kind TEXT, url TEXT, PRIMARY KEY (product_no, asset_key));
CREATE TABLE viewer_bases (product_no INTEGER REFERENCES products(product_no), base_code TEXT, label TEXT, extra_price INTEGER, PRIMARY KEY (product_no, base_code));
CREATE TABLE viewer_dimensions (product_no INTEGER REFERENCES products(product_no), base_mode TEXT, width_mm INTEGER, height_mm INTEGER, depth_mm INTEGER, PRIMARY KEY (product_no, base_mode));
CREATE INDEX idx_pc_product ON product_colors(product_no);
CREATE INDEX idx_ao_add ON addon_options(add_product_no);
CREATE INDEX idx_products_kind ON products(kind, grid_cols, grid_rows, panel_mode);
`);

const BRAND_PREFIX = 'USM Haller/유에스엠 할러 - ';
const brandId = db.prepare('INSERT INTO brands(name_ko, name_en) VALUES (?, ?) RETURNING brand_id').get('유에스엠 할러', 'USM Haller').brand_id;

const CATS = [[81, 'USM 일반배송', 'delivery'], [82, 'USM 빠른배송', 'delivery'], [83, '테이블', 'type'], [34, '리퍼브', 'type'], [85, '가로1단', 'size'], [86, '가로2단', 'size'], [88, '가로3단', 'size'], [89, '가로4단~', 'size'], [84, 'Size(전체)', 'all']];
const catByName = new Map(CATS.map(([n, name]) => [name, n]));
const insCat = db.prepare('INSERT INTO categories VALUES (?,?,?)');
for (const c of CATS) insCat.run(...c);

const num = (v) => { const n = Number(String(v ?? '').replace(/[^\d.-]/g, '')); return Number.isFinite(n) && String(v ?? '').trim() !== '' ? Math.round(n) : null; };
const adMap = new Map(AD.map((a) => [a.product_no, a]));
const asMap = new Map(AS.map((a) => [a.id, a]));

function classify(base) {
  const g = base.match(/^(\d+)x(\d+)(.*)$/);
  let kind = 'other', cols = null, rows = null, mode = 'custom';
  if (g) {
    kind = 'grid'; cols = +g[1]; rows = +g[2];
    const rest = g[3].trim();
    if (rest === '') mode = 'doors';
    else if (/^\(도어없음\)$/.test(rest)) mode = 'no_doors';
    else if (/^\(오픈\)$/.test(rest)) mode = 'open';
  } else if (/^Table/i.test(base)) kind = 'table';
  else if (/협탁/.test(base)) kind = 'side_table';
  else if (/트롤리/.test(base)) kind = 'trolley';
  else if (/소파테이블/.test(base)) kind = 'sofa_table';
  else if (/티비|TV/i.test(base)) kind = 'tv';
  else if (/Storage Box/i.test(base)) kind = 'storage_box';
  return { kind, cols, rows, mode };
}

const insColor = db.prepare('INSERT OR IGNORE INTO colors(name_ko, hex, viewer_code) VALUES (?,?,?)');
const getColor = db.prepare('SELECT color_id FROM colors WHERE name_ko = ?');
function color(name, hex, code) { insColor.run(name, hex ?? null, code ?? null); return getColor.get(name).color_id; }

const insProd = db.prepare('INSERT INTO products VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
// 설명 정리: 이미지 캡션(Detail/Front/Side/...)과 마크업 조각은 설명이 아니다. 'Size' 제목은 '크기' 문단으로 바꾼다.
const JUNK = /^(Detail|Front|Side|Back|Left|Right|Top|Bottom|<.*|id=.*)$/i;
function cleanDesc(d) {
  if (!d || !d.paragraphs) return { title: null, paras: [] };
  let title = d.title && !JUNK.test(d.title) ? d.title : null;
  let paras = d.paragraphs.filter((l) => l && !JUNK.test(l));
  if (title === 'Size') { title = null; if (paras.length) paras[0] = '크기: ' + paras[0]; }
  return { title, paras };
}
const dsMap = new Map(DS.map((d) => [d.product_no, { ...d, ...(() => { const c = cleanDesc(d); return { title: c.title, paragraphs: c.paras }; })() }]));
const insPC = db.prepare('INSERT INTO product_categories VALUES (?,?)');
const insCol = db.prepare('INSERT INTO product_colors VALUES (?,?,?,?,?,?,?,?,?,?,?,?)');
const insAddon = db.prepare('INSERT OR IGNORE INTO addon_products VALUES (?,?,?,?,?,?,?)');
const insPA = db.prepare('INSERT OR IGNORE INTO product_addons VALUES (?,?)');
const insAO = db.prepare('INSERT OR REPLACE INTO addon_options VALUES (?,?,?,?,?,?,?,?,?,?,?,?)');
const insAsset = db.prepare('INSERT OR IGNORE INTO viewer_assets VALUES (?,?,?,?,?)');
const insBase = db.prepare('INSERT OR IGNORE INTO viewer_bases VALUES (?,?,?,?)');
const insDim = db.prepare('INSERT OR IGNORE INTO viewer_dimensions VALUES (?,?,?,?,?)');
const BASE_LABEL = { glides: '기본 발', hard_all_locking: '고정형 바퀴 4개', hard_mixed: '고정형 2개 + 일반형 2개', hard_all_free: '일반형 바퀴 4개' };

db.exec('BEGIN');
for (const p of P) {
  const name = p.name.replace(BRAND_PREFIX, '');
  const tagM = name.match(/^\[(국내재고|입고예정|B급)\]\s*/);
  const tag = tagM ? tagM[1] : (/^\[B급\]/.test(name) ? 'B급' : null);
  const baseName = name.replace(/^\[(국내재고|입고예정)\]\s*/, '').trim();
  const cl = classify(baseName.replace(/^\[B급\]\s*/, ''));
  const cats = p.categories || [];
  const fulfil = cats.includes('리퍼브') ? 'refurbished' : cats.includes('USM 빠른배송') ? 'domestic_stock' : cats.includes('USM 일반배송') ? 'made_to_order' : cats.includes('테이블') ? 'table' : 'other';
  const ad = adMap.get(p.id) || {};
  const pcode = (p.has_main_option && p.option_combinations[0]) ? p.option_combinations[0].code.slice(0, 8) : ad.product_code;
  insProd.run(p.id, pcode, name, baseName, tag, brandId, fulfil,
    p.info['배송기간'] || null, num(p.info['소비자가']), p.price, num(p.info['최적할인가']), cl.kind, cl.cols, cl.rows, cl.mode,
    p.has_main_option ? 1 : 0, num(ad.product_min), num(ad.product_max), p.url,
    (dsMap.get(p.id) && dsMap.get(p.id).paragraphs.length) ? dsMap.get(p.id).title : null,
    (dsMap.get(p.id) && dsMap.get(p.id).paragraphs.length) ? dsMap.get(p.id).paragraphs.join('\n\n') : null,
    (dsMap.get(p.id) && dsMap.get(p.id).paragraphs.length) ? dsMap.get(p.id).method : null);
  for (const c of cats) if (catByName.has(c)) insPC.run(p.id, catByName.get(c));
  if (!p.has_main_option) {
    // 색상 옵션이 없는 상품(리퍼브 B급 등): 판매 단위는 상품 자체 1건. 사이트가 item_code를 노출하지 않아 합성 키를 쓴다.
    insCol.run(pcode + '#default', p.id, null, '(옵션 없음)', color('(옵션 없음)', null, null), null, p.price, 0, null, 'T', 'T', null);
  }
  for (const o of (p.has_main_option ? p.option_combinations : [])) {
    const val = o.option_value || '';
    const note = (val.match(/\(([^)]*소요[^)]*)\)/) || [])[1] || null;
    const clean = val.replace(/\([^)]*소요[^)]*\)/, '').trim();
    const cid = color(clean, null, null);
    insCol.run(o.code, p.id, o.option_name || null, val, cid, note, num(o.option_price), o.use_stock ? 1 : 0, num(o.stock_number), o.is_display || null, o.is_selling || null, o.use_soldout || null);
  }
  const a = asMap.get(p.id);
  if (a && a.has_viewer) {
    for (const [i, key] of a.asset_key_names.entries()) {
      const m = key.match(/^(\w+?)-(.+)$/);
      insAsset.run(p.id, key, m ? m[1] : null, m ? m[2] : key, a.asset_urls[i]);
    }
    for (const b of a.bases || []) insBase.run(p.id, b[0], BASE_LABEL[b[0]] || b[0], b[1]);
    if (a.dimensions) for (const [mode, d] of Object.entries(a.dimensions)) insDim.run(p.id, mode, d[0], d[1], d[2]);
  }
  for (const add of ad.addons || []) {
    const scope = /이노스/.test(add.name || '') ? 'inos' : 'parts';
    const optNames = add.items[0] ? (add.items[0].level_names || []).join(' > ') : null;
    insAddon.run(add.add_product_no, add.product_code, add.name, optNames, add.item_type ?? null, add.is_display == null ? null : (add.is_display ? 'T' : 'F'), scope);
    insPA.run(p.id, add.add_product_no);
    for (const it of add.items) {
      const lv = it.level_values || [], ln = it.level_names || [];
      insAO.run(it.item_code, add.add_product_no, ln[0] ?? null, lv[0] ?? null, ln[1] ?? null, lv[1] ?? null, num(it.option_price) ?? 0, it.use_stock ? 1 : 0, num(it.stock_number), it.is_display ?? null, it.is_selling ?? null, it.is_mandatory ?? null);
    }
  }
}
db.exec('COMMIT');

// 회원 전용 상품 32개(CUSTOM ORDER 카테고리 35, 로그인한 회원 세션에서 읽음). 고객 식별 정보는 없음.
db.exec("ALTER TABLE products ADD COLUMN access TEXT NOT NULL DEFAULT 'public'");
db.prepare('INSERT INTO categories VALUES (?,?,?)').run(35, 'CUSTOM ORDER (회원 전용)', 'custom');
const insMem = db.prepare(`INSERT INTO products (product_no, product_code, name, name_base, tag, brand_id, fulfilment, lead_time_text, consumer_price, price, best_price, kind, grid_cols, grid_rows, panel_mode, has_color_option, min_qty, max_qty, source_url, desc_title, description, description_source, access)
  VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
db.exec('BEGIN');
for (const line of fs.readFileSync(path.join(DIR, 'members32.txt'), 'utf8').trim().split('\n')) {
  const [no, rawName, price, , best, lead] = line.split('|');
  const name = rawName.replace(/^자체브랜드 - /, '');
  const base = name.replace(/^\[빠른배송\]\s*/, '').trim();
  const ext = /확장시공/.test(base);
  insMem.run(+no, null, name, base, ext ? '확장시공' : '맞춤 구성', brandId, 'domestic_stock', lead || null, null, +price, +best, ext ? 'extension_work' : 'custom_order', null, null, 'custom', 0, 1, 0, 'https://thereum.co.kr/product/detail.html?product_no=' + no, null, null, null, 'members_only');
  insCol.run('M' + no + '#default', +no, null, '(옵션 없음)', color('(옵션 없음)', null, null), null, +price, 0, null, 'T', 'T', null);
  insPC.run(+no, 35);
  if (+no !== 2379) insPA.run(+no, 1644); // 이노스 5칸(국내재고) +344,000 — 상품 페이지의 추가구성상품(표시 14색)
}
db.exec('COMMIT');

// 정식 상품명: 사이트 표기(name_site)는 구성 코드만 있는 경우가 많아 "{구성} {종류}" 형태의 name을 따로 만든다(규칙: names.js).
const NAMES = require('./names');
db.exec('ALTER TABLE products ADD COLUMN name_site TEXT');
db.exec('ALTER TABLE products ADD COLUMN name_display TEXT');
const updName = db.prepare('UPDATE products SET name_site = ?, name = ?, name_display = ? WHERE product_no = ?');
db.exec('BEGIN');
for (const r of db.prepare('SELECT product_no, name FROM products').all()) {
  const pn = NAMES.properName(r.name);
  updName.run(r.name, pn.name, NAMES.display(pn), r.product_no);
}
db.exec('COMMIT');

// colors: hex + viewer code come from the configurator's data-colors (14 standard colors, identical on every viewer page)
for (const c of require('./colors.json')) db.prepare('UPDATE colors SET hex = ?, viewer_code = ? WHERE name_ko = ?').run(c.hex, c.code, c.name);

// views
db.exec(`
CREATE VIEW v_product_price_summary AS
SELECT p.product_no, p.name, p.fulfilment, p.price, COUNT(c.item_code) AS color_skus, MIN(c.unit_price) AS min_color_price, MAX(c.unit_price) AS max_color_price
FROM products p LEFT JOIN product_colors c ON c.product_no = p.product_no GROUP BY p.product_no;
CREATE VIEW v_sellable_sku AS
SELECT c.item_code, p.product_no, p.name, c.option_value AS color, c.lead_note, c.unit_price
FROM product_colors c JOIN products p ON p.product_no = c.product_no WHERE c.is_display = 'T' AND c.is_selling = 'T';
CREATE VIEW v_addon_catalog AS
SELECT pa.product_no, ap.add_product_no, ap.name AS addon_product, ao.level1_value, ao.level2_value, ao.unit_price, ao.item_code
FROM product_addons pa JOIN addon_products ap ON ap.add_product_no = pa.add_product_no JOIN addon_options ao ON ao.add_product_no = ap.add_product_no
WHERE ao.is_display = 'T' AND ao.is_selling = 'T';  -- 사이트에 실제로 표시·판매되는 항목만(숨김 템플릿 행 제외)
`);

const q = (sql) => db.prepare(sql).get();
const stats = {
  brands: q('SELECT COUNT(*) n FROM brands').n, categories: q('SELECT COUNT(*) n FROM categories').n,
  products: q('SELECT COUNT(*) n FROM products').n, product_categories: q('SELECT COUNT(*) n FROM product_categories').n,
  colors: q('SELECT COUNT(*) n FROM colors').n, product_colors: q('SELECT COUNT(*) n FROM product_colors').n,
  addon_products: q('SELECT COUNT(*) n FROM addon_products').n, product_addons: q('SELECT COUNT(*) n FROM product_addons').n,
  addon_options: q('SELECT COUNT(*) n FROM addon_options').n, viewer_assets: q('SELECT COUNT(*) n FROM viewer_assets').n,
  viewer_bases: q('SELECT COUNT(*) n FROM viewer_bases').n, viewer_dimensions: q('SELECT COUNT(*) n FROM viewer_dimensions').n,
};
console.log(JSON.stringify(stats, null, 1));
fs.writeFileSync(path.join(DIR, 'db-stats.json'), JSON.stringify(stats, null, 1));
db.close();
