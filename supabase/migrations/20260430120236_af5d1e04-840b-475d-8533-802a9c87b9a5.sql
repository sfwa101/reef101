-- Marketing banners table
CREATE TABLE IF NOT EXISTS public.banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subtitle text,
  image_url text NOT NULL,
  placement text NOT NULL DEFAULT 'hero', -- hero | category_middle | cart_top | home_strip
  link_url text,
  category_slug text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY banners_public_read ON public.banners
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

CREATE POLICY banners_staff_manage ON public.banners
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'store_manager'::app_role) OR has_role(auth.uid(), 'finance'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'store_manager'::app_role) OR has_role(auth.uid(), 'finance'::app_role));

CREATE INDEX IF NOT EXISTS idx_banners_placement_active ON public.banners(placement, is_active, sort_order);

-- Storage bucket for banner images
INSERT INTO storage.buckets (id, name, public)
VALUES ('marketing-banners', 'marketing-banners', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "banners_public_read_objects" ON storage.objects
  FOR SELECT USING (bucket_id = 'marketing-banners');

CREATE POLICY "banners_staff_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'marketing-banners' AND (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'store_manager'::app_role) OR
    has_role(auth.uid(), 'finance'::app_role)
  ));

CREATE POLICY "banners_staff_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'marketing-banners' AND (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'store_manager'::app_role)
  ));

CREATE POLICY "banners_staff_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'marketing-banners' AND (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'store_manager'::app_role)
  ));