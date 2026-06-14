# CoolHan KB 핵심 모듈 매핑 (Core Module Mapping)

**버전:** 1.0.0 | **작성일:** 2026-06-13 | **상태:** ACTIVE

---

## 개요

CoolHan Knowledge Base는 두 계층으로 구성된다:

```
Layer 1 — 도메인 모듈 (Domain Modules, 01~11)
  비즈니스 기능 단위. 플랫폼 무관.
  예: 회원 시스템, 결제 시스템, 재고 관리

Layer 2 — 솔루션 타입 KB (Solution Type KB)
  플랫폼별 구현 표준. 도메인 모듈을 어떻게 구현하는가.
  예: iOS 앱의 회원 시스템 = Keychain + LAContext + APNs
```

프로젝트는 두 계층을 모두 로드하여 "무엇을 만드는가(도메인)" + "어떻게 만드는가(솔루션)"를 통합 규격으로 생성한다.

---

## 1. 도메인 모듈 → 솔루션 타입 매핑 테이블

| 도메인 모듈 | WEB (Ecommerce) | MOBILE (iOS) | MOBILE (Android) | DESKTOP (Windows) | SMB (POS) |
|-----------|----------------|--------------|-----------------|-------------------|-----------|
| **01 회원** | JWT + bcrypt + Express session | Keychain + LAContext + APNs | EncryptedSharedPref + BiometricPrompt + FCM | Windows Credential Manager + Windows Hello | 로컬 사용자 + 역할 |
| **02 쇼핑몰** | ProductGrid + Cart + Wishlist | CollectionView + SwiftUI | LazyColumn (Compose) + Room cache | DataGrid + ObservableCollection | 상품 바코드 조회 |
| **03 결제** | PG (토스/KG이니시스) + 가상계좌 | StoreKit (인앱) or 웹뷰 PG | Billing Library or 웹뷰 PG | 웹뷰 PG or 외부 연동 | 현금/카드 POS 단말 |
| **04 배송** | 택배사 API + 트래킹 + 주소 | 배송 추적 화면 | 배송 추적 + Room | 배송 관리 DataGrid | 로컬 배송/픽업 |
| **05 어드민** | Express Admin Routes + 권한 | (생략 — 웹 어드민 사용) | (생략 — 웹 어드민 사용) | NavigationView 어드민 패널 | POS 관리자 화면 |
| **06 알림** | Email (Nodemailer) + SMS + FCM | APNs + UNUserNotification | FCM + NotificationChannel | Toast 알림 + 트레이 알림 | 영수증 프린터 + SMS |
| **07 리뷰/평점** | REST API + 별점 UI | SwiftUI Rating View | Compose Rating | 별점 DataTemplate | 고객 평가 |
| **08 재고** | DB 재고 필드 + 예약 트랜잭션 | 재고 표시 (조회만) | 재고 표시 + Room | DataGrid 재고 관리 | 실시간 재고 차감 |
| **09 주문** | OrderService + 상태기계 | OrderHistoryView | OrderHistory (Compose+Room) | 주문 DataGrid + 필터 | 영수증 + 주문 큐 |
| **10 개인정보** | GDPR 엔드포인트 + 동의 UI | Privacy Nutrition Labels + ATT | Play 데이터보안섹션 + 런타임권한 | 개인정보처리방침 링크 + 삭제 기능 | 고객 정보 최소 수집 |
| **11 구매신청** | B2B 견적 요청 플로우 | B2B 모바일 신청서 | B2B 모바일 신청서 | 기업용 구매 신청 DataGrid | (해당없음) |

---

## 2. 솔루션 타입 KB 완성도

| 솔루션 타입 | 경로 | 완성도 | 파일 현황 |
|-----------|------|--------|---------|
| **WEB — E-Commerce Mall** | `WEB/01_ecommerce_mall/` | ✅ 7/7 | 01~07 완료 |
| **MOBILE — iOS App** | `MOBILE/01_ios_app/` | ✅ 7/7 | 01~07 완료 |
| **MOBILE — Android App** | `MOBILE/02_android_app/` | ✅ 7/7 | 01~07 완료 |
| **DESKTOP — Windows App** | `DESKTOP/01_windows_app/` | ✅ 7/7 | 01~07 완료 |
| **SMB — POS System** | `SMB/02_pos_system/` | ✅ 7/7 | 01~07 완료 |

**총 솔루션 타입 KB:** 5종, 35개 파일 — 전체 완료 ✅

---

## 3. 도메인 모듈 완성도

| 모듈 | 파일 | 완성도 | 섹션 |
|------|------|--------|------|
| **01 회원 시스템** | `01_member_system.md` | ✅ | 12/12 |
| **02 쇼핑몰** | `02_shopping_mall.md` | ✅ | 12/12 |
| **03 결제** | `03_payment_system.md` | ✅ | 12/12 |
| **04 배송** | `04_shipping_logistics.md` | ✅ | 12/12 |
| **05 어드민** | `05_admin_system.md` | ✅ | 12/12 |
| **06 알림** | `06_notification_system.md` | ✅ | 12/12 |
| **07 리뷰/평점** | `07_review_rating_system.md` | ✅ | 12/12 |
| **08 재고** | `08_inventory_management.md` | ✅ | 12/12 |
| **09 주문** | `09_order_management.md` | ✅ | 12/12 |
| **10 개인정보** | `10_gdpr_privacy.md` | ✅ | 12/12 |
| **11 구매신청** | `11_purchase_application.md` | ✅ | 12/12 |

**총 도메인 모듈:** 11/11 완료 ✅

---

## 4. 프로젝트 타입별 권장 모듈 조합

### 4.1 웹 기반

| 프로젝트 | 필수 모듈 | 선택 모듈 | KB 레퍼런스 |
|---------|---------|---------|-----------|
| **B2C 쇼핑몰** | 01+02+03+04+06+08+09+10 | 05+07+11 | `WEB/01_ecommerce_mall/` |
| **B2B 구매 시스템** | 01+05+06+10+11 | 03+08+09 | `WEB/01_ecommerce_mall/` |
| **SaaS 플랫폼** | 01+05+06+10 | 03+08 | `WEB/01_ecommerce_mall/` |
| **마켓플레이스** | 01+02+03+04+05+06+07+08+09+10 | 11 | `core/marketplace_core.md` |

### 4.2 모바일 기반

| 프로젝트 | 필수 모듈 | 선택 모듈 | KB 레퍼런스 |
|---------|---------|---------|-----------|
| **iOS 쇼핑 앱** | 01+02+03+06+09+10 | 04+07+08 | `MOBILE/01_ios_app/` |
| **Android 쇼핑 앱** | 01+02+03+06+09+10 | 04+07+08 | `MOBILE/02_android_app/` |
| **모바일 B2B 앱** | 01+05+06+10+11 | 08+09 | `MOBILE/01_ios_app/` or `MOBILE/02_android_app/` |
| **크로스플랫폼 앱** | 01+02+06+10 | 03+08+09 | 두 모바일 KB 병행 참조 |

### 4.3 데스크탑 기반

| 프로젝트 | 필수 모듈 | 선택 모듈 | KB 레퍼런스 |
|---------|---------|---------|-----------|
| **재고 관리 앱** | 01+05+06+08+10 | 09+11 | `DESKTOP/01_windows_app/` |
| **기업 구매 시스템** | 01+05+06+10+11 | 03+08+09 | `DESKTOP/01_windows_app/` |
| **ERP 클라이언트** | 01+05+06+08+09+10 | 03+04+11 | `DESKTOP/01_windows_app/` |
| **분석/리포팅 도구** | 01+05+10 | 06 | `DESKTOP/01_windows_app/` |

### 4.4 SMB/오프라인

| 프로젝트 | 필수 모듈 | 선택 모듈 | KB 레퍼런스 |
|---------|---------|---------|-----------|
| **POS 시스템** | 01+03+08+09+10 | 05+06+07 | `SMB/02_pos_system/` |
| **카페/레스토랑 POS** | 01+03+08+09 | 06 | `SMB/02_pos_system/` |
| **소매점 POS** | 01+02+03+08+09+10 | 05+06+07 | `SMB/02_pos_system/` |

---

## 5. 기술 스택 선택 가이드

프로젝트 유형에 따른 솔루션 타입 KB 로드 순서:

```
Step 1: 00_TECH_PARAMETER_DEFINITION.md 로드 → 기술 파라미터 정의
Step 2: 00_TECH_PARAMETER_MAPPING.md 로드 → 파라미터 → 모듈 매핑 확인
Step 3: 해당 솔루션 타입 KB 01_basic_logic.md 로드
Step 4: 필요 도메인 모듈(01~11) 선택적 로드
Step 5: 통합 규격 문서 생성 (07_spec_template.md 기반)
```

---

## 6. 공통 기술 패턴 크로스 참조

### 인증 패턴 (01_member_system.md 구현체)

| 플랫폼 | 저장소 | 인증 방식 | 갱신 전략 |
|--------|--------|---------|---------|
| Web | httpOnly Cookie | JWT + Refresh Token | Silent refresh (인터셉터) |
| iOS | Keychain | JWT + Refresh | URLSession actor 뮤텍스 |
| Android | EncryptedSharedPref | JWT + Refresh | OkHttp Interceptor + Mutex |
| Windows Desktop | Credential Manager | JWT + Refresh | SemaphoreSlim |
| POS | 로컬 DB | PIN or 역할 기반 세션 | 수동 전환 |

### 오프라인 캐시 패턴 (02, 08, 09 모듈 관련)

| 플랫폼 | 캐시 저장소 | 갱신 전략 | 동기화 |
|--------|-----------|---------|--------|
| Web | Redis / 로컬 메모리 | Cache-then-Network | WebSocket or polling |
| iOS | NSCache + Core Data | Cache-then-Network (AsyncStream) | Background App Refresh |
| Android | Room Database | Flow + network fallback | WorkManager |
| Windows | SQLite + EF Core | IDbContextFactory | BackgroundWorker |
| POS | SQLite | 오프라인 우선, 연결 시 업로드 | 배치 동기화 |

### 알림 패턴 (06_notification_system.md 구현체)

| 플랫폼 | 푸시 서비스 | 로컬 알림 | 채널/그룹 |
|--------|----------|---------|---------|
| Web | FCM Web Push / SSE | Notification API | 브라우저 권한 |
| iOS | APNs | UNUserNotificationCenter | UNNotificationCategory |
| Android | FCM | NotificationChannel (필수 Android 8+) | NotificationManager |
| Windows | WNS / Toast | AppNotificationManager | NotificationGroup |
| POS | (없음) | 화면 팝업 + 프린터 | — |

---

## 7. 확장 모듈 로드맵

현재 11개 도메인 모듈로 약 80%의 프로젝트 커버. 필요 시 추가:

| # | 모듈명 | 우선순위 | 주요 솔루션 타입 |
|---|-------|---------|--------------|
| 12 | 구독/청구 (Subscription Billing) | High | SaaS, 서비스업 |
| 13 | 콘텐츠 관리 (CMS) | Medium | 블로그, 랜딩페이지 |
| 14 | 분석/리포팅 (Analytics) | High | 모든 타입 |
| 15 | 마켓플레이스 판매자 (Multi-seller) | Medium | 마켓플레이스 |
| 16 | 추천 엔진 (Recommendation) | Low | E-Commerce |
| 17 | 예약/스케줄링 (Booking) | Medium | 서비스업, 병원 |

---

**참조 문서:**
- [`00_DOMAIN_MODULES_INDEX.md`](00_DOMAIN_MODULES_INDEX.md) — 모듈 상세 목록
- [`00_TECH_PARAMETER_DEFINITION.md`](00_TECH_PARAMETER_DEFINITION.md) — 기술 파라미터 정의
- [`00_TECH_PARAMETER_MAPPING.md`](00_TECH_PARAMETER_MAPPING.md) — 파라미터 매핑표
- [`00_MODULE_RESPONSIBILITY_MATRIX.md`](00_MODULE_RESPONSIBILITY_MATRIX.md) — 모듈 책임 분리
- [`00_KNOWLEDGE_BASE_EXTENSIBILITY.md`](00_KNOWLEDGE_BASE_EXTENSIBILITY.md) — KB 확장 규칙
