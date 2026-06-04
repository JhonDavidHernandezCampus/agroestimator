using System;

namespace AgroEstimador.Domain.Entities;

public class MonthlyStatistics
{
    public Guid UserId { get; set; }
    public DateTime Month { get; set; }
    public long TotalHarvests { get; set; }
    public long TotalBunches { get; set; }
    public decimal TotalWeightKg { get; set; }
    public decimal TotalValue { get; set; }
    public decimal AvgWeightPerBunch { get; set; }
    public long FarmsHarvested { get; set; }
    public long ProductsHarvested { get; set; }
}
