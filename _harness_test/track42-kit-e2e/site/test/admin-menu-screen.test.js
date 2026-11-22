// S-04 메뉴 관리 화면의 정적 계약 시험.
// 화면의 파일(HTML, 그 화면의 스크립트, 스크립트가 가져오는 web/의 파일)을 글자로 읽어
// 계약의 글자를 담고 있는지 본다. 파일이 없으면 읽기에서 실패한다.
// 버튼이 실제로 그 API를 부르는지와 화면이 그려지는지는 브라우저 확인이 본다.
// 기대값의 출처: 화면 기획 1.3절(부르는 API), 3.4절(구역, 상태, 입력칸, 버튼), 7.2절(Tab 순서),
// 7.3절(확인 창), 7.4절(라벨), 소스 기획 2-2절(경로와 메서드), 2-8절(입력칸의 속성).

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

const SCREEN_HTML = 'admin-menu.html';
const SCREEN_SCRIPT = 'admin-menu.js';
const TOP_BAR_SCRIPT = 'admin-top-bar.js';

// 소스 기획 2-2절. A-07 GET과 A-08 POST는 같은 경로, A-09 PUT과 A-10 DELETE는 같은 경로다.
const MENU_API = '/api/admin/menu';
const MENU_ITEM_API = '/api/admin/menu/{id}';
const MENU_ORDER_API = '/api/admin/menu-order';
const LOGOUT_API = '/api/admin/logout';
const SESSION_API = '/api/admin/session';
const MENU_METHODS = ['GET', 'POST', 'PUT', 'DELETE'];

// 3.4절의 버튼 표: 행 버튼의 동작, 문구 키, 읽는 이름의 키. 문서 순서가 7.2절의 Tab 순서다.
const ROW_BUTTONS = [
  { action: 'sale', textKey: 'button.soldout', nameKey: 'menu.aria.soldout' },
  { action: 'sale', textKey: 'button.onsale', nameKey: 'menu.aria.onsale' },
  { action: 'up', textKey: 'button.up', nameKey: 'menu.aria.up' },
  { action: 'down', textKey: 'button.down', nameKey: 'menu.aria.down' },
  { action: 'edit', textKey: 'button.edit', nameKey: 'menu.aria.edit' },
  { action: 'delete', textKey: 'button.delete', nameKey: 'menu.aria.delete' },
];
// 3.4절의 버튼 표에서 행 버튼 밖의 것. notice.saving은 요청 중인 «저장»의 문구다.
const OTHER_BUTTON_KEYS = ['nav.skip', 'tip.aria', 'button.add', 'button.save', 'notice.saving', 'button.cancel', 'button.retry'];
// 위쪽 줄의 키는 위쪽 줄 스크립트가 담는다(1.4절).
const TOP_BAR_KEYS = ['nav.home', 'button.logout', 'title.hours', 'title.menu', 'nav.admin'];

// 3.4절의 입력칸 표: 칸의 이름(JSON 필드 이름), 라벨 키, 풍선말 키, 규칙 함수가 주는 오류 문구 키.
const FIELDS = [
  { field: 'name', labelKey: 'menu.name', tipKey: 'tip.menu.name', errorKeys: ['error.menu.name.required', 'error.menu.name.length'] },
  { field: 'price_krw', labelKey: 'menu.price', tipKey: 'tip.menu.price', errorKeys: ['error.menu.price.required', 'error.menu.price.range'] },
  { field: 'category', labelKey: 'menu.category', tipKey: 'tip.menu.category', errorKeys: ['error.menu.category.required'] },
];
// 3.4절의 구역 표와 상태 표의 키 가운데 서버가 text_key로 내려 주지 않는 것.
// error.network는 화면(api-client)이 판단하고, price.format은 가격 표시가 쓴다.
const SCREEN_TEXT_KEYS = [
  'title.menu',
  'menu.add',
  'menu.list',
  'menu.unit',
  'menu.choose',
  'menu.empty',
  'mark.required',
  'sale.onsale',
  'sale.soldout',
  'price.format',
  'notice.loading',
  'notice.added',
  'notice.saved',
  'notice.deleted',
  'confirm.delete.title',
  'confirm.delete.body',
  'error.network',
];
// 서버가 응답의 text_key로 내려 주는 것. 화면의 파일이 이 글자를 스스로 담으면 서버의 판정을 따르지 않는 것이다.
const SERVER_ONLY_KEYS = ['error.menu.limit', 'error.menu.missing', 'error.menu.order', 'error.form.expired', 'error.session.expired'];
const CATEGORY_KEY = /['"`]category\.[a-z]+['"`]/;

// 소스 기획 2-8절: 어느 입력칸에도 두지 않는 속성.
const BANNED_CONTROL_ATTRIBUTES = ['maxlength', 'minlength', 'min', 'max', 'pattern', 'required', 'step'];
// 스크립트가 읽을 수 있는 저장소. CSRF 토큰과 세션 정보를 두지 않는다.
const SCRIPT_STORAGE = /\b(?:localStorage|sessionStorage|indexedDB)\b|\bdocument\s*\.\s*cookie\b/;

const hasLiteral = (source, literal) => source.includes(`'${literal}'`) || source.includes(`"${literal}"`);
const describedBy = (tag) => (tag.attributes.get('aria-describedby') ?? '').split(/\s+/).filter(Boolean);

function tagsNamed(screen, name) {
  return screen.tags.filter((tag) => tag.name === name);
}

function onlyTag(screen, name) {
  const found = tagsNamed(screen, name);
  assert.equal(found.length, 1, `web/${SCREEN_HTML} must have exactly one <${name}>`);
  return found[0];
}

function tagWithId(screen, id) {
  const found = screen.tags.filter((tag) => tag.attributes.get('id') === id);
  assert.equal(found.length, 1, `web/${SCREEN_HTML} must have exactly one element with id="${id}"`);
  return found[0];
}

/** 여는 태그와 그 닫는 태그 사이의 여는 태그들. 같은 이름의 요소가 겹쳐 있지 않은 요소에만 쓴다. */
function tagsInside(screen, tag) {
  const close = screen.html.indexOf(`</${tag.name}`, tag.end);
  assert.ok(close !== -1, `web/${SCREEN_HTML} has a <${tag.name}> that is never closed`);
  return screen.tags.filter((other) => other.end > tag.end && other.end <= close);
}

/** 추가 폼과 수정 폼. 수정 폼은 행을 수정 상태로 바꿀 때 복제하는 template 안에 있다. */
function menuForms(screen) {
  const forms = tagsNamed(screen, 'form');
  assert.equal(forms.length, 2, `web/${SCREEN_HTML} must have the add form and the edit form`);
  const edit = forms.filter((form) => form.attributes.has('data-row-edit'));
  const add = forms.filter((form) => !form.attributes.has('data-row-edit'));
  assert.equal(edit.length, 1, 'exactly one form is the edit state of a row');
  return { add: add[0], edit: edit[0] };
}

test('S-04 스크립트가 A-07, A-08, A-09, A-10, A-11 경로를 가리키고 위쪽 줄 스크립트를 가져온다', () => {
  const screen = readScreen(SCREEN_HTML);
  assert.deepEqual(screen.entryScripts, [SCREEN_SCRIPT]);
  for (const file of [TOP_BAR_SCRIPT, 'api-client.js', 'input-rules.js', 'screen-feedback.js', 'text-dictionary.js']) {
    assertImports(screen, file);
  }

  // 화면의 스크립트가 스스로 가리키는 API는 메뉴의 세 경로가 전부다. 다섯 API가 이 세 경로와 네 메서드를 쓴다.
  const script = screen.scripts.get(SCREEN_SCRIPT);
  assertApiPaths(screen, [MENU_API, MENU_ITEM_API, MENU_ORDER_API], { file: SCREEN_SCRIPT });
  assert.deepEqual(apiPathsIn(script).sort(), [MENU_API, MENU_ITEM_API, MENU_ORDER_API].sort(), `web/${SCREEN_SCRIPT} names an API outside A-07 to A-11`);
  for (const method of MENU_METHODS) assert.ok(hasLiteral(script, method), `web/${SCREEN_SCRIPT} never sends ${method}`);

  // 세션 확인(A-04)과 로그아웃(A-03)은 위쪽 줄 스크립트가 부른다. 화면은 그 스크립트의 함수로 위쪽 줄을 연다.
  assertApiPaths(screen, [LOGOUT_API, SESSION_API], { file: TOP_BAR_SCRIPT });
  assert.match(script, /\bstartAdminTopBar\s*\(/, `web/${SCREEN_SCRIPT} does not start the top bar`);
  const topBar = onlyTag(screen, 'header');
  assert.ok(topBar.attributes.has('data-admin-top-bar'), 'the header is not the place of the admin top bar');

  // 화면 전체가 가리키는 API는 1.3절의 일곱 개(A-03, A-04, A-07부터 A-11)의 다섯 경로가 전부다.
  const named = new Set([...screen.scripts.values()].flatMap(apiPathsIn));
  assert.deepEqual([...named].sort(), [MENU_API, MENU_ITEM_API, MENU_ORDER_API, LOGOUT_API, SESSION_API].sort());
});

test('S-04의 버튼과 문구 키가 화면 파일과 사전에 있다', () => {
  const screen = readScreen(SCREEN_HTML);
  const script = screen.scripts.get(SCREEN_SCRIPT);
  assertTextKeys(screen, [
    ...ROW_BUTTONS.flatMap((button) => [button.textKey, button.nameKey]),
    ...OTHER_BUTTON_KEYS,
    ...TOP_BAR_KEYS,
    ...FIELDS.flatMap((field) => [field.labelKey, field.tipKey, ...field.errorKeys]),
    ...SCREEN_TEXT_KEYS,
  ]);

  // 문서 제목은 서버가 사전 글자로 바꾸는 자리이고 제목 1단계와 같은 키다. 건너뛰기 링크는 제목으로 간다.
  assert.match(screen.html, /<title>\{\{text:title\.menu\}\}<\/title>/);
  const title = onlyTag(screen, 'h1');
  assert.equal(title.attributes.get('data-text'), 'title.menu');
  const skipLink = tagsNamed(screen, 'a').find((tag) => tag.attributes.get('data-text') === 'nav.skip');
  assert.ok(skipLink !== undefined, 'no skip link');
  assert.equal(skipLink.attributes.get('href'), `#${title.attributes.get('id')}`, 'the skip link goes to the title');

  // 구역 제목 둘.
  assert.deepEqual(tagsNamed(screen, 'h2').map((tag) => tag.attributes.get('data-text')).slice(0, 2), ['menu.add', 'menu.list']);

  // 행 버튼: 문서 순서가 품절 버튼, 위로, 아래로, 수정, 삭제이고 저마다 문구 키와 메뉴 이름이 붙는 읽는 이름의 키가 있다.
  const rowButtons = tagsNamed(screen, 'button').filter((tag) => tag.attributes.has('data-action'));
  assert.deepEqual(
    rowButtons.map((tag) => ({
      action: tag.attributes.get('data-action'),
      textKey: tag.attributes.get('data-text'),
      nameKey: tag.attributes.get('data-text-aria'),
    })),
    ROW_BUTTONS,
  );
  for (const { nameKey } of ROW_BUTTONS) assert.ok(screen.dictionary[nameKey].includes('{name}'), `${nameKey} does not carry the menu name`);
  for (const tag of rowButtons) assert.equal(tag.attributes.get('type'), 'button', `the ${tag.attributes.get('data-text')} button would submit a form`);
  const deleteButton = rowButtons.at(-1);
  assert.match(deleteButton.attributes.get('class'), /\bbutton-danger\b/, 'the delete button of a row is not the delete button component');

  // 품절 버튼 둘은 저마다 바꿀 판매 상태를 들고, 상태 표지 둘은 저마다 자기 상태의 문구를 담는다.
  assert.deepEqual(rowButtons.filter((tag) => tag.attributes.get('data-action') === 'sale').map((tag) => tag.attributes.get('data-sale-status')), ['sold_out', 'on_sale']);
  const badges = screen.tags.filter((tag) => tag.attributes.has('data-sale-badge'));
  assert.deepEqual(badges.map((tag) => tag.attributes.get('data-status')), ['on_sale', 'sold_out']);
  assert.deepEqual(badges.map((tag) => tagsInside(screen, tag).map((inner) => inner.attributes.get('data-text')).find(Boolean)), ['sale.onsale', 'sale.soldout']);

  // 폼의 버튼: 추가 폼은 «추가» 하나, 수정 폼은 «저장»과 «취소». 풍선말 단추는 추가 폼에만 있다.
  const { add, edit } = menuForms(screen);
  const buttonsOf = (form) => tagsInside(screen, form).filter((tag) => tag.name === 'button');
  const submitKeys = (form) => buttonsOf(form).filter((tag) => tag.attributes.get('type') === 'submit').map((tag) => tag.attributes.get('data-text'));
  assert.deepEqual(submitKeys(add), ['button.add']);
  assert.deepEqual(submitKeys(edit), ['button.save']);
  assert.deepEqual(buttonsOf(edit).map((tag) => tag.attributes.get('data-text')), ['button.save', 'button.cancel']);
  const tipButtons = buttonsOf(add).filter((tag) => tag.attributes.get('data-text-aria') === 'tip.aria');
  assert.deepEqual(tipButtons.map((tag) => tag.attributes.get('data-value-label')), FIELDS.map((field) => field.labelKey));
  assert.deepEqual(
    tipButtons.map((tag) => {
      const bubble = tagWithId(screen, describedBy(tag)[0]);
      assert.equal(bubble.attributes.get('role'), 'tooltip');
      return bubble.attributes.get('data-text');
    }),
    FIELDS.map((field) => field.tipKey),
  );
  assert.ok(!buttonsOf(edit).some((tag) => tag.attributes.has('data-text-aria')), 'the edit form has a tip button');

  // 확인 창: dialog 요소, 제목이 이름이고 본문이 설명이다. «취소»가 «삭제»보다 먼저다.
  const dialog = onlyTag(screen, 'dialog');
  assert.equal(tagWithId(screen, dialog.attributes.get('aria-labelledby')).attributes.get('data-text'), 'confirm.delete.title');
  tagWithId(screen, dialog.attributes.get('aria-describedby'));
  const dialogButtons = tagsInside(screen, dialog).filter((tag) => tag.name === 'button');
  assert.deepEqual(dialogButtons.map((tag) => tag.attributes.get('data-text')), ['button.cancel', 'button.delete']);
  assert.ok(dialogButtons[0].attributes.has('data-dialog-cancel'), 'the cancel button of the dialog is not marked');
  assert.match(dialogButtons[1].attributes.get('class'), /\bbutton-danger\b/);
  assert.ok(hasLiteral(script, 'confirm.delete.body'), `web/${SCREEN_SCRIPT} does not fill the dialog body`);

  // 불러오기 실패의 띠 안에 «다시 불러오기»가 있다.
  const retry = tagsNamed(screen, 'button').find((tag) => tag.attributes.get('data-text') === 'button.retry');
  assert.ok(retry !== undefined, 'no retry button');

  // 서버가 내려 주는 문구 키와 분류의 키는 화면이 스스로 담지 않는다.
  for (const key of SERVER_ONLY_KEYS) {
    assert.ok(Object.hasOwn(screen.dictionary, key), `${key} is not in the dictionary`);
    assert.ok(!hasLiteral(script, key) && !screen.html.includes(key), `web/${SCREEN_HTML} or its script names ${key} itself`);
  }
  assert.doesNotMatch(script, CATEGORY_KEY, `web/${SCREEN_SCRIPT} names a category key itself`);
  assert.doesNotMatch(screen.html, /category\.[a-z]+/, `web/${SCREEN_HTML} names a category key itself`);
});

test('S-04의 HTML에 인라인 스크립트, style 속성, on 속성이 없다', () => {
  const screen = readScreen(SCREEN_HTML);
  assertNoInlineCode(screen);

  // HTML은 tokens.css, screen.css와 자기 화면의 배치 파일만 건다.
  const sheets = tagsNamed(screen, 'link').filter((tag) => tag.attributes.get('rel') === 'stylesheet').map((tag) => tag.attributes.get('href'));
  assert.deepEqual(sheets, ['/tokens.css', '/screen.css', '/admin-menu.css']);

  // CSRF 토큰과 세션 정보를 스크립트가 읽을 수 있는 저장소에 두지 않는다.
  for (const file of [SCREEN_SCRIPT, TOP_BAR_SCRIPT, 'api-client.js']) {
    assert.doesNotMatch(screen.scripts.get(file), SCRIPT_STORAGE, `web/${file} uses script-readable storage`);
  }
});

test('S-04의 HTML은 입력칸마다 label, 버튼마다 이름, lang과 h1 하나가 있다', () => {
  const screen = readScreen(SCREEN_HTML);
  assertLabelsAndNames(screen);
  assertLanguageAndHeading(screen);

  const labels = tagsNamed(screen, 'label');
  const { add, edit } = menuForms(screen);
  for (const [formName, form] of Object.entries({ add, edit })) {
    assert.ok(form.attributes.has('novalidate'), `the ${formName} form has no novalidate`);
    const inside = tagsInside(screen, form);
    const controls = inside.filter((tag) => ['input', 'select', 'textarea'].includes(tag.name));

    // 입력칸은 이름, 가격, 분류 셋이고 이 순서다.
    assert.deepEqual(controls.map((tag) => tag.attributes.get('data-field')), FIELDS.map((field) => field.field), `the controls of the ${formName} form`);

    for (const [index, { field, labelKey }] of FIELDS.entries()) {
      const control = controls[index];
      const id = control.attributes.get('id');

      // 눈에 보이는 라벨이 그 입력칸에 이어져 있다.
      const label = labels.filter((tag) => tag.attributes.get('for') === id);
      assert.equal(label.length, 1, `the ${field} control of the ${formName} form needs exactly one label`);
      assert.equal(label[0].attributes.get('data-text'), labelKey);

      // 필수 표시는 글자이고 입력칸에 이어져 있다.
      const described = describedBy(control).map((describedId) => tagWithId(screen, describedId));
      assert.ok(described.some((tag) => tag.attributes.get('data-text') === 'mark.required'), `the required mark is not tied to the ${field} control of the ${formName} form`);

      // 오류 줄은 칸마다 하나이고 id가 있어 입력칸이 가리킬 수 있다.
      const errorLines = inside.filter((tag) => tag.attributes.get('data-field-error') === field);
      assert.equal(errorLines.length, 1, `the ${field} control of the ${formName} form needs exactly one error line`);
      assert.ok(errorLines[0].attributes.has('id') && errorLines[0].attributes.has('hidden'), 'an error line needs an id and starts hidden');

      for (const banned of BANNED_CONTROL_ATTRIBUTES) {
        assert.ok(!control.attributes.has(banned), `the ${field} control of the ${formName} form has the ${banned} attribute`);
      }
    }

    // 소스 기획 2-8절: 이름은 text, 가격은 text와 numeric, 분류는 select이고 첫 항목은 값이 빈 menu.choose다.
    const [name, price, category] = controls;
    assert.equal(name.name, 'input');
    assert.equal(name.attributes.get('type'), 'text');
    assert.ok(!name.attributes.has('inputmode'), 'the name control has an inputmode');
    assert.equal(price.name, 'input');
    assert.equal(price.attributes.get('type'), 'text');
    assert.equal(price.attributes.get('inputmode'), 'numeric');
    assert.equal(category.name, 'select');
    const options = tagsInside(screen, category).filter((tag) => tag.name === 'option');
    assert.equal(options.length, 1, 'the category options besides the first come from the response');
    assert.equal(options[0].attributes.get('value'), '');
    assert.equal(options[0].attributes.get('data-text'), 'menu.choose');

    // 가격의 단위는 설명으로 이어져 있다.
    const priceDescriptions = describedBy(price).map((describedId) => tagWithId(screen, describedId));
    assert.ok(priceDescriptions.some((tag) => tag.attributes.get('data-text') === 'menu.unit'), `the unit is not tied to the price control of the ${formName} form`);
  }

  // 화면의 입력칸은 두 폼의 여섯 개가 전부다. 자리 표시 글을 라벨 대신 쓰지 않는다.
  const allControls = screen.tags.filter((tag) => ['input', 'select', 'textarea'].includes(tag.name));
  assert.equal(allControls.length, FIELDS.length * 2);
  assert.ok(!allControls.some((tag) => tag.attributes.has('placeholder')), 'a control has a placeholder');

  // 알리는 자리: 저장 알림은 status, 불러오기 실패의 띠와 행 아래 오류 줄은 alert.
  assert.equal(tagWithId(screen, 'menu-notice').attributes.get('role'), 'status');
  assert.equal(tagWithId(screen, 'menu-error').attributes.get('role'), 'alert');
  const rowError = screen.tags.filter((tag) => tag.attributes.has('data-row-error'));
  assert.equal(rowError.length, 1, 'a menu row needs exactly one error line');
  assert.equal(rowError[0].attributes.get('role'), 'alert');

  // 메뉴는 ul과 li다. 되풀이되는 행은 template을 복제해 만든다.
  assert.equal(tagsNamed(screen, 'template').length, 3, 'the group, the row and the edit state are templates');
  assert.equal(tagsNamed(screen, 'ul').length, 1);
  const row = onlyTag(screen, 'li');
  assert.ok(row.attributes.has('data-menu-row'));
});
