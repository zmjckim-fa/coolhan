# PRODUCTION 환경 설정 (절대 불변 설정)

**용도:** 실제 사용자 서비스  
**접근:** Chief DevOps만  
**변경 금지:** 절대 금지 (법적 책임)  
**버전:** 1.0.0  
**마지막 업데이트:** 2026-05-27

---

## ⚠️ 경고

이 문서의 모든 설정은 **법적 책임을 동반합니다.**

```
변경 시 발생하는 모든 결과:
  • 사용자 데이터 손실
  • 금융 거래 오류
  • 법적 배상 책임
  • 회사 신용도 추락
```

**따라서:**
- ❌ 절대 수정 금지
- ❌ 절대 포트 변경 금지
- ❌ 절대 데이터베이스 변경 금지
- ❌ 절대 SSH 포트 변경 금지

---

## 1. 네트워크 설정

### 1.1 포트 할당 (절대 불변)

| 서비스 | 포트 | 상태 | 용도 |
|--------|------|------|------|
| Node.js API Server | 4000 | 실행 중 | REST API (프라이머리) |
| Reverse Proxy (Nginx) | 443 | 실행 중 | HTTPS 프론트엔드 |
| PostgreSQL Primary | 5432 | 내부 | 메인 데이터베이스 |
| PostgreSQL Replica | 5432 | 내부 | 읽기 전용 복제 |
| Redis Primary | 6379 | 내부 | 세션/캐시 |
| Redis Replica | 6379 | 내부 | 캐시 백업 |

**중대 경고:** 포트 4000, 443, 2222는 법적 구속력이 있는 설정입니다.

### 1.2 호스트 설정

```
프라이머리 도메인: www.kleinanzeigen.co.kr
API 도메인: api.kleinanzeigen.co.kr
위성 도메인: kleinanzeigen.co.kr (리다이렉트)

호스트명: prod-server-01 (프라이머리)
호스트명: prod-server-02 (보조)
호스트명: prod-server-03 (보조)

IP 주소: 198.51.100.1 (프라이머리)
IP 주소: 198.51.100.2 (보조)
IP 주소: 198.51.100.3 (보조)
```

### 1.3 네트워크 구조

```
인터넷 (최종 사용자)
  ↓ HTTPS:443
CDN (CloudFlare / AWS CloudFront)
  ↓
Load Balancer (AWS ELB)
  ├─ prod-server-01 (40%)
  ├─ prod-server-02 (30%)
  └─ prod-server-03 (30%)
     ↓ HTTPS:4000
  Nginx Reverse Proxy
    ├─ /api/* → API (포트 4000)
    └─ /* → Web (정적 파일)

데이터베이스 클러스터 (프라이빗 네트워크)
  ├─ PostgreSQL Primary (198.51.100.10:5432)
  │   └─ Replica (198.51.100.11:5432)
  └─ Redis Primary (198.51.100.20:6379)
      └─ Replica (198.51.100.21:6379)
```

### 1.4 SSH 접속 (엄격히 제한)

```
Host: prod.kleinanzeigen.co.kr
Port: 2222 (절대 변경 금지)
User: deploy (읽기만)
User: admin (관리자만)
Key: ~/.ssh/id_prod (Hardware Token 필수)

접속 제한:
  ✅ Chief DevOps만 접속 가능
  ✅ 모든 접속은 VPN 필수
  ✅ 2FA (Two-Factor Authentication) 필수
  ✅ 모든 명령어 기록 (audit log)
  ✅ 접속 IP 화이트리스트 필수
```

---

## 2. 파일 시스템 설정

### 2.1 디렉토리 구조

```
/home/deploy/production/
├── apps/
│   ├── api/                    (포트 4000)
│   │   ├── src/
│   │   ├── prisma/
│   │   ├── dist/               (컴파일됨)
│   │   ├── package.json
│   │   └── .env.production     (읽기만, 수정 금지)
│   │
│   └── web/                    (Nginx reverse proxy)
│       ├── src/
│       ├── dist/               (빌드 산출물)
│       ├── package.json
│       └── .env.production     (읽기만, 수정 금지)
│
├── .env.production             (읽기만, 절대 수정 금지)
├── pm2.config.js               (읽기만, 절대 수정 금지)
├── logs/
│   ├── api.log (일일 로테이션)
│   ├── api-error.log
│   ├── web.log
│   ├── nginx_access.log
│   ├── nginx_error.log
│   └── audit.log               (모든 접속 기록)
│
├── backups/
│   ├── daily/                  (일일 백업)
│   │   ├── production-YYYY-MM-DD-HHmmss.tar.gz
│   │   └── ...
│   ├── weekly/                 (주간 백업)
│   ├── monthly/                (월간 백업)
│   └── disaster-recovery/      (재해 복구용)
│
├── certificates/
│   ├── kleinanzeigen.co.kr.crt
│   ├── kleinanzeigen.co.kr.key
│   ├── api.kleinanzeigen.co.kr.crt
│   └── api.kleinanzeigen.co.kr.key
│
├── security/
│   ├── firewall.rules
│   ├── iptables.rules
│   └── fail2ban.conf
│
└── scripts/
    ├── deploy.sh              (자동 배포)
    ├── health-check.sh        (24/7 모니터링)
    ├── rollback.sh            (긴급 롤백)
    ├── backup.sh              (자동 백업)
    ├── disaster-recovery.sh   (재해 복구)
    └── audit-log.sh           (보안 감시)
```

### 2.2 파일명 규칙 (절대 변경 금지)

```
배포된 코드:
  - /home/deploy/production/apps/api/dist/**/*.js
  - /home/deploy/production/apps/web/dist/**/*.js

설정 파일:
  - /home/deploy/production/.env.production (읽기만)
  - /home/deploy/production/pm2.config.js (읽기만)

SSL 인증서:
  - /home/deploy/production/certificates/*.crt
  - /home/deploy/production/certificates/*.key

로그 파일:
  - /home/deploy/production/logs/*.log (자동 로테이션)

백업:
  - /home/deploy/production/backups/**/*.tar.gz

금지된 수정:
  ❌ .env.production (배포 시에만 생성)
  ❌ pm2.config.js (배포 시에만 생성)
  ❌ 이전 버전 파일 남김
```

---

## 3. 데이터베이스 설정

### 3.1 PostgreSQL Primary

```sql
Host: prod-db-primary.internal (198.51.100.10)
Port: 5432
User: prod_user (읽기/쓰기)
User: prod_readonly (읽기만, API 사용)
Password: [Hardware Vault 관리]
Database: kleinanzeigen_prod
Encoding: UTF8

접근 제한:
  ✅ API 서버에서만 연결
  ✅ VPN을 통한 배스천 호스트에서만
  ❌ 외부 IP에서 접속 금지
  ❌ 직접 접속 금지
```

### 3.2 PostgreSQL Replica (읽기 전용)

```sql
Host: prod-db-replica.internal (198.51.100.11)
Port: 5432
User: prod_readonly (읽기만)
Database: kleinanzeigen_prod (Primary와 동일)

용도:
  - 읽기 전용 쿼리 분산
  - 백업 소스
  - 재해 복구 준비
  - 분석 쿼리 (야간 시간대)
```

### 3.3 데이터 관리

```
마이그레이션: 자동 (배포 후)
데이터 시드: 금지 (프로덕션)
백업 주기: 6시간마다 자동
백업 보관: 90일 (법적 요구사항)
복제 지연: 모니터링 (최대 1초)
```

### 3.4 마이그레이션 정책

```
변경 방식: 무중단 마이그레이션 (zero-downtime)

단계:
  1. STAGING에서 테스트
  2. 예비 복제본에서 검증
  3. 프라이머리에 적용 (자동)
  4. 복제본에 자동 동기화
  5. 모니터링 (1시간)

롤백 정책: 자동 (모니터링 실패 시)
```

---

## 4. 환경변수 설정

### 4.1 .env.production (읽기만, 절대 수정 금지)

```env
# 데이터베이스 (Primary)
DATABASE_URL="postgresql://prod_user:[vault]@prod-db-primary.internal:5432/kleinanzeigen_prod?sslmode=require"

# 데이터베이스 (Replica, 읽기만)
DATABASE_REPLICA_URL="postgresql://prod_readonly:[vault]@prod-db-replica.internal:5432/kleinanzeigen_prod?sslmode=require"

# Redis (Primary)
REDIS_URL="redis://prod-redis-primary.internal:6379/0"

# Redis (Replica, 캐시용)
REDIS_REPLICA_URL="redis://prod-redis-replica.internal:6379/0"

# Kakao OAuth (프로덕션 키)
KAKAO_CLIENT_ID="[Kakao Business - 프로덕션]"
KAKAO_CLIENT_SECRET="[Vault 관리]"
KAKAO_REDIRECT_URI="https://www.kleinanzeigen.co.kr/auth/kakao/callback"

# Stripe (프로덕션 키)
STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_SECRET_KEY="sk_live_[Vault 관리]"
STRIPE_WEBHOOK_SECRET="whsec_[Vault 관리]"

# 이메일 (프로덕션 SMTP)
SMTP_HOST="smtp.business.mail.com"
SMTP_PORT="587"
SMTP_USER="noreply@kleinanzeigen.co.kr"
SMTP_PASS="[Vault 관리]"
SMTP_FROM="noreply@kleinanzeigen.co.kr"
SMTP_REPLY_TO="support@kleinanzeigen.co.kr"

# JWT (프로덕션 키)
JWT_SECRET="[Vault 관리, 길이 64]"
JWT_EXPIRY="7d"
REFRESH_TOKEN_EXPIRY="30d"

# 보안
CORS_ORIGIN="https://www.kleinanzeigen.co.kr,https://kleinanzeigen.co.kr"
ALLOWED_HOSTS="www.kleinanzeigen.co.kr,api.kleinanzeigen.co.kr"
RATE_LIMIT_MAX_REQUESTS=1000
RATE_LIMIT_WINDOW_MS=3600000

# 로깅
LOG_LEVEL="warn"
LOG_FILE="/home/deploy/production/logs/api.log"
LOG_RETENTION_DAYS=90
NODE_ENV="production"

# API
API_PORT="4000"
API_HOST="127.0.0.1"
API_URL="https://api.kleinanzeigen.co.kr"
WEB_URL="https://www.kleinanzeigen.co.kr"

# 모니터링 (프로덕션)
SENTRY_DSN="https://[key]@sentry.io/[project]"
SENTRY_ENVIRONMENT="production"
SENTRY_SAMPLE_RATE=0.1
NEW_RELIC_LICENSE_KEY="[Vault 관리]"
DATADOG_API_KEY="[Vault 관리]"

# 기능 플래그
FEATURE_FLAGS_URL="https://config.kleinanzeigen.co.kr/flags"
FEATURE_FLAGS_API_KEY="[Vault 관리]"

# 알림 (slack, pagerduty)
SLACK_WEBHOOK_URL="[Vault 관리]"
PAGERDUTY_API_KEY="[Vault 관리]"
```

### 4.2 웹 환경변수

```env
# API 연결
REACT_APP_API_URL="https://api.kleinanzeigen.co.kr"
REACT_APP_API_WS_URL="wss://api.kleinanzeigen.co.kr"

# Kakao
REACT_APP_KAKAO_CLIENT_ID="[프로덕션]"

# Stripe
REACT_APP_STRIPE_KEY="pk_live_..."

# Google Analytics
REACT_APP_GA_ID="G-XXXXXXXXXX"

# 환경
REACT_APP_ENV="production"
REACT_APP_DEBUG="false"
REACT_APP_SENTRY_DSN="https://[key]@sentry.io/[project]"

# CDN
REACT_APP_CDN_URL="https://cdn.kleinanzeigen.co.kr"
REACT_APP_ASSETS_URL="https://assets.kleinanzeigen.co.kr"
```

---

## 5. 깃허브 설정

### 5.1 Git Remote

```bash
git remote -v
# origin  https://github.com/[계정]/coolhan.git (fetch)
# origin  https://github.com/[계정]/coolhan.git (push)
# origin-prod  https://github.com/[계정]/coolhan.git (read-only)
```

### 5.2 브랜치 규칙 (엄격함)

```
배포 브랜치: main (프로덕션만)
머지 원본: staging → main (Chief DevOps만)
배포 트리거: main 브랜치 변경 시 (자동)

필수 조건:
  1. Staging에서 최소 7일 검증
  2. 0 critical bugs
  3. Performance benchmark ≥ baseline
  4. 모든 테스트 통과
  5. Code review by 2+ senior engineers
  6. 배포 당일 모니터링 담당 배정

금지사항:
  ❌ develop → main 직접 머지
  ❌ --force 플래그 사용
  ❌ 커밋 이력 변경
  ❌ 로컬에서 main 브랜치 수정
```

### 5.3 배포 흐름

```
Staging (7일 검증)
    ↓ Performance 확인
    ↓ Security 검사
    ↓ Load test
    ↓ Approval from Chief DevOps
Pull Request (staging → main)
    ↓ Code Review (2명 이상)
    ↓ Approval
GitHub main branch ← merge
    ↓ Automated CI/CD Pipeline
    ↓ Stage 1: pre-deploy.js (6단계 검증)
    ↓ Stage 2: Build & Test
    ↓ Stage 3: Security Scan
    ↓ Stage 4: Deploy to Prod (SSH + PM2)
    ↓ Stage 5: post-deploy.js (12단계 검증)
배포 완료
    ↓ 모니터링 (24시간)
    ↓ Incident Response Ready
```

---

## 6. 클러스터 관리 (3중 서버)

### 6.1 서버 구성

```
프라이머리 (prod-server-01):
  - 공개 IP: 198.51.100.1
  - 역할: API 호스팅, 배포 진행
  - 트래픽: 40%
  - 전용: 메인 배포 대상

보조 1 (prod-server-02):
  - 공개 IP: 198.51.100.2
  - 역할: API 호스팅, 자동 동기화
  - 트래픽: 30%
  - 전용: 장애 조치 대기

보조 2 (prod-server-03):
  - 공개 IP: 198.51.100.3
  - 역할: API 호스팅, 자동 동기화
  - 트래픽: 30%
  - 전용: 성능 테스트
```

### 6.2 PM2 클러스터 모드

```javascript
// pm2.config.js (자동 생성)
module.exports = {
  apps: [
    {
      name: 'kleinanzeigen-api',
      script: './apps/api/dist/index.js',
      instances: 4,              // CPU 코어 수에 맞춤
      exec_mode: 'cluster',      // 클러스터 모드 필수
      env: {
        NODE_ENV: 'production',
        PORT: 4000,
        CLUSTER_MODE: 'true'
      },
      error_file: '/home/deploy/production/logs/api-error.log',
      out_file: '/home/deploy/production/logs/api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      max_restarts: 5,
      min_uptime: '1m',
      max_memory_restart: '500M',
      listen_timeout: 10000,
      kill_timeout: 5000,
      shutdown_with_message: true
    },
    {
      name: 'kleinanzeigen-web',
      script: 'serve',
      args: '-s dist -l 3000 -c .servrc.json',
      cwd: './apps/web',
      instances: 2,
      error_file: '/home/deploy/production/logs/web-error.log',
      out_file: '/home/deploy/production/logs/web-out.log',
      max_restarts: 5,
      min_uptime: '1m'
    }
  ],
  
  deploy: {
    production: {
      user: 'deploy',
      host: ['prod-server-01', 'prod-server-02', 'prod-server-03'],
      port: 2222,
      key: '~/.ssh/id_prod',
      ref: 'origin/main',
      repo: 'https://github.com/[계정]/coolhan.git',
      path: '/home/deploy/production',
      'pre-deploy-local': 'npm run validate',
      'post-deploy': 'npm install && npm run build && pm2 startOrRestart pm2.config.js',
      'env': {
        NODE_ENV: 'production'
      }
    }
  }
};
```

### 6.3 로드 밸런싱

```
AWS ELB 설정:
  - 프로토콜: HTTPS (443)
  - 대상 그룹:
    * prod-server-01:4000 (40%)
    * prod-server-02:4000 (30%)
    * prod-server-03:4000 (30%)
  - 헬스 체크: /api/health (5초마다)
  - 타임아웃: 60초
  - Sticky Session: 30초

CDN (CloudFlare):
  - 정적 파일 캐싱: 1일
  - API 캐싱: 1분 (GET만)
  - DDoS 보호: 활성화
  - SSL/TLS: Full Strict
```

---

## 7. 보안 설정

### 7.1 Firewall (iptables)

```bash
# /home/deploy/production/security/firewall.rules

# 기본 정책
iptables -P INPUT DROP
iptables -P OUTPUT ACCEPT
iptables -P FORWARD DROP

# 루프백
iptables -A INPUT -i lo -j ACCEPT

# SSH (2222) - VPN IP만
iptables -A INPUT -p tcp --dport 2222 -s [VPN_IP]/24 -j ACCEPT

# HTTPS (443) - 모두
iptables -A INPUT -p tcp --dport 443 -j ACCEPT

# HTTP (80) - HTTPS로 리다이렉트만
iptables -A INPUT -p tcp --dport 80 -j ACCEPT

# API (4000) - localhost + 로드밸런서만
iptables -A INPUT -p tcp --dport 4000 -s 127.0.0.1 -j ACCEPT
iptables -A INPUT -p tcp --dport 4000 -s [ELB_IP] -j ACCEPT

# 데이터베이스 (5432) - 내부 네트워크만
iptables -A INPUT -p tcp --dport 5432 -s 198.51.100.0/24 -j ACCEPT

# fail2ban 활성화
fail2ban-client start
```

### 7.2 SSL/TLS 설정

```nginx
# /etc/nginx/ssl.conf

ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
ssl_prefer_server_ciphers on;

ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;
ssl_session_tickets off;

ssl_stapling on;
ssl_stapling_verify on;
ssl_trusted_certificate /etc/letsencrypt/live/kleinanzeigen.co.kr/chain.pem;
```

### 7.3 보안 헤더

```nginx
# /etc/nginx/security-headers.conf

add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.kleinanzeigen.co.kr; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.kleinanzeigen.co.kr;" always;
add_header Permissions-Policy "geolocation=(), microphone=(), camera=(), payment=()" always;
```

### 7.4 DDoS 보호

```
CloudFlare 설정:
  - Challenge: 중간 (Moderate)
  - Rate Limiting: 100 req/sec (IP당)
  - WAF: OWASP Top 10 활성화
  - Bot Management: 활성화
```

---

## 8. 백업 및 재해 복구

### 8.1 자동 백업 정책

```bash
# /home/deploy/production/scripts/backup.sh

# 시간별 백업 (6시간마다)
0 */6 * * * /home/deploy/production/scripts/backup.sh

# 주간 백업 (월요일 00:00)
0 0 * * 1 /home/deploy/production/scripts/backup.sh --weekly

# 월간 백업 (1일 00:00)
0 0 1 * * /home/deploy/production/scripts/backup.sh --monthly

보관 정책:
  - 일일: 7개 (6시간마다)
  - 주간: 4개 (4주)
  - 월간: 12개 (12개월)
```

### 8.2 백업 검증

```bash
# 매일 18:00에 자동 복구 테스트
0 18 * * * /home/deploy/production/scripts/backup.sh --verify

검증 항목:
  1. 백업 파일 무결성 (SHA256)
  2. 데이터베이스 복구 가능성
  3. 복구 시간 측정
  4. 데이터 일관성 확인
```

### 8.3 재해 복구 절차

```bash
# 긴급 롤백 (평균 시간: 15분)
/home/deploy/production/scripts/disaster-recovery.sh \
  --backup-date="YYYY-MM-DD HH:00" \
  --verify \
  --notify-team

단계:
  1. 백업 검증 (자동)
  2. 데이터베이스 복구
  3. 응용 프로그램 복구
  4. 헬스 체크
  5. 자동 롤포워드
```

---

## 9. 모니터링 및 알림

### 9.1 24/7 헬스 체크

```bash
# /home/deploy/production/scripts/health-check.sh
# 매분 실행

체크 항목:
  1. API 응답 상태 (HTTP 200)
  2. 데이터베이스 응답 시간 (<100ms)
  3. Redis 응답 시간 (<10ms)
  4. 메모리 사용률 (<80%)
  5. 디스크 사용률 (<85%)
  6. 에러율 (<0.1%)
  7. 응답 시간 (p99 < 500ms)

실패 시 자동 조치:
  1. Slack 알림 (즉시)
  2. PagerDuty 호출 (critical)
  3. 자동 롤백 (치명적 오류)
```

### 9.2 모니터링 도구

```
Sentry: 에러 추적
New Relic: APM 성능
Datadog: 인프라 모니터링
CloudFlare: CDN 분석
AWS CloudWatch: 클라우드 로그
ELK Stack: 로그 집계
Prometheus: 메트릭 수집
Grafana: 대시보드
```

### 9.3 로그 관리

```
로그 레벨: warn 이상 (production)
로그 로테이션: 일일 (자정 UTC)
로그 보관: 90일 (법적 요구사항)
로그 암호화: 전송 중 및 저장 시

로그 경로:
  /home/deploy/production/logs/api.log
  /home/deploy/production/logs/api-error.log
  /home/deploy/production/logs/nginx_access.log
  /home/deploy/production/logs/nginx_error.log
  /home/deploy/production/logs/audit.log (모든 SSH 접속)
```

---

## 10. 절대 금지 사항

### 10.1 데이터베이스

```
❌ 프로덕션 데이터 로컬로 다운로드
❌ 프로덕션 데이터 공유 저장소에 복사
❌ 진짜 사용자 데이터로 테스트
❌ 데이터 직접 수정 (스크립트만 사용)
❌ 트랜잭션 없이 업데이트
```

### 10.2 환경 설정

```
❌ .env.production 수동 수정
❌ pm2.config.js 수동 수정
❌ SSL 인증서 자체 발급
❌ Nginx 설정 수동 변경
❌ 포트 4000, 443, 2222 변경
❌ 보안 키 보이는 곳에 저장
```

### 10.3 배포

```
❌ 프라이머리 서버에만 배포
❌ 배포 중 SSH 중단
❌ 다중 배포 동시 실행
❌ 배포 로그 삭제
❌ 이전 버전 파일 남김
❌ --force 플래그 사용
```

### 10.4 깃허브

```
❌ 개인 키를 리포지토리에 커밋
❌ main 브랜치 직접 푸시
❌ production 브랜치 접근
❌ 커밋 이력 변경 (amend, rebase)
❌ 승인 없이 배포
```

### 10.5 SSH 접근

```
❌ SSH 포트 변경 (2222 고정)
❌ VPN 없이 접속
❌ 공개 와이파이에서 접속
❌ 보안 키 공유
❌ SSH 접속 로그 수정
```

---

## 11. 문제 해결 및 긴급 대응

### 11.1 응답 시간 저하

```bash
# 1. 현재 상태 확인
curl https://api.kleinanzeigen.co.kr/api/health

# 2. 데이터베이스 확인
psql -h prod-db-primary.internal -U prod_readonly -c "SELECT count(*) FROM users;" kleinanzeigen_prod

# 3. 캐시 상태 확인
redis-cli -h prod-redis-primary.internal INFO

# 4. 프로세스 상태 확인
pm2 list

# 5. 메모리 사용률 확인
free -h

# 6. 디스크 사용률 확인
df -h

# 7. 네트워크 상태 확인
netstat -an | grep ESTABLISHED | wc -l
```

### 11.2 메모리 누수 감지

```bash
# PM2 메모리 모니터링
pm2 monit

# 메모리 덤프
pm2 trigger kleinanzeigen-api "heap dump"

# 분석
node --inspect-brk dist/index.js
# Chrome DevTools에서 분석
```

### 11.3 데이터베이스 연결 풀 고갈

```bash
# 활성 연결 확인
psql -h prod-db-primary.internal -U prod_readonly -c "SELECT count(*) FROM pg_stat_activity WHERE state = 'active';" kleinanzeigen_prod

# 오래된 연결 종료
psql -h prod-db-primary.internal -U postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='kleinanzeigen_prod' AND query_start < now() - interval '30 minutes';"

# PM2 재시작 (마지막 수단)
pm2 restart kleinanzeigen-api
```

### 11.4 긴급 롤백

```bash
# 자동 롤백 스크립트
/home/deploy/production/scripts/disaster-recovery.sh \
  --mode rollback \
  --to-commit [마지막_정상_커밋] \
  --immediate

# 모니터링
tail -f /home/deploy/production/logs/api-error.log

# 검증
curl https://api.kleinanzeigen.co.kr/api/health
```

---

## 12. 체크리스트

배포 전 최종 확인 (Chief DevOps만):

```
[ ] Staging에서 최소 7일 검증
[ ] 성능 벤치마크 통과 (baseline ≥ 현재)
[ ] 부하 테스트 통과 (200 req/sec)
[ ] 보안 스캔 통과 (0 critical)
[ ] 코드 리뷰 완료 (2명 이상)
[ ] GitHub main 브랜치 최신 상태
[ ] 배포 당일 모니터링 담당 배정
[ ] 긴급 연락처 확인 (on-call 준비)
[ ] 백업 최신 상태 확인
[ ] 재해 복구 테스트 완료 (이번달)
[ ] SSL 인증서 유효 (만료까지 30일 이상)
[ ] 방화벽 규칙 확인
[ ] 데이터베이스 복제 지연 < 1초
[ ] Redis 복제 지연 < 100ms
[ ] CDN 캐시 상태 확인
[ ] 알림 채널 활성 (Slack, PagerDuty)
[ ] 문서 최신 (이 파일)
```

---

## 13. 운영 정책

### 13.1 배포 윈도우

```
금요일 00:00 UTC ~ 토요일 04:00 UTC (36시간)
  - 배포 가능 시간: 금요일 02:00 ~ 04:00 UTC (2시간)
  - 모니터링: 금요일 02:00 ~ 일요일 02:00 UTC (48시간)

긴급 배포 (Critical Bug):
  - 필수: Chief DevOps, On-call Engineer, 최소 1명 추가
  - 사전 공지: 불가능
  - 롤백 준비: 필수

금지된 배포 시간:
  ❌ 월~목 (업무 일정 중)
  ❌ 토~일 (휴무일)
  ❌ 공휴일
  ❌ 자정 UTC ± 2시간 (기관 시간)
```

### 13.2 On-Call 정책

```
24/7 On-Call 로테이션:
  - Chief DevOps (primary)
  - Senior Engineer (secondary)
  - Junior Engineer (tertiary, 학습용)

대응 시간:
  - Critical: 15분 이내
  - High: 30분 이내
  - Medium: 2시간 이내
  - Low: 8시간 이내
```

---

**이 설정은 PRODUCTION 환경에 적용되며, 모든 변경은 법적 책임을 동반합니다.**  
**마지막 검토: 2026-05-27**  
**다음 검토 예정: 2026-06-27**
