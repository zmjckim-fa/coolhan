// 정식 상품명 규칙: 사이트의 상품명은 구성 코드만 있는 경우가 많아 종류(수납 모듈 등)가 빠져 있다.
// 정식 상품명 = "{구성} {종류}" (예: "2x2(가로750/395,깊이500) 책상"과 같은 형태). 종류는 이름에 있는 종류어를 우선하고, 없으면 사이트 SEO 제목·설명의 종류어를 쓴다.
const TYPE_WORDS = [
  [/티비장|TV\s*Unit/i, '티비장'], [/협탁|Bedside/i, '협탁'], [/책상|Desk/i, '책상'], [/소파테이블/, '소파테이블'], [/트롤리/, '트롤리'],
  [/코너장/, '코너장'], [/옷장/, '옷장'], [/Table|테이블/i, '테이블'], [/Storage Box/i, '스토리지 박스'], [/Pedestal/i, '페데스탈'], [/Console/i, '콘솔'],
  [/매거진랙/, null], // 구성 요소이므로 종류로 보지 않음
];
function typeOf(name) {
  for (const [re, t] of TYPE_WORDS) if (t && re.test(name)) return t;
  return null;
}
module.exports = { TYPE_WORDS, typeOf };
if (require.main === module) {
  const P = require('./products.json'); const S = new Map(require('./seo-raw.json').map((s) => [s.product_no, s]));
  const strip = (n) => n.replace(/^\[(국내재고|입고예정)\]\s*/, '').trim();
  const un = [];
  for (const p of P) {
    const n = strip(p.name.replace('USM Haller/유에스엠 할러 - ', ''));
    if (!typeOf(n)) un.push([p.id, n, (S.get(p.id).title || '').replace('한국어 쇼핑몰 | ', '')]);
  }
  const grids = un.filter((u) => /^\d+x\d+/.test(u[1]));
  console.log('type word missing', un.length, 'of', P.length, '| grid-like', grids.length);
  const odd = un.filter((u) => !/^\d+x\d+(\([^)]*\))?$/.test(u[1]));
  console.log('not plain grid names:', odd.length); odd.forEach((o) => console.log(o.join(' | ')));
}
