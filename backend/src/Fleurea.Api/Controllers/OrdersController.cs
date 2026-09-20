using System.Text.Json;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;
using Fleurea.Api.Data;
using Fleurea.Api.Dtos;
using Fleurea.Api.Errors;
using Microsoft.AspNetCore.Mvc;
using NpgsqlTypes;

namespace Fleurea.Api.Controllers;

/// <summary>
/// Guest checkout + order tracking — no auth (mirrors client.ts's placeOrder/getOrder,
/// which never send an Authorization header).
/// </summary>
[ApiController]
[Route("api/v1/orders")]
public class OrdersController(Db db) : ControllerBase
{
    private static readonly Regex EmailRe = new(@"^[^\s@]+@[^\s@]+\.[^\s@]+$");

    [HttpPost]
    public async Task<ActionResult<OrderDto>> PlaceOrder(PlaceOrderRequest request)
    {
        // Field-level validation — matches client.ts's placeOrder() mock exactly,
        // same field-error keys ("contact.name", "delivery.line1", ...).
        var fieldErrors = new Dictionary<string, string>();
        if (string.IsNullOrWhiteSpace(request.Contact?.Name)) fieldErrors["contact.name"] = "Name is required.";
        if (string.IsNullOrWhiteSpace(request.Contact?.Email) || !EmailRe.IsMatch(request.Contact.Email))
            fieldErrors["contact.email"] = "A valid e-mail is required.";
        if (string.IsNullOrWhiteSpace(request.Contact?.Phone)) fieldErrors["contact.phone"] = "Phone is required.";
        if (string.IsNullOrWhiteSpace(request.Delivery?.Line1)) fieldErrors["delivery.line1"] = "Address line 1 is required.";
        if (string.IsNullOrWhiteSpace(request.Delivery?.City)) fieldErrors["delivery.city"] = "City is required.";
        if (string.IsNullOrWhiteSpace(request.Delivery?.PostalCode)) fieldErrors["delivery.postalCode"] = "PIN code is required.";
        if (string.IsNullOrWhiteSpace(request.Delivery?.Date)) fieldErrors["delivery.date"] = "Delivery date is required.";
        if (fieldErrors.Count > 0)
            throw ApiException.Validation("Please fix the highlighted fields.", fieldErrors);

        // Empty cart is a plain ApiException with no fieldErrors, not VALIDATION_FAILED —
        // matches client.ts's `err(400, "EMPTY_ORDER", "Your cart is empty.")`.
        if (request.Items is null || request.Items.Count == 0)
            throw new ApiException(400, "EMPTY_ORDER", "Your cart is empty.");

        // At this point Contact/Delivery are guaranteed non-null (every required field
        // on them passed the whitespace checks above).
        var contact = request.Contact!;
        var delivery = request.Delivery!;

        var itemsJson = JsonSerializer.Serialize(
            request.Items.Select(i => new PlaceOrderItemJson(i.ProductId, i.Quantity)));

        var newOrderId = await db.QuerySingleAsync(
            """
            SELECT * FROM fn_place_order(
                @p_contact_name, @p_contact_email, @p_contact_phone,
                @p_recipient_name, @p_recipient_phone,
                @p_line1, @p_line2, @p_city, @p_state, @p_postal_code, @p_landmark,
                @p_delivery_date, @p_delivery_slot, @p_gift_message, @p_customer_note, @p_items)
            """,
            r => r.GetInt("id"),
            Db.P("p_contact_name", contact.Name),
            Db.P("p_contact_email", contact.Email),
            Db.P("p_contact_phone", contact.Phone),
            Db.P("p_recipient_name", delivery.RecipientName),
            Db.P("p_recipient_phone", delivery.Phone),
            Db.P("p_line1", delivery.Line1),
            Db.P("p_line2", delivery.Line2),
            Db.P("p_city", delivery.City),
            Db.P("p_state", delivery.State),
            Db.P("p_postal_code", delivery.PostalCode),
            Db.P("p_landmark", delivery.Landmark),
            Db.P("p_delivery_date", DateOnly.Parse(delivery.Date)),
            Db.P("p_delivery_slot", delivery.Slot),
            Db.P("p_gift_message", request.GiftMessage),
            Db.P("p_customer_note", request.CustomerNote),
            Db.P("p_items", NpgsqlDbType.Jsonb, itemsJson));

        // fn_place_order returns the bare orders row (no items) — re-fetch the full
        // shape (with items) via fn_admin_get_order, per BACKEND_FOUNDATION.md.
        var order = await db.QuerySingleAsync(
            "SELECT * FROM fn_admin_get_order(@p_id)",
            OrderMapper.Map,
            Db.P("p_id", newOrderId));

        return order;
    }

    [HttpGet("{orderNumber}")]
    public async Task<ActionResult<OrderDto>> GetOrder(string orderNumber, [FromQuery] string email)
    {
        var order = await db.QuerySingleOrDefaultAsync(
            "SELECT * FROM fn_get_order(@p_order_number, @p_email)",
            OrderMapper.Map,
            Db.P("p_order_number", orderNumber),
            Db.P("p_email", email));

        if (order is null)
            throw ApiException.NotFound("ORDER_NOT_FOUND", "No order found for that number and e-mail.");

        return order;
    }

    private record PlaceOrderItemJson(
        [property: JsonPropertyName("product_id")] int ProductId,
        [property: JsonPropertyName("quantity")] int Quantity);
}
