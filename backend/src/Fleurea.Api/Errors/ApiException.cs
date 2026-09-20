namespace Fleurea.Api.Errors;

/// <summary>
/// Thrown anywhere in the app to produce the exact error JSON shape
/// app/src/lib/api/types.ts's ApiError expects: { code, message, fieldErrors }.
/// Controllers/services should throw this directly for app-level checks
/// (auth, request validation) instead of returning ActionResult error types.
/// Postgres-raised errors from fn_* functions are translated into this same
/// shape by ApiExceptionMiddleware — see PgErrorCodes for the status mapping.
/// </summary>
public class ApiException(int status, string code, string message, IReadOnlyDictionary<string, string>? fieldErrors = null)
    : Exception(message)
{
    public int Status { get; } = status;
    public string Code { get; } = code;
    public IReadOnlyDictionary<string, string>? FieldErrors { get; } = fieldErrors;

    public static ApiException Unauthenticated(string message = "Not signed in.") =>
        new(401, "UNAUTHENTICATED", message);

    public static ApiException InvalidCredentials(string message = "Username or password is incorrect.") =>
        new(401, "INVALID_CREDENTIALS", message);

    public static ApiException NotFound(string code, string message) =>
        new(404, code, message);

    public static ApiException Validation(string message, IReadOnlyDictionary<string, string> fieldErrors) =>
        new(400, "VALIDATION_FAILED", message, fieldErrors);

    public static ApiException Conflict(string code, string message) =>
        new(409, code, message);
}
