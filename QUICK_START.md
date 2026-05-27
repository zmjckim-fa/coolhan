# CoolHan Framework - 빠른 시작 가이드

**5분 안에 CoolHan을 설치하고 시작하세요!**

---

## 🚀 시작 전 필수 요구사항

```
✅ Node.js 14.0.0 이상
✅ npm 7.0.0 이상 (또는 yarn, pnpm)
✅ Git 2.30.0 이상
✅ Windows, macOS, 또는 Linux
```

**버전 확인:**
```bash
node --version    # v14.0.0 이상
npm --version     # 7.0.0 이상
git --version     # 2.30.0 이상
```

---

## ⚡ 1단계: CoolHan 설치 (1분)

### 방법 1: 전역 설치 (권장) 🏆

```bash
npm install -g coolhan-builder
```

이제 어디서든 `coolhan-install` 명령을 사용할 수 있습니다.

### 방법 2: npx 사용 (패키지 필요 없음)

```bash
cd my-project
npx coolhan-builder
```

### 방법 3: 로컬 설치 (프로젝트별)

```bash
npm install --save-dev coolhan-builder
npm run setup
```

---

## ⚡ 2단계: CoolHan 초기화 (2분)

### 설치 실행

```bash
coolhan-install
```

이 명령이 자동으로:
- ✅ `.claude/` 디렉토리 생성
- ✅ 검증 훅(8개) 설치
- ✅ 에이전트 정의(5개) 복사
- ✅ 지식 기반(30+개 문서) 복사
- ✅ Git 설정 (`.gitignore` 생성)
- ✅ npm scripts 추가

**출력 예시:**
```
🚀 CoolHan Framework Installer

✅ Directory created: .claude
✅ Copied: install.js
✅ Copied: CLAUDE.md
...
✨ CoolHan Framework Installation Complete!

📂 Installed items:
  ✅ .claude/ - Claude Code settings
  ✅ .claude/hooks/ - Validation hook scripts (8)
  ✅ .claude/agents/ - Agent definitions (5)
  ✅ knowledge_base/ - Core documents and modules
```

---

## ⚡ 3단계: 첫 커밋 (1분)

```bash
# 변경 사항 확인
git status

# 모든 파일 스테이징
git add .

# 첫 번째 커밋
git commit -m "chore: Initialize CoolHan Framework"

# 리모트 저장소에 푸시 (이미 설정된 경우)
git push
```

---

## ⚡ 4단계: 문서 읽기 (1분)

설치 후 다음 파일들을 순서대로 읽어보세요:

```
1️⃣ README.md
   → CoolHan Framework의 전체 개요

2️⃣ CLAUDE.md  
   → 프로젝트 운영 가이드

3️⃣ knowledge_base/00_AI_MASTER_RULES.md
   → AI 실행 규칙 (필수)

4️⃣ knowledge_base/00_DEVELOPMENT_LOCKED_MODE.md
   → 개발 락 모드 이해

5️⃣ INSTALLATION_GUIDE.md
   → 상세 설치 및 설정 가이드
```

---

## ✨ 설치 확인

설치가 정상적으로 완료되었는지 확인하세요:

```bash
# 디렉토리 구조 확인
ls -la .claude/

# 검증 훅 확인
ls -la .claude/hooks/

# 에이전트 확인
ls -la .claude/agents/

# 지식 기반 확인
ls -la knowledge_base/

# npm scripts 확인
npm run
```

---

## 🎯 다음 할 일

### 1단계: 기본 설정 (5분)

```bash
# 환경 검증
npm run env:validate

# 스펙 검증
npm run spec:validate
```

### 2단계: 프로젝트별 문서 작성 (30분)

`knowledge_base/` 디렉토리에 프로젝트별 스펙 문서 작성:

```
knowledge_base/
├── 01_project_overview.md
├── 02_api_endpoints.md
├── 03_database_schema.md
├── 04_status_values.md
└── 05_module_responsibilities.md
```

### 3단계: 자동 검증 활성화 (10분)

```bash
# Git hooks 자동 실행
npm run setup-hooks

# 커밋 시 자동 검증
git commit -m "feat: new feature"
# → 자동으로 spec:validate 실행
```

---

## 📚 주요 명령어

### 검증 관련
```bash
npm run spec:validate    # 규격 검증
npm run spec:parse       # 규격 파싱
npm run spec:analyze     # 코드 분석
npm run env:validate     # 환경 검증
```

### 배포 관련
```bash
npm run lock:status      # 배포 락 상태 확인
npm run lock:cleanup     # 배포 락 정리
```

### Git 관련
```bash
git commit -m "feat: ..."        # 자동 검증 실행
git push                         # 배포 전 검증 실행
```

---

## 🆘 자주 묻는 질문

### Q: 설치 중 오류가 발생했어요
**A:** 다음을 확인하세요:
```bash
# Node.js 버전 확인
node --version   # 14.0.0 이상?

# npm 캐시 정리
npm cache clean --force

# 다시 설치
npm install -g coolhan-builder
coolhan-install
```

### Q: Windows에서 설치가 안 되어요
**A:** PowerShell을 관리자 권한으로 실행하세요:
```powershell
# PowerShell (관리자 권한)
npm install -g coolhan-builder
coolhan-install
```

### Q: 이미 설치된 프로젝트에서 사용하려면?
**A:** 
```bash
# 방법 1: 글로벌 설치 후 사용
npm install -g coolhan-builder
coolhan-install

# 방법 2: npx로 바로 실행
npx coolhan-builder
```

### Q: 설치 후 무엇을 해야 하나요?
**A:** 순서대로 진행하세요:
1. `npm run env:validate` - 환경 확인
2. `npm run spec:validate` - 규격 검증
3. `knowledge_base/` 문서 읽기
4. 프로젝트별 스펙 문서 작성
5. `git commit` 시 자동 검증 활성화

### Q: 스펙 검증이 실패했어요
**A:** 로그를 확인하세요:
```bash
# 상세 로그 확인
npm run spec:validate -- --verbose

# 도움말 보기
npm run spec:validate -- --help
```

---

## 🎓 학습 경로

**초급 (30분)**
- [ ] README.md 읽기
- [ ] QUICK_START.md 읽기 (현재 페이지)
- [ ] INSTALLATION_GUIDE.md 읽기
- [ ] `npm run env:validate` 실행

**중급 (2시간)**
- [ ] CLAUDE.md 읽기
- [ ] knowledge_base/00_AI_MASTER_RULES.md 읽기
- [ ] 프로젝트 스펙 문서 작성 시작
- [ ] `npm run spec:validate` 실행

**고급 (4시간)**
- [ ] 전체 knowledge_base 문서 학습
- [ ] 커스텀 검증 훅 작성
- [ ] 팀 규칙 정의
- [ ] 배포 전략 수립

---

## 💡 팁과 요령

### 팁 1: 정기적인 검증
```bash
# 하루 시작 시
npm run env:validate
npm run spec:validate

# 커밋 전
npm run spec:validate
git commit -m "..."

# 배포 전
npm run lock:status
git push
```

### 팁 2: 문서를 버전 관리하세요
```bash
git add knowledge_base/
git commit -m "docs: Update API specifications"
```

### 팁 3: 팀 규칙 공유
```bash
# CLAUDE.md에서 팀 규칙 정의
# .claude/settings.json에서 훅 설정
# 커밋 메시지: "docs: Define team rules"
```

---

## 📞 도움말

더 많은 도움말이 필요하신가요?

### 문서
- **README.md** - 전체 개요
- **INSTALLATION_GUIDE.md** - 상세 설치
- **CONTRIBUTING.md** - 기여 방법
- **CHANGELOG.md** - 변경 이력

### 온라인
- **GitHub Issues** - https://github.com/zmjckim-fa/coolhan/issues
- **GitHub Discussions** - https://github.com/zmjckim-fa/coolhan/discussions
- **GitHub Wiki** - https://github.com/zmjckim-fa/coolhan/wiki

---

## ✅ 완료!

축하합니다! 🎉 CoolHan Framework가 성공적으로 설치되었습니다.

이제 다음을 할 수 있습니다:
- ✅ 규격 기반 개발 시작
- ✅ 자동 검증으로 오류 방지
- ✅ 팀 규칙 강제
- ✅ 완벽한 배포 관리

**CoolHan과 함께 완벽한 개발을 시작하세요!** 🚀

---

**다음:** [README.md](README.md) 읽기
