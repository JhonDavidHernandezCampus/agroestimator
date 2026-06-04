using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using AgroEstimador.Application.DTOs;
using AgroEstimador.Application.Users.Commands;
using AgroEstimador.Application.Users.Queries;
using AgroEstimador.Shared;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AgroEstimador.Api.Controllers;

[Authorize(Roles = "admin")]
public class UsersController : ApiControllerBase
{
    [HttpGet]
    public async Task<ActionResult<ApiResponse<IEnumerable<UserDto>>>> GetAll()
    {
        var result = await Mediator.Send(new GetUsersQuery());
        return Ok(ApiResponse<IEnumerable<UserDto>>.SuccessResponse(result));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ApiResponse<UserDto>>> GetById(Guid id)
    {
        var result = await Mediator.Send(new GetUserByIdQuery(id));
        if (result == null)
        {
            return NotFound(ApiResponse<UserDto>.ErrorResponse("User not found."));
        }
        return Ok(ApiResponse<UserDto>.SuccessResponse(result));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<UserDto>>> Create([FromBody] CreateUserAdminCommand command)
    {
        var result = await Mediator.Send(command);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, ApiResponse<UserDto>.SuccessResponse(result, "User created successfully."));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ApiResponse<UserDto>>> Update(Guid id, [FromBody] UpdateUserCommand command)
    {
        if (id != command.Id)
        {
            return BadRequest(ApiResponse<UserDto>.ErrorResponse("Route ID does not match body ID."));
        }

        var result = await Mediator.Send(command);
        if (result == null)
        {
            return NotFound(ApiResponse<UserDto>.ErrorResponse("User not found."));
        }
        return Ok(ApiResponse<UserDto>.SuccessResponse(result, "User updated successfully."));
    }

    [HttpDelete("{id:guid}")]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(Guid id)
    {
        var result = await Mediator.Send(new DeleteUserCommand(id));
        if (!result)
        {
            return NotFound(ApiResponse<bool>.ErrorResponse("User not found."));
        }
        return Ok(ApiResponse<bool>.SuccessResponse(true, "User deleted successfully."));
    }
}
