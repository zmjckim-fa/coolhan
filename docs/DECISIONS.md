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

## 2026-11-17: G23 상시 지시와 프로젝트 킷: 운영자가 프로젝트마다 반복하던 명령을 한 번에 설치 (operator report, v2.10.0)
- Decision: 운영자의 두 메시지(«매번 비슷한 명령을 한다», «00module 폴더의 모듈을 이용하자»)를 «반복 명령을 프로젝트 폴더가 처음부터 갖게 하고, 모듈 저장소를 기획 단계의 필수 입력으로 만든다»로 해석했다. 먼저 쟀다: 비공개 메시지 저장소의 운영자 메시지 4,286건(9개 프로젝트)에서 이어가기 530, 배포 259, 커밋 152, 검증 110. 원인은 프로젝트 폴더가 지시, 훅, 원장, 고정 검증, 모듈 계획을 갖고 있지 않았고 루프 훅이 «쿨한»이라는 낱말에만 무장했다는 것이다.
- Decision (2): 지시는 교훈 레지스트리의 `orders`(O-01~O-18) 한 곳에 두고 `scripts/new-project.js`가 프로젝트의 `CLAUDE.md` 관리 블록으로 파생한다. 게이트와 훅은 복사하지 않고 런처(`scripts/coolhan.js`)가 본체에서 실행한다. 기기 종속 값은 `coolhan.project.json`의 `home` 하나다.
- Decision (3): 모듈 저장소는 읽기 전용으로 묶음 표만 읽는다. 묶음마다 한 행을 만들고 태그로 기본 결정을 채운 뒤, 기획 게이트(`plan-doc-check --modules`)가 답하지 않은 묶음과 네 낱말 밖의 결정을 막는다. 본문과 패키지는 킷이 복사하지 않는다(이식은 기획에서 결정한 뒤 개발 단계의 일).
- Default chosen without asking: 배포는 반복 빈도 2위지만 기본값을 `none`으로 두었다(전역 규칙 «개발을 모두 마치기 전에는 배포하지 않는다», 비용과 되돌리기 어려움). 프로젝트 설정으로만 `after-complete`. 커밋은 단위마다 묻지 않고(경로 지정), push는 지시에 포함하지 않았다. 프로젝트 모드 무장은 이어가기 낱말에만 걸고 일회성 지시와 질문에는 걸지 않는다. 기본 디자인은 운영자가 고른 디자인 스킬로 적었다.
- Rationale: 지시를 프로젝트마다 손으로 적으면 어긋나고 빠진다(G20 단일 원천, G22와 같은 구조). 폴더가 지시와 훅을 갖고 있으면 운영자의 한 줄이 루프를 시작하고, 묻는 대신 기본값으로 진행한다.
- Reversible: yes. 레지스트리의 `orders`, 킷 폴더, 스크립트 3개, 에이전트 5개의 한 절, SKILL 3곳을 지우면 된다. 프로젝트 쪽은 `CLAUDE.md`의 관리 블록과 설정의 훅 세 줄을 지운다.
- Not done / 확인 못 한 것: 실제 새 프로젝트에서 킷으로 기획서부터 배포까지 끝낸 실행은 아직 없다(자체 fixture와 임시 폴더, 실제 모듈 저장소 대조 26/26만). «규칙»으로만 집행되는 지시(O-02, O-16, O-18)는 기계 검사가 없다. 명령 통계는 낱말 분류다. 프로젝트 폴더에는 에이전트 팀이 없어 세션이 본체의 SKILL.md를 읽어야 한다(스킬 전역 설치는 운영자 결정).
- Next: 다음 실제 사이트를 킷으로 시작해 운영자 메시지 수와 이어가기 지시 횟수를 이전 프로젝트와 비교하고, 태그별 묶음 기본값의 적중률을 track으로 남긴다.

## 2026-11-17: G24 모든 세션에 상시 지시 적용: 전역 지시 파일의 관리 블록 하나 (operator question, v2.11.0)
- Decision: 운영자의 질문(«모든 세션이 쿨한을 참조하는가, 쿨한으로 하라고 해야 하는가. 적용 방법은 간단해야 하고 모든 명령에 쿨한의 규칙이 적용되어야 한다»)에 대한 사실은 «아니다, 본체 폴더와 킷을 설치한 폴더에서만 적용됐다»였다. `scripts/install-global.js`가 사용자 지시 파일(모든 세션이 읽는 파일)에 관리 블록 하나를 넣는다: 레지스트리에서 파생한 상시 지시 전부, 본체 위치, 모듈 저장소 위치, «개발을 시작하는 폴더에 킷이 없으면 묻지 않고 먼저 설치한다»는 규칙.
- Decision (2): 이 기기에 바로 적용했다. 운영자가 «모든 명령에 적용되어야 한다»고 말했고, 변경은 블록 하나이며 이전 파일을 옆에 보관하고 `--remove`가 바이트 단위로 되돌린다. 설정 파일과 훅은 바꾸지 않았다(루프 훅은 프로젝트별 설치 그대로). 모든 세션에 정지 차단 훅을 거는 것은 개발이 아닌 세션까지 영향을 주므로 하지 않았다.
- Decision (3): 킷은 쿨한 본체 폴더와 모듈 저장소 폴더에는 설치를 거부한다(전역 규칙이 본체 세션에서 본체에 킷을 까는 일을 막는다).
- Decision (4): «이어서 진행하라»에 따라 가장 오래 열려 있던 결함 넷을 닫았다: 복제된 인자 도우미와 `parseFlags`, `readText`를 `scripts/lib` 한 곳으로 옮기고(D-2~D-4), 업데이트 확인 스크립트의 삼킨 오류 4건이 사유를 출력하게 했다(D-8). 두 래칫 기준선을 낮췄다.
- Default chosen without asking: 전역 블록에는 태그 구분 없이 지시 18건 전부를 넣었다(전역에는 프로젝트 태그가 없다). 폴더의 `CLAUDE.md`에 같은 번호의 지시가 있으면 폴더 것이 우선한다고 적었다. 스킬과 에이전트는 복사하지 않고 본체 경로를 가리킨다.
- Rationale: 운영자가 반복한 명령의 원인은 지시가 폴더마다 없었다는 것이고(G23), 킷 설치 명령 자체도 반복 명령이 된다. 모든 세션이 읽는 파일 한 곳에 파생 블록을 두면 설치 명령도 필요 없다.
- Reversible: yes. `node scripts/install-global.js --remove`, 또는 `CLAUDE.md.before-coolhan`으로 되돌린다.
- Not done / 확인 못 한 것: 다른 폴더에서 새로 연 세션이 이 블록대로 움직이는지는 관측하지 않았다(설치, 파생, 복구만 증명). 블록은 세션마다 약 8 KB를 더 읽게 한다. 전체 시험이 두 번 훅 시험에서 빈 출력으로 실패했다. CPU 포화 측정에서 한 번의 실행에 1,200회 중 41건(spawn 오류 37, 시작 직후 종료 4)이 나왔고 이어진 5,700회는 0건이었다: 자식 프로세스가 시작되지 못한 것이다. 시험 쪽은 `runNode`로 그 경우만 다시 띄우게 했고, 기기 쪽 원인은 밝히지 못했다(D-13 열림). 실제 사용에서 훅이 시작되지 못하면 정지 차단도 작동하지 않는다: 이것은 하네스 밖(세션을 돌리는 프로그램)의 일이라 고치지 못했다.
- Next: 다음 세션(다른 프로젝트 폴더)에서 킷 자동 설치, 이어가기 지시 없는 진행, 5줄 보고를 관측해 track으로 남긴다. 블록 크기가 부담이면 지시문을 줄이는 곳은 레지스트리 한 곳이다.

## 2026-11-17: D-13 기기 쪽 원인: 훅 자식 프로세스가 시작되지 못한 것은 가상 메모리 부족 (v2.11.1)
- Decision: «이어서 진행하라»를 원장 «현재 위치»가 적어 둔 다음 단위 넷 중 «열린 결함 D-13의 기기 쪽 원인 찾기»로 해석했다. 나머지 셋(다른 폴더의 새 세션 관측, 실제 새 사이트, 목표 줄 변경)은 다른 폴더나 운영자의 지시가 있어야 시작할 수 있다.
- Decision (2): 원인은 측정으로 정했다. 실패한 전체 실행 4번이 모두 운영체제의 메모리 부족 기록과 60초 안에 겹쳤고 [관찰], 모든 코어를 채우고 메모리 여유를 둔 6,960회는 전부 시작됐고 [실측], 커밋 한도를 건 작업 개체 안에서는 여유 약 48MB 아래에서 훅이 시작되지 못했다 [실측].
- Decision (3): 기기 전체의 메모리를 일부러 바닥내는 실험은 하지 않았다. 같은 기기의 다른 프로세스가 죽을 수 있다. 부족 상태는 작업 개체(이 트랙의 프로세스 묶음만 제한) 안에서 재현했다.
- Decision (4): D-13을 닫았다. 근거: 원인 확인, 격리 재현, 시작하지 못한 자식을 알아보는 판정(재현한 120건 중 놓친 것 0건), 기기 상태 탐침, 감독 프로세스의 대기. 하네스가 고칠 수 없는 부분(메모리가 없는 순간에는 대화형 세션의 훅이 시작되지 않는다)은 가정 A-30에 한계로 적었다.
- Default chosen without asking: 여유 기준 1,024MB(잰 크기의 자식 약 20개). `--min-free-mb`로 바꾼다. 감독 프로세스의 대기는 60초씩 최대 10번이고, 그 뒤에는 멈추지 않고 띄운 다음 기록에 LOW를 남긴다(무중단이 목표이므로).
- Default chosen without asking (2): 탐침을 고정 검증 목록의 행으로 넣지 않았다. 기기 상태 때문에 «확인 안 함»이 생기면 코드와 무관하게 완료를 막고, 재지 못하는 운영체제에서는 항상 막는다. 대신 checks-run이 통과가 아닌 결과와 함께 기기 상태를 적는다.
- Rationale: 실패를 기록할 때 종료 코드, stderr, 기기 상태를 남기지 않아 두 세션 동안 원인을 찾지 못했다(교훈 F-41). 시작하지 못한 것과 실행하고 실패한 것을 한 곳(`memoryDenied`)에서 가른다.
- Reversible: yes. `scripts/resource-check.js`, `memoryDenied`, checks-run의 두 줄, nonstop의 `awaitHeadroom`, 레지스트리의 F-41을 지우면 된다.
- Not done / 확인 못 한 것: 운영체제 기록과 실패의 연결은 4번 중 4번의 관찰이다. macOS는 재지 않는다. 다른 Node 버전에서 시작에 필요한 메모리는 재지 않았다. 전체 시험 한 번이 요약 없이 종료 코드 127로 끝난 일이 있었고(여유 PASS, 운영체제 기록 없음) 바로 다시 돌린 실행은 통과했다: 결함 D-14로 등록했다.
- Next: 빈 출력 실패가 다시 나오면 재시도 줄과 checks-run의 기기 상태 줄에서 여유 값을 읽어 이 결론과 맞는지 본다.

## 2026-11-22: G25 모듈을 플러그인처럼: 모듈 표준, 형식 검사, 설치와 갱신, 전수 추출 (operator order)
- Decision: 운영자 지시(«모듈을 더 잘 분리하고 다른 폴더에서 고도화된 기능을 흡수한다», «다른 세션이나 폴더에서 필요한 모듈을 갖다 쓰고, 과거의 모듈이면 고도화된 것을 붙여 쓴다. 워드프레스의 모듈처럼», «각 모듈마다 이름을 주고 같은 하위 폴더 구성, 파일 이름 규칙», «소스가 안정적이고 DB가 분리되고 취약점이 없고 착탈이 되는 모듈», «전수적으로 순차적으로 하나씩 떼어 내고, 비교해서 더 좋은 것을 모듈화하고, 정돈해서 가져온다»)를 구동 문서 하나(`knowledge_base/00_MODULE_STANDARD.md`)와 도구 셋(`module-check`, `modules`, `module-convert`)으로 만들었다.
- Decision (2): 모듈 저장소에는 새 폴더 `modules/`만 더한다. 이전 형식 `packages/`와 다른 세션의 미커밋 변경은 건드리지 않고, 커밋은 그 경로만 한다. 별도 브랜치로 시작하겠다고 했던 것은 운영자가 그 뒤에 «모든 세션이 갖다 쓸 수 있어야 한다»고 했으므로 새 폴더를 주 작업 트리에 더하는 방식으로 바꿨다(기존 파일 변경 0).
- Decision (3): 연동은 «밖에서 남의 폴더를 고치는 것»이 아니라 «판과 해시»로 한다. 모듈의 판이 오르면 쓰는 프로젝트의 `modules status`가 알리고 그 프로젝트의 세션이 `modules update`로 바꿔 끼운다. 프로젝트가 모듈을 고쳤으면 `status`가 고친 파일을 보여 주고 그 고침은 저장소의 새 판으로 올린 뒤 다른 프로젝트가 받는다.
- Decision (4): 조사하다 찾은 원천 프로젝트의 오류는 모듈에서 고치고 시험을 붙인다. 원천 프로젝트의 파일은 고치지 않고 비공개 결함 목록에 적는다(같은 폴더에서 다른 세션이 일한다, 교훈 F-09).
- Default chosen without asking: 추출 순서는 운영자가 원천을 지정한 것부터다(관리자, 픽업, 정산, 구매대행). 그다음 운영자가 반복이라고 말한 회원, 그다음 문서·연동·HS 코드·우편번호·디자인. 원천 지정과 대기열은 프로젝트 이름이 들어가므로 비공개 폴더(`.coolhan-private/module-harvest/`)에 둔다.
- Default chosen without asking (2): 프로젝트에 설치한 모듈이 없으면 `modules status --allow-none`은 0이다(킷의 고정 검증이 모듈을 쓰지 않는 프로젝트의 완료를 막지 않게).
- Rationale: 같은 기능을 사이트마다 다시 만들던 원인은 가져다 쓸 형식과 갱신 수단이 없었다는 것이다. 저장소의 패키지 체계는 둘로 갈라져 있었고(한 사이트의 통째 복사본 38개, 로더가 모르는 순수 규칙 68개), 출처 기록에는 커밋이 없었다.
- Reversible: yes. 모듈 저장소의 `modules/` 폴더와 본체의 문서 하나, 스크립트 셋, 지시 O-19, 킷 런처의 한 갈래를 지우면 된다. 이전 형식은 그대로 있다.
- Not done / 확인 못 한 것: 화면과 서버가 든 이전 형식 38개는 아직 표준 형식이 아니다(분리부터 필요하다). 다른 프로젝트 폴더에서 모듈을 실제로 설치해 쓴 것은 임시 폴더 설치 시험뿐이다. `drift`는 바뀐 횟수만 세고 그것이 고도화인지는 읽어야 안다. 모듈의 보안은 형식(보안 문서와 거절 시험의 존재)만 기계가 본다.
- Next: 대기열(`.coolhan-private/module-harvest/QUEUE.md`)을 위에서부터 한 묶음씩: 추출, 형식 검사, 시험, 저장소 커밋.

## 2026-11-22: 모듈 입고 검사를 한 명령으로 (v2.12.1)
- Decision: 모듈을 저장소에 커밋하기 전의 네 가지 확인(형식, 모듈 시험, 빈 폴더 설치와 설치본 시험, 비밀값 스캔)을 `scripts/module-admit.js` 하나로 묶고 종료 코드를 모두 읽는다. 재지 못한 단계는 통과가 아니라 4다.
- Rationale: 손으로 한 줄씩 돌리던 순서에서 스캔의 종료 코드가 파이프 뒤에 가려 지적 4건을 보지 못한 채 저장소 커밋 1건이 들어갔다. 지적은 지어낸 시험 값이었지만, 실제 비밀값이었어도 같은 경로로 들어갔다. 순서가 글과 셸 기록에만 있으면 한 단계가 빠질 수 있다(교훈: 재지 않고 통과하는 검사).
- Default chosen without asking: 커밋은 스크립트가 하지 않는다. 저장소에는 다른 세션의 변경이 있어 경로를 지정한 커밋은 사람이든 세션이든 따로 한다.
- Reversible: yes. 스크립트 하나와 문서 몇 줄이다.
- Not done / 확인 못 한 것: 저장소 커밋 자체를 막는 훅은 두지 않았다(저장소는 본체가 아니고 훅 설치는 그 폴더의 설정을 바꾸는 일이다). 시험이 약한 모듈은 통과한다.

## 2026-11-22: 모듈 찾기와 실증 프로젝트 (v2.12.2)
- Decision: 저장소의 모듈이 백 개를 넘어 `modules list`에 영역과 낱말로 좁히는 옵션을 두고, 목록 파일은 매니페스트에서 만든다(손으로 쓰지 않는다). 찾은 것이 없으면 4다.
- Decision (2): 화면이 든 모듈은 비공개 실증 프로젝트에 모듈 관리자로 설치해 실제 브라우저에서 연다. 본체 저장소에는 보고서만 둔다(설치된 모듈 코드는 비공개 저장소의 것이다).
- Default chosen without asking: 권한이 걸린 화면 속성은 기본 거부로 둔다. 상세 틀의 «수정» 단추는 권한 속성이 필수가 됐고 깨지는 변경이라 주 판을 올렸다.
- Default chosen without asking (2): 출처와 이용 조건이 확인되지 않은 자료(HS 코드표와 별칭표)는 모듈에 넣지 않고 로더 창구로 받는다. 조회처와 세무와 법무 가정은 «미검증»으로 적고 값은 설정으로 뺐다.
- Not done / 확인 못 한 것: 실증은 프로젝트 하나, 스택 하나, 브라우저 엔진 하나다. 추출 에이전트 하나가 원천 프로젝트 폴더에 임시 파일을 한 번 복사했다가 지웠다고 보고했다. 그 폴더에서 다른 세션이 일하고 있어 남은 파일이 없는지 밖에서 가려낼 수 없었다. 이후 지시문에 «임시 파일은 자기 임시 폴더에만»을 넣는다.

## 2026-11-22: 모듈이 여는 파일을 매니페스트에 적는다 (v2.12.3)
- Decision: 다른 모듈은 `core/index`와 그 모듈이 `provides.entries`에 적은 파일만 가져온다. 형식 검사가 이웃 모듈의 매니페스트를 읽어 판정한다. 이웃이 곁에 없으면 닫힌 것으로 본다.
- Rationale: `core/index`만 허용하자 화면 모듈이 올라타는 틀의 모양을 베껴 두었고, 틀이 부 판에서 함수 하나를 더하자 베낀 모양이 어긋나 실증 프로젝트의 빌드가 깨졌다. 베끼게 만든 규칙이 원인이었다.
- Default chosen without asking: 여는 단위는 파일이다(이름 단위가 아니다). `test/` 아래는 열 수 없다.
- Reversible: yes. 검사 한 갈래와 매니페스트의 한 칸이다.
- Not done / 확인 못 한 것: 고친 모듈들이 함께 맞는지는 입고 검사가 보지 않는다. 실증 프로젝트의 타입 검사가 거기 올라간 모듈에 한해 잡는다.

## 2026-11-22: 고친 모듈은 그 모듈을 쓰는 모듈까지 함께 잰다 (v2.12.4)
- Decision: `module-admit --with-dependents`가 `requires`를 따라 직접, 간접으로 쓰는 모듈을 모두 더해 잰다. 더한 모듈의 이름을 출력한다.
- Rationale: v2.12.3의 사고에서 틀의 새 판은 혼자서는 입고 검사를 통과했다. «쓰는 모듈도 함께 잰다»를 인수인계의 한 줄로 두면 잊는다.
- Default chosen without asking: 화면을 읽어 오는 원천 코드(운송사의 공개 조회 페이지를 읽는 코드)는 모듈에 가져오지 않는다. 공식 인터페이스가 없는 기능은 창구와 가짜만 두고 «라이브 어댑터 없음»이라고 적는다.
- Default chosen without asking (2): 디자인 모듈에서 브랜드 색이 자기 바탕에서 대비를 못 넘으면 브랜드 값은 토큰으로 남기고 통과하는 짝 토큰을 더한다. 로고, 이미지, 글꼴 파일, 페이지 구역은 가져오지 않는다.
- Not done / 확인 못 한 것: 디자인 모듈 다섯은 브라우저에서 열어 보지 않았다(대비는 토큰 값으로 계산했다). 제공처의 실제 응답과 이용 조건은 확인하지 않았다.

## 2026-11-22: 입고 검사에 «모듈을 쓰는 프로젝트» 단계 (v2.12.5)
- Decision: `module-admit --consumer <프로젝트>`가 모듈이 모두 통과한 뒤 그 프로젝트에서 `modules update --all`과 프로젝트의 확인 명령을 돌린다. 통과하지 못한 모듈이 있으면 프로젝트를 건드리지 않는다.
- Rationale: 하루에 세 번, 모듈 갱신이 실증 프로젝트의 타입 검사를 깨뜨렸고 세 번 다 그곳에서만 보였다(베낀 타입의 어긋남 1건, 부 판으로 나간 깨지는 변경 2건). 손으로 돌리던 단계다.
- Default chosen without asking: 필수 칸이 생기는 타입 변경은 주 판으로 올린다. 이미 부 판으로 나간 회원 관리 모듈은 같은 코드에 주 판 번호를 다시 붙였다.
- Not done / 확인 못 한 것: 프로젝트의 확인은 타입 검사다. 화면을 실행하지 않는다. 쓰는 곳이 없는 변경은 여전히 지나간다.

## 2026-11-22: 모듈의 DB는 실제 PostgreSQL에서 잰다 (v2.12.6)
- Decision: `scripts/module-db-check.js`가 실행 때마다 임시 클러스터를 만들어 스키마와 PostgreSQL용 보장 파일을 두 번씩 실행하고 지운다. 한 DB용 보장 파일만 있으면 형식 검사가 지적한다(`db-guard-one-dialect`).
- Rationale: 운영자 지시 «이어서 확인을 하라». «PostgreSQL에서 돌려 보지 않았다»는 줄이 모듈 보고마다 있었다. 처음 실제로 돌리자 일곱 모듈의 추가전용 보장이 SQLite에만 있고 PostgreSQL에서는 UPDATE와 DELETE가 통과한다는 것이 나왔다.
- Default chosen without asking: 이 기기에 설치된 PostgreSQL 프로그램만 쓰고(내려받지 않는다) 기기의 서비스와 자료에는 접속하지 않는다. 비밀번호를 쓰지 않는다(임시 클러스터는 127.0.0.1에서 trust 인증).
- Default chosen without asking (2): 추가 20개는 남은 폴더 조사의 후보에서 여러 프로젝트에 반복되고 돈과 보안에 닿는 것을 먼저 골랐다. AI 호출 모듈은 본체의 AI 아키텍처 원칙(G19)을 조항별로 따르게 했다.
- Not done / 확인 못 한 것: 보장이 실제로 거절하는지는 열세 모듈에서 손으로 쟀고 스크립트는 되풀이하지 않는다. PostgreSQL 한 판. 이 저장소의 CI 기기에 PostgreSQL 프로그램이 있는지는 재지 않았다(없으면 그 시험은 건너뛴다고 출력한다).

## 2026-11-23: 시각과 금액을 담는 정수 열은 64비트 (v2.12.7)
- Decision: 형식 검사에 `db-int32-column`을 더하고 PostgreSQL 검사가 DB가 만든 열의 폭을 읽는다. 열은 이름으로 고른다(`*_at`, `*_until`, `at_ms`, `*_minor`, `*_cents`, `amount`, `balance`). 길이를 담는 이름(`duration`, `latency`, `ttl`)은 고르지 않는다.
- Rationale: 추출 보고 하나가 완성된 모듈의 밀리초 열이 INTEGER라고 적었다. 세어 보니 15개 모듈의 32개 열이었고, 그 스키마들은 PostgreSQL 검사를 통과해 있었다. 실제 PostgreSQL에서 값을 넣으면 거절된다(track47 7번).
- Default chosen without asking: 금액도 같은 규칙에 넣었다(큰 합계는 32비트를 넘는다). 예외는 그 줄의 표시(`-- int4-ok: 이유`)로만 둔다. 저장소의 15개 모듈은 패치 판으로 고쳤다(SQLite 사이트는 옮길 일이 없다).
- Default chosen without asking (2): 이전 형식 꾸러미는 `packages/`를 고치지 않고 표준 형식 모듈로 새로 옮긴다. 그 폴더에서 다른 세션이 일하고 있다. 꾸러미 사이의 테이블 직접 접근은 새 모듈에서 창구로 바꾼다. 옮긴 꾸러미를 `packages/`에서 빼는 일은 하지 않는다(그 폴더의 주인이 정한다).
- Not done / 확인 못 한 것: 값을 넣어 보는 검사, PostgreSQL용 저장소 어댑터, 이름이 시각이나 금액을 말하지 않는 열.
- Reversible: yes. 규칙은 `scripts/module-check.js`의 정규식 두 개다.

## 2026-11-24: 표가 있는 모듈은 그 표에서 도는 저장소를 함께 낸다 (v2.12.8)
- Decision: 형식 검사에 `db-schema-unexercised`를 더했다. `db/schema.sql`이 있는데 `adapters/`나 `test/`의 어느 파일도 그 파일을 글자열로 이름하지 않으면 지적이다. 저장소는 SQLite용으로 쓰고 메모리 저장소와 걸음마다 견주는 대조 시험을 둔다.
- Rationale: 운영자 지시 «모든 모듈이 다 완성될 때까지». 완성도를 재는 표를 만들자 표가 있는 모듈 57개에 메모리 저장소만 있었다. 저장소를 붙인 58개 모듈에서 실제 표가 결함 109건을 보여 줬다(각 실행 보고의 합).
- Default chosen without asking: 관리자 틀을 «한 모듈»로 만들라는 지시는 여덟 모듈을 물리적으로 합치지 않고 그 위에 올라탄 한 모듈(`admin-kit`)로 풀었다. 사이트가 가져오는 이름, 진입점, 모양 파일이 하나다. 합치면 그 모듈들을 쓰는 스무 개 넘는 모듈이 깨지고 같은 코드가 두 곳에 생긴다.
- Default chosen without asking (2): 기기 메모리가 모자라 입고 검사는 한 번에 하나씩만 돌린다. 다른 프로젝트의 개발 서버는 다른 세션의 것이라 건드리지 않는다.
- Default chosen without asking (3): 다른 세션이 같은 저장소 폴더에서 함께 일한다. 같이 고치는 파일은 HEAD에 내 줄만 더한 내용을 스테이징해 내 변경만 커밋한다.
- Not done / 확인 못 한 것: PostgreSQL용 저장소, 화면 49개 모듈의 브라우저 확인, 결함 109건의 건별 재확인(모듈마다 입고 검사는 다시 돌렸다).
- Reversible: yes. 규칙은 `scripts/module-check.js`의 `schemaIsRun` 하나다.

## 2026-11-24: 화면 49개 모듈을 브라우저에서 잰 뒤의 판단 (단위 57)
- Decision: 화면 측정 도구를 실증 프로젝트 안에 둔다(`src/screens/measure.ts`, 개발 서버에서만 창에 붙는다). 기준은 빈 화면 0, 가로 넘침 0, 폰 폭에서 누르는 자리 44px 이상(눈에 24px인 도움말 단추는 투명한 누름 영역으로 넓힌 것을 센다, 문장 안의 링크는 뺀다), 폰 폭에서 입력 글자 16px 이상, 화면에 나온 문구 열쇠 0, 콘솔 오류 0이다.
- Decision (2): `provides.entries`는 모듈이 다른 모듈을 가져올 때의 경계로 둔다. 사이트는 `provides`가 이름한 화면, 서버 경로, 저장소, 문구, 모양을 정해진 하위 폴더에서 가져온다. 표준 §6에 한 줄로 적었다.
- Rationale: 화면을 올린 에이전트들이 «목록에 없는 화면 파일»을 66개 모듈에서 보고했다. 내가 준 지시문의 기준이 표준보다 좁았다. 세어 보니 사이트가 가져온 파일 가운데 `provides`의 어느 칸도 이름하지 않은 것은 `api/routes.ts`와 `adapters/`의 파일뿐이었고, 그것들은 `provides.api`와 `provides.adapters`가 함수 이름으로 이름하고 있었다. 66개 모듈의 매니페스트를 고치는 대신 표준의 문장을 고쳤다.
- Default chosen without asking: 서버 코드(`api/`)가 Node 전용 기능을 쓰는 것은 결함으로 보지 않는다. 브라우저가 실행하는 코드(`core/`, `user/`, `admin/`, 시연과 시험용 어댑터)만 고쳤다. 실증 프로젝트의 행 링크가 기록 id를 싣지 않는 것은 실증 파일의 일이라 모듈을 고치지 않았다(모듈은 id를 넘긴다).
- Not done / 확인 못 한 것: 화면 낭독기, 인쇄, 다른 브라우저 엔진, 글자 200%. 측정은 한 브라우저 엔진의 1280px와 375px다.
- Reversible: yes. 기준은 측정 파일의 상수와 정규식이다.

## 2026-11-24: 잰 뒤의 정리는 판정을 바꾸지 못한다 (v2.12.9)
- Decision: 임시 폴더 삭제를 공용 도우미(`scripts/lib/fs.js`의 `removeTree`) 하나로 모았다. 열 번까지 다시 시도하고, 끝내 못 지우면 경로를 돌려준다. 던지지 않는다. `module-db-check`는 판정을 먼저 계산하고 남은 폴더를 따로 적는다. `module-admit`의 설치 단계도 같은 도우미를 쓴다.
- Rationale: 저장소 전체 PostgreSQL 검사가 모든 모듈을 잰 뒤 클러스터 폴더 삭제에서 EPERM으로 끝나 판정 줄 없이 종료했다. 런타임의 재시도 옵션은 이 오류에서 다시 시도하지 않았다(다른 프로세스가 잡은 폴더에서 2ms 만에 실패).
- Default chosen without asking: 다른 세션이 올린 모듈에서 실증 프로젝트의 타입 검사가 잡은 오류 셋(동작은 같고 타입만)을 내가 고쳐 패치 판으로 올렸다. 그 세션은 쓰는 프로젝트의 타입 검사를 돌리지 않는다.
- Default chosen without asking (2): 결제 분할의 환불 순서는 «바깥 결제분 먼저, 나머지는 잔액»으로 뒀다(에이전트의 선택, 모듈의 순수 함수 한 곳). 운영자가 비율 환불을 원하면 그 함수만 바꾼다.
- Not done / 확인 못 한 것: 다른 게이트에 같은 모양(잰 뒤의 정리가 던짐)이 있는지 전부 읽지는 않았다. 3초 넘게 잡힌 폴더는 남고 PostgreSQL 검사의 다음 실행이 지운다(입고 검사의 설치 폴더는 남는다).
- Reversible: yes. 도우미 하나와 호출 세 곳이다.

## 2026-11-24 모듈 전수 점검과 연동 검사 (v2.13.0)
- Decision: 점검은 모듈 하나에 에이전트 하나, 규약 한 장(`PROTOCOL.md`)으로 했고, 입고 검사 통과 뒤 경로를 지정해 묶음 커밋했다. 연동·디자인 이관 검사는 입고 검사의 다섯째 단계로 넣었다.
- Rationale: 형식 검사는 모듈 하나만 읽는다. 시험이 통과해도 이웃과 안 맞거나 모양이 따로 놀 수 있다. 저장소 전체를 한 번 읽어 그 모듈 몫만 거르면 한 모듈당 비용이 늘지 않는다(전체 읽기는 약 6초, 한 번만).
- Default chosen without asking: 에이전트가 «다른 모듈에 필요한 것»으로 보고한 항목은 묶음(A 화면과 타입, B 대행·배송·권한, C 결제·지갑·알림)으로 나눠 사실인지 먼저 확인시킨 뒤 고쳤다. 사실이 아니면 «해당 없음»과 이유를 적게 했다(access-guard 규칙표, shipping-tracking 거절 정지는 의도라 코드를 바꾸지 않았다).
- Default chosen without asking (2): `customs-doc-service`는 처음 다른 세션이 작업 중이라 건너뛰었다가 작업 트리가 깨끗해진 뒤 다시 점검했다.
- Not done / 확인 못 한 것: 점검 뒤의 화면 주소 656개 재측정, 화면 낭독기, 인쇄, 실제 외부 서비스 호출, PostgreSQL용 저장소 코드. 새 시험이 옛 코드에서 실패하는지를 모든 모듈에서 되돌려 보지는 않았다(일부는 시도가 권한으로 거절됐다).
- Reversible: yes. 다섯째 단계는 `STEPS`에서 한 줄을 빼면 된다.

## 2026-11-25: 누른 뒤의 흐름을 잰다 (단위 58)
- Decision: 실증 프로젝트의 측정 도구에 누르기 측정을 더했다. 주소마다 단추를 하나씩, 주소를 새로 연 뒤 한 번 누르고 그 뒤의 화면을 잰다. «눌러도 아무 일 없음»은 판정이 아니라 후보로 내고 사람이 갈래별로 읽는다.
- Rationale: 직전 보고의 «확인 안 함»에 «화면에서 누른 뒤의 흐름»이 있었다. 주소를 열었을 때의 모습만 재서는 단추가 던지는지, 죽은 단추인지 알 수 없다(상시 지시 O-11).
- Default chosen without asking: 화면이 그대로인 것이 맞는 경우를 도구가 가린다(이미 켜진 탭과 고른 값, 꺼진 묶음 안의 단추, 브라우저가 알리는 빈 필수 칸, 실패와 불러오는 중을 시연하는 주소, 같은 조건의 재조회, 인쇄와 창 띄우기). 재조회는 단추 글자로 가린다(시연의 글자에 맞춘 것이라 다른 프로젝트에서는 목록을 고쳐야 한다).
- Default chosen without asking (2): 본체 코드가 바뀌지 않아 판을 올리지 않았다. 문서와 원장만 커밋한다.
- Not done / 확인 못 한 것: 이어서 누르는 흐름, 값을 적은 뒤의 제출, 375px에서의 누르기, 확인창의 «아니오» 쪽.
- Reversible: yes. 도구는 실증 프로젝트의 파일 하나다.
