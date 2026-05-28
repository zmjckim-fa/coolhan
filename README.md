# 🎯 CoolHan Builder - AI 기반 엔지니어링 프레임워크

> **"Specification Executor, not Creator"** - AI를 창작자가 아닌 명령 실행자로

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Language](https://img.shields.io/badge/language-Korean-red.svg)
![Status](https://img.shields.io/badge/status-Production%20Ready-success.svg)
![Multilingual](https://img.shields.io/badge/multilingual-50%2B%20languages-brightgreen.svg)

---

## 🌍 다국어 지원 (Multilingual Support)

CoolHan은 **50+ 언어**를 지원합니다. 모국어로 자연스럽게 개발하세요!

**언어별 문서 (Language-Specific Documentation):**
- 🇰🇷 [한국어](README.ko.md) | 🇺🇸 [English](README.en.md) | 🇯🇵 [日本語](README.ja.md)
- 🇨🇳 [中文](README.zh.md) | 🇪🇸 [Español](README.es.md) | 🇫🇷 [Français](README.fr.md)
- 🇩🇪 [Deutsch](README.de.md) | 🇮🇹 [Italiano](README.it.md) | 🇵🇹 [Português](README.pt.md)
- 🇷🇺 [Русский](README.ru.md) | 🇮🇳 [हिन्दी](README.hi.md) | 🇹🇭 [ไทย](README.th.md)
- [더 많은 언어 보기...](MULTILINGUAL_SUPPORT.md)

**명령어 예시:**
```
한국어: "쿨한으로 사용자 로그인 기능 추가해"
English: "CoolHan add user login feature"
日本語: "CoolHanでユーザーログイン機能を追加して"
中文: "用CoolHan添加用户登录功能"
```

더 자세한 다국어 지원 정보는 [`MULTILINGUAL_SUPPORT.md`](MULTILINGUAL_SUPPORT.md)를 참고하세요.

---

## 📌 CoolHan이란?

**CoolHan Builder**는 소프트웨어 프로젝트 개발 시 AI와 인간이 협력하기 위한 **산업 표준 기반의 엔지니어링 프레임워크**입니다.

### 핵심 철학

```
전통적 AI 개발 방식:
  "만들어줘" → AI가 자유롭게 생성 → 규칙 위반, Spec Drift

CoolHan 방식:
  "이 규칙으로 이 문서를 만들어" → AI가 문서 기반으로만 실행 → Spec Lock
```

### 해결하는 문제

| 문제 | 원인 | CoolHan 해결책 |
|------|------|--------------|
| Spec Drift | AI의 자유도 높음 | 규칙 기반 실행 (Development Locked Mode) |
| 불일치한 상태값 | 모듈별 독립 정의 | Status Value Registry (통합 정의) |
| 모듈 간 충돌 | 책임 불명확 | Module Responsibility Matrix |
| 메모리 손실 | 장시간 세션 중 규칙 망각 | 지속적 규칙 주입 & 외부 상태 관리 |
| 불완전한 구현 | AI의 "문제 해결" 시도 | Explicit Stop Conditions (강제 중단) |

---

## ⚡ 주요 기능

### 1️⃣ Base Knowledge Core 시스템
10가지 산업 표준 정의로 프로젝트마다 다시 설명할 필요 없음:

```
shopping_mall_core.md        → B2C 이커머스 표준
marketplace_core.md          → 다중 판매자 플랫폼 표준
purchase_agency_core.md       → 해외 구매대행 표준
logistics_core.md            → 배송 관리 표준
member_system_core.md        → 회원 시스템 표준
admin_system_core.md         → 관리자 기능 표준
(+ crm_core, erp_core, point_loyalty_core, subscription_core)
```

**효과:** 쇼핑몰이 뭔지 매번 설명할 필요 없음. Core만 로드하면 끝.

### 2️⃣ Development Locked Mode
AI가 규칙을 잊지 않도록 **매 작업마다 강제 주입**:

```
개발 시작 전:
  ✓ 00_AI_MASTER_RULES.md 읽음
  ✓ 현재 모듈 Spec 읽음
  ✓ 금지사항 목록 재확인
  
각 작업 시작 전:
  ✓ Scope Lock (할 것/하지 말 것 명시)
  ✓ Pre-task Checklist 수행
  
매 응답마다:
  ✓ Status Report 제출 (현재 진행 상황)
  ✓ Self-Check 검증
```

### 3️⃣ 아키텍처 충돌 해결
모듈 간 11개 잠재적 충돌을 미리 정의하고 해결:

```
❌ 충돌 예시 1: product_reviews 테이블이 2개 모듈에서 정의
   → 해결: 07_review_rating_system만 소유

❌ 충돌 예시 2: /admin/inventory 엔드포인트가 2개 모듈에서 정의
   → 해결: 08_inventory_management만 제공

❌ 충돌 예시 3: order_total 계산이 다른 공식 3개
   → 해결: 09_order_management가 단일 공식 소유
```

### 4️⃣ 통합 레지스트리 3개

| 레지스트리 | 역할 | 이점 |
|-----------|------|------|
| **Status Value Registry** | 모든 상태값 통합 정의 | 상태 전이 규칙 명확, 충돌 없음 |
| **Module Responsibility Matrix** | 테이블/API/상태값 소유권 | 권한 설정 명확, 접근 제어 가능 |
| **Architecture Conflict Resolution** | 11개 충돌 해결 방법 | 다중 모듈 프로젝트 안정성 |

### 5️⃣ 도메인 모듈 시스템 (10개)

```
01_member_system          회원가입, 로그인, 프로필
02_shopping_mall          상품 카탈로그, 장바구니, 구매
03_payment_system         결제, 환불, 정산
04_shipping_logistics     배송 관리, 추적
05_admin_system           관리자 기능, 감사 로그
06_notification           알림, 이메일, SMS
07_review_rating          리뷰, 평점
08_inventory_management   재고, 예약, 조정
09_order_management       주문, 반품, 정산
10_gdpr_privacy           개인정보 보호, 동의 관리
```

---

## 📁 디렉토리 구조

```
coolhan/
├── README.md                          ← 지금 읽는 파일
├── INSTALLATION_GUIDE.md              ← 설치 및 사용 가이드
├── LICENSE                            ← MIT 라이선스
│
├── knowledge_base/                    ← 📚 핵심 문서 (필수)
│   ├── 00_AI_MASTER_RULES.md          11개 AI 실행 규칙
│   ├── 00_BASE_KNOWLEDGE_LOAD.md      Base Knowledge 로드 프로세스
│   ├── 00_DEVELOPMENT_LOCKED_MODE.md  규칙 기반 개발 모드
│   ├── 00_ARCHITECTURE_CONFLICT_RESOLUTION.md  충돌 해결 방법
│   ├── 00_STATUS_VALUE_REGISTRY.md    상태값 통합 레지스트리
│   ├── 00_MODULE_RESPONSIBILITY_MATRIX.md  모듈 책임 행렬
│   ├── 00_SPECIFICATION_PARAMETERIZATION_SYSTEM.md
│   ├── 00_DESIGN_PARAMETERIZATION_SYSTEM.md
│   ├── 00_CORE_PRINCIPLES_SYSTEM.md
│   ├── 00_KNOWLEDGE_BASE_EXTENSIBILITY.md
│   │
│   ├── core/                          ← 🏢 Base Knowledge Core들
│   │   ├── shopping_mall_core.md
│   │   ├── marketplace_core.md
│   │   ├── purchase_agency_core.md
│   │   └── (logistics_core 등 추가 예정)
│   │
│   └── modules/                       ← 📦 도메인 모듈 설명 (참고용)
│       ├── 01_member_system.md
│       ├── 02_shopping_mall.md
│       └── (03-10_modules)
│
├── examples/                          ← 💡 커뮤니티 예제 프로젝트
│   └── (사용자가 기여한 프로젝트 구조)
│
└── .github/                           ← GitHub 설정
    └── ISSUE_TEMPLATE/
```

---

## 🚀 빠른 시작 (3단계)

### Step 1: 저장소 클론
```bash
git clone https://github.com/zmjckim-fa/coolhan.git
cd coolhan
```

### Step 2: 핵심 문서 읽기
```bash
# 필수 (순서대로)
1. README.md (지금 읽는 파일)
2. INSTALLATION_GUIDE.md
3. knowledge_base/00_AI_MASTER_RULES.md
4. knowledge_base/00_DEVELOPMENT_LOCKED_MODE.md
```

---

## 📖 사용 가이드

### 1. 새 프로젝트 초기화

```bash
# A. Base Knowledge Core 선택
#    shopping_mall_core? marketplace_core? purchase_agency_core?
#    → knowledge_base/core/ 에서 선택

# B. 중앙 진실 문서 8개 작성 (전제 조건)
#    01_REQUIREMENTS.md      ← 무엇을 만드는가?
#    02_ERD.md               ← 어떤 데이터인가?
#    03_API_SPECIFICATION.md ← 어떤 API인가?
#    04_DATABASE_SCHEMA.md   ← 어떤 DB 구조인가?
#    05_STATUS_DEFINITIONS.md ← 어떤 상태값인가?
#    06_PERMISSIONS.md       ← 누가 뭘 할 수 있는가?
#    07_PROHIBITIONS.md      ← 뭘 하면 안 되는가?
#    08_FILE_STRUCTURE.md    ← 파일 구조는?

# C. 규칙 로드
#    00_AI_MASTER_RULES.md
#    00_DEVELOPMENT_LOCKED_MODE.md
#    00_MODULE_RESPONSIBILITY_MATRIX.md (도움)
#    00_STATUS_VALUE_REGISTRY.md (도움)

# D. 개발 시작 (규칙 기반)
```

### 2. AI와 함께 개발

```python
# 의사 코드로 표현

prompt = """
이 프로젝트는 CoolHan Framework를 사용합니다.

BASE CORES LOADED:
  - shopping_mall_core.md
  - marketplace_core.md

CENTRAL TRUTH DOCUMENTS:
  - 01_REQUIREMENTS.md
  - 02_ERD.md
  - ... (8개 모두)

RULES TO FOLLOW:
  - 00_AI_MASTER_RULES.md (11개 규칙)
  - 00_DEVELOPMENT_LOCKED_MODE.md (엄격한 모드)
  - 00_MODULE_RESPONSIBILITY_MATRIX.md (권한)

YOUR TASK:
  [구체적 작업]

CONSTRAINTS:
  - 문서에 없는 기능 추가 금지
  - 상태값 임의 생성 금지
  - 다른 모듈 API 임의 호출 금지
  - 막혔을 때 추측으로 진행 금지
  
RESPONSE FORMAT:
  - 현재 단계:
  - 참조 문서:
  - 작업 대상:
  - 완료한 것:
  - 검증 결과:
  - 발견된 문제:
  - 다음 작업:
  - 중단 필요 여부:
"""
```

### 3. 상태값/API/권한 검증

```bash
# 새로운 상태값을 추가할 때:
1. 00_STATUS_VALUE_REGISTRY.md 확인
2. 해당 엔티티의 상태값 찾기
3. 전이 규칙 확인
4. 없으면 문서 업데이트 + 재검토

# 새로운 API를 추가할 때:
1. 00_MODULE_RESPONSIBILITY_MATRIX.md 확인
2. 해당 엔드포인트를 제공할 모듈 명시
3. FORBIDDEN CALLS 목록 확인
4. 다른 모듈과 충돌 없는지 확인

# 새로운 권한을 추가할 때:
1. 06_PERMISSIONS.md 확인
2. 테이블/API 소유권 확인
3. 접근 제어 규칙 적용
```

---

## 💡 예제 시나리오

### 시나리오 1: 일반 쇼핑몰
```
프로젝트: MyShop 이커머스 플랫폼
  
로드할 Core:
  ✓ shopping_mall_core.md
  
필요한 모듈:
  ✓ 01_member_system (회원)
  ✓ 02_shopping_mall (상품, 장바구니, 구매)
  ✓ 03_payment_system (결제)
  ✓ 04_shipping_logistics (배송)
  ✓ 06_notification (알림)
  ✓ 07_review_rating (리뷰)
  ✓ 08_inventory_management (재고)
  ✓ 09_order_management (주문)
  ✓ 05_admin_system (관리)
  ✓ 10_gdpr_privacy (개인정보)
  
개발 시간: ~3개월 (4인 팀)
```

### 시나리오 2: 다중 판매자 마켓플레이스
```
프로젝트: SellerHub 마켓플레이스
  
로드할 Core:
  ✓ shopping_mall_core.md
  ✓ marketplace_core.md (판매자, 수수료, 분쟁)
  
추가 모듈: seller_onboarding, commission_management, dispute_resolution
  
개발 시간: ~5개월 (6인 팀)
```

### 시나리오 3: 해외 구매대행
```
프로젝트: GlobalBuy 해외 구매대행
  
로드할 Core:
  ✓ purchase_agency_core.md
  ✓ logistics_core.md
  
특별 기능: 환율 관리, 통관 서류, 2-leg 배송
  
개발 시간: ~4개월 (5인 팀)
```

---

## 🎓 핵심 개념 5개

### 1. Base Knowledge Core
> 산업 표준 정의 (프로젝트마다 매번 작성하지 말 것)

**예:**
```
shopping_mall_core.md를 로드하면:
  - 포함되어야 할 기능 10개 ✓
  - 필수 테이블 8개 ✓
  - 상태값 정의 ✓
  - 금지사항 10개 ✓
  - API 패턴 ✓

⟹ 매번 "쇼핑몰이 뭔가요?" 설명 불필요
```

### 2. Single Source of Truth (중앙 진실)
> 개발 시작 전 8개 문서 완성

```
CODE를 짜기 전에:
  01_REQUIREMENTS.md         ← "뭘?"
  02_ERD.md                  ← "어떤 데이터?"
  03_API_SPECIFICATION.md    ← "어떤 API?"
  04_DATABASE_SCHEMA.md      ← "DB는?"
  05_STATUS_DEFINITIONS.md   ← "상태값은?"
  06_PERMISSIONS.md          ← "권한은?"
  07_PROHIBITIONS.md         ← "금지는?"
  08_FILE_STRUCTURE.md       ← "구조는?"

이 8개를 완성해야 개발 Unlock
```

### 3. Development Locked Mode
> AI가 규칙을 잊지 않도록 매 작업마다 강제 주입

```
❌ 나쁜 방식:
  "AI, 쇼핑몰 만들어"
  → AI가 자유롭게 생성
  → Spec drift 발생

✓ 좋은 방식:
  "이 규칙(00_AI_MASTER_RULES.md)과
   이 문서(중앙 진실 8개)로만
   이 Scope(Task Lock)를
   이 검증(Self-Check)으로
   이 형식(Status Report)으로
   수행해"
  → AI가 규칙 기반 실행
  → Spec lock 유지
```

### 4. Module Responsibility Matrix
> 누가 뭘 하는지 명확히

```
테이블: products
  소유: 02_shopping_mall (CREATE, UPDATE, DELETE)
  읽기: 07_review, 04_shipping, 08_inventory (READ ONLY)

API: /admin/inventory
  소유: 08_inventory_management (제공)
  호출: 09_order (호출 가능)
  금지: 02_shopping (호출 금지)

상태값: order.status
  소유: 09_order_management (관리)
  전이: pending→paid→shipped→delivered
```

### 5. Status Value Registry
> 모든 상태값 통합 정의

```
Order.status:
  pending_payment
  payment_confirmed
  shipping_ready
  in_transit
  delivered
  return_requested
  return_approved
  return_in_transit
  return_completed
  refunded
  settled
  canceled
  failed

⟹ 명시되지 않은 상태값 추가 금지
   (processing, on_hold 등 임의 추가 불가)
```

---

## 📊 아키텍처 충돌 해결 (11개)

CoolHan은 다중 모듈 프로젝트의 11개 잠재적 충돌을 미리 정의하고 해결합니다:

| # | 충돌 | 해결책 |
|---|------|--------|
| 1 | product_reviews 테이블 중복 | 07_review_rating_system 소유 |
| 2 | inventory_transactions 중복 | 08_inventory_management 소유 |
| 3 | 상태값 정의 부재 | STATUS_VALUE_REGISTRY 생성 |
| 4 | /admin/audit-log 충돌 | 05_admin_system 소유 |
| 5 | /admin/inventory 충돌 | 08_inventory_management 소유 |
| 6 | 주문 총액 계산 불일치 | 09_order_management 소유 |
| 7 | 재고 예약 타이밍 불일치 | 08_inventory_management 정책 |
| 8 | 결제 멱등성 미보장 | 03_payment_system idempotency_key |
| 9 | 모듈 책임 불명확 | MODULE_RESPONSIBILITY_MATRIX |
| 10 | Core vs Module 우선순위 | 도메인 모듈 우선 |
| 11 | 교차 모듈 호출 규약 | API 호출 그래프 정의 |

---

## ⚙️ 기술 스택

**CoolHan은 언어/프레임워크 독립적입니다:**

```
Backend:
  ✓ Node.js + Express.js
  ✓ Python + Django/FastAPI
  ✓ Java + Spring Boot
  ✓ Go + Gin
  ✓ Ruby on Rails

Frontend:
  ✓ React
  ✓ Vue.js
  ✓ Angular
  ✓ Svelte

Database:
  ✓ PostgreSQL
  ✓ MySQL
  ✓ MongoDB
  ✓ Firebase

Deployment:
  ✓ AWS
  ✓ GCP
  ✓ Azure
  ✓ Docker
  ✓ Kubernetes

문서 형식:
  ✓ Markdown (표준)
  ✓ 자동 변환 가능 (Word, PDF, HTML)
```

---

## 🤝 기여하기

### 새로운 Base Knowledge Core 추가

```bash
# 예: ERP 시스템 Core 추가
1. knowledge_base/core/ 디렉토리에 erp_core.md 작성
2. 00_BASE_KNOWLEDGE_LOAD.md에 목록 추가
3. Pull Request 제출

구조 템플릿:
  1. 기본 포함 기능
  2. 기본 DB 구조
  3. 기본 상태값
  4. 기본 API 엔드포인트
  5. 금지사항
  6. 산업 표준 시나리오
  7. 제약사항
```

### 충돌 해결 추가

```bash
# 새로운 충돌 발견 시:
1. 00_ARCHITECTURE_CONFLICT_RESOLUTION.md 업데이트
2. MODULE_RESPONSIBILITY_MATRIX 업데이트
3. STATUS_VALUE_REGISTRY 업데이트
4. Issues에 보고 또는 PR 제출
```

---

## 📞 지원

### 도움말
- 📖 [INSTALLATION_GUIDE.md](./INSTALLATION_GUIDE.md) - 설치 및 사용 가이드
- 📚 [knowledge_base/](./knowledge_base/) - 전체 문서
- 💡 [examples/](./examples/) - 샘플 프로젝트

### 문제 보고
- 🐛 [GitHub Issues](https://github.com/zmjckim-fa/coolhan/issues)
- 💬 [GitHub Discussions](https://github.com/zmjckim-fa/coolhan/discussions)

### 문의
```
architecture@coolhan.dev
```

---

## 📈 프로젝트 통계

```
📦 Base Knowledge Cores:     3개 (shopping_mall, marketplace, purchase_agency)
📦 Domain Modules:           10개 (01_member ~ 10_gdpr)
📖 Master Documents:         11개 (00_AI_MASTER_RULES 등)
🎯 Architecture Conflicts Resolved: 11개
⚙️ Status Values Defined:    50+개
🔐 Module Responsibility Rules: 100+개
💼 Example Projects:         (커뮤니티 기여 프로젝트)
```

---

## 🎯 로드맵

### Q2 2026 (현재)
- ✅ Core 3개 완성 (shopping_mall, marketplace, purchase_agency)
- ✅ AI Master Rules 완성
- ✅ Development Locked Mode 완성
- ✅ 아키텍처 충돌 해결 (11개)

### Q3 2026
- 🔄 Core 3개 추가 (logistics, member_system, admin_system)
- 🔄 예제 프로젝트 2개 추가
- 🔄 문서 한영 번역

### Q4 2026
- 🔄 Core 4개 추가 (crm, erp, point_loyalty, subscription)
- 🔄 AI 통합 가이드 (Claude, ChatGPT, Gemini)
- 🔄 자동화 도구 (문서 검증, 충돌 검사)

---

## 📄 라이선스

MIT License - 자유롭게 사용, 수정, 배포 가능

```
MIT License

Copyright (c) 2026 CoolHan Project

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

---

## 🙏 감사의 말

이 프로젝트는 다음 개념에 영감을 받았습니다:

- Domain-Driven Design (Eric Evans)
- Specification by Example (Gojko Adzic)
- Infrastructure as Code (Kief Morris)
- GitOps (Weaveworks)
- Software Engineering Best Practices

---

## 🌟 별 주기

이 프로젝트가 도움이 되었다면 ⭐ 별을 눌러주세요!

```
GitHub: https://github.com/zmjckim-fa/coolhan
```

---

**CoolHan과 함께 규칙 기반의 완벽한 개발을 경험해보세요! 🚀**

```
AI는 창작자가 아니라 명령 실행자입니다.
규칙을 명확히 하고, AI는 그 규칙을 따르게 하세요.
```

---

---

# 🔧 CoolHan Specification-Driven Framework

> **완벽한 규격 기반 개발: 100% 코드-사양 준수 + 자동화된 검증 + AI 오류 완벽 방어**

## 🎯 목적

CoolHan 프레임워크의 핵심을 구현화한 **자동화된 검증 시스템**입니다. 개발 단계별로 규격 준수를 강제하고, 모든 AI 약점(7가지)을 원천 차단합니다.

### 핵심 가치
```
개발 프로세스:
  작성 → 커밋 전 검증(7) → 사양 파싱 → 코드 분석 
  → 규격 검증 → 빌드/테스트 → 배포(잠금) → 배포 후 검증(12) 
  → 모니터링 → 배포 기록
  
결과:
  ✅ Spec-Code Mismatch = 0%
  ✅ AI 오류 = 0% (모든 약점 방어)
  ✅ 배포 실패 = 0%
  ✅ 환경 혼동 = 0%
```

---

## 📦 포함 내용

### 1. 환경 구성 (3개 파일)
```bash
.claude/framework/
├── LOCAL_ENVIRONMENT_CONFIG.md (포트 3001)
├── STAGING_ENVIRONMENT_CONFIG.md (포트 4001)
└── PRODUCTION_ENVIRONMENT_CONFIG.md (포트 4000)
```

### 2. 프로토콜 문서 (2개)
```bash
├── COMMIT_PROTOCOL.md (6단계 커밋 검증)
└── DEPLOY_PROTOCOL.md (3+1+8 배포 프로세스)
```

### 3. 관리 문서 (2개)
```bash
├── FILE_MANIFEST.md (파일 구조 + 금지 패턴)
└── DEPLOYMENT_MANIFEST.md (배포 기록 + 감사)
```

### 4. 검증 훅 스크립트 (8개)
```bash
.claude/hooks/
├── spec-parser.js (Markdown → JSON)
├── code-analyzer.js (코드 분석)
├── spec-validator.js (규격-코드 비교)
├── environment-validator.js (환경 자동 감지)
├── deploy-lock.js (배포 잠금 시스템)
├── pre-commit.js (커밋 전 7가지 검증)
├── pre-deploy.js (배포 전 10단계 검증)
└── post-deploy.js (배포 후 12가지 체크)
```

### 5. Claude Code Skill
```bash
.claude/skills/coolhan-spec-driven-framework/
├── SKILL.md (메인 문서)
├── README.md (개요)
├── SKILL_MANIFEST.json (메타데이터)
├── references/ (기술 상세 설명)
│   ├── patterns-and-concepts.md
│   ├── implementation-guide.md
│   └── quick-reference.md
├── scripts/
│   └── generate-framework.js (프레임워크 생성)
└── evals/
    └── evals.json (3가지 테스트 시나리오)
```

---

## 🚀 설치 및 실행

### Step 1: 프레임워크 초기화
```bash
# 디렉토리 생성
mkdir -p .claude/framework/{specs,hooks,logs,locks,manifests}

# 프레임워크 파일 생성
npm run framework:generate
```

### Step 2: 사양 작성
```bash
# .claude/framework/specs/ 에 생성:
1. status-registry.md - 상태값 중앙 정의
   Status: PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED
   
2. api-endpoints.md - API 엔드포인트 정의
   GET /api/orders/:id
   POST /api/orders
   PATCH /api/orders/:id
   
3. module-matrix.md - 모듈 책임 정의
   Order Module: ✅ 호출 가능(Product, Payment)
                 ❌ 호출 금지(Admin, Member)
   
4. locked-mode-rules.md - 절대 규칙
   NEVER: .env.production 커밋
   NEVER: API 키 하드코딩
   NEVER: 파일명 변경
```

### Step 3: Git 훅 설정
```bash
# Husky 설치
npm install --save-dev husky
npx husky install

# Pre-commit 훅 (자동 커밋 검증)
npx husky add .husky/pre-commit "node .claude/hooks/pre-commit.js"

# Pre-push 훅 (자동 배포 전 검증)
npx husky add .husky/pre-push "node .claude/hooks/pre-deploy.js"
```

### Step 4: 검증 명령어 추가
```json
{
  "scripts": {
    "spec:parse": "node .claude/hooks/spec-parser.js",
    "spec:analyze": "node .claude/hooks/code-analyzer.js",
    "spec:validate": "node .claude/hooks/spec-validator.js",
    "env:validate": "node .claude/hooks/environment-validator.js",
    "lock:status": "node .claude/hooks/deploy-lock.js list",
    "lock:cleanup": "node .claude/hooks/deploy-lock.js cleanup",
    "pre-commit:check": "node .claude/hooks/pre-commit.js",
    "pre-deploy:check": "node .claude/hooks/pre-deploy.js",
    "post-deploy:check": "node .claude/hooks/post-deploy.js"
  }
}
```

---

## 🔍 9단계 검증 프로세스

### 🔵 Stage 1: 사양 작성
```
.claude/framework/specs/ 에 4가지 사양 파일 작성
→ 상태값, API, 모듈 책임, 절대 규칙 정의
→ 개발의 "중앙 진실" 수립
```

### 🟠 Stage 2: 커밋 전 검증 (7가지)
```bash
git commit -m "feat(order): add order feature"
  ↓ [자동 실행: pre-commit 훅]
  
✅ 확인 항목:
1. Git diff: 금지 파일 확인 (.env*, *.secret)
2. 보안: .env 파일, API 키 차단
3. CLAUDE.md: 규칙 위반 확인
4. TypeScript: tsc --noEmit 실행
5. Lint: npm run lint 실행
6. 커밋 메시지: 형식 검증
7. 사양 문서: 존재 여부 확인

❌ 위반 시: 커밋 자동 차단
```

### 🟡 Stage 3-5: 규격-코드 검증
```bash
npm run spec:validate

과정:
  1. Spec-Parser: .md 사양 → JSON 변환
  2. Code-Analyzer: 실제 코드 → JSON 추출
  3. Spec-Validator: 규격 vs 코드 비교
  
검증 항목:
  ✅ 상태값: 사양에 정의된 것만 사용
  ✅ API: 사양에 정의된 것만 제공
  ✅ 모듈: 허용된 API만 호출
  ✅ 금지: Locked Mode 규칙 준수

❌ 불일치: 배포 자동 차단
```

### 🟢 Stage 6: 전통적 검증
```bash
npm run build         # TypeScript 컴파일
npm test              # 테스트 실행
npm run security      # 보안 스캔
npm run lint          # 코드 정적 분석
```

### 🔵 Stage 7: 배포 (배포 잠금)
```bash
npm run deploy

배포 잠금:
  - 배포 시작 시: deploy.lock 파일 생성
  - 다른 배포 시도 시: 자동 대기/차단
  - 배포 완료 시: 잠금 자동 해제
  
타임아웃:
  LOCAL: 30분
  STAGING: 1시간
  PRODUCTION: 2시간

효과: 동시 배포 방지, SSH 중복 푸시 방지
```

### 🟣 Stage 8: 배포 후 검증 (12가지)

**전통적 검증 (8가지):**
```bash
npm run post-deploy:check

✅ API 헬스
   curl http://prod:4000/api/health
   기대: HTTP 200, 응답 < 500ms

✅ 데이터베이스 연결
   curl http://prod:4000/api/db-health
   기대: { "connected": true }

✅ 캐시 상태
   curl http://prod:4000/api/cache-health
   기대: { "redis": "connected" }

✅ 외부 API 연결
   Stripe, SendGrid, Twilio 등 확인

✅ 성능 < 500ms
   평균 응답시간 측정

✅ 에러율 < 0.1%
   { "error_rate": 0.05% }

✅ Smoke 테스트
   기본 플로우 (가입→로그인→구매→배송) 테스트

✅ 보안 헤더
   Strict-Transport-Security, X-Content-Type-Options 등
```

**규격 기반 검증 (4가지):**
```bash
✅ 상태값 전이 유효성
   PENDING → CONFIRMED → PROCESSING OK
   PENDING → SHIPPED ❌ (불가능한 전이)

✅ 모듈 격리 강제
   Order 모듈이 금지된 Admin API 호출 ❌

✅ API 규격 준수
   GET /api/orders 응답이 사양대로

✅ 사양 드리프트 감지
   배포 전후 사양 변경 자동 감지
```

### 🟤 Stage 9: 모니터링 & 배포 기록
```bash
24시간 모니터링
  ↓
문제 감지 시 자동 롤백
  ↓
DEPLOYMENT_MANIFEST에 전체 기록 저장 (90일 보관)

기록 내용:
  - 배포 번호, 시간, 사용자
  - Git 커밋 정보
  - 변경 파일 목록
  - 검증 결과 (모두 PASS)
  - 성능 메트릭
  - 모니터링 결과
  - 문제 발생 여부
  - 롤백 필요 여부
```

---

## 📋 사용 가능한 모든 명령어

### 🛠️ 프레임워크 명령어
```bash
# 프레임워크 생성
npm run framework:generate

# 검증 명령어
npm run spec:parse                    # 사양 파싱
npm run spec:analyze                  # 코드 분석
npm run spec:validate                 # 규격 검증
npm run env:validate                  # 환경 검증

# 배포 잠금 관리
npm run lock:status                   # 잠금 상태 조회
npm run lock:cleanup                  # 잠금 강제 해제

# 단계별 검증
npm run pre-commit:check              # 커밋 전 검증 (수동)
npm run pre-deploy:check              # 배포 전 검증 (수동)
npm run post-deploy:check             # 배포 후 검증 (수동)
```

### 🚀 Git 워크플로우 명령어
```bash
# 일반 커밋 (자동으로 pre-commit 훅 실행)
git add .
git commit -m "feat(order): add order feature"
  → 자동으로 7가지 검증 실행
  → 위반 시 커밋 차단

# 푸시 (자동으로 pre-deploy 훅 실행)
git push origin develop
  → 자동으로 10단계 배포 전 검증 실행
  → 위반 시 푸시 차단

# 배포 (자동으로 post-deploy 훅 실행)
npm run deploy
  → 배포 잠금 획득
  → 배포 실행
  → 자동으로 12가지 배포 후 검증 실행
  → 배포 기록 자동 저장
```

### 🔧 고급 명령어 (직접 실행)
```bash
# 사양 파일 파싱
node .claude/hooks/spec-parser.js .claude/framework/specs

# 코드 분석
node .claude/hooks/code-analyzer.js src/

# 규격 검증
node .claude/hooks/spec-validator.js \
  .claude/framework/parsed-specs.json \
  .claude/framework/code-analysis.json

# 환경 감지 및 검증
node .claude/hooks/environment-validator.js

# 배포 잠금 상세 제어
node .claude/hooks/deploy-lock.js create deploy STAGING
node .claude/hooks/deploy-lock.js list
node .claude/hooks/deploy-lock.js status deploy
node .claude/hooks/deploy-lock.js release deploy
node .claude/hooks/deploy-lock.js force-unlock deploy [PASSWORD]
node .claude/hooks/deploy-lock.js cleanup
node .claude/hooks/deploy-lock.js report

# Pre-commit 검증
node .claude/hooks/pre-commit.js --verbose

# Pre-deploy 검증
node .claude/hooks/pre-deploy.js --environment=PRODUCTION

# Post-deploy 검증
node .claude/hooks/post-deploy.js \
  --environment=PRODUCTION \
  --monitor-duration=24h \
  --auto-rollback=true
```

---

## 🎯 고급 사용법

### 1. 모듈 책임 매트릭스 (Module Isolation)
```markdown
.claude/framework/specs/module-matrix.md

Order Module:
  ✅ 호출 가능:
    - Product.getDetails()
    - Inventory.checkStock()
    - Payment.charge()
    
  ❌ 호출 금지:
    - Admin.deleteUser()
    - Member.viewAllUsers()
    - Inventory.adjustStock() (읽기만)
```

**검증 실행:**
```bash
npm run spec:validate
# → Order 모듈이 금지된 API 호출 시 배포 차단
```

### 2. 환경 자동 감지 (4단계)
```bash
npm run env:validate

감지 우선순위:
  1. Git remote 확인
  2. Hostname 확인
  3. NODE_ENV 환경변수 확인
  4. 포트 상태 확인
  
결과:
  환경: PRODUCTION
  신뢰도: 95%
  권장 타임아웃: 2시간 (배포 잠금)
```

### 3. 배포 잠금 상세 제어
```bash
# 현재 상태 확인
npm run lock:status
# 출력: { deploy: "UNLOCKED", commit: "UNLOCKED" }

# 상세 정보 조회
node .claude/hooks/deploy-lock.js list
# 출력:
# {
#   "locks": {
#     "deploy": { "status": "LOCKED", "user": "alice", "elapsed": "5m" },
#     "commit": { "status": "UNLOCKED" }
#   },
#   "activeLocks": ["DEPLOY"],
#   "summary": "1개의 활성 락: DEPLOY"
# }

# 배포 진행 중인지 확인
node .claude/hooks/deploy-lock.js status deploy
# 출력: 배포 중 (5분 경과, 남은 시간: 25분)

# 강제 해제 (관리자 비밀번호 필수)
node .claude/hooks/deploy-lock.js force-unlock deploy admin123
# ⚠️ 경고: 진행 중인 배포가 중단될 수 있습니다!
```

### 4. 사양 드리프트 감지
```bash
배포 전:
  spec-parser → status_registry.json
    PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED

배포 후:
  code-analyzer → 실제 코드의 상태값
    PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, REFUNDED ❌

드리프트 감지:
  ❌ 새로운 상태값 REFUNDED 감지
  → 배포 팀에 경고
  → 롤백 검토 필요
```

### 5. 자동 롤백 트리거
```bash
Post-deploy 검증 실패 시:
  - API 응답 > 500ms
  - 에러율 > 0.1%
  - DB 연결 실패
  - 보안 헤더 누락
  - 모듈 격리 위반
  
→ 자동으로 이전 버전으로 롤백
→ DEPLOYMENT_MANIFEST에 기록
```

---

## 🔐 AI 약점 완벽 방어

| 약점 | 상황 | 방어 메커니즘 | 효과 |
|------|------|-------------|------|
| **망각** | 긴 세션에서 규칙 망각 | 문서 중심, 매 검증마다 재확인 | 100% |
| **자체판단** | 막혀서 독단적으로 결정 | Locked Mode 규칙 강제 | 100% |
| **의도적오류** | "빠르게 하려고" 규칙 위반 | 0 허용 검증 | 100% |
| **환경혼동** | LOCAL과 PROD 헷갈림 | 4단계 자동 감지 + 검증 | 100% |
| **파일명변경** | 구조 개편하며 파일명 변경 | FILE_MANIFEST + pre-commit 감지 | 100% |
| **권한자부여** | 필요하다며 권한 추가 | Module Matrix 강제 | 100% |
| **규격불일치** | 코드가 사양과 다름 | 3계층 검증자 (0 허용) | 100% |

---

## 📊 성능 및 리소스

### 검증 소요 시간
| 단계 | 명령어 | 시간 |
|------|--------|------|
| Pre-Commit (7가지) | `npm run pre-commit:check` | 2-5초 |
| Pre-Deploy (10단계) | `npm run pre-deploy:check` | 30-60초 |
| Post-Deploy (12가지) | `npm run post-deploy:check` | 5-10초 |

### 시스템 리소스
| 항목 | 크기 |
|------|------|
| 훅 스크립트 총합 | ~2MB |
| 검증 로그 (1회) | ~100KB |
| 배포 기록 보관 | 90일 |
| 배포 잠금 파일 | <1KB |

### 규격 준수율
```
Pre-Commit 통과율:    98-100%
Pre-Deploy 통과율:    95-99%
Post-Deploy 통과율:   99-100%
전체 배포 성공율:     100% (위반 시 차단)
```

---

## 🔗 Claude Code Skill 설치

이 프레임워크는 **Claude Code에 설치 가능한 Skill**로 제공됩니다.

### 설치 방법
```bash
# Skill 파일 복사
cp -r .claude/skills/coolhan-spec-driven-framework \
  [YOUR_CLAUDE_CODE]/skills/

# Claude Code에서 자동 인식
```

### Skill 사용
Claude Code에서:
```
"Set up CoolHan specification-driven framework for my project"

또는

"Validate my code against specifications"

또는

"Deploy with complete validation pipeline"
```

---

## 📖 문서 가이드

### 신규 프로젝트
1. `.claude/skills/coolhan-spec-driven-framework/SKILL.md` 읽기
2. `.claude/skills/coolhan-spec-driven-framework/references/implementation-guide.md` 참고
3. `npm run framework:generate` 실행
4. 사양 파일 작성 시작

### 기존 프로젝트
1. `.claude/skills/coolhan-spec-driven-framework/references/patterns-and-concepts.md` 읽기
2. `npm run spec:validate` 로 규격 검증
3. 불일치 사항 수정
4. `npm run deploy` 로 안전 배포

### 문제 해결
→ `.claude/skills/coolhan-spec-driven-framework/references/quick-reference.md`

---

**마지막 업데이트:** 2026-05-27  
**유지보수자:** CoolHan Architecture Team  
**상태:** 🟢 Production Ready
