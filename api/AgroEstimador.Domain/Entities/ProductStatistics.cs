using System;

namespace AgroEstimador.Domain.Entities;

public class ProductStatistics
{
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public long TotalHarvests { get; set; }
    public long DistinctProducers { get; set; }
    public long DistinctFarms { get; set; }
    public decimal TotalWeightKg { get; set; }
    public decimal TotalValue { get; set; }
    public decimal AvgWeightPerBunch { get; set; }
    public DateTime? FirstHarvestDate { get; set; }
    public DateTime? LastHarvestDate { get; set; }
}
