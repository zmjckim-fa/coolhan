// 정식 상품명 규칙.
// 사이트의 "상품명" 칸은 구성 코드만 있는 경우가 많다(예: 1x2(1단오픈)). 정식 상품명은 "{구성} {종류}" 형태로 만든다
// (사이트가 이미 종류를 쓴 예: "2x2(가로750/395,깊이500) 책상"). 종류는 이름 안의 종류어를 우선 쓰고, 없으면 "수납 모듈"로 한다.
// "수납 모듈"은 사이트 자체의 SEO 제목에서 격자 구성 상품의 종류로 쓰는 말이다(seo-raw.json: "2x1 타입2 수납 모듈", "USM Haller 1x3 수납 모듈" 등).
const COLORS = ['앤트라사이트 그레이', '미디움 그레이', '라이트 그레이', '그래파이트 블랙', '골든 옐로우', '퓨어 오렌지', '퓨어 화이트', '올리브 그린', '젠션 블루', '스틸 블루', '루비 레드', '브라운', '베이지', '그린', '믹스'];
const TYPE_WORDS = [
  [/티비장|TV\s*Unit/i, '티비장'], [/협탁|Bedside/i, '협탁'], [/책상|Desk/i, '책상'], [/소파테이블/, '소파테이블'], [/트롤리/, '트롤리'],
  [/코너장/, '코너장'], [/옷장/, '옷장'], [/Table|테이블/i, '테이블'], [/Storage Box/i, '스토리지 박스'], [/Pedestal/i, '페데스탈'], [/Console/i, '콘솔'],
  [/확장시공/, '확장시공'], [/보강 프로파일/, '부품'],
];
const typeOf = (n) => { for (const [re, t] of TYPE_WORDS) if (re.test(n)) return t; return null; };
const isGrid = (n) => /^\d+x\d+/.test(n);

function properName(rawSiteName) {
  let s = rawSiteName.replace(/^USM Haller\/유에스엠 할러 - /, '').replace(/^자체브랜드 - /, '').replace(/\s+/g, ' ').trim();
  let tag = null;
  const tm = s.match(/^\[(국내재고|입고예정|빠른배송)\]\s*/);
  if (tm) { tag = tm[1]; s = s.slice(tm[0].length); }
  // B급(리퍼브 1점물): "[B급] 퓨어 화이트 1x3 (2)" -> "1x3 수납 모듈 B급 · 퓨어 화이트 (2)"
  if (/^\[B급\]/.test(s)) {
    s = s.replace(/^\[B급\]\s*/, '');
    const color = COLORS.find((c) => s.startsWith(c + ' ')) || null;
    let rest = color ? s.slice(color.length + 1) : s;
    const nm = rest.match(/\s*\((\d+)\)\s*$/); const num = nm ? nm[1] : null;
    if (nm) rest = rest.slice(0, nm.index);
    rest = rest.replace(/Bedside Table/, '협탁').replace(/TV Unit\s*(\d+x\d+)/, '$1 티비장');
    const type = typeOf(rest) || (isGrid(rest) ? '수납 모듈' : '');
    const head = typeOf(rest) ? rest : (type ? `${rest} ${type}` : rest);
    return { name: `${head} B급${color ? ' · ' + color : ''}${num ? ' (' + num + ')' : ''}`, tag: 'B급', type: typeOf(rest) || '수납 모듈' };
  }
  // 회원 전용 맞춤 상품: "[빠른배송] [확장시공] 1x2 → 1x3 · 퓨어 화이트" 등
  if (tag === '빠른배송' || /^\[확장시공\]|^USM |커스텀/.test(s)) {
    let m = s.replace(/USM Haller\s+|USM\s+/g, '').replace(/\s+/g, ' ').trim();
    let ext = false;
    if (/^\[확장시공\]/.test(m)) { ext = true; m = m.replace(/^\[확장시공\]\s*/, ''); }
    const parts = m.split(' · ');
    let head = parts[0]; const rest = parts.slice(1);
    const restJoined = rest.join(' · ');
    if (restJoined && head.endsWith(restJoined)) head = head.slice(0, head.length - restJoined.length).trim();
    head = head.replace(/\bDesk\b/, '책상').trim();
    if (ext) {
      // 확장시공: "A → B · 부속설명 · 색상" → "A → B · 부속설명 확장시공 · 색상" (마지막 색상 부분만 뒤로 뺀다)
      const all = [head, ...rest];
      const last = all[all.length - 1];
      const isColor = all.length > 1 && last.split(' / ').every((c) => COLORS.includes(c.trim().split(' + ')[0]) || COLORS.some((k) => c.includes(k)));
      const body = (isColor ? all.slice(0, -1) : all).join(' · ');
      return { name: `${body} 확장시공${isColor ? ' · ' + last : ''}`, tag, type: '확장시공' };
    }
    if (!typeOf(head) && isGrid(head)) head = `${head} 수납 모듈`;
    return { name: [head, ...rest].join(' · '), tag, type: typeOf(head) || '수납 모듈' };
  }
  const t = typeOf(s);
  if (t) return { name: s, tag, type: t };
  if (isGrid(s)) return { name: `${s} 수납 모듈`, tag, type: '수납 모듈' };
  return { name: s, tag, type: null };
}
const display = (r) => (r.tag && r.tag !== 'B급' ? `[${r.tag}] ` : '') + r.name;
module.exports = { properName, display, typeOf, isGrid };

if (require.main === module) {
  const P = require('./products.json');
  const names = P.map((p) => ({ id: p.id, site: p.name.replace('USM Haller/유에스엠 할러 - ', ''), ...properName(p.name) }));
  const mem = require('fs').readFileSync(__dirname + '/members32.txt', 'utf8').trim().split('\n').map((l) => { const [no, n] = l.split('|'); return { id: +no, site: n, ...properName(n) }; });
  const all = [...names, ...mem];
  const noType = all.filter((x) => !x.type);
  console.log('total', all.length, 'no type', noType.length);
  noType.forEach((x) => console.log('NOTYPE', x.id, x.site, '=>', x.name));
  const sample = [26, 27, 44, 45, 53, 656, 720, 1342, 2038, 2081, 2091, 3646, 897, 1565, 3166];
  sample.forEach((id) => { const x = all.find((y) => y.id === id); if (x) console.log(id, '|', x.site, '=>', display(x)); });
  console.log('--- members'); mem.forEach((x) => console.log(x.id, '|', x.site, '=>', display(x)));
  const dup = {}; all.forEach((x) => { const k = display(x); dup[k] = (dup[k] || 0) + 1; });
  console.log('duplicate display names', Object.values(dup).filter((v) => v > 1).length);
}
