# Android 앱 핵심 기능 (Core Features)

## 섹션 1: 앱 생명주기 (App Lifecycle)

```
Activity 상태 전이:
Created → Started → Resumed (포그라운드, 사용자 상호작용)
  → Paused (부분 가림) → Stopped (완전 배경) → Destroyed

Activity 콜백:
  onCreate()       → 초기화, View 바인딩
  onStart()        → 화면 진입
  onResume()       → 포그라운드 (입력 포커스)
  onPause()        → 미저장 데이터 저장, 애니메이션 중지
  onStop()         → 리소스 해제
  onDestroy()      → 정리
  onSaveInstanceState() → 상태 저장 (번들)

Fragment 생명주기:
  onCreateView() / onViewCreated() / onDestroyView()
  (Activity 생명주기 내 중첩)

Jetpack Compose:
  Composable은 Activity/Fragment를 컨테이너로 사용
  LaunchedEffect, DisposableEffect로 생명주기 연동
```

**CoolHan 규칙:**
- `onPause()`에서 미저장 상태 flush (네트워크 요청 중 화면 나갈 수 있음)
- ViewModel은 화면 회전에도 유지됨 (`onDestroy → onCreate` 사이클 무관)
- WorkManager로 백그라운드 작업 스케줄링 (백그라운드 실행 제한 준수)

---

## 섹션 2: 네비게이션 & 라우팅

```
Jetpack Navigation Component (권장):
  NavGraph (.xml 또는 Kotlin DSL)
    ├─ NavHostFragment (컨테이너)
    └─ NavController.navigate(R.id.action_A_to_B)

Compose Navigation:
  NavHost(navController, startDestination = "home") {
      composable("home") { HomeScreen() }
      composable("detail/{id}") { backStackEntry ->
          val id = backStackEntry.arguments?.getString("id")
          DetailScreen(id)
      }
  }
  navController.navigate("detail/$productId")

딥링크:
  AndroidManifest.xml의 <intent-filter>:
    <action android:name="android.intent.action.VIEW" />
    <data android:scheme="myapp" android:host="product" />
  또는 App Link (https, 도메인 소유 검증 필요)
```

**CoolHan 규칙:**
- Back Stack 관리: `navigate()` 옵션으로 `popUpTo` 설정하여 불필요한 스택 제거
- 화면 결과 전달: `setFragmentResult` / Compose의 `NavController.previousBackStackEntry?.savedStateHandle`

---

## 섹션 3: 데이터 저장

```
계층별 저장 전략:
┌────────────────────────────┬──────────────────────────────┐
│ 데이터 유형                │ 저장소                       │
├────────────────────────────┼──────────────────────────────┤
│ 민감 데이터 (토큰/패스워드)│ Android Keystore + EncryptedSharedPreferences │
│ 사용자 설정 (소량)         │ DataStore (Preferences)      │
│ 구조화 데이터 (엔티티)     │ Room Database (SQLite)        │
│ 파일 (이미지/문서)         │ Internal Storage / MediaStore │
│ 앱 간 공유 데이터          │ ContentProvider              │
└────────────────────────────┴──────────────────────────────┘

Room Database 구조:
@Database(entities = [User::class, Product::class], version = 1)
abstract class AppDatabase : RoomDatabase() {
    abstract fun userDao(): UserDao
    abstract fun productDao(): ProductDao
}
// 싱글톤으로 관리, Room.databaseBuilder 사용

DataStore (SharedPreferences 대체):
val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "settings")
val HAS_ONBOARDED = booleanPreferencesKey("has_onboarded")
```

**CoolHan 규칙:**
- Room은 Main Thread에서 직접 호출 금지 → Coroutine Dispatcher.IO 사용
- EncryptedSharedPreferences로 토큰 저장 (Android Keystore 기반)
- 이미지 캐싱: Coil 또는 Glide 라이브러리 사용 (직접 구현 금지)

---

## 섹션 4: 네트워킹 (Retrofit + OkHttp)

```kotlin
// Retrofit 클라이언트 설정
val okHttpClient = OkHttpClient.Builder()
    .addInterceptor(AuthInterceptor(tokenManager))
    .addInterceptor(HttpLoggingInterceptor().apply {
        level = if (BuildConfig.DEBUG)
            HttpLoggingInterceptor.Level.BODY
        else HttpLoggingInterceptor.Level.NONE
    })
    .connectTimeout(30, TimeUnit.SECONDS)
    .readTimeout(30, TimeUnit.SECONDS)
    .build()

val retrofit = Retrofit.Builder()
    .baseUrl(BuildConfig.API_BASE_URL)
    .client(okHttpClient)
    .addConverterFactory(GsonConverterFactory.create())
    .build()

// API 인터페이스
interface ApiService {
    @GET("products")
    suspend fun getProducts(
        @Query("page") page: Int,
        @Query("per_page") perPage: Int = 20
    ): Response<ApiResponse<List<Product>>>

    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): Response<ApiResponse<TokenResponse>>

    @Multipart
    @POST("upload/image")
    suspend fun uploadImage(@Part image: MultipartBody.Part): Response<ApiResponse<ImageResponse>>
}

// AuthInterceptor (토큰 자동 주입 + 갱신)
class AuthInterceptor(private val tokenManager: TokenManager) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val token = runBlocking { tokenManager.validToken() }
        val request = chain.request().newBuilder()
            .header("Authorization", "Bearer $token")
            .build()
        val response = chain.proceed(request)
        if (response.code == 401) {
            runBlocking { tokenManager.refreshToken() }
            val newToken = runBlocking { tokenManager.validToken() }
            return chain.proceed(request.newBuilder()
                .header("Authorization", "Bearer $newToken").build())
        }
        return response
    }
}
```

---

## 섹션 5: 카메라 & 미디어

```kotlin
// CameraX (권장, Jetpack)
val imageCapture = ImageCapture.Builder()
    .setCaptureMode(ImageCapture.CAPTURE_MODE_MINIMIZE_LATENCY)
    .build()

val cameraSelector = CameraSelector.DEFAULT_BACK_CAMERA
val cameraProvider = ProcessCameraProvider.getInstance(this).get()
cameraProvider.bindToLifecycle(this, cameraSelector, preview, imageCapture)

// 사진 촬영
imageCapture.takePicture(outputOptions, executor, object : ImageCapture.OnImageSavedCallback {
    override fun onImageSaved(output: ImageCapture.OutputFileResults) { /* 완료 */ }
    override fun onError(exc: ImageCaptureException) { /* 처리 */ }
})

// PhotoPicker (Android 13+ 권장, 권한 불필요)
val pickMedia = registerForActivityResult(ActivityResultContracts.PickVisualMedia()) { uri ->
    if (uri != null) { /* 이미지 처리 */ }
}
pickMedia.launch(PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly))

// Manifest 권한:
// <uses-permission android:name="android.permission.CAMERA" />
// Android 13 미만: READ_EXTERNAL_STORAGE
```

---

## 섹션 6: 위치 서비스

```kotlin
// Fused Location Provider (권장)
val fusedLocationClient = LocationServices.getFusedLocationProviderClient(this)
val locationRequest = LocationRequest.Builder(Priority.PRIORITY_HIGH_ACCURACY, 10000L)
    .setMinUpdateIntervalMillis(5000L)
    .build()

val locationCallback = object : LocationCallback() {
    override fun onLocationResult(result: LocationResult) {
        val location = result.lastLocation ?: return
        // location.latitude, location.longitude
    }
}
fusedLocationClient.requestLocationUpdates(locationRequest, locationCallback, Looper.getMainLooper())

// Manifest 권한:
// <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
// <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
// 백그라운드: ACCESS_BACKGROUND_LOCATION (별도 심사, 엄격한 정책)
```

---

## 섹션 7: 푸시 알림 (FCM)

```kotlin
// FirebaseMessagingService 구현
class MyFirebaseMessagingService : FirebaseMessagingService() {
    override fun onNewToken(token: String) {
        // 서버에 FCM 토큰 전송
        sendTokenToServer(token)
    }

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        remoteMessage.notification?.let { notification ->
            showNotification(notification.title, notification.body)
        }
        remoteMessage.data.isNotEmpty().let {
            // 데이터 페이로드 처리
        }
    }
}

// 알림 채널 생성 (Android 8.0+, 필수)
val channel = NotificationChannel(CHANNEL_ID, "주문 알림", NotificationManager.IMPORTANCE_DEFAULT)
notificationManager.createNotificationChannel(channel)

// 알림 표시
val notification = NotificationCompat.Builder(this, CHANNEL_ID)
    .setSmallIcon(R.drawable.ic_notification)
    .setContentTitle(title)
    .setContentText(body)
    .setPriority(NotificationCompat.PRIORITY_DEFAULT)
    .setAutoCancel(true)
    .build()
```

---

## 섹션 8: 생체 인증 (BiometricPrompt)

```kotlin
val biometricPrompt = BiometricPrompt(this, executor, object : BiometricPrompt.AuthenticationCallback() {
    override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
        // 인증 성공
    }
    override fun onAuthenticationFailed() {
        // 실패 (지문 불일치 등, 잠금은 아님)
    }
    override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
        // 취소(errorCode=10), 잠금(errorCode=7)
    }
})

val promptInfo = BiometricPrompt.PromptInfo.Builder()
    .setTitle("앱 잠금 해제")
    .setSubtitle("등록된 지문을 사용하세요")
    .setNegativeButtonText("취소")
    .setAllowedAuthenticators(BIOMETRIC_STRONG or DEVICE_CREDENTIAL)
    .build()

biometricPrompt.authenticate(promptInfo)
```

---

## 섹션 9: 구글 플레이 배포

```
배포 단계:
개발(Debug) → Internal Testing → Closed Testing(Alpha) → Open Testing(Beta) → Production

필수 사전 준비:
- Google Play Developer 계정 ($25 등록비, 1회)
- 앱 서명 키스토어 (keystore.jks, 절대 분실 금지)
- 개인정보처리방침 URL
- 콘텐츠 등급 설문 완료

빌드 종류:
- Debug: 서명 없음, 테스트용
- Release: 서명 있음, 배포용

aab(Android App Bundle) 사용 권장 (apk보다 크기 최적화):
./gradlew bundleRelease

Google Play App Signing 사용 권장:
- 키 분실 시 복구 가능
- Google이 서명 키 관리
```

---

**문서 버전:** 1.0.0 | **작성일:** 2026-06-13 | **대상 OS:** Android 8.0(API 26)+
