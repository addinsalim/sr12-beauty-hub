
-- 1) Fix privilege escalation on user_roles: replace broad ALL policy with explicit, admin-only mutation policies
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

CREATE POLICY "Admins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'owner'::app_role)
);

CREATE POLICY "Admins can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'owner'::app_role)
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'owner'::app_role)
);

CREATE POLICY "Admins can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'owner'::app_role)
);

-- 2) Recreate products_public view without SECURITY DEFINER (use security_invoker)
DROP VIEW IF EXISTS public.products_public;

CREATE VIEW public.products_public
WITH (security_invoker = true) AS
SELECT
  id, name, slug, category_id, price, discount, stock,
  description, rating, review_count, bpom, halal, weight,
  expired_date, is_active, created_at, updated_at
FROM public.products
WHERE is_active = true;

GRANT SELECT ON public.products_public TO anon, authenticated;

-- 3) Hide internal user_id from public reviews; expose a safe public view instead
DROP POLICY IF EXISTS "Reviews viewable by everyone" ON public.reviews;

CREATE POLICY "Authenticated users can view reviews"
ON public.reviews
FOR SELECT
TO authenticated
USING (true);

CREATE OR REPLACE VIEW public.reviews_public
WITH (security_invoker = true) AS
SELECT
  r.id,
  r.product_id,
  r.rating,
  r.comment,
  r.created_at,
  COALESCE(p.full_name, 'Anonymous') AS reviewer_name,
  p.avatar_url AS reviewer_avatar
FROM public.reviews r
LEFT JOIN public.profiles p ON p.user_id = r.user_id;

GRANT SELECT ON public.reviews_public TO anon, authenticated;
