using System;
using System.Collections.Generic;

namespace AgroEstimador.Application.DTOs;

public class SyncUploadRequest
{
    public string DeviceId { get; set; } = string.Empty;
    public List<SyncQueueItemDto> Items { get; set; } = new();
}

public class SyncQueueItemDto
{
    public Guid Id { get; set; }
    public string EntityType { get; set; } = string.Empty; // Harvest, Vehicle, Farm, etc.
    public Guid EntityId { get; set; }
    public string Operation { get; set; } = string.Empty; // INSERT, UPDATE, DELETE
    public string Payload { get; set; } = string.Empty; // JSON String representing the entity
    public DateTime ClientTimestamp { get; set; }
}

public class SyncConflictDto
{
    public Guid Id { get; set; }
    public Guid SyncQueueId { get; set; }
    public string EntityType { get; set; } = string.Empty;
    public Guid EntityId { get; set; }
    public string ClientData { get; set; } = string.Empty; // JSON
    public string ServerData { get; set; } = string.Empty; // JSON
    public string? Resolution { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class ResolveConflictRequest
{
    public string Resolution { get; set; } = string.Empty; // client_wins, server_wins, manual
    public string? MergedData { get; set; } // JSON (used if resolution is manual)
}

public class SyncResponse
{
    public int ProcessedCount { get; set; }
    public int ConflictCount { get; set; }
    public List<Guid> SuccessfullySyncedIds { get; set; } = new();
    public List<Guid> ConflictedQueueIds { get; set; } = new();
}
