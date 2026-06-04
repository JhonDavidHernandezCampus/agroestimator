using System;
using System.Threading;
using System.Threading.Tasks;
using AgroEstimador.Application.Common.Interfaces;
using AgroEstimador.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace AgroEstimador.Persistence;

public class AgroEstimadorDbContext : DbContext
{
    private readonly ICurrentUserService _currentUserService;

    public AgroEstimadorDbContext(
        DbContextOptions<AgroEstimadorDbContext> options,
        ICurrentUserService currentUserService)
        : base(options)
    {
        _currentUserService = currentUserService;
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<UserRole> UserRoles => Set<UserRole>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<ProductPriceHistory> ProductPriceHistories => Set<ProductPriceHistory>();
    public DbSet<MeasurementUnit> MeasurementUnits => Set<MeasurementUnit>();
    public DbSet<Farm> Farms => Set<Farm>();
    public DbSet<Lot> Lots => Set<Lot>();
    public DbSet<Vehicle> Vehicles => Set<Vehicle>();
    public DbSet<Harvest> Harvests => Set<Harvest>();
    public DbSet<HarvestSample> HarvestSamples => Set<HarvestSample>();
    public DbSet<HarvestCalculation> HarvestCalculations => Set<HarvestCalculation>();
    public DbSet<AppSetting> AppSettings => Set<AppSetting>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<SyncQueue> SyncQueues => Set<SyncQueue>();
    public DbSet<SyncConflict> SyncConflicts => Set<SyncConflict>();

    // Materialized Views
    public DbSet<FarmStatistics> FarmStatistics => Set<FarmStatistics>();
    public DbSet<ProductStatistics> ProductStatistics => Set<ProductStatistics>();
    public DbSet<MonthlyStatistics> MonthlyStatistics => Set<MonthlyStatistics>();

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var userId = _currentUserService.UserId;
        if (userId.HasValue && userId.Value != Guid.Empty)
        {
            var hasActiveTransaction = Database.CurrentTransaction != null;
            if (!hasActiveTransaction)
            {
                await Database.OpenConnectionAsync(cancellationToken);
                using var transaction = await Database.BeginTransactionAsync(cancellationToken);
                try
                {
                    await Database.ExecuteSqlRawAsync("SELECT set_config('app.current_user_id', {0}, true);", new object[] { userId.Value.ToString() }, cancellationToken);
                    var result = await base.SaveChangesAsync(cancellationToken);
                    await transaction.CommitAsync(cancellationToken);
                    return result;
                }
                catch
                {
                    await transaction.RollbackAsync(cancellationToken);
                    throw;
                }
                finally
                {
                    await Database.CloseConnectionAsync();
                }
            }
            else
            {
                await Database.ExecuteSqlRawAsync("SELECT set_config('app.current_user_id', {0}, true);", new object[] { userId.Value.ToString() }, cancellationToken);
                return await base.SaveChangesAsync(cancellationToken);
            }
        }

        return await base.SaveChangesAsync(cancellationToken);
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // roles
        modelBuilder.Entity<Role>(entity =>
        {
            entity.ToTable("roles");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id").HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.Name).HasColumnName("name").HasMaxLength(50).IsRequired();
            entity.Property(e => e.Description).HasColumnName("description").HasMaxLength(255);
            entity.Property(e => e.IsActive).HasColumnName("is_active").HasDefaultValue(true);
            entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("now()");
            entity.Property(e => e.UpdatedAt).HasColumnName("updated_at").HasDefaultValueSql("now()");
            entity.HasIndex(e => e.Name).IsUnique().HasDatabaseName("uq_roles_name");
        });

        // measurement_units
        modelBuilder.Entity<MeasurementUnit>(entity =>
        {
            entity.ToTable("measurement_units");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id").HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.Name).HasColumnName("name").HasMaxLength(50).IsRequired();
            entity.Property(e => e.Abbreviation).HasColumnName("abbreviation").HasMaxLength(10).IsRequired();
            entity.Property(e => e.ConversionToKg).HasColumnName("conversion_to_kg").HasPrecision(15, 6).IsRequired();
            entity.Property(e => e.IsActive).HasColumnName("is_active").HasDefaultValue(true);
            entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("now()");
            entity.HasIndex(e => e.Name).IsUnique().HasDatabaseName("uq_measurement_units_name");
            entity.HasIndex(e => e.Abbreviation).IsUnique().HasDatabaseName("uq_measurement_units_abbreviation");
        });

        // app_settings
        modelBuilder.Entity<AppSetting>(entity =>
        {
            entity.ToTable("app_settings");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id").HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.Key).HasColumnName("key").HasMaxLength(100).IsRequired();
            entity.Property(e => e.Value).HasColumnName("value").IsRequired();
            entity.Property(e => e.DataType).HasColumnName("data_type").HasMaxLength(20).HasDefaultValue("string");
            entity.Property(e => e.Description).HasColumnName("description").HasMaxLength(255);
            entity.Property(e => e.UpdatedAt).HasColumnName("updated_at").HasDefaultValueSql("now()");
            entity.HasIndex(e => e.Key).IsUnique().HasDatabaseName("uq_app_settings_key");
        });

        // audit_logs
        modelBuilder.Entity<AuditLog>(entity =>
        {
            entity.ToTable("audit_logs");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id").UseIdentityAlwaysColumn();
            entity.Property(e => e.TableName).HasColumnName("table_name").HasMaxLength(50).IsRequired();
            entity.Property(e => e.RecordId).HasColumnName("record_id").IsRequired();
            entity.Property(e => e.Action).HasColumnName("action").HasMaxLength(10).IsRequired();
            entity.Property(e => e.OldValues).HasColumnName("old_values").HasColumnType("jsonb");
            entity.Property(e => e.NewValues).HasColumnName("new_values").HasColumnType("jsonb");
            entity.Property(e => e.ChangedFields).HasColumnName("changed_fields").HasColumnType("text[]");
            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.IpAddress)
                .HasColumnName("ip_address")
                .HasColumnType("inet")
                .HasConversion(
                    v => string.IsNullOrEmpty(v) ? null : System.Net.IPAddress.Parse(v),
                    v => v == null ? null : v.ToString());
            entity.Property(e => e.UserAgent).HasColumnName("user_agent").HasMaxLength(500);
            entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("now()");
        });

        // users
        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("users");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id").HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.FirstName).HasColumnName("first_name").HasMaxLength(100).IsRequired();
            entity.Property(e => e.LastName).HasColumnName("last_name").HasMaxLength(100).IsRequired();
            entity.Property(e => e.Email).HasColumnName("email").HasMaxLength(255).IsRequired();
            entity.Property(e => e.PasswordHash).HasColumnName("password_hash").HasMaxLength(512).IsRequired();
            entity.Property(e => e.Phone).HasColumnName("phone").HasMaxLength(20);
            entity.Property(e => e.DocumentNumber).HasColumnName("document_number").HasMaxLength(30);
            entity.Property(e => e.AvatarUrl).HasColumnName("avatar_url").HasMaxLength(500);
            entity.Property(e => e.IsActive).HasColumnName("is_active").HasDefaultValue(true);
            entity.Property(e => e.EmailVerifiedAt).HasColumnName("email_verified_at");
            entity.Property(e => e.LastLoginAt).HasColumnName("last_login_at");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("now()");
            entity.Property(e => e.UpdatedAt).HasColumnName("updated_at").HasDefaultValueSql("now()");
            entity.HasIndex(e => e.Email).IsUnique().HasDatabaseName("uq_users_email");
            entity.HasIndex(e => e.DocumentNumber).IsUnique().HasDatabaseName("uq_users_document_number");
        });

        // user_roles
        modelBuilder.Entity<UserRole>(entity =>
        {
            entity.ToTable("user_roles");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id").HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.UserId).HasColumnName("user_id").IsRequired();
            entity.Property(e => e.RoleId).HasColumnName("role_id").IsRequired();
            entity.Property(e => e.AssignedAt).HasColumnName("assigned_at").HasDefaultValueSql("now()");
            entity.Property(e => e.AssignedBy).HasColumnName("assigned_by");

            entity.HasOne(e => e.User)
                .WithMany(u => u.UserRoles)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("fk_user_roles_user");

            entity.HasOne(e => e.Role)
                .WithMany()
                .HasForeignKey(e => e.RoleId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("fk_user_roles_role");

            entity.HasOne(e => e.Assigner)
                .WithMany()
                .HasForeignKey(e => e.AssignedBy)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("fk_user_roles_assigned_by");

            entity.HasIndex(e => new { e.UserId, e.RoleId }).IsUnique().HasDatabaseName("uq_user_roles_user_role");
        });

        // refresh_tokens
        modelBuilder.Entity<RefreshToken>(entity =>
        {
            entity.ToTable("refresh_tokens");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id").HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.UserId).HasColumnName("user_id").IsRequired();
            entity.Property(e => e.Token).HasColumnName("token").HasMaxLength(512).IsRequired();
            entity.Property(e => e.DeviceId).HasColumnName("device_id").HasMaxLength(100);
            entity.Property(e => e.ExpiresAt).HasColumnName("expires_at").IsRequired();
            entity.Property(e => e.IsRevoked).HasColumnName("is_revoked").HasDefaultValue(false);
            entity.Property(e => e.RevokedAt).HasColumnName("revoked_at");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("now()");

            entity.HasOne(e => e.User)
                .WithMany(u => u.RefreshTokens)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("fk_refresh_tokens_user");

            entity.HasIndex(e => e.Token).IsUnique().HasDatabaseName("uq_refresh_tokens_token");
        });

        // products
        modelBuilder.Entity<Product>(entity =>
        {
            entity.ToTable("products");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id").HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.Name).HasColumnName("name").HasMaxLength(150).IsRequired();
            entity.Property(e => e.Description).HasColumnName("description").HasMaxLength(500);
            entity.Property(e => e.DefaultUnitId).HasColumnName("default_unit_id");
            entity.Property(e => e.CurrentPricePerKg).HasColumnName("current_price_per_kg").HasPrecision(12, 2);
            entity.Property(e => e.IsActive).HasColumnName("is_active").HasDefaultValue(true);
            entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("now()");
            entity.Property(e => e.UpdatedAt).HasColumnName("updated_at").HasDefaultValueSql("now()");

            entity.HasOne(e => e.DefaultUnit)
                .WithMany(u => u.Products)
                .HasForeignKey(e => e.DefaultUnitId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("fk_products_unit");

            entity.HasIndex(e => e.Name).IsUnique().HasDatabaseName("uq_products_name");
        });

        // product_price_history
        modelBuilder.Entity<ProductPriceHistory>(entity =>
        {
            entity.ToTable("product_price_history");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id").HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.ProductId).HasColumnName("product_id").IsRequired();
            entity.Property(e => e.PricePerKg).HasColumnName("price_per_kg").HasPrecision(12, 2).IsRequired();
            entity.Property(e => e.EffectiveDate).HasColumnName("effective_date").IsRequired();
            entity.Property(e => e.EndDate).HasColumnName("end_date");
            entity.Property(e => e.Source).HasColumnName("source").HasMaxLength(100);
            entity.Property(e => e.CreatedBy).HasColumnName("created_by");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("now()");

            entity.HasOne(e => e.Product)
                .WithMany(p => p.PriceHistories)
                .HasForeignKey(e => e.ProductId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("fk_price_history_product");

            entity.HasOne(e => e.Creator)
                .WithMany()
                .HasForeignKey(e => e.CreatedBy)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("fk_price_history_created_by");

            entity.HasIndex(e => new { e.ProductId, e.EffectiveDate }).IsUnique().HasDatabaseName("uq_price_history_product_date");
        });

        // farms
        modelBuilder.Entity<Farm>(entity =>
        {
            entity.ToTable("farms");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id").HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.UserId).HasColumnName("user_id").IsRequired();
            entity.Property(e => e.Name).HasColumnName("name").HasMaxLength(150).IsRequired();
            entity.Property(e => e.Location).HasColumnName("location").HasMaxLength(255);
            entity.Property(e => e.Municipality).HasColumnName("municipality").HasMaxLength(100);
            entity.Property(e => e.Department).HasColumnName("department").HasMaxLength(100);
            entity.Property(e => e.TotalHectares).HasColumnName("total_hectares").HasPrecision(10, 2);
            entity.Property(e => e.Latitude).HasColumnName("latitude").HasPrecision(10, 7);
            entity.Property(e => e.Longitude).HasColumnName("longitude").HasPrecision(10, 7);
            entity.Property(e => e.IsActive).HasColumnName("is_active").HasDefaultValue(true);
            entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("now()");
            entity.Property(e => e.UpdatedAt).HasColumnName("updated_at").HasDefaultValueSql("now()");

            entity.HasOne(e => e.User)
                .WithMany(u => u.Farms)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("fk_farms_user");

            entity.HasIndex(e => new { e.UserId, e.Name }).IsUnique().HasDatabaseName("uq_farms_user_name");
        });

        // lots
        modelBuilder.Entity<Lot>(entity =>
        {
            entity.ToTable("lots");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id").HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.FarmId).HasColumnName("farm_id").IsRequired();
            entity.Property(e => e.Name).HasColumnName("name").HasMaxLength(100).IsRequired();
            entity.Property(e => e.Hectares).HasColumnName("hectares").HasPrecision(10, 2);
            entity.Property(e => e.CropType).HasColumnName("crop_type").HasMaxLength(100);
            entity.Property(e => e.PlantingDate).HasColumnName("planting_date");
            entity.Property(e => e.IsActive).HasColumnName("is_active").HasDefaultValue(true);
            entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("now()");
            entity.Property(e => e.UpdatedAt).HasColumnName("updated_at").HasDefaultValueSql("now()");

            entity.HasOne(e => e.Farm)
                .WithMany(f => f.Lots)
                .HasForeignKey(e => e.FarmId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("fk_lots_farm");

            entity.HasIndex(e => new { e.FarmId, e.Name }).IsUnique().HasDatabaseName("uq_lots_farm_name");
        });

        // vehicles
        modelBuilder.Entity<Vehicle>(entity =>
        {
            entity.ToTable("vehicles");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id").HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.UserId).HasColumnName("user_id").IsRequired();
            entity.Property(e => e.Name).HasColumnName("name").HasMaxLength(100).IsRequired();
            entity.Property(e => e.Plate).HasColumnName("plate").HasMaxLength(20).IsRequired();
            entity.Property(e => e.VehicleType).HasColumnName("vehicle_type").HasMaxLength(50);
            entity.Property(e => e.CapacityKg).HasColumnName("capacity_kg").HasPrecision(10, 2).IsRequired();
            entity.Property(e => e.TareWeightKg).HasColumnName("tare_weight_kg").HasPrecision(10, 2);
            entity.Property(e => e.FuelLevel).HasColumnName("fuel_level");
            entity.Property(e => e.NextServiceDate).HasColumnName("next_service_date");
            entity.Property(e => e.Status).HasColumnName("status").HasMaxLength(20).HasDefaultValue("active").IsRequired();
            entity.Property(e => e.MaintenanceNotes).HasColumnName("maintenance_notes");
            entity.Property(e => e.IsActive).HasColumnName("is_active").HasDefaultValue(true);
            entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("now()");
            entity.Property(e => e.UpdatedAt).HasColumnName("updated_at").HasDefaultValueSql("now()");

            entity.HasOne(e => e.User)
                .WithMany(u => u.Vehicles)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("fk_vehicles_user");

            entity.HasIndex(e => e.Plate).IsUnique().HasDatabaseName("uq_vehicles_plate");
        });

        // harvests
        modelBuilder.Entity<Harvest>(entity =>
        {
            entity.ToTable("harvests");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id").HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.UserId).HasColumnName("user_id").IsRequired();
            entity.Property(e => e.FarmId).HasColumnName("farm_id").IsRequired();
            entity.Property(e => e.LotId).HasColumnName("lot_id");
            entity.Property(e => e.ProductId).HasColumnName("product_id").IsRequired();
            entity.Property(e => e.VehicleId).HasColumnName("vehicle_id");
            entity.Property(e => e.HarvestDate).HasColumnName("harvest_date").IsRequired();
            entity.Property(e => e.TotalBunches).HasColumnName("total_bunches").IsRequired();
            entity.Property(e => e.PricePerKgAtHarvest).HasColumnName("price_per_kg_at_harvest").HasPrecision(12, 2);
            entity.Property(e => e.Notes).HasColumnName("notes");
            entity.Property(e => e.WeatherConditions).HasColumnName("weather_conditions").HasMaxLength(50);
            entity.Property(e => e.Status).HasColumnName("status").HasMaxLength(20).HasDefaultValue("draft").IsRequired();
            entity.Property(e => e.DeviceId).HasColumnName("device_id").HasMaxLength(100);
            entity.Property(e => e.IsSynced).HasColumnName("is_synced").HasDefaultValue(true);
            entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("now()");
            entity.Property(e => e.UpdatedAt).HasColumnName("updated_at").HasDefaultValueSql("now()");

            entity.HasOne(e => e.User)
                .WithMany(u => u.Harvests)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("fk_harvests_user");

            entity.HasOne(e => e.Farm)
                .WithMany(f => f.Harvests)
                .HasForeignKey(e => e.FarmId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("fk_harvests_farm");

            entity.HasOne(e => e.Lot)
                .WithMany(l => l.Harvests)
                .HasForeignKey(e => e.LotId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("fk_harvests_lot");

            entity.HasOne(e => e.Product)
                .WithMany(p => p.Harvests)
                .HasForeignKey(e => e.ProductId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("fk_harvests_product");

            entity.HasOne(e => e.Vehicle)
                .WithMany(v => v.Harvests)
                .HasForeignKey(e => e.VehicleId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("fk_harvests_vehicle");
        });

        // harvest_samples
        modelBuilder.Entity<HarvestSample>(entity =>
        {
            entity.ToTable("harvest_samples");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id").HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.HarvestId).HasColumnName("harvest_id").IsRequired();
            entity.Property(e => e.SampleNumber).HasColumnName("sample_number").IsRequired();
            entity.Property(e => e.WeightKg).HasColumnName("weight_kg").HasPrecision(8, 3).IsRequired();
            entity.Property(e => e.Quality).HasColumnName("quality").HasMaxLength(10);
            entity.Property(e => e.Notes).HasColumnName("notes").HasMaxLength(255);
            entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("now()");

            entity.HasOne(e => e.Harvest)
                .WithMany(h => h.Samples)
                .HasForeignKey(e => e.HarvestId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("fk_harvest_samples_harvest");

            entity.HasIndex(e => new { e.HarvestId, e.SampleNumber }).IsUnique().HasDatabaseName("uq_harvest_samples_harvest_number");
        });

        // harvest_calculations
        modelBuilder.Entity<HarvestCalculation>(entity =>
        {
            entity.ToTable("harvest_calculations");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id").HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.HarvestId).HasColumnName("harvest_id").IsRequired();
            entity.Property(e => e.SampleCount).HasColumnName("sample_count").IsRequired();
            entity.Property(e => e.AverageWeightKg).HasColumnName("average_weight_kg").HasPrecision(10, 3).IsRequired();
            entity.Property(e => e.StdDeviationKg).HasColumnName("std_deviation_kg").HasPrecision(10, 3);
            entity.Property(e => e.MinWeightKg).HasColumnName("min_weight_kg").HasPrecision(8, 3);
            entity.Property(e => e.MaxWeightKg).HasColumnName("max_weight_kg").HasPrecision(8, 3);
            entity.Property(e => e.EstimatedTotalWeightKg).HasColumnName("estimated_total_weight_kg").HasPrecision(12, 3).IsRequired();
            entity.Property(e => e.EstimatedValue).HasColumnName("estimated_value").HasPrecision(15, 2);
            entity.Property(e => e.ConfidenceLevel).HasColumnName("confidence_level").HasPrecision(5, 2);
            entity.Property(e => e.CalculationMethod).HasColumnName("calculation_method").HasMaxLength(50).HasDefaultValue("simple_average").IsRequired();
            entity.Property(e => e.CalculatedAt).HasColumnName("calculated_at").HasDefaultValueSql("now()");
            entity.Property(e => e.CalculatedBy).HasColumnName("calculated_by");

            entity.HasOne(e => e.Harvest)
                .WithOne(h => h.Calculation)
                .HasForeignKey<HarvestCalculation>(e => e.HarvestId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("fk_harvest_calculations_harvest");

            entity.HasOne(e => e.Calculator)
                .WithMany()
                .HasForeignKey(e => e.CalculatedBy)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("fk_harvest_calculations_user");

            entity.HasIndex(e => e.HarvestId).IsUnique().HasDatabaseName("uq_harvest_calculations_harvest");
        });

        // sync_queue
        modelBuilder.Entity<SyncQueue>(entity =>
        {
            entity.ToTable("sync_queue");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id").HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.DeviceId).HasColumnName("device_id").HasMaxLength(100).IsRequired();
            entity.Property(e => e.UserId).HasColumnName("user_id").IsRequired();
            entity.Property(e => e.EntityType).HasColumnName("entity_type").HasMaxLength(50).IsRequired();
            entity.Property(e => e.EntityId).HasColumnName("entity_id").IsRequired();
            entity.Property(e => e.Operation).HasColumnName("operation").HasMaxLength(10).IsRequired();
            entity.Property(e => e.Payload).HasColumnName("payload").HasColumnType("jsonb").IsRequired();
            entity.Property(e => e.Status).HasColumnName("status").HasMaxLength(20).HasDefaultValue("pending").IsRequired();
            entity.Property(e => e.Attempts).HasColumnName("attempts").HasDefaultValue((short)0).IsRequired();
            entity.Property(e => e.ErrorMessage).HasColumnName("error_message");
            entity.Property(e => e.ClientTimestamp).HasColumnName("client_timestamp").IsRequired();
            entity.Property(e => e.ServerTimestamp).HasColumnName("server_timestamp");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("now()");

            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("fk_sync_queue_user");
        });

        // sync_conflicts
        modelBuilder.Entity<SyncConflict>(entity =>
        {
            entity.ToTable("sync_conflicts");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id").HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.SyncQueueId).HasColumnName("sync_queue_id").IsRequired();
            entity.Property(e => e.EntityType).HasColumnName("entity_type").HasMaxLength(50).IsRequired();
            entity.Property(e => e.EntityId).HasColumnName("entity_id").IsRequired();
            entity.Property(e => e.ClientData).HasColumnName("client_data").HasColumnType("jsonb").IsRequired();
            entity.Property(e => e.ServerData).HasColumnName("server_data").HasColumnType("jsonb").IsRequired();
            entity.Property(e => e.Resolution).HasColumnName("resolution").HasMaxLength(20);
            entity.Property(e => e.ResolvedBy).HasColumnName("resolved_by");
            entity.Property(e => e.ResolvedAt).HasColumnName("resolved_at");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("now()");

            entity.HasOne(e => e.SyncQueue)
                .WithMany()
                .HasForeignKey(e => e.SyncQueueId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("fk_sync_conflicts_queue");

            entity.HasOne(e => e.Resolver)
                .WithMany()
                .HasForeignKey(e => e.ResolvedBy)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("fk_sync_conflicts_resolved_by");
        });

        // Materialized Views (Read-Only)
        modelBuilder.Entity<FarmStatistics>(entity =>
        {
            entity.HasNoKey();
            entity.ToView("mv_farm_statistics");
            entity.Property(e => e.FarmId).HasColumnName("farm_id");
            entity.Property(e => e.FarmName).HasColumnName("farm_name");
            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.TotalHarvests).HasColumnName("total_harvests");
            entity.Property(e => e.TotalWeightKg).HasColumnName("total_weight_kg");
            entity.Property(e => e.TotalValue).HasColumnName("total_value");
            entity.Property(e => e.AvgWeightPerBunch).HasColumnName("avg_weight_per_bunch");
            entity.Property(e => e.FirstHarvestDate).HasColumnName("first_harvest_date");
            entity.Property(e => e.LastHarvestDate).HasColumnName("last_harvest_date");
            entity.Property(e => e.DistinctProducts).HasColumnName("distinct_products");
            entity.Property(e => e.DistinctLots).HasColumnName("distinct_lots");
        });

        modelBuilder.Entity<ProductStatistics>(entity =>
        {
            entity.HasNoKey();
            entity.ToView("mv_product_statistics");
            entity.Property(e => e.ProductId).HasColumnName("product_id");
            entity.Property(e => e.ProductName).HasColumnName("product_name");
            entity.Property(e => e.TotalHarvests).HasColumnName("total_harvests");
            entity.Property(e => e.DistinctProducers).HasColumnName("distinct_producers");
            entity.Property(e => e.DistinctFarms).HasColumnName("distinct_farms");
            entity.Property(e => e.TotalWeightKg).HasColumnName("total_weight_kg");
            entity.Property(e => e.TotalValue).HasColumnName("total_value");
            entity.Property(e => e.AvgWeightPerBunch).HasColumnName("avg_weight_per_bunch");
            entity.Property(e => e.FirstHarvestDate).HasColumnName("first_harvest_date");
            entity.Property(e => e.LastHarvestDate).HasColumnName("last_harvest_date");
        });

        modelBuilder.Entity<MonthlyStatistics>(entity =>
        {
            entity.HasNoKey();
            entity.ToView("mv_monthly_statistics");
            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.Month).HasColumnName("month");
            entity.Property(e => e.TotalHarvests).HasColumnName("total_harvests");
            entity.Property(e => e.TotalBunches).HasColumnName("total_bunches");
            entity.Property(e => e.TotalWeightKg).HasColumnName("total_weight_kg");
            entity.Property(e => e.TotalValue).HasColumnName("total_value");
            entity.Property(e => e.AvgWeightPerBunch).HasColumnName("avg_weight_per_bunch");
            entity.Property(e => e.FarmsHarvested).HasColumnName("farms_harvested");
            entity.Property(e => e.ProductsHarvested).HasColumnName("products_harvested");
        });
    }
}
