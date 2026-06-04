using System;
using System.Collections.Generic;

namespace AgroEstimador.Application.DTOs;

public class HarvestSampleDto
{
    public string Id { get; set; } = string.Empty; // Client-side temp ID or DB UUID string
    public decimal Weight { get; set; }
    public string Quality { get; set; } = "Media"; // Alta, Media, Baja
}

public class HarvestDto
{
    public string Id { get; set; } = string.Empty;
    public string Date { get; set; } = string.Empty; // yyyy-MM-dd
    public string FarmName { get; set; } = string.Empty;
    public string Lot { get; set; } = string.Empty;
    public string Product { get; set; } = string.Empty;
    public string Vehicle { get; set; } = string.Empty;
    public int Quantity { get; set; } // Total bunches
    public List<HarvestSampleDto> Samples { get; set; } = new();
    public decimal AverageWeight { get; set; }
    public decimal EstimatedWeight { get; set; }
    public decimal EstimatedValue { get; set; }
    public decimal? PricePerKg { get; set; }
}

public class CreateHarvestDto
{
    public string Date { get; set; } = string.Empty;
    public string FarmName { get; set; } = string.Empty;
    public string Lot { get; set; } = string.Empty;
    public string Product { get; set; } = string.Empty;
    public string Vehicle { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public List<HarvestSampleDto> Samples { get; set; } = new();
    public decimal? PricePerKg { get; set; }
}
