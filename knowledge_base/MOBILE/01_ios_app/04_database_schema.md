# iOS 앱 데이터 모델 (Database Schema)

## Core Data 엔티티 구조 (공통 베이스)

```
[Core Data 스택]
NSPersistentContainer
  └─ NSPersistentStoreCoordinator
      └─ NSManagedObjectModel (.xcdatamodeld)
          ├─ Entity: User
          ├─ Entity: Product
          ├─ Entity: Order
          └─ Entity: Cache

컨텍스트 사용 규칙:
- viewContext (Main Queue) → UI 표시용 조회만
- backgroundContext (Private Queue) → 저장·수정·삭제
- container.performBackgroundTask { ctx in ... } 사용
```

---

## 표준 엔티티 정의

### User (사용자)
```
Entity: User
Attributes:
  id          : UUID    (required, 기본키)
  email       : String  (required, unique)
  displayName : String  (required)
  avatarURL   : String  (optional, URL 문자열)
  createdAt   : Date    (required)
  updatedAt   : Date    (required)

Relationships:
  orders      : Order   (one-to-many, cascade delete)
  preferences : UserPreference (one-to-one, cascade delete)

Indexes: email (unique), createdAt
Fetch predicate 예: NSPredicate(format: "email == %@", email)
```

### Product (상품)
```
Entity: Product
Attributes:
  id          : UUID    (required)
  title       : String  (required)
  body        : String  (optional)
  price       : Double  (required, default: 0.0)
  currency    : String  (required, default: "KRW")
  category    : String  (required)
  thumbnailURL: String  (optional)
  isAvailable : Boolean (required, default: true)
  stockCount  : Integer32 (required, default: 0)
  createdAt   : Date
  updatedAt   : Date

Indexes: category, price, isAvailable
```

### Order (주문)
```
Entity: Order
Attributes:
  id          : UUID    (required)
  status      : String  (required) — pending/paid/shipping/delivered/cancelled
  totalAmount : Double  (required)
  currency    : String  (required, default: "KRW")
  orderedAt   : Date    (required)
  updatedAt   : Date

Relationships:
  user        : User    (many-to-one, nullify)
  items       : OrderItem (one-to-many, cascade delete)
```

### OrderItem (주문 항목)
```
Entity: OrderItem
Attributes:
  id          : UUID    (required)
  productTitle: String  (required, 주문 시 스냅샷)
  unitPrice   : Double  (required)
  quantity    : Integer16 (required, min: 1)
  subtotal    : Double  (required, derived)

Relationships:
  order       : Order   (many-to-one, nullify)
```

### CachedResponse (API 응답 캐시)
```
Entity: CachedResponse
Attributes:
  cacheKey    : String  (required, unique) — URL + 파라미터 해시
  data        : Binary  (required) — JSON Data
  etag        : String  (optional)
  expiresAt   : Date    (required)
  cachedAt    : Date    (required)

Index: cacheKey (unique), expiresAt
만료 정리: 앱 시작 시 expiresAt < now 전체 삭제
```

---

## Keychain 저장 구조

```swift
// Keychain 항목 키 정의 (Constants)
enum KeychainKey: String {
    case authToken      = "com.app.auth_token"
    case refreshToken   = "com.app.refresh_token"
    case userID         = "com.app.user_id"
    case biometricToken = "com.app.biometric_token"
}

// 저장 속성
kSecClass: kSecClassGenericPassword
kSecAttrService: Bundle.main.bundleIdentifier
kSecAttrAccount: KeychainKey.rawValue
kSecAttrAccessible: kSecAttrAccessibleWhenUnlockedThisDeviceOnly
                    // 이 기기에서만, 잠금 해제 상태에서만
kSecAttrSynchronizable: false  // iCloud 동기화 금지 (보안)

// Access Group (앱 그룹 간 공유 시)
kSecAttrAccessGroup: "$(AppIdentifierPrefix)com.app.shared"
```

---

## UserDefaults 저장 구조

```swift
// 구조화된 키 관리
enum UserDefaultsKey: String {
    case hasOnboarded       = "has_onboarded"
    case selectedLanguage   = "selected_language"
    case notificationsOn    = "notifications_on"
    case lastSyncDate       = "last_sync_date"
    case appVersion         = "app_version"
}

// 사용 패턴
UserDefaults.standard.set(true, forKey: UserDefaultsKey.hasOnboarded.rawValue)
UserDefaults.standard.bool(forKey: UserDefaultsKey.hasOnboarded.rawValue)

// 앱 그룹 공유 (위젯/Extension)
let sharedDefaults = UserDefaults(suiteName: "group.com.app.shared")
```

---

## 파일 시스템 구조

```
앱 샌드박스:
/Documents/          → 사용자 데이터, iCloud 백업 대상
  ├─ exports/        → 사용자가 생성한 내보내기 파일
  └─ downloads/      → 사용자 다운로드 파일
/Library/
  ├─ Application Support/  → 앱 데이터, iCloud 백업 대상
  │   ├─ CoreData/         → .sqlite, .sqlite-wal, .sqlite-shm
  │   └─ config.json       → 앱 설정
  ├─ Caches/               → 재생성 가능한 캐시, 백업 제외
  │   ├─ images/           → 다운로드 이미지 캐시
  │   └─ responses/        → API 응답 캐시
  └─ Preferences/          → UserDefaults (.plist)
/tmp/                → 임시 파일, 시스템이 주기적으로 삭제

파일명 규칙: UUID 기반 (충돌 방지)
ex) "550e8400-e29b-41d4-a716-446655440000.jpg"
```

---

## 마이그레이션 전략 (Core Data)

```swift
// Lightweight Migration (대부분의 경우 충분)
let options: [String: Any] = [
    NSMigratePersistentStoresAutomaticallyOption: true,
    NSInferMappingModelAutomaticallyOption: true
]
container.persistentStoreDescriptions.first?.setOption(true as NSNumber,
    forKey: NSMigratePersistentStoresAutomaticallyOption)

// Heavy Migration (구조 대폭 변경)
// 1. 새 .xcdatamodeld 버전 추가 (Add Model Version)
// 2. NSMappingModel 생성 (변환 규칙 명시)
// 3. NSMigrationManager로 단계적 마이그레이션

버전 관리 규칙:
- Core Data 모델 변경 = 반드시 새 버전 추가
- 이전 버전 파일 절대 삭제 금지
- 마이그레이션 실패 시 사용자 데이터 초기화 금지 → 오류 보고
```

---

## NSFetchRequest 표준 패턴

```swift
// 단건 조회
func fetchUser(by id: UUID, context: NSManagedObjectContext) -> User? {
    let request: NSFetchRequest<User> = User.fetchRequest()
    request.predicate = NSPredicate(format: "id == %@", id as CVarArg)
    request.fetchLimit = 1
    return try? context.fetch(request).first
}

// 목록 조회 (페이지네이션)
func fetchOrders(page: Int, pageSize: Int = 20,
                 context: NSManagedObjectContext) -> [Order] {
    let request: NSFetchRequest<Order> = Order.fetchRequest()
    request.sortDescriptors = [NSSortDescriptor(key: "orderedAt", ascending: false)]
    request.fetchLimit = pageSize
    request.fetchOffset = page * pageSize
    return (try? context.fetch(request)) ?? []
}

// 집계
func countPendingOrders(context: NSManagedObjectContext) -> Int {
    let request: NSFetchRequest<Order> = Order.fetchRequest()
    request.predicate = NSPredicate(format: "status == %@", "pending")
    return (try? context.count(for: request)) ?? 0
}
```

---

**문서 버전:** 1.0.0 | **작성일:** 2026-06-13 | **대상 OS:** iOS 15+
