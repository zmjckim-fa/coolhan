# iOS App Data Model (Database Schema)

## Core Data Entity Structure (Common Base)

```
[Core Data stack]
NSPersistentContainer
  └─ NSPersistentStoreCoordinator
      └─ NSManagedObjectModel (.xcdatamodeld)
          ├─ Entity: User
          ├─ Entity: Product
          ├─ Entity: Order
          └─ Entity: Cache

Context usage rules:
- viewContext (Main Queue) → for UI-display reads only
- backgroundContext (Private Queue) → save/modify/delete
- Use container.performBackgroundTask { ctx in ... }
```

---

## Standard Entity Definitions

### User
```
Entity: User
Attributes:
  id          : UUID    (required, primary key)
  email       : String  (required, unique)
  displayName : String  (required)
  avatarURL   : String  (optional, URL string)
  createdAt   : Date    (required)
  updatedAt   : Date    (required)

Relationships:
  orders      : Order   (one-to-many, cascade delete)
  preferences : UserPreference (one-to-one, cascade delete)

Indexes: email (unique), createdAt
Fetch predicate example: NSPredicate(format: "email == %@", email)
```

### Product
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

### Order
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

### OrderItem
```
Entity: OrderItem
Attributes:
  id          : UUID    (required)
  productTitle: String  (required, snapshot at order time)
  unitPrice   : Double  (required)
  quantity    : Integer16 (required, min: 1)
  subtotal    : Double  (required, derived)

Relationships:
  order       : Order   (many-to-one, nullify)
```

### CachedResponse (API response cache)
```
Entity: CachedResponse
Attributes:
  cacheKey    : String  (required, unique) — hash of URL + parameters
  data        : Binary  (required) — JSON Data
  etag        : String  (optional)
  expiresAt   : Date    (required)
  cachedAt    : Date    (required)

Index: cacheKey (unique), expiresAt
Expiration cleanup: delete all where expiresAt < now at app startup
```

---

## Keychain Storage Structure

```swift
// Keychain item key definitions (Constants)
enum KeychainKey: String {
    case authToken      = "com.app.auth_token"
    case refreshToken   = "com.app.refresh_token"
    case userID         = "com.app.user_id"
    case biometricToken = "com.app.biometric_token"
}

// Storage attributes
kSecClass: kSecClassGenericPassword
kSecAttrService: Bundle.main.bundleIdentifier
kSecAttrAccount: KeychainKey.rawValue
kSecAttrAccessible: kSecAttrAccessibleWhenUnlockedThisDeviceOnly
                    // on this device only, only while unlocked
kSecAttrSynchronizable: false  // no iCloud synchronization (security)

// Access Group (when sharing across app groups)
kSecAttrAccessGroup: "$(AppIdentifierPrefix)com.app.shared"
```

---

## UserDefaults Storage Structure

```swift
// Structured key management
enum UserDefaultsKey: String {
    case hasOnboarded       = "has_onboarded"
    case selectedLanguage   = "selected_language"
    case notificationsOn    = "notifications_on"
    case lastSyncDate       = "last_sync_date"
    case appVersion         = "app_version"
}

// Usage pattern
UserDefaults.standard.set(true, forKey: UserDefaultsKey.hasOnboarded.rawValue)
UserDefaults.standard.bool(forKey: UserDefaultsKey.hasOnboarded.rawValue)

// App group sharing (widgets/Extensions)
let sharedDefaults = UserDefaults(suiteName: "group.com.app.shared")
```

---

## File System Structure

```
App sandbox:
/Documents/          → user data, backed up to iCloud
  ├─ exports/        → export files created by the user
  └─ downloads/      → user-downloaded files
/Library/
  ├─ Application Support/  → app data, backed up to iCloud
  │   ├─ CoreData/         → .sqlite, .sqlite-wal, .sqlite-shm
  │   └─ config.json       → app settings
  ├─ Caches/               → regenerable cache, excluded from backup
  │   ├─ images/           → downloaded image cache
  │   └─ responses/        → API response cache
  └─ Preferences/          → UserDefaults (.plist)
/tmp/                → temporary files, periodically purged by the system

File naming rule: UUID-based (collision avoidance)
e.g.) "550e8400-e29b-41d4-a716-446655440000.jpg"
```

---

## Migration Strategy (Core Data)

```swift
// Lightweight Migration (sufficient in most cases)
let options: [String: Any] = [
    NSMigratePersistentStoresAutomaticallyOption: true,
    NSInferMappingModelAutomaticallyOption: true
]
container.persistentStoreDescriptions.first?.setOption(true as NSNumber,
    forKey: NSMigratePersistentStoresAutomaticallyOption)

// Heavy Migration (major structural changes)
// 1. Add a new .xcdatamodeld version (Add Model Version)
// 2. Create an NSMappingModel (specify transformation rules)
// 3. Stepwise migration with NSMigrationManager

Version management rules:
- Any Core Data model change = must add a new version
- Never delete previous version files
- On migration failure, do not reset user data → report the error
```

---

## NSFetchRequest Standard Patterns

```swift
// Single-item fetch
func fetchUser(by id: UUID, context: NSManagedObjectContext) -> User? {
    let request: NSFetchRequest<User> = User.fetchRequest()
    request.predicate = NSPredicate(format: "id == %@", id as CVarArg)
    request.fetchLimit = 1
    return try? context.fetch(request).first
}

// List fetch (pagination)
func fetchOrders(page: Int, pageSize: Int = 20,
                 context: NSManagedObjectContext) -> [Order] {
    let request: NSFetchRequest<Order> = Order.fetchRequest()
    request.sortDescriptors = [NSSortDescriptor(key: "orderedAt", ascending: false)]
    request.fetchLimit = pageSize
    request.fetchOffset = page * pageSize
    return (try? context.fetch(request)) ?? []
}

// Aggregation
func countPendingOrders(context: NSManagedObjectContext) -> Int {
    let request: NSFetchRequest<Order> = Order.fetchRequest()
    request.predicate = NSPredicate(format: "status == %@", "pending")
    return (try? context.count(for: request)) ?? 0
}
```

---

**Document version:** 1.0.0 | **Date:** 2026-06-13 | **Target OS:** iOS 15+
