# iOS App API Standard

## 1. REST API Call Standard

### Basic Architecture
```swift
// Protocol-based APIClient (testable)
protocol APIClientProtocol {
    func request<T: Decodable>(_ endpoint: Endpoint) async throws -> T
}

struct Endpoint {
    let path: String
    let method: HTTPMethod
    let queryItems: [URLQueryItem]?
    let body: Encodable?
    let requiresAuth: Bool
}

enum HTTPMethod: String {
    case GET, POST, PUT, PATCH, DELETE
}
```

### Standard Request Structure
```swift
struct APIClient: APIClientProtocol {
    let baseURL: URL
    let session: URLSession
    let tokenProvider: TokenProviding

    func request<T: Decodable>(_ endpoint: Endpoint) async throws -> T {
        var components = URLComponents(url: baseURL.appendingPathComponent(endpoint.path),
                                       resolvingAgainstBaseURL: true)!
        components.queryItems = endpoint.queryItems

        var urlRequest = URLRequest(url: components.url!)
        urlRequest.httpMethod = endpoint.method.rawValue
        urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")
        urlRequest.setValue("application/json", forHTTPHeaderField: "Accept")
        urlRequest.timeoutInterval = 30

        if endpoint.requiresAuth {
            let token = try await tokenProvider.validToken()
            urlRequest.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        if let body = endpoint.body {
            urlRequest.httpBody = try JSONEncoder().encode(body)
        }

        let (data, response) = try await session.data(for: urlRequest)
        try validate(response: response, data: data)
        return try JSONDecoder.standard.decode(T.self, from: data)
    }

    private func validate(response: URLResponse, data: Data) throws {
        guard let http = response as? HTTPURLResponse else { throw APIError.invalidResponse }
        switch http.statusCode {
        case 200...299: return
        case 401: throw APIError.unauthorized
        case 403: throw APIError.forbidden
        case 404: throw APIError.notFound
        case 422:
            let apiError = try? JSONDecoder.standard.decode(APIErrorResponse.self, from: data)
            throw APIError.validationError(apiError?.message ?? "Validation failed")
        case 429: throw APIError.rateLimited
        case 500...599: throw APIError.serverError(http.statusCode)
        default: throw APIError.httpError(http.statusCode)
        }
    }
}
```

---

## 2. Standard Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "total": 100,
    "page": 1,
    "per_page": 20
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The email format is invalid",
    "field": "email"
  }
}
```

### iOS Decoding Models
```swift
struct APIResponse<T: Decodable>: Decodable {
    let success: Bool
    let data: T?
    let error: APIErrorResponse?
    let meta: PaginationMeta?
}

struct PaginationMeta: Decodable {
    let total: Int
    let page: Int
    let perPage: Int
    enum CodingKeys: String, CodingKey {
        case total, page, perPage = "per_page"
    }
}

struct APIErrorResponse: Decodable {
    let code: String
    let message: String
    let field: String?
}
```

---

## 3. Date/Time Format

```swift
// Standard: ISO 8601 UTC
// Server: "2026-06-13T10:30:00Z"
// Display: convert to local time zone

extension JSONDecoder {
    static var standard: JSONDecoder {
        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        decoder.dateDecodingStrategy = .iso8601
        return decoder
    }
}

extension JSONEncoder {
    static var standard: JSONEncoder {
        let encoder = JSONEncoder()
        encoder.keyEncodingStrategy = .convertToSnakeCase
        encoder.dateEncodingStrategy = .iso8601
        return encoder
    }
}

// Display formatter (reusable)
extension DateFormatter {
    static let displayShort: DateFormatter = {
        let f = DateFormatter()
        f.dateStyle = .short
        f.timeStyle = .none
        f.locale = .current
        return f
    }()
}
```

---

## 4. Authentication & Token Refresh

```swift
// Automatic token refresh (on 401 received)
protocol TokenProviding {
    func validToken() async throws -> String
}

actor TokenManager: TokenProviding {
    private var accessToken: String?
    private var refreshToken: String?
    private var isRefreshing = false

    func validToken() async throws -> String {
        if let token = accessToken, !isExpired(token) { return token }
        return try await refreshAccessToken()
    }

    private func refreshAccessToken() async throws -> String {
        guard !isRefreshing else { /* wait */ fatalError() }
        isRefreshing = true
        defer { isRefreshing = false }

        guard let refresh = refreshToken else { throw APIError.unauthorized }
        // POST /auth/refresh { refresh_token: refresh }
        let response: TokenResponse = try await APIClient.shared.request(
            Endpoint(path: "/auth/refresh", method: .POST, body: RefreshRequest(token: refresh), requiresAuth: false)
        )
        accessToken = response.accessToken
        self.refreshToken = response.refreshToken
        // Update Keychain
        return response.accessToken
    }
}
```

---

## 5. Offline & Caching Strategy

```swift
// Cache-then-Network
func fetchProducts() -> AsyncStream<[Product]> {
    AsyncStream { continuation in
        Task {
            // Step 1: emit immediately from cache
            if let cached = await cache.fetch([Product].self, key: "products") {
                continuation.yield(cached)
            }
            // Step 2: refresh from network
            do {
                let fresh: [Product] = try await apiClient.request(
                    Endpoint(path: "/products", method: .GET, requiresAuth: false)
                )
                await cache.store(fresh, key: "products", ttl: 300) // 5 minutes
                continuation.yield(fresh)
            } catch {
                // Hide the error if cached data exists
                if cache.fetch([Product].self, key: "products") == nil {
                    continuation.finish(throwing: error)
                }
            }
            continuation.finish()
        }
    }
}
```

---

## 6. File Upload (Multipart)

```swift
// Standard image upload
func uploadImage(_ imageData: Data, to path: String) async throws -> ImageUploadResponse {
    let boundary = UUID().uuidString
    var request = URLRequest(url: baseURL.appendingPathComponent(path))
    request.httpMethod = "POST"
    request.setValue("multipart/form-data; boundary=\(boundary)",
                     forHTTPHeaderField: "Content-Type")

    var body = Data()
    body.append("--\(boundary)\r\n".data(using: .utf8)!)
    body.append("Content-Disposition: form-data; name=\"file\"; filename=\"image.jpg\"\r\n".data(using: .utf8)!)
    body.append("Content-Type: image/jpeg\r\n\r\n".data(using: .utf8)!)
    body.append(imageData)
    body.append("\r\n--\(boundary)--\r\n".data(using: .utf8)!)
    request.httpBody = body

    let (data, response) = try await session.data(for: request)
    try validate(response: response, data: data)
    return try JSONDecoder.standard.decode(ImageUploadResponse.self, from: data)
}

// Pre-upload processing (required)
func prepareImage(_ image: UIImage) -> Data? {
    let maxDimension: CGFloat = 1080
    let scale = min(maxDimension / image.size.width, maxDimension / image.size.height, 1.0)
    let newSize = CGSize(width: image.size.width * scale, height: image.size.height * scale)
    let renderer = UIGraphicsImageRenderer(size: newSize)
    let resized = renderer.image { _ in image.draw(in: CGRect(origin: .zero, size: newSize)) }
    return resized.jpegData(compressionQuality: 0.8)
}
```

---

## 7. Error Type Standard

```swift
enum APIError: LocalizedError {
    case invalidResponse
    case unauthorized           // 401 → go to login screen
    case forbidden              // 403 → "no permission" alert
    case notFound               // 404 → handle as no data
    case validationError(String)// 422 → display field errors
    case rateLimited            // 429 → "try again shortly" alert
    case serverError(Int)       // 5xx → "server error" alert
    case httpError(Int)         // other HTTP errors
    case networkUnavailable     // no internet connection
    case decodingError(Error)   // JSON parsing failure (logged)

    var errorDescription: String? {
        switch self {
        case .unauthorized: return "Login required"
        case .networkUnavailable: return "Please check your internet connection"
        case .serverError: return "A temporary server error occurred"
        case .validationError(let msg): return msg
        default: return "An error occurred. Please try again"
        }
    }
}
```

---

**Document version:** 1.0.0 | **Date:** 2026-06-13 | **Target OS:** iOS 15+
