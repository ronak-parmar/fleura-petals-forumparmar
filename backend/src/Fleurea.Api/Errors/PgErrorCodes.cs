namespace Fleurea.Api.Errors;

/// <summary>
/// Maps the CODE prefix of a RAISE EXCEPTION message in database/functions.sql
/// (e.g. "PRODUCT_NOT_FOUND: 5" -> code "PRODUCT_NOT_FOUND") to the HTTP status
/// app/src/lib/api/client.ts's mock layer already uses for the same code, so
/// live and mock modes behave identically to the frontend.
/// </summary>
public static class PgErrorCodes
{
    private static readonly Dictionary<string, int> StatusByCode = new()
    {
        ["EMPTY_ORDER"] = 400,
        ["PRODUCT_NOT_FOUND"] = 404,
        ["PRODUCT_SOLD_OUT"] = 400,
        ["DELIVERY_TOO_SOON"] = 400,
        ["ORDER_NOT_FOUND"] = 404,
        ["CANNOT_CANCEL"] = 409,
        ["INVALID_TRANSITION"] = 409,
        ["REQUEST_NOT_FOUND"] = 404,
        ["EMAIL_TAKEN"] = 409,
    };

    /// <summary>Splits "CODE: rest of message" (or a bare "CODE") into (code, status, cleanMessage) —
    /// cleanMessage drops the "CODE: " prefix so the client doesn't see the raw DB text twice
    /// (the code is already a separate JSON field).</summary>
    public static (string Code, int Status, string Message) Parse(string pgMessage)
    {
        var hasColon = pgMessage.Contains(':');
        var code = hasColon ? pgMessage[..pgMessage.IndexOf(':')].Trim() : pgMessage.Trim();
        var rest = hasColon ? pgMessage[(pgMessage.IndexOf(':') + 1)..].Trim() : pgMessage.Trim();
        return StatusByCode.TryGetValue(code, out var status) ? (code, status, rest) : ("INTERNAL_ERROR", 500, pgMessage);
    }
}
