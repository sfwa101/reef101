-- 1. Add 'vendor' role to enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'vendor';

-- 2. Vendors table (external suppliers / restaurant partners distinct from internal stores)
CREATE TABLE IF NOT EXISTS public.vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  vendor_type text NOT NULL DEFAULT 'dropship' CHECK (vendor_type IN ('dropship','restaurant','supplier')),
  owner_user_id uuid,
  contact_email text,
  contact_phone text,
  address text,
  commission_pct numeric NOT NULL DEFAULT 15 CHECK (commission_pct >= 0 AND commission_pct <= 100),
  payout_method text DEFAULT 'bank_transfer',
  payout_details jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vendors_admin_manage" ON public.vendors
  FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role));

CREATE POLICY "vendors_view_own" ON public.vendors
  FOR SELECT TO authenticated
  USING (owner_user_id = auth.uid());

CREATE POLICY "vendors_public_read_active" ON public.vendors
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

CREATE TRIGGER trg_vendors_updated_at
  BEFORE UPDATE ON public.vendors
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3. Warehouses
CREATE TABLE IF NOT EXISTS public.warehouses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  warehouse_type text NOT NULL DEFAULT 'main' CHECK (warehouse_type IN ('main','branch','vendor','virtual')),
  vendor_id uuid REFERENCES public.vendors(id) ON DELETE SET NULL,
  address text,
  city text,
  district text,
  served_zones text[] NOT NULL DEFAULT '{}',  -- e.g. {'A','B','M'}
  priority integer NOT NULL DEFAULT 100,       -- lower = higher priority for picking
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "warehouses_admin_manage" ON public.warehouses
  FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'store_manager'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'store_manager'::app_role));

CREATE POLICY "warehouses_vendor_view_own" ON public.warehouses
  FOR SELECT TO authenticated
  USING (vendor_id IN (SELECT id FROM public.vendors WHERE owner_user_id = auth.uid()));

CREATE POLICY "warehouses_public_read_active" ON public.warehouses
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

CREATE TRIGGER trg_warehouses_updated_at
  BEFORE UPDATE ON public.warehouses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4. Inventory locations (product × warehouse stock)
CREATE TABLE IF NOT EXISTS public.inventory_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id text NOT NULL,
  warehouse_id uuid NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
  stock integer NOT NULL DEFAULT 0,
  reserved integer NOT NULL DEFAULT 0,
  reorder_point integer DEFAULT 5,
  last_restocked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, warehouse_id)
);

CREATE INDEX idx_invloc_product ON public.inventory_locations(product_id);
CREATE INDEX idx_invloc_warehouse ON public.inventory_locations(warehouse_id);

ALTER TABLE public.inventory_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invloc_admin_manage" ON public.inventory_locations
  FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'store_manager'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'store_manager'::app_role));

CREATE POLICY "invloc_vendor_view_own" ON public.inventory_locations
  FOR SELECT TO authenticated
  USING (warehouse_id IN (
    SELECT w.id FROM public.warehouses w
    JOIN public.vendors v ON v.id = w.vendor_id
    WHERE v.owner_user_id = auth.uid()
  ));

CREATE POLICY "invloc_vendor_update_own" ON public.inventory_locations
  FOR UPDATE TO authenticated
  USING (warehouse_id IN (
    SELECT w.id FROM public.warehouses w
    JOIN public.vendors v ON v.id = w.vendor_id
    WHERE v.owner_user_id = auth.uid()
  ));

CREATE POLICY "invloc_public_read" ON public.inventory_locations
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE TRIGGER trg_invloc_updated_at
  BEFORE UPDATE ON public.inventory_locations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 5. Extend products with fulfillment + vendor link
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS fulfillment_type text NOT NULL DEFAULT 'internal_stock'
    CHECK (fulfillment_type IN ('internal_stock','dropship','restaurant')),
  ADD COLUMN IF NOT EXISTS vendor_id uuid REFERENCES public.vendors(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_products_vendor ON public.products(vendor_id);

-- Vendor can manage their own products
CREATE POLICY "products_vendor_manage_own" ON public.products
  FOR ALL TO authenticated
  USING (vendor_id IN (SELECT id FROM public.vendors WHERE owner_user_id = auth.uid()))
  WITH CHECK (vendor_id IN (SELECT id FROM public.vendors WHERE owner_user_id = auth.uid()));

-- 6. Vendor wallets
CREATE TABLE IF NOT EXISTS public.vendor_wallets (
  vendor_id uuid PRIMARY KEY REFERENCES public.vendors(id) ON DELETE CASCADE,
  available_balance numeric NOT NULL DEFAULT 0,
  pending_balance numeric NOT NULL DEFAULT 0,
  lifetime_earned numeric NOT NULL DEFAULT 0,
  lifetime_paid_out numeric NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.vendor_wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vw_admin_view" ON public.vendor_wallets
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'finance'::app_role));

CREATE POLICY "vw_vendor_view_own" ON public.vendor_wallets
  FOR SELECT TO authenticated
  USING (vendor_id IN (SELECT id FROM public.vendors WHERE owner_user_id = auth.uid()));

CREATE POLICY "vw_admin_manage" ON public.vendor_wallets
  FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role));

-- Auto-create wallet for new vendor
CREATE OR REPLACE FUNCTION public.handle_new_vendor()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  INSERT INTO public.vendor_wallets (vendor_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_handle_new_vendor
  AFTER INSERT ON public.vendors
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_vendor();

-- 7. Vendor payouts (settlement records)
CREATE TABLE IF NOT EXISTS public.vendor_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount > 0),
  method text NOT NULL DEFAULT 'bank_transfer',
  reference text,
  notes text,
  status text NOT NULL DEFAULT 'paid' CHECK (status IN ('pending','paid','failed','reversed')),
  performed_by uuid NOT NULL,
  performed_by_name text,
  period_start date,
  period_end date,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_vpayouts_vendor ON public.vendor_payouts(vendor_id, created_at DESC);

ALTER TABLE public.vendor_payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vp_admin_manage" ON public.vendor_payouts
  FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'finance'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'finance'::app_role));

CREATE POLICY "vp_vendor_view_own" ON public.vendor_payouts
  FOR SELECT TO authenticated
  USING (vendor_id IN (SELECT id FROM public.vendors WHERE owner_user_id = auth.uid()));

-- 8. Helper: vendor ids owned by current user (for portal)
CREATE OR REPLACE FUNCTION public.user_vendor_ids(_user_id uuid)
RETURNS SETOF uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT id FROM public.vendors WHERE owner_user_id = _user_id AND is_active = true;
$$;

-- 9. Vendor portal dashboard stats
CREATE OR REPLACE FUNCTION public.vendor_portal_stats()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE
  _vendor_ids uuid[];
  _products_count int;
  _orders_count int;
  _revenue numeric;
  _wallet jsonb;
BEGIN
  SELECT array_agg(id) INTO _vendor_ids FROM public.vendors WHERE owner_user_id = auth.uid();
  IF _vendor_ids IS NULL OR array_length(_vendor_ids,1) = 0 THEN
    RAISE EXCEPTION 'no_vendor_account';
  END IF;

  SELECT COUNT(*) INTO _products_count FROM public.products
    WHERE vendor_id = ANY(_vendor_ids) AND is_active = true;

  SELECT COUNT(DISTINCT o.id), COALESCE(SUM(oi.price * oi.quantity),0)
    INTO _orders_count, _revenue
  FROM public.order_items oi
  JOIN public.orders o ON o.id = oi.order_id
  JOIN public.products p ON p.id = oi.product_id
  WHERE p.vendor_id = ANY(_vendor_ids)
    AND o.created_at >= now() - interval '30 days'
    AND o.status IN ('paid','completed','delivered','confirmed');

  SELECT jsonb_build_object(
    'available', COALESCE(SUM(available_balance),0),
    'pending',   COALESCE(SUM(pending_balance),0),
    'lifetime_earned', COALESCE(SUM(lifetime_earned),0),
    'lifetime_paid', COALESCE(SUM(lifetime_paid_out),0)
  ) INTO _wallet
  FROM public.vendor_wallets WHERE vendor_id = ANY(_vendor_ids);

  RETURN jsonb_build_object(
    'vendor_ids', _vendor_ids,
    'products_count', _products_count,
    'orders_30d', _orders_count,
    'revenue_30d', _revenue,
    'wallet', _wallet
  );
END; $$;

-- 10. Settle vendor wallet (admin payout action)
CREATE OR REPLACE FUNCTION public.settle_vendor_payout(
  _vendor_id uuid, _amount numeric, _method text, _reference text, _notes text DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _admin uuid := auth.uid(); _admin_name text; _avail numeric; _payout_id uuid;
BEGIN
  IF NOT (has_role(_admin,'admin'::app_role) OR has_role(_admin,'finance'::app_role)) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  IF _amount IS NULL OR _amount <= 0 THEN RAISE EXCEPTION 'invalid_amount'; END IF;

  SELECT available_balance INTO _avail FROM public.vendor_wallets
    WHERE vendor_id = _vendor_id FOR UPDATE;
  IF _avail IS NULL THEN RAISE EXCEPTION 'vendor_wallet_not_found'; END IF;
  IF _avail < _amount THEN RAISE EXCEPTION 'insufficient_vendor_balance'; END IF;

  SELECT full_name INTO _admin_name FROM public.profiles WHERE id = _admin;

  INSERT INTO public.vendor_payouts
    (vendor_id, amount, method, reference, notes, performed_by, performed_by_name, status)
  VALUES (_vendor_id, _amount, _method, _reference, _notes, _admin, _admin_name, 'paid')
  RETURNING id INTO _payout_id;

  UPDATE public.vendor_wallets
    SET available_balance = available_balance - _amount,
        lifetime_paid_out = lifetime_paid_out + _amount,
        updated_at = now()
    WHERE vendor_id = _vendor_id;

  RETURN jsonb_build_object('ok', true, 'payout_id', _payout_id);
END; $$;