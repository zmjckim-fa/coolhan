// 보안 통제의 공통 시험: 보안 헤더, 본문 상한, 경로 벗어나기, 오류 모양, 기록 줄.
// 서버는 임시 폴더의 DB 파일과 웹 폴더로 포트 0에 띄운다(test/temporary-server.js).

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';
import { test } from 'node:test';

import {
  BODY_LIMIT_BYTES,
  FIELD_ARRAY,
  FIELD_INTEGER,
  FIELD_STRING,
  FIELD_STRING_OR_NULL,
  FIELD_UNTYPED,
  FIELD_ZERO_OR_ONE,
  matchesBodyShape,
  readJsonBody,
} from '../src/json-exchange.js';
import { API_ROUTES, SCREEN_ROUTES } from '../src/route-table.js';
import { startServer } from '../src/server.js';
import {
  INJECTION_IMAGE,
  INJECTION_SCRIPT,
  INJECTION_SQL,
  NOT_FOUND_PAGE_MARK,
  STATIC_FILE_ADDRESS,
  STATIC_FILE_BODY,
  TEST_DICTIONARY,
  randomText,
  startTemporaryServer,
} from './temporary-server.js';

const siteRoot = path.join(import.meta.dirname, '..');
const sourceFolder = path.join(siteRoot, 'src');

// 05_소스.md 5-5절의 표를 그대로 옮긴 기대값. src의 상수를 가져오지 않는다.
const EXPECTED_CSP = "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'self'; "
  + "form-action 'self'; base-uri 'none'; frame-ancestors 'none'";
const EXPECTED_ON_EVERY_RESPONSE = Object.freeze({
  'content-security-policy': EXPECTED_CSP,
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
  'referrer-policy': 'no-referrer',
  'cross-origin-opener-policy': 'same-origin',
  'cross-origin-resource-policy': 'same-origin',
  'permissions-policy': 'geolocation=(), camera=(), microphone=()',
});
const NOT_FOUND_ERROR = Object.freeze({ error: { code: 'not_found', text_key: 'error.page.missing' } });
const JSON_TYPE = 'application/json; charset=utf-8';
const HTML_TYPE = 'text/html; charset=utf-8';
const ENVIRONMENT_NAMES = ['ADMIN_PASSWORD', 'SESSION_SECRET', 'SHOP_NAME', 'SHOP_TIME_ZONE', 'PORT', 'DB_FILE'];

const screenPath = (id) => SCREEN_ROUTES.find((row) => row.id === id).path;
const screenMark = (id) => `data-screen="${id}"`;
const adminScreens = SCREEN_ROUTES.filter((row) => row.permission === 'admin');

function assertSecurityHeaders(response, label) {
  for (const [name, value] of Object.entries(EXPECTED_ON_EVERY_RESPONSE)) {
    assert.equal(response.headers.get(name), value, `${label}: ${name}`);
  }
  assert.ok(['no-store', 'no-cache'].includes(response.headers.get('cache-control')), `${label}: cache-control`);
  assert.equal(response.headers.get('strict-transport-security'), null, `${label}: strict-transport-security`);
  assert.equal(response.headers.get('access-control-allow-origin'), null, `${label}: access-control-allow-origin`);
  assert.equal(response.headers.get('server'), null, `${label}: server`);
  assert.equal(response.headers.get('x-powered-by'), null, `${label}: x-powered-by`);
}

function assertNeverStoredNeverIndexed(response, label) {
  assert.equal(response.headers.get('cache-control'), 'no-store', `${label}: cache-control`);
  assert.equal(response.headers.get('x-robots-tag'), 'noindex, nofollow', `${label}: x-robots-tag`);
}

function fakeRequest(bytes, headers, chunkSize = bytes.length) {
  const chunks = [];
  for (let start = 0; start < bytes.length; start += chunkSize) chunks.push(bytes.subarray(start, start + chunkSize));
  const stream = Readable.from(chunks, { objectMode: false });
  stream.headers = headers;
  return stream;
}

/** 응답이 온 뒤 서버가 기록 줄을 쓸 때까지 잠깐 기다린다. */
async function waitUntil(condition) {
  for (let attempt = 0; attempt < 400 && !condition(); attempt += 1) {
    await new Promise((resolve) => {
      setTimeout(resolve, 5);
    });
  }
}

const jsonRequest = (text, headers = {}) => fakeRequest(Buffer.from(text), { 'content-type': 'application/json', ...headers });

function jsonTextOfBytes(byteLength) {
  const frame = '{"a":""}';
  const text = `{"a":"${'x'.repeat(byteLength - frame.length)}"}`;
  assert.equal(Buffer.byteLength(text), byteLength);
  return text;
}

test('정적 파일, 화면 경로, 404 응답에 보안 헤더가 있다', async (t) => {
  const site = await startTemporaryServer(t);
  const expected = [
    ['GET', STATIC_FILE_ADDRESS, 200],
    ['GET', '/text/ko.json', 200],
    ['GET', screenPath('S-01'), 200],
    ['GET', screenPath('S-02'), 200],
    ['GET', screenPath('S-03'), 302],
    ['GET', '/no-such-address', 404],
    ['GET', '/api/no-such-address', 404],
    ['POST', STATIC_FILE_ADDRESS, 405],
  ];
  for (const [method, target, status] of expected) {
    const response = await site.request(method, target);
    assert.equal(response.status, status, `${method} ${target}`);
    assertSecurityHeaders(response, `${method} ${target}`);
  }

  const withPage = await startTemporaryServer(t, { notFoundPage: true });
  const missing = await withPage.request('GET', '/no-such-address');
  assert.equal(missing.status, 404);
  assert.equal(missing.headers.get('content-type'), HTML_TYPE);
  assertSecurityHeaders(missing, 'html 404');
});

test('CSP에 unsafe-inline과 unsafe-eval이 없다', async (t) => {
  const site = await startTemporaryServer(t);
  for (const target of [STATIC_FILE_ADDRESS, screenPath('S-01'), screenPath('S-02'), '/no-such-address', '/api/no-such-address']) {
    const policy = (await site.request('GET', target)).headers.get('content-security-policy');
    assert.equal(policy, EXPECTED_CSP, target);
    assert.ok(!policy.includes('unsafe-inline'), target);
    assert.ok(!policy.includes('unsafe-eval'), target);
    assert.ok(!policy.includes('*'), target);
    assert.ok(!policy.includes('data:'), target);
  }
});

test('웹 폴더 밖 파일은 날 경로로도 받을 수 없다', async (t) => {
  const site = await startTemporaryServer(t);
  const inside = await site.rawRequest('GET', STATIC_FILE_ADDRESS);
  assert.equal(inside.status, 200, 'the raw request helper reaches the server');
  assert.equal(inside.text, STATIC_FILE_BODY);

  const escapes = [
    '/.env',
    '/outside.json',
    '/../.env',
    '/../outside.json',
    '/text/../../.env',
    '/text/../../outside.json',
    '/text/../tokens.css',
    '/%2e%2e/.env',
    '/%2e%2e/outside.json',
    '/%2E%2E%2Foutside.json',
    '/..%2f.env',
    '/text/%2e%2e/%2e%2e/outside.json',
    '/..\\.env',
    '/..\\outside.json',
    '/text\\..\\..\\outside.json',
    '//outside.json',
    '/../data/bakery.sqlite',
    '/../web/tokens.css',
    `/${site.folder.replaceAll('\\', '/').replaceAll(' ', '%20')}/outside.json`,
    '/tokens.css/../../outside.json',
    '/tokens.css%00.json',
  ];
  for (const rawPath of escapes) {
    const response = await site.rawRequest('GET', rawPath);
    assert.equal(response.status, 404, rawPath);
    assert.ok(!response.text.includes(site.outsideMark), rawPath);
    assert.ok(!response.text.includes('SQLite format'), rawPath);
    assert.deepEqual(JSON.parse(response.text), NOT_FOUND_ERROR, rawPath);
  }
});

test('HTML 파일 이름 경로는 404다', async (t) => {
  const site = await startTemporaryServer(t, { notFoundPage: true });
  const fileNames = [...SCREEN_ROUTES.map((row) => row.file), 'not-found.html'];
  assert.equal(fileNames.length, SCREEN_ROUTES.length + 1);
  for (const fileName of fileNames) {
    const response = await site.request('GET', `/${fileName}`);
    assert.equal(response.status, 404, fileName);
    assert.ok(response.text.includes(NOT_FOUND_PAGE_MARK), fileName);
    assert.ok(!response.text.includes('data-screen='), fileName);
  }
  for (const row of SCREEN_ROUTES.filter((screen) => screen.permission === 'none')) {
    const response = await site.request('GET', row.path);
    assert.equal(response.status, 200, row.path);
    assert.ok(response.text.includes(screenMark(row.id)), row.path);
  }
});

test('정적 파일 주소는 GET에 200이고 다른 메서드에 405다', async (t) => {
  const site = await startTemporaryServer(t);
  const file = await site.request('GET', STATIC_FILE_ADDRESS);
  assert.equal(file.status, 200);
  assert.equal(file.text, STATIC_FILE_BODY);
  assert.equal(file.headers.get('content-type'), 'text/css; charset=utf-8');
  assert.equal(file.headers.get('cache-control'), 'no-cache');
  assert.equal(file.headers.get('x-robots-tag'), null);
  assert.equal(file.setCookie.length, 0);

  const dictionary = await site.request('GET', '/text/ko.json');
  assert.equal(dictionary.status, 200);
  assert.equal(dictionary.headers.get('content-type'), JSON_TYPE);
  assert.deepEqual(dictionary.json, TEST_DICTIONARY);

  const withQuery = await site.request('GET', `${STATIC_FILE_ADDRESS}?v=1`);
  assert.equal(withQuery.status, 200);
  assert.equal(withQuery.text, STATIC_FILE_BODY);

  for (const target of [STATIC_FILE_ADDRESS, '/text/ko.json', screenPath('S-01'), screenPath('S-02'), screenPath('S-03')]) {
    for (const method of ['POST', 'PUT', 'DELETE', 'PATCH']) {
      const response = await site.request(method, target);
      assert.equal(response.status, 405, `${method} ${target}`);
      assert.deepEqual(response.json, { error: { code: 'method_not_allowed', text_key: 'error.page.missing' } });
      assert.equal(response.headers.get('content-type'), JSON_TYPE);
      assertNeverStoredNeverIndexed(response, `${method} ${target}`);
    }
  }
});

test('/package.json은 없는 주소다', async (t) => {
  const site = await startTemporaryServer(t);
  for (const target of ['/package.json', '/package.json?x=1']) {
    const response = await site.request('GET', target);
    assert.equal(response.status, 404, target);
    assert.deepEqual(response.json, NOT_FOUND_ERROR);
    assert.ok(!response.text.includes('module'));
  }
  const raw = await site.rawRequest('GET', '/text/../package.json');
  assert.equal(raw.status, 404);
  assert.ok(!raw.text.includes('module'));
});

test('404 응답에 Cache-Control no-store와 X-Robots-Tag noindex가 있다', async (t) => {
  const withoutPage = await startTemporaryServer(t);
  for (const target of ['/no-such-address', '/api/no-such-address', '/home.html', '/admin/no-such-address']) {
    const response = await withoutPage.request('GET', target);
    assert.equal(response.status, 404, target);
    assert.equal(response.headers.get('content-type'), JSON_TYPE, target);
    assertNeverStoredNeverIndexed(response, target);
  }

  const withPage = await startTemporaryServer(t, { notFoundPage: true });
  const html = await withPage.request('GET', '/no-such-address');
  assert.equal(html.status, 404);
  assert.equal(html.headers.get('content-type'), HTML_TYPE);
  assertNeverStoredNeverIndexed(html, 'html 404');
  const api = await withPage.request('GET', '/api/no-such-address');
  assert.equal(api.status, 404);
  assert.equal(api.headers.get('content-type'), JSON_TYPE);
  assertNeverStoredNeverIndexed(api, 'json 404 beside a not-found page');
});

test('startServer는 연 포트와 close를 돌려주고 close 뒤에는 요청이 닿지 않는다', async (t) => {
  const site = await startTemporaryServer(t);
  const environment = {
    adminPassword: randomText(24),
    sessionSecret: randomText(48),
    shopName: site.shopName,
    shopTimeZone: site.shopTimeZone,
    port: 0,
    dbFile: path.join(site.folder, 'data', 'second.sqlite'),
  };
  const quiet = { webRoot: site.webRoot, now: site.clock.now, writeLog: () => {}, writeError: () => {} };

  const running = await startServer({ environment, ...quiet });
  assert.deepEqual(Object.keys(running).sort(), ['close', 'port']);
  assert.ok(Number.isInteger(running.port) && running.port > 0 && running.port !== site.port);
  const address = `http://127.0.0.1:${running.port}${STATIC_FILE_ADDRESS}`;
  assert.equal((await fetch(address)).status, 200);

  await assert.rejects(startServer({ environment: { ...environment, port: running.port }, ...quiet }), { code: 'EADDRINUSE' });
  await assert.rejects(startServer({ ...quiet }), TypeError);

  const closed = running.close();
  assert.ok(closed instanceof Promise);
  await closed;
  await assert.rejects(fetch(address));
  await running.close();

  // close()가 DB를 닫았으므로 같은 파일로 다시 띄울 수 있다.
  const again = await startServer({ environment, ...quiet });
  assert.equal((await fetch(`http://127.0.0.1:${again.port}${STATIC_FILE_ADDRESS}`)).status, 200);
  await again.close();
});

test('본문 읽기 함수는 16384바이트를 받고 16385바이트에서 body_too_large다', async () => {
  assert.equal(BODY_LIMIT_BYTES, 16384);
  const atLimit = jsonTextOfBytes(16384);
  const overLimit = jsonTextOfBytes(16385);

  const accepted = await readJsonBody(jsonRequest(atLimit, { 'content-length': '16384' }));
  assert.equal(accepted.ok, true);
  assert.equal(accepted.value.a.length, 16384 - 8);

  const acceptedInChunks = await readJsonBody(fakeRequest(Buffer.from(atLimit), { 'content-type': 'application/json' }, 1000));
  assert.equal(acceptedInChunks.ok, true);

  assert.deepEqual(await readJsonBody(jsonRequest(overLimit, { 'content-length': '16385' })), { ok: false, code: 'body_too_large' });
  // Content-Length가 없거나 작게 적혀 있어도 실제로 받은 바이트로 센다.
  assert.deepEqual(await readJsonBody(jsonRequest(overLimit)), { ok: false, code: 'body_too_large' });
  assert.deepEqual(await readJsonBody(jsonRequest(overLimit, { 'content-length': '10' })), { ok: false, code: 'body_too_large' });
  assert.deepEqual(
    await readJsonBody(fakeRequest(Buffer.from(overLimit), { 'content-type': 'application/json' }, 4096)),
    { ok: false, code: 'body_too_large' },
  );
  // 상한을 넘은 본문은 깨져 있어도 구문 검사까지 가지 않는다.
  assert.deepEqual(await readJsonBody(jsonRequest('x'.repeat(40000))), { ok: false, code: 'body_too_large' });
});

test('본문 읽기 함수는 깨진 JSON과 객체가 아닌 JSON에 bad_json이다', async () => {
  const broken = ['', ' ', '{', '{"a":}', '{"a":1,}', "{'a':1}", '{"a":1}{"b":2}', 'undefined', INJECTION_SQL];
  const notAnObject = ['[]', '[{"a":1}]', '"text"', '123', 'true', 'null'];
  for (const text of [...broken, ...notAnObject]) {
    assert.deepEqual(await readJsonBody(jsonRequest(text)), { ok: false, code: 'bad_json' }, JSON.stringify(text));
  }
  const invalidUtf8 = fakeRequest(Buffer.from([0x7b, 0x22, 0x61, 0x22, 0x3a, 0x22, 0xff, 0xfe, 0x22, 0x7d]), { 'content-type': 'application/json' });
  assert.deepEqual(await readJsonBody(invalidUtf8), { ok: false, code: 'bad_json' });

  assert.deepEqual(await readJsonBody(jsonRequest('{}')), { ok: true, value: {} });
  assert.deepEqual(await readJsonBody(jsonRequest(' {"a":[1,null]} ')), { ok: true, value: { a: [1, null] } });
});

test('본문 읽기 함수는 JSON이 아닌 Content-Type에 unsupported_media_type이다', async () => {
  const body = Buffer.from('{"a":1}');
  const refused = [
    {},
    { 'content-type': '' },
    { 'content-type': 'text/plain' },
    { 'content-type': 'application/x-www-form-urlencoded' },
    { 'content-type': 'multipart/form-data; boundary=x' },
    { 'content-type': 'application/jsonx' },
    { 'content-type': 'text/json' },
    { 'content-type': 'application/json, text/plain' },
  ];
  for (const headers of refused) {
    assert.deepEqual(await readJsonBody(fakeRequest(body, headers)), { ok: false, code: 'unsupported_media_type' }, JSON.stringify(headers));
  }
  // 종류가 먼저다: JSON이 아니면 크기와 구문을 보지 않는다.
  assert.deepEqual(
    await readJsonBody(fakeRequest(Buffer.from('x'.repeat(20000)), { 'content-type': 'text/plain' })),
    { ok: false, code: 'unsupported_media_type' },
  );
  for (const contentType of ['application/json', 'application/json; charset=utf-8', 'Application/JSON', ' application/json ;charset=UTF-8']) {
    assert.deepEqual(await readJsonBody(fakeRequest(body, { 'content-type': contentType })), { ok: true, value: { a: 1 } }, contentType);
  }
});

test('본문 모양 검사는 모르는 필드와 다른 JSON 타입에 bad_shape이고 price_krw의 타입은 보지 않는다', () => {
  const menuShape = {
    name: { type: FIELD_STRING, ownCode: true },
    price_krw: { type: FIELD_UNTYPED },
    category: { type: FIELD_STRING, ownCode: true },
  };
  const menu = { name: 'a', price_krw: 1000, category: 'bread' };
  assert.equal(matchesBodyShape(menu, menuShape), true);
  assert.equal(matchesBodyShape({ ...menu, sale_status: 'on_sale' }, menuShape), false, 'unknown field');
  assert.equal(matchesBodyShape(JSON.parse('{"name":"a","price_krw":1,"category":"bread","__proto__":{}}'), menuShape), false, 'unknown field __proto__');
  for (const name of [1, true, ['a'], { a: 1 }]) assert.equal(matchesBodyShape({ ...menu, name }, menuShape), false, `name ${JSON.stringify(name)}`);
  for (const category of [1, false, [], {}]) assert.equal(matchesBodyShape({ ...menu, category }, menuShape), false, `category ${JSON.stringify(category)}`);
  for (const price_krw of ['1000', 10.5, true, [1], { won: 1 }, null, -1, 1000001]) {
    assert.equal(matchesBodyShape({ ...menu, price_krw }, menuShape), true, `price_krw ${JSON.stringify(price_krw)}`);
  }
  // 전용 코드가 있는 필드는 없거나 null이어도 모양 검사를 지난다. 그 코드는 입력 규칙이 낸다.
  assert.equal(matchesBodyShape({}, menuShape), true);
  assert.equal(matchesBodyShape({ name: null, price_krw: null, category: null }, menuShape), true);
  for (const notAnObject of [null, [], 'text', 1]) assert.equal(matchesBodyShape(notAnObject, menuShape), false);

  const weekShape = {
    business_hour: {
      type: FIELD_ARRAY,
      items: {
        weekday: { type: FIELD_INTEGER },
        opens_at: { type: FIELD_STRING_OR_NULL },
        closes_at: { type: FIELD_STRING_OR_NULL },
        is_day_off: { type: FIELD_ZERO_OR_ONE },
      },
    },
  };
  const day = { weekday: 1, opens_at: '07:30', closes_at: null, is_day_off: 0 };
  const week = (...rows) => ({ business_hour: rows });
  assert.equal(matchesBodyShape(week(day, { ...day, weekday: 99, opens_at: 'not a time' }), weekShape), true, 'ranges and formats are not looked at');
  assert.equal(matchesBodyShape(week(), weekShape), true, 'the number of rows is a rule, not a shape');
  assert.equal(matchesBodyShape({}, weekShape), false, 'a required field without its own code');
  assert.equal(matchesBodyShape({ business_hour: null }, weekShape), false);
  assert.equal(matchesBodyShape({ business_hour: day }, weekShape), false, 'not an array');
  assert.equal(matchesBodyShape(week(day, null), weekShape), false);
  assert.equal(matchesBodyShape(week({ ...day, note: 'x' }), weekShape), false, 'unknown field in an element');
  for (const field of Object.keys(day)) {
    const { [field]: removed, ...rest } = day;
    assert.equal(removed, day[field]);
    assert.equal(matchesBodyShape(week(rest), weekShape), false, `element without ${field}`);
  }
  for (const weekday of [null, '1', 1.5, true]) assert.equal(matchesBodyShape(week({ ...day, weekday }), weekShape), false, `weekday ${weekday}`);
  for (const opens_at of [730, true, ['07:30']]) assert.equal(matchesBodyShape(week({ ...day, opens_at }), weekShape), false, `opens_at ${opens_at}`);
  for (const is_day_off of [2, -1, true, false, '1', null, 0.5]) assert.equal(matchesBodyShape(week({ ...day, is_day_off }), weekShape), false, `is_day_off ${is_day_off}`);
  assert.equal(matchesBodyShape(week({ ...day, is_day_off: 1 }), weekShape), true);

  const orderShape = {
    category: { type: FIELD_STRING, ownCode: true },
    id: { type: FIELD_ARRAY, items: FIELD_INTEGER, maxItems: 3, distinct: true },
  };
  assert.equal(matchesBodyShape({ category: 'bread', id: [] }, orderShape), true);
  assert.equal(matchesBodyShape({ category: 'bread', id: [3, 1, 2] }, orderShape), true);
  assert.equal(matchesBodyShape({ id: [1] }, orderShape), true);
  assert.equal(matchesBodyShape({ category: 'bread' }, orderShape), false, 'id is missing');
  assert.equal(matchesBodyShape({ category: 'bread', id: 1 }, orderShape), false);
  assert.equal(matchesBodyShape({ category: 'bread', id: [1, 2, 3, 4] }, orderShape), false, 'more than maxItems');
  assert.equal(matchesBodyShape({ category: 'bread', id: [1, 1] }, orderShape), false, 'the same number twice');
  for (const item of ['1', 1.5, null, [1], true]) assert.equal(matchesBodyShape({ category: 'bread', id: [item] }, orderShape), false, `item ${JSON.stringify(item)}`);
});

test('표에 없는 API 경로는 404 오류 모양이다', async (t) => {
  const site = await startTemporaryServer(t, { notFoundPage: true });
  for (const target of ['/api/no-such-address', '/api/', '/api/admin', '/api/public/overview/', '/api/public/overview/extra', '/api/admin/hours/']) {
    for (const method of ['GET', 'POST', 'PUT', 'DELETE']) {
      const response = await site.request(method, target);
      assert.equal(response.status, 404, `${method} ${target}`);
      assert.equal(response.headers.get('content-type'), JSON_TYPE);
      assert.deepEqual(response.json, NOT_FOUND_ERROR, `${method} ${target}`);
    }
  }
  // 요청의 글자는 오류 응답에 되돌아오지 않는다.
  for (const injected of [INJECTION_SCRIPT, INJECTION_IMAGE, INJECTION_SQL]) {
    const response = await site.rawRequest('GET', `/api/${injected.replaceAll(' ', '%20')}?q=${injected.replaceAll(' ', '%20')}`);
    assert.equal(response.status, 404);
    assert.deepEqual(JSON.parse(response.text), NOT_FOUND_ERROR);
  }
});

test('표에 없는 화면 경로는 not-found.html이 있으면 404 HTML이고 없으면 404 오류 모양이다', async (t) => {
  const targets = ['/no-such-address', '/admin', '/admin/', '/admin/login/', '/admin/hours/extra', '/api', '/index.html', '/text/', '/text/en.json'];

  const withPage = await startTemporaryServer(t, { notFoundPage: true });
  for (const target of targets) {
    const response = await withPage.request('GET', target);
    assert.equal(response.status, 404, target);
    assert.equal(response.headers.get('content-type'), HTML_TYPE, target);
    assert.ok(response.text.includes(NOT_FOUND_PAGE_MARK), target);
  }
  const reflected = await withPage.rawRequest('GET', `/${INJECTION_SCRIPT}?q=${INJECTION_SCRIPT}`);
  assert.equal(reflected.status, 404);
  assert.ok(reflected.text.includes(NOT_FOUND_PAGE_MARK));
  assert.ok(!reflected.text.includes('alert'));

  const withoutPage = await startTemporaryServer(t);
  for (const target of targets) {
    const response = await withoutPage.request('GET', target);
    assert.equal(response.status, 404, target);
    assert.equal(response.headers.get('content-type'), JSON_TYPE, target);
    assert.deepEqual(response.json, NOT_FOUND_ERROR, target);
  }
});

test('화면 행의 파일이 없으면 세션이 없어도 302가 아니라 404다', async (t) => {
  const [missingAdminScreen, presentAdminScreen] = adminScreens;
  const missingPublicScreen = SCREEN_ROUTES.find((row) => row.id === 'S-01');
  const site = await startTemporaryServer(t, { omitPages: [missingAdminScreen.file, missingPublicScreen.file] });

  for (const row of [missingAdminScreen, missingPublicScreen]) {
    const response = await site.request('GET', row.path);
    assert.equal(response.status, 404, row.path);
    assert.equal(response.headers.get('location'), null, row.path);
    assert.deepEqual(response.json, NOT_FOUND_ERROR, row.path);
  }
  // 없는 화면 행은 없는 주소이므로 다른 메서드에도 405가 아니라 404다.
  assert.equal((await site.request('POST', missingAdminScreen.path)).status, 404);

  const present = await site.request('GET', presentAdminScreen.path);
  assert.equal(present.status, 302);
  assert.equal(present.headers.get('location'), '/admin/login');
});

test('요청 기록 줄은 시각, 메서드, 경로, 상태 코드, 걸린 시간뿐이고 물음표 뒤가 없다', async (t) => {
  const site = await startTemporaryServer(t);
  const secret = `token-${randomText(16)}`;
  const sent = [
    ['GET', `/?key=${secret}`, '/', 200],
    ['GET', `${STATIC_FILE_ADDRESS}?v=${secret}`, STATIC_FILE_ADDRESS, 200],
    ['GET', `/no-such-address?password=${secret}`, '/no-such-address', 404],
    ['POST', `/api/no-such-address?${secret}`, '/api/no-such-address', 404],
    ['GET', `/admin/hours?next=${secret}`, '/admin/hours', 302],
    ['DELETE', '/', '/', 405],
  ];
  for (const [method, target, , status] of sent) {
    const response = await site.request(method, target, { headers: { Cookie: `probe=${secret}`, 'X-Probe': secret } });
    assert.equal(response.status, status, `${method} ${target}`);
  }

  await waitUntil(() => site.logLines.length >= sent.length);
  assert.equal(site.logLines.length, sent.length, 'one line per request');
  const linePattern = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z) ([A-Z]+) (\S+) (\d{3}) (\d+)ms$/;
  site.logLines.forEach((line, index) => {
    const [method, , loggedPath, status] = sent[index];
    const match = linePattern.exec(line);
    assert.notEqual(match, null, line);
    assert.deepEqual(match.slice(1, 5), [site.clock.iso(), method, loggedPath, String(status)], line);
    assert.ok(!line.includes('?'), line);
    assert.ok(!line.includes(secret), line);
  });
  assert.deepEqual(site.errorLines, []);
});

test('src의 SQL 문자열에 값 끼워 넣기와 SQLite 시계 호출이 없다', () => {
  const fileNames = readdirSync(sourceFolder).filter((name) => name.endsWith('.js'));
  assert.ok(fileNames.includes('database.js') && fileNames.includes('server.js'), 'the scan reads the server source folder');

  const stringLiteral = /'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|`(?:[^`\\]|\\[\s\S])*`/g;
  const sqlStart = /^\s*(?:SELECT|INSERT|UPDATE|DELETE|REPLACE|WITH|PRAGMA|BEGIN|COMMIT|ROLLBACK|CREATE|DROP|ALTER)\b/;
  const sqliteClock = /'now'|CURRENT_TIMESTAMP|CURRENT_DATE|CURRENT_TIME|strftime|datetime\s*\(|julianday|unixepoch/i;
  const statementCall = /\.(?:prepare|exec)\(\s*([\s\S])/g;
  // DB를 여는 파일만 변수를 넘긴다: 스키마 파일의 내용과, 손잡이가 그대로 건네는 문장.
  const passesVariables = new Set(['database.js']);

  let sqlCount = 0;
  let callCount = 0;
  for (const fileName of fileNames) {
    const lines = readFileSync(path.join(sourceFolder, fileName), 'utf8').split('\n');
    const code = lines.filter((line) => !/^\s*(?:\/\/|\/\*|\*)/.test(line)).join('\n');
    assert.ok(!/CURRENT_TIMESTAMP|'now'/.test(code), `${fileName}: SQLite clock`);

    for (const match of code.matchAll(stringLiteral)) {
      const literal = match[0];
      const text = literal.slice(1, -1);
      if (!sqlStart.test(text)) continue;
      sqlCount += 1;
      assert.ok(!text.includes('${'), `${fileName}: a value is spliced into ${literal}`);
      assert.ok(!sqliteClock.test(text), `${fileName}: SQLite clock in ${literal}`);
      const before = code.slice(0, match.index).trimEnd().at(-1);
      const after = code.slice(match.index + literal.length).trimStart().at(0);
      assert.ok(before !== '+' && after !== '+', `${fileName}: ${literal} is joined to something`);
    }

    for (const match of code.matchAll(statementCall)) {
      callCount += 1;
      const first = match[1];
      const isPlainLiteral = first === "'" || first === '"';
      assert.ok(isPlainLiteral || (passesVariables.has(fileName) && /[A-Za-z_]/.test(first)), `${fileName}: a statement is not a plain string literal`);
    }
  }
  assert.ok(sqlCount >= 5, `SQL strings found: ${sqlCount}`);
  assert.ok(callCount >= 5, `statement calls found: ${callCount}`);
});

test('S-02 응답에 X-Robots-Tag noindex가 있고 S-01 응답에는 없다', async (t) => {
  const site = await startTemporaryServer(t);
  const login = await site.request('GET', screenPath('S-02'));
  assert.equal(login.status, 200);
  assert.equal(login.headers.get('content-type'), HTML_TYPE);
  assert.ok(login.text.includes(screenMark('S-02')));
  assertNeverStoredNeverIndexed(login, 'S-02');

  const home = await site.request('GET', screenPath('S-01'));
  assert.equal(home.status, 200);
  assert.equal(home.headers.get('content-type'), HTML_TYPE);
  assert.ok(home.text.includes(screenMark('S-01')));
  assert.equal(home.headers.get('x-robots-tag'), null);
  assert.equal(home.headers.get('cache-control'), 'no-cache');
  assert.equal(home.setCookie.length, 0);
});

test('가게 이름의 꺾쇠가 제목에서 풀려 나오지 않는다', async (t) => {
  const shopName = `${INJECTION_SCRIPT}&"'</title>`;
  const site = await startTemporaryServer(t, { shopName });
  const escaped = '&lt;script&gt;alert(1)&lt;/script&gt;&amp;&quot;&#39;&lt;/title&gt;';
  for (const target of [screenPath('S-01'), screenPath('S-02')]) {
    const response = await site.request('GET', target);
    assert.equal(response.status, 200, target);
    assert.ok(!response.text.includes('<script'), target);
    assert.ok(!response.text.includes(shopName), target);
    assert.equal(response.text.split('</title>').length, 2, `${target}: one title end`);
    assert.ok(response.text.includes(`<title>${escaped} hours and menu</title>`), target);
    assert.ok(response.text.includes(`<meta name="description" content="${escaped} hours and menu">`), target);
  }
});

test('HTML 머리말의 문구 자리에 사전 글자가 들어간다', async (t) => {
  const shopName = `bakery ${randomText(6)} $& $1`;
  const site = await startTemporaryServer(t, { shopName, notFoundPage: true });
  const expectedText = TEST_DICTIONARY['title.home'].replace('{shop}', () => shopName).replaceAll('&', '&amp;');
  for (const target of [screenPath('S-01'), screenPath('S-02'), '/no-such-address']) {
    const response = await site.request('GET', target);
    assert.ok(response.text.includes(`<title>${expectedText}</title>`), target);
    assert.ok(response.text.includes(`<meta name="description" content="${expectedText}">`), target);
    // 머리말 밖의 자리는 바꾸지 않는다. 본문의 글자는 화면 스크립트가 넣는다.
    assert.ok(response.text.includes('<p>{{text:title.home}}</p>'), target);
    assert.equal(response.text.split('{{text:').length, 2, target);
  }
});

test('필수 값 없이 띄운 src/server.js는 종료 코드 1로 끝난다', () => {
  const cleared = new Set([...ENVIRONMENT_NAMES, 'NODE_TEST_CONTEXT', 'NODE_OPTIONS']);
  const inherited = Object.fromEntries(Object.entries(process.env).filter(([name]) => !cleared.has(name.toUpperCase())));
  const tooShort = randomText(5);
  const child = spawnSync(process.execPath, ['src/server.js'], {
    cwd: siteRoot,
    env: { ...inherited, ADMIN_PASSWORD: tooShort, PORT: '0' },
    encoding: 'utf8',
    timeout: 20000,
  });
  assert.equal(child.status, 1);
  assert.equal(child.stdout, '');
  const lines = child.stderr.trim().split('\n');
  assert.deepEqual(lines.slice(1).sort(), ['ADMIN_PASSWORD too_short', 'PORT invalid_format', 'SESSION_SECRET missing', 'SHOP_NAME missing']);
  assert.ok(!child.stderr.includes(tooShort));
});

test('세션 없이 관리자 화면 경로는 /admin/login으로 302다', async (t) => {
  const site = await startTemporaryServer(t);
  assert.equal(adminScreens.length, 2);
  const cookies = [undefined, 'bakery_admin=', 'bakery_admin=forged.value', `bakery_admin=${randomText(43)}.${randomText(43)}`, 'other=1'];
  for (const row of adminScreens) {
    for (const cookie of cookies) {
      const response = await site.request('GET', row.path, { headers: cookie === undefined ? {} : { Cookie: cookie } });
      assert.equal(response.status, 302, `${row.path} ${cookie}`);
      assert.equal(response.headers.get('location'), '/admin/login');
      assert.equal(response.text, '');
      assert.ok(!response.text.includes(screenMark(row.id)));
      assertNeverStoredNeverIndexed(response, row.path);
      assertSecurityHeaders(response, row.path);
    }
  }
});

test('API 응답에 보안 헤더와 X-Robots-Tag noindex, Cache-Control no-store가 있다', async (t) => {
  const site = await startTemporaryServer(t);
  const publicReads = API_ROUTES.filter((row) => row.permission === 'none' && row.method === 'GET');
  assert.ok(publicReads.length >= 1, 'the route table has a public read API');
  for (const row of publicReads) {
    const response = await site.request('GET', row.path);
    assert.equal(response.status, 200, row.path);
    assert.equal(response.headers.get('content-type'), JSON_TYPE, row.path);
    assertSecurityHeaders(response, row.path);
    assertNeverStoredNeverIndexed(response, row.path);

    const refused = await site.request('POST', row.path);
    assert.equal(refused.status, 405, row.path);
    assert.equal(refused.headers.get('content-type'), JSON_TYPE, row.path);
    assertSecurityHeaders(refused, `POST ${row.path}`);
    assertNeverStoredNeverIndexed(refused, `POST ${row.path}`);
  }
});

test('서버 오류 응답에 스택과 파일 경로가 없다', async (t) => {
  const site = await startTemporaryServer(t);
  assert.equal((await site.request('GET', '/api/public/overview')).status, 200);

  // API로는 만들 수 없는 상태: 다른 연결로 표 이름을 바꿔 읽기가 실패하게 한다.
  site.writeRows('ALTER TABLE menu_item RENAME TO menu_item_moved');
  const response = await site.request('GET', '/api/public/overview');
  assert.equal(response.status, 500);
  assert.equal(response.headers.get('content-type'), JSON_TYPE);
  assert.deepEqual(response.json, { error: { code: 'read_failed', text_key: 'error.load' } });
  assertSecurityHeaders(response, 'server error');
  assertNeverStoredNeverIndexed(response, 'server error');
  for (const leaked of ['menu_item', 'no such table', 'SELECT', 'sqlite', 'Error', '    at ', '.js', 'src', 'node:', siteRoot, path.basename(siteRoot)]) {
    assert.ok(!response.text.includes(leaked), leaked);
  }

  // 자세한 내용은 writeError로만 나간다.
  assert.equal(site.errorLines.length, 1);
  assert.ok(site.errorLines[0].includes('no such table'));
  assert.ok(site.errorLines[0].includes('GET /api/public/overview'));
  await waitUntil(() => site.logLines.length >= 2);
  assert.ok(site.logLines.at(-1).includes(' GET /api/public/overview 500 '));
  assert.ok(!site.logLines.some((line) => line.includes('no such table')));
});

function loginBodyOfBytes(byteLength) {
  const frame = '{"password":""}';
  const text = `{"password":"${'p'.repeat(byteLength - frame.length)}"}`;
  assert.equal(Buffer.byteLength(text), byteLength);
  return text;
}

const loginAttempts = (site) => site.readRows('SELECT * FROM login_attempt ORDER BY id');
const jsonHeaders = Object.freeze({ 'Content-Type': 'application/json' });

test('A-02에 보낸 16384바이트 본문은 크기 검사를 지나고 16385바이트는 413이다', async (t) => {
  const site = await startTemporaryServer(t);
  // 상한과 같은 크기는 크기 검사를 지나 비밀번호 비교까지 간다(200자를 넘으므로 401이고 실패 한 번).
  const atLimit = await site.request('POST', '/api/admin/login', { headers: jsonHeaders, body: loginBodyOfBytes(16384) });
  assert.equal(atLimit.status, 401);
  assert.deepEqual(atLimit.json, { error: { code: 'login_failed', text_key: 'error.login.failed' } });
  assert.equal(loginAttempts(site).length, 1);

  for (const byteLength of [16385, 100000]) {
    const overLimit = await site.request('POST', '/api/admin/login', { headers: jsonHeaders, body: loginBodyOfBytes(byteLength) });
    assert.equal(overLimit.status, 413, `${byteLength} bytes`);
    assert.deepEqual(overLimit.json, { error: { code: 'body_too_large', text_key: 'error.server' } });
    assertSecurityHeaders(overLimit, 'body too large');
    assertNeverStoredNeverIndexed(overLimit, 'body too large');
  }
  // Content-Length 없이 조각으로 온 본문도 받은 바이트로 센다.
  const chunked = await site.rawRequest('POST', '/api/admin/login', {
    headers: { ...jsonHeaders, 'Transfer-Encoding': 'chunked' },
    body: loginBodyOfBytes(16385),
  });
  assert.equal(chunked.status, 413);
  // 413으로 끝난 요청은 시도로 세지 않는다.
  assert.equal(loginAttempts(site).length, 1);

  // 큰 본문을 거절한 뒤에도 서버는 다음 요청을 받는다.
  assert.equal((await site.logIn()).status, 200);
});

test('A-02에 보낸 깨진 JSON은 400 bad_json이다', async (t) => {
  const site = await startTemporaryServer(t);
  const broken = ['', '{', '{"password":', `{"password":"${site.adminPassword}"`, '[]', `["${site.adminPassword}"]`, '"text"', 'null', `password=${site.adminPassword}`];
  for (const body of broken) {
    const response = await site.request('POST', '/api/admin/login', { headers: jsonHeaders, body });
    assert.equal(response.status, 400, body === '' ? 'empty body' : 'broken body');
    assert.deepEqual(response.json, { error: { code: 'bad_json', text_key: 'error.server' } });
    assert.deepEqual(response.setCookie, []);
    assert.ok(!response.text.includes(site.adminPassword));
  }
  assert.deepEqual(loginAttempts(site), []);
  assert.deepEqual(site.errorLines, []);
});

test('A-02에 보낸 JSON이 아닌 Content-Type은 415다', async (t) => {
  const site = await startTemporaryServer(t);
  const json = JSON.stringify({ password: site.adminPassword });
  const refused = [
    [{ 'Content-Type': 'text/plain' }, json],
    [{ 'Content-Type': 'application/x-www-form-urlencoded' }, `password=${site.adminPassword}`],
    [{ 'Content-Type': 'multipart/form-data; boundary=x' }, json],
    [{}, json],
  ];
  for (const [headers, body] of refused) {
    const response = await site.rawRequest('POST', '/api/admin/login', { headers: { ...headers, 'Content-Length': String(Buffer.byteLength(body)) }, body });
    assert.equal(response.status, 415, JSON.stringify(headers));
    assert.deepEqual(JSON.parse(response.text), { error: { code: 'unsupported_media_type', text_key: 'error.server' } });
    assert.equal(response.headers['set-cookie'], undefined);
  }
  // 맞는 비밀번호가 들어 있어도 로그인되지 않고 시도로 세지도 않는다.
  assert.deepEqual(loginAttempts(site), []);
  assert.deepEqual(site.readRows('SELECT * FROM admin_session'), []);
});

test('로그인 요청의 기록 줄에 본문, 쿠키, 비밀번호가 없다', async (t) => {
  const site = await startTemporaryServer(t);
  const wrong = `wrong-${randomText(18)}`;
  const failed = await site.logIn(wrong);
  assert.equal(failed.status, 401);
  const login = await site.logIn();
  assert.equal(login.status, 200);
  const [token, signature] = login.cookie.slice(login.cookie.indexOf('=') + 1).split('.');
  assert.equal((await site.request('GET', `/api/admin/session?token=${token}`, { headers: { Cookie: login.cookie } })).status, 200);
  assert.equal((await site.request('GET', '/admin/hours', { headers: { Cookie: login.cookie } })).status, 200);
  assert.equal((await site.request('POST', '/api/admin/logout', { headers: { Cookie: login.cookie, 'X-CSRF-Token': login.csrfToken } })).status, 204);

  const expected = [
    'POST /api/admin/login 401',
    'POST /api/admin/login 200',
    'GET /api/admin/session 200',
    'GET /admin/hours 200',
    'POST /api/admin/logout 204',
  ];
  await waitUntil(() => site.logLines.length >= expected.length);
  assert.equal(site.logLines.length, expected.length);
  site.logLines.forEach((line, index) => {
    assert.match(line, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z [A-Z]+ \S+ \d{3} \d+ms$/);
    assert.ok(line.includes(` ${expected[index]} `), line);
  });
  const written = [...site.logLines, ...site.errorLines].join('\n');
  for (const secret of [site.adminPassword, wrong, token, signature, login.csrfToken, site.sessionSecret, 'password', 'bakery_admin', 'csrf']) {
    assert.ok(!written.includes(secret), secret.length > 12 ? 'a secret value' : secret);
  }
});

test('로그인한 뒤의 S-03, S-04 응답에 X-Robots-Tag noindex와 Cache-Control no-store가 있다', async (t) => {
  const site = await startTemporaryServer(t);
  const login = await site.logIn();
  assert.equal(adminScreens.length, 2);
  for (const row of adminScreens) {
    const response = await site.request('GET', row.path, { headers: { Cookie: login.cookie } });
    assert.equal(response.status, 200, row.path);
    assert.equal(response.headers.get('content-type'), HTML_TYPE);
    assert.ok(response.text.includes(screenMark(row.id)), row.path);
    assertSecurityHeaders(response, row.path);
    assertNeverStoredNeverIndexed(response, row.path);
    assert.deepEqual(response.setCookie, []);
  }
});
