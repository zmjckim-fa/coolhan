# Windows 프로그램 - 기본 논리 (Windows Desktop App Basic Logic)

## 1. Windows 프로그램의 특징

Windows 프로그램은 **Windows 운영체제에서 실행되는 설치형 애플리케이션**입니다.

### 핵심 특징
```
- 사용자가 설치해서 사용
- 로컬 리소스 (파일, 레지스트리) 접근 가능
- 높은 성능과 자유도
- 심사 없이 배포 가능
- 유지보수 복잡성 증가
```

---

## 2. 앱 아키텍처 선택지

### 2.1 WPF (Windows Presentation Foundation)
```
.NET Framework 기반
- XAML을 이용한 UI 정의
- 데이터 바인딩 강력
- MVVM 패턴에 적합
- Windows 7 이상 지원
```

### 2.2 WinForms
```
.NET Framework 기반
- 빠른 개발
- 간단한 애플리케이션용
- 최신 기술보다 구식
```

### 2.3 UWP (Universal Windows Platform)
```
Windows 10+ 전용
- 모던 UI
- Windows Store 배포
- 제한된 권한 (Sandboxed)
```

### 2.4 Electron
```
웹 기술 기반 (HTML/CSS/JavaScript)
- 크로스 플랫폼 (Windows/Mac/Linux)
- 빠른 개발
- 성능 오버헤드
```

---

## 3. 프로그램 생명주기

### 3.1 시작 흐름
```
1. 사용자가 exe 파일 실행
2. Main() 함수 호출
3. 애플리케이션 초기화
4. 메인 윈도우 생성
5. 이벤트 루프 시작
```

### 3.2 윈도우 메시지 루프
```
getMessage() - Windows 메시지 대기
    ↓
메시지 처리 (이벤트 발생)
    ↓
화면 갱신
    ↓
반복...
```

### 3.3 종료 흐름
```
1. 사용자가 X 버튼 클릭
2. OnClosing 이벤트
3. 리소스 정리
4. 애플리케이션 종료
```

---

## 4. UI 구조

### 4.1 창(Window) 계층
```
Main Window (메인 창)
├─ Menu Bar (메뉴바)
├─ Toolbar (도구모음)
├─ Content Area (콘텐츠 영역)
│   └─ Panels, Buttons, TextBox 등
└─ Status Bar (상태바)
```

### 4.2 대화상자(Dialog)
```
Modal Dialog (모달)
- 부모 창을 차단
- OK/Cancel 버튼

Modeless Dialog (비모달)
- 독립적으로 작동
- 여러 개 열 수 있음
```

### 4.3 컨트롤(Control)
```
Button, TextBox, Label
CheckBox, RadioButton
ListBox, ComboBox
DataGrid
TreeView
```

---

## 5. 데이터 저장소

### 5.1 윈도우 레지스트리
```
목적: 설정 저장
위치: HKEY_CURRENT_USER\Software\[AppName]\
예:
- 마지막 열었던 파일
- 사용자 설정
- 라이센스 정보
```

### 5.2 로컬 파일
```
XML, JSON, INI 파일
- 사용자 데이터
- 설정
- 캐시

위치:
- AppData\Local (앱별)
- AppData\Roaming (여러 PC 동기화)
```

### 5.3 데이터베이스
```
SQLite
- 설치 불필요
- 가벼움
- 로컬 데이터 저장

SQL Server Express
- 더 많은 기능
- 설치 필요
- 복잡한 애플리케이션용
```

### 5.4 클라우드/서버
```
REST API를 통한 통신
- 클라우드 저장
- 동기화
```

---

## 6. 멀티스레딩 (Multithreading)

### 6.1 UI 스레드
```
메인 스레드 = UI 스레드
- 모든 UI 업데이트는 메인 스레드에서만
- 차단되면 UI 응답 없음
```

### 6.2 백그라운드 작업
```
Task를 사용한 비동기 처리:
1. 오래 걸리는 작업을 별도 스레드에서 실행
2. 완료 후 UI 스레드에서 업데이트
3. 사용자 응답성 유지

예:
- 파일 읽기/쓰기
- 네트워크 요청
- 데이터 처리
```

### 6.3 Async/Await
```
비동기 프로그래밍 패턴
async Task LongRunningOperation()
{
    await Task.Delay(1000);
    // UI 업데이트
}
```

---

## 7. 파일 시스템 (File System)

### 7.1 파일 경로
```
프로그램 설치 경로: Program Files
- C:\Program Files\[AppName]\

사용자 데이터:
- C:\Users\[Username]\AppData\Local\[AppName]\
- C:\Users\[Username]\AppData\Roaming\[AppName]\

공용 폴더:
- Documents, Downloads, Desktop
```

### 7.2 파일 I/O
```
C# File/StreamReader/StreamWriter
- 파일 읽기
- 파일 쓰기
- 스트림 처리

권한 확인:
- 쓰기 권한이 있는지 확인
- 파일 존재 확인
```

---

## 8. 레지스트리 (Registry)

### 8.1 레지스트리 구조
```
HKEY_CURRENT_USER
├─ Software
│  └─ [Company]
│     └─ [AppName]
│        ├─ Setting1
│        ├─ Setting2
│        └─ ...
```

### 8.2 레지스트리 사용
```
읽기: Registry.GetValue()
쓰기: Registry.SetValue()

주의:
- 레지스트리 쓰기는 느림
- 자주 쓰면 안 됨
- 설정 저장소로만 사용
```

---

## 9. 설치 관리자 (Installer)

### 9.1 MSI (Microsoft Installer)
```
표준 Windows 설치 형식
- 자동 제거(Uninstall) 가능
- 버전 관리
- 파일 무결성 검증
```

### 9.2 설치 프로세스
```
1. 설치 경로 선택
2. 바로가기 생성
3. 파일 복사
4. 레지스트리 설정
5. 서비스 등록 (필요시)
```

### 9.3 자동 업데이트
```
프로그램 내부에서:
1. 새 버전 확인
2. 다운로드
3. 백업
4. 설치
5. 재시작
```

---

## 10. 보안

### 10.1 관리자 권한
```
매니페스트 파일에서 선언:
- requireAdministrator (항상 관리자)
- asInvoker (일반 사용자)

관리자 권한이 필요한 경우:
- 시스템 파일 수정
- 서비스 설치
```

### 10.2 코드 서명
```
프로그램에 디지털 서명
- 출판사 확인
- 파일 무결성 보증
- 사용자 신뢰성 증대
```

### 10.3 데이터 보안
```
민감한 정보 암호화:
- Data Protection API (DPAPI)
- 비밀번호는 평문 저장 금지
```

---

## 11. 성능 최적화

### 11.1 로딩 시간
```
- Lazy loading (필요할 때만 로드)
- 백그라운드에서 초기화
- 스플래시 화면 표시
```

### 11.2 메모리 관리
```
- 큰 이미지는 스트림으로 처리
- 사용하지 않는 리소스는 해제
- WeakReference 사용
```

### 11.3 응답성 (Responsiveness)
```
- 메인 스레드 차단 금지
- Task를 사용한 비동기 작업
- Progress 표시 (진행률 바)
```

---

## 12. 배포 방식

### 12.1 MSI 설치 프로그램
```
장점:
- 표준 설치 프로세스
- 자동 제거 가능
- 버전 관리

단점:
- 개발 복잡
- 파일 크기 큼
```

### 12.2 포터블 버전 (EXE)
```
장점:
- 설치 불필요
- 빠름
- 여러 PC에서 사용 가능

단점:
- 사용자 설정 관리 복잡
- 바로가기 생성 안 됨
```

### 12.3 클라우드/앱 스토어
```
Microsoft Store
- 자동 업데이트
- 사용자 신뢰성
```

---

## 13. 에러 처리 및 로깅

### 13.1 예외 처리
```
try-catch 블록
- 예상 가능한 에러 처리
- 사용자에게 명확한 메시지

Unhandled Exception Handler
- 예상 불가능한 에러 처리
- 크래시 리포트 생성
```

### 13.2 로깅
```
파일 기반 로깅:
- 디버깅 정보
- 에러 로그
- 사용 패턴

위치:
- AppData\Local\[AppName]\Logs\
```

---

## 14. 버전 관리

### 14.1 프로그램 버전
```
AssemblyVersion: 내부 버전
FileVersion: 파일 속성에 표시
ProductVersion: 사용자 보이는 버전

형식: Major.Minor.Build.Revision
예: 1.0.0.0
```

### 14.2 호환성
```
이전 버전 설정 마이그레이션
- 레지스트리 구조 변경
- 파일 형식 변경 시 변환
- 롤백 지원
```

---

## 15. 사용자 경험 (UX)

### 15.1 설정 저장
```
마지막 상태 저장:
- 창 크기/위치
- 열었던 문서
- 사용자 선호도
```

### 15.2 진행 표시
```
장시간 작업 시:
- Progress Bar
- Status 메시지
- Cancel 버튼
```

### 15.3 도움말
```
- 온라인 도움말 (CHM)
- 인앱 팁
- 마우스 오버 Tooltip
```

---

## 16. 주요 프레임워크

```
UI:
- WPF (권장)
- WinForms (레거시)

데이터:
- Entity Framework Core
- Dapper
- SQLite

네트워킹:
- HttpClient
- WCF (레거시)

로깅:
- Serilog
- NLog

의존성 주입:
- Microsoft.Extensions.DependencyInjection

테스트:
- xUnit
- Moq
```

---

## 17. 다음 문서로 읽어야 할 것

1. **core_features.md** - Windows 앱의 일반적인 기능
2. **architecture.md** - MVVM, MVP 패턴
3. **installer_guide.md** - 설치 프로그램 구성
4. **api_standard.md** - 네트워킹 표준
5. **spec_template.md** - Windows 앱 기획서 템플릿

