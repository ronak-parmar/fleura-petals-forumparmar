using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace Fleurea.Api.Auth;

/// <summary>
/// Issues the bearer tokens returned by /auth/login, /auth/register and
/// /admin/auth/login. The mock layer in client.ts fakes these as
/// "mock.customer.&lt;id&gt;" / "mock.admin" strings — here they're real JWTs,
/// but the claim shape (subject = id, role = customer|admin) is what
/// CurrentUserExtensions reads back on every authenticated request.
/// </summary>
public class JwtTokenService(IOptions<JwtOptions> options)
{
    private readonly JwtOptions _opts = options.Value;

    public string IssueCustomerToken(int customerId) => Issue(customerId.ToString(), Roles.Customer);

    public string IssueAdminToken(int adminId) => Issue(adminId.ToString(), Roles.Admin);

    private string Issue(string subject, string role)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_opts.SigningKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, subject),
            new Claim(ClaimTypes.Role, role),
        };
        var token = new JwtSecurityToken(
            issuer: _opts.Issuer,
            audience: _opts.Audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(_opts.ExpiryMinutes),
            signingCredentials: creds);
        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
