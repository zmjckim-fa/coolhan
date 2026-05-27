# CoolHan 문서 완벽 가이드 - 종류별 상세 설명

**문서 작성일:** 2026-05-27  
**목적:** 각 문서의 역할, 사용 시점, 작성 방법을 한눈에 파악

---

## 📚 문서 종류 및 분류

### 🔴 필수 문서 (반드시 읽어야 함)

| 문서 | 읽는 시점 | 역할 | 분량 |
|------|---------|------|-----|
| README.md | 맨 처음 | CoolHan 전체 개요 | 10분 |
| INSTALLATION_GUIDE.md | 설치할 때 | 설치 및 기본 사용법 | 15분 |
| 00_AI_MASTER_RULES.md | 개발 시작 전 | AI 실행 규칙 11개 | 20분 |
| 00_DEVELOPMENT_LOCKED_MODE.md | 매 작업 시작 전 | 엄격한 개발 모드 | 10분 |

### 🟠 중요 문서 (프로젝트별로)

| 문서 | 사용 | 역할 | 분량 |
|------|------|------|-----|
| 00_BASE_KNOWLEDGE_LOAD.md | 프로젝트 초기화 | Core 로드 프로세스 | 15분 |
| 00_ARCHITECTURE_CONFLICT_RESOLUTION.md | 다중 모듈 | 11개 충돌 해결 방법 | 20분 |
| 00_STATUS_VALUE_REGISTRY.md | API/DB 설계 | 모든 상태값 정의 | 30분 |
| 00_MODULE_RESPONSIBILITY_MATRIX.md | 권한 설정 | 모듈 책임 행렬 | 25분 |

### 🟡 선택 문서 (참고용)

| 문서 | 사용 | 역할 | 분량 |
|------|------|------|-----|
| 00_SPECIFICATION_PARAMETERIZATION_SYSTEM.md | 요구사항 | 매개변수화된 spec | 20분 |
| 00_DESIGN_PARAMETERIZATION_SYSTEM.md | 디자인 | 매개변수화된 디자인 | 20분 |
| 00_CORE_PRINCIPLES_SYSTEM.md | 개념 이해 | 3가지 핵심 원칙 | 10분 |
| 00_KNOWLEDGE_BASE_EXTENSIBILITY.md | 확장 | Core 확장 방법 | 15분 |

### 🟢 Base Knowledge Core들

| Core | 프로젝트 타입 | 역할 | 분량 |
|------|-------------|------|-----|
| shopping_mall_core.md | B2C 이커머스 | 쇼핑몰 표준 | 40분 |
| marketplace_core.md | 다중 판매자 | 마켓플레이스 표준 | 50분 |
| purchase_agency_core.md | 해외 구매대행 | 구매대행 표준 | 45분 |
| logistics_core.md* | 배송 관리 | 배송 표준 | (예정) |
| member_system_core.md* | 회원 관리 | 회원 표준 | (예정) |
| admin_system_core.md* | 관리자 | 관리자 표준 | (예정) |

*예정 문서

### 🔵 도메인 모듈 설명 (참고용)

| 모듈 | 기능 | 역할 | 분량 |
|------|------|------|-----|
| 01_member_system | 회원 | 회원가입, 로그인, 프로필 | 20분 |
| 02_shopping_mall | 상품/장바구니 | 상품 카탈로그, 구매 | 20분 |
| 03_payment_system | 결제 | 결제, 환불, 정산 | 20분 |
| 04_shipping_logistics | 배송 | 배송 관리, 추적 | 20분 |
| 05_admin_system | 관리 | 관리자 기능, 감사 | 20분 |
| 06_notification | 알림 | 알림, 이메일, SMS | 15분 |
| 07_review_rating | 리뷰 | 리뷰, 평점, 댓글 | 15분 |
| 08_inventory_management | 재고 | 재고, 예약, 조정 | 20분 |
| 09_order_management | 주문 | 주문, 반품, 정산 | 20분 |
| 10_gdpr_privacy | 개인정보 | 동의, 삭제, 보호 | 15분 |

---

## 1️⃣ 필수 문서 상세 가이드

### README.md
**언제:** 아주 처음  
**읽는 시간:** 약 10분  
**역할:** CoolHan 전체 개요  

**내용:**
```
- CoolHan이란 뭔가?
- 해결하는 문제 5가지
- 핵심 기능 5가지
- 디렉토리 구조
- 빠른 시작 3단계
- 핵심 개념 5개
- 아키텍처 충돌 해결 11개
- 기술 스택
- 로드맵
```

**체크리스트:**
- [ ] CoolHan의 목적 이해
- [ ] 자신의 프로젝트 유형 파악 (e.g., 쇼핑몰)
- [ ] 어떤 Core를 로드할지 결정
- [ ] Base Knowledge Core vs Domain Module 구분

**다음:** INSTALLATION_GUIDE.md로 이동

---

### INSTALLATION_GUIDE.md
**언제:** 설치할 때  
**읽는 시간:** 약 15분  
**역할:** 설치 및 기본 사용법  

**내용:**
```
- 개요
- 시스템 요구사항
- 설치 방법 4단계
- 프로젝트 시작 체크리스트
- 문서 구조 설명
- 사용 방법 3가지
- FAQ 5개
- 문제 해결
- 지원 및 피드백
```

**체크리스트:**
- [ ] GitHub에서 성공적으로 클론
- [ ] 디렉토리 구조 확인
- [ ] 핵심 문서 4개 찾음
- [ ] VS Code 확장 설치 (선택)
- [ ] 로컬 HTTP 서버 실행 (선택)

**다음:** 00_AI_MASTER_RULES.md로 이동

---

### 00_AI_MASTER_RULES.md
**언제:** 개발 시작 전, 개발 중간중간  
**읽는 시간:** 약 20분  
**역할:** AI 실행 규칙 11개 - 가장 중요한 문서  

**11가지 규칙:**
```
Rule 1: Single Source of Truth (중앙 진실)
  → 9개 필수 문서 (ERD, API spec, DB schema 등)

Rule 2: Absolute Prohibitions (절대 금지)
  → 6가지 즉시 중단 행동

Rule 3: Pre-task Checklist (작업 전 체크)
  → 매 작업 시작 전 4가지 확인

Rule 4: Task Lock (범위 고정)
  → DO / DON'T 명시

Rule 5: Status Report (상태 보고)
  → 매 응답마다 현황 보고

Rule 6: Self-Check (자체 검증)
  → 9가지 자체 점검

Rule 7: Stop Condition (중단 조건)
  → 3회 이상 실패 시 [WORK PAUSED]

Rule 8: Approval Gates (승인 게이트)
  → 단계 전환 전 확인

Rule 9: Uncertainty Protocol (불확실성 대응)
  → 해석이 여러 개일 때

Rule 10: Doc/Code Consistency (문서/코드 일관성)
  → 충돌 시 코드 따름

Rule 11: Project State Storage (상태 저장)
  → 프로젝트 상태 기록
```

**체크리스트:**
- [ ] 11개 규칙 모두 이해
- [ ] 자신의 AI 도구에 이 파일 로드
- [ ] 중단 조건 (Rule 7) 숙지
- [ ] Status Report 형식 (Rule 5) 암기

**다음:** 00_DEVELOPMENT_LOCKED_MODE.md로 이동

---

### 00_DEVELOPMENT_LOCKED_MODE.md
**언제:** 매 작업 시작 전  
**읽는 시간:** 약 10분  
**역할:** 엄격한 개발 모드 - 규칙을 잊지 않도록 강제  

**핵심:**
```
금지사항 7가지:
  ✗ 과거 대화 기억 참조
  ✗ 이전 세션의 추론 패턴
  ✗ 일반적 패턴에 기반한 생성
  ✗ 막혔을 때 자의적 해결
  ✗ "아마도"로 시작하는 시도
  ✗ 소스 코드 추측
  ✗ MD에서 불확실한 것

허용 정보:
  ✓ Single Source of Truth 문서
  ✓ 현재 Sprint 문서
  ✓ 현재 Module Spec
  ✓ 승인된 ERD/API 문서
  ✓ 실제 작동하는 이전 코드
```

**체크리스트:**
- [ ] 매 작업 시작 시 이 문서 재확인
- [ ] 금지사항 7가지 숙지
- [ ] 허용 정보 4가지만 사용
- [ ] 막혔을 때 이 문서의 "막혔을 때" 섹션 읽음

**다음:** 프로젝트별 문서로 이동 (아래 참고)

---

## 2️⃣ 프로젝트별 문서 선택 가이드

### 시나리오 1: B2C 쇼핑몰 만들기

```
프로젝트 준비:
  1. ✓ README.md
  2. ✓ INSTALLATION_GUIDE.md
  3. ✓ 00_AI_MASTER_RULES.md
  4. ✓ 00_DEVELOPMENT_LOCKED_MODE.md
  5. ✓ 00_BASE_KNOWLEDGE_LOAD.md

Core 로드:
  1. ✓ shopping_mall_core.md (필수)

중앙 진실 문서 작성:
  1. 01_PROJECT_OVERVIEW.md
  2. 02_REQUIREMENTS.md
  3. 03_ERD.md
  4. 04_API_SPECIFICATION.md
  5. 05_DATABASE_SCHEMA.md
  6. 06_STATUS_DEFINITIONS.md
  7. 07_PERMISSIONS.md
  8. 08_PROHIBITIONS.md

개발 중 참고:
  - 00_ARCHITECTURE_CONFLICT_RESOLUTION.md (선택)
  - 00_STATUS_VALUE_REGISTRY.md (참고)
  - 00_MODULE_RESPONSIBILITY_MATRIX.md (참고)

읽는 시간: 약 2시간
개발 준비 시간: 약 3일
```

### 시나리오 2: 다중 판매자 마켓플레이스 만들기

```
프로젝트 준비:
  1. ✓ README.md
  2. ✓ INSTALLATION_GUIDE.md
  3. ✓ 00_AI_MASTER_RULES.md
  4. ✓ 00_DEVELOPMENT_LOCKED_MODE.md
  5. ✓ 00_BASE_KNOWLEDGE_LOAD.md

Core 로드:
  1. ✓ shopping_mall_core.md (필수)
  2. ✓ marketplace_core.md (필수)

중앙 진실 문서 작성:
  1. 01_PROJECT_OVERVIEW.md
  2. 02_REQUIREMENTS.md
  3. 03_ERD.md
  4. 04_API_SPECIFICATION.md
  5. 05_DATABASE_SCHEMA.md
  6. 06_STATUS_DEFINITIONS.md
  7. 07_PERMISSIONS.md
  8. 08_PROHIBITIONS.md

개발 중 필수:
  - 00_ARCHITECTURE_CONFLICT_RESOLUTION.md (필수 - 충돌 해결)
  - 00_STATUS_VALUE_REGISTRY.md (필수 - 상태값)
  - 00_MODULE_RESPONSIBILITY_MATRIX.md (필수 - 권한)

읽는 시간: 약 3시간
개발 준비 시간: 약 5일
개발 시간: 약 5개월 (6인 팀)
```

### 시나리오 3: 해외 구매대행 시스템 만들기

```
프로젝트 준비:
  1. ✓ README.md
  2. ✓ INSTALLATION_GUIDE.md
  3. ✓ 00_AI_MASTER_RULES.md
  4. ✓ 00_DEVELOPMENT_LOCKED_MODE.md
  5. ✓ 00_BASE_KNOWLEDGE_LOAD.md

Core 로드:
  1. ✓ purchase_agency_core.md (필수)
  2. ✓ logistics_core.md (권장)

중앙 진실 문서 작성:
  1. 01_PROJECT_OVERVIEW.md
  2. 02_REQUIREMENTS.md
  3. 03_ERD.md
  4. 04_API_SPECIFICATION.md
  5. 05_DATABASE_SCHEMA.md
  6. 06_STATUS_DEFINITIONS.md
  7. 07_PERMISSIONS.md
  8. 08_PROHIBITIONS.md

개발 중 필수:
  - 00_ARCHITECTURE_CONFLICT_RESOLUTION.md
  - 00_STATUS_VALUE_REGISTRY.md
  - 00_MODULE_RESPONSIBILITY_MATRIX.md

특별 참고:
  - purchase_agency_core.md의 "7. 제약사항" 섹션
  - purchase_agency_core.md의 "6. 산업 표준 시나리오"

읽는 시간: 약 2.5시간
개발 준비 시간: 약 4일
개발 시간: 약 4개월 (5인 팀)
```

---

## 3️⃣ 문서별 깊이 가이드

### 초급자 (읽어야 할 문서)
```
1. README.md                          (10분)
2. INSTALLATION_GUIDE.md              (15분)
3. 00_DEVELOPMENT_LOCKED_MODE.md      (10분)
4. 프로젝트 관련 Core 1개             (40분)

합계: 약 75분
```

### 중급자 (추가 읽을 문서)
```
위의 초급 4개 +
5. 00_AI_MASTER_RULES.md              (20분)
6. 00_BASE_KNOWLEDGE_LOAD.md          (15분)
7. 00_ARCHITECTURE_CONFLICT_RESOLUTION.md (20분)

합계: 약 130분 (2시간 10분)
```

### 고급자 (모두 읽을 문서)
```
위의 중급 7개 +
8. 00_STATUS_VALUE_REGISTRY.md        (30분)
9. 00_MODULE_RESPONSIBILITY_MATRIX.md (25분)
10. 00_SPECIFICATION_PARAMETERIZATION_SYSTEM.md (20분)
11. 00_DESIGN_PARAMETERIZATION_SYSTEM.md (20분)
12. 00_CORE_PRINCIPLES_SYSTEM.md      (10분)
13. 00_KNOWLEDGE_BASE_EXTENSIBILITY.md (15분)
14. 도메인 모듈 설명 (필요한 것) (60분)

합계: 약 350분 (5시간 50분)
```

---

## 4️⃣ 문서 활용 체크리스트

### 프로젝트 시작 체크리스트
```
□ README.md 읽음
□ INSTALLATION_GUIDE.md 읽음
□ 자신의 프로젝트 타입 파악 (쇼핑몰? 마켓플레이스?)
□ 필요한 Core 결정
□ 00_AI_MASTER_RULES.md 읽음
□ 00_DEVELOPMENT_LOCKED_MODE.md 읽음
□ 00_BASE_KNOWLEDGE_LOAD.md 읽음
□ 중앙 진실 문서 8개 준비 (또는 생성)
□ AI 도구에 규칙 문서 로드
□ 개발 시작!
```

### 개발 중 매일 체크리스트
```
아침 (개발 시작):
  □ 00_DEVELOPMENT_LOCKED_MODE.md 5분 읽음
  □ 어제 프로젝트 상태 확인
  □ 오늘의 Task Lock 작성
  
점심 (중간 점검):
  □ 00_AI_MASTER_RULES.md의 관련 규칙 재확인
  □ 상태값 변경이 있으면 STATUS_VALUE_REGISTRY 확인
  
저녁 (완료):
  □ 오늘의 Status Report 작성
  □ 프로젝트 상태 파일 업데이트
  □ 내일 계획 준비
```

### 문제 발생 시 체크리스트
```
막혔을 때:
  □ 00_DEVELOPMENT_LOCKED_MODE.md의 "작업 중 막혔을 때" 섹션 읽음
  □ 로그 분석
  □ 현재 코드 전체 읽음
  □ 2회 이상 실패하면 [WORK PAUSED] 선언

상태값 불명확할 때:
  □ 00_STATUS_VALUE_REGISTRY.md 검색
  □ 해당 엔티티의 상태값 목록 확인
  □ 상태 전이 규칙 확인
  □ 없으면 문서 업데이트

권한 불명확할 때:
  □ 00_MODULE_RESPONSIBILITY_MATRIX.md 검색
  □ 테이블/API 소유 모듈 확인
  □ 접근 권한 확인
  □ FORBIDDEN CALLS 확인

충돌 발생할 때:
  □ 00_ARCHITECTURE_CONFLICT_RESOLUTION.md 검색
  □ 충돌 번호 찾기
  □ "Single Source of Truth" 모듈 확인
  □ 해당 모듈에만 구현
```

---

## 5️⃣ 문서 학습 순서

### 시간 순서별
```
| 시간 | 문서 | 목표 |
|------|------|------|
| 0시간 | README.md | 개요 이해 |
| 10분 | INSTALLATION_GUIDE.md | 설치 완료 |
| 25분 | 00_DEVELOPMENT_LOCKED_MODE.md | 규칙 숙지 |
| 35분 | 00_AI_MASTER_RULES.md | 11개 규칙 이해 |
| 55분 | 00_BASE_KNOWLEDGE_LOAD.md | Core 로드 프로세스 이해 |
| 70분 | 프로젝트 Core | 표준 정의 이해 |
| 110분 | 중앙 진실 문서 작성 시작 | 프로젝트 초기화 |
```

### 깊이 순서별
```
| 단계 | 문서 | 내용 |
|------|------|------|
| 1단계: 개념 | README.md | CoolHan이 뭔가? |
| 2단계: 설치 | INSTALLATION_GUIDE.md | 어떻게 설치? |
| 3단계: 규칙 | 00_DEVELOPMENT_LOCKED_MODE.md | 어떤 규칙? |
| 4단계: 마스터 | 00_AI_MASTER_RULES.md | 모든 규칙은? |
| 5단계: 프로세스 | 00_BASE_KNOWLEDGE_LOAD.md | 프로젝트는 어떻게? |
| 6단계: 표준 | Core (1개) | 우리 도메인의 표준은? |
| 7단계: 충돌 해결 | 00_ARCHITECTURE_CONFLICT_RESOLUTION.md | 여러 모듈이면 어떻게? |
| 8단계: 상태값 | 00_STATUS_VALUE_REGISTRY.md | 모든 상태값은? |
| 9단계: 권한 | 00_MODULE_RESPONSIBILITY_MATRIX.md | 누가 뭘 할 수 있는가? |
| 10단계: 실무 | 프로젝트 | 실제 개발 시작 |
```

---

## 6️⃣ 문서 인쇄/저장 팁

### 최적의 인쇄 순서
```
1. README.md (1-2장)
2. INSTALLATION_GUIDE.md (3-4장)
3. 00_AI_MASTER_RULES.md (5-8장)
4. 00_DEVELOPMENT_LOCKED_MODE.md (9-11장)
5. 프로젝트 Core (12-30장)
6. 00_ARCHITECTURE_CONFLICT_RESOLUTION.md (31-35장)
7. 00_STATUS_VALUE_REGISTRY.md (36-50장)
8. 00_MODULE_RESPONSIBILITY_MATRIX.md (51-60장)

전체: 약 60페이지 (A4 기준)
```

### 북마크 추천
```
VS Code:
  Ctrl+B → outline 펼치기 → 주요 섹션 즐겨찾기

GitHub:
  각 문서의 Table of Contents 링크 저장

브라우저:
  knowledge_base/ 폴더를 북마크 바에 고정
```

### PDF 변환
```bash
# Pandoc 사용
pandoc knowledge_base/00_AI_MASTER_RULES.md -o rules.pdf

# 한번에 모두 변환
for f in knowledge_base/*.md; do
  pandoc "$f" -o "${f%.md}.pdf"
done
```

---

## 7️⃣ 자주 참고하는 섹션

### 개발 중 자주 보는 부분
```
00_STATUS_VALUE_REGISTRY.md
  → "1. Member System" → "User Status"
  → 새로운 사용자 상태 추가할 때

00_MODULE_RESPONSIBILITY_MATRIX.md
  → "1. Database Tables"
  → 새로운 테이블 생성할 때
  
  → "2. API Endpoints"
  → 새로운 API 생성할 때

00_DEVELOPMENT_LOCKED_MODE.md
  → "작업 중 막혔을 때"
  → 30분 이상 막혔을 때
```

### 모듈 충돌 확인
```
00_ARCHITECTURE_CONFLICT_RESOLUTION.md
  → "충돌 #1 ~ #11" 각각
  → 특정 기능을 구현할 때마다 확인
  
예: "payment_status"라는 상태값을 추가하려고 함
  → "충돌 #3: 상태값 레지스트리 부재" 참조
  → STATUS_VALUE_REGISTRY.md에서 확인
  → "3. Payment System" → "Payment Status" 섹션 읽음
```

---

## 📝 최종 요약

| 문서 | 언제 | 얼마나 자주 | 중요도 |
|------|------|----------|--------|
| README.md | 처음 1회 | 1회 | ⭐⭐⭐⭐⭐ |
| INSTALLATION_GUIDE.md | 설치 시 | 1회 | ⭐⭐⭐⭐⭐ |
| 00_AI_MASTER_RULES.md | 개발 전 | 매주 1회 | ⭐⭐⭐⭐⭐ |
| 00_DEVELOPMENT_LOCKED_MODE.md | 매 일 아침 | 매일 1회 | ⭐⭐⭐⭐⭐ |
| 00_BASE_KNOWLEDGE_LOAD.md | 프로젝트 시작 | 1회 | ⭐⭐⭐⭐ |
| Core (프로젝트 타입) | 프로젝트 시작 | 1-2회 | ⭐⭐⭐⭐ |
| 00_ARCHITECTURE_CONFLICT_RESOLUTION.md | 필요할 때 | 주 1-2회 | ⭐⭐⭐⭐ |
| 00_STATUS_VALUE_REGISTRY.md | 필요할 때 | 주 2-3회 | ⭐⭐⭐⭐ |
| 00_MODULE_RESPONSIBILITY_MATRIX.md | 필요할 때 | 주 1-2회 | ⭐⭐⭐ |
| 기타 참고 문서 | 심화 학습 | 월 1-2회 | ⭐⭐⭐ |

---

**이 가이드로 CoolHan의 모든 문서를 효율적으로 활용하세요! 📚**

