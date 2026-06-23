# Windows Desktop App Core Features

## Section 1: App Framework Selection

```
Windows desktop framework comparison:
┌────────────────┬─────────────┬─────────────┬──────────────────────────┐
│ Framework      │ UI approach │ Minimum OS  │ Suitable scenarios       │
├────────────────┼─────────────┼─────────────┼──────────────────────────┤
│ WinUI 3        │ Declarative XAML │ Windows 10 │ Modern Windows apps, Store │
│ WPF            │ Declarative XAML │ Windows 7  │ Enterprise, complex UI   │
│ WinForms       │ Code-based  │ Windows XP  │ Legacy, simple line-of-business tools │
│ .NET MAUI      │ Declarative XAML │ Windows 10 │ Cross-platform (Win/Mac/iOS/Android) │
│ Blazor Desktop │ HTML/CSS    │ Windows 10  │ Web developers, web tech reuse │
└────────────────┴─────────────┴─────────────┴──────────────────────────┘

CoolHan recommendation:
- New projects: WinUI 3 (Microsoft Store distribution, latest API)
- Enterprise/legacy: WPF
- Cross-platform: .NET MAUI
```

---

## Section 2: App Lifecycle & Structure

```
WinUI 3 / WPF entry point:
App.xaml → Application class
  OnLaunched() / Application_Startup → initialization
    → MainWindow creation
      → navigation Frame or ContentControl

WPF lifecycle:
Application.Startup → MainWindow.Loaded → running
  → MainWindow.Closing (cancelable) → MainWindow.Closed
  → Application.Exit → shutdown

Single-instance guarantee (Mutex-based):
static Mutex _mutex = new Mutex(true, "MyApp-{GUID}");
if (!_mutex.WaitOne(0, false)) {
    // Activate the existing instance, then exit
    BringExistingInstanceToFront();
    Application.Current.Shutdown();
    return;
}
```

**CoolHan rules:**
- Business apps enforce a single instance (Mutex + Named Pipe combination)
- A confirmation dialog for unsaved data before exit is mandatory (prevents data loss)
- App settings are stored under the `%AppData%\{Company}\{App}` path

---

## Section 3: Navigation & Layout

```xml
<!-- WinUI 3 / WPF XAML navigation pattern -->
<NavigationView x:Name="NavView" SelectionChanged="NavView_SelectionChanged">
    <NavigationView.MenuItems>
        <NavigationViewItem Content="Home" Tag="home" Icon="Home"/>
        <NavigationViewItem Content="Orders" Tag="orders" Icon="List"/>
        <NavigationViewItem Content="Settings" Tag="settings" Icon="Setting"/>
    </NavigationView.MenuItems>
    <Frame x:Name="ContentFrame"/>
</NavigationView>

<!-- Layout containers -->
Grid      → grid layout (row/column division)
StackPanel → vertical/horizontal stack
DockPanel  → docking layout (WPF)
WrapPanel  → automatic line wrapping
Canvas    → absolute positioning (special cases such as drag and drop)
```

**CoolHan rules:**
- A DataGrid/ListView + detail panel split layout is the standard for business apps
- NavigationView is the standard WinUI 3 control. For WPF, use TabControl or TreeView+ContentControl
- Minimum resolution: design the layout for 1366×768, with variable-size support

---

## Section 4: Data Binding & MVVM

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

// XAML binding
<ListView ItemsSource="{Binding Orders}" SelectedItem="{Binding SelectedOrder}">
    <ListView.ItemTemplate>
        <DataTemplate>
            <TextBlock Text="{Binding Title}"/>
        </DataTemplate>
    </ListView.ItemTemplate>
</ListView>
<Button Command="{Binding DeleteOrderCommand}"
        CommandParameter="{Binding SelectedOrder}"
        Content="Delete"/>
```

**CoolHan rules:**
- `CommunityToolkit.Mvvm` is recommended (source-generator based, minimal boilerplate)
- ViewModels must not reference Views (testability)
- Use `ObservableCollection<T>` for collection changes (automatic UI refresh)

---

## Section 5: File System & Storage

```csharp
// Standard paths
string appData   = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
string localData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
string documents = Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments);

// App data path (recommended)
string appDir = Path.Combine(appData, "CompanyName", "AppName");
Directory.CreateDirectory(appDir);

// Settings file
string configPath = Path.Combine(appDir, "settings.json");

// SQLite database
string dbPath = Path.Combine(localData, "CompanyName", "AppName", "data.db");

// File picker dialog (WinUI 3)
var picker = new FileOpenPicker();
picker.FileTypeFilter.Add(".csv");
picker.SuggestedStartLocation = PickerLocationId.DocumentsLibrary;
// WinUI 3: the picker must be associated with a Window
WinRT.Interop.InitializeWithWindow.Initialize(picker, hwnd);
StorageFile file = await picker.PickSingleFileAsync();
```

---

## Section 6: Background Work & Async

```csharp
// async/await pattern (essential to prevent UI blocking)
private async void LoadData_Click(object sender, RoutedEventArgs e)
{
    LoadButton.IsEnabled = false;
    ProgressRing.IsActive = true;
    try {
        var data = await _service.FetchDataAsync();
        // UI updates go through the Dispatcher
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

// Long-running work: report progress with Progress<T>
var progress = new Progress<int>(percent => ProgressBar.Value = percent);
await Task.Run(() => LongRunningOperation(progress));

// CancellationToken (canceling work)
private CancellationTokenSource? _cts;
private async Task StartImportAsync() {
    _cts = new CancellationTokenSource();
    try {
        await _importService.ImportAsync(_cts.Token);
    } catch (OperationCanceledException) {
        ShowMessage("The import was canceled.");
    }
}
private void CancelButton_Click() => _cts?.Cancel();
```

---

## Section 7: Notifications & System Tray

```csharp
// Windows Toast notification (WinUI 3 / UWP style)
var builder = new AppNotificationBuilder()
    .AddText("Your order has been approved")
    .AddText("Order number: ORD-20260613-0001")
    .AddButton(new AppNotificationButton("Confirm")
        .AddArgument("action", "view_order"));
AppNotificationManager.Default.Show(builder.BuildNotification());

// System tray icon (WPF / WinForms)
var trayIcon = new NotifyIcon {
    Icon = new Icon("app.ico"),
    Text = "App name",
    Visible = true,
    ContextMenuStrip = BuildContextMenu()
};
trayIcon.DoubleClick += (s, e) => ShowMainWindow();
// trayIcon.Dispose() is required when the app exits
```

---

## Section 8: Printing & Export

```csharp
// Excel export (ClosedXML)
using var workbook = new XLWorkbook();
var sheet = workbook.Worksheets.Add("Order list");
sheet.Cell(1, 1).Value = "Order number";
sheet.Cell(1, 2).Value = "Amount";
sheet.Cell(1, 3).Value = "Status";
for (int i = 0; i < orders.Count; i++) {
    sheet.Cell(i + 2, 1).Value = orders[i].Id;
    sheet.Cell(i + 2, 2).Value = orders[i].TotalAmount;
    sheet.Cell(i + 2, 3).Value = orders[i].Status;
}
workbook.SaveAs(filePath);

// PDF export (QuestPDF)
Document.Create(container => {
    container.Page(page => {
        page.Content().Table(table => {
            table.ColumnsDefinition(c => { c.RelativeColumn(); c.RelativeColumn(); });
            // Add header and data rows
        });
    });
}).GeneratePdf(filePath);

// Printing (WPF PrintDialog)
var printDialog = new PrintDialog();
if (printDialog.ShowDialog() == true) {
    printDialog.PrintVisual(printCanvas, "Print order list");
}
```

---

## Section 9: Updates & Distribution

```
Distribution method comparison:
┌─────────────────┬──────────────────────────────────────────┐
│ Method          │ Characteristics                          │
├─────────────────┼──────────────────────────────────────────┤
│ Microsoft Store │ MSIX package, automatic updates, signing required │
│ MSIX Installer  │ Standalone installer, automatic updates supported │
│ ClickOnce       │ Web-based distribution, simple automatic updates │
│ WiX Toolset     │ Traditional MSI, enterprise distribution │
│ Squirrel        │ Automatic updates integrated with GitHub Releases │
└─────────────────┴──────────────────────────────────────────┘

Automatic updates (Squirrel.Windows):
// Check for updates at startup
using var mgr = new UpdateManager("https://releases.example.com/myapp");
var release = await mgr.UpdateApp();
if (release != null) RestartApp();
```

---

## Section 10: Accessibility & Internationalization

```csharp
// Accessibility (UI Automation / AutomationProperties)
<Button AutomationProperties.Name="Delete order"
        AutomationProperties.HelpText="Deletes the selected order"/>

// Keyboard navigation (TabIndex, AccessKey)
<Button Content="_Save(S)" KeyboardAccelerator.Key="S"
        KeyboardAccelerator.Modifiers="Control"/>

// Internationalization (resource files)
// Resources.resx (default) + Resources.ko-KR.resx (Korean)
// Properties.Resources.OrderTitle = "Order list"

// Date/number formatting (CultureInfo)
CultureInfo.CurrentCulture    // display format
CultureInfo.CurrentUICulture  // resource selection
Thread.CurrentThread.CurrentCulture = new CultureInfo("ko-KR");

// WPF binding based on the current language
<TextBlock Text="{Binding Amount, StringFormat='{}{0:C}'}"/>
// C = currency format, CultureInfo.CurrentCulture applied automatically
```

---

**Document version:** 1.0.0 | **Date:** 2026-06-13 | **Target OS:** Windows 10 1809+, .NET 8+
