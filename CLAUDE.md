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

#### 역방향 + 재사용 확장 (NEW, 3명)

기존 사이트를 분석 → 모듈화 → 타 사이트 응용 적용 또는 개발 지속. 정방향이 "의도→스펙→코드"라면 역방향은 "코드→스펙→모듈→재적용".

| 역할 | 에이전트 | 책임 |
|------|---------|------|
| 사이트 분석자 | `agents/site-analyzer.md` | 코드 역공학 → Site Analysis Map (stack-agnostic, 증거 필수) |
| 모듈 추출자 | `agents/module-extractor.md` | 기능·메뉴 → Module Manifest (12섹션 도메인-모듈 포맷, KB 환류) |
| 교차 사이트 적용자 | `agents/cross-site-adapter.md` | A→B Application Plan (파라미터화 변환, 충돌 감지, P0 승인 게이트) |

> 이식/개발 실행은 정방향 에이전트(Spec Writer→Developer→Validator→QA→DevOps) 재사용. 트리거: "쿨한으로 분석해 / 모듈화해 / A를 B에 적용해 / 개발 이어서".

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
│       ├── devops-deployer.md
│       ├── [Reverse + Reuse Extension]  (NEW)
│       ├── site-analyzer.md
│       ├── module-extractor.md
│       └── cross-site-adapter.md
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
| **2026-06-06** | **컨텍스트 기반 작업 분할 원칙 추가** | skills/coolhan-development-orchestrator/SKILL.md + agents/developer.md | "결과가 나올 수 있는 명령만 내린다" — 1단위=파일 7개+검증 1개, 검증 없이 완료 선언 금지, 컨텍스트 한계 시 중단점 명시 |
| **2026-05-30** | **Phase D 트랙 3: 기획자 의도 강제 메커니즘 (P0 구조 결함 해결)** | agents/ (intent-analyzer.md, validator.md, integration-validator.md) + skills/coolhan-development-orchestrator | **핵심: AI의 자의적 기능 추가 원천 차단** — Task 1에 기획자 명확화 + 승인 게이트 추가 / requirements-{id}.md에 기획자 의도 명시 필수 / Task 4에 기획 의도 검증 0단계 추가 (무단 기능 추가 감지) / Task 7에 기획서 체크리스트 강화 |
| **2026-06-08** | **Phase D 트랙 4: 실제 테스트 앱 기반 재검증 완료** | _harness_test/track4/ (FastAPI 샘플 앱 + Task 1-6 산출물 + 리포트) + CLAUDE.md | **P0 메커니즘 실작동 입증** — 적대적 테스트(클린 vs 위반)로 Validator 0단계가 무단 기능 추가를 정확 감지함 확인 (클린→PASS, 위반→FAIL). 6명 팀 워크플로우 완주. **GAP-1 식별:** validator/qa-tester/devops-deployer가 Node/npm 전용 → Python 비호환 (스택 감지 + 명령 매핑 필요) |
| **2026-06-08** | **GAP-3 수정: QA 음성 테스트 필수화** | agents/qa-tester.md | 트랙4 GAP-3 해결 — 양성만으론 PASS 불가, 음성(입력거부/인가거부/상태전이거부/중복멱등/경계/보안) 케이스 필수. 음성 0개 시 NOT_RUN. 스펙 섹션10 오류 시나리오 전수 커버 |
| **2026-06-08** | **GAP-2 수정: 산출물 파일명 표준 통일** | skills/coolhan-development-orchestrator (파일명 표준 섹션) + agents/ (validator, qa-tester) | 트랙4 GAP-2 해결 — `{timestamp}`→`{id}` 통일, `_workspace/{NN}_{artifact}-{id}.{ext}` 단일 규칙 확정 (NN 접두 유무·id/timestamp 혼용 제거) |
| **2026-06-09** | **연속개발 엔진 (Continuous Development Engine) 내장 — 하네스 자기 고도화** | skills/coolhan-development-orchestrator (🔄 엔진 섹션 + working-mode 기본 ON + 트리거) + _workspace/(_goal/_backlog/_checkpoint) + CLAUDE.md | 목표 1개 수신 시 _goal→_backlog 분해 후 백로그가 빌 때까지 단위별 실행·검증·재개를 사람 개입 없이 자가반복. 자기재개 3경로(세션내 연쇄/세션경계 baton/무인 /loop). 목표 범위 내 재질문 없음, 미지정 시에만 보류(P0). 본 엔진을 엔진 자신에게 적용(self-host)하여 백로그 U1~U6 소진으로 데모 |
| **2026-06-08** | **지속 개발 릴레이 (Continuous Relay Mode) 추가** | skills/coolhan-development-orchestrator (working-mode + ♾️ 릴레이 섹션 + Phase 0 재개 분기 + 중단점 바통화) + agents/developer.md | 컨텍스트 한계에서 멈추지 않고 _checkpoint.md 저장 + 마지막 줄에 재시작 명령(baton) 방출 → 새 세션이 체크포인트부터 자동 재개. 반복으로 멈추지 않는 개발. 모델별 컨텍스트 예산(대형 3단위/중형 2/소형 1)으로 임계 판단. 무인 반복은 /loop 안내 |
| **2026-06-08** | **Autonomous Mode 추가** | skills/coolhan-development-orchestrator (working-mode + 자율 진행 섹션) | 명령 1회로 파이프라인 끝까지 자동 연쇄, FAIL 시 자동 복구(1회 재시도→Developer 재실행, 2회 실패만 보고), 정지 조건(P0 게이트/복구불가/컨텍스트 한계/파괴작업)만 멈춤, 자동 결정 _autorun-log.md 기록 |
| **2026-06-08** | **GAP-1 수정: 정방향 에이전트 stack-agnostic화** | agents/ (validator, qa-tester, devops-deployer) + skills/coolhan-development-orchestrator/references/stack-command-map.md | 트랙4 GAP-1 해결 — 3개 에이전트가 작업 전 스택 감지 후 명령 치환(npm 전제 제거). Python/Django/PHP/Ruby/Go/Java 매핑표 추가. P0 0단계는 언어 무관 항상 실행. |
| **2026-06-08** | **Chat Brevity Mode 추가** | skills/coolhan-development-orchestrator (working-mode) | 답변 짧게, 채팅엔 성공/실패/판정/다음작업 10줄 이하, 상세는 파일 기록, 질문 없이 다음 작업 자동 진행 |
| **2026-06-08** | **역방향 + 재사용 하네스 확장 (Site Analyzer / Module Extractor / Cross-Site Adapter)** | agents/ (3개 신규) + skills/coolhan-development-orchestrator (SKILL.md + references 3개) + CLAUDE.md + _harness_test/track5-reverse/ | **기존 사이트 분석→모듈화→타 사이트 응용 적용 능력 추가.** 정방향 파이프라인에 역방향 서브-파이프라인(R1→R2→R3) 합류. 통합 원칙 4대: stack-agnostic 우선(GAP-1 교훈 반영), 파라미터화 재사용, **기획자 의도 강제(P0) 교차-사이트 확장**(승인 모듈만 이식 + Validator 0단계 교차검증), domain-module 환류. 트랙5 적대적 검증으로 무단 끌어오기 차단 입증. |

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
| Development | ✅ 고도화 중 (Phase D-1) | 11명 (6 메인 + 2 추가 + 3 역방향) | 1개 | 2026-06-08 |

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

### 트랙 4: 실제 테스트 앱 기반 재검증 ✅ 완료 (2026-06-08)

| 항목 | 상태 | 내용 |
|------|------|------|
| 실제 테스트 앱 | ✅ 완료 | FastAPI 샘플 앱 (`_harness_test/track4/sample-app/`) — Task 1-6 전체 실행 |
| Phase D-3 재검증 | ✅ 완료 | 적대적 테스트(클린 vs 위반)로 기획자 의도 강제 메커니즘 작동 입증 |

**재검증 결과 (`_harness_test/track4/track4-report.md`):**
- ✅ **P0 메커니즘 작동 확인** — Validator 0단계가 무단 기능 추가를 정확 감지.
  클린 코드 → PASS(무단추가 0), 위반 코드(`/health`+`health_status` 주입) → FAIL(항목·위치 명시). 오탐/누락 없음.
- ✅ Task 1-6 6명 팀 워크플로우 실작동 완주 (pytest 8 pass, 배포 스모크 통과).
- ⚠️ **GAP-1 (P0) 식별** — validator/qa-tester/devops-deployer.md가 Node/npm 전용.
  Python/FastAPI에서 8·9단계 NOT_RUN. 스택 감지 + 명령 매핑 필요. (단, P0 핵심은 언어 무관이라 영향 없음)
- ⚠️ GAP-2: 산출물 파일명 불일치 / GAP-3: QA 음성 테스트 부재.

**다음 액션 후보:** GAP-1 수정 (스택 감지 + Python 매핑을 3개 에이전트 정의에 추가).
