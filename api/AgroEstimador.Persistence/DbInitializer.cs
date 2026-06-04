using System;
using System.Linq;
using System.Threading.Tasks;
using AgroEstimador.Application.Common.Interfaces;
using AgroEstimador.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace AgroEstimador.Persistence;

public static class DbInitializer
{
    public static async Task SeedAsync(AgroEstimadorDbContext context, IPasswordHasher passwordHasher)
    {
        // Apply pending migrations if any (optional, but since we are mapping existing schema we can skip Migrations and just ensure tables exist)
        // context.Database.EnsureCreated();

        // 1. Seed Roles
        if (!await context.Roles.AnyAsync())
        {
            var roles = new[]
            {
                new Role { Name = "admin", Description = "Administrador del sistema con acceso total" },
                new Role { Name = "producer", Description = "Agricultor/productor que registra cosechas" },
                new Role { Name = "operator", Description = "Operario que asiste en el registro de cosechas" },
                new Role { Name = "viewer", Description = "Usuario de solo lectura para consultas y reportes" }
            };
            await context.Roles.AddRangeAsync(roles);
            await context.SaveChangesAsync();
        }

        // 2. Seed Measurement Units
        if (!await context.MeasurementUnits.AnyAsync())
        {
            var units = new[]
            {
                new MeasurementUnit { Name = "Kilogramo", Abbreviation = "kg", ConversionToKg = 1.000000m },
                new MeasurementUnit { Name = "Tonelada", Abbreviation = "ton", ConversionToKg = 1000.000000m },
                new MeasurementUnit { Name = "Libra", Abbreviation = "lb", ConversionToKg = 0.453592m },
                new MeasurementUnit { Name = "Arroba", Abbreviation = "@", ConversionToKg = 12.500000m },
                new MeasurementUnit { Name = "Gramo", Abbreviation = "g", ConversionToKg = 0.001000m }
            };
            await context.MeasurementUnits.AddRangeAsync(units);
            await context.SaveChangesAsync();
        }

        // 3. Seed Products
        if (!await context.Products.AnyAsync())
        {
            var kgUnit = await context.MeasurementUnits.FirstOrDefaultAsync(u => u.Abbreviation == "kg");
            var products = new[]
            {
                new Product { Name = "Fruto de Palma de Aceite", Description = "Racimos de fruto fresco (RFF) de palma africana", CurrentPricePerKg = 850.00m, DefaultUnitId = kgUnit?.Id },
                new Product { Name = "Cacao en Grano", Description = "Grano de cacao seco y fermentado", CurrentPricePerKg = 8500.00m, DefaultUnitId = kgUnit?.Id },
                new Product { Name = "Café Pergamino", Description = "Café en pergamino seco", CurrentPricePerKg = 9200.00m, DefaultUnitId = kgUnit?.Id },
                new Product { Name = "Plátano Hartón", Description = "Racimos de plátano hartón para consumo", CurrentPricePerKg = 1200.00m, DefaultUnitId = kgUnit?.Id },
                new Product { Name = "Yuca", Description = "Raíz de yuca fresca", CurrentPricePerKg = 600.00m, DefaultUnitId = kgUnit?.Id },
                new Product { Name = "Aguacate Hass", Description = "Fruto de aguacate variedad Hass", CurrentPricePerKg = 4500.00m, DefaultUnitId = kgUnit?.Id }
            };
            await context.Products.AddRangeAsync(products);
            await context.SaveChangesAsync();
        }

        // 4. Seed Default Users
        if (!await context.Users.AnyAsync())
        {
            var adminRole = await context.Roles.FirstOrDefaultAsync(r => r.Name == "admin");
            var producerRole = await context.Roles.FirstOrDefaultAsync(r => r.Name == "producer");

            // Admin User
            var adminUser = new User
            {
                FirstName = "Admin",
                LastName = "System",
                Email = "admin@agroestimator.com",
                PasswordHash = passwordHasher.HashPassword("Admin123!"),
                DocumentNumber = "1000000001",
                IsActive = true
            };
            await context.Users.AddAsync(adminUser);
            await context.SaveChangesAsync();

            if (adminRole != null)
            {
                await context.UserRoles.AddAsync(new UserRole { UserId = adminUser.Id, RoleId = adminRole.Id });
            }

            // Producer User
            var producerUser = new User
            {
                FirstName = "Jhon",
                LastName = "David",
                Email = "producer@agroestimator.com",
                PasswordHash = passwordHasher.HashPassword("Producer123!"),
                DocumentNumber = "1000000002",
                IsActive = true
            };
            await context.Users.AddAsync(producerUser);
            await context.SaveChangesAsync();

            if (producerRole != null)
            {
                await context.UserRoles.AddAsync(new UserRole { UserId = producerUser.Id, RoleId = producerRole.Id });
            }

            await context.SaveChangesAsync();
        }
    }
}
