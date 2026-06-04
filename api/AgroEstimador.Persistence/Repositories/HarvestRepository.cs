using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AgroEstimador.Domain.Entities;
using AgroEstimador.Domain.Repositories;
using Microsoft.EntityFrameworkCore;

namespace AgroEstimador.Persistence.Repositories;

public class HarvestRepository : Repository<Harvest>, IHarvestRepository
{
    public HarvestRepository(AgroEstimadorDbContext dbContext) : base(dbContext)
    {
    }

    public async Task<Harvest?> GetDetailsByIdAsync(Guid id)
    {
        return await DbSet
            .Include(h => h.Farm)
            .Include(h => h.Lot)
            .Include(h => h.Product)
            .Include(h => h.Vehicle)
            .Include(h => h.Calculation)
            .Include(h => h.Samples)
            .FirstOrDefaultAsync(h => h.Id == id);
    }

    public async Task<IEnumerable<Harvest>> GetFilteredHarvestsAsync(
        DateTime? startDate,
        DateTime? endDate,
        string? farmName,
        string? lotName,
        string? productName,
        string? status,
        int page,
        int limit)
    {
        var query = GetFilteredQuery(startDate, endDate, farmName, lotName, productName, status);

        return await query
            .Include(h => h.Farm)
            .Include(h => h.Lot)
            .Include(h => h.Product)
            .Include(h => h.Vehicle)
            .Include(h => h.Calculation)
            .Include(h => h.Samples)
            .OrderByDescending(h => h.HarvestDate)
            .ThenByDescending(h => h.CreatedAt)
            .Skip((page - 1) * limit)
            .Take(limit)
            .ToListAsync();
    }

    public async Task<int> GetFilteredHarvestsCountAsync(
        DateTime? startDate,
        DateTime? endDate,
        string? farmName,
        string? lotName,
        string? productName,
        string? status)
    {
        return await GetFilteredQuery(startDate, endDate, farmName, lotName, productName, status)
            .CountAsync();
    }

    private IQueryable<Harvest> GetFilteredQuery(
        DateTime? startDate,
        DateTime? endDate,
        string? farmName,
        string? lotName,
        string? productName,
        string? status)
    {
        var query = DbSet.AsQueryable();

        if (startDate.HasValue)
        {
            query = query.Where(h => h.HarvestDate >= startDate.Value);
        }

        if (endDate.HasValue)
        {
            query = query.Where(h => h.HarvestDate <= endDate.Value);
        }

        if (!string.IsNullOrEmpty(farmName))
        {
            query = query.Where(h => h.Farm.Name.ToLower().Contains(farmName.ToLower()));
        }

        if (!string.IsNullOrEmpty(lotName))
        {
            query = query.Where(h => h.Lot != null && h.Lot.Name.ToLower().Contains(lotName.ToLower()));
        }

        if (!string.IsNullOrEmpty(productName))
        {
            query = query.Where(h => h.Product.Name.ToLower().Contains(productName.ToLower()));
        }

        if (!string.IsNullOrEmpty(status))
        {
            query = query.Where(h => h.Status.ToLower() == status.ToLower());
        }

        return query;
    }
}
