using System;
using System.Collections.Generic;

namespace AgroEstimador.Domain.Entities;

public class Lot
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid FarmId { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal? Hectares { get; set; }
    public string? CropType { get; set; }
    public DateTime? PlantingDate { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual Farm Farm { get; set; } = null!;
    public virtual ICollection<Harvest> Harvests { get; set; } = new List<Harvest>();
}
