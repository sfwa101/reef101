-- Charity campaigns
CREATE TABLE IF NOT EXISTS public.charity_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  auditor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  target_amount NUMERIC NOT NULL DEFAULT 0 CHECK (target_amount >= 0),
  current_amount NUMERIC NOT NULL DEFAULT 0 CHECK (current_amount >= 0),
  restricted_categories TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_charity_campaigns_auditor ON public.charity_campaigns(auditor_id);
CREATE INDEX IF NOT EXISTS idx_charity_campaigns_active ON public.charity_campaigns(is_active) WHERE is_active = true;

ALTER TABLE public.charity_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "campaigns_select"
  ON public.charity_campaigns FOR SELECT
  TO authenticated
  USING (is_active = true OR auditor_id = auth.uid() OR has_role(auth.uid(),'admin'::app_role));

CREATE POLICY "campaigns_insert_self"
  ON public.charity_campaigns FOR INSERT
  TO authenticated
  WITH CHECK (
    auditor_id = auth.uid()
    AND (has_role(auth.uid(),'charity_auditor'::app_role) OR has_role(auth.uid(),'admin'::app_role))
  );

CREATE POLICY "campaigns_update_owner"
  ON public.charity_campaigns FOR UPDATE
  TO authenticated
  USING (auditor_id = auth.uid() OR has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (auditor_id = auth.uid() OR has_role(auth.uid(),'admin'::app_role));

CREATE POLICY "campaigns_delete_owner"
  ON public.charity_campaigns FOR DELETE
  TO authenticated
  USING (auditor_id = auth.uid() OR has_role(auth.uid(),'admin'::app_role));

CREATE TRIGGER trg_charity_campaigns_updated_at
  BEFORE UPDATE ON public.charity_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Charity donations ledger
CREATE TABLE IF NOT EXISTS public.charity_donations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  donor_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  campaign_id UUID REFERENCES public.charity_campaigns(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  source TEXT NOT NULL DEFAULT 'direct' CHECK (source IN ('direct','general_pool','spare_change')),
  wallet_tx_id UUID,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'cleared' CHECK (status IN ('pending','cleared','refunded')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_charity_donations_donor ON public.charity_donations(donor_user_id);
CREATE INDEX IF NOT EXISTS idx_charity_donations_campaign ON public.charity_donations(campaign_id);

ALTER TABLE public.charity_donations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "donations_select"
  ON public.charity_donations FOR SELECT
  TO authenticated
  USING (
    donor_user_id = auth.uid()
    OR has_role(auth.uid(),'admin'::app_role)
    OR has_role(auth.uid(),'finance'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.charity_campaigns c
      WHERE c.id = campaign_id AND c.auditor_id = auth.uid()
    )
  );

CREATE POLICY "donations_block_direct_insert"
  ON public.charity_donations FOR INSERT
  TO authenticated
  WITH CHECK (false);

-- Atomic donate RPC
CREATE OR REPLACE FUNCTION public.donate_to_campaign(
  _campaign_id UUID,
  _amount NUMERIC,
  _source TEXT DEFAULT 'direct',
  _note TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user UUID := auth.uid();
  _bal NUMERIC;
  _campaign RECORD;
  _tx_id UUID;
  _donation_id UUID;
  _label TEXT;
BEGIN
  IF _user IS NULL THEN RAISE EXCEPTION 'unauthorized'; END IF;
  IF _amount IS NULL OR _amount <= 0 THEN RAISE EXCEPTION 'invalid_amount'; END IF;
  IF _source NOT IN ('direct','general_pool','spare_change') THEN
    RAISE EXCEPTION 'invalid_source';
  END IF;

  IF _source = 'direct' THEN
    SELECT * INTO _campaign FROM public.charity_campaigns
      WHERE id = _campaign_id AND is_active = true FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'campaign_not_found_or_inactive'; END IF;
    _label := 'تبرع: ' || _campaign.title;
  ELSIF _campaign_id IS NOT NULL THEN
    SELECT * INTO _campaign FROM public.charity_campaigns
      WHERE id = _campaign_id AND is_active = true FOR UPDATE;
    _label := COALESCE('تبرع: ' || _campaign.title, 'تبرع للصندوق العام');
  ELSE
    _label := 'تبرع للصندوق العام';
  END IF;

  SELECT COALESCE(balance,0) INTO _bal FROM public.wallet_balances
    WHERE user_id = _user FOR UPDATE;
  IF COALESCE(_bal,0) < _amount THEN RAISE EXCEPTION 'insufficient_balance'; END IF;

  INSERT INTO public.wallet_transactions (user_id, amount, kind, label, source, status)
  VALUES (_user, _amount, 'debit', _label, 'charity_donation', 'cleared')
  RETURNING id INTO _tx_id;

  PERFORM public.recompute_wallet_balance(_user);

  IF _campaign_id IS NOT NULL THEN
    UPDATE public.charity_campaigns
      SET current_amount = current_amount + _amount, updated_at = now()
      WHERE id = _campaign_id;
  END IF;

  INSERT INTO public.charity_donations
    (donor_user_id, campaign_id, amount, source, wallet_tx_id, note, status)
  VALUES (_user, _campaign_id, _amount, _source, _tx_id, _note, 'cleared')
  RETURNING id INTO _donation_id;

  RETURN jsonb_build_object('ok', true, 'donation_id', _donation_id, 'tx_id', _tx_id);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.donate_to_campaign(UUID, NUMERIC, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.donate_to_campaign(UUID, NUMERIC, TEXT, TEXT) TO authenticated;