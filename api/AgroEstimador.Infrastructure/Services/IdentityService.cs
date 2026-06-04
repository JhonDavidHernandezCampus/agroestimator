using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using AgroEstimador.Application.Common.Interfaces;
using AgroEstimador.Application.DTOs;
using AgroEstimador.Domain.Entities;
using AgroEstimador.Domain.Repositories;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace AgroEstimador.Infrastructure.Services;

public class IdentityService : IIdentityService
{
    private readonly IUserRepository _userRepository;
    private readonly IRepository<Role> _roleRepository;
    private readonly IRepository<UserRole> _userRoleRepository;
    private readonly IRepository<RefreshToken> _refreshTokenRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IConfiguration _configuration;

    public IdentityService(
        IUserRepository userRepository,
        IRepository<Role> roleRepository,
        IRepository<UserRole> userRoleRepository,
        IRepository<RefreshToken> refreshTokenRepository,
        IPasswordHasher passwordHasher,
        IUnitOfWork unitOfWork,
        IConfiguration configuration)
    {
        _userRepository = userRepository;
        _roleRepository = roleRepository;
        _userRoleRepository = userRoleRepository;
        _refreshTokenRepository = refreshTokenRepository;
        _passwordHasher = passwordHasher;
        _unitOfWork = unitOfWork;
        _configuration = configuration;
    }

    public async Task<AuthResponse?> LoginAsync(string email, string password)
    {
        var user = await _userRepository.GetWithRolesByEmailAsync(email);
        if (user == null || !user.IsActive)
        {
            return null;
        }

        if (!_passwordHasher.VerifyPassword(password, user.PasswordHash))
        {
            return null;
        }

        // Update last login
        user.LastLoginAt = DateTime.UtcNow;
        _userRepository.Update(user);

        var token = GenerateJwtToken(user);
        var refreshToken = await GenerateRefreshTokenAsync(user.Id, null);

        await _unitOfWork.SaveChangesAsync();

        return new AuthResponse
        {
            Id = user.Id.ToString(),
            Name = $"{user.FirstName} {user.LastName}",
            Email = user.Email,
            Role = user.UserRoles.FirstOrDefault()?.Role.Name ?? "producer",
            Token = token,
            RefreshToken = refreshToken.Token
        };
    }

    public async Task<AuthResponse?> RegisterAsync(RegisterRequest request)
    {
        var existingUser = await _userRepository.GetByEmailAsync(request.Email);
        if (existingUser != null)
        {
            return null;
        }

        var user = new User
        {
            FirstName = request.FirstName,
            LastName = request.LastName,
            Email = request.Email,
            PasswordHash = _passwordHasher.HashPassword(request.Password),
            Phone = request.Phone,
            DocumentNumber = request.DocumentNumber,
            IsActive = true
        };

        await _userRepository.AddAsync(user);

        // Assign default role (producer)
        var roles = await _roleRepository.FindAsync(r => r.Name.ToLower() == "producer");
        var role = roles.FirstOrDefault();
        if (role == null)
        {
            role = new Role
            {
                Name = "producer",
                Description = "Default Producer Role",
                IsActive = true
            };
            await _roleRepository.AddAsync(role);
        }

        var userRole = new UserRole
        {
            UserId = user.Id,
            RoleId = role.Id
        };
        await _userRoleRepository.AddAsync(userRole);

        var token = GenerateJwtToken(user, role.Name);
        var refreshToken = await GenerateRefreshTokenAsync(user.Id, null);

        await _unitOfWork.SaveChangesAsync();

        return new AuthResponse
        {
            Id = user.Id.ToString(),
            Name = $"{user.FirstName} {user.LastName}",
            Email = user.Email,
            Role = role.Name,
            Token = token,
            RefreshToken = refreshToken.Token
        };
    }

    public async Task<AuthResponse?> RefreshTokenAsync(string token, string? deviceId)
    {
        var refreshTokens = await _refreshTokenRepository.FindAsync(t => t.Token == token && !t.IsRevoked && t.ExpiresAt > DateTime.UtcNow);
        var refreshToken = refreshTokens.FirstOrDefault();
        if (refreshToken == null)
        {
            return null;
        }

        // Revoke the current refresh token (token rotation)
        refreshToken.IsRevoked = true;
        refreshToken.RevokedAt = DateTime.UtcNow;
        _refreshTokenRepository.Update(refreshToken);

        var user = await _userRepository.GetWithRolesByIdAsync(refreshToken.UserId);
        if (user == null || !user.IsActive)
        {
            return null;
        }

        // Generate new tokens
        var newJwt = GenerateJwtToken(user);
        var newRefreshToken = await GenerateRefreshTokenAsync(user.Id, deviceId);

        await _unitOfWork.SaveChangesAsync();

        return new AuthResponse
        {
            Id = user.Id.ToString(),
            Name = $"{user.FirstName} {user.LastName}",
            Email = user.Email,
            Role = user.UserRoles.FirstOrDefault()?.Role.Name ?? "producer",
            Token = newJwt,
            RefreshToken = newRefreshToken.Token
        };
    }

    public async Task<bool> RevokeTokenAsync(string token)
    {
        var refreshTokens = await _refreshTokenRepository.FindAsync(t => t.Token == token);
        var refreshToken = refreshTokens.FirstOrDefault();
        if (refreshToken == null || refreshToken.IsRevoked)
        {
            return false;
        }

        refreshToken.IsRevoked = true;
        refreshToken.RevokedAt = DateTime.UtcNow;
        _refreshTokenRepository.Update(refreshToken);

        await _unitOfWork.SaveChangesAsync();
        return true;
    }

    public async Task<UserDto?> GetProfileAsync(Guid userId)
    {
        var user = await _userRepository.GetWithRolesByIdAsync(userId);
        if (user == null)
        {
            return null;
        }

        return new UserDto
        {
            Id = user.Id,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Email = user.Email,
            Phone = user.Phone,
            DocumentNumber = user.DocumentNumber,
            AvatarUrl = user.AvatarUrl,
            IsActive = user.IsActive,
            Role = user.UserRoles.FirstOrDefault()?.Role.Name ?? "producer",
            CreatedAt = user.CreatedAt
        };
    }

    private string GenerateJwtToken(User user, string? overrideRole = null)
    {
        var tokenHandler = new JwtSecurityTokenHandler();
        var keyString = _configuration["Jwt:Key"] ?? "super_secret_key_that_is_long_enough_32_bytes_1234567890";
        var key = Encoding.UTF8.GetBytes(keyString);

        var roleName = overrideRole ?? user.UserRoles.FirstOrDefault()?.Role.Name ?? "producer";

        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, roleName),
            new Claim(ClaimTypes.Name, $"{user.FirstName} {user.LastName}")
        };

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddMinutes(double.Parse(_configuration["Jwt:ExpiryInMinutes"] ?? "60")),
            Issuer = _configuration["Jwt:Issuer"],
            Audience = _configuration["Jwt:Audience"],
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };

        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }

    private async Task<RefreshToken> GenerateRefreshTokenAsync(Guid userId, string? deviceId)
    {
        var tokenBytes = new byte[64];
        using (var rng = RandomNumberGenerator.Create())
        {
            rng.GetBytes(tokenBytes);
        }
        var tokenString = Convert.ToBase64String(tokenBytes);

        var refreshToken = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Token = tokenString,
            DeviceId = deviceId,
            ExpiresAt = DateTime.UtcNow.AddDays(double.Parse(_configuration["Jwt:RefreshTokenExpiryInDays"] ?? "7")),
            IsRevoked = false,
            CreatedAt = DateTime.UtcNow
        };

        await _refreshTokenRepository.AddAsync(refreshToken);
        return refreshToken;
    }
}
