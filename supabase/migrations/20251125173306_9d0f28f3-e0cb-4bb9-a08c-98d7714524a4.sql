-- Add seller_phone column to products table
ALTER TABLE public.products ADD COLUMN seller_phone text;

-- Update app_role enum to include seller
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'seller';

-- Create seller profiles table to link phone numbers with user accounts
CREATE TABLE public.seller_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  phone text NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS on seller_profiles
ALTER TABLE public.seller_profiles ENABLE ROW LEVEL SECURITY;

-- Sellers can view their own profile
CREATE POLICY "Sellers can view own profile"
ON public.seller_profiles
FOR SELECT
USING (auth.uid() = user_id);

-- Sellers can update their own profile
CREATE POLICY "Sellers can update own profile"
ON public.seller_profiles
FOR UPDATE
USING (auth.uid() = user_id);

-- Admins can view all seller profiles
CREATE POLICY "Admins can view all seller profiles"
ON public.seller_profiles
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can manage seller profiles
CREATE POLICY "Admins can manage seller profiles"
ON public.seller_profiles
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Update products RLS policies to allow sellers to manage their own products
CREATE POLICY "Sellers can view their own products"
ON public.products
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.seller_profiles
    WHERE seller_profiles.user_id = auth.uid()
    AND seller_profiles.phone = products.seller_phone
  )
);

CREATE POLICY "Sellers can update their own products"
ON public.products
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.seller_profiles
    WHERE seller_profiles.user_id = auth.uid()
    AND seller_profiles.phone = products.seller_phone
  )
);

CREATE POLICY "Sellers can delete their own products"
ON public.products
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.seller_profiles
    WHERE seller_profiles.user_id = auth.uid()
    AND seller_profiles.phone = products.seller_phone
  )
);