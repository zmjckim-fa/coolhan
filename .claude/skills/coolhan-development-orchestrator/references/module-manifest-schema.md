# Module Manifest — 데이터 스키마 표준

> Module Extractor(역방향 R2)가 Site Analysis Map을 입력받아, 발견된 기능·메뉴를
> **재사용 가능한 모듈**로 분해한 산출물의 표준. CoolHan 12섹션 도메인-모듈 포맷과 호환되어
> knowledge_base에 환류(등재)될 수 있다.

## 핵심 원칙

1. **CoolHan 도메인-모듈 포맷 정합** — 추출 모듈은 `00_DOMAIN_MODULES_INDEX.md`의 12섹션 구조에 매핑된다.
2. **기존 모듈 우선 매핑** — 발견 기능을 먼저 기존 10개 모듈(01~10)에 매핑 시도. 정확히 맞으면 `maps_to_existing`. 새로우면 확장 모듈(11+) 후보로 제안.
3. **독립성·합성성** — 각 모듈은 자기완결적 경계 + 명시적 의존성. 순환 참조 금지.
4. **증거 보존** — 각 모듈은 출처(Site Analysis Map의 feature id + 원본 파일)를 보존한다.

## JSON 스키마

```json
{
  "manifest_id": "{timestamp}",
  "source_analysis": "site-analysis-map-{id}.json",
  "modules": [
    {
      "module_id": "M-01",
      "name": "주문 관리",
      "maps_to_existing": "09_order_management | null",
      "novelty": "existing | existing+extension | new",
      "proposed_kb_file": "09_order_management.md (업데이트) | 11_xxx.md (신규)",

      "section_1_terminology": ["주문", "주문항목", "주문상태"],
      "section_2_functions": [
        { "name": "주문 생성", "desc": "장바구니→주문 전환", "source_feature": "F-01" }
      ],
      "section_3_status_values": ["pending", "paid", "shipped", "cancelled"],
      "section_4_data_model": [
        { "table": "orders", "fields": [...], "source": "src/models/order.py:10" }
      ],
      "section_5_api": [
        { "method": "POST", "path": "/api/orders", "source": "src/routes/order.py:42" }
      ],
      "section_6_permissions": [{ "role": "member", "can": ["create_own_order"] }],
      "section_7_prohibitions": ["타인 주문 조회 금지"],
      "section_8_security": ["주문 소유권 검증", "결제 멱등성 키"],
      "section_9_acceptance": ["주문 생성 시 재고 차감", "..."],
      "section_10_integration": [
        { "depends_on": "M-03 (결제)", "kind": "calls" },
        { "depends_on": "M-05 (재고)", "kind": "reserves" }
      ],
      "section_11_config": [{ "key": "order_timeout_min", "default": 30 }],
      "section_12_dependencies": ["M-02 회원", "M-03 결제", "M-05 재고"],

      "ui_menu": [
        { "label": "주문 목록", "route": "/orders", "source": "templates/order_list.html" }
      ],
      "reuse": {
        "extractable": true,
        "coupling": "low | medium | high",
        "coupling_notes": "전역 세션 객체에 강결합 — 분리 시 인증 추상화 필요"
      },
      "evidence": ["F-01", "F-02", "src/routes/order.py", "src/models/order.py"]
    }
  ],
  "dependency_graph": [
    { "from": "M-01", "to": "M-03", "kind": "calls" }
  ],
  "feedback_to_kb": {
    "updates": ["09_order_management.md: 부분 환불 플로우 추가 발견"],
    "new_modules": ["11_loyalty_points.md: 적립금 — 기존 10모듈에 없음"]
  },
  "summary": {
    "total_modules": 0,
    "mapped_to_existing": 0,
    "new_module_candidates": 0,
    "high_coupling_modules": ["분리 시 주의 필요한 모듈"]
  }
}
```

## 결합도(coupling) 판정 기준

| 등급 | 의미 | 재사용 시 조치 |
|------|------|---------------|
| low | 의존성이 명시적·소수, 인터페이스 명확 | 그대로 추출 가능 |
| medium | 일부 공유 유틸/설정에 의존 | 의존 항목을 함께 명시, 어댑터 경유 |
| high | 전역 상태/암묵적 사이드이펙트에 강결합 | 추출 전 리팩터 필요 — Application Plan에 경고 전달 |

## .md 동반 산출

각 모듈마다 `module-{id}-{name}.md`를 12섹션 도메인-모듈 포맷으로 생성하여 knowledge_base 등재 후보로 둔다. 매니페스트 요약 `module-manifest-{id}.md`에는 모듈 목록·의존성 그래프·KB 환류 제안을 표로 정리한다.

## knowledge_base 환류 규칙

- **기존 모듈에 흡수**(`maps_to_existing` 존재): 해당 KB 파일에 발견 사항을 차이(diff)로 제안. 무단 덮어쓰기 금지 — Spec Writer가 검토 후 반영.
- **신규 확장 모듈**(`novelty: new`): `11_*` 이후 번호로 12섹션 포맷 신규 후보 작성. 등재는 사용자/기획자 승인 후.
