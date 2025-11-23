-- Add seller information columns to products table
ALTER TABLE public.products
ADD COLUMN seller_name TEXT,
ADD COLUMN seller_location TEXT;