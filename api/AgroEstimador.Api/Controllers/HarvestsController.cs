using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using AgroEstimador.Application.DTOs;
using AgroEstimador.Application.Harvests.Commands;
using AgroEstimador.Application.Harvests.Queries;
using AgroEstimador.Shared;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AgroEstimador.Api.Controllers;

[Authorize]
public class HarvestsController : ApiControllerBase
{
    [HttpGet]
    public async Task<ActionResult<ApiResponse<IEnumerable<HarvestDto>>>> GetAll(
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate,
        [FromQuery] string? farmName,
        [FromQuery] string? lotName,
        [FromQuery] string? productName,
        [FromQuery] string? status,
        [FromQuery] int page = 1,
        [FromQuery] int limit = 50)
    {
        var query = new GetHarvestsQuery(startDate, endDate, farmName, lotName, productName, status, page, limit);
        var result = await Mediator.Send(query);
        return Ok(ApiResponse<IEnumerable<HarvestDto>>.SuccessResponse(result));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ApiResponse<HarvestDto>>> GetById(Guid id)
    {
        var result = await Mediator.Send(new GetHarvestByIdQuery(id));
        if (result == null)
        {
            return NotFound(ApiResponse<HarvestDto>.ErrorResponse("Harvest log not found."));
        }
        return Ok(ApiResponse<HarvestDto>.SuccessResponse(result));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<HarvestDto>>> Create([FromBody] CreateHarvestRequest request)
    {
        var command = new CreateHarvestCommand(
            CurrentUserId,
            request.Date,
            request.FarmName,
            request.Lot,
            request.Product,
            request.Vehicle,
            request.Quantity,
            request.Samples,
            request.PricePerKg,
            request.DeviceId,
            true, // IsSynced is true when uploaded directly
            request.HarvestId
        );

        var result = await Mediator.Send(command);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, ApiResponse<HarvestDto>.SuccessResponse(result, "Harvest logged and calculated successfully."));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ApiResponse<HarvestDto>>> Update(Guid id, [FromBody] UpdateHarvestRequest request)
    {
        var command = new UpdateHarvestCommand(
            id,
            request.Lot,
            request.Quantity,
            request.Samples,
            request.PricePerKg
        );

        var result = await Mediator.Send(command);
        if (result == null)
        {
            return NotFound(ApiResponse<HarvestDto>.ErrorResponse("Harvest log not found."));
        }
        return Ok(ApiResponse<HarvestDto>.SuccessResponse(result, "Harvest log updated and recalculated successfully."));
    }

    [HttpDelete("{id:guid}")]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(Guid id)
    {
        var result = await Mediator.Send(new DeleteHarvestCommand(id));
        if (!result)
        {
            return NotFound(ApiResponse<bool>.ErrorResponse("Harvest log not found."));
        }
        return Ok(ApiResponse<bool>.SuccessResponse(true, "Harvest log deleted successfully."));
    }
}

public record CreateHarvestRequest(
    DateTime Date,
    string FarmName,
    string Lot,
    string Product,
    string Vehicle,
    int Quantity,
    List<HarvestSampleDto> Samples,
    decimal? PricePerKg,
    string? DeviceId = null,
    Guid? HarvestId = null
);

public record UpdateHarvestRequest(
    string? Lot,
    int? Quantity,
    List<HarvestSampleDto>? Samples,
    decimal? PricePerKg
);
