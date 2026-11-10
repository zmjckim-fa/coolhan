# smow USM Haller 구성기 — D. UI · 문구 · 서버 흐름 · 장바구니 · 부품 목록 (읽기 전용 분석)

작성: 2026-11-04. 대상: 공개 JS/CSS/데이터 구조 읽기. 코드 실행 없음. smow의 코드·문구·이미지는 우리 제품에 쓰지 않는다(아래는 구조와 항목 이름 중심).

## 0. 읽는 법

**증거 등급**: SOURCE = 코드에서 직접 확인(줄 번호 병기) / PARTIAL = 일부만 확인 / GUESS = 추정(등급 없는 항목도 GUESS).

**파일 약칭** (모두 `scratchpad/smow-src/` 아래)

| 약칭 | 파일 | 내용 |
|---|---|---|
| A | pretty/14xezdwz4pjta.js | 화면 제어·서버 호출·가격 계산·3D 본체(three.js 포함, 줄 번호는 pretty 기준) |
| B | pretty/0pv910lfhfhfu.js | React UI 조각(탭, 선택기, 목록 표, 대화상자). 문구는 next-intl 키로만 참조 |
| C | pretty/13lzs0_g8pri-.js | 금고 변형 로드, 색 목록, 스토어(요약·빠른색) |
| D | pretty/0sqfjbgv28kbx.js | 상수(InfoType, TooltipDelay, 쿠키 이름 등), 쿠키 도구, 로거 |
| E | chunks/3p11p_en8-nqc.js (한 줄 압축본) | 쿠키 동의 모듈 |

**전체 구조 한 줄 요약** (SOURCE): 화면 = 서버가 그린 껍데기(헤더·가격·납기·버튼 DOM, `getElementById`로 참조) + React 조각(오른쪽 패널·대화상자·목록) + three.js 캔버스(`mainCanvas`) + "레거시" 제어 코드(A). 레거시 코드는 `window.*` 함수와 `CustomEvent`로 React와 통신한다(`usm:state-change`, `update-configurator-settings`, `configurator-settings-changed`, `usm:legacy-ready`). 가격·부품 목록은 **브라우저에서 계산**한다(A 22416~22906).

---

## 1. 화면 구조

### 1.1 영역 배치

| 영역 | 확인된 id/요소 | 비고 | 등급 |
|---|---|---|---|
| 상단 헤더 | `header`, `btnLogo`, `btnCloseWindow`, 도움말 메뉴(`btnHelp`) | 모바일에서 `navbar-toggle`(햄버거)로 접힘(B 5009~5040). 헤더 id 접근: A 38820대 | SOURCE |
| 왼쪽 3D 영역 | `contentLeft` > `sceneNew`(캔버스 `mainCanvas`), `areaNew`, `areaBin`(삭제 구역), `touchDiv` | 컨텍스트 메뉴 3종(`sceneLeftContext`, `sceneLeftDeleteContext`, `sceneLeftEditContext`) — 우클릭 기본 메뉴는 막되 Ctrl+우클릭은 허용(A 38815~) | SOURCE |
| 오른쪽 패널 | `contentRight` (탭 3개) | 고정 폭 flex: 767px 이하 230px(실제로는 아래 오버레이로 대체), 768~991px 300px, 992px 이상 420px (CSS `40cbh3s…css`) | SOURCE |
| 가격·납기 | `lbPrice`(가격), `lbVatInfo`(부가세 문구), `deliveryTime`(납기), 조립비 안내 버튼(React, `setAssemblyHint`) | 마크업 자체는 서버 HTML이라 이 번들에 없음 | PARTIAL |
| 장바구니 | `btnBasket` | 서버 HTML. 활성/비활성은 A에서 제어(§4.5) | PARTIAL |
| 숨은 폼 | `articleDataForm` (`artNum`, `amount`, `cnid`, `csrfToken`) | 장바구니 제출용(§3.4) | SOURCE |
| 인쇄용 | `printIframe`, `printConfig` | §5 | SOURCE |
| 화면 위 오버레이 버튼 | `btnDoor`(문 열기/닫기, `aria-pressed`), `btnFullScreenToggle`, `btnBack`/`btnForward`(되돌리기/다시), `btnZoomIn/Out`, `btnMoveLeft/Right`, `btnPos1`(시점 초기화), `btnInfo`(치수 표시), `btnSidebarCollapse`(패널 접기, 데스크톱만) | 라벨은 서버가 prop으로 전달(번들에 문구 없음) | SOURCE (B 1040~1300, A 38840~) |
| 불러오기/저장 | `loadMenu` 및 슬롯 대화상자(3열 격자 × 9칸, 칸 높이 90px) | 슬롯 id `slot1~9`(저장), `slotL1~9`(불러오기) | SOURCE (B 5190~5290) |
| 숨은 개발자 패널 | `groupArticleList`, `groupArticleConfig` | Ctrl/Shift+S, Ctrl/Shift+K로 표시. 고객용 아님 | SOURCE (A 24272~) |

### 1.2 오른쪽 패널 — 탭 3개 (SOURCE, B 8050~8250)

탭 값/라벨 키: `shelf` = `tabShelf`(REGAL), `accessories` = `tabAccessories`(짧은) / `tabAccessoriesLong`(긴, FACH & ZUBEHÖR), `color` = `tabColor`(FARBE). 세 탭 내용은 모두 `forceMount`(항상 DOM에 유지, 비활성은 `hidden`만) → 입력값·스크롤 보존. 폭 `@container tabs`: 독일어는 17.5rem 이상, 그 외 언어는 22rem 이상에서 긴 라벨.

탭 동작 연동(SOURCE B 8070~8180):
- 부품/선반 탭(`accessories`)으로 갈 때 `window.selectEditElement()` 호출 → 결과 `selected`(마지막 놓은 요소를 편집 선택) / `empty`(안내 문구 `accessoriesEmpty` + 갤러리로 이동 링크 `accessoriesToGallery`) / `busy`(드래그 등 진행 중, 상태가 DEFAULT_IDLE로 돌아오면 재시도).
- 3D에서 요소를 편집 상태(EDIT_IDLE)로 들어가면 자동으로 `accessories` 탭, DEFAULT_IDLE로 돌아오면 `shelf` 탭으로 복귀.
- 다른 탭으로 나갈 때 `window.stopEditElement()`.

| 탭 | 컨트롤 | 옵션 값 | 등급 |
|---|---|---|---|
| REGAL (`shelf`) | ① 폭 선택, 높이 선택(2열 격자, 높이 옵션은 선택한 폭에 없는 값이면 `disabled`) ② 선반 갤러리(요소 썸네일, 드래그해서 캔버스에 놓기, 로딩 중 스피너) ③ 깊이 선택 ④ 받침(발) 선택 | 폭 75/50/35, 높이 35/25/17.5 (데이터 파일 `35-23.json` 키 `폭-높이-유형`에서 추출). 깊이 25/35/50 cm (25cm는 `smallDepthDisabled` 조건에서 비활성+사유 문구). 발: 20(조절발) / 40(바퀴 단단) / 50(바퀴 부드러움), 바퀴는 높이 > 50cm이면 `castorsDisabled`로 비활성+사유 문구. 각 옵션에 설명(`DEPTH_{n}_TOOLTIP`, `FEET_{id}_TOOLTIP_1`) | SOURCE (B 5558~5730, 7660~7730) |
| FACH & ZUBEHÖR (`accessories`) | 편집 중인 칸 하나에 대해: ⓐ 구성 유형 7종 라디오(썸네일 3열 격자) ⓑ 장비 체크박스 3종(`cbEquipmentLock` 손잡이 자물쇠, `cbEquipmentPanel` 중간 선반, `cbEquipmentSafe` 금고) + 정보 아이콘(Popover) ⓒ 케이블 구멍 선택(조건부) ⓓ 금고 설정(금고 선택 시: 색 선택, 잠금 방식 선택) | 구성 유형: 뒷판 없음(0)/뒷판(1)/아래로 여는 문(2)/인출문(3)/인출문+서랍(4)/옆·뒷판 없음(5)/벽 없음(6). 3·4는 `extensionDoorAvailable`일 때만 표시. 케이블 구멍: 없음 + 3×3 위치(top/middle/bottom × left/middle/right), 중앙 줄은 `cutoutMidDisabled`면 비활성. 금고: 깊이 35/50만, 색 15종, 잠금 `electronic`/`key` | SOURCE (B 7200~7660) |
| FARBE (`color`) | 색 견본 15개(36×36px 칸, 선택 시 테두리 강조), 호버 시 150×150 이미지+색 이름+"빠름" 표시, 아래 선택된 색 이름과 빠름/보통 상태, 범례 | 색 ID 22~36(예: 24 순백, 29 연회색, 30 흑연, 33 안트라사이트, 35 매트 실버…). 정렬은 화면 순서(흰→회→검→청→녹→황→주→적→갈→베이지)로 별도 배열. 칸 우하단 녹색 점 = 빠른 납기 가능 색 | SOURCE (B 5440~5540, C 800~) |

빠른 납기 표시 조건: `fastColors`가 `null`이면 빠름/보통 표시 자체를 숨김(재고 정보 없음, 가격 0, 또는 인출문 구성처럼 항상 주문제작인 경우)(§4.4).

### 1.3 편집 상태 / 전역 상태값 (SOURCE, D 상수 `State`)

`DEFAULT_IDLE 10`, `DEFAULT_MOVE_CAMERA 11`, `DEFAULT_MOVE_OBJECT 12`, `DEFAULT_ADD_ELEMENT 13`, `DEFAULT_ADD_CLICK_ELEMENT 14`, `EDIT_IDLE 20`, `EDIT_MOVE_CAMERA 31`, `EDIT_MOVE_OBJECT 32`, `EDIT_ADD_ELEMENT 33`, `EDIT_MOVE_CLICK 34`, `ANIMATE_SCENE 5`. 상태가 바뀔 때마다 `usm:state-change` 이벤트(`detail.state`, `viaSidebar`, `viaLongPress`)를 발행해 React가 탭·모바일 패널을 맞춘다(A 25146).

### 1.4 반응형 (SOURCE)

| 폭 | 동작 | 근거 |
|---|---|---|
| ≥ 992px | 오른쪽 패널 420px 고정 | CSS |
| 768~991px | 300px | CSS |
| ≤ 767px | 패널이 **오른쪽에서 밀려 나오는 시트**로 전환: `position:fixed`, 폭 `min(85vw,360px)`, `transform:translate(100%)`→`.is-open`에서 0, 그림자, `safe-area-inset-bottom` 반영. 헤더 오른쪽 버튼(`faSidebarFlip`)으로 열고 닫음. 편집 상태 진입(EDIT_IDLE, 긴 눌림 제외)이면 자동 열림, 추가/이동/기본 대기(10·13·14·33)이면 자동 닫힘. 시트 바깥 터치로 닫힘(드롭다운·툴팁 영역 제외) | B 5081~5230 |
| ≤ 934px | 헤더가 햄버거 메뉴(`navbar-collapse`, 최대높이 340px)로 접힘. 메뉴와 시트는 서로 열면 상대가 닫힘(`usm:mobile-overlay-open`) | B 5009, CSS |
| 높이 ≤ 515px | 패널 안 구분선(`hr`) 숨김 | B 7740, CSS |
| 좁은 가로 모바일 | `@media (max-device-width:480px) and (orientation:landscape)` 별도 규칙 | CSS |
| 데스크톱 전용 | 패널 접기 버튼(`btnSidebarCollapse`, `max-md:hidden`), 접으면 `resize` 이벤트 발행해 캔버스 재계산 | B 1230~1280 |
| 모바일 첫 사용 | 최초 1회 시트 버튼에 말풍선(`usm:sidebar-hint-seen`, 쿠키 동의 후에만) | B 5095~5150 |

캔버스 크기: `updateCanvasSize`가 100ms 디바운스로 재계산, 편집 중이면 카메라 재배치(A 38760~).

### 1.5 도움말(InfoType) · 툴팁(TooltipDelay) · 알림(notify)

**InfoType** (비트 플래그, D 상수): HELP 1, ARTICLE 2, NAV 4, LOAD_SAVE 8, ADD 16, EDIT 32, EDIT_NAV 64, EDIT_CONFIG 128, DELETE 256, ADD_HANDLING 512, CLOSE_INFO 1024, LONG_PRESS 2048.
- 이미 본 안내는 비트 OR로 `localStorage["usm.dismissedIntros"]`에 정수 저장(A 20111~20125). 예전 쿠키 `configOptions.info`(2진 문자열)는 읽기만 하는 호환 경로(A 20132).
- 각 안내는 큐(`oM`)에 넣고 **700ms 간격 루프**로 한 번에 하나만 표시, 정해진 상태(`forState`)일 때만 실행, 상태가 바뀌면 숨김. 표시 시간은 20~35초(항목별), 대상 요소 id를 지정(예: HELP→`btnHelp`, ARTICLE→`btnShelfList`, ADD→`shelfGallery`, EDIT_CONFIG→`cbNoPanel`, DELETE→`areaBinLink`). 기본 트리거는 click, 위치는 항목별 left/right/bottom. `InfoDelay` = 표시 500ms / 숨김 100ms. (SOURCE A 20056~20400)
- 쿠키 동의가 없으면 동의 이벤트(`consentUpdated`)를 기다렸다가 표시(A 20085~20110).
- 첫 도움말(HELP)을 보여준 뒤 `InfoDelay`형 popover를 `TooltipDelay`형 tooltip으로 교체(A 20130~).

**TooltipDelay** = 표시 650ms / 숨김 50ms (D 상수). 자체 구현 popover/tooltip 클래스(`oC`): 트리거 `click`/`hover`/`manual`, 위치 top/bottom/left/right, 화면 밖으로 나가면 8px 여백 안으로 보정 + 화살표 위치 보정, `role="tooltip"`, `html:true`면 innerHTML (A 19838~20000). 새 React 쪽은 Radix Popover/Tooltip 사용(B 5590~5620, 3820~).

**notify(알림)** (SOURCE A 441~446): 구현은 `window.showToast(e)` 호출뿐이고(함수가 있을 때만) 토스트 UI 자체는 서버 페이지에 있음. 인자 `{title, text, type, hide?}`; `hide:false`는 닫히지 않는 알림(계산 오류용). 문구는 `Messages.*` = `{H, M, T}`(제목/본문/종류).

`Messages` 키 (A 23138~, 36775~, 36936, 38605): ConfigurationErrorGeneral, ConfigurationLoad, JsonPDepth, JsonPNoConfig, JsonPValid, ShelfExtensionDoorLimit, ShelfFeetConfigError, ShelfMove, ShelfMoveMiddle, ShelfMoveNoTarget, ShelfPlAir, ShelfPlConnect, ShelfPlMismatchL, ShelfPlMismatchR, ShelfRemove, ShelfRemoveMiddle, CalculationError. → 이동·삭제가 구조상 불가능한 이유(위가 비어 있음, 연결 불가, 좌우 불일치 등)를 알림으로 알려주는 규칙이 많다. 우리도 "왜 안 되는지" 문구 키를 규칙별로 둘 것.

**대화상자** (React, B): 닫기/종료 확인(`closeTitle/closeText/abort/close`, 첫 닫기 때만 확인 = InfoType.CLOSE_INFO), 저장 덮어쓰기 확인(`saveDialogTitle/Text/saveOkBtn`), 불러오기 확인(`loadDialogTitle/Text/load`), 초기화 확인(`resetTitle/Text/resetOkBtn`), 법적 고지(`legalTitle`, de/en/fr 별도 HTML), 공유 링크(`shareTitle/shareText/clipboard/clipboardSuccess`), 소개 8단계(`IntroDialog.step1~8.{title,text,image}`), 지원(`SupportDialog.title,text1~3,emailSubject,button`). 모든 대화상자는 Radix(포커스 가둠, 외부 `aria-hidden`, 닫기 버튼 sr-only 라벨).

---

## 2. 문구 체계

### 2.1 두 갈래 (SOURCE)

| 갈래 | 방식 | 대상 |
|---|---|---|
| 새 UI | next-intl `useTranslations(네임스페이스)` | 아래 표. 문구 값은 서버가 내려주며 번들에는 키만 있음 |
| 레거시 | 서버가 페이지에 `window.__USM_LEGACY__ = { lang, literals }` 주입 (A 319~321). `literals` 문자열의 `\n`을 `<br>`로 치환해 `Q` 객체로 보관 | 3D 쪽 안내·오류·인쇄·장바구니·납기 문구 |
| 코드 내장 표 | 부품 이름·색 이름·유형 이름이 코드 안 객체(`ld`/`lf`/`lp` = de/fr/en 부품 설명, `lo`/`lh`/`ll` = de/fr/en 색 이름) | 부품 목록 표시용(A 21537~22105) |

언어 선택(A 22416~): `lang === "de"` → 독일어 표, `"fr"` → 프랑스어, **그 외 전부 영어**. 법적 고지·반환 URL도 de/en/fr 세 갈래. → 지원 언어 = **de, en, fr** (SOURCE). 숫자·통화 로캘은 별도(§2.3).

### 2.2 문구 키 이름 (키만)

**next-intl 네임스페이스와 키** (SOURCE, B 키 추출)
- `MainPage`: closeTitle, closeText, abort, close, shareTitle, shareText, clipboard, clipboardSuccess, previousSlide, nextSlide, helpText, btnPopupHelp, tooltip_legalOpen, licenseFloorText, legalTitle, loadDialogTitle, loadDialogText, load, resetTitle, resetText, resetOkBtn, saveDialogTitle, saveDialogText, saveOkBtn, balzSafeHeading, equipmentSafeLabel, tooltip_equipmentSafeLabel, balzSafeInfoLink, balzSafeColorLabel, balzSafeLockLabel, balzSafeLockElectronic, balzSafeLockKey, editHeaderCutOut, editHeaderCutOutSp, tooltip_editHeaderConfig, editHeaderConfig, sizeWidth, sizeHeight, empty, accessoriesEmpty, accessoriesSelect, accessoriesToGallery, accessories, shelf, tabShelf, tabAccessories, tabAccessoriesLong, tabColor, cbCo{Tl,Tm,Tr,Ml,Mm,Mr,Bl,Bm,Br}Label, without
- `IntroDialog`: step1~step8 각 `.title/.text/.image`, button
- `SupportDialog`: title, text1, text2, emailSubject, text3, button
- `Global`: usmServicePhone, usmServiceEmail, `COLOR_{id}`, `DEPTH_{25|35|50}_TOOLTIP`, `FEET_{20|40|50}`, `FEET_{id}_TOOLTIP_1`
- `ArticleList`: quantity, articleNumber, articleName, articlePrice, articleTotal, articleWeight, articleVolume, articleVolumeUnit
- `ShelfList`: shelfRow, shelfElement, currencyChf, currencyEur, dimensionUnit, width, height, depth, accessories, anchoringSet, desc1, desc2, weightDesc, weightUnit, priceNet, priceGross
- `ColorChooser`: fast, notFast, fastLegend, info
- `DepthSelect`: smallDepthDisabled / `FeetSelect`: castorsDisabled

**레거시 `literals` 키** (코드에서 참조하는 것만, A 전역 grep)
- 오류: ERROR_CON_START, ERROR_CON_RUN, ERROR_CON_HIST, ERROR_CON_SAVE, ERROR_CON_API, CONFIRM_BASKET_ERROR
- 오버레이: BASKET_MESSAGE, SCREENSHOT_MESSAGE
- 안내: INTRO_T, INFO_HELP, INFO_ARTICLE, INFO_NAV, INFO_LOAD_SAVE, INFO_ADD, INFO_ADD_HANDLING, INFO_EDIT, INFO_EDIT_NAV, INFO_EDIT_CONFIG, INFO_DELETE, INFO_LONG_PRESS, MOVE_HINT, DELETE_HINT, AC_HINT, AC_LOCK, AC_PANEL
- 가격·납기: CURRENCY_EUR, CURRENCY_CHF, `sumWithVat`, `sumWithoutVat`(둘 다 `$1` 자리표시자), DEL_TIME_NORMAL(`$1`=주 단위 범위), DEL_TIME_FAST, DEL_TIME_BALZ(`$1`), DEL_TIME_BALZ_FAST
- 조립비: ASSEMBLY_CHARGE, ASSEMBLY_CHARGE_INFO, ASSEMBLY_COST_WEIGHT(`%1 kg`,`%2 kg`), ASSEMBLY_COST_DIMENSION(`%1 cm`), ASSEMBLY_COMMON_HINT(`%1`)
- 치수·인쇄: DIMENSION_HEADING/WIDTH/HEIGHT/DEPTH/UNIT, WIDTH, HEIGHT, DEPTH, WEIGHT_UNIT, PRINT_TITLE, PRINT_H1~H4, SL_SHELF_ROW, SL_SHELF_ELEMENT, SL_DESC_1, SL_DESC_2, SL_WEIGHT_DESC, SL_PRICE_NET, SL_PRICE_GROSS, ACCESSORIES, ANCHORING_SET, AT_QUANTITY, AT_ARTICLE_NUMBER, AT_ARTICLE_NAME, AT_ARTICLE_PRICE, AT_ARTICLE_TOTAL, AT_ARTICLE_WEIGHT, AT_ARTICLE_VOLUME, AT_ARTICLE_VOLUME_DESC
- 선반 설명: SHELF_DESC_DEFAULT, SHELF_DESC_W_BP, SHELF_DESC_W_DD, SHELF_DESC_W_ED, SHELF_DESC_W_EDD, SHELF_DESC_5, SHELF_DESC_6
- 케이블 구멍: CUTOUT_WIDTH/HEIGTH(원문 철자)/RADIUS/OFFSET, POSITION
- `Messages.*` (§1.5)

**코드 내장 부품 표 키** (de/en/fr 동일 구조): AdjustableGlideNormal, AdjustableGlideSmall, Cutout, CutoutType{1,2,4,8,16,32,64,128,256}(위치 비트), HandleLock, HandleNormal, 0~6(구성 유형 이름), Width, Height, Depth, Unit, Incl, Panel, BalzSafe, BalzSafeArticle, BalzSafeLockElectronic, BalzSafeLockKey.
대표 값(독일어): 유형 1 = "Fach mit Rückwand", HandleNormal = "Griff", Unit = "cm".

### 2.3 숫자·통화 포맷 (K 함수, SOURCE A 291~308)

```
K(값, 형식, 로캘?) : 형식이 /^([np])(\d?)$/ 이면 Intl.NumberFormat(로캘, 소수자릿수=숫자(없으면 2))
                       p 접두어면 style:"percent". 형식이 안 맞으면 기본 NumberFormat.
기본 로캘 Y = "de-DE"; 시작 시 J(navigator.language)로 브라우저 언어로 교체.
```
- 사용 예: `"n"`(2자리), `"n1"`(치수 소수 1자리), `"n2"`(무게 kg), `"n3"`(부품표 무게·부피), `"p0"`(부가세율 0자리 백분율).
- **CHF는 항상 `de-CH` 로캘**(`Z.LanguageCodes.de_CH`)로 포맷하고 표기 순서가 다르다: EUR = `{숫자} €`(접미), CHF = `CHF {숫자}`(접두) (A 38670, B 4800~4810, A 38960).
- 치수는 정수면 그대로, 아니면 `n1`(예 17.5).
- React 쪽 표는 `next-intl useFormatter().number`를 사용(B 4660~).

### 2.4 오류 메시지 종류

| 구분 | 키/함수 | 발생 조건 | 표시 | 등급 |
|---|---|---|---|---|
| 계산 오류 | `Messages.CalculationError` | 부품 목록 계산(`lI`) 예외 — 선반 구성 null, 커넥터 누락 등 | 알림(닫히지 않음) + 장바구니 비활성 유지 + 로그 | SOURCE (A 38600~, 22862) |
| 시작 실패 | `ERROR_CON_START` | 첫 `changeShelfConfig` 콜백 오류 | `alert` 후 구성기 닫기(반환 URL로 이동) | SOURCE (A 37293~) |
| 실행 중 오류 | `ERROR_CON_RUN` | 색/깊이 변경 콜백 오류 | `alert` | SOURCE (A 39397) |
| 되돌리기 실패 | `ERROR_CON_HIST` | undo/redo 로드 오류 | `alert` | SOURCE (A 37100~) |
| 저장 실패 | `ERROR_CON_SAVE` | 슬롯 저장 실패, 장바구니 전 저장 2회 실패, 장바구니 API가 5xx | `alert` | SOURCE |
| 연결 오류 | `ERROR_CON_API` | 장바구니 API가 4xx/네트워크/시간초과 | `alert` | SOURCE (A 39325) |
| 장바구니 빈 응답 | `CONFIRM_BASKET_ERROR` | `/api/usm/articles/`가 빈 본문 | `alert` | SOURCE (A 39294) |
| 불러오기 | `Messages.ConfigurationLoad` | 비어 있는 슬롯 불러오기 | 알림 | SOURCE (A 36936) |
| 업로드 JSON | JsonPValid/JsonPDepth/JsonPNoConfig | 직접 붙여넣은 구성 검증(고객용 아님, 개발자 경로로 추정) | 알림 | PARTIAL |
| 서버 정보 없음 | (로그만) | 장바구니 서버 불가 → 통화·부가세 기본값 | 화면 알림 없음, 로거 error | SOURCE (A 324~330) |

사용자 대면 오류는 대부분 **브라우저 `alert()`**(기본 대화상자)이다. 우리는 인라인 오류 + 재시도 버튼으로 바꾸는 편이 낫다.

---

## 3. 서버 API

공통 요청기 `q.request`(SOURCE A 195~290): 상대 경로 호출, `credentials: same-origin`(쿠키 세션), `Accept: application/json` 기본, 기본 시간 제한 6000ms(`AbortSignal.timeout`, 없으면 `AbortController`+`setTimeout`), 실패는 `Error("Request failed: {status} {statusText}")`에 `.response` 첨부. 본문 파싱 `parseAs`: json(기본, 빈 본문이면 null) / text / blob / arrayBuffer / none. **POST·PATCH·PUT·DELETE에는 CSRF 토큰 헤더 `Csrf-Token`을 자동 첨부**.

### 3.1 엔드포인트 표

| # | 메서드·경로 | 요청 | 응답 필드(이름: 타입) | 호출 시점 | 실패 처리 | 등급 |
|---|---|---|---|---|---|---|
| 1 | GET `/api/csrf-token` | 헤더 Accept | `csrfToken: string` | 첫 쓰기 요청 직전, 장바구니 폼 채울 때 | 토큰 캐시 10분(600000ms), 동시 요청은 하나로 합침. 실패 시 쓰기 요청 자체가 던짐. 응답 not ok → Error | SOURCE A 213~245 |
| 2 | GET `/api/baskets` | 없음(쿠키), 3초 | `result.isNetCustomer: boolean`, `result.currencyCode: "EUR"/"CHF"`, `result.deliveryTime.UH: string`(주 범위), `result.shippingCountry.vatRate.percent: number`, `…vatRate.formatted: string` | 구성기 초기화(`$`) 시 1회 | 실패하면 로그만 남기고 기본값: EUR, 부가세 19%, 납기 "6-7", 포함가(순액 고객 아님) | SOURCE A 316~352 |
| 3 | GET `/api/usm/stocks` + `?hash=<이전해시>` | 해시 선택 | `hash: string`, `map: { 품번: number }` (품번→재고 수량, 약 1천 개 키 규모) | 시작 시 1회 + **10초(1e4ms) 간격 폴링** | `.catch`: 해시를 빈 문자열로 초기화, 실패 횟수 `counter`가 3보다 크면(=5번째 실패) `clearInterval`로 폴링 중단. 성공해도 counter 리셋 없음(누적). 요청 타임아웃·CSRF 없음 | SOURCE A 38402~38435, 37352 |
| 4 | GET `/api/usm/accessory-variants?a=<품번>` (품번 `BZ 002 000`, URL 인코딩) | 없음 | `variants: [{ artNum: string, priceEur: number, priceChf: number, stock: number, deliveryTime: string }]` (예: 60개) | 시작 시 1회 | 비정상 응답/배열 아님 → Error → **3초 후 1회 재시도**, 그래도 실패면 로그 error(금고 정보 없이 계속) | SOURCE C 668~690, A 37360~ |
| 5 | GET `/api/usm/sessions/{세션ID}/configurations` | 15초 | 객체 `{ "<슬롯ID>": { configuration: { config, version, … }, pictureId?: string } }`. 슬롯 `"0"` = 최근 구성(자동 저장), 1~9 = 사용자 슬롯 | 시작 시(저장된 세션 ID가 있을 때) | 실패 시 로그 후 빈 상태로 계속(`callback(error)`) | SOURCE A 37123~37165 |
| 6 | POST `/api/usm/sessions/{세션ID}/configurations` | JSON 본문(아래), 6초, `Content-Type: application/json`, `parseAs: none` | 본문 없음(2xx만 확인) | 슬롯 저장 클릭, 페이지 떠날 때 자동 저장, **장바구니 직전** | 슬롯 저장 실패 → `ERROR_CON_SAVE` alert. 자동 저장 실패 → 로그만. 장바구니용은 §3.4 | SOURCE A 37014~37070 |
| 7 | POST `/api/usm/shared-configurations` | `{ config: { config, version }, image: dataURL }`, 6초 | `id: string` | "링크 공유" 버튼 | 실패 시 로그만(사용자에게 알림 없음 → 개선 포인트) | SOURCE A 39064~39095 |
| 8 | GET `/api/usm/articles/{a}`, `/api/usm/article-configurations/{c}`, `/api/usm/shared-configurations/{s}`, `/api/usm/cockpit-articles/{ca}` | URL 쿼리 `?a=` `?c=` `?s=` `?ca=` 중 먼저 있는 하나, 3초 | `configuration: object`, `colorOverride?: number` | 구성기 시작 시 쿼리가 있으면 | 어떤 실패도 빈 구성으로 시작(`uN()`) | SOURCE A 39345~39375 |
| 9 | POST `/api/usm/articles/` | **form-urlencoded**: `configuratorSessionId`, `priceEur`(문자열), 6초, `parseAs: text` | **본문 문자열 = 새 품번**(JSON 아님) | 장바구니 버튼(§3.4) | 4xx/네트워크 → `ERROR_CON_API`, 5xx → `ERROR_CON_SAVE`, 빈 문자열 → `CONFIRM_BASKET_ERROR` | SOURCE A 39245~39330 |
| 10 | POST `/configurator/usm/haller/api/log` (`sendBeacon`) | JSON `{level, message(≤2000자), context{url.path, error.type, error.stack_trace…}, bindings}` | 없음 | 로거 레벨 error 이상만 전송 | 전송 실패 무시 | SOURCE D 523~560 |
| 11 | GET `/pics/w200/{pictureId}/image.jpg` | 없음 | 이미지 | 슬롯 목록 썸네일 | 로드 오류 시 로고 이미지로 대체 | SOURCE A 36976~37010 |
| 12 | 폼 POST `articleDataForm` → `data-single-action` 또는 `data-bundle-action`(URL은 서버 HTML이라 이 번들에 없음) | 폼 필드(§3.4) | 페이지 이동(상점 장바구니) | 품번 수령 직후 | — | SOURCE A 39270~39295 / URL은 못 읽음 |

### 3.2 저장 본문 (#6 요청)

`{ config: 장면 직렬화, userAgent, startupTime(초), configuratorTime(초), version: 5(SAVE_FORMAT_VERSION), slotId: "0"~"9", img?: 데이터 URL }`. `img`는 슬롯 저장 때만(1280×720 이하로 줄인 PNG data URL, `toDataURL`). 자동 저장(`slotId:"0"`)은 이미지 없음.
- **세션 ID**는 클라이언트가 만든 UUIDv4 형태 문자열이며 `Math.random` 기반(A 804~830, 암호학적 난수 아님). `localStorage["usm.historyId"]`에 저장, 옛 쿠키 `usm.historyId`가 있으면 localStorage로 옮기고 쿠키 삭제(A 37255~37275). → **세션 ID는 비밀이 아니다. 우리 서버는 ID만으로 남의 저장본을 읽지 못하게 해야 한다**(쿠키 세션과 결합).
- 저장본 포맷 호환: `version` 1~4는 불러올 때 색 코드 보정 후 5로 올림(A 357~436). 우리도 `version` 필드를 처음부터 둘 것.

### 3.3 장면 직렬화 필드 (구조만, SOURCE A 357~436 + 데이터 파일)

`config.metadata{color, depth, feet?, info?, …}`, `config.shelf[열][칸]` = `{ …, a: [부속품{t:종류, c:색}], pc: [패널 6면 {t:종류, c:색}] }`. 데이터 파일 `35-23.json`의 값 모양: `{ img: dataURL, config: { w, h, d, a:[], pc:[{c,t}×6], p:[number×3] } }`, 키는 `폭-높이-구성유형`(예: `75-35-6`). (파일 이름 `35-23`이 "깊이 35 × 색 23"인 것으로 보이나 로더를 못 읽어 GUESS.)

### 3.4 장바구니에 담을 때 (SOURCE A 39207~39335)

1. 버튼 클릭 → 편집 중이면 먼저 편집 종료 후 실행.
2. 가드: 요약 `U.priceEur < 1`이거나 버튼 `disabled`면 **중단**하고 "버튼이 꺼져 있어야 했다" 로그만(UI 방어선이 아니라 이중 확인).
3. **구성 저장**(슬롯 `"0"`, 이미지 포함) — 실패하면 **800ms 후 1회 재시도**, 또 실패하면 오버레이를 감추고 `ERROR_CON_SAVE` alert 후 중단.
4. 저장 성공 → 자동 저장 플래그 해제(`eu=false`, 떠날 때 중복 저장 방지), 오버레이 문구를 `BASKET_MESSAGE`로 교체.
5. `POST /api/usm/articles/` — 본문은 `configuratorSessionId`와 **클라이언트가 계산한 `priceEur`** 두 개뿐. 부품 목록·수량은 전송하지 않는다. 서버는 3단계에서 저장된 구성을 근거로 품번을 만든다고 볼 수 있다(GUESS).
6. 응답 본문(문자열) = 새 상품 품번 `artNum`. 숨은 폼 `articleDataForm`에 채움: `artNum`=응답, `amount`="1", `cnid`=고정 문자열(상품군/카테고리 식별자로 추정, GUESS — 값은 옮기지 않음), `csrfToken`=현재 토큰(다시 `getToken`).
7. **금고(품번 접두어 `BZ 002 `)가 목록에 있으면 묶음 모드**: `data-bundle-action`으로 폼 action 교체, 금고 품번마다 `members[i].artNum`, `members[i].amount`(수량) 숨은 입력 추가. 없으면 `data-single-action`. 이후 `form.submit()`(전체 페이지 이동).
8. **금액 재검증 여부**: 클라이언트 코드로는 확인 **못 함**(NOT FOUND). 서버가 `priceEur`를 받는다는 사실만 확인. 가격표가 브라우저 번들에 들어 있으므로(§4.1) 서버가 반드시 자체 재계산해야 한다 — 이것이 우리가 지켜야 할 핵심 보안 요건이다.

### 3.5 현재 로드 URL 처리 (SOURCE A 37189~37225)

닫기·시작 실패 시 이동 위치: 기본 `/usm-konfigurator`(de) / `/usm-configurator`(en) / `/usm-configurateur`(fr). 쿼리 `c=`가 있으면 상품 상세(`index.php?cl=details&anid=`), `a=` 또는 `return=`이 있으면 해당 경로. **오픈 리다이렉트 방지**: 디코드 후 `/`로 시작, `//` 금지, `\` 금지, 제어문자 금지, `new URL`로 같은 origin인지 확인, 끝 슬래시 제거. 우리도 그대로 필요한 방어 규칙.

---

## 4. 가격 · 납기 표시 로직

### 4.1 가격 계산 위치와 식 (SOURCE A 22416~22906)

- `lI(선반배열, 발, 부가세배수, 언어, 색, 깊이)`가 **브라우저에서** 부품 목록(`articleMap`)과 합계를 만든다. 부품 가격표(`lc` = CHF, `lu` = EUR, 품번 ID→가격)와 중량표가 번들에 내장.
- 요약 객체 필드: priceChf/Eur, priceNet/Gross(Chf/Eur), accessoryPrice…(같은 6종), assemblyPrice{Net,Gross}{Chf,Eur}, weight(g)/weightKg, volume, articleMap, shelfRows, height/width/depth(+Offset), color, anchoringSets, shippingViaDhl, assemblingRequired(`NO`/`OPTIONAL`), configurationContainsDoor/ExtensionDoor, purchaseAlways, feet.
- 핵심 식(인용):
  - `priceGross = Math.floor(round2(price * VAT배수))` (정수 통화 단위로 **내림**), `priceNet = round4(priceGross / VAT배수)`
  - 부가세 배수 `k = 1 + 비율/100` (기본 1.19, `/api/baskets` 값으로 교체)
  - 조립비 순액 = `순액 × ASSEMBLE_PRICE_PERCENTAGE + ASSEMBLE_PRICE_SERVICE_COSTS` (두 상수는 가격표 안, 값은 옮기지 않음), 포함가 = `round2(순액 × k)`
  - 무게 kg = `round3(g / 1000)`, 부피 = `폭/100 × (높이+발높이)/100 × 깊이/100`
  - 연결 부품 보정: 큰 구성을 분할 배송할 때 연결 커넥터를 `2×분할수`개 가격·무게·수량에서 뺀다(A 22840~22860)
  - 앵커링 세트 자동 추가: 높이·무게 구간별 기준(`ANCHORING_WEIGHT_THRESHOLD_*`) 미만이면 1세트(발이 바퀴면 추가 안 함)
- 제한 상수 이름(SOURCE D `Limitations`): MAX_HEIGHT, MAX_WIDTH, MAX_WEIGHT(g)/MAX_WEIGHT_KG, MAX_*_DHL, MAX_HEIGHT_WITH_CASTORS(바퀴는 높이 제한), MAX_HEIGHT_ANCHORING_SET_{25,35,50}.
- DHL 택배 가능 여부 `shippingViaDhl`: 무게 ≤ DHL 한도, 문 없음, 상자 크기 한도 내.

### 4.2 순액/포함가 · 통화 전환 (SOURCE A 38660~38690, 316~352)

| 전환 | 결정 주체 | 규칙 |
|---|---|---|
| 순액 vs 포함가 | **서버 응답 `isNetCustomer`** (화면 토글 없음) | `z ? priceNet(+accessory) : priceGross(+accessory)` 로 `lbPrice`에 표시. `lbVatInfo`는 `z ? sumWithoutVat : sumWithVat` 문구, 포함가 문구의 `$1`은 서버 `vatRate.formatted` 또는 `K(비율/100,"p0")` |
| EUR vs CHF | **서버 응답 `currencyCode`** (화면 토글 없음) | EUR: `{K(값,"n")} €`; CHF: `CHF {K(값,"n","de-CH")}`. 문구 리터럴 `CURRENCY_EUR/CHF`. 표(목록)에도 통화가 따라간다 |
| 가격 0 | 구성이 비어 있음 | `lbPrice`에 `"0 " + 통화기호`, 납기 칸은 `&nbsp;` |

가격 표시 합계 = 본체 + 부속(`accessoryPrice…`)(A 38665~38668). 표시값은 항상 위 "내림한 포함가"에서 파생된다(순액 고객도 포함가 내림 → 역산).

### 4.3 조립비 표시 (SOURCE A 38695~38735, B 5340~5420)

- 조건: `assemblyPriceGrossEur > 0` (무게 > MAX_WEIGHT 또는 크기 초과이며 DHL 불가일 때만 계산됨).
- 문구 선택: 무게 초과면 `ASSEMBLY_COST_WEIGHT`(실제 kg와 한도 kg 치환), 아니면 `ASSEMBLY_COST_DIMENSION`(한도 cm 치환) + `ASSEMBLY_COMMON_HINT`(조립비 금액 치환, 통화·순포함 규칙 동일).
- `window.setAssemblyHint(라벨, 헤더, 본문, 자동열림)` → React 팝오버 버튼 표시. **자동 열림은 이전 요약에 조립비가 없었고 + 초기 계산이 아니며 + 세션 첫 1회(`ec` 플래그)일 때만 5초간**. 조립비가 0이 되면 `clearAssemblyHint`로 제거.

### 4.4 납기 문구와 빠른 납기 (SOURCE A 21310~21400, 38624~38660)

가용성 판단 `getAvailability(요약, 재고맵)` → `FAST` / `NORMAL`:
- 재고맵이 없거나 `purchaseAlways`(인출문 포함 구성)이면 NORMAL.
- 기준 품번(`le`)이 구성에 있어야 하고, 그 품번의 재고 > 0.
- 구성의 **모든 부품**(금고 `BZ 002` 제외) 재고 ≥ 필요 수량이어야 FAST. 품번 누락/재고 정보 없음이면 NORMAL(에러 로그는 한 번만).

납기 칸 문구(`deliveryTime`):
- FAST → `DEL_TIME_FAST`, 아니면 `DEL_TIME_NORMAL`(`$1` = 서버 `deliveryTime.UH`, 기본 "6-7").
- 금고가 있으면 `<br>` 뒤에 한 줄 추가: 금고 변형 재고가 모두 충분하면 `DEL_TIME_BALZ_FAST`, 아니면 `DEL_TIME_BALZ`(`$1` = 변형의 `deliveryTime`, 기본 "6-8", `-`는 `–`로 바꿈).
- 즉 "빠름/일반/금고" 3종 문구이며, 금고는 본체 납기와 **별도 줄**.

색별 빠른 납기: 15색을 하나씩 대입해 같은 구성(부품 키 `^(\d+)\.\d{2}$` 의 색 부분만 교체, 품번은 색별 표 `oP`로 변환)으로 `getAvailability`를 다시 돌려 FAST인 색 ID 목록을 `colorAvailabilityStore.fastColors`에 저장 → 색 탭의 녹색 점/"빠름" 문구. 가격 0 또는 `purchaseAlways`이면 `null`(표시 없음).
다중 수량 보정용 `getAvailabilityForConfigs`(재고에서 앞 구성의 사용분을 차감하며 몇 세트 가능한지 계산)도 있으나 이 화면에서는 호출처 미확인(PARTIAL).

### 4.5 재고 폴링 · 갱신 조건 · 장바구니 버튼 활성 (SOURCE A 38402~38600, 37352)

- 폴링: 시작 직후 1회 + `setInterval(…, 10000)`. 요청에 이전 `hash`를 붙여 보냄. 응답 `hash`가 이전과 다르면 `O=true`(재계산 필요) 후 목록 갱신 호출(`P(true)`).
- 중단: 실패 누적이 5회째(§3.1 #3)에 `clearInterval`. 탭이 숨겨졌을 때 멈추는 코드는 못 찾음(NOT FOUND) → 백그라운드에서도 계속 호출.
- `updateArticleList`는 `L`(갱신 허용 플래그)가 참일 때만 실행하고, 실행 중엔 `L=false`로 재진입 방지, **버튼을 일단 `disabled`**로 만든 뒤 계산. 가격·부속가격·무게·색이 직전과 같고 재고 변화(`O`)도 없으면 계산을 건너뛰고 버튼만 복구.
- 활성 조건: **계산 예외 없음 + `priceEur > 0`** 이면 `btnBasket.disabled=false`. 예외가 나면 비활성 유지 + CalculationError 알림.
- 클릭 시 가드: 요약 `priceEur >= 1` 이고 버튼이 `disabled` 아님(A 39211).
- 한 가지: 재고 정보를 아직 못 받았어도 장바구니는 막지 않는다(납기만 NORMAL). 금고 변형 정보가 늦게 오면 `O=true`로 재계산.

---

## 5. 부품 목록 표 · 인쇄 · 내보내기

| 항목 | 내용 | 등급 |
|---|---|---|
| **구성 목록(`ShelfList`)** — 고객용 목록 대화상자 (`btnShelfList` 트리거) | 열 2개: `shelfRow`(칸 열 번호, `rowSpan`) / `shelfElement`(요소 설명, `<br>`는 줄바꿈 처리). 열은 아래→위가 아니라 위→아래로 표시하려고 배열을 뒤집음(`[...e].reverse()`). 하단 행: 부속(앵커링 세트 `n x 이름`), 치수 행1 `desc1`(조립 후 외형 = 폭+오프셋, 높이+오프셋, 깊이+오프셋), 치수 행2 `desc2`(본체 치수), 무게(kg, `n2`), 가격 순액(`priceNet`), 포함가(`priceGross`). 금액은 통화 규칙에 따라 EUR/CHF | SOURCE B 4756~4900 |
| **부품표(`ArticleList`)** | 열 6개: 수량 / 품번 / 이름 / 단가 / 합계(단가×수량) / 무게(kg, 소수 3자리). 품번 키로 정렬. 마지막 합계 행(가격 합, 무게 합), 부피 행(`articleVolume`: 값 `n3` + `articleVolumeUnit`). **표시 금액은 EUR 기준 `priceEur`(순 단가)** | SOURCE B 4650~4760 |
| 부품표 노출 범위 | 인쇄물의 부품표는 `document.title`에 "cockpit"이 들어간 페이지(내부 관리자판)에서만 포함(`oE`), 버튼 `btnArticleList`도 `cockpitVersion`일 때만 연결. 고객 화면에는 부품표가 보이지 않을 가능성이 높음(대화상자 트리거 id는 서버 prop이라 확정 불가) | PARTIAL A 19011, 39020, 39420 |
| **인쇄** (`printConfig`) | 숨은 iframe에 문서 구성 → `print()`. 구성: 제목(`PRINT_TITLE`) → H1 정면 스크린샷(치수선 표시를 임시로 켰다 끔, 이미지 폭 100%) → H2 구성 목록 표(위 ShelfList 모양 HTML) → (내부판만) H3 부품표 → 마지막 H4 + 출력 시각(`toLocaleString`). 배경 흰색, 12px 표, `@media print`로 이미지/제목 쪽 나눔 방지. 현재 페이지 스타일시트를 iframe에 복사. 200ms 후 `focus()`+`print()` | SOURCE A 38856~39060 |
| 내보내기 | PDF/CSV/엑셀 내보내기 기능은 **못 찾음**. 가능한 출력은 인쇄(브라우저 PDF 저장 포함), 공유 링크, 스크린샷(Ctrl+`.` → `createSceneScreenshotFront`) | SOURCE(없음 확인) |
| 공유 링크 | 대화상자에 `?s={id}` 링크 + 복사 버튼(`navigator.clipboard.writeText`, 성공 문구) | SOURCE A 39064, B 1300~1440 |

---

## 6. 설정 · 쿠키 · 스토리지 · 추적

| 이름 | 종류 | 용도 | 유효기간/속성 | 등급 |
|---|---|---|---|---|
| `__compliance_cookie_2` | 쿠키 | 쿠키 동의 상태. 값 = 항목별 `0/1` 문자열, 순서 `analytics, youtube, flowbox, googleMaps, stringConfigurator, youCanBookMe`, 형식 검사 `^[01]{3,6}$` (맞지 않으면 "동의 초기화" 경고 로그) | `Path=/; Max-Age=31536000`(1년); `Secure; SameSite=Lax`; 도메인이 `smow.(de|com|fr|ch|dev|me|rocks)`이면 `Domain=.smow.xx`. 저장 시 `consentUpdated` 이벤트 발행. 도메인 쿠키로 옮기며 호스트 전용 쿠키는 삭제 | SOURCE E, D 700~ |
| `usm.historyId` | 쿠키(구) → localStorage | 구성 세션 ID | localStorage로 이전하고 쿠키는 만료 처리 | SOURCE A 37255 |
| `usm.historyId` | localStorage | 위와 동일 | 영구 | SOURCE |
| `usm.dismissedIntros` | localStorage | 이미 본 안내 비트 마스크(정수) | 영구 | SOURCE A 20121 |
| `usm:sidebar-hint-seen` | localStorage | 모바일 시트 말풍선 확인 여부 | 영구 | SOURCE B 5081 |
| `configOptions.info` | 쿠키(구) | 안내 비트(2진 문자열), 읽기 전용 호환 | — | SOURCE A 20132 |
| `smow_usm_configurator` | (상수) | 상수 이름 `COOKIE_NAME_CONFIGURATOR_SETTINGS`만 정의되고, 읽은 번들에서 사용처 못 찾음 | — | PARTIAL D 700 |
| (로캘 쿠키) | 쿠키 | next-intl 언어 전환 링크가 쿠키 이름·옵션을 받아 `document.cookie` 기록 | 이름은 서버 설정이라 못 읽음 | PARTIAL 13lzs 270~330 |
| CSRF 토큰 | 메모리 | 쓰기 요청 헤더 `Csrf-Token` | 10분 캐시 | SOURCE |

쿠키 도구(D 658~700): 이름 `encodeURIComponent`, `expires`는 숫자(일)면 일 단위, 항상 `Secure; SameSite=Lax; Path=/`, 도메인 규칙 위와 같음. 모든 localStorage 접근은 `try/catch`.
**쿠키 동의 연동**: 도움말 안내(InfoType)는 동의 쿠키가 없으면 보류했다가 `consentUpdated` 후 표시. 모바일 말풍선은 `hasValidConsent()`일 때만.

**분석·추적 스크립트**: 구성기 코드(A)에는 `gtag/dataLayer/fbq/clarity` 등 호출이 **없음**(SOURCE, grep). 번들에 `@next/third-parties`의 GoogleTagManager/GoogleAnalytics 컴포넌트(`1tg8xpbbb3ki0.js`)가 있으나 이 화면에서 실제 사용하는지는 못 읽음(동의 항목 `analytics`가 있으므로 동의 후 로드되는 구조로 추정, GUESS). 자체 수집: 저장 본문의 `userAgent`, 시작·사용 시간(`startupTime`, `configuratorTime`), 오류 로그 비콘(`/api/log`), 저장 구성 자체(세션별).

---

## 7. 접근성 · 키보드 · 터치 단서

| 항목 | 내용 | 등급 |
|---|---|---|
| 키보드 (캔버스, 문서 `keydown`) | ←/→ 시점 좌우 이동(5), ↑/↓ 확대·축소(10), PageUp/PageDown 거리(50 단위, 100~805 사이), Home 시점 초기화, End 무시, **Esc → 기본 상태(편집 종료)**, **Ctrl+Z 되돌리기, Ctrl+Y 다시**, Ctrl+`.` 스크린샷, Ctrl/Shift+S·K 개발자 패널. 모두 `preventDefault` | SOURCE A 24228~24297 |
| 되돌리기 이력 | 최대 50단계(문자열 배열), 앞쪽으로 분기하면 이후 이력 삭제, `btnBack/btnForward`는 `disabled`로 상태 반영 | SOURCE A 37075~37115, B 1190~ |
| 터치 | 캔버스 `touch-action:none`, 포인터 이벤트 사용(`pointerdown/move/up`). 요소 위 **500ms 길게 누르기 → 편집 모드**(`InfoType.LONG_PRESS` 안내), 그 외 드래그는 카메라 이동, 제스처(핀치) 플래그, 길게 누른 손가락 id를 기억해 뗄 때 오동작 방지. 삭제 구역(`areaBin`)도 `touch-action:none` | SOURCE A 24300~24470, 37400~37420 |
| 마우스 | 휠 이벤트(확대·축소, A 37440), 우클릭 메뉴 직접 구현(Ctrl+우클릭만 기본 메뉴 허용) | SOURCE |
| 의미 구조 | 탭: `role=tablist/tab/tabpanel` + `aria-labelledby`(Radix). 선택기: `role=combobox/listbox/option`. 토글 버튼 `aria-pressed`(문 열기, 패널 접기), 아이콘 버튼 `aria-label`, 메뉴 `aria-expanded/haspopup`, 로딩 `role=status aria-live=polite aria-label=Loading`, 대화상자 포커스 트랩+배경 `aria-hidden`+설명 sr-only | SOURCE B |
| 빈틈(우리가 개선) | 색 견본은 `div onClick`(키보드 포커스·`role` 없음), 3D 캔버스는 대체 텍스트·키보드로 칸 추가·삭제 수단 없음, 사용자 알림이 `alert()`, 구성 유형 라디오는 `sr-only`지만 `readOnly` 처리, `prefers-reduced-motion`은 아이콘 애니메이션에만 적용, 호버 효과는 `(hover:hover) and (pointer:fine)`에서만 | SOURCE/GUESS |
| 텍스트 선택 | 헤더·콘텐츠 영역 `user-select:none`(오른쪽 목록 표는 `select-text`) | SOURCE CSS, B 4950 |

---

## 8. 우리가 구현할 때 필요한 최소 사양

1. **화면**: 좌 3D(또는 2D 도식) + 우 패널 탭 3개(구조 / 칸·부속 / 색), 하단 또는 상단 고정 가격·납기·담기 영역. 탭 내용은 숨기기만(상태 보존). ≤767px는 패널을 오른쪽 시트로, 편집 시작 시 자동 열기·추가 시 자동 닫기. 스크롤 줄이기 원칙: 가격·납기·담기 버튼은 sticky 한 곳, 색 견본은 격자, 같은 사실을 두 번 쓰지 않기.
2. **상태·이벤트**: 상태기계(대기/요소 추가/편집/이동 등)와 상태 변경 이벤트를 단일 스토어로 두고 UI가 구독. 저장 포맷에 `version` 필드(과거 버전 승격 함수 포함).
3. **문구**: 키-값 사전(de/en/fr 등)을 한 곳에 두고, 숫자·통화는 `Intl.NumberFormat` 래퍼 하나(소수 자릿수, 퍼센트, CHF 별도 로캘·접두 표기). "왜 이동·삭제가 안 되는가" 규칙별 메시지 키. 오류는 `alert` 대신 인라인 + 재시도.
4. **서버 API** (우리 방식 설계):
   - 세션(쿠키 기반) + CSRF 토큰 발급·검증, 쓰기 요청마다 `Csrf-Token` 헤더.
   - `GET /baskets/me`류: 통화·순/포함 고객 여부·부가세율·기본 납기.
   - `GET /stocks?hash=` → `{hash, map}` (해시 같으면 빈 본문 또는 304), 클라이언트 폴링은 보이는 탭에서만, 실패 시 지수 백오프.
   - 구성 저장/목록(슬롯 + 자동 저장), 공유 링크 생성/조회, 구성에서 품번 생성(`POST`).
   - 오류 로그 수집(비콘).
5. **가격은 서버 기준**: 화면 가격은 미리보기, **장바구니 담기 순간 서버가 저장된 구성으로 부품·수량·가격을 재계산**하고 클라이언트가 보낸 금액은 불일치 검사용으로만 사용. 가격표 전체를 브라우저에 내려주지 않는 편이 안전(smow는 내려줌).
6. **담기 순서**: 구성 저장(실패 시 1회 재시도 후 중단) → 서버에서 품번/장바구니 항목 생성 → 이동. 부품 목록·수량도 서버가 저장 구성에서 산출. 금고 같은 별도 납기 부품은 묶음 항목으로.
7. **표시 규칙**: 포함가 = `floor(순액 × 부가세배수)`처럼 반올림 규칙을 고정하고 순액은 역산(우리 규칙을 문서화), 가격 0이면 담기 비활성, 계산 오류면 비활성+알림, 납기 FAST 판정은 "모든 부품 재고 ≥ 수량"과 주문제작 구성 예외, 색별 빠른 납기 점은 같은 로직 재사용, 조립비는 조건(무게·치수 초과 + 택배 불가) 충족 때만 안내.
8. **목록·인쇄**: 고객용 구성 목록(열 번호, 요소 설명, 치수 2종, 무게, 순액/포함가), 필요 시 부품표(수량·품번·이름·단가·합계·무게·부피)와 인쇄 전용 레이아웃(스크린샷+목록+출력 시각). 파일 내보내기(CSV 등)는 smow에 없으므로 선택 사항.
9. **저장소**: 세션 ID는 서버 발급 불투명 토큰(smow는 `Math.random`), 본인 쿠키와 결합. localStorage는 보조(이미 본 안내 비트, 마지막 세션 ID). 쿠키 동의는 항목별 비트열 + 이벤트로 안내·분석 로드 제어.
10. **접근성**: 색 견본을 `radio`/`button`으로(포커스·`aria-checked`), 캔버스 외 키보드 조작(칸 추가·삭제·이동 버튼), 알림 `aria-live`, 터치 길게 누르기 대신 명시적 "편집" 버튼, 되돌리기 Ctrl+Z/Y와 버튼 병행.
11. **보안**: 반환 URL 화이트리스트(`/` 시작, 같은 origin, `//`·`\`·제어문자 금지), 공유 링크 ID 추측 방지, 업로드 JSON 검증은 서버 스키마로, 로그 비콘 길이·빈도 제한.

---

## 9. 읽지 못한 것

| 항목 | 이유/영향 |
|---|---|
| 서버가 그리는 HTML 껍데기(헤더 메뉴 항목, 가격·납기·담기 버튼의 정확한 배치와 CSS 클래스, 오버레이 버튼 라벨, 스플래시, 토스트 UI `window.showToast` 구현) | HTML은 입력에 없음. 위치·표시 조건은 번들 코드 단서로만 추정 |
| `window.__USM_LEGACY__.literals`의 **값**과 next-intl 사전의 값 | 서버가 주입/제공. 키만 코드에서 추출. 지원 언어는 코드 분기(de/en/fr)로 확정 |
| 폼 `articleDataForm`의 `data-single-action`, `data-bundle-action` URL, `cnid`의 의미 | HTML 속성이라 못 읽음 |
| 서버 측 동작: 금액 재검증 여부, 품번 생성 규칙, 에러 코드 본문, 재고 해시 갱신 주기, `/pics/` 이미지 생성 | 클라이언트 코드만 읽음 |
| 쿠키 동의 배너 UI 자체와 `analytics` 동의 시 실제 로드되는 스크립트(GTM/GA 컴포넌트가 이 화면에서 쓰이는지) | 동의 모듈과 라이브러리만 확인 |
| `35-23.json`을 로드하는 코드(파일명 규칙, 호출 시점) | 로더를 찾지 못함(`/data` 호출 흔적 없음). 키 구조와 값 모양만 확인 |
| `accessory-variants.json`/`stocks.json`의 값, 가격표(`lc`/`lu`/`oP`) 내용 | 영업 데이터라 구조만 확인하고 옮기지 않음 |
| `smow_usm_configurator` 쿠키의 실제 사용처, next-intl 로캘 쿠키 이름 | 사용처 미발견 |
| 3D 장면 구현(three.js, 충돌·배치 규칙, 이동·삭제 가능 판정 `checkObjectMoveOrDeleteStart`의 세부 규칙) | 요청 범위 밖(D 파트 외). 알림 키만 정리 |
| `getAvailabilityForConfigs`의 호출처, 탭이 숨겨졌을 때의 폴링 중단 여부 | 코드에서 못 찾음 |

> 상태: 위 항목은 **분석 진행 결과**이며 완료 선언이 아님. 다음 단계에서 서버 HTML(또는 렌더링된 DOM)을 받아 §1.1의 배치와 §9의 미확인 항목을 보강해야 한다.
