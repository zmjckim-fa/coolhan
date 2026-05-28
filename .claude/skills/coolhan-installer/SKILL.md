---
name: coolhan-installer
description: |
  **CoolHan Framework 자동 설치 스킬**
  
  사용자가 "쿨한을 설치해줘" 또는 "CoolHan 설치" 같은 자연스러운 한국어/영어로 입력하면,
  CoolHan Framework을 자동으로 설치합니다.
  
  **사용 예시:**
  - "쿨한을 설치해줘"
  - "CoolHan 설치"
  - "Install CoolHan"
  - "쿨한 설치"
  - "coolhan 설치"
  
  **설치 방식:**
  - npx를 사용한 설치 (패키지 매니저 불필요)
  - 또는 npm 글로벌 설치
  - 자동으로 모든 설정 완료
  
  **설치 후 자동 실행:**
  1. 환경 검증
  2. 설치 확인
  3. 다음 단계 안내

working-mode: |
  **Token Efficiency Mode (작동 원칙)**
  - 결과만 보고: 설치완료/실패 형식으로만 보고
  - 과정 설명 금지: 생각, 판단 과정 미표시
  - 소스 화면 미표시: 코드나 내용 스크린샷 제외
  - 토큰 최소화: 필수 정보만 간결하게 전달

compatibility: |
  - Node.js 14.0.0+
  - npm 7.0.0+
  - Windows, macOS, Linux
  - Git 2.30+
---

# CoolHan Framework 자동 설치

이 스킬은 Claude Code에서 "쿨한을 설치해줘"라고 입력하면 자동으로 CoolHan을 설치합니다.

## 🚀 설치 방법

### 방법 1: 자연스러운 입력
Claude Code의 메시지 입력창에서:
```
쿨한을 설치해줘
```

### 방법 2: 명령어 형식
```
/coolhan-installer
```

### 방법 3: 영어
```
Install CoolHan Framework
```

---

## ⚙️ 설치 프로세스

자동으로 다음을 실행합니다:

### 1단계: 필수 요구사항 확인
```bash
node --version    # 14.0.0 이상?
npm --version     # 7.0.0 이상?
git --version     # 2.30.0 이상?
```

### 2단계: CoolHan 설치
```bash
npx coolhan-builder
```

또는 (글로벌 설치)
```bash
npm install -g coolhan-builder
coolhan-install
```

### 3단계: 환경 검증
```bash
npm run env:validate
```

### 4단계: 설치 확인
```bash
ls -la .claude/
npm run spec:validate
```

---

## ✅ 설치 완료 후

자동으로 다음이 설정됩니다:

- ✅ `.claude/` 디렉토리 생성
- ✅ 검증 훅(8개) 설치
- ✅ 에이전트 정의(5개) 복사
- ✅ 지식 기반(30+개 문서) 복사
- ✅ Git 설정 (`.gitignore` 생성)
- ✅ npm scripts 추가

---

## 📚 설치 후 문서 읽기

1. **README.md** - 프로젝트 개요
2. **QUICK_START.md** - 5분 빠른 시작
3. **INSTALLATION_GUIDE.md** - 상세 설치
4. **CLAUDE.md** - 운영 가이드

---

## 🆘 문제 해결

### npm을 찾을 수 없음
```bash
# Node.js 설치 확인
node --version

# npm 재설치
npm install -g npm@latest
```

### 권한 오류 (Windows)
```
PowerShell을 관리자 권한으로 실행하고 다시 시도하세요.
```

### 설치가 느림
```
npm 캐시 정리:
npm cache clean --force
```

---

## 🎯 설치 후 다음 단계

```bash
# 1단계: 환경 확인
npm run env:validate

# 2단계: 규격 검증
npm run spec:validate

# 3단계: 첫 커밋
git add .
git commit -m "chore: Initialize CoolHan Framework"
```

---

## 💡 팁

- **여러 번 설치:** 이미 설치된 프로젝트에서 다시 실행해도 안전합니다.
- **다른 프로젝트:** 각 프로젝트에 독립적으로 설치 가능합니다.
- **팀 공유:** 설치 완료 후 Git으로 팀과 공유하세요.

---

## 🔗 유용한 링크

- GitHub: https://github.com/zmjckim-fa/coolhan
- npm: https://www.npmjs.com/package/coolhan-builder
- 문서: README.md, QUICK_START.md
