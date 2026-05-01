
-- ============= ENUMS =============
DO $$ BEGIN
  CREATE TYPE public.group_buy_status AS ENUM ('gathering','succeeded','failed','fulfilled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.group_buy_pledge_status AS ENUM ('locked','committed','refunded');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============= CAMPAIGNS =============
CREATE TABLE IF NOT EXISTS public.group_buy_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id TEXT REFERENCES public.products(id) ON DELETE SET NULL,
  vendor_id UUID,
  geo_zone_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  base_price NUMERIC(12,2) NOT NULL CHECK (base_price >= 0),
  target_quantity INT NOT NULL CHECK (target_quantity > 0),
  current_quantity INT NOT NULL DEFAULT 0,
  status public.group_buy_status NOT NULL DEFAULT 'gathering',
  expires_at TIMESTAMPTZ NOT NULL,
  settled_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gbc_status_zone ON public.group_buy_campaigns(status, geo_zone_id);
CREATE INDEX IF NOT EXISTS idx_gbc_expires ON public.group_buy_campaigns(expires_at) WHERE status = 'gathering';

-- ============= TIERS =============
CREATE TABLE IF NOT EXISTS public.group_buy_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.group_buy_campaigns(id) ON DELETE CASCADE,
  quantity_threshold INT NOT NULL CHECK (quantity_threshold > 0),
  price_per_unit NUMERIC(12,2) NOT NULL CHECK (price_per_unit >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, quantity_threshold)
);

CREATE INDEX IF NOT EXISTS idx_gbt_campaign ON public.group_buy_tiers(campaign_id, quantity_threshold);

-- ============= PLEDGES =============
CREATE TABLE IF NOT EXISTS public.group_buy_pledges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.group_buy_campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  pledged_quantity INT NOT NULL CHECK (pledged_quantity > 0),
  unit_price_locked NUMERIC(12,2) NOT NULL,
  escrow_amount NUMERIC(12,2) NOT NULL,
  escrow_wallet_tx_id UUID,
  status public.group_buy_pledge_status NOT NULL DEFAULT 'locked',
  settled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gbp_campaign ON public.group_buy_pledges(campaign_id);
CREATE INDEX IF NOT EXISTS idx_gbp_user ON public.group_buy_pledges(user_id, status);

-- ============= UPDATED_AT TRIGGERS =============
DROP TRIGGER IF EXISTS gbc_updated_at ON public.group_buy_campaigns;
CREATE TRIGGER gbc_updated_at BEFORE UPDATE ON public.group_buy_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS gbp_updated_at ON public.group_buy_pledges;
CREATE TRIGGER gbp_updated_at BEFORE UPDATE ON public.group_buy_pledges
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============= RLS =============
ALTER TABLE public.group_buy_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_buy_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_buy_pledges ENABLE ROW LEVEL SECURITY;

-- Campaigns: anyone authenticated can read; admins/finance manage
DROP POLICY IF EXISTS "campaigns_read_all" ON public.group_buy_campaigns;
CREATE POLICY "campaigns_read_all" ON public.group_buy_campaigns
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "campaigns_admin_write" ON public.group_buy_campaigns;
CREATE POLICY "campaigns_admin_write" ON public.group_buy_campaigns
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'::app_role) OR public.has_role(auth.uid(),'finance'::app_role))
  WITH CHECK (public.has_role(auth.uid(),'admin'::app_role) OR public.has_role(auth.uid(),'finance'::app_role));

-- Tiers: read all; admins write
DROP POLICY IF EXISTS "tiers_read_all" ON public.group_buy_tiers;
CREATE POLICY "tiers_read_all" ON public.group_buy_tiers
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "tiers_admin_write" ON public.group_buy_tiers;
CREATE POLICY "tiers_admin_write" ON public.group_buy_tiers
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'::app_role) OR public.has_role(auth.uid(),'finance'::app_role))
  WITH CHECK (public.has_role(auth.uid(),'admin'::app_role) OR public.has_role(auth.uid(),'finance'::app_role));

-- Pledges: user reads own; staff reads all; writes go through RPCs only (no direct insert)
DROP POLICY IF EXISTS "pledges_read_own_or_staff" ON public.group_buy_pledges;
CREATE POLICY "pledges_read_own_or_staff" ON public.group_buy_pledges
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_staff(auth.uid())
         OR public.has_role(auth.uid(),'finance'::app_role));

-- ============= HELPER: current effective unit price =============
CREATE OR REPLACE FUNCTION public.group_buy_current_price(_campaign_id uuid)
RETURNS NUMERIC
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE _qty int; _base numeric; _price numeric;
BEGIN
  SELECT current_quantity, base_price INTO _qty, _base
  FROM public.group_buy_campaigns WHERE id = _campaign_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'campaign_not_found'; END IF;

  SELECT price_per_unit INTO _price
  FROM public.group_buy_tiers
  WHERE campaign_id = _campaign_id AND quantity_threshold <= _qty
  ORDER BY quantity_threshold DESC
  LIMIT 1;

  RETURN COALESCE(_price, _base);
END $$;

-- ============= PLEDGE RPC (Escrow Funds) =============
CREATE OR REPLACE FUNCTION public.pledge_group_buy(_campaign_id uuid, _quantity int)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  _uid uuid := auth.uid();
  _camp record;
  _unit_price numeric;
  _escrow numeric;
  _bal numeric;
  _tx_id uuid;
  _pledge_id uuid;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'unauthorized'; END IF;
  IF _quantity IS NULL OR _quantity <= 0 THEN RAISE EXCEPTION 'invalid_quantity'; END IF;

  SELECT * INTO _camp FROM public.group_buy_campaigns
    WHERE id = _campaign_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'campaign_not_found'; END IF;
  IF _camp.status <> 'gathering' THEN RAISE EXCEPTION 'campaign_not_active'; END IF;
  IF _camp.expires_at <= now() THEN RAISE EXCEPTION 'campaign_expired'; END IF;

  _unit_price := public.group_buy_current_price(_campaign_id);
  _escrow := ROUND(_unit_price * _quantity, 2);

  -- Check wallet balance
  SELECT COALESCE(balance,0) INTO _bal FROM public.wallet_balances WHERE user_id = _uid;
  IF COALESCE(_bal,0) < _escrow THEN RAISE EXCEPTION 'insufficient_wallet_balance'; END IF;

  -- Freeze: pending debit (does not affect cleared balance until committed)
  INSERT INTO public.wallet_transactions
    (user_id, amount, kind, label, source, status)
  VALUES (_uid, _escrow, 'debit',
          'تجميد ضمان شراء جماعي - ' || _camp.title,
          'group_buy_escrow', 'pending')
  RETURNING id INTO _tx_id;

  INSERT INTO public.group_buy_pledges
    (campaign_id, user_id, pledged_quantity, unit_price_locked, escrow_amount, escrow_wallet_tx_id, status)
  VALUES (_campaign_id, _uid, _quantity, _unit_price, _escrow, _tx_id, 'locked')
  RETURNING id INTO _pledge_id;

  UPDATE public.group_buy_campaigns
    SET current_quantity = current_quantity + _quantity, updated_at = now()
    WHERE id = _campaign_id;

  RETURN jsonb_build_object(
    'ok', true, 'pledge_id', _pledge_id, 'tx_id', _tx_id,
    'unit_price', _unit_price, 'escrow_amount', _escrow
  );
END $$;

-- ============= SETTLEMENT RPC =============
CREATE OR REPLACE FUNCTION public.process_group_buy_campaign(_campaign_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  _camp record;
  _p record;
  _final_price numeric;
  _delta numeric;
  _affected_users uuid[] := ARRAY[]::uuid[];
  _committed int := 0;
  _refunded int := 0;
BEGIN
  -- Allow either staff or scheduled cron (service role bypasses RLS but check for safety)
  IF auth.uid() IS NOT NULL
     AND NOT (public.has_role(auth.uid(),'admin'::app_role) OR public.has_role(auth.uid(),'finance'::app_role)) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT * INTO _camp FROM public.group_buy_campaigns
    WHERE id = _campaign_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'campaign_not_found'; END IF;
  IF _camp.status <> 'gathering' THEN
    RETURN jsonb_build_object('ok', true, 'noop', true, 'status', _camp.status);
  END IF;

  IF _camp.current_quantity >= _camp.target_quantity THEN
    -- SUCCESS: commit pledges at the final tier price
    _final_price := public.group_buy_current_price(_campaign_id);

    FOR _p IN
      SELECT * FROM public.group_buy_pledges
      WHERE campaign_id = _campaign_id AND status = 'locked'
      FOR UPDATE
    LOOP
      _delta := ROUND(_p.unit_price_locked - _final_price, 2) * _p.pledged_quantity;

      -- Clear the original escrow at locked price
      UPDATE public.wallet_transactions
        SET status = 'cleared', approved_at = now(),
            label = label || ' — تم التأكيد'
        WHERE id = _p.escrow_wallet_tx_id AND status = 'pending';

      -- If final price < locked price, refund the difference
      IF _delta > 0 THEN
        INSERT INTO public.wallet_transactions
          (user_id, amount, kind, label, source, status)
        VALUES (_p.user_id, _delta, 'credit',
                'استرداد فرق سعر شراء جماعي - ' || _camp.title,
                'group_buy_price_drop', 'cleared');
      END IF;

      UPDATE public.group_buy_pledges
        SET status = 'committed', settled_at = now()
        WHERE id = _p.id;

      _affected_users := array_append(_affected_users, _p.user_id);
      _committed := _committed + 1;
    END LOOP;

    UPDATE public.group_buy_campaigns
      SET status = 'succeeded', settled_at = now()
      WHERE id = _campaign_id;
  ELSE
    -- FAILURE: refund all pledges by reversing escrow
    FOR _p IN
      SELECT * FROM public.group_buy_pledges
      WHERE campaign_id = _campaign_id AND status = 'locked'
      FOR UPDATE
    LOOP
      -- Mark original pending debit as failed (never affected balance)
      UPDATE public.wallet_transactions
        SET status = 'failed', approved_at = now(),
            label = label || ' — فشل التجميع، تم الاسترداد'
        WHERE id = _p.escrow_wallet_tx_id AND status = 'pending';

      UPDATE public.group_buy_pledges
        SET status = 'refunded', settled_at = now()
        WHERE id = _p.id;

      _affected_users := array_append(_affected_users, _p.user_id);
      _refunded := _refunded + 1;
    END LOOP;

    UPDATE public.group_buy_campaigns
      SET status = 'failed', settled_at = now()
      WHERE id = _campaign_id;
  END IF;

  -- Recompute wallet balances for affected users (committed credits/refund-credits)
  IF array_length(_affected_users, 1) > 0 THEN
    PERFORM public.recompute_wallet_balance(u)
    FROM unnest(_affected_users) AS u;
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'campaign_id', _campaign_id,
    'committed', _committed,
    'refunded', _refunded,
    'final_status', CASE WHEN _camp.current_quantity >= _camp.target_quantity THEN 'succeeded' ELSE 'failed' END
  );
END $$;

-- ============= REALTIME =============
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_buy_campaigns;
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_buy_pledges;
