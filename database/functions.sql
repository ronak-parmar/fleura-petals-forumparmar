-- ============================================================================
--  Fleuréa Petals — PostgreSQL functions used by the ASP.NET Core API
--  functions.sql   (run after schema.sql)
--
--  The API layer (services) calls these functions instead of composing SQL
--  in C#. Each function is the single place a given read or write happens,
--  so validation, pricing and numbering live in the database.
--
--  Naming:  fn_get_*      -> read / show data
--           fn_create_* / fn_place_* / fn_upsert_*  -> insert
--           fn_update_* / fn_set_* / fn_respond_*   -> update
-- ============================================================================

-- ---------------------------------------------------------------------------
--  Numbering helpers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_next_order_number() RETURNS TEXT AS $$
    SELECT 'FP-' || to_char(now(), 'YYYY') || '-' ||
           lpad(nextval('order_number_seq')::text, 6, '0');
$$ LANGUAGE sql;

CREATE OR REPLACE FUNCTION fn_next_request_number() RETURNS TEXT AS $$
    SELECT 'FP-CR-' || to_char(now(), 'YYYY') || '-' ||
           lpad(nextval('request_number_seq')::text, 6, '0');
$$ LANGUAGE sql;

-- ===========================================================================
--  CATALOGUE  —  show data
-- ===========================================================================

-- List active categories, ordered for display.
CREATE OR REPLACE FUNCTION fn_get_categories()
RETURNS TABLE (id INT, name TEXT, slug TEXT, description TEXT, sort_order INT, product_count BIGINT)
AS $$
    SELECT c.id, c.name, c.slug, c.description, c.sort_order,
           count(p.id) FILTER (WHERE p.is_active) AS product_count
    FROM   categories c
    LEFT JOIN products p ON p.category_id = c.id
    WHERE  c.is_active
    GROUP  BY c.id
    ORDER  BY c.sort_order, c.name;
$$ LANGUAGE sql STABLE;

-- Paged, filtered product list for the shop page.
-- Any filter argument may be NULL to skip it.
CREATE OR REPLACE FUNCTION fn_get_products(
    p_category  TEXT DEFAULT NULL,
    p_nature    TEXT DEFAULT NULL,
    p_search    TEXT DEFAULT NULL,
    p_page      INT  DEFAULT 1,
    p_page_size INT  DEFAULT 12
)
RETURNS TABLE (
    id INT, name TEXT, slug TEXT, short_description TEXT, price NUMERIC,
    nature product_nature, availability product_availability,
    lead_time_days INT, image_url TEXT, category TEXT, total_count BIGINT,
    category_id INT, description TEXT, is_customizable BOOLEAN, is_active BOOLEAN
)
AS $$
    SELECT p.id, p.name, p.slug, p.short_description, p.price,
           p.nature, p.availability, p.lead_time_days, p.image_url,
           c.name AS category,
           count(*) OVER() AS total_count,
           p.category_id, p.description, p.is_customizable, p.is_active
    FROM   products p
    JOIN   categories c ON c.id = p.category_id
    WHERE  p.is_active
      AND (p_category IS NULL OR c.slug = p_category)
      AND (p_nature   IS NULL OR p.nature = p_nature::product_nature)
      AND (p_search   IS NULL OR p.name ILIKE '%' || p_search || '%')
    ORDER  BY c.sort_order, p.name
    LIMIT  greatest(p_page_size, 1)
    OFFSET greatest(p_page - 1, 0) * greatest(p_page_size, 1);
$$ LANGUAGE sql STABLE;

-- Shared product+category shape used by every product-returning function below,
-- so the API can map all of them into the one Product DTO the frontend expects.
-- (id, category_id, category, name, slug, short_description, description, nature,
--  price, image_url, is_customizable, availability, lead_time_days, is_active)

-- Single product for the detail page (active only).
CREATE OR REPLACE FUNCTION fn_get_product_by_slug(p_slug TEXT)
RETURNS TABLE (
    id INT, category_id INT, category TEXT, name TEXT, slug TEXT,
    short_description TEXT, description TEXT, nature product_nature, price NUMERIC,
    image_url TEXT, is_customizable BOOLEAN, availability product_availability,
    lead_time_days INT, is_active BOOLEAN
)
AS $$
    SELECT p.id, p.category_id, c.name, p.name, p.slug, p.short_description, p.description,
           p.nature, p.price, p.image_url, p.is_customizable, p.availability, p.lead_time_days, p.is_active
    FROM   products p
    JOIN   categories c ON c.id = p.category_id
    WHERE  p.slug = p_slug AND p.is_active;
$$ LANGUAGE sql STABLE;

-- Admin product list — every product, active or not, newest category order first.
CREATE OR REPLACE FUNCTION fn_admin_list_products()
RETURNS TABLE (
    id INT, category_id INT, category TEXT, name TEXT, slug TEXT,
    short_description TEXT, description TEXT, nature product_nature, price NUMERIC,
    image_url TEXT, is_customizable BOOLEAN, availability product_availability,
    lead_time_days INT, is_active BOOLEAN
)
AS $$
    SELECT p.id, p.category_id, c.name, p.name, p.slug, p.short_description, p.description,
           p.nature, p.price, p.image_url, p.is_customizable, p.availability, p.lead_time_days, p.is_active
    FROM   products p
    JOIN   categories c ON c.id = p.category_id
    ORDER  BY c.sort_order, p.name;
$$ LANGUAGE sql STABLE;

-- ===========================================================================
--  CUSTOMERS  —  insert / upsert
-- ===========================================================================

-- Used by checkout: reuse an existing guest row for the same e-mail, else create one.
-- Never downgrades a registered customer.
CREATE OR REPLACE FUNCTION fn_upsert_guest_customer(
    p_name TEXT, p_email TEXT, p_phone TEXT
)
RETURNS INT AS $$
DECLARE
    v_id INT;
BEGIN
    SELECT id INTO v_id FROM customers WHERE lower(email) = lower(p_email) ORDER BY id LIMIT 1;
    IF v_id IS NULL THEN
        INSERT INTO customers (name, email, phone, is_registered)
        VALUES (p_name, p_email, p_phone, FALSE)
        RETURNING id INTO v_id;
    ELSE
        UPDATE customers
           SET name  = coalesce(nullif(p_name, ''), name),
               phone = coalesce(nullif(p_phone, ''), phone)
         WHERE id = v_id;
    END IF;
    RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- Register (or upgrade a guest to) a real account.
CREATE OR REPLACE FUNCTION fn_register_customer(
    p_name TEXT, p_email TEXT, p_phone TEXT, p_password_hash TEXT
)
RETURNS INT AS $$
DECLARE
    v_id INT;
BEGIN
    IF EXISTS (SELECT 1 FROM customers WHERE lower(email) = lower(p_email) AND is_registered) THEN
        RAISE EXCEPTION 'EMAIL_TAKEN: An account with this e-mail already exists.' USING ERRCODE = 'unique_violation';
    END IF;

    SELECT id INTO v_id FROM customers WHERE lower(email) = lower(p_email) AND NOT is_registered ORDER BY id LIMIT 1;
    IF v_id IS NULL THEN
        INSERT INTO customers (name, email, phone, password_hash, is_registered)
        VALUES (p_name, p_email, p_phone, p_password_hash, TRUE)
        RETURNING id INTO v_id;
    ELSE
        UPDATE customers
           SET name = p_name, phone = p_phone,
               password_hash = p_password_hash, is_registered = TRUE
         WHERE id = v_id;
    END IF;
    RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- ===========================================================================
--  CUSTOMERS  —  show data  (for /auth/login, /auth/me)
-- ===========================================================================

-- Includes password_hash — used only internally by the API to verify a login;
-- never serialized back to the client (see Dtos/CustomerDto, which omits it).
CREATE OR REPLACE FUNCTION fn_get_customer_by_email(p_email TEXT)
RETURNS SETOF customers AS $$
    SELECT * FROM customers WHERE lower(email) = lower(p_email) AND is_registered;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION fn_get_customer_by_id(p_id INT)
RETURNS SETOF customers AS $$
    SELECT * FROM customers WHERE id = p_id;
$$ LANGUAGE sql STABLE;

-- ===========================================================================
--  ADDRESSES  —  show / insert  (customer's saved addresses)
-- ===========================================================================

CREATE OR REPLACE FUNCTION fn_get_addresses(p_customer_id INT)
RETURNS SETOF addresses AS $$
    SELECT * FROM addresses WHERE customer_id = p_customer_id ORDER BY id;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION fn_add_address(
    p_customer_id INT, p_label TEXT, p_recipient_name TEXT, p_phone TEXT,
    p_line1 TEXT, p_line2 TEXT, p_city TEXT, p_state TEXT, p_postal_code TEXT, p_landmark TEXT
)
RETURNS addresses AS $$
    INSERT INTO addresses (customer_id, label, recipient_name, phone, line1, line2, city, state, postal_code, landmark)
    VALUES (p_customer_id, coalesce(nullif(p_label,''),'Home'), p_recipient_name, p_phone,
            p_line1, coalesce(p_line2,''), p_city, coalesce(nullif(p_state,''),'Maharashtra'),
            p_postal_code, coalesce(p_landmark,''))
    RETURNING *;
$$ LANGUAGE sql;

-- ===========================================================================
--  ORDERS  —  insert
-- ===========================================================================

-- Place an order.  p_items is a JSONB array: [{"product_id": 1, "quantity": 2}, ...]
-- Prices are read from the products table here; the caller cannot set them.
-- Validates availability and the delivery date against each product's nature/lead time.
-- Inserts the order and all its items atomically and returns the order row.
CREATE OR REPLACE FUNCTION fn_place_order(
    p_contact_name  TEXT,
    p_contact_email TEXT,
    p_contact_phone TEXT,
    p_recipient_name TEXT,
    p_recipient_phone TEXT,
    p_line1 TEXT, p_line2 TEXT, p_city TEXT, p_state TEXT,
    p_postal_code TEXT, p_landmark TEXT,
    p_delivery_date DATE,
    p_delivery_slot TEXT,
    p_gift_message TEXT,
    p_customer_note TEXT,
    p_items JSONB
)
RETURNS orders AS $$
DECLARE
    v_customer_id  INT;
    v_order        orders;
    v_item         JSONB;
    v_product      products;
    v_qty          INT;
    v_delivery_fee NUMERIC(10,2) := 80.00;
    v_free_over    NUMERIC(10,2) := 1500.00;
BEGIN
    IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
        RAISE EXCEPTION 'EMPTY_ORDER: Your cart is empty.';
    END IF;

    v_customer_id := fn_upsert_guest_customer(p_contact_name, p_contact_email, p_contact_phone);

    INSERT INTO orders (
        order_number, customer_id, status,
        recipient_name, recipient_phone,
        address_line1, address_line2, city, state, postal_code, landmark,
        delivery_date, delivery_slot, gift_message, customer_note
    )
    VALUES (
        fn_next_order_number(), v_customer_id, 'pending',
        p_recipient_name, p_recipient_phone,
        p_line1, coalesce(p_line2, ''), p_city, coalesce(p_state, 'Maharashtra'),
        p_postal_code, coalesce(p_landmark, ''),
        p_delivery_date, p_delivery_slot::delivery_slot, p_gift_message, p_customer_note
    )
    RETURNING * INTO v_order;

    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_qty := greatest((v_item->>'quantity')::INT, 1);

        SELECT * INTO v_product
        FROM   products
        WHERE  id = (v_item->>'product_id')::INT AND is_active;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'PRODUCT_NOT_FOUND: Product % was not found.', v_item->>'product_id';
        END IF;
        IF v_product.availability = 'sold_out' THEN
            RAISE EXCEPTION 'PRODUCT_SOLD_OUT: % is sold out.', v_product.name;
        END IF;
        IF v_product.nature = 'everlasting'
           AND p_delivery_date < current_date + v_product.lead_time_days THEN
            RAISE EXCEPTION 'DELIVERY_TOO_SOON: % needs % day(s) lead time',
                v_product.name, v_product.lead_time_days;
        END IF;
        IF v_product.nature = 'fresh' AND p_delivery_date < current_date + 1 THEN
            RAISE EXCEPTION 'DELIVERY_TOO_SOON: fresh items need next-day delivery';
        END IF;

        INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity, line_total)
        VALUES (v_order.id, v_product.id, v_product.name, v_product.price,
                v_qty, v_product.price * v_qty);
    END LOOP;

    UPDATE orders o
       SET subtotal     = s.subtotal,
           delivery_fee = CASE WHEN s.subtotal >= v_free_over THEN 0 ELSE v_delivery_fee END,
           total        = s.subtotal + CASE WHEN s.subtotal >= v_free_over THEN 0 ELSE v_delivery_fee END
      FROM (SELECT sum(line_total) AS subtotal FROM order_items WHERE order_id = v_order.id) s
     WHERE o.id = v_order.id
    RETURNING o.* INTO v_order;

    RETURN v_order;
END;
$$ LANGUAGE plpgsql;

-- ===========================================================================
--  ORDERS  —  show data
-- ===========================================================================

-- Order for the customer tracking page. Returns an empty row set if the e-mail
-- does not match the order's customer (used as an access check). Same full
-- shape as fn_admin_get_order / fn_admin_list_orders so the API has exactly
-- one Order row mapper shared by every order-returning endpoint.
CREATE OR REPLACE FUNCTION fn_get_order(p_order_number TEXT, p_email TEXT)
RETURNS TABLE (
    id INT, order_number TEXT, status order_status, subtotal NUMERIC, delivery_fee NUMERIC,
    total NUMERIC, recipient_name TEXT, recipient_phone TEXT,
    address_line1 TEXT, address_line2 TEXT, city TEXT, state TEXT, postal_code TEXT, landmark TEXT,
    delivery_date DATE, delivery_slot delivery_slot, gift_message TEXT, customer_note TEXT,
    placed_at TIMESTAMPTZ, items JSONB
)
AS $$
    SELECT o.id, o.order_number, o.status, o.subtotal, o.delivery_fee, o.total,
           o.recipient_name, o.recipient_phone,
           o.address_line1, o.address_line2, o.city, o.state, o.postal_code, o.landmark,
           o.delivery_date, o.delivery_slot, o.gift_message, o.customer_note, o.placed_at,
           coalesce(jsonb_agg(jsonb_build_object(
               'product_id', oi.product_id, 'name', oi.product_name, 'unit_price', oi.unit_price,
               'quantity', oi.quantity, 'line_total', oi.line_total)) FILTER (WHERE oi.id IS NOT NULL), '[]'::jsonb) AS items
    FROM   orders o
    JOIN   customers c  ON c.id = o.customer_id
    LEFT JOIN order_items oi ON oi.order_id = o.id
    WHERE  o.order_number = p_order_number
      AND  lower(c.email) = lower(p_email)
    GROUP  BY o.id;
$$ LANGUAGE sql STABLE;

-- Admin order list, optionally filtered by status. Returns the full order shape
-- (not just a summary) since the admin UI's list and detail views share one Order type.
CREATE OR REPLACE FUNCTION fn_admin_list_orders(p_status TEXT DEFAULT NULL)
RETURNS TABLE (
    id INT, order_number TEXT, status order_status, subtotal NUMERIC, delivery_fee NUMERIC,
    total NUMERIC, recipient_name TEXT, recipient_phone TEXT,
    address_line1 TEXT, address_line2 TEXT, city TEXT, state TEXT, postal_code TEXT, landmark TEXT,
    delivery_date DATE, delivery_slot delivery_slot, gift_message TEXT, customer_note TEXT,
    placed_at TIMESTAMPTZ, items JSONB
)
AS $$
    SELECT o.id, o.order_number, o.status, o.subtotal, o.delivery_fee, o.total,
           o.recipient_name, o.recipient_phone,
           o.address_line1, o.address_line2, o.city, o.state, o.postal_code, o.landmark,
           o.delivery_date, o.delivery_slot, o.gift_message, o.customer_note, o.placed_at,
           coalesce(jsonb_agg(jsonb_build_object(
               'product_id', oi.product_id, 'name', oi.product_name, 'unit_price', oi.unit_price,
               'quantity', oi.quantity, 'line_total', oi.line_total)) FILTER (WHERE oi.id IS NOT NULL), '[]'::jsonb) AS items
    FROM   orders o
    LEFT JOIN order_items oi ON oi.order_id = o.id
    WHERE  p_status IS NULL OR o.status = p_status::order_status
    GROUP  BY o.id
    ORDER  BY o.placed_at DESC;
$$ LANGUAGE sql STABLE;

-- Single order for the admin detail page (no e-mail ownership check — admin-only route).
CREATE OR REPLACE FUNCTION fn_admin_get_order(p_id INT)
RETURNS TABLE (
    id INT, order_number TEXT, status order_status, subtotal NUMERIC, delivery_fee NUMERIC,
    total NUMERIC, recipient_name TEXT, recipient_phone TEXT,
    address_line1 TEXT, address_line2 TEXT, city TEXT, state TEXT, postal_code TEXT, landmark TEXT,
    delivery_date DATE, delivery_slot delivery_slot, gift_message TEXT, customer_note TEXT,
    placed_at TIMESTAMPTZ, items JSONB
)
AS $$
    SELECT o.id, o.order_number, o.status, o.subtotal, o.delivery_fee, o.total,
           o.recipient_name, o.recipient_phone,
           o.address_line1, o.address_line2, o.city, o.state, o.postal_code, o.landmark,
           o.delivery_date, o.delivery_slot, o.gift_message, o.customer_note, o.placed_at,
           coalesce(jsonb_agg(jsonb_build_object(
               'product_id', oi.product_id, 'name', oi.product_name, 'unit_price', oi.unit_price,
               'quantity', oi.quantity, 'line_total', oi.line_total)) FILTER (WHERE oi.id IS NOT NULL), '[]'::jsonb) AS items
    FROM   orders o
    LEFT JOIN order_items oi ON oi.order_id = o.id
    WHERE  o.id = p_id
    GROUP  BY o.id;
$$ LANGUAGE sql STABLE;

-- Orders for the signed-in customer's "My orders" page. Same full shape as
-- fn_get_order / fn_admin_get_order, scoped by customer_id instead of e-mail.
CREATE OR REPLACE FUNCTION fn_get_customer_orders(p_customer_id INT)
RETURNS TABLE (
    id INT, order_number TEXT, status order_status, subtotal NUMERIC, delivery_fee NUMERIC,
    total NUMERIC, recipient_name TEXT, recipient_phone TEXT,
    address_line1 TEXT, address_line2 TEXT, city TEXT, state TEXT, postal_code TEXT, landmark TEXT,
    delivery_date DATE, delivery_slot delivery_slot, gift_message TEXT, customer_note TEXT,
    placed_at TIMESTAMPTZ, items JSONB
)
AS $$
    SELECT o.id, o.order_number, o.status, o.subtotal, o.delivery_fee, o.total,
           o.recipient_name, o.recipient_phone,
           o.address_line1, o.address_line2, o.city, o.state, o.postal_code, o.landmark,
           o.delivery_date, o.delivery_slot, o.gift_message, o.customer_note, o.placed_at,
           coalesce(jsonb_agg(jsonb_build_object(
               'product_id', oi.product_id, 'name', oi.product_name, 'unit_price', oi.unit_price,
               'quantity', oi.quantity, 'line_total', oi.line_total)) FILTER (WHERE oi.id IS NOT NULL), '[]'::jsonb) AS items
    FROM   orders o
    LEFT JOIN order_items oi ON oi.order_id = o.id
    WHERE  o.customer_id = p_customer_id
    GROUP  BY o.id
    ORDER  BY o.placed_at DESC;
$$ LANGUAGE sql STABLE;

-- ===========================================================================
--  ORDERS  —  update
-- ===========================================================================

-- Move an order to a new status. Enforces forward-only transitions
-- (or a move to 'cancelled' from an early state).
CREATE OR REPLACE FUNCTION fn_update_order_status(p_order_id INT, p_status TEXT)
RETURNS orders AS $$
DECLARE
    v_order   orders;
    v_flow    order_status[] := ARRAY['pending','confirmed','in_preparation',
                                      'ready','out_for_delivery','delivered']::order_status[];
    v_cur_ix  INT;
    v_new_ix  INT;
    v_new     order_status := p_status::order_status;
BEGIN
    SELECT * INTO v_order FROM orders WHERE id = p_order_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'ORDER_NOT_FOUND: Order not found.';
    END IF;

    IF v_new = 'cancelled' THEN
        IF v_order.status NOT IN ('pending','confirmed') THEN
            RAISE EXCEPTION 'CANNOT_CANCEL: This order is already in progress and cannot be cancelled.';
        END IF;
    ELSE
        v_cur_ix := array_position(v_flow, v_order.status);
        v_new_ix := array_position(v_flow, v_new);
        IF v_new_ix IS NULL OR v_new_ix <= v_cur_ix THEN
            RAISE EXCEPTION 'INVALID_TRANSITION: Cannot move from % to %.', v_order.status, v_new;
        END IF;
    END IF;

    UPDATE orders SET status = v_new WHERE id = p_order_id RETURNING * INTO v_order;
    RETURN v_order;
END;
$$ LANGUAGE plpgsql;

-- ===========================================================================
--  CUSTOM REQUESTS  —  insert / show / update
-- ===========================================================================

CREATE OR REPLACE FUNCTION fn_create_custom_request(
    p_customer_id INT,
    p_contact_name TEXT, p_contact_email TEXT, p_contact_phone TEXT,
    p_bouquet_type TEXT, p_occasion TEXT, p_palette TEXT, p_flowers TEXT,
    p_size TEXT, p_budget_min NUMERIC, p_budget_max NUMERIC,
    p_need_by_date DATE, p_reference_notes TEXT, p_image_url TEXT
)
RETURNS custom_requests AS $$
DECLARE
    v_row custom_requests;
BEGIN
    INSERT INTO custom_requests (
        request_number, customer_id, contact_name, contact_email, contact_phone,
        bouquet_type, occasion, palette, flowers_preferred, size,
        budget_min, budget_max, need_by_date, reference_notes, inspiration_image_url
    )
    VALUES (
        fn_next_request_number(), p_customer_id, p_contact_name, p_contact_email, p_contact_phone,
        p_bouquet_type::bouquet_type, p_occasion, coalesce(p_palette,''), coalesce(p_flowers,''),
        coalesce(p_size,'standard')::bouquet_size,
        coalesce(p_budget_min,0), coalesce(p_budget_max,0),
        p_need_by_date, coalesce(p_reference_notes,''), p_image_url
    )
    RETURNING * INTO v_row;
    RETURN v_row;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION fn_get_custom_request(p_request_number TEXT, p_email TEXT)
RETURNS SETOF custom_requests AS $$
    SELECT * FROM custom_requests
    WHERE  request_number = p_request_number
      AND  lower(contact_email) = lower(p_email);
$$ LANGUAGE sql STABLE;

-- Custom requests for the signed-in customer's "My requests" page.
CREATE OR REPLACE FUNCTION fn_get_customer_custom_requests(p_customer_id INT)
RETURNS SETOF custom_requests AS $$
    SELECT * FROM custom_requests WHERE customer_id = p_customer_id ORDER BY created_at DESC;
$$ LANGUAGE sql STABLE;

-- Admin custom-request list, optionally filtered by status.
CREATE OR REPLACE FUNCTION fn_admin_list_custom_requests(p_status TEXT DEFAULT NULL)
RETURNS SETOF custom_requests AS $$
    SELECT * FROM custom_requests
    WHERE  p_status IS NULL OR status = p_status::custom_request_status
    ORDER  BY created_at DESC;
$$ LANGUAGE sql STABLE;

-- Single custom request for the admin detail page (no e-mail ownership check).
CREATE OR REPLACE FUNCTION fn_admin_get_custom_request(p_id INT)
RETURNS SETOF custom_requests AS $$
    SELECT * FROM custom_requests WHERE id = p_id;
$$ LANGUAGE sql STABLE;

-- Admin records a response and rough quote, and/or advances the status.
CREATE OR REPLACE FUNCTION fn_respond_custom_request(
    p_id INT, p_status TEXT, p_response TEXT, p_quote NUMERIC
)
RETURNS custom_requests AS $$
DECLARE
    v_row custom_requests;
BEGIN
    UPDATE custom_requests
       SET status         = coalesce(p_status, status::text)::custom_request_status,
           admin_response = coalesce(p_response, admin_response),
           quoted_price   = coalesce(p_quote, quoted_price)
     WHERE id = p_id
    RETURNING * INTO v_row;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'REQUEST_NOT_FOUND: Request not found.';
    END IF;
    RETURN v_row;
END;
$$ LANGUAGE plpgsql;

-- ===========================================================================
--  ADMIN — products (insert / update)
-- ===========================================================================

-- Insert when p_id IS NULL, otherwise update. Returns the product row joined to
-- its category name (same shape as fn_get_product_by_slug / fn_admin_list_products).
CREATE OR REPLACE FUNCTION fn_upsert_product(
    p_id INT,
    p_category_id INT, p_name TEXT, p_slug TEXT,
    p_short_description TEXT, p_description TEXT,
    p_nature TEXT, p_price NUMERIC, p_image_url TEXT,
    p_is_customizable BOOLEAN, p_availability TEXT,
    p_lead_time_days INT, p_is_active BOOLEAN
)
RETURNS TABLE (
    id INT, category_id INT, category TEXT, name TEXT, slug TEXT,
    short_description TEXT, description TEXT, nature product_nature, price NUMERIC,
    image_url TEXT, is_customizable BOOLEAN, availability product_availability,
    lead_time_days INT, is_active BOOLEAN
) AS $$
DECLARE
    v_id INT;
BEGIN
    IF p_id IS NULL THEN
        INSERT INTO products (category_id, name, slug, short_description, description,
                              nature, price, image_url, is_customizable, availability,
                              lead_time_days, is_active)
        VALUES (p_category_id, p_name, p_slug, coalesce(p_short_description,''),
                coalesce(p_description,''), p_nature::product_nature, p_price,
                coalesce(p_image_url,''), coalesce(p_is_customizable,FALSE),
                coalesce(p_availability,'available')::product_availability,
                coalesce(p_lead_time_days,1), coalesce(p_is_active,TRUE))
        RETURNING products.id INTO v_id;
    ELSE
        UPDATE products
           SET category_id = p_category_id, name = p_name, slug = p_slug,
               short_description = coalesce(p_short_description,''),
               description = coalesce(p_description,''),
               nature = p_nature::product_nature, price = p_price,
               image_url = coalesce(p_image_url, products.image_url),
               is_customizable = coalesce(p_is_customizable, products.is_customizable),
               availability = coalesce(p_availability, products.availability::text)::product_availability,
               lead_time_days = coalesce(p_lead_time_days, products.lead_time_days),
               is_active = coalesce(p_is_active, products.is_active)
         WHERE products.id = p_id
        RETURNING products.id INTO v_id;
        IF NOT FOUND THEN RAISE EXCEPTION 'PRODUCT_NOT_FOUND: Product not found.'; END IF;
    END IF;

    RETURN QUERY
        SELECT p.id, p.category_id, c.name, p.name, p.slug, p.short_description, p.description,
               p.nature, p.price, p.image_url, p.is_customizable, p.availability, p.lead_time_days, p.is_active
        FROM   products p JOIN categories c ON c.id = p.category_id
        WHERE  p.id = v_id;
END;
$$ LANGUAGE plpgsql;

-- Quick availability toggle from the products list. Same joined shape as above.
CREATE OR REPLACE FUNCTION fn_set_product_availability(p_id INT, p_availability TEXT)
RETURNS TABLE (
    id INT, category_id INT, category TEXT, name TEXT, slug TEXT,
    short_description TEXT, description TEXT, nature product_nature, price NUMERIC,
    image_url TEXT, is_customizable BOOLEAN, availability product_availability,
    lead_time_days INT, is_active BOOLEAN
) AS $$
    UPDATE products SET availability = p_availability::product_availability WHERE id = p_id;

    SELECT p.id, p.category_id, c.name, p.name, p.slug, p.short_description, p.description,
           p.nature, p.price, p.image_url, p.is_customizable, p.availability, p.lead_time_days, p.is_active
    FROM   products p JOIN categories c ON c.id = p.category_id
    WHERE  p.id = p_id;
$$ LANGUAGE sql;

-- ===========================================================================
--  ENQUIRIES  —  insert / update
-- ===========================================================================

CREATE OR REPLACE FUNCTION fn_create_enquiry(p_name TEXT, p_email TEXT, p_message TEXT)
RETURNS enquiries AS $$
    INSERT INTO enquiries (name, email, message)
    VALUES (p_name, p_email, p_message)
    RETURNING *;
$$ LANGUAGE sql;

CREATE OR REPLACE FUNCTION fn_mark_enquiry_handled(p_id INT, p_handled BOOLEAN DEFAULT TRUE)
RETURNS enquiries AS $$
    UPDATE enquiries SET is_handled = p_handled WHERE id = p_id RETURNING *;
$$ LANGUAGE sql;

-- Admin enquiries list (footer contact-form submissions).
CREATE OR REPLACE FUNCTION fn_admin_list_enquiries()
RETURNS SETOF enquiries AS $$
    SELECT * FROM enquiries ORDER BY created_at DESC;
$$ LANGUAGE sql STABLE;

-- ===========================================================================
--  ADMIN — auth
-- ===========================================================================

-- Includes password_hash — used only internally by the API to verify admin login.
CREATE OR REPLACE FUNCTION fn_get_admin_by_username(p_username TEXT)
RETURNS SETOF admin_users AS $$
    SELECT * FROM admin_users WHERE username = p_username;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION fn_touch_admin_login(p_id INT)
RETURNS VOID AS $$
    UPDATE admin_users SET last_login_at = now() WHERE id = p_id;
$$ LANGUAGE sql;

-- ===========================================================================
--  ADMIN — dashboard  (show data)
-- ===========================================================================

-- Single-row summary for the admin dashboard cards.
CREATE OR REPLACE FUNCTION fn_dashboard_summary()
RETURNS TABLE (
    orders_pending BIGINT, orders_in_progress BIGINT, orders_delivered BIGINT,
    custom_requests_new BIGINT, enquiries_unhandled BIGINT, products_active BIGINT
)
AS $$
    SELECT
        (SELECT count(*) FROM orders WHERE status = 'pending'),
        (SELECT count(*) FROM orders WHERE status IN ('confirmed','in_preparation','ready','out_for_delivery')),
        (SELECT count(*) FROM orders WHERE status = 'delivered'),
        (SELECT count(*) FROM custom_requests WHERE status = 'new'),
        (SELECT count(*) FROM enquiries WHERE NOT is_handled),
        (SELECT count(*) FROM products WHERE is_active);
$$ LANGUAGE sql STABLE;
