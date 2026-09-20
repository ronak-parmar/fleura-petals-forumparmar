using Fleurea.Api.Data;
using Fleurea.Api.Dtos;
using Microsoft.AspNetCore.Mvc;

namespace Fleurea.Api.Controllers;

[ApiController]
[Route("api/v1/categories")]
public class CategoriesController(Db db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<CategoryDto>>> GetCategories()
    {
        var categories = await db.QueryAsync(
            "SELECT * FROM fn_get_categories()",
            r => new CategoryDto(
                r.GetInt("id"), r.GetString("name"), r.GetString("slug"),
                r.GetString("description"), r.GetInt("sort_order")));
        return categories;
    }
}
