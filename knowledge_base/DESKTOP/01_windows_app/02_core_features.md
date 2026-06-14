# Windows 데스크탑 앱 핵심 기능 (Core Features)

## 섹션 1: 앱 프레임워크 선택

```
Windows 데스크탑 프레임워크 비교:
┌────────────────┬────────────┬─────────────┬──────────────────────────┐
│ 프레임워크     │ UI 방식    │ 최소 OS     │ 적합 시나리오            │
├────────────────┼────────────┼─────────────┼──────────────────────────┤
│ WinUI 3        │ XAML 선언형│ Windows 10  │ 모던 Windows 앱, Store   │
│ WPF            │ XAML 선언형│ Windows 7   │ 엔터프라이즈, 복잡한 UI  │
│ WinForms       │ 코드 기반  │ Windows XP  │ 레거시, 단순 업무 도구   │
│ .NET MAUI      │ XAML 선언형│ Windows 10  │ 크로스플랫폼 (Win/Mac/iOS/Android) │
│ Blazor Desktop │ HTML/CSS   │ Windows 10  │ 웹 개발자, 웹 기술 재사용│
└────────────────┴────────────┴─────────────┴──────────────────────────┘

CoolHan 권장:
- 신규 프로젝트: WinUI 3 (Microsoft Store 배포, 최신 API)
- 엔터프라이즈/레거시: WPF
- 크로스플랫폼: .NET MAUI
```

---

## 섹션 2: 앱 생명주기 & 구조

```
WinUI 3 / WPF 진입점:
App.xaml → Application 클래스
  OnLaunched() / Application_Startup → 초기화
    → MainWindow 생성
      → 네비게이션 프레임 (Frame) 또는 ContentControl

WPF 생명주기:
Application.Startup → MainWindow.Loaded → 실행 중
  → MainWindow.Closing (취소 가능) → MainWindow.Closed
  → Application.Exit → 종료

단일 인스턴스 보장 (Mutex 기반):
static Mutex _mutex = new Mutex(true, "MyApp-{GUID}");
if (!_mutex.WaitOne(0, false)) {
    // 기존 인스턴스 활성화 후 종료
    BringExistingInstanceToFront();
    Application.Current.Shutdown();
    return;
}
```

**CoolHan 규칙:**
- 업무용 앱은 단일 인스턴스 강제 (Mutex + Named Pipe 조합)
- 종료 전 미저장 데이터 확인 다이얼로그 필수 (데이터 손실 방지)
- 앱 설정은 `%AppData%\{Company}\{App}` 경로에 저장

---

## 섹션 3: 네비게이션 & 레이아웃

```xml
<!-- WinUI 3 / WPF XAML 네비게이션 패턴 -->
<NavigationView x:Name="NavView" SelectionChanged="NavView_SelectionChanged">
    <NavigationView.MenuItems>
        <NavigationViewItem Content="홈" Tag="home" Icon="Home"/>
        <NavigationViewItem Content="주문" Tag="orders" Icon="List"/>
        <NavigationViewItem Content="설정" Tag="settings" Icon="Setting"/>
    </NavigationView.MenuItems>
    <Frame x:Name="ContentFrame"/>
</NavigationView>

<!-- 레이아웃 컨테이너 -->
Grid      → 격자 레이아웃 (행/열 분할)
StackPanel → 수직/수평 스택
DockPanel  → 도킹 레이아웃 (WPF)
WrapPanel  → 자동 줄바꿈
Canvas    → 절대 위치 (드래그 앤 드롭 등 특수 케이스)
```

**CoolHan 규칙:**
- 데이터그리드(DataGrid/ListView) + 상세 패널 분할 레이아웃이 업무 앱 표준
- NavigationView는 WinUI 3 표준 컨트롤. WPF는 TabControl 또는 TreeView+ContentControl
- 최소 해상도: 1366×768 기준 레이아웃 설계, 가변 크기 지원

---

## 섹션 4: 데이터 바인딩 & MVVM

```csharp
// ViewModel (INotifyPropertyChanged)
public class OrderViewModel : ObservableObject  // CommunityToolkit.Mvvm
{
    [ObservableProperty] private ObservableCollection<Order> _orders = new();
    [ObservableProperty] private Order? _selectedOrder;
    [ObservableProperty] private bool _isLoading;

    [RelayCommand]
    private async Task LoadOrdersAsync()
    {
        IsLoading = true;
        try {
            Orders = new ObservableCollection<Order>(
                await _orderRepository.GetOrdersAsync());
        } finally {
            IsLoading = false;
        }
    }

    [RelayCommand(CanExecute = nameof(CanDeleteOrder))]
    private async Task DeleteOrderAsync(Order order) { ... }
    private bool CanDeleteOrder(Order? order) => order?.Status == "pending";
}

// XAML 바인딩
<ListView ItemsSource="{Binding Orders}" SelectedItem="{Binding SelectedOrder}">
    <ListView.ItemTemplate>
        <DataTemplate>
            <TextBlock Text="{Binding Title}"/>
        </DataTemplate>
    </ListView.ItemTemplate>
</ListView>
<Button Command="{Binding DeleteOrderCommand}"
        CommandParameter="{Binding SelectedOrder}"
        Content="삭제"/>
```

**CoolHan 규칙:**
- `CommunityToolkit.Mvvm` 사용 권장 (소스 제너레이터 기반, 보일러플레이트 최소)
- ViewModel은 View 참조 금지 (테스트 가능성)
- 컬렉션 변경은 `ObservableCollection<T>` 사용 (UI 자동 갱신)

---

## 섹션 5: 파일 시스템 & 저장소

```csharp
// 표준 경로
string appData   = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
string localData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
string documents = Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments);

// 앱 데이터 경로 (권장)
string appDir = Path.Combine(appData, "CompanyName", "AppName");
Directory.CreateDirectory(appDir);

// 설정 파일
string configPath = Path.Combine(appDir, "settings.json");

// SQLite 데이터베이스
string dbPath = Path.Combine(localData, "CompanyName", "AppName", "data.db");

// 파일 선택 다이얼로그 (WinUI 3)
var picker = new FileOpenPicker();
picker.FileTypeFilter.Add(".csv");
picker.SuggestedStartLocation = PickerLocationId.DocumentsLibrary;
// WinUI 3: picker를 Window에 연결 필요
WinRT.Interop.InitializeWithWindow.Initialize(picker, hwnd);
StorageFile file = await picker.PickSingleFileAsync();
```

---

## 섹션 6: 백그라운드 작업 & 비동기

```csharp
// async/await 패턴 (UI 블로킹 방지 필수)
private async void LoadData_Click(object sender, RoutedEventArgs e)
{
    LoadButton.IsEnabled = false;
    ProgressRing.IsActive = true;
    try {
        var data = await _service.FetchDataAsync();
        // UI 업데이트는 Dispatcher를 통해
        await Dispatcher.RunAsync(CoreDispatcherPriority.Normal, () => {
            DataGrid.ItemsSource = data;
        });
    } catch (Exception ex) {
        await ShowErrorDialogAsync(ex.Message);
    } finally {
        LoadButton.IsEnabled = true;
        ProgressRing.IsActive = false;
    }
}

// 장시간 작업: Progress<T>로 진행률 보고
var progress = new Progress<int>(percent => ProgressBar.Value = percent);
await Task.Run(() => LongRunningOperation(progress));

// CancellationToken (작업 취소)
private CancellationTokenSource? _cts;
private async Task StartImportAsync() {
    _cts = new CancellationTokenSource();
    try {
        await _importService.ImportAsync(_cts.Token);
    } catch (OperationCanceledException) {
        ShowMessage("가져오기가 취소되었습니다.");
    }
}
private void CancelButton_Click() => _cts?.Cancel();
```

---

## 섹션 7: 알림 & 시스템 트레이

```csharp
// Windows Toast 알림 (WinUI 3 / UWP 방식)
var builder = new AppNotificationBuilder()
    .AddText("주문이 승인되었습니다")
    .AddText("주문번호: ORD-20260613-0001")
    .AddButton(new AppNotificationButton("확인")
        .AddArgument("action", "view_order"));
AppNotificationManager.Default.Show(builder.BuildNotification());

// 시스템 트레이 아이콘 (WPF / WinForms)
var trayIcon = new NotifyIcon {
    Icon = new Icon("app.ico"),
    Text = "앱 이름",
    Visible = true,
    ContextMenuStrip = BuildContextMenu()
};
trayIcon.DoubleClick += (s, e) => ShowMainWindow();
// 앱 종료 시 trayIcon.Dispose() 필수
```

---

## 섹션 8: 인쇄 & 내보내기

```csharp
// Excel 내보내기 (ClosedXML)
using var workbook = new XLWorkbook();
var sheet = workbook.Worksheets.Add("주문 목록");
sheet.Cell(1, 1).Value = "주문번호";
sheet.Cell(1, 2).Value = "금액";
sheet.Cell(1, 3).Value = "상태";
for (int i = 0; i < orders.Count; i++) {
    sheet.Cell(i + 2, 1).Value = orders[i].Id;
    sheet.Cell(i + 2, 2).Value = orders[i].TotalAmount;
    sheet.Cell(i + 2, 3).Value = orders[i].Status;
}
workbook.SaveAs(filePath);

// PDF 내보내기 (QuestPDF)
Document.Create(container => {
    container.Page(page => {
        page.Content().Table(table => {
            table.ColumnsDefinition(c => { c.RelativeColumn(); c.RelativeColumn(); });
            // 헤더, 데이터 행 추가
        });
    });
}).GeneratePdf(filePath);

// 인쇄 (WPF PrintDialog)
var printDialog = new PrintDialog();
if (printDialog.ShowDialog() == true) {
    printDialog.PrintVisual(printCanvas, "주문 목록 인쇄");
}
```

---

## 섹션 9: 업데이트 & 배포

```
배포 방식 비교:
┌─────────────────┬──────────────────────────────────────────┐
│ 방식            │ 특징                                     │
├─────────────────┼──────────────────────────────────────────┤
│ Microsoft Store │ MSIX 패키지, 자동 업데이트, 서명 필요    │
│ MSIX Installer  │ 단독 설치 파일, 자동 업데이트 가능       │
│ ClickOnce       │ 웹 기반 배포, 간단한 자동 업데이트       │
│ WiX Toolset     │ 전통적 MSI, 엔터프라이즈 배포           │
│ Squirrel        │ GitHub Releases 연동 자동 업데이트       │
└─────────────────┴──────────────────────────────────────────┘

자동 업데이트 (Squirrel.Windows):
// 시작 시 업데이트 확인
using var mgr = new UpdateManager("https://releases.example.com/myapp");
var release = await mgr.UpdateApp();
if (release != null) RestartApp();
```

---

## 섹션 10: 접근성 & 국제화

```csharp
// 접근성 (UI Automation / AutomationProperties)
<Button AutomationProperties.Name="주문 삭제"
        AutomationProperties.HelpText="선택된 주문을 삭제합니다"/>

// 키보드 네비게이션 (TabIndex, AccessKey)
<Button Content="_저장(S)" KeyboardAccelerator.Key="S"
        KeyboardAccelerator.Modifiers="Control"/>

// 국제화 (리소스 파일)
// Resources.resx (기본) + Resources.ko-KR.resx (한국어)
// Properties.Resources.OrderTitle = "주문 목록"

// 날짜/숫자 형식 (CultureInfo)
CultureInfo.CurrentCulture    // 표시 형식
CultureInfo.CurrentUICulture  // 리소스 선택
Thread.CurrentThread.CurrentCulture = new CultureInfo("ko-KR");

// WPF 현재 언어 기반 바인딩
<TextBlock Text="{Binding Amount, StringFormat='{}{0:C}'}"/>
// C = 통화 형식, CultureInfo.CurrentCulture 자동 적용
```

---

**문서 버전:** 1.0.0 | **작성일:** 2026-06-13 | **대상 OS:** Windows 10 1809+, .NET 8+
