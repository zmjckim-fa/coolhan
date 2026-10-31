# CHECKS — 고정 검증 목록 (이 저장소)

> «검증» = 아래 목록을 **전부** 같은 방법으로 실행하는 것 (§11, `knowledge_base/00_MINIMAL_SOURCE_PRINCIPLES.md`).
> 실행: `node scripts/checks-run.js` → 결과는 «통과 n · 실패 m(D-번호) · 확인 안 함 k(이유)» 세 숫자.
> 목록에 없던 결함을 찾으면 ① `docs/PROGRESS.md` 결함 목록에 D-번호 등록 ② 그 결함을 잡는 검사를 여기에 추가.
> 명령은 저장소 루트에서 실행된다. C1은 약 6분 — 전체 실행은 터미널에서 백그라운드로.

| ID | 검사 | 명령 | 비고 |
|---|---|---|---|
| C1 | 전체 단위 시험 (jest, 31 suites) | `npx jest --ci` | 느림(~6분) |
| C2 | 프롬프트 현대화 린트 (에이전트·스킬) | `node scripts/prompt-modernization-check.js .claude/agents .claude/skills` | |
| C3 | 플레이스홀더·TODO 잔존 | `node scripts/no-placeholder-check.js scripts src/health.js src/server.js doctor.js install.js` | |
| C4 | 비밀값 스캔 (스테이징 전 전체) | `node scripts/secret-scan.js` | 커밋 직전엔 `--staged`로 한 번 더 |
| C5 | 동반 스킬 존재 프로브 (G16) | `node scripts/companion-skills-check.js` | |
| C6 | AI 아키텍처 게이트 자기 실행 (G19) | `node scripts/ai-arch-check.js .` | 하네스는 NOT_APPLICABLE이 정상(모델 호출 없음) |
| C7 | 단일 원천 래칫 (G20-C, 기준선 대비 증가 금지) | `node scripts/single-source-check.js . --baseline docs/SINGLE_SOURCE_BASELINE.json` | 기준선 갱신은 감소했을 때만 `--write-baseline` |
| C8 | 진행 원장 형식·완료 정의 (G20-A) | `node scripts/progress-check.js docs/PROGRESS.md` | |
| C9 | 설치 상태 점검 (doctor) | `node doctor.js` | |
