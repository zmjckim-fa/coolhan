# DECISIONS: 결정 기록

> 묻지 않고 고른 기본값과 그 이유를 적는다. 운영자가 이미 정한 결정은 여기에 적고 다시 묻지 않는다.

## 형식
- Decision: 무엇을 정했나
- Default chosen without asking: 묻지 않고 고른 기본값
- Rationale: 왜
- Reversible: 되돌릴 수 있나, 어떻게
- Not done / 확인 못 한 것: 하지 않은 것과 확인하지 못한 것
- Next: 다음 일

## {{date}}: 프로젝트 시작
- Decision: 쿨한 프로젝트 키트로 시작한다. 상시 지시, 훅, 원장, 고정 검증 목록, 모듈 계획이 처음부터 들어 있다.
- Default chosen without asking: 태그 `{{tags}}`, 배포 허가 `{{deploy}}`, 모듈 저장소 `{{modules}}`
- Rationale: 프로젝트마다 같은 명령을 반복하지 않기 위해서다.
- Reversible: yes, `coolhan.project.json`을 고치고 `node scripts/new-project.js . --refresh`를 다시 실행한다.
- Next: `docs/plan/`의 기획서를 완성한다.
