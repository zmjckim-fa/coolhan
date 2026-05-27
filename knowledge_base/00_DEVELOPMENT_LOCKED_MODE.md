# Development Locked Mode - AI 실행 체계

**Effective Date:** 2026-05-27  
**Authority:** Executive Orchestrator  
**Status:** MANDATORY - 모든 개발 세션에 강제 적용

---

## 핵심 원칙

### AI 자유도 vs 정확성 트레이드오프

**원칙:**
```
자유도 ↑  →  정확성 ↓
자유도 ↓  →  정확성 ↑
```

**엔지니어링 결론:**
- 기획 단계: 브레인스토밍, 자유로운 탐색 허용
- **개발 단계: 규격 기반 실행만 허용** ← 지금 여기

**이유:**
1. AI는 과거 대화를 모두 기억하며 섞임
2. MD를 읽어도 원본 소스는 읽지 않음
3. 화일명/포트가 바뀌어도 과거 경로로 계속 시도
4. 막히면 문서 대신 자의적으로 문제 해결 시도
5. 작업 시간이 길어지면 규칙 자체를 잊음

---

## Development Locked Mode Rules

### ✋ 금지 사항 (STRICT - 위반 시 즉시 중단)

**절대 금지:**
- [ ] 과거 대화 기억 참조 - 브레인스토밍, 임시 아이디어 사용 금지
- [ ] 이전 세션의 추론 패턴 사용 - "이전에는 이렇게 했으니..." 금지
- [ ] 일반적 패턴에 기반한 기능 생성 - 추측 기반 개발 금지
- [ ] 막혔을 때 자의적 문제 해결 - 대신 문서 읽고 작업 중단
- [ ] MD에서 "아마도"로 시작하는 시도 - 불확실하면 중단
- [ ] 소스 코드 추측 - 실제 코드를 먼저 읽음

### ✓ 허용 사항만 사용

**ONLY 사용 가능한 정보:**

1. **Single Source of Truth 문서**
   - 00_TECH_PARAMETER_DEFINITION.md
   - 00_TECH_PARAMETER_MAPPING.md
   - 각 Module Spec (01-10)
   - Approved ERD/API documentation

2. **현재 Sprint 문서**
   - 현재 모듈의 구현 계획서
   - 현재 사용 중인 개발 가이드라인

3. **Actual Source Code**
   - 구현된 코드만 참조
   - 코드에서 읽은 것만 사실로 취급
   - MD와 코드가 다르면 코드가 정답

4. **Previous Success Patterns (VERIFIED)**
   - 이미 완성된 모듈에서 사용한 패턴만
   - 작동하는 코드 패턴만
   - 문서화되고 승인된 것만

---

## AI 행동 규칙 체크리스트

### 각 세션 시작 시 (MANDATORY)

- [ ] **메모리 상태 확인:** "I will NOT use previous conversation memories"
- [ ] **Mode 선언:** "DEVELOPMENT LOCKED MODE ACTIVE"
- [ ] **문서 로드:** 
  - [ ] 00_PROJECT_STATE.md 읽음
  - [ ] 현재 Module Spec 읽음
  - [ ] 00_CHANGE_REQUEST_LOG.md 읽음
  - [ ] 이 문서 (00_DEVELOPMENT_LOCKED_MODE.md) 읽음
- [ ] **금지 사항 재확인:** 위 7가지 금지 사항 모두 숙지

### 각 작업 시작 전 (MANDATORY)

- [ ] **Single Source 확인:** "이게 문서에 명시되어 있나?"
- [ ] **코드 현황 파악:** 실제 코드 구조 먼저 읽음
- [ ] **추론 금지:** 추측 기반 개발 금지 - 문서/코드에 없으면 물어봄
- [ ] **경로 확인:** 파일명, 포트, 경로가 문서와 일치하는지 확인

### 작업 중 막혔을 때 (CRITICAL)

**절대 하지 말아야 할 것:**
1. ❌ "이전에 이렇게 했으니까 이번에도..." - 금지
2. ❌ "일반적으로 이렇게 하는데..." - 금지
3. ❌ "아마도 이렇게 되겠지..." - 금지
4. ❌ 자의적 시도 반복 - 2회 실패 후 중단

**해야 할 것:**
1. ✓ 현재 코드 전체 읽기 (Bash cat 또는 Read)
2. ✓ 해당 Module Spec 관련 섹션 읽기
3. ✓ 유사 완성 모듈의 구현 방식 찾기
4. ✓ 문서/코드에 답이 없으면 **작업 중단 선언**

```markdown
[WORK PAUSED]
Reason: [구체적 이유]
Blocker: [막힌 이유]
Need: [필요한 정보/결정]
Waiting for: [누구의 지시/승인]
```

---

## 개발 및 배포 절차 모듈화

### 1. 코드 개발 (Development Phase)

**파일 구조 규칙:**
```
프로젝트/
├── src/
│   ├── modules/
│   │   ├── 01_member/
│   │   ├── 02_shopping/
│   │   └── ...
│   ├── shared/
│   └── config/
├── tests/
├── docs/
│   └── api/
└── config/
```

**명명 규칙 (변경 불가):**
- 모듈명: 01_member, 02_shopping 등 (변경 금지)
- 파일 경로: `/docs/api/` (변경 금지)
- 포트 설정: config.md에 명시된 포트만 사용 (변경 금지)

### 2. API 저장 (Documentation)

**API 문서 저장 위치:**
```
/docs/api/
├── 01_member_system/
│   ├── endpoints.md
│   ├── schema.json
│   └── examples.md
├── 02_shopping_mall/
├── ...
└── INDEX.md
```

**API 저장 프로세스:**
1. **코드 작성** → 2. **테스트** → 3. **API 문서화** → 4. **docs/api에 저장** → 5. **변경 로그 기록**

**AI 행동:**
- [ ] API 변경 시: 즉시 docs/api에 업데이트
- [ ] 기존 API와 다르면: change_request_log.md에 기록
- [ ] 끝낼 때: INDEX.md에 추가된 엔드포인트 목록 정리

### 3. GitHub 커밋 (Version Control)

**커밋 프로세스:**
```
1. 코드 작성 완료
2. API 문서 업데이트
3. change_request_log.md 업데이트 (변경사항 있으면)
4. 모듈 테스트 완료
5. git add [구체적 파일들]  ← 절대 "git add ." 금지
6. git commit -m "[모듈번호][작업유형] 설명"
```

**커밋 메시지 형식:**
```
[01_member][feature] Add 2FA setup endpoint
[02_shopping][fix] Cart total calculation
[09_order][refactor] Order status machine
[00_docs][update] API documentation
```

**AI 행동 규칙:**
- [ ] 커밋 전: git status로 의도하지 않은 파일 확인
- [ ] 구체적 파일만 add (절대 "." 사용 금지)
- [ ] 커밋 메시지 형식 준수
- [ ] 1개 모듈 = 1개 커밋 (여러 모듈 섞지 말 것)

### 4. 서버 배포 (Server Deployment)

**배포 절차:**
```
1. 모든 테스트 통과
2. GitHub 푸시 완료
3. 배포 체크리스트 확인
4. 서버 환경 설정 확인
5. 배포 실행
6. 배포 후 검증
```

**배포 체크리스트:**
- [ ] 환경 변수 설정 (config/.env에서 읽음)
- [ ] 데이터베이스 마이그레이션 완료
- [ ] API 엔드포인트 정상 작동 확인
- [ ] 이전 모듈과의 통합 테스트
- [ ] 배포 로그 기록

**AI 행동:**
- [ ] 배포 전: 배포 체크리스트 항목 모두 확인
- [ ] 환경 설정: 문서의 config.md에서만 읽음
- [ ] 배포 실패 시: 로그 읽고 원인 파악 (추측 금지)
- [ ] 배포 후: deployment_log.md에 시간, 모듈, 결과 기록

### 5. 기록 및 추적

**변경 이력 관리:**
```
각 배포/커밋마다:
├── change_request_log.md 업데이트
├── deployment_log.md 기록
├── API 문서 업데이트
└── git commit 메시지에 모두 반영
```

---

## AI가 자주 하는 실수 & 대응

### 실수 1: 과거 경로로 계속 시도
**증상:** "파일명을 api.js → api_service.js로 바꿨는데 AI가 계속 api.js 참조"

**원인:** MD를 읽었어도 소스 코드의 실제 파일명을 읽지 않음

**대응:**
```
❌ 금지: "아까 사용했던 경로로..."
✓ 필수: 실제 파일 탐색
  1. ls -la src/modules/01_member/  (현재 파일 확인)
  2. grep -r "api" src/           (실제 파일명 검색)
  3. Read로 실제 코드 읽기
```

### 실수 2: 포트 번호 혼동
**증상:** "config.md에 3000 명시되어 있는데 8000으로 시작"

**원인:** 일반적 포트(3000, 8080)로 추론

**대응:**
```
❌ 금지: "일반적으로 3000은 Node..."
✓ 필수: config.md에서만 읽기
  1. Read config.md
  2. 명시된 포트만 사용
  3. 의문나면 물어보기
```

### 실수 3: 막혔을 때 자의적 해결
**증상:** "API 호출이 실패하는데 계속 다른 방식으로 시도"

**원인:** 문서를 버리고 일반적 패턴으로 문제 해결 시도

**대응:**
```
BLOCKING CHECKLIST:
1. ❌ 시도 1회 실패 → 로그 읽기
2. ❌ 시도 2회 실패 → 코드 전체 읽기
3. ❌ 시도 3회 이상 → 작업 중단, 이유 설명

[WORK PAUSED]
Attempted: [2가지 시도]
Result: Both failed
Error: [정확한 에러 메시지]
Need: [필요한 정보]
```

### 실수 4: 문서 vs 코드 불일치 무시
**증상:** "문서에는 이렇게 하라고 했는데 코드가 다르게 되어 있음을 무시"

**원인:** MD는 이상적, 코드는 현실적 → 항상 코드가 정답

**대응:**
```
발견 시 즉시:
1. 실제 코드 구조 파악
2. change_request_log.md에 불일치 기록
3. 코드 기반으로 진행
4. 다음 리뷰에서 문서 수정
```

---

## 배포 및 API 저장 프로세스

### Daily Development Cycle

```
┌─ START
│
├─ [1] 코드 개발
│    └─ Module 01 구현
│    └─ 테스트 통과
│
├─ [2] API 문서화
│    └─ /docs/api/01_member/endpoints.md 작성
│    └─ examples.md 추가
│    └─ schema.json 생성
│
├─ [3] 변경 기록
│    └─ 00_CHANGE_REQUEST_LOG.md 업데이트
│    └─ git 커밋 메시지 작성
│
├─ [4] 테스트 및 검증
│    └─ 단위 테스트 실행
│    └─ 이전 모듈과 통합 테스트
│    └─ API 엔드포인트 검증
│
├─ [5] GitHub 커밋
│    └─ git add [구체적 파일]
│    └─ git commit -m "[01_member][feature] ..."
│    └─ git push
│
├─ [6] 서버 배포
│    └─ 배포 체크리스트 확인
│    └─ deployment_log.md 기록
│    └─ 배포 후 검증
│
└─ END
```

### Monthly Review Cycle

```
Every Friday:
1. 주간 커밋 리뷰
2. API 문서 일관성 확인
3. change_request_log.md 리뷰
4. deployment_log.md 요약
5. 다음 주 계획 수립
```

---

## 이 문서를 읽어야 하는 시점

**필수 읽음 시점:**
1. ✓ **각 개발 세션 시작 시** - 규칙 상기
2. ✓ **모듈 전환 시** - 새 모듈 시작 전
3. ✓ **막혔을 때** - 자의적 시도 전에
4. ✓ **배포 전** - 커밋 및 배포 프로세스 확인
5. ✓ **일주일마다** - 규칙 준수 여부 점검

**금지된 시점:**
- ❌ 규칙을 "참고"하고 "자의적 판단" - 금지
- ❌ "이전에 잘 되었으니까" - 금지
- ❌ "지금은 빠르게 진행해야 하니까" - 금지
- ❌ "이건 작은 것이니까" - 금지

---

## Sign-off

**Document:** 00_DEVELOPMENT_LOCKED_MODE.md  
**Created:** 2026-05-27  
**Authority:** Executive Orchestrator  
**Status:** 🔴 **MANDATORY - 모든 개발 세션에 강제 적용**

**핵심 메시지:**
> "자유도를 주면 정확성이 떨어진다."
> "개발 단계는 창작이 아니라 규격 기반 실행이다."
> "AI가 막혀도 자의적으로 시도하지 않도록 강제해야 한다."

**AI 체크:**
- [ ] 이 문서를 읽었는가? YES
- [ ] 금지 사항 7가지를 모두 이해했는가? YES
- [ ] 막혔을 때의 프로세스를 알겠는가? YES
- [ ] 과거 기억을 사용하지 않겠는가? YES
- [ ] 코드와 MD가 다르면 코드를 따르겠는가? YES

**시작:**
```
[DEVELOPMENT LOCKED MODE: ACTIVE]
Single Source of Truth: 00_PROJECT_STATE.md
Current Module: 01_member_system
Allowed Info: Specification + Actual Code
Forbidden: Previous memories, inference, free attempts
```
