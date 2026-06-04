using System;

namespace AgroEstimador.Domain.Entities;

public class HarvestCalculation
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid HarvestId { get; set; }
    public int SampleCount { get; set; }
    public decimal AverageWeightKg { get; set; }
    public decimal? StdDeviationKg { get; set; }
    public decimal? MinWeightKg { get; set; }
    public decimal? MaxWeightKg { get; set; }
    public decimal EstimatedTotalWeightKg { get; set; }
    public decimal? EstimatedValue { get; set; }
    public decimal? ConfidenceLevel { get; set; }
    public string CalculationMethod { get; set; } = "simple_average";
    public DateTime CalculatedAt { get; set; } = DateTime.UtcNow;
    public Guid? CalculatedBy { get; set; }

    // Navigation properties
    public virtual Harvest Harvest { get; set; } = null!;
    public virtual User? Calculator { get; set; }
}
