# Installing CoolHan in Claude Code

**A complete guide to installing CoolHan using only text input**

---

## 🎯 The 3 Easiest Methods

### ✨ **Method 1: Natural Korean input** (recommended)

Type one of the following into the Claude Code message box:

```
쿨한을 설치해줘
```

or

```
CoolHan 설치
```

or

```
쿨한 설치
```

Claude then automatically does the following:
1. ✅ Checks the npm installation
2. ✅ Downloads CoolHan
3. ✅ Auto-configures
4. ✅ Provides installation-complete guidance

---

### 🎮 **Method 2: Slash command** (fastest)

Type `/` in Claude Code to bring up the skill list:

```
/coolhan-installer
```

Select it and CoolHan is installed automatically.

---

### 💻 **Method 3: Bash command** (manual)

Type directly in Claude Code's Bash terminal:

```bash
npx coolhan-builder
```

---

## 📋 **Steps for Each Method**

### Method 1: Natural input

```
User input: "쿨한을 설치해줘"
              ↓
Claude automatically:
  1. Checks npm --version
  2. Runs npx coolhan-builder
  3. Provides installation-complete guidance
  4. Presents next steps
```

**Result:**
```
✅ CoolHan Framework v1.0.0 installed
✅ .claude/ directory created
✅ 30+ documents copied
✅ npm scripts added

Next steps:
1. npm run env:validate
2. npm run spec:validate
3. git add . && git commit -m "..."
```

---

### Method 2: Slash command

```
Input: /coolhan-installer
      ↓
Select from the menu:
  "CoolHan Framework automatic install"
      ↓
Installation starts automatically
```

---

### Method 3: Bash command

```bash
# In Claude Code's Bash terminal:
npx coolhan-builder

# Or global install:
npm install -g coolhan-builder
coolhan-install
```

---

## 🎓 **Real Usage Examples**

### Example 1: Complete beginner

```
User: "쿨한을 설치해줘"

Claude: "I'll install the CoolHan Framework.

Checking prerequisites...
✅ Node.js v16.0.0
✅ npm v8.0.0
✅ Git v2.30.0

Installing CoolHan...
✅ Download complete
✅ File copy complete
✅ Git configuration complete

✨ Installation complete!

Installed items:
- .claude/ directory
- 8 validation hooks
- 5 agents
- 30+ knowledge base documents
- npm scripts

Next steps:
1. npm run env:validate (check environment)
2. npm run spec:validate (validate specifications)
3. git commit (first commit)

Documentation:
- Read README.md
- Read QUICK_START.md
- Read INSTALLATION_GUIDE.md"
```

### Example 2: Quick install

```
User: "/coolhan-installer"
       ↓
Skill runs
       ↓
Claude: "CoolHan has been installed.
        What's next? npm run env:validate"
```

### Example 3: Through project initialization

```
User: "쿨한을 설치하고 Git 초기화까지 해줘"

Claude:
1. ✅ Install CoolHan
2. ✅ npm run env:validate
3. ✅ git init
4. ✅ git add .
5. ✅ git commit -m "Initialize CoolHan Framework"

Done! You can now start developing right away."
```

---

## 🔄 **Validation Run Automatically After Installation**

After installation, Claude automatically runs the following:

```bash
# Step 1: Check environment
npm run env:validate
# → Check Node.js, npm, Git versions

# Step 2: Validate specifications
npm run spec:validate
# → Check CoolHan specification validity

# Step 3: Completion message
echo "✅ CoolHan Framework installation complete!"
echo "📚 Read README.md"
echo "🚀 Validate with npm run spec:validate"
```

---

## 🎯 **All the Input Variations a User Can Type**

Input patterns Claude recognizes:

### Korean
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

### Skill commands
```
- /coolhan-installer
- /install-coolhan
- /setup-coolhan
```

### Bash commands
```bash
npx coolhan-builder
npm install -g coolhan-builder && coolhan-install
npm run setup
```

---

## ✅ **Verify the Installation**

After installation, you can verify with the following:

```bash
# Check directory
ls -la .claude/

# Result:
# ✅ .claude/hooks/        (8 validation hooks)
# ✅ .claude/agents/       (5 agents)
# ✅ .claude/skills/       (skill definitions)
# ✅ .claude/settings.json (settings)

# Check documents
ls -la knowledge_base/

# Result:
# ✅ knowledge_base/00_AI_MASTER_RULES.md
# ✅ knowledge_base/01_member_system.md
# ✅ ... (30+ documents)
```

---

## 🚀 **First Steps After Installation**

```bash
# Step 1: Validate environment
npm run env:validate

# Step 2: Validate specifications
npm run spec:validate

# Step 3: First commit
git add .
git commit -m "chore: Initialize CoolHan Framework"

# Step 4: Read documentation
# Open README.md
# Read QUICK_START.md
```

---

## 💬 **Example Conversations**

### Beginner user
```
User: "쿨한 설치"
Claude: "I'll install CoolHan."
        [installation proceeds]
        "✅ Done! Next, run npm run env:validate."
```

### Intermediate user
```
User: "쿨한을 설치하고 환경 검증까지 해줘"
Claude: "1️⃣ Installing CoolHan..."
        [installation]
        "2️⃣ Validating environment..."
        [validation]
        "✅ Done! Spec validation? npm run spec:validate"
```

### Advanced user
```
User: "쿨한 설치 후 Git 초기화, 첫 커밋까지"
Claude: "✅ Installation complete
        ✅ Git init complete
        ✅ git add . complete
        ✅ First commit complete
        
        Ready! Start developing."
```

---

## 📞 **Troubleshooting**

### When installation fails

```
Claude: "Node.js is required. Install Node.js 14.0.0 or higher.
        Download from https://nodejs.org/."
```

### Permission error (Windows)

```
Claude: "Run PowerShell as administrator and try again."
```

### npm error

```
Claude: "I'll clean the npm cache and try again.
        npm cache clean --force"
```

---

## 🎁 **Special Features**

### Auto-configuration
- ✅ Automatically generates Git .gitignore
- ✅ Automatically adds npm scripts
- ✅ Automatically creates directory structure
- ✅ Automatically copies the knowledge base

### Auto-validation
- ✅ Checks Node.js version
- ✅ Checks npm version
- ✅ Checks Git installation
- ✅ Checks permissions

### Auto-guidance
- ✅ Installation-complete message
- ✅ Next-step suggestions
- ✅ Documentation links
- ✅ Troubleshooting tips

---

## 🎯 **Summary**

| Method | Input | Speed | Ease |
|------|------|---------|--------|
| Natural input | "쿨한 설치" | Medium | ⭐⭐⭐⭐⭐ |
| Slash command | `/coolhan-installer` | Fast | ⭐⭐⭐⭐⭐ |
| Bash command | `npx coolhan-builder` | Medium | ⭐⭐⭐ |

---

**Conclusion:** Type "쿨한을 설치해줘" into the Claude Code message box, and Claude automatically handles the entire installation! 🚀
