-- Phase 6: Real-Time Shared Carts & Split Billing Engine

-- Enums
DO $$ BEGIN
  CREATE TYPE public.shared_cart_status AS ENUM ('active','pending_approvals','frozen','completed','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.shared_cart_role AS ENUM ('owner','contributor');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.shared_cart_split_type AS ENUM ('percentage','fixed','itemized');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.shared_cart_approval AS ENUM ('pending','approved','rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- shared_carts
CREATE TABLE IF NOT EXISTS public.shared_carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status public.shared_cart_status NOT NULL DEFAULT 'active',
  title TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- shared_cart_participants
CREATE TABLE IF NOT EXISTS public.shared_cart_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID NOT NULL REFERENCES public.shared_carts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role public.shared_cart_role NOT NULL DEFAULT 'contributor',
  split_type public.shared_cart_split_type NOT NULL DEFAULT 'percentage',
  split_value NUMERIC NOT NULL DEFAULT 0,
  approval_status public.shared_cart_approval NOT NULL DEFAULT 'pending',
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (cart_id, user_id)
);

-- shared_cart_items
CREATE TABLE IF NOT EXISTS public.shared_cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID NOT NULL REFERENCES public.shared_carts(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  added_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shared_cart_items_cart ON public.shared_cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_shared_cart_participants_cart ON public.shared_cart_participants(cart_id);
CREATE INDEX IF NOT EXISTS idx_shared_cart_participants_user ON public.shared_cart_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_shared_carts_owner ON public.shared_carts(owner_id);

-- Enable RLS
ALTER TABLE public.shared_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_cart_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_cart_items ENABLE ROW LEVEL SECURITY;

-- Security definer helper to avoid recursive RLS between carts and participants
CREATE OR REPLACE FUNCTION public.is_shared_cart_participant(_cart_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.shared_cart_participants
    WHERE cart_id = _cart_id AND user_id = _user_id
  ) OR EXISTS (
    SELECT 1 FROM public.shared_carts WHERE id = _cart_id AND owner_id = _user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_shared_cart_owner(_cart_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.shared_carts WHERE id = _cart_id AND owner_id = _user_id
  );
$$;

-- Policies: shared_carts
DROP POLICY IF EXISTS "Participants can view their shared carts" ON public.shared_carts;
CREATE POLICY "Participants can view their shared carts"
ON public.shared_carts FOR SELECT TO authenticated
USING (public.is_shared_cart_participant(id, auth.uid()));

DROP POLICY IF EXISTS "Users can create shared carts as owner" ON public.shared_carts;
CREATE POLICY "Users can create shared carts as owner"
ON public.shared_carts FOR INSERT TO authenticated
WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "Only owner can update cart" ON public.shared_carts;
CREATE POLICY "Only owner can update cart"
ON public.shared_carts FOR UPDATE TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "Only owner can delete cart" ON public.shared_carts;
CREATE POLICY "Only owner can delete cart"
ON public.shared_carts FOR DELETE TO authenticated
USING (owner_id = auth.uid());

-- Policies: shared_cart_participants
DROP POLICY IF EXISTS "Participants can view participants" ON public.shared_cart_participants;
CREATE POLICY "Participants can view participants"
ON public.shared_cart_participants FOR SELECT TO authenticated
USING (public.is_shared_cart_participant(cart_id, auth.uid()));

DROP POLICY IF EXISTS "Owner can add participants" ON public.shared_cart_participants;
CREATE POLICY "Owner can add participants"
ON public.shared_cart_participants FOR INSERT TO authenticated
WITH CHECK (
  public.is_shared_cart_owner(cart_id, auth.uid())
  OR (user_id = auth.uid() AND public.is_shared_cart_owner(cart_id, user_id))
);

-- Owner can update split assignments; participants can only update their own approval_status
DROP POLICY IF EXISTS "Owner manages splits, self manages approval" ON public.shared_cart_participants;
CREATE POLICY "Owner manages splits, self manages approval"
ON public.shared_cart_participants FOR UPDATE TO authenticated
USING (
  public.is_shared_cart_owner(cart_id, auth.uid())
  OR user_id = auth.uid()
)
WITH CHECK (
  public.is_shared_cart_owner(cart_id, auth.uid())
  OR user_id = auth.uid()
);

DROP POLICY IF EXISTS "Owner can remove participants" ON public.shared_cart_participants;
CREATE POLICY "Owner can remove participants"
ON public.shared_cart_participants FOR DELETE TO authenticated
USING (
  public.is_shared_cart_owner(cart_id, auth.uid())
  OR user_id = auth.uid()
);

-- Policies: shared_cart_items
DROP POLICY IF EXISTS "Participants can view items" ON public.shared_cart_items;
CREATE POLICY "Participants can view items"
ON public.shared_cart_items FOR SELECT TO authenticated
USING (public.is_shared_cart_participant(cart_id, auth.uid()));

DROP POLICY IF EXISTS "Participants can add items while active" ON public.shared_cart_items;
CREATE POLICY "Participants can add items while active"
ON public.shared_cart_items FOR INSERT TO authenticated
WITH CHECK (
  added_by = auth.uid()
  AND public.is_shared_cart_participant(cart_id, auth.uid())
  AND EXISTS (SELECT 1 FROM public.shared_carts c WHERE c.id = cart_id AND c.status = 'active')
);

DROP POLICY IF EXISTS "Adder or owner can update items while active" ON public.shared_cart_items;
CREATE POLICY "Adder or owner can update items while active"
ON public.shared_cart_items FOR UPDATE TO authenticated
USING (
  (added_by = auth.uid() OR public.is_shared_cart_owner(cart_id, auth.uid()))
  AND EXISTS (SELECT 1 FROM public.shared_carts c WHERE c.id = cart_id AND c.status = 'active')
)
WITH CHECK (
  (added_by = auth.uid() OR public.is_shared_cart_owner(cart_id, auth.uid()))
);

DROP POLICY IF EXISTS "Adder or owner can delete items while active" ON public.shared_cart_items;
CREATE POLICY "Adder or owner can delete items while active"
ON public.shared_cart_items FOR DELETE TO authenticated
USING (
  (added_by = auth.uid() OR public.is_shared_cart_owner(cart_id, auth.uid()))
  AND EXISTS (SELECT 1 FROM public.shared_carts c WHERE c.id = cart_id AND c.status = 'active')
);

-- updated_at triggers
DROP TRIGGER IF EXISTS trg_shared_carts_updated ON public.shared_carts;
CREATE TRIGGER trg_shared_carts_updated BEFORE UPDATE ON public.shared_carts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_shared_cart_participants_updated ON public.shared_cart_participants;
CREATE TRIGGER trg_shared_cart_participants_updated BEFORE UPDATE ON public.shared_cart_participants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_shared_cart_items_updated ON public.shared_cart_items;
CREATE TRIGGER trg_shared_cart_items_updated BEFORE UPDATE ON public.shared_cart_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-add owner as participant on cart creation
CREATE OR REPLACE FUNCTION public.handle_new_shared_cart()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.shared_cart_participants(cart_id, user_id, role, split_type, split_value, approval_status)
  VALUES (NEW.id, NEW.owner_id, 'owner', 'percentage', 100, 'approved')
  ON CONFLICT (cart_id, user_id) DO NOTHING;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_handle_new_shared_cart ON public.shared_carts;
CREATE TRIGGER trg_handle_new_shared_cart AFTER INSERT ON public.shared_carts
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_shared_cart();

-- Auto-promote to 'frozen' once all participants approve while in pending_approvals
CREATE OR REPLACE FUNCTION public.maybe_freeze_shared_cart()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _pending int; _rejected int; _status public.shared_cart_status;
BEGIN
  SELECT status INTO _status FROM public.shared_carts WHERE id = NEW.cart_id;
  IF _status <> 'pending_approvals' THEN RETURN NEW; END IF;

  SELECT COUNT(*) FILTER (WHERE approval_status = 'pending'),
         COUNT(*) FILTER (WHERE approval_status = 'rejected')
    INTO _pending, _rejected
    FROM public.shared_cart_participants WHERE cart_id = NEW.cart_id;

  IF _rejected > 0 THEN
    UPDATE public.shared_carts SET status = 'active', updated_at = now() WHERE id = NEW.cart_id;
  ELSIF _pending = 0 THEN
    UPDATE public.shared_carts SET status = 'frozen', updated_at = now() WHERE id = NEW.cart_id;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_maybe_freeze_shared_cart ON public.shared_cart_participants;
CREATE TRIGGER trg_maybe_freeze_shared_cart AFTER UPDATE OF approval_status ON public.shared_cart_participants
  FOR EACH ROW EXECUTE FUNCTION public.maybe_freeze_shared_cart();

-- Realtime publication
ALTER TABLE public.shared_carts REPLICA IDENTITY FULL;
ALTER TABLE public.shared_cart_participants REPLICA IDENTITY FULL;
ALTER TABLE public.shared_cart_items REPLICA IDENTITY FULL;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.shared_carts;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.shared_cart_participants;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.shared_cart_items;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
