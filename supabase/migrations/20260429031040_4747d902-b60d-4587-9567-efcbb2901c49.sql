-- referral_codes
CREATE TABLE public.referral_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  code text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone_can_read_codes_for_validation"
  ON public.referral_codes FOR SELECT
  USING (true);

CREATE POLICY "users_insert_own_code"
  ON public.referral_codes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- referrals
CREATE TABLE public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL,
  referred_id uuid NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'registered',
  commission numeric NOT NULL DEFAULT 0,
  first_order_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_view_own_referrals"
  ON public.referrals FOR SELECT
  TO authenticated
  USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

CREATE POLICY "users_insert_own_referrals"
  ON public.referrals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = referred_id);

CREATE POLICY "admin_manage_referrals"
  ON public.referrals FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ensure_referral_code RPC
CREATE OR REPLACE FUNCTION public.ensure_referral_code(_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _code text;
  _attempt int := 0;
BEGIN
  SELECT code INTO _code FROM public.referral_codes WHERE user_id = _user_id;
  IF _code IS NOT NULL THEN
    RETURN _code;
  END IF;

  LOOP
    _attempt := _attempt + 1;
    _code := 'REEF' || upper(substr(md5(random()::text || _user_id::text || clock_timestamp()::text), 1, 6));
    BEGIN
      INSERT INTO public.referral_codes (user_id, code) VALUES (_user_id, _code);
      RETURN _code;
    EXCEPTION WHEN unique_violation THEN
      IF _attempt > 5 THEN RAISE; END IF;
    END;
  END LOOP;
END;
$$;