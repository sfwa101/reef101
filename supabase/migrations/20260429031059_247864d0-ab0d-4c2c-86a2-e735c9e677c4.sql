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
  IF auth.uid() IS NULL OR auth.uid() <> _user_id THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

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

REVOKE EXECUTE ON FUNCTION public.ensure_referral_code(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ensure_referral_code(uuid) TO authenticated;