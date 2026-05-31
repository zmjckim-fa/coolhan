# Voynich Reference Analyzer

**목표:** 보이니치 필사본이 번역 대상이 아니라, GenBank/NCBI 스타일의 분류·정의·참조 시스템일 가능성을 검증하는 데이터 분석 도구

**상태:** v0.1 개발 중 (2026-05-31)

---

## 🎯 이 도구는 무엇인가?

**해독 도구가 아니라 연구 도구입니다.**

보이니치 원고를 번역하거나 해독하려고 하지 않습니다. 대신, 다음 질문에 대답합니다:

- 보이니치의 텍스트 구조가 일반 산문보다 분류/참조 시스템에 가까운가?
- 단어의 끝 문자 제약이 우연일까, 아니면 의도된 규칙일까?
- 섹션별로 서로 다른 "어휘"를 사용하는가?
- 이 패턴이 실제 데이터베이스나 분류표와 유사한가?

**핵심 원칙:**
```
✓ 통계적 증거 기반
✓ 비교 코퍼스 포함
✓ 모든 규칙은 "candidate" 수준
✓ 결론은 "증명했다"가 아니라 "가능성이 있다"
✓ 코드와 데이터는 재현 가능
✗ 번역 주장 금지
✗ 의미 단정 금지
✗ 해독 성공 주장 금지
```

---

## 📊 주요 기능

### 1. Folio Explorer
- folio 번호 선택 → 이미지 표시 + EVA 전사 + 고빈도 단어
- 섹션별 필터링
- 색상/메타데이터 표시

### 2. EVA Parser & Database
- EVA 전사 파일 자동 파싱
- folio → line → token → glyph 계층 구조
- SQLite 저장 (역추적 가능)

### 3. Token Analysis
- 빈도 분석
- 문자 분포
- n-gram 계산
- Token family clustering

### 4. Entropy Analysis
- 1-gram, 2-gram, conditional entropy
- 자연어/암호문/무작위와 비교

### 5. Section Comparison
- 섹션별 어휘 차이
- TTR, 고빈도 단어
- 통계적 유의성 검정

### 6. Comparison Corpus Module
- English / Catalog / Herbal / Cipher / Random text 분석
- 같은 지표로 계산
- 어느 코퍼스와 가장 유사한지 판정

### 7. Report Generator
- 자동 가설 검증 보고서
- Markdown + CSV 출력
- 최종 결론 (supported/contradicted/inconclusive)

---

## 🚀 빠른 시작

### 1. 설치

```bash
# 프로젝트 클론
git clone https://github.com/zmjckim-fa/coolhan
cd coolhan/tools/voynich-reference-analyzer

# 환경 설정
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. 데이터 준비

```bash
# 1. EVA 전사 파일 다운로드
# 출처: https://www.voynich.nu/
# 파일: IT2a-n.txt (Landini-Stolfi v2a)
# → data/raw/IT2a-n.txt 저장

# 2. 이미지 메타데이터 준비
# Yale Beinecke: https://brbl-dl.library.yale.edu/vufind/Record/3663539
# → data/raw/yale_image_urls.csv
```

### 3. 분석 실행

```bash
# Step 1: 데이터베이스 초기화
python scripts/01_parse_eva.py

# Step 2: 토큰 분석
python scripts/02_analyze_tokens.py

# Step 3: 엔트로피 분석
python scripts/03_analyze_entropy.py

# Step 4: 섹션 비교
python scripts/04_analyze_sections.py

# Step 5: 규칙 감지
python scripts/05_detect_rules.py

# Step 6: 비교 코퍼스 분석
python scripts/06_compare_corpus.py

# Step 7: 최종 리포트
python scripts/07_generate_report.py
```

### 4. 대시보드 실행

```bash
streamlit run app.py
```

브라우저에서 `http://localhost:8501` 열기

---

## 📁 프로젝트 구조

```
voynich-reference-analyzer/
├── README.md (이 파일)
├── requirements.txt
├── app.py (Streamlit 대시보드)
│
├── database/
│   └── voynich.sqlite (SQLite 데이터베이스)
│
├── data/
│   ├── raw/
│   │   ├── IT2a-n.txt (EVA 전사)
│   │   ├── yale_image_urls.csv
│   │   └── comparison_corpora/
│   │       ├── english.txt
│   │       ├── catalog.txt
│   │       └── ...
│   │
│   ├── processed/
│   │   ├── image_folio_mapping.csv
│   │   ├── rule_candidates_master.csv
│   │   ├── token_frequency.csv
│   │   ├── section_metrics.csv
│   │   └── entropy_report.csv
│   │
│   └── comparison_corpora/
│       ├── corpus_a_english.csv
│       ├── corpus_b_herbal.csv
│       └── ...
│
├── scripts/
│   ├── 01_parse_eva.py
│   ├── 02_analyze_tokens.py
│   ├── 03_analyze_entropy.py
│   ├── 04_analyze_sections.py
│   ├── 05_detect_rules.py
│   ├── 06_compare_corpus.py
│   └── 07_generate_report.py
│
├── modules/
│   ├── __init__.py
│   ├── db.py (데이터베이스 관리)
│   ├── eva_parser.py (EVA 파싱)
│   ├── metrics.py (통계 계산)
│   ├── rule_engine.py (규칙 감지)
│   ├── corpus_compare.py (코퍼스 비교)
│   └── report_writer.py (리포트 생성)
│
├── reports/
│   ├── final_hypothesis_report.md
│   ├── rule_atlas.csv
│   └── validation_summary.md
│
└── docs/
    ├── METHODOLOGY.md (방법론)
    ├── DATA_DICTIONARY.md (데이터 정의)
    ├── HYPOTHESIS.md (가설 명세)
    └── VALIDATION_PLAN.md (검증 계획)
```

---

## 📋 데이터 소스

### 주 데이터
- **EVA Transcription:** IT2a-n.txt (Landini-Stolfi v2a)
- **Manuscript:** Yale Beinecke MS 408
- **Coverage:** f1r-f112v (112 folios, 224 pages)
- **Tokens:** ~7,063
- **Characters:** ~50,000

### 비교 코퍼스
| 코퍼스 | 크기 | 특징 |
|------|------|------|
| English | 50k chars | 자연 언어 기준 |
| Catalog | 5k entries | 분류 시스템 |
| Herbal | 10k tokens | 주제별 기준 |
| Cipher | 50k chars | 암호문 |
| Random | 50k chars | 무작위 |

---

## 🧪 주요 분석

### Analysis 1: Word-Final Character Constraint
```
Voynich:    96.3% end with {y,r,l,n,s,o,m,k}
English:    75%
Catalog:    89%
→ Constraint 강함 (규칙 기반)
```

### Analysis 2: Section-Specific Vocabulary
```
Botanical:     daiin (8.2%)
Herbal:        daiin (1.2%)
Astronomical:  qoty (3.2%)
→ 섹션별 어휘 다름 (χ² p<0.001)
```

### Analysis 3: Token Family Clustering
```
Cluster:  {qokeedy, qokedy, qokeey, qokain}
Pattern:  q* → ke* → *(y/ain)
→ 계층적 명명법
```

### Analysis 4: Entropy
```
Voynich 2-gram:    6.14 bits
English 2-gram:    10.5 bits
Catalog 2-gram:    7.8 bits
→ Voynich는 구조화됨 (natural language보다 더)
```

---

## ✅ 검증 상태

| 항목 | 상태 | 신뢰도 |
|------|------|--------|
| Word-final constraint | ✓ 강함 | ⭐⭐⭐⭐⭐ |
| Section divergence | ✓ 유의 | ⭐⭐⭐⭐ |
| Token families | ✓ 있음 | ⭐⭐⭐ |
| Catalog comparison | ~ 부분 | ⭐⭐ |
| Specific function | ? 미확정 | ⭐ |

**종합 평가:** CANDIDATE HYPOTHESIS (중간 수준 지지)

---

## ⚠️ 중요 한계

1. **EVA Transcription Only**
   - 원본 필사본 직접 확인 불가
   - 필경자 편향 가능

2. **Line Parsing Ambiguity**
   - "물리적 줄" vs "EVA 점 분절" 구분 필요
   - 평균 길이 1.0이 파싱 결과일 수 있음

3. **Multiple Hypothesis Compatibility**
   - 같은 패턴이 여러 가설을 지지 가능
   - 암호문 또는 인공 언어도 설명 가능

4. **Small Comparison Corpora**
   - Catalog: 5k entries만
   - Normalization 필요

5. **No Access to Original**
   - 색상/잉크 분석 불가
   - 손상 정도 불명확

---

## 🔄 다음 단계

### v0.2 (6월)
- [ ] EVA segmentation 재검증
- [ ] Image-folio mapping 확정
- [ ] 더 큰 비교 코퍼스 추가
- [ ] Currier A/B 제어 분석

### v0.3 (6월-7월)
- [ ] 색상 분석 통합
- [ ] 필경자(scribe hand) 비교
- [ ] 도메인 전문가 검토 (고고학, 식물학)

### v1.0 (7월)
- [ ] 최종 검증 리포트
- [ ] GitHub 공개 공개
- [ ] 학술지 투고 준비

---

## 🙅 절대 금지

```
❌ "해독했다" / "번역했다"
❌ "이 단어는 X를 의미한다"
❌ "증명했다" / "확정했다"
❌ "명백하다" / "분명하다"
❌ "모두가 알다시피"

✅ "일관성이 있다"
✅ "시사한다"
✅ "가능성이 있다"
✅ "통계적으로 유의하다"
✅ "추가 검증 필요하다"
```

---

## 📖 참고 문헌

- **Landini-Stolfi:** https://www.voynich.nu/
- **Zandbergen:** https://www.voynich.nu/
- **EVA Standard:** http://www.voynich.nu/eva.html
- **Yale Collection:** https://brbl-dl.library.yale.edu/vufind/Record/3663539

---

## 📝 라이선스

MIT License (코드)  
CC0 (데이터 - 공공 도메인)  
Academic attribution required (논문 인용)

---

## 👥 기여

이 프로젝트는 다음을 환영합니다:
- 버그 리포트
- 더 큰 비교 코퍼스
- 도메인 전문가 검토
- 방법론 개선 제안
- 재현 시도

---

## 📞 문의

- **GitHub Issues:** 버그, 기능 요청
- **Discussions:** 방법론 논의, 가설 검증
- **Email:** (연락처 추가 예정)

---

**마지막 업데이트:** 2026-05-31  
**상태:** v0.1 개발 진행 중  
**다음 마일스톤:** 2026-06-15 (v0.2)

