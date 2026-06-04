using System;

namespace AgroEstimador.Application.DTOs;

public class ProductDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid? DefaultUnitId { get; set; }
    public string? DefaultUnitAbbreviation { get; set; }
    public decimal? CurrentPricePerKg { get; set; }
    public bool IsActive { get; set; }
}

public class ProductPriceHistoryDto
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    public decimal PricePerKg { get; set; }
    public DateTime EffectiveDate { get; set; }
    public DateTime? EndDate { get; set; }
    public string? Source { get; set; }
}

public class CreateProductPriceDto
{
    public decimal PricePerKg { get; set; }
    public DateTime EffectiveDate { get; set; }
    public string? Source { get; set; }
}
