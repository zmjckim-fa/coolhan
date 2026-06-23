# Windows Programs - Basic Logic (Windows Desktop App Basic Logic)

## 1. Characteristics of Windows Programs

A Windows program is an **installable application that runs on the Windows operating system**.

### Key Characteristics
```
- Installed and used by the user
- Can access local resources (files, registry)
- High performance and flexibility
- Can be distributed without review
- Increased maintenance complexity
```

---

## 2. App Architecture Options

### 2.1 WPF (Windows Presentation Foundation)
```
Based on .NET Framework
- UI defined with XAML
- Powerful data binding
- Well-suited to the MVVM pattern
- Supports Windows 7 and later
```

### 2.2 WinForms
```
Based on .NET Framework
- Rapid development
- For simple applications
- Older than the latest technologies
```

### 2.3 UWP (Universal Windows Platform)
```
Windows 10+ only
- Modern UI
- Windows Store distribution
- Restricted permissions (Sandboxed)
```

### 2.4 Electron
```
Based on web technologies (HTML/CSS/JavaScript)
- Cross-platform (Windows/Mac/Linux)
- Rapid development
- Performance overhead
```

---

## 3. Program Lifecycle

### 3.1 Startup Flow
```
1. User runs the exe file
2. Main() function is called
3. Application initialization
4. Main window creation
5. Event loop starts
```

### 3.2 Window Message Loop
```
getMessage() - Wait for a Windows message
    ↓
Message processing (event raised)
    ↓
Screen refresh
    ↓
Repeat...
```

### 3.3 Shutdown Flow
```
1. User clicks the X button
2. OnClosing event
3. Resource cleanup
4. Application exit
```

---

## 4. UI Structure

### 4.1 Window Hierarchy
```
Main Window
├─ Menu Bar
├─ Toolbar
├─ Content Area
│   └─ Panels, Buttons, TextBox, etc.
└─ Status Bar
```

### 4.2 Dialogs
```
Modal Dialog
- Blocks the parent window
- OK/Cancel buttons

Modeless Dialog
- Operates independently
- Multiple can be open
```

### 4.3 Controls
```
Button, TextBox, Label
CheckBox, RadioButton
ListBox, ComboBox
DataGrid
TreeView
```

---

## 5. Data Stores

### 5.1 Windows Registry
```
Purpose: Storing settings
Location: HKEY_CURRENT_USER\Software\[AppName]\
Examples:
- Last opened file
- User settings
- License information
```

### 5.2 Local Files
```
XML, JSON, INI files
- User data
- Settings
- Cache

Locations:
- AppData\Local (per-app)
- AppData\Roaming (synced across multiple PCs)
```

### 5.3 Database
```
SQLite
- No installation required
- Lightweight
- Stores local data

SQL Server Express
- More features
- Requires installation
- For complex applications
```

### 5.4 Cloud/Server
```
Communication via REST API
- Cloud storage
- Synchronization
```

---

## 6. Multithreading

### 6.1 UI Thread
```
Main thread = UI thread
- All UI updates must happen on the main thread only
- If blocked, the UI becomes unresponsive
```

### 6.2 Background Work
```
Asynchronous processing using Task:
1. Run long-running work on a separate thread
2. Update on the UI thread after completion
3. Keep the app responsive to the user

Examples:
- Reading/writing files
- Network requests
- Data processing
```

### 6.3 Async/Await
```
Asynchronous programming pattern
async Task LongRunningOperation()
{
    await Task.Delay(1000);
    // UI update
}
```

---

## 7. File System

### 7.1 File Paths
```
Program install path: Program Files
- C:\Program Files\[AppName]\

User data:
- C:\Users\[Username]\AppData\Local\[AppName]\
- C:\Users\[Username]\AppData\Roaming\[AppName]\

Common folders:
- Documents, Downloads, Desktop
```

### 7.2 File I/O
```
C# File/StreamReader/StreamWriter
- Reading files
- Writing files
- Stream processing

Permission checks:
- Verify that write permission exists
- Check whether the file exists
```

---

## 8. Registry

### 8.1 Registry Structure
```
HKEY_CURRENT_USER
├─ Software
│  └─ [Company]
│     └─ [AppName]
│        ├─ Setting1
│        ├─ Setting2
│        └─ ...
```

### 8.2 Using the Registry
```
Read: Registry.GetValue()
Write: Registry.SetValue()

Notes:
- Registry writes are slow
- Should not be written frequently
- Use only as a settings store
```

---

## 9. Installer

### 9.1 MSI (Microsoft Installer)
```
Standard Windows installation format
- Supports automatic uninstall
- Version management
- File integrity verification
```

### 9.2 Installation Process
```
1. Select install path
2. Create shortcuts
3. Copy files
4. Configure registry
5. Register service (if needed)
```

### 9.3 Automatic Updates
```
From within the program:
1. Check for a new version
2. Download
3. Back up
4. Install
5. Restart
```

---

## 10. Security

### 10.1 Administrator Privileges
```
Declared in the manifest file:
- requireAdministrator (always administrator)
- asInvoker (normal user)

When administrator privileges are required:
- Modifying system files
- Installing services
```

### 10.2 Code Signing
```
Digitally sign the program
- Verify the publisher
- Guarantee file integrity
- Increase user trust
```

### 10.3 Data Security
```
Encrypt sensitive information:
- Data Protection API (DPAPI)
- Never store passwords in plaintext
```

---

## 11. Performance Optimization

### 11.1 Loading Time
```
- Lazy loading (load only when needed)
- Initialize in the background
- Display a splash screen
```

### 11.2 Memory Management
```
- Process large images as streams
- Release unused resources
- Use WeakReference
```

### 11.3 Responsiveness
```
- Never block the main thread
- Asynchronous work using Task
- Show progress (progress bar)
```

---

## 12. Distribution Methods

### 12.1 MSI Installer
```
Pros:
- Standard installation process
- Supports automatic uninstall
- Version management

Cons:
- Complex to develop
- Large file size
```

### 12.2 Portable Version (EXE)
```
Pros:
- No installation required
- Fast
- Usable on multiple PCs

Cons:
- Managing user settings is complex
- Shortcuts are not created
```

### 12.3 Cloud/App Store
```
Microsoft Store
- Automatic updates
- User trust
```

---

## 13. Error Handling and Logging

### 13.1 Exception Handling
```
try-catch blocks
- Handle predictable errors
- Clear messages to the user

Unhandled Exception Handler
- Handle unpredictable errors
- Generate crash reports
```

### 13.2 Logging
```
File-based logging:
- Debugging information
- Error logs
- Usage patterns

Location:
- AppData\Local\[AppName]\Logs\
```

---

## 14. Version Management

### 14.1 Program Version
```
AssemblyVersion: internal version
FileVersion: shown in file properties
ProductVersion: version visible to users

Format: Major.Minor.Build.Revision
Example: 1.0.0.0
```

### 14.2 Compatibility
```
Migrating settings from previous versions
- Registry structure changes
- Convert when file formats change
- Rollback support
```

---

## 15. User Experience (UX)

### 15.1 Saving Settings
```
Save the last state:
- Window size/position
- Opened documents
- User preferences
```

### 15.2 Progress Indication
```
For long-running operations:
- Progress Bar
- Status messages
- Cancel button
```

### 15.3 Help
```
- Online help (CHM)
- In-app tips
- Mouse-over Tooltip
```

---

## 16. Key Frameworks

```
UI:
- WPF (recommended)
- WinForms (legacy)

Data:
- Entity Framework Core
- Dapper
- SQLite

Networking:
- HttpClient
- WCF (legacy)

Logging:
- Serilog
- NLog

Dependency Injection:
- Microsoft.Extensions.DependencyInjection

Testing:
- xUnit
- Moq
```

---

## 17. Documents to Read Next

1. **core_features.md** - Common features of Windows apps
2. **architecture.md** - MVVM, MVP patterns
3. **installer_guide.md** - Installer configuration
4. **api_standard.md** - Networking standards
5. **spec_template.md** - Windows app specification template
