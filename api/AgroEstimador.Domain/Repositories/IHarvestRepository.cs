using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using AgroEstimador.Domain.Entities;

namespace AgroEstimador.Domain.Repositories;

public interface IHarvestRepository : IRepository<Harvest>
{
    Task<Harvest?> GetDetailsByIdAsync(Guid id);
    Task<IEnumerable<Harvest>> GetFilteredHarvestsAsync(
        DateTime? startDate,
        DateTime? endDate,
        string? farmName,
        string? lotName,
        string? productName,
        string? status,
        int page,
        int limit);
    
    Task<int> GetFilteredHarvestsCountAsync(
        DateTime? startDate,
        DateTime? endDate,
        string? farmName,
        string? lotName,
        string? productName,
        string? status);
}
