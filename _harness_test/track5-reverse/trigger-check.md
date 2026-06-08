# 역방향 하네스 트리거 검증 (Phase 6-4)

**일자:** 2026-06-08
**대상 스킬:** coolhan-development-orchestrator (역방향 트리거 신규 추가분)
**경쟁 스킬:** coolhan-installer / coolhan-release-orchestrator / coolhan-spec-driven-framework

## Should-TRIGGER (역방향 → development-orchestrator)

| 쿼리 | 기대 | 판정 |
|------|------|------|
| 쿨한으로 이 사이트 분석해 | dev-orch (R1) | ✅ |
| CoolHan analyze this site | dev-orch (R1) | ✅ |
| 쿨한으로 모듈화해 | dev-orch (R1→R2) | ✅ |
| 쿨한으로 A사이트를 B에 적용해 | dev-orch (R1→R3) | ✅ |
| 쿨한으로 기존 사이트 분석해서 적용해 | dev-orch (전체) | ✅ |
| 쿨한으로 개발 이어서 | dev-orch (R1→정방향) | ✅ |
| CoolHan reverse engineer | dev-orch (R1) | ✅ |
| CoolHan port modules | dev-orch (R3) | ✅ |

## Should-NOT-TRIGGER (near-miss — 다른 스킬이 맞음)

| 쿼리 | 올바른 스킬 | 충돌 위험 | 판정 |
|------|------------|----------|------|
| 쿨한 설치해줘 | coolhan-installer | "쿨한" 공유 | ✅ 구분 (설치 동사) |
| CoolHan 배포해줘 | release-orchestrator | "쿨한" 공유 | ✅ 구분 (배포 동사) |
| 쿨한 릴리스 준비해 | release-orchestrator | — | ✅ 구분 |
| 쿨한 검증 훅 세팅해 | spec-driven-framework | "검증" 유사 | ✅ 구분 (훅/파이프라인 셋업) |
| 이 사이트 분석해 (쿨한 없이) | (일반 응답) | "분석" 단독 | ⚠️ 경계 — "쿨한/CoolHan" 접두 권장 |

## 결론

- **충돌 없음.** 역방향 트리거는 모두 `쿨한/CoolHan` + 분석/모듈화/적용/이어서 동사 조합으로, 설치(installer)·배포(release)·프레임워크셋업(spec-driven)과 동사로 명확히 구분됨.
- **경계 케이스:** "쿨한/CoolHan" 접두 없는 단독 "분석해"는 의도적으로 트리거하지 않음(오작동 방지). 사용자에게 접두 사용 안내.
- 판정: **PASS** (오트리거 0, 누락 0).
