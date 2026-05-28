---
name: coolhan-release-orchestrator
description: "CoolHan Specification-Driven Framework를 GitHub에 배포하고 npm 패키지로 배포하며, 사용자 확산과 품질 관리를 자동화합니다. '배포해줘', '릴리스 준비해줘', '사용자 문서 만들어줘', '품질 테스트해줘', '배포 후 모니터링' 등 CoolHan 릴리스 관련 요청 시 반드시 이 스킬을 사용할 것. 5명의 전문가 팀(기획/개발/DevOps/마케팅/QA)이 협력하여 완전한 릴리스 프로세스를 관리합니다."
working-mode: |
  **Token Efficiency Mode (작동 원칙)**
  - 결과만 보고: 배포완료/실패 형식으로만 보고
  - 과정 설명 금지: 생각, 판단 과정 미표시
  - 소스 화면 미표시: 코드나 내용 스크린샷 제외
  - 토큰 최소화: 필수 정보만 간결하게 전달
compatibility: Claude Code + Agent Team system
---

# 🚀 CoolHan Release Orchestrator

CoolHan Specification-Driven Framework를 **GitHub에서 npm까지**, 그리고 **사용자에게까지** 성공적으로 배포하고 관리하는 통합 시스템입니다.

---

## 핵심 목표

| 단계 | 담당 리드 | 산출물 |
|------|---------|--------|
| 📋 **배포 전략** | 기획 리드 | GitHub 전략, npm 전략, 로드맵 |
| 💻 **패키지 준비** | 개발 리드 | package.json, 설치 스크립트 |
| 🔧 **CI/CD 구축** | DevOps 리드 | GitHub Actions, 자동 배포 |
| 📚 **사용자 문서** | 마케팅 리드 | README, 튜토리얼, 예제 |
| ✅ **품질 검증** | QA 리드 | 테스트 리포트, 배포 승인 |

---

## 실행 구조

```
[오케스트레이터 - CoolHan Release Orchestrator]
  ├─ Task 1: 배포 전략 수립 (기획 리드)
  ├─ Task 2: npm 패키지 준비 (개발 리드)
  ├─ Task 3: GitHub & CI/CD 구축 (DevOps 리드)
  ├─ Task 4: 사용자 문서 작성 (마케팅 리드)
  └─ Task 5: Pre-Deploy QA (QA 리드)
         ↓
  [배포 승인]
         ↓
  └─ Task 6: npm 배포 실행 (DevOps 리드)
  └─ Task 7: Post-Deploy 모니터링 (QA 리드)
```

**실행 모드:** 🔄 **에이전트 팀** (5명이 협력)

---

## 워크플로우

### Phase 1: 팀 구성 및 작업 할당

```
1. TeamCreate로 5명 팀 구성:
   - 기획 리드 (planning-lead.md)
   - 개발 리드 (development-lead.md)
   - DevOps 리드 (devops-lead.md)
   - 마케팅 리드 (marketing-lead.md)
   - QA 리드 (qa-lead.md)

2. TaskCreate로 7개 작업 생성:
   - Task 1: 배포 전략 (기획 리드)
   - Task 2: npm 패키지 (개발 리드)
   - Task 3: CI/CD (DevOps 리드)
   - Task 4: 문서 (마케팅 리드)
   - Task 5: Pre-Deploy QA (QA 리드, Task 1-4 블로킹)
   - Task 6: npm 배포 (DevOps 리드, Task 5 블로킹)
   - Task 7: Post-Deploy 모니터링 (QA 리드, Task 6 블로킹)

3. 팀원들이 자체 조율 (SendMessage):
   - 정보 교환, 피드백, 협의
   - 오케스트레이터는 진행 상황 모니터링
```

### Phase 2: 병렬 준비 (Task 1-4)

각 리드가 자신의 영역을 담당:

**기획 리드:**
- GitHub 배포 전략 (저장소명, 라이선스, 메타데이터)
- npm 배포 전략 (패키지명, 버전, 배포 시기)
- 사용자 온보딩 경로 설계

**개발 리드:**
- package.json 작성
- bin/setup.js (설치 스크립트)
- npm 배포 스크립트

**DevOps 리드:**
- GitHub 저장소 생성 및 설정
- GitHub Actions CI/CD 파이프라인
- npm 인증 토큰 관리

**마케팅 리드:**
- GitHub README 최적화
- CONTRIBUTING.md, CODE_OF_CONDUCT.md
- docs/ 사용자 가이드
- examples/ 튜토리얼

### Phase 3: Pre-Deploy QA (Task 5)

QA 리드가 모든 준비 사항을 검증:

```
✅ Windows/Mac/Linux에서 npm 설치 테스트
✅ 기능 검증 (19개 파일 생성, 작동)
✅ 문서 정확성 검증
✅ npm 패키지 구조 검증

결과:
  PASS → Task 6 진행
  FAIL → 해당 리드에 반려, 수정 후 재테스트
```

### Phase 4: npm 배포 (Task 6)

DevOps 리드가 npm에 자동 배포:

```
GitHub tag v1.0.0 생성
  ↓
GitHub Actions 자동 실행
  ↓
npm publish 자동 실행
  ↓
npm 레지스트리 업데이트
```

### Phase 5: Post-Deploy 모니터링 (Task 7)

QA 리드가 배포 후 안정성 확인:

```
✅ npm 레지스트리에서 설치 가능한가?
✅ 초기 사용자 피드백 모니터링
✅ 문제 발생 시 → GitHub Issues 신고

모니터링 기간: 배포 후 24시간
```

---

## 팀 통신 프로토콜

### 기획 리드 → 개발 리드
```
"GitHub 저장소명은 'coolhan-spec-driven-framework'로 정했습니다.
npm 패키지명은 '@coolhan/spec-driven-framework'로 가시겠어요?"
```

### 개발 리드 → DevOps 리드
```
"package.json과 설치 스크립트 준비됐습니다.
CI/CD에 'npm run build' 단계 추가할 수 있나요?"
```

### 마케팅 리드 → 기획 리드
```
"사용자 가이드 작성 중입니다.
온보딩 경로(초보자/고급)를 따라 3개 예제를 만들었습니다."
```

### QA 리드 → 전체
```
"Pre-Deploy QA 통과했습니다! 모든 OS에서 설치 성공.
DevOps 리드, npm 배포 진행하셔도 됩니다."
```

---

## 데이터 흐름

### 파일 기반 전달 (_workspace/)

```
_workspace/
├── 01_planning_strategy.md (기획 리드 산출물)
├── 02_npm_package_config.md (개발 리드 산출물)
├── 03_cicd_setup.md (DevOps 리드 산출물)
├── 04_marketing_materials.md (마케팅 리드 산출물)
├── 05_pre_deploy_qa.md (QA 리드 검증 결과)
├── 06_deploy_log.md (배포 실행 결과)
└── 07_post_deploy_report.md (Post-Deploy 모니터링)
```

---

## 에러 핸들링

| 상황 | 대응 |
|------|------|
| **개발 리드 작업 지연** | 기획 리드 대기, 원인 확인, 일정 조정 |
| **DevOps 인프라 문제** | 기획 리드에 보고, 대체 방안 검토 |
| **QA 실패 (Blocker)** | 해당 리드에 반려, 수정 후 재테스트 |
| **npm 배포 실패** | 즉시 DevOps 리드 개입, 로그 분석, 롤백 검토 |
| **배포 후 사용자 문제** | QA 리드가 GitHub Issues로 신고, 우선순위 결정 |

---

## 성공 기준

배포 완료 후 다음을 확인합니다:

- ✅ npm에서 설치 가능 (`npm install @coolhan/spec-driven-framework`)
- ✅ GitHub에 공개 저장소 존재 (별 수 상관없음)
- ✅ 초기 사용자 피드백 수집 완료
- ✅ 모든 도움말 문서 준비됨
- ✅ 배포 후 24시간 모니터링 완료

---

## 후속 작업

배포 후:

1. **사용자 피드백 수집** (1주)
   - GitHub Discussions 활성화
   - 초기 사용자 인터뷰

2. **v1.0.1 준비** (2주)
   - 사용자 피드백 반영
   - 버그 수정

3. **장기 로드맵**
   - 월별 기능 추가
   - 커뮤니티 확대

---

## 사용 예시

### 초기 배포
```
사용자: "CoolHan 배포해줘"
↓
오케스트레이터: (팀 구성, Task 할당)
기획 리드: (전략 수립)
개발 리드: (패키지 준비)
DevOps 리드: (인프라 구축)
마케팅 리드: (문서 작성)
QA 리드: (검증)
↓
배포 완료!
```

### 후속 배포 (v1.0.1)
```
사용자: "버그 수정해서 v1.0.1 배포해줘"
↓
오케스트레이터: (v1.0.1 태그 생성)
개발 리드: (버그 수정, package.json 버전 업데이트)
QA 리드: (재검증)
↓
자동 npm 배포 완료!
```

---

## 주요 파일

- `.claude/agents/planning-lead.md` — 기획 리드 정의
- `.claude/agents/development-lead.md` — 개발 리드 정의
- `.claude/agents/devops-lead.md` — DevOps 리드 정의
- `.claude/agents/marketing-lead.md` — 마케팅 리드 정의
- `.claude/agents/qa-lead.md` — QA 리드 정의

---

**마지막 업데이트:** 2026-05-27  
**버전:** 1.0.0  
**팀원:** 5명 (기획/개발/DevOps/마케팅/QA)  
**예상 완료:** 5-7일
