using System;

namespace AgroEstimador.Domain.Entities;

public class FarmStatistics
{
    public Guid FarmId { get; set; }
    public string FarmName { get; set; } = string.Empty;
    public Guid UserId { get; set; }
    public long TotalHarvests { get; set; }
    public decimal TotalWeightKg { get; set; }
    public decimal TotalValue { get; set; }
    public decimal AvgWeightPerBunch { get; set; }
    public DateTime? FirstHarvestDate { get; set; }
    public DateTime? LastHarvestDate { get; set; }
    public long DistinctProducts { get; set; }
    public long DistinctLots { get; set; }
}
