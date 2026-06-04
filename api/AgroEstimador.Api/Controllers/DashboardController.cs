using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using AgroEstimador.Application.Dashboard.Queries;
using AgroEstimador.Application.DTOs;
using AgroEstimador.Shared;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AgroEstimador.Api.Controllers;

[Authorize]
[Route("api/statistics")]
public class DashboardController : ApiControllerBase
{
    [HttpGet]
    public async Task<ActionResult<ApiResponse<StatisticsDto>>> GetStatistics()
    {
        var result = await Mediator.Send(new GetStatisticsQuery(CurrentUserId));
        return Ok(ApiResponse<StatisticsDto>.SuccessResponse(result));
    }

    [HttpGet("summary")]
    public async Task<ActionResult<ApiResponse<DashboardSummaryDto>>> GetSummary()
    {
        var result = await Mediator.Send(new GetDashboardSummaryQuery(CurrentUserId));
        return Ok(ApiResponse<DashboardSummaryDto>.SuccessResponse(result));
    }

    [HttpGet("monthly")]
    public async Task<ActionResult<ApiResponse<IEnumerable<MonthlyProductionDto>>>> GetMonthly()
    {
        var result = await Mediator.Send(new GetMonthlyProductionQuery(CurrentUserId));
        return Ok(ApiResponse<IEnumerable<MonthlyProductionDto>>.SuccessResponse(result));
    }

    [HttpGet("farms")]
    public async Task<ActionResult<ApiResponse<IEnumerable<FarmStatsDto>>>> GetFarms()
    {
        var result = await Mediator.Send(new GetFarmStatsQuery(CurrentUserId));
        return Ok(ApiResponse<IEnumerable<FarmStatsDto>>.SuccessResponse(result));
    }

    [HttpGet("products")]
    public async Task<ActionResult<ApiResponse<IEnumerable<ProductStatsDto>>>> GetProducts()
    {
        var result = await Mediator.Send(new GetProductStatsQuery());
        return Ok(ApiResponse<IEnumerable<ProductStatsDto>>.SuccessResponse(result));
    }

    [HttpGet("trends")]
    public async Task<ActionResult<ApiResponse<IEnumerable<TrendDto>>>> GetTrends()
    {
        var result = await Mediator.Send(new GetTrendsQuery(CurrentUserId));
        return Ok(ApiResponse<IEnumerable<TrendDto>>.SuccessResponse(result));
    }
}
