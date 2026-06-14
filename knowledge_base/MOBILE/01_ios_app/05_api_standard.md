# iOS 앱 API 표준 (API Standard)

## 1. REST API 호출 표준

### 기본 아키텍처
```swift
// 프로토콜 기반 APIClient (테스트 가능)
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

### 표준 요청 구조
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

## 2. 표준 응답 형식

### 성공 응답
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

### 오류 응답
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "이메일 형식이 올바르지 않습니다",
    "field": "email"
  }
}
```

### iOS 디코딩 모델
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

## 3. 날짜/시간 형식

```swift
// 표준: ISO 8601 UTC
// 서버: "2026-06-13T10:30:00Z"
// 표시: 로컬 시간대로 변환

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

// 표시용 포맷터 (재사용 가능)
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

## 4. 인증 & 토큰 갱신

```swift
// 토큰 자동 갱신 (401 수신 시)
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
        guard !isRefreshing else { /* 대기 */ fatalError() }
        isRefreshing = true
        defer { isRefreshing = false }

        guard let refresh = refreshToken else { throw APIError.unauthorized }
        // POST /auth/refresh { refresh_token: refresh }
        let response: TokenResponse = try await APIClient.shared.request(
            Endpoint(path: "/auth/refresh", method: .POST, body: RefreshRequest(token: refresh), requiresAuth: false)
        )
        accessToken = response.accessToken
        self.refreshToken = response.refreshToken
        // Keychain 업데이트
        return response.accessToken
    }
}
```

---

## 5. 오프라인 & 캐싱 전략

```swift
// 캐시 우선, 네트워크 갱신 (Cache-then-Network)
func fetchProducts() -> AsyncStream<[Product]> {
    AsyncStream { continuation in
        Task {
            // 1단계: 캐시에서 즉시 방출
            if let cached = await cache.fetch([Product].self, key: "products") {
                continuation.yield(cached)
            }
            // 2단계: 네트워크 갱신
            do {
                let fresh: [Product] = try await apiClient.request(
                    Endpoint(path: "/products", method: .GET, requiresAuth: false)
                )
                await cache.store(fresh, key: "products", ttl: 300) // 5분
                continuation.yield(fresh)
            } catch {
                // 캐시 데이터가 있으면 오류 숨김
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

## 6. 파일 업로드 (Multipart)

```swift
// 이미지 업로드 표준
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

// 업로드 전 전처리 (필수)
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

## 7. 에러 타입 표준

```swift
enum APIError: LocalizedError {
    case invalidResponse
    case unauthorized           // 401 → 로그인 화면으로
    case forbidden              // 403 → 권한 없음 알림
    case notFound               // 404 → 데이터 없음 처리
    case validationError(String)// 422 → 필드 오류 표시
    case rateLimited            // 429 → "잠시 후 다시 시도" 알림
    case serverError(Int)       // 5xx → "서버 오류" 알림
    case httpError(Int)         // 기타 HTTP 오류
    case networkUnavailable     // 인터넷 연결 없음
    case decodingError(Error)   // JSON 파싱 실패 (로깅)

    var errorDescription: String? {
        switch self {
        case .unauthorized: return "로그인이 필요합니다"
        case .networkUnavailable: return "인터넷 연결을 확인해 주세요"
        case .serverError: return "일시적인 서버 오류가 발생했습니다"
        case .validationError(let msg): return msg
        default: return "오류가 발생했습니다. 다시 시도해 주세요"
        }
    }
}
```

---

**문서 버전:** 1.0.0 | **작성일:** 2026-06-13 | **대상 OS:** iOS 15+
