using System.Threading;
using System.Threading.Tasks;
using AgroEstimador.Application.Common.Interfaces;
using MediatR;

namespace AgroEstimador.Application.Auth.Commands;

public record LogoutCommand(string Token) : IRequest<bool>;

public class LogoutCommandHandler : IRequestHandler<LogoutCommand, bool>
{
    private readonly IIdentityService _identityService;

    public LogoutCommandHandler(IIdentityService identityService)
    {
        _identityService = identityService;
    }

    public async Task<bool> Handle(LogoutCommand request, CancellationToken cancellationToken)
    {
        return await _identityService.RevokeTokenAsync(request.Token);
    }
}
