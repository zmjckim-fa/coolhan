# 단일 원천 지도 — 이 저장소 (§4-b, `knowledge_base/00_MINIMAL_SOURCE_PRINCIPLES.md`)

> 현황 실측(§4-a) 2026-10-31, `node scripts/single-source-check.js . --measure`:
> 파일 79 · 최대 파일 `scripts/harvest-sessions.js` 405줄 · 중복 도우미 3쌍 · 인라인 스타일 0 ·
> 하드코딩 문구 95 · 외부 대상 리터럴 0 (대상 미지정). 기준선: `docs/SINGLE_SOURCE_BASELINE.json`
> (C7 래칫 — 증가하면 FAIL, 감소하면 기준선 갱신).

| ID | 한 곳 | 지금 위치 | 목표 파일 | 상태 |
|---|---|---|---|---|
| S1 | 디자인 토큰·공통 스타일 | 해당 없음 (CLI·문서 저장소, 화면 없음) | — | n/a |
| S2 | 문구 사전 | **부분** — `scripts/messages/index.js` (G20 스크립트 3종 사용). 기존 스크립트 27개는 인라인 문구 95건(기준선) | `scripts/messages/index.js` | 부분 |
| S3 | 외부 대상 레지스트리 | 해당 없음 (외부 마켓·채널 없음; G15/G14가 다루는 URL은 인자) | — | n/a |
| S4 | 파생 표 계산 함수 | 해당 없음 (S3 없음) | — | n/a |
| S5 | 설정 카탈로그 | 해당 없음 (하네스 설정은 `.claude/settings.json` 훅 스키마 = Claude Code 소유) | — | n/a |
| S6 | 자격 | 해당 없음 | — | n/a |
| S7 | 메뉴·화면 지도 | 해당 없음 | — | n/a |
| S8 | 공용 라이브러리 | **부분** — `scripts/lib/md-table.js`(표·절 파싱), `scripts/lib/cli.js`(인자). 기존 중복 3쌍: `get`(8파일) · `parseFlags`(3파일) · `readText`(2파일) — 손대는 날 `lib/cli.js`·`lib/fs.js`로 이행 | `scripts/lib/` | 부분 |

## 이행 순서 (§4-e, 단위마다 C7 통과가 조건)
1. 공용 lib — 스크립트를 수정할 때 그 파일의 `get`/`parseFlags` → `lib/cli.js`, `readText` → `lib/fs.js`(신설 시) ✓ 새 코드 적용 중
2. 문구 사전 — 수정하는 스크립트의 출력 문장 → `scripts/messages/index.js` 키
3. 거대 파일 분리 — 405줄은 한도 미설정(`--max-file-lines`로 정하면 래칫에 포함)
4. 린트 — `docs/CHECKS.md` C7에 등록됨 ✓

## 탐지하지 못하는 것 (정직한 한계)
변수명만 다른 중복, 손으로 적은 파생 표(S4), 흩어진 설정값(S5), 일회성 파일(§2-⑤)은 숫자에 들어가지
않는다 — Plan Reviewer·Validator 판단 + 사람 몫.
