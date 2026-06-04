using System;
using System.Threading.Tasks;
using AgroEstimador.Application.Auth.Commands;
using AgroEstimador.Application.Auth.Queries;
using AgroEstimador.Application.DTOs;
using AgroEstimador.Shared;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace AgroEstimador.Api.Controllers;

[Route("api/auth")]
public class AuthController : ApiControllerBase
{
    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<AuthResponse>>> Login([FromBody] LoginRequest request)
    {
        var command = new LoginCommand(request.Email, request.Password);
        var result = await Mediator.Send(command);

        if (result == null)
        {
            return BadRequest(ApiResponse<AuthResponse>.ErrorResponse("Invalid email or password."));
        }

        SetRefreshTokenCookie(result.RefreshToken);

        // Remove refresh token from response body for security if desired, but we can keep it
        return Ok(ApiResponse<AuthResponse>.SuccessResponse(result, "Login successful."));
    }

    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<AuthResponse>>> Register([FromBody] RegisterRequest request)
    {
        var command = new RegisterCommand(request);
        var result = await Mediator.Send(command);

        if (result == null)
        {
            return BadRequest(ApiResponse<AuthResponse>.ErrorResponse("User with this email already exists."));
        }

        SetRefreshTokenCookie(result.RefreshToken);

        return Ok(ApiResponse<AuthResponse>.SuccessResponse(result, "Registration successful."));
    }

    [HttpPost("refresh-token")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<AuthResponse>>> RefreshToken([FromBody] RefreshTokenRequestDto? request)
    {
        var refreshToken = Request.Cookies["refreshToken"] ?? request?.RefreshToken;

        if (string.IsNullOrEmpty(refreshToken))
        {
            return BadRequest(ApiResponse<AuthResponse>.ErrorResponse("Refresh token is required."));
        }

        var command = new RefreshTokenCommand(refreshToken, request?.DeviceId);
        var result = await Mediator.Send(command);

        if (result == null)
        {
            return Unauthorized(ApiResponse<AuthResponse>.ErrorResponse("Invalid or expired refresh token."));
        }

        SetRefreshTokenCookie(result.RefreshToken);

        return Ok(ApiResponse<AuthResponse>.SuccessResponse(result, "Token refreshed successfully."));
    }

    [HttpPost("logout")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<bool>>> Logout([FromBody] RefreshTokenRequestDto? request)
    {
        var refreshToken = Request.Cookies["refreshToken"] ?? request?.RefreshToken;

        if (!string.IsNullOrEmpty(refreshToken))
        {
            await Mediator.Send(new LogoutCommand(refreshToken));
        }

        Response.Cookies.Delete("refreshToken");

        return Ok(ApiResponse<bool>.SuccessResponse(true, "Logged out successfully."));
    }

    [HttpGet("profile")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<UserDto>>> GetProfile()
    {
        var query = new GetProfileQuery(CurrentUserId);
        var result = await Mediator.Send(query);

        if (result == null)
        {
            return NotFound(ApiResponse<UserDto>.ErrorResponse("User profile not found."));
        }

        return Ok(ApiResponse<UserDto>.SuccessResponse(result));
    }

    private void SetRefreshTokenCookie(string refreshToken)
    {
        var cookieOptions = new CookieOptions
        {
            HttpOnly = true,
            Expires = DateTime.UtcNow.AddDays(7),
            Secure = true,
            SameSite = SameSiteMode.None // Allows cross-origin development calls
        };
        Response.Cookies.Append("refreshToken", refreshToken, cookieOptions);
    }
}

public class RefreshTokenRequestDto
{
    public string? RefreshToken { get; set; }
    public string? DeviceId { get; set; }
}
