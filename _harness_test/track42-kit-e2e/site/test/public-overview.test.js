// A-01 방문자 화면 자료의 통합 시험.
// 쓰기 API가 아직 없는 단위의 시험이므로 영업시간과 메뉴 행은 임시 DB에 직접 넣는다(05_소스.md 10-2절).

import assert from 'node:assert/strict';
import { test } from 'node:test';

import { CATEGORY_CODES, MENU_CATEGORIES } from '../src/menu-category.js';
import { INJECTION_IMAGE, INJECTION_SCRIPT, INJECTION_SQL, randomText, startTemporaryServer } from './temporary-server.js';

const OVERVIEW = '/api/public/overview';
const WEEKDAYS = [0, 1, 2, 3, 4, 5, 6];
const TUESDAY = 2;
const OVERVIEW_FIELDS = ['business_hour', 'category_list', 'menu_item', 'shop_name', 'shop_status'];
const HOUR_FIELDS = ['closes_at', 'is_day_off', 'opens_at', 'weekday'];
const MENU_FIELDS = ['category', 'id', 'name', 'price_krw', 'sale_status', 'sort_order'];
const STATUS_FIELDS = ['code', 'local_time', 'text_key', 'weekday'];
const MENU_LIMIT = 200;
const BODY_TARGET_BYTES = 65536;

const emptyDay = (weekday) => ({ weekday, opens_at: null, closes_at: null, is_day_off: 0 });

function seedHours(site, { weekday, opens_at, closes_at, is_day_off }) {
  const { changes } = site.writeRows(
    'UPDATE business_hour SET opens_at = ?, closes_at = ?, is_day_off = ?, updated_at = ? WHERE weekday = ?',
    opens_at, closes_at, is_day_off, site.clock.iso(), weekday,
  );
  assert.equal(changes, 1);
}

function seedMenu(site, { name, price_krw, category, sale_status = 'on_sale', sort_order }) {
  const at = site.clock.iso();
  const { lastInsertRowid } = site.writeRows(
    'INSERT INTO menu_item (name, price_krw, category, sale_status, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    name, price_krw, category, sale_status, sort_order, at, at,
  );
  return { id: lastInsertRowid, name, price_krw, category, sale_status, sort_order };
}

async function readOverview(site, target = OVERVIEW) {
  const response = await site.request('GET', target);
  assert.equal(response.status, 200);
  return response;
}

test('처음 상태의 영업 상태는 unset이다', async (t) => {
  const site = await startTemporaryServer(t);
  const { json } = await readOverview(site);
  assert.deepEqual(json.shop_status, { code: 'unset', text_key: 'status.unset', weekday: TUESDAY, local_time: '12:00' });
});

test('영업 중인 시각의 응답은 open이고 문구 키, 오늘 요일, 계산 기준 시각이 있다', async (t) => {
  const site = await startTemporaryServer(t, { startAt: '2026-11-17T03:34:00.000Z' });
  seedHours(site, { weekday: TUESDAY, opens_at: '07:30', closes_at: '19:00', is_day_off: 0 });

  const { json } = await readOverview(site);
  assert.deepEqual(json.shop_status, { code: 'open', text_key: 'status.open', weekday: TUESDAY, local_time: '12:34' });
  assert.deepEqual(Object.keys(json.shop_status).sort(), STATUS_FIELDS);

  // 같은 영업시간, 다른 요청 시각. 서버는 startServer가 받은 now()로만 계산한다.
  const expected = [
    ['2026-11-16T22:29:00.000Z', 'closed', 'status.closed', TUESDAY, '07:29'],
    ['2026-11-16T22:30:00.000Z', 'open', 'status.open', TUESDAY, '07:30'],
    ['2026-11-17T09:59:00.000Z', 'open', 'status.open', TUESDAY, '18:59'],
    ['2026-11-17T10:00:00.000Z', 'closed', 'status.closed', TUESDAY, '19:00'],
    ['2026-11-17T15:30:00.000Z', 'unset', 'status.unset', TUESDAY + 1, '00:30'],
  ];
  for (const [instant, code, text_key, weekday, local_time] of expected) {
    site.clock.set(instant);
    assert.deepEqual((await readOverview(site)).json.shop_status, { code, text_key, weekday, local_time }, instant);
  }

  seedHours(site, { weekday: TUESDAY, opens_at: null, closes_at: null, is_day_off: 1 });
  site.clock.set('2026-11-17T03:34:00.000Z');
  assert.deepEqual((await readOverview(site)).json.shop_status, { code: 'dayoff', text_key: 'status.dayoff', weekday: TUESDAY, local_time: '12:34' });
});

test('shop_name이 환경 값과 같다', async (t) => {
  const shopName = `bakery <b>&"' ${randomText(8)}`;
  const site = await startTemporaryServer(t, { shopName });
  const response = await readOverview(site);
  assert.equal(response.json.shop_name, shopName);
  assert.equal(response.headers.get('content-type'), 'application/json; charset=utf-8');
});

test('POST로 부르면 405다', async (t) => {
  const site = await startTemporaryServer(t);
  for (const options of [{}, { json: { shop_name: 'x' } }]) {
    const response = await site.request('POST', OVERVIEW, options);
    assert.equal(response.status, 405);
    assert.deepEqual(response.json, { error: { code: 'method_not_allowed', text_key: 'error.page.missing' } });
    assert.equal(response.headers.get('allow'), 'GET');
  }
});

test('처음 상태의 일곱 요일은 시각이 비어 있다', async (t) => {
  const site = await startTemporaryServer(t);
  const { json } = await readOverview(site);
  assert.deepEqual(json.business_hour, WEEKDAYS.map(emptyDay));
});

test('일곱 요일이 0부터 6까지 차례로 온다', async (t) => {
  const site = await startTemporaryServer(t);
  const week = [
    { weekday: 0, opens_at: null, closes_at: null, is_day_off: 1 },
    { weekday: 1, opens_at: '07:30', closes_at: '19:00', is_day_off: 0 },
    { weekday: 2, opens_at: '00:00', closes_at: '23:55', is_day_off: 0 },
    emptyDay(3),
    { weekday: 4, opens_at: '09:05', closes_at: '09:10', is_day_off: 0 },
    { weekday: 5, opens_at: '10:00', closes_at: '22:00', is_day_off: 0 },
    { weekday: 6, opens_at: null, closes_at: null, is_day_off: 1 },
  ];
  // 넣는 순서를 뒤집어도 응답은 요일 순서다.
  for (const row of [...week].reverse()) seedHours(site, row);

  const { json } = await readOverview(site);
  assert.deepEqual(json.business_hour.map((row) => row.weekday), WEEKDAYS);
  assert.deepEqual(json.business_hour, week);
  for (const row of json.business_hour) assert.deepEqual(Object.keys(row).sort(), HOUR_FIELDS);
});

test('응답에 쿠키와 시각 기록 컬럼이 없다', async (t) => {
  const site = await startTemporaryServer(t);
  seedHours(site, { weekday: TUESDAY, opens_at: '07:30', closes_at: '19:00', is_day_off: 0 });
  seedMenu(site, { name: 'plain loaf', price_krw: 3500, category: 'bread', sort_order: 0 });

  const response = await readOverview(site);
  assert.deepEqual(response.setCookie, []);
  assert.deepEqual(Object.keys(response.json).sort(), OVERVIEW_FIELDS);
  assert.deepEqual(Object.keys(response.json.shop_status).sort(), STATUS_FIELDS);
  assert.equal(response.json.menu_item.length, 1);
  for (const row of response.json.business_hour) assert.deepEqual(Object.keys(row).sort(), HOUR_FIELDS);
  for (const row of response.json.menu_item) assert.deepEqual(Object.keys(row).sort(), MENU_FIELDS);
  for (const row of response.json.category_list) assert.deepEqual(Object.keys(row).sort(), ['code', 'text_key']);
  for (const absent of ['updated_at', 'created_at', 'expires_at', 'attempted_at', site.clock.iso(), site.shopTimeZone, 'csrf']) {
    assert.ok(!response.text.includes(absent), absent);
  }

  // 쿠키를 읽지 않는다: 어떤 쿠키를 보내도 응답이 같고 쿠키를 심지 않는다.
  for (const cookie of ['bakery_admin=forged.value', `bakery_admin=${randomText(43)}.${randomText(43)}`]) {
    const withCookie = await site.request('GET', OVERVIEW, { headers: { Cookie: cookie } });
    assert.equal(withCookie.status, 200);
    assert.equal(withCookie.text, response.text);
    assert.deepEqual(withCookie.setCookie, []);
  }
});

test('PUT과 DELETE로 부르면 405이고 영업시간이 그대로다', async (t) => {
  const site = await startTemporaryServer(t);
  seedHours(site, { weekday: TUESDAY, opens_at: '07:30', closes_at: '19:00', is_day_off: 0 });
  const before = await readOverview(site);
  const rowsBefore = site.readRows('SELECT * FROM business_hour ORDER BY weekday');

  const week = WEEKDAYS.map((weekday) => ({ weekday, opens_at: '10:00', closes_at: '11:00', is_day_off: 0 }));
  for (const [method, options] of [['PUT', { json: { business_hour: week } }], ['DELETE', {}], ['PUT', {}]]) {
    const response = await site.request(method, OVERVIEW, options);
    assert.equal(response.status, 405, method);
    assert.equal(response.json.error.code, 'method_not_allowed');
  }

  assert.equal((await readOverview(site)).text, before.text);
  assert.deepEqual(site.readRows('SELECT * FROM business_hour ORDER BY weekday'), rowsBefore);
});

test('A-01을 두 번 불러도 영업시간과 메뉴가 같다', async (t) => {
  const site = await startTemporaryServer(t);
  seedHours(site, { weekday: 4, opens_at: '08:00', closes_at: '20:00', is_day_off: 0 });
  seedMenu(site, { name: 'butter roll', price_krw: 2000, category: 'bread', sort_order: 0 });
  seedMenu(site, { name: 'lemon tea', price_krw: 4000, category: 'drink', sale_status: 'sold_out', sort_order: 0 });
  const rowsBefore = site.readRows('SELECT * FROM menu_item ORDER BY id');

  const first = await readOverview(site);
  const second = await readOverview(site);
  assert.equal(first.json.menu_item.length, 2);
  assert.equal(second.text, first.text);
  assert.deepEqual(second.json.business_hour, first.json.business_hour);
  assert.deepEqual(second.json.menu_item, first.json.menu_item);
  assert.deepEqual(site.readRows('SELECT * FROM menu_item ORDER BY id'), rowsBefore);
});

test('처음 상태의 메뉴는 빈 목록이다', async (t) => {
  const site = await startTemporaryServer(t);
  const { json } = await readOverview(site);
  assert.deepEqual(json.menu_item, []);
  assert.equal(json.category_list.length, MENU_CATEGORIES.length);
});

test('메뉴는 분류 목록의 순서와 sort_order 순서로 온다', async (t) => {
  const site = await startTemporaryServer(t);
  // 넣는 순서(번호 순서)는 분류 순서도 sort_order 순서도 아니다.
  const seeded = [
    seedMenu(site, { name: 'iced tea', price_krw: 4500, category: 'drink', sort_order: 1 }),
    seedMenu(site, { name: 'oat cookie', price_krw: 1800, category: 'cookie', sort_order: 0 }),
    seedMenu(site, { name: 'rye loaf', price_krw: 5200, category: 'bread', sort_order: 2 }),
    seedMenu(site, { name: 'cheese cake', price_krw: 6500, category: 'cake', sort_order: 5 }),
    seedMenu(site, { name: 'salt roll', price_krw: 2800, category: 'bread', sort_order: 0 }),
    seedMenu(site, { name: 'hot milk', price_krw: 3000, category: 'drink', sort_order: 0 }),
    seedMenu(site, { name: 'plain loaf', price_krw: 3500, category: 'bread', sort_order: 1 }),
    seedMenu(site, { name: 'carrot cake', price_krw: 6000, category: 'cake', sort_order: 3 }),
  ];
  const expected = CATEGORY_CODES.flatMap((code) => seeded
    .filter((row) => row.category === code)
    .sort((a, b) => a.sort_order - b.sort_order || a.id - b.id));

  const { json } = await readOverview(site);
  assert.deepEqual(json.menu_item, expected);
  assert.deepEqual(json.menu_item.map((row) => row.name), [
    'salt roll', 'plain loaf', 'rye loaf', 'carrot cake', 'cheese cake', 'oat cookie', 'hot milk', 'iced tea',
  ]);
  assert.deepEqual([...new Set(json.menu_item.map((row) => row.category))], json.category_list.map((category) => category.code));
});

test('품절 메뉴도 sale_status와 함께 온다', async (t) => {
  const site = await startTemporaryServer(t);
  const onSale = seedMenu(site, { name: 'salt roll', price_krw: 2800, category: 'bread', sort_order: 0 });
  const soldOut = seedMenu(site, { name: 'plain loaf', price_krw: 3500, category: 'bread', sale_status: 'sold_out', sort_order: 1 });

  const { json } = await readOverview(site);
  assert.deepEqual(json.menu_item, [onSale, soldOut]);
  assert.deepEqual(json.menu_item.map((row) => row.sale_status), ['on_sale', 'sold_out']);
});

test('분류 목록이 표시 순서대로 문구 키와 함께 온다', async (t) => {
  const site = await startTemporaryServer(t);
  const { json } = await readOverview(site);
  const fromSource = [...MENU_CATEGORIES]
    .sort((a, b) => a.display_order - b.display_order)
    .map(({ code, text_key }) => ({ code, text_key }));
  assert.deepEqual(json.category_list, fromSource);
  // 01_공통규칙.md 6절의 표.
  assert.deepEqual(json.category_list, [
    { code: 'bread', text_key: 'category.bread' },
    { code: 'cake', text_key: 'category.cake' },
    { code: 'cookie', text_key: 'category.cookie' },
    { code: 'drink', text_key: 'category.drink' },
  ]);
});

test('메뉴 200개의 이름이 모두 40자일 때 본문이 65536바이트 이하다', async (t) => {
  const site = await startTemporaryServer(t);
  for (const [character, label] of [['빵', 'three-byte characters'], ['\u{1F35E}', 'four-byte characters']]) {
    site.writeRows('DELETE FROM menu_item');
    const name = character.repeat(40);
    assert.equal([...name].length, 40);
    for (let index = 0; index < MENU_LIMIT; index += 1) {
      seedMenu(site, { name, price_krw: 1000000, category: CATEGORY_CODES[index % CATEGORY_CODES.length], sale_status: 'sold_out', sort_order: index });
    }
    const response = await readOverview(site);
    assert.equal(response.json.menu_item.length, MENU_LIMIT, label);
    assert.ok(response.json.menu_item.every((row) => row.name === name), label);
    const bytes = Buffer.byteLength(response.text);
    assert.equal(Number(response.headers.get('content-length')), bytes, label);
    assert.ok(bytes <= BODY_TARGET_BYTES, `${label}: ${bytes} bytes`);
  }
});

test('sort_order가 같은 메뉴는 번호 순서로 온다', async (t) => {
  const site = await startTemporaryServer(t);
  const first = seedMenu(site, { name: 'third by name', price_krw: 3000, category: 'cake', sort_order: 4 });
  const second = seedMenu(site, { name: 'second by name', price_krw: 1000, category: 'cake', sort_order: 4 });
  const third = seedMenu(site, { name: 'first by name', price_krw: 2000, category: 'cake', sort_order: 4 });
  const earlier = seedMenu(site, { name: 'lower order', price_krw: 2000, category: 'cake', sort_order: 3 });
  assert.ok(first.id < second.id && second.id < third.id && third.id < earlier.id);

  const { json } = await readOverview(site);
  assert.deepEqual(json.menu_item, [earlier, first, second, third]);
});

test('물음표 뒤에 주입 문자열을 붙여도 응답이 같다', async (t) => {
  const site = await startTemporaryServer(t);
  seedHours(site, { weekday: TUESDAY, opens_at: '07:30', closes_at: '19:00', is_day_off: 0 });
  seedMenu(site, { name: 'salt roll', price_krw: 2800, category: 'bread', sort_order: 0 });
  const plain = await readOverview(site);

  const injections = [INJECTION_SQL, INJECTION_SCRIPT, INJECTION_IMAGE];
  assert.equal(injections.length, 3);
  for (const injected of injections) {
    const query = injected.replaceAll(' ', '%20');
    for (const target of [`${OVERVIEW}?${query}`, `${OVERVIEW}?category=${query}&sort=${query}`, `${OVERVIEW}?weekday=1%20OR%201=1`]) {
      const response = await site.rawRequest('GET', target);
      assert.equal(response.status, 200, target);
      assert.equal(response.text, plain.text, target);
    }
  }
  assert.equal(site.readRows('SELECT count(*) AS total FROM menu_item')[0].total, 1);
  assert.equal(site.readRows('SELECT count(*) AS total FROM business_hour')[0].total, 7);
  assert.deepEqual(site.errorLines, []);
});
