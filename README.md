<div align="center">

# 🎯 CoolHan

**AI-Powered Specification-Driven Development Framework**

[![CI](https://github.com/zmjckim-fa/coolhan/actions/workflows/test.yml/badge.svg)](https://github.com/zmjckim-fa/coolhan/actions/workflows/test.yml)
[![npm version](https://img.shields.io/npm/v/coolhan-builder?color=blue)](https://www.npmjs.com/package/coolhan-builder)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Languages](https://img.shields.io/badge/Languages-50%2B-green)](MULTILINGUAL_SUPPORT.md)
[![Node.js](https://img.shields.io/badge/Node.js-14%2B-brightgreen)](https://nodejs.org)

> **One natural-language command, from planning to deployment.**

[🇰🇷 한국어](#korean) · [🇺🇸 English](#english) · [Quick Start](#-quick-start) · [Docs](#-documentation)

</div>

---

## Korean

### What is it?

**CoolHan** is a **Specification-Driven Development Framework** in which a team of 6 AI specialists takes a single natural-language command in the user's own language and automates the entire process: planning → specification → code → validation → testing → deployment.

```
CoolHan add user login feature (in Korean)
         ↓
[Intent Analyzer] → [Spec Writer] → [Developer] → [Validator] → [QA Tester] → [DevOps]
         ↓                                              ↓
   Planner intent documented                    10-stage auto validation
   Unauthorized feature additions blocked        Planning intent enforcement mechanism
```

### Key Features

| Feature | Description |
|------|------|
| 🌍 **50+ language support** | Auto-detects Korean, English, Japanese, Chinese, and more |
| 🤖 **6-member AI team** | Intent analysis → spec → development → validation → QA → deployment, auto-collaborating |
| 🛡️ **Planner intent enforcement** | Blocks arbitrary AI feature additions at the source (Phase D-4 verified) |
| 📏 **10-stage validation** | Includes Stage 0 planning intent check, evidence-based |
| 🔒 **Safe deployment** | Deploy locks, validation gates, automatic rollback |
| 📚 **10 domain modules** | Member, Shopping, Payment, Shipping, Admin, Notification, Review, Inventory, Order, Privacy |

---

## English

### What is CoolHan?

**CoolHan** is a Specification-Driven Development Framework where a team of 6 AI specialists automatically handles the entire software development lifecycle from a single natural-language command.

```
"CoolHan add user login feature"
         ↓
[Intent Analyzer] analyzes & documents planner intent
         ↓
[Spec Writer] creates CoolHan specification documents
         ↓
[Developer] implements code strictly following specs
         ↓
[Validator] runs 10-stage validation (incl. planning intent check)
         ↓
[QA Tester] executes specification-based test suites
         ↓
[DevOps/Deployer] deploys safely with locks and health checks
```

### Key Innovation: Planner Intent Enforcement

The critical problem in AI-assisted development: AI systems tend to add arbitrary features beyond what was requested, and this worsens over time as more features accumulate.

CoolHan solves this with the **Planner Intent Enforcement Mechanism**:

```
Task 1 → Documents explicit planner intent in requirements-{id}.md
         [feature_name / new_or_existing / planner_approval / no_unauthorized_additions]
         ↓
Task 1→2 Gate → Auto-proceeds (no interruption) based on documented intent
         ↓
Task 4 Stage 0 → Compares actual code against planner intent
                 Detects unauthorized additions → FAIL
         ↓
Task 7→8 → Re-validates against specification checklist
```

**Result (Phase D-4 Verified):** Zero unauthorized feature additions detected across full Task 1-8 pipeline.

---

## 🚀 Quick Start

### Installation

```bash
# Linux / macOS
curl -fsSL https://raw.githubusercontent.com/zmjckim-fa/coolhan/main/install.sh | bash

# Windows (PowerShell)
iwr https://raw.githubusercontent.com/zmjckim-fa/coolhan/main/install.ps1 | iex

# Node.js (Cross-platform)
node -e "$(curl -fsSL https://raw.githubusercontent.com/zmjckim-fa/coolhan/main/install.js)"

# npm
npm install -g coolhan-builder
```

### Usage

After installation, open Claude Code in your project directory and use natural language:

```
# Korean
쿨한으로 사용자 로그인 기능 추가해

# English
CoolHan add user login feature

# Japanese
CoolHanでユーザーログイン機能を追加して

# Chinese
用CoolHan添加用户登录功能
```

CoolHan automatically:
1. Detects your language
2. Assembles the 6-agent team
3. Runs Task 1-8 pipeline
4. Delivers working, tested, deployed code

---

## 🏗️ Architecture

### Harness System

CoolHan runs two parallel harnesses:

```
CoolHan Builder Repository
├── Development Harness (coolhan-development-orchestrator)
│   ├── Task 1: Intent Analyzer     ← Planner intent documentation
│   ├── Task 1→2: Intent Gate       ← Auto-proceed (no interruption)
│   ├── Task 2: Spec Writer
│   ├── Task 3: Developer
│   ├── Task 4: Validator           ← Stage 0: Planning intent check
│   ├── Task 5: QA Tester
│   ├── Task 6: DevOps/Deployer
│   ├── Task 7: Integration Validator (optional)
│   └── Task 8: E2E Tester (optional)
│
└── Release Engineering Harness (coolhan-release-orchestrator)
    ├── Planning Lead
    ├── Development Lead
    ├── DevOps Lead
    ├── Marketing Lead
    └── QA Lead
```

### Domain Modules (Knowledge Base)

```
knowledge_base/
├── 01_member_system.md          # Auth, profiles, permissions
├── 02_shopping_mall.md          # Cart, catalog, checkout
├── 03_payment_system.md         # PG integration, refunds
├── 04_shipping_system.md        # Carriers, tracking
├── 05_admin_system.md           # Dashboard, audit
├── 06_notification_system.md    # Email, push, feedback
├── 07_review_rating_system.md   # Reviews, ratings
├── 08_inventory_management.md   # Stock, reservations
├── 09_order_management.md       # Orders, cancellations
└── 10_privacy_gdpr.md           # GDPR, data protection
```

### Evidence Separation (Validation Architecture)

```
Validation Pipeline (10 stages):
  Stage 0: Planning Intent Check  ← NEW in Phase D-3/D-4
           Compare code vs requirements-{id}.md
           Detect unauthorized feature additions → FAIL
  Stage 1: Spec Parsing & Compliance
  Stage 2: Code Analysis (types, structure)
  Stage 3: Data Model (DB schema)
  Stage 4: API Endpoints (response format)
  Stage 5: Status Values (registry check)
  Stage 6: Security (SQL injection, auth)
  Stage 7: Business Logic
  Stage 8: Test Coverage
  Stage 9: Deployment Readiness
```

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [CLAUDE.md](CLAUDE.md) | Harness configuration & agent team structure |
| [QUICK_START.md](QUICK_START.md) | 5-minute getting started guide |
| [CONTRIBUTING.md](CONTRIBUTING.md) | How to contribute |
| [CHANGELOG.md](CHANGELOG.md) | Version history |
| [MULTILINGUAL_SUPPORT.md](MULTILINGUAL_SUPPORT.md) | 50+ language support details |
| [CLAUDE_INSTALLATION_GUIDE.md](CLAUDE_INSTALLATION_GUIDE.md) | Installation troubleshooting |

### Tools

| Tool | Description |
|------|-------------|
| [Voynich Reference Analyzer](tools/voynich-reference-analyzer/) | Research platform for structural analysis of the Voynich Manuscript |

---

## 🔬 Voynich Reference Analyzer

A research platform included in this repository for testing the hypothesis:

> **"Does the Voynich Manuscript encode a reference/taxonomic system rather than natural prose or cipher text?"**

⚠️ **This is NOT a decipherment tool.** It analyzes structural patterns only.

### Features (v0.3)

- **12 DB tables** for evidence ingestion & validation
- **4-tier evidence separation**: Primary / Derived / External Claim / Hypothesis Eval
- **Planner guardrail**: External research conclusions never adopted as facts
- **Auto-revalidation**: Rules re-evaluated when new data is ingested
- **18-page Streamlit dashboard** with live DB connectivity

### Quick Start (Voynich Tool)

```bash
cd tools/voynich-reference-analyzer
pip install -r requirements.txt
python scripts/init_db.py        # Initialize database (30 tables)
python scripts/demo_seed.py      # Load sample data
streamlit run app.py             # Launch dashboard
```

---

## 📊 Project Status

| Component | Status | Version |
|-----------|--------|---------|
| Development Harness | ✅ Production | Phase D-4 |
| Release Engineering | ✅ Production | v1.0 |
| Planner Intent Enforcement | ✅ Verified | Phase D-4 |
| Knowledge Base (10 modules) | ✅ Complete | Phase 2 |
| Voynich Research Tool | 🔄 Active | v0.3 |
| npm Package | ✅ Published | Latest |

### Phase D-4 Verification Results

| Check | Result |
|-------|--------|
| Task 1 existing feature detection | ✅ PASS |
| Task 1→2 gate auto-proceeds | ✅ PASS (no interruption) |
| Task 4 Stage 0 intent validation | ✅ PASS |
| Unauthorized additions detected | ✅ 0 detected |
| Full Task 1-8 pipeline | ✅ ALL PASS |

---

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

```bash
# Clone
git clone https://github.com/zmjckim-fa/coolhan.git
cd coolhan

# Install
npm install

# Run tests
npm test

# Validate structure
npm run spec:validate
```

---

## 📄 License

MIT © 2026 — See [LICENSE](LICENSE)

---

<div align="center">

**Built with [Claude Code](https://claude.ai/claude-code) · Powered by Anthropic**

</div>
