CREATE TABLE public.savings_jar (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  balance numeric NOT NULL DEFAULT 0,
  auto_save_enabled boolean NOT NULL DEFAULT false,
  round_to integer NOT NULL DEFAULT 5,
  goal numeric,
  goal_label text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.savings_jar ENABLE ROW LEVEL SECURITY;

CREATE POLICY "savings_jar_select_own" ON public.savings_jar FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "savings_jar_insert_own" ON public.savings_jar FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "savings_jar_update_own" ON public.savings_jar FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER savings_jar_set_updated_at
  BEFORE UPDATE ON public.savings_jar
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.savings_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount numeric NOT NULL,
  kind text NOT NULL DEFAULT 'deposit',
  label text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.savings_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "savings_tx_select_own" ON public.savings_transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "savings_tx_insert_own" ON public.savings_transactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);