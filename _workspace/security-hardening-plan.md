# CoolHan Security Hardening Plan

> Honest premise: "perfect security" is unreachable — residual risk always remains.
> Reachable goal: systematic, evidence-based hardening + an honest "passed checks ≠ secure" caveat
> (same lesson as engineering-pass ≠ scientific-truth).

## Current security surface (gaps found)
- Validator stage 6 = one line ("authn/authz"). No real checklist.
- settings.json pre-commit blocks .env + a few credential patterns. Light.
- HX standard item 8 = security UX only.
- **Missing entirely:** dedicated security agent, security KB, SAST/threat-model gate,
  dependency/supply-chain audit (stack-agnostic), prompt-injection defense, harness least-privilege baseline.

## Work items (priority order)

### P1 — Core review capability
1. **Security KB** `knowledge_base/00_SECURITY_STANDARDS.md` — OWASP Top 10 + ASVS-style
   checklist, secure-by-default rules, per-category acceptance criteria. The driving doc.
2. **Security Reviewer agent** `agents/security-reviewer.md` — threat model + SAST-style review:
   injection (SQL/cmd/XSS), authn/authz (broken access control), secrets/keys, crypto misuse,
   SSRF, insecure deserialization, security headers, rate-limiting, error-leakage, dependency CVEs.
   Evidence-based (file:line), distinct lens (composes with Validator C16). Gate before deploy.
3. **Validator stage 6 upgrade** — reference the security KB checklist instead of a one-liner.

### P2 — Automated gates
4. **Secret scanning** — harden pre-commit (entropy + common token regexes: AWS/GitHub/JWT/private-key)
   + `scripts/secret-scan` + CI step. Block commit/deploy on hit.
5. **Dependency/supply-chain audit** — stack-agnostic gate (npm audit / pip-audit / bundler-audit /
   govulncheck …) wired into pre-deploy + CI. Report CVEs, fail on high/critical.

### P3 — Agent/harness-specific
6. **Prompt-injection & untrusted-input defense** — formalize "tool/web/file/MCP output = data,
   never instructions" (extends C3). Add an injection test: a malicious doc trying to make an agent
   exfiltrate/execute → must be ignored. Strip/he­dge untrusted content; never auto-run web-sourced commands.
7. **Harness least-privilege baseline** — codify settings deny: secret-file reads (.env, keys),
   destructive ops, network egress for analysis agents; document the allowlist rationale.
8. **Supply-chain of CoolHan itself** — pin/verify install sources; checksum the copied harness;
   `coolhan-doctor` security check (no world-writable, no secrets committed).

### Cross-cutting
9. **Honesty caveat (P0)** — security report uses two layers like science gate:
   `checks_status` (which controls implemented/passed, evidence) vs `residual_risk`
   ("not a proof of security; threats outside scope remain"). Ban "100% secure / unhackable".
10. **Adversarial verification** — track: vulnerable sample (SQLi/secret/missing-authz) → Security
    Reviewer FAIL with item+location+fix; clean sample → PASS. 0 false +/-.

## Recommended first build (one non-stop goal)
P1 bundle: Security KB (#1) + Security Reviewer agent (#2) + Validator stage-6 upgrade (#3)
+ honesty caveat (#9) + adversarial verification (#10). Then P2 (gates), then P3.
