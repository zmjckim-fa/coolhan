# Application Plan — 데이터 스키마 표준

> Cross-Site Adapter(역방향 R3)가 Module Manifest(사이트 A) + 대상 사이트 B 컨텍스트를 입력받아,
> "A의 어떤 모듈을 B에 어떻게 이식하는가"를 정의한 산출물의 표준.
> 이 계획은 정방향 파이프라인(Developer Task 3~6)의 입력이 된다.

## 핵심 원칙 — 기획자 의도 강제(P0)의 교차-사이트 확장

1. **승인된 모듈만 이식** — `approved_modules`에 명시된 모듈만 포팅한다. Manifest에 있어도 승인 목록에 없으면 이식 금지. (트랙3 P0 메커니즘의 확장)
2. **무단 끌어오기 차단** — 승인 모듈이 의존하는 미승인 모듈을 자동으로 함께 끌어오지 않는다. 의존성 누락은 충돌로 보고하고 기획자에게 승인 요청.
3. **파라미터화 재사용** — 사이트 간 DB명/테이블/API/디자인 차이는 기존 Specification/Design Parameterization 시스템으로 흡수한다. 하드코딩된 변환 금지.
4. **충돌 비파괴** — B에 이미 존재하는 자원과 충돌 시 삭제·덮어쓰기하지 않고 충돌로 보고 + 출처 병기.

## JSON 스키마

```json
{
  "plan_id": "{timestamp}",
  "source_manifest": "module-manifest-{id}.json",
  "site_a": { "name": "원본 사이트", "stack": "fastapi/postgres" },
  "site_b": {
    "name": "대상 사이트",
    "stack": "express/mysql | empty | unknown",
    "existing_modules": ["B에 이미 있는 모듈/자원"],
    "naming_convention": "B의 DB/API 네이밍 규칙 (parameterization 참조)",
    "design_profile": "B의 디자인 프로파일 (Elegant/Fresh/...)"
  },

  "approved_modules": [
    {
      "module_id": "M-01",
      "name": "주문 관리",
      "approved": true,
      "approval_source": "기획자 명시 승인 | 사용자 명령"
    }
  ],
  "rejected_modules": [
    { "module_id": "M-07", "name": "적립금", "reason": "B 범위 밖 — 기획자 미승인" }
  ],

  "mapping_table": [
    {
      "module_id": "M-01",
      "transform": {
        "db_naming": "orders → tbl_order (B 규칙 적용)",
        "field_naming": "snake_case → camelCase",
        "api_structure": "/api/orders → /v1/order (B 규칙)",
        "stack_port": "SQLAlchemy 모델 → Prisma 스키마",
        "design_swap": "A profile(Trustworthy) → B profile(Fresh)"
      },
      "parameterization_refs": [
        "00_SPECIFICATION_PARAMETERIZATION_SYSTEM.md",
        "00_DESIGN_PARAMETERIZATION_SYSTEM.md"
      ]
    }
  ],

  "conflicts": [
    {
      "type": "naming_clash | dependency_missing | schema_collision | stack_incompatible",
      "module_id": "M-01",
      "detail": "B에 이미 'order' 테이블 존재 — 병합/리네임 결정 필요",
      "resolution_options": ["리네임", "병합", "스킵"],
      "resolved": false,
      "requires_planner_approval": true
    }
  ],

  "dependency_check": [
    {
      "module_id": "M-01",
      "needs": ["M-03 결제"],
      "m03_approved": false,
      "action": "M-03 미승인 — 자동 포팅 금지. 기획자 승인 요청 또는 M-01 포팅 보류."
    }
  ],

  "port_order": ["M-02", "M-03", "M-01"],

  "handoff": {
    "to": "Developer (정방향 Task 3)",
    "spec_inputs": ["module-{id}.md (승인된 모듈만)"],
    "p0_guard": "Validator 0단계: 이식 결과가 approved_modules와 정확히 일치해야 PASS. 미승인 모듈/엔드포인트/테이블 발견 시 FAIL."
  },

  "summary": {
    "approved_count": 0,
    "rejected_count": 0,
    "unresolved_conflicts": 0,
    "blocked_by_dependency": 0,
    "ready_to_port": false
  }
}
```

## 충돌 유형별 처리

| 유형 | 의미 | 처리 |
|------|------|------|
| naming_clash | B에 동일 이름 자원 존재 | 파라미터화로 리네임 제안, 기획자 결정 |
| dependency_missing | 승인 모듈이 미승인 모듈에 의존 | 자동 포팅 금지, 승인 요청 (P0) |
| schema_collision | 테이블/필드 충돌 | 병합 vs 분리 옵션 제시, 비파괴 |
| stack_incompatible | A↔B 스택 변환 불가/난해 | 변환 비용 명시, 수동 포팅 또는 보류 |

## P0 검증 연계 (이식 후)

이식 완료 후 Validator의 **0단계 기획 의도 검증**이 교차-사이트 모드로 작동한다:

```
입력: application-plan-{id}.json 의 approved_modules
검사: B의 이식된 코드에서 추출한 엔드포인트/테이블/기능
판정:
  - PASS: 이식 결과 ⊆ approved_modules (정확히 승인된 것만)
  - FAIL: approved_modules에 없는 엔드포인트/테이블/기능 발견 (무단 끌어오기)
```

이로써 "분석 → 모듈화 → 이식" 전 과정에서 기획자가 승인하지 않은 기능이 B로 새어 들어가는 것을 원천 차단한다.
