
-- Helper: is_driver
CREATE OR REPLACE FUNCTION public.is_driver(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.drivers d
    WHERE d.user_id = _user_id AND d.is_active = true
  )
$$;

-- Index to keep vendor-scoped reads on order_items fast
CREATE INDEX IF NOT EXISTS order_items_store_id_idx
  ON public.order_items (store_id);

-- =========================================================
-- ORDERS: vendor + driver scoped SELECT
-- =========================================================
DROP POLICY IF EXISTS "Vendors view orders containing their store items" ON public.orders;
CREATE POLICY "Vendors view orders containing their store items"
ON public.orders
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.order_items oi
    WHERE oi.order_id = orders.id
      AND oi.store_id IN (SELECT public.user_store_ids(auth.uid()))
  )
);

DROP POLICY IF EXISTS "Drivers view orders assigned to them" ON public.orders;
CREATE POLICY "Drivers view orders assigned to them"
ON public.orders
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.delivery_tasks dt
    JOIN public.drivers d ON d.id = dt.driver_id
    WHERE dt.order_id = orders.id
      AND d.user_id = auth.uid()
  )
);

-- =========================================================
-- ORDER_ITEMS: vendor + driver scoped SELECT
-- =========================================================
DROP POLICY IF EXISTS "Vendors view their store order items" ON public.order_items;
CREATE POLICY "Vendors view their store order items"
ON public.order_items
FOR SELECT
TO authenticated
USING (
  store_id IS NOT NULL
  AND store_id IN (SELECT public.user_store_ids(auth.uid()))
);

DROP POLICY IF EXISTS "Vendors update their store order items" ON public.order_items;
CREATE POLICY "Vendors update their store order items"
ON public.order_items
FOR UPDATE
TO authenticated
USING (
  store_id IS NOT NULL
  AND store_id IN (SELECT public.user_store_ids(auth.uid()))
)
WITH CHECK (
  store_id IS NOT NULL
  AND store_id IN (SELECT public.user_store_ids(auth.uid()))
);

DROP POLICY IF EXISTS "Drivers view items of assigned orders" ON public.order_items;
CREATE POLICY "Drivers view items of assigned orders"
ON public.order_items
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.delivery_tasks dt
    JOIN public.drivers d ON d.id = dt.driver_id
    WHERE dt.order_id = order_items.order_id
      AND d.user_id = auth.uid()
  )
);

-- =========================================================
-- SUB_ORDERS: driver scoped SELECT
-- =========================================================
DROP POLICY IF EXISTS "Drivers view sub_orders of assigned orders" ON public.sub_orders;
CREATE POLICY "Drivers view sub_orders of assigned orders"
ON public.sub_orders
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.delivery_tasks dt
    JOIN public.drivers d ON d.id = dt.driver_id
    WHERE dt.order_id = sub_orders.order_id
      AND d.user_id = auth.uid()
  )
);
