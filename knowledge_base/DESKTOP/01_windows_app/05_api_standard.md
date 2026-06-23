# Windows Desktop App API Standard

## 1. Standard HttpClient Configuration

```csharp
// DI registration (Program.cs / App.xaml.cs)
services.AddHttpClient<ApiClient>(client =>
{
    client.BaseAddress = new Uri(AppConfig.ApiBaseUrl);
    client.Timeout = TimeSpan.FromSeconds(30);
    client.DefaultRequestHeaders.Add("Accept", "application/json");
    client.DefaultRequestHeaders.Add("User-Agent", $"MyApp/{AppVersion.Current}");
})
.AddHttpMessageHandler<AuthHandler>()
.AddHttpMessageHandler<RetryHandler>();

// Single instance (using IHttpClientFactory is recommended — prevents socket exhaustion)
// Do not new up HttpClient directly
```

---

## 2. API Client Implementation

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

    // Generic request methods
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
        catch { /* JSON parsing failed → code-based exception */ }

        return (int)code switch
        {
            401 => new AppException.Unauthorized(),
            403 => new AppException.Forbidden(),
            404 => new AppException.NotFound(),
            422 => new AppException.Validation(apiError?.Message ?? "Validation error", apiError?.Field),
            429 => new AppException.RateLimited(),
            >= 500 => new AppException.Server((int)code),
            _ => new AppException.Unknown($"HTTP {(int)code}")
        };
    }
}
```

---

## 3. Standard Response Model

```csharp
// Success response wrapper
public record ApiResponse<T>(
    bool Success,
    T? Data,
    ApiError? Error,
    PaginationMeta? Meta
);

public record ApiError(string Code, string Message, string? Field);
public record ApiErrorWrapper(ApiError Error);
public record PaginationMeta(int Total, int Page, int PerPage);

// Result type (Railway Pattern)
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

// Exception hierarchy
public abstract class AppException(string message) : Exception(message)
{
    public class Unauthorized() : AppException("Authentication is required") { }
    public class Forbidden() : AppException("You do not have permission") { }
    public class NotFound() : AppException("The data could not be found") { }
    public class Validation(string msg, string? field) : AppException(msg) { public string? Field => field; }
    public class RateLimited() : AppException("Please try again in a moment") { }
    public class Server(int code) : AppException($"Server error ({code})") { }
    public class NetworkUnavailable() : AppException("Please check your internet connection") { }
    public class Timeout() : AppException("The request timed out") { }
    public class Cancelled() : AppException("The request was canceled") { }
    public class Unknown(string msg) : AppException(msg) { }
}
```

---

## 4. Authentication Handler & Token Refresh

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
            // Attempt to refresh the token
            var newToken = await _tokens.RefreshAsync(ct);
            if (newToken is not null)
            {
                // Retry the original request
                using var retryRequest = CloneRequest(request);
                retryRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", newToken);
                return await base.SendAsync(retryRequest, ct);
            }
            // Refresh failed → logout event
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

// Exponential backoff retry handler
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
                if ((int)response.StatusCode < 500) return response;  // success or 4xx
                if (attempt == MaxRetries - 1) return response;
            }
            catch (HttpRequestException) when (attempt < MaxRetries - 1) { }

            await Task.Delay(TimeSpan.FromSeconds(Math.Pow(2, attempt)), ct);  // 1s, 2s, 4s
        }
        throw new HttpRequestException("Maximum retry count exceeded");
    }
}

// TokenStore (based on the Windows Credential Manager)
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

## 5. Date/Time Formatting

```csharp
// ISO 8601 UTC (server ↔ app)
// System.Text.Json's default DateTime serialization: "2026-06-13T10:30:00Z"

// ISO 8601 setting in JsonSerializerOptions (default)
var options = new JsonSerializerOptions
{
    PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
    // DateTime serializes as ISO 8601 UTC by default
};

// Convert to local time for display
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
            < 60 => "just now",
            < 3600 => $"{(int)diff.TotalMinutes} minutes ago",
            < 86400 => $"{(int)diff.TotalHours} hours ago",
            _ => utcTime.ToLocalTime().ToString("M월 d일", CultureInfo.GetCultureInfo("ko-KR"))
        };
    }
}
```

---

## 6. File Upload Standard

```csharp
public async Task<Result<ImageResponse>> UploadImageAsync(
    string filePath, CancellationToken ct = default)
{
    if (!File.Exists(filePath))
        return Result.Fail<ImageResponse>(new AppException.NotFound());

    // Compress the image
    var compressed = CompressImage(filePath);
    if (compressed is null)
        return Result.Fail<ImageResponse>(new AppException.Unknown("Image processing failed"));

    using var content = new MultipartFormDataContent();
    using var imageContent = new ByteArrayContent(compressed);
    imageContent.Headers.ContentType = new MediaTypeHeaderValue("image/jpeg");
    content.Add(imageContent, "file", Path.GetFileName(filePath));
    content.Add(new StringContent("profile"), "type");

    using var request = new HttpRequestMessage(HttpMethod.Post, "upload/image") { Content = content };
    // AuthHandler automatically adds the Authorization header
    using var response = await _http.SendAsync(request, ct);
    var json = await response.Content.ReadAsStringAsync(ct);
    // ... Result handling
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

## 7. Offline Mode & Caching

```csharp
public class CachedApiService
{
    private readonly ApiClient _api;
    private readonly ICachedResponseRepository _cache;

    public async Task<Result<T>> GetWithCacheAsync<T>(
        string path, TimeSpan ttl, CancellationToken ct = default)
    {
        var cacheKey = ComputeHash(path);

        // 1. Look up a valid cache entry
        var cached = await _cache.GetValidAsync(cacheKey);
        if (cached is not null)
        {
            try {
                var data = JsonSerializer.Deserialize<T>(cached.Data, JsonOptions);
                if (data is not null) return Result.Ok(data);
            } catch { /* corrupted cache → retry the API */ }
        }

        // 2. Network request
        var result = await _api.GetAsync<T>(path, ct);
        if (result.IsSuccess)
        {
            // 3. Store the cache
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
            // 4. On network error, fall back to the expired cache (offline mode)
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

**Document version:** 1.0.0 | **Date:** 2026-06-13 | **Target stack:** C# + .NET 8 + HttpClient + System.Text.Json
