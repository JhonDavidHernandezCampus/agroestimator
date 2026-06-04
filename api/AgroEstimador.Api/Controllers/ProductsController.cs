using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using AgroEstimador.Application.DTOs;
using AgroEstimador.Application.Products.Commands;
using AgroEstimador.Application.Products.Queries;
using AgroEstimador.Shared;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AgroEstimador.Api.Controllers;

[Authorize]
public class ProductsController : ApiControllerBase
{
    [HttpGet]
    public async Task<ActionResult<ApiResponse<IEnumerable<ProductDto>>>> GetAll()
    {
        var result = await Mediator.Send(new GetProductsQuery());
        return Ok(ApiResponse<IEnumerable<ProductDto>>.SuccessResponse(result));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ApiResponse<ProductDto>>> GetById(Guid id)
    {
        var result = await Mediator.Send(new GetProductByIdQuery(id));
        if (result == null)
        {
            return NotFound(ApiResponse<ProductDto>.ErrorResponse("Product not found."));
        }
        return Ok(ApiResponse<ProductDto>.SuccessResponse(result));
    }

    [HttpGet("{id:guid}/prices")]
    public async Task<ActionResult<ApiResponse<IEnumerable<ProductPriceHistoryDto>>>> GetPrices(Guid id)
    {
        var result = await Mediator.Send(new GetProductPricesQuery(id));
        return Ok(ApiResponse<IEnumerable<ProductPriceHistoryDto>>.SuccessResponse(result));
    }

    [HttpPost]
    [Authorize(Roles = "admin")]
    public async Task<ActionResult<ApiResponse<ProductDto>>> Create([FromBody] CreateProductCommand command)
    {
        var result = await Mediator.Send(command);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, ApiResponse<ProductDto>.SuccessResponse(result, "Product created successfully."));
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "admin")]
    public async Task<ActionResult<ApiResponse<ProductDto>>> Update(Guid id, [FromBody] UpdateProductCommand command)
    {
        if (id != command.Id)
        {
            return BadRequest(ApiResponse<ProductDto>.ErrorResponse("Route ID does not match body ID."));
        }

        var result = await Mediator.Send(command);
        if (result == null)
        {
            return NotFound(ApiResponse<ProductDto>.ErrorResponse("Product not found."));
        }
        return Ok(ApiResponse<ProductDto>.SuccessResponse(result, "Product updated successfully."));
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "admin")]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(Guid id)
    {
        var result = await Mediator.Send(new DeleteProductCommand(id));
        if (!result)
        {
            return NotFound(ApiResponse<bool>.ErrorResponse("Product not found."));
        }
        return Ok(ApiResponse<bool>.SuccessResponse(true, "Product deleted successfully."));
    }

    [HttpPost("{id:guid}/prices")]
    [Authorize(Roles = "admin")]
    public async Task<ActionResult<ApiResponse<ProductPriceHistoryDto>>> AddPrice(Guid id, [FromBody] CreateProductPriceRequest request)
    {
        var command = new CreateProductPriceCommand(
            id,
            request.PricePerKg,
            request.EffectiveDate,
            request.Source,
            CurrentUserId
        );

        var result = await Mediator.Send(command);
        if (result == null)
        {
            return NotFound(ApiResponse<ProductPriceHistoryDto>.ErrorResponse("Product not found."));
        }
        return Ok(ApiResponse<ProductPriceHistoryDto>.SuccessResponse(result, "Product price updated successfully."));
    }
}

public record CreateProductPriceRequest(
    decimal PricePerKg,
    DateTime EffectiveDate,
    string? Source
);
