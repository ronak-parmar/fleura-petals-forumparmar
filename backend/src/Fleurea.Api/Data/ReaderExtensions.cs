using Npgsql;

namespace Fleurea.Api.Data;

/// <summary>Null-safe column readers, keyed by name (fn_* result columns are already snake_case; we read by name so column order never matters).</summary>
public static class ReaderExtensions
{
    public static string GetString(this NpgsqlDataReader r, string col) => r.GetString(r.GetOrdinal(col));
    public static string? GetStringOrNull(this NpgsqlDataReader r, string col)
    {
        var i = r.GetOrdinal(col);
        return r.IsDBNull(i) ? null : r.GetString(i);
    }
    public static int GetInt(this NpgsqlDataReader r, string col) => r.GetInt32(r.GetOrdinal(col));
    public static int? GetIntOrNull(this NpgsqlDataReader r, string col)
    {
        var i = r.GetOrdinal(col);
        return r.IsDBNull(i) ? null : r.GetInt32(i);
    }
    public static long GetLong(this NpgsqlDataReader r, string col) => r.GetInt64(r.GetOrdinal(col));
    public static decimal GetDecimal(this NpgsqlDataReader r, string col) => r.GetDecimal(r.GetOrdinal(col));
    public static decimal? GetDecimalOrNull(this NpgsqlDataReader r, string col)
    {
        var i = r.GetOrdinal(col);
        return r.IsDBNull(i) ? null : r.GetDecimal(i);
    }
    public static bool GetBool(this NpgsqlDataReader r, string col) => r.GetBoolean(r.GetOrdinal(col));
    public static DateTime GetTimestamp(this NpgsqlDataReader r, string col) => r.GetDateTime(r.GetOrdinal(col));
    public static DateTimeOffset GetTimestampOffset(this NpgsqlDataReader r, string col) => r.GetFieldValue<DateTimeOffset>(r.GetOrdinal(col));
    public static DateOnly GetDate(this NpgsqlDataReader r, string col) => DateOnly.FromDateTime(r.GetDateTime(r.GetOrdinal(col)));
    public static string GetJsonRaw(this NpgsqlDataReader r, string col) => r.GetFieldValue<string>(r.GetOrdinal(col));
}
