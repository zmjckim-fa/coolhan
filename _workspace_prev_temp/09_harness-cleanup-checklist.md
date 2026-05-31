# 코드베이스 정리 체크리스트 (Harness Cleanup Checklist)

**작성:** Harness Architect (Task 9)
**작성일:** 2026-05-30
**연계 문서:** `09_harness-improvement-plan.md`

---

## _workspace/ 상태

현재 산출물 (Phase B 테스트 실행 결과, 2026-05-29):
```
00_team_config.json
00_phase_b_completion_report.md
01_requirements.md
02_specification.md
03_implementation_summary.md
04_validation_report.json
05_test_results.json
06_deployment_log.json
09_harness-improvement-plan.md     (신규)
09_harness-cleanup-checklist.md    (신규)
```

- [x] 최신 산출물만 유지 — 중간 생성 파일 없음 확인
- [ ] **⚠️ 04/05/06 리포트는 시뮬레이션 산출물(Task 7·8 교차 확증: curl 전경로 403 vs
      05번 10/10 PASS·45ms). 실제 앱·구동 증거 없음. "검증 통과 기록"으로 취급 금지.
      증거 기반 재실행 전까지 신뢰 불가 표시.**
- [ ] Task 7-8 산출물(07_integration_validation_report.json,
      08_e2e_validation_report.json) 생성 여부 확인 후 정리
- [ ] JSON 파일 포맷 검증 (04, 05, 06 — 유효 JSON 확인 필요)
- [ ] 파일명 규칙 통일: `NN_snake_case.{ext}` (현재 일관됨)
- [ ] `_workspace_prev/` 미존재 확인 — 재실행 시 백업 규칙 동작 점검 필요
      (SKILL.md는 _workspace_prev/ 백업을 명시하나 디렉토리 없음 = 아직 재실행 없음)

## agents/ 정리

- [ ] **[P0] 검증 계열 4개 에이전트(validator/qa-tester/integration-validator/e2e-tester)
      리포트 템플릿 기본값 PASS → NOT_RUN, evidence(raw)/measured/unreachable 필드 필수화,
      expected==actual 복사 금지 (E-2, I-5). 근거: 06_deployment_log.json도 evidence 없이 30/30 PASS**
- [ ] **[P0] integration-validator.md / e2e-tester.md 입력 맨 앞에 진입 게이트 추가:
      헬스체크 200 + 대상 식별 확인, 실패 시 BLOCKED 보고·중단(시뮬레이션 금지) (E-1)**
- [ ] **[P0] 세 검증 에이전트 "Token Efficiency Mode" 완화 — 검증 산출물엔 raw 증거 첨부
      강제(증거 우선). 근본 원인 (I-1)**
- [ ] **[P1] overall_result에 CANNOT_VALIDATE(BLOCKED) 3-값 도입 — 도달 실패를 PASS로
      둔갑 방지 (I-2)**
- [ ] **[P1] QA Tester 산출물 스키마에 baseURL/포트/DB접속/요구사항목록 필수 필드 추가,
      미충족 시 검증 착수 거부 (I-4, A-1 연동)**
- [ ] **validator.md** — 산출물 경로를 `_workspace/04_validation_report.json` 규칙으로 통일 (A-3)
- [ ] **integration-validator.md** — 입력 프로토콜 재정의: QA Tester 직접 의존 →
      파일 기반(`01_requirements.md` + `06_deployment_log.json`) (A-1); 책임을
      서버/포트/DB/API(headless, Prisma MCP)로 한정 (E-6)
- [ ] **e2e-tester.md** — (1) Task 7 skip 시 입력 출처 명시 (A-2), (2) 에러 핸들링 표 추가 (A-5),
      (3) Phase 1 제거(CI 위임)·Phase 2~5 시나리오 동적 주입·Phase 3 N/A 허용 (E-5),
      (4) 자동화 도구를 Claude Preview MCP로 명시 (E-4), (5) 책임을 브라우저/UI/반응형으로 한정 (E-6)
- [ ] 세 검증 에이전트 통신 프로토콜 상세도 정렬 (A-4)
- [ ] 에이전트 메타데이터 형식 표준화 (A-6)
- [ ] 중복 파일 없음 확인 — Release(5) + Development(8) = 13개, 중복 없음 ✅

## skills/ 정리

- [ ] **SKILL.md** 데이터 흐름도에 07_/08_ 산출물 추가 (S-1)
- [ ] "한국어 명령어 하나로" → "모국어 명령어 하나로" 수정 (S-2)
- [ ] Task 7→8 선택 분기 다이어그램 점선 표기 (W-1)
- [ ] references/ 폴더 도입 검토 또는 MULTILINGUAL_SUPPORT.md 링크 경로 명시 (S-3)
- [ ] Phase 0 명령어→실행모드 매핑 표 추가 (W-2)
- [ ] 재실행 시 부분/전체 산출물 활용 규칙 명시 (W-3)
- [ ] README.md 생성 — 8단계/에이전트/산출물 개요 (R-1)
- [ ] 불필요한 파일 없음 확인 — SKILL.md 단일 파일 ✅

## CLAUDE.md 업데이트

- [ ] 팀 구성(Development) 표를 8명으로 확장 (integration-validator, e2e-tester 추가) (C-1)
- [ ] 디렉토리 구조 트리에 두 신규 에이전트 추가 (C-1)
- [ ] 하네스 상태 표 갱신: Development 8명, 마지막 업데이트 2026-05-30 (C-1)
- [ ] 변경 이력에 v1.0.1~v1.0.4 + Phase A-B 검증 완료 행 추가 (C-2)
- [ ] 하네스 검증 Phase A-B-C 정의 추가 (프레임워크 Phase 1-3과 구분) (C-3)

## 최종 검증

- [ ] CLAUDE.md ↔ SKILL.md ↔ agents/ 3계층 에이전트 수/이름/Task번호 일치 확인
- [ ] 모든 내부 링크(MULTILINGUAL_SUPPORT.md 등) 경로 정확성 확인
- [ ] 산출물 경로 표기가 실제 _workspace/ 파일명과 일치하는지 확인
- [ ] 핸드오프 체인(Task 4→5→6→7→8) 입출력 프로토콜 단절 없음 확인
- [ ] 문서 완성도: 8개 에이전트 모두 역할/입력/출력/에러핸들링/통신 5개 절 보유 확인

## 정리 방침 (규칙)

1. **단일 출처 우선:** 에이전트 간 데이터는 메시지보다 `_workspace/` 파일로 전달 (재실행/롤백 용이).
2. **번호 접두사 규칙:** 모든 산출물 `NN_name.{ext}` — Task 번호와 일치.
3. **3계층 동기화 의무:** 에이전트 추가/변경 시 CLAUDE.md·SKILL.md·agents/ 동시 갱신 + 변경 이력 기록.
4. **재실행 시 백업:** 기존 _workspace/ → _workspace_prev/ 이동 후 신규 실행 (SKILL.md Phase 0 규칙 준수).
