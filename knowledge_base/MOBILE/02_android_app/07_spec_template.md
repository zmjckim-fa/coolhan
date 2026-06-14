# Android 앱 규격 템플릿 (Specification Template)

## 프로젝트 기본 정보

```yaml
project_name: "{앱 이름}"
application_id: "com.{company}.{appname}"
version_name: "1.0.0"
version_code: 1
min_sdk: 26                          # Android 8.0
target_sdk: 35                       # 최신 API (Google Play 정책)
compile_sdk: 35
language: "Kotlin"
ui_framework: "Jetpack Compose"      # Compose | XML | 혼합
architecture: "MVVM + Clean"         # MVVM | MVI | Clean Architecture
di_framework: "Hilt"                 # Hilt | Koin | 없음
```

---

## 섹션 1: 앱 개요

| 항목 | 내용 |
|------|------|
| **앱 이름** | |
| **Play Store 짧은 설명** | (80자 이하) |
| **앱 카테고리** | |
| **타겟 사용자** | |
| **핵심 가치 제안** | |
| **수익 모델** | 무료 | 유료 | Freemium | 구독 | 인앱결제 |

---

## 섹션 2: 화면 목록 (Screens)

| # | 화면 이름 | 역할 | 접근 권한 | 진입 경로 |
|---|----------|------|---------|---------|
| S01 | 스플래시 | 초기 로딩 + 자동 로그인 | 모두 | 앱 시작 |
| S02 | 온보딩 | 첫 실행 가이드 | 비로그인 | 최초 설치 |
| S03 | 로그인 | 이메일/소셜 인증 | 비로그인 | 온보딩 완료 |
| S04 | 메인(BottomNavigation) | 탭 기반 탐색 | 로그인 | 로그인 성공 |
| S05 | {기능} 목록 | | | 탭 |
| S06 | {기능} 상세 | | | 목록 항목 탭 |
| S07 | 프로필 / 마이페이지 | | 로그인 | 탭 |
| S08 | 설정 | | 로그인 | 프로필 |

---

## 섹션 3: 기능 명세 (Feature Specifications)

### F001: 인증 (Authentication)
```
지원 방식:
  [ ] 이메일/패스워드
  [ ] Google Sign-In
  [ ] Kakao Login
  [ ] Naver Login
  [ ] 전화번호 (Firebase Auth)

이메일 유효성: RFC 5322
패스워드 정책: 최소 8자, 대소문자+숫자 조합
토큰 저장: EncryptedSharedPreferences (Android Keystore)
자동 로그인: 토큰 유효 시 스플래시에서 자동 처리

에러 처리:
- 잘못된 자격증명 (401): "이메일 또는 패스워드가 올바르지 않습니다"
- 5회 실패: "잠시 후 다시 시도해 주세요 (30분)"
- 네트워크 없음: "인터넷 연결을 확인해 주세요"
- Google/소셜 실패: "로그인에 실패했습니다. 다시 시도해 주세요"
```

### F002: {핵심 기능 1}
```
기능 설명:
입력:
출력:
비즈니스 규칙:
예외 처리:
```

### F003: {핵심 기능 2}
```
[동일 구조]
```

---

## 섹션 4: 데이터 모델

### 4.1 Room 엔티티 목록
```
참고: 04_database_schema.md의 표준 엔티티 사용

사용 엔티티:
- [ ] UserEntity
- [ ] ProductEntity
- [ ] OrderEntity / OrderItemEntity
- [ ] CachedResponseEntity
- [ ] {CustomEntity}

커스텀 엔티티 추가:
@Entity(tableName = "{table_name}")
data class {Name}Entity(
    @PrimaryKey val id: String,
    val {field}: {type},
    val created_at: Long,
    val updated_at: Long
)
```

### 4.2 EncryptedSharedPreferences 키 목록
| 키 | 타입 | 설명 |
|----|------|------|
| auth_token | String | 액세스 토큰 |
| refresh_token | String | 리프레시 토큰 |
| user_id | String | 로그인 사용자 ID |

### 4.3 DataStore 키 목록
| 키 | 타입 | 기본값 | 설명 |
|----|------|--------|------|
| has_onboarded | Boolean | false | 온보딩 완료 여부 |
| selected_language | String | "" | 선택 언어 |
| notifications_enabled | Boolean | true | 알림 활성화 |

---

## 섹션 5: API 연동

### 5.1 기본 설정
```yaml
base_url:
  production: "https://api.{domain}.com/v1"
  staging: "https://api-staging.{domain}.com/v1"
  development: "http://10.0.2.2:3000/v1"   # 에뮬레이터 → 로컬호스트

auth: Bearer Token (Authorization 헤더)
timeout_connect: 30초
timeout_read: 30초
timeout_write: 60초
retry: 3회 (지수 백오프, IO 오류만)
```

### 5.2 사용 엔드포인트
| 메서드 | 경로 | 기능 | 인증 필요 |
|--------|------|------|---------|
| POST | /auth/login | 로그인 | 불필요 |
| POST | /auth/refresh | 토큰 갱신 | 불필요 |
| DELETE | /auth/logout | 로그아웃 | 필요 |
| GET | /users/me | 내 정보 | 필요 |
| {method} | {path} | {description} | {yes/no} |

---

## 섹션 6: 권한 (Permissions)

| 권한 | 유형 | 요청 사유 | 요청 시점 |
|------|------|---------|---------|
| [ ] INTERNET | Normal | 네트워크 통신 | 자동 부여 |
| [ ] ACCESS_NETWORK_STATE | Normal | 네트워크 상태 확인 | 자동 부여 |
| [ ] CAMERA | Dangerous | "프로필 사진 촬영" | 카메라 버튼 탭 |
| [ ] READ_MEDIA_IMAGES | Dangerous (API 33+) | "갤러리 사진 선택" | 사진 선택 버튼 탭 |
| [ ] ACCESS_FINE_LOCATION | Dangerous | "정확한 위치 확인" | 위치 기능 사용 시 |
| [ ] POST_NOTIFICATIONS | Dangerous (API 33+) | "주문 알림 수신" | 첫 주문 완료 시 |
| [ ] {permission} | {type} | {reason} | {timing} |

---

## 섹션 7: 알림 명세

| # | 채널 ID | 채널명 | 중요도 | 알림 트리거 | 타입 |
|---|---------|--------|--------|-----------|------|
| N01 | order_updates | 주문 알림 | DEFAULT | 주문 상태 변경 | FCM |
| N02 | promotions | 혜택/이벤트 | LOW | 마케팅 발송 | FCM |
| N03 | {channel_id} | | | | FCM | Local |

---

## 섹션 8: 오류 시나리오

| # | 시나리오 | 코드 | 표시 방법 | 메시지 |
|---|---------|------|---------|--------|
| E01 | 로그인 실패 | 401 | Snackbar | "이메일 또는 패스워드가 올바르지 않습니다" |
| E02 | 네트워크 없음 | - | 배너 | "인터넷 연결을 확인해 주세요" |
| E03 | 서버 오류 | 5xx | Dialog | "일시적인 오류입니다. 잠시 후 다시 시도해 주세요" |
| E04 | 세션 만료 | 401 | 로그인 화면 이동 | "로그인이 만료되었습니다" |

---

## 섹션 9: 테스트 요구사항

### 9.1 단위 테스트
```
프레임워크: JUnit4 + Mockk + Turbine (Flow 테스트)
목표 커버리지: ViewModel, Repository, UseCase ≥ 80%

필수 테스트:
- [ ] 로그인 성공/실패 (ViewModel)
- [ ] 토큰 갱신 로직 (TokenManager)
- [ ] API 응답 파싱 (Repository)
- [ ] Room DAO CRUD (인메모리 DB)
- [ ] Flow 데이터 흐름 (Turbine)
```

### 9.2 UI 테스트
```
프레임워크: Espresso (XML) | Compose Test (Compose)
대상: 핵심 사용자 플로우

- [ ] 온보딩 → 로그인 → 메인
- [ ] {핵심 플로우}
```

### 9.3 실제 기기 테스트
```
필수 테스트 기기:
- Android 8.0 (minSdk, API 26)
- 최신 Android (targetSdk)
- 저사양 기기 (RAM 2GB 이하)
- 다양한 화면 크기 (소형/표준/대형)
```

---

## 섹션 10: 배포 계획

| 단계 | 내용 | 기간 |
|------|------|------|
| Internal Testing | 개발팀 100명 이내 | |
| Closed Testing (Alpha) | 특정 그룹 초대 | |
| Open Testing (Beta) | 공개 신청 | |
| Production | 단계적 출시 권장 | |

```
단계적 출시 (Staged Rollout):
Play Console → 출시 비율 설정
1% → 5% → 10% → 25% → 50% → 100% (각 단계 24~48시간 모니터링)
비정상 종료율 >1.09% 또는 ANR율 >0.47% → 즉시 중단

서명 (APK/AAB):
- keystore.jks: 절대 분실 금지, 버전 관리 제외
- Google Play App Signing 활성화 권장 (키 분실 복구 가능)
```

---

**규격 ID:** {id} | **작성일:** {YYYY-MM-DD} | **승인:** {기획자명}
