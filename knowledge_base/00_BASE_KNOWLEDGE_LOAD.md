# Base Knowledge Load System
**Effective Date:** 2026-05-27  
**Purpose:** Load standardized system definitions BEFORE project starts, not derive from internet averages  
**Status:** MANDATORY for all project initialization

---

## 핵심 원칙

### 문제: AI가 일반 인터넷 평균 패턴을 따르는 이유

인간이 "쇼핑몰 만들어줘"라고 할 때:
- 인간 머릿속: 회원가입, 장바구니, 주문, 결제, 배송, 관리자, 재고, 환불, 세금 = 자동 포함
- AI 동작: 학습 데이터 전체 평균 패턴 → 일반적 쇼핑몰 구조 생성

**결과**: 회사 정의 vs 인터넷 평균이 충돌 → Spec drift 시작

### 해결책: Base Knowledge Core 선 로드

프로젝트 시작 BEFORE 개발:
```
1. Base Knowledge Core 선택 (어떤 시스템? 쇼핑몰 vs 구매대행 vs 마켓플레이스)
2. Industry Template 선택 (산업 표준 정의)
3. Company Rules Load (회사 내부 표준)
4. Project Spec Load (프로젝트 특화 규칙)
5. Current Sprint Load (현재 작업 세부사항)
6. Spec Lock 선언 (절대 변경 금지 항목 명시)
7. Development Start
```

---

## Base Knowledge Core 구조

### 각 Core의 구성 (필수 섹션)

```markdown
# [System]_core.md

## 1. 기본 포함 기능 (Non-Negotiable)
- 반드시 포함되는 기능들
- 선택 불가능한 핵심 요구사항

## 2. 기본 DB 구조
- 필수 테이블
- Primary domain entities

## 3. 기본 상태값 (Status Value Registry)
- 모든 가능한 상태 정의
- 상태 전이 규칙

## 4. 기본 API 엔드포인트
- 핵심 API 패턴
- 인증/권한 표준

## 5. 금지사항 (Prohibitions)
- MUST NOT 변경하는 항목
- 절대 추가 금지 기능

## 6. 산업 표준 시나리오
- Happy path (정상 흐름)
- Error scenarios (오류 처리)

## 7. 제약사항 (Constraints)
- 이 시스템은 X를 지원하지 않음
- Y는 반드시 이렇게만 구현
```

---

## Base Knowledge Core 목록

### 즉시 작성 필요 (높은 우선순위)

1. **shopping_mall_core.md**
   - 일반 B2C 이커머스
   - 회원, 상품, 장바구니, 주문, 결제, 배송, 관리자

2. **marketplace_core.md**
   - 다중 판매자 (Multi-vendor)
   - Seller onboarding, commission, dispute resolution

3. **purchase_agency_core.md**
   - 해외 구매대행
   - 환율, 관세, 배송 분리

4. **logistics_core.md**
   - 배송 최적화 시스템
   - Warehouse, route, tracking

5. **member_system_core.md**
   - 사용자 관리 기초
   - Auth, profile, consent

6. **admin_system_core.md**
   - 관리자 기능 표준
   - Roles, audit, moderation

---

## Project 시작 시 Base Knowledge Load 프로세스

### Step 1: 프로젝트 정의 선언

```markdown
[PROJECT INITIALIZATION]

Project Name: [Your Project Name]
Primary System Type: [Select Core(s): shopping_mall_core, marketplace_core, purchase_agency_core, etc.]

Load Sequence:
1. [Base Core 1].md (Base)
2. [Base Core 2].md (Base - if needed)
3. [Base Core 3].md (Base - if needed)
4. [Your Company Standards].md (Company)
5. [Your Project Rules].md (Project)
6. [Your Module Spec].md (Project)
7. [Your Current Sprint].md (Current)

Locked Until: All bases loaded
```

### Step 2: 각 Core 문서 검토

- [ ] 인간이 선택한 Core들 읽음
- [ ] 포함된 기능 목록 숙지
- [ ] 금지사항 명시
- [ ] 상태값 레지스트리 확인

### Step 3: Spec Lock 선언

```markdown
[SPEC LOCK: ACTIVE]

DO NOT MODIFY WITHOUT APPROVAL:
- Product structure (marketplace_core defines)
- Order workflow (marketplace_core + purchase_agency_core defines)
- Shipping workflow (logistics_core defines)
- Payment method options (marketplace_core defines)

CAN MODIFY WITH APPROVAL:
- UI components
- API response formatting
- Performance optimization

ABSOLUTELY CANNOT ADD:
- Multi-currency pricing (not in core)
- Subscription products (not in core)
- B2B wholesale (not in core)
```

### Step 4: 작업 범위 좁히기

```markdown
[CURRENT SPRINT WORK]

Sprint: Week 1
Focus: Seller onboarding flow only
Do NOT touch:
- Product catalog
- Order processing
- Shipping

Do TOUCH:
- Seller registration
- Seller profile
- Seller verification

Acceptance Criteria:
- Seller can create account
- Seller can upload business docs
- System auto-verifies eligible sellers
- Both existing order flow AND seller flow work
```

---

## 문제: AI Spec Drift 메커니즘

### 왜 발생하는가

AI는 본질적으로:
- **현재 문맥 기반 생성 엔진** (장기 일관성 유지 엔진이 아님)
- 초기 핵심 제약이 점차 컨텍스트 뒤로 밀림
- 새로운 추론/패턴이 기존 spec을 덮음
- Dynamic completion 성향이 spec lock보다 강함

**결과**:
```
작업 초기: "Order 30일 환불 정책 유지"
↓
작업 중간: "배송" 키워드 등장
↓
작업 후기: "배송 로직도 확인해야 하니까 배송 연동을..."
↓
결과: 원래 spec과 다른 것 구현
↓
인간: "왜 하던 걸 잊고 딴짓하냐"
```

### 해결책 4가지

#### 1. 현재 작업 고정 (Scope Fixing)

```markdown
CURRENT WORK:
- Order status transition ONLY
- Input: order_id + new_status
- Validation: Check current core.md transition rules
- Output: Order updated + notification sent
- Time limit: 2 hours max

DO NOT:
- Add new status values
- Modify payment flow
- Refactor inventory logic
```

#### 2. 절대 변경 금지 목록 (Immutable Spec)

```markdown
[DO NOT MODIFY THESE - VIOLATION = WORK STOPPED]

Order Workflow (from marketplace_core.md):
- pending → paid → shipped → delivered ✓
- pending → canceled ✓
- paid → returned → refunded ✓

CANNOT ADD:
- pending → processing (doesn't exist in core)
- paid → on_hold (not in core)

If you want to add: STOP → Ask approval → Update core.md → Continue
```

#### 3. 단계 단위 작업 (Step Decomposition)

```markdown
❌ WRONG:
"Build the entire shopping system"
→ AI drift = Guaranteed, scope = unbounded

✅ RIGHT:
Week 1: Member registration flow only
Week 2: Product catalog API only
Week 3: Shopping cart only
Week 4: Order creation only
```

#### 4. 완료 조건 고정 (Definition of Done)

```markdown
DONE DEFINITION:
✓ Build succeeds
✓ Existing order flow works (regression test)
✓ New status field created
✓ 2 transition rules added
✓ Email notification triggered
✗ UI changes
✗ Database schema expansion
✗ Payment logic modification
```

---

## AI의 "완료 불가" 문제

### 문제: AI가 "못한다" 선언을 못함

AI 특성:
- 유용해 보이려는 욕망
- 다음 시도를 계속 생성
- 빈칸을 메우려는 성향
- 대화를 끊지 않으려 함

**결과**: 성공 가능성 낮음 + 계속 진행 + 사용자 대기 + 토큰 소모

### 해결책: 강제 Pause Point

```markdown
BLOCKING RULE:

시도 1회 실패 → 로그 분석
시도 2회 실패 → 현재 코드 전체 읽기 + spec 재확인
시도 3회 이상 → 즉시 WORK PAUSED 선언

[WORK PAUSED - CANNOT CONTINUE]
Attempted: [2가지 시도 명시]
Reason: [정확한 실패 이유]
Error: [에러 메시지]
Need: [필요한 것]
  - 추가 정보? spec 업데이트? 아키텍처 검토? 

Waiting for: User decision
Cannot proceed without: Approval/clarification
```

**중요**: 이건 실패가 아니라 정상 동작입니다.
- 숙련된 엔지니어는 로그 3줄로 "지금 정보로 못 푼다" 판단
- AI도 같아야 함
- "계속 시도"는 실제로는 리소스 낭비

---

## Base Knowledge Load 실행 체크리스트

### 각 Project 시작 시

- [ ] 프로젝트에 필요한 Base Knowledge Core들 식별
- [ ] 각 Core의 "기본 포함 기능" 섹션 읽음
- [ ] 각 Core의 "금지사항" 섹션 읽음
- [ ] 각 Core의 "기본 상태값" 섹션 숙지
- [ ] 프로젝트 특화 규칙 문서들 로드
- [ ] Spec Lock 선언 작성
- [ ] 현재 Sprint 범위 좁히기
- [ ] 완료 조건 명시
- [ ] Development Locked Mode 다시 읽음
- [ ] Project State 문서 생성 + 로드된 Core들 기록

### 각 작업 시작 전

- [ ] 로드된 Core의 해당 섹션 읽음
- [ ] 현재 작업 범위 확인 (Spec Lock 내인가?)
- [ ] 변경 금지 항목 목록 재확인
- [ ] 완료 조건 명확히 함
- [ ] Scope creep 방지 선언

### 작업 중 막힐 때

- [ ] 로그/에러 읽기
- [ ] 현재 코드 전체 읽기
- [ ] Base Knowledge Core의 해당 부분 다시 읽기
- [ ] 2회 이상 실패 시: [WORK PAUSED] 선언 (강제)

---

## Base Knowledge Load vs Traditional Prompting

| 항목 | Traditional | Base Knowledge Load |
|------|-----------|-------------------|
| AI에 주는 것 | 프로젝트 설명 | 표준 시스템 정의 + 프로젝트 특화 규칙 |
| "쇼핑몰"의 의미 | 학습 데이터 평균 | 회사의 공식 정의 |
| Spec 변경 | 매 대화마다 가능 | Spec Lock 필요 |
| AI의 해석 우선순위 | 현재 문맥이 제1 | Core 정의가 제1 |
| 결과 | Spec drift 많음 | Spec lock으로 제어됨 |

---

## Next: Base Knowledge Core 작성 순서

### Tier 1 (이번 주)
1. ✅ 10개 도메인 모듈 (01-10) - 이미 완성
2. 🔄 shopping_mall_core.md
3. 🔄 marketplace_core.md
4. 🔄 purchase_agency_core.md

### Tier 2 (다음 주)
5. logistics_core.md
6. member_system_core.md
7. admin_system_core.md

### Tier 3 (추가 필요 시)
8. crm_core.md
9. erp_core.md
10. point_loyalty_core.md
11. subscription_core.md

---

## Sign-off

**Document:** 00_BASE_KNOWLEDGE_LOAD.md  
**Created:** 2026-05-27  
**Authority:** Design Architecture  
**Status:** 🟢 **ACTIVE - Ready to implement**

**핵심 메시지:**
> "프로젝트마다 매번 설명하지 말고, 회사 내부 표준 시스템 정의를 로드하라."
> "AI는 일반 인터넷 패턴이 아니라 명확한 산업 표준이 필요하다."
> "Spec Lock이 없으면 drift는 필연이다."

**AI 체크:**
- [ ] Base Knowledge Load의 개념을 이해했는가? YES
- [ ] Core 문서와 도메인 모듈의 차이를 알겠는가? YES
- [ ] Spec Lock의 중요성을 알겠는가? YES
- [ ] 막힐 때 강제 Pause Point를 지킬 것인가? YES
- [ ] "못한다" 선언을 할 것인가? YES
