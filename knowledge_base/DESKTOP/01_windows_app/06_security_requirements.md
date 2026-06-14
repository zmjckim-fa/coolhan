# Windows 데스크탑 앱 보안 요구사항 (Security Requirements)

## 1. 인증 & 자격증명 관리

### 1.1 토큰 저장 규칙

```
필수:
✅ 인증 토큰 → Windows Credential Manager (CredWrite/CredRead Win32 API)
✅ 파일/레지스트리 평문 저장 금지
✅ 앱 설정(AppSettings.json) 토큰 저장 금지
✅ 로그/이벤트 뷰어에 토큰 출력 금지
✅ 로그아웃 시 Credential Manager 엔트리 삭제 (CredDelete)
✅ 앱 제거 시 Credential Manager 엔트리 수동 삭제 (제거 스크립트 포함)

대안 (Credential Manager 불가 시):
DPAPI (Data Protection API)로 암호화 후 %AppData% 저장:
var encrypted = ProtectedData.Protect(
    System.Text.Encoding.UTF8.GetBytes(token),
    entropy: null,
    scope: DataProtectionScope.CurrentUser);  // 현재 Windows 사용자만 복호화 가능
File.WriteAllBytes(tokenPath, encrypted);
```

### 1.2 세션 관리

```
세션 만료:
- 비활성(포커스 없음) 15분 초과 시 재인증 요구
- 구현: DispatcherTimer + 마지막 활동 타임스탬프 비교
- MainWindow.Deactivated → 타이머 시작, Activated → 타이머 리셋

토큰 만료 처리:
- 액세스 토큰: 1시간 이하 (401 수신 시 자동 갱신)
- 리프레시 토큰: 30일 이하 (갱신 실패 시 재로그인)
- 갱신 중복 방지: SemaphoreSlim(1,1) (TokenStore 참고)
```

---

## 2. 네트워크 보안

### 2.1 HTTPS 강제

```csharp
// HttpClient 설정 (TLS 1.2+ 강제)
var handler = new HttpClientHandler
{
    SslProtocols = System.Security.Authentication.SslProtocols.Tls12
                 | System.Security.Authentication.SslProtocols.Tls13,
    CheckCertificateRevocationList = true  // OCSP/CRL 확인
};

// 금지: HTTP 평문 연결 (개발 환경 포함)
// 허용: localhost 개발 서버만 예외 (DEBUG 빌드에서만)
#if DEBUG
handler.ServerCertificateCustomValidationCallback = (msg, cert, chain, errors) =>
    msg.RequestUri?.Host == "localhost" || errors == System.Net.Security.SslPolicyErrors.None;
#endif
```

### 2.2 인증서 고정 (Certificate Pinning, 선택)

```csharp
// 고위험 앱(금융/의료)에서 권장
var handler = new HttpClientHandler();
handler.ServerCertificateCustomValidationCallback = (message, cert, chain, errors) =>
{
    if (errors != System.Net.Security.SslPolicyErrors.None) return false;

    // Public Key Hash 고정 (인증서 갱신에 더 유연)
    var pubKeyHash = Convert.ToBase64String(
        System.Security.Cryptography.SHA256.HashData(cert!.GetPublicKey()));

    var pinnedHashes = new[] {
        "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",  // 운영 인증서
        "BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB="   // 백업 핀 (필수 — 갱신 시 앱 업데이트 없이 교체)
    };
    return pinnedHashes.Contains(pubKeyHash);
};
// 주의: 백업 핀 없으면 인증서 갱신 시 앱 연결 불가 → 백업 핀 2개 이상 유지
```

### 2.3 로깅 보안

```csharp
// 릴리스 빌드 로깅 규칙
// - Serilog/NLog 사용 시 릴리스에서 Debug/Verbose 레벨 제거
// - 파일 로그: %LocalAppData%\{App}\Logs\ (Sensitive 데이터 제외)

// NLog.config 릴리스 설정 예시:
// <rules>
//   <logger name="*" minlevel="Warning" writeTo="file"/>  <!-- Debug/Info 제거 -->
// </rules>

// 금지 패턴
logger.Debug($"Token: {accessToken}");  // ❌ 절대 금지
logger.Debug($"User: {user.Email}");    // ❌ PII 로그 금지
logger.Warning("Token refresh failed"); // ✅ 사건만 기록
```

---

## 3. 데이터 보안

### 3.1 민감 데이터 분류

| 등급 | 데이터 예시 | 저장 위치 | 암호화 |
|------|-----------|---------|--------|
| P0 | 인증 토큰, 패스워드 | Windows Credential Manager | OS 키링 |
| P1 | 주민번호, 카드번호 | DPAPI 암호화 파일 | AES-256 (CurrentUser) |
| P2 | 이름, 이메일, 전화번호 | SQLite (일반) | 파일 시스템 ACL |
| P3 | 주문내역, 설정, 캐시 | SQLite / AppData | OS 사용자 격리 |
| P4 | 익명 분석, 로그 | 로컬 파일 | 불필요 |

### 3.2 SQLite 파일 보안

```csharp
// SQLite 데이터베이스 암호화 (SQLCipher — P1 데이터 포함 시)
// NuGet: SQLitePCLRaw.bundle_sqlcipher
var connString = $"Data Source={dbPath};Password={GetDbKey()}";

// DB 키 도출 (DPAPI 기반)
private static string GetDbKey()
{
    var keyPath = Path.Combine(AppDataDir, ".dbkey");
    if (!File.Exists(keyPath))
    {
        // 최초 실행: 랜덤 키 생성 + DPAPI 암호화 저장
        var rawKey = System.Security.Cryptography.RandomNumberGenerator.GetBytes(32);
        var encrypted = ProtectedData.Protect(rawKey, null, DataProtectionScope.CurrentUser);
        File.WriteAllBytes(keyPath, encrypted);
    }
    var encryptedKey = File.ReadAllBytes(keyPath);
    var key = ProtectedData.Unprotect(encryptedKey, null, DataProtectionScope.CurrentUser);
    return Convert.ToHexString(key);
}

// P0/P1 데이터만 있는 일반 앱: SQLCipher 생략 가능
// → %LocalAppData% 파일은 현재 Windows 사용자만 접근 가능 (ACL 기본 적용)
```

### 3.3 메모리 보안

```csharp
// 패스워드 필드: 사용 후 즉시 초기화
// WPF PasswordBox: SecureString 사용 (평문 string 변환 최소화)
var securePass = passwordBox.SecurePassword;  // SecureString 직접 사용

// 부득이하게 string 변환 시:
var ptr = Marshal.SecureStringToGlobalAllocUnicode(securePass);
try { var password = Marshal.PtrToStringUni(ptr)!; /* 최단 사용 */ }
finally { Marshal.ZeroFreeGlobalAllocUnicode(ptr); }  // 메모리 즉시 소거

// 스크린샷 방지 (금융/의료 앱)
// WinUI 3:
window.ExtendsContentIntoTitleBar = true;
// ... InputNonClientPointerSource 기반 WDA_MONITOR 설정

// WPF:
[DllImport("user32.dll", SetLastError = true)]
static extern uint SetWindowDisplayAffinity(IntPtr hwnd, uint affinity);
const uint WDA_MONITOR = 0x00000001;  // 화면 캡처 차단

var hwnd = new WindowInteropHelper(mainWindow).Handle;
SetWindowDisplayAffinity(hwnd, WDA_MONITOR);
```

---

## 4. 코드 & 빌드 보안

### 4.1 API 키 관리

```
금지:
❌ 소스코드 하드코딩: const string API_KEY = "secret"
❌ appsettings.json 평문 저장 (Git 커밋 가능)
❌ .env 파일 커밋

허용:
✅ 사용자별 설정: Windows Credential Manager
✅ 빌드 시 주입: MSBuild 환경변수 → #if RELEASE 조건부 컴파일
✅ 런타임 서버 요청: Secrets Manager API 경유
```

```csharp
// appsettings.Development.json (gitignore 추가) — 개발 환경 API 키
{
    "ApiSettings": { "BaseUrl": "http://localhost:3000/api" }
}

// .csproj 빌드 시 환경변수 주입 예시
<PropertyGroup Condition="'$(Configuration)' == 'Release'">
    <DefineConstants>PRODUCTION</DefineConstants>
</PropertyGroup>

// 코드에서
#if PRODUCTION
    private const string ApiBase = "https://api.production.com";
#else
    private const string ApiBase = "http://localhost:3000";
#endif
```

### 4.2 코드 서명 & 무결성

```
배포 전 필수:
☐ 실행 파일(.exe/.dll) 코드 서명 (Authenticode)
  - EV (Extended Validation) 인증서 권장 (SmartScreen 즉시 신뢰)
  - Standard OV는 평판 축적까지 경고 표시 가능

서명 명령:
signtool sign /fd sha256 /tr http://timestamp.digicert.com /td sha256
              /f certificate.pfx /p {password} MyApp.exe

MSIX 패키지 서명:
SignTool sign /fd SHA256 /a /f cert.pfx /p pass MyApp.msix

☐ 패키지 무결성: MSIX 자체 해시 검증 내장
☐ 체인 신뢰: 인증서 체인 전체가 신뢰할 수 있는 CA까지 연결
```

### 4.3 릴리스 빌드 체크리스트

```
빌드 설정:
☐ 디버그 심볼(.pdb) 사용자 배포 제외 (별도 Symbol Server 보관)
☐ RELEASE 빌드 구성 사용 (DEBUG 조건부 코드 제외)
☐ 불필요한 WinForms Designer DLL 제외

코드:
☐ Debug.WriteLine / Console.WriteLine 릴리스 미출력 확인
☐ 개발 API 엔드포인트 → 프로덕션 엔드포인트 확인
☐ Swagger/개발 도구 UI 비활성화
☐ 테스트 계정/더미 데이터 없음

패키지:
☐ NuGet 패키지 최신 보안 패치 적용
☐ dotnet list package --vulnerable 실행하여 취약점 확인
```

---

## 5. Windows 보안 기능 활용

### 5.1 Windows Hello (생체 인증)

```csharp
// Microsoft.Windows.SDK.Contracts NuGet 필요
using Windows.Security.Credentials.UI;

public static async Task<bool> VerifyWithWindowsHelloAsync(string message)
{
    var result = await UserConsentVerifier.RequestVerificationAsync(message);
    return result == UserConsentVerificationResult.Verified;
}

// 사용 예 — 중요 작업 전 재인증
if (!await VerifyWithWindowsHelloAsync("결제를 진행하려면 인증해 주세요"))
    return; // 인증 거부 또는 실패

// 지원 여부 확인 (Windows Hello PIN/지문/얼굴인식 등록 필요)
var availability = await UserConsentVerifier.CheckAvailabilityAsync();
bool isSupported = availability == UserConsentVerifierAvailability.Available;
```

### 5.2 앱 격리 (MSIX 샌드박스)

```
Microsoft Store / MSIX 패키지 배포 시:
- 파일 시스템: %AppData%/LocalAppData에만 쓰기 가능 (자동 가상화)
- 레지스트리: HKCU\Software\{AppName}만 접근 가능
- 네트워크: 선언된 capabilities만 허용 (Package.appxmanifest)

package.appxmanifest 필수 선언:
<Capabilities>
    <Capability Name="internetClient"/>          <!-- 인터넷 접근 -->
    <DeviceCapability Name="webcam"/>            <!-- 카메라 (필요 시) -->
    <DeviceCapability Name="location"/>          <!-- 위치 (필요 시) -->
</Capabilities>
```

### 5.3 UAC (User Account Control)

```xml
<!-- 관리자 권한 불필요한 앱: asInvoker (기본값, 권장) -->
<requestedExecutionLevel level="asInvoker" uiAccess="false"/>

<!-- 관리자 권한 필수인 경우만 (설치 관리자 등) -->
<requestedExecutionLevel level="requireAdministrator" uiAccess="false"/>

<!-- 원칙: 최소 권한. 관리자 권한 요청 = 사용자에게 UAC 프롬프트 → 거부 가능성 높음 -->
```

---

## 6. 개인정보 & 컴플라이언스

```
Microsoft Store 앱:
☐ 개인정보처리방침 URL 필수 (파트너 센터 등록 + 앱 내 링크)
☐ 수집 데이터 유형 선언
☐ 아동 앱: COPPA 준수 (12세 이하 대상 시)

데이터 삭제 요청 처리:
- 사용자가 계정 삭제 요청 시 → 로컬 DB + Credential Manager + AppData 데이터 삭제
- 원격 서버 데이터 삭제는 별도 API 호출

GDPR / 개인정보보호법 (해당 시):
- 데이터 수출: 사용자 데이터 JSON/CSV 내보내기 기능
- 데이터 삭제 확인: 삭제 후 30일 보존 없음 확인
- 로컬 데이터 암호화: P1 등급 이상 DPAPI/SQLCipher 적용
```

---

**문서 버전:** 1.0.0 | **작성일:** 2026-06-13 | **대상 OS:** Windows 10 1809+ | **준거:** OWASP Desktop Security 2024
