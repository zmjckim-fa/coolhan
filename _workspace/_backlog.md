# Backlog — run_id 20260624-doctor-integration

| # | Unit | Files | Verification | Status |
|---|------|-------|--------------|--------|
| U1 | Doctor i18n (KO/EN) | doctor.js | node --check + KO/EN render + resolveLang | ✅ done |
| U2 | Install post-check | install.js | node --check + doctor self-check runs | ✅ done |
| U3 | CI doctor job | .github/workflows/harness-check.yml | job added + summary row + trigger path | ✅ done |
| U4 | Tests + docs + ship | src/__tests__/doctor.test.js, CHANGELOG.md | full jest 22/22 → commit+push | ✅ done |

All units done. Backlog empty → engine complete.
