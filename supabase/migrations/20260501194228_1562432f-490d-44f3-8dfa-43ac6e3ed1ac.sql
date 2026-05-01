CREATE OR REPLACE FUNCTION public.place_order_atomic(
  _user_id UUID,
  _total NUMERIC,
  _payment_method TEXT,
  _address_id UUID,
  _notes TEXT,
  _service_type TEXT,
  _delivery_zone TEXT,
  _items JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id UUID;
  v_item JSONB;
  v_product_id TEXT;
  v_qty INTEGER;
  v_stock INTEGER;
  v_admin_id UUID;
BEGIN
  -- Authorization: caller must be the order owner
  IF auth.uid() IS NULL OR auth.uid() <> _user_id THEN
    RAISE EXCEPTION 'unauthorized' USING ERRCODE = '42501';
  END IF;

  IF _items IS NULL OR jsonb_array_length(_items) = 0 THEN
    RAISE EXCEPTION 'empty_cart' USING ERRCODE = '22023';
  END IF;

  -- Lock product rows and validate stock for all items first
  FOR v_item IN SELECT * FROM jsonb_array_elements(_items) LOOP
    v_product_id := v_item->>'product_id';
    v_qty := COALESCE((v_item->>'quantity')::INTEGER, 0);

    IF v_qty <= 0 THEN
      RAISE EXCEPTION 'invalid_quantity:%', v_product_id USING ERRCODE = '22023';
    END IF;

    SELECT stock INTO v_stock
      FROM public.products
     WHERE id = v_product_id
     FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'product_not_found:%', v_product_id USING ERRCODE = '02000';
    END IF;

    -- Skip stock check for products with stock = -1 (unlimited / made-to-order)
    IF v_stock >= 0 AND v_stock < v_qty THEN
      RAISE EXCEPTION 'out_of_stock:%', v_product_id USING ERRCODE = '23514';
    END IF;
  END LOOP;

  -- Insert the order
  INSERT INTO public.orders (
    user_id, total, payment_method, address_id, status, whatsapp_sent,
    notes, service_type, delivery_zone
  ) VALUES (
    _user_id, _total, _payment_method, _address_id, 'pending', true,
    _notes, COALESCE(_service_type, 'delivery'), _delivery_zone
  )
  RETURNING id INTO v_order_id;

  -- Insert order items + deduct stock
  FOR v_item IN SELECT * FROM jsonb_array_elements(_items) LOOP
    v_product_id := v_item->>'product_id';
    v_qty := (v_item->>'quantity')::INTEGER;

    INSERT INTO public.order_items (
      order_id, product_id, product_name, product_image, price, quantity
    ) VALUES (
      v_order_id,
      v_product_id,
      v_item->>'product_name',
      v_item->>'product_image',
      (v_item->>'price')::NUMERIC,
      v_qty
    );

    -- Deduct stock only when tracked (>=0)
    UPDATE public.products
       SET stock = stock - v_qty
     WHERE id = v_product_id
       AND stock >= 0;
  END LOOP;

  -- Notify admins (staff) about the new order
  FOR v_admin_id IN
    SELECT user_id FROM public.user_roles WHERE role IN ('admin','manager')
  LOOP
    INSERT INTO public.notifications (user_id, title, body, icon)
    VALUES (
      v_admin_id,
      'طلب جديد',
      'تم استلام طلب جديد بقيمة ' || _total::text || ' ج.م',
      'shopping-bag'
    );
  END LOOP;

  RETURN v_order_id;
END;
$$;

REVOKE ALL ON FUNCTION public.place_order_atomic(UUID, NUMERIC, TEXT, UUID, TEXT, TEXT, TEXT, JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.place_order_atomic(UUID, NUMERIC, TEXT, UUID, TEXT, TEXT, TEXT, JSONB) TO authenticated;