-- ============================================================
-- Fix: Izinkan bot (auto) mengirim pesan di chat
-- Masalah: CHECK constraint hanya izinkan 'customer' & 'admin'
--          sehingga sender_role 'auto' ditolak database
-- ============================================================

-- 1. Perluas CHECK constraint agar 'auto' diizinkan
ALTER TABLE public.chat_messages
  DROP CONSTRAINT IF EXISTS chat_messages_sender_role_check;

ALTER TABLE public.chat_messages
  ADD CONSTRAINT chat_messages_sender_role_check
  CHECK (sender_role IN ('customer', 'admin', 'auto'));

-- 2. Hapus policy lama jika ada
DROP POLICY IF EXISTS "Users can insert bot reply in own thread" ON public.chat_messages;
DROP POLICY IF EXISTS "Users send messages in own thread" ON public.chat_messages;

-- 3. Buat policy baru: user boleh insert pesan 'customer' di thread miliknya
CREATE POLICY "Users send messages in own thread"
  ON public.chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_role = 'customer'
    AND auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.chat_threads t
      WHERE t.id = thread_id AND t.user_id = auth.uid()
    )
  );

-- 4. Buat policy: user boleh insert pesan 'auto' (bot reply) di thread miliknya
CREATE POLICY "Users can insert bot reply in own thread"
  ON public.chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_role = 'auto'
    AND auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.chat_threads t
      WHERE t.id = thread_id AND t.user_id = auth.uid()
    )
  );

-- 5. Pastikan user bisa SELECT semua pesan di thread miliknya (termasuk pesan admin & auto)
DROP POLICY IF EXISTS "Users view own thread messages" ON public.chat_messages;
CREATE POLICY "Users view own thread messages"
  ON public.chat_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_threads t
      WHERE t.id = thread_id AND t.user_id = auth.uid()
    )
  );

-- 6. Pastikan admin bisa SELECT & INSERT semua pesan
DROP POLICY IF EXISTS "Admins can manage chat messages" ON public.chat_messages;
CREATE POLICY "Admins can manage chat messages"
  ON public.chat_messages FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner')
  );

-- 7. Pastikan user bisa update is_read pada pesan di thread miliknya
DROP POLICY IF EXISTS "Users can mark messages as read" ON public.chat_messages;
CREATE POLICY "Users can mark messages as read"
  ON public.chat_messages FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_threads t
      WHERE t.id = thread_id AND t.user_id = auth.uid()
    )
  );

-- Konfirmasi CHECK constraint
SELECT conname, pg_get_constraintdef(oid) as consrc
FROM pg_constraint
WHERE conrelid = 'public.chat_messages'::regclass
  AND contype = 'c';

-- Konfirmasi policies
SELECT policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'chat_messages';
