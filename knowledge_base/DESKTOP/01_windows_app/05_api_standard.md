# Windows 데스크탑 앱 API 표준 (API Standard)

## 1. HttpClient 표준 구성

```csharp
// DI 등록 (Program.cs / App.xaml.cs)
services.AddHttpClient<ApiClient>(client =>
{
    client.BaseAddress = new Uri(AppConfig.ApiBaseUrl);
    client.Timeout = TimeSpan.FromSeconds(30);
    client.DefaultRequestHeaders.Add("Accept", "application/json");
    client.DefaultRequestHeaders.Add("User-Agent", $"MyApp/{AppVersion.Current}");
})
.AddHttpMessageHandler<AuthHandler>()
.AddHttpMessageHandler<RetryHandler>();

// 단일 인스턴스 (IHttpClientFactory 사용 권장 — 소켓 고갈 방지)
// HttpClient를 직접 new하지 않는다
```

---

## 2. API 클라이언트 구현

```csharp
public class ApiClient
{
    private readonly HttpClient _http;
    private readonly TokenStore _tokens;

    public ApiClient(HttpClient http, TokenStore tokens)
    {
        _http = http;
        _tokens = tokens;
    }

    // 제네릭 요청 메서드
    public async Task<Result<T>> GetAsync<T>(string path, CancellationToken ct = default)
        => await SendAsync<T>(HttpMethod.Get, path, body: null, ct);

    public async Task<Result<T>> PostAsync<T>(string path, object body, CancellationToken ct = default)
        => await SendAsync<T>(HttpMethod.Post, path, body, ct);

    public async Task<Result<T>> PutAsync<T>(string path, object body, CancellationToken ct = default)
        => await SendAsync<T>(HttpMethod.Put, path, body, ct);

    public async Task<Result<Unit>> DeleteAsync(string path, CancellationToken ct = default)
    {
        var result = await SendAsync<JsonElement>(HttpMethod.Delete, path, body: null, ct);
        return result.IsSuccess ? Result.Ok(Unit.Value) : Result.Fail<Unit>(result.Error!);
    }

    private async Task<Result<T>> SendAsync<T>(
        HttpMethod method, string path, object? body, CancellationToken ct)
    {
        try
        {
            using var request = new HttpRequestMessage(method, path);
            if (body is not null)
                request.Content = JsonContent.Create(body);

            using var response = await _http.SendAsync(request, ct);
            var json = await response.Content.ReadAsStringAsync(ct);

            if (response.IsSuccessStatusCode)
            {
                var wrapper = JsonSerializer.Deserialize<ApiResponse<T>>(json, JsonOptions);
                return wrapper?.Success == true && wrapper.Data is not null
                    ? Result.Ok(wrapper.Data)
                    : Result.Fail<T>(new AppException.Server((int)response.StatusCode));
            }

            return Result.Fail<T>(ParseError(response.StatusCode, json));
        }
        catch (TaskCanceledException) when (ct.IsCancellationRequested)
            { return Result.Fail<T>(new AppException.Cancelled()); }
        catch (TaskCanceledException)
            { return Result.Fail<T>(new AppException.Timeout()); }
        catch (HttpRequestException)
            { return Result.Fail<T>(new AppException.NetworkUnavailable()); }
        catch (Exception ex)
            { return Result.Fail<T>(new AppException.Unknown(ex.Message)); }
    }

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower
    };

    private static AppException ParseError(System.Net.HttpStatusCode code, string json)
    {
        ApiError? apiError = null;
        try { apiError = JsonSerializer.Deserialize<ApiErrorWrapper>(json, JsonOptions)?.Error; }
        catch { /* JSON 파싱 실패 → 코드 기반 예외 */ }

        return (int)code switch
        {
            401 => new AppException.Unauthorized(),
            403 => new AppException.Forbidden(),
            404 => new AppException.NotFound(),
            422 => new AppException.Validation(apiError?.Message ?? "유효성 오류", apiError?.Field),
            429 => new AppException.RateLimited(),
            >= 500 => new AppException.Server((int)code),
            _ => new AppException.Unknown($"HTTP {(int)code}")
        };
    }
}
```

---

## 3. 표준 응답 모델

```csharp
// 성공 응답 래퍼
public record ApiResponse<T>(
    bool Success,
    T? Data,
    ApiError? Error,
    PaginationMeta? Meta
);

public record ApiError(string Code, string Message, string? Field);
public record ApiErrorWrapper(ApiError Error);
public record PaginationMeta(int Total, int Page, int PerPage);

// 결과 타입 (Railway Pattern)
public abstract record Result<T>
{
    public abstract bool IsSuccess { get; }
    public abstract AppException? Error { get; }

    public static Result<T> Ok(T value) => new OkResult<T>(value);
    public static Result<T> Fail(AppException ex) => new FailResult<T>(ex);

    public TOut Match<TOut>(Func<T, TOut> onSuccess, Func<AppException, TOut> onFailure)
        => IsSuccess ? onSuccess(((OkResult<T>)this).Value) : onFailure(Error!);
}

public sealed record OkResult<T>(T Value) : Result<T>
{
    public override bool IsSuccess => true;
    public override AppException? Error => null;
}

public sealed record FailResult<T>(AppException Exception) : Result<T>
{
    public override bool IsSuccess => false;
    public override AppException? Error => Exception;
}

public static class Result
{
    public static Result<T> Ok<T>(T value) => new OkResult<T>(value);
    public static Result<T> Fail<T>(AppException ex) => new FailResult<T>(ex);
}

public record struct Unit { public static readonly Unit Value = default; }

// 예외 계층
public abstract class AppException(string message) : Exception(message)
{
    public class Unauthorized() : AppException("인증이 필요합니다") { }
    public class Forbidden() : AppException("권한이 없습니다") { }
    public class NotFound() : AppException("데이터를 찾을 수 없습니다") { }
    public class Validation(string msg, string? field) : AppException(msg) { public string? Field => field; }
    public class RateLimited() : AppException("잠시 후 다시 시도해 주세요") { }
    public class Server(int code) : AppException($"서버 오류 ({code})") { }
    public class NetworkUnavailable() : AppException("인터넷 연결을 확인해 주세요") { }
    public class Timeout() : AppException("요청 시간이 초과되었습니다") { }
    public class Cancelled() : AppException("요청이 취소되었습니다") { }
    public class Unknown(string msg) : AppException(msg) { }
}
```

---

## 4. 인증 핸들러 & 토큰 갱신

```csharp
public class AuthHandler : DelegatingHandler
{
    private readonly TokenStore _tokens;

    public AuthHandler(TokenStore tokens) => _tokens = tokens;

    protected override async Task<HttpResponseMessage> SendAsync(
        HttpRequestMessage request, CancellationToken ct)
    {
        var token = _tokens.GetAccessToken();
        if (token is not null)
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await base.SendAsync(request, ct);

        if (response.StatusCode == System.Net.HttpStatusCode.Unauthorized && token is not null)
        {
            // 토큰 갱신 시도
            var newToken = await _tokens.RefreshAsync(ct);
            if (newToken is not null)
            {
                // 원본 요청 재시도
                using var retryRequest = CloneRequest(request);
                retryRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", newToken);
                return await base.SendAsync(retryRequest, ct);
            }
            // 갱신 실패 → 로그아웃 이벤트
            _tokens.OnAuthExpired();
        }

        return response;
    }

    private static HttpRequestMessage CloneRequest(HttpRequestMessage req)
    {
        var clone = new HttpRequestMessage(req.Method, req.RequestUri);
        foreach (var h in req.Headers) clone.Headers.TryAddWithoutValidation(h.Key, h.Value);
        return clone;
    }
}

// 지수 백오프 재시도 핸들러
public class RetryHandler : DelegatingHandler
{
    private const int MaxRetries = 3;

    protected override async Task<HttpResponseMessage> SendAsync(
        HttpRequestMessage request, CancellationToken ct)
    {
        for (int attempt = 0; attempt < MaxRetries; attempt++)
        {
            try
            {
                var response = await base.SendAsync(request, ct);
                if ((int)response.StatusCode < 500) return response;  // 성공 또는 4xx
                if (attempt == MaxRetries - 1) return response;
            }
            catch (HttpRequestException) when (attempt < MaxRetries - 1) { }

            await Task.Delay(TimeSpan.FromSeconds(Math.Pow(2, attempt)), ct);  // 1s, 2s, 4s
        }
        throw new HttpRequestException("최대 재시도 횟수 초과");
    }
}

// TokenStore (Windows Credential Manager 기반)
public class TokenStore
{
    private readonly SemaphoreSlim _lock = new(1, 1);
    public event EventHandler? AuthExpired;

    public string? GetAccessToken() => CredentialManager.ReadCredential("auth_token");

    public async Task<string?> RefreshAsync(CancellationToken ct = default)
    {
        await _lock.WaitAsync(ct);
        try
        {
            var refreshToken = CredentialManager.ReadCredential("refresh_token");
            if (refreshToken is null) return null;

            using var http = new HttpClient();
            var response = await http.PostAsJsonAsync(
                $"{AppConfig.ApiBaseUrl}/auth/refresh",
                new { refresh_token = refreshToken }, ct);

            if (!response.IsSuccessStatusCode) return null;

            var result = await response.Content.ReadFromJsonAsync<ApiResponse<TokenResponse>>(ct);
            if (result?.Data is null) return null;

            CredentialManager.SaveCredential("auth_token", result.Data.AccessToken);
            CredentialManager.SaveCredential("refresh_token", result.Data.RefreshToken);
            return result.Data.AccessToken;
        }
        finally { _lock.Release(); }
    }

    public void OnAuthExpired()
    {
        CredentialManager.DeleteCredential("auth_token");
        CredentialManager.DeleteCredential("refresh_token");
        AuthExpired?.Invoke(this, EventArgs.Empty);
    }
}

public record TokenResponse(string AccessToken, string RefreshToken);
```

---

## 5. 날짜/시간 형식

```csharp
// ISO 8601 UTC (서버 ↔ 앱)
// System.Text.Json의 기본 DateTime 직렬화: "2026-06-13T10:30:00Z"

// JsonSerializerOptions에 ISO 8601 설정 (기본값)
var options = new JsonSerializerOptions
{
    PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
    // DateTime은 기본적으로 ISO 8601 UTC 직렬화
};

// 표시용 로컬 시간 변환
public static class DateTimeExtensions
{
    public static string ToLocalDisplay(this DateTime utcTime)
    {
        var local = utcTime.Kind == DateTimeKind.Utc
            ? utcTime.ToLocalTime()
            : utcTime;
        return local.ToString("yyyy-MM-dd HH:mm", CultureInfo.CurrentCulture);
    }

    public static string ToRelativeDisplay(this DateTime utcTime)
    {
        var diff = DateTime.UtcNow - utcTime;
        return diff.TotalSeconds switch
        {
            < 60 => "방금 전",
            < 3600 => $"{(int)diff.TotalMinutes}분 전",
            < 86400 => $"{(int)diff.TotalHours}시간 전",
            _ => utcTime.ToLocalTime().ToString("M월 d일", CultureInfo.GetCultureInfo("ko-KR"))
        };
    }
}
```

---

## 6. 파일 업로드 표준

```csharp
public async Task<Result<ImageResponse>> UploadImageAsync(
    string filePath, CancellationToken ct = default)
{
    if (!File.Exists(filePath))
        return Result.Fail<ImageResponse>(new AppException.NotFound());

    // 이미지 압축
    var compressed = CompressImage(filePath);
    if (compressed is null)
        return Result.Fail<ImageResponse>(new AppException.Unknown("이미지 처리 실패"));

    using var content = new MultipartFormDataContent();
    using var imageContent = new ByteArrayContent(compressed);
    imageContent.Headers.ContentType = new MediaTypeHeaderValue("image/jpeg");
    content.Add(imageContent, "file", Path.GetFileName(filePath));
    content.Add(new StringContent("profile"), "type");

    using var request = new HttpRequestMessage(HttpMethod.Post, "upload/image") { Content = content };
    // AuthHandler가 자동으로 Authorization 헤더 추가
    using var response = await _http.SendAsync(request, ct);
    var json = await response.Content.ReadAsStringAsync(ct);
    // ... Result 처리
}

private static byte[]? CompressImage(string filePath)
{
    try
    {
        using var original = System.Drawing.Image.FromFile(filePath);
        const int maxDimension = 1080;
        var scale = Math.Min(
            (double)maxDimension / original.Width,
            (double)maxDimension / original.Height);
        scale = Math.Min(scale, 1.0);

        int newWidth = (int)(original.Width * scale);
        int newHeight = (int)(original.Height * scale);

        using var resized = new System.Drawing.Bitmap(original, newWidth, newHeight);
        using var ms = new MemoryStream();
        var encoder = GetJpegEncoder();
        var encoderParams = new System.Drawing.Imaging.EncoderParameters(1);
        encoderParams.Param[0] = new System.Drawing.Imaging.EncoderParameter(
            System.Drawing.Imaging.Encoder.Quality, 80L);
        resized.Save(ms, encoder, encoderParams);
        return ms.ToArray();
    }
    catch { return null; }
}

private static System.Drawing.Imaging.ImageCodecInfo GetJpegEncoder()
    => System.Drawing.Imaging.ImageCodecInfo
        .GetImageEncoders()
        .First(e => e.FormatID == System.Drawing.Imaging.ImageFormat.Jpeg.Guid);
```

---

## 7. 오프라인 모드 & 캐싱

```csharp
public class CachedApiService
{
    private readonly ApiClient _api;
    private readonly ICachedResponseRepository _cache;

    public async Task<Result<T>> GetWithCacheAsync<T>(
        string path, TimeSpan ttl, CancellationToken ct = default)
    {
        var cacheKey = ComputeHash(path);

        // 1. 유효한 캐시 조회
        var cached = await _cache.GetValidAsync(cacheKey);
        if (cached is not null)
        {
            try {
                var data = JsonSerializer.Deserialize<T>(cached.Data, JsonOptions);
                if (data is not null) return Result.Ok(data);
            } catch { /* 손상된 캐시 → API 재시도 */ }
        }

        // 2. 네트워크 요청
        var result = await _api.GetAsync<T>(path, ct);
        if (result.IsSuccess)
        {
            // 3. 캐시 저장
            var json = JsonSerializer.Serialize(((OkResult<T>)result).Value, JsonOptions);
            await _cache.UpsertAsync(new CachedResponse
            {
                CacheKey = cacheKey,
                Data = json,
                ExpiresAt = DateTime.UtcNow + ttl,
                CachedAt = DateTime.UtcNow
            });
        }
        else if (cached is not null)
        {
            // 4. 네트워크 오류 시 만료 캐시로 폴백 (offline 모드)
            var data = JsonSerializer.Deserialize<T>(cached.Data, JsonOptions);
            if (data is not null) return Result.Ok(data);
        }

        return result;
    }

    private static string ComputeHash(string input)
    {
        var bytes = System.Security.Cryptography.SHA256.HashData(
            System.Text.Encoding.UTF8.GetBytes(input));
        return Convert.ToHexString(bytes);
    }
}
```

---

**문서 버전:** 1.0.0 | **작성일:** 2026-06-13 | **대상 스택:** C# + .NET 8 + HttpClient + System.Text.Json
