-- ============================================================
-- Danskys Pesach Lettuce — Supabase Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- PRODUCTS
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         TEXT NOT NULL,
  description  TEXT NOT NULL DEFAULT '',
  price        NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  image_url    TEXT,
  badge        TEXT,           -- e.g. "Bestseller", "New"
  meta         TEXT,           -- e.g. "Serves 4-6 people"
  active       BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default products
INSERT INTO products (name, description, price, badge, meta, sort_order)
VALUES
  ('Romaine Lettuce Head',
   'Premium kosher-checked romaine lettuce. Crisp leaves, ideal for salads and wraps. Carefully inspected for insects.',
   3.99, 'Bestseller', '1 head — serves 2-4', 1),
  ('Iceberg Lettuce Head',
   'Classic iceberg lettuce, crisp and refreshing. Perfectly kosher-checked for Pesach use.',
   3.49, NULL, '1 head — serves 2-4', 2),
  ('Romaine Lettuce 3-Pack',
   'Three kosher-checked romaine lettuce heads — great value for larger families or sedarim.',
   10.99, 'Best Value', '3 heads — serves 8-12', 3),
  ('Mixed Lettuce Bundle',
   'A selection of romaine and iceberg heads, pre-inspected and ready for your Pesach table.',
   12.99, 'Bundle Deal', '2 romaine + 2 iceberg', 4);

-- ============================================================
-- ORDERS
-- ============================================================
CREATE TYPE order_status AS ENUM (
  'pending',
  'payment_authorized',
  'payment_captured',
  'ready_for_pickup',
  'out_for_delivery',
  'completed',
  'cancelled',
  'refunded'
);

CREATE TYPE payment_status AS ENUM (
  'pending',
  'preauthorized',
  'captured',
  'voided',
  'failed'
);

CREATE TYPE delivery_method AS ENUM ('delivery', 'pickup');

CREATE TABLE IF NOT EXISTS orders (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- Status
  status                order_status NOT NULL DEFAULT 'pending',
  delivery_method       delivery_method NOT NULL DEFAULT 'pickup',
  -- Blink payment
  blink_transaction_id  TEXT,
  blink_preauth_id      TEXT,
  payment_status        payment_status NOT NULL DEFAULT 'pending',
  -- Customer
  user_id               UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  first_name            TEXT NOT NULL,
  last_name             TEXT NOT NULL,
  email                 TEXT NOT NULL,
  phone                 TEXT NOT NULL,
  -- Delivery address (NULL for pickup)
  address_line1         TEXT,
  address_line2         TEXT,
  city                  TEXT,
  postcode              TEXT,
  -- Neighbour details (for home delivery)
  neighbour_name        TEXT,
  neighbour_address     TEXT,
  -- Extra
  notes                 TEXT,
  marketing_optin       BOOLEAN NOT NULL DEFAULT FALSE,
  -- Totals
  subtotal              NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0),
  shipping_cost         NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (shipping_cost >= 0),
  total                 NUMERIC(10, 2) NOT NULL CHECK (total >= 0),
  -- Timestamps
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- ORDER ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS order_items (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id       UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id     UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity       INTEGER NOT NULL CHECK (quantity > 0),
  price_at_time  NUMERIC(10, 2) NOT NULL CHECK (price_at_time >= 0),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS orders_email_idx ON orders(email);
CREATE INDEX IF NOT EXISTS orders_status_idx ON orders(status);
CREATE INDEX IF NOT EXISTS orders_delivery_method_idx ON orders(delivery_method);
CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS orders_user_id_idx ON orders(user_id);
CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON order_items(order_id);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Products: public read
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Products are publicly readable"
  ON products FOR SELECT
  USING (active = TRUE);

CREATE POLICY "Admin can manage products"
  ON products FOR ALL
  USING (
    auth.jwt() ->> 'email' = current_setting('app.admin_email', TRUE)
  );

-- Orders: users see own orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own orders"
  ON orders FOR SELECT
  USING (
    auth.uid() = user_id
    OR email = auth.jwt() ->> 'email'
  );

CREATE POLICY "Anyone can create an order"
  ON orders FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "Admin can view all orders"
  ON orders FOR ALL
  USING (
    auth.jwt() ->> 'email' = current_setting('app.admin_email', TRUE)
  );

-- Order Items: follow order access
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view items of their own orders"
  ON order_items FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM orders
      WHERE user_id = auth.uid()
        OR email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "Anyone can create order items"
  ON order_items FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "Admin can manage order items"
  ON order_items FOR ALL
  USING (
    auth.jwt() ->> 'email' = current_setting('app.admin_email', TRUE)
  );
