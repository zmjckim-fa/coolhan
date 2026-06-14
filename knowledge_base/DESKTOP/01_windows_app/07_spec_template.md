# Windows 데스크탑 앱 규격 템플릿 (Specification Template)

## 프로젝트 기본 정보

```yaml
project_name: "{앱 이름}"
app_id: "{com.company.appname}"         # Windows App SDK Package Identity
version: "1.0.0"
min_windows: "10.0.17763"              # Windows 10 1809 (build 17763) 최소 요구
target_windows: "10.0.26100"           # Windows 11 24H2
language: "C#"
dotnet_version: "8.0"                  # LTS
ui_framework: "WinUI 3"                # WinUI 3 | WPF | MAUI | WinForms
architecture: "MVVM"                   # MVVM | MVI | MVVM+Clean
di_framework: "Microsoft.Extensions.DependencyInjection"
local_db: "SQLite + EF Core"           # SQLite | SQL Server LocalDB | 없음
deployment: "Microsoft Store"          # Microsoft Store | MSIX | ClickOnce | WiX
```

---

## 섹션 1: 앱 개요

| 항목 | 내용 |
|------|------|
| **앱 이름** | |
| **Store 짧은 설명** | (80자 이하) |
| **앱 카테고리** | 비즈니스 / 생산성 / 유틸리티 / 재무 / 교육 |
| **타겟 사용자** | |
| **핵심 가치 제안** | |
| **수익 모델** | 무료 | 유료 | Freemium | 구독 (Microsoft 365) |
| **최소 화면 해상도** | 1366×768 (권장: 1920×1080) |

---

## 섹션 2: 화면 목록 (Screens)

| # | 화면 이름 | 역할 | 접근 권한 | 진입 경로 |
|---|----------|------|---------|---------|
| S01 | 스플래시 | 초기 로딩 + 자동 로그인 확인 | 모두 | 앱 시작 |
| S02 | 로그인 | 이메일/Windows Hello 인증 | 비로그인 | 스플래시 (토큰 없음) |
| S03 | 메인 (NavigationView) | 사이드 네비게이션 기반 메인 화면 | 로그인 | 로그인 성공 |
| S04 | {기능} 목록 | DataGrid/ListView 기반 목록 | 로그인 | 사이드 메뉴 |
| S05 | {기능} 상세 | 선택 항목 상세 + 편집 | 로그인 | 목록 항목 클릭 |
| S06 | 설정 | 앱 설정 (테마/언어/알림) | 로그인 | 사이드 메뉴 |
| S07 | {커스텀 화면} | | | |

---

## 섹션 3: 기능 명세 (Feature Specifications)

### F001: 인증 (Authentication)

```
지원 방식:
  [ ] 이메일/패스워드
  [ ] Windows Hello (지문/안면/PIN)
  [ ] Azure AD / Microsoft 계정 (MSAL 라이브러리)
  [ ] LDAP/Active Directory (기업 환경)

이메일 유효성: RFC 5322
패스워드 정책: 최소 8자, 대소문자+숫자 조합
토큰 저장: Windows Credential Manager (CredWrite)
자동 로그인: 스플래시에서 토큰 유효성 확인 후 자동 처리
세션 만료: 비활성 15분 → 재인증 요구

에러 처리:
- 잘못된 자격증명 (401): "이메일 또는 패스워드가 올바르지 않습니다"
- 5회 실패: "잠시 후 다시 시도해 주세요 (30분)"
- 네트워크 없음: "서버에 연결할 수 없습니다. 인터넷 연결을 확인해 주세요"
- Windows Hello 실패: "생체 인증에 실패했습니다. 패스워드로 로그인해 주세요"
```

### F002: {핵심 기능 1}

```
기능 설명:
입력:
출력:
비즈니스 규칙:
예외 처리:
UI 컨트롤: DataGrid | ListView | TreeView | 기타
```

### F003: {핵심 기능 2}

```
[동일 구조]
```

---

## 섹션 4: 데이터 모델

### 4.1 EF Core 엔티티 목록

```
참고: 04_database_schema.md의 표준 엔티티 사용

사용 엔티티:
- [ ] User
- [ ] Product
- [ ] Order / OrderItem
- [ ] CachedResponse
- [ ] AppSettings (JSON 파일, EF Core 제외)
- [ ] {CustomEntity}

커스텀 엔티티 추가:
public class {Name}
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string {Field} { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
```

### 4.2 Windows Credential Manager 키 목록

| 키 (PREFIX: 앱명_) | 타입 | 설명 |
|-------------------|------|------|
| auth_token | String | 액세스 토큰 |
| refresh_token | String | 리프레시 토큰 |
| user_id | String | 로그인 사용자 ID |

### 4.3 AppSettings.json 키 목록

| 키 | 타입 | 기본값 | 설명 |
|----|------|--------|------|
| ThemeMode | String | "System" | Light / Dark / System |
| Language | String | "ko-KR" | 표시 언어 |
| NotificationsEnabled | Boolean | true | 알림 활성화 |
| LastSyncTime | DateTime? | null | 마지막 서버 동기화 시간 |
| {key} | {type} | {default} | {description} |

---

## 섹션 5: API 연동

### 5.1 기본 설정

```yaml
base_url:
  production: "https://api.{domain}.com/v1"
  staging: "https://api-staging.{domain}.com/v1"
  development: "http://localhost:3000/v1"

auth: Bearer Token (Authorization: Bearer {token})
timeout_connect: 30초
timeout_read: 30초
retry: 3회 (지수 백오프: 1s/2s/4s, 5xx만)
```

### 5.2 사용 엔드포인트

| 메서드 | 경로 | 기능 | 인증 필요 |
|--------|------|------|---------|
| POST | /auth/login | 로그인 | 불필요 |
| POST | /auth/refresh | 토큰 갱신 | 불필요 |
| DELETE | /auth/logout | 로그아웃 | 필요 |
| GET | /users/me | 내 정보 | 필요 |
| {method} | {path} | {description} | {yes/no} |

---

## 섹션 6: 화면 레이아웃 & UX 요구사항

| # | 요구사항 | 세부 내용 |
|---|---------|---------|
| UX01 | 최소 해상도 | 1366×768 기준 레이아웃, 스크롤 없이 핵심 기능 접근 가능 |
| UX02 | 고DPI 지원 | 100%/125%/150%/200% 배율 정상 렌더링 |
| UX03 | 키보드 네비게이션 | Tab/Shift+Tab으로 모든 인터랙티브 요소 접근 |
| UX04 | 단축키 | Ctrl+S 저장, Ctrl+N 신규, Ctrl+F 검색, Delete 삭제 |
| UX05 | 테마 | System(기본)/Light/Dark 지원 |
| UX06 | 저장 경고 | 미저장 변경사항 있을 때 닫기 시 확인 다이얼로그 |
| UX07 | 로딩 표시 | 2초 이상 작업 시 ProgressRing 또는 ProgressBar |
| UX08 | 에러 표시 | InfoBar (WinUI 3) 또는 MessageBox |
| UX09 | 빈 상태 | 목록 비어있을 때 안내 메시지 + 액션 버튼 |
| UX10 | 접근성 | AutomationProperties.Name 필수 설정 |

---

## 섹션 7: 알림 명세

| # | 유형 | 트리거 | 표시 방법 | 클릭 액션 |
|---|------|--------|---------|---------|
| N01 | Toast 알림 | {이벤트 발생} | Windows 알림 센터 | {화면 이동} |
| N02 | 시스템 트레이 | 백그라운드 완료 | 풍선 도움말 (NotifyIcon) | 앱 포커스 |
| N03 | 앱 내 알림 | {인앱 이벤트} | InfoBar (상단) | {액션} |

---

## 섹션 8: 오류 시나리오

| # | 시나리오 | 코드 | 표시 방법 | 메시지 |
|---|---------|------|---------|--------|
| E01 | 로그인 실패 | 401 | ContentDialog | "이메일 또는 패스워드가 올바르지 않습니다" |
| E02 | 네트워크 없음 | - | InfoBar (Warning) | "서버에 연결할 수 없습니다. 오프라인 모드로 전환합니다" |
| E03 | 서버 오류 | 5xx | ContentDialog | "일시적인 오류입니다. 잠시 후 다시 시도해 주세요" |
| E04 | 세션 만료 | 401 | 로그인 화면 이동 | "로그인이 만료되었습니다. 다시 로그인해 주세요" |
| E05 | 저장 실패 | - | ContentDialog | "저장에 실패했습니다. 다시 시도해 주세요" |
| E06 | 파일 없음 | - | InfoBar (Error) | "파일을 찾을 수 없습니다" |

---

## 섹션 9: 테스트 요구사항

### 9.1 단위 테스트

```
프레임워크: xUnit + Moq + FluentAssertions
목표 커버리지: ViewModel, Repository, Service ≥ 80%

필수 테스트:
- [ ] 로그인 성공/실패 (LoginViewModel)
- [ ] 토큰 갱신 로직 (TokenStore)
- [ ] API 응답 파싱 (Repository)
- [ ] EF Core DAO CRUD (InMemory DB)
- [ ] 오프라인 캐시 폴백 (CachedApiService)
- [ ] 설정 저장/로드 (SettingsManager)
```

### 9.2 UI 테스트

```
프레임워크: WinAppDriver (WinUI/WPF) 또는 수동 테스트
대상: 핵심 사용자 플로우

- [ ] 로그인 → 메인 화면 이동
- [ ] {핵심 플로우} CRUD
- [ ] 단축키 동작 (Ctrl+S, Ctrl+N 등)
- [ ] 테마 변경 (Light/Dark/System)
```

### 9.3 실제 환경 테스트

```
필수 테스트 환경:
- Windows 10 1809 (최소 요구사양)
- Windows 11 최신 (주 배포 대상)
- 100% DPI / 125% DPI / 150% DPI / 200% DPI
- 화면 크기: 13인치(1366×768) / 15인치(1920×1080) / 4K(3840×2160)
- 저사양 PC: RAM 4GB, SSD 없는 HDD
```

---

## 섹션 10: 배포 계획

| 단계 | 내용 | 기간 |
|------|------|------|
| 내부 테스트 | 개발팀 (sideload MSIX) | |
| Beta | 선택된 사용자 (Store Private Preview 또는 TestFlight) | |
| Production | Microsoft Store 출시 | |

```
Microsoft Store 배포:
- Partner Center 계정 등록 (개발자 계정: 개인 $19 / 기업 $99)
- MSIX 패키지 생성: Visual Studio → Publish → MSIX
- 코드 서명: EV 인증서 권장
- 스토어 등록 정보: 스크린샷 (최소 2장) + 아이콘 (300×300) + 설명

자동 업데이트 (Store 외 배포 시):
// Squirrel.Windows + GitHub Releases 연동
using var mgr = new UpdateManager("https://github.com/user/repo/releases/latest");
var newVersion = await mgr.UpdateApp();
if (newVersion != null) {
    var dialog = new ContentDialog { Title = $"v{newVersion.Version} 업데이트 완료" };
    if (await dialog.ShowAsync() == ContentDialogResult.Primary) RestartApp();
}
```

---

**규격 ID:** {id} | **작성일:** {YYYY-MM-DD} | **승인:** {기획자명}
