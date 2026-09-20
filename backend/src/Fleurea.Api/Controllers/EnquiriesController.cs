using Fleurea.Api.Data;
using Fleurea.Api.Dtos;
using Fleurea.Api.Errors;
using Microsoft.AspNetCore.Mvc;

namespace Fleurea.Api.Controllers;

[ApiController]
[Route("api/v1/enquiries")]
public class EnquiriesController(Db db) : ControllerBase
{
    [HttpPost]
    public async Task<ActionResult<EnquiryDto>> Create(CreateEnquiryRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name) || string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Message))
            throw ApiException.Validation("All fields are required.", new Dictionary<string, string>());

        var enquiry = await db.QuerySingleAsync(
            "SELECT * FROM fn_create_enquiry(@p_name, @p_email, @p_message)",
            EnquiryMapper.Map,
            Db.P("p_name", request.Name), Db.P("p_email", request.Email), Db.P("p_message", request.Message));

        return enquiry;
    }
}
