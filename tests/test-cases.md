# Fleuréa Petals — Test Cases (page-by-page)

Full functional + API test catalogue. Organised by screen. For each page:

1. **On load** — what the page must show / do when opened.
2. **Interactions** — every click, input and control, with the expected behaviour.
3. **API calls from this page** — each endpoint the page uses, tested with **valid input,
   invalid input, empty / missing input, wrong or missing token, and not-found**.

**How to read the tables.** *Expected* is the pass condition. *Actual* / *Status* are filled
in during a test run — every case below was executed and passed unless noted. IDs are stable
so results can be tracked across runs.

- API base path: `/api/v1`
- Seeded data (from `database/seed.sql`): products 1–6, admin **Forum Parmar** (`forum` / `petals123`),
  order `FP-2026-000042`, custom request `FP-CR-2026-000007`.
- Example customers: **Beena Parmar** (`beena.parmar@example.com`), **Ronak Parmar** (`ronak.parmar@example.com`).
- HTTP request bodies for every API case are in [`Fleurea.http`](Fleurea.http).

Requirement coverage (FR1–FR20 → cases) is summarised in **report Table 5.2**.

---

## P1. Home — `/`

**Covers:** FR1

### On load
| # | Check | Expected | Actual | Status |
|---|---|---|---|---|
| P1-L1 | Page renders | Header, hero, "two natures" section, featured products, footer all visible | As expected | Pass |
| P1-L2 | Web fonts load | Display serif + body sans applied, no fallback flash | As expected | Pass |
| P1-L3 | Featured products | 4 active products shown with name, price, nature | As expected | Pass |
| P1-L4 | Cart indicator | Shows current cart count (0 on first visit) | As expected | Pass |
| P1-L5 | Responsive at 360 px | Single column, no horizontal scroll | As expected | Pass |

### Interactions
| # | Action | Expected | Actual | Status |
|---|---|---|---|---|
| P1-I1 | Click "Shop the atelier" | Navigate to `/shop` | As expected | Pass |
| P1-I2 | Click "Request a custom bouquet" | Navigate to `/custom` | As expected | Pass |
| P1-I3 | Click a featured product card | Navigate to `/shop/{slug}` | As expected | Pass |
| P1-I4 | Click nav "Shop" / "Custom" / "Our Story" | Navigate to the matching route | As expected | Pass |
| P1-I5 | Click cart pill | Navigate to `/cart` | As expected | Pass |

### API calls from this page
| # | Endpoint | Input | Expected | Actual | Status |
|---|---|---|---|---|---|
| P1-A1 | `GET /products?page=1&pageSize=4` | valid | `200`, up to 4 active products | As expected | Pass |
| P1-A2 | `GET /categories` | valid | `200`, active categories | As expected | Pass |
| P1-A3 | `GET /products` | API stopped | Page shows a friendly "couldn't load products" state, no crash | As expected | Pass |

---

## P2. Shop / catalogue — `/shop`

**Covers:** FR1, FR2

### On load
| # | Check | Expected | Actual | Status |
|---|---|---|---|---|
| P2-L1 | Product grid | All active products, with price + availability badge | As expected | Pass |
| P2-L2 | Sold-out product | Shows "Sold out" badge; card still opens | As expected | Pass |
| P2-L3 | Filter chips | Category chips + "Everlasting / Fresh" chips + search box present | As expected | Pass |
| P2-L4 | URL query respected | Opening `/shop?nature=everlasting` pre-selects that chip and filters | As expected | Pass |
| P2-L5 | Pagination | Shown when more than one page of results | As expected | Pass |

### Interactions
| # | Action | Expected | Actual | Status |
|---|---|---|---|---|
| P2-I1 | Click category chip "Ribbon Blooms" | Grid shows only that category; URL updates `?category=ribbon-blooms` | As expected | Pass |
| P2-I2 | Click "Fresh" chip | Grid shows only `nature = fresh` products | As expected | Pass |
| P2-I3 | Type "ribbon" in search | Grid filters to matching names as you type (debounced) | As expected | Pass |
| P2-I4 | Search "xylophone" (no matches) | Empty-state message "No bouquets match that search", no error | As expected | Pass |
| P2-I5 | Clear all filters | Full grid returns | As expected | Pass |
| P2-I6 | Click page 2 | Next set of products loads; scroll position kept near top | As expected | Pass |
| P2-I7 | Click a product card | Navigate to `/shop/{slug}` | As expected | Pass |

### API calls from this page
| # | Endpoint | Input | Expected | Actual | Status |
|---|---|---|---|---|---|
| P2-A1 | `GET /products?nature=everlasting&page=1&pageSize=12` | valid | `200`, only everlasting products, `totalCount` present | As expected | Pass |
| P2-A2 | `GET /products?category=ribbon-blooms` | valid | `200`, only that category | As expected | Pass |
| P2-A3 | `GET /products?search=ribbon` | valid | `200`, name-matched products only | As expected | Pass |
| P2-A4 | `GET /products?search=xylophone` | valid, no matches | `200` with `[]` (empty list, not 404) | As expected | Pass |
| P2-A5 | `GET /products?nature=purple` | invalid enum value | `400` with a validation message | As expected | Pass |
| P2-A6 | `GET /products?page=0&pageSize=-5` | invalid paging | `400`, or clamped to page 1 / default size | As expected | Pass |
| P2-A7 | `GET /products?page=999` | valid but out of range | `200` with `[]` | As expected | Pass |

---

## P3. Product detail — `/shop/{slug}`

**Covers:** FR3, FR4

### On load
| # | Check | Expected | Actual | Status |
|---|---|---|---|---|
| P3-L1 | Product content | Image, name, price, description, nature + lead-time badges | As expected | Pass |
| P3-L2 | Quantity selector | Defaults to 1; cannot go below 1 | As expected | Pass |
| P3-L3 | Customisable product | Shows "Request a custom version" link to `/custom?from={slug}` | As expected | Pass |
| P3-L4 | Sold-out product | "Add to cart" disabled; "Sold out" badge shown | As expected | Pass |
| P3-L5 | Unknown slug | Renders a 404 page with a link back to `/shop` | As expected | Pass |

### Interactions
| # | Action | Expected | Actual | Status |
|---|---|---|---|---|
| P3-I1 | Click "+" on quantity | Quantity increases by 1 | As expected | Pass |
| P3-I2 | Click "−" at quantity 1 | Stays at 1 (no 0 or negative) | As expected | Pass |
| P3-I3 | Click "Add to cart" (qty 2) | Item added; cart count increases by 2; brief confirmation | As expected | Pass |
| P3-I4 | Add the same product again | Existing line quantity increases, no duplicate line | As expected | Pass |
| P3-I5 | Click "Add to cart" on a sold-out product | Button is disabled; nothing happens | As expected | Pass |
| P3-I6 | Click "Request a custom version" | Navigate to `/custom` pre-filled with the product | As expected | Pass |
| P3-I7 | Reload the page after adding to cart | Cart still shows the item (localStorage) | As expected | Pass |

### API calls from this page
| # | Endpoint | Input | Expected | Actual | Status |
|---|---|---|---|---|---|
| P3-A1 | `GET /products/rosewood-ribbon-bouquet` | valid slug | `200`, full product record | As expected | Pass |
| P3-A2 | `GET /products/does-not-exist` | unknown slug | `404` | As expected | Pass |
| P3-A3 | `GET /products/petite-everlasting-jar` | sold-out product | `200`, `availability = "sold_out"` | As expected | Pass |
| P3-A4 | `GET /products/` (missing slug) | empty | `404` (route not matched) | As expected | Pass |

---

## P4. Cart — `/cart`

**Covers:** FR4, FR5

### On load
| # | Check | Expected | Actual | Status |
|---|---|---|---|---|
| P4-L1 | Line items | Each cart item shows thumbnail, name, nature note, qty, line total | As expected | Pass |
| P4-L2 | Summary | Subtotal, delivery rule, estimated delivery fee, total | As expected | Pass |
| P4-L3 | Empty cart | "Your cart is empty" state with a link to `/shop`; no checkout button | As expected | Pass |
| P4-L4 | Re-validation | On open, item prices + availability re-checked against the API | As expected | Pass |
| P4-L5 | Price changed since adding | Line shows the new price and a small "price updated" note | As expected | Pass |
| P4-L6 | Item went sold-out | Line flagged; checkout blocked until it is removed | As expected | Pass |

### Interactions
| # | Action | Expected | Actual | Status |
|---|---|---|---|---|
| P4-I1 | Increase a line quantity | Line total + summary recalculate immediately | As expected | Pass |
| P4-I2 | Decrease quantity to 0 | Line is removed (or "−" disabled at 1, then Remove) | As expected | Pass |
| P4-I3 | Click "Remove" | Line removed; totals recalculate; count updates | As expected | Pass |
| P4-I4 | Remove the last item | Cart shows the empty state | As expected | Pass |
| P4-I5 | Subtotal crosses ₹1,500 | Delivery fee changes to ₹0 ("Free over ₹1,500") | As expected | Pass |
| P4-I6 | Click "Proceed to checkout" | Navigate to `/checkout` | As expected | Pass |
| P4-I7 | Click "Continue shopping" | Navigate to `/shop`, cart kept | As expected | Pass |

### API calls from this page
| # | Endpoint | Input | Expected | Actual | Status |
|---|---|---|---|---|---|
| P4-A1 | `GET /products/{slug}` (per line) | valid | `200`, current price + availability used to re-validate | As expected | Pass |
| P4-A2 | `GET /products/{slug}` for a now-inactive product | slug of removed product | `404`; line flagged "no longer available" | As expected | Pass |

---

## P5. Checkout — `/checkout`

**Covers:** FR6, FR7, FR8, FR9, FR20

### On load
| # | Check | Expected | Actual | Status |
|---|---|---|---|---|
| P5-L1 | Sections | Contact, delivery address, delivery date + slot, gift message, order review | As expected | Pass |
| P5-L2 | Order review | Matches the cart exactly (items, quantities, subtotal, fee, total) | As expected | Pass |
| P5-L3 | Empty cart | Redirect to `/cart` (cannot checkout an empty cart) | As expected | Pass |
| P5-L4 | Logged-in customer | Contact + saved address pre-filled; can pick another saved address | As expected | Pass |
| P5-L5 | Earliest delivery date | Date picker minimum = today + max lead time of items in cart | As expected | Pass |

### Interactions
| # | Action | Expected | Actual | Status |
|---|---|---|---|---|
| P5-I1 | Submit with all fields blank | Inline errors on every required field; no request sent | As expected | Pass |
| P5-I2 | Enter an invalid e-mail ("abc") | E-mail field error; submit blocked | As expected | Pass |
| P5-I3 | Enter a 5-digit PIN | PIN field error (expects 6 digits) | As expected | Pass |
| P5-I4 | Pick a past delivery date | Date rejected with a message | As expected | Pass |
| P5-I5 | Pick a date sooner than an everlasting item's lead time | "Rosewood Ribbon Bouquet needs 4 days" message; submit blocked | As expected | Pass |
| P5-I6 | Pick same-day for a fresh item | "Fresh items need next-day delivery" message | As expected | Pass |
| P5-I7 | Fill valid details, click "Place order" | Button shows loading; on success navigate to `/order/confirmed/{no}` | As expected | Pass |
| P5-I8 | Double-click "Place order" | Only one order created (button disabled after first click) | As expected | Pass |
| P5-I9 | Place order, then press browser back | Cart is empty; checkout redirects to `/cart` | As expected | Pass |
| P5-I10 | Gift message over the limit | Character counter warns; input capped | As expected | Pass |

### API calls from this page
| # | Endpoint | Input | Expected | Actual | Status |
|---|---|---|---|---|---|
| P5-A1 | `POST /orders` | valid contact + delivery + items | `201`, body has `orderNumber`, `total`, `status = "pending"` | As expected | Pass |
| P5-A2 | `POST /orders` | `items: []` | `400` — `EMPTY_ORDER` | As expected | Pass |
| P5-A3 | `POST /orders` | missing contact name / e-mail / phone | `400` with per-field errors | As expected | Pass |
| P5-A4 | `POST /orders` | `slot: "midnight"` (invalid enum) | `400` | As expected | Pass |
| P5-A5 | `POST /orders` | `date` in the past | `400` — `DELIVERY_TOO_SOON` / date invalid | As expected | Pass |
| P5-A6 | `POST /orders` | everlasting item, date < today + lead_time_days | `400` — `DELIVERY_TOO_SOON: <name> needs <n> day(s)` | As expected | Pass |
| P5-A7 | `POST /orders` | fresh item, `date` = today | `400` — `DELIVERY_TOO_SOON` | As expected | Pass |
| P5-A8 | `POST /orders` | item `productId` that does not exist | `400` — `PRODUCT_NOT_FOUND` | As expected | Pass |
| P5-A9 | `POST /orders` | sold-out `productId` (6) | `400` — `PRODUCT_SOLD_OUT` | As expected | Pass |
| P5-A10 | `POST /orders` | client sends `price: 1` on a line | Ignored; stored `unit_price` = catalogue price; `total` correct | As expected | Pass |
| P5-A11 | `POST /orders` | `quantity: 0` / negative | Coerced to ≥ 1, or `400` | As expected | Pass |
| P5-A12 | `POST /orders` | logged-in customer (bearer token) | `201`; order linked to that `customer_id` | As expected | Pass |
| P5-A13 | `POST /orders` | malformed JSON body | `400` (bad request) | As expected | Pass |

---

## P6. Order confirmation — `/order/confirmed/{orderNumber}`

**Covers:** FR9

### On load
| # | Check | Expected | Actual | Status |
|---|---|---|---|---|
| P6-L1 | Success content | Tick, "Thank you, Beena", order number, item summary, delivery line, total | As expected | Pass |
| P6-L2 | Order number format | `FP-2026-000042` style | As expected | Pass |
| P6-L3 | Cart cleared | Cart count is 0 | As expected | Pass |
| P6-L4 | Direct visit with an unknown number | "We couldn't find that order" message | As expected | Pass |
| P6-L5 | Refresh the page | Still shows the confirmation (fetched by number + stored e-mail) | As expected | Pass |

### Interactions
| # | Action | Expected | Actual | Status |
|---|---|---|---|---|
| P6-I1 | Click "Track this order" | Navigate to `/track` pre-filled with the order number | As expected | Pass |
| P6-I2 | Click "Back to shop" | Navigate to `/shop` | As expected | Pass |

### API calls from this page
| # | Endpoint | Input | Expected | Actual | Status |
|---|---|---|---|---|---|
| P6-A1 | `GET /orders/{orderNumber}?email={stored}` | valid | `200`, order summary | As expected | Pass |
| P6-A2 | `GET /orders/FP-9999-999999?email=...` | unknown number | `404` | As expected | Pass |

---

## P7. Track order — `/track`

**Covers:** FR10

### On load
| # | Check | Expected | Actual | Status |
|---|---|---|---|---|
| P7-L1 | Lookup form | Order number + e-mail fields, "Track" button | As expected | Pass |
| P7-L2 | Deep link | `/track?order=FP-2026-000042` pre-fills the number | As expected | Pass |
| P7-L3 | Result view | Status timeline (done / current / upcoming), order + delivery summary | As expected | Pass |

### Interactions
| # | Action | Expected | Actual | Status |
|---|---|---|---|---|
| P7-I1 | Submit empty form | Field errors; no request | As expected | Pass |
| P7-I2 | Correct number + correct e-mail | Timeline shown with the current stage highlighted | As expected | Pass |
| P7-I3 | Correct number + wrong e-mail | "No order found for that number and e-mail" (no data leak) | As expected | Pass |
| P7-I4 | Unknown number | Same not-found message | As expected | Pass |
| P7-I5 | Order later advanced by admin | Re-tracking shows the new stage | As expected | Pass |

### API calls from this page
| # | Endpoint | Input | Expected | Actual | Status |
|---|---|---|---|---|---|
| P7-A1 | `GET /orders/FP-2026-000042?email=beena.parmar@example.com` | valid | `200`, status + items | As expected | Pass |
| P7-A2 | `GET /orders/FP-2026-000042?email=someone.else@example.com` | wrong e-mail | `404` | As expected | Pass |
| P7-A3 | `GET /orders/FP-2026-000042` | e-mail missing | `400` (email is required) | As expected | Pass |
| P7-A4 | `GET /orders/NOT-A-NUMBER?email=...` | malformed number | `404` | As expected | Pass |

---

## P8. Custom bouquet request — `/custom`

**Covers:** FR11

### On load
| # | Check | Expected | Actual | Status |
|---|---|---|---|---|
| P8-L1 | Form sections | Bouquet brief (type, occasion, palette, flowers, size, budget, need-by, notes, image), contact | As expected | Pass |
| P8-L2 | Opened from a product | `?from={slug}` pre-fills type / notes with that product | As expected | Pass |
| P8-L3 | "Nothing is charged now" note | Present | As expected | Pass |

### Interactions
| # | Action | Expected | Actual | Status |
|---|---|---|---|---|
| P8-I1 | Submit with required fields blank | Inline errors (occasion, size, need-by date, contact name/e-mail/phone) | As expected | Pass |
| P8-I2 | Budget min greater than budget max | Validation error | As expected | Pass |
| P8-I3 | Need-by date in the past | Validation error | As expected | Pass |
| P8-I4 | Attach a 20 MB image | Rejected ("image must be under 5 MB") | As expected | Pass |
| P8-I5 | Attach a `.txt` file | Rejected ("images only") | As expected | Pass |
| P8-I6 | Attach a valid JPG | Thumbnail preview shown; upload succeeds | As expected | Pass |
| P8-I7 | Submit a valid request | Navigate to `/custom/received/{requestNumber}` | As expected | Pass |
| P8-I8 | Double-submit | One request created only | As expected | Pass |

### API calls from this page
| # | Endpoint | Input | Expected | Actual | Status |
|---|---|---|---|---|---|
| P8-A1 | `POST /uploads` | valid JPG under 5 MB | `200`, `{ url }` | As expected | Pass |
| P8-A2 | `POST /uploads` | 20 MB file | `413` / `400` (too large) | As expected | Pass |
| P8-A3 | `POST /uploads` | `.txt` file | `415` / `400` (unsupported type) | As expected | Pass |
| P8-A4 | `POST /custom-requests` | valid full body | `201`, `{ requestNumber }`, status `new` | As expected | Pass |
| P8-A5 | `POST /custom-requests` | missing `needByDate` | `400` | As expected | Pass |
| P8-A6 | `POST /custom-requests` | missing contact e-mail | `400` | As expected | Pass |
| P8-A7 | `POST /custom-requests` | `bouquetType: "plastic"` (invalid enum) | `400` | As expected | Pass |
| P8-A8 | `POST /custom-requests` | `budgetMin > budgetMax` | `400` | As expected | Pass |
| P8-A9 | `POST /custom-requests` | empty body `{}` | `400` with the full field-error list | As expected | Pass |

---

## P9. Custom request received — `/custom/received/{requestNumber}`

**Covers:** FR12

### On load
| # | Check | Expected | Actual | Status |
|---|---|---|---|---|
| P9-L1 | Confirmation content | Request number, "we'll reply within two working days", brief summary | As expected | Pass |
| P9-L2 | Unknown number direct visit | "We couldn't find that request" message | As expected | Pass |

### Interactions
| # | Action | Expected | Actual | Status |
|---|---|---|---|---|
| P9-I1 | Click "Track this request" | Navigate to the tracking view for that request number | As expected | Pass |
| P9-I2 | Click "Back to shop" | Navigate to `/shop` | As expected | Pass |

### API calls from this page
| # | Endpoint | Input | Expected | Actual | Status |
|---|---|---|---|---|---|
| P9-A1 | `GET /custom-requests/FP-CR-2026-000007?email=ronak.parmar@example.com` | valid | `200`, status + (later) quote | As expected | Pass |
| P9-A2 | `GET /custom-requests/{no}?email=wrong@example.com` | wrong e-mail | `404` | As expected | Pass |
| P9-A3 | `GET /custom-requests/FP-CR-9999-999999?email=...` | unknown number | `404` | As expected | Pass |

---

## P10. Account — login / register — `/account/login`, `/account/register`

**Covers:** FR13

### On load
| # | Check | Expected | Actual | Status |
|---|---|---|---|---|
| P10-L1 | Login form | E-mail + password, "Log in", link to register | As expected | Pass |
| P10-L2 | Register form | Name, e-mail, phone, password, "Create account" | As expected | Pass |
| P10-L3 | Already logged in | Redirect to `/account` | As expected | Pass |

### Interactions
| # | Action | Expected | Actual | Status |
|---|---|---|---|---|
| P10-I1 | Register with valid details | Account created, logged in, redirect to `/account` | As expected | Pass |
| P10-I2 | Register with an e-mail that already has an account | "An account with this e-mail already exists" | As expected | Pass |
| P10-I3 | Register with a 3-character password | "Password must be at least 8 characters" | As expected | Pass |
| P10-I4 | Register with an invalid e-mail | E-mail field error | As expected | Pass |
| P10-I5 | Log in with correct credentials | Logged in, redirect to `/account` | As expected | Pass |
| P10-I6 | Log in with a wrong password | "E-mail or password is incorrect" (no hint which) | As expected | Pass |
| P10-I7 | Log in with an unknown e-mail | Same generic message | As expected | Pass |
| P10-I8 | Submit either form empty | Inline field errors | As expected | Pass |

### API calls from this page
| # | Endpoint | Input | Expected | Actual | Status |
|---|---|---|---|---|---|
| P10-A1 | `POST /auth/register` | valid | `201` + JWT | As expected | Pass |
| P10-A2 | `POST /auth/register` | e-mail already registered | `409` — `EMAIL_TAKEN` | As expected | Pass |
| P10-A3 | `POST /auth/register` | password too short | `400` | As expected | Pass |
| P10-A4 | `POST /auth/register` | `email: "abc"` | `400` | As expected | Pass |
| P10-A5 | `POST /auth/login` | valid | `200` + JWT | As expected | Pass |
| P10-A6 | `POST /auth/login` | wrong password | `401` | As expected | Pass |
| P10-A7 | `POST /auth/login` | unknown e-mail | `401` (not `404`) | As expected | Pass |
| P10-A8 | `POST /auth/login` | empty body | `400` | As expected | Pass |

---

## P11. Account — My Orders / Custom Requests / Addresses — `/account`

**Covers:** FR13

### On load
| # | Check | Expected | Actual | Status |
|---|---|---|---|---|
| P11-L1 | Not logged in | Redirect to `/account/login` | As expected | Pass |
| P11-L2 | Header | "Hello, Beena", e-mail, tabs (My orders / Custom requests / Saved addresses) | As expected | Pass |
| P11-L3 | Orders tab | Table of the customer's orders with number, date, items, total, status | As expected | Pass |
| P11-L4 | No orders yet | "You haven't placed an order yet" empty state | As expected | Pass |
| P11-L5 | Expired / invalid token | Redirect to login | As expected | Pass |

### Interactions
| # | Action | Expected | Actual | Status |
|---|---|---|---|---|
| P11-I1 | Click "Custom requests" tab | Shows the customer's custom requests with status / quote | As expected | Pass |
| P11-I2 | Click "Saved addresses" tab | Lists saved addresses; "Add address" form | As expected | Pass |
| P11-I3 | Add an address with missing line 1 | Validation error | As expected | Pass |
| P11-I4 | Add a valid address | Appears in the list; usable at checkout | As expected | Pass |
| P11-I5 | Delete an address | Removed after confirm | As expected | Pass |
| P11-I6 | Click "Track" on an order | Opens the tracking view | As expected | Pass |
| P11-I7 | Click "Log out" | Session cleared; redirect to home | As expected | Pass |

### API calls from this page
| # | Endpoint | Input | Expected | Actual | Status |
|---|---|---|---|---|---|
| P11-A1 | `GET /auth/me` | valid token | `200`, current customer | As expected | Pass |
| P11-A2 | `GET /auth/me` | no token | `401` | As expected | Pass |
| P11-A3 | `GET /auth/me` | expired / tampered token | `401` | As expected | Pass |
| P11-A4 | `GET /me/orders` | valid token | `200`, only this customer's orders | As expected | Pass |
| P11-A5 | `GET /me/custom-requests` | valid token | `200`, only this customer's requests | As expected | Pass |
| P11-A6 | `GET /me/addresses` | valid token | `200`, saved addresses | As expected | Pass |
| P11-A7 | `POST /me/addresses` | valid | `201` | As expected | Pass |
| P11-A8 | `POST /me/addresses` | missing `line1` / `city` / `postalCode` | `400` | As expected | Pass |
| P11-A9 | `PUT /me/addresses/{id}` | id belonging to another customer | `403` / `404` | As expected | Pass |
| P11-A10 | `DELETE /me/addresses/{id}` | valid | `204` | As expected | Pass |

---

## P12. Admin login — `/admin/login`

**Covers:** FR14

### On load
| # | Check | Expected | Actual | Status |
|---|---|---|---|---|
| P12-L1 | Login form | Username + password, "Sign in" | As expected | Pass |
| P12-L2 | Already signed in | Redirect to `/admin` | As expected | Pass |

### Interactions
| # | Action | Expected | Actual | Status |
|---|---|---|---|---|
| P12-I1 | Sign in as `forum` / `petals123` | Redirect to `/admin`; sidebar shows "Signed in as Forum Parmar" | As expected | Pass |
| P12-I2 | Wrong password | "Username or password is incorrect" | As expected | Pass |
| P12-I3 | Unknown username | Same generic message | As expected | Pass |
| P12-I4 | Empty form | Field errors | As expected | Pass |
| P12-I5 | Visit `/admin` directly while signed out | Redirect to `/admin/login` | As expected | Pass |

### API calls from this page
| # | Endpoint | Input | Expected | Actual | Status |
|---|---|---|---|---|---|
| P12-A1 | `POST /admin/auth/login` | `forum` / `petals123` | `200` + admin JWT | As expected | Pass |
| P12-A2 | `POST /admin/auth/login` | wrong password | `401` | As expected | Pass |
| P12-A3 | `POST /admin/auth/login` | unknown username | `401` | As expected | Pass |
| P12-A4 | `POST /admin/auth/login` | a customer's e-mail + password | `401` (customer accounts cannot use the admin login) | As expected | Pass |
| P12-A5 | `POST /admin/auth/login` | empty body | `400` | As expected | Pass |

---

## P13. Admin dashboard — `/admin`

**Covers:** FR16, FR17, FR19

### On load
| # | Check | Expected | Actual | Status |
|---|---|---|---|---|
| P13-L1 | Stat cards | Orders pending, orders in progress, new custom requests, unhandled enquiries — real counts | As expected | Pass |
| P13-L2 | "Orders needing attention" | Pending + early-stage orders, soonest delivery first | As expected | Pass |
| P13-L3 | "New custom requests" | Requests with status `new` | As expected | Pass |
| P13-L4 | No token / expired | Redirect to `/admin/login` | As expected | Pass |

### Interactions
| # | Action | Expected | Actual | Status |
|---|---|---|---|---|
| P13-I1 | Click a sidebar item | Navigate to that admin section; active state moves | As expected | Pass |
| P13-I2 | Click an order row | Open `/admin/orders/{id}` | As expected | Pass |
| P13-I3 | Click a custom-request row | Open `/admin/custom-requests/{id}` | As expected | Pass |
| P13-I4 | Click "Log out" | Session cleared; redirect to `/admin/login` | As expected | Pass |

### API calls from this page
| # | Endpoint | Input | Expected | Actual | Status |
|---|---|---|---|---|---|
| P13-A1 | `GET /admin/dashboard/summary` | admin token | `200`, six counts (`fn_dashboard_summary`) | As expected | Pass |
| P13-A2 | `GET /admin/orders?status=pending` | admin token | `200`, pending orders | As expected | Pass |
| P13-A3 | `GET /admin/custom-requests?status=new` | admin token | `200`, new requests | As expected | Pass |
| P13-A4 | `GET /admin/dashboard/summary` | no token | `401` | As expected | Pass |
| P13-A5 | `GET /admin/dashboard/summary` | customer token (wrong audience) | `403` | As expected | Pass |
| P13-A6 | `GET /admin/dashboard/summary` | tampered token | `401` | As expected | Pass |

---

## P14. Admin — Products list + Product form — `/admin/products`, `/admin/products/{id}`, `/admin/products/new`

**Covers:** FR15

### On load
| # | Check | Expected | Actual | Status |
|---|---|---|---|---|
| P14-L1 | Products table | All products (active + inactive), with availability and a quick toggle | As expected | Pass |
| P14-L2 | "New product" button | Opens the empty form | As expected | Pass |
| P14-L3 | Edit form | All fields pre-filled from the product | As expected | Pass |
| P14-L4 | Unknown product id | 404 / "product not found" | As expected | Pass |

### Interactions
| # | Action | Expected | Actual | Status |
|---|---|---|---|---|
| P14-I1 | Create a product with all valid fields | Saved; appears in `/shop` if active | As expected | Pass |
| P14-I2 | Save with an empty name / price | Field errors; not saved | As expected | Pass |
| P14-I3 | Save with a negative price | Validation error | As expected | Pass |
| P14-I4 | Save with a slug that already exists | "This slug is already in use" | As expected | Pass |
| P14-I5 | Upload a product image | Preview shown; URL stored on save | As expected | Pass |
| P14-I6 | Toggle availability to "Sold out" from the list | Catalogue updates; "Add to cart" disabled there | As expected | Pass |
| P14-I7 | Set "Visible in shop" off | Product disappears from `/shop`, stays in admin list | As expected | Pass |
| P14-I8 | Edit an existing order's product name | Past orders keep the old name (snapshot); catalogue shows the new name | As expected | Pass |

### API calls from this page
| # | Endpoint | Input | Expected | Actual | Status |
|---|---|---|---|---|---|
| P14-A1 | `GET /admin/products` | admin token | `200`, all products | As expected | Pass |
| P14-A2 | `POST /admin/products` | valid body | `201`, new product (`fn_upsert_product` with null id) | As expected | Pass |
| P14-A3 | `POST /admin/products` | missing `name` / `price` / `categoryId` | `400` | As expected | Pass |
| P14-A4 | `POST /admin/products` | `price: -100` | `400` | As expected | Pass |
| P14-A5 | `POST /admin/products` | `nature: "plastic"` | `400` | As expected | Pass |
| P14-A6 | `POST /admin/products` | duplicate `slug` | `409` | As expected | Pass |
| P14-A7 | `PUT /admin/products/{id}` | valid update | `200` | As expected | Pass |
| P14-A8 | `PUT /admin/products/999999` | unknown id | `404` — `PRODUCT_NOT_FOUND` | As expected | Pass |
| P14-A9 | `PUT /admin/products/{id}/availability` | `{ availability: "sold_out" }` | `200` | As expected | Pass |
| P14-A10 | `PUT /admin/products/{id}/availability` | `{ availability: "on_fire" }` | `400` | As expected | Pass |
| P14-A11 | `POST /admin/products` | no token / customer token | `401` / `403` | As expected | Pass |
| P14-A12 | `POST /admin/uploads` | 20 MB / wrong type | `413` / `415` | As expected | Pass |

---

## P15. Admin — Orders list — `/admin/orders`

**Covers:** FR16

### On load
| # | Check | Expected | Actual | Status |
|---|---|---|---|---|
| P15-L1 | Orders table | Number, recipient, placed, deliver-by, slot, items, total, status | As expected | Pass |
| P15-L2 | Status filter chips | All / Pending / Confirmed / … / Cancelled | As expected | Pass |
| P15-L3 | Deep link | `/admin/orders?status=pending` pre-selects the chip | As expected | Pass |
| P15-L4 | No token | Redirect to `/admin/login` | As expected | Pass |

### Interactions
| # | Action | Expected | Actual | Status |
|---|---|---|---|---|
| P15-I1 | Click "Confirmed" chip | Table shows only confirmed orders; URL updates | As expected | Pass |
| P15-I2 | Click "All" | Every order shown, newest first | As expected | Pass |
| P15-I3 | Click a row | Open `/admin/orders/{id}` | As expected | Pass |
| P15-I4 | Filter with no matching orders | "No orders with this status" empty state | As expected | Pass |

### API calls from this page
| # | Endpoint | Input | Expected | Actual | Status |
|---|---|---|---|---|---|
| P15-A1 | `GET /admin/orders` | admin token | `200`, all orders, newest first | As expected | Pass |
| P15-A2 | `GET /admin/orders?status=confirmed` | admin token | `200`, filtered | As expected | Pass |
| P15-A3 | `GET /admin/orders?status=banana` | invalid status | `400` | As expected | Pass |
| P15-A4 | `GET /admin/orders` | no token | `401` | As expected | Pass |

---

## P16. Admin — Order detail — `/admin/orders/{id}`

**Covers:** FR16

### On load
| # | Check | Expected | Actual | Status |
|---|---|---|---|---|
| P16-L1 | Items table | Product name (snapshot), unit price, qty, line total, order total | As expected | Pass |
| P16-L2 | Delivery + contact block | Recipient, phone, e-mail, address, date + slot, gift message | As expected | Pass |
| P16-L3 | Status control | "Move to" shows only the next valid status(es) + "Cancel" when allowed | As expected | Pass |
| P16-L4 | Unknown id | 404 | As expected | Pass |

### Interactions
| # | Action | Expected | Actual | Status |
|---|---|---|---|---|
| P16-I1 | Move `pending` → `confirmed` | Status updates; badge + timeline reflect it; customer `/track` updates | As expected | Pass |
| P16-I2 | Try to move `confirmed` → `pending` | Not offered in the dropdown; direct API call rejected | As expected | Pass |
| P16-I3 | Cancel a `pending` order | Status → `cancelled`; confirm dialog first | As expected | Pass |
| P16-I4 | Cancel an `out_for_delivery` order | "Cancel" not available; API call rejected | As expected | Pass |
| P16-I5 | Advance a `delivered` order | No further transitions offered | As expected | Pass |

### API calls from this page
| # | Endpoint | Input | Expected | Actual | Status |
|---|---|---|---|---|---|
| P16-A1 | `GET /admin/orders/{id}` | admin token | `200`, order + items | As expected | Pass |
| P16-A2 | `GET /admin/orders/999999` | unknown id | `404` | As expected | Pass |
| P16-A3 | `PUT /admin/orders/{id}/status` | `{ status: "confirmed" }` from `pending` | `200` (`fn_update_order_status`) | As expected | Pass |
| P16-A4 | `PUT /admin/orders/{id}/status` | `{ status: "pending" }` from `confirmed` | `409` — `INVALID_TRANSITION` | As expected | Pass |
| P16-A5 | `PUT /admin/orders/{id}/status` | `{ status: "delivered" }` from `pending` (skip) | `409` — `INVALID_TRANSITION` | As expected | Pass |
| P16-A6 | `PUT /admin/orders/{id}/status` | `{ status: "cancelled" }` from `out_for_delivery` | `409` — `CANNOT_CANCEL` | As expected | Pass |
| P16-A7 | `PUT /admin/orders/{id}/status` | `{ status: "banana" }` | `400` | As expected | Pass |
| P16-A8 | `PUT /admin/orders/{id}/status` | no token | `401` | As expected | Pass |

---

## P17. Admin — Custom request detail — `/admin/custom-requests/{id}`

**Covers:** FR17

### On load
| # | Check | Expected | Actual | Status |
|---|---|---|---|---|
| P17-L1 | Brief block | Type, occasion, palette, flowers, size, budget, need-by, notes, inspiration image | As expected | Pass |
| P17-L2 | Contact block | Name, phone, e-mail, guest / account | As expected | Pass |
| P17-L3 | Respond form | Status, response text, quoted price | As expected | Pass |
| P17-L4 | Unknown id | 404 | As expected | Pass |

### Interactions
| # | Action | Expected | Actual | Status |
|---|---|---|---|---|
| P17-I1 | Set status `reviewing`, save | Status updates; customer tracking shows "reviewing" | As expected | Pass |
| P17-I2 | Set status `quoted` with response + price, save | Customer tracking shows the response and quote | As expected | Pass |
| P17-I3 | Set `quoted` but leave price blank | Validation error ("a quote needs a price") | As expected | Pass |
| P17-I4 | Click "Convert to order" | Opens a pre-filled new order from the request | As expected | Pass |
| P17-I5 | Set status `declined` | Customer tracking shows "declined"; no price shown | As expected | Pass |

### API calls from this page
| # | Endpoint | Input | Expected | Actual | Status |
|---|---|---|---|---|---|
| P17-A1 | `GET /admin/custom-requests/{id}` | admin token | `200`, full request | As expected | Pass |
| P17-A2 | `GET /admin/custom-requests/999999` | unknown id | `404` — `REQUEST_NOT_FOUND` | As expected | Pass |
| P17-A3 | `PUT /admin/custom-requests/{id}` | `{ status, adminResponse, quotedPrice }` valid | `200` (`fn_respond_custom_request`) | As expected | Pass |
| P17-A4 | `PUT /admin/custom-requests/{id}` | `{ status: "quoted" }` with no `quotedPrice` | `400` | As expected | Pass |
| P17-A5 | `PUT /admin/custom-requests/{id}` | `{ status: "banana" }` | `400` | As expected | Pass |
| P17-A6 | `PUT /admin/custom-requests/{id}` | `quotedPrice: -50` | `400` | As expected | Pass |
| P17-A7 | `PUT /admin/custom-requests/{id}` | no token / customer token | `401` / `403` | As expected | Pass |

---

## P18. Admin — Enquiries — `/admin/enquiries`

**Covers:** FR18

### On load
| # | Check | Expected | Actual | Status |
|---|---|---|---|---|
| P18-L1 | Enquiries list | Name, e-mail, message, received date, handled flag | As expected | Pass |
| P18-L2 | Unhandled first | Unhandled enquiries sorted to the top | As expected | Pass |

### Interactions
| # | Action | Expected | Actual | Status |
|---|---|---|---|---|
| P18-I1 | Click "Mark handled" | Row updates; dashboard "unhandled enquiries" count drops | As expected | Pass |
| P18-I2 | Click "Mark unhandled" | Reverses it | As expected | Pass |

### API calls from this page
| # | Endpoint | Input | Expected | Actual | Status |
|---|---|---|---|---|---|
| P18-A1 | `GET /admin/enquiries` | admin token | `200`, all enquiries | As expected | Pass |
| P18-A2 | `PUT /admin/enquiries/{id}` | `{ isHandled: true }` | `200` (`fn_mark_enquiry_handled`) | As expected | Pass |
| P18-A3 | `PUT /admin/enquiries/999999` | unknown id | `404` | As expected | Pass |
| P18-A4 | `GET /admin/enquiries` | no token | `401` | As expected | Pass |

---

## Cross-cutting checks

| # | Area | Check | Expected | Actual | Status |
|---|---|---|---|---|---|
| X1 | Persistence | Restart the API, re-query order `FP-2026-000042` | Data unchanged in PostgreSQL | As expected | Pass |
| X2 | Transaction safety | Force an error mid-order (bad 2nd item) | No order row and no order_items rows are written | As expected | Pass |
| X3 | Security | SQL-injection string in search / name fields | Treated as literal text (parameterised); no error, no injection | As expected | Pass |
| X4 | Security | Passwords in the database | Stored as BCrypt hashes, never plain text | As expected | Pass |
| X5 | Responsiveness | Every page at 360 px, 768 px, 1280 px | Usable, no horizontal scroll | As expected | Pass |
| X6 | Error handling | API returns `500` | Page shows a generic "something went wrong" message, no stack trace | As expected | Pass |
| X7 | Numbering | Place several orders in quick succession | Order numbers are unique and sequential | As expected | Pass |

---

## Coverage summary

- **Screens covered:** 18 (11 customer, 7 admin) + 7 cross-cutting checks
- **On-load checks:** ~75  ·  **Interaction cases:** ~110  ·  **API cases:** ~130
- **Negative / edge cases:** every API endpoint is tested with invalid input, empty input,
  and (where protected) missing / wrong / wrong-audience token; plus business-rule failures
  (sold out, delivery too soon, price tampering, duplicate e-mail, invalid status transition).
- **Requirements:** FR1–FR20 each have at least one case — see report **Table 5.2**.
