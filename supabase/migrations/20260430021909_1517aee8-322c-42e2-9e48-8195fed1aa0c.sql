-- Smart Order Allocation Engine
-- Splits orders across nearest warehouses (by zone+priority) with stock reservation

-- 1. Allocation result type & helper view
CREATE OR REPLACE FUNCTION public.find_allocation_warehouse(
  _product_id text,
  _qty integer,
  _zone text
) RETURNS TABLE(warehouse_id uuid, available_stock integer, priority integer, warehouse_type text, vendor_id uuid)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT w.id, (il.stock - il.reserved)::int AS available_stock, w.priority, w.warehouse_type, w.vendor_id
  FROM public.inventory_locations il
  JOIN public.warehouses w ON w.id = il.warehouse_id
  WHERE il.product_id = _product_id
    AND w.is_active = true
    AND (_zone = ANY(w.served_zones) OR array_length(w.served_zones, 1) IS NULL)
    AND (il.stock - il.reserved) >= _qty
  ORDER BY 
    CASE WHEN _zone = ANY(w.served_zones) THEN 0 ELSE 1 END,
    w.priority ASC,
    available_stock DESC
  LIMIT 1;
$$;

-- 2. Main allocation function: splits order into sub_orders + reserves stock
CREATE OR REPLACE FUNCTION public.allocate_order_inventory(
  _order_id uuid,
  _zone text DEFAULT 'M'
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _item record;
  _wh record;
  _sub_order_id uuid;
  _store_id uuid;
  _sub_orders_map jsonb := '{}'::jsonb;
  _key text;
  _allocated_count int := 0;
  _failed jsonb := '[]'::jsonb;
  _order_user uuid;
BEGIN
  SELECT user_id INTO _order_user FROM public.orders WHERE id = _order_id;
  IF _order_user IS NULL THEN RAISE EXCEPTION 'order_not_found'; END IF;
  IF auth.uid() IS NULL OR (auth.uid() <> _order_user AND NOT is_staff(auth.uid())) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  FOR _item IN
    SELECT oi.id, oi.product_id, oi.quantity, oi.product_name, p.vendor_id, p.store_id, p.fulfillment_type
    FROM public.order_items oi
    LEFT JOIN public.products p ON p.id = oi.product_id
    WHERE oi.order_id = _order_id AND oi.sub_order_id IS NULL
  LOOP
    SELECT * INTO _wh FROM public.find_allocation_warehouse(_item.product_id, _item.quantity, _zone);

    IF _wh.warehouse_id IS NULL THEN
      _failed := _failed || jsonb_build_object(
        'product_id', _item.product_id,
        'product_name', _item.product_name,
        'quantity', _item.quantity,
        'reason', 'no_warehouse_with_stock'
      );
      CONTINUE;
    END IF;

    -- Group sub_orders by (warehouse_id, vendor_id) — store_id derived from vendor or item
    _key := _wh.warehouse_id::text || ':' || COALESCE(_wh.vendor_id::text, 'internal');
    _store_id := COALESCE(_item.store_id, (
      SELECT id FROM public.stores WHERE owner_user_id IS NULL AND type='internal' AND is_active=true LIMIT 1
    ));

    IF _store_id IS NULL THEN
      INSERT INTO public.stores (name, slug, type, is_active)
      VALUES ('المخزن الرئيسي', 'main-internal', 'internal', true)
      ON CONFLICT (slug) DO NOTHING
      RETURNING id INTO _store_id;
      IF _store_id IS NULL THEN
        SELECT id INTO _store_id FROM public.stores WHERE slug='main-internal' LIMIT 1;
      END IF;
    END IF;

    IF NOT (_sub_orders_map ? _key) THEN
      INSERT INTO public.sub_orders (order_id, store_id, status, total, notes)
      VALUES (_order_id, _store_id, 'pending', 0,
              'مخزن: ' || (SELECT name FROM public.warehouses WHERE id = _wh.warehouse_id))
      RETURNING id INTO _sub_order_id;
      _sub_orders_map := _sub_orders_map || jsonb_build_object(_key, _sub_order_id::text);
    ELSE
      _sub_order_id := (_sub_orders_map ->> _key)::uuid;
    END IF;

    -- Link order_item to sub_order
    UPDATE public.order_items SET sub_order_id = _sub_order_id WHERE id = _item.id;

    -- Reserve stock
    UPDATE public.inventory_locations
      SET reserved = reserved + _item.quantity, updated_at = now()
      WHERE warehouse_id = _wh.warehouse_id AND product_id = _item.product_id;

    _allocated_count := _allocated_count + 1;
  END LOOP;

  -- Update sub_order totals
  UPDATE public.sub_orders so
    SET total = COALESCE((SELECT SUM(oi.price * oi.quantity)
                          FROM public.order_items oi WHERE oi.sub_order_id = so.id), 0)
    WHERE so.order_id = _order_id;

  RETURN jsonb_build_object(
    'ok', true,
    'allocated_items', _allocated_count,
    'sub_orders_created', jsonb_object_keys(_sub_orders_map),
    'failed_items', _failed,
    'zone', _zone
  );
END; $$;

-- 3. Release reservations (e.g., on cancel)
CREATE OR REPLACE FUNCTION public.release_order_reservation(_order_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _released int := 0; _r record;
BEGIN
  IF NOT (is_staff(auth.uid()) OR EXISTS (SELECT 1 FROM public.orders WHERE id=_order_id AND user_id=auth.uid())) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  FOR _r IN
    SELECT oi.product_id, oi.quantity, so.notes, so.id AS sub_id
    FROM public.order_items oi
    JOIN public.sub_orders so ON so.id = oi.sub_order_id
    WHERE oi.order_id = _order_id
  LOOP
    -- Find warehouse from sub_order notes (or use any warehouse with reservation)
    UPDATE public.inventory_locations il
      SET reserved = GREATEST(0, reserved - _r.quantity), updated_at = now()
      WHERE il.product_id = _r.product_id
        AND il.reserved >= _r.quantity
        AND il.warehouse_id = (
          SELECT w.id FROM public.warehouses w 
          WHERE _r.notes LIKE '%' || w.name || '%' LIMIT 1
        );
    _released := _released + 1;
  END LOOP;

  RETURN jsonb_build_object('ok', true, 'released_items', _released);
END; $$;

-- 4. Commit reservation → actual stock decrement (on delivery)
CREATE OR REPLACE FUNCTION public.commit_sub_order_stock(_sub_order_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _r record; _committed int := 0; _wh_id uuid;
BEGIN
  IF NOT is_staff(auth.uid()) THEN RAISE EXCEPTION 'forbidden'; END IF;

  SELECT w.id INTO _wh_id
  FROM public.sub_orders so, public.warehouses w
  WHERE so.id = _sub_order_id AND so.notes LIKE '%' || w.name || '%' LIMIT 1;

  IF _wh_id IS NULL THEN RAISE EXCEPTION 'warehouse_not_found_in_sub_order'; END IF;

  FOR _r IN SELECT product_id, quantity FROM public.order_items WHERE sub_order_id = _sub_order_id
  LOOP
    UPDATE public.inventory_locations
      SET stock = GREATEST(0, stock - _r.quantity),
          reserved = GREATEST(0, reserved - _r.quantity),
          updated_at = now()
      WHERE warehouse_id = _wh_id AND product_id = _r.product_id;
    _committed := _committed + 1;
  END LOOP;

  RETURN jsonb_build_object('ok', true, 'committed', _committed);
END; $$;

-- 5. Allocation overview for admin
CREATE OR REPLACE FUNCTION public.allocation_overview(_order_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE _result jsonb;
BEGIN
  IF NOT is_staff(auth.uid()) THEN RAISE EXCEPTION 'forbidden'; END IF;

  SELECT jsonb_agg(jsonb_build_object(
    'sub_order_id', so.id,
    'status', so.status,
    'total', so.total,
    'notes', so.notes,
    'items', (
      SELECT jsonb_agg(jsonb_build_object(
        'product_name', oi.product_name,
        'quantity', oi.quantity,
        'price', oi.price
      )) FROM public.order_items oi WHERE oi.sub_order_id = so.id
    )
  )) INTO _result
  FROM public.sub_orders so WHERE so.order_id = _order_id;

  RETURN COALESCE(_result, '[]'::jsonb);
END; $$;