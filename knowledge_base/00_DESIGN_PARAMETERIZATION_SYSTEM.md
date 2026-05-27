# 디자인 매개변수화 시스템 (Design Parameterization System)

## 개요 (Overview)

데이터베이스와 API만 다양화하는 것으로는 부족하다. **CSS, 색상, 레이아웃, 타이포그래피도 프로젝트마다 다르게 적용되어야 한다.**

이 시스템은:
1. 온라인에서 사용되는 색상과 디자인 철학을 체계화
2. 개발 완료 후에도 CSS 세트만 교체하면 전체 UI가 달라지도록 모듈화
3. 개발자가 "모던", "차가움", "발랄함" 같은 추상적 개념을 선택하면 구체적인 색상/타이포그래피/레이아웃이 자동 결정

---

## 1. 디자인 특성 분류 (Design Characteristic Classification)

### 1.1 디자인 스타일 차원 (Design Style Dimensions)

온라인 디자인의 주요 특성을 다차원 공간으로 정의:

```
┌─────────────────────────────────────────────────────────────┐
│ 차원 1: 온도감 (Warmth)                                      │
│  ├─ 차가움 (Cool) ←───────────────┼───────────→ 따뜻함 (Warm)
│  └─ 특징: 파랑/보라 ←──────────────┼───────────→ 주황/빨강
│                                                              │
│ 차원 2: 에너지 (Energy Level)                                │
│  ├─ 차분함 (Calm) ←───────────────┼───────────→ 발랄함 (Vibrant)
│  └─ 특징: 회색톤 ←──────────────────┼───────────→ 포화된 색
│                                                              │
│ 차원 3: 현대성 (Modernity)                                   │
│  ├─ 클래식 (Classic) ←───────────────┼───────────→ 모던 (Modern)
│  └─ 특징: 의존형 ←──────────────────┼───────────→ 미니멀/기하
│                                                              │
│ 차원 4: 형식성 (Formality)                                   │
│  ├─ 캐주얼 (Casual) ←───────────────┼───────────→ 포멀 (Formal)
│  └─ 특징: 둥근모서리 ←──────────────┼───────────→ 각진모서리
│                                                              │
│ 차원 5: 복잡도 (Complexity)                                  │
│  ├─ 미니멀 (Minimal) ←───────────────┼───────────→ 리치 (Rich)
│  └─ 특징: 최소한의 요소 ←───────────┼───────────→ 많은 시각요소
└─────────────────────────────────────────────────────────────┘
```

### 1.2 디자인 프로필 정의 (Design Profile Definitions)

각 프로필은 5개 차원에서의 위치로 정의:

```
프로필명: "우아함 (Elegant)"
  온도감: 80 (따뜻함)
  에너지: 30 (차분함)
  현대성: 70 (모던)
  형식성: 80 (포멀)
  복잡도: 40 (미니멀 쪽)
  
특징: 고급스럽고 정제된 분위기, 금융/의료 분야에 적합

프로필명: "신선함 (Fresh)"
  온도감: 50 (중립)
  에너지: 75 (발랄함)
  현대성: 85 (최신 모던)
  형식성: 40 (캐주얼)
  복잡도: 60 (평균)
  
특징: 젊고 활발한 분위기, 소셜미디어/스타트업에 적합

프로필명: "신뢰감 (Trustworthy)"
  온도감: 40 (차가움)
  에너지: 40 (차분함)
  현대성: 60 (모던)
  형식성: 70 (포멀)
  복잡도: 30 (미니멀)
  
특징: 안정적이고 신뢰할 수 있는 분위기, 금융/기업에 적합
```

---

## 2. 색상 정의 시스템 (Color Definition System)

### 2.1 색상 팔레트 기본 라이브러리 (Base Color Palette Library)

#### A. 기본 색상군 (Primary Color Groups)

```yaml
색상군_1: "파란계열 (Blue Family)"
  특징: 신뢰, 안정, 전문성
  온라인_용도: 기업사이트, 금융, 의료
  팔레트:
    - "스카이블루": "#87CEEB"
    - "진한파랑": "#1E3A8A"
    - "네이비": "#0F172A"
    - "라이트블루": "#E0F2FE"
    - "인디고": "#4F46E5"

색상군_2: "초록계열 (Green Family)"
  특징: 성장, 자연, 신선함
  온라인_용도: 생태, 건강, 스타트업
  팔레트:
    - "라임그린": "#32CD32"
    - "포레스트그린": "#228B22"
    - "세이지그린": "#9DC183"
    - "민트그린": "#98FF98"
    - "에메랄드": "#50C878"

색상군_3: "주황계열 (Orange Family)"
  특징: 따뜻함, 에너지, 활동성
  온라인_용도: 음식, 엔터테인먼트, 이벤트
  팔레트:
    - "밝은주황": "#FF9500"
    - "진한주황": "#FF6B35"
    - "복숭아색": "#FFBC94"
    - "호박색": "#FF8C00"
    - "살구색": "#FBCF8E"

색상군_4: "자주계열 (Purple Family)"
  특징: 창의성, 럭셔리, 신비로움
  온라인_용도: 크리에이티브, 패션, 기술
  팔레트:
    - "라벤더": "#E6D7F0"
    - "아메시스트": "#9966CC"
    - "딥퍼플": "#663399"
    - "바이올렛": "#EE82EE"
    - "인디고": "#4B0082"

색상군_5: "빨강계열 (Red Family)"
  특징: 긴급, 열정, 주의
  온라인_용도: 에러상태, 할인, 경고
  팔레트:
    - "밝은빨강": "#FF4444"
    - "딥레드": "#8B0000"
    - "핑크": "#FF69B4"
    - "로즈": "#FF007F"
    - "산호색": "#FF7F50"

색상군_6: "회색계열 (Gray Family)"
  특징: 중립, 배경, 비강조
  온라인_용도: 배경, 텍스트, 보조색
  팔레트:
    - "라이트그레이": "#F3F4F6"
    - "미디엄그레이": "#9CA3AF"
    - "다크그레이": "#374151"
    - "차콜": "#1F2937"
    - "거의검정": "#111827"
```

#### B. 심리학 기반 색상 조합 (Psychology-Based Color Combinations)

```
조합_1: "신뢰 + 활동성"
  Primary: 진한파랑 (#1E3A8A)
  Secondary: 주황 (#FF9500)
  Accent: 화이트 (#FFFFFF)
  용도: 금융앱, 전자상거래
  심리효과: 안전하면서도 활동적

조합_2: "자연 + 현대성"
  Primary: 세이지그린 (#9DC183)
  Secondary: 딥차콜 (#1F2937)
  Accent: 밝은주황 (#FF9500)
  용도: 에코/라이프스타일
  심리효과: 환경친화적이면서도 트렌디

조합_3: "럭셔리 + 고급스러움"
  Primary: 딥퍼플 (#663399)
  Secondary: 골드 (#FFD700)
  Accent: 오프화이트 (#F5F5F0)
  용도: 패션, 뷰티, 프리미엄 서비스
  심리효과: 고급스럽고 배타적
```

### 2.2 색상 패리티 (Color Parity) - 접근성

```
모든 색상 조합은 다음을 충족해야 함:
✓ WCAG AA 표준: 명도 대비 4.5:1 이상 (텍스트)
✓ WCAG AAA 표준: 명도 대비 7:1 이상 (중요 텍스트)
✓ 색맹 친화: 색상만으로 정보 전달 금지

예:
  - 에러 표시: 빨강 (색상) + "✕" 기호 (모양)
  - 성공 표시: 초록 (색상) + "✓" 기호 (모양)
```

---

## 3. 타이포그래피 시스템 (Typography System)

### 3.1 폰트 선택 매개변수 (Font Selection Parameters)

```yaml
폰트_선택:
  
  # 본문 폰트 선택
  body_font:
    - "Serif (전통적)": "'Georgia', serif"
    - "Sans-Serif (현대적)": "'Segoe UI', sans-serif"
    - "Monospace (기술적)": "'Courier New', monospace"
  
  # 제목 폰트 선택
  heading_font:
    - "Bold Sans": "'Montserrat', sans-serif"
    - "Light Modern": "'Poppins', sans-serif"
    - "Display": "'Playfair Display', serif"
  
  # 글자 크기 스케일
  font_scale:
    - "aggressive": "1.618 (골든레이션)"
    - "moderate": "1.5 (완벽한 5분의 4)"
    - "conservative": "1.25 (완벽한 4분의 5)"
    
  # 자간 (Letter Spacing)
  letter_spacing:
    - "tight": "-0.5px"
    - "normal": "0px"
    - "loose": "1px"
    
  # 행간 (Line Height)
  line_height:
    - "compact": "1.3"
    - "normal": "1.6"
    - "spacious": "1.9"

예시_조합_1:
  디자인_프로필: "우아함 (Elegant)"
  body_font: "'Georgia', serif"
  heading_font: "'Playfair Display', serif"
  font_scale: 1.618
  letter_spacing: "1px"
  line_height: 1.6
  결과: 고급스럽고 정제된 타이포그래피

예시_조합_2:
  디자인_프로필: "신선함 (Fresh)"
  body_font: "'Segoe UI', sans-serif"
  heading_font: "'Poppins', sans-serif"
  font_scale: 1.5
  letter_spacing: "0px"
  line_height: 1.6
  결과: 현대적이고 생동감있는 타이포그래피
```

---

## 4. 레이아웃 및 공간 시스템 (Layout & Spacing System)

### 4.1 그리드 및 간격 매개변수 (Grid & Spacing Parameters)

```yaml
공간_시스템:
  
  # 기본 간격 단위 (Base Spacing Unit)
  base_unit:
    - "4px": "세밀한 조정"
    - "8px": "표준"
    - "16px": "넉넉한"
  
  # 컨테이너 최대 너비
  container_width:
    - "960px": "고전적"
    - "1200px": "현대 표준"
    - "1440px": "와이드"
  
  # 모서리 둥글기 (Border Radius)
  border_radius:
    - "0px": "각진 (포멀)"
    - "4px": "약간 둥근"
    - "8px": "중간 둥근"
    - "16px": "많이 둥근 (캐주얼)"
  
  # 그림자 (Shadow)
  shadow_style:
    - "flat": "그림자 없음 (플랫 디자인)"
    - "subtle": "약한 그림자 (모던)"
    - "prominent": "강한 그림자 (입체감)"

예시_조합_1:
  디자인_프로필: "모던 미니멀"
  base_unit: "8px"
  container_width: "1200px"
  border_radius: "0px"
  shadow_style: "flat"
  결과: 깨끗하고 미니멀한 레이아웃

예시_조합_2:
  디자인_프로필: "따뜻한 캐주얼"
  base_unit: "16px"
  container_width: "960px"
  border_radius: "16px"
  shadow_style: "subtle"
  결과: 여유있고 친근한 레이아웃
```

### 4.2 반응형 디자인 변수 (Responsive Design Parameters)

```yaml
반응형_정의:
  
  breakpoints:
    - "모바일": "< 640px (기본)"
    - "태블릿": "640px ~ 1024px"
    - "데스크톱": "≥ 1024px"
  
  # 모바일 우선 또는 데스크톱 우선
  design_approach:
    - "mobile_first": "작은 화면부터 시작"
    - "desktop_first": "큰 화면부터 시작"
  
  # 레이아웃 변화
  layout_changes:
    - "dramatic": "큰 화면에서 완전히 다른 레이아웃"
    - "gradual": "비율 조정만 함"
```

---

## 5. CSS 모듈화 구조 (Modularized CSS Structure)

### 5.1 CSS 세트로 전체 UI 교체 가능한 구조

```
/css/
  ├─ config/
  │  ├─ colors.css          # 색상 정의 (변수로만)
  │  ├─ typography.css      # 폰트, 크기, 자간
  │  ├─ spacing.css         # 간격, 그리드
  │  └─ effects.css         # 그림자, 애니메이션
  │
  ├─ components/
  │  ├─ button.css          # 버튼 (색상 변수 참조)
  │  ├─ card.css            # 카드 (간격 변수 참조)
  │  ├─ form.css            # 폼 요소
  │  ├─ nav.css             # 네비게이션
  │  └─ modal.css           # 모달
  │
  ├─ layouts/
  │  ├─ grid.css            # 그리드 시스템
  │  ├─ flexbox.css         # 플렉스박스 레이아웃
  │  └─ responsive.css      # 반응형 정의
  │
  ├─ profiles/
  │  ├─ elegant.css         # 우아함 프로필
  │  ├─ fresh.css           # 신선함 프로필
  │  ├─ trustworthy.css     # 신뢰감 프로필
  │  └─ vibrant.css         # 발랄함 프로필
  │
  └─ main.css               # 통합
```

### 5.2 CSS 변수 기반 구현 (CSS Variables Implementation)

```css
/* /css/config/colors.css - 신뢰감 프로필 */

:root {
  /* 프로필: 신뢰감 */
  --primary-color: #1E3A8A;      /* 진한파랑 */
  --secondary-color: #9CA3AF;    /* 회색 */
  --accent-color: #FF9500;       /* 주황 */
  
  --success-color: #22C55E;
  --warning-color: #EAB308;
  --error-color: #EF4444;
  
  --bg-light: #F3F4F6;
  --bg-main: #FFFFFF;
  --text-primary: #1F2937;
  --text-secondary: #6B7280;
  
  /* 명도 대비 검증: 
     텍스트 vs 배경 = 1F2937 vs F3F4F6
     명도 대비: 12:1 ✓ (WCAG AAA 충족)
  */
}

/* /css/config/typography.css - 우아함 타이포그래피 */

:root {
  --font-body: 'Georgia', serif;
  --font-heading: 'Playfair Display', serif;
  
  --font-scale: 1.618;
  --font-base: 16px;
  
  --font-h1: calc(var(--font-base) * var(--font-scale) * var(--font-scale) * var(--font-scale));
  --font-h2: calc(var(--font-base) * var(--font-scale) * var(--font-scale));
  --font-h3: calc(var(--font-base) * var(--font-scale));
  
  --line-height: 1.6;
  --letter-spacing: 1px;
}

/* /css/config/spacing.css */

:root {
  --base-unit: 8px;
  --space-xs: calc(var(--base-unit) * 1);   /* 8px */
  --space-sm: calc(var(--base-unit) * 2);   /* 16px */
  --space-md: calc(var(--base-unit) * 4);   /* 32px */
  --space-lg: calc(var(--base-unit) * 8);   /* 64px */
  
  --border-radius: 4px;
  --shadow: 0 1px 3px rgba(0,0,0,0.1);
}

/* /css/components/button.css */

.btn {
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--border-radius);
  font-family: var(--font-body);
  font-size: 16px;
}

.btn-primary {
  background-color: var(--primary-color);
  color: white;
  border: none;
}

.btn-primary:hover {
  background-color: #163066;  /* 짙은 파랑 */
}
```

### 5.3 프로필 전환 (Profile Switching)

```html
<!-- 사용자가 프로필을 선택하면 CSS 세트가 교체됨 -->

<!-- 기본: 신뢰감 프로필 -->
<link rel="stylesheet" href="/css/main.css">

<!-- JavaScript로 동적 교체 -->
<script>
function switchDesignProfile(profileName) {
  // /css/profiles/[profileName].css 로드
  // 모든 :root 변수 교체
  // 즉시 전체 UI 업데이트
}
</script>
```

---

## 6. 디자인 매개변수 선택 프로세스 (Design Parameter Selection Process)

### 6.1 사용자 선택 흐름 (User Selection Flow)

```
단계 1: 솔루션 타입 선택
  └─ 예: "E-Commerce Mall"

단계 2: 기본 디자인 프로필 선택 (선택지 제공)
  ├─ "신뢰감 (Trustworthy)" ← 금융, 기업에 추천
  ├─ "우아함 (Elegant)" ← 럭셔리, 프리미엄에 추천
  ├─ "신선함 (Fresh)" ← 스타트업, 소셜에 추천
  └─ "발랄함 (Vibrant)" ← 음식, 엔터테인먼트에 추천

단계 3: 프로필 커스터마이징 (선택사항)
  ├─ 주색상 변경: 파랑 → 초록 선택
  ├─ 온도감 조정: 차가움 → 따뜻함
  ├─ 폰트 선택: Georgia → Poppins
  └─ 간격 조정: 8px → 16px

단계 4: 색상 팔레트 검증
  ├─ 명도 대비 자동 검사 (WCAG)
  ├─ 색맹 친화 검증
  └─ 디바이스 간 일관성 확인

단계 5: CSS 생성
  └─ /css/profiles/[projectName].css 자동 생성
```

### 6.2 프로필별 추천 사항 (Profile Recommendations by Industry)

```yaml
소매_쇼핑:
  추천_프로필: "신선함 (Fresh)"
  이유: "현대적이고 활기찬 분위기 필요"
  색상: 초록/주황 조합
  타이포: Sans-serif, Poppins

금융_서비스:
  추천_프로필: "신뢰감 (Trustworthy)"
  이유: "안정감과 전문성 강조"
  색상: 파랑/회색 조합
  타이포: Serif + sans-serif 조합

뷰티_패션:
  추천_프로필: "우아함 (Elegant)"
  이유: "고급스럽고 정제된 분위기"
  색상: 자주/금색 조합
  타이포: Serif, Playfair Display

음식_엔터테인먼트:
  추천_프로필: "발랄함 (Vibrant)"
  이유: "즐겁고 활동적인 느낌"
  색상: 주황/분홍 조합
  타이포: Sans-serif, Poppins
```

---

## 7. 디자인 시스템 문서 (Design System Documentation)

### 7.1 자동 생성 디자인 가이드 (Auto-Generated Design Guide)

```
/docs/DESIGN_GUIDE.md 자동 생성 내용:

# 디자인 시스템 가이드 - [프로젝트명]

## 선택된 프로필
- 이름: "신뢰감"
- 온도감: 40 (차가움)
- 에너지: 40 (차분함)
- 현대성: 60 (모던)
- 형식성: 70 (포멀)
- 복잡도: 30 (미니멀)

## 색상 팔레트
- Primary: #1E3A8A (진한파랑)
- Secondary: #9CA3AF (회색)
- Accent: #FF9500 (주황)
- Success: #22C55E
- Error: #EF4444

## 명도 대비 검증 ✓
- 텍스트 vs 배경: 12:1 (WCAG AAA)
- 색맹 친화: ✓

## 타이포그래피
- 본문: Georgia, serif
- 제목: Playfair Display, serif
- 글자크기 스케일: 1.618
- 행간: 1.6

## 간격 시스템
- 기본 단위: 8px
- xs: 8px, sm: 16px, md: 32px, lg: 64px

## 모서리 둥글기
- 버튼: 4px
- 카드: 4px
- 모달: 8px

## CSS 파일 위치
- /css/profiles/[projectName].css
```

---

## 8. 프로필 추가 및 확장 (Adding New Profiles)

### 8.1 새로운 프로필 생성 템플릿 (New Profile Template)

```yaml
새_프로필_추가:
  
  이름: "[새 프로필명]"
  설명: "[어떤 산업/용도에 적합한가]"
  
  차원:
    온도감: [0-100, 50=중립]
    에너지: [0-100, 50=중립]
    현대성: [0-100, 50=클래식-모던 균형]
    형식성: [0-100, 50=캐주얼-포멀 균형]
    복잡도: [0-100, 50=미니멀-리치 균형]
  
  색상_팔레트:
    primary: "[색상명] (#RRGGBB)"
    secondary: "[색상명] (#RRGGBB)"
    accent: "[색상명] (#RRGGBB)"
  
  타이포그래피:
    body_font: "[폰트명], [serif|sans-serif|monospace]"
    heading_font: "[폰트명], [serif|sans-serif]"
    font_scale: [1.25|1.5|1.618]
    line_height: "[1.3|1.6|1.9]"
  
  레이아웃:
    base_unit: "[4px|8px|16px]"
    border_radius: "[0px|4px|8px|16px]"
    shadow_style: "[flat|subtle|prominent]"
  
  업계_추천:
    - "[업계1]"
    - "[업계2]"
```

---

## 9. CSS 모듈화의 이점 (Benefits of Modularized CSS)

```
이점 1: 빠른 테마 변경
  개발 완료 후, CSS 파일만 교체하면 전체 UI 변경
  
이점 2: A/B 테스트
  다른 프로필을 병행 테스트하여 사용자 반응 측정
  
이점 3: 일관성
  모든 컴포넌트가 동일한 변수 사용으로 일관된 디자인 유지
  
이점 4: 유지보수
  색상 변경 = 1개 파일 수정 (수십 개 파일이 아님)
  
이점 5: 확장성
  새로운 컴포넌트 추가 시, 기존 변수만 참조하면 됨
  
이점 6: 접근성
  한 곳에서 색상 대비 검증, 모든 조합에 자동 적용
```

---

## 결론 (Conclusion)

이 시스템은:
1. **개발자가 색상, 폰트, 간격을 선택**하도록 함 (보안 + 개인화)
2. **CSS를 모듈화**하여 개발 완료 후에도 **전체 테마 교체 가능**
3. **추상적 개념** (우아함, 신선함)을 **구체적 변수**로 변환
4. **자동 접근성 검증**으로 모든 색상 조합이 WCAG 준수
5. **산업별 추천**으로 초기 선택을 단순화

---

**버전**: 1.0
**작성일**: 2026-05-27
**상태**: 초안 - 팀 피드백 대기
