import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const STALE_60S = 60_000;
const STALE_2M = 120_000;

export type Banner = {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string;
  placement: string;
  link_url: string | null;
  category_slug: string | null;
  sort_order: number;
};

export type FlashSale = { id: string; ends_at: string; cycle_label: string | null };
export type FlashItem = {
  id: string;
  product_id: string;
  product_name: string | null;
  category: string | null;
  original_price: number;
  discount_pct: number;
  reason: string | null;
  rank: number;
};

/** Banners by placement — cached 60s to handle high traffic. */
export function useBanners(placement: string = "hero") {
  return useQuery({
    queryKey: ["banners", placement],
    staleTime: STALE_60S,
    gcTime: STALE_60S * 5,
    queryFn: async (): Promise<Banner[]> => {
      const nowIso = new Date().toISOString();
      const { data, error } = await (supabase as any)
        .from("banners")
        .select("id,title,subtitle,image_url,placement,link_url,category_slug,sort_order,starts_at,ends_at,is_active")
        .eq("placement", placement)
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return ((data ?? []) as any[]).filter(
        (b) => (!b.starts_at || b.starts_at <= nowIso) && (!b.ends_at || b.ends_at >= nowIso),
      );
    },
  });
}

/** Active flash sale + its products — cached 60s. */
export function useFlashSale() {
  return useQuery({
    queryKey: ["flash-sale-active"],
    staleTime: STALE_60S,
    gcTime: STALE_2M,
    queryFn: async (): Promise<{ sale: FlashSale | null; items: FlashItem[] }> => {
      const { data: sales } = await (supabase as any)
        .from("flash_sales")
        .select("id,ends_at,cycle_label")
        .eq("is_active", true)
        .gt("ends_at", new Date().toISOString())
        .order("starts_at", { ascending: false })
        .limit(1);
      const sale = (sales?.[0] ?? null) as FlashSale | null;
      if (!sale) return { sale: null, items: [] };
      const { data: items } = await (supabase as any)
        .from("flash_sale_products")
        .select("id,product_id,product_name,category,original_price,discount_pct,reason,rank")
        .eq("flash_sale_id", sale.id)
        .order("rank", { ascending: true });
      return { sale, items: (items ?? []) as FlashItem[] };
    },
  });
}
