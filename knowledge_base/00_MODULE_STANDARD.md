# 모듈 표준 (Module Standard)

> 구동 문서. 운영자가 2026-11-22 지시한 것을 표준으로 적었다: «각 모듈마다 이름을 주고 그 모듈을 각 폴더에 넣어서 필요한 기능을
> 하위폴더에 넣는다. 다른 모듈도 하위폴더의 구성을 동일하게 하면 나중에 덮어 씌울 때도 좋다. 화일명도 규칙이 있어야 한다. 이런
> 규칙들이 세워져야 모듈이다.» «다른 세션이나 폴더에서 새로운 사이트를 만들 때 필요한 모듈을 갖다가 쓸 수 있어야 하고, 모듈이 과거의
> 것이면 고도화된 모듈을 붙여 써서 최신 기능을 쓸 수 있어야 한다. 워드프레스의 모듈처럼 쓴다.»
> 형식은 `scripts/module-check.js`가 검사하고, 설치와 갱신은 `scripts/modules.js`가 한다. 이 문서에는 줄표 문자를 쓰지 않는다.

## 1. 모듈이란

모듈은 이름 하나, 폴더 하나, 매니페스트 하나를 가진 기능 단위다. 어느 프로젝트 폴더에서든 이름으로 가져다 쓰고, 새 판이 나오면 그
폴더를 통째로 바꿔 끼운다. 그러려면 세 가지가 지켜져야 한다.

1. 모듈 폴더 안에는 프로젝트마다 달라지는 것이 없다. 달라지는 값은 설정으로 받는다.
2. 모든 모듈의 하위 폴더 구성과 파일 이름 규칙이 같다.
3. 다른 모듈은 선언한 이름과 창구(어댑터)로만 쓴다. 남의 폴더 안을 직접 가져오지 않는다.

## 2. 이름

| 규칙 | 내용 | 예 |
|---|---|---|
| 형식 | 영문 소문자, 숫자, 붙임표. `영역-기능` 순서. 2낱말 이상 4낱말 이하 | `member-signup`, `customs-hs-codes`, `address-postcode`, `docforms-numbering` |
| 유일 | 저장소 안에서 이름은 하나뿐이다. 폴더 이름과 매니페스트의 `name`이 같다 | `modules/member-signup/module.json`의 `name`은 `member-signup` |
| 금지 낱말 | 이름과 파일 이름에 `utils`, `helpers`, `common`, `misc`, `lib`, `stuff`, `temp`, `tmp`, `new`, `old`, `copy`, `final`을 쓰지 않는다 | `member-utils`는 이름이 아니다 |
| 사이트 이름 | 이름에 사이트나 회사 이름을 넣지 않는다. 디자인 모듈만 예외다(`design-<체계 이름>`) | `design-kleinanzeigen` |

## 3. 폴더 구성 (모든 모듈이 같다)

```
<모듈 이름>/
  module.json     매니페스트 (4절)
  README.md       무엇을 하는가, 설치, 설정, 창구
  CHANGELOG.md    판마다 한 항목
  core/           순수 규칙. 프레임워크와 DB를 가져오지 않는다. 진입점 core/index.<확장자>
  api/            서버 처리(요청을 받아 core를 부른다). 진입점 api/routes.<확장자>
  user/           사용자 화면
  admin/          관리자 화면
  db/             스키마 조각, 시드. db/schema.<sql|prisma>, db/seed.<sql|json>
  text/           화면 문구 사전. text/<언어>.json
  style/          토큰과 모양. style/tokens.css
  adapters/       밖으로 나가는 창구와 다른 모듈을 부르는 창구
  test/           시험
  docs/           명세, 화면 구성, 결정
```

- 하위 폴더 이름은 위 열 가지뿐이다. 다른 이름의 폴더를 모듈 바로 아래에 만들지 않는다.
- 해당하지 않는 부분은 폴더를 만들지 않고 매니페스트의 `parts`에 그 부분이 없는 이유를 글로 적는다.
- «한 세트» 규칙: 화면이 있는 기능은 `user`, `admin`, `api`를 함께 갖는다. 하나가 빠지면 이유를 적는다.
- 프로젝트가 모듈을 고쳐 쓰고 싶으면 모듈 폴더 밖에서 덮어쓴다(설정, 프로젝트의 자기 파일). 모듈 폴더 안을 고치면 갱신할 때
  충돌로 보고된다.

## 4. 매니페스트 `module.json`

| 칸 | 필수 | 내용 |
|---|---|---|
| `name` | 예 | 폴더 이름과 같다 |
| `version` | 예 | `주.부.수` 세 숫자. 깨지는 변경은 주, 기능 추가는 부, 고침은 수. 쓰는 쪽이 구현하거나 넘기는 타입에 필수 칸이나 필수 속성이 생기면 깨지는 변경이다(동작이 그대로여도) |
| `label` | 예 | 사람이 읽는 이름 한 줄 |
| `summary` | 예 | 무엇을 하는가 한두 문장 |
| `area` | 예 | 영역 낱말 하나(`member`, `customs`, `design` 등). 이름의 첫 낱말과 같다 |
| `stack` | 예 | `none`(순수, 어느 스택에서나 쓴다) 또는 스택 이름(`next14-nest-prisma` 등) |
| `parts` | 예 | 열 부분마다 `true`, 또는 없는 이유를 적은 글. 실제 폴더와 맞아야 한다 |
| `requires` | 예 | 쓰는 다른 모듈의 이름과 판 범위. 없으면 빈 목록 |
| `provides` | 예 | 밖에 내놓는 것(함수, 경로, 화면, 테이블, 토큰) |
| `settings` | 예 | 받는 설정의 이름과 뜻. 비밀값은 이름만 적는다. 없으면 빈 목록 |
| `origin` | 예 | 어느 프로젝트의 어느 경로, 어느 커밋에서 왔는가. 모르는 칸은 `null`로 두고 `originNote`에 이유를 적는다 |
| `test` | 예 | 시험을 돌리는 명령 |
| `nameExceptions` | 아니오 | 프레임워크가 정한 파일 이름(`page.tsx`, `[id]` 등)의 목록 |

## 5. 파일 이름

| 규칙 | 내용 |
|---|---|
| 글자 | 영문 소문자, 숫자, 붙임표. 낱말은 붙임표로 잇는다. 대문자, 빈칸, 밑줄을 쓰지 않는다 |
| 뜻 | 이름은 그 파일이 하는 일을 말한다. 금지 낱말(2절)을 쓰지 않는다 |
| 시험 | 시험 파일은 `<대상>.test.<확장자>`이고 `test/` 안에 둔다 |
| 고정 이름 | `module.json`, `README.md`, `CHANGELOG.md`, `core/index.*`, `api/routes.*`, `db/schema.*`, `db/seed.*`, `text/<언어>.json`, `style/tokens.css` |
| 예외 | 프레임워크가 정한 이름은 매니페스트의 `nameExceptions`에 적은 것만 허용한다 |

## 6. 경계

- `core/`는 프레임워크, DB 클라이언트, 다른 모듈을 가져오지 않는다.
- 모듈 밖의 파일을 상대 경로로 가져오지 않는다. 다른 모듈은 `requires`에 적고 그 모듈의 `core/index`만 쓴다.
- 모듈이 `core/index` 말고 더 여는 파일이 있으면 매니페스트의 `provides.entries`에 경로를 적는다(예: 브라우저에서 쓸 수 있는 `core/rules.ts`, 다른 화면 모듈이 올라타는 `admin/list.tsx`, `text/ko.json`). 다른 모듈은 거기 적힌 파일만 더 가져올 수 있다. 적지 않은 파일은 그 모듈의 안쪽이다. `test/` 아래는 열 수 없다.
- 다른 모듈의 테이블을 직접 쓰지 않는다. 필요하면 그 모듈의 창구를 부른다.
- 환경 변수는 `settings`에 적은 이름만 읽는다.

## 6-1. 품질 기준 (운영자 지시 2026-11-22)

«회원가입 시스템과 회원관리 시스템을 사이트를 구축할 때마다 새로 만들고 있다. 이런 반복이 필요 없게 하는 것이 모듈화 작업의
목표다. 소스가 안정적이고 DB도 분리되고, 취약점이 없고, 착탈이 되는 모듈이 지속적으로 만들어지고 고도화되어야 한다.»

| 기준 | 모듈이 지킬 것 | 확인 |
|---|---|---|
| 안정적인 소스 | `core/`나 `api/`가 있으면 `test/`가 있다. 거절 시험(잘못된 입력, 권한 없음, 경계 값)을 포함한다. 판을 올릴 때 시험이 모두 통과한다 | 게이트 `test-missing`, 모듈의 시험 명령 |
| 분리된 DB | 모듈의 테이블은 `db/`에만 있고 이름이 영역 낱말로 시작한다(`member_account`). 다른 모듈의 테이블을 가리키는 외래 키를 두지 않고 값(id)만 가진다. 내놓는 테이블은 매니페스트 `provides.tables`에 적는다 | 게이트 `db-table-prefix`, `db-table-undeclared`, `db-foreign-reference` |
| 취약점 점검 | `api/`, `user/`, `admin/` 가운데 하나라도 있으면 `docs/security.md`에 위협, 통제, 그 통제를 확인하는 시험을 적는다. «취약점 없음»은 약속하지 않고 무엇을 확인했는지 적는다 | 게이트 `security-note-missing`, Security Reviewer |
| 착탈 | 설치는 폴더 복사 하나, 제거는 폴더 삭제 하나다. 모듈 밖에 파일을 만들지 않는다. 프로젝트에 연결하는 방법은 `README.md`에 적는다 | `modules add`, `modules remove`, 빈 프로젝트 설치 시험 |
| 지속적인 고도화 | 판 번호와 `CHANGELOG.md`. 원천 프로젝트가 앞서 나가면 `modules drift`가 알리고, 판이 오르면 쓰는 프로젝트의 `modules status`가 알린다 | `modules drift`, `modules status` |

## 7. 가져다 쓰기와 바꿔 끼우기

| 일 | 명령 | 결과 |
|---|---|---|
| 목록 | `node scripts/coolhan.js modules list` | 저장소의 모듈 이름, 판, 영역, 스택 |
| 찾기 | `modules list --find <낱말>`, `modules list --area <영역>` | 이름, 설명, 요약에 그 낱말이 든 모듈. 대소문자를 가리지 않는다. 찾은 것이 없으면 종료 코드 4다(통과가 아니다) |
| 목록 파일 | `modules list --md` | 영역별 목록. 저장소의 `modules/INDEX.md`는 이 출력으로 만든다. 손으로 고치지 않는다 |
| 설치 | `node scripts/coolhan.js modules add <이름>` | 프로젝트의 `coolhan_modules/<이름>/`에 폴더째 복사. 필요한 모듈도 함께. 기록은 `coolhan.modules.json` |
| 상태 | `node scripts/coolhan.js modules status` | 모듈마다 최신, 새 판 있음, 프로젝트에서 고침. 종료 코드 0 최신, 1 새 판 있음, 4 설치된 것 없음 |
| 갱신 | `node scripts/coolhan.js modules update <이름>` | 고치지 않은 모듈은 폴더째 바꿔 끼운다. 프로젝트에서 고친 파일이 있으면 바꾸지 않고 그 파일 이름을 알린다(`--force`는 고친 것을 `.coolhan-local` 사본으로 남기고 바꾼다) |
| 제거 | `node scripts/coolhan.js modules remove <이름>` | 폴더와 기록을 지운다. 다른 모듈이 필요로 하면 거절한다 |

기록 파일 `coolhan.modules.json`에는 모듈마다 판, 내용 해시, 저장소 커밋, 파일별 해시가 들어간다. 그래서 «과거의 모듈인가»와
«프로젝트에서 고쳤는가»를 기계가 판정한다.

## 8. 흡수 (프로젝트에서 고도화된 기능을 모듈로)

| 단계 | 누가 | 내용 |
|---|---|---|
| 감지 | `node scripts/modules.js drift` | 매니페스트의 `origin` 경로가 원천 프로젝트에서 그 뒤로 바뀌었는지 git 기록으로 본다(읽기만). 바뀐 모듈이 흡수 후보다 |
| 조사 | Site Analyzer, Module Extractor | 프로젝트의 새 기능을 읽고 모듈 경계로 나눈다. 고객 자료, 비밀값, 남의 코드는 가져오지 않는다 |
| 작성 | Developer | 이 표준의 폴더 구성으로 모듈을 만들거나 판을 올린다. `CHANGELOG.md`와 `origin`을 갱신한다 |
| 검사 | `node scripts/module-admit.js <이름> --library <저장소>` | 입고 검사 한 명령: 형식(`module-check`), 모듈의 시험, 빈 폴더에 설치해 설치본에서 다시 시험, 비밀값 스캔. 종료 코드 0일 때만 저장소에 커밋한다. 재지 못한 단계가 있으면 4다(통과가 아니다). 이미 있는 모듈을 고쳤으면 `--with-dependents`로 그 모듈을 `requires`로 쓰는 모듈까지 함께 재고, `--consumer <프로젝트>`로 모듈을 쓰는 프로젝트가 새 판을 받아 자기 확인 명령(기본 `npm run typecheck`)을 통과하는지 잰다 |
| 배포 | `modules status`, `modules update` | 그 모듈을 쓰는 프로젝트가 새 판을 본다 |

### 8-1. 가져올 때 정돈한다 (운영자 지시 2026-11-22)

«전수 조사를 하면서 소스에 에러가 있으면 고쳐. 그리고 소스의 양을 최대한 줄이면서 정리해서 갖고 와라. 화일의 갯수도 줄여서
갖고 와라. 정돈이 필요하다.» «비교하여 더 좋은 것을 모듈화하고, 한쪽이 고도화되면 다른 쪽도 고도화되는 연동성을 갖게 하라.»

| 규칙 | 내용 |
|---|---|
| 복사가 아니라 정돈 | 원천 파일을 그대로 옮기지 않는다. 그 기능이 하는 일을 읽고 가장 적은 줄로 다시 묶는다 |
| 더 좋은 것 하나 | 같은 기능이 여러 프로젝트에 있으면 비교해서 가장 앞선 것을 바탕으로 삼고, 다른 쪽에만 있는 좋은 점을 더한다. 모듈은 하나만 만든다 |
| 줄인다 | 죽은 코드, 쓰지 않는 분기, 한 사이트에만 맞는 분기, 같은 일을 하는 함수의 사본을 뺀다. 사이트마다 다른 값은 설정으로 뺀다 |
| 파일 수 | 한 파일은 한 가지 일을 한다. 그렇다고 잘게 쪼개지 않는다. 몇 줄짜리 파일 여럿은 하나로 합친다 |
| 오류는 고친다 | 읽다가 찾은 오류는 모듈에서 고치고 그 오류를 잡는 시험을 붙인다. 원천 프로젝트의 파일은 고치지 않고, 찾은 오류를 그 프로젝트가 볼 결함 목록에 적는다 |
| 얼마나 줄었나 | `CHANGELOG.md`의 판 항목에 «원천 n개 파일 m줄에서 모듈 n개 파일 m줄»을 적는다. `module-check`가 모듈의 파일 수와 줄 수를 센다 |
| 연동 | 모듈의 판이 오르면 그 모듈을 쓰는 모든 프로젝트의 `modules status`가 새 판을 알린다. 프로젝트에서 모듈을 고쳤으면 `modules status`가 고친 파일을 보여 주고, 그 고침은 저장소의 새 판으로 올린 뒤 다른 프로젝트가 받는다. 다른 프로젝트 폴더의 파일을 밖에서 바꾸지는 않는다 |

## 9. 게이트가 읽는 규칙

`scripts/module-check.js <모듈 폴더 또는 모듈들이 든 폴더>`

| 규칙 | 뜻 |
|---|---|
| manifest-missing, manifest-invalid | `module.json`이 없거나 필수 칸이 빠졌다 |
| name-format, name-mismatch, name-banned-word | 이름 형식, 폴더 이름과 다름, 금지 낱말 |
| version-format | 판이 세 숫자가 아니다 |
| unknown-folder, unknown-file | 열 가지 밖의 하위 폴더, 고정 이름이 아닌 최상위 파일 |
| required-file-missing | `README.md`, `CHANGELOG.md`가 없다 |
| changelog-version-missing | `CHANGELOG.md`에 지금 판의 항목이 없다 |
| parts-mismatch | `parts`와 실제 폴더가 다르다. 없는 부분에 이유가 없다 |
| set-incomplete | `user`, `admin`, `api` 가운데 일부만 있고 이유가 없다 |
| file-name-format, file-name-banned-word | 파일 이름 규칙 |
| entry-missing | `core/`가 있는데 `core/index.*`가 없다. 다른 고정 이름도 같다 |
| test-outside-test-folder | 시험 파일이 `test/` 밖에 있다 |
| core-imports-framework | `core/`가 프레임워크나 DB 클라이언트를 가져온다 |
| import-escapes-module | 모듈 폴더 밖을 상대 경로로 가져온다. 다른 모듈은 `core/index`와 그 모듈이 `provides.entries`에 연 파일만 가져온다 |
| public-entry-invalid | `provides.entries`에 적은 파일이 없거나, 모듈 밖이거나, `test/` 아래다 |
| require-undeclared | 다른 모듈을 가져오는데 `requires`에 없다 |
| origin-missing | `origin`이 비었다. 모르는 칸은 `null`과 `originNote`로 적는다 |
| setting-undeclared | `settings`에 없는 환경 변수 이름을 읽는다 |
| test-missing | `core/`나 `api/`가 있는데 `test/`가 없다 |
| db-table-prefix, db-table-undeclared | 테이블 이름이 영역 낱말로 시작하지 않는다. `provides.tables`에 없다 |
| db-foreign-reference | 이 모듈에 없는 테이블을 외래 키로 가리킨다 |
| security-note-missing | `api/`, `user/`, `admin/`이 있는데 `docs/security.md`가 없다 |

종료 코드: 0 PASS, 1 FAIL, 2 사용법 오류, 4 검사할 모듈이 없음(통과가 아니다).

## 10. 정직한 한계

- 게이트는 형식을 본다. 모듈이 실제로 홀로 서는지는 그 모듈의 시험과 빈 프로젝트에 설치해 돌려 보는 것으로 확인한다.
- 입고 검사는 모듈의 시험이 단언하는 것만 읽는다. 시험이 약한 모듈도 통과한다. 시험이 충분한지는 검토자가 본다. 화면은 브라우저에서 열어 보지 않는다.
- 스택이 `none`이 아닌 모듈(화면과 서버가 든 것)은 같은 스택의 프로젝트에서만 그대로 쓴다. 다른 스택은 `core/`만 쓴다.
- 폴더째 바꿔 끼우는 갱신은 DB 스키마를 옮겨 주지 않는다. `db/`가 바뀐 판은 `CHANGELOG.md`에 옮기는 절차를 적는다.
- 흡수의 감지는 git 기록의 변화다. 바뀐 것이 고도화인지는 사람이나 에이전트가 읽고 판단한다.
