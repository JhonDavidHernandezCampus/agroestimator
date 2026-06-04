using System;

namespace AgroEstimador.Application.DTOs;

public class VehicleDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Plate { get; set; } = string.Empty;
    public string? VehicleType { get; set; }
    public decimal CapacityKg { get; set; }
    public decimal? TareWeightKg { get; set; }
    public short? FuelLevel { get; set; }
    public DateTime? NextServiceDate { get; set; }
    public string Status { get; set; } = "active";
    public string? MaintenanceNotes { get; set; }
    public bool IsActive { get; set; }
}
