using System;
using System.Collections.Generic;

namespace AgroEstimador.Domain.Entities;

public class Harvest
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public Guid FarmId { get; set; }
    public Guid? LotId { get; set; }
    public Guid ProductId { get; set; }
    public Guid? VehicleId { get; set; }
    public DateTime HarvestDate { get; set; }
    public int TotalBunches { get; set; }
    public decimal? PricePerKgAtHarvest { get; set; }
    public string? Notes { get; set; }
    public string? WeatherConditions { get; set; }
    public string Status { get; set; } = "draft"; // draft, completed, cancelled
    public string? DeviceId { get; set; }
    public bool IsSynced { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual User User { get; set; } = null!;
    public virtual Farm Farm { get; set; } = null!;
    public virtual Lot? Lot { get; set; }
    public virtual Product Product { get; set; } = null!;
    public virtual Vehicle? Vehicle { get; set; }
    public virtual HarvestCalculation? Calculation { get; set; }
    public virtual ICollection<HarvestSample> Samples { get; set; } = new List<HarvestSample>();
}
