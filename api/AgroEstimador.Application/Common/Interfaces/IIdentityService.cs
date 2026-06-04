using System;
using System.Threading.Tasks;
using AgroEstimador.Application.DTOs;

namespace AgroEstimador.Application.Common.Interfaces;

public interface IIdentityService
{
    Task<AuthResponse?> LoginAsync(string email, string password);
    Task<AuthResponse?> RegisterAsync(RegisterRequest request);
    Task<AuthResponse?> RefreshTokenAsync(string token, string? deviceId);
    Task<bool> RevokeTokenAsync(string token);
    Task<UserDto?> GetProfileAsync(Guid userId);
}
