# CoolHan Builder - 설치 및 사용 가이드

**버전:** 1.0.0  
**언어:** Korean (한국어)  
**마지막 업데이트:** 2026-05-27  

---

## 📋 목차

1. [개요](#개요)
2. [시스템 요구사항](#시스템-요구사항)
3. [설치 방법](#설치-방법)
4. [프로젝트 시작](#프로젝트-시작)
5. [문서 구조](#문서-구조)
6. [사용 방법](#사용-방법)
7. [문제 해결](#문제-해결)
8. [지원 및 피드백](#지원-및-피드백)

---

## 개요

**CoolHan Builder**는 AI 기반 엔지니어링 프로젝트 관리 시스템입니다.

### 핵심 특징

- ✅ **Base Knowledge Core 시스템**: 10개 산업 표준 정의 (shopping_mall, marketplace, purchase_agency, logistics 등)
- ✅ **도메인 모듈 시스템**: 10개 재사용 가능한 기능 모듈 (member, shopping, payment, shipping, etc.)
- ✅ **AI Development Locked Mode**: 규격 기반 AI 실행 (창작이 아닌 명령어 기반)
- ✅ **아키텍처 충돌 해결**: 모듈 간 데이터, API, 상태값 충돌 완전 해결
- ✅ **마스터 레퍼런스**: 상태값 레지스트리, 모듈 책임 행렬, 규칙 엔진

### 적용 시나리오

1. **E-Commerce 플랫폼**: shopping_mall_core + marketplace_core 결합
2. **해외 구매대행**: purchase_agency_core + logistics_core
3. **마켓플레이스**: marketplace_core + seller_onboarding
4. **배송 최적화**: logistics_core 단독
5. **회원 관리**: member_system_core 단독

---

## 시스템 요구사항

### 최소 요구사항

- **OS**: Windows 10+, macOS 10.15+, Ubuntu 18.04+
- **Git**: 2.25 이상
- **텍스트 에디터**: VS Code, Sublime Text 등 (추천: VS Code)
- **Markdown 뷰어**: Typora, Obsidian 등 (선택사항)

### 개발 환경 (프로젝트 구현 시)

- **Node.js**: 16.x 이상 (JavaScript/TypeScript 프로젝트)
- **Python**: 3.8+ (Python 프로젝트)
- **Docker**: 선택사항 (배포 시)

### 브라우저 (문서 보기)

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

---

## 설치 방법

### 1단계: GitHub에서 클론

```bash
# 저장소 클론
git clone https://github.com/zmjckim-fa/coolhan.git
cd coolhan

# 또는 HTTPS 대신 SSH 사용
git clone git@github.com:zmjckim-fa/coolhan.git
cd coolhan
```

### 2단계: 디렉토리 구조 확인

설치 후 다음과 같은 구조가 있는지 확인하세요:

```
coolhan/
├── README.md                          # 프로젝트 개요
├── INSTALLATION_GUIDE.md              # 이 파일
├── knowledge_base/
│   ├── 00_AI_MASTER_RULES.md          # AI 실행 규칙
│   ├── 00_BASE_KNOWLEDGE_LOAD.md      # 기본 지식 로드 프로세스
│   ├── 00_DEVELOPMENT_LOCKED_MODE.md  # 개발 모드 규칙
│   ├── 00_ARCHITECTURE_CONFLICT_RESOLUTION.md
│   ├── 00_STATUS_VALUE_REGISTRY.md
│   ├── 00_MODULE_RESPONSIBILITY_MATRIX.md
│   ├── 00_SPECIFICATION_PARAMETERIZATION_SYSTEM.md
│   ├── 00_DESIGN_PARAMETERIZATION_SYSTEM.md
│   ├── 00_CORE_PRINCIPLES_SYSTEM.md
│   ├── 00_KNOWLEDGE_BASE_EXTENSIBILITY.md
│   │
│   ├── core/                          # Base Knowledge Core들
│   │   ├── shopping_mall_core.md
│   │   ├── marketplace_core.md
│   │   ├── purchase_agency_core.md
│   │   └── (logistics_core, member_system_core 등)
│   │
│   └── modules/                       # 도메인 모듈 설명 (선택사항)
│       ├── 01_member_system.md
│       ├── 02_shopping_mall.md
│       └── (03-10 modules)
│
└── examples/                          # 예제 프로젝트 (커뮤니티 제공)
    └── (사용자 프로젝트 추가 예정)
```

### 3단계: (선택) VS Code 확장 설치

문서를 더 쉽게 보기 위해 다음 확장 설치를 권장합니다:

```bash
# Markdown Preview Enhanced
code --install-extension shd101wyy.markdown-preview-enhanced

# Markdown All in One
code --install-extension yzhang.markdown-all-in-one

# Git Graph
code --install-extension mhutchie.git-graph
```

VS Code에서 설치:
1. VS Code 열기
2. Extensions (Ctrl+Shift+X)
3. 위 확장명 검색하여 설치

### 4단계: 로컬 문서 서버 실행 (선택)

더 나은 문서 보기 경험을 위해 로컬 HTTP 서버를 실행할 수 있습니다:

```bash
# Python 3 사용
python -m http.server 8000

# 또는 Python 2
python -m SimpleHTTPServer 8000

# 또는 Node.js http-server 설치 후
npm install -g http-server
http-server -p 8000
```

그 다음 브라우저에서 `http://localhost:8000` 열기

---

## 프로젝트 시작

### 새 프로젝트 시작 체크리스트

새로운 프로젝트를 시작할 때는 다음 순서를 따르세요:

```
┌─────────────────────────────────────────────┐
│  1단계: Base Knowledge Core 선택            │
│  어떤 시스템 타입? (shopping_mall 등)      │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  2단계: 기술 매개변수 정의                  │
│  - 언어/프레임워크                          │
│  - 데이터베이스                             │
│  - 배포 환경                                │
│  - 런타임 설정                              │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  3단계: 중앙 진실 문서 작성                │
│  - 요구사항 명세서                          │
│  - ERD (Entity Relationship Diagram)        │
│  - API 명세서                               │
│  - 상태값 정의                              │
│  - 금지사항 목록                            │
│  - 권한 설정                                │
│  - 파일 구조                                │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  4단계: 규칙 로드                           │
│  - 00_AI_MASTER_RULES.md                    │
│  - 00_DEVELOPMENT_LOCKED_MODE.md            │
│  - 모듈 책임 행렬                           │
│  - 상태값 레지스트리                        │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  5단계: 개발 시작                           │
│  (규칙 기반 실행 모드)                      │
└─────────────────────────────────────────────┘
```

---

## 문서 구조

### 핵심 문서 (필수)

| 파일 | 용도 | 언제 읽나 |
|------|------|---------|
| `00_AI_MASTER_RULES.md` | AI 실행 규칙 11개 | 개발 시작 전 |
| `00_BASE_KNOWLEDGE_LOAD.md` | 기본 지식 로드 프로세스 | 프로젝트 초기화 시 |
| `00_DEVELOPMENT_LOCKED_MODE.md` | 규칙 기반 개발 모드 | 매 작업 시작 전 |
| `00_ARCHITECTURE_CONFLICT_RESOLUTION.md` | 모듈 간 충돌 해결 | 다중 모듈 프로젝트 시 |
| `00_STATUS_VALUE_REGISTRY.md` | 상태값 통합 정의 | API/DB 설계 시 |
| `00_MODULE_RESPONSIBILITY_MATRIX.md` | 모듈 책임 행렬 | 권한 설정 시 |

### Base Knowledge Core (선택)

각 프로젝트 타입별로 필요한 Core만 로드:

| Core | 사용 시나리오 |
|------|-------------|
| `shopping_mall_core.md` | B2C 전자상거래 |
| `marketplace_core.md` | 다중 판매자 마켓플레이스 |
| `purchase_agency_core.md` | 해외 구매대행 |
| `logistics_core.md` | 배송 관리 (대용량) |
| `member_system_core.md` | 회원 시스템 |
| `admin_system_core.md` | 관리자 기능 |

### 도메인 모듈 설명 (참고)

10개 모듈의 기능 설명:
- 01_member_system: 회원 가입/로그인/프로필
- 02_shopping_mall: 상품 카탈로그, 장바구니, 구매
- ... (03-10)

---

## 사용 방법

### 사용 패턴 1: 문서 읽기 (브라우저)

```bash
# 1. 이 저장소를 클론
git clone https://github.com/zmjckim-fa/coolhan.git
cd coolhan

# 2. knowledge_base 디렉토리 열기
cd knowledge_base

# 3. 마크다운 파일들 확인
ls -la *.md           # 핵심 문서
ls -la core/          # Base Knowledge Core
```

### 사용 패턴 2: 새 프로젝트 초기화

```bash
# 1. 프로젝트 디렉토리 생성
mkdir my_ecommerce_project
cd my_ecommerce_project

# 2. 필수 문서 복사
cp -r ../coolhan/knowledge_base .

# 3. 중앙 진실 문서 작성 시작
# knowledge_base 폴더에서:
#   - 01_PROJECT_OVERVIEW.md 작성
#   - 02_REQUIREMENTS.md 작성
#   - 03_ERD.md 작성
#   - 04_API_SPECIFICATION.md 작성
#   - 05_DATABASE_SCHEMA.md 작성
#   - 06_STATUS_DEFINITIONS.md 작성
#   - 07_PERMISSIONS.md 작성
#   - 08_PROHIBITIONS.md 작성

# 4. 프로젝트 상태 파일 생성
cat > 00_PROJECT_STATE.md << 'EOF'
# Project: My E-Commerce Platform
Created: 2026-05-27
Base Cores Loaded: shopping_mall_core, marketplace_core
Locked: [Spec Lock Documents Ready]
Phase: Planning Complete, Development Ready
EOF
```

### 사용 패턴 3: AI와 함께 개발

**전제:** CoolHan Framework를 Claude AI 또는 다른 AI 도구와 함께 사용

```bash
# 1. AI 도구에 knowledge_base 전체 로드
# (VS Code, Claude Code, GitHub Copilot 등의 RAG 시스템)

# 2. 프로젝트 초기화 메시지
"""
이 프로젝트는 CoolHan Framework를 사용합니다.

필수 규칙:
- 00_AI_MASTER_RULES.md 준용
- 00_DEVELOPMENT_LOCKED_MODE.md 준용
- 00_MODULE_RESPONSIBILITY_MATRIX.md 준용

이 문서들을 먼저 로드해주세요.
"""

# 3. 중앙 진실 문서 제시
# AI에게 위의 8개 문서를 제공

# 4. 개발 진행
# AI는 문서 기반으로만 실행 (추론/창작 아님)
```

---

## 자주 묻는 질문 (FAQ)

### Q1: 어떤 Base Knowledge Core부터 시작해야 하나요?

**A:** 프로젝트 타입에 따라:
- 일반 온라인 쇼핑몰 → `shopping_mall_core.md`
- 다중 판매자 플랫폼 → `marketplace_core.md`
- 해외 구매대행 → `purchase_agency_core.md`
- 배송 최적화 → `logistics_core.md`

### Q2: 도메인 모듈(01-10)과 Base Knowledge Core는 어떤 관계인가요?

**A:** 
- **Base Knowledge Core**: 산업 표준 정의 (추상)
- **도메인 모듈 (01-10)**: 구체적 기능 구현 (실제 코드)
- **관계**: Core는 모듈의 최소 요구사항을 정의하고, 모듈이 Core를 구현/확장

### Q3: 기존 프로젝트에 CoolHan을 적용할 수 있나요?

**A:** 가능합니다. 다음 순서로:
1. 현재 프로젝트의 중앙 진실 문서 8개 작성
2. 00_MODULE_RESPONSIBILITY_MATRIX와 비교하여 충돌 확인
3. 충돌 해결 (00_ARCHITECTURE_CONFLICT_RESOLUTION.md 참조)
4. 상태값 레지스트리 업데이트
5. 규칙 적용 시작

### Q4: 한국어가 아닌 다른 언어로 사용할 수 있나요?

**A:** 네, 가능합니다:
1. knowledge_base를 다른 언어로 번역
2. 프로젝트별 문서는 프로젝트 언어로 작성
3. 핵심 규칙은 동일 (언어 독립적)

### Q5: 아키텍처 충돌이 발견되면 어떻게 하나요?

**A:** 00_ARCHITECTURE_CONFLICT_RESOLUTION.md에 정의된 11개 충돌 해결 방법을 참조하고:
1. 해당 충돌 번호 찾기
2. 해결책의 "Single Source of Truth" 확인
3. 소유 모듈 명시
4. 프로젝트의 00_MODULE_RESPONSIBILITY_MATRIX 업데이트

---

## 문제 해결

### 문제 1: 마크다운 파일이 보이지 않음

**해결책:**
```bash
# 1. 디렉토리 확인
ls -la knowledge_base/

# 2. 파일 인코딩 확인 (UTF-8이어야 함)
file knowledge_base/00_AI_MASTER_RULES.md

# 3. VS Code에서 열기
code knowledge_base/
```

### 문제 2: Git 클론 실패

**해결책:**
```bash
# SSH 대신 HTTPS 사용
git clone https://github.com/zmjckim-fa/coolhan.git

# 또는 깊이 제한으로 빠르게 클론
git clone --depth 1 https://github.com/zmjckim-fa/coolhan.git
```

### 문제 3: 권한 오류

**해결책:**
```bash
# 읽기 권한 추가
chmod +r knowledge_base/*.md
chmod +r knowledge_base/core/*.md
```

### 문제 4: 로컬 서버가 포트 충돌

**해결책:**
```bash
# 다른 포트 사용
python -m http.server 8888  # 8000 대신 8888

# 또는 사용 중인 포트 확인
lsof -i :8000
kill -9 <PID>
```

---

## 지원 및 피드백

### 피드백 제출

개선 사항이나 버그 보고:
```bash
# GitHub Issues에서
https://github.com/zmjckim-fa/coolhan/issues

# 또는 이메일
architecture@coolhan.dev
```

### 커뮤니티

- **GitHub Discussions**: 질문 및 토론
- **Wiki**: 추가 예제 및 가이드
- **Issues**: 버그 보고 및 기능 요청

### 업데이트 확인

```bash
# 최신 버전 받기
git pull origin main

# 변경사항 확인
git log --oneline -10
```

---

## 라이선스 및 이용약관

**CoolHan Framework**는 MIT 라이선스 하에 배포됩니다.

자유롭게 사용, 수정, 배포할 수 있습니다.
자세한 사항은 LICENSE 파일을 참조하세요.

---

## 다음 단계

1. ✅ 이 가이드 읽기 (완료)
2. 📖 `README.md` 읽기 (프로젝트 개요)
3. 📚 `00_AI_MASTER_RULES.md` 읽기 (핵심 규칙)
4. 🔍 Base Knowledge Core 선택 (프로젝트 타입)
5. 🚀 새 프로젝트 시작!

---

**CoolHan Builder로 시작하세요! 🚀**

설치, 문서 읽기, 첫 프로젝트 초기화까지 약 30분이 소요됩니다.

더 자세한 정보는 `README.md`를 참조하세요.
