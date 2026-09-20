using Fleurea.Api.Auth;
using Fleurea.Api.Data;
using Fleurea.Api.Dtos;
using Fleurea.Api.Errors;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Fleurea.Api.Controllers.Admin;

[ApiController]
[Route("api/v1/admin/products")]
[Authorize(Roles = Roles.Admin)]
public class AdminProductsController(Db db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<ProductDto>>> ListProducts()
    {
        var products = await db.QueryAsync("SELECT * FROM fn_admin_list_products()", ProductMapper.Map);
        return products;
    }

    [HttpPost]
    public async Task<ActionResult<ProductDto>> CreateProduct([FromBody] UpsertProductRequest request)
    {
        var product = await UpsertAsync(null, request);
        return product;
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<ProductDto>> UpdateProduct(int id, [FromBody] UpsertProductRequest request)
    {
        var product = await UpsertAsync(id, request);
        return product;
    }

    [HttpPut("{id:int}/availability")]
    public async Task<ActionResult<ProductDto>> SetAvailability(int id, [FromBody] SetAvailabilityRequest request)
    {
        var product = await db.QuerySingleOrDefaultAsync(
            "SELECT * FROM fn_set_product_availability(@p_id, @p_availability)",
            ProductMapper.Map,
            Db.P("p_id", id), Db.P("p_availability", request.Availability));

        if (product is null) throw ApiException.NotFound("PRODUCT_NOT_FOUND", "Product not found.");
        return product;
    }

    private async Task<ProductDto> UpsertAsync(int? id, UpsertProductRequest request)
    {
        var fieldErrors = new Dictionary<string, string>();
        if (string.IsNullOrWhiteSpace(request.Name)) fieldErrors["name"] = "Name is required.";
        if (request.Price < 0) fieldErrors["price"] = "Price must not be negative.";
        if (request.CategoryId == 0) fieldErrors["categoryId"] = "Category is required.";
        if (fieldErrors.Count > 0)
            throw ApiException.Validation("Name, category and a non-negative price are required.", fieldErrors);

        var slug = string.IsNullOrWhiteSpace(request.Slug)
            ? request.Name.ToLowerInvariant().Replace(" ", "-")
            : request.Slug;

        return await db.QuerySingleAsync(
            "SELECT * FROM fn_upsert_product(@p_id, @p_category_id, @p_name, @p_slug, @p_short_description, " +
            "@p_description, @p_nature, @p_price, @p_image_url, @p_is_customizable, @p_availability, " +
            "@p_lead_time_days, @p_is_active)",
            ProductMapper.Map,
            Db.P("p_id", id),
            Db.P("p_category_id", request.CategoryId),
            Db.P("p_name", request.Name),
            Db.P("p_slug", slug),
            Db.P("p_short_description", request.ShortDescription),
            Db.P("p_description", request.Description),
            Db.P("p_nature", request.Nature),
            Db.P("p_price", request.Price),
            Db.P("p_image_url", request.ImageUrl),
            Db.P("p_is_customizable", request.IsCustomizable),
            Db.P("p_availability", request.Availability),
            Db.P("p_lead_time_days", request.LeadTimeDays),
            Db.P("p_is_active", request.IsActive));
    }
}
