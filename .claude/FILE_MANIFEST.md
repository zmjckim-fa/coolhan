# FILE MANIFEST

**목적:** 모든 파일의 이름, 경로, 용도를 고정하여 혼동 방지  
**변경 금지:** 절대 금지  
**검증:** 매 커밋/배포 시 자동 검증

---

## 1. LOCAL 환경 파일 구조

```
C:\sites\CoolHan builder\
│
├── 📁 .claude/                                    (프레임워크 디렉토리)
│   ├── 📄 00_AI_MASTER_RULES.md                  (AI 절대 규칙)
│   ├── 📄 00_CORE_PRINCIPLES_SYSTEM.md           (핵심 원칙)
│   ├── 📄 00_STATUS_VALUE_REGISTRY.md            (상태값 레지스트리)
│   ├── 📄 00_MODULE_RESPONSIBILITY_MATRIX.md     (모듈 책임 매트릭스)
│   ├── 📄 00_DEVELOPMENT_LOCKED_MODE.md          (개발 잠금 모드)
│   ├── 📄 COMMIT_PROTOCOL.md                     (커밋 프로토콜)
│   ├── 📄 DEPLOY_PROTOCOL.md                     (배포 프로토콜)
│   ├── 📄 LOCAL_ENVIRONMENT_CONFIG.md            (로컬 환경 설정)
│   ├── 📄 STAGING_ENVIRONMENT_CONFIG.md          (스테이징 환경 설정)
│   ├── 📄 PRODUCTION_ENVIRONMENT_CONFIG.md       (프로덕션 환경 설정)
│   ├── 📄 FILE_MANIFEST.md                       (이 파일)
│   ├── 📄 DEPLOYMENT_MANIFEST.md                 (배포 기록)
│   │
│   ├── 📁 hooks/                                 (검증 훅)
│   │   ├── 📄 spec-parser.js                     (사양 파싱)
│   │   ├── 📄 code-analyzer.js                   (코드 분석)
│   │   ├── 📄 spec-validator.js                  (사양 검증)
│   │   ├── 📄 pre-commit.js                      (커밋 전 검증)
│   │   ├── 📄 pre-deploy.js                      (배포 전 검증)
│   │   ├── 📄 post-deploy.js                     (배포 후 검증)
│   │   ├── 📄 environment-validator.js           (환경 검증)
│   │   └── 📄 deploy-lock.js                     (배포 락 관리)
│   │
│   ├── 📁 parsed/                                (생성됨, 수정 금지)
│   │   ├── 📄 status_registry.json               (파싱된 상태값)
│   │   ├── 📄 module_matrix.json                 (파싱된 모듈 매트릭스)
│   │   ├── 📄 api_endpoints.json                 (파싱된 API)
│   │   ├── 📄 database_tables.json               (파싱된 DB 스키마)
│   │   └── 📄 locked_mode_rules.json             (파싱된 잠금 규칙)
│   │
│   ├── 📁 analysis/                              (생성됨, 수정 금지)
│   │   ├── 📄 api_analysis.json                  (코드 API 분석)
│   │   ├── 📄 database_analysis.json             (코드 DB 분석)
│   │   ├── 📄 status_analysis.json               (코드 상태값 분석)
│   │   ├── 📄 module_calls_analysis.json         (모듈 호출 분석)
│   │   ├── 📄 credentials_analysis.json          (자격증명 감지)
│   │   └── 📄 validation_report.json             (종합 검증 보고서)
│   │
│   ├── 📁 locks/                                 (런타임 생성)
│   │   ├── 📄 deploy.lock                        (배포 진행 중)
│   │   ├── 📄 commit.lock                        (커밋 진행 중)
│   │   └── 📄 lock-status-report.json            (락 상태 보고)
│   │
│   └── 📁 settings.json                          (훅 설정 파일)
│
├── 📁 apps/
│   ├── 📁 api/                                   (Node.js API)
│   │   ├── 📁 src/
│   │   │   ├── 📁 routes/
│   │   │   ├── 📁 models/
│   │   │   ├── 📁 controllers/
│   │   │   ├── 📁 services/
│   │   │   ├── 📁 middleware/
│   │   │   ├── 📁 utils/
│   │   │   ├── 📁 types/
│   │   │   └── 📄 index.ts
│   │   ├── 📁 prisma/
│   │   │   ├── 📄 schema.prisma                  (DB 스키마)
│   │   │   ├── 📁 migrations/                    (마이그레이션 기록)
│   │   │   └── 📄 seed.ts                        (테스트 데이터)
│   │   ├── 📄 package.json
│   │   ├── 📄 package-lock.json
│   │   ├── 📄 tsconfig.json
│   │   ├── 📄 .env.local                         (로컬 설정, 커밋 금지)
│   │   ├── 📄 .env.staging                       (자동 생성)
│   │   ├── 📄 .env.production                    (자동 생성)
│   │   └── 📁 dist/                              (빌드 산출물, 커밋 금지)
│   │
│   └── 📁 web/                                   (React)
│       ├── 📁 public/
│       │   ├── 📄 index.html
│       │   └── 📄 favicon.ico
│       ├── 📁 src/
│       │   ├── 📁 components/
│       │   ├── 📁 pages/
│       │   ├── 📁 hooks/
│       │   ├── 📁 services/
│       │   ├── 📁 utils/
│       │   ├── 📁 styles/
│       │   ├── 📁 types/
│       │   └── 📄 App.tsx
│       ├── 📄 package.json
│       ├── 📄 package-lock.json
│       ├── 📄 tsconfig.json
│       ├── 📄 .env.local                         (로컬 설정, 커밋 금지)
│       ├── 📄 .env.staging                       (자동 생성)
│       ├── 📄 .env.production                    (자동 생성)
│       └── 📁 dist/                              (빌드 산출물, 커밋 금지)
│
├── 📁 knowledge_base/                             (사양 문서)
│   ├── 📄 00_SPECIFICATION_PARAMETERIZATION_SYSTEM.md
│   ├── 📄 00_DESIGN_PARAMETERIZATION_SYSTEM.md
│   ├── 📄 00_ENVIRONMENT_SPECIFICATION.md
│   ├── 📄 01_MODULE_01_MEMBER_SYSTEM.md
│   ├── 📄 01_MODULE_02_SHOPPING_SYSTEM.md
│   ├── ... (추가 모듈 문서)
│   ├── 📄 shopping_mall_core.md
│   └── 📄 ... (기타 사양)
│
├── 📄 .env                                       (공유 설정, 커밋 가능)
├── 📄 .env.local                                 (개인 설정, 커밋 금지)
├── 📄 .gitignore                                 (git 무시 규칙)
├── 📄 .npmrc                                     (NPM 설정)
├── 📄 package.json                               (루트 패키지)
├── 📄 package-lock.json                          (의존성 잠금)
├── 📄 tsconfig.json                              (TypeScript 설정)
├── 📄 README.md                                  (프로젝트 설명)
└── 📄 CLAUDE.md                                  (AI 지침서)
```

---

## 2. STAGING 환경 파일 구조

```
/home/deploy/staging/                            (배포 디렉토리)
│
├── 📁 apps/
│   ├── 📁 api/
│   │   ├── 📁 src/
│   │   ├── 📁 dist/                             (컴파일됨, 수정 금지)
│   │   ├── 📄 package.json
│   │   └── 📄 .env.staging                      (자동 배포, 수정 금지)
│   │
│   └── 📁 web/
│       ├── 📁 dist/                             (빌드됨, 수정 금지)
│       └── 📄 .env.staging                      (자동 배포, 수정 금지)
│
├── 📄 .env.staging                              (읽기만, 수정 금지)
├── 📄 pm2.config.js                             (읽기만, 수정 금지)
│
├── 📁 logs/                                      (자동 로테이션)
│   ├── 📄 api.log
│   ├── 📄 api-error.log
│   ├── 📄 web.log
│   ├── 📄 nginx_access.log
│   ├── 📄 nginx_error.log
│   ├── 📄 audit.log
│   └── 📄 deploy.log
│
├── 📁 backups/                                   (자동 백업)
│   ├── 📁 daily/
│   │   └── 📄 staging-YYYY-MM-DD-HHmmss.tar.gz
│   ├── 📁 weekly/
│   └── 📁 monthly/
│
├── 📁 certificates/                              (SSL)
│   ├── 📄 staging.kleinanzeigen.co.kr.crt
│   └── 📄 staging.kleinanzeigen.co.kr.key
│
└── 📁 scripts/                                   (배포 스크립트)
    ├── 📄 deploy.sh
    ├── 📄 health-check.sh
    ├── 📄 rollback.sh
    └── 📄 backup.sh
```

---

## 3. PRODUCTION 환경 파일 구조

```
/home/deploy/production/                         (배포 디렉토리, 절대 불변)
│
├── 📁 apps/
│   ├── 📁 api/
│   │   ├── 📁 src/
│   │   ├── 📁 dist/                             (컴파일됨, 수정 금지)
│   │   ├── 📄 package.json
│   │   └── 📄 .env.production                   (읽기만, 절대 수정 금지)
│   │
│   └── 📁 web/
│       ├── 📁 dist/                             (빌드됨, 수정 금지)
│       └── 📄 .env.production                   (읽기만, 절대 수정 금지)
│
├── 📄 .env.production                           (읽기만, 절대 수정 금지)
├── 📄 pm2.config.js                             (읽기만, 절대 수정 금지)
│
├── 📁 logs/                                      (일일 로테이션, 90일 보관)
│   ├── 📄 api.log
│   ├── 📄 api-error.log
│   ├── 📄 web.log
│   ├── 📄 nginx_access.log
│   ├── 📄 nginx_error.log
│   ├── 📄 audit.log                             (모든 SSH 접속 기록)
│   └── 📄 deploy.log
│
├── 📁 backups/                                   (자동 백업, 법적 보관)
│   ├── 📁 daily/                                (7개, 6시간마다)
│   │   └── 📄 production-YYYY-MM-DD-HHmmss.tar.gz
│   ├── 📁 weekly/                               (4개)
│   ├── 📁 monthly/                              (12개)
│   └── 📁 disaster-recovery/
│
├── 📁 certificates/                              (SSL, 법적 관리)
│   ├── 📄 www.kleinanzeigen.co.kr.crt           (HTTPS)
│   ├── 📄 www.kleinanzeigen.co.kr.key
│   ├── 📄 api.kleinanzeigen.co.kr.crt           (API HTTPS)
│   └── 📄 api.kleinanzeigen.co.kr.key
│
├── 📁 security/                                  (보안 설정)
│   ├── 📄 firewall.rules
│   ├── 📄 iptables.rules
│   ├── 📄 fail2ban.conf
│   └── 📄 ssl.conf
│
└── 📁 scripts/                                   (배포 스크립트)
    ├── 📄 deploy.sh                             (자동 배포)
    ├── 📄 health-check.sh                       (24/7 모니터링)
    ├── 📄 rollback.sh                           (긴급 롤백)
    ├── 📄 backup.sh                             (자동 백업)
    ├── 📄 disaster-recovery.sh                  (재해 복구)
    └── 📄 audit-log.sh                          (보안 감시)
```

---

## 4. 파일명 변경 금지 사항

### 4.1 절대 변경 금지 (LOCKED)

```
LOCAL 환경:
  ❌ .claude/*.md (기획서)
  ❌ .claude/hooks/*.js (검증 스크립트)
  ❌ .env (공유 설정)
  ❌ apps/api/src/** (소스 코드 구조)
  ❌ apps/web/src/** (소스 코드 구조)
  ❌ knowledge_base/*.md (사양 문서)

STAGING 환경:
  ❌ /home/deploy/staging/.env.staging
  ❌ /home/deploy/staging/pm2.config.js
  ❌ /home/deploy/staging/apps/api/dist/**
  ❌ /home/deploy/staging/apps/web/dist/**

PRODUCTION 환경:
  ❌ /home/deploy/production/.env.production
  ❌ /home/deploy/production/pm2.config.js
  ❌ /home/deploy/production/apps/api/dist/**
  ❌ /home/deploy/production/apps/web/dist/**
  ❌ /home/deploy/production/certificates/**
  ❌ /home/deploy/production/backups/**
  ❌ /home/deploy/production/logs/**
  ❌ /home/deploy/production/security/**
```

### 4.2 금지된 파일명 패턴

```
❌ 한글 파일명 (영문/숫자/대시만 사용)
❌ 공백 포함 파일명 (대시나 언더스코어 사용)
❌ 대문자 섞임 (소문자로 통일)
❌ 숫자로 시작 (문자로 시작)
❌ 특수 문자 포함 (영문, 숫자, 대시, 언더스코어만)
❌ 이전 버전 파일 남김 (v1, v2, backup 등)
```

### 4.3 올바른 파일명 패턴

```
✅ environment-validator.js
✅ deploy-lock.js
✅ spec-parser.js
✅ LOCAL_ENVIRONMENT_CONFIG.md
✅ STAGING_ENVIRONMENT_CONFIG.md
✅ PRODUCTION_ENVIRONMENT_CONFIG.md
✅ .env.local
✅ .env.staging
✅ .env.production
```

---

## 5. 자동 생성 파일 (수정 금지)

### 5.1 Hook 실행 시 생성

```
.claude/parsed/*.json          (pre-deploy hook 실행 시)
.claude/analysis/*.json        (pre-deploy hook 실행 시)
.claude/validation_report.json (pre-deploy hook 실행 시)
.claude/health_check_log.json  (post-deploy hook 실행 시)
```

### 5.2 배포 시 생성

```
/home/deploy/staging/.env.staging           (자동 생성)
/home/deploy/staging/pm2.config.js          (자동 생성)
/home/deploy/staging/logs/*.log             (자동 로테이션)
/home/deploy/staging/backups/*.tar.gz       (자동 백업)

/home/deploy/production/.env.production     (자동 생성)
/home/deploy/production/pm2.config.js       (자동 생성)
/home/deploy/production/logs/*.log          (자동 로테이션)
/home/deploy/production/backups/*.tar.gz    (자동 백업)
```

### 5.3 검증

수정 시도하면 자동 차단됨:
```
❌ permission denied (읽기 전용)
❌ file is auto-generated (자동 생성)
❌ modification detected (변경 감지)
```

---

## 6. .gitignore 규칙

```
# 환경 설정 (개인)
.env.local
.env.*.local
.env.production
.env.staging

# 의존성
node_modules/
package-lock.json

# 빌드 산출물
dist/
build/
*.tsbuildinfo

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# 로그
*.log
logs/

# 백업
*.backup
*.bak
backups/

# 임시 파일
.tmp/
temp/
*.tmp

# 보안
.env.production-patch
secrets.json
*.key
```

---

## 7. 파일 체크섬 (무결성 검증)

### 7.1 계산 방법

```bash
# SHA256 체크섬 생성
find .claude -type f -name "*.md" -o -name "*.js" | xargs sha256sum > .claude/manifest.sha256

# 검증
sha256sum -c .claude/manifest.sha256
```

### 7.2 모니터링

```
Pre-commit hook:
  ✓ 파일명 패턴 검증
  ✓ 금지된 파일 감지
  ✓ 자동 생성 파일 수정 감지

Pre-deploy hook:
  ✓ 파일 무결성 검증 (체크섬)
  ✓ 모든 필수 파일 존재 확인
```

---

## 8. 파일 이름 변경 이력 (참고)

### 8.1 가능한 실수 패턴

```
❌ environment-validator.js → environment_validator.js
❌ deploy-lock.js → deploylock.js
❌ spec-parser.js → spec_parser.js
❌ .env.local → .env.dev
❌ .env.staging → .env.stg
❌ .env.production → .env.prod
❌ LOCAL_ENVIRONMENT_CONFIG.md → local-env.md
```

### 8.2 감지 및 조치

```
파일명 변경 감지 시:
  1. Pre-commit hook에서 차단
  2. 이전 파일명 감지
  3. 사용자에게 이유 설명 요청
  4. 명시적 승인 필요
```

---

## 9. 검증 체크리스트

배포 전 파일 구조 확인:

```
[ ] 모든 .md 파일 존재 (.claude/ 디렉토리)
[ ] 모든 .js 파일 존재 (.claude/hooks/ 디렉토리)
[ ] 파일명이 정확함 (영문, 대시, 언더스코어만)
[ ] .env 파일이 올바른 위치 (로컬/스테이징/프로덕션)
[ ] 금지된 파일이 없음 (이전 버전, 백업 등)
[ ] apps/api와 apps/web 구조가 올바름
[ ] knowledge_base/ 디렉토리가 정확함
[ ] .gitignore가 최신 상태
[ ] 체크섬 검증 통과
```

---

**이 매니페스트는 프로젝트 구조를 고정합니다.**  
**파일명 변경이 감지되면 자동으로 차단됩니다.**
