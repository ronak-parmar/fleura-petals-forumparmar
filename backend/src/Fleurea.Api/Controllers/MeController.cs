using Fleurea.Api.Auth;
using Fleurea.Api.Data;
using Fleurea.Api.Dtos;
using Fleurea.Api.Errors;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Fleurea.Api.Controllers;

[ApiController]
[Route("api/v1/me")]
[Authorize(Roles = Roles.Customer)]
public class MeController(Db db) : ControllerBase
{
    [HttpGet("orders")]
    public async Task<ActionResult<List<OrderDto>>> GetOrders()
    {
        var customerId = User.CustomerId();
        var orders = await db.QueryAsync(
            "SELECT * FROM fn_get_customer_orders(@p_customer_id)",
            OrderMapper.Map,
            Db.P("p_customer_id", customerId));
        return orders;
    }

    [HttpGet("custom-requests")]
    public async Task<ActionResult<List<CustomRequestDto>>> GetCustomRequests()
    {
        var customerId = User.CustomerId();
        var requests = await db.QueryAsync(
            "SELECT * FROM fn_get_customer_custom_requests(@p_customer_id)",
            CustomRequestMapper.Map,
            Db.P("p_customer_id", customerId));
        return requests;
    }

    [HttpGet("addresses")]
    public async Task<ActionResult<List<AddressDto>>> GetAddresses()
    {
        var customerId = User.CustomerId();
        var addresses = await db.QueryAsync(
            "SELECT * FROM fn_get_addresses(@p_customer_id)",
            AddressMapper.Map,
            Db.P("p_customer_id", customerId));
        return addresses;
    }

    [HttpPost("addresses")]
    public async Task<ActionResult<AddressDto>> AddAddress(CreateAddressRequest request)
    {
        // Mirrors client.ts's mock addAddress exactly: message only, no per-field
        // fieldErrors keys are specified there, so pass an empty dictionary.
        if (string.IsNullOrWhiteSpace(request.Line1) || string.IsNullOrWhiteSpace(request.City) ||
            string.IsNullOrWhiteSpace(request.PostalCode))
        {
            throw ApiException.Validation("Line 1, city and PIN code are required.", new Dictionary<string, string>());
        }

        var customerId = User.CustomerId();
        var address = await db.QuerySingleAsync(
            "SELECT * FROM fn_add_address(@p_customer_id, @p_label, @p_recipient_name, @p_phone, @p_line1, @p_line2, @p_city, @p_state, @p_postal_code, @p_landmark)",
            AddressMapper.Map,
            Db.P("p_customer_id", customerId), Db.P("p_label", request.Label),
            Db.P("p_recipient_name", request.RecipientName), Db.P("p_phone", request.Phone),
            Db.P("p_line1", request.Line1), Db.P("p_line2", request.Line2),
            Db.P("p_city", request.City), Db.P("p_state", request.State),
            Db.P("p_postal_code", request.PostalCode), Db.P("p_landmark", request.Landmark));
        return address;
    }
}
