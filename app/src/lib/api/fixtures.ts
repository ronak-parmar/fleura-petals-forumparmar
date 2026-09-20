/**
 * In-memory mock "database" — mirrors database/seed.sql exactly (names, slugs,
 * prices) so fixture data and the real PostgreSQL seed never drift apart.
 * lib/api/client.ts (mock mode) reads and mutates this module's state.
 */
import type {
  Address,
  Category,
  CustomRequest,
  Customer,
  DashboardSummary,
  Enquiry,
  Order,
  Product,
} from "./types";

export const categories: Category[] = [
  { id: 1, name: "Ribbon Blooms", slug: "ribbon-blooms", description: "Hand-wound satin ribbon flowers, single stems to full arrangements.", sortOrder: 1 },
  { id: 2, name: "Pipe-Cleaner Posies", slug: "pipe-cleaner-posies", description: "Playful textured blooms with a soft handmade edge.", sortOrder: 2 },
  { id: 3, name: "Silk Bouquets", slug: "silk-bouquets", description: "Full, event-ready arrangements for weddings and venues.", sortOrder: 3 },
  { id: 4, name: "Fresh & Gifted", slug: "fresh-and-gifted", description: "Same-day fresh flower bouquets, optionally paired with a gift.", sortOrder: 4 },
];

const catName = (id: number) => categories.find((c) => c.id === id)!.name;

export const products: Product[] = [
  {
    id: 1, categoryId: 1, category: catName(1),
    name: "Rosewood Ribbon Bouquet", slug: "rosewood-ribbon-bouquet",
    shortDescription: "Deep rosewood satin roses on wired stems.",
    description: "A full bouquet of deep rosewood satin roses, each petal hand-wound from ribbon and set on wired stems. Holds its shape for years — a gift that outlasts the occasion it marked.",
    nature: "everlasting", price: 1450, imageUrl: "/images/products/rosewood-ribbon-bouquet.jpg", isCustomizable: true,
    availability: "available", leadTimeDays: 4, isActive: true,
  },
  {
    id: 2, categoryId: 2, category: catName(2),
    name: "Blush Pipe-Cleaner Posy", slug: "blush-pipe-cleaner-posy",
    shortDescription: "A small blush posy, a favourite for kids.",
    description: "Playful, textured blush blooms with a soft handmade edge — a favourite for kids' gifts and shelf décor.",
    nature: "everlasting", price: 650, imageUrl: "/images/products/blush-pipe-cleaner-posy.jpg", isCustomizable: true,
    availability: "available", leadTimeDays: 3, isActive: true,
  },
  {
    id: 3, categoryId: 3, category: catName(3),
    name: "Sage Garden Silk Bouquet", slug: "sage-garden-silk-bouquet",
    shortDescription: "Event-ready silk arrangement in sage & ivory.",
    description: "A full, event-ready silk arrangement in sage and ivory, dressed once and styled forever — built for weddings and venues.",
    nature: "everlasting", price: 2200, imageUrl: "/images/products/sage-garden-silk-bouquet.jpg", isCustomizable: true,
    availability: "made_to_order", leadTimeDays: 7, isActive: true,
  },
  {
    id: 4, categoryId: 4, category: catName(4),
    name: "Morning Market Fresh Bunch", slug: "morning-market-fresh-bunch",
    shortDescription: "Seasonal stems, arranged the morning of.",
    description: "Seasonal stems sourced each morning and arranged by hand, delivered the same day they're cut.",
    nature: "fresh", price: 900, imageUrl: "/images/products/morning-market-fresh-bunch.jpg", isCustomizable: false,
    availability: "available", leadTimeDays: 1, isActive: true,
  },
  {
    id: 5, categoryId: 4, category: catName(4),
    name: "Golden Hour Fresh & Gift", slug: "golden-hour-fresh-gift",
    shortDescription: "Fresh bouquet paired with a small gift.",
    description: "A fresh seasonal bouquet paired with a small considered gift for the person receiving it.",
    nature: "fresh", price: 1350, imageUrl: "/images/products/golden-hour-fresh-gift.jpg", isCustomizable: false,
    availability: "available", leadTimeDays: 1, isActive: true,
  },
  {
    id: 6, categoryId: 1, category: catName(1),
    name: "Petite Everlasting Jar", slug: "petite-everlasting-jar",
    shortDescription: "A jar of ribbon blooms for a shelf or desk.",
    description: "A jar of hand-wound ribbon blooms, sized for a shelf or a desk.",
    nature: "everlasting", price: 550, imageUrl: "/images/products/petite-everlasting-jar.jpg", isCustomizable: false,
    availability: "sold_out", leadTimeDays: 5, isActive: true,
  },
];

export const customers: Customer[] = [
  { id: 1, name: "Beena Parmar", email: "beena.parmar@example.com", phone: "9800000012", isRegistered: true },
  { id: 2, name: "Ronak Parmar", email: "ronak.parmar@example.com", phone: "9700000040", isRegistered: false },
];

export const addresses: Address[] = [
  {
    id: 1, customerId: 1, label: "Home", recipientName: "Beena Parmar", phone: "9800000012",
    line1: "14, Rose Villa, Linking Road", line2: "", city: "Mumbai", state: "Maharashtra",
    postalCode: "400052", landmark: "Near the bakery",
  },
];

export const orders: Order[] = [
  {
    id: 42, orderNumber: "FP-2026-000042", status: "in_preparation",
    subtotal: 3650, deliveryFee: 0, total: 3650,
    recipientName: "Beena Parmar", recipientPhone: "9800000012",
    addressLine1: "14, Rose Villa, Linking Road", addressLine2: "", city: "Mumbai",
    state: "Maharashtra", postalCode: "400052", landmark: "Near the bakery",
    deliveryDate: "2026-09-12", deliverySlot: "morning",
    giftMessage: "Happy birthday, Ma — these won't wilt, just like you asked.",
    customerNote: null, placedAt: "2026-09-09T20:12:00+05:30",
    items: [
      { productId: 1, productName: "Rosewood Ribbon Bouquet", unitPrice: 1450, quantity: 1, lineTotal: 1450 },
      { productId: 2, productName: "Blush Pipe-Cleaner Posy", unitPrice: 650, quantity: 2, lineTotal: 1300 },
      { productId: 4, productName: "Morning Market Fresh Bunch", unitPrice: 900, quantity: 1, lineTotal: 900 },
    ],
  },
];

export const customRequests: CustomRequest[] = [
  {
    id: 7, requestNumber: "FP-CR-2026-000007",
    contactName: "Ronak Parmar", contactEmail: "ronak.parmar@example.com", contactPhone: "9700000040",
    bouquetType: "mixed", occasion: "25th wedding anniversary",
    palette: "Ivory, blush, a little gold", flowersPreferred: "Roses and lisianthus",
    size: "large", budgetMin: 2500, budgetMax: 4000, needByDate: "2026-10-02",
    referenceNotes: "Something that photographs well on a dinner table.",
    inspirationImageUrl: null, status: "reviewing", adminResponse: null, quotedPrice: null,
    createdAt: "2026-09-08T11:00:00+05:30",
  },
];

export const enquiries: Enquiry[] = [];

/** Seeded admin — matches database/seed.sql. Password is illustrative only. */
export const adminUser = { name: "Forum Parmar", username: "forum", password: "petals123" };

export function dashboardSummary(): DashboardSummary {
  return {
    ordersPending: orders.filter((o) => o.status === "pending").length + 3, // +3: other seeded orders not modelled here
    ordersInProgress: orders.filter((o) =>
      ["confirmed", "in_preparation", "ready", "out_for_delivery"].includes(o.status)
    ).length + 5,
    ordersDelivered: 12,
    customRequestsNew: customRequests.filter((r) => r.status === "new").length + 1,
    enquiriesUnhandled: enquiries.filter((e) => !e.isHandled).length + 3,
    productsActive: products.filter((p) => p.isActive).length,
  };
}

let nextOrderSeq = 43;
let nextRequestSeq = 8;
export function nextOrderNumber() {
  return `FP-2026-${String(nextOrderSeq++).padStart(6, "0")}`;
}
export function nextRequestNumber() {
  return `FP-CR-2026-${String(nextRequestSeq++).padStart(6, "0")}`;
}
