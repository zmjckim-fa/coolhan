// 서비스 정의서·고객 사용설명서 공통 서식. DOCX_DIR 환경변수에 docx 패키지가 설치된 폴더를 지정한다.
const fs = require('fs');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, HeadingLevel, AlignmentType, LevelFormat,
  WidthType, ShadingType, BorderStyle, TableOfContents, PageBreak, Header, Footer, PageNumber,
} = require(process.env.DOCX_DIR + '/node_modules/docx');

const FONT = '맑은 고딕', BRAND = '173D3B';
const CIRC = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩', '⑪', '⑫', '⑬', '⑭', '⑮'];
const numRefs = [];

const run = (t, o = {}) => new TextRun({ text: t, font: FONT, size: o.size || 21, bold: o.bold, color: o.color });
const P = (t, o = {}) => new Paragraph({ spacing: { after: o.after ?? 110, line: 310 }, indent: o.indent ? { left: o.indent } : undefined, keepNext: o.keepNext, children: [run(t, o)] });
const H1 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 360, after: 160 }, children: [new TextRun({ text: t, font: FONT, bold: true, size: 30, color: BRAND })] });
const H2 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 120 }, keepNext: true, children: [new TextRun({ text: t, font: FONT, bold: true, size: 25, color: BRAND })] });
const bullet = (t) => new Paragraph({ numbering: { reference: 'bul', level: 0 }, spacing: { after: 70, line: 300 }, children: [run(t)] });
const steps = (arr) => {
  const ref = 'n' + numRefs.length; numRefs.push(ref);
  return arr.map((t) => new Paragraph({ numbering: { reference: ref, level: 0 }, spacing: { after: 80, line: 300 }, children: [run(t)] }));
};
const box = (label, t, fill, edge) => new Paragraph({
  spacing: { before: 100, after: 160, line: 300 }, shading: { type: ShadingType.CLEAR, fill },
  border: { left: { style: BorderStyle.SINGLE, size: 20, color: edge, space: 6 } },
  children: [new TextRun({ text: label + '  ', font: FONT, size: 20, bold: true, color: edge }), run(t, { size: 20 })],
});
const NOTE = (t) => box('참고', t, 'F1F4F4', '5B7773');
const CAUTION = (t) => box('주의', t, 'FFF4CE', 'B38600');
const WARN = (t) => box('경고', t, 'FDE9E7', 'B3261E');
const bd = { style: BorderStyle.SINGLE, size: 4, color: 'BBBBBB' };
const borders = { top: bd, bottom: bd, left: bd, right: bd };
const cell = (text, w, o = {}) => new TableCell({
  borders, width: { size: w, type: WidthType.DXA }, verticalAlign: 'top',
  shading: o.fill ? { type: ShadingType.CLEAR, fill: o.fill } : undefined, margins: { top: 60, bottom: 60, left: 90, right: 90 },
  children: String(text ?? '').split('\n').map((t) => new Paragraph({ spacing: { after: 20, line: 280 }, alignment: o.align, children: [new TextRun({ text: t, font: FONT, size: o.size || 18, bold: o.bold, color: o.color })] })),
});
const table = (headers, rows, widths) => new Table({
  width: { size: widths.reduce((a, b) => a + b, 0), type: WidthType.DXA }, columnWidths: widths,
  rows: [new TableRow({ tableHeader: true, children: headers.map((h, i) => cell(h, widths[i], { bold: true, color: 'FFFFFF', fill: BRAND, align: AlignmentType.CENTER })) }),
    ...rows.map((r, ri) => new TableRow({ cantSplit: true, children: r.map((c, i) => cell(c, widths[i], { fill: ri % 2 ? 'F6F8F8' : undefined })) }))],
});
const PB = () => new Paragraph({ children: [new PageBreak()] });

// 조항: art('제12조', '인수 검사', ['본문1', ['하위1', '하위2'], '본문2'])
const art = (no, title, items) => {
  const out = [new Paragraph({ spacing: { before: 220, after: 80 }, keepNext: true, children: [new TextRun({ text: `${no}(${title})`, font: FONT, bold: true, size: 22 })] })];
  let n = 0;
  items.forEach((it) => {
    if (Array.isArray(it)) it.forEach((s, i) => out.push(new Paragraph({ spacing: { after: 50, line: 300 }, indent: { left: 720, hanging: 360 }, children: [run(`${i + 1}. ${s}`)] })));
    else if (items.filter((x) => !Array.isArray(x)).length === 1) out.push(new Paragraph({ spacing: { after: 70, line: 310 }, children: [run(it)] }));
    else out.push(new Paragraph({ spacing: { after: 70, line: 310 }, indent: { left: 360, hanging: 360 }, children: [run(`${CIRC[n++]} ${it}`)] }));
  });
  return out;
};

const build = ({ out, title, headerText, children }) => {
  const doc = new Document({
    creator: '서비스 기획', title, features: { updateFields: true },
    styles: { default: { document: { run: { font: FONT, size: 21 } } }, paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: FONT, size: 30, bold: true, color: BRAND }, paragraph: { spacing: { before: 360, after: 160 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: FONT, size: 25, bold: true, color: BRAND }, paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1 } }] },
    numbering: { config: [
      { reference: 'bul', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 270 } } } }] },
      ...numRefs.map((r) => ({ reference: r, levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 360 } } } }] })),
    ] },
    sections: [{
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, right: 1440, bottom: 1300, left: 1440 } } },
      headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: headerText, font: FONT, size: 16, color: '888888' })] })] }) },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: ['- ', PageNumber.CURRENT, ' -'], font: FONT, size: 16, color: '888888' })] })] }) },
      children,
    }],
  });
  return Packer.toBuffer(doc).then((b) => {
    let t = out;
    try { fs.writeFileSync(t, b); } catch (e) { if (e.code !== 'EBUSY' && e.code !== 'EPERM') throw e; t = out.replace(/\.docx$/, '_새이름.docx'); fs.writeFileSync(t, b); }
    console.log('저장:', t, b.length, 'bytes');
  });
};

const cover = (title, sub, meta) => [
  new Paragraph({ spacing: { before: 2400, after: 200 }, children: [new TextRun({ text: title, font: FONT, bold: true, size: 52, color: BRAND })] }),
  new Paragraph({ spacing: { after: 400 }, children: [new TextRun({ text: sub, font: FONT, size: 26 })] }),
  table(['항목', '내용'], meta, [2000, 7026]),
  PB(),
  new Paragraph({ children: [new TextRun({ text: '목차', font: FONT, bold: true, size: 30, color: BRAND })], spacing: { after: 160 } }),
  new TableOfContents('목차', { hyperlink: true, headingStyleRange: '1-2' }),
  PB(),
];

module.exports = { P, H1, H2, bullet, steps, NOTE, CAUTION, WARN, table, art, build, cover, PB, cell };
