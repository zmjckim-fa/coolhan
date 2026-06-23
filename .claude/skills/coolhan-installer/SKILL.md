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
  **Token Efficiency Mode (Operating Principles)**
  - Report results only: report only in installed/failed format
  - No process explanation: do not show thinking or judgment process
  - No source display: exclude code or content screenshots
  - Minimize tokens: convey only essential information concisely

compatibility: |
  - Node.js 14.0.0+
  - npm 7.0.0+
  - Windows, macOS, Linux
  - Git 2.30+
---

# CoolHan Framework Automatic Installation

This skill automatically installs CoolHan when you type "쿨한을 설치해줘" in Claude Code.

## 🚀 Installation Methods

### Method 1: Natural language input
In the Claude Code message input box:
```
쿨한을 설치해줘
```

### Method 2: Command form
```
/coolhan-installer
```

### Method 3: English
```
Install CoolHan Framework
```

---

## ⚙️ Installation Process

The following are executed automatically:

### Step 1: Check prerequisites
```bash
node --version    # 14.0.0 or higher?
npm --version     # 7.0.0 or higher?
git --version     # 2.30.0 or higher?
```

### Step 2: Install CoolHan
```bash
npx coolhan-builder
```

Or (global installation)
```bash
npm install -g coolhan-builder
coolhan-install
```

### Step 3: Environment validation
```bash
npm run env:validate
```

### Step 4: Verify installation
```bash
ls -la .claude/
npm run spec:validate
```

---

## ✅ After Installation Completes

The following are configured automatically:

- ✅ `.claude/` directory created
- ✅ Validation hooks (8) installed
- ✅ Agent definitions (5) copied
- ✅ Knowledge base (30+ documents) copied
- ✅ Git configuration (`.gitignore` created)
- ✅ npm scripts added

---

## 📚 Documents to Read After Installation

1. **README.md** - Project overview
2. **QUICK_START.md** - 5-minute quick start
3. **INSTALLATION_GUIDE.md** - Detailed installation
4. **CLAUDE.md** - Operating guide

---

## 🆘 Troubleshooting

### npm not found
```bash
# Check Node.js installation
node --version

# Reinstall npm
npm install -g npm@latest
```

### Permission error (Windows)
```
Run PowerShell as administrator and try again.
```

### Installation is slow
```
Clean the npm cache:
npm cache clean --force
```

---

## 🎯 Next Steps After Installation

```bash
# Step 1: Check environment
npm run env:validate

# Step 2: Validate specifications
npm run spec:validate

# Step 3: First commit
git add .
git commit -m "chore: Initialize CoolHan Framework"
```

---

## 💡 Tips

- **Reinstalling:** Safe to run again on a project that is already installed.
- **Other projects:** Can be installed independently in each project.
- **Team sharing:** After installation completes, share with your team via Git.

---

## 🔗 Useful Links

- GitHub: https://github.com/zmjckim-fa/coolhan
- npm: https://www.npmjs.com/package/coolhan-builder
- Documentation: README.md, QUICK_START.md
