# Backend foundation — read before writing any controller

ASP.NET Core Web API at `backend/src/Fleurea.Api/`, target `net10.0`, controllers-based
(`[ApiController]`). This implements the exact contract already defined in
`app/src/lib/api/client.ts`'s `live*` branches and `app/src/lib/api/types.ts` — those two
files are the source of truth for every route, HTTP method, and JSON field name. Read them
before writing a controller for your group.

The database contract is `database/schema.sql` (tables) and `database/functions.sql`
(every PL/pgSQL function the API is allowed to touch data through — **no inline SQL in C#,
ever**, only `SELECT ... FROM fn_x(...)` / `SELECT fn_x(...)` calls via the `Db` helper).

## What already exists — do not redefine any of this

- **`Program.cs`** — CORS (`localhost:3100`), JWT bearer auth, Swagger, the global
  `ApiExceptionMiddleware`, and DI registrations for `Db` (scoped) and `JwtTokenService`
  (singleton). Your controllers get these via constructor injection.
- **`Data/Db.cs`** — call functions like:
  ```csharp
  var products = await _db.QueryAsync("SELECT * FROM fn_get_products(@p_category, @p_nature, @p_search, @p_page, @p_page_size)",
      ProductMapper.Map,
      Db.P("p_category", filter.Category), Db.P("p_nature", filter.Nature),
      Db.P("p_search", filter.Search), Db.P("p_page", filter.Page ?? 1), Db.P("p_page_size", filter.PageSize ?? 12));
  ```
  `Db.P(name, value)` turns a C# `null` into `DBNull.Value` automatically — pass nullable
  filter args straight through, the SQL function's `DEFAULT NULL` / `p_x IS NULL OR ...`
  pattern handles "skip this filter" on the Postgres side.
  For a function whose JSONB argument needs an explicit type (only `fn_place_order`'s
  `p_items`), use `Db.P("p_items", NpgsqlTypes.NpgsqlDbType.Jsonb, jsonString)`.
- **`Data/ReaderExtensions.cs`** — `r.GetString("col")`, `GetStringOrNull`, `GetInt`,
  `GetIntOrNull`, `GetDecimal`, `GetDecimalOrNull`, `GetBool`, `GetDate` (→ `DateOnly`),
  `GetTimestampOffset` (→ `DateTimeOffset`), `GetJsonRaw` (raw jsonb text). Always read
  columns **by name**, never by ordinal.
- **`Dtos/Dtos.cs`** — every response/request record, already matching `types.ts` field
  names in PascalCase (serialized camelCase automatically — `Program.cs` sets
  `JsonNamingPolicy.CamelCase` globally). **Use these records as-is.** If your group seems
  to need a field that isn't there, it's more likely you should re-check `types.ts` — don't
  add ad-hoc fields.
- **`Dtos/Mappers.cs`** — `ProductMapper.Map(reader)`, `OrderMapper.Map(reader)`,
  `CustomRequestMapper.Map(reader)`, `AddressMapper.Map(reader)`, `EnquiryMapper.Map(reader)`.
  Every product-returning function shares one column set; every order-returning function
  shares another (see the comments in `functions.sql` above each `fn_*_order*` function).
  Use these mappers for every query that returns that shape — don't write a new one.
- **`Errors/ApiException.cs`** — throw `ApiException.NotFound("PRODUCT_NOT_FOUND", "...")`,
  `ApiException.Validation(msg, fieldErrors)`, `ApiException.Unauthenticated()`,
  `ApiException.Conflict("CODE", "...")` etc. for app-level checks (empty result sets from a
  `SETOF`/`TABLE` function that found nothing, request validation). **Postgres exceptions
  raised inside a `fn_*` function (e.g. `RAISE EXCEPTION 'PRODUCT_SOLD_OUT: ...'`) need no
  try/catch in your controller at all** — `ApiExceptionMiddleware` catches `PostgresException`
  globally and maps the `CODE` prefix to the right HTTP status via `Errors/PgErrorCodes.cs`
  (extend that dictionary if your group's function raises a new code not already listed).
- **`Auth/CurrentUserExtensions.cs`** — inside an `[Authorize(Roles = Roles.Customer)]`
  action, call `User.CustomerId()` to get the int id from the JWT (throws 401 if missing/
  wrong role). Same for `[Authorize(Roles = Roles.Admin)]` + `User.AdminId()`.
- **`Auth/JwtTokenService.cs`** — `_jwt.IssueCustomerToken(id)` / `_jwt.IssueAdminToken(id)`
  for the two login endpoints and register.

## Conventions every controller must follow

- Route prefix matches `client.ts` exactly, e.g. `[Route("api/v1/products")]` for
  `/products` (client.ts's `API_BASE` already ends in `/api/v1`).
- Every action is `async Task<ActionResult<T>>`, returns the DTO directly — no wrapper
  envelope. Errors are thrown as exceptions (`ApiException` or a bubbled `PostgresException`),
  never returned as `BadRequest(...)`/`NotFound(...)` — the middleware builds the
  `{code,message,fieldErrors}` body uniformly. Only use `NotFound()`/`BadRequest()` typed
  helpers if you genuinely have nothing more specific to say (you shouldn't need to).
- Query-string binding: `[FromQuery] string? category` etc. — plain parameters, no wrapper
  DTO needed for GET filters.
- Registered-customer password hashing: `BCrypt.Net.BCrypt.HashPassword(password)` /
  `BCrypt.Net.BCrypt.Verify(password, hash)`.
- Password length check (`< 8 chars` → `VALIDATION_FAILED`) happens in C# before calling
  `fn_register_customer` — the DB function doesn't validate password strength.
- **Placing an order**: call `fn_place_order(...)` (returns the bare `orders` row, no
  `items`), then immediately call `fn_admin_get_order(newOrder.id)` (via `OrderMapper.Map`)
  to get the full shape with items for the response — don't hand-assemble items from the
  request payload, the DB function re-prices from `products` and that's the truth.
- **Custom requests from possibly-unauthenticated users**: `POST /custom-requests` has no
  `Authorization` header in `client.ts` — call `fn_upsert_guest_customer(name, email, phone)`
  first to resolve/create a `customer_id`, then pass that into `fn_create_custom_request`.
  Mirrors how `placeOrder` resolves its customer.
- `DateOnly` request fields (delivery date, need-by date) arrive from the frontend as
  plain `"YYYY-MM-DD"` strings (see `PlaceOrderDeliveryRequest.Date` /
  `CreateCustomRequestRequest.NeedByDate`, typed `string` not `DateOnly`, since that's what
  the JSON payload sends) — parse with `DateOnly.Parse(...)` before passing to `Db.P`.

## Build & verify

```
dotnet build "D:\Forum Parmar\backend\src\Fleurea.Api\Fleurea.Api.csproj"
```
Must succeed with 0 errors before you report back. You cannot run the app end-to-end yet
(no live Postgres instance on this machine — see `database/README.md`), so a clean build is
the bar, not a live request. Write code that's obviously correct against the function
signatures in `functions.sql` and the DTOs above — read both files fully for your domain
before writing.

## Domain groups (each owns disjoint files — safe to run in parallel)

1. **Catalogue** — `Controllers/CategoriesController.cs`, `Controllers/ProductsController.cs`,
   `Controllers/Admin/AdminProductsController.cs`
2. **Orders** — `Controllers/OrdersController.cs`, `Controllers/Admin/AdminOrdersController.cs`
3. **Custom requests, enquiries, uploads** — `Controllers/CustomRequestsController.cs`,
   `Controllers/EnquiriesController.cs`, `Controllers/UploadsController.cs`,
   `Controllers/Admin/AdminCustomRequestsController.cs`,
   `Controllers/Admin/AdminEnquiriesController.cs`
4. **Auth + customer account** — `Controllers/AuthController.cs`, `Controllers/MeController.cs`
5. **Admin auth + dashboard** — `Controllers/Admin/AdminAuthController.cs`,
   `Controllers/Admin/AdminDashboardController.cs`

Each group also gets a matching `Services/<Group>Service.cs` if the controller logic is
non-trivial (place order, register/login) — thin pass-through controllers can skip a
service and call `Db` directly.
