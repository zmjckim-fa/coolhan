# Goal (immutable)

run_id: 20260626-security-p1
feature: Security Hardening P1 — Security KB + Security Reviewer agent + Validator stage-6 upgrade + honesty caveat
purpose_fit: |
  CoolHan generates code for users and runs agents with web/MCP/file access, yet security
  is scattered and light (Validator stage 6 = 1 line; no security KB/agent). P1 gives the
  harness a real, evidence-based security review capability so generated code is hardened
  from the first line and reviewed before deploy — serving every CoolHan user.
scope_boundary (P0):
  - P1 ONLY: security KB, security-reviewer agent, validator stage-6 upgrade, two-layer
    honesty caveat, adversarial verification. No P2/P3 items (gates/CI/injection) this run.
  - "Perfect/100% secure" claims are banned; report controls + residual risk separately.
definition_of_done:
  - knowledge_base/00_SECURITY_STANDARDS.md (OWASP/ASVS checklist + acceptance criteria + honesty caveat)
  - agents/security-reviewer.md (threat-model + SAST review, evidence-based, two-layer verdict, deploy gate)
  - validator.md stage 6 references the security KB checklist (not a one-liner)
  - CLAUDE.md team table + change history
  - adversarial verification: vulnerable sample → FAIL(item+loc+fix); clean → PASS; 0 false +/-
