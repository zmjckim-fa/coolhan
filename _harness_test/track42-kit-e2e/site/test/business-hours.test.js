// A-05 영업시간 읽기와 A-06 영업시간 저장의 통합 시험.
// 관리자 API로 쓰고, 쿠키 없이 A-01을 불러 그 값이 있는지 본다. 거절된 쓰기는 A-01의 응답이 요청 전과 같은지 본다.

import assert from 'node:assert/strict';
import { test } from 'node:test';

import { INJECTION_IMAGE, INJECTION_SCRIPT, INJECTION_SQL, MINUTE_MS, randomText, startTemporaryServer } from './temporary-server.js';

const OVERVIEW = '/api/public/overview';
const HOURS = '/api/admin/hours';
const WEEKDAYS = [0, 1, 2, 3, 4, 5, 6];
const TUESDAY = 2;
const HOUR_FIELDS = ['closes_at', 'is_day_off', 'opens_at', 'weekday'];

const AUTH_REQUIRED = Object.freeze({ error: { code: 'auth_required', text_key: 'error.session.expired' } });
const CSRF_REJECTED = Object.freeze({ error: { code: 'csrf_rejected', text_key: 'error.form.expired' } });
const BAD_SHAPE = Object.freeze({ error: { code: 'bad_shape', text_key: 'error.server' } });

const open = (weekday, opens_at, closes_at) => ({ weekday, opens_at, closes_at, is_day_off: 0 });
const unset = (weekday) => ({ weekday, opens_at: null, closes_at: null, is_day_off: 0 });
const dayOff = (weekday) => ({ weekday, opens_at: null, closes_at: null, is_day_off: 1 });

/** 시험용 한 주. 일요일 휴무, 수요일 시각 없음, 나머지는 요일마다 다른 시각. */
const sampleWeek = () => [
  dayOff(0),
  open(1, '07:30', '19:00'),
  open(2, '08:00', '20:00'),
  unset(3),
  open(4, '00:00', '23:55'),
  open(5, '09:05', '09:10'),
  open(6, '10:00', '15:30'),
];
const replaceDay = (week, row) => week.map((day) => (day.weekday === row.weekday ? row : day));

const storedRows = (site) => site.readRows('SELECT * FROM business_hour ORDER BY weekday');
const save = (admin, week) => admin.send('PUT', HOURS, { business_hour: week });

async function overviewText(site) {
  const response = await site.request('GET', OVERVIEW);
  assert.equal(response.status, 200);
  return response.text;
}

async function publicWeek(site) {
  return JSON.parse(await overviewText(site)).business_hour;
}

async function publicStatus(site) {
  return JSON.parse(await overviewText(site)).shop_status;
}

/** 저장된 한 주가 있는 서버와 로그인한 관리자, 그리고 그때의 A-01 응답. */
async function siteWithSavedWeek(t) {
  const site = await startTemporaryServer(t);
  const admin = await site.logInAsAdmin();
  const saved = await save(admin, sampleWeek());
  assert.equal(saved.status, 200);
  assert.deepEqual(await publicWeek(site), sampleWeek());
  return { site, admin, before: await overviewText(site), rowsBefore: storedRows(site) };
}

async function assertNothingChanged({ site, before, rowsBefore }, label) {
  assert.equal(await overviewText(site), before, label);
  assert.deepEqual(storedRows(site), rowsBefore, label);
}

test('휴무로 저장하면 A-01 영업 상태가 dayoff다', async (t) => {
  const site = await startTemporaryServer(t);
  const admin = await site.logInAsAdmin();
  assert.equal((await save(admin, replaceDay(sampleWeek(), open(TUESDAY, '07:30', '19:00')))).status, 200);
  assert.deepEqual(await publicStatus(site), { code: 'open', text_key: 'status.open', weekday: TUESDAY, local_time: '12:00' });

  const saved = await save(admin, replaceDay(sampleWeek(), dayOff(TUESDAY)));
  assert.equal(saved.status, 200);
  assert.deepEqual(await publicStatus(site), { code: 'dayoff', text_key: 'status.dayoff', weekday: TUESDAY, local_time: '12:00' });
  assert.deepEqual((await publicWeek(site))[TUESDAY], dayOff(TUESDAY));

  // 휴무 요일은 어느 시각에도 dayoff다.
  for (const instant of ['2026-11-16T15:00:00.000Z', '2026-11-17T14:59:00.000Z']) {
    site.clock.set(instant);
    assert.equal((await publicStatus(site)).code, 'dayoff', instant);
  }
});

test('시각을 비워 저장하면 A-01 영업 상태가 unset이다', async (t) => {
  const site = await startTemporaryServer(t);
  const admin = await site.logInAsAdmin();
  assert.equal((await save(admin, replaceDay(sampleWeek(), open(TUESDAY, '07:30', '19:00')))).status, 200);
  assert.equal((await publicStatus(site)).code, 'open');

  const saved = await save(admin, replaceDay(sampleWeek(), unset(TUESDAY)));
  assert.equal(saved.status, 200);
  assert.deepEqual(await publicStatus(site), { code: 'unset', text_key: 'status.unset', weekday: TUESDAY, local_time: '12:00' });
  assert.deepEqual((await publicWeek(site))[TUESDAY], unset(TUESDAY));

  // 휴무를 풀고 시각을 비워 저장해도 unset이다(휴무가 남지 않는다).
  assert.equal((await save(admin, replaceDay(sampleWeek(), dayOff(TUESDAY)))).status, 200);
  assert.equal((await save(admin, replaceDay(sampleWeek(), unset(TUESDAY)))).status, 200);
  assert.equal((await publicStatus(site)).code, 'unset');
});

test('저장한 한 주가 A-01에서 같은 값으로 읽힌다', async (t) => {
  const site = await startTemporaryServer(t);
  assert.deepEqual(await publicWeek(site), WEEKDAYS.map(unset));
  const admin = await site.logInAsAdmin();

  // 요일 순서를 뒤집어 보내도 요일마다 제 값이 저장된다.
  const saved = await save(admin, [...sampleWeek()].reverse());
  assert.equal(saved.status, 200);
  assert.deepEqual(Object.keys(saved.json), ['business_hour']);
  assert.deepEqual(saved.json.business_hour, sampleWeek());

  const fromPublic = await site.request('GET', OVERVIEW);
  assert.deepEqual(fromPublic.setCookie, []);
  assert.deepEqual(fromPublic.json.business_hour, sampleWeek());
  for (const row of fromPublic.json.business_hour) assert.deepEqual(Object.keys(row).sort(), HOUR_FIELDS);
  assert.deepEqual(fromPublic.json.shop_status, { code: 'open', text_key: 'status.open', weekday: TUESDAY, local_time: '12:00' });
});

test('모르는 필드는 거절한다', async (t) => {
  const state = await siteWithSavedWeek(t);
  const week = sampleWeek().map((day) => open(day.weekday, '10:00', '11:00'));
  const withoutField = (field) => week.map(({ [field]: removed, ...rest }, index) => (index === 3 ? rest : { ...rest, [field]: removed }));
  const bodies = [
    ['unknown top-level field', { business_hour: week, shop_name: 'x' }],
    ['unknown field in a row', { business_hour: replaceDay(week, { ...week[1], note: 'x' }) }],
    ['updated_at in a row', { business_hour: replaceDay(week, { ...week[1], updated_at: '2020-01-01T00:00:00.000Z' }) }],
    ['business_hour is missing', {}],
    ['business_hour is null', { business_hour: null }],
    ['business_hour is not an array', { business_hour: { 0: week[0] } }],
    ['a row is null', { business_hour: week.map((day, index) => (index === 2 ? null : day)) }],
    ['a row without weekday', { business_hour: withoutField('weekday') }],
    ['a row without opens_at', { business_hour: withoutField('opens_at') }],
    ['a row without closes_at', { business_hour: withoutField('closes_at') }],
    ['a row without is_day_off', { business_hour: withoutField('is_day_off') }],
    ['weekday as text', { business_hour: week.map((day, index) => (index === 1 ? { ...day, weekday: '1' } : day)) }],
    ['weekday as a fraction', { business_hour: week.map((day, index) => (index === 1 ? { ...day, weekday: 1.5 } : day)) }],
    ['weekday null', { business_hour: week.map((day, index) => (index === 1 ? { ...day, weekday: null } : day)) }],
    ['opens_at as a number', { business_hour: replaceDay(week, { ...week[1], opens_at: 730 }) }],
    ['is_day_off 2', { business_hour: replaceDay(week, { ...week[1], is_day_off: 2 }) }],
    ['is_day_off true', { business_hour: replaceDay(week, { ...week[1], is_day_off: true }) }],
    ['is_day_off null', { business_hour: replaceDay(week, { ...week[1], is_day_off: null }) }],
  ];
  for (const [label, body] of bodies) {
    const response = await state.admin.send('PUT', HOURS, body);
    assert.equal(response.status, 400, label);
    assert.deepEqual(response.json, BAD_SHAPE, label);
    await assertNothingChanged(state, label);
  }
});

test('쿠키 없이 A-05는 401이다', async (t) => {
  const { site, admin } = await siteWithSavedWeek(t);
  for (const headers of [{}, { Cookie: 'bakery_admin=forged.value' }, { 'X-CSRF-Token': admin.csrfToken }]) {
    const response = await site.request('GET', HOURS, { headers });
    assert.equal(response.status, 401);
    assert.deepEqual(response.json, AUTH_REQUIRED);
    assert.ok(!response.text.includes('business_hour'));
  }
});

test('쿠키 없이 A-06은 401이다', async (t) => {
  const state = await siteWithSavedWeek(t);
  const body = { business_hour: sampleWeek().map((day) => open(day.weekday, '10:00', '11:00')) };
  for (const headers of [{}, { 'X-CSRF-Token': state.admin.csrfToken }, { Cookie: 'bakery_admin=forged.value', 'X-CSRF-Token': state.admin.csrfToken }]) {
    const response = await state.site.request('PUT', HOURS, { headers, json: body });
    assert.equal(response.status, 401);
    assert.deepEqual(response.json, AUTH_REQUIRED);
    await assertNothingChanged(state, 'no session');
  }
});

test('CSRF 토큰 없이 A-06은 403이다', async (t) => {
  const state = await siteWithSavedWeek(t);
  const body = { business_hour: sampleWeek().map((day) => open(day.weekday, '10:00', '11:00')) };
  const response = await state.site.request('PUT', HOURS, { headers: { Cookie: state.admin.cookie }, json: body });
  assert.equal(response.status, 403);
  assert.deepEqual(response.json, CSRF_REJECTED);
  await assertNothingChanged(state, 'no token');

  // 토큰을 본문이나 주소에 넣어도 헤더가 아니면 통하지 않는다.
  const inQuery = await state.site.request('PUT', `${HOURS}?csrf_token=${state.admin.csrfToken}`, { headers: { Cookie: state.admin.cookie }, json: body });
  assert.equal(inQuery.status, 403);
  await assertNothingChanged(state, 'token in the query');
});

test('틀린 CSRF 토큰으로 A-06은 403이다', async (t) => {
  const state = await siteWithSavedWeek(t);
  const other = await state.site.logInAsAdmin();
  const body = { business_hour: sampleWeek().map((day) => open(day.weekday, '10:00', '11:00')) };
  const tokens = ['', randomText(43), other.csrfToken, `${state.admin.csrfToken}x`, state.admin.csrfToken.slice(0, -1), state.admin.csrfToken.toUpperCase()];
  for (const token of tokens) {
    assert.notEqual(token, state.admin.csrfToken);
    const response = await state.site.request('PUT', HOURS, { headers: { Cookie: state.admin.cookie, 'X-CSRF-Token': token }, json: body });
    assert.equal(response.status, 403);
    assert.deepEqual(response.json, CSRF_REJECTED);
    await assertNothingChanged(state, 'wrong token');
  }
});

test('다른 출처의 Origin으로 온 쓰기 요청은 403이다', async (t) => {
  const state = await siteWithSavedWeek(t);
  const { site, admin } = state;
  const body = { business_hour: sampleWeek().map((day) => open(day.weekday, '10:00', '11:00')) };
  const send = (origin) => site.request('PUT', HOURS, {
    headers: { Cookie: admin.cookie, 'X-CSRF-Token': admin.csrfToken, Origin: origin },
    json: body,
  });
  const foreign = ['http://attacker.example', `http://attacker.example:${site.port}`, `http://localhost:${site.port}`, `http://127.0.0.1:${site.port + 1}`, 'http://127.0.0.1', 'null', 'not a url'];
  for (const origin of foreign) {
    const response = await send(origin);
    assert.equal(response.status, 403, origin);
    assert.deepEqual(response.json, CSRF_REJECTED);
    assert.equal(response.headers.get('access-control-allow-origin'), null);
    await assertNothingChanged(state, origin);
  }

  // 같은 출처의 Origin은 통과하고 저장된다.
  const sameOrigin = await send(site.origin);
  assert.equal(sameOrigin.status, 200);
  assert.deepEqual(await publicWeek(site), body.business_hour);
});

test('저장 응답이 A-05로 읽은 값과 같다', async (t) => {
  const site = await startTemporaryServer(t);
  const admin = await site.logInAsAdmin();
  const initial = await admin.read(HOURS);
  assert.equal(initial.status, 200);
  assert.deepEqual(initial.json, { business_hour: WEEKDAYS.map(unset) });

  const saved = await save(admin, sampleWeek());
  assert.equal(saved.status, 200);
  const read = await admin.read(HOURS);
  assert.equal(read.status, 200);
  assert.equal(read.text, saved.text);
  assert.deepEqual(read.json, { business_hour: sampleWeek() });
  for (const row of read.json.business_hour) assert.deepEqual(Object.keys(row).sort(), HOUR_FIELDS);
  assert.ok(!read.text.includes('updated_at'));
  assert.deepEqual(read.json.business_hour, await publicWeek(site));
});

test('하루가 틀리면 400이고 A-01의 일곱 행이 그대로다', async (t) => {
  const state = await siteWithSavedWeek(t);
  const valid = sampleWeek().map((day) => open(day.weekday, '10:00', '11:00'));
  // 앞의 여섯 요일은 맞고 토요일 하나만 틀린 한 주. 한 행도 바뀌지 않아야 한다.
  const withSaturday = (row) => replaceDay(valid, { weekday: 6, is_day_off: 0, ...row });
  const refused = [
    ['hours_time_format', 'error.hours.format', withSaturday({ opens_at: '07:31', closes_at: '19:00' })],
    ['hours_time_format', 'error.hours.format', withSaturday({ opens_at: '07:30', closes_at: '24:00' })],
    ['hours_time_format', 'error.hours.format', withSaturday({ opens_at: '7:30', closes_at: '19:00' })],
    ['hours_time_format', 'error.hours.format', withSaturday({ opens_at: '', closes_at: '' })],
    ['hours_opens_required', 'error.hours.opens.required', withSaturday({ opens_at: null, closes_at: '19:00' })],
    ['hours_closes_required', 'error.hours.closes.required', withSaturday({ opens_at: '07:30', closes_at: null })],
    ['hours_close_not_after_open', 'error.hours.order', withSaturday({ opens_at: '09:00', closes_at: '09:00' })],
    ['hours_close_not_after_open', 'error.hours.order', withSaturday({ opens_at: '22:00', closes_at: '02:00' })],
    ['hours_week_incomplete', 'error.server', valid.slice(0, 6)],
    ['hours_week_incomplete', 'error.server', [...valid, open(0, '10:00', '11:00')]],
    ['hours_week_incomplete', 'error.server', replaceDay(valid, open(5, '10:00', '11:00')).map((day, index) => (index === 6 ? { ...day, weekday: 5 } : day))],
    ['hours_week_incomplete', 'error.server', valid.map((day, index) => (index === 6 ? { ...day, weekday: 7 } : day))],
    ['hours_week_incomplete', 'error.server', valid.map((day, index) => (index === 6 ? { ...day, weekday: -1 } : day))],
    ['hours_week_incomplete', 'error.server', []],
  ];
  for (const [code, text_key, week] of refused) {
    const response = await save(state.admin, week);
    assert.equal(response.status, 400, code);
    assert.deepEqual(response.json, { error: { code, text_key } });
    await assertNothingChanged(state, code);
  }

  // 경계: 닫는 시각이 5분 늦으면 저장된다.
  const accepted = await save(state.admin, withSaturday({ opens_at: '09:00', closes_at: '09:05' }));
  assert.equal(accepted.status, 200);
  assert.deepEqual((await publicWeek(state.site))[6], open(6, '09:00', '09:05'));
});

test('같은 저장을 두 번 보내면 결과가 같다', async (t) => {
  const site = await startTemporaryServer(t);
  const admin = await site.logInAsAdmin();
  const first = await save(admin, sampleWeek());
  const firstOverview = await overviewText(site);
  const firstSavedAt = site.clock.iso();
  assert.ok(storedRows(site).every((row) => row.updated_at === firstSavedAt));

  site.clock.advance(MINUTE_MS);
  const second = await save(admin, sampleWeek());
  assert.equal(first.status, 200);
  assert.equal(second.status, 200);
  assert.equal(second.text, first.text);
  assert.equal(await overviewText(site), firstOverview.replace('"local_time":"12:00"', '"local_time":"12:01"'));
  assert.equal(storedRows(site).length, 7);
  // 값은 같고 DB의 updated_at만 새 시각이다.
  assert.ok(storedRows(site).every((row) => row.updated_at === site.clock.iso()));
  assert.notEqual(site.clock.iso(), firstSavedAt);
});

test('휴무인데 시각이 있는 저장은 400 hours_day_off_has_time이고 A-01의 일곱 행이 그대로다', async (t) => {
  const state = await siteWithSavedWeek(t);
  const valid = sampleWeek().map((day) => open(day.weekday, '10:00', '11:00'));
  const rows = [
    { weekday: 6, opens_at: '07:30', closes_at: '19:00', is_day_off: 1 },
    { weekday: 6, opens_at: '07:30', closes_at: null, is_day_off: 1 },
    { weekday: 6, opens_at: null, closes_at: '19:00', is_day_off: 1 },
    { weekday: 6, opens_at: 'not a time', closes_at: null, is_day_off: 1 },
  ];
  for (const row of rows) {
    const response = await save(state.admin, replaceDay(valid, row));
    assert.equal(response.status, 400);
    assert.deepEqual(response.json, { error: { code: 'hours_day_off_has_time', text_key: 'error.server' } });
    await assertNothingChanged(state, JSON.stringify(row));
  }
});

test('저장한 일곱 행의 updated_at은 시험이 정한 시각이다', async (t) => {
  const savedAt = '2026-07-01T05:06:07.089Z';
  const site = await startTemporaryServer(t);
  const admin = await site.logInAsAdmin();
  site.clock.set(savedAt);
  assert.equal((await save(admin, sampleWeek())).status, 200);

  const rows = storedRows(site);
  assert.equal(rows.length, 7);
  assert.deepEqual(rows.map((row) => row.updated_at), WEEKDAYS.map(() => savedAt));
  assert.deepEqual(rows.map(({ weekday, opens_at, closes_at, is_day_off }) => ({ weekday, opens_at, closes_at, is_day_off })), sampleWeek());
});

test('휴무로 저장한 요일은 A-05에서 두 시각이 비어 있다', async (t) => {
  const site = await startTemporaryServer(t);
  const admin = await site.logInAsAdmin();
  const withHours = sampleWeek().map((day) => open(day.weekday, '07:30', '19:00'));
  assert.equal((await save(admin, withHours)).status, 200);
  assert.ok((await admin.read(HOURS)).json.business_hour.every((row) => row.opens_at === '07:30' && row.closes_at === '19:00'));

  const closedDays = [1, 4];
  const week = withHours.map((day) => (closedDays.includes(day.weekday) ? dayOff(day.weekday) : day));
  assert.equal((await save(admin, week)).status, 200);

  const read = await admin.read(HOURS);
  assert.deepEqual(read.json.business_hour, week);
  for (const weekday of closedDays) {
    assert.deepEqual(read.json.business_hour[weekday], { weekday, opens_at: null, closes_at: null, is_day_off: 1 });
    const [stored] = site.readRows('SELECT opens_at, closes_at, is_day_off FROM business_hour WHERE weekday = ?', weekday);
    assert.deepEqual(stored, { opens_at: null, closes_at: null, is_day_off: 1 });
  }
});

test('시각 칸의 SQL 문자열은 400이고 A-01의 일곱 행이 그대로다', async (t) => {
  const state = await siteWithSavedWeek(t);
  const tablesBefore = state.site.readRows("SELECT name, sql FROM sqlite_master WHERE type IN ('table', 'index', 'trigger') ORDER BY name");
  const valid = sampleWeek().map((day) => open(day.weekday, '10:00', '11:00'));
  const injections = [INJECTION_SQL, "07:30' OR '1'='1", "07:30'; DELETE FROM business_hour; --", INJECTION_SCRIPT, INJECTION_IMAGE];
  for (const injected of injections) {
    for (const row of [{ opens_at: injected, closes_at: '19:00' }, { opens_at: '07:30', closes_at: injected }]) {
      const response = await save(state.admin, replaceDay(valid, { weekday: 6, is_day_off: 0, ...row }));
      assert.equal(response.status, 400, injected);
      assert.deepEqual(response.json, { error: { code: 'hours_time_format', text_key: 'error.hours.format' } });
      assert.ok(!response.text.includes('alert') && !response.text.includes('DELETE'), injected);
      await assertNothingChanged(state, injected);
    }
  }
  assert.deepEqual(state.site.readRows("SELECT name, sql FROM sqlite_master WHERE type IN ('table', 'index', 'trigger') ORDER BY name"), tablesBefore);
  assert.equal(storedRows(state.site).length, 7);
  assert.deepEqual(state.site.errorLines, []);
});
