using System.Text.Json;
using Npgsql;

namespace Fleurea.Api.Errors;

/// <summary>
/// Central error handler. Every response body on a non-2xx result has the
/// shape { code, message, fieldErrors? } that app/src/lib/api/client.ts's
/// liveFetch() already parses (body.code, body.message, body.fieldErrors).
/// </summary>
public class ApiExceptionMiddleware(RequestDelegate next, ILogger<ApiExceptionMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (ApiException ex)
        {
            await WriteAsync(context, ex.Status, ex.Code, ex.Message, ex.FieldErrors);
        }
        catch (PostgresException ex)
        {
            var (code, status, message) = PgErrorCodes.Parse(ex.MessageText);
            if (status == 500) logger.LogError(ex, "Unhandled Postgres error");
            await WriteAsync(context, status, code, status == 500 ? "Something went wrong." : message);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unhandled exception");
            await WriteAsync(context, 500, "INTERNAL_ERROR", "Something went wrong.");
        }
    }

    private static Task WriteAsync(HttpContext context, int status, string code, string message,
        IReadOnlyDictionary<string, string>? fieldErrors = null)
    {
        context.Response.StatusCode = status;
        context.Response.ContentType = "application/json";
        var body = JsonSerializer.Serialize(new { code, message, fieldErrors },
            new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase, DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull });
        return context.Response.WriteAsync(body);
    }
}
