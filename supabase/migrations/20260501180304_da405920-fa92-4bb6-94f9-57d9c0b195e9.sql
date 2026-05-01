
-- Phase 23: Procurement Engine — atomic invoice + MAC recalc
CREATE OR REPLACE FUNCTION public.submit_purchase_invoice(
  _supplier_id UUID,
  _items JSONB,
  _total_amount NUMERIC,
  _invoice_number TEXT DEFAULT NULL,
  _invoice_date DATE DEFAULT CURRENT_DATE,
  _paid_amount NUMERIC DEFAULT 0,
  _tax NUMERIC DEFAULT 0,
  _notes TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid UUID := auth.uid();
  _invoice_id UUID;
  _item JSONB;
  _pid TEXT;
  _qty NUMERIC;
  _unit_cost NUMERIC;
  _old_stock INT;
  _old_cost NUMERIC;
  _new_cost NUMERIC;
  _new_stock INT;
  _subtotal NUMERIC := 0;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'unauthorized'; END IF;
  IF NOT (
       has_role(_uid,'admin'::app_role)
    OR has_role(_uid,'finance'::app_role)
    OR has_role(_uid,'store_manager'::app_role)
  ) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  IF _supplier_id IS NULL THEN RAISE EXCEPTION 'supplier_required'; END IF;
  IF _items IS NULL OR jsonb_typeof(_items) <> 'array' OR jsonb_array_length(_items) = 0 THEN
    RAISE EXCEPTION 'items_required';
  END IF;
  IF _total_amount IS NULL OR _total_amount < 0 THEN
    RAISE EXCEPTION 'invalid_total';
  END IF;

  -- Compute subtotal from items
  FOR _item IN SELECT * FROM jsonb_array_elements(_items) LOOP
    _qty := COALESCE((_item->>'quantity')::NUMERIC, 0);
    _unit_cost := COALESCE((_item->>'unit_cost')::NUMERIC, 0);
    IF _qty <= 0 OR _unit_cost < 0 THEN
      RAISE EXCEPTION 'invalid_line (qty=%, cost=%)', _qty, _unit_cost;
    END IF;
    _subtotal := _subtotal + (_qty * _unit_cost);
  END LOOP;

  -- 1) Create invoice header
  INSERT INTO public.purchase_invoices (
    supplier_id, invoice_number, invoice_date,
    subtotal, tax, total, paid_amount, notes, created_by, status
  ) VALUES (
    _supplier_id, _invoice_number, _invoice_date,
    _subtotal, COALESCE(_tax,0), _total_amount,
    COALESCE(_paid_amount,0), _notes, _uid, 'received'
  ) RETURNING id INTO _invoice_id;

  -- 2) Insert items + recalc Moving Average Cost
  FOR _item IN SELECT * FROM jsonb_array_elements(_items) LOOP
    _pid := _item->>'product_id';
    _qty := COALESCE((_item->>'quantity')::NUMERIC, 0);
    _unit_cost := COALESCE((_item->>'unit_cost')::NUMERIC, 0);

    INSERT INTO public.purchase_items (
      invoice_id, product_id, product_name, quantity, unit_cost, line_total
    ) VALUES (
      _invoice_id, _pid, COALESCE(_item->>'product_name',''),
      _qty, _unit_cost, _qty * _unit_cost
    );

    IF _pid IS NOT NULL AND _pid <> '' THEN
      SELECT COALESCE(stock,0), COALESCE(cost_price,0)
        INTO _old_stock, _old_cost
        FROM public.products WHERE id = _pid;

      IF FOUND THEN
        _new_stock := COALESCE(_old_stock,0) + _qty::INT;
        IF _new_stock > 0 THEN
          _new_cost := ((COALESCE(_old_stock,0) * COALESCE(_old_cost,0))
                       + (_qty * _unit_cost)) / _new_stock;
        ELSE
          _new_cost := _unit_cost;
        END IF;

        UPDATE public.products
           SET stock = _new_stock,
               cost_price = ROUND(_new_cost::NUMERIC, 4),
               updated_at = now()
         WHERE id = _pid;
      END IF;
    END IF;
  END LOOP;

  -- 3) Update supplier balances
  UPDATE public.suppliers
     SET total_purchased = COALESCE(total_purchased,0) + _total_amount,
         outstanding_balance = COALESCE(outstanding_balance,0)
                              + (_total_amount - COALESCE(_paid_amount,0)),
         total_paid = COALESCE(total_paid,0) + COALESCE(_paid_amount,0),
         updated_at = now()
   WHERE id = _supplier_id;

  RETURN jsonb_build_object(
    'ok', true,
    'invoice_id', _invoice_id,
    'subtotal', _subtotal,
    'total', _total_amount
  );
END $$;

REVOKE ALL ON FUNCTION public.submit_purchase_invoice(UUID, JSONB, NUMERIC, TEXT, DATE, NUMERIC, NUMERIC, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_purchase_invoice(UUID, JSONB, NUMERIC, TEXT, DATE, NUMERIC, NUMERIC, TEXT) TO authenticated;
