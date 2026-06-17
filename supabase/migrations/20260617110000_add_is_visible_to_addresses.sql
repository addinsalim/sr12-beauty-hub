-- Add is_visible column to addresses to support soft delete
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS is_visible BOOLEAN NOT NULL DEFAULT true;
