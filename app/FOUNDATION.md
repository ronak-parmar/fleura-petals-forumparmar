# Foundation reference — read this before writing any page

Shared design system + data layer for the Fleuréa Petals Next.js app. Built once,
consumed by every page group. **Don't modify anything under `src/components/ui/`,
`src/components/layout/`, `src/lib/`, or `src/features/cart|admin/session.ts|account/session.ts`**
— if something's missing, add a new file in your own feature folder rather than
editing shared foundation files (avoids collisions with other groups working in parallel).

## The one rule that matters: Client Components only

There is no backend yet. `lib/api/client.ts` (mock mode) reads/writes an in-memory
"database" (`lib/api/fixtures.ts`) that lives in whatever JS runtime calls it. If a
page were a Server Component, its `client.ts` calls would run in a separate server
process from the browser — an order a customer places wouldn't show up for admin,
the cart would look empty on the next page, etc.

**So: every page/component that calls anything from `@/lib/api/client` must be a
Client Component** (`"use client"` at the top of the file). Fetch data with the
`useAsync` hook below, not `useEffect`/`useState` you write yourself. This is a
temporary rule for the mock phase — when the real backend lands, Server Components
can come back for pure-GET pages, but that's a later, separate change.

## Data fetching pattern

```tsx
"use client";
import { useAsync, isApiError } from "@/lib/useAsync";
import * as client from "@/lib/api/client";

export default function ShopPage() {
  const { data, error, loading, reload } = useAsync(
    () => client.getProducts({ nature: "fresh" }),
    [] // dependency array — re-fetches when values in it change
  );

  if (loading) return <p>Loading…</p>;
  if (error) return <ErrorBanner message={isApiError(error) ? error.message : "Something went wrong."} />;
  // data is fully typed from client.ts's return type
}
```

For a write action (submit a form, place an order), call the `client.ts` function
directly in an event handler / form `onSubmit`, wrapped in try/catch:

```tsx
try {
  const order = await client.placeOrder(payload);
  router.push(`/order/confirmed/${order.orderNumber}`);
} catch (e) {
  if (isApiError(e)) {
    setFieldErrors(e.fieldErrors ?? {});
    setFormError(e.message);
  }
}
```

`ApiError` (`@/lib/api/types`) always carries `.status`, `.code`, `.message`, and
optionally `.fieldErrors` (a `Record<string, string>` for per-field validation
messages) — this is what `tests/test-cases.md`'s API cases expect.

## Design tokens (Tailwind v4, defined in `src/app/globals.css`)

Colors → `bg-*` / `text-*` / `border-*` utilities work directly:
`ivory` `blush` `rosewood` `sage` `gold` `ink` · `surface` `surface-2` `border`
`border-strong` `text` `text-muted` `accent` `accent-ink` `accent-soft` `leaf`
`leaf-soft` `gold-ink` · status pairs `ok-bg`/`ok-fg`, `warn-bg`/`warn-fg`,
`info-bg`/`info-fg`, `dang-bg`/`dang-fg`.

Fonts → `font-display` (Fraunces, serif, use for headings — often `italic`),
`font-body` (Karla, default), `font-mono` (Space Mono, use for order numbers,
labels, eyebrows). Radius → `rounded-card`.

**Reference the actual look in `mockups/screens/*.html`** (one file per screen,
already pixel-designed) and `mockups/shared/fleurea.css` — port the layout and
spacing choices, don't invent new ones. The rendered PNGs are in
`report/assets/figures/fig-4-*.png` if you want to see them without opening HTML.

## Component inventory

| Import | Usage |
|---|---|
| `@/components/ui/Button` | `<Button variant="primary\|ghost" size="default\|sm" block href="/shop">Label</Button>` — pass `href` for a link, omit for a `<button>` (accepts normal button props: `onClick`, `type`, `disabled`) |
| `@/components/ui/Badge` | `<Badge variant="ok\|warn\|info\|dang\|muted">Text</Badge>`; `<StatusBadge status="pending" />` auto-maps any order/request/availability status to the right variant + label |
| `@/components/ui/Chip` | `<Chip active={bool} onClick={...}>Label</Chip>` — filter pills, pagination |
| `@/components/ui/Card` | `<Card><CardTitle>Heading</CardTitle>...</Card>` |
| `@/components/ui/Field` | `<Field label="Full name" hint="optional" error={msg}><Input .../></Field>`, `<FieldRow>` (2-col grid for two Fields side by side), `<Input>` `<Textarea>` `<Select>` (styled form controls, take normal HTML props + `error?: boolean`) |
| `@/components/ui/QtyStepper` | `<QtyStepper value={n} onChange={(next) => ...} min={1} max={99} />` |
| `@/components/ui/Table` | `<TableWrap><table><Thead><tr><Th>Col</Th></tr></Thead><tbody><Tr><Td>...</Td></Tr></tbody></table></TableWrap>` |
| `@/components/ui/Timeline` | `<Timeline steps={[{ label, detail, state: "done"\|"current"\|"upcoming" }]} />` — used on the track-order page |
| `@/components/ui/Misc` | `<PriceTag amount={1450} />` (₹ formatted), `<Eyebrow center>Label</Eyebrow>`, `<EmptyState title body action />`, `<ErrorBanner message />` |
| `@/components/layout/SiteHeader`, `SiteFooter` | Full customer chrome, already wired to `useCart()`. Wrap every `(site)` page's content between them (see "Route ownership" below) |
| `@/components/layout/AdminShell` | `<AdminShell>{children}</AdminShell>` — wraps every `/admin/*` page except `/admin/login`; handles the sidebar, "signed in as", redirect-to-login if no session |
| `@/components/catalogue/ProductCard` | `<ProductCard product={product} />` — catalogue grid tile |

## Data layer

- **`@/lib/api/types`** — every TS interface (`Product`, `Order`, `CustomRequest`,
  `Address`, `Category`, `DashboardSummary`, `ApiError`, payload types, enums).
  Import types from here; never redeclare a shape locally.
- **`@/lib/api/client`** — one async function per endpoint (full list below). Always
  import as `import * as client from "@/lib/api/client"` for consistency.
- **`@/features/cart/CartContext`** — `useCart()` → `{ lines, count, subtotal,
  deliveryFee, total, add, setQty, remove, clear, replaceAll }`. Already mounted
  in the root layout — just call the hook.
- **`@/features/account/session`** — `getCustomerToken()`, `setCustomerToken(t)`,
  `clearCustomerToken()`. Plain localStorage, client-only.
- **`@/features/admin/session`** — `getAdminToken()`, `setAdminSession(token, name)`,
  `getAdminName()`, `clearAdminSession()`.

### `client.ts` function list

```
Catalogue    getCategories() · getProducts(filter) · getProduct(slug)
Orders       placeOrder(payload) · getOrder(orderNumber, email)
Custom       createCustomRequest(payload) · getCustomRequest(requestNumber, email)
             createEnquiry(name, email, message) · uploadInspirationImage(file)
Account      register(name, email, phone, password) · login(email, password)
             me(token) · myOrders(token) · myCustomRequests(token)
             myAddresses(token) · addAddress(token, address)
Admin        adminLogin(username, password) · adminDashboardSummary(token)
             adminListOrders(token, status?) · adminGetOrder(token, id)
             adminUpdateOrderStatus(token, id, status)
             adminListProducts(token) · adminUpsertProduct(token, product)
             adminSetProductAvailability(token, id, availability)
             adminListCustomRequests(token, status?) · adminGetCustomRequest(token, id)
             adminRespondCustomRequest(token, id, { status?, adminResponse?, quotedPrice? })
             adminListEnquiries(token) · adminMarkEnquiryHandled(token, id, handled)
```

Every function throws `ApiError` on failure — see the exact status/code/message
for each case in `tests/Fleurea.http` and `tests/test-cases.md` (organised
page-by-page, P1–P18). Build your page to satisfy that page's section.

### Seeded fixture data (`lib/api/fixtures.ts`) — for reference while building

- Admin: **Forum Parmar**, username `forum`, password `petals123`
- Customers: **Beena Parmar** (`beena.parmar@example.com`, registered),
  **Ronak Parmar** (`ronak.parmar@example.com`, guest)
- Order `FP-2026-000042` (Beena, status `in_preparation`, 3 items, ₹3,650)
- Custom request `FP-CR-2026-000007` (Ronak, status `reviewing`)
- 6 products across 4 categories (see `database/seed.sql` for the authoritative list —
  fixtures.ts mirrors it exactly)

## Conventions

- Currency: `₹` + `amount.toLocaleString("en-IN")`, or just use `<PriceTag amount={n} />`.
- Dates: format for display as e.g. `Sat, 12 Sep 2026` (`date-fns` is **not** installed —
  use `Intl.DateTimeFormat` or plain `Date` methods; don't add new npm dependencies
  without checking first).
- Images: there are no real product photos. Use a CSS gradient placeholder exactly
  like the mockups do: `bg-linear-to-br from-blush via-[#e7c7bb] to-sage`.
- Icons: inline SVG only (see `BrandMark.tsx` for the pattern) — no icon library.
- Responsive: every page must work at 360px width (see `tests/test-cases.md`, "X5").
- Keep route folders you don't own untouched. If two groups both need a tiny shared
  bit that isn't in this doc, prefer duplicating a few lines over reaching into
  another group's files — we reconcile afterwards.

## Verifying your work

```
cd app
npm run dev            # http://localhost:3000
npx next build          # must complete with no type errors before you're done
```
Node/npm on this machine: if `npm`/`npx` fail with an EPERM error mentioning
`srv_admin`, run `export PATH="/c/Program Files/nodejs:$PATH"` first (there's a
broken second Node install earlier on PATH).
