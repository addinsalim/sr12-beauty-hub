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

-- 2. Tambah policy: user boleh insert pesan 'auto' (bot reply) di thread miliknya
DROP POLICY IF EXISTS "Users can insert bot reply in own thread" ON public.chat_messages;
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

-- 3. Pastikan user bisa update thread (last_message, unread_user) untuk bot reply
-- Policy sudah ada di "Users update own thread", tidak perlu tambah lagi

-- Konfirmasi
SELECT conname, pg_get_constraintdef(oid) AS consrc
FROM pg_constraint
WHERE conrelid = 'public.chat_messages'::regclass
  AND contype = 'c';
