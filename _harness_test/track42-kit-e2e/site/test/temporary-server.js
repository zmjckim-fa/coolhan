// 시험 지원 파일. 임시 폴더에 DB 파일과 웹 폴더를 만들고 실제 서버를 포트 0에 띄운다.
// 환경 값은 실행할 때마다 무작위로 만든다. process.env와 .env를 읽지 않는다.
// 시각은 시험이 정한다(clock). 끝나면 서버를 닫고 임시 폴더를 지운다.

import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

import { SCREEN_ROUTES } from '../src/route-table.js';
import { startServer } from '../src/server.js';

export const MINUTE_MS = 60 * 1000;
export const HOUR_MS = 60 * MINUTE_MS;

/** 화요일 12:00 (Asia/Seoul). 시험이 시각을 주지 않으면 서버의 시계는 여기서 멈춰 있다. */
export const DEFAULT_START = '2026-11-17T03:00:00.000Z';
export const DEFAULT_TIME_ZONE = 'Asia/Seoul';

/** 임시 웹 폴더의 사전. 실제 web/text/ko.json이 아니라 시험이 아는 글자다. */
export const TEST_DICTIONARY = Object.freeze({
  'title.home': '{shop} hours and menu',
  'error.page.missing': 'no such address',
});

export const STATIC_FILE_ADDRESS = '/tokens.css';
export const STATIC_FILE_BODY = ':root { --sample: 0; }\n';
export const NOT_FOUND_PAGE_MARK = 'data-page="not-found"';

/** 주입 문자열 세 가지(05_소스.md 10-2절). */
export const INJECTION_SQL = "'); DROP TABLE menu_item; --";
export const INJECTION_SCRIPT = '<script>alert(1)</script>';
export const INJECTION_IMAGE = '<img src=x onerror=alert(1)>';

export const randomText = (length) => randomBytes(length).toString('hex').slice(0, length);

const screenMark = (id) => `data-screen="${id}"`;

function pageSource(mark) {
  return [
    '<!doctype html>',
    '<html lang="ko">',
    '<head>',
    '<meta charset="utf-8">',
    '<title>{{text:title.home}}</title>',
    '<meta name="description" content="{{text:title.home}}">',
    '</head>',
    `<body><h1 ${mark}></h1><p>{{text:title.home}}</p></body>`,
    '</html>',
    '',
  ].join('\n');
}

function isInside(parent, child) {
  const relative = path.relative(parent, child);
  return relative !== '' && !relative.startsWith('..') && !path.isAbsolute(relative);
}

function writeWebFolder(webRoot, { omitPages, notFoundPage }) {
  mkdirSync(path.join(webRoot, 'text'), { recursive: true });
  writeFileSync(path.join(webRoot, 'text', 'ko.json'), JSON.stringify(TEST_DICTIONARY));
  writeFileSync(path.join(webRoot, STATIC_FILE_ADDRESS.slice(1)), STATIC_FILE_BODY);
  writeFileSync(path.join(webRoot, 'package.json'), '{ "type": "module" }\n');
  for (const { id, file } of SCREEN_ROUTES) {
    if (!omitPages.includes(file)) writeFileSync(path.join(webRoot, file), pageSource(screenMark(id)));
  }
  if (notFoundPage) writeFileSync(path.join(webRoot, 'not-found.html'), pageSource(NOT_FOUND_PAGE_MARK));
}

function cookiePairOf(setCookieHeaders) {
  return setCookieHeaders.length === 0 ? null : setCookieHeaders[0].split(';')[0];
}

async function launch(shared, { adminPassword, sessionSecret, shopName, shopTimeZone }) {
  const logLines = [];
  const errorLines = [];
  const environment = Object.freeze({ adminPassword, sessionSecret, shopName, shopTimeZone, port: 0, dbFile: shared.dbFile });
  const running = await startServer({
    environment,
    webRoot: shared.webRoot,
    now: shared.clock.now,
    writeLog: (line) => logLines.push(line),
    writeError: (line) => errorLines.push(line),
  });
  shared.running.add(running);
  const origin = `http://127.0.0.1:${running.port}`;

  /** fetch로 보내는 요청. 302를 따라가지 않는다. `json`을 주면 JSON 본문과 Content-Type을 붙인다. */
  async function request(method, target, { headers = {}, json, body } = {}) {
    const sent = { ...headers };
    let payload = body;
    if (json !== undefined) {
      sent['Content-Type'] ??= 'application/json';
      payload = JSON.stringify(json);
    }
    const response = await fetch(`${origin}${target}`, { method, headers: sent, body: payload, redirect: 'manual' });
    const text = await response.text();
    const isJson = (response.headers.get('content-type') ?? '').startsWith('application/json');
    return {
      status: response.status,
      headers: response.headers,
      setCookie: response.headers.getSetCookie(),
      text,
      json: isJson && text !== '' ? JSON.parse(text) : undefined,
    };
  }

  /** node:http로 보내는 요청. 경로를 글자 그대로 보낸다(fetch는 `..`을 보내기 전에 지운다). */
  function rawRequest(method, rawPath, { headers = {}, body } = {}) {
    return new Promise((resolve, reject) => {
      const outgoing = http.request({ host: '127.0.0.1', port: running.port, method, path: rawPath, headers }, (incoming) => {
        const chunks = [];
        incoming.on('data', (chunk) => chunks.push(chunk));
        incoming.on('end', () => resolve({ status: incoming.statusCode, headers: incoming.headers, text: Buffer.concat(chunks).toString('utf8') }));
        incoming.on('error', reject);
      });
      outgoing.on('error', reject);
      outgoing.end(body);
    });
  }

  /** A-02를 부른다. 성공하면 쿠키 쌍과 CSRF 토큰이 들어 있다. */
  async function logIn(password = adminPassword, { headers = {} } = {}) {
    const response = await request('POST', '/api/admin/login', { headers, json: { password } });
    return { ...response, cookie: cookiePairOf(response.setCookie), csrfToken: response.json?.csrf_token ?? null };
  }

  /** 로그인한 관리자. `send`는 쿠키와 X-CSRF-Token을 붙이고 `read`는 쿠키만 붙인다. */
  async function logInAsAdmin() {
    const login = await logIn();
    assert.equal(login.status, 200, 'the temporary server did not accept its own admin password');
    const { cookie, csrfToken } = login;
    return {
      cookie,
      csrfToken,
      read: (target) => request('GET', target, { headers: { Cookie: cookie } }),
      send: (method, target, json) => request(method, target, { headers: { Cookie: cookie, 'X-CSRF-Token': csrfToken }, json }),
    };
  }

  async function stop() {
    shared.running.delete(running);
    await running.close();
  }

  return {
    origin,
    port: running.port,
    folder: shared.folder,
    webRoot: shared.webRoot,
    dbFile: shared.dbFile,
    outsideMark: shared.outsideMark,
    adminPassword,
    sessionSecret,
    shopName,
    shopTimeZone,
    clock: shared.clock,
    logLines,
    errorLines,
    request,
    rawRequest,
    logIn,
    logInAsAdmin,
    readRows: shared.readRows,
    writeRows: shared.writeRows,
    stop,
    /** 같은 DB 파일과 웹 폴더로 다시 띄운다. 먼저 이 서버를 닫는다. 준 값만 바뀐다. */
    async restart(changes = {}) {
      await stop();
      return launch(shared, { adminPassword, sessionSecret, shopName, shopTimeZone, ...changes });
    },
  };
}

/**
 * 임시 서버를 띄운다. 시험이 끝나면 닫고 임시 폴더를 지운다.
 * @param {import('node:test').TestContext} t
 * @param {{ startAt?: string | Date, shopName?: string, shopTimeZone?: string,
 *   omitPages?: string[], notFoundPage?: boolean }} [options]
 */
export async function startTemporaryServer(t, options = {}) {
  const {
    startAt = DEFAULT_START,
    shopName = `shop ${randomText(8)}`,
    shopTimeZone = DEFAULT_TIME_ZONE,
    omitPages = [],
    notFoundPage = false,
  } = options;

  const temporaryRoot = realpathSync(os.tmpdir());
  const folder = mkdtempSync(path.join(temporaryRoot, 'bakery-server-'));
  const webRoot = path.join(folder, 'web');
  const dbFile = path.join(folder, 'data', 'bakery.sqlite');
  assert.ok(isInside(temporaryRoot, dbFile), 'the database file must be inside the temporary folder');

  // 웹 폴더 밖에 있는 파일. 경로 벗어나기 시험이 이 글자가 응답에 없는지 본다.
  const outsideMark = `outside-${randomText(24)}`;
  writeFileSync(path.join(folder, '.env'), `MARK=${outsideMark}\n`);
  writeFileSync(path.join(folder, 'outside.json'), JSON.stringify({ mark: outsideMark }));
  writeWebFolder(webRoot, { omitPages, notFoundPage });

  let current = new Date(startAt).getTime();
  const clock = {
    now: () => new Date(current),
    iso: () => new Date(current).toISOString(),
    set: (instant) => {
      current = new Date(instant).getTime();
    },
    advance: (milliseconds) => {
      current += milliseconds;
    },
  };

  /** 임시 DB 파일을 따로 열어 `?` 묶기로 실행한다. 서버의 연결과는 다른 연결이다. */
  function withConnection(work) {
    const connection = new DatabaseSync(dbFile);
    try {
      return work(connection);
    } finally {
      connection.close();
    }
  }
  const readRows = (sql, ...values) => withConnection((connection) => connection.prepare(sql).all(...values).map((row) => ({ ...row })));
  const writeRows = (sql, ...values) => withConnection((connection) => {
    const { changes, lastInsertRowid } = connection.prepare(sql).run(...values);
    return { changes: Number(changes), lastInsertRowid: Number(lastInsertRowid) };
  });

  const shared = { folder, webRoot, dbFile, outsideMark, clock, readRows, writeRows, running: new Set() };
  t.after(async () => {
    for (const running of shared.running) await running.close();
    rmSync(folder, { recursive: true, maxRetries: 3 });
  });

  return launch(shared, { adminPassword: randomText(24), sessionSecret: randomText(48), shopName, shopTimeZone });
}
