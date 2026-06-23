# Tech Parameter to Knowledge Base Mapping

> **Purpose**: After defining tech parameters, automatically recommend the base knowledge library needed for the project.

---

## Base Knowledge Recommendation by Parameter

### Horizontal axis: Deliverable Type (P1)
### Vertical axis: Programming Language (P2)

---

## 1. Web Projects (Web)

### 1-A. JavaScript/TypeScript + Node.js

```
Required base knowledge:
✓ 07_web_standard.md          (web standard)
✓ 08_frontend_standard.md      (frontend)
✓ 09_backend_nodejs.md         (Node.js backend)
✓ 10_database_standard.md      (database)
✓ 11_api_standard.md           (API standard)
✓ 12_security_standard.md      (security)

Optional base knowledge (by DB):
┌─ Using MySQL → 13_mysql_best_practices.md
├─ Using PostgreSQL → 14_postgresql_best_practices.md
├─ Using MongoDB → 15_mongodb_best_practices.md
└─ Using Firebase → 16_firebase_best_practices.md

Optional base knowledge (by deployment):
┌─ AWS deployment → 17_aws_deployment.md
├─ Azure deployment → 18_azure_deployment.md
├─ Heroku deployment → 19_heroku_deployment.md
└─ On-premises → 20_onprem_deployment.md

Domain modules (selected per project):
✓ 01_member_system.md         (member management)
┌─ 02_shopping_mall.md         (shopping mall)
├─ 03_purchase_agency.md       (purchase agency)
├─ 04_admin_system.md          (admin)
├─ 05_payment.md               (payment)
├─ 06_shipping_logistics.md    (shipping)
└─ ... other domains

Recommended project structure:
/project
├─ /backend (Node.js + Express/NestJS)
├─ /frontend (React/Vue/Angular)
├─ /database (MySQL/PostgreSQL/MongoDB)
└─ /docs (specifications)
```

**Recommended language stack:**
```javascript
// Frontend
- React 18 + TypeScript
- Next.js (full-stack)

// Backend
- Node.js + Express
- NestJS (large-scale)

// DB
- PostgreSQL (recommended) or MySQL

// Deployment
- Docker + Kubernetes
- AWS ECS or Heroku
```

---

### 1-B. Python + Django/FastAPI

```
Required base knowledge:
✓ 07_web_standard.md          (web standard)
✓ 08_frontend_standard.md      (frontend)
✓ 09_backend_python.md         (Python backend)
✓ 10_database_standard.md      (database)
✓ 11_api_standard.md           (API standard)
✓ 12_security_standard.md      (security)

Framework choice:
┌─ Django → 21_django_best_practices.md
│           22_django_orm.md
│           23_django_rest_framework.md
└─ FastAPI → 24_fastapi_best_practices.md
             25_async_python.md

Optional base knowledge (by DB):
┌─ PostgreSQL → 14_postgresql_best_practices.md
├─ MySQL → 13_mysql_best_practices.md
└─ MongoDB → 15_mongodb_best_practices.md

Domain modules (selected per project):
✓ 01_member_system.md

Recommended project structure:
/project
├─ /backend (Django/FastAPI)
├─ /frontend (React/Vue)
├─ /database (PostgreSQL/MySQL)
└─ /docs
```

**Recommended language stack:**
```python
# Framework
- Django 4.x + Django REST Framework
- or FastAPI + Uvicorn

# ORM
- Django ORM or SQLAlchemy

# DB
- PostgreSQL (recommended)

# Deployment
- Docker + AWS RDS
- Gunicorn + Nginx
```

---

### 1-C. Java + Spring Boot

```
Required base knowledge:
✓ 07_web_standard.md          (web standard)
✓ 08_frontend_standard.md      (frontend)
✓ 09_backend_java.md           (Java backend)
✓ 10_database_standard.md      (database)
✓ 11_api_standard.md           (API standard)
✓ 12_security_standard.md      (security)

Spring stack:
✓ 26_spring_boot_best_practices.md
✓ 27_jpa_hibernate.md
✓ 28_spring_security.md

Recommended project structure:
/project
├─ /backend (Spring Boot)
├─ /frontend (React/Angular)
├─ /database (MySQL/PostgreSQL)
└─ /docs
```

**Recommended language stack:**
```java
// Framework
- Spring Boot 3.x
- Spring Data JPA
- Spring Security

// DB
- PostgreSQL or MySQL
- Hibernate ORM

// Build
- Maven or Gradle

// Deployment
- Docker
- AWS ECS or on-premises
```

---

### 1-D. Go (Golang)

```
Required base knowledge:
✓ 07_web_standard.md          (web standard)
✓ 08_frontend_standard.md      (frontend)
✓ 09_backend_go.md             (Go backend)
✓ 10_database_standard.md      (database)
✓ 11_api_standard.md           (API standard)
✓ 12_security_standard.md      (security)

Go frameworks:
✓ 29_gin_best_practices.md     (Gin web framework)
✓ 30_go_concurrent.md          (concurrency)

Recommended project structure:
/project
├─ /cmd (main application)
├─ /internal (internal packages)
├─ /api (API definitions)
├─ /frontend (React/Vue)
└─ /docs
```

**Recommended language stack:**
```go
// Framework
- Gin (web framework)
- GORM (ORM)

// DB
- PostgreSQL (recommended)
- MySQL

// Deployment
- Docker
- Kubernetes (high availability)

// Characteristics
- High performance
- Strong concurrency
- Small binaries
```

---

### 1-E. C# + .NET Core / ASP.NET Core

```
Required base knowledge:
✓ 07_web_standard.md          (web standard)
✓ 08_frontend_standard.md      (frontend)
✓ 09_backend_csharp.md         (C# backend)
✓ 10_database_standard.md      (database)
✓ 11_api_standard.md           (API standard)
✓ 12_security_standard.md      (security)

.NET stack:
✓ 31_aspnetcore_best_practices.md
✓ 32_entity_framework.md
✓ 33_azure_integration.md

Recommended project structure:
/project
├─ /Backend (ASP.NET Core)
├─ /Frontend (React/Angular)
├─ /Database (SQL Server/MySQL)
└─ /Docs
```

**Recommended language stack:**
```csharp
// Framework
- ASP.NET Core 8
- Entity Framework Core

// DB
- SQL Server or PostgreSQL
- MySQL

// Deployment
- Docker
- Azure App Service
- AWS

// Characteristics
- Microsoft ecosystem
- LINQ queries
- Strongly typed language
```

---

## 2. Desktop Projects (Desktop)

### 2-A. C# + WinForms / WPF

```
Required base knowledge:
✓ 34_desktop_standard.md       (desktop standard)
✓ 35_windows_standard.md       (Windows standard)
✓ 36_csharp_desktop.md         (C# desktop)
✓ 37_database_desktop.md       (local DB)
✓ 12_security_standard.md      (security)

UI frameworks:
┌─ WinForms → 38_winforms_best_practices.md (simple)
└─ WPF → 39_wpf_best_practices.md (advanced)

Optional base knowledge (by DB):
┌─ SQL Server → 40_sqlserver_local.md
├─ SQLite → 41_sqlite_desktop.md
└─ PostgreSQL → 14_postgresql_best_practices.md

Recommended project structure:
/project
├─ /UI (WinForms/WPF)
├─ /Business (logic)
├─ /Data (DB access)
└─ /Installers (installer programs)
```

**Recommended language stack:**
```csharp
// UI
- WPF (recommended) or WinForms

// DB
- SQLite (single file)
- SQL Server Express (local)

// Deployment
- .exe installer (NSIS, Advanced Installer)
- Windows only

// Characteristics
- Native performance
- Conforms to Windows UI standards
```

---

### 2-B. Python + PyQt / Tkinter

```
Required base knowledge:
✓ 34_desktop_standard.md       (desktop standard)
✓ 36_python_desktop.md         (Python desktop)
✓ 37_database_desktop.md       (local DB)
✓ 12_security_standard.md      (security)

UI frameworks:
┌─ PyQt → 42_pyqt_best_practices.md (powerful)
├─ PySimpleGUI → 43_pysimplegui.md (simple)
└─ Tkinter → 44_tkinter.md (basic)

Optional base knowledge (cross-platform):
✓ 45_cross_platform_desktop.md

Recommended project structure:
/project
├─ /ui (UI modules)
├─ /business (business logic)
├─ /data (DB access)
└─ /exe (executable)
```

**Recommended language stack:**
```python
# UI
- PyQt6 (recommended) or PySimpleGUI

# DB
- SQLite

# Deployment
- PyInstaller (exe conversion)
- Cross-platform support

# Characteristics
- Fast development
- Cross-platform (Windows, Mac, Linux)
```

---

### 2-C. Electron (JavaScript)

```
Required base knowledge:
✓ 34_desktop_standard.md       (desktop standard)
✓ 46_electron_best_practices.md (Electron)
✓ 37_database_desktop.md       (local DB)
✓ 12_security_standard.md      (security)

Optional base knowledge (UI framework):
┌─ React → 47_electron_react.md
├─ Vue → 48_electron_vue.md
└─ Vanilla JS → 49_electron_vanilla.md

Recommended project structure:
/project
├─ /src/main (main process)
├─ /src/renderer (UI process)
├─ /public (static assets)
└─ /dist (build output)
```

**Recommended language stack:**
```javascript
// Framework
- Electron + React
- TypeScript

// DB
- SQLite (local)
- Nedb (simple)

// Deployment
- electron-builder (.exe, .dmg, .deb)
- Cross-platform (Windows, Mac, Linux)

// Characteristics
- Build desktop apps with web technology
- Cross-platform (VS Code, Discord, Slack)
```

---

## 3. Mobile Projects (Mobile)

### 3-A. React Native (JavaScript)

```
Required base knowledge:
✓ 50_mobile_standard.md        (mobile standard)
✓ 51_react_native_best_practices.md
✓ 52_mobile_database.md        (local storage)
✓ 12_security_standard.md      (security)

Backend connection:
✓ 11_api_standard.md           (API standard)

Recommended project structure:
/project
├─ /app (React Native)
├─ /backend (API server - Node.js/Python)
└─ /docs
```

**Recommended language stack:**
```javascript
// Framework
- React Native + Expo (quick start)
- or React Native CLI (more control)

// State management
- Redux or Zustand

// Storage
- AsyncStorage (local)
- SQLite (complex data)

// Deployment
- Apple App Store
- Google Play Store
- Expo EAS

// Characteristics
- Simultaneous iOS + Android development
- Single JavaScript language
- 50% code sharing
```

---

### 3-B. Flutter (Dart)

```
Required base knowledge:
✓ 50_mobile_standard.md        (mobile standard)
✓ 53_flutter_best_practices.md
✓ 52_mobile_database.md        (local storage)
✓ 12_security_standard.md      (security)

Backend connection:
✓ 11_api_standard.md           (API standard)

Recommended project structure:
/project
├─ /lib (Flutter app)
├─ /api_client (API client)
├─ /models (data models)
└─ /docs
```

**Recommended language stack:**
```dart
// Framework
- Flutter 3.x
- Dart

// State management
- Provider, Riverpod, BLoC

// Storage
- Hive (local DB)
- SQLite

// Deployment
- Apple App Store
- Google Play Store

// Characteristics
- Simultaneous iOS + Android + Web development
- High performance (close to native)
- Beautiful UI (Material, Cupertino)
```

---

### 3-C. Swift (iOS only)

```
Required base knowledge:
✓ 50_mobile_standard.md        (mobile standard)
✓ 54_ios_standard.md           (iOS standard)
✓ 55_swift_best_practices.md
✓ 52_mobile_database.md        (local storage)
✓ 12_security_standard.md      (security)

Backend connection:
✓ 11_api_standard.md           (API standard)

Recommended project structure:
/project
├─ /App (Swift)
├─ /Models (data models)
├─ /ViewModels (business logic)
└─ /Services (API, storage)
```

**Recommended language stack:**
```swift
// Framework
- SwiftUI (recommended) or UIKit
- iOS 14+

// Architecture
- MVVM (recommended for SwiftUI)
- MVC (UIKit)

// Storage
- Core Data or Realm

// Deployment
- Apple App Store

// Characteristics
- Optimized for iOS only
- High performance
- Apple technology integration (Face ID, HealthKit, etc.)
```

---

### 3-D. Kotlin (Android only)

```
Required base knowledge:
✓ 50_mobile_standard.md        (mobile standard)
✓ 56_android_standard.md       (Android standard)
✓ 57_kotlin_best_practices.md
✓ 52_mobile_database.md        (local storage)
✓ 12_security_standard.md      (security)

Backend connection:
✓ 11_api_standard.md           (API standard)

Recommended project structure:
/project
├─ /app (Android/Kotlin)
├─ /data (data layer)
├─ /domain (business logic)
└─ /presentation (UI)
```

**Recommended language stack:**
```kotlin
// Framework
- Android 14+
- Jetpack Compose (new UI)

// Architecture
- MVVM (Clean Architecture)

// Storage
- Room (SQLite wrapper)
- DataStore

// Deployment
- Google Play Store

// Characteristics
- Optimized for Android only
- High performance
- Kotlin modern language
```

---

## 4. Hardware/Embedded Projects (Hardware/Embedded)

### 4-A. C/C++

```
Required base knowledge:
✓ 58_embedded_standard.md      (embedded standard)
✓ 59_c_cpp_firmware.md         (C/C++ firmware)
✓ 60_memory_management.md      (memory management)
✓ 12_security_standard.md      (security)

Optional base knowledge (by platform):
┌─ ARM → 61_arm_architecture.md
├─ STM32 → 62_stm32_development.md
├─ Arduino → 63_arduino_c.md
└─ RISC-V → 64_riscv_development.md

Recommended project structure:
/project
├─ /src (source code)
├─ /include (header files)
├─ /drivers (device drivers)
├─ /bootloader (boot code)
└─ /linker (linker scripts)
```

**Recommended language stack:**
```c
// Compiler
- GCC (ARM Embedded)
- Clang

// Build system
- CMake or Makefile

// Debugging
- GDB, OpenOCD

// Deployment
- .hex or .bin firmware files

// Characteristics
- Extreme optimization possible
- Memory-constrained environment
- Real-time control
```

---

### 4-B. Rust

```
Required base knowledge:
✓ 58_embedded_standard.md      (embedded standard)
✓ 65_rust_embedded.md          (Rust embedded)
✓ 60_memory_management.md      (memory safety)
✓ 12_security_standard.md      (security)

Optional base knowledge (platform):
┌─ ARM Cortex → 66_rust_cortex.md
├─ RISC-V → 67_rust_riscv.md
└─ ESP32 → 68_rust_esp32.md

Recommended project structure:
/project
├─ /src (Rust code)
├─ /examples (examples)
└─ /target (build output)
```

**Recommended language stack:**
```rust
// Tools
- Cargo (build system)
- rust-analyzer

// Libraries
- embedded-hal (abstraction)
- rtic (real-time control)

// Deployment
- .elf, .hex, .bin

// Characteristics
- Memory safety
- High performance
- No runtime overhead
```

---

### 4-C. Python (MicroPython)

```
Required base knowledge:
✓ 58_embedded_standard.md      (embedded standard)
✓ 69_micropython.md            (MicroPython)
✓ 70_iot_devices.md            (IoT devices)

Optional base knowledge (platform):
┌─ Raspberry Pi → 71_raspberry_pi.md
├─ ESP32 → 72_esp32_python.md
└─ Arduino → 73_arduino_python.md

Recommended project structure:
/project
├─ /main.py (main code)
├─ /lib (libraries)
└─ /config (configuration)
```

**Recommended language stack:**
```python
# Implementation
- MicroPython or CircuitPython

# Deployment
- Upload .py files directly

# Characteristics
- Fast development
- Small memory footprint
- Strong for prototyping
```

---

## Mapping Table (Quick Reference)

| Deliverable | Language | Recommended DB | Deployment | Base Knowledge |
|-------------|----------|----------------|------------|----------------|
| **Web** | Node.js | PostgreSQL | Docker + AWS | 07,08,09,10,11,12 |
| | Python | PostgreSQL | Docker + AWS | 07,08,09,10,11,12 |
| | Java | PostgreSQL | Docker + K8s | 07,08,09,10,11,12 |
| | Go | PostgreSQL | Docker + K8s | 07,08,09,10,11,12 |
| **Desktop** | C# (WPF) | SQLite | .exe | 34,35,36,37,12 |
| | Python | SQLite | .exe | 34,36,37,12 |
| | Electron | SQLite | .exe/.dmg/.deb | 34,46,37,12 |
| **Mobile** | React Native | SQLite | App Store/Play | 50,51,52,12 |
| | Flutter | Hive/SQLite | App Store/Play | 50,53,52,12 |
| | Swift | Core Data | App Store | 50,54,55,52,12 |
| | Kotlin | Room | Play Store | 50,56,57,52,12 |
| **Embedded** | C/C++ | None | .hex/.bin | 58,59,60,12 |
| | Rust | None | .elf | 58,65,60,12 |
| | Python | None | .py | 58,69,70,12 |

---

## How to Use

1. Complete **00_TECH_PARAMETER_DEFINITION.md**
   - Define the 5 parameters

2. Review **this document (00_TECH_PARAMETER_MAPPING.md)**
   - Find the base knowledge that matches your parameter combination
   - Confirm required knowledge + optional knowledge

3. **Prepare the base knowledge folder**
   - Confirm the recommended base knowledge files exist in `/knowledge_base/`
   - Create them if missing

4. **Proceed to Step 1**
   - Begin requirements input

---

## Examples

### Example 1: Shopping Mall Website

```
Parameters:
P1: Web domain
P2: JavaScript/TypeScript + Node.js
P3: PostgreSQL
P4: AWS
P5: Internet required + multi-device

Recommended base knowledge:
✓ 07_web_standard.md
✓ 08_frontend_standard.md
✓ 09_backend_nodejs.md
✓ 10_database_standard.md
✓ 11_api_standard.md
✓ 12_security_standard.md
✓ 14_postgresql_best_practices.md
✓ 17_aws_deployment.md
✓ 01_member_system.md
✓ 02_shopping_mall.md
✓ 05_payment.md
```

### Example 2: Windows Accounting Software

```
Parameters:
P1: Desktop PC
P2: C# + WPF
P3: SQL Server
P4: Local installation
P5: Full offline support

Recommended base knowledge:
✓ 34_desktop_standard.md
✓ 35_windows_standard.md
✓ 36_csharp_desktop.md
✓ 37_database_desktop.md
✓ 12_security_standard.md
✓ 39_wpf_best_practices.md
✓ 40_sqlserver_local.md
✓ 04_admin_system.md
```

### Example 3: iOS Shipment Tracking App

```
Parameters:
P1: Mobile app (iOS)
P2: Swift
P3: Core Data + backend API
P4: Apple App Store
P5: Hybrid (online/offline)

Recommended base knowledge:
✓ 50_mobile_standard.md
✓ 54_ios_standard.md
✓ 55_swift_best_practices.md
✓ 52_mobile_database.md
✓ 12_security_standard.md
✓ 11_api_standard.md (backend API)
✓ 06_shipping_logistics.md
```

---

Next step: **After completing the parameters, check the recommended base knowledge and begin Step 1 (requirements input).**
