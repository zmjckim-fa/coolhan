// A-02 로그인, A-03 로그아웃, A-04 세션 확인의 통합 시험.
// 비밀번호와 세션 비밀값은 지원 파일이 실행할 때마다 무작위로 만든다. 시각은 시험이 정한다.

import assert from 'node:assert/strict';
import { createHash, createHmac } from 'node:crypto';
import { test } from 'node:test';

import {
  HOUR_MS,
  INJECTION_IMAGE,
  INJECTION_SCRIPT,
  INJECTION_SQL,
  MINUTE_MS,
  randomText,
  startTemporaryServer,
} from './temporary-server.js';

const LOGIN = '/api/admin/login';
const LOGOUT = '/api/admin/logout';
const SESSION = '/api/admin/session';
const SECOND_MS = 1000;
const DAY_MS = 24 * HOUR_MS;
const WINDOW_MS = 15 * MINUTE_MS;
const CLIENT_LIMIT = 5;
const ALL_LIMIT = 20;
const SECRET_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const HEX_64 = /^[0-9a-f]{64}$/;

const AUTH_REQUIRED = Object.freeze({ error: { code: 'auth_required', text_key: 'error.session.expired' } });
const CSRF_REJECTED = Object.freeze({ error: { code: 'csrf_rejected', text_key: 'error.form.expired' } });
const LOGIN_FAILED = Object.freeze({ error: { code: 'login_failed', text_key: 'error.login.failed' } });
const LOGIN_THROTTLED = Object.freeze({ error: { code: 'login_throttled', text_key: 'error.login.locked' } });
const PASSWORD_REQUIRED = Object.freeze({ error: { code: 'password_required', text_key: 'error.password.required' } });
const BAD_SHAPE = Object.freeze({ error: { code: 'bad_shape', text_key: 'error.server' } });

const attempts = (site) => site.readRows('SELECT * FROM login_attempt ORDER BY id');
const sessions = (site) => site.readRows('SELECT * FROM admin_session ORDER BY created_at');
const wrongPassword = () => `wrong-${randomText(18)}`;
const withCookie = (cookie) => ({ headers: { Cookie: cookie } });
const readSession = (site, cookie) => site.request('GET', SESSION, cookie === undefined ? {} : withCookie(cookie));

function logOut(site, { cookie, csrfToken, origin }) {
  const headers = {};
  if (cookie !== undefined) headers.Cookie = cookie;
  if (csrfToken !== undefined) headers['X-CSRF-Token'] = csrfToken;
  if (origin !== undefined) headers.Origin = origin;
  return site.request('POST', LOGOUT, { headers });
}

async function failTimes(site, count) {
  for (let index = 0; index < count; index += 1) {
    const response = await site.logIn(wrongPassword());
    assert.equal(response.status, 401, `failure ${index + 1}`);
  }
}

function assertThrottled(response) {
  assert.equal(response.status, 429);
  assert.deepEqual(response.json, LOGIN_THROTTLED);
  assert.deepEqual(response.setCookie, []);
  assert.match(response.headers.get('retry-after'), /^[1-9][0-9]*$/);
  return Number(response.headers.get('retry-after'));
}

test('맞는 비밀번호로 로그인하면 200과 csrf_token이 온다', async (t) => {
  const site = await startTemporaryServer(t);
  const login = await site.logIn();
  assert.equal(login.status, 200);
  assert.deepEqual(Object.keys(login.json), ['csrf_token']);
  assert.match(login.json.csrf_token, SECRET_PATTERN);
  assert.equal(login.headers.get('content-type'), 'application/json; charset=utf-8');
  assert.equal(login.headers.get('cache-control'), 'no-store');
  assert.notEqual(login.cookie, null);

  const session = await readSession(site, login.cookie);
  assert.equal(session.status, 200);
  assert.deepEqual(session.json, { csrf_token: login.json.csrf_token });
  assert.deepEqual(session.setCookie, []);
  assert.deepEqual(sessions(site).map((row) => row.csrf_token), [login.json.csrf_token]);

  // 로그인마다 세션과 토큰이 따로다.
  const second = await site.logIn();
  assert.equal(second.status, 200);
  assert.notEqual(second.cookie, login.cookie);
  assert.notEqual(second.json.csrf_token, login.json.csrf_token);
  assert.equal(sessions(site).length, 2);
});

test('세션 쿠키에 HttpOnly, SameSite=Strict, Path=/, Max-Age=86400이 있다', async (t) => {
  const site = await startTemporaryServer(t);
  const login = await site.logIn();
  assert.equal(login.setCookie.length, 1);
  const [pair, ...attributes] = login.setCookie[0].split('; ');
  const [name, value] = [pair.slice(0, pair.indexOf('=')), pair.slice(pair.indexOf('=') + 1)];
  assert.equal(name, 'bakery_admin');
  const parts = value.split('.');
  assert.equal(parts.length, 2);
  assert.match(parts[0], SECRET_PATTERN);
  assert.match(parts[1], SECRET_PATTERN);
  assert.deepEqual([...attributes].sort(), ['HttpOnly', 'Max-Age=86400', 'Path=/', 'SameSite=Strict']);
  assert.ok(!/secure|domain|expires/i.test(login.setCookie[0]));
});

test('X-Forwarded-Proto가 https인 요청에도 쿠키에 Secure가 없고 응답에 HSTS가 없다', async (t) => {
  const site = await startTemporaryServer(t);
  const forwarded = { 'X-Forwarded-Proto': 'https', 'X-Forwarded-For': '203.0.113.9', Forwarded: 'for=203.0.113.9;proto=https' };
  const login = await site.logIn(site.adminPassword, { headers: forwarded });
  assert.equal(login.status, 200);
  assert.ok(!/secure/i.test(login.setCookie[0]));
  assert.equal(login.headers.get('strict-transport-security'), null);

  const session = await site.request('GET', SESSION, { headers: { Cookie: login.cookie, ...forwarded } });
  assert.equal(session.status, 200);
  assert.equal(session.headers.get('strict-transport-security'), null);

  // X-Forwarded-For를 읽지 않는다: 접속 키는 소켓의 주소로만 만든다.
  await site.logIn();
  const keys = attempts(site).map((row) => row.client_key);
  assert.equal(keys.length, 2);
  assert.equal(keys[0], keys[1]);
});

test('시험이 정한 시각이 attempted_at과 세션의 created_at에 들어가고 expires_at은 24시간 뒤다', async (t) => {
  const failedAt = '2026-03-05T07:08:09.123Z';
  const succeededAt = '2026-03-05T07:10:00.456Z';
  const site = await startTemporaryServer(t, { startAt: failedAt });
  await failTimes(site, 1);
  site.clock.set(succeededAt);
  assert.equal((await site.logIn()).status, 200);

  assert.deepEqual(attempts(site).map(({ attempted_at, succeeded }) => ({ attempted_at, succeeded })), [
    { attempted_at: failedAt, succeeded: 0 },
    { attempted_at: succeededAt, succeeded: 1 },
  ]);
  const [session] = sessions(site);
  assert.equal(sessions(site).length, 1);
  assert.equal(session.created_at, succeededAt);
  assert.equal(session.expires_at, '2026-03-06T07:10:00.456Z');
  assert.equal(new Date(session.expires_at).getTime() - new Date(session.created_at).getTime(), DAY_MS);
});

test('틀린 비밀번호는 401 login_failed다', async (t) => {
  const site = await startTemporaryServer(t);
  const nearMisses = [wrongPassword(), `${site.adminPassword} `, site.adminPassword.slice(0, -1), site.adminPassword.toUpperCase()];
  assert.ok(nearMisses.length < CLIENT_LIMIT);
  for (const password of nearMisses) {
    assert.notEqual(password, site.adminPassword);
    const response = await site.logIn(password);
    assert.equal(response.status, 401);
    assert.deepEqual(response.json, LOGIN_FAILED);
    assert.deepEqual(response.setCookie, []);
    assert.equal(response.headers.get('retry-after'), null);
  }
  assert.deepEqual(sessions(site), []);
  assert.deepEqual(attempts(site).map((row) => row.succeeded), nearMisses.map(() => 0));
});

test('0자 비밀번호는 400이고 201자 비밀번호는 401이다', async (t) => {
  const site = await startTemporaryServer(t);
  for (const body of [{ password: '' }, {}, { password: null }]) {
    const response = await site.request('POST', LOGIN, { json: body });
    assert.equal(response.status, 400, JSON.stringify(body));
    assert.deepEqual(response.json, PASSWORD_REQUIRED);
  }
  for (const body of [{ password: 12345678901234 }, { password: ['x'] }, { password: true }, { password: site.adminPassword, remember: true }]) {
    const response = await site.request('POST', LOGIN, { json: body });
    assert.equal(response.status, 400);
    assert.deepEqual(response.json, BAD_SHAPE);
    assert.deepEqual(response.setCookie, []);
  }
  // 400으로 끝난 요청은 시도로 세지 않는다.
  assert.deepEqual(attempts(site), []);

  for (const length of [201, 200, 1]) {
    const response = await site.logIn('p'.repeat(length));
    assert.equal(response.status, 401, `${length} characters`);
    assert.deepEqual(response.json, LOGIN_FAILED);
  }
  // 201자도 실패 한 번으로 센다.
  assert.deepEqual(attempts(site).map((row) => row.succeeded), [0, 0, 0]);
  assert.deepEqual(sessions(site), []);
});

test('다섯 번 틀리면 여섯 번째는 맞는 비밀번호도 429다', async (t) => {
  const site = await startTemporaryServer(t);
  await failTimes(site, CLIENT_LIMIT - 1);
  // 네 번까지는 막히지 않는다: 다섯 번째도 비밀번호를 비교해 401이다.
  await failTimes(site, 1);

  assertThrottled(await site.logIn());
  assertThrottled(await site.logIn(wrongPassword()));
  assert.equal(attempts(site).length, CLIENT_LIMIT);
  assert.deepEqual(sessions(site), []);
});

test('서로 다른 접속 키의 실패가 모두 20번이면 맞는 비밀번호도 429다', async (t) => {
  const site = await startTemporaryServer(t);
  const insertFailure = () => site.writeRows(
    'INSERT INTO login_attempt (client_key, attempted_at, succeeded) VALUES (?, ?, 0)',
    randomText(64), site.clock.iso(),
  );
  for (let index = 0; index < ALL_LIMIT - 1; index += 1) insertFailure();
  assert.equal(new Set(attempts(site).map((row) => row.client_key)).size, ALL_LIMIT - 1);

  // 19번까지는 이 접속의 로그인이 된다.
  const allowed = await site.logIn();
  assert.equal(allowed.status, 200);

  insertFailure();
  const refused = await site.logIn();
  assert.equal(assertThrottled(refused), WINDOW_MS / SECOND_MS + 1);
  assert.equal(attempts(site).filter((row) => row.succeeded === 0).length, ALL_LIMIT);

  // 성공한 시도는 세지 않는다: 창 안의 성공 행이 아무리 많아도 제한에 닿지 않는다.
  const other = await startTemporaryServer(t);
  for (let index = 0; index < ALL_LIMIT + 5; index += 1) {
    other.writeRows('INSERT INTO login_attempt (client_key, attempted_at, succeeded) VALUES (?, ?, 1)', randomText(64), other.clock.iso());
  }
  assert.equal((await other.logIn()).status, 200);
});

test('429로 거절된 요청은 login_attempt에 행을 넣지 않는다', async (t) => {
  const site = await startTemporaryServer(t);
  await failTimes(site, CLIENT_LIMIT);
  const rowsBefore = attempts(site);
  assert.equal(rowsBefore.length, CLIENT_LIMIT);

  const first = assertThrottled(await site.logIn());
  for (const password of [site.adminPassword, wrongPassword(), 'p'.repeat(201)]) {
    assert.equal(assertThrottled(await site.logIn(password)), first, 'a refused request does not extend the wait');
  }
  assert.deepEqual(attempts(site), rowsBefore);

  site.clock.advance(MINUTE_MS);
  assert.equal(assertThrottled(await site.logIn()), first - 60);
  assert.deepEqual(attempts(site), rowsBefore);
  assert.deepEqual(sessions(site), []);
});

test('성공한 로그인은 앞선 실패를 지우지 않는다', async (t) => {
  const site = await startTemporaryServer(t);
  await failTimes(site, CLIENT_LIMIT - 1);
  const login = await site.logIn();
  assert.equal(login.status, 200);
  await failTimes(site, 1);

  assertThrottled(await site.logIn());
  assert.deepEqual(attempts(site).map((row) => row.succeeded), [0, 0, 0, 0, 1, 0]);
  // 막힌 것은 새 로그인뿐이다. 이미 연 세션은 그대로다.
  assert.equal((await readSession(site, login.cookie)).status, 200);
});

test('429 응답에 Retry-After가 있고 15분이 지나면 다시 로그인된다', async (t) => {
  const site = await startTemporaryServer(t);
  const firstFailureAt = site.clock.now().getTime();
  for (let index = 0; index < CLIENT_LIMIT; index += 1) {
    await failTimes(site, 1);
    site.clock.advance(MINUTE_MS);
  }

  // 지금은 첫 실패 뒤 5분. 첫 실패가 창을 벗어나려면 10분이 남았다.
  assert.equal(assertThrottled(await site.logIn()), (10 * MINUTE_MS) / SECOND_MS + 1);

  // 첫 실패로부터 정확히 15분: 그 실패는 아직 창 안이다.
  site.clock.set(firstFailureAt + WINDOW_MS);
  assert.equal(assertThrottled(await site.logIn()), 1);

  // Retry-After가 말한 1초 뒤에는 로그인된다.
  site.clock.advance(SECOND_MS);
  const login = await site.logIn();
  assert.equal(login.status, 200);
  assert.equal(login.headers.get('retry-after'), null);
  assert.equal((await readSession(site, login.cookie)).status, 200);
});

test('비밀번호 칸의 SQL 문자열은 401이고 표가 그대로다', async (t) => {
  const site = await startTemporaryServer(t);
  const tablesBefore = site.readRows("SELECT name, sql FROM sqlite_master WHERE type IN ('table', 'index', 'trigger') ORDER BY name");
  const injections = [INJECTION_SQL, "' OR '1'='1", INJECTION_SCRIPT, INJECTION_IMAGE];
  assert.ok(injections.length < CLIENT_LIMIT);
  for (const password of injections) {
    const response = await site.logIn(password);
    assert.equal(response.status, 401, password);
    assert.deepEqual(response.json, LOGIN_FAILED);
    assert.deepEqual(response.setCookie, []);
    assert.ok(!response.text.includes('alert'), password);
  }

  assert.deepEqual(site.readRows("SELECT name, sql FROM sqlite_master WHERE type IN ('table', 'index', 'trigger') ORDER BY name"), tablesBefore);
  assert.equal(attempts(site).length, injections.length);
  assert.deepEqual(sessions(site), []);
  assert.equal(site.readRows('SELECT count(*) AS total FROM business_hour')[0].total, 7);
  assert.equal(site.readRows('SELECT count(*) AS total FROM menu_item')[0].total, 0);
  assert.deepEqual(site.errorLines, []);
});

test('admin_session에 토큰 원문이 없다', async (t) => {
  const site = await startTemporaryServer(t);
  const login = await site.logIn();
  const [token, signature] = login.cookie.slice('bakery_admin='.length).split('.');

  const rows = sessions(site);
  assert.equal(rows.length, 1);
  assert.deepEqual(Object.keys(rows[0]).sort(), ['created_at', 'csrf_token', 'expires_at', 'token_hash']);
  assert.match(rows[0].token_hash, HEX_64);
  assert.equal(rows[0].token_hash, createHash('sha256').update(token).digest('hex'));
  const stored = JSON.stringify(site.readRows('SELECT * FROM admin_session'));
  for (const secret of [token, signature, site.adminPassword, site.sessionSecret]) assert.ok(!stored.includes(secret));
});

test('login_attempt에 접속 주소 원문이 없다', async (t) => {
  const site = await startTemporaryServer(t);
  const wrong = wrongPassword();
  await site.logIn(wrong);
  await site.logIn();

  const rows = attempts(site);
  assert.equal(rows.length, 2);
  for (const row of rows) {
    assert.deepEqual(Object.keys(row).sort(), ['attempted_at', 'client_key', 'id', 'succeeded']);
    assert.match(row.client_key, HEX_64);
    assert.equal(row.client_key, createHmac('sha256', site.sessionSecret).update('127.0.0.1').digest('hex'));
    assert.notEqual(row.client_key, createHash('sha256').update('127.0.0.1').digest('hex'));
  }
  const stored = JSON.stringify(rows);
  for (const absent of ['127.0.0.1', 'localhost', '::1', wrong, site.adminPassword, site.sessionSecret]) assert.ok(!stored.includes(absent), absent);
});

test('쿠키 없이 A-04는 401이다', async (t) => {
  const site = await startTemporaryServer(t);
  await site.logIn();
  for (const cookie of [undefined, '', 'other=1', 'bakery_admin=', 'bakery_admin=.', 'bakery_admin_copy=x.y']) {
    const response = await readSession(site, cookie);
    assert.equal(response.status, 401, String(cookie));
    assert.deepEqual(response.json, AUTH_REQUIRED);
    assert.deepEqual(response.setCookie, []);
  }
});

test('서명이 틀린 쿠키는 401이다', async (t) => {
  const site = await startTemporaryServer(t);
  const first = await site.logIn();
  const second = await site.logIn();
  const [token, signature] = first.cookie.slice('bakery_admin='.length).split('.');
  const [otherToken, otherSignature] = second.cookie.slice('bakery_admin='.length).split('.');
  const flip = (text) => `${text.slice(0, -1)}${text.endsWith('A') ? 'B' : 'A'}`;

  const forged = [
    `${token}.${flip(signature)}`,
    `${flip(token)}.${signature}`,
    `${token}.${otherSignature}`,
    `${otherToken}.${signature}`,
    `${token}.`,
    token,
    `${token}.${signature}.${signature}`,
    `${signature}.${token}`,
    `${token}.${createHmac('sha256', site.sessionSecret).update(token).digest('base64url')}`,
    `${token}.${createHmac('sha256', site.adminPassword).update(token).digest('base64url')}`,
    `${token}.${signature}x`,
  ];
  for (const value of forged) {
    const response = await readSession(site, `bakery_admin=${value}`);
    assert.equal(response.status, 401, value === token ? 'token alone' : 'forged');
    assert.deepEqual(response.json, AUTH_REQUIRED);
  }
  // 세션 행은 그대로 있다. 거절한 것은 서명이다.
  assert.equal(sessions(site).length, 2);
  assert.equal((await readSession(site, first.cookie)).status, 200);
  assert.equal((await readSession(site, `other=1; ${second.cookie}; more=2`)).status, 200);
});

test('24시간이 지난 세션은 401이다', async (t) => {
  const site = await startTemporaryServer(t);
  const login = await site.logIn();
  const loggedInAt = site.clock.now().getTime();

  site.clock.set(loggedInAt + 23 * HOUR_MS);
  assert.equal((await readSession(site, login.cookie)).status, 200);
  site.clock.set(loggedInAt + DAY_MS - 1);
  assert.equal((await readSession(site, login.cookie)).status, 200);
  assert.equal((await site.request('GET', '/admin/hours', withCookie(login.cookie))).status, 200);

  // 요청이 와도 세션은 늘어나지 않는다. 로그인한 때로부터 정확히 24시간이면 끝이다.
  site.clock.set(loggedInAt + DAY_MS);
  const expired = await readSession(site, login.cookie);
  assert.equal(expired.status, 401);
  assert.deepEqual(expired.json, AUTH_REQUIRED);
  assert.equal((await site.request('GET', '/admin/hours', withCookie(login.cookie))).status, 302);
  assert.equal((await logOut(site, login)).status, 401);
  assert.equal(sessions(site)[0].expires_at, new Date(loggedInAt + DAY_MS).toISOString());

  // 다음 로그인이 만료된 행을 지운다.
  const next = await site.logIn();
  assert.equal(next.status, 200);
  assert.deepEqual(sessions(site).map((row) => row.csrf_token), [next.csrfToken]);
});

test('비밀번호를 바꿔 다시 띄우면 이전 쿠키는 401이다', async (t) => {
  const site = await startTemporaryServer(t);
  const login = await site.logIn();
  assert.equal((await readSession(site, login.cookie)).status, 200);

  // 같은 값으로 다시 띄우면 세션은 DB에 남아 있고 쿠키도 통한다.
  const sameSecrets = await site.restart();
  assert.equal((await readSession(sameSecrets, login.cookie)).status, 200);

  const newPassword = randomText(24);
  const changedPassword = await sameSecrets.restart({ adminPassword: newPassword });
  const refused = await readSession(changedPassword, login.cookie);
  assert.equal(refused.status, 401);
  assert.deepEqual(refused.json, AUTH_REQUIRED);
  assert.equal((await changedPassword.request('GET', '/admin/menu', withCookie(login.cookie))).status, 302);
  assert.equal(sessions(changedPassword).length, 1, 'the row is still there: the signature is what no longer matches');
  assert.equal((await changedPassword.logIn(site.adminPassword)).status, 401);
  const fresh = await changedPassword.logIn(newPassword);
  assert.equal(fresh.status, 200);
  assert.equal((await readSession(changedPassword, fresh.cookie)).status, 200);

  const changedSecret = await changedPassword.restart({ sessionSecret: randomText(48) });
  assert.equal((await readSession(changedSecret, fresh.cookie)).status, 401);
});

test('쿠키 없이 A-03은 401이다', async (t) => {
  const site = await startTemporaryServer(t);
  const login = await site.logIn();
  for (const attempt of [{}, { csrfToken: login.csrfToken }, { cookie: 'bakery_admin=forged.value', csrfToken: login.csrfToken }]) {
    const response = await logOut(site, attempt);
    assert.equal(response.status, 401);
    assert.deepEqual(response.json, AUTH_REQUIRED);
    assert.deepEqual(response.setCookie, []);
  }
  assert.equal(sessions(site).length, 1);
  assert.equal((await readSession(site, login.cookie)).status, 200);
});

test('CSRF 토큰 없이 A-03은 403이다', async (t) => {
  const site = await startTemporaryServer(t);
  const login = await site.logIn();
  const other = await site.logIn();
  const refusals = [
    { cookie: login.cookie },
    { cookie: login.cookie, csrfToken: '' },
    { cookie: login.cookie, csrfToken: randomText(43) },
    { cookie: login.cookie, csrfToken: other.csrfToken },
    { cookie: login.cookie, csrfToken: `${login.csrfToken}x` },
    { cookie: login.cookie, csrfToken: login.csrfToken, origin: 'http://attacker.example' },
    { cookie: login.cookie, csrfToken: login.csrfToken, origin: `http://localhost:${site.port}` },
    { cookie: login.cookie, csrfToken: login.csrfToken, origin: `http://127.0.0.1:${site.port + 1}` },
    { cookie: login.cookie, csrfToken: login.csrfToken, origin: 'null' },
  ];
  for (const attempt of refusals) {
    const response = await logOut(site, attempt);
    assert.equal(response.status, 403, JSON.stringify({ origin: attempt.origin, hasToken: attempt.csrfToken !== undefined }));
    assert.deepEqual(response.json, CSRF_REJECTED);
    assert.deepEqual(response.setCookie, []);
  }
  // 거절된 로그아웃은 세션을 지우지 않는다.
  assert.equal(sessions(site).length, 2);
  assert.equal((await readSession(site, login.cookie)).status, 200);

  // 토큰이 맞고 Origin이 같은 출처면 통과한다.
  assert.equal((await logOut(site, { ...login, origin: site.origin })).status, 204);
});

test('로그아웃 뒤 같은 쿠키로 A-04는 401이다', async (t) => {
  const site = await startTemporaryServer(t);
  const login = await site.logIn();
  const other = await site.logIn();
  assert.equal((await site.request('GET', '/admin/hours', withCookie(login.cookie))).status, 200);

  const response = await logOut(site, login);
  assert.equal(response.status, 204);
  assert.equal(response.text, '');
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.deepEqual(response.setCookie, ['bakery_admin=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0']);

  const after = await readSession(site, login.cookie);
  assert.equal(after.status, 401);
  assert.deepEqual(after.json, AUTH_REQUIRED);
  assert.equal((await site.request('GET', '/admin/hours', withCookie(login.cookie))).status, 302);
  // 지운 것은 자기 세션 행 하나다.
  assert.deepEqual(sessions(site).map((row) => row.csrf_token), [other.csrfToken]);
  assert.equal((await readSession(site, other.cookie)).status, 200);
});

test('로그아웃을 두 번 하면 두 번째는 401이다', async (t) => {
  const site = await startTemporaryServer(t);
  const login = await site.logIn();
  assert.equal((await logOut(site, login)).status, 204);

  const second = await logOut(site, login);
  assert.equal(second.status, 401);
  assert.deepEqual(second.json, AUTH_REQUIRED);
  assert.deepEqual(second.setCookie, []);
  assert.deepEqual(sessions(site), []);
});
