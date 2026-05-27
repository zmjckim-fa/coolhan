# Android 앱 - 기본 논리 (Android App Basic Logic)

## 1. Android 앱의 특징

Android는 **Google의 모바일 운영체제**에서 실행되는 네이티브 앱입니다.

### 핵심 특징
```
- Google Play Store에서 배포
- Kotlin 언어 사용 (공식 권장)
- 다양한 화면 크기 지원
- 낮은 심사 기준 (빠른 배포)
- 높은 자유도와 유연성
```

---

## 2. Android 앱의 생명주기 (App Lifecycle)

### 2.1 Activity 생명주기
```
1. Created
   ↓
2. Started
   ↓
3. Resumed (활성 - 화면에 보임)
   ↓
4. Paused (부분 가려짐)
   ↓
5. Stopped (배경 이동)
   ↓
6. Destroyed (종료)
```

### 2.2 생명주기 콜백
```
onCreate()        - 처음 생성
onStart()         - 보이기 시작
onResume()        - 활성화됨
onPause()         - 일시 중단
onStop()          - 숨겨짐
onDestroy()       - 파괴됨
onRestart()       - 재시작
```

### 2.3 상태 저장 및 복원
```
onSaveInstanceState()  - 상태 저장 (메모리 부족 시)
onRestoreInstanceState() - 상태 복원
Bundle를 통한 데이터 전달
```

---

## 3. UI 구조

### 3.1 레이아웃 시스템
```
LinearLayout      - 선형 배치 (가로/세로)
FrameLayout       - 겹치기 배치
RelativeLayout    - 상대 위치 배치
ConstraintLayout  - 제약 기반 배치 (권장)
RecyclerView      - 리스트/그리드
```

### 3.2 네비게이션 패턴
```
Bottom Navigation (탭)
Navigation Drawer (사이드 메뉴)
Tab Navigation
Stack Navigation (Fragment)
```

### 3.3 Material Design
```
- 색상 시스템 (Primary, Secondary, Tertiary)
- 타이포그래피 (Display, Headline, Title, Body)
- Elevation (그림자)
- 공백 (패딩/마진)
```

---

## 4. 컴포넌트 (Components)

### 4.1 Activity
```
화면을 나타내는 UI 컴포넌트
- 하나의 화면 = 하나의 Activity
- 예: 로그인 화면, 상품 목록, 상품 상세
- 생명주기 관리 필수
```

### 4.2 Fragment
```
Activity 내 부분 UI
- 재사용 가능한 UI 컴포넌트
- 태블릿과 폰 모두 지원 (반응형)
- Activity의 일부 생명주기 따름
```

### 4.3 Service
```
배경에서 실행되는 컴포넌트
- 오래 걸리는 작업 (음악 재생, 파일 다운로드)
- 사용자 인터페이스 없음
- 예: 파일 다운로드, 음악 플레이어
```

### 4.4 Broadcast Receiver
```
시스템 이벤트 수신
- 예: 부팅 완료, 배터리 부족, 네트워크 변경
- 백그라운드에서 작동
```

### 4.5 Content Provider
```
데이터 공유 및 관리
- 앱 간 데이터 공유
- 예: 연락처, 사진 라이브러리
```

---

## 5. 데이터 저장소 (Data Storage)

### 5.1 SharedPreferences
```
간단한 키-값 저장
- 사용자 설정, 토큰, 간단한 캐시
- 앱 재시작 후에도 유지
- 암호화: EncryptedSharedPreferences
```

### 5.2 SQLite Database
```
관계형 데이터베이스
- Room (권장 추상화 라이브러리)
- 구조화된 데이터 저장
- 복잡한 쿼리 지원
```

### 5.3 File System
```
파일 저장
- Internal Storage (앱 전용, 삭제 시 함께 삭제)
- External Storage (모든 앱 접근 가능)
- Cache Directory (캐시, 자동 삭제 가능)
```

### 5.4 Data Store
```
SharedPreferences 대체
- 더 안전한 비동기 처리
- Type-safe
- Coroutines 지원
```

### 5.5 서버 통신
```
HTTP/HTTPS API
- Retrofit (HTTP 클라이언트)
- OkHttp (HTTP 클라이언트)
- JSON 파싱 (Gson, Moshi)
```

---

## 6. 권한 관리 (Permissions)

### 6.1 권한 종류
```
일반 권한 (Normal Permissions)
- 사용자 동의 불필요
- 예: 인터넷 접근

위험 권한 (Dangerous Permissions)
- 사용자 동의 필수
- 런타임에 요청
- 예: 카메라, 위치, 저장소
```

### 6.2 권한 요청 흐름
```
1. AndroidManifest.xml에 권한 선언
2. Android 6.0 이상: 런타임 권한 요청
3. requestPermissions() 호출
4. 사용자 응답 onRequestPermissionsResult()
5. 권한 사용
```

### 6.3 쇼핑몰 앱 필요 권한
```
필수:
- INTERNET (서버 통신)

필요:
- ACCESS_COARSE_LOCATION (배송지 찾기)
- READ_MEDIA_IMAGES (리뷰 사진)
- CAMERA (상품 스캔)
- POST_NOTIFICATIONS (주문 알림)
```

---

## 7. 네트워킹 (Networking)

### 7.1 Retrofit 기본 구조
```
Interface 정의 (API 명세)
    ↓
Request 객체 생성
    ↓
Retrofit을 통해 전송
    ↓
Response 수신
    ↓
JSON 파싱 (Gson)
    ↓
UI 업데이트
```

### 7.2 비동기 처리
```
Callback 방식
- onResponse()
- onFailure()

Coroutines 방식 (권장)
- suspend 함수
- try-catch로 에러 처리
- Main 스레드에서 UI 업데이트
```

### 7.3 에러 처리
```
네트워크 에러:
- IOException (연결 실패, 타임아웃)

HTTP 에러:
- 4xx (클라이언트 오류)
- 5xx (서버 오류)

파싱 에러:
- JsonSyntaxException
- Type 불일치
```

---

## 8. 오프라인 대응 (Offline Support)

### 8.1 연결 상태 감지
```
ConnectivityManager 사용
- isNetworkConnected() 확인
- WiFi vs Cellular 구분
```

### 8.2 오프라인 모드
```
온라인:
- 실시간 데이터 로드
- 서버 동기화

오프라인:
- 로컬 캐시 표시
- 변경사항 저장
- 온라인 시 동기화
```

### 8.3 데이터 동기화
```
Room Database + Retrofit
- 로컬 저장
- 온라인 시 서버 업로드
- 충돌 해결 (마지막 승리, 사용자 선택)
```

---

## 9. 백그라운드 작업 (Background Tasks)

### 9.1 작업 스케줄링
```
WorkManager (권장)
- 다양한 작업 유형
- 배터리 최적화
- 기기 재부팅 후에도 실행

AlarmManager (정확한 시간)
- 정확한 타이밍 필요
- 배터리 소비 주의
```

### 9.2 백그라운드 제약
```
Android 6.0+: Doze Mode
- 배터리 절약
- 앱이 백그라운드 작업 제한

Android 8.0+: Background Execution Limits
- startService() 제약
- foreground service 권장
```

### 9.3 Foreground Service
```
사용자에게 알려진 백그라운드 작업
- 알림 표시 필수
- 예: 음악 재생, 파일 다운로드
- 배터리 오래 소비 가능
```

---

## 10. 알림 (Notifications)

### 10.1 로컬 알림
```
AlarmManager + Broadcast Receiver
또는
WorkManager로 스케줄
- 제목, 메시지
- 아이콘, 색상
- 액션 버튼
```

### 10.2 원격 알림 (Push Notification)
```
Firebase Cloud Messaging (FCM)
- 토큰 관리
- 메시지 처리
- 백그라운드/포그라운드 처리
```

### 10.3 알림 채널
```
Android 8.0+: 채널 필수
- 소리, 진동, 불빛
- 사용자가 채널별로 제어
- 예: 주문알림, 광고알림
```

---

## 11. 성능 최적화

### 11.1 메모리 관리
```
- 이미지 캐싱 라이브러리 (Glide, Picasso)
- 리스트 메모리 누수 방지
- 큰 비트맵 처리
- WeakReference 사용
```

### 11.2 네트워크 최적화
```
- HTTP 압축 (gzip)
- 이미지 최적화
- 배치 요청
- 캐싱 헤더 활용
```

### 11.3 UI 성능
```
- Jank 방지 (60fps 유지)
- Layout 최적화
- 메인 스레드 차단 금지
- Lint 경고 해결
```

### 11.4 배터리 최적화
```
- 위치 추적 최소화
- 센서 사용 최소화
- 높은 CPU 작업 제한
- 네트워크 요청 배치
```

---

## 12. 보안

### 12.1 데이터 보안
```
- EncryptedSharedPreferences (민감 데이터)
- SQLite 암호화 (SQLCipher)
- HTTPS만 사용
- 토큰 저장: Shared Preferences 또는 KeyStore
```

### 12.2 API 보안
```
- SSL Pinning
- 요청 서명 (HMAC)
- 토큰 만료 관리
- Refresh Token 사용
```

### 12.3 코드 보안
```
- 민감한 정보 하드코딩 금지
- 로그에 민감한 정보 출력 금지
- ProGuard/R8 난독화
- debuggable = false (릴리스)
```

---

## 13. 앱 배포 (Distribution)

### 13.1 개발 단계
```
1. 개발용 키스토어 생성
2. 에뮬레이터 또는 테스트 기기에서 실행
3. Logcat으로 디버깅
```

### 13.2 테스트 (Google Play Internal Testing)
```
1. 내부 테스터 초대
2. APK/AAB 업로드
3. 테스터가 설치 및 테스트
4. 피드백 수집
```

### 13.3 Google Play 배포
```
1. 릴리스 키스토어 생성 (안전하게 보관)
2. 앱 서명 구성
3. Release 빌드 생성
4. AAB (Android App Bundle) 생성
5. Google Play Console에 업로드
6. 앱 정보 입력 (설명, 스크린샷, 등급)
7. Google Play 심사 신청 (보통 1-2시간)
8. 승인 후 배포
```

### 13.4 배포 설정
```
대상 국가
가격
등급 심사 (IARC)
개인정보처리방침 링크
연락처 정보
```

---

## 14. 사용자 분석

### 14.1 Analytics
```
Google Analytics for Firebase
Amplitude
Mixpanel

추적:
- 사용자 행동
- 이벤트 (구매, 리뷰 작성)
- 사용 시간
- 고객 수명 가치 (LTV)
```

### 14.2 크래시 리포팅
```
Firebase Crashlytics (권장)
- 자동 크래시 보고
- 심각도 분류
- 영향받은 사용자
```

---

## 15. 주요 라이브러리

```
UI:
- Material Components
- Jetpack Compose (최신)

네트워킹:
- Retrofit
- OkHttp

JSON:
- Gson
- Moshi

이미지:
- Glide
- Picasso

데이터:
- Room
- DataStore

비동기:
- Coroutines
- RxJava

의존성 주입:
- Hilt

테스트:
- JUnit
- Mockito
- Espresso
```

---

## 16. 다양한 화면 크기 지원 (Responsiveness)

### 16.1 dp (Density-independent Pixels)
```
화면 밀도와 무관한 단위
- 1 dp ≈ 1 픽셀 (160dpi 기준)
- hdpi, xhdpi, xxhdpi 자동 변환
```

### 16.2 레이아웃 구성
```
- ConstraintLayout으로 반응형 설계
- 폰/태블릿 다른 레이아웃 (sw600dp)
- 이미지 여러 해상도 제공 (1x, 2x, 3x)
```

---

## 17. 다음 문서로 읽어야 할 것

1. **core_features.md** - Android 앱의 일반적인 기능
2. **terminology.md** - Android 기술 용어
3. **architecture.md** - MVVM, MVP 등 아키텍처
4. **api_standard.md** - 네트워킹 표준
5. **spec_template.md** - Android 앱 기획서 템플릿

