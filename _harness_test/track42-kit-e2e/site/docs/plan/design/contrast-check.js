#!/usr/bin/env node
'use strict';
// web/tokens.css의 토큰 값을 읽어 WCAG 대비를 계산한다.
// 종료 코드: 0 전부 통과, 1 하나라도 실패, 2 토큰을 읽지 못함.
const fs = require('node:fs');
const path = require('node:path');

const TOKENS_FILE = path.join(__dirname, '..', '..', '..', 'web', 'tokens.css');
const MIN = { 글자: 4.5, 큰글자: 3, 경계: 3 };

// [앞 토큰, 바탕 토큰, 종류, 쓰는 곳]
const PAIRS = [
  ['color-text', 'color-surface', '글자', '본문'],
  ['color-text', 'color-page', '글자', '방문자 바탕 위 제목'],
  ['color-text', 'color-page-admin', '글자', '관리자 바탕 위 화면 제목'],
  ['color-text', 'color-surface-hover', '글자', 'C-13 올림'],
  ['color-text', 'color-accent-soft', '글자', 'C-13 오늘 행'],
  ['color-text-2', 'color-surface', '글자', '라벨, C-06 꺾쇠'],
  ['color-text-2', 'color-tab-strip', '글자', 'C-12 고르지 않은 탭'],
  ['color-text-3', 'color-surface', '글자', '보조 글, 입력 예시 글'],
  ['color-text-3', 'color-page', '글자', '방문자 바탕 위 보조 글'],
  ['color-text-3', 'color-page-admin', '글자', '관리자 바탕 위 보조 글'],
  ['color-text-3', 'color-surface-muted', '글자', '비활성 면 위 보조 글'],
  ['color-text-3', 'color-surface-hover', '글자', 'C-13 올림 위 보조 글'],
  ['color-accent', 'color-surface', '글자', 'C-02 글자, C-12 고른 탭, 링크'],
  ['color-accent', 'color-accent-tint', '글자', 'C-02 올림'],
  ['color-accent', 'color-accent-soft', '글자', 'C-14 글자, C-13 오늘 행의 글자 «오늘»'],
  ['color-on-accent', 'color-accent', '글자', 'C-01 기본, C-07 체크'],
  ['color-on-accent', 'color-accent-hover', '글자', 'C-01 올림과 누름'],
  ['color-text-on-dark', 'color-bar-admin', '글자', 'C-12 관리자 막대의 링크와 로그아웃'],
  ['color-text-on-dark', 'color-tooltip-surface', '글자', 'C-09 풍선말'],
  ['color-text-on-dark', 'color-page-login', '글자', 'C-12 S-02 바탕 위 링크'],
  ['color-text-on-dark', 'color-danger-text', '글자', 'C-11 제목 줄'],
  ['color-status-open-text', 'color-status-open-surface', '글자', 'C-08 open'],
  ['color-status-closed-text', 'color-status-closed-surface', '글자', 'C-08 closed'],
  ['color-status-dayoff-text', 'color-status-dayoff-surface', '글자', 'C-08 dayoff'],
  ['color-status-unset-text', 'color-status-unset-surface', '글자', 'C-08 unset'],
  ['color-sale-on-text', 'color-sale-on-surface', '글자', 'C-08 on_sale'],
  ['color-sale-soldout-text', 'color-sale-soldout-surface', '글자', 'C-08 sold_out'],
  ['color-danger-text', 'color-surface', '글자', 'C-03 글자, C-10 입력칸 아래'],
  ['color-danger-text', 'color-danger-surface', '글자', 'C-03 올림, C-10 띠'],
  ['color-status-open-text', 'color-status-open-surface', '큰글자', 'C-08 큰 것 open'],
  ['color-status-closed-text', 'color-status-closed-surface', '큰글자', 'C-08 큰 것 closed'],
  ['color-status-dayoff-text', 'color-status-dayoff-surface', '큰글자', 'C-08 큰 것 dayoff'],
  ['color-status-unset-text', 'color-status-unset-surface', '큰글자', 'C-08 큰 것 unset'],
  ['color-border-control', 'color-surface', '경계', 'C-04 C-05 C-06 C-07 테두리'],
  ['color-border-control', 'color-page', '경계', '방문자 바탕 위 입력 테두리'],
  ['color-border-control', 'color-page-admin', '경계', '관리자 바탕 위 입력 테두리'],
  ['color-border-control', 'color-surface-muted', '경계', '비활성 면 옆 입력 테두리'],
  ['color-status-unset-border', 'color-status-unset-surface', '경계', 'C-08 unset 점선 테두리'],
  ['color-accent', 'color-surface', '경계', 'C-02 C-09 테두리, C-07 채움'],
  ['color-accent', 'color-page', '경계', 'C-01 면과 방문자 바탕'],
  ['color-accent', 'color-page-admin', '경계', 'C-01 면과 관리자 바탕'],
  ['color-danger-border', 'color-surface', '경계', 'C-03 테두리, 오류 입력칸 테두리'],
  ['color-danger-border', 'color-danger-surface', '경계', 'C-10 띠 테두리'],
  ['color-tooltip-surface', 'color-surface', '경계', 'C-09 풍선말 면'],
  ['color-focus', 'color-surface', '경계', '초점 고리, 흰 면'],
  ['color-focus', 'color-page', '경계', '초점 고리, 방문자 바탕'],
  ['color-focus', 'color-page-admin', '경계', '초점 고리, 관리자 바탕'],
  ['color-focus', 'color-surface-muted', '경계', '초점 고리, 비활성 면 옆'],
  ['color-focus', 'color-tab-strip', '경계', '초점 고리, 탭 줄'],
  ['color-focus-on-dark', 'color-bar-admin', '경계', '초점 고리, 관리자 막대'],
  ['color-focus-on-dark', 'color-page-login', '경계', '초점 고리, S-02 바탕'],
];

function readTokens(file) {
  const css = fs.readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  const tokens = {};
  for (const m of css.matchAll(/--([a-z0-9-]+)\s*:\s*([^;]+);/g)) tokens[m[1]] = m[2].trim();
  return tokens;
}

function resolve(tokens, name, depth = 0) {
  const raw = tokens[name];
  if (raw === undefined) throw new Error(`토큰이 없다: --${name}`);
  const ref = /^var\(\s*--([a-z0-9-]+)\s*\)$/.exec(raw);
  if (!ref) return raw;
  if (depth > 8) throw new Error(`토큰 참조가 돈다: --${name}`);
  return resolve(tokens, ref[1], depth + 1);
}

function rgb(value, name) {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(value);
  if (!m) throw new Error(`불투명한 16진 색이 아니다: --${name}: ${value}`);
  const hex = m[1].length === 3 ? m[1].replace(/./g, '$&$&') : m[1];
  return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
}

function luminance([r, g, b]) {
  const lin = (c) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

let tokens;
let rows;
try {
  tokens = readTokens(TOKENS_FILE);
  rows = PAIRS.map(([fg, bg, kind, use]) => {
    const ratio = contrast(rgb(resolve(tokens, fg), fg), rgb(resolve(tokens, bg), bg));
    return { fg, bg, kind, use, ratio, pass: ratio >= MIN[kind] };
  });
} catch (err) {
  console.error(`contrast-check: ${err.message}`);
  process.exit(2);
}

for (const r of rows) {
  console.log(
    `${r.pass ? 'PASS' : 'FAIL'} ${r.ratio.toFixed(2).padStart(5)} (최소 ${MIN[r.kind]}) ${r.kind} --${r.fg} / --${r.bg} : ${r.use}`
  );
}
const passed = rows.filter((r) => r.pass).length;
const lowest = rows.reduce((a, b) => (a.ratio <= b.ratio ? a : b));
console.log(`가장 낮은 대비 ${lowest.ratio.toFixed(2)} (--${lowest.fg} / --${lowest.bg})`);
console.log(`${passed}/${rows.length}`);
process.exit(passed === rows.length ? 0 : 1);
