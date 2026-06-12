# Human-Experience (HX) Standard — 사람 중심 완벽 기준

> **핵심 전제:** "소스가 잘 돌아간다 ≠ 사람이 쓰기에 완벽하다." 프로그램은 사람이 쓴다.
> 코드 첫 줄부터 이 기준을 1급 요구사항으로 반영한다. 사후 검증이 아니라 초기 설계·구현에 주입.
> 기존 `knowledge_base/00_DESIGN_PARAMETERIZATION_SYSTEM.md`(디자인 프로파일/색/타이포)와 연계.

## 적용 범위
- 정방향 개발 전 단계(intent→spec→dev→validate→e2e)에서 참조.
- UI가 있는 기능은 HX 필수. 순수 API/배치도 해당 항목(에러문구·보안·모듈화·무결성)은 적용.

## HX 체크리스트 (게이트 기준)

각 항목은 **증거**(파일:라인 / 스크린샷 / 측정값)로 충족 입증. 증거 없으면 미충족. 미충족이 1개라도 P0(아래 ★)면 **코드가 동작해도 FAIL**.

### 1. 입력·폼 (Form UX) ★
- 입력 항목: 꼭 필요한 항목만, 논리적 그룹핑.
- 순서·위치: 자연스러운 진행 순서(위→아래, 좌→우), 관련 항목 인접.
- 입력 방법: 타입에 맞는 컨트롤(날짜=date picker, 선택=select/radio, 다중=checkbox).
- 검증: 인라인 실시간 검증 + 제출 전 검증. 필수 표시(*) 명확.
- **에러 알림 + 해결방안 ★**: "이메일 형식이 올바르지 않습니다 → name@example.com 형식으로 입력" 처럼 문제+해결책을 함께. 에러는 해당 필드 옆.
- 자동완성/placeholder/라벨: 라벨은 항상 표시(placeholder만으로 라벨 대체 금지).

### 2. 접근성 (Accessibility, WCAG 2.1 AA) ★
- 시맨틱 마크업: `<button>`, `<label for>`, `<nav>`, `<main>`, heading 위계(h1→h2…).
- 키보드 전용 조작 가능, 포커스 표시(focus ring) 유지.
- 색 대비: 본문 4.5:1, 큰 글자 3:1 이상.
- 이미지 alt, 폼 라벨 연결, aria 속성(필요 시).
- 색만으로 정보 전달 금지(색+아이콘/텍스트 병행).

### 3. 반응형 (Responsive) ★
- 브레이크포인트: 모바일(~640) / 태블릿(~1024) / 데스크톱(1025~).
- 가로 스크롤 없음, 터치 타깃 ≥44px, 뷰포트 meta.
- 다양한 브라우저(Chrome/Firefox/Safari/Edge) 깨짐 없음.
- **검증 방식 (중요):** "PC 브라우저 창 줄이기"는 실제 모바일과 다르다(엔진 WebKit≠Blink, DPR·UA·터치·스크롤바 폭·iOS 100vh). 반드시 **디바이스 에뮬레이션**으로 확인 — `scripts/hx_render.py`가 WebKit(iOS)+Chromium(Android) 엔진 + 실 디바이스 프로필(UA/DPR/터치)로 렌더.
  - 한계 정직: 에뮬레이션도 100% 실기기는 아님. 고위험/상용 출시 전엔 실기기 또는 클라우드 디바이스팜(BrowserStack 등) 권장 — 이때는 `confidence: emulated`로 표기.

### 4. 가독성·타이포 (Readability)
- 폰트 크기: 본문 ≥16px, 위계(제목>부제>본문>캡션) 명확.
- 줄간격 1.4~1.6, 한 줄 길이 적정(45~75자), 위치·여백 일관.
- 색/배경 대비 충분, 강조는 굵기/색 일관 규칙.

### 5. 버튼·액션 (Affordance)
- 버튼 종류 구분: primary(주동작 1개)/secondary/destructive(위험=빨강+확인).
- 상태: hover/active/disabled/loading 시각 구분.
- 라벨은 동사+목적("저장", "주문 취소") — 모호한 "확인" 지양.

### 6. 상태·피드백 (States)
- 로딩 상태(스피너/스켈레톤), 빈 상태(empty: 안내+다음 행동), 에러 상태(해결안), 성공 피드백(토스트).
- 비가역 동작은 확인 단계.

### 7. 진행 순서·플로우 (Flow)
- 체계적 단계(다단계는 진행 표시기/stepper), 뒤로가기·이탈 보호.
- 사용자 여정이 목표까지 최소 클릭.

### 8. 보안 UX (Security)
- 민감정보 마스킹, 비밀번호 강도 안내, 자동 로그아웃 고지.
- 에러 메시지에 내부정보 노출 금지(스택/쿼리 숨김), 권한 없는 동작 차단 UX.
- (코드) 입력 검증/이스케이프(XSS/SQLi), HTTPS, CSRF.

### 9. 기능 모듈화 (Modularity) ★
- 컴포넌트/함수 단일 책임, 재사용 단위 분리, 디자인 토큰(색/폰트/간격) 변수화(하드코딩 금지).
- 화면-로직-데이터 계층 분리.

### 10. 소스 무결성 (Integrity)
- 죽은 코드/콘솔로그/TODO 잔존 없음, 일관된 네이밍/포맷, 타입 안정.
- 에러 핸들링 누락 없음(빈 catch 금지).

## 디자인 토큰 (parameterization 연계)
색/폰트/간격/반경/그림자는 토큰으로 정의 → `00_DESIGN_PARAMETERIZATION_SYSTEM.md`의 프로파일(Elegant/Fresh/Trustworthy/Vibrant) 스왑 가능하게. 하드코딩 색상값 금지.

## HX 판정 형식 (validator/e2e용)
```json
{
  "hx_check": {
    "form_ux": {"pass": true, "evidence": "..."},
    "accessibility": {"pass": false, "evidence": "대비 3.2:1 < 4.5", "fix": "..."},
    "responsive": {"pass": true, "evidence": "640/1024/1025 캡처"},
    "readability": {"pass": true},
    "buttons": {"pass": true},
    "states": {"pass": true},
    "flow": {"pass": true},
    "security_ux": {"pass": true},
    "modularity": {"pass": true},
    "integrity": {"pass": true}
  },
  "p0_items": ["form_ux","accessibility","responsive","modularity"],
  "verdict": "FAIL",
  "reason": "accessibility(P0) 미충족 — 코드 동작해도 FAIL"
}
```
> P0 항목(★) 미충족 = 전체 FAIL. 비P0 미충족 = 경고(다음 단위에서 보완).
