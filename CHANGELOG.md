# Changelog

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
