-- Add shipping-related columns to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS shipping_method TEXT DEFAULT 'pickup';
ALTER TABLE products ADD COLUMN IF NOT EXISTS seller_address TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS seller_pincode TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS seller_city TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS seller_state TEXT;

-- Add shipping-related columns to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_method TEXT DEFAULT 'pickup';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shiprocket_order_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shiprocket_shipment_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS awb_code TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS courier_name TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_url TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_address TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_pincode TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_city TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_state TEXT;