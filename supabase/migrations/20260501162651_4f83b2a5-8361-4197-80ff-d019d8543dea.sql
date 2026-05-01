-- Phase 17: POS Shift Ledger + barcode lookup

-- 1. pos_shifts ledger
CREATE TABLE IF NOT EXISTS public.pos_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  cashier_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed')),
  opening_balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  closing_balance NUMERIC(12,2),
  expected_balance NUMERIC(12,2),
  discrepancy NUMERIC(12,2),
  total_sales NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_orders INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One open shift per cashier
CREATE UNIQUE INDEX IF NOT EXISTS pos_shifts_one_open_per_cashier
  ON public.pos_shifts(cashier_id) WHERE status = 'open';

CREATE INDEX IF NOT EXISTS pos_shifts_branch_idx ON public.pos_shifts(branch_id);
CREATE INDEX IF NOT EXISTS pos_shifts_opened_at_idx ON public.pos_shifts(opened_at DESC);

ALTER TABLE public.pos_shifts ENABLE ROW LEVEL SECURITY;

-- Cashier can see their own shifts
DROP POLICY IF EXISTS "cashiers see own shifts" ON public.pos_shifts;
CREATE POLICY "cashiers see own shifts" ON public.pos_shifts
  FOR SELECT TO authenticated
  USING (auth.uid() = cashier_id);

-- Admins/branch managers see all (uses existing has_role helper if present)
DROP POLICY IF EXISTS "admins see all shifts" ON public.pos_shifts;
CREATE POLICY "admins see all shifts" ON public.pos_shifts
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'branch_manager'));

-- Cashier opens their own shift
DROP POLICY IF EXISTS "cashier opens shift" ON public.pos_shifts;
CREATE POLICY "cashier opens shift" ON public.pos_shifts
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = cashier_id);

-- Cashier updates only their open shift (close handled via RPC)
DROP POLICY IF EXISTS "cashier updates own open shift" ON public.pos_shifts;
CREATE POLICY "cashier updates own open shift" ON public.pos_shifts
  FOR UPDATE TO authenticated
  USING (auth.uid() = cashier_id);

-- updated_at trigger
DROP TRIGGER IF EXISTS pos_shifts_set_updated_at ON public.pos_shifts;
CREATE TRIGGER pos_shifts_set_updated_at
BEFORE UPDATE ON public.pos_shifts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. close_pos_shift RPC: reconcile drawer
CREATE OR REPLACE FUNCTION public.close_pos_shift(_shift_id UUID, _actual_balance NUMERIC)
RETURNS public.pos_shifts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _shift public.pos_shifts;
  _expected NUMERIC;
BEGIN
  SELECT * INTO _shift FROM public.pos_shifts WHERE id = _shift_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'shift_not_found'; END IF;
  IF _shift.cashier_id <> auth.uid()
     AND NOT public.has_role(auth.uid(), 'admin')
     AND NOT public.has_role(auth.uid(), 'branch_manager')
  THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;
  IF _shift.status = 'closed' THEN RAISE EXCEPTION 'already_closed'; END IF;

  _expected := COALESCE(_shift.opening_balance, 0) + COALESCE(_shift.total_sales, 0);

  UPDATE public.pos_shifts
  SET status = 'closed',
      closing_balance = _actual_balance,
      expected_balance = _expected,
      discrepancy = COALESCE(_actual_balance, 0) - _expected,
      closed_at = now()
  WHERE id = _shift_id
  RETURNING * INTO _shift;

  RETURN _shift;
END;
$$;

REVOKE ALL ON FUNCTION public.close_pos_shift(UUID, NUMERIC) FROM public;
GRANT EXECUTE ON FUNCTION public.close_pos_shift(UUID, NUMERIC) TO authenticated;

-- 3. Optional barcode lookup on products (nullable, indexed)
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS barcode TEXT;
CREATE INDEX IF NOT EXISTS products_barcode_idx ON public.products(barcode) WHERE barcode IS NOT NULL;
