
-- 1) Tighten admin/management policies from {public} to {authenticated} (defense-in-depth)
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname='public'
      AND 'public' = ANY(roles)
      AND policyname ILIKE 'Admins%'
  LOOP
    EXECUTE format('ALTER POLICY %I ON %I.%I TO authenticated',
                   r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

-- Also tighten user-scoped management policies that were created as {public}
ALTER POLICY "Users send messages in own thread" ON public.chat_messages TO authenticated;
ALTER POLICY "Users view own thread messages" ON public.chat_messages TO authenticated;
ALTER POLICY "Users create own thread" ON public.chat_threads TO authenticated;
ALTER POLICY "Users update own thread" ON public.chat_threads TO authenticated;
ALTER POLICY "Users view own thread" ON public.chat_threads TO authenticated;
ALTER POLICY "Users can update own notifications" ON public.notifications TO authenticated;
ALTER POLICY "Users can view own notifications" ON public.notifications TO authenticated;
ALTER POLICY "Users can create own orders" ON public.orders TO authenticated;
ALTER POLICY "Users can create own payments" ON public.payments TO authenticated;
ALTER POLICY "Users can view own payments" ON public.payments TO authenticated;
ALTER POLICY "Users view own point txns" ON public.point_transactions TO authenticated;
ALTER POLICY "Users manage own recently viewed" ON public.recently_viewed TO authenticated;
ALTER POLICY "Users view own points" ON public.user_points TO authenticated;
ALTER POLICY "Users can view own roles" ON public.user_roles TO authenticated;
ALTER POLICY "Users insert own redemptions" ON public.voucher_redemptions TO authenticated;
ALTER POLICY "Users view own redemptions" ON public.voucher_redemptions TO authenticated;

-- 2) Allow users to cancel their own pending orders (legitimate update path)
DROP POLICY IF EXISTS "Users can cancel own pending orders" ON public.orders;
CREATE POLICY "Users can cancel own pending orders"
  ON public.orders FOR UPDATE TO authenticated
  USING (auth.uid() = user_id AND status IN ('pending_payment','processing'))
  WITH CHECK (auth.uid() = user_id AND status IN ('cancelled','pending_payment','processing'));

-- 3) Revoke EXECUTE on SECURITY DEFINER stock/trigger functions from public roles.
--    These are only meant to be called by edge functions (service_role) or as triggers.
REVOKE ALL ON FUNCTION public.reduce_product_stock(uuid, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.reduce_variant_stock(uuid, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.restore_variant_stock(uuid, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.generate_order_number() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reduce_product_stock(uuid, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.reduce_variant_stock(uuid, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.restore_variant_stock(uuid, integer) TO service_role;

-- 4) Harden user_roles: deny self-insert/update of privileged roles.
--    Bootstrap admin must be assigned via service_role / SQL only.
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
CREATE POLICY "Admins can insert roles" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (
    (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner'))
    AND role <> 'owner'
  );

DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
CREATE POLICY "Admins can update roles" ON public.user_roles
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner'))
  WITH CHECK (
    (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner'))
    AND role <> 'owner'
  );
