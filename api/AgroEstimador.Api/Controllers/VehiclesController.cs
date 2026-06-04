using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using AgroEstimador.Application.DTOs;
using AgroEstimador.Application.Vehicles.Commands;
using AgroEstimador.Application.Vehicles.Queries;
using AgroEstimador.Shared;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AgroEstimador.Api.Controllers;

[Authorize]
public class VehiclesController : ApiControllerBase
{
    [HttpGet]
    public async Task<ActionResult<ApiResponse<IEnumerable<VehicleDto>>>> GetAll()
    {
        var result = await Mediator.Send(new GetVehiclesQuery(CurrentUserId));
        return Ok(ApiResponse<IEnumerable<VehicleDto>>.SuccessResponse(result));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ApiResponse<VehicleDto>>> GetById(Guid id)
    {
        var result = await Mediator.Send(new GetVehicleByIdQuery(id));
        if (result == null)
        {
            return NotFound(ApiResponse<VehicleDto>.ErrorResponse("Vehicle not found."));
        }
        return Ok(ApiResponse<VehicleDto>.SuccessResponse(result));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<VehicleDto>>> Create([FromBody] CreateVehicleRequest request)
    {
        var command = new CreateVehicleCommand(
            CurrentUserId,
            request.Name,
            request.Plate,
            request.VehicleType,
            request.CapacityKg,
            request.TareWeightKg,
            request.FuelLevel,
            request.NextServiceDate,
            request.Status,
            request.MaintenanceNotes
        );

        var result = await Mediator.Send(command);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, ApiResponse<VehicleDto>.SuccessResponse(result, "Vehicle created successfully."));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ApiResponse<VehicleDto>>> Update(Guid id, [FromBody] UpdateVehicleRequest request)
    {
        var command = new UpdateVehicleCommand(
            id,
            request.Name,
            request.Plate,
            request.VehicleType,
            request.CapacityKg,
            request.TareWeightKg,
            request.FuelLevel,
            request.NextServiceDate,
            request.Status,
            request.MaintenanceNotes
        );

        var result = await Mediator.Send(command);
        if (result == null)
        {
            return NotFound(ApiResponse<VehicleDto>.ErrorResponse("Vehicle not found."));
        }
        return Ok(ApiResponse<VehicleDto>.SuccessResponse(result, "Vehicle updated successfully."));
    }

    [HttpDelete("{id:guid}")]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(Guid id)
    {
        var result = await Mediator.Send(new DeleteVehicleCommand(id));
        if (!result)
        {
            return NotFound(ApiResponse<bool>.ErrorResponse("Vehicle not found."));
        }
        return Ok(ApiResponse<bool>.SuccessResponse(true, "Vehicle deleted successfully."));
    }
}

public record CreateVehicleRequest(
    string Name,
    string Plate,
    string? VehicleType,
    decimal CapacityKg,
    decimal? TareWeightKg,
    short? FuelLevel,
    DateTime? NextServiceDate,
    string Status,
    string? MaintenanceNotes
);

public record UpdateVehicleRequest(
    string Name,
    string Plate,
    string? VehicleType,
    decimal CapacityKg,
    decimal? TareWeightKg,
    short? FuelLevel,
    DateTime? NextServiceDate,
    string Status,
    string? MaintenanceNotes
);
