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
(intent→spec→code→validate→QA→deploy) + reverse/reuse (analyze→modularize→reapply) + 25 mechanical
gates (G1–G25) + 3 Claude Code hooks that enforce the non-stop loop at the harness level.

- **Repo / remote:** `https://github.com/zmjckim-fa/coolhan.git` (branch `main`)
- **Current version:** `2.12.9` (package.json = git tag `v2.12.9` = CHANGELOG top = GitHub releases/latest, all aligned)
- **Test suite:** `npx jest` → **449 tests, 40 suites, all pass** (under a minute on an idle machine, several minutes on a loaded one; the G15 HTTP-probe suite adds ~10s of real timeouts, so a 240s tool timeout is too short — run it backgrounded)
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

## 3. The gates (G1–G25) — what already exists

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
| G16 companion skills | `scripts/companion-skills-check.js` | presence probe for the 12 vendored maker-side skills (web-clone added v2.5.1) (advice ≠ gate evidence) |
| G17 self-growth | `scripts/self-growth.js` | mines own ledger/decisions/run-reports/tracks → ranked self-growth backlog feeding the loop |
| G18 session learning | `scripts/harvest-sessions.js` | this account's sessions → masked private store + DIGEST/brief (SessionStart/End hooks); G17 reads it |
| G19 AI architecture | `scripts/ai-arch-check.js` + `knowledge_base/00_AI_ARCHITECTURE_PRINCIPLES.md` | right brain for the right task: code → Decision Model → LLM → human; calls only in services/ai, schema-validated output, §14 record, threshold in code, AI never acts |
| G20 minimal source · single source · ledger | `scripts/progress-check.js` + `scripts/checks-run.js` + `scripts/single-source-check.js` + `knowledge_base/00_MINIMAL_SOURCE_PRINCIPLES.md` | 제0 규칙 중복 0 · S1–S8 one place each · `docs/PROGRESS.md` is the truth (완료 only with evidence) · `docs/CHECKS.md` fixed list run in full (통과·실패(D)·확인 안 함) · ratchet baseline `docs/SINGLE_SOURCE_BASELINE.json` (C7 runs with `--skip-dirs docs`) |
| G22 field lessons | `scripts/field-lessons.js` + `knowledge_base/field-lessons.json` → `knowledge_base/00_FIELD_LESSONS.md` | one registry of failure patterns and working practices from every project built: derived doc, per-agent list, plan-time 실패 방지 대응표 (`plan-doc-check --lessons`), data-driven code scan with ratchet; exit 4 = nothing scanned |
| G24 orders for every session | `scripts/install-global.js` + `knowledge_base/project-kit/GLOBAL.md.tpl` + `new-project.js --check` | one managed block in the user-level instruction file: registry-derived orders, harness location, "no kit in this folder, install it first"; `--check` 0 current / 1 stale / 4 not installed; `--remove` restores the file; settings untouched; kit drift check per project |
| G23 standing orders + project kit | `scripts/new-project.js` + `knowledge_base/project-kit/` + registry `orders` + `scripts/handoff-write.js` + `plan-doc-check --modules` | the commands the operator repeated per project (continue, verify, plan first, module library first, commit per unit, deploy by setting, handoff) installed once into a new or existing folder with loop hooks, ledger, fixed checks and a module plan; gates and hooks run from the harness through `scripts/coolhan.js`; existing files are never overwritten |
| G21 planning document | `scripts/plan-doc-check.js` + `knowledge_base/00_PLANNING_DOC_STANDARD.md` | the user's 기획서 제작 마스터 프롬프트 (generalized, `{{ }}` slots): §7 completion definition mechanical — 추적표 no blank, no blank cell, no deferral word outside [결정필요], [미검증] with method, tooltip ≤10 어절, no em dash/hype word, diagram files exist, no ID with two names, §4.2 twelve items, success criteria ≥3; form only |
| G25 modules as plug-ins | `scripts/module-check.js` + `scripts/modules.js` + `scripts/module-admit.js` + `scripts/module-db-check.js` + `scripts/module-convert.js` + `knowledge_base/00_MODULE_STANDARD.md` | the module standard (name, same subfolders, file names, manifest, own tables, tests, security note) checked mechanically; `modules list / add / status / update / remove` from any project folder; `modules drift` finds modules whose source project moved on; the library holds standard modules under `modules/<name>/` |

Also: prompt-modernization lint (`scripts/prompt-modernization-check.js`, 9 rule families incl. the Claude-5-era
ones added in v2.5.0; agent footers carry a role-based `**Effort:**` tier — see
`references/model-capability-map.md` §3), design-excellence gate
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
7. `git add <your own paths> && node scripts/secret-scan.js --staged` (must be clean; stage by path, never the
   whole tree: other sessions work in this folder too, field lesson F-09) → commit (heredoc `-F`,
   never the `@'...'@` construct) → `git tag -a vX.Y.Z -m "..."` → `git push origin main --follow-tags`.
8. Confirm via GitHub API: release.yml success + `releases/latest` = new tag + harness-check/test green.

Commit attribution line to use: the trailer the running session states (e.g.
`Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>` on 2026-10-11) — match the session, do not hardcode.

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

0. **Read `docs/PROGRESS.md` first (G20 §9)** — its goal line, current position, assumptions and open D-numbers
   are the truth over this file's prose; this repo's own work now moves through that ledger and `docs/CHECKS.md`.

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
npx jest --ci   # background it; expect 449 passed / 40 suites
node scripts/checks-run.js   # the fixed list (docs/CHECKS.md) — the G20 way to "verify"; C1 is the slow one
node scripts/progress-check.js docs/PROGRESS.md   # this repo's ledger: current position + open D-numbers
node doctor.js
```

If those agree (version = v2.12.9, tests green, doctor healthy, ledger PASS), the handoff is intact and you
may proceed from § Next actions.


---
## 인수인계 보강 (2026-09-25)

> 위 본문(2026-09-12, v2.2.1)에 없는 내용만 보강. 비밀값은 기록하지 않음(위치·변수명만).

### 현재 상태 (2026-09-25 확인)
- 워킹트리 clean, `main` = `931685e`(HANDOFF.md 추가), 최신 태그 `v2.2.1`. 9/12 이후 코드 변경·커밋 없음 → 위 §7 Next actions 그대로 유효.
- 로컬 git 커밋 identity: `CoolHan Builder <dev@coolhanbuilder.com>` (repo 로컬 설정).

### "배포"의 의미 (이 repo는 서버 배포 없음)
- 이 repo 배포 = **GitHub에 태그 push → Actions가 GitHub Release 생성**. 서버/SSH/scp/pm2 없음. `Dockerfile`·`docker-compose.yml`·`python-api.yml`은 샘플 Python API용이며 실제 운영 배포 경로 아님.
- 절차(§5-7 요약): `git add <내 경로> && node scripts/secret-scan.js --staged` → 커밋 → `git tag -a vX.Y.Z -m "..."` → `git push origin main --follow-tags`
- 워크플로 (`.github/workflows/`):
  - `release.yml` — 트리거 `v*.*.*` 태그 push(또는 수동) → `softprops/action-gh-release`로 릴리스 + `coolhan-vX.Y.Z.tar.gz` 첨부. 시크릿: 기본 `GITHUB_TOKEN`만.
  - `publish.yml` — main push(package.json/install.*/.claude/**/knowledge_base/** 변경 시) → `npm publish --access public`. 시크릿 `NPM_TOKEN` 필요(**미설정 → 실패가 정상**). 패키지명 `coolhan-builder`(미배포 상태).
  - `notify-release.yml`, `test.yml`, `harness-check.yml` — `GITHUB_TOKEN`만 사용.
- 검증(네트워크): `https://api.github.com/repos/zmjckim-fa/coolhan/releases/latest` 의 tag_name = 새 태그인지, Actions 탭에서 release/test/harness-check 녹색인지.
- 사용자 측 확인: 다른 Claude 세션에서 `쿨한 업데이트 확인해` → 새 버전 감지(`scripts/check-update.js`).

### 접속정보 위치 (값 미기재)
| 용도 | 위치 | 이름 |
|---|---|---|
| GitHub push (`zmjckim-fa/coolhan`) | Windows 자격 증명 관리자 (git `credential.helper=manager`, 시스템 gitconfig) 또는 `gh auth login` | git:https://github.com 항목 |
| npm publish | GitHub repo → Settings → Secrets → Actions | `NPM_TOKEN` (미설정) |
| 로컬 샘플 API | `C:\sites\CoolHan builder\.env` | `DATABASE_URL`, `API_HOST`, `API_PORT`, `ENVIRONMENT`, `DEBUG`, `ECHO_SQL`, `API_TITLE`, `API_VERSION` (비밀 없음) |
| docker 샘플 | 환경변수 (미설정 시 compose 기본값 사용) | `POSTGRES_PASSWORD`, `SECRET_KEY` |
| coolhanx.com 서버 | 이 repo 밖 (해당 사이트 repo의 `deploy.py`) | — |
- `~/.ssh` 키(cleanlab_ed25519, cleanwine_deploy, id_ed25519, id_rsa, sk24_deploy)는 **이 repo 배포에 사용되지 않음**. 트랜스크립트의 `~/.ssh/id_staging`, `id_prod`, `staging.kleinanzeigen.co.kr:2222` 는 문서 샘플(가상 예시)이며 실제 서버 아님.

### 함정
- 전체 jest(~6분)는 반드시 백그라운드 실행(도구 타임아웃).
- 커밋 메시지는 heredoc `-F` 사용, PowerShell `@'...'@` 금지(§5).
- `publish.yml` 실패 알림은 `NPM_TOKEN` 설정 전까지 무시 가능.
- `coolhan.db`, `.env`는 .gitignore 대상(커밋 금지).

### 확인 필요
- 새 계정의 GitHub 사용자가 `zmjckim-fa/coolhan`에 write 권한이 있는지 (없으면 collaborator 추가 또는 fork 후 remote 변경).
- coolhanx.com 사이트의 로컬 repo 경로·서버 host/user/SSH 키 — 트랜스크립트에 기록 없음. 해당 사이트 폴더의 자체 인수인계 문서/`deploy.py` 확인 필요.
- npm 배포를 실제로 할지 여부 및 `NPM_TOKEN` 발급 주체.

---
## 인수인계 보강 (2026-11-10) — Globe Cam PRD v2 세션 컨텍스트

### Globe Cam 프로젝트 개요
3D 글로브 + 공개 CCTV/웹캠 플랫폼. 환경음·여행·발견 시청 목적의 ambient 서비스.

**아티팩트 URL:** `https://claude.ai/artifact/27RwSqy3bvuSvYzpPaq8tg` (Version 4, `1793911707-e448`)
**스크래치패드 파일:** `C:\Users\CleanLAB\AppData\Local\Temp\claude\4e9a0f613a734e62\1aeb3fc2-f963-4e42-a49c-dbcd16386e2a\scratchpad\channel-plan-v2.html`

### PRD v2 탭 구성 (11개)
| 탭 | 내용 |
|---|---|
| p0 개요 | 마케팅 랜딩 — 히어로·3단 카드·CTA |
| p1 플레이어 UX | 9-state 상태머신 (idle/loading/playing/prebuffering/transitioning/paused/skipped/cam_offline/queue_empty) |
| p2 채널 시스템 | 큐 스코어링: 태그 Jaccard 0.40 + 연속성 0.25 + 무드 0.20 + 신선도 0.10 + 인기 0.05 |
| p3 포인트 경제 | append-only point_ledger, 5계층 어뷰징 차단, 100P=$0.10 할인(최대 50%) |
| p4 크리에이터 | World Pass 전용 채널 생성, 트렌딩: Wilson Score×0.6 + watch_min×0.3 + subscribers×0.1 |
| p5 데이터 모델 | PostgreSQL 스키마: users/subscriptions/channels/channel_queue/webcam_sources/point_ledger 등 |
| p6 API 명세 | REST + SSE 엔드포인트, JWT 프록시 토큰(30s TTL) 아키텍처 |
| p7 상업 전략 | Free/Explorer $2.99/mo/World Pass $5.99/mo, Stripe Billing |
| p8 글로벌·법무 | 다국어 i18n, GDPR/CCPA, 저작권 |
| p9 기술 아키텍처 | Next.js 15 + Vercel Edge + Supabase + Vercel Blob, Aurora UI 디자인 토큰 |
| p10 광고 시스템 | Google AdSense + GAM 직접 배너, 유료 완전 광고 없음 |

### 핵심 하드 제약 (다음 세션에서 반드시 유지)
1. **한국 특화 (TOPIS·날씨누리·ITS) 하지 않는다** — 글로벌 소스만
2. **여러 나라 국가 언어로 만든다** — 완전 다국어/글로벌
3. **웹캠 소스 URL이 방문자에게 절대 노출되면 안 된다** — 서버사이드 JWT 토큰(30s TTL)으로만 제공

### URL 프록시 보안 아키텍처 (핵심)
```
// GET /api/session → ad_eligible: !session || session.user.tier === 'free'
// GET /api/stream-token?channel_id=xxx
//   - 서버가 source_url 조회 → JWT {source_url, exp: now+30} 서명 → 토큰만 반환
//   - 클라이언트는 /api/proxy?token=xxx 로 스트리밍 (source_url 미노출)
```

### 광고 시스템 아키텍처 (p10)
```typescript
// 서버 → 클라이언트 ad_eligible 필드
// app/layout.tsx: 유료 사용자면 AdSense 스크립트 로드 자체 안 함
{user.ad_eligible && <Script src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js" strategy="afterInteractive" />}

// 플레이어 광고 형식:
// - Pre-roll: 세션 최대 2회, 30분 간격, 5초 스킵 가능 (IMA SDK)
// - Mid-roll: 채널 전환 5회마다 3초 오버레이
// - L-Banner: 하단 20% 오버레이, opacity 0.85, 15초
```

### DB 스키마 추가분 (p10)
```sql
CREATE TABLE ad_impressions (id BIGSERIAL, slot_id TEXT, page_type TEXT, country_code CHAR(2), channel_id UUID, date DATE, hour SMALLINT, impressions INT, clicks INT);
CREATE TABLE consent_records (user_id UUID, region TEXT, personalized BOOLEAN DEFAULT false, consented_at TIMESTAMPTZ, PRIMARY KEY(user_id, region));
```

### 웹캠 리서치 파일
- `docs/world-webcam-research/sources-db.json` — 30개 웹캠 소스, 9개 카테고리 (빈 디렉토리; 파일은 이전 세션 스크래치패드에 생성됐으나 프로젝트에 저장 안 됨)
- `docs/world-webcam-research/webcam-taxonomy.json` — 10차원 D1–D10, 109개 분류 태그 (동일)

### 다음 세션 작업 후보
1. **Globe Cam 실제 구현 시작** — `C:\sites\cctv` 디렉토리에서 작업 (`git init` 또는 Next.js 프로젝트 생성)
   - 우선순위: 플레이어 컴포넌트 + JWT 프록시 API
2. **웹캠 소스 JSON 재생성** — 이전 세션에서 만든 sources-db.json(30개) + taxonomy.json을 새 세션에서 재생성해 `docs/world-webcam-research/`에 저장
3. PRD artifact는 위 URL에서 계속 열람 가능

### 커밋 정보
- 커밋 `0073f6b`: docs 디렉토리 + backlog 업데이트 (2026-11-10, Sonnet 4.6)
- 이 세션 커밋 트레일러: `Claude Sonnet 4.6 <noreply@anthropic.com>`

---
## 인수인계 보강 (2026-10-11, v2.5.0)

- 위 본문의 v2.2.1 수치는 이 보강으로 대체됨: 현재 `2.5.0`, jest **226 tests / 26 suites**, 게이트 G1–G17.
- v2.3.0~v2.5.0 요약: 11개 동반 스킬 벤더링 + G16 존재 프로브 / G17 자기성장 엔진(+v2.4.1 정밀도 수정) /
  **v2.5.0 모델 세대 업그레이드** — `references/model-capability-map.md` 재캐시(2026-10-11, 카탈로그·세션 두 ID 계열 모두 현행,
  API 제거 항목, 역할별 effort 정책), 26개 에이전트 footer에 `**Effort:**` 계층(xhigh/high/medium) 추가 — 오케스트레이터는
  Agent 도구 `effort`로 전달, 리뷰어 3종 coverage-first·developer scope-discipline 문장 삽입, 린트 +4 규칙군, track34 22/22.
- 모델 ID는 게이트 로직에 하드코딩하지 않는다(별칭 opus/sonnet/haiku/fable로 디스패치). 새 세대가 나오면
  map §1 표 + SKILL.md 릴레이 표 + 린트의 "current ID" 주석만 갱신하면 된다(C12: recorded ≠ current).
- 커밋 트레일러는 실행 중인 세션이 명시한 것을 그대로 쓴다(2026-10-11 세션: `Claude Fable 5.1`).

---
## 인수인계 보강 (2026-11-17, v2.10.0): 새 사이트는 이렇게 시작한다

- 위 본문의 v2.9.0 수치는 이 보강으로 대체된다: 현재 `2.10.0`, jest **337 tests / 34 suites**, 게이트 G1–G23.
- 새 사이트, 또는 기존 폴더를 쿨한에 올릴 때 한 번만 실행한다(이 저장소에서):
  `node scripts/new-project.js <폴더> --intent "한 줄 목표" --tags ui,deploy,money`
  태그는 ui, deploy, money, commerce, application, logistics, partner, integration, market, tax, tenant, ai, stats, services 중에서 고른다. 배포 허가는 `--deploy none|after-complete` (기본 none).
- 그 뒤에는 그 폴더에서 세션을 열고 «이어서 진행하라» 한 줄이면 된다. 상시 지시(O-01~O-18)는 그 폴더의 `CLAUDE.md`에, 루프 훅은 `.claude/settings.json`에 이미 들어 있다. 기획서부터 시작하고 모듈 저장소의 묶음마다 채택/이식/참조/제외를 `docs/plan/MODULE_PLAN.md`에 적어야 기획 게이트를 통과한다.
- 지시문을 고치는 곳은 한 곳이다: `knowledge_base/field-lessons.json`의 `orders`. 고친 뒤 `node scripts/field-lessons.js render`, 각 프로젝트에서는 `node <본체>/scripts/new-project.js . --refresh`.
- 모듈 저장소는 `C:\sites\00Module_site` (읽기 전용). 다른 위치면 `--modules <경로>`.
- 프로젝트 폴더에는 에이전트 팀이 복사되지 않는다. 세션은 본체의 `.claude/skills/coolhan-development-orchestrator/SKILL.md`를 읽고 진행한다. 스킬 목록에 넣으려면 본체에서 `node install.js`를 한 번 실행한다(운영자 결정).
- 운영자 명령 통계의 원자료는 비공개 폴더(`.coolhan-private/learned/`)에만 있다.

---
## 인수인계 보강 (2026-11-17, v2.11.0): 모든 세션에 쿨한이 적용된다

- 위 본문의 v2.10.0 수치는 이 보강으로 대체된다: 현재 `2.11.0`, jest **354 tests / 36 suites**, 게이트 G1–G24. 열린 결함은 D-13 하나다(D-2, D-3, D-4, D-8은 닫혔다). D-13: 부하가 걸린 기기에서 훅 자식 프로세스가 가끔 시작되지 않는다. 시험은 `scripts/lib/spawn-node.js`의 `runNode`로 그 경우만 다시 띄운다. 전체 시험이 훅 시험에서 빈 출력으로 실패하면 stderr의 «자식 프로세스가 시작되지 않아» 줄을 먼저 본다.
- 이 기기에는 전역 설치가 되어 있다: 사용자 지시 파일(`~/.claude/CLAUDE.md`)의 관리 블록 «쿨한 상시 지시». 어느 폴더의 어느 세션이든 «쿨한으로»라는 말 없이 상시 지시 O-01~O-18로 시작하고, 개발을 시작하는 폴더에 킷이 없으면 세션이 스스로 `new-project.js`를 실행한다. 이전 파일은 `~/.claude/CLAUDE.md.before-coolhan`에 있다.
- 다른 기기나 다른 계정에서는 저장소를 받은 뒤 한 번 실행한다: `node scripts/install-global.js`. 확인은 `--check`, 되돌리기는 `--remove`.
- 지시를 고친 뒤 순서: `knowledge_base/field-lessons.json`의 `orders` 수정, `node scripts/field-lessons.js render`, `node scripts/install-global.js`. 고정 검증 C13이 어긋남을 잡는다.
- 아직 재지 않은 것: 다른 폴더에서 새로 연 세션이 실제로 이 블록대로 움직이는지. 다음 세션에서 볼 것: 킷이 없는 폴더에서 개발 지시를 하면 묻지 않고 킷을 설치하는가, «이어서 진행하라» 없이 다음 단위로 가는가, 보고가 5줄 이내인가.

---
## 인수인계 보강 (2026-11-17, v2.11.1): 훅이 가끔 시작되지 않던 원인

- 위 본문의 v2.11.0 수치는 이 보강으로 대체된다: 현재 `2.11.1`, jest **370 tests / 37 suites**, 게이트 G1–G24. D-13은 닫혔다. 열린 결함은 D-14 하나다: 전체 시험 한 번이 요약 줄 없이 종료 코드 127로 끝났고(메모리 여유는 충분했다) 다시 돌린 실행들은 통과했다. 원인은 모른다. 다시 나오면 종료 상태 전체와 마지막 출력을 남긴다.
- D-13의 원인: 기기의 가상 메모리(커밋) 부족. 메모리를 받지 못한 자식 프로세스는 첫 줄도 실행하지 못하고 죽고 stdout은 비어 있다. CPU 부하와 물리 메모리 부족만으로는 일어나지 않는다. 증거와 재현은 `_harness_test/track41-machine-headroom/track41-report.md`.
- 시험이나 게이트가 빈 출력으로 실패하면 먼저 실행한다: `node scripts/resource-check.js` (0 충분, 1 부족, 4 재지 못함). 부족이면 가장 많이 쓰는 프로세스 이름이 같이 나온다. 그것을 정리한 뒤 다시 돌린다.
- `checks-run`은 통과가 아닌 결과가 하나라도 있으면 기기 상태를 같이 적고, 메모리를 받지 못한 검사는 실패가 아니라 «확인 안 함»으로 센다.
- `node scripts/nonstop.js`는 세션을 띄우기 전에 여유를 재고, 부족하면 60초씩 최대 10번 기다린다. 그 뒤에는 띄우고 기록에 LOW를 남긴다.
- 하네스가 할 수 없는 것: 기기가 메모리를 주지 않는 순간에는 대화형 세션의 훅도 시작되지 못한다. 그 순간에는 정지 차단이 없다.
- 프로젝트 폴더에서는 `node scripts/coolhan.js resource-check`로 같은 탐침을 쓴다.

---
## 인수인계 보강 (2026-11-22, v2.12.0): 모듈을 플러그인처럼 쓴다

- 위 본문의 v2.11.1 수치는 이 보강으로 대체된다: 현재 `2.12.0`, jest **421 tests / 38 suites**, 게이트 G1–G25. 열린 결함은 D-14 하나다(전체 시험 한 번이 종료 코드 127로 끝남. 밖에서 강제 종료된 프로세스가 이 셸에서 127로 보인다는 것까지 확인했다).
- 모듈 표준은 `knowledge_base/00_MODULE_STANDARD.md`다: 이름 하나(`영역-기능`), 폴더 하나, 같은 하위 폴더 열 가지, 파일 이름 규칙, 매니페스트, 분리된 DB, 시험, 보안 문서. 형식 검사는 `node scripts/module-check.js <모듈 폴더>`.
- 모듈 저장소(`C:\sites\00Module_site`)의 새 폴더 `modules/`에 표준 형식 모듈이 있다. 이전 형식 `packages/`는 그대로 있다. 저장소에는 `modules/` 경로만 커밋한다(그 폴더에서 다른 세션이 일한다).
- 프로젝트에서 쓰는 법: `node scripts/coolhan.js modules list`, `modules add <이름>`, `modules status`, `modules update <이름>`. 설치 위치는 `coolhan_modules/<이름>/`, 기록은 `coolhan.modules.json`. 그 폴더 안은 고치지 않는다.
- 원천 프로젝트가 앞서 나간 모듈 찾기: `node scripts/modules.js drift --library C:/sites/00Module_site --sites C:/sites` (5분쯤 걸린다).
- 추출 대기열, 조사 보고서 6건, 운영자가 지정한 원천, 원천 프로젝트에서 찾은 오류 목록은 비공개 폴더 `.coolhan-private/module-harvest/`에 있다(`QUEUE.md`가 순서다). 한 묶음씩: 추출, 형식 검사, 모듈 시험, 빈 폴더 설치, 저장소 커밋. 원천 프로젝트의 파일은 고치지 않는다.
- 운영자가 영역마다 원천 프로젝트를 정했다(관리자 모드가 최우선). 어느 프로젝트인지는 비공개 폴더의 `00-operator-decisions.md`에 있다. 이 저장소는 공개라 프로젝트 이름을 적지 않는다.
- 킷 실증(track42): `_harness_test/track42-kit-e2e/`. 지어낸 빵집 사이트를 킷으로 끝까지 만들었고 킷 결함 9건을 고쳤다. 사이트의 사람 확인 28행(접근성)은 그 사이트 원장의 열린 항목이다.
- 아직 재지 않은 것: 다른 폴더의 새 세션이 전역 지시대로 움직이는지. 이 기기의 명령줄 클라이언트가 로그인되어 있지 않다(운영자가 터미널에서 한 번 로그인해야 한다). 로그인 뒤 `node scripts/nonstop.js`로 무인 실행을 볼 수 있다.

---
## 인수인계 보강 (2026-11-22, v2.12.1): 모듈은 입고 검사 한 명령을 통과한 뒤에 커밋한다

- 위 본문의 v2.12.0 수치는 이 보강으로 대체된다: 현재 `2.12.1`, jest **430 tests / 39 suites**. 열린 결함은 D-14 하나다.
- 모듈을 저장소에 커밋하기 전에 실행한다: `node scripts/module-admit.js <이름...> --library C:/sites/00Module_site`. 형식, 모듈 시험, 빈 폴더 설치와 설치본 시험, 비밀값 스캔을 모듈마다 돌리고 종료 코드를 모두 읽는다. 0 입고 가능, 1 실패, 4 재지 못한 것이 있음.
- 그 뒤 저장소에서: `git add modules/<이름>`, `node <본체>/scripts/secret-scan.js --staged`(파이프로 잇지 않는다. 종료 코드를 본다), 커밋. 저장소 전체는 `--all`로 잰다(모듈이 많아 10분을 넘긴다. 백그라운드로 돌린다).
- 왜 생겼나: 손으로 돌리던 검사에서 스캔의 종료 코드가 파이프 뒤에 가려 지적 4건을 보지 못한 채 커밋 1건이 들어갔다. 지적은 지어낸 시험 값이었고 다음 커밋에서 표시했다.
- 모듈 추출은 대기열(`.coolhan-private/module-harvest/QUEUE.md`) 순서로 이어 간다. 추출 에이전트의 보고는 증거가 아니다. 입고 검사를 직접 돌린 뒤 커밋한다.

---
## 인수인계 보강 (2026-11-22, v2.12.2): 저장소에 모듈 114개, 찾기와 실증

- 위 본문의 v2.12.1 수치는 이 보강으로 대체된다: 현재 `2.12.2`, jest **431 tests / 39 suites**. 열린 결함은 D-14 하나다.
- 모듈 저장소 `modules/`에 표준 형식 모듈 114개가 35개 영역으로 있다(2026-11-22). 이전 형식에서 옮긴 68개에 더해, 운영자가 정한 순서로 새로 추출했다: 관리자(틀, 목록, 상세, 대시보드, 계정, 알림, 접근 기록 등 12개), 디자인 체계 1개, 운송사와 픽업과 추적, 정산과 세무 증빙, 구매대행 8개, 회원 7개(가입, 2단계 인증, 관리, 사업자 가입, 자료 내보내기와 탈퇴, 외부 계정 로그인), 우편번호, HS 검색, 연동 보호와 연결, 문자 알림 창구, 문서 양식 3개. 목록은 저장소의 `modules/INDEX.md`(매니페스트에서 만든 파일)다.
- 모듈 찾기: `node scripts/coolhan.js modules list --find <낱말>`, 영역으로 `--area member`. 찾은 것이 없으면 종료 코드 4다.
- 실증 프로젝트(비공개 폴더 `.coolhan-private/module-demo/`): 관리자 모듈 10개를 설치해 실제 화면을 띄운다. 시작: 그 폴더에서 `npx vite --port 4317 --strictPort --host 127.0.0.1`. 화면이 든 모듈을 고치면 여기서 `modules update` 뒤 브라우저로 다시 본다. 결과는 `_harness_test/track45-module-demo/track45-report.md`.
- 운영자가 확인해야 하는 것(모듈의 `docs/`에 «미검증»으로 적혀 있다): 우편번호 조회처 8곳의 이용 조건, HS 코드표와 별칭표의 출처와 이용 조건(모듈에 넣지 않았다), 정산 모듈의 세무 가정 8건, 회원 모듈의 법무 가정(부가세 번호 형식, 탈퇴 뒤 보관 자료와 기간), 판매 사이트 약관.
- 아직 재지 않은 것: 모듈의 SQL을 PostgreSQL에서 실행(SQLite로만 돌렸다), 실제 운송사와 문자 업체와 로그인 제공처의 응답, 실제 이름 풀이와 소켓(연동 보호 모듈), 화면 낭독기와 인쇄와 키보드 순서.
- 대기열에 남은 것(`.coolhan-private/module-harvest/QUEUE.md`): 회원과 관리자의 화면 부분, 쇼핑(가격 검증, 장바구니), 마이페이지, 다른 디자인 체계들, 한국 우체국과 추적 어댑터, 이전 형식 38개의 분리, 다음 판 후보(7번 표), 아직 조사하지 않은 폴더.

---
## 인수인계 보강 (2026-11-22, v2.12.3): 모듈이 여는 파일, 그리고 모듈을 고친 뒤의 순서

- 위 본문의 v2.12.2 수치는 이 보강으로 대체된다: 현재 `2.12.3`, jest **433 tests / 39 suites**. 저장소의 모듈은 119개다. 열린 결함은 D-14 하나다.
- 다른 모듈은 `core/index`와, 그 모듈이 매니페스트의 `provides.entries`에 적은 파일만 가져올 수 있다. 화면 모듈이 다른 틀에 올라탈 때는 틀의 모양을 베끼지 말고 틀이 연 파일에서 타입을 가져온다. 틀이 열지 않았으면 틀의 매니페스트에 먼저 적고 판을 올린다.
- 모듈을 고친 뒤의 순서: (1) `module-admit`를 고친 모듈과 그 모듈을 `requires`로 쓰는 모듈까지 함께 돌린다(`modules list --json`의 `requires`로 찾는다). (2) 저장소에 경로를 지정해 커밋하고 `modules list --md > modules/INDEX.md`로 목록을 다시 만든다. (3) 실증 프로젝트에서 `modules update --all`, `npx tsc --noEmit`, `npx vite build`. 여기서 깨지면 모듈끼리 어긋난 것이다. (4) 화면이 바뀌었으면 브라우저로 375px와 1280px에서 연다.
- 이번에 올린 다음 판: 밖으로 나가는 호출은 모두 연동 보호 모듈을 거친다(우편번호 2.0.0, 운송사 2.0.0. 바꾼 호스트가 안쪽 주소로 풀려도 검사하지 않던 구멍을 닫았다), 회원 계정 1.1.1(브라우저용 진입점, 외부 인증 계정과 동의 기록의 내부 창구), 추적 1.1.0(구매대행 추적을 합침), 목록 틀 1.0.3, 상세 틀 2.1.1(뒤로가기 가드), 확인창 1.0.1, 회원 화면 1.0.1. 옮기는 법은 모듈마다 `CHANGELOG.md`에 있다.
- 마이페이지 틀은 실증 프로젝트의 `#/my/orders`에서 연다(375px 가로 띠, 1280px 왼쪽 목록, 숨긴 탭과 잘못된 주소 거절을 브라우저에서 쟀다).

---
## 인수인계 보강 (2026-11-22, v2.12.4): 저장소 127개, 남은 대기열

- 위 본문의 v2.12.3 수치는 이 보강으로 대체된다: 현재 `2.12.4`, jest **434 tests / 39 suites**. 저장소의 모듈은 127개다. 열린 결함은 D-14 하나다.
- 모듈을 고쳤으면 `node scripts/module-admit.js <이름> --with-dependents --library C:/sites/00Module_site`로 그 모듈을 쓰는 모듈까지 함께 잰다(위 보강의 순서 (1)을 명령이 한다).
- 이번에 더 들어온 것: 디자인 체계 다섯(토큰, 테마, 기본 부품, 기능 모듈의 토큰 이름으로 잇는 다리, 대비 측정표), 한국 우체국 조회 어댑터(공식 오픈 인터페이스의 읽기만. 화면을 읽는 원천 코드는 가져오지 않았다), 다중 운송사 추적 어댑터, 자동 환불 규칙.
- 다음 세션이 이어서 할 일은 비공개 대기열(`.coolhan-private/module-harvest/QUEUE.md`)에 있다. 순서: 4번 표(이전 형식 38개의 분리와 표준 형식으로 옮기기: 화면과 서버와 DB가 든 것이라 가장 크다), 5번(아직 조사하지 않은 폴더), 7번(다음 판 후보), 그리고 디자인 모듈 다섯을 실증 프로젝트에 올려 브라우저에서 여는 일.
- 운영자가 확인해야 하는 것이 늘었다(각 모듈 `docs/`의 «미검증»): 우체국 오픈 인터페이스의 약관과 https 지원 여부, 추적 서비스의 약관과 요금제, 자동 환불의 «14일»은 원천 사이트의 운영 결정이지 법정 기한이 아니다.

---
## 인수인계 보강 (2026-11-22, v2.12.5): 모듈을 고친 뒤에는 이 한 줄

- 위 본문의 v2.12.4 수치는 이 보강으로 대체된다: 현재 `2.12.5`, jest **435 tests / 39 suites**. 저장소의 모듈은 127개다. 열린 결함은 D-14 하나다.
- 모듈을 만들거나 고친 뒤에는 이 명령 하나를 돌린다(본체 폴더에서):
  `node scripts/module-admit.js <이름...> --with-dependents --consumer .coolhan-private/module-demo --library C:/sites/00Module_site`
  형식, 모듈 시험, 빈 폴더 설치와 설치본 시험, 비밀값 스캔, 그 모듈을 쓰는 모듈들, 그리고 실증 프로젝트가 새 판을 받아 자기 타입 검사를 통과하는지까지 잰다. 0일 때만 저장소에 커밋한다.
- 판 번호: 다른 프로젝트가 구현하거나 넘기는 타입에 필수 칸이나 필수 속성이 생기면 깨지는 변경이다(주 판). 오늘 «부 판»으로 나갔다가 실증 프로젝트의 타입 검사에서 걸린 것이 두 건이었다.
- 디자인 체계 여섯은 실증 프로젝트의 갤러리에서 나란히 본다: `#/design/<kd|gc|sk|ss|hn|mu>`(토큰과 기본 부품), `#/design/<체계>/admin`(그 체계의 다리 파일을 입힌 관리자 목록). 1280px와 375px에서 가로 넘침 0건, 콘솔 오류 0건, 켜진 단추의 그려진 대비 4.5:1 미만 0건을 쟀다.
- 아직 조사하지 않았던 폴더의 조사 결과와 후보는 비공개 폴더의 `07-remaining-folders.md`와 대기열 9번 표에 있다(결제 어댑터 포함).

---
## 인수인계 보강 (2026-11-22, 저장소 133개): 결제와 보안 모듈, 그리고 운영자가 볼 알림

- 저장소의 모듈은 133개다(본체 판은 `2.12.5` 그대로, 본체 코드는 바뀌지 않았다).
- 더 들어온 것: 결제 알림 수신함(서명 비밀이 없으면 어느 환경에서나 거절, 이벤트는 한 번만, 알림은 힌트일 뿐이라 결제사에서 다시 읽어 금액·통화·모드를 대조), 결제사 어댑터 둘, 속도 제한(로그인·재설정·돈 정책은 저장소가 죽으면 닫힘), 보안 머리글, 비밀값 보관(봉인 실패는 오류, 평문으로 떨어지는 길 없음). 이전 형식에서 옮긴 결제 판정 모듈은 금액 확인 없이 열리던 길을 닫아 주 판을 올렸다.
- 운영자가 먼저 볼 것: 비공개 폴더의 `.coolhan-private/module-harvest/OPERATOR-NOTICE.md`. 남은 폴더 조사에서 운영 중인 사이트들의 결제 웹훅 결함이 나왔다(서명 없이 통과하는 조건, 재전송 방어 없음, 이중 적립 가능, 금액 대조 없음). 원천 파일은 고치지 않았다. 그 사이트의 세션과 운영자가 확인할 일이다.
- 다음 단위: 대기열 9번 표의 7번(쿠키 동의)부터 34번까지, 4번 표(이전 형식 38개의 분리), 7번 표(다음 판 후보). 결제 모듈의 공급자 사실 33건은 실제 키로 처음 붙이는 사이트에서 결제사의 시험 환경으로 확인한다.

---
## 인수인계 보강 (2026-11-22, v2.12.6): 저장소 153개, PostgreSQL에서 잰다

- 위 본문의 v2.12.5 수치는 이 보강으로 대체된다: 현재 `2.12.6`, jest **441 tests / 40 suites**. 저장소의 모듈은 153개다. 열린 결함은 D-14 하나다.
- DB가 있는 모듈을 만들거나 고쳤으면 입고 검사에 더해 `node scripts/module-db-check.js <이름...> --library C:/sites/00Module_site`를 돌린다. 이 기기의 PostgreSQL 프로그램으로 임시 클러스터를 만들어 스키마와 `db/*.postgres.sql`을 두 번씩 실행하고 지운다. 기기의 PostgreSQL 서비스와 자료는 건드리지 않고 비밀번호도 쓰지 않는다. 프로그램이 없으면 4(재지 못함)다.
- 추가전용 같은 보장 파일은 두 DB용을 함께 둔다(`<이름>.sqlite.sql`, `<이름>.postgres.sql`). 하나만 있으면 형식 검사가 잡는다. PostgreSQL 쪽은 줄 단위 UPDATE와 DELETE, 문장 단위 TRUNCATE를 막는다.
- 운영자 지시로 더 들어온 20개(순서와 근거는 비공개 대기열 10번 표): 쿠키 동의, 약관 동의 기록, 수신거부, 예약 실행, 작업 큐, 백업 점검, 로그인 잠금, 사람 확인, 밖으로 보내는 웹훅, 환율, 다른 통화 청구, 결제 대조, 주인 없는 결제 감지, 미수 안내, 권리침해 신고 접수, PDF 글 추출, 회계 내보내기, 은행 명세 점검, 받는 메일함, AI 제공자 호출.
- 직전 보고의 «확인 안 함» 가운데 잰 것: 저장소 전체 입고 검사, PostgreSQL 실행, 운영자 알림 7건을 원천 코드에서 직접 읽음(알림 파일 아래쪽 표), 실증 프로젝트의 키보드 순서와 초점. 여전히 재지 않은 것: 화면 낭독기와 인쇄, 다른 브라우저, 밖의 서비스(결제사, 운송사, 메일 서버, AI 제공자) 실제 호출, 다른 PostgreSQL 판, 추출한 모듈을 실제 사이트에 갈아 끼우는 일.
- 다음 단위 후보: 대기열 9번 표의 남은 줄(가장 큰 넷과 한 프로젝트에만 있는 것), 4번 표(이전 형식 38개의 분리), 7번 표(다음 판 후보), 빠진 어댑터(IMAP, OCR, 한글 글꼴 PDF, 통합문서).

---
## 인수인계 보강 (2026-11-23, v2.12.7): 시각과 금액 열은 64비트

- 위 본문의 v2.12.6 수치는 이 보강으로 대체된다: 현재 `2.12.7`, jest **444 tests / 40 suites**. 열린 결함은 D-14 하나다.
- 모듈의 `db/schema.sql`에서 시각(밀리초나 초)과 금액(최소 단위)을 정수로 담는 열은 `BIGINT`로 적는다. `INTEGER`는 SQLite에서 64비트, PostgreSQL에서 32비트라 지금의 밀리초 시각을 넣으면 «integer out of range»로 거절된다. 형식 검사가 이름으로 잡고(`db-int32-column`), PostgreSQL 검사가 DB가 실제로 만든 열의 폭을 읽어 잡는다. 작게 머무는 값이면 그 줄에 `-- int4-ok: 이유`.
- 왜 생겼나: 완성된 모듈 15개의 열 32개가 그랬고, 그 스키마들은 v2.12.6의 PostgreSQL 검사를 모두 통과했다. DDL 실행은 값을 넣지 않기 때문이다. 저장소에서는 모두 고쳤다(패치 판, 이미 PostgreSQL에 표를 만든 사이트가 실행할 ALTER 문은 모듈마다 `CHANGELOG.md`).
- 아직 재지 않은 것: 값을 실제로 넣어 보는 일, 모듈의 저장소 코드를 PostgreSQL에서 돌리는 일(PostgreSQL용 저장소 어댑터를 가진 모듈이 아직 없다).

---
## 인수인계 보강 (2026-11-24, v2.12.8): 저장소 218개, 관리자 틀 한 벌, 표를 실제로 쓰는 저장소

- 위 본문의 v2.12.7 수치는 이 보강으로 대체된다: 현재 `2.12.8`, jest **445 tests / 40 suites**. 저장소의 모듈은 218개다. 열린 결함은 D-14 하나다.
- 모듈 현황(분류별 목록, 모듈별 완성도와 빈 항목)은 비공개 폴더의 `.coolhan-private/module-harvest/MODULE-STATUS.md`다. 다시 만드는 스크립트는 그 파일의 머리말에 적혀 있다. 2026-11-24 기준 완성 165, 부분 49(모두 «화면을 브라우저에서 열어 보지 않음»), 그 밖 4.
- 표가 있는 모듈은 그 표에서 도는 저장소(`adapters/sqlite-store.ts`)와 대조 시험(`test/sqlite.test.ts`)을 함께 낸다. 없으면 형식 검사가 잡는다(`db-schema-unexercised`). 왜 생겼나: 표가 있는 모듈 57개가 메모리 저장소만 갖고 있었고, 저장소를 붙이자 실제 표가 결함 109건을 보여 줬다(에이전트 보고의 합).
- 관리자 화면의 틀은 한 모듈이다: `admin-kit`. 진입점 한 곳(`admin/index.tsx`)과 모양 한 줄(`style/kleinanzeigen.css`)로 세 줄 머리, 화면 한 장의 자리 순서, 단추와 놓는 순서, 진행 방식(단계 줄, 조치의 상태 기계, 목록으로 돌아가기)을 가져온다. 목록, 상세, 확인창 등은 각자의 모듈이 주인이고 이 모듈이 다시 내보낸다. 실증 프로젝트의 `#/kit/orders`에서 연다.
- 이전 형식 꾸러미 38개는 표준 형식 모듈로 옮겨졌다(열 묶음). `packages/`는 고치지 않았다(그 폴더에서 다른 세션이 일한다). 옮긴 꾸러미를 거기서 빼는 일은 그 폴더의 주인이 정한다.
- 기기의 가상 메모리가 다른 프로젝트들의 개발 서버로 차 있을 때가 있다. 입고 검사를 여럿 겹쳐 돌리면 멈춘다. 한 번에 하나씩 돌리고, 먼저 `node scripts/resource-check.js`로 여유를 본다.
- 이 저장소 폴더에서 다른 세션이 함께 일한다(모듈 사이 연동 검사 도구, 원장 56번). 원장과 `scripts/messages/index.js`는 두 세션이 같이 고치는 파일이다. 커밋할 때 내 줄만 스테이징한다.
- 다음 단위: 화면이 있는 49개 모듈을 실증 프로젝트에 올려 브라우저에서 여는 일(설치는 해 두었다: 실증 프로젝트에 모듈 111개), 다음 판 후보(비공개 대기열 7번 표), 운영자 알림 8~10번(`OPERATOR-NOTICE.md`).

---
## 인수인계 보강 (2026-11-24, v2.12.9): 화면 656개 주소를 두 폭에서 쟀다, 정리 실패가 판정을 지우지 않는다

- 위 본문의 v2.12.8 수치는 이 보강으로 대체된다: 현재 `2.12.9`, jest **449 tests / 40 suites**. 저장소의 모듈은 219개다. 열린 결함은 D-14 하나다.
- 화면이 있는 모듈 52개는 실증 프로젝트(`.coolhan-private/module-demo/`)에 올라 있다: 모듈마다 `src/screens/mods/<모듈>.tsx`, 주소는 `#/s/<모듈>/<화면>`, 목록은 `#/s`. 측정 도구는 `src/screens/measure.ts`다. 개발 서버를 띄우고(`npx vite --port 4317 --strictPort --host 127.0.0.1`) 브라우저 콘솔에서 `__sweep()`을 부르면 지금 폭에서 모든 주소를 열고 잰다(결과는 `__all`). 폭은 1280px와 375px 두 번이다. 2026-11-24 마지막 측정: 두 폭 모두 656개 주소, 지적 0건. 기준과 고친 목록은 비공개 폴더의 `.coolhan-private/module-harvest/09-screen-sweep.md`.
- 화면이 든 모듈을 고쳤으면: 입고 검사, 저장소 커밋, 실증 프로젝트에서 `modules update <이름>`, `npx tsc --noEmit -p tsconfig.json`, 그 모듈의 주소를 두 폭에서 다시 잰다(`__sweep(['<모듈>'])`). 타입 검사는 모듈의 시험이 보지 못하는 것을 잡는다(이번에 다섯 모듈).
- `provides.entries`는 모듈이 다른 모듈을 가져올 때의 경계다. 사이트는 `provides`가 이름한 화면, 서버 경로, 저장소, 문구, 모양을 정해진 하위 폴더에서 가져온다(표준 §6).
- `module-db-check`와 `module-admit`는 임시 폴더를 지우지 못해도 판정을 그대로 낸다. 남은 폴더의 경로가 출력에 적히고, PostgreSQL 검사는 다음에 시작할 때 십 분 지난 자기 폴더를 지운다. 왜 생겼나: 저장소 전체 PostgreSQL 검사가 모든 모듈을 잰 뒤 폴더 삭제에서 예외로 끝나 판정 줄이 나오지 않았다.
- 모듈 저장소의 git 색인은 다른 세션과 함께 쓴다. 커밋은 경로를 붙여서 한다(`git commit -F <파일> -- modules/<이름>`). 경로 없는 커밋은 다른 세션이 스테이징해 둔 파일까지 가져간다(한 번 그랬고 곧바로 되돌려 다시 했다).
- 비공개 대기열(`QUEUE.md`)에 «대기» 줄은 없다. 운영자가 볼 것은 `OPERATOR-NOTICE.md`의 1~16번이다(11번과 12번은 고객의 돈이 걸린 항목).
- 아직 재지 않은 것: 화면 낭독기, 인쇄, 글자 200%, 다른 브라우저 엔진, 화면에서 누른 뒤의 흐름, 밖의 서비스 실제 호출, PostgreSQL용 저장소, 추출한 모듈을 실제 사이트에 갈아 끼우는 일.
