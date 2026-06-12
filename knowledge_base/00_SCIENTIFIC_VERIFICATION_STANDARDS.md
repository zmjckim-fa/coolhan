# Scientific Verification Standards — 과학적 검증 표준 (검증 도메인 KB)

> **목적:** CoolHan의 녹색불(tests pass / deploy ready)이 "가설이 참"으로 오독되는 것을 구조적으로 차단한다.
> 감사 결론: 공학적 통과는 과학적 판정의 **전제조건**이지 **대체물**이 아니다.

## 0. 두 가지 타당성 — 절대 혼동 금지

| | 공학적 정합성 (Engineering Validity) | 과학적 타당성 (Scientific Validity) |
|---|---|---|
| 보증 명제 | "코드가 스펙대로 구현·테스트통과·재현가능하게 커밋됨" | "가설이 현실과 부합함" |
| CoolHan이 판정 | ✅ 가능 (validator/qa/e2e) | ❌ 불가 |
| 녹색불 의미 | "파이프라인이 명세대로 작동" | (의미 없음 — 별개 책임) |
| 책임 주체 | 하네스 | 연구자 + 감사자 |

**금지 표현(P0):** 엔진 통과를 "입증됨/확립급/STRONG+/match 0.95=참" 으로 표기 금지. 이는 동어반복(tautology) 함정이다.
**허용 표현:** "엔진 통과 = 이제 이 결과를 **신뢰하고 해석할 수 있다**(재현·추적 가능)." 해석·판정은 별도 단계.

## 1. 과학적 합격조건 (Acceptance Criteria as Code) — 스펙에 글로 박아넣을 것

가설 검증 스펙의 acceptance criteria는 아래를 **코드로 구현·실행·출력파일 생성**해야 PASS. 서술로만 있으면 미충족.

1. **경쟁 가설 동시 채점 (Competing generators)**
   - 주가설 단독 점수 금지. 최소 2개 이상의 대안 가설/영가설을 **같은 지표·같은 데이터**로 동시 채점.
   - 출력: 가설별 점수표 + 상대 비교. 주가설이 대안보다 유의하게 우월해야 의미.
2. **사전 등록된 반례 조건 (Pre-registered falsification)**
   - 측정 **전에** "이 값이 나오면 가설 기각" 임계·방향을 파일로 고정(타임스탬프/커밋). 측정 후 기준 변경 금지(p-hacking 차단).
3. **부정대조 + 셔플 + held-out (Negative control / shuffle / held-out)**
   - 라벨/순서 셔플한 데이터에서 효과가 **사라지는지** 확인(살아있으면 인공물).
   - 일부 데이터를 빼고(held-out) 동일 결과 재현되는지.
4. **다중비교 보정 (Multiple-comparison correction)**
   - 여러 검정 시 Bonferroni/FDR 등 보정 함수 존재 + 적용. 보정 전/후 수치 모두 출력.
5. **전 구간 추적성 (Provenance: data→code→output)**
   - 모든 수치는 원본 데이터 → 계산 코드 → 출력 파일로 추적. **서술로 생성된 숫자(narrative number) 금지.**
   - 출력 파일에 입력 해시 + 코드 커밋 + 난수 시드 기록.
6. **동어반복 금지 (Tautology/circularity ban)**
   - 합격조건이 정의상 항상 참이 되는 구조 금지(예: 가설로 만든 생성기를 그 가설로 채점). 독립 지표 사용.

## 2. 검증 명세서 템플릿 (Verification Spec) — 가설마다 1장 작성

```yaml
verification_spec_id: {id}
hypothesis: "{검증할 명제 — 반증가능 형태}"
competing_hypotheses:
  - null: "{영가설}"
  - alt1: "{경쟁 가설1}"
  - alt2: "{경쟁 가설2}"
metrics:
  - name: "{지표}"
    independent_of_hypothesis: true   # 동어반복 아님 입증
falsification:                         # 측정 전 고정
  - condition: "{이 값/방향이면 기각}"
    registered_at: "{commit/time}"
controls:
  negative_control: "{셔플/무작위 라벨 절차}"
  held_out: "{분할 비율·절차}"
multiple_comparison: "bonferroni | fdr | none(사유)"
provenance:
  raw_data: "{경로 + 해시}"
  code: "{스크립트 경로}"
  outputs: "{출력 파일 경로}"
  seed: {난수 시드}
acceptance:                            # CoolHan이 "구현·실행됐는지"만 강제
  - "경쟁 가설 동시 채점 코드 실행 + 점수표 출력"
  - "반례 조건 사전 등록 파일 존재"
  - "셔플/held-out 함수 실행 + 결과 출력"
  - "다중비교 보정 적용 + 보정 전후 출력"
  - "모든 수치 data→code→output 추적 (서술 숫자 0)"
interpretation_owner: "연구자 + 감사자"   # CoolHan 아님
```

## 3. CoolHan 하네스에서의 사용법

- **CoolHan = 배관(plumbing), 권위 아님.** 위 acceptance criteria를 스펙에 넣으면, validator/qa는 "그게 구현·실행·커밋됐는지"만 강제한다.
- validator/research orchestrator는 판정문을 반드시 **2층으로 분리** 출력:
  - `engineering_status`: PASS/FAIL (코드=스펙, 재현가능)
  - `scientific_interpretation`: "해석 보류 — 연구자/감사자 판단" (하네스가 참/거짓 단정 금지)
- 합격조건의 **과학적 타당성 자체**는 연구자+감사자 책임. 하네스는 그 타당성을 보증하지 않는다(문서에 명시).

## 4. 적용 대상
- coolhan-research-orchestrator (hypothesis-validator) — 본 표준을 1급 구동 문서로 사용.
- 개발 하네스 validator/e2e — 연구성 결과물에 대해 "engineering PASS ≠ scientific truth" 캡션 강제.
