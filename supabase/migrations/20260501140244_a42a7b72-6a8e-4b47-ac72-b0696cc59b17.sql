-- Phase 4: KYC-Gated P2P Engine & Restricted Balances

-- 1) KYC level on kyc_verifications (0=unverified, 1=ID verified, 2=Address verified)
ALTER TABLE public.kyc_verifications
  ADD COLUMN IF NOT EXISTS kyc_level SMALLINT NOT NULL DEFAULT 0;

ALTER TABLE public.kyc_verifications
  DROP CONSTRAINT IF EXISTS kyc_level_range_chk;
ALTER TABLE public.kyc_verifications
  ADD CONSTRAINT kyc_level_range_chk CHECK (kyc_level BETWEEN 0 AND 2);

-- 2) Restricted spending columns on wallet_transactions
ALTER TABLE public.wallet_transactions
  ADD COLUMN IF NOT EXISTS restricted_to_categories TEXT[],
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sub_account_id UUID;

CREATE INDEX IF NOT EXISTS idx_wallet_tx_expires
  ON public.wallet_transactions (expires_at)
  WHERE expires_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_wallet_tx_sub_account
  ON public.wallet_transactions (sub_account_id)
  WHERE sub_account_id IS NOT NULL;

-- 3) wallet_sub_accounts: named allowance pockets under a parent wallet
CREATE TABLE IF NOT EXISTS public.wallet_sub_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  beneficiary_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  beneficiary_phone TEXT,
  label TEXT NOT NULL,
  balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  restricted_to_categories TEXT[],
  monthly_limit NUMERIC(12,2),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wsa_owner ON public.wallet_sub_accounts(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_wsa_beneficiary ON public.wallet_sub_accounts(beneficiary_user_id);

ALTER TABLE public.wallet_sub_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wsa_owner_select" ON public.wallet_sub_accounts;
CREATE POLICY "wsa_owner_select" ON public.wallet_sub_accounts
  FOR SELECT TO authenticated
  USING (auth.uid() = owner_user_id OR auth.uid() = beneficiary_user_id OR has_role(auth.uid(),'admin'::app_role));

DROP POLICY IF EXISTS "wsa_owner_insert" ON public.wallet_sub_accounts;
CREATE POLICY "wsa_owner_insert" ON public.wallet_sub_accounts
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_user_id);

DROP POLICY IF EXISTS "wsa_owner_update" ON public.wallet_sub_accounts;
CREATE POLICY "wsa_owner_update" ON public.wallet_sub_accounts
  FOR UPDATE TO authenticated
  USING (auth.uid() = owner_user_id OR has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (auth.uid() = owner_user_id OR has_role(auth.uid(),'admin'::app_role));

DROP POLICY IF EXISTS "wsa_owner_delete" ON public.wallet_sub_accounts;
CREATE POLICY "wsa_owner_delete" ON public.wallet_sub_accounts
  FOR DELETE TO authenticated
  USING (auth.uid() = owner_user_id OR has_role(auth.uid(),'admin'::app_role));

DROP TRIGGER IF EXISTS wsa_set_updated_at ON public.wallet_sub_accounts;
CREATE TRIGGER wsa_set_updated_at
  BEFORE UPDATE ON public.wallet_sub_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4) Helper: get current KYC level for a user (security definer to bypass RLS for own/staff checks)
CREATE OR REPLACE FUNCTION public.get_user_kyc_level(_user_id UUID DEFAULT auth.uid())
RETURNS SMALLINT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT
       CASE
         WHEN status = 'approved' THEN GREATEST(kyc_level, 1)::smallint
         ELSE kyc_level
       END
     FROM public.kyc_verifications
     WHERE user_id = _user_id
     LIMIT 1),
    0::smallint
  )
$$;