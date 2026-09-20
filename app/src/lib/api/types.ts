/**
 * Types mirroring database/schema.sql and the request/response shapes used in
 * tests/Fleurea.http. Every page and every api/client.ts function shares these —
 * do not redeclare shapes locally in a page/component.
 */

export type ProductNature = "everlasting" | "fresh";
export type ProductAvailability = "available" | "made_to_order" | "sold_out";
export type OrderStatus =
  | "pending"
  | "confirmed"
  | "in_preparation"
  | "ready"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";
export type DeliverySlot = "morning" | "afternoon" | "evening";
export type CustomRequestStatus =
  | "new"
  | "reviewing"
  | "quoted"
  | "accepted"
  | "declined"
  | "converted_to_order"
  | "closed";
export type BouquetType = "ribbon" | "fresh" | "mixed";
export type BouquetSize = "posy" | "standard" | "large" | "event";

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  sortOrder: number;
}

export interface Product {
  id: number;
  categoryId: number;
  category: string; // category name, denormalised by fn_get_products
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  nature: ProductNature;
  price: number;
  imageUrl: string;
  isCustomizable: boolean;
  availability: ProductAvailability;
  leadTimeDays: number;
  isActive: boolean;
}

export interface ProductListResult {
  items: Product[];
  totalCount: number;
}

export interface ProductFilter {
  category?: string;
  nature?: ProductNature;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  isRegistered: boolean;
}

export interface Address {
  id: number;
  customerId: number;
  label: string;
  recipientName: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  landmark: string;
}

export interface CartLine {
  productId: number;
  slug: string;
  name: string;
  price: number;
  imageUrl: string;
  nature: ProductNature;
  leadTimeDays: number;
  quantity: number;
}

export interface OrderItem {
  productId: number;
  productName: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface Order {
  id: number;
  orderNumber: string;
  status: OrderStatus;
  subtotal: number;
  deliveryFee: number;
  total: number;
  recipientName: string;
  recipientPhone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  landmark: string;
  deliveryDate: string; // ISO date
  deliverySlot: DeliverySlot;
  giftMessage: string | null;
  customerNote: string | null;
  placedAt: string; // ISO datetime
  items: OrderItem[];
}

export interface PlaceOrderPayload {
  items: { productId: number; quantity: number }[];
  contact: { name: string; email: string; phone: string };
  delivery: {
    recipientName: string;
    phone: string;
    line1: string;
    line2?: string;
    city: string;
    state?: string;
    postalCode: string;
    landmark?: string;
    date: string; // ISO date
    slot: DeliverySlot;
  };
  giftMessage?: string;
  customerNote?: string;
}

export interface CustomRequest {
  id: number;
  requestNumber: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  bouquetType: BouquetType;
  occasion: string;
  palette: string;
  flowersPreferred: string;
  size: BouquetSize;
  budgetMin: number;
  budgetMax: number;
  needByDate: string;
  referenceNotes: string;
  inspirationImageUrl: string | null;
  status: CustomRequestStatus;
  adminResponse: string | null;
  quotedPrice: number | null;
  createdAt: string;
}

export type CreateCustomRequestPayload = Omit<
  CustomRequest,
  "id" | "requestNumber" | "status" | "adminResponse" | "quotedPrice" | "createdAt"
>;

export interface Enquiry {
  id: number;
  name: string;
  email: string;
  message: string;
  isHandled: boolean;
  createdAt: string;
}

export interface DashboardSummary {
  ordersPending: number;
  ordersInProgress: number;
  ordersDelivered: number;
  customRequestsNew: number;
  enquiriesUnhandled: number;
  productsActive: number;
}

/** Thrown by every client.ts function on a non-2xx result. */
export class ApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number,
    public fieldErrors?: Record<string, string>
  ) {
    super(message);
    this.name = "ApiError";
  }
}
