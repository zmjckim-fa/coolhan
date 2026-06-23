# Android App Data Model (Database Schema)

## Room Database Structure

```
Room stack:
@Database → AppDatabase (extends RoomDatabase)
  ├─ @Entity → table definition (data class)
  ├─ @Dao    → query interface
  └─ TypeConverter → custom type conversion (Date, List, etc.)

Singleton pattern:
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

## Standard Entity Definitions

### User
```kotlin
@Entity(tableName = "users",
    indices = [Index(value = ["email"], unique = true)])
data class UserEntity(
    @PrimaryKey val id: String,          // UUID string
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

### Product
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

### Order
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
    val product_title: String,         // snapshot at order time
    val unit_price: Double,
    val quantity: Int,
    val subtotal: Double
)

// Data class for relational queries
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

### CachedResponse (API Response Cache)
```kotlin
@Entity(tableName = "cached_responses",
    indices = [Index(value = ["cache_key"], unique = true)])
data class CachedResponseEntity(
    @PrimaryKey val cache_key: String,  // hash of URL + parameters
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

## TypeConverter (Custom Type Conversion)

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

// Register TypeConverter with the Database
@Database(entities = [...], version = 1)
@TypeConverters(Converters::class)
abstract class AppDatabase : RoomDatabase()
```

---

## EncryptedSharedPreferences (Secure Storage)

```kotlin
// Android Keystore-based encryption (sensitive data)
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

// Key constants
object SecureKey {
    const val AUTH_TOKEN = "auth_token"
    const val REFRESH_TOKEN = "refresh_token"
    const val USER_ID = "user_id"
}

// Usage
val prefs = SecurePrefs.get(context)
prefs.edit().putString(SecureKey.AUTH_TOKEN, token).apply()
val token = prefs.getString(SecureKey.AUTH_TOKEN, null)
```

---

## DataStore (General Settings)

```kotlin
// Key definitions
object PreferencesKeys {
    val HAS_ONBOARDED = booleanPreferencesKey("has_onboarded")
    val SELECTED_LANGUAGE = stringPreferencesKey("selected_language")
    val NOTIFICATIONS_ENABLED = booleanPreferencesKey("notifications_enabled")
    val LAST_SYNC_TIMESTAMP = longPreferencesKey("last_sync_timestamp")
}

// DataStore instance (Application or DI)
val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "app_settings")

// Read (Flow)
val hasOnboarded: Flow<Boolean> = context.dataStore.data
    .map { prefs -> prefs[PreferencesKeys.HAS_ONBOARDED] ?: false }

// Write (suspend)
suspend fun setOnboarded(context: Context) {
    context.dataStore.edit { prefs ->
        prefs[PreferencesKeys.HAS_ONBOARDED] = true
    }
}
```

---

## Migration Strategy

```kotlin
// Version 1 → 2: add column
val MIGRATION_1_2 = object : Migration(1, 2) {
    override fun migrate(database: SupportSQLiteDatabase) {
        database.execSQL("ALTER TABLE users ADD COLUMN phone_number TEXT")
    }
}

// Version 2 → 3: add table
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

// Register with the Database
Room.databaseBuilder(context, AppDatabase::class.java, "app_database")
    .addMigrations(MIGRATION_1_2, MIGRATION_2_3)
    .build()

// Caution: destructive migration causes user data loss → strictly forbidden
// .fallbackToDestructiveMigration() → do not use in production
```

---

**Document version:** 1.0.0 | **Date:** 2026-06-13 | **Target OS:** Android 8.0 (API 26)+
