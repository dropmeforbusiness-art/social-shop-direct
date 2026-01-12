-- Create ad_campaigns table
CREATE TABLE public.ad_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  daily_rate NUMERIC NOT NULL DEFAULT 100,
  total_budget NUMERIC NOT NULL,
  total_spent NUMERIC NOT NULL DEFAULT 0,
  impressions INTEGER NOT NULL DEFAULT 0,
  clicks INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT valid_dates CHECK (end_date >= start_date),
  CONSTRAINT min_duration CHECK ((end_date - start_date) >= 6),
  CONSTRAINT max_duration CHECK ((end_date - start_date) <= 179)
);

-- Enable RLS
ALTER TABLE public.ad_campaigns ENABLE ROW LEVEL SECURITY;

-- Sellers can view their own campaigns
CREATE POLICY "Sellers can view own campaigns"
ON public.ad_campaigns
FOR SELECT
USING (auth.uid() = seller_id);

-- Sellers can create campaigns for their products
CREATE POLICY "Sellers can create campaigns"
ON public.ad_campaigns
FOR INSERT
WITH CHECK (auth.uid() = seller_id);

-- Sellers can update their own campaigns
CREATE POLICY "Sellers can update own campaigns"
ON public.ad_campaigns
FOR UPDATE
USING (auth.uid() = seller_id);

-- Anyone can view active campaigns (for showing sponsored products)
CREATE POLICY "Anyone can view active campaigns"
ON public.ad_campaigns
FOR SELECT
USING (status = 'active' AND CURRENT_DATE BETWEEN start_date AND end_date);

-- Admins can manage all campaigns
CREATE POLICY "Admins can manage campaigns"
ON public.ad_campaigns
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_ad_campaigns_updated_at
BEFORE UPDATE ON public.ad_campaigns
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_ad_campaigns_active ON public.ad_campaigns(status, start_date, end_date) WHERE status = 'active';
CREATE INDEX idx_ad_campaigns_product ON public.ad_campaigns(product_id);
CREATE INDEX idx_ad_campaigns_seller ON public.ad_campaigns(seller_id);