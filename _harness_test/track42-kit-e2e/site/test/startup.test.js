// U-01의 시험: 환경 값 검사, DB 열기, 저장소 뿌리의 파일.
// 환경 값은 실행할 때마다 무작위로 만들고, DB 파일은 임시 폴더에 만들어 끝나면 지운다.

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { test } from 'node:test';

import { openDatabase, SCHEMA_VERSION, SchemaVersionError } from '../src/database.js';
import { EnvironmentError, readEnvironment } from '../src/environment.js';

const siteRoot = path.join(import.meta.dirname, '..');
const REQUIRED_NAMES = ['ADMIN_PASSWORD', 'SESSION_SECRET', 'SHOP_NAME'];
const OPTIONAL_NAMES = ['SHOP_TIME_ZONE', 'PORT', 'DB_FILE'];
const ENVIRONMENT_NAMES = [...REQUIRED_NAMES, ...OPTIONAL_NAMES];
const HOUR_MS = 60 * 60 * 1000;

const randomText = (length) => randomBytes(length).toString('hex').slice(0, length);

function usableValues() {
  return {
    ADMIN_PASSWORD: randomText(24),
    SESSION_SECRET: randomText(48),
    SHOP_NAME: `shop ${randomText(8)}`,
  };
}

/**
 * 시작 검사 함수만 부르는 자식 프로세스. 이 시험을 돌리는 셸에 여섯 이름의 값이 있어도
 * 넘어가지 않게 지우고, 시험이 정한 값만 준다.
 */
function runStartCheck(values) {
  const cleared = new Set([...ENVIRONMENT_NAMES, 'NODE_TEST_CONTEXT', 'NODE_OPTIONS']);
  const inherited = Object.entries(process.env).filter(([name]) => !cleared.has(name.toUpperCase()));
  const script = "import { readEnvironmentOrExit } from './src/environment.js'; readEnvironmentOrExit();";
  return spawnSync(process.execPath, ['--input-type=module', '-e', script], {
    cwd: siteRoot,
    env: { ...Object.fromEntries(inherited), ...values },
    encoding: 'utf8',
  });
}

function problemsOf(variables) {
  try {
    readEnvironment(variables);
  } catch (error) {
    assert.ok(error instanceof EnvironmentError, `EnvironmentError가 아니다: ${error}`);
    return error.problems;
  }
  return [];
}

/** 열린 DB 파일이 남아 있으면 Windows에서 지우기가 실패하므로 닫지 않은 손잡이도 여기서 드러난다. */
function temporaryFolder(t) {
  const folder = mkdtempSync(path.join(os.tmpdir(), 'bakery-startup-'));
  t.after(() => rmSync(folder, { recursive: true, maxRetries: 3 }));
  return folder;
}

function withDirectConnection(dbFile, work) {
  const connection = new DatabaseSync(dbFile);
  try {
    return work(connection);
  } finally {
    connection.close();
  }
}

function withDatabase(dbFile, now, work) {
  const database = openDatabase({ dbFile, now });
  try {
    return work(database);
  } finally {
    database.close();
  }
}

const readHours = (source) =>
  source
    .prepare('SELECT weekday, opens_at, closes_at, is_day_off FROM business_hour ORDER BY weekday')
    .all()
    .map((row) => ({ ...row }));

function readExampleFile() {
  const assigned = new Map();
  for (const line of readFileSync(path.join(siteRoot, '.env.example'), 'utf8').split(/\r?\n/)) {
    const match = /^([A-Z_]+)=(.*)$/.exec(line);
    if (match) assigned.set(match[1], match[2]);
  }
  return assigned;
}

const readJson = (...parts) => JSON.parse(readFileSync(path.join(siteRoot, ...parts), 'utf8'));

test('필수 값 셋이 없으면 이름 셋을 알리고 종료 코드 1로 끝난다', () => {
  const result = runStartCheck({});

  assert.equal(result.status, 1);
  assert.equal(result.stdout, '');
  for (const name of REQUIRED_NAMES) {
    assert.match(result.stderr, new RegExp(`^${name} missing$`, 'm'));
  }
  for (const name of OPTIONAL_NAMES) {
    assert.ok(!result.stderr.includes(name), `${name}은 기본값이 있어 알릴 것이 없다`);
  }
  assert.deepEqual(
    problemsOf({}),
    REQUIRED_NAMES.map((name) => ({ name, reason: 'missing' })),
  );
  assert.deepEqual(
    problemsOf({ ADMIN_PASSWORD: '', SESSION_SECRET: '', SHOP_NAME: '' }),
    REQUIRED_NAMES.map((name) => ({ name, reason: 'missing' })),
    '빈 문자열은 없는 것으로 친다',
  );
});

test('시작 실패 글에 환경 값이 들어 있지 않다', () => {
  const wrongValues = {
    ADMIN_PASSWORD: randomText(8),
    SESSION_SECRET: randomText(16),
    SHOP_NAME: randomText(80),
    SHOP_TIME_ZONE: `Nowhere/${randomText(10)}`,
    PORT: '70000',
    DB_FILE: path.join(randomText(12), 'bakery.sqlite'),
  };
  const result = runStartCheck(wrongValues);

  assert.equal(result.status, 1);
  for (const name of ['ADMIN_PASSWORD', 'SESSION_SECRET', 'SHOP_NAME', 'SHOP_TIME_ZONE', 'PORT']) {
    assert.match(result.stderr, new RegExp(`^${name} [a-z_]+$`, 'm'));
  }

  let thrown = null;
  try {
    readEnvironment(wrongValues);
  } catch (error) {
    thrown = error;
  }
  assert.ok(thrown instanceof EnvironmentError);
  const inProcessText = [thrown.message, thrown.stack, JSON.stringify(thrown.problems)].join('\n');
  for (const [name, value] of Object.entries(wrongValues)) {
    assert.ok(!result.stderr.includes(value), `${name}의 값이 표준 오류 출력에 있다`);
    assert.ok(!result.stdout.includes(value), `${name}의 값이 표준 출력에 있다`);
    assert.ok(!inProcessText.includes(value), `${name}의 값이 오류 객체에 있다`);
  }
});

test('12자보다 짧은 비밀번호로는 시작하지 않는다', () => {
  const tooShort = runStartCheck({ ...usableValues(), ADMIN_PASSWORD: randomText(11) });
  assert.equal(tooShort.status, 1);
  assert.match(tooShort.stderr, /^ADMIN_PASSWORD too_short$/m);
  assert.ok(!tooShort.stderr.includes('SESSION_SECRET'));

  const shortestAllowed = runStartCheck({ ...usableValues(), ADMIN_PASSWORD: randomText(12) });
  assert.equal(shortestAllowed.status, 0, shortestAllowed.stderr);

  assert.deepEqual(problemsOf({ ...usableValues(), ADMIN_PASSWORD: randomText(200) }), []);
  assert.deepEqual(problemsOf({ ...usableValues(), ADMIN_PASSWORD: randomText(201) }), [
    { name: 'ADMIN_PASSWORD', reason: 'invalid_format' },
  ]);
  assert.deepEqual(problemsOf({ ...usableValues(), SESSION_SECRET: randomText(31) }), [
    { name: 'SESSION_SECRET', reason: 'too_short' },
  ]);
  assert.deepEqual(problemsOf({ ...usableValues(), SESSION_SECRET: randomText(32) }), []);
});

test('시간대, 포트, DB 경로를 주지 않으면 기본값이다', () => {
  const given = usableValues();
  const expected = {
    adminPassword: given.ADMIN_PASSWORD,
    sessionSecret: given.SESSION_SECRET,
    shopName: given.SHOP_NAME,
    shopTimeZone: 'Asia/Seoul',
    port: 4173,
    dbFile: 'data/bakery.sqlite',
  };

  assert.deepEqual({ ...readEnvironment(given) }, expected);
  assert.deepEqual(
    { ...readEnvironment({ ...given, SHOP_TIME_ZONE: '', PORT: '', DB_FILE: '' }) },
    expected,
    '빈 문자열은 없는 것으로 친다',
  );

  // .env.example이 적어 둔 값이 코드의 기본값과 다르면 운영자가 틀린 기본값을 읽는다.
  const example = readExampleFile();
  assert.equal(example.get('SHOP_TIME_ZONE'), expected.shopTimeZone);
  assert.equal(example.get('PORT'), String(expected.port));
  assert.equal(example.get('DB_FILE'), expected.dbFile);

  const custom = readEnvironment({
    ...given,
    SHOP_NAME: `  ${given.SHOP_NAME}  `,
    SHOP_TIME_ZONE: 'Europe/Berlin',
    PORT: '65535',
    DB_FILE: 'elsewhere/shop.sqlite',
  });
  assert.equal(custom.shopName, given.SHOP_NAME, '가게 이름은 앞뒤 공백을 뗀다');
  assert.equal(custom.shopTimeZone, 'Europe/Berlin');
  assert.equal(custom.port, 65535);
  assert.equal(custom.dbFile, 'elsewhere/shop.sqlite');
});

test('없는 시간대 이름과 범위 밖 포트는 이름을 알리고 시작하지 않는다', () => {
  const result = runStartCheck({ ...usableValues(), SHOP_TIME_ZONE: 'Nowhere/Nothing', PORT: '65536' });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /^SHOP_TIME_ZONE invalid_format$/m);
  assert.match(result.stderr, /^PORT invalid_format$/m);
  for (const name of REQUIRED_NAMES) {
    assert.ok(!result.stderr.includes(name), `${name}은 맞는 값이라 알릴 것이 없다`);
  }

  for (const port of ['0', '65536', '70000', '-1', '80.5', '0x50', '8e3', 'http', ' 80', ' ']) {
    assert.deepEqual(
      problemsOf({ ...usableValues(), PORT: port }),
      [{ name: 'PORT', reason: 'invalid_format' }],
      `PORT ${JSON.stringify(port)}`,
    );
  }
  assert.equal(readEnvironment({ ...usableValues(), PORT: '1' }).port, 1);

  for (const timeZone of ['Asia/Nowhere', 'Seoul', '서울']) {
    assert.deepEqual(
      problemsOf({ ...usableValues(), SHOP_TIME_ZONE: timeZone }),
      [{ name: 'SHOP_TIME_ZONE', reason: 'invalid_format' }],
      `SHOP_TIME_ZONE ${timeZone}`,
    );
  }
});

test('필수 값을 다 주고 부른 자식 프로세스는 종료 코드 0이고 표준 오류 출력이 비어 있다', () => {
  const result = runStartCheck(usableValues());

  assert.equal(result.status, 0);
  assert.equal(result.stderr, '');
  assert.equal(result.stdout, '', '환경 값을 출력하지 않는다');
});

test('빈 파일에서 열면 일곱 요일 행과 스키마 번호 1이 있다', (t) => {
  const dbFile = path.join(temporaryFolder(t), 'not-yet', 'made', 'bakery.sqlite');
  assert.ok(!existsSync(path.dirname(dbFile)), '폴더가 없는 경로에서 시작한다');

  withDatabase(dbFile, () => new Date('2026-11-17T04:00:00.000Z'), (database) => {
    assert.deepEqual(
      readHours(database),
      [0, 1, 2, 3, 4, 5, 6].map((weekday) => ({ weekday, opens_at: null, closes_at: null, is_day_off: 0 })),
    );
    assert.equal(database.prepare('SELECT count(*) AS total FROM menu_item').get().total, 0);
  });

  withDirectConnection(dbFile, (connection) => {
    assert.equal(SCHEMA_VERSION, 1);
    assert.equal(connection.prepare('PRAGMA user_version').get().user_version, 1);
    const tables = connection
      .prepare("SELECT name FROM sqlite_schema WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
      .all()
      .map((row) => row.name);
    assert.deepEqual(tables, ['admin_session', 'business_hour', 'login_attempt', 'menu_item']);
  });
});

test('두 번 열어도 일곱 행이고 고친 영업시간이 그대로다', (t) => {
  const dbFile = path.join(temporaryFolder(t), 'bakery.sqlite');
  const editedAt = new Date('2026-11-17T04:00:00.000Z');
  const setHours = 'UPDATE business_hour SET opens_at = ?, closes_at = ?, updated_at = ? WHERE weekday = ?';

  withDatabase(dbFile, () => editedAt, (database) => {
    const changed = database.transaction(
      () => database.prepare(setHours).run('07:30', '19:00', editedAt.toISOString(), 1).changes,
    );
    assert.equal(changed, 1);

    // 트랜잭션 안에서 던지면 그 안의 쓰기는 남지 않는다.
    assert.throws(
      () =>
        database.transaction(() => {
          database.prepare(setHours).run('09:00', '18:00', editedAt.toISOString(), 2);
          throw new Error('stop this write');
        }),
      /stop this write/,
    );
    assert.throws(() => database.transaction(async () => {}), TypeError, '비동기 작업은 받지 않는다');
  });

  const expected = [0, 1, 2, 3, 4, 5, 6].map((weekday) =>
    weekday === 1
      ? { weekday, opens_at: '07:30', closes_at: '19:00', is_day_off: 0 }
      : { weekday, opens_at: null, closes_at: null, is_day_off: 0 },
  );
  withDatabase(dbFile, () => new Date('2026-11-18T04:00:00.000Z'), (database) => {
    assert.deepEqual(readHours(database), expected);
    const edited = database.prepare('SELECT updated_at FROM business_hour WHERE weekday = 1').get();
    assert.equal(edited.updated_at, editedAt.toISOString());
  });
  withDirectConnection(dbFile, (connection) => {
    assert.deepEqual(readHours(connection), expected);
    assert.equal(connection.prepare('PRAGMA user_version').get().user_version, SCHEMA_VERSION);
  });
});

test('스키마 번호가 0도 1도 아닌 파일은 열지 않고 두 번호를 알린다', (t) => {
  const folder = temporaryFolder(t);

  for (const fileVersion of [2, 7, -1]) {
    const dbFile = path.join(folder, `version-${fileVersion}.sqlite`);
    withDirectConnection(dbFile, (connection) => {
      connection.exec(`PRAGMA user_version = ${fileVersion}`);
    });

    assert.throws(
      () => openDatabase({ dbFile, now: () => new Date('2026-11-17T04:00:00.000Z') }),
      (error) => {
        assert.ok(error instanceof SchemaVersionError, `SchemaVersionError가 아니다: ${error}`);
        assert.equal(error.fileVersion, fileVersion);
        assert.equal(error.knownVersion, SCHEMA_VERSION);
        assert.ok(error.message.includes(`version ${fileVersion} `), error.message);
        assert.ok(error.message.includes(`version ${SCHEMA_VERSION}`), error.message);
        return true;
      },
    );

    withDirectConnection(dbFile, (connection) => {
      assert.equal(connection.prepare('PRAGMA user_version').get().user_version, fileVersion);
      const objects = connection.prepare('SELECT count(*) AS total FROM sqlite_schema').get();
      assert.equal(objects.total, 0, '열지 않은 파일에 표를 만들지 않는다');
    });
  }
});

test('열 때의 정리는 인자로 받은 now를 기준으로 만료된 세션과 24시간이 지난 시도만 지운다', (t) => {
  const dbFile = path.join(temporaryFolder(t), 'bakery.sqlite');
  // 기기의 시계와 먼 시각이다. 코드가 기기의 시계를 읽으면 아래의 기대와 달라진다.
  const reopenedAt = new Date('2031-03-05T08:00:00.000Z');
  const iso = (offsetMs) => new Date(reopenedAt.getTime() + offsetMs).toISOString();
  const sessions = [
    { label: 'expired', expires_at: iso(-1) },
    { label: 'expires-now', expires_at: iso(0) },
    { label: 'alive', expires_at: iso(1) },
  ].map((session) => ({ ...session, token_hash: randomBytes(32).toString('hex') }));
  const attempts = [
    { client_key: 'past-retention', attempted_at: iso(-24 * HOUR_MS - 1), succeeded: 0 },
    { client_key: 'past-retention-succeeded', attempted_at: iso(-25 * HOUR_MS), succeeded: 1 },
    { client_key: 'at-retention', attempted_at: iso(-24 * HOUR_MS), succeeded: 0 },
    { client_key: 'recent', attempted_at: iso(-HOUR_MS), succeeded: 0 },
  ];
  const readState = (connection) => ({
    sessions: connection
      .prepare('SELECT token_hash FROM admin_session ORDER BY expires_at')
      .all()
      .map((row) => sessions.find((session) => session.token_hash === row.token_hash).label),
    attempts: connection
      .prepare('SELECT client_key FROM login_attempt ORDER BY attempted_at')
      .all()
      .map((row) => row.client_key),
  });

  withDatabase(dbFile, () => new Date('2026-11-17T04:00:00.000Z'), () => {});
  withDirectConnection(dbFile, (connection) => {
    const addSession = connection.prepare(
      'INSERT INTO admin_session (token_hash, csrf_token, created_at, expires_at) VALUES (?, ?, ?, ?)',
    );
    for (const session of sessions) {
      addSession.run(session.token_hash, randomBytes(32).toString('base64url'), iso(-48 * HOUR_MS), session.expires_at);
    }
    const addAttempt = connection.prepare(
      'INSERT INTO login_attempt (client_key, attempted_at, succeeded) VALUES (?, ?, ?)',
    );
    for (const attempt of attempts) {
      addAttempt.run(attempt.client_key, attempt.attempted_at, attempt.succeeded);
    }
  });

  // 모든 행보다 이른 now로 열면 지울 것이 없다.
  let earlyCalls = 0;
  withDatabase(
    dbFile,
    () => {
      earlyCalls += 1;
      return new Date(reopenedAt.getTime() - 30 * 24 * HOUR_MS);
    },
    () => {},
  );
  assert.ok(earlyCalls > 0, 'openDatabase가 받은 now를 부른다');
  withDirectConnection(dbFile, (connection) => {
    assert.deepEqual(readState(connection), {
      sessions: ['expired', 'expires-now', 'alive'],
      attempts: ['past-retention-succeeded', 'past-retention', 'at-retention', 'recent'],
    });
  });

  withDatabase(dbFile, () => reopenedAt, () => {});
  withDirectConnection(dbFile, (connection) => {
    assert.deepEqual(readState(connection), { sessions: ['alive'], attempts: ['at-retention', 'recent'] });
    assert.equal(connection.prepare('SELECT count(*) AS total FROM business_hour').get().total, 7);
  });

  assert.throws(() => openDatabase({ dbFile, now: () => 'not a date' }), TypeError);
  assert.throws(() => openDatabase({ dbFile }), TypeError);
});

test('.env.example의 필수 값 칸이 비어 있다', () => {
  const example = readExampleFile();

  assert.deepEqual([...example.keys()].sort(), [...ENVIRONMENT_NAMES].sort());
  for (const name of REQUIRED_NAMES) {
    assert.equal(example.get(name), '', `${name}의 칸에 값이 있다`);
  }
});

test('.gitignore에 .env와 data/ 줄이 있다', () => {
  const lines = readFileSync(path.join(siteRoot, '.gitignore'), 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim());

  assert.ok(lines.includes('.env'), '.env 줄이 없다');
  assert.ok(lines.includes('data/'), 'data/ 줄이 없다');
});

test('package.json의 dependencies가 비어 있다', () => {
  const rootPackage = readJson('package.json');

  assert.deepEqual(rootPackage.dependencies, {});
  assert.deepEqual(rootPackage.devDependencies, {});
  for (const field of ['optionalDependencies', 'peerDependencies', 'bundleDependencies', 'bundledDependencies']) {
    assert.ok(!(field in rootPackage), `${field} 필드가 있다`);
  }
});

test('뿌리 package.json에 type 필드가 없고 src와 test의 package.json은 type module 한 필드뿐이다', () => {
  assert.ok(!('type' in readJson('package.json')), '뿌리 package.json에 type 필드가 있다');
  assert.deepEqual(readJson('src', 'package.json'), { type: 'module' });
  assert.deepEqual(readJson('test', 'package.json'), { type: 'module' });
});

test('package.json이 있어도 node scripts/coolhan.js where, node db/check-schema.js, node docs/plan/design/contrast-check.js는 종료 코드 0이다', () => {
  assert.ok(existsSync(path.join(siteRoot, 'package.json')), '뿌리 package.json이 있어야 이 시험이 뜻이 있다');

  const commands = [
    ['scripts/coolhan.js', 'where'],
    ['db/check-schema.js'],
    ['docs/plan/design/contrast-check.js'],
  ];
  for (const command of commands) {
    const result = spawnSync(process.execPath, command, { cwd: siteRoot, encoding: 'utf8' });
    assert.equal(result.status, 0, `node ${command.join(' ')}\n${result.stderr}`);
  }
});
