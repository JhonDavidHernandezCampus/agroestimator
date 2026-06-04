using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AgroEstimador.Domain.Entities;
using AgroEstimador.Domain.Repositories;
using Microsoft.EntityFrameworkCore;

namespace AgroEstimador.Persistence.Repositories;

public class SyncQueueRepository : Repository<SyncQueue>, ISyncQueueRepository
{
    public SyncQueueRepository(AgroEstimadorDbContext dbContext) : base(dbContext)
    {
    }

    public async Task<IEnumerable<SyncQueue>> GetPendingItemsAsync(Guid userId)
    {
        return await DbSet
            .Where(q => q.UserId == userId && (q.Status == "pending" || q.Status == "failed"))
            .OrderBy(q => q.CreatedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<SyncQueue>> GetPendingItemsByDeviceAsync(string deviceId)
    {
        return await DbSet
            .Where(q => q.DeviceId == deviceId && (q.Status == "pending" || q.Status == "failed"))
            .OrderBy(q => q.CreatedAt)
            .ToListAsync();
    }
}
