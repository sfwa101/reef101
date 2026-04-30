-- ============ 1) SUPPLIERS ============
CREATE TABLE public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_phone TEXT,
  contact_email TEXT,
  address TEXT,
  closing_day INT CHECK (closing_day BETWEEN 1 AND 31),
  collection_days INT[] DEFAULT '{}',
  payment_terms_days INT DEFAULT 30,
  outstanding_balance NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_purchased NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_paid NUMERIC(14,2) NOT NULL DEFAULT 0,
  branch_id UUID REFERENCES public.branches(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "suppliers_admin_finance_all" ON public.suppliers
  FOR ALL USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'finance'::app_role) OR has_role(auth.uid(),'store_manager'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'finance'::app_role) OR has_role(auth.uid(),'store_manager'::app_role));

CREATE TRIGGER trg_suppliers_updated BEFORE UPDATE ON public.suppliers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ 2) PURCHASE INVOICES ============
CREATE TABLE public.purchase_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE RESTRICT,
  branch_id UUID REFERENCES public.branches(id),
  invoice_number TEXT,
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  subtotal NUMERIC(14,2) NOT NULL DEFAULT 0,
  tax NUMERIC(14,2) NOT NULL DEFAULT 0,
  total NUMERIC(14,2) NOT NULL DEFAULT 0,
  paid_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  remaining NUMERIC(14,2) GENERATED ALWAYS AS (total - paid_amount) STORED,
  status TEXT NOT NULL DEFAULT 'open', -- open | partially_paid | paid | cancelled
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.purchase_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "purchase_inv_finance_all" ON public.purchase_invoices
  FOR ALL USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'finance'::app_role) OR has_role(auth.uid(),'store_manager'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'finance'::app_role) OR has_role(auth.uid(),'store_manager'::app_role));

CREATE TRIGGER trg_pinv_updated BEFORE UPDATE ON public.purchase_invoices
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_pinv_supplier ON public.purchase_invoices(supplier_id);
CREATE INDEX idx_pinv_status ON public.purchase_invoices(status);
CREATE INDEX idx_pinv_due ON public.purchase_invoices(due_date);

-- ============ 3) PURCHASE ITEMS ============
CREATE TABLE public.purchase_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.purchase_invoices(id) ON DELETE CASCADE,
  product_id TEXT REFERENCES public.products(id),
  product_name TEXT NOT NULL,
  quantity NUMERIC(14,3) NOT NULL CHECK (quantity > 0),
  unit_cost NUMERIC(14,2) NOT NULL CHECK (unit_cost >= 0),
  line_total NUMERIC(14,2) GENERATED ALWAYS AS (quantity * unit_cost) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.purchase_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "purchase_items_finance_all" ON public.purchase_items
  FOR ALL USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'finance'::app_role) OR has_role(auth.uid(),'store_manager'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'finance'::app_role) OR has_role(auth.uid(),'store_manager'::app_role));

CREATE INDEX idx_pitems_invoice ON public.purchase_items(invoice_id);
CREATE INDEX idx_pitems_product ON public.purchase_items(product_id);

-- ============ 4) WAC + Supplier balance triggers ============
CREATE OR REPLACE FUNCTION public.update_supplier_balance_on_invoice()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.suppliers
      SET outstanding_balance = outstanding_balance + (NEW.total - NEW.paid_amount),
          total_purchased = total_purchased + NEW.total,
          total_paid = total_paid + NEW.paid_amount,
          updated_at = now()
      WHERE id = NEW.supplier_id;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE public.suppliers
      SET outstanding_balance = outstanding_balance
                                 - (OLD.total - OLD.paid_amount)
                                 + (NEW.total - NEW.paid_amount),
          total_purchased = total_purchased - OLD.total + NEW.total,
          total_paid = total_paid - OLD.paid_amount + NEW.paid_amount,
          updated_at = now()
      WHERE id = NEW.supplier_id;
    -- auto status
    IF NEW.paid_amount >= NEW.total AND NEW.total > 0 THEN
      NEW.status := 'paid';
    ELSIF NEW.paid_amount > 0 THEN
      NEW.status := 'partially_paid';
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.suppliers
      SET outstanding_balance = outstanding_balance - (OLD.total - OLD.paid_amount),
          total_purchased = total_purchased - OLD.total,
          total_paid = total_paid - OLD.paid_amount,
          updated_at = now()
      WHERE id = OLD.supplier_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END $$;

CREATE TRIGGER trg_pinv_supplier_balance
  AFTER INSERT OR DELETE ON public.purchase_invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_supplier_balance_on_invoice();

CREATE TRIGGER trg_pinv_supplier_balance_upd
  BEFORE UPDATE ON public.purchase_invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_supplier_balance_on_invoice();

-- WAC: Weighted Average Cost on product when purchase_items inserted
CREATE OR REPLACE FUNCTION public.apply_wac_on_purchase_item()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  _current_stock NUMERIC; _current_cost NUMERIC; _new_cost NUMERIC; _new_stock NUMERIC;
  _inv_total NUMERIC;
BEGIN
  IF NEW.product_id IS NULL THEN RETURN NEW; END IF;

  SELECT COALESCE(stock,0), COALESCE(cost_price,0)
    INTO _current_stock, _current_cost
  FROM public.products WHERE id = NEW.product_id;

  IF NOT FOUND THEN RETURN NEW; END IF;

  _new_stock := _current_stock + NEW.quantity;
  IF _new_stock > 0 THEN
    _new_cost := ROUND(((_current_stock * _current_cost) + (NEW.quantity * NEW.unit_cost)) / _new_stock, 2);
  ELSE
    _new_cost := NEW.unit_cost;
  END IF;

  UPDATE public.products
    SET cost_price = _new_cost,
        stock = stock + NEW.quantity::int,
        updated_at = now()
    WHERE id = NEW.product_id;

  -- recalc invoice subtotal & total
  SELECT COALESCE(SUM(line_total),0) INTO _inv_total
    FROM public.purchase_items WHERE invoice_id = NEW.invoice_id;
  UPDATE public.purchase_invoices
    SET subtotal = _inv_total,
        total = _inv_total + COALESCE(tax,0),
        updated_at = now()
    WHERE id = NEW.invoice_id;

  RETURN NEW;
END $$;

CREATE TRIGGER trg_purchase_item_wac
  AFTER INSERT ON public.purchase_items
  FOR EACH ROW EXECUTE FUNCTION public.apply_wac_on_purchase_item();

-- ============ 5) PRODUCT PARTNERS ============
CREATE TABLE public.product_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  partner_user_id UUID REFERENCES auth.users(id),
  partner_name TEXT NOT NULL,
  partner_phone TEXT,
  split_type TEXT NOT NULL CHECK (split_type IN ('gross_profit','net_profit','revenue')),
  percentage NUMERIC(5,2) NOT NULL CHECK (percentage > 0 AND percentage <= 100),
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.product_partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pp_admin_finance_all" ON public.product_partners
  FOR ALL USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'finance'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'finance'::app_role));

CREATE POLICY "pp_partner_view_own" ON public.product_partners
  FOR SELECT USING (partner_user_id = auth.uid());

CREATE TRIGGER trg_pp_updated BEFORE UPDATE ON public.product_partners
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_pp_product ON public.product_partners(product_id);
CREATE INDEX idx_pp_user ON public.product_partners(partner_user_id);

-- ============ 6) PARTNER LEDGERS ============
CREATE TABLE public.partner_ledgers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.product_partners(id) ON DELETE CASCADE,
  partner_user_id UUID,
  partner_name TEXT NOT NULL,
  product_id TEXT,
  product_name TEXT,
  order_id UUID REFERENCES public.orders(id),
  order_item_id UUID REFERENCES public.order_items(id),
  quantity INT NOT NULL DEFAULT 1,
  revenue NUMERIC(14,2) NOT NULL DEFAULT 0,
  cost NUMERIC(14,2) NOT NULL DEFAULT 0,
  gross_profit NUMERIC(14,2) NOT NULL DEFAULT 0,
  net_profit NUMERIC(14,2) NOT NULL DEFAULT 0,
  split_type TEXT NOT NULL,
  percentage NUMERIC(5,2) NOT NULL,
  amount_due NUMERIC(14,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'accrued', -- accrued | paid | clawed_back
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.partner_ledgers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pl_admin_finance_all" ON public.partner_ledgers
  FOR ALL USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'finance'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'finance'::app_role));

CREATE POLICY "pl_partner_view_own" ON public.partner_ledgers
  FOR SELECT USING (partner_user_id = auth.uid());

CREATE INDEX idx_pl_partner ON public.partner_ledgers(partner_id);
CREATE INDEX idx_pl_status ON public.partner_ledgers(status);
CREATE INDEX idx_pl_order ON public.partner_ledgers(order_id);

-- Partner accrual on order delivered
CREATE OR REPLACE FUNCTION public.accrue_partner_splits_on_delivered()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _it record; _pt record; _rev numeric; _cost numeric; _gp numeric; _np numeric; _amt numeric;
BEGIN
  IF NEW.status = 'delivered' AND OLD.status IS DISTINCT FROM 'delivered' THEN
    FOR _it IN
      SELECT oi.*, p.cost_price, p.packaging_cost, p.affiliate_commission_pct
      FROM public.order_items oi
      LEFT JOIN public.products p ON p.id = oi.product_id
      WHERE oi.order_id = NEW.id
    LOOP
      FOR _pt IN
        SELECT * FROM public.product_partners
         WHERE product_id = _it.product_id AND is_active = true
      LOOP
        _rev := _it.price * _it.quantity;
        _cost := (COALESCE(_it.cost_price,0) + COALESCE(_it.packaging_cost,0)) * _it.quantity;
        _gp := _rev - _cost;
        _np := _gp - (_rev * COALESCE(_it.affiliate_commission_pct,0)/100.0);

        IF _pt.split_type = 'revenue' THEN
          _amt := _rev * _pt.percentage / 100.0;
        ELSIF _pt.split_type = 'gross_profit' THEN
          _amt := GREATEST(0, _gp) * _pt.percentage / 100.0;
        ELSE -- net_profit
          _amt := GREATEST(0, _np) * _pt.percentage / 100.0;
        END IF;

        IF _amt > 0 THEN
          INSERT INTO public.partner_ledgers
            (partner_id, partner_user_id, partner_name, product_id, product_name,
             order_id, order_item_id, quantity, revenue, cost, gross_profit, net_profit,
             split_type, percentage, amount_due, status)
          VALUES
            (_pt.id, _pt.partner_user_id, _pt.partner_name, _it.product_id, _it.product_name,
             NEW.id, _it.id, _it.quantity, _rev, _cost, _gp, _np,
             _pt.split_type, _pt.percentage, ROUND(_amt,2), 'accrued');
        END IF;
      END LOOP;
    END LOOP;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_accrue_partner_splits
  AFTER UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.accrue_partner_splits_on_delivered();

-- ============ 7) DAILY EXPENSES ============
CREATE TABLE public.daily_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID REFERENCES public.branches(id),
  category TEXT NOT NULL CHECK (category IN ('operations','salaries','employee_advance','damages','personal_drawings','utilities','rent','marketing','transport','other')),
  subcategory TEXT,
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  paid_to TEXT,
  payment_method TEXT, -- cash | bank_transfer | wallet
  reference TEXT,
  receipt_url TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.daily_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "exp_admin_finance_all" ON public.daily_expenses
  FOR ALL USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'finance'::app_role) OR has_role(auth.uid(),'store_manager'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'finance'::app_role) OR has_role(auth.uid(),'store_manager'::app_role));

CREATE TRIGGER trg_exp_updated BEFORE UPDATE ON public.daily_expenses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_exp_date ON public.daily_expenses(expense_date);
CREATE INDEX idx_exp_category ON public.daily_expenses(category);

-- ============ 8) CHARITY RULES & LEDGER ============
CREATE TABLE public.charity_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  base TEXT NOT NULL CHECK (base IN ('gross_sales','net_profit','custom_amount')),
  percentage NUMERIC(5,2),
  fixed_amount NUMERIC(14,2),
  frequency TEXT NOT NULL CHECK (frequency IN ('daily','weekly','monthly')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.charity_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "charity_rules_admin_finance" ON public.charity_rules
  FOR ALL USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'finance'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'finance'::app_role));

CREATE TRIGGER trg_charity_rules_upd BEFORE UPDATE ON public.charity_rules
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.charity_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID REFERENCES public.charity_rules(id) ON DELETE SET NULL,
  rule_name TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  base_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  due_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'due', -- due | paid
  paid_at TIMESTAMPTZ,
  paid_to TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.charity_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "charity_ledger_admin_finance" ON public.charity_ledger
  FOR ALL USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'finance'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'finance'::app_role));

-- Compute charity dues for a date range
CREATE OR REPLACE FUNCTION public.compute_charity_dues(_start DATE, _end DATE)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE _r record; _gross numeric; _np numeric; _base numeric; _due numeric; _out jsonb := '[]'::jsonb;
BEGIN
  IF NOT (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'finance'::app_role)) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT COALESCE(SUM(total),0) INTO _gross
  FROM public.orders
  WHERE created_at::date BETWEEN _start AND _end
    AND status IN ('paid','completed','delivered','confirmed');

  SELECT COALESCE(SUM(oi.price * oi.quantity - COALESCE(p.cost_price, p.price*0.7) * oi.quantity), 0)
    INTO _np
  FROM public.order_items oi
  JOIN public.orders o ON o.id = oi.order_id
  LEFT JOIN public.products p ON p.id = oi.product_id
  WHERE o.created_at::date BETWEEN _start AND _end
    AND o.status IN ('paid','completed','delivered','confirmed');

  FOR _r IN SELECT * FROM public.charity_rules WHERE is_active = true LOOP
    IF _r.base = 'gross_sales' THEN _base := _gross;
    ELSIF _r.base = 'net_profit' THEN _base := GREATEST(0,_np);
    ELSE _base := 0;
    END IF;

    IF _r.base = 'custom_amount' THEN
      _due := COALESCE(_r.fixed_amount, 0);
    ELSE
      _due := ROUND(_base * COALESCE(_r.percentage,0) / 100.0, 2);
    END IF;

    _out := _out || jsonb_build_object(
      'rule_id', _r.id,
      'rule_name', _r.name,
      'base', _r.base,
      'frequency', _r.frequency,
      'percentage', _r.percentage,
      'base_amount', _base,
      'due_amount', _due
    );
  END LOOP;

  RETURN jsonb_build_object('start', _start, 'end', _end, 'gross_sales', _gross, 'net_profit', _np, 'rules', _out);
END $$;

-- ============ 9) HAKIM AI INSIGHTS ============
CREATE TABLE public.hakim_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind TEXT NOT NULL CHECK (kind IN ('daily','weekly','on_demand')),
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info','warning','critical','success')),
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  recommendations JSONB DEFAULT '[]'::jsonb,
  raw_snapshot JSONB,
  generated_for_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.hakim_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hakim_admin_finance_all" ON public.hakim_insights
  FOR ALL USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'finance'::app_role) OR has_role(auth.uid(),'store_manager'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'finance'::app_role) OR has_role(auth.uid(),'store_manager'::app_role));

CREATE INDEX idx_hakim_kind_date ON public.hakim_insights(kind, generated_for_date DESC);

-- ============ 10) FINANCIAL SNAPSHOT FUNCTION (for Hakim) ============
CREATE OR REPLACE FUNCTION public.financial_snapshot(_days INT DEFAULT 7)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE
  _orders_count int; _gross numeric; _items_revenue numeric; _items_cost numeric; _net numeric;
  _expenses_total numeric; _expenses_by_cat jsonb;
  _suppliers_due numeric; _suppliers_due_week numeric;
  _wallet_liab numeric; _partner_due numeric;
  _stagnant jsonb; _low_stock int; _eroded jsonb;
BEGIN
  IF NOT (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'finance'::app_role) OR has_role(auth.uid(),'store_manager'::app_role)) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT COUNT(*), COALESCE(SUM(total),0) INTO _orders_count, _gross
  FROM public.orders
  WHERE created_at >= now() - (_days || ' days')::interval
    AND status IN ('paid','completed','delivered','confirmed');

  SELECT COALESCE(SUM(oi.price * oi.quantity),0),
         COALESCE(SUM(COALESCE(p.cost_price, p.price*0.7) * oi.quantity),0)
    INTO _items_revenue, _items_cost
  FROM public.order_items oi
  JOIN public.orders o ON o.id = oi.order_id
  LEFT JOIN public.products p ON p.id = oi.product_id
  WHERE o.created_at >= now() - (_days || ' days')::interval
    AND o.status IN ('paid','completed','delivered','confirmed');

  _net := _items_revenue - _items_cost;

  SELECT COALESCE(SUM(amount),0) INTO _expenses_total
    FROM public.daily_expenses
    WHERE expense_date >= CURRENT_DATE - (_days || ' days')::interval;

  SELECT COALESCE(jsonb_object_agg(category, total),'{}'::jsonb) INTO _expenses_by_cat
    FROM (
      SELECT category, SUM(amount)::numeric AS total
      FROM public.daily_expenses
      WHERE expense_date >= CURRENT_DATE - (_days || ' days')::interval
      GROUP BY category
    ) e;

  SELECT COALESCE(SUM(outstanding_balance),0) INTO _suppliers_due FROM public.suppliers WHERE is_active=true;

  SELECT COALESCE(SUM(remaining),0) INTO _suppliers_due_week
    FROM public.purchase_invoices
    WHERE status IN ('open','partially_paid')
      AND due_date IS NOT NULL
      AND due_date <= CURRENT_DATE + INTERVAL '7 days';

  SELECT COALESCE(SUM(balance),0) INTO _wallet_liab FROM public.wallet_balances;

  SELECT COALESCE(SUM(amount_due),0) INTO _partner_due
    FROM public.partner_ledgers WHERE status='accrued';

  -- stagnant: products with 0 sales in last 30 days
  SELECT COALESCE(jsonb_agg(row_to_json(t)),'[]'::jsonb) INTO _stagnant FROM (
    SELECT p.id, p.name, p.stock, p.price
    FROM public.products p
    LEFT JOIN public.order_items oi ON oi.product_id = p.id
      AND oi.created_at >= now() - interval '30 days'
    WHERE p.is_active = true AND p.stock > 0
    GROUP BY p.id, p.name, p.stock, p.price
    HAVING COUNT(oi.id) = 0
    ORDER BY p.stock DESC
    LIMIT 10
  ) t;

  SELECT COUNT(*) INTO _low_stock FROM public.products WHERE is_active=true AND stock <= 5;

  SELECT COALESCE(jsonb_agg(row_to_json(t)),'[]'::jsonb) INTO _eroded FROM (
    SELECT id, name, selling_price, cost_price,
      CASE WHEN selling_price>0 THEN
        round(((selling_price - COALESCE(cost_price,0) - COALESCE(packaging_cost,0))/selling_price)*100,2)
      ELSE 0 END AS margin_pct
    FROM public.products
    WHERE is_active=true AND cost_price IS NOT NULL AND cost_price > 0
      AND (selling_price - cost_price - COALESCE(packaging_cost,0)) < (cost_price + COALESCE(packaging_cost,0)) * 0.15
    ORDER BY margin_pct ASC LIMIT 10
  ) t;

  RETURN jsonb_build_object(
    'period_days', _days,
    'sales', jsonb_build_object('orders', _orders_count, 'gross', _gross, 'items_revenue', _items_revenue, 'items_cost', _items_cost, 'net_profit', _net),
    'expenses', jsonb_build_object('total', _expenses_total, 'by_category', _expenses_by_cat),
    'liabilities', jsonb_build_object(
      'suppliers_outstanding', _suppliers_due,
      'suppliers_due_within_week', _suppliers_due_week,
      'wallet_balances', _wallet_liab,
      'partners_accrued', _partner_due
    ),
    'inventory', jsonb_build_object(
      'low_stock_count', _low_stock,
      'stagnant_products', _stagnant,
      'eroded_margin_products', _eroded
    ),
    'generated_at', now()
  );
END $$;

-- payments schedule helper
CREATE OR REPLACE FUNCTION public.payments_schedule(_days_ahead INT DEFAULT 14)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NOT (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'finance'::app_role) OR has_role(auth.uid(),'store_manager'::app_role)) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  RETURN COALESCE((
    SELECT jsonb_agg(row_to_json(t) ORDER BY t.due_date ASC)
    FROM (
      SELECT pi.id, pi.invoice_number, pi.invoice_date, pi.due_date,
             pi.total, pi.paid_amount, pi.remaining, pi.status,
             s.id AS supplier_id, s.name AS supplier_name, s.closing_day, s.collection_days
      FROM public.purchase_invoices pi
      JOIN public.suppliers s ON s.id = pi.supplier_id
      WHERE pi.status IN ('open','partially_paid')
        AND pi.remaining > 0
        AND (pi.due_date IS NULL OR pi.due_date <= CURRENT_DATE + (_days_ahead || ' days')::interval)
      ORDER BY pi.due_date NULLS LAST
    ) t
  ), '[]'::jsonb);
END $$;