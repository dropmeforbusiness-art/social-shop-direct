-- Create storage bucket for product submission images
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-submissions', 'product-submissions', true);

-- Create RLS policies for product submissions bucket
CREATE POLICY "Anyone can upload product images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'product-submissions');

CREATE POLICY "Anyone can view product images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'product-submissions');

-- Create product_submissions table
CREATE TABLE public.product_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_name TEXT NOT NULL,
  seller_location TEXT NOT NULL,
  product_name TEXT NOT NULL,
  product_description TEXT NOT NULL,
  price NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.product_submissions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert submissions
CREATE POLICY "Anyone can submit products"
ON public.product_submissions
FOR INSERT
WITH CHECK (true);

-- Only admins can view all submissions
CREATE POLICY "Admins can view all submissions"
ON public.product_submissions
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can update submissions
CREATE POLICY "Admins can update submissions"
ON public.product_submissions
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can delete submissions
CREATE POLICY "Admins can delete submissions"
ON public.product_submissions
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_product_submissions_updated_at
BEFORE UPDATE ON public.product_submissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();