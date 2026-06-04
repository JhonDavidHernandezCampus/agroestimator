using System;

namespace AgroEstimador.Domain.Entities;

public class AuditLog
{
    public long Id { get; set; }
    public string TableName { get; set; } = string.Empty;
    public Guid RecordId { get; set; }
    public string Action { get; set; } = string.Empty; // INSERT, UPDATE, DELETE
    public string? OldValues { get; set; } // JSONB stored as string
    public string? NewValues { get; set; } // JSONB stored as string
    public string[]? ChangedFields { get; set; }
    public Guid? UserId { get; set; }
    public string? IpAddress { get; set; } // INET mapped as string
    public string? UserAgent { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
