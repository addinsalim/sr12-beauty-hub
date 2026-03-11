
-- Fix: Allow anonymous/public users to read from products_public view
-- The view has security_invoker=on, so we need a policy on the base products table
-- But we can't allow anon to read products table directly (it has reseller_price)
-- Solution: Drop the view, recreate it, and add a direct RLS policy for anon on the view
-- Actually, views with security_invoker inherit the caller's permissions on base tables
-- So we need to allow anon SELECT on products table but only through the view

-- Better approach: Make the view security_invoker=off (definer) so it runs as the view owner
-- who has full access. Then the view itself acts as the security boundary.
DROP VIEW IF EXISTS public.products_public;
CREATE VIEW public.products_public AS
  SELECT id, name, slug, category_id, price, discount, stock, rating, review_count,
         bpom, halal, weight, expired_date, description, is_active, created_at, updated_at
  FROM public.products
  WHERE is_active = true;

-- Grant SELECT on the view to anon and authenticated roles
GRANT SELECT ON public.products_public TO anon;
GRANT SELECT ON public.products_public TO authenticated;
