using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using AgroEstimador.Application.DTOs;
using AgroEstimador.Application.Lots.Commands;
using AgroEstimador.Application.Lots.Queries;
using AgroEstimador.Shared;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AgroEstimador.Api.Controllers;

[Authorize]
public class LotsController : ApiControllerBase
{
    [HttpGet]
    public async Task<ActionResult<ApiResponse<IEnumerable<LotDto>>>> GetAll([FromQuery] Guid farmId)
    {
        if (farmId == Guid.Empty)
        {
            return BadRequest(ApiResponse<IEnumerable<LotDto>>.ErrorResponse("farmId query parameter is required."));
        }

        var result = await Mediator.Send(new GetLotsQuery(farmId));
        return Ok(ApiResponse<IEnumerable<LotDto>>.SuccessResponse(result));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ApiResponse<LotDto>>> GetById(Guid id)
    {
        var result = await Mediator.Send(new GetLotByIdQuery(id));
        if (result == null)
        {
            return NotFound(ApiResponse<LotDto>.ErrorResponse("Lot not found."));
        }
        return Ok(ApiResponse<LotDto>.SuccessResponse(result));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<LotDto>>> Create([FromBody] CreateLotCommand command)
    {
        var result = await Mediator.Send(command);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, ApiResponse<LotDto>.SuccessResponse(result, "Lot created successfully."));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ApiResponse<LotDto>>> Update(Guid id, [FromBody] UpdateLotCommand command)
    {
        if (id != command.Id)
        {
            return BadRequest(ApiResponse<LotDto>.ErrorResponse("Route ID does not match body ID."));
        }

        var result = await Mediator.Send(command);
        if (result == null)
        {
            return NotFound(ApiResponse<LotDto>.ErrorResponse("Lot not found."));
        }
        return Ok(ApiResponse<LotDto>.SuccessResponse(result, "Lot updated successfully."));
    }

    [HttpDelete("{id:guid}")]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(Guid id)
    {
        var result = await Mediator.Send(new DeleteLotCommand(id));
        if (!result)
        {
            return NotFound(ApiResponse<bool>.ErrorResponse("Lot not found."));
        }
        return Ok(ApiResponse<bool>.SuccessResponse(true, "Lot deleted successfully."));
    }
}
