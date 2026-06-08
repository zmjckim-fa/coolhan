# Site Analysis Map — 데이터 스키마 표준

> Site Analyzer(역방향 R1)가 기존 사이트 코드를 역공학하여 생성하는 구조화 산출물의 표준.
> 이 맵은 Module Extractor(R2)의 입력이며, "코드를 스펙으로" 되돌리는 1차 산출물이다.

## 핵심 원칙

1. **stack-agnostic** — 특정 패키지 매니저/프레임워크를 전제하지 않는다. 먼저 스택을 감지하고, 감지 결과에 따라 추출 전략을 분기한다. (트랙4 GAP-1 교훈)
2. **증거 필수** — 모든 추출 항목은 `evidence`(파일 경로 + 라인/심볼)를 동반한다. 증거 없는 항목은 `confidence: "low"`로 표기하거나 제외한다.
3. **추론 금지** — 코드에 존재하지 않는 기능을 "있을 법하다"고 추가하지 않는다. 발견한 것만 기록한다 (P0 정신의 역방향 적용).

## JSON 스키마

```json
{
  "analysis_id": "{timestamp}",
  "target": {
    "path": "분석 대상 루트 경로",
    "name": "사이트/프로젝트명",
    "analyzed_at": "ISO-8601"
  },
  "stack": {
    "language": "python | javascript | typescript | php | ruby | go | java | ...",
    "framework": "fastapi | django | express | nextjs | laravel | rails | spring | ...",
    "detected_by": ["requirements.txt", "main.py imports", "..."],
    "database": "postgresql | mysql | sqlite | mongodb | none | unknown",
    "orm": "sqlalchemy | prisma | eloquent | activerecord | none",
    "frontend": "react | vue | server-rendered templates | none | unknown",
    "command_map": {
      "install": "감지된 설치 명령 (예: pip install -r requirements.txt)",
      "build": "감지된 빌드 명령 또는 null",
      "test": "감지된 테스트 명령 (예: pytest)",
      "run": "감지된 실행 명령 (예: uvicorn main:app)"
    }
  },
  "routes": [
    {
      "method": "GET | POST | PUT | PATCH | DELETE",
      "path": "/api/...",
      "handler": "함수/컨트롤러명",
      "auth_required": true,
      "evidence": "src/routes/order.py:42",
      "confidence": "high | medium | low"
    }
  ],
  "data_models": [
    {
      "name": "테이블/엔티티명",
      "fields": [{ "name": "...", "type": "...", "nullable": false }],
      "relations": [{ "to": "다른모델", "kind": "1:N | N:1 | N:M | 1:1" }],
      "evidence": "src/models/order.py:10",
      "confidence": "high"
    }
  ],
  "components": [
    {
      "name": "컴포넌트/뷰/템플릿명",
      "kind": "page | partial | layout | api-only",
      "renders": ["사용 데이터 모델/엔드포인트"],
      "evidence": "templates/order_list.html | src/components/OrderList.tsx:1",
      "confidence": "medium"
    }
  ],
  "menu_tree": [
    {
      "label": "메뉴명",
      "route": "/orders",
      "children": [{ "label": "주문 상세", "route": "/orders/:id" }],
      "evidence": "src/nav.py:5 | templates/base.html:30",
      "confidence": "medium"
    }
  ],
  "features": [
    {
      "id": "F-01",
      "name": "기능명 (예: 주문 생성)",
      "description": "한 줄 설명",
      "routes": ["POST /api/orders"],
      "models": ["orders", "order_items"],
      "components": ["OrderForm"],
      "depends_on": ["F-02 (회원 인증)"],
      "evidence": ["src/routes/order.py:42", "src/models/order.py:10"],
      "confidence": "high"
    }
  ],
  "integration_points": [
    {
      "type": "external_api | payment_gateway | message_queue | cron | webhook",
      "name": "예: Stripe",
      "evidence": "src/crud/payment.py:88",
      "confidence": "high"
    }
  ],
  "summary": {
    "stack_detected": true,
    "total_routes": 0,
    "total_models": 0,
    "total_features": 0,
    "low_confidence_items": 0,
    "unanalyzable": ["바이너리/난독화/외부 SaaS 등 분석 불가 영역"]
  }
}
```

## 스택 감지 시그널 (예시, 확장 가능)

| 시그널 파일/패턴 | 추정 스택 | 기본 명령 매핑 |
|------------------|----------|---------------|
| `requirements.txt`, `pyproject.toml`, `from fastapi` | Python / FastAPI | test: `pytest`, run: `uvicorn main:app` |
| `manage.py`, `from django` | Python / Django | test: `python manage.py test`, run: `python manage.py runserver` |
| `package.json` + `next` | TypeScript / Next.js | build: `npm run build`, test: `npm test` |
| `package.json` + `express` | JavaScript / Express | test: `npm test`, run: `node server.js` |
| `composer.json` + `laravel/framework` | PHP / Laravel | test: `php artisan test`, run: `php artisan serve` |
| `Gemfile` + `rails` | Ruby / Rails | test: `rails test`, run: `rails server` |
| `go.mod` | Go | build: `go build`, test: `go test ./...` |
| `pom.xml` / `build.gradle` | Java / Spring | build: `mvn package`, test: `mvn test` |

감지 실패 시 `stack.framework: "unknown"`로 두고, 파일 확장자 통계 + 디렉토리 구조로 최선 추정하되 `confidence: "low"`로 표기한다. **절대 npm/특정 스택을 기본값으로 가정하지 않는다.**

## .md 요약 동반

JSON과 함께 `site-analysis-map-{id}.md` 사람이 읽는 요약을 생성한다: 스택 1줄 / 기능 목록 표 / 메뉴 트리 / 저신뢰·분석불가 항목 경고.
