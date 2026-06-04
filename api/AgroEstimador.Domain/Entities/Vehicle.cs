using System;
using System.Collections.Generic;

namespace AgroEstimador.Domain.Entities;

public class Vehicle
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Plate { get; set; } = string.Empty;
    public string? VehicleType { get; set; }
    public decimal CapacityKg { get; set; }
    public decimal? TareWeightKg { get; set; }
    public short? FuelLevel { get; set; }
    public DateTime? NextServiceDate { get; set; }
    public string Status { get; set; } = "active"; // active, maintenance, inactive
    public string? MaintenanceNotes { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual User User { get; set; } = null!;
    public virtual ICollection<Harvest> Harvests { get; set; } = new List<Harvest>();
}
