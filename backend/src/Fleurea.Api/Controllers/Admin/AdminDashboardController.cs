using Fleurea.Api.Auth;
using Fleurea.Api.Data;
using Fleurea.Api.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Fleurea.Api.Controllers.Admin;

[ApiController]
[Route("api/v1/admin/dashboard")]
public class AdminDashboardController : ControllerBase
{
    private readonly Db _db;

    public AdminDashboardController(Db db)
    {
        _db = db;
    }

    [HttpGet("summary")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<ActionResult<DashboardSummaryDto>> GetSummary()
    {
        // Enforce the admin check consistently with other admin controllers, even
        // though fn_dashboard_summary() itself takes no id parameter.
        _ = User.AdminId();

        var summary = await _db.QuerySingleAsync(
            "SELECT * FROM fn_dashboard_summary()",
            r => new DashboardSummaryDto(
                r.GetLong("orders_pending"),
                r.GetLong("orders_in_progress"),
                r.GetLong("orders_delivered"),
                r.GetLong("custom_requests_new"),
                r.GetLong("enquiries_unhandled"),
                r.GetLong("products_active")));

        return summary;
    }
}
