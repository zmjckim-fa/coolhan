---
name: coolhan-development-orchestrator
description: "CoolHan 규격 기반 개발 프레임워크의 완전한 다국어 개발 워크플로우를 자동화합니다. 🌍 50+ 언어 지원: '쿨한으로 개발해'(한국어), 'CoolHan add feature'(English), 'CoolHanで開発して'(日本語), '用CoolHan开发'(中文), 'CoolHan {acción}'(Español) 등 자연스러운 모국어 명령어를 인식하고, 6명의 전문가 팀(의도분석/스펙작가/개발자/검증자/테스터/DevOps)이 협력하여 specification-driven 개발 프로세스를 완전히 자동화합니다. 자동 언어 감지 + 표준화 규격 + 9단계 검증으로 전 세계 개발자가 모국어로 100% 스펙 준수 개발을 가능하게 합니다. 자세한 다국어 지원: MULTILINGUAL_SUPPORT.md 참조."
working-mode: |
  **Token Efficiency Mode (작동 원칙)**
  - 결과만 보고: 분석완료/작업중/완료 형식으로만 보고
  - 과정 설명 금지: 생각, 판단 과정 미표시
  - 소스 화면 미표시: 코드나 내용 스크린샷 제외
  - 토큰 최소화: 필수 정보만 간결하게 전달
compatibility: Claude Code + Agent Team + CoolHan Framework + Multilingual Support (50+ languages)
---

# 🚀 CoolHan Development Orchestrator

사용자의 자연스러운 한국어 명령어 하나로 **규격 기반 개발의 모든 단계**를 자동화하는 완전한 개발 팀입니다.

---

## 🎯 핵심 목표

| 단계 | 담당 에이전트 | 산출물 |
|------|-------------|--------|
| 1️⃣ **의도 분석** | Intent Analyzer | 구조화된 요구사항 |
| 2️⃣ **스펙 작성** | Spec Writer | CoolHan 규격 문서 |
| 3️⃣ **코드 구현** | Developer | 규격 기반 코드 |
| 4️⃣ **자동 검증** | Validator | 9단계 검증 결과 |
| 5️⃣ **테스트** | QA Tester | 테스트 리포트 |
| 6️⃣ **배포** | DevOps/Deployer | 배포 완료 |

---

## 🌍 다국어 지원 (Multilingual Support)

**50+ 언어 지원** - 모국어로 자연스럽게 입력하세요!

### 명령어 형식 (Command Patterns)

| 언어 | 패턴 | 예시 |
|------|------|------|
| 🇰🇷 한국어 | 쿨한으로 {action}해 | "쿨한으로 사용자 로그인 기능 추가해" |
| 🇺🇸 English | CoolHan {action} | "CoolHan add user login feature" |
| 🇯🇵 日本語 | CoolHanで{操作} | "CoolHanでユーザーログイン機能を追加して" |
| 🇨🇳 中文 | 用CoolHan {操作} | "用CoolHan添加用户登录功能" |
| 🇪🇸 Español | CoolHan {acción} | "CoolHan agregar función de login de usuario" |
| 🇫🇷 Français | CoolHan {action} | "CoolHan ajouter la fonction de connexion utilisateur" |
| 🇩🇪 Deutsch | CoolHan {Aktion} | "CoolHan Benutzer-Login-Funktion hinzufügen" |
| 🇮🇹 Italiano | CoolHan {azione} | "CoolHan aggiungere funzione di accesso utente" |
| 🇵🇹 Português | CoolHan {ação} | "CoolHan adicionar recurso de login de usuário" |
| 🇷🇺 Русский | CoolHan {действие} | "CoolHan добавить функцию входа пользователя" |
| 🇮🇳 हिन्दी | CoolHan {कार्य} | "CoolHan यूजर लॉगिन फीचर जोड़ें" |
| 🇹🇭 ไทย | CoolHan {การกระทำ} | "CoolHan เพิ่มฟีเจอร์ login ผู้ใช้" |
| ... | ... | 50+ 언어 더 지원 |

**자동 언어 감지** - 어떤 언어로든 입력하면 자동으로 감지되고 처리됩니다!

### 지원하는 명령어

| 명령어 | 의도 | 워크플로우 |
|--------|------|----------|
| "쿨한으로 개발해" (모든 언어) | 신규 기능 개발 | 1️⃣→2️⃣→3️⃣→4️⃣→5️⃣→6️⃣ (전체) |
| "쿨한으로 {기능} 추가해" | 특정 기능 추가 | 1️⃣→2️⃣→3️⃣→4️⃣→5️⃣→6️⃣ (전체) |
| "쿨한으로 검증해" | 코드 검증 | 4️⃣ (검증만) |
| "쿨한으로 테스트해" | 테스트 실행 | 5️⃣ (테스트만) |
| "쿨한으로 배포해" | 배포 실행 | 6️⃣ (배포만) |
| "쿨한으로 디자인해" | UI/UX 설계 | 커스텀 (분석/설계만) |

**다국어 예시:**
```
한국어: "쿨한으로 사용자 로그인 기능 추가해"
English: "CoolHan add user login feature"
日本語: "CoolHanでユーザーログイン機能を追加して"
中文: "用CoolHan添加用户登录功能"
Español: "CoolHan agregar función de login de usuario"
Français: "CoolHan ajouter la fonction de connexion utilisateur"
Deutsch: "CoolHan Benutzer-Login-Funktion hinzufügen"
...더 많은 언어 지원
```

**자세한 다국어 지원:** [`MULTILINGUAL_SUPPORT.md`](MULTILINGUAL_SUPPORT.md) 참조

---

## ⚙️ 실행 구조

### Phase 0: 컨텍스트 확인

```
사용자 명령어
    ↓
기존 산출물 확인 (_workspace/)
    ↓
실행 모드 결정 (초기/재실행/부분수정)
    ↓
리소스 준비
```

**분기:**
- **초기 실행:** _workspace/ 없음 → 1단계부터 시작
- **재실행:** _workspace/ 존재 + 사용자 새 명령어 → _workspace_prev/ 이동 후 1단계부터
- **부분 수정:** _workspace/ 존재 + 피드백 기반 수정 → 해당 단계만 재실행

### Phase 1-6: 에이전트 팀 협업

```
[오케스트레이터]
    ↓
[TeamCreate: 6명 팀 구성]
    ├─ intent-analyzer.md
    ├─ spec-writer.md
    ├─ developer.md
    ├─ validator.md
    ├─ qa-tester.md
    └─ devops-deployer.md
    ↓
[TaskCreate: 6개 작업 할당]
    1. 의도 분석 (Intent Analyzer)
    2. 스펙 작성 (Spec Writer)
    3. 코드 구현 (Developer)
    4. 자동 검증 (Validator)
    5. 테스트 실행 (QA Tester)
    6. 배포 (DevOps/Deployer)
    ↓
[팀원들이 자체 조율]
    - SendMessage: 팀원 간 협의, 피드백 교환
    - TaskUpdate: 진행 상황 업데이트
    - 파일 기반 산출물 공유 (_workspace/)
    ↓
[오케스트레이터: 최종 결과 종합]
    - 팀 정리 (TeamDelete)
    - 산출물 정리
    - 최종 보고
```

**실행 모드:** 🔄 **Agent Team** (6명이 협력)

**데이터 흐름:**
```
_workspace/
├── 01_requirements.md (Intent Analyzer 산출)
├── 02_specification.md (Spec Writer 산출)
├── 03_code/ (Developer 산출)
├── 04_validation-report.json (Validator 산출)
├── 05_test-results.json (QA Tester 산출)
└── 06_deployment-log.json (DevOps 산출)

_workspace_prev/ (이전 버전, 롤백 가능)
```

---

## 📋 작업 할당 및 의존성

```
Task 1: 의도 분석 (Intent Analyzer)
└─ 산출: requirements-{id}.md

Task 2: 스펙 작성 (Spec Writer)
└─ 의존: Task 1 완료
└─ 산출: knowledge_base/{domain}.md

Task 3: 코드 구현 (Developer)
└─ 의존: Task 2 완료
└─ 산출: _workspace/03_code/

Task 4: 자동 검증 (Validator)
└─ 의존: Task 3 완료
└─ 산출: validation-report-{id}.json

Task 5: 테스트 실행 (QA Tester)
└─ 의존: Task 4 완료 (PASS)
└─ 산출: test-results-{timestamp}.json

Task 6: 배포 (DevOps/Deployer)
└─ 의존: Task 5 완료 (PASS)
└─ 산출: deployment-log-{id}.json
```

---

## 🔄 에러 핸들링

| 단계 | 에러 | 처리 |
|------|------|------|
| 1️⃣ 의도 분석 | 모호한 명령어 | 사용자에게 명확화 질문, Task 재실행 |
| 2️⃣ 스펙 작성 | 기존 스펙과 충돌 | 충돌 문서화, Intent Analyzer 재검토 |
| 3️⃣ 코드 구현 | 구현 불가능한 스펙 | Spec Writer에 보고, Task 2 재실행 |
| 4️⃣ 검증 | 검증 실패 | 실패 항목 상세 리스트, Developer 재실행 (Task 3) |
| 5️⃣ 테스트 | 테스트 실패 | 버그 리포트, Developer 재실행 (Task 3) |
| 6️⃣ 배포 | 배포 실패 | 에러 분석, 롤백, 원인 제거 후 재실행 |

**재실행 전략:**
- 재실행 시 _workspace/의 해당 단계 파일 갱신
- 이전 결과는 _workspace_prev/에 백업
- 사용자에게 진행 상황 정기 보고

---

## 📂 산출물 구조

```
프로젝트/
├── knowledge_base/
│   └── {domain_module}.md (Spec Writer 작성)
├── {code_dir}/
│   ├── {feature_files}.ts/js (Developer 작성)
│   ├── {migration_files}.sql (DB 마이그레이션)
│   └── {test_files}.test.ts (tests)
├── .git/
│   └── commits (각 단계별 커밋)
└── _workspace/
    ├── 01_requirements-{id}.md
    ├── 02_specification-{id}.md
    ├── 03_code-{id}/
    ├── 04_validation-report-{id}.json
    ├── 05_test-results-{id}.json
    └── 06_deployment-log-{id}.json
```

---

## ✅ 테스트 시나리오

### 시나리오 1: 신규 기능 개발 (정상 흐름)

```
사용자: "쿨한으로 사용자 프로필 수정 기능 추가해"

→ Phase 0: 컨텍스트 확인
  └─ _workspace/ 없음 → 초기 실행

→ Phase 1: 팀 구성
  └─ 6명 팀 생성, 작업 할당

→ Task 1 (Intent Analyzer): 의도 분석
  └─ 산출: requirements-20260528-001.md
  └─ 관련 모듈: 01_member_system
  └─ 주요 작업: 프로필 수정 엔드포인트, 검증, 보안

→ Task 2 (Spec Writer): 스펙 작성
  └─ 산출: knowledge_base/01_member_system.md (업데이트)
  └─ 12개 섹션 완성
  └─ 기존 스펙과 충돌 확인 완료

→ Task 3 (Developer): 코드 구현
  └─ 산출: src/routes/user/profile.ts, migrations/XXX_profile.sql
  └─ 테스트 케이스 작성
  └─ 커밋: "feat(01_member_system): 프로필 수정 기능 - 스펙 참조"

→ Task 4 (Validator): 자동 검증
  └─ 9단계 검증 실행
  └─ 결과: PASS ✅
  └─ 산출: validation-report-20260528-001.json

→ Task 5 (QA Tester): 테스트 실행
  └─ 스펙 기반 테스트 케이스 실행
  └─ 결과: 25개 테스트 PASS ✅
  └─ 산출: test-results-20260528-001.json

→ Task 6 (DevOps/Deployer): 배포
  └─ Pre-Deploy 검증 PASS ✅
  └─ 데이터베이스 마이그레이션 성공 ✅
  └─ 코드 배포 성공 ✅
  └─ Post-Deploy 헬스체크 PASS ✅
  └─ 산출: deployment-log-20260528-001.json

✅ 완료!

최종 보고:
- 신규 기능: 프로필 수정
- 스펙 문서: knowledge_base/01_member_system.md
- 테스트: 25개 모두 통과
- 배포: v1.0.1 배포 완료
- 모니터링: 활성화됨
```

### 시나리오 2: 검증 실패 후 재실행

```
사용자: "쿨한으로 주문 기능 만들어"

→ Task 4 (Validator): 자동 검증
  └─ 결과: FAIL ❌
  └─ 실패 항목:
     - API 응답 형식 불일치 (3개 엔드포인트)
     - 데이터베이스 스키마 누락 (order_items 테이블)

→ 팀 자동 조율
  └─ Validator → Developer: 상세 리포트 전송
  └─ Developer: Task 3 재실행 (수정)

→ Task 3 (Developer): 코드 수정
  └─ 실패 항목 모두 수정
  └─ 재커밋: "fix(09_order_management): API 응답 형식 수정 - 검증 재실행"

→ Task 4 (Validator): 재검증
  └─ 9단계 검증 재실행
  └─ 결과: PASS ✅

→ Task 5 (QA Tester): 테스트 실행
  └─ 결과: PASS ✅

→ Task 6 (DevOps/Deployer): 배포
  └─ 결과: PASS ✅

✅ 최종 완료!
```

---

## 🔗 팀 통신 프로토콜

오케스트레이터와 팀원 간의 메시지 형식:

### 오케스트레이터 → 팀원 (작업 시작)

```
주제: Task {N} 시작 - {기능명}

작업: {작업 설명}
담당: {에이전트명}
의존성: Task {N-1} 완료됨 ✅

입력 파일:
- {previous-stage-output}.md

출력 파일:
- _workspace/{N}_{output}.{ext}

다음 단계: Task {N+1}

시간 제한: 없음 (필요시 소통)
```

### 팀원 → 오케스트레이터 (작업 완료)

```
주제: ✅ Task {N} 완료 - {기능명}

결과: SUCCESS

산출물:
- _workspace/{N}_{output}.md
- {summary}

다음 단계: Task {N+1} 준비

문제: 없음 (또는 상세 내용)
```

---

## 🎓 사용 예시

### 예시 1: 간단한 기능 추가

```
사용자: "쿨한으로 사용자 이메일 수정 기능 추가해"

결과: 약 30분 소요
- 스펙: 01_member_system.md 업데이트
- 코드: /user/{id}/email PATCH 엔드포인트
- 테스트: 8개 테스트 케이스
- 배포: v1.0.1 배포 완료
```

### 예시 2: 복잡한 기능

```
사용자: "쿨한으로 주문 환불 시스템 구축해"

결과: 약 2-3시간 소요
- 스펙: 09_order_management.md 확대
- 코드: 5개 엔드포인트, 데이터베이스 마이그레이션
- 테스트: 35개 테스트 케이스
- 배포: v1.1.0 배포 완료
```

### 예시 3: 단계별 실행

```
사용자: "쿨한으로 검증해"
→ Task 4 (Validator)만 실행, 현재 코드 검증

사용자: "쿨한으로 배포해"
→ Task 6 (DevOps/Deployer)만 실행, 배포 진행
```

---

## 📞 주의사항

1. **스펙 우선:** 모든 개발은 스펙에서 시작합니다
2. **자동 검증:** 매 단계마다 자동 검증이 실행됩니다
3. **팀 통신:** 팀원들이 자동으로 협력합니다 (중단할 필요 없음)
4. **복구 가능:** 이전 결과는 _workspace_prev/에 보관됩니다
5. **모니터링:** 배포 후 자동 모니터링이 시작됩니다

---

**생성 일자:** 2026-05-28  
**모델:** opus  
**팀:** CoolHan Development Harness
