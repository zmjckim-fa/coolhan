// Cross-checks thereum_catalog.sqlite against the independently parsed page selects (products.json) and the live sample I clicked.
const { DatabaseSync } = require('node:sqlite');
const P = require('./products.json');
const db = new DatabaseSync(__dirname + '/thereum_catalog.sqlite', { readOnly: true });
const one = (sql, ...a) => db.prepare(sql).get(...a);
const all = (sql, ...a) => db.prepare(sql).all(...a);
const results = [];
const check = (name, ok, detail) => { results.push({ name, ok, detail }); console.log((ok ? 'PASS ' : 'FAIL ') + name + (detail ? ' — ' + detail : '')); };

// 1) counts
check('공개 상품 848개 + 회원 전용 32개 = 880개', one("SELECT COUNT(*) n FROM products WHERE access='public'").n === 848 && one("SELECT COUNT(*) n FROM products WHERE access='members_only'").n === 32);
check('모든 상품에 판매 단위(SKU) 1개 이상', one('SELECT COUNT(*) n FROM products p WHERE NOT EXISTS (SELECT 1 FROM product_colors c WHERE c.product_no=p.product_no)').n === 0);
check('FK 무결성', all('PRAGMA foreign_key_check').length === 0);

// 2) 색상 SKU 수 == 페이지 select(색상) 옵션 수
let mism = 0; const bad = [];
for (const p of P) {
  const sel = p.selects.find((s) => s.product_type === 'product_option');
  const expected = sel ? sel.options.length : 1;
  const got = one('SELECT COUNT(*) n FROM product_colors WHERE product_no=?', p.id).n;
  if (expected !== got) { mism++; if (bad.length < 5) bad.push([p.id, expected, got]); }
}
check('상품별 색상 SKU 수가 페이지의 색상 select와 일치', mism === 0, mism ? JSON.stringify(bad) : '848/848');

// 3) 색상 SKU 단가 == 상품 판매가 (색상별 가격이 다른 상품 제외 수 보고)
const diff = all(`SELECT p.product_no, p.price, MIN(c.unit_price) lo, MAX(c.unit_price) hi FROM products p JOIN product_colors c ON c.product_no=p.product_no GROUP BY p.product_no HAVING lo<>hi OR lo<>p.price`);
const diffNames = diff.slice(0, 3).map((d) => `${d.product_no}: ${d.price} / ${d.lo}~${d.hi}`);
check('색상 단가가 판매가와 다른 상품 수 집계', true, diff.length + '개 (' + diffNames.join('; ') + ')');

// 4) 추가구성상품 1단 옵션 집합 == 페이지 select(옵션)
let m4 = 0; const bad4 = [];
for (const p of P) {
  const sel = p.selects.filter((s) => s.product_type === 'addproduct_option' && s.title === '옵션');
  const exp = new Set(sel.flatMap((s) => s.options.map((o) => o.text)));
  const got = new Set(all(`SELECT DISTINCT ao.level1_value v FROM product_addons pa JOIN addon_products ap ON ap.add_product_no=pa.add_product_no AND ap.scope='parts' JOIN addon_options ao ON ao.add_product_no=ap.add_product_no AND ao.is_display='T' WHERE pa.product_no=?`, p.id).map((r) => r.v));
  const miss = [...exp].filter((x) => !got.has(x));
  const extra = [...got].filter((x) => !exp.has(x));
  if (miss.length || extra.length) { m4++; if (bad4.length < 3) bad4.push([p.id, miss.slice(0, 2), extra.slice(0, 2)]); }
}
check('부품 1단 옵션(표시 중인 것)이 페이지 select와 일치', m4 === 0, m4 ? m4 + '개 상품 불일치 ' + JSON.stringify(bad4) : '848/848');

// 5) 사이트에서 직접 선택해 확인한 값(라이브 표본, 2026-11-02)
const live = [
  ['상품 3647 이노스 5칸(국내재고) +344,000원', one("SELECT ao.unit_price p FROM product_addons pa JOIN addon_products ap ON ap.add_product_no=pa.add_product_no AND ap.scope='inos' JOIN addon_options ao ON ao.add_product_no=ap.add_product_no AND ao.level1_value='퓨어 화이트' WHERE pa.product_no=3647"), (r) => r && r.p === 344000],
  ['상품 3647 타공패널로 변경 > 가운데 하단 타공 · 1개 +64,000원(표시 중인 유일한 2단 값)', all("SELECT ao.level2_value l2, ao.unit_price p FROM product_addons pa JOIN addon_products ap ON ap.add_product_no=pa.add_product_no AND ap.scope='parts' JOIN addon_options ao ON ao.add_product_no=ap.add_product_no AND ao.level1_value='타공패널로 변경' AND ao.is_display='T' WHERE pa.product_no=3647"), (r) => r.length === 1 && r[0].l2 === '가운데 하단 타공 · 1개' && r[0].p === 64000],
  ['상품 3647 판매가 3,338,740 / 소비자가 3,442,000', one('SELECT price, consumer_price FROM products WHERE product_no=3647'), (r) => r && r.price === 3338740 && r.consumer_price === 3442000],
];
for (const [name, val, test] of live) check('라이브 표본: ' + name, test(val), JSON.stringify(val));

// 6) 직접 확인한 표본: 3646 + 퓨어 화이트 + (열쇠핸들로 교체/도어 1개) = 3,347,000
const s = one(`SELECT c.unit_price a FROM product_colors c WHERE c.product_no=3646 AND c.option_value='퓨어 화이트'`);
const ad = one(`SELECT ao.unit_price b FROM product_addons pa JOIN addon_options ao ON ao.add_product_no=pa.add_product_no WHERE pa.product_no=3646 AND ao.level1_value='열쇠핸들로 교체' AND ao.level2_value='도어 1개'`);
check('표본(상품 3646): 3,247,000 + 100,000 = 3,347,000 (사이트에서 직접 선택해 확인한 값)', s && ad && s.a + ad.b === 3347000, s && ad ? `${s.a} + ${ad.b} = ${s.a + ad.b}` : 'row missing');

// 7) 이노스 5칸은 2종(일반배송 325,000 / 국내재고 344,000), 각 14색
const inos = all("SELECT ap.name, ao.unit_price p, COUNT(*) n FROM addon_options ao JOIN addon_products ap ON ap.add_product_no=ao.add_product_no WHERE ap.scope='inos' GROUP BY ap.add_product_no");
check('이노스 5칸 2종 × 14색(325,000 / 344,000)', inos.length === 2 && inos.every((r) => r.n === 14) && inos.map((r) => r.p).sort().join() === '325000,344000', JSON.stringify(inos));

// 7-2) 설명 문구
const withDesc = one("SELECT COUNT(*) n FROM products WHERE access='public' AND description IS NOT NULL AND length(description) > 0").n;
const noDesc = all("SELECT product_no FROM products WHERE access='public' AND description IS NULL").map((r) => r.product_no);
check('상품 설명: 838개 보유, 10개는 사이트 자체에 설명 없음', withDesc === 838 && noDesc.length === 10, withDesc + '개 / 설명 없음 ' + JSON.stringify(noDesc));
const d3646 = one('SELECT desc_title t, description d FROM products WHERE product_no=3646');
check('설명 표본(3646): 화면에서 직접 읽은 첫 문장·문단 수 일치', d3646.d.startsWith('좁은 벽면이나 책상 옆에 두고') && d3646.d.split('\n\n').length === 3, d3646.t);
check('설명 문구가 마크업 찌꺼기를 포함하지 않음', one("SELECT COUNT(*) n FROM products WHERE description LIKE '%<%' OR desc_title LIKE '<%'").n === 0);

// 7-3) 회원 전용 32개 (로그인 세션에서 읽은 값, 라이브 표본 3662)
const mem = all("SELECT product_no, price, best_price FROM products WHERE access='members_only'");
check('회원 전용 32개 모두 CUSTOM ORDER(35) 카테고리·SKU 1개', mem.length === 32 && one("SELECT COUNT(*) n FROM product_categories WHERE cate_no=35").n === 32 && one("SELECT COUNT(*) n FROM product_colors WHERE item_code LIKE 'M%#default'").n === 32);
check('회원 전용: 이노스 5칸(국내재고 +344,000, 14색) 연결 31개(2379 제외)', one("SELECT COUNT(*) n FROM product_addons pa JOIN products p ON p.product_no=pa.product_no WHERE p.access='members_only' AND pa.add_product_no=1644").n === 31);
const m3662 = one('SELECT price, best_price FROM products WHERE product_no=3662');
check('라이브 표본: 회원 전용 상품 3662 판매가 3,434,750 / 최적할인가 3,297,360', m3662 && m3662.price === 3434750 && m3662.best_price === 3297360, JSON.stringify(m3662));

// 7-4) 정식 상품명: 구성 코드만 있는 이름이 없어야 하고, 모든 이름에 종류어가 있어야 한다
const TYPE_RE = /(수납 모듈|티비장|협탁|책상|소파테이블|트롤리|코너장|옷장|테이블|Table|스토리지 박스|Storage Box|페데스탈|Pedestal|콘솔|Console|확장시공|보강 프로파일)/;
const names = all('SELECT product_no, name, name_site, name_display FROM products');
const codeOnly = names.filter((r) => /^d+xd+(([^)]*))?$/.test(r.name));
const noType = names.filter((r) => !TYPE_RE.test(r.name));
check('정식 상품명: 구성 코드만 있는 이름 0개', codeOnly.length === 0, codeOnly.length + '개');
check('정식 상품명: 모든 이름에 종류어 포함(880/880)', noType.length === 0, noType.slice(0, 3).map((r) => r.name).join(' | '));
check('정식 상품명: 사이트 원래 이름(name_site) 보존 — 수납 모듈 접미사만 추가된 상품은 원문 유지', one("SELECT COUNT(*) n FROM products WHERE access='public' AND name_site IS NOT NULL").n === 848);
const ex = [[26, '1x2(1단오픈) 수납 모듈'], [1342, '2x2(가로750/500) 책상'], [3646, '1x3(1,2단175서랍,3단도어없음) 수납 모듈'], [656, '1x2(1단오픈) 수납 모듈']];
for (const [no, want] of ex) { const r = one('SELECT name FROM products WHERE product_no=?', no); check('정식 상품명 표본 ' + no, r && r.name === want, r && r.name); }
const dupDisp = all('SELECT name_display, COUNT(*) n FROM products GROUP BY name_display HAVING n > 1');
console.log('INFO 표시명(태그 포함)이 같은 상품 묶음:', dupDisp.length, '(사이트에 같은 이름의 상품이 여럿 있는 경우, 상품번호로 구분)');

// 8) 구성기 이미지 수 == 인벤토리 합계
check('구성기 이미지 URL 19,278건', one('SELECT COUNT(*) n FROM viewer_assets').n === 19278);

const fails = results.filter((r) => !r.ok);
console.log(`\n${results.length - fails.length}/${results.length} PASS`);
process.exit(fails.length ? 1 : 0);
