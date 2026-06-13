-- Kebijakan DELETE: Customer bisa menghapus chat lama di thread miliknya sendiri
CREATE POLICY "chat_messages_delete_own"
  ON public.chat_messages FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_threads ct
      WHERE ct.id = chat_messages.thread_id
        AND ct.user_id = auth.uid()
    )
  );
