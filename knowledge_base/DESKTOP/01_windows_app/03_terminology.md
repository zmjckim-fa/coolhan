# Windows 데스크탑 앱 용어 사전 (Terminology)

## 1. UI 프레임워크

| 용어 | 설명 |
|------|------|
| **WinUI 3** | Microsoft의 최신 네이티브 UI 프레임워크. Windows App SDK 기반, WPF의 정신적 후계자. XAML 선언형 UI |
| **WPF (Windows Presentation Foundation)** | .NET Framework/Core 기반 XAML UI 프레임워크. DirectX 렌더링. 엔터프라이즈 앱의 사실상 표준 |
| **WinForms (Windows Forms)** | .NET 기반 코드-우선 UI 프레임워크. 디자이너 드래그앤드롭. 단순 업무 도구에 적합 |
| **MAUI (.NET MAUI)** | Multi-platform App UI. 하나의 코드베이스로 Windows/macOS/iOS/Android 지원. XAML 기반 |
| **Blazor Desktop** | WebView2 기반 하이브리드. HTML/CSS/JS + C# 공유 로직. 웹 개발자 친화적 |
| **XAML** | eXtensible Application Markup Language. WinUI/WPF/MAUI의 선언형 UI 정의 언어 |
| **Code-behind** | XAML 파일 대응 C# 파일 (`MainWindow.xaml.cs`). UI 이벤트 처리. MVVM에서는 최소화 |
| **UserControl** | 재사용 가능한 복합 UI 컴포넌트 (`UserControl` 상속) |
| **ContentControl** | 단일 자식 컨텐츠를 호스팅하는 컨트롤. `ContentPresenter` 통해 렌더링 |
| **DataTemplate** | 데이터 객체를 UI로 매핑하는 템플릿. `ItemTemplate`/`ContentTemplate`에서 사용 |
| **ControlTemplate** | 컨트롤의 시각적 구조를 완전히 재정의. WPF/WinUI의 "Look-less" 컨트롤 철학 |

---

## 2. 언어 & 도구

| 용어 | 설명 |
|------|------|
| **C#** | .NET 생태계의 주력 언어. 타입 안전, 가비지 컬렉션, async/await 내장 |
| **.NET** | Microsoft 크로스플랫폼 런타임. 현재 .NET 8 LTS (Long-Term Support) |
| **NuGet** | .NET 패키지 관리자. `dotnet add package` 또는 Visual Studio NuGet 관리자 |
| **Visual Studio** | Microsoft 통합 개발환경(IDE). 디자이너, 디버거, IntelliSense 포함 |
| **Visual Studio Code** | 경량 코드 에디터. C# Dev Kit 확장으로 .NET 개발 지원 |
| **dotnet CLI** | `dotnet new/build/run/test/publish` — 커맨드라인 프로젝트 관리 |
| **MSBuild** | .NET 빌드 시스템. `.csproj` 파일로 빌드 구성 |
| **Windows App SDK** | WinUI 3 및 최신 Windows 기능을 기존 .NET 앱에 제공하는 SDK |
| **Roslyn** | .NET 컴파일러 플랫폼. Source Generator (소스 제너레이터) 기반 코드 생성 |
| **IL (Intermediate Language)** | .NET 바이트코드. JIT(Just-In-Time) 컴파일로 네이티브 코드로 변환 |

---

## 3. 아키텍처 패턴

| 용어 | 설명 |
|------|------|
| **MVVM (Model-View-ViewModel)** | WPF/WinUI 표준 패턴. View↔ViewModel 데이터 바인딩, ViewModel↔Model 분리 |
| **Model** | 도메인 데이터/비즈니스 로직. ViewModel이 사용. UI 의존 없음 |
| **View** | XAML UI. ViewModel을 DataContext로 설정. 이상적으로는 코드-비하인드 최소 |
| **ViewModel** | View와 Model의 중간자. `INotifyPropertyChanged` 구현, Command 패턴 |
| **INotifyPropertyChanged** | 프로퍼티 변경 시 UI 자동 갱신 인터페이스. `OnPropertyChanged()` 호출 |
| **ICommand / RelayCommand** | UI 액션(버튼 클릭 등)을 ViewModel 메서드에 바인딩하는 커맨드 패턴 |
| **ObservableCollection\<T\>** | 항목 추가/삭제 시 UI 자동 갱신. `List<T>` 대신 컬렉션 바인딩에 사용 |
| **DI (Dependency Injection)** | 의존성 주입. `Microsoft.Extensions.DependencyInjection` + `IServiceProvider` |
| **Repository Pattern** | 데이터 접근 추상화. ViewModel은 Repository 인터페이스만 알고 구현체는 모름 |
| **CommunityToolkit.Mvvm** | Microsoft가 공식 지원하는 MVVM 헬퍼 라이브러리. [ObservableProperty]/[RelayCommand] 소스 제너레이터 |

---

## 4. 데이터 & 저장소

| 용어 | 설명 |
|------|------|
| **Entity Framework Core (EF Core)** | .NET ORM (Object-Relational Mapper). LINQ로 DB 쿼리, 마이그레이션 관리 |
| **SQLite** | 로컬 파일 기반 경량 DB. 단일 `.db` 파일, 서버 불필요. 데스크탑 앱 표준 |
| **SQL Server LocalDB** | 개발/테스트용 경량 SQL Server. 프로덕션엔 SQL Server Express 또는 서버 버전 |
| **DbContext** | EF Core의 세션 단위. 엔티티 집합 + 변경 추적 + 트랜잭션 |
| **DPAPI (Data Protection API)** | Windows OS 제공 암호화 API. 사용자/기기 키 기반. `ProtectedData.Protect/Unprotect` |
| **Windows Credential Manager** | 자격증명(토큰/패스워드) 안전 저장소. `CredWrite/CredRead` Win32 API |
| **IsolatedStorage** | .NET 레거시 보호 저장소. 현재는 `%LocalAppData%` 직접 접근 + DPAPI 조합 권장 |
| **Settings / AppSettings** | 앱 설정 저장. `appsettings.json` (ASP.NET 방식) 또는 `Properties.Settings` (WinForms/WPF) |
| **Migration** | EF Core DB 스키마 변경 관리. `dotnet ef migrations add` → `dotnet ef database update` |
| **Connection String** | DB 연결 정보. 개발: `Data Source=app.db`, 암호화: `Password=...` 옵션 |

---

## 5. 비동기 & 스레딩

| 용어 | 설명 |
|------|------|
| **async/await** | C# 비동기 패턴. UI 스레드 블로킹 방지. `async Task Method()` + `await` 호출 |
| **Task** | 비동기 작업의 표현. `Task<T>`는 반환값 있음. `Task.Run()`은 스레드풀 사용 |
| **Dispatcher** | WPF/WinUI UI 스레드 접근. `Dispatcher.InvokeAsync()` / `DispatcherQueue.TryEnqueue()` |
| **CancellationToken** | 비동기 작업 취소 신호. `CancellationTokenSource.Cancel()` → `OperationCanceledException` |
| **Progress\<T\>** | 백그라운드 → UI 진행률 보고. 자동으로 UI 스레드에서 콜백 호출 |
| **SemaphoreSlim** | 비동기 호환 세마포어. 동시 접근 수 제한, 뮤텍스 대안 |
| **BackgroundWorker** | 레거시 WinForms 백그라운드 작업. 현재는 `Task`/`async-await` 권장 |
| **IHostedService** | .NET Generic Host 기반 백그라운드 서비스. 데스크탑 앱에도 적용 가능 |

---

## 6. 배포 & 설치

| 용어 | 설명 |
|------|------|
| **MSIX** | Modern Windows Installer. 샌드박스 격리, 자동 업데이트, Microsoft Store 배포 형식 |
| **Self-contained** | .NET 런타임 포함 배포. 사용자 PC에 .NET 설치 불필요. 파일 크기 증가 |
| **Framework-dependent** | .NET 런타임 미포함. 사용자가 .NET 런타임 별도 설치 필요. 파일 크기 최소 |
| **ClickOnce** | 웹/파일공유 기반 자동 업데이트 배포. 단순하지만 기능 제한적 |
| **WiX Toolset** | 전통적 MSI 생성 도구. 복잡한 설치 시나리오, 그룹 정책, 시스템 수준 설치 |
| **Microsoft Store** | Windows 앱 공식 스토어. MSIX 패키지 제출, 자동 업데이트, 결제 플랫폼 |
| **Side-loading** | Store 외부 MSIX 설치. 개발자 모드 또는 신뢰할 수 있는 인증서 필요 |
| **Publish Profile** | `dotnet publish` 설정 파일. 대상 플랫폼/아키텍처/AOT 등 옵션 지정 |
| **Code Signing** | 실행 파일/설치 파일 디지털 서명. SmartScreen 경고 방지. EV 인증서 권장 |
| **Squirrel.Windows** | GitHub Releases 기반 자동 업데이트 라이브러리. Electron 앱에도 사용 |

---

## 7. 시스템 통합

| 용어 | 설명 |
|------|------|
| **Registry** | Windows 레지스트리. 시작 프로그램 등록, 파일 연결 등. `Microsoft.Win32.Registry` |
| **COM (Component Object Model)** | Windows 컴포넌트 모델. Office 자동화, 레거시 연동에 사용 |
| **Win32 API** | Windows 네이티브 API. P/Invoke로 C#에서 호출 가능 |
| **P/Invoke** | Platform Invocation Services. 비관리 코드(Win32 DLL) 호출 메커니즘 |
| **WMI (Windows Management Instrumentation)** | 시스템 정보 조회. 하드웨어/소프트웨어/프로세스 정보 |
| **Named Pipe** | 프로세스 간 통신(IPC). 단일 인스턴스 앱에서 기존 인스턴스 활성화에 활용 |
| **File Association** | 파일 확장자와 앱 연결. 더블클릭으로 앱 실행 |
| **Jump List** | 작업 표시줄 우클릭 최근 항목/빠른 실행 목록 |
| **Thumbnail Toolbar** | 작업 표시줄 미리보기 아이콘 아래의 버튼 (재생/일시정지 등) |

---

**문서 버전:** 1.0.0 | **작성일:** 2026-06-13 | **적용 스택:** C# + .NET 8 + WinUI 3 / WPF
