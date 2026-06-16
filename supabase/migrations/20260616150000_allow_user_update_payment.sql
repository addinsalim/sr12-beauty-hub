-- Allow users to update their own payments (e.g. to confirmed or cancelled)
DROP POLICY IF EXISTS "Users can update own payments" ON public.payments;
CREATE POLICY "Users can update own payments"
  ON public.payments FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = payments.order_id AND orders.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = payments.order_id AND orders.user_id = auth.uid()
  ));
