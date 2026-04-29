-- Trust limit function: returns max BNPL credit (EGP) the user is allowed
-- Requires: KYC approved AND tier gold+ (cumulative spend >= 10000)
CREATE OR REPLACE FUNCTION public.user_trust_limit(_user_id uuid)
RETURNS numeric
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _spent numeric;
  _kyc_ok boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.kyc_verifications
    WHERE user_id = _user_id AND status = 'approved'
  ) INTO _kyc_ok;

  IF NOT _kyc_ok THEN
    RETURN 0;
  END IF;

  SELECT public.user_total_spent(_user_id) INTO _spent;

  IF _spent >= 60000 THEN RETURN 500;     -- VIP
  ELSIF _spent >= 25000 THEN RETURN 300;  -- Platinum
  ELSIF _spent >= 10000 THEN RETURN 150;  -- Gold
  ELSE RETURN 0;
  END IF;
END;
$$;

-- Atomic P2P transfer between two wallets, lookup recipient by phone
CREATE OR REPLACE FUNCTION public.wallet_transfer(_recipient_phone text, _amount numeric, _note text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _sender uuid := auth.uid();
  _recipient uuid;
  _sender_balance numeric;
  _norm_phone text;
BEGIN
  IF _sender IS NULL THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;
  IF _amount IS NULL OR _amount <= 0 THEN
    RAISE EXCEPTION 'invalid_amount';
  END IF;
  IF _amount > 5000 THEN
    RAISE EXCEPTION 'limit_exceeded';
  END IF;

  -- normalize phone: keep digits only, last 11 (Egyptian standard)
  _norm_phone := regexp_replace(coalesce(_recipient_phone, ''), '\D', '', 'g');
  IF length(_norm_phone) < 10 THEN
    RAISE EXCEPTION 'invalid_phone';
  END IF;

  SELECT id INTO _recipient
  FROM public.profiles
  WHERE regexp_replace(coalesce(phone, ''), '\D', '', 'g') LIKE '%' || right(_norm_phone, 10)
  LIMIT 1;

  IF _recipient IS NULL THEN
    RAISE EXCEPTION 'recipient_not_found';
  END IF;
  IF _recipient = _sender THEN
    RAISE EXCEPTION 'self_transfer';
  END IF;

  SELECT balance INTO _sender_balance FROM public.wallet_balances WHERE user_id = _sender FOR UPDATE;
  IF _sender_balance IS NULL OR _sender_balance < _amount THEN
    RAISE EXCEPTION 'insufficient_balance';
  END IF;

  -- ensure recipient wallet exists
  INSERT INTO public.wallet_balances (user_id, balance) VALUES (_recipient, 0)
  ON CONFLICT (user_id) DO NOTHING;

  -- debit sender, credit recipient
  UPDATE public.wallet_balances SET balance = balance - _amount, updated_at = now() WHERE user_id = _sender;
  UPDATE public.wallet_balances SET balance = balance + _amount, updated_at = now() WHERE user_id = _recipient;

  -- log transactions
  INSERT INTO public.wallet_transactions (user_id, amount, kind, label, source)
  VALUES
    (_sender, _amount, 'debit', coalesce(_note, 'تحويل إلى ' || right(_norm_phone, 4) || '****'), 'p2p_transfer'),
    (_recipient, _amount, 'credit', 'تحويل وارد من صديق', 'p2p_transfer');

  RETURN jsonb_build_object('ok', true, 'recipient_id', _recipient);
END;
$$;

-- ensure wallet_balances has unique constraint on user_id (needed for ON CONFLICT)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'wallet_balances_user_id_key'
  ) THEN
    ALTER TABLE public.wallet_balances ADD CONSTRAINT wallet_balances_user_id_key UNIQUE (user_id);
  END IF;
END$$;