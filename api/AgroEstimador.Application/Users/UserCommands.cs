using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AgroEstimador.Application.Common.Interfaces;
using AgroEstimador.Application.DTOs;
using AgroEstimador.Domain.Entities;
using AgroEstimador.Domain.Repositories;
using AutoMapper;
using MediatR;

namespace AgroEstimador.Application.Users.Commands;

public record CreateUserAdminCommand(
    string FirstName,
    string LastName,
    string Email,
    string Password,
    string? Phone,
    string? DocumentNumber,
    string RoleName) : IRequest<UserDto>;

public record UpdateUserCommand(
    Guid Id,
    string FirstName,
    string LastName,
    string Email,
    string? Phone,
    string? DocumentNumber,
    bool IsActive,
    string? RoleName) : IRequest<UserDto?>;

public record DeleteUserCommand(Guid Id) : IRequest<bool>;

public class UserCommandsHandler :
    IRequestHandler<CreateUserAdminCommand, UserDto>,
    IRequestHandler<UpdateUserCommand, UserDto?>,
    IRequestHandler<DeleteUserCommand, bool>
{
    private readonly IUserRepository _userRepository;
    private readonly IRepository<Role> _roleRepository;
    private readonly IRepository<UserRole> _userRoleRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public UserCommandsHandler(
        IUserRepository userRepository,
        IRepository<Role> roleRepository,
        IRepository<UserRole> userRoleRepository,
        IPasswordHasher passwordHasher,
        IUnitOfWork unitOfWork,
        IMapper mapper)
    {
        _userRepository = userRepository;
        _roleRepository = roleRepository;
        _userRoleRepository = userRoleRepository;
        _passwordHasher = passwordHasher;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<UserDto> Handle(CreateUserAdminCommand request, CancellationToken cancellationToken)
    {
        var existing = await _userRepository.GetByEmailAsync(request.Email);
        if (existing != null)
        {
            throw new Exception("El correo electrónico ya está registrado.");
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

        // Find and assign role
        var roles = await _roleRepository.FindAsync(r => r.Name.ToLower() == request.RoleName.ToLower());
        var role = roles.FirstOrDefault();
        if (role == null)
        {
            throw new Exception($"El rol '{request.RoleName}' no existe.");
        }

        var userRole = new UserRole
        {
            UserId = user.Id,
            RoleId = role.Id
        };
        await _userRoleRepository.AddAsync(userRole);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var dto = _mapper.Map<UserDto>(user);
        dto.Role = role.Name;
        return dto;
    }

    public async Task<UserDto?> Handle(UpdateUserCommand request, CancellationToken cancellationToken)
    {
        var user = await _userRepository.GetWithRolesByIdAsync(request.Id);
        if (user == null) return null;

        user.FirstName = request.FirstName;
        user.LastName = request.LastName;
        user.Email = request.Email;
        user.Phone = request.Phone;
        user.DocumentNumber = request.DocumentNumber;
        user.IsActive = request.IsActive;
        user.UpdatedAt = DateTime.UtcNow;

        _userRepository.Update(user);

        // If role name is changed, update role
        if (!string.IsNullOrEmpty(request.RoleName))
        {
            var currentRole = user.UserRoles.FirstOrDefault();
            if (currentRole == null || currentRole.Role.Name.ToLower() != request.RoleName.ToLower())
            {
                // Remove old roles
                foreach (var ur in user.UserRoles)
                {
                    _userRoleRepository.Delete(ur);
                }

                // Add new role
                var roles = await _roleRepository.FindAsync(r => r.Name.ToLower() == request.RoleName.ToLower());
                var role = roles.FirstOrDefault();
                if (role != null)
                {
                    var newUserRole = new UserRole
                    {
                        UserId = user.Id,
                        RoleId = role.Id
                    };
                    await _userRoleRepository.AddAsync(newUserRole);
                }
            }
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var updatedUser = await _userRepository.GetWithRolesByIdAsync(user.Id);
        return _mapper.Map<UserDto>(updatedUser);
    }

    public async Task<bool> Handle(DeleteUserCommand request, CancellationToken cancellationToken)
    {
        var user = await _userRepository.GetByIdAsync(request.Id);
        if (user == null) return false;

        _userRepository.Delete(user);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return true;
    }
}
