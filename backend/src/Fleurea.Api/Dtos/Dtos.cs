namespace Fleurea.Api.Dtos;

// ===========================================================================
// These records mirror app/src/lib/api/types.ts field-for-field (PascalCase
// here, serialized camelCase by Program.cs's global JsonNamingPolicy). Every
// controller across every domain group must return/accept exactly these
// shapes — do not redeclare a parallel DTO for the same concept elsewhere.
// ===========================================================================

public record CategoryDto(int Id, string Name, string Slug, string Description, int SortOrder);

public record ProductDto(
    int Id, int CategoryId, string Category, string Name, string Slug,
    string ShortDescription, string Description, string Nature, decimal Price,
    string ImageUrl, bool IsCustomizable, string Availability, int LeadTimeDays, bool IsActive);

public record ProductListResultDto(List<ProductDto> Items, long TotalCount);

public record OrderItemDto(int ProductId, string ProductName, decimal UnitPrice, int Quantity, decimal LineTotal);

public record OrderDto(
    int Id, string OrderNumber, string Status, decimal Subtotal, decimal DeliveryFee, decimal Total,
    string RecipientName, string RecipientPhone, string AddressLine1, string AddressLine2,
    string City, string State, string PostalCode, string Landmark,
    DateOnly DeliveryDate, string DeliverySlot, string? GiftMessage, string? CustomerNote,
    DateTimeOffset PlacedAt, List<OrderItemDto> Items);

public record PlaceOrderItemRequest(int ProductId, int Quantity);
public record PlaceOrderContactRequest(string Name, string Email, string Phone);
public record PlaceOrderDeliveryRequest(
    string RecipientName, string Phone, string Line1, string? Line2, string City,
    string? State, string PostalCode, string? Landmark, string Date, string Slot);
public record PlaceOrderRequest(
    List<PlaceOrderItemRequest> Items, PlaceOrderContactRequest Contact, PlaceOrderDeliveryRequest Delivery,
    string? GiftMessage, string? CustomerNote);

public record UpdateOrderStatusRequest(string Status);

public record CustomRequestDto(
    int Id, string RequestNumber, string ContactName, string ContactEmail, string ContactPhone,
    string BouquetType, string Occasion, string Palette, string FlowersPreferred, string Size,
    decimal BudgetMin, decimal BudgetMax, DateOnly NeedByDate, string ReferenceNotes,
    string? InspirationImageUrl, string Status, string? AdminResponse, decimal? QuotedPrice, DateTimeOffset CreatedAt);

public record CreateCustomRequestRequest(
    string ContactName, string ContactEmail, string ContactPhone, string BouquetType, string Occasion,
    string? Palette, string? FlowersPreferred, string? Size, decimal? BudgetMin, decimal? BudgetMax,
    string NeedByDate, string? ReferenceNotes, string? InspirationImageUrl);

public record RespondCustomRequestRequest(string? Status, string? AdminResponse, decimal? QuotedPrice);

public record EnquiryDto(int Id, string Name, string Email, string Message, bool IsHandled, DateTimeOffset CreatedAt);
public record CreateEnquiryRequest(string Name, string Email, string Message);
public record MarkEnquiryHandledRequest(bool IsHandled);

public record AddressDto(
    int Id, int CustomerId, string Label, string RecipientName, string Phone,
    string Line1, string Line2, string City, string State, string PostalCode, string Landmark);
public record CreateAddressRequest(
    string? Label, string RecipientName, string Phone, string Line1, string? Line2,
    string City, string? State, string PostalCode, string? Landmark);

public record CustomerDto(int Id, string Name, string Email, string Phone, bool IsRegistered);

public record RegisterRequest(string Name, string Email, string Phone, string Password);
public record LoginRequest(string Email, string Password);
public record AuthResponse(string Token, CustomerDto Customer);

public record AdminLoginRequest(string Username, string Password);
public record AdminLoginResponse(string Token);

public record DashboardSummaryDto(
    long OrdersPending, long OrdersInProgress, long OrdersDelivered,
    long CustomRequestsNew, long EnquiriesUnhandled, long ProductsActive);

public record UpsertProductRequest(
    int? Id, int CategoryId, string Name, string? Slug, string? ShortDescription, string? Description,
    string Nature, decimal Price, string? ImageUrl, bool? IsCustomizable, string? Availability,
    int? LeadTimeDays, bool? IsActive);
public record SetAvailabilityRequest(string Availability);

public record UploadResultDto(string Url);
