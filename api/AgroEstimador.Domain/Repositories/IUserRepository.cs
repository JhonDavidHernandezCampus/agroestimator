using System;
using System.Threading.Tasks;
using AgroEstimador.Domain.Entities;

namespace AgroEstimador.Domain.Repositories;

public interface IUserRepository : IRepository<User>
{
    Task<User?> GetByEmailAsync(string email);
    Task<User?> GetWithRolesByEmailAsync(string email);
    Task<User?> GetWithRolesByIdAsync(Guid id);
}
