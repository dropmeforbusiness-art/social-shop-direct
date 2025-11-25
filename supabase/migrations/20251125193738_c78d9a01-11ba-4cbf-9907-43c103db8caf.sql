-- Create buyer profiles table
CREATE TABLE public.buyer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on buyer profiles
ALTER TABLE public.buyer_profiles ENABLE ROW LEVEL SECURITY;

-- Buyers can view their own profile
CREATE POLICY "Buyers can view own profile"
ON public.buyer_profiles
FOR SELECT
USING (auth.uid() = user_id);

-- Buyers can create their own profile
CREATE POLICY "Buyers can create own profile"
ON public.buyer_profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Buyers can update their own profile
CREATE POLICY "Buyers can update own profile"
ON public.buyer_profiles
FOR UPDATE
USING (auth.uid() = user_id);

-- Admins can view all buyer profiles
CREATE POLICY "Admins can view all buyer profiles"
ON public.buyer_profiles
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create orders table to track all purchases
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL,
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  razorpay_signature TEXT,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'pending', -- pending, completed, failed
  buyer_name TEXT,
  buyer_email TEXT,
  buyer_phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Buyers can view their own orders
CREATE POLICY "Buyers can view own orders"
ON public.orders
FOR SELECT
USING (auth.uid() = buyer_id);

-- Sellers can view orders for their products
CREATE POLICY "Sellers can view their sales"
ON public.orders
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM products
    WHERE products.id = orders.product_id
    AND EXISTS (
      SELECT 1 FROM seller_profiles
      WHERE seller_profiles.user_id = auth.uid()
      AND seller_profiles.phone = products.seller_phone
    )
  )
);

-- Admins can view all orders
CREATE POLICY "Admins can view all orders"
ON public.orders
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only authenticated users can create orders
CREATE POLICY "Authenticated users can create orders"
ON public.orders
FOR INSERT
WITH CHECK (auth.uid() = buyer_id);

-- Add trigger for updated_at on buyer_profiles
CREATE TRIGGER update_buyer_profiles_updated_at
BEFORE UPDATE ON public.buyer_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add trigger for updated_at on orders
CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();