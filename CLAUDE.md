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
- "쿨한 업데이트 확인해"
- "쿨한 최신 버전 확인"
- "CoolHan check for updates"
- "CoolHan update"

---

## 팀 구성 (Release Engineering)

| 역할 | 에이전트 | 책임 |
|------|---------|------|
| 기획 리드 | `agents/planning-lead.md` | GitHub/npm 전략, 로드맵 |
| 개발 리드 | `agents/development-lead.md` | 패키지 준비, 빌드 스크립트 |
| DevOps 리드 | `agents/devops-lead.md` | GitHub 인프라, CI/CD |
| 마케팅 리드 | `agents/marketing-lead.md` | README, 문서, 예제 |
| QA 리드 | `agents/qa-lead.md` | 테스트, 품질 검증 |

---

## 하네스: CoolHan Development

**목표:** 🌍 50+ 언어의 자연스러운 명령어로 규격 기반 개발의 전체 프로세스를 자동화하는 다국어 AI 에이전트 팀 시스템.

**트리거:** "쿨한으로 {action}해" (한국어) 또는 "CoolHan {action}" (English) 등 **모국어 명령어** 사용 시 `coolhan-development-orchestrator` 스킬을 자동으로 사용합니다.

**예시 트리거 (다국어):**

| 언어 | 예시 |
|------|------|
| 🇰🇷 한국어 | "쿨한으로 사용자 로그인 기능 추가해" |
| 🇺🇸 English | "CoolHan add user login feature" |
| 🇯🇵 日本語 | "CoolHanでユーザーログイン機能を追加して" |
| 🇨🇳 中文 | "用CoolHan添加用户登录功能" |
| 🇪🇸 Español | "CoolHan agregar función de login de usuario" |
| 🇫🇷 Français | "CoolHan ajouter la fonction de connexion utilisateur" |
| 🇩🇪 Deutsch | "CoolHan Benutzer-Login-Funktion hinzufügen" |
| 🇮🇹 Italiano | "CoolHan aggiungere funzione di accesso utente" |
| 🇵🇹 Português | "CoolHan adicionar recurso de login de usuário" |
| 🇷🇺 Русский | "CoolHan добавить функцию входа пользователя" |
| 🇮🇳 हिन्दी | "CoolHan यूजर लॉगिन फीचर जोड़ें" |
| 🇹🇭 ไทย | "CoolHan เพิ่มฟีเจอร์ login ผู้ใช้" |
| ... | 50+ 언어 더 지원 |

**자동 언어 감지** - 어떤 언어로든 입력하면 자동으로 감지되고 처리됩니다!

### 팀 구성 (Development)

#### 메인 워크플로우 (필수, 6명)

| 역할 | 에이전트 | 책임 |
|------|---------|------|
| 의도 분석자 | `agents/intent-analyzer.md` | 명령어 → 요구사항 |
| 스펙 작가 | `agents/spec-writer.md` | 요구사항 → 규격 문서 |
| 개발자 | `agents/developer.md` | 규격 → 코드 구현 |
| 검증자 | `agents/validator.md` | 9단계 자동 검증 (진입 게이트, 증거 필수) |
| QA 테스터 | `agents/qa-tester.md` | 통합 테스트, 승인 기준 |
| DevOps/배포자 | `agents/devops-deployer.md` | 배포 락, 안전한 배포 |

#### 추가 검증 (선택, 배포 후)

| 역할 | 에이전트 | 책임 |
|------|---------|------|
| 통합 검증자 | `agents/integration-validator.md` | 포트/API/DB 실제 검증 (증거 필수) |
| E2E 테스터 | `agents/e2e-tester.md` | UI/UX/반응형/브라우저 검증 (증거 필수) |

---

## 디렉토리 구조

```
.claude/
├── agents/
│   ├── [Release Engineering]
│   │   ├── planning-lead.md
│   │   ├── development-lead.md
│   │   ├── devops-lead.md
│   │   ├── marketing-lead.md
│   │   └── qa-lead.md
│   └── [Development Harness]
│       ├── intent-analyzer.md
│       ├── spec-writer.md
│       ├── developer.md
│       ├── validator.md
│       ├── qa-tester.md
│       └── devops-deployer.md
└── skills/
    ├── coolhan-spec-driven-framework/
    │   └── SKILL.md
    ├── coolhan-release-orchestrator/
    │   └── SKILL.md
    ├── coolhan-installer/
    │   └── SKILL.md
    └── coolhan-development-orchestrator/  (NEW)
        └── SKILL.md
```

---

## 변경 이력

| 날짜 | 변경 내용 | 대상 | 사유 |
|------|----------|------|------|
| 2026-05-27 | **Release Engineering 하네스 초기 구성** | agents/, skills/, CLAUDE.md | CoolHan 배포 자동화를 위한 완전한 에이전트 팀 시스템 구축 |
| 2026-05-27 | **Phase 2 완료: 11개 아키텍처 충돌 해결** | knowledge_base/ | 도메인 모듈 동기화 및 아키텍처 일관성 확보 |
| **2026-05-28** | **Development Harness 구축 (Phases 0-4)** | agents/ (6개) + skills/coolhan-development-orchestrator + CLAUDE.md | 사용자의 자연스러운 한국어 명령어로 규격 기반 개발을 자동화하는 완전한 에이전트 팀 시스템 |
| **2026-05-28** | **Token Efficiency Mode 적용** | agents/ (6개) + skills/ (4개) | 토큰 절약 모드: 결과만 보고, 과정 설명 제외, 소스 화면 미표시 |
| **2026-05-30** | **Phase D 트랙 1: Harness 고도화 (P0/P1 규칙 반영)** | agents/ (3개: validator, integration-validator, e2e-tester) + skills/coolhan-development-orchestrator + CLAUDE.md | P0 구조 결함 해결: 진입 게이트 추가, evidence field 필수화, Token Efficiency Mode 완화 |
| **2026-05-30** | **Phase D 트랙 3: 기획자 의도 강제 메커니즘 (P0 구조 결함 해결)** | agents/ (intent-analyzer.md, validator.md, integration-validator.md) + skills/coolhan-development-orchestrator | **핵심: AI의 자의적 기능 추가 원천 차단** — Task 1에 기획자 명확화 + 승인 게이트 추가 / requirements-{id}.md에 기획자 의도 명시 필수 / Task 4에 기획 의도 검증 0단계 추가 (무단 기능 추가 감지) / Task 7에 기획서 체크리스트 강화 |

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
- **배포는 항상 `coolhan-release-orchestrator`를 통해 진행하세요**
- **개발은 모국어 자연 언어로 "쿨한으로 {action}해" (한국어) 또는 "CoolHan {action}" (English) 등의 명령어를 사용하세요**
- **다국어 지원:** 50+ 언어 자동 감지 및 처리 - [`MULTILINGUAL_SUPPORT.md`](MULTILINGUAL_SUPPORT.md) 참조

---

## 하네스 상태

| 하네스 | 상태 | 에이전트 | 스킬 | 마지막 업데이트 |
|--------|------|---------|------|--------------|
| Release Engineering | ✅ 구성 완료 | 5명 | 2개 | 2026-05-27 |
| Development | ✅ 고도화 중 (Phase D-1) | 8명 (6 메인 + 2 추가) | 1개 | 2026-05-30 |

---

**하네스 통합 상태:** ✅ 2개 하네스 운영 + Phase D-1 (Harness 고도화) 진행 중  
**마지막 업데이트:** 2026-05-30

---

## Phase D 현황 (Harness 고도화)

### 트랙 1: 문서 + 에이전트 정의 동기화 (진행 중)

| 항목 | 상태 | 내용 |
|------|------|------|
| CLAUDE.md | ✅ 완료 | 팀 구성 + 변경 이력 + Phase D-3 기록 |
| SKILL.md | ✅ 완료 | Task 1-2 게이트 + Task 4 기획 의도 검증 추가 |
| intent-analyzer.md | ✅ 완료 | 3단계 기존 기능 확인 + 4단계 기획자 승인 게이트 추가 |
| validator.md | ✅ 완료 | 0단계 기획 의도 검증 + 10단계 파이프라인으로 확장 |
| integration-validator.md | ✅ 완료 | 기획서 체크리스트 강화 (기획 의도 검증) |
| e2e-tester.md | ✅ 완료 | 기획 의도 검증 (UI/UX 요소 무단 추가 감지) |

### 트랙 3: 기획자 의도 강제 메커니즘 (NEW - P0 구조 결함 해결) ✅ 완료

| 항목 | 상태 | 내용 |
|------|------|------|
| Task 1 강화 | ✅ 완료 | 기존 기능 확인 + 기획자 명확화 + 기획자 의도 명시 |
| Task 1-2 게이트 | ✅ 완료 | 기획자 승인 YES 없이는 Task 2 진행 불가 (GATE LOCK) |
| Task 4 강화 | ✅ 완료 | 0단계 기획 의도 검증 추가 (무단 기능 추가 감지) |
| 검증 메커니즘 | ✅ 완료 | Task 4, 7, 8에서 기획서 외 기능 추가 자동 감지 |

### 트랙 4: 실제 테스트 앱 기반 재검증 (선행 필요)

| 항목 | 상태 | 내용 |
|------|------|------|
| 실제 테스트 앱 | ⏳ 필요 | Task 1-8을 실제로 실행할 샘플 프로젝트 |
| Phase D-3 재검증 | 🔜 대기 | Task 1-8 실행 후 기획자 의도 강제 메커니즘 작동 확인 |
