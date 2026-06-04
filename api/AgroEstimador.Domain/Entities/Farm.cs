using System;
using System.Collections.Generic;

namespace AgroEstimador.Domain.Entities;

public class Farm
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Location { get; set; }
    public string? Municipality { get; set; }
    public string? Department { get; set; }
    public decimal? TotalHectares { get; set; }
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual User User { get; set; } = null!;
    public virtual ICollection<Lot> Lots { get; set; } = new List<Lot>();
    public virtual ICollection<Harvest> Harvests { get; set; } = new List<Harvest>();
}
