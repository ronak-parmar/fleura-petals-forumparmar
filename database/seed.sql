-- ============================================================================
--  Fleuréa Petals — demo seed data  (seed.sql)
--  Run after schema.sql and functions.sql.
-- ============================================================================

BEGIN;

INSERT INTO categories (name, slug, description, sort_order) VALUES
  ('Ribbon Blooms',      'ribbon-blooms',      'Hand-wound satin ribbon flowers, single stems to full arrangements.', 1),
  ('Pipe-Cleaner Posies', 'pipe-cleaner-posies','Playful textured blooms with a soft handmade edge.',                  2),
  ('Silk Bouquets',      'silk-bouquets',      'Full, event-ready arrangements for weddings and venues.',             3),
  ('Fresh & Gifted',     'fresh-and-gifted',   'Same-day fresh flower bouquets, optionally paired with a gift.',      4);

INSERT INTO products
  (category_id, name, slug, short_description, nature, price, is_customizable, availability, lead_time_days, image_url) VALUES
  (1, 'Rosewood Ribbon Bouquet',    'rosewood-ribbon-bouquet',    'Deep rosewood satin roses on wired stems.',      'everlasting', 1450.00, TRUE,  'available',     4, '/images/products/rosewood-ribbon-bouquet.jpg'),
  (2, 'Blush Pipe-Cleaner Posy',    'blush-pipe-cleaner-posy',    'A small blush posy, a favourite for kids.',      'everlasting',  650.00, TRUE,  'available',     3, '/images/products/blush-pipe-cleaner-posy.jpg'),
  (3, 'Sage Garden Silk Bouquet',   'sage-garden-silk-bouquet',   'Event-ready silk arrangement in sage & ivory.',  'everlasting', 2200.00, TRUE,  'made_to_order', 7, '/images/products/sage-garden-silk-bouquet.jpg'),
  (4, 'Morning Market Fresh Bunch', 'morning-market-fresh-bunch', 'Seasonal stems, arranged the morning of.',       'fresh',        900.00, FALSE, 'available',     1, '/images/products/morning-market-fresh-bunch.jpg'),
  (4, 'Golden Hour Fresh & Gift',   'golden-hour-fresh-gift',     'Fresh bouquet paired with a small gift.',        'fresh',       1350.00, FALSE, 'available',     1, '/images/products/golden-hour-fresh-gift.jpg'),
  (1, 'Petite Everlasting Jar',     'petite-everlasting-jar',     'A jar of ribbon blooms for a shelf or desk.',    'everlasting',  550.00, FALSE, 'sold_out',      5, '/images/products/petite-everlasting-jar.jpg');

-- admin login: username 'forum', password 'petals123' (bcrypt hash, cost 11)
INSERT INTO admin_users (name, username, email, password_hash) VALUES
  ('Forum Parmar', 'forum', 'forum@fleureapetals.app', '$2a$11$1y7j.n9/StrBQiNgSkCBXe/dctV.fzVzDe8cypI8Mv/jrNqXxdPsm');

-- demo customers — password 'password123' for both (bcrypt, cost 11). Mirrors app/src/lib/api/fixtures.ts.
INSERT INTO customers (name, email, phone, password_hash, is_registered) VALUES
  ('Beena Parmar', 'beena.parmar@example.com', '9800000012', '$2a$11$uvzK0tD.ZUwSGdkIgLk9k.QthOmqeGZNdTKTfwh0WlCjSuZJPR6Py', TRUE),
  ('Ronak Parmar', 'ronak.parmar@example.com', '9700000040', '$2a$11$IunHpA.ki7NdMKsMevENle6I0qz9toPq3sXsgiOdzuQz8wS1GYF4e', TRUE);

INSERT INTO addresses (customer_id, label, recipient_name, phone, line1, line2, city, state, postal_code, landmark)
SELECT id, 'Home', 'Beena Parmar', '9800000012', '14, Rose Villa, Linking Road', '', 'Mumbai', 'Maharashtra', '400052', 'Near the bakery'
FROM customers WHERE email = 'beena.parmar@example.com';

-- Seeded order FP-2026-000042 for Beena — inserted directly (not via fn_place_order)
-- so the order_number matches the mock fixture exactly; the sequence is advanced
-- afterwards so the next real fn_place_order() call issues FP-2026-000043.
INSERT INTO orders (
    order_number, customer_id, status, subtotal, delivery_fee, total,
    recipient_name, recipient_phone, address_line1, address_line2, city, state, postal_code, landmark,
    delivery_date, delivery_slot, gift_message, placed_at
)
SELECT
    'FP-2026-000042', id, 'in_preparation', 3650.00, 0.00, 3650.00,
    'Beena Parmar', '9800000012', '14, Rose Villa, Linking Road', '', 'Mumbai', 'Maharashtra', '400052', 'Near the bakery',
    CURRENT_DATE, 'morning', 'Happy birthday, Ma — these won''t wilt, just like you asked.', now() - interval '3 days'
FROM customers WHERE email = 'beena.parmar@example.com';

INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity, line_total)
SELECT o.id, p.id, p.name, p.price, v.quantity, p.price * v.quantity
FROM orders o
JOIN (VALUES ('rosewood-ribbon-bouquet', 1), ('blush-pipe-cleaner-posy', 2), ('morning-market-fresh-bunch', 1)) AS v(slug, quantity) ON TRUE
JOIN products p ON p.slug = v.slug
WHERE o.order_number = 'FP-2026-000042';

SELECT setval('order_number_seq', 42);

-- Seeded custom request FP-CR-2026-000007 from Ronak — same reasoning as above.
INSERT INTO custom_requests (
    request_number, customer_id, contact_name, contact_email, contact_phone,
    bouquet_type, occasion, palette, flowers_preferred, size,
    budget_min, budget_max, need_by_date, reference_notes, status, created_at
)
SELECT
    'FP-CR-2026-000007', id, 'Ronak Parmar', 'ronak.parmar@example.com', '9700000040',
    'mixed', '25th wedding anniversary', 'Ivory, blush, a little gold', 'Roses and lisianthus', 'large',
    2500.00, 4000.00, CURRENT_DATE + INTERVAL '20 days', 'Something that photographs well on a dinner table.',
    'reviewing', now() - interval '4 days'
FROM customers WHERE email = 'ronak.parmar@example.com';

SELECT setval('request_number_seq', 7);

COMMIT;
