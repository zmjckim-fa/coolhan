# 00_health_check_system.md — Health Check & Status (foundational infrastructure module)

> **Module classification:** Core / Infrastructure (domain cross-cutting infrastructure)
> **Reason for new module:** Health Check does not belong to a specific business domain (member/order/payment, etc.) but is an infrastructure cross-cutting capability, so it is defined as a new foundational infrastructure module rather than an existing domain module.
> **Source requirement:** `_workspace/01_requirements.md` (Task 1: Intent Analysis)
> **Author:** Task 2 — Spec Writer
> **Version:** v1.0.0
> **Status:** Spec finalized (handoff target for Developer)

---

## 0. Overview

The Health Check & Status module is a **minimal end-to-end slice** that lets external parties verify the system's operational status.
It consists of a backend health check API (`GET /api/health`) and a single status page (`/status`) that calls and renders it.

This module is designed as a verification test feature to actually run and demonstrate the **evidence-based verification pipeline (Task 1-8)** of the Phase D Harness enhancement.
Having no external dependencies (DB/PG/shipping, etc.), it provides a minimal app on which Task 7 (Integration Validator: ports/API) and Task 8 (E2E Tester: UI/responsive) can actually run.

| Item | Description |
|------|-------------|
| Target users | Internal dev/ops teams (for system status monitoring) |
| Platform | Web (backend API + single page, mobile responsiveness required) |
| Scale | Small (health check polling level, single instance) |
| Authentication | Not required (public health endpoint) |
| Core criterion | Not differentiation but **the ability to produce evidence** |

### 0.1 Core Components

| Component | Identifier | Responsibility |
|-----------|------------|----------------|
| Health API | `GET /api/health` | Returns status / uptime / version / timestamp (HTTP 200) |
| Status Page | `GET /status` | Calls and renders the health response, visually indicates normal/abnormal, mobile responsive |

---

## 1. Data Model

This module **does not use persistent data (DB tables).** Health status is computed from runtime in-memory values.
The data model is defined as the API response schema (transport model).

### 1.1 HealthStatus (response model)

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `status` | string (enum) | System status value | `"ok"` |
| `uptime_seconds` | number (int ≥ 0) | Seconds elapsed since process startup | `137` |
| `version` | string | Application version (semver) | `"1.0.0"` |
| `timestamp` | string (ISO-8601, UTC) | Response generation time | `"2026-05-30T12:34:56.000Z"` |

### 1.2 Status Values

> Uses lowercase enums consistent with the global rule `00_STATUS_VALUE_REGISTRY.md`.

| status value | Meaning | HTTP code | Page display |
|--------------|---------|-----------|--------------|
| `ok` | System operating normally | 200 | 🟢 green "Normal" |
| `degraded` | Partial degradation (optional, future extension) | 200 | 🟡 yellow "Caution" |
| `down` | Health response failure/exception | 503 | 🔴 red "Abnormal" |

> In MVP scope, only `ok` is returned. `degraded`/`down` are reserved for future extension, and the client treats unknown status values as abnormal (🔴).

### 1.3 Runtime Status Sources

| Value | Computation method |
|-------|--------------------|
| `uptime_seconds` | `floor((now - process_start_time) / 1000)` |
| `version` | Value injected at build time (environment variable `APP_VERSION` or `package.json` version) |
| `timestamp` | Current UTC time at request processing (ISO-8601) |

---

## 2. API Endpoints

### 2.1 GET /api/health

| Item | Description |
|------|-------------|
| Method | `GET` |
| Path | `/api/health` |
| Authentication | None (public) |
| Request parameters | None (no query/body/header dependencies) |
| Normal response | `200 OK` + `application/json` |
| Abnormal response | `503 Service Unavailable` (if an exception occurs during health computation) |
| Cache | `Cache-Control: no-store` (always real-time status) |

**Normal response body (200):**
```json
{
  "status": "ok",
  "uptime_seconds": 137,
  "version": "1.0.0",
  "timestamp": "2026-05-30T12:34:56.000Z"
}
```

**Abnormal response body (503):**
```json
{
  "status": "down",
  "uptime_seconds": 137,
  "version": "1.0.0",
  "timestamp": "2026-05-30T12:34:56.000Z"
}
```

### 2.2 GET /status

| Item | Description |
|------|-------------|
| Method | `GET` |
| Path | `/status` |
| Authentication | None (public) |
| Response | `200 OK` + `text/html` |
| Behavior | On page load, calls `/api/health` → displays status/uptime/version/timestamp |
| Responsive | Layout must not break at mobile width (e.g., 375px) |

**Displayed elements:**
- Status badge: shows 🟢/🟡/🔴 color according to the `status` value
- `uptime_seconds` counter (optional: human-readable conversion, e.g., "2 min 17 sec")
- `version` text
- `timestamp` text (last checked time)
- On API call failure: 🔴 "Abnormal" + error message displayed

---

## 3. Business Logic

### 3.1 Health Check Response Generation (GET /api/health)
1. Receive request (no input parameters)
2. Compute `uptime_seconds` = `floor((now - process_start_time)/1000)`
3. Look up `version` (environment variable/package version)
4. `timestamp` = current UTC time (ISO-8601)
5. Set `status = "ok"`
6. If an exception occurs in any step above → `status = "down"`, HTTP 503
7. Return JSON response with `Cache-Control: no-store`

### 3.2 Status Page Rendering (GET /status)
1. Page load
2. Asynchronously call `GET /api/health`
3. On response received:
   - `status` value → badge color mapping (`ok`→🟢, `degraded`→🟡, otherwise/failure→🔴)
   - Render `uptime_seconds`, `version`, `timestamp`
4. On call failure (network/timeout/non-200) → display 🔴 "Abnormal" + expose the error reason
5. (Optional) Auto-refresh via periodic polling

### 3.3 Invariants
- `/api/health` **must have no side effects** (read-only, no state changes)
- The response always includes all 4 fields (`status`, `uptime_seconds`, `version`, `timestamp`)
- `uptime_seconds` increases monotonically (resets to 0 on process restart)

---

## 4. Security

### 4.1 Absolute Prohibitions
- **No exposure of sensitive information**: DB credentials, internal hosts/paths, raw environment variables, and stack traces must not be included in the response
- **No exposure of internal diagnostic details**: the public health endpoint exposes only a normal/abnormal level and excludes internal dependency details (connection strings, etc.)
- **No state changes**: the health endpoint does not write any data

### 4.2 Minimize Attack Surface
- No input (GET, no parameters) → minimizes injection (SQL/XSS/command) attack surface
- Authentication not required (public), but the response body is **whitelist-fixed** to the 4 fields above (prevents leakage of additional fields)

### 4.3 Transport/Headers
- HTTPS recommended in production (HTTP allowed in local/test environments)
- Response headers: `Cache-Control: no-store`, `Content-Type: application/json; charset=utf-8`
- (Optional) Rate limit on the health endpoint: defend against excessive polling (e.g., 60 per minute per IP)

### 4.4 Error Messages
- Errors delivered to the client use only generalized messages ("Service unavailable"); raw internal exceptions are not exposed

---

## 5. Test

### 5.1 Unit Tests
- ✅ `uptime_seconds` computes to an integer ≥ 0
- ✅ `timestamp` is a valid ISO-8601 (UTC) format
- ✅ `version` is a non-empty string
- ✅ On the normal path, `status === "ok"`

### 5.2 Integration Tests (Task 7 — Integration Validator target)
- ✅ Server port is LISTENing (evidence: port occupancy check)
- ✅ `curl -i http://<host>:<port>/api/health` → returns HTTP `200` (evidence: response header + body log)
- ✅ Response body includes all 4 fields and `status="ok"`
- ✅ Response Content-Type is `application/json`

### 5.3 E2E Tests (Task 8 — E2E Tester target)
- ✅ `/status` page loads in a real browser (evidence: snapshot/screenshot)
- ✅ Status badge displays as 🟢 (normal)
- ✅ uptime/version/timestamp are rendered on screen
- ✅ Layout does not break at mobile width 375px (evidence: responsive screenshot)

### 5.4 Evidence Deliverables (required)
- Health check response: HTTP status code + JSON body log
- Execution logs: server startup log + request processing log + verification command output
- Result: pass/fail verdict + screenshot/snapshot

---

## 6. Performance

| Metric | Target |
|--------|--------|
| `/api/health` response time | p95 < 50ms (in-memory computation, no I/O) |
| `/status` page initial load | < 1s (local/test baseline) |
| Concurrency | Single instance, meets low polling traffic baseline |

- The health endpoint has no DB/external calls, so it should respond in near-constant time.
- Set the polling interval on the client to not be excessive (recommended: 5-30 seconds).

---

## 7. Deployment

| Item | Description |
|------|-------------|
| Environment | LOCAL / TEST (deployable immediately) |
| Deployment procedure | Deploy via `coolhan-release-orchestrator` or Task 6 DevOps/Deployer |
| Environment variables | `APP_VERSION` (version injection), `PORT` (listen port) |
| Health-based deployment gate | After deployment, `/api/health` must return 200/`ok` to consider deployment successful |
| Rollback trigger | Roll back if 200/`ok` is not met after deployment |

- `/api/health` can be used as a **liveness/readiness probe** for the load balancer/orchestrator.

---

## 8. Monitoring

| Item | Description |
|------|-------------|
| Liveness probe | `GET /api/health` (expects 200/`ok`) |
| Logs | Records server startup time and each health request's response code/processing time |
| Alerts (optional) | Notify the operator after N consecutive non-200 responses |
| Metrics (optional) | Health request count, average/95p response time, abnormal ratio |

- Ensure sensitive information is not included in logs (no credentials/tokens).

---

## 9. Error Handling

| Situation | Handling | Response |
|-----------|----------|----------|
| Normal | status=ok | `200` + JSON |
| Exception during health computation | status=down, generalized message | `503` + JSON |
| API call failure on `/status` | Display 🔴 "Abnormal" + expose the error reason | Page stays `200` (HTML) |
| Unknown status value | Client treats it as abnormal (🔴) | — |
| Invalid path | Standard 404 | `404` |

- Server errors respond with a generalized message instead of the raw internal text, and details are recorded only in the server logs.

---

## 10. Integration Points

### 10.1 Internal
- **Status Page (`/status`) → Health API (`/api/health`)**: the single dependency where the page calls the API
- **Task 6 DevOps/Deployer**: uses the health endpoint as a deployment gate
- **Task 7 Integration Validator**: target for actual curl verification of the port and `/api/health`
- **Task 8 E2E Tester**: target for actual load/responsive verification of the `/status` page

### 10.2 External
- **None** (no external service/DB/PG dependencies — by design)

### 10.3 Dependency Direction
```
[Browser] → GET /status (HTML) → fetch GET /api/health (JSON) → [App Server]
```
- No circular references. It does not depend on other domain modules, and no other module depends on it (infrastructure-independent).

---

## 11. Acceptance Criteria

> Source: finalizes the `acceptance_criteria_seed` from `_workspace/01_requirements.md` into verifiable criteria.

### 11.1 Functional Acceptance Criteria
- ✅ **AC-1**: Calling `GET /api/health` returns HTTP `200` and `status="ok"` — *health check evidence*
- ✅ **AC-2**: The response includes all 4 fields: `status`, `uptime_seconds`, `version`, `timestamp`
- ✅ **AC-3**: `timestamp` is in ISO-8601 format and `version` is included in the response (for evidence tracing)
- ✅ **AC-4**: Execution logs are recorded during server startup/request processing — *execution log evidence*
- ✅ **AC-5**: The `/status` page renders the health response correctly and does not break at mobile width (375px) — *result evidence*

### 11.2 Phase D Verification Acceptance Criteria
- ✅ **AC-6 (Task 7)**: Confirm port LISTEN + confirm actual `curl` 200 response on `/api/health` (evidence attached)
- ✅ **AC-7 (Task 8)**: Confirm actual load of the `/status` page + responsiveness (screenshot/snapshot evidence attached)

### 11.3 Non-functional Acceptance Criteria
- ✅ **AC-8**: The response does not include sensitive information (credentials/internal paths/stack traces)
- ✅ **AC-9**: The health endpoint operates read-only with no side effects

---

## Appendix A. Developer (Task 3) Handoff Notes
- No persistent storage needed — implement in-memory computation only
- Response fields are whitelist-fixed (4 fields)
- A single page is sufficient for `/status`; framework is free (server-render or static+fetch both allowed)
- For evidence production, write server startup/request logs to standard output
