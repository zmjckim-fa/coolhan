// 운영 설계서(.docx) — 더리움 벤치마크를 근거로 한 "우리 쇼핑몰" 운영·서비스·마케팅 설계. 실행: DOCX_DIR=... node build_ops_docx.js
const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, HeadingLevel, AlignmentType, LevelFormat,
  WidthType, ShadingType, BorderStyle, TableOfContents, PageBreak, Header, Footer, PageNumber,
} = require(process.env.DOCX_DIR + '/node_modules/docx');
const C = require('./ops_content.json');
const OUT = path.resolve(__dirname, '..', 'thereum_벤치마크_운영설계서.docx');
const FONT = '맑은 고딕', BRAND = '173D3B';

const run = (t, o = {}) => new TextRun({ text: t, font: FONT, size: o.size || 21, bold: o.bold, color: o.color });
const P = (t, o = {}) => new Paragraph({ spacing: { after: o.after ?? 120, line: 300 }, children: [run(t, o)] });
const H1 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 360, after: 160 }, children: [new TextRun({ text: t, font: FONT, bold: true, size: 30, color: BRAND })] });
const H2 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 120 }, children: [new TextRun({ text: t, font: FONT, bold: true, size: 25, color: BRAND })] });
const B = (t) => new Paragraph({ numbering: { reference: 'bul', level: 0 }, spacing: { after: 70, line: 290 }, children: [run(t)] });
const N = (t) => new Paragraph({ numbering: { reference: 'num', level: 0 }, spacing: { after: 70, line: 290 }, children: [run(t)] });
const NOTE = (t) => new Paragraph({ spacing: { before: 80, after: 140, line: 290 }, shading: { type: ShadingType.CLEAR, fill: 'FFF4CE' }, border: { left: { style: BorderStyle.SINGLE, size: 18, color: 'D9A400', space: 6 } }, children: [run(t, { size: 20 })] });
const bd = { style: BorderStyle.SINGLE, size: 4, color: 'CCCCCC' };
const borders = { top: bd, bottom: bd, left: bd, right: bd };
const cell = (text, w, o = {}) => new TableCell({
  borders, width: { size: w, type: WidthType.DXA }, verticalAlign: 'top',
  shading: o.fill ? { type: ShadingType.CLEAR, fill: o.fill } : undefined, margins: { top: 50, bottom: 50, left: 90, right: 90 },
  children: String(text ?? '').split('\n').map((t) => new Paragraph({ spacing: { after: 20 }, alignment: o.align, children: [new TextRun({ text: t, font: FONT, size: o.size || 17, bold: o.bold, color: o.color })] })),
});
const table = (headers, rows, widths) => new Table({
  width: { size: widths.reduce((a, b) => a + b, 0), type: WidthType.DXA }, columnWidths: widths,
  rows: [new TableRow({ tableHeader: true, children: headers.map((h, i) => cell(h, widths[i], { bold: true, color: 'FFFFFF', fill: BRAND, align: AlignmentType.CENTER })) }),
    ...rows.map((r, ri) => new TableRow({ cantSplit: true, children: r.map((c, i) => cell(c, widths[i], { fill: ri % 2 ? 'F6F8F8' : undefined })) }))],
});

const k = [];
// 표지
k.push(new Paragraph({ spacing: { before: 2200, after: 200 }, children: [new TextRun({ text: '유럽 명품가구 구매대행 쇼핑몰', font: FONT, bold: true, size: 48, color: BRAND })] }));
k.push(new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: '운영·서비스·마케팅 설계서', font: FONT, bold: true, size: 48, color: BRAND })] }));
k.push(new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: 'thereum(더리움) 벤치마크 기반 — 주문·배송·설치·AS·고객응대·광고 운영안', font: FONT, size: 26 })] }));
k.push(P('작성일 2026-11-03'));
k.push(NOTE('이 문서의 표기: [확인] = 더리움에서 확인된 사실(사이트·후기·공개 화면 근거) / [제안] = 우리가 정해야 할 설계안(후기 근거 + 업계 일반) / [결정] = 운영자가 정해야 할 값 / [검토] = 법률·세무·변리 전문가 확인 필요. 더리움의 차량·직원 복장·작업 도구는 공개 자료가 없어 [제안]으로 표시했다. 금액·비율은 엑셀 "원가·가격계산기"의 예시 값이며 실제 값이 아니다.'));
k.push(new Paragraph({ children: [new PageBreak()] }));
k.push(new Paragraph({ children: [new TextRun({ text: '목차', font: FONT, bold: true, size: 30, color: BRAND })], spacing: { after: 160 } }));
k.push(new TableOfContents('목차', { hyperlink: true, headingStyleRange: '1-2' }));
k.push(new Paragraph({ children: [new PageBreak()] }));

// 1
k.push(H1('1. 목적과 전제'));
k.push(P('목적: 유럽 명품 가구를 한국 개인 소비자에게 판매하는 구매대행(병행수입) 쇼핑몰을 열고 운영한다. 같은 방식으로 이미 잘 운영되는 thereum.co.kr(더리움)을 벤치마크해, 우리가 그대로 따라 할 것과 더 잘할 것을 정한다.'));
['공급: 운영자 진술에 따라 독일 공급사가 더리움의 공급사와 같고, 병행수입이며, 라이선스 문제는 없다(근거 문서는 보지 못함 — [검토]).',
  '판매 대상: 한국 개인 소비자(법인·사업장은 별도 견적 채널).',
  '이 문서가 답하는 질문: ① 주문부터 AS까지 어떻게 운영하나 ② 현장팀(차량·복장·도구)은 어떻게 꾸리나 ③ 고객 응대는 어떻게 하나 ④ 어떤 채널에서 어떻게 팔고 광고하나 ⑤ 오픈까지 무엇을 해야 하나.'].forEach((t) => k.push(B(t)));

// 2
k.push(H1('2. 더리움 벤치마크: 잘하는 것과 약점'));
k.push(H2('2.1 후기와 사이트에서 확인된 성공 요인'));
k.push(table(['요인', '내용', '근거'], C.benchmark, [1900, 5826, 1300]));
k.push(H2('2.2 약점(우리가 개선할 부분)'));
k.push(table(['항목', '내용'], C.weakness, [2200, 6826]));
k.push(NOTE('후기에서 칭찬이 가장 많은 것은 설치 기사의 친절·설명(43.5%)과 설치 품질(43.0%)이고, 다음이 빠른 배송(15.5%)이다. 즉 이 사업의 신뢰는 "물건"보다 "집에 오는 사람과 절차"에서 만들어진다. 하자·파손 언급은 1.8%로 낮다. 단순 키워드 집계이며 자사 게시판·스마트스토어 후기라 객관적 제3자 평가는 아니다.'));

// 3
k.push(H1('3. 우리 서비스 약속(안)'));
k.push(table(['번호', '약속', '내용', '근거/상태'], C.promises, [600, 1500, 4726, 2200]));
k.push(P('슬로건 후보(더리움 문구와 겹치지 않게 만든 초안, [제안]):'));
C.slogans.forEach((s) => k.push(B(s)));

// 4
k.push(H1('4. 운영 SOP: 주문에서 AS까지'));
k.push(P('아래 표는 단계별로 누가 언제 무엇을 하는지 정리한 표준 절차다. 소요 기간 중 "더리움 기준"이라고 쓴 것은 [확인], 나머지는 [제안]이다. 엑셀 "SOP체크리스트" 시트에서 담당·기한·완료를 관리할 수 있다.'));
k.push(table(['단계', '담당', '시점/소요', '해야 할 일', '증빙'], C.sop, [1300, 900, 1400, 4200, 1226]));

// 5
k.push(H1('5. 현장 설치팀: 인원·차량·복장·도구'));
k.push(NOTE('더리움의 차량·직원 복장·작업 도구는 사이트·인스타그램 공개 화면·웹 검색에서 찾지 못했다. 후기에서 확인된 것은 2인 방문, 팀장급 담당자가 일정 조율과 설명을 맡는다는 점, 전용 천 광택 청소·관리제·WD·장갑 증정, 보호매트 추천, 수평 조절, 현장 부품 교체, 설치 후 사진 전송이다. 나머지는 업계 일반을 바탕으로 한 제안이다.'));
k.push(table(['구분', '항목', '사양(제안)', '용도', '근거'], C.field, [800, 1100, 3126, 2200, 1800]));
k.push(H2('5.1 현장 표준 절차(제안)'));
['방문 전날 일정 확정, 당일 출발 전 도착 예정 연락',
  '현관·복도에 보호 매트를 깔고 신발 커버 착용',
  '완조립 운반 또는 현장 조립, 위치 확정, 수평 조절',
  '고객과 함께 검수: 외관·도어 작동·잠금장치·각인 확인, 하자는 현장 교체 또는 AS 접수',
  '광택 청소, 관리 방법·정품 확인 방법 설명, 관리용품 전달',
  '설치 전·후 사진 촬영, 인수 확인서 서명, 포장재 정리',
  '당일 사진 전송과 후기 요청 메시지'].forEach((t) => k.push(N(t)));

// 6
k.push(H1('6. AS·클레임 정책 초안'));
k.push(table(['구분', '내용', '근거/상태'], C.as, [1900, 5000, 2126]));

// 7
k.push(H1('7. 고객 응대(CS) 매뉴얼'));
k.push(P('채널은 카카오톡 채널과 홈페이지 채널톡을 중심으로 하고(더리움 방식), 운영 시간은 평일 9~18시(더리움 기준)를 기본으로 하되 응답 목표 시간을 정한다. 상황별 답변 초안은 아래와 같다(엑셀 "CS스크립트" 시트에도 있음).'));
k.push(table(['상황', '고객 문의 예', '응대 핵심', '답변 초안', '에스컬레이션'], C.cs, [1100, 1300, 1300, 4200, 1126]));
k.push(H2('7.1 서비스 수준 목표(제안)'));
k.push(table(['항목', '목표', '근거'], C.kpi, [3000, 4500, 1526]));

// 8
k.push(H1('8. 마케팅·광고 운영안'));
k.push(P('더리움은 후기의 80.5%가 네이버 스마트스토어에서 나오고, 인스타그램은 제품 사진 위주로 월 1~3건 올리며, 링크트리·카카오톡 채널·채널톡으로 문의를 모은다. 광고는 구글 전환·메타 픽셀·네이버 전환 태그가 설치돼 있으나 공개 광고 라이브러리에서는 집행 중인 광고를 확인하지 못했다. 우리 운영안은 이 구조를 따르되 "사람과 현장"을 보여 주는 콘텐츠로 차별화한다.'));
k.push(table(['채널', '역할', '핵심 소재', 'KPI', '운영 포인트', '근거'], C.marketing, [1200, 1000, 2300, 1300, 2126, 1100]));
k.push(NOTE('광고비 규모와 채널별 배분은 엑셀 "원가·가격계산기"의 광고비 비율과 목표 마진에서 역산해 정한다. 이 문서의 비율은 모두 예시 값이다.'));

// 9
k.push(H1('9. 법률·세무·인허가 체크리스트'));
k.push(NOTE('아래 항목은 사업 시작 전에 전문가 확인이 필요한 목록이다. 법률 판단을 대신하지 않는다.'));
k.push(table(['항목', '확인 내용', '상태'], C.legal, [2000, 5000, 2026]));

// 10
k.push(H1('10. 오픈 로드맵(12주, 제안)'));
k.push(table(['기간', '주제', '할 일'], C.roadmap, [1000, 1400, 6626]));

// 11
k.push(H1('11. 리스크와 대응'));
k.push(table(['리스크', '영향', '대응'], C.risks, [2000, 2000, 5026]));

// 12
k.push(H1('12. 함께 쓰는 자료와 확인하지 못한 것'));
['thereum_쇼핑몰_개발자료.xlsx: 상품·SKU·부품·가격·구성기·판매통계 데이터와 이 문서의 도구 시트(SOP, CS, 마케팅, 현장 장비, 원가·가격계산기, 오픈 일정).',
  'thereum_쇼핑몰_분석보고서.docx: 사이트 구조·데이터 모델·가격 규칙·구성기 명세.',
  '확인하지 못한 것: 더리움 배송팀의 복장·차량·도구, "Assemblee" 업체의 정체, 네이버·카카오 광고 집행 여부, 스마트스토어 상품·가격, 복원서비스 내용.'].forEach((t) => k.push(B(t)));

const doc = new Document({
  creator: 'Claude', title: '운영·서비스·마케팅 설계서', features: { updateFields: true },
  styles: { default: { document: { run: { font: FONT, size: 21 } } }, paragraphStyles: [
    { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: FONT, size: 30, bold: true, color: BRAND }, paragraph: { spacing: { before: 360, after: 160 }, outlineLevel: 0 } },
    { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: FONT, size: 25, bold: true, color: BRAND }, paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1 } }] },
  numbering: { config: [
    { reference: 'bul', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 270 } } } }] },
    { reference: 'num', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 360 } } } }] }] },
  sections: [{
    properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, right: 1300, bottom: 1300, left: 1300 } } },
    headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: '운영·서비스·마케팅 설계서', font: FONT, size: 16, color: '888888' })] })] }) },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: ['- ', PageNumber.CURRENT, ' -'], font: FONT, size: 16, color: '888888' })] })] }) },
    children: k,
  }],
});
Packer.toBuffer(doc).then((b) => {
  let t = OUT;
  try { fs.writeFileSync(t, b); } catch (e) { if (e.code !== 'EBUSY' && e.code !== 'EPERM') throw e; t = OUT.replace(/\.docx$/, '_새이름.docx'); fs.writeFileSync(t, b); console.log('원본이 열려 있어 새 이름으로 저장'); }
  console.log('saved', t, b.length, 'bytes, elements', k.length);
});
