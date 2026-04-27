
-- STEP A: Drop SEMUA policy yg referensi has_role
DROP POLICY IF EXISTS "Authorized roles can view products" ON public.products;
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can manage orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can manage order items" ON public.order_items;
DROP POLICY IF EXISTS "Admins can manage payments" ON public.payments;
DROP POLICY IF EXISTS "Admins can manage shipments" ON public.shipments;
DROP POLICY IF EXISTS "Admins can manage variants" ON public.variants;
DROP POLICY IF EXISTS "Admins can manage product images" ON public.product_images;
DROP POLICY IF EXISTS "Admins can manage reviews" ON public.reviews;
DROP POLICY IF EXISTS "Admins can manage review images" ON public.review_images;
DROP POLICY IF EXISTS "Admins can manage notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage resellers" ON public.resellers;
DROP POLICY IF EXISTS "Users can view own reseller" ON public.resellers;

-- Drop existing storage policies sebelum rebuild
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Public read for product-images" ON storage.objects;
DROP POLICY IF EXISTS "Public read for review-images" ON storage.objects;
DROP POLICY IF EXISTS "Public can read product-images by path" ON storage.objects;
DROP POLICY IF EXISTS "Public can read review-images by path" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete product images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own review images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own review images" ON storage.objects;

-- STEP B: Hapus tabel resellers & kolom reseller_price
DROP TABLE IF EXISTS public.resellers CASCADE;
ALTER TABLE public.products DROP COLUMN IF EXISTS reseller_price;

-- STEP C: Rebuild enum app_role tanpa 'reseller'
DELETE FROM public.user_roles WHERE role::text = 'reseller';
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role) CASCADE;

ALTER TYPE public.app_role RENAME TO app_role_old;
CREATE TYPE public.app_role AS ENUM ('owner', 'admin', 'customer', 'courier');

ALTER TABLE public.user_roles
  ALTER COLUMN role TYPE public.app_role
  USING role::text::public.app_role;

DROP TYPE IF EXISTS public.app_role_old;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- STEP D: Rebuild semua policies
CREATE POLICY "Anyone can view active products" ON public.products FOR SELECT
TO anon, authenticated USING (is_active = true);
CREATE POLICY "Admins can manage products" ON public.products FOR ALL
USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner'))
WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner'));

CREATE POLICY "Admins can manage categories" ON public.categories FOR ALL
USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner'))
WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner'));

CREATE POLICY "Admins can manage orders" ON public.orders FOR ALL
USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner'))
WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner'));

CREATE POLICY "Admins can manage order items" ON public.order_items FOR ALL
USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner'))
WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner'));

CREATE POLICY "Admins can manage payments" ON public.payments FOR ALL
USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner'))
WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner'));

CREATE POLICY "Admins can manage shipments" ON public.shipments FOR ALL
USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner'))
WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner'));

CREATE POLICY "Admins can manage variants" ON public.variants FOR ALL
USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner'))
WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner'));

CREATE POLICY "Admins can manage product images" ON public.product_images FOR ALL
USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner'))
WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner'));

CREATE POLICY "Admins can manage reviews" ON public.reviews FOR ALL
USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner'))
WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner'));

CREATE POLICY "Admins can manage review images" ON public.review_images FOR ALL
USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner'))
WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner'));

CREATE POLICY "Admins can manage notifications" ON public.notifications FOR ALL
USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner'))
WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner'));

CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT TO authenticated
USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner'));

CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT
USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner'));
CREATE POLICY "Admins can insert roles" ON public.user_roles FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner'));
CREATE POLICY "Admins can update roles" ON public.user_roles FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner'))
WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner'));
CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE TO authenticated
USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner'));

-- STEP E: Revoke EXECUTE pada SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.reduce_variant_stock(uuid, integer) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.restore_variant_stock(uuid, integer) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.generate_order_number() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, public;

-- STEP F: Atomic stock reduction untuk produk non-variant
CREATE OR REPLACE FUNCTION public.reduce_product_stock(p_product_id uuid, p_quantity integer)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  UPDATE public.products SET stock = stock - p_quantity
  WHERE id = p_product_id AND stock >= p_quantity;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient stock for product %', p_product_id;
  END IF;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.reduce_product_stock(uuid, integer) FROM anon, authenticated, public;

-- STEP G: Storage policies
CREATE POLICY "Public can read product-images by path"
ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'product-images');

CREATE POLICY "Public can read review-images by path"
ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'review-images');

CREATE POLICY "Admins can upload product images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'product-images'
  AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner')));
CREATE POLICY "Admins can delete product images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'product-images'
  AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner')));

CREATE POLICY "Users can upload own review images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'review-images'
  AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own review images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'review-images'
  AND auth.uid()::text = (storage.foldername(name))[1]);

-- STEP H: Recreate views (tanpa reseller_price)
DROP VIEW IF EXISTS public.products_public CASCADE;
CREATE VIEW public.products_public
WITH (security_invoker = true) AS
SELECT id, name, slug, category_id, price, discount, stock,
  description, rating, review_count, bpom, halal, weight,
  expired_date, is_active, created_at, updated_at
FROM public.products WHERE is_active = true;
GRANT SELECT ON public.products_public TO anon, authenticated;

DROP VIEW IF EXISTS public.reviews_public CASCADE;
CREATE VIEW public.reviews_public
WITH (security_invoker = true) AS
SELECT r.id, r.product_id, r.rating, r.comment, r.created_at,
  COALESCE(p.full_name, 'Anonymous') AS reviewer_name,
  p.avatar_url AS reviewer_avatar
FROM public.reviews r
LEFT JOIN public.profiles p ON p.user_id = r.user_id;
GRANT SELECT ON public.reviews_public TO anon, authenticated;
