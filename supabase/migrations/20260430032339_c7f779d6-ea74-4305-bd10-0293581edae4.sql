-- Shared trigger fn (idempotent)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

DO $$ BEGIN
  CREATE TYPE public.app_user_level AS ENUM ('bronze','silver','gold','platinum');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_behavior_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  session_id text,
  event_type text NOT NULL CHECK (event_type IN ('view_product','view_category','search','add_to_cart','purchase','app_open')),
  product_id text, category text, query text, dwell_ms integer,
  weight integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ubl_user_created_idx ON public.user_behavior_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ubl_category_idx ON public.user_behavior_logs(category) WHERE category IS NOT NULL;
CREATE INDEX IF NOT EXISTS ubl_product_idx ON public.user_behavior_logs(product_id) WHERE product_id IS NOT NULL;
ALTER TABLE public.user_behavior_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ubl_self_insert ON public.user_behavior_logs;
CREATE POLICY ubl_self_insert ON public.user_behavior_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
DROP POLICY IF EXISTS ubl_self_select ON public.user_behavior_logs;
CREATE POLICY ubl_self_select ON public.user_behavior_logs FOR SELECT TO authenticated USING (auth.uid() = user_id OR has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS ubl_anon_insert ON public.user_behavior_logs;
CREATE POLICY ubl_anon_insert ON public.user_behavior_logs FOR INSERT TO anon WITH CHECK (user_id IS NULL);

CREATE TABLE IF NOT EXISTS public.flash_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  cycle_label text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS fs_active_idx ON public.flash_sales(is_active, ends_at DESC);
ALTER TABLE public.flash_sales ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS fs_public_read ON public.flash_sales;
CREATE POLICY fs_public_read ON public.flash_sales FOR SELECT USING (true);
DROP POLICY IF EXISTS fs_staff_write ON public.flash_sales;
CREATE POLICY fs_staff_write ON public.flash_sales FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'finance') OR has_role(auth.uid(),'store_manager'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'finance') OR has_role(auth.uid(),'store_manager'));

CREATE TABLE IF NOT EXISTS public.flash_sale_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flash_sale_id uuid NOT NULL REFERENCES public.flash_sales(id) ON DELETE CASCADE,
  product_id text NOT NULL, product_name text,
  original_price numeric NOT NULL, discount_pct numeric NOT NULL,
  reason text, category text, rank integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS fsp_sale_idx ON public.flash_sale_products(flash_sale_id, rank);
ALTER TABLE public.flash_sale_products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS fsp_public_read ON public.flash_sale_products;
CREATE POLICY fsp_public_read ON public.flash_sale_products FOR SELECT USING (true);
DROP POLICY IF EXISTS fsp_staff_write ON public.flash_sale_products;
CREATE POLICY fsp_staff_write ON public.flash_sale_products FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'finance') OR has_role(auth.uid(),'store_manager'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'finance') OR has_role(auth.uid(),'store_manager'));

CREATE TABLE IF NOT EXISTS public.mega_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  trigger_kind text NOT NULL CHECK (trigger_kind IN ('weekday_tuesday','weekday_friday','first_friday_of_month','custom')),
  active_date date,
  banner_title text NOT NULL, banner_subtitle text,
  banner_color_hex text NOT NULL DEFAULT '#3F5226',
  global_discount_pct numeric NOT NULL DEFAULT 0,
  category_discounts jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.mega_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS me_public_read ON public.mega_events;
CREATE POLICY me_public_read ON public.mega_events FOR SELECT USING (is_active);
DROP POLICY IF EXISTS me_staff_write ON public.mega_events;
CREATE POLICY me_staff_write ON public.mega_events FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'finance') OR has_role(auth.uid(),'store_manager'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'finance') OR has_role(auth.uid(),'store_manager'));

CREATE TABLE IF NOT EXISTS public.discounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  scope text NOT NULL CHECK (scope IN ('product','category','source','order')),
  scope_value text,
  discount_pct numeric NOT NULL DEFAULT 0,
  discount_amount numeric, min_order_total numeric,
  min_user_level public.app_user_level NOT NULL DEFAULT 'bronze',
  starts_at timestamptz, ends_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.discounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS d_public_read ON public.discounts;
CREATE POLICY d_public_read ON public.discounts FOR SELECT USING (is_active);
DROP POLICY IF EXISTS d_staff_write ON public.discounts;
CREATE POLICY d_staff_write ON public.discounts FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'finance'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'finance'));

CREATE TABLE IF NOT EXISTS public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE, description text,
  discount_pct numeric NOT NULL DEFAULT 0, discount_amount numeric, min_order_total numeric,
  min_user_level public.app_user_level NOT NULL DEFAULT 'bronze',
  max_uses integer, uses_count integer NOT NULL DEFAULT 0, per_user_limit integer NOT NULL DEFAULT 1,
  starts_at timestamptz, ends_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS c_public_read ON public.coupons;
CREATE POLICY c_public_read ON public.coupons FOR SELECT USING (is_active);
DROP POLICY IF EXISTS c_staff_write ON public.coupons;
CREATE POLICY c_staff_write ON public.coupons FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'finance'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'finance'));

CREATE TABLE IF NOT EXISTS public.coupon_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id uuid NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  user_id uuid NOT NULL, order_id uuid,
  redeemed_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS cr_user_idx ON public.coupon_redemptions(user_id);
ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS cr_self_view ON public.coupon_redemptions;
CREATE POLICY cr_self_view ON public.coupon_redemptions FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(),'admin') OR has_role(auth.uid(),'finance'));
DROP POLICY IF EXISTS cr_self_insert ON public.coupon_redemptions;
CREATE POLICY cr_self_insert ON public.coupon_redemptions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.compute_user_level(_user_id uuid)
RETURNS public.app_user_level LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE cnt integer;
BEGIN
  SELECT COUNT(*) INTO cnt FROM public.orders WHERE user_id = _user_id AND status = 'delivered';
  IF cnt >= 50 THEN RETURN 'platinum';
  ELSIF cnt >= 20 THEN RETURN 'gold';
  ELSIF cnt >= 5  THEN RETURN 'silver';
  ELSE RETURN 'bronze'; END IF;
END $$;

CREATE OR REPLACE FUNCTION public.progress_to_next_level(_user_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE cnt integer; cur public.app_user_level; nxt text; target integer;
BEGIN
  SELECT COUNT(*) INTO cnt FROM public.orders WHERE user_id = _user_id AND status = 'delivered';
  cur := public.compute_user_level(_user_id);
  IF cur = 'bronze' THEN nxt := 'silver';   target := 5;
  ELSIF cur = 'silver' THEN nxt := 'gold';  target := 20;
  ELSIF cur = 'gold'   THEN nxt := 'platinum'; target := 50;
  ELSE nxt := NULL; target := cnt; END IF;
  RETURN jsonb_build_object('current_level', cur,'current_count', cnt,'next_level', nxt,'target', target,'remaining', GREATEST(0, COALESCE(target,0) - cnt));
END $$;

CREATE OR REPLACE FUNCTION public.category_affinity(_user_id uuid)
RETURNS TABLE(category text, score numeric)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT category,
    SUM(CASE event_type WHEN 'purchase' THEN 10 WHEN 'add_to_cart' THEN 5
         WHEN 'view_product' THEN 1 WHEN 'view_category' THEN 2 ELSE 1 END * weight)::numeric AS score
  FROM public.user_behavior_logs
  WHERE user_id = _user_id AND category IS NOT NULL
    AND created_at > now() - interval '60 days'
  GROUP BY category ORDER BY score DESC
$$;

CREATE OR REPLACE FUNCTION public.log_behavior(_event text, _product_id text DEFAULT NULL, _category text DEFAULT NULL, _query text DEFAULT NULL, _dwell_ms integer DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _id uuid;
BEGIN
  INSERT INTO public.user_behavior_logs(user_id, event_type, product_id, category, query, dwell_ms)
  VALUES (auth.uid(), _event, _product_id, _category, _query, _dwell_ms)
  RETURNING id INTO _id; RETURN _id;
END $$;

CREATE OR REPLACE FUNCTION public.personalized_flash_picks(_user_id uuid, _limit integer DEFAULT 8)
RETURNS TABLE(product_id text, product_name text, category text, original_price numeric, suggested_discount_pct numeric, reason text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH affinity AS (SELECT category, score FROM public.category_affinity(_user_id)),
  slow_movers AS (
    SELECT p.id, p.name, p.category, p.price FROM public.products p
    WHERE p.is_active = true AND p.stock > 30
    ORDER BY p.stock DESC, p.updated_at ASC LIMIT 40
  )
  SELECT sm.id, sm.name, sm.category, sm.price,
    CASE WHEN sm.category IN (SELECT category FROM affinity LIMIT 3) THEN 25 ELSE 15 END::numeric,
    CASE WHEN sm.category IN (SELECT category FROM affinity LIMIT 3) THEN 'مخصص لك + تصريف مخزون' ELSE 'تصريف مخزون' END
  FROM slow_movers sm
  ORDER BY (sm.category IN (SELECT category FROM affinity LIMIT 3)) DESC, sm.price ASC
  LIMIT _limit
$$;

CREATE OR REPLACE FUNCTION public.rotate_flash_sale()
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _new_id uuid;
BEGIN
  UPDATE public.flash_sales SET is_active = false WHERE is_active = true;
  INSERT INTO public.flash_sales(starts_at, ends_at, cycle_label)
  VALUES (now(), now() + interval '2 hours', to_char(now() AT TIME ZONE 'Africa/Cairo', 'HH24:MI'))
  RETURNING id INTO _new_id;
  INSERT INTO public.flash_sale_products(flash_sale_id, product_id, product_name, original_price, discount_pct, reason, category, rank)
  SELECT _new_id, p.id, p.name, p.price,
    CASE WHEN p.stock > 100 THEN 30 WHEN p.stock > 50 THEN 20 ELSE 15 END,
    'تصريف مخزون', p.category, ROW_NUMBER() OVER (ORDER BY p.stock DESC)
  FROM public.products p
  WHERE p.is_active = true AND p.stock > 30
  ORDER BY p.stock DESC LIMIT 8;
  RETURN _new_id;
END $$;

DROP TRIGGER IF EXISTS trg_mega_events_updated ON public.mega_events;
CREATE TRIGGER trg_mega_events_updated BEFORE UPDATE ON public.mega_events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_discounts_updated ON public.discounts;
CREATE TRIGGER trg_discounts_updated BEFORE UPDATE ON public.discounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.mega_events(name, trigger_kind, banner_title, banner_subtitle, banner_color_hex, global_discount_pct, category_discounts)
SELECT 'ثلاثاء العروض','weekday_tuesday','ثلاثاء العروض','خصومات على آلاف المنتجات','#B8860B', 10, '{}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.mega_events WHERE trigger_kind='weekday_tuesday');

INSERT INTO public.mega_events(name, trigger_kind, banner_title, banner_subtitle, banner_color_hex, global_discount_pct, category_discounts)
SELECT 'جمعة المدينة','weekday_friday','جمعة المدينة','وفّر أكثر في يوم الجمعة','#3F5226', 12, '{}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.mega_events WHERE trigger_kind='weekday_friday');

INSERT INTO public.mega_events(name, trigger_kind, banner_title, banner_subtitle, banner_color_hex, global_discount_pct, category_discounts)
SELECT 'الجمعة الأولى الكبرى','first_friday_of_month','الجمعة الأولى الكبرى','خصومات ضخمة على السلال والجملة واللحوم','#7A2E2E', 20,
       '{"baskets":25,"wholesale":25,"meat":20,"wallet_topup":15}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.mega_events WHERE trigger_kind='first_friday_of_month');