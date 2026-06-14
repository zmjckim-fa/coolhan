# Android 앱 API 표준 (API Standard)

## 1. Retrofit 클라이언트 표준 구성

```kotlin
// 모듈 (Hilt DI)
@Module @InstallIn(SingletonComponent::class)
object NetworkModule {

    @Provides @Singleton
    fun provideOkHttpClient(tokenManager: TokenManager): OkHttpClient =
        OkHttpClient.Builder()
            .addInterceptor(AuthInterceptor(tokenManager))
            .addInterceptor(HttpLoggingInterceptor().apply {
                level = if (BuildConfig.DEBUG) HttpLoggingInterceptor.Level.BODY
                        else HttpLoggingInterceptor.Level.NONE
            })
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(60, TimeUnit.SECONDS)
            .retryOnConnectionFailure(true)
            .build()

    @Provides @Singleton
    fun provideRetrofit(okHttpClient: OkHttpClient): Retrofit =
        Retrofit.Builder()
            .baseUrl(BuildConfig.API_BASE_URL)
            .client(okHttpClient)
            .addConverterFactory(
                GsonConverterFactory.create(
                    GsonBuilder().setDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'").create()
                )
            )
            .build()

    @Provides @Singleton
    fun provideApiService(retrofit: Retrofit): ApiService =
        retrofit.create(ApiService::class.java)
}
```

---

## 2. API 인터페이스 정의

```kotlin
interface ApiService {
    // 인증
    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): Response<ApiResponse<TokenResponse>>

    @POST("auth/refresh")
    suspend fun refreshToken(@Body request: RefreshRequest): Response<ApiResponse<TokenResponse>>

    @POST("auth/logout")
    suspend fun logout(@Header("Authorization") token: String): Response<Unit>

    // 상품
    @GET("products")
    suspend fun getProducts(
        @Query("page") page: Int,
        @Query("per_page") perPage: Int = 20,
        @Query("category") category: String? = null
    ): Response<ApiResponse<List<Product>>>

    @GET("products/{id}")
    suspend fun getProduct(@Path("id") id: String): Response<ApiResponse<Product>>

    // 주문
    @POST("orders")
    suspend fun createOrder(@Body request: CreateOrderRequest): Response<ApiResponse<Order>>

    @GET("orders")
    suspend fun getMyOrders(
        @Query("page") page: Int = 1,
        @Query("per_page") perPage: Int = 20
    ): Response<ApiResponse<List<Order>>>

    // 파일 업로드
    @Multipart
    @POST("upload/image")
    suspend fun uploadImage(
        @Part image: MultipartBody.Part,
        @Part("type") type: RequestBody
    ): Response<ApiResponse<ImageResponse>>
}
```

---

## 3. 표준 응답 모델

```kotlin
// 공통 응답 래퍼
data class ApiResponse<T>(
    val success: Boolean,
    val data: T?,
    @SerializedName("error") val error: ApiError?,
    val meta: PaginationMeta?
)

data class ApiError(
    val code: String,
    val message: String,
    val field: String?
)

data class PaginationMeta(
    val total: Int,
    val page: Int,
    @SerializedName("per_page") val perPage: Int
)

// 결과 래퍼 (Repository 계층)
sealed class Result<out T> {
    data class Success<T>(val data: T) : Result<T>()
    data class Error(val exception: AppException) : Result<Nothing>()
    object Loading : Result<Nothing>()
}

// 에러 타입
sealed class AppException(message: String) : Exception(message) {
    object Unauthorized : AppException("인증이 필요합니다")
    object Forbidden : AppException("권한이 없습니다")
    object NotFound : AppException("데이터를 찾을 수 없습니다")
    data class Validation(val msg: String, val field: String?) : AppException(msg)
    object RateLimited : AppException("잠시 후 다시 시도해 주세요")
    data class Server(val code: Int) : AppException("서버 오류 ($code)")
    object NetworkUnavailable : AppException("인터넷 연결을 확인해 주세요")
    data class Unknown(val msg: String) : AppException(msg)
}
```

---

## 4. Repository 패턴 (표준)

```kotlin
// 인터페이스
interface ProductRepository {
    suspend fun getProducts(page: Int, category: String?): Result<List<Product>>
    fun observeProducts(): Flow<List<Product>>
}

// 구현 (Network + Cache)
class ProductRepositoryImpl @Inject constructor(
    private val apiService: ApiService,
    private val productDao: ProductDao,
    private val networkChecker: NetworkChecker
) : ProductRepository {

    override suspend fun getProducts(page: Int, category: String?): Result<List<Product>> =
        withContext(Dispatchers.IO) {
            try {
                if (!networkChecker.isAvailable()) {
                    return@withContext Result.Error(AppException.NetworkUnavailable)
                }
                val response = apiService.getProducts(page = page, category = category)
                if (response.isSuccessful && response.body()?.success == true) {
                    val products = response.body()!!.data!!
                    productDao.upsertAll(products.map { it.toEntity() })
                    Result.Success(products)
                } else {
                    Result.Error(parseHttpError(response))
                }
            } catch (e: IOException) {
                Result.Error(AppException.NetworkUnavailable)
            } catch (e: Exception) {
                Result.Error(AppException.Unknown(e.message ?: "Unknown error"))
            }
        }

    override fun observeProducts(): Flow<List<Product>> =
        productDao.getAvailableProductsFlow().map { entities -> entities.map { it.toDomain() } }
}

// HTTP 에러 파싱
fun <T> parseHttpError(response: Response<ApiResponse<T>>): AppException {
    val apiError = try {
        Gson().fromJson(response.errorBody()?.string(), ApiError::class.java)
    } catch (e: Exception) { null }

    return when (response.code()) {
        401 -> AppException.Unauthorized
        403 -> AppException.Forbidden
        404 -> AppException.NotFound
        422 -> AppException.Validation(apiError?.message ?: "Validation failed", apiError?.field)
        429 -> AppException.RateLimited
        in 500..599 -> AppException.Server(response.code())
        else -> AppException.Unknown("HTTP ${response.code()}")
    }
}
```

---

## 5. 인증 인터셉터 & 토큰 갱신

```kotlin
class AuthInterceptor @Inject constructor(
    private val tokenManager: TokenManager
) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val token = runBlocking { tokenManager.getValidToken() }
        val request = if (token != null) {
            chain.request().newBuilder()
                .header("Authorization", "Bearer $token")
                .build()
        } else chain.request()

        val response = chain.proceed(request)

        // 401: 토큰 갱신 시도
        if (response.code == 401 && token != null) {
            response.close()
            val newToken = runBlocking { tokenManager.refreshToken() }
            return if (newToken != null) {
                chain.proceed(chain.request().newBuilder()
                    .header("Authorization", "Bearer $newToken").build())
            } else {
                // 갱신 실패 → 로그인 화면 이벤트
                runBlocking { tokenManager.onAuthExpired() }
                response
            }
        }
        return response
    }
}

// TokenManager (EncryptedSharedPreferences 기반)
class TokenManager @Inject constructor(
    @ApplicationContext private val context: Context
) {
    private val prefs = SecurePrefs.get(context)
    private val mutex = Mutex()

    suspend fun getValidToken(): String? = prefs.getString(SecureKey.AUTH_TOKEN, null)

    suspend fun refreshToken(): String? = mutex.withLock {
        val refreshToken = prefs.getString(SecureKey.REFRESH_TOKEN, null) ?: return null
        try {
            val response = Retrofit.create(ApiService::class.java)
                .refreshToken(RefreshRequest(refreshToken))
            if (response.isSuccessful) {
                val tokens = response.body()!!.data!!
                prefs.edit()
                    .putString(SecureKey.AUTH_TOKEN, tokens.accessToken)
                    .putString(SecureKey.REFRESH_TOKEN, tokens.refreshToken)
                    .apply()
                tokens.accessToken
            } else null
        } catch (e: Exception) { null }
    }

    suspend fun onAuthExpired() {
        prefs.edit().clear().apply()
        // EventBus 또는 SharedFlow로 로그인 화면 이동 신호
    }
}
```

---

## 6. 날짜/시간 형식

```kotlin
// 표준: ISO 8601 UTC (서버 ↔ 앱)
// 전송: "2026-06-13T10:30:00Z"
// 저장: Unix timestamp (Long, ms)
// 표시: 로컬 시간대 변환

object DateUtils {
    private val isoFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US).apply {
        timeZone = TimeZone.getTimeZone("UTC")
    }

    fun parseIso(iso: String): Long? = try { isoFormat.parse(iso)?.time } catch (e: Exception) { null }
    fun toIso(timestamp: Long): String = isoFormat.format(Date(timestamp))

    fun formatDisplay(timestamp: Long, locale: Locale = Locale.getDefault()): String {
        val df = DateFormat.getDateInstance(DateFormat.SHORT, locale)
        return df.format(Date(timestamp))
    }
}
```

---

## 7. 파일 업로드 표준

```kotlin
// 이미지 업로드
suspend fun uploadImage(uri: Uri, context: Context): Result<ImageResponse> {
    val compressed = compressImage(uri, context) ?: return Result.Error(AppException.Unknown("이미지 처리 실패"))
    val requestBody = compressed.toRequestBody("image/jpeg".toMediaType())
    val part = MultipartBody.Part.createFormData("file", "image.jpg", requestBody)
    val typeBody = "profile".toRequestBody("text/plain".toMediaType())

    return withContext(Dispatchers.IO) {
        try {
            val response = apiService.uploadImage(part, typeBody)
            if (response.isSuccessful && response.body()?.success == true) {
                Result.Success(response.body()!!.data!!)
            } else {
                Result.Error(parseHttpError(response))
            }
        } catch (e: Exception) {
            Result.Error(AppException.Unknown(e.message ?: "Upload failed"))
        }
    }
}

// 이미지 압축 (업로드 전 필수)
fun compressImage(uri: Uri, context: Context): ByteArray? {
    val bitmap = if (Build.VERSION.SDK_INT >= 28) {
        val source = ImageDecoder.createSource(context.contentResolver, uri)
        ImageDecoder.decodeBitmap(source)
    } else {
        @Suppress("DEPRECATION")
        MediaStore.Images.Media.getBitmap(context.contentResolver, uri)
    }
    val maxDimension = 1080
    val scale = minOf(maxDimension.toFloat() / bitmap.width, maxDimension.toFloat() / bitmap.height, 1f)
    val scaled = if (scale < 1f) {
        Bitmap.createScaledBitmap(bitmap, (bitmap.width * scale).toInt(), (bitmap.height * scale).toInt(), true)
    } else bitmap

    return ByteArrayOutputStream().also { out ->
        scaled.compress(Bitmap.CompressFormat.JPEG, 80, out)
    }.toByteArray()
}
```

---

**문서 버전:** 1.0.0 | **작성일:** 2026-06-13 | **대상 OS:** Android 8.0(API 26)+
