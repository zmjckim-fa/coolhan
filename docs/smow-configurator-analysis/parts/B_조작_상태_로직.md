# B. smow USM Haller 구성기 — 조작 로직·상태 기계 분석

- 대상: `https://www.smow.de/konfigurator/usm/haller` 공개 번들(읽기 전용 정적 분석, 코드 실행 없음)
- 분석 파일(전부 정리본): `14xezdwz4pjta.js`(앱 본체), `0sqfjbgv28kbx.js`(상수), `0pv910lfhfhfu.js`(UI·문구), `13lzs0_g8pri-.js`(금고 규격 등), 데이터 `35-23.json`(깊이35·색23 선반 목록, 구조만 확인)
- 줄 번호 `L숫자`는 `14xezdwz4pjta.js` 정리본 기준이다. 다른 파일은 파일명을 붙인다.
- 우리 제품에는 smow의 코드·이미지·데이터를 쓰지 않는다. 이 문서는 동작 규칙을 설명으로 옮긴 것이며, 규칙(예: 같은 단 높이 일치)은 우리가 독자 구현한다.
- 증거 등급: **SOURCE** 코드에서 직접 읽음 / **PARTIAL** 일부만 읽었거나 추론이 섞임 / **GUESS** 정황 추정.

---

## 0. 한눈에 보는 결론

| 항목 | 결론 | 등급 |
|---|---|---|
| 데이터 구조 | "열(column) 배열". 각 열은 바닥에서 위로 쌓은 칸(element) 목록. 칸을 격자 좌표로 두지 않고 cm 실수 좌표 + 슬롯 스냅 | SOURCE |
| 단위 | 전부 cm. 깊이 z는 전체 공통값이고 사용자가 칸별로 못 바꾼다(`RESTRICT_MOVEMENT = true`) | SOURCE |
| 공중 칸 | 불가. 칸은 바닥 또는 다른 칸 위에만 놓인다 | SOURCE |
| 실행 취소/다시 실행 | 있음. 문자열 스냅샷 최대 50개, Ctrl+Z / Ctrl+Y | SOURCE |
| 최대 크기 한도(MAX_*) | 편집 제약이 아니라 배송·조립서비스·가격 계산용 임계값. 편집 차단은 "바퀴 사용 시 높이 50cm"뿐 | SOURCE |
| 색 | 전체 공통 1색(칸별 색 없음). 깊이·다리 종류도 전체 공통 | SOURCE |
| 칸 면 구성 | 7개 프리셋(ShelfType)만 선택 가능. 면별 자유 조합 UI 없음(구조는 6면 배열) | SOURCE |
| 저장 | 서버 저장 + 자동저장(페이지 이탈 시), 형식 버전 5 | SOURCE |

---

## 1. 장면 데이터 모델

### 1.1 좌표계·단위

| 항목 | 값 | 근거 | 등급 |
|---|---|---|---|
| 단위 | cm (칸 폭 35/50/75, 높이 17.5/25/35, 깊이 25/35/50) | `0sqfjbgv28kbx.js` `Depth {25,35,50}`, `35-23.json` 키 | SOURCE |
| x | 가로. 첫 열 중심이 0 근처, 오른쪽 +. 열은 startX 오름차순 정렬 | L23496 | SOURCE |
| y | 위쪽 +. 칸 중심 기준. 바닥 열의 y = 높이/2 + 다리 오프셋 | L22984, L23126 | SOURCE |
| z | 앞쪽 +. 모든 칸 z = 0. 깊이 방향 이동은 `RESTRICT_MOVEMENT` 때문에 막혀 있음 | L35946, L22972 | SOURCE |
| 장면 반폭 | `SCENE_WIDTH = 500` | L36280 | SOURCE |
| 바닥 오프셋(칸 바닥~바닥면) | 다리 없음 1.15 / 조절다리(작은·보통·W) 3.1 / 바퀴 7.9 | L18799, L18845, L18970, L18974, L38014 | SOURCE |

### 1.2 최상위 구조

```
Scene (전역 배열 sA = 열 목록)
 └ Column(row)  { startX, endX, height(합), elements[] }      // L23462, L36846
     └ Element(oy)  { width, height, depth, position(x,y,z),
                      panelConfiguration[6], accessories[],
                      feetType, neighbor, direction,
                      lastValidPosition, positionArrayRow(소속 열) }
```

- 용어 주의: 코드의 `positionArray`/`positionArrayRow`가 "열(세로 기둥)"이다. 한국어 요청서의 "행(row)"과 달리 가로 줄이 아니라 **세로 스택**이다. (SOURCE)
- 열의 `height`는 칸 높이의 합. 칸 추가 시 `+= e.height`, 삭제 시 `-= e.height` 후 `pop()`. (L23446, L37947)
- 열 `elements[0]`은 항상 바닥 칸이고 `elements[last]`가 최상단. 삭제는 최상단만 허용하므로 `pop()`이 맞는다. (SOURCE)
- 인접 열 사이에는 틈이 없다. 새 열 x는 슬롯(= 기존 열 가장자리에 맞닿는 자리)으로만 정해진다. (SOURCE, 5.3 참조)

### 1.3 칸(Element)의 속성

| 속성 | 설명 | 등급 |
|---|---|---|
| width, height, depth | 선반 목록(JSON)에서 정한 고정 치수. 칸 크기 변경 UI는 없고 편집 패널은 읽기 전용 표시 | SOURCE (L37897) |
| depth | 전체 깊이 설정이 바뀌면 모든 칸을 같은 폭·높이, 새 깊이로 재생성(`setDepth` → `replaceShelfInternal`) | SOURCE (L36597) |
| panelConfiguration | 길이 6 배열 `{t: 면종류, c: 색ID}`. 인덱스 = `PanelOrder` | SOURCE |
| accessories | `{t: Accessories, c?, options?}` 목록. 종류별로 정렬해 유지 | SOURCE (L19664~19760) |
| feetType | 바닥 열의 최하단 칸에만 다리/바퀴. 위에 쌓인 칸은 다리 제거 | SOURCE (L23456, L38570) |
| neighbor | `STANDALONE 0 / LEFT 1 / RIGHT 2 / LEFT_RIGHT 3`. **이웃 열이 있는 쪽**을 뜻한다 | SOURCE |
| direction | `NORTH/EAST/SOUTH/WEST`. 바퀴 연결부 방향 모델 회전용 | SOURCE |
| lastValidPosition | 마지막으로 유효했던 위치. 실패 시 500ms 보간으로 되돌림 | SOURCE (L23761) |

`PanelOrder`: `LEFT 0, RIGHT 1, TOP 2, BOTTOM 3, BACK 4, FRONT 5`
`SidePart`(면 종류): `NOTHING 0, PANEL 1, ACOUSTIC_PANEL 2, GLASS_PANEL 3, GLASS_DOOR_LEFT 4, GLASS_DOOR_RIGHT 5, DROP_DOWN_DOOR 6, FLIP_UP_DOOR 7, METAL_EXTENSION_DOOR_WITH_DRAWER 8, PANEL_SHORTENED 9, PANEL_WITH_HOLES 10, METAL_EXTENSION_DOOR 11`

- 실제로 3D 생성(`createPanel`, L19580)이 처리하는 종류는 `NOTHING, PANEL, PANEL_SHORTENED, DROP_DOWN_DOOR, FLIP_UP_DOOR, METAL_EXTENSION_DOOR(_WITH_DRAWER)`뿐이다. ACOUSTIC/GLASS/PANEL_WITH_HOLES는 상수만 있고 생성 분기가 없다. (SOURCE) → 우리가 지원 안 해도 smow와 동일 수준.
- 편집 UI가 만들 수 있는 FRONT 종류는 `NOTHING, DROP_DOWN_DOOR, METAL_EXTENSION_DOOR, METAL_EXTENSION_DOOR_WITH_DRAWER`(L37590~37614). FLIP_UP_DOOR는 UI 경로가 없다. (SOURCE)

`Accessories`: `LOCK 0, PANEL 1(= 중간 선반판, 독일어 "Zwischentablar"), CUTOUT 2(뒷판 케이블 구멍), SAFE 3`
- 요청서의 "칸막이"에 해당하는 것은 **중간 선반판(가로판)** 이다. 세로 칸막이 기능은 코드에 없다. (SOURCE: `0pv910lfhfhfu.js` `AC_PANEL` 문구 + L19696 `rotation.x = DEFAULT_ROTATION`)
- `Cutout`은 9칸 비트마스크(`TOP_LEFT 1 … BOTTOM_RIGHT 256`), 한 번에 1곳 선택.

### 1.4 이웃(Neighbor) 판정 방식

- 데이터로 저장하지 않는다. 열이 추가·삭제될 때마다 **바퀴/다리 렌더링용**으로만 다시 계산한다. (SOURCE: L23471~23492, L37927~37946, L36655~36669)
- 규칙: 좌측에 열이 있고 우측에 열이 있으면 `LEFT_RIGHT`, 한쪽만 있으면 `LEFT`/`RIGHT`, 없으면 `STANDALONE`.
- 즉 "칸 사이 연결 가능 여부" 판정에 쓰이지 않는다. 연결 가능 여부는 5장의 **레이캐스트 접촉 검사**가 담당한다. (SOURCE)
- 이웃 열 하나만 있는 요소는 `RIGHT`처럼 "반대편에 이웃이 있다"는 의미이므로 우리는 `hasLeft`/`hasRight` 불리언으로 바꾸는 편이 낫다. (설계 제안)

---

## 2. 상태 기계

### 2.1 상태 값 (`0sqfjbgv28kbx.js` State)

| 값 | 이름 | 의미 | 등급 |
|---|---|---|---|
| 10 | DEFAULT_IDLE | 기본 대기(전체 보기, 사이드바에 선반 목록) | SOURCE |
| 11 | DEFAULT_MOVE_CAMERA | 카메라 회전·확대 중 | SOURCE |
| 12 | DEFAULT_MOVE_OBJECT | 놓인 칸을 끌어 이동 중(휴지통 영역 표시) | SOURCE |
| 13 | DEFAULT_ADD_ELEMENT | 사이드바 썸네일에서 **끌어서** 새 칸 추가 중 | SOURCE |
| 14 | DEFAULT_ADD_CLICK_ELEMENT | 썸네일 **클릭** 후 슬롯 표시, 슬롯 클릭으로 추가 | SOURCE |
| 20 | EDIT_IDLE | 칸 하나 선택, 편집 패널 열림 | SOURCE |
| 31 | EDIT_MOVE_CAMERA | 상수만 있음. `setState`에 분기 없음(→ default로 IDLE) | SOURCE (L25136) |
| 32 | EDIT_MOVE_OBJECT | 상수만 있음. 동일하게 미사용 | SOURCE |
| 33 | EDIT_ADD_ELEMENT | 상수만 있음. 미사용 | SOURCE |
| 34 | EDIT_MOVE_CLICK | 편집 중 "이동" 버튼 → 슬롯 클릭 이동 | SOURCE |
| 5 | ANIMATE_SCENE | 핸들러가 빈 클래스(`lj`). 진입 코드는 있으나 스크린샷은 이 상태를 쓰지 않고 `EDIT_IDLE`로 위장함 | SOURCE (L24034, L37685) |

- 핸들러 8개: `lW`=ADD_CLICK, `lX`=ADD, `lK`=EDIT_IDLE, `lq`=EDIT_MOVE_CLICK, `lJ`=IDLE, `lZ`=MOVE_CAMERA, `l$`=MOVE_OBJECT, `lj`=ANIMATE. 매니저 `l0`가 `currentHandler`로 이벤트를 위임. (L25001~25009)
- `setState(e)`는 같은 상태 재호출을 무시하고, 상태에서 나갈 때 와이어프레임(슬롯 표시)을 지우고 컨텍스트 메뉴를 숨긴 뒤, 0ms 타이머로 `usm:state-change` 이벤트(`state, viaLongPress, viaSidebar`)를 발행해 React UI에 알린다. (L25082~25150, SOURCE)

### 2.2 전이표

| 현재 | 이벤트·조건 | 다음 | 부수 효과 | 등급 |
|---|---|---|---|---|
| IDLE | 마우스 좌클릭 down, 칸 위 | (200ms 대기) | `currentElement` 지정, 200ms 타이머 시작 | SOURCE L24313 |
| IDLE | 위 타이머 중 포인터 이동 5px 초과 | MOVE_OBJECT | 타이머 취소, 슬롯 계산·표시, 사이드바를 휴지통으로 교체 | SOURCE L24380 |
| IDLE | 200ms 안에 좌클릭 up(움직임 없음) | EDIT_IDLE | `currentEditElement = currentElement` | SOURCE L24404 |
| IDLE | 200ms 경과(버튼 누른 채) | MOVE_OBJECT | 타이머 콜백 | SOURCE L24315 |
| IDLE | 좌클릭 down, 칸 아님(바닥·벽·배경) | MOVE_CAMERA | 시작 theta·radius·포인터 기록 | SOURCE L24318 |
| IDLE | 가운데 버튼 down | MOVE_CAMERA | 칸 위여도 카메라 | SOURCE L24302 |
| IDLE | 우클릭 up, 칸 위 | (상태 유지) | 컨텍스트 메뉴: 삭제 불가 칸이면 "편집만", 아니면 "편집+삭제" | SOURCE L24416 |
| IDLE | 터치 down, 칸 위 | (500ms 대기) | 500ms 유지 시 EDIT_IDLE(길게 누름) | SOURCE L24351, L24368 |
| IDLE | 터치 이동 5px 초과(대기 중) | MOVE_OBJECT | | SOURCE L24395 |
| IDLE | 터치 down, 칸 아님 / 두 번째 손가락 | MOVE_CAMERA | 두 손가락이면 첫 down도 재전달 | SOURCE L24327 |
| IDLE | 터치 up, 이동 5px 미만 | EDIT_IDLE | 위치 복원 후 선택 | SOURCE L24453 |
| IDLE | 터치 더블탭(칸) | IDLE | 위치 복원, 카메라 재계산 | SOURCE L24443 |
| IDLE | 썸네일 포인터 down→이동 10px 초과(마우스 좌버튼) | ADD_ELEMENT | 64x64 드래그 고스트, 슬롯 계산 | SOURCE L24595, L24525 |
| IDLE | 썸네일 탭(이동 없이 up) | ADD_CLICK_ELEMENT | 슬롯 표시, 안내 | SOURCE L24485 |
| IDLE | 사이드/메뉴 "편집" 클릭(`MENU_ITEM_EDIT`) | EDIT_IDLE | | SOURCE L24219 |
| IDLE | `MENU_ITEM_DELETE` 클릭 | (삭제 실행) | 6장 | SOURCE L24223 |
| MOVE_CAMERA | 마우스 up(좌·가운데) / 터치 마지막 손가락 up / pointercancel로 포인터 0개 | IDLE | | SOURCE L24715, L24694 |
| MOVE_OBJECT | 좌클릭 up, 더블클릭 | IDLE | 위치 복원 | SOURCE L24823 |
| MOVE_OBJECT | 좌클릭 up, 이동량 1px 미만 | EDIT_IDLE | | SOURCE L24833 |
| MOVE_OBJECT | 좌클릭 up, 드롭 | IDLE(200ms 뒤) | `checkObjectMoveEnd` 성공 시 가격 갱신, 이력 push | SOURCE L24840 |
| MOVE_OBJECT | 포인터가 캔버스 밖으로 나감(버튼 누름) | (상태 유지) | 칸을 장면에서 빼 "휴지통 보유" | SOURCE L24808 |
| MOVE_OBJECT | 휴지통 보유 상태로 문서 up | (삭제 실행) | 6장 | SOURCE L24736 |
| MOVE_OBJECT | 캔버스 재진입 | (상태 유지) | 칸 장면에 복귀 | SOURCE L24799 |
| MOVE_OBJECT | 포인터 이동(마우스 버튼 0) | IDLE | 위치 복원 | SOURCE L24759 |
| MOVE_OBJECT | 터치 손가락 2개째 down | IDLE | 위치 복원 | SOURCE L24748 |
| ADD_ELEMENT | 문서 up(커밋 대기 아님) | IDLE(약 400ms 뒤) | `commitRollover`: 장면에 추가 성공 시 이력 push | SOURCE L23936 |
| ADD_ELEMENT | ESC / 문서 pointerdown(커밋 대기 아님) | IDLE | `abortDrag`: 칸 제거 | SOURCE L23939, L23929 |
| ADD_CLICK_ELEMENT | 캔버스 up, 포인터가 슬롯 위 | IDLE(400ms 뒤) | 새 칸 생성·검증·추가, 이력 push | SOURCE L23836 |
| ADD_CLICK_ELEMENT | 캔버스 up, 슬롯 아님 / 캔버스 밖 클릭 / 같은 썸네일 재탭 | IDLE | 슬롯 제거 | SOURCE L23869, L23834, L23884 |
| ADD_CLICK_ELEMENT | 다른 썸네일 탭 | (상태 유지) | 이전 슬롯 지우고 새 칸 기준으로 재계산 | SOURCE L23871 |
| EDIT_IDLE | 같은 칸 좌클릭 | IDLE | `editElementStop`(카메라 복귀 600ms+300ms) | SOURCE L24183 |
| EDIT_IDLE | 다른 칸 좌클릭 | EDIT_IDLE | 선택 교체, 카메라 보간 600ms | SOURCE L24187 |
| EDIT_IDLE | 빈 곳 클릭 / ESC / "나가기" 버튼 | IDLE | | SOURCE L24202, L24152 |
| EDIT_IDLE | Delete 키(46) / 삭제 버튼 / 우클릭 메뉴 | (삭제 실행) | 6장 | SOURCE L24162 |
| EDIT_IDLE | 이동 버튼(`btnEditMove`) | EDIT_MOVE_CLICK | | SOURCE L39110 |
| EDIT_IDLE | 우클릭, 다른 칸 위 | (상태 유지) | 삭제 컨텍스트 메뉴 | SOURCE L24191 |
| EDIT_MOVE_CLICK | 이동 가능한 슬롯이 없음 | EDIT_IDLE | 안내 "이동할 다른 위치 없음" | SOURCE L25173~25187 |
| EDIT_MOVE_CLICK | 위에 칸이 있거나 가운데 칸이라 이동 불가 | EDIT_IDLE | 안내 | SOURCE L25162 |
| EDIT_MOVE_CLICK | 슬롯 클릭 | IDLE(400ms 뒤) | 위치 이동·검증·이력 push | SOURCE L24047 |
| EDIT_MOVE_CLICK | 슬롯 아닌 곳 클릭 / 문서 클릭(이동 버튼 제외) | EDIT_IDLE | | SOURCE L24040, L24064 |

### 2.3 입력 이벤트 연결

- 캔버스: `pointerdown/move/up/cancel/enter/leave`, `wheel(passive:false)`. `touch-action: none`. (L37380~37440, SOURCE)
- 문서: `keydown`, `keyup`, `pointerdown`, `pointerup`, body `click`(= onDocumentTap). 입력창·대화상자·메뉴 안에서 눌린 키는 상태기계가 무시하고 `keysHeldElsewhere`에 기억했다가 keyup도 무시(L24958, L25024). (SOURCE)
- 사이드바 썸네일 영역(`#sceneNew`): `pointerdown/move/up`. 휴지통 영역(`#areaBin`): `pointerenter/leave/move/up`.
- 더블탭 판정: 터치 500ms, 마우스(좌) 300ms. (L23153, SOURCE)
- 길게 누르기: 터치 500ms만 사용. 마우스 길게 누르기는 200ms 타이머로 "끌기 의도" 판정이며 별도 롱프레스 개념은 없다. (SOURCE)
- 길게 누른 뒤 손가락을 떼면 발생하는 `pointerup`을 EDIT_IDLE이 무시하도록 `pendingLongPressRelease`에 pointerId 보관. (L24173, SOURCE)

---

## 3. 새 칸 추가의 규칙

### 3.1 흐름 (끌기)

```
썸네일 pointerdown → 시작점 기록
pointermove: 이동 거리² > 100 이고 마우스 좌버튼 이고 touch 아님 → startNewShelfDrag
   새 Element 생성(폭·높이·깊이·면구성 = 썸네일 설정, 다리=현재 전역값, Neighbor.STANDALONE)
   슬롯 계산(calculateFreePosition) → 0개면 "ConfigurationErrorGeneral" 안내, IDLE
캔버스 위에서 pointermove: 3D 칸이 포인터를 따라감, 가까운 슬롯에 흡착(5.2)
문서 pointerup → commitRollover
   새 Element 재생성 → checkObjectMoveEnd(5.4) 통과 → 장면 추가 → 이력 push
   실패 → 그냥 IDLE (칸 버림)
```
(SOURCE: L24525~24588, L23944~24033)

### 3.2 흐름 (클릭)

- 썸네일 탭 → `ADD_CLICK_ELEMENT`, 슬롯이 반투명 와이어프레임 박스로 표시. 다른 썸네일을 탭하면 슬롯 재계산. 슬롯 클릭 시 해당 슬롯 중심에 칸 생성. (SOURCE L23836~23870)
- 터치는 이 클릭 방식만 쓴다(끌어서 추가는 touch 제외). (SOURCE L24607)

### 3.3 슬롯(놓을 수 있는 자리) 생성 규칙 — `calculateFreePosition`

입력: 놓으려는 칸 e (폭 w, 높이 h, 깊이 d). 출력: 후보 중심 좌표 목록. (L22995~23115, SOURCE)

```text
if 장면이 비어 있음:
    슬롯 = (0, e.h/2 + 바닥오프셋(다리), 0) 하나

// 1) 맨 왼쪽
b = 첫 열의 바닥 칸
if b.height == e.height and b.depth == e.depth:           // 폭은 비교하지 않음
    슬롯 += (b.x - b.폭/2 - e.폭/2, b.y, b.z)

// 2) 각 열 위에 쌓기
for 열 c (인덱스 a), 상단 칸 n = c.elements[last], o = c.elements.length:
    if n.width == e.width and n.depth == e.depth:
        ok = true
        // 같은 층 정렬: 왼쪽 열의 o번째 칸, 오른쪽 열의 o번째 칸이 있으면
        // 그 칸들도 height, depth가 e와 같아야 함
        if 왼쪽열[o] 존재 and (높이≠ or 깊이≠): ok = false
        if 오른쪽열[o] 존재 and (높이≠ or 깊이≠): ok = false
        // 서랍/확장문 연속 규칙
        if e.FRONT가 확장문(서랍 포함):
            if n.FRONT가 확장문이 아니고, c의 아래쪽 칸(0..o-2) 중 확장문이 있으면: ok = false
        // 바퀴 높이 규칙
        if 다리가 바퀴이면:
            ok = (n.y + n.h/2 + e.h - 7.9) <= 50
        if ok: 슬롯 += (n.x, n.y + n.h/2 + e.h/2, n.z)

// 3) 맨 오른쪽 (1과 대칭)
```

- "같은 층" 판정이 절대 y가 아니라 **열 안 인덱스(o)** 라는 점에 주의. 높이가 다른 칸(예: 35/25)이 섞인 두 열은 인덱스 o 위치에서 높이가 다르면 그 위치에 쌓지 못한다. (SOURCE)
- 새 열의 맨 왼쪽/오른쪽 슬롯은 폭 일치를 요구하지 않는다(폭 다른 열 인접 가능). 높이·깊이 일치만 요구한다. (SOURCE)
- 바퀴 규칙 식(핵심): `n.position.y + n.halfHeight + e.height - DISTANCE_TO_FLOOR <= MAX_HEIGHT_WITH_CASTORS` (L23072, 50cm). 바퀴 다리 판정은 `feet > ADJUSTABLE_GLIDE_W_15(30)`, 즉 `CASTOR_HARD 40`/`CASTOR_SOFT 50`. (SOURCE)
- 이동 중이면 자기 자신 위치를 슬롯 후보로 넣되 숨긴다(`visible = !a.equals(e.position)`). (L23111)
- 이동 모드에서 장면에 칸이 1개뿐이면 슬롯 계산을 아예 생략(이동 불가). (L23006, SOURCE)

### 3.4 포인터 → 위치 변환과 흡착 — `checkObjectMove`

```text
광선을 z=0 평면과 교차시켜 (cx, cy)
y = 열이 이미 있을 때만 max(바닥y, cy)   // 첫 칸이면 바닥에 고정
유효 범위: |x| + e.rayLengthX <= 500 이어야 함      // rayLengthX = 폭/2 + 20
슬롯 흡착: 슬롯 중심까지 거리 < 칸 폭/2 인 가장 가까운 슬롯으로 이동, 그 슬롯만 숨김
흡착 실패 시 겹침 밀어내기(2회 반복):
    각 열에 대해  x구간 (startX - e.폭/2 - 2, endX + e.폭/2 + 2) 안이고
                 y < (열높이 [자기 열이면 - e.높이]) + e.높이/2 + 2 이면
        왼쪽/오른쪽/위 중 거리 최소 방향으로 밀어냄 (위쪽이면 y = 윗면 + 높이/2 + 2)
적용: 유효 범위 안일 때만 position 갱신 (범위 밖이면 마지막 위치 유지)
```
(L23165~23272, SOURCE) — 범위 밖 판정의 정확한 의미(슬롯이 ±500 밖에 있으면 선택 불가)는 PARTIAL.

- 칸의 y가 자기 높이보다 낮으면(바닥 근처) 다리를 붙이고, 높으면 제거. 방향은 이동한 쪽(`WEST/EAST`). (L23257, SOURCE)

---

## 4. 이동·삭제 가능 판정과 교체

### 4.1 `checkObjectMoveOrDeleteStart` — 이동·삭제 가능 여부 (L23134)

```text
r1 = 칸 중심에서 위로 (칸높이/2 + 20) 길이 광선 → 자기 자신 제외 칸이 맞으면
        → 불가: "위에 있는 칸을 먼저 옮기/지우세요" (ShelfMove/ShelfRemove)
r2 = 왼쪽 광선(폭/2+20), r3 = 오른쪽 광선, r4 = 아래 광선(높이/2+20)
if r2(왼쪽 이웃 있음) and r3(오른쪽 이웃 있음) and r4(아래 칸 없음):
        → 불가: "두 개의 분리된 선반이 생김" (ShelfMoveMiddle/ShelfRemoveMiddle)
else 가능
```
- 즉 삭제·이동은 열의 **최상단 칸만** 가능하고, **바닥층에서 양쪽에 이웃 열이 있는 칸**(선반이 둘로 쪼개짐)은 불가하다. (SOURCE)
- 불가면 편집 패널의 이동/삭제 버튼 비활성화 + 팝오버 힌트(`editElementDeleteCheck/MoveCheck`, L38333~38359).

### 4.2 삭제 (`removeElement`, L38435)

```text
if 삭제 불가 판정 → 안내 후 현재 상태 유지
n = { 장면에서 제거, 열에서 제거, 가격·바퀴 메뉴 갱신, 카메라 재계산 300ms,
      200ms 뒤 IDLE + 이력 push }
if 상태 == EDIT_IDLE:
    next = calculateNextElement(t)   // 같은 열의 바로 아래 칸, 없으면 옆 열의 최상단
    next 있음 → 삭제 후 편집 대상을 next로 이동(편집 계속)
    next 없음 → editElementStop(n)
else n()
```
- `removeElementFromPositionArray`: 열에 칸이 1개면 **열 자체를 삭제**하고(`sA.splice`), 바퀴(`> W_15`)일 때 새 양 끝 열의 다리 이웃 정보를 갱신. 칸이 여럿이면 열 높이 감소 + `pop()`. (L37922, SOURCE)
- 삭제 후 **남은 열을 좌우로 당겨 붙이지 않는다**. 끝 열만 삭제 가능하므로 틈이 생길 일이 없다(가운데 열 삭제 불가가 그 이유). (SOURCE, 추론 일부)
- 마지막 칸 삭제 시에도 장면은 빈 상태가 허용된다.

### 4.3 이동 확정 검증 — `checkObjectMoveEnd` (L23274)

좌표를 소수 2자리로 반올림한 뒤:

```text
1) 아래로 (y 길이) 광선 → 아무것도 안 맞음: 되돌림 + "바닥이나 기존 칸 위에 놓아야 함"(ShelfPlAir, 200ms 뒤 안내)
2) 맞은 것이 칸(oy):
     |칸.x - x| > 1 → 되돌림
     지지됨 = true
     확장문 연속 규칙 위반(아래 열에서 이미 서랍 칸이 있고 사이가 끊김) → 되돌림 + ShelfExtensionDoorLimit
     바퀴 + 최상단 높이 > 50 → 되돌림 + ShelfFeetConfigError
   맞은 것이 슬롯(ox): 지지됨 = true, 슬롯 좌표로 정확히 스냅(300ms 보간)
3) 좌/우 접촉 검사: 칸 바닥에서 5cm 위 높이, 길이 폭/2 + 1
     좌·우 모두 없고 지지됨=false 이고 (이동 중이며 열이 2개 이상 || 추가 중) → 되돌림 + ShelfPlConnect("연속해서 지어야 함")
     좌 이웃: 높이·깊이 같지 않으면 되돌림(ShelfPlMismatchL), |y 차이|>1 되돌림, 차이>0이면 y를 이웃에 맞춤, neighbor=LEFT
     우 이웃도 동일(ShelfPlMismatchR), neighbor=RIGHT
4) 소속 열 분리(removeElementFromPositionArray)
5) x가 어떤 열 [startX,endX] 안에 있으면 그 열 맨 위에 추가:
        열.height += e.height, position = 아래 칸 x, 아래 칸 y + 아래 높이/2 + e.높이/2, 다리 제거
   없으면 새 열 생성({startX = x - 폭/2, endX = x + 폭/2, ...}), 정렬(startX), 이웃 열의 neighbor·다리 갱신
   첫 열(장면이 비었던 경우)이면 편집 안내(InfoType.EDIT) 표시
6) lastValidPosition 갱신, 바퀴 메뉴 갱신
오류(예외) → 되돌림
```
(L23274~23521, SOURCE)

- **중요 관찰(PARTIAL)**: 쌓을 때의 "폭 동일" 검사는 슬롯 생성 단계(3.3)에만 있고, 확정 단계(4.3)에는 직접 없다. 중앙 정렬(|Δx|≤1)된 드롭만 통과하므로 실제로는 흡착 경로를 거치지만, 우리는 확정 단계에서도 폭·깊이 일치를 **다시 검사**해야 안전하다.
- 되돌림은 `translateElement(..., 500ms)` 애니메이션. 다리 상태는 애니메이션 종료 시 재판정(y<높이면 다리 추가). (L38562, SOURCE)

### 4.4 교체(replace)

- 칸 종류를 바꾸는 편집(ShelfType, 중간선반판, 금고, 케이블구멍)은 같은 위치·크기의 새 Element를 만들어 `elements[index]`와 열 안 위치를 **제자리 교체**한다. 위치·열·이웃·다리는 그대로. (`replaceShelfInternal`, L36682, SOURCE)
- 교체 시 자동 정리: 뒷판이 없으면 케이블구멍 제거, 금고 호환 크기가 아니면 금고 제거. (L36685~36700, SOURCE)
- 칸 크기 자체를 바꾸는 "교체"는 없다(삭제 후 다른 크기 추가). (SOURCE)

### 4.5 공중 칸·z축 이동·최대 크기

| 질문 | 답 | 등급 |
|---|---|---|
| 공중 칸 허용? | 아니오. 바닥 또는 칸 위만. 4.3 단계 1·2 | SOURCE |
| 앞뒤(z) 이동? | 아니오(`RESTRICT_MOVEMENT=true`, z=0 고정, 광선 방향 배열에도 z축 미포함) | SOURCE L22972, L35946 |
| 칸 개수 상한? | 코드에서 못 찾음 | GUESS |
| 가로 상한 | 포인터 유효 범위 |x|+폭/2+20 ≤ 500 (슬롯 선택 한계) | PARTIAL |
| 높이 상한 | 바퀴일 때 50cm(`MAX_HEIGHT_WITH_CASTORS`)뿐. 그 외 편집상 상한 코드 없음 | SOURCE / GUESS(그 외) |
| `MAX_HEIGHT 200`, `MAX_WIDTH 200`, `MAX_WEIGHT 80000`(g) | 완전조립 배송 한도. 넘으면 `assemblingRequired`와 조립서비스 비용이 붙고 DHL 배송 불가. 편집은 막지 않음 | SOURCE L22756, L22822, L22882 |
| `MAX_*_DHL` (50/75/15000) | DHL 소포 가능 크기·무게 판정 | SOURCE L22877 |
| 앵커링 세트 | 깊이별 임계 높이 141.7/198.4/283.5 및 높이·무게 구간으로 필요 수량 계산(가격·부속) | SOURCE L22786~22820 |
| 바퀴 사용 시 | (a) 쌓기 후 높이 50 초과 슬롯 제외 (b) 드롭 시에도 재검사 (c) 이미 50 초과인 구성이면 바퀴 선택 비활성(`castorsDisabled`) (d) 바퀴를 고르면 앵커링 세트 없음(`g=false`) | SOURCE L23072, L23346, L38084, L38524, L22815 |

바퀴/다리 전환 시 모든 칸 y에 오프셋 차이를 더하고 `lastValidPosition`도 갱신하며, 열 최하단 칸만 다리를 갖도록 재배치한다. (`setFeet`, L36614, SOURCE)

---

## 5. 편집 모드

### 5.1 진입·종료와 카메라

- 진입 시 UI 전환: 대기용 내비 숨김, 편집 내비·`areaConfig` 표시, 휴지통 숨김. 삭제·이동 가능 여부를 먼저 계산해 버튼 활성화. (L25220, SOURCE)
- 카메라: 칸 `(x, y + 2.5·높이, z ± (깊이 + 맞춤거리))`로 600ms `Quartic.InOut`, 시선은 칸 중심. 맞춤거리 `oD = max(105, 화각 맞춤)`. 카메라가 이미 뒷면(z<0)이면 뒷면 쪽에 유지. (L38105, L20519~20527, SOURCE)
- 종료(`editElementStop`): 진입 전 카메라 위치로 600ms 복귀 후 300ms 지연하고 IDLE. 1500ms 워치독으로 멈춤 방지. (L38249, SOURCE)
- 칸을 선택하면 두께 3cm 큰 윤곽선 박스(`lL`)를 하이라이트로 겹친다. 문이 있는 칸은 편집 중에 열림. (L38360, SOURCE)

### 5.2 편집 가능한 항목 (`applyEditShelfChange`, L24083)

| 필드 | 동작 | 등급 |
|---|---|---|
| `shelfType` | 7개 프리셋으로 면 6개를 일괄 설정 후 칸 교체(5.3) | SOURCE |
| `hasLock` | 문이 있는 종류에서만 자물쇠 힌트 추가/제거 | SOURCE |
| `hasPanel` | 켜면 금고 제거 + 중간선반판 추가, 끄면 제거 | SOURCE |
| `hasSafe` | 켜면 중간선반판 제거 + 금고 추가 | SOURCE |
| `safeColor`, `safeLock` | 금고 색(기본 33)·잠금 방식(기본 `electronic`) | SOURCE |
| `cutout` | 뒷판 케이블구멍 9곳 중 1곳 또는 없음. 뒷면으로 카메라 전환 후 칸 교체 | SOURCE |

### 5.3 ShelfType 프리셋 → 면 구성 (L37555~37615)

| 종류 | 값 | LEFT | RIGHT | TOP | BOTTOM | BACK | FRONT |
|---|---|---|---|---|---|---|---|
| NO_PANEL(벽 없음) | 6 | – | – | – | – | – | – |
| NO_SIDE_PANEL | 5 | – | – | 판 | 판 | – | – |
| NO_BACK_PANEL | 0 | 판 | 판 | 판 | 판 | – | – |
| BACK_PANEL | 1 | 판 | 판 | 판 | 판 | 판 | – |
| DROP_DOWN_DOOR | 2 | 판 | 판 | 판 | 판 | 판 | 아래로 열리는 문(6) |
| EXTENSION_DOOR | 3 | 판 | 판 | 판 | **짧은 판(9)** | 판 | 확장문(11) |
| EXTENSION_DOOR_DRAWER | 4 | 판 | 판 | 판 | **짧은 판(9)** | 판 | 확장문+서랍(8) |

- 역방향(`getShelfType`, L37743): BACK이 NOTHING이면 BOTTOM NOTHING→NO_PANEL, LEFT NOTHING→NO_SIDE_PANEL, 아니면 NO_BACK_PANEL. BACK 있고 FRONT가 NOTHING→BACK_PANEL, 6→DROP_DOWN, 11→EXTENSION, 8→EXTENSION_DRAWER, 그 외 오류. (SOURCE)
- 색은 면 객체 `c`에 들어 있지만 UI는 전체 색 한 가지만 바꾼다(`setColor`가 모든 칸·면·중간선반판 색을 일괄 변경). (L36583, L19620, SOURCE)

### 5.4 조합 검증 — `handleShelfEdit` (L37764)

플래그: `u`=자물쇠 불가, `d`=중간선반판 불가, `p`=케이블구멍 숨김, `f`=작은 칸(폭 35, 또는 폭 50이고 깊이 25).

| 종류 | 자물쇠 | 중간선반판 | 케이블구멍 UI |
|---|---|---|---|
| NO_PANEL, NO_SIDE_PANEL | 불가(자동 제거) | 불가(자동 제거) | 숨김 |
| NO_BACK_PANEL | 불가 | `f`면 불가 | 숨김 |
| BACK_PANEL | 불가 | `f`면 불가 | 표시 |
| DROP_DOWN_DOOR | 가능 | `f`면 불가 | 표시 |
| EXTENSION_DOOR(_DRAWER) | 가능 | 불가(자동 제거) | 표시 |

추가 규칙 (SOURCE)
- 금고: 중간선반판 불가이거나 `isSafeCompatibleSize` 아님(= 폭 75 이고 높이 ≥ 35 이고 깊이 35 또는 50)이면 불가, 이미 있으면 자동 제거. (`13lzs0_g8pri-.js` L708 부근, L37892)
- 케이블구멍 중간 줄(`MIDDLE_*`)은 높이 ≤ 18일 때 비활성(`cutoutMidDisabled`).
- 확장문 가능 여부 `extensionDoorAvailable`: 깊이 25 또는 폭 35이면 불가. 현재 칸이 이미 확장문이면 가능. 아니면 열 안에서 "바로 위나 아래가 확장문이면 가능, 그렇지 않은데 열 어딘가에 확장문이 있으면 불가, 확장문이 없으면 가능". 즉 **확장문 칸은 한 열 안에서 연속**이어야 한다.
- 깊이 25는 확장문이 있는 구성에서 비활성(`setDisableSmallDepthSelector(configurationContainsExtensionDoor)`, L38732).
- 로드 시 BOTTOM 면 자동 교정: 확장문 칸이면 BOTTOM=짧은 판(9), 아니면 판(1). (L36819, SOURCE)

---

## 6. 카메라 제어

### 6.1 구조 (L36277)

- 원근 카메라 화각 45도, near 0.1, far 4000. 시선 기본 (0,120,0), 카메라 초기 (0,140,0). (SOURCE)
- 위치: `x = radius·sin(theta)`, `z = radius·cos(theta)`, **y는 140 고정**. 수직 회전(피치) 없음. theta는 도 단위이며 **한계 없음(무한 회전)**. `radius`: 기본 500, 최소 100, 최대 805. (SOURCE L36570~36577)
- 시선 목표(`cameraLookAt`)는 칸 구성에 맞춰 `calculateCameraPosition(ms)`가 보간: `y = 가장 높은 열 높이/2 + 45`, `x = (첫 startX + 마지막 endX)/2`. 장면이 비면 기본값. (L37515, SOURCE)
- 배경: 바닥(1100x1100), 벽, 걸레받이, 조명. 우리 제품에선 무관.

### 6.2 입력별 제어

| 입력 | 동작 | 등급 |
|---|---|---|
| 마우스 드래그 | `theta = -(Δx·0.5) + theta0`, `radius = Δy·2 + radius0`(범위 밖이면 반영 안 함) | SOURCE L24661 |
| 휠 | `radius -= 17·(-sign(deltaY))`, (100,805) 열린구간 안에서만 | SOURCE L24480 |
| 터치 1손가락 | `theta = -(Δx·0.5)+theta0`, `radius = -(Δy·1.5)+radius0` | SOURCE L24674 |
| 터치 2손가락 | 거리 변화 → `radius = radius0 - 1.01·Δ거리`, 각도 변화 → `theta += 각도(도)` | SOURCE L24681 |
| 터치 더블탭(카메라 상태) | `radius - 200`이 범위면 400ms `Quartic.InOut` 확대 | SOURCE L24701 |
| 키 PageUp / PageDown | radius ∓50 (범위 클램프) | SOURCE L24230 |
| 키 ←/→ | theta ∓5 | SOURCE L24250 |
| 키 ↑/↓ | radius ∓10 (`zoomIn/Out`) | SOURCE L24258 |
| 키 Home(36) | 시점 초기화(`resetViewSettings`: radius 500, theta 0) | SOURCE L24247 |
| 편집 모드 PageUp/Down/End/↑/↓ | 막음(`preventDefault`) | SOURCE L24155 |

### 6.3 정면 뷰 스크린샷 `createSceneScreenshotFront(hideOverlay, callback)` (L37641)

```text
1) 오버레이("스냅샷 생성 중") 표시, 상태를 임시로 EDIT_IDLE 값으로 둠(입력 차단)
2) 목표 카메라: x = (startX+endX)/2 + (폭 합)*0.7, y = 2.5*(가장 높은 열/2)
              z = 화각 맞춤거리(폭 합/2+1.5+여백, 높이/2+2+여백) + 2*깊이
   (치수 표시 켜져 있으면 치수선 bbox만큼 여백 확장, 장면이 비면 z = 400)
3) 현재 카메라 → 목표로 600ms Quartic.InOut
4) 도착하면 render() 후 canvas.toDataURL() 로 캡처(캔버스 현재 크기)
5) 원래 카메라로 1000ms 복귀, 상태 복원, 콜백(data, 폭, 높이)
```
- 저장 시 캡처를 `SCREENSHOT_WIDTH 1280 × 720` 안에 종횡비 유지로 축소하고 슬롯 썸네일로 사용. (L36735, L37020, SOURCE)
- 단축키 Ctrl+`.`(190)로도 호출. (L24272, SOURCE)
- `ANIMATE_SCENE` 상태는 스크린샷에서 쓰이지 않는다. 대신 `l2`를 직접 `EDIT_IDLE`로 바꿔 입력을 막는다(상태 전이 이벤트 없음). (SOURCE) → 우리는 `isCapturing` 플래그로 분리하는 편이 깔끔하다.

### 6.4 편집·이동용 카메라 연출

| 상황 | 연출 | 시간·이징 |
|---|---|---|
| 칸 추가/이동 후 | 시선 재계산 | 400ms / 200ms / 300ms 인자, Quartic.InOut |
| 편집 진입 | 칸 정면 위쪽으로 | 600ms Quartic.InOut |
| 편집 중 다른 칸 | 칸 사이 이동 | 600ms **Sinusoidal.InOut** |
| 편집 종료 | 진입 전 위치 복귀 | 600ms Quartic.InOut + 300ms 지연 |
| 케이블구멍 편집 | 뒷면(z 부호 반전) | 600ms Quartic.InOut |
| EDIT_MOVE_CLICK 진입 | 편집 전 카메라 위치로 복귀 | 600ms Quartic.InOut |

---

## 7. 저장·불러오기 직렬화 (SAVE_FORMAT_VERSION = 5)

### 7.1 장면 JSON (`getSceneConfiguration`, L37721)

```jsonc
{
  "metadata": { "color": <ID>, "depth": 25|35|50, "dopen": <bool 문 열림>, "feet": <Feet ID>, "info": <bool 치수표시> },
  "cdata":    { "r": radius, "t": theta, "cp": [카메라x, 카메라초기y, 카메라z], "cl": [시선x,y,z] },
  "shelf":    [                       // 열 목록(왼쪽→오른쪽), 각 열은 아래→위 칸 배열
    [ { "w":75, "h":35, "d":35,
        "a": [ {"t":0}, {"t":1,"c":<색>}, {"t":2,"c":<마스크>}, {"t":3,"options":{"color":..,"lock":..}} ],
        "pc": [ {"c":<색>,"t":<SidePart>} x6 ],      // 순서 LEFT,RIGHT,TOP,BOTTOM,BACK,FRONT
        "p": [x, y, z],
        "ft": <Feet ID>              // 0(없음)이 아닐 때만, 열 맨 아래 칸에만 의미
      }, ... ]
  ]
}
```
- 열의 `toJSON`이 `elements` 배열을 반환해서 `shelf`는 "칸 배열의 배열"이 된다(startX/endX/height는 저장 안 함, 로드 시 재계산). (L23467, L36863, SOURCE)
- 칸 저장 필드: `w,h,d,a,pc,p`(+`ft`). `neighbor`, `direction`, `lastValidPosition`, 문 열림 상태(전역 `dopen`만)는 저장하지 않는다. (L19597, SOURCE)

### 7.2 서버 저장 레코드 (`saveConfiguration`, L37001)

```jsonc
{ "config": <위 장면 JSON>, "userAgent": "...", "startupTime": <초>, "configuratorTime": <초>,
  "version": 5, "slotId": "0", "img": "<dataURL 축소 스크린샷, 슬롯 저장 때만>" }
```
- 전송: `POST /api/usm/sessions/{sessionId}/configurations`, 타임아웃 6초, 자동저장은 `keepalive`. 슬롯 `"0"`이 자동저장 슬롯. (SOURCE)
- 자동저장 시점: `beforeunload`, `pagehide`, `visibilitychange → hidden`에서 직전 저장 문자열과 다를 때만. (L36972, SOURCE)
- 세션 ID는 `localStorage["usm.historyId"]`(구버전 쿠키에서 이관). 불러오기: `GET .../configurations`, 슬롯 `"0"` 자동 복원. (L37124~37168, SOURCE)
- 진입 URL 파라미터로 외부 구성 로드: `a`(articles), `c`(article-configurations), `s`(shared-configurations), `ca`(cockpit-articles), 선택적 `colorOverride`. (L39350, SOURCE)

### 7.3 로드 순서 (`uD.loadConfig/loadJson`, L36764)

```text
1) JSON 문자열이면 파싱. metadata 없으면 오류 안내
2) changeShelfConfig(color, depth): 해당 색·깊이 선반 목록(JSON)을 서버에서 받고 → 장면 비우기(clearScene)
3) cdata 있으면(이력 복원이 아닐 때) 카메라 radius/theta/위치 복원, 시선 복원
4) bottom 면 교정(확장문 ↔ 짧은 판)
5) shelf 를 열 단위로 재구성:
     열의 첫 칸: Neighbor=LEFT_RIGHT 로 생성, 열 {startX = x - 폭/2, endX = x + 폭/2, height, elements}
     나머지 칸: 열 높이 누적, 소속 열 연결
   열 정렬(startX)
6) changeFeet(feet, 강제=true) → setFeet 로 다리·이웃 재계산
7) changeGlobalDoorStatus(dopen), 바퀴 메뉴 갱신, 렌더
```
- 로드 때 칸 위치는 저장된 `p`를 그대로 신뢰한다(재스냅 없음). 유효성 재검증도 없다. → 변조된 JSON의 위험은 서버/우리 쪽 검증으로 막아야 한다. (SOURCE, 추론)

### 7.4 버전 마이그레이션 (`et.checkSaveFormat`, L405 / 함수 `ee`, L363)

| 입력 버전 | 처리 | 결과 버전 |
|---|---|---|
| 문자열 | `parseInt` | – |
| 1 | 구형: 모든 PANEL 부속 색을 `metadata.color`로 통일 → `ee` | 5 |
| 2 | `ee` | 5 |
| 3 | `metadata.color === 3`이면 `ee`(오류 로그), 아니면 변경 없음 | 5 |
| 4, 5 | 변경 없음 (4는 `version` 값도 갱신 안 함) | 4 또는 5 |

`ee`: 색 ID `3`을 `GRAPHITE_BLACK(30)`으로 일괄 치환(metadata.color, PANEL 부속 `c`, 모든 `pc[].c`). (SOURCE)
- 색 ID: `BROWN 22, RUBY_RED 23, PURE_WHITE 24, GOLDEN_YELLOW 25, PURE_ORANGE 26, GENTIAN_BLUE 27, GREEN 28, LIGHT_GREY 29, GRAPHITE_BLACK 30, BEIGE 31, MID_GREY 32, ANTHRACITE 33, STEEL_BLUE 34, MATT_SILVER 35, OLIVE_GREEN 36` (색 ID 대응표는 `0sqfjbgv28kbx.js`. 우리 제품은 자체 색 체계를 쓴다.)
- `overrideColor(config, color)`: 외부 진입 시 모든 면·PANEL 부속 색 일괄 덮어쓰기. (L379, SOURCE)

### 7.5 `Feet` 값

`FOOT_NONE 0, ADJUSTABLE_GLIDE_SMALL_15 10, ADJUSTABLE_GLIDE_NORMAL_15 20, ADJUSTABLE_GLIDE_W_15 30, CASTOR_HARD 40, CASTOR_SOFT 50`. `setFeet`는 바퀴 2종만 그대로 저장하고 나머지는 모두 `ADJUSTABLE_GLIDE_NORMAL_15`로 정규화한다(저장값 기준). (L38533, SOURCE)

---

## 8. 실행 취소 / 다시 실행, 단축키

### 8.1 이력 (`uP`, L36907)

| 항목 | 내용 | 등급 |
|---|---|---|
| 저장 단위 | `JSON.stringify(getSceneConfiguration())` 전체 스냅샷 문자열 | SOURCE |
| 구조 | `history[0]`이 최신, `historyIndex`가 현재 위치 | SOURCE |
| 상한 | 50개 (초과분은 오래된 쪽에서 잘림) | SOURCE L37098 |
| push 시점 | 칸 추가 확정 후(드래그·클릭), 이동 확정 후, 삭제 후, 편집 종료/칸 전환 시 칸 직렬화가 편집 시작 때와 다를 때, 색·깊이 변경 완료 후, 다리 변경(UI 경로) 후, 전체 초기화 후 | SOURCE |
| 되돌림 중 새 push | `historyIndex`>0이면 앞쪽(더 새로운 기록)을 버리고 맨 앞에 추가 → 일반적인 redo 폐기 | SOURCE L37095 |
| 실행 취소 | `stepBackward`: `history[idx+1]`을 전체 재로드(`load(json, true)` = 카메라 복원 안 함), 성공하면 idx 갱신 | SOURCE |
| 다시 실행 | `stepForward`: `history[idx-1]` | SOURCE |
| UI 알림 | `canBack = idx < len-1`, `canForward = idx > 0`을 `window.setHistoryNav`로 전달 | SOURCE |
| 초기화 | `clearHistory`: 서버에서 슬롯 불러온 직후 | SOURCE |

- 알려진 결함 후보(PARTIAL): MOVE_OBJECT 드롭이 **실패해도** 200ms 뒤 `pushConfiguration`이 호출되어 동일 스냅샷이 쌓인다(L24844~24849). 우리는 내용이 바뀐 경우에만 push하면 된다.

### 8.2 키보드

| 키 (keyCode) | 상태 | 동작 | 등급 |
|---|---|---|---|
| ESC (27) | 대부분 | IDLE로. 기본은 keydown, IDLE은 keyup, 편집은 `editElementStop` | SOURCE |
| ← (37) / → (39) | IDLE | 시점 회전 ∓5도 (치수표시 위치 갱신) | SOURCE |
| ↑ (38) / ↓ (40) | IDLE | 확대·축소 10 | SOURCE |
| PageUp (33) / PageDown (34) | IDLE | radius ∓50 | SOURCE |
| Home (36, `POS1`) | IDLE | 시점 초기화 | SOURCE |
| End (35) | IDLE·EDIT | 기본 동작만 막음 | SOURCE |
| Space (32) | – | 상수만 있고 사용처 없음 | SOURCE(미발견) |
| Delete (46) | EDIT_IDLE | 선택 칸 삭제 | SOURCE |
| Ctrl+Z (90) | IDLE | 실행 취소 | SOURCE |
| Ctrl+Y (89) | IDLE | 다시 실행 | SOURCE |
| Ctrl+. (190) | IDLE | 정면 스크린샷 | SOURCE |
| Ctrl/Shift+S (83) | IDLE | 부품 목록 패널 표시 | SOURCE |
| Ctrl/Shift+K (75) | IDLE | 구성 코드(JSON) 패널 표시 | SOURCE |

---

## 9. 우리가 구현할 때 필요한 최소 사양

(smow 코드 복제 없이 규칙만 독자 구현한다.)

### 9.1 데이터 모델

```ts
type Column  = { cells: Cell[] }                         // 아래→위, startX/endX/height는 파생값
type Cell    = { w: number; h: number; d: number;       // cm. d는 전역값과 같음
                 faces: [Face, Face, Face, Face, Face, Face];  // L,R,Top,Bottom,Back,Front
                 acc: { lock?: true; midShelf?: true; cutout?: 0..9; safe?: {color, lock} } }
type Scene   = { cols: Column[]; color: ColorId; depth: 25|35|50; feet: FeetId; doorsOpen: boolean }
// x좌표는 저장하지 않고 열 순서와 폭으로 계산(저장값 변조·오차 방지). y는 칸 높이 누적 + 바닥 오프셋.
```
- 파생: 열 x 중심 = 앞 열들 폭(= 각 열 바닥 칸 폭) 누적, 칸 y = 바닥오프셋 + 아래 칸 높이 합 + 자기 높이/2.
- 한 열의 모든 칸 폭 동일, 인접 열의 같은 층(인덱스) 칸 높이 동일.
- 면 종류는 우선 `없음/판/짧은 판/아래로 열리는 문/확장문/확장문+서랍`만. 유리·방음·타공·플립업은 smow도 실제 생성 안 함.

### 9.2 규칙 (순수 함수로 분리, UI와 무관)

1. `slots(scene, cell)`: 3.3 규칙. 입력 칸 + 장면 → 놓을 수 있는 위치 목록(열 인덱스·층 인덱스·좌/우/상 구분).
2. `canRemove(scene, col, idx)`: 최상단만, 그리고 (바닥층이고 양쪽 열 존재)이면 불가.
3. `canMove` = `canRemove` 와 동일 + 후보 슬롯이 자기 자리 외에 1개 이상.
4. `canStack(scene, col, cell)`: 폭·깊이 일치, 좌우 이웃 열의 같은 인덱스 칸 높이·깊이 일치, 확장문 연속, 바퀴 높이 ≤ 50.
5. `editOptions(cell, column)`: 5.4 표(자물쇠·중간선반판·금고·케이블구멍·확장문 가능 여부) 반환.
6. `applyShelfType(cell, type)`: 5.3 표로 면 6개 설정(색 유지) → 5.4로 부속 자동 정리.
7. `validate(scene)`: 로드·저장 전 전체 재검증(위 1~5 + 바닥 지지 + 열 폭 일치 + 전역 깊이 일치). smow는 로드 시 검증이 없으므로 우리는 **필수**.

### 9.3 상태 기계 (최소 6상태)

`Idle` / `MoveCamera` / `MoveCell` / `AddDrag` / `AddClick(슬롯 선택)` / `Edit`(+ `EditMove` 하위). `Capture`는 상태가 아니라 플래그.
- 전이는 2.2 표를 그대로 따르되, 입력은 Pointer Events 하나로 통일(마우스·터치·펜).
- 시간 상수(재현 목적): 끌기 의도 200ms/5px, 길게 누르기 500ms, 더블탭 터치 500·마우스 300, 추가 끌기 시작 10px, 되돌림 애니 500ms.
- 상태 진입·이탈 때 반드시 슬롯 표시 제거, 컨텍스트 메뉴 닫기, 선택 해제를 한 곳(`setState`)에서 처리.

### 9.4 카메라

- 궤도 카메라: yaw 무제한, pitch 고정, 거리 100~805(우리 단위에 맞춰 스케일), 휠 17 단위, 키보드 단축키는 6.2 표.
- 편집 진입 시 선택 칸 정면 보기(600ms), 종료 시 복귀. 스크린샷은 자동 정면 구도로 이동 → 캡처 → 복귀.

### 9.5 저장

- 버전 필드 필수, 현재 5의 구조를 참고하되 **우리 포맷은 별도 스키마(v1)** 로 정의. 위치(`p`) 저장은 생략하고 구조(열×칸×면)만 저장.
- 이력: 문자열 스냅샷 방식은 단순하고 안전하다. 상한 50, push는 내용이 바뀐 경우만.
- 자동저장은 `visibilitychange=hidden` 중심, 서버 전송은 `keepalive`.
- 저장 JSON은 서버에서 9.2의 `validate`로 재검증한 뒤 받는다.

### 9.6 가격·배송 임계값은 별도 모듈

폭/높이 200cm, 무게 80kg 초과 시 조립서비스, DHL 한도, 앵커링 세트 판정은 **편집 제약이 아니라 견적 규칙**이므로 상태 기계와 분리해 둔다. 값은 우리 공급사 기준으로 새로 정한다.

---

## 10. 읽지 못한 것 / 한계

| 항목 | 상태 |
|---|---|
| three.js 내부, 셰이더 | 범위 제외 |
| 문·서랍·확장문 3D 생성 클래스(`sx, sT, sb, sw`, `a1`, `od`) 내부 기하·열림 애니메이션 | 시그니처만 확인, 내부 미분석 |
| 부품표·가격·재고 계산(`lI`, `lr.getAvailability`, `oV/oY` 부품 번호 표) | 임계값 부분(L22740~22903)만 확인. 부품 수량 산출 로직은 미분석 |
| 선반 목록(JSON) 전체 | `35-23.json`의 폭/높이/깊이/유형 집합만 확인(폭 35/50/75, 높이 17.5/25/35, 유형 0~6의 40종). 다른 깊이·색 파일과 서버 응답의 차이는 미확인 |
| 서버 API 동작(`/api/usm/...`), 공유 구성 `s`, 장바구니 | 호출 경로만 확인 |
| React 사이드바 UI(`0pv910lfhfhfu.js`) 전체 | 문구와 일부 컴포넌트만 확인. 색·깊이·다리 선택 UI의 비활성 조건 전체는 미확인 |
| 칸 개수·전체 가로 폭 상한 | 편집 코드에서 하드 상한을 못 찾았다. 가로는 ±500 유효범위가 사실상 한계로 보이나(PARTIAL) 실제 최대치는 미검증 |
| 치수 표시(`uA`), 툴팁, 첫 사용 안내(`oU`, `InfoType`) | 미분석 (우리 UX에서 독자 설계) |
| 실제 동작 확인 | 이번 작업은 정적 분석뿐이다. 브라우저 실행·화면 비교는 하지 않았다. 따라서 위 규칙이 UI에서 의도대로 보이는지는 **미검증** |
| `P(!0)`·`O` 플래그(가격 갱신 트리거), `sS()`(프레임 갱신), 렌더 루프 | 용도만 추정(GUESS) |

---

진행 상황: 요구한 7개 항목을 모두 문서화했다. 정적 분석 결과이며 실제 화면 동작 검증은 하지 않았다.
