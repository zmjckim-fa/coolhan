# smow USM Haller 구성기 — 3D 형상 · 재질 · 조명 · 카메라 분석

- 대상: https://www.smow.de/konfigurator/usm/haller (공개 JS를 읽기 전용으로 분석, 코드 미실행)
- 읽은 파일: `smow-src/pretty/14xezdwz4pjta.js` (앱 + three.js 본체), `13lzs0_g8pri-.js`(색 정의·금고 치수), `0sqfjbgv28kbx.js`(상수 enum)
- 줄 번호는 모두 `14xezdwz4pjta.js` 기준. 다른 파일이면 파일명을 붙였다.
- 증거 등급: **SOURCE** = 코드에서 직접 읽음(줄 번호), **PARTIAL** = 이름·일부만 확인, **GUESS** = 추정.
- 이 문서는 smow 코드를 복사하지 않고 "식·수치·구조"만 기록한다. 우리 제품에는 smow의 코드·이미지·데이터·glTF·글꼴 파일을 쓰지 않는다.

## 0. 먼저 알아둘 전제

| 항목 | 내용 | 등급 |
|---|---|---|
| 3D 엔진 | three.js (WebGL2). 번들에 three 본체가 들어 있고 앱은 그 클래스를 minify 이름(`rR`=MeshStandardMaterial, `rI`=MeshLambertMaterial, `iI`=MeshBasicMaterial, `nz`=CylinderGeometry, `nB`=BoxGeometry, `rx`=SphereGeometry, `rv`=ExtrudeGeometry 등)으로 사용 | SOURCE 11443, 11647, 7662, 9071, 8939, 11210, 10703 |
| 단위 | **1 three 단위 = 1 cm**. 튜브 반지름 0.95(지름 1.9cm), 볼 반지름 1.25(지름 2.5cm), 모듈 폭 25/35/50/75 등 USM 규격과 일치 | SOURCE 16133, 18974, 0sqf Depth{25,35,50} |
| 좌표 | x=폭(좌우), y=높이(위), z=깊이(앞이 +z). 바닥은 y=0 | SOURCE 19330(앞패널 z=+halfDepth), 36317 |
| 모듈 구조 | 모듈 1개 = `oy`(Mesh 서브클래스, 투명 BoxGeometry를 충돌/클릭 영역으로 사용) + 자식으로 프레임(grid) · 패널 · 문 · 다리 · 금고 | SOURCE 19014-19064 |
| 지원하는 모듈 치수 | 튜브 지오메트리 사전이 길이 17.5 / 25 / 35 / 50 / 75 5종만 보유 → 폭·높이·깊이는 이 값만 가능 | SOURCE 16134-16175 |
| InstancedMesh 사용 | **앱 코드에서 사용하지 않음.** 번들의 `InstancedMesh` 19건은 전부 three 본체/GLTFLoader 내부. `setMatrixAt`(17131)은 glTF `EXT_mesh_gpu_instancing` 확장 처리일 뿐 | SOURCE (grep 결과 + 17131) |

## 1. 부품별 형상 생성법

### 1-1. 프레임 (파이프 + 연결구 볼) — `sM`, `o_`, `oy` 생성자

| 부품 | 생성 방식 | 치수 (cm) | 등급 |
|---|---|---|---|
| 파이프 | `CylinderGeometry(r, r, L − 2·0.9, 32, 1, openEnded=true)`. 길이 키별로 정적 5개를 미리 만들어 공유 | 반지름 0.95, 단면 32분할, 양끝 열림. 볼 중심과 튜브 끝 사이 간격 `DELTA_TUBE_TO_BALL` 0.9 | SOURCE 16133-16175 |
| 연결구 볼 | `SphereGeometry(1.25, 96, 48)`을 만든 뒤 **정점을 직접 수정**: 6축 방향(±x, ±y, ±z)과 이루는 각이 19° 이내인 정점은 반지름을 최대 25% 줄여 평평한 접시면(튜브 접합면) 생성 | 반지름 1.25, 평면부 반지름 ≈ 0.94(=1.25·0.75). 컷오프 `cos(19°)` | SOURCE 18973-19008 |
| 볼 평평화 식 | `t=(최대축코사인−cos19°)/(1−cos19°)`, `scale = 1 − smoothstep(t)·0.25` | — | SOURCE 18999-19000 |
| 프레임 조립 | 모서리 8곳에 볼, 12개 모서리에 튜브: 폭방향 4개(`rotation.z=90°`, y=±h/2, z=±d/2), 높이방향 4개(회전 없음, x=±w/2, z=±d/2), 깊이방향 4개(`rotation.x=90°`, x=±w/2, y=±h/2). 전부 `mergeGeometry`로 **한 BufferGeometry**로 합치고 크롬 재질 Mesh 1개로 렌더 | 튜브 길이 = 모듈 치수, 볼 중심 = 모듈 모서리 | SOURCE 19333-19393 |
| 바닥 간격(다리 없음) | 모듈 중심 y = 높이/2 + 1.15 | `o_.DISTANCE_TO_FLOOR` 1.15 | SOURCE 18974, 38024-38025 |

### 1-2. 패널 (측판·상판·하판·뒤판) — `a1`

| 항목 | 내용 | 등급 |
|---|---|---|
| 생성 | `BoxGeometry(폭, 높이, 0.7)` 한 장. 두께 `DEPTH` 0.7cm | SOURCE 15155-15161 |
| 배치 | 좌/우: `rotation.y=∓90°`, 위치 x=∓w/2, 크기 (깊이×높이) / 상/하: `rotation.x=∓90°`, y=±h/2, 크기 (폭×깊이) / 뒤: z=−d/2, 크기 (폭×높이) / 앞(문): z=+d/2 | SOURCE 19181-19331 |
| 병합 | 같은 색 id의 패널을 모아 `mergeGeometry`로 합친 뒤 색별 재질 Mesh 1개. `castShadow=true` (`receiveShadow`는 미설정) | SOURCE 19304-19314 |
| 문 크기 | 문 판 = (폭 − 1.5) × (높이 − 1.5). `doorOffset` 1.5 | SOURCE 15974, 16038-16042 |
| "짧은 패널" 옵션 | 생성자에 `폭 − 8` 분기가 있으나, 호출부(`PANEL_SHORTENED`, 추가 패널)는 전부 `false`를 넘겨 **실제로는 단축 안 됨** | SOURCE 15161, 19586, 19698 |
| 추가 패널 | 폭×깊이 판을 `rotation.x=90°`로 모듈 중앙에 추가(선반 판 역할) | SOURCE 19696-19701 |
| 후면 컷아웃(케이블 구멍) | `Shape` 사각형에 둥근 모서리(모서리 반지름 1)의 `Path` 구멍을 뚫고 `ShapeGeometry`로 뒤판 생성. 구멍 크기 5.8×4.3, 가장자리 여백 2. 위치 9종(좌상·중상·우상·좌중·중중·우중·중하·우하, 좌하는 기본 분기). 구멍 둘레에 `Line`(검정 라인)으로 고무 테두리 표시. 이 판만 **양면 재질**(`side:2`) | SOURCE 19016-19020, 19232-19295, 15076-15078 |

### 1-3. 문 (잠금 문, 확장 문, 서랍형 확장 문) — `sx`, `sT`, `sb`, `sw`

| 부품 | 형상 | 동작 | 등급 |
|---|---|---|---|
| 드롭다운 문 `sx` | 문 판(`a1`) + 잠금 노브 + 엔드캡. 피벗은 문 **아래쪽 모서리**(elementObject.y=−h/2) | x축 회전 0 → **60°**(π/3), 100ms Quartic.InOut tween | SOURCE 16032-16080, 16031 |
| 플립업 문 `sT` | 같은 구성, 피벗이 문 **위쪽 모서리** | 0 → **−36°**(−π/5) | SOURCE 16082-16130 |
| 확장 문 + 서랍형 `sb` ("METAL_EXTENSION_DOOR_WITH_DRAWER") | 문 판 + 바닥판(폭−4 × 깊이, y=−h/2+3) + 좌/우 옆판(깊이 × 높이−3, x=∓(w/2−3)) + 뒷판(폭−1.9 × 높이−6, z=−깊이). 5장을 `mergeGeometry`로 1개 BufferGeometry → **앞으로 빼는 상자(서랍)** 형상 | z축으로 깊이의 **0.9배** 전진(100ms tween) | SOURCE 16181-16242 |
| 확장 문 `sw` (낮은 트레이형) | 바닥판 + 옆판(높이 3) + 뒷판 띠(높이 2). 서랍보다 벽이 낮음 | 동일 전진 | SOURCE 16244-16308 |
| 서랍 손잡이 | **별도 손잡이 지오메트리 없음.** 열고 닫는 부위는 아래 잠금 노브(`aQ`)가 겸함 | — | SOURCE (문 클래스 전체에 손잡이용 mesh 없음) |

### 1-4. 잠금 노브 + 엔드캡 — `aQ`, `a0`

| 부품 | 형상 | 치수 (cm) | 등급 |
|---|---|---|---|
| 잠금 노브 `aQ` | 두 원기둥 병합: **널링(롤렛) 원기둥** `Cylinder(2,2,0.8, 분할 320, 1, 열림)`(y +1.05) + 축 `Cylinder(1.4,1.4,1.3, 32, 1, 열림)`(y +0.65). 널링은 정점을 직접 이동: 반경 += `0.055·(1+cos(80·각))/2` → 능선 80개. 병합 후 x축 90° 회전해 축이 +z를 향함 | 노브 반지름 2, 능선 깊이 0.055, 능선 수 80, 위치 y = 문높이 − 4(`DISTANCE_TOP`) | SOURCE 15099-15144 |
| 엔드캡 `a0` | `CircleGeometry(2, 32)` 원판. 노브 앞(z = 0.35 + 1.4)에 놓고 자물쇠 그림(usm-schloss 텍스처) 표시 | 반지름 2 | SOURCE 15149-15153, 16050-16056 |
| 노브·엔드캡 재질 | 노브 = `lockMaterial`(금속 회색), 엔드캡 = `lockEndcapMaterial`(텍스처 맵 기본 재질) | — | SOURCE 14947, 14982-14987 |

### 1-5. 다리 · 글라이드 · 바퀴

| 부품 | 형상 | 치수 (cm) | 등급 |
|---|---|---|---|
| 소형 글라이드 `om` | 원기둥 2개 병합: 위 `Cyl(0.75,0.75,0.9, 6분할)`(육각, y +0.45) + 아래 `Cyl(1.15,1.15,0.9, 24)`(y −0.45) | 높이 2, 바닥까지 3.1 | SOURCE 18839-18874 |
| 일반 글라이드 `of` | 3단: 육각 `Cyl(0.75,0.75,0.9,6)`(y +0.55) + 원뿔대 `Cyl(0.75→1.8, 0.6, 24)`(y −0.2) + 하단 원판 `Cyl(1.8,1.8,0.5,24)`(y −0.75) | 높이 2, 바닥까지 3.1 | SOURCE 18793-18838 |
| 글라이드 배치 | 모듈 4모서리 하단 y = −h/2 − 1 − 1.15. 4개를 병합해 Mesh 1개, 재질은 **검정 MeshBasic(조명 무시)** (`footMaterial`, 색 #000000). `ADJUSTABLE_GLIDE_W_15`는 앞 2개 `of`, 뒤 2개 `om` 혼합 | — | SOURCE 19419-19472, 14948, 15081 |
| 바퀴(캐스터) | 구성 3종 직접 수작업: ① 바퀴 `d`: 원기둥 2개(r2.75 h0.75, 원뿔대 r2.25→2.75, 분할 100)를 회전·이동 후 병합, 이를 x=0 평면 기준 **`mirrorGeometry`로 거울 복제**해 쌍바퀴 ② 브래킷 `E`: 직사각 단면(3.6×0.05)을 반원 호(반지름 2.85, 0~180°, 15점 `CatmullRomCurve3`)를 따라 `ExtrudeGeometry`(steps 100) + 줄기 `Cyl(0.8,0.8,3.4,20)` + 원판 `Cyl(0.5,0.5,0.2,20)` + 육각너트 `Cyl(0.8,0.8,0.4,6)` ③ "Look"(브레이크/이웃 연결 편) `b`: **정점 20개 + 인덱스 80개를 손으로 적은 BufferGeometry**, `computeVertexNormals` | 높이 6.8, 선반 오프셋 6.6, 바닥까지 7.9 | SOURCE 18875-18972 |
| 바퀴 재질 | 바퀴·Look = 검정 MeshBasic, 브래킷 = 크롬 재질. `CASTOR_HARD`/`CASTOR_SOFT`는 **같은 지오메트리·재질**(코드상 case 병합, 구분 없음) | — | SOURCE 19473-19575 |
| 바퀴 방향 | 모듈 방향(NORTH/EAST/WEST)에 따라 y회전 ±90°/180°, 이웃 모듈 유무에 따라 Look 편 좌/우 생략 | — | SOURCE 19498-19560 |
| 다리 상태 전환 | 다리 종류에 따라 모듈 y를 보정(예: 글라이드↔없음 3.1−1.15) | — | SOURCE 36614-36675 |

### 1-6. 금고 (Tresor) — `od`

| 항목 | 내용 | 등급 |
|---|---|---|
| 형상 소스 | **외부 glTF 모델**을 로드(`GLTFLoader`, Draco/KTX2 미설정): `/models/balzwerk/BW_Tresor_{35\|50}_{M_Schloss\|Zahlenschloss}_V2.gltf`. 열쇠형(`key`)/전자식(`electronic`) 2종 × 깊이 35·50 | SOURCE 18674-18677, 18623 |
| 폴백 | 로드 실패/로드 전에는 `BoxGeometry` 본체 + 앞판 `Box(0.86w, 0.86h, 0.06d)` + 크롬 원기둥(`Cylinder`, 24분할) 손잡이로 만든 **간이 금고** 표시 | SOURCE 18739-18752 |
| 크기 맞춤 | 메쉬 이름에 `korpus`가 든 몸체의 바운딩박스를 구해 외형 치수에 맞게 **비균등 스케일**(`scale = 목표/현재`), 중심 이동 후 컴파트먼트 안쪽 아래·뒤에 배치(뒤 간격 1.5) | SOURCE 18717-18737, 18707-18716 |
| 외형 치수(cm) | 깊이 35용 69×32×29, 깊이 50용 69×32×45 (폭×높이×깊이). 호환: 폭 75, 높이 ≥35, 깊이 35 또는 50 | SOURCE 13lzs 699-710 |
| 재질 | 메쉬 **이름 규칙**으로 재질 선택: `griff/drehknopf/schloss/schließ/blende` → 크롬, `rubber/tasten*/plakette/logo(schwarz)/plastic` → 검정 플라스틱, `led` → 발광, `beschriftung`·`logo` → 흰 인쇄 발광, 그 외(`platten` 포함) → 본체 도장색 | SOURCE 18761-18782 |
| 금고 색 | 색 id → `usmColorHex` → 본체 재질 색만 교체 (`setColor`). 기본색 id 33(앤트러사이트 #3C4250) | SOURCE 19728-19747, 13lzs 690 |

### 1-7. 열쇠 힌트 · 치수 문자

| 부품 | 내용 | 등급 |
|---|---|---|
| 자물쇠 아이콘 | `PlaneGeometry(10,10)` 한 장에 `usm-schluessel-256px-mod4.png`를 붙인 투명 기본 재질. 문 앞 `(x=10, y=잠금높이, z=2.4)`에 배치(빌보드 아님, 문과 평행). 추가/제거는 `addLockHint`/`removeLockHint` | SOURCE 15971, 16018-16029, 14974-14980 |
| 치수 표시 | 모듈 열 전체 치수를 3D로 표시: 치수선은 `Cylinder(0.5,0.5,L,8)` 3개, 글자는 `TextGeometry`(§5). 카메라가 뒤쪽에서 보면 반대편으로 회전·이동 | SOURCE 36192-36262, 36528-36556 |
| 와이어프레임 고스트 | 새 모듈 놓을 후보 자리를 `BoxGeometry` + 반투명 검정(opacity 0.3) MeshBasic으로 표시, 모서리 L자 선(`LineSegments`)으로 박스 강조(클래스 `lL`) | SOURCE 23105-23113, 15095, 22906-22927 |

## 2. 인스턴싱 · 병합

| 항목 | 내용 | 등급 |
|---|---|---|
| InstancedMesh | 앱 코드에서 **사용하지 않음** | SOURCE (grep) |
| 병합 도구 | 자체 `aB.mergeGeometry(대상, 소스)`: 소스를 복제하고 메쉬면 **월드 행렬(matrix)을 정점에 구워 넣은 뒤**, 속성 목록·인덱스 유무를 정규화(없는 속성은 0으로 채우고, 인덱스가 섞이면 `toNonIndexed`) → three의 `mergeGeometries` 호출 → 결과를 대상에 복사 | SOURCE 14457-14637 |
| 병합 단위 | ① 프레임 전체(튜브 12 + 볼 8 → 1) ② 같은 색 패널 → 색당 1 ③ 글라이드 4개 → 1 ④ 바퀴 4세트 → 2(검정/크롬) ⑤ 확장 문 5장 → 1 ⑥ 노브 2 → 1(정적 공유) ⑦ 치수문자 전체 → 1 ⑧ 글라이드 정적 지오메트리(여러 원기둥 → 1) | SOURCE 19304-19393, 19442-19574, 16190-16205, 15138-15139, 36225-36261 |
| 병합 이유 | 코드에 이유가 적혀 있지 않다. 구조상 (a) 모듈당 draw call 감소, (b) 같은 재질로 묶어 색 변경 시 Mesh 재질만 교체(`changeMaterial`)하려는 의도로 보인다 | PARTIAL / GUESS |
| 정적 공유 지오메트리 | 노브(`aQ.geometry`), 엔드캡(`a0.geometry`), 튜브 5종, 볼, 글라이드는 `static` 필드로 **한 번만 생성해 모든 모듈이 공유** | SOURCE 15111-15154, 16134-16175, 18975-19004, 18825-18870 |
| 메쉬 이름 | 문 `a1`/노브 등은 `instanceof`로 구분해 `changeMaterial`에서 선택 교체 (이름 규칙 아님) | SOURCE 15979-15992, 19620-19641 |

## 3. 재질

### 3-1. 재질 종류와 파라미터

| 용도 | 클래스 | 파라미터 | 등급 |
|---|---|---|---|
| 도장 패널·문 (15색 × 2벌) | `MeshStandardMaterial` | `color`=색 hex, `metalness 0`, `roughness 0.35`, `flatShading true`, `normalMap`=절차 생성 노이즈, `normalScale (0.07, 0.07)`. 2벌째(`elementMaterialDs`)는 `side: DoubleSide`(컷아웃 뒤판용) | SOURCE 15067-15080 |
| 프레임(크롬 파이프·볼) | `MeshStandardMaterial` = `connectorMaterial` = `chromeMaterial` | `map`=`metal.png`(repeat 1×1, anisotropy 16), `color #E3DEDB`, `metalness 1`, `roughness 0.22`, `envMapIntensity 0.2`, **envMap 별도 주입(3-3)** | SOURCE 14988-15001 |
| 잠금 노브 | `MeshStandardMaterial` | `color #D6D6D6`, `metalness 1`, `roughness 0.3`, `envMapIntensity 0.13`, `flatShading false`, 솔질 금속풍 `normalMap`(절차 생성), `normalScale (0.15,0.15)`, envMap 별도 주입 | SOURCE 15083-15091, 14947 |
| 엔드캡 | `MeshBasicMaterial` | `map`=`usm-schloss-256px-mod6-quer.png` | SOURCE 14982-14987 |
| 열쇠 아이콘 | `MeshBasicMaterial` | `map`=`usm-schluessel-256px-mod4.png`, `transparent` | SOURCE 14974-14980 |
| 다리 | `MeshBasicMaterial` | `color #000000` (조명 영향 없음) | SOURCE 15081, 14948 |
| 컷아웃 고무 테두리 | `LineBasicMaterial` | `color #333333`, `linewidth 2.5`(WebGL에서는 무시되어 실제 1px) | SOURCE 15092, 14949 |
| 일반 선(`lineMaterial`, 사용처는 38367 부근에서 전달만 확인) | `LineBasicMaterial` | `color #171312` | SOURCE 15082, 14863 / 용도 PARTIAL |
| 레이캐스트용 투명 | `MeshBasicMaterial` | `opacity 0, transparent, alphaTest 0.5` (모듈 외곽 Box에 사용) | SOURCE 15093, 19064 |
| 와이어프레임 고스트 | `MeshBasicMaterial` | `color`=선택 색(흰색·밝은회색이면 매트실버로 대체), `opacity 0.3`, `transparent` | SOURCE 15095, 35907-35913 |
| 치수 글자 | `MeshBasicMaterial` | `color #444444` | SOURCE 15094, 14866 |
| 금고(glTF 적용 재질) | `MeshStandardMaterial` 5종 | 본체 `metalness 0.45 / roughness 0.55 / polygonOffset`, 크롬 `#E6E8EA, 0.7 / 0.15`, 검정 플라스틱 `#1A1A1A, 0.2 / 0.6`, LED `emissive`, 인쇄 `emissive white 0.2` | SOURCE 18639-18670 |
| 바닥 | `MeshLambertMaterial` | `map`=`512_3.png`(repeat 11×11, anisotropy 16), `color #D9D6D5`, `receiveShadow` | SOURCE 36310-36320 |
| 벽 | `MeshLambertMaterial` | `color #FCF9F2`, `map`=**캔버스로 생성한 벽지 텍스처** | SOURCE 36364-36402 |
| 걸레받이 | `MeshLambertMaterial` | `color #F7F2E9`, 캔버스 생성 텍스처, `castShadow`+`receiveShadow` | SOURCE 36403-36447 |

### 3-2. "금속(크롬)"과 "도장면"을 표현하는 방식

| 구분 | 방식 | 등급 |
|---|---|---|
| 크롬 | PBR 금속(`metalness 1`, 거칠기 0.22) + 텍스처 `metal.png`(금속 질감, 아래 §3-4) + **전용 환경맵**(스튜디오 방 PMREM, §3-3). 환경맵 세기는 0.2로 낮춤 → 과한 반사 방지 | SOURCE 14993-14999, 36448-36463 |
| 도장면(파우더코팅) | 비금속(`metalness 0`) + 거칠기 0.35 + 미세한 **절차 생성 노멀맵**(강도 0.07)로 거칠한 도장 질감 + `flatShading true`(면 단위 음영, 각진 판에서 평평한 느낌). 환경맵 없음 → 하이라이트는 직접광(방향광)에서만 | SOURCE 15067-15075, 36098-36129 |
| 노멀맵 만드는 법(도장) | 값 노이즈 격자 2겹(32×32 가중 0.4, 64×64 가중 0.6, 시드 `0x12345678`, smoothstep 보간)을 256² 높이맵으로 합치고, 소벨 필터로 노멀 RGBA 텍스처화. 반복 16×16, 래핑 Repeat, 밉맵 선형 | SOURCE 15007-15040, 14807-14844 |
| 노멀맵 만드는 법(노브) | 시드 `0xdeadbeef`로 열 방향 노이즈(0.5) + 64주기(0.3) + 32주기 행 노이즈(0.2)를 합쳐 256² 높이맵 → 소벨. 반복 4×1 (솔질 금속의 가로결 느낌) | SOURCE 15041-15066 |
| 색 변경 | 15색 재질을 **초기에 전부 생성**해 두고(두 벌), 색 선택 시 Mesh의 `material`만 교체. 재질 객체를 새로 만들지 않음 | SOURCE 14868-14946, 36583-36596 |

### 3-3. 환경맵(envMap) 출처

| 항목 | 내용 | 등급 |
|---|---|---|
| 출처 | **이미지/HDR 파일이 아님.** 코드에서 만든 작은 방(Scene)을 `PMREMGenerator.fromScene(scene, sigma=0.04)`로 구워 `texture`를 얻음 (생성기는 바로 `dispose`) | SOURCE 36448-36450 |
| 방 구성 | 바깥 박스 40×30×40(`BackSide`, `MeshStandardMaterial #cccccc`) 안에 **발광 박스 5개**(MeshLambert, color 검정, `emissive` 흰색, 세기 큼): 천장 14×0.1×14 @ y14 (260), 앞 18×6 @ z=+18, y9 (260), 뒤 18×9 @ z=−18, y8 (380), 좌·우 0.1×8×12 @ x=±18, y6 (290). 소프트박스 조명 스튜디오를 흉내냄. 박스 `uv` 속성 삭제 | SOURCE 36081-36097 |
| 적용 대상 | `connectorMaterial`(크롬 프레임)과 `lockMaterial`(노브)에만 `.envMap` 지정. 텍스처 로딩이 끝나기 전엔 80ms 간격으로 재시도 | SOURCE 36451-36463 |
| scene.environment | 설정하지 않음 → 도장 패널·바닥·벽에는 IBL 없음 | SOURCE (앱 코드 내 대입 없음, grep) |
| 배경 | `scene.background` 미사용. `renderer.setClearColor("#ffffff", 1)`; 실제 배경은 벽/바닥 지오메트리 | SOURCE 35810 |

### 3-4. 텍스처 파일 용도 (서버 경로 `/configurator/usm/haller` + …)

| 파일 | 용도 | 등급 |
|---|---|---|
| `/images/metal.png` | 크롬 프레임 `map`. 내용(그라데이션/브러시 패턴 등)은 **이미지를 받지 못해 확인 불가**. `color #E3DEDB`로 곱해짐 | SOURCE(사용처) / 내용 GUESS |
| `/images/256/usm-schluessel-256px-mod4.png` | 열쇠 아이콘 (잠금 힌트 판) | SOURCE 14975 |
| `/images/256/usm-schloss-256px-mod6-quer.png` | 엔드캡 원판의 자물쇠 그림 | SOURCE 14982 |
| `/images/512_3.png` | 바닥 텍스처 (11×11 타일링) | SOURCE 36310 |
| `/fonts/droid_sans_regular.typeface.json` | three.js 타입페이스 글꼴 (치수 글자) | SOURCE 14965 |
| `/models/balzwerk/BW_Tresor_*_V2.gltf` | 금고 3D 모델 (Balzwerk 제작 모델, 제3자 자산) | SOURCE 18676 |
| `/configs/{깊이}-{색}.json` | 구성 데이터(형상이 아님) | SOURCE 38038-38039 |

### 3-5. 색 id → hex (`usmColorHex`) 와 15색

`usmColorHex(id)`는 `COLORS`에서 `id`가 같은 항목을 찾아 `colorCode`의 `#`을 떼어 `parseInt(…,16)` 정수로 반환, 없으면 `undefined` (13lzs0_g8pri-.js 893-898, SOURCE). 모듈 색 상수(`Z.Color`)는 0sqfjbgv28kbx.js의 `Color` 객체와 id가 일치한다.

| id | 이름(코드 상수) | hex | 비고 | 등급 |
|---|---|---|---|---|
| 24 | PURE_WHITE (Reinweiß) | `#FCF9F2` | 테두리색 `#D9D5C4`; `USM_PURE_WHITE`로 벽 색에도 재사용 | SOURCE |
| 29 | LIGHT_GREY | `#B5BBB7` | | SOURCE |
| 35 | MATT_SILVER | `#9CA1A5` | | SOURCE |
| 32 | MID_GREY | `#5C666F` | | SOURCE |
| 33 | ANTHRACITE | `#3C4250` | 금고 기본색 | SOURCE |
| 30 | GRAPHITE_BLACK | `#000000` | | SOURCE |
| 34 | STEEL_BLUE | `#001E42` | | SOURCE |
| 27 | GENTIAN_BLUE | `#004A87` | | SOURCE |
| 28 | GREEN | `#0F9929` | | SOURCE |
| 36 | OLIVE_GREEN | `#424B2D` | | SOURCE |
| 25 | GOLDEN_YELLOW | `#F0AC01` | | SOURCE |
| 26 | PURE_ORANGE | `#CC641B` | | SOURCE |
| 23 | RUBY_RED | `#9A0000` | | SOURCE |
| 22 | BROWN | `#322512` | | SOURCE |
| 31 | BEIGE | `#9B8C6D` | | SOURCE |

(이 hex는 화면 표시용 근사값이다. 실제 USM 색 번호/RAL 대응은 USM 공식 자료로 별도 확인해야 하며, 이 코드만으로는 알 수 없다. 이 항목은 GUESS.)

## 4. 렌더러 · 조명 · 그림자 · 톤매핑 · 카메라

### 4-1. 렌더러 설정

| 항목 | 값 | 등급 |
|---|---|---|
| 생성 옵션 | `antialias: true`, `alpha: false`, 기존 `<canvas id="mainCanvas">` 사용. (메인 캔버스 외 캔버스만 `preserveDrawingBuffer: true`) | SOURCE 35806-35808 |
| pixelRatio | `window.devicePixelRatio \|\| 1` (**상한 없음**) | SOURCE 35809 |
| 배경색 | `setClearColor("#ffffff", 1)` | SOURCE 35810 |
| 톤매핑 | `toneMapping = 7` → three의 **NeutralToneMapping** (번들의 톤매핑 표에서 7=Neutral로 확인), `toneMappingExposure = 0.92` | SOURCE 35811-35812, 28592-28600 |
| 출력 색공간 | three 기본(sRGB). 파일 텍스처는 `colorSpace = sRGB`로 지정 | SOURCE 14451, 34197 |
| 그림자 | `shadowMap.enabled = true`, `shadowMap.type = 3` → **VSMShadowMap** (번들의 그림자 타입 표 `{1:PCF, 3:VSM}`에서 3=VSM) | SOURCE 36306-36307, 28695 |
| 리사이즈 | 컨테이너 크기가 바뀔 때만 `setSize` + `aspect` 갱신 | SOURCE 35917-35925 |
| 스크린샷 | 렌더 직후 `canvas.toDataURL()` (메인 캔버스는 `preserveDrawingBuffer` 꺼짐 → 같은 틱에 렌더+캡처) | SOURCE 37637-37640 |

### 4-2. 조명 (총 7개: 반구광 1 + 방향광 6, 앰비언트 없음)

| 광원 | 색 | 세기 | 위치 | 그림자 | 등급 |
|---|---|---|---|---|---|
| HemisphereLight | 하늘 `#fdfcfa` / 땅 `#dcdcdc` | 2.2 | (0, 1000, 0) | — | SOURCE 36100 |
| 주광 DirectionalLight | `#ffffff` | 2.4 | (0, 1700, 300) | **castShadow**, 맵 2048², `bias −0.0005`, `radius 1`, `blurSamples 12`, 그림자 카메라 직교 ±1500, near 100, far 3000 | SOURCE 36102-36117 |
| 앞 보조 | `#faf6ec` | 0.2 | (0, 600, 1800) | 없음 | SOURCE 36119-36120 |
| 좌·우 앞 보조 | `#eef2fa` | 0.4 ×2 | (−1300, 500, 1100) / (1300, 500, 1100) | 없음 | SOURCE 36121-36124 |
| 좌·우 뒤 보조 | `#e6ecff` | 0.45 ×2 | (−800, 500, −800) / (800, 500, −800) | 없음 | SOURCE 36125-36128 |

- 위 세기 값은 이 three 버전의 물리 단위(조명 세기 보정 없음) 기준이다. 다른 three 버전에서는 같은 숫자가 다르게 보일 수 있다 (GUESS).
- 따뜻한 주광 + 차가운 보조광(`#eef2fa`, `#e6ecff`)으로 색온도 대비를 줌. (PARTIAL: 의도는 코드에 없음, 색 값은 SOURCE)

### 4-3. 장면 환경 (바닥·벽)

| 요소 | 형상 | 치수 (cm) | 등급 |
|---|---|---|---|
| 바닥 | `BoxGeometry(1100, 1100, 6)`를 `rotation.x=−90°`, y=−3 (윗면이 y=0). 그림자 받음 | 11m × 11m | SOURCE 36309, 36316-36320 |
| 벽 4면 | `PlaneGeometry(1100, 1100)` 4장(뒤 z=−550, 앞 z=+550(뒤집음), 좌 x=−550, 우 x=+550). 벽 4장은 병합 1 Mesh | 11m 정육면체 방 | SOURCE 36323-36351, 36398-36402 |
| 걸레받이 | `BoxGeometry(1100, 8, 3)` 4개, y=4, 벽 안쪽 2cm 위치(±548), 병합 1 Mesh | 높이 8, 두께 3 | SOURCE 36324, 36332-36356, 36441 |
| 벽지 텍스처 | 512² 캔버스: 픽셀 251~255 무작위 회색 노이즈 + `multiply` 합성으로 반지름 30~90px 연한 얼룩 120개(알파 0.005~0.015). Repeat 4×4, anisotropy 8, sRGB | — | SOURCE 36364-36397 |
| 걸레받이 텍스처 | 512×64 캔버스: 열마다 사인파 4개(주기 3·7·13·23) 합성으로 밝기 변화(기준 248.5) + 무작위 ±1.5 잡음. Repeat 6×1 | — | SOURCE 36403-36440 |
| 투명 레이캐스트 판 | `RESTRICT_MOVEMENT`가 true라 z=0, y=550에 1100² 투명 평면(클릭 판정용) 추가 | — | SOURCE 36357-36363, 0sqf RESTRICT_MOVEMENT=true |

### 4-4. 카메라

| 항목 | 값 | 등급 |
|---|---|---|
| 종류 | `PerspectiveCamera`. (`OrthographicCamera` 분기도 생성자에 있으나 메인 장면은 `false`를 넘겨 쓰지 않음) | SOURCE 35816-35829, 36295 |
| 시야각 / near / far | **45° / 0.1 / 4000** | SOURCE 36294-36298 |
| 초기 위치 | 설정값 (0, 140, 0) 이지만 매 프레임 `x = r·sin(θ)`, `z = r·cos(θ)`로 덮어씀 → 처음엔 **(0, 140, 500)**, y는 140 고정 | SOURCE 36299-36300, 36573-36575 |
| 시선 대상 | 초기 (0, 120, 0). 가구가 있으면 `(열 중심 x, 최대높이/2 + 45, 0)`으로 300ms Quartic.InOut tween | SOURCE 36299, 37515-37540 |
| 궤도 | OrbitControls **미사용**, 직접 구현. 거리 기본 500, **최소 100 / 최대 805**, 방위각 θ(도) 기본 0. 위아래 기울임 없음(y 고정) | SOURCE 36278-36282 |
| 입력 | 마우스 드래그 가로: `θ = −Δx·0.5 + 시작θ`, 세로: `반경 = Δy·2 + 시작반경`(범위 안일 때만) / 휠: 반경 −17×(±1) / 버튼: 회전 3~5°, 줌 10 / 터치 핀치: 두 손가락 거리·각도로 반경·θ 동시 변경 | SOURCE 24655-24665, 24480-24483, 39127-39160, 24684-24692 |
| 정면 스크린샷 카메라 | x = 가구 열 중심 + 폭×0.7, y = 2.5 × (시선높이−45), z = 화면 맞춤 거리(아래 식) + 2×깊이, 600ms tween 후 캡처 → 1000ms로 원위치 | SOURCE 37641-37735 |
| 화면 맞춤 거리 | `max( 높이/tan(fov/2), 폭/tan(atan(tan(fov/2)·aspect)) )`, 최소 105 (`oD`) | SOURCE 20519-20527 |

## 5. 3D 텍스트 · 자물쇠 아이콘

| 항목 | 내용 | 등급 |
|---|---|---|
| 글꼴 | `droid_sans_regular.typeface.json` (three 타입페이스 JSON). 자체 `FontLoader`/`Font`/`TextGeometry` 사본을 번들에 포함 | SOURCE 14692-14802, 36130-36151, 14965 |
| 글자 지오메트리 | `ExtrudeGeometry` 기반. `size 6`, `depth 0.2`, `curveSegments 4`, 일반은 `bevelEnabled false`, 제목은 `bevelThickness/Size 0.02` | SOURCE 36153-36177 |
| 표시 내용 | 제목, "폭/높이/깊이" 라벨 + 값(단위 포함). 값이 정수가 아니면 `Intl` 형식(CHF면 de-CH) 사용. 다리가 있으면 높이에 다리 높이(+2/+6.8 등)를 더해 표기 | SOURCE 36192-36262 |
| 렌더 | 치수선 3개(원기둥)와 글자를 모두 `mergeGeometry`로 합쳐 **Mesh 1개**, 재질 `#444444` MeshBasic. 장면에 `add`/`remove`하며, 제거 시 `geometry.dispose()` | SOURCE 36261, 36557-36563 |
| 자물쇠 아이콘 | 3D 글자가 아니라 **텍스처 평면**(1-7 참조). 노브 위 엔드캡에도 자물쇠 그림 텍스처 원판 | SOURCE 14974-14987, 16018-16029 |

## 6. 성능 기법

| 기법 | 내용 | 등급 |
|---|---|---|
| 필요할 때만 렌더 | `requestAnimationFrame` 루프는 항상 돌지만 매 프레임 `render()`를 부르지 않음. 조건: ① "dirty 플래그"(`sR`)가 켜져 있을 때 ② 진행 중인 tween이 있을 때 ③ 편집/이동 등 비유휴 상태일 때 ④ 유휴 상태에서도 **1초에 1번** 강제 갱신. 나머지는 프레임을 건너뜀 | SOURCE 37476-37499 |
| dirty 플래그 | 색·다리·문·치수·텍스처 로드 완료 등 26곳에서 `sR = true`로 렌더 요청 | SOURCE (`sR = !0` 26건) |
| 재질 재사용 | 재질은 시작 시 1세트만 만들고 모든 모듈이 공유. 색 변경은 Mesh `material` 교체 | SOURCE 14868-14950, 19620-19641 |
| 지오메트리 병합 | §2 참조 | SOURCE |
| 정적 지오메트리 공유 | §2 참조 | SOURCE |
| dispose | 모듈을 장면에서 뺄 때 `traverse`로 **지오메트리만** `dispose()` (`uC`). 재질·텍스처는 공유라 해제하지 않음. PMREM 생성기는 `fromScene` 직후 `dispose()` | SOURCE 36270-36276, 36450 |
| 공유 지오메트리 dispose 부작용 | `uC`가 모듈이 쓰던 정적 공유 지오메트리(튜브·볼·노브 등)까지 dispose함. three는 다음 사용 시 GPU 버퍼를 재업로드하므로 오류는 아니나 불필요한 재업로드가 생길 수 있음 | PARTIAL (코드 SOURCE, 영향은 GUESS) |
| 비동기 로드 | 글꼴 1 + 텍스처 3(열쇠·자물쇠·metal)이 모두 끝나면 완료 콜백. 실패해도 카운터는 진행(앱이 죽지 않음). 금고 glTF는 폴백 박스를 먼저 보여주고 로드되면 교체 | SOURCE 14951-15004, 18671-18702 |
| 이벤트 큐 | 상태 머신용 700ms 주기 `setInterval` 큐. 3D 성능과 무관 | SOURCE 19779-19843 |
| LOD | **사용하지 않음** (LOD 클래스 호출 없음) | SOURCE (앱 영역 확인) |
| 프러스텀 컬링/오클루전 | three 기본 컬링만. 별도 구현 없음 | PARTIAL |
| 텍스처 필터 | 도장 노멀맵: `LinearMipmapLinear` 확대 `Linear`, 밉맵 생성. 바닥·크롬 텍스처 anisotropy 16 | SOURCE 14833-14843, 14992, 36314 |
| 그림자 비용 | 주광 1개만 그림자, 맵 2048², VSM 블러. 패널 병합 메쉬는 `castShadow`만, 바닥·벽만 `receiveShadow`(모듈끼리 자기 그림자 없음) | SOURCE 36102-36108, 19313 |

---

## 7. 우리가 구현할 때 필요한 최소 사양

smow 코드는 쓰지 않고, 아래 "수치·구조"만 참고해 직접 짠다. three.js 자체(MIT)는 사용 가능하나 버전은 우리 쪽에서 고정한다.

1. **단위와 좌표**: 1단위 = 1cm, y 위. 치수 키는 USM 규격(폭 25/35/50/75, 높이 17.5/25/35/50/75, 깊이 25/35/50)으로 제한하고 `{키 → 튜브 지오메트리}` 사전을 미리 만든다.
2. **프레임**: 튜브 `CylinderGeometry(0.95, 0.95, L−1.8, 32, 1, true)` 12개 + 볼 8개(`SphereGeometry(1.25, 96, 48)` → 6축 ±19° 안 정점을 최대 25% 줄여 평평하게). 모듈당 1 BufferGeometry로 병합, 크롬 재질 1개.
3. **패널**: `BoxGeometry(면 크기, 0.7)`. 문은 (폭−1.5)×(높이−1.5). 같은 색은 병합해 색별 1 Mesh.
4. **문**: 드롭다운(아래 피벗, 60°), 플립업(위 피벗, −36°), 확장 문(깊이×0.9 전진, 5장 병합 서랍 상자). 노브 = 널링 원기둥(반경 2, 능선 80) + 엔드캡 원판(반경 2).
5. **다리**: 소형·일반 글라이드(육각+원기둥 병합, 바닥 간격 3.1), 바퀴(자체 모델링 필요). 다리 종류별 모듈 y 보정값(3.1/1.15/7.9)을 표로 둔다.
6. **재질**: 도장 = Standard(`metalness 0`, `roughness 0.35`, 절차 노멀맵 강도 0.07, flatShading). 크롬 = Standard(`metalness 1`, `roughness 0.22`, envMapIntensity 0.2~0.3). 색은 15색 재질을 미리 만들고 교체 방식으로 변경.
7. **환경맵**: 이미지 없이 "발광 박스로 만든 작은 스튜디오 방"을 `PMREMGenerator.fromScene(방, 0.04)`로 굽고, 크롬·금속 재질에만 적용(도장면엔 적용하지 않음).
8. **조명**: 반구광 1(약 2.2) + 그림자 주광 1(약 2.4, 2048² 맵, VSM) + 색온도 대비 보조광 5(약 0.2~0.45). 세기는 사용하는 three 버전에서 화면으로 보며 재조정.
9. **렌더러**: `antialias true`, `toneMapping = NeutralToneMapping`, `exposure ≈ 0.92`, `shadowMap VSM`, `pixelRatio`는 우리 쪽에서 상한(예: 2)을 둔다(smow는 무제한이라 고해상도 단말에서 부하).
10. **카메라**: 원근 45°, near 0.1 / far 4000, 거리 100~805(기본 500), 방위각만 회전(y 고정 140), 시선 높이 = 최대높이/2+45. 가구 크기에 맞춘 "화면 맞춤 거리" 식 사용.
11. **성능**: 변경이 있을 때만 렌더(dirty 플래그 + 활성 tween 감지 + 1초 주기 유휴 갱신), 정적 지오메트리 공유, 재질 공유. 모듈 제거 시 **공유 지오메트리는 dispose하지 말 것**(smow의 불필요 재업로드 회피).
12. **자산은 직접 제작**: 금속 텍스처, 바닥 텍스처, 자물쇠·열쇠 아이콘, 글꼴(smow는 Droid Sans 타입페이스), 금고 3D 모델은 smow 자산을 쓰지 않고 새로 만들거나 별도 라이선스 자산을 쓴다. 금고 모델은 제3자(Balzwerk) 제작물이다.
13. **USM 형상의 법적 검토**: USM Haller의 형상은 상표/디자인 보호 이슈가 있을 수 있다. 이는 코드 분석 범위 밖이며 별도 검토가 필요하다(운영자가 라이선스 문제 없다고 진술한 바 있으나 이 문서에서 확인하지 않음).

## 8. 읽지 못한 것 · 확인하지 못한 것

| 항목 | 이유 / 상태 |
|---|---|
| 이미지 파일 내용 (`metal.png`, `512_3.png`, 열쇠·자물쇠 PNG) | 로컬에는 JS 청크와 JSON만 있고 이미지·glTF·글꼴 파일 자체는 없음. 사용처와 파라미터만 확인. `metal.png`가 무슨 패턴인지는 GUESS |
| 금고 glTF 모델 내부 (메쉬 이름 전체, 폴리곤 수, 텍스처) | 파일 없음. 재질 매핑 규칙(이름 포함 문자열)만 코드에서 확인 |
| `35-23.json` | base64 PNG 썸네일 모음(키 `75-35-6` 형식)으로 보이며 3D 형상 정보가 아님. 내용 해독 안 함 (PARTIAL) |
| `accessory-variants.json`, `stocks.json` | 부속 품번/재고 데이터로 보임, 3D와 무관해 읽지 않음 |
| 바퀴 "Look" 편(`b`)의 정확한 기능 | 정점 20개 손제작 메쉬임만 확인. 브레이크 레버인지 이웃 연결 편인지는 이름뿐이라 GUESS (PARTIAL) |
| `CASTOR_HARD`/`CASTOR_SOFT`의 시각적 차이 | 코드상 같은 분기라 차이 없음. 상품 차이는 가격/품번 쪽에 있을 가능성 (GUESS) |
| three.js 정확한 버전 | 번들 문자열로 보아 최신(r18x) 계열이나 번호를 직접 확인하지 못함. 톤매핑 표에 Neutral이 있고 PCFSoft가 없음 (PARTIAL) |
| 실제 화면 렌더 결과 비교 | 코드를 실행하지 않는 조건이라 smow 화면과의 시각 비교는 하지 않음. 조명 세기·톤 결과는 화면 확인 전까지 추정 |
| USM 색 번호와 RAL/실제 도장색의 대응 | 이 코드는 화면 표시용 hex만 가짐 |
| 모듈 배치 규칙·충돌 검사·가격 로직 | 이번 범위(3D 형상·재질·조명·카메라) 밖이라 읽지 않음 |
| 다른 파일의 3D 사용 가능성 | `14xezdwz4pjta.js` 외 청크(`16l68a6xea221.js`, `2p714bs_kjvh6.js` 등)의 3D 관련 코드는 확인하지 않음 |

검증 상태: 이 문서는 코드를 읽어 정리한 것이며 실행·렌더 검증은 하지 않았다. 따라서 "완료"가 아니라 "분석 진행 보고" 수준이다. 수치는 줄 번호로 재확인할 수 있다.
