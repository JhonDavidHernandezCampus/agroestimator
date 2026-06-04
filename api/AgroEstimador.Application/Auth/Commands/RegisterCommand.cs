using System.Threading;
using System.Threading.Tasks;
using AgroEstimador.Application.Common.Interfaces;
using AgroEstimador.Application.DTOs;
using MediatR;

namespace AgroEstimador.Application.Auth.Commands;

public record RegisterCommand(RegisterRequest Request) : IRequest<AuthResponse?>;

public class RegisterCommandHandler : IRequestHandler<RegisterCommand, AuthResponse?>
{
    private readonly IIdentityService _identityService;

    public RegisterCommandHandler(IIdentityService identityService)
    {
        _identityService = identityService;
    }

    public async Task<AuthResponse?> Handle(RegisterCommand request, CancellationToken cancellationToken)
    {
        return await _identityService.RegisterAsync(request.Request);
    }
}
