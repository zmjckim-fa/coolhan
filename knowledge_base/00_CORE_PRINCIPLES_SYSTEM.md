# 핵심 원칙 (Core Principles of AI-Controlled Development System)

## 1. 문서 중심 아키텍처 (Document-Centric Architecture)

### 1.1 "AI는 기억하지 않는다. 문서가 기억한다."

```
┌─────────────────────────────────────────────────────────┐
│ AI의 기억 한계 (AI Memory Limitation)                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ❌ AI는 이전 대화를 기억하지 않음                        │
│  ❌ AI는 문맥 창을 벗어난 내용을 잊음                    │
│  ❌ AI는 자기 판단으로 변경할 수 없음                    │
│  ❌ AI는 규칙을 일방적으로 해석할 수 없음               │
│                                                         │
│ ✅ 문서는 모든 것을 기억함                               │
│ ✅ 문서는 명확하고 객관적임                              │
│ ✅ 문서는 버전 관리 가능함                               │
│ ✅ 문서는 변경 이력을 추적함                             │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 1.2 실행 원칙 (Execution Principle)

```
모든 모듈 실행 시 다음 프로세스 필수:

1. 문서 읽기 (Document Reading)
   └─ AI: 해당 모듈의 정의 문서 읽음 (예: 01_basic_logic.md)

2. 매개변수 검증 (Parameter Validation)
   └─ AI: PARAMETERS.md에서 해당 프로젝트의 매개변수 확인
   └─ 예: "DB 테이블명은 snake_case인가? PascalCase인가?"

3. 규칙 적용 (Rule Application)
   └─ AI: Rule Guard 규칙에 따라 작업 범위 확인
   └─ Rule Guard: "이 모듈에서 이것을 변경하면 안 된다"

4. 작업 실행 (Work Execution)
   └─ AI: 정의된 범위 내에서만 작업 수행

5. 검수 (QA Verification)
   └─ QA Lead: 기획서 대비 정확한가?
   └─ QA: 매개변수가 일관되게 적용되었나?

예시:
  모듈: "데이터베이스 스키마 생성"
  
  AI 동작:
  1. 📖 /docs/04_database_schema.md 읽음
  2. 🔍 PARAMETERS.md 확인: "table_naming = snake_case, prefix = tbl_"
  3. 📋 Rule Guard 확인: "CREATE INDEX 구문은 쿼리 생성 후"
  4. 💻 SQL 생성: tbl_users, tbl_products, ... (snake_case 적용)
  5. ✅ QA: "매개변수가 일관되게 적용되었나?" → 검증

→ AI가 임의로 다른 이름을 붙이거나 규칙을 무시할 수 없음
```

---

## 2. 오케스트레이터 제어 아키텍처 (Orchestrator-Controlled Architecture)

### 2.1 "AI는 자유롭게 개발하지 않는다"

```
┌──────────────────────────────────────────────────────────────┐
│ 개발 통제 계층 (Development Control Layers)                  │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ 🎯 Orchestrator (오케스트레이터)                             │
│    └─ 역할: 범위를 잠그고, 팀 조율, 진행 제어               │
│    └─ 권한: 모듈별 작업 범위 결정                          │
│    └─ 규칙: 이 모듈에서 이것만 하라                        │
│                                                              │
│ 🛑 Rule Guard (규칙 지킴이)                                 │
│    └─ 역할: 범위 이탈 방지                                 │
│    └─ 권한: 허용 범위 밖의 작업 차단                      │
│    └─ 규칙: 절대 이것을 변경하면 안 된다                 │
│                                                              │
│ ✅ QA Lead (품질 보증 리더)                                 │
│    └─ 역할: 기획서 대비 검수                               │
│    └─ 권한: 부적합 산출물 반려 가능                       │
│    └─ 규칙: 기획서 정의와 정확히 일치해야 함              │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 2.2 실행 흐름 (Execution Flow)

```
단계 1: Orchestrator가 범위 잠금 (Scope Locking)
  ┌─────────────────────────────────────────┐
  │ 모듈: "API 엔드포인트 생성"              │
  │ 범위:                                    │
  │  ✅ 허용: /api/v1/products (GET)        │
  │  ✅ 허용: /api/v1/products (POST)       │
  │  ❌ 금지: 데이터베이스 구조 변경         │
  │  ❌ 금지: 인증 로직 수정                 │
  │  ❌ 금지: 새로운 테이블 추가             │
  └─────────────────────────────────────────┘
  
단계 2: AI가 작업 준비
  ├─ 📖 /docs/05_api_standard.md 읽음
  ├─ 🔍 매개변수 확인: API 버전, 응답 형식
  ├─ 📋 범위 확인: Orchestrator 규칙 준수
  └─ 준비 완료
  
단계 3: Rule Guard가 이탈 방지 (Deviation Prevention)
  AI: "/products POST 엔드포인트 코드 생성 중..."
  AI: "응답 형식을 JSON-LD로 변경하면 더 좋을 것 같은데..."
  Rule Guard: 🛑 "멈춰! /docs/05_api_standard.md에서 
               응답 형식은 'wrapped'로 정의했다. 
               변경 금지!"
  
단계 4: 작업 완료 및 제출
  └─ AI: "/api/v1/products (GET, POST) 완성"
  
단계 5: QA Lead 검수 (Verification)
  QA: "기획서 확인: /docs/05_api_standard.md"
  QA: "✅ 응답 형식 일치"
  QA: "✅ HTTP 메서드 정확"
  QA: "✅ 매개변수 완전"
  QA: "✅ 에러 처리 포함"
  QA: "승인!"

→ AI가 범위를 벗어난 선의의 개선을 시도할 수 없음
→ 모든 변경사항이 검증됨
→ 기획서 준수 보장
```

### 2.3 Rule Guard 규칙의 3가지 유형 (Types of Rule Guard Rules)

```
유형 1: 절대 금지 (Absolute Prohibition)
  규칙: "DELETE 쿼리를 생성하면 안 된다"
  이유: 데이터 손실 위험
  적용: 모든 모듈에서 항상 금지
  
  예:
    ❌ DELETE FROM users WHERE ...
    ✅ UPDATE users SET deleted_at = NOW() WHERE ...

유형 2: 조건부 금지 (Conditional Prohibition)
  규칙: "새로운 테이블을 추가하려면 먼저 Orchestrator 승인 받아야 함"
  이유: 데이터베이스 스키마 일관성
  적용: 기본 설계 범위 내 금지, 특별 승인 시 허용
  
  예:
    ❌ 기본 모듈에서 새 테이블 추가 (금지)
    ✅ Orchestrator 승인 후 확장 모듈에서 추가 (허용)

유형 3: 범위 한정 (Scope Limitation)
  규칙: "이 모듈에서는 Product 테이블만 수정 가능"
  이유: 모듈간 의존성 관리
  적용: 해당 모듈에서만 특정 범위로 한정
  
  예:
    ❌ Inventory 테이블 수정 (다른 모듈 담당)
    ✅ Product 테이블 수정 (이 모듈 담당)
```

---

## 3. 버전 관리 및 추적 (Version Control & Tracking)

### 3.1 문서 버전 관리 (Document Versioning)

```
모든 문서는 다음을 추적해야 함:

/docs/MASTER_MANIFEST.md (마스터 문서)

매개변수:
  version: "1.0.0"
  created: "2026-05-27"
  last_modified: "2026-05-27"
  modified_by: "[이름]"
  
기획서_문서:
  01_basic_logic.md:
    version: "1.0"
    last_modified: "2026-05-27"
    parameters_applied: 
      - transaction_flow: "event-driven"
      - inventory_tracking: "real-time"
  
  02_core_features.md:
    version: "1.0"
    last_modified: "2026-05-27"
    changes_from_template:
      - "프로필 선택: 신뢰감"
      - "모바일 기능 제거 (웹 전용)"
  
  03_terminology.md:
    version: "1.0"
    
  04_database_schema.md:
    version: "1.0"
    parameters_applied:
      - "table_naming: snake_case, prefix = tbl_"
      - "soft_delete: true"
      - "audit_fields: true"

→ 모든 변경이 기록되고 추적 가능
→ 왜 이렇게 했는가를 나중에 알 수 있음
→ 의도하지 않은 변경을 감지 가능
```

### 3.2 의사결정 기록 (Decision Log)

```
/docs/DECISION_LOG.md

각 주요 의사결정을 기록:

[2026-05-27 14:30] 의사결정 #1
  제목: "API 버전 관리 방식 선택"
  선택지:
    - URL path versioning: /api/v1/
    - Header versioning: Accept-Version
    - Subdomain: api-v1.example.com
  선택: URL path versioning
  이유: "가장 일반적이고, REST 표준 준수"
  승인자: "[PM 이름]"
  
[2026-05-27 15:00] 의사결정 #2
  제목: "테이블 명명 규칙"
  선택: "snake_case, prefix = tbl_"
  이유: "읽기 쉽고, 예약어 충돌 방지"
  영향: "모든 데이터베이스 쿼리에 일관된 규칙 적용"
  
→ 나중에 누군가 "왜 snake_case인가?"라고 물어보면
→ 의사결정 로그를 보여줄 수 있음
→ 규칙을 바꿀 때도 영향도를 분석할 수 있음
```

---

## 4. 규칙 준수 검증 (Rule Compliance Verification)

### 4.1 자동 검증 체크리스트 (Automated Verification Checklist)

```
모든 모듈 완성 후 자동으로 검증:

✅ 문서 일관성 검증
   ├─ 01_basic_logic.md의 프로세스가
   ├─ 02_core_features.md에 반영되었는가?
   ├─ 03_terminology.md 용어가 사용되었는가?
   └─ 04_database_schema.md와 일치하는가?

✅ 매개변수 적용 검증
   ├─ 모든 테이블명이 선택된 명명 규칙을 따르는가?
   ├─ 모든 API 엔드포인트가 선택된 버전 방식을 따르는가?
   ├─ 모든 색상 변수가 디자인 프로필에 일치하는가?
   └─ 암호화 알고리즘이 선택된 방식인가?

✅ Rule Guard 준수 검증
   ├─ 금지된 코드 패턴이 없는가?
   ├─ 범위 밖의 테이블/모듈이 수정되지 않았는가?
   └─ 미승인 변경사항이 없는가?

✅ 접근성 검증
   ├─ 색상 대비가 WCAG AA 이상인가?
   ├─ 폰트 크기가 읽을 수 있는가?
   └─ 반응형 디자인이 모든 화면에서 작동하는가?

✅ 성능 검증
   ├─ 데이터베이스 쿼리가 인덱스되어 있는가?
   ├─ API 응답 시간이 목표치 이내인가?
   └─ CSS 파일 크기가 합리적인가?

→ 검증 통과 없이 다음 단계 진행 불가
→ 검증 실패 시 자동으로 상세 보고서 생성
```

### 4.2 검증 실패 보고서 (Failure Report Template)

```
검증_실패_보고서

[2026-05-27 16:45]
모듈: "04_database_schema.md - Users 테이블"

문제점 #1 (심각도: 높음)
  위치: /sql/create_users_table.sql, 라인 5
  
  검출: 컬럼명이 선택된 명명 규칙과 불일치
  예상: user_id (snake_case)
  실제: userId (camelCase)
  
  규칙: /docs/PARAMETERS.md에서
         "table_naming.pattern = snake_case"로 정의
  
  영향: 다른 쿼리에서 snake_case를 사용하여 불일치
  
  해결방법:
    1. user_id로 변경
    2. 모든 참조 쿼리 업데이트
    3. 재검증

문제점 #2 (심각도: 중간)
  위치: /sql/create_users_table.sql, 라인 12
  
  검출: soft_delete 필드 누락
  예상: deleted_at DATETIME NULL
  실제: 없음
  
  규칙: /docs/PARAMETERS.md에서
         "table_structure_variation.include_soft_delete = true"
  
  영향: 반품 기능에서 사용자 데이터 삭제 불가능
  
  해결방법:
    1. deleted_at 컬럼 추가
    2. 삭제 쿼리 업데이트 (DELETE → UPDATE deleted_at)
    3. 재검증

→ 모든 문제가 명확하게 특정됨
→ 해결 방법이 명시적임
→ AI는 이 보고서를 따라서 수정하고 재검증
```

---

## 5. 문서와 AI의 관계 (Relationship Between Documents and AI)

### 5.1 문서의 역할 (Document Roles)

```
┌────────────────────────────────────────────────────────┐
│ 문서의 4가지 역할 (Four Roles of Documents)             │
├────────────────────────────────────────────────────────┤
│                                                        │
│ 역할 1: 기억 (Memory)                                  │
│  └─ AI가 잊어도 문서는 기억한다                        │
│                                                        │
│ 역할 2: 검증 (Verification)                            │
│  └─ 산출물이 문서와 일치하는지 확인한다               │
│                                                        │
│ 역할 3: 범위 (Scope)                                   │
│  └─ 무엇을 해야 하고 무엇을 하면 안 되는지 명시      │
│                                                        │
│ 역할 4: 정당화 (Justification)                         │
│  └─ 왜 이렇게 했는지를 나중에 설명한다               │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### 5.2 AI의 역할 (AI Roles)

```
┌────────────────────────────────────────────────────────┐
│ AI의 3가지 역할 (Three Roles of AI)                    │
├────────────────────────────────────────────────────────┤
│                                                        │
│ 역할 1: 실행 (Execution)                               │
│  └─ 문서가 정의한 범위 내에서 작업 수행               │
│                                                        │
│ 역할 2: 생성 (Generation)                              │
│  └─ 매개변수에 따라 프로젝트별 다른 산출물 생성      │
│                                                        │
│ 역할 3: 보고 (Reporting)                               │
│  └─ 작업 결과를 명확하게 보고, 검증 받음             │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

## 6. 시스템 안정성 (System Reliability)

### 6.1 "AI가 자유롭게 개발하지 않기" 때문에 얻는 이점

```
이점 1: 일관성 (Consistency)
  모든 프로젝트의 구조가 명확하고 예측 가능
  
이점 2: 추적 가능성 (Traceability)
  모든 결정과 변경이 기록되어 있음
  
이점 3: 재현성 (Reproducibility)
  같은 매개변수면 같은 결과 생성
  
이점 4: 감사 (Auditability)
  규정 준수 여부를 쉽게 확인 가능
  
이점 5: 위험 최소화 (Risk Minimization)
  AI가 자의적으로 보안 규칙을 무시할 수 없음
  
이점 6: 팀 협업 (Team Collaboration)
  모든 팀원이 같은 기준으로 작업
```

---

## 결론 (Conclusion)

### 시스템의 3가지 핵심 원칙 (Three Core Principles)

```
1️⃣  문서가 기억한다 (Documents Remember)
    └─ AI는 매 모듈마다 문서를 다시 읽는다

2️⃣  오케스트레이터가 통제한다 (Orchestrator Controls)
    └─ Rule Guard가 범위 이탈을 방지한다

3️⃣  QA가 검증한다 (QA Verifies)
    └─ 기획서 대비 정확성을 보장한다

이 세 가지 원칙으로:
✅ 일관성 있는 개발
✅ 보안 준수
✅ 추적 가능한 의사결정
✅ 프로젝트별 다양성 (보안)
✅ 인간의 통제 유지
```

---

**버전**: 1.0
**작성일**: 2026-05-27
**상태**: 초안 - 구현 준비 완료
