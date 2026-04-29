-- Extend profiles with personalization fields for the smart profile
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_key text,
  ADD COLUMN IF NOT EXISTS occupation text,
  ADD COLUMN IF NOT EXISTS household_size integer,
  ADD COLUMN IF NOT EXISTS lifestyle_tags text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS likes text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS dislikes text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS budget_range text;
