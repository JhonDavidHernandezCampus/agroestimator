using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using AgroEstimador.Domain.Entities;

namespace AgroEstimador.Domain.Repositories;

public interface ISyncQueueRepository : IRepository<SyncQueue>
{
    Task<IEnumerable<SyncQueue>> GetPendingItemsAsync(Guid userId);
    Task<IEnumerable<SyncQueue>> GetPendingItemsByDeviceAsync(string deviceId);
}
