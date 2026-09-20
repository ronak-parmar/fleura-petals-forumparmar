using System.Text.Json;
using System.Text.Json.Serialization;
using Fleurea.Api.Data;
using Npgsql;

namespace Fleurea.Api.Dtos;

/// <summary>
/// Every product-returning function (fn_get_products, fn_get_product_by_slug,
/// fn_admin_list_products, fn_upsert_product, fn_set_product_availability) returns
/// the same column set — map them all through here so the shape can't drift.
/// </summary>
public static class ProductMapper
{
    public static ProductDto Map(NpgsqlDataReader r) => new(
        r.GetInt("id"), r.GetInt("category_id"), r.GetString("category"), r.GetString("name"), r.GetString("slug"),
        r.GetString("short_description"), r.GetString("description"), r.GetString("nature"), r.GetDecimal("price"),
        r.GetString("image_url"), r.GetBool("is_customizable"), r.GetString("availability"),
        r.GetInt("lead_time_days"), r.GetBool("is_active"));
}

/// <summary>
/// Every order-returning function (fn_get_order, fn_admin_get_order, fn_admin_list_orders)
/// returns the same column set, with an `items` JSONB column shaped like
/// [{product_id, name, unit_price, quantity, line_total}, ...] — map them all through here.
/// fn_place_order itself returns the bare `orders` row with no items column: callers
/// should follow it with fn_admin_get_order(newId) to get the full shape via this mapper.
/// </summary>
public static class OrderMapper
{
    private static readonly JsonSerializerOptions JsonOpts = new() { PropertyNameCaseInsensitive = true };

    public static OrderDto Map(NpgsqlDataReader r)
    {
        var rawItems = JsonSerializer.Deserialize<List<RawItem>>(r.GetJsonRaw("items"), JsonOpts) ?? [];
        var items = rawItems.Select(i => new OrderItemDto(i.ProductId, i.Name, i.UnitPrice, i.Quantity, i.LineTotal)).ToList();

        return new OrderDto(
            r.GetInt("id"), r.GetString("order_number"), r.GetString("status"),
            r.GetDecimal("subtotal"), r.GetDecimal("delivery_fee"), r.GetDecimal("total"),
            r.GetString("recipient_name"), r.GetString("recipient_phone"),
            r.GetString("address_line1"), r.GetString("address_line2"), r.GetString("city"),
            r.GetString("state"), r.GetString("postal_code"), r.GetString("landmark"),
            r.GetDate("delivery_date"), r.GetString("delivery_slot"),
            r.GetStringOrNull("gift_message"), r.GetStringOrNull("customer_note"),
            r.GetTimestampOffset("placed_at"), items);
    }

    private record RawItem(
        [property: JsonPropertyName("product_id")] int ProductId,
        [property: JsonPropertyName("name")] string Name,
        [property: JsonPropertyName("unit_price")] decimal UnitPrice,
        [property: JsonPropertyName("quantity")] int Quantity,
        [property: JsonPropertyName("line_total")] decimal LineTotal);
}

public static class CustomRequestMapper
{
    public static CustomRequestDto Map(NpgsqlDataReader r) => new(
        r.GetInt("id"), r.GetString("request_number"), r.GetString("contact_name"),
        r.GetString("contact_email"), r.GetString("contact_phone"), r.GetString("bouquet_type"),
        r.GetString("occasion"), r.GetString("palette"), r.GetString("flowers_preferred"), r.GetString("size"),
        r.GetDecimal("budget_min"), r.GetDecimal("budget_max"), r.GetDate("need_by_date"), r.GetString("reference_notes"),
        r.GetStringOrNull("inspiration_image_url"), r.GetString("status"), r.GetStringOrNull("admin_response"),
        r.GetDecimalOrNull("quoted_price"), r.GetTimestampOffset("created_at"));
}

public static class AddressMapper
{
    public static AddressDto Map(NpgsqlDataReader r) => new(
        r.GetInt("id"), r.GetInt("customer_id"), r.GetString("label"), r.GetString("recipient_name"),
        r.GetString("phone"), r.GetString("line1"), r.GetString("line2"), r.GetString("city"),
        r.GetString("state"), r.GetString("postal_code"), r.GetString("landmark"));
}

public static class EnquiryMapper
{
    public static EnquiryDto Map(NpgsqlDataReader r) => new(
        r.GetInt("id"), r.GetString("name"), r.GetString("email"), r.GetString("message"),
        r.GetBool("is_handled"), r.GetTimestampOffset("created_at"));
}
