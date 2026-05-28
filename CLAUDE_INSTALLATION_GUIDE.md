# Claude Code에서 CoolHan 설치하기

**사용자가 텍스트 입력만으로 CoolHan을 설치하는 완전한 가이드**

---

## 🎯 가장 쉬운 방법 3가지

### ✨ **방법 1: 자연스러운 한국어 입력** (추천)

Claude Code의 메시지 입력창에 다음 중 하나를 입력:

```
쿨한을 설치해줘
```

또는

```
CoolHan 설치
```

또는

```
쿨한 설치
```

그러면 Claude가 자동으로 다음을 실행합니다:
1. ✅ npm 설치 확인
2. ✅ CoolHan 다운로드
3. ✅ 자동 설정
4. ✅ 설치 완료 안내

---

### 🎮 **방법 2: 슬래시 명령어** (가장 빠름)

Claude Code에서 `/` 기호를 입력하면 스킬 목록이 나옵니다:

```
/coolhan-installer
```

선택하면 CoolHan이 자동으로 설치됩니다.

---

### 💻 **방법 3: Bash 명령어** (수동)

Claude Code의 Bash 터미널에서 직접 입력:

```bash
npx coolhan-builder
```

---

## 📋 **각 방법별 단계**

### 방법 1: 자연스러운 입력

```
사용자 입력: "쿨한을 설치해줘"
              ↓
Claude가 자동으로:
  1. npm --version 확인
  2. npx coolhan-builder 실행
  3. 설치 완료 안내
  4. 다음 단계 제시
```

**결과:**
```
✅ CoolHan Framework v1.0.0 설치됨
✅ .claude/ 디렉토리 생성됨
✅ 30+개 문서 복사됨
✅ npm scripts 추가됨

다음 단계:
1. npm run env:validate
2. npm run spec:validate
3. git add . && git commit -m "..."
```

---

### 방법 2: 슬래시 명령어

```
입력: /coolhan-installer
      ↓
메뉴에서 선택:
  "CoolHan Framework 자동 설치"
      ↓
자동으로 설치 시작
```

---

### 방법 3: Bash 명령어

```bash
# Claude Code의 Bash 터미널에서:
npx coolhan-builder

# 또는 글로벌 설치:
npm install -g coolhan-builder
coolhan-install
```

---

## 🎓 **실제 사용 예시**

### 예시 1: 완전한 초급자

```
사용자: "쿨한을 설치해줘"

Claude: "CoolHan Framework를 설치하겠습니다.

필수 확인 중...
✅ Node.js v16.0.0
✅ npm v8.0.0
✅ Git v2.30.0

CoolHan 설치 중...
✅ 다운로드 완료
✅ 파일 복사 완료
✅ Git 설정 완료

✨ 설치 완료!

설치된 항목:
- .claude/ 디렉토리
- 8개의 검증 훅
- 5개의 에이전트
- 30+개의 지식 기반 문서
- npm scripts

다음 단계:
1. npm run env:validate (환경 확인)
2. npm run spec:validate (규격 검증)
3. git commit (첫 커밋)

문서:
- README.md 읽기
- QUICK_START.md 읽기
- INSTALLATION_GUIDE.md 읽기"
```

### 예시 2: 빠른 설치

```
사용자: "/coolhan-installer"
       ↓
스킬 실행
       ↓
Claude: "CoolHan이 설치되었습니다.
        다음은? npm run env:validate"
```

### 예시 3: 프로젝트 초기화까지

```
사용자: "쿨한을 설치하고 Git 초기화까지 해줘"

Claude:
1. ✅ CoolHan 설치
2. ✅ npm run env:validate
3. ✅ git init
4. ✅ git add .
5. ✅ git commit -m "Initialize CoolHan Framework"

완료! 이제 바로 개발을 시작할 수 있습니다."
```

---

## 🔄 **설치 후 자동 실행되는 검증**

설치 후 Claude가 자동으로 다음을 실행합니다:

```bash
# 1단계: 환경 확인
npm run env:validate
# → Node.js, npm, Git 버전 확인

# 2단계: 규격 검증
npm run spec:validate
# → CoolHan 규격 유효성 확인

# 3단계: 완료 메시지
echo "✅ CoolHan Framework 설치 완료!"
echo "📚 README.md를 읽어보세요"
echo "🚀 npm run spec:validate로 검증하세요"
```

---

## 🎯 **사용자가 입력할 수 있는 모든 변형**

Claude가 인식하는 입력 패턴:

### 한국어
```
- "쿨한을 설치해줘"
- "CoolHan 설치"
- "쿨한 설치"
- "쿨한 프레임워크 설치"
- "CoolHan Framework 설치"
- "쿨한을 설치해"
- "쿨한 설치해줘"
```

### English
```
- "Install CoolHan"
- "Install CoolHan Framework"
- "Setup CoolHan"
- "Initialize CoolHan"
- "CoolHan setup"
```

### 스킬 명령어
```
- /coolhan-installer
- /install-coolhan
- /setup-coolhan
```

### Bash 명령어
```bash
npx coolhan-builder
npm install -g coolhan-builder && coolhan-install
npm run setup
```

---

## ✅ **설치 확인**

설치 후 다음으로 확인할 수 있습니다:

```bash
# 디렉토리 확인
ls -la .claude/

# 결과:
# ✅ .claude/hooks/        (8개 검증 훅)
# ✅ .claude/agents/       (5개 에이전트)
# ✅ .claude/skills/       (스킬 정의)
# ✅ .claude/settings.json (설정)

# 문서 확인
ls -la knowledge_base/

# 결과:
# ✅ knowledge_base/00_AI_MASTER_RULES.md
# ✅ knowledge_base/01_member_system.md
# ✅ ... (30+개 문서)
```

---

## 🚀 **설치 후 첫 단계**

```bash
# 1단계: 환경 검증
npm run env:validate

# 2단계: 규격 검증
npm run spec:validate

# 3단계: 첫 커밋
git add .
git commit -m "chore: Initialize CoolHan Framework"

# 4단계: 문서 읽기
# README.md 열기
# QUICK_START.md 읽기
```

---

## 💬 **대화의 예**

### 초급 사용자
```
User: "쿨한 설치"
Claude: "CoolHan을 설치하겠습니다."
        [설치 진행]
        "✅ 완료! 다음은 npm run env:validate을 실행하세요."
```

### 중급 사용자
```
User: "쿨한을 설치하고 환경 검증까지 해줘"
Claude: "1️⃣ CoolHan 설치 중..."
        [설치]
        "2️⃣ 환경 검증 중..."
        [검증]
        "✅ 완료! 스펙 검증은? npm run spec:validate"
```

### 고급 사용자
```
User: "쿨한 설치 후 Git 초기화, 첫 커밋까지"
Claude: "✅ 설치 완료
        ✅ Git init 완료
        ✅ git add . 완료
        ✅ 첫 커밋 완료
        
        준비됨! 개발을 시작하세요."
```

---

## 📞 **문제 해결**

### 설치가 안 되는 경우

```
Claude: "Node.js가 필요합니다. Node.js 14.0.0 이상을 설치하세요.
        https://nodejs.org/에서 다운로드하세요."
```

### 권한 오류 (Windows)

```
Claude: "PowerShell을 관리자 권한으로 실행하고 다시 시도하세요."
```

### npm 오류

```
Claude: "npm 캐시를 정리하고 다시 시도합니다.
        npm cache clean --force"
```

---

## 🎁 **특별 기능**

### 자동 설정
- ✅ Git .gitignore 자동 생성
- ✅ npm scripts 자동 추가
- ✅ 디렉토리 구조 자동 생성
- ✅ 지식 기반 자동 복사

### 자동 검증
- ✅ Node.js 버전 확인
- ✅ npm 버전 확인
- ✅ Git 설치 확인
- ✅ 권한 확인

### 자동 안내
- ✅ 설치 완료 메시지
- ✅ 다음 단계 제시
- ✅ 문서 링크 제공
- ✅ 문제 해결 팁

---

## 🎯 **요약**

| 방법 | 입력 | 실행 속도 | 쉬운 정도 |
|------|------|---------|--------|
| 자연스러운 입력 | "쿨한 설치" | 보통 | ⭐⭐⭐⭐⭐ |
| 슬래시 명령어 | `/coolhan-installer` | 빠름 | ⭐⭐⭐⭐⭐ |
| Bash 명령어 | `npx coolhan-builder` | 보통 | ⭐⭐⭐ |

---

**결론:** Claude Code의 메시지 입력창에 "쿨한을 설치해줘"라고 입력하면, Claude가 자동으로 모든 설치를 진행합니다! 🚀
