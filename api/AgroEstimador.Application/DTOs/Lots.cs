using System;

namespace AgroEstimador.Application.DTOs;

public class LotDto
{
    public Guid Id { get; set; }
    public Guid FarmId { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal? Hectares { get; set; }
    public string? CropType { get; set; }
    public DateTime? PlantingDate { get; set; }
    public bool IsActive { get; set; }
}
