using Fleurea.Api.Auth;
using Fleurea.Api.Data;
using Fleurea.Api.Dtos;
using Fleurea.Api.Errors;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Fleurea.Api.Controllers.Admin;

[ApiController]
[Route("api/v1/admin/custom-requests")]
[Authorize(Roles = Roles.Admin)]
public class AdminCustomRequestsController(Db db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<CustomRequestDto>>> List([FromQuery] string? status)
    {
        return await db.QueryAsync(
            "SELECT * FROM fn_admin_list_custom_requests(@p_status)",
            CustomRequestMapper.Map,
            Db.P("p_status", status));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<CustomRequestDto>> Get(int id)
    {
        var request = await db.QuerySingleOrDefaultAsync(
            "SELECT * FROM fn_admin_get_custom_request(@p_id)",
            CustomRequestMapper.Map,
            Db.P("p_id", id));

        if (request is null) throw ApiException.NotFound("REQUEST_NOT_FOUND", "Request not found.");
        return request;
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<CustomRequestDto>> Respond(int id, RespondCustomRequestRequest request)
    {
        var existing = await db.QuerySingleOrDefaultAsync(
            "SELECT * FROM fn_admin_get_custom_request(@p_id)",
            CustomRequestMapper.Map,
            Db.P("p_id", id));

        if (existing is null) throw ApiException.NotFound("REQUEST_NOT_FOUND", "Request not found.");

        if (request.Status == "quoted" && request.QuotedPrice == null && existing.QuotedPrice == null)
        {
            throw ApiException.Validation("A quote needs a price.",
                new Dictionary<string, string> { ["quotedPrice"] = "Required when status is quoted." });
        }

        if (request.QuotedPrice != null && request.QuotedPrice < 0)
        {
            throw ApiException.Validation("Quote must be positive.", new Dictionary<string, string>());
        }

        var updated = await db.QuerySingleAsync(
            "SELECT * FROM fn_respond_custom_request(@p_id, @p_status, @p_response, @p_quote)",
            CustomRequestMapper.Map,
            Db.P("p_id", id), Db.P("p_status", request.Status), Db.P("p_response", request.AdminResponse),
            Db.P("p_quote", request.QuotedPrice));

        return updated;
    }
}
