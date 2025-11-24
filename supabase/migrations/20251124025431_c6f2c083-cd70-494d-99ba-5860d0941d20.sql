-- Add currency field to products table
ALTER TABLE public.products 
ADD COLUMN currency text DEFAULT 'USD' NOT NULL;

-- Create countries table with currency information
CREATE TABLE public.countries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  currency_code text NOT NULL,
  currency_symbol text NOT NULL,
  flag_emoji text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS on countries table
ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;

-- Allow everyone to view countries
CREATE POLICY "Anyone can view countries"
  ON public.countries
  FOR SELECT
  USING (true);

-- Only admins can manage countries
CREATE POLICY "Only admins can manage countries"
  ON public.countries
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert popular countries with their currencies
INSERT INTO public.countries (code, name, currency_code, currency_symbol, flag_emoji) VALUES
  ('US', 'United States', 'USD', '$', '🇺🇸'),
  ('GB', 'United Kingdom', 'GBP', '£', '🇬🇧'),
  ('EU', 'European Union', 'EUR', '€', '🇪🇺'),
  ('CA', 'Canada', 'CAD', 'C$', '🇨🇦'),
  ('AU', 'Australia', 'AUD', 'A$', '🇦🇺'),
  ('IN', 'India', 'INR', '₹', '🇮🇳'),
  ('JP', 'Japan', 'JPY', '¥', '🇯🇵'),
  ('CN', 'China', 'CNY', '¥', '🇨🇳'),
  ('BR', 'Brazil', 'BRL', 'R$', '🇧🇷'),
  ('MX', 'Mexico', 'MXN', '$', '🇲🇽'),
  ('AE', 'United Arab Emirates', 'AED', 'د.إ', '🇦🇪'),
  ('SG', 'Singapore', 'SGD', 'S$', '🇸🇬'),
  ('HK', 'Hong Kong', 'HKD', 'HK$', '🇭🇰'),
  ('KR', 'South Korea', 'KRW', '₩', '🇰🇷'),
  ('ZA', 'South Africa', 'ZAR', 'R', '🇿🇦');

-- Add optional country/region field to products for filtering
ALTER TABLE public.products
ADD COLUMN seller_country text;

-- Create index for faster country filtering
CREATE INDEX idx_products_seller_country ON public.products(seller_country);

COMMENT ON COLUMN public.products.currency IS 'Base currency for the product price (default USD)';
COMMENT ON COLUMN public.products.seller_country IS 'ISO country code of seller location for filtering';