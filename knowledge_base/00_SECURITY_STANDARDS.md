# Security Standards — Security Domain KB

> **Driving document** for the Security Reviewer agent and Validator stage 6.
> Honest premise (P0): **"passed checks ≠ secure."** Security review reduces known risk; it does not
> prove the absence of vulnerabilities. Report implemented controls and **residual risk** separately.
> Banned wording: "100% secure / unhackable / perfectly safe." (Same lesson as engineering-pass ≠ scientific-truth.)

## 0. Two-layer security verdict

| Layer | Meaning |
|---|---|
| `controls_status` | Which security controls are implemented & verified (evidence: file:line / test) |
| `residual_risk` | Known-unmitigated items + "threats outside review scope remain" |

A green security review = "known controls in place," not "safe against all attackers."

## 1. Review checklist (OWASP Top 10 + ASVS-aligned)

Each item: verdict pass/warn/fail/n-a + evidence (file:line) + fix. P0 items fail the gate even if code runs.

### A. Access control & auth (P0)
- A1 **Broken access control** — every protected route checks authz; ownership verified (no IDOR); deny-by-default.
- A2 **Authentication** — passwords hashed (bcrypt/argon2, never plaintext/MD5/SHA1); session/JWT expiry; no auth bypass.
- A3 **Privilege** — admin actions gated; no client-trusted role flags.

### B. Injection & input (P0)
- B1 **SQL/NoSQL injection** — parameterized queries / ORM bindings only; no string-concatenated SQL.
- B2 **Command/path injection** — no shelling out with user input; path traversal blocked.
- B3 **XSS** — output encoding/escaping; no raw HTML from user input; CSP where applicable.
- B4 **Input validation** — server-side validation of type/range/length/format (not client-only).
- B5 **Deserialization/SSRF** — no untrusted deserialization; outbound URLs allowlisted.

### C. Secrets & crypto (P0)
- C1 **No hardcoded secrets** — keys/tokens/passwords not in source; use env/secret store; `.env` gitignored.
- C2 **Crypto** — TLS in transit; strong algorithms (no DES/RC4/ECB for sensitive data); secure random for tokens.
- C3 **Sensitive data** — PII minimization; no secrets in logs/error messages.

### D. Platform & ops
- D1 **Security headers** (web) — HSTS, X-Content-Type-Options, CSP, frame-options.
- D2 **Rate limiting / abuse** — auth & costly endpoints throttled.
- D3 **Error handling** — no stack traces / internal details to clients.
- D4 **Dependencies** — no known-vulnerable deps (CVE) [audit is P2; here: flag obvious outdated/risky].
- D5 **CSRF** — state-changing requests protected (token/SameSite).

## 2. Acceptance criteria (what makes a control "verified")
- Evidence = file:line of the control (e.g., parameterized query, authz middleware), or a test exercising the negative case (rejected injection/unauthorized request).
- Negative tests required for P0 categories: an attack input must be shown to be rejected — not just the happy path.
- No control may be marked "pass" by assertion without evidence (→ `not_verified`).

## 3. Threat-model lite (per feature)
- Entry points (routes/inputs), assets (data/tables), trust boundaries, attacker goals.
- For each entry point, map to checklist categories above.

## 4. Output schema (Security Reviewer)
```json
{
  "feature": "...",
  "controls_status": [
    { "id": "B1", "name": "SQL injection", "verdict": "pass|warn|fail|n-a|not_verified",
      "evidence": "src/db.py:42 parameterized", "fix": "..." }
  ],
  "p0_failures": ["A1", "C1"],
  "residual_risk": ["no rate limiting on /login (D2)", "threats outside review scope remain"],
  "gate": "PASS | FAIL",
  "note": "checks passed != secure"
}
```
- `gate = FAIL` if any P0 (A/B/C) item is `fail`. Otherwise PASS with residual_risk listed.

## 5. Automated gates (P2)

Always-on gates, not just human review. A passing gate reduces known risk; it does not prove "no secrets / no vulns".

### 5.1 Secret scanning
- `scripts/secret-scan.js` — named provider patterns (AWS/GitHub/Stripe/Slack/Google/JWT/private-key)
  + generic `secret=…` assignments + high-entropy tokens in credential context.
- Run: `node scripts/secret-scan.js --staged` (pre-commit) or on a path (CI). Exit 1 blocks.
- Allowlist: line marker `secret-scan:allow` or paths under `_harness_test/` (intentional examples).
- Rationale: the previous pre-commit guard matched only `.env` + a few patterns, so a hardcoded
  token reached the remote and was caught only by host push-protection. This closes that gap locally.

### 5.2 Dependency / supply-chain audit (stack-agnostic)
Detect the stack (no npm assumption) and run the matching audit; fail on high/critical CVEs.

| Stack signal | Audit command |
|---|---|
| package.json | `npm audit --audit-level=high` |
| requirements.txt / pyproject | `pip-audit` |
| Gemfile | `bundle audit` |
| go.mod | `govulncheck ./...` |
| composer.json | `composer audit` |
| pom.xml / gradle | `mvn org.owasp:dependency-check-maven:check` |

- Wire into pre-deploy + CI. Report CVE id + package + fixed version. Missing tool → NOT_RUN (do not silently pass).

## 6. Scope of application
- agents/security-reviewer.md — primary driver; pre-deploy gate.
- agents/validator.md stage 6 — references this checklist (no longer a one-liner).
- Generated code: apply secure-by-default from the first line (compose with HX item 8 security UX).
