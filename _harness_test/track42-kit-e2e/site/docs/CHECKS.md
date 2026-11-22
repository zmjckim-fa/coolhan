# CHECKS: 고정 검증 목록

> «검증» = 아래 목록을 전부 같은 방법으로 실행하는 것이다. 실행: `node scripts/coolhan.js checks-run`.
> 결과는 «통과 n · 실패 m(D-번호) · 확인 안 함 k(이유)» 세 숫자다. 훑은 것이 없으면 확인 안 함이다.
> 목록에 없던 결함을 찾으면 `docs/PROGRESS.md`에 D-번호를 등록하고 그 결함을 잡는 검사를 여기에 추가한다.

| ID | 검사 | 명령 | 비고 |
|---|---|---|---|
| C1 | 진행 원장 형식과 완료 정의 | `node scripts/coolhan.js progress-check docs/PROGRESS.md` | |
| C2 | 기획서 형식, 교훈 대응표, 모듈 계획표 | `node scripts/coolhan.js plan-doc-check docs/plan --lessons @home/knowledge_base/field-lessons.json --tags @tags --modules @modules --required "DB 산출물,화면 설계 산출물,디자인 산출물,소스 산출물"` | 추적표에 네 산출물의 행을 두고 위치에 실제 파일을 적는다 |
| C3 | 실패 패턴 코드 검사 | `node scripts/coolhan.js field-lessons check . --tags @tags --skip-dirs docs` | 소스가 생기기 전에는 확인 안 함 |
| C4 | 단일 원천과 중복 | `node scripts/coolhan.js single-source-check . --skip-dirs docs` | 소스가 생기기 전에는 확인 안 함 |
| C5 | 플레이스홀더 잔존 | `node scripts/coolhan.js no-placeholder-check src` | 소스가 생기기 전에는 확인 안 함 |
| C6 | 비밀값 스캔 | `node scripts/coolhan.js secret-scan` | |
| C7 | 프로젝트 시험 | `node --test "test/*.test.js"` | `package.json`의 `test`와 같은 명령 |
| C8 | 상시 지시 블록, 런처, 훅이 쿨한 본체와 같은가 | `node scripts/coolhan.js new-project . --check` | 다르면 `--refresh` |
| C9 | DB 스키마 검증 | `node db/check-schema.js` | |
| C10 | 색 대비 | `node docs/plan/design/contrast-check.js` | WCAG 1.4.3, 1.4.11 |
| C11 | WCAG 1.1.1 글이 아닌 내용의 대체 글 (S-01, S-02, S-03, S-04) | `echo WCAG 1.1.1 S-01, S-02, S-03, S-04 사람이 브라우저에서 본다` | manual, 1.1.1, 375px과 1280px |
| C12 | WCAG 1.3.1 정보와 관계 (S-01, S-02, S-03, S-04) | `echo WCAG 1.3.1 S-01, S-02, S-03, S-04 사람이 브라우저에서 본다` | manual, 1.3.1, 375px과 1280px |
| C13 | WCAG 1.3.2 의미 있는 순서 (S-01, S-03, S-04) | `echo WCAG 1.3.2 S-01, S-03, S-04 사람이 브라우저에서 본다` | manual, 1.3.2, 375px과 1280px |
| C14 | WCAG 1.3.5 입력 목적 (S-02) | `echo WCAG 1.3.5 S-02 사람이 브라우저에서 본다` | manual, 1.3.5, 375px과 1280px |
| C15 | WCAG 1.4.1 색의 사용 (S-01, S-02, S-03, S-04) | `echo WCAG 1.4.1 S-01, S-02, S-03, S-04 사람이 브라우저에서 본다` | manual, 1.4.1, 375px과 1280px |
| C16 | WCAG 1.4.4 글자 크기 조절 (S-01, S-02, S-03, S-04) | `echo WCAG 1.4.4 S-01, S-02, S-03, S-04 사람이 브라우저에서 본다` | manual, 1.4.4, 375px과 1280px |
| C17 | WCAG 1.4.10 재배치 (S-01, S-02, S-03, S-04) | `echo WCAG 1.4.10 S-01, S-02, S-03, S-04 사람이 브라우저에서 본다` | manual, 1.4.10, 375px과 1280px |
| C18 | WCAG 1.4.12 글자 간격 (S-01, S-02, S-03, S-04) | `echo WCAG 1.4.12 S-01, S-02, S-03, S-04 사람이 브라우저에서 본다` | manual, 1.4.12, 375px과 1280px |
| C19 | WCAG 1.4.13 가리키거나 초점을 줄 때 나오는 내용 (S-03, S-04) | `echo WCAG 1.4.13 S-03, S-04 사람이 브라우저에서 본다` | manual, 1.4.13, 375px과 1280px |
| C20 | WCAG 2.1.1 키보드 (S-01, S-02, S-03, S-04) | `echo WCAG 2.1.1 S-01, S-02, S-03, S-04 사람이 브라우저에서 본다` | manual, 2.1.1, 375px과 1280px |
| C21 | WCAG 2.1.2 키보드 갇힘 없음 (S-03, S-04) | `echo WCAG 2.1.2 S-03, S-04 사람이 브라우저에서 본다` | manual, 2.1.2, 375px과 1280px |
| C22 | WCAG 2.4.1 구역 건너뛰기 (S-01, S-02, S-03, S-04) | `echo WCAG 2.4.1 S-01, S-02, S-03, S-04 사람이 브라우저에서 본다` | manual, 2.4.1, 375px과 1280px |
| C23 | WCAG 2.4.2 문서 제목 (S-01, S-02, S-03, S-04) | `echo WCAG 2.4.2 S-01, S-02, S-03, S-04 사람이 브라우저에서 본다` | manual, 2.4.2, 375px과 1280px |
| C24 | WCAG 2.4.3 초점 순서 (S-01, S-02, S-03, S-04) | `echo WCAG 2.4.3 S-01, S-02, S-03, S-04 사람이 브라우저에서 본다` | manual, 2.4.3, 375px과 1280px |
| C25 | WCAG 2.4.6 제목과 라벨 (S-01, S-02, S-03, S-04) | `echo WCAG 2.4.6 S-01, S-02, S-03, S-04 사람이 브라우저에서 본다` | manual, 2.4.6, 375px과 1280px |
| C26 | WCAG 2.4.7 초점 보임 (S-01, S-02, S-03, S-04) | `echo WCAG 2.4.7 S-01, S-02, S-03, S-04 사람이 브라우저에서 본다` | manual, 2.4.7, 375px과 1280px |
| C27 | WCAG 2.4.11 초점이 가려지지 않음 (S-03, S-04) | `echo WCAG 2.4.11 S-03, S-04 사람이 브라우저에서 본다` | manual, 2.4.11, 375px과 1280px |
| C28 | WCAG 2.5.3 이름 속의 라벨 (S-03, S-04) | `echo WCAG 2.5.3 S-03, S-04 사람이 브라우저에서 본다` | manual, 2.5.3, 375px과 1280px |
| C29 | WCAG 2.5.7 끌기 동작 (S-04) | `echo WCAG 2.5.7 S-04 사람이 브라우저에서 본다` | manual, 2.5.7, 375px과 1280px |
| C30 | WCAG 2.5.8 누르는 곳의 크기 (S-01, S-02, S-03, S-04) | `echo WCAG 2.5.8 S-01, S-02, S-03, S-04 사람이 브라우저에서 본다` | manual, 2.5.8, 375px과 1280px |
| C31 | WCAG 3.2.2 입력할 때 (S-03, S-04) | `echo WCAG 3.2.2 S-03, S-04 사람이 브라우저에서 본다` | manual, 3.2.2, 375px과 1280px |
| C32 | WCAG 3.2.3 일관된 메뉴 (S-03, S-04) | `echo WCAG 3.2.3 S-03, S-04 사람이 브라우저에서 본다` | manual, 3.2.3, 375px과 1280px |
| C33 | WCAG 3.3.1 오류 알림 (S-02, S-03, S-04) | `echo WCAG 3.3.1 S-02, S-03, S-04 사람이 브라우저에서 본다` | manual, 3.3.1, 375px과 1280px |
| C34 | WCAG 3.3.2 라벨과 안내 (S-02, S-03, S-04) | `echo WCAG 3.3.2 S-02, S-03, S-04 사람이 브라우저에서 본다` | manual, 3.3.2, 375px과 1280px |
| C35 | WCAG 3.3.3 오류 고치는 법 (S-02, S-03, S-04) | `echo WCAG 3.3.3 S-02, S-03, S-04 사람이 브라우저에서 본다` | manual, 3.3.3, 375px과 1280px |
| C36 | WCAG 3.3.8 인증의 접근성 (S-02) | `echo WCAG 3.3.8 S-02 사람이 브라우저에서 본다` | manual, 3.3.8, 375px과 1280px |
| C37 | WCAG 4.1.2 이름, 역할, 값 (S-01, S-02, S-03, S-04) | `echo WCAG 4.1.2 S-01, S-02, S-03, S-04 사람이 브라우저에서 본다` | manual, 4.1.2, 375px과 1280px |
| C38 | WCAG 4.1.3 상태 알림 (S-01, S-02, S-03, S-04) | `echo WCAG 4.1.3 S-01, S-02, S-03, S-04 사람이 브라우저에서 본다` | manual, 4.1.3, 375px과 1280px |
