using Fleurea.Api.Auth;
using Fleurea.Api.Data;
using Fleurea.Api.Dtos;
using Fleurea.Api.Errors;
using Microsoft.AspNetCore.Mvc;

namespace Fleurea.Api.Controllers.Admin;

/// <summary>Admin sign-in — no [Authorize], this IS the endpoint that issues the admin JWT.</summary>
[ApiController]
[Route("api/v1/admin/auth")]
public class AdminAuthController : ControllerBase
{
    private readonly Db _db;
    private readonly JwtTokenService _jwt;

    public AdminAuthController(Db db, JwtTokenService jwt)
    {
        _db = db;
        _jwt = jwt;
    }

    [HttpPost("login")]
    public async Task<ActionResult<AdminLoginResponse>> Login(AdminLoginRequest request)
    {
        var admin = await _db.QuerySingleOrDefaultAsync(
            "SELECT * FROM fn_get_admin_by_username(@p_username)",
            r => new { Id = r.GetInt("id"), PasswordHash = r.GetString("password_hash") },
            Db.P("p_username", request.Username));

        if (admin is null || !BCrypt.Net.BCrypt.Verify(request.Password, admin.PasswordHash))
            throw ApiException.InvalidCredentials("Username or password is incorrect.");

        await _db.ExecuteAsync("SELECT fn_touch_admin_login(@p_id)", Db.P("p_id", admin.Id));

        var token = _jwt.IssueAdminToken(admin.Id);
        return new AdminLoginResponse(token);
    }
}
