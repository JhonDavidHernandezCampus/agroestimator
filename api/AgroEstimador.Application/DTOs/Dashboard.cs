using System;

namespace AgroEstimador.Application.DTOs;

// Direct mapping for frontend useStatistics hook
public class StatisticsDto
{
    public int TotalHarvests { get; set; }
    public decimal TotalWeight { get; set; } // in kg (frontend formats to tons as totalWeight / 1000)
    public decimal EstimatedEarnings { get; set; }
    public int ActiveVehicles { get; set; }
    public int InMaintenanceVehicles { get; set; }
}

public class DashboardSummaryDto
{
    public int TotalHarvests { get; set; }
    public int TotalFarms { get; set; }
    public int TotalLots { get; set; }
    public decimal TotalWeightEstimated { get; set; }
    public decimal TotalValueEstimated { get; set; }
}

public class MonthlyProductionDto
{
    public string Month { get; set; } = string.Empty; // e.g. "2026-05"
    public int TotalHarvests { get; set; }
    public int TotalBunches { get; set; }
    public decimal TotalWeightKg { get; set; }
    public decimal TotalValue { get; set; }
    public decimal AvgWeightPerBunch { get; set; }
}

public class FarmStatsDto
{
    public Guid FarmId { get; set; }
    public string FarmName { get; set; } = string.Empty;
    public int TotalHarvests { get; set; }
    public decimal TotalWeightKg { get; set; }
    public decimal TotalValue { get; set; }
}

public class ProductStatsDto
{
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public int TotalHarvests { get; set; }
    public decimal TotalWeightKg { get; set; }
    public decimal TotalValue { get; set; }
}

public class TrendDto
{
    public string Date { get; set; } = string.Empty; // yyyy-MM-dd
    public decimal WeightKg { get; set; }
    public decimal Value { get; set; }
}
