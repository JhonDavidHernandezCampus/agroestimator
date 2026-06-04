using System;

namespace AgroEstimador.Domain.Entities;

public class HarvestSample
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid HarvestId { get; set; }
    public short SampleNumber { get; set; }
    public decimal WeightKg { get; set; }
    public string? Quality { get; set; } // high, medium, low
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual Harvest Harvest { get; set; } = null!;
}
