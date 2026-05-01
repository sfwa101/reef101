import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import type { VendorLiveOrderItem, VendorProduct } from "../types/vendor-ops.types";

const READY_KEY = "vendor.readyItems.v1";

const loadReady = (): Record<string, true> => {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(READY_KEY) || "{}"); } catch { return {}; }
};
const saveReady = (m: Record<string, true>) => {
  try { localStorage.setItem(READY_KEY, JSON.stringify(m)); } catch { /* noop */ }
};

const ACTIVE_STATUSES = new Set(["pending", "confirmed", "preparing", "ready", "out_for_delivery"]);

/**
 * Vendor Operational Hook (Phase 16)
 * - Subscribes to vendor's products and order_items in real-time.
 * - Provides stock/active toggle and a local "Mark Ready" pulse (no schema changes).
 */
export function useVendorOperations() {
  const { user } = useAuth();
  const [vendorIds, setVendorIds] = useState<string[]>([]);
  const [products, setProducts] = useState<VendorProduct[]>([]);
  const [items, setItems] = useState<VendorLiveOrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const readyRef = useRef<Record<string, true>>(loadReady());
  const productIdsRef = useRef<Set<string>>(new Set());

  // Load vendor account ids
  useEffect(() => {
    if (!user) { setVendorIds([]); return; }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).rpc("user_vendor_ids", { _user_id: user.id }).then(({ data, error }: { data: string[]; error: { message: string } | null }) => {
      if (error) { setError(error.message); return; }
      setVendorIds(data ?? []);
    });
  }, [user]);

  const refreshProducts = useCallback(async () => {
    if (vendorIds.length === 0) { setProducts([]); productIdsRef.current = new Set(); return; }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("products")
      .select("id,vendor_id,name,price,stock,is_active,image_url,image,category")
      .in("vendor_id", vendorIds)
      .order("name");
    if (error) { setError(error.message); return; }
    const rows = (data ?? []) as VendorProduct[];
    setProducts(rows);
    productIdsRef.current = new Set(rows.map(r => r.id));
  }, [vendorIds]);

  const refreshLiveItems = useCallback(async () => {
    if (vendorIds.length === 0) { setItems([]); return; }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("order_items")
      .select("id,order_id,product_id,product_name,product_image,quantity,price,created_at, products!inner(vendor_id), orders!inner(status,service_type,payment_method)")
      .in("products.vendor_id", vendorIds)
      .in("orders.status", Array.from(ACTIVE_STATUSES))
      .order("created_at", { ascending: false })
      .limit(80);
    if (error) { setError(error.message); return; }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = (data ?? []).map((r: any): VendorLiveOrderItem => ({
      id: r.id,
      order_id: r.order_id,
      product_id: r.product_id,
      product_name: r.product_name,
      product_image: r.product_image,
      quantity: r.quantity,
      price: Number(r.price),
      created_at: r.created_at,
      order_status: r.orders?.status ?? "pending",
      service_type: r.orders?.service_type ?? "delivery",
      payment_method: r.orders?.payment_method ?? null,
      ready: !!readyRef.current[r.id],
    }));
    setItems(rows);
  }, [vendorIds]);

  // Initial load
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      await Promise.all([refreshProducts(), refreshLiveItems()]);
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [refreshProducts, refreshLiveItems]);

  // Realtime subscriptions
  useEffect(() => {
    if (vendorIds.length === 0) return;
    const ch = supabase
      .channel(`vendor-ops-${vendorIds.join("-")}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "order_items" }, (payload) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const row = (payload.new ?? payload.old) as any;
        if (!row?.product_id || !productIdsRef.current.has(row.product_id)) return;
        refreshLiveItems();
        if (payload.eventType === "INSERT") {
          toast.success("طلب جديد لمنتجاتك", { description: row.product_name });
        }
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders" }, () => {
        refreshLiveItems();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, (payload) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const row = (payload.new ?? payload.old) as any;
        if (!row?.vendor_id || !vendorIds.includes(row.vendor_id)) return;
        refreshProducts();
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [vendorIds, refreshLiveItems, refreshProducts]);

  /** Update product stock & active flag. Authorized via RLS on products (vendor_id == auth.uid mapping). */
  const updateProductStock = useCallback(async (productId: string, newQty: number, isActive: boolean) => {
    // optimistic
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, stock: newQty, is_active: isActive } : p));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("products")
      .update({ stock: newQty, is_active: isActive })
      .eq("id", productId);
    if (error) {
      toast.error("تعذّر تحديث المنتج", { description: error.message });
      await refreshProducts();
      return false;
    }
    toast.success("تم التحديث");
    return true;
  }, [refreshProducts]);

  /** Mark an order item as "Ready". Local-only (no schema change). Persists per-device. */
  const markOrderItemReady = useCallback(async (orderItemId: string) => {
    readyRef.current = { ...readyRef.current, [orderItemId]: true };
    saveReady(readyRef.current);
    setItems(prev => prev.map(i => i.id === orderItemId ? { ...i, ready: true } : i));
    toast.success("تم تجهيز الطلب");
    return true;
  }, []);

  const undoReady = useCallback((orderItemId: string) => {
    const next = { ...readyRef.current };
    delete next[orderItemId];
    readyRef.current = next;
    saveReady(next);
    setItems(prev => prev.map(i => i.id === orderItemId ? { ...i, ready: false } : i));
  }, []);

  const summary = useMemo(() => {
    const pending = items.filter(i => !i.ready).length;
    const ready = items.filter(i => i.ready).length;
    const lowStock = products.filter(p => p.is_active && p.stock < 5).length;
    const inactive = products.filter(p => !p.is_active).length;
    return { pending, ready, lowStock, inactive, totalItems: items.length, totalProducts: products.length };
  }, [items, products]);

  return {
    loading,
    error,
    vendorIds,
    products,
    items,
    summary,
    updateProductStock,
    markOrderItemReady,
    undoReady,
    refresh: () => Promise.all([refreshProducts(), refreshLiveItems()]),
  };
}
