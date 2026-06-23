# iOS App Terminology

## UI Frameworks

| Term | Definition |
|------|------|
| **UIKit** | iOS's standard UI framework (imperative, originating from Objective-C). Based on UIViewController and UIView |
| **SwiftUI** | Declarative UI framework (iOS 13+). View protocol; reactive UI with @State/@Binding |
| **AppKit** | macOS-only UI framework (can be ported from iOS to Mac via Catalyst) |
| **UIViewController** | A single-screen unit. Has lifecycle methods such as viewDidLoad/viewWillAppear |
| **UIView** | Base class for all elements rendered on screen |
| **Auto Layout** | Constraint-based responsive layout system |
| **Storyboard** | XML-based screen design file (.storyboard). Defines transitions via Segues |
| **XIB** | Interface Builder file for a single view/component (.xib) |

---

## Languages & Tools

| Term | Definition |
|------|------|
| **Swift** | Apple's official programming language. Type-safe, ARC memory management, async/await support |
| **Objective-C** | Apple's main language before Swift. Still used in legacy code/frameworks |
| **Xcode** | Apple's official IDE. Includes building, debugging, simulator, Instruments |
| **Simulator** | Virtual environment for running iOS apps on a Mac without a physical device |
| **Instruments** | Performance analysis tool within Xcode (memory leaks, CPU, network profiling) |
| **Swift Package Manager (SPM)** | Swift's official dependency management tool. Configured via Package.swift |
| **CocoaPods** | Ruby-based third-party dependency manager (Podfile). The mainstream before SPM |
| **Carthage** | Decentralized dependency manager. Builds framework binaries |

---

## Architecture Patterns

| Term | Definition |
|------|------|
| **MVC** | Model-View-Controller. The default Cocoa pattern. The ViewController tends to become overloaded |
| **MVVM** | Model-View-ViewModel. The ViewModel handles business logic. A natural pattern for SwiftUI |
| **VIPER** | View-Interactor-Presenter-Entity-Router. Suitable for large apps and team development |
| **Coordinator** | Pattern that separates screen-transition logic out of the ViewController |
| **Repository** | Abstracts data access logic. The ViewModel/Interactor must not access CoreData directly |
| **Combine** | Apple's reactive programming framework (an Rx alternative, iOS 13+) |
| **RxSwift** | ReactiveX Swift implementation. Asynchronous processing based on Observable streams |

---

## Data & Storage

| Term | Definition |
|------|------|
| **Core Data** | Apple's ORM framework. NSManagedObject-based object graph + SQLite persistence |
| **NSManagedObjectContext** | Core Data's "unit of work". Used with separate main context (UI) + background context (work) |
| **NSFetchRequest** | Core Data query. Filtering with NSPredicate, sorting with NSSortDescriptor |
| **UserDefaults** | Key-value storage for small settings (app settings, flags). Do not store sensitive data |
| **Keychain** | iOS secure storage. Stores tokens, passwords, certificates. Persists even after app deletion |
| **FileManager** | File system access. Manages the Documents (backed up), Caches (not backed up), and tmp directories |
| **CloudKit** | iCloud data synchronization. Integrates with Core Data via NSPersistentCloudKitContainer |
| **Codable** | Swift protocol. Encodable + Decodable. Converts JSON ↔ Swift objects |

---

## System Frameworks

| Term | Definition |
|------|------|
| **Foundation** | Provides basic data types, networking, dates, file I/O |
| **UIKit / AppKit** | UI layer frameworks |
| **AVFoundation** | Audio/video capture, playback, editing |
| **Core Location** | GPS, indoor positioning, geofencing, compass |
| **MapKit** | Apple Maps display and annotations, route guidance |
| **Core ML** | On-device machine learning model execution |
| **ARKit** | Augmented reality. 3D overlays via camera + motion |
| **HealthKit** | Reading/writing health data (user consent required) |
| **StoreKit** | In-app purchases (IAP). Handles subscriptions, non-consumables, consumables |
| **WatchConnectivity** | iPhone ↔ Apple Watch communication |

---

## Distribution & Code Signing

| Term | Definition |
|------|------|
| **Bundle Identifier** | App's unique identifier (reverse-domain format: com.company.appname). Globally unique on the App Store |
| **Provisioning Profile** | Binds app, device, and certificate. Separate Development / Distribution |
| **Code Signing Certificate** | Developer certificate issued by Apple. Developer ID or Distribution |
| **Entitlements** | List of special permissions the app uses (Push, iCloud, HealthKit, etc.). The .entitlements file |
| **TestFlight** | Apple's official beta distribution platform. Internal (25) / external (10,000) testers |
| **App Store Connect** | Portal for managing app metadata, pricing, screenshots, and review submission |
| **dSYM** | Debug symbol file. Needed for crash report symbolication. Must be kept for distribution builds |
| **Bitcode** | Apple's intermediate representation. Currently (Xcode 14+) disabled by default |

---

## ARC & Memory

| Term | Definition |
|------|------|
| **ARC (Automatic Reference Counting)** | Swift/ObjC memory management. Automatically deallocates when the reference count reaches 0 |
| **Strong reference** | The default reference. Keeps the count while the object is alive |
| **Weak reference** | A reference that does not increment the count. Prevents retain cycles. Can become nil |
| **Unowned reference** | Similar to weak but assumed never to become nil (crash risk) |
| **Retain cycle** | A strongly references B and B strongly references A → neither is deallocated. Resolve with weak/unowned |
| **Capture list** | Specifies the reference style inside a closure: `[weak self]`, `[unowned self]` |

---

**Document version:** 1.0.0 | **Date:** 2026-06-13
