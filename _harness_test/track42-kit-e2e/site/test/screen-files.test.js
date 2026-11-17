// 화면 바탕의 정적 검사와 web/api-client.js의 이동 규칙.
// web/과 src/의 파일을 글자로 읽는다. 훑은 파일이 0개면 실패한다.
// 이동 규칙은 가짜 fetch와 location을 넘겨 함수를 직접 부른다.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

import { ERROR_CATALOG, errorResponse } from '../src/error-catalog.js';
import { CATEGORY_CODES, CATEGORY_LIST } from '../src/menu-category.js';
import { SHOP_STATUS_TEXT_KEYS } from '../src/shop-status.js';
import { SALE_STATUS_CODES } from '../web/input-rules.js';
import { createApiClient } from '../web/api-client.js';
import { withoutComments } from './screen-contract.js';

const root = path.join(import.meta.dirname, '..');
const readText = (relativePath) => readFileSync(path.join(root, relativePath), 'utf8');

/** 폴더 아래의 모든 파일과 폴더. 뿌리 기준 경로이고 빗금으로 잇는다. */
function walk(folder) {
  return readdirSync(path.join(root, folder), { withFileTypes: true }).flatMap((entry) => {
    const relativePath = `${folder}/${entry.name}`;
    return entry.isDirectory() ? [relativePath, ...walk(relativePath)] : [relativePath];
  });
}

/** 폴더 아래에서 확장자가 맞는 파일. 하나도 없으면 실패한다(아무것도 훑지 않고 통과하지 않는다). */
function filesOf(folder, extensions) {
  const files = walk(folder).filter((file) => extensions.includes(path.extname(file)));
  assert.ok(files.length > 0, `${folder}/ has no ${extensions.join(' ')} file to scan`);
  return files;
}

/** 글자가 걸린 줄을 «파일:줄» 목록으로 돌려준다. */
function linesMatching(file, source, pattern) {
  return source.split('\n').flatMap((line, index) => (pattern.test(line) ? [`${file}:${index + 1}`] : []));
}

const TOKENS_FILE = 'web/tokens.css';
const DICTIONARY_FILE = 'web/text/ko.json';
const dictionary = JSON.parse(readText(DICTIONARY_FILE));
const dictionaryKeys = Object.keys(dictionary);

const KEY_SHAPE = /^[a-z]+(?:\.[a-z]+)+$/;
const SLOT = /\{([^{}]*)\}/g;
const QUOTED = /(['"`])((?:\\.|(?!\1)[^\\\n])*)\1/g;

test('서버가 내려 주는 text_key는 모두 사전에 있다', () => {
  const sources = {
    error: Object.values(ERROR_CATALOG).map((entry) => entry.text_key),
    category: CATEGORY_LIST.map((category) => category.text_key),
    status: Object.values(SHOP_STATUS_TEXT_KEYS),
  };
  for (const [source, keys] of Object.entries(sources)) {
    assert.ok(keys.length > 0, `no ${source} text key was found`);
    for (const key of keys) assert.ok(Object.hasOwn(dictionary, key), `${source} text key ${key} is not in ${DICTIONARY_FILE}`);
  }

  // 표 밖에서 지어낸 키가 없는지: 서버가 읽는 파일의 문자열 가운데 사전의 영역 이름으로 시작하는 키 모양의 글자.
  const areas = new Set(dictionaryKeys.map((key) => key.split('.')[0]));
  const serverFiles = [...filesOf('src', ['.js']), 'web/input-rules.js'];
  for (const file of serverFiles) {
    for (const [, , literal] of withoutComments(readText(file), file).matchAll(QUOTED)) {
      if (!KEY_SHAPE.test(literal) || !areas.has(literal.split('.')[0])) continue;
      assert.ok(Object.hasOwn(dictionary, literal), `${file} names the text key ${literal}, which is not in ${DICTIONARY_FILE}`);
    }
  }
});

test('사전의 키는 영문 소문자와 점이다', () => {
  const allowedSlots = new Set(['name', 'weekday', 'label', 'opens', 'closes', 'time', 'amount', 'shop']);
  assert.ok(dictionaryKeys.length > 0, `${DICTIONARY_FILE} is empty`);
  for (const key of dictionaryKeys) {
    assert.match(key, KEY_SHAPE, `key ${key}`);
    const longer = dictionaryKeys.find((other) => other.startsWith(`${key}.`));
    assert.equal(longer, undefined, `key ${key} is the front part of ${longer}`);
    const value = dictionary[key];
    assert.equal(typeof value, 'string', `value of ${key}`);
    assert.ok(value.trim().length > 0, `value of ${key} is empty`);
    for (const [, slot] of value.matchAll(SLOT)) assert.ok(allowedSlots.has(slot), `${key} has the unknown slot {${slot}}`);
  }
});

test('사전의 글자에 상태 코드와 환경 변수 이름이 없다', () => {
  const environmentNames = [...readText('.env.example').matchAll(/^([A-Z][A-Z0-9_]*)=/gm)].map((match) => match[1]);
  const statusCodes = [...Object.keys(SHOP_STATUS_TEXT_KEYS), ...SALE_STATUS_CODES];
  const errorCodes = Object.keys(ERROR_CATALOG);
  const httpStatuses = [...new Set(Object.values(ERROR_CATALOG).map((entry) => String(entry.status)))];
  for (const [kind, words] of Object.entries({ environmentNames, statusCodes, errorCodes, categoryCodes: CATEGORY_CODES, httpStatuses })) {
    assert.ok(words.length > 0, `no ${kind} to look for`);
  }
  const internalWords = [...environmentNames, ...statusCodes, ...errorCodes, ...CATEGORY_CODES, ...httpStatuses];

  for (const [key, value] of Object.entries(dictionary)) {
    const shown = value.replace(SLOT, ' ');
    for (const word of internalWords) {
      const whole = new RegExp(`(?<![A-Za-z0-9_])${word}(?![A-Za-z0-9_])`);
      assert.ok(!whole.test(shown), `the text of ${key} shows the internal word ${word}`);
    }
    // 내부 낱말, 설정 키, API 번호는 모두 영문자로 쓴다. 고객에게 보이는 글에는 영문자가 없다.
    assert.ok(!/[A-Za-z_]/.test(shown), `the text of ${key} has Latin letters outside its slots: ${value}`);
  }
});

test('화면 파일과 서버 코드에 한글이 직접 없다', () => {
  const HANGUL = /[ᄀ-ᇿ㄰-㆏ꥠ-꥿가-퟿]/;
  const screenFiles = filesOf('web', ['.html', '.js', '.css']);
  const serverFiles = filesOf('src', ['.js']);
  const found = [...screenFiles, ...serverFiles].flatMap((file) => linesMatching(file, withoutComments(readText(file), file), HANGUL));
  assert.deepEqual(found, [], 'Korean text outside the dictionary');
});

test('화면 스크립트에 HTML 문자열을 넣는 호출이 없다', () => {
  const HTML_STRING_CALL = /\b(?:innerHTML|outerHTML|insertAdjacentHTML)\b|\bdocument\s*\.\s*write(?:ln)?\b/;
  const found = filesOf('web', ['.js']).flatMap((file) => linesMatching(file, readText(file), HTML_STRING_CALL));
  assert.deepEqual(found, [], 'calls that turn a string into markup');
});

test('토큰 파일 밖 CSS에 색 값과 data 주소가 직접 없다', () => {
  const NAMED_COLORS = new Set(
    ('aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue blueviolet brown burlywood '
      + 'cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue darkcyan darkgoldenrod darkgray '
      + 'darkgreen darkgrey darkkhaki darkmagenta darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen '
      + 'darkslateblue darkslategray darkslategrey darkturquoise darkviolet deeppink deepskyblue dimgray dimgrey dodgerblue '
      + 'firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite gold goldenrod gray green greenyellow grey honeydew '
      + 'hotpink indianred indigo ivory khaki lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan '
      + 'lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen lightskyblue lightslategray '
      + 'lightslategrey lightsteelblue lightyellow lime limegreen linen magenta maroon mediumaquamarine mediumblue '
      + 'mediumorchid mediumpurple mediumseagreen mediumslateblue mediumspringgreen mediumturquoise mediumvioletred '
      + 'midnightblue mintcream mistyrose moccasin navajowhite navy oldlace olive olivedrab orange orangered orchid '
      + 'palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff peru pink plum powderblue purple '
      + 'rebeccapurple red rosybrown royalblue saddlebrown salmon sandybrown seagreen seashell sienna silver skyblue '
      + 'slateblue slategray slategrey snow springgreen steelblue tan teal thistle tomato turquoise violet wheat white '
      + 'whitesmoke yellow yellowgreen').split(' '),
  );
  const HEX_COLOR = /#[0-9a-fA-F]{3,8}(?![0-9a-zA-Z_-])/;
  const COLOR_FUNCTION = /(?<![\w-])(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color|color-mix|light-dark)\(/i;
  const BARE_WORD = /(?<![\w-])[a-zA-Z]+(?![\w(-])/g;
  const DECLARATION_BLOCK = /\{([^{}]*)\}/g;
  const VARIABLE_USE = /var\(\s*(--[a-z0-9-]+)/g;
  const VARIABLE_DEFINITION = /(--[a-z0-9-]+)\s*:/g;

  const tokens = new Set([...withoutComments(readText(TOKENS_FILE), TOKENS_FILE).matchAll(VARIABLE_DEFINITION)].map((match) => match[1]));
  assert.ok(tokens.size > 0, `${TOKENS_FILE} defines no token`);

  const componentFiles = filesOf('web', ['.css']).filter((file) => file !== TOKENS_FILE);
  assert.ok(componentFiles.length > 0, 'web/ has no CSS file besides the token file');

  for (const file of componentFiles) {
    const css = withoutComments(readText(file), file);
    assert.ok(!/data:/i.test(css), `${file} has a data: address`);

    const ownVariables = new Set([...css.matchAll(VARIABLE_DEFINITION)].map((match) => match[1]));
    const declarations = [...css.matchAll(DECLARATION_BLOCK)].flatMap((block) => block[1].split(';'));
    let checked = 0;
    for (const declaration of declarations) {
      const colon = declaration.indexOf(':');
      if (colon === -1) continue;
      const property = declaration.slice(0, colon).trim();
      const value = declaration.slice(colon + 1).trim();
      checked += 1;
      assert.ok(!HEX_COLOR.test(value), `${file}: ${property} has a color value: ${value}`);
      assert.ok(!COLOR_FUNCTION.test(value), `${file}: ${property} has a color function: ${value}`);
      const named = (value.match(BARE_WORD) ?? []).find((word) => NAMED_COLORS.has(word.toLowerCase()));
      assert.equal(named, undefined, `${file}: ${property} has the color name ${named}: ${value}`);
      for (const [, variable] of value.matchAll(VARIABLE_USE)) {
        assert.ok(tokens.has(variable) || ownVariables.has(variable), `${file}: ${property} reads ${variable}, which ${TOKENS_FILE} does not define`);
      }
    }
    assert.ok(checked > 0, `${file} has no declaration to check`);
  }
});

test('파일 이름에 금지 낱말이 없다', () => {
  const BANNED_WORDS = ['utils', 'helpers', 'components', 'services', 'common', 'misc'];
  const names = ['src', 'web', 'test', 'db'].flatMap((folder) => walk(folder));
  assert.ok(names.length > 0, 'no file name to check');
  const found = names.filter((name) => BANNED_WORDS.some((word) => name.toLowerCase().includes(word)));
  assert.deepEqual(found, [], 'file names that say nothing about what the file does');
});

// R-04

test('api-client는 401 login_failed에는 이동하지 않고 auth_required에만 로그인 화면으로 보낸다', async () => {
  const LOGIN_SCREEN = '/admin/login';
  const EXPIRED_ADDRESS = '/admin/login#expired';
  const ADMIN_SCREENS = ['/admin/hours', '/admin/menu'];

  /** 오류 표의 코드로 만든 가짜 응답. 상태 코드와 본문은 서버가 쓰는 표에서 온다. */
  function errorAnswer(code) {
    const { status, body } = errorResponse(code);
    return { ok: false, status, json: async () => body };
  }

  /** 주소가 pathname인 화면에서 answer를 받는 요청 하나를 보내고 결과와 이동한 주소를 돌려준다. */
  async function callFrom(pathname, answer) {
    const moves = [];
    const client = createApiClient({
      fetch: async () => answer(),
      location: { pathname, assign: (address) => moves.push(address) },
    });
    return { result: await client.request('GET', '/api/admin/session'), moves };
  }

  assert.equal(errorResponse('login_failed').status, 401);
  assert.equal(errorResponse('auth_required').status, 401);

  for (const pathname of [...ADMIN_SCREENS, LOGIN_SCREEN]) {
    // 401이어도 login_failed면 이동하지 않는다.
    const failedLogin = await callFrom(pathname, () => errorAnswer('login_failed'));
    assert.deepEqual(failedLogin.moves, [], `login_failed on ${pathname}`);
    assert.deepEqual(failedLogin.result, {
      ok: false,
      status: 401,
      code: 'login_failed',
      text_key: ERROR_CATALOG.login_failed.text_key,
    });

    // 약속한 오류 모양이 없는 401도 이동하지 않는다. 이동을 정하는 것은 상태 코드가 아니다.
    const bare = await callFrom(pathname, () => ({
      ok: false,
      status: 401,
      json: async () => {
        throw new SyntaxError('no body');
      },
    }));
    assert.deepEqual(bare.moves, [], `401 without a code on ${pathname}`);
    assert.equal(bare.result.ok, false);
    assert.equal(bare.result.code, null);

    // 다른 오류 코드, 성공, 닿지 못한 요청도 이동하지 않는다.
    const rejected = await callFrom(pathname, () => errorAnswer('csrf_rejected'));
    assert.deepEqual(rejected.moves, [], `csrf_rejected on ${pathname}`);
    const succeeded = await callFrom(pathname, () => ({ ok: true, status: 200, json: async () => ({ csrf_token: 'token' }) }));
    assert.deepEqual(succeeded.moves, [], `success on ${pathname}`);
    assert.equal(succeeded.result.ok, true);
    const unreachable = await callFrom(pathname, () => {
      throw new TypeError('fetch failed');
    });
    assert.deepEqual(unreachable.moves, [], `unreachable server on ${pathname}`);
    assert.deepEqual(unreachable.result, { ok: false, status: 0, code: null, text_key: 'error.network' });
    assert.ok(Object.hasOwn(dictionary, unreachable.result.text_key));
  }

  // auth_required: 관리 화면에서는 로그인 화면으로 한 번 보낸다.
  for (const pathname of ADMIN_SCREENS) {
    const expired = await callFrom(pathname, () => errorAnswer('auth_required'));
    assert.deepEqual(expired.moves, [EXPIRED_ADDRESS], `auth_required on ${pathname}`);
    assert.equal(expired.result.code, 'auth_required');
    assert.equal(expired.result.text_key, ERROR_CATALOG.auth_required.text_key);
  }

  // auth_required: 로그인 화면 자신에서는 이동하지 않는다.
  const onLoginScreen = await callFrom(LOGIN_SCREEN, () => errorAnswer('auth_required'));
  assert.deepEqual(onLoginScreen.moves, [], 'auth_required on the login screen');
  assert.equal(onLoginScreen.result.code, 'auth_required');
});
