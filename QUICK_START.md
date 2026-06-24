# CoolHan Framework - Quick Start Guide

**Install and start using CoolHan in 5 minutes!**

---

## 🚀 Prerequisites

```
✅ Node.js 14.0.0 or higher
✅ npm 7.0.0 or higher (or yarn, pnpm)
✅ Git 2.30.0 or higher
✅ Windows, macOS, or Linux
```

**Check versions:**
```bash
node --version    # v14.0.0 or higher
npm --version     # 7.0.0 or higher
git --version     # 2.30.0 or higher
```

---

## ⚡ Step 1: Install CoolHan (1 minute)

### Method 1: Global install (recommended) 🏆

```bash
npm install -g coolhan-builder
```

Now you can use the `coolhan-install` command from anywhere.

### Method 2: Use npx (no package needed)

```bash
cd my-project
npx coolhan-builder
```

### Method 3: Local install (per project)

```bash
npm install --save-dev coolhan-builder
npm run setup
```

---

## ⚡ Step 2: Initialize CoolHan (2 minutes)

### Run the installer

```bash
coolhan-install
```

This command automatically:
- ✅ Creates the `.claude/` directory
- ✅ Installs validation hooks (8)
- ✅ Copies agent definitions (5)
- ✅ Copies the knowledge base (30+ documents)
- ✅ Configures Git (creates `.gitignore`)
- ✅ Adds npm scripts

**Example output:**
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

## ⚡ Step 3: First commit (1 minute)

```bash
# Check changes
git status

# Stage all files
git add .

# First commit
git commit -m "chore: Initialize CoolHan Framework"

# Push to remote repository (if already configured)
git push
```

---

## ⚡ Step 4: Read the docs (1 minute)

After installation, read the following files in order:

```
1️⃣ README.md
   → Full overview of the CoolHan Framework

2️⃣ CLAUDE.md  
   → Project operations guide

3️⃣ knowledge_base/00_AI_MASTER_RULES.md
   → AI execution rules (essential)

4️⃣ knowledge_base/00_DEVELOPMENT_LOCKED_MODE.md
   → Understanding development locked mode

5️⃣ INSTALLATION_GUIDE.md
   → Detailed installation and configuration guide
```

---

## ✨ Verify the installation

Confirm the installation completed correctly:

```bash
# Check directory structure
ls -la .claude/

# Check validation hooks
ls -la .claude/hooks/

# Check agents
ls -la .claude/agents/

# Check knowledge base
ls -la knowledge_base/

# Check npm scripts
npm run
```

---

## 🎯 Next steps

### Step 1: Basic setup (5 minutes)

```bash
# Validate environment
npm run env:validate

# Validate specifications
npm run spec:validate
```

### Step 2: Write project-specific documents (30 minutes)

Write project-specific spec documents in the `knowledge_base/` directory:

```
knowledge_base/
├── 01_project_overview.md
├── 02_api_endpoints.md
├── 03_database_schema.md
├── 04_status_values.md
└── 05_module_responsibilities.md
```

### Step 3: Enable automatic validation (10 minutes)

```bash
# Auto-run Git hooks
npm run setup-hooks

# Auto-validate on commit
git commit -m "feat: new feature"
# → automatically runs spec:validate
```

---

## 📚 Key commands

### Validation
```bash
npm run spec:validate    # Validate specifications
npm run spec:parse       # Parse specifications
npm run spec:analyze     # Analyze code
npm run env:validate     # Validate environment
```

### Deployment
```bash
npm run lock:status      # Check deploy lock status
npm run lock:cleanup     # Clean up deploy locks
```

### Git
```bash
git commit -m "feat: ..."        # Runs automatic validation
git push                         # Runs pre-deploy validation
```

---

## 🆘 Frequently Asked Questions

### Q: I got an error during installation
**A:** Check the following:
```bash
# Check Node.js version
node --version   # 14.0.0 or higher?

# Clean npm cache
npm cache clean --force

# Reinstall
npm install -g coolhan-builder
coolhan-install
```

### Q: Installation fails on Windows
**A:** Run PowerShell as administrator:
```powershell
# PowerShell (administrator)
npm install -g coolhan-builder
coolhan-install
```

### Q: How do I use it in an already-installed project?
**A:** 
```bash
# Method 1: Global install, then use
npm install -g coolhan-builder
coolhan-install

# Method 2: Run directly with npx
npx coolhan-builder
```

### Q: What should I do after installation?
**A:** Proceed in order:
1. `npm run env:validate` - Check environment
2. `npm run spec:validate` - Validate specifications
3. Read `knowledge_base/` documents
4. Write project-specific spec documents
5. Enable automatic validation on `git commit`

### Q: Spec validation failed
**A:** Check the logs:
```bash
# View detailed logs
npm run spec:validate -- --verbose

# View help
npm run spec:validate -- --help
```

---

## 🎓 Learning path

**Beginner (30 minutes)**
- [ ] Read README.md
- [ ] Read QUICK_START.md (this page)
- [ ] Read INSTALLATION_GUIDE.md
- [ ] Run `npm run env:validate`

**Intermediate (2 hours)**
- [ ] Read CLAUDE.md
- [ ] Read knowledge_base/00_AI_MASTER_RULES.md
- [ ] Start writing project spec documents
- [ ] Run `npm run spec:validate`

**Advanced (4 hours)**
- [ ] Study the entire knowledge_base
- [ ] Write custom validation hooks
- [ ] Define team rules
- [ ] Establish a deployment strategy

---

## 💡 Tips and tricks

### Tip 1: Regular validation
```bash
# At the start of the day
npm run env:validate
npm run spec:validate

# Before committing
npm run spec:validate
git commit -m "..."

# Before deploying
npm run lock:status
git push
```

### Tip 2: Version-control your documents
```bash
git add knowledge_base/
git commit -m "docs: Update API specifications"
```

### Tip 3: Share team rules
```bash
# Define team rules in CLAUDE.md
# Configure hooks in .claude/settings.json
# Commit message: "docs: Define team rules"
```

---

## 📞 Help

Need more help?

### Documentation
- **README.md** - Full overview
- **INSTALLATION_GUIDE.md** - Detailed installation
- **CONTRIBUTING.md** - How to contribute
- **CHANGELOG.md** - Version history

### Online
- **GitHub Issues** - https://github.com/zmjckim-fa/coolhan/issues
- **GitHub Discussions** - https://github.com/zmjckim-fa/coolhan/discussions
- **GitHub Wiki** - https://github.com/zmjckim-fa/coolhan/wiki

---

## 🩺 Verify your install

After installing, confirm the harness is complete and healthy:

```bash
npx coolhan-doctor      # or: node doctor.js
```

It checks CLAUDE.md harness pointers, the core agents, the orchestrator skill,
the knowledge-base domain modules, and your Node version — and prints a fix hint
for anything missing. Exit code `0` means healthy; `1` means problems were found.
Add `--json` for machine-readable output (useful in CI).

---

## ✅ Done!

Congratulations! 🎉 The CoolHan Framework has been installed successfully.

You can now:
- ✅ Start specification-driven development
- ✅ Prevent errors with automatic validation
- ✅ Enforce team rules
- ✅ Manage deployments perfectly

**Start perfect development with CoolHan!** 🚀

---

**Next:** Read [README.md](README.md)
