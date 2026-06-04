using System;

namespace AgroEstimador.Domain.Entities;

public class SyncConflict
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid SyncQueueId { get; set; }
    public string EntityType { get; set; } = string.Empty;
    public Guid EntityId { get; set; }
    public string ClientData { get; set; } = string.Empty; // JSONB stored as string
    public string ServerData { get; set; } = string.Empty; // JSONB stored as string
    public string? Resolution { get; set; } // client_wins, server_wins, manual, merged
    public Guid? ResolvedBy { get; set; }
    public DateTime? ResolvedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual SyncQueue SyncQueue { get; set; } = null!;
    public virtual User? Resolver { get; set; }
}
