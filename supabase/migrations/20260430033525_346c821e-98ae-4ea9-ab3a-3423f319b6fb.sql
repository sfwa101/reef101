-- =====================================================
-- 1) product_batches (expiry-aware inventory)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.product_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id text NOT NULL,
  warehouse_id uuid REFERENCES public.warehouses(id) ON DELETE CASCADE,
  batch_code text,
  quantity int NOT NULL DEFAULT 0,
  cost_per_unit numeric(12,2),
  received_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS pb_product_idx ON public.product_batches(product_id);
CREATE INDEX IF NOT EXISTS pb_expiry_idx ON public.product_batches(expires_at) WHERE expires_at IS NOT NULL;

ALTER TABLE public.product_batches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "batches_admin_all" ON public.product_batches;
CREATE POLICY "batches_admin_all" ON public.product_batches
  FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'store_manager'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'store_manager'::app_role));

CREATE TRIGGER pb_updated BEFORE UPDATE ON public.product_batches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 2) user_preferences snapshot
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  top_categories jsonb NOT NULL DEFAULT '[]'::jsonb,
  frequent_products jsonb NOT NULL DEFAULT '[]'::jsonb,
  price_sensitivity text NOT NULL DEFAULT 'medium',
  avg_order_value numeric(12,2),
  last_refreshed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "prefs_self_read" ON public.user_preferences;
CREATE POLICY "prefs_self_read" ON public.user_preferences
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR is_staff(auth.uid()));

DROP POLICY IF EXISTS "prefs_self_upsert" ON public.user_preferences;
CREATE POLICY "prefs_self_upsert" ON public.user_preferences
  FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TRIGGER up_updated BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 3) flash_deals (richer alternative for targeting segments)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.flash_deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id text NOT NULL,
  product_name text,
  category text,
  original_price numeric(12,2) NOT NULL,
  discount_pct numeric(5,2) NOT NULL,
  start_time timestamptz NOT NULL DEFAULT now(),
  end_time timestamptz NOT NULL,
  target_segment text,                -- 'all' | 'tier:silver' | 'category:produce' | 'level:gold'
  reason text,                        -- 'expiring_soon' | 'slow_moving' | 'manual'
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS fd_active_idx ON public.flash_deals(is_active, end_time);

ALTER TABLE public.flash_deals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "fd_public_read" ON public.flash_deals;
CREATE POLICY "fd_public_read" ON public.flash_deals
  FOR SELECT USING (is_active = true AND end_time > now());

DROP POLICY IF EXISTS "fd_admin_write" ON public.flash_deals;
CREATE POLICY "fd_admin_write" ON public.flash_deals
  FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'store_manager'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'store_manager'::app_role));

-- =====================================================
-- 4) refresh_user_preferences
-- =====================================================
CREATE OR REPLACE FUNCTION public.refresh_user_preferences(_user_id uuid DEFAULT auth.uid())
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _top jsonb; _freq jsonb; _aov numeric; _sens text;
BEGIN
  IF _user_id IS NULL THEN RAISE EXCEPTION 'unauthorized'; END IF;
  IF _user_id <> auth.uid() AND NOT is_staff(auth.uid()) THEN RAISE EXCEPTION 'forbidden'; END IF;

  SELECT COALESCE(jsonb_agg(category ORDER BY score DESC),'[]'::jsonb) INTO _top
  FROM (SELECT category, score FROM public.category_affinity(_user_id) LIMIT 6) t;

  SELECT COALESCE(jsonb_agg(product_id ORDER BY cnt DESC),'[]'::jsonb) INTO _freq
  FROM (
    SELECT oi.product_id, COUNT(*) AS cnt
    FROM public.order_items oi
    JOIN public.orders o ON o.id = oi.order_id
    WHERE o.user_id = _user_id AND o.status IN ('paid','completed','delivered','confirmed')
    GROUP BY oi.product_id
    ORDER BY cnt DESC LIMIT 12
  ) t;

  SELECT COALESCE(AVG(total),0) INTO _aov FROM public.orders
    WHERE user_id = _user_id AND status IN ('paid','completed','delivered','confirmed');

  _sens := CASE WHEN _aov < 200 THEN 'high' WHEN _aov < 600 THEN 'medium' ELSE 'low' END;

  INSERT INTO public.user_preferences(user_id, top_categories, frequent_products, price_sensitivity, avg_order_value, last_refreshed_at)
  VALUES (_user_id, _top, _freq, _sens, _aov, now())
  ON CONFLICT (user_id) DO UPDATE
    SET top_categories = EXCLUDED.top_categories,
        frequent_products = EXCLUDED.frequent_products,
        price_sensitivity = EXCLUDED.price_sensitivity,
        avg_order_value = EXCLUDED.avg_order_value,
        last_refreshed_at = now();

  RETURN jsonb_build_object('top', _top, 'frequent', _freq, 'aov', _aov, 'sensitivity', _sens);
END $$;

-- =====================================================
-- 5) home_layout — Server-driven dynamic homepage sections
-- =====================================================
CREATE OR REPLACE FUNCTION public.home_layout(_user_id uuid DEFAULT auth.uid())
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE _prefs record; _sections jsonb := '[]'::jsonb; _top text[];
BEGIN
  -- Default order for guests
  IF _user_id IS NULL THEN
    RETURN jsonb_build_array(
      jsonb_build_object('id','flash','title','عروض الفلاش','priority',100),
      jsonb_build_object('id','recommended','title','مختارات لك','priority',90),
      jsonb_build_object('id','trending','title','الأكثر رواجاً','priority',80),
      jsonb_build_object('id','baskets','title','سلال جاهزة','priority',70),
      jsonb_build_object('id','new','title','جديد','priority',60)
    );
  END IF;

  SELECT * INTO _prefs FROM public.user_preferences WHERE user_id = _user_id;

  IF _prefs IS NULL THEN
    PERFORM public.refresh_user_preferences(_user_id);
    SELECT * INTO _prefs FROM public.user_preferences WHERE user_id = _user_id;
  END IF;

  SELECT ARRAY(SELECT jsonb_array_elements_text(_prefs.top_categories) LIMIT 3) INTO _top;

  -- Build section list. Higher priority = renders first.
  _sections := jsonb_build_array(
    jsonb_build_object('id','flash','title','عروض الفلاش','priority', 100),
    jsonb_build_object('id','buy_again','title','اشترِ مجدداً','priority',
      CASE WHEN jsonb_array_length(_prefs.frequent_products) > 2 THEN 95 ELSE 50 END),
    jsonb_build_object('id','recommended','title','مختارات لك','priority', 90),
    jsonb_build_object('id','top_category_1','title', COALESCE(_top[1],'مختارات'),'category', _top[1], 'priority',
      CASE WHEN _top[1] IS NOT NULL THEN 85 ELSE 0 END),
    jsonb_build_object('id','top_category_2','title', COALESCE(_top[2],'مختارات'),'category', _top[2], 'priority',
      CASE WHEN _top[2] IS NOT NULL THEN 80 ELSE 0 END),
    jsonb_build_object('id','offers','title','عروض ذكية','priority',
      CASE WHEN _prefs.price_sensitivity = 'high' THEN 88 ELSE 65 END),
    jsonb_build_object('id','trending','title','الأكثر رواجاً','priority', 60),
    jsonb_build_object('id','new','title','جديد','priority', 55),
    jsonb_build_object('id','baskets','title','سلال جاهزة','priority',
      CASE WHEN _prefs.price_sensitivity = 'high' THEN 75 ELSE 45 END)
  );

  RETURN _sections;
END $$;

-- =====================================================
-- 6) frequently_bought_together — co-purchase suggestions
-- =====================================================
CREATE OR REPLACE FUNCTION public.frequently_bought_together(_product_ids text[], _limit int DEFAULT 6)
RETURNS TABLE(product_id text, product_name text, category text, score numeric)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH peers AS (
    SELECT oi2.product_id, COUNT(DISTINCT oi1.order_id)::numeric AS co_count
    FROM public.order_items oi1
    JOIN public.order_items oi2 ON oi2.order_id = oi1.order_id
    WHERE oi1.product_id = ANY(_product_ids)
      AND oi2.product_id <> ALL(_product_ids)
    GROUP BY oi2.product_id
  )
  SELECT p.id, p.name, p.category, peers.co_count
  FROM peers
  JOIN public.products p ON p.id = peers.product_id
  WHERE p.is_active = true AND p.stock > 0
  ORDER BY peers.co_count DESC, p.rating DESC NULLS LAST
  LIMIT _limit
$$;

-- =====================================================
-- 7) rotate_flash_sale_v2 — expiry-aware + notify
-- =====================================================
CREATE OR REPLACE FUNCTION public.rotate_flash_sale_v2()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _new_id uuid; _picked int := 0; _r record;
BEGIN
  -- Close any active sales
  UPDATE public.flash_sales SET is_active = false WHERE is_active = true;
  -- Expire stale flash_deals
  UPDATE public.flash_deals SET is_active = false WHERE end_time <= now();

  INSERT INTO public.flash_sales(starts_at, ends_at, cycle_label, is_active)
  VALUES (now(), now() + interval '2 hours',
          to_char(now() AT TIME ZONE 'Africa/Cairo','HH24:MI'), true)
  RETURNING id INTO _new_id;

  -- Pick candidates: expiring within 14 days first, then slow movers
  FOR _r IN
    WITH expiring AS (
      SELECT pb.product_id,
             MIN(pb.expires_at) AS soonest,
             SUM(pb.quantity)::int AS qty
      FROM public.product_batches pb
      WHERE pb.expires_at IS NOT NULL
        AND pb.expires_at > now()
        AND pb.expires_at < now() + interval '14 days'
        AND pb.quantity > 0
      GROUP BY pb.product_id
    ),
    slow AS (
      SELECT p.id AS product_id
      FROM public.products p
      LEFT JOIN public.order_items oi
        ON oi.product_id = p.id
        AND oi.created_at > now() - interval '30 days'
      WHERE p.is_active = true AND p.stock > 30
      GROUP BY p.id, p.stock
      HAVING COUNT(oi.id) < 5
    )
    SELECT p.id, p.name, p.category, p.price, p.stock,
           CASE
             WHEN e.product_id IS NOT NULL THEN 'expiring_soon'
             ELSE 'slow_moving'
           END AS reason,
           CASE
             WHEN e.soonest IS NOT NULL AND e.soonest < now() + interval '7 days' THEN 40
             WHEN e.product_id IS NOT NULL THEN 30
             WHEN p.stock > 100 THEN 25
             ELSE 18
           END AS pct
    FROM public.products p
    LEFT JOIN expiring e ON e.product_id = p.id
    LEFT JOIN slow s ON s.product_id = p.id
    WHERE p.is_active = true AND (e.product_id IS NOT NULL OR s.product_id IS NOT NULL)
    ORDER BY (e.product_id IS NOT NULL) DESC, p.stock DESC
    LIMIT 8
  LOOP
    INSERT INTO public.flash_sale_products(flash_sale_id, product_id, product_name, original_price, discount_pct, reason, category, rank)
    VALUES (_new_id, _r.id, _r.name, _r.price, _r.pct,
            CASE WHEN _r.reason='expiring_soon' THEN 'قارب على الانتهاء' ELSE 'تصريف مخزون' END,
            _r.category, _picked + 1);

    INSERT INTO public.flash_deals(product_id, product_name, category, original_price, discount_pct, start_time, end_time, target_segment, reason)
    VALUES (_r.id, _r.name, _r.category, _r.price, _r.pct, now(), now() + interval '2 hours',
            CASE WHEN _r.category IS NOT NULL THEN 'category:'||_r.category ELSE 'all' END, _r.reason);

    -- Notify users with affinity to this category (top 200 to avoid runaway fan-out)
    INSERT INTO public.notifications(user_id, title, body, icon)
    SELECT DISTINCT ubl.user_id,
           '⚡ عرض فلاش لمنتج تحبه',
           _r.name || ' — خصم ' || _r.pct || '٪ لمدة ساعتين فقط',
           'flame'
    FROM public.user_behavior_logs ubl
    WHERE ubl.user_id IS NOT NULL
      AND ubl.category = _r.category
      AND ubl.created_at > now() - interval '30 days'
    LIMIT 200;

    _picked := _picked + 1;
  END LOOP;

  RETURN jsonb_build_object('flash_sale_id', _new_id, 'picked', _picked, 'rotated_at', now());
END $$;

-- =====================================================
-- 8) current_mega_event — Theme override resolver
-- =====================================================
CREATE OR REPLACE FUNCTION public.current_mega_event()
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE _row record; _today_dow int; _today_date date;
BEGIN
  -- Africa/Cairo day-of-week (0=Sunday .. 6=Saturday). Tuesday=2, Friday=5.
  _today_dow  := EXTRACT(DOW FROM (now() AT TIME ZONE 'Africa/Cairo'))::int;
  _today_date := (now() AT TIME ZONE 'Africa/Cairo')::date;

  -- Priority: explicit date match > weekday auto-trigger > manual active
  SELECT * INTO _row FROM public.mega_events
  WHERE is_active = true
    AND (
      (trigger_kind = 'date_specific' AND active_date = _today_date)
      OR (trigger_kind = 'tuesday'      AND _today_dow = 2)
      OR (trigger_kind = 'friday'       AND _today_dow = 5)
      OR (trigger_kind = 'first_friday' AND _today_dow = 5
          AND EXTRACT(DAY FROM (now() AT TIME ZONE 'Africa/Cairo'))::int <= 7)
      OR (trigger_kind = 'manual')
    )
  ORDER BY
    CASE trigger_kind
      WHEN 'date_specific' THEN 1
      WHEN 'first_friday' THEN 2
      WHEN 'friday' THEN 3
      WHEN 'tuesday' THEN 3
      ELSE 9 END,
    created_at DESC
  LIMIT 1;

  IF _row IS NULL THEN RETURN NULL; END IF;
  RETURN to_jsonb(_row);
END $$;