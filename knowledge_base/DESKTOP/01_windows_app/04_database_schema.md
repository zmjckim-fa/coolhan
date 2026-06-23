# Windows Desktop App Data Model (Database Schema)

## EF Core + SQLite Structure

```
EF Core stack:
DbContext → AppDbContext (inherits DbContext)
  ├─ DbSet<T> → entity (table) declarations
  ├─ OnModelCreating() → Fluent API configuration
  └─ Migrations/ → schema version management

Singleton factory pattern:
public class AppDbContextFactory : IDbContextFactory<AppDbContext>
{
    private readonly string _connectionString;
    public AppDbContextFactory(string connectionString)
        => _connectionString = connectionString;
    public AppDbContext CreateDbContext()
        => new AppDbContext(new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite(_connectionString).Options);
}
// DI registration: services.AddDbContextFactory<AppDbContext>(opt =>
//     opt.UseSqlite($"Data Source={dbPath}"));
```

---

## Standard Entity Definitions

### User

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

// Fluent API configuration
modelBuilder.Entity<User>(entity =>
{
    entity.HasKey(u => u.Id);
    entity.HasIndex(u => u.Email).IsUnique();
    entity.Property(u => u.Email).IsRequired().HasMaxLength(255);
    entity.Property(u => u.DisplayName).IsRequired().HasMaxLength(100);
});
```

### Product

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

### Order

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
    public string ProductTitle { get; set; } = string.Empty;  // snapshot at order time
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
    entity.Property(o => o.Status).HasConversion<string>();  // store enum as string
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

### CachedResponse (API response cache)

```csharp
public class CachedResponse
{
    public string CacheKey { get; set; } = string.Empty;   // hash of URL + parameters
    public string Data { get; set; } = string.Empty;       // JSON string
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

## Repository Pattern (standard)

```csharp
// Interface
public interface IProductRepository
{
    Task<Product?> FindByIdAsync(string id, CancellationToken ct = default);
    Task<List<Product>> GetAvailableAsync(int page, int pageSize, string? category = null, CancellationToken ct = default);
    Task<int> CountLowStockAsync(int threshold = 5, CancellationToken ct = default);
    Task UpsertAsync(Product product, CancellationToken ct = default);
    Task DeleteAsync(string id, CancellationToken ct = default);
}

// Implementation
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

## Windows Credential Manager (secure credentials)

```csharp
using System.Runtime.InteropServices;

// Token storage via the Windows Credential Manager
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

// Usage example
CredentialManager.SaveCredential("auth_token", accessToken);
var token = CredentialManager.ReadCredential("auth_token");
CredentialManager.DeleteCredential("auth_token"); // on logout
```

---

## App Settings Storage (JSON)

```csharp
// AppSettings model
public class AppSettings
{
    public string ThemeMode { get; set; } = "System";      // Light / Dark / System
    public string Language { get; set; } = "ko-KR";
    public bool NotificationsEnabled { get; set; } = true;
    public string LastUsedDirectory { get; set; } = string.Empty;
    public DateTime? LastSyncTime { get; set; }
}

// Settings manager
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
        } catch { /* corrupted settings file → use defaults */ }
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

## Migration Strategy

```csharp
// EF Core migration management
// dotnet ef migrations add InitialCreate --project YourProject
// dotnet ef database update

// Automatic migration at app startup (recommended for desktop apps — the user has no server)
public static class DatabaseInitializer
{
    public static async Task InitializeAsync(IDbContextFactory<AppDbContext> factory)
    {
        await using var ctx = await factory.CreateDbContextAsync();
        // Apply migrations automatically (runs if there are pending migrations)
        await ctx.Database.MigrateAsync();
    }
}

// Called from OnLaunched in App.xaml.cs
await DatabaseInitializer.InitializeAsync(dbContextFactory);

// Migration example (version 1→2: add phone_number column)
// Inside the Up() method of the migration file:
migrationBuilder.AddColumn<string>(
    name: "PhoneNumber",
    table: "Users",
    type: "TEXT",
    nullable: true);

// Never perform destructive migrations (data loss)
// context.Database.EnsureDeleted() → forbidden in production
```

---

**Document version:** 1.0.0 | **Date:** 2026-06-13 | **Target stack:** C# + EF Core + SQLite + .NET 8
