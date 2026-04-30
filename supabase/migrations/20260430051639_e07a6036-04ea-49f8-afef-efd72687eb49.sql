-- WISHLIST
CREATE TABLE public.wishlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own wishlist" ON public.wishlists FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- RECENTLY VIEWED
CREATE TABLE public.recently_viewed (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product_id uuid NOT NULL,
  viewed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);
ALTER TABLE public.recently_viewed ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own recently viewed" ON public.recently_viewed FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_recently_viewed_user_time ON public.recently_viewed(user_id, viewed_at DESC);

-- VOUCHERS
CREATE TABLE public.vouchers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  description text,
  discount_type text NOT NULL CHECK (discount_type IN ('percent','fixed')),
  discount_value bigint NOT NULL,
  min_purchase bigint NOT NULL DEFAULT 0,
  max_discount bigint,
  quota integer,
  used_count integer NOT NULL DEFAULT 0,
  valid_from timestamptz NOT NULL DEFAULT now(),
  valid_until timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated can view active vouchers" ON public.vouchers FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "Admins manage vouchers" ON public.vouchers FOR ALL USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'owner')) WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'owner'));

-- VOUCHER REDEMPTIONS
CREATE TABLE public.voucher_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  voucher_id uuid NOT NULL,
  user_id uuid NOT NULL,
  order_id uuid,
  discount_amount bigint NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.voucher_redemptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own redemptions" ON public.voucher_redemptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own redemptions" ON public.voucher_redemptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins manage redemptions" ON public.voucher_redemptions FOR ALL USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'owner')) WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'owner'));

-- USER POINTS
CREATE TABLE public.user_points (
  user_id uuid PRIMARY KEY,
  balance integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own points" ON public.user_points FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins view all points" ON public.user_points FOR SELECT USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'owner'));
CREATE POLICY "Admins manage points" ON public.user_points FOR ALL USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'owner')) WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'owner'));

-- POINT TRANSACTIONS
CREATE TABLE public.point_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount integer NOT NULL,
  type text NOT NULL CHECK (type IN ('earn','redeem','adjust')),
  reference text,
  order_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.point_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own point txns" ON public.point_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins manage point txns" ON public.point_transactions FOR ALL USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'owner')) WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'owner'));

-- CHAT THREADS
CREATE TABLE public.chat_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  last_message text,
  last_message_at timestamptz,
  unread_admin integer NOT NULL DEFAULT 0,
  unread_user integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.chat_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own thread" ON public.chat_threads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create own thread" ON public.chat_threads FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own thread" ON public.chat_threads FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins manage all threads" ON public.chat_threads FOR ALL USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'owner')) WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'owner'));

-- CHAT MESSAGES
CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL,
  sender_id uuid NOT NULL,
  sender_role text NOT NULL CHECK (sender_role IN ('customer','admin')),
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_chat_messages_thread ON public.chat_messages(thread_id, created_at);
CREATE POLICY "Users view own thread messages" ON public.chat_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.chat_threads t WHERE t.id = thread_id AND t.user_id = auth.uid())
);
CREATE POLICY "Users send messages in own thread" ON public.chat_messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND EXISTS (SELECT 1 FROM public.chat_threads t WHERE t.id = thread_id AND t.user_id = auth.uid())
);
CREATE POLICY "Admins manage all messages" ON public.chat_messages FOR ALL USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'owner')) WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'owner'));

-- Realtime for chat
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_threads;