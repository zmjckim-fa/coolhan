# 기술 파라미터-기본지식 매핑 (Tech Parameter to Knowledge Base Mapping)

> **목적**: 기술 파라미터 정의 후, 프로젝트에 필요한 기본 지식 라이브러리를 자동으로 추천합니다.

---

## 파라미터별 기본 지식 추천

### 가로축: 결과물 유형 (P1)
### 세로축: 개발 언어 (P2)

---

## 1. 웹 프로젝트 (Web)

### 1-A. JavaScript/TypeScript + Node.js

```
필수 기본 지식:
✓ 07_web_standard.md          (웹 표준)
✓ 08_frontend_standard.md      (프론트엔드)
✓ 09_backend_nodejs.md         (Node.js 백엔드)
✓ 10_database_standard.md      (데이터베이스)
✓ 11_api_standard.md           (API 표준)
✓ 12_security_standard.md      (보안)

선택 기본 지식 (DB에 따라):
┌─ MySQL 사용 → 13_mysql_best_practices.md
├─ PostgreSQL 사용 → 14_postgresql_best_practices.md
├─ MongoDB 사용 → 15_mongodb_best_practices.md
└─ Firebase 사용 → 16_firebase_best_practices.md

선택 기본 지식 (배포에 따라):
┌─ AWS 배포 → 17_aws_deployment.md
├─ Azure 배포 → 18_azure_deployment.md
├─ Heroku 배포 → 19_heroku_deployment.md
└─ 온프레미스 → 20_onprem_deployment.md

도메인 모듈 (프로젝트에 따라 선택):
✓ 01_member_system.md         (회원 관리)
┌─ 02_shopping_mall.md         (쇼핑몰)
├─ 03_purchase_agency.md       (구매대행)
├─ 04_admin_system.md          (관리자)
├─ 05_payment.md               (결제)
├─ 06_shipping_logistics.md    (배송)
└─ ... 기타 도메인

권장 프로젝트 구조:
/project
├─ /backend (Node.js + Express/NestJS)
├─ /frontend (React/Vue/Angular)
├─ /database (MySQL/PostgreSQL/MongoDB)
└─ /docs (기획서)
```

**추천 언어 스택:**
```javascript
// 프론트엔드
- React 18 + TypeScript
- Next.js (풀스택)

// 백엔드
- Node.js + Express
- NestJS (대규모)

// DB
- PostgreSQL (권장) 또는 MySQL

// 배포
- Docker + Kubernetes
- AWS ECS 또는 Heroku
```

---

### 1-B. Python + Django/FastAPI

```
필수 기본 지식:
✓ 07_web_standard.md          (웹 표준)
✓ 08_frontend_standard.md      (프론트엔드)
✓ 09_backend_python.md         (Python 백엔드)
✓ 10_database_standard.md      (데이터베이스)
✓ 11_api_standard.md           (API 표준)
✓ 12_security_standard.md      (보안)

프레임워크 선택:
┌─ Django → 21_django_best_practices.md
│           22_django_orm.md
│           23_django_rest_framework.md
└─ FastAPI → 24_fastapi_best_practices.md
             25_async_python.md

선택 기본 지식 (DB에 따라):
┌─ PostgreSQL → 14_postgresql_best_practices.md
├─ MySQL → 13_mysql_best_practices.md
└─ MongoDB → 15_mongodb_best_practices.md

도메인 모듈 (프로젝트에 따라 선택):
✓ 01_member_system.md

권장 프로젝트 구조:
/project
├─ /backend (Django/FastAPI)
├─ /frontend (React/Vue)
├─ /database (PostgreSQL/MySQL)
└─ /docs
```

**추천 언어 스택:**
```python
# 프레임워크
- Django 4.x + Django REST Framework
- 또는 FastAPI + Uvicorn

# ORM
- Django ORM 또는 SQLAlchemy

# DB
- PostgreSQL (권장)

# 배포
- Docker + AWS RDS
- Gunicorn + Nginx
```

---

### 1-C. Java + Spring Boot

```
필수 기본 지식:
✓ 07_web_standard.md          (웹 표준)
✓ 08_frontend_standard.md      (프론트엔드)
✓ 09_backend_java.md           (Java 백엔드)
✓ 10_database_standard.md      (데이터베이스)
✓ 11_api_standard.md           (API 표준)
✓ 12_security_standard.md      (보안)

Spring 스택:
✓ 26_spring_boot_best_practices.md
✓ 27_jpa_hibernate.md
✓ 28_spring_security.md

권장 프로젝트 구조:
/project
├─ /backend (Spring Boot)
├─ /frontend (React/Angular)
├─ /database (MySQL/PostgreSQL)
└─ /docs
```

**추천 언어 스택:**
```java
// 프레임워크
- Spring Boot 3.x
- Spring Data JPA
- Spring Security

// DB
- PostgreSQL 또는 MySQL
- Hibernate ORM

// 빌드
- Maven 또는 Gradle

// 배포
- Docker
- AWS ECS 또는 온프레미스
```

---

### 1-D. Go (Golang)

```
필수 기본 지식:
✓ 07_web_standard.md          (웹 표준)
✓ 08_frontend_standard.md      (프론트엔드)
✓ 09_backend_go.md             (Go 백엔드)
✓ 10_database_standard.md      (데이터베이스)
✓ 11_api_standard.md           (API 표준)
✓ 12_security_standard.md      (보안)

Go 프레임워크:
✓ 29_gin_best_practices.md     (Gin 웹 프레임워크)
✓ 30_go_concurrent.md          (동시성)

권장 프로젝트 구조:
/project
├─ /cmd (메인 애플리케이션)
├─ /internal (내부 패키지)
├─ /api (API 정의)
├─ /frontend (React/Vue)
└─ /docs
```

**추천 언어 스택:**
```go
// 프레임워크
- Gin (웹프레임워크)
- GORM (ORM)

// DB
- PostgreSQL (권장)
- MySQL

// 배포
- Docker
- Kubernetes (고가용성)

// 특징
- 높은 성능
- 동시성 강점
- 작은 바이너리
```

---

### 1-E. C# + .NET Core / ASP.NET Core

```
필수 기본 지식:
✓ 07_web_standard.md          (웹 표준)
✓ 08_frontend_standard.md      (프론트엔드)
✓ 09_backend_csharp.md         (C# 백엔드)
✓ 10_database_standard.md      (데이터베이스)
✓ 11_api_standard.md           (API 표준)
✓ 12_security_standard.md      (보안)

.NET 스택:
✓ 31_aspnetcore_best_practices.md
✓ 32_entity_framework.md
✓ 33_azure_integration.md

권장 프로젝트 구조:
/project
├─ /Backend (ASP.NET Core)
├─ /Frontend (React/Angular)
├─ /Database (SQL Server/MySQL)
└─ /Docs
```

**추천 언어 스택:**
```csharp
// 프레임워크
- ASP.NET Core 8
- Entity Framework Core

// DB
- SQL Server 또는 PostgreSQL
- MySQL

// 배포
- Docker
- Azure App Service
- AWS

// 특징
- Microsoft 생태계
- LINQ 쿼리
- 강타입 언어
```

---

## 2. 데스크톱 프로젝트 (Desktop)

### 2-A. C# + WinForms / WPF

```
필수 기본 지식:
✓ 34_desktop_standard.md       (데스크톱 표준)
✓ 35_windows_standard.md       (Windows 표준)
✓ 36_csharp_desktop.md         (C# 데스크톱)
✓ 37_database_desktop.md       (로컬 DB)
✓ 12_security_standard.md      (보안)

UI 프레임워크:
┌─ WinForms → 38_winforms_best_practices.md (간단함)
└─ WPF → 39_wpf_best_practices.md (고급)

선택 기본 지식 (DB에 따라):
┌─ SQL Server → 40_sqlserver_local.md
├─ SQLite → 41_sqlite_desktop.md
└─ PostgreSQL → 14_postgresql_best_practices.md

권장 프로젝트 구조:
/project
├─ /UI (WinForms/WPF)
├─ /Business (로직)
├─ /Data (DB 접근)
└─ /Installers (설치 프로그램)
```

**추천 언어 스택:**
```csharp
// UI
- WPF (권장) 또는 WinForms

// DB
- SQLite (단일 파일)
- SQL Server Express (로컬)

// 배포
- .exe 설치 파일 (NSIS, Advanced Installer)
- Windows 전용

// 특징
- 네이티브 성능
- Windows UI 표준 준수
```

---

### 2-B. Python + PyQt / Tkinter

```
필수 기본 지식:
✓ 34_desktop_standard.md       (데스크톱 표준)
✓ 36_python_desktop.md         (Python 데스크톱)
✓ 37_database_desktop.md       (로컬 DB)
✓ 12_security_standard.md      (보안)

UI 프레임워크:
┌─ PyQt → 42_pyqt_best_practices.md (강력)
├─ PySimpleGUI → 43_pysimplegui.md (간단)
└─ Tkinter → 44_tkinter.md (기본)

선택 기본 지식 (크로스플랫폼):
✓ 45_cross_platform_desktop.md

권장 프로젝트 구조:
/project
├─ /ui (UI 모듈)
├─ /business (비즈니스 로직)
├─ /data (DB 접근)
└─ /exe (실행 파일)
```

**추천 언어 스택:**
```python
# UI
- PyQt6 (권장) 또는 PySimpleGUI

# DB
- SQLite

# 배포
- PyInstaller (exe 변환)
- Cross-platform 지원

# 특징
- 빠른 개발
- 크로스플랫폼 (Windows, Mac, Linux)
```

---

### 2-C. Electron (JavaScript)

```
필수 기본 지식:
✓ 34_desktop_standard.md       (데스크톱 표준)
✓ 46_electron_best_practices.md (Electron)
✓ 37_database_desktop.md       (로컬 DB)
✓ 12_security_standard.md      (보안)

선택 기본 지식 (UI 프레임워크):
┌─ React → 47_electron_react.md
├─ Vue → 48_electron_vue.md
└─ Vanilla JS → 49_electron_vanilla.md

권장 프로젝트 구조:
/project
├─ /src/main (메인 프로세스)
├─ /src/renderer (UI 프로세스)
├─ /public (정적 자산)
└─ /dist (빌드 결과물)
```

**추천 언어 스택:**
```javascript
// 프레임워크
- Electron + React
- TypeScript

// DB
- SQLite (로컬)
- Nedb (간단)

// 배포
- electron-builder (.exe, .dmg, .deb)
- 크로스플랫폼 (Windows, Mac, Linux)

// 특징
- 웹 기술로 데스크톱 앱 개발
- 크로스플랫폼 (VS Code, Discord, Slack)
```

---

## 3. 모바일 프로젝트 (Mobile)

### 3-A. React Native (JavaScript)

```
필수 기본 지식:
✓ 50_mobile_standard.md        (모바일 표준)
✓ 51_react_native_best_practices.md
✓ 52_mobile_database.md        (로컬 저장소)
✓ 12_security_standard.md      (보안)

백엔드 연결:
✓ 11_api_standard.md           (API 표준)

권장 프로젝트 구조:
/project
├─ /app (React Native)
├─ /backend (API 서버 - Node.js/Python)
└─ /docs
```

**추천 언어 스택:**
```javascript
// 프레임워크
- React Native + Expo (빠른 시작)
- 또는 React Native CLI (더 많은 제어)

// 상태관리
- Redux 또는 Zustand

// 저장소
- AsyncStorage (로컬)
- SQLite (복잡한 데이터)

// 배포
- Apple App Store
- Google Play Store
- Expo EAS

// 특징
- iOS + Android 동시 개발
- JavaScript 단일 언어
- 50% 코드 공유
```

---

### 3-B. Flutter (Dart)

```
필수 기본 지식:
✓ 50_mobile_standard.md        (모바일 표준)
✓ 53_flutter_best_practices.md
✓ 52_mobile_database.md        (로컬 저장소)
✓ 12_security_standard.md      (보안)

백엔드 연결:
✓ 11_api_standard.md           (API 표준)

권장 프로젝트 구조:
/project
├─ /lib (Flutter 앱)
├─ /api_client (API 클라이언트)
├─ /models (데이터 모델)
└─ /docs
```

**추천 언어 스택:**
```dart
// 프레임워크
- Flutter 3.x
- Dart

// 상태관리
- Provider, Riverpod, BLoC

// 저장소
- Hive (로컬 DB)
- SQLite

// 배포
- Apple App Store
- Google Play Store

// 특징
- iOS + Android + Web 동시 개발
- 높은 성능 (네이티브에 가까움)
- 아름다운 UI (Material, Cupertino)
```

---

### 3-C. Swift (iOS 전용)

```
필수 기본 지식:
✓ 50_mobile_standard.md        (모바일 표준)
✓ 54_ios_standard.md           (iOS 표준)
✓ 55_swift_best_practices.md
✓ 52_mobile_database.md        (로컬 저장소)
✓ 12_security_standard.md      (보안)

백엔드 연결:
✓ 11_api_standard.md           (API 표준)

권장 프로젝트 구조:
/project
├─ /App (Swift)
├─ /Models (데이터 모델)
├─ /ViewModels (비즈니스 로직)
└─ /Services (API, 저장소)
```

**추천 언어 스택:**
```swift
// 프레임워크
- SwiftUI (권장) 또는 UIKit
- iOS 14+

// 아키텍처
- MVVM (SwiftUI 권장)
- MVC (UIKit)

// 저장소
- Core Data 또는 Realm

// 배포
- Apple App Store

// 특징
- iOS 전용 최적화
- 높은 성능
- Apple 기술 통합 (Face ID, HealthKit 등)
```

---

### 3-D. Kotlin (Android 전용)

```
필수 기본 지식:
✓ 50_mobile_standard.md        (모바일 표준)
✓ 56_android_standard.md       (Android 표준)
✓ 57_kotlin_best_practices.md
✓ 52_mobile_database.md        (로컬 저장소)
✓ 12_security_standard.md      (보안)

백엔드 연결:
✓ 11_api_standard.md           (API 표준)

권장 프로젝트 구조:
/project
├─ /app (Android/Kotlin)
├─ /data (데이터 계층)
├─ /domain (비즈니스 로직)
└─ /presentation (UI)
```

**추천 언어 스택:**
```kotlin
// 프레임워크
- Android 14+
- Jetpack Compose (새로운 UI)

// 아키텍처
- MVVM (Clean Architecture)

// 저장소
- Room (SQLite 래퍼)
- DataStore

// 배포
- Google Play Store

// 특징
- Android 전용 최적화
- 높은 성능
- Kotlin 모던 언어
```

---

## 4. 하드웨어/임베디드 프로젝트 (Hardware/Embedded)

### 4-A. C/C++

```
필수 기본 지식:
✓ 58_embedded_standard.md      (임베디드 표준)
✓ 59_c_cpp_firmware.md         (C/C++ 펌웨어)
✓ 60_memory_management.md      (메모리 관리)
✓ 12_security_standard.md      (보안)

선택 기본 지식 (플랫폼에 따라):
┌─ ARM → 61_arm_architecture.md
├─ STM32 → 62_stm32_development.md
├─ Arduino → 63_arduino_c.md
└─ RISC-V → 64_riscv_development.md

권장 프로젝트 구조:
/project
├─ /src (소스 코드)
├─ /include (헤더 파일)
├─ /drivers (디바이스 드라이버)
├─ /bootloader (부팅 코드)
└─ /linker (링커 스크립트)
```

**추천 언어 스택:**
```c
// 컴파일러
- GCC (ARM Embedded)
- Clang

// 빌드 시스템
- CMake 또는 Makefile

// 디버깅
- GDB, OpenOCD

// 배포
- .hex 또는 .bin 펌웨어 파일

// 특징
- 극도로 최적화 가능
- 메모리 제약 환경
- 실시간 제어
```

---

### 4-B. Rust

```
필수 기본 지식:
✓ 58_embedded_standard.md      (임베디드 표준)
✓ 65_rust_embedded.md          (Rust 임베디드)
✓ 60_memory_management.md      (메모리 안전)
✓ 12_security_standard.md      (보안)

선택 기본 지식 (플랫폼):
┌─ ARM Cortex → 66_rust_cortex.md
├─ RISC-V → 67_rust_riscv.md
└─ ESP32 → 68_rust_esp32.md

권장 프로젝트 구조:
/project
├─ /src (Rust 코드)
├─ /examples (예제)
└─ /target (빌드 결과물)
```

**추천 언어 스택:**
```rust
// 도구
- Cargo (빌드 시스템)
- rust-analyzer

// 라이브러리
- embedded-hal (추상화)
- rtic (실시간 제어)

// 배포
- .elf, .hex, .bin

// 특징
- 메모리 안전성
- 높은 성능
- 런타임 오버헤드 없음
```

---

### 4-C. Python (MicroPython)

```
필수 기본 지식:
✓ 58_embedded_standard.md      (임베디드 표준)
✓ 69_micropython.md            (MicroPython)
✓ 70_iot_devices.md            (IoT 기기)

선택 기본 지식 (플랫폼):
┌─ Raspberry Pi → 71_raspberry_pi.md
├─ ESP32 → 72_esp32_python.md
└─ Arduino → 73_arduino_python.md

권장 프로젝트 구조:
/project
├─ /main.py (메인 코드)
├─ /lib (라이브러리)
└─ /config (설정)
```

**추천 언어 스택:**
```python
# 구현
- MicroPython 또는 CircuitPython

# 배포
- .py 파일 직접 업로드

# 특징
- 빠른 개발
- 작은 메모리 풋프린트
- 프로토타이핑 강점
```

---

## 매핑 테이블 (빠른 참조)

| 결과물 | 언어 | 권장 DB | 배포 방식 | 기본 지식 |
|--------|------|---------|----------|----------|
| **웹** | Node.js | PostgreSQL | Docker + AWS | 07,08,09,10,11,12 |
| | Python | PostgreSQL | Docker + AWS | 07,08,09,10,11,12 |
| | Java | PostgreSQL | Docker + K8s | 07,08,09,10,11,12 |
| | Go | PostgreSQL | Docker + K8s | 07,08,09,10,11,12 |
| **데스크톱** | C# (WPF) | SQLite | .exe | 34,35,36,37,12 |
| | Python | SQLite | .exe | 34,36,37,12 |
| | Electron | SQLite | .exe/.dmg/.deb | 34,46,37,12 |
| **모바일** | React Native | SQLite | App Store/Play | 50,51,52,12 |
| | Flutter | Hive/SQLite | App Store/Play | 50,53,52,12 |
| | Swift | Core Data | App Store | 50,54,55,52,12 |
| | Kotlin | Room | Play Store | 50,56,57,52,12 |
| **임베디드** | C/C++ | 없음 | .hex/.bin | 58,59,60,12 |
| | Rust | 없음 | .elf | 58,65,60,12 |
| | Python | 없음 | .py | 58,69,70,12 |

---

## 사용 방법

1. **00_TECH_PARAMETER_DEFINITION.md** 작성
   - 5가지 파라미터 정의

2. **이 문서(00_TECH_PARAMETER_MAPPING.md)** 확인
   - 파라미터 조합에 맞는 기본 지식 찾기
   - 필수 지식 + 선택 지식 확인

3. **기본 지식 폴더 준비**
   - 추천된 기본 지식 파일들이 `/knowledge_base/`에 있는지 확인
   - 없으면 생성 필요

4. **단계 1로 진행**
   - 요구사항 입력 시작

---

## 예시

### 예시 1: 쇼핑몰 웹사이트

```
파라미터:
P1: 웹 도메인
P2: JavaScript/TypeScript + Node.js
P3: PostgreSQL
P4: AWS
P5: 인터넷 필수 + 다중 디바이스

권장 기본 지식:
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

### 예시 2: Windows 회계 소프트웨어

```
파라미터:
P1: 데스크톱 PC
P2: C# + WPF
P3: SQL Server
P4: 로컬 설치
P5: 오프라인 완전 지원

권장 기본 지식:
✓ 34_desktop_standard.md
✓ 35_windows_standard.md
✓ 36_csharp_desktop.md
✓ 37_database_desktop.md
✓ 12_security_standard.md
✓ 39_wpf_best_practices.md
✓ 40_sqlserver_local.md
✓ 04_admin_system.md
```

### 예시 3: iOS 배송 추적 앱

```
파라미터:
P1: 모바일 앱 (iOS)
P2: Swift
P3: Core Data + 백엔드 API
P4: Apple App Store
P5: 혼합 (온/오프라인)

권장 기본 지식:
✓ 50_mobile_standard.md
✓ 54_ios_standard.md
✓ 55_swift_best_practices.md
✓ 52_mobile_database.md
✓ 12_security_standard.md
✓ 11_api_standard.md (백엔드 API)
✓ 06_shipping_logistics.md
```

---

다음 단계: **파라미터를 작성한 후, 추천되는 기본 지식을 확인하고 단계 1(요구사항 입력)을 시작하세요.**
