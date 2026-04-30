
-- =========================================================
-- 1. DRIVERS
-- =========================================================
CREATE TABLE IF NOT EXISTS public.drivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE,
  full_name text NOT NULL,
  phone text NOT NULL,
  national_id text,
  driver_type text NOT NULL DEFAULT 'salary_comm'
    CHECK (driver_type IN ('salary_comm','commission_only','third_party')),
  third_party_company text,
  current_zone text,
  base_salary numeric NOT NULL DEFAULT 0,
  commission_pct numeric,           -- override per driver (else use rule)
  commission_flat numeric,          -- override per driver
  vehicle_type text,
  vehicle_plate text,
  branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  current_lat numeric,
  current_lng numeric,
  last_seen_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;

CREATE POLICY drivers_admin_manage ON public.drivers FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'finance'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'finance'::app_role));

CREATE POLICY drivers_self_view ON public.drivers FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY drivers_self_update_location ON public.drivers FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY drivers_staff_view ON public.drivers FOR SELECT TO authenticated
  USING (is_staff(auth.uid()));

CREATE TRIGGER drivers_set_updated_at BEFORE UPDATE ON public.drivers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================
-- 2. COMMISSION RULES (tiers per driver_type)
-- =========================================================
CREATE TABLE IF NOT EXISTS public.driver_commission_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_type text NOT NULL UNIQUE
    CHECK (driver_type IN ('salary_comm','commission_only','third_party')),
  commission_pct numeric NOT NULL DEFAULT 0,
  commission_flat numeric NOT NULL DEFAULT 0,
  min_per_order numeric NOT NULL DEFAULT 0,
  max_per_order numeric,
  notes text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.driver_commission_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY rules_public_read ON public.driver_commission_rules FOR SELECT TO authenticated USING (true);
CREATE POLICY rules_admin_manage ON public.driver_commission_rules FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));

INSERT INTO public.driver_commission_rules (driver_type, commission_pct, commission_flat, min_per_order, notes) VALUES
  ('salary_comm', 3, 0, 5, 'راتب أساسي + عمولة 3%'),
  ('commission_only', 8, 0, 10, 'عمولة 8% فقط بدون راتب'),
  ('third_party', 12, 0, 0, 'نسبة الشركة الخارجية')
ON CONFLICT (driver_type) DO NOTHING;

-- =========================================================
-- 3. DRIVER WALLET (custody + earnings)
-- =========================================================
CREATE TABLE IF NOT EXISTS public.driver_wallets (
  driver_id uuid PRIMARY KEY REFERENCES public.drivers(id) ON DELETE CASCADE,
  cash_in_hand numeric NOT NULL DEFAULT 0,    -- COD held physically
  earned_balance numeric NOT NULL DEFAULT 0,  -- commissions owed by company
  lifetime_earned numeric NOT NULL DEFAULT 0,
  lifetime_settled numeric NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.driver_wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY dw_admin_manage ON public.driver_wallets FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'finance'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'finance'::app_role));

CREATE POLICY dw_self_view ON public.driver_wallets FOR SELECT TO authenticated
  USING (driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid()));

CREATE OR REPLACE FUNCTION public.handle_new_driver()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  INSERT INTO public.driver_wallets(driver_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  RETURN NEW;
END $$;

CREATE TRIGGER drivers_create_wallet AFTER INSERT ON public.drivers
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_driver();

-- =========================================================
-- 4. CASH SETTLEMENTS
-- =========================================================
CREATE TABLE IF NOT EXISTS public.driver_cash_settlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount > 0),
  kind text NOT NULL DEFAULT 'cash_handover'
    CHECK (kind IN ('cash_handover','commission_payout')),
  received_by uuid NOT NULL,
  received_by_name text,
  bank_reference text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.driver_cash_settlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY dcs_admin_manage ON public.driver_cash_settlements FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'finance'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'finance'::app_role));

CREATE POLICY dcs_self_view ON public.driver_cash_settlements FOR SELECT TO authenticated
  USING (driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid()));

-- =========================================================
-- 5. DELIVERY SETTINGS (barcode toggle)
-- =========================================================
CREATE TABLE IF NOT EXISTS public.delivery_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  require_barcode_default boolean NOT NULL DEFAULT true,
  disable_barcode_for_express boolean NOT NULL DEFAULT true,
  disable_barcode_zones text[] NOT NULL DEFAULT ARRAY[]::text[],
  gps_proof_required_when_disabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.delivery_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY ds_read ON public.delivery_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY ds_admin_manage ON public.delivery_settings FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));

INSERT INTO public.delivery_settings (require_barcode_default) VALUES (true)
  ON CONFLICT DO NOTHING;

-- =========================================================
-- 6. DELIVERY EVENTS (timeline + tracking)
-- =========================================================
CREATE TABLE IF NOT EXISTS public.delivery_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.delivery_tasks(id) ON DELETE CASCADE,
  driver_id uuid REFERENCES public.drivers(id) ON DELETE SET NULL,
  event_type text NOT NULL
    CHECK (event_type IN ('assigned','out_for_delivery','arrived','delivered','failed','location_ping')),
  lat numeric, lng numeric,
  proof_type text CHECK (proof_type IN ('barcode','gps','photo','none')),
  proof_data text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_delivery_events_task ON public.delivery_events(task_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_delivery_events_driver ON public.delivery_events(driver_id, created_at DESC);

ALTER TABLE public.delivery_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY de_staff_all ON public.delivery_events FOR ALL TO authenticated
  USING (is_staff(auth.uid())) WITH CHECK (is_staff(auth.uid()));

CREATE POLICY de_driver_insert ON public.delivery_events FOR INSERT TO authenticated
  WITH CHECK (driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid()));

CREATE POLICY de_driver_view ON public.delivery_events FOR SELECT TO authenticated
  USING (driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid()));

CREATE POLICY de_customer_view ON public.delivery_events FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.delivery_tasks dt
    JOIN public.orders o ON o.id = dt.order_id
    WHERE dt.id = delivery_events.task_id AND o.user_id = auth.uid()
  ));

-- =========================================================
-- 7. EXTEND delivery_tasks + orders
-- =========================================================
ALTER TABLE public.delivery_tasks
  ADD COLUMN IF NOT EXISTS service_type text NOT NULL DEFAULT 'standard'
    CHECK (service_type IN ('standard','express','scheduled')),
  ADD COLUMN IF NOT EXISTS delivery_zone text,
  ADD COLUMN IF NOT EXISTS customer_barcode text,
  ADD COLUMN IF NOT EXISTS proof_type text,
  ADD COLUMN IF NOT EXISTS proof_lat numeric,
  ADD COLUMN IF NOT EXISTS proof_lng numeric,
  ADD COLUMN IF NOT EXISTS cod_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cod_collected boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS commission_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS commission_paid boolean NOT NULL DEFAULT false;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS service_type text NOT NULL DEFAULT 'standard'
    CHECK (service_type IN ('standard','express','scheduled')),
  ADD COLUMN IF NOT EXISTS delivery_zone text;

-- =========================================================
-- 8. FUNCTIONS
-- =========================================================

-- compute commission for a delivered order
CREATE OR REPLACE FUNCTION public.compute_driver_commission(_driver_id uuid, _order_total numeric)
RETURNS numeric LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE _d record; _rule record; _pct numeric; _flat numeric; _amt numeric;
BEGIN
  SELECT * INTO _d FROM public.drivers WHERE id = _driver_id;
  IF NOT FOUND THEN RETURN 0; END IF;
  SELECT * INTO _rule FROM public.driver_commission_rules WHERE driver_type = _d.driver_type;

  _pct  := COALESCE(_d.commission_pct,  _rule.commission_pct,  0);
  _flat := COALESCE(_d.commission_flat, _rule.commission_flat, 0);

  _amt := (_order_total * _pct / 100.0) + _flat;
  IF _rule.min_per_order IS NOT NULL THEN _amt := GREATEST(_amt, _rule.min_per_order); END IF;
  IF _rule.max_per_order IS NOT NULL THEN _amt := LEAST(_amt, _rule.max_per_order); END IF;
  RETURN ROUND(_amt, 2);
END $$;

-- complete delivery: validates proof, updates wallet, fires commission
CREATE OR REPLACE FUNCTION public.complete_delivery(
  _task_id uuid,
  _scanned_barcode text DEFAULT NULL,
  _lat numeric DEFAULT NULL,
  _lng numeric DEFAULT NULL,
  _cod_collected boolean DEFAULT false
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  _task record; _order record; _driver record; _settings record;
  _require_barcode boolean; _proof text; _commission numeric;
BEGIN
  SELECT * INTO _task FROM public.delivery_tasks WHERE id = _task_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'task_not_found'; END IF;

  SELECT * INTO _driver FROM public.drivers WHERE id = (
    SELECT id FROM public.drivers WHERE user_id = auth.uid() LIMIT 1
  );
  IF _driver.id IS NULL OR _driver.id <> _task.driver_id THEN
    IF NOT is_staff(auth.uid()) THEN RAISE EXCEPTION 'forbidden_not_assigned'; END IF;
  END IF;

  SELECT * INTO _order FROM public.orders WHERE id = _task.order_id;
  SELECT * INTO _settings FROM public.delivery_settings ORDER BY updated_at DESC LIMIT 1;

  -- decide if barcode required
  _require_barcode := COALESCE(_settings.require_barcode_default, true);
  IF COALESCE(_settings.disable_barcode_for_express,false) AND _task.service_type = 'express' THEN
    _require_barcode := false;
  END IF;
  IF _task.delivery_zone IS NOT NULL AND _task.delivery_zone = ANY(COALESCE(_settings.disable_barcode_zones, ARRAY[]::text[])) THEN
    _require_barcode := false;
  END IF;

  IF _require_barcode THEN
    IF _scanned_barcode IS NULL OR _task.customer_barcode IS NULL OR _scanned_barcode <> _task.customer_barcode THEN
      RAISE EXCEPTION 'barcode_mismatch';
    END IF;
    _proof := 'barcode';
  ELSE
    IF COALESCE(_settings.gps_proof_required_when_disabled,true) AND (_lat IS NULL OR _lng IS NULL) THEN
      RAISE EXCEPTION 'gps_proof_required';
    END IF;
    _proof := 'gps';
  END IF;

  -- compute commission
  _commission := public.compute_driver_commission(_task.driver_id, COALESCE(_order.total, 0));

  -- update task
  UPDATE public.delivery_tasks
    SET status='delivered', delivered_at=now(), updated_at=now(),
        proof_type=_proof, proof_lat=_lat, proof_lng=_lng,
        driver_lat=_lat, driver_lng=_lng,
        cod_collected=_cod_collected,
        commission_amount=_commission
    WHERE id=_task_id;

  -- update order
  UPDATE public.orders SET status='delivered', updated_at=now() WHERE id=_task.order_id;

  -- log event
  INSERT INTO public.delivery_events(task_id, driver_id, event_type, lat, lng, proof_type, proof_data)
    VALUES (_task_id, _task.driver_id, 'delivered', _lat, _lng, _proof,
            CASE WHEN _proof='barcode' THEN _scanned_barcode ELSE NULL END);

  -- update driver wallet
  INSERT INTO public.driver_wallets(driver_id) VALUES (_task.driver_id) ON CONFLICT DO NOTHING;
  UPDATE public.driver_wallets
    SET cash_in_hand = cash_in_hand + CASE WHEN _cod_collected THEN COALESCE(_task.cod_amount, _order.total, 0) ELSE 0 END,
        earned_balance = earned_balance + _commission,
        lifetime_earned = lifetime_earned + _commission,
        updated_at = now()
    WHERE driver_id = _task.driver_id;

  -- notify customer
  INSERT INTO public.notifications(user_id, title, body, icon)
    VALUES (_order.user_id, 'تم تسليم طلبك ✅',
            'تم تسليم طلبك بنجاح. شكراً لاختيارك ريف المدينة.', 'truck');

  RETURN jsonb_build_object('ok',true,'commission',_commission,'proof_type',_proof);
END $$;

-- driver pings location & event
CREATE OR REPLACE FUNCTION public.driver_log_event(
  _task_id uuid, _event text, _lat numeric DEFAULT NULL, _lng numeric DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _driver_id uuid; _task record; _order_user uuid;
BEGIN
  SELECT id INTO _driver_id FROM public.drivers WHERE user_id = auth.uid() LIMIT 1;
  IF _driver_id IS NULL THEN RAISE EXCEPTION 'not_a_driver'; END IF;

  SELECT * INTO _task FROM public.delivery_tasks WHERE id=_task_id;
  IF _task.driver_id <> _driver_id THEN RAISE EXCEPTION 'forbidden_not_assigned'; END IF;

  -- update driver location
  UPDATE public.drivers SET current_lat=_lat, current_lng=_lng, last_seen_at=now() WHERE id=_driver_id;

  -- log event
  INSERT INTO public.delivery_events(task_id, driver_id, event_type, lat, lng)
    VALUES (_task_id, _driver_id, _event, _lat, _lng);

  -- task status transitions + customer notification
  IF _event = 'out_for_delivery' THEN
    UPDATE public.delivery_tasks SET status='out_for_delivery', started_at=COALESCE(started_at,now()),
      driver_lat=_lat, driver_lng=_lng, updated_at=now() WHERE id=_task_id;
    SELECT user_id INTO _order_user FROM public.orders WHERE id=_task.order_id;
    INSERT INTO public.notifications(user_id, title, body, icon)
      VALUES (_order_user, 'مندوبك في الطريق 🚗', 'خرج المندوب لتوصيل طلبك الآن.', 'truck');
  ELSIF _event = 'arrived' THEN
    UPDATE public.delivery_tasks SET status='arrived', driver_lat=_lat, driver_lng=_lng, updated_at=now() WHERE id=_task_id;
    SELECT user_id INTO _order_user FROM public.orders WHERE id=_task.order_id;
    INSERT INTO public.notifications(user_id, title, body, icon)
      VALUES (_order_user, 'وصل المندوب 📍', 'وصل المندوب إلى موقعك.', 'map-pin');
  ELSIF _event = 'location_ping' THEN
    UPDATE public.delivery_tasks SET driver_lat=_lat, driver_lng=_lng, updated_at=now() WHERE id=_task_id;
  END IF;

  RETURN jsonb_build_object('ok',true);
END $$;

-- accountant settles cash from driver
CREATE OR REPLACE FUNCTION public.driver_settle_cash(
  _driver_id uuid, _amount numeric, _kind text DEFAULT 'cash_handover',
  _bank_reference text DEFAULT NULL, _notes text DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _admin uuid := auth.uid(); _admin_name text; _w record; _id uuid;
BEGIN
  IF NOT (has_role(_admin,'admin'::app_role) OR has_role(_admin,'finance'::app_role)) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  IF _amount IS NULL OR _amount <= 0 THEN RAISE EXCEPTION 'invalid_amount'; END IF;

  SELECT * INTO _w FROM public.driver_wallets WHERE driver_id=_driver_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'wallet_not_found'; END IF;

  IF _kind = 'cash_handover' THEN
    IF _w.cash_in_hand < _amount THEN RAISE EXCEPTION 'insufficient_cash_in_hand'; END IF;
    UPDATE public.driver_wallets
      SET cash_in_hand = cash_in_hand - _amount,
          lifetime_settled = lifetime_settled + _amount,
          updated_at = now()
      WHERE driver_id=_driver_id;
  ELSIF _kind = 'commission_payout' THEN
    IF _w.earned_balance < _amount THEN RAISE EXCEPTION 'insufficient_earned_balance'; END IF;
    UPDATE public.driver_wallets
      SET earned_balance = earned_balance - _amount, updated_at = now()
      WHERE driver_id=_driver_id;
  ELSE
    RAISE EXCEPTION 'invalid_kind';
  END IF;

  SELECT full_name INTO _admin_name FROM public.profiles WHERE id=_admin;

  INSERT INTO public.driver_cash_settlements(driver_id, amount, kind, received_by, received_by_name, bank_reference, notes)
    VALUES (_driver_id, _amount, _kind, _admin, _admin_name, _bank_reference, _notes)
    RETURNING id INTO _id;

  RETURN jsonb_build_object('ok',true,'settlement_id',_id);
END $$;

-- driver portal stats (used by mobile view)
CREATE OR REPLACE FUNCTION public.driver_portal_stats()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE _d record; _today int; _delivered int; _w record;
BEGIN
  SELECT * INTO _d FROM public.drivers WHERE user_id=auth.uid() LIMIT 1;
  IF _d.id IS NULL THEN RAISE EXCEPTION 'not_a_driver'; END IF;

  SELECT COUNT(*) INTO _today FROM public.delivery_tasks
    WHERE driver_id=_d.id AND created_at::date = CURRENT_DATE;
  SELECT COUNT(*) INTO _delivered FROM public.delivery_tasks
    WHERE driver_id=_d.id AND status='delivered' AND delivered_at::date = CURRENT_DATE;
  SELECT * INTO _w FROM public.driver_wallets WHERE driver_id=_d.id;

  RETURN jsonb_build_object(
    'driver', row_to_json(_d),
    'today_tasks', _today,
    'today_delivered', _delivered,
    'wallet', row_to_json(_w)
  );
END $$;

-- realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery_tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.drivers;
