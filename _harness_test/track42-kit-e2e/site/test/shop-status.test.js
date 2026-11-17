// 영업 상태 계산 규칙의 단위 시험. 함수를 직접 부른다. 서버와 DB가 없다.

import test from 'node:test';
import assert from 'node:assert/strict';

import { SHOP_STATUS_TEXT_KEYS, deriveShopStatus, toShopLocalTime } from '../src/shop-status.js';
import { WEEKDAY_COUNT } from '../web/input-rules.js';

const SEOUL = 'Asia/Seoul';
const TUESDAY = 2;
const OPENS_AT = '07:30';
const CLOSES_AT = '19:00';

/** 2026-11-17(화요일)의 서울 시각 'HH:MM:SS'를 그 순간의 Date로 바꾼다. */
const seoulTuesday = (time) => new Date(`2026-11-17T${time}+09:00`);

/** base 모양의 일곱 행. overrides는 요일 번호별로 덮어쓸 필드다. */
function week(base, overrides = {}) {
  return Array.from({ length: WEEKDAY_COUNT }, (_, weekday) => ({ weekday, ...base, ...overrides[weekday] }));
}

const DAY_OFF = { opens_at: null, closes_at: null, is_day_off: 1 };
const UNSET = { opens_at: null, closes_at: null, is_day_off: 0 };

/** 화요일만 07:30부터 19:00까지 열고 나머지 요일은 휴무인 한 주. 다른 요일의 행을 읽으면 dayoff가 나온다. */
const openOnTuesday = week(DAY_OFF, { [TUESDAY]: { opens_at: OPENS_AT, closes_at: CLOSES_AT, is_day_off: 0 } });

function assertStatus(status, code, weekday, localTime) {
  assert.deepEqual(status, { code, text_key: SHOP_STATUS_TEXT_KEYS[code], weekday, local_time: localTime });
}

test('여는 시각과 같은 분은 open이다', () => {
  assertStatus(deriveShopStatus(openOnTuesday, seoulTuesday('07:30:00'), SEOUL), 'open', TUESDAY, '07:30');
  assertStatus(deriveShopStatus(openOnTuesday, seoulTuesday('07:30:59.999'), SEOUL), 'open', TUESDAY, '07:30');
});

test('닫는 시각과 같은 분은 closed다', () => {
  assertStatus(deriveShopStatus(openOnTuesday, seoulTuesday('19:00:00'), SEOUL), 'closed', TUESDAY, '19:00');
  assertStatus(deriveShopStatus(openOnTuesday, seoulTuesday('23:59:59'), SEOUL), 'closed', TUESDAY, '23:59');
});

test('여는 시각 1분 전은 closed다', () => {
  assertStatus(deriveShopStatus(openOnTuesday, seoulTuesday('07:29:00'), SEOUL), 'closed', TUESDAY, '07:29');
  assertStatus(deriveShopStatus(openOnTuesday, seoulTuesday('07:29:59.999'), SEOUL), 'closed', TUESDAY, '07:29');
  assertStatus(deriveShopStatus(openOnTuesday, seoulTuesday('00:00:00'), SEOUL), 'closed', TUESDAY, '00:00');
});

test('닫는 시각 1분 전은 open이다', () => {
  assertStatus(deriveShopStatus(openOnTuesday, seoulTuesday('18:59:00'), SEOUL), 'open', TUESDAY, '18:59');
  assertStatus(deriveShopStatus(openOnTuesday, seoulTuesday('12:34:00'), SEOUL), 'open', TUESDAY, '12:34');
});

test('휴무 요일은 어느 시각에도 dayoff다', () => {
  const dayOffOnTuesday = week({ opens_at: OPENS_AT, closes_at: CLOSES_AT, is_day_off: 0 }, { [TUESDAY]: DAY_OFF });
  for (const time of ['00:00', '07:30', '12:34', '19:00', '23:59']) {
    assertStatus(deriveShopStatus(dayOffOnTuesday, seoulTuesday(`${time}:00`), SEOUL), 'dayoff', TUESDAY, time);
  }
});

test('여는 시각이 비어 있으면 unset이다', () => {
  const unsetOnTuesday = week({ opens_at: OPENS_AT, closes_at: CLOSES_AT, is_day_off: 0 }, { [TUESDAY]: UNSET });
  for (const time of ['00:00', '12:34', '23:59']) {
    assertStatus(deriveShopStatus(unsetOnTuesday, seoulTuesday(`${time}:00`), SEOUL), 'unset', TUESDAY, time);
  }
  assertStatus(deriveShopStatus(week(UNSET), seoulTuesday('12:34:00'), SEOUL), 'unset', TUESDAY, '12:34');
});

test('가게 시간대의 요일과 시각으로 계산한다', () => {
  const SUNDAY = 0;
  const SATURDAY = 6;
  // 같은 순간이 서울에서는 일요일 00:30, 뉴욕에서는 토요일 10:30이다.
  const instant = new Date('2026-11-14T15:30:00.000Z');
  assert.deepEqual(toShopLocalTime(instant, SEOUL), { weekday: SUNDAY, local_time: '00:30' });
  assert.deepEqual(toShopLocalTime(instant, 'America/New_York'), { weekday: SATURDAY, local_time: '10:30' });
  assert.deepEqual(toShopLocalTime(instant, 'UTC'), { weekday: SATURDAY, local_time: '15:30' });

  const openOnSundayNight = week(UNSET, { [SUNDAY]: { opens_at: '00:00', closes_at: '01:00', is_day_off: 0 } });
  assertStatus(deriveShopStatus(openOnSundayNight, instant, SEOUL), 'open', SUNDAY, '00:30');
  assertStatus(deriveShopStatus(openOnSundayNight, instant, 'America/New_York'), 'unset', SATURDAY, '10:30');

  const openOnSaturdayMorning = week(DAY_OFF, { [SATURDAY]: { opens_at: '10:00', closes_at: '11:00', is_day_off: 0 } });
  assertStatus(deriveShopStatus(openOnSaturdayMorning, instant, 'America/New_York'), 'open', SATURDAY, '10:30');
  assertStatus(deriveShopStatus(openOnSaturdayMorning, instant, SEOUL), 'dayoff', SUNDAY, '00:30');

  // 서울 자정 바로 앞과 자정은 요일이 다르다.
  assert.deepEqual(toShopLocalTime(new Date('2026-11-17T14:59:59.999Z'), SEOUL), { weekday: 2, local_time: '23:59' });
  assert.deepEqual(toShopLocalTime(new Date('2026-11-17T15:00:00.000Z'), SEOUL), { weekday: 3, local_time: '00:00' });
  assert.throws(() => toShopLocalTime(instant, 'Nowhere/Nothing'), RangeError);

  const codes = Object.keys(SHOP_STATUS_TEXT_KEYS);
  assert.deepEqual([...codes].sort(), ['closed', 'dayoff', 'open', 'unset']);
  for (const code of codes) assert.equal(SHOP_STATUS_TEXT_KEYS[code], `status.${code}`);
});
