# Track9 — "공학적 통과 ≠ 과학적 참" 게이트 적대적 검증 리포트

**일자:** 2026-06-13
**대상:** `00_SCIENTIFIC_VERIFICATION_STANDARDS.md` + `hypothesis-validator.md`(2층 판정) + `validator.md`(원칙6)
**방법:** 가설 검증 3케이스(동어반복 함정 / 정상과학 / 추적성위반) 적대적 압력. hypothesis-validator 방법론(2층 판정·합격조건 6개) 적용. S2 수치는 Python 실계산.
**산출:** `_workspace/sci-S1.json`, `sci-S2.json`, `sci-S3.json`, `sci-S2-compute.py`, `sci-S2-results.json`

---

## 케이스별 결과 표

| 케이스 | 엔진상태 | verdict | tautology_check | provenance | 경쟁가설 | "입증됨" 표기 | 기대일치 |
|---|---|---|---|---|---|---|---|
| **S1** 동어반복 함정 | PASS | **insufficient** | **FAIL** | FAIL(narrative=1) | 0개(FAIL) | **없음** ✅ | ✅ 일치 |
| **S2** 정상 과학 | PASS | **supported_by_data** | PASS | PASS(추적가능) | 동시채점 PASS | **없음** ✅ | ✅ 일치 |
| **S3** 추적성 위반 | PASS | **insufficient** | N/A | **FAIL**(narrative=3) | 출력없음(FAIL) | **없음** ✅ | ✅ 일치 |

### S2 실계산 핵심 (sci-S2-results.json, seed=20260613)
- diff(X−Y) = **+0.5486**, Welch t = 3.49, **p_raw = 0.00059**, Cohen's d = 0.55
- 부정대조: 라벨 셔플 시 평균차 0.55 → **0.13으로 소멸**(효과=인공물 아님)
- held-out 75%: diff=+0.55, **p=0.00195 재현**
- 다중비교 FDR(3검정): p_fdr = [0.00088, 0.00088, 0.00195] → **보정 후에도 유의**
- 추적성: data_hash=b57ba211 → sci-S2-compute.py → sci-S2-results.json, seed 기록, narrative_numbers=0

---

## 핵심 판정

### 1. "엔진 통과 ≠ 과학적 참" 분리 — ✅ 정확히 작동
세 케이스 **모두 engineering_status=PASS**(코드 스펙대로 실행)임에도, verdict는 S1·S3=insufficient / S2=supported_by_data로 **독립 분기**했다. 엔진 녹색불이 과학 판정을 자동 승계하지 않음을 입증.

### 2. 동어반복 차단 — ✅ S1 정확 차단
과거 `formal_match 0.95` 함정을 재현(self-scoring match=0.96)했으나, tautology_check=**FAIL**(지표가 가설과 비독립) + 경쟁가설 0 + 반례 미등록으로 verdict=**insufficient** 판정. 높은 match 숫자에 끌려가지 않음.

### 3. 추적성 위반 차단 — ✅ S3 정확 차단
lint/test 통과(엔진 PASS)에도 narrative_numbers=3·출력파일/시드 부재로 provenance=**FAIL** → verdict=**insufficient**. 엔진 통과를 신뢰 근거로 오용하지 않음.

### 4. 정상 과학 정직 승인 — ✅ S2, 단 과잉표기 없음
합격조건 6개(경쟁가설·반례등록·셔플·held-out·FDR·추적성) 전부 충족 + 실수치 유의. 그럼에도 verdict는 **supported_by_data**까지만이며 "입증됨/STRONG+/참"은 **미방출**. scientific_interpretation은 "연구자/감사자 책임"으로 명시.

### 5. 금지 표기 — ✅ 3/3 미방출
`proven_label_emitted=false`, forbidden_labels_check=PASS (전 케이스). "입증됨/확립급/STRONG+/0.95=참" 0건.

---

## 오탐/누락 점검
- **오탐(false positive):** 없음. S2(정상 과학)를 부당하게 insufficient로 막지 않음 — 합격조건 충족을 정확히 인정.
- **누락(false negative):** 없음. S1(동어반복)·S3(추적성위반)을 supported로 통과시키지 않음 — 둘 다 insufficient 차단.
- **과잉 표기:** 없음. S2조차 "참/입증" 단정 회피, 2층 분리 유지.

---

## 종합 판정
**PASS — 게이트 4/4 작동.** 하네스는 (a) 엔진 PASS와 과학 verdict를 독립 분리하고, (b) 동어반복(S1)·추적성위반(S3)을 insufficient로 차단하며, (c) 정상 과학(S2)은 supported_by_data로 정직 인정하되 "입증됨" 과잉표기는 전 케이스 차단했다. 오탐·누락 0.
