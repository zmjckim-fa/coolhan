# CHECKS: 고정 검증 목록

> «검증» = 아래 목록을 전부 같은 방법으로 실행하는 것이다. 실행: `node scripts/coolhan.js checks-run`.
> 결과는 «통과 n · 실패 m(D-번호) · 확인 안 함 k(이유)» 세 숫자다. 훑은 것이 없으면 확인 안 함이다.
> 목록에 없던 결함을 찾으면 `docs/PROGRESS.md`에 D-번호를 등록하고 그 결함을 잡는 검사를 여기에 추가한다.

| ID | 검사 | 명령 | 비고 |
|---|---|---|---|
| C1 | 진행 원장 형식과 완료 정의 | `node scripts/coolhan.js progress-check docs/PROGRESS.md` | |
| C2 | 기획서 형식, 교훈 대응표, 모듈 계획표 | `node scripts/coolhan.js plan-doc-check docs/plan --lessons @home/knowledge_base/field-lessons.json --tags @tags --modules @modules --required "DB 산출물,화면 설계 산출물,디자인 산출물,소스 산출물"` | 기획 단위가 끝나기 전에는 실패가 정상이다. 추적표에 네 산출물의 행을 두고 위치에 실제 파일을 적는다 |
| C3 | 실패 패턴 코드 검사 | `node scripts/coolhan.js field-lessons check . --tags @tags --skip-dirs docs` | 소스가 생기기 전에는 확인 안 함 |
| C4 | 단일 원천과 중복 | `node scripts/coolhan.js single-source-check . --skip-dirs docs` | 소스가 생기기 전에는 확인 안 함 |
| C5 | 플레이스홀더 잔존 | `node scripts/coolhan.js no-placeholder-check src` | 소스가 생기기 전에는 확인 안 함 |
| C6 | 비밀값 스캔 | `node scripts/coolhan.js secret-scan` | |
| C7 | 프로젝트 시험 | `echo 스택 확정 후 시험 명령으로 교체` | manual |
| C9 | 설치한 모듈이 저장소의 최신 판인가 | `node scripts/coolhan.js modules status --allow-none` | 1이면 `modules update <이름>`. 프로젝트에서 고친 모듈은 고친 파일을 보여 준다 |
| C8 | 상시 지시 블록, 런처, 훅이 쿨한 본체와 같은가 | `node scripts/coolhan.js new-project . --check` | 다르면 `--refresh` |
