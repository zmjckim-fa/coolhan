# Changelog

## [0.3.0] - 2026-05-31

### Added

- **Planner Intent Enforcement Mechanism** (Phase D-3/D-4)
  - Task 1: Existing feature detection from knowledge_base/
  - Task 1→2 Gate: Auto-proceeds based on documented planner intent (no user interruption)
  - Task 4 Stage 0: Planning intent validation — detects unauthorized feature additions
  - Task 7-8: Specification checklist re-validation
  - Phase D-4 Verified: Zero unauthorized additions across full Task 1-8 pipeline

- **Research Evidence Ingestion & Validation System** (Voynich v0.3)
  - 12 new database tables (data_sources, research_claims, failure_cases, ...)
  - 4-tier evidence separation: Primary / Derived / External Claim / Hypothesis Eval
  - HypothesisGuard: Prevents external research from hijacking core hypothesis
  - RevalidationEngine: Auto-revalidates rules when new data is ingested
  - 6 new Streamlit dashboard pages

- **Voynich Tool Pipeline Scripts**
  - `scripts/init_db.py`: Creates 30-table SQLite database
  - `scripts/demo_seed.py`: Loads sample EVA data, corpora, rules, failure cases
  - `scripts/run_pipeline.py`: Full analysis pipeline orchestrator

- **Dashboard Pages** (6 new — previously stubs)
  - Folio Explorer with DB connectivity
  - EVA Parser with live token breakdown
  - Token Analysis with frequency charts
  - Character Analysis with i-dominance detection
  - Position Rules with confidence visualization
  - Section Comparison with corpus comparison charts

### Changed
- CoolHan Development Harness upgraded to Phase D-4
- Validator (Task 4): 9-stage → 10-stage pipeline (Stage 0 added)
- Dashboard version: v0.2 → v0.3
- `modules/__init__.py`: v0.3 modules registered with graceful fallback
- Task 1→2 gate: Changed from AskUserQuestion → auto-proceed

### Fixed
- Nav label collision: `📋 Research Claims` → `🗃️ Research Claims`
- `init_db.py`: CREATE INDEX idempotency fix (IF NOT EXISTS)

---

## [1.0.4] - 2026-05-28

### Added
- **E2E Tester 에이전트** (신규 - 완전한 사용자 여정 검증)
  
  9가지 검증 Phase:
  - Phase 1: 소스 코드 (오타, 문법, 로직)
  - Phase 2: 데이터 흐름 (입력→DB→결과)
  - Phase 3: 연산 정확성 (비즈니스 로직)
  - Phase 4: 에러/경고 메시지 (사용자 피드백)
  - Phase 5: 사용자↔관리자 상호작용 (권한/동기화)
  - Phase 6: UI/UX (사용성, 레이아웃, 피드백)
  - Phase 7: 반응형 설계 (모바일/태블릿/데스크톱)
  - Phase 8: CSS 무결성 (스타일 적용, 깨진 부분)
  - Phase 9: 브라우저 호환성 (Chrome, Firefox, Safari 등)

- **중간 상기 메커니즘** (목적 유지)
  - 각 Phase별 명확한 목적 선언
  - 진행 중 "현재 상태" 재확인
  - 타임라인 추적
  - Phase 완료 시 결과 종합

- **완전한 검증 리포트**
  - 9가지 Phase별 상세 결과
  - 미흡한 항목 목록
  - 최종 배포 승인/반려 판정

### Changed
- Pipeline: 7단계 → 8단계 (Task 7: E2E 검증 추가)
- `coolhan-development-orchestrator.md`: Task 배치 조정

### Result
✅ 소스 → 데이터 → UI → 반응형 → 호환성까지 **완전 검증**
✅ 사용자/관리자 모두의 여정 검증
✅ 배포 전 100% 신뢰도 확보

---

## [1.0.3] - 2026-05-28

### Added
- **Integration Validator 에이전트** (신규)
  - 배포 전/후 실제 운영 환경 검증
  - 포트 확인 (API, DB, 캐시, 웹 서버)
  - API 엔드포인트 실제 테스트 (curl)
  - 데이터베이스 연결 및 쿼리 검증
  - 빌드 성공 확인
  - 데이터 로드 확인
  - 기획서 요구사항 체크리스트
  - 성능 측정 (응답 시간)

- **자동화된 검증 스크립트** (`scripts/validate-deployment.sh`)
  - 환경별 포트 확인
  - API 엔드포인트 검증
  - 데이터베이스 연결 확인
  - 빌드 검증
  - 데이터 로드 확인
  - 성능 측정
  - JSON 보고서 자동 생성

- **Task 6: 통합 검증** (개발 파이프라인에 추가)
  - QA 완료 후 필수 검증
  - 배포 전 최종 Go/No-Go 판정

### Changed
- `coolhan-development-orchestrator.md`: Task 6 추가 (통합 검증)
- Development 파이프라인: 6단계 → 7단계

### Result
✅ 기획서 → 코드 → 검증 → **실제 환경 검증** → 배포
✅ 포트, API, DB, 빌드, 데이터, 기획서 100% 검증
✅ 배포 전 자동 Go/No-Go 판정

---

## [1.0.2] - 2026-05-28

### Added
- **완전 다국어 트리거 구현**: 모든 50+ 언어의 모든 명령어 패턴 지원
  - 🇰🇷 한국어: '쿨한으로 ~', '진행하라 쿨한으로', '~ 쿨한으로 추가해'
  - 🇺🇸 English: 'CoolHan ~', '~ with CoolHan', 'CoolHan continue'
  - 🇯🇵 日本語: 'CoolHanで~', 'CoolHanで進めて'
  - 🇨🇳 中文: '用CoolHan~', '用CoolHan继续'
  - 🇪🇸 Español, 🇫🇷 Français, 🇩🇪 Deutsch, 🇮🇹 Italiano, 🇵🇹 Português, 🇷🇺 Русский, 🇮🇳 हिन्दी, 🇹🇭 ไทย +40 more
  - **자동 언어 감지**: 입력 언어 자동 인식 → 해당 언어의 모든 트리거 패턴 활성화

- **Orchestrator description 강화**
  - 각 언어별 구체적 명령어 예시 명시
  - "이 스킬을 사용할 것"이라는 명확한 의도 표시
  - Intent Analyzer 자동 활성화 보장

- **Intent Analyzer 트리거 확장**
  - 50+ 언어의 모든 명령어 형식 인식
  - 문법적 변형 모두 지원 (전치사 위치, 조사, 시제 등)

### Changed
- `coolhan-development-orchestrator.md`: 모든 언어 명령어 패턴 명시적 추가
- `intent-analyzer.md`: 50+ 언어 입력 프로토콜 완전 구현
- `package.json`: 버전 1.0.1 → 1.0.2

### Result
✅ "coolhan으로 진행하라" → **즉시 intent-analyzer 활성화**
✅ 모든 언어에서 작동 (50+ 언어)
✅ 모든 문법적 변형 지원

---

## [1.0.1] - 2026-05-28

### Added
- **자동 진행 메커니즘**: Task 완료 후 자동으로 다음 단계 실행
  - 사용자 개입 없이 연속적인 개발 진행
  - 각 Task 완료 시 내부 명령으로 다음 Task 자동 할당
  - 전체 파이프라인의 seamless 실행

- **인터랙티브 질문 프로세스**: Intent Analyzer의 상세 정보 수집
  - 19개 구체적 질문 항목 (사업 배경, 사용 환경, 기능, 조직)
  - 사용자 피로도 관리 (지칠 때까지 질문, 최종 1개만 추가)
  - 상세한 비즈니스 요구사항 문서 자동 생성

- **사용자 설명서 개선**: README 구조화
  - 인간이 제공해야 할 구체적 정보 항목 명시
  - 각 항목별 예시 및 설명

### Changed
- `intent-analyzer.md`: 질문 프로세스 및 자동 진행 메커니즘 추가
- `coolhan-development-orchestrator.md`: Task 자동 연결 로직 명시
- `README.md`: 사용자 중심의 구체적 정보 항목 가이드
- `package.json`: 버전 1.0.0 → 1.0.1

### Fixed
- 거짓 다국어 지원 표기 제거 (실제는 영어만 지원)
- 기술 상세 내용으로 인한 사용자 혼동 제거

## [1.0.0] - 2026-05-27

### Initial Release
- 6명 AI 에이전트 팀 협력 시스템
- 10개 도메인 모듈 기반 아키텍처
- 9단계 자동 검증 프로세스
- Token Efficiency Mode 적용
- 규격 기반 개발 (specification-driven)
