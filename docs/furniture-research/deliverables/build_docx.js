// thereum 분석 통합 보고서(.docx) 생성: 보고용 요약 + 개발자 재사용 명세. 실행: node build_docx.js
// docx 패키지는 scratchpad/docgen/node_modules 에 설치되어 있다.
const fs = require('fs');
const path = require('path');
const DOCX_DIR = process.env.DOCX_DIR;
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, HeadingLevel, AlignmentType, LevelFormat,
  WidthType, ShadingType, BorderStyle, TableOfContents, PageBreak, Header, Footer, PageNumber,
} = require(DOCX_DIR + '/node_modules/docx');
const { DatabaseSync } = require('node:sqlite');

const FR = path.resolve(__dirname, '..');
const TH = path.join(FR, 'thereum');
const OUT = path.join(FR, 'thereum_쇼핑몰_분석보고서.docx');
const db = new DatabaseSync(path.join(TH, 'thereum_catalog.sqlite'), { readOnly: true });
const one = (sql) => db.prepare(sql).get();

const FONT = '맑은 고딕';
const BRAND = '173D3B';
const W = 9026; // A4, 여백 1인치 기준 본문 폭(DXA)

// ---------- 헬퍼
const run = (text, o = {}) => new TextRun({ text, font: FONT, size: o.size || 21, bold: o.bold, italics: o.italics, color: o.color });
const P = (text, o = {}) => new Paragraph({ spacing: { after: o.after ?? 120, line: 300 }, alignment: o.align, children: Array.isArray(text) ? text : [run(text, o)] });
const H1 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 360, after: 160 }, children: [new TextRun({ text: t, font: FONT, bold: true, size: 30, color: BRAND })] });
const H2 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 120 }, children: [new TextRun({ text: t, font: FONT, bold: true, size: 25, color: BRAND })] });
const H3 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_3, spacing: { before: 160, after: 80 }, children: [new TextRun({ text: t, font: FONT, bold: true, size: 22 })] });
const B = (text, level = 0) => new Paragraph({ numbering: { reference: 'bul', level }, spacing: { after: 70, line: 290 }, children: Array.isArray(text) ? text : [run(text)] });
const N = (text) => new Paragraph({ numbering: { reference: 'num', level: 0 }, spacing: { after: 70, line: 290 }, children: [run(text)] });
const NOTE = (text) => new Paragraph({
  spacing: { before: 80, after: 140, line: 290 },
  shading: { type: ShadingType.CLEAR, fill: 'FFF4CE' },
  border: { left: { style: BorderStyle.SINGLE, size: 18, color: 'D9A400', space: 6 } },
  children: [run(text, { size: 20 })],
});
const bd = { style: BorderStyle.SINGLE, size: 4, color: 'CCCCCC' };
const borders = { top: bd, bottom: bd, left: bd, right: bd };
function cell(text, width, o = {}) {
  const paras = String(text ?? '').split('\n').map((t) => new Paragraph({ spacing: { after: 20 }, alignment: o.align, children: [new TextRun({ text: t, font: FONT, size: o.size || 18, bold: o.bold, color: o.color })] }));
  return new TableCell({
    borders, width: { size: width, type: WidthType.DXA }, verticalAlign: 'top',
    shading: o.fill ? { type: ShadingType.CLEAR, fill: o.fill } : undefined,
    margins: { top: 50, bottom: 50, left: 90, right: 90 }, children: paras,
  });
}
function table(headers, rows, widths) {
  const sum = widths.reduce((a, b) => a + b, 0);
  return new Table({
    width: { size: sum, type: WidthType.DXA }, columnWidths: widths,
    rows: [
      new TableRow({ tableHeader: true, children: headers.map((h, i) => cell(h, widths[i], { bold: true, color: 'FFFFFF', fill: BRAND, align: AlignmentType.CENTER })) }),
      ...rows.map((r, ri) => new TableRow({ cantSplit: true, children: r.map((c, i) => cell(c, widths[i], { fill: ri % 2 ? 'F6F8F8' : undefined })) })),
    ],
  });
}
const sp = () => new Paragraph({ spacing: { after: 100 }, children: [] });
const fmt = (n) => Number(n).toLocaleString('ko-KR');

// ---------- 데이터 (DB·집계에서 직접 읽음)
const cnt = {
  total: one('SELECT COUNT(*) n FROM products').n,
  pub: one("SELECT COUNT(*) n FROM products WHERE access='public'").n,
  mem: one("SELECT COUNT(*) n FROM products WHERE access='members_only'").n,
  sku: one('SELECT COUNT(*) n FROM product_colors').n,
  addonP: one('SELECT COUNT(*) n FROM addon_products').n,
  addonShown: one("SELECT COUNT(*) n FROM addon_options WHERE is_display='T' AND is_selling='T'").n,
  addonAll: one('SELECT COUNT(*) n FROM addon_options').n,
  assets: one('SELECT COUNT(*) n FROM viewer_assets').n,
  desc: one('SELECT COUNT(*) n FROM products WHERE description IS NOT NULL').n,
  mto: one("SELECT COUNT(*) n FROM products WHERE fulfilment='made_to_order'").n,
  stock: one("SELECT COUNT(*) n FROM products WHERE fulfilment='domestic_stock' AND access='public'").n,
  refurb: one("SELECT COUNT(*) n FROM products WHERE fulfilment='refurbished'").n,
  minP: one('SELECT MIN(price) n FROM products').n,
  maxP: one('SELECT MAX(price) n FROM products').n,
};
function brandTable() {
  const regions = [['nordic.md', '북유럽'], ['italy-living.md', '이탈리아 리빙·소파'], ['italy-design.md', '이탈리아 디자인·조명·아웃도어'], ['dach-fr-es-uk.md', '독일·프랑스·스페인·영국']];
  const out = []; const has = [];
  for (const [fn, name] of regions) {
    let h = 0, u = 0, nn = 0;
    for (const l of fs.readFileSync(path.join(FR, fn), 'utf8').split('\n')) {
      if (!l.startsWith('|') || l.startsWith('|---') || l.startsWith('| 브랜드') || l.startsWith('| Brand')) continue;
      const c = l.trim().replace(/^\||\|$/g, '').split('|').map((x) => x.trim());
      if (c.length < 5) continue;
      if (c[1] === 'HAS_KR_DISTRIBUTOR') { h++; has.push(c[0]); } else if (c[1] === 'UNCLEAR') u++; else if (c[1] === 'NONE_FOUND') nn++;
    }
    out.push([name, String(h), String(u), String(nn), String(h + u + nn)]);
  }
  return { rows: out, has };
}
const bt = brandTable();
const tot = bt.rows.reduce((a, r) => a.map((x, i) => x + (i ? Number(r[i]) : 0)), [0, 0, 0, 0, 0]);

// ---------- 본문
const kids = [];
// 표지
kids.push(new Paragraph({ spacing: { before: 2400, after: 200 }, children: [new TextRun({ text: 'thereum.co.kr 분석 통합 보고서', font: FONT, bold: true, size: 52, color: BRAND })] }));
kids.push(new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: '유럽 명품 가구 구매대행 쇼핑몰 개발을 위한 선행 분석 · 카탈로그 DB · 개발자 재사용 명세', font: FONT, size: 26 })] }));
kids.push(P('작성일 2026-11-03 | 수집 기간 2026-11-02 ~ 03', { size: 22 }));
kids.push(P('구성: 보고용 요약(1~3장) → 개발자 명세(4~9장) → 판매 통계·총판 조사(10~11장) → 운영·서비스·마케팅 조사(12장) → 주의사항(13장) → 미확인·후속(14장) → 부록', { size: 22 }));
kids.push(NOTE('함께 제공: thereum_쇼핑몰_개발자료.xlsx (26개 시트, 상품 880개·SKU 11,318개·부품 옵션 24,189건 등 전체 데이터), thereum_catalog.sqlite (원본 DB). 이 문서는 설명·규칙·판단 근거를, 엑셀과 DB는 데이터를 담당한다.'));
kids.push(NOTE('개인정보: 다른 고객의 이름·금액·연락처는 포함하지 않았다. 고객별 결제 페이지(개인결제창)는 구조만 기록했다.'));
kids.push(new Paragraph({ children: [new PageBreak()] }));
kids.push(new Paragraph({ children: [new TextRun({ text: '목차', font: FONT, bold: true, size: 30, color: BRAND })], spacing: { after: 160 } }));
kids.push(new TableOfContents('목차', { hyperlink: true, headingStyleRange: '1-2' }));
kids.push(new Paragraph({ children: [new PageBreak()] }));

// 1 요약
kids.push(H1('1. 요약 (보고용)'));
kids.push(H2('1.1 목적과 결과'));
kids.push(P('유럽 명품 가구를 한국 개인 소비자에게 판매하는 구매대행 쇼핑몰을 만들기 위해, 같은 방식으로 운영 중인 한국 쇼핑몰 thereum.co.kr(주식회사 더리움, USM Haller 병행수입)을 구조·상품·가격·옵션·운영 정책 관점에서 분석하고, 같은 구성과 상품명으로 쇼핑몰을 구축할 수 있는 수준의 카탈로그 DB를 만들었다.'));
kids.push(table(['항목', '결과'], [
  ['분석 대상', 'thereum.co.kr — 카페24 기반, USM Haller 단일 브랜드, 네이버 스마트스토어 병행 판매'],
  ['상품 DB', `${fmt(cnt.total)}개 (공개 ${cnt.pub} + 회원 전용 ${cnt.mem}) — 이름·가격·구성·납기·설명 문구`],
  ['색상 SKU', `${fmt(cnt.sku)}개 (표준 14색, item_code 포함)`],
  ['부품(추가구성) 옵션', `${fmt(cnt.addonShown)}건 표시·판매 중 (숨김 템플릿 포함 ${fmt(cnt.addonAll)}건), 부품 상품 ${fmt(cnt.addonP)}개`],
  ['구성기 이미지', `주소 ${fmt(cnt.assets)}건 (파일은 받지 않음), 치수·바퀴 추가금 포함`],
  ['판매 통계', '공개 후기 2,869건 기반 대리 지표 (스마트스토어 80.5%)'],
  ['검증', 'DB 25개 검증 항목 통과 (사이트에서 직접 고른 금액·옵션 표본 포함), 엑셀 행 수 DB와 일치 확인'],
  ['총판 조사', `유럽 가구 브랜드 ${tot[4]}개의 한국 공식 총판 유무 1차 조사 (총판 없음으로 확정된 브랜드 없음)`],
], [2300, 6726]));
kids.push(H2('1.2 핵심 발견'));
[
  '더리움은 카페24 쇼핑몰이다. 가격·옵션·주문 로직은 전부 카페24 기본 기능이고, 맞춤 코드는 상품 구성 미리보기(구성기)와 화면 스킨뿐이다.',
  '상품은 "완성된 구성 1개 = 상품 1개"(예: 1x3(1,2단175서랍,3단도어없음))이고, 색상이 필수 옵션, 바퀴·패널·핸들 같은 변경은 별도 부품 상품(추가구성상품)으로 판다. 주문 합계 = 색상 SKU 단가 + Σ 부품 옵션 단가.',
  '가격은 규칙적이다. 같은 모드(도어형/도어없음/오픈)의 격자 구성은 가로칸·세로단 식으로 R² 0.999에 맞고, 국내재고 가격은 제작주문 가격의 ×1.028이다.',
  '판매의 약 80%가 네이버 스마트스토어에서 나오고(후기 기준), 판매의 92%가 국내재고 상품이다. 상위 1개 상품([국내재고] 1x2(1단오픈))이 후기의 31%를 차지한다.',
  '구성기 이미지가 가장 큰 제작 비용이다. 구성 447종 × 색 14 × 시점 5 규모의 사전 렌더가 필요하다(구성기 보유 상품 792개, 이미지 키 19,278개).',
  '고객별 결제 페이지(개인결제창)는 일반 상품으로 만든 고객별 상품이며, 로그인한 회원이면 다른 고객 것도 열려서 개인정보 노출 위험이 있다. 우리는 접근 제어를 반드시 설계해야 한다.',
].forEach((t) => kids.push(B(t)));
kids.push(H2('1.3 결론과 다음 단계'));
[
  '카탈로그 데이터(이름·가격·옵션·부품·색상·구성)는 현재 보이는 범위에서 모두 확보했다. 설명 문구는 출처의 원문이므로 게시 전에 재작성한다.',
  '공급사 취급 브랜드 목록을 받아 총판·재판매 허용·한국 가격을 브랜드별로 정밀 조사한다(1차 조사는 후보 목록 수준).',
  '카페24로 만들지 직접 개발할지 결정한다. 더리움 방식을 빨리 재현하려면 카페24 + 맞춤 스킨이 유리하다(5장·8장 참고).',
  '구성기 이미지 확보 방법(공급사 자료 vs 자체 렌더)을 정한다.',
].forEach((t) => kids.push(N(t)));

// 2 개요
kids.push(H1('2. 분석 대상과 방법'));
kids.push(H2('2.1 대상 사이트'));
kids.push(table(['항목', '내용'], [
  ['운영사', '주식회사 더리움, 대표 김윤정, 서울 용산구 한강대로 205 D동 2716호, 통신판매업 제2026-서울용산-0853호'],
  ['플랫폼', '카페24 (몰 ID thereum96, 스킨 skin2 + _onedesign 커스텀, 개인 서버 reum.me 스크립트)'],
  ['취급 브랜드', '현재 USM Haller 단일(과거 Cassina·Vitra·Knoll 등 16개 브랜드 카테고리가 비어 있음)'],
  ['판매 채널', '자사몰 + 네이버 스마트스토어(후기의 80.5%)'],
  ['공급 경로', '사이트 주장: 유럽 현지 공식 딜러를 통한 병행수입. 운영자 진술: 독일 공급사가 우리 공급사와 동일, 라이선스 문제 없음(근거 문서 미확인)'],
], [2000, 7026]));
kids.push(H2('2.2 수집 방법과 원칙'));
[
  '읽기 전용: 공개 페이지, 사용자가 직접 로그인한 회원 세션(상품 페이지만), 공개 후기 API(집계만). 주문 제출·계정 생성·비밀번호 입력은 하지 않았다.',
  'REA(리버스 엔지니어링 도구)로 사이트 번들·네트워크·구성기 코드를 분석하고, 상품은 전수 조회(상품번호 1~9000)했다.',
  '검증: 사이트에서 옵션을 직접 선택해 확인한 금액을 DB와 대조(예: 3646 퓨어 화이트 3,247,000 + 열쇠핸들/도어1개 100,000 = 3,347,000원).',
  '개인정보는 저장하지 않았다(고객별 결제 페이지의 이름·금액, 후기 작성자·본문).',
].forEach((t) => kids.push(B(t)));
kids.push(H2('2.3 수집 범위'));
kids.push(table(['구분', '상태', '비고'], [
  ['공개 상품 848개', '전수 수집', '카테고리 목록 + sitemap 803개 전부 포함 + 번호 조회'],
  ['회원 전용 번호 975개', '분류 완료', '개인결제창 901(저장 안 함) / 접근 불가 42 / 실제 상품 32(DB 추가)'],
  ['상품번호 범위', '1~9000 조회', '최대 번호 3662, 4201~9000 없음. 신규 상품은 주기적으로 재조회'],
  ['공개 후기', '2,869건 집계', '상품·월·채널·별점만 사용'],
  ['스마트스토어', '수집 불가', '네이버 도메인이 브라우저에서 차단, 직접 요청은 429'],
  ['주문·회원 DB, 관리자', '대상 아님', '서버 내부 데이터, 개인정보'],
], [2500, 1600, 4926]));

// 3 사이트 구조
kids.push(H1('3. 사이트 구조와 화면 (보고용·개발 공통)'));
kids.push(H2('3.1 레이아웃'));
kids.push(P('모바일 우선 단일 컬럼(폭 500px)을 데스크톱 화면 중앙에 고정하고, 좌측에 475px 프로모션 패널(고정)을 둔다. 헤더는 고정이며 40px 띠배너 + 로고/장바구니/햄버거 + 가로 스크롤 메뉴로 구성된다. 브레이크포인트는 min-width 1024px, max-width 600/420px 정도로 적다.'));
kids.push(H2('3.2 화면 유형'));
kids.push(table(['화면', 'URL 규칙', '구성'], [
  ['홈', '/', '배너 Swiper(3장) → 일반/빠른배송 탭 상품 → Best Review 마퀴 → "우리집 공간에 맞게" 탭(가로1~4단)'],
  ['카테고리 목록', '/category/<slug>/<cate_no>/', '정렬(신상품/상품명/낮은가격/높은가격), 총 N개, 2열/1열, 색상 칩, 30개씩 더보기'],
  ['상품 상세', '/product/<slug>/<product_no>/…', '이미지 → 이름·가격 → 정보표 → 색상 → 쿠폰 → 부품 → 하단 고정 버튼 → 탭(상세/이용안내/리뷰)'],
  ['장바구니·주문', '/order/basket.html, /order/orderform.html', '카페24 표준, 무통장입금 안내'],
  ['로그인·가입', '/member/login.html, /member/join.html', '소셜 6종, 비회원 구매, 개인/사업자 가입'],
  ['후기·FAQ·정책', '/board/상품후기/4/ 외', 'Crema 후기 위젯, FAQ, 이용안내, 약관'],
], [1700, 2900, 4426]));
kids.push(H2('3.3 디자인 토큰'));
kids.push(table(['항목', '값'], [
  ['브랜드색', '#173D3B (진한 청록) — 띠배너, 활성 탭, 구매 버튼, 쿠폰 헤더'],
  ['중립색', '#fff #eee #999 #000 #f5f5f5 #1b1b1b #ddd #353535 #f9f9f9'],
  ['글꼴', 'Sora + Noto Sans KR(300/400/500/700), 본문 14px, 행간 1.7, 가장 많이 쓰는 크기 13px'],
  ['모서리·전환', '모서리 2px(최다), 전환 all 0.35~0.55s, 아이콘 xeicon 2.3.3'],
  ['주의', 'CSS 변수를 쓰지 않고 값이 하드코딩되어 있다. 새로 만들 때 변수로 정리한다.'],
], [1700, 7326]));

// 4 데이터 모델
kids.push(H1('4. 상품 데이터 모델 (개발자 재사용)'));
kids.push(P('DB(SQLite)는 상품 → 색상 SKU → 부품 상품 → 부품 옵션 구조다. 아래 표는 DB에서 직접 읽은 스키마다.'));
const tables = ['brands', 'categories', 'products', 'product_categories', 'colors', 'product_colors', 'addon_products', 'product_addons', 'addon_options', 'viewer_assets', 'viewer_bases', 'viewer_dimensions'];
const tdesc = {
  brands: '브랜드(현재 USM Haller 1건)', categories: '카테고리 10개', products: '상품 880개(공개 848 + 회원 전용 32), 가격·구성·설명',
  product_categories: '상품↔카테고리', colors: '색상 마스터(표준 14색 + 기타), HEX·구성기 코드', product_colors: '판매 SKU — 색상 옵션 1건 = SKU 1건(item_code)',
  addon_products: '추가구성상품(부품 상품, 이노스 5칸)', product_addons: '상품↔부품 상품 연결', addon_options: '부품 옵션(옵션 > 상세)과 단가, 표시 여부(is_display)',
  viewer_assets: '구성기 이미지 키·URL', viewer_bases: '바퀴 구성별 추가금', viewer_dimensions: '구성기 치수(mm)',
};
kids.push(table(['테이블', '행 수', '설명'], tables.map((t) => [t, fmt(one(`SELECT COUNT(*) n FROM ${t}`).n), tdesc[t]]), [2200, 1100, 5726]));
kids.push(sp());
kids.push(H2('4.1 products 주요 컬럼'));
const cols = db.prepare("PRAGMA table_info(products)").all();
const cdesc = {
  product_no: '카페24 상품번호(PK)', product_code: '상품코드(P0000FKG 형식)', name: '정식 상품명 "{구성} {종류}" (태그 없음)', name_display: '표시명(태그 포함, 예: [국내재고] 1x2(1단오픈) 수납 모듈)', name_site: '사이트의 원래 상품명(구성 코드만 있는 경우가 많음)', name_base: '태그를 뺀 사이트 원래 이름(내부용)', tag: '국내재고/입고예정/B급/확장시공/맞춤 구성',
  fulfilment: 'made_to_order | domestic_stock | refurbished | table | other', lead_time_text: '납기 문구', consumer_price: '소비자가(KRW)', price: '판매가(KRW)', best_price: '최적할인가(무통장·회원)',
  kind: 'grid | table | side_table | trolley | sofa_table | tv | storage_box | extension_work | custom_order | other', grid_cols: '가로 칸 수', grid_rows: '세로 단 수', panel_mode: 'doors | no_doors | open | custom',
  has_color_option: '색상 필수 옵션 여부', description: '상품 소개 문단(출처 원문, 게시 전 재작성)', access: 'public | members_only',
};
kids.push(table(['컬럼', '타입', '설명'], cols.filter((c) => cdesc[c.name]).map((c) => [c.name, c.type || '', cdesc[c.name]]), [2200, 1300, 5526]));
kids.push(H2('4.2 상품명 규칙'));
kids.push(P('사이트의 상품명 칸은 구성 코드만 적은 경우가 많다(예: 1x2(1단오픈), 1x3). 그대로는 상품명으로 쓸 수 없어서, 정식 상품명을 "{구성} {종류}" 형태로 따로 만들었다. 사이트가 이미 종류를 붙인 이름(예: 2x2(가로750/395,깊이500) 책상)을 기준 형태로 삼았다.'));
kids.push(table(['사이트 원래 이름', '정식 상품명'], [
  ['1x2(1단오픈)', '1x2(1단오픈) 수납 모듈'],
  ['[국내재고] 1x3(3단오픈,175)', '1x3(3단오픈,175) 수납 모듈  (표시명: [국내재고] 1x3(3단오픈,175) 수납 모듈)'],
  ['1x3(1,2단175서랍,3단도어없음)', '1x3(1,2단175서랍,3단도어없음) 수납 모듈'],
  ['2x2(가로750/395,깊이500) 책상', '2x2(가로750/395,깊이500) 책상  (종류가 이미 있어 그대로)'],
  ['협탁 타입2 / 소파테이블 타입10 / 트롤리 타입5', '그대로 (종류가 이름에 있음)'],
  ['[B급] 퓨어 화이트 1x3 (2)', '1x3 수납 모듈 B급 · 퓨어 화이트 (2)'],
  ['[빠른배송] [확장시공] 2x2 → USM 1x3 · 드롭다운 도어 3개 + 1x2 · 베이지 / 퓨어 오렌지', '2x2 → 1x3 · 드롭다운 도어 3개 + 1x2 확장시공 · 베이지 / 퓨어 오렌지'],
  ['[빠른배송] USM 3x1 · 드롭다운 도어 2개 · 퓨어 화이트', '3x1 수납 모듈 · 드롭다운 도어 2개 · 퓨어 화이트'],
], [4200, 4826]));
kids.push(NOTE('종류어 "수납 모듈"은 사이트가 격자 구성 상품의 SEO 제목에 쓰는 말이다(예: "USM Haller 1x3 수납 모듈", "2x1 타입2 수납 모듈"). 규칙은 thereum/names.js에 있고, DB 검증에서 구성 코드만 있는 이름이 0개이고 880개 모두 종류어가 있음을 확인한다.'));
kids.push(H2('4.3 주문 금액 계산'));
kids.push(NOTE('합계 = product_colors.unit_price(선택 색상) + Σ addon_options.unit_price(선택 부품) × 수량. 부품은 본 상품과 별도 행(add_product)으로 쌓이고 각자 수량·가격을 가진다.'));
kids.push(P('검증 예: 상품 3646 퓨어 화이트 3,247,000원 + 부품 [열쇠핸들로 교체 / 도어 1개] 100,000원 = 3,347,000원(사이트에서 직접 선택해 확인). 상품 3647의 이노스 5칸(국내재고)은 +344,000원, 타공패널로 변경 > 가운데 하단 타공 1개는 +64,000원이었다.'));
kids.push(H2('4.4 자주 쓰는 질의'));
['-- 상품의 색상 SKU와 단가\nSELECT item_code, option_value, unit_price FROM product_colors WHERE product_no = 3646;',
 '-- 상품에서 고를 수 있는 부품(표시 중)\nSELECT addon_product, level1_value, level2_value, unit_price FROM v_addon_catalog WHERE product_no = 3646;',
 '-- 격자 구성 가격표\nSELECT grid_cols, grid_rows, panel_mode, price FROM products WHERE kind=\'grid\' AND fulfilment=\'made_to_order\' ORDER BY 1,2,3;']
  .forEach((s) => s.split('\n').forEach((l) => kids.push(new Paragraph({ spacing: { after: 20 }, shading: { type: ShadingType.CLEAR, fill: 'F1F1F1' }, children: [new TextRun({ text: l, font: 'Consolas', size: 18 })] }))));
kids.push(NOTE('부품 옵션 행 중 사이트에 표시·판매 중인 것은 24,189건이고 116,850건은 숨겨진 템플릿 행(가격 0 또는 미사용)이다. 쇼핑몰 데이터로는 is_display=\'T\' 행만 쓴다(v_addon_catalog 뷰가 이미 필터링).'));

// 5 가격 규칙
kids.push(H1('5. 가격 규칙'));
kids.push(table(['규칙', '내용'], [
  ['상품 가격대', `${fmt(cnt.minP)}원 ~ ${fmt(cnt.maxP)}원 (VAT·배송비·관부가세 포함 표시)`],
  ['출고 방식', `제작주문 ${cnt.mto}개(4~6개월), 국내재고 ${cnt.stock}개(수도권 2주), 리퍼브 ${cnt.refurb}개`],
  ['국내재고 가격', '같은 이름의 국내재고 = 제작주문 × 1.028 (397쌍, 1.0275~1.0288)'],
  ['소비자가와 판매가', '제작주문은 동일, 국내재고 443개는 판매가 < 소비자가(평균 0.96, 범위 0.84~0.97)'],
  ['최적할인가', '판매가의 약 4% 아래 — 회원가입 후 무통장입금 시'],
  ['쿠폰', '3%(500만 원 이상), 5%(1,000만 원 이상)'],
  ['색상별 가격', '29개 상품만 색상별로 다름(테이블 상판 등)'],
  ['이노스 5칸', '2종: 제작주문 325,000 / 국내재고 344,000, 14색'],
  ['바퀴 추가금', '3벌: +111,000/88,000/66,000, +117,000/94,000/70,000, +166,000/133,000/99,000'],
], [2100, 6926]));
kids.push(H2('5.1 구성 가격 식'));
kids.push(P('가로 m칸 × 세로 n단 격자가 한 가지 모드로 통일된 상품은 가격 ≈ 상수 + a·m + b·n + c·m·n 에 거의 정확히 맞는다.'));
kids.push(table(['모드', '표본', 'R²', '상수', 'a(m)', 'b(n)', 'c(m·n)', '최대 오차'], [
  ['도어형', '25', '0.99991', '40,700', '212,240', '157,800', '798,340', '1.6%'],
  ['도어없음', '24', '0.99971', '26,810', '215,780', '161,340', '429,258', '2.6%'],
  ['오픈', '13', '0.99940', '46,061', '216,412', '79,218', '289,825', '2.8%'],
], [1300, 800, 1000, 1100, 1200, 1200, 1200, 1226]));
kids.push(NOTE('복합 이름(도어 일부, 가로 500/350, 깊이 500, 서랍 등)까지 하나의 식으로 묶으면 R² 0.94(중앙값 오차 6.3%)라 부족하다. 실제 판매가는 DB 값을 쓰고, 식은 새 구성의 가격 추정과 이상값 점검에만 쓴다.'));

// 6 구성기
kids.push(H1('6. 상품 구성기(Catalog Viewer) 명세'));
kids.push(P('상세 페이지의 색·시점 미리보기 도구다. 이미지만 바꾸는 미리보기 레이어이고, 구매 옵션은 카페24 기본 select가 따로 담당한다(구성기에서 색을 눌러도 장바구니 옵션은 자동 선택되지 않는다. 기본 색상 select 변경 → 구성기 색 변경 방향으로만 동기화).'));
[
  '데이터(data-* JSON): assets(키→이미지 URL), colors[{code,name,hex}], bases[[코드,이름,추가금]], thumbnails, dimensions{base,wheels}, initial-color, title',
  '이미지 키 규칙: <색코드>-<시점>(official/front/left/right/top), <색코드>-open(문 열림), <대표색>-<바퀴>, <대표색>-glass_<바퀴>',
  '컨트롤: 시점 5개, 문 열기 토글, 색상 스와치 14, 바퀴 선택(기본 발/고정 4/고정 2+일반 2/일반 4), 상단 패널(기본/유리 +177,000), 박스 인서트, 치수(가로·높이·깊이)',
  '규모: 구성기 보유 상품 792개, 이미지 키 19,278개(상품당 평균 24.3, 최대 92), 고유 URL 10,117개, 전부 webp',
  '구현 요구: 구성(447종) × 색(14) × 시점(5) 사전 렌더가 필요하다. 공통 viewer 하나를 데이터 JSON으로 구동하면 상품별 보정 코드(더리움은 31개 모듈)가 필요 없다.',
].forEach((t) => kids.push(B(t)));

// 7 주문·기능
kids.push(H1('7. 주문·결제 흐름과 기능 API'));
kids.push(P('흐름: 상품 상세 → 장바구니(POST /exec/front/order/basket/) → 주문서(/order/orderform.html?basket_type=all_buy) → 결제예약(POST /order/reserve/) → 금액계산(POST /order/Calculationcreate/).'));
kids.push(table(['기능', '엔드포인트', '비고'], [
  ['장바구니', 'POST /exec/front/order/basket/', 'product_submit'],
  ['금액계산', 'POST /exec/front/order/Calculationcreate/', '필드: mobile, member_id, shipping_type, payment_method, country_code, carrier_id, zipcode, address_full, address_state, points_spent_amount, order_coupons, items (배송유형 A=국내/B=해외)'],
  ['혜택·색상·하위카테고리', 'Product/Benefitinfo, Colorimage, SubCategory', ''],
  ['로그인·가입', 'POST /exec/front/Member/login/, join/', '소셜 6종, 비회원 구매'],
  ['WebMCP', '/api/mcp (X-Cafe24-Surface: webmcp)', 'AI 에이전트용 도구 11종 선언 — 페이지가 선언한 것이라 호출하지 않음'],
], [1900, 3200, 3926]));
kids.push(NOTE('주문서 화면과 결제수단 목록은 장바구니가 비어 있고 주문 제출을 하지 않아 확인하지 못했다. 사이트가 안내하는 결제는 무통장입금(입금자명 일치, 23시간 내 입금, 미입금 자동취소)이다.'));

// 8 외부 서비스·SEO
kids.push(H1('8. 외부 서비스, SEO, 접근성'));
kids.push(table(['영역', '서비스'], [
  ['쇼핑몰 코어', '카페24'], ['후기', 'Crema (네이버 스마트스토어 후기 연동)'], ['채팅', '채널톡'], ['팝업', '카페24 스마트팝업'],
  ['분석·광고', 'GTM, GA4, Naver WCS, Kakao SDK, Google Ads, Meta Pixel, 네이버 NAC'], ['오류 수집', '카페24 JET'], ['개인 서버', 'reum.me (구성기·보정 스크립트)'],
], [2200, 6826]));
kids.push(H2('8.1 점검 결과와 개선 요구사항'));
[
  '있음: title, meta description, canonical, og 6종, lang="ko", viewport. 상품 페이지에 JSON-LD 1건.',
  '없음: twitter 카드, robots 메타, 홈·목록 구조화 데이터.',
  '접근성: 상품 상세 평균 img 22.6개, alt 누락 5,186건(848페이지), alt 빈 값 7,228건, 상품 페이지 h1 2개(표본).',
  '성능: 상세 HTML 평균 396KB(최대 1.08MB), 상세 한 화면 요청 약 120건.',
  '우리 쇼핑몰 요구사항: 구조화 데이터 확대, alt 채우기, h1 1개, 상세 HTML 경량화.',
].forEach((t) => kids.push(B(t)));

// 9 회원 전용 / 개인결제창
kids.push(H1('9. 회원 전용 상품과 개인결제창'));
kids.push(table(['구분', '개수', '처리'], [
  ['개인결제창(고객별 결제 페이지)', '901', '구조만 기록, 이름·금액·본문은 저장하지 않음'],
  ['접근 불가(홈으로 이동)', '42', '내용 없음'],
  ['실제 상품', '32', 'DB 추가(access=members_only, 카테고리 35 CUSTOM ORDER)'],
], [3600, 1200, 4226]));
kids.push(H2('9.1 개인결제창은 어떻게 만들어져 있나'));
[
  '카테고리 35 "CUSTOM ORDER"의 일반 상품이다. 상품명은 "OOO 고객님 개인결제창"(끝에 (확장)/(일반배송)/(빠른배송) 등이 붙기도 함).',
  '정보 칸은 상품명·브랜드·판매가·최적할인가·배송방법·배송비·할인혜택·구매방법·수량. 판매가 칸이 고객별 결제 금액의 자리다. 설명 본문은 비어 있고 대부분 옵션이 없다(일부는 부품 옵션 포함).',
  '버튼과 탭은 일반 상품과 같다(관심상품/장바구니/바로구매, 상세/이용안내/리뷰). 관리자가 고객마다 상품을 만들고 링크를 보내는 방식으로 보인다.',
  '만들 때 필요한 정보: 고객 식별 이름(또는 별칭), 결제 금액(KRW, VAT 포함), 배송 방식·비용, 수량 1, 필요 시 부품 옵션, 카테고리 35.',
].forEach((t) => kids.push(B(t)));
kids.push(NOTE('위험: 접근 제한이 "일반회원 이상"뿐이라 로그인한 회원은 다른 고객의 결제 페이지도 열 수 있다. 우리는 고객별 토큰이나 본인 확인으로 반드시 막는다.'));
kids.push(H2('9.2 회원 전용 실제 상품 32개'));
kids.push(P('"[확장시공] 1x2 → 1x3", "2x2 커스텀", "USM 3x2 · 드롭다운 도어 6개" 같은 빠른배송 맞춤 구성 상품이다. 가격은 108,000원부터 8,185,000원까지이고, 색상 옵션이나 설명 없이 이노스 5칸(국내재고 +344,000원, 14색)만 추가구성으로 붙는다.'));

// 10 판매 통계
kids.push(H1('10. 판매 통계 (후기 기반 대리 지표)'));
kids.push(NOTE('후기 수는 판매 수가 아니다. 후기 작성률을 알 수 없어 상대 비중과 추세를 보는 용도로만 쓴다. 다른 회원의 주문 내역은 볼 수 없다.'));
kids.push(table(['항목', '결과'], [
  ['수집', '공개 후기 2,869건 (2021-09-14 ~ 2026-11-02), 작성자·본문 미저장'],
  ['채널', '네이버 스마트스토어 80.5%, 자사몰 19.5% (스마트스토어 후기는 2023-07부터)'],
  ['추세', '2023: 301 / 2024: 716 / 2025: 970 / 2026(~11/2): 800건, 최근 12개월 964건(월 52~109)'],
  ['상품 유형', '수납 모듈 83.0%, TV장 7.0%, 협탁 6.4%, 테이블 1.9%'],
  ['출고 방식', '국내재고 92.2%, 그 외 7.5%, B급 0.3%'],
  ['구성(수납 모듈)', '1x2 50.5%, 1x3 20.1%, 2x2 16.2%. 오픈형 73.6%, 세로 2단 71.6%'],
  ['쏠림', '상위 1개 상품 31.1%, 상위 5개 57.2%'],
  ['가격대', '150~250만 원 49.5%, 250~350만 26.6%, 350~500만 12.1%'],
], [2100, 6926]));
kids.push(P('시사점: 이 쇼핑몰의 수요는 "1x2~2x2 크기의 오픈형 국내재고 모듈"에 집중되어 있다. 우리 쇼핑몰의 초기 재고·상품 구성은 이 영역을 우선 검토한다.'));

// 11 총판 조사
kids.push(H1('11. 공급·총판 조사 요약'));
kids.push(P('한국 개인 소비자에게 판매할 브랜드를 고르기 위해 유럽 가구 브랜드의 한국 공식 총판 유무를 1차 조사했다(웹 검색 중심, 공식 판매처 페이지는 대부분 열지 못함).'));
kids.push(table(['구간', '한국 유통사 확인', '불분명', '못 찾음', '합계'], [...bt.rows, ['합계', String(tot[1]), String(tot[2]), String(tot[3]), String(tot[4])]], [3300, 1500, 1200, 1300, 1726]));
kids.push(NOTE('"못 찾음"은 총판이 없다는 확정이 아니다. Timothy Oulton은 "못 찾음"이었으나 기사로 현대백화점 단독 전개가 확인되어 정정했다. 이 목록은 정밀 검증이 필요한 후보로만 쓴다.'));
kids.push(P('USM Haller는 한국 총판(스페이스로직)이 있지만 더리움이 독일 공급사에서 병행수입해 판매 중이다. 운영자 진술에 따라 공급사가 같고 라이선스 문제가 없다면 총판 유무만으로 후보를 제외하지 않고, 공급사 취급 브랜드 목록으로 후보를 좁히는 것이 다음 단계다.'));
kids.push(H2('11.1 운영 정책 참고(더리움)'));
kids.push(table(['항목', '내용'], [
  ['배송', '제작주문 4~6개월(생산 2~3 + 해상 2~3), 국내재고 수도권 2주/비수도권 3주, 설치 배송, 수령 시 2차 검수'],
  ['가격 표시', '배송비·관부가세 포함(더리움 명의 사업자 통관), 제주·도서 산간 불가'],
  ['취소·환불', '제작주문은 취소 어려움(불가피 시 15% 위약금), 국내재고는 단순 변심 취소 가능'],
  ['A/S', '수령일부터 3년 무상(사용자 과실 제외), 부품 교체'],
  ['정품', '"유럽 공식 딜러 병행수입, 부품 USM 각인으로 100% 정품"(사이트 주장)'],
], [1700, 7326]));
kids.push(NOTE('위 정책은 참고용이다. 우리 쇼핑몰의 정책은 법률 검토 후 별도로 작성한다.'));

// 12 운영·서비스·마케팅
kids.push(H1('12. 운영 방식·서비스·마케팅 조사'));
kids.push(NOTE('근거 구분: [사이트]=사이트가 직접 밝힌 내용, [후기]=공개 후기 2,873건 텍스트 집계, [외부]=외부 웹, [미확인]=찾지 못함. 네이버(스마트스토어·쇼핑·블로그)는 안전 제한과 자동 접속 차단으로 열지 못했고, 인스타그램은 비로그인 공개 화면까지만 확인했다(계정 생성·로그인 안 함).'));
kids.push(H2('12.1 주문에서 AS까지'));
kids.push(table(['단계', '방식', '근거'], [
  ['상담·주문', '자사몰 또는 네이버 스마트스토어(빠른배송상품 중심). 등록되지 않은 모듈은 카카오톡 채널/채널톡으로 문의. 상담 평일 9~18시', '[사이트]·[외부]'],
  ['결제·발주', '무통장입금(23시간 내). 재고 없는 상품은 접수 24시간 후 자동 발주. 제작주문은 취소 어렵고 불가피 시 15% 위약금', '[사이트]'],
  ['제작·운송', '제작주문 4~6개월(생산 2~3 + 해상 2~3), 국내재고 수도권 2주/비수도권 3주', '[사이트]'],
  ['통관', '더리움 명의 사업자 통관, 관·부가세 더리움 납부(표시가 포함)', '[사이트]'],
  ['배송', '화물 택배 미사용, 배송팀("Assemblee 팀")이 직접 배송. 해피콜 일정 조율, 가능하면 완조립/아니면 반조립, 당일 설치. 일정 조율이 안 되면 문앞 배송(동일 클리닝·2차 검수, 사진·영상)', '[사이트]'],
  ['현장 조건', '지역별 추가 배송비 없음(제주·도서 산간 불가). 계단·사다리차·추가 인력 등은 추가 요금. 설치 공간은 미리 비우고 기존 가구 철거·내림은 안 함', '[사이트]'],
  ['설치·검수', '수령 시 현장에서 고객과 함께 2차 검수, 취급 유의사항·관리 방법 안내, 클리닝', '[사이트]·[후기]'],
  ['AS', '수령일부터 3년 무상(사용자 과실 유상), 부품 단위 교체, 사진을 카카오톡 채널로 보내면 견적 안내', '[사이트]'],
  ['사후 서비스', '모듈 확장·변형(타 구매처 모듈 최초 등록비 최대 30만 원), 이전 설치(가로 3칸 이상, 이사 1개월 전 문의), 무료 클리닝 서비스, 복원서비스(내용 미확인)', '[사이트]·[외부]'],
  ['지연 보상', '안내한 기간보다 지연되면 위약금 없이 환불', '[사이트]'],
], [1500, 6226, 1300]));
kids.push(H2('12.2 서비스 약속과 정품 주장'));
['01 USM 구매 후 모듈 변형이 자유롭다(전문 조립·해체 팀).', '02 수령 시 발견된 하자는 끝까지 책임(현장 공동 검수).', '03 사용 중 생기는 하자도 AS 지원.', '04 프리미엄 배송서비스: 현장 검수 → 취급 유의사항 전달 → 클리닝, 화물 택배 미사용.', '05 고객과의 약속 최우선: 지연 시 위약금 없는 환불.', '정품: 유럽 현지 공식 딜러십 업체를 통한 병행수입, USM 각인(볼·커넥터·힌지·패널 안쪽)으로 확인.'].forEach((t) => kids.push(B(t)));
kids.push(H2('12.3 후기에서 본 실제 응대 (공개 후기 2,873건)'));
kids.push(table(['주제', '건수', '비율'], [
  ['친절·꼼꼼한 설명', '1,251', '43.5%'], ['설치 기사·설치·조립 언급', '1,235', '43.0%'], ['빠른 배송', '445', '15.5%'], ['재구매·추천', '300', '10.4%'],
  ['가격', '264', '9.2%'], ['배송 지연·오래 걸림', '162', '5.6%'], ['AS·문의 응대 언급', '153', '5.3%'], ['정품·각인', '115', '4.0%'],
  ['모듈 변형·확장', '83', '2.9%'], ['검수·포장', '83', '2.9%'], ['클리닝', '72', '2.5%'], ['하자·파손·스크래치', '51', '1.8%'],
], [5000, 2000, 2026]));
kids.push(P('해석: 칭찬은 설치 기사의 친절·설명과 설치 품질(약 43%), 그다음이 빠른 배송(국내재고)이다. 불만은 주로 제작주문의 긴 대기와 일부 하자다. 단순 키워드 매칭이라 대략치이며, 자사 게시판·스마트스토어 후기라 제3자의 객관 평가는 아니다. 작성자와 본문은 저장하지 않았다.'));
kids.push(H2('12.4 브랜드: 로고·색·슬로건'));
[
  '로고: 워드마크 "THE REUM" — 기하학적 산세리프 대문자, R의 가로 획이 잘려 이어지는 형태, 진한 청록(#173D3B). 보조 모티프는 12각 스타버스트와 이모지 💚.',
  '슬로건: "프리미엄 배송으로 프리미엄 가구의 가치를" / "프리미엄 가구의 가치를 프리미엄 서비스로 전달합니다" / "USM 정품은 더리움에서" / "USM은 왜 더리움에서 구매해야 할까요?" / "우리집 공간에 맞게".',
  '직원 복장·차량·작업 도구: [미확인] 사이트·인스타그램 공개 화면·웹 검색에 정보가 없다. 배송팀 이름 "Assemblee"만 사이트에 나오며 이 업체는 검색으로 확인되지 않았다(더리움 소속인지 외주인지도 불명). 확인하려면 더리움에 직접 문의하거나 후기 사진을 사람이 직접 살펴봐야 한다.',
].forEach((t) => kids.push(B(t)));
kids.push(H2('12.5 마케팅 방식과 채널'));
kids.push(table(['채널', '내용'], [
  ['자사몰(카페24)', '띠배너 "회원가입 후 무통장입금시 4%추가할인", 금액대별 쿠폰(500만↑ 3%, 1,000만↑ 5%), Best Review, 일반/빠른배송 탭, 사이즈별 진열'],
  ['네이버 스마트스토어', 'smartstore.naver.com/thereum, 빠른배송상품 중심. 후기의 80.5%가 이 채널(2023-07~), Crema로 자사몰 후기에 연동. 상품·가격은 접근 제한으로 미수집'],
  ['인스타그램', '@the_reum, 팔로워 약 1.1만, 게시물 221개, 제품 사진 중심(월 1~3건). 하이라이트 REVIEW·EVENT·NOTICE'],
  ['링크트리·카카오·채널톡', '링크트리가 홈페이지·스마트스토어·후기·카카오톡 채널·무료 클리닝을 묶음. 카카오톡 채널이 상담·AS·확장·이전 설치 접수의 중심'],
  ['후기 마케팅', 'Crema 후기, 사진·영상 후기(약 89%가 미디어 포함), 홈 후기 마퀴, 인스타 REVIEW 하이라이트'],
], [2200, 6826]));
kids.push(H3('광고 노출(확인한 범위)'));
[
  '사이트에 설치된 광고·분석 태그: Google Ads 전환·리마케팅, Meta Pixel, 네이버 WCS·NAC, GTM·GA4, 카카오 SDK. 구글·메타·네이버 광고를 집행했거나 준비했을 가능성을 보여 주는 정황이다.',
  'Google 광고 투명성 센터(thereum.co.kr, 대한민국)에는 광고 0개, Meta 광고 라이브러리(대한민국, "더리움 USM")에도 결과가 없었다. 현재 노출 중인 공개 광고는 확인하지 못했다.',
  '확인 불가: 네이버 파워링크·쇼핑검색광고·GFA, 카카오 광고, 인스타그램 협찬·인플루언서, 유튜브 광고.',
].forEach((t) => kids.push(B(t)));
kids.push(H2('12.6 참고: 공식 수입원 비교'));
kids.push(P('스페이스로직(공식 수입원)은 검색 결과 요약 기준으로 택배·협력업체 화물·직접 배송 3방식, 대형 제품은 전문 엔지니어 팀이 방문 설치, 지역별 배송비(서울·경기 무료 / 충청 7만 / 경상·전라 11만 / 강원 14만 / 도서·제주 30만), 사다리차 비용은 구매자 부담이다. 더리움은 전국 추가 배송비 없음(제주·도서 제외)과 현장 2차 검수·클리닝을 내세운다. 두 회사의 실제 설치 품질을 비교한 객관 자료는 찾지 못했다.'));
kids.push(P('상세 원문은 thereum/OPERATIONS_MARKETING.md, 데이터는 엑셀의 운영방식(주문~AS)·서비스약속·브랜드·고객응대(후기통계)·마케팅·채널 시트에 있다.'));

// 13 주의사항
kids.push(H1('13. 법적·운영 주의사항'));
[
  '저작권: 상품 설명 문구와 구성기 이미지는 출처 사이트의 자산이다(사이트에 "이미지는 더리움의 자산"이라고 명시). DB에는 설명 원문과 이미지 주소만 담았으며, 게시 전에 자체 문구로 재작성하고 이미지는 자체 제작이나 공급사 제공 자료를 쓴다.',
  '개인정보: 고객별 결제 페이지와 후기 작성자 정보는 저장하지 않았다. 우리 쇼핑몰의 맞춤 결제 기능은 접근 제어를 필수로 한다.',
  '병행수입: 한국 총판이 있는 브랜드의 병행수입에서는 상표권·AS·표시 의무 문제가 생길 수 있다. 변리사/관세사 확인이 필요하다(미확인).',
  '통관: 더리움은 사업자 통관을 하고 관부가세를 표시가에 포함한다. 우리도 사업자 통관 구조와 세금 처리 방식을 확인한다.',
  '결제: 무통장입금 중심이다. 카드(PG) 연동은 계약과 비용이 따르므로 별도 승인이 필요하다.',
].forEach((t) => kids.push(B(t)));

// 13 미확인 / 로드맵
kids.push(H1('14. 미확인 사항과 후속 작업'));
kids.push(table(['항목', '상태', '내용'], [
  ['회원 등급별 가격', '미확인', '로그인 후 가격이 달라지는지 확인하지 않음'],
  ['주문서·결제수단', '미확인', '장바구니가 비어 진입하지 못함'],
  ['마이페이지·관리자', '미확인', '관리자는 비공개'],
  ['재고 실수량', '미확인', '사이트가 0으로만 표시'],
  ['스마트스토어', '수집 불가', '네이버 도메인 차단. 스토어 주소와 화면 캡처/저장 파일을 받으면 정리 가능'],
  ['이미지 파일', '미수집', '주소만 저장'],
  ['USM 한국 상표권·병행수입 표시 의무', '미확인', '법률 검토 필요'],
  ['총판 조사 정밀 검증', '후속', '공급사 취급 브랜드 목록으로 후보를 좁힌 뒤 브랜드별 조사'],
  ['신규 상품', '주기 점검', 'probe-range.js로 상품번호 신규 추가 확인'],
], [2800, 1400, 4826]));
kids.push(H2('14.1 쇼핑몰 제작 순서(제안)'));
[
  '결정: 카페24 스킨 방식 vs 직접 개발, 병행수입 법률 검토, 공급사 취급 브랜드 확정.',
  '상품 데이터: 공급사 카탈로그로 상품·옵션·부품 마스터를 이 DB 구조(4장)로 구축.',
  '이미지: 구성기 이미지 확보(공급사 제공 또는 자체 렌더 파이프라인).',
  '화면 5종 우선: 홈, 카테고리 목록, 상품 상세(+구성기), 장바구니/주문, 로그인/가입.',
  '결제·세금: 무통장입금(+가상계좌) 우선, 사업자 통관·관부가세 표시 방식 확정.',
  '운영 기능: 맞춤 결제 링크(접근 제어 포함), 후기, 채팅, 분석 태그.',
].forEach((t) => kids.push(N(t)));

// 부록
kids.push(H1('부록 A. 파일 목록'));
kids.push(table(['파일', '쓰임'], [
  ['thereum_쇼핑몰_개발자료.xlsx', '통합 데이터 26개 시트(목차 시트에서 보고용/개발용 구분)'],
  ['thereum/thereum_catalog.sqlite', '원본 DB(숨김 템플릿 옵션 행 포함)'],
  ['thereum/export/*.csv', '테이블별 CSV(UTF-8 BOM)'],
  ['thereum/BUILD_BLUEPRINT.md, ANALYSIS.md, DB_README.md, SALES_STATS.md', '설계서·분석·DB 안내·판매 통계'],
  ['thereum/build-db.js, verify-db.js', 'DB 생성과 25개 항목 검증'],
  ['thereum/crawl*.js, probe-*.js', '읽기 전용 수집·번호 조회 스크립트'],
  ['thereum/screens/', '화면 캡처'],
  ['nordic.md 외 3개', '총판 조사 원표'],
], [4200, 4826]));
kids.push(H1('부록 B. 엑셀 시트 안내'));
kids.push(table(['구분', '시트'], [
  ['보고용', '요약(보고), 판매통계_월별후기/상품별후기/요약, 정책·운영, 회원전용·개인결제창, 총판조사_브랜드, 가격모델, 미확인·후속'],
  ['개발 재사용', '상품, 색상SKU, 부품상품, 부품옵션, 상품-부품연결, 카테고리, 색상, 구성기_바퀴/치수/이미지URL, 페이지·URL, 디자인·레이아웃, 기능·API, 외부서비스, SEO·접근성·성능, 파일목록'],
], [1600, 7426]));

// ---------- 문서 조립
const doc = new Document({
  creator: 'Claude', title: 'thereum.co.kr 분석 통합 보고서', features: { updateFields: true },
  styles: {
    default: { document: { run: { font: FONT, size: 21 } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: FONT, size: 30, bold: true, color: BRAND }, paragraph: { spacing: { before: 360, after: 160 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: FONT, size: 25, bold: true, color: BRAND }, paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1 } },
      { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: FONT, size: 22, bold: true }, paragraph: { spacing: { before: 160, after: 80 }, outlineLevel: 2 } },
    ],
  },
  numbering: {
    config: [
      { reference: 'bul', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 270 } } } }, { level: 1, format: LevelFormat.BULLET, text: '–', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 1000, hanging: 270 } } } }] },
      { reference: 'num', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 360 } } } }] },
    ],
  },
  sections: [{
    properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, right: 1440, bottom: 1300, left: 1440 } } },
    headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: 'thereum.co.kr 분석 통합 보고서', font: FONT, size: 16, color: '888888' })] })] }) },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: ['- ', PageNumber.CURRENT, ' -'], font: FONT, size: 16, color: '888888' })] })] }) },
    children: kids,
  }],
});
Packer.toBuffer(doc).then((buf) => {
  let target = OUT;
  try { fs.writeFileSync(target, buf); }
  catch (e) {
    if (e.code !== 'EBUSY' && e.code !== 'EPERM') throw e;
    target = OUT.replace(/\.docx$/, '_상품명수정본.docx'); // 기존 파일이 열려 있어 덮어쓸 수 없을 때
    fs.writeFileSync(target, buf);
    console.log('원본이 열려 있어 새 이름으로 저장');
  }
  console.log('saved', target, buf.length, 'bytes, elements', kids.length);
});
