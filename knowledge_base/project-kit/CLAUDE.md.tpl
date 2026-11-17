# {{name}}

> {{intent}}

## 인수인계
@HANDOFF.md

## 상시 지시
운영자가 프로젝트마다 반복해서 내리던 명령을 처음부터 넣어 둔 것이다. 같은 명령을 다시 내리지 않는다. 원본은 쿨한 본체의 `knowledge_base/field-lessons.json`이고 `node scripts/new-project.js . --refresh`가 이 블록을 다시 만든다. 손으로 고치지 말고 프로젝트에만 해당하는 예외는 이 블록 밖에 적는다.

<!-- coolhan:orders:start -->
{{orders}}
<!-- coolhan:orders:end -->

## 기준 파일
- 진행 원장 `docs/PROGRESS.md`: 진실은 대화가 아니라 이 파일이다. 세션을 시작하면 현재 위치부터 읽는다.
- 고정 검증 `docs/CHECKS.md`: «검증»은 이 목록 전체를 `node scripts/coolhan.js checks-run`으로 실행하는 것이다.
- 결정 기록 `docs/DECISIONS.md`, 운영자만 할 수 있는 일 `docs/BLOCKED.md`, 기획 산출물 `docs/plan/`.
- 설정 `coolhan.project.json`: 태그, 배포 허가(`deploy`), 모듈 저장소, 쿨한 본체 위치(`home`).
- 도구: `node scripts/coolhan.js <도구> …` (progress-check, checks-run, plan-doc-check, field-lessons, handoff, modules).
- 실패 방지: 내 역할의 교훈은 `node scripts/coolhan.js field-lessons list --owner <역할> --tags @tags`로 읽는다.

## 쿨한 본체
- 위치는 `node scripts/coolhan.js where`가 알려 준다 (`coolhan.project.json`의 `home`). 본체 폴더는 읽기만 한다.
- 진행 순서: 의도 분석, 화면 설계, 기획서, 기획 게이트, 구현, 검증, 시험, 배포. 세션의 스킬 목록에 `coolhan-development-orchestrator`가 있으면 그 스킬로 진행한다. 없으면 본체의 `.claude/skills/coolhan-development-orchestrator/SKILL.md`를 읽고 같은 순서로 진행하며 역할 정의는 본체의 `.claude/agents/`에서 읽는다.
- 기획서 표준은 본체의 `knowledge_base/00_PLANNING_DOC_STANDARD.md`, 실패와 성공 사례는 `knowledge_base/00_FIELD_LESSONS.md`다.
- 모듈 저장소(`coolhan.project.json`의 `modules`)는 읽기만 한다. 묶음 명세는 `_specs/`, 목록은 `node scripts/coolhan.js modules list`, 이 프로젝트의 결정은 `docs/plan/MODULE_PLAN.md`다.

## 프로젝트 고유 규칙
이 아래에 이 프로젝트에만 해당하는 규칙을 적는다.
