using Fleurea.Api.Auth;
using Fleurea.Api.Data;
using Fleurea.Api.Dtos;
using Fleurea.Api.Errors;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Npgsql;

namespace Fleurea.Api.Controllers;

[ApiController]
[Route("api/v1/auth")]
public class AuthController(Db db, JwtTokenService jwt) : ControllerBase
{
    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register(RegisterRequest request)
    {
        if (request.Password.Length < 8)
        {
            throw ApiException.Validation(
                "Password must be at least 8 characters.",
                new Dictionary<string, string> { ["password"] = "Too short." });
        }

        var passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

        // fn_register_customer returns a bare INT id (unnamed scalar column, not a
        // row/table) — raises EMAIL_TAKEN (unique_violation) itself if a registered
        // account already exists with this e-mail; let it bubble to the middleware.
        var newId = await db.QuerySingleAsync(
            "SELECT fn_register_customer(@p_name, @p_email, @p_phone, @p_password_hash)",
            r => r.GetInt32(0),
            Db.P("p_name", request.Name), Db.P("p_email", request.Email),
            Db.P("p_phone", request.Phone), Db.P("p_password_hash", passwordHash));

        var customer = await db.QuerySingleAsync(
            "SELECT * FROM fn_get_customer_by_id(@p_id)",
            MapCustomer,
            Db.P("p_id", newId));

        var token = jwt.IssueCustomerToken(customer.Id);
        return new AuthResponse(token, customer);
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest request)
    {
        var row = await db.QuerySingleOrDefaultAsync(
            "SELECT * FROM fn_get_customer_by_email(@p_email)",
            r => new CustomerRow(MapCustomer(r), r.GetStringOrNull("password_hash")),
            Db.P("p_email", request.Email));

        if (row is null || row.PasswordHash is null || !BCrypt.Net.BCrypt.Verify(request.Password, row.PasswordHash))
        {
            throw ApiException.InvalidCredentials("E-mail or password is incorrect.");
        }

        var token = jwt.IssueCustomerToken(row.Customer.Id);
        return new AuthResponse(token, row.Customer);
    }

    [HttpGet("me")]
    [Authorize(Roles = Roles.Customer)]
    public async Task<ActionResult<CustomerDto>> Me()
    {
        var id = User.CustomerId();

        var customer = await db.QuerySingleOrDefaultAsync(
            "SELECT * FROM fn_get_customer_by_id(@p_id)",
            MapCustomer,
            Db.P("p_id", id));

        if (customer is null) throw ApiException.Unauthenticated("Session is no longer valid.");
        return customer;
    }

    // customers rows carry password_hash which must never reach CustomerDto — read the
    // five public columns by name here so it's never touched outside Login's own check.
    private static CustomerDto MapCustomer(NpgsqlDataReader r) => new(
        r.GetInt("id"), r.GetString("name"), r.GetString("email"), r.GetString("phone"), r.GetBool("is_registered"));

    private record CustomerRow(CustomerDto Customer, string? PasswordHash);
}
