# Track 30 — Commercial-Readiness Gate (G14) adversarial verification

User-specified capability: judge 상용화 가능 여부 by 5 user-facing criteria (항목/저장/전송/
텍스트/디자인), measured against production over real HTTP, with a permanent "keeper"
(script/test) per criterion — keeper-less criteria are NOT_RUN, never PASS. All scenarios run
real child-process keepers via `scripts/commercial-gate.js`; verdicts in `_workspace/`.

| Scenario | Setup | Expected | Actual | Match |
|---|---|---|---|---|
| A: mixed state | items keeper FAILS (real exit 1 + assertion tail), 3 criteria pass, design has NO keeper | BLOCKED (exit 1); FAIL carries evidence tail + "측정값 ≠ 결함, 소스 확인" note; design listed as NOT_RUN(통과 아님) in ③ | exactly that (`VERDICT-blocked.md`) | ✅ |
| B: full coverage, all passing | 5 criteria × passing keepers | READY (exit 0), ①②③ sections complete, honest bound stated | READY, "② 없음 / ③ 없음 — 5개 기준 모두 지킴이 존재" | ✅ |
| C: real production probe | base_url https://coolhanx.com | reachability measured by real HTTP and recorded in the verdict header | "운영 도달성: HTTP 302 (실측)" — a genuine production round-trip | ✅ |
| D: unit tests | 7 cases (READY, one-fail→BLOCKED, keeper-less→NOT_READY, FAIL>NOT_RUN precedence, multi-keeper all-must-pass, unreachable-probe honesty, ①②③+honest-bound rendering) | 7/7 | jest 7/7 | ✅ |

0 false positives (nothing keeper-less ever counted as PASS; READY only with full coverage),
0 false negatives (a single failing keeper always blocked; failure evidence never dropped).

**Verdict:** PASS — 상용화 판정이 기계화됨: 운영 실측 강제(프로브 기록), 지킴이 없는 칸의
정직한 NOT_RUN, 측정≠결함 원칙이 산출물에 내장. 감사 절차·수리 규율(백업→배포→재측정→롤백,
운영 테스트데이터 금지, nginx/docker/SECRET_KEY 금지구역)은 `agents/commercial-readiness-auditor.md`.

**Honest bound:** READY = "선언된 지킴이가 지금 전부 통과 + 5기준 전부 지킴이 보유". 지킴이가
덮지 않는 결함의 부재 증명이 아니며, 지킴이 커버리지 확장이 계속되는 일이다. per-project
keepers(coolhanx.com의 실제 메뉴별 체크)는 해당 서비스 저장소에서 이 게이트의 config로 작성한다.
