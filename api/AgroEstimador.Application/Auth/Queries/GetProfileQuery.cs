using System;
using System.Threading;
using System.Threading.Tasks;
using AgroEstimador.Application.Common.Interfaces;
using AgroEstimador.Application.DTOs;
using MediatR;

namespace AgroEstimador.Application.Auth.Queries;

public record GetProfileQuery(Guid UserId) : IRequest<UserDto?>;

public class GetProfileQueryHandler : IRequestHandler<GetProfileQuery, UserDto?>
{
    private readonly IIdentityService _identityService;

    public GetProfileQueryHandler(IIdentityService identityService)
    {
        _identityService = identityService;
    }

    public async Task<UserDto?> Handle(GetProfileQuery request, CancellationToken cancellationToken)
    {
        return await _identityService.GetProfileAsync(request.UserId);
    }
}
