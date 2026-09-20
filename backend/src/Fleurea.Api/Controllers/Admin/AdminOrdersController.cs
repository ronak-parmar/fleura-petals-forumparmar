using Fleurea.Api.Auth;
using Fleurea.Api.Data;
using Fleurea.Api.Dtos;
using Fleurea.Api.Errors;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Fleurea.Api.Controllers.Admin;

[ApiController]
[Route("api/v1/admin/orders")]
[Authorize(Roles = Roles.Admin)]
public class AdminOrdersController(Db db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<OrderDto>>> ListOrders([FromQuery] string? status)
    {
        var orders = await db.QueryAsync(
            "SELECT * FROM fn_admin_list_orders(@p_status)",
            OrderMapper.Map,
            Db.P("p_status", status));
        return orders;
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<OrderDto>> GetOrder(int id)
    {
        var order = await db.QuerySingleOrDefaultAsync(
            "SELECT * FROM fn_admin_get_order(@p_id)",
            OrderMapper.Map,
            Db.P("p_id", id));

        if (order is null)
            throw ApiException.NotFound("ORDER_NOT_FOUND", "Order not found.");

        return order;
    }

    [HttpPut("{id:int}/status")]
    public async Task<ActionResult<OrderDto>> UpdateStatus(int id, UpdateOrderStatusRequest request)
    {
        // fn_update_order_status raises ORDER_NOT_FOUND / CANNOT_CANCEL / INVALID_TRANSITION
        // as Postgres exceptions — ApiExceptionMiddleware maps them, no try/catch needed here.
        await db.ExecuteAsync(
            "SELECT fn_update_order_status(@p_order_id, @p_status)",
            Db.P("p_order_id", id),
            Db.P("p_status", request.Status));

        // Returns the bare orders row (no items) — re-fetch the full shape for the response.
        var order = await db.QuerySingleAsync(
            "SELECT * FROM fn_admin_get_order(@p_id)",
            OrderMapper.Map,
            Db.P("p_id", id));

        return order;
    }
}
