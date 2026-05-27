# 기술 파라미터 정의 (Tech Parameter Definition)

> **목적**: 프로젝트 시작 시 개발 환경, 언어, 데이터베이스, 배포 환경을 정의하여 적절한 기본 지식 라이브러리를 선택합니다.

---

## 단계 0.5: 기술 파라미터 정의

프로젝트 기획서를 만들기 전에, 먼저 기술 기초를 정의합니다.

---

## 필수 파라미터 5가지

### P1. 결과물 유형 (Deliverable Type)

**이것이 실행되는 곳은 어디인가?**

```
☐ 웹 도메인 기반 (Web - Cloud/Internet)
   └─ 브라우저에서 실행되는 웹사이트 또는 웹 애플리케이션
   └─ 예: 쇼핑몰, SNS, 관리자 대시보드, SaaS
   └─ 배포: 클라우드 (AWS, Azure, GCP, 온프레미스)

☐ 데스크톱 PC 설치 프로그램 (Desktop - Windows/Mac/Linux)
   └─ 사용자 PC에 설치하여 실행되는 프로그램
   └─ 예: 회계 소프트웨어, 설계 도구, 오디오 에디터
   └─ 배포: .exe, .dmg, .deb 파일 직접 배포

☐ 모바일 앱 (Mobile - iOS/Android)
   └─ 스마트폰 또는 태블릿에 설치되는 앱
   └─ 예: 배달 앱, 뱅킹 앱, 게임
   └─ 배포: App Store, Play Store

☐ 하드웨어/임베디드 (Hardware/Embedded)
   └─ 특정 기기에 내장되는 펌웨어 또는 제어 소프트웨어
   └─ 예: IoT 센서, 스마트 홈, 자동차 ECU
   └─ 배포: 펌웨어 업로드

☐ 게임/콘솔 (Game/Console)
   └─ 게임 또는 콘솔 애플리케이션
   └─ 예: 웹 게임, 모바일 게임, 콘솔 게임
   └─ 배포: 게임 스토어 또는 직접 배포

☐ CLI 도구/백엔드 서비스 (CLI/Backend Service)
   └─ 커맨드라인 인터페이스 또는 순수 백엔드 서비스
   └─ 예: 배치 처리 도구, 마이크로서비스, API 서버
   └─ 배포: 서버 또는 컨테이너

**선택**: ________________________________
```

---

### P2. 개발 언어/프레임워크 (Programming Language & Framework)

**어떤 언어로 개발할 것인가?**

#### P2-A. 웹 프로젝트

```
☐ JavaScript/TypeScript + Node.js
   └─ 풀스택: Express, NestJS, Next.js
   └─ 프론트: React, Vue, Angular
   └─ 사용 케이스: 빠른 개발, 풀스택 동일 언어

☐ Python + Django/FastAPI
   └─ 프레임워크: Django (풀 스택), FastAPI (API 중심)
   └─ 사용 케이스: 데이터 처리, 빠른 프로토타이핑, ML 통합

☐ Java + Spring Boot/Spring Framework
   └─ 사용 케이스: 대규모 엔터프라이즈, 높은 안정성 요구

☐ C# + .NET Core / ASP.NET Core
   └─ 사용 케이스: Microsoft 생태계, Windows 통합 필요

☐ Go (Golang)
   └─ 프레임워크: Gin, Echo
   └─ 사용 케이스: 고성능 API, 마이크로서비스, 동시성

☐ PHP + Laravel / Symfony
   └─ 사용 케이스: 레거시 웹호스팅, 빠른 개발

☐ Ruby + Rails
   └─ 사용 케이스: 빠른 프로토타이핑, startups

**웹 선택**: ________________________________
```

#### P2-B. 데스크톱 프로젝트

```
☐ C# + WinForms / WPF
   └─ 플랫폼: Windows 전용
   └─ 사용 케이스: 엔터프라이즈 Windows 앱

☐ C++ + Qt / wxWidgets
   └─ 플랫폼: Windows, Mac, Linux 크로스플랫폼
   └─ 사용 케이스: 성능 중시, 게임 엔진

☐ Python + PyQt / Tkinter
   └─ 플랫폼: Windows, Mac, Linux 크로스플랫폼
   └─ 사용 케이스: 빠른 개발, 데이터 분석 도구

☐ Java + JavaFX / Swing
   └─ 플랫폼: Windows, Mac, Linux 크로스플랫폼
   └─ 사용 케이스: 엔터프라이즈, 크로스플랫폼

☐ Electron (JavaScript)
   └─ 플랫폼: Windows, Mac, Linux 크로스플랫폼
   └─ 사용 케이스: 웹 개발자가 데스크톱 앱 만들기
   └─ 예: VS Code, Discord

☐ Swift + Cocoa (macOS only)
   └─ 플랫폼: macOS 전용
   └─ 사용 케이스: Apple 에코시스템

**데스크톱 선택**: ________________________________
```

#### P2-C. 모바일 프로젝트

```
☐ React Native (JavaScript/TypeScript)
   └─ 플랫폼: iOS, Android 동시 개발
   └─ 사용 케이스: 빠른 크로스플랫폼 개발
   └─ 예: Facebook, Instagram, Shopify

☐ Flutter (Dart)
   └─ 플랫폼: iOS, Android, Web 동시 개발
   └─ 사용 케이스: 아름다운 UI, 높은 성능
   └─ 예: Google, BMW, eBay

☐ Swift (iOS 전용)
   └─ 플랫폼: iOS, iPadOS, macOS, watchOS
   └─ 사용 케이스: 순수 네이티브 iOS 앱, 최고 성능

☐ Kotlin (Android 전용)
   └─ 플랫폼: Android, Java 생태계
   └─ 사용 케이스: 순수 네이티브 Android 앱

☐ C# + Xamarin / MAUI
   └─ 플랫폼: iOS, Android, Windows 크로스플랫폼
   └─ 사용 케이스: .NET 개발자의 모바일 개발

**모바일 선택**: ________________________________
```

#### P2-D. 하드웨어/임베디드 프로젝트

```
☐ C / C++
   └─ 사용 케이스: 펌웨어, 실시간 제어, IoT
   └─ 플랫폼: ARM, x86, RISC-V 등 모든 아키텍처

☐ Rust
   └─ 사용 케이스: 안전한 시스템 프로그래밍, IoT
   └─ 장점: 메모리 안전, 높은 성능

☐ Python (MicroPython)
   └─ 사용 케이스: IoT, 프로토타이핑
   └─ 예: Raspberry Pi, ESP32

☐ Assembly + C
   └─ 사용 케이스: 극도로 최적화 필요
   └─ 플랫폼: 구형 또는 리소스 제한 기기

**임베디드 선택**: ________________________________
```

---

### P3. 데이터베이스 (Database)

**어떤 데이터베이스를 사용할 것인가?**

```
관계형 데이터베이스 (Relational):

☐ MySQL / MariaDB
   └─ 특징: 가장 널리 사용, 무료, 웹호스팅 표준
   └─ 사용: 웹 애플리케이션, 중소 규모

☐ PostgreSQL
   └─ 특징: 고급 기능, 강력한 성능, 오픈소스
   └─ 사용: 대규모 애플리케이션, 복잡한 쿼리

☐ Microsoft SQL Server (MSSQL)
   └─ 특징: 엔터프라이즈 기능, Microsoft 통합
   └─ 사용: 엔터프라이즈, Windows 환경

☐ Oracle Database
   └─ 특징: 고가의 엔터프라이즈 DB
   └─ 사용: 대규모 금융/공공 시스템

☐ SQLite
   └─ 특징: 경량, 파일 기반, 설치 불필요
   └─ 사용: 데스크톱 앱, 모바일 로컬 저장소, 임베디드

NoSQL 데이터베이스:

☐ MongoDB
   └─ 특징: 문서 기반, 유연한 스키마
   └─ 사용: 빠른 프로토타이핑, 비정형 데이터

☐ Firebase (Google)
   └─ 특징: 관리형 클라우드 DB, 실시간 동기화
   └─ 사용: 모바일 앱, 빠른 개발, 소규모

☐ DynamoDB (AWS)
   └─ 특징: AWS 관리형 NoSQL
   └─ 사용: AWS 기반 시스템, 높은 확장성

☐ Redis
   └─ 특징: 인메모리 캐시/세션 저장소
   └─ 사용: 캐싱, 실시간 데이터, 세션 관리

기타:

☐ Elasticsearch
   └─ 특징: 검색 및 분석 DB
   └─ 사용: 로그 분석, 검색 기능

☐ GraphQL (Apollo Server)
   └─ 특징: API 쿼리 언어
   └─ 사용: 유연한 API, 프론트엔드 친화적

☐ 기타: ________________________________

☐ 없음 (오프라인 전용, 데이터베이스 불필요)
   └─ 사용: 로컬 파일 저장소만 사용, 또는 데이터 불필요

**선택**: ________________________________
```

---

### P4. 배포 환경 (Deployment Environment)

**이것이 어디에서 실행될 것인가?**

```
클라우드:

☐ AWS (Amazon Web Services)
   └─ 서비스: EC2, RDS, Lambda, Amplify
   └─ 장점: 가장 큰 시장점유율, 다양한 옵션
   └─ 비용: 사용량 기반 (저비용 ~ 고비용)

☐ Azure (Microsoft)
   └─ 서비스: App Service, SQL Database, Functions
   └─ 장점: Microsoft 통합, 엔터프라이즈 지원
   └─ 비용: 구독 기반

☐ GCP (Google Cloud Platform)
   └─ 서비스: Cloud Run, Cloud SQL, App Engine
   └─ 장점: 데이터 분석 강점, 좋은 문서
   └─ 비용: 사용량 기반

☐ Heroku
   └─ 장점: 가장 간편한 배포, 초급자 친화적
   └─ 비용: 월 기반 (5-100달러)
   └─ 한계: 중규모 이상 비용 급증

온프레미스:

☐ 자체 서버 (On-Premises)
   └─ 환경: 자신의 데이터센터 또는 사무실
   └─ 장점: 완전 제어, 보안, 규정 준수
   └─ 비용: 초기 인프라 + 관리 인력

☐ 코로케이션 (Colocation)
   └─ 환경: 제3자 데이터센터에 서버 배치
   └─ 장점: 안정성, 높은 대역폭
   └─ 비용: 월 기반

로컬:

☐ 로컬 PC / 개발 머신
   └─ 환경: 개발자 또는 특정 사용자 PC
   └─ 사용: 데스크톱 앱, 로컬 도구

☐ 사용자 기기 (End-user Device)
   └─ 환경: 최종 사용자의 폰/PC
   └─ 사용: 모바일 앱, 데스크톱 앱

하드웨어 자체:

☐ 임베디드 기기 (Microcontroller/SoC)
   └─ 환경: Arduino, Raspberry Pi, STM32 등
   └─ 사용: IoT, 제어 시스템

**선택**: ________________________________
```

---

### P5. 실행 환경 (Runtime Environment)

**이것이 어떤 네트워크 환경에서 실행되는가?**

```
연결 요구사항:

☐ 인터넷 필수 (Always Online)
   └─ 설명: 항상 인터넷에 연결되어야 함
   └─ 예: 웹사이트, SaaS, 실시간 협업 도구
   └─ 오프라인 불가능

☐ 오프라인 완전 지원 (Full Offline Support)
   └─ 설명: 인터넷 없이 완전히 작동
   └─ 예: 로컬 데스크톱 앱, 메모장, 게임
   └─ 온라인 기능 없음

☐ 혼합 (Hybrid - Online/Offline)
   └─ 설명: 온라인/오프라인 모두 작동
   └─ 예: Notion, Google Docs (오프라인 모드)
   └─ 온라인 시 데이터 동기화

☐ 간헐적 연결 (Intermittent Connection)
   └─ 설명: 불안정한 연결 환경
   └─ 예: 모바일 네트워크 앱, 배송 앱
   └─ 재시도 및 큐잉 필요

**선택**: ________________________________

다중 디바이스:

☐ 단일 디바이스만 (Single Device)
   └─ 예: 특정 PC 또는 폰에서만 사용

☐ 다중 디바이스 동기화 필요 (Multi-Device Sync)
   └─ 예: 클라우드 메모 앱, Gmail, Dropbox
   └─ 데이터 실시간/배치 동기화 필요

**다중 디바이스**: ☐ Yes  ☐ No

응답 시간 요구사항:

☐ 실시간 (Real-time - < 100ms)
   └─ 예: 게임, 채팅, 화상통화
   └─ 기술: WebSocket, gRPC

☐ 즉시 (Immediate - < 1s)
   └─ 예: 웹 애플리케이션, 모바일 앱
   └─ 기술: REST API, GraphQL

☐ 배치 (Batch - 분/시간)
   └─ 예: 리포트 생성, 데이터 처리
   └─ 기술: 배치 작업, 스케줄러

**응답 시간**: ________________________________
```

---

## 파라미터 정리 양식

완성된 파라미터를 아래에 정리하세요:

```
프로젝트명: _______________________________

P1. 결과물 유형:        _______________________________
P2. 개발 언어/프레임워크: _______________________________
P3. 데이터베이스:        _______________________________
P4. 배포 환경:         _______________________________
P5. 실행 환경:         _______________________________

추가 정보:
- 예상 팀 규모: ________명
- 개발 기간: ________개월
- 예상 사용자 수: ________명
- 특별 요구사항: _______________________________
```

---

## 다음 단계

파라미터 정의 후:

1. ✅ **기술 파라미터 정의 완료**
2. 📋 **기본 지식 라이브러리 추천** (00_TECH_PARAMETER_MAPPING.md 참조)
3. 📝 **요구사항 입력** (단계 1)
4. 📚 **기획서 생성** (단계 2)

---

이 양식을 작성한 후, **00_TECH_PARAMETER_MAPPING.md**에서 추천되는 기본 지식을 확인하세요.
