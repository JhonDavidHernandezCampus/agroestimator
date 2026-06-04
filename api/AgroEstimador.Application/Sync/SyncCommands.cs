using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using AgroEstimador.Application.DTOs;
using AgroEstimador.Application.Harvests.Commands;
using AgroEstimador.Domain.Entities;
using AgroEstimador.Domain.Repositories;
using MediatR;

namespace AgroEstimador.Application.Sync.Commands;

public record UploadSyncQueueCommand(Guid UserId, string DeviceId, List<SyncQueueItemDto> Items) : IRequest<SyncResponse>;

public record ResolveConflictCommand(Guid UserId, Guid ConflictId, string Resolution, string? MergedData) : IRequest<bool>;

public class SyncCommandsHandler :
    IRequestHandler<UploadSyncQueueCommand, SyncResponse>,
    IRequestHandler<ResolveConflictCommand, bool>
{
    private readonly IRepository<SyncQueue> _syncQueueRepository;
    private readonly IRepository<SyncConflict> _syncConflictRepository;
    private readonly IHarvestRepository _harvestRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMediator _mediator;

    public SyncCommandsHandler(
        IRepository<SyncQueue> syncQueueRepository,
        IRepository<SyncConflict> syncConflictRepository,
        IHarvestRepository harvestRepository,
        IUnitOfWork unitOfWork,
        IMediator mediator)
    {
        _syncQueueRepository = syncQueueRepository;
        _syncConflictRepository = syncConflictRepository;
        _harvestRepository = harvestRepository;
        _unitOfWork = unitOfWork;
        _mediator = mediator;
    }

    public async Task<SyncResponse> Handle(UploadSyncQueueCommand request, CancellationToken cancellationToken)
    {
        var response = new SyncResponse();

        foreach (var itemDto in request.Items)
        {
            // 1. Save item in queue
            var queueItem = new SyncQueue
            {
                Id = itemDto.Id,
                DeviceId = request.DeviceId,
                UserId = request.UserId,
                EntityType = itemDto.EntityType,
                EntityId = itemDto.EntityId,
                Operation = itemDto.Operation,
                Payload = itemDto.Payload,
                ClientTimestamp = itemDto.ClientTimestamp,
                Status = "pending"
            };

            await _syncQueueRepository.AddAsync(queueItem);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            // 2. Check for Conflict
            bool hasConflict = false;
            string serverDataJson = "{}";

            if (itemDto.EntityType.Equals("Harvest", StringComparison.OrdinalIgnoreCase))
            {
                var existingHarvest = await _harvestRepository.GetDetailsByIdAsync(itemDto.EntityId);
                if (existingHarvest != null)
                {
                    // Check if server version was updated after client's timestamp
                    if (existingHarvest.UpdatedAt > itemDto.ClientTimestamp)
                    {
                        hasConflict = true;
                        serverDataJson = JsonSerializer.Serialize(existingHarvest, new JsonSerializerOptions
                        {
                            ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles
                        });
                    }
                }
            }

            if (hasConflict)
            {
                // Register Conflict
                var conflict = new SyncConflict
                {
                    SyncQueueId = queueItem.Id,
                    EntityType = itemDto.EntityType,
                    EntityId = itemDto.EntityId,
                    ClientData = itemDto.Payload,
                    ServerData = serverDataJson,
                    CreatedAt = DateTime.UtcNow
                };

                queueItem.Status = "failed";
                queueItem.ErrorMessage = "Conflicto de concurrencia detectado.";
                _syncQueueRepository.Update(queueItem);

                await _syncConflictRepository.AddAsync(conflict);
                await _unitOfWork.SaveChangesAsync(cancellationToken);

                response.ConflictedQueueIds.Add(queueItem.Id);
                response.ConflictCount++;
            }
            else
            {
                // 3. Process operation
                try
                {
                    var success = await ProcessQueueItemAsync(request.UserId, queueItem, cancellationToken);
                    if (success)
                    {
                        queueItem.Status = "completed";
                        queueItem.ServerTimestamp = DateTime.UtcNow;
                        _syncQueueRepository.Update(queueItem);
                        await _unitOfWork.SaveChangesAsync(cancellationToken);

                        response.SuccessfullySyncedIds.Add(queueItem.Id);
                        response.ProcessedCount++;
                    }
                    else
                    {
                        queueItem.Status = "failed";
                        queueItem.ErrorMessage = "No se pudo aplicar la operación.";
                        _syncQueueRepository.Update(queueItem);
                        await _unitOfWork.SaveChangesAsync(cancellationToken);
                    }
                }
                catch (Exception ex)
                {
                    queueItem.Status = "failed";
                    queueItem.ErrorMessage = ex.Message;
                    _syncQueueRepository.Update(queueItem);
                    await _unitOfWork.SaveChangesAsync(cancellationToken);
                }
            }
        }

        return response;
    }

    private async Task<bool> ProcessQueueItemAsync(Guid userId, SyncQueue item, CancellationToken cancellationToken)
    {
        if (item.EntityType.Equals("Harvest", StringComparison.OrdinalIgnoreCase))
        {
            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            
            if (item.Operation.Equals("INSERT", StringComparison.OrdinalIgnoreCase))
            {
                var dto = JsonSerializer.Deserialize<CreateHarvestDto>(item.Payload, options);
                if (dto != null)
                {
                    // Dispatch Command
                    var command = new CreateHarvestCommand(
                        userId,
                        DateTime.Parse(dto.Date),
                        dto.FarmName,
                        dto.Lot,
                        dto.Product,
                        dto.Vehicle,
                        dto.Quantity,
                        dto.Samples,
                        dto.PricePerKg,
                        item.DeviceId,
                        true, // IsSynced = true on server
                        item.EntityId // Preserve client-generated Guid
                    );
                    await _mediator.Send(command, cancellationToken);
                    return true;
                }
            }
            else if (item.Operation.Equals("UPDATE", StringComparison.OrdinalIgnoreCase))
            {
                var dto = JsonSerializer.Deserialize<HarvestDto>(item.Payload, options);
                if (dto != null)
                {
                    var command = new UpdateHarvestCommand(
                        item.EntityId,
                        dto.Lot,
                        dto.Quantity,
                        dto.Samples,
                        dto.PricePerKg
                    );
                    await _mediator.Send(command, cancellationToken);
                    return true;
                }
            }
            else if (item.Operation.Equals("DELETE", StringComparison.OrdinalIgnoreCase))
            {
                var command = new DeleteHarvestCommand(item.EntityId);
                await _mediator.Send(command, cancellationToken);
                return true;
            }
        }

        return true;
    }

    public async Task<bool> Handle(ResolveConflictCommand request, CancellationToken cancellationToken)
    {
        var conflict = await _syncConflictRepository.GetByIdAsync(request.ConflictId);
        if (conflict == null || conflict.Resolution != null) return false;

        var queueItem = await _syncQueueRepository.GetByIdAsync(conflict.SyncQueueId);
        if (queueItem == null) return false;

        conflict.Resolution = request.Resolution;
        conflict.ResolvedBy = request.UserId;
        conflict.ResolvedAt = DateTime.UtcNow;
        _syncConflictRepository.Update(conflict);

        if (request.Resolution.Equals("client_wins", StringComparison.OrdinalIgnoreCase))
        {
            // Apply client data
            queueItem.Status = "pending";
            _syncQueueRepository.Update(queueItem);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
            
            // Re-process queue item
            await ProcessQueueItemAsync(request.UserId, queueItem, cancellationToken);
            
            queueItem.Status = "completed";
            queueItem.ServerTimestamp = DateTime.UtcNow;
            _syncQueueRepository.Update(queueItem);
        }
        else if (request.Resolution.Equals("server_wins", StringComparison.OrdinalIgnoreCase))
        {
            // Discard client change
            queueItem.Status = "completed";
            queueItem.ServerTimestamp = DateTime.UtcNow;
            _syncQueueRepository.Update(queueItem);
        }
        else if (request.Resolution.Equals("manual", StringComparison.OrdinalIgnoreCase) && !string.IsNullOrEmpty(request.MergedData))
        {
            // Apply merged data
            queueItem.Payload = request.MergedData;
            queueItem.Status = "pending";
            _syncQueueRepository.Update(queueItem);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            await ProcessQueueItemAsync(request.UserId, queueItem, cancellationToken);

            queueItem.Status = "completed";
            queueItem.ServerTimestamp = DateTime.UtcNow;
            _syncQueueRepository.Update(queueItem);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return true;
    }
}
