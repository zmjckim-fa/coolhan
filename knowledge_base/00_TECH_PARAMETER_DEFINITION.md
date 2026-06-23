# Tech Parameter Definition

> **Purpose**: Define the development environment, language, database, and deployment environment at project start to select the appropriate base knowledge library.

---

## Step 0.5: Tech Parameter Definition

Before creating the project specification, first define the technical foundation.

---

## Five Required Parameters

### P1. Deliverable Type

**Where does this run?**

```
☐ Web domain-based (Web - Cloud/Internet)
   └─ A website or web application that runs in a browser
   └─ Examples: shopping mall, SNS, admin dashboard, SaaS
   └─ Deployment: cloud (AWS, Azure, GCP, on-premises)

☐ Desktop PC installable program (Desktop - Windows/Mac/Linux)
   └─ A program installed and run on the user's PC
   └─ Examples: accounting software, design tools, audio editor
   └─ Deployment: direct distribution of .exe, .dmg, .deb files

☐ Mobile app (Mobile - iOS/Android)
   └─ An app installed on a smartphone or tablet
   └─ Examples: delivery app, banking app, game
   └─ Deployment: App Store, Play Store

☐ Hardware/Embedded (Hardware/Embedded)
   └─ Firmware or control software embedded in a specific device
   └─ Examples: IoT sensor, smart home, automotive ECU
   └─ Deployment: firmware upload

☐ Game/Console (Game/Console)
   └─ A game or console application
   └─ Examples: web game, mobile game, console game
   └─ Deployment: game store or direct distribution

☐ CLI tool/Backend service (CLI/Backend Service)
   └─ A command-line interface or pure backend service
   └─ Examples: batch processing tool, microservice, API server
   └─ Deployment: server or container

**Selection**: ________________________________
```

---

### P2. Programming Language & Framework

**Which language will you develop in?**

#### P2-A. Web Projects

```
☐ JavaScript/TypeScript + Node.js
   └─ Full-stack: Express, NestJS, Next.js
   └─ Frontend: React, Vue, Angular
   └─ Use cases: fast development, same language across the full stack

☐ Python + Django/FastAPI
   └─ Frameworks: Django (full stack), FastAPI (API-focused)
   └─ Use cases: data processing, rapid prototyping, ML integration

☐ Java + Spring Boot/Spring Framework
   └─ Use cases: large-scale enterprise, high stability requirements

☐ C# + .NET Core / ASP.NET Core
   └─ Use cases: Microsoft ecosystem, Windows integration needed

☐ Go (Golang)
   └─ Frameworks: Gin, Echo
   └─ Use cases: high-performance APIs, microservices, concurrency

☐ PHP + Laravel / Symfony
   └─ Use cases: legacy web hosting, fast development

☐ Ruby + Rails
   └─ Use cases: rapid prototyping, startups

**Web selection**: ________________________________
```

#### P2-B. Desktop Projects

```
☐ C# + WinForms / WPF
   └─ Platform: Windows only
   └─ Use cases: enterprise Windows apps

☐ C++ + Qt / wxWidgets
   └─ Platform: cross-platform Windows, Mac, Linux
   └─ Use cases: performance-focused, game engines

☐ Python + PyQt / Tkinter
   └─ Platform: cross-platform Windows, Mac, Linux
   └─ Use cases: fast development, data analysis tools

☐ Java + JavaFX / Swing
   └─ Platform: cross-platform Windows, Mac, Linux
   └─ Use cases: enterprise, cross-platform

☐ Electron (JavaScript)
   └─ Platform: cross-platform Windows, Mac, Linux
   └─ Use cases: web developers building desktop apps
   └─ Examples: VS Code, Discord

☐ Swift + Cocoa (macOS only)
   └─ Platform: macOS only
   └─ Use cases: Apple ecosystem

**Desktop selection**: ________________________________
```

#### P2-C. Mobile Projects

```
☐ React Native (JavaScript/TypeScript)
   └─ Platform: simultaneous iOS, Android development
   └─ Use cases: fast cross-platform development
   └─ Examples: Facebook, Instagram, Shopify

☐ Flutter (Dart)
   └─ Platform: simultaneous iOS, Android, Web development
   └─ Use cases: beautiful UI, high performance
   └─ Examples: Google, BMW, eBay

☐ Swift (iOS only)
   └─ Platform: iOS, iPadOS, macOS, watchOS
   └─ Use cases: pure native iOS app, top performance

☐ Kotlin (Android only)
   └─ Platform: Android, Java ecosystem
   └─ Use cases: pure native Android app

☐ C# + Xamarin / MAUI
   └─ Platform: cross-platform iOS, Android, Windows
   └─ Use cases: mobile development by .NET developers

**Mobile selection**: ________________________________
```

#### P2-D. Hardware/Embedded Projects

```
☐ C / C++
   └─ Use cases: firmware, real-time control, IoT
   └─ Platform: all architectures including ARM, x86, RISC-V

☐ Rust
   └─ Use cases: safe systems programming, IoT
   └─ Advantages: memory safety, high performance

☐ Python (MicroPython)
   └─ Use cases: IoT, prototyping
   └─ Examples: Raspberry Pi, ESP32

☐ Assembly + C
   └─ Use cases: extreme optimization required
   └─ Platform: older or resource-constrained devices

**Embedded selection**: ________________________________
```

---

### P3. Database

**Which database will you use?**

```
Relational databases:

☐ MySQL / MariaDB
   └─ Characteristics: most widely used, free, web-hosting standard
   └─ Use: web applications, small to mid scale

☐ PostgreSQL
   └─ Characteristics: advanced features, powerful performance, open source
   └─ Use: large-scale applications, complex queries

☐ Microsoft SQL Server (MSSQL)
   └─ Characteristics: enterprise features, Microsoft integration
   └─ Use: enterprise, Windows environments

☐ Oracle Database
   └─ Characteristics: high-cost enterprise DB
   └─ Use: large-scale financial/public systems

☐ SQLite
   └─ Characteristics: lightweight, file-based, no installation required
   └─ Use: desktop apps, mobile local storage, embedded

NoSQL databases:

☐ MongoDB
   └─ Characteristics: document-based, flexible schema
   └─ Use: rapid prototyping, unstructured data

☐ Firebase (Google)
   └─ Characteristics: managed cloud DB, real-time sync
   └─ Use: mobile apps, fast development, small scale

☐ DynamoDB (AWS)
   └─ Characteristics: AWS-managed NoSQL
   └─ Use: AWS-based systems, high scalability

☐ Redis
   └─ Characteristics: in-memory cache/session store
   └─ Use: caching, real-time data, session management

Others:

☐ Elasticsearch
   └─ Characteristics: search and analytics DB
   └─ Use: log analysis, search functionality

☐ GraphQL (Apollo Server)
   └─ Characteristics: API query language
   └─ Use: flexible APIs, frontend-friendly

☐ Other: ________________________________

☐ None (offline only, no database needed)
   └─ Use: local file storage only, or no data needed

**Selection**: ________________________________
```

---

### P4. Deployment Environment

**Where will this run?**

```
Cloud:

☐ AWS (Amazon Web Services)
   └─ Services: EC2, RDS, Lambda, Amplify
   └─ Advantages: largest market share, diverse options
   └─ Cost: usage-based (low to high)

☐ Azure (Microsoft)
   └─ Services: App Service, SQL Database, Functions
   └─ Advantages: Microsoft integration, enterprise support
   └─ Cost: subscription-based

☐ GCP (Google Cloud Platform)
   └─ Services: Cloud Run, Cloud SQL, App Engine
   └─ Advantages: data analytics strength, good documentation
   └─ Cost: usage-based

☐ Heroku
   └─ Advantages: simplest deployment, beginner-friendly
   └─ Cost: monthly-based ($5-100)
   └─ Limitation: cost spikes sharply beyond mid scale

On-premises:

☐ Self-hosted server (On-Premises)
   └─ Environment: your own data center or office
   └─ Advantages: full control, security, compliance
   └─ Cost: initial infrastructure + operations staff

☐ Colocation
   └─ Environment: servers placed in a third-party data center
   └─ Advantages: stability, high bandwidth
   └─ Cost: monthly-based

Local:

☐ Local PC / development machine
   └─ Environment: a developer's or specific user's PC
   └─ Use: desktop apps, local tools

☐ End-user Device
   └─ Environment: the end user's phone/PC
   └─ Use: mobile apps, desktop apps

Hardware itself:

☐ Embedded device (Microcontroller/SoC)
   └─ Environment: Arduino, Raspberry Pi, STM32, etc.
   └─ Use: IoT, control systems

**Selection**: ________________________________
```

---

### P5. Runtime Environment

**In what network environment does this run?**

```
Connectivity requirements:

☐ Internet required (Always Online)
   └─ Description: must always be connected to the internet
   └─ Examples: website, SaaS, real-time collaboration tools
   └─ Offline not possible

☐ Full Offline Support
   └─ Description: fully functional without the internet
   └─ Examples: local desktop app, notepad, game
   └─ No online features

☐ Hybrid (Online/Offline)
   └─ Description: works both online and offline
   └─ Examples: Notion, Google Docs (offline mode)
   └─ Syncs data when online

☐ Intermittent Connection
   └─ Description: unstable connectivity environment
   └─ Examples: mobile network apps, delivery apps
   └─ Retry and queuing required

**Selection**: ________________________________

Multiple devices:

☐ Single Device only
   └─ Example: used only on a specific PC or phone

☐ Multi-Device Sync required
   └─ Examples: cloud note apps, Gmail, Dropbox
   └─ Real-time/batch data sync required

**Multiple devices**: ☐ Yes  ☐ No

Response time requirements:

☐ Real-time (Real-time - < 100ms)
   └─ Examples: games, chat, video calls
   └─ Technology: WebSocket, gRPC

☐ Immediate (Immediate - < 1s)
   └─ Examples: web applications, mobile apps
   └─ Technology: REST API, GraphQL

☐ Batch (Batch - minutes/hours)
   └─ Examples: report generation, data processing
   └─ Technology: batch jobs, scheduler

**Response time**: ________________________________
```

---

## Parameter Summary Form

Summarize the completed parameters below:

```
Project name: _______________________________

P1. Deliverable type:          _______________________________
P2. Language/Framework:        _______________________________
P3. Database:                  _______________________________
P4. Deployment environment:    _______________________________
P5. Runtime environment:       _______________________________

Additional info:
- Estimated team size: ________ people
- Development period: ________ months
- Estimated number of users: ________ people
- Special requirements: _______________________________
```

---

## Next Steps

After defining the parameters:

1. ✅ **Tech parameter definition complete**
2. 📋 **Base knowledge library recommendation** (see 00_TECH_PARAMETER_MAPPING.md)
3. 📝 **Requirements input** (Step 1)
4. 📚 **Specification generation** (Step 2)

---

After completing this form, check the recommended base knowledge in **00_TECH_PARAMETER_MAPPING.md**.
