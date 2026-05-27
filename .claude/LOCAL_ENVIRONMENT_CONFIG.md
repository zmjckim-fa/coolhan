# LOCAL 개발 환경 설정 (불변 설정)

**용도:** 개발자 로컬 머신에서 기능 개발 및 테스트  
**관리자:** 개발자 본인  
**변경 금지:** 절대 금지  
**버전:** 1.0.0

---

## 1. 네트워크 설정

### 1.1 포트 할당 (고정)

| 서비스 | 포트 | 상태 | 용도 |
|--------|------|------|------|
| React Development Server | 3000 | 개발 중 | 웹 프론트엔드 |
| Node.js API Server | 3001 | 개발 중 | REST API |
| PostgreSQL Database | 5432 | 개발 중 | 주 데이터베이스 |
| Redis Cache | 6379 | 개발 중 | 세션/캐시 |
| MySQL (선택) | 3306 | 선택 | 추가 데이터베이스 |

### 1.2 호스트 설정

```
localhost = 127.0.0.1
hostname = [개발자 컴퓨터명]
```

### 1.3 네트워크 구조

```
로컬 머신
├─ React (http://localhost:3000)
├─ API (http://localhost:3001)
├─ PostgreSQL (localhost:5432)
└─ Redis (localhost:6379)

대외 연결:
├─ GitHub (origin, develop 브랜치만)
└─ NPM Registry (공개)
```

---

## 2. 파일 시스템 설정

### 2.1 디렉토리 구조

```
C:\sites\CoolHan builder\
├── apps\
│   ├── api\                    (포트 3001)
│   │   ├── src\
│   │   ├── prisma\
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── .env.local          (로컬 환경변수)
│   │
│   └── web\                    (포트 3000)
│       ├── src\
│       ├── public\
│       ├── package.json
│       ├── tsconfig.json
│       └── .env.local          (로컬 환경변수)
│
├── .claude\                    (프레임워크)
│   ├── hooks\
│   ├── parsed\                 (생성됨)
│   ├── analysis\               (생성됨)
│   └── *.md                    (기획서)
│
├── knowledge_base\             (사양서)
├── .env                        (공유 설정)
├── .env.local                  (개인 설정, .gitignore)
└── .gitignore
```

### 2.2 파일명 규칙 (절대 변경 금지)

```
프로덕션 코드: 
  - /apps/api/src/**/*.ts
  - /apps/web/src/**/*.tsx

설정 파일:
  - /apps/api/.env.local
  - /apps/web/.env.local
  - /.env
  - /.env.local

기획서:
  - /.claude/*.md
  - /knowledge_base/*.md

자동 생성 파일 (수정 금지):
  - /.claude/parsed/*.json
  - /.claude/analysis/*.json
  - /node_modules/
  - /dist/
  - /build/
```

---

## 3. 데이터베이스 설정

### 3.1 PostgreSQL

```sql
Host: localhost
Port: 5432
User: postgres
Password: [로컬 설정]
Database: coolhan_dev
Encoding: UTF8
```

### 3.2 데이터 초기화

```bash
# 데이터베이스 생성
createdb coolhan_dev

# 스키마 적용
cd apps/api
npx prisma migrate dev --name init

# 테스트 데이터 추가 (선택)
npx ts-node prisma/seed.ts
```

### 3.3 데이터 백업 위치

```
로컬 백업: 하지 않음 (dev 데이터라 중요하지 않음)
주의: 프로덕션 데이터 절대 다운로드 금지
```

---

## 4. 환경변수 설정

### 4.1 apps/api/.env.local

```env
# 데이터베이스
DATABASE_URL="postgresql://postgres:password@localhost:5432/coolhan_dev"

# Redis
REDIS_URL="redis://localhost:6379"

# Kakao OAuth (테스트 키)
KAKAO_CLIENT_ID="[테스트_ID]"
KAKAO_CLIENT_SECRET="[테스트_SECRET]"
KAKAO_REDIRECT_URI="http://localhost:3001/auth/kakao/callback"

# Stripe (테스트 키)
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."

# 이메일 (테스트)
SMTP_HOST="localhost"
SMTP_PORT="1025"
SMTP_USER="test"
SMTP_PASS="test"

# 서명
JWT_SECRET="dev-secret-key-12345678"
JWT_EXPIRY="24h"

# 로깅
LOG_LEVEL="debug"
NODE_ENV="development"

# API
API_PORT="3001"
API_HOST="localhost"
```

### 4.2 apps/web/.env.local

```env
# API 연결
REACT_APP_API_URL="http://localhost:3001"
REACT_APP_API_WS_URL="ws://localhost:3001"

# Kakao
REACT_APP_KAKAO_CLIENT_ID="[테스트_ID]"

# Stripe
REACT_APP_STRIPE_KEY="pk_test_..."

# 환경
REACT_APP_ENV="development"
REACT_APP_DEBUG="true"
```

### 4.3 /.env (공유, 커밋 가능)

```env
# 공유 설정 (모든 개발자 동일)
NODE_ENV=development
ENVIRONMENT=LOCAL

# 포트
API_PORT=3001
WEB_PORT=3000
DB_PORT=5432
REDIS_PORT=6379

# 타임존
TZ=Asia/Seoul
```

### 4.4 /.env.local (개인, 커밋 금지)

```env
# 개인 설정 (각자 다름)
DB_PASSWORD=[개인_비밀번호]
PERSONAL_KAKAO_ID=[개인_테스트_ID]
```

---

## 5. 깃허브 설정

### 5.1 Git Remote

```bash
git remote -v
# origin  https://github.com/[계정]/coolhan.git (fetch)
# origin  https://github.com/[계정]/coolhan.git (push)
```

### 5.2 브랜치 규칙

```
현재 브랜치: develop (필수)
작업 브랜치: feature/[기능명]
머지 방향: feature → develop

금지사항:
  ❌ main 브랜치에 직접 커밋
  ❌ staging 브랜치 접근
  ❌ production 브랜치 접근
```

### 5.3 커밋 규칙

```
형식: [TYPE]: 변경 이유 (한국어, 명령형)

예시:
  ✅ feat: 회원가입 페이지 Kakao OAuth 버튼 추가해 소셜 로그인 지원
  ✅ fix: 로그인 후 리다이렉트 경로 오류 수정해 사용자 혼동 방지
  ✅ refactor: 결제 로직을 Promise 기반으로 재구성해 가독성 향상

금지:
  ❌ git commit --amend
  ❌ git push --force
  ❌ git rebase -i
```

---

## 6. 개발 도구 설정

### 6.1 Node.js & NPM

```
Node.js 버전: 18.x LTS 이상
NPM 버전: 9.x 이상
Package Manager: npm (yarn 금지)
```

### 6.2 IDE 설정

```
권장: VS Code
확장:
  - ESLint
  - Prettier
  - TypeScript Vue Plugin
  - Thunder Client (API 테스트)
  - PostgreSQL Manager
```

### 6.3 실행 명령어

```bash
# 초기 설정
npm install
cd apps/api && npm install
cd apps/web && npm install

# 개발 실행
npm run dev                    # 모두 실행
cd apps/api && npm run dev    # API만 실행
cd apps/web && npm run dev    # Web만 실행

# 타입 검사
npm run type-check

# 린트
npm run lint

# 테스트
npm test

# 빌드 (로컬 테스트용)
npm run build
```

---

## 7. 테스트 설정

### 7.1 단위 테스트

```bash
cd apps/api
npm test -- --watch

# 커버리지
npm test -- --coverage
```

### 7.2 통합 테스트

```bash
npm run test:integration
```

### 7.3 E2E 테스트

```bash
npm run test:e2e
```

---

## 8. 절대 금지 사항

### 8.1 데이터베이스

```
❌ 프로덕션 데이터베이스 접속
❌ 프로덕션 데이터 다운로드
❌ production_db로 변경
❌ 실제 사용자 데이터 로컬에 저장
```

### 8.2 API 및 키

```
❌ 실제 Kakao OAuth 키 사용
❌ 실제 결제(Stripe) 키 테스트
❌ 실제 이메일 발송
❌ 프로덕션 API 엔드포인트 호출
```

### 8.3 파일 시스템

```
❌ .env.production 파일 접근
❌ /home/deploy/ 경로 접근
❌ /var/log/ 경로 접근
❌ 프로덕션 백업 다운로드
```

### 8.4 포트 변경

```
❌ 포트 3000, 3001, 5432, 6379 변경
❌ localhost를 다른 IP로 변경
❌ 환경 설정 파일 수정 후 커밋
```

### 8.5 깃허브

```
❌ main 브랜치 직접 푸시
❌ staging 브랜치 접근
❌ production 브랜치 접근
❌ --force 플래그 사용
❌ 커밋 이력 변경 (amend, rebase)
```

---

## 9. 문제 해결

### 9.1 포트 충돌

```bash
# 포트 사용 확인
lsof -i :3000
lsof -i :3001
lsof -i :5432

# 프로세스 종료
kill -9 [PID]
```

### 9.2 데이터베이스 연결 실패

```bash
# PostgreSQL 상태 확인
pg_isready -h localhost -p 5432

# 데이터베이스 목록
psql -U postgres -l

# 다시 마이그레이션
cd apps/api
npx prisma migrate dev --name init
```

### 9.3 의존성 오류

```bash
# node_modules 삭제 및 재설치
rm -rf node_modules package-lock.json
npm install

# 각 앱도 동일
cd apps/api
rm -rf node_modules package-lock.json
npm install
```

---

## 10. 체크리스트

배포 전 로컬 환경 확인:

```
[ ] Node.js 버전 확인: node -v
[ ] NPM 버전 확인: npm -v
[ ] 포트 확인: 3000, 3001, 5432, 6379 모두 실행 중
[ ] 데이터베이스 확인: psql -U postgres -d coolhan_dev
[ ] 환경변수 확인: .env.local 파일 존재
[ ] 의존성 확인: npm ls (에러 없음)
[ ] 타입 검사: npm run type-check (통과)
[ ] 린트: npm run lint (통과)
[ ] 단위 테스트: npm test (통과)
[ ] API 실행: npm run dev (포트 3001에서 응답)
[ ] Web 실행: npm run dev (포트 3000에서 응답)
[ ] 깃 상태: git status (clean)
[ ] 커밋 준비: git log -1 --oneline
```

---

**이 설정은 LOCAL 환경에서만 유효합니다.**  
**STAGING 또는 PRODUCTION 배포 시에는 해당 환경 설정 파일을 참조하세요.**
