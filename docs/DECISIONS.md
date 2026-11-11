# Decisions Log (Auto-Pilot Mode)

> When a spec detail is underspecified and a reasonable default exists, an agent picks the
> default that best fits the current code structure and industry norms, logs it here, and
> **keeps working — it does not wait for an answer.** Only the 4 conditions in
> `CLAUDE.md` § Global Output Rules (real credentials/payment/irreversible prod deletion/
> mutually-incompatible requirements) justify pausing to ask.

## Format

```markdown
## {date} — {short title}
**Context:** what was underspecified
**Decision:** what was chosen
**Rationale:** why this fits the existing code/industry norm
**Reversible:** yes/no — how to change it later if wrong
```

## Log

## 2026-07-19 — Auto-Pilot task-state vocabulary
**Context:** The user-supplied completion discipline names 5 task states in Korean
(미착수/진행 중/구현 완료/검증 완료/차단됨) with no specified file format.
**Decision:** Standardized on a markdown table (`TASKS.md`, columns ID/Task/Status/Verifies)
parsed by `scripts/tasks-check.js`, accepting both the Korean labels and their English
equivalents (not-started/in-progress/implemented/verified/blocked).
**Rationale:** Matches the existing `_backlog.md` table convention already used by
`scripts/plan-check.js`/`scripts/completion-check.js`, so agents don't learn two formats.
**Reversible:** yes — `tasks-check.js`'s `STATUS_MAP` can be extended without changing callers.

## 2026-07-31 — npm publish blocked, needs user credential (not auto-resolved)
**Context:** `publish.yml` fails at the "Publish to npm" step on every push that changes
package.json/install*/.claude/**/knowledge_base/** (`coolhan-builder` has never appeared on
the npm registry — confirmed via `registry.npmjs.org/coolhan-builder` → "Not found" — so this
is the first-ever publish attempt, which needs a valid `NPM_TOKEN` repo secret with publish
scope).
**Decision:** Not auto-resolved. This is condition 1 of the CLAUDE.md question gate (a real
credential is genuinely required and none exists/works) — flagged for the user to add/fix
`NPM_TOKEN` in GitHub repo Settings → Secrets → Actions, rather than guessed at.
**Rationale:** No token value can be fabricated or inferred; publishing is also a
side-effectful action on a shared registry, out of scope for unattended auto-fix.
**Reversible:** n/a — informational gate, not a code decision.

## 2026-08-07 — Model-modernization scope: calibration + reference map, not a 25-agent prompt rewrite
**Context:** "Upgrade the harness to match the new Claude models" is open-ended. Two candidate
scopes: (a) update the mechanically-stale artifacts (context-budget table built for the 200K era,
missing model map) and document the behavior shifts that affect agent wording; (b) additionally
re-tune all 25 agent .md prompts line-by-line for literal-instruction-following models.
**Decision:** Ship (a) now (v1.3.1). Defer (b) — a full prompt audit of 25 agents is a separate
unit of work that needs adversarial re-verification per agent (tracks), and doing it untested in
one pass risks regressing gates that currently verify 0-false-positive/negative.
**Rationale:** (a) is provably stale (no current Claude model has a 100K or 32–64K context;
1M-class models were mis-budgeted at 3 units/session). (b) changes behavior of verified gates and
must go through the same track-based adversarial verification as every prior harness change.
**Reversible:** yes — (b) can be run later as a dedicated prompt-audit track using
`references/model-capability-map.md` §2–5 as the checklist.
**Update 2026-08-07 (v1.4.0):** (b) executed as track22. The audit found the 25 agent files
already clean (prior Token-Efficiency/C1–C19 passes had normalized wording); 12 findings in
skill/reference files were fixed or classified (P0-tagged/allowlisted). Enforcement is now
mechanical: `scripts/prompt-modernization-check.js` (10/10 tests, track22 adversarial 3/3).

## 2026-09-26 — Companion skills (v2.3.0) + Self-Growth Engine scope (v2.4.0)
**Context:** (1) User: install the skills.sh top coding/design skills into CoolHan's base. (2) User:
"analyze ALL conversations/MDs/skills/DB/sources across all sessions & applied sites; make CoolHan
self-growing (자기성장형) for agent-driven + loop solution development."
**Decision (1):** Vendor 11 real skill dirs from ~/.claude/skills into CoolHan `.claude/skills/`
(shipped by install.js) + wire agents to invoke them only-if-present (C3) + G16 presence probe.
**Decision (2):** "Read every session across every account" is not feasible/verifiable in-session
(no cross-account transcript access) — fabricating it would violate C10. Instead build the
mechanical, honest core of self-growth: G17 Self-Growth Engine that mines CoolHan's OWN durable
evidence already on disk (G5 ledger lessons, docs/DECISIONS, run-reports, _harness_test track
outcomes, and an operator-pointed sites root for applied-site outcomes) and emits a prioritized
`_workspace/_self-growth-backlog.md` that feeds the non-stop loop — CoolHan proposing its own next
enhancements, gated by G1–G16.
**Rationale:** delivers "self-developing" as a repeatable mechanism, not a one-off unverifiable claim.
**Reversible:** yes — evidence-source list is configurable; backlog is advisory input to the loop.

## 2026-10-11 — Model-generation upgrade (v2.5.0): effort tiers by role, both ID families current, no pricing, no direct-API guard
**Context:** User: "클로드 모델들이 업그레이드 되고있다. 이에 맞게 쿨한 하네스의 소스와 방식을 고도화해야한다."
Two facts had to be reconciled without stopping to ask: the claude-api reference (cached 2026-06-24) names
`claude-fable-5 / claude-opus-5 / claude-sonnet-5 / claude-haiku-4-5`, while the live Claude Code session
names `claude-fable-5-1 / claude-opus-5-5 / claude-sonnet-5-5 / claude-haiku-5-5`.
**Decision:** (1) Record BOTH ID families as current in the map and the lint; dispatch stays by tier alias,
never by dated ID. (2) Assign the Agent-tool `effort` per role — xhigh for agentic/coding roles, high for
judgment/spec roles, medium for marketing-lead, max reserved for a C11-flagged unit — written into every
agent footer so it survives cold-start delegation. (3) Do not record pricing in the map. (4) Keep Haiku 5.5 at
the 200K relay tier until its window is verified via the Models API (observed only in a session prompt).
(5) Enforce the API-surface removals (budget_tokens/sampling/prefill/refusal/fallbacks) as lint rules and a
reference checklist, not as a runtime guard — the harness runs inside Claude Code and makes no direct
Messages API call today.
**Rationale:** (1) a lint that flags the session's own model ID as "stale" would be wrong on day one;
(2) adaptive thinking leaves effort as the only calibration knob, and footers are the one place every agent
is guaranteed to read; (3) prices change faster than this file and a stale number gets used as true;
(4) C12/C10 — an unverified window must not widen a budget; (5) a guard with nothing to guard is dead code.
**Reversible:** yes — tiers are one footer line per agent; the ID list and Haiku tier are table rows;
a direct-API guard can be added the day a script calls the API.

## 2026-10-24 — G18 세션 누적 학습 (operator order: 모든 세션의 작업을 하네스에 주입해 스스로 성장)
- Decision: `scripts/harvest-sessions.js` 가 이 PC·이 계정의 세션 기록(메모리 · 사람 발화 · 프로젝트 문서의 사고/보안 줄)을 마스킹해 `.coolhan-private/learned/`(**git 무시**, 하네스 저장소는 공개 원격)에 누적하고 `DIGEST.md` 를 재생성한다. `self-growth.js`(G17)가 이 저장소를 새 증거원(`learned`)으로 읽는다. 자동 적용: 전역 SessionEnd 훅(증분 수집) + SessionStart 훅(`--brief` ≈4KB 주입) + 오케스트레이터 Phase 0 읽을 목록. **전역 훅은 운영자 승인(2026-10-24 「훅 설치해」) 후 `~/.claude/settings.json` 에 설치했다**(SessionStart `--brief` 0.3초·4KB, SessionEnd 증분 1초, 둘 다 종료 코드 0). 훅은 새 세션부터 적용된다.
- Rationale: 규칙·명령 패턴·사고·보안 조치가 세션마다 흩어져 같은 지시를 반복해야 했다(예: 완료 선언 검증, 작업 중 글쓰기 금지, 배포 절차). 실데이터 첫 실행: 12개 프로젝트, 사람 발화 2,919건, 교훈 774건, 20초.
- Bounds (honest): 이 계정·이 PC 만 · 키워드 분류(의도 이해 아님) · 마스킹은 알려진 패턴만(고유명사 불가 → 비공개 폴더) · 조언이지 게이트가 아니다.
- Reversible: yes — `~/.claude/settings.json` 훅 두 줄 삭제, `.coolhan-private/` 삭제.
- Next: 새 세션에서 브리핑이 실제로 주입되는지 확인.
- Next: DIGEST 의 반복 지시가 에이전트 프롬프트 산문에만 있고 게이트가 없으면 G17 백로그 후보로 올라온다(그때 시험+적대 트랙으로 게이트화).


## 2026-10-29 — G19 AI 아키텍처 원칙: KB 문서 + 정적 게이트로 설치 (user doctrine "right brain for the right task")
- Decision: 사용자가 붙여넣은 18개 항 원칙을 `knowledge_base/00_AI_ARCHITECTURE_PRINCIPLES.md`(구동 문서, 쿨한 집행 지점 부록 포함)로 설치하고, 정적으로 검사 가능한 부분집합만 `scripts/ai-arch-check.js`(G19, 8규칙)로 기계화했다. 판단이 필요한 부분(§13 "정말 AI가 필요한가", 모델 적합성, 임계 보정)은 Plan Reviewer §13/§17 + 사람에게 남긴다. 상태는 PASS / FAIL / NOT_APPLICABLE — 모델 호출이 없는 프로젝트를 통과로 꾸미지 않는다(C10).
- Decision (2): Jev·Clef·Clef-flash는 세션 지식에 없는 개체라 C3 규칙대로 웹에서 확인했다(2026-10-29: Jev = TypeSafe AI 2026-09, Clef/Clef-flash = Cloudflare 2026-10-01 open-weight, `@cf/cloudflare/clef`). 게이트 로직은 "Decision Model"을 추상으로 다루고 모델명은 탐지 토큰일 뿐이다(C12 recorded ≠ current); 가격은 기록하지 않는다. 채택은 프로젝트 라벨 세트로 정확도·ECE·지연을 실측한 뒤에만(§12, C10).
- Decision (3): 쿨한 자체에는 Decision Model을 지금 도입하지 않는다 — 하네스는 모델 호출이 없고(게이트 = 결정적 코드, 에이전트 = LLM) 이미 원칙에 부합. 후보(HX Vision Critic의 PASS/ITERATE 분류, 의도 라우팅)는 측정 후 G17 백로그로.
- Rationale: 원칙을 산문으로만 두면 희석된다(v1.4.1 교훈) — 기계 검사 가능한 부분은 게이트, 나머지는 에이전트 체크리스트로 분리하는 것이 쿨한의 기존 패턴(G3 structural vs open_risks)과 같다.
- Reversible: yes — KB 문서·스크립트·에이전트 5개 섹션 삭제; 규칙 8개는 각각 독립.
- Next: 첫 AI 사용 프로젝트에서 G19를 실제 실행해 false positive(특히 provider 탐지 토큰)를 track으로 재측정.

## 2026-10-29 — 00Module_site 모듈 명세 연속개발 run 20261029-00module-specs
- **Decision:** B03~B26(22유닛)을 B01·B02·B05·B15와 같은 절차(사이트 코드 검증 에이전트 ≥3 → 주장 5건 원문 대조 → `_specs/Bnn-*.md` + `modules.json` v2 칸 → `check-specs` 오류 0 → 커밋)로 진행. 묶음당 에이전트 2~3개(사이트 묶어서)로 줄여 토큰 절약, 질문지는 묶음별 1개.
- **Default chosen without asking:** 00Module_site의 내 작업이 아닌 변경 5파일(.gitignore 등)은 건드리지 않음; 외부 호출·테스트 실행 금지(파일만 집계); 비밀값은 줄 번호만.
- **Reversible:** yes — 각 묶음은 독립 커밋이라 되돌릴 수 있음.

## 2026-10-31 — G20 최소 소스·단일 원천·진행 원장 원칙: KB 문서 + 게이트 3종으로 설치 (user doctrine, v2.7.0)
- Decision: 사용자가 붙여넣은 §0–§13 원칙을 `knowledge_base/00_MINIMAL_SOURCE_PRINCIPLES.md`(구동 문서 + 집행 지점 부록)로 설치하고, 기계 검사 가능한 부분만 세 게이트로 기계화했다 — `progress-check.js`(§9/§10 원장 형식·완료 정의), `checks-run.js`(§11 고정 목록 전부 실행, 통과·실패(D)·확인 안 함 3수치, 확인 안 함≠통과), `single-source-check.js`(§0/§1/§2 중복 도우미·인라인 스타일·하드코딩 문구·외부 대상 리터럴 측정 + 기준선 래칫). 판단 영역(검문 5문 ①⑤, 손 표 S4, 설정 산재 S5)은 탐지 불가로 명시하고 Plan Reviewer·Validator·사람에게 남긴다(C10).
- Decision (2): 하네스 자신에게 같은 규칙을 새 코드부터 적용했다(§4-d) — S8 `scripts/lib/`(md-table·cli), S2 `scripts/messages/`를 신설해 새 스크립트 3종이 쓰고, 기존 스크립트의 중복 3쌍·인라인 문구 95건은 `docs/SINGLE_SOURCE_BASELINE.json`에 고정(증가 금지). 이 저장소의 원장은 `docs/PROGRESS.md`, 고정 목록은 `docs/CHECKS.md`(C1–C9). 엔진 런의 `_workspace/_backlog.md`(G8)와는 합치지 않았다(훅·엔진이 읽는 파일 — 동작 변경은 범위 밖).
- Default chosen without asking: 붙여넣은 템플릿의 «작업:» 줄이 비어 있어 G19 때와 같은 해석(원칙 설치)으로 진행; 동작 불변 스냅샷 도구(§4-c)는 서버가 없는 이 저장소에선 C1 jest가 대신하므로 만들지 않음; 가정 전부는 `docs/PROGRESS.md` 가정 목록 A-1~A-5.
- Rationale: 원칙을 산문으로만 두면 희석된다(v1.4.1 교훈) — G19와 같은 «KB + 기계 게이트 + 에이전트 배선» 패턴. 자기 실행이 첫 결함(D-1 no-placeholder 자기 탐지, 원장 증거 형식)을 바로 잡아냈다 — 게이트가 자기 저장소에서 먼저 유효함을 증명.
- Reversible: yes — KB 문서·스크립트 3종·lib/messages·docs 4장·에이전트 4절·SKILL 3곳 삭제; 각 게이트는 독립.
- Next: 쿨한이 만드는 첫 프로젝트에서 `--targets`(S3 대상명)와 hardcoded-sentence 휴리스틱의 false positive를 track으로 재측정; 기존 스크립트의 `get`/`parseFlags`/`readText`는 손대는 날 `lib/cli.js`로 이행(D-2~D-4).

## 2026-11-11 — G21 기획서 제작 표준: 마스터 프롬프트를 KB 문서 + 정적 게이트로 설치 (user: "이게 좋다. 적용하라", v2.8.0)
- Decision: `C:\sites\MUSIC_APP\docs\plan\MASTER_PROMPT.md`를 `knowledge_base/00_PLANNING_DOC_STANDARD.md`로 일반화해 설치했다(§1~§8 구조 유지, 음악 서비스 전용 부분은 `{{ }}` 슬롯 + 원문 예시). §7 문서 완료의 정의를 `scripts/plan-doc-check.js`(G21, 14규칙, PASS/FAIL/exit 2)로 기계화하고 Intent Analyzer · Spec Writer · Plan Reviewer 0단계 · UX Design Lead · SKILL.md Task 2.5 · 엔진 루프에 배선했다. 사실의 진위, 도식을 눈으로 확인했는가, 의도 일치는 게이트가 못 본다(Plan Reviewer + 사람, 문서 부록 C).
- Decision (2): 충돌 처리. 마스터 §2-4(일반 파일명 `services` 금지)와 G19(`services/ai`)는 프로젝트가 §2-4를 채택하면 `ai-arch-check --service-dirs`로 계층 이름만 바꾼다(계층 규칙 유지). 마스터 §8의 6줄 보고는 CLAUDE.md 5줄 상한이 우선. 마스터 §2-8 번역 모듈은 G20 S2와 같은 원칙으로 연결.
- Decision (3): 단일 원천 래칫에 `--skip-dirs` 추가 + C7 명령에 `--skip-dirs docs`. 다른 세션이 커밋한 docs/ 연구 산출물 스크립트가 하네스 소스가 아닌데 기준선을 부풀렸다(D-6). 기본 동작은 그대로다.
- Default chosen without asking: «적용하라»의 구체 작업 줄이 없어 G19, G20과 같은 해석(설치). 원본 프롬프트 파일은 읽기만 했고, MUSIC_APP의 다른 문서에는 게이트를 돌리지 않았다(세션 격리, 검증은 자체 fixture).
- Rationale: G19, G20과 같은 «KB + 기계 게이트 + 에이전트 배선» 패턴. 게이트 자기 점검이 라벨 하드코딩과 금지한 줄표를 스스로 쓴 결함(D-7)을 출고 전에 잡았다.
- Reversible: yes — KB 문서, 스크립트 1개, lib/fs.js, messages 키, 에이전트 4개 절, SKILL 3곳 삭제; `--skip-dirs`는 옵션이라 기본 동작 불변.
- Next: 실제 기획서 작업(쿨한으로 기획서 만들어)에서 휴리스틱(어절 수, 필수 항목 정규식)의 false positive를 재측정.

## 2026-11-11 — G22 현장 교훈: 지금까지 만든 전 프로젝트를 분석해 레지스트리 하나로 흡수 (operator order, v2.9.0)
- Decision: 분석 에이전트 8개(프로젝트 군별 1개, 읽기 전용)가 결정 기록·인수인계·원장·커밋 제목·자체 검사 스크립트에서 WIN/FAIL 을 증거와 함께 뽑았다. 일반화한 결과를 `knowledge_base/field-lessons.json` 한 곳에 두고(실패 40 · 성공 24 · 모듈 카탈로그 33) 나머지는 전부 여기서 파생한다: KB 문서(`render`, `--check`), 에이전트별 점검 목록(`list --owner`), 기획 단계 의무(`plan-doc-check --lessons` → 실패 방지 대응표), 코드 검사(`check`, 탐지 규칙은 레지스트리의 칸).
- Decision (2): 가장 널리 관측된 실패(아무것도 재지 않고 통과한 검사, 8개 군 전부)를 하네스 자신에게 적용했다: 훑은 것이 0이면 NOT_RUN(종료 코드 4) — `field-lessons check` · `single-source-check` · `no-placeholder-check`, `checks-run` 은 자식의 4 를 «확인 안 함»으로 보고. 그 밖에 원장 번호 중복 거절(`progress-check`), 래칫의 스캔 범위 축소 거절(`single-source-check`), `[결정필요]` 에 기본값 필수(`plan-doc-check`, 묻지 않고 진행하기 위해).
- Default chosen without asking: 이 저장소는 공개 원격이라 교훈은 P-번호로 일반화하고 군별 증거 파일은 `.coolhan-private/site-lessons/`(git 무시)에 둔다. 다른 프로젝트의 소스·명세 본문은 복사하지 않고 카탈로그(이름·범위·성숙도)만 만든다. 이번 런의 범위 경계에 «G1–G21 판정 논리는 입력 추가 외에 바꾸지 않는다»고 적었지만, 교훈이 직접 요구하는 위 네 가지 강화는 목표(실패 방지 구현) 자체이므로 수행하고 여기에 기록한다. 릴리스 절차의 전체 스테이징(`git add -A`)은 경로 지정으로 바꿨다(교훈 F-09, 오늘 이 폴더에서 두 세션이 동시에 작업함).
- Rationale: 교훈을 에이전트 파일마다 산문으로 적으면 희석되고 어긋난다(v1.4.1 교훈, G20 단일 원천). 레지스트리 한 곳 + 파생이면 사고 한 건이 항목 한 건이고, 기획서가 그 패턴에 답하지 않으면 게이트가 막는다.
- Reversible: yes — 레지스트리·스크립트·파생 문서·에이전트 17개의 한 절·SKILL 3곳 삭제; 강화 네 가지는 각각 독립(플래그 `--allow-scope-shrink` 로 우회 가능).
- Not done / 확인 못 한 것: 분석은 문서 표본이다(큰 결정 기록은 일부만, 애플리케이션 소스는 대부분 읽지 않음). 탐지 규칙의 실제 프로젝트 오탐률은 재지 않았다(자체 fixture 와 하네스 자기 실행만). 원장 «현재 위치»의 신선도(마지막 커밋 날짜와 비교)는 구현하지 않았다. 모듈 카탈로그의 묶음 명세를 쿨한 도메인 모듈(01–13)과 합치는 일은 하지 않았다.
- Next: 다음 실제 프로젝트의 기획서에서 `--lessons` 를 처음 돌려 대응표 분량과 오탐을 재고, 탐지 규칙의 기준선 수치를 track 으로 남긴다. 기존 스크립트의 삼킨 오류 4건(D-8)은 손대는 날 고친다.
