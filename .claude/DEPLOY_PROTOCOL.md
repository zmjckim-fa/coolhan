# DEPLOY PROTOCOL

**목적:** AI가 "아마 배포되었을 겁니다"라는 추측 없이 각 단계를 검증 가능하게 기록
**적용 대상:** 프로덕션 배포 시 필수 준수
**원칙:** "200 OK 직접 본 것만 완료"

---

## 배포 전 필수 사전 점검 (DEPLOY CHECKLIST)

### 1단계: 로컬 저장소 상태 확인

```bash
git status
```

**필수 조건:**
```
On branch main
nothing to commit, working tree clean
```

**실패 시 조치:**
```bash
# Unstaged 파일 확인
git status

# 원인: 커밋 안 된 변경사항
→ 커밋 후 배포, 또는 stash

echo "[DEPLOY BLOCKED] Uncommitted changes detected"
echo "Files: $(git status -s)"
```

**보고 형식:**
```
[✓] GIT STATUS 검사
상태: clean (0개 변경사항)
브랜치: main
마지막 커밋: a1b2c3d4 (5분 전)

결론: ✅ 배포 진행 가능
```

**검증:** git status가 완전히 깨끗한가? ✓

---

### 2단계: 환경변수 일치성 검사

**검사 대상 파일:**
- `apps/api/.env` (로컬 개발용)
- `apps/web/.env.local` (로컬 개발용)
- `.env.production-patch` (배포용 마스터)

**핵심 변수 목록:**
```
KAKAO_CLIENT_ID
KAKAO_CLIENT_SECRET
STRIPE_SECRET_KEY
DATABASE_URL (또는 DB_HOST, DB_PORT, DB_USER, DB_PASS)
SMTP_USER
SMTP_PASS
DEPOSIT_ADMIN_ID
DEPOSIT_ADMIN_PASSWORD
REDIS_URL (또는 REDIS_HOST, REDIS_PORT)
JWT_SECRET
NEXT_PUBLIC_API_URL
```

**diff 비교 명령:**
```bash
# API 환경변수 비교
diff -u <(grep "=" apps/api/.env | sort) <(grep "=" .env.production-patch | sort)

# Web 환경변수 비교
diff -u <(grep "NEXT_PUBLIC_\|DATABASE\|SMTP\|STRIPE\|KAKAO" apps/web/.env.local | sort) \
         <(grep "NEXT_PUBLIC_\|DATABASE\|SMTP\|STRIPE\|KAKAO" .env.production-patch | sort)
```

**보고 형식:**
```
[✓] 환경변수 일치성 검사

apps/api/.env vs .env.production-patch:
  KAKAO_CLIENT_ID: ✓ 일치
  DATABASE_URL: ✓ 일치
  STRIPE_SECRET_KEY: ✓ 일치
  SMTP_PASS: ✓ 일치
  DEPOSIT_ADMIN_ID: ✓ 일치

apps/web/.env.local vs .env.production-patch:
  NEXT_PUBLIC_API_URL: ✓ 일치
  JWT_SECRET: ✓ 일치

결론: ✅ 모든 핵심 변수 일치
```

**불일치 발견 시:**
```
[❌] 환경변수 불일치 감지

apps/api/.env:
  DATABASE_URL=postgresql://localhost:5432/dev

.env.production-patch:
  DATABASE_URL=postgresql://prod-server:5432/prod

조치:
1. 불일치 원인 분석
2. 의도한 변경인지 확인
3. 명시적 승인 필요

→ 배포 중단, 사용자에게 보고
```

**검증:** 모든 핵심 환경변수가 일치하는가? ✓

---

### 3단계: 로컬 빌드 사전 검사

```bash
# API 타입 검사 (빌드 안 함, 타입만)
cd apps/api && npx tsc --noEmit
cd ../..

# Web 타입 검사
cd apps/web && npx tsc --noEmit
cd ../..
```

**보고 형식:**
```
[✓] 로컬 빌드 사전 검사

apps/api:
  - npx tsc --noEmit: ✓ Pass (0 errors, 0 warnings)

apps/web:
  - npx tsc --noEmit: ✓ Pass (0 errors, 0 warnings)

결론: ✅ 빌드 서버에서 성공 가능성 높음
```

**실패 시:**
```
[❌] 로컬 빌드 검사 실패

apps/api:
  src/server.ts:45: Property 'listen' does not exist on type 'App'
  
→ 에러 수정 필요
→ 배포 중단
```

**검증:** tsc --noEmit가 모두 통과하는가? ✓

---

## 배포 실행 단계

### 4단계: 배포 스크립트 실행

```bash
python3 deploy_prod.py
```

**내가 직접 모니터링해야 할 출력:**

```
[1] Connecting to production server...
    ✓ SSH connection established

[2] Pulling latest code from git...
    ✓ Fetching origin/main
    ✓ Already up to date (or X commits pulled)

[3] Installing dependencies...
    ✓ npm install completed
    ✓ Dependencies resolved

[4] Building applications...
    [4-1] apps/api
         npm run build
         ✓ Build completed
    [4-2] apps/web
         npm run build:next
         ✓ Build completed

[5] Stopping current services...
    ✓ pm2 stop kleinanzeigen-api
    ✓ pm2 stop kleinanzeigen-web

[6] Copying new builds to production...
    ✓ apps/api/dist copied
    ✓ apps/web/.next copied

[7] Starting services...
    ✓ pm2 start kleinanzeigen-api
    ✓ pm2 start kleinanzeigen-web

[8] Deployment completed at 2024-XX-XX XX:XX:XX
    Total time: X minutes Y seconds
```

**각 단계별 실패 처리:**

#### 단계 2 실패: Git pull 실패
```
[❌] Git pull failed
Error: fatal: unable to access repository

→ SSH 접속 확인
→ 서버의 git 설정 확인
→ 배포 중단, 원인 파악
```

#### 단계 4 실패: 빌드 실패
```
[❌] Build failed

apps/api:
  Error: Cannot find module 'axios'
  
→ SSH로 서버 접속
→ cd /var/app && npm install
→ npm run build
→ 에러 원인 분석 및 수정
```

#### 단계 7 실패: 서비스 시작 실패
```
[❌] Service startup failed

kleinanzeigen-api exited with code 1

→ SSH로 서버 접속
→ pm2 logs kleinanzeigen-api --lines 50
→ 에러 로그 분석
→ 환경변수 확인 (DATABASE_URL, STRIPE_KEY 등)
```

**절대 금지:**
```
❌ "아마 다음 단계가 성공할 거예요"
❌ "배포는 완료된 것 같은데 한번 확인해 보세요"
❌ 각 단계의 출력을 건너뛰고 진행
```

**검증:** 각 단계의 ✓ 성공 메시지를 직접 봤는가? ✓

---

### 5단계: 실패 시 직접 SSH 진단

배포 스크립트가 실패하면 **직접 서버 접속하여 디버깅**

```bash
ssh -i /path/to/key ubuntu@<server-ip>
```

**서버에서 확인할 사항:**

```bash
# 1. 프로세스 상태
pm2 list

# 2. 최근 로그 (50줄)
pm2 logs kleinanzeigen-api --lines 50
pm2 logs kleinanzeigen-web --lines 50

# 3. 실제 로그 파일
tail -f /var/log/kleinanzeigen-api.log
tail -f /var/log/kleinanzeigen-web.log

# 4. 포트 확인
netstat -tlnp | grep -E ":4000|:3000|:5432"

# 5. 환경변수 확인
cd /var/app && cat apps/api/.env | grep DATABASE_URL

# 6. 데이터베이스 연결 테스트
psql -U postgres -h localhost -d kleinanzeigen -c "SELECT 1"

# 7. 수동으로 API 시작
cd /var/app && npm run start:api

# 8. 수동으로 Web 시작
cd /var/app && npm run start:web
```

**진단 결과 보고 형식:**

```
[SSH 진단 결과]

pm2 list:
├─ kleinanzeigen-api: [online] (PID 1234)
├─ kleinanzeigen-web: [online] (PID 1235)

pm2 logs (최근 10줄):
[2024-XX-XX XX:XX:XX] Connected to database
[2024-XX-XX XX:XX:XX] Cache initialized
[2024-XX-XX XX:XX:XX] Server listening on 4000

포트 확인:
- 4000 (API): ✓ LISTEN
- 3000 (Web): ✓ LISTEN
- 5432 (DB): ✓ LISTEN

DB 연결:
psql> SELECT 1
result: 1 ✓

결론: 🔍 원인 찾음 → [구체적 문제 기술]
```

**검증:** SSH로 직접 진단하고 원인을 파악했는가? ✓

---

## 배포 후 검증 단계 (MUST PASS ALL 8)

### 6단계: 서버 상태 최종 확인

**SSH 접속 후 실행:**

```bash
ssh -i /path/to/key ubuntu@<server-ip>
```

#### 검사 1: PM2 상태

```bash
pm2 list
```

**필수 결과:**
```
id │ name                │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status      │ cpu      │ memory
──┼─────────────────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼─────────────┼──────────┼──────────
0  │ kleinanzeigen-api   │ default     │ 1.0.0   │ fork    │ 1234     │ 2m     │ 0    │ online ✓    │ 0.5%     │ 145.2 MB
1  │ kleinanzeigen-web   │ default     │ 1.0.0   │ fork    │ 1235     │ 2m     │ 0    │ online ✓    │ 1.2%     │ 287.5 MB
```

**보고:**
```
[✓] PM2 상태
- kleinanzeigen-api: online (PID 1234)
- kleinanzeigen-web: online (PID 1235)
```

**실패 시:**
```
[❌] PM2 상태 오류
- kleinanzeigen-api: errored ← 이유: ?
  pm2 logs kleinanzeigen-api --lines 30 로 원인 파악

→ 배포 실패
```

---

#### 검사 2: API Health Check (로컬)

```bash
curl http://127.0.0.1:4000/api/health/live
```

**필수 응답:**
```
HTTP/1.1 200 OK
Content-Type: application/json

{"status":"ok","timestamp":"2024-XX-XXTXX:XX:XXZ"}
```

**보고:**
```
[✓] API Health (로컬)
curl http://127.0.0.1:4000/api/health/live
→ HTTP 200 OK
→ {"status":"ok"}
```

**실패 시:**
```
[❌] API Health 실패
curl: (7) Failed to connect to 127.0.0.1 port 4000

원인: API 서버가 시작 안 됨
→ pm2 logs kleinanzeigen-api
→ 포트 확인: netstat -tlnp | grep 4000
→ 배포 실패
```

---

#### 검사 3: API Health Check (외부)

```bash
curl https://www.kleinanzeigen.co.kr/api/health/live
```

**필수 응답:**
```
HTTP/1.1 200 OK
```

**보고:**
```
[✓] API Health (외부)
curl https://www.kleinanzeigen.co.kr/api/health/live
→ HTTP 200 OK
```

---

#### 검사 4: Web 페이지 로드 (HTTP)

```bash
curl -I http://www.kleinanzeigen.co.kr
```

**필수 응답:**
```
HTTP/1.1 200 OK (또는 redirect 3xx)
```

**보고:**
```
[✓] Web 페이지 로드
curl https://www.kleinanzeigen.co.kr
→ HTTP 200 OK
→ 로그인 페이지 로드 완료
```

---

#### 검사 5: Web 페이지 로드 (HTTPS)

```bash
curl https://www.kleinanzeigen.co.kr
```

**필수 응답:**
```
HTTP/1.1 200 OK
<!DOCTYPE html>
```

**보고:**
```
[✓] Web 페이지 로드 (HTTPS)
curl https://www.kleinanzeigen.co.kr
→ HTTP 200 OK
→ 페이지 렌더링 정상
```

---

#### 검사 6: 데이터베이스 연결 확인

```bash
psql -U postgres -h localhost -d kleinanzeigen -c "SELECT COUNT(*) FROM users;"
```

**필수 응답:**
```
count
-------
  1234
```

**보고:**
```
[✓] 데이터베이스 연결
SELECT COUNT(*) FROM users;
→ 1234 rows (정상)
```

**실패 시:**
```
[❌] 데이터베이스 연결 실패
psql: FATAL: password authentication failed

→ DB 자격증명 확인
→ apps/api/.env의 DATABASE_URL 확인
→ 배포 실패
```

---

#### 검사 7: Kakao OAuth 키 노출 여부

웹 브라우저에서 로그인 페이지 방문:
```
https://www.kleinanzeigen.co.kr/login
```

**확인 사항:**
1. "카카오로 로그인" 버튼 표시
2. 개발자 도구 (F12) → Network 탭에서 Kakao API 호출 확인
3. 응답 중 `client_id` 가 노출되지 않는지 확인

**보고:**
```
[✓] Kakao OAuth 인증
- 로그인 페이지 로드: ✓
- "카카오 로그인" 버튼: ✓ 표시됨
- 개발자도구 Network: ✓ client_id 비노출 (환경변수 처리)
- Kakao 인증 페이지: ✓ 정상 연동
```

**실패 시:**
```
[❌] Kakao OAuth 오류
- 버튼 미표시
- Network에서 CORS 에러
- 인증 페이지 로드 안 됨

원인: KAKAO_CLIENT_ID 누락 또는 잘못된 값
→ apps/api/.env 확인
→ 배포 실패
```

---

#### 검사 8: 이메일(SMTP) 발송 가능 상태

```bash
# 서버에서 테스트 이메일 발송
cd /var/app && npx ts-node scripts/test-smtp.ts --recipient=admin@example.com
```

**필수 응답:**
```
✓ SMTP connection established
✓ Email sent successfully to admin@example.com
✓ MessageId: <1234567890@mail.kleinanzeigen.co.kr>
```

**보고:**
```
[✓] SMTP 발송 가능
npx ts-node scripts/test-smtp.ts
→ ✓ SMTP 연결 성공
→ ✓ 테스트 이메일 발송 완료
→ admin@example.com 수신 확인
```

**실패 시:**
```
[❌] SMTP 발송 실패
Error: connect ECONNREFUSED 127.0.0.1:587

→ SMTP_USER, SMTP_PASS, SMTP_HOST 확인
→ 이메일 기능 비활성화 (임시)
→ 배포는 진행 (critical 아님)
```

---

## 배포 완료 보고 양식 (필수)

모든 8개 검사를 통과한 후:

```markdown
[✅] 배포 완료 보고

시간: 2024-XX-XX XX:XX:XX
배포 대상: 프로덕션
커밋: a1b2c3d4 (feat: 로그인 에러 처리)

[검증 결과]
- [✓] PM2 상태: 2개 서비스 online
- [✓] API Health: 200 OK (로컬)
- [✓] API Health: 200 OK (외부)
- [✓] Web 페이지: 200 OK (로컬)
- [✓] Web 페이지: 200 OK (HTTPS)
- [✓] DB 연결: 정상 (1234 users)
- [✓] Kakao OAuth: 정상 작동
- [✓] SMTP: 테스트 이메일 발송 완료

[상세 정보]
배포 소요시간: 8분 34초
변경된 파일: 5개
API 빌드 크기: 12.4 MB
Web 빌드 크기: 45.2 MB

결론: ✅ 프로덕션 배포 완료
사용자 접속 가능: https://www.kleinanzeigen.co.kr
```

---

## 배포 실패 처리

### 실패 선언 조건

**다음 중 하나라도 통과 불가:**
- PM2 둘 다 online 아님
- API Health 200 아님
- DB 연결 실패
- Kakao OAuth 미작동

### 실패 보고 형식

```markdown
[❌] 배포 실패

원인: [구체적 원인 기술]

[진단 결과]
- PM2 API: errored (PID 1234 exited with code 1)
- 로그: Connection refused to database

[조취 완료]
- SSH로 서버 접속 완료
- pm2 logs 확인 완료
- DATABASE_URL 확인: postgresql://old-host:5432/old-db (오래된 값)

[다음 단계]
1. .env.production-patch 의 DATABASE_URL 업데이트
2. 환경변수 재적용
3. PM2 재시작
4. 8개 검사 다시 실행

현황: 대기 중 (사용자 승인 필요)
```

---

## 절대 금지 사항

```
❌ "배포가 완료되었을 겁니다"
❌ "한번 확인해 보세요"
❌ 7번 검사를 건너뛰고 "아마 되겠죠"
❌ 출력 로그를 보지 않고 진행
❌ 실패 후 "사용자가 알려주면 그때 수정하겠습니다"
❌ "200 OK를 못 본 것 같지만 아마 됐을 거예요"
```

---

## 체크리스트: 배포 전/중/후

### 배포 전 (Pre-Deploy)
```
[ ] git status 확인 (clean)
[ ] 환경변수 diff 비교 (일치)
[ ] tsc --noEmit 통과 (타입 에러 0)
```

### 배포 중 (During Deploy)
```
[ ] python3 deploy_prod.py 각 단계 모니터링
[ ] 실패 시 SSH로 직접 진단
[ ] 각 단계의 ✓ 성공 메시지 확인
```

### 배포 후 (Post-Deploy)
```
[ ] pm2 list 확인 (2/2 online)
[ ] curl API Health (200 OK)
[ ] curl Web (200 OK)
[ ] DB 연결 (정상)
[ ] Kakao OAuth (작동)
[ ] SMTP (이메일 발송)
[ ] 최종 보고 작성
```

---

## 키워드

**"200 OK를 직접 본 것만 완료"**

= 추측 금지, 검증 필수, 모든 단계 기록

**"아마 됐을 겁니다" 금지**

= 각 단계를 명령어로 검증하고 보고

**"사용자에게 맡기기" 금지**

= 내가 끝까지 책임지고 진행
