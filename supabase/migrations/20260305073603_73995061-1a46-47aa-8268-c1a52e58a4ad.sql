
-- Create a public-facing view that excludes reseller_price
CREATE OR REPLACE VIEW public.products_public AS
SELECT 
  p.id, p.name, p.slug, p.category_id, p.price, p.discount, p.stock,
  p.description, p.rating, p.review_count, p.bpom, p.halal, p.weight,
  p.expired_date, p.is_active, p.created_at, p.updated_at
FROM public.products p;

-- Grant SELECT on the view to anon and authenticated
GRANT SELECT ON public.products_public TO anon, authenticated;

-- Remove the public SELECT policy on the products table
DROP POLICY IF EXISTS "Products viewable by everyone" ON public.products;

-- Add a restricted SELECT policy: only admin/owner/reseller can read products directly
CREATE POLICY "Authorized roles can view products" 
ON public.products FOR SELECT TO authenticated 
USING (
  public.has_role(auth.uid(), 'admin'::app_role) 
  OR public.has_role(auth.uid(), 'owner'::app_role) 
  OR public.has_role(auth.uid(), 'reseller'::app_role)
);
