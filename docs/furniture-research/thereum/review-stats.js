// 판매 통계(후기 기반 대리 지표). 입력: reviews/*.txt (개인 식별 정보 없음), 카탈로그 DB(가격 연결).
const fs = require('fs');
const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync(__dirname + '/thereum_catalog.sqlite', { readOnly: true });
const prod = fs.readFileSync(__dirname + '/reviews/products.txt', 'utf8').trim().split('\n').map((l) => { const [pc, name, n, avg, sm, own] = l.split('|'); return { pc: +pc, name, n: +n, avg: +avg, sm: +sm, own: +own }; });
const monthly = fs.readFileSync(__dirname + '/reviews/monthly.txt', 'utf8').trim().split('\n').map((l) => { const [m, n, sm, own] = l.split(':'); return { m, n: +n, sm: +sm, own: +own }; });
const total = monthly.reduce((a, b) => a + b.n, 0);
const byNo = db.prepare('SELECT product_no, name_base, price, kind, grid_cols, grid_rows, panel_mode, fulfilment FROM products WHERE product_no=?');
const byName = db.prepare('SELECT product_no, name_base, price, kind, grid_cols, grid_rows, panel_mode, fulfilment FROM products WHERE name_base=? ORDER BY fulfilment DESC LIMIT 1');
const strip = (s) => s.replace(/^\[(국내재고|입고예정|B급|빠른배송)\]\s*/, '').replace(/\s+/g, ' ').trim();
let matchedNo = 0, matchedName = 0, unmatched = 0;
for (const p of prod) {
  p.base = strip(p.name);
  p.stock = /^\[국내재고\]/.test(p.name) ? 'domestic_stock' : /^\[B급\]/.test(p.name) ? 'b_grade' : 'made_to_order_or_other';
  let r = byNo.get(p.pc);
  if (r) { p.link = 'product_no'; matchedNo++; }
  else { r = byName.get(p.base); if (r) { p.link = 'name'; matchedName++; } else { unmatched++; p.link = 'none'; } }
  p.db = r || null;
  const g0 = p.base.match(/^(\d+)x(\d+)/);
  const g = g0 && +g0[1] <= 9 && +g0[2] <= 9 ? g0 : null; // 500x350 같은 부품 치수는 격자 구성이 아니다
  p.cols = g ? +g[1] : null; p.rows = g ? +g[2] : null;
  p.mode = /오픈/.test(p.base) ? 'open' : /도어없음/.test(p.base) ? 'no_doors' : g ? 'doors' : 'n/a';
  p.type = /티비장/.test(p.base) ? 'TV장' : /협탁/.test(p.base) ? '협탁' : /책상|Desk/i.test(p.base) ? '책상' : /Table/i.test(p.base) ? '테이블' : /트롤리/.test(p.base) ? '트롤리' : /Inos|부품|클리닝/.test(p.base) ? '부품/서비스' : /Chair|Paperback|Kevi/i.test(p.base) ? '기타 브랜드' : g ? '수납 모듈(격자)' : '기타';
}
const sum = (a, f) => a.reduce((s, x) => s + f(x), 0);
const group = (arr, key) => { const m = {}; for (const x of arr) { const k = key(x); (m[k] = m[k] || { n: 0, sm: 0, own: 0, products: 0 }); m[k].n += x.n; m[k].sm += x.sm; m[k].own += x.own; m[k].products++; } return Object.entries(m).sort((a, b) => b[1].n - a[1].n); };
const productReviews = sum(prod, (x) => x.n);
const pct = (a, b) => (b ? (100 * a / b).toFixed(1) + '%' : '-');
const out = [];
const P = (s = '') => { out.push(s); console.log(s); };

P('# thereum 판매 통계 (후기 기반 대리 지표)');
P(`수집: 공개 후기 ${total.toLocaleString()}건 (2021-09 ~ 2026-11-02). 개인 식별 정보(작성자·본문)는 저장하지 않았고 상품·월·채널·별점 집계만 사용.`);
P('**후기 수 ≠ 판매 수.** 후기 작성률은 알 수 없어 절대 판매량이 아니라 "상대 비중"과 "추세"를 보는 용도다.\n');

P('## 1. 채널');
const ven = monthly.reduce((a, b) => ({ sm: a.sm + b.sm, own: a.own + b.own }), { sm: 0, own: 0 });
P(`- 네이버 스마트스토어 ${ven.sm.toLocaleString()}건 (${pct(ven.sm, total)}) / 자사몰 ${ven.own.toLocaleString()}건 (${pct(ven.own, total)})`);
const since = (m0) => monthly.filter((x) => x.m >= m0);
const y = (yr) => monthly.filter((x) => x.m.startsWith(yr));
for (const yr of ['2022', '2023', '2024', '2025']) { const a = y(yr); P(`- ${yr}년 후기 ${sum(a, (x) => x.n)}건 (스마트스토어 ${pct(sum(a, (x) => x.sm), sum(a, (x) => x.n))})`); }
const y26 = y('2026'); P(`- 2026년(1~11/2) ${sum(y26, (x) => x.n)}건, 월평균 ${(sum(y26.filter((x) => x.m < '2026-11'), (x) => x.n) / 10).toFixed(1)}건(1~10월)`);
const last12 = monthly.filter((x) => x.m >= '2025-11' && x.m < '2026-11');
P(`- 최근 12개월(2025-11~2026-10) ${sum(last12, (x) => x.n)}건, 월 최소 ${Math.min(...last12.map((x) => x.n))} ~ 최대 ${Math.max(...last12.map((x) => x.n))}`);
P(`- 후기가 가장 많았던 달: ${[...monthly].sort((a, b) => b.n - a.n).slice(0, 3).map((x) => x.m + ' ' + x.n + '건').join(', ')}`);
P('- 자사몰 후기는 2023-07 이전이 전부, 스마트스토어 후기는 2023-07부터 시작 → 스마트스토어 입점·후기 연동이 2023-07경 시작된 것으로 보임(추정).');

P('\n## 2. 상품 유형별 후기 비중 (상품 연결 후기 ' + productReviews + '건; 개인결제창 74건·상품 미상 20건 제외)');
for (const [k, v] of group(prod, (x) => x.type)) P(`- ${k}: ${v.n}건 (${pct(v.n, productReviews)}), 상품 ${v.products}종`);

P('\n## 3. 출고 방식');
for (const [k, v] of group(prod, (x) => x.stock)) P(`- ${k === 'domestic_stock' ? '국내재고([국내재고] 표기)' : k === 'b_grade' ? 'B급 리퍼브' : '그 외(제작주문·구형 상품 등)'}: ${v.n}건 (${pct(v.n, productReviews)})`);

P('\n## 4. 수납 모듈(격자) 구성별');
const grid = prod.filter((x) => x.type === '수납 모듈(격자)' && x.cols);
P('가로칸×세로단:'); for (const [k, v] of group(grid, (x) => x.cols + 'x' + x.rows).slice(0, 12)) P(`- ${k}: ${v.n}건 (${pct(v.n, sum(grid, (x) => x.n))})`);
P('도어 구성:'); for (const [k, v] of group(grid, (x) => x.mode === 'open' ? '오픈(일부/전체 오픈 표기)' : x.mode === 'no_doors' ? '도어없음' : '도어형(기본)')) P(`- ${k}: ${v.n}건 (${pct(v.n, sum(grid, (x) => x.n))})`);
P('세로 단 수:'); for (const [k, v] of group(grid, (x) => x.rows + '단').sort((a, b) => a[0].localeCompare(b[0]))) P(`- ${k}: ${v.n}건 (${pct(v.n, sum(grid, (x) => x.n))})`);

P('\n## 5. 상위 상품 (후기 수)');
for (const p of [...prod].sort((a, b) => b.n - a.n).slice(0, 15)) P(`- ${p.pc} ${p.name}: ${p.n}건 (${pct(p.n, productReviews)}), 평점 ${p.avg}, 스마트스토어 ${p.sm}/자사몰 ${p.own}${p.db ? ', 현재가 ' + p.db.price.toLocaleString() + '원(' + p.link + ' 연결)' : ', 현재 카탈로그에 없음'}`);
const top5 = [...prod].sort((a, b) => b.n - a.n).slice(0, 5);
P(`- 상위 5개 상품이 전체 상품 후기의 ${pct(sum(top5, (x) => x.n), productReviews)}, 상위 1개 상품이 ${pct(top5[0].n, productReviews)}`);

P('\n## 6. 가격대별 (현재 카탈로그 가격에 연결된 후기만)');
const priced = prod.filter((x) => x.db);
const band = (pr) => pr < 1500000 ? '150만 미만' : pr < 2500000 ? '150~250만' : pr < 3500000 ? '250~350만' : pr < 5000000 ? '350~500만' : '500만 이상';
for (const [k, v] of group(priced, (x) => band(x.db.price)).sort((a, b) => a[0].localeCompare(b[0]))) P(`- ${k}: ${v.n}건 (${pct(v.n, sum(priced, (x) => x.n))})`);
P(`- 가격 연결 ${priced.length}종 / 연결 후기 ${sum(priced, (x) => x.n)}건 (product_no 일치 ${matchedNo}, 이름 일치 ${matchedName}, 미연결 ${unmatched})`);
const est = sum(priced, (x) => x.n * x.db.price);
P(`- 후기 건수 × 현재가 합계(대리 지표, 실매출 아님): ${(est / 1e8).toFixed(1)}억 원`);

P('\n## 7. 한계');
P('- 후기 작성은 보상·안내 정책에 좌우되고 구매자 중 일부만 작성한다. 같은 상품이라도 시기별 후기 작성률이 다를 수 있다.');
P('- 상품이 교체·재등록되면(옛 상품번호) 후기가 옛 상품에 남는다. 상품명으로 현재 상품에 연결한 경우가 있어 가격은 현재가다.');
P('- 개인결제창(고객별 맞춤 결제) 후기 74건은 상품 정보가 없어 유형 비교에서 뺐다. 맞춤 주문·확장 시공의 실제 규모는 후기로 알 수 없다.');
P('- 색상별 통계는 상품명에 색이 없어 계산하지 못했다.');
fs.writeFileSync(__dirname + '/SALES_STATS.md', out.join('\n') + '\n');
