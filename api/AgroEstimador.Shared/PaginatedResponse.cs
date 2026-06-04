using System;
using System.Collections.Generic;

namespace AgroEstimador.Shared;

public class PaginatedResponse<T>
{
    public IEnumerable<T> Data { get; set; } = new List<T>();
    public int Total { get; set; }
    public int Page { get; set; }
    public int Limit { get; set; }
    public int TotalPages => (int)Math.Ceiling((double)Total / Limit);

    public PaginatedResponse()
    {
    }

    public PaginatedResponse(IEnumerable<T> data, int total, int page, int limit)
    {
        Data = data;
        Total = total;
        Page = page;
        Limit = limit;
    }
}
