using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using AgroEstimador.Application.DTOs;
using AgroEstimador.Domain.Repositories;
using AutoMapper;
using MediatR;

namespace AgroEstimador.Application.Users.Queries;

public record GetUsersQuery : IRequest<IEnumerable<UserDto>>;

public record GetUserByIdQuery(Guid Id) : IRequest<UserDto?>;

public class UserQueriesHandler :
    IRequestHandler<GetUsersQuery, IEnumerable<UserDto>>,
    IRequestHandler<GetUserByIdQuery, UserDto?>
{
    private readonly IUserRepository _userRepository;
    private readonly IMapper _mapper;

    public UserQueriesHandler(IUserRepository userRepository, IMapper mapper)
    {
        _userRepository = userRepository;
        _mapper = mapper;
    }

    public async Task<IEnumerable<UserDto>> Handle(GetUsersQuery request, CancellationToken cancellationToken)
    {
        var users = await _userRepository.GetAllAsync();
        return _mapper.Map<IEnumerable<UserDto>>(users);
    }

    public async Task<UserDto?> Handle(GetUserByIdQuery request, CancellationToken cancellationToken)
    {
        var user = await _userRepository.GetWithRolesByIdAsync(request.Id);
        if (user == null) return null;

        return _mapper.Map<UserDto>(user);
    }
}
