'use strict';
// db/schema.sql과 db/seed.sql을 메모리 DB에 두 번 넣고 제약을 규칙마다 실행해 본다.
// 규칙 한 줄: PASS 또는 FAIL, 번호, 이름, 넣어 본 값. 마지막 줄: 통과 수/전체 수.
// 하나라도 FAIL이면 종료 코드 1. 실행: node db/check-schema.js
// 여기서 넣는 행은 메모리 DB와 임시 폴더의 사본에만 있고 실행이 끝나면 사라진다.

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
const seedSql = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8');
const commonRulesFile = path.join(__dirname, '..', 'docs', 'plan', '01_공통규칙.md');

const ISO_FORMAT = "strftime('%Y-%m-%dT%H:%M:%fZ', ?)";
const CHECK = 'CHECK constraint failed: ';
const NOT_NULL = 'NOT NULL constraint failed: ';
const UNIQUE = 'UNIQUE constraint failed: ';
const WRONG_TYPE = 'cannot store ';

const db = new DatabaseSync(':memory:');
let passed = 0;
let total = 0;

function report(name, tried, problems) {
  total += 1;
  if (problems.length === 0) passed += 1;
  const head = `${problems.length === 0 ? 'PASS' : 'FAIL'} ${String(total).padStart(2, '0')} ${name} | ${tried}`;
  console.log(problems.length === 0 ? head : `${head} | 문제: ${problems.join('; ')}`);
}

/** 한 문장을 실행해 보고 되돌린다. 성공이면 null, 실패면 오류 문장. */
function attempt(sql, params = []) {
  db.exec('SAVEPOINT attempt');
  try {
    db.prepare(sql).run(...params);
    return null;
  } catch (error) {
    return error.message;
  } finally {
    db.exec('ROLLBACK TO attempt; RELEASE attempt');
  }
}

/** 제약 규칙: accepted는 모두 들어가야 하고 rejected는 지정한 이유로 막혀야 한다. */
function constraintRule(name, accepted, rejected) {
  const problems = [];
  for (const [label, sql, params] of accepted) {
    const error = attempt(sql, params);
    if (error) problems.push(`허용해야 하는 ${label}이(가) 막힘: ${error}`);
  }
  for (const [label, sql, params, expected] of rejected) {
    const error = attempt(sql, params);
    if (!error) problems.push(`막아야 하는 ${label}이(가) 들어감`);
    else if (!error.includes(expected)) problems.push(`${label}이(가) 다른 이유로 막힘: ${error}`);
  }
  const labels = (cases) => cases.map((c) => c[0]).join(', ');
  report(name, `허용: ${labels(accepted)} | 거부: ${labels(rejected)}`, problems);
}

/** 제약이 아닌 규칙: fn이 문제를 problems에 넣는다. 변경은 되돌린다. */
function stateRule(name, tried, fn) {
  const problems = [];
  db.exec('SAVEPOINT state_rule');
  try {
    fn(problems);
  } catch (error) {
    problems.push(error.message);
  } finally {
    db.exec('ROLLBACK TO state_rule; RELEASE state_rule');
  }
  report(name, tried, problems);
}

const one = (sql, ...params) => db.prepare(sql).get(...params);
const all = (sql, ...params) => db.prepare(sql).all(...params);
const count = (table) => one(`SELECT count(*) AS n FROM ${table}`).n;

// 넣어 보는 문장을 만드는 함수들
const hour = (opensAt, closesAt, isDayOff = 0) => [
  'UPDATE business_hour SET opens_at = ?, closes_at = ?, is_day_off = ? WHERE weekday = 1',
  [opensAt, closesAt, isDayOff],
];
const hourColumn = (column, value) => [`UPDATE business_hour SET ${column} = ? WHERE weekday = 1`, [value]];
const menu = (changes = {}) => {
  const row = { name: '소금빵', price_krw: 3500, category: 'bread', sale_status: 'on_sale', sort_order: 0, ...changes };
  const columns = Object.keys(row);
  return [
    `INSERT INTO menu_item (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`,
    columns.map((c) => row[c]),
  ];
};
const TOKEN_HASH = 'a3'.repeat(32);
const session = (changes = {}) => {
  const row = {
    token_hash: TOKEN_HASH,
    csrf_token: 'c'.repeat(32),
    created_at: '2026-11-17T04:00:00.000Z',
    expires_at: '2026-11-17T16:00:00.000Z',
    ...changes,
  };
  const columns = Object.keys(row);
  return [
    `INSERT INTO admin_session (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`,
    columns.map((c) => row[c]),
  ];
};
const loginAttempt = (changes = {}) => {
  const row = { client_key: 'k'.repeat(64), attempted_at: '2026-11-17T04:00:00.000Z', succeeded: 0, ...changes };
  const columns = Object.keys(row);
  return [
    `INSERT INTO login_attempt (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`,
    columns.map((c) => row[c]),
  ];
};
const tried = (label, [sql, params], expected) => [label, sql, params, expected];

// 가게 시간대의 요일(0 일요일 ~ 6 토요일)과 HH:MM. 영업 상태 계산의 입력이다.
function shopClock(utcIso, timeZone) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone, weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date(utcIso));
  const part = (type) => parts.find((p) => p.type === type).value;
  return {
    weekday: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(part('weekday')),
    time: `${part('hour')}:${part('minute')}`,
  };
}

// 영업 상태 계산 규칙(02_DB.md 5절의 표를 SQL로 옮긴 것)
const SHOP_STATUS_SQL = `
  SELECT CASE
           WHEN is_day_off = 1 THEN 'dayoff'
           WHEN opens_at IS NULL THEN 'unset'
           WHEN :time >= opens_at AND :time < closes_at THEN 'open'
           ELSE 'closed'
         END AS status
    FROM business_hour
   WHERE weekday = :weekday`;

// ───────── 01 ~ 03: 넣기, 처음 상태 ─────────
{
  const problems = [];
  try {
    db.exec(schemaSql);
    db.exec(seedSql);
    db.exec(schemaSql);
    db.exec(seedSql);
    if (count('business_hour') !== 7) problems.push(`business_hour ${count('business_hour')}행`);
  } catch (error) {
    problems.push(error.message);
  }
  report('스키마와 시드를 두 번 실행', 'schema.sql, seed.sql, schema.sql, seed.sql 순서로 실행 뒤 business_hour 7행', problems);
  if (problems.length > 0) {
    console.log(`${passed}/${total}`);
    process.exit(1);
  }
}

stateRule('처음 상태', 'business_hour 0~6 일곱 행 모두 시각 없음과 휴무 아님, 나머지 세 테이블 0행', (problems) => {
  const rows = all('SELECT weekday, opens_at, closes_at, is_day_off FROM business_hour ORDER BY weekday');
  if (rows.map((r) => r.weekday).join(',') !== '0,1,2,3,4,5,6') problems.push(`요일 ${rows.map((r) => r.weekday).join(',')}`);
  if (rows.some((r) => r.opens_at !== null || r.closes_at !== null || r.is_day_off !== 0)) problems.push('비어 있지 않은 행이 있음');
  for (const table of ['menu_item', 'admin_session', 'login_attempt']) {
    if (count(table) !== 0) problems.push(`${table} ${count(table)}행`);
  }
});

stateRule('시드를 다시 실행해도 고친 영업시간이 남는다', '요일 1을 07:30~19:00으로 고친 뒤 seed.sql 실행', (problems) => {
  db.prepare("UPDATE business_hour SET opens_at = '07:30', closes_at = '19:00' WHERE weekday = 1").run();
  db.exec(seedSql);
  const row = one('SELECT opens_at, closes_at FROM business_hour WHERE weekday = 1');
  if (row.opens_at !== '07:30' || row.closes_at !== '19:00') problems.push(`요일 1이 ${row.opens_at}~${row.closes_at}`);
  if (count('business_hour') !== 7) problems.push(`business_hour ${count('business_hour')}행`);
});

// ───────── 04 ~ 06: 이름, 타입, 외래 키 ─────────
stateRule('테이블과 컬럼 이름이 공통 규칙과 같다', '01_공통규칙.md 7절의 테이블 4개와 컬럼 목록을 실제 스키마와 비교', (problems) => {
  const text = fs.readFileSync(commonRulesFile, 'utf8');
  const fixedTables = [...text.matchAll(/^\|\s*T-\d+\s*\|\s*([a-z_]+)\s*\|/gm)].map((m) => m[1]);
  const actualTables = all("SELECT name FROM sqlite_schema WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name").map((r) => r.name);
  if (fixedTables.length !== 4) problems.push(`공통 규칙에서 읽은 테이블 ${fixedTables.length}개`);
  if ([...fixedTables].sort().join(',') !== actualTables.join(',')) problems.push(`테이블 ${actualTables.join(',')}`);
  for (const table of fixedTables) {
    const line = new RegExp(`^\\|\\s*${table}\\s*\\|\\s*([a-z_, ]+?)\\s*\\|\\s*$`, 'm').exec(text);
    const fixed = line ? line[1].split(',').map((c) => c.trim()).join(',') : '(공통 규칙에 없음)';
    const actual = all(`PRAGMA table_info(${table})`).map((c) => c.name).join(',');
    if (fixed !== actual) problems.push(`${table}: 규칙 ${fixed} / 실제 ${actual}`);
  }
});

stateRule('네 테이블이 모두 STRICT다', 'PRAGMA table_list의 strict 값', (problems) => {
  const rows = all("SELECT name, strict FROM pragma_table_list WHERE schema = 'main' AND type = 'table' AND name NOT LIKE 'sqlite_%'");
  if (rows.length !== 4) problems.push(`테이블 ${rows.length}개`);
  for (const row of rows) if (row.strict !== 1) problems.push(`${row.name} strict=${row.strict}`);
});

stateRule('외래 키가 없다', '네 테이블의 PRAGMA foreign_key_list가 0행', (problems) => {
  for (const table of ['business_hour', 'menu_item', 'admin_session', 'login_attempt']) {
    const n = all(`PRAGMA foreign_key_list(${table})`).length;
    if (n !== 0) problems.push(`${table} 외래 키 ${n}개`);
  }
});

// ───────── 07 ~ 16: T-01 business_hour ─────────
constraintRule('요일은 0~6',
  [
    tried('요일 0 수정', ['UPDATE business_hour SET is_day_off = 1 WHERE weekday = 0', []]),
    tried('요일 6 수정', ['UPDATE business_hour SET is_day_off = 1 WHERE weekday = 6', []]),
  ],
  [
    tried('weekday 7 추가', ['INSERT INTO business_hour (weekday) VALUES (7)', []], `${CHECK}ck_business_hour_weekday`),
    tried('weekday -1 추가', ['INSERT INTO business_hour (weekday) VALUES (-1)', []], `${CHECK}ck_business_hour_weekday`),
    tried('weekday 1.5 추가', ['INSERT INTO business_hour (weekday) VALUES (1.5)', []], WRONG_TYPE),
  ]);

constraintRule('요일은 한 행씩이고 비울 수 없다',
  [tried('요일 3 행 수정', ["UPDATE business_hour SET opens_at = '09:00', closes_at = '18:00' WHERE weekday = 3", []])],
  [
    tried('weekday 3 한 번 더 추가', ['INSERT INTO business_hour (weekday) VALUES (3)', []], `${UNIQUE}business_hour.weekday`),
    tried('weekday NULL 추가', ['INSERT INTO business_hour (weekday) VALUES (NULL)', []], `${NOT_NULL}business_hour.weekday`),
  ]);

constraintRule('일곱 행은 지울 수 없다',
  [tried('요일 1 행 수정', hour('07:30', '19:00'))],
  [
    tried('요일 1 행 삭제', ['DELETE FROM business_hour WHERE weekday = 1', []], 'trg_business_hour_no_delete'),
    tried('전체 삭제', ['DELETE FROM business_hour', []], 'trg_business_hour_no_delete'),
  ]);

constraintRule('시각은 24시간 HH:MM',
  [tried('00:00~23:55', hour('00:00', '23:55')), tried('07:30~19:00', hour('07:30', '19:00'))],
  [
    tried('opens_at 7:30', hour('7:30', '19:00'), `${CHECK}ck_business_hour_opens_at`),
    tried('opens_at 0730', hour('0730', '19:00'), `${CHECK}ck_business_hour_opens_at`),
    tried('opens_at 07:30:00', hour('07:30:00', '19:00'), `${CHECK}ck_business_hour_opens_at`),
    tried('opens_at 오전 7시', hour('오전 7시', '19:00'), `${CHECK}ck_business_hour_opens_at`),
    tried('opens_at 빈 문자열', hour('', '19:00'), `${CHECK}ck_business_hour_opens_at`),
    tried('closes_at 24:00', hour('07:30', '24:00'), `${CHECK}ck_business_hour_closes_at`),
    tried('closes_at 25:00', hour('07:30', '25:00'), `${CHECK}ck_business_hour_closes_at`),
    tried('closes_at 19:60', hour('07:30', '19:60'), `${CHECK}ck_business_hour_closes_at`),
  ]);

constraintRule('시각은 5분 단위',
  [tried('07:35~19:05', hour('07:35', '19:05'))],
  [
    tried('opens_at 07:31', hour('07:31', '19:00'), `${CHECK}ck_business_hour_opens_at`),
    tried('opens_at 07:33', hour('07:33', '19:00'), `${CHECK}ck_business_hour_opens_at`),
    tried('closes_at 19:59', hour('07:30', '19:59'), `${CHECK}ck_business_hour_closes_at`),
  ]);

constraintRule('여는 시각과 닫는 시각은 둘 다 있거나 둘 다 없다',
  [tried('둘 다 있음', hour('07:30', '19:00')), tried('둘 다 없음', hour(null, null))],
  [
    tried('여는 시각만', hour('07:30', null), `${CHECK}ck_business_hour_pair`),
    tried('닫는 시각만', hour(null, '19:00'), `${CHECK}ck_business_hour_pair`),
  ]);

constraintRule('닫는 시각은 여는 시각보다 늦다',
  [tried('07:30~07:35', hour('07:30', '07:35'))],
  [
    tried('19:00~07:30', hour('19:00', '07:30'), `${CHECK}ck_business_hour_order`),
    tried('09:00~09:00', hour('09:00', '09:00'), `${CHECK}ck_business_hour_order`),
    tried('22:00~02:00(자정 넘김)', hour('22:00', '02:00'), `${CHECK}ck_business_hour_order`),
  ]);

constraintRule('휴무 값은 0 또는 1',
  [tried('is_day_off 1', hourColumn('is_day_off', 1)), tried('is_day_off 0', hourColumn('is_day_off', 0))],
  [
    tried('is_day_off 2', hourColumn('is_day_off', 2), `${CHECK}ck_business_hour_is_day_off`),
    tried('is_day_off -1', hourColumn('is_day_off', -1), `${CHECK}ck_business_hour_is_day_off`),
    tried('is_day_off 글자 yes', hourColumn('is_day_off', 'yes'), WRONG_TYPE),
    tried('is_day_off NULL', hourColumn('is_day_off', null), `${NOT_NULL}business_hour.is_day_off`),
  ]);

constraintRule('휴무인 요일은 시각이 없다',
  [tried('휴무이고 시각 없음', hour(null, null, 1)), tried('휴무가 아니고 07:30~19:00', hour('07:30', '19:00', 0))],
  [tried('휴무이고 07:30~19:00', hour('07:30', '19:00', 1), `${CHECK}ck_business_hour_day_off`)]);

constraintRule('business_hour.updated_at은 UTC ISO 8601',
  [tried('2026-11-17T04:00:00.000Z', hourColumn('updated_at', '2026-11-17T04:00:00.000Z'))],
  [
    tried('2026-11-17 04:00:00', hourColumn('updated_at', '2026-11-17 04:00:00'), `${CHECK}ck_business_hour_updated_at`),
    tried('초 아래 자리 없음', hourColumn('updated_at', '2026-11-17T04:00:00Z'), `${CHECK}ck_business_hour_updated_at`),
    tried('+09:00 표기', hourColumn('updated_at', '2026-11-17T13:00:00.000+09:00'), `${CHECK}ck_business_hour_updated_at`),
    tried('없는 날짜 2월 30일', hourColumn('updated_at', '2026-02-30T04:00:00.000Z'), `${CHECK}ck_business_hour_updated_at`),
    tried('NULL', hourColumn('updated_at', null), `${NOT_NULL}business_hour.updated_at`),
  ]);

// ───────── 17 ~ 24: T-02 menu_item ─────────
constraintRule('메뉴 이름은 1~40자',
  [
    tried('1자', menu({ name: '빵' })),
    tried('한글 40자', menu({ name: '가'.repeat(40) })),
  ],
  [
    tried('빈 문자열', menu({ name: '' }), `${CHECK}ck_menu_item_name`),
    tried('한글 41자', menu({ name: '가'.repeat(41) }), `${CHECK}ck_menu_item_name`),
    tried('공백 3자', menu({ name: '   ' }), `${CHECK}ck_menu_item_name`),
    tried('NULL', menu({ name: null }), `${NOT_NULL}menu_item.name`),
  ]);

constraintRule('가격은 0~1,000,000 정수',
  [tried('0', menu({ price_krw: 0 })), tried('3500', menu({ price_krw: 3500 })), tried('1000000', menu({ price_krw: 1000000 }))],
  [
    tried('-1', menu({ price_krw: -1 }), `${CHECK}ck_menu_item_price_krw`),
    tried('1000001', menu({ price_krw: 1000001 }), `${CHECK}ck_menu_item_price_krw`),
    tried('3500.5', menu({ price_krw: 3500.5 }), WRONG_TYPE),
    tried('글자 삼천원', menu({ price_krw: '삼천원' }), WRONG_TYPE),
    tried('NULL', menu({ price_krw: null }), `${NOT_NULL}menu_item.price_krw`),
  ]);

constraintRule('분류는 네 코드',
  ['bread', 'cake', 'cookie', 'drink'].map((code) => tried(code, menu({ category: code }))),
  [
    tried('pie', menu({ category: 'pie' }), `${CHECK}ck_menu_item_category`),
    tried('대문자 Bread', menu({ category: 'Bread' }), `${CHECK}ck_menu_item_category`),
    tried('화면 표시 글자 빵', menu({ category: '빵' }), `${CHECK}ck_menu_item_category`),
    tried('NULL', menu({ category: null }), `${NOT_NULL}menu_item.category`),
  ]);

constraintRule('판매 상태는 두 코드',
  [tried('on_sale', menu({ sale_status: 'on_sale' })), tried('sold_out', menu({ sale_status: 'sold_out' }))],
  [
    tried('hidden', menu({ sale_status: 'hidden' }), `${CHECK}ck_menu_item_sale_status`),
    tried('화면 표시 글자 품절', menu({ sale_status: '품절' }), `${CHECK}ck_menu_item_sale_status`),
    tried('NULL', menu({ sale_status: null }), `${NOT_NULL}menu_item.sale_status`),
  ]);

constraintRule('순서는 0 이상 정수이고 꼭 넣는다',
  [tried('0', menu({ sort_order: 0 })), tried('12', menu({ sort_order: 12 }))],
  [
    tried('-1', menu({ sort_order: -1 }), `${CHECK}ck_menu_item_sort_order`),
    tried('1.5', menu({ sort_order: 1.5 }), WRONG_TYPE),
    tried('값을 넣지 않음', ["INSERT INTO menu_item (name, price_krw, category) VALUES ('소금빵', 3500, 'bread')", []], `${NOT_NULL}menu_item.sort_order`),
  ]);

constraintRule('menu_item 시각 기록은 UTC ISO 8601',
  [tried('created_at과 updated_at 2026-11-17T04:00:00.000Z', menu({ created_at: '2026-11-17T04:00:00.000Z', updated_at: '2026-11-17T04:00:00.000Z' }))],
  [
    tried('created_at 2026-11-17', menu({ created_at: '2026-11-17' }), `${CHECK}ck_menu_item_created_at`),
    tried('updated_at 숫자 1763352000', menu({ updated_at: 1763352000 }), `${CHECK}ck_menu_item_updated_at`),
  ]);

stateRule('menu_item 기본값', 'name, price_krw, category, sort_order만 넣으면 sale_status는 on_sale, 두 시각 기록은 형식에 맞게 채워진다', (problems) => {
  db.prepare("INSERT INTO menu_item (name, price_krw, category, sort_order) VALUES ('소금빵', 3500, 'bread', 0)").run();
  const row = one('SELECT sale_status, created_at, updated_at FROM menu_item');
  if (row.sale_status !== 'on_sale') problems.push(`sale_status ${row.sale_status}`);
  const iso = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
  if (!iso.test(row.created_at) || !iso.test(row.updated_at)) problems.push(`시각 기록 ${row.created_at} / ${row.updated_at}`);
  if (new Date(row.created_at).toISOString() !== row.created_at) problems.push(`JS와 다른 표기 ${row.created_at}`);
});

stateRule('지운 메뉴의 id를 다시 쓰지 않는다', '메뉴 2개 추가, 마지막 것 삭제, 1개 추가 뒤 새 id가 더 큰지', (problems) => {
  const add = db.prepare("INSERT INTO menu_item (name, price_krw, category, sort_order) VALUES ('소금빵', 3500, 'bread', 0)");
  add.run();
  const last = Number(add.run().lastInsertRowid);
  db.prepare('DELETE FROM menu_item WHERE id = ?').run(last);
  const next = Number(add.run().lastInsertRowid);
  if (!(next > last)) problems.push(`지운 id ${last}, 새 id ${next}`);
});

// ───────── 25 ~ 28: T-03 admin_session ─────────
constraintRule('token_hash는 소문자 16진수 64자이고 겹치지 않는다',
  [tried('16진수 64자', session())],
  [
    tried('63자', session({ token_hash: 'a'.repeat(63) }), `${CHECK}ck_admin_session_token_hash`),
    tried('65자', session({ token_hash: 'a'.repeat(65) }), `${CHECK}ck_admin_session_token_hash`),
    tried('대문자 64자', session({ token_hash: 'A3'.repeat(32) }), `${CHECK}ck_admin_session_token_hash`),
    tried('16진수가 아닌 글자 64자', session({ token_hash: 'g'.repeat(64) }), `${CHECK}ck_admin_session_token_hash`),
    tried('NULL', session({ token_hash: null }), `${NOT_NULL}admin_session.token_hash`),
    tried('같은 값 두 번',
      [`INSERT INTO admin_session (token_hash, csrf_token, created_at, expires_at) VALUES ${Array(2).fill("(?, ?, '2026-11-17T04:00:00.000Z', '2026-11-17T16:00:00.000Z')").join(', ')}`,
        [TOKEN_HASH, 'c'.repeat(32), TOKEN_HASH, 'd'.repeat(32)]],
      `${UNIQUE}admin_session.token_hash`),
  ]);

constraintRule('csrf_token은 32~128자',
  [tried('32자', session({ csrf_token: 'c'.repeat(32) })), tried('128자', session({ csrf_token: 'c'.repeat(128) }))],
  [
    tried('31자', session({ csrf_token: 'c'.repeat(31) }), `${CHECK}ck_admin_session_csrf_token`),
    tried('129자', session({ csrf_token: 'c'.repeat(129) }), `${CHECK}ck_admin_session_csrf_token`),
    tried('NULL', session({ csrf_token: null }), `${NOT_NULL}admin_session.csrf_token`),
  ]);

constraintRule('세션 만료 시각은 만든 시각보다 늦다',
  [tried('04:00에 만들고 16:00에 만료', session())],
  [
    tried('만든 시각과 같은 만료 시각', session({ expires_at: '2026-11-17T04:00:00.000Z' }), `${CHECK}ck_admin_session_expiry`),
    tried('만든 시각보다 이른 만료 시각', session({ expires_at: '2026-11-17T03:59:59.999Z' }), `${CHECK}ck_admin_session_expiry`),
    tried('만료 시각 NULL', session({ expires_at: null }), `${NOT_NULL}admin_session.expires_at`),
  ]);

constraintRule('admin_session 시각 기록은 UTC ISO 8601',
  [tried('created_at을 넣지 않으면 지금 시각', ["INSERT INTO admin_session (token_hash, csrf_token, expires_at) VALUES (?, ?, '9999-12-31T23:59:59.999Z')", [TOKEN_HASH, 'c'.repeat(32)]])],
  [
    tried('expires_at 2026-11-18', session({ expires_at: '2026-11-18' }), `${CHECK}ck_admin_session_expires_at`),
    tried('created_at 2026-11-17 04:00', session({ created_at: '2026-11-17 04:00' }), `${CHECK}ck_admin_session_created_at`),
  ]);

// ───────── 29 ~ 31: T-04 login_attempt ─────────
constraintRule('client_key는 1~64자',
  [tried('1자', loginAttempt({ client_key: 'k' })), tried('64자', loginAttempt())],
  [
    tried('빈 문자열', loginAttempt({ client_key: '' }), `${CHECK}ck_login_attempt_client_key`),
    tried('65자', loginAttempt({ client_key: 'k'.repeat(65) }), `${CHECK}ck_login_attempt_client_key`),
    tried('NULL', loginAttempt({ client_key: null }), `${NOT_NULL}login_attempt.client_key`),
  ]);

constraintRule('succeeded는 0 또는 1이고 꼭 넣는다',
  [tried('0', loginAttempt({ succeeded: 0 })), tried('1', loginAttempt({ succeeded: 1 }))],
  [
    tried('2', loginAttempt({ succeeded: 2 }), `${CHECK}ck_login_attempt_succeeded`),
    tried('글자 true', loginAttempt({ succeeded: 'true' }), WRONG_TYPE),
    tried('값을 넣지 않음', ["INSERT INTO login_attempt (client_key) VALUES ('k')", []], `${NOT_NULL}login_attempt.succeeded`),
  ]);

constraintRule('login_attempt.attempted_at은 UTC ISO 8601',
  [tried('넣지 않으면 지금 시각', ["INSERT INTO login_attempt (client_key, succeeded) VALUES ('k', 0)", []])],
  [
    tried('2026-11-17T04:00:00', loginAttempt({ attempted_at: '2026-11-17T04:00:00' }), `${CHECK}ck_login_attempt_attempted_at`),
    tried('NULL', loginAttempt({ attempted_at: null }), `${NOT_NULL}login_attempt.attempted_at`),
  ]);

// ───────── 32: 시각 기록 형식이 JS의 toISOString과 맞는가 ─────────
stateRule('JS toISOString 값은 모두 시각 기록 제약을 통과한다', '2000~2099년의 임의 시각 20,000개와 경계 4개를 strftime 왕복 비교', (problems) => {
  const roundTrip = db.prepare(`SELECT ${ISO_FORMAT} IS ? AS same`);
  const from = Date.UTC(2000, 0, 1);
  const span = Date.UTC(2100, 0, 1) - from;
  const samples = ['2000-02-29T23:59:59.999Z', '2026-11-17T04:00:00.000Z', '2099-12-31T23:59:59.999Z', '1970-01-01T00:00:00.000Z'];
  for (let i = 0; i < 20000; i += 1) samples.push(new Date(from + Math.floor(Math.random() * span)).toISOString());
  const failed = samples.filter((iso) => roundTrip.get(iso, iso).same !== 1);
  if (failed.length > 0) problems.push(`${failed.length}개 불일치, 예: ${failed[0]}`);
});

// ───────── 33 ~ 39: 인덱스 ─────────
stateRule('인덱스 네 개의 컬럼', 'PRAGMA index_info로 읽은 컬럼 순서', (problems) => {
  const expected = {
    idx_menu_item_category_sort: 'category,sort_order,id',
    idx_admin_session_expires_at: 'expires_at',
    idx_login_attempt_client_key_attempted_at: 'client_key,attempted_at',
    idx_login_attempt_attempted_at: 'attempted_at',
  };
  const names = all("SELECT name FROM sqlite_schema WHERE type = 'index' AND name NOT LIKE 'sqlite_%' ORDER BY name").map((r) => r.name);
  if (names.join(',') !== Object.keys(expected).sort().join(',')) problems.push(`인덱스 ${names.join(',')}`);
  for (const [name, columns] of Object.entries(expected)) {
    const actual = all('SELECT name FROM pragma_index_info(?) ORDER BY seqno', name).map((r) => r.name).join(',');
    if (actual !== columns) problems.push(`${name}: ${actual}`);
  }
});

function indexRule(name, sql, params, expected) {
  stateRule(name, `EXPLAIN QUERY PLAN: ${sql.replace(/\s+/g, ' ').trim()}`, (problems) => {
    const plan = all(`EXPLAIN QUERY PLAN ${sql}`, ...params).map((row) => row.detail).join(' / ');
    if (!plan.includes(expected)) problems.push(`계획에 ${expected} 없음: ${plan}`);
    if (plan.includes('TEMP B-TREE')) problems.push(`따로 정렬함: ${plan}`);
  });
}
const NOW = '2026-11-17T04:00:00.000Z';
indexRule('메뉴 전체 목록은 인덱스 순서로 읽는다',
  'SELECT id, name, price_krw, category, sale_status, sort_order FROM menu_item ORDER BY category, sort_order, id', [],
  'SCAN menu_item USING INDEX idx_menu_item_category_sort');
indexRule('한 분류의 마지막 순서는 인덱스로 찾는다',
  'SELECT max(sort_order) FROM menu_item WHERE category = ?', ['bread'],
  'idx_menu_item_category_sort (category=?)');
indexRule('세션은 기본 키로 찾는다',
  'SELECT csrf_token, expires_at FROM admin_session WHERE token_hash = ? AND expires_at > ?', [TOKEN_HASH, NOW],
  'SEARCH admin_session USING PRIMARY KEY (token_hash=?)');
indexRule('만료된 세션 정리는 인덱스를 쓴다',
  'DELETE FROM admin_session WHERE expires_at <= ?', [NOW],
  'idx_admin_session_expires_at (expires_at<?)');
indexRule('최근 로그인 실패 세기는 인덱스를 쓴다',
  'SELECT count(*) FROM login_attempt WHERE client_key = ? AND attempted_at >= ? AND succeeded = 0', ['k', NOW],
  'idx_login_attempt_client_key_attempted_at (client_key=? AND attempted_at>?)');
indexRule('오래된 로그인 시도 정리는 인덱스를 쓴다',
  'DELETE FROM login_attempt WHERE attempted_at < ?', [NOW],
  'idx_login_attempt_attempted_at (attempted_at<?)');

// ───────── 40 ~ 41: 영업 상태 계산 ─────────
stateRule('영업 상태 계산', '요일 1은 07:30~19:00, 요일 2는 휴무, 요일 3은 시각 없음으로 두고 8가지 경우', (problems) => {
  db.exec(`
    UPDATE business_hour SET opens_at = '07:30', closes_at = '19:00', is_day_off = 0 WHERE weekday = 1;
    UPDATE business_hour SET opens_at = NULL, closes_at = NULL, is_day_off = 1 WHERE weekday = 2;
    UPDATE business_hour SET opens_at = NULL, closes_at = NULL, is_day_off = 0 WHERE weekday = 3;`);
  const status = db.prepare(SHOP_STATUS_SQL);
  const cases = [
    [1, '07:29', 'closed'], [1, '07:30', 'open'], [1, '12:34', 'open'], [1, '18:59', 'open'],
    [1, '19:00', 'closed'], [1, '23:59', 'closed'],
    [2, '12:00', 'dayoff'], [3, '12:00', 'unset'],
  ];
  for (const [weekday, time, expected] of cases) {
    const actual = status.get({ ':weekday': weekday, ':time': time }).status;
    if (actual !== expected) problems.push(`요일 ${weekday} ${time}: ${actual}, 기대 ${expected}`);
  }
});

stateRule('요청 시각을 가게 시간대의 요일과 시각으로 바꾼다', 'UTC 2026-11-17T04:00Z와 2026-11-16T15:30Z를 Asia/Seoul로, 2026-11-17T04:00Z를 America/New_York으로', (problems) => {
  const cases = [
    ['2026-11-17T04:00:00.000Z', 'Asia/Seoul', 2, '13:00'],
    ['2026-11-16T15:30:00.000Z', 'Asia/Seoul', 2, '00:30'],
    ['2026-11-17T04:00:00.000Z', 'America/New_York', 1, '23:00'],
  ];
  for (const [utcIso, timeZone, weekday, time] of cases) {
    const clock = shopClock(utcIso, timeZone);
    if (clock.weekday !== weekday || clock.time !== time) problems.push(`${utcIso} ${timeZone}: 요일 ${clock.weekday} ${clock.time}, 기대 요일 ${weekday} ${time}`);
  }
});

// ───────── 42: 백업과 복원 ─────────
{
  const problems = [];
  const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'bakery-hours-db-check-'));
  try {
    db.exec("UPDATE business_hour SET opens_at = '07:30', closes_at = '19:00' WHERE weekday = 1");
    db.prepare("INSERT INTO menu_item (name, price_krw, category, sort_order) VALUES ('소금빵', 3500, 'bread', 0)").run();
    const backupFile = path.join(folder, 'backup.sqlite');
    const restoredFile = path.join(folder, 'restored.sqlite');
    db.exec(`VACUUM INTO '${backupFile.replace(/'/g, "''")}'`);
    fs.copyFileSync(backupFile, restoredFile);
    const restored = new DatabaseSync(restoredFile);
    try {
      const integrity = restored.prepare('PRAGMA integrity_check').get().integrity_check;
      if (integrity !== 'ok') problems.push(`integrity_check ${integrity}`);
      const hours = restored.prepare('SELECT opens_at, closes_at FROM business_hour WHERE weekday = 1').get();
      if (hours.opens_at !== '07:30' || hours.closes_at !== '19:00') problems.push('복원한 영업시간이 다름');
      if (restored.prepare('SELECT count(*) AS n FROM business_hour').get().n !== 7) problems.push('복원한 business_hour가 7행이 아님');
      if (restored.prepare('SELECT count(*) AS n FROM menu_item').get().n !== 1) problems.push('복원한 menu_item이 1행이 아님');
      const original = all("SELECT type, name, sql FROM sqlite_schema WHERE name NOT LIKE 'sqlite_%' ORDER BY type, name");
      const copied = restored.prepare("SELECT type, name, sql FROM sqlite_schema WHERE name NOT LIKE 'sqlite_%' ORDER BY type, name").all();
      if (JSON.stringify(original) !== JSON.stringify(copied)) problems.push('복원한 스키마가 다름');
      let rejected = false;
      try { restored.exec('INSERT INTO business_hour (weekday) VALUES (7)'); } catch { rejected = true; }
      if (!rejected) problems.push('복원한 파일에서 weekday 7이 들어감');
    } finally {
      restored.close();
    }
  } catch (error) {
    problems.push(error.message);
  } finally {
    fs.rmSync(folder, { recursive: true, force: true });
  }
  report('백업 파일로 복원', 'VACUUM INTO로 만든 사본을 복사해 열고 integrity_check, 행 수, 스키마, 제약 확인', problems);
}

db.close();
console.log(`${passed}/${total}`);
process.exit(passed === total ? 0 : 1);
