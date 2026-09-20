using Fleurea.Api.Data;
using Fleurea.Api.Dtos;
using Fleurea.Api.Errors;
using Microsoft.AspNetCore.Mvc;

namespace Fleurea.Api.Controllers;

[ApiController]
[Route("api/v1/custom-requests")]
public class CustomRequestsController(Db db) : ControllerBase
{
    [HttpPost]
    public async Task<ActionResult<CustomRequestDto>> Create(CreateCustomRequestRequest request)
    {
        var fieldErrors = new Dictionary<string, string>();
        if (string.IsNullOrWhiteSpace(request.ContactName)) fieldErrors["contactName"] = "Name is required.";
        if (string.IsNullOrWhiteSpace(request.ContactEmail) || !IsValidEmail(request.ContactEmail))
            fieldErrors["contactEmail"] = "A valid e-mail is required.";
        if (string.IsNullOrWhiteSpace(request.Occasion)) fieldErrors["occasion"] = "Occasion is required.";
        if (string.IsNullOrWhiteSpace(request.NeedByDate)) fieldErrors["needByDate"] = "Need-by date is required.";
        if (request.BudgetMin != null && request.BudgetMax != null && request.BudgetMin > request.BudgetMax)
            fieldErrors["budgetMin"] = "Minimum budget cannot be more than the maximum.";

        if (fieldErrors.Count > 0)
            throw ApiException.Validation("Please fix the highlighted fields.", fieldErrors);

        var customerId = await db.QuerySingleAsync(
            "SELECT fn_upsert_guest_customer(@p_name, @p_email, @p_phone) AS id",
            r => r.GetInt("id"),
            Db.P("p_name", request.ContactName), Db.P("p_email", request.ContactEmail), Db.P("p_phone", request.ContactPhone));

        var created = await db.QuerySingleAsync(
            """
            SELECT * FROM fn_create_custom_request(
                @p_customer_id, @p_contact_name, @p_contact_email, @p_contact_phone,
                @p_bouquet_type, @p_occasion, @p_palette, @p_flowers, @p_size,
                @p_budget_min, @p_budget_max, @p_need_by_date, @p_reference_notes, @p_image_url)
            """,
            CustomRequestMapper.Map,
            Db.P("p_customer_id", customerId),
            Db.P("p_contact_name", request.ContactName),
            Db.P("p_contact_email", request.ContactEmail),
            Db.P("p_contact_phone", request.ContactPhone),
            Db.P("p_bouquet_type", request.BouquetType),
            Db.P("p_occasion", request.Occasion),
            Db.P("p_palette", request.Palette),
            Db.P("p_flowers", request.FlowersPreferred),
            Db.P("p_size", request.Size),
            Db.P("p_budget_min", request.BudgetMin),
            Db.P("p_budget_max", request.BudgetMax),
            Db.P("p_need_by_date", DateOnly.Parse(request.NeedByDate)),
            Db.P("p_reference_notes", request.ReferenceNotes),
            Db.P("p_image_url", request.InspirationImageUrl));

        return created;
    }

    [HttpGet("{requestNumber}")]
    public async Task<ActionResult<CustomRequestDto>> Get(string requestNumber, [FromQuery] string email)
    {
        var request = await db.QuerySingleOrDefaultAsync(
            "SELECT * FROM fn_get_custom_request(@p_request_number, @p_email)",
            CustomRequestMapper.Map,
            Db.P("p_request_number", requestNumber), Db.P("p_email", email));

        if (request is null) throw ApiException.NotFound("REQUEST_NOT_FOUND", "No request found for that number and e-mail.");
        return request;
    }

    private static bool IsValidEmail(string email) =>
        System.Text.RegularExpressions.Regex.IsMatch(email, @"^[^\s@]+@[^\s@]+\.[^\s@]+$");
}
