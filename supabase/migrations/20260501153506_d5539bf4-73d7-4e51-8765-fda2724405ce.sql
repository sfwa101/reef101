
-- ============ TIER CATALOG ============
CREATE TABLE IF NOT EXISTS public.affiliate_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  rank INT NOT NULL UNIQUE,
  min_successful_invites INT NOT NULL DEFAULT 0,
  commission_fixed NUMERIC NOT NULL DEFAULT 0,
  unlocks_wholesale BOOLEAN NOT NULL DEFAULT false,
  badge_emoji TEXT DEFAULT '🌱',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.affiliate_tiers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tiers_read_all_auth" ON public.affiliate_tiers;
CREATE POLICY "tiers_read_all_auth" ON public.affiliate_tiers
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "tiers_admin_write" ON public.affiliate_tiers;
CREATE POLICY "tiers_admin_write" ON public.affiliate_tiers
  FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role));

CREATE TRIGGER trg_affiliate_tiers_updated
  BEFORE UPDATE ON public.affiliate_tiers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed defaults (idempotent)
INSERT INTO public.affiliate_tiers (name, rank, min_successful_invites, commission_fixed, unlocks_wholesale, badge_emoji)
VALUES
  ('Bronze',        1, 0,   25,  false, '🌱'),
  ('Silver',        2, 5,   45,  false, '⭐'),
  ('Gold Partner',  3, 15,  80,  true,  '🏆'),
  ('Platinum',      4, 40,  150, true,  '💎')
ON CONFLICT (name) DO NOTHING;

-- ============ PER-USER STATE ============
CREATE TABLE IF NOT EXISTS public.user_affiliate_state (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_tier_id UUID REFERENCES public.affiliate_tiers(id),
  successful_invites INT NOT NULL DEFAULT 0,
  total_commission_earned NUMERIC NOT NULL DEFAULT 0,
  unlocks_wholesale BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_affiliate_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "uas_self_read" ON public.user_affiliate_state;
CREATE POLICY "uas_self_read" ON public.user_affiliate_state
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR is_staff(auth.uid()));

DROP POLICY IF EXISTS "uas_admin_write" ON public.user_affiliate_state;
CREATE POLICY "uas_admin_write" ON public.user_affiliate_state
  FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role));

CREATE TRIGGER trg_uas_updated
  BEFORE UPDATE ON public.user_affiliate_state
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ ENSURE REFERRAL CODE ============
CREATE OR REPLACE FUNCTION public.ensure_referral_code(_user_id UUID DEFAULT auth.uid())
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _code TEXT;
  _existing TEXT;
BEGIN
  IF _user_id IS NULL THEN RAISE EXCEPTION 'unauthorized'; END IF;
  IF _user_id <> auth.uid() AND NOT is_staff(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT referral_code INTO _existing FROM public.profiles WHERE id = _user_id;
  IF _existing IS NOT NULL AND length(_existing) > 0 THEN
    RETURN _existing;
  END IF;

  LOOP
    _code := upper(substr(replace(gen_random_uuid()::text,'-',''),1,7));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE referral_code = _code);
  END LOOP;

  UPDATE public.profiles SET referral_code = _code WHERE id = _user_id;

  -- Bootstrap affiliate state at Bronze
  INSERT INTO public.user_affiliate_state (user_id, current_tier_id, successful_invites)
  VALUES (
    _user_id,
    (SELECT id FROM public.affiliate_tiers ORDER BY rank ASC LIMIT 1),
    0
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN _code;
END $$;

-- ============ PROCESS SUCCESSFUL REFERRAL ============
CREATE OR REPLACE FUNCTION public.process_successful_referral(_referral_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _ref RECORD;
  _referrer UUID;
  _state RECORD;
  _tier RECORD;
  _next_tier RECORD;
  _reward NUMERIC;
  _new_count INT;
  _upgraded BOOLEAN := false;
BEGIN
  IF NOT (is_staff(auth.uid()) OR has_role(auth.uid(),'admin'::app_role)) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT * INTO _ref FROM public.referrals WHERE id = _referral_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'referral_not_found'; END IF;
  IF _ref.status = 'purchased' THEN
    RETURN jsonb_build_object('ok', true, 'already_processed', true);
  END IF;

  _referrer := _ref.referrer_user_id;

  -- Ensure state row exists
  INSERT INTO public.user_affiliate_state (user_id, current_tier_id, successful_invites)
  VALUES (_referrer, (SELECT id FROM public.affiliate_tiers ORDER BY rank ASC LIMIT 1), 0)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT * INTO _state FROM public.user_affiliate_state WHERE user_id = _referrer FOR UPDATE;
  SELECT * INTO _tier  FROM public.affiliate_tiers WHERE id = _state.current_tier_id;
  IF _tier IS NULL THEN
    SELECT * INTO _tier FROM public.affiliate_tiers ORDER BY rank ASC LIMIT 1;
  END IF;

  _reward := COALESCE(_tier.commission_fixed, 25);
  _new_count := _state.successful_invites + 1;

  -- Mark referral purchased
  UPDATE public.referrals
     SET status = 'purchased',
         commission = _reward,
         purchased_at = COALESCE(purchased_at, now())
   WHERE id = _referral_id;

  -- Credit wallet (event-sourced)
  INSERT INTO public.wallet_transactions
    (user_id, amount, kind, label, source, status)
  VALUES
    (_referrer, _reward, 'credit',
     'مكافأة إحالة (' || _tier.name || ')',
     'referral_network', 'cleared');

  PERFORM public.recompute_wallet_balance(_referrer);

  -- Check tier upgrade
  SELECT * INTO _next_tier
  FROM public.affiliate_tiers
  WHERE rank > _tier.rank AND min_successful_invites <= _new_count
  ORDER BY rank DESC LIMIT 1;

  IF _next_tier.id IS NOT NULL THEN
    _upgraded := true;
    UPDATE public.user_affiliate_state
       SET current_tier_id = _next_tier.id,
           successful_invites = _new_count,
           total_commission_earned = total_commission_earned + _reward,
           unlocks_wholesale = _next_tier.unlocks_wholesale
     WHERE user_id = _referrer;

    INSERT INTO public.notifications(user_id, title, body, icon)
    VALUES (_referrer,
            '🎉 ترقية مستوى!',
            'وصلت إلى مستوى ' || _next_tier.name || '! مكافآت أعلى في انتظارك.',
            'trophy');
  ELSE
    UPDATE public.user_affiliate_state
       SET successful_invites = _new_count,
           total_commission_earned = total_commission_earned + _reward
     WHERE user_id = _referrer;
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'reward', _reward,
    'tier', _tier.name,
    'invites', _new_count,
    'upgraded', _upgraded,
    'new_tier', _next_tier.name
  );
END $$;
