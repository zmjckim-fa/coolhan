// S-03 영업시간 관리 화면의 정적 계약 시험.
// web/admin-hours.html, 그 스크립트(web/admin-hours.js), 스크립트가 가져오는 web/의 파일을 글자로 읽어
// 계약의 글자를 담고 있는지 본다. 파일이 없으면 읽기에서 실패한다.
// 버튼이 실제로 그 API를 부르는지와 화면이 그려지는지는 05_소스.md 10-5절의 브라우저 확인이 본다.
// 기대값의 출처: 03_화면.md 1.3절(부르는 API), 3.3절(구역, 상태, 입력칸, 버튼), 6.2절(요일과 문구 키),
// 6.4절(풍선말 키가 붙는 곳), 7.2절(Tab 순서), 7.4절(읽는 이름), 05_소스.md 2-8절(입력칸의 속성).

import assert from 'node:assert/strict';
import { test } from 'node:test';

import { TIME_STEP_MINUTES } from '../web/input-rules.js';
import {
  apiPathsIn,
  assertApiPaths,
  assertImports,
  assertLabelsAndNames,
  assertLanguageAndHeading,
  assertNoInlineCode,
  assertTextKeys,
  readScreen,
} from './screen-contract.js';

const SCREEN_HTML = 'admin-hours.html';
const SCREEN_SCRIPT = 'admin-hours.js';
const TOP_BAR_SCRIPT = 'admin-top-bar.js';
const RULES_SCRIPT = 'input-rules.js';

/** A-05(GET)와 A-06(PUT)은 경로가 같고 메서드가 다르다. */
const HOURS_API = '/api/admin/hours';
const LOGOUT_API = '/api/admin/logout';
const SESSION_API = '/api/admin/session';

const SECONDS_PER_MINUTE = 60;

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
 * 행 안의 입력칸 셋. 문서 순서가 Tab 순서다(7.2절: 휴무, 여는 시각, 닫는 시각).
 * field는 A-06 본문의 필드 이름, nameKey는 7.4절의 읽는 이름이다.
 */
const ROW_CONTROLS = [
  { type: 'checkbox', field: 'is_day_off', nameKey: 'hours.aria.dayoff' },
  { type: 'time', field: 'opens_at', nameKey: 'hours.aria.opens' },
  { type: 'time', field: 'closes_at', nameKey: 'hours.aria.closes' },
];

/** 열 이름. 보이는 순서와 문서 순서가 같다(7.1절: 요일, 휴무, 여는 시각, 닫는 시각). */
const COLUMN_KEYS = ['hours.weekday', 'hours.dayoff', 'hours.opens', 'hours.closes'];

/** 6.4절: 풍선말 단추는 열 이름 옆에 한 번씩, 휴무, 여는 시각, 닫는 시각 순서다. */
const TIPS = [
  { labelKey: 'hours.dayoff', tipKey: 'tip.hours.dayoff' },
  { labelKey: 'hours.opens', tipKey: 'tip.hours.opens' },
  { labelKey: 'hours.closes', tipKey: 'tip.hours.closes' },
];

// 3.3절의 버튼 표. 위쪽 줄의 넷은 위쪽 줄 스크립트가 담는다.
const SCREEN_BUTTON_KEYS = ['nav.skip', 'tip.aria', 'button.save', 'notice.saving', 'button.retry'];
const TOP_BAR_KEYS = ['nav.home', 'button.logout', 'title.hours', 'title.menu', 'nav.admin'];
// 3.3절의 구역 표, 상태 표, 입력칸 표의 키 가운데 서버가 text_key로 내려 주지 않는 것.
// error.hours.* 넷은 화면이 보내기 전에 규칙 함수로 얻고, error.network는 화면이 판단한다.
const SCREEN_TEXT_KEYS = [
  'title.hours',
  'notice.loading',
  'notice.saved',
  'error.hours.opens.required',
  'error.hours.closes.required',
  'error.hours.order',
  'error.hours.format',
  'error.network',
  ...COLUMN_KEYS,
  ...ROW_CONTROLS.map((control) => control.nameKey),
  ...TIPS.map((tip) => tip.tipKey),
  ...WEEKDAY_ROWS.map((row) => row.textKey),
];

// 스크립트가 읽을 수 있는 저장소. CSRF 토큰과 세션 정보를 두지 않는다(05_소스.md 7절).
const SCRIPT_STORAGE = /\b(?:localStorage|sessionStorage|indexedDB)\b|\bdocument\s*\.\s*cookie\b/;
// 2-8절: 어느 입력칸에도 두지 않는 속성. inputmode는 S-03의 세 입력칸에 두지 않는다.
const BANNED_INPUT_ATTRIBUTES = ['maxlength', 'minlength', 'min', 'max', 'pattern', 'required', 'inputmode'];

const hasLiteral = (source, literal) => source.includes(`'${literal}'`) || source.includes(`"${literal}"`);

function tagsNamed(screen, name) {
  return screen.tags.filter((tag) => tag.name === name);
}

function onlyTag(screen, name) {
  const found = tagsNamed(screen, name);
  assert.equal(found.length, 1, `web/${SCREEN_HTML} must have exactly one <${name}>`);
  return found[0];
}

function tagWithId(screen, id) {
  const found = screen.tags.filter((tag) => tag.attributes.get('id') === id);
  assert.equal(found.length, 1, `web/${SCREEN_HTML} must have exactly one element with id="${id}"`);
  return found[0];
}

/**
 * 요일 행마다 그 행의 여는 태그들. 행은 data-weekday가 달린 tr의 여는 태그에서 닫는 태그까지다.
 * @returns {{ row: import('./screen-contract.js').Tag, inside: import('./screen-contract.js').Tag[] }[]}
 */
function weekdayRows(screen) {
  return screen.tags
    .filter((tag) => tag.name === 'tr' && tag.attributes.has('data-weekday'))
    .map((row) => {
      const close = screen.html.indexOf('</tr', row.end);
      assert.ok(close !== -1, `web/${SCREEN_HTML} has a weekday row that is never closed`);
      return { row, inside: screen.tags.filter((tag) => tag.end > row.end && tag.end <= close) };
    });
}

test('S-03 스크립트가 A-05와 A-06 경로를 가리키고 위쪽 줄 스크립트를 가져온다', () => {
  const screen = readScreen(SCREEN_HTML);
  assert.deepEqual(screen.entryScripts, [SCREEN_SCRIPT]);
  assertImports(screen, TOP_BAR_SCRIPT);
  assertImports(screen, 'api-client.js');

  // 화면 스크립트가 스스로 가리키는 API는 영업시간 경로 하나이고, 읽기는 GET, 저장은 PUT이다.
  const script = screen.scripts.get(SCREEN_SCRIPT);
  assertApiPaths(screen, [HOURS_API], { file: SCREEN_SCRIPT });
  assert.deepEqual(apiPathsIn(script), [HOURS_API], `web/${SCREEN_SCRIPT} names an API besides A-05 and A-06`);
  assert.match(script, /callApi\(\s*'GET',\s*HOURS_API\s*\)/, `web/${SCREEN_SCRIPT} does not read the week with GET (A-05)`);
  assert.match(script, /callApi\(\s*'PUT',\s*HOURS_API\s*,/, `web/${SCREEN_SCRIPT} does not save the week with PUT (A-06)`);

  // 저장 본문은 일곱 행을 business_hour 하나에 담는다. 행의 네 필드를 모두 보낸다(03_화면.md 5절).
  for (const field of ['business_hour', 'weekday', 'opens_at', 'closes_at', 'is_day_off']) {
    assert.match(script, new RegExp(`\\b${field}\\b`), `web/${SCREEN_SCRIPT} does not name the field ${field}`);
  }

  // 세션 확인(A-04)과 로그아웃(A-03)은 위쪽 줄 스크립트의 함수로 부른다. 화면 스크립트는 그 함수를 한 번 부른다.
  assert.match(script, /\bstartAdminTopBar\(/, `web/${SCREEN_SCRIPT} does not start the top bar`);
  assertApiPaths(screen, [LOGOUT_API, SESSION_API], { file: TOP_BAR_SCRIPT });

  // 화면 전체가 가리키는 API는 이 셋이 전부다(1.3절: A-03, A-04, A-05, A-06).
  const named = new Set([...screen.scripts.values()].flatMap(apiPathsIn));
  assert.deepEqual([...named].sort(), [HOURS_API, LOGOUT_API, SESSION_API].sort());

  // 보내기 전 검사는 함께 쓰는 규칙 함수가 한다. 화면 스크립트에 시각 형식의 규칙을 다시 쓰지 않는다.
  assertImports(screen, RULES_SCRIPT);
  for (const rule of ['checkBusinessWeek', 'checkBusinessHourRow']) {
    assert.match(script, new RegExp(`\\b${rule}\\(`), `web/${SCREEN_SCRIPT} does not call ${rule}`);
  }
  assert.doesNotMatch(script, /new RegExp|\/\^|\[0-9\]|\\d/, `web/${SCREEN_SCRIPT} has a pattern of its own`);
});

test('S-03의 버튼과 문구 키가 화면 파일과 사전에 있다', () => {
  const screen = readScreen(SCREEN_HTML);
  assertTextKeys(screen, [...SCREEN_BUTTON_KEYS, ...SCREEN_TEXT_KEYS, ...TOP_BAR_KEYS]);

  // 위쪽 줄은 빈 header 하나이고 건너뛰기 링크 바로 다음에 있다. 그 안의 키는 위쪽 줄 스크립트가 담는다.
  const header = onlyTag(screen, 'header');
  assert.ok(header.attributes.has('data-admin-top-bar'), 'the header is not the place of the admin top bar');
  const skipIndex = screen.tags.findIndex((tag) => tag.attributes.get('data-text') === 'nav.skip');
  assert.ok(skipIndex !== -1, 'no skip link');
  assert.equal(screen.tags[skipIndex + 1], header, 'the top bar does not follow the skip link');
  const topBar = screen.scripts.get(TOP_BAR_SCRIPT);
  for (const key of TOP_BAR_KEYS) assert.ok(hasLiteral(topBar, key), `web/${TOP_BAR_SCRIPT} does not name ${key}`);

  // 문서 제목은 서버가 사전 글자로 바꾸는 자리이고 제목 1단계와 같은 키다. 건너뛰기 링크는 제목으로 간다.
  assert.match(screen.html, /<title>\{\{text:title\.hours\}\}<\/title>/);
  const heading = onlyTag(screen, 'h1');
  assert.equal(heading.attributes.get('data-text'), 'title.hours');
  assert.equal(screen.tags[skipIndex].attributes.get('href'), `#${heading.attributes.get('id')}`, 'the skip link goes to the title');

  // 버튼은 다섯 개다: 오류 줄의 «다시 불러오기», 풍선말 단추 셋, «저장». 문서 순서는 7.2절의 Tab 순서다.
  const buttons = tagsNamed(screen, 'button');
  assert.deepEqual(
    buttons.map((tag) => tag.attributes.get('data-text') ?? tag.attributes.get('data-text-aria')),
    ['button.retry', 'tip.aria', 'tip.aria', 'tip.aria', 'button.save'],
  );
  const [retryButton, ...rest] = buttons;
  const saveButton = rest.pop();
  assert.equal(retryButton.attributes.get('type'), 'button');
  assert.ok(retryButton.attributes.has('hidden'), '«다시 불러오기» shows before a load has failed');
  assert.equal(saveButton.attributes.get('type'), 'submit');

  // 풍선말 단추: 읽는 이름에 열 이름이 들어가고, 가리키는 풍선말이 6.4절의 키다.
  assert.deepEqual(rest.map((tag) => tag.attributes.get('data-value-label')), TIPS.map((tip) => tip.labelKey));
  for (const [index, button] of rest.entries()) {
    assert.equal(button.attributes.get('type'), 'button');
    const bubble = tagWithId(screen, button.attributes.get('aria-describedby'));
    assert.equal(bubble.attributes.get('role'), 'tooltip');
    assert.equal(bubble.attributes.get('data-text'), TIPS[index].tipKey);
  }

  // 열 이름 넷이 표의 열 제목으로 있고 순서가 요일, 휴무, 여는 시각, 닫는 시각이다.
  const columnHeads = screen.tags.filter((tag) => tag.name === 'th' && tag.attributes.get('scope') === 'col');
  assert.equal(columnHeads.length, COLUMN_KEYS.length);
  const columnKeys = [];
  for (const [index, head] of columnHeads.entries()) {
    const from = screen.tags.indexOf(head);
    const to = index + 1 < columnHeads.length ? screen.tags.indexOf(columnHeads[index + 1]) : screen.tags.findIndex((tag) => tag.attributes.has('data-weekday'));
    columnKeys.push(screen.tags.slice(from + 1, to).find((tag) => tag.attributes.has('data-text')).attributes.get('data-text'));
  }
  assert.deepEqual(columnKeys, COLUMN_KEYS);

  // 요일 일곱 행은 HTML에 고정으로 있고, 행의 요일 값과 요일 이름의 키가 6.2절의 짝과 같다.
  const rows = weekdayRows(screen).map(({ row, inside }) => {
    const name = inside.find((tag) => tag.name === 'th');
    return { weekday: row.attributes.get('data-weekday'), textKey: name?.attributes.get('data-text') ?? null, scope: name?.attributes.get('scope') ?? null };
  });
  assert.deepEqual(rows, WEEKDAY_ROWS.map((row) => ({ ...row, scope: 'row' })));

  // 저장 알림과 요청 중인 버튼의 문구는 화면 스크립트가 키로 부른다.
  const script = screen.scripts.get(SCREEN_SCRIPT);
  for (const key of ['notice.saved', 'notice.saving', 'button.save']) {
    assert.ok(hasLiteral(script, key), `web/${SCREEN_SCRIPT} does not name ${key}`);
  }
});

test('S-03의 HTML에 인라인 스크립트, style 속성, on 속성이 없다', () => {
  const screen = readScreen(SCREEN_HTML);
  assertNoInlineCode(screen);

  // HTML이 거는 스타일 파일은 토큰, 컴포넌트, 이 화면의 배치 파일 셋이다.
  const styleSheets = tagsNamed(screen, 'link').filter((tag) => tag.attributes.get('rel') === 'stylesheet');
  assert.deepEqual(styleSheets.map((tag) => tag.attributes.get('href')), ['/tokens.css', '/screen.css', '/admin-hours.css']);

  // CSRF 토큰과 세션 정보를 스크립트가 읽을 수 있는 저장소에 두지 않는다.
  for (const file of [SCREEN_SCRIPT, TOP_BAR_SCRIPT]) {
    assert.doesNotMatch(screen.scripts.get(file), SCRIPT_STORAGE, `web/${file} uses script-readable storage`);
  }
});

test('S-03의 HTML은 입력칸마다 label, 버튼마다 이름, lang과 h1 하나가 있다', () => {
  const screen = readScreen(SCREEN_HTML);
  assertLabelsAndNames(screen);
  assertLanguageAndHeading(screen);

  // 입력칸은 요일마다 셋(휴무, 여는 시각, 닫는 시각)이고 그 밖에는 없다.
  const rows = weekdayRows(screen);
  assert.equal(rows.length, WEEKDAY_ROWS.length);
  const controls = screen.tags.filter((tag) => ['input', 'select', 'textarea'].includes(tag.name));
  assert.equal(controls.length, WEEKDAY_ROWS.length * ROW_CONTROLS.length);

  const errorLineIds = new Set();
  for (const [index, { inside }] of rows.entries()) {
    const weekdayKey = WEEKDAY_ROWS[index].textKey;
    const inputs = inside.filter((tag) => tag.name === 'input');

    // 종류, 본문 필드, 읽는 이름의 키가 순서대로 맞고, 읽는 이름에 그 행의 요일 이름이 들어간다.
    assert.deepEqual(
      inputs.map((tag) => ({
        type: tag.attributes.get('type'),
        field: tag.attributes.get('data-hours-field'),
        nameKey: tag.attributes.get('data-text-aria'),
      })),
      ROW_CONTROLS,
      `the controls of the ${weekdayKey} row`,
    );
    for (const input of inputs) {
      assert.equal(input.attributes.get('data-value-weekday'), weekdayKey, `the reading name of a ${weekdayKey} control names another weekday`);
      for (const banned of BANNED_INPUT_ATTRIBUTES) {
        assert.ok(!input.attributes.has(banned), `a ${weekdayKey} control has the ${banned} attribute`);
      }
      // 시각 칸의 step은 규칙 파일의 분 단위를 초로 적은 값이다. 체크 상자에는 step이 없다.
      const expectedStep = input.attributes.get('type') === 'time' ? String(TIME_STEP_MINUTES * SECONDS_PER_MINUTE) : undefined;
      assert.equal(input.attributes.get('step'), expectedStep, `the step of a ${weekdayKey} control`);
    }

    // 체크 상자는 누르는 곳을 넓히는 label 안에 있다.
    const checkboxAt = inside.indexOf(inputs[0]);
    assert.equal(inside[checkboxAt - 1]?.name, 'label', `the ${weekdayKey} checkbox is not inside a label`);

    // 행마다 오류 줄이 하나 있다. id가 있어 입력칸이 가리킬 수 있고 처음에는 숨겨져 있다.
    const errorLines = inside.filter((tag) => tag.attributes.has('data-hours-error'));
    assert.equal(errorLines.length, 1, `the ${weekdayKey} row needs exactly one error line`);
    const [errorLine] = errorLines;
    assert.ok(errorLine.attributes.has('hidden'), `the error line of the ${weekdayKey} row shows before any check`);
    assert.ok((errorLine.attributes.get('id') ?? '') !== '', `the error line of the ${weekdayKey} row has no id`);
    errorLineIds.add(errorLine.attributes.get('id'));
    assert.ok(
      inside.slice(inside.indexOf(errorLine) + 1).some((tag) => tag.attributes.has('data-feedback-text')),
      `the error line of the ${weekdayKey} row has no text slot`,
    );
  }
  assert.equal(errorLineIds.size, WEEKDAY_ROWS.length, 'two rows share an error line id');

  // 브라우저의 기본 검증 풍선은 사전 밖의 글자다. 폼은 novalidate다.
  assert.ok(onlyTag(screen, 'form').attributes.has('novalidate'), 'the form has no novalidate');

  // 오류와 알림을 알리는 자리: 폼 위 오류 띠는 alert, 저장 알림은 status와 aria-live.
  const band = screen.tags.find((tag) => tag.attributes.get('role') === 'alert');
  assert.ok(band !== undefined, 'no error band with role="alert"');
  assert.ok(band.attributes.has('hidden'), 'the error band shows before any failure');
  const notice = screen.tags.find((tag) => tag.attributes.get('role') === 'status' && tag.attributes.get('aria-live') === 'polite');
  assert.ok(notice !== undefined, 'no saved notice with role="status" and aria-live="polite"');
  assert.ok(notice.attributes.has('hidden'), 'the saved notice shows before any save');

  // 표의 이름은 화면 제목이다.
  assert.equal(onlyTag(screen, 'table').attributes.get('aria-labelledby'), onlyTag(screen, 'h1').attributes.get('id'));
});
