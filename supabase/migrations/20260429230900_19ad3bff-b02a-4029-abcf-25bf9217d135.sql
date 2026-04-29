-- Categories table for admin product catalog
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  parent_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  icon text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone reads categories" ON public.categories;
CREATE POLICY "Anyone reads categories" ON public.categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins manage categories" ON public.categories;
CREATE POLICY "Admins manage categories" ON public.categories
  FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Add optional columns to existing products (nullable, won't disrupt existing data)
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS compare_at_price numeric(12,2);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);

-- Seed default categories
INSERT INTO public.categories (name, icon, sort_order) VALUES
  ('سوبر ماركت', '🛒', 1),
  ('لحوم', '🥩', 2),
  ('ألبان', '🥛', 3),
  ('خضار وفاكهة', '🥬', 4),
  ('حلويات', '🍰', 5),
  ('مطاعم', '🍽️', 6),
  ('صيدلية', '💊', 7),
  ('سلال', '🧺', 8)
ON CONFLICT DO NOTHING;