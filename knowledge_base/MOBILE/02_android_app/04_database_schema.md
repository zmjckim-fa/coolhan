# Android 앱 데이터 모델 (Database Schema)

## Room Database 구조

```
Room 스택:
@Database → AppDatabase (RoomDatabase 상속)
  ├─ @Entity → 테이블 정의 (data class)
  ├─ @Dao    → 쿼리 인터페이스
  └─ TypeConverter → 커스텀 타입 변환 (Date, List 등)

싱글톤 패턴:
companion object {
    @Volatile private var INSTANCE: AppDatabase? = null
    fun getInstance(context: Context): AppDatabase =
        INSTANCE ?: synchronized(this) {
            Room.databaseBuilder(context.applicationContext,
                AppDatabase::class.java, "app_database")
                .addMigrations(MIGRATION_1_2)
                .build().also { INSTANCE = it }
        }
}
```

---

## 표준 엔티티 정의

### User (사용자)
```kotlin
@Entity(tableName = "users",
    indices = [Index(value = ["email"], unique = true)])
data class UserEntity(
    @PrimaryKey val id: String,          // UUID 문자열
    val email: String,
    val display_name: String,
    val avatar_url: String?,
    val created_at: Long,                // Unix timestamp (ms)
    val updated_at: Long
)

@Dao
interface UserDao {
    @Query("SELECT * FROM users WHERE id = :id")
    suspend fun findById(id: String): UserEntity?

    @Query("SELECT * FROM users WHERE email = :email LIMIT 1")
    suspend fun findByEmail(email: String): UserEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsert(user: UserEntity)

    @Delete
    suspend fun delete(user: UserEntity)
}
```

### Product (상품)
```kotlin
@Entity(tableName = "products",
    indices = [Index("category"), Index("is_available")])
data class ProductEntity(
    @PrimaryKey val id: String,
    val title: String,
    val description: String?,
    val price: Double,
    val currency: String = "KRW",
    val category: String,
    val thumbnail_url: String?,
    val is_available: Boolean = true,
    val stock_count: Int = 0,
    val created_at: Long,
    val updated_at: Long
)

@Dao
interface ProductDao {
    @Query("SELECT * FROM products WHERE is_available = 1 ORDER BY created_at DESC LIMIT :limit OFFSET :offset")
    suspend fun getAvailableProducts(limit: Int = 20, offset: Int = 0): List<ProductEntity>

    @Query("SELECT * FROM products WHERE category = :category AND is_available = 1")
    fun getByCategory(category: String): Flow<List<ProductEntity>>

    @Query("SELECT COUNT(*) FROM products WHERE stock_count <= :threshold")
    suspend fun countLowStock(threshold: Int = 5): Int

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertAll(products: List<ProductEntity>)
}
```

### Order (주문)
```kotlin
@Entity(tableName = "orders",
    foreignKeys = [ForeignKey(
        entity = UserEntity::class,
        parentColumns = ["id"],
        childColumns = ["user_id"],
        onDelete = ForeignKey.SET_NULL
    )],
    indices = [Index("user_id"), Index("status")])
data class OrderEntity(
    @PrimaryKey val id: String,
    val user_id: String?,
    val status: String,               // pending/paid/shipping/delivered/cancelled
    val total_amount: Double,
    val currency: String = "KRW",
    val ordered_at: Long,
    val updated_at: Long
)

@Entity(tableName = "order_items",
    foreignKeys = [ForeignKey(
        entity = OrderEntity::class,
        parentColumns = ["id"],
        childColumns = ["order_id"],
        onDelete = ForeignKey.CASCADE
    )],
    indices = [Index("order_id")])
data class OrderItemEntity(
    @PrimaryKey val id: String,
    val order_id: String,
    val product_title: String,         // 주문 시점 스냅샷
    val unit_price: Double,
    val quantity: Int,
    val subtotal: Double
)

// 관계 조회용 데이터 클래스
data class OrderWithItems(
    @Embedded val order: OrderEntity,
    @Relation(parentColumn = "id", entityColumn = "order_id")
    val items: List<OrderItemEntity>
)

@Dao
interface OrderDao {
    @Transaction
    @Query("SELECT * FROM orders WHERE user_id = :userId ORDER BY ordered_at DESC")
    fun getOrdersWithItems(userId: String): Flow<List<OrderWithItems>>

    @Query("UPDATE orders SET status = :status, updated_at = :now WHERE id = :orderId")
    suspend fun updateStatus(orderId: String, status: String, now: Long)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertOrder(order: OrderEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertItems(items: List<OrderItemEntity>)

    @Transaction
    suspend fun insertOrderWithItems(order: OrderEntity, items: List<OrderItemEntity>) {
        insertOrder(order)
        insertItems(items)
    }
}
```

### CachedResponse (API 응답 캐시)
```kotlin
@Entity(tableName = "cached_responses",
    indices = [Index(value = ["cache_key"], unique = true)])
data class CachedResponseEntity(
    @PrimaryKey val cache_key: String,  // URL + 파라미터 해시
    val data: ByteArray,                // JSON bytes
    val etag: String?,
    val expires_at: Long,               // Unix ms
    val cached_at: Long
)

@Dao
interface CachedResponseDao {
    @Query("SELECT * FROM cached_responses WHERE cache_key = :key AND expires_at > :now")
    suspend fun getValid(key: String, now: Long = System.currentTimeMillis()): CachedResponseEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsert(entity: CachedResponseEntity)

    @Query("DELETE FROM cached_responses WHERE expires_at <= :now")
    suspend fun deleteExpired(now: Long = System.currentTimeMillis())
}
```

---

## TypeConverter (커스텀 타입 변환)

```kotlin
class Converters {
    @TypeConverter
    fun fromTimestamp(value: Long?): Date? = value?.let { Date(it) }

    @TypeConverter
    fun dateToTimestamp(date: Date?): Long? = date?.time

    @TypeConverter
    fun fromStringList(value: String?): List<String>? =
        value?.let { Gson().fromJson(it, object : TypeToken<List<String>>() {}.type) }

    @TypeConverter
    fun toStringList(list: List<String>?): String? = list?.let { Gson().toJson(it) }
}

// Database에 TypeConverter 등록
@Database(entities = [...], version = 1)
@TypeConverters(Converters::class)
abstract class AppDatabase : RoomDatabase()
```

---

## EncryptedSharedPreferences (보안 저장소)

```kotlin
// Android Keystore 기반 암호화 (민감 데이터)
object SecurePrefs {
    private const val FILE_NAME = "secure_prefs"

    fun get(context: Context): SharedPreferences {
        val masterKey = MasterKey.Builder(context)
            .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
            .build()
        return EncryptedSharedPreferences.create(
            context, FILE_NAME, masterKey,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
        )
    }
}

// 키 상수
object SecureKey {
    const val AUTH_TOKEN = "auth_token"
    const val REFRESH_TOKEN = "refresh_token"
    const val USER_ID = "user_id"
}

// 사용
val prefs = SecurePrefs.get(context)
prefs.edit().putString(SecureKey.AUTH_TOKEN, token).apply()
val token = prefs.getString(SecureKey.AUTH_TOKEN, null)
```

---

## DataStore (일반 설정)

```kotlin
// 키 정의
object PreferencesKeys {
    val HAS_ONBOARDED = booleanPreferencesKey("has_onboarded")
    val SELECTED_LANGUAGE = stringPreferencesKey("selected_language")
    val NOTIFICATIONS_ENABLED = booleanPreferencesKey("notifications_enabled")
    val LAST_SYNC_TIMESTAMP = longPreferencesKey("last_sync_timestamp")
}

// DataStore 인스턴스 (Application 또는 DI)
val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "app_settings")

// 읽기 (Flow)
val hasOnboarded: Flow<Boolean> = context.dataStore.data
    .map { prefs -> prefs[PreferencesKeys.HAS_ONBOARDED] ?: false }

// 쓰기 (suspend)
suspend fun setOnboarded(context: Context) {
    context.dataStore.edit { prefs ->
        prefs[PreferencesKeys.HAS_ONBOARDED] = true
    }
}
```

---

## 마이그레이션 전략

```kotlin
// 버전 1 → 2: 컬럼 추가
val MIGRATION_1_2 = object : Migration(1, 2) {
    override fun migrate(database: SupportSQLiteDatabase) {
        database.execSQL("ALTER TABLE users ADD COLUMN phone_number TEXT")
    }
}

// 버전 2 → 3: 테이블 추가
val MIGRATION_2_3 = object : Migration(2, 3) {
    override fun migrate(database: SupportSQLiteDatabase) {
        database.execSQL("""
            CREATE TABLE IF NOT EXISTS cached_responses (
                cache_key TEXT NOT NULL PRIMARY KEY,
                data BLOB NOT NULL,
                etag TEXT,
                expires_at INTEGER NOT NULL,
                cached_at INTEGER NOT NULL
            )
        """.trimIndent())
        database.execSQL("CREATE UNIQUE INDEX index_cached_responses_cache_key ON cached_responses (cache_key)")
    }
}

// Database에 등록
Room.databaseBuilder(context, AppDatabase::class.java, "app_database")
    .addMigrations(MIGRATION_1_2, MIGRATION_2_3)
    .build()

// 주의: 파괴적 마이그레이션은 사용자 데이터 손실 → 절대 금지
// .fallbackToDestructiveMigration() → 프로덕션 사용 금지
```

---

**문서 버전:** 1.0.0 | **작성일:** 2026-06-13 | **대상 OS:** Android 8.0(API 26)+
