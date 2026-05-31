<div align="center">

# 🎯 CoolHan

**AI-Powered Specification-Driven Development Framework**

[![CI](https://github.com/zmjckim-fa/coolhan/actions/workflows/test.yml/badge.svg)](https://github.com/zmjckim-fa/coolhan/actions/workflows/test.yml)
[![npm version](https://img.shields.io/npm/v/coolhan-builder?color=blue)](https://www.npmjs.com/package/coolhan-builder)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Languages](https://img.shields.io/badge/Languages-50%2B-green)](MULTILINGUAL_SUPPORT.md)
[![Node.js](https://img.shields.io/badge/Node.js-14%2B-brightgreen)](https://nodejs.org)

> **한 줄의 모국어 명령어로 기획부터 배포까지 — One natural-language command, from planning to deployment.**

[🇰🇷 한국어](#한국어) · [🇺🇸 English](#english) · [Quick Start](#-quick-start) · [Docs](#-documentation)

</div>

---

## 한국어

### 무엇인가?

**CoolHan**은 사용자의 자연스러운 모국어 명령어 한 줄을 6명의 AI 전문가 팀이 받아 기획 → 규격 → 코드 → 검증 → 테스트 → 배포의 전체 프로세스를 자동화하는 **Specification-Driven Development Framework**입니다.

```
쿨한으로 사용자 로그인 기능 추가해
         ↓
[Intent Analyzer] → [Spec Writer] → [Developer] → [Validator] → [QA Tester] → [DevOps]
         ↓                                              ↓
   기획자 의도 명시                              10단계 자동 검증
   무단 기능 추가 차단                           기획 의도 강제 메커니즘
```

### 핵심 특징

| 특징 | 설명 |
|------|------|
| 🌍 **50+ 언어 지원** | 한국어, 영어, 일본어, 중국어 등 자동 감지 |
| 🤖 **AI 6인 팀** | 의도분석 → 스펙 → 개발 → 검증 → QA → 배포 자동 협력 |
| 🛡️ **기획자 의도 강제** | AI의 자의적 기능 추가 원천 차단 (Phase D-4 검증 완료) |
| 📏 **10단계 검증** | Stage 0 기획 의도 검증 포함, 증거 기반 |
| 🔒 **안전 배포** | 배포 락, 검증 게이트, 자동 롤백 |
| 📚 **10개 도메인 모듈** | 회원·쇼핑·결제·배송·관리·알림·리뷰·재고·주문·개인정보 |

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
         [기능명 / 신규_또는_기존 / 기획자_승인 / 무단추가_금지]
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
