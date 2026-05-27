# CoolHan Builder — 개발 운영 가이드

## 하네스: CoolHan Release Engineering

**목표:** CoolHan Specification-Driven Framework를 GitHub에서 npm까지, 완전하고 안정적으로 배포하고 관리하는 AI 에이전트 팀 시스템.

**트리거:** CoolHan 배포, 릴리스, 사용자 문서, 품질 관리 관련 요청 시 `coolhan-release-orchestrator` 스킬을 자동으로 사용합니다.

**예시 트리거:**
- "CoolHan GitHub에 배포해줘"
- "npm 패키지 준비해줘"
- "사용자 문서 작성해줘"
- "품질 테스트해줘"
- "배포 후 모니터링"
- "v1.0.1 배포해줘"

---

## 팀 구성

| 역할 | 에이전트 | 책임 |
|------|---------|------|
| 기획 리드 | `agents/planning-lead.md` | GitHub/npm 전략, 로드맵 |
| 개발 리드 | `agents/development-lead.md` | 패키지 준비, 빌드 스크립트 |
| DevOps 리드 | `agents/devops-lead.md` | GitHub 인프라, CI/CD |
| 마케팅 리드 | `agents/marketing-lead.md` | README, 문서, 예제 |
| QA 리드 | `agents/qa-lead.md` | 테스트, 품질 검증 |

---

## 디렉토리 구조

```
.claude/
├── agents/
│   ├── planning-lead.md
│   ├── development-lead.md
│   ├── devops-lead.md
│   ├── marketing-lead.md
│   └── qa-lead.md
└── skills/
    ├── coolhan-spec-driven-framework/  (Framework skill)
    │   └── SKILL.md
    └── coolhan-release-orchestrator/   (Release orchestrator)
        └── SKILL.md
```

---

## 변경 이력

| 날짜 | 변경 내용 | 대상 | 사유 |
|------|----------|------|------|
| 2026-05-27 | **하네스 초기 구성** | agents/, skills/, CLAUDE.md | CoolHan 배포 자동화를 위한 완전한 에이전트 팀 시스템 구축 |
| 2026-05-27 | **Phase 2 완료: 11개 아키텍처 충돌 해결** | knowledge_base/ | 도메인 모듈 동기화 및 아키텍처 일관성 확보 |

---

## 프레임워크 개발 진도

### Phase 진행 상황

| Phase | 상태 | 완료일 | 주요 산출물 |
|-------|------|--------|-----------|
| Phase 1 | ✅ 완료 | 2026-05-27 | 10개 도메인 모듈 (01-10, 각 12섹션) |
| **Phase 2** | **✅ 완료** | **2026-05-27** | **11개 아키텍처 충돌 해결, 인프라 문서 2개** |
| Phase 3 | 🔜 준비 | 2026-06-03 | 통합 테스트 플랜, 검증 보고서 |

### Phase 2 상세: 아키텍처 충돌 해결

**확인된 충돌 (11개) - 모두 해결됨:**

| # | 충돌 | 상태 | 해결 방식 |
|---|------|------|---------|
| 1 | product_reviews 테이블 중복 | ✅ 해결 | 07_review_rating_system 으로 통합 |
| 2 | inventory_transactions 테이블 중복 | ✅ 해결 | 08_inventory_management 으로 통합 |
| 3 | 상태값 불일치 | ✅ 해결 | 00_STATUS_VALUE_REGISTRY.md 생성 |
| 4 | /admin/audit-log 엔드포인트 중복 | ✅ 해결 | 01_member_system 에서 /admin/member/* 로 변경 |
| 5 | /admin/inventory 엔드포인트 중복 | ✅ 해결 | 08_inventory_management 소유권 명확화 |
| 6 | 주문 총액 계산 책임 | ✅ 해결 | 09_order_management 소유권 확정 |
| 7 | 재고 예약 타이밍 | ✅ 해결 | 비즈니스 모델별 규칙 정의 |
| 8 | 결제 멱등성 | ✅ 해결 | idempotency_key 필드 확인 |
| 9 | 모듈 책임 미정의 | ✅ 해결 | 00_MODULE_RESPONSIBILITY_MATRIX.md 생성 |
| 10 | 우선순위 불명확 | ✅ 해결 | 도메인 모듈 > 기본 코어 규칙 정의 |
| 11 | 크로스 모듈 호출 규칙 없음 | ✅ 해결 | 순환 참조 방지 규칙 정의 |

**수정된 도메인 모듈:**
- 01_member_system.md: Admin 엔드포인트 구조 변경
- 02_shopping_mall.md: 테이블/엔드포인트 제거, 의존성 재정의

**생성/업데이트된 문서:**
- ✅ 00_PHASE_2_COMPLETION_SUMMARY.md (신규)
- ✅ 00_STATUS_VALUE_REGISTRY.md (이미 존재)
- ✅ 00_MODULE_RESPONSIBILITY_MATRIX.md (이미 존재)
- ✅ 01_2ND_REVIEW_REPORT.md (업데이트: 충돌 상태 표시)

---

## 주의사항

- 모든 에이전트는 `.claude/agents/`에서 관리됩니다
- 모든 스킬은 `.claude/skills/`에서 관리됩니다
- 에이전트를 수정하면 변경 이력 테이블에 기록하세요
- 배포는 항상 `coolhan-release-orchestrator`를 통해 진행하세요

---

**하네스 상태:** ✅ 구성 완료  
**마지막 업데이트:** 2026-05-27
