// S-01 방문자 홈의 정적 계약 시험.
// web/home.html, 그 스크립트(web/home.js), 스크립트가 가져오는 web/의 파일을 글자로 읽어 계약과 견준다.
// 기대값의 출처: 03_화면.md 1.3절(부르는 API), 3.1절(구역, 상태, 버튼), 6.2절(요일과 문구 키), 7.1절(요일 순서).
// 화면이 실제로 그려지는지와 버튼이 A-01을 다시 부르는지는 05_소스.md 10-5절의 브라우저 확인이 본다.

import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  assertApiPaths,
  assertImports,
  assertLabelsAndNames,
  assertLanguageAndHeading,
  assertNoInlineCode,
  assertTextKeys,
  readScreen,
} from './screen-contract.js';

const SCREEN_FILE = 'home.html';
const SCREEN_SCRIPT = 'home.js';

/** A-01. S-01이 부르는 API는 이것 하나다. */
const OVERVIEW_PATH = '/api/public/overview';

/** 버튼 표의 문구 키: 건너뛰기 링크와 오류 줄의 «다시 불러오기». */
const BUTTON_TEXT_KEYS = ['nav.skip', 'button.retry'];

/** 요일 행. 보이는 순서(월요일부터 일요일)와 6.2절의 요일 값, 문구 키. */
const WEEKDAY_ROWS = [
  { weekday: '1', textKey: 'weekday.mon' },
  { weekday: '2', textKey: 'weekday.tue' },
  { weekday: '3', textKey: 'weekday.wed' },
  { weekday: '4', textKey: 'weekday.thu' },
  { weekday: '5', textKey: 'weekday.fri' },
  { weekday: '6', textKey: 'weekday.sat' },
  { weekday: '0', textKey: 'weekday.sun' },
];

/**
 * 구역 표와 상태 표의 문구 키 가운데 서버가 text_key로 내려 주지 않는 것.
 * 서버가 주는 것(영업 상태 표지, 분류 제목, 오류 줄의 문구)은 화면 파일에 글자로 없어야 맞다.
 * status.dayoff와 status.unset은 요일 행의 값으로 화면이 직접 부른다.
 */
const SCREEN_TEXT_KEYS = [
  'title.home',
  'status.now',
  'status.today',
  'status.asof',
  'status.dayoff',
  'status.unset',
  'hours.heading',
  'hours.range',
  'menu.heading',
  'menu.empty',
  'sale.soldout',
  'price.format',
  'notice.loading',
  ...WEEKDAY_ROWS.map((row) => row.textKey),
];

test('S-01 스크립트가 A-01 경로를 가리킨다', () => {
  const screen = readScreen(SCREEN_FILE);
  assert.deepEqual(screen.entryScripts, [SCREEN_SCRIPT]);
  assertApiPaths(screen, [OVERVIEW_PATH], { file: SCREEN_SCRIPT });
  assertImports(screen, 'api-client.js');
});

test('S-01의 버튼과 문구 키가 화면 파일과 사전에 있다', () => {
  const screen = readScreen(SCREEN_FILE);
  assertImports(screen, 'text-dictionary.js');
  assertTextKeys(screen, [...BUTTON_TEXT_KEYS, ...SCREEN_TEXT_KEYS]);

  // 요일 일곱 행은 HTML에 고정으로 있고, 행의 요일 값과 요일 이름의 키가 6.2절의 짝과 같다.
  const rows = [];
  for (const tag of screen.tags) {
    if (tag.attributes.has('data-weekday')) rows.push({ weekday: tag.attributes.get('data-weekday'), textKey: null });
    else if (rows.length > 0 && rows.at(-1).textKey === null && tag.attributes.has('data-text')) {
      rows.at(-1).textKey = tag.attributes.get('data-text');
    }
  }
  assert.deepEqual(rows, WEEKDAY_ROWS);
});

test('S-01의 HTML에 인라인 스크립트, style 속성, on 속성이 없다', () => {
  assertNoInlineCode(readScreen(SCREEN_FILE));
});

test('S-01의 HTML은 입력칸마다 label, 버튼마다 이름, lang과 h1 하나가 있다', () => {
  const screen = readScreen(SCREEN_FILE);
  assertLabelsAndNames(screen);
  assertLanguageAndHeading(screen);

  // 방문자 화면에는 입력칸이 없고 버튼은 «다시 불러오기» 하나다(03_화면.md 3.1절).
  const controls = screen.tags.filter((tag) => ['input', 'select', 'textarea'].includes(tag.name));
  assert.deepEqual(controls, []);
  const buttons = screen.tags.filter((tag) => tag.name === 'button');
  assert.deepEqual(buttons.map((tag) => tag.attributes.get('data-text')), ['button.retry']);
});
