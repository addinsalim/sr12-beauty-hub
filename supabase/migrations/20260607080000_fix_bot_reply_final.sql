-- ============================================================
-- FINAL FIX: Bot auto-reply tidak bisa insert ke chat_messages
-- Root cause: RLS policy terlalu ketat / conflict policies
-- ============================================================

-- 1. Drop SEMUA policy lama di chat_messages agar tidak ada conflict
DROP POLICY IF EXISTS "Users can insert bot reply in own thread" ON public.chat_messages;
DROP POLICY IF EXISTS "Users send messages in own thread" ON public.chat_messages;
DROP POLICY IF EXISTS "Users view own thread messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Admins can manage chat messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can mark messages as read" ON public.chat_messages;
DROP POLICY IF EXISTS "Allow customers to send messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Allow bot to send auto messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Allow users to read own messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Allow admin to manage all messages" ON public.chat_messages;

-- 2. Pastikan CHECK constraint sudah mengizinkan 'auto'
ALTER TABLE public.chat_messages
  DROP CONSTRAINT IF EXISTS chat_messages_sender_role_check;

ALTER TABLE public.chat_messages
  ADD CONSTRAINT chat_messages_sender_role_check
  CHECK (sender_role IN ('customer', 'admin', 'auto'));

-- 3. Buat policy SELECT: user bisa baca semua pesan di thread miliknya
CREATE POLICY "chat_messages_select_own"
  ON public.chat_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_threads ct
      WHERE ct.id = chat_messages.thread_id
        AND ct.user_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'owner')
  );

-- 4. Policy INSERT: user bisa kirim pesan 'customer' di thread miliknya
CREATE POLICY "chat_messages_insert_customer"
  ON public.chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_role = 'customer'
    AND sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.chat_threads ct
      WHERE ct.id = thread_id
        AND ct.user_id = auth.uid()
    )
  );

-- 5. Policy INSERT: user bisa insert pesan 'auto' (bot reply) di thread miliknya
CREATE POLICY "chat_messages_insert_auto"
  ON public.chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_role = 'auto'
    AND sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.chat_threads ct
      WHERE ct.id = thread_id
        AND ct.user_id = auth.uid()
    )
  );

-- 6. Policy UPDATE: user bisa update is_read di thread miliknya
CREATE POLICY "chat_messages_update_own"
  ON public.chat_messages FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_threads ct
      WHERE ct.id = chat_messages.thread_id
        AND ct.user_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'owner')
  );

-- 7. Policy ALL: admin bisa kelola semua pesan
CREATE POLICY "chat_messages_admin_all"
  ON public.chat_messages FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'owner')
  );

-- Verifikasi
SELECT policyname, cmd
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'chat_messages'
ORDER BY policyname;
