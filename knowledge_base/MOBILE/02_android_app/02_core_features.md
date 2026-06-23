# Android App Core Features

## Section 1: App Lifecycle

```
Activity state transitions:
Created → Started → Resumed (foreground, user interaction)
  → Paused (partially obscured) → Stopped (fully backgrounded) → Destroyed

Activity callbacks:
  onCreate()       → initialization, View binding
  onStart()        → screen entry
  onResume()       → foreground (input focus)
  onPause()        → save unsaved data, stop animations
  onStop()         → release resources
  onDestroy()      → cleanup
  onSaveInstanceState() → save state (Bundle)

Fragment lifecycle:
  onCreateView() / onViewCreated() / onDestroyView()
  (nested within the Activity lifecycle)

Jetpack Compose:
  Composables use Activity/Fragment as a container
  Integrate with the lifecycle via LaunchedEffect, DisposableEffect
```

**CoolHan rules:**
- Flush unsaved state in `onPause()` (the screen may be left during a network request)
- ViewModel is retained across screen rotation (independent of the `onDestroy → onCreate` cycle)
- Schedule background tasks with WorkManager (comply with background execution limits)

---

## Section 2: Navigation & Routing

```
Jetpack Navigation Component (recommended):
  NavGraph (.xml or Kotlin DSL)
    ├─ NavHostFragment (container)
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

Deep links:
  <intent-filter> in AndroidManifest.xml:
    <action android:name="android.intent.action.VIEW" />
    <data android:scheme="myapp" android:host="product" />
  or App Link (https, requires domain ownership verification)
```

**CoolHan rules:**
- Back Stack management: set `popUpTo` via `navigate()` options to remove unnecessary stack entries
- Passing screen results: `setFragmentResult` / Compose's `NavController.previousBackStackEntry?.savedStateHandle`

---

## Section 3: Data Storage

```
Storage strategy by tier:
┌────────────────────────────┬──────────────────────────────┐
│ Data type                  │ Storage                      │
├────────────────────────────┼──────────────────────────────┤
│ Sensitive data (token/pwd) │ Android Keystore + EncryptedSharedPreferences │
│ User settings (small)      │ DataStore (Preferences)      │
│ Structured data (entities) │ Room Database (SQLite)        │
│ Files (images/documents)   │ Internal Storage / MediaStore │
│ Cross-app shared data      │ ContentProvider              │
└────────────────────────────┴──────────────────────────────┘

Room Database structure:
@Database(entities = [User::class, Product::class], version = 1)
abstract class AppDatabase : RoomDatabase() {
    abstract fun userDao(): UserDao
    abstract fun productDao(): ProductDao
}
// Manage as a singleton, use Room.databaseBuilder

DataStore (replacement for SharedPreferences):
val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "settings")
val HAS_ONBOARDED = booleanPreferencesKey("has_onboarded")
```

**CoolHan rules:**
- Do not call Room directly on the Main Thread → use Coroutine Dispatcher.IO
- Store tokens with EncryptedSharedPreferences (Android Keystore based)
- Image caching: use the Coil or Glide library (do not implement it yourself)

---

## Section 4: Networking (Retrofit + OkHttp)

```kotlin
// Retrofit client configuration
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

// API interface
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

// AuthInterceptor (automatic token injection + refresh)
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

## Section 5: Camera & Media

```kotlin
// CameraX (recommended, Jetpack)
val imageCapture = ImageCapture.Builder()
    .setCaptureMode(ImageCapture.CAPTURE_MODE_MINIMIZE_LATENCY)
    .build()

val cameraSelector = CameraSelector.DEFAULT_BACK_CAMERA
val cameraProvider = ProcessCameraProvider.getInstance(this).get()
cameraProvider.bindToLifecycle(this, cameraSelector, preview, imageCapture)

// Take a photo
imageCapture.takePicture(outputOptions, executor, object : ImageCapture.OnImageSavedCallback {
    override fun onImageSaved(output: ImageCapture.OutputFileResults) { /* done */ }
    override fun onError(exc: ImageCaptureException) { /* handle */ }
})

// PhotoPicker (recommended for Android 13+, no permission required)
val pickMedia = registerForActivityResult(ActivityResultContracts.PickVisualMedia()) { uri ->
    if (uri != null) { /* process image */ }
}
pickMedia.launch(PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly))

// Manifest permissions:
// <uses-permission android:name="android.permission.CAMERA" />
// Below Android 13: READ_EXTERNAL_STORAGE
```

---

## Section 6: Location Services

```kotlin
// Fused Location Provider (recommended)
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

// Manifest permissions:
// <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
// <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
// Background: ACCESS_BACKGROUND_LOCATION (separate review, strict policy)
```

---

## Section 7: Push Notifications (FCM)

```kotlin
// FirebaseMessagingService implementation
class MyFirebaseMessagingService : FirebaseMessagingService() {
    override fun onNewToken(token: String) {
        // Send the FCM token to the server
        sendTokenToServer(token)
    }

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        remoteMessage.notification?.let { notification ->
            showNotification(notification.title, notification.body)
        }
        remoteMessage.data.isNotEmpty().let {
            // Handle the data payload
        }
    }
}

// Create a notification channel (Android 8.0+, required)
val channel = NotificationChannel(CHANNEL_ID, "Order notifications", NotificationManager.IMPORTANCE_DEFAULT)
notificationManager.createNotificationChannel(channel)

// Show the notification
val notification = NotificationCompat.Builder(this, CHANNEL_ID)
    .setSmallIcon(R.drawable.ic_notification)
    .setContentTitle(title)
    .setContentText(body)
    .setPriority(NotificationCompat.PRIORITY_DEFAULT)
    .setAutoCancel(true)
    .build()
```

---

## Section 8: Biometric Authentication (BiometricPrompt)

```kotlin
val biometricPrompt = BiometricPrompt(this, executor, object : BiometricPrompt.AuthenticationCallback() {
    override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
        // Authentication succeeded
    }
    override fun onAuthenticationFailed() {
        // Failed (e.g. fingerprint mismatch, not a lockout)
    }
    override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
        // Cancel (errorCode=10), lockout (errorCode=7)
    }
})

val promptInfo = BiometricPrompt.PromptInfo.Builder()
    .setTitle("Unlock app")
    .setSubtitle("Use your registered fingerprint")
    .setNegativeButtonText("Cancel")
    .setAllowedAuthenticators(BIOMETRIC_STRONG or DEVICE_CREDENTIAL)
    .build()

biometricPrompt.authenticate(promptInfo)
```

---

## Section 9: Google Play Distribution

```
Distribution stages:
Development (Debug) → Internal Testing → Closed Testing (Alpha) → Open Testing (Beta) → Production

Required prerequisites:
- Google Play Developer account ($25 registration fee, one-time)
- App signing keystore (keystore.jks, never lose it)
- Privacy policy URL
- Completed content rating questionnaire

Build types:
- Debug: unsigned, for testing
- Release: signed, for distribution

Using an aab (Android App Bundle) is recommended (smaller size than apk):
./gradlew bundleRelease

Using Google Play App Signing is recommended:
- Recoverable if the key is lost
- Google manages the signing key
```

---

**Document version:** 1.0.0 | **Date:** 2026-06-13 | **Target OS:** Android 8.0 (API 26)+
