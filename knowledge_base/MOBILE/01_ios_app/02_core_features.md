# iOS 앱 핵심 기능 (Core Features)

## 섹션 1: 앱 생명주기 (App Lifecycle)

```
앱 상태 전이:
Not Running
  → [Launch] → Active (포그라운드, 사용자 상호작용 가능)
  → [홈버튼/스와이프] → Inactive (잠시 비활성)
  → [완전 백그라운드] → Background (백그라운드 작업 실행)
  → [메모리 부족] → Suspended → Not Running

UIApplicationDelegate (UIKit):
  - application:didFinishLaunchingWithOptions → 초기화
  - applicationWillResignActive → 중단 준비
  - applicationDidEnterBackground → 백그라운드 진입
  - applicationWillEnterForeground → 포그라운드 복귀
  - applicationDidBecomeActive → 활성화 완료

SwiftUI @main:
  - App 프로토콜 구현
  - Scene 기반 (WindowGroup)
  - .onReceive(NotificationCenter) 로 생명주기 이벤트 감지
```

**CoolHan 규칙:**
- 앱 시작 시 필수 초기화(DB, 설정, 인증 상태)는 `didFinishLaunchingWithOptions`에서 실행
- 백그라운드 진입 시 미저장 상태 반드시 flush
- Background Task 등록(`BGTaskScheduler`)은 Info.plist에 identifier 선언 필수

---

## 섹션 2: 네비게이션 & 라우팅

```
UIKit 패턴:
UITabBarController (탭 구조)
  └─ UINavigationController (스택 구조)
      └─ UIViewController (개별 화면)

SwiftUI 패턴:
TabView {
  NavigationStack { ContentView() }   // iOS 16+
  NavigationStack { SettingsView() }
}
NavigationLink(destination:) 로 화면 전환
.navigationDestination(for:) 로 타입 기반 라우팅

딥링크:
- URL Scheme: myapp://product/123
- Universal Link: https://example.com/product/123
- Info.plist: LSApplicationQueriesSchemes, CFBundleURLTypes
```

**CoolHan 규칙:**
- 3단계 이상 중첩 네비게이션 금지 (UX 원칙)
- 모달 사용은 임시 작업(폼 입력, 사진 선택)에 한정
- 딥링크는 SceneDelegate/AppDelegate 양쪽에서 처리 (iOS 버전 호환)

---

## 섹션 3: 데이터 저장

```
계층별 저장 전략:
┌────────────────────────────┬─────────────────────────────┐
│ 데이터 유형                │ 저장소                      │
├────────────────────────────┼─────────────────────────────┤
│ 민감 데이터 (토큰/패스워드)│ Keychain                    │
│ 사용자 설정 (소량)         │ UserDefaults                │
│ 구조화 데이터 (엔티티)     │ Core Data / SQLite           │
│ 파일 (이미지/문서)         │ FileManager (Documents/Cache)│
│ 임시 캐시                  │ NSCache / URLCache           │
└────────────────────────────┴─────────────────────────────┘

Core Data 설정:
NSPersistentContainer(name: "Model")
  → NSManagedObjectContext (viewContext: main, background)
  → NSFetchRequest<Entity>() 로 조회
  → context.save() 로 영구 저장

CloudKit 연동:
NSPersistentCloudKitContainer → iCloud 자동 동기화
```

**CoolHan 규칙:**
- 인증 토큰은 반드시 Keychain. UserDefaults 저장 금지.
- Core Data 저장은 백그라운드 컨텍스트에서 수행 후 viewContext merge
- 캐시 폴더 사용 시 `NSURLIsExcludedFromBackupKey = true` 설정

---

## 섹션 4: 네트워킹 (URLSession)

```swift
// 표준 API 호출 패턴 (async/await, Swift 5.5+)
struct APIClient {
    let baseURL = URL(string: "https://api.example.com")!

    func fetch<T: Codable>(_ path: String) async throws -> T {
        let url = baseURL.appendingPathComponent(path)
        var request = URLRequest(url: url)
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.timeoutInterval = 30

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse,
              200...299 ~= http.statusCode else {
            throw APIError.httpError((response as? HTTPURLResponse)?.statusCode ?? -1)
        }
        return try JSONDecoder().decode(T.self, from: data)
    }
}

// 에러 타입
enum APIError: Error {
    case httpError(Int)
    case decodingError(Error)
    case networkUnavailable
}
```

**CoolHan 규칙:**
- App Transport Security(ATS): HTTP 허용 시 반드시 Info.plist에 `NSAllowsArbitraryLoads` 또는 도메인 예외 선언
- 재시도 정책: 네트워크 오류 최대 3회, 지수 백오프(1s, 2s, 4s)
- 오프라인 감지: `NWPathMonitor`로 연결 상태 감시

---

## 섹션 5: 카메라 & 미디어

```swift
// AVFoundation 카메라 캡처
import AVFoundation
let captureSession = AVCaptureSession()
guard let device = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .back),
      let input = try? AVCaptureDeviceInput(device: device) else { return }
captureSession.addInput(input)

// PHPickerViewController (사진 라이브러리 선택, iOS 14+)
var config = PHPickerConfiguration()
config.filter = .images
config.selectionLimit = 1
let picker = PHPickerViewController(configuration: config)
picker.delegate = self

// Info.plist 필수 키:
// NSCameraUsageDescription
// NSPhotoLibraryUsageDescription
// NSMicrophoneUsageDescription (동영상)
```

**CoolHan 규칙:**
- 카메라 권한 거부 시 사용자에게 설정 앱 안내 UI 필수
- 이미지 업로드 전 리사이징(최대 1080px), JPEG 압축(0.8) 적용
- 영상 처리는 백그라운드 큐에서 수행

---

## 섹션 6: 위치 서비스 (Core Location)

```swift
import CoreLocation
class LocationManager: NSObject, CLLocationManagerDelegate {
    let manager = CLLocationManager()

    func requestPermission() {
        manager.delegate = self
        manager.requestWhenInUseAuthorization()  // 또는 requestAlwaysAuthorization
        manager.desiredAccuracy = kCLLocationAccuracyBest
        manager.startUpdatingLocation()
    }

    func locationManager(_ manager: CLLocationManager,
                         didUpdateLocations locations: [CLLocation]) {
        guard let loc = locations.last else { return }
        // lat: loc.coordinate.latitude, lng: loc.coordinate.longitude
    }
}
// Info.plist:
// NSLocationWhenInUseUsageDescription (필수)
// NSLocationAlwaysAndWhenInUseUsageDescription (항상 권한 시)
```

**CoolHan 규칙:**
- 배경 위치 추적은 사용자에게 명확히 고지 필수
- `desiredAccuracy`는 필요한 최소 정확도로 설정 (배터리 최적화)
- 지오펜싱은 `CLCircularRegion` (최대 20개 동시 모니터링 제한)

---

## 섹션 7: 푸시 알림 (APNs)

```swift
// 권한 요청
UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .badge, .sound]) { granted, _ in
    guard granted else { return }
    DispatchQueue.main.async { UIApplication.shared.registerForRemoteNotifications() }
}

// 토큰 수신
func application(_ app: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken token: Data) {
    let tokenString = token.map { String(format: "%02.2hhx", $0) }.joined()
    // 서버에 tokenString 전송
}

// 로컬 알림 스케줄링
let content = UNMutableNotificationContent()
content.title = "알림 제목"
content.body = "내용"
let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 5, repeats: false)
let request = UNNotificationRequest(identifier: UUID().uuidString, content: content, trigger: trigger)
UNUserNotificationCenter.current().add(request)
```

**CoolHan 규칙:**
- APNs 인증서 또는 APNs Key (.p8) 선택. Key 방식 권장 (만료 없음).
- 백엔드 서버가 디바이스 토큰 저장·갱신 처리 필수
- Silent Push 사용 시 `content-available: 1` + Background Modes 활성화

---

## 섹션 8: 생체 인증 (Face ID / Touch ID)

```swift
import LocalAuthentication
let context = LAContext()
var error: NSError?
if context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error) {
    context.evaluatePolicy(.deviceOwnerAuthenticationWithBiometrics,
                           localizedReason: "앱 잠금 해제") { success, authError in
        DispatchQueue.main.async {
            if success { /* 인증 성공 */ }
            else { /* 실패 또는 취소 */ }
        }
    }
}
// Info.plist: NSFaceIDUsageDescription
```

**CoolHan 규칙:**
- 생체 인증 실패 시 패스코드 대체 인증 제공 필수
- 생체 정보는 디바이스 내 Secure Enclave에서만 처리 (앱이 생체 데이터 접근 불가)
- LABiometryType으로 Face ID / Touch ID 구분하여 UI 문구 동적 변경

---

## 섹션 9: 앱 스토어 & 배포

```
배포 단계:
개발(Debug) → TestFlight(내부/외부 베타) → App Store(프로덕션)

필수 사전 준비:
- Apple Developer Program 가입 ($99/년)
- Bundle Identifier 등록 (com.company.app)
- 프로비저닝 프로파일 (개발/배포 분리)
- 코드 서명 인증서 (개발/배포 분리)

App Store 심사 체크리스트:
☐ Privacy Nutrition Labels (수집 데이터 선언)
☐ App Privacy Policy URL
☐ 최소 OS 버전 설정 (배포 1년 내 마이너 지원)
☐ 스크린샷: iPhone 6.5", iPad 12.9" (필수)
☐ 연령 등급 설정
☐ 인앱결제 심사 (있을 경우 Sandbox 테스트 증거)
```

**CoolHan 규칙:**
- 배포용 빌드는 Xcode Organizer → Archive → Distribute App → App Store Connect
- TestFlight 외부 테스터 초대는 앱 심사 불필요 (최초 빌드만 심사)
- 앱 아이콘: 1024×1024 PNG (알파 채널 없음), Assets.xcassets에 일괄 관리

---

## 섹션 10: 접근성 & 국제화

```swift
// VoiceOver 지원
button.accessibilityLabel = "검색 버튼"
button.accessibilityHint = "탭하면 검색 결과로 이동합니다"
button.isAccessibilityElement = true

// 동적 타입 (Dynamic Type)
label.font = UIFont.preferredFont(forTextStyle: .body)
label.adjustsFontForContentSizeCategory = true

// 국제화 (i18n)
// Localizable.strings 파일 → NSLocalizedString("key", comment: "")
// Info.plist: CFBundleDevelopmentRegion, CFBundleLocalizations
// Xcode: Product → Export Localizations → XLIFF 파일
```

**CoolHan 규칙:**
- 최소 VoiceOver 레이블, 동적 타입 지원은 P0 요구사항
- 하드코딩 문자열 금지. 반드시 NSLocalizedString 사용
- 날짜/통화/숫자 포맷은 Locale.current 기반 DateFormatter / NumberFormatter 사용

---

**문서 버전:** 1.0.0 | **작성일:** 2026-06-13 | **대상 OS:** iOS 15+
