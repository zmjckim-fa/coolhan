# Track 7 — HX 게이트 적대적 검증 리포트

> **목표:** CoolHan 개발 하네스의 "사람 중심(HX) 게이트"가 *로직이 동작해도* HX 미달 코드를 FAIL 처리하는지 적대적으로 입증.
> **방법:** 동일 기능("회원가입 폼")을 CLEAN(HX 충족) / VIOLATED(HX 미달, 로직 동작) 2케이스로 작성 → Validator 10단계 HX 모사로 평가.
> **기준:** `references/human-experience-standard.md` 체크리스트, P0 = 폼UX·접근성·반응형·모듈화.
> **일자:** 2026-06-11

## 산출물
| 파일 | 설명 |
|------|------|
| `_workspace/signup-clean.html` | HX 충족 회원가입 폼 (로직 동작) |
| `_workspace/signup-violated.html` | HX 미달 회원가입 폼 (로직 동일하게 동작) |
| `_workspace/hx-validation-clean.json` | CLEAN hx_check 판정 (PASS) |
| `_workspace/hx-validation-violated.json` | VIOLATED hx_check 판정 (FAIL) |

## 두 케이스 모두 "로직 동작" 확인
- CLEAN: 인라인 검증 + 제출 → 로딩 → 성공 처리.
- VIOLATED: `doSignup()`이 빈 값 차단 후 통과(alert). **로직은 동작함.**
- 따라서 차이는 오직 사람-경험(HX) 품질뿐. HX 게이트의 변별력을 직접 측정.

## 색대비 실제 계산 (WCAG 2.1 상대휘도 공식, AA 본문 기준 4.5:1)
| 케이스 | 요소 | 색 (전경 on 배경) | 측정값 | AA |
|--------|------|-------------------|--------|----|
| CLEAN | 본문 텍스트 | #1a1a1a on #fff | **17.40:1** | PASS |
| CLEAN | 에러 텍스트 | #b00020 on #fff | 7.33:1 | PASS |
| CLEAN | 보조 텍스트 | #4b5563 on #fff | 7.56:1 | PASS |
| CLEAN | primary 버튼 | #fff on #0b5fff | 5.13:1 | PASS |
| VIOLATED | 본문 텍스트 | #aaa on #fff | **2.32:1** | FAIL |
| VIOLATED | 버튼 텍스트 | #ddd on #ccc | 1.18:1 | FAIL |
| VIOLATED | 입력 테두리 | #ccc on #fff | 1.61:1 | FAIL |

## HX 항목별 CLEAN vs VIOLATED 비교표
| # | HX 항목 | P0 | CLEAN | VIOLATED | VIOLATED 근거(파일:라인) |
|---|---------|:--:|:-----:|:--------:|--------------------------|
| 1 | 폼 UX (라벨·인라인검증·에러해결안) | ★ | PASS | **FAIL** | label 없음 placeholder만(L39,L42); 에러 "오류"만 해결안 없음(L58,L67) |
| 2 | 접근성 (시맨틱·키보드·대비) | ★ | PASS | **FAIL** | div onclick 버튼(L51) 키보드X; 대비 2.32:1<4.5; focus ring 없음 |
| 3 | 반응형 (viewport·브레이크포인트·터치) | ★ | PASS | **FAIL** | viewport meta 없음; 고정 width:900px(L13); 터치타깃 18px(L25) |
| 4 | 가독성·타이포 |  | PASS | **FAIL** | 본문 11px<16px(L9,L24,L33) |
| 5 | 버튼·액션 |  | PASS | **FAIL** | div 버튼, hover/disabled/loading 상태 없음 |
| 6 | 상태·피드백 |  | PASS | **FAIL** | 로딩 없음, 성공 alert만(L70), 에러 해결안 없음 |
| 7 | 플로우 |  | PASS | PASS | 단일 동작 플로우 존재 |
| 8 | 보안 UX |  | PASS | **FAIL** | 비밀번호 type=text 마스킹 안됨(L42) |
| 9 | 모듈화 (토큰·하드코딩금지) | ★ | PASS | **FAIL** | 디자인 토큰 없음; 색상 하드코딩 #aaa/#ccc/#ddd(L9,L23,L30,L31) |
| 10 | 소스 무결성 |  | PASS | **FAIL** | 인라인 style 혼재, 일관성 결여 |

## 판정
- **CLEAN → PASS** — P0 4항목(폼UX·접근성·반응형·모듈화) 전부 충족, 비P0도 전부 충족. 증거 기반.
- **VIOLATED → FAIL** — P0 4항목 **전부 미달**. 로직 동작은 무관. HX 표준 L13("미충족 1개라도 P0면 코드 동작해도 FAIL") 발동.

### 오탐·누락 검토
- **오탐(false positive) 없음:** CLEAN의 어떤 항목도 부당하게 FAIL되지 않음. 모든 PASS에 증거 첨부.
- **누락(false negative) 없음:** VIOLATED의 P0 위반(라벨없음/div버튼/대비미달/viewport없음/하드코딩) 4건 모두 정확히 항목·위치·해결안과 함께 적발. 비P0 위반도 경고로 포착.

## 종합 판정
**HX 게이트는 "로직이 동작해도 HX 미달이면 FAIL"을 정확히 강제한다. ✅ 검증 통과.**

- 동일 기능·동일 동작 로직임에도 HX 품질만으로 PASS/FAIL이 정확히 갈림 → 게이트의 변별력 입증.
- P0 메커니즘이 의도대로 작동: P0 단 1건 미달로도 전체 FAIL(VIOLATED는 4건 미달).
- 색대비는 추정이 아닌 실제 상대휘도 계산값으로 판정(CLEAN 17.40:1 vs VIOLATED 2.32:1).
- 모든 판정에 코드 근거(파일:라인) + 해결안 첨부 → Validator 산출물 형식(hx_check JSON) 준수.

### 비고
- VIOLATED는 기존 트랙4(기획 의도 위반 감지)와 직교(orthogonal)한 결함 유형 — 기획 범위 내 동일 기능이지만 사람-경험 품질만 미달인 케이스로, HX 게이트 고유의 가치를 분리 입증.
