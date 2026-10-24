# 세션 누적 학습 (G18) — 분석·기획 (2026-10-24)

운영자 지시: 모든 세션의 작업(실패·성공·해결 방법의 고도화, 규정·규칙·명령, 사용자 명령 패턴, 보안 강화 목록, 구축 보안성)을 쿨한 하네스에 **자동으로 쌓아** 하네스가 스스로 성장하게 한다.

## 1. 분석 (실제 확인한 것)

| 대상 | 사실 |
|---|---|
| 하네스 위치 | `C:\sites\CoolHan builder`(git, v2.5.1, **공개 원격** `github.com/zmjckim-fa/coolhan`, npm 패키지 `coolhan-builder`) |
| 이미 있는 것 | G5 원장 · G17 `scripts/self-growth.js`(원장·DECISIONS·run-report·proposals·`--sites` 판정표를 읽어 개선 백로그 제안, **세션 대화는 안 읽음**) |
| 세션 기록 | `~/.claude/projects/<프로젝트>/*.jsonl` 12개 프로젝트 · 약 28개 대화 · 3.1GB, 메모리 `…/memory/*.md` 약 260개(cleanwine 161 · cleanlab-work 36 · …) |
| 대화 형식 | 사람이 친 말 = `type:"user"` + 문자열/`text` 내용 + `origin.kind:"human"`(옛 기록은 origin 없음) · 도구 결과·서브에이전트 보고·시스템 알림은 같은 `user` 타입이므로 반드시 걸러야 함 |
| 위험 | ① 대화에 비밀번호·토큰·고객 이름/연락처·서버 IP 가 섞여 있다 ② 하네스 저장소는 **공개 원격**이라 학습 데이터가 커밋되면 유출 ③ `package.json files` 화이트리스트라 npm 에는 안 실리지만 git 에는 실림(`_workspace/` 는 .gitignore 에 없다) |
| 계정 한계 | 이 PC 의 이 계정 기록만 읽을 수 있다(다른 계정·기기 기록은 접근 불가) — 한계를 문서·출력에 명시 |

## 2. 설계

**수집(`scripts/harvest-sessions.js`, 새 파일)** — 허용 목록 방식, 원문 보관 금지.
1. 메모리 파일(`feedback|user|project|reference`) → 교훈/규칙(이미 사람이 다듬은 것, 제일 신뢰).
2. 사람 발화(위 필터) → 주제 분류 + 명령 강도(명령형 어미) + 마스킹된 짧은 발췌(≤200자). 원문 전체·첨부·도구 결과는 저장하지 않는다.
3. 프로젝트 문서(`docs/DECISIONS.md`·`CLAUDE.md`·`HANDOFF.md`, 대화의 `cwd` 로 찾음) → 사고·장애·재발 방지·보안 줄(줄 번호 출처 포함).
4. 모든 문자열은 저장 전 **마스킹**(비밀 키·토큰·`비밀번호=`·JWT·긴 해시·이메일·전화·IPv4·URL 자격증명).

**저장(비공개)** — `CoolHan builder/.coolhan-private/learned/` (**.gitignore 에 추가**, 시험이 git 무시를 확인):
`lessons.jsonl`(추가 전용, id 해시로 중복 제거) · `human-messages.jsonl`(주제·발췌) · `state.json`(파일별 읽은 바이트 위치 — 증분) · `DIGEST.md`(재생성, ≤16KB, 에이전트가 읽는 요약).

**DIGEST.md 구성**: ① 운영자 명령 패턴(주제별 횟수·강도·발췌) ② 지켜야 할 규칙(feedback 메모리) ③ 반복 실패·사고와 해결(문서 근거) ④ 보안 강화 목록(보안 줄 중복 제거) ⑤ 출처·수집 시각·한계.

**자동 적용(세 겹)**
1. `SessionEnd` 훅(전역 `~/.claude/settings.json`) → `node harvest-sessions.js --incremental --quiet`(백그라운드·실패해도 세션에 영향 없음).
2. 전역 `~/.claude/CLAUDE.md` 에 한 줄: 세션 시작 시 DIGEST 를 읽는다.
3. 하네스 쪽: 오케스트레이터 Phase 0(맥락 흡수) 읽을 것에 DIGEST 추가, `self-growth.js` 가 `lessons.jsonl`·`human-messages.jsonl` 을 새 증거원(`learned`)으로 읽어 반복 주제·사고를 백로그 후보로 올린다.

**정직한 한계(문서·출력에 명시)**: 분류는 키워드 규칙이라 의도를 이해하는 것이 아니다 · 이 계정·이 PC 기록만 · 마스킹은 알려진 패턴만(고유명사는 못 잡음 → 그래서 비공개 폴더·git 무시) · DIGEST 는 조언이고 게이트가 아니다(게이트 변경은 기존 의식: 시험+적대 트랙).

## 3. 검증 계획
- 단위 시험: 마스킹(키·토큰·이메일·전화·IP·JWT·자격증명 URL) · 사람 발화 필터(도구 결과·서브에이전트·시스템 알림 제외) · 증분(두 번 돌려도 중복 0, 새 줄만 추가) · DIGEST 크기 상한 · `.gitignore` 가 비공개 폴더를 무시 · 공개 패키지 `files` 에 비공개 폴더 없음.
- 실데이터: 12개 프로젝트 전체를 실제로 돌려 건수 보고, **출력 전체를 비밀 패턴으로 재검색해 0건**, `git status` 에 비공개 파일이 안 잡히는지.
- 훅: 설정에 등록된 명령을 그대로 실행해 종료 코드 0·증분 동작 확인.
