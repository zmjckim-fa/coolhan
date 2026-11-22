// 실제 web/ 폴더로 띄운 서버에서 화면 네 경로, 없는 주소의 응답, 라우트 표의 행 수를 확인한다.
// 네 화면이 모두 있어야 볼 수 있는 정적 검사(쓰이지 않는 키, 입력칸의 속성)도 여기 있다.
// 읽을 파일이 하나도 없으면 실패한다. 아무것도 훑지 않고 통과하지 않는다.

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { API_ROUTES, SCREEN_ROUTES } from '../src/route-table.js';
import { startServer } from '../src/server.js';
import { TIME_STEP_MINUTES } from '../web/input-rules.js';
import { randomText } from './temporary-server.js';
import { readScreen, withoutComments } from './screen-contract.js';

const root = path.join(import.meta.dirname, '..');
const webRoot = path.join(root, 'web');
const readText = (relativePath) => readFileSync(path.join(root, relativePath), 'utf8');

const SHOP_NAME = `shop ${randomText(8)}`;
const NOT_FOUND_FILE = 'not-found.html';
const DICTIONARY_FILE = 'web/text/ko.json';
const dictionary = JSON.parse(readText(DICTIONARY_FILE));
const SHARED_STYLES = ['/tokens.css', '/screen.css'];

const QUOTED = /(['"`])((?:\\.|(?!\1)[^\\\n])*)\1/g;
const KEY_SHAPE = /^[a-z]+(?:\.[a-z]+)+$/;
const CONTROLS = new Set(['input', 'select', 'textarea']);

/** 폴더 아래의 확장자가 맞는 파일(뿌리 기준 경로). 하나도 없으면 실패한다. */
function filesOf(folder, extensions) {
  const found = readdirSync(path.join(root, folder), { recursive: true })
    .map((entry) => `${folder}/${entry.split(path.sep).join('/')}`)
    .filter((file) => extensions.includes(path.extname(file)));
  assert.ok(found.length > 0, `${folder}/ has no ${extensions.join(' ')} file to scan`);
  return found;
}

/** 화면 네 개와 없는 주소의 본문. 모두 실제 web/ 폴더의 HTML이다. */
const PAGE_FILES = [...SCREEN_ROUTES.map((row) => row.file), NOT_FOUND_FILE];

/** 실제 web/ 폴더와 임시 DB 파일로 서버를 띄운다. 끝나면 닫고 임시 폴더를 지운다. */
async function startRealServer(t) {
  const folder = mkdtempSync(path.join(realpathSync(os.tmpdir()), 'bakery-routes-'));
  const adminPassword = randomText(24);
  const running = await startServer({
    environment: Object.freeze({
      adminPassword,
      sessionSecret: randomText(48),
      shopName: SHOP_NAME,
      shopTimeZone: 'Asia/Seoul',
      port: 0,
      dbFile: path.join(folder, 'data', 'bakery.sqlite'),
    }),
    webRoot,
    now: () => new Date('2026-11-17T03:00:00.000Z'),
    writeLog: () => {},
    writeError: () => {},
  });
  t.after(async () => {
    await running.close();
    rmSync(folder, { recursive: true, maxRetries: 3 });
  });
  const origin = `http://127.0.0.1:${running.port}`;
  const get = async (target, headers = {}) => {
    const response = await fetch(`${origin}${target}`, { headers, redirect: 'manual' });
    return { status: response.status, headers: response.headers, text: await response.text() };
  };
  const login = await fetch(`${origin}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: adminPassword }),
  });
  assert.equal(login.status, 200, 'the server did not accept its own admin password');
  const cookie = login.headers.getSetCookie()[0].split(';')[0];
  return { get, cookie };
}

/** 화면 경로의 응답. 관리자 화면은 로그인한 쿠키로 부른다. */
const fetchScreen = (server, row) => server.get(row.path, row.permission === 'admin' ? { Cookie: server.cookie } : {});

/** 화면 HTML이 거는 파일 주소. rel이 stylesheet인 link와 src가 있는 script. */
function linkedAddresses(screen) {
  const styles = screen.tags
    .filter((tag) => tag.name === 'link' && tag.attributes.get('rel') === 'stylesheet')
    .map((tag) => tag.attributes.get('href'));
  const scripts = screen.tags
    .filter((tag) => tag.name === 'script' && tag.attributes.has('src'))
    .map((tag) => tag.attributes.get('src'));
  return { styles, scripts };
}

test('사전에 쓰이지 않는 키가 없다', () => {
  const dictionaryKeys = Object.keys(dictionary);
  assert.ok(dictionaryKeys.length > 0, `${DICTIONARY_FILE} is empty`);

  const used = new Set();
  for (const file of PAGE_FILES) {
    const screen = readScreen(file);
    for (const [, key] of screen.html.matchAll(/\{\{text:([^}]+)\}\}/g)) used.add(key.trim());
    for (const tag of screen.tags) {
      for (const [name, value] of tag.attributes) {
        if (name === 'data-text' || name === 'data-text-aria' || name.startsWith('data-value-')) used.add(value);
      }
    }
  }
  // 서버 코드, 화면 스크립트, 입력 규칙의 글자 가운데 키 모양인 것. 오류 표, 분류, 영업 상태의 키가 여기 있다.
  for (const file of [...filesOf('src', ['.js']), ...filesOf('web', ['.js'])]) {
    for (const [, , literal] of withoutComments(readText(file), file).matchAll(QUOTED)) {
      if (KEY_SHAPE.test(literal)) used.add(literal);
    }
  }
  assert.ok(used.size > 0, 'no used text key was found, so nothing would be checked');

  const unused = dictionaryKeys.filter((key) => !used.has(key));
  assert.deepEqual(unused, [], `dictionary keys that no page, script or server file names: ${unused.join(', ')}`);
});

test('HTML 입력칸의 type, inputmode, step이 2-8절의 표와 같고 maxlength, min, max, pattern, required가 없다', () => {
  const stepSeconds = String(TIME_STEP_MINUTES * 60);
  const field = (name, value) => (tag) => tag.attributes.get(name) === value;
  // 2-8절의 표. 요소가 select이면 type과 inputmode와 step이 없다.
  const expected = [
    { file: 'admin-login.html', pick: field('name', 'password'), element: 'input', type: 'password', inputmode: null, step: null, count: 1 },
    { file: 'admin-hours.html', pick: field('data-hours-field', 'opens_at'), element: 'input', type: 'time', inputmode: null, step: stepSeconds, count: 7 },
    { file: 'admin-hours.html', pick: field('data-hours-field', 'closes_at'), element: 'input', type: 'time', inputmode: null, step: stepSeconds, count: 7 },
    { file: 'admin-hours.html', pick: field('data-hours-field', 'is_day_off'), element: 'input', type: 'checkbox', inputmode: null, step: null, count: 7 },
    { file: 'admin-menu.html', pick: field('data-field', 'name'), element: 'input', type: 'text', inputmode: null, step: null, count: 2 },
    { file: 'admin-menu.html', pick: field('data-field', 'price_krw'), element: 'input', type: 'text', inputmode: 'numeric', step: null, count: 2 },
    { file: 'admin-menu.html', pick: field('data-field', 'category'), element: 'select', type: null, inputmode: null, step: null, count: 2 },
  ];
  const FORBIDDEN = ['maxlength', 'min', 'max', 'pattern', 'required'];

  let listed = 0;
  for (const row of expected) {
    const found = readScreen(row.file).tags.filter((tag) => CONTROLS.has(tag.name) && row.pick(tag));
    assert.equal(found.length, row.count, `web/${row.file}: expected ${row.count} controls, found ${found.length}`);
    for (const tag of found) {
      assert.equal(tag.name, row.element, `web/${row.file}: element`);
      assert.equal(tag.attributes.get('type') ?? null, row.type, `web/${row.file}: type`);
      assert.equal(tag.attributes.get('inputmode') ?? null, row.inputmode, `web/${row.file}: inputmode`);
      assert.equal(tag.attributes.get('step') ?? null, row.step, `web/${row.file}: step`);
    }
    listed += found.length;
  }

  // 표에 없는 입력칸이 없고, 어느 입력칸에도 금지된 속성이 없다.
  let controls = 0;
  for (const { file } of SCREEN_ROUTES) {
    for (const tag of readScreen(file).tags.filter((other) => CONTROLS.has(other.name))) {
      controls += 1;
      for (const name of FORBIDDEN) assert.ok(!tag.attributes.has(name), `web/${file}: <${tag.name}> has the ${name} attribute`);
    }
  }
  assert.equal(controls, listed, 'a screen has an input that the table of 2-8 does not list');
});

test('네 화면 경로가 200과 text/html이다', async (t) => {
  const server = await startRealServer(t);
  assert.equal(SCREEN_ROUTES.length, 4);
  for (const row of SCREEN_ROUTES) {
    const response = await fetchScreen(server, row);
    assert.equal(response.status, 200, row.path);
    assert.match(response.headers.get('content-type') ?? '', /^text\/html\b/, `${row.path} content type`);
    assert.match(response.text, /<h1\b/, `${row.path} has no h1`);
  }
});

test('화면이 가리키는 스크립트와 스타일 파일이 모두 200이다', async (t) => {
  const server = await startRealServer(t);
  const addresses = new Set(['/text/ko.json']);
  for (const file of PAGE_FILES) {
    const screen = readScreen(file);
    const { styles, scripts } = linkedAddresses(screen);
    assert.ok(scripts.length > 0, `web/${file} loads no script`);
    for (const address of [...styles, ...scripts]) addresses.add(address);
    for (const script of screen.scripts.keys()) addresses.add(`/${script}`);
  }
  for (const address of addresses) {
    const response = await server.get(address);
    assert.equal(response.status, 200, address);
    assert.match(response.headers.get('content-type') ?? '', /^(text\/css|text\/javascript|application\/json)\b/, `${address} content type`);
  }
});

test('HTML마다 tokens.css, screen.css와 자기 화면의 배치 파일만 건다', () => {
  const owners = new Map();
  for (const { file } of SCREEN_ROUTES) {
    const own = `/${file.replace(/\.html$/, '.css')}`;
    const { styles } = linkedAddresses(readScreen(file));
    assert.deepEqual(styles, [...SHARED_STYLES, own], `web/${file}: stylesheets`);
    assert.equal(owners.has(own), false, `${own} is linked by ${owners.get(own)} and ${file}`);
    owners.set(own, file);
  }
  assert.deepEqual(linkedAddresses(readScreen(NOT_FOUND_FILE)).styles, SHARED_STYLES, `web/${NOT_FOUND_FILE}: stylesheets`);
});

test('라우트 표의 API 행이 열한 개이고 메서드와 경로가 공통 규칙과 같다', () => {
  const rules = readText('docs/plan/01_공통규칙.md');
  const rows = [...rules.matchAll(/^\| (A-\d{2}) \|[^|]*\| (GET|POST|PUT|DELETE) `([^`]+)` \| (\S+) \|$/gm)].map(
    ([, id, method, address, permission]) => ({ id, method, path: address, permission: permission === 'admin' ? 'admin' : 'none' }),
  );
  assert.equal(rows.length, 11, 'the API table of the common rules must list eleven rows');
  assert.equal(API_ROUTES.length, 11);
  assert.deepEqual(
    API_ROUTES.map(({ id, method, path: address, permission }) => ({ id, method, path: address, permission })),
    rows,
  );
});

test('라우트 표의 화면 행이 네 개다', () => {
  assert.deepEqual(
    SCREEN_ROUTES.map(({ id, path: address, file }) => ({ id, path: address, file })),
    [
      { id: 'S-01', path: '/', file: 'home.html' },
      { id: 'S-02', path: '/admin/login', file: 'admin-login.html' },
      { id: 'S-03', path: '/admin/hours', file: 'admin-hours.html' },
      { id: 'S-04', path: '/admin/menu', file: 'admin-menu.html' },
    ],
  );
  assert.equal(SCREEN_ROUTES.some((row) => row.file === NOT_FOUND_FILE), false, 'the not-found body is not a screen row');
});

test('방문자 화면 응답의 제목에 가게 이름이 들어 있다', async (t) => {
  const server = await startRealServer(t);
  const response = await server.get('/');
  const title = /<title>([^<]*)<\/title>/.exec(response.text);
  assert.notEqual(title, null, 'the visitor page has no title');
  assert.ok(title[1].includes(SHOP_NAME), `the title "${title[1]}" does not contain the shop name`);
  assert.doesNotMatch(response.text, /\{\{text:/, 'a text slot was left in the page');
});

test('없는 화면 주소는 404와 text/html이고 본문에 error.page.missing 키가 있다', async (t) => {
  const server = await startRealServer(t);
  assert.ok(Object.hasOwn(dictionary, 'error.page.missing'), 'the dictionary has no error.page.missing');
  for (const address of ['/no-such-page', '/home.html', '/not-found.html', '/admin/nothing']) {
    const response = await server.get(address);
    assert.equal(response.status, 404, address);
    assert.match(response.headers.get('content-type') ?? '', /^text\/html\b/, `${address} content type`);
    assert.match(response.text, /data-text="error\.page\.missing"/, `${address}: the body does not name error.page.missing`);
    assert.match(response.text, /<title>[^<]+<\/title>/, `${address} has no title`);
    assert.doesNotMatch(response.text, /\{\{text:/, `${address}: a text slot was left`);
    assert.ok(!response.text.includes(address.slice(1)) || address === '/not-found.html', `${address} is written into the body`);
  }
});
