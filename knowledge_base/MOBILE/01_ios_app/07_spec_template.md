# iOS 앱 규격 템플릿 (Specification Template)

## 프로젝트 기본 정보

```yaml
project_name: "{앱 이름}"
bundle_identifier: "com.{company}.{appname}"
version: "1.0.0"
build_number: 1
minimum_ios: "15.0"
target_devices: ["iPhone", "iPad"]   # 해당 항목 선택
language: "Swift"
ui_framework: "SwiftUI"              # SwiftUI | UIKit | 혼합
architecture: "MVVM"                 # MVC | MVVM | VIPER | Clean
```

---

## 섹션 1: 앱 개요

| 항목 | 내용 |
|------|------|
| **앱 이름** | |
| **한줄 설명** | (App Store 서브타이틀 < 30자) |
| **앱 카테고리** | (App Store 카테고리) |
| **타겟 사용자** | |
| **핵심 가치 제안** | |
| **수익 모델** | 무료 | 유료($N) | Freemium | 구독 |

---

## 섹션 2: 화면 목록 (Screens)

| # | 화면 이름 | 역할 | 접근 권한 | 네비게이션 진입 |
|---|----------|------|---------|--------------|
| S01 | 스플래시/온보딩 | 첫 실행 환경 설정 | 비로그인 | 앱 시작 |
| S02 | 로그인 | 이메일/SNS 인증 | 비로그인 | 온보딩 완료 |
| S03 | 메인(탭바) | 앱 핵심 탐색 | 로그인 | 로그인 성공 |
| S04 | {기능} 목록 | | | |
| S05 | {기능} 상세 | | | |
| S06 | 프로필 / 마이페이지 | | 로그인 | 탭바 |
| S07 | 설정 | | 로그인 | 프로필 |

---

## 섹션 3: 기능 명세 (Feature Specifications)

### F001: 인증 (Authentication)
```
지원 방식: [ ] 이메일/패스워드  [ ] Apple Sign In  [ ] Google  [ ] Kakao
필수: Apple Sign In (앱 내 소셜 로그인 있으면 Apple도 필수, 심사 기준)

이메일 유효성: RFC 5322
패스워드 정책: 최소 8자, 대소문자+숫자 조합
토큰 저장: Keychain (kSecAttrAccessibleWhenUnlockedThisDeviceOnly)
자동 로그인: Keychain 토큰 유효 시 자동 로그인

에러 처리:
- 잘못된 이메일/패스워드: "이메일 또는 패스워드가 올바르지 않습니다"
- 5회 실패: 계정 잠금 (30분) + 안내 메시지
- 네트워크 오류: "인터넷 연결을 확인해 주세요"
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

### 4.1 Core Data 엔티티
```
{프로젝트 필요에 따라 04_database_schema.md의 표준 엔티티에서 선택}

사용 엔티티:
- [ ] User
- [ ] {Custom Entity 1}
- [ ] {Custom Entity 2}

커스텀 엔티티 추가:
Entity: {Name}
Attributes:
  id        : UUID     (required)
  {field}   : {type}   ({constraint})
  createdAt : Date     (required)
  updatedAt : Date     (required)
```

### 4.2 UserDefaults 키 목록
| 키 | 타입 | 기본값 | 설명 |
|----|------|--------|------|
| has_onboarded | Bool | false | 온보딩 완료 여부 |
| {key} | {type} | {default} | {description} |

### 4.3 Keychain 항목
| 항목 | 접근 수준 | 설명 |
|------|---------|------|
| auth_token | WhenUnlockedThisDeviceOnly | 액세스 토큰 |
| {item} | {level} | {description} |

---

## 섹션 5: API 연동

### 5.1 기본 설정
```yaml
base_url:
  production: "https://api.{domain}.com/v1"
  staging: "https://api-staging.{domain}.com/v1"
  development: "https://localhost:3000/v1"

auth: Bearer Token
timeout: 30초
retry: 최대 3회 (지수 백오프)
```

### 5.2 사용 엔드포인트
| 메서드 | 경로 | 기능 | 인증 필요 |
|--------|------|------|---------|
| POST | /auth/login | 로그인 | 불필요 |
| POST | /auth/refresh | 토큰 갱신 | 불필요 |
| GET | /user/me | 내 정보 | 필요 |
| {method} | {path} | {description} | {yes/no} |

---

## 섹션 6: 권한 (Permissions)

| 권한 | Info.plist 키 | 요청 사유 (사용자 표시 문구) | 요청 시점 |
|------|-------------|--------------------------|---------|
| [ ] 카메라 | NSCameraUsageDescription | "프로필 사진 촬영에 사용됩니다" | 사진 변경 버튼 탭 |
| [ ] 사진 라이브러리 | NSPhotoLibraryUsageDescription | "사진 선택에 사용됩니다" | 사진 선택 버튼 탭 |
| [ ] 위치(사용중) | NSLocationWhenInUseUsageDescription | | |
| [ ] 위치(항상) | NSLocationAlwaysAndWhenInUseUsageDescription | | |
| [ ] 알림 | (UNUserNotificationCenter 코드) | | |
| [ ] 마이크 | NSMicrophoneUsageDescription | | |
| [ ] Face ID | NSFaceIDUsageDescription | | |
| [ ] {기타} | {키} | | |

---

## 섹션 7: 알림 명세

| # | 알림 트리거 | 제목 | 내용 | 타입 |
|---|-----------|------|------|------|
| N01 | 주문 상태 변경 | "주문이 배송 시작되었습니다" | "{상품명} 배송 출발!" | Remote (APNs) |
| N02 | {트리거} | | | Local | Remote |

---

## 섹션 8: 오류 시나리오 (Error Scenarios)

| # | 시나리오 | HTTP 코드 | 표시 메시지 | 처리 방식 |
|---|---------|----------|-----------|---------|
| E01 | 로그인 실패 (잘못된 자격증명) | 401 | "이메일 또는 패스워드가 올바르지 않습니다" | 인라인 에러 |
| E02 | 네트워크 없음 | - | "인터넷 연결을 확인해 주세요" | 배너 알림 |
| E03 | 서버 오류 | 500 | "일시적인 오류입니다. 잠시 후 다시 시도해 주세요" | 알림 + 재시도 버튼 |
| E04 | {시나리오} | | | |

---

## 섹션 9: 테스트 요구사항

### 9.1 단위 테스트
```
프레임워크: XCTest
목표 커버리지: ViewModel, Repository, Business Logic ≥ 80%

필수 테스트 케이스:
- [ ] 로그인 성공/실패
- [ ] 토큰 갱신 로직
- [ ] 데이터 파싱 (Codable 디코딩)
- [ ] Core Data CRUD
```

### 9.2 UI 테스트
```
프레임워크: XCUITest
대상: 핵심 사용자 플로우 Happy Path
- [ ] 온보딩 → 로그인 → 메인 화면
- [ ] {핵심 플로우}
```

### 9.3 TestFlight 검증
```
내부 테스터: 개발팀 (최대 25명)
외부 테스터: 베타 사용자 (최대 10,000명)
최소 테스트 기간: 2주 (App Store 심사 전)
```

---

## 섹션 10: 배포 계획

| 단계 | 내용 | 기간 |
|------|------|------|
| Alpha | 내부 개발팀 테스트 | |
| Beta (TestFlight) | 외부 베타 테스터 | |
| App Store Review | Apple 심사 | 1~7일 (평균 1~2일) |
| Production Launch | 단계적 출시 (Phased Release) 권장 | |

```
Phased Release 설정 (App Store Connect):
7일에 걸쳐 1% → 2% → 5% → 10% → 20% → 50% → 100% 단계적 배포
문제 발견 시 즉시 중단 가능
```

---

**규격 ID:** {id} | **작성일:** {YYYY-MM-DD} | **승인:** {기획자명}
