# CoolHan — Session Handoff (cross-account resume)

> **One-line command to continue in any new session (any account) after cloning the repo:**
>
> ```
> HANDOFF.md 읽고 CoolHan 하네스 이어서 개발하라
> ```
> (English: `Read HANDOFF.md and continue developing the CoolHan harness`)
>
> That single line is enough: this file names the current state, the rules, every gate, and the
> exact next actions. Read it top to bottom, then resume from § Next actions.

---

## 1. What this repo is

CoolHan — a specification-driven, multi-agent, **non-stop** development harness that runs inside
Claude Code. It is the *product* (the harness itself), not an app built with it. Forward pipeline
(intent→spec→code→validate→QA→deploy) + reverse/reuse (analyze→modularize→reapply) + 15 mechanical
gates (G1–G15) + 3 Claude Code hooks that enforce the non-stop loop at the harness level.

- **Repo / remote:** `https://github.com/zmjckim-fa/coolhan.git` (branch `main`)
- **Current version:** `2.2.1` (package.json = git tag `v2.2.1` = CHANGELOG top = GitHub releases/latest, all aligned)
- **Test suite:** `npx jest` → **203 tests, 24 suites, all pass** (~6 min; the G15 HTTP-probe suite adds ~10s of real timeouts, so a 240s tool timeout is too short — run it backgrounded)
- **Related production site:** `https://coolhanx.com` (a SEPARATE repo/server — hardened via G15; see § Server access)

## 2. Absolute working rules (read before doing anything)

These are enforced in `CLAUDE.md` and by hooks — a new session inherits them by reading CLAUDE.md,
but they are restated here so nothing is missed:

1. **Zero prose while working.** No narration between tool calls. The only chat output of a work
   run is ONE final report, **≤5 lines**; overflow goes to a file, chat carries the path.
2. **Never stop to ask** except the 4 Auto-Pilot conditions: (1) a real credential/secret is
   required and none exists, (2) payment/real-world cost, (3) irreversible production-data
   deletion, (4) mutually-incompatible requirements. Otherwise pick the safest default, log it in
   `docs/DECISIONS.md`, and keep going. To stop legitimately, write
   `_workspace/_stop-approved.json {"reason":"..."}` first (the Stop hook enforces this).
3. **No fake completion.** `verified` needs a captured execution result. No TODO/placeholder/dead
   buttons in code claimed done (`node scripts/no-placeholder-check.js <paths>`).
4. **Every feature ships the same way** (see § Per-feature ritual).
5. **Forbidden zones** (never auto-edit — operator approval only): nginx / apache config, docker
   compose, `SECRET_KEY`, other services, and any coolhanx.com **server file** the deploy script
   doesn't ship.

## 3. The gates (G1–G15) — what already exists

Full detail: `CLAUDE.md` Change History + `.claude/skills/coolhan-development-orchestrator/references/ai-native-sdlc-map.md`.

| Gate | Script | Purpose |
|---|---|---|
| G1 execution | `scripts/exec-runner.js` | run real code, capture exit/output (no simulation) |
| G2 traceability | `scripts/trace-check.js` | every requirement has ≥1 passing bound test |
| G3 plan quality | `scripts/plan-check.js` | deps acyclic, verifies present, coverage — pre-dev |
| G4 regression | `scripts/regression-check.js` | baseline diff, pre-deploy |
| G5 ledger | `scripts/ledger.js` | append-only run ledger + recurring-lesson surfacing |
| G6 provisioning | `scripts/provision-check.js` | env/secret readiness (names only, never values) |
| G7 orchestrator | `scripts/gates.js` | runs G6→G1→G2→G4 in order, honest short-circuit |
| G8 context+completion | `scripts/context-check.js`, `completion-check.js` | ingest full context; 100%-done gate |
| G9 parallel | `scripts/parallel-plan.js` | dependency+file-disjoint waves for parallel workers |
| G10 agent loop | `scripts/agent-loop.js` | mechanical run→observe→feedback→re-run, resumable |
| G11 loop enforcement | `.claude/hooks/stop-guard.js`, `ask-guard.js`, `run-armer.js` | harness-level non-stop (see § Hooks) |
| G12 observability | `scripts/run-report.js` | one report: backlog%, gate outcomes, loop, lessons |
| G13 nonstop supervisor | `scripts/nonstop.js` | relaunches headless sessions until complete |
| G14 commercial readiness | `scripts/commercial-gate.js` + `agents/commercial-readiness-auditor.md` | 5 user-facing criteria × real-HTTP keepers |
| G15 edge/bot hardening | `scripts/hardening-check.js` | 7 real-HTTP holes (AI-agent/fingerprint/404/UA/robots/automation/search-preserve) |

Also: prompt-modernization lint (`scripts/prompt-modernization-check.js`), design-excellence gate
(`scripts/design-quality-check.js`), secret-scan (`scripts/secret-scan.js`), doctor (`doctor.js`).
Adversarial verification for each gate lives in `_harness_test/trackNN-*/` (all 0 false +/-).

## 4. The non-stop loop (how "무중단 개발" actually works now)

Three layers, all mechanical:
- **Within a unit:** G10 iterates fix→re-run until DONE/ESCALATE.
- **Within a session:** G11 hooks (`.claude/settings.json` → Stop + PreToolUse + UserPromptSubmit)
  block turn-end and deny AskUserQuestion while the backlog is incomplete; `run-armer.js` arms
  `_workspace/_run-active.json` automatically when the user issues a CoolHan continuous-dev command.
- **Across sessions (unattended, from a terminal):**
  ```
  node scripts/nonstop.js
  ```
  Relaunches `claude -p "쿨한으로 개발 이어서 진행하라" --permission-mode bypassPermissions` until
  `completion-check` exits 0. Stops only on COMPLETE(0)/CMD_ERROR(2)/STOP_APPROVED(3)/
  NO_PROGRESS(4)/MAX_SESSIONS(5). Per-session log: `_workspace/_nonstop-log.jsonl`.

## 5. Per-feature ritual (do this for EVERY change — non-negotiable)

1. Implement the smallest coherent unit.
2. `npx jest <new test file>` then the full suite (backgrounded) → must be green.
3. `node scripts/prompt-modernization-check.js .claude/agents .claude/skills` → clean.
4. `node scripts/no-placeholder-check.js <changed paths>` → clean.
5. Write an adversarial track under `_harness_test/trackNN-<name>/` proving 0 false +/-.
6. Bump `package.json` version + add a `CHANGELOG.md` entry + a `CLAUDE.md` Change History row +
   the SDLC-map row if it's a new capability.
7. `git add -A && node scripts/secret-scan.js --staged` (must be clean) → commit (heredoc `-F`,
   never the `@'...'@` construct) → `git tag -a vX.Y.Z -m "..."` → `git push origin main --follow-tags`.
8. Confirm via GitHub API: release.yml success + `releases/latest` = new tag + harness-check/test green.

Commit attribution line to use: `Co-Authored-By: Claude <noreply@anthropic.com>` (match the
session's stated attribution).

## 6. Credentials & server access — what must be re-supplied in the new account

**No secrets are stored in this repo (secret-scan enforces it).** A new account/session must
provide its own credentials in its own environment — they do NOT travel in this file:

| Capability | What the new operator supplies | Where |
|---|---|---|
| GitHub push | Auth for `github.com/zmjckim-fa/coolhan` (write) — the account must be a collaborator, or fork + change the remote | `git remote set-url origin …` / `gh auth login` / PAT |
| npm publish (optional; currently failing) | `NPM_TOKEN` repo secret with publish scope — `coolhan-builder` has never been published, so this is the first publish | GitHub → Settings → Secrets → Actions → `NPM_TOKEN` |
| coolhanx.com deploy/upload | The production server's SSH/deploy credentials (used by that site's `deploy.py`) | Kept on the operator's machine / the coolhanx.com repo — **never commit them** |
| coolhanx.com server-file fixes (e.g. remaining X-Powered-By) | Operator approval + server access (web-server `Header unset` OR the server's `next.config.js`) — a **forbidden zone** for unattended edits | manual, operator-run |

> **The one pending coolhanx.com item:** `X-Powered-By` / `x-nextjs-cache` still leak. The durable
> fix is a server-file change the deploy script doesn't ship (forbidden zone) → operator-approval
> pending. `/_next/` asset paths reveal Next.js regardless, so this is finishing work, not
> concealment. Decide web-server `Header unset` vs server `next.config.js`, then:
> backup → deploy → `node scripts/hardening-check.js https://coolhanx.com` re-measure → rollback on fail.

## 7. Next actions (resume here)

1. **(Optional) npm publish** — set `NPM_TOKEN` (§6), then the next tag push publishes; or run
   the publish workflow manually. Until then the publish.yml failure is expected and non-blocking.
2. **(Operator-gated) coolhanx.com X-Powered-By** — pick web-server vs server next.config.js, apply
   on the server with backup, re-measure with `scripts/hardening-check.js`. This is on the
   coolhanx.com side, not this repo.
3. **Continue harness enhancement** — the user's standing pattern is "더 고도화하라 / 이어서
   진행하라". Pick the next real gap (candidates: RAG upgrade from file-KB to vector search;
   Observability dashboard vs the current JSONL/markdown report), follow the § Per-feature ritual.
4. **Any coolhanx.com feature/commercial-readiness work** — run
   `node scripts/commercial-gate.js <config.json>` and
   `node scripts/hardening-check.js https://coolhanx.com` from that site's repo (write per-menu
   keepers there; keeper-less criteria are NOT_RUN, never PASS).

## 8. Verify state on arrival (paste-run)

```bash
git log --oneline -3
node -e "console.log('pkg', require('./package.json').version)" && git describe --tags --abbrev=0
npx jest --ci   # background it; expect 203 passed / 24 suites
node doctor.js
```

If those four agree (version = v2.2.1, tests green, doctor healthy), the handoff is intact and you
may proceed from § Next actions.
