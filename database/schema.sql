-- ============================================================================
--  Fleuréa Petals — Flower Bouquet Ordering Application
--  PostgreSQL schema  (schema.sql)
--  Target: PostgreSQL 16
--
--  Run order:   psql -d fleurea -f database/schema.sql
--               psql -d fleurea -f database/functions.sql
--               psql -d fleurea -f database/seed.sql
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
--  Enumerated types
-- ---------------------------------------------------------------------------
CREATE TYPE product_nature      AS ENUM ('everlasting', 'fresh');
CREATE TYPE product_availability AS ENUM ('available', 'made_to_order', 'sold_out');
CREATE TYPE order_status         AS ENUM ('pending', 'confirmed', 'in_preparation',
                                          'ready', 'out_for_delivery', 'delivered', 'cancelled');
CREATE TYPE delivery_slot        AS ENUM ('morning', 'afternoon', 'evening');
CREATE TYPE custom_request_status AS ENUM ('new', 'reviewing', 'quoted', 'accepted',
                                           'declined', 'converted_to_order', 'closed');
CREATE TYPE bouquet_type         AS ENUM ('ribbon', 'fresh', 'mixed');
CREATE TYPE bouquet_size         AS ENUM ('posy', 'standard', 'large', 'event');

-- ---------------------------------------------------------------------------
--  Human-readable number sequences  (FP-2026-000042 / FP-CR-2026-000007)
-- ---------------------------------------------------------------------------
CREATE SEQUENCE order_number_seq   START 1;
CREATE SEQUENCE request_number_seq START 1;

-- ---------------------------------------------------------------------------
--  updated_at trigger helper
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------------
--  categories
-- ---------------------------------------------------------------------------
CREATE TABLE categories (
    id          SERIAL PRIMARY KEY,
    name        TEXT NOT NULL,
    slug        TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL DEFAULT '',
    sort_order  INT  NOT NULL DEFAULT 0,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE
);

-- ---------------------------------------------------------------------------
--  products
-- ---------------------------------------------------------------------------
CREATE TABLE products (
    id                SERIAL PRIMARY KEY,
    category_id       INT NOT NULL REFERENCES categories(id),
    name              TEXT NOT NULL,
    slug              TEXT NOT NULL UNIQUE,
    short_description TEXT NOT NULL DEFAULT '',
    description       TEXT NOT NULL DEFAULT '',
    nature            product_nature NOT NULL,
    price             NUMERIC(10,2) NOT NULL CHECK (price >= 0),
    image_url         TEXT NOT NULL DEFAULT '',
    is_customizable   BOOLEAN NOT NULL DEFAULT FALSE,
    availability      product_availability NOT NULL DEFAULT 'available',
    lead_time_days    INT NOT NULL DEFAULT 1 CHECK (lead_time_days >= 0),
    is_active         BOOLEAN NOT NULL DEFAULT TRUE,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_products_category ON products(category_id);
CREATE INDEX ix_products_active   ON products(is_active);
CREATE TRIGGER trg_products_updated BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
--  customers   (a guest checkout creates a row with is_registered = FALSE)
-- ---------------------------------------------------------------------------
CREATE TABLE customers (
    id            SERIAL PRIMARY KEY,
    name          TEXT NOT NULL,
    email         TEXT NOT NULL,
    phone         TEXT NOT NULL DEFAULT '',
    password_hash TEXT,
    is_registered BOOLEAN NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- one registered account per email; guests may repeat but are de-duplicated by fn_upsert_guest_customer
CREATE UNIQUE INDEX ux_customers_email_registered
    ON customers (lower(email)) WHERE is_registered;

-- ---------------------------------------------------------------------------
--  addresses   (saved addresses for registered customers)
-- ---------------------------------------------------------------------------
CREATE TABLE addresses (
    id             SERIAL PRIMARY KEY,
    customer_id    INT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    label          TEXT NOT NULL DEFAULT 'Home',
    recipient_name TEXT NOT NULL,
    phone          TEXT NOT NULL,
    line1          TEXT NOT NULL,
    line2          TEXT NOT NULL DEFAULT '',
    city           TEXT NOT NULL,
    state          TEXT NOT NULL DEFAULT 'Maharashtra',
    postal_code    TEXT NOT NULL,
    landmark       TEXT NOT NULL DEFAULT ''
);
CREATE INDEX ix_addresses_customer ON addresses(customer_id);

-- ---------------------------------------------------------------------------
--  orders   (delivery details are snapshotted, not FK-linked)
-- ---------------------------------------------------------------------------
CREATE TABLE orders (
    id             SERIAL PRIMARY KEY,
    order_number   TEXT NOT NULL UNIQUE,
    customer_id    INT NOT NULL REFERENCES customers(id),
    status         order_status NOT NULL DEFAULT 'pending',
    subtotal       NUMERIC(10,2) NOT NULL DEFAULT 0,
    delivery_fee   NUMERIC(10,2) NOT NULL DEFAULT 0,
    total          NUMERIC(10,2) NOT NULL DEFAULT 0,
    recipient_name TEXT NOT NULL,
    recipient_phone TEXT NOT NULL,
    address_line1  TEXT NOT NULL,
    address_line2  TEXT NOT NULL DEFAULT '',
    city           TEXT NOT NULL,
    state          TEXT NOT NULL DEFAULT 'Maharashtra',
    postal_code    TEXT NOT NULL,
    landmark       TEXT NOT NULL DEFAULT '',
    delivery_date  DATE NOT NULL,
    delivery_slot  delivery_slot NOT NULL,
    gift_message   TEXT,
    customer_note  TEXT,
    placed_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_orders_customer ON orders(customer_id);
CREATE INDEX ix_orders_status   ON orders(status);
CREATE TRIGGER trg_orders_updated BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
--  order_items   (product_name + unit_price are snapshots)
-- ---------------------------------------------------------------------------
CREATE TABLE order_items (
    id           SERIAL PRIMARY KEY,
    order_id     INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id   INT NOT NULL REFERENCES products(id),
    product_name TEXT NOT NULL,
    unit_price   NUMERIC(10,2) NOT NULL,
    quantity     INT NOT NULL CHECK (quantity > 0),
    line_total   NUMERIC(10,2) NOT NULL
);
CREATE INDEX ix_order_items_order ON order_items(order_id);

-- ---------------------------------------------------------------------------
--  custom_requests
-- ---------------------------------------------------------------------------
CREATE TABLE custom_requests (
    id                   SERIAL PRIMARY KEY,
    request_number       TEXT NOT NULL UNIQUE,
    customer_id          INT REFERENCES customers(id),
    contact_name         TEXT NOT NULL,
    contact_email        TEXT NOT NULL,
    contact_phone        TEXT NOT NULL,
    bouquet_type         bouquet_type NOT NULL,
    occasion             TEXT NOT NULL,
    palette              TEXT NOT NULL DEFAULT '',
    flowers_preferred    TEXT NOT NULL DEFAULT '',
    size                 bouquet_size NOT NULL DEFAULT 'standard',
    budget_min           NUMERIC(10,2) NOT NULL DEFAULT 0,
    budget_max           NUMERIC(10,2) NOT NULL DEFAULT 0,
    need_by_date         DATE NOT NULL,
    reference_notes      TEXT NOT NULL DEFAULT '',
    inspiration_image_url TEXT,
    status               custom_request_status NOT NULL DEFAULT 'new',
    admin_response       TEXT,
    quoted_price         NUMERIC(10,2),
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_custom_requests_status ON custom_requests(status);
CREATE TRIGGER trg_custom_requests_updated BEFORE UPDATE ON custom_requests
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
--  enquiries   (footer contact form)
-- ---------------------------------------------------------------------------
CREATE TABLE enquiries (
    id         SERIAL PRIMARY KEY,
    name       TEXT NOT NULL,
    email      TEXT NOT NULL,
    message    TEXT NOT NULL,
    is_handled BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
--  admin_users
-- ---------------------------------------------------------------------------
CREATE TABLE admin_users (
    id            SERIAL PRIMARY KEY,
    name          TEXT NOT NULL,
    username      TEXT NOT NULL UNIQUE,
    email         TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    last_login_at TIMESTAMPTZ
);

COMMIT;
