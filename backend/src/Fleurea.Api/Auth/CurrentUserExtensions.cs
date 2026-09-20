using System.Security.Claims;
using Fleurea.Api.Errors;

namespace Fleurea.Api.Auth;

/// <summary>Reads the JWT claims set by JwtTokenService off the current request's ClaimsPrincipal.</summary>
public static class CurrentUserExtensions
{
    public static int CustomerId(this ClaimsPrincipal user)
    {
        var value = user.FindFirstValue(ClaimTypes.NameIdentifier);
        if (user.FindFirstValue(ClaimTypes.Role) != Roles.Customer || value is null || !int.TryParse(value, out var id))
            throw ApiException.Unauthenticated();
        return id;
    }

    public static int AdminId(this ClaimsPrincipal user)
    {
        var value = user.FindFirstValue(ClaimTypes.NameIdentifier);
        if (user.FindFirstValue(ClaimTypes.Role) != Roles.Admin || value is null || !int.TryParse(value, out var id))
            throw ApiException.Unauthenticated("Admin sign-in required.");
        return id;
    }
}
