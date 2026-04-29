import { useEffect, useState } from "react";
import { buyAgainProducts } from "@/lib/buyAgain";
import { supabase } from "@/integrations/supabase/client";
import type { Product } from "@/lib/products";
import { products as allProducts } from "@/lib/products";
import ProductCard from "@/components/ProductCard";
import { History } from "lucide-react";

interface Props {
  pool: Product[];
}

/**
 * Horizontal "اشتريتها سابقاً" rail. Merges localStorage history with the
 * authenticated user's recent order_items (when signed in). Hidden if empty.
 */
const BuyItAgainRail = ({ pool }: Props) => {
  const [items, setItems] = useState<Product[]>(() => buyAgainProducts(pool, 12));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data, error } = await supabase
          .from("order_items")
          .select("product_id, created_at")
          .order("created_at", { ascending: false })
          .limit(30);
        if (error || !data || cancelled) return;
        const ids = Array.from(new Set(data.map((r) => r.product_id)));
        const poolIds = new Set(pool.map((p) => p.id));
        const fromOrders = ids
          .filter((id) => poolIds.has(id))
          .map((id) => allProducts.find((p) => p.id === id))
          .filter((p): p is Product => Boolean(p));
        const local = buyAgainProducts(pool, 12);
        const merged: Product[] = [];
        const seen = new Set<string>();
        for (const p of [...fromOrders, ...local]) {
          if (seen.has(p.id)) continue;
          seen.add(p.id);
          merged.push(p);
          if (merged.length >= 12) break;
        }
        if (merged.length) setItems(merged);
      } catch {
        /* ignore */
      }
    })();
    return () => { cancelled = true; };
  }, [pool]);

  if (items.length === 0) return null;

  return (
    <section className="mb-5">
      <div className="mb-2 flex items-center gap-2 px-1">
        <History className="h-4 w-4 text-primary" strokeWidth={2.4} />
        <h2 className="font-display text-base font-extrabold text-foreground">
          اشتريتها سابقاً
        </h2>
        <span className="text-[10px] text-muted-foreground">· إعادة الطلب بضغطة</span>
      </div>
      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 no-scrollbar">
        {items.map((p) => (
          <div key={`bia-${p.id}`} className="w-[150px] shrink-0">
            <ProductCard product={p} variant="carousel" />
          </div>
        ))}
      </div>
    </section>
  );
};

export default BuyItAgainRail;
