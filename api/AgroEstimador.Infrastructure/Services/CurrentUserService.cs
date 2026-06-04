using System;
using System.Security.Claims;
using AgroEstimador.Application.Common.Interfaces;
using Microsoft.AspNetCore.Http;

namespace AgroEstimador.Infrastructure.Services;

public class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public Guid? UserId
    {
        get
        {
            var userIdStr = _httpContextAccessor.HttpContext?.User?.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? _httpContextAccessor.HttpContext?.User?.FindFirstValue("id")
                ?? _httpContextAccessor.HttpContext?.User?.FindFirstValue("sub");

            if (Guid.TryParse(userIdStr, out var userId))
            {
                return userId;
            }

            return null;
        }
    }

    public string? Email => 
        _httpContextAccessor.HttpContext?.User?.FindFirstValue(ClaimTypes.Email)
        ?? _httpContextAccessor.HttpContext?.User?.FindFirstValue("email");

    public string? Role => 
        _httpContextAccessor.HttpContext?.User?.FindFirstValue(ClaimTypes.Role)
        ?? _httpContextAccessor.HttpContext?.User?.FindFirstValue("role");
}
