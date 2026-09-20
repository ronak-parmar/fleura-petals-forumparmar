using Fleurea.Api.Data;
using Fleurea.Api.Dtos;
using Fleurea.Api.Errors;
using Microsoft.AspNetCore.Mvc;

namespace Fleurea.Api.Controllers;

[ApiController]
[Route("api/v1/products")]
public class ProductsController(Db db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<ProductListResultDto>> GetProducts(
        [FromQuery] string? category, [FromQuery] string? nature, [FromQuery] string? search,
        [FromQuery] int? page, [FromQuery] int? pageSize)
    {
        var rows = await db.QueryAsync(
            "SELECT * FROM fn_get_products(@p_category, @p_nature, @p_search, @p_page, @p_page_size)",
            r => (Product: ProductMapper.Map(r), TotalCount: r.GetLong("total_count")),
            Db.P("p_category", category), Db.P("p_nature", nature), Db.P("p_search", search),
            Db.P("p_page", page ?? 1), Db.P("p_page_size", pageSize ?? 12));

        var items = rows.Select(row => row.Product).ToList();
        var totalCount = rows.Count > 0 ? rows[0].TotalCount : 0;
        return new ProductListResultDto(items, totalCount);
    }

    [HttpGet("{slug}")]
    public async Task<ActionResult<ProductDto>> GetProduct(string slug)
    {
        var product = await db.QuerySingleOrDefaultAsync(
            "SELECT * FROM fn_get_product_by_slug(@p_slug)",
            ProductMapper.Map,
            Db.P("p_slug", slug));

        if (product is null) throw ApiException.NotFound("PRODUCT_NOT_FOUND", "This product could not be found.");
        return product;
    }
}
