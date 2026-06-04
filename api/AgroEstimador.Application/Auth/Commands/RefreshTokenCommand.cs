using System.Threading;
using System.Threading.Tasks;
using AgroEstimador.Application.Common.Interfaces;
using AgroEstimador.Application.DTOs;
using MediatR;

namespace AgroEstimador.Application.Auth.Commands;

public record RefreshTokenCommand(string Token, string? DeviceId) : IRequest<AuthResponse?>;

public class RefreshTokenCommandHandler : IRequestHandler<RefreshTokenCommand, AuthResponse?>
{
    private readonly IIdentityService _identityService;

    public RefreshTokenCommandHandler(IIdentityService identityService)
    {
        _identityService = identityService;
    }

    public async Task<AuthResponse?> Handle(RefreshTokenCommand request, CancellationToken cancellationToken)
    {
        return await _identityService.RefreshTokenAsync(request.Token, request.DeviceId);
    }
}
