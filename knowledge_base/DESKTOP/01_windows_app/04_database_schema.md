# Windows 데스크탑 앱 데이터 모델 (Database Schema)

## EF Core + SQLite 구조

```
EF Core 스택:
DbContext → AppDbContext (DbContext 상속)
  ├─ DbSet<T> → 엔티티(테이블) 선언
  ├─ OnModelCreating() → Fluent API 설정
  └─ Migrations/ → 스키마 버전 관리

싱글톤 팩토리 패턴:
public class AppDbContextFactory : IDbContextFactory<AppDbContext>
{
    private readonly string _connectionString;
    public AppDbContextFactory(string connectionString)
        => _connectionString = connectionString;
    public AppDbContext CreateDbContext()
        => new AppDbContext(new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite(_connectionString).Options);
}
// DI 등록: services.AddDbContextFactory<AppDbContext>(opt =>
//     opt.UseSqlite($"Data Source={dbPath}"));
```

---

## 표준 엔티티 정의

### User (사용자)

```csharp
public class User
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Email { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public List<Order> Orders { get; set; } = new();
}

// Fluent API 설정
modelBuilder.Entity<User>(entity =>
{
    entity.HasKey(u => u.Id);
    entity.HasIndex(u => u.Email).IsUnique();
    entity.Property(u => u.Email).IsRequired().HasMaxLength(255);
    entity.Property(u => u.DisplayName).IsRequired().HasMaxLength(100);
});
```

### Product (상품)

```csharp
public class Product
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal Price { get; set; }
    public string Currency { get; set; } = "KRW";
    public string Category { get; set; } = string.Empty;
    public string? ThumbnailUrl { get; set; }
    public bool IsAvailable { get; set; } = true;
    public int StockCount { get; set; } = 0;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public List<OrderItem> OrderItems { get; set; } = new();
}

modelBuilder.Entity<Product>(entity =>
{
    entity.HasKey(p => p.Id);
    entity.HasIndex(p => p.Category);
    entity.HasIndex(p => p.IsAvailable);
    entity.Property(p => p.Price).HasColumnType("decimal(18,2)");
});
```

### Order (주문)

```csharp
public class Order
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string? UserId { get; set; }
    public OrderStatus Status { get; set; } = OrderStatus.Pending;
    public decimal TotalAmount { get; set; }
    public string Currency { get; set; } = "KRW";
    public DateTime OrderedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public User? User { get; set; }
    public List<OrderItem> Items { get; set; } = new();
}

public class OrderItem
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string OrderId { get; set; } = string.Empty;
    public string ProductTitle { get; set; } = string.Empty;  // 주문 시점 스냅샷
    public decimal UnitPrice { get; set; }
    public int Quantity { get; set; }
    public decimal Subtotal { get; set; }

    public Order Order { get; set; } = null!;
}

public enum OrderStatus
{
    Pending, Paid, Shipping, Delivered, Cancelled
}

modelBuilder.Entity<Order>(entity =>
{
    entity.HasKey(o => o.Id);
    entity.HasIndex(o => o.UserId);
    entity.HasIndex(o => o.Status);
    entity.Property(o => o.Status).HasConversion<string>();  // enum → 문자열 저장
    entity.HasOne(o => o.User)
          .WithMany(u => u.Orders)
          .HasForeignKey(o => o.UserId)
          .OnDelete(DeleteBehavior.SetNull);
});

modelBuilder.Entity<OrderItem>(entity =>
{
    entity.HasKey(oi => oi.Id);
    entity.HasIndex(oi => oi.OrderId);
    entity.HasOne(oi => oi.Order)
          .WithMany(o => o.Items)
          .HasForeignKey(oi => oi.OrderId)
          .OnDelete(DeleteBehavior.Cascade);
    entity.Property(oi => oi.UnitPrice).HasColumnType("decimal(18,2)");
    entity.Property(oi => oi.Subtotal).HasColumnType("decimal(18,2)");
});
```

### CachedResponse (API 응답 캐시)

```csharp
public class CachedResponse
{
    public string CacheKey { get; set; } = string.Empty;   // URL + 파라미터 해시
    public string Data { get; set; } = string.Empty;       // JSON 문자열
    public string? Etag { get; set; }
    public DateTime ExpiresAt { get; set; }
    public DateTime CachedAt { get; set; } = DateTime.UtcNow;
}

modelBuilder.Entity<CachedResponse>(entity =>
{
    entity.HasKey(c => c.CacheKey);
    entity.HasIndex(c => c.ExpiresAt);
});
```

---

## Repository 패턴 (표준)

```csharp
// 인터페이스
public interface IProductRepository
{
    Task<Product?> FindByIdAsync(string id, CancellationToken ct = default);
    Task<List<Product>> GetAvailableAsync(int page, int pageSize, string? category = null, CancellationToken ct = default);
    Task<int> CountLowStockAsync(int threshold = 5, CancellationToken ct = default);
    Task UpsertAsync(Product product, CancellationToken ct = default);
    Task DeleteAsync(string id, CancellationToken ct = default);
}

// 구현
public class ProductRepository : IProductRepository
{
    private readonly IDbContextFactory<AppDbContext> _factory;

    public ProductRepository(IDbContextFactory<AppDbContext> factory)
        => _factory = factory;

    public async Task<List<Product>> GetAvailableAsync(
        int page, int pageSize, string? category = null, CancellationToken ct = default)
    {
        await using var ctx = await _factory.CreateDbContextAsync(ct);
        var query = ctx.Products.Where(p => p.IsAvailable);
        if (category != null) query = query.Where(p => p.Category == category);
        return await query
            .OrderByDescending(p => p.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .AsNoTracking()
            .ToListAsync(ct);
    }

    public async Task UpsertAsync(Product product, CancellationToken ct = default)
    {
        await using var ctx = await _factory.CreateDbContextAsync(ct);
        product.UpdatedAt = DateTime.UtcNow;
        var existing = await ctx.Products.FindAsync(new object[] { product.Id }, ct);
        if (existing is null) ctx.Products.Add(product);
        else ctx.Entry(existing).CurrentValues.SetValues(product);
        await ctx.SaveChangesAsync(ct);
    }
}
```

---

## Windows Credential Manager (보안 자격증명)

```csharp
using System.Runtime.InteropServices;

// Windows Credential Manager를 통한 토큰 저장
public static class CredentialManager
{
    private const string APP_PREFIX = "MyApp_";

    public static bool SaveCredential(string key, string secret)
    {
        var credentialName = APP_PREFIX + key;
        var data = System.Text.Encoding.UTF8.GetBytes(secret);

        var credential = new CREDENTIAL
        {
            Type = 1,                    // CRED_TYPE_GENERIC
            TargetName = credentialName,
            CredentialBlobSize = (uint)data.Length,
            CredentialBlob = Marshal.AllocCoTaskMem(data.Length),
            Persist = 2,                 // CRED_PERSIST_LOCAL_MACHINE
            UserName = Environment.UserName
        };
        Marshal.Copy(data, 0, credential.CredentialBlob, data.Length);

        try { return CredWrite(ref credential, 0); }
        finally { Marshal.FreeCoTaskMem(credential.CredentialBlob); }
    }

    public static string? ReadCredential(string key)
    {
        if (!CredRead(APP_PREFIX + key, 1, 0, out var ptr)) return null;
        try
        {
            var cred = Marshal.PtrToStructure<CREDENTIAL>(ptr);
            var data = new byte[cred.CredentialBlobSize];
            Marshal.Copy(cred.CredentialBlob, data, 0, data.Length);
            return System.Text.Encoding.UTF8.GetString(data);
        }
        finally { CredFree(ptr); }
    }

    public static bool DeleteCredential(string key) => CredDelete(APP_PREFIX + key, 1, 0);

    [DllImport("advapi32.dll", EntryPoint = "CredWriteW", CharSet = CharSet.Unicode, SetLastError = true)]
    private static extern bool CredWrite([In] ref CREDENTIAL credential, [In] uint flags);

    [DllImport("advapi32.dll", EntryPoint = "CredReadW", CharSet = CharSet.Unicode, SetLastError = true)]
    private static extern bool CredRead(string target, uint type, uint reservedFlag, out IntPtr credentialPtr);

    [DllImport("advapi32.dll", EntryPoint = "CredDeleteW", CharSet = CharSet.Unicode, SetLastError = true)]
    private static extern bool CredDelete(string target, uint type, int flags);

    [DllImport("advapi32.dll", SetLastError = true)]
    private static extern void CredFree([In] IntPtr buffer);

    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    private struct CREDENTIAL
    {
        public uint Flags;
        public uint Type;
        public string TargetName;
        public string? Comment;
        public System.Runtime.InteropServices.ComTypes.FILETIME LastWritten;
        public uint CredentialBlobSize;
        public IntPtr CredentialBlob;
        public uint Persist;
        public uint AttributeCount;
        public IntPtr Attributes;
        public string? TargetAlias;
        public string UserName;
    }
}

// 사용 예
CredentialManager.SaveCredential("auth_token", accessToken);
var token = CredentialManager.ReadCredential("auth_token");
CredentialManager.DeleteCredential("auth_token"); // 로그아웃 시
```

---

## 앱 설정 저장 (JSON)

```csharp
// AppSettings 모델
public class AppSettings
{
    public string ThemeMode { get; set; } = "System";      // Light / Dark / System
    public string Language { get; set; } = "ko-KR";
    public bool NotificationsEnabled { get; set; } = true;
    public string LastUsedDirectory { get; set; } = string.Empty;
    public DateTime? LastSyncTime { get; set; }
}

// 설정 관리자
public class SettingsManager
{
    private readonly string _settingsPath;
    private AppSettings _settings;

    public SettingsManager()
    {
        var appData = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
        var dir = Path.Combine(appData, "CompanyName", "AppName");
        Directory.CreateDirectory(dir);
        _settingsPath = Path.Combine(dir, "settings.json");
        _settings = Load();
    }

    public AppSettings Current => _settings;

    private AppSettings Load()
    {
        try {
            if (File.Exists(_settingsPath)) {
                var json = File.ReadAllText(_settingsPath);
                return System.Text.Json.JsonSerializer.Deserialize<AppSettings>(json)
                       ?? new AppSettings();
            }
        } catch { /* 손상된 설정 파일 → 기본값 사용 */ }
        return new AppSettings();
    }

    public void Save()
    {
        var json = System.Text.Json.JsonSerializer.Serialize(_settings,
            new System.Text.Json.JsonSerializerOptions { WriteIndented = true });
        File.WriteAllText(_settingsPath, json);
    }
}
```

---

## 마이그레이션 전략

```csharp
// EF Core 마이그레이션 관리
// dotnet ef migrations add InitialCreate --project YourProject
// dotnet ef database update

// 앱 시작 시 자동 마이그레이션 (데스크탑 앱 권장 — 사용자가 서버 없음)
public static class DatabaseInitializer
{
    public static async Task InitializeAsync(IDbContextFactory<AppDbContext> factory)
    {
        await using var ctx = await factory.CreateDbContextAsync();
        // 마이그레이션 자동 적용 (미적용 마이그레이션 존재 시 실행)
        await ctx.Database.MigrateAsync();
    }
}

// App.xaml.cs OnLaunched 에서 호출
await DatabaseInitializer.InitializeAsync(dbContextFactory);

// 마이그레이션 예시 (버전 1→2: phone_number 컬럼 추가)
// Migration 파일 내 Up() 메서드:
migrationBuilder.AddColumn<string>(
    name: "PhoneNumber",
    table: "Users",
    type: "TEXT",
    nullable: true);

// 파괴적 마이그레이션 (데이터 손실) 절대 금지
// context.Database.EnsureDeleted() → 프로덕션 사용 금지
```

---

**문서 버전:** 1.0.0 | **작성일:** 2026-06-13 | **대상 스택:** C# + EF Core + SQLite + .NET 8
