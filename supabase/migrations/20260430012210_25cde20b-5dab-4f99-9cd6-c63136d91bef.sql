
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS cost_price numeric,
  ADD COLUMN IF NOT EXISTS affiliate_commission_pct numeric NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.discount_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id text NOT NULL,
  product_name text NOT NULL,
  override_by uuid NOT NULL,
  override_by_name text,
  cost_price numeric,
  sale_price numeric NOT NULL,
  attempted_discount numeric NOT NULL,
  margin_amount numeric NOT NULL,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.discount_overrides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_manager_view_overrides" ON public.discount_overrides;
CREATE POLICY "admin_manager_view_overrides" ON public.discount_overrides
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'store_manager'::app_role));

DROP POLICY IF EXISTS "admin_manager_insert_overrides" ON public.discount_overrides;
CREATE POLICY "admin_manager_insert_overrides" ON public.discount_overrides
  FOR INSERT TO authenticated
  WITH CHECK ((has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'store_manager'::app_role)) AND override_by = auth.uid());

CREATE TABLE IF NOT EXISTS public.wallet_topup_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  method text NOT NULL CHECK (method IN ('vodafone_cash','instapay','bank_transfer','cash')),
  transfer_reference text NOT NULL,
  note text,
  performed_by uuid NOT NULL,
  performed_by_name text,
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('completed','reversed')),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.wallet_topup_requests ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_topup_user ON public.wallet_topup_requests(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_topup_ref ON public.wallet_topup_requests(transfer_reference);

DROP POLICY IF EXISTS "topup_user_view_own" ON public.wallet_topup_requests;
CREATE POLICY "topup_user_view_own" ON public.wallet_topup_requests
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "topup_admin_manager_view_all" ON public.wallet_topup_requests;
CREATE POLICY "topup_admin_manager_view_all" ON public.wallet_topup_requests
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'store_manager'::app_role));

CREATE OR REPLACE FUNCTION public.validate_discount(
  _sale_price numeric, _cost_price numeric, _new_price numeric
) RETURNS jsonb
LANGUAGE plpgsql STABLE SET search_path TO 'public'
AS $$
DECLARE _margin numeric; _discount numeric; _max_allowed numeric;
BEGIN
  IF _sale_price IS NULL OR _new_price IS NULL THEN
    RETURN jsonb_build_object('ok', true, 'reason', 'no_price');
  END IF;
  IF _new_price > _sale_price THEN
    RETURN jsonb_build_object('ok', true, 'reason', 'price_increase');
  END IF;
  IF _cost_price IS NULL OR _cost_price <= 0 THEN
    RETURN jsonb_build_object('ok', true, 'reason', 'no_cost',
      'warning', 'سعر التكلفة غير محدد - لا يمكن حماية الهامش');
  END IF;
  _margin := _sale_price - _cost_price;
  _discount := _sale_price - _new_price;
  _max_allowed := _margin * 0.5;
  IF _margin <= 0 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'no_margin',
      'message', 'لا يوجد هامش ربح في هذا المنتج (التكلفة ≥ سعر البيع)');
  END IF;
  IF _discount > _max_allowed THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'exceeds_50_percent',
      'message', 'عذراً، هذا الخصم يهدد استدامة الأرباح. الحد الأقصى المسموح: ' || round(_max_allowed,2) || ' ج.م (50% من هامش الربح ' || round(_margin,2) || ' ج.م)',
      'margin', _margin, 'max_discount', _max_allowed, 'attempted_discount', _discount);
  END IF;
  RETURN jsonb_build_object('ok', true, 'margin', _margin, 'discount', _discount, 'max_allowed', _max_allowed);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_topup_wallet(
  _user_id uuid, _amount numeric, _method text,
  _transfer_reference text, _note text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE _admin uuid := auth.uid(); _admin_name text; _new_balance numeric; _topup_id uuid;
BEGIN
  IF _admin IS NULL THEN RAISE EXCEPTION 'unauthorized'; END IF;
  IF NOT (has_role(_admin,'admin'::app_role) OR has_role(_admin,'store_manager'::app_role)) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  IF _amount IS NULL OR _amount <= 0 THEN RAISE EXCEPTION 'invalid_amount'; END IF;
  IF _amount > 100000 THEN RAISE EXCEPTION 'amount_too_large'; END IF;
  IF _method NOT IN ('vodafone_cash','instapay','bank_transfer','cash') THEN
    RAISE EXCEPTION 'invalid_method';
  END IF;
  IF _transfer_reference IS NULL OR length(trim(_transfer_reference)) < 4 THEN
    RAISE EXCEPTION 'transfer_reference_required';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = _user_id) THEN
    RAISE EXCEPTION 'user_not_found';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.wallet_topup_requests
    WHERE method = _method AND transfer_reference = trim(_transfer_reference) AND status = 'completed'
  ) THEN RAISE EXCEPTION 'duplicate_transfer_reference'; END IF;

  SELECT full_name INTO _admin_name FROM public.profiles WHERE id = _admin;

  INSERT INTO public.wallet_balances (user_id, balance) VALUES (_user_id, 0)
    ON CONFLICT (user_id) DO NOTHING;

  UPDATE public.wallet_balances
    SET balance = balance + _amount, updated_at = now()
    WHERE user_id = _user_id RETURNING balance INTO _new_balance;

  INSERT INTO public.wallet_topup_requests
    (user_id, amount, method, transfer_reference, note, performed_by, performed_by_name)
  VALUES (_user_id, _amount, _method, trim(_transfer_reference), _note, _admin, _admin_name)
  RETURNING id INTO _topup_id;

  INSERT INTO public.wallet_transactions (user_id, amount, kind, label, source)
  VALUES (_user_id, _amount, 'credit',
          'شحن يدوي - ' || _method || ' (#' || trim(_transfer_reference) || ')',
          'admin_topup');

  RETURN jsonb_build_object('ok', true, 'topup_id', _topup_id, 'new_balance', _new_balance);
END;
$$;
