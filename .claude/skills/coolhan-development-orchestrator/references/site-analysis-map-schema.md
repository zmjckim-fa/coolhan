# Site Analysis Map — Data Schema Standard

> The standard for the structured deliverable that the Site Analyzer (reverse R1) produces by reverse-engineering existing site code.
> This map is the input to the Module Extractor (R2) and is the first-pass deliverable for turning "code back into spec."

## Core Principles

1. **stack-agnostic** — Do not presume a specific package manager/framework. First detect the stack, then branch the extraction strategy based on the detection result. (Track 4 GAP-1 lesson)
2. **Evidence required** — Every extracted item carries `evidence` (file path + line/symbol). Items without evidence are marked `confidence: "low"` or excluded.
3. **No inference** — Do not add features absent from the code on grounds that they "seem likely." Record only what is found (reverse application of the P0 spirit).

## JSON Schema

```json
{
  "analysis_id": "{timestamp}",
  "target": {
    "path": "root path of the analysis target",
    "name": "site/project name",
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
      "install": "detected install command (e.g., pip install -r requirements.txt)",
      "build": "detected build command or null",
      "test": "detected test command (e.g., pytest)",
      "run": "detected run command (e.g., uvicorn main:app)"
    }
  },
  "routes": [
    {
      "method": "GET | POST | PUT | PATCH | DELETE",
      "path": "/api/...",
      "handler": "function/controller name",
      "auth_required": true,
      "evidence": "src/routes/order.py:42",
      "confidence": "high | medium | low"
    }
  ],
  "data_models": [
    {
      "name": "table/entity name",
      "fields": [{ "name": "...", "type": "...", "nullable": false }],
      "relations": [{ "to": "other model", "kind": "1:N | N:1 | N:M | 1:1" }],
      "evidence": "src/models/order.py:10",
      "confidence": "high"
    }
  ],
  "components": [
    {
      "name": "component/view/template name",
      "kind": "page | partial | layout | api-only",
      "renders": ["data models/endpoints used"],
      "evidence": "templates/order_list.html | src/components/OrderList.tsx:1",
      "confidence": "medium"
    }
  ],
  "menu_tree": [
    {
      "label": "menu name",
      "route": "/orders",
      "children": [{ "label": "Order Detail", "route": "/orders/:id" }],
      "evidence": "src/nav.py:5 | templates/base.html:30",
      "confidence": "medium"
    }
  ],
  "features": [
    {
      "id": "F-01",
      "name": "feature name (e.g., Create order)",
      "description": "one-line description",
      "routes": ["POST /api/orders"],
      "models": ["orders", "order_items"],
      "components": ["OrderForm"],
      "depends_on": ["F-02 (member authentication)"],
      "evidence": ["src/routes/order.py:42", "src/models/order.py:10"],
      "confidence": "high"
    }
  ],
  "integration_points": [
    {
      "type": "external_api | payment_gateway | message_queue | cron | webhook",
      "name": "e.g., Stripe",
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
    "unanalyzable": ["unanalyzable areas such as binaries/obfuscation/external SaaS"]
  }
}
```

## Stack Detection Signals (examples, extensible)

| Signal file/pattern | Inferred stack | Default command mapping |
|------------------|----------|---------------|
| `requirements.txt`, `pyproject.toml`, `from fastapi` | Python / FastAPI | test: `pytest`, run: `uvicorn main:app` |
| `manage.py`, `from django` | Python / Django | test: `python manage.py test`, run: `python manage.py runserver` |
| `package.json` + `next` | TypeScript / Next.js | build: `npm run build`, test: `npm test` |
| `package.json` + `express` | JavaScript / Express | test: `npm test`, run: `node server.js` |
| `composer.json` + `laravel/framework` | PHP / Laravel | test: `php artisan test`, run: `php artisan serve` |
| `Gemfile` + `rails` | Ruby / Rails | test: `rails test`, run: `rails server` |
| `go.mod` | Go | build: `go build`, test: `go test ./...` |
| `pom.xml` / `build.gradle` | Java / Spring | build: `mvn package`, test: `mvn test` |

On detection failure, set `stack.framework: "unknown"` and make a best-effort estimate from file-extension statistics + directory structure, but mark it `confidence: "low"`. **Never assume npm/a specific stack as the default.**

## Accompanying .md Summary

Along with the JSON, generate a human-readable summary `site-analysis-map-{id}.md`: one-line stack / feature list table / menu tree / warnings for low-confidence and unanalyzable items.
