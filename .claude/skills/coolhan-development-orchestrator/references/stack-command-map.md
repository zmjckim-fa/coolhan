# 스택 감지 + 명령 매핑 (GAP-1 수정)

> 트랙4 GAP-1: validator/qa-tester/devops-deployer가 Node/npm 전용 명령(`npm run ...`)을 전제하여
> Python 등 비-Node 스택에서 검증/테스트/배포가 NOT_RUN되는 문제. 해결: **모든 정방향 검증·테스트·배포
> 에이전트는 작업 전 스택을 감지하고, 감지 결과에 맞는 명령으로 치환한다. npm을 기본값으로 가정하지 않는다.**

## 0단계: 스택 감지 (모든 작업의 최우선)

매니페스트/시그널 파일로 스택을 판정한다 (`site-analysis-map-schema.md`의 감지 표와 동일):

| 시그널 | 스택 | install | build | test | run |
|--------|------|---------|-------|------|-----|
| `package.json` | Node (express/next/...) | `npm install` | `npm run build` | `npm test` | `npm start` |
| `requirements.txt` / `pyproject.toml` / `from fastapi` | Python / FastAPI | `pip install -r requirements.txt` | (없음) | `pytest` | `uvicorn main:app` |
| `manage.py` / `from django` | Python / Django | `pip install -r requirements.txt` | `python manage.py collectstatic` | `python manage.py test` | `python manage.py runserver` |
| `composer.json` | PHP / Laravel | `composer install` | (없음) | `php artisan test` | `php artisan serve` |
| `Gemfile` | Ruby / Rails | `bundle install` | `rails assets:precompile` | `rails test` | `rails server` |
| `go.mod` | Go | `go mod download` | `go build` | `go test ./...` | `go run .` |
| `pom.xml` / `build.gradle` | Java / Spring | `mvn install` | `mvn package` | `mvn test` | `mvn spring-boot:run` |

감지 실패 시: 확장자 통계로 최선 추정 + `confidence: low`. **절대 npm을 기본값으로 쓰지 않는다.** 명령 없음(예: Python build)은 억지 매핑 대신 해당 단계 SKIP + 사유 기록.

## 명령 치환 규칙

에이전트 정의에 나오는 `npm run ...` 예시는 **Node 스택 예시일 뿐**이다. 실제 실행 시 감지된 스택의 `command_map`으로 치환한다:

| 추상 동작 | Node 예시 | 치환 대상 |
|-----------|----------|----------|
| 의존성 설치 | `npm install` | command_map.install |
| 빌드 | `npm run build` | command_map.build (없으면 SKIP) |
| 테스트 | `npm test` | command_map.test |
| 린트 | `npm run lint` | 스택별 린터 (ruff/flake8, rubocop, golangci-lint, ...) |
| 실행/기동 | `npm start` | command_map.run |
| 엔드포인트 추출 | `npm run list-endpoints` | 스택별 라우트 스캔 (FastAPI 데코레이터, Django urls.py, ...) |

## NOT_RUN 처리

스택 감지는 됐으나 해당 명령 실행 불가(도구 미설치 등)면 그 단계만 `NOT_RUN` + 사유. 스택 감지 자체가 불가하면 전체 `NOT_RUN`. **단, P0 0단계(기획 의도 검증)는 언어 무관 — 소스/스펙 텍스트 비교이므로 스택과 무관하게 항상 실행한다.**
