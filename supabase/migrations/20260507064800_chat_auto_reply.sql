-- Tabel pengaturan auto-reply chat
CREATE TABLE IF NOT EXISTS chat_auto_reply (
  id           text PRIMARY KEY DEFAULT 'default',
  enabled      boolean NOT NULL DEFAULT false,
  message      text NOT NULL DEFAULT 'Halo! Terima kasih sudah menghubungi SR12 Beauty Hub 🌸 Kami akan segera membalas pesan Anda. Apakah ada yang bisa kami bantu?',
  trigger_mode text NOT NULL DEFAULT 'first_only',  -- 'first_only' | 'always'
  delay_seconds int NOT NULL DEFAULT 1,
  updated_at   timestamptz DEFAULT now()
);

-- Insert baris default
INSERT INTO chat_auto_reply (id)
VALUES ('default')
ON CONFLICT (id) DO NOTHING;

-- RLS: semua authenticated user bisa baca (untuk ChatWidget cek status)
ALTER TABLE chat_auto_reply ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone authenticated can read auto_reply"
  ON chat_auto_reply FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "admin can update auto_reply"
  ON chat_auto_reply FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'owner')
    )
  );
