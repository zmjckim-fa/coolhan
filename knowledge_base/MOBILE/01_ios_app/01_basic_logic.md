# iOS 앱 - 기본 논리 (iOS App Basic Logic)

## 1. iOS 앱의 특징

iOS는 **Apple의 iPhone/iPad 운영체제**에서 실행되는 네이티브 앱입니다.

### 핵심 특징
```
- Apple App Store에서만 배포 가능
- Swift 언어 사용 (네이티브)
- iOS 버전 관리 (지원 최소 버전 필요)
- Apple 심사 프로세스 필수
- 높은 보안 및 성능 요구
```

---

## 2. iOS 앱의 생명주기 (App Lifecycle)

### 2.1 앱 실행 흐름
```
사용자가 앱 아이콘 터치
    ↓
1. Not Running (실행 안 됨)
    ↓
2. Foreground (화면에 보임)
    ├─ Active (활성 - 이벤트 받음)
    └─ Inactive (비활성 - 이벤트 못 받음)
    ↓
3. Background (백그라운드에서 실행)
    ├─ Suspended (일시 중단)
    └─ Running (계속 실행)
    ↓
4. Terminated (앱 종료)
```

### 2.2 상태 변화 이벤트
```
AppDelegate 함수:
- application(_:didFinishLaunchingWithOptions:) - 앱 시작
- applicationDidBecomeActive(_:) - 활성화됨
- applicationWillResignActive(_:) - 비활성화 예정
- applicationDidEnterBackground(_:) - 백그라운드 진입
- applicationWillEnterForeground(_:) - 포그라운드 복귀
- applicationWillTerminate(_:) - 앱 종료 예정
```

---

## 3. UI/UX 구조

### 3.1 네비게이션 패턴
```
Tab Navigation
├─ Tab 1: 홈
├─ Tab 2: 검색/카테고리
├─ Tab 3: 장바구니
├─ Tab 4: 주문/구독
└─ Tab 5: 마이페이지

또는

Stack Navigation
└─ 리스트 → 상세 → 서브 상세
```

### 3.2 iOS 디자인 시스템
```
- Safe Area (화면 안전 영역)
  → 노치/홈 인디케이터 고려
- Status Bar (상단 상태 표시)
- Navigation Bar (뒤로가기, 제목)
- Tab Bar (하단 탭)
- Safe Area Insets
```

### 3.3 일반적인 화면 구조
```
┌──────────────────────┐
│    Status Bar        │
├──────────────────────┤
│  Navigation Bar      │ (뒤로가기, 제목)
├──────────────────────┤
│                      │
│   Content Area       │ (Safe Area 내)
│   (스크롤 가능)       │
│                      │
├──────────────────────┤
│   Tab Bar            │ (하단 탭)
└──────────────────────┘
```

---

## 4. 데이터 저장소 (Data Storage)

### 4.1 로컬 저장 옵션

#### UserDefaults
```
용도: 간단한 설정값 저장
예: 사용자 선호도, 토큰, 간단한 캐시
한계: 대용량 데이터 부적합, 암호화 필요
```

#### CoreData
```
용도: 구조화된 데이터 로컬 저장
예: 오프라인 주문 목록, 사용자 정보 캐시
장점: 관계형 쿼리 가능, 자동 마이그레이션
```

#### FileManager
```
용도: 파일 저장 (이미지, 문서)
예: 다운로드한 이미지, 임시 파일
경로: Documents, Caches, Temp
```

#### Keychain
```
용도: 민감한 데이터 암호화 저장
예: 비밀번호, 토큰, API 키
보안: iOS 수준의 암호화
```

### 4.2 서버 통신
```
HTTP/HTTPS API
├─ REST API (표준)
├─ GraphQL (선택사항)
└─ WebSocket (실시간)

JSON 형식 데이터 송수신
Session 관리 (JWT 토큰)
```

---

## 5. 권한 관리 (Permission)

### 5.1 iOS 권한 요청
```
앱이 처음 권한 사용 시 사용자에게 팝업으로 요청
사용자 동의 후에만 접근 가능
거부 시 앱 설정에서만 변경 가능
```

### 5.2 일반적인 권한들
```
- Camera (카메라)
- Photos (사진앨범)
- Microphone (마이크)
- Location (위치정보)
- Contacts (연락처)
- Calendar (캘린더)
- Reminders (미리알림)
- Health (헬스)
- HomeKit (스마트홈)
- Bluetooth (블루투스)
- NotificationCenter (알림)
```

### 5.3 권한 요청 예시 (쇼핑몰 앱)
```
필수:
- PhotoLibrary (상품 리뷰 사진)

선택:
- Location (배송지 근처 매장 찾기)
- NotificationCenter (주문 알림)
- Camera (실시간 상품 스캔)
```

---

## 6. 네트워킹 (Networking)

### 6.1 URLSession 기본 구조
```
URLSession
├─ Request 생성
├─ Server 전송
└─ Response 수신
   ├─ 200-299: 성공
   ├─ 300-399: 리다이렉트
   ├─ 400-499: 클라이언트 오류
   └─ 500-599: 서버 오류
```

### 6.2 네트워크 요청 흐름
```
1. Request 객체 생성 (URL, 메서드, 헤더, 바디)
2. URLSession을 통해 전송
3. 응답 대기 (비동기)
4. 응답 처리
   └─ 성공: JSON 파싱
   └─ 실패: 에러 처리
5. UI 업데이트 (메인 스레드)
```

### 6.3 에러 처리
```
네트워크 에러:
- 인터넷 연결 없음
- 타임아웃
- DNS 실패

HTTP 에러:
- 401 Unauthorized (재인증 필요)
- 404 Not Found
- 500 Server Error

파싱 에러:
- JSON 파싱 실패
- 데이터 타입 불일치
```

---

## 7. 오프라인 대응 (Offline Support)

### 7.1 오프라인 감지
```
Network Framework 사용
- WiFi 연결 상태 모니터링
- Cellular 연결 상태 모니터링
- 인터넷 연결 가능 여부 확인
```

### 7.2 오프라인 모드
```
온라인 상태:
- 실시간 데이터 로드
- 서버에 변경사항 전송

오프라인 상태:
- 캐시된 데이터 표시
- 로컬 저장소 데이터 표시
- 변경사항 임시 저장
- 온라인 복귀 시 동기화
```

### 7.3 동기화 전략
```
1. 온라인 복귀 감지
2. 대기 중인 변경사항 수집
3. 서버에 업로드
4. 충돌 해결 (서버 데이터 우선, 로컬 우선 등)
5. UI 업데이트
```

---

## 8. 백그라운드 작업 (Background Tasks)

### 8.1 배경 작업 종류

#### 1. Background App Refresh
```
목적: 주기적으로 데이터 갱신
예: 새로운 주문 확인, 배송상태 업데이트
실행 빈도: iOS가 결정 (개발자가 제어 불가)
시간: 수 분 단위
```

#### 2. Background Fetch
```
목적: 앱을 열지 않고 데이터 획득
예: 메일 수신, 메시지 확인
설정: 최소 주기 지정
```

#### 3. Silent Push Notification
```
목적: 조용한 백그라운드 갱신
예: 신규 주문, 배송 상태 변경
사용자에게 보이지 않음 (선택사항)
```

#### 4. VoIP Push
```
목적: 실시간 통신
예: 채팅, 통화
낮은 지연시간 (< 1초)
```

### 8.2 백그라운드 작업 제약
```
- 최대 실행 시간 제한 (보통 30초)
- CPU 사용 제한
- 네트워크 사용 가능
- 배터리 고려
```

---

## 9. 알림 (Notifications)

### 9.1 로컬 알림
```
앱이 예약하는 알림
예: 상품 배송 예정, 구매 완료

구성:
- 제목
- 메시지
- 배지 (앱 아이콘 숫자)
- 사운드
- 실행 시간 (즉시, 예약)
```

### 9.2 원격 알림 (Push Notification)
```
서버에서 전송하는 알림
예: 새 주문, 배송 상태 변경

구성:
- Alert (제목/메시지)
- Badge (앱 아이콘 숫자)
- Sound (알림음)
- Custom Data (추가 정보)

전달: Apple Push Notification Service (APNs)
```

### 9.3 알림 권한
```
사용자가 앱 최초 실행 시 알림 권한 요청
거부 시:
- 알림 전송 불가
- 사용자 설정에서 수동으로 활성화 가능
```

---

## 10. 성능 최적화

### 10.1 메모리 관리
```
- 이미지 캐싱 (SDWebImage, Kingfisher)
- 대용량 목록 lazy loading
- 메모리 경고 대응 (캐시 정리)
- ARC (Automatic Reference Counting) 활용
```

### 10.2 네트워크 최적화
```
- HTTP 압축 사용
- 이미지 최적화 (WebP, JPEG)
- Gzip 압축
- 불필요한 요청 제거
- 배치 요청
```

### 10.3 UI 성능
```
- 메인 스레드에서만 UI 업데이트
- 높은 프레임 레이트 유지 (60fps)
- 스크롤 성능 (cell 재사용)
- 레이아웃 계산 최적화
```

---

## 11. 보안

### 11.1 데이터 보안
```
- 민감한 데이터는 Keychain에 저장
- 통신은 HTTPS만 사용
- 토큰 저장: Keychain
- 로그아웃 시 민감한 데이터 삭제
```

### 11.2 API 보안
```
- SSL Pinning (특정 인증서만 허용)
- 요청 서명 (HMAC)
- 토큰 만료 관리
- Refresh Token 사용
```

### 11.3 코드 보안
```
- 민감한 정보 하드코딩 금지
- 로그에 민감한 정보 출력 금지
- 디버그 빌드와 릴리스 빌드 분리
```

---

## 12. 앱 배포 (Distribution)

### 12.1 개발 단계
```
1. 개발 인증서 생성
2. 개발 기기 등록
3. 개발 프로비저닝 프로필 생성
4. Xcode에서 개발 및 테스트
```

### 12.2 테스트 (TestFlight)
```
1. 베타 테스터 초대
2. 앱 빌드 업로드
3. 테스터가 설치 및 테스트
4. 피드백 수집
```

### 12.3 App Store 배포
```
1. 릴리스 인증서 생성
2. 릴리스 프로비저닝 프로필 생성
3. 앱 빌드 (릴리스)
4. App Store Connect에 업로드
5. 앱 정보 입력 (설명, 스크린샷, 가격)
6. Apple 심사 신청
7. Apple 심사 (1~3일)
8. 승인 후 배포
```

### 12.4 App Store 심사 규칙
```
- 크래시 없음
- 명확한 기능 설명
- 성인 콘텐츠 표시
- 개인정보처리방침 명시
- 광고 투명성
- 결제 시스템 준수 (Apple In-App Purchase 또는 명시적 외부 결제)
```

---

## 13. 사용자 분석

### 13.1 추적 (Analytics)
```
Google Analytics
Firebase Analytics
Amplitude

추적 항목:
- 사용자 행동 (화면 전환, 버튼 클릭)
- 이벤트 (상품 구매, 리뷰 작성)
- 사용 시간
- 충돌 (크래시)
```

### 13.2 크래시 리포팅
```
Firebase Crashlytics
Sentry
Bugly

기능:
- 크래시 자동 보고
- 스택 트레이스 분석
- 영향받은 사용자 수
- 크래시율 추이
```

---

## 14. 주요 프레임워크 및 라이브러리

```
UI:
- UIKit (전통적)
- SwiftUI (최신)

네트워킹:
- URLSession (기본)
- Alamofire (래퍼)

JSON 파싱:
- Codable (기본)
- SwiftyJSON

이미지 캐싱:
- Kingfisher
- SDWebImage

데이터 저장:
- CoreData
- SQLite (FMDB)
- Realm

비동기:
- Combine
- RxSwift

의존성 주입:
- Swinject
```

---

## 15. iOS 버전 관리

### 15.1 최소 배포 대상 (Minimum Deployment Target)
```
일반적으로: 현재 최신 버전에서 2버전 뒤
예: iOS 15를 지원하면 iOS 13 이상 필요

최신 기능 사용:
- iOS 14 이상에서만 가능한 API는 @available 체크
```

### 15.2 버전별 변경사항 대응
```
새로운 iOS 버전 출시 시:
1. 새 API 및 기능 검토
2. 기존 API 중 deprecated된 것 제거
3. UI 변화에 대응
4. 새로운 권한 시스템 대응
5. 테스트 및 인증 업데이트
```

---

## 16. 다음 문서로 읽어야 할 것

1. **core_features.md** - iOS 앱의 일반적인 기능들
2. **terminology.md** - iOS 기술 용어
3. **architecture.md** - MVVM, MVC 등 아키텍처
4. **api_standard.md** - 네트워킹 API 표준
5. **spec_template.md** - iOS 앱 기획서 템플릿

