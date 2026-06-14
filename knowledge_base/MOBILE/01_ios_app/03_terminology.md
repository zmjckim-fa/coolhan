# iOS 앱 용어 정의 (Terminology)

## UI 프레임워크

| 용어 | 정의 |
|------|------|
| **UIKit** | iOS 기본 UI 프레임워크 (명령형, Objective-C 기원). UIViewController, UIView 기반 |
| **SwiftUI** | 선언형 UI 프레임워크 (iOS 13+). View 프로토콜, @State/@Binding으로 반응형 UI |
| **AppKit** | macOS 전용 UI 프레임워크 (Catalyst로 iOS→Mac 이식 가능) |
| **UIViewController** | 단일 화면 단위. viewDidLoad/viewWillAppear 등 생명주기 메서드 보유 |
| **UIView** | 화면에 렌더링되는 모든 요소의 기반 클래스 |
| **Auto Layout** | 제약(Constraint) 기반 반응형 레이아웃 시스템 |
| **Storyboard** | XML 기반 화면 설계 파일 (.storyboard). Segue로 화면 전환 정의 |
| **XIB** | 단일 뷰/컴포넌트용 인터페이스 빌더 파일 (.xib) |

---

## 언어 & 도구

| 용어 | 정의 |
|------|------|
| **Swift** | Apple 공식 프로그래밍 언어. 타입 안전, ARC 메모리 관리, async/await 지원 |
| **Objective-C** | Swift 이전 Apple 주력 언어. 레거시 코드/프레임워크에서 여전히 사용 |
| **Xcode** | Apple 공식 IDE. 빌드, 디버깅, 시뮬레이터, Instruments 포함 |
| **Simulator** | 실제 기기 없이 Mac에서 iOS 앱을 실행하는 가상 환경 |
| **Instruments** | Xcode 내 성능 분석 도구 (메모리 누수, CPU, 네트워크 프로파일링) |
| **Swift Package Manager (SPM)** | Swift 공식 의존성 관리 도구. Package.swift로 설정 |
| **CocoaPods** | Ruby 기반 서드파티 의존성 관리자 (Podfile). SPM 이전 주류 |
| **Carthage** | 탈중앙화 의존성 관리자. 프레임워크 바이너리 빌드 방식 |

---

## 아키텍처 패턴

| 용어 | 정의 |
|------|------|
| **MVC** | Model-View-Controller. Cocoa 기본 패턴. ViewController가 과부하되기 쉬움 |
| **MVVM** | Model-View-ViewModel. ViewModel이 비즈니스 로직 담당. SwiftUI에 자연스러운 패턴 |
| **VIPER** | View-Interactor-Presenter-Entity-Router. 대형 앱, 팀 단위 개발에 적합 |
| **Coordinator** | 화면 전환 로직을 ViewController에서 분리하는 패턴 |
| **Repository** | 데이터 접근 로직을 추상화. ViewModel/Interactor가 직접 CoreData 접근 금지 |
| **Combine** | Apple의 반응형 프로그래밍 프레임워크 (Rx 대안, iOS 13+) |
| **RxSwift** | ReactiveX Swift 구현. Observable 스트림 기반 비동기 처리 |

---

## 데이터 & 저장

| 용어 | 정의 |
|------|------|
| **Core Data** | Apple ORM 프레임워크. NSManagedObject 기반 객체 그래프 + SQLite 영구 저장 |
| **NSManagedObjectContext** | Core Data의 "작업 단위". main context(UI) + background context(작업) 분리 사용 |
| **NSFetchRequest** | Core Data 조회 쿼리. NSPredicate로 필터링, NSSortDescriptor로 정렬 |
| **UserDefaults** | 키-값 소규모 설정 저장 (앱 설정, 플래그). 민감 데이터 저장 금지 |
| **Keychain** | iOS 보안 저장소. 토큰·패스워드·인증서 저장. 앱 삭제 후에도 유지됨 |
| **FileManager** | 파일 시스템 접근. Documents(백업), Caches(비백업), tmp 디렉토리 관리 |
| **CloudKit** | iCloud 데이터 동기화. NSPersistentCloudKitContainer로 Core Data 연동 |
| **Codable** | Swift 프로토콜. Encodable + Decodable. JSON ↔ Swift 객체 변환 |

---

## 시스템 프레임워크

| 용어 | 정의 |
|------|------|
| **Foundation** | 기본 데이터 타입, 네트워킹, 날짜, 파일 I/O 제공 |
| **UIKit / AppKit** | UI 레이어 프레임워크 |
| **AVFoundation** | 오디오·비디오 캡처·재생·편집 |
| **Core Location** | GPS, 실내 위치, 지오펜싱, 나침반 |
| **MapKit** | 애플 지도 표시 및 어노테이션, 경로 안내 |
| **Core ML** | 온디바이스 머신러닝 모델 실행 |
| **ARKit** | 증강현실. 카메라 + 모션으로 3D 오버레이 |
| **HealthKit** | 건강 데이터 읽기/쓰기 (사용자 동의 필수) |
| **StoreKit** | 인앱결제(IAP). 구독·비소모품·소모품 처리 |
| **WatchConnectivity** | iPhone ↔ Apple Watch 통신 |

---

## 배포 & 코드 서명

| 용어 | 정의 |
|------|------|
| **Bundle Identifier** | 앱 고유 식별자 (역도메인 형식: com.company.appname). 앱 스토어 전 세계 유일 |
| **Provisioning Profile** | 앱·기기·인증서 바인딩. 개발(Development) / 배포(Distribution) 분리 |
| **Code Signing Certificate** | Apple이 발급한 개발자 인증서. Developer ID 또는 Distribution |
| **Entitlements** | 앱이 사용할 특수 권한 목록 (Push, iCloud, HealthKit 등). .entitlements 파일 |
| **TestFlight** | Apple 공식 베타 배포 플랫폼. 내부(25명) / 외부(10,000명) 테스터 |
| **App Store Connect** | 앱 메타데이터, 가격, 스크린샷, 심사 제출 관리 포털 |
| **dSYM** | 디버그 심볼 파일. 크래시 리포트 역추적에 필요. 배포 빌드에서 필수 보관 |
| **Bitcode** | Apple 중간 표현. 현재(Xcode 14+) 기본 비활성화됨 |

---

## ARC & 메모리

| 용어 | 정의 |
|------|------|
| **ARC (Automatic Reference Counting)** | Swift/ObjC 메모리 관리. 참조 카운트가 0이 되면 자동 해제 |
| **Strong reference** | 기본 참조. 객체가 살아있는 한 카운트 유지 |
| **Weak reference** | 카운트 증가 없는 참조. 순환 참조 방지. nil이 될 수 있음 |
| **Unowned reference** | weak과 유사하나 nil이 될 수 없다고 가정 (크래시 위험) |
| **Retain cycle** | A가 B를, B가 A를 strong 참조 → 둘 다 해제 안 됨. weak/unowned으로 해결 |
| **Capture list** | 클로저 내 참조 방식 명시: `[weak self]`, `[unowned self]` |

---

**문서 버전:** 1.0.0 | **작성일:** 2026-06-13
