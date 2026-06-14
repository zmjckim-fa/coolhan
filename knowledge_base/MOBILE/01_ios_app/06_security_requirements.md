# iOS 앱 보안 요구사항 (Security Requirements)

## 1. 인증 & 권한 부여

### 1.1 토큰 관리
```
필수 규칙:
✅ 인증 토큰은 Keychain에만 저장 (kSecAttrAccessibleWhenUnlockedThisDeviceOnly)
✅ UserDefaults, .plist, 소스코드에 토큰 저장 금지
✅ 액세스 토큰 만료: 1시간 이하 권장
✅ 리프레시 토큰 만료: 30일 이하
✅ 앱 삭제 시 Keychain 항목 삭제 (기본적으로 앱 삭제 후에도 유지됨 → 명시적 삭제 로직 필요)
✅ 사용자 로그아웃 시 모든 Keychain 항목 삭제
```

### 1.2 생체 인증 보안
```
LAPolicy 선택:
.deviceOwnerAuthenticationWithBiometrics  → 생체만 (패스코드 폴백 없음)
.deviceOwnerAuthentication                → 생체 + 패스코드 폴백

보안 토큰 방식 (권장):
- Keychain + kSecAttrAccessControl + biometryCurrentSet 결합
- 생체 정보 변경 시 토큰 무효화 (다시 로그인 요구)
SecAccessControlCreateWithFlags(
    nil, kSecAttrAccessibleWhenUnlockedThisDeviceOnly,
    .biometryCurrentSet, nil
)
```

### 1.3 세션 관리
```
세션 타임아웃: 백그라운드 진입 후 15분 이상 경과 시 재인증 요구
구현:
- appDidEnterBackground: 타임아웃 타이머 시작
- appWillEnterForeground: 경과 시간 체크 → 임계 초과 시 잠금 화면
- LAContext 인스턴스는 재사용 금지 (매번 새로 생성)
```

---

## 2. 네트워크 보안

### 2.1 App Transport Security (ATS)
```xml
<!-- Info.plist 기본값: 모든 HTTP 차단 -->
<key>NSAppTransportSecurity</key>
<dict>
    <!-- 프로덕션: 추가 설정 없음 (HTTPS 강제) -->

    <!-- 특정 도메인만 HTTP 허용 (불가피한 경우) -->
    <key>NSExceptionDomains</key>
    <dict>
        <key>legacy.example.com</key>
        <dict>
            <key>NSExceptionAllowsInsecureHTTPLoads</key>
            <true/>
            <key>NSExceptionRequiresForwardSecrecy</key>
            <false/>
        </dict>
    </dict>
</dict>

금지:
NSAllowsArbitraryLoads = true  → 전면 HTTP 허용 (심사 거부 위험)
```

### 2.2 Certificate Pinning (선택적)
```swift
// URLSessionDelegate로 인증서 고정
func urlSession(_ session: URLSession, didReceive challenge: URLAuthenticationChallenge,
                completionHandler: @escaping (URLSession.AuthChallengeDisposition, URLCredential?) -> Void) {
    guard challenge.protectionSpace.authenticationMethod == NSURLAuthenticationMethodServerTrust,
          let serverTrust = challenge.protectionSpace.serverTrust else {
        completionHandler(.cancelAuthenticationChallenge, nil)
        return
    }
    // 번들 내 .cer 파일과 서버 인증서 비교
    if certificateMatches(serverTrust) {
        completionHandler(.useCredential, URLCredential(trust: serverTrust))
    } else {
        completionHandler(.cancelAuthenticationChallenge, nil)
    }
}
// 주의: 인증서 교체 시 앱 업데이트 필요. Public Key Pinning 방식이 더 유연함.
```

### 2.3 요청/응답 보안
```
필수:
✅ HTTPS only (TLS 1.2+)
✅ Authorization 헤더 로그 출력 금지
✅ 민감 데이터(패스워드, 카드번호)는 요청 바디에서도 마스킹 후 로깅
✅ API 키는 앱 번들에 하드코딩 금지 → 서버 측 게이트웨이 경유 또는 환경변수(빌드 시 주입)
```

---

## 3. 데이터 보안

### 3.1 민감 데이터 분류
| 등급 | 데이터 예시 | 저장 위치 | 암호화 |
|------|------------|---------|--------|
| P0 (최고) | 인증 토큰, 패스워드, 생체키 | Keychain | OS 자동 (Secure Enclave) |
| P1 (높음) | 개인식별정보(이름/전화/주소) | Core Data + 파일 암호화 | 앱 레벨 AES-256 |
| P2 (중간) | 사용자 콘텐츠, 설정 | Core Data / UserDefaults | OS 파일 보호 |
| P3 (낮음) | 캐시, 분석 데이터 | Caches/ | 불필요 |

### 3.2 파일 보호 수준 (Data Protection)
```swift
// Core Data 영구 저장소에 파일 보호 적용
let options: [AnyHashable: Any] = [
    NSPersistentStoreFileProtectionKey: FileProtectionType.complete
    // .complete: 기기 잠금 중 접근 불가 (가장 강력)
    // .completeUnlessOpen: 이미 열린 파일은 잠금 중에도 접근 가능
    // .completeUntilFirstUserAuthentication: 첫 부팅 후 잠금 해제까지만 보호
]

// 일반 파일
try data.write(to: url, options: [.completeFileProtection])
```

### 3.3 메모리 보안
```
필수:
✅ 패스워드/PIN 입력 후 UITextField.text = "" (메모리에서 즉시 제거)
✅ 스크린샷 방지: 백그라운드 진입 시 스크린샷 오버레이 표시
```

```swift
// 백그라운드 스크린샷 방지 패턴
func applicationWillResignActive(_ application: UIApplication) {
    let overlay = UIView(frame: window.bounds)
    overlay.backgroundColor = .systemBackground
    overlay.tag = 9999
    window.addSubview(overlay)
}
func applicationDidBecomeActive(_ application: UIApplication) {
    window.viewWithTag(9999)?.removeFromSuperview()
}
```

---

## 4. 코드 & 빌드 보안

### 4.1 API 키 관리
```
금지:
❌ 소스코드 하드코딩: let apiKey = "sk-abc123"
❌ .plist 평문 저장 (역공학 가능)
❌ Git 커밋에 시크릿 포함

허용:
✅ Xcode Build Configuration + xcconfig 파일
✅ 빌드 시 환경변수 주입 (CI/CD)
✅ 런타임 서버 요청 (Secrets Manager 경유)
✅ 난독화 도구 (경미한 보호, 근본 해결책 아님)
```

### 4.2 Jailbreak / 루팅 탐지
```swift
func isJailbroken() -> Bool {
    #if targetEnvironment(simulator)
    return false
    #else
    let paths = ["/Applications/Cydia.app", "/usr/sbin/sshd",
                 "/bin/bash", "/etc/apt", "/private/var/lib/apt/"]
    return paths.contains { FileManager.default.fileExists(atPath: $0) }
    #endif
}
// 탐지 시 처리: 앱 종료 또는 제한 모드 (금융/의료 앱에서 중요)
// 주의: 완벽한 탐지는 불가능. 다층 방어의 한 레이어로만 사용.
```

### 4.3 코드 서명 & 무결성
```
배포 체크리스트:
✅ Distribution 인증서로 빌드 (Development 인증서 금지)
✅ Bitcode 비활성화 (Xcode 14+ 기본값)
✅ Strip Debug Symbols: YES (Release)
✅ Enable Hardened Runtime (macOS 배포 시)
✅ Validate App: YES (앱스토어 제출 전 Xcode Validate 실행)
```

---

## 5. 개인정보 & 앱 스토어 컴플라이언스

### 5.1 Privacy Nutrition Labels (필수)
```
앱 스토어 커넥트에서 선언해야 하는 데이터 유형:
수집 데이터 → 사용 목적 → 추적 여부 선택

예시 선언:
- 이름, 이메일: 앱 기능 → 추적 안 함
- 결제 정보: 앱 기능 + 결제 처리 → 추적 안 함
- 위치: 앱 기능 → 추적 안 함
- 기기 ID: 분석 → 추적 선택 시 ATT 동의 필요
```

### 5.2 App Tracking Transparency (ATT)
```swift
import AppTrackingTransparency
// iOS 14.5+ 필수 (광고 추적 시)
ATTrackingManager.requestTrackingAuthorization { status in
    switch status {
    case .authorized: // 추적 허용
    case .denied, .restricted, .notDetermined: // 추적 금지
    @unknown default: break
    }
}
// Info.plist: NSUserTrackingUsageDescription (목적 설명 필수)
// 앱 실행 후 첫 상호작용 이후에 요청 (즉시 요청 시 심사 거부 위험)
```

### 5.3 권한 요청 가이드라인
```
원칙: 필요한 시점에, 맥락과 함께 요청

✅ 올바른 요청 시점:
  - 카메라: 프로필 사진 변경 버튼 탭 시
  - 위치: 배달 주소 확인 버튼 탭 시
  - 알림: 주문 완료 시 "배송 알림 받겠습니까?" 물어볼 때

❌ 잘못된 요청 시점:
  - 앱 시작 즉시 모든 권한 일괄 요청
  - 기능 사용 맥락 없이 팝업

권한 거부 시: 설정 앱으로 안내하는 커스텀 UI 제공
```

---

## 6. 취약점 체크리스트 (배포 전)

```
인증:
☐ 토큰이 Keychain에만 저장됨
☐ 자동 로그아웃(15분 타임아웃) 작동
☐ 루트/비인가 API 엔드포인트 없음

네트워크:
☐ ATS 비활성화(NSAllowsArbitraryLoads) 없음
☐ 모든 API 통신 HTTPS
☐ Authorization 헤더 로그에 미출력

데이터:
☐ 민감 데이터가 UserDefaults에 없음
☐ 로그에 PII(개인식별정보) 출력 없음
☐ 백그라운드 스크린샷 보호 작동

코드:
☐ 소스코드에 API 키 없음
☐ Release 빌드에서 Debug 심볼 제거됨
☐ 테스트/더미 계정 정보 없음
```

---

**문서 버전:** 1.0.0 | **작성일:** 2026-06-13 | **대상 OS:** iOS 15+ | **준거:** OWASP Mobile Top 10 2024
