using Npgsql;

namespace Fleurea.Api.Data;

/// <summary>
/// Thin wrapper around NpgsqlDataSource for calling the functions in
/// database/functions.sql — e.g. Query("SELECT * FROM fn_get_products(@p_category, ...)", map, P("p_category", slug)).
/// The API never composes SQL beyond "SELECT * FROM fn_x(...)" / "SELECT fn_x(...)" —
/// all validation, pricing and numbering logic lives in the PL/pgSQL functions themselves.
/// </summary>
public class Db(NpgsqlDataSource dataSource)
{
    public async Task<List<T>> QueryAsync<T>(string sql, Func<NpgsqlDataReader, T> map, params NpgsqlParameter[] parameters)
    {
        await using var cmd = dataSource.CreateCommand(sql);
        foreach (var p in parameters) cmd.Parameters.Add(p);
        await using var reader = await cmd.ExecuteReaderAsync();
        var results = new List<T>();
        while (await reader.ReadAsync()) results.Add(map(reader));
        return results;
    }

    public async Task<T?> QuerySingleOrDefaultAsync<T>(string sql, Func<NpgsqlDataReader, T> map, params NpgsqlParameter[] parameters)
        where T : class
    {
        var rows = await QueryAsync(sql, map, parameters);
        return rows.Count > 0 ? rows[0] : null;
    }

    public async Task<T> QuerySingleAsync<T>(string sql, Func<NpgsqlDataReader, T> map, params NpgsqlParameter[] parameters)
    {
        var rows = await QueryAsync(sql, map, parameters);
        return rows[0];
    }

    public async Task ExecuteAsync(string sql, params NpgsqlParameter[] parameters)
    {
        await using var cmd = dataSource.CreateCommand(sql);
        foreach (var p in parameters) cmd.Parameters.Add(p);
        await cmd.ExecuteNonQueryAsync();
    }

    /// <summary>Builds a named parameter, mapping C# null to DBNull so optional fn_* arguments stay NULL.</summary>
    public static NpgsqlParameter P(string name, object? value) => new(name, value ?? DBNull.Value);

    public static NpgsqlParameter P(string name, NpgsqlTypes.NpgsqlDbType type, object? value) =>
        new(name, type) { Value = value ?? DBNull.Value };
}
