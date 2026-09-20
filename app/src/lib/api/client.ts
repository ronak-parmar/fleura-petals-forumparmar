/**
 * THE swappable data layer. Every page/component calls functions from here —
 * never `fixtures.ts` or `fetch` directly. Each function has a `mock`
 * implementation (enforcing the same rules as database/functions.sql) and a
 * `live` implementation (plain fetch against the real API). Selected by
 * NEXT_PUBLIC_API_MODE ("mock" | "live"), default "mock".
 *
 * When the backend exists: implement the `live*` function bodies below and
 * flip the env var. No page/component code changes.
 */
import { ApiError } from "./types";
import type {
  Address,
  BouquetType,
  BouquetSize,
  Category,
  CreateCustomRequestPayload,
  CustomRequest,
  CustomRequestStatus,
  DashboardSummary,
  Enquiry,
  Order,
  OrderStatus,
  PlaceOrderPayload,
  Product,
  ProductAvailability,
  ProductFilter,
  ProductListResult,
} from "./types";
import * as db from "./fixtures";

const MODE = (process.env.NEXT_PUBLIC_API_MODE ?? "mock") as "mock" | "live";
const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:5080/api/v1";

const delay = (ms = 180) => new Promise((r) => setTimeout(r, ms));
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function err(status: number, code: string, message: string, fieldErrors?: Record<string, string>): never {
  throw new ApiError(message, code, status, fieldErrors);
}

// ---------------------------------------------------------------------------
// Fake session tokens for the mock layer only — format: "mock.customer.<id>"
// or "mock.admin". A real backend issues real JWTs; nothing here is secure
// and none of it is meant to be.
// ---------------------------------------------------------------------------
function mockCustomerFromToken(token: string | null | undefined) {
  if (!token || !token.startsWith("mock.customer.")) err(401, "UNAUTHENTICATED", "Not signed in.");
  const id = Number(token.split(".")[2]);
  const customer = db.customers.find((c) => c.id === id);
  if (!customer) err(401, "UNAUTHENTICATED", "Session is no longer valid.");
  return customer;
}
function requireAdmin(token: string | null | undefined) {
  if (token !== "mock.admin") err(401, "UNAUTHENTICATED", "Admin sign-in required.");
}

// ===========================================================================
// CATALOGUE
// ===========================================================================

export async function getCategories(): Promise<Category[]> {
  if (MODE === "live") return liveGet<Category[]>("/categories");
  await delay();
  return db.categories;
}

export async function getProducts(filter: ProductFilter = {}): Promise<ProductListResult> {
  if (MODE === "live") {
    const qs = new URLSearchParams();
    if (filter.category) qs.set("category", filter.category);
    if (filter.nature) qs.set("nature", filter.nature);
    if (filter.search) qs.set("search", filter.search);
    if (filter.page) qs.set("page", String(filter.page));
    if (filter.pageSize) qs.set("pageSize", String(filter.pageSize));
    return liveGet<ProductListResult>(`/products?${qs}`);
  }
  await delay();
  let items = db.products.filter((p) => p.isActive);
  if (filter.category) items = items.filter((p) => db.categories.find((c) => c.id === p.categoryId)?.slug === filter.category);
  if (filter.nature) items = items.filter((p) => p.nature === filter.nature);
  if (filter.search) {
    const s = filter.search.toLowerCase();
    items = items.filter((p) => p.name.toLowerCase().includes(s));
  }
  const totalCount = items.length;
  const page = Math.max(filter.page ?? 1, 1);
  const pageSize = Math.max(filter.pageSize ?? 12, 1);
  items = items.slice((page - 1) * pageSize, page * pageSize);
  return { items, totalCount };
}

export async function getProduct(slug: string): Promise<Product> {
  if (MODE === "live") return liveGet<Product>(`/products/${encodeURIComponent(slug)}`);
  await delay();
  const product = db.products.find((p) => p.slug === slug && p.isActive);
  if (!product) err(404, "PRODUCT_NOT_FOUND", "This product could not be found.");
  return product;
}

// ===========================================================================
// ORDERS
// ===========================================================================

function upsertGuestCustomer(name: string, email: string, phone: string) {
  let customer = db.customers.find((c) => c.email.toLowerCase() === email.toLowerCase());
  if (!customer) {
    customer = { id: db.customers.length + 1, name, email, phone, isRegistered: false };
    db.customers.push(customer);
  }
  return customer;
}

function validateDeliveryDate(product: Product, dateStr: string) {
  const date = new Date(dateStr + "T00:00:00");
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const minDays = product.nature === "everlasting" ? product.leadTimeDays : 1;
  const minDate = new Date(today); minDate.setDate(minDate.getDate() + minDays);
  if (isNaN(date.getTime()) || date < minDate) {
    err(400, "DELIVERY_TOO_SOON",
      product.nature === "everlasting"
        ? `${product.name} needs ${product.leadTimeDays} day(s) lead time.`
        : "Fresh items need next-day delivery at the earliest.");
  }
}

export async function placeOrder(payload: PlaceOrderPayload): Promise<Order> {
  if (MODE === "live") return livePost<Order>("/orders", payload);
  await delay(280);

  const fieldErrors: Record<string, string> = {};
  if (!payload.contact?.name) fieldErrors["contact.name"] = "Name is required.";
  if (!payload.contact?.email || !emailRe.test(payload.contact.email)) fieldErrors["contact.email"] = "A valid e-mail is required.";
  if (!payload.contact?.phone) fieldErrors["contact.phone"] = "Phone is required.";
  if (!payload.delivery?.line1) fieldErrors["delivery.line1"] = "Address line 1 is required.";
  if (!payload.delivery?.city) fieldErrors["delivery.city"] = "City is required.";
  if (!payload.delivery?.postalCode) fieldErrors["delivery.postalCode"] = "PIN code is required.";
  if (!payload.delivery?.date) fieldErrors["delivery.date"] = "Delivery date is required.";
  if (Object.keys(fieldErrors).length) err(400, "VALIDATION_FAILED", "Please fix the highlighted fields.", fieldErrors);

  if (!payload.items?.length) err(400, "EMPTY_ORDER", "Your cart is empty.");

  const resolved = payload.items.map((line) => {
    const product = db.products.find((p) => p.id === line.productId && p.isActive);
    if (!product) err(400, "PRODUCT_NOT_FOUND", `Product ${line.productId} was not found.`);
    if (product.availability === "sold_out") err(400, "PRODUCT_SOLD_OUT", `${product.name} is sold out.`);
    validateDeliveryDate(product, payload.delivery.date);
    const quantity = Math.max(line.quantity, 1);
    return { productId: product.id, productName: product.name, unitPrice: product.price, quantity, lineTotal: product.price * quantity };
  });

  const subtotal = resolved.reduce((s, l) => s + l.lineTotal, 0);
  const deliveryFee = subtotal >= 1500 ? 0 : 80;
  const customer = upsertGuestCustomer(payload.contact.name, payload.contact.email, payload.contact.phone);

  const order: Order = {
    id: db.orders.length + 100,
    orderNumber: db.nextOrderNumber(),
    status: "pending",
    subtotal, deliveryFee, total: subtotal + deliveryFee,
    recipientName: payload.delivery.recipientName, recipientPhone: payload.delivery.phone,
    addressLine1: payload.delivery.line1, addressLine2: payload.delivery.line2 ?? "",
    city: payload.delivery.city, state: payload.delivery.state ?? "Maharashtra",
    postalCode: payload.delivery.postalCode, landmark: payload.delivery.landmark ?? "",
    deliveryDate: payload.delivery.date, deliverySlot: payload.delivery.slot,
    giftMessage: payload.giftMessage ?? null, customerNote: payload.customerNote ?? null,
    placedAt: new Date().toISOString(), items: resolved,
  };
  db.orders.push(order);
  void customer;
  return order;
}

export async function getOrder(orderNumber: string, email: string): Promise<Order> {
  if (MODE === "live") return liveGet<Order>(`/orders/${encodeURIComponent(orderNumber)}?email=${encodeURIComponent(email)}`);
  await delay();
  const order = db.orders.find((o) => o.orderNumber === orderNumber);
  if (!order || !ownerEmailMatches(order, email)) err(404, "ORDER_NOT_FOUND", "No order found for that number and e-mail.");
  return order;
}

function ownerEmailMatches(order: Order, email: string) {
  // The seed order FP-2026-000042 belongs to Beena; guest orders created via
  // placeOrder() are matched by the customer record created at checkout time.
  if (order.orderNumber === "FP-2026-000042") return email.toLowerCase() === "beena.parmar@example.com";
  const owner = db.customers.find((c) => c.name === order.recipientName);
  return owner ? owner.email.toLowerCase() === email.toLowerCase() : true;
}

// ===========================================================================
// CUSTOM REQUESTS
// ===========================================================================

export async function createCustomRequest(payload: CreateCustomRequestPayload): Promise<CustomRequest> {
  if (MODE === "live") return livePost<CustomRequest>("/custom-requests", payload);
  await delay(280);

  const fieldErrors: Record<string, string> = {};
  if (!payload.contactName) fieldErrors.contactName = "Name is required.";
  if (!payload.contactEmail || !emailRe.test(payload.contactEmail)) fieldErrors.contactEmail = "A valid e-mail is required.";
  if (!payload.occasion) fieldErrors.occasion = "Occasion is required.";
  if (!payload.needByDate) fieldErrors.needByDate = "Need-by date is required.";
  if (payload.budgetMin != null && payload.budgetMax != null && payload.budgetMin > payload.budgetMax) {
    fieldErrors.budgetMin = "Minimum budget cannot be more than the maximum.";
  }
  if (Object.keys(fieldErrors).length) err(400, "VALIDATION_FAILED", "Please fix the highlighted fields.", fieldErrors);

  const request: CustomRequest = {
    id: db.customRequests.length + 100,
    requestNumber: db.nextRequestNumber(),
    ...payload,
    status: "new", adminResponse: null, quotedPrice: null,
    createdAt: new Date().toISOString(),
  };
  db.customRequests.push(request);
  return request;
}

export async function getCustomRequest(requestNumber: string, email: string): Promise<CustomRequest> {
  if (MODE === "live") return liveGet<CustomRequest>(`/custom-requests/${encodeURIComponent(requestNumber)}?email=${encodeURIComponent(email)}`);
  await delay();
  const request = db.customRequests.find(
    (r) => r.requestNumber === requestNumber && r.contactEmail.toLowerCase() === email.toLowerCase()
  );
  if (!request) err(404, "REQUEST_NOT_FOUND", "No request found for that number and e-mail.");
  return request;
}

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

/** Custom-request inspiration image. Mock mode keeps the file only as a local
 *  object URL (nothing is actually uploaded) — good enough for a preview. */
export async function uploadInspirationImage(file: File): Promise<{ url: string }> {
  if (MODE === "live") {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`${API_BASE}/uploads`, { method: "POST", body: form });
    if (!res.ok) err(res.status, "UPLOAD_FAILED", "Could not upload the image.");
    return res.json();
  }
  await delay(300);
  if (file.size > MAX_UPLOAD_BYTES) err(400, "FILE_TOO_LARGE", "Image must be under 5 MB.");
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) err(400, "UNSUPPORTED_TYPE", "Please attach a JPG, PNG or WebP image.");
  return { url: URL.createObjectURL(file) };
}

export async function createEnquiry(name: string, email: string, message: string): Promise<Enquiry> {
  if (MODE === "live") return livePost<Enquiry>("/enquiries", { name, email, message });
  await delay();
  if (!name || !email || !message) err(400, "VALIDATION_FAILED", "All fields are required.");
  const enquiry: Enquiry = { id: db.enquiries.length + 1, name, email, message, isHandled: false, createdAt: new Date().toISOString() };
  db.enquiries.push(enquiry);
  return enquiry;
}

// ===========================================================================
// CUSTOMER ACCOUNT
// ===========================================================================

export async function register(name: string, email: string, phone: string, password: string): Promise<{ token: string; customer: (typeof db.customers)[number] }> {
  if (MODE === "live") return livePost("/auth/register", { name, email, phone, password });
  await delay();
  if (password.length < 8) err(400, "VALIDATION_FAILED", "Password must be at least 8 characters.", { password: "Too short." });
  if (db.customers.some((c) => c.isRegistered && c.email.toLowerCase() === email.toLowerCase())) {
    err(409, "EMAIL_TAKEN", "An account with this e-mail already exists.");
  }
  let customer = db.customers.find((c) => c.email.toLowerCase() === email.toLowerCase());
  if (customer) { customer.isRegistered = true; customer.name = name; customer.phone = phone; }
  else { customer = { id: db.customers.length + 1, name, email, phone, isRegistered: true }; db.customers.push(customer); }
  return { token: `mock.customer.${customer.id}`, customer };
}

export async function login(email: string, password: string): Promise<{ token: string; customer: (typeof db.customers)[number] }> {
  if (MODE === "live") return livePost("/auth/login", { email, password });
  await delay();
  const customer = db.customers.find((c) => c.isRegistered && c.email.toLowerCase() === email.toLowerCase());
  // Mock layer accepts any password for a seeded/registered account except an
  // intentionally-wrong one, so the "wrong password" test case is reproducible.
  if (!customer || password === "wrong") err(401, "INVALID_CREDENTIALS", "E-mail or password is incorrect.");
  return { token: `mock.customer.${customer.id}`, customer };
}

export async function me(token: string | null): Promise<(typeof db.customers)[number]> {
  if (MODE === "live") return liveGet("/auth/me", token);
  await delay();
  return mockCustomerFromToken(token);
}

export async function myOrders(token: string | null): Promise<Order[]> {
  if (MODE === "live") return liveGet("/me/orders", token);
  await delay();
  const customer = mockCustomerFromToken(token);
  return db.orders.filter((o) => o.recipientName === customer.name || o.orderNumber === "FP-2026-000042");
}

export async function myCustomRequests(token: string | null): Promise<CustomRequest[]> {
  if (MODE === "live") return liveGet("/me/custom-requests", token);
  await delay();
  const customer = mockCustomerFromToken(token);
  return db.customRequests.filter((r) => r.contactEmail.toLowerCase() === customer.email.toLowerCase());
}

export async function myAddresses(token: string | null): Promise<Address[]> {
  if (MODE === "live") return liveGet("/me/addresses", token);
  await delay();
  const customer = mockCustomerFromToken(token);
  return db.addresses.filter((a) => a.customerId === customer.id);
}

export async function addAddress(token: string | null, address: Omit<Address, "id" | "customerId">): Promise<Address> {
  if (MODE === "live") return livePost("/me/addresses", address, token);
  await delay();
  const customer = mockCustomerFromToken(token);
  if (!address.line1 || !address.city || !address.postalCode) {
    err(400, "VALIDATION_FAILED", "Line 1, city and PIN code are required.");
  }
  const created: Address = { id: db.addresses.length + 1, customerId: customer.id, ...address };
  db.addresses.push(created);
  return created;
}

// ===========================================================================
// ADMIN
// ===========================================================================

export async function adminLogin(username: string, password: string): Promise<{ token: string }> {
  if (MODE === "live") return livePost("/admin/auth/login", { username, password });
  await delay();
  if (username !== db.adminUser.username || password !== db.adminUser.password) {
    err(401, "INVALID_CREDENTIALS", "Username or password is incorrect.");
  }
  return { token: "mock.admin" };
}

export async function adminDashboardSummary(token: string | null): Promise<DashboardSummary> {
  if (MODE === "live") return liveGet("/admin/dashboard/summary", token);
  await delay();
  requireAdmin(token);
  return db.dashboardSummary();
}

export async function adminListOrders(token: string | null, status?: OrderStatus): Promise<Order[]> {
  if (MODE === "live") return liveGet(`/admin/orders${status ? `?status=${status}` : ""}`, token);
  await delay();
  requireAdmin(token);
  return status ? db.orders.filter((o) => o.status === status) : [...db.orders].sort((a, b) => b.placedAt.localeCompare(a.placedAt));
}

export async function adminGetOrder(token: string | null, id: number): Promise<Order> {
  if (MODE === "live") return liveGet(`/admin/orders/${id}`, token);
  await delay();
  requireAdmin(token);
  const order = db.orders.find((o) => o.id === id);
  if (!order) err(404, "ORDER_NOT_FOUND", "Order not found.");
  return order;
}

const ORDER_FLOW: OrderStatus[] = ["pending", "confirmed", "in_preparation", "ready", "out_for_delivery", "delivered"];

export async function adminUpdateOrderStatus(token: string | null, id: number, status: OrderStatus): Promise<Order> {
  if (MODE === "live") return livePut(`/admin/orders/${id}/status`, { status }, token);
  await delay();
  requireAdmin(token);
  const order = db.orders.find((o) => o.id === id);
  if (!order) err(404, "ORDER_NOT_FOUND", "Order not found.");
  if (status === "cancelled") {
    if (!["pending", "confirmed"].includes(order.status)) err(409, "CANNOT_CANCEL", "This order is already in progress and cannot be cancelled.");
  } else {
    const curIx = ORDER_FLOW.indexOf(order.status);
    const newIx = ORDER_FLOW.indexOf(status);
    if (newIx === -1 || newIx <= curIx) err(409, "INVALID_TRANSITION", `Cannot move from ${order.status} to ${status}.`);
  }
  order.status = status;
  return order;
}

export async function adminListProducts(token: string | null): Promise<Product[]> {
  if (MODE === "live") return liveGet("/admin/products", token);
  await delay();
  requireAdmin(token);
  return db.products;
}

export async function adminUpsertProduct(token: string | null, product: Partial<Product> & { id?: number }): Promise<Product> {
  if (MODE === "live") return product.id ? livePut(`/admin/products/${product.id}`, product, token) : livePost("/admin/products", product, token);
  await delay();
  requireAdmin(token);
  if (!product.name || product.price == null || product.price < 0 || !product.categoryId) {
    err(400, "VALIDATION_FAILED", "Name, category and a non-negative price are required.");
  }
  if (product.id) {
    const existing = db.products.find((p) => p.id === product.id);
    if (!existing) err(404, "PRODUCT_NOT_FOUND", "Product not found.");
    Object.assign(existing, product);
    return existing;
  }
  const created: Product = {
    id: db.products.length + 1,
    categoryId: product.categoryId!,
    category: db.categories.find((c) => c.id === product.categoryId)?.name ?? "",
    name: product.name!, slug: product.slug ?? product.name!.toLowerCase().replace(/\s+/g, "-"),
    shortDescription: product.shortDescription ?? "", description: product.description ?? "",
    nature: product.nature ?? "everlasting", price: product.price!, imageUrl: product.imageUrl ?? "",
    isCustomizable: product.isCustomizable ?? false, availability: product.availability ?? "available",
    leadTimeDays: product.leadTimeDays ?? 1, isActive: product.isActive ?? true,
  };
  db.products.push(created);
  return created;
}

export async function adminSetProductAvailability(token: string | null, id: number, availability: ProductAvailability): Promise<Product> {
  if (MODE === "live") return livePut(`/admin/products/${id}/availability`, { availability }, token);
  await delay();
  requireAdmin(token);
  const product = db.products.find((p) => p.id === id);
  if (!product) err(404, "PRODUCT_NOT_FOUND", "Product not found.");
  product.availability = availability;
  return product;
}

export async function adminListCustomRequests(token: string | null, status?: CustomRequestStatus): Promise<CustomRequest[]> {
  if (MODE === "live") return liveGet(`/admin/custom-requests${status ? `?status=${status}` : ""}`, token);
  await delay();
  requireAdmin(token);
  return status ? db.customRequests.filter((r) => r.status === status) : db.customRequests;
}

export async function adminGetCustomRequest(token: string | null, id: number): Promise<CustomRequest> {
  if (MODE === "live") return liveGet(`/admin/custom-requests/${id}`, token);
  await delay();
  requireAdmin(token);
  const request = db.customRequests.find((r) => r.id === id);
  if (!request) err(404, "REQUEST_NOT_FOUND", "Request not found.");
  return request;
}

export async function adminRespondCustomRequest(
  token: string | null,
  id: number,
  patch: { status?: CustomRequestStatus; adminResponse?: string; quotedPrice?: number }
): Promise<CustomRequest> {
  if (MODE === "live") return livePut(`/admin/custom-requests/${id}`, patch, token);
  await delay();
  requireAdmin(token);
  const request = db.customRequests.find((r) => r.id === id);
  if (!request) err(404, "REQUEST_NOT_FOUND", "Request not found.");
  if (patch.status === "quoted" && patch.quotedPrice == null && request.quotedPrice == null) {
    err(400, "VALIDATION_FAILED", "A quote needs a price.", { quotedPrice: "Required when status is quoted." });
  }
  if (patch.quotedPrice != null && patch.quotedPrice < 0) err(400, "VALIDATION_FAILED", "Quote must be positive.");
  if (patch.status) request.status = patch.status;
  if (patch.adminResponse != null) request.adminResponse = patch.adminResponse;
  if (patch.quotedPrice != null) request.quotedPrice = patch.quotedPrice;
  return request;
}

export async function adminListEnquiries(token: string | null): Promise<Enquiry[]> {
  if (MODE === "live") return liveGet("/admin/enquiries", token);
  await delay();
  requireAdmin(token);
  return db.enquiries;
}

export async function adminMarkEnquiryHandled(token: string | null, id: number, handled: boolean): Promise<Enquiry> {
  if (MODE === "live") return livePut(`/admin/enquiries/${id}`, { isHandled: handled }, token);
  await delay();
  requireAdmin(token);
  const enquiry = db.enquiries.find((e) => e.id === id);
  if (!enquiry) err(404, "ENQUIRY_NOT_FOUND", "Enquiry not found.");
  enquiry.isHandled = handled;
  return enquiry;
}

export type { BouquetType, BouquetSize };

// ===========================================================================
// live* helpers — real fetch calls, used once NEXT_PUBLIC_API_MODE=live
// ===========================================================================

async function liveFetch<T>(path: string, init: RequestInit = {}, token?: string | null): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    err(res.status, body.code ?? "REQUEST_FAILED", body.message ?? res.statusText, body.fieldErrors);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}
const liveGet = <T,>(path: string, token?: string | null) => liveFetch<T>(path, { method: "GET" }, token);
const livePost = <T,>(path: string, body: unknown, token?: string | null) => liveFetch<T>(path, { method: "POST", body: JSON.stringify(body) }, token);
const livePut = <T,>(path: string, body: unknown, token?: string | null) => liveFetch<T>(path, { method: "PUT", body: JSON.stringify(body) }, token);
