using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using AgroEstimador.Application.DTOs;
using AgroEstimador.Application.Farms.Commands;
using AgroEstimador.Application.Farms.Queries;
using AgroEstimador.Shared;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AgroEstimador.Api.Controllers;

[Authorize]
public class FarmsController : ApiControllerBase
{
    [HttpGet]
    public async Task<ActionResult<ApiResponse<IEnumerable<FarmDto>>>> GetAll()
    {
        var result = await Mediator.Send(new GetFarmsQuery(CurrentUserId));
        return Ok(ApiResponse<IEnumerable<FarmDto>>.SuccessResponse(result));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ApiResponse<FarmDto>>> GetById(Guid id)
    {
        var result = await Mediator.Send(new GetFarmByIdQuery(id));
        if (result == null)
        {
            return NotFound(ApiResponse<FarmDto>.ErrorResponse("Farm not found."));
        }
        return Ok(ApiResponse<FarmDto>.SuccessResponse(result));
    }

    [HttpGet("{id:guid}/statistics")]
    public async Task<ActionResult<ApiResponse<FarmStatisticsDto>>> GetStatistics(Guid id)
    {
        var result = await Mediator.Send(new GetFarmStatisticsQuery(CurrentUserId, id));
        if (result == null)
        {
            return NotFound(ApiResponse<FarmStatisticsDto>.ErrorResponse("Statistics not found for this farm."));
        }
        return Ok(ApiResponse<FarmStatisticsDto>.SuccessResponse(result));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<FarmDto>>> Create([FromBody] CreateFarmRequest request)
    {
        var command = new CreateFarmCommand(
            CurrentUserId,
            request.Name,
            request.Location,
            request.Municipality,
            request.Department,
            request.TotalHectares,
            request.Latitude,
            request.Longitude
        );

        var result = await Mediator.Send(command);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, ApiResponse<FarmDto>.SuccessResponse(result, "Farm created successfully."));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ApiResponse<FarmDto>>> Update(Guid id, [FromBody] UpdateFarmRequest request)
    {
        var command = new UpdateFarmCommand(
            id,
            request.Name,
            request.Location,
            request.Municipality,
            request.Department,
            request.TotalHectares,
            request.Latitude,
            request.Longitude
        );

        var result = await Mediator.Send(command);
        if (result == null)
        {
            return NotFound(ApiResponse<FarmDto>.ErrorResponse("Farm not found."));
        }
        return Ok(ApiResponse<FarmDto>.SuccessResponse(result, "Farm updated successfully."));
    }

    [HttpDelete("{id:guid}")]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(Guid id)
    {
        var result = await Mediator.Send(new DeleteFarmCommand(id));
        if (!result)
        {
            return NotFound(ApiResponse<bool>.ErrorResponse("Farm not found."));
        }
        return Ok(ApiResponse<bool>.SuccessResponse(true, "Farm deleted successfully."));
    }
}

public record CreateFarmRequest(
    string Name,
    string? Location,
    string? Municipality,
    string? Department,
    decimal? TotalHectares,
    decimal? Latitude,
    decimal? Longitude
);

public record UpdateFarmRequest(
    string Name,
    string? Location,
    string? Municipality,
    string? Department,
    decimal? TotalHectares,
    decimal? Latitude,
    decimal? Longitude
);
