using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using AgroEstimador.Application.DTOs;
using AgroEstimador.Application.Sync.Commands;
using AgroEstimador.Shared;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AgroEstimador.Api.Controllers;

[Authorize]
[Route("api/sync")]
public class SyncController : ApiControllerBase
{
    [HttpPost]
    public async Task<ActionResult<ApiResponse<SyncResponse>>> UploadQueue([FromBody] SyncUploadRequestDto request)
    {
        var command = new UploadSyncQueueCommand(
            CurrentUserId,
            request.DeviceId,
            request.Items
        );

        var result = await Mediator.Send(command);
        return Ok(ApiResponse<SyncResponse>.SuccessResponse(result, "Sync queue uploaded and processed."));
    }

    [HttpPost("resolve")]
    public async Task<ActionResult<ApiResponse<bool>>> ResolveConflict([FromBody] ResolveConflictRequestDto request)
    {
        var command = new ResolveConflictCommand(
            CurrentUserId,
            request.ConflictId,
            request.Resolution,
            request.MergedData
        );

        var result = await Mediator.Send(command);
        if (!result)
        {
            return BadRequest(ApiResponse<bool>.ErrorResponse("Could not resolve conflict."));
        }
        return Ok(ApiResponse<bool>.SuccessResponse(true, "Conflict resolved successfully."));
    }
}

public class SyncUploadRequestDto
{
    public string DeviceId { get; set; } = string.Empty;
    public List<SyncQueueItemDto> Items { get; set; } = new();
}

public class ResolveConflictRequestDto
{
    public Guid ConflictId { get; set; }
    public string Resolution { get; set; } = string.Empty;
    public string? MergedData { get; set; }
}
