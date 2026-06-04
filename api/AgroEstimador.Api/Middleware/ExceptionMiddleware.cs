using System;
using System.Net;
using System.Text.Json;
using System.Threading.Tasks;
using AgroEstimador.Application.Common.Exceptions;
using AgroEstimador.Shared;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace AgroEstimador.Api.Middleware;

public class ExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionMiddleware> _logger;
    private readonly IHostEnvironment _env;

    public ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger, IHostEnvironment env)
    {
        _next = next;
        _logger = logger;
        _env = env;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An unhandled exception occurred during request execution.");
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";
        var statusCode = HttpStatusCode.InternalServerError;
        object responseData = null!;
        string message = "An internal server error occurred.";

        if (exception is ValidationException valEx)
        {
            statusCode = HttpStatusCode.BadRequest;
            message = "Validation failed.";
            responseData = valEx.Errors; // IDictionary<string, string[]>
        }
        else if (exception is UnauthorizedAccessException)
        {
            statusCode = HttpStatusCode.Unauthorized;
            message = "Unauthorized access.";
        }
        else
        {
            // For general exceptions, display stack trace in Development environment
            if (_env.IsDevelopment())
            {
                message = exception.Message;
                responseData = exception.StackTrace ?? string.Empty;
            }
        }

        context.Response.StatusCode = (int)statusCode;

        var apiResponse = new ApiResponse<object>
        {
            Success = false,
            Message = message,
            Data = responseData
        };

        var options = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
        var jsonResponse = JsonSerializer.Serialize(apiResponse, options);

        await context.Response.WriteAsync(jsonResponse);
    }
}
