# Stack Detection + Command Mapping (GAP-1 Fix)

> Track4 GAP-1: validator/qa-tester/devops-deployer assumed Node/npm-only commands (`npm run ...`),
> causing validation/testing/deployment to become NOT_RUN on non-Node stacks such as Python. Fix: **every forward-direction validation/test/deploy
> agent detects the stack before working, and substitutes commands matching the detection result. It does not assume npm as the default.**

## Step 0: Stack Detection (top priority for all work)

Determine the stack from manifest/signal files (same as the detection table in `site-analysis-map-schema.md`):

| Signal | Stack | install | build | test | run |
|--------|------|---------|-------|------|-----|
| `package.json` | Node (express/next/...) | `npm install` | `npm run build` | `npm test` | `npm start` |
| `requirements.txt` / `pyproject.toml` / `from fastapi` | Python / FastAPI | `pip install -r requirements.txt` | (none) | `pytest` | `uvicorn main:app` |
| `manage.py` / `from django` | Python / Django | `pip install -r requirements.txt` | `python manage.py collectstatic` | `python manage.py test` | `python manage.py runserver` |
| `composer.json` | PHP / Laravel | `composer install` | (none) | `php artisan test` | `php artisan serve` |
| `Gemfile` | Ruby / Rails | `bundle install` | `rails assets:precompile` | `rails test` | `rails server` |
| `go.mod` | Go | `go mod download` | `go build` | `go test ./...` | `go run .` |
| `pom.xml` / `build.gradle` | Java / Spring | `mvn install` | `mvn package` | `mvn test` | `mvn spring-boot:run` |

On detection failure: best-effort estimate from extension statistics + `confidence: low`. **Never use npm as the default.** When a command is absent (e.g. Python build), SKIP that step + record the reason instead of forcing a mapping.

## Command Substitution Rules

The `npm run ...` examples in agent definitions are **merely Node-stack examples**. At actual execution time, substitute with the detected stack's `command_map`:

| Abstract action | Node example | Substitution target |
|-----------|----------|----------|
| Install dependencies | `npm install` | command_map.install |
| Build | `npm run build` | command_map.build (SKIP if absent) |
| Test | `npm test` | command_map.test |
| Lint | `npm run lint` | per-stack linter (ruff/flake8, rubocop, golangci-lint, ...) |
| Run/start | `npm start` | command_map.run |
| Endpoint extraction | `npm run list-endpoints` | per-stack route scan (FastAPI decorators, Django urls.py, ...) |

## NOT_RUN Handling

If the stack was detected but the corresponding command cannot run (tool not installed, etc.), mark only that step `NOT_RUN` + reason. If stack detection itself is impossible, mark the whole as `NOT_RUN`. **However, P0 step 0 (planner-intent verification) is language-agnostic — since it is a source/spec text comparison, it always runs regardless of stack.**
