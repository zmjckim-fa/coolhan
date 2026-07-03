# Backlog — run_id 20260626-security-p3

| # | Unit | Files | Verification | Status |
|---|------|-------|--------------|--------|
| U1 | Injection-defense reference | references/prompt-injection-defense.md | rule + do/don't + examples | ✅ done |
| U2 | Rule injection into 4 agents | site-analyzer, developer, security-reviewer, cryptanalyst | each references the defense doc | ✅ done |
| U3 | Least-privilege baseline | 00_SECURITY_STANDARDS.md §6 (+ settings.local deny match) | deny baseline documented + matches settings | ✅ done |
| U4 | Docs | CLAUDE.md | change-history entry | ✅ done |
| U5 | Adversarial verify | _harness_test/track12-injection/ | injected→refused(performed=false)/benign→processed, 0 FP/FN | ✅ done |

All units done. Backlog empty → engine complete. (Self-audit: scope ⊆ goal; no product features added.)
