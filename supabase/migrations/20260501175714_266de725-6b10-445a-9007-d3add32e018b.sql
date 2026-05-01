
-- Phase 22: Affiliate Payout Engine — user-initiated withdrawals
CREATE TABLE IF NOT EXISTS public.user_payout_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  method TEXT NOT NULL CHECK (method IN ('bank_transfer','vodafone_cash','instapay')),
  bank_details JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','rejected')),
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  ledger_tx_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_payout_requests_user ON public.user_payout_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_user_payout_requests_status ON public.user_payout_requests(status);

ALTER TABLE public.user_payout_requests ENABLE ROW LEVEL SECURITY;

-- Owners can view their own
CREATE POLICY "user_payout_requests_owner_select"
  ON public.user_payout_requests FOR SELECT
  USING (auth.uid() = user_id);

-- Admin/finance can view all
CREATE POLICY "user_payout_requests_staff_select"
  ON public.user_payout_requests FOR SELECT
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'finance'::app_role));

-- Admin/finance can update (process/reject)
CREATE POLICY "user_payout_requests_staff_update"
  ON public.user_payout_requests FOR UPDATE
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'finance'::app_role));

-- No direct INSERT — must go through RPC

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_upr_updated_at ON public.user_payout_requests;
CREATE TRIGGER trg_upr_updated_at
  BEFORE UPDATE ON public.user_payout_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RPC: request_user_payout — locks funds via pending debit
CREATE OR REPLACE FUNCTION public.request_user_payout(
  _amount NUMERIC,
  _method TEXT,
  _bank_details JSONB
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid UUID := auth.uid();
  _avail NUMERIC;
  _req_id UUID;
  _tx_id UUID;
  _min_amount CONSTANT NUMERIC := 500;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'unauthorized'; END IF;
  IF _amount IS NULL OR _amount <= 0 THEN RAISE EXCEPTION 'invalid_amount'; END IF;
  IF _amount < _min_amount THEN
    RAISE EXCEPTION 'below_minimum (min=%, requested=%)', _min_amount, _amount;
  END IF;
  IF _method NOT IN ('bank_transfer','vodafone_cash','instapay') THEN
    RAISE EXCEPTION 'invalid_method';
  END IF;
  IF _bank_details IS NULL OR jsonb_typeof(_bank_details) <> 'object' THEN
    RAISE EXCEPTION 'invalid_bank_details';
  END IF;

  -- Sync wallet first, then check balance
  PERFORM public.recompute_wallet_balance(_uid);
  SELECT balance INTO _avail FROM public.wallet_balances WHERE user_id = _uid;
  IF COALESCE(_avail,0) < _amount THEN
    RAISE EXCEPTION 'insufficient_funds (available=%, requested=%)', COALESCE(_avail,0), _amount;
  END IF;

  -- Create payout request
  INSERT INTO public.user_payout_requests (user_id, amount, method, bank_details, status)
  VALUES (_uid, _amount, _method, _bank_details, 'pending')
  RETURNING id INTO _req_id;

  -- Pending debit on the ledger to lock funds
  INSERT INTO public.wallet_transactions (user_id, kind, amount, source, status, label)
  VALUES (_uid, 'debit', _amount, 'payout', 'pending', 'طلب سحب — قيد المراجعة')
  RETURNING id INTO _tx_id;

  UPDATE public.user_payout_requests SET ledger_tx_id = _tx_id WHERE id = _req_id;

  PERFORM public.recompute_wallet_balance(_uid);

  RETURN jsonb_build_object(
    'ok', true,
    'request_id', _req_id,
    'available_after', GREATEST(0, _avail - _amount)
  );
END $$;

REVOKE ALL ON FUNCTION public.request_user_payout(NUMERIC, TEXT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.request_user_payout(NUMERIC, TEXT, JSONB) TO authenticated;
