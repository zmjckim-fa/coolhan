// A-07 메뉴 읽기, A-08 추가, A-09 수정, A-10 삭제, A-11 순서 저장의 통합 시험.
// 관리자 API로 쓰고, 쿠키 없이 A-01을 불러 그 값이 있는지 본다. 거절된 쓰기는 A-01의 응답이 요청 전과 같은지 본다.

import assert from 'node:assert/strict';
import { test } from 'node:test';

import { CATEGORY_CODES, CATEGORY_LIST } from '../src/menu-category.js';
import { MENU_ITEM_LIMIT } from '../src/menu-items.js';
import { API_ROUTES } from '../src/route-table.js';
import { INJECTION_IMAGE, INJECTION_SCRIPT, INJECTION_SQL, MINUTE_MS, randomText, startTemporaryServer } from './temporary-server.js';

const OVERVIEW = '/api/public/overview';
const MENU = '/api/admin/menu';
const ORDER = '/api/admin/menu-order';
const MENU_FIELDS = ['category', 'id', 'name', 'price_krw', 'sale_status', 'sort_order'];

const errorOf = (code, text_key) => Object.freeze({ error: { code, text_key } });
const AUTH_REQUIRED = errorOf('auth_required', 'error.session.expired');
const CSRF_REJECTED = errorOf('csrf_rejected', 'error.form.expired');
const BAD_SHAPE = errorOf('bad_shape', 'error.server');
const MENU_NOT_FOUND = errorOf('menu_not_found', 'error.menu.missing');
const MENU_ORDER_MISMATCH = errorOf('menu_order_mismatch', 'error.menu.order');
const MENU_LIMIT_REACHED = errorOf('menu_limit_reached', 'error.menu.limit');
const NAME_REQUIRED = errorOf('menu_name_required', 'error.menu.name.required');
const NAME_INVALID = errorOf('menu_name_invalid', 'error.menu.name.length');
const NAME_TOO_LONG = errorOf('menu_name_too_long', 'error.menu.name.length');
const PRICE_REQUIRED = errorOf('menu_price_required', 'error.menu.price.required');
const PRICE_RANGE = errorOf('menu_price_range', 'error.menu.price.range');
const CATEGORY_INVALID = errorOf('menu_category_invalid', 'error.menu.category.required');
const SALE_STATUS_UNKNOWN = errorOf('menu_sale_status_unknown', 'error.server');

const saltRoll = Object.freeze({ name: 'salt roll', price_krw: 2800, category: 'bread' });
const plainLoaf = Object.freeze({ name: 'plain loaf', price_krw: 3500, category: 'bread' });
const ryeLoaf = Object.freeze({ name: 'rye loaf', price_krw: 5200, category: 'bread' });
const carrotCake = Object.freeze({ name: 'carrot cake', price_krw: 6000, category: 'cake' });
const hotMilk = Object.freeze({ name: 'hot milk', price_krw: 3000, category: 'drink' });

const add = (admin, item) => admin.send('POST', MENU, item);
const change = (admin, id, item) => admin.send('PUT', `${MENU}/${id}`, item);
const remove = (admin, id) => admin.send('DELETE', `${MENU}/${id}`);
const reorder = (admin, category, id) => admin.send('PUT', ORDER, { category, id });

const storedRows = (site) => site.readRows('SELECT * FROM menu_item ORDER BY id');
const schemaOf = (site) => site.readRows("SELECT name, sql FROM sqlite_master WHERE type IN ('table', 'index', 'trigger') ORDER BY name");
const named = (list, name) => list.find((row) => row.name === name);
const namesOf = (list, category) => list.filter((row) => row.category === category).map((row) => row.name);
const fullRow = (row, changes = {}) => ({ name: row.name, price_krw: row.price_krw, category: row.category, sale_status: row.sale_status, ...changes });

async function overviewText(site) {
  const response = await site.request('GET', OVERVIEW);
  assert.equal(response.status, 200);
  assert.deepEqual(response.setCookie, []);
  return response.text;
}

async function publicMenu(site) {
  return JSON.parse(await overviewText(site)).menu_item;
}

/** 메뉴 몇 개가 든 서버와 로그인한 관리자, 그리고 그때의 A-01 응답. */
async function siteWithMenu(t, items = [saltRoll, plainLoaf, ryeLoaf, carrotCake, hotMilk]) {
  const site = await startTemporaryServer(t);
  const admin = await site.logInAsAdmin();
  for (const item of items) assert.equal((await add(admin, item)).status, 201);
  const menu = await publicMenu(site);
  assert.equal(menu.length, items.length);
  return { site, admin, menu, before: await overviewText(site), rowsBefore: storedRows(site) };
}

async function assertNothingChanged({ site, before, rowsBefore }, label) {
  assert.equal(await overviewText(site), before, label);
  assert.deepEqual(storedRows(site), rowsBefore, label);
}

/** 쓰기 API 넷에 보낼, 그대로 보내면 성공할 요청. */
function writeRequests(menu) {
  const first = named(menu, saltRoll.name);
  const breadIds = menu.filter((row) => row.category === 'bread').map((row) => row.id);
  return [
    ['A-08', 'POST', MENU, { name: 'new item', price_krw: 1000, category: 'cookie' }],
    ['A-09', 'PUT', `${MENU}/${first.id}`, fullRow(first, { name: 'renamed', sale_status: 'sold_out' })],
    ['A-10', 'DELETE', `${MENU}/${first.id}`, undefined],
    ['A-11', 'PUT', ORDER, { category: 'bread', id: [...breadIds].reverse() }],
  ];
}

async function assertRefusedWithoutSession(t, routeId) {
  const state = await siteWithMenu(t);
  const [, method, target, json] = writeRequests(state.menu).find(([id]) => id === routeId);
  for (const headers of [{}, { 'X-CSRF-Token': state.admin.csrfToken }, { Cookie: 'bakery_admin=forged.value', 'X-CSRF-Token': state.admin.csrfToken }]) {
    const response = await state.site.request(method, target, { headers, json });
    assert.equal(response.status, 401, routeId);
    assert.deepEqual(response.json, AUTH_REQUIRED);
    assert.ok(!response.text.includes('menu_item'));
    await assertNothingChanged(state, routeId);
  }
}

test('쿠키 없는 메뉴 추가가 거절된 뒤 A-01의 메뉴가 그대로다', async (t) => {
  const state = await siteWithMenu(t, [saltRoll, carrotCake]);
  const response = await state.site.request('POST', MENU, { json: { name: 'uninvited', price_krw: 1, category: 'bread' } });
  assert.equal(response.status, 401);
  assert.deepEqual(response.json, AUTH_REQUIRED);
  await assertNothingChanged(state, 'no cookie');
  assert.deepEqual((await publicMenu(state.site)).map((row) => row.name), [saltRoll.name, carrotCake.name]);
});

test('추가한 메뉴가 A-01에서 읽힌다', async (t) => {
  const site = await startTemporaryServer(t);
  assert.deepEqual(await publicMenu(site), []);
  const admin = await site.logInAsAdmin();
  const added = await add(admin, saltRoll);
  assert.equal(added.status, 201);

  const menu = await publicMenu(site);
  assert.equal(menu.length, 1);
  assert.deepEqual(Object.keys(menu[0]).sort(), MENU_FIELDS);
  assert.deepEqual(menu[0], { id: menu[0].id, ...saltRoll, sale_status: 'on_sale', sort_order: 0 });
  assert.ok(Number.isInteger(menu[0].id) && menu[0].id >= 1);
  assert.deepEqual(menu, added.json.menu_item);
});

test('쿠키 없이 A-07은 401이다', async (t) => {
  const { site, admin } = await siteWithMenu(t, [saltRoll]);
  for (const headers of [{}, { Cookie: 'bakery_admin=forged.value' }, { 'X-CSRF-Token': admin.csrfToken }]) {
    const response = await site.request('GET', MENU, { headers });
    assert.equal(response.status, 401);
    assert.deepEqual(response.json, AUTH_REQUIRED);
    assert.ok(!response.text.includes(saltRoll.name));
  }
  const read = await admin.read(MENU);
  assert.equal(read.status, 200);
  assert.deepEqual(Object.keys(read.json).sort(), ['category_list', 'menu_item']);
  assert.deepEqual(read.json.category_list, CATEGORY_LIST);
  assert.deepEqual(read.json.menu_item, await publicMenu(site));
});

test('쿠키 없이 A-08은 401이다', (t) => assertRefusedWithoutSession(t, 'A-08'));
test('쿠키 없이 A-09는 401이다', (t) => assertRefusedWithoutSession(t, 'A-09'));
test('쿠키 없이 A-10은 401이다', (t) => assertRefusedWithoutSession(t, 'A-10'));
test('쿠키 없이 A-11은 401이다', (t) => assertRefusedWithoutSession(t, 'A-11'));

test('CSRF 토큰 없이 쓰기 API 넷은 403이고 목록이 그대로다', async (t) => {
  const state = await siteWithMenu(t);
  const { site, admin } = state;
  const other = await site.logInAsAdmin();
  const requests = writeRequests(state.menu);
  const menuWrites = API_ROUTES.filter((row) => row.csrf && row.path.startsWith(MENU));
  assert.deepEqual(requests.map(([id]) => id), menuWrites.map((row) => row.id), 'every menu write row of the route table is sent');

  for (const [routeId, method, target, json] of requests) {
    const refusals = [
      { Cookie: admin.cookie },
      { Cookie: admin.cookie, 'X-CSRF-Token': '' },
      { Cookie: admin.cookie, 'X-CSRF-Token': randomText(43) },
      { Cookie: admin.cookie, 'X-CSRF-Token': other.csrfToken },
      { Cookie: admin.cookie, 'X-CSRF-Token': admin.csrfToken, Origin: 'http://attacker.example' },
    ];
    for (const headers of refusals) {
      const response = await site.request(method, target, { headers, json });
      assert.equal(response.status, 403, routeId);
      assert.deepEqual(response.json, CSRF_REJECTED);
      await assertNothingChanged(state, routeId);
    }
  }
  // 같은 요청이 토큰을 붙이면 통과한다: 거절한 까닭은 토큰뿐이다.
  const [, method, target, json] = requests[0];
  assert.equal((await admin.send(method, target, json)).status, 201);
});

test('추가 응답은 201이고 새 메뉴가 판매 중으로 그 분류의 맨 끝에 있다', async (t) => {
  const { site, admin } = await siteWithMenu(t, [saltRoll, plainLoaf, carrotCake]);
  const response = await add(admin, ryeLoaf);
  assert.equal(response.status, 201);
  assert.deepEqual(Object.keys(response.json), ['menu_item']);
  assert.equal(response.headers.get('location'), null);

  const list = response.json.menu_item;
  assert.deepEqual(namesOf(list, 'bread'), [saltRoll.name, plainLoaf.name, ryeLoaf.name]);
  assert.deepEqual(list.map((row) => row.name), [saltRoll.name, plainLoaf.name, ryeLoaf.name, carrotCake.name]);
  const added = named(list, ryeLoaf.name);
  assert.equal(added.sale_status, 'on_sale');
  assert.equal(added.sort_order, 2);
  assert.equal(Math.max(...list.map((row) => row.id)), added.id);
  for (const row of list) assert.deepEqual(Object.keys(row).sort(), MENU_FIELDS);

  // 빈 분류의 첫 메뉴는 0번이고, 순서를 건너뛴 분류에서는 가장 큰 값 다음이다.
  const firstDrink = named((await add(admin, hotMilk)).json.menu_item, hotMilk.name);
  assert.equal(firstDrink.sort_order, 0);
  assert.equal((await remove(admin, named(list, plainLoaf.name).id)).status, 200);
  const afterGap = named((await add(admin, { ...plainLoaf, name: 'after the gap' })).json.menu_item, 'after the gap');
  assert.equal(afterGap.sort_order, 3);
  assert.deepEqual(await publicMenu(site), (await admin.read(MENU)).json.menu_item);
});

test('같은 추가를 두 번 보내면 번호가 다른 두 행이 생긴다', async (t) => {
  const site = await startTemporaryServer(t);
  const admin = await site.logInAsAdmin();
  const first = await add(admin, saltRoll);
  const second = await add(admin, saltRoll);
  assert.equal(first.status, 201);
  assert.equal(second.status, 201);

  const menu = await publicMenu(site);
  assert.equal(menu.length, 2);
  assert.notEqual(menu[0].id, menu[1].id);
  assert.deepEqual(menu.map(({ id, sort_order, ...rest }) => rest), [{ ...saltRoll, sale_status: 'on_sale' }, { ...saltRoll, sale_status: 'on_sale' }]);
  assert.deepEqual(menu.map((row) => row.sort_order), [0, 1]);
});

test('같은 수정을 두 번 보내면 결과가 같다', async (t) => {
  const { site, admin, menu } = await siteWithMenu(t);
  const target = named(menu, plainLoaf.name);
  const body = { name: 'whole wheat loaf', price_krw: 4100, category: 'bread', sale_status: 'sold_out' };

  const first = await change(admin, target.id, body);
  const afterFirst = await overviewText(site);
  site.clock.advance(MINUTE_MS);
  const second = await change(admin, target.id, body);
  assert.equal(first.status, 200);
  assert.equal(second.status, 200);
  assert.equal(second.text, first.text);
  assert.deepEqual(await publicMenu(site), JSON.parse(afterFirst).menu_item);
  assert.equal(storedRows(site).length, menu.length);
  assert.deepEqual(named(await publicMenu(site), body.name), { id: target.id, ...body, sort_order: target.sort_order });
});

test('틀린 값으로 추가하면 400이고 A-01의 메뉴가 그대로다', async (t) => {
  const state = await siteWithMenu(t, [saltRoll]);
  const valid = { name: 'new item', price_krw: 1000, category: 'cake' };
  const without = (field) => Object.fromEntries(Object.entries(valid).filter(([name]) => name !== field));
  const refused = [
    [NAME_REQUIRED, without('name')],
    [NAME_REQUIRED, { ...valid, name: null }],
    [NAME_REQUIRED, { ...valid, name: '' }],
    [NAME_REQUIRED, { ...valid, name: ' \t\n ' }],
    [NAME_TOO_LONG, { ...valid, name: 'n'.repeat(41) }],
    [NAME_TOO_LONG, { ...valid, name: '빵'.repeat(41) }],
    [PRICE_REQUIRED, without('price_krw')],
    [PRICE_REQUIRED, { ...valid, price_krw: null }],
    [PRICE_RANGE, { ...valid, price_krw: -1 }],
    [PRICE_RANGE, { ...valid, price_krw: 1000001 }],
    [PRICE_RANGE, { ...valid, price_krw: 10.5 }],
    [CATEGORY_INVALID, without('category')],
    [CATEGORY_INVALID, { ...valid, category: null }],
    [CATEGORY_INVALID, { ...valid, category: '' }],
    [CATEGORY_INVALID, { ...valid, category: 'pizza' }],
    [CATEGORY_INVALID, { ...valid, category: 'Bread' }],
    // 틀린 것이 여럿이면 이름, 가격, 분류의 순서로 처음 걸린 것을 알린다.
    [NAME_REQUIRED, {}],
    [PRICE_REQUIRED, { name: 'new item' }],
  ];
  for (const [expected, body] of refused) {
    const response = await add(state.admin, body);
    assert.equal(response.status, 400, expected.error.code);
    assert.deepEqual(response.json, expected);
    await assertNothingChanged(state, expected.error.code);
  }

  // 경계 값은 받는다: 이름 1자와 40자, 가격 0과 1000000.
  for (const body of [{ ...valid, name: 'n', price_krw: 0 }, { ...valid, name: '빵'.repeat(40), price_krw: 1000000 }]) {
    assert.equal((await add(state.admin, body)).status, 201);
    assert.deepEqual(fullRow(named(await publicMenu(state.site), body.name)), { ...body, sale_status: 'on_sale' });
  }
});

test('제어 문자가 든 이름의 추가는 400 menu_name_invalid이고 sale_status를 넣은 추가는 400 bad_shape다', async (t) => {
  const state = await siteWithMenu(t, [saltRoll]);
  const valid = { name: 'new item', price_krw: 1000, category: 'cake' };
  for (const name of ['a\u0000b', 'a\tb', 'a\nb', 'a\rb', 'a\u001Fb', 'a\u007Fb', '\u0001ab']) {
    const response = await add(state.admin, { ...valid, name });
    assert.equal(response.status, 400, JSON.stringify(name));
    assert.deepEqual(response.json, NAME_INVALID);
    await assertNothingChanged(state, JSON.stringify(name));
  }

  const misshapen = [
    { ...valid, sale_status: 'on_sale' },
    { ...valid, sale_status: 'sold_out' },
    { ...valid, id: 1 },
    { ...valid, sort_order: 0 },
    { ...valid, created_at: '2020-01-01T00:00:00.000Z' },
    { ...valid, name: 123 },
    { ...valid, name: ['new item'] },
    { ...valid, category: 1 },
    { ...valid, category: ['cake'] },
  ];
  for (const body of misshapen) {
    const response = await add(state.admin, body);
    assert.equal(response.status, 400, JSON.stringify(body));
    assert.deepEqual(response.json, BAD_SHAPE);
    await assertNothingChanged(state, JSON.stringify(body));
  }
});

test('문자열 가격의 추가는 400 menu_price_range이고 A-01의 메뉴가 그대로다', async (t) => {
  const state = await siteWithMenu(t, [saltRoll]);
  const valid = { name: 'new item', price_krw: 1000, category: 'cake' };
  for (const price_krw of ['3500', '0', '', '3,500', true, false, [3500], { won: 3500 }, 1e7]) {
    const response = await add(state.admin, { ...valid, price_krw });
    assert.equal(response.status, 400, JSON.stringify(price_krw));
    assert.deepEqual(response.json, PRICE_RANGE);
    await assertNothingChanged(state, JSON.stringify(price_krw));
  }
  // 수정도 같다: 서버는 글자를 수로 바꾸지 않는다.
  const target = named(state.menu, saltRoll.name);
  const changed = await change(state.admin, target.id, fullRow(target, { price_krw: '2800' }));
  assert.equal(changed.status, 400);
  assert.deepEqual(changed.json, PRICE_RANGE);
  await assertNothingChanged(state, 'string price on change');
});

test('앞뒤 공백을 붙인 이름은 뗀 값으로, 풀어 쓴 한글 이름은 NFC로 저장되어 A-01에 나온다', async (t) => {
  const site = await startTemporaryServer(t);
  const admin = await site.logInAsAdmin();
  const composed = '소금빵';
  const decomposed = composed.normalize('NFD');
  assert.notEqual(decomposed, composed);
  const longComposed = '빵'.repeat(40);
  const longDecomposed = longComposed.normalize('NFD');
  assert.ok([...longDecomposed].length > 40);

  const padded = await add(admin, { name: `  \t${saltRoll.name} \n`, price_krw: 2800, category: 'bread' });
  assert.equal(padded.status, 201);
  assert.equal((await add(admin, { name: decomposed, price_krw: 3000, category: 'bread' })).status, 201);
  assert.equal((await add(admin, { name: ` ${longDecomposed} `, price_krw: 3200, category: 'bread' })).status, 201);
  assert.equal((await add(admin, { name: 'two  inner   spaces', price_krw: 3400, category: 'bread' })).status, 201);

  const expected = [saltRoll.name, composed, longComposed, 'two  inner   spaces'];
  assert.deepEqual(padded.json.menu_item.map((row) => row.name), [saltRoll.name]);
  assert.deepEqual((await publicMenu(site)).map((row) => row.name), expected);
  assert.deepEqual(storedRows(site).map((row) => row.name), expected);

  // 수정도 같은 함수가 돌려준 값을 저장한다.
  const target = named(await publicMenu(site), composed);
  assert.equal((await change(admin, target.id, fullRow(target, { name: `\n ${'크림빵'.normalize('NFD')}\t` }))).status, 200);
  assert.equal(named(await publicMenu(site), '크림빵').id, target.id);
});

test('추가한 행의 created_at과 updated_at, 수정한 행의 updated_at은 시험이 정한 시각이다', async (t) => {
  const addedAt = '2026-05-01T01:02:03.004Z';
  const changedAt = '2026-05-02T10:20:30.400Z';
  const reorderedAt = '2026-05-03T00:00:00.000Z';
  const site = await startTemporaryServer(t);
  const admin = await site.logInAsAdmin();

  site.clock.set(addedAt);
  for (const item of [saltRoll, plainLoaf, ryeLoaf]) assert.equal((await add(admin, item)).status, 201);
  assert.deepEqual(storedRows(site).map(({ created_at, updated_at }) => ({ created_at, updated_at })), [
    { created_at: addedAt, updated_at: addedAt },
    { created_at: addedAt, updated_at: addedAt },
    { created_at: addedAt, updated_at: addedAt },
  ]);

  site.clock.set(changedAt);
  const [first, second, third] = await publicMenu(site);
  assert.equal((await change(admin, second.id, fullRow(second, { price_krw: 3600 }))).status, 200);
  const timesOf = (id) => {
    const [{ created_at, updated_at }] = site.readRows('SELECT created_at, updated_at FROM menu_item WHERE id = ?', id);
    return { created_at, updated_at };
  };
  assert.deepEqual(timesOf(second.id), { created_at: addedAt, updated_at: changedAt });
  assert.deepEqual(timesOf(first.id), { created_at: addedAt, updated_at: addedAt });

  // 순서 저장은 sort_order가 바뀐 행의 updated_at만 새로 쓴다.
  site.clock.set(reorderedAt);
  assert.equal((await reorder(admin, 'bread', [first.id, third.id, second.id])).status, 200);
  assert.deepEqual(timesOf(first.id), { created_at: addedAt, updated_at: addedAt });
  assert.deepEqual(timesOf(second.id), { created_at: addedAt, updated_at: reorderedAt });
  assert.deepEqual(timesOf(third.id), { created_at: addedAt, updated_at: reorderedAt });
});

test('메뉴 200개에서 추가하면 409다', async (t) => {
  assert.equal(MENU_ITEM_LIMIT, 200);
  const site = await startTemporaryServer(t);
  const admin = await site.logInAsAdmin();
  const name = '빵'.repeat(40);
  for (let index = 0; index < MENU_ITEM_LIMIT; index += 1) {
    const response = await add(admin, { name, price_krw: 1000000, category: CATEGORY_CODES[index % CATEGORY_CODES.length] });
    assert.equal(response.status, 201, `item ${index + 1}`);
  }
  const full = await site.request('GET', OVERVIEW);
  assert.equal(full.json.menu_item.length, MENU_ITEM_LIMIT);
  // 상한 개수의 실제 응답도 본문 목표 안이다.
  assert.ok(Buffer.byteLength(full.text) <= 65536, `${Buffer.byteLength(full.text)} bytes`);

  const state = { site, before: full.text, rowsBefore: storedRows(site) };
  const refused = await add(admin, saltRoll);
  assert.equal(refused.status, 409);
  assert.deepEqual(refused.json, MENU_LIMIT_REACHED);
  await assertNothingChanged(state, 'the 201st item');

  // 상한에서도 수정, 순서 저장, 삭제는 되고, 하나를 지우면 다시 하나를 넣을 수 있다.
  const [first] = full.json.menu_item;
  assert.equal((await change(admin, first.id, fullRow(first, { sale_status: 'sold_out' }))).status, 200);
  const breadIds = full.json.menu_item.filter((row) => row.category === first.category).map((row) => row.id);
  assert.equal((await reorder(admin, first.category, [...breadIds].reverse())).status, 200);
  assert.equal((await remove(admin, first.id)).status, 200);
  assert.equal((await add(admin, saltRoll)).status, 201);
  assert.deepEqual((await add(admin, saltRoll)).json, MENU_LIMIT_REACHED);
  assert.equal((await publicMenu(site)).length, MENU_ITEM_LIMIT);
});

test('수정한 네 필드가 A-07과 A-01에서 같은 값이다', async (t) => {
  const { site, admin, menu } = await siteWithMenu(t);
  const target = named(menu, saltRoll.name);
  const body = { name: 'sea salt roll', price_krw: 0, category: 'bread', sale_status: 'sold_out' };
  const response = await change(admin, target.id, body);
  assert.equal(response.status, 200);
  assert.deepEqual(Object.keys(response.json), ['menu_item']);

  const expectedRow = { id: target.id, ...body, sort_order: target.sort_order };
  const expectedList = menu.map((row) => (row.id === target.id ? expectedRow : row));
  assert.deepEqual(response.json.menu_item, expectedList);
  assert.deepEqual((await admin.read(MENU)).json.menu_item, expectedList);
  assert.deepEqual(await publicMenu(site), expectedList);
  assert.deepEqual(fullRow(named(await publicMenu(site), body.name)), body);
});

test('없는 번호를 수정하면 404다', async (t) => {
  const state = await siteWithMenu(t, [saltRoll, plainLoaf]);
  const missingId = Math.max(...state.menu.map((row) => row.id)) + 1;
  const body = fullRow(state.menu[0], { name: 'nobody' });
  for (const id of [missingId, 999999, Number.MAX_SAFE_INTEGER]) {
    const response = await change(state.admin, id, body);
    assert.equal(response.status, 404, String(id));
    assert.deepEqual(response.json, MENU_NOT_FOUND);
    await assertNothingChanged(state, String(id));
  }
  // 지운 번호는 다시 쓰이지 않고 수정할 수도 없다.
  const removedId = state.menu[1].id;
  assert.equal((await remove(state.admin, removedId)).status, 200);
  assert.deepEqual((await change(state.admin, removedId, body)).json, MENU_NOT_FOUND);
  assert.equal((await publicMenu(state.site)).length, 1);
});

test('분류를 바꾸면 새 분류의 맨 끝으로 간다', async (t) => {
  const { site, admin, menu } = await siteWithMenu(t, [saltRoll, plainLoaf, ryeLoaf, carrotCake, { ...carrotCake, name: 'cheese cake' }]);
  const moving = named(menu, saltRoll.name);
  const staying = named(menu, plainLoaf.name);

  const response = await change(admin, moving.id, fullRow(moving, { category: 'cake' }));
  assert.equal(response.status, 200);
  const afterMove = await publicMenu(site);
  assert.deepEqual(namesOf(afterMove, 'cake'), [carrotCake.name, 'cheese cake', saltRoll.name]);
  assert.deepEqual(namesOf(afterMove, 'bread'), [plainLoaf.name, ryeLoaf.name]);
  assert.equal(named(afterMove, saltRoll.name).sort_order, 2);
  assert.equal(named(afterMove, saltRoll.name).id, moving.id);

  // 분류가 그대로면 sort_order도 그대로다.
  assert.equal((await change(admin, staying.id, fullRow(staying, { name: 'still second', price_krw: 1 }))).status, 200);
  assert.equal(named(await publicMenu(site), 'still second').sort_order, staying.sort_order);

  // 빈 분류로 옮기면 0번이다.
  assert.equal((await change(admin, moving.id, fullRow(moving, { category: 'drink' }))).status, 200);
  assert.equal(named(await publicMenu(site), saltRoll.name).sort_order, 0);
  assert.deepEqual(namesOf(await publicMenu(site), 'cake'), [carrotCake.name, 'cheese cake']);
});

test('품절로 바꾸면 A-01에서 sold_out이고 목록에 남아 있다', async (t) => {
  const { site, admin, menu } = await siteWithMenu(t);
  const target = named(menu, plainLoaf.name);

  const soldOut = await change(admin, target.id, fullRow(target, { sale_status: 'sold_out' }));
  assert.equal(soldOut.status, 200);
  const afterSoldOut = await publicMenu(site);
  assert.equal(afterSoldOut.length, menu.length);
  assert.deepEqual(named(afterSoldOut, plainLoaf.name), { ...target, sale_status: 'sold_out' });
  assert.deepEqual(afterSoldOut.filter((row) => row.id !== target.id), menu.filter((row) => row.id !== target.id));

  const backOnSale = await change(admin, target.id, fullRow(target, { sale_status: 'on_sale' }));
  assert.equal(backOnSale.status, 200);
  assert.deepEqual(await publicMenu(site), menu);
});

test('두 값 밖의 판매 상태와 판매 상태가 빠진 수정은 400 menu_sale_status_unknown이고 A-01의 값이 그대로다', async (t) => {
  const state = await siteWithMenu(t);
  const target = named(state.menu, plainLoaf.name);
  const { sale_status: removed, ...withoutStatus } = fullRow(target, { name: 'changed' });
  assert.equal(removed, 'on_sale');
  const bodies = [
    withoutStatus,
    { ...withoutStatus, sale_status: null },
    { ...withoutStatus, sale_status: '' },
    { ...withoutStatus, sale_status: 'hidden' },
    { ...withoutStatus, sale_status: 'SOLD_OUT' },
    { ...withoutStatus, sale_status: 'on_sale ' },
  ];
  for (const body of bodies) {
    const response = await change(state.admin, target.id, body);
    assert.equal(response.status, 400, JSON.stringify(body.sale_status));
    assert.deepEqual(response.json, SALE_STATUS_UNKNOWN);
    await assertNothingChanged(state, JSON.stringify(body.sale_status));
  }
  for (const sale_status of [1, true, ['sold_out']]) {
    const response = await change(state.admin, target.id, { ...withoutStatus, sale_status });
    assert.equal(response.status, 400);
    assert.deepEqual(response.json, BAD_SHAPE);
    await assertNothingChanged(state, JSON.stringify(sale_status));
  }
});

test('삭제한 메뉴가 A-01에서 사라진다', async (t) => {
  const { site, admin, menu } = await siteWithMenu(t);
  const target = named(menu, plainLoaf.name);
  const response = await remove(admin, target.id);
  assert.equal(response.status, 200);
  assert.deepEqual(Object.keys(response.json), ['menu_item']);

  const expected = menu.filter((row) => row.id !== target.id);
  assert.deepEqual(response.json.menu_item, expected);
  assert.deepEqual(await publicMenu(site), expected);
  assert.deepEqual((await admin.read(MENU)).json.menu_item, expected);
  assert.deepEqual(site.readRows('SELECT id FROM menu_item WHERE id = ?', target.id), []);
});

test('같은 삭제를 두 번 보내면 두 번째는 404다', async (t) => {
  const { site, admin, menu } = await siteWithMenu(t);
  const target = named(menu, carrotCake.name);
  assert.equal((await remove(admin, target.id)).status, 200);
  const state = { site, before: await overviewText(site), rowsBefore: storedRows(site) };

  const second = await remove(admin, target.id);
  assert.equal(second.status, 404);
  assert.deepEqual(second.json, MENU_NOT_FOUND);
  await assertNothingChanged(state, 'second delete');
  assert.equal((await publicMenu(site)).length, menu.length - 1);
});

test('숫자가 아닌 번호는 404다', async (t) => {
  const state = await siteWithMenu(t, [saltRoll, plainLoaf]);
  const [first] = state.menu;
  const body = fullRow(first, { name: 'renamed' });
  const notIds = ['abc', `${first.id}abc`, `abc${first.id}`, '0', '-1', `-${first.id}`, `${first.id}.0`, `0${first.id}`, `+${first.id}`, `0x${first.id}`, `${first.id}e0`, '9'.repeat(30), `%3${first.id}`, `${first.id}%20`, 'null', 'undefined'];
  for (const pathId of notIds) {
    for (const response of [await change(state.admin, pathId, body), await remove(state.admin, pathId)]) {
      assert.equal(response.status, 404, pathId);
      assert.deepEqual(response.json, MENU_NOT_FOUND, pathId);
    }
    await assertNothingChanged(state, pathId);
  }
  // 번호 뒤에 경로를 더 붙이면 라우트 표에 없는 경로다.
  for (const target of [`${MENU}/${first.id}/`, `${MENU}/${first.id}/extra`, `${MENU}/`]) {
    const response = await state.admin.send('DELETE', target);
    assert.equal(response.status, 404, target);
    assert.equal(response.json.error.code, 'not_found', target);
  }
  // 입력 검증이 번호 확인보다 먼저다(2-1절 9번과 10번).
  const invalidBody = await change(state.admin, 'abc', { ...body, name: '' });
  assert.equal(invalidBody.status, 400);
  assert.deepEqual(invalidBody.json, NAME_REQUIRED);
  await assertNothingChanged(state, 'after every refusal');
});

test('저장한 순서가 A-01에서 읽힌다', async (t) => {
  const { site, admin, menu } = await siteWithMenu(t);
  const bread = menu.filter((row) => row.category === 'bread');
  assert.deepEqual(bread.map((row) => row.name), [saltRoll.name, plainLoaf.name, ryeLoaf.name]);
  const newOrder = [bread[2].id, bread[0].id, bread[1].id];

  const response = await reorder(admin, 'bread', newOrder);
  assert.equal(response.status, 200);
  assert.deepEqual(Object.keys(response.json), ['menu_item']);
  const after = await publicMenu(site);
  assert.deepEqual(response.json.menu_item, after);
  assert.deepEqual(namesOf(after, 'bread'), [ryeLoaf.name, saltRoll.name, plainLoaf.name]);
  assert.deepEqual(after.filter((row) => row.category === 'bread').map((row) => [row.id, row.sort_order]), newOrder.map((id, position) => [id, position]));
  // 다른 분류는 그대로다.
  assert.deepEqual(after.filter((row) => row.category !== 'bread'), menu.filter((row) => row.category !== 'bread'));
  assert.deepEqual((await admin.read(MENU)).json.menu_item, after);

  // 메뉴가 없는 분류의 빈 순서도 받는다.
  const empty = await reorder(admin, 'cookie', []);
  assert.equal(empty.status, 200);
  assert.deepEqual(empty.json.menu_item, after);
});

test('번호가 빠진 순서는 409이고 A-01의 순서가 그대로다', async (t) => {
  const state = await siteWithMenu(t);
  const bread = state.menu.filter((row) => row.category === 'bread').map((row) => row.id);
  const cakeId = named(state.menu, carrotCake.name).id;
  const missingId = Math.max(...state.menu.map((row) => row.id)) + 1;
  const mismatches = [
    ['one id is missing', 'bread', [bread[2], bread[0]]],
    ['no id at all', 'bread', []],
    ['an id of another category instead', 'bread', [bread[2], bread[0], cakeId]],
    ['an id of another category added', 'bread', [...bread, cakeId]],
    ['an id that does not exist instead', 'bread', [bread[2], bread[0], missingId]],
    ['an id that does not exist added', 'bread', [...bread, missingId]],
    ['a negative id', 'bread', [bread[2], bread[0], -bread[1]]],
    ['ids of another category', 'cake', [...bread].reverse()],
    ['ids for an empty category', 'cookie', [bread[0]]],
  ];
  for (const [label, category, id] of mismatches) {
    const response = await reorder(state.admin, category, id);
    assert.equal(response.status, 409, label);
    assert.deepEqual(response.json, MENU_ORDER_MISMATCH, label);
    await assertNothingChanged(state, label);
  }
});

test('같은 번호가 두 번 든 순서는 400이다', async (t) => {
  const state = await siteWithMenu(t);
  const bread = state.menu.filter((row) => row.category === 'bread').map((row) => row.id);
  const misshapen = [
    ['the same id twice', { category: 'bread', id: [bread[0], bread[1], bread[0]] }],
    ['the same id twice in place of one', { category: 'bread', id: [bread[0], bread[0], bread[2]] }],
    ['id is missing', { category: 'bread' }],
    ['id is null', { category: 'bread', id: null }],
    ['id is not an array', { category: 'bread', id: bread[0] }],
    ['an id as text', { category: 'bread', id: bread.map(String) }],
    ['an id as a fraction', { category: 'bread', id: [bread[0] + 0.5, bread[1], bread[2]] }],
    ['an id is null', { category: 'bread', id: [bread[0], null, bread[2]] }],
    ['more ids than the menu limit', { category: 'bread', id: Array.from({ length: MENU_ITEM_LIMIT + 1 }, (unused, index) => index + 1) }],
    ['an unknown field', { category: 'bread', id: [...bread].reverse(), sort_order: [0, 1, 2] }],
    ['category is not text', { category: 1, id: [...bread].reverse() }],
  ];
  for (const [label, body] of misshapen) {
    const response = await state.admin.send('PUT', ORDER, body);
    assert.equal(response.status, 400, label);
    assert.deepEqual(response.json, BAD_SHAPE, label);
    await assertNothingChanged(state, label);
  }
  for (const category of [undefined, null, '', 'pizza', 'BREAD']) {
    const response = await state.admin.send('PUT', ORDER, { category, id: [...bread].reverse() });
    assert.equal(response.status, 400, String(category));
    assert.deepEqual(response.json, CATEGORY_INVALID);
    await assertNothingChanged(state, String(category));
  }
});

test('같은 순서 저장을 두 번 보내면 결과가 같다', async (t) => {
  const { site, admin, menu } = await siteWithMenu(t);
  const reversed = menu.filter((row) => row.category === 'bread').map((row) => row.id).reverse();

  const first = await reorder(admin, 'bread', reversed);
  const afterFirst = await publicMenu(site);
  const rowsAfterFirst = storedRows(site);
  site.clock.advance(MINUTE_MS);
  const second = await reorder(admin, 'bread', reversed);
  assert.equal(first.status, 200);
  assert.equal(second.status, 200);
  assert.equal(second.text, first.text);
  assert.deepEqual(await publicMenu(site), afterFirst);
  assert.deepEqual(namesOf(afterFirst, 'bread'), [ryeLoaf.name, plainLoaf.name, saltRoll.name]);
  // 두 번째 저장은 바꿀 순서가 없으므로 어느 행도 고치지 않는다.
  assert.deepEqual(storedRows(site), rowsAfterFirst);
});

test('꺾쇠가 든 이름은 글자 그대로 저장되고 JSON으로만 나온다', async (t) => {
  const site = await startTemporaryServer(t);
  const admin = await site.logInAsAdmin();
  const names = [INJECTION_SCRIPT, INJECTION_IMAGE, '</title><b>bold</b>&amp;"\'', '{{text:title.home}}'];
  for (const name of names) {
    const response = await add(admin, { name, price_krw: 1000, category: 'bread' });
    assert.equal(response.status, 201, name);
    assert.equal(response.headers.get('content-type'), 'application/json; charset=utf-8');
  }

  const overview = await site.request('GET', OVERVIEW);
  assert.equal(overview.headers.get('content-type'), 'application/json; charset=utf-8');
  assert.equal(overview.headers.get('x-content-type-options'), 'nosniff');
  assert.deepEqual(overview.json.menu_item.map((row) => row.name), names);
  assert.deepEqual(storedRows(site).map((row) => row.name), names);
  assert.deepEqual((await admin.read(MENU)).json.menu_item.map((row) => row.name), names);

  // 수정으로 넣어도 같다.
  const [first] = overview.json.menu_item;
  assert.equal((await change(admin, first.id, fullRow(first, { name: `${INJECTION_IMAGE} 2` }))).status, 200);
  assert.equal((await publicMenu(site))[0].name, `${INJECTION_IMAGE} 2`);

  // 서버가 내보내는 HTML에는 메뉴 이름이 들어가지 않는다.
  for (const target of ['/', '/admin/login', '/admin/menu', '/no-such-address']) {
    const page = await site.request('GET', target, { headers: { Cookie: admin.cookie } });
    assert.ok(!page.text.includes('alert(1)'), target);
    assert.ok(!page.text.includes('<b>bold</b>'), target);
  }
});

test('이름의 SQL 문자열은 글자 그대로 저장되고 표가 그대로다', async (t) => {
  const { site, admin, menu } = await siteWithMenu(t, [saltRoll, carrotCake]);
  const schemaBefore = schemaOf(site);
  const hoursBefore = site.readRows('SELECT * FROM business_hour ORDER BY weekday');
  const names = [INJECTION_SQL, "x'); DELETE FROM menu_item; --", "Robert'); DROP TABLE business_hour;--", '" OR ""="', "' OR '1'='1"];
  for (const name of names) {
    assert.ok([...name].length <= 40);
    assert.equal((await add(admin, { name, price_krw: 1000, category: 'cookie' })).status, 201, name);
  }
  assert.deepEqual(namesOf(await publicMenu(site), 'cookie'), names);
  assert.deepEqual(storedRows(site).map((row) => row.name), [saltRoll.name, carrotCake.name, ...names]);

  const first = named(menu, saltRoll.name);
  assert.equal((await change(admin, first.id, fullRow(first, { name: INJECTION_SQL }))).status, 200);
  assert.equal(named(await publicMenu(site), carrotCake.name).name, carrotCake.name);

  // 분류, 판매 상태, 경로의 번호에 넣은 SQL 문자열은 값으로만 읽혀 거절된다.
  const countBefore = storedRows(site).length;
  assert.deepEqual((await add(admin, { name: 'x', price_krw: 1, category: "bread' OR '1'='1" })).json, CATEGORY_INVALID);
  assert.deepEqual((await change(admin, first.id, fullRow(first, { sale_status: "on_sale'; --" }))).json, SALE_STATUS_UNKNOWN);
  assert.deepEqual((await reorder(admin, "bread' OR '1'='1", [first.id])).json, CATEGORY_INVALID);
  for (const pathId of [`${first.id}%20OR%201=1`, `${first.id};DROP%20TABLE%20menu_item`, "1'--"]) {
    assert.deepEqual((await remove(admin, pathId)).json, MENU_NOT_FOUND, pathId);
  }
  assert.equal(storedRows(site).length, countBefore);
  assert.deepEqual(schemaOf(site), schemaBefore);
  assert.deepEqual(site.readRows('SELECT * FROM business_hour ORDER BY weekday'), hoursBefore);
  assert.deepEqual(site.errorLines, []);
});
