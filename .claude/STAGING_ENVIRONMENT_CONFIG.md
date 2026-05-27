# STAGING 환경 설정 (불변 설정)

**용도:** 프로덕션 배포 전 최종 테스트  
**접근:** 승인된 개발자만  
**변경 금지:** 절대 금지  
**버전:** 1.0.0

---

## 1. 네트워크 설정

### 1.1 포트 할당 (고정)

| 서비스 | 포트 | 상태 | 용도 |
|--------|------|------|------|
| Node.js API Server | 4001 | 실행 중 | REST API |
| Reverse Proxy (Nginx) | 443 | 실행 중 | HTTPS 프론트엔드 |
| PostgreSQL Database | 5432 | 내부 | 데이터베이스 (외부 미노출) |
| Redis Cache | 6379 | 내부 | 세션/캐시 (외부 미노출) |

**주의:** 포트 4001과 2222는 고정입니다. 절대 변경 금지.

### 1.2 호스트 설정

```
도메인: staging.kleinanzeigen.co.kr
호스트명: staging-server-01
IP: 203.0.113.50 (예시)
```

### 1.3 네트워크 구조

```
인터넷
  ↓ HTTPS:443
Nginx Reverse Proxy (포트 80, 443)
  ├─ /api/* → API (포트 4001)
  └─ /* → Web (정적 파일)

내부 네트워크
  ├─ API (127.0.0.1:4001)
  ├─ PostgreSQL (127.0.0.1:5432, 내부만)
  └─ Redis (127.0.0.1:6379, 내부만)
```

### 1.4 SSH 접속

```
Host: staging.kleinanzeigen.co.kr
Port: 2222 (중요: 표준 22 아님!)
User: deploy
Key: ~/.ssh/id_staging
```

**중요:** SSH 포트는 2222입니다. 절대 변경 금지.

---

## 2. 파일 시스템 설정

### 2.1 디렉토리 구조

```
/home/deploy/staging/
├── apps/
│   ├── api/                    (포트 4001)
│   │   ├── src/
│   │   ├── prisma/
│   │   ├── dist/               (컴파일됨)
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── .env.staging        (자동 배포)
│   │
│   └── web/                    (Nginx reverse proxy)
│       ├── src/
│       ├── dist/               (빌드 산출물)
│       ├── package.json
│       └── .env.staging        (자동 배포)
│
├── .env.staging                (자동 배포, 수동 수정 금지)
├── pm2.config.js               (자동 배포, 수동 수정 금지)
├── logs/
│   ├── api.log
│   ├── web.log
│   └── nginx_access.log
├── backups/
│   └── [날짜별 백업]
└── scripts/
    ├── deploy.sh
    ├── health-check.sh
    └── rollback.sh
```

### 2.2 파일명 규칙 (절대 변경 금지)

```
배포된 코드: 
  - /home/deploy/staging/apps/api/dist/**/*.js
  - /home/deploy/staging/apps/web/dist/**/*.js

설정 파일:
  - /home/deploy/staging/.env.staging (읽기만)
  - /home/deploy/staging/pm2.config.js (읽기만)

로그 파일:
  - /home/deploy/staging/logs/*.log

백업:
  - /home/deploy/staging/backups/staging-YYYY-MM-DD-HHmmss.tar.gz

금지된 수정:
  - .env.staging (절대 수정 금지, 배포 시마다 새로 생성)
  - pm2.config.js (절대 수정 금지, 배포 시마다 새로 생성)
```

---

## 3. 데이터베이스 설정

### 3.1 PostgreSQL

```sql
Host: 127.0.0.1 (내부만)
Port: 5432
User: staging_user (읽기/쓰기)
Password: [자동 생성, 비밀번호 관리자만 알음]
Database: kleinanzeigen_staging
Encoding: UTF8

접근 제한:
  ✅ /home/deploy/staging/apps/api에서만 연결 가능
  ❌ 외부 IP에서 접속 금지
```

### 3.2 데이터 관리

```
데이터 초기화: 자동 마이그레이션으로만
테스트 데이터: 배포 시 자동 시드
백업: 매일 00:00 UTC (자동)
보관 기간: 7일
```

### 3.3 마이그레이션

```bash
# 자동으로 실행됨 (배포 후)
cd /home/deploy/staging/apps/api
npx prisma migrate deploy
npx prisma db seed
```

---

## 4. 환경변수 설정

### 4.1 .env.staging (자동 생성, 수동 수정 금지)

```env
# 데이터베이스
DATABASE_URL="postgresql://staging_user:[자동]@127.0.0.1:5432/kleinanzeigen_staging"

# Redis
REDIS_URL="redis://127.0.0.1:6379/0"

# Kakao OAuth (스테이징 키)
KAKAO_CLIENT_ID="[staging_id]"
KAKAO_CLIENT_SECRET="[staging_secret]"
KAKAO_REDIRECT_URI="https://staging.kleinanzeigen.co.kr/auth/kakao/callback"

# Stripe (테스트 키)
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."

# 이메일 (스테이징 SMTP)
SMTP_HOST="smtp.staging.mail.com"
SMTP_PORT="587"
SMTP_USER="staging@kleinanzeigen.co.kr"
SMTP_PASS="[자동]"
SMTP_FROM="noreply@staging.kleinanzeigen.co.kr"

# JWT
JWT_SECRET="[자동 생성, 길이 32+]"
JWT_EXPIRY="24h"

# 로깅
LOG_LEVEL="info"
LOG_FILE="/home/deploy/staging/logs/api.log"
NODE_ENV="staging"

# API
API_PORT="4001"
API_HOST="127.0.0.1"
API_URL="https://api-staging.kleinanzeigen.co.kr"

# 모니터링
SENTRY_DSN="https://[key]@sentry.io/[project]"
```

### 4.2 웹 환경변수

```env
# API 연결
REACT_APP_API_URL="https://api-staging.kleinanzeigen.co.kr"
REACT_APP_API_WS_URL="wss://api-staging.kleinanzeigen.co.kr"

# Kakao
REACT_APP_KAKAO_CLIENT_ID="[staging_id]"

# Stripe
REACT_APP_STRIPE_KEY="pk_test_..."

# 환경
REACT_APP_ENV="staging"
REACT_APP_DEBUG="true"
REACT_APP_SENTRY_DSN="https://[key]@sentry.io/[project]"
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
배포 브랜치: staging (필수)
머지 원본: develop → staging
배포 트리거: staging 브랜치에 commit 시

금지사항:
  ❌ main 브랜치에 직접 커밋
  ❌ production 브랜치 접근
  ❌ 로컬에서 staging 브랜치 수정
```

### 5.3 배포 흐름

```
개발자 (develop)
    ↓ git push origin develop
GitHub (develop)
    ↓ Pull Request → Code Review
GitHub (staging) ← merge
    ↓ CI/CD 트리거
자동 배포 시작
    ↓ pre-deploy hook 실행
    ↓ 빌드 및 테스트
    ↓ SSH deploy.sh 실행
/home/deploy/staging/ ← 배포
    ↓ post-deploy hook 실행
배포 완료
```

---

## 6. PM2 관리

### 6.1 PM2 설정

```javascript
// pm2.config.js (자동 생성)
module.exports = {
  apps: [
    {
      name: 'kleinanzeigen-api',
      script: './apps/api/dist/index.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'staging',
        PORT: 4001
      },
      error_file: '/home/deploy/staging/logs/api-error.log',
      out_file: '/home/deploy/staging/logs/api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      max_restarts: 5,
      min_uptime: '10s'
    },
    {
      name: 'kleinanzeigen-web',
      script: 'serve',
      args: '-s dist -l 3000',
      cwd: './apps/web',
      instances: 1,
      error_file: '/home/deploy/staging/logs/web-error.log',
      out_file: '/home/deploy/staging/logs/web-out.log',
      max_restarts: 5,
      min_uptime: '10s'
    }
  ],
  deploy: {
    staging: {
      user: 'deploy',
      host: 'staging.kleinanzeigen.co.kr',
      port: 2222,
      key: '~/.ssh/id_staging',
      ref: 'origin/staging',
      repo: 'https://github.com/[계정]/coolhan.git',
      path: '/home/deploy/staging',
      'post-deploy': 'npm install && npm run build && pm2 startOrRestart pm2.config.js'
    }
  }
};
```

### 6.2 PM2 명령어

```bash
# 프로세스 확인
pm2 list
pm2 logs kleinanzeigen-api
pm2 logs kleinanzeigen-web

# 재시작
pm2 restart kleinanzeigen-api
pm2 restart kleinanzeigen-web

# 중지
pm2 stop kleinanzeigen-api
pm2 stop kleinanzeigen-web
```

---

## 7. HTTPS/SSL 설정

### 7.1 Nginx 설정

```nginx
# /etc/nginx/sites-available/staging.kleinanzeigen.co.kr

server {
    listen 80;
    server_name staging.kleinanzeigen.co.kr;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name staging.kleinanzeigen.co.kr;
    
    ssl_certificate /etc/letsencrypt/live/staging.kleinanzeigen.co.kr/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/staging.kleinanzeigen.co.kr/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # 정적 파일 (Web)
    location / {
        root /home/deploy/staging/apps/web/dist;
        try_files $uri $uri/ /index.html;
        expires 1h;
        add_header Cache-Control "public, max-age=3600";
    }
    
    # API 프록시
    location /api/ {
        proxy_pass http://127.0.0.1:4001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # WebSocket 프록시
    location /ws {
        proxy_pass http://127.0.0.1:4001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
    
    # 헬스 체크
    location /health {
        access_log off;
        return 200 "OK";
        add_header Content-Type text/plain;
    }
}
```

### 7.2 SSL 인증서 (Let's Encrypt)

```bash
# 인증서 발급 (자동)
certbot certonly --webroot -w /home/deploy/staging/apps/web/dist -d staging.kleinanzeigen.co.kr

# 자동 갱신 (crontab)
0 2 * * * certbot renew --quiet && systemctl reload nginx
```

---

## 8. 헬스 체크 및 모니터링

### 8.1 자동 헬스 체크

```bash
# /home/deploy/staging/scripts/health-check.sh

#!/bin/bash
set -e

echo "[$(date)] Starting health checks..."

# 1. PM2 상태
if ! pm2 list | grep -q "online"; then
    echo "❌ PM2 프로세스 오프라인"
    exit 1
fi

# 2. API 응답
API_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://staging.kleinanzeigen.co.kr/api/health)
if [ "$API_RESPONSE" != "200" ]; then
    echo "❌ API health check failed: $API_RESPONSE"
    exit 1
fi

# 3. 데이터베이스
if ! psql -U staging_user -d kleinanzeigen_staging -c "SELECT 1" > /dev/null; then
    echo "❌ Database connection failed"
    exit 1
fi

# 4. Redis
if ! redis-cli ping > /dev/null; then
    echo "❌ Redis connection failed"
    exit 1
fi

echo "✅ All health checks passed"
```

### 8.2 모니터링

```
Uptime Monitoring: 24/7 자동 확인
Error Monitoring: Sentry (자동)
Performance Monitoring: 응답 시간 추적
Log Aggregation: ELK Stack (자동)
```

---

## 9. 배포 절차

### 9.1 배포 명령어

```bash
# 1. 배포 시작 (develop → staging)
git checkout staging
git pull origin staging
git merge origin/develop
git push origin staging

# CI/CD 자동 실행
# - pre-deploy.js (검증)
# - build (npm run build)
# - test (npm test)
# - 배포 (SSH + PM2)
# - post-deploy.js (헬스체크)
```

### 9.2 배포 롤백

```bash
# 자동 롤백 (배포 실패 시)
/home/deploy/staging/scripts/rollback.sh

# 수동 롤백
git revert [commit-sha]
git push origin staging
```

---

## 10. 절대 금지 사항

### 10.1 데이터베이스

```
❌ 프로덕션 데이터베이스 접속
❌ 프로덕션 데이터 복사
❌ 실제 사용자 데이터 추가
❌ 데이터 삭제 (백업 먼저!)
```

### 10.2 환경 설정

```
❌ .env.staging 파일 수동 수정
❌ pm2.config.js 수동 수정
❌ Nginx 설정 수동 변경 (배포 시 자동)
❌ 포트 4001, 443, 2222 변경
```

### 10.3 파일 시스템

```
❌ /home/deploy/staging 외 경로 접근
❌ 로그 파일 직접 수정
❌ 백업 파일 삭제
❌ 이전 버전 파일 남김
```

### 10.4 깃허브

```
❌ main 브랜치에 푸시
❌ production 브랜치 접근
❌ staging 브랜치 강제 푸시 (--force)
❌ 커밋 이력 변경
```

### 10.5 SSH 접근

```
❌ SSH 포트 변경 (2222로 고정)
❌ 여러 번 동시 배포
❌ SSH 중단 후 재시도 (lock 파일 확인)
❌ 배포 중 PM2 수동 조작
```

---

## 11. 문제 해결

### 11.1 배포 실패

```bash
# 1. 로그 확인
tail -f /home/deploy/staging/logs/api.log
tail -f /home/deploy/staging/logs/deploy.log

# 2. PM2 상태 확인
pm2 list
pm2 logs kleinanzeigen-api

# 3. 데이터베이스 확인
psql -U staging_user -d kleinanzeigen_staging -c "SELECT version();"

# 4. 자동 롤백
/home/deploy/staging/scripts/rollback.sh
```

### 11.2 포트 충돌

```bash
# 포트 사용 확인
netstat -tulpn | grep 4001

# 프로세스 강제 종료
sudo kill -9 [PID]

# PM2 재시작
pm2 restart kleinanzeigen-api
```

### 11.3 SSH 연결 실패

```bash
# SSH 포트 확인 (2222)
ssh -p 2222 -i ~/.ssh/id_staging deploy@staging.kleinanzeigen.co.kr

# 키 권한 확인
chmod 600 ~/.ssh/id_staging
chmod 700 ~/.ssh
```

---

## 12. 체크리스트

배포 전 스테이징 환경 확인:

```
[ ] GitHub staging 브랜치 최신 상태
[ ] SSH 포트 2222 접속 가능
[ ] PM2 프로세스 온라인 상태 (pm2 list)
[ ] API 응답 확인 (curl https://staging.kleinanzeigen.co.kr/api/health)
[ ] 데이터베이스 연결 (psql 명령어)
[ ] Redis 상태 확인 (redis-cli ping)
[ ] 로그 파일 없는 에러 (tail -f logs/)
[ ] Nginx 설정 (nginx -t)
[ ] SSL 인증서 유효 (openssl s_client)
[ ] 전체 헬스 체크 통과 (health-check.sh)
```

---

**이 설정은 STAGING 환경에서만 유효합니다.**  
**프로덕션 배포 시에는 PRODUCTION_ENVIRONMENT_CONFIG.md를 참조하세요.**  
**모든 배포는 자동화되며, 수동 개입은 최소화됩니다.**
