# Android 앱 용어 정의 (Terminology)

## UI 프레임워크

| 용어 | 정의 |
|------|------|
| **Jetpack Compose** | 선언형 UI 툴킷 (Android 공식 권장, 2021+). Kotlin DSL로 UI 기술 |
| **XML Layouts** | 전통적 뷰 기반 레이아웃. View, ViewGroup, LayoutInflater로 구성 |
| **Activity** | 단일 화면 단위. 운영체제와 직접 상호작용하는 앱 진입점 |
| **Fragment** | Activity 안에 내장되는 재사용 가능한 UI 조각. 백스택 관리 가능 |
| **View** | 화면에 그려지는 모든 UI 요소의 기반 클래스 |
| **ViewGroup** | 여러 View를 담는 컨테이너 (ConstraintLayout, LinearLayout 등) |
| **ConstraintLayout** | 제약 기반 반응형 레이아웃. Flat 뷰 계층으로 성능 우수 |
| **RecyclerView** | 스크롤 목록 위젯. ViewHolder 패턴으로 뷰 재사용 |
| **Composable** | Compose의 UI 함수 단위. @Composable 어노테이션 |

---

## 언어 & 도구

| 용어 | 정의 |
|------|------|
| **Kotlin** | Android 공식 주 언어. Null 안전, 코루틴, 확장함수 지원 |
| **Java** | 레거시 Android 언어. 현재도 호환되나 Kotlin 권장 |
| **Android Studio** | Google 공식 IDE. Gradle 기반 빌드, AVD 에뮬레이터 내장 |
| **Gradle** | Android 빌드 도구. build.gradle.kts (Kotlin DSL) 설정 |
| **AVD (Android Virtual Device)** | Android 에뮬레이터. 다양한 API 레벨·화면 크기 시뮬레이션 |
| **ADB (Android Debug Bridge)** | 기기-PC 연결 CLI 도구. 로그, 파일 전송, 앱 설치 |
| **ProGuard / R8** | 코드 난독화 + 최소화 도구. Release 빌드에 적용 |
| **Logcat** | Android 시스템 로그. `Log.d(TAG, "message")` |

---

## Jetpack 라이브러리

| 용어 | 정의 |
|------|------|
| **Jetpack** | Android 공식 라이브러리 모음. 하위 호환성 보장 |
| **ViewModel** | 화면 회전 등 Config Change에서도 데이터 유지. LiveData/StateFlow 노출 |
| **LiveData** | 생명주기 인식 관찰 가능 데이터 홀더 (XML Layout과 잘 어울림) |
| **StateFlow / SharedFlow** | Kotlin Flow 기반 상태 관리. Compose와 어울림 |
| **Room** | SQLite ORM. @Entity, @Dao, @Database 어노테이션으로 구성 |
| **DataStore** | SharedPreferences 대체. 비동기, 타입 안전 키-값 저장 |
| **Hilt** | Dagger 기반 의존성 주입 프레임워크. @HiltViewModel, @Inject |
| **Navigation Component** | 화면 전환 관리. NavGraph, NavController, NavHost |
| **WorkManager** | 백그라운드 작업 스케줄링. 앱 재시작 후에도 작업 유지 |
| **Paging 3** | 대용량 데이터 페이지 로딩 라이브러리 |
| **CameraX** | 카메라 기능 추상화. 기기별 호환성 자동 처리 |

---

## 아키텍처 패턴

| 용어 | 정의 |
|------|------|
| **MVVM** | Model-View-ViewModel. ViewModel이 비즈니스 로직, View는 상태만 관찰 |
| **MVI** | Model-View-Intent. 단방향 데이터 흐름. Compose에 적합 |
| **Clean Architecture** | Domain/Data/Presentation 레이어 분리. UseCase 패턴 |
| **Repository** | 데이터 소스(API/DB)를 추상화하는 패턴. ViewModel이 직접 호출 |
| **UseCase / Interactor** | 단일 비즈니스 규칙을 캡슐화. Repository를 호출 |
| **Coroutines** | Kotlin 비동기 프로그래밍. suspend 함수, CoroutineScope, Dispatcher |
| **Flow** | 코루틴 기반 반응형 스트림. collect로 구독 |

---

## 데이터 & 저장

| 용어 | 정의 |
|------|------|
| **Room** | Android SQLite ORM (상세: 04_database_schema.md) |
| **@Entity** | Room 테이블 정의 어노테이션 |
| **@Dao** | Room Data Access Object. @Query, @Insert, @Update, @Delete |
| **SharedPreferences** | 구형 키-값 저장소 (DataStore로 대체 권장) |
| **DataStore** | 비동기 키-값(Preferences) 또는 Proto 기반 저장 |
| **Android Keystore** | 암호화 키를 하드웨어 보안 요소에 저장하는 시스템 |
| **EncryptedSharedPreferences** | Android Keystore 기반 암호화 SharedPreferences |
| **MediaStore** | 공유 미디어 파일(사진/동영상/오디오) 접근 API |
| **ContentProvider** | 앱 간 데이터 공유 메커니즘 |
| **Gson / Moshi / Kotlinx.serialization** | JSON 직렬화 라이브러리 |

---

## 네트워킹

| 용어 | 정의 |
|------|------|
| **Retrofit** | HTTP 클라이언트 라이브러리. 인터페이스 정의로 API 사용 |
| **OkHttp** | Retrofit이 사용하는 하위 HTTP 클라이언트. 인터셉터로 확장 |
| **Interceptor** | OkHttp 요청/응답 중간 처리자 (인증, 로깅, 캐싱) |
| **Ktor** | Kotlin 멀티플랫폼 HTTP 클라이언트 (Retrofit 대안) |
| **Coil** | Kotlin Coroutine 기반 이미지 로딩 (권장) |
| **Glide** | 이미지 로딩 라이브러리 (Java 기반, 레거시) |
| **Picasso** | Square의 이미지 로딩 라이브러리 (경량) |

---

## 배포 & 보안

| 용어 | 정의 |
|------|------|
| **APK (Android Package)** | Android 앱 설치 파일 형식 |
| **AAB (Android App Bundle)** | Google Play 배포 형식. 기기별 최적화된 APK 제공 |
| **Keystore** | 앱 서명 키 저장 파일 (.jks / .p12). 분실 시 앱 업데이트 불가 |
| **Google Play Signing** | Google이 서명 키 관리. 키 분실 대비 |
| **minSdk** | 최소 지원 Android API 레벨 |
| **targetSdk** | 앱이 타겟하는 Android API 레벨 (최신 권장) |
| **compileSdk** | 컴파일 시 사용하는 Android API 레벨 (최신 권장) |
| **BuildVariant** | Debug / Release. buildType으로 정의 |
| **BuildFlavor** | 환경별 (dev/staging/prod) 또는 브랜드별 빌드 변형 |

---

## Android 권한 시스템

| 용어 | 정의 |
|------|------|
| **Normal Permission** | 자동 승인. AndroidManifest.xml 선언만으로 부여 (INTERNET 등) |
| **Dangerous Permission** | 런타임 사용자 승인 필요 (카메라, 위치, 연락처 등) |
| **requestPermissions()** | 런타임 권한 요청 API |
| **Permission Rationale** | 권한 재요청 전 설명 UI. `shouldShowRequestPermissionRationale()` |
| **ActivityResultContracts** | 권한 요청, 파일 선택, 카메라 등 결과 처리 현대적 API |

---

**문서 버전:** 1.0.0 | **작성일:** 2026-06-13
