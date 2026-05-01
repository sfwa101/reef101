
ALTER TABLE public.geo_zones
  ADD COLUMN IF NOT EXISTS current_load_factor NUMERIC(5,2) NOT NULL DEFAULT 1.0,
  ADD COLUMN IF NOT EXISTS base_eta_minutes INT,
  ADD COLUMN IF NOT EXISTS surge_active BOOLEAN NOT NULL DEFAULT false;

-- Backfill base_eta_minutes from legacy eta_minutes column
UPDATE public.geo_zones
  SET base_eta_minutes = COALESCE(base_eta_minutes, eta_minutes)
  WHERE base_eta_minutes IS NULL;

ALTER TABLE public.branches
  ADD COLUMN IF NOT EXISTS geo_zone_id UUID REFERENCES public.geo_zones(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_branches_geo_zone ON public.branches(geo_zone_id) WHERE geo_zone_id IS NOT NULL;

-- Add geo_zones to realtime so the smart logistics hook can subscribe
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.geo_zones;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
