-- ============================================================
-- Migration 001: stock management + safety constraints
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Add stock_quantity column to products (if not already present)
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT NULL;

-- 2. Unique constraint on blink_transaction_id
--    Prevents duplicate orders if the browser retries a 3DS callback.
--    NULL values are excluded from uniqueness so orders without a
--    transaction ID (e.g. free/test) can still coexist.
ALTER TABLE orders
  ADD CONSTRAINT IF NOT EXISTS orders_blink_transaction_id_unique
  UNIQUE (blink_transaction_id);

-- 3. decrement_stock — safely reduces stock, floor at 0
CREATE OR REPLACE FUNCTION decrement_stock(p_product_id UUID, p_qty INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE products
  SET stock_quantity = GREATEST(0, stock_quantity - p_qty)
  WHERE id = p_product_id
    AND stock_quantity IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- 4. increment_stock — restores stock when an order is cancelled
CREATE OR REPLACE FUNCTION increment_stock(p_product_id UUID, p_qty INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE products
  SET stock_quantity = stock_quantity + p_qty
  WHERE id = p_product_id
    AND stock_quantity IS NOT NULL;
END;
$$ LANGUAGE plpgsql;
