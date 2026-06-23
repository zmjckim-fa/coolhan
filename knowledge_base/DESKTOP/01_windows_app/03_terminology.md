# Windows Desktop App Glossary (Terminology)

## 1. UI Frameworks

| Term | Description |
|------|------|
| **WinUI 3** | Microsoft's latest native UI framework. Built on the Windows App SDK; the spiritual successor to WPF. Declarative XAML UI |
| **WPF (Windows Presentation Foundation)** | XAML UI framework built on .NET Framework/Core. DirectX rendering. The de facto standard for enterprise apps |
| **WinForms (Windows Forms)** | Code-first UI framework built on .NET. Designer drag-and-drop. Suitable for simple line-of-business tools |
| **MAUI (.NET MAUI)** | Multi-platform App UI. Supports Windows/macOS/iOS/Android from a single codebase. XAML-based |
| **Blazor Desktop** | WebView2-based hybrid. HTML/CSS/JS + shared C# logic. Friendly to web developers |
| **XAML** | eXtensible Application Markup Language. The declarative UI definition language for WinUI/WPF/MAUI |
| **Code-behind** | The C# file paired with a XAML file (`MainWindow.xaml.cs`). Handles UI events. Minimized in MVVM |
| **UserControl** | A reusable composite UI component (inherits from `UserControl`) |
| **ContentControl** | A control that hosts a single child content. Rendered via `ContentPresenter` |
| **DataTemplate** | A template that maps a data object to UI. Used in `ItemTemplate`/`ContentTemplate` |
| **ControlTemplate** | Completely redefines a control's visual structure. The "look-less" control philosophy of WPF/WinUI |

---

## 2. Languages & Tools

| Term | Description |
|------|------|
| **C#** | The primary language of the .NET ecosystem. Type-safe, garbage-collected, with built-in async/await |
| **.NET** | Microsoft's cross-platform runtime. Currently .NET 8 LTS (Long-Term Support) |
| **NuGet** | The .NET package manager. `dotnet add package` or the Visual Studio NuGet manager |
| **Visual Studio** | Microsoft's integrated development environment (IDE). Includes designer, debugger, and IntelliSense |
| **Visual Studio Code** | A lightweight code editor. Supports .NET development via the C# Dev Kit extension |
| **dotnet CLI** | `dotnet new/build/run/test/publish` — command-line project management |
| **MSBuild** | The .NET build system. Build configuration via `.csproj` files |
| **Windows App SDK** | The SDK that provides WinUI 3 and the latest Windows features to existing .NET apps |
| **Roslyn** | The .NET compiler platform. Source Generator-based code generation |
| **IL (Intermediate Language)** | .NET bytecode. Converted to native code via JIT (Just-In-Time) compilation |

---

## 3. Architecture Patterns

| Term | Description |
|------|------|
| **MVVM (Model-View-ViewModel)** | The standard WPF/WinUI pattern. View↔ViewModel data binding, ViewModel↔Model separation |
| **Model** | Domain data/business logic. Used by the ViewModel. No UI dependency |
| **View** | XAML UI. Sets the ViewModel as its DataContext. Ideally minimal code-behind |
| **ViewModel** | The intermediary between View and Model. Implements `INotifyPropertyChanged`, uses the Command pattern |
| **INotifyPropertyChanged** | The interface that triggers automatic UI refresh on property change. Calls `OnPropertyChanged()` |
| **ICommand / RelayCommand** | The command pattern that binds UI actions (such as button clicks) to ViewModel methods |
| **ObservableCollection\<T\>** | Automatically refreshes the UI when items are added/removed. Used for collection binding instead of `List<T>` |
| **DI (Dependency Injection)** | Dependency injection. `Microsoft.Extensions.DependencyInjection` + `IServiceProvider` |
| **Repository Pattern** | Abstraction over data access. The ViewModel knows only the Repository interface, not the implementation |
| **CommunityToolkit.Mvvm** | The officially supported MVVM helper library from Microsoft. [ObservableProperty]/[RelayCommand] source generators |

---

## 4. Data & Storage

| Term | Description |
|------|------|
| **Entity Framework Core (EF Core)** | The .NET ORM (Object-Relational Mapper). Query the DB with LINQ, manage migrations |
| **SQLite** | A lightweight local file-based DB. A single `.db` file, no server required. The standard for desktop apps |
| **SQL Server LocalDB** | A lightweight SQL Server for development/testing. Use SQL Server Express or a server edition for production |
| **DbContext** | The session unit of EF Core. Entity sets + change tracking + transactions |
| **DPAPI (Data Protection API)** | An encryption API provided by Windows OS. Based on user/machine keys. `ProtectedData.Protect/Unprotect` |
| **Windows Credential Manager** | A secure store for credentials (tokens/passwords). The `CredWrite/CredRead` Win32 API |
| **IsolatedStorage** | A legacy .NET protected store. Now, direct `%LocalAppData%` access combined with DPAPI is recommended |
| **Settings / AppSettings** | App settings storage. `appsettings.json` (ASP.NET style) or `Properties.Settings` (WinForms/WPF) |
| **Migration** | Managing EF Core DB schema changes. `dotnet ef migrations add` → `dotnet ef database update` |
| **Connection String** | DB connection information. Development: `Data Source=app.db`, encrypted: `Password=...` option |

---

## 5. Async & Threading

| Term | Description |
|------|------|
| **async/await** | The C# asynchronous pattern. Prevents UI thread blocking. `async Task Method()` + `await` call |
| **Task** | The representation of asynchronous work. `Task<T>` has a return value. `Task.Run()` uses the thread pool |
| **Dispatcher** | Access to the WPF/WinUI UI thread. `Dispatcher.InvokeAsync()` / `DispatcherQueue.TryEnqueue()` |
| **CancellationToken** | A cancellation signal for asynchronous work. `CancellationTokenSource.Cancel()` → `OperationCanceledException` |
| **Progress\<T\>** | Background → UI progress reporting. Automatically invokes the callback on the UI thread |
| **SemaphoreSlim** | An async-compatible semaphore. Limits the number of concurrent accesses; an alternative to a mutex |
| **BackgroundWorker** | Legacy WinForms background work. Now `Task`/`async-await` is recommended |
| **IHostedService** | A background service based on the .NET Generic Host. Also applicable to desktop apps |

---

## 6. Distribution & Installation

| Term | Description |
|------|------|
| **MSIX** | The Modern Windows Installer. Sandbox isolation, automatic updates, the Microsoft Store distribution format |
| **Self-contained** | Distribution that includes the .NET runtime. No .NET installation needed on the user's PC. Larger file size |
| **Framework-dependent** | Does not include the .NET runtime. The user must install the .NET runtime separately. Minimal file size |
| **ClickOnce** | Automatic-update distribution based on web/file shares. Simple but feature-limited |
| **WiX Toolset** | A traditional MSI creation tool. Complex installation scenarios, group policy, system-level installation |
| **Microsoft Store** | The official Windows app store. MSIX package submission, automatic updates, payment platform |
| **Side-loading** | MSIX installation outside the Store. Requires developer mode or a trusted certificate |
| **Publish Profile** | A `dotnet publish` configuration file. Specifies options such as target platform/architecture/AOT |
| **Code Signing** | Digitally signing executables/installers. Prevents SmartScreen warnings. An EV certificate is recommended |
| **Squirrel.Windows** | An automatic-update library based on GitHub Releases. Also used for Electron apps |

---

## 7. System Integration

| Term | Description |
|------|------|
| **Registry** | The Windows registry. Startup program registration, file associations, etc. `Microsoft.Win32.Registry` |
| **COM (Component Object Model)** | The Windows component model. Used for Office automation and legacy integration |
| **Win32 API** | The native Windows API. Callable from C# via P/Invoke |
| **P/Invoke** | Platform Invocation Services. The mechanism for calling unmanaged code (Win32 DLLs) |
| **WMI (Windows Management Instrumentation)** | System information queries. Hardware/software/process information |
| **Named Pipe** | Inter-process communication (IPC). Used in single-instance apps to activate the existing instance |
| **File Association** | Associating a file extension with an app. Launch the app by double-clicking |
| **Jump List** | The recent items/quick launch list from right-clicking the taskbar |
| **Thumbnail Toolbar** | Buttons (play/pause, etc.) below the taskbar preview icon |

---

**Document version:** 1.0.0 | **Date:** 2026-06-13 | **Applicable stack:** C# + .NET 8 + WinUI 3 / WPF
