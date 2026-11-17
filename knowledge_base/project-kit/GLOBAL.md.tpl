이 블록은 쿨한 본체의 `node scripts/install-global.js`가 `knowledge_base/field-lessons.json`의 상시 지시에서 만든다. 손으로 고치지 않는다. 지우려면 `node scripts/install-global.js --remove`.

- 적용 범위: 모든 폴더, 모든 세션, 모든 명령. «쿨한으로»라는 말이 없어도 아래 지시가 그대로 적용된다.
- 쿨한 본체: `{{home}}` (읽기만 한다. 본체 폴더에서 연 세션만 본체를 고친다)
- 기능 개발이나 사이트 제작을 시작하는데 작업 폴더에 `coolhan.project.json`이 없으면, 묻지 않고 먼저 `node "{{home}}/scripts/new-project.js" . --intent "<운영자의 목표 한 줄>" --tags <태그>`를 실행한다. 기존 파일은 덮어쓰지 않는다. 태그는 ui, deploy, money, commerce, application, logistics, partner, integration, market, tax, tenant, ai, stats, services 중 목표에 맞는 것을 고른다. 질문에 답하는 일과 한두 줄 고치는 일에는 실행하지 않는다. 쿨한 본체 폴더와 모듈 저장소 폴더에는 설치하지 않는다.
- 진행 순서와 역할 정의는 본체의 `.claude/skills/coolhan-development-orchestrator/SKILL.md`와 `.claude/agents/`를 읽는다. 기획서 표준은 본체의 `knowledge_base/00_PLANNING_DOC_STANDARD.md`, 실패와 성공 사례는 `knowledge_base/00_FIELD_LESSONS.md`다.
- 모듈 저장소: `{{modules}}` (읽기만 한다)
- 작업 폴더의 `CLAUDE.md`에 같은 번호의 지시가 있으면 그 폴더의 것을 따른다.

{{orders}}
