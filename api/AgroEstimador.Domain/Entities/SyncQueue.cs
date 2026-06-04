using System;

namespace AgroEstimador.Domain.Entities;

public class SyncQueue
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string DeviceId { get; set; } = string.Empty;
    public Guid UserId { get; set; }
    public string EntityType { get; set; } = string.Empty;
    public Guid EntityId { get; set; }
    public string Operation { get; set; } = string.Empty; // INSERT, UPDATE, DELETE
    public string Payload { get; set; } = string.Empty; // JSONB stored as string
    public string Status { get; set; } = "pending"; // pending, processing, completed, failed
    public short Attempts { get; set; } = 0;
    public string? ErrorMessage { get; set; }
    public DateTime ClientTimestamp { get; set; }
    public DateTime? ServerTimestamp { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual User User { get; set; } = null!;
}
