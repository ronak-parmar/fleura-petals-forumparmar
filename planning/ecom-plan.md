# Fleuréa Petals — Build Plan (Minimal Ordering / E-Commerce Site)

Companion to [understand.md](understand.md). This is the technical plan for turning the
current static page (`test.html`) into a working ordering application that the project
report describes.

**Decisions locked in (from discussion):**

| Area | Decision |
|------|----------|
| Customer identity | **Optional accounts** — guest checkout works; registering is optional and only adds order history |
| Admin | **Minimal admin panel** — login, manage products, view/update orders, handle custom requests |
| Ordering model | **Multi-item cart** — browse → add to cart → single checkout |
| Custom bouquets | **Request / enquiry flow** — customer describes what they want, no price at submission, business responds |
| Payments | **Out of scope** — order is placed as "Pending / Pay on delivery"; no gateway |

**Stack (matches the report):** Next.js (React) · ASP.NET Core Web API (.NET) · PostgreSQL · VS Code

---

## Table of contents

1. [What we already have (`test.html`)](#1-what-we-already-have-testhtml)
2. [Scope](#2-scope)
3. [Architecture](#3-architecture)
4. [Data model (ER)](#4-data-model-er)
5. [Order & custom-request lifecycles](#5-order--custom-request-lifecycles)
6. [API design](#6-api-design)
7. [Frontend pages & components](#7-frontend-pages--components)
8. [Modules (for report Chapter 4.4)](#8-modules-for-report-chapter-44)
9. [Non-functional requirements](#9-non-functional-requirements)
10. [Repository / folder structure](#10-repository--folder-structure)
11. [Build plan mapped to the 12-week activity log](#11-build-plan-mapped-to-the-12-week-activity-log)
12. [Testing plan](#12-testing-plan)
13. [What to capture for the report](#13-what-to-capture-for-the-report)
14. [Assumptions & explicit non-goals](#14-assumptions--explicit-non-goals)

---

## 1. What we already have (`test.html`)

`test.html` is a **single static marketing page** — no JavaScript behaviour, no products,
no backend. Everything below is reusable design material, not application code.

**Reusable design system (extract into the Next.js app):**

- **Brand:** "Fleuréa" wordmark + ribbon/leaf SVG mark; ribbon-divider motif between sections
- **Display font:** `'Fleurea Display'` (italic serif, embedded as base64 `@font-face`)
- **Palette** (already named on the page):

  | Name | Hex | Use |
  |------|-----|-----|
  | Ivory | `#FBF3EE` | page background |
  | Blush | `#F3D7CE` | cards, soft fills |
  | Rosewood | `#A8493D` | primary buttons, accents |
  | Sage | `#93A583` | secondary accent |
  | Gold Thread | `#C6A063` | fine details, tags |
  | Ink | `#4A342E` | body text |

- **Sections present:** header nav · hero · "Two kinds of forever" (everlasting vs fresh) ·
  "From single stem to full bouquet" category grid · materials strip · testimonial · palette panel · footer with "Enquire"
- **Product language / categories the copy already implies:**
  - Ribbon Blooms (hand-wound satin ribbon, single stem → bouquet)
  - Pipe-Cleaner Posies (textured, playful, kids' gifts / décor)
  - Silk Bouquets (event-ready, weddings/venues)
  - Fresh & Gifted (same-day fresh arrangement + a paired gift)
  - Custom Orders (footer link, no flow yet)
- **Two product "natures":** *everlasting* (ribbon / pipe-cleaner / silk — made-to-order, lead time) and *fresh* (same-day, date-bound). This distinction should drive the catalogue filter and the checkout date logic.

**Plan:** rebuild the landing page as the Next.js home route using Tailwind, keep the
palette + font + ribbon motif, and grow the rest of the site around it.

---

## 2. Scope

### In scope

- Public catalogue: categories, product list with filters (category, nature, search), product detail
- Multi-item cart (client-side, persisted in `localStorage`)
- Guest checkout: contact details, delivery address, delivery date + slot, gift message, order review
- Order placement → order saved in PostgreSQL with a human-readable order number
- Order confirmation page + guest order tracking (order number + email)
- Custom bouquet **request** form (occasion, palette, flowers, size, budget range, need-by date, notes, optional inspiration image) + request tracking
- Footer "Enquire" contact form
- Optional customer accounts: register / login / "my orders" / "my custom requests" / saved addresses
- Minimal admin panel:
  - Admin login
  - Dashboard counts (orders by status, new custom requests, new enquiries, active products)
  - Products: create / edit / set availability / activate-deactivate / image upload
  - Categories: create / edit
  - Orders: list + filter by status, view detail, update status
  - Custom requests: list, view, set status, write a response / rough quote
  - Enquiries: list, mark handled

### Out of scope (state this in the report's Scope section too)

- Any payment gateway / online payment (order is "Pending", pay-on-delivery)
- Real inventory counts (products have availability *states*, not stock quantities)
- Automated email / SMS (notifications are shown in-app only; sending can be a stub)
- Delivery routing, maps, courier integration, live tracking
- Reviews & ratings, wishlists, discount codes, multi-currency
- Multi-admin roles / permissions (single "admin" role)

---

## 3. Architecture

Classic **three-tier** (this is exactly what report §3.5 needs):

```
┌─────────────────────────────┐
│  Presentation Layer         │   Next.js (React, TypeScript, Tailwind)
│  - Customer site            │   - Server components for catalogue
│  - Admin panel              │   - Client components for cart / forms
└──────────────┬──────────────┘
               │  HTTPS / JSON (REST, /api/v1)
┌──────────────▼──────────────┐
│  Application Layer          │   ASP.NET Core Web API (.NET)
│  Controllers → Services →   │   - JWT auth (customer + admin)
│  Repositories               │   - FluentValidation, DTOs
│                             │   - Swagger for docs/testing
└──────────────┬──────────────┘
               │  EF Core (Npgsql)
┌──────────────▼──────────────┐
│  Data Layer                 │   PostgreSQL
│  Tables + relationships     │   - EF Core migrations
│                             │   - Seed script for demo data
└─────────────────────────────┘
```

**Cross-cutting choices:**

- **Auth:** JWT bearer tokens. Customer tokens and admin tokens are separate audiences.
  Store the token in an `httpOnly` cookie (preferred) or `localStorage` for simplicity.
- **Validation:** `zod` + `react-hook-form` on the client; `FluentValidation` on the server (server is the source of truth).
- **Pricing:** all money handled server-side. Order line prices are **snapshotted** at
  order time (copy product name + unit price into `order_items`) so later product edits
  don't change historical orders.
- **Delivery fee:** single configurable flat fee, free above a configurable threshold. Kept in app config, not hard-coded in components.
- **Images:** admin uploads go to a local `uploads/` folder served as static files (or a `/wwwroot/uploads` path). URL stored in DB. No cloud storage needed for a college project.
- **IDs:** integer primary keys internally; separate human-readable `order_number` / `request_number` (e.g. `FP-2026-000042`) shown to customers.

---

## 4. Data model (ER)

### Tables

**`categories`**
| column | type | notes |
|---|---|---|
| id | int PK | |
| name | text | e.g. "Ribbon Blooms" |
| slug | text unique | |
| description | text | |
| sort_order | int | |
| is_active | bool | |

**`products`**
| column | type | notes |
|---|---|---|
| id | int PK | |
| category_id | int FK → categories | |
| name | text | |
| slug | text unique | |
| short_description | text | catalogue card |
| description | text | detail page |
| nature | enum | `everlasting` \| `fresh` |
| price | numeric(10,2) | |
| image_url | text | primary image |
| is_customizable | bool | shows "request a custom version" link |
| availability | enum | `available` \| `made_to_order` \| `sold_out` |
| lead_time_days | int | for made-to-order / everlasting |
| is_active | bool | soft delete / hide |
| created_at, updated_at | timestamptz | |

*(Optional `product_images` table — id, product_id FK, url, alt, sort_order — if multiple photos per product are wanted. Not required for minimal.)*

**`customers`**
| column | type | notes |
|---|---|---|
| id | int PK | |
| name | text | |
| email | text | unique when `is_registered` |
| phone | text | |
| password_hash | text null | null = guest, set = registered |
| is_registered | bool | |
| created_at | timestamptz | |

*A guest checkout creates (or reuses by email) a `customers` row with `is_registered = false`. Registering later can upgrade the same row.*

**`addresses`** *(only used by registered customers; guests type the address into the order)*
| column | type | notes |
|---|---|---|
| id | int PK | |
| customer_id | int FK → customers | |
| label | text | "Home", "Office" |
| recipient_name | text | |
| phone | text | |
| line1, line2 | text | |
| city, state | text | |
| postal_code | text | |
| landmark | text null | |

**`orders`**
| column | type | notes |
|---|---|---|
| id | int PK | |
| order_number | text unique | `FP-2026-000042` |
| customer_id | int FK → customers | |
| status | enum | see §5 |
| subtotal | numeric(10,2) | |
| delivery_fee | numeric(10,2) | |
| total | numeric(10,2) | |
| recipient_name | text | |
| recipient_phone | text | |
| address_line1, address_line2, city, state, postal_code, landmark | text | snapshot, not FK |
| delivery_date | date | |
| delivery_slot | enum | `morning` \| `afternoon` \| `evening` |
| gift_message | text null | |
| customer_note | text null | |
| placed_at | timestamptz | |
| updated_at | timestamptz | |

**`order_items`**
| column | type | notes |
|---|---|---|
| id | int PK | |
| order_id | int FK → orders (cascade) | |
| product_id | int FK → products | |
| product_name | text | snapshot |
| unit_price | numeric(10,2) | snapshot |
| quantity | int | |
| line_total | numeric(10,2) | |

**`custom_requests`**
| column | type | notes |
|---|---|---|
| id | int PK | |
| request_number | text unique | `FP-CR-2026-000007` |
| customer_id | int FK → customers, null | null allowed for pure guest |
| contact_name | text | |
| contact_email | text | |
| contact_phone | text | |
| bouquet_type | enum | `ribbon` \| `fresh` \| `mixed` |
| occasion | text | birthday, wedding, anniversary… |
| palette | text | colours wanted |
| flowers_preferred | text | |
| size | enum | `posy` \| `standard` \| `large` \| `event` |
| budget_min, budget_max | numeric(10,2) | |
| need_by_date | date | |
| reference_notes | text | |
| inspiration_image_url | text null | optional upload |
| status | enum | see §5 |
| admin_response | text null | |
| quoted_price | numeric(10,2) null | |
| created_at, updated_at | timestamptz | |

**`enquiries`** *(footer "Enquire" form)*
| column | type | notes |
|---|---|---|
| id | int PK | |
| name, email | text | |
| message | text | |
| is_handled | bool | |
| created_at | timestamptz | |

**`admin_users`**
| column | type | notes |
|---|---|---|
| id | int PK | |
| username | text unique | |
| email | text | |
| password_hash | text | BCrypt |
| last_login_at | timestamptz null | |

### Relationships (for the ER diagram)

- `categories` **1 — ∞** `products`
- `customers` **1 — ∞** `orders`
- `orders` **1 — ∞** `order_items`
- `products` **1 — ∞** `order_items`
- `customers` **1 — ∞** `addresses`
- `customers` **1 — ∞** `custom_requests` (optional side: a request may have no customer)

---

## 5. Order & custom-request lifecycles

### Order status

```
pending ──► confirmed ──► in_preparation ──► ready ──► out_for_delivery ──► delivered
   │             │                                                             
   └──────► cancelled ◄───────────────────────────────────────────────────────
```

- `pending` — placed by customer, not yet acknowledged by the business
- `confirmed` — business accepted the order
- `in_preparation` — bouquet being made / fresh stems sourced
- `ready` — packed, awaiting dispatch
- `out_for_delivery`
- `delivered` — done
- `cancelled` — by admin (customer requests cancellation via enquiry)

Admin can move an order forward or to `cancelled`. Status changes are the only mutation admin performs on an order.

### Custom request status

```
new ──► reviewing ──► quoted ──► accepted ──► converted_to_order ──► closed
  │           │           │           │
  └───────────┴───────────┴──────► declined ──► closed
```

- `new` → `reviewing` (admin reads it)
- `quoted` — admin has written `admin_response` + `quoted_price`
- `accepted` / `declined` — customer's answer (recorded by admin after contact)
- `converted_to_order` — admin creates a normal order from it (manual for the minimal version)
- `closed`

---

## 6. API design

Base path `/api/v1`. JSON everywhere. Errors as `{ error: { code, message, details } }`.

### Public — catalogue

| Method | Path | Purpose |
|---|---|---|
| GET | `/categories` | active categories |
| GET | `/products?category=&nature=&search=&page=&pageSize=` | paged product list |
| GET | `/products/{slug}` | product detail |

### Public — ordering

| Method | Path | Purpose |
|---|---|---|
| POST | `/orders` | place order — body: `{ items:[{productId, quantity}], contact:{name,email,phone}, delivery:{recipientName, phone, line1, line2, city, state, postalCode, landmark, date, slot}, giftMessage, customerNote }`. Server re-prices from DB, creates customer-by-email if needed, returns `{ orderNumber, total, status }` |
| GET | `/orders/{orderNumber}?email=` | guest order tracking |
| POST | `/custom-requests` | submit custom request → `{ requestNumber }` |
| GET | `/custom-requests/{requestNumber}?email=` | track custom request |
| POST | `/enquiries` | footer contact form |
| POST | `/uploads` | (rate-limited) inspiration image for custom request → `{ url }` |

### Customer accounts (optional)

| Method | Path | Purpose |
|---|---|---|
| POST | `/auth/register` | `{name,email,phone,password}` → JWT |
| POST | `/auth/login` | `{email,password}` → JWT |
| GET | `/auth/me` | current customer |
| GET | `/me/orders` | my orders |
| GET | `/me/custom-requests` | my requests |
| GET/POST/PUT/DELETE | `/me/addresses` | saved addresses |

When a logged-in customer checks out, `/orders` links the order to their `customer_id`.

### Admin

All under `/admin`, require admin JWT.

| Method | Path | Purpose |
|---|---|---|
| POST | `/admin/auth/login` | admin login |
| GET | `/admin/dashboard/summary` | counts for the dashboard |
| GET/POST/PUT | `/admin/categories` `/admin/categories/{id}` | manage categories |
| GET/POST/PUT | `/admin/products` `/admin/products/{id}` | manage products |
| PUT | `/admin/products/{id}/availability` | quick availability toggle |
| POST | `/admin/uploads` | product image upload |
| GET | `/admin/orders?status=&page=` | order list |
| GET | `/admin/orders/{id}` | order detail |
| PUT | `/admin/orders/{id}/status` | `{ status }` |
| GET | `/admin/custom-requests?status=` | list |
| GET | `/admin/custom-requests/{id}` | detail |
| PUT | `/admin/custom-requests/{id}` | `{ status, adminResponse, quotedPrice }` |
| GET | `/admin/enquiries` | list |
| PUT | `/admin/enquiries/{id}` | `{ isHandled }` |

---

## 7. Frontend pages & components

### Customer site (Next.js App Router)

| Route | Notes |
|---|---|
| `/` | landing — port `test.html` design; add "Shop" CTA |
| `/shop` | catalogue grid; filters: category, nature (everlasting/fresh), search; pagination |
| `/shop/[slug]` | product detail; qty selector; "Add to cart"; if `is_customizable`, link to `/custom?from=slug` |
| `/cart` | line items, qty edit, remove, subtotal + delivery fee estimate, "Checkout" |
| `/checkout` | steps in one page: contact → delivery (address, date, slot) → gift message → review → Place order. Date picker enforces `lead_time_days` for everlasting items and "today+1" minimum for fresh |
| `/order/confirmed/[orderNumber]` | success, summary, "save this number" |
| `/track` | form: order number + email → status timeline |
| `/custom` | custom bouquet request form (all fields from `custom_requests`), optional image upload |
| `/custom/received/[requestNumber]` | thank-you + tracking number |
| `/story` | about Fleuréa (from the report's Chapter 2) |
| `/enquire` | contact form (or modal from footer) |
| `/account/login`, `/account/register` | optional accounts |
| `/account` | tabs: My Orders, My Custom Requests, Addresses |

### Admin panel

| Route | Notes |
|---|---|
| `/admin/login` | |
| `/admin` | dashboard cards: orders by status, new custom requests, unhandled enquiries, active products |
| `/admin/products` · `/admin/products/new` · `/admin/products/[id]` | table + form, image upload, availability toggle |
| `/admin/categories` | inline table editing |
| `/admin/orders` · `/admin/orders/[id]` | filterable list; detail shows items + delivery + status dropdown |
| `/admin/custom-requests` · `/admin/custom-requests/[id]` | detail form: status, response text, quoted price |
| `/admin/enquiries` | list + "mark handled" |

### Shared components

`Header/Nav`, `Footer`, `RibbonDivider`, `ProductCard`, `PriceTag`, `AvailabilityBadge`,
`QuantityStepper`, `CartContext` (localStorage-backed), `CartDrawer`, `FilterBar`,
`AddressForm`, `DeliveryDatePicker`, `OrderStatusTimeline`, `FormField` (zod + react-hook-form),
`AdminTable`, `AdminLayout`, `AuthGuard`.

### Cart behaviour

- Cart lives in `localStorage` as `[{ productId, slug, name, price, image, quantity }]`
- On `/cart` and `/checkout`, the client re-validates against `/products/{slug}` (price + availability may have changed)
- `POST /orders` sends only `productId` + `quantity`; **server recomputes all money**
- Cart clears on successful order

---

## 8. Modules (for report Chapter 4.4)

| Module | Responsibility |
|---|---|
| **Catalogue Module** | categories, product listing, filtering/search, product detail |
| **Cart Module** | add / update / remove items, client-side persistence, live re-pricing |
| **Checkout & Order Module** | contact + delivery capture, delivery-date rules, order creation, confirmation, guest tracking |
| **Custom Request Module** | custom bouquet enquiry form, image upload, request tracking, lifecycle |
| **Customer Account Module** | register/login, order history, custom-request history, saved addresses |
| **Admin Product Management Module** | product & category CRUD, availability, image upload |
| **Admin Order Management Module** | order list/detail, status transitions, dashboard counts |
| **Admin Custom Request Module** | review requests, record response + quote, status |
| **Enquiry Module** | footer contact form + admin handling |
| **Authentication & Authorization Module** | JWT issue/verify, customer vs admin audiences, password hashing |
| **Data Management Module** | EF Core DbContext, migrations, repositories, seed data |

This is a clean set of 11 modules that maps directly onto the report's module-description section and the sample PDF's level of detail.

---

## 9. Non-functional requirements

| Attribute | Target |
|---|---|
| **Usability** | Customer can go home → product → cart → placed order in under 2 minutes with no instructions |
| **Performance** | Catalogue and product pages respond < 1.5 s on localhost; API calls < 300 ms typical |
| **Reliability** | Orders are written in a single DB transaction (order + items); partial writes impossible |
| **Security** | Passwords hashed with BCrypt; JWT expiry; admin routes require admin audience; server-side validation and re-pricing; parameterised queries via EF Core; basic rate limit on public POST endpoints |
| **Maintainability** | Layered backend (Controller/Service/Repository), typed DTOs, feature-foldered frontend |
| **Responsiveness** | Mobile-first; works 360 px → desktop |
| **Data integrity** | Foreign keys + enum constraints; price snapshots on order items |
| **Portability** | Runs on Windows 10/11 with .NET SDK, Node, and local PostgreSQL (or Docker Postgres) |

---

## 10. Repository / folder structure

```
fleurea-petals/
├── README.md
├── docs/                      # ER diagram, UML, wireframes, API notes (feeds the report)
│
├── backend/                   # ASP.NET Core Web API
│   └── src/
│       └── Fleurea.Api/
│           ├── Controllers/           # Public*, Admin*, Auth
│           ├── Domain/                # entities + enums
│           ├── Data/                  # AppDbContext, Migrations/, Seed.cs
│           ├── Dtos/
│           ├── Services/              # CatalogueService, OrderService, CustomRequestService, AuthService...
│           ├── Repositories/
│           ├── Validation/            # FluentValidation validators
│           ├── Infrastructure/        # JWT, password hasher, file storage
│           ├── appsettings.json
│           └── Program.cs
│
└── frontend/                  # Next.js (TypeScript)
    ├── src/
    │   ├── app/
    │   │   ├── (site)/                # /, /shop, /cart, /checkout, /custom, /account...
    │   │   └── admin/                 # /admin/*
    │   ├── components/
    │   ├── features/                  # catalogue/, cart/, checkout/, custom/, admin/
    │   ├── lib/                       # apiClient.ts, auth.ts, money.ts
    │   ├── styles/                    # tailwind config + Fleuréa tokens from test.html
    │   └── types/
    ├── public/
    └── package.json
```

---

## 11. Build plan mapped to the 12-week activity log

The report already contains a 12-week activity log. This is what actually happens each week
so the log stays truthful:

| Week | Report activity | Concrete work |
|---|---|---|
| 1 | Requirement gathering | Finalise title + 4 objectives; write this scope; list features |
| 2 | Study existing system | Document current ordering-by-DM process; write Chapter 2 field study |
| 3 | Software requirement analysis | Functional + non-functional requirements (§2, §9 here) |
| 4 | Database design (ER) | Model tables (§4), draw ER diagram, create EF Core entities + first migration |
| 5 | UI design (wireframes) | Wireframe home, shop, product, cart, checkout, custom form, admin; extract design tokens from `test.html` |
| 6 | Module 1 development | **Catalogue Module** — backend `/categories` + `/products`, seed data; frontend `/`, `/shop`, `/shop/[slug]` |
| 7 | Module 2 development | **Cart + Checkout & Order Module** — `CartContext`, `/cart`, `/checkout`, `POST /orders`, confirmation + `/track`; start **Custom Request Module** |
| 8 | Database integration | Wire frontend ↔ API end-to-end; finish migrations + seed; **Admin panel** (products + orders + custom requests); optional **Account Module** |
| 9 | Testing of modules | Run the test cases in §12; fix bugs; add server validation gaps |
| 10 | UI improvements | Port full `test.html` visual design, responsive pass, empty/error/loading states |
| 11 | Final testing + documentation | Regression pass; take screenshots; write Chapters 4–5; APA references |
| 12 | Demonstration + submission | Seeded demo data, run-through script, final report PDF |

---

## 12. Testing plan

Manual functional testing (a college project doesn't need an automated suite, though a few
xUnit tests on `OrderService` pricing would strengthen Chapter 5).

### Sample test cases (fill Actual + Status during Week 9/11)

| # | Scenario | Steps | Expected result |
|---|---|---|---|
| T1 | Home loads | Open `/` | Landing page renders with catalogue CTA |
| T2 | Browse catalogue | Open `/shop` | Active products shown with price + availability |
| T3 | Filter by nature | `/shop`, select "Fresh" | Only fresh products listed |
| T4 | Search | Type "ribbon" | Matching products only |
| T5 | Product detail | Open a product | Description, price, image, add-to-cart shown |
| T6 | Add to cart | Add product, qty 2 | Cart count = 2, subtotal correct |
| T7 | Update cart | Change qty, remove item | Totals recalculate |
| T8 | Checkout validation | Submit empty checkout | Field errors shown, no order created |
| T9 | Place order (guest) | Fill valid details, place | Order saved, order number shown, cart cleared |
| T10 | Server re-pricing | Tamper client price, place order | Order total uses DB price, not client value |
| T11 | Delivery date rule | Pick past / too-soon date for everlasting item | Rejected with message |
| T12 | Track order | `/track` with number + email | Correct status timeline |
| T13 | Track order — wrong email | Mismatched email | Not found / access denied |
| T14 | Custom request | Submit custom form | Request saved, request number shown |
| T15 | Custom request tracking | `/custom/received/...` then `/track` | Status = `new` |
| T16 | Enquiry form | Submit footer enquiry | Stored, admin sees it |
| T17 | Register + login | Create account, log in | JWT issued, `/account` accessible |
| T18 | Order history | Logged-in customer places order | Order appears in `/account` |
| T19 | Admin login | Valid / invalid credentials | Access granted / denied |
| T20 | Admin add product | Create product with image | Appears in `/shop` |
| T21 | Admin toggle availability | Set product `sold_out` | Catalogue shows badge, add-to-cart disabled |
| T22 | Admin order status | Move order `pending → confirmed → delivered` | Customer `/track` reflects each change |
| T23 | Admin custom request | Set status `quoted` + response + price | Customer tracking shows quote |
| T24 | DB persistence | Restart API, re-query order | Data still present in PostgreSQL |
| T25 | Responsive | Load site at 360 px width | Layout usable, no horizontal scroll |

---

## 13. What to capture for the report

**Diagrams (Chapter 3.5–3.7):**

- System architecture diagram (§3 above)
- **ER diagram** — from §4
- **Use-case diagram** — actors: *Guest*, *Registered Customer*, *Admin*; use cases: browse, search, add to cart, checkout, track order, submit custom request, register/login, manage products, manage orders, respond to custom request
- **Activity diagram** — "Place an order" (browse → cart → checkout → validate → save → confirm)
- **Sequence diagram** — checkout: Browser → Next.js → API `/orders` → OrderService → DbContext → PostgreSQL → response
- **Class diagram** — backend domain entities + services

**Screenshots (Chapter 4.5, 5.2, Appendix):**

Home, Shop (with filters), Product detail, Cart, Checkout, Order confirmation, Track order,
Custom request form, Custom request received, Account / order history, Admin dashboard,
Admin product form, Admin orders list, Admin order detail, Admin custom request detail.

**Code snippets (Chapter 4.6):**

- One Next.js component (e.g. `ProductCard` or `CartContext`)
- One .NET controller action + service method (`OrdersController.PlaceOrder` + `OrderService.CreateAsync` showing server-side re-pricing)
- One PostgreSQL / EF query (the paged product query, or raw SQL for the dashboard summary)

---

## 14. Assumptions & explicit non-goals

**Assumptions:**

- Single business, single admin account (seeded), single currency (INR)
- Delivery is local; delivery fee is a flat configurable amount with a free-above threshold
- "Availability" is a state set by admin, not a live stock count
- Email/SMS confirmations are represented on-screen; actually sending them is optional and stubbed
- Inspiration image upload is a single image, size-limited, stored locally

**Non-goals (repeat in the report's Scope so scope creep is documented):**

- No payment gateway / online payment
- No courier/logistics integration or live delivery tracking
- No reviews, ratings, wishlists, coupons, or loyalty
- No analytics dashboards beyond simple counts
- No role management beyond the single admin role
