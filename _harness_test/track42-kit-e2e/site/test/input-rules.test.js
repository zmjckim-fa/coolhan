// 입력 검증 규칙의 단위 시험. 함수를 직접 부른다. 서버와 DB가 없다.
// 경계 값은 db/schema.sql의 제약에서 읽는다. 규칙이 스키마가 거절하는 값을 통과시키면 여기서 걸린다.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';

import * as rules from '../web/input-rules.js';
import { CATEGORY_CODES, CATEGORY_LIST, MENU_CATEGORIES } from '../src/menu-category.js';
import { ERROR_CATALOG, REQUEST_ERRORS, errorResponse } from '../src/error-catalog.js';

const root = path.join(import.meta.dirname, '..');
const readText = (relativePath) => readFileSync(path.join(root, relativePath), 'utf8');

const schemaSql = readText('db/schema.sql');

function schemaMatch(pattern) {
  const match = pattern.exec(schemaSql);
  assert.notEqual(match, null, `db/schema.sql has no ${pattern}`);
  return match;
}

function schemaCodes(column) {
  const list = schemaMatch(new RegExp(`${column} IN \\(([^)]*)\\)`))[1];
  return list.split(',').map((item) => item.trim().replace(/^'|'$/g, ''));
}

const nameMax = Number(schemaMatch(/length\(name\) <= (\d+)/)[1]);
const [priceMin, priceMax] = schemaMatch(/price_krw BETWEEN (\d+) AND (\d+)/).slice(1).map(Number);
const [weekdayMin, weekdayMax] = schemaMatch(/weekday BETWEEN (\d+) AND (\d+)/).slice(1).map(Number);
const weekdayCount = weekdayMax - weekdayMin + 1;
const schemaCategoryCodes = schemaCodes('category');
const schemaSaleStatusCodes = schemaCodes('sale_status');

/** 일곱 요일이 모두 비어 있는 한 주. overrides는 요일 번호별로 덮어쓸 필드다. */
function week(overrides = {}) {
  return Array.from({ length: weekdayCount }, (_, index) => ({
    weekday: weekdayMin + index,
    opens_at: null,
    closes_at: null,
    is_day_off: 0,
    ...overrides[weekdayMin + index],
  }));
}

function assertPassed(result) {
  assert.equal(result.ok, true, JSON.stringify(result));
}

function assertRejected(result, code, textKey, where = {}) {
  assert.equal(result.ok, false, JSON.stringify(result));
  assert.equal(result.code, code);
  assert.equal(result.text_key, textKey);
  assert.ok(Object.hasOwn(rules.INPUT_ERRORS, result.code), `${result.code} is not an input error code`);
  for (const [key, value] of Object.entries(where)) assert.equal(result[key], value, key);
}

// R-04

test('없는 비밀번호와 0자 비밀번호는 password_required다', () => {
  for (const value of [undefined, null, '']) {
    assertRejected(rules.checkPassword(value), 'password_required', 'error.password.required', { field: 'password' });
  }
  assertPassed(rules.checkPassword('a'));
  assertPassed(rules.checkPassword(' '));
});

// R-05

test('00:00, 07:30, 23:55는 통과한다', () => {
  for (const value of ['00:00', '07:30', '23:55']) {
    assertPassed(rules.checkTime(value));
    assertPassed(rules.checkBusinessWeek(week({ 1: { opens_at: '00:00', closes_at: value === '00:00' ? '00:05' : value } })));
  }
  assertPassed(rules.checkBusinessWeek(week({ 1: { opens_at: '23:50', closes_at: '23:55' } })));
});

test('07:31, 24:00, 7:30, 숫자 730은 거절한다', () => {
  for (const value of ['07:31', '24:00', '7:30', 730, '23:60', '0730', '07:30 ', '07:30\n', '', '07:3', ' 07:30']) {
    assertRejected(rules.checkTime(value), 'hours_time_format', 'error.hours.format');
  }
  assertRejected(
    rules.checkBusinessWeek(week({ 2: { opens_at: '07:31', closes_at: '19:00' } })),
    'hours_time_format', 'error.hours.format', { weekday: 2, field: 'opens_at' },
  );
  assertRejected(
    rules.checkBusinessWeek(week({ 5: { opens_at: '07:30', closes_at: '24:00' } })),
    'hours_time_format', 'error.hours.format', { weekday: 5, field: 'closes_at' },
  );
  assert.equal(60 % rules.TIME_STEP_MINUTES, 0);
});

test('닫는 시각이 여는 시각과 같으면 거절하고 5분 늦으면 통과한다', () => {
  assertRejected(
    rules.checkBusinessWeek(week({ 3: { opens_at: '09:00', closes_at: '09:00' } })),
    'hours_close_not_after_open', 'error.hours.order', { weekday: 3, field: 'closes_at' },
  );
  assertRejected(
    rules.checkBusinessWeek(week({ 3: { opens_at: '09:00', closes_at: '08:55' } })),
    'hours_close_not_after_open', 'error.hours.order', { weekday: 3, field: 'closes_at' },
  );
  assertPassed(rules.checkBusinessWeek(week({ 3: { opens_at: '09:00', closes_at: '09:05' } })));
  assertPassed(rules.checkBusinessHourRow({ weekday: 3, opens_at: '09:00', closes_at: '09:05', is_day_off: 0 }));
});

test('한쪽 시각만 있으면 빠진 쪽의 코드와 그 요일을 돌려준다', () => {
  assertRejected(
    rules.checkBusinessWeek(week({ 3: { opens_at: '09:00' } })),
    'hours_closes_required', 'error.hours.closes.required', { weekday: 3, field: 'closes_at' },
  );
  assertRejected(
    rules.checkBusinessWeek(week({ 4: { closes_at: '18:00' } })),
    'hours_opens_required', 'error.hours.opens.required', { weekday: 4, field: 'opens_at' },
  );
  assertRejected(
    rules.checkBusinessHourRow({ weekday: 6, opens_at: null, closes_at: '18:00', is_day_off: 0 }),
    'hours_opens_required', 'error.hours.opens.required', { weekday: 6, field: 'opens_at' },
  );
});

test('휴무인데 시각이 있는 요일은 hours_day_off_has_time이다', () => {
  assertRejected(
    rules.checkBusinessWeek(week({ 2: { is_day_off: 1, opens_at: '09:00', closes_at: '18:00' } })),
    'hours_day_off_has_time', 'error.server', { weekday: 2, field: 'opens_at' },
  );
  assertRejected(
    rules.checkBusinessWeek(week({ 2: { is_day_off: 1, closes_at: '18:00' } })),
    'hours_day_off_has_time', 'error.server', { weekday: 2, field: 'closes_at' },
  );
  assertPassed(rules.checkBusinessWeek(week({ 2: { is_day_off: 1 } })));
});

test('여섯 요일이나 같은 요일 두 번은 거절한다', () => {
  const reject = (rows) => assertRejected(rules.checkBusinessWeek(rows), 'hours_week_incomplete', 'error.server');
  reject(week().slice(0, weekdayCount - 1));
  reject(week({ 2: { weekday: 1 } }));
  reject([...week(), { weekday: weekdayMin, opens_at: null, closes_at: null, is_day_off: 0 }]);
  reject(week({ 6: { weekday: weekdayMax + 1 } }));
  reject(week({ 0: { weekday: 0.5 } }));
  reject(week({ 0: { is_day_off: 2 } }));
  reject([]);
  reject(undefined);
  reject([null, ...week().slice(1)]);
  assert.equal(rules.WEEKDAY_COUNT, weekdayCount);
  assertPassed(rules.checkBusinessWeek(week()));
  assertPassed(rules.checkBusinessWeek(week({ 1: { opens_at: '07:30', closes_at: '19:00' }, 0: { is_day_off: 1 } }).reverse()));
});

// R-06

test('이름 1자와 40자는 통과하고 공백뿐인 이름과 41자는 거절한다', () => {
  assert.equal(rules.MENU_NAME_MAX_LENGTH, nameMax);
  assert.deepEqual(rules.checkMenuName('a'), { ok: true, value: 'a' });
  assert.deepEqual(rules.checkMenuName('a'.repeat(nameMax)), { ok: true, value: 'a'.repeat(nameMax) });
  const fourByte = String.fromCodePoint(0x1f956);
  assert.deepEqual(rules.checkMenuName(fourByte.repeat(nameMax)), { ok: true, value: fourByte.repeat(nameMax) });
  assert.equal(rules.checkMenuName('   ').ok, false);
  assert.equal(rules.checkMenuName(' \t\n ').ok, false);
  assert.equal(rules.checkMenuName('a'.repeat(nameMax + 1)).ok, false);
  assert.equal(rules.checkMenuName(fourByte.repeat(nameMax + 1)).ok, false);
});

test('없는 이름은 menu_name_required이고 41자 이름은 menu_name_too_long이다', () => {
  for (const value of [undefined, null, '', '   ']) {
    assertRejected(rules.checkMenuName(value), 'menu_name_required', 'error.menu.name.required', { field: 'name' });
  }
  assertRejected(
    rules.checkMenuName('a'.repeat(nameMax + 1)),
    'menu_name_too_long', 'error.menu.name.length', { field: 'name' },
  );
  assertRejected(
    rules.checkMenuName(` ${'가'.repeat(nameMax + 1)} `),
    'menu_name_too_long', 'error.menu.name.length', { field: 'name' },
  );
});

test('가격 0과 1000000은 통과하고 -1과 1000001은 거절한다', () => {
  assert.equal(rules.PRICE_KRW_MIN, priceMin);
  assert.equal(rules.PRICE_KRW_MAX, priceMax);
  assertPassed(rules.checkPriceKrw(priceMin));
  assertPassed(rules.checkPriceKrw(priceMax));
  for (const value of [priceMin - 1, priceMax + 1, Number.MAX_SAFE_INTEGER, Infinity, NaN]) {
    assertRejected(rules.checkPriceKrw(value), 'menu_price_range', 'error.menu.price.range', { field: 'price_krw' });
  }
});

test('앞뒤 공백과 탭은 떼어 통과하고 풀어 쓴 한글 40자는 NFC 40자로 통과한다', () => {
  assert.deepEqual(rules.checkMenuName(' \t소금빵\t \n'), { ok: true, value: '소금빵' });
  assert.deepEqual(rules.checkMenuName(`  ${'a'.repeat(nameMax)}  `), { ok: true, value: 'a'.repeat(nameMax) });
  const composed = '가'.repeat(nameMax);
  const decomposed = composed.normalize('NFD');
  assert.equal([...decomposed].length, nameMax * 2);
  const result = rules.checkMenuName(decomposed);
  assert.deepEqual(result, { ok: true, value: composed });
  assert.equal([...result.value].length, nameMax);
});

test('가운데에 제어 문자가 든 이름은 menu_name_invalid다', () => {
  for (const value of ['a\tb', 'a\nb', 'a\rb', 'a\u0000b', 'a\u001Fb', 'a\u007Fb', '\u0001ab', 'ab\u0001', 12, true, ['a'], {}]) {
    assertRejected(rules.checkMenuName(value), 'menu_name_invalid', 'error.menu.name.length', { field: 'name' });
  }
  assert.deepEqual(rules.checkMenuName('a b'), { ok: true, value: 'a b' });
});

test('소수 가격과 문자열 가격은 menu_price_range이고 없는 가격은 menu_price_required다', () => {
  for (const value of [3500.5, '3500', '', true, false, [3500], {}]) {
    assertRejected(rules.checkPriceKrw(value), 'menu_price_range', 'error.menu.price.range', { field: 'price_krw' });
  }
  for (const value of [undefined, null]) {
    assertRejected(rules.checkPriceKrw(value), 'menu_price_required', 'error.menu.price.required', { field: 'price_krw' });
  }
});

test('가격 칸의 숫자 글자는 정수가 되고 쉼표, 소수점, 빼기표, 한글이 든 글자는 menu_price_range다', () => {
  assert.deepEqual(rules.parsePriceText('3500'), { ok: true, value: 3500 });
  assert.deepEqual(rules.parsePriceText(String(priceMin)), { ok: true, value: priceMin });
  assert.deepEqual(rules.parsePriceText(String(priceMax)), { ok: true, value: priceMax });
  assert.deepEqual(rules.parsePriceText('007'), { ok: true, value: 7 });
  for (const text of ['3,500', '3500.0', '-1', '3500원', ' 3500', '3500 ', '   ', '1e3', '0x10', '３５００', String(priceMax + 1), '9'.repeat(400)]) {
    assertRejected(rules.parsePriceText(text), 'menu_price_range', 'error.menu.price.range', { field: 'price_krw' });
  }
  for (const text of ['', undefined, null]) {
    assertRejected(rules.parsePriceText(text), 'menu_price_required', 'error.menu.price.required', { field: 'price_krw' });
  }
  assertRejected(rules.parsePriceText(3500), 'menu_price_range', 'error.menu.price.range', { field: 'price_krw' });
});

test('분류 목록 밖의 값과, 없거나 두 값 밖인 판매 상태는 거절한다', () => {
  assert.ok(CATEGORY_CODES.length > 0);
  assert.equal(CATEGORY_CODES.length, MENU_CATEGORIES.length);
  assert.deepEqual([...CATEGORY_CODES].sort(), [...schemaCategoryCodes].sort());
  assert.deepEqual(CATEGORY_LIST.map((category) => category.code), CATEGORY_CODES);
  for (const { code, text_key } of CATEGORY_LIST) {
    assert.equal(text_key, `category.${code}`);
    assertPassed(rules.checkCategory(code, CATEGORY_CODES));
  }
  for (const value of ['pastry', '', 'Bread', ' bread', undefined, null, 1, CATEGORY_CODES]) {
    assertRejected(
      rules.checkCategory(value, CATEGORY_CODES),
      'menu_category_invalid', 'error.menu.category.required', { field: 'category' },
    );
  }
  assertRejected(rules.checkCategory(CATEGORY_CODES[0], []), 'menu_category_invalid', 'error.menu.category.required');

  assert.equal(rules.SALE_STATUS_CODES.length, 2);
  assert.deepEqual([...rules.SALE_STATUS_CODES].sort(), [...schemaSaleStatusCodes].sort());
  for (const code of rules.SALE_STATUS_CODES) assertPassed(rules.checkSaleStatus(code));
  for (const value of [undefined, null, '', 'paused', 'ON_SALE', 1]) {
    assertRejected(
      rules.checkSaleStatus(value),
      'menu_sale_status_unknown', 'error.server', { field: 'sale_status' },
    );
  }
});

// 공통 시험 (10-4절)

test('규칙 파일이 다른 파일을 가져오지 않는다', () => {
  const source = readText('web/input-rules.js');
  assert.ok(source.length > 0);
  assert.doesNotMatch(source, /\bimport\b/);
  assert.doesNotMatch(source, /\brequire\s*\(/);
  assert.doesNotMatch(source, /^\s*export\s[^\n]*\bfrom\s*['"]/m);
});

test('입력 규칙의 코드와 오류 표의 코드가 겹치지 않고 규칙 파일에 bad_shape가 없다', () => {
  const inputCodes = Object.keys(rules.INPUT_ERRORS);
  const requestCodes = Object.keys(REQUEST_ERRORS);
  assert.ok(inputCodes.length > 0);
  assert.ok(requestCodes.length > 0);
  assert.deepEqual(inputCodes.filter((code) => requestCodes.includes(code)), []);
  assert.equal(Object.keys(ERROR_CATALOG).length, inputCodes.length + requestCodes.length);
  assert.ok(requestCodes.includes('bad_shape'));
  assert.ok(!inputCodes.includes('bad_shape'));
  assert.doesNotMatch(readText('web/input-rules.js'), /bad_shape/);
  for (const code of inputCodes) {
    assert.equal(rules.INPUT_ERRORS[code].status, 400, code);
    assert.equal(ERROR_CATALOG[code], rules.INPUT_ERRORS[code], code);
  }
});

test('web/package.json은 type module 한 필드뿐이다', () => {
  assert.deepEqual(JSON.parse(readText('web/package.json')), { type: 'module' });
});

// 이 단위의 완료 조건이 요구하는 시험. 05_소스.md 10절에는 이름이 없다.

test('오류 표의 문구 키가 모두 사전에 있다', () => {
  const dictionary = JSON.parse(readText('web/text/ko.json'));
  const codes = Object.keys(ERROR_CATALOG);
  assert.ok(codes.length > 0);
  for (const code of codes) {
    const { status, text_key } = ERROR_CATALOG[code];
    assert.ok(Object.hasOwn(dictionary, text_key), `${code}: ${text_key} is not in web/text/ko.json`);
    assert.ok(Number.isInteger(status) && status >= 400 && status <= 599, `${code}: ${status}`);
    assert.deepEqual(errorResponse(code), { status, body: { error: { code, text_key } } });
  }
  assert.ok(!codes.some((code) => ERROR_CATALOG[code].text_key === 'error.network'));
  assert.throws(() => errorResponse('no_such_code'));
});
