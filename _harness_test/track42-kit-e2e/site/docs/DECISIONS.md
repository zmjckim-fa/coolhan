# DECISIONS: 결정 기록

> 묻지 않고 고른 기본값과 그 이유를 적는다. 운영자가 이미 정한 결정은 여기에 적고 다시 묻지 않는다.

## 형식
- Decision: 무엇을 정했나
- Default chosen without asking: 묻지 않고 고른 기본값
- Rationale: 왜
- Reversible: 되돌릴 수 있나, 어떻게
- Not done / 확인 못 한 것: 하지 않은 것과 확인하지 못한 것
- Next: 다음 일

## 2026-11-17: 프로젝트 시작
- Decision: 쿨한 프로젝트 키트로 시작한다. 상시 지시, 훅, 원장, 고정 검증 목록, 모듈 계획이 처음부터 들어 있다.
- Default chosen without asking: 태그 `ui`, 배포 허가 `none`, 모듈 저장소 `C:/sites/00Module_site`
- Rationale: 프로젝트마다 같은 명령을 반복하지 않기 위해서다.
- Reversible: yes, `coolhan.project.json`을 고치고 `node scripts/new-project.js . --refresh`를 다시 실행한다.
- Next: `docs/plan/`의 기획서를 완성한다.

## 2026-11-17: 기획 기본값
- Decision: 관리자 한 명(비밀번호는 환경 변수), Node 24 내장 모듈과 SQLite 파일 하나, 한국어 하나(문구는 키 기반 사전), 메뉴 분류 고정 네 가지, 자정을 넘기는 영업 없음, 처음 상태에 지어낸 자료 없음, 모듈 저장소는 규칙만 참조. 표는 `docs/plan/00_기획서.md` 4-10절(D-01부터 D-09)이다.
- Default chosen without asking: 위 값 전부. 지시 원문에 없는 것은 가장 작은 쪽을 골랐다.
- Rationale: 지시는 «영업시간과 메뉴를 보여 주고 관리자가 고친다» 한 문장이다. 그 밖의 기능은 요청하지 않은 기능이 된다(교훈 F-12).
- Reversible: yes. 결정 로그에 새 행을 쓰고 해당 산출물을 고친다.
- Not done / 확인 못 한 것: 운영자가 가게 이름, 시간대, 가격 표시 방식을 정하지 않았다. 환경 변수와 기본값으로 둔다.
- Next: 기획 게이트 통과 뒤 백로그 분해.
