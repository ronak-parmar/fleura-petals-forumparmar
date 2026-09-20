using Fleurea.Api.Auth;
using Fleurea.Api.Data;
using Fleurea.Api.Dtos;
using Fleurea.Api.Errors;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Fleurea.Api.Controllers.Admin;

[ApiController]
[Route("api/v1/admin/enquiries")]
[Authorize(Roles = Roles.Admin)]
public class AdminEnquiriesController(Db db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<EnquiryDto>>> List()
    {
        return await db.QueryAsync(
            "SELECT * FROM fn_admin_list_enquiries()",
            EnquiryMapper.Map);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<EnquiryDto>> MarkHandled(int id, MarkEnquiryHandledRequest request)
    {
        var enquiry = await db.QuerySingleOrDefaultAsync(
            "SELECT * FROM fn_mark_enquiry_handled(@p_id, @p_handled)",
            EnquiryMapper.Map,
            Db.P("p_id", id), Db.P("p_handled", request.IsHandled));

        if (enquiry is null) throw ApiException.NotFound("ENQUIRY_NOT_FOUND", "Enquiry not found.");
        return enquiry;
    }
}
