---
name: coolhan-release-orchestrator
description: "CoolHan Specification-Driven Framework를 GitHub에 배포하고 npm 패키지로 배포하며, 사용자 확산과 품질 관리를 자동화합니다. '배포해줘', '릴리스 준비해줘', '사용자 문서 만들어줘', '품질 테스트해줘', '배포 후 모니터링' 등 CoolHan 릴리스 관련 요청 시 반드시 이 스킬을 사용할 것. 5명의 전문가 팀(기획/개발/DevOps/마케팅/QA)이 협력하여 완전한 릴리스 프로세스를 관리합니다."
working-mode: |
  **Token Efficiency Mode (operating principles)**
  - Report results only: report in deploy-complete/failed format only
  - No process explanation: do not show thinking or judgment process
  - No source display: exclude code or content screenshots
  - Minimize tokens: convey only essential information concisely
compatibility: Claude Code + Agent Team system
---

# 🚀 CoolHan Release Orchestrator

An integrated system that successfully deploys and manages the CoolHan Specification-Driven Framework **from GitHub to npm**, and **all the way to users**.

---

## Core Goals

| Stage | Lead in Charge | Deliverable |
|------|---------|--------|
| 📋 **Deployment Strategy** | Planning Lead | GitHub strategy, npm strategy, roadmap |
| 💻 **Package Preparation** | Development Lead | package.json, install scripts |
| 🔧 **CI/CD Setup** | DevOps Lead | GitHub Actions, automated deployment |
| 📚 **User Documentation** | Marketing Lead | README, tutorials, examples |
| ✅ **Quality Verification** | QA Lead | Test reports, deployment approval |

---

## Execution Structure

```
[Orchestrator - CoolHan Release Orchestrator]
  ├─ Task 1: Establish deployment strategy (Planning Lead)
  ├─ Task 2: Prepare npm package (Development Lead)
  ├─ Task 3: Build GitHub & CI/CD (DevOps Lead)
  ├─ Task 4: Write user documentation (Marketing Lead)
  └─ Task 5: Pre-Deploy QA (QA Lead)
         ↓
  [Deployment Approval]
         ↓
  └─ Task 6: Execute npm deployment (DevOps Lead)
  └─ Task 7: Post-Deploy monitoring (QA Lead)
```

**Execution Mode:** 🔄 **Agent Team** (5 members collaborating)

---

## Workflow

### Phase 1: Team Formation and Task Assignment

```
1. Form 5-member team with TeamCreate:
   - Planning Lead (planning-lead.md)
   - Development Lead (development-lead.md)
   - DevOps Lead (devops-lead.md)
   - Marketing Lead (marketing-lead.md)
   - QA Lead (qa-lead.md)

2. Create 7 tasks with TaskCreate:
   - Task 1: Deployment strategy (Planning Lead)
   - Task 2: npm package (Development Lead)
   - Task 3: CI/CD (DevOps Lead)
   - Task 4: Documentation (Marketing Lead)
   - Task 5: Pre-Deploy QA (QA Lead, blocking Task 1-4)
   - Task 6: npm deployment (DevOps Lead, blocking Task 5)
   - Task 7: Post-Deploy monitoring (QA Lead, blocking Task 6)

3. Team members self-coordinate (SendMessage):
   - Information exchange, feedback, consultation
   - Orchestrator monitors progress
```

### Phase 2: Parallel Preparation (Task 1-4)

Each lead handles their own area:

**Planning Lead:**
- GitHub deployment strategy (repository name, license, metadata)
- npm deployment strategy (package name, version, release timing)
- User onboarding path design

**Development Lead:**
- Write package.json
- bin/setup.js (install script)
- npm deployment scripts

**DevOps Lead:**
- Create and configure GitHub repository
- GitHub Actions CI/CD pipeline
- npm authentication token management

**Marketing Lead:**
- GitHub README optimization
- CONTRIBUTING.md, CODE_OF_CONDUCT.md
- docs/ user guide
- examples/ tutorials

### Phase 3: Pre-Deploy QA (Task 5)

The QA Lead verifies all preparations:

```
✅ npm install test on Windows/Mac/Linux
✅ Functional verification (19 files generated, working)
✅ Documentation accuracy verification
✅ npm package structure verification

Result:
  PASS → Proceed to Task 6
  FAIL → Return to the relevant lead, retest after fixes
```

### Phase 4: npm Deployment (Task 6)

The DevOps Lead deploys automatically to npm:

```
Create GitHub tag v1.0.0
  ↓
GitHub Actions runs automatically
  ↓
npm publish runs automatically
  ↓
npm registry updated
```

### Phase 5: Post-Deploy Monitoring (Task 7)

The QA Lead confirms post-deployment stability:

```
✅ Is it installable from the npm registry?
✅ Monitor early user feedback
✅ On problems → file GitHub Issues

Monitoring period: 24 hours after deployment
```

---

## Team Communication Protocol

### Planning Lead → Development Lead
```
"The GitHub repository name has been set to 'coolhan-spec-driven-framework'.
Shall we go with '@coolhan/spec-driven-framework' for the npm package name?"
```

### Development Lead → DevOps Lead
```
"package.json and install scripts are ready.
Can you add an 'npm run build' step to CI/CD?"
```

### Marketing Lead → Planning Lead
```
"Writing the user guide now.
I created 3 examples following the onboarding paths (beginner/advanced)."
```

### QA Lead → Everyone
```
"Pre-Deploy QA passed! Installation succeeded on all OSes.
DevOps Lead, you may proceed with the npm deployment."
```

---

## Data Flow

### File-Based Handoff (_workspace/)

```
_workspace/
├── 01_planning_strategy.md (Planning Lead deliverable)
├── 02_npm_package_config.md (Development Lead deliverable)
├── 03_cicd_setup.md (DevOps Lead deliverable)
├── 04_marketing_materials.md (Marketing Lead deliverable)
├── 05_pre_deploy_qa.md (QA Lead verification result)
├── 06_deploy_log.md (deployment execution result)
└── 07_post_deploy_report.md (Post-Deploy monitoring)
```

---

## Error Handling

| Situation | Response |
|------|------|
| **Development Lead task delay** | Planning Lead waits, identifies cause, adjusts schedule |
| **DevOps infrastructure problem** | Report to Planning Lead, review alternatives |
| **QA failure (Blocker)** | Return to the relevant lead, retest after fixes |
| **npm deployment failure** | Immediate DevOps Lead intervention, log analysis, rollback review |
| **Post-deployment user problem** | QA Lead files GitHub Issues, prioritizes |

---

## Success Criteria

After deployment is complete, confirm the following:

- ✅ Installable from npm (`npm install @coolhan/spec-driven-framework`)
- ✅ Public repository exists on GitHub (star count irrelevant)
- ✅ Early user feedback collection complete
- ✅ All help documentation prepared
- ✅ 24-hour post-deployment monitoring complete

---

## Follow-up Work

After deployment:

1. **Collect user feedback** (1 week)
   - Activate GitHub Discussions
   - Interview early users

2. **Prepare v1.0.1** (2 weeks)
   - Incorporate user feedback
   - Bug fixes

3. **Long-term roadmap**
   - Monthly feature additions
   - Community expansion

---

## Usage Examples

### Initial Deployment
```
User: "CoolHan 배포해줘"
↓
Orchestrator: (form team, assign tasks)
Planning Lead: (establish strategy)
Development Lead: (prepare package)
DevOps Lead: (build infrastructure)
Marketing Lead: (write documentation)
QA Lead: (verify)
↓
Deployment complete!
```

### Follow-up Deployment (v1.0.1)
```
User: "버그 수정해서 v1.0.1 배포해줘"
↓
Orchestrator: (create v1.0.1 tag)
Development Lead: (fix bugs, update package.json version)
QA Lead: (re-verify)
↓
Automatic npm deployment complete!
```

---

## Key Files

- `.claude/agents/planning-lead.md` — Planning Lead definition
- `.claude/agents/development-lead.md` — Development Lead definition
- `.claude/agents/devops-lead.md` — DevOps Lead definition
- `.claude/agents/marketing-lead.md` — Marketing Lead definition
- `.claude/agents/qa-lead.md` — QA Lead definition

---

**Last Updated:** 2026-05-27  
**Version:** 1.0.0  
**Team Members:** 5 (Planning/Development/DevOps/Marketing/QA)  
**Estimated Completion:** 5-7 days
