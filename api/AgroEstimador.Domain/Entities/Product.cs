using System;
using System.Collections.Generic;

namespace AgroEstimador.Domain.Entities;

public class Product
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid? DefaultUnitId { get; set; }
    public decimal? CurrentPricePerKg { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual MeasurementUnit? DefaultUnit { get; set; }
    public virtual ICollection<ProductPriceHistory> PriceHistories { get; set; } = new List<ProductPriceHistory>();
    public virtual ICollection<Harvest> Harvests { get; set; } = new List<Harvest>();
}
