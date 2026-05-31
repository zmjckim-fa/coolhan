# Voynich Reference Analyzer v0.2

**연구용 분석 프로그램** (Research Analysis Tool)  
**해독 프로그램이 아닙니다** (NOT a decipherment tool)

---

## 🎯 프로그램의 목적

```
보이니치 원고가 무엇인지를 검증하는 프로그램
```

한 문장으로:

**Voynich Reference Analyzer**는 보이니치 원고의 이미지, folio, EVA 전사, token, glyph, 규칙 후보, 비교 코퍼스를 하나의 데이터베이스로 연결하여, 원고가 **자연어·암호문·참조형/분류형 문서** 중 어느 구조에 가장 가까운지 **통계적으로 검증**하는 연구용 분석 프로그램입니다.

---

## ✅ 하는 것 (Does)

- ✅ **구조 분석** — 보이니치가 어떤 문서 구조를 가지고 있는가?
- ✅ **규칙 후보 추출** — 반복되는 언어적 패턴은 무엇인가?
- ✅ **가설 검증** — 자연어/암호문/참조형 중 어느 것에 가까운가?
- ✅ **비교 코퍼스 대조** — 다른 텍스트와의 구조적 유사성은?
- ✅ **통계적 근거 제시** — 증거 수, 신뢰도, 반례 추적

---

## ❌ 하지 않는 것 (Does NOT)

- ❌ **번역** — "이 단어는 이 뜻이다"
- ❌ **해독 주장** — "나는 보이니치를 해독했다"
- ❌ **의미 단정** — "이것은 약초서이다" (진단 아님)

---

## 📊 프로그램의 10가지 핵심 기능

### 기능 1️⃣ Folio Explorer
folio를 선택하면 한 화면에서 확인:
- folio ID, Yale 이미지, 이미지 파일 번호
- 섹션, Currier A/B, 필경자 hand
- EVA 전사, 고빈도 단어, 고빈도 문자
- 규칙 후보, 색상 분석

**예:**
```
f1r
이미지: 2002046_1.jpg
섹션: Botanical
총 token: 227
상위 token: chol, y, daiin, dain
word-final y/r/l/n: 96.3%
ch 빈도: 8.2%
```

### 기능 2️⃣ Image-Folio Mapping
Yale Beinecke 이미지와 folio 번호를 매핑:
```
image_file → folio_id
2002046_1.jpg → f1r
2002046_2.jpg → f1v
2002046_3.jpg → f2r
```

관리할 메타데이터:
- image_file, image_index, folio_id, section, confidence, notes

### 기능 3️⃣ EVA Parser
EVA 전사를 정확하게 파싱:

**입력:**
```
<f1r.P1.1;H> fachys.ykal.ar.ataiin.shol.shory.cth!res.y.kor.sholdy
```

**출력:**
```
folio_id: f1r
paragraph: P1
physical_line: 1
transcriber: H
tokens: [fachys, ykal, ar, ataiin, shol, shory, cth, res, y, kor, sholdy]
glyphs: [f, a, c, h, y, s, y, k, a, l, ...]
```

**중요:** 두 가지 line 구분
- physical_line = 원본 전사 한 줄
- EVA token = 점(.)으로 나뉜 단어 단위

### 기능 4️⃣ Token/Character Statistics
자동 계산:
- 전체 token 수, 고유 token 수
- Folio별 token 수, 섹션별 token 수
- 상위 token, hapax (1회 등장) token
- Token 길이 분포
- 문자 빈도 (1-gram, 2-gram, 3-gram, 4-gram)
- TTR, corrected TTR, hapax ratio

### 기능 5️⃣ Rule Candidate Generation
자동으로 규칙 후보 생성:

**예:**
```
RULE-001: q 다음에는 o가 온다
RULE-002: 단어는 y/r/l/n으로 끝나는 경향
RULE-003: ch 빈도가 Botanical에서 높다
RULE-004: daiin은 특정 위치/섹션에 집중
RULE-005: token family가 존재한다
RULE-006: section별 vocabulary 다름
```

각 규칙의 메타데이터:
- 증거 수, 예외 수, 적용 folio
- 적용 섹션, 신뢰도, 반례, 검증 상태

**검증 상태:**
```
candidate          → 아직 검증 안 됨
validated          → 확인됨
partially_validated → 부분 확인
rejected           → 거짓
needs_review       → 재검토 필요
```

### 기능 6️⃣ Entropy Analysis
보이니치 텍스트의 규칙성을 숫자로 계산:
- 1-gram entropy
- 2-gram entropy
- conditional entropy
- redundancy
- randomness score

비교:
```
Voynich      | 자연어 | Random | 암호문 | 카탈로그
2-gram H: 6.14 | 10.5  | 8.5    | 7.2   | 7.8
```

이는 "규칙이 있다"를 수치로 입증합니다.

### 기능 7️⃣ Section Comparison
섹션별 차이 분석:
```
섹션:
- Botanical
- Herbal
- Astronomical
- Biological
- Cosmological
- Pharmaceutical
```

각 섹션마다:
- Token 수, 고유 token 수, corrected TTR, hapax ratio
- ch 빈도, daiin 빈도, word-final 비율
- Entropy, top-token concentration

### 기능 8️⃣ Currier A/B & Scribe Hand Control
섹션 차이가 진짜 섹션 때문인지 확인:
```
Botanical이라서 다른가?
Currier A라서 다른가?
필경자가 달라서 다른가?
```

통제하지 않으면 결론이 약합니다.

### 기능 9️⃣ Comparison Corpus Analysis (가장 중요)
보이니치만 분석하면: "특이하다" (약함)  
비교 코퍼스와 함께: "카탈로그형과 더 유사하다" (강함)

**비교군 (6개):**
```
A. 자연어 산문
B. 약초서 설명문
C. 식물명 목록
D. 분류표/카탈로그
E. 인공 생성문
F. 암호문/코드북형
```

**동일 지표:**
- corrected TTR, hapax ratio
- word-final concentration, n-gram entropy
- conditional entropy, top-10 concentration
- section divergence, token family density
- position bias

**결과:**
```
Voynichese가 어느 코퍼스와 가장 가까운가?
```

### 기능 🔟 Automatic Report Generation
Markdown + PDF 보고서 자동 생성:

```
1. 분석 범위
2. 사용 데이터
3. folio-image 매핑 상태
4. 전사 파싱 방식
5. 문자 통계
6. 단어 통계
7. 위치 규칙
8. 섹션 비교
9. 엔트로피 분석
10. 비교 코퍼스 결과
11. 규칙 후보표
12. 반례
13. 한계
14. 다음 검증
```

**중요 문구:**
```
This program does NOT claim decipherment or translation.
본 프로그램은 보이니치 원고의 해독이나 번역을 주장하지 않는다.
```

---

## 🖥️ Streamlit Dashboard 메뉴

```
1. Dashboard              (전체 요약)
2. Folio Explorer        (folio 선택해서 보기)
3. Image-Folio Mapping   (이미지-folio 매핑)
4. EVA Parser            (전사 파싱)
5. Token Analysis        (단어 통계)
6. Character Analysis    (문자/n-gram)
7. Position Rules        (위치 규칙)
8. Section Comparison    (섹션 비교)
9. Entropy Analysis      (엔트로피)
10. Rule Candidate Atlas (규칙 후보)
11. Comparison Corpus    (비교 코퍼스)
12. Report Generator     (보고서 생성)
```

---

## 📁 최종 산출물

프로그램이 생성하는 파일:

```
voynich.sqlite                 (데이터베이스)
image_folio_mapping.csv        (이미지-folio 매핑표)
rule_candidates_master.csv     (규칙 후보 마스터)
folio_metrics.csv              (folio별 지표)
section_metrics.csv            (섹션별 지표)
entropy_results.csv            (엔트로피 분석)
comparison_results.csv         (비교 코퍼스 결과)
final_hypothesis_report.md     (최종 보고서)
Streamlit dashboard            (인터랙티브 대시보드)
```

**핵심:** 단순 보고서가 아니라
- 데이터베이스
- 분석 엔진
- 검증표
- 대시보드
- 보고서

를 제공합니다.

---

## 🔧 기술 스택

```
Python 3.9+          (분석)
SQLite 3             (데이터)
Streamlit 1.20+      (대시보드)
Pandas, NumPy        (통계)
SciPy, Statsmodels   (통계 검정)
Matplotlib, Plotly   (시각화)
```

---

## 📚 개발 순서

```
1단계: 핵심 엔진
   - EVA parser
   - SQLite schema
   - folio/token/glyph 저장
   - 기본 통계 계산

2단계: 매핑
   - image_folio_mapping.csv
   - Yale 이미지 표시

3단계: 규칙 엔진
   - rule candidate 생성
   - 반례 추출
   - validation_status 관리

4단계: 대시보드
   - Streamlit Folio Explorer
   - Rule Atlas
   - Section Analysis

5단계: 비교 코퍼스
   - 6개 코퍼스 통합
   - 다변량 유사도 계산

6단계: 보고서 자동 생성
   - final_hypothesis_report.md
```

---

## ⚠️ 중요 공지

```
✋ This is NOT a decipherment tool.
✋ 본 프로그램은 해독 프로그램이 아닙니다.

We do NOT:
- Translate Voynichese
- Claim to have decoded the manuscript
- Assign fixed meanings to words
- Make definitive claims about authorship

We DO:
- Analyze document structure
- Extract candidate rules with evidence
- Compare structural patterns with reference corpora
- Provide statistical validation
- Produce reproducible analysis
```

---

## 📖 예제 활용

**이 프로그램은 Voynich Manuscript를 예제로 사용하지만,**
**다른 미해독 문헌(고대 문자, 암호 원고 등)에도 적용 가능한 일반적인 구조입니다.**

---

**Version:** v0.2  
**Status:** Development  
**License:** MIT  
**GitHub:** [coolhan/tools/voynich-reference-analyzer](https://github.com/)

```

This program is a RESEARCH ANALYSIS TOOL, not a decipherment tool.
```
