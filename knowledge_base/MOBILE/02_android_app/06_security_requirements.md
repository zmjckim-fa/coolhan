# Android 앱 보안 요구사항 (Security Requirements)

## 1. 인증 & 자격증명 관리

### 1.1 토큰 저장 규칙
```
필수:
✅ 인증 토큰 → EncryptedSharedPreferences (Android Keystore AES256 기반)
✅ SharedPreferences 평문 저장 금지
✅ 내부 저장소 평문 파일 저장 금지 (역공학 가능)
✅ 앱 로그(Logcat)에 토큰 출력 금지
✅ 로그아웃 시 EncryptedSharedPreferences 전체 삭제
✅ 앱 제거 시 EncryptedSharedPreferences 자동 삭제 (Android OS 보장)

EncryptedSharedPreferences 설정:
MasterKey: AES256_GCM
Key 암호화: AES256_SIV
Value 암호화: AES256_GCM
Hardware-backed 키 저장 (기기 지원 시 StrongBox)
```

### 1.2 세션 관리
```
세션 만료:
- 백그라운드 15분 초과 시 재인증 요구
- 구현: App lifecycle observer + 타임스탬프 비교
- ForegroundService 실행 중이면 세션 유지 가능

토큰 만료 처리:
- 액세스 토큰: 1시간 이하 (401 수신 시 자동 갱신)
- 리프레시 토큰: 30일 이하 (갱신 실패 시 재로그인)
- 갱신 중복 방지: Mutex 잠금 (TokenManager 참고)
```

---

## 2. 네트워크 보안

### 2.1 Network Security Configuration
```xml
<!-- res/xml/network_security_config.xml -->
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <!-- 프로덕션: HTTPS 강제, 시스템 CA만 신뢰 -->
    <base-config cleartextTrafficPermitted="false">
        <trust-anchors>
            <certificates src="system"/>
        </trust-anchors>
    </base-config>

    <!-- 개발 환경만: 사용자 CA 신뢰 (디버그 빌드) -->
    <debug-overrides>
        <trust-anchors>
            <certificates src="system"/>
            <certificates src="user"/>
        </trust-anchors>
    </debug-overrides>

    <!-- 특정 도메인 예외 (불가피한 경우) -->
    <!-- 절대 cleartextTrafficPermitted="true" 전역 설정 금지 -->
</network-security-config>

<!-- AndroidManifest.xml -->
<application
    android:networkSecurityConfig="@xml/network_security_config"
    ...>
```

### 2.2 인증서 고정 (Certificate Pinning, 선택)
```kotlin
// OkHttp CertificatePinner
val certificatePinner = CertificatePinner.Builder()
    .add("api.example.com", "sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=")
    .add("api.example.com", "sha256/BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB=") // 백업 핀
    .build()

OkHttpClient.Builder().certificatePinner(certificatePinner).build()

// 주의:
// - 인증서 교체 시 앱 업데이트 필요 (백업 핀 2개 이상 유지)
// - Public Key Pinning 방식이 인증서 교체에 더 유연함
// - 금융/의료 앱에서 권장, 일반 앱은 NSC로 충분
```

### 2.3 ProGuard 로깅 제거
```proguard
# 릴리스 빌드: 로그 제거
-assumenosideeffects class android.util.Log {
    public static *** d(...);
    public static *** v(...);
    public static *** i(...);
}
# 주의: 릴리스에서 Timber 디버그 트리 미등록 필수
```

---

## 3. 데이터 보안

### 3.1 민감 데이터 분류
| 등급 | 데이터 예시 | 저장 위치 | 암호화 |
|------|-----------|---------|--------|
| P0 | 인증 토큰, 패스워드, 결제 키 | EncryptedSharedPreferences | Android Keystore |
| P1 | 주민번호, 카드번호(마스킹) | EncryptedFile + Room | AES-256 |
| P2 | 개인정보(이름/전화) | Room Database | 파일 암호화 |
| P3 | 사용자 콘텐츠, 설정 | Room / DataStore | OS 내부 저장소 보호 |
| P4 | 캐시, 분석 | 내부/외부 Caches | 불필요 |

### 3.2 파일 암호화 (EncryptedFile)
```kotlin
// 민감 파일 암호화 저장 (P1 등급)
val masterKey = MasterKey.Builder(context)
    .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
    .setRequestStrongBoxBacked(true)  // StrongBox 요청 (지원 기기)
    .build()

val encryptedFile = EncryptedFile.Builder(
    context,
    File(context.filesDir, "sensitive_data.enc"),
    masterKey,
    EncryptedFile.FileEncryptionScheme.AES256_GCM_HKDF_4KB
).build()

// 쓰기
encryptedFile.openFileOutput().use { out -> out.write(data) }
// 읽기
val data = encryptedFile.openFileInput().use { it.readBytes() }
```

### 3.3 외부 저장소 사용 금지
```
금지:
❌ 민감 데이터를 외부 저장소(/sdcard)에 저장
❌ MODE_WORLD_READABLE / MODE_WORLD_WRITEABLE 파일 권한

허용:
✅ 사용자 공유 파일 (사진, 문서)만 MediaStore / SAF(Storage Access Framework) 사용
✅ 앱 전용 파일은 반드시 내부 저장소 (context.filesDir)
```

### 3.4 메모리 보안
```kotlin
// 패스워드 필드: 입력 완료 후 즉시 초기화
val password = passwordEditText.text?.toString()
try {
    // 사용
} finally {
    passwordEditText.text?.clear()  // UI 클리어
    // 문자열은 GC 의존 → char[] 사용이 더 안전 (Java 방식)
}

// 백그라운드 스크린샷 방지
override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    window.setFlags(WindowManager.LayoutParams.FLAG_SECURE,
                    WindowManager.LayoutParams.FLAG_SECURE)
    // FLAG_SECURE: 스크린샷, 화면 녹화, 최근 앱 썸네일 차단
}
```

---

## 4. 코드 & 빌드 보안

### 4.1 API 키 관리
```
금지:
❌ 소스코드 하드코딩: val API_KEY = "secret"
❌ strings.xml 평문 저장 (리소스 파일도 역공학 가능)
❌ Git 저장소에 시크릿 파일 커밋

허용:
✅ local.properties (gitignore 추가 필수) → BuildConfig 주입
✅ CI/CD 환경변수 → Gradle 빌드 시 주입
✅ 런타임 서버 요청 (Secrets Manager 경유)
```

```kotlin
// local.properties (gitignore):
// API_KEY=your_key_here

// build.gradle.kts:
val apiKey = project.findProperty("API_KEY") as String? ?: ""
android {
    buildTypes {
        release {
            buildConfigField("String", "API_KEY", "\"$apiKey\"")
        }
    }
}

// 코드에서:
val key = BuildConfig.API_KEY
```

### 4.2 루팅 탐지
```kotlin
fun isRooted(): Boolean {
    val paths = listOf("/system/app/Superuser.apk", "/sbin/su", "/system/bin/su",
                       "/system/xbin/su", "/data/local/xbin/su", "/data/local/bin/su",
                       "/system/sd/xbin/su", "/system/bin/failsafe/su")
    return paths.any { File(it).exists() } ||
           runCatching { Runtime.getRuntime().exec(arrayOf("/system/xbin/which", "su")) }
               .getOrNull()?.inputStream?.bufferedReader()?.readLine()?.isNotEmpty() == true
}
// 루팅 탐지 시: 앱 종료 또는 제한 모드 (금융/의료)
// 완벽한 탐지 불가 → 다층 방어의 1레이어로만 취급
```

### 4.3 ProGuard / R8 설정
```proguard
# 기본 난독화 설정 (build.gradle.kts)
# minifyEnabled = true (Release 빌드)
# shrinkResources = true (미사용 리소스 제거)

# 데이터 클래스 보호 (Gson/Retrofit 모델)
-keep class com.example.app.data.model.** { *; }
-keepclassmembers class com.example.app.data.model.** { *; }

# Retrofit
-keepattributes Signature, Exceptions, *Annotation*
-keep interface com.example.app.data.remote.ApiService { *; }
```

### 4.4 릴리스 빌드 체크리스트
```
빌드 설정:
☐ minifyEnabled = true
☐ shrinkResources = true
☐ debuggable = false
☐ ProGuard/R8 규칙 검토

코드:
☐ Logcat 출력이 릴리스에서 비활성화됨
☐ Debug 전용 코드 제거 (BuildConfig.DEBUG 확인)
☐ API 키가 BuildConfig/서버 경유로 처리됨
☐ 테스트 계정/더미 데이터 없음
```

---

## 5. Android 권한 보안

### 5.1 최소 권한 원칙
```xml
<!-- 필요한 권한만 선언 -->
<!-- 미선언 권한은 OS가 자동 차단 -->

<!-- 인터넷 (Normal Permission - 자동 부여) -->
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

<!-- 카메라 (Dangerous Permission - 런타임 요청) -->
<uses-permission android:name="android.permission.CAMERA" />

<!-- 저장소 (API 32 이하, 33+는 READ_MEDIA_IMAGES 사용) -->
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"
    android:maxSdkVersion="32" />
```

### 5.2 런타임 권한 요청 패턴
```kotlin
// ActivityResultContracts 사용 (권장)
private val requestCameraPermission = registerForActivityResult(
    ActivityResultContracts.RequestPermission()
) { isGranted ->
    if (isGranted) openCamera()
    else showPermissionDeniedUI() // 설정 앱 안내
}

// 요청 시점: 기능 사용 직전 (맥락 제공)
binding.btnTakePhoto.setOnClickListener {
    requestCameraPermission.launch(Manifest.permission.CAMERA)
}

// 권한 거부 처리 (설정 앱 안내)
fun showPermissionDeniedUI() {
    MaterialAlertDialogBuilder(this)
        .setTitle("카메라 권한 필요")
        .setMessage("프로필 사진 촬영을 위해 카메라 권한이 필요합니다. 설정에서 허용해 주세요.")
        .setPositiveButton("설정으로 이동") { _, _ ->
            startActivity(Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                data = Uri.fromParts("package", packageName, null)
            })
        }
        .setNegativeButton("취소", null)
        .show()
}
```

---

## 6. Google Play 컴플라이언스

```
필수 정책 준수:
☐ 개인정보처리방침 URL (앱 스토어 + 앱 내)
☐ 타겟 SDK: Android 최신 버전 -1 이상 (Google Play 정책)
☐ 결제: Google Play Billing Library 최신 버전 (인앱결제 앱)
☐ 위치 권한: 백그라운드 위치는 Policy 사전 승인 필요
☐ 아동용 앱: 아동 온라인 개인정보 보호법(COPPA) 준수

데이터 보안 섹션 (Play Console 필수):
☐ 수집 데이터 유형 선언
☐ 공유 여부 (제3자)
☐ 암호화 처리 여부
☐ 삭제 요청 처리 방식
```

---

**문서 버전:** 1.0.0 | **작성일:** 2026-06-13 | **대상 OS:** Android 8.0(API 26)+ | **준거:** OWASP Mobile Top 10 2024
