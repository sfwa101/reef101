-- ============================================================
-- 1. BRANCHES (Cross-Border Foundation)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.branches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  country text NOT NULL,
  country_code text NOT NULL,
  currency text NOT NULL DEFAULT 'EGP',
  timezone text NOT NULL DEFAULT 'Africa/Cairo',
  default_locale text NOT NULL DEFAULT 'ar',
  supported_locales text[] NOT NULL DEFAULT ARRAY['ar'],
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "branches_admin_manage" ON public.branches
  FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role));

CREATE POLICY "branches_public_read" ON public.branches
  FOR SELECT TO anon, authenticated USING (is_active = true);

CREATE TRIGGER trg_branches_updated BEFORE UPDATE ON public.branches
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed default Egypt branch
INSERT INTO public.branches (code, name, country, country_code, currency, timezone, default_locale, supported_locales)
VALUES ('EG-MAIN','ريف المدينة - مصر','Egypt','EG','EGP','Africa/Cairo','ar', ARRAY['ar','en'])
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- 2. LINK EXISTING TABLES TO BRANCHES
-- ============================================================
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL;
ALTER TABLE public.warehouses ADD COLUMN IF NOT EXISTS branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL;
ALTER TABLE public.vendors    ADD COLUMN IF NOT EXISTS branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL;
ALTER TABLE public.stores     ADD COLUMN IF NOT EXISTS branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL;
ALTER TABLE public.profiles   ADD COLUMN IF NOT EXISTS preferred_locale text DEFAULT 'ar';
ALTER TABLE public.profiles   ADD COLUMN IF NOT EXISTS branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL;

-- Default-attach existing rows to EG-MAIN
UPDATE public.warehouses SET branch_id = (SELECT id FROM public.branches WHERE code='EG-MAIN') WHERE branch_id IS NULL;
UPDATE public.vendors    SET branch_id = (SELECT id FROM public.branches WHERE code='EG-MAIN') WHERE branch_id IS NULL;
UPDATE public.stores     SET branch_id = (SELECT id FROM public.branches WHERE code='EG-MAIN') WHERE branch_id IS NULL;
UPDATE public.user_roles SET branch_id = (SELECT id FROM public.branches WHERE code='EG-MAIN') WHERE branch_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_warehouses_branch ON public.warehouses(branch_id);
CREATE INDEX IF NOT EXISTS idx_vendors_branch    ON public.vendors(branch_id);
CREATE INDEX IF NOT EXISTS idx_stores_branch     ON public.stores(branch_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_branch ON public.user_roles(branch_id);

-- Helper: branch ids accessible to a user (admin = all, others = their assigned branches)
CREATE OR REPLACE FUNCTION public.user_branch_ids(_user_id uuid)
RETURNS SETOF uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.branches WHERE has_role(_user_id, 'admin'::app_role)
  UNION
  SELECT branch_id FROM public.user_roles
   WHERE user_id = _user_id AND is_active = true AND branch_id IS NOT NULL
$$;

-- Layered RLS for geo-isolation (additive — does not remove existing policies)
CREATE POLICY "warehouses_branch_scope" ON public.warehouses
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(),'admin'::app_role)
    OR branch_id IS NULL
    OR branch_id IN (SELECT public.user_branch_ids(auth.uid()))
  );

CREATE POLICY "vendors_branch_scope" ON public.vendors
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(),'admin'::app_role)
    OR branch_id IS NULL
    OR branch_id IN (SELECT public.user_branch_ids(auth.uid()))
    OR owner_user_id = auth.uid()
  );

-- ============================================================
-- 3. ZONE AVAILABILITY (Geo-Fencing for products/categories)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.zone_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id text REFERENCES public.products(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.categories(id) ON DELETE CASCADE,
  zone_id text NOT NULL,
  branch_id uuid REFERENCES public.branches(id) ON DELETE CASCADE,
  is_available boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT za_target_check CHECK (
    (product_id IS NOT NULL AND category_id IS NULL) OR
    (product_id IS NULL AND category_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_za_zone_product  ON public.zone_availability(zone_id, product_id) WHERE product_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_za_zone_category ON public.zone_availability(zone_id, category_id) WHERE category_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_za_product  ON public.zone_availability(product_id, zone_id)  WHERE product_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_za_category ON public.zone_availability(category_id, zone_id) WHERE category_id IS NOT NULL;

ALTER TABLE public.zone_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "za_admin_manage" ON public.zone_availability
  FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'store_manager'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'store_manager'::app_role));

CREATE POLICY "za_public_read" ON public.zone_availability
  FOR SELECT TO anon, authenticated USING (true);

-- Visibility resolver: a product is visible in a zone if either
--   (a) no explicit rule exists (default-allow), OR
--   (b) an enabled rule exists for the product, OR for its category
CREATE OR REPLACE FUNCTION public.is_product_available_in_zone(_product_id text, _zone_id text)
RETURNS boolean LANGUAGE sql STABLE SET search_path = public AS $$
  WITH product_rule AS (
    SELECT is_available FROM public.zone_availability
    WHERE product_id = _product_id AND zone_id = _zone_id
    LIMIT 1
  ),
  category_rule AS (
    SELECT za.is_available
    FROM public.zone_availability za
    JOIN public.products p ON p.category_id = za.category_id
    WHERE p.id = _product_id AND za.zone_id = _zone_id
    LIMIT 1
  )
  SELECT COALESCE(
    (SELECT is_available FROM product_rule),
    (SELECT is_available FROM category_rule),
    true
  );
$$;

-- ============================================================
-- 4. i18n COLUMNS (parallel — non-breaking)
-- ============================================================
ALTER TABLE public.products   ADD COLUMN IF NOT EXISTS name_i18n        jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.products   ADD COLUMN IF NOT EXISTS description_i18n jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS name_i18n        jsonb DEFAULT '{}'::jsonb;

CREATE OR REPLACE FUNCTION public.i18n_text(_i18n jsonb, _fallback text, _locale text DEFAULT 'ar')
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT COALESCE(
    NULLIF(_i18n ->> _locale, ''),
    NULLIF(_i18n ->> 'ar', ''),
    NULLIF(_i18n ->> 'en', ''),
    _fallback
  );
$$;

-- ============================================================
-- 5. HYBRID FULFILLMENT RESOLVER per branch
-- ============================================================
-- Returns the best fulfillment plan for a product in a given branch:
--   stock_available > 0 → 'internal_stock' from that warehouse
--   else → 'dropship_import' (route to vendor or main branch)
CREATE OR REPLACE FUNCTION public.resolve_fulfillment(_product_id text, _branch_id uuid, _zone text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE _local_stock int; _wh uuid; _vendor uuid;
BEGIN
  SELECT (il.stock - il.reserved), il.warehouse_id
    INTO _local_stock, _wh
  FROM public.inventory_locations il
  JOIN public.warehouses w ON w.id = il.warehouse_id
  WHERE il.product_id = _product_id
    AND w.branch_id = _branch_id
    AND w.is_active = true
    AND (_zone IS NULL OR _zone = ANY(w.served_zones) OR array_length(w.served_zones,1) IS NULL)
  ORDER BY (il.stock - il.reserved) DESC, w.priority ASC
  LIMIT 1;

  IF _local_stock IS NOT NULL AND _local_stock > 0 THEN
    RETURN jsonb_build_object(
      'mode','internal_stock',
      'warehouse_id', _wh,
      'available', _local_stock,
      'branch_id', _branch_id
    );
  END IF;

  -- Fallback: any other branch warehouse with stock (cross-border dropship/import)
  SELECT il.warehouse_id, w.vendor_id
    INTO _wh, _vendor
  FROM public.inventory_locations il
  JOIN public.warehouses w ON w.id = il.warehouse_id
  WHERE il.product_id = _product_id
    AND w.is_active = true
    AND (il.stock - il.reserved) > 0
  ORDER BY w.priority ASC
  LIMIT 1;

  IF _wh IS NOT NULL THEN
    RETURN jsonb_build_object(
      'mode','dropship_import',
      'source_warehouse_id', _wh,
      'source_vendor_id', _vendor,
      'target_branch_id', _branch_id,
      'note','out_of_local_stock_routed_cross_border'
    );
  END IF;

  RETURN jsonb_build_object('mode','unavailable','target_branch_id', _branch_id);
END; $$;