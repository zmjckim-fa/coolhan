# COMMIT PROTOCOL

**목적:** AI가 무분별하게 커밋하는 것을 기술적으로 금지
**적용 대상:** 모든 커밋 시 필수 준수
**위반 시:** 커밋 자동 거부 (pre-commit hook)

---

## 커밋하기 전 필수 체크리스트

### 1단계: 변경 내역 확인 및 요약 보고

```bash
git status
git diff --stat
git diff (중요 파일만 확인)
git log -5 --oneline (최근 5개 커밋 확인)
```

**필수 보고 형식:**
```
[COMMIT CHECK]
변경된 파일: X개
- 주요 파일: xxx.ts, yyy.js, ...
최근 커밋: abc1234 (변경 요약)
현재 브랜치: main/develop
변경 내역 요약: (1-2줄로 변경 사항 설명)
```

**검증:** 모든 파일이 의도한 변경인지 확인 ✓

---

### 2단계: 보안 파일 검사 (절대 필수)

```bash
git diff --cached --name-only | grep -E "\\.env|\\.env\\.production|secret|key|token|password"
```

**반드시 확인할 파일 목록:**
- `.env` ❌
- `.env.production` ❌
- `.env.production-patch` ❌
- `.env.local` ❌
- `config/secrets.json` ❌
- `credentials.json` ❌
- `*.key` ❌
- `*.pem` ❌
- `.private/` ❌

**발견 시 조치:**
```bash
# 1. 즉시 중단
echo "❌ SECRET FILES DETECTED IN STAGING"

# 2. 파일 제거
git reset HEAD <secret-file>
git checkout -- <secret-file>

# 3. .gitignore에 추가
echo "<secret-file>" >> .gitignore

# 4. 보고
echo "[SECURITY VIOLATION] <secret-file> was about to be committed"
```

**보고 형식:**
```
[❌ SECURITY VIOLATION]
파일: .env.production
조치: git reset HEAD .env.production
상태: Unstaged
```

**검증:** 보안 파일이 staged에 포함되지 않았는가? ✓

---

### 3단계: CLAUDE.md 불변 규칙 자가검수

CLAUDE.md에서 금지된 사항:

```markdown
❌ use client directive 추가/제거
❌ DB 포트 변경 (3306, 5432, 6379 등)
❌ 디자인 시스템 변경 (색상, 폰트, 레이아웃)
❌ Mock 데이터 추가 (테스트용 제외)
❌ Hard-coded 설정값 추가
❌ 외부 API 엔드포인트 변경
❌ 데이터베이스 스키마 구조 변경 (migration 없이)
❌ 환경변수 이름 변경
❌ 패키지 버전 업그레이드 (주요 버전)
```

**자가검수 방법:**
```bash
# 변경된 파일 분석
git diff --cached | grep -i "use client\|port\|color\|mock\|hardcoded\|ENDPOINT"

# 제외 사항 확인:
# - 정당한 이유가 있는가?
# - CLAUDE.md에서 예외를 명시했는가?
# - 다른 파일과 연계되는가?
```

**보고 형식:**
```
[CLAUDE.md 규칙 검수]
use client: ✓ 변경 없음
DB 설정: ✓ 변경 없음
디자인: ✓ 변경 없음
Mock: ✓ 추가 없음
Hard-coded: ✓ 없음
API: ✓ 변경 없음
Schema: ✓ 변경 없음
Env Var: ✓ 변경 없음
Package: ✓ 업그레이드 없음

결론: ✅ CLAUDE.md 규칙 위반 없음
```

**검증:** CLAUDE.md 불변 규칙을 모두 지켰는가? ✓

---

### 4단계: 타입/린트 검사

```bash
# API 서버 타입 검사
cd apps/api && npx tsc --noEmit

# Web 앱 타입 검사
cd apps/web && npx tsc --noEmit

# 린트 검사
npm run lint
```

**보고 형식:**
```
[TSC / LINT 검사]
apps/api:
  - tsc --noEmit: ✓ Pass (0 errors)
  - npm run lint: ✓ Pass

apps/web:
  - tsc --noEmit: ✓ Pass (0 errors)
  - npm run lint: ✓ Pass

결론: ✅ 모든 타입/린트 검사 통과
```

**실패 시:**
```
❌ TSC ERROR in apps/api:
- src/index.ts:45: Property 'name' does not exist
- src/types.ts:12: Type 'string' is not assignable

→ 에러 수정 후 다시 커밋
→ amend 금지, 새 커밋만 가능
```

**검증:** tsc 와 lint를 모두 통과했는가? ✓

---

## 커밋 메시지 작성 규칙

### 형식 (필수)

```
[TYPE]: 변경한 이유 (1줄, 한국어, 명령형)

선택사항: 상세 설명 (필요시)
```

### 타입 분류

- `feat`: 새로운 기능
- `fix`: 버그 수정
- `refactor`: 코드 리팩토링 (기능 변경 X)
- `docs`: 문서만 변경
- `test`: 테스트 추가/수정
- `ci`: CI/CD 설정
- `chore`: 패키지 버전, 빌드 설정 등

### 예시

```bash
# ✅ 좋은 예시
git commit -m "fix: 로그인 페이지에서 카카오 OAuth 콜백 에러 처리"
git commit -m "feat: 상품 페이지에 찜 기능 추가해 사용자 경험 개선"
git commit -m "refactor: 결제 API 호출 로직을 Promise 기반으로 재구성해 가독성 향상"

# ❌ 나쁜 예시
git commit -m "fixed stuff"
git commit -m "WIP"
git commit -m "수정"
git commit -m "여러 파일 변경"
```

### 변경 이유 작성 가이드

**형식: "~하기 위해", "~를 해결하기 위해"**

```
❌ "로그인 버그 고침"
✅ "로그인 실패 시 에러 메시지가 안 보이는 버그 수정해 사용자 혼란 방지"

❌ "기능 추가"
✅ "마이페이지에 주문 이력 조회 추가해 고객이 언제든 확인 가능"

❌ "코드 정리"
✅ "상품 검색 로직을 컴포넌트에서 훅으로 분리해 재사용성 향상"
```

**검증:** 커밋 메시지가 "왜"를 명확히 설명하는가? ✓

---

## 5단계: 커밋 실행 및 결과 보고

```bash
git commit -m "$(cat <<'EOF'
feat: 변경한 이유를 명확하게 작성

필요시 추가 설명
EOF
)"
```

**직후 반드시:**
```bash
git log -1 --stat
```

**보고 형식:**
```
[✓] COMMIT SUCCESS

SHA: a1b2c3d4e5f6g7h8i9j0
메시지: feat: 로그인 페이지에서 카카오 OAuth 콜백 에러 처리
파일 변경: 3개 수정, 1개 추가
- apps/web/src/pages/login.tsx (+45, -10)
- apps/web/src/lib/kakao-auth.ts (+20, -5)
- apps/api/src/routes/oauth.ts (+15, -3)

상태: 로컬 커밋 완료, 원격 미푸시
```

**검증:** git log -1로 실제 커밋을 확인했는가? ✓

---

## 실패 처리

### Amend 금지

```bash
# ❌ 절대 금지
git commit --amend
git commit --amend --no-edit
git push --force
```

**이유:** amend는 히스토리를 조작하고 감사 추적을 어렵게 함

### 새 커밋으로 수정

```bash
# ✅ 올바른 방법
git add <fixed-file>
git commit -m "fix: 이전 커밋의 타입 에러 수정"

# 또는 전체 되돌리기
git revert <commit-sha>
git commit -m "revert: <커밋 요약> 되돌림"
```

---

## Pre-commit Hook 자동 검사

이 체크리스트는 `.claude/hooks/pre-commit.js`에서 **자동으로 검사**됩니다:

```javascript
✓ .env 파일 감지
✓ 보안 패턴 감지 (api_key, secret, token, password)
✓ 커밋 메시지 최소 길이 (20자)
✓ Status Value Registry 검증
✓ Module API 호출 권한 검증
✓ Locked Mode 규칙 검증
```

**Hook이 차단하면:**
```
❌ COMMIT BLOCKED BY PRE-COMMIT HOOK
[CREDENTIALS_DETECTED] .env.production
[COMMIT_MESSAGE_TOO_SHORT] 5 chars (need 20)

Fix these issues before committing:
- Remove .env files
- Update commit message
- Verify specification compliance
```

---

## 체크리스트 최종 확인

```
[ ] 1단계: git status/diff/log 확인 및 요약 보고
[ ] 2단계: .env 등 보안 파일 없음 확인
[ ] 3단계: CLAUDE.md 규칙 위반 없음 확인
[ ] 4단계: tsc/lint 모두 통과
[ ] 5단계: 커밋 메시지 "왜" 중심으로 작성
[ ] 6단계: git log -1 으로 결과 확인

모두 완료: ✅ 커밋 가능
하나라도 실패: ❌ 수정 후 새 커밋
```

---

## 절대 금지 사항

```
❌ git commit --no-verify (hook 건너뛰기)
❌ git commit --amend (히스토리 변경)
❌ git push --force (원격 강제 푸시)
❌ "대충 맞을 것 같아요" (검증 없이)
❌ "일단 커밋했으니 이후 수정하겠습니다" (불완전 커밋)
❌ .env 파일 커밋 후 "아, 실수했네요" (보안 위반)
```

이 중 하나라도 위반하면: **커밋 거부, 작업 중단, 보고**
