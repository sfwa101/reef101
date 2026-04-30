-- 1) Affiliate settings (default commission per category)
CREATE TABLE IF NOT EXISTS public.affiliate_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL UNIQUE,
  default_commission_pct numeric NOT NULL DEFAULT 0 CHECK (default_commission_pct >= 0 AND default_commission_pct <= 50),
  notes text,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.affiliate_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone_read_affiliate_settings" ON public.affiliate_settings
FOR SELECT TO public USING (true);

CREATE POLICY "admin_manage_affiliate_settings" ON public.affiliate_settings
FOR ALL TO authenticated
USING (has_role(auth.uid(),'admin'::app_role))
WITH CHECK (has_role(auth.uid(),'admin'::app_role));

CREATE TRIGGER trg_affiliate_settings_updated
BEFORE UPDATE ON public.affiliate_settings
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2) Commission ledger
CREATE TABLE IF NOT EXISTS public.commission_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid,
  affiliate_user_id uuid NOT NULL,
  customer_user_id uuid,
  product_id text,
  product_name text,
  category text,
  commission_pct numeric NOT NULL DEFAULT 0,
  base_amount numeric NOT NULL DEFAULT 0,
  commission_amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending', -- pending | paid | reversed
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz
);
ALTER TABLE public.commission_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ledger_view_own" ON public.commission_ledger
FOR SELECT TO authenticated USING (auth.uid() = affiliate_user_id);

CREATE POLICY "ledger_admin_manage" ON public.commission_ledger
FOR ALL TO authenticated
USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'finance'::app_role))
WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'finance'::app_role));

CREATE INDEX IF NOT EXISTS idx_ledger_affiliate ON public.commission_ledger(affiliate_user_id);
CREATE INDEX IF NOT EXISTS idx_ledger_status ON public.commission_ledger(status);

-- 3) Executive dashboard function (admin/manager only)
CREATE OR REPLACE FUNCTION public.executive_dashboard_stats(_days int DEFAULT 30)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _orders_count int;
  _gross numeric;
  _items_revenue numeric;
  _items_cost numeric;
  _net_profit numeric;
  _top_categories jsonb;
  _low_stock_count int;
BEGIN
  IF NOT (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'store_manager'::app_role) OR has_role(auth.uid(),'finance'::app_role)) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT COUNT(*), COALESCE(SUM(total),0)
    INTO _orders_count, _gross
  FROM public.orders
  WHERE created_at >= now() - (_days || ' days')::interval
    AND status IN ('paid','completed','delivered','confirmed');

  SELECT
    COALESCE(SUM(oi.price * oi.quantity),0),
    COALESCE(SUM(COALESCE(p.cost_price, p.price * 0.7) * oi.quantity),0)
  INTO _items_revenue, _items_cost
  FROM public.order_items oi
  JOIN public.orders o ON o.id = oi.order_id
  LEFT JOIN public.products p ON p.id = oi.product_id
  WHERE o.created_at >= now() - (_days || ' days')::interval
    AND o.status IN ('paid','completed','delivered','confirmed');

  _net_profit := _items_revenue - _items_cost;

  SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO _top_categories
  FROM (
    SELECT COALESCE(p.category,'غير مصنف') AS category,
           SUM(oi.price * oi.quantity)::numeric AS revenue,
           SUM(oi.quantity)::int AS units
    FROM public.order_items oi
    JOIN public.orders o ON o.id = oi.order_id
    LEFT JOIN public.products p ON p.id = oi.product_id
    WHERE o.created_at >= now() - (_days || ' days')::interval
      AND o.status IN ('paid','completed','delivered','confirmed')
    GROUP BY 1
    ORDER BY revenue DESC
    LIMIT 5
  ) t;

  SELECT COUNT(*) INTO _low_stock_count
  FROM public.products
  WHERE is_active = true AND stock <= 5;

  RETURN jsonb_build_object(
    'period_days', _days,
    'orders_count', _orders_count,
    'gross_sales', _gross,
    'items_revenue', _items_revenue,
    'items_cost', _items_cost,
    'net_profit', _net_profit,
    'profit_margin_pct', CASE WHEN _items_revenue > 0 THEN round((_net_profit / _items_revenue) * 100, 2) ELSE 0 END,
    'top_categories', _top_categories,
    'low_stock_count', _low_stock_count
  );
END;
$$;

-- 4) Low stock list
CREATE OR REPLACE FUNCTION public.low_stock_products(_threshold int DEFAULT 5)
RETURNS TABLE(id text, name text, category text, stock int, price numeric, image_url text)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'store_manager'::app_role)) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  RETURN QUERY
    SELECT p.id, p.name, p.category, p.stock, p.price, COALESCE(p.image_url, p.image)
    FROM public.products p
    WHERE p.is_active = true AND p.stock <= _threshold
    ORDER BY p.stock ASC, p.name ASC
    LIMIT 200;
END;
$$;

-- 5) Seed default affiliate categories (idempotent)
INSERT INTO public.affiliate_settings (category, default_commission_pct) VALUES
  ('سوبرماركت', 3),
  ('ألبان', 4),
  ('لحوم', 5),
  ('خضار وفاكهة', 3),
  ('حلويات', 6),
  ('مكتبة', 4),
  ('قرية', 5),
  ('جملة', 2)
ON CONFLICT (category) DO NOTHING;