# Track 18 — G6 Provision-Check Adversarial Verification

Real `node scripts/provision-check.js` invocations. All exit codes/output below are actual, not simulated. Fixture: `withenv/.env.example` declares `DATABASE_URL=` and `API_SECRET_KEY=`; `noenv/` has no example file.

| # | Case | Env set | Expected | Actual | Verdict |
|---|------|---------|----------|--------|---------|
| 1 | All required present | `DATABASE_URL=postgres://prodhost/db`, `API_SECRET_KEY=sk-live-abc123XYZ` | exit 0, ok=true, missing=[] | exit=0, `missing: []`, `ok: true` — neither secret value appears anywhere in JSON output | PASS |
| 2 | One missing | only `DATABASE_URL` set | exit 1, missing=["API_SECRET_KEY"], no leaked value | exit=1, `missing: ["API_SECRET_KEY"]`; `present` lists key names only, no values in any field | PASS |
| 3 | No `.env.example`/`.env.sample` present | n/a | exit 0, nothing required | exit=0, `example_file: null`, `required: []`, `ok: true` | PASS |
| 4 | Present-but-empty-string | `DATABASE_URL` set, `API_SECRET_KEY=""` | treated as missing, exit 1 | exit=1, `missing: ["API_SECRET_KEY"]` | PASS |

## Secret-leak check
Across all 4 cases, the actual env values used (`postgres://prodhost/db`, `sk-live-abc123XYZ`) were grepped against every JSON output produced — **zero matches**. Only key names (`DATABASE_URL`, `API_SECRET_KEY`) and boolean presence appear in `required`/`present`/`missing`. This holds by construction: `evaluate()` in scripts/provision-check.js never reads `env[key]` into an output field, only checks `!== undefined && !== ''` and pushes the *key name* to present/missing.

## Wiring review
`.claude/agents/execution-runner.md` Step 0 runs provision-check before install/test/run; missing required env → NOT_RUN with reason `"missing required env: KEY1, KEY2"`, explicitly distinct from "tool not installed" (G1) and from a code-level FAILED (Validator). Entry gate item 2️⃣ and the Error Handling table both cite this. `provision_check` field added to the exec-evidence JSON shape.

## Tally
False positives: 0 / False negatives: 0 (4/4 cases correct, 0 leaks across all cases)

**Overall: PASS.**
