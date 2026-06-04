using System;

namespace AgroEstimador.Application.DTOs;

public class FarmDto
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Location { get; set; }
    public string? Municipality { get; set; }
    public string? Department { get; set; }
    public decimal? TotalHectares { get; set; }
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public bool IsActive { get; set; }
}

public class FarmStatisticsDto
{
    public Guid FarmId { get; set; }
    public string FarmName { get; set; } = string.Empty;
    public int TotalHarvests { get; set; }
    public decimal TotalWeightKg { get; set; }
    public decimal TotalValue { get; set; }
    public decimal AvgWeightPerBunch { get; set; }
    public DateTime? FirstHarvestDate { get; set; }
    public DateTime? LastHarvestDate { get; set; }
    public int DistinctProducts { get; set; }
    public int DistinctLots { get; set; }
}
