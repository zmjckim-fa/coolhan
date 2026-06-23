# CoolHan Builder - Installation and Usage Guide

**Version:** 1.0.0  
**Language:** English  
**Last Updated:** 2026-05-27  

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [System Requirements](#system-requirements)
3. [Installation](#installation)
4. [Starting a Project](#starting-a-project)
5. [Documentation Structure](#documentation-structure)
6. [Usage](#usage)
7. [Troubleshooting](#troubleshooting)
8. [Support and Feedback](#support-and-feedback)

---

## Overview

**CoolHan Builder** is an AI-based engineering project management system.

### Key Features

- ✅ **Base Knowledge Core system**: 10 industry-standard definitions (shopping_mall, marketplace, purchase_agency, logistics, etc.)
- ✅ **Domain module system**: 10 reusable feature modules (member, shopping, payment, shipping, etc.)
- ✅ **AI Development Locked Mode**: Specification-based AI execution (command-based, not creative)
- ✅ **Architecture conflict resolution**: Fully resolved data, API, and status value conflicts between modules
- ✅ **Master references**: Status value registry, module responsibility matrix, rule engine

### Application Scenarios

1. **E-Commerce platform**: shopping_mall_core + marketplace_core combined
2. **Overseas purchase agency**: purchase_agency_core + logistics_core
3. **Marketplace**: marketplace_core + seller_onboarding
4. **Delivery optimization**: logistics_core standalone
5. **Member management**: member_system_core standalone

---

## System Requirements

### Minimum Requirements

- **OS**: Windows 10+, macOS 10.15+, Ubuntu 18.04+
- **Git**: 2.25 or later
- **Text editor**: VS Code, Sublime Text, etc. (recommended: VS Code)
- **Markdown viewer**: Typora, Obsidian, etc. (optional)

### Development Environment (when implementing a project)

- **Node.js**: 16.x or later (JavaScript/TypeScript projects)
- **Python**: 3.8+ (Python projects)
- **Docker**: Optional (for deployment)

### Browsers (for viewing documentation)

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

---

## Installation

### Step 1: Clone from GitHub

```bash
# Clone the repository
git clone https://github.com/zmjckim-fa/coolhan.git
cd coolhan

# Or use SSH instead of HTTPS
git clone git@github.com:zmjckim-fa/coolhan.git
cd coolhan
```

### Step 2: Verify the Directory Structure

After installation, verify that the following structure exists:

```
coolhan/
├── README.md                          # Project overview
├── INSTALLATION_GUIDE.md              # This file
├── knowledge_base/
│   ├── 00_AI_MASTER_RULES.md          # AI execution rules
│   ├── 00_BASE_KNOWLEDGE_LOAD.md      # Base knowledge load process
│   ├── 00_DEVELOPMENT_LOCKED_MODE.md  # Development mode rules
│   ├── 00_ARCHITECTURE_CONFLICT_RESOLUTION.md
│   ├── 00_STATUS_VALUE_REGISTRY.md
│   ├── 00_MODULE_RESPONSIBILITY_MATRIX.md
│   ├── 00_SPECIFICATION_PARAMETERIZATION_SYSTEM.md
│   ├── 00_DESIGN_PARAMETERIZATION_SYSTEM.md
│   ├── 00_CORE_PRINCIPLES_SYSTEM.md
│   ├── 00_KNOWLEDGE_BASE_EXTENSIBILITY.md
│   │
│   ├── core/                          # Base Knowledge Cores
│   │   ├── shopping_mall_core.md
│   │   ├── marketplace_core.md
│   │   ├── purchase_agency_core.md
│   │   └── (logistics_core, member_system_core, etc.)
│   │
│   └── modules/                       # Domain module descriptions (optional)
│       ├── 01_member_system.md
│       ├── 02_shopping_mall.md
│       └── (03-10 modules)
│
└── examples/                          # Example projects (community-provided)
    └── (user projects to be added)
```

### Step 3: (Optional) Install VS Code Extensions

To view the documentation more easily, we recommend installing the following extensions:

```bash
# Markdown Preview Enhanced
code --install-extension shd101wyy.markdown-preview-enhanced

# Markdown All in One
code --install-extension yzhang.markdown-all-in-one

# Git Graph
code --install-extension mhutchie.git-graph
```

Installing in VS Code:
1. Open VS Code
2. Extensions (Ctrl+Shift+X)
3. Search for the extension names above and install them

### Step 4: Run a Local Documentation Server (Optional)

For a better documentation viewing experience, you can run a local HTTP server:

```bash
# Using Python 3
python -m http.server 8000

# Or Python 2
python -m SimpleHTTPServer 8000

# Or after installing the Node.js http-server
npm install -g http-server
http-server -p 8000
```

Then open `http://localhost:8000` in your browser

---

## Starting a Project

### New Project Start Checklist

When starting a new project, follow this sequence:

```
┌─────────────────────────────────────────────┐
│  Step 1: Select Base Knowledge Core         │
│  Which system type? (shopping_mall, etc.)   │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  Step 2: Define technical parameters        │
│  - Language/framework                       │
│  - Database                                 │
│  - Deployment environment                   │
│  - Runtime settings                         │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  Step 3: Write central source-of-truth docs │
│  - Requirements specification               │
│  - ERD (Entity Relationship Diagram)        │
│  - API specification                        │
│  - Status value definitions                 │
│  - Prohibitions list                        │
│  - Permission settings                      │
│  - File structure                           │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  Step 4: Load rules                         │
│  - 00_AI_MASTER_RULES.md                    │
│  - 00_DEVELOPMENT_LOCKED_MODE.md            │
│  - Module responsibility matrix             │
│  - Status value registry                    │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  Step 5: Start development                  │
│  (rule-based execution mode)                │
└─────────────────────────────────────────────┘
```

---

## Documentation Structure

### Core Documents (Required)

| File | Purpose | When to Read |
|------|------|---------|
| `00_AI_MASTER_RULES.md` | 11 AI execution rules | Before starting development |
| `00_BASE_KNOWLEDGE_LOAD.md` | Base knowledge load process | When initializing a project |
| `00_DEVELOPMENT_LOCKED_MODE.md` | Rule-based development mode | Before starting each task |
| `00_ARCHITECTURE_CONFLICT_RESOLUTION.md` | Resolving conflicts between modules | For multi-module projects |
| `00_STATUS_VALUE_REGISTRY.md` | Unified status value definitions | When designing API/DB |
| `00_MODULE_RESPONSIBILITY_MATRIX.md` | Module responsibility matrix | When setting permissions |

### Base Knowledge Core (Optional)

Load only the Core needed for each project type:

| Core | Usage Scenario |
|------|-------------|
| `shopping_mall_core.md` | B2C e-commerce |
| `marketplace_core.md` | Multi-seller marketplace |
| `purchase_agency_core.md` | Overseas purchase agency |
| `logistics_core.md` | Delivery management (high volume) |
| `member_system_core.md` | Member system |
| `admin_system_core.md` | Admin features |

### Domain Module Descriptions (Reference)

Feature descriptions of the 10 modules:
- 01_member_system: Sign-up/login/profile
- 02_shopping_mall: Product catalog, cart, purchase
- ... (03-10)

---

## Usage

### Usage Pattern 1: Reading Documentation (Browser)

```bash
# 1. Clone this repository
git clone https://github.com/zmjckim-fa/coolhan.git
cd coolhan

# 2. Open the knowledge_base directory
cd knowledge_base

# 3. Check the markdown files
ls -la *.md           # Core documents
ls -la core/          # Base Knowledge Core
```

### Usage Pattern 2: Initializing a New Project

```bash
# 1. Create a project directory
mkdir my_ecommerce_project
cd my_ecommerce_project

# 2. Copy the required documents
cp -r ../coolhan/knowledge_base .

# 3. Begin writing central source-of-truth documents
# In the knowledge_base folder:
#   - Write 01_PROJECT_OVERVIEW.md
#   - Write 02_REQUIREMENTS.md
#   - Write 03_ERD.md
#   - Write 04_API_SPECIFICATION.md
#   - Write 05_DATABASE_SCHEMA.md
#   - Write 06_STATUS_DEFINITIONS.md
#   - Write 07_PERMISSIONS.md
#   - Write 08_PROHIBITIONS.md

# 4. Create a project state file
cat > 00_PROJECT_STATE.md << 'EOF'
# Project: My E-Commerce Platform
Created: 2026-05-27
Base Cores Loaded: shopping_mall_core, marketplace_core
Locked: [Spec Lock Documents Ready]
Phase: Planning Complete, Development Ready
EOF
```

### Usage Pattern 3: Developing with AI

**Prerequisite:** Use the CoolHan Framework together with Claude AI or another AI tool

```bash
# 1. Load the entire knowledge_base into the AI tool
# (RAG systems such as VS Code, Claude Code, GitHub Copilot)

# 2. Project initialization message
"""
This project uses the CoolHan Framework.

Required rules:
- Comply with 00_AI_MASTER_RULES.md
- Comply with 00_DEVELOPMENT_LOCKED_MODE.md
- Comply with 00_MODULE_RESPONSIBILITY_MATRIX.md

Please load these documents first.
"""

# 3. Provide the central source-of-truth documents
# Provide the 8 documents above to the AI

# 4. Proceed with development
# The AI executes based only on the documents (not inference/creation)
```

---

## Frequently Asked Questions (FAQ)

### Q1: Which Base Knowledge Core should I start with?

**A:** Depending on the project type:
- General online shopping mall → `shopping_mall_core.md`
- Multi-seller platform → `marketplace_core.md`
- Overseas purchase agency → `purchase_agency_core.md`
- Delivery optimization → `logistics_core.md`

### Q2: What is the relationship between domain modules (01-10) and Base Knowledge Core?

**A:** 
- **Base Knowledge Core**: Industry-standard definition (abstract)
- **Domain modules (01-10)**: Concrete feature implementation (actual code)
- **Relationship**: Core defines the minimum requirements of the modules, and the modules implement/extend the Core

### Q3: Can I apply CoolHan to an existing project?

**A:** Yes. Follow this sequence:
1. Write the 8 central source-of-truth documents for the current project
2. Compare with 00_MODULE_RESPONSIBILITY_MATRIX to check for conflicts
3. Resolve conflicts (refer to 00_ARCHITECTURE_CONFLICT_RESOLUTION.md)
4. Update the status value registry
5. Start applying the rules

### Q4: Can I use it in a language other than English?

**A:** Yes, you can:
1. Translate the knowledge_base into another language
2. Write project-specific documents in the project language
3. The core rules are the same (language-independent)

### Q5: What do I do if an architecture conflict is found?

**A:** Refer to the 11 conflict resolution methods defined in 00_ARCHITECTURE_CONFLICT_RESOLUTION.md, and:
1. Find the relevant conflict number
2. Check the solution's "Single Source of Truth"
3. Specify the owning module
4. Update the project's 00_MODULE_RESPONSIBILITY_MATRIX

---

## Troubleshooting

### Problem 1: Markdown files are not visible

**Solution:**
```bash
# 1. Check the directory
ls -la knowledge_base/

# 2. Check file encoding (must be UTF-8)
file knowledge_base/00_AI_MASTER_RULES.md

# 3. Open in VS Code
code knowledge_base/
```

### Problem 2: Git clone fails

**Solution:**
```bash
# Use HTTPS instead of SSH
git clone https://github.com/zmjckim-fa/coolhan.git

# Or clone quickly with a depth limit
git clone --depth 1 https://github.com/zmjckim-fa/coolhan.git
```

### Problem 3: Permission errors

**Solution:**
```bash
# Add read permission
chmod +r knowledge_base/*.md
chmod +r knowledge_base/core/*.md
```

### Problem 4: Local server port conflict

**Solution:**
```bash
# Use a different port
python -m http.server 8888  # 8888 instead of 8000

# Or check which ports are in use
lsof -i :8000
kill -9 <PID>
```

---

## Support and Feedback

### Submitting Feedback

For improvements or bug reports:
```bash
# On GitHub Issues
https://github.com/zmjckim-fa/coolhan/issues

# Or by email
architecture@coolhan.dev
```

### Community

- **GitHub Discussions**: Questions and discussion
- **Wiki**: Additional examples and guides
- **Issues**: Bug reports and feature requests

### Checking for Updates

```bash
# Get the latest version
git pull origin main

# Check the changes
git log --oneline -10
```

---

## License and Terms of Use

**CoolHan Framework** is distributed under the MIT License.

You are free to use, modify, and distribute it.
For details, refer to the LICENSE file.

---

## Next Steps

1. ✅ Read this guide (done)
2. 📖 Read `README.md` (project overview)
3. 📚 Read `00_AI_MASTER_RULES.md` (core rules)
4. 🔍 Select a Base Knowledge Core (project type)
5. 🚀 Start a new project!

---

**Get started with CoolHan Builder! 🚀**

It takes about 30 minutes from installation and reading the documentation to initializing your first project.

For more details, refer to `README.md`.
