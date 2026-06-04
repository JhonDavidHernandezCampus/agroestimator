namespace AgroEstimador.Shared;

public class ApiResponse<T>
{
    public bool Success { get; set; }
    public T Data { get; set; } = default!;
    public string? Message { get; set; }

    public ApiResponse()
    {
    }

    public ApiResponse(T data, bool success = true, string? message = null)
    {
        Data = data;
        Success = success;
        Message = message;
    }

    public static ApiResponse<T> SuccessResponse(T data, string? message = null)
    {
        return new ApiResponse<T>(data, true, message);
    }

    public static ApiResponse<T> ErrorResponse(string message, T? data = default)
    {
        return new ApiResponse<T>(data!, false, message);
    }
}
