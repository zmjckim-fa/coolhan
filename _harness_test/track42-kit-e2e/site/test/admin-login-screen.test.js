// S-02 관리자 로그인 화면과 위쪽 줄 스크립트의 정적 계약 시험.
// 화면의 파일(HTML, 그 화면의 스크립트, 스크립트가 가져오는 web/의 파일)을 글자로 읽어
// 계약의 글자를 담고 있는지 본다. 파일이 없으면 읽기에서 실패한다.
// 버튼이 실제로 그 API를 부르는지와 화면이 그려지는지는 브라우저 확인이 본다.
// 기대값의 출처: 화면 기획 1.3절(부르는 API), 3.2절(구역, 상태, 입력칸, 버튼), 1.4절(위쪽 줄의 메뉴 항목).

import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  apiPathsIn,
  assertApiPaths,
  assertImports,
  assertLabelsAndNames,
  assertLanguageAndHeading,
  assertNoInlineCode,
  assertTextKeys,
  readScreen,
} from './screen-contract.js';

const SCREEN_HTML = 'admin-login.html';
const SCREEN_SCRIPT = 'admin-login.js';
const TOP_BAR_SCRIPT = 'admin-top-bar.js';

const LOGIN_API = '/api/admin/login';
const LOGOUT_API = '/api/admin/logout';
const SESSION_API = '/api/admin/session';

// 3.2절의 버튼 표.
const SCREEN_BUTTON_KEYS = ['nav.skip', 'nav.home', 'button.login'];
// 3.2절의 구역 표, 상태 표, 입력칸 표의 키 가운데 서버가 text_key로 내려 주지 않는 것.
// error.password.required는 화면이 보내기 전에 규칙 함수로 얻고, error.network는 화면이 판단한다.
const SCREEN_TEXT_KEYS = [
  'title.login',
  'login.password',
  'mark.required',
  'notice.loading',
  'notice.loggedout',
  'error.session.expired',
  'error.password.required',
  'error.network',
];
// 1.4절의 메뉴 구성과 3.3절, 3.4절의 위쪽 줄: 링크, 로그아웃, 탭 둘, 탭 줄의 읽는 이름.
const TOP_BAR_KEYS = ['nav.home', 'button.logout', 'title.hours', 'title.menu', 'nav.admin'];

// S-02로 넘기는 사유 두 낱말. 이 둘이 아니면 화면은 아무것도 보이지 않는다.
const ARRIVAL_REASONS = ['#loggedout', '#expired'];
// 스크립트가 읽을 수 있는 저장소. 비밀번호와 세션 정보를 두지 않는다.
const SCRIPT_STORAGE = /\b(?:localStorage|sessionStorage|indexedDB)\b|\bdocument\s*\.\s*cookie\b/;

const hasLiteral = (source, literal) => source.includes(`'${literal}'`) || source.includes(`"${literal}"`);

function tagsNamed(screen, name) {
  return screen.tags.filter((tag) => tag.name === name);
}

function onlyTag(screen, name) {
  const found = tagsNamed(screen, name);
  assert.equal(found.length, 1, `web/${SCREEN_HTML} must have exactly one <${name}>`);
  return found[0];
}

test('S-02 스크립트가 A-02와 A-04 경로를, 위쪽 줄 스크립트가 A-03과 A-04 경로를 가리킨다', () => {
  const screen = readScreen(SCREEN_HTML);
  assert.deepEqual(screen.entryScripts, [SCREEN_SCRIPT]);
  assertImports(screen, TOP_BAR_SCRIPT);
  assertImports(screen, 'api-client.js');

  // S-02가 부르는 것은 A-02와 A-04다. A-04는 위쪽 줄 스크립트의 세션 확인 함수로 부른다.
  assertApiPaths(screen, [LOGIN_API, SESSION_API]);
  assertApiPaths(screen, [LOGIN_API], { file: SCREEN_SCRIPT });
  assert.deepEqual(apiPathsIn(screen.scripts.get(SCREEN_SCRIPT)), [LOGIN_API], `web/${SCREEN_SCRIPT} names an API of its own besides A-02`);

  // 위쪽 줄 스크립트가 부르는 것은 A-03과 A-04뿐이다.
  assertApiPaths(screen, [LOGOUT_API, SESSION_API], { file: TOP_BAR_SCRIPT });
  assert.deepEqual(apiPathsIn(screen.scripts.get(TOP_BAR_SCRIPT)).sort(), [LOGOUT_API, SESSION_API].sort());

  // 화면 전체가 가리키는 API는 이 셋이 전부다.
  const named = new Set([...screen.scripts.values()].flatMap(apiPathsIn));
  assert.deepEqual([...named].sort(), [LOGIN_API, LOGOUT_API, SESSION_API].sort());
});

test('S-02의 버튼과 문구 키가 화면 파일과 사전에 있다', () => {
  const screen = readScreen(SCREEN_HTML);
  assertTextKeys(screen, [...SCREEN_BUTTON_KEYS, ...SCREEN_TEXT_KEYS, ...TOP_BAR_KEYS]);

  // 위쪽 줄의 키는 위쪽 줄 스크립트 자신이 담는다. S-03과 S-04는 그 스크립트를 가져와 쓴다.
  const topBar = screen.scripts.get(TOP_BAR_SCRIPT);
  for (const key of TOP_BAR_KEYS) assert.ok(hasLiteral(topBar, key), `web/${TOP_BAR_SCRIPT} does not name ${key}`);

  // 문서 제목은 서버가 사전 글자로 바꾸는 자리이고 제목 1단계와 같은 키다.
  assert.match(screen.html, /<title>\{\{text:title\.login\}\}<\/title>/);
  assert.equal(onlyTag(screen, 'h1').attributes.get('data-text'), 'title.login');

  // 버튼 표의 세 가지가 HTML에 그 요소로 있다.
  const links = tagsNamed(screen, 'a');
  const skipLink = links.find((tag) => tag.attributes.get('data-text') === 'nav.skip');
  const homeLink = links.find((tag) => tag.attributes.get('data-text') === 'nav.home');
  assert.ok(skipLink !== undefined, 'no skip link');
  assert.equal(skipLink.attributes.get('href'), `#${onlyTag(screen, 'h1').attributes.get('id')}`, 'the skip link goes to the title');
  assert.ok(homeLink !== undefined, 'no link to the visitor screen');
  assert.equal(homeLink.attributes.get('href'), '/');
  const button = onlyTag(screen, 'button');
  assert.equal(button.attributes.get('data-text'), 'button.login');
  assert.equal(button.attributes.get('type'), 'submit');

  // 사유는 정해진 두 낱말만 읽는다. 로그아웃의 낱말은 위쪽 줄 스크립트가, 만료의 낱말은 api-client가 쓴다.
  const sources = [...screen.scripts.values()];
  for (const reason of ARRIVAL_REASONS) {
    assert.ok(sources.some((source) => source.includes(reason)), `no script of web/${SCREEN_HTML} names ${reason}`);
  }
  assert.ok(hasLiteral(topBar, '#loggedout'), `web/${TOP_BAR_SCRIPT} does not hand over the logout reason`);
  assert.ok(hasLiteral(screen.scripts.get(SCREEN_SCRIPT), '#expired'), `web/${SCREEN_SCRIPT} does not read the expired reason`);
});

test('S-02의 HTML에 인라인 스크립트, style 속성, on 속성이 없다', () => {
  const screen = readScreen(SCREEN_HTML);
  assertNoInlineCode(screen);

  // 비밀번호와 세션 정보를 스크립트가 읽을 수 있는 저장소에 두지 않는다.
  for (const file of [SCREEN_SCRIPT, TOP_BAR_SCRIPT]) {
    assert.doesNotMatch(screen.scripts.get(file), SCRIPT_STORAGE, `web/${file} uses script-readable storage`);
  }
});

test('S-02의 HTML은 입력칸마다 label, 버튼마다 이름, lang과 h1 하나가 있다', () => {
  const screen = readScreen(SCREEN_HTML);
  assertLabelsAndNames(screen);
  assertLanguageAndHeading(screen);

  // 입력칸은 비밀번호 하나이고 보이는 라벨이 login.password다.
  const input = onlyTag(screen, 'input');
  assert.equal(input.attributes.get('type'), 'password');
  assert.equal(input.attributes.get('autocomplete'), 'current-password');
  const label = onlyTag(screen, 'label');
  assert.equal(label.attributes.get('for'), input.attributes.get('id'));
  assert.equal(label.attributes.get('data-text'), 'login.password');

  // 필수 표시는 글자이고 입력칸에 이어져 있다.
  const requiredMark = screen.tags.find((tag) => tag.attributes.get('data-text') === 'mark.required');
  assert.ok(requiredMark !== undefined, 'no required mark');
  assert.ok(
    (input.attributes.get('aria-describedby') ?? '').split(/\s+/).includes(requiredMark.attributes.get('id')),
    'the required mark is not tied to the input',
  );

  // 브라우저의 기본 검증 풍선은 사전 밖의 글자다. 폼은 novalidate이고 길이와 필수 속성을 두지 않는다.
  assert.ok(onlyTag(screen, 'form').attributes.has('novalidate'), 'the form has no novalidate');
  for (const banned of ['maxlength', 'minlength', 'min', 'max', 'pattern', 'required']) {
    assert.ok(!input.attributes.has(banned), `the password input has the ${banned} attribute`);
  }

  // 오류와 알림을 알리는 자리: 폼 위 오류 띠는 alert, 로그아웃 알림은 status.
  const roles = screen.tags.map((tag) => tag.attributes.get('role'));
  assert.ok(roles.includes('alert'), 'no error band with role="alert"');
  assert.ok(roles.includes('status'), 'no notice with role="status"');
});
