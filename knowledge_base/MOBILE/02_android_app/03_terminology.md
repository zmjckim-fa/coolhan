# Android App Terminology

## UI Frameworks

| Term | Definition |
|------|------|
| **Jetpack Compose** | Declarative UI toolkit (officially recommended by Android, 2021+). Describes UI with a Kotlin DSL |
| **XML Layouts** | Traditional view-based layouts. Composed of View, ViewGroup, LayoutInflater |
| **Activity** | A single screen unit. The app entry point that interacts directly with the OS |
| **Fragment** | A reusable UI piece embedded within an Activity. Supports back-stack management |
| **View** | The base class for every UI element drawn on screen |
| **ViewGroup** | A container holding multiple Views (ConstraintLayout, LinearLayout, etc.) |
| **ConstraintLayout** | Constraint-based responsive layout. Excellent performance with a flat view hierarchy |
| **RecyclerView** | Scrollable list widget. Reuses views via the ViewHolder pattern |
| **Composable** | The unit of a UI function in Compose. Uses the @Composable annotation |

---

## Languages & Tools

| Term | Definition |
|------|------|
| **Kotlin** | Android's official primary language. Supports null safety, coroutines, extension functions |
| **Java** | Legacy Android language. Still compatible, but Kotlin is recommended |
| **Android Studio** | Google's official IDE. Gradle-based builds, built-in AVD emulator |
| **Gradle** | Android build tool. Configured via build.gradle.kts (Kotlin DSL) |
| **AVD (Android Virtual Device)** | Android emulator. Simulates various API levels and screen sizes |
| **ADB (Android Debug Bridge)** | CLI tool connecting device and PC. Logs, file transfer, app installation |
| **ProGuard / R8** | Code obfuscation + minification tool. Applied to Release builds |
| **Logcat** | Android system log. `Log.d(TAG, "message")` |

---

## Jetpack Libraries

| Term | Definition |
|------|------|
| **Jetpack** | Google's official collection of libraries. Guarantees backward compatibility |
| **ViewModel** | Retains data across config changes such as screen rotation. Exposes LiveData/StateFlow |
| **LiveData** | Lifecycle-aware observable data holder (pairs well with XML Layouts) |
| **StateFlow / SharedFlow** | Kotlin Flow-based state management. Pairs well with Compose |
| **Room** | SQLite ORM. Composed of @Entity, @Dao, @Database annotations |
| **DataStore** | Replacement for SharedPreferences. Asynchronous, type-safe key-value storage |
| **Hilt** | Dagger-based dependency injection framework. @HiltViewModel, @Inject |
| **Navigation Component** | Manages screen transitions. NavGraph, NavController, NavHost |
| **WorkManager** | Background task scheduling. Retains tasks even after app restart |
| **Paging 3** | Library for paginated loading of large datasets |
| **CameraX** | Camera functionality abstraction. Handles per-device compatibility automatically |

---

## Architecture Patterns

| Term | Definition |
|------|------|
| **MVVM** | Model-View-ViewModel. The ViewModel holds business logic; the View only observes state |
| **MVI** | Model-View-Intent. Unidirectional data flow. Well suited to Compose |
| **Clean Architecture** | Separation of Domain/Data/Presentation layers. UseCase pattern |
| **Repository** | A pattern that abstracts data sources (API/DB). Called directly by the ViewModel |
| **UseCase / Interactor** | Encapsulates a single business rule. Calls the Repository |
| **Coroutines** | Kotlin asynchronous programming. suspend functions, CoroutineScope, Dispatcher |
| **Flow** | Coroutine-based reactive stream. Subscribed with collect |

---

## Data & Storage

| Term | Definition |
|------|------|
| **Room** | Android SQLite ORM (details: 04_database_schema.md) |
| **@Entity** | Room table definition annotation |
| **@Dao** | Room Data Access Object. @Query, @Insert, @Update, @Delete |
| **SharedPreferences** | Older key-value storage (replacement by DataStore recommended) |
| **DataStore** | Asynchronous key-value (Preferences) or Proto-based storage |
| **Android Keystore** | System that stores encryption keys in a hardware security element |
| **EncryptedSharedPreferences** | Encrypted SharedPreferences backed by Android Keystore |
| **MediaStore** | API for accessing shared media files (photos/videos/audio) |
| **ContentProvider** | Mechanism for sharing data between apps |
| **Gson / Moshi / Kotlinx.serialization** | JSON serialization libraries |

---

## Networking

| Term | Definition |
|------|------|
| **Retrofit** | HTTP client library. Use APIs by defining interfaces |
| **OkHttp** | The underlying HTTP client used by Retrofit. Extended via interceptors |
| **Interceptor** | OkHttp request/response intermediary handler (auth, logging, caching) |
| **Ktor** | Kotlin multiplatform HTTP client (alternative to Retrofit) |
| **Coil** | Kotlin Coroutine-based image loading (recommended) |
| **Glide** | Image loading library (Java-based, legacy) |
| **Picasso** | Square's image loading library (lightweight) |

---

## Distribution & Security

| Term | Definition |
|------|------|
| **APK (Android Package)** | Android app installation file format |
| **AAB (Android App Bundle)** | Google Play distribution format. Delivers per-device optimized APKs |
| **Keystore** | File storing the app signing key (.jks / .p12). App updates impossible if lost |
| **Google Play Signing** | Google manages the signing key. Safeguards against key loss |
| **minSdk** | Minimum supported Android API level |
| **targetSdk** | The Android API level the app targets (latest recommended) |
| **compileSdk** | The Android API level used at compile time (latest recommended) |
| **BuildVariant** | Debug / Release. Defined via buildType |
| **BuildFlavor** | Build variant per environment (dev/staging/prod) or per brand |

---

## Android Permission System

| Term | Definition |
|------|------|
| **Normal Permission** | Auto-granted. Granted simply by declaring it in AndroidManifest.xml (INTERNET, etc.) |
| **Dangerous Permission** | Requires runtime user approval (camera, location, contacts, etc.) |
| **requestPermissions()** | Runtime permission request API |
| **Permission Rationale** | UI explaining the request before re-requesting a permission. `shouldShowRequestPermissionRationale()` |
| **ActivityResultContracts** | Modern API for handling results of permission requests, file selection, camera, etc. |

---

**Document version:** 1.0.0 | **Date:** 2026-06-13
